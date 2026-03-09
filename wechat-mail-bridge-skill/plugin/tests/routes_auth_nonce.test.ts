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

function sampleEvent(messageId: string) {
  return {
    eventId: `evt_${randomUUID()}`,
    source: "windows-sidecar",
    sidecarId: "winbox-01",
    platform: "wechat-desktop",
    chatType: "group",
    chatId: "chat-1",
    chatName: "Ops Group",
    senderDisplayName: "alice",
    messageId,
    messageText: "noop",
    messageTime: new Date().toISOString(),
    observedAt: new Date().toISOString()
  };
}

describe("route auth nonce replay", () => {
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

  it("rejects replayed nonce on sidecar ingest route", async () => {
    const secret = `secret_${randomUUID()}`;
    sqlitePath = path.join(os.tmpdir(), `wxmail_nonce_${randomUUID()}.db`);
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

    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = `nonce_${randomUUID()}`;
    const headers = {
      authorization: `Bearer ${secret}`,
      "x-bridge-ts": ts,
      "x-bridge-nonce": nonce
    };

    const first = await app.inject({
      method: "GET",
      url: "/api/v1/admin/monitoring/status",
      headers
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "GET",
      url: "/api/v1/admin/monitoring/status",
      headers
    });
    expect(second.statusCode).toBe(401);
    expect(second.json()).toEqual({
      ok: false,
      error: "replayed_nonce"
    });
  }, 15000);

  it("allows repeated bearer requests when nonce is omitted", async () => {
    const secret = `secret_${randomUUID()}`;
    sqlitePath = path.join(os.tmpdir(), `wxmail_nonce_${randomUUID()}.db`);
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

    const ts = String(Math.floor(Date.now() / 1000));
    const headers = {
      authorization: `Bearer ${secret}`,
      "x-bridge-ts": ts
    };

    const first = await app.inject({
      method: "POST",
      url: "/api/v1/sidecar/events",
      headers,
      payload: sampleEvent("msg-3")
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "POST",
      url: "/api/v1/sidecar/events",
      headers,
      payload: sampleEvent("msg-4")
    });
    expect(second.statusCode).toBe(200);
  }, 15000);
});
