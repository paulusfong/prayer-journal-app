"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { canRequestMagicLink } from "@/lib/auth-gate";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import {
  addNote,
  addUpdate,
  answerRequest,
  createRequest,
  deleteNote,
  deleteRequest,
  deleteUpdate,
  issueInvite,
  markPrayed,
  reopenRequest,
  setMembershipStatus,
  unmarkPrayed,
  updateRequest,
} from "@/lib/journal";
import { requireApproved, requireUser } from "@/lib/session";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) redirect("/sign-in");

  const inviteRaw = (await cookies()).get("invite_token")?.value;
  if (await canRequestMagicLink(email, inviteRaw)) {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: "/" },
      headers: await headers(),
    });
  }

  redirect("/sign-in?sent=1");
}

export async function confirmMagicLink(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) redirect("/sign-in");

  // Omit callbackURL so success returns JSON (session cookie via nextCookies)
  // instead of a better-auth redirect APIError. GET of the email URL alone
  // never reaches verify.
  try {
    await auth.api.magicLinkVerify({
      query: { token },
      headers: await headers(),
    });
  } catch {
    redirect("/sign-in?error=invalid");
  }
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}

export async function saveProfile(formData: FormData) {
  const u = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 80);
  await db.update(user).set({ displayName, name: displayName, updatedAt: new Date() }).where(eq(user.id, u.id));
  redirect("/");
}

export async function createPrayerRequest(formData: FormData) {
  const { user, membership } = await requireApproved();
  const created = await createRequest(user.id, membership.circleId, formFrom(formData));
  revalidatePath("/");
  redirect(`/requests/${created.id}`);
}

export async function updatePrayerRequest(requestId: string, formData: FormData) {
  const { user } = await requireApproved();
  await updateRequest(user.id, requestId, formFrom(formData));
  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}`);
}

export async function removePrayerRequest(requestId: string) {
  const { user } = await requireApproved();
  await deleteRequest(user.id, requestId);
  revalidatePath("/");
  redirect("/");
}

export async function pray(requestId: string) {
  const { user } = await requireApproved();
  await markPrayed(user.id, requestId);
  revalidatePath(`/requests/${requestId}`);
}

export async function unpray(requestId: string) {
  const { user } = await requireApproved();
  await unmarkPrayed(user.id, requestId);
  revalidatePath(`/requests/${requestId}`);
}

export async function postNote(requestId: string, formData: FormData) {
  const { user } = await requireApproved();
  await addNote(user.id, requestId, String(formData.get("body") ?? ""));
  revalidatePath(`/requests/${requestId}`);
}

export async function removeNote(requestId: string, noteId: string) {
  const { user } = await requireApproved();
  await deleteNote(user.id, noteId);
  revalidatePath(`/requests/${requestId}`);
}

export async function postUpdate(requestId: string, formData: FormData) {
  const { user } = await requireApproved();
  await addUpdate(user.id, requestId, String(formData.get("body") ?? ""));
  revalidatePath(`/requests/${requestId}`);
}

export async function removeUpdate(requestId: string, updateId: string) {
  const { user } = await requireApproved();
  await deleteUpdate(user.id, updateId);
  revalidatePath(`/requests/${requestId}`);
}

export async function markAnswered(requestId: string) {
  const { user } = await requireApproved();
  await answerRequest(user.id, requestId);
  revalidatePath("/");
  redirect("/answered");
}

export async function reopen(requestId: string) {
  const { user } = await requireApproved();
  await reopenRequest(user.id, requestId);
  revalidatePath(`/requests/${requestId}`);
  redirect(`/requests/${requestId}`);
}

export async function rotateInvite() {
  const { user, membership } = await requireApproved();
  if (membership.role !== "owner") throw new Error("Forbidden");
  const issued = await issueInvite(membership.circleId, user.id);
  const secure =
    process.env.NODE_ENV === "production" ||
    (process.env.BETTER_AUTH_URL ?? "").startsWith("https");
  // Raw join token is shown once via this short-lived cookie (not stored in DB).
  (await cookies()).set("invite_link_once", issued.rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });
  revalidatePath("/circle");
}

export async function decideMembership(membershipId: string, action: "approve" | "decline" | "revoke") {
  const { user } = await requireApproved();
  await setMembershipStatus(user.id, membershipId, action);
  revalidatePath("/circle");
}

function formFrom(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    whoFor: String(formData.get("whoFor") ?? ""),
    category: String(formData.get("category") ?? "") || undefined,
    categoryOther: String(formData.get("categoryOther") ?? ""),
    hopeBy: String(formData.get("hopeBy") ?? "") || undefined,
    visibility: (String(formData.get("visibility") ?? "circle") === "private" ? "private" : "circle") as
      | "private"
      | "circle",
  };
}


