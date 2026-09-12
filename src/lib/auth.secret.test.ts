import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

describe("auth secret", () => {
  it("refuses to load without BETTER_AUTH_SECRET", () => {
    const testdir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-auth-secret-"));
    const env = { ...process.env, DATABASE_URL: `file:${path.join(testdir, "t.sqlite")}` };
    delete env.BETTER_AUTH_SECRET;

    const result = spawnSync(process.execPath, ["--import", "tsx", "-e", 'import("./src/lib/auth.ts")'], {
      cwd: process.cwd(),
      env,
      encoding: "utf8",
    });

    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}${result.stdout}`, /BETTER_AUTH_SECRET is required/);
  });
});
