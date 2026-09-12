import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-auth-"));
process.env.DATABASE_URL = `file:${path.join(testdir, "t.sqlite")}`;
process.env.BETTER_AUTH_SECRET = "s".repeat(32);
process.env.BETTER_AUTH_URL = "http://localhost:3000";
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

describe("auth module wiring", async () => {
  const { client } = await import("./db");
  const sqlFile = fs.readFileSync(path.join(process.cwd(), "drizzle/0000_init.sql"), "utf8");
  for (const statement of sqlFile.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
    await client.execute(statement);
  }

  it("constructs betterAuth and exercises sendMagicLink mailer", async () => {
    const { auth } = await import("./auth");
    assert.ok(auth?.api);

    // Drive the magicLink plugin sendMagicLink callback (auth.ts lines 39–46).
    await auth.api.signInMagicLink({
      body: { email: "mailer@ex.com", callbackURL: "/" },
      headers: new Headers(),
    });
  });
});

describe("auth-client", () => {
  it("creates the browser auth client", async () => {
    const mod = await import("./auth-client");
    assert.ok(mod.authClient);
  });
});
