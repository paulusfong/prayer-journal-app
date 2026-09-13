export const LOCALES = ["en", "zh-Hans", "zh-Hant", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "pj_locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: unknown): Locale | null {
  return isLocale(value) ? value : null;
}

export function localeCookieInit(secure: boolean) {
  return {
    httpOnly: false as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: LOCALE_MAX_AGE,
  };
}

/** Reject open redirects / protocol-relative paths. Same-origin path + search only. */
export function safeReturnPath(next: unknown): string {
  if (typeof next !== "string") return "/";
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("://")) {
    return "/";
  }
  return path;
}

export function pathFromReferer(referer: string | null | undefined): string {
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    return safeReturnPath(`${url.pathname}${url.search}`);
  } catch {
    return "/";
  }
}
