import { PLUGIN } from "../../../helpers/harness.mjs";
// `confirmed` — the known-bad is a repository write while no arc holds the developer's go; the untouched is
// the same write once an arc does. A go is read where an arc keeps it: the arc's status in `state.json`
// (`DECIDED`, `RUNNING` or `LANDED`) and the status line in `log.jsonl` that moved it out of `PROPOSED`
// with the developer's words beside the move (RD.DEVEX.WORKSPACE.278).
//
// EVERY WARNING IS READ FOR WHAT IT ASKS. A note that still asks for the retired `- **<date> — go.**` line
// sends the agent to write a form nothing reads, so a warning case passes only when its note names the
// command that records a go, and never the old line.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";
import { bindNamed } from "../../../../src/scripts/lib/window.ts";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const HOOKS = PLUGIN;
const OWN = "001-a-subject";
const OTHER = "002-another-subject";

// The log lines the commands write, by the words `row write` puts in each.
const AT = "2026-10-24T20:05+05:30";
const opened = { at: AT, kind: "opened", row: null, note: "opened as PROPOSED" };
const go = { at: AT, kind: "status", row: null, note: "PROPOSED → DECIDED · the developer, 24 Oct: 'good to go'" };
const goWithoutWords = { at: AT, kind: "status", row: null, note: "PROPOSED → DECIDED" };
const runs = { at: AT, kind: "status", row: null, note: "DECIDED → RUNNING · row 1 running" };
const lands = { at: AT, kind: "status", row: null, note: "RUNNING → LANDED" };
const reopened = { at: AT, kind: "status", row: null, note: "DECIDED → PROPOSED · rows 4 to 6 are new scope" };
const added = { at: AT, kind: "added", row: "1", note: "write the book" };
// An arc opened straight at DECIDED, as one go opens every step's arc (RD.DEVEX.WORKSPACE.280): the opening
// write's `--note` replaces the command's own `opened as <status>`, so the words are the go.
const openedOnAGo = { at: AT, kind: "opened", row: null, note: "decided on N001's go, the developer, 24 Oct: 'all arcs are ready'" };
const openedDecidedBare = { at: AT, kind: "opened", row: null, note: "opened as DECIDED" };

/** An arc's data and log, as the `workstream` commands write them. */
function arc(folder, status, lines) {
  // RUNNING is worked out from the steps, never stored: an arc that runs stores the developer's DECIDED, and a step runs.
  const stored = status === "RUNNING" ? "DECIDED" : status;
  const data = { schemaVersion: 2, arc: "N001", subject: "a-subject", title: "a subject", goal: null, status: stored, reason: null,
    preview: "preview.html", rows: [{ id: "1", parent: "N001", title: "write the book", kind: "change", state: status === "RUNNING" ? "running" : "waiting" }] };
  return {
    [`.spndevex/${WORKSTREAMS}/open/${folder}/arcs/N001/state.json`]: `${JSON.stringify(data, null, 2)}\n`,
    [`.spndevex/${WORKSTREAMS}/open/${folder}/arcs/N001/log.jsonl`]: lines.map((line) => JSON.stringify(line)).join("\n") + "\n",
  };
}

function build(name, { status, lines, other }) {
  return workspace(name, {
    ...arc(OWN, status, lines),
    ...(other ? arc(OTHER, other.status, other.lines) : {}),
    "spn-support-ts/src/existing.ts": "export const x = 1;\n",
  });
}

function ts(payload, cwd) {
  try {
    return execFileSync("node", [`${HOOKS}/src/scripts/checks/confirmed.ts`], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim();
  } catch (e) { return `ERROR: ${e.stderr ?? e.message}`; }
}

const noteOf = (out) => {
  if (!out) return "";
  try { const p = JSON.parse(out.split("\n").filter(Boolean).at(-1));
        return p.hookSpecificOutput?.additionalContext ?? p.systemMessage ?? ""; }
  catch { return out; }
};

// A warning names the command that records a go, and never the line form the arcs left at N002.
const RECORDS_A_GO = "workstream row write <arc> --status DECIDED --note";
const RETIRED_LINE = "— go.**";
const asksForTheCommand = (note) => note.includes(RECORDS_A_GO) && !note.includes(RETIRED_LINE);

let n = 0, failed = 0;
function one(label, { status = "PROPOSED", lines = [opened], other, own, path = "spn-support-ts/src/probe.ts", tool = "Write", names }, expect) {
  n += 1;
  const root = build(`confirmed-${n}`, { status, lines, other });
  const session = `s${n}`;
  // A window that works on one workstream is bound to it, as a prompt naming it binds it (RD.DEVEX.WORKSPACE.236).
  if (own) bindNamed(root, session, own, "prompt");
  const payload = { tool_name: tool, cwd: root, session_id: session,
                    tool_input: tool === "Bash" ? { command: "ls" } : { file_path: path, content: "x" } };
  const note = noteOf(ts(payload, root));
  const spoke = Boolean(note);
  const worded = !spoke || (asksForTheCommand(note) && (!names || note.includes(names)));
  const ok = spoke === (expect === "note") && worded;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ${spoke ? "note" : "silent"}${spoke ? ` · names the command ${worded}` : ""}`);
  if (!ok && spoke) console.log(`        note: ${note.slice(0, 260)}`);
  return root;
}

console.log("\n=== confirmed");
// KNOWN-BAD — no arc holds a go, so the first repository write warns and asks for the command.
one("a PROPOSED arc: a plan the agent wrote is no go", { status: "PROPOSED", lines: [opened, added] }, "note");
one("a write into a second repository, still no go", { status: "PROPOSED", path: "spn-platform-ts/src/a.ts" }, "note");
one("DECIDED in state.json with no status line in its log", { status: "DECIDED", lines: [opened, added] }, "note");
one("a move out of PROPOSED with no words beside it", { status: "DECIDED", lines: [opened, goWithoutWords] }, "note");
one("reopened for new scope: the go before it does not cover the move after", { status: "DECIDED", lines: [opened, go, reopened, goWithoutWords] }, "note");
one("an arc opened at DECIDED with no words of the developer's", { status: "DECIDED", lines: [openedDecidedBare] }, "note");
one("opened on a go, then moved back to PROPOSED and on with no words", { status: "DECIDED", lines: [openedOnAGo, reopened, goWithoutWords] }, "note");
one("a go in another window's workstream licenses nothing here",
  { status: "PROPOSED", own: OWN, other: { status: "RUNNING", lines: [opened, go, runs] }, names: OWN }, "note");
// UNTOUCHED — an arc holds the developer's go.
one("a DECIDED arc whose log holds the go with the developer's words", { status: "DECIDED", lines: [opened, go] }, "silent");
one("a RUNNING arc, decided with words and then started", { status: "RUNNING", lines: [opened, go, runs] }, "silent");
one("an arc opened at DECIDED with the developer's words", { status: "DECIDED", lines: [openedOnAGo, added] }, "silent");
one("an arc opened on a go and since started", { status: "RUNNING", lines: [openedOnAGo, runs] }, "silent");
one("a LANDED arc keeps its go", { status: "LANDED", lines: [opened, go, runs, lands] }, "silent");
one("a window's own workstream holds the go", { status: "RUNNING", lines: [opened, go, runs], own: OWN }, "silent");
one("writing the plan itself is how a go is earned", { path: `.spndevex/${WORKSTREAMS}/open/${OWN}/notes/N001/plan.md` }, "silent");
one("wiring the window is not executing the plan", { path: ".claude/settings.json" }, "silent");
one("reading a repository file is not writing to it", { path: "spn-support-ts/src/existing.ts", tool: "Read" }, "silent");
one("a Bash call carries no file_path", { tool: "Bash" }, "silent");

// The no-nag rule needs two writes in ONE workspace and ONE session, so it is run on its own.
{
  const root = build("confirmed-nag", { status: "PROPOSED", lines: [opened] });
  const payload = { tool_name: "Write", cwd: root, session_id: "same-session",
                    tool_input: { file_path: "spn-support-ts/src/probe.ts", content: "x" } };
  const first = noteOf(ts(payload, root));
  const second = noteOf(ts(payload, root));
  const ok = Boolean(first) && !second;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  it warns once and the second write in the same session is silent\n        first ${first ? "note" : "silent"} · second ${second ? "note" : "silent"}`);
  n += 1;
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
