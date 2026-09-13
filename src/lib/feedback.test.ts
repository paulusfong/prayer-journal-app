import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-fb-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

describe("app feedback", async () => {
  const { client, db } = await import("./db");
  const schema = await import("./schema");
  const { id } = await import("./ids");
  const journal = await import("./journal");
  const feedback = await import("./feedback");

  const ownerId = id();
  const memberId = id();
  const strangerId = id();

  before(async () => {
    const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
    for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    const now = new Date();
    await db.insert(schema.user).values([
      { id: ownerId, name: "O", email: "o@ex.com", emailVerified: true, displayName: "Owner", createdAt: now, updatedAt: now },
      { id: memberId, name: "M", email: "m@ex.com", emailVerified: true, displayName: "Mem", createdAt: now, updatedAt: now },
      { id: strangerId, name: "S", email: "s@ex.com", emailVerified: true, displayName: "Str", createdAt: now, updatedAt: now },
    ]);
    await journal.bootstrapIfNeeded(ownerId);
    const mem = await journal.getApprovedMembership(ownerId);
    await db.insert(schema.memberships).values({
      id: id(),
      userId: memberId,
      circleId: mem!.circleId,
      role: "member",
      status: "approved",
      createdAt: now,
    });
  });

  it("parseFeedbackKind defaults unknown to comment", () => {
    assert.equal(feedback.parseFeedbackKind("feature"), "feature");
    assert.equal(feedback.parseFeedbackKind("comment"), "comment");
    assert.equal(feedback.parseFeedbackKind(""), "comment");
    assert.equal(feedback.parseFeedbackKind("other"), "comment");
  });

  it("rejects empty body and non-members", async () => {
    assert.equal(await feedback.addAppFeedback(strangerId, "comment", "hello"), false);
    assert.equal(await feedback.addAppFeedback(memberId, "comment", "   "), false);
    assert.deepEqual(await feedback.listAppFeedback(memberId), []);
    assert.deepEqual(await feedback.listAppFeedback(strangerId), []);
  });

  it("stores member feedback; only owner can list", async () => {
    assert.equal(await feedback.addAppFeedback(memberId, "feature", "  Dark mode  "), true);
    assert.equal(await feedback.addAppFeedback(ownerId, "nope", "Works on my phone"), true);
    // Kill: membership.role !== "owner" → false (must still hide list from members once rows exist).
    assert.deepEqual(await feedback.listAppFeedback(memberId), []);
    const rows = await feedback.listAppFeedback(ownerId);
    assert.equal(rows.length, 2);
    const feature = rows.find((r) => r.kind === "feature");
    const comment = rows.find((r) => r.kind === "comment");
    assert.equal(feature!.body, "Dark mode");
    assert.equal(feature!.authorName, "Mem");
    assert.equal(comment!.body, "Works on my phone");
  });

  it("truncates body to 2000 characters", async () => {
    const long = "x".repeat(2500);
    assert.equal(await feedback.addAppFeedback(memberId, "comment", long), true);
    const rows = await feedback.listAppFeedback(ownerId);
    const latest = rows.find((r) => r.body.startsWith("x"));
    assert.ok(latest);
    assert.equal(latest!.body.length, 2000);
    // Kill: .slice(0, 2000) removed — body would be 2500.
    assert.notEqual(latest!.body.length, 2500);
  });
});
