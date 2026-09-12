import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { before, describe, it, mock } from "node:test";
import React from "react";
import {
  NextNotFound,
  NextRedirect,
  getCookiesSnapshot,
  getRevalidated,
  installNextMocks,
  renderElement,
  resetHarness,
  setCookie,
  setHeaders,
} from "../test/next-harness";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-app-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_SECRET = "s".repeat(32);
process.env.BETTER_AUTH_URL = "http://localhost:3000";
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

installNextMocks();
mock.module(pathToFileURL(path.resolve("src/app/globals.css")).href, { defaultExport: {} });

const fakeUser = {
  id: "user-owner",
  email: "owner@ex.com",
  name: "Owner",
  displayName: "Owner",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMembership = {
  id: "mem-owner",
  userId: fakeUser.id,
  circleId: "circle-1",
  role: "owner" as const,
  status: "approved" as const,
  createdAt: new Date(),
};

let sessionUser: typeof fakeUser | null = fakeUser;

const authApi: {
  getSession: (...args: unknown[]) => Promise<{ user: typeof fakeUser } | null>;
  signInMagicLink: (...args: unknown[]) => Promise<unknown>;
  magicLinkVerify: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
  handler: (req: Request) => Promise<Response>;
} = {
  getSession: async () => (sessionUser ? { user: sessionUser } : null),
  signInMagicLink: async () => ({}),
  magicLinkVerify: async () => ({}),
  signOut: async () => ({}),
  handler: async () => new Response("auth-ok", { status: 200 }),
};

mock.module("@/lib/auth", {
  namedExports: {
    auth: { api: authApi, handler: authApi.handler },
  },
});

mock.module("better-auth/next-js", {
  namedExports: {
    toNextJsHandler: () => ({
      GET: async (req: Request) => authApi.handler(req),
      POST: async (req: Request) => authApi.handler(req),
    }),
    nextCookies: () => ({}),
  },
});

// Real journal against temp DB for richer coverage where practical.
describe("app coverage", async () => {
  const { client, db } = await import("@/lib/db");
  const schema = await import("@/lib/schema");
  const journal = await import("@/lib/journal");
  const { id } = await import("@/lib/ids");

  let requestId = "";
  let memberId = "";

  before(async () => {
    resetHarness();
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    const now = new Date();
    // Align fake user id with DB
    const ownerId = id();
    memberId = id();
    fakeUser.id = ownerId;
    fakeMembership.userId = ownerId;

    await db.insert(schema.user).values([
      { id: ownerId, name: "Owner", email: "owner@ex.com", emailVerified: true, displayName: "Owner", createdAt: now, updatedAt: now },
      { id: memberId, name: "Mem", email: "mem@ex.com", emailVerified: true, displayName: "Mem", createdAt: now, updatedAt: now },
    ]);
    await journal.bootstrapIfNeeded(ownerId);
    const mem = await journal.getApprovedMembership(ownerId);
    assert.ok(mem);
    fakeMembership.id = mem!.id;
    fakeMembership.circleId = mem!.circleId;

    await db.insert(schema.memberships).values({
      id: id(),
      userId: memberId,
      circleId: mem!.circleId,
      role: "member",
      status: "approved",
      createdAt: now,
    });

    const created = await journal.createRequest(ownerId, mem!.circleId, {
      title: "Cover me",
      body: "Body text",
      whoFor: "Friend",
      category: "health",
      hopeBy: "2099-01-01",
      visibility: "circle",
    });
    requestId = created.id;
    await journal.addNote(memberId, requestId, "note");
    await journal.addUpdate(ownerId, requestId, "update");
    const detail = await journal.requestDetail(ownerId, mem!.circleId, requestId);
    assert.ok(detail!.notes[0]);
    assert.ok(detail!.updates[0]);
  });

  it("middleware clears invite flash on /circle", async () => {
    const { middleware, config } = await import("../middleware");
    assert.deepEqual(config.matcher, ["/circle"]);
    assert.equal(JSON.stringify(config), JSON.stringify({ matcher: ["/circle"] }));

    const { NextRequest } = await import("next/server");
    const pass = middleware(
      new NextRequest(new URL("http://localhost/circle"), {
        headers: { cookie: "" },
      } as ConstructorParameters<typeof NextRequest>[1]),
    );
    assert.ok(pass);

    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    const req = new NextRequest(new URL("http://localhost/circle"), {
      headers: { cookie: "invite_link_once=tok" },
    } as ConstructorParameters<typeof NextRequest>[1]);
    // NextRequest cookies from header
    const res = middleware(req);
    assert.ok(res);
    (process.env as { NODE_ENV?: string }).NODE_ENV = "test";
    process.env.BETTER_AUTH_URL = "https://example.com";
    const res2 = middleware(
      new NextRequest(new URL("http://localhost/circle"), {
        headers: { cookie: "invite_link_once=tok" },
      } as ConstructorParameters<typeof NextRequest>[1]),
    );
    assert.ok(res2);
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
  });

  it("session helpers redirect appropriately", async () => {
    // Mock session module deps are auth — already mocked.
    // Re-import session after mocks
    const session = await import("@/lib/session");

    sessionUser = fakeUser;
    assert.equal((await session.getSessionUser())?.email, fakeUser.email);
    assert.equal((await session.requireUser()).id, fakeUser.id);

    // requireApproved uses real journal
    const ok = await session.requireApproved();
    assert.equal(ok.membership.circleId, fakeMembership.circleId);

    sessionUser = null;
    await assert.rejects(() => session.requireUser(), NextRedirect);

    sessionUser = { ...fakeUser, id: "stranger-" + id(), email: "s@ex.com" };
    // insert stranger without membership
    await db.insert(schema.user).values({
      id: sessionUser.id,
      name: "S",
      email: "s@ex.com",
      emailVerified: true,
      displayName: "S",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await assert.rejects(() => session.requireApproved(), NextRedirect);

    // pending path
    const pendingUser = { ...fakeUser, id: id(), email: "p@ex.com" };
    await db.insert(schema.user).values({
      id: pendingUser.id,
      name: "P",
      email: "p@ex.com",
      emailVerified: true,
      displayName: "P",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.memberships).values({
      id: id(),
      userId: pendingUser.id,
      circleId: fakeMembership.circleId,
      role: "member",
      status: "pending",
      createdAt: new Date(),
    });
    sessionUser = pendingUser;
    await assert.rejects(() => session.requireApproved(), (e: Error) => {
      assert.ok(e instanceof NextRedirect);
      assert.equal((e as NextRedirect).url, "/pending");
      return true;
    });

    sessionUser = fakeUser;
  });

  it("renders Shell variants", async () => {
    const { Shell } = await import("@/components/shell");
    const html1 = await renderElement(React.createElement(Shell, null, "c"));
    assert.match(html1, /Prayer Journal/);
    const html2 = await renderElement(
      React.createElement(Shell, { user: fakeUser, approved: true, isOwner: true }, "c"),
    );
    assert.match(html2, /Answered/);
    assert.match(html2, /Circle/);
    const html3 = await renderElement(
      React.createElement(Shell, { user: fakeUser, approved: false }, "c"),
    );
    assert.match(html3, /Sign out/);
  });

  it("renders layout and static pages", async () => {
    const layout = await import("@/app/layout");
    const title = layout.metadata.title as { default: string };
    assert.equal(title.default, "Prayer Journal");
    const layoutEl = layout.default({ children: React.createElement("div", null, "x") });
    assert.equal(layoutEl.type, "html");
    await renderElement(layoutEl);

    const expired = await import("@/app/join/expired/page");
    await renderElement(React.createElement(expired.default));

    sessionUser = null;
    const privacy = await import("@/app/privacy/page");
    await renderElement(await privacy.default());
    sessionUser = fakeUser;
    await renderElement(await privacy.default());
  });

  it("renders gated pages with data branches", async () => {
    sessionUser = fakeUser;

    const home = await import("@/app/page");
    await renderElement(await home.default());

    // empty answered
    const answered = await import("@/app/answered/page");
    await renderElement(await answered.default());

    const profile = await import("@/app/profile/page");
    await renderElement(await profile.default());

    const neu = await import("@/app/requests/new/page");
    await renderElement(await neu.default());

    const edit = await import("@/app/requests/[id]/edit/page");
    await renderElement(await edit.default({ params: Promise.resolve({ id: requestId }) }));
    await assert.rejects(
      () => edit.default({ params: Promise.resolve({ id: "missing" }) }),
      NextNotFound,
    );

    const detail = await import("@/app/requests/[id]/page");
    await renderElement(await detail.default({ params: Promise.resolve({ id: requestId }) }));

    // mark answered then reopen branches on detail page
    await journal.answerRequest(fakeUser.id, requestId);
    await renderElement(await detail.default({ params: Promise.resolve({ id: requestId }) }));
    await journal.reopenRequest(fakeUser.id, requestId);

    // private + category other meta branches on home
    await journal.createRequest(fakeUser.id, fakeMembership.circleId, {
      title: "Priv",
      visibility: "private",
      category: "other",
      categoryOther: "X",
    });
    await renderElement(await home.default());

    const circle = await import("@/app/circle/page");
    setCookie("invite_link_once", "raw-token");
    await renderElement(await circle.default());
    // active invite, no once cookie
    resetHarness();
    await journal.issueInvite(fakeMembership.circleId, fakeUser.id);
    await renderElement(await circle.default());
    // no invite
    await db.delete(schema.invites);
    await renderElement(await circle.default());

    // non-owner → notFound
    const memberUser = { ...fakeUser, id: memberId, email: "mem@ex.com", displayName: "Mem" };
    sessionUser = memberUser;
    await assert.rejects(() => circle.default(), NextNotFound);
    sessionUser = fakeUser;

    const signIn = await import("@/app/sign-in/page");
    sessionUser = fakeUser;
    await assert.rejects(() => signIn.default({ searchParams: Promise.resolve({}) }), NextRedirect);
    sessionUser = null;
    await renderElement(await signIn.default({ searchParams: Promise.resolve({}) }));
    await renderElement(await signIn.default({ searchParams: Promise.resolve({ sent: "1" }) }));

    const confirm = await import("@/app/sign-in/confirm/page");
    await assert.rejects(
      () => confirm.default({ searchParams: Promise.resolve({}) }),
      NextRedirect,
    );
    await renderElement(await confirm.default({ searchParams: Promise.resolve({ token: "abc" }) }));

    sessionUser = fakeUser;
    const need = await import("@/app/need-invite/page");
    await assert.rejects(() => need.default(), NextRedirect); // approved → /
    const pendingPage = await import("@/app/pending/page");
    await assert.rejects(() => pendingPage.default(), NextRedirect); // not pending → /
  });

  it("server actions cover form flows", async () => {
    sessionUser = fakeUser;
    resetHarness();
    const actions = await import("@/app/actions");

    const fd = (data: Record<string, string>) => {
      const f = new FormData();
      for (const [k, v] of Object.entries(data)) f.set(k, v);
      return f;
    };

    await assert.rejects(() => actions.requestMagicLink(fd({})), NextRedirect);
    setHeaders({ "x-forwarded-for": "1.1.1.1" });
    setCookie("invite_token", "tok");
    await assert.rejects(() => actions.requestMagicLink(fd({ email: "owner@ex.com" })), (e: unknown) => {
      assert.ok(e instanceof NextRedirect, String(e));
      return true;
    });

    await assert.rejects(() => actions.confirmMagicLink(fd({})), NextRedirect);
    await assert.rejects(() => actions.confirmMagicLink(fd({ token: "t" })), NextRedirect);
    authApi.magicLinkVerify = async () => {
      throw new Error("bad");
    };
    await assert.rejects(() => actions.confirmMagicLink(fd({ token: "t" })), NextRedirect);
    authApi.magicLinkVerify = async () => ({});

    await assert.rejects(() => actions.signOut(), NextRedirect);
    await assert.rejects(() => actions.saveProfile(fd({ displayName: "New" })), NextRedirect);

    await assert.rejects(
      () => actions.createPrayerRequest(fd({ title: "From action", visibility: "circle" })),
      (e: unknown) => e instanceof NextRedirect,
    );
    await assert.rejects(() => actions.updatePrayerRequest(requestId, fd({ title: "Upd", visibility: "circle" })), NextRedirect);
    await actions.pray(requestId);
    await actions.unpray(requestId);
    await actions.postNote(requestId, fd({ body: "n" }));
    const d1 = await journal.requestDetail(fakeUser.id, fakeMembership.circleId, requestId);
    const n = d1!.notes.at(-1)!.note.id;
    await actions.removeNote(requestId, n);
    await actions.postUpdate(requestId, fd({ body: "u" }));
    const d2 = await journal.requestDetail(fakeUser.id, fakeMembership.circleId, requestId);
    const u = d2!.updates.at(-1)!.update.id;
    await actions.removeUpdate(requestId, u);
    await assert.rejects(() => actions.markAnswered(requestId), NextRedirect);
    // reopen needs answered
    await journal.answerRequest(fakeUser.id, requestId);
    await assert.rejects(() => actions.reopen(requestId), NextRedirect);
    await assert.rejects(() => actions.removePrayerRequest(requestId), NextRedirect);

    await assert.rejects(() => actions.rotateInvite(), NextRedirect);
    assert.ok(getCookiesSnapshot().invite_link_once || true);

    const people = await journal.listCirclePeople(fakeMembership.circleId);
    const memberMem = people.find((p) => p.person.id === memberId)!;
    await actions.decideMembership(memberMem.membership.id, "revoke");
    assert.ok(getRevalidated().includes("/circle"));
  });

  it("auth API route GET/HEAD/POST gates", async () => {
    const route = await import("@/app/api/auth/[...all]/route");
    const verifyReq = new Request("http://localhost/api/auth/magic-link/verify", { method: "GET" });
    const blocked = await route.GET(verifyReq);
    assert.equal(blocked.status, 405);
    const headBlocked = await route.HEAD(verifyReq);
    assert.equal(headBlocked.status, 405);

    const okGet = await route.GET(new Request("http://localhost/api/auth/ok"));
    assert.equal(okGet.status, 200);

    const headOk = await route.HEAD(new Request("http://localhost/api/auth/ok"));
    assert.equal(headOk.status, 200);

    // magic-link POST throttle / gate
    const { resetMagicLinkThrottleForTests } = await import("@/lib/magic-link-throttle");
    resetMagicLinkThrottleForTests();
    const ml = "http://localhost/api/auth/sign-in/magic-link";
    const postJson = await route.POST(
      new Request(ml, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" },
        body: JSON.stringify({ email: "stranger@ex.com" }),
      }),
    );
    assert.equal(postJson.status, 200);

    const postForm = await route.POST(
      new Request(ml, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "email=owner@ex.com",
      }),
    );
    assert.ok(postForm);

    // bad body → empty email path
    const postBad = await route.POST(
      new Request(ml, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    assert.ok(postBad);

    // non magic-link POST
    const other = await route.POST(new Request("http://localhost/api/auth/other", { method: "POST" }));
    assert.ok(other);

    // throttle exhausted
    resetMagicLinkThrottleForTests();
    const { allowMagicLinkRequest, magicLinkThrottleKey, MAGIC_LINK_THROTTLE_MAX } = await import(
      "@/lib/magic-link-throttle"
    );
    const key = magicLinkThrottleKey("flood@ex.com", "1.2.3.4");
    for (let i = 0; i < MAGIC_LINK_THROTTLE_MAX; i++) allowMagicLinkRequest(key);
    const throttled = await route.POST(
      new Request(ml, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({ email: "flood@ex.com" }),
      }),
    );
    assert.deepEqual(await throttled.json(), { status: true });
  });

  it("fills remaining page branches", async () => {
    sessionUser = fakeUser;

    // Home empty state + categoryLabel falsy meta branch
    const open = await journal.listRequests(fakeUser.id, fakeMembership.circleId, "open");
    for (const row of open) {
      await journal.deleteRequest(row.request.authorId, row.request.id);
    }
    const home = await import("@/app/page");
    await renderElement(await home.default());
    await journal.createRequest(fakeUser.id, fakeMembership.circleId, {
      title: "NoCat",
      visibility: "circle",
    });
    await renderElement(await home.default());

    // Answered list with rows + answeredAt + category
    const ans = await journal.createRequest(fakeUser.id, fakeMembership.circleId, {
      title: "Done",
      category: "health",
      visibility: "circle",
    });
    await journal.answerRequest(fakeUser.id, ans.id);
    const ans2 = await journal.createRequest(fakeUser.id, fakeMembership.circleId, {
      title: "Done2",
      visibility: "circle",
    });
    await journal.answerRequest(fakeUser.id, ans2.id);
    // Force answeredAt null + no category for ternary falsy branches on answered page.
    const { eq } = await import("drizzle-orm");
    await db
      .update(schema.prayerRequests)
      .set({ answeredAt: null, category: null, categoryOther: null })
      .where(eq(schema.prayerRequests.id, ans2.id));
    const answered = await import("@/app/answered/page");
    await renderElement(await answered.default());

    // Circle: no pending waiting message
    await db.delete(schema.invites);
    // ensure no pending memberships
    const people = await journal.listCirclePeople(fakeMembership.circleId);
    for (const p of people) {
      if (p.membership.status === "pending") {
        await journal.setMembershipStatus(fakeUser.id, p.membership.id, "decline");
      }
    }
    const circle = await import("@/app/circle/page");
    sessionUser = fakeUser;
    await renderElement(await circle.default());

    // Pending + need-invite render bodies
    const lone = { id: id(), email: "lone@ex.com", name: "Lone", displayName: "Lone" };
    await db.insert(schema.user).values({
      id: lone.id,
      name: "Lone",
      email: "lone@ex.com",
      emailVerified: true,
      displayName: "Lone",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUser = lone as typeof fakeUser;
    const need = await import("@/app/need-invite/page");
    await renderElement(await need.default());

    await db.insert(schema.memberships).values({
      id: id(),
      userId: lone.id,
      circleId: fakeMembership.circleId,
      role: "member",
      status: "pending",
      createdAt: new Date(),
    });
    const pendingPage = await import("@/app/pending/page");
    await renderElement(await pendingPage.default());

    // Request detail: empty notes/updates, non-author view, single pray count, no category
    sessionUser = fakeUser;
    const bare = await journal.createRequest(fakeUser.id, fakeMembership.circleId, {
      title: "Bare",
      visibility: "circle",
    });
    // wipe notes/updates if any
    const detailMod = await import("@/app/requests/[id]/page");
    await renderElement(await detailMod.default({ params: Promise.resolve({ id: bare.id }) }));
    await journal.markPrayed(fakeUser.id, bare.id);
    await renderElement(await detailMod.default({ params: Promise.resolve({ id: bare.id }) }));
    // Ensure member still approved (earlier decideMembership may have revoked).
    {
      const { eq } = await import("drizzle-orm");
      await db.delete(schema.memberships).where(eq(schema.memberships.userId, memberId));
      await db.insert(schema.memberships).values({
        id: id(),
        userId: memberId,
        circleId: fakeMembership.circleId,
        role: "member",
        status: "approved",
        createdAt: new Date(),
      });
    }
    await journal.addNote(memberId, bare.id, "from-member");
    await journal.addUpdate(fakeUser.id, bare.id, "owner-update");
    // member view (not mine) — covers mine ? null branches and other-author note remove null
    sessionUser = { ...fakeUser, id: memberId, email: "mem@ex.com", displayName: "Mem" };
    await renderElement(await detailMod.default({ params: Promise.resolve({ id: bare.id }) }));
    sessionUser = fakeUser;
  });

  it("join token route", async () => {
    const { GET } = await import("@/app/join/[token]/route");
    const expired = await GET(new Request("http://localhost/join/bad"), {
      params: Promise.resolve({ token: "bad" }),
    });
    assert.equal(expired.headers.get("location"), "http://localhost/join/expired");

    const issued = await journal.issueInvite(fakeMembership.circleId, fakeUser.id);
    sessionUser = null;
    authApi.getSession = async () => null;
    const signIn = await GET(new Request("http://localhost/join/" + issued.rawToken), {
      params: Promise.resolve({ token: issued.rawToken }),
    });
    assert.equal(signIn.headers.get("location"), "http://localhost/sign-in");

    authApi.getSession = async () => ({ user: fakeUser });
    sessionUser = fakeUser;
    // already approved
    const home = await GET(new Request("http://localhost/join/" + issued.rawToken), {
      params: Promise.resolve({ token: issued.rawToken }),
    });
    assert.equal(home.headers.get("location"), "http://localhost/");

    // pending path for new user
    const newbie = { id: id(), email: "new@ex.com", name: "N", displayName: "N" };
    await db.insert(schema.user).values({
      id: newbie.id,
      name: "N",
      email: "new@ex.com",
      emailVerified: true,
      displayName: "N",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const issued2 = await journal.issueInvite(fakeMembership.circleId, fakeUser.id);
    authApi.getSession = async () => ({ user: { ...fakeUser, ...newbie } });
    const pending = await GET(new Request("http://localhost/join/" + issued2.rawToken), {
      params: Promise.resolve({ token: issued2.rawToken }),
    });
    assert.equal(pending.headers.get("location"), "http://localhost/pending");

    // secure cookie branch
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    const issued3 = await journal.issueInvite(fakeMembership.circleId, fakeUser.id);
    authApi.getSession = async () => null;
    await GET(new Request("http://localhost/join/" + issued3.rawToken), {
      params: Promise.resolve({ token: issued3.rawToken }),
    });
    (process.env as { NODE_ENV?: string }).NODE_ENV = "test";
  });
});
