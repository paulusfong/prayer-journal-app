import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-authz-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;

describe("journal authz", async () => {
  const { client } = await import("./db");
  const { eq } = await import("drizzle-orm");
  const journal = await import("./journal");
  const { canRequestMagicLink, inviteTokenFromCookieHeader } = await import("./auth-gate");
  const { prayerNotes, prayerRequests, requestUpdates } = await import("./schema");
  const { db } = await import("./db");
  const { id } = await import("./ids");

  const authorId = id();
  const memberId = id();
  const circleId = id();
  let requestId = "";

  before(async () => {
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    const statements = sqlFile
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await client.execute("PRAGMA foreign_keys = OFF");
    for (const statement of statements) {
      await client.execute(statement);
    }
    await client.execute("PRAGMA foreign_keys = ON");

    const now = new Date();
    await db.insert((await import("./schema")).user).values([
      {
        id: authorId,
        name: "Ann",
        email: "ann@example.com",
        emailVerified: true,
        displayName: "Ann",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: memberId,
        name: "Ben",
        email: "ben@example.com",
        emailVerified: true,
        displayName: "Ben",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await db.insert((await import("./schema")).circles).values({
      id: circleId,
      name: "Our circle",
      createdAt: now,
    });
    await db.insert((await import("./schema")).memberships).values([
      {
        id: id(),
        userId: authorId,
        circleId,
        role: "owner",
        status: "approved",
        createdAt: now,
      },
      {
        id: id(),
        userId: memberId,
        circleId,
        role: "member",
        status: "approved",
        createdAt: now,
      },
    ]);

    const created = await journal.createRequest(authorId, circleId, {
      title: "Please pray",
      visibility: "circle",
    });
    requestId = created.id;
    await journal.updateRequest(authorId, requestId, {
      title: "Please pray",
      visibility: "private",
    });
  });

  it("blocks notes, updates, pray, answer, and reopen on a now-private request", async () => {
    assert.equal(await journal.addNote(memberId, requestId, "I am praying"), null);
    assert.equal(await journal.addUpdate(memberId, requestId, "an update"), null);
    assert.equal(await journal.markPrayed(memberId, requestId), false);
    assert.equal(await journal.answerRequest(memberId, requestId), null);
    assert.equal(await journal.reopenRequest(memberId, requestId), null);

    const notes = await db.select().from(prayerNotes).where(eq(prayerNotes.prayerRequestId, requestId));
    const updates = await db.select().from(requestUpdates).where(eq(requestUpdates.prayerRequestId, requestId));
    const row = await db.select().from(prayerRequests).where(eq(prayerRequests.id, requestId)).limit(1);
    assert.equal(notes.length, 0);
    assert.equal(updates.length, 0);
    assert.equal(row[0]?.status, "open");
    assert.equal(row[0]?.visibility, "private");
  });

  it("lets the author update their private request", async () => {
    const ok = await journal.addUpdate(authorId, requestId, "still private");
    assert.equal(ok, true);
    const updates = await db.select().from(requestUpdates).where(eq(requestUpdates.prayerRequestId, requestId));
    assert.equal(updates.length, 1);
  });

  it("allows a magic link for an existing member, not a stranger", async () => {
    assert.equal(await canRequestMagicLink("ann@example.com"), true);
    assert.equal(await canRequestMagicLink("stranger@example.com"), false);
    assert.equal(inviteTokenFromCookieHeader("invite_token=abc; Path=/"), "abc");
  });

  it("lets an approved member note a circle-visible request", async () => {
    const created = await journal.createRequest(authorId, circleId, {
      title: "Open ask",
      visibility: "circle",
    });
    const noted = await journal.addNote(memberId, created.id, "Covered this");
    assert.equal(noted, true);
    const answered = await journal.answerRequest(memberId, created.id);
    assert.equal(answered, true);
  });

  it("stores only invite digests and looks up by hash", async () => {
    const issued = await journal.issueInvite(circleId, authorId);
    assert.ok(issued.rawToken);
    assert.equal(issued.token, issued.tokenDigest);
    assert.notEqual(issued.rawToken, issued.tokenDigest);

    const { invites } = await import("./schema");
    const rows = await db.select().from(invites).where(eq(invites.id, issued.id)).limit(1);
    assert.equal(rows[0]?.token, issued.tokenDigest);
    assert.equal(rows[0]?.tokenDigest, issued.tokenDigest);
    assert.notEqual(rows[0]?.token, issued.rawToken);

    assert.ok(await journal.findActiveInvite(issued.rawToken));
    // Legacy plaintext match must not work against the digest column value alone as a join secret
    assert.equal(await journal.findActiveInvite(issued.tokenDigest), null);
  });

  it("scrubs legacy plaintext invite tokens", async () => {
    const { invites } = await import("./schema");
    const { digest, inviteToken, id: newId } = await import("./ids");
    const raw = inviteToken();
    const hashed = digest(raw);
    const inviteId = newId();
    const now = new Date();
    await db.insert(invites).values({
      id: inviteId,
      circleId,
      createdById: authorId,
      token: raw,
      tokenDigest: hashed,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: now,
    });

    await journal.scrubLegacyInvitePlaintext();
    const rows = await db.select().from(invites).where(eq(invites.id, inviteId)).limit(1);
    assert.equal(rows[0]?.token, hashed);
    assert.equal(rows[0]?.tokenDigest, hashed);
    assert.ok(await journal.findActiveInvite(raw));
  });

  it("allows magic link when invite cookie token hashes to an active invite", async () => {
    const issued = await journal.issueInvite(circleId, authorId);
    assert.equal(await canRequestMagicLink("newbie@example.com", issued.rawToken), true);
    assert.equal(await canRequestMagicLink("newbie@example.com", "not-a-real-token"), false);
  });

});
