import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStale } from "./staleUtils";

describe("isStale", () => {
  it("returns false for null hopeBy", () => {
    assert.equal(isStale(null), false);
  });

  it("returns false for empty string", () => {
    assert.equal(isStale(""), false);
  });

  it("returns false for future date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // one week ahead
    assert.equal(isStale(future.toISOString()), false);
  });

  it("returns true for past date", () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // one week ago
    assert.equal(isStale(past.toISOString()), true);
  });

  it("returns true for yesterday", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    assert.equal(isStale(yesterday.toISOString()), true);
  });

  it("returns false for today (midnight)", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    assert.equal(isStale(today.toISOString()), false);
  });
});
