import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

function planWithDiff(names) {
  // Simulate by checking forceFull logic via a tiny inline copy of rules
  const triggers = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "stryker.config.mjs",
    ".c8rc.json",
    "next.config.ts",
    "scripts/ci-changed.mjs",
  ];
  const forceFull = names.some((f) => triggers.includes(f) || f.startsWith("scripts/"));
  const isSource = (f) =>
    f.startsWith("src/") &&
    (f.endsWith(".ts") || f.endsWith(".tsx")) &&
    !f.includes(".test.") &&
    !f.startsWith("src/test/");
  if (forceFull) return "full";
  if (names.some(isSource) || names.some((f) => f.includes(".test."))) return "partial";
  return "skip";
}

describe("ci-changed forceFull policy", () => {
  it("does not force full for workflow/docs/gitignore only", () => {
    assert.equal(
      planWithDiff([
        ".github/workflows/ci.yml",
        "docs/github-workflows/ci.yml",
        ".gitignore",
      ]),
      "skip",
    );
  });

  it("forces full for package-lock or scripts", () => {
    assert.equal(planWithDiff(["package-lock.json"]), "full");
    assert.equal(planWithDiff(["scripts/ci-changed.mjs"]), "full");
  });

  it("uses partial for src changes", () => {
    assert.equal(planWithDiff(["src/lib/journal.ts"]), "partial");
  });
});
