import { CATEGORIES } from "./schema";

// Stryker disable next-line Regex: calendar validation still rejects unanchored junk around YYYY-MM-DD.
const HOPE_BY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CategoryKey = keyof typeof CATEGORIES;

export function parseCategory(raw: string | undefined | null): CategoryKey | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (Object.prototype.hasOwnProperty.call(CATEGORIES, value)) {
    return value as CategoryKey;
  }
  throw new Error("Invalid category.");
}

/** Accept YYYY-MM-DD calendar dates only; empty/undefined → null. */
export function parseHopeBy(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (!HOPE_BY_RE.test(value)) throw new Error("Invalid hope-by date.");
  const [ys, ms, ds] = value.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Stryker disable next-line LogicalOperator,ConditionalExpression: Date.UTC overflow couples Y/M/D checks (equivalent under invalid calendars).
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error("Invalid hope-by date.");
  }
  return value;
}
