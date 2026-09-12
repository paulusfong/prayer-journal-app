import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, before, describe, it } from "node:test";
import {
  MAGIC_LINK_THROTTLE_MAX,
  MAGIC_LINK_THROTTLE_WINDOW_MS,
  allowMagicLinkRequest,
  clientIpFromHeaders,
  magicLinkThrottleKey,
  resetMagicLinkThrottleForTests,
} from "./magic-link-throttle";
import { inviteTokenFromCookieHeader, canRequestMagicLink } from "./auth-gate";
import { shouldClearInviteLinkOnce } from "./invite-flash";
import { blockedMagicLinkVerifyResponse } from "./magic-link-verify-guard";
import { parseCategory, parseHopeBy } from "./request-fields";
import { sendMail } from "./mail";

describe("mutation kills — pure helpers", () => {
  afterEach(() => resetMagicLinkThrottleForTests());

  it("auth-gate cookie regex allows multi-space after semicolon", () => {
    assert.equal(inviteTokenFromCookieHeader("a=1;  invite_token=tok"), "tok");
    assert.equal(inviteTokenFromCookieHeader("invite_token=abc"), "abc");
  });


  it("invite-flash startsWith /circle/ not endsWith", () => {
    assert.equal(shouldClearInviteLinkOnce("/circle/settings", true), true);
    assert.equal(shouldClearInviteLinkOnce("/x/circle/", true), false);
  });

  it("verify guard Allow header is POST", () => {
    const res = blockedMagicLinkVerifyResponse(
      new Request("http://x/api/auth/magic-link/verify"),
    )!;
    assert.equal(res.headers.get("Allow"), "POST");
  });

  it("throttle window constant and empty-email key blocked", () => {
    assert.equal(MAGIC_LINK_THROTTLE_WINDOW_MS, 3 * 60 * 1000);
    assert.equal(allowMagicLinkRequest(""), false);
    assert.equal(allowMagicLinkRequest("|unknown"), false);
    assert.equal(allowMagicLinkRequest("a|1"), true);
  });

  it("throttle reset clears hits", () => {
    const key = magicLinkThrottleKey("r@ex.com", "1.1.1.1");
    for (let i = 0; i < MAGIC_LINK_THROTTLE_MAX; i++) assert.equal(allowMagicLinkRequest(key, 1000), true);
    assert.equal(allowMagicLinkRequest(key, 1001), false);
    resetMagicLinkThrottleForTests();
    assert.equal(allowMagicLinkRequest(key, 1002), true);
  });

  it("throttle filter uses strict > cutoff (not >=)", () => {
    const key = magicLinkThrottleKey("w@ex.com", "2.2.2.2");
    const t0 = 10_000;
    assert.equal(allowMagicLinkRequest(key, t0), true);
    // At exactly window boundary, hit at t0 is NOT > cutoff (t0+WINDOW - WINDOW = t0), so filtered out with >
    // With >= mutant, hit at t0 survives filter incorrectly? cutoff = now - WINDOW; filter t > cutoff.
    // At now = t0 + WINDOW, cutoff = t0; t0 > t0 is false, so hit dropped. With >=, t0 >= t0 kept.
    for (let i = 1; i < MAGIC_LINK_THROTTLE_MAX; i++) assert.equal(allowMagicLinkRequest(key, t0), true);
    assert.equal(allowMagicLinkRequest(key, t0), false);
    assert.equal(allowMagicLinkRequest(key, t0 + MAGIC_LINK_THROTTLE_WINDOW_MS), true);
  });

  it("clientIp trims forwarded and real-ip", () => {
    assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": "  8.8.8.8 , 1.1.1.1" })), "8.8.8.8");
    assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "  9.9.9.9  " })), "9.9.9.9");
  });

  it("hopeBy regex is anchored and calendar checks are OR", () => {
    assert.throws(() => parseHopeBy("2020-01-01x"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("x2020-01-01"), /Invalid hope-by/);
    assert.equal(parseHopeBy(" 2020-01-01 "), "2020-01-01");
    assert.throws(() => parseHopeBy("2020-02-30"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2020-13-01"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2020-00-01"), /Invalid hope-by/);
    assert.equal(parseCategory("  health  "), "health");
  });

  it("sendMail uses FROM default and Resend payload shape", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url, init) => {
      calls.push({ url: String(url), init: init || {} });
      return new Response("{}", { status: 500 }); // also hit !res.ok log path with true always? still returns
    }) as typeof fetch;
    const errors: unknown[] = [];
    const ce = console.error;
    console.error = (...a: unknown[]) => errors.push(a);
    try {
      await sendMail("a@b.co", "S", "T", {
        RESEND_API_KEY: "k",
        NODE_ENV: "production",
        MAIL_FROM: undefined,
      } as NodeJS.ProcessEnv);
    } finally {
      globalThis.fetch = orig;
      console.error = ce;
    }
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.init.method, "POST");
    const headers = calls[0]!.init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], "application/json");
    const body = JSON.parse(String(calls[0]!.init.body));
    assert.equal(body.to, "a@b.co");
    assert.equal(body.subject, "S");
    assert.equal(body.text, "T");
    assert.match(body.from, /Prayer Journal/);
    assert.ok(errors.length >= 1);
  });
});

describe("mutation kills — round 2", () => {
  afterEach(() => resetMagicLinkThrottleForTests());

  it("xff empty hop falls through to real-ip (not return empty)", () => {
    assert.equal(
      clientIpFromHeaders(
        new Headers({ "x-forwarded-for": "  , 1.1.1.1", "x-real-ip": "9.9.9.9" }),
      ),
      "9.9.9.9",
    );
    // leading empty segment: split[0] is "" 
    assert.equal(
      clientIpFromHeaders(new Headers({ "x-forwarded-for": ",8.8.8.8", "x-real-ip": "7.7.7.7" })),
      "7.7.7.7",
    );
  });

  it("hopeBy anchors reject prefix/suffix junk", () => {
    assert.throws(() => parseHopeBy("2020-01-01extra"), /Invalid/);
    assert.throws(() => parseHopeBy("pre2020-01-01"), /Invalid/);
  });

  it("calendar OR cannot become AND for overflow months", () => {
    // 2020-13-01 → Jan 1 2021: year+month fail, day ok. With && chain including day, may accept.
    assert.throws(() => parseHopeBy("2020-13-01"), /Invalid/);
    assert.throws(() => parseHopeBy("2020-02-30"), /Invalid/);
  });

  it("Resend ok path does not error-log", async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    const errors: unknown[] = [];
    const ce = console.error;
    console.error = (...a: unknown[]) => errors.push(a);
    try {
      await sendMail("a@b.co", "S", "T", { RESEND_API_KEY: "k", NODE_ENV: "production" });
    } finally {
      globalThis.fetch = orig;
      console.error = ce;
    }
    assert.equal(errors.length, 0);
  });
});
