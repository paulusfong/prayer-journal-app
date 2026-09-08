import { eq } from "drizzle-orm";
import { db } from "./db";
import { findActiveInvite } from "./journal";
import { circles, user } from "./schema";

export function inviteTokenFromCookieHeader(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)invite_token=([^;]*)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function canRequestMagicLink(email: string, inviteRaw?: string | null) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, normalized)).limit(1);
  if (existing.length > 0) return true;

  const circleRows = await db.select({ id: circles.id }).from(circles).limit(1);
  if (circleRows.length === 0) return true;

  if (inviteRaw && (await findActiveInvite(inviteRaw))) return true;
  return false;
}
