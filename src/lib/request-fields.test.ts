import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCategory, parseHopeBy } from "./request-fields";

describe("parseCategory", () => {
  it("accepts empty as null and known CATEGORIES keys", () => {
    assert.equal(parseCategory(undefined), null);
    assert.equal(parseCategory(""), null);
    assert.equal(parseCategory("health"), "health");
    assert.equal(parseCategory("other"), "other");
    assert.equal(parseCategory("work_school"), "work_school");
  });

  it("rejects unknown categories", () => {
    assert.throws(() => parseCategory("unexpected"), /Invalid category/);
    assert.throws(() => parseCategory("HEALTH"), /Invalid category/);
    assert.throws(() => parseCategory("__proto__"), /Invalid category/);
  });
});

describe("parseHopeBy", () => {
  it("accepts empty as null and valid YYYY-MM-DD", () => {
    assert.equal(parseHopeBy(undefined), null);
    assert.equal(parseHopeBy(""), null);
    assert.equal(parseHopeBy("2026-09-12"), "2026-09-12");
    assert.equal(parseHopeBy("2024-02-29"), "2024-02-29");
  });

  it("rejects non-ISO shapes and impossible calendar dates", () => {
    assert.throws(() => parseHopeBy("09/12/2026"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2026-9-12"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2026-09-12T00:00:00Z"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("not-a-date"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2025-02-29"), /Invalid hope-by/);
    assert.throws(() => parseHopeBy("2026-13-01"), /Invalid hope-by/);
  });
});
