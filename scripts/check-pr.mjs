#!/usr/bin/env node
/**
 * Local CI mirror: scoped unit tests, and (unless --unit-only) scoped mutation.
 *
 *   node scripts/check-pr.mjs --pr              # vs origin/main (pre-push / before opening a PR)
 *   node scripts/check-pr.mjs --staged --unit-only   # staged files only (pre-commit)
 *
 * SKIP_PR_CHECK=1 skips. git commit/push --no-verify also skips the hook.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { listChangedFiles, planFromChangedFiles } from "./ci-changed.mjs";

const TEST_NODE_ARGS = [
  "--experimental-test-module-mocks",
  "--import",
  "tsx",
  "--import",
  "./src/test/register-css.mjs",
  "--test",
];

export function parseArgs(argv) {
  let source = "pr";
  let unitOnly = false;
  for (const a of argv) {
    if (a === "--pr") source = "pr";
    else if (a === "--staged") source = "staged";
    else if (a === "--unit-only") unitOnly = true;
    else if (a === "--help" || a === "-h") {
      return { source, unitOnly, help: true };
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return { source, unitOnly, help: false };
}

export function stepsForPlan(plan, { unitOnly = false } = {}) {
  const steps = [{ label: "ESLint", cmd: "npm", args: ["run", "lint"] }];
  if (plan.mode === "skip") return steps;
  if (plan.mode === "full") {
    steps.push({ label: "Unit tests (full)", cmd: "npm", args: ["test"] });
    if (!unitOnly) {
      steps.push({ label: "Coverage gate (full)", cmd: "npm", args: ["run", "test:coverage"] });
      steps.push({ label: "Mutation (full)", cmd: "npm", args: ["run", "test:mutation"] });
    }
    return steps;
  }
  if (plan.testFiles.length > 0) {
    steps.push({
      label: "Unit tests (changed / related)",
      cmd: "node",
      args: [...TEST_NODE_ARGS, ...plan.testFiles],
    });
  }
  if (!unitOnly && plan.mutateFiles.length > 0) {
    steps.push({
      label: "Mutation (changed sources only)",
      cmd: "npx",
      args: ["stryker", "run"],
      env: {
        STRYKER_MUTATE: plan.mutateFiles.join(","),
        STRYKER_TEST_COMMAND: ["node", ...TEST_NODE_ARGS, ...plan.mutateTestFiles].join(" "),
      },
    });
  }
  return steps;
}

function runStep(step) {
  console.log(`\n→ ${step.label}: ${step.cmd} ${step.args.join(" ")}`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    env: step.env ? { ...process.env, ...step.env } : process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(argv) {
  if (process.env.SKIP_PR_CHECK === "1") {
    console.log("SKIP_PR_CHECK=1 — skipping local CI check");
    return 0;
  }
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log("Usage: node scripts/check-pr.mjs [--pr|--staged] [--unit-only]");
    return 0;
  }
  const files = listChangedFiles({ staged: opts.source === "staged" });
  const plan = planFromChangedFiles(files);
  console.log(JSON.stringify({ source: opts.source, unitOnly: opts.unitOnly, ...plan }, null, 2));
  const steps = stepsForPlan(plan, { unitOnly: opts.unitOnly });
  if (steps.length === 0) {
    console.log(plan.reason || "nothing to run");
    return 0;
  }
  for (const step of steps) runStep(step);
  return 0;
}

const invokedAsCli =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsCli) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(2);
  }
}
