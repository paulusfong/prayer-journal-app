const scopedMutate = process.env.STRYKER_MUTATE?.split(",").map((s) => s.trim()).filter(Boolean);
const scopedTestCommand = process.env.STRYKER_TEST_COMMAND;

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  testRunner: "command",
  commandRunner: {
    // Fast unit tests only (same as npm test). Partial CI sets STRYKER_TEST_COMMAND.
    command: scopedTestCommand || "npm test",
  },
  // Command test runner only supports "off". Partial CI scopes tests via STRYKER_TEST_COMMAND.
  coverageAnalysis: "off",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  // Strong signal on business/security logic under src/lib; skip tests and thin UI shells.
  // Partial CI sets STRYKER_MUTATE to the changed allowlisted files.
  mutate: scopedMutate?.length
    ? scopedMutate
    : [
        "src/lib/**/*.ts",
        "!src/lib/**/*.test.ts",
        // Client-only better-auth wrapper — little meaningful mutation signal.
        "!src/lib/auth-client.ts",
        // better-auth wiring / side-effectful config object — prefer testing gates & journal.
        "!src/lib/auth.ts",
        // Drizzle schema table defs produce mostly equivalent/untestable mutants.
        "!src/lib/schema.ts",
        // DB client bootstrap.
        "!src/lib/db.ts",
      ],
  reporters: ["progress", "clear-text", "html"],
  // Aim to break unless essentially all non-equivalent mutants are killed.
  thresholds: {
    high: 100,
    low: 100,
    break: 100,
  },
  timeoutMS: 60000,
  concurrency: 4,
};

export default config;
