#!/usr/bin/env node
/**
 * Decide which unit tests / Stryker mutate targets to run for a PR (or push).
 *
 * Usage:
 *   node scripts/ci-changed.mjs mode=plan|tests|mutate|mutate-tests|full?
 *   CI_BASE_SHA / CI_HEAD_SHA optional (defaults: origin/main...HEAD for PRs)
 *
 * Prints:
 *   plan         -> JSON { mode, testFiles, mutateFiles, mutateTestFiles, reason }
 *   tests        -> newline-separated unit test files (or FULL)
 *   mutate       -> comma-separated Stryker mutate paths (or FULL)
 *   mutate-tests -> newline-separated tests Stryker should run for those mutants
 * Exit 0 always for plan/tests/mutate when skip; exit 2 on unexpected error.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Keep in sync with stryker.config.mjs `mutate` (src/lib only; skip UI + excluded modules). */
export const STRYKER_EXCLUDED = new Set([
  "src/lib/auth-client.ts",
  "src/lib/auth.ts",
  "src/lib/schema.ts",
  "src/lib/db.ts",
]);

export function isSource(f) {
  return (
    f.startsWith("src/") &&
    (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".mjs") || f.endsWith(".js")) &&
    !f.includes(".test.") &&
    !f.startsWith("src/test/")
  );
}

export function isTest(f) {
  return (f.startsWith("src/") || f.startsWith("scripts/")) && f.includes(".test.");
}

export function isMutateTarget(f) {
  return (
    f.startsWith("src/lib/") &&
    f.endsWith(".ts") &&
    !f.includes(".test.") &&
    !STRYKER_EXCLUDED.has(f)
  );
}

export function forceFull(files) {
  // Full suite = product/test harness may have changed.
  // Do NOT force full for Actions YAML / docs / gitignore-only PRs
  // (e.g. adding gitleaks) — those get mode=skip + light required check.
  const triggers = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "stryker.config.mjs",
    ".c8rc.json",
    "next.config.ts",
    "scripts/ci-changed.mjs",
  ];
  return files.some((f) => triggers.includes(f) || f.startsWith("scripts/"));
}

export function relatedTests(sourceFile, { exists = fs.existsSync, listDir = fs.readdirSync } = {}) {
  const dir = path.dirname(sourceFile);
  const base = path.basename(sourceFile).replace(/\.(tsx?|mjs|js)$/, "");
  const candidates = [];
  try {
    for (const name of listDir(dir)) {
      if (!name.includes(".test.")) continue;
      if (name === `${base}.test.ts` || name.startsWith(`${base}.`)) {
        candidates.push(path.join(dir, name));
      }
    }
  } catch {
    /* missing dir */
  }
  if (sourceFile.startsWith("src/app/") || sourceFile === "src/middleware.ts") {
    const appCov = "src/app/app-coverage.test.ts";
    if (exists(appCov)) candidates.push(appCov);
  }
  return [...new Set(candidates)].filter((p) => exists(p));
}

function mutationKillTests(exists = fs.existsSync) {
  return ["src/lib/mutation-kill.test.ts", "src/lib/mutation-kill-db.test.ts"].filter(exists);
}

export function planFromChangedFiles(files, { exists = fs.existsSync, listDir = fs.readdirSync } = {}) {
  if (files.length === 0) {
    return { mode: "skip", testFiles: [], mutateFiles: [], mutateTestFiles: [], reason: "no file changes detected" };
  }
  if (forceFull(files)) {
    return {
      mode: "full",
      testFiles: ["FULL"],
      mutateFiles: ["FULL"],
      mutateTestFiles: ["FULL"],
      reason: "deps or test-harness config changed",
      changed: files,
    };
  }

  const sources = files.filter(isSource);
  const testsChanged = files.filter(isTest);
  const testSet = new Set(testsChanged);
  for (const s of sources) {
    for (const t of relatedTests(s, { exists, listDir })) testSet.add(t);
  }
  const mutateFiles = sources.filter((f) => isMutateTarget(f) && exists(f));
  const testFiles = [...testSet].filter((p) => exists(p)).sort();
  const mutateTestSet = new Set();
  for (const f of mutateFiles) {
    for (const t of relatedTests(f, { exists, listDir })) mutateTestSet.add(t);
  }
  if (mutateFiles.length > 0) {
    for (const t of mutationKillTests(exists)) mutateTestSet.add(t);
  }
  const mutateTestFiles = [...mutateTestSet].filter((p) => exists(p)).sort();

  if (testFiles.length === 0 && mutateFiles.length === 0) {
    return {
      mode: "skip",
      testFiles: [],
      mutateFiles: [],
      mutateTestFiles: [],
      reason: "no src/harness changes (docs, workflow YAML, gitignore, etc.)",
      changed: files,
    };
  }
  return {
    mode: "partial",
    testFiles,
    mutateFiles,
    mutateTestFiles,
    reason: "src changes — scoped tests/mutation",
    changed: files,
  };
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

export function listChangedFiles({ staged = false } = {}) {
  if (staged) {
    const out = sh("git diff --cached --name-only --diff-filter=ACMR");
    return out ? out.split("\n").filter(Boolean) : [];
  }
  return changedFiles();
}

function changedFiles() {
  const base =
    process.env.CI_BASE_SHA ||
    process.env.GITHUB_BASE_SHA ||
    process.env.GITHUB_EVENT_BEFORE ||
    "";
  const head = process.env.CI_HEAD_SHA || process.env.GITHUB_SHA || "HEAD";

  let diffRange;
  if (process.env.GITHUB_EVENT_NAME === "pull_request" && process.env.GITHUB_BASE_REF) {
    const baseRef = `origin/${process.env.GITHUB_BASE_REF}`;
    try {
      sh(`git rev-parse --verify ${baseRef}`);
      const mb = sh(`git merge-base ${baseRef} HEAD`);
      diffRange = `${mb}...HEAD`;
    } catch {
      diffRange = `${baseRef}...HEAD`;
    }
  } else if (base && base !== "0000000000000000000000000000000000000000") {
    diffRange = `${base}...${head}`;
  } else {
    try {
      const mb = sh("git merge-base origin/main HEAD");
      diffRange = `${mb}...HEAD`;
    } catch {
      diffRange = "HEAD~1...HEAD";
    }
  }

  const out = sh(`git diff --name-only --diff-filter=ACMR ${diffRange}`);
  return out ? out.split("\n").filter(Boolean) : [];
}

export function printMode(mode, result) {
  if (mode === "plan") {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }
  if (mode === "tests") {
    if (result.mode === "skip") console.log("");
    else if (result.mode === "full") console.log("FULL");
    else console.log(result.testFiles.join("\n"));
    return 0;
  }
  if (mode === "mutate") {
    if (result.mode === "skip") console.log("");
    else if (result.mode === "full") console.log("FULL");
    else console.log(result.mutateFiles.join(","));
    return 0;
  }
  if (mode === "mutate-tests") {
    if (result.mode === "skip") console.log("");
    else if (result.mode === "full") console.log("FULL");
    else console.log(result.mutateTestFiles.join("\n"));
    return 0;
  }
  console.error(`unknown mode: ${mode}`);
  return 2;
}

const invokedAsCli =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsCli) {
  const cliMode = (process.argv[2] || "plan").replace(/^mode=/, "");
  process.exit(printMode(cliMode, planFromChangedFiles(changedFiles())));
}
