import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localizedCategoryLabel } from "./category";
import { getDictionary } from "./get-dictionary";

describe("localizedCategoryLabel", () => {
  const en = getDictionary("en");
  const es = getDictionary("es");

  it("maps known keys via the dictionary", () => {
    assert.equal(localizedCategoryLabel(en, "health", null), "Health");
    assert.equal(localizedCategoryLabel(es, "health", null), "Salud");
    assert.equal(localizedCategoryLabel(en, "family", null), "Family");
    assert.equal(localizedCategoryLabel(en, "work_school", null), "Work/School");
  });

  it("keeps user-authored other text untranslated", () => {
    assert.equal(localizedCategoryLabel(es, "other", "Neighbor"), "Neighbor");
    assert.equal(localizedCategoryLabel(en, "other", "Neighbor"), "Neighbor");
  });

  it("falls back when category data is missing or unknown", () => {
    assert.equal(localizedCategoryLabel(en, null, null), null);
    assert.equal(localizedCategoryLabel(en, "other", null), "Other");
    assert.equal(localizedCategoryLabel(es, "other", ""), "Otro");
    assert.equal(localizedCategoryLabel(en, "unexpected", null), "unexpected");
    assert.equal(localizedCategoryLabel(en, "", null), null);
    assert.equal(localizedCategoryLabel(en, "", "ignored"), null);
  });
});
