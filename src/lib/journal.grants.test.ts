import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-grants-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;

describe("named-people request grants", async () => {
  const { client, db } = await import("./db");
  const schema = await import("./schema");
  const { eq } = await import("drizzle-orm");
  const { id } = await import("./ids");
  const journal = await import("./journal");

  const ownerId = id();
  const benId = id();
  const caraId = id();
  const pendingId = id();
  let circleId = "";
  let benMemId = "";

  before(async () => {
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    const now = new Date();
    await db.insert(schema.user).values([
      { id: ownerId, name: "Ann", email: "ann@ex.com", emailVerified: true, displayName: "Ann", createdAt: now, updatedAt: now },
      { id: benId, name: "Ben", email: "ben@ex.com", emailVerified: true, displayName: "Ben", createdAt: now, updatedAt: now },
      { id: caraId, name: "Cara", email: "cara@ex.com", emailVerified: true, displayName: "Cara", createdAt: now, updatedAt: now },
      { id: pendingId, name: "Pat", email: "pat@ex.com", emailVerified: true, displayName: "Pat", createdAt: now, updatedAt: now },
    ]);
    await journal.bootstrapIfNeeded(ownerId);
    circleId = (await journal.getApprovedMembership(ownerId))!.circleId;
    benMemId = id();
    await db.insert(schema.memberships).values([
      { id: benMemId, userId: benId, circleId, role: "member", status: "approved", createdAt: now },
      { id: id(), userId: caraId, circleId, role: "member", status: "approved", createdAt: now },
      { id: id(), userId: pendingId, circleId, role: "member", status: "pending", createdAt: now },
    ]);
  });

  it("shares with picked approved members only, never emails, and hides from others", async () => {
    let posts = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      posts++;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    let created;
    try {
      created = await journal.createRequest(ownerId, circleId, {
        title: "For Ben",
        visibility: "people",
        shareWith: [benId, ownerId, pendingId, "not-a-user", benId],
      });
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
    assert.equal(posts, 0);
    assert.equal(created.visibility, "people");
    const grants = await journal.listRequestGrantUserIds(created.id);
    assert.deepEqual(grants.sort(), [benId].sort());

    assert.ok(await journal.getVisibleRequest(ownerId, circleId, created.id));
    assert.ok(await journal.getVisibleRequest(benId, circleId, created.id));
    assert.equal(await journal.getVisibleRequest(caraId, circleId, created.id), null);
    assert.equal(await journal.getVisibleRequest(pendingId, circleId, created.id), null);

    const benOpen = await journal.listRequests(benId, circleId, "open");
    const caraOpen = await journal.listRequests(caraId, circleId, "open");
    assert.ok(benOpen.some((r) => r.request.id === created.id));
    assert.ok(!caraOpen.some((r) => r.request.id === created.id));

    assert.equal(await journal.addNote(benId, created.id, "praying"), true);
    assert.equal(await journal.addNote(caraId, created.id, "nope"), null);
    assert.equal(await journal.markPrayed(caraId, created.id), false);
  });

  it("empty or invalid pick-people collapses to private", async () => {
    const empty = await journal.createRequest(ownerId, circleId, {
      title: "Nobody",
      visibility: "people",
      shareWith: [],
    });
    assert.equal(empty.visibility, "private");
    assert.deepEqual(await journal.listRequestGrantUserIds(empty.id), []);
    assert.equal(await journal.getVisibleRequest(benId, circleId, empty.id), null);

    const invalid = await journal.createRequest(ownerId, circleId, {
      title: "Pending only",
      visibility: "people",
      shareWith: [pendingId, ownerId],
    });
    assert.equal(invalid.visibility, "private");
  });

  it("circle create ignores shareWith; people→circle emails; grant edits drop access", async () => {
    const circled = await journal.createRequest(ownerId, circleId, {
      title: "All",
      visibility: "circle",
      shareWith: [benId],
    });
    assert.deepEqual(await journal.listRequestGrantUserIds(circled.id), []);

    const named = await journal.createRequest(ownerId, circleId, {
      title: "Swap",
      visibility: "people",
      shareWith: [benId],
    });
    await journal.updateRequest(ownerId, named.id, {
      title: "Swap",
      visibility: "people",
      shareWith: [caraId],
    });
    assert.deepEqual((await journal.listRequestGrantUserIds(named.id)).sort(), [caraId].sort());
    assert.equal(await journal.getVisibleRequest(benId, circleId, named.id), null);
    assert.ok(await journal.getVisibleRequest(caraId, circleId, named.id));

    let posts = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      posts++;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.updateRequest(ownerId, named.id, { title: "Now circle", visibility: "circle" });
      assert.ok(posts >= 1);
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
    assert.ok(await journal.getVisibleRequest(benId, circleId, named.id));
    assert.deepEqual(await journal.listRequestGrantUserIds(named.id), []);

    await journal.updateRequest(ownerId, named.id, { title: "Hidden", visibility: "private" });
    assert.equal(await journal.getVisibleRequest(caraId, circleId, named.id), null);
  });

  it("revoking a member drops grants; leftover grant without membership is ignored", async () => {
    const named = await journal.createRequest(ownerId, circleId, {
      title: "Revoke me",
      visibility: "people",
      shareWith: [benId],
    });
    await journal.setMembershipStatus(ownerId, benMemId, "revoke");
    assert.deepEqual(await journal.listRequestGrantUserIds(named.id), []);
    assert.equal(await journal.getVisibleRequest(benId, circleId, named.id), null);

    await db.insert(schema.requestGrants).values({
      id: id(),
      prayerRequestId: named.id,
      userId: benId,
    });
    assert.equal(await journal.getVisibleRequest(benId, circleId, named.id), null);

    await db.delete(schema.requestGrants).where(eq(schema.requestGrants.prayerRequestId, named.id));
    await db.update(schema.memberships).set({ status: "approved" }).where(eq(schema.memberships.id, benMemId));
  });

  it("decline deletes grants for that user", async () => {
    const named = await journal.createRequest(ownerId, circleId, {
      title: "Pat later",
      visibility: "people",
      shareWith: [benId],
    });
    await db.insert(schema.requestGrants).values({
      id: id(),
      prayerRequestId: named.id,
      userId: pendingId,
    });
    const pendingMem = (await journal.listCirclePeople(circleId)).find((p) => p.person.id === pendingId)!;
    await journal.setMembershipStatus(ownerId, pendingMem.membership.id, "decline");
    const leftover = await db.select().from(schema.requestGrants).where(eq(schema.requestGrants.userId, pendingId));
    assert.equal(leftover.length, 0);
  });
});
