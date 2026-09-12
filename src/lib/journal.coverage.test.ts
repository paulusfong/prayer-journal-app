import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-jcov-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

describe("journal coverage", async () => {
  const { client, db } = await import("./db");
  const schema = await import("./schema");
  const { eq } = await import("drizzle-orm");
  const { id } = await import("./ids");
  const journal = await import("./journal");

  const ownerId = id();
  const memberId = id();
  const outsiderId = id();
  let circleId = "";
  let openReqId = "";
  let privateReqId = "";
  let answeredReqId = "";

  const mails: Array<{ to: string; subject: string }> = [];
  const originalFetch = globalThis.fetch;

  before(async () => {
    globalThis.fetch = (async () =>
      new Response("{}", { status: 200 })) as typeof fetch;

    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }

    const now = new Date();
    await db.insert(schema.user).values([
      { id: ownerId, name: "Owner", email: "owner@ex.com", emailVerified: true, displayName: "Owner", createdAt: now, updatedAt: now },
      { id: memberId, name: "Member", email: "member@ex.com", emailVerified: true, displayName: null, createdAt: now, updatedAt: now },
      { id: outsiderId, name: "Out", email: "out@ex.com", emailVerified: true, displayName: "Out", createdAt: now, updatedAt: now },
    ]);

    // Exercise re-exports
    assert.ok(journal.CATEGORIES.health);
    assert.equal(journal.categoryLabel("health", null), "Health");

    await journal.bootstrapIfNeeded(ownerId);
    const mem = await journal.getApprovedMembership(ownerId);
    assert.ok(mem);
    circleId = mem!.circleId;

    await db.insert(schema.memberships).values({
      id: id(),
      userId: memberId,
      circleId,
      role: "member",
      status: "approved",
      createdAt: now,
    });
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  it("getPendingMembership and membership lifecycle via redeemInvite", async () => {
    assert.equal(await journal.getPendingMembership(outsiderId), null);

    const issued = await journal.issueInvite(circleId, ownerId);
    const pending = await journal.redeemInvite(outsiderId, issued.rawToken);
    assert.deepEqual(pending, { ok: true, status: "pending" });
    assert.ok(await journal.getPendingMembership(outsiderId));

    // already pending
    assert.deepEqual(await journal.redeemInvite(outsiderId, issued.rawToken), { ok: true, status: "pending" });

    // expired / bad
    assert.deepEqual(await journal.redeemInvite(outsiderId, "nope"), { ok: false, reason: "expired" });

    await journal.setMembershipStatus(ownerId, (await journal.getPendingMembership(outsiderId))!.id, "approve");
    assert.deepEqual(await journal.redeemInvite(outsiderId, issued.rawToken), { ok: true, status: "approved" });

    // revoked then re-pending
    const outsiderMem = (await journal.listCirclePeople(circleId)).find((p) => p.person.id === outsiderId)!;
    await journal.setMembershipStatus(ownerId, outsiderMem.membership.id, "revoke");
    const again = await journal.issueInvite(circleId, ownerId);
    const rePending = await journal.redeemInvite(outsiderId, again.rawToken);
    assert.equal(rePending.ok, true);
    assert.equal(rePending.status, "pending");
    await journal.setMembershipStatus(ownerId, (await journal.getPendingMembership(outsiderId))!.id, "decline");
    assert.equal(await journal.getPendingMembership(outsiderId), null);
  });

  it("create/list/update/delete requests and sorting branches", async () => {
    const a = await journal.createRequest(ownerId, circleId, {
      title: "Alpha",
      body: "body",
      whoFor: "Sam",
      category: "health",
      hopeBy: "2099-01-02",
      visibility: "circle",
    });
    openReqId = a.id;

    const b = await journal.createRequest(ownerId, circleId, {
      title: "Beta",
      hopeBy: "2099-01-01",
      visibility: "circle",
    });

    const c = await journal.createRequest(memberId, circleId, {
      title: "Gamma no hope",
      visibility: "circle",
    });

    const privateOne = await journal.createRequest(ownerId, circleId, {
      title: "Secret",
      visibility: "private",
    });
    privateReqId = privateOne.id;

    // title validation
    await assert.rejects(() => journal.createRequest(ownerId, circleId, { title: "  ", visibility: "circle" }), /Title/);
    await assert.rejects(
      () => journal.createRequest(ownerId, circleId, { title: "x".repeat(121), visibility: "circle" }),
      /Title/,
    );

    const open = await journal.listRequests(ownerId, circleId, "open");
    assert.ok(open.length >= 3);
    // hopeBy sorting: earlier hope first
    const hopes = open.map((r) => r.request.hopeBy);
    assert.ok(hopes.indexOf("2099-01-01") < hopes.indexOf("2099-01-02"));

    // member cannot see private
    assert.equal(await journal.getVisibleRequest(memberId, circleId, privateReqId), null);
    assert.ok(await journal.getVisibleRequest(ownerId, circleId, privateReqId));

    // update private → circle notifies
    assert.equal(await journal.updateRequest(memberId, privateReqId, { title: "Nope", visibility: "private" }), null);
    assert.equal(
      await journal.updateRequest(ownerId, privateReqId, {
        title: "Secret now shared",
        body: "x",
        whoFor: "y",
        category: "other",
        categoryOther: "misc",
        hopeBy: "2099-06-01",
        visibility: "circle",
      }),
      true,
    );

    assert.equal(await journal.deleteRequest(memberId, b.id), false);
    assert.equal(await journal.deleteRequest(ownerId, b.id), true);
    assert.equal(await journal.deleteRequest(memberId, c.id), true);
  });

  it("pray notes updates answer reopen and detail", async () => {
    assert.equal(await journal.markPrayed(outsiderId, openReqId), false);
    assert.equal(await journal.markPrayed(memberId, openReqId), true);
    assert.equal(await journal.markPrayed(memberId, openReqId), true); // unique catch
    assert.equal(await journal.unmarkPrayed(outsiderId, openReqId), false);
    assert.equal(await journal.unmarkPrayed(memberId, openReqId), true);

    assert.equal(await journal.addNote(outsiderId, openReqId, "x"), null);
    await assert.rejects(() => journal.addNote(memberId, openReqId, "  "), /Note/);
    assert.equal(await journal.addNote(memberId, openReqId, "Praying"), true);

    const detail1 = await journal.requestDetail(ownerId, circleId, openReqId);
    assert.ok(detail1);
    const noteId = detail1!.notes[0]!.note.id;
    await journal.deleteNote(memberId, noteId);

    assert.equal(await journal.addUpdate(memberId, openReqId, "nope"), null);
    await assert.rejects(() => journal.addUpdate(ownerId, openReqId, " "), /Update/);
    assert.equal(await journal.addUpdate(ownerId, openReqId, "Progress"), true);
    const detail2 = await journal.requestDetail(ownerId, circleId, openReqId);
    const updateId = detail2!.updates[0]!.update.id;
    await journal.deleteUpdate(ownerId, updateId);

    // answer by other member → mail author
    assert.equal(await journal.answerRequest(outsiderId, openReqId), null);
    assert.equal(await journal.answerRequest(memberId, openReqId), true);
    answeredReqId = openReqId;

    const answered = await journal.listRequests(ownerId, circleId, "answered");
    assert.ok(answered.some((r) => r.request.id === answeredReqId));

    assert.equal(await journal.reopenRequest(outsiderId, answeredReqId), null);
    assert.equal(await journal.reopenRequest(ownerId, answeredReqId), true);

    // answer by author (no mail branch)
    assert.equal(await journal.answerRequest(ownerId, answeredReqId), true);
    // already answered
    assert.equal(await journal.answerRequest(ownerId, answeredReqId), null);

    assert.equal(await journal.requestDetail(ownerId, circleId, "missing"), null);
  });

  it("activeInvite and setMembershipStatus guards", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    assert.ok(await journal.activeInvite(circleId));
    assert.ok(issued.rawToken);

    // expire invite
    await db.update(schema.invites).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.invites.circleId, circleId));
    assert.equal(await journal.activeInvite(circleId), null);

    await assert.rejects(() => journal.setMembershipStatus(memberId, "x", "approve"), /Forbidden/);
    await assert.rejects(() => journal.setMembershipStatus(ownerId, "missing", "approve"), /Not found/);

    const ownerMem = (await journal.listCirclePeople(circleId)).find((p) => p.person.id === ownerId)!;
    await assert.rejects(() => journal.setMembershipStatus(ownerId, ownerMem.membership.id, "revoke"), /Cannot revoke yourself/);
  });

  it("listRequests hopeBy tie-break and one-sided hope branches", async () => {
    const r1 = await journal.createRequest(ownerId, circleId, {
      title: "H1",
      hopeBy: "2099-12-01",
      visibility: "circle",
    });
    const r2 = await journal.createRequest(ownerId, circleId, {
      title: "H2",
      hopeBy: "2099-12-01",
      visibility: "circle",
    });
    const r3 = await journal.createRequest(ownerId, circleId, {
      title: "NoHope",
      visibility: "circle",
    });
    const open = await journal.listRequests(ownerId, circleId, "open");
    const ids = open.map((r) => r.request.id);
    assert.ok(ids.includes(r1.id) && ids.includes(r2.id) && ids.includes(r3.id));
  });
});
