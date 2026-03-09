import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { BridgeConfig } from "../src/config/schema";
import { MockMailAdapter } from "../src/adapters/mail/mock";
import { registerRoutes } from "../src/routes/register";
import { JobCoordinator } from "../src/services/coordinator";
import { SQLiteStore } from "../src/state/sqlite";

function buildConfig(secret: string, sqlitePath: string): BridgeConfig {
  return {
    server: {
      host: "127.0.0.1",
      port: 0
    },
    bridge: {
      sharedSecret: secret,
      authWindowSec: 300,
      sqlitePath,
      sweepIntervalSec: 60,
      staleClaimSec: 120,
      dedupeRetentionHours: 72,
      jobRetentionHours: 24,
      sidecarStaleSec: 60
    },
    wechat: {
      allowGroups: [],
      triggerPrefixes: ["/mail", "/watch", "/mail-watch", "查邮箱", "监控"],
      passiveSingleEmailMode: false,
      defaultWaitTimeoutSec: 120
    },
    mail: {
      backend: "mock",
      queryMode: "direct-api",
      preferPushWebhook: true,
      bhmailerApiBase: "",
      uid: "",
      sign: "",
      webhookSecret: undefined,
      defaultTimeoutSec: 20,
      extractionProfile: "default"
    },
    reply: {
      maxBodyPreviewChars: 400,
      includeSubject: true,
      includeFrom: true,
      includeReceivedAt: true
    },
    privacy: {
      redactEmailsInLogs: true,
      storeRawWechatText: true,
      storeRawMailBody: false
    }
  };
}

function authHeaders(secret: string): Record<string, string> {
  return {
    authorization: `Bearer ${secret}`,
    "x-bridge-ts": String(Math.floor(Date.now() / 1000)),
    "x-bridge-nonce": `nonce_${randomUUID()}`
  };
}

function sampleWatchEvent() {
  return {
    eventId: `evt_${randomUUID()}`,
    source: "windows-sidecar",
    sidecarId: "winbox-01",
    platform: "wechat-desktop",
    chatType: "group",
    chatId: "chat-1",
    chatName: "Ops Group",
    senderDisplayName: "alice",
    messageId: `msg_${randomUUID()}`,
    messageText: "/watch someone@example.com 60",
    messageTime: new Date().toISOString(),
    observedAt: new Date().toISOString()
  };
}

describe("route push-webhook roundtrip flow", () => {
  let app: ReturnType<typeof Fastify> | null = null;
  let store: SQLiteStore | null = null;
  let sqlitePath: string | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    if (store) {
      store.close();
      store = null;
    }
    if (sqlitePath && fs.existsSync(sqlitePath)) {
      fs.rmSync(sqlitePath, { force: true });
      sqlitePath = null;
    }
  });

  it("processes watch -> webhook -> claim -> ack and closes active watch", async () => {
    const secret = `secret_${randomUUID()}`;
    sqlitePath = path.join(os.tmpdir(), `wxmail_push_roundtrip_${randomUUID()}.db`);
    store = new SQLiteStore(sqlitePath);

    const config = buildConfig(secret, sqlitePath);
    const mailAdapter = new MockMailAdapter();
    const coordinator = new JobCoordinator(store, config, mailAdapter);
    app = Fastify();
    await registerRoutes(app, {
      config,
      store,
      coordinator,
      mailAdapter
    });

    const ingest = await app.inject({
      method: "POST",
      url: "/api/v1/sidecar/events",
      headers: authHeaders(secret),
      payload: sampleWatchEvent()
    });
    expect(ingest.statusCode).toBe(200);
    const ingestBody = ingest.json() as {
      ok: boolean;
      result: { status: string; jobId: string; commandId: string };
    };
    expect(ingestBody.ok).toBe(true);
    expect(ingestBody.result.status).toBe("queued");

    const claim1 = await app.inject({
      method: "POST",
      url: "/api/v1/sidecar/commands/claim",
      headers: authHeaders(secret),
      payload: {
        sidecarId: "winbox-01",
        limit: 5
      }
    });
    expect(claim1.statusCode).toBe(200);
    const claim1Body = claim1.json() as {
      ok: boolean;
      commands: Array<{ commandId: string }>;
    };
    expect(claim1Body.ok).toBe(true);
    expect(claim1Body.commands.some((c) => c.commandId === ingestBody.result.commandId)).toBe(true);

    const ack1 = await app.inject({
      method: "POST",
      url: `/api/v1/sidecar/commands/${ingestBody.result.commandId}/ack`,
      headers: authHeaders(secret),
      payload: {
        sidecarId: "winbox-01",
        status: "sent"
      }
    });
    expect(ack1.statusCode).toBe(200);

    const webhook = await app.inject({
      method: "POST",
      url: "/api/v1/bhmailer/webhook",
      headers: authHeaders(secret),
      payload: {
        matchedEmail: "someone@example.com",
        subject: "OTP code",
        from: "no-reply@example.com",
        receivedAt: new Date().toISOString(),
        bodyPreview: "Your verification code is 123456",
        extractedFields: { code: "123456" }
      }
    });
    expect(webhook.statusCode).toBe(200);
    const webhookBody = webhook.json() as {
      ok: boolean;
      accepted: boolean;
      commandIds?: string[];
    };
    expect(webhookBody.ok).toBe(true);
    expect(webhookBody.accepted).toBe(true);
    expect((webhookBody.commandIds ?? []).length).toBeGreaterThan(0);
    const webhookCommandId = (webhookBody.commandIds ?? [])[0];
    expect(Boolean(webhookCommandId)).toBe(true);

    const claim2 = await app.inject({
      method: "POST",
      url: "/api/v1/sidecar/commands/claim",
      headers: authHeaders(secret),
      payload: {
        sidecarId: "winbox-01",
        limit: 5
      }
    });
    expect(claim2.statusCode).toBe(200);
    const claim2Body = claim2.json() as {
      ok: boolean;
      commands: Array<{ commandId: string }>;
    };
    expect(claim2Body.ok).toBe(true);
    expect(claim2Body.commands.some((c) => c.commandId === webhookCommandId)).toBe(true);

    const ack2 = await app.inject({
      method: "POST",
      url: `/api/v1/sidecar/commands/${webhookCommandId}/ack`,
      headers: authHeaders(secret),
      payload: {
        sidecarId: "winbox-01",
        status: "sent"
      }
    });
    expect(ack2.statusCode).toBe(200);

    const watches = await app.inject({
      method: "POST",
      url: "/api/v1/admin/watch/list",
      headers: authHeaders(secret),
      payload: { limit: 20 }
    });
    expect(watches.statusCode).toBe(200);
    const watchesBody = watches.json() as { ok: boolean; watches: Array<{ jobId: string }> };
    expect(watchesBody.ok).toBe(true);
    expect(watchesBody.watches.some((w) => w.jobId === ingestBody.result.jobId)).toBe(false);

    const jobs = await app.inject({
      method: "POST",
      url: "/api/v1/admin/jobs/list",
      headers: authHeaders(secret),
      payload: { limit: 20 }
    });
    expect(jobs.statusCode).toBe(200);
    const jobsBody = jobs.json() as {
      ok: boolean;
      jobs: Array<{ jobId: string; status: string }>;
    };
    expect(jobsBody.ok).toBe(true);
    expect(jobsBody.jobs.some((j) => j.jobId === ingestBody.result.jobId && j.status === "COMPLETED")).toBe(true);
  }, 20000);
});
