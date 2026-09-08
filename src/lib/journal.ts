import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { digest, id, inviteToken } from "./ids";
import { sendMail } from "./mail";
import {
  circles,
  invites,
  memberships,
  prayerMarks,
  prayerNotes,
  prayerRequests,
  requestUpdates,
  user,
} from "./schema";

export { CATEGORIES } from "./schema";
export { categoryLabel } from "./labels";

export async function getApprovedMembership(userId: string) {
  const rows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "approved")))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPendingMembership(userId: string) {
  const rows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "pending")))
    .limit(1);
  return rows[0] ?? null;
}

export async function bootstrapIfNeeded(userId: string) {
  const existing = await db.select({ id: circles.id }).from(circles).limit(1);
  if (existing.length > 0) return;

  const circleId = id();
  const now = new Date();
  await db.insert(circles).values({ id: circleId, name: "Our circle", createdAt: now });
  await db.insert(memberships).values({
    id: id(),
    userId,
    circleId,
    role: "owner",
    status: "approved",
    createdAt: now,
  });
  await issueInvite(circleId, userId);
}

export async function issueInvite(circleId: string, createdById: string) {
  const now = new Date();
  const active = await db
    .select()
    .from(invites)
    .where(and(eq(invites.circleId, circleId), isNull(invites.revokedAt)));
  for (const inv of active) {
    await db.update(invites).set({ revokedAt: now }).where(eq(invites.id, inv.id));
  }
  const token = inviteToken();
  const row = {
    id: id(),
    circleId,
    createdById,
    token,
    tokenDigest: digest(token),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: now,
  };
  await db.insert(invites).values(row);
  return row;
}

export async function findActiveInvite(raw: string) {
  const hashed = digest(raw);
  const rows = await db
    .select()
    .from(invites)
    .where(or(eq(invites.tokenDigest, hashed), eq(invites.token, raw)));
  const inv = rows[0];
  if (!inv || inv.revokedAt || inv.expiresAt.getTime() < Date.now()) return null;
  return inv;
}

export async function redeemInvite(userId: string, raw: string) {
  const invite = await findActiveInvite(raw);
  if (!invite) return { ok: false as const, reason: "expired" };

  const existing = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.circleId, invite.circleId)))
    .limit(1);
  const m = existing[0];
  if (m?.status === "approved") return { ok: true as const, status: "approved" as const };
  if (m?.status === "pending") return { ok: true as const, status: "pending" as const };
  if (m) {
    await db.update(memberships).set({ status: "pending", role: "member" }).where(eq(memberships.id, m.id));
  } else {
    await db.insert(memberships).values({
      id: id(),
      userId,
      circleId: invite.circleId,
      role: "member",
      status: "pending",
      createdAt: new Date(),
    });
  }
  return { ok: true as const, status: "pending" as const };
}

function visibleWhere(userId: string, circleId: string) {
  return and(
    eq(prayerRequests.circleId, circleId),
    or(eq(prayerRequests.authorId, userId), eq(prayerRequests.visibility, "circle")),
  );
}

export async function listRequests(userId: string, circleId: string, status: "open" | "answered") {
  const rows = await db
    .select({
      request: prayerRequests,
      author: user,
    })
    .from(prayerRequests)
    .innerJoin(user, eq(prayerRequests.authorId, user.id))
    .where(and(visibleWhere(userId, circleId), eq(prayerRequests.status, status)));

  if (status === "open") {
    rows.sort((a, b) => {
      const ha = a.request.hopeBy;
      const hb = b.request.hopeBy;
      if (ha && hb) return ha.localeCompare(hb) || b.request.createdAt.getTime() - a.request.createdAt.getTime();
      if (ha && !hb) return -1;
      if (!ha && hb) return 1;
      return b.request.createdAt.getTime() - a.request.createdAt.getTime();
    });
  } else {
    rows.sort(
      (a, b) => (b.request.answeredAt?.getTime() ?? 0) - (a.request.answeredAt?.getTime() ?? 0),
    );
  }
  return rows;
}

export async function getVisibleRequest(userId: string, circleId: string, requestId: string) {
  const rows = await db
    .select({ request: prayerRequests, author: user })
    .from(prayerRequests)
    .innerJoin(user, eq(prayerRequests.authorId, user.id))
    .where(and(eq(prayerRequests.id, requestId), visibleWhere(userId, circleId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createRequest(
  userId: string,
  circleId: string,
  data: {
    title: string;
    body?: string;
    whoFor?: string;
    category?: string;
    categoryOther?: string;
    hopeBy?: string;
    visibility: "private" | "circle";
  },
) {
  const title = data.title.trim();
  if (!title || title.length > 120) throw new Error("Title is required (max 120).");
  const row = {
    id: id(),
    circleId,
    authorId: userId,
    title,
    body: data.body?.slice(0, 2000) || null,
    whoFor: data.whoFor?.slice(0, 80) || null,
    category: data.category || null,
    categoryOther: data.categoryOther?.slice(0, 80) || null,
    hopeBy: data.hopeBy || null,
    visibility: data.visibility,
    status: "open" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(prayerRequests).values(row);
  if (data.visibility === "circle") {
    await notifyNewRequest(row.id, userId, circleId, title);
  }
  return row;
}

export async function updateRequest(
  userId: string,
  requestId: string,
  data: Parameters<typeof createRequest>[2],
) {
  const existing = await db.select().from(prayerRequests).where(eq(prayerRequests.id, requestId)).limit(1);
  const req = existing[0];
  if (!req || req.authorId !== userId) return null;
  const wasPrivate = req.visibility === "private";
  await db
    .update(prayerRequests)
    .set({
      title: data.title.trim().slice(0, 120),
      body: data.body?.slice(0, 2000) || null,
      whoFor: data.whoFor?.slice(0, 80) || null,
      category: data.category || null,
      categoryOther: data.categoryOther?.slice(0, 80) || null,
      hopeBy: data.hopeBy || null,
      visibility: data.visibility,
      updatedAt: new Date(),
    })
    .where(eq(prayerRequests.id, requestId));
  if (wasPrivate && data.visibility === "circle") {
    await notifyNewRequest(requestId, userId, req.circleId, data.title);
  }
  return true;
}

export async function deleteRequest(userId: string, requestId: string) {
  const existing = await db.select().from(prayerRequests).where(eq(prayerRequests.id, requestId)).limit(1);
  if (!existing[0] || existing[0].authorId !== userId) return false;
  await db.delete(prayerRequests).where(eq(prayerRequests.id, requestId));
  return true;
}

async function loadVisibleRequest(userId: string, requestId: string) {
  const membership = await getApprovedMembership(userId);
  if (!membership) return null;
  return getVisibleRequest(userId, membership.circleId, requestId);
}

export async function markPrayed(userId: string, requestId: string) {
  const found = await loadVisibleRequest(userId, requestId);
  if (!found) return false;
  try {
    await db.insert(prayerMarks).values({ id: id(), prayerRequestId: requestId, userId, createdAt: new Date() });
  } catch {
    // unique
  }
  return true;
}

export async function unmarkPrayed(userId: string, requestId: string) {
  const found = await loadVisibleRequest(userId, requestId);
  if (!found) return false;
  await db
    .delete(prayerMarks)
    .where(and(eq(prayerMarks.prayerRequestId, requestId), eq(prayerMarks.userId, userId)));
  return true;
}

export async function addNote(userId: string, requestId: string, body: string) {
  const found = await loadVisibleRequest(userId, requestId);
  if (!found) return null;
  const text = body.trim().slice(0, 280);
  if (!text) throw new Error("Note is required.");
  await db.insert(prayerNotes).values({
    id: id(),
    prayerRequestId: requestId,
    authorId: userId,
    body: text,
    createdAt: new Date(),
  });
  return true;
}

export async function deleteNote(userId: string, noteId: string) {
  await db.delete(prayerNotes).where(and(eq(prayerNotes.id, noteId), eq(prayerNotes.authorId, userId)));
}

export async function addUpdate(userId: string, requestId: string, body: string) {
  const found = await loadVisibleRequest(userId, requestId);
  if (!found || found.request.authorId !== userId) return null;
  const text = body.trim().slice(0, 2000);
  if (!text) throw new Error("Update is required.");
  await db.insert(requestUpdates).values({
    id: id(),
    prayerRequestId: requestId,
    authorId: userId,
    body: text,
    createdAt: new Date(),
  });
  return true;
}

export async function deleteUpdate(userId: string, updateId: string) {
  await db
    .delete(requestUpdates)
    .where(and(eq(requestUpdates.id, updateId), eq(requestUpdates.authorId, userId)));
}

export async function answerRequest(userId: string, requestId: string) {
  const found = await loadVisibleRequest(userId, requestId);
  const req = found?.request;
  if (!req || req.status !== "open") return null;
  await db
    .update(prayerRequests)
    .set({ status: "answered", answeredAt: new Date(), answeredById: userId, updatedAt: new Date() })
    .where(eq(prayerRequests.id, requestId));
  if (req.authorId !== userId) {
    const author = await db.select().from(user).where(eq(user.id, req.authorId)).limit(1);
    if (author[0]) {
      const app = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      await sendMail(
        author[0].email,
        `Answered: ${req.title}`,
        `Your prayer request was marked answered: ${req.title}\n\nOpen it in the journal:\n${app}/requests/${req.id}\n`,
      );
    }
  }
  return true;
}

export async function reopenRequest(userId: string, requestId: string) {
  const found = await loadVisibleRequest(userId, requestId);
  if (!found) return null;
  await db
    .update(prayerRequests)
    .set({ status: "open", answeredAt: null, answeredById: null, updatedAt: new Date() })
    .where(eq(prayerRequests.id, requestId));
  return true;
}

async function notifyNewRequest(requestId: string, authorId: string, circleId: string, title: string) {
  const members = await db
    .select({ u: user })
    .from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(
      and(eq(memberships.circleId, circleId), eq(memberships.status, "approved")),
    );
  const app = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  for (const m of members) {
    if (m.u.id === authorId) continue;
    await sendMail(
      m.u.email,
      `New prayer: ${title}`,
      `A new prayer request was posted: ${title}\n\nOpen it in the journal:\n${app}/requests/${requestId}\n`,
    );
  }
}

export async function listCirclePeople(circleId: string) {
  return db
    .select({ membership: memberships, person: user })
    .from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(eq(memberships.circleId, circleId))
    .orderBy(asc(memberships.createdAt));
}

export async function activeInvite(circleId: string) {
  const rows = await db
    .select()
    .from(invites)
    .where(and(eq(invites.circleId, circleId), isNull(invites.revokedAt)))
    .orderBy(desc(invites.createdAt))
    .limit(1);
  const inv = rows[0];
  if (!inv || inv.expiresAt.getTime() < Date.now()) return null;
  return inv;
}

export async function setMembershipStatus(
  ownerId: string,
  membershipId: string,
  action: "approve" | "decline" | "revoke",
) {
  const owner = await getApprovedMembership(ownerId);
  if (!owner || owner.role !== "owner") throw new Error("Forbidden");
  const rows = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  const m = rows[0];
  if (!m || m.circleId !== owner.circleId) throw new Error("Not found");
  if (action === "approve") {
    await db.update(memberships).set({ status: "approved" }).where(eq(memberships.id, membershipId));
  } else if (action === "decline") {
    await db.delete(memberships).where(eq(memberships.id, membershipId));
  } else {
    if (m.userId === ownerId) throw new Error("Cannot revoke yourself");
    await db.update(memberships).set({ status: "revoked" }).where(eq(memberships.id, membershipId));
  }
}

export async function requestDetail(userId: string, circleId: string, requestId: string) {
  const found = await getVisibleRequest(userId, circleId, requestId);
  if (!found) return null;
  const [marks, notes, updates] = await Promise.all([
    db
      .select({ mark: prayerMarks, person: user })
      .from(prayerMarks)
      .innerJoin(user, eq(prayerMarks.userId, user.id))
      .where(eq(prayerMarks.prayerRequestId, requestId)),
    db
      .select({ note: prayerNotes, person: user })
      .from(prayerNotes)
      .innerJoin(user, eq(prayerNotes.authorId, user.id))
      .where(eq(prayerNotes.prayerRequestId, requestId))
      .orderBy(asc(prayerNotes.createdAt)),
    db
      .select({ update: requestUpdates, person: user })
      .from(requestUpdates)
      .innerJoin(user, eq(requestUpdates.authorId, user.id))
      .where(eq(requestUpdates.prayerRequestId, requestId))
      .orderBy(asc(requestUpdates.createdAt)),
  ]);
  return { ...found, marks, notes, updates };
}
