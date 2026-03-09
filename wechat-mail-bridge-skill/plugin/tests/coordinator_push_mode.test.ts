import path from "node:path";
import { describe, expect, it } from "vitest";
import { MockMailAdapter } from "../src/adapters/mail/mock";
import type { BridgeConfig } from "../src/config/schema";
import { JobCoordinator } from "../src/services/coordinator";
import { SQLiteStore } from "../src/state/sqlite";

function configForPush(dbPath: string): BridgeConfig {
  return {
    server: {
      host: "127.0.0.1",
      port: 8787
    },
    bridge: {
      sharedSecret: "secret",
      authWindowSec: 300,
      sqlitePath: dbPath,
      sweepIntervalSec: 5,
      staleClaimSec: 120,
      dedupeRetentionHours: 72,
      jobRetentionHours: 168,
      sidecarStaleSec: 60
    },
    wechat: {
      allowGroups: [],
      triggerPrefixes: ["/mail", "查邮箱", "/watch", "监控"],
      passiveSingleEmailMode: false,
      defaultWaitTimeoutSec: 120
    },
    mail: {
      backend: "mock",
      queryMode: "push-webhook",
      preferPushWebhook: true,
      bhmailerApiBase: "",
      uid: "",
      sign: "",
      webhookSecret: "",
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

describe("coordinator push webhook mode", () => {
  it("creates watch on /watch and consumes webhook", async () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, configForPush(dbPath), new MockMailAdapter());

    const ingest = await coordinator.ingestEvent({
      eventId: "evt_test_1",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-1",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "msg-1",
      messageText: "/watch someone@example.com 300",
      messageTime: "2026-03-09T12:00:00Z",
      observedAt: "2026-03-09T12:00:01Z"
    });

    expect(ingest.status).toBe("queued");

    const webhook = await coordinator.ingestWebhook({
      matchedEmail: "someone@example.com",
      subject: "Verification",
      from: "no-reply@example.com",
      bodyPreview: "Code: 123456",
      receivedAt: "2026-03-09T12:00:15Z"
    });

    expect(webhook.accepted).toBe(true);
    expect((webhook.commandIds ?? []).length).toBeGreaterThanOrEqual(1);

    store.close();
  });
});
