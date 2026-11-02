// `checks/proof-run.ts` — a test or check command whose result is hidden is refused: piped into `tail`, `head` or
// `grep`, which loses its exit status, with its errors sent to `/dev/null`, or an nx run replayed from its cache
// while a PROOF row of the window's arc is in progress.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { bindOpen, workspace } from "../../../helpers/fixture.mjs";

const { checkProofRun } = await import(join(CHECKS, "proof-run.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const arc = (work, state) => JSON.stringify({ schemaVersion: 1, arc: "N1", subject: "a-subject", title: "T", status: "DECIDED", reason: null,
  preview: "notes/N1/preview.html", rows: [{ id: "1", parent: "", title: "Prove it", kind: "work", repo: "spn-x", work, state }] });
const withArc = (name, work, state) => {
  const root = workspace(name, { ".spndevex/workstreams/open/001-a-subject/arcs/N1/state.json": arc(work, state) });
  bindOpen(root, "s1");
  return root;
};
const proving = withArc("proof-running", "PROOF", "running");
const building = withArc("proof-code", "CODE", "running");
const bash = (root, command) => ({ tool_name: "Bash", cwd: root, session_id: "s1", tool_input: { command } });
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== a test run whose result is hidden");
{
  const piped = checkProofRun(bash(building, "spnutils apps test contract r1 api 2>&1 | tail -20"));
  ok("[MKT.HOOKS.124] a test run piped into tail is refused, naming the lost exit status", verdictOf(piped) === "deny" && piped.deny.includes("exit status"), piped?.deny);
  ok("[MKT.HOOKS.124] a test run piped into head is refused", verdictOf(checkProofRun(bash(building, "node packages/p/tests/run.mjs | head -5"))) === "deny");
  ok("[MKT.HOOKS.124] a test run piped into grep is refused", verdictOf(checkProofRun(bash(building, "nx run-many -t test | grep FAIL"))) === "deny");
  const silenced = checkProofRun(bash(building, "spnutils apps check 2>/dev/null"));
  ok("[MKT.HOOKS.124] a check run with its errors sent to /dev/null is refused", verdictOf(silenced) === "deny" && silenced.deny.includes("/dev/null"), silenced?.deny);
}

console.log("\n=== an nx run from cache inside a PROOF row, and what passes");
{
  const cached = checkProofRun(bash(proving, "nx run-many -t test"));
  ok("[MKT.HOOKS.125] an nx test run without --skip-nx-cache is refused while a PROOF row is in progress", verdictOf(cached) === "deny" && cached.deny.includes("--skip-nx-cache"), cached?.deny);
  ok("[MKT.HOOKS.125] the same run with --skip-nx-cache passes", checkProofRun(bash(proving, "nx run-many -t test --skip-nx-cache")) === null);
  ok("[MKT.HOOKS.125] the same run passes while no PROOF row is in progress", checkProofRun(bash(building, "nx run-many -t test")) === null);
  ok("[MKT.HOOKS.125] a plain test run alone passes", checkProofRun(bash(proving, "spnutils apps test contract r1 api")) === null);
  ok("[MKT.HOOKS.125] a pipe on a command that is no test or check passes", checkProofRun(bash(proving, "git log --oneline | head -5")) === null);
  ok("[MKT.HOOKS.125] a non-Bash call passes", checkProofRun({ tool_name: "Read", cwd: proving, tool_input: { command: "nx run-many -t test | tail" } }) === null);
}

console.log("\n=== a run that reads its own status and errors, and a command that holds the words only as text (S133)");
{
  const L = "spnutils apps " + "test";
  ok("[MKT.HOOKS.124] a run with stdout and stderr in a file and its status echoed in the same command passes",
    checkProofRun(bash(building, "node packages/p/tests/run.mjs > /tmp/x.log 2>&1; echo exit $?")) === null);
  ok("[MKT.HOOKS.124] the same with more after the `;` passes", checkProofRun(bash(building, `${L} contract r1 api > /tmp/x.log 2>&1; echo "exit $?"; cat /tmp/x.log`)) === null);
  const heredoc = `cat > /tmp/probe.sh <<'EOF'\n${L} contract r1 api 2>/dev/null\nnx run-many -t test ${"|"} tail -5\nEOF\n`;
  ok("[MKT.HOOKS.124] a heredoc that holds a test word and the error-discard redirect only as text is not a run", checkProofRun(bash(building, heredoc)) === null, JSON.stringify(checkProofRun(bash(building, heredoc))));
  ok("[MKT.HOOKS.124] a quoted string that holds them only as text is not a run", checkProofRun(bash(building, `echo '${L} x 2>/dev/null'`)) === null);
  ok("[MKT.HOOKS.124] a run piped into tail is still refused", verdictOf(checkProofRun(bash(building, `nx run-many -t test 2>&1 ${"|"} tail -20`))) === "deny");
  ok("[MKT.HOOKS.124] a run with its errors discarded is still refused", verdictOf(checkProofRun(bash(building, `${L} contract r1 api 2>/dev/null`))) === "deny");
}

console.log("\n=== an nx run on an unchanged tree during a PROOF row (S129)");
{
  const { dataWorkspace, put } = await import("../../../helpers/workstream-fixture.mjs");
  const { execFileSync } = await import("node:child_process");
  const { contentHash } = await import(join(CHECKS, "push-tiers.ts"));
  const proofRow = { id: "1", parent: "N001", title: "prove it", kind: "change", repo: "spn-x", work: "PROOF", blockedBy: [], touches: [], state: "running" };
  const built = async (name, content) => {
    const w = await dataWorkspace(name, { rows: [proofRow] });
    put(w.repo, "pkg/x.ts", "export const x = 1;\n");
    w.git(["add", "-A"]);
    w.git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "second"]);
    const sha = w.git(["rev-parse", "HEAD"]);
    const tree = new Map(execFileSync("git", ["ls-tree", "-r", "-z", sha, "--", "pkg"], { cwd: w.repo, encoding: "utf8" }).split("\0").filter(Boolean)
      .map((line) => [line.slice(line.indexOf("\t") + 1), line.slice(0, line.indexOf("\t")).split(" ")[2]]));
    const data = JSON.parse(readFileSync(join(w.ws, "arcs", "N001", "state.json"), "utf8"));
    data.rows[0].commits = { "spn-x": [sha] };
    writeFileSync(join(w.ws, "arcs", "N001", "state.json"), JSON.stringify(data, null, 2));
    put(w.repo, "pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: "2020-01-01T00:00:00Z", env: "local", results: [{ id: "U.1", tier: "unit", status: "SUCCESS", title: "U.1" }] }));
    put(w.repo, "pkg/tests/.output/unit/runs/r1.stamp.json", JSON.stringify({ tier: "UNIT", narrowed: false, content: content ?? contentHash(tree, "pkg") }));
    bindOpen(w.root, "s1");
    return w;
  };
  const same = await built("proof-same-tree");
  ok("[MKT.HOOKS.125] an nx run with no --skip-nx-cache passes while the tree equals the tree of the arc's latest recorded run", checkProofRun(bash(same.root, "nx run-many -t test")) === null, JSON.stringify(checkProofRun(bash(same.root, "nx run-many -t test"))));
  const moved = await built("proof-moved-tree", "0".repeat(64));
  const refused = checkProofRun(bash(moved.root, "nx run-many -t test"));
  ok("[MKT.HOOKS.125] on a moved tree the demand stays: the run without --skip-nx-cache is refused", verdictOf(refused) === "deny" && refused.deny.includes("--skip-nx-cache"), JSON.stringify(refused));
  ok("[MKT.HOOKS.125] and the same run with --skip-nx-cache passes on the moved tree", checkProofRun(bash(moved.root, "nx run-many -t test --skip-nx-cache")) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — proof run` : `\n  all ${total} passed — proof run`);
process.exit(failed ? 1 : 0);
