import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { id } from "./ids";
import { getApprovedMembership } from "./journal";
import { appFeedback, user } from "./schema";

export type FeedbackKind = "comment" | "feature";

export function parseFeedbackKind(raw: string): FeedbackKind {
  return raw === "feature" ? "feature" : "comment";
}

export async function addAppFeedback(userId: string, kind: string, body: string) {
  const membership = await getApprovedMembership(userId);
  if (!membership) return false;
  const text = body.trim().slice(0, 2000);
  if (!text) return false;
  await db.insert(appFeedback).values({
    id: id(),
    circleId: membership.circleId,
    authorId: userId,
    kind: parseFeedbackKind(kind),
    body: text,
    createdAt: new Date(),
  });
  return true;
}

export async function listAppFeedback(userId: string) {
  const membership = await getApprovedMembership(userId);
  if (!membership || membership.role !== "owner") return [];
  return db
    .select({
      id: appFeedback.id,
      kind: appFeedback.kind,
      body: appFeedback.body,
      createdAt: appFeedback.createdAt,
      authorId: appFeedback.authorId,
      authorName: user.displayName,
      authorEmail: user.email,
    })
    .from(appFeedback)
    .innerJoin(user, eq(user.id, appFeedback.authorId))
    .where(eq(appFeedback.circleId, membership.circleId))
    .orderBy(desc(appFeedback.createdAt));
}
