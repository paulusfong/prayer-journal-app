import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localeSelectChangeHandler, submitLocaleForm } from "./submit-locale-form";

describe("submitLocaleForm", () => {
  it("no-ops for null and calls requestSubmit when present", () => {
    assert.doesNotThrow(() => submitLocaleForm(null));
    let called = 0;
    const form = { requestSubmit: () => { called += 1; } } as HTMLFormElement;
    submitLocaleForm(form);
    assert.equal(called, 1);
  });
});

describe("localeSelectChangeHandler", () => {
  it("submits the current form when fired", () => {
    let called = 0;
    const form = { requestSubmit: () => { called += 1; } } as HTMLFormElement;
    const handler = localeSelectChangeHandler({ current: form });
    handler();
    assert.equal(called, 1);
    localeSelectChangeHandler({ current: null })();
  });
});
