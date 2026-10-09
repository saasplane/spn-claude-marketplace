import { PLUGIN } from "../../../helpers/harness.mjs";
// `stop` — the four arc-to-page checks and reply-shape, merged into stop.ts.
//
// EACH KNOWN-BAD IS RUN TWICE: once with arcs named `arc-{subject}.md`, which is what the Python
// looks for, and once with them named `N1-{subject}.md`, which is what this workspace actually uses.
// The first pair proves parity. The second is finding F11 — the Python goes silent and the port does
// not, which is the whole reason the filter had to go.
import { execFileSync } from "node:child_process";
import { bindOpen, wroteArcs, workspace } from "../../../helpers/fixture.mjs";

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { bindNamed, recordWrites } from "../../../../src/scripts/lib/window.ts";
import { resolve, join } from "node:path";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

// Every workstream open in a fixture, as the set of a window that works on all of them. The checks take
// the workstreams their window works on and read no others (RD.DEVEX.WORKSPACE.236).
const everyone = (root) => { try { return new Set(readdirSync(join(root, ".spndevex", "workstreams", "open"))); } catch { return new Set(); } };

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


// A page in the shared form links one version of the shared stylesheet, and every class of it opens
// with `sds-`. `STYLES` is that link, as a stored page carries it.
const STYLES = linesFor("1.0.0").stylesheet;
const page = ({ rows = [["a thing", "spn-foundation", "&#x2705; landed"]], cards = "", names = [], settled = [] }) => `<!doctype html>
${STYLES}
<div class="sds-eyebrow">Workstream 001 &middot; running</div>
<section id="s3"><div class="sds-section-head"><h2>How</h2></div>
  <table><thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
  <tbody>
${rows.map(([w, s, st]) => `    <tr><td>${w}</td><td>${s}</td><td>${st}</td></tr>`).join("\n")}
  </tbody></table>
  ${names.map((n) => `<p>The argument behind it is in <code>${n}</code>.</p>`).join("\n  ")}
</section>
<section id="s6"><div class="sds-section-head"><h2>Settled already</h2></div>
  <table><tbody>
${settled.map((c) => `    <tr><td>${c} &middot; a question</td><td>Answered B, 2026-09-09</td></tr>`).join("\n")}
  </tbody></table>
</section>
<section id="s4"><div class="sds-section-head"><h2>Open</h2></div>
${cards}
</section>`;

// A CARD IS A TABLE ROW (Q185), options nested, so the reader is exercised on the shape that breaks
// a first-`</tr>` match rather than on the inline shape that happens to survive one.
// The template's open card: `<div class="sds-open">` wrapping `<h4 id="qN">`. The page's amber edge and
// the rail's count badge both key on `.sds-open`, so a card written as a row loses both.
const CARD = `  <div class="sds-open">
    <h4 id="q1">Q1 &middot; a real question</h4>
    <div class="sds-scroll"><table><thead><tr><th></th><th>What</th></tr></thead>
    <tbody><tr><td><strong>A</strong></td><td>one way</td></tr></tbody></table></div>
    <div class="sds-recommended"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>
  </div>`;

// A reply given while a card is open opens with **Needs you** (RD.DEVEX.WORKSPACE.189), so every
// case that expects silence over an open card opens its reply with it.
const NEEDS = "## Needs you\n\nQ1 · a real question — it is on the approach page.\n\n## Progress\n\n";

const ARC =(extra = "") => `# Arc — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n\n## Log\n\n- **2026-09-19 — go.**\n${extra}`;

/** One workspace, with its arcs named either the old way or the way 008 actually names them. */
function build(name, { arcNames, pageOpts = {}, arcExtra = "" }) {
  const files = {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page(pageOpts),
  };
  for (const arc of arcNames)
    files[`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/${arc}`] = ARC(arcExtra);
  return workspace(name, files);
}

function run(cmd, args, payload, cwd) {
  try {
    const out = execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8", cwd });
    return out.trim();
  } catch (e) {
    // stop.ts warns on stderr and exits 2; stop.py prints JSON on stdout.
    return `${String(e.stdout ?? "")}${String(e.stderr ?? "")}`.trim();
  }
}

const said = (out) => {
  if (!out) return "";
  try { return JSON.parse(out.split("\n").filter(Boolean).at(-1)).systemMessage ?? ""; } catch { return out; }
};

let n = 0, failed = 0;
function one(label, root, expect, { says, reply = "done", parity = true, why = "", session, edit, extra = {} } = {}) {
  n += 1;
  // EVERY CASE IS A WINDOW THAT WORKS ON THE FIXTURE'S OPEN WORKSTREAMS (RD.DEVEX.WORKSPACE.236): a hook
  // speaks only of the workstreams its window is bound to, so the case says whose window it is.
  const sid = session ?? `t-stop-${n}`;
  bindOpen(root, sid);
  const payload = { cwd: root, last_assistant_message: reply, session_id: sid, ...extra };
  // A SESSION'S FIRST STOP IS ITS BASELINE. Where a case is about work this session did, the hook
  // runs once to take that baseline, the edit is made, and the case is the second Stop. The edit is
  // this window's own write, so the window's note records it as PreToolUse would.
  if (edit) { run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root); edit(root); wroteArcs(root, sid); }
  const ts = said(run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root));
  const py = hasPython("stop.py") ? said(run("python3", [`${SCRIPTS}/stop.py`], payload, root)) : null;
  const saysOk = !says || ts.includes(says);
  const spoke = Boolean(ts), pySpoke = Boolean(py);
  const ok = spoke === (expect === "warns") && saysOk && (py === null || !parity || spoke === pySpoke);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${spoke ? "warns" : "silent"} · py ${py === null ? "not installed" : pySpoke ? "warns" : "silent"}${says ? ` · names "${says}" ${saysOk}` : ""}${parity ? "" : ` (parity waived: ${why})`}`);
  if (!ok) console.log(`        ts: ${ts.slice(0, 300)}\n        py: ${py === null ? "(not installed)" : py.slice(0, 300)}`);
}

const F11 = "the Python listed arcs as `arc-*` only, so an N-named arc was invisible to it";
const F17 = "the Python matches the article `a` as option A; the port is case-sensitive on the letter";
const F18 = "the Python fires on `option B` used as a reference; the port needs it to open a clause";

console.log("\n=== stop — the arc-to-page checks, with arcs named the way the Python expects");

one("an arc no row of the page names",
  build("stop-unnamed-old", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD } }),
  "warns", { says: "An arc the page does not name" });

one("a Q card written into an arc while the page shows none",
  build("stop-cards-old", { arcNames: ["arc-a-subject.md"], arcExtra: "\n### `Q9` · a question that belongs on the page\n\nsome argument\n" }),
  "warns", { says: "A card written into an arc" });

one("an open workstream with arcs and no page at all",
  workspace("stop-pageless-old", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/arc-a-subject.md`]: ARC(),
  }),
  "warns", { says: "An open workstream with arcs and no page" });

one("a stopped row while Open carries no card",
  build("stop-stopped-old", { arcNames: ["arc-a-subject.md"],
    pageOpts: { rows: [["half of it", "spn-support-ts", "&#x25D0; 2026-09-08 part done"]], names: ["arc-a-subject.md"] } }),
  "warns", { says: "A row waiting on the developer" });

console.log("\n=== stop — F11: the same four, with arcs named the way this workspace names them");

one("an arc no row names, N-named",
  build("stop-unnamed-new", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD } }),
  "warns", { says: "An arc the page does not name", parity: false, why: F11 });

one("a Q card in an N-named arc while the page shows none",
  build("stop-cards-new", { arcNames: ["N1-a-subject.md"], arcExtra: "\n### `Q9` · a question that belongs on the page\n\nsome argument\n" }),
  "warns", { says: "A card written into an arc", parity: false, why: F11 });

one("an open workstream whose only arcs are N-named, and no page",
  workspace("stop-pageless-new", { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: ARC() }),
  "warns", { says: "An open workstream with arcs and no page", parity: false, why: F11 });

console.log("\n=== stop — a workstream's page is found by the name approach.html");

one("an open workstream whose page is approach.html, naming its arc",
  workspace("stop-approach-page", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/approach.html`]: page({ names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: ARC(),
  }),
  "silent", { parity: false, why: "the Python finds a page by its suffix only" });

one("the same page, with an arc it does not name",
  workspace("stop-approach-page-unnamed", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/approach.html`]: page({ names: [] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: ARC(),
  }),
  "warns", { says: "An arc the page does not name", parity: false, why: "the Python finds a page by its suffix only" });

console.log("\n=== stop — F16: the template's own unanswered card must read as open");

// The card template ships `<b>Decision:</b> &mdash;`. A check that asks only whether the marker is
// PRESENT reads every such card as answered — which is what `openCards` did, so `runnable` could
// never see a card as open and nagged through sittings where one was.
const RUNNING = "# Arc — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n| 2 | another thing | here | ☐ raised |\n\n## Log\n\n- **2026-09-19 — go.**\n";

function runningWorkspace(name, cards) {
  return workspace(name, {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]:
      page({ cards, names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: RUNNING,
  });
}

// THE WORK A CASE DOES BETWEEN ITS TWO STOPS: step 1 of the arc reworded, so the step rows move.
const ARC_AT = `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`;
const reword = (root) => {
  const file = join(root, ARC_AT);
  writeFileSync(file, readFileSync(file, "utf8").replace("| 1 | a thing |", "| 1 | a thing, reworded |"), "utf8");
};
const worked = (session) => ({ session, edit: reword });

one("an unlanded step with the template's card open — runnable must stay quiet",
  runningWorkspace("stop-f16-open", CARD),
  "silent", { ...worked("f16-open"), reply: NEEDS + "done", parity: false, why: "F16 — the Python read the template's `Decision:` marker as an answer" });

const ANSWERED = CARD.replace("<b>Decision:</b> &mdash;", "<b>Decision:</b> A, 2026-09-19.");
one("the same card once it carries a real decision — runnable speaks again",
  runningWorkspace("stop-f16-answered", ANSWERED),
  "warns", { ...worked("f16-answered"), says: "no card is open", parity: false, why: "F16 — the Python could not tell these two apart" });

one("an unlanded step with no card at all",
  runningWorkspace("stop-f16-none", ""),
  "warns", { ...worked("f16-none"), says: "no card is open", parity: false, why: "F11 — the Python listed arcs as `arc-*` only" });

// N90 STEP 6 — A MARK WORD IN A ROW'S PROSE IS NOT A MARKER.
//
// `DONE_MARKS` was read against the whole row joined into one string, and three of its six entries
// are ordinary English. So a step DESCRIBING landed work counted as landed work. Measured over
// `008-plain-language`: thirteen rows, `N90`'s own step 3 among them — *spot-check the claimed-LANDED
// steps rather than trusting them* — reported done because the sentence contains `landed`.
//
// BOTH DIRECTIONS ARE PROVEN HERE, because only the pair distinguishes the fix from deleting the
// words: a row that merely mentions landing is still open, and a cell that IS the word still counts.
const PROSE_MENTIONS_MARK = RUNNING.replace(
  "| 2 | another thing | here | ☐ raised |",
  "| 2 | the gate that `N2` records as landed, and is not | here | ☐ raised |");
one("a step whose own prose says `landed` is still an open step",
  workspace("stop-n90-word-in-prose", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: PROSE_MENTIONS_MARK,
  }),
  "warns", { ...worked("n90-prose"), says: "no card is open", parity: false, why: "N90 step 6 — the reader could not tell a marker from a word" });

const WORD_AS_CELL = RUNNING.replace(
  "| 2 | another thing | here | ☐ raised |",
  "| 2 | another thing | here | landed 2026-09-27, `abc1234` |");
one("a state cell reading `landed` with a date still counts as done",
  workspace("stop-n90-word-as-cell", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: WORD_AS_CELL,
  }),
  "silent", { ...worked("n90-cell"), parity: false, why: "N90 step 6 — the fix bounds where a word is read, it does not drop the word" });

console.log("\n=== runnable — N39 step 8: which arc is being executed is a fact, not a status word");

// MEASURED 2026-09-23 OVER WORKSTREAM `008`: exactly ONE arc of 57 carries the word `RUNNING`, and
// it is not the arc any recent sitting has been executing. The rest read LANDED 26, PART-LANDED 15,
// DECIDED 2, OPEN 2, TAKEN 1, and 10 carry no status line at all. So this gate — the one written for
// *reported and stopped* — can speak about one arc in fifty-seven. What the sitting wrote is on disk.
{
  const { checkRunnable } = await import("../../../../src/scripts/events/stop.ts");
  const OPEN_ARC = RUNNING.replace("Status: **RUNNING**", "**Status: OPEN \u2014 opened today**");
  const root = workspace("stop-runnable-touched", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: OPEN_ARC,
  });
  const past = Date.now() - 60_000, future = Date.now() + 60_000;

  // The third argument is the STEP-ROW baseline. Editing an arc is not executing it: a sweep that set
  // the status line of five arcs made every one report as runnable work in the same turn, which is
  // five findings about arcs nobody touched the substance of. So a stale hash means the work moved,
  // a matching hash means only the record did, and an empty map means there is no baseline to judge by.
  const arcPath = join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`);
  const WORK_MOVED = { [arcPath]: "a-different-hash" };

  for (const [what, since, expected, baseline] of [
    ["an arc whose STEP ROWS moved this sitting, whatever its status says", past, 1, WORK_MOVED],
    ["the same arc when this sitting did not write it", future, 0, WORK_MOVED],
    ["no baseline of this session's own — its first Stop stays quiet", 0, 0, WORK_MOVED],
  ]) {
    n += 1;
    const got = checkRunnable(root, since, baseline, null, everyone(root)).length;
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${what} -> ${got} warning(s)`);
  }

  // THE CASE THE SWEEP TAUGHT: the file moved and the step table did not.
  n += 1;
  {
    const { stepHash } = await import("../../../../src/scripts/events/stop.ts");
    const same = { [arcPath]: stepHash(readFileSync(arcPath, "utf8")) };
    const quiet = checkRunnable(root, past, same, null, everyone(root)).length === 0;
    if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  an arc whose RECORD moved but whose step rows did not is silent`);
  }

  // A STATUS WORD IS A CLAIM ANY WINDOW CAN HAVE WRITTEN. `RUNNING` fired on `N114` in a headless
  // window that had never opened it, after every reply, and forced eight "Blocked" turns. With no
  // baseline of this session's own, the word alone decides nothing.
  n += 1;
  const claimedRoot = workspace("stop-runnable-claimed", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: RUNNING,
  });
  const claimed = checkRunnable(claimedRoot, 0, {}, null, everyone(claimedRoot)).length === 0;
  if (!claimed) failed += 1;
  console.log(`  ${claimed ? "PASS" : "FAIL"}  an arc that SAYS RUNNING no longer fires on the word alone`);

  // A LANDED ARC'S UNFINISHED ROWS ARE HISTORY. Editing one to add a log line must not report it.
  n += 1;
  const landedRoot = workspace("stop-runnable-landed", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: RUNNING.replace("Status: **RUNNING**", "**Status: LANDED 2026-09-23**"),
  });
  const landed = checkRunnable(landedRoot, past, WORK_MOVED, null, everyone(landedRoot)).length === 0;
  if (!landed) failed += 1;
  console.log(`  ${landed ? "PASS" : "FAIL"}  a LANDED arc written this sitting is history, not work`);

  // THE TRANSCRIPT SAYS WHO WROTE THE ARC. A file time says it moved and never who moved it, and
  // several windows write one workstream at once, so where this session's own tool calls are known
  // they decide: an arc it did not write is not its work, whatever the file time says.
  for (const [what, touched, expected] of [
    ["an arc another window changed, which this session never wrote", new Set(), 0],
    ["the same arc when this session's own tool call wrote it", new Set([arcPath]), 1],
  ]) {
    n += 1;
    const got = checkRunnable(root, past, WORK_MOVED, touched, everyone(root)).length;
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${what} -> ${got} warning(s)`);
  }
}

console.log("\n=== runnable — scoped to the session, the step row read by header");
{
  const { arcsTouched } = await import("../../../../src/scripts/events/stop.ts");
  // THE N116 ROW SHAPE: `# · Repo · Altitude · What · Mechanism · Acceptance · State`. The second
  // cell is the repository, so a message printing `cells[1]` named `spn-foundation` as the step.
  const SHAPED = `# N3 — a subject\n\nStatus: **RUNNING — 2026-09-29.**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 3e | spn-foundation | DOCS | the carried half, which is ✅ landed in prose | by hand | audit | ✅ landed |\n` +
    `| 3e.1 | spn-support-ts | CODE | the split check | by hand | its suite | |\n` +
    `| 4 | — | PROOF | the proof run | command | green | |\n\n## Log\n\n- **2026-09-29 — go.**\n`;
  const shaped = (name) => workspace(name, {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N3-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N3-a-subject.md`]: SHAPED,
  });
  const SHAPED_AT = `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N3-a-subject.md`;
  const touchStep = (root) => {
    const file = join(root, SHAPED_AT);
    writeFileSync(file, readFileSync(file, "utf8").replace("| the proof run |", "| the proof run, reworded |"), "utf8");
  };

  one("the next step is named by its id and its What, never its Repo",
    shaped("m1-stop-shaped"), "warns",
    { session: "m1-shaped", edit: touchStep, says: "The next one is step 3e.1 — the split check", parity: false, why: "N116 row shape" });

  // THE CITATION IS THE CHAPTER THAT HOLDS THE RULE NOW. `11-workspace.md` no longer exists.
  {
    const root = shaped("m1-stop-cites");
    const payload = { cwd: root, last_assistant_message: "done", session_id: "m1-cites" };
    bindOpen(root, "m1-cites");
    run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root);
    touchStep(root);
    wroteArcs(root, "m1-cites");
    const out = run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root);
    n += 1;
    const ok = /01-workstream\.md § Say what you opened/.test(out) && !/11-workspace/.test(out) && !/next one is step 3e\.1 — spn-/.test(out);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  the message cites 01-workstream.md and never 11-workspace.md`);
  }

  // THE HEADLESS WINDOW. `claude -p` is one turn, so its Stop is its first: whatever another session
  // did to a RUNNING arc a moment ago, this window has no baseline of its own and says nothing.
  {
    const root = shaped("m1-stop-headless");
    run("node", [`${HOOKS}/src/scripts/events/stop.ts`], { cwd: root, last_assistant_message: "done", session_id: "m1-other" }, root);
    touchStep(root);                                   // the other session works on the arc
    const out = run("node", [`${HOOKS}/src/scripts/events/stop.ts`], { cwd: root, last_assistant_message: "done", session_id: "m1-headless" }, root);
    n += 1;
    const ok = !/\[runnable\]/.test(out);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a headless window's Stop stays quiet about another session's RUNNING arc`);
  }

  // A SECOND TURN IN A WINDOW THAT NEVER WROTE THE ARC. This window has a baseline, another window
  // moves the arc's steps, and this window's note records no write to it: not its work.
  {
    const root = shaped("m1-stop-other-writer");
    bindOpen(root, "m1-reader");
    const payload = { cwd: root, last_assistant_message: "done", session_id: "m1-reader" };
    run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root);
    touchStep(root);                                   // another window works on the arc
    const quiet = !/\[runnable\]/.test(run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root));
    n += 1; if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  an arc this session only read, while another window changed it, is not its work`);

    // And the same session, once its own Edit writes the step rows (PreToolUse records the write).
    const file = join(root, SHAPED_AT);
    writeFileSync(file, readFileSync(file, "utf8").replace("| the split check |", "| the split check, reworded |"), "utf8");
    wroteArcs(root, "m1-reader");
    const warns = /\[runnable\]/.test(run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root));
    n += 1; if (!warns) failed += 1;
    console.log(`  ${warns ? "PASS" : "FAIL"}  the same arc once this session's own Edit changed its step rows`);
  }
}

console.log("\n=== stop — F12: a card the page has already settled");

const F12 = "an answered card's argument belongs in the arc, and the page carries the answer";
const ARGUED = "\n### `Q9` \u00b7 a question the page has answered\n\nthe options, and why one won\n";

one("a card argued in an arc and answered in the page's settled table",
  build("stop-settled", { arcNames: ["N1-a-subject.md"], arcExtra: ARGUED,
    pageOpts: { names: ["N1-a-subject.md"], settled: ["Q9"] } }),
  "silent", { why: F12 });

one("a card in an arc the page names nowhere, settled or open",
  build("stop-unsettled", { arcNames: ["N1-a-subject.md"], arcExtra: ARGUED,
    pageOpts: { names: ["N1-a-subject.md"], settled: ["Q7"] } }),
  "warns", { says: "A card written into an arc", parity: false, why: F11 });

console.log("\n=== stop — untouched");

one("a page that names its arc, with an open card, and every step landed",
  build("stop-clean", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "done" });

console.log("\n=== stop — reply-shape");

one("a reply asking for a lettered choice with no options table",
  build("stop-reply-bad", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole",
             reply: "I recommend we do this. Say A and I will start, or say B to wait." });

one("the same choice, shown as a lettered table",
  build("stop-reply-good", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Q9 · which way\n\n**What** — the gate in stop.ts, one part checked or five.\n\n**Why** — what it costs to leave it: a half card passes.\n\n| | What it does | What it costs |\n| --- | --- | --- |\n| **A** | start now | the cycle |\n| **B** | wait | the delay |\n\nRecommended: A. Say A and I will start." });

one("a reply that merely mentions a letter",
  build("stop-reply-plain", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Appendix A of the chapter covers it. Nothing else is open." });

// F17 — `[A-D]` under an `i` flag matched the English article `a`, so an ordinary sentence containing
// `choosing with a …` read as somebody naming option A. It fired on a reply that asked nothing.
one("an article after a choosing word is not an option",
  build("stop-reply-article", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "A caller sends an organization id of their own choosing with a sign-in, and it is ignored.",
              parity: false, why: F17 });

one("the other articles that used to fire",
  build("stop-reply-articles", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Pick a file, select a row, and choose a tier. Nothing else is open.",
              parity: false, why: F17 });

// F18 — `option B` fired on a REFERENCE. Naming a superseded option in the past tense is not asking
// anybody to pick one, and the check's own contract says it never fires on a reply that merely
// mentions a letter. Bold is not a presenting marker: emphasis wraps a reference just as readily.
one("an option named in the past tense is a reference, not an ask",
  build("stop-reply-ref", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "It was **option B**, which F has now replaced. Nothing else is open.",
              parity: false, why: F18 });

one("an option PRESENTED still asks",
  build("stop-reply-present", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole", reply: "Two ways: option A now, or wait." });

// `N68` — THE CARD IS SIX PARTS AND THE GATE CHECKED ONE. These four cases are the replies `008`
// actually sent on 2026-09-24: each was green, and each was missing a part the grammar requires.
// The developer caught all of them, which is the failure this arc exists to stop repeating.
one("a card with a table but no What and no Why — what 008 sent twice",
  build("stop-reply-nowhat", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "**What**",
             reply: "Q256 · does the release go now\n\n| | Option | What it costs |\n| --- | --- | --- |\n| **A** | release now | two trains |\n| **B** | wait | open-ended |\n\nMy recommendation is A." });

one("a card cut to one sentence — the turn after",
  build("stop-reply-shrunk", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole",
             reply: "One card is open and it is yours: Q256 — release 1.2.74 now, or wait. Say A or B." });

one("a card with every part is silent",
  build("stop-reply-whole", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Q256 · does the release go now\n\n**What** — spnutils 1.2.74, carrying N64 and N39 step 7.\n\n**Why** — what it costs to leave it: .spndevex has no history, which cost three status lines.\n\n| | Option | What it costs |\n| --- | --- | --- |\n| **A** | release now | two trains |\n| **B** | wait | open-ended |\n\nRecommended: A, because the wait is unbounded. Say A and I will release." });

// F19 — THE GATE REFUSED THE ONE REPLY SHAPE THE BOOK MAKES MANDATORY, on its first day. A handover
// block names the cards a session leaves open, and naming one means writing its recommendation —
// "the recommendation is D then A" — inside a fence, in a reply whose whole purpose is to stop. The
// check read that as putting a decision. A fenced block is a quotation, not an ask.
one("a handover block naming an open card's recommendation is not an ask",
  build("stop-reply-handover", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "This session is retiring.\n\n```text\ncontinue:     workstream `008-x`, arc `N69`, step 1\nopen:         `Q259` — how much of the book the plugins must restate; the recommendation is D then A.\n```\n\nBoth releases are done." });

// The other half, and it is what stops the fix being a hole: an ask in PROSE, with a fence elsewhere
// in the reply, still fires.
one("an ask outside the fence still fires, fence or no fence",
  build("stop-reply-fence-ask", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole",
             reply: "Here is the state.\n\n```text\nworkstream: 008\n```\n\nTwo ways: option A now, or wait." });

one("a reply that asks nothing is still silent, whatever parts it lacks",
  build("stop-reply-noask", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Landed and committed. Nothing else is open." });

// F20 — A HANDOVER OVER AN OPEN CARD. The developer caught this twice in one session: the agent
// offered a new window with two cards open and neither one named. The next window must know the
// question is there. CHANGED ON PURPOSE (RD.DEVEX.WORKSPACE.189): the card is named in one line on the
// block's `open:` line, and the check no longer asks for it in full before any handover.
one("a handover whose block says `open: none` while a card is open is told to name the card in one line",
  build("stop-handover-open-card", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "Name each open card in one line on the block's `open:` line",
             reply: "Pick this up in a new window.\n```\ncontinue: workstream 001-a-subject, arc N1, step 1\nmodel: Opus 5.5\nread first: the page\npins: spn-foundation abc1234\nstate: clean\nlive now: no reload\ndone when: it lands\ndo not touch: closed\nopen: none\n```" });

console.log("\n=== the handover check — what counts as saying a window is needed");
{
  // THIS CHECK HAD NO TESTS AT ALL, which is how it shipped triggering on the bare word `handover`
  // anywhere in a reply. Answering a question ABOUT the open cards — "the handover marks it as not
  // mine to decide" — demanded a handover block, twice in a row. An unverified gate is the thing
  // this arc keeps finding, so the narrowed trigger is asserted in both directions: what must fire,
  // and what must stay quiet.
  const { checkHandover, passingOn } = await import("../../../../src/scripts/events/stop.ts");
  const ROOT = workspace("stop-handover-wiring");
  const BLOCK = ["```", "continue:     workstream `008-plain-language`, arc `N13`, step 4",
    "model:        Opus 5.5", "read first:   the arc", "pins:         spn-foundation abc1234",
    "state:        green", "live now:     no reload", "done when:    it lands",
    "do not touch: Q115", "open:         Q138", "```"].join("\n");
  // ROOT IS PASSED EXPLICITLY. Calling with one argument leaves `root` undefined, the wiring read
  // throws, and the whole install precondition is skipped in silence — a suite that would pass
  // whether or not the half exists. The fixture root has no plugin cache, so the wiring reads
  // unknown and these cases test the block rules alone, which is what they are for.
  const says = (reply) => checkHandover(reply, ROOT, everyone(ROOT)).length > 0;

  for (const [what, reply] of [
    ["a passing mention of the noun", "The handover marks it as not mine to decide."],
    ["saying a reply carries no block", "This reply carries no handover block."],
    ["an ordinary report", "I fixed the drawer and committed it."],
    ["the word window in another sense", "The browser window is not involved here."],
    ["a window needed, and the block given", `Pick this up in a new window.\n${BLOCK}`],
  ]) { n += 1; const ok = !says(reply); if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  silent — ${what}`); }

  for (const [what, reply] of [
    ["a new window is needed, with no block", "Pick this up in a new window."],
    ["a fresh window", "Start a fresh window from here."],
    ["the next window", "The next window starts at step 5."],
    ["handing over", "I am handing over here."],
    ["handing this over", "I am handing this over now."],
    ["a heading that opens one", "## Handover — 2026-09-22\n\nsome prose and no block"],
  ]) { n += 1; const ok = says(reply); if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  reports — ${what}`); }

  // And a block that is present but short still names what is missing, rather than passing.
  n += 1;
  // N39 step 4a — A FUTURE MENTION IS NOT A PASS-ON. The first cut matched the words anywhere in the
  // reply and refused one that said a later build WOULD need a session: nothing had changed, no
  // wiring had moved, and nobody was being handed anything. Warning somebody what a build is about to
  // cost is ordinary usefulness, and a check that refuses it teaches people to stop describing
  // consequences. Both directions are cases, because a discriminator that only ever says no is the
  // same defect wearing the other sign.
  for (const [what, reply, expected] of [
    ["a future consequence", "That build changes the plugins, so this window will then hand you a prompt for a new window.", false],
    ["a conditional", "Once this lands it will need a fresh window.", false],
    ["a plain direction", "Open a new window and paste the block below.", true],
    ["a polite direction", "Please start a fresh session to pick this up.", true],
    ["an ordinary work reply", "Step 3 is proven against seven shapes. Moving to step 4.", false],
    ["a handover heading", "## Handover\n\nthe fields follow", true],
    // THE CONDITIONAL CAN FOLLOW THE PHRASE, not only precede it. This exact sentence was refused by
    // the first cut while nothing had changed and nobody was being handed anything.
    ["a consequence stated after the phrase", "A fresh window would load the installed 0.8.4 copy, so the fix is not in it yet.", false],
    ["another, with will", "The next window will pick up whatever is installed at that point.", false],
  ]) {
    n += 1;
    const got = passingOn(reply);
    if (got !== expected) failed += 1;
    console.log(`  ${got === expected ? "PASS" : "FAIL"}  ${what} reads as ${expected ? "passing work on" : "not a pass-on"}`);
  }

  // N39 step 4b — A PASS-ON IS REFUSED WHILE THE WIRING IT NAMES IS UN-INSTALLED. This is the whole
  // reason the arc exists: the previous sitting was committed, green, and stopped, so the next window
  // ran the release, the release changed the wiring, and changed wiring costs a window. One sitting
  // became three. The fixture cannot install a plugin, so the STATE is faked at the only seam that
  // matters — the reply is a real direction, and a stale wiring string must beat the block rules.
  {
    const stale = checkHandover("Open a new window and paste this.", ROOT, everyone(ROOT));
    // With no cache under the fixture the wiring reads unknown, so this asserts the ORDER instead:
    // a direction with no block is still caught, which is the pre-existing rule surviving the change.
    n += 1;
    const caught = stale.length === 1 && /handover block|passes work on/.test(stale[0].message);
    if (!caught) failed += 1;
    console.log(`  ${caught ? "PASS" : "FAIL"}  a direction with no block is still refused after the rewrite`);
  }

  // QUOTED AND EXPLANATORY TEXT IS NOT A DIRECTION. The check fired on a reply explaining what it
  // had fired on, because the explanation repeated the phrase — in quotation marks, in a code span,
  // in a block quote, in italics.
  for (const [what, reply, expected] of [
    ["the phrase in straight quotes", 'The check read "open a new window" as a direction.', false],
    ["the phrase in curly quotes", "The check read \u201copen a new window\u201d as a direction.", false],
    ["the phrase in a code span", "It matched `new window` in the last line.", false],
    ["the phrase in a block quote", "The reply said:\n\n> Pick this up in a new window.\n\nNothing is handed over.", false],
    ["the phrase in italics", "It fired on *start a fresh session* again.", false],
    ["the phrase in a fence", "It read this:\n\n```\nOpen a new window.\n```\n\nNothing is handed over.", false],
    ["an explanation of what it matched", "The hook fired on the words new window in my last reply.", false],
    ["a sentence that begins with the noun", "Handover blocks carry nine labelled lines, and this reply needs none.", false],
    ["a direction in bold is still a direction", "**Open a new window** and paste the block below.", true],
    ["a direction beside a quotation is still a direction", 'The check said "nothing". Open a new window and paste the block.', true],
    ["a labelled line opens one", "Handover: the fields follow.", true],
  ]) {
    n += 1;
    const got = passingOn(reply);
    if (got !== expected) failed += 1;
    console.log(`  ${got === expected ? "PASS" : "FAIL"}  ${what} reads as ${expected ? "passing work on" : "not a pass-on"}`);
  }

  // N116 ROW 8, F3 — A NAME AND A GENERAL STATEMENT ARE NOT A PASS-ON. A fresh-window proof run met
  // all three in one evening: an arc titled after a fresh window, named in a status table and in
  // prose; a status line saying what any window can read; and a gate named by when it runs.
  for (const [what, reply, expected] of [
    ["an arc's title in a table cell", "| N119 fresh window proves both repos | DECIDED | runs last |", false],
    ["an arc's title in prose", "N119 the fresh window proves both repositories is DECIDED and runs last.", false],
    ["an arc's title after a dash", "Then N119 \u2014 the fresh window proves both repositories.", false],
    ["what any window can read", "Any fresh window here can read the N116 log, so the proof can see its own findings.", false],
    ["a gate named by when it runs", "Only the main gate before the new window is left.", false],
    ["known-bad: a direction after an arc name is still a direction", "N119 is next. Open a fresh window and paste the block.", true],
    ["known-bad: a plain direction is still a direction", "Continue in a new window from row 8.", true],
  ]) {
    n += 1;
    const got = passingOn(reply);
    if (got !== expected) failed += 1;
    console.log(`  ${got === expected ? "PASS" : "FAIL"}  ${what} reads as ${expected ? "passing work on" : "not a pass-on"}`);
  }

  // A REPLY CARRYING THE OPEN CARD IS THE ANSWER THE CHECK ASKS FOR. It fired twice in a row on
  // replies that put `Q329` in full, demanding the card they carried.
  {
    const CARDED = workspace("m1-stop-handover-card", {
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]:
        `${STYLES}<div class="sds-eyebrow">x</div><section id="s4"><div class="sds-open"><h4 id="q329">Q329 &middot; which way</h4>` +
        `<div class="sds-recommended"><b>Decision:</b> &mdash;</div></div></section><p>N1-a.md</p>`,
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a.md`]: "# N1\n",
    });
    const reply = "Q329 · which way\n\n**What** — the gate.\n\n**Why** — what it costs to leave it.\n\n" +
      "| | Option | What it costs |\n| --- | --- | --- |\n| **A** | now | a cycle |\n| **B** | wait | a window |\n\n" +
      "Recommended: A. Once it is answered, the next window starts at step 2.\n\nOpen a new window after you answer.";
    const quiet = checkHandover(reply, CARDED, everyone(CARDED)).length === 0;
    n += 1; if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  a reply putting the open card in full is not refused for a handover`);
    // CHANGED ON PURPOSE (RD.DEVEX.WORKSPACE.189). This asked for the open card in full before any
    // handover. A card open at a handover is one line now, so the direction is told to name the card.
    const bare = checkHandover("Open a new window after you answer.", CARDED, everyone(CARDED));
    const still = bare.length === 1 && bare[0].message.includes("Q329") && /in one line/.test(bare[0].message)
      && !/Answer first/.test(bare[0].message);
    n += 1; if (!still) failed += 1;
    console.log(`  ${still ? "PASS" : "FAIL"}  the same direction without the card is told to name the open card in one line`);
  }

  const short = checkHandover("Pick this up in a new window.\n```\ncontinue: workstream 008-plain-language, arc N13\n```", ROOT, everyone(ROOT));
  const named = short.length === 1 && /`model:`/.test(short[0].message) && /`open:`/.test(short[0].message)
    && !/missing[^.]*`continue:`/.test(short[0].message);
  if (!named) failed += 1;
  console.log(`  ${named ? "PASS" : "FAIL"}  a short block is told which fields it is missing`);
}

console.log("\n=== handover — a reply answering the last finding is not judged again");
{
  // `stop_hook_active` says the turn continues because a Stop hook spoke. Where the handover check was
  // what spoke, the next reply is its answer, and demanding the block again is a loop.
  const root = workspace("m1-stop-handover-repeat", {});
  const hook = (payload) => run("node", [`${HOOKS}/src/scripts/events/stop.ts`], { cwd: root, session_id: "m1-repeat", ...payload }, root);
  const reply = "Pick this up in a new window.";
  const first = /\[handover\]/.test(hook({ last_assistant_message: reply }));
  const second = /\[handover\]/.test(hook({ last_assistant_message: reply, stop_hook_active: true }));
  const third = /\[handover\]/.test(hook({ last_assistant_message: reply }));
  for (const [what, ok] of [
    ["the first reply is refused", first],
    ["the reply that answers it, under stop_hook_active, is not refused again", !second],
    ["a later turn that is not answering a finding is judged afresh", third],
  ]) { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}`); }
}

console.log("\n=== handover — the template's fields, and a fence that quotes the template (Q333)");
{
  const { checkHandover, passingOn, fencesOf, quotesTemplate } = await import("../../../../src/scripts/events/stop.ts");
  const ROOT = workspace("m7-stop-handover-template");
  // THE TEMPLATE, FILLED IN, in the chapter's layout: nine lowercase labels, every value in the
  // column `do not touch:` sets, and a long value wrapped with its continuation under the value.
  const FILLED = ["```text",
    "continue:     workstream `008-plain-language`, arc `N116`, row 6, in a `spn-claude-marketplace`",
    "              window",
    "model:        Opus 5.5, effort high",
    "read first:   `/w/arcs/N116-r2-the-devex-release.md` (fields, and row 6),",
    "              `/w/notes/N116/plan.md`",
    "pins:         spn-claude-marketplace 2f8c5a0 · spn-foundation 907b11f; re-run the plan's stale",
    "              check first — `git -C spn-claude-marketplace log 2f8c5a0..HEAD -- packages`",
    "state:        rows 1, 1b ✅ landed; row 6 ◐ stopped — done the ref, not done the hook; rows 7, 8",
    "              not started",
    "live now:     the hook script is live · waits for the window: the skill",
    "done when:    Commands row `plugin unit` → all passed",
    "do not touch: the templates folder",
    "open:         none",
    "```"].join("\n");
  const withoutLabel = (label) => FILLED.split("\n").filter((line) => !line.startsWith(`${label}:`)).join("\n");
  // THE SENTENCE FORM THE LAYOUT REPLACES. It carries every word the old check looked for, and no label.
  const SENTENCE = ["```text",
    "Continue workstream `008-plain-language`, arc `N116`, row 6, in a `spn-claude-marketplace` window.",
    "Model: Opus 5.",
    "Read first: `/w/arcs/N116-r2-the-devex-release.md` (fields, and row 6), `/w/notes/N116/plan.md`.",
    "Pins: re-run the plan's stale check first — `git -C spn-claude-marketplace log 2f8c5a0..HEAD -- packages`.",
    "State: rows 1, 1b ✅ landed; row 6 ◐ stopped — done the ref, not done the hook; rows 7, 8 not started.",
    "Live now / waits for the window: the hook script is live · the skill waits for the window.",
    "Done when: Commands row `plugin unit` → all passed.",
    "Do not touch: the templates folder.",
    "Open: none.",
    "```"].join("\n");
  // THE M1 FALSE POSITIVE: a `diff` preview of the template, whose own ```text lines sit inside it.
  // A lazy pairing closes the outer fence at the first inner one and leaks the rest into the prose.
  const DIFF = "Here is the template change for review.\n\n```diff\n+<!-- The handover: written into the arc's log -->\n+```text\n" +
    "+Continue workstream `{{NNN-subject}}`, arc `N{{n}}`, row {{k}}, in a `{{repository}}` window.\n" +
    "+Paste this block into a fresh window to continue.\n" +
    "+Pins: re-run the plan's stale check first.\n+```\n```\n\nNothing is handed over; this is the preview only.";
  // A CARD FENCE HOLDING `{{`: a template quoted for the reader, not filled in.
  const CARD_FENCE = "The card the template asks for:\n\n```text\nQ{{n}} · {{summary}}\nOpen a new window once {{it}} is answered.\n```\n\nThat is the shape, not an answer.";

  // VERIFY THE VERIFIER: the diff fixture really does leak under the lazy pairing it replaces.
  n += 1;
  const leaks = passingOn(DIFF.replace(/```[\s\S]*?```/g, " "));
  if (!leaks) failed += 1;
  console.log(`  ${leaks ? "PASS" : "FAIL"}  known bad: under the lazy fence pairing, the diff's leaked template lines read as a pass-on`);

  for (const [what, got, expected] of [
    ["the diff is read as one fence, its inner fences included", fencesOf(DIFF).length, 1],
    ["a diff fence quotes a template", quotesTemplate(fencesOf(DIFF)[0]), true],
    ["a fence holding {{ quotes a template", quotesTemplate(fencesOf(CARD_FENCE)[0]), true],
    ["a filled-in block does not", quotesTemplate(fencesOf(FILLED)[0]), false],
    ["a diff of the template is not a pass-on", passingOn(DIFF), false],
    ["no [handover] finding on the diff preview", checkHandover(DIFF, ROOT, everyone(ROOT)).length, 0],
    ["no [handover] finding on a card fence holding {{", checkHandover(CARD_FENCE, ROOT, everyone(ROOT)).length, 0],
    ["the filled-in template, in the aligned layout with wrapped values, is a whole handover", checkHandover(`Pick this up in a new window.\n\n${FILLED}`, ROOT, everyone(ROOT)).length, 0],
  ]) {
    n += 1;
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`);
  }

  // A PASS-ON WHOSE ONLY BLOCK STILL HOLDS PLACEHOLDERS HAS NO HANDOVER, and is told so.
  n += 1;
  const unfilled = checkHandover("Pick this up in a new window.\n\n" +
    FILLED.replace("`N116`", "`N{{n}}`"), ROOT);
  const told = unfilled.length === 1 && /\{\{…\}\}` placeholders/.test(unfilled[0].message) && /pins:/.test(unfilled[0].message);
  if (!told) failed += 1;
  console.log(`  ${told ? "PASS" : "FAIL"}  a block with a {{…}} left is refused, and told to fill in every label`);

  // EACH LABEL IS OWED. A block missing one is refused, and the refusal names the label it lacks.
  for (const label of ["continue", "pins", "live now", "open"]) {
    n += 1;
    const got = checkHandover(`Pick this up in a new window.\n\n${withoutLabel(label)}`, ROOT, everyone(ROOT));
    const ok = got.length === 1 && new RegExp(`missing \`${label}:\``).test(got[0].message);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a block missing \`${label}:\` is refused, naming it${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }

  // NO LEGACY: the sentence form is refused as a block missing every label.
  n += 1;
  const sentence = checkHandover(`Pick this up in a new window.\n\n${SENTENCE}`, ROOT, everyone(ROOT));
  const refused = sentence.length === 1 && /missing `continue:` · `model:`/.test(sentence[0].message) && /`open:`/.test(sentence[0].message);
  if (!refused) failed += 1;
  console.log(`  ${refused ? "PASS" : "FAIL"}  the old sentence form is refused, naming the labels it lacks${refused ? "" : ` — got ${JSON.stringify(sentence)}`}`);

  // A LABEL IN CAPITALS IS NOT THE LABEL. The chapter fixes them lowercase.
  n += 1;
  const upper = checkHandover(`Pick this up in a new window.\n\n${FILLED.replace("\nmodel:", "\nModel:")}`, ROOT, everyone(ROOT));
  const caseKept = upper.length === 1 && /missing `model:`/.test(upper[0].message);
  if (!caseKept) failed += 1;
  console.log(`  ${caseKept ? "PASS" : "FAIL"}  \`Model:\` in capitals does not count as \`model:\``);

  // `continue:` CARRIES THE WORKSTREAM AND THE ARC.
  for (const [what, from, to, says] of [
    ["no arc", "arc `N116`, ", "", /names no arc/],
    ["no workstream", "workstream `008-plain-language`, ", "", /names no workstream/],
  ]) {
    n += 1;
    const got = checkHandover(`Pick this up in a new window.\n\n${FILLED.replace(from, to)}`, ROOT, everyone(ROOT));
    const ok = got.length === 1 && says.test(got[0].message);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a \`continue:\` line with ${what} is refused${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
  // THE ARC IS NAMED WITH THE DIGITS ITS FILE WRITES: three, two or one.
  for (const arc of ["N001", "N15", "N1"]) {
    n += 1;
    const got = checkHandover(`Pick this up in a new window.\n\n${FILLED.replace("`N116`", `\`${arc}\``)}`, ROOT, everyone(ROOT));
    const ok = got.length === 0;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a \`continue:\` line naming arc ${arc} is a whole handover${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
}

console.log("\n=== runnable — a row in progress is named with its age, never called runnable (RD.DEVEX.WORKSPACE.184)");
{
  const { checkRunnable, inProgressSteps, unfinishedSteps } = await import("../../../../src/scripts/events/stop.ts");
  const MARKED = `# N3 — a subject\n\nStatus: **RUNNING — 2026-09-29.**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | the split check | by hand | its suite | in progress 2026-09-29 14:32 +05:30 |\n\n## Log\n\n- **2026-09-29 — go.**\n`;
  const root = workspace("m7-stop-in-progress", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N3-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N3-a-subject.md`]: MARKED,
  });
  const arcPath = join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N3-a-subject.md`);
  const found = checkRunnable(root, Date.now() - 60_000, { [arcPath]: "a-different-hash" }, new Set([arcPath]), everyone(root));
  const now = Date.parse("2026-09-29T12:00:00Z");
  for (const [what, ok] of [
    ["the row in progress is not an unfinished runnable step", unfinishedSteps(arcPath).length === 0],
    ["it is named with its age", inProgressSteps(arcPath, now)[0] === "step 2 — the split check (marked 2 h 58 min ago)"],
    ["the Stop hook names it as in progress", found.length === 1 && /marked in progress/.test(found[0].message) && /step 2/.test(found[0].message)],
    ["and never calls it runnable", found.every((w) => !/stopped with runnable work/.test(w.message))],
  ]) { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : `\n        ${JSON.stringify(found).slice(0, 300)}`}`); }
}

console.log("\n=== runnable — a row held on an open card is not runnable, and is once the card is answered (RD.DEVEX.WORKSPACE.188)");
{
  const { unfinishedSteps } = await import("../../../../src/scripts/events/stop.ts");
  const HELD_ARC = (mark) => `# N4 — a subject\n\nStatus: **RUNNING — 2026-09-29.**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 6 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 7 | spn-support-ts | CODE | the split check | by hand | its suite | ${mark} |\n\n## Log\n\n- **2026-09-29 — go.**\n`;
  // Card Q352 as the template writes it: open, then the same card carrying its decision.
  const Q352 = (decision) => `  <div class="sds-open">
    <h4 id="q352">Q352 &middot; which way</h4>
    <div class="sds-scroll"><table><thead><tr><th></th><th>What</th></tr></thead>
    <tbody><tr><td><strong>A</strong></td><td>one way</td></tr></tbody></table></div>
    <div class="sds-recommended"><b>Recommended: A.</b> <b>Decision:</b> ${decision}</div>
  </div>`;
  const arcIn = (name, mark, decision) => {
    const root = workspace(name, {
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: Q352(decision), names: ["N4-a-subject.md"] }),
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N4-a-subject.md`]: HELD_ARC(mark),
    });
    return join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N4-a-subject.md`);
  };
  const OPEN = "&mdash;", ANSWERED = "A, 2026-09-29";
  for (const [what, got, ok] of [
    ["a row held on Q352 while Q352 is open is not runnable",
      unfinishedSteps(arcIn("m11-held-open", "⏸ held on Q352", OPEN)), (steps) => steps.length === 0],
    ["the same row, once Q352 is answered, is runnable and named",
      unfinishedSteps(arcIn("m11-held-answered", "⏸ held on Q352", ANSWERED)),
      (steps) => steps.length === 1 && steps[0].startsWith("step 7 was held on Q352, which is answered")],
    ["the mark without its glyph is read the same while the card is open",
      unfinishedSteps(arcIn("m11-held-bare-open", "held on Q352", OPEN)), (steps) => steps.length === 0],
    ["and the same once the card is answered",
      unfinishedSteps(arcIn("m11-held-bare-answered", "held on Q352", ANSWERED)),
      (steps) => steps.length === 1 && steps[0].startsWith("step 7 was held on Q352, which is answered")],
    ["a row held on a card the page does not carry at all is runnable, and says the card is not on the page",
      unfinishedSteps(arcIn("m11-held-other", "⏸ held on Q9", OPEN)),
      (steps) => steps.length === 1 && steps[0].startsWith("step 7 is held on Q9, which is not on the approach page")],
    ["known-bad: a card missing from the page is never reported as answered",
      unfinishedSteps(arcIn("m12-held-missing", "⏸ held on Q9", ANSWERED)),
      (steps) => steps.length === 1 && !steps[0].includes("which is answered")],
    ["an unmarked row beside an open card is still an unfinished step",
      unfinishedSteps(arcIn("m11-held-none", "", OPEN)), (steps) => steps.length === 1 && steps[0] === "step 7 — the split check"],
  ]) { n += 1; const pass = ok(got ?? []); if (!pass) failed += 1;
       console.log(`  ${pass ? "PASS" : "FAIL"}  ${what}${pass ? "" : `\n        ${JSON.stringify(got)}`}`); }
}

console.log("\n=== reply-shape — a sentence that reports an answer is not asking for one");
{
  // It fired on a reply that had just told the developer their ALREADY ANSWERED card turned out to
  // match option B — a sentence ABOUT a decision they had made, demanded back as a decision card.
  // COUNTING options was the wrong cure, and the suite caught that: "Two ways: option A now, or
  // wait" is a real offer with one letter in it. What separates the two is the FRAME, so a sentence
  // saying the thing was answered, decided or chosen is set aside and the rest is read for an ask.
  const { checkReplyShape } = await import("../../../../src/scripts/events/stop.ts");
  const TABLE = ["| | What it does | What it costs |", "| --- | --- | --- |",
                 "| **A** | keeps it | nothing |", "| **B** | moves it | a sweep |"].join("\n");
  for (const [what, reply] of [
    ["one option named, inside a report", "After you answered, it builds one file per domain — option B."],
    ["a letter in the past tense", "After you answered, your A now changes the generator too."],
    ["a decision reported with no table", "Q136 was decided A, and it is built."],
    ["a plain report", "I fixed the drawer and committed it."],
    // A WHOLE card stays silent, and it is the only offer shape that does now.
    ["an offer carrying every part", `Q9 · which way\n\n**What** — the drawer, kept or moved.\n\n` +
      `**Why** — what it costs to leave it: the sweep grows every week.\n\n${TABLE}\n\nRecommended: A.`],
  ]) { n += 1; const ok = checkReplyShape(reply).length === 0; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  silent — ${what}`); }

  // `N68` / `Q258` `A` — THESE TWO USED TO BE SILENT AND THAT WAS THE DEFECT. Both put a decision
  // and show a table, and both carry no number, no `What`, no `Why`. The gate tested for the table
  // alone, so a half card was green — which is how `008` sent one twice in a row on 2026-09-24 and
  // the developer, not the gate, caught it. The expectation moved deliberately.

  for (const [what, reply] of [
    ["two options and no table", "Option A keeps it. Option B moves it."],
    ["one option PRESENTED still asks", "Two ways: option A now, or wait."],
    ["pick B with no table", "Pick B and we move on."],
    ["A, B or C with no table", "It is A, B or C."],
    ["a recommendation with no table", "Recommendation is A."],
    ["two options with the table and no What or Why", `Option A keeps it. Option B moves it.\n${TABLE}`],
    ["a recommendation with the table and nothing else", `Recommendation is A.\n${TABLE}`],
  ]) { n += 1; const ok = checkReplyShape(reply).length === 1; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  reports — ${what}`); }
}

console.log("\n=== reply-shape — a reply given while a card is open opens with Needs you (RD.DEVEX.WORKSPACE.189)");
{
  const { checkReplyShape, opensWithNeedsYou } = await import("../../../../src/scripts/events/stop.ts");
  const PROGRESS = "Row 6d landed: the reply check reads Needs you.\n\n```diff\n+ if (open.length && !opensWithNeedsYou(reply))\n```";
  const needsYou = (reply, open) => checkReplyShape(reply, open).filter((warning) => warning.check === "needs-you");
  for (const [what, got, expected] of [
    ["a reply that waits over an open card, with no Needs you, is reported", needsYou(PROGRESS, ["Q356"]).length, 1],
    ["the finding names the open card", needsYou(PROGRESS, ["Q356"]).filter((w) => w.message.includes("Q356")).length, 1],
    ["an open card with a Needs you heading first is clean", needsYou(`## Needs you\n\nQ356 · the card in full.\n\n## Progress\n\n${PROGRESS}`, ["Q356"]).length, 0],
    ["an open card with a bold Needs you line first is clean", needsYou(`**Needs you:** Q356 · the card in full.\n\n${PROGRESS}`, ["Q356"]).length, 0],
    ["blank lines before the heading do not count against it", needsYou(`\n\n### Needs you\n\nQ356.\n\n${PROGRESS}`, ["Q356"]).length, 0],
    ["no card open is clean, with or without Needs you", needsYou(PROGRESS, []).length, 0],
    ["the check is silent when no open cards are given", checkReplyShape(PROGRESS).length, 0],
    ["known-bad: Needs you placed after the progress is reported", needsYou(`${PROGRESS}\n\n## Needs you\n\nQ356.`, ["Q356"]).length, 1],
    ["known-bad: Needs you inside a fence at the top is reported", needsYou("```text\nNeeds you: Q356\n```\n\n" + PROGRESS, ["Q356"]).length, 1],
    ["known-bad: a sentence that starts with the words is not the heading", needsYou("Needs your review later: row 6d.", ["Q356"]).length, 1],
    ["opensWithNeedsYou reads the first non-blank line only", opensWithNeedsYou("Progress first.\n## Needs you") ? 1 : 0, 0],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }
}

console.log("\n=== reply-shape — Needs you is owed in two cases only: a card raised, or the agent waits (RD.DEVEX.WORKSPACE.189, Q49 B)");
{
  const { checkReplyShape, workRuns } = await import("../../../../src/scripts/events/stop.ts");
  const PROGRESS = "Row 6d landed: the reply check reads the arcs' rows.";
  const RUNS = true;
  const of = (check) => (reply, open, raised, running) =>
    checkReplyShape(reply, open, raised, new Map(), running).filter((warning) => warning.check === check);
  const needsYou = of("needs-you"), shape = of("reply-shape");
  const LINE = "Q401 · which way does the drawer go — recommendation is B — on the approach page.";
  const STEPS = (state, status = "RUNNING") => `# N3 — a subject\n\nStatus: **${status}**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | the split check | by hand | its suite | ${state} |\n\n## Log\n\n- **2026-10-09 — go.**\n`;
  const MARK = "in progress 2026-10-09 14:32 +05:30";
  const arcs = (name, text, extra = {}) => workspace(name, {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: CARD, names: ["N3-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N3-a-subject.md`]: text, ...extra });
  const marked = arcs("m14-row-in-progress", STEPS(MARK));
  const out = arcs("m14-row-order-out", STEPS(MARK),
    { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/notes/N3/orders/02-the-split-check.md`]: "# Order 02 — N3 row 2: the split check\n" });
  for (const [what, got, expected] of [
    ["a progress reply over an older card, while a row is in progress, owes nothing", needsYou(PROGRESS, ["Q356"], [], RUNS).length, 0],
    ["while a row is in progress, a Needs you part that leaves an older card out is not reported",
      needsYou(`## Needs you\n\nQ402 · another question — on the page.\n\n## Progress\n\n${PROGRESS}`, ["Q401", "Q402"], [], RUNS).length, 0],
    ["known-bad: a row in progress does not excuse a card this reply raised", needsYou(PROGRESS, ["Q356"], ["Q356"], RUNS).length, 1],
    ["known-bad: a raised card named in one line under Needs you is reported while a row is in progress too",
      needsYou(`## Needs you\n\nQ404 · one line.\n\n${PROGRESS}`, ["Q404"], ["Q404"], RUNS).length, 1],
    ["known-bad: with no row in progress, an older card the reply does not name is reported", needsYou(PROGRESS, ["Q401"], [], !RUNS).length, 1],
    ["one line that names an older card and its recommended letter does not ask for the whole card",
      shape(`## Needs you\n\n${LINE}\n\n## Progress\n\n${PROGRESS}`, ["Q401"], [], !RUNS).length, 0],
    ["the same line in a progress reply does not ask for the whole card either", shape(`${PROGRESS}\n\n${LINE}`, ["Q401"], [], RUNS).length, 0],
    ["known-bad: the same line for a card this reply raised asks for the whole card",
      shape(`## Needs you\n\n${LINE}\n\n## Progress\n\n${PROGRESS}`, ["Q401"], ["Q401"], !RUNS).length, 1],
    ["known-bad: a choice put on another line, with no card behind it, still asks for the whole card",
      shape(`## Needs you\n\n${LINE}\n\n## Progress\n\n${PROGRESS}\n\nPick B and we move on.`, ["Q401"], [], !RUNS).length, 1],
    ["work runs while a row of this window's arcs is marked in progress", workRuns(marked, everyone(marked)) ? 1 : 0, 1],
    ["work still runs while that row's order is out with an agent", workRuns(out, everyone(out)) ? 1 : 0, 1],
    ["a row in progress in a workstream that is not this window's is not this window's work", workRuns(marked, new Set()) ? 1 : 0, 0],
    ["no row in progress means the agent waits", (() => { const root = arcs("m14-row-landed", STEPS("LANDED — `def5678`")); return workRuns(root, everyone(root)) ? 1 : 0; })(), 0],
    ["a row left in progress in an arc that has landed is history, not work that runs",
      (() => { const root = arcs("m14-row-in-landed-arc", STEPS(MARK, "LANDED")); return workRuns(root, everyone(root)) ? 1 : 0; })(), 0],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }

  // FINDING, CONFIRMED AND NOT FIXED HERE (024 N009, the plan's Findings). A suggestion is `S<n>`, and
  // the number the check reads is `Q<n>` only, so a suggestion carrying every part of a card is told
  // its number is missing. The fix is a row of its own; when it lands, this case changes on purpose.
  const SUGGESTION = "### S3 · which way does the drawer go?\n\n**What** — the drawer in `shell.tsx:40`, kept or moved.\n\n" +
    "**Why** — the choice is yours: it changes what a user sees.\n\n| | Option | Trade-off |\n| --- | --- | --- |\n" +
    "| **A** | keep it | nothing moves |\n| **B** | move it | a sweep of six screens |\n\nRecommendation: A, because nothing breaks. Say A or B.";
  const told = checkReplyShape(SUGGESTION).filter((warning) => warning.check === "reply-shape");
  n += 1; const pinned = told.length === 1 && told[0].message.includes("**the number**") && !told[0].message.includes("**What**");
  if (!pinned) failed += 1;
  console.log(`  ${pinned ? "PASS" : "FAIL"}  finding: a whole suggestion S<n> that names a letter is told its number is missing, and nothing else`);
}

console.log("\n=== stop — the hook reads this window's arc rows to tell a progress reply from a reply that waits (Q49 B)");
{
  const IN_PROGRESS = `# Arc — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | a thing | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | another thing | by hand | its suite | in progress 2026-10-09 14:32 +05:30 |\n\n## Log\n\n- **2026-10-09 — go.**\n`;
  const running = (name) => workspace(name, {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: CARD, names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: IN_PROGRESS });
  one("a progress reply over an older card, while a row is in progress, is silent",
    running("m14-hook-progress"), "silent", { reply: "Row 1 landed.", parity: false, why: "Q49 B" });
  one("one line for an older card that names its recommended letter is silent",
    build("m14-hook-letter", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD, names: ["N1-a-subject.md"] } }),
    "silent", { session: "m14-letter", edit: () => {},
                reply: "## Needs you\n\nQ1 · a real question — recommendation is A — on the approach page.\n\n## Progress\n\nRow 1 landed.",
                parity: false, why: "Q49 B" });
}

console.log("\n=== stop — the hook reads the open cards off the page for Needs you");

one("known-bad: a reply that waits over an open card (no row in progress) and opens with progress",
  build("m13-needs-you-bad", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD, names: ["N1-a-subject.md"] } }),
  "warns", { says: "does not open with **Needs you**", reply: "Row 6d landed.\n\nQ1 is open on the page.", parity: false, why: "a new check" });

one("the same reply opening with Needs you is silent",
  build("m13-needs-you-good", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD, names: ["N1-a-subject.md"] } }),
  "silent", { reply: NEEDS + "Row 6d landed.", parity: false, why: "a new check" });

one("a reply with no card open is not read for Needs you",
  build("m13-needs-you-none", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: "", names: ["N1-a-subject.md"] } }),
  "silent", { reply: "Row 6d landed.", parity: false, why: "a new check" });

one("a card carrying its decision is not open, so the reply is not read for Needs you",
  build("m13-needs-you-answered", { arcNames: ["N1-a-subject.md"],
    pageOpts: { cards: CARD.replace("<b>Decision:</b> &mdash;", "<b>Decision:</b> A, 2026-09-29."), names: ["N1-a-subject.md"] } }),
  "silent", { reply: "Row 6d landed.", parity: false, why: "a new check" });

console.log("\n=== 2m — a card is put in full once, at the top of the reply that raises it, then named in one line (RD.DEVEX.WORKSPACE.189)");
{
  const { checkReplyShape } = await import("../../../../src/scripts/events/stop.ts");
  const PROGRESS = "## Progress\n\nRow 2m landed: the reply check reads a raised card once.";
  const FULL = (card) => `### ${card} · which way does the drawer go?\n\n**What** — the drawer in \`shell.tsx:40\`, kept or moved.\n\n` +
    `**Why** — the choice is yours: it changes what a user sees.\n\n| | Option | Trade-off |\n| --- | --- | --- |\n` +
    `| **A** | keep it | nothing moves |\n| **B** | move it | a sweep of six screens |\n\nRecommendation: A, because nothing breaks.`;
  const needsYou = (reply, open, raised) => checkReplyShape(reply, open, raised).filter((warning) => warning.check === "needs-you");
  for (const [what, got, expected] of [
    ["2m: a card raised this turn, in full under Needs you at the top, is clean",
      needsYou(`## Needs you\n\n${FULL("Q404")}\n\n${PROGRESS}`, ["Q404"], ["Q404"]).length, 0],
    ["2m: a card raised this turn and named only in one line is reported",
      needsYou(`## Needs you\n\nQ404 · which way does the drawer go? — on the approach page.\n\n${PROGRESS}`, ["Q404"], ["Q404"]).length, 1],
    ["2m: a card raised in the body, under the progress, is reported",
      needsYou(`## Needs you\n\nQ401 · still open — on the page.\n\n${PROGRESS}\n\n${FULL("Q404")}`, ["Q401", "Q404"], ["Q404"]).length, 1],
    ["2m: the finding for a raised card says it goes in full once, at the top, and is not repeated now",
      needsYou(`## Needs you\n\nQ404 · one line.\n\n${PROGRESS}`, ["Q404"], ["Q404"]).filter((w) => /in full once/.test(w.message) && /one line/.test(w.message)).length, 1],
    ["2m: a card open from an earlier reply, named in one line, is clean",
      needsYou(`## Needs you\n\nQ401 · which way does the drawer go? — on the approach page.\n\n${PROGRESS}`, ["Q401"], []).length, 0],
    ["2m: a card open from an earlier reply that the Needs you part never names is reported",
      needsYou(`## Needs you\n\nQ402 · another question — on the page.\n\n${PROGRESS}`, ["Q401", "Q402"], []).length, 1],
    ["2m: an older card named only in the progress is not named under Needs you",
      needsYou(`## Needs you\n\nQ402 · another question.\n\n${PROGRESS} It waits on Q401.`, ["Q401", "Q402"], []).filter((w) => w.message.includes("Q401")).length, 1],
    ["2m: the finding for an older card asks for one line, never the full card",
      needsYou(`## Needs you\n\nQ402 · another.\n\n${PROGRESS}`, ["Q401", "Q402"], []).filter((w) => /one line/.test(w.message) && !/each open card in full/.test(w.message)).length, 1],
    ["2m: the finding for a reply with no Needs you says one line for a card already put",
      needsYou("Row 2m landed.", ["Q401"], []).filter((w) => /one line/.test(w.message) && !/each open card in full/.test(w.message)).length, 1],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }
}

console.log("\n=== 2m — the hook knows which card this turn raised, from the session's last Stop");
{
  const FULL_Q1 = "## Needs you\n\n### Q1 · a real question\n\n**What** — the drawer, kept or moved.\n\n**Why** — it changes what a user sees.\n\n" +
    "| | Option | Trade-off |\n| --- | --- | --- |\n| **A** | one way | nothing |\n| **B** | another | a sweep |\n\nRecommendation: A.\n\n## Progress\n\nRow 1 landed.";
  const ONE_LINE_Q1 = NEEDS + "Row 1 landed.";
  const raise = (root) => {
    const pagePath = join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`);
    writeFileSync(pagePath, page({ cards: CARD, names: ["N1-a-subject.md"] }), "utf8");
  };
  const fresh = (name) => build(name, { arcNames: ["N1-a-subject.md"], pageOpts: { cards: "", names: ["N1-a-subject.md"] } });
  one("2m: a card that appeared this turn, named in one line only, warns",
    fresh("m2m-raised-line"), "warns", { says: "in full once", session: "m2m-a", edit: raise, reply: ONE_LINE_Q1, parity: false, why: "2m" });
  one("2m: a card that appeared this turn, put in full at the top, is silent",
    fresh("m2m-raised-full"), "silent", { session: "m2m-b", edit: raise, reply: FULL_Q1, parity: false, why: "2m" });
  const already = build("m2m-older", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD, names: ["N1-a-subject.md"] } });
  one("2m: a card already open at the last Stop is accepted in one line",
    already, "silent", { session: "m2m-c", edit: () => {}, reply: ONE_LINE_Q1, parity: false, why: "2m" });
}

console.log("\n=== 2n — an answer lands in the arc's notes in the same turn (RD.DEVEX.WORKSPACE.193)");
{
  // N122's OWN HISTORY, word for word from its log: the developer's answer was logged, two review
  // points were carried to step 4, and `notes/N122/spec.md` did not move until the developer asked
  // why (the log's next-but-three line names the miss).
  const N122_ANSWER = "- **2026-09-30 — step 3 DONE; N122 DECIDED; Q396 B** (the developer: *\"done with N122 samples changes\"*). " +
    "The samples are approved as they are. Two points raised in the last review are **carried to step 4**, where the book is written.\n";
  const WS = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  const arcN122 = (status) => `# N122 — one report structure\n\nStatus: **${status}**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n\n## Log\n\n- **2026-09-29 — opened.**\n`;
  const withNotes = (name, status = "RUNNING") => workspace(name, {
    [`${WS}/a-subject-approach.html`]: page({ names: ["N122-one-report-structure.md"] }),
    [`${WS}/arcs/N122-one-report-structure.md`]: arcN122(status),
    [`${WS}/notes/N122/spec.md`]: "# N122 — the report specification\n\nThe audit report checks wiring.\n",
    [`${WS}/notes/N122/plan.md`]: "# N122 — plan\n",
  });
  const logAnswer = (root) => { const arc = join(root, WS, "arcs", "N122-one-report-structure.md");
    writeFileSync(arc, readFileSync(arc, "utf8") + N122_ANSWER, "utf8"); };
  const moveSpec = (root) => { logAnswer(root); const spec = join(root, WS, "notes", "N122", "spec.md");
    writeFileSync(spec, readFileSync(spec, "utf8").replace("wiring", "setup only, and never a finding another report owns"), "utf8"); };
  one("2n: N122's own history — an answer logged and the spec unchanged — warns, naming the notes",
    withNotes("m2n-red"), "warns", { says: "notes/N122/spec.md", session: "m2n-a", edit: logAnswer, parity: false, why: "2n" });
  one("2n: the same answer with the spec moved in the same turn is silent",
    withNotes("m2n-green"), "silent", { session: "m2n-b", edit: moveSpec, parity: false, why: "2n" });
  one("2n: an arc with no notes owes none",
    workspace("m2n-nonotes", { [`${WS}/a-subject-approach.html`]: page({ names: ["N122-one-report-structure.md"] }),
      [`${WS}/arcs/N122-one-report-structure.md`]: arcN122("RUNNING") }),
    "silent", { session: "m2n-c", edit: logAnswer, parity: false, why: "2n" });
  one("2n: a log line that records no answer owes the notes nothing",
    withNotes("m2n-plain"), "silent", { session: "m2n-d", parity: false, why: "2n",
      edit: (root) => { const arc = join(root, WS, "arcs", "N122-one-report-structure.md");
        writeFileSync(arc, readFileSync(arc, "utf8") + "- **2026-09-30 — go.**\n", "utf8"); } });
  one("2n: the first Stop of a session has no baseline, so it is silent",
    (() => { const root = withNotes("m2n-first"); logAnswer(root); return root; })(), "silent", { session: "m2n-e", parity: false, why: "2n" });
  one("2n: a proposed arc that carries a review point to a later step of itself is flagged",
    withNotes("m2n-carried", "PROPOSED"), "warns", { says: "[carried]", session: "m2n-f", edit: moveSpec, parity: false, why: "2n" });
  one("2n: a running arc carrying a point to a later step is not flagged",
    withNotes("m2n-carried-running", "RUNNING"), "silent", { session: "m2n-g", edit: moveSpec, parity: false, why: "2n" });

  // THE TWO REVIEWED FOLDERS, `previews/` AND `samples/`, each with an arc numbered in one digit and
  // in three. The arc holds no spec and no plan, so the folder is the only notes it has.
  const ANSWER = "- **2026-10-01 — Q7 B** (the developer: *\"the second layout\"*). The preview is approved as it is.\n";
  const reviewed = (name, arcId, folder, file) => workspace(name, {
    [`${WS}/approach.html`]: page({ names: [`${arcId}-a-subject.md`] }),
    [`${WS}/arcs/${arcId}-a-subject.md`]: arcN122("RUNNING"),
    [`${WS}/notes/${arcId}/${folder}/${file}`]: "the first layout\n",
  });
  const answerOnly = (arcId) => (root) => { const arc = join(root, WS, "arcs", `${arcId}-a-subject.md`);
    writeFileSync(arc, readFileSync(arc, "utf8") + ANSWER, "utf8"); };
  const answerAndMove = (arcId, folder, file) => (root) => { answerOnly(arcId)(root);
    writeFileSync(join(root, WS, "notes", arcId, folder, file), "the second layout, as the developer chose\n", "utf8"); };
  for (const [arcId, folder, file, tag] of [
    ["N1", "previews", "layout-preview.html", "p1"], ["N001", "previews", "layout-preview.html", "p3"],
    ["N1", "samples", "close-message.md", "s1"], ["N001", "samples", "close-message.md", "s3"],
  ]) {
    one(`2n: an answer logged in ${arcId} with its ${folder}/ file unchanged warns, naming the folder`,
      reviewed(`m2n-${tag}-red`, arcId, folder, file), "warns",
      { says: `notes/${arcId}/${folder}/`, session: `m2n-${tag}-a`, edit: answerOnly(arcId), parity: false, why: "2n" });
    one(`2n: the same answer with the ${arcId} ${folder}/ file moved in the same turn is silent`,
      reviewed(`m2n-${tag}-green`, arcId, folder, file), "silent",
      { session: `m2n-${tag}-b`, edit: answerAndMove(arcId, folder, file), parity: false, why: "2n" });
  }
  one("2n: a file in a notes folder that is neither previews/ nor samples/ is not the arc's notes",
    reviewed("m2n-scripts", "N001", "scripts", "rename.sh"), "silent",
    { session: "m2n-scripts-a", edit: answerOnly("N001"), parity: false, why: "2n" });
}

console.log("\n=== welcome — a session's first turn opens with the welcome, word for word (N116 row 8, F1)");
{
  const { missingWelcome, checkWelcome, firstTurnText } = await import("../../../../src/scripts/events/stop.ts");
  const { welcome } = await import("../../../../src/scripts/events/orientation.ts");
  const whole = welcome("Dhruv", false).join("\n");
  const firstVisit = welcome("Dhruv", true).join("\n");
  const cut = whole.replace(" Tell me whose view you need, and I'll bring it.", "");
  const headingOnly = whole.split("\n")[0] + "\n\nLooking into how ports are picked.";
  const plainText = whole.replace(/\*\*/g, "").replace(/^\*|\*$/gm, "").replace(/^# /, "");
  for (const [what, got, expected] of [
    ["the whole welcome, then the answer", missingWelcome(whole + "\n\n7 repos · 1 workstream open\n\nThe answer.").length, 0],
    ["the first-visit heading counts", missingWelcome(firstVisit).length, 0],
    ["the same words without the markdown emphasis count", missingWelcome(plainText).length, 0],
    ["known-bad: a pasted handover answered with no welcome", missingWelcome("I'll start by reading the arc file.").join(","), "the heading,the italic line,the 🤖 line,the 🧭 line,the 👥 line"],
    ["known-bad: a question answered under the heading alone", missingWelcome(headingOnly).length, 4],
    ["known-bad: the 👥 line cut at its last sentence, emoji and all", missingWelcome(cut).join(","), "the 👥 line"],
    ["no first turn read (no transcript) is silent", checkWelcome("").length, 0],
    ["a cut welcome warns once, naming what is missing", checkWelcome(cut).map((w) => w.check + ":" + w.message.includes("the 👥 line")).join(), "welcome:true"],
    ["an unreadable transcript reads as nothing", firstTurnText("/nonexistent/transcript.jsonl"), ""],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }
}

console.log("\n=== welcome — the hook reads the first turn from the transcript, and only on the first Stop");
{
  const lines = (texts) => texts.map((text) => JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } })).join("\n") + "\n";
  const { welcome } = await import("../../../../src/scripts/events/orientation.ts");
  const root = build("f1-welcome", { arcNames: ["N1-a-subject.md"], pageOpts: { names: ["N1-a-subject.md"] } });
  const bad = join(root, "bad.jsonl"), good = join(root, "good.jsonl");
  writeFileSync(bad, lines(["I'll start by reading the arc file.", "Done."]), "utf8");
  writeFileSync(good, lines([welcome("Dhruv", false).join("\n") + "\n\n7 repos", "Done."]), "utf8");
  one("known-bad: a first turn with no welcome warns", root, "warns",
    { says: "[welcome]", session: "f1-bad", extra: { transcript_path: bad }, parity: false, why: "a new check" });
  one("a first turn that opens with the welcome is silent about it", root, "silent",
    { session: "f1-good", extra: { transcript_path: good }, parity: false, why: "a new check" });
  one("the second Stop of the same session is not read for the welcome", root, "silent",
    { session: "f1-bad", extra: { transcript_path: bad }, parity: false, why: "a new check" });
}

console.log("\n=== stop — a check speaks once in a turn, and only about this session's work (RD.DEVEX.WORKSPACE.198)");
{
  const { passingOn } = await import("../../../../src/scripts/events/stop.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const A = `.spndevex/${WORKSTREAMS}/open/001-a-subject`, B = `.spndevex/${WORKSTREAMS}/open/002-b-subject`;
  // Two open workstreams. A is whole. B has an arc its page does not name, and an open card.
  const two = (name) => workspace(name, {
    [`${A}/approach.html`]: page({ names: ["N1-a-subject.md"] }),
    [`${A}/arcs/N1-a-subject.md`]: ARC(),
    [`${B}/approach.html`]: page({ names: [], cards: CARD }),
    [`${B}/arcs/N1-b-subject.md`]: ARC(),
  });
  // THE WINDOW'S NOTE IS THE ONLY RECORD OF WHICH WORKSTREAMS IT WORKS ON (RD.DEVEX.WORKSPACE.236): a write
  // whose path is inside the folder binds it, as PreToolUse records it.
  const wroteTo = (root, session, path) => recordWrites(root, session, root, [join(root, path)]);
  const check = (label, ok) => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`); };

  // The window wrote to A only, so B's unnamed arc and B's open card are another window's.
  {
    const root = two("s198-scope-a");
    wroteTo(root, "wrote-a", `${A}/approach.html`);
    const out = run("node", [HOOK], { cwd: root, session_id: "wrote-a", last_assistant_message: "done" }, root);
    check("a window that wrote to one workstream is not held for another's unnamed arc", !/unnamed-arc/.test(out));
    check("and is not asked for another workstream's open card", !/needs-you/.test(out));
  }
  // KNOWN-BAD: the window that wrote to B hears about B, and the message names B.
  {
    const root = two("s198-scope-b");
    wroteTo(root, "wrote-b", `${B}/arcs/N1-b-subject.md`);
    const out = run("node", [HOOK], { cwd: root, session_id: "wrote-b", last_assistant_message: "done" }, root);
    check("known-bad: the window that wrote to that workstream is told about its arc", /unnamed-arc/.test(out));
    check("known-bad: and is asked for its open card", /needs-you/.test(out));
    check("and each message names the workstream by its folder", /002-b-subject/.test(out.split("[needs-you]")[1] ?? ""));
  }
  // A WINDOW WITH NO WORKSTREAM HEARS NOTHING, however many are open.
  {
    const root = two("s198-scope-none");
    const out = run("node", [HOOK], { cwd: root, session_id: "bound-to-none", last_assistant_message: "done" }, root);
    check("a window with no workstream is told nothing about a card, an arc or a page", out === "", out.slice(0, 200));
  }
  // A workstream stays the window's own across turns, though the later turn wrote nothing there.
  {
    const root = two("s198-scope-kept");
    wroteTo(root, "kept", `${B}/arcs/N1-b-subject.md`);
    run("node", [HOOK], { cwd: root, session_id: "kept", last_assistant_message: "done" }, root);
    const later = run("node", [HOOK], { cwd: root, session_id: "kept", last_assistant_message: "done" }, root);
    check("a workstream the window wrote to in an earlier turn is still its own", /unnamed-arc/.test(later));
  }
  // AN OLD BASELINE THAT BOUND A WINDOW BY A NAME FOUND IN TEXT IS HARMLESS: its list is never read.
  {
    const root = two("s198-old-baseline");
    wroteTo(root, "old", `${A}/approach.html`);
    const dir = join(root, ".spndevex", ".debug", "stop", "sessions");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "old.json"), JSON.stringify({ at: 1, steps: {}, workstreams: ["001-a-subject", "002-b-subject"], cards: [] }));
    const out = run("node", [HOOK], { cwd: root, session_id: "old", last_assistant_message: "done" }, root);
    check("an old baseline listing another workstream does not make the window answer for it", !/unnamed-arc/.test(out) && !/needs-you/.test(out), out.slice(0, 200));
  }
  // TWO WINDOWS, TWO WORKSTREAMS: each hears only its own. TWO WINDOWS, ONE WORKSTREAM: both hear it.
  {
    const root = two("s198-two-windows");
    wroteTo(root, "win-a", `${A}/approach.html`);
    wroteTo(root, "win-b", `${B}/approach.html`);
    wroteTo(root, "win-b2", `${B}/arcs/N1-b-subject.md`);
    const said = (session) => run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: "done" }, root);
    const outA = said("win-a"), outB = said("win-b"), outB2 = said("win-b2");
    check("two windows on two workstreams: the first hears nothing of the second's", !/002-b-subject|unnamed-arc|needs-you/.test(outA), outA.slice(0, 200));
    check("and the second hears its own arc and card", /unnamed-arc/.test(outB) && /needs-you/.test(outB));
    check("two windows on one workstream both hear it", /unnamed-arc/.test(outB2) && /needs-you/.test(outB2));
  }
  // A WORKSTREAM THAT LEAVES open/ DROPS OUT of the window's answer.
  {
    const root = two("s198-leaves-open");
    wroteTo(root, "leaver", `${B}/approach.html`);
    mkdirSync(join(root, ".spndevex", WORKSTREAMS, "closed"), { recursive: true });
    renameSync(join(root, B), join(root, ".spndevex", WORKSTREAMS, "closed", "002-b-subject"));
    const out = run("node", [HOOK], { cwd: root, session_id: "leaver", last_assistant_message: "done" }, root);
    check("a workstream that moved to closed/ is no longer heard", out === "", out.slice(0, 200));
  }

  // ONCE IN A TURN. The reply after a finding is its answer, whichever check spoke.
  {
    const root = two("s198-once");
    wroteTo(root, "once", `${B}/approach.html`);
    const hook = (payload) => run("node", [HOOK], { cwd: root, session_id: "once", last_assistant_message: "done", ...payload }, root);
    const first = /unnamed-arc/.test(hook({}));
    const second = /unnamed-arc/.test(hook({ stop_hook_active: true }));
    const third = /unnamed-arc/.test(hook({ stop_hook_active: true }));
    const nextTurn = /unnamed-arc/.test(hook({}));
    check("the first reply is told about the unnamed arc", first);
    check("the reply that answers it is not judged by the same check again", !second);
    check("nor is a third reply in the same turn", !third);
    check("known-bad: a later turn is judged afresh", nextTurn);
  }

  // A HANDOVER IS A DIRECTION, NEVER A MENTION. Each of the first four was read as passing work on.
  for (const [what, reply, expected] of [
    ["another session as the subject of a past event", "Another window closed workstream 008 at 14:14.", false],
    ["a session counted as a cost, after one comma", "It costs one extra plugin release and reinstall, and a new window in each session.", false],
    ["another session described", "One fact matters for 019: another window was planning it at 14:38.", false],
    ["a session the developer starts", "N004 runs after the plugin release, in a window you start.", false],
    ["known-bad: a direction is still a direction", "Pick this up in a new window.", true],
    ["known-bad: the next session as the one that starts", "The next window starts at step 5.", true],
    ["known-bad: a direction to paste the block elsewhere", "Paste this block into a fresh window to continue.", true],
  ]) check(`${what} reads as ${expected ? "passing work on" : "not a pass-on"}`, passingOn(reply) === expected);
}

console.log("\n=== handover — the labels are read as one column, the one `do not touch:` sets");
{
  const { checkHandover, handoverColumns } = await import("../../../../src/scripts/events/stop.ts");
  const ROOT = workspace("n006-stop-handover-column");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const LABELS = ["continue", "model", "read first", "pins", "state", "live now", "done when", "do not touch", "open"];
  const block = (lines) => "I am handing this over.\n\n```text\n" + lines.join("\n") + "\n```\n";
  const value = (at) => `value ${at} 020-agent-workstream-improvements N006`;
  const aligned = LABELS.map((label, at) => `${`${label}:`.padEnd(14)}${value(at)}`);

  // KNOWN-BAD: nine label lines, every label present, whose values start in different columns.
  const ragged = checkHandover(block(LABELS.map((label, at) => `${label}:${at % 2 ? " " : "      "}${value(at)}`)), ROOT, everyone(ROOT));
  check("[MKT.HOOKS.37] known-bad: values that start in different columns get one [handover] warning",
    ragged.length === 1 && ragged[0].check === "handover", JSON.stringify(ragged));
  check("[MKT.HOOKS.37] and the warning names the column that `do not touch:` sets",
    /column 14/.test(ragged[0]?.message ?? "") && /`do not touch:`/.test(ragged[0]?.message ?? ""), ragged[0]?.message);
  const oneOff = checkHandover(block(aligned.map((line) => line.startsWith("model:") ? `model: ${value(1)}` : line)), ROOT, everyone(ROOT));
  check("[MKT.HOOKS.37] known-bad: one value out of the column is named by its label",
    oneOff.length === 1 && /`model:`/.test(oneOff[0].message) && !/`pins:`/.test(oneOff[0].message), JSON.stringify(oneOff));

  // UNTOUCHED: the template's layout, its values filled in, a wrapped value indented to the column.
  check("[MKT.HOOKS.37] every value in the column passes", checkHandover(block(aligned), ROOT, everyone(ROOT)).length === 0, JSON.stringify(checkHandover(block(aligned), ROOT, everyone(ROOT))));
  const wrapped = aligned.flatMap((line) => line.startsWith("pins:") ? [line, `${" ".repeat(14)}re-run the plan's stale check first`] : [line]);
  check("[MKT.HOOKS.37] a wrapped value indented to that column passes", checkHandover(block(wrapped), ROOT, everyone(ROOT)).length === 0);
  check("[MKT.HOOKS.37] a continuation line is not read as a label, whatever it starts with",
    checkHandover(block(aligned.flatMap((line) => line.startsWith("state:") ? [line, `${" ".repeat(14)}open: this is the value going on`] : [line])), ROOT, everyone(ROOT)).length === 0);
  check("the column each label's value starts in is read from the block",
    JSON.stringify([...handoverColumns(["continue:     a", "model: b", "              c"].join("\n"))]) === JSON.stringify([["continue", 14], ["model", 7]]));
}

console.log("\n=== runnable — a tick with no date and no landed word is not a done-mark");
{
  const { unfinishedSteps } = await import("../../../../src/scripts/events/stop.ts");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const arcWith = (name, rows) => {
    const root = workspace(name, {
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ names: ["N5-a-subject.md"] }),
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N5-a-subject.md`]: rows,
    });
    return join(root, `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N5-a-subject.md`);
  };
  const HEAD = "# N5 — a subject\n\nStatus: **RUNNING — 2026-10-01.**\n\n## Steps\n\n| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n";
  const steps = unfinishedSteps(arcWith("n006-stop-tick", HEAD +
    "| 1 | spn-x | DOCS | the vague row | by hand | green | ✅ the arc is written |\n" +
    "| 2 | spn-x | DOCS | the dated row | by hand | green | ✅ 2026-09-07 |\n" +
    "| 3 | spn-x | DOCS | the landed row | by hand | green | ✅ landed 2026-10-01 — `abc1234` |\n" +
    "| 4 | spn-x | DOCS | the done row | by hand | green | ✅ **done 2026-09-23** |\n" +
    "| 5 | spn-x | DOCS | the carried row | by hand | green | ↷ carried → 021-next |\n"));
  check("[MKT.HOOKS.39] known-bad: `✅ the arc is written` is an unfinished step at the end of a turn",
    steps?.length === 1 && steps[0] === "step 1 — the vague row", JSON.stringify(steps));
  check("[MKT.HOOKS.39] a tick with a date, a tick with a landed word and a carry are each still done",
    !(steps ?? []).some((step) => /step [2345]\b/.test(step)), JSON.stringify(steps));
  // An older table has no State column, so every cell is read, and the tick is read the same way.
  const older = unfinishedSteps(arcWith("n006-stop-tick-older",
    "# N5 — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n" +
    "| 1 | a thing | here | ✅ landed |\n| 2 | another thing | here | ✅ it looks right |\n| 3 | a third | ✅ **done 2026-09-23** — proven | there |\n"));
  check("[MKT.HOOKS.39] in a table with no State column the tick is read the same way",
    older?.length === 1 && older[0].startsWith("step 2 —"), JSON.stringify(older));
}

console.log("\n=== runnable — a row in progress whose order is out with an agent is not reported (MKT.HOOKS.30)");
{
  const { checkRunnable, ordersOut } = await import("../../../../src/scripts/events/stop.ts");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const WS = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  const MARKED = `# N3 — a subject\n\nStatus: **RUNNING — 2026-09-29.**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | the split check | agents (order 02) | its suite | in progress 2026-09-29 14:32 +05:30 — with a background agent |\n\n## Log\n\n- **2026-09-29 — go.**\n`;
  const build = (name, orders) => {
    const root = workspace(name, {
      [`${WS}/a-subject-approach.html`]: page({ cards: "", names: ["N3-a-subject.md"] }),
      [`${WS}/arcs/N3-a-subject.md`]: MARKED,
      ...Object.fromEntries(Object.entries(orders).map(([file, text]) => [`${WS}/notes/N3/orders/${file}`, text])),
    });
    const arc = join(root, WS, "arcs", "N3-a-subject.md");
    return { arc, found: checkRunnable(root, Date.now() - 60_000, { [arc]: "a-different-hash" }, new Set([arc]), everyone(root)) };
  };
  const ORDER = "# Order 02 — N3 row 2: the split check\n\nBuild the check.\n";

  const out = build("n006-stop-order-out", { "02-the-split-check.md": ORDER });
  check("[MKT.HOOKS.30] an order file for the row with no report beside it is an order that is out", [...ordersOut(out.arc)].join(",") === "2", [...ordersOut(out.arc)].join(","));
  check("[MKT.HOOKS.30] the row in progress is not reported while its order is out", out.found.length === 0, JSON.stringify(out.found));

  // KNOWN-BAD, each way round: the report is back, the order is for another row, and there is no order at all.
  const back = build("n006-stop-order-back", { "02-the-split-check.md": ORDER, "02-the-split-check-report.md": "# Order 02 — report\n\nDone.\n" });
  check("[MKT.HOOKS.30] known-bad: once the report is beside the order, the row is named with its age again",
    back.found.length === 1 && /marked in progress/.test(back.found[0].message) && /step 2/.test(back.found[0].message), JSON.stringify(back.found));
  const other = build("n006-stop-order-other", { "05-the-release.md": "# Order 05 — N3 row 5: the release\n" });
  check("[MKT.HOOKS.30] known-bad: an order that is out for another row does not quiet this one", other.found.length === 1, JSON.stringify(other.found));
  const none = build("n006-stop-order-none", {});
  check("[MKT.HOOKS.30] known-bad: with no order file the row is named, as before", none.found.length === 1 && [...ordersOut(none.arc)].length === 0);
  check("[MKT.HOOKS.30] and it is still never called runnable",
    [back, other, none].every((one) => one.found.every((warning) => !/stopped with runnable work/.test(warning.message))));

  // Where the order's heading names no row, the number that opens its file name is the row.
  const numbered = build("n006-stop-order-numbered", { "02a-the-split-check.md": "# The split check, first half\n" });
  check("[MKT.HOOKS.30] an order whose heading names no row is read by the number that opens its file name",
    [...ordersOut(numbered.arc)].join(",") === "2" && numbered.found.length === 0, JSON.stringify(numbered.found));
  // One order that carries several rows names them all, as a list or as a range.
  const several = build("n010-stop-order-several", { "15-three-rows.md": "# Order 15 — N3 rows 1, 2 and 4: three rows\n" });
  check("[MKT.HOOKS.30] an order whose heading names several rows is out for each of them",
    [...ordersOut(several.arc)].sort().join(",") === "1,2,4" && several.found.length === 0, [...ordersOut(several.arc)].join(","));
  const ranged = build("n010-stop-order-ranged", { "15-a-range.md": "# Order 15 — N3 rows 0 to 2: a range\n" });
  check("[MKT.HOOKS.30] `rows 0 to 2` is rows 0, 1 and 2", [...ordersOut(ranged.arc)].sort().join(",") === "0,1,2" && ranged.found.length === 0,
    [...ordersOut(ranged.arc)].join(","));
  // Two orders for one row: the row is out until both reports are back.
  const split = build("n006-stop-order-split", { "02a-first.md": "# Order 02a — N3 row 2: first\n", "02a-first-report.md": "# report\n",
    "02b-second.md": "# Order 02b — N3 row 2: second\n" });
  check("[MKT.HOOKS.30] a row with two orders stays out until both reports are back", split.found.length === 0, JSON.stringify(split.found));
}

console.log("\n=== stop — a page left stale by an arc this session wrote, and an arc that lands with a row undecided");
{
  const { cyclesOf, tableOf, producedPage } = await import("../../../../src/scripts/commands/docs/cycles.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail.slice(0, 600)}`}`); };
  const A = `.spndevex/${WORKSTREAMS}/open/001-a-subject`, B = `.spndevex/${WORKSTREAMS}/open/002-b-subject`;
  const arcText = (status, state = "") => `# N1 — the chapter\n\nStatus: **${status} — 2026-10-01.** The chapter says where the model sits.\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | ✅ landed 2026-10-01 — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | the check | by hand | its suite | ${state} |\n\n## Log\n\n- **2026-10-01 — go.**\n`;
  // A page in the approach template's shape: a labelled status, How ending in Cycles, and Open.
  const pageFor = (folder, status, glyph) => `<!doctype html>
${STYLES}
<div class="sds-eyebrow"><span class="sds-line1">Workstream</span><span class="sds-state"><span class="sds-label">Status:</span> <span class="sds-badge sds-status sds-${status.toLowerCase()}">${glyph} ${status}</span></span></div>
<section id="s3"><div class="sds-section-head"><h2>How &mdash; the order</h2></div>
  <h3 id="h9">Cycles &mdash; the arcs, in the order they run</h3>
${tableOf(cyclesOf(folder))}
</section>
<section id="s4"><div class="sds-section-head"><h2>Open &mdash; no card is open</h2></div>
</section>
`;
  /** A workspace whose page is current for an arc at `status`, and a transcript that has only read the arc. */
  const build = (name, status = "DECIDED", state = "") => {
    const root = workspace(name, { [`${A}/arcs/N1-the-chapter.md`]: arcText(status, state) });
    const current = status === "DECIDED" || status === "PROPOSED" ? ["PLANNING", "&#x1F52E;"] : ["IMPLEMENTING", "&#x1F6A7;"];
    writeFileSync(join(root, A, "approach.html"), pageFor(join(root, A), ...current));
    const transcript = join(root, "transcript.jsonl");
    writeFileSync(transcript, toolCalls([{ name: "Read", input: { file_path: join(root, A, "arcs", "N1-the-chapter.md") } }]));
    return { root, transcript, arc: join(root, A, "arcs", "N1-the-chapter.md"), page: join(root, A, "approach.html") };
  };
  const toolCalls = (calls) => calls.map((call) => JSON.stringify({ type: "assistant", message: { role: "assistant",
    content: [{ type: "tool_use", id: "t", name: call.name, input: call.input }] } })).join("\n") + "\n";
  // THE WINDOW OWNS WORKSTREAM A (RD.DEVEX.WORKSPACE.236): its prompt named it, and the case then says what it wrote.
  const stop = (built, session) => {
    bindNamed(built.root, session, "001-a-subject", "prompt");
    built.session = session;
    return run("node", [HOOK], { cwd: built.root, last_assistant_message: "done", session_id: session, transcript_path: built.transcript }, built.root);
  };
  /** The arc moves to `status`, and the session's own Edit is what moved it, where `mine` says so. */
  const move = (built, status, state, mine = true) => {
    writeFileSync(built.arc, arcText(status, state));
    // The window's own Edit is recorded by PreToolUse as a write of the arc; another window's is not.
    if (mine) recordWrites(built.root, built.session, built.root, [built.arc]);
  };
  const count = (text, piece) => text.split(piece).length - 1;

  // KNOWN-BAD: the page is current, the arc then moves from DECIDED to RUNNING, and this session wrote it.
  {
    const built = build("n006-stop-page-stale");
    const first = stop(built, "d-stale");
    move(built, "RUNNING", "");
    const out = stop(built, "d-stale");
    check("the first Stop, which takes the baseline, says nothing about the page", !/\[page-stale\]/.test(first), first);
    check("[MKT.HOOKS.35] known-bad: an arc this session moved leaves the page stale, and one warning says so", count(out, "[page-stale]") === 1, out);
    check("[MKT.HOOKS.35] the warning names the workstream and the command that writes the page",
      out.includes("`spn-devex docs cycles write 001-a-subject`"), out);
  }
  // UNTOUCHED: the same arc moved by another window, which this session's transcript only read.
  {
    const built = build("n006-stop-page-other-writer");
    stop(built, "d-reader");
    move(built, "RUNNING", "", false);
    check("[MKT.HOOKS.35] a turn that wrote no arc gets no warning", !/\[page-stale\]/.test(stop(built, "d-reader")));
  }
  // UNTOUCHED: the session moved the arc and produced the page again in the same turn.
  {
    const built = build("n006-stop-page-produced");
    stop(built, "d-produced");
    move(built, "RUNNING", "");
    writeFileSync(built.page, producedPage(join(built.root, A), readFileSync(built.page, "utf8")).text);
    check("[MKT.HOOKS.35] a page produced again in the same turn gets no warning", !/\[page-stale\]/.test(stop(built, "d-produced")));
  }
  // UNTOUCHED: a first Stop has no baseline, so nothing says which arcs this turn wrote.
  {
    const built = build("n006-stop-page-first");
    move(built, "RUNNING", "");
    check("[MKT.HOOKS.35] a first Stop with no baseline compares nothing", !/\[page-stale\]/.test(stop(built, "d-first")));
  }
  // UNTOUCHED: another session's workstream, whose page is stale, while this session wrote its own arc.
  {
    const built = build("n006-stop-page-other-workstream");
    const other = join(built.root, B);
    mkdirSync(join(other, "arcs"), { recursive: true });
    writeFileSync(join(other, "arcs", "N1-the-chapter.md"), arcText("DECIDED"));
    writeFileSync(join(other, "approach.html"), pageFor(other, "PLANNING", "&#x1F52E;"));
    stop(built, "d-other");
    writeFileSync(join(other, "arcs", "N1-the-chapter.md"), arcText("RUNNING"));       // another window's work
    recordWrites(built.root, "d-other", built.root, [built.arc]);
    const out = stop(built, "d-other");
    check("[MKT.HOOKS.35] a workstream another session wrote is not this session's to hear about", !/\[page-stale\]/.test(out), out);
  }
  // UNTOUCHED: a page in the older shape has no Cycles table, so the command has nothing to write.
  {
    const built = build("n006-stop-page-older-shape");
    writeFileSync(built.page, page({ names: ["N1-the-chapter.md"] }));
    stop(built, "d-older");
    move(built, "RUNNING", "");
    check("[MKT.HOOKS.35] a page with no Cycles table is not told to run the command", !/\[page-stale\]/.test(stop(built, "d-older")));
  }

  // THE CLOSE GATE'S REPORT, WHEN AN ARC LANDS. KNOWN-BAD: the arc moves to LANDED with a row nobody decided.
  {
    const built = build("n006-stop-landed-undecided", "RUNNING", "");
    stop(built, "h-undecided");
    move(built, "LANDED", "");
    const out = stop(built, "h-undecided");
    check("[MKT.HOOKS.36] known-bad: an arc that lands with a row undecided gets one warning", count(out, "[arc-landed]") === 1, out);
    check("[MKT.HOOKS.36] the warning lists that row, under the close gate's tally",
      /undecided\s+spn-support-ts — N1 step 2 — the check/.test(out) && /2 rows · landed 1/.test(out), out);
  }
  {
    const built = build("n006-stop-landed-pending", "RUNNING", "");
    stop(built, "h-pending");
    move(built, "LANDED", "✅ the arc is written");
    const out = stop(built, "h-pending");
    check("[MKT.HOOKS.36] known-bad: a row that reads pending is listed too", /pending\s+spn-support-ts — N1 step 2 — the check/.test(out), out);
  }
  // UNTOUCHED: the arc lands with every row landed, carried or deferred.
  {
    const built = build("n006-stop-landed-whole", "RUNNING", "");
    stop(built, "h-whole");
    move(built, "LANDED", "⊘ deferred until a partner asks");
    check("[MKT.HOOKS.36] an arc that lands with every row accounted for gets none", !/\[arc-landed\]/.test(stop(built, "h-whole")));
  }
  // UNTOUCHED: the arc already read LANDED at the last Stop, and this turn only wrote it again.
  {
    const built = build("n006-stop-landed-already", "LANDED", "");
    stop(built, "h-already");
    move(built, "LANDED", "");
    check("[MKT.HOOKS.36] an arc that already read LANDED at the last Stop is not read again", !/\[arc-landed\]/.test(stop(built, "h-already")));
  }
  // UNTOUCHED: another window landed the arc, and this session only read it.
  {
    const built = build("n006-stop-landed-other-writer", "RUNNING", "");
    stop(built, "h-reader");
    move(built, "LANDED", "", false);
    check("[MKT.HOOKS.36] an arc another window landed is not this session's to hear about", !/\[arc-landed\]/.test(stop(built, "h-reader")));
  }

  console.log("\n=== stop — a page that holds its own copy of the styles");
  const { checkOwnCopy, ownCopyPages } = await import("../../../../src/scripts/events/stop.ts");
  // A page as it was written before the shared stylesheet: it links nothing, it carries a style block,
  // and its classes have no prefix. Its one card is a `div.open`, the name its own copy uses.
  const OLD_CARD = `  <div class="open">\n    <h4 id="q1">Q1 &middot; a real question</h4>\n    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>\n  </div>\n`;
  const ownPageFor = (folder, status, glyph) => pageFor(folder, status, glyph)
    .replace(STYLES, "<style>.eyebrow{font-size:.8rem} .open{border-left:2px solid orange}</style>").replace(/sds-/g, "")
    .replace(`no card is open</h2></div>\n`, `no card is open</h2></div>\n${OLD_CARD}`);
  const HALF = "◐ stopped — half of it is written";
  const buildOwn = (name, form = ownPageFor) => {
    const built = build(name, "RUNNING", "");
    writeFileSync(built.page, form(join(built.root, A), "PLANNING", "&#x1F52E;"));
    return built;
  };
  // KNOWN-BAD FOR A READER OF THE SHARED NAMES: a row is stopped, the header reads PLANNING over a
  // running arc, and the page's only card is a `div.open`. Read by the shared names the page has no
  // card, so `stopped-no-card` would speak; read as the page-stale check reads, its header is stale.
  {
    const built = buildOwn("n008-stop-own-copy");
    const text = readFileSync(built.page, "utf8");
    check("the fixture links no shared stylesheet and holds no shared name", !text.includes("sds-") && text.includes("<style>") && text.includes(`<div class="open">`));
    const first = run("node", [HOOK], { cwd: built.root, last_assistant_message: "done", session_id: "o-own", transcript_path: built.transcript }, built.root);
    check("a session that wrote nothing to the workstream is told nothing about its page", !/\[own-copy\]/.test(first), first);
    move(built, "RUNNING", HALF);
    const out = stop(built, "o-own");
    check("[MKT.SCRIPTS.108] the Stop hook names a page with its own copy once, as a RULE line with what to do",
      count(out, "[own-copy]") === 1 && count(out, OWN_COPY) === 1 && out.includes(`[RULE] \`${A}/approach.html\`: ${OWN_COPY}`), out);
    check("[MKT.SCRIPTS.108] it reads no class of the page: it does not say that Open carries no card", !/\[stopped-no-card\]/.test(out) && !/\[cards-in-arcs\]/.test(out), out);
    check("[MKT.SCRIPTS.108] and it does not name the command that refuses such a page", !/\[page-stale\]/.test(out), out);
    check("[MKT.SCRIPTS.108] the card of such a page is still read by its id, so the reply is still asked to open with Needs you",
      /\[needs-you\] `001-a-subject`: Q1 /.test(out) && out.includes("does not open with **Needs you**"), out);
    const again = stop(built, "o-own");
    check("[MKT.SCRIPTS.108] the page is named once in a session: the next Stop does not name it again", !/\[own-copy\]/.test(again), again);
    check("[MKT.SCRIPTS.108] another session that writes to the workstream is told once too",
      (recordWrites(built.root, "o-other", built.root, [built.arc]),
        count(run("node", [HOOK], { cwd: built.root, last_assistant_message: "done", session_id: "o-other" }, built.root), "[own-copy]")) === 1);
  }
  // UNTOUCHED: the same workstream with its page in the shared form, and the same card as a `div.sds-open`.
  {
    const shared = (folder, status, glyph) => pageFor(folder, status, glyph).replace(`no card is open</h2></div>\n`, `no card is open</h2></div>\n${CARD}\n`);
    const built = buildOwn("n008-stop-shared-form", shared);
    stop(built, "o-shared");
    move(built, "RUNNING", HALF);
    const out = stop(built, "o-shared");
    check("[MKT.SCRIPTS.108] untouched: a page in the shared form is not named", !/\[own-copy\]/.test(out) && !out.includes(OWN_COPY), out);
    check("[MKT.SCRIPTS.108] untouched: and it is read, so its stale header is said", count(out, "[page-stale]") === 1 && out.includes("the header's status"), out);
    check("[MKT.SCRIPTS.108] untouched: its `div.sds-open` card is seen, so a stopped row is not reported as having no card", !/\[stopped-no-card\]/.test(out), out);
  }
  // The same reading, asked of the function: the lines it names, and the ones a session was told before.
  {
    const built = buildOwn("n008-stop-own-copy-lines");
    const lines = ownCopyPages(built.root, everyone(built.root));
    check("[MKT.SCRIPTS.108] the line is the page's path from the workspace, then OWN_COPY", lines.length === 1 && lines[0] === `\`${A}/approach.html\`: ${OWN_COPY}.`, JSON.stringify(lines));
    check("[MKT.SCRIPTS.108] a workstream that is not this session's is not read", ownCopyPages(built.root, new Set(["002-b-subject"])).length === 0);
    check("[MKT.SCRIPTS.108] a page the session was told about before draws no warning", checkOwnCopy(built.root, everyone(built.root), lines).length === 0 && checkOwnCopy(built.root, everyone(built.root), []).length === 1);
  }
}

// ── while work runs, only a finding about the reply sends the agent back (RD.DEVEX.WORKSPACE.244) ──
//
// EVERY FINDING MADE THE AGENT REPLY AGAIN, and the developer saw that reply. While a row is in
// progress, a finding about a page, the notes or a docs tree is held: the hook exits 0. It is not kept
// as text. The baseline's marks stay where they were, so the checks find it again at the first turn end
// where no row is in progress. The cases below run the hook over several turn ends of one session.
{
  const { splitFindings, checkHandover, givesHandover } = await import("../../../../src/scripts/events/stop.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const W = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  const MARK = "in progress 2026-10-09 14:32 +05:30";
  const LANDED = "LANDED — `def5678`";
  const steps = (state) => `# N3 — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n` +
    `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
    `| 1 | spn-foundation | DOCS | the chapter | by hand | audit | LANDED — \`abc1234\` |\n` +
    `| 2 | spn-support-ts | CODE | the split check | by hand | its suite | ${state} |\n\n## Log\n\n- **2026-10-09 — go.**\n`;
  const built = (name, { named = true, state = MARK } = {}) => workspace(name, {
    [`${W}/approach.html`]: page({ names: named ? ["N3-a-subject.md"] : [] }),
    [`${W}/arcs/N3-a-subject.md`]: steps(state),
    [`${W}/notes/N3/spec.md`]: "# N3 — the specification\n\nThe check reads wiring.\n",
  });
  const stop = (root, session, reply = "Row 1 landed.", extra = {}) => {
    bindOpen(root, session);
    return run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: reply, ...extra }, root);
  };
  const arcOf = (root) => join(root, W, "arcs", "N3-a-subject.md");
  const rewrite = (root, session, change) => { writeFileSync(arcOf(root), change(readFileSync(arcOf(root), "utf8")), "utf8"); wroteArcs(root, session); };
  const ANSWER = "- **2026-10-09 — Q7 B** (the developer: *\"the second reading\"*). The check reads setup only.\n";
  const logAnswer = (root, session) => rewrite(root, session, (text) => text + ANSWER);
  const land = (root, session) => rewrite(root, session, (text) => text.replace(MARK, LANDED));
  const moveSpec = (root) => writeFileSync(join(root, W, "notes", "N3", "spec.md"), "# N3 — the specification\n\nThe check reads setup only, as the developer chose.\n", "utf8");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 300)}`}`); };

  console.log("\n=== stop — while a row is in progress, a finding that is not about the reply is held (RD.DEVEX.WORKSPACE.244)");
  {
    const root = built("n009-held-page", { named: false });
    const running = stop(root, "held-page");
    check("a finding about the page, while a row is in progress, sends no reply: the hook is silent", running === "", running);
    land(root, "held-page");
    const waiting = stop(root, "held-page");
    check("known-bad: the same finding is said at the first turn end where no row is in progress",
      /\[unnamed-arc\]/.test(waiting) && waiting.includes("N3-a-subject.md"), waiting);
  }
  {
    const root = built("n009-held-notes");
    stop(root, "held-notes");                       // the session's first turn end: its baseline
    logAnswer(root, "held-notes");
    const second = stop(root, "held-notes");
    check("an answer whose notes did not move is held while a row is in progress", !/\[notes\]/.test(second) && second === "", second);
    const third = stop(root, "held-notes");
    check("and it is still held at the next turn end of the same run", third === "", third);
    land(root, "held-notes");
    const waiting = stop(root, "held-notes");
    check("nothing held is lost: the notes finding is found again, whole, when the agent waits",
      /\[notes\]/.test(waiting) && waiting.includes("notes/N3/spec.md") && waiting.includes("RD.DEVEX.WORKSPACE.193"), waiting);
    const after = stop(root, "held-notes", "Done.", { stop_hook_active: true });
    check("and once said, the marks move on: the reply that answers it is not told again", !/\[notes\]/.test(after), after);
    const later = stop(root, "held-notes");
    check("nor is a later turn that changed nothing", !/\[notes\]/.test(later), later);
  }
  {
    const root = built("n009-held-fixed");
    stop(root, "held-fixed");
    logAnswer(root, "held-fixed");
    const held = stop(root, "held-fixed");
    moveSpec(root);
    land(root, "held-fixed");
    const waiting = stop(root, "held-fixed");
    check("a held finding that the agent fixed before it waits is not found again, so it is not said",
      held === "" && !/\[notes\]/.test(waiting), `${held} // ${waiting}`);
  }
  {
    const root = built("n009-held-reply", { named: false });
    const out = stop(root, "held-reply", "Row 1 landed.\n\nPick B and we move on.");
    check("known-bad: a decision put with no card still sends the agent back while a row is in progress", /\[reply-shape\]/.test(out), out);
    check("and the finding about the page is held in that same turn", !/\[unnamed-arc\]/.test(out), out);
    land(root, "held-reply");
    const waiting = stop(root, "held-reply");
    check("the held finding is said when the agent waits, though another check spoke in between", /\[unnamed-arc\]/.test(waiting), waiting);
  }
  {
    const root = built("n009-held-handover", { named: false });
    const out = stop(root, "held-handover", "Pick this up in a new window.");
    check("known-bad: a pass-on with no block still sends the agent back while a row is in progress",
      /\[handover\]/.test(out) && !/\[unnamed-arc\]/.test(out), out);
  }
  {
    const ABOUT_THE_REPLY = ["needs-you", "reply-shape", "handover", "welcome"];
    const THE_REST = ["notes", "carried", "pageless", "cards-in-arcs", "stopped-no-card", "unnamed-arc", "page-stale", "own-copy",
      "arc-landed", "runnable", "hold", "corpus"];
    const all = [...ABOUT_THE_REPLY, ...THE_REST].map((name) => ({ check: name, message: `the ${name} finding, whole` }));
    const names = (list) => list.map((warning) => warning.check).join(" ");
    const split = typeof splitFindings === "function" ? splitFindings : () => ({ said: [], held: [] });
    const running = split(all, true), waiting = split(all, false);
    check("while a row is in progress, the four findings about the reply are said", names(running.said) === ABOUT_THE_REPLY.join(" "), names(running.said));
    check("and every other finding is held, with its message as it was", names(running.held) === THE_REST.join(" ")
      && running.held.every((warning) => warning.message === `the ${warning.check} finding, whole`), names(running.held));
    check("with no row in progress, every finding is said and none is held", names(waiting.said) === names(all) && waiting.held.length === 0, names(waiting.held));
  }

  // ── a handover block is owed once, and an open card in a handover is one line (RD.DEVEX.WORKSPACE.189, .198) ──
  console.log("\n=== handover — the block is owed once, and a card that is open is named in one line, never asked for in full");
  const WHOLE = ["```text",
    "continue:     workstream `001-a-subject`, arc `N3`, row 2, in a `spn-support-ts` window",
    "model:        Opus 5.5, effort high",
    "read first:   the arc `N3-a-subject.md`, rows 1 and 2",
    "pins:         spn-support-ts abc1234",
    "state:        row 1 landed; row 2 not started",
    "live now:     no reload",
    "done when:    the suite passes",
    "do not touch: the templates folder",
    "open:         none",
    "```"].join("\n");
  const PASS_ON = "Pick this up in a new window.";
  const gives = typeof givesHandover === "function" ? givesHandover : () => null;
  for (const [what, got, expected] of [
    ["a reply with the whole block gives a handover", gives(`${PASS_ON}\n\n${WHOLE}`), true],
    ["a block with a label missing does not", gives(`${PASS_ON}\n\n${WHOLE.replace(/\npins:[^\n]*/, "")}`), false],
    ["a block with a {{…}} left does not", gives(`${PASS_ON}\n\n${WHOLE.replace("`N3`", "`N{{n}}`")}`), false],
    ["a reply with no block does not", gives(PASS_ON), false],
  ]) check(what, got === expected, `got ${got}`);
  {
    const root = built("n009-handover-fn", { state: LANDED });
    const mine = everyone(root);
    check("a pass-on with no block, after a whole block was given, owes no second block",
      checkHandover(PASS_ON, root, mine, true).length === 0, JSON.stringify(checkHandover(PASS_ON, root, mine, true)));
    check("known-bad: the same pass-on, with no block given before, is told to write one",
      checkHandover(PASS_ON, root, mine, false).length === 1 && /carries no handover block/.test(checkHandover(PASS_ON, root, mine, false)[0].message));
    check("known-bad: a block printed again is still read, so one with a label missing is told so",
      checkHandover(`${PASS_ON}\n\n${WHOLE.replace(/\npins:[^\n]*/, "")}`, root, mine, true).length === 1);
  }
  {
    const carded = workspace("n009-handover-card", {
      [`${W}/approach.html`]: page({ cards: CARD, names: ["N3-a-subject.md"] }),
      [`${W}/arcs/N3-a-subject.md`]: steps(LANDED),
    });
    const mine = everyone(carded);
    const named = checkHandover(`${PASS_ON}\n\n${WHOLE.replace("open:         none", "open:         Q1 · a real question, on the approach page")}`, carded, mine);
    check("a handover that names the open card in one line on its `open:` line is whole", named.length === 0, JSON.stringify(named));
    const unnamed = checkHandover(`${PASS_ON}\n\n${WHOLE}`, carded, mine);
    check("a handover that leaves an open card out is told to name it in one line",
      unnamed.length === 1 && unnamed[0].message.includes("Q1") && /in one line/.test(unnamed[0].message) && /`open:`/.test(unnamed[0].message),
      JSON.stringify(unnamed));
    check("and the message never asks for the card in full, and never says to answer first",
      unnamed.length === 1 && !/Put the cards to the developer in full/.test(unnamed[0].message) && !/Answer first/.test(unnamed[0].message),
      JSON.stringify(unnamed));
    const later = checkHandover("The handover is in my last reply. Open a new window from it when you are ready.", carded, mine, true);
    check("a later reply that names the handover in one line owes no block and no card", later.length === 0, JSON.stringify(later));
  }
  {
    // THE HOOK REMEMBERS THE BLOCK. Turn 1 gives it; turn 2 directs the work on again with no block.
    const root = built("n009-handover-once", { state: LANDED });
    const first = stop(root, "ho-once", `${PASS_ON}\n\n${WHOLE}`);
    const second = stop(root, "ho-once", PASS_ON);
    check("the hook: the reply that gives the whole block is silent", first === "", first);
    check("the hook: a later reply in the same window that passes the work on again is not asked for a second block", !/\[handover\]/.test(second), second);
    rewrite(root, "ho-once", (text) => text.replace("the split check", "the split check, and its cases"));
    const moved = stop(root, "ho-once", PASS_ON);
    check("known-bad: once the step rows have moved, the old block no longer says where to start, and a block is owed", /\[handover\]/.test(moved), moved);
  }
  {
    // A FINDING ON A HANDOVER REPLY IS ANSWERED WITHOUT THE BLOCK. The page does not name the arc, so
    // the handover reply draws `unnamed-arc`. The answer mentions the new window and prints no block.
    const root = built("n009-handover-answer", { named: false, state: LANDED });
    const first = stop(root, "ho-answer", `${PASS_ON}\n\n${WHOLE}`);
    check("the hook: a handover reply with a whole block is told only about the page", /\[unnamed-arc\]/.test(first) && !/\[handover\]/.test(first), first);
    const answer = stop(root, "ho-answer", "The page now names the arc. The handover block above still holds: open a new window from it.",
      { stop_hook_active: true });
    check("the hook: the reply that answers that finding is not asked for the block again", !/\[handover\]/.test(answer), answer);
    const never = built("n009-handover-never", { state: LANDED });
    stop(never, "ho-never", "Row 2 landed.");
    const asked = stop(never, "ho-never", PASS_ON);
    check("known-bad: a window that never gave a block is told to write one", /\[handover\]/.test(asked), asked);
  }
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
