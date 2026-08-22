import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { digest } from "./ids";
import { categoryLabel } from "./labels";

describe("ids", () => {
  it("hashes invite tokens", () => {
    const a = digest("abc");
    const b = digest("abc");
    const c = digest("abd");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 64);
  });
});

describe("categoryLabel", () => {
  it("uses other text", () => {
    assert.equal(categoryLabel("health", null), "Health");
    assert.equal(categoryLabel("other", "Neighbor"), "Neighbor");
    assert.equal(categoryLabel(null, null), null);
  });
});
