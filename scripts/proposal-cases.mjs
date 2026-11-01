#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A plugins release that changes the ideate skill, the panel or the card grammar runs the fixed proposal cases first (RULE.DEVEX.AGENT.169)
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//     node scripts/proposal-cases.mjs [--cwd <the workspace root>]
//
// Runs each case in tests/proposal-cases/*.json as a fresh, non-interactive agent session and prints a verdict for each. A case that fails
// prints what the fresh agent proposed instead, and the command exits 1. `release-plugins.mjs prepare` runs it when a release changes the
// ideate skill, the panel or the card grammar; it is not part of the test run, because it calls a model.

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { claudeSession, loadCases, runCases } from "./lib/proposal-cases.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Runs the cases and prints them; returns whether every one passed. */
export function runAndReport(cwd, session = (prompt) => claudeSession(prompt, cwd)) {
  const results = runCases(loadCases(join(ROOT, "tests", "proposal-cases")), session);
  for (const one of results) {
    console.log(`${one.passed ? "PASS" : "FAIL"}  ${one.id}`);
    if (!one.passed) {
      for (const failure of one.failures) console.log(`      ${failure}`);
      console.log(`      the fresh agent proposed:\n${one.text.split("\n").map((line) => `        ${line}`).join("\n")}`);
    }
  }
  return results.every((one) => one.passed);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--cwd");
  const cwd = at >= 0 ? resolve(process.argv[at + 1]) : process.env.SPN_WORKSPACE ? resolve(process.env.SPN_WORKSPACE) : dirname(ROOT);
  process.exit(runAndReport(cwd) ? 0 : 1);
}
