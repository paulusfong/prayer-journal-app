import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  MAGIC_LINK_THROTTLE_MAX,
  MAGIC_LINK_THROTTLE_WINDOW_MS,
  allowMagicLinkRequest,
  clientIpFromHeaders,
  magicLinkThrottleKey,
  resetMagicLinkThrottleForTests,
} from "./magic-link-throttle";

afterEach(() => {
  resetMagicLinkThrottleForTests();
});

describe("magicLinkThrottleKey", () => {
  it("normalizes email and falls back IP", () => {
    assert.equal(magicLinkThrottleKey("  A@B.Co ", "1.2.3.4"), "a@b.co|1.2.3.4");
    assert.equal(magicLinkThrottleKey("a@b.co", null), "a@b.co|unknown");
    assert.equal(magicLinkThrottleKey("a@b.co", "  "), "a@b.co|unknown");
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers first x-forwarded-for hop", () => {
    const h = new Headers({
      "x-forwarded-for": " 9.9.9.9, 8.8.8.8 ",
      "x-real-ip": "7.7.7.7",
    });
    assert.equal(clientIpFromHeaders(h), "9.9.9.9");
  });

  it("falls back to x-real-ip", () => {
    assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "7.7.7.7" })), "7.7.7.7");
    assert.equal(clientIpFromHeaders(new Headers()), null);
  });
});

describe("allowMagicLinkRequest", () => {
  it(`allows ${MAGIC_LINK_THROTTLE_MAX} within the window then blocks`, () => {
    const key = magicLinkThrottleKey("user@example.com", "1.1.1.1");
    const t0 = 1_000_000;
    for (let i = 0; i < MAGIC_LINK_THROTTLE_MAX; i++) {
      assert.equal(allowMagicLinkRequest(key, t0 + i), true);
    }
    assert.equal(allowMagicLinkRequest(key, t0 + MAGIC_LINK_THROTTLE_MAX), false);
  });

  it("resets after the window elapses", () => {
    const key = magicLinkThrottleKey("user@example.com", "2.2.2.2");
    const t0 = 2_000_000;
    for (let i = 0; i < MAGIC_LINK_THROTTLE_MAX; i++) {
      assert.equal(allowMagicLinkRequest(key, t0), true);
    }
    assert.equal(allowMagicLinkRequest(key, t0 + 1), false);
    assert.equal(allowMagicLinkRequest(key, t0 + MAGIC_LINK_THROTTLE_WINDOW_MS + 1), true);
  });

  it("isolates keys by email+IP", () => {
    const a = magicLinkThrottleKey("a@example.com", "1.1.1.1");
    const b = magicLinkThrottleKey("a@example.com", "2.2.2.2");
    const t0 = 3_000_000;
    for (let i = 0; i < MAGIC_LINK_THROTTLE_MAX; i++) {
      assert.equal(allowMagicLinkRequest(a, t0), true);
    }
    assert.equal(allowMagicLinkRequest(a, t0 + 1), false);
    assert.equal(allowMagicLinkRequest(b, t0 + 1), true);
  });
});
