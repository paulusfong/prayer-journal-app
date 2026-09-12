import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inviteTokenFromCookieHeader } from "./auth-gate";

describe("inviteTokenFromCookieHeader decode", () => {
  it("returns raw segment when decodeURIComponent throws", () => {
    // Lone % is invalid URI sequence → catch path returns match[1]
    const raw = "invite_token=%E0%A4%A";
    assert.equal(inviteTokenFromCookieHeader(raw), "%E0%A4%A");
  });

  it("returns null when cookie header missing token", () => {
    assert.equal(inviteTokenFromCookieHeader(null), null);
    assert.equal(inviteTokenFromCookieHeader(undefined), null);
    assert.equal(inviteTokenFromCookieHeader("other=1"), null);
  });

  it("decodes a normal token", () => {
    assert.equal(inviteTokenFromCookieHeader("invite_token=ab%2Fcd"), "ab/cd");
  });
});
