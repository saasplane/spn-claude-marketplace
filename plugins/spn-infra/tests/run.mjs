#!/usr/bin/env node
// Every suite in this folder, in one command.
//
//     node run.mjs
//
// Each suite runs both the TypeScript dispatcher and the bash script it replaces, and requires them
// to agree unless the case names a reason not to. Once the plugin reinstall retires
// `deny-estate-violations.sh`, the bash arm stops running and each case still asserts its own
// expectation.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const HERE = import.meta.dirname;
// THE SUITES ARE WALKED, NOT LISTED, and they mirror `src/` beneath the tier that proves them: a
// test for a file sits at that file's own path under `unit/`. A runner that globbed one folder made
// a rule test, a structural test and a tool test indistinguishable, and it is why moving a source
// file used to move its test nowhere.
const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const at = `${dir}/${entry}`;
  return statSync(at).isDirectory() ? walk(at) : [at];
});
const suites = walk(HERE)
  .filter((f) => f.split("/").pop().startsWith("t-") && f.endsWith(".mjs"))
  .map((f) => f.slice(HERE.length + 1))
  .sort();

let failed = 0;
let cases = 0;
for (const suite of suites) {
  let tail = "";
  // THE EXIT CODE IS THE VERDICT, and the summary line only says how many cases there were. Judging
  // on the text alone read a suite that exits 1 while printing `all N passed` as green, and a suite
  // that passes in different words as red. A runner that can disagree with its own suites is a
  // runner nobody can use to prove anything.
  let code = 0;
  try {
    // stderr is DISCARDED, not inherited. `stop` writes its warnings there, so a suite exercising it
    // prints a fixture's findings into this summary as though they were this run's.
    tail = execFileSync(process.execPath, [resolve(HERE, suite)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .trimEnd().split("\n").at(-1).trim();
  } catch (error) {
    tail = String(error.stdout ?? "").trimEnd().split("\n").at(-1).trim() || "CRASHED";
    code = error.status ?? 1;
  }
  const counted = /\b(\d+) passed\b/.exec(tail);
  const ok = code === 0 && counted !== null;
  if (counted) cases += Number(counted[1]);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${suite.padEnd(24)} ${tail}${code === 0 ? "" : ` (exit ${code})`}`);
}
console.log(`\n  ${suites.length} suite(s) · ${cases} case(s)` +
  (failed ? ` · ${failed} SUITE(S) FAILING` : " · all passing"));
process.exit(failed ? 1 : 0);
