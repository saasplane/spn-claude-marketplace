// `checks/proof-run.ts` — a test or check command whose result is hidden is refused: piped into `tail`, `head` or
// `grep`, which loses its exit status, with its errors sent to `/dev/null`, or an nx run replayed from its cache
// while a PROOF row of the window's arc is in progress.
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

const arc = (altitude, state) => JSON.stringify({ schemaVersion: 1, arc: "N1", subject: "a-subject", title: "T", status: "DECIDED", reason: null,
  preview: "notes/N1/preview.html", rows: [{ id: "1", parent: "", title: "Prove it", kind: "work", repo: "spn-x", altitude, state }] });
const withArc = (name, altitude, state) => {
  const root = workspace(name, { ".spndevex/workstreams/open/001-a-subject/arcs/N1/state.json": arc(altitude, state) });
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

console.log(failed ? `\n  ${failed} of ${total} FAILED — proof run` : `\n  all ${total} passed — proof run`);
process.exit(failed ? 1 : 0);
