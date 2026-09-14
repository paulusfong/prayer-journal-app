#!/usr/bin/env node
/**
 * Open a GitHub PR only after the same scoped checks as CI (including mutation).
 *
 *   npm run open-pr -- --title "…" --body "…"
 *   npm run open-pr -- --fill
 *
 * Extra args after `--` are passed to `gh pr create`.
 * SKIP_PR_CHECK=1 skips the local gate (not recommended).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function main(argv) {
  console.log("→ Local CI gate (npm run check:pr) before opening PR…");
  run("npm", ["run", "check:pr"], { env: process.env });

  const ghArgs = ["pr", "create", ...argv];
  console.log(`\n→ gh ${ghArgs.join(" ")}`);
  run("gh", ghArgs);
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
