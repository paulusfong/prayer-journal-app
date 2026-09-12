import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it, mock } from "node:test";
import { NextRedirect, installNextMocks, resetHarness } from "../test/next-harness";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-sess-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_SECRET = "s".repeat(32);

installNextMocks();

let sessionUser: { id: string; email: string; name: string; displayName: string } | null = null;

mock.module("./auth", {
  namedExports: {
    auth: {
      api: {
        getSession: async () => (sessionUser ? { user: sessionUser } : null),
      },
    },
  },
});

describe("session redirects", async () => {
  const { client, db } = await import("./db");
  const schema = await import("./schema");
  const { id } = await import("./ids");
  const journal = await import("./journal");
  const session = await import("./session");

  const ownerId = id();

  before(async () => {
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    await db.insert(schema.user).values({
      id: ownerId,
      name: "O",
      email: "o@ex.com",
      emailVerified: true,
      displayName: "O",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await journal.bootstrapIfNeeded(ownerId);
  });

  it("requireUser redirects to /sign-in when logged out", async () => {
    resetHarness();
    sessionUser = null;
    await assert.rejects(() => session.requireUser(), (e: unknown) => {
      assert.ok(e instanceof NextRedirect);
      assert.equal((e as NextRedirect).url, "/sign-in");
      return true;
    });
  });

  it("requireApproved redirects to /need-invite when no membership", async () => {
    resetHarness();
    const stranger = id();
    await db.insert(schema.user).values({
      id: stranger,
      name: "S",
      email: "s2@ex.com",
      emailVerified: true,
      displayName: "S",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionUser = { id: stranger, email: "s2@ex.com", name: "S", displayName: "S" };
    await assert.rejects(() => session.requireApproved(), (e: unknown) => {
      assert.ok(e instanceof NextRedirect);
      assert.equal((e as NextRedirect).url, "/need-invite");
      return true;
    });
  });

  it("requireApproved redirects to /pending when pending (not always)", async () => {
    resetHarness();
    const pendingUser = id();
    await db.insert(schema.user).values({
      id: pendingUser,
      name: "P",
      email: "pend@ex.com",
      emailVerified: true,
      displayName: "P",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const mem = await journal.getApprovedMembership(ownerId);
    await db.insert(schema.memberships).values({
      id: id(),
      userId: pendingUser,
      circleId: mem!.circleId,
      role: "member",
      status: "pending",
      createdAt: new Date(),
    });
    sessionUser = { id: pendingUser, email: "pend@ex.com", name: "P", displayName: "P" };
    await assert.rejects(() => session.requireApproved(), (e: unknown) => {
      assert.ok(e instanceof NextRedirect);
      assert.equal((e as NextRedirect).url, "/pending");
      return true;
    });

    // Approved owner must NOT be forced to pending (kills `if (true) redirect pending`).
    sessionUser = { id: ownerId, email: "o@ex.com", name: "O", displayName: "O" };
    const ok = await session.requireApproved();
    assert.equal(ok.user.id, ownerId);
  });
});
