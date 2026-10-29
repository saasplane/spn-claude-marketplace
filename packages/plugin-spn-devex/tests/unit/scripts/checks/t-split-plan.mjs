import { PLUGIN } from "../../../helpers/harness.mjs";
// `split-plan` — the two gates, finding F5's fix, and the fast path that is the whole budget.
//
// Every case runs the SAME payload through the Python and the port. The three F5 cases are marked
// `parity: false` on purpose: the Python cannot see a card answered on the page, which is the defect
// the port fixes, so agreeing with it there would mean the fix did not land.
import { execFileSync } from "node:child_process";
import { bindOpen, workspace } from "../../../helpers/fixture.mjs";

import { existsSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { WORKSTREAMS, docsOf } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

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

// A page in the shared form links one version of the shared stylesheet, and every class of it opens
// with `sds-`. `STYLES` is that link, as a stored page carries it.
const STYLES = linesFor("1.0.0").stylesheet;
const page = ({ eyebrow = "closed", rows = [], cards = "" }) => `<!doctype html>
${STYLES}
<div class="sds-eyebrow">Workstream 001 &middot; ${eyebrow}</div>
<h1>A subject</h1>
<section id="s3"><div class="sds-section-head"><h2>How</h2></div>
  <table>
    <thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
    <tbody>
${rows.map(([what, scope, state]) => `      <tr><td>${what}</td><td>${scope}</td><td>${state}</td></tr>`).join("\n")}
    </tbody>
  </table>
</section>
<section id="s4"><div class="sds-section-head"><h2>Open</h2></div>
${cards}
</section>
`;

// A page that links no shared stylesheet: it holds its own copy of the styles, and the class names
// that copy uses. No gate reads a class of it.
const ownPage = ({ eyebrow = "closed", rows = [], cards = "" }) => `<!doctype html>
<style>.eyebrow{font-size:.8rem} .open{border-left:2px solid orange} .card{border-left:2px solid green}</style>
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
// `<div class="sds-open">` wrapping `<h4 id="qN">`, and the page's own furniture depends on it:
// `.sds-open` carries the amber left edge that marks a card undecided, and the rail's count badge is
// `s4.querySelectorAll('.sds-open').length`. A fixture shaped any other way tests a page nobody writes.
const card = (n, decision) => `  <div class="sds-open">
    <h4 id="q${n}">Q${n} &middot; a question only the developer can settle</h4>
    <span class="sds-key">What</span>
    <p>What is being decided.</p>
    <span class="sds-key">Options</span>
    <div class="sds-scroll"><table>
      <thead><tr><th></th><th>What it does</th></tr></thead>
      <tbody><tr><td><strong>A</strong></td><td>one way</td></tr><tr><td><strong>B</strong></td><td>the other</td></tr></tbody>
    </table></div>
    <div class="sds-recommended"><b>Recommended: A.</b> Because of the reason. <b>Decision:</b> ${decision}</div>
  </div>
`;
// The same card as a page with its own copy of the styles writes it.
const ownCard = (n, decision) => card(n, decision).replace(/class="sds-(open|scroll)"/g, 'class="$1"')
  .replace(/class="sds-key"/g, 'class="k"').replace('class="sds-recommended"', 'class="rec"');

// AN ARC KEPT AS DATA (01-workstream.md § The formats): its status, and the rows it holds, each
// `[id, repo, what, state, fields]` in the data's own words — `landed`, `waiting`, `running`, `deferred`,
// `carried` with what it names in its proof, and a card a waiting row is held on as its blocker.
//
// THE STATUS IS A PARAMETER because a sequencing row resolves through it, and its default is `LANDED`:
// the close gate refuses a workstream holding an arc that is not terminal, so a fixture carries an
// unfinished arc only where its case is about one.
const dataArc = (id, status = "LANDED", rows = []) => `${JSON.stringify({ schemaVersion: 2, arc: id, subject: "the-arc",
  title: "the arc", goal: "it lands", status, reason: ["CARRIED", "DROPPED"].includes(status) ? "a reason" : null,
  preview: "preview.html", rows: rows.map(([rowId, repo, title, state, fields = {}]) =>
    ({ id: rowId, parent: id, title, kind: "change", repo, altitude: "DOCS", state, ...fields })) }, null, 2)}\n`;
// A line of an arc's `log.jsonl`.
const logLine = (kind, note, row = null, at = "2026-09-29T14:32+05:30") => `${JSON.stringify({ at, kind, row, note })}\n`;
// The workstream's question records, each answered in the developer's words.
const answeredRecords = (ids) => ids.map((id) => JSON.stringify({ id, arc: "N1", title: "a question", state: "answered",
  raised: "2026-09-18T10:00+05:30", shownIn: [], answer: { key: "C", words: "the capabilities seat", at: "2026-09-18T11:00+05:30" } })).join("\n") + "\n";

const LANDED = [["the chapter", "spn-foundation", "&#x2705; landed"], ["the check", "probe-repo", "&#x2705; landed"]];

function build(name, { eyebrow, rows = LANDED, cards = "", answered = [], log = "", state = "open", arcStatus = "LANDED", arcId = "N1", form = page, extra = {} } = {}) {
  const folder = `.spndevex/${WORKSTREAMS}/${state}/001-a-subject`;
  return workspace(name, {
    ...extra,
    [`${folder}/a-subject-approach.html`]: form({ eyebrow, rows, cards }),
    [`${folder}/arcs/${arcId}/state.json`]: dataArc(arcId, arcStatus),
    ...(log ? { [`${folder}/arcs/${arcId}/log.jsonl`]: log } : {}),
    ...(answered.length ? { [`${folder}/questions.jsonl`]: answeredRecords(answered) } : {}),
    // A SIBLING SCOPE, SO A CARRY HAS SOMEWHERE REAL TO POINT. `carried` means the work leaves this
    // workstream, and the gate reads the folder to see whether the named scope can receive it — so a
    // tree holding one workstream can only ever test a carry that fails.
    [`.spndevex/${WORKSTREAMS}/backlog/002-a-successor/a-successor-approach.html`]: "<h1>002</h1>\n",
    "probe-repo/README.md": "# probe-repo\n",
  });
}

// THE SPLIT PLAN IS THE ARCS' ROWS (RD.DEVEX.WORKSPACE.038, `05-artifacts.md` § The split plan is the
// arcs' step rows): each row's repo is the scope, and its state is read.
/** A workstream whose only split plan is its arc N2's rows; a page is added only where asked. */
function buildArcs(name, rows, { page: withPage = false, log = "", extra = {} } = {}) {
  const folder = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  return workspace(name, {
    [`${folder}/arcs/N2/state.json`]: dataArc("N2", "LANDED", rows),
    ...(log ? { [`${folder}/arcs/N2/log.jsonl`]: log } : {}),
    ...(withPage ? { [`${folder}/a-subject-approach.html`]: `${STYLES}\n<div class="sds-eyebrow">Workstream 001 &middot; closed</div>\n<h1>A subject</h1>\n` } : {}),
    [`.spndevex/${WORKSTREAMS}/backlog/002-a-successor/a-successor-approach.html`]: "<h1>002</h1>\n",
    "probe-repo/README.md": "# probe-repo\n",
    ...Object.fromEntries(Object.entries(extra).map(([file, body]) => [`${folder}/${file}`, body])),
  });
}

const ARC_LANDED = [["1", "spn-foundation", "the chapter", "landed"], ["3e.1", "probe-repo", "the check", "landed"]];

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
  const payload = { tool_name: toolInput.command ? "Bash" : "Write", cwd: root, tool_input: toolInput, session_id: "t-split-plan" };
  bindOpen(root, "t-split-plan");
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
one("a row still running refuses the close, and the age of its log line is named", "close",
  buildArcs("m7-sp-in-progress", [...ARC_LANDED, ["4", "spn-platform-ts", "the proof", "running"]],
    { page: true, log: logLine("running", "waiting → running", "4") }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "still marked in progress", parity: false, why: "the Python predates the mark" });

// RD.DEVEX.WORKSPACE.188 — `⏸ held on Q<n>` waits on a card's answer. It is not accounted for, so the
// close refuses it as it refuses a stopped row, and names the card it waits on.
one("a row waiting on a card refuses the close, and the card is named", "close",
  buildArcs("m11-sp-held", [...ARC_LANDED, ["4", "spn-platform-ts", "the proof", "waiting", { blockedBy: ["q352"] }]], { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "waits on Q352", parity: false, why: "the Python predates the mark" });

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
      `${STYLES}<div class="sds-eyebrow">Workstream 001 &middot; closed</div><section id="s3"><table><thead><tr><th>What</th></tr></thead><tbody><tr><td>a thing</td></tr></tbody></table></section>`,
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1/state.json`]: dataArc("N1"),
  }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "checked NOTHING" });

one("landed, carried and deferred all pass", "close",
  build("sp-accounted", { rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried to 002-a-successor"], ["c", "spn-platform-ts", "&#x2298; deferred until a partner asks"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// THE THIRD CHECK (RD.DEVEX.WORKSPACE.325): after the masthead and the rows, a worktree set on disk
// refuses the close, names the command, and never removes. Each case is the same workstream, with every
// row landed, so the set is the only thing that can refuse it.
const SET_REFUSAL = [
  "Denied: 001-a-subject's worktree set is still on disk, at .worktrees/001-a-subject/.",
  "Run `spnutils workspace worktree remove 001` from the workspace root, then close again.",
  "It refuses work that is not on origin and names it, so push that work or carry it first.",
].join("\n");
const SET_FILES = { ".worktrees/001-a-subject/probe-repo/README.md": "# a worktree of probe-repo\n" };
const closeSet = (root, cwd = root) => {
  const payload = { tool_name: "Bash", cwd, tool_input: move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`), session_id: "t-split-plan" };
  bindOpen(root, "t-split-plan");
  return ts("close", payload, cwd);
};
{
  const [none] = closeSet(build("sp-set-none"));
  const onDisk = build("sp-set-on-disk", { extra: SET_FILES });
  const [held, said] = closeSet(onDisk);
  // A WINDOW INSIDE THE SET STANDS ON IT AS ITS ROOT: the set holds `.spndevex` as a link to the one store.
  const within = build("sp-set-from-within", { extra: SET_FILES });
  const inSet = join(within, ".worktrees", "001-a-subject");
  symlinkSync(join(within, ".spndevex"), join(inSet, ".spndevex"));
  const [fromSet, saidFromSet] = closeSet(within, inSet);
  for (const [label, ok, shown] of [
    ["no set on disk: the close goes on to the rows and passes", none === "silent", none],
    ["a set on disk refuses the close", held === "deny", held],
    ["and the refusal is the three lines, word for word", said.includes(SET_REFUSAL), said],
    ["and the gate removes nothing", existsSync(join(onDisk, ".worktrees/001-a-subject/probe-repo/README.md")), "the set was removed"],
    ["a window inside the set is refused the same way", fromSet === "deny" && saidFromSet.includes(SET_REFUSAL), `${fromSet} ${saidFromSet}`],
  ]) {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` — ${shown}`}`);
  }
}

one("backlog moving into open is not a close", "close",
  build("sp-start", { rows: [...LANDED, ["the third", "spn-platform-ts", ""]], state: "backlog" }),
  move(`.spndevex/${WORKSTREAMS}/backlog/001-a-subject`, `.spndevex/${WORKSTREAMS}/open/`),
  "silent");

console.log("\n=== split-plan — the close gate reads the arcs' rows, kept as data");

one("a row nobody decided, waiting, refuses the close, named by arc, row and What", "close",
  buildArcs("m1-sp-arc-undecided", [...ARC_LANDED, ["4b", "spn-platform-ts", "the third thing", "waiting"]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "N2 row 4b — the third thing", parity: false, why: "the Python reads only a page's scope tables" });

// A DOTTED ROW IS A ROW. `3e.1` is how an arc splits a lettered row.
one("a dotted row nobody decided refuses too", "close",
  buildArcs("m1-sp-arc-dotted", [["1", "spn-foundation", "the chapter", "landed"], ["3e.1", "probe-repo", "the split half", "ready"]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "N2 row 3e.1", parity: false, why: "the Python reads only a page's scope tables" });

one("every arc row landed, carried or deferred closes, with no page at all", "close",
  buildArcs("m1-sp-arc-accounted", [...ARC_LANDED, ["4", "spn-platform-ts", "c", "deferred"], ["5", "spn-infra", "d", "carried", { proof: "to 002-a-successor" }]]),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python finds no page and refuses" });

// THE RETIRED FORM COUNTS FOR NOTHING. An arc written as a Markdown file under `arcs/` is no arc any
// reader keeps, so its undecided step refuses no close.
one("a Markdown arc file's step table is no plan", "close",
  buildArcs("m1-sp-arc-markdown", ARC_LANDED, { extra: { "arcs/N9-old.md":
    "# N9 — old\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n| 1 | spn-infra | DOCS | a thing | by hand | green | |\n" } }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python reads Markdown arcs" });

one("an arc with no rows and no page plan is refused, not passed", "close",
  workspace("m1-sp-arc-noplan", { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N2/state.json`]: dataArc("N2") }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "the rows of the workstream's arcs" });

one("a page stamped closed with its plan in the arcs closes", "close",
  buildArcs("m1-sp-arc-page", ARC_LANDED, { page: true }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent", { parity: false, why: "the Python reads only the page, which carries no scope table" });

one("writing a seat page while an arc row naming that repo is not landed", "documents-first",
  buildArcs("m1-sp-arc-seat", [["1", "spn-foundation", "the chapter", "landed"], ["2", "probe-repo", "the check", "waiting"]]),
  { file_path: join(docsOf("probe-repo"), "a-thing-approach.html"), content: "<html></html>" },
  "note", { says: "N2 row 2 — the check", parity: false, why: "the Python reads only a page's scope tables" });

one("and the same write once every row naming it has landed", "documents-first",
  buildArcs("m1-sp-arc-seat-landed", ARC_LANDED),
  { file_path: join(docsOf("probe-repo"), "a-thing-approach.html"), content: "<html></html>" },
  "silent");

console.log("\n=== split-plan — the documents-first gate, and finding F5");

one("F5: a card in Open carrying its own decision", "documents-first",
  build("sp-f5", { cards: card(88, "<strong>C.</strong> The capabilities seat, beside the data model.") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: "the card carries its own decision", parity: false, why: "this is the defect F5 names — the Python reads only the arcs" });

one("F5: an unanswered card is left alone", "documents-first",
  build("sp-f5-open", { cards: card(88, "&mdash;") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "silent");

one("a card its record holds answered is still caught", "documents-first",
  build("sp-arclog", { cards: card(88, "&mdash;"), answered: ["q88"] }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: "its record in questions.jsonl is settled" });

// THE RETIRED FORM COUNTS FOR NOTHING: a log line naming a card answered is no record of it.
one("a log line saying Q88 answered is no record, so the card stays open", "documents-first",
  build("sp-example", { cards: card(88, "&mdash;"), log: logLine("note", "Q88 answered C") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "silent");

// N8 row 2k (Q389 A): THE READER REFUSES A CARD IN THE WRONG SHAPE. It found a card only by its `h4`,
// so a `div.sds-card` with an `h3` in `Open` was never read: 008's Open held 35 answered cards and one
// open one in the decided shape, the page showed them green, and the rail counted 0.
const decidedShape = (n) => `  <div class="sds-card" id="q${n}">
    <h3>Q${n} &middot; a question written in the decided shape</h3>
    <p>What is being decided.</p>
  </div>
`;
one("2k: a div.sds-card with an h3 in Open is refused, naming the card and the book's shape", "documents-first",
  build("sp-2k-card", { cards: decidedShape(88) }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: "not in the open-card shape — Q88 in .spndevex/workstreams/open/001-a-subject/a-subject-approach.html (a `div.sds-card`", parity: false, why: "the Python never read the wrapper" });

one("2k: an h4 card wrapped in a div.sds-card is refused too", "documents-first",
  build("sp-2k-h4-card", { cards: card(88, "&mdash;").replace('<div class="sds-open">', '<div class="sds-card">') }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: "Q88 in .spndevex/workstreams/open/001-a-subject/a-subject-approach.html (an `h4` inside a `div.sds-card`", parity: false, why: "the Python never read the wrapper" });

one("2k: the refusal states the book's shape and cites RD.DEVEX.WORKSPACE.147", "documents-first",
  build("sp-2k-rule", { cards: decidedShape(88) }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: 'An open card is a `<div class="sds-open">` wrapping `<h4 id="q<n>">` (RD.DEVEX.WORKSPACE.147)', parity: false, why: "the Python never read the wrapper" });

one("2k: a div.sds-open + h4 open card passes", "documents-first",
  build("sp-2k-open", { cards: card(88, "&mdash;") + card(89, "&mdash;") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "silent");

one("2k: an answered h4 card is still refused as today", "documents-first",
  build("sp-2k-answered", { cards: card(88, "<strong>B.</strong> The other way.") }),
  { file_path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`, content: "x" },
  "note", { says: "Q88 in .spndevex/workstreams/open/001-a-subject/a-subject-approach.html (the card carries its own decision)", parity: false, why: "this is the defect F5 names — the Python reads only the arcs" });

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
// do it, and only `LANDED` in that arc's data resolves it.
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

// THE SAME TWO, WITH THE ARC NAMED IN THREE DIGITS: the row says `N001`, and the gate reads
// `arcs/N001/state.json`.
one("a row waiting on a three-digit arc of its own workstream is refused", "close",
  build("sp-sequencing-3", { arcId: "N001", arcStatus: "RUNNING", rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N001 step 2"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "waits on N001 (RUNNING)" });

one("and it closes once that three-digit arc has landed", "close",
  build("sp-sequencing-3-landed", { arcId: "N001", arcStatus: "LANDED",
    rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "probe-repo", "&#x21B7; carried &rarr; N001 step 2"]] }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "silent");

// ---------------------------------------------------------------- every arc must be finished
//
// NOTHING CHECKED THIS UNTIL N66 STEP 7. The gate read arc statuses only to resolve sequencing ROWS
// that named an arc, so an arc nobody's row happened to name could sit at `RUNNING` while its
// workstream moved to `closed/`. Measured across the closed workstreams on 2026-09-24: eight arcs
// still read `OPEN`, and one of them recorded in its own log that it had landed.

one("a workstream holding a DECIDED arc, agreed and never built, cannot close (RD.DEVEX.WORKSPACE.313)", "close",
  build("sp-arc-unfinished", { arcStatus: "DECIDED" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "not terminal" });

one("nor can one holding a PROPOSED arc, shaped and never decided", "close",
  build("sp-arc-proposed", { arcStatus: "PROPOSED" }),
  move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`),
  "deny", { says: "arc delete" });

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
// AN ARC NUMBERED IN THREE DIGITS IS STILL AN ARC. `N001` carries the three digits a workstream
// number has, so it is the case where reading the workstream first would name the wrong scope.
carry("a three-digit arc number is this workstream's own sequencing", "⤵ carried → N001 step 2", "own-arc");
carry("a numbered scope is a handover", "⤵ carried → 003-cloud-day-0", "workstream");
carry("and so is one naming a phase inside it", "⤵ carried → 010 Phase 3 owns the split", "workstream");
carry("a cell naming nothing names no successor", "⤵ carried", "unnamed");

// THE FOLDER IS THE STATE, so this is a directory listing rather than a guess. A fixture holds one
// workstream in each state: the real workspace's `closed/` is emptied as workstreams are archived and
// its `backlog/` is refolded, so a case naming a real workstream fails the day that folder moves.
const STATES_ROOT = workspace("m1-sp-states", {
  [`.spndevex/${WORKSTREAMS}/open/008-plain-language/approach.html`]: "<h1>008</h1>\n",
  [`.spndevex/${WORKSTREAMS}/closed/010-register-retrofit/approach.html`]: "<h1>010</h1>\n",
  [`.spndevex/${WORKSTREAMS}/backlog/003-cloud-day-0/approach.html`]: "<h1>003</h1>\n",
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

console.log("\n=== split-plan — a step id, and a page's own Repo table");
{
  const check = (name, ok) => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`); };
  for (const id of ["1", "4b", "3e.1", "10a.2b"]) check(`\`${id}\` is a step id`, splitPlan.STEP_ID.test(id));
  for (const id of ["#", "Field", "**Decides**", "3.", "a1"]) check(`\`${id}\` is not a step id`, !splitPlan.STEP_ID.test(splitPlan.stepId(id)));

  // A PAGE'S OWN `Repo` TABLE IS NOT A PLAN: a page's plan is read by its Scope column.
  const pageTable = "<table><thead><tr><th>Repo</th><th>State</th></tr></thead><tbody><tr><td>spn-x</td><td></td></tr></tbody></table>";
  check("a page table with Repo and State is not read as a split plan", splitPlan.rowsOf(pageTable, false).length === 0);
}

console.log("\n=== split-plan — the report run by hand, over the arcs' rows");
{
  const check = (name, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const rows = [["1", "spn-x", "the good row", "landed"], ["2", "spn-x", "the bad row", "waiting"], ["3", "spn-x", "the held row", "waiting", { blockedBy: ["q7"] }]];
  const root = workspace("n006-sp-report", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N9/state.json`]: dataArc("N9", "RUNNING", rows),
    "probe-repo/README.md": "# probe-repo\n",
  });
  let out = "";
  try { out = execFileSync("node", [`${HOOKS}/src/scripts/checks/split-plan.ts`, root], { encoding: "utf8", cwd: root }); } catch (e) { out = String(e.stdout ?? ""); }
  check("[MKT.HOOKS.36] the report run by hand lists a row nobody decided, and a row held on a card",
    /undecided\s+spn-x — N9 row 2 — the bad row/.test(out) && /held\s+spn-x — N9 row 3 — the held row/.test(out), out);
  check("[MKT.HOOKS.36] under the tally the Stop hook reads", /001-a-subject: 3 rows · landed 1 · .*held 1 · .*undecided 1/.test(out), out);
  const plan = splitPlan.dataRowsOf(join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject`));
  const lines = splitPlan.reportLines(root, "N9", plan);
  check("[MKT.HOOKS.36] the tally is a function that returns lines: the count first, then each row nobody accounted for",
    lines.length === 3 && lines[0].startsWith("N9: 3 rows · landed 1"), JSON.stringify(lines));
  check("[MKT.HOOKS.36] an arc with every row accounted for is one line, the tally",
    splitPlan.reportLines(root, "N9", plan.slice(0, 1)).length === 1);
}

console.log("\n=== split-plan — a tick with no date and no landed word reads as pending");
{
  const row = (state) => ({ label: "x", scope: "spn-foundation", state });
  for (const [what, state, expected] of [
    ["known-bad: `✅ the arc is written` reads pending", "✅ the arc is written", "pending"],
    ["known-bad: a tick before a commit alone reads pending", "✅ `abc1234`", "pending"],
    ["`✅ 2026-09-07` still reads landed", "✅ 2026-09-07", "landed"],
    ["`✅ landed 2026-10-01 — <commit>` still reads landed", "✅ landed 2026-10-01 — `abc1234`", "landed"],
    ["`✅ **done 2026-09-23**` still reads landed", "✅ **done 2026-09-23**", "landed"],
    ["`✅ shipped` still reads landed", "✅ shipped", "landed"],
    ["the word with no tick still reads landed", "LANDED — `def5678`", "landed"],
    ["a tick alone is still a row nobody decided", "✅", "empty"],
    ["a tick before `carried` reads carried, as the word says", "✅ carried → 002-a-successor", "carried"],
  ]) {
    n += 1;
    const got = splitPlan.stateOf(row(state));
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  [MKT.HOOKS.39] ${what}${ok ? "" : ` — got ${got}`}`);
  }
  for (const [what, cell, expected] of [
    ["a tick followed by a date lands", "✅ 2026-09-07", true],
    ["a tick followed by a landed word in bold lands", "✅ **done 2026-09-23** — the proof", true],
    ["a tick followed by other words does not", "✅ the arc is written", false],
    ["a cell with no tick does not", "landed 2026-09-27", false],
  ]) {
    n += 1;
    const ok = splitPlan.tickLands(cell) === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  [MKT.HOOKS.39] ${what}`);
  }
}

console.log("\n=== split-plan — a carry with its date before the arrow still names its successor");
{
  // KNOWN-BAD: `↷ carried 2026-10-01 → N006 row 1` read as naming no successor, and printed DEAD CARRY.
  carry("[MKT.SCRIPTS.05] a dated carry to an arc of this workstream is sequencing", "↷ carried 2026-10-01 → N006 row 1", "own-arc");
  carry("[MKT.SCRIPTS.05] a dated carry to another workstream is a handover", "↷ carried 2026-10-01 → 003-cloud-day-0", "workstream");
  carry("[MKT.SCRIPTS.05] a dated carry written with `to` reads the same", "↷ carried 2026-10-01 to 003-cloud-day-0", "workstream");
  carry("[MKT.SCRIPTS.05] a date and nothing after it still names no successor", "↷ carried 2026-10-01", "unnamed");
  n += 1;
  const named = splitPlan.carryTarget(carried("↷ carried 2026-10-01 → N006 row 1")).name;
  if (named !== "N006") failed += 1;
  console.log(`  ${named === "N006" ? "PASS" : "FAIL"}  [MKT.SCRIPTS.05] and the arc it names is read, not the date\n        got ${named}`);
  fault("[MKT.SCRIPTS.05] a dated carry to a backlog workstream passes", "↷ carried 2026-10-01 → 003-cloud-day-0", false);
  fault("[MKT.SCRIPTS.05] a dated carry to an arc of this workstream is not a dead carry", "↷ carried 2026-10-01 → N006 row 1", false);
  fault("[MKT.SCRIPTS.05] a dated carry to a closed workstream is still refused", "↷ carried 2026-10-01 → 010 Phase 3", true);
}

console.log("\n=== split-plan — the header's status field, and the cards of a page's Open");
{
  const check = (name, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const labelled = `<div class="sds-eyebrow"><span>SaaS Plane | Workstream | 020</span><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-implementing">&#x1F6A7; IMPLEMENTING</span></span></div>`;
  check("the status field is what follows the label", splitPlan.mastheadStatus(labelled) === "🚧 IMPLEMENTING", splitPlan.mastheadStatus(labelled));
  check("a header that labels no status has no field", splitPlan.mastheadStatus(`<div class="sds-eyebrow">Workstream 001 &middot; closed</div>`) === null);
  check("a page with no header has none", splitPlan.mastheadStatus("<h1>x</h1>") === null);
  const cards = splitPlan.cardsIn(page({ cards: card(3, "&mdash;") + card(4, "A, 2026-09-19") }));
  check("the cards of Open are read from a page's text, each with whether it carries its decision",
    cards.map((one) => `${one.number}:${one.decided}`).join(",") === "Q3:false,Q4:true", JSON.stringify(cards));
}

console.log("\n=== split-plan — a page that holds its own copy of the styles");
{
  const ARC = `.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N1/plan.md`;
  const CLOSE = move(`.spndevex/${WORKSTREAMS}/open/001-a-subject`, `.spndevex/${WORKSTREAMS}/closed/`);
  const check = (name, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${detail}`}`); };

  // KNOWN-BAD FOR A READER OF THE SHARED NAMES: every card of this page is a `div.open`, which is the
  // name its own copy of the styles uses. Read by the shared names it would be `not in the open-card shape`.
  const unmoved = build("sp-own-copy", { form: ownPage, cards: ownCard(88, "&mdash;") + ownCard(89, "&mdash;") });
  const payload = { tool_name: "Write", cwd: unmoved, tool_input: { file_path: ARC, content: "x" }, session_id: "t-own-copy" };
  bindOpen(unmoved, "t-own-copy");
  const [gave, said] = ts("documents-first", payload, unmoved);
  check("[MKT.SCRIPTS.108] the gate names a page with its own copy once, as a RULE line with what to do, and lets the call through",
    gave === "note" && said.split(OWN_COPY).length - 1 === 1 && said.startsWith(`[RULE] \`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html\``), said);
  check("[MKT.SCRIPTS.108] and reads no class of it: no card is reported as out of shape",
    !said.includes("open-card shape") && !said.includes("div."), said);
  const lines = splitPlan.ownCopyLines(unmoved, [join(unmoved, `.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`)]);
  check("[MKT.SCRIPTS.108] the line is the page's path from the workspace, then OWN_COPY", lines.length === 1 && lines[0].endsWith(`${OWN_COPY}.`), JSON.stringify(lines));
  check("[MKT.SCRIPTS.108] the shape of a card on such a page is not judged",
    splitPlan.misshapenCards(join(unmoved, `.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`)).length === 0);

  // THE WINDOW DECIDES WHO IS TOLD, never the call's text (RD.DEVEX.WORKSPACE.236): a window that works on
  // no workstream is told nothing about this page, whatever the call names.
  check("[MKT.SCRIPTS.108] a window that works on no workstream is not told about the page",
    ts("documents-first", { tool_name: "Bash", cwd: unmoved, tool_input: { command: `ls .spndevex/${WORKSTREAMS}/open/001-a-subject` }, session_id: "t-no-workstream" }, unmoved)[0] !== "note");

  one("[MKT.SCRIPTS.108] a write of the page itself is left to doc-check, so one call does not name the page twice", "documents-first",
    unmoved, { file_path: join(unmoved, `.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`), content: "<h1>x</h1>" },
    "silent", { parity: false, why: "the Python knows no shared stylesheet" });

  one("[MKT.SCRIPTS.108] a card answered on such a page is still found, because a card is read by its id", "documents-first",
    build("sp-own-copy-answered", { form: ownPage, cards: ownCard(88, "<strong>B.</strong> The other way.") }),
    { file_path: ARC, content: "x" }, "note", { says: "Q88 in .spndevex/workstreams/open/001-a-subject/a-subject-approach.html (the card carries its own decision)", parity: false, why: "the Python knows no shared stylesheet" });

  // UNTOUCHED: the same cards on a page in the shared form draw no line at all.
  one("[MKT.SCRIPTS.108] untouched: a page in the shared form is not named", "documents-first",
    build("sp-shared-form", { cards: card(88, "&mdash;") }), { file_path: ARC, content: "x" }, "silent");

  // The close gate does not read the header of such a page, so `running` in it refuses nothing.
  const closing = build("sp-own-copy-close", { form: ownPage, eyebrow: "Status: &#x1F6A7; IMPLEMENTING" });
  const [closed, closeSaid] = ts("close", { tool_name: "Bash", cwd: closing, tool_input: CLOSE }, closing);
  check("[MKT.SCRIPTS.108] the close gate reads no header of such a page, and names the page once, as a RULE line that refuses nothing",
    closed === "note" && closeSaid.split(OWN_COPY).length - 1 === 1 && closeSaid.includes(`[RULE] \`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html\``)
      && !closeSaid.includes("[SOFT]") && !closeSaid.includes("does not say it is closed"), `${closed} · ${closeSaid}`);
  one("[MKT.SCRIPTS.108] untouched: the same header on a page in the shared form still refuses the close", "close",
    build("sp-shared-running", { eyebrow: "Status: &#x1F6A7; IMPLEMENTING" }), CLOSE, "deny", { says: "does not say it is closed" });

  // A page under `closed/` is never named.
  const shut = build("sp-own-copy-closed", { form: ownPage, state: "closed" });
  check("[MKT.SCRIPTS.108] a page under closed/ is never named",
    splitPlan.ownCopyLines(shut, [join(shut, `.spndevex/${WORKSTREAMS}/closed/001-a-subject/a-subject-approach.html`)]).length === 0);
}

// AN ANSWERED CARD IS FOUND BY ITS ANCHOR, never by a Q number in the text (05-artifacts.md § The fold
// check reads the anchor). Until the records moved to `questions.jsonl` the reader of answers found
// none, so this half of the rule never ran; the first page it read folded every answer under `id="q1"`
// and still drew the note, because it looked for `Q1` in the words.
{
  const folder = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  const folded = (body) => {
    const root = workspace(`sp-unfolded-${n}`, {
      [`${folder}/questions.jsonl`]: answeredRecords(["q7"]),
      [`${folder}/approach.html`]: `<section id="s2"><h2>What</h2>${body}</section><section id="s4"><h2>Open</h2></section>\n`,
    });
    return splitPlan.unfoldedCards(join(root, folder), [join(root, folder, "approach.html")]).map(([, number]) => number);
  };
  const unfolded = (name, body, want) => {
    const got = folded(body).join(" ");
    n += 1;
    const ok = got === want;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}\n        expect "${want}" · got "${got}"`);
  };
  console.log("\n=== split-plan — an answered card is found by its anchor");
  unfolded("an answer folded under its q<n> anchor in What draws no note",
    `<p id="q7">The library covers pages built from sections.</p>`, "");
  unfolded("an answered card that left nothing behind is named",
    `<p>The library covers pages built from sections.</p>`, "Q7");
  unfolded("a Q number in the words is no fold: the card's anchor is",
    `<p>As Q7 settled, the library covers pages built from sections.</p>`, "Q7");
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
