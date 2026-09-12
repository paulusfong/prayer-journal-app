import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blockedMagicLinkVerifyResponse,
  isMagicLinkVerifyPath,
} from "./magic-link-verify-guard";

describe("magic-link verify GET guard", () => {
  it("detects Better Auth verify path suffixes", () => {
    assert.equal(isMagicLinkVerifyPath("/api/auth/magic-link/verify"), true);
    assert.equal(isMagicLinkVerifyPath("/api/auth/magic-link/verify/"), false);
    assert.equal(isMagicLinkVerifyPath("/api/auth/get-session"), false);
    assert.equal(isMagicLinkVerifyPath("/api/auth/ok"), false);
  });

  it("returns 405 with no Set-Cookie and empty body for verify GET", async () => {
    const req = new Request("http://localhost:3000/api/auth/magic-link/verify?token=abc");
    const res = blockedMagicLinkVerifyResponse(req);
    assert.ok(res);
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("set-cookie"), null);
    assert.equal(await res.text(), "");
  });

  it("does not block other auth GET paths", () => {
    const req = new Request("http://localhost:3000/api/auth/get-session");
    assert.equal(blockedMagicLinkVerifyResponse(req), null);
  });
});
