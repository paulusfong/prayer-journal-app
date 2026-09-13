import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

describe("open-pr", () => {
  it("is wired as npm run open-pr and documents the check:pr gate", () => {
    const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    assert.equal(pkg.scripts["open-pr"], "node scripts/open-pr.mjs");
    const src = fs.readFileSync(new URL("./open-pr.mjs", import.meta.url), "utf8");
    assert.match(src, /check:pr/);
    assert.match(src, /gh pr create|pr", "create/);
  });
});
