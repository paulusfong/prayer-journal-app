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
});
