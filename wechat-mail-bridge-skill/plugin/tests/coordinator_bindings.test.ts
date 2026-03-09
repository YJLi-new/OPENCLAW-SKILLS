import path from "node:path";
import { describe, expect, it } from "vitest";
import { MockMailAdapter } from "../src/adapters/mail/mock";
import type { BridgeConfig } from "../src/config/schema";
import { JobCoordinator } from "../src/services/coordinator";
import { SQLiteStore } from "../src/state/sqlite";

function cfg(dbPath: string): BridgeConfig {
  return {
    server: { host: "127.0.0.1", port: 8787 },
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

describe("group bindings", () => {
  it("sets, lists, resolves and deletes binding", () => {
    const dbPath = path.resolve(process.cwd(), "state", `test-${Date.now()}-${Math.random()}-bind.db`);
    const store = new SQLiteStore(dbPath);
    const coordinator = new JobCoordinator(store, cfg(dbPath), new MockMailAdapter());

    coordinator.setGroupBinding("ops", "chat-ops-id", "Ops Group");
    const list = coordinator.listGroupBindings(10);
    expect(list.length).toBe(1);
    expect(list[0].alias).toBe("ops");

    const resolved = coordinator.resolveGroupTarget("ops");
    expect(resolved.chatId).toBe("chat-ops-id");

    const deleted = coordinator.deleteGroupBinding("ops");
    expect(deleted).toBe(true);

    store.close();
  });
});
