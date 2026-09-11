import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-boot-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;

describe("bootstrapIfNeeded singleton", async () => {
  const { client, db } = await import("./db");
  const { bootstrapIfNeeded, SINGLETON_CIRCLE_ID } = await import("./journal");
  const schema = await import("./schema");
  const { id } = await import("./ids");
  const { eq } = await import("drizzle-orm");

  const userA = id();
  const userB = id();

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
    await db.insert(schema.user).values([
      {
        id: userA,
        name: "Ada",
        email: "ada@example.com",
        emailVerified: true,
        displayName: "Ada",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: userB,
        name: "Bob",
        email: "bob@example.com",
        emailVerified: true,
        displayName: "Bob",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  it("creates exactly one circle under concurrent first-login", async () => {
    await Promise.all([bootstrapIfNeeded(userA), bootstrapIfNeeded(userB)]);

    const allCircles = await db.select().from(schema.circles);
    assert.equal(allCircles.length, 1);
    assert.equal(allCircles[0]?.id, SINGLETON_CIRCLE_ID);

    const owners = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.role, "owner"));
    assert.equal(owners.length, 1);
    assert.ok(owners[0]?.userId === userA || owners[0]?.userId === userB);
    assert.equal(owners[0]?.status, "approved");

    // Loser has no membership — invite gate still required.
    const loserId = owners[0]?.userId === userA ? userB : userA;
    const loserMemberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, loserId));
    assert.equal(loserMemberships.length, 0);
  });

  it("is a no-op once a circle already exists", async () => {
    const beforeCount = (await db.select().from(schema.circles)).length;
    await bootstrapIfNeeded(userB);
    const afterCount = (await db.select().from(schema.circles)).length;
    assert.equal(beforeCount, 1);
    assert.equal(afterCount, 1);
  });
});
