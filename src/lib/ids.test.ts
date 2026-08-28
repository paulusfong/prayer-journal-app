import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { digest, displayLabel, inviteToken } from "./ids";

describe("ids", () => {
  it("hashes invite tokens deterministically", () => {
    const a = digest("abc");
    const b = digest("abc");
    const c = digest("abd");

    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 64);
  });

  it("generates url-safe invite tokens", () => {
    const token = inviteToken();

    assert.equal(token.length, 43);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
  });

  it("uses the first available display label", () => {
    assert.equal(displayLabel({ displayName: "  Ada  ", name: "Grace", email: "ada@example.com" }), "Ada");
    assert.equal(displayLabel({ displayName: " ", name: "  Grace  ", email: "ada@example.com" }), "Grace");
    assert.equal(displayLabel({ displayName: null, name: null, email: "ada@example.com" }), "ada");
  });
});
