/** Submit the locale form when the select changes. */
export function submitLocaleForm(form: HTMLFormElement | null) {
  form?.requestSubmit();
}

/** Stable onChange factory so the handler is unit-testable under c8. */
export function localeSelectChangeHandler(formRef: { current: HTMLFormElement | null }) {
  return () => submitLocaleForm(formRef.current);
}
