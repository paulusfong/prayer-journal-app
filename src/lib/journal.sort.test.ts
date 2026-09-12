import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareAnsweredRequestRows, compareOpenRequestRows } from "./journal";

const row = (hopeBy: string | null, createdAt: string, answeredAt?: string | null) => ({
  request: {
    hopeBy,
    createdAt: new Date(createdAt),
    answeredAt: answeredAt === undefined || answeredAt === null ? null : new Date(answeredAt),
  },
});

describe("compareOpenRequestRows", () => {
  it("orders by hopeBy asc, nulls last, then createdAt desc", () => {
    const a = row("2099-01-02", "2020-01-01T00:00:00Z");
    const b = row("2099-01-01", "2020-01-01T00:00:00Z");
    assert.ok(compareOpenRequestRows(b, a) < 0);

    const withHope = row("2099-01-01", "2020-01-01T00:00:00Z");
    const noHope = row(null, "2020-01-02T00:00:00Z");
    assert.equal(compareOpenRequestRows(withHope, noHope), -1);
    assert.equal(compareOpenRequestRows(noHope, withHope), 1);

    const older = row(null, "2020-01-01T00:00:00Z");
    const newer = row(null, "2020-01-02T00:00:00Z");
    assert.ok(compareOpenRequestRows(newer, older) < 0);
    // Kills `ha && !hb` → `ha || !hb`: both-null must use createdAt, not return -1.
    assert.ok(compareOpenRequestRows(older, newer) > 0);

    const hOld = row("2099-06-01", "2020-01-01T00:00:00Z");
    const hNew = row("2099-06-01", "2020-01-02T00:00:00Z");
    assert.ok(compareOpenRequestRows(hNew, hOld) < 0);
  });
});

describe("compareAnsweredRequestRows", () => {
  it("orders by answeredAt desc", () => {
    const older = row(null, "2020-01-01Z", "2021-01-01T00:00:00Z");
    const newer = row(null, "2020-01-01Z", "2021-01-02T00:00:00Z");
    assert.ok(compareAnsweredRequestRows(newer, older) < 0);
    const missing = row(null, "2020-01-01Z", null);
    assert.ok(compareAnsweredRequestRows(newer, missing) < 0);
  });
});
