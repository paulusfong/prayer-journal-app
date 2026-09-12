import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  forceFull,
  isMutateTarget,
  planFromChangedFiles,
} from "./ci-changed.mjs";

const files = new Set([
  "src/lib/journal.ts",
  "src/lib/journal.coverage.test.ts",
  "src/lib/journal.authz.test.ts",
  "src/lib/request-fields.ts",
  "src/lib/request-fields.test.ts",
  "src/lib/mutation-kill.test.ts",
  "src/lib/mutation-kill-db.test.ts",
  "src/lib/schema.ts",
  "src/lib/schema.test.ts",
  "src/lib/auth.ts",
  "src/app/page.tsx",
  "src/app/app-coverage.test.ts",
  "src/components/shell.tsx",
]);

const exists = (f) => files.has(f);
const listDir = (dir) => {
  const prefix = `${dir}/`;
  return [...files]
    .filter((f) => f.startsWith(prefix) && !f.slice(prefix.length).includes("/"))
    .map((f) => f.slice(prefix.length));
};
const io = { exists, listDir };

describe("ci-changed forceFull policy", () => {
  it("does not force full for workflow/docs/gitignore only", () => {
    assert.equal(forceFull([".github/workflows/ci.yml", "docs/github-workflows/ci.yml", ".gitignore"]), false);
  });

  it("forces full for package-lock or scripts", () => {
    assert.equal(forceFull(["package-lock.json"]), true);
    assert.equal(forceFull(["scripts/ci-changed.mjs"]), true);
  });

  it("uses skip for workflow-only and partial for src", () => {
    assert.equal(planFromChangedFiles([".github/workflows/ci.yml"], io).mode, "skip");
    assert.equal(planFromChangedFiles(["src/lib/journal.ts"], io).mode, "partial");
  });
});

describe("stryker mutate allowlist", () => {
  it("mutates src/lib business modules only", () => {
    assert.equal(isMutateTarget("src/lib/journal.ts"), true);
    assert.equal(isMutateTarget("src/lib/request-fields.ts"), true);
    assert.equal(isMutateTarget("src/app/page.tsx"), false);
    assert.equal(isMutateTarget("src/components/shell.tsx"), false);
    assert.equal(isMutateTarget("src/lib/journal.coverage.test.ts"), false);
    assert.equal(isMutateTarget("src/lib/schema.ts"), false);
    assert.equal(isMutateTarget("src/lib/auth.ts"), false);
    assert.equal(isMutateTarget("src/lib/db.ts"), false);
  });

  it("scopes PR #18-style UI+lib diffs to lib mutate targets and lib tests", () => {
    const plan = planFromChangedFiles(
      [
        "src/app/page.tsx",
        "src/app/actions.ts",
        "src/components/shell.tsx",
        "src/lib/journal.ts",
        "src/lib/request-fields.ts",
        "src/lib/request-fields.test.ts",
        "public/icon.png",
      ],
      io,
    );
    assert.equal(plan.mode, "partial");
    assert.deepEqual(plan.mutateFiles, ["src/lib/journal.ts", "src/lib/request-fields.ts"]);
    assert.ok(plan.mutateTestFiles.includes("src/lib/journal.coverage.test.ts"));
    assert.ok(plan.mutateTestFiles.includes("src/lib/request-fields.test.ts"));
    assert.ok(plan.mutateTestFiles.includes("src/lib/mutation-kill.test.ts"));
    assert.equal(
      plan.mutateTestFiles.includes("src/app/app-coverage.test.ts"),
      false,
    );
  });

  it("skips mutation when only UI sources change", () => {
    const plan = planFromChangedFiles(["src/app/page.tsx", "src/components/shell.tsx"], io);
    assert.equal(plan.mode, "partial");
    assert.deepEqual(plan.mutateFiles, []);
    assert.deepEqual(plan.mutateTestFiles, []);
    assert.ok(plan.testFiles.includes("src/app/app-coverage.test.ts"));
  });
});
