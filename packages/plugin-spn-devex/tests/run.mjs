#!/usr/bin/env node
// Every suite in this folder, in one command.
//
//     node run.mjs [<run>] [--write-status]
//
// Each suite runs both the TypeScript check and the Python it replaced, and requires them to agree
// unless the case names a reason not to. Once the plugin reinstall deletes `hooks/scripts/`, the
// Python arm stops running and each case still asserts its own expectation.
//
// **And a named run writes down what it proved (Q107).** The marketplace is a GENERAL repository,
// so `spnutils` serves it with its docs verbs only and has no runner to write its behaviour rows.
// These suites ARE its runner. Every case whose title carries a behaviour id in brackets —
// `[MKT.DOCS.01]`, the book's rule that an id is carried by a test title — becomes a result. Given a
// run name, the results become `tests/.output/unit/runs/<run>.json`, the file every stack's runner
// writes (RULE.DEVEX.UTILS.071), and `--write-status` stamps the rows from that run. Given none, the
// suites run and no run file is written, because a reader is always told which run to read. A case
// with no id in its title proves nothing to the register and is counted only here.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { recordRun, resultsOf, runNameOf, takeAppend } from "../../plugin-support-lib/tests/helpers/run-file.mjs";

// Every hook a case launches inherits this, so a test run never writes into the workspace's
// telemetry log, where its records would read as the developer's own tool calls.
process.env.SPN_TELEMETRY = "off";

// `SPN_RUN_SUITES` points the runner at another folder of suites; the runner's own case (t-run.mjs) uses it
// to run a folder of fixture suites, since the runner cannot run itself.
const HERE = process.env.SPN_RUN_SUITES ?? import.meta.dirname;
const REPO = resolve(HERE, "..", "..", "..");
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
const writeStatus = process.argv.includes("--write-status");
// The run's name, chosen by the caller: the first word that is not an option.
const runName = runNameOf(process.argv.slice(2));
const append = takeAppend();
if (writeStatus && runName === null) {
  console.error("--write-status stamps the rows from a named run. Usage: node run.mjs <run> --write-status");
  process.exit(2);
}

// The tier these suites run at. They exercise one unit — a check, a drawer, a renderer — against a
// fixture, with no service and no browser, so they speak for `UNIT` rows and for nothing else.
const TIER = "UNIT";

// A suite that skips cases says so on a line of its own, `SKIP <n> <reason>`, anywhere in its output
// (`skipped()` in helpers/harness.mjs). The runner counts those wherever they fall, so a run that
// skipped cases never reads as if everything ran.
const SKIP_LINE = /^\s*SKIP (\d+)\s*(.*)$/;

let failed = 0;
let cases = 0;
let skipped = 0;
let skippingSuites = 0;
const results = [];
for (const suite of suites) {
  let out = "";
  // THE EXIT CODE IS THE VERDICT, and the summary line only says how many cases there were. Judging
  // on the text alone read a suite that exits 1 while printing `all N passed` as green, and a suite
  // that passes in different words as red. A runner that can disagree with its own suites is a
  // runner nobody can use to prove anything.
  let code = 0;
  try {
    // stderr is DISCARDED, not inherited. `stop` writes its warnings there, so a suite exercising it
    // prints a fixture's findings into this summary as though they were this run's.
    out = execFileSync(process.execPath, [resolve(HERE, suite)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (error) { out = String(error.stdout ?? ""); code = error.status ?? 1; }
  const tail = out.trimEnd().split("\n").at(-1).trim() || "CRASHED";

  results.push(...resultsOf(out, TIER));

  const skips = out.split("\n").map((line) => SKIP_LINE.exec(line)).filter((found) => found !== null);
  const skippedHere = skips.reduce((sum, found) => sum + Number(found[1]), 0);
  const reasons = [...new Set(skips.map((found) => found[2].trim()).filter(Boolean))].join("; ");

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

// THE RUN FILE IS WRITTEN EVEN WHEN NO CASE CARRIES AN ID, because an empty result set is a fact
// about the run — the register then says PLANNED for rows this tier covers and nothing named, which is
// true and is what a reader needs. It lives where every other stack's runner puts one, beside the
// pocket and never in it (RULE.DEVEX.WORKSPACE.149): a file rewritten by every run is not a document.
recordRun(REPO, runName, TIER, results, append);

if (writeStatus) {
  // This run is the whole of its tier here, so a row no case named any more goes back to PLANNED.
  const cli = resolve(HERE, "..", "src", "scripts", "cli.ts");
  try {
    console.log(execFileSync(process.execPath, [cli, "behaviours", "stamp", "write", runName, REPO, "--reach", "repository"], { encoding: "utf8" }));
  } catch (error) { console.log(String(error.stdout ?? "")); }
}

process.exit(failed ? 1 : 0);
