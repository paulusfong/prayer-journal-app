/** Submit the locale form when the select changes. */
export function submitLocaleForm(form: HTMLFormElement | null) {
  form?.requestSubmit();
}

/** Select onChange handler — module-level so c8 can cover it without firing React events. */
export function handleLocaleSelectChange(ev: { currentTarget: { form: HTMLFormElement | null } }) {
  submitLocaleForm(ev.currentTarget.form);
}
