import { cookies } from "next/headers";
import { getDictionary } from "./get-dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, type Locale } from "./locales";
import type { Dictionary } from "./dictionaries/en";

export async function getRequestLocale(): Promise<Locale> {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  return parseLocale(raw) ?? DEFAULT_LOCALE;
}

export async function getRequestDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
}
