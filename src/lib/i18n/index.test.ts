import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installNextMocks, setCookie } from "../../test/next-harness";

installNextMocks();

describe("i18n barrel", async () => {
  const i18n = await import("./index");

  it("re-exports locale helpers, dictionaries, and t", async () => {
    assert.deepEqual([...i18n.LOCALES], ["en", "zh-Hans", "zh-Hant", "es"]);
    assert.equal(i18n.DEFAULT_LOCALE, "en");
    assert.equal(i18n.LOCALE_COOKIE, "pj_locale");
    assert.equal(i18n.LOCALE_MAX_AGE, 60 * 60 * 24 * 365);
    assert.equal(i18n.isLocale("es"), true);
    assert.equal(i18n.parseLocale("nope"), null);
    assert.equal(i18n.safeReturnPath("/profile"), "/profile");
    assert.equal(i18n.pathFromReferer("http://localhost/answered"), "/answered");
    assert.equal(i18n.localeCookieInit(true).httpOnly, false);
    assert.equal(i18n.getDictionary("zh-Hans").appName, "祷告日志");
    assert.equal(i18n.t(i18n.getDictionary("en"), "nav.open"), "Open");
    assert.equal(i18n.interpolate("{n}", { n: 0 }), "0");
    assert.equal(i18n.lookup({ a: { b: 1 } }, "a.b"), 1);
    assert.equal(i18n.localizedCategoryLabel(i18n.getDictionary("es"), "family", null), "Familia");
    assert.equal(await i18n.getRequestLocale(), "en");
    setCookie(i18n.LOCALE_COOKIE, "zh-Hant");
    const pack = await i18n.getRequestDictionary();
    assert.equal(pack.locale, "zh-Hant");
    assert.equal(pack.dict.appName, "禱告日誌");
  });
});
