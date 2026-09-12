import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categoryLabel } from "./labels";

describe("categoryLabel", () => {
  it("uses built-in labels for known categories", () => {
    assert.equal(categoryLabel("health", null), "Health");
    assert.equal(categoryLabel("family", null), "Family");
  });

  it("uses custom text for other category", () => {
    assert.equal(categoryLabel("other", "Neighbor"), "Neighbor");
  });

  it("falls back when category data is missing or unknown", () => {
    assert.equal(categoryLabel(null, null), null);
    assert.equal(categoryLabel("other", null), "Other");
    assert.equal(categoryLabel("other", ""), "Other");
    assert.equal(categoryLabel("unexpected", null), "unexpected");
  });

  it("treats empty string category as missing (falsy guard)", () => {
    // Distinguishes `if (!category)` from `if (category === null)` / `== null`.
    assert.equal(categoryLabel("", null), null);
    assert.equal(categoryLabel("", "ignored"), null);
  });
});
