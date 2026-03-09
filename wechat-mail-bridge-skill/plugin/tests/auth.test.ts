import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { assertAuthenticated } from "../src/security/auth";

function sign(secret: string, timestamp: string, payload: unknown): string {
  const raw = `${timestamp}.${stable(payload)}`;
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

function stable(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stable(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stable(obj[key])}`).join(",")}}`;
}

describe("auth", () => {
  it("accepts bearer token", () => {
    expect(() =>
      assertAuthenticated(
        {
          authorization: "Bearer secret",
          "x-bridge-ts": String(Math.floor(Date.now() / 1000))
        },
        "secret",
        300
      )
    ).not.toThrow();
  });

  it("accepts hmac signature", () => {
    const secret = "secret";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = { b: 2, a: 1 };
    const signature = sign(secret, timestamp, payload);
    expect(() =>
      assertAuthenticated(
        {
          "x-bridge-ts": timestamp,
          "x-bridge-signature": signature
        },
        secret,
        300,
        payload
      )
    ).not.toThrow();
  });

  it("rejects replayed nonce", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const headers = {
      authorization: "Bearer secret",
      "x-bridge-ts": timestamp,
      "x-bridge-nonce": "nonce-1"
    };

    expect(() => assertAuthenticated(headers, "secret", 300)).not.toThrow();
    expect(() => assertAuthenticated(headers, "secret", 300)).toThrowError("replayed_nonce");
  });
});
