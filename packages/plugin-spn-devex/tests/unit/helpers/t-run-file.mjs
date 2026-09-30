// `tests/helpers/run-file.mjs` — where this plugin's own suite runner leaves what a run proved.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RUNS_KEPT, runFilePath, writeRunFile } from "../../helpers/run-file.mjs";

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

console.log(failed ? `\n  ${failed} of ${total} FAILED — run-file` : `\n  all ${total} passed — run-file`);
process.exit(failed ? 1 : 0);
