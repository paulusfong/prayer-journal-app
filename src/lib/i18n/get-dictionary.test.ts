import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDictionary } from "./get-dictionary";
import { LOCALES } from "./locales";

describe("getDictionary", () => {
  it("returns distinctive chrome per locale", () => {
    assert.equal(getDictionary("en").appName, "Prayer Journal");
    assert.equal(getDictionary("zh-Hans").appName, "祷告日志");
    assert.equal(getDictionary("zh-Hant").appName, "禱告日誌");
    assert.equal(getDictionary("es").appName, "Diario de oración");
    assert.equal(getDictionary("zh-Hans").nav.answered, "已应允");
    assert.equal(getDictionary("zh-Hant").nav.answered, "已應允");
    assert.equal(getDictionary("es").nav.answered, "Respondidas");
    assert.equal(getDictionary("en").nav.signOut, "Sign out");
  });

  it("falls back to English for unknown locales", () => {
    assert.equal(getDictionary("fr").appName, "Prayer Journal");
    assert.equal(getDictionary("").nav.open, "Open");
    assert.equal(getDictionary("zh").categories.health, "Health");
  });

  it("keeps schema category keys with translated labels", () => {
    for (const locale of LOCALES) {
      const cats = getDictionary(locale).categories;
      assert.ok(cats.health);
      assert.ok(cats.family);
      assert.ok(cats.work_school);
      assert.ok(cats.church_ministry);
      assert.ok(cats.friends);
      assert.ok(cats.other);
    }
    assert.equal(getDictionary("en").categories.health, "Health");
    assert.equal(getDictionary("es").categories.health, "Salud");
    assert.notEqual(getDictionary("zh-Hans").categories.other, getDictionary("en").categories.other);
  });
});
