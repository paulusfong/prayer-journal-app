import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-mkill-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_SECRET = "s".repeat(32);
delete process.env.BETTER_AUTH_URL;
delete process.env.RESEND_API_KEY;
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

describe("mutation kills — db-backed", async () => {
  const { client, db } = await import("./db");
  const schema = await import("./schema");
  const { eq } = await import("drizzle-orm");
  const { id } = await import("./ids");
  const journal = await import("./journal");
  const { canRequestMagicLink } = await import("./auth-gate");

  const ownerId = id();
  const memberId = id();
  let circleId = "";

  before(async () => {
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    const now = new Date();
    await db.insert(schema.user).values([
      { id: ownerId, name: "O", email: "o@ex.com", emailVerified: true, displayName: "O", createdAt: now, updatedAt: now },
      { id: memberId, name: "M", email: "m@ex.com", emailVerified: true, displayName: "M", createdAt: now, updatedAt: now },
    ]);

    // Empty circle: first-login magic link allowed
    assert.equal(await canRequestMagicLink("newbie@ex.com"), true);
    assert.equal(await canRequestMagicLink(""), false);
    assert.equal(await canRequestMagicLink("   "), false);
    assert.equal(await canRequestMagicLink("  o@ex.com  "), true); // trim

    await journal.bootstrapIfNeeded(ownerId);
    const mem = await journal.getApprovedMembership(ownerId);
    assert.ok(mem);
    circleId = mem!.circleId;
    assert.equal(circleId, journal.SINGLETON_CIRCLE_ID);
    assert.equal(journal.SINGLETON_CIRCLE_ID, "circle-singleton");
    const circles = await db.select().from(schema.circles);
    assert.equal(circles[0]!.name, "Our circle");

    await db.insert(schema.memberships).values({
      id: id(), userId: memberId, circleId, role: "member", status: "approved", createdAt: now,
    });

    // After circle exists, stranger without invite denied
    assert.equal(await canRequestMagicLink("stranger@ex.com"), false);
  });

  it("issueInvite expiry is ~30 days and revokes prior actives", async () => {
    const t0 = Date.now();
    await journal.issueInvite(circleId, ownerId);
    const b = await journal.issueInvite(circleId, ownerId);
    const all = await db.select().from(schema.invites);
    const active = all.filter((i) => i.revokedAt == null);
    assert.equal(active.length, 1);
    assert.equal(active[0]!.id, b.id);
    const delta = b.expiresAt.getTime() - t0;
    const expected = 30 * 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(delta - expected) < 5000, `expiry delta ${delta} vs ${expected}`);
  });

  it("findActiveInvite rejects expired; scrub only when token!==digest", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    assert.ok(await journal.findActiveInvite(issued.rawToken));
    await db.update(schema.invites).set({ expiresAt: new Date(Date.now() - 1) }).where(eq(schema.invites.id, issued.id));
    assert.equal(await journal.findActiveInvite(issued.rawToken), null);

    // Insert legacy plaintext row and scrub
    const legacyId = id();
    await db.insert(schema.invites).values({
      id: legacyId,
      circleId,
      createdById: ownerId,
      token: "plaintext",
      tokenDigest: "digest",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    });
    await journal.scrubLegacyInvitePlaintext();
    const row = (await db.select().from(schema.invites).where(eq(schema.invites.id, legacyId)))[0]!;
    assert.equal(row.token, "digest");
  });

  it("redeemInvite pending short-circuit", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    const u = id();
    await db.insert(schema.user).values({
      id: u, name: "P", email: "p2@ex.com", emailVerified: true, displayName: "P", createdAt: new Date(), updatedAt: new Date(),
    });
    assert.deepEqual(await journal.redeemInvite(u, issued.rawToken), { ok: true, status: "pending" });
    const before = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, u));
    assert.deepEqual(await journal.redeemInvite(u, issued.rawToken), { ok: true, status: "pending" });
    const after = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, u));
    assert.equal(before.length, after.length);
  });

  it("listRequests open/answered sort contracts", async () => {
    // Controlled hopeBy / createdAt ordering
    const rHope = await journal.createRequest(ownerId, circleId, { title: "H", hopeBy: "2099-01-01", visibility: "private" });
    const rNo = await journal.createRequest(ownerId, circleId, { title: "N", visibility: "private" });
    const open = await journal.listRequests(ownerId, circleId, "open");
    const idxH = open.findIndex((x) => x.request.id === rHope.id);
    const idxN = open.findIndex((x) => x.request.id === rNo.id);
    assert.ok(idxH >= 0 && idxN >= 0 && idxH < idxN);

    // two with hope vs none ordering + same hope createdAt desc
    const h1 = await journal.createRequest(ownerId, circleId, { title: "A", hopeBy: "2099-06-01", visibility: "private" });
    const h2 = await journal.createRequest(ownerId, circleId, { title: "B", hopeBy: "2099-06-01", visibility: "private" });
    await db.update(schema.prayerRequests).set({ createdAt: new Date("2090-01-01T00:00:00Z") }).where(eq(schema.prayerRequests.id, h1.id));
    await db.update(schema.prayerRequests).set({ createdAt: new Date("2090-01-02T00:00:00Z") }).where(eq(schema.prayerRequests.id, h2.id));
    const open2 = await journal.listRequests(ownerId, circleId, "open");
    const i1 = open2.findIndex((x) => x.request.id === h1.id);
    const i2 = open2.findIndex((x) => x.request.id === h2.id);
    assert.ok(i2 < i1, "newer same-hope first");

    await journal.answerRequest(ownerId, rHope.id);
    await journal.answerRequest(ownerId, rNo.id);
    await db.update(schema.prayerRequests).set({ answeredAt: new Date("2091-01-01T00:00:00Z") }).where(eq(schema.prayerRequests.id, rHope.id));
    await db.update(schema.prayerRequests).set({ answeredAt: new Date("2091-01-02T00:00:00Z") }).where(eq(schema.prayerRequests.id, rNo.id));
    const ans = await journal.listRequests(ownerId, circleId, "answered");
    assert.equal(ans[0]!.request.id, rNo.id);
  });

  it("createRequest title boundary and field slices + notify mail", async () => {
    const longBody = "b".repeat(2500);
    const longWho = "w".repeat(100);
    const longOther = "o".repeat(100);
    const row = await journal.createRequest(ownerId, circleId, {
      title: "x".repeat(120),
      body: longBody,
      whoFor: longWho,
      category: "other",
      categoryOther: longOther,
      visibility: "circle",
    });
    assert.equal(row.title.length, 120);
    assert.equal(row.body!.length, 2000);
    assert.equal(row.whoFor!.length, 80);
    assert.equal(row.categoryOther!.length, 80);
    await assert.rejects(
      () => journal.createRequest(ownerId, circleId, { title: "x".repeat(121), visibility: "private" }),
      /Title/,
    );

    // private create should not notify — circle does
    const origFetch = globalThis.fetch;
    let posts = 0;
    globalThis.fetch = (async () => {
      posts++;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.createRequest(ownerId, circleId, { title: "CircleMail", visibility: "circle" });
      assert.ok(posts >= 1, "notify sends mail to members");
      posts = 0;
      await journal.createRequest(ownerId, circleId, { title: "PrivMail", visibility: "private" });
      assert.equal(posts, 0);
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("updateRequest trim/slice and private→circle notify", async () => {
    const priv = await journal.createRequest(ownerId, circleId, { title: "P", visibility: "private" });
    let posts = 0;
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      posts++;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.updateRequest(ownerId, priv.id, {
        title: "  " + "t".repeat(130),
        body: "b".repeat(2500),
        whoFor: "w".repeat(100),
        categoryOther: "o".repeat(100),
        visibility: "circle",
      });
      const rows = await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, priv.id));
      assert.equal(rows[0]!.title.length, 120);
      assert.equal(rows[0]!.body!.length, 2000);
      assert.ok(posts >= 1);
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("note/update slice caps and delete side effects", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "N", visibility: "circle" });
    await journal.addNote(memberId, req.id, "n".repeat(500));
    await journal.addUpdate(ownerId, req.id, "u".repeat(3000));
    const d = await journal.requestDetail(ownerId, circleId, req.id);
    assert.equal(d!.notes[0]!.note.body.length, 280);
    assert.equal(d!.updates[0]!.update.body.length, 2000);
    const noteId = d!.notes[0]!.note.id;
    const updateId = d!.updates[0]!.update.id;
    await journal.deleteNote(memberId, noteId);
    await journal.deleteUpdate(ownerId, updateId);
    const d2 = await journal.requestDetail(ownerId, circleId, req.id);
    assert.equal(d2!.notes.length, 0);
    assert.equal(d2!.updates.length, 0);
  });

  it("answerRequest mails author when other answers; uses default app URL", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "MailMe", visibility: "circle" });
    const bodies: string[] = [];
    const subjects: string[] = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (_u, init) => {
      const body = JSON.parse(String((init as RequestInit).body));
      bodies.push(body.text);
      subjects.push(body.subject);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    delete process.env.BETTER_AUTH_URL;
    try {
      await journal.answerRequest(memberId, req.id);
      assert.ok(subjects.some((s) => s.includes("MailMe")));
      assert.ok(bodies.some((t) => t.includes("http://localhost:3000/requests/")));
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("setMembershipStatus decline path and circle mismatch", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    const u = id();
    await db.insert(schema.user).values({
      id: u, name: "D", email: "d@ex.com", emailVerified: true, displayName: "D", createdAt: new Date(), updatedAt: new Date(),
    });
    await journal.redeemInvite(u, issued.rawToken);
    const pending = await journal.getPendingMembership(u);
    await journal.setMembershipStatus(ownerId, pending!.id, "decline");
    assert.equal(await journal.getPendingMembership(u), null);

    await assert.rejects(
      () => journal.setMembershipStatus(ownerId, "nope", "approve"),
      /Not found/,
    );
  });

  it("bootstrap early-return when circle exists", async () => {
    const before = (await db.select().from(schema.circles)).length;
    await journal.bootstrapIfNeeded(memberId);
    assert.equal((await db.select().from(schema.circles)).length, before);
  });


  it("expiry boundary uses strict < not <=", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    const now = Date.now();
    await db.update(schema.invites).set({ expiresAt: new Date(now) }).where(eq(schema.invites.id, issued.id));
    // Freeze comparison by using expiresAt === Date.now() approximately — re-read and set exactly
    const row = (await db.select().from(schema.invites).where(eq(schema.invites.id, issued.id)))[0]!;
    const t = row.expiresAt.getTime();
    // Monkey-patch Date.now for the check
    const realNow = Date.now;
    Date.now = () => t;
    try {
      assert.ok(await journal.findActiveInvite(issued.rawToken), "exactly-now still active with <");
      assert.ok(await journal.activeInvite(circleId), "activeInvite same boundary");
    } finally {
      Date.now = realNow;
    }
  });

  it("scrub skips rows already digest-only", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    const before = (await db.select().from(schema.invites).where(eq(schema.invites.id, issued.id)))[0]!;
    assert.equal(before.token, before.tokenDigest);
    await journal.scrubLegacyInvitePlaintext();
    const after = (await db.select().from(schema.invites).where(eq(schema.invites.id, issued.id)))[0]!;
    assert.equal(after.token, before.token);
  });

  it("open-list hope-vs-none ordering both directions", async () => {
    // Clear open private noise by answering/deleting is hard; use unique hope dates
    const onlyHope = await journal.createRequest(ownerId, circleId, {
      title: "OnlyHope",
      hopeBy: "2098-01-01",
      visibility: "private",
    });
    const onlyNone = await journal.createRequest(ownerId, circleId, {
      title: "OnlyNone",
      visibility: "private",
    });
    await db.update(schema.prayerRequests).set({ createdAt: new Date("2000-01-01Z") }).where(eq(schema.prayerRequests.id, onlyHope.id));
    await db.update(schema.prayerRequests).set({ createdAt: new Date("2000-01-02Z") }).where(eq(schema.prayerRequests.id, onlyNone.id));
    const open = await journal.listRequests(ownerId, circleId, "open");
    const ih = open.findIndex((x) => x.request.id === onlyHope.id);
    const inn = open.findIndex((x) => x.request.id === onlyNone.id);
    assert.ok(ih < inn, "hope before none");
    // return +1 vs -1: if mutant returns +1 for ha&&!hb, order flips
    assert.equal(open[ih]!.request.hopeBy, "2098-01-01");
  });

  it("updateRequest overwrites hopeBy only when the caller passes it", async () => {
    const req = await journal.createRequest(ownerId, circleId, {
      title: "Hope",
      hopeBy: "2099-03-01",
      visibility: "private",
    });

    await journal.updateRequest(ownerId, req.id, { title: "Hope", visibility: "private" });
    let row = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
    assert.equal(row.hopeBy, "2099-03-01");

    await journal.updateRequest(ownerId, req.id, {
      title: "Hope",
      hopeBy: "2099-04-02",
      visibility: "private",
    });
    row = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
    assert.equal(row.hopeBy, "2099-04-02");

    await journal.updateRequest(ownerId, req.id, {
      title: "Hope",
      hopeBy: "",
      visibility: "private",
    });
    row = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
    assert.equal(row.hopeBy, null);
  });

  it("update circle→circle does not notify; trim title on update", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "C1", visibility: "circle" });
    let posts = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => { posts++; return new Response("{}", { status: 200 }); }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.updateRequest(ownerId, req.id, { title: "  Hello  ", visibility: "circle" });
      assert.equal(posts, 0);
      const row = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
      assert.equal(row.title, "Hello");
      // empty whoFor/categoryOther → null via ||
      await journal.updateRequest(ownerId, req.id, { title: "T", whoFor: "", categoryOther: "", visibility: "circle" });
      const row2 = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
      assert.equal(row2.whoFor, null);
      assert.equal(row2.categoryOther, null);
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("notify skips author and uses default base URL + subjects", async () => {
    delete process.env.BETTER_AUTH_URL;
    const subjects: string[] = [];
    const texts: string[] = [];
    const tos: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_u, init) => {
      const b = JSON.parse(String((init as RequestInit).body));
      subjects.push(b.subject);
      texts.push(b.text);
      tos.push(b.to);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.createRequest(ownerId, circleId, { title: "Announce", visibility: "circle" });
      assert.ok(subjects.every((s) => s.includes("Announce")));
      assert.ok(subjects.every((s) => s.startsWith("New prayer:")));
      assert.ok(texts.every((t) => t.includes("http://localhost:3000/requests/")));
      assert.ok(tos.includes("m@ex.com"));
      assert.ok(!tos.includes("o@ex.com"), "author not emailed");
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("answer by other always attempts author lookup mail path", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "A2", visibility: "circle" });
    let posts = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => { posts++; return new Response("{}", { status: 200 }); }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.answerRequest(memberId, req.id);
      assert.ok(posts >= 1);
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("decline deletes pending; wrong-circle membership not found", async () => {
    const issued = await journal.issueInvite(circleId, ownerId);
    const u = id();
    await db.insert(schema.user).values({
      id: u, name: "W", email: "w@ex.com", emailVerified: true, displayName: "W", createdAt: new Date(), updatedAt: new Date(),
    });
    await journal.redeemInvite(u, issued.rawToken);
    const pending = await journal.getPendingMembership(u);
    await journal.setMembershipStatus(ownerId, pending!.id, "decline");
    const gone = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, u));
    assert.equal(gone.length, 0);

    // foreign circle membership id
    const otherCircle = "circle-other-x";
    await db.insert(schema.circles).values({ id: otherCircle, name: "X", createdAt: new Date() });
    const foreignMem = id();
    await db.insert(schema.memberships).values({
      id: foreignMem, userId: u, circleId: otherCircle, role: "member", status: "pending", createdAt: new Date(),
    });
    await assert.rejects(() => journal.setMembershipStatus(ownerId, foreignMem, "approve"), /Not found/);
  });

  it("markPrayed inserts (try body not empty)", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "Pray", visibility: "circle" });
    assert.equal(await journal.markPrayed(memberId, req.id), true);
    const marks = await db.select().from(schema.prayerMarks);
    assert.ok(marks.some((m) => m.prayerRequestId === req.id && m.userId === memberId));
  });


  it("author self-answer does not mail; long whoFor sliced on update", async () => {
    const req = await journal.createRequest(ownerId, circleId, { title: "Self", visibility: "private" });
    let posts = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => { posts++; return new Response("{}", { status: 200 }); }) as typeof fetch;
    process.env.RESEND_API_KEY = "rk";
    try {
      await journal.answerRequest(ownerId, req.id);
      assert.equal(posts, 0);
      await journal.reopenRequest(ownerId, req.id);
      await journal.updateRequest(ownerId, req.id, {
        title: "Self",
        whoFor: "w".repeat(100),
        categoryOther: "o".repeat(100),
        visibility: "private",
      });
      const row = (await db.select().from(schema.prayerRequests).where(eq(schema.prayerRequests.id, req.id)))[0]!;
      assert.equal(row.whoFor!.length, 80);
      assert.equal(row.categoryOther!.length, 80);
      // private→private must not notify even if wasPrivate forced true
      posts = 0;
      await journal.updateRequest(ownerId, req.id, { title: "Self2", visibility: "private" });
      assert.equal(posts, 0);
    } finally {
      globalThis.fetch = orig;
      delete process.env.RESEND_API_KEY;
    }
  });

  it("bootstrap no-ops for any existing circle id (not only singleton insert failure)", async () => {
    // Replace singleton with a differently-id'd circle so early-return matters.
    await db.delete(schema.memberships);
    await db.delete(schema.invites);
    await db.delete(schema.circles);
    const customId = "circle-custom";
    await db.insert(schema.circles).values({ id: customId, name: "Custom", createdAt: new Date() });
    const u = id();
    await db.insert(schema.user).values({
      id: u, name: "Z", email: "z@ex.com", emailVerified: true, displayName: "Z", createdAt: new Date(), updatedAt: new Date(),
    });
    await journal.bootstrapIfNeeded(u);
    const circles = await db.select().from(schema.circles);
    assert.equal(circles.length, 1);
    assert.equal(circles[0]!.id, customId);
    assert.equal(await journal.getApprovedMembership(u), null);
  });
});
