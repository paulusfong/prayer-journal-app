/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  testRunner: "command",
  commandRunner: {
    command: "npm test",
  },
  coverageAnalysis: "off",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  mutate: [
    "src/lib/dateUtils.ts",
    "src/lib/ids.ts",
    "src/lib/labels.ts",
    "src/lib/staleUtils.ts",
  ],
  reporters: ["progress", "clear-text", "html"],
  thresholds: {
    high: 90,
    low: 80,
    break: 80,
  },
};

export default config;
