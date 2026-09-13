import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  isLocale,
  localeCookieInit,
  parseLocale,
  pathFromReferer,
  safeReturnPath,
} from "./locales";

describe("locales", () => {
  it("exports the four UI locales and cookie name", () => {
    assert.deepEqual([...LOCALES], ["en", "zh-Hans", "zh-Hant", "es"]);
    assert.equal(DEFAULT_LOCALE, "en");
    assert.equal(LOCALE_COOKIE, "pj_locale");
    assert.equal(LOCALE_MAX_AGE, 60 * 60 * 24 * 365);
  });

  it("isLocale accepts only exact supported tags", () => {
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("zh-Hans"), true);
    assert.equal(isLocale("zh-Hant"), true);
    assert.equal(isLocale("es"), true);
    assert.equal(isLocale("zh-hans"), false);
    assert.equal(isLocale("zh"), false);
    assert.equal(isLocale("en-US"), false);
    assert.equal(isLocale("fr"), false);
    assert.equal(isLocale(""), false);
    assert.equal(isLocale(" en "), false);
    assert.equal(isLocale(null), false);
    assert.equal(isLocale(undefined), false);
    assert.equal(isLocale(0), false);
    assert.equal(isLocale({}), false);
  });

  it("parseLocale returns the locale or null", () => {
    assert.equal(parseLocale("es"), "es");
    assert.equal(parseLocale("zh-Hant"), "zh-Hant");
    assert.equal(parseLocale("nope"), null);
    assert.equal(parseLocale(""), null);
    assert.equal(parseLocale(undefined), null);
    assert.equal(parseLocale(1), null);
  });

  it("locale cookie is readable (not httpOnly) with a one-year maxAge", () => {
    const secure = localeCookieInit(true);
    assert.equal(secure.httpOnly, false);
    assert.equal(secure.sameSite, "lax");
    assert.equal(secure.secure, true);
    assert.equal(secure.path, "/");
    assert.equal(secure.maxAge, LOCALE_MAX_AGE);
    assert.equal(localeCookieInit(false).secure, false);
    assert.equal(localeCookieInit(false).httpOnly, false);
  });

  it("safeReturnPath allows same-origin paths only", () => {
    assert.equal(safeReturnPath("/profile"), "/profile");
    assert.equal(safeReturnPath("/requests/new?x=1"), "/requests/new?x=1");
    assert.equal(safeReturnPath("  /answered  "), "/answered");
    assert.equal(safeReturnPath("/"), "/");
    assert.equal(safeReturnPath("//evil.example"), "/");
    assert.equal(safeReturnPath("https://evil.example/x"), "/");
    assert.equal(safeReturnPath("/ok://no"), "/");
    assert.equal(safeReturnPath("/\\evil"), "/");
    assert.equal(safeReturnPath("relative"), "/");
    assert.equal(safeReturnPath(""), "/");
    assert.equal(safeReturnPath("   "), "/");
    assert.equal(safeReturnPath(null), "/");
    assert.equal(safeReturnPath(undefined), "/");
    assert.equal(safeReturnPath(1), "/");
  });

  it("pathFromReferer uses pathname and search", () => {
    assert.equal(pathFromReferer("http://localhost:3000/profile"), "/profile");
    assert.equal(pathFromReferer("https://example.com/requests/abc?edit=1"), "/requests/abc?edit=1");
    assert.equal(pathFromReferer("http://x.com/"), "/");
    assert.equal(pathFromReferer("http://x.com//evil"), "/");
    assert.equal(pathFromReferer(null), "/");
    assert.equal(pathFromReferer(undefined), "/");
    assert.equal(pathFromReferer(""), "/");
    assert.equal(pathFromReferer("not a url"), "/");
  });
});
