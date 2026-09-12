import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAuthSecret } from "./auth-secret";
import { displayLabel } from "./ids";
import { categoryLabel } from "./labels";
import { shouldClearInviteLinkOnce, inviteLinkOnceClearInit } from "./invite-flash";
import { clientIpFromHeaders, allowMagicLinkRequest, resetMagicLinkThrottleForTests, magicLinkThrottleKey } from "./magic-link-throttle";
import { isMagicLinkVerifyPath, blockedMagicLinkVerifyResponse } from "./magic-link-verify-guard";
import { parseCategory, parseHopeBy } from "./request-fields";
import { formatDate } from "./dateUtils";
import { isStale } from "./staleUtils";
import { CATEGORIES } from "./schema";

describe("branch gaps", () => {
  it("resolveAuthSecret default env arg", () => {
    const prev = process.env.BETTER_AUTH_SECRET;
    process.env.BETTER_AUTH_SECRET = "z".repeat(32);
    try {
      assert.equal(resolveAuthSecret(), "z".repeat(32));
    } finally {
      if (prev === undefined) delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = prev;
    }
  });

  it("displayLabel optional chain branches", () => {
    assert.equal(displayLabel({ email: "a@b.co", displayName: "  Ada  " }), "Ada");
    assert.equal(displayLabel({ email: "a@b.co", displayName: "   ", name: " Bob " }), "Bob");
    assert.equal(displayLabel({ email: "a@b.co", displayName: null, name: null }), "a");
    assert.equal(displayLabel({ email: "a@b.co", displayName: undefined, name: undefined }), "a");
    assert.equal(displayLabel({ email: "a@b.co", displayName: "", name: "" }), "a");
  });

  it("invite flash path prefixes", () => {
    assert.equal(shouldClearInviteLinkOnce("/circle/", true), true);
    assert.equal(shouldClearInviteLinkOnce("/circle", false), false);
    assert.equal(shouldClearInviteLinkOnce("/other", true), false);
    assert.deepEqual(inviteLinkOnceClearInit(true).secure, true);
    assert.deepEqual(inviteLinkOnceClearInit(false).secure, false);
  });

  it("throttle IP and empty email key branches", () => {
    resetMagicLinkThrottleForTests();
    assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": "" })), null);
    assert.equal(magicLinkThrottleKey("", null), "|unknown");
    assert.equal(allowMagicLinkRequest("k", undefined as unknown as number), true);
  });

  it("verify guard non-get and non-verify", () => {
    assert.equal(isMagicLinkVerifyPath("/api/auth/ok"), false);
    assert.equal(isMagicLinkVerifyPath("/api/auth/magic-link/verify"), true);
    assert.equal(blockedMagicLinkVerifyResponse(new Request("http://x/api/auth/ok")), null);
    assert.equal(blockedMagicLinkVerifyResponse(new Request("http://x/api/auth/magic-link/verify"))!.status, 405);
  });

  it("request-fields and misc", () => {
    assert.equal(parseCategory(undefined), null);
    assert.equal(parseHopeBy(undefined), null);
    assert.equal(formatDate(new Date("2020-01-02T00:00:00.000Z")), "2020-01-02");
    assert.equal(isStale(null), false);
    assert.ok(CATEGORIES.other);
    assert.equal(categoryLabel("work_school", null), "Work/School");
  });
});
