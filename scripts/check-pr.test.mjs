import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs, stepsForPlan } from "./check-pr.mjs";

describe("check-pr parseArgs", () => {
  it("defaults to pr + mutation", () => {
    assert.deepEqual(parseArgs([]), { source: "pr", unitOnly: false, help: false });
  });

  it("accepts staged unit-only for pre-commit", () => {
    assert.deepEqual(parseArgs(["--staged", "--unit-only"]), {
      source: "staged",
      unitOnly: true,
      help: false,
    });
  });

  it("rejects unknown flags", () => {
    assert.throws(() => parseArgs(["--full"]), /unknown argument/);
  });
});

describe("check-pr stepsForPlan", () => {
  it("always runs repo-wide eslint first", () => {
    const skip = stepsForPlan({ mode: "skip", testFiles: [], mutateFiles: [] });
    assert.deepEqual(
      skip.map((s) => s.label),
      ["ESLint"],
    );
    assert.deepEqual(skip[0].args, ["run", "lint"]);
  });

  it("runs scoped unit + mutation on partial", () => {
    const steps = stepsForPlan({
      mode: "partial",
      testFiles: ["src/lib/request-fields.test.ts"],
      mutateFiles: ["src/lib/request-fields.ts"],
      mutateTestFiles: ["src/lib/request-fields.test.ts", "src/lib/mutation-kill.test.ts"],
    });
    assert.deepEqual(
      steps.map((s) => s.label),
      ["ESLint", "Unit tests (changed / related)", "Mutation (changed sources only)"],
    );
    assert.ok(steps[1].args.includes("src/lib/request-fields.test.ts"));
    assert.equal(steps[2].env.STRYKER_MUTATE, "src/lib/request-fields.ts");
  });

  it("omits mutation when unit-only (pre-commit)", () => {
    const steps = stepsForPlan(
      {
        mode: "partial",
        testFiles: ["src/lib/request-fields.test.ts"],
        mutateFiles: ["src/lib/request-fields.ts"],
        mutateTestFiles: ["src/lib/request-fields.test.ts"],
      },
      { unitOnly: true },
    );
    assert.deepEqual(
      steps.map((s) => s.label),
      ["ESLint", "Unit tests (changed / related)"],
    );
  });

  it("skips mutation when partial has no mutate targets", () => {
    const steps = stepsForPlan({
      mode: "partial",
      testFiles: ["src/app/app-coverage.test.ts"],
      mutateFiles: [],
      mutateTestFiles: [],
    });
    assert.deepEqual(
      steps.map((s) => s.label),
      ["ESLint", "Unit tests (changed / related)"],
    );
  });

  it("mirrors CI full suite unless unit-only", () => {
    const full = stepsForPlan({ mode: "full" });
    assert.deepEqual(
      full.map((s) => s.label),
      ["ESLint", "Unit tests (full)", "Coverage gate (full)", "Mutation (full)"],
    );
    const unit = stepsForPlan({ mode: "full" }, { unitOnly: true });
    assert.deepEqual(
      unit.map((s) => s.label),
      ["ESLint", "Unit tests (full)"],
    );
  });
});
