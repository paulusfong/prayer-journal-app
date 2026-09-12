import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INVITE_LINK_ONCE_COOKIE,
  inviteLinkOnceClearInit,
  shouldClearInviteLinkOnce,
} from "./invite-flash";

describe("invite flash cookie", () => {
  it("names the one-time invite cookie", () => {
    assert.equal(INVITE_LINK_ONCE_COOKIE, "invite_link_once");
  });

  it("clears only on circle routes when the cookie is present", () => {
    assert.equal(shouldClearInviteLinkOnce("/circle", true), true);
    assert.equal(shouldClearInviteLinkOnce("/circle/", true), true);
    assert.equal(shouldClearInviteLinkOnce("/circle", false), false);
    assert.equal(shouldClearInviteLinkOnce("/", true), false);
    assert.equal(shouldClearInviteLinkOnce("/sign-in", true), false);
  });

  it("expires the cookie immediately with matching security flags", () => {
    assert.deepEqual(inviteLinkOnceClearInit(true), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0,
    });
    assert.equal(inviteLinkOnceClearInit(false).secure, false);
    assert.equal(inviteLinkOnceClearInit(false).maxAge, 0);
  });
});
