import { createHash, randomBytes } from "node:crypto";

export function id() {
  return crypto.randomUUID();
}

export function inviteToken() {
  return randomBytes(32).toString("base64url");
}

export function digest(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function displayLabel(user: { displayName?: string | null; email: string; name?: string | null }) {
  return user.displayName?.trim() || user.name?.trim() || user.email.split("@")[0];
}
