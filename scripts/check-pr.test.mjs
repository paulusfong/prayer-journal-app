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
  it("runs nothing on skip", () => {
    assert.deepEqual(stepsForPlan({ mode: "skip", testFiles: [], mutateFiles: [] }), []);
  });

  it("runs scoped unit + mutation on partial", () => {
    const steps = stepsForPlan({
      mode: "partial",
      testFiles: ["src/lib/request-fields.test.ts"],
      mutateFiles: ["src/lib/request-fields.ts"],
      mutateTestFiles: ["src/lib/request-fields.test.ts", "src/lib/mutation-kill.test.ts"],
    });
    assert.equal(steps.length, 2);
    assert.equal(steps[0].label, "Unit tests (changed / related)");
    assert.ok(steps[0].args.includes("src/lib/request-fields.test.ts"));
    assert.equal(steps[1].cmd, "npx");
    assert.equal(steps[1].env.STRYKER_MUTATE, "src/lib/request-fields.ts");
    assert.match(steps[1].env.STRYKER_TEST_COMMAND, /request-fields\.test\.ts/);
    assert.match(steps[1].env.STRYKER_TEST_COMMAND, /mutation-kill\.test\.ts/);
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
    assert.equal(steps.length, 1);
    assert.equal(steps[0].cmd, "node");
  });

  it("skips mutation when partial has no mutate targets", () => {
    const steps = stepsForPlan({
      mode: "partial",
      testFiles: ["src/app/app-coverage.test.ts"],
      mutateFiles: [],
      mutateTestFiles: [],
    });
    assert.equal(steps.length, 1);
    assert.equal(steps[0].label, "Unit tests (changed / related)");
  });

  it("mirrors CI full suite unless unit-only", () => {
    const full = stepsForPlan({ mode: "full" });
    assert.deepEqual(
      full.map((s) => s.label),
      ["Unit tests (full)", "Coverage gate (full)", "Mutation (full)"],
    );
    const unit = stepsForPlan({ mode: "full" }, { unitOnly: true });
    assert.deepEqual(
      unit.map((s) => s.label),
      ["Unit tests (full)"],
    );
  });
});
