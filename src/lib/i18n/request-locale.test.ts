import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { installNextMocks, resetHarness, setCookie } from "../../test/next-harness";

installNextMocks();

describe("getRequestLocale", async () => {
  const { getRequestDictionary, getRequestLocale } = await import("./request-locale");
  const { LOCALE_COOKIE } = await import("./locales");

  beforeEach(() => {
    resetHarness();
  });

  it("defaults to English when the cookie is missing", async () => {
    assert.equal(await getRequestLocale(), "en");
    const { locale, dict } = await getRequestDictionary();
    assert.equal(locale, "en");
    assert.equal(dict.nav.open, "Open");
  });

  it("reads a valid locale cookie", async () => {
    setCookie(LOCALE_COOKIE, "zh-Hans");
    assert.equal(await getRequestLocale(), "zh-Hans");
    const { locale, dict } = await getRequestDictionary();
    assert.equal(locale, "zh-Hans");
    assert.equal(dict.appName, "祷告日志");
  });

  it("defaults to English for an invalid cookie", async () => {
    setCookie(LOCALE_COOKIE, "fr");
    assert.equal(await getRequestLocale(), "en");
    setCookie(LOCALE_COOKIE, "zh-Hant");
    assert.equal(await getRequestLocale(), "zh-Hant");
    setCookie(LOCALE_COOKIE, "es");
    const pack = await getRequestDictionary();
    assert.equal(pack.locale, "es");
    assert.equal(pack.dict.nav.language, "Idioma");
  });
});
