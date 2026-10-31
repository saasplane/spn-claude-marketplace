import { PLUGIN } from "../../../helpers/harness.mjs";
// `confirmed` — the known-bad is a repository write that no go covers: the arc that names the repository holds
// none, or no arc names it and none holds one. The untouched is the same write once that arc does. A go is read
// where an arc keeps it: the arc's status in `state.json` (`DECIDED`, `RUNNING` or `LANDED`) and the status line
// in `log.jsonl` that moved it out of `PROPOSED` with the developer's words beside the move (RULE.DEVEX.WORKSPACE.278).
//
// EVERY REFUSAL IS READ FOR WHAT IT ASKS. A refusal names the command that records a go, and never the retired
// `- **<date> — go.**` line, so a refusal case passes only when its reason names the command.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";
import { bindNamed } from "../../../../src/scripts/lib/window.ts";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const HOOKS = PLUGIN;
const OWN = "001-a-subject";
const OTHER = "002-another-subject";

// The log lines the commands write, by the words `arc edit` puts in each.
const AT = "2026-10-24T20:05+05:30";
const opened = { at: AT, kind: "opened", row: null, note: "opened as PROPOSED" };
const go = { at: AT, kind: "status", row: null, note: "PROPOSED → DECIDED · the developer, 24 Oct: 'good to go'" };
const goWithoutWords = { at: AT, kind: "status", row: null, note: "PROPOSED → DECIDED" };
const runs = { at: AT, kind: "status", row: null, note: "DECIDED → RUNNING · row 1 running" };
const lands = { at: AT, kind: "status", row: null, note: "RUNNING → LANDED" };
const reopened = { at: AT, kind: "status", row: null, note: "DECIDED → PROPOSED · rows 4 to 6 are new scope" };
const added = { at: AT, kind: "added", row: "1", note: "write the book" };
// An arc opened straight at DECIDED, as one go opens every step's arc (RULE.DEVEX.WORKSPACE.280): the opening
// write's `--note` replaces the command's own `opened as <status>`, so the words are the go.
const openedOnAGo = { at: AT, kind: "opened", row: null, note: "decided on N001's go, the developer, 24 Oct: 'all arcs are ready'" };
const openedDecidedBare = { at: AT, kind: "opened", row: null, note: "opened as DECIDED" };

/** An arc's data and log, as the `workstream` commands write them; `repos` are the repositories the arc names. */
function arc(folder, status, lines, { id = "N001", repos } = {}) {
  // RUNNING is worked out from the steps, never stored: an arc that runs stores the developer's DECIDED, and a step runs.
  const stored = status === "RUNNING" ? "DECIDED" : status;
  const data = { schemaVersion: 2, arc: id, subject: "a-subject", title: "a subject", goal: null, status: stored, reason: null,
    ...(repos ? { repos } : {}),
    preview: "preview.html", rows: [{ id: "1", parent: id, title: "write the book", kind: "change", state: status === "RUNNING" ? "running" : "waiting" }] };
  return {
    [`.spndevex/${WORKSTREAMS}/open/${folder}/arcs/${id}/state.json`]: `${JSON.stringify(data, null, 2)}\n`,
    [`.spndevex/${WORKSTREAMS}/open/${folder}/arcs/${id}/log.jsonl`]: lines.map((line) => JSON.stringify(line)).join("\n") + "\n",
  };
}

function build(name, { status, lines, repos, other, sibling }) {
  return workspace(name, {
    ...arc(OWN, status, lines, { repos }),
    ...(sibling ? arc(OWN, sibling.status, sibling.lines, { id: "N002", repos: sibling.repos }) : {}),
    ...(other ? arc(OTHER, other.status, other.lines) : {}),
    "spn-support-ts/src/existing.ts": "export const x = 1;\n",
  });
}

function ts(payload, cwd) {
  try {
    return execFileSync("node", [`${HOOKS}/src/scripts/checks/confirmed.ts`], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim();
  } catch (e) { return `ERROR: ${e.stderr ?? e.message}`; }
}

/** What the hook decided: a refusal and its reason, a note, or nothing. */
const verdictOf = (out) => {
  if (!out) return { kind: "silent", text: "" };
  try {
    const p = JSON.parse(out.split("\n").filter(Boolean).at(-1)).hookSpecificOutput ?? {};
    if (p.permissionDecision === "deny") return { kind: "deny", text: p.permissionDecisionReason ?? "" };
    return { kind: p.additionalContext ? "note" : "silent", text: p.additionalContext ?? "" };
  } catch { return { kind: "error", text: out }; }
};

// A refusal names the command that records a go, and never the line form the arcs left at N002.
const RECORDS_A_GO = "workstream arc edit <arc> --status DECIDED --note";
const RETIRED_LINE = "— go.**";
const asksForTheCommand = (text) => text.includes(RECORDS_A_GO) && !text.includes(RETIRED_LINE);

let n = 0, failed = 0;
function one(label, { status = "PROPOSED", lines = [opened], repos, sibling, other, own, path = "spn-support-ts/src/probe.ts", tool = "Write", names }, expect) {
  n += 1;
  const root = build(`confirmed-${n}`, { status, lines, repos, sibling, other });
  const session = `s${n}`;
  // A window that works on one workstream is bound to it, as a prompt naming it binds it (RULE.DEVEX.WORKSPACE.236).
  if (own) bindNamed(root, session, own, "prompt");
  const payload = { tool_name: tool, cwd: root, session_id: session,
                    tool_input: tool === "Bash" ? { command: "ls" } : { file_path: path, content: "x" } };
  const { kind, text } = verdictOf(ts(payload, root));
  const worded = kind !== "deny" || (asksForTheCommand(text) && (!names || text.includes(names)));
  const ok = kind === expect && worded;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ${kind}${kind === "deny" ? ` · names the command ${worded}` : ""}`);
  if (!ok && text) console.log(`        said: ${text.slice(0, 260)}`);
  return root;
}

console.log("\n=== confirmed");
// KNOWN-BAD — no go covers the write, so it is refused and the reason asks for the command.
one("a PROPOSED arc: a plan the agent wrote is no go", { status: "PROPOSED", lines: [opened, added] }, "deny");
one("a write into a second repository, still no go", { status: "PROPOSED", path: "spn-platform-ts/src/a.ts" }, "deny");
one("DECIDED in state.json with no status line in its log", { status: "DECIDED", lines: [opened, added] }, "deny");
one("a move out of PROPOSED with no words beside it", { status: "DECIDED", lines: [opened, goWithoutWords] }, "deny");
one("reopened for new scope: the go before it does not cover the move after", { status: "DECIDED", lines: [opened, go, reopened, goWithoutWords] }, "deny");
one("an arc opened at DECIDED with no words of the developer's", { status: "DECIDED", lines: [openedDecidedBare] }, "deny");
one("opened on a go, then moved back to PROPOSED and on with no words", { status: "DECIDED", lines: [openedOnAGo, reopened, goWithoutWords] }, "deny");
one("a go in another window's workstream licenses nothing here",
  { status: "PROPOSED", own: OWN, other: { status: "RUNNING", lines: [opened, go, runs] }, names: OWN }, "deny");
// The mistake the check exists for: the arc that builds this repository is still PROPOSED while another arc of the
// same workstream holds a go for another repository.
one("[MKT.HOOKS.100] a go on the arc for another repository licenses nothing here",
  { status: "PROPOSED", lines: [opened], repos: ["spn-support-ts"],
    sibling: { status: "DECIDED", lines: [opened, go], repos: ["spn-platform-ts"] }, names: `${OWN}/N001` }, "deny");
one("[MKT.HOOKS.100] a go on an arc that names no repository does not cover the arc that names this one",
  { status: "PROPOSED", lines: [opened], repos: ["spn-support-ts"],
    sibling: { status: "RUNNING", lines: [opened, go, runs] }, names: `${OWN}/N001` }, "deny");
// UNTOUCHED — the go that covers the write is there.
one("a DECIDED arc whose log holds the go with the developer's words", { status: "DECIDED", lines: [opened, go] }, "silent");
one("a RUNNING arc, decided with words and then started", { status: "RUNNING", lines: [opened, go, runs] }, "silent");
one("an arc opened at DECIDED with the developer's words", { status: "DECIDED", lines: [openedOnAGo, added] }, "silent");
one("an arc opened on a go and since started", { status: "RUNNING", lines: [openedOnAGo, runs] }, "silent");
one("a LANDED arc keeps its go", { status: "LANDED", lines: [opened, go, runs, lands] }, "silent");
one("a window's own workstream holds the go", { status: "RUNNING", lines: [opened, go, runs], own: OWN }, "silent");
one("[MKT.HOOKS.101] the arc that names the repository holds the go, and another arc waits",
  { status: "DECIDED", lines: [opened, go], repos: ["spn-support-ts"],
    sibling: { status: "PROPOSED", lines: [opened], repos: ["spn-platform-ts"] } }, "silent");
one("[MKT.HOOKS.101] no arc names the repository, and one arc holds a go",
  { status: "PROPOSED", lines: [opened], repos: ["spn-infra"],
    sibling: { status: "DECIDED", lines: [opened, go], repos: ["spn-platform-ts"] } }, "silent");
one("writing the plan itself is how a go is earned", { path: `.spndevex/${WORKSTREAMS}/open/${OWN}/notes/N001/plan.md` }, "silent");
one("wiring the window is not executing the plan", { path: ".claude/settings.json" }, "silent");
one("reading a repository file is not writing to it", { path: "spn-support-ts/src/existing.ts", tool: "Read" }, "silent");
one("a Bash call carries no file_path", { tool: "Bash" }, "silent");

// A refusal is said on every such write: two writes in ONE workspace and ONE session, run on their own.
{
  const root = build("confirmed-again", { status: "PROPOSED", lines: [opened] });
  const payload = { tool_name: "Write", cwd: root, session_id: "same-session",
                    tool_input: { file_path: "spn-support-ts/src/probe.ts", content: "x" } };
  const first = verdictOf(ts(payload, root));
  const second = verdictOf(ts(payload, root));
  const ok = first.kind === "deny" && second.kind === "deny";
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  the second write in the same session is refused as the first was\n        first ${first.kind} · second ${second.kind}`);
  n += 1;
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
