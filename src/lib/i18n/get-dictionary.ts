import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { zhHans } from "./dictionaries/zh-Hans";
import { zhHant } from "./dictionaries/zh-Hant";
import { DEFAULT_LOCALE, isLocale } from "./locales";
import type { Dictionary } from "./dictionaries/en";

const dictionaries = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  es,
} as const;

export function getDictionary(locale: string): Dictionary {
  if (isLocale(locale)) return dictionaries[locale];
  return dictionaries[DEFAULT_LOCALE];
}
