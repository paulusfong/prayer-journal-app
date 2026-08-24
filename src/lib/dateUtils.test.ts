import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate } from "./dateUtils";

describe("formatDate", () => {
  it("formats date as YYYY-MM-DD", () => {
    const date = new Date(Date.UTC(2026, 7, 24, 12, 0, 0)); // August 24, 2026
    assert.equal(formatDate(date), "2026-08-24");
  });
});
