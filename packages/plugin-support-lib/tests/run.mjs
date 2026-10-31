#!/usr/bin/env node
// Every suite in this folder, in one command.
//
//     node run.mjs [<run>]
//
// Modelled on each plugin's own `tests/run.mjs`: this folder ships no code of its own, only the
// helpers two or more plugins import by relative path, so a case here proves a helper once rather
// than once per plugin that carries it.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { recordRun, resultsOf, runNameOf, takeAppend } from "./helpers/run-file.mjs";

const HERE = import.meta.dirname;
const REPO = resolve(HERE, "..", "..", "..");
// A NAMED RUN WRITES DOWN WHAT IT PROVED, into the one run file every package's runner writes (RULE.DEVEX.UTILS.071):
// a row whose proof sits in this package lands only on a run that recorded it.
const runName = runNameOf(process.argv.slice(2));
const append = takeAppend();
const TIER = "UNIT";
const results = [];
// THE SUITES ARE WALKED, NOT LISTED, and they mirror `src/lib/`: a test for a helper sits at that
// helper's own path under `unit/lib/`. A runner that globbed one folder made a rule test, a
// structural test and a tool test indistinguishable, and it is why moving a source file used to
// move its test nowhere.
const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const at = `${dir}/${entry}`;
  return statSync(at).isDirectory() ? walk(at) : [at];
});
const suites = walk(HERE)
  .filter((f) => f.split("/").pop().startsWith("t-") && f.endsWith(".mjs"))
  .map((f) => f.slice(HERE.length + 1))
  .sort();

// A suite that skips cases says so on a line of its own, `SKIP <n> <reason>`, anywhere in its output;
// the runner counts those wherever they fall, so a run that skipped cases never reads as if everything ran.
const SKIP_LINE = /^\s*SKIP (\d+)\s*(.*)$/;

let failed = 0;
let cases = 0;
let skipped = 0;
let skippingSuites = 0;
for (const suite of suites) {
  let tail = "";
  let out = "";
  // THE EXIT CODE IS THE VERDICT, and the summary line only says how many cases there were. Judging
  // on the text alone read a suite that exits 1 while printing `all N passed` as green, and a suite
  // that passes in different words as red. A runner that can disagree with its own suites is a
  // runner nobody can use to prove anything.
  let code = 0;
  try {
    out = execFileSync(process.execPath, [resolve(HERE, suite)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    tail = out.trimEnd().split("\n").at(-1).trim();
  } catch (error) {
    out = String(error.stdout ?? "");
    tail = out.trimEnd().split("\n").at(-1).trim() || "CRASHED";
    code = error.status ?? 1;
  }
  const skips = out.split("\n").map((line) => SKIP_LINE.exec(line)).filter((found) => found !== null);
  const skippedHere = skips.reduce((sum, found) => sum + Number(found[1]), 0);
  const reasons = [...new Set(skips.map((found) => found[2].trim()).filter(Boolean))].join("; ");
  results.push(...resultsOf(out, TIER));

  const counted = /\b(\d+) passed\b/.exec(tail);
  const ok = code === 0 && counted !== null;
  if (counted) cases += Number(counted[1]);
  if (skippedHere) { skipped += skippedHere; skippingSuites += 1; }
  if (!ok) failed += 1;
  const said = ok && skippedHere ? `${counted[1]} passed · ${skippedHere} skipped${reasons ? `: ${reasons}` : ""}` : tail;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${suite.padEnd(24)} ${said}${code === 0 ? "" : ` (exit ${code})`}`);
}
console.log(`\n  ${suites.length} suite(s) · ${cases} case(s)` +
  (skipped ? ` passed · ${skipped} skipped in ${skippingSuites} suite(s)` : "") +
  (failed ? ` · ${failed} SUITE(S) FAILING` : skipped ? "" : " · all passing"));
recordRun(REPO, runName, TIER, results, append);
process.exit(failed ? 1 : 0);
