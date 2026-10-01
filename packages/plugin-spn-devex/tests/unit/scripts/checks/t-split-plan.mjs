import { PLUGIN } from "../../../helpers/harness.mjs";
// `split-plan` — the two gates, finding F5's fix, and the fast path that is the whole budget.
//
// Every case runs the SAME payload through the Python and the port. The three F5 cases are marked
// `parity: false` on purpose: the Python cannot see a card answered on the page, which is the defect
// the port fixes, so agreeing with it there would mean the fix did not land.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { WORKSTREAMS, docsOf } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

const HOOKS = PLUGIN;
const SCRIPTS = resolve(HOOKS, "scripts");
const EVENTS = resolve(HOOKS, "src", "scripts", "events");

// THESE SUITES ARE A BUILDER'S GATE, and they say so rather than pretending otherwise. Several cases
// name real files in the surrounding workspace — a chapter, an approach page, this workstream's own
// arcs — because what they prove is that the check agrees with the incumbent ON THE CORPUS, and a
// corpus cannot be invented. A partner holds the plugin without the workspace and runs
// `partner-shape.ts` instead, which needs nothing but the plugin itself.
const WORKSPACE = resolve(HOOKS, "..", "..", "..");

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
const hasPython = (name) => existsSync(resolve(SCRIPTS, name));


// ---------------------------------------------------------------- page and arc builders

const page = ({ eyebrow = "closed", rows = [], cards = "" }) => `<!doctype html>
<div class="eyebrow">Workstream 001 &middot; ${eyebrow}</div>
<h1>A subject</h1>
<section id="s3"><div class="sec-head"><h2>How</h2></div>
  <table>
    <thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
    <tbody>
${rows.map(([what, scope, state]) => `      <tr><td>${what}</td><td>${scope}</td><td>${state}</td></tr>`).join("\n")}
    </tbody>
  </table>
</section>
<section id="s4"><div class="sec-head"><h2>Open</h2></div>
${cards}
</section>
`;

// A CARD IS A TABLE ROW (Q185), and it keeps its options as a NESTED table on purpose: a reader
// that stops at the first `</tr>` cuts the card off at its first option, and passes on a page whose
// options are written inline. The nesting is the case worth having.
// THE FIXTURE IS THE TEMPLATE'S CARD, not a row. `approach-template.html` writes an open card as
// `<div class="open">` wrapping `<h4 id="qN">`, and the page's own furniture depends on it: `.open`
// carries the amber left edge that marks a card undecided, and the rail's count badge is
// `s4.querySelectorAll('.open').length`. A fixture shaped any other way tests a page nobody writes.
const card = (n, decision) => `  <div class="open">
    <h4 id="q${n}">Q${n} &middot; a question only the developer can settle</h4>
    <span class="k">What</span>
    <p>What is being decided.</p>
    <span class="k">Options</span>
    <div class="scroll"><table>
      <thead><tr><th></th><th>What it does</th></tr></thead>
      <tbody><tr><td><strong>A</strong></td><td>one way</td></tr><tr><td><strong>B</strong></td><td>the other</td></tr></tbody>
    </table></div>
    <div class="rec"><b>Recommended: A.</b> Because of the reason. <b>Decision:</b> ${decision}</div>
  </div>
`;

// THE STATUS IS A PARAMETER because a sequencing row resolves through it: only a terminal word means
// the arc is finished, and `RUNNING` is one of the words that means work is left.
//
// THE DEFAULT IS `LANDED` NOW, AND IT WAS `RUNNING` (N66 step 7). The close gate refuses a
// workstream holding an arc that is not terminal, so an unfinished arc in the DEFAULT fixture made
// every close case meet that refusal — including the ones testing a row fault and the ones that must
// be silent. A fixture should carry only the fault its case is about; an unfinished arc is now a
// fault, so it is set where a case wants one rather than everywhere.
const arc = (log = "", status = "LANDED") =>
  `# Arc — a subject\n\nStatus: **${status}**\n\n## Log\n\n- **2026-09-18 — go.** Finish it.\n${log}`;

const LANDED = [["the chapter", "spn-foundation", "&#x2705; landed"], ["the check", "probe-repo", "&#x2705; landed"]];

function build(name, { eyebrow, rows = LANDED, cards = "", log = "", state = "open", arcStatus = "LANDED", arcFile = "N1-something.md" } = {}) {
  const folder = `.spndevex/${WORKSTREAMS}/${state}/001-a-subject`;
  return workspace(name, {
    [`${folder}/a-subject-approach.html`]: page({ eyebrow, rows, cards }),
    [`${folder}/arcs/${arcFile}`]: arc(log, arcStatus),
    // A SIBLING SCOPE, SO A CARRY HAS SOMEWHERE REAL TO POINT. `carried` means the work leaves this
    // workstream, and the gate reads the folder to see whether the named scope can receive it — so a
    // tree holding one workstream can only ever test a carry that fails.
    [`.spndevex/${WORKSTREAMS}/backlog/002-a-successor/a-successor-approach.html`]: "<h1>002</h1>\n",
    "probe-repo/README.md": "# probe-repo\n",
  });
}

// THE SPLIT PLAN IS THE ARCS' STEP ROWS (RD.DEVEX.WORKSPACE.038, `05-artifacts.md` § The split plan
// is the arcs' step rows). An arc's `## Steps` table carries Repo · Altitude · What · Mechanism ·
// Acceptance · State, and the Repo column is the scope. Each row here is `[id, repo, what, state]`.
const stepArc = (rows, { status = "LANDED", log = "" } = {}) => `# N2 — the arc

Status: **${status}**

| Field | This arc |
| --- | --- |
| **Decides** | what the steps do |

## Steps

| # | Repo | Altitude | What | Mechanism | Acceptance | State |
| --- | --- | --- | --- | --- | --- | --- |
${rows.map(([id, repo, what, state]) => `| ${id} | ${repo} | DOCS | ${what} | by hand | audit → 0 RULE | ${state} |`).join("\n")}

## Log

- **2026-09-29 — go.**
${log}`;

/** A workstream whose only split plan is its arc's step table; a page is added only where asked. */
function buildArcs(name, rows, { page: withPage = false, log = "" } = {}) {
  const folder = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  return workspace(name, {
    [`${folder}/arcs/N2-the-arc.md`]: stepArc(rows, { log }),
    ...(withPage ? { [`${folder}/a-subject-approach.html`]: `<div class="eyebrow">Workstream 001 &middot; closed</div>\n<h1>A subject</h1>\n` } : {}),
    [`.spndevex/${WORKSTREAMS}/backlog/002-a-successor/a-successor-approach.html`]: "<h1>002</h1>\n",
    "probe-repo/README.md": "# probe-repo\n",
  });
}

const ARC_LANDED = [["1", "spn-foundation", "the chapter", "✅ landed — `abc1234`"], ["3e.1", "probe-repo", "the check", "LANDED — `def5678`"]];

// ---------------------------------------------------------------- running the two gates

function verdict(out) {
  if (!out) return ["silent", ""];
  try {
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    const text = specific.permissionDecisionReason ?? specific.additionalContext ?? parsed.systemMessage ?? "";
    return [specific.permissionDecision === "deny" ? "deny" : "note", text];
  } catch { return ["unparsable", out.slice(0, 200)]; }
}

function ts(gate, payload, cwd) {
  try { return verdict(execFileSync("node", [`${HOOKS}/src/scripts/checks/split-plan.ts`, "--gate", gate], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim()); }
  catch (e) { return ["error", String(e.stderr ?? e.message).slice(0, 300)]; }
}
function py(gate, payload, cwd) {
  if (!hasPython("split-plan.py")) return null;
  try { return verdict(execFileSync("python3", [`${SCRIPTS}/split-plan.py`, "--gate", gate, "--stdin"], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim()); }
  catch (e) { return ["error", String(e.stderr ?? e.message).slice(0, 300)]; }
}

let n = 0, failed = 0;
function one(label, gate, root, toolInput, expect, { says, parity = true, why = "" } = {}) {
  n += 1;
  const payload = { tool_name: toolInput.command ? "Bash" : "Write", cwd: root, tool_input: toolInput };
  const [tsV, tsWhy] = ts(gate, payload, root);
  const [pyV] = py(gate, payload, root) ?? [null];
  const saysOk = !says || tsWhy.includes(says);
  const ok = tsV === expect && saysOk && (pyV === null || !parity || tsV === pyV);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${tsV} · py ${pyV}` +
    `${says ? ` · names "${says}" ${saysOk}` : ""}${parity ? "" : ` (parity waived: ${why})`}`);
  if (!ok) console.log(`        ts said: ${tsWhy.slice(0, 340)}`);
}

console.log("\n=== split-plan — the close gate");
const move = (from, to) => ({ command: `mv ${from} ${to}` });

one("a row nobody decided refuses the close", "close",
  build("sp-undecided", { rows: [...LANDED, ["the third thing", "spn-platform-ts", ""]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "row nobody decided" });

one("a row started and put down refuses too", "close",
  build("sp-stopped", { rows: [...LANDED, ["the third thing", "spn-platform-ts", "&#x25D0; 2026-09-08 half of it"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "started and put down" });

// RD.DEVEX.WORKSPACE.184 — `in progress <time>` is somebody's claim on a row, never a landing. It read
// as `pending` before the mark existed, and `pending` closes with a note.
one("a row still marked in progress refuses the close, and its age is named", "close",
  buildArcs("m7-sp-in-progress", [...ARC_LANDED, ["4", "spn-platform-ts", "the proof", "in progress 2026-09-29 14:32 +05:30"]], { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "still marked in progress", parity: false, why: "the Python predates the mark" });

// RD.DEVEX.WORKSPACE.188 — `⏸ held on Q<n>` waits on a card's answer. It is not accounted for, so the
// close refuses it as it refuses a stopped row, and names the card it waits on.
one("a row held on a card refuses the close, and the card is named", "close",
  buildArcs("m11-sp-held", [...ARC_LANDED, ["4", "spn-platform-ts", "the proof", "⏸ held on Q352"]], { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "waits on Q352", parity: false, why: "the Python predates the mark" });

one("the mark without its glyph refuses the same", "close",
  buildArcs("m11-sp-held-bare", [...ARC_LANDED, ["4", "spn-platform-ts", "the proof", "held on Q352"]], { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "held on a card", parity: false, why: "the Python predates the mark" });

{
  const { stateOf, heldOn, inProgressSince, markAge, markedAgo } = await import("../../../../src/scripts/checks/split-plan.ts");
  const row = (state) => ({ label: "x", scope: "spn-foundation", state });
  const now = Date.parse("2026-09-29T12:00:00Z");
  for (const [what, got, expected] of [
    ["the book's form reads as in progress", stateOf(row("in progress 2026-09-29 14:32 +05:30")), "in-progress"],
    ["bold and a hyphen read the same", stateOf(row("**in-progress 2026-09-29 14:32 +05:30**")), "in-progress"],
    ["landing replaces the mark", stateOf(row("✅ landed — `abc1234`")), "landed"],
    ["a stop is still a stop", stateOf(row("◐ stopped — half done")), "stopped"],
    ["a cell that only mentions progress is not the mark", stateOf(row("agreed; progress later")), "pending"],
    ["the book's held form reads as held", stateOf(row("⏸ held on Q352")), "held"],
    ["a held mark without its glyph reads the same", stateOf(row("**held on Q352**")), "held"],
    ["the card a held row waits on is named", heldOn("⏸ held on q352 — the answer can change it"), "Q352"],
    ["a cell that only mentions holding is not the mark", stateOf(row("agreed; held the line on Q3")), "pending"],
    ["the offset is honoured", inProgressSince("in progress 2026-09-29 14:32 +05:30")?.toISOString(), "2026-09-29T09:02:00.000Z"],
    ["no offset reads as UTC", inProgressSince("in progress 2026-09-29 09:02")?.toISOString(), "2026-09-29T09:02:00.000Z"],
    ["a mark with no time has no age", inProgressSince("in progress"), null],
    ["the age in hours and minutes", markAge(new Date("2026-09-29T09:02:00Z"), now), "2 h 58 min"],
    ["the age in days", markAge(new Date("2026-09-27T09:00:00Z"), now), "2 d 3 h"],
    ["an unreadable time is said, not guessed", markedAgo("in progress soon", now), "marked at a time this check cannot read"],
  ]) {
    n += 1;
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`);
  }
}

one("a page still saying it is running is stamped first", "close",
  build("sp-running", { eyebrow: "running" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "does not say it is closed" });

one("no split plan at all is refused, not passed", "close",
  workspace("sp-noplan", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]:
      `<div class="eyebrow">Workstream 001 &middot; closed</div><section id="s3"><table><thead><tr><th>What</th></tr></thead><tbody><tr><td>a thing</td></tr></tbody></table></section>`,
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`]: arc(),
  }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "checked NOTHING" });

one("landed, carried and deferred all pass", "close",
  build("sp-accounted", { rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried to 002-a-successor"], ["c", "spn-platform-ts", "&#x2298; deferred until a partner asks"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

one("backlog moving into open is not a close", "close",
  build("sp-start", { rows: [...LANDED, ["the third", "spn-platform-ts", ""]], state: "backlog" }),
  move(`.spndevex/${WORKSTREAMS}/backlog/001-a-subject`, `.spndevex/${WORKSTREAMS}/open/`),
  "silent");

console.log("\n=== split-plan — the close gate reads the arcs' step rows");

one("an arc step nobody decided refuses the close, named by arc and step", "close",
  buildArcs("m1-sp-arc-undecided", [...ARC_LANDED, ["4b", "spn-platform-ts", "the third thing", ""]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "N2 step 4b — the third thing", parity: false, why: "the Python reads only a page's scope tables" });

// A DOTTED STEP IS A STEP. `3e.1` is how an arc splits a lettered step, and a reader taking only
// `\d+[a-z]?` skipped it, so an undecided dotted row closed as green.
one("a dotted step nobody decided refuses too", "close",
  buildArcs("m1-sp-arc-dotted", [["1", "spn-foundation", "the chapter", "✅ landed"], ["3e.1", "probe-repo", "the split half", ""]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "N2 step 3e.1", parity: false, why: "the Python reads only a page's scope tables" });

one("every arc step landed, carried or deferred closes, with no page at all", "close",
  buildArcs("m1-sp-arc-accounted", [...ARC_LANDED, ["4", "spn-platform-ts", "c", "⊘ deferred until a partner asks"], ["5", "spn-infra", "d", "↷ carried to 002-a-successor"]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python finds no page and refuses" });

// ONLY THE `## Steps` SECTION IS READ. A table in the log that happens to carry Repo and State is a
// record, and reading it made an empty cell there refuse a close nothing was owed on.
one("a Repo and State table outside the Steps section is not the plan", "close",
  buildArcs("m1-sp-arc-logtable", ARC_LANDED, { log: "\n| Repo | State |\n| --- | --- |\n| spn-infra | |\n" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python finds no page and refuses" });

one("an arc with no step table and no page plan is refused, not passed", "close",
  workspace("m1-sp-arc-noplan", { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N2-the-arc.md`]: arc() }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "step rows of the workstream's arcs" });

one("a page stamped closed with its plan in the arcs closes", "close",
  buildArcs("m1-sp-arc-page", ARC_LANDED, { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python reads only the page, which carries no scope table" });

one("writing a seat page while an arc step naming that repo is not landed", "documents-first",
  buildArcs("m1-sp-arc-seat", [["1", "spn-foundation", "the chapter", "✅ landed"], ["2", "probe-repo", "the check", ""]]),
  { file_path: join(docsOf("probe-repo"), "a-thing-approach.html"), content: "<html></html>" },
  "note", { says: "N2 step 2 — the check", parity: false, why: "the Python reads only a page's scope tables" });

one("and the same write once every row naming it has landed", "documents-first",
  buildArcs("m1-sp-arc-seat-landed", ARC_LANDED),
  { file_path: join(docsOf("probe-repo"), "a-thing-approach.html"), content: "<html></html>" },
  "silent");

console.log("\n=== split-plan — the documents-first gate, and finding F5");

one("F5: a card in Open carrying its own decision", "documents-first",
  build("sp-f5", { cards: card(88, "<strong>C.</strong> The capabilities seat, beside the data model.") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: "the card carries its own decision", parity: false, why: "this is the defect F5 names — the Python reads only the arcs" });

one("F5: an unanswered card is left alone", "documents-first",
  build("sp-f5-open", { cards: card(88, "&mdash;") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "silent");

one("a card an arc records as answered is still caught", "documents-first",
  build("sp-arclog", { cards: card(88, "&mdash;"), log: "\n- **2026-09-18 — Q88 answered C.** The capabilities seat.\n" }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: "an arc records it as answered" });

one("a number in a code span is an example, not a record", "documents-first",
  build("sp-example", { cards: card(88, "&mdash;"), log: "\n- a log saying `Q88 answered` names one card\n" }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "silent");

// N8 row 2k (Q389 A): THE READER REFUSES A CARD IN THE WRONG SHAPE. It found a card only by its `h4`,
// so a `div.card` with an `h3` in `Open` was never read: 008's Open held 35 answered cards and one
// open one in the decided shape, the page showed them green, and the rail counted 0.
const decidedShape = (n) => `  <div class="card" id="q${n}">
    <h3>Q${n} &middot; a question written in the decided shape</h3>
    <p>What is being decided.</p>
  </div>
`;
one("2k: a div.card with an h3 in Open is refused, naming the card and the book's shape", "documents-first",
  build("sp-2k-card", { cards: decidedShape(88) }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: "not in the open-card shape — Q88 in a-subject-approach.html (a `div.card`", parity: false, why: "the Python never read the wrapper" });

one("2k: an h4 card wrapped in a div.card is refused too", "documents-first",
  build("sp-2k-h4-card", { cards: card(88, "&mdash;").replace('<div class="open">', '<div class="card">') }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: "Q88 in a-subject-approach.html (an `h4` inside a `div.card`", parity: false, why: "the Python never read the wrapper" });

one("2k: the refusal states the book's shape and cites RD.DEVEX.WORKSPACE.147", "documents-first",
  build("sp-2k-rule", { cards: decidedShape(88) }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: 'An open card is a `<div class="open">` wrapping `<h4 id="q<n>">` (RD.DEVEX.WORKSPACE.147)', parity: false, why: "the Python never read the wrapper" });

one("2k: a div.open + h4 open card passes", "documents-first",
  build("sp-2k-open", { cards: card(88, "&mdash;") + card(89, "&mdash;") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "silent");

one("2k: an answered h4 card is still refused as today", "documents-first",
  build("sp-2k-answered", { cards: card(88, "<strong>B.</strong> The other way.") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`, content: "x" },
  "note", { says: "Q88 in a-subject-approach.html (the card carries its own decision)", parity: false, why: "this is the defect F5 names — the Python reads only the arcs" });

one("writing a seat page while the workstream's rows still pend", "documents-first",
  build("sp-seat", { rows: [["the chapter", "spn-foundation", "&#x2705; landed"], ["the check", "probe-repo", ""]] }),
  { file_path: join(docsOf("probe-repo"), "a-thing-approach.html"), content: "<html></html>" },
  "note", { says: "Documents-first" });

console.log("\n=== split-plan — the fast path");

// The budget claim: an ordinary Bash call that names no page and no workstream pays almost nothing.
// Measured against the REAL workspace, whose page is 214 KB and whose workstream holds fourteen arcs.
const REAL = `${WORKSPACE}`;
const ordinary = { tool_name: "Bash", cwd: REAL, tool_input: { command: "git status --short" } };
const plan = { tool_name: "Bash", cwd: REAL, tool_input: { command: `mv .spndevex/${WORKSTREAMS}/open/x .spndevex/${WORKSTREAMS}/closed/` } };

function median(fn, runs = 9) {
  const times = [];
  for (let i = 0; i < runs; i += 1) { const t0 = performance.now(); fn(); times.push(performance.now() - t0); }
  return times.sort((a, b) => a - b)[Math.floor(runs / 2)];
}

const tsOrdinary = median(() => ts("documents-first", ordinary, REAL));
const pyOrdinary = median(() => py("documents-first", ordinary, REAL));
const tsPlan = median(() => ts("documents-first", plan, REAL));

console.log(`  an ordinary Bash call   python3 ${pyOrdinary.toFixed(1)} ms  ·  node ${tsOrdinary.toFixed(1)} ms   (whole process, start-up included)`);
console.log(`  one that names the plan  node ${tsPlan.toFixed(1)} ms   — the sweep still runs when it can matter`);

// Both must still ALLOW; the fast path must change cost, never verdict.
{
  n += 1;
  const [v] = ts("documents-first", ordinary, REAL);
  const ok = v === "silent";
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  the fast path changes the cost and not the verdict (${v})`);
}

// THE GATE MUST ACCEPT THE BOOK'S OWN FINISHED WORD. `SPDocStatusType` is DONE · IMPLEMENTING ·
// PLANNING, and the gate listed closed, landed and complete — so closing a workstream correctly
// meant stamping its masthead with a word no other page in the corpus uses.
one("a masthead reading DONE closes", "close",
  build("sp-done", { eyebrow: "Status: &#x2705; DONE" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

one("and one still saying it is running is refused", "close",
  build("sp-running", { eyebrow: "Status: &#x1F6A7; IMPLEMENTING" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "does not say it is closed" });

// THE STATUS IS A FIELD, AND THE TITLE IS NOT IT. `05-artifacts.md` § The approach document says the
// masthead CARRIES a status; reading the whole line for a finished word reads the title too, so this
// page — still PLANNING, under a title with the word *complete* in it — closed as green.
one("a title carrying a finished word does not close a page that is still PLANNING", "close",
  build("sp-title-word", { eyebrow: "Title: The Complete Rewrite | Status: PLANNING" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "does not say it is closed" });

// AND A STATUS THAT IS ONLY NEARLY A FINISHED WORD IS NOT ONE. `incomplete` contains `complete`, so a
// substring read let a page say the opposite of what the gate heard.
one("a status reading incomplete is not read as complete", "close",
  build("sp-incomplete", { eyebrow: "Status: incomplete" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "does not say it is closed" });

// THE OTHER HALF OF THE SAME FAULT: the gate must know the words the standard actually gives an
// approach page. `executed — record` is `05-artifacts.md`'s own finished status, and a page stamped
// exactly as the chapter requires was refused for it.
one("a masthead reading the book's own executed status closes", "close",
  build("sp-executed", { eyebrow: "Status: &#x2705; executed &mdash; record" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

one("and so does one reading authoritative, its other settled status", "close",
  build("sp-authoritative", { eyebrow: "Status: &#x2705; authoritative" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// THE PAGES CLOSED BEFORE THE STANDARD EXISTED STILL READ AS CLOSED. Nine of them trail `· closed`
// after the audience and label no status at all, so there is no field to narrow to and the whole
// line is what the gate has.
one("a masthead with no status label is read whole, as the older pages are written", "close",
  build("sp-unlabelled", { eyebrow: "written for the DevEx agent &middot; &#x2705; settled &middot; closed" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// THE SAME RULE THROUGH THE REAL GATE, because a reader that answers correctly and a gate that acts
// on it are two different claims. These four are the ones a close actually meets.

one("a carry to a scope that can receive it closes", "close",
  build("sp-carry-ok", { rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried to 002-a-successor"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// KNOWN-BAD. `008` carried a row to `010 Phase 3` while `010-register-retrofit` sat in `closed/`,
// and reading `010` showed it had already carried Phase 3 onward to a scope nobody opened. Two
// closes passed and no check ever said so.
one("a carry to a scope that does not exist is refused", "close",
  build("sp-carry-missing", { rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried to 042-nowhere"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "exists in no state" });

// SEQUENCING, NOT HANDOVER. The row names an arc of this same workstream, so nobody else is going to
// do it — and `N1-something.md` carries no status line, which resolves as unfinished rather than as
// a guess.
one("a row waiting on an arc of its own workstream is refused", "close",
  build("sp-sequencing", { arcStatus: "RUNNING", rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N1 step 2"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "waits on an arc" });

one("and it closes once that arc has landed", "close",
  build("sp-sequencing-landed", {
    arcStatus: "LANDED",
    rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N1 step 2"]],
  }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// THE SAME TWO, WITH THE ARC NAMED IN THREE DIGITS: the row says `N001` and the file is
// `N001-something.md`, so the gate finds the arc and reads its status.
one("a row waiting on a three-digit arc of its own workstream is refused", "close",
  build("sp-sequencing-3", { arcFile: "N001-something.md", arcStatus: "RUNNING", rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N001 step 2"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "waits on N001 (RUNNING)" });

one("and it closes once that three-digit arc has landed", "close",
  build("sp-sequencing-3-landed", { arcFile: "N001-something.md", arcStatus: "LANDED",
    rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N001 step 2"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// ---------------------------------------------------------------- every arc must be finished
//
// NOTHING CHECKED THIS UNTIL N66 STEP 7. The gate read arc statuses only to resolve sequencing ROWS
// that named an arc, so an arc nobody's row happened to name could sit at `RUNNING` while its
// workstream moved to `closed/`. Measured across the closed workstreams on 2026-09-24: eight arcs
// still read `OPEN`, and one of them recorded in its own log that it had landed.

one("a workstream holding an unfinished arc cannot close", "close",
  build("sp-arc-unfinished", { arcStatus: "PART-LANDED" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "not terminal" });

one("and a DROPPED arc closes, because abandoning on purpose is finished", "close",
  build("sp-arc-dropped", { arcStatus: "DROPPED" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

one("a CARRIED arc closes too, because the work left and the status names where", "close",
  build("sp-arc-carried", { arcStatus: "CARRIED" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// ---------------------------------------------------------------- what `carried` is allowed to mean
//
// `carried` MEANS THE WORK LEAVES THIS WORKSTREAM (05-artifacts.md § The approach document). Before
// that rule the word covered two things, and the count lied: measured on `008` 2026-09-22, TEN of
// twelve carried rows named a later arc of `008` itself, and the page reported `pending 0` above
// them while one of those arcs sat blocked on an open card.
//
// THESE CASES RUN IN BOTH DIRECTIONS ON PURPOSE. A reader that answered `null` to everything would
// pass every known-bad case below if only the good ones were written, and a gate taught to stay
// quiet is worse than no gate — it carries the authority of one.

const splitPlan = await import("../../../../src/scripts/checks/split-plan.ts");
const carried = (state) => ({ scope: "a scope", label: "a row", state });

function carry(name, state, want) {
  n += 1;
  const got = splitPlan.carryTarget(carried(state)).kind;
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}\n        expect ${want} · got ${got}`);
}

carry("a bare arc number is this workstream's own sequencing", "⤵ carried → N15", "own-arc");
carry("and so is one naming a step", "⤵ carried → N15 step 8", "own-arc");
// THE ARC TEST RUNS FIRST FOR THIS CASE. An arc path holds digits a workstream matcher reads as a
// number, so asking `which workstream` first turned every `arcs/N15-….md` into a handover.
carry("an arc named by its file path is still sequencing", "⤵ carried → arcs/N15-what-the-final-shape-left-owed.md step 8", "own-arc");
// AN ARC NUMBERED IN THREE DIGITS IS STILL AN ARC. `N001` carries the three digits a workstream
// number has, so it is the case where reading the workstream first would name the wrong scope.
carry("a three-digit arc number is this workstream's own sequencing", "⤵ carried → N001 step 2", "own-arc");
carry("and so is a three-digit arc named by its file path", "⤵ carried → arcs/N001-book-change.md step 8", "own-arc");
{
  n += 1;
  const names = ["N001-book-change.md", "N15-what-the-final-shape-left-owed.md", "N1-something.md", "N1a-a-brief.md"].map(splitPlan.arcName).join(",");
  const target = splitPlan.carryTarget(carried("⤵ carried → arcs/N001-book-change.md step 8")).name;
  const ok = names === "N001,N15,N1,N1a" && target === "N001";
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  an arc's short name keeps the digits its file name writes\n        names ${names} · carry target ${target}`);
}
carry("a numbered scope is a handover", "⤵ carried → 003-cloud-day-0", "workstream");
carry("and so is one naming a phase inside it", "⤵ carried → 010 Phase 3 owns the split", "workstream");
carry("a cell naming nothing names no successor", "⤵ carried", "unnamed");

// THE FOLDER IS THE STATE, so this is a directory listing rather than a guess. A fixture holds one
// workstream in each state: the real workspace's `closed/` is emptied as workstreams are archived and
// its `backlog/` is refolded, so a case naming a real workstream fails the day that folder moves.
const STATES_ROOT = workspace("m1-sp-states", {
  [`.spndevex/${WORKSTREAMS}/open/008-plain-language/arcs/N1-a.md`]: "# N1\n",
  [`.spndevex/${WORKSTREAMS}/closed/010-register-retrofit/arcs/N1-a.md`]: "# N1\n",
  [`.spndevex/${WORKSTREAMS}/backlog/003-cloud-day-0/arcs/N1-a.md`]: "# N1\n",
});

function fault(name, state, shouldRefuse) {
  n += 1;
  const got = splitPlan.carryFault(STATES_ROOT, carried(state));
  const ok = shouldRefuse ? got !== null : got === null;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}\n        expect ${shouldRefuse ? "a fault" : "silent"} · got ${got ?? "silent"}`);
}

// KNOWN-BAD. `008` carried a row to `010 Phase 3` and `010-register-retrofit` is in `closed/`;
// reading `010` showed it had already carried Phase 3 onward to a scope nobody opened. Both closes
// passed, and no check ever said so.
fault("a carry to a closed workstream is refused", "⤵ carried → 010 Phase 3 owns the split", true);
fault("a carry to a workstream in no state is refused", "⤵ carried → 042-does-not-exist", true);
fault("a carry naming no successor at all is refused", "⤵ carried", true);

// KNOWN-GOOD. A backlog scope can still receive work, and sequencing is not a carry at all.
fault("a carry to a backlog workstream passes", "⤵ carried → 003-cloud-day-0", false);
fault("an arc of this same workstream is not a carry", "⤵ carried → N15 step 8", false);

function where(name, number, want) {
  n += 1;
  const got = splitPlan.workstreamState(STATES_ROOT, number);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}\n        expect ${want} · got ${got}`);
}

where("an open workstream reads open", "008", "open");
where("a closed one reads closed", "010", "closed");
where("a parked one reads backlog", "003", "backlog");
where("a number nobody used reads nothing", "042", null);

console.log("\n=== split-plan — reading an arc's step table");
{
  const check = (name, ok) => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`); };
  for (const id of ["1", "4b", "3e.1", "10a.2b"]) check(`\`${id}\` is a step id`, splitPlan.STEP_ID.test(id));
  for (const id of ["#", "Field", "**Decides**", "3.", "a1"]) check(`\`${id}\` is not a step id`, !splitPlan.STEP_ID.test(splitPlan.stepId(id)));

  const text = stepArc([["1", "spn-foundation", "the chapter", "✅ landed"], ["**3e.1**", "probe-repo", "the split half", ""]]);
  const rows = splitPlan.arcRowsOf(text, "N2");
  check("the Repo column is the scope", rows.length === 2 && rows[1].scope === "probe-repo");
  check("a row's label is the arc, the step and its What — never the Repo cell",
    rows[1].label === "N2 step 3e.1 — the split half");
  check("the field table above the steps is not read", !rows.some((row) => /Decides/.test(row.label)));

  const steps = splitPlan.stepsOf(text);
  check("stepsOf finds What and State by header", steps?.[1].what === "the split half" && steps?.[1].state === "");
  const older = "# N1\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n";
  const old = splitPlan.stepsOf(older);
  check("an older table with no State column reads What and a null state", old?.[0].what === "a thing" && old?.[0].state === null);
  check("an arc with no Steps section has no steps, which is not an empty table", splitPlan.stepsOf("# N1\n\n## Log\n") === null);

  // A PAGE'S OWN `Repo` TABLE IS NOT A PLAN. Only an arc's step table reads Repo as the scope.
  const pageTable = "<table><thead><tr><th>Repo</th><th>State</th></tr></thead><tbody><tr><td>spn-x</td><td></td></tr></tbody></table>";
  check("a page table with Repo and State is not read as a split plan", splitPlan.rowsOf(pageTable, false).length === 0);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
