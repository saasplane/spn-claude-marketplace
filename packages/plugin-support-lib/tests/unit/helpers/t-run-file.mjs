// `tests/helpers/run-file.mjs` — where every package's suite runner leaves what a run proved.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeTest } from "../../../src/lib/timing.ts";
import { RUNS_KEPT, resultsOf, reusedFromOf, runFilePath, writeRunFile } from "../../helpers/run-file.mjs";

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
  ok("[MKT.TESTS.07] in the shape every runner writes: run, tier, phase, ranAt, env and results, with the commit, the package count and reusedFrom",
    JSON.stringify(Object.keys(written)) === '["run","tier","phase","ranAt","env","commit","packages","reusedFrom","results"]'
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

{
  const root = repo();
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x"], { cwd: root });
  for (const name of ["a", "b"]) { mkdirSync(join(root, "packages", name, "tests"), { recursive: true }); writeFileSync(join(root, "packages", name, "tests", "run.mjs"), ""); }
  mkdirSync(join(root, "packages", "c"), { recursive: true });
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const plain = JSON.parse(readFileSync(writeRunFile(root, "own", "UNIT", RESULTS), "utf8"));
  ok("[MKT.SCRIPTS.420] a run file carries the commit it was taken on and the number of packages that carry a runner", plain.commit === head && plain.packages === 2 && plain.reusedFrom === null, JSON.stringify(plain));
  const reused = JSON.parse(readFileSync(writeRunFile(root, "again", "UNIT", RESULTS, false, { reusedFrom: "own" }), "utf8"));
  ok("[MKT.SCRIPTS.420] a run that reuses another says which in reusedFrom", reused.reusedFrom === "own", JSON.stringify(reused));
  const first = writeRunFile(root, "joined", "UNIT", [], false, { reusedFrom: "own" });
  const second = JSON.parse(readFileSync(writeRunFile(root, "joined", "UNIT", RESULTS, true), "utf8"));
  ok("[MKT.SCRIPTS.420] a package that adds to the file keeps what it reuses", second.reusedFrom === "own" && second.results.length === 1 && first.endsWith("joined.json"), JSON.stringify(second));
  ok("[MKT.SCRIPTS.420] reusedFromOf reads the option from the caller's arguments", reusedFromOf(["full-1", "--write-status", "--reused-from=own"]) === "own" && reusedFromOf(["full-1"]) === null);
}

{
  const root = repo();
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(root, ".spndevex", "README.md"), "");
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), JSON.stringify({ telemetry: true }));
  const was = process.env.SPN_TELEMETRY; delete process.env.SPN_TELEMETRY;
  const call = { program: "test-all.mjs", group: null, action: "full-1001" };
  const test = { node: "plugin-support-lib", run: "full-1001", tier: "UNIT", tests: { passed: 12, failed: 1, skipped: 2 } };
  writeTest(root, { script: "test-all.mjs", event: "command", tool: null, session: null }, { call, status: "FAILURE", test, ms: 250 });
  if (was !== undefined) process.env.SPN_TELEMETRY = was;
  const logs = [];
  const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const f = join(dir, e.name); if (e.isDirectory()) walk(f); else if (e.name === "hooks.jsonl") logs.push(f); } };
  walk(join(root, ".spndevex"));
  const row = logs.length ? JSON.parse(readFileSync(logs[0], "utf8").trim().split("\n").pop()) : null;
  ok("[MKT.SCRIPTS.510] a package's suite run lands as one TEST row: the node, the run, the tier and the passed, failed and skipped counts",
    !!row && row.mtype === "TEST" && row.work === "TEST" && row.status === "FAILED" && row.ms === 250 && row.call.program === "test-all.mjs"
    && row.test.node === "plugin-support-lib" && row.test.run === "full-1001" && row.test.tier === "UNIT"
    && row.test.tests.passed === 12 && row.test.tests.failed === 1 && row.test.tests.skipped === 2, JSON.stringify(row));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — run-file` : `\n  all ${total} passed — run-file`);
process.exit(failed ? 1 : 0);
