// `tests/helpers/run-file.mjs` — where every package's suite runner leaves what a run proved.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RUNS_KEPT, resultsOf, runFilePath, writeRunFile } from "../../helpers/run-file.mjs";

const kept = [];
process.on("exit", () => { for (const dir of kept) rmSync(dir, { recursive: true, force: true }); });

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const repo = () => { const root = mkdtempSync(join(tmpdir(), "run-file-")); kept.push(root); return root; };
const RESULTS = [{ id: "MKT.TESTS.07", tier: "UNIT", status: "SUCCESS", title: "[MKT.TESTS.07] a case" }];

console.log("=== the suite runner's run file");

{
  const root = repo();
  const file = writeRunFile(root, "full-1001", "UNIT", RESULTS);
  const written = JSON.parse(readFileSync(file, "utf8"));
  ok("[MKT.TESTS.07] a run writes tests/.output/<tier>/runs/<run>.json under the name its caller gave",
    file === join(root, "tests", ".output", "unit", "runs", "full-1001.json") && existsSync(file), file);
  ok("[MKT.TESTS.07] in the shape every runner writes: run, tier, phase, ranAt, env and results",
    JSON.stringify(Object.keys(written)) === '["run","tier","phase","ranAt","env","results"]'
      && written.run === "full-1001" && written.tier === "UNIT" && written.phase === null
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(written.ranAt) && written.results[0].id === "MKT.TESTS.07", JSON.stringify(written));
}

{
  const root = repo();
  writeRunFile(root, "p1", "UNIT", RESULTS);
  writeRunFile(root, "p2", "UNIT", []);
  ok("[MKT.TESTS.07] two runs under two names leave two files", existsSync(runFilePath(root, "UNIT", "p1")) && existsSync(runFilePath(root, "UNIT", "p2")));
}

{
  const root = repo();
  for (let at = 0; at < RUNS_KEPT + 3; at += 1) writeRunFile(root, `r${at}`, "UNIT", []);
  const left = readdirSync(join(root, "tests", ".output", "unit", "runs"));
  ok("the tier keeps its 20 newest, and the run just written is always among them",
    left.length === RUNS_KEPT && left.includes(`r${RUNS_KEPT + 2}.json`), JSON.stringify(left));
}

{
  let refused = "";
  try { writeRunFile(repo(), "../escape", "UNIT", []); } catch (error) { refused = String(error.message); }
  ok("a name that cannot be a file name is refused, and nothing is written", refused.includes("is not a run name"), refused);
}

// THE FULL RUN HANDS ONE NAME TO EVERY PACKAGE'S RUNNER. Each replacing the file left only the last
// package's results, so a row whose proof sat in another package could never land.
{
  const root = repo();
  const other = [{ id: "MKT.SCRIPTS.197", tier: "UNIT", status: "SUCCESS", title: "[MKT.SCRIPTS.197] a case" }];
  writeRunFile(root, "full", "UNIT", RESULTS, true);
  writeRunFile(root, "full", "UNIT", other, true);
  const both = JSON.parse(readFileSync(runFilePath(root, "UNIT", "full"), "utf8")).results.map((r) => r.id);
  ok("[MKT.TESTS.07] with append, a second package's results join the first's in one run file",
    JSON.stringify(both) === '["MKT.TESTS.07","MKT.SCRIPTS.197"]', JSON.stringify(both));
  writeRunFile(root, "full", "UNIT", other, false);
  const replaced = JSON.parse(readFileSync(runFilePath(root, "UNIT", "full"), "utf8")).results.map((r) => r.id);
  ok("[MKT.TESTS.07] without it, a reused name replaces the file", JSON.stringify(replaced) === '["MKT.SCRIPTS.197"]', JSON.stringify(replaced));
}

{
  const out = "  PASS  [MKT.HOOKS.141] a case with an id\n  FAIL  [MKT.HOOKS.142] a failing one\n  PASS  a case with no id\nall 3 passed";
  const found = resultsOf(out, "UNIT");
  ok("[MKT.TESTS.07] a suite's output yields each PASS or FAIL line that carries an id, and nothing else",
    found.length === 2 && found[0].status === "SUCCESS" && found[1].status === "FAILED" && found[1].id === "MKT.HOOKS.142", JSON.stringify(found));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — run-file` : `\n  all ${total} passed — run-file`);
process.exit(failed ? 1 : 0);
