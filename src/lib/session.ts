import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { bootstrapIfNeeded, getApprovedMembership, getPendingMembership } from "./journal";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireApproved() {
  const user = await requireUser();
  await bootstrapIfNeeded(user.id);
  const membership = await getApprovedMembership(user.id);
  if (membership) return { user, membership };
  if (await getPendingMembership(user.id)) redirect("/pending");
  redirect("/need-invite");
}
