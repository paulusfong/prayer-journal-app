"use client";

import { setLocale } from "@/app/actions";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { usePathname } from "next/navigation";
import { useRef } from "react";

type Props = {
  locale: Locale;
  label: string;
  names: Record<Locale, string>;
};

export function LocaleSwitcher({ locale, label, names }: Props) {
  const pathname = usePathname() || "/";
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setLocale} className="lang-switch">
      <input type="hidden" name="next" value={pathname} />
      <label>
        <span className="sr-only">{label}</span>
        <select
          name="locale"
          defaultValue={locale}
          aria-label={label}
          onChange={() => formRef.current?.requestSubmit()}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {names[code]}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className="text-btn">
          {label}
        </button>
      </noscript>
    </form>
  );
}
