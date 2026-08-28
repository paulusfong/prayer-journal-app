import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categoryLabel } from "./labels";

describe("categoryLabel", () => {
  it("uses built-in labels for known categories", () => {
    assert.equal(categoryLabel("health", null), "Health");
  });

  it("uses custom text for other category", () => {
    assert.equal(categoryLabel("other", "Neighbor"), "Neighbor");
  });

  it("falls back when category data is missing or unknown", () => {
    assert.equal(categoryLabel(null, null), null);
    assert.equal(categoryLabel("other", null), "Other");
    assert.equal(categoryLabel("unexpected", null), "unexpected");
  });
});
