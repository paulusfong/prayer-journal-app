import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { sendMail } from "./mail";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("sendMail Resend path", () => {
  it("posts to Resend when API key is set (ok)", async () => {
    const calls: unknown[] = [];
    globalThis.fetch = (async (url, init) => {
      calls.push({ url, init });
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    await sendMail("a@b.co", "Sub", "Text", { RESEND_API_KEY: "rk_test", NODE_ENV: "production" });
    assert.equal(calls.length, 1);
    const c = calls[0] as { url: string; init: RequestInit };
    assert.equal(c.url, "https://api.resend.com/emails");
    assert.equal((c.init.headers as Record<string, string>).Authorization, "Bearer rk_test");
  });

  it("logs when Resend returns non-OK", async () => {
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    const errors: unknown[] = [];
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };
    try {
      await sendMail("a@b.co", "Sub", "Text", { RESEND_API_KEY: "rk_test", NODE_ENV: "test" });
    } finally {
      console.error = orig;
    }
    assert.ok(errors.some((e) => String((e as unknown[])[0]).includes("Resend failed")));
  });
});
