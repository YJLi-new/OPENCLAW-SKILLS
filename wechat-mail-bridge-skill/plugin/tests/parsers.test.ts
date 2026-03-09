import { describe, expect, it } from "vitest";
import { formatMailReply } from "../src/formatters/reply";
import { parseTrigger } from "../src/parsers/trigger";

describe("parseTrigger", () => {
  const options = {
    triggerPrefixes: ["/mail", "查邮箱", "/watch", "/mail-watch", "监控"],
    passiveSingleEmailMode: false,
    defaultWaitTimeoutSec: 120
  };

  it("parses find latest command", () => {
    const parsed = parseTrigger("/mail user@example.com", options);
    expect(parsed.kind).toBe("findLatest");
    if (parsed.kind === "findLatest") {
      expect(parsed.email).toBe("user@example.com");
    }
  });

  it("parses watch command with timeout", () => {
    const parsed = parseTrigger("/watch user@example.com 300", options);
    expect(parsed.kind).toBe("waitForNew");
    if (parsed.kind === "waitForNew") {
      expect(parsed.email).toBe("user@example.com");
      expect(parsed.timeoutSec).toBe(300);
    }
  });

  it("parses /mail-watch alias with timeout", () => {
    const parsed = parseTrigger("/mail-watch user@example.com 180", options);
    expect(parsed.kind).toBe("waitForNew");
    if (parsed.kind === "waitForNew") {
      expect(parsed.timeoutSec).toBe(180);
    }
  });

  it("requests clarification for multiple emails", () => {
    const parsed = parseTrigger("/mail a@example.com b@example.com", options);
    expect(parsed.kind).toBe("clarify");
  });
});

describe("formatMailReply", () => {
  it("formats found reply", () => {
    const text = formatMailReply(
      "user@example.com",
      {
        found: true,
        mode: "findLatest",
        matchedEmail: "user@example.com",
        subject: "Verification",
        from: "no-reply@example.com",
        receivedAt: "2026-03-09T12:00:15Z",
        bodyPreview: "Your code is 123456",
        extractedFields: { code: "123456" },
        rawProvider: "mock"
      },
      {
        maxBodyPreviewChars: 400,
        includeSubject: true,
        includeFrom: true,
        includeReceivedAt: true
      }
    );

    expect(text).toContain("已找到最新邮件");
    expect(text).toContain("验证码：123456");
  });
});
