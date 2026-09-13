import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDictionary } from "./get-dictionary";
import { interpolate, lookup, t } from "./t";

const en = getDictionary("en");

describe("t / interpolate / lookup", () => {
  it("resolves nested keys", () => {
    assert.equal(t(en, "nav.open"), "Open");
    assert.equal(t(en, "home.empty"), "No open requests — add one.");
    assert.equal(t(en, "appName"), "Prayer Journal");
  });

  it("interpolates named placeholders including zero", () => {
    assert.equal(t(en, "request.personPrayed", { count: 1 }), "1 person prayed");
    assert.equal(t(en, "request.peoplePrayed", { count: 3 }), "3 people prayed");
    assert.equal(t(en, "answered.answeredOn", { date: "2026-01-02" }), "answered 2026-01-02");
    assert.equal(interpolate("{count} x", { count: 0 }), "0 x");
    assert.equal(interpolate("none {missing} end", { n: 1 }), "none {missing} end");
    assert.equal(interpolate("{a}-{b}", { a: "x", b: "y" }), "x-y");
  });

  it("returns the key when missing or not a string", () => {
    assert.equal(t(en, "does.not.exist"), "does.not.exist");
    assert.equal(t(en, "nav"), "nav");
    assert.equal(t(en, "nav.open.nested"), "nav.open.nested");
    assert.equal(t(en, ""), "");
    assert.equal(lookup(null, "nav.open"), undefined);
    assert.equal(lookup("leaf", "x"), undefined);
    assert.equal(lookup({ a: { b: "c" } }, "a.b"), "c");
    assert.equal(lookup({ a: { b: "c" } }, "a.c"), undefined);
  });

  it("skips interpolation when vars are omitted", () => {
    assert.equal(t(en, "request.peoplePrayed"), "{count} people prayed");
  });
});
