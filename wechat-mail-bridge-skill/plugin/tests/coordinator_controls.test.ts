import path from "node:path";
import { describe, expect, it } from "vitest";
import { MockMailAdapter } from "../src/adapters/mail/mock";
import type { BridgeConfig } from "../src/config/schema";
import { JobCoordinator } from "../src/services/coordinator";
import { SQLiteStore } from "../src/state/sqlite";

function testConfig(dbPath: string): BridgeConfig {
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
      queryMode: "direct-api",
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

describe("coordinator controls", () => {
  it("can pause monitoring and ignores events while paused", async () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}-ctl.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, testConfig(dbPath), new MockMailAdapter());

    coordinator.setMonitoringPaused(true);
    const result = await coordinator.ingestEvent({
      eventId: "evt_pause_1",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-1",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "msg-pause-1",
      messageText: "/mail someone@example.com",
      messageTime: "2026-03-09T12:00:00Z",
      observedAt: "2026-03-09T12:00:01Z"
    });

    expect(result.status).toBe("ignored");
    if (result.status === "ignored") {
      expect(result.reason).toBe("monitoring_paused");
    }

    store.close();
  });

  it("rerun-last fails when no previous job exists", async () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}-rerun.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, testConfig(dbPath), new MockMailAdapter());

    const outcome = await coordinator.rerunLastQuery("nobody@example.com");
    expect(outcome.ok).toBe(false);

    store.close();
  });

  it("accepts empty messageId and synthesizes dedupe id", async () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}-synth.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, testConfig(dbPath), new MockMailAdapter());

    const first = await coordinator.ingestEvent({
      eventId: "evt_synth_1",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-1",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "",
      messageText: "/mail someone@example.com",
      messageTime: "2026-03-09T12:00:00Z",
      observedAt: "2026-03-09T12:00:01Z"
    });
    const second = await coordinator.ingestEvent({
      eventId: "evt_synth_2",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-1",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "",
      messageText: "/mail someone@example.com",
      messageTime: "2026-03-09T12:00:00Z",
      observedAt: "2026-03-09T12:00:01Z"
    });

    expect(first.status).toBe("queued");
    expect(second.status).toBe("duplicate");

    store.close();
  });

  it("supports in-group mail-bind set/get/del command flow", async () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}-bind-cmd.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, testConfig(dbPath), new MockMailAdapter());

    const setResult = await coordinator.ingestEvent({
      eventId: "evt_bind_set",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-ops",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "msg-bind-set",
      messageText: "/mail-bind set ops",
      messageTime: "2026-03-09T12:00:00Z",
      observedAt: "2026-03-09T12:00:01Z"
    });
    expect(setResult.status).toBe("queued");
    expect(coordinator.resolveGroupTarget("ops").chatId).toBe("chat-ops");

    const getResult = await coordinator.ingestEvent({
      eventId: "evt_bind_get",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-ops",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "msg-bind-get",
      messageText: "/mail-bind get ops",
      messageTime: "2026-03-09T12:00:02Z",
      observedAt: "2026-03-09T12:00:03Z"
    });
    expect(getResult.status).toBe("queued");

    const delResult = await coordinator.ingestEvent({
      eventId: "evt_bind_del",
      source: "windows-sidecar",
      sidecarId: "winbox-01",
      platform: "wechat-desktop",
      chatType: "group",
      chatId: "chat-ops",
      chatName: "Ops Group",
      senderDisplayName: "Alice",
      messageId: "msg-bind-del",
      messageText: "/mail-bind del ops",
      messageTime: "2026-03-09T12:00:04Z",
      observedAt: "2026-03-09T12:00:05Z"
    });
    expect(delResult.status).toBe("queued");
    expect(coordinator.resolveGroupTarget("ops").chatId).toBe("ops");

    store.close();
  });
});
