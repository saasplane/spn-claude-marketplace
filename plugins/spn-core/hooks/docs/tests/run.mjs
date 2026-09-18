#!/usr/bin/env node
// Every suite in this folder, in one command.
//
//     node run.mjs
//
// Each suite runs both the TypeScript check and the Python it replaced, and requires them to agree
// unless the case names a reason not to. Once the plugin reinstall deletes `hooks/scripts/`, the
// Python arm stops running and each case still asserts its own expectation.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const HERE = import.meta.dirname;
const suites = readdirSync(HERE).filter((f) => f.startsWith("t-") && f.endsWith(".mjs")).sort();

let failed = 0;
let cases = 0;
for (const suite of suites) {
  let tail = "";
  try {
    // stderr is DISCARDED, not inherited. `stop` writes its warnings there, so a suite exercising it
    // prints a fixture's findings into this summary as though they were this run's.
    tail = execFileSync(process.execPath, [resolve(HERE, suite)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .trimEnd().split("\n").at(-1).trim();
  } catch (error) {
    tail = String(error.stdout ?? "").trimEnd().split("\n").at(-1).trim() || "CRASHED";
  }
  const passed = /^all (\d+) passed/.exec(tail);
  if (passed) cases += Number(passed[1]);
  else failed += 1;
  console.log(`  ${passed ? "ok  " : "FAIL"}  ${suite.padEnd(24)} ${tail}`);
}
console.log(`\n  ${suites.length} suite(s) · ${cases} case(s)` +
  (failed ? ` · ${failed} SUITE(S) FAILING` : " · all passing"));
process.exit(failed ? 1 : 0);
