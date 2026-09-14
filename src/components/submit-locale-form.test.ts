import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleLocaleSelectChange, submitLocaleForm } from "./submit-locale-form";

describe("submitLocaleForm", () => {
  it("no-ops for null and calls requestSubmit when present", () => {
    assert.doesNotThrow(() => submitLocaleForm(null));
    let called = 0;
    const form = { requestSubmit: () => { called += 1; } } as HTMLFormElement;
    submitLocaleForm(form);
    assert.equal(called, 1);
  });
});

describe("handleLocaleSelectChange", () => {
  it("submits the select's form", () => {
    let called = 0;
    const form = { requestSubmit: () => { called += 1; } } as HTMLFormElement;
    handleLocaleSelectChange({ currentTarget: { form } });
    assert.equal(called, 1);
    handleLocaleSelectChange({ currentTarget: { form: null } });
  });
});
