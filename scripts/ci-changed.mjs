#!/usr/bin/env node
/**
 * Decide which unit tests / Stryker mutate targets to run for a PR (or push).
 *
 * Usage:
 *   node scripts/ci-changed.mjs mode=plan|tests|mutate|full?
 *   CI_BASE_SHA / CI_HEAD_SHA optional (defaults: origin/main...HEAD for PRs)
 *
 * Prints:
 *   plan  -> JSON { mode, testFiles, mutateFiles, reason }
 *   tests -> space-separated test file paths (or empty => skip)
 *   mutate -> comma-separated mutate globs for stryker (or empty => skip)
 * Exit 0 always for plan/tests/mutate when skip; exit 2 on unexpected error.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const mode = (process.argv[2] || "plan").replace(/^mode=/, "");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
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
    // actions/checkout with fetch-depth 0: compare merge-base to HEAD
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
    // local fallback
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

function isSource(f) {
  return (
    f.startsWith("src/") &&
    (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".mjs") || f.endsWith(".js")) &&
    !f.includes(".test.") &&
    !f.startsWith("src/test/")
  );
}

function isTest(f) {
  return f.startsWith("src/") && f.includes(".test.");
}

function relatedTests(sourceFile) {
  const dir = path.dirname(sourceFile);
  const base = path.basename(sourceFile).replace(/\.(tsx?|mjs|js)$/, "");
  const candidates = [];
  // exact / prefix matches: journal.ts -> journal.*.test.ts, journal.test.ts
  try {
    for (const name of fs.readdirSync(dir)) {
      if (!name.includes(".test.")) continue;
      if (name === `${base}.test.ts` || name.startsWith(`${base}.`)) {
        candidates.push(path.join(dir, name));
      }
    }
  } catch {
    /* missing dir */
  }
  // also app-coverage when app files change
  if (sourceFile.startsWith("src/app/") || sourceFile === "src/middleware.ts") {
    const appCov = "src/app/app-coverage.test.ts";
    if (fs.existsSync(appCov)) candidates.push(appCov);
  }
  return [...new Set(candidates)].filter((p) => fs.existsSync(p));
}

function forceFull(files) {
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

const files = changedFiles();
let result;

if (files.length === 0) {
  result = { mode: "skip", testFiles: [], mutateFiles: [], reason: "no file changes detected" };
} else if (forceFull(files)) {
  result = {
    mode: "full",
    testFiles: ["FULL"],
    mutateFiles: ["FULL"],
    reason: "deps or test-harness config changed",
    changed: files,
  };
} else {
  const sources = files.filter(isSource);
  const testsChanged = files.filter(isTest);
  const testSet = new Set(testsChanged);
  for (const s of sources) {
    for (const t of relatedTests(s)) testSet.add(t);
  }
  // mutate only existing source files that changed (not tests)
  const mutateFiles = sources.filter((f) => fs.existsSync(f));
  const testFiles = [...testSet].filter((f) => fs.existsSync(f)).sort();

  if (testFiles.length === 0 && mutateFiles.length === 0) {
    result = {
      mode: "skip",
      testFiles: [],
      mutateFiles: [],
      reason: "no src/harness changes (docs, workflow YAML, gitignore, etc.)",
      changed: files,
    };
  } else {
    result = {
      mode: "partial",
      testFiles,
      mutateFiles,
      reason: "src changes — scoped tests/mutation",
      changed: files,
    };
  }
}

if (mode === "plan") {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (mode === "tests") {
  if (result.mode === "skip") {
    console.log("");
    process.exit(0);
  }
  if (result.mode === "full") {
    console.log("FULL");
    process.exit(0);
  }
  console.log(result.testFiles.join("\n"));
  process.exit(0);
}

if (mode === "mutate") {
  if (result.mode === "skip") {
    console.log("");
    process.exit(0);
  }
  if (result.mode === "full") {
    console.log("FULL");
    process.exit(0);
  }
  console.log(result.mutateFiles.join(","));
  process.exit(0);
}

console.error(`unknown mode: ${mode}`);
process.exit(2);
