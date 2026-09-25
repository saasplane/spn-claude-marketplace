#!/usr/bin/env node
// Every suite in this folder, in one command.
//
//     node run.mjs [--write-status]
//
// Each suite runs both the TypeScript check and the Python it replaced, and requires them to agree
// unless the case names a reason not to. Once the plugin reinstall deletes `hooks/scripts/`, the
// Python arm stops running and each case still asserts its own expectation.
//
// **And the run writes down what it proved (Q107).** The marketplace is a GENERAL repository, so
// `spnutils` serves it with its docs verbs only and has no runner to write its behaviour rows.
// These suites ARE its runner. Every case whose title carries a behaviour id in brackets —
// `[MKT.DOCS.01]`, the book's rule that an id is carried by a test title — becomes a result, the
// results become `tests/.output/unit/spn-tests.json`, and `behaviour-status.mjs` writes the
// two cells a run owns. A case with no id in its title proves nothing to the register and is
// counted only here, which is how it should be: a register row is a promise somebody made, not
// every assertion anybody wrote.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE = import.meta.dirname;
const REPO = resolve(HERE, "..", "..", "..");
const suites = readdirSync(HERE).filter((f) => f.startsWith("t-") && f.endsWith(".mjs")).sort();
const writeStatus = process.argv.includes("--write-status");

// The tier these suites run at. They exercise one unit — a check, a drawer, a renderer — against a
// fixture, with no service and no browser, so they speak for `UNIT` rows and for nothing else.
const TIER = "UNIT";
const ID = /\[([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+){2})\]/;

let failed = 0;
let cases = 0;
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

  for (const line of out.split("\n")) {
    const verdict = /^\s*(PASS|FAIL)\s+(.*)$/.exec(line);
    if (!verdict) continue;
    const id = ID.exec(verdict[2]);
    if (!id) continue;
    results.push({ id: id[1], tier: TIER, status: verdict[1] === "PASS" ? "SUCCESS" : "FAILED", title: verdict[2].trim() });
  }

  const counted = /\b(\d+) passed\b/.exec(tail);
  const ok = code === 0 && counted !== null;
  if (counted) cases += Number(counted[1]);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${suite.padEnd(24)} ${tail}${code === 0 ? "" : ` (exit ${code})`}`);
}
console.log(`\n  ${suites.length} suite(s) · ${cases} case(s)` +
  (failed ? ` · ${failed} SUITE(S) FAILING` : " · all passing"));

// THE ARTIFACT IS WRITTEN EVEN WHEN NO CASE CARRIES AN ID, because an empty result set is a fact
// about the run — the register then says PENDING for rows this tier covers and nothing proved,
// which is true and is what a reader needs. An absent file would read as *the run never happened*.
//
// IT IS A RUN'S OUTPUT AND NOT A DOCUMENT, so it lives where every other stack's runner puts one —
// `tests/.output/<tier>/spn-tests.json`, the path `spn-test.mjs` derives. The pocket beside it
// holds pages a person wrote (RD.DOCS.089); a file rewritten by every run is not one, and while it
// sat there a suite run reported a changed tree on its timestamp alone, which a release refuses.
const artifact = resolve(REPO, "tests", ".output", TIER.toLowerCase(), "spn-tests.json");
mkdirSync(dirname(artifact), { recursive: true });
writeFileSync(artifact, `${JSON.stringify({
  env: "local", tiers: [TIER], ranAt: new Date().toISOString(), from: "plugins/spn-devex/hooks/tests/run.mjs", results,
}, null, 2)}\n`, "utf8");
console.log(`  ${results.length} case(s) carry a behaviour id -> ${artifact.slice(REPO.length + 1)}`);

if (writeStatus) {
  const tool = resolve(HERE, "..", "src", "scripts", "tools", "behaviour-status.mjs");
  try {
    console.log(execFileSync(process.execPath, [tool, "--write", "--results", artifact, REPO], { encoding: "utf8" }));
  } catch (error) { console.log(String(error.stdout ?? "")); }
}

process.exit(failed ? 1 : 0);
