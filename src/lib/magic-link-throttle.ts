/**
 * In-memory magic-link request throttle (v1).
 *
 * Residual: on serverless, each isolate has its own Map, so limits are
 * per-instance rather than global. Prefer Redis/Upstash only if abuse warrants it.
 */
const WINDOW_MS = 3 * 60 * 1000;
const MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

export const MAGIC_LINK_THROTTLE_WINDOW_MS = WINDOW_MS;
export const MAGIC_LINK_THROTTLE_MAX = MAX_REQUESTS;

export function magicLinkThrottleKey(email: string, ip?: string | null) {
  const e = email.trim().toLowerCase();
  const i = (ip ?? "").trim() || "unknown";
  return `${e}|${i}`;
}

export function clientIpFromHeaders(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}

/** Returns true when the request is allowed; false when throttled. */
export function allowMagicLinkRequest(key: string, now = Date.now()): boolean {
  if (!key || key.startsWith("|")) return false;
  const cutoff = now - WINDOW_MS;
  const prev = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (prev.length >= MAX_REQUESTS) {
    hits.set(key, prev);
    return false;
  }
  prev.push(now);
  hits.set(key, prev);
  return true;
}

/** Test helper: drop all recorded hits. */
export function resetMagicLinkThrottleForTests() {
  hits.clear();
}
