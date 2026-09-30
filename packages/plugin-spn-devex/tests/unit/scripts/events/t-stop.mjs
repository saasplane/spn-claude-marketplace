import { PLUGIN } from "../../../helpers/harness.mjs";
// `stop` — the four arc-to-page checks and reply-shape, merged into stop.ts.
//
// EACH KNOWN-BAD IS RUN TWICE: once with arcs named `arc-{subject}.md`, which is what the Python
// looks for, and once with them named `N1-{subject}.md`, which is what this workspace actually uses.
// The first pair proves parity. The second is finding F11 — the Python goes silent and the port does
// not, which is the whole reason the filter had to go.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

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


const page = ({ rows = [["a thing", "spn-foundation", "&#x2705; landed"]], cards = "", names = [], settled = [] }) => `<!doctype html>
<div class="eyebrow">Workstream 001 &middot; running</div>
<section id="s3"><div class="sec-head"><h2>How</h2></div>
  <table><thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
  <tbody>
${rows.map(([w, s, st]) => `    <tr><td>${w}</td><td>${s}</td><td>${st}</td></tr>`).join("\n")}
  </tbody></table>
  ${names.map((n) => `<p>The argument behind it is in <code>${n}</code>.</p>`).join("\n  ")}
</section>
<section id="s6"><div class="sec-head"><h2>Settled already</h2></div>
  <table><tbody>
${settled.map((c) => `    <tr><td>${c} &middot; a question</td><td>Answered B, 2026-09-09</td></tr>`).join("\n")}
  </tbody></table>
</section>
<section id="s4"><div class="sec-head"><h2>Open</h2></div>
${cards}
</section>`;

// A CARD IS A TABLE ROW (Q185), options nested, so the reader is exercised on the shape that breaks
// a first-`</tr>` match rather than on the inline shape that happens to survive one.
// The template's open card: `<div class="open">` wrapping `<h4 id="qN">`. The page's amber edge and
// the rail's count badge both key on `.open`, so a card written as a row loses both.
const CARD = `  <div class="open">
    <h4 id="q1">Q1 &middot; a real question</h4>
    <div class="scroll"><table><thead><tr><th></th><th>What</th></tr></thead>
    <tbody><tr><td><strong>A</strong></td><td>one way</td></tr></tbody></table></div>
    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>
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
  const payload = { cwd: root, last_assistant_message: reply, ...(session ? { session_id: session } : {}), ...extra };
  // A SESSION'S FIRST STOP IS ITS BASELINE. Where a case is about work this session did, the hook
  // runs once to take that baseline, the edit is made, and the case is the second Stop.
  if (edit) { run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root); edit(root); }
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
    const got = checkRunnable(root, since, baseline).length;
    const ok = got === expected;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${what} -> ${got} warning(s)`);
  }

  // THE CASE THE SWEEP TAUGHT: the file moved and the step table did not.
  n += 1;
  {
    const { stepHash } = await import("../../../../src/scripts/events/stop.ts");
    const same = { [arcPath]: stepHash(readFileSync(arcPath, "utf8")) };
    const quiet = checkRunnable(root, past, same).length === 0;
    if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  an arc whose RECORD moved but whose step rows did not is silent`);
  }

  // A STATUS WORD IS A CLAIM ANY WINDOW CAN HAVE WRITTEN. `RUNNING` fired on `N114` in a headless
  // window that had never opened it, after every reply, and forced eight "Blocked" turns. With no
  // baseline of this session's own, the word alone decides nothing.
  n += 1;
  const claimed = checkRunnable(workspace("stop-runnable-claimed", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: RUNNING,
  }), 0).length === 0;
  if (!claimed) failed += 1;
  console.log(`  ${claimed ? "PASS" : "FAIL"}  an arc that SAYS RUNNING no longer fires on the word alone`);

  // A LANDED ARC'S UNFINISHED ROWS ARE HISTORY. Editing one to add a log line must not report it.
  n += 1;
  const landed = checkRunnable(workspace("stop-runnable-landed", {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page({ cards: "", names: ["N1-a-subject.md"] }),
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a-subject.md`]: RUNNING.replace("Status: **RUNNING**", "**Status: LANDED 2026-09-23**"),
  }), past, WORK_MOVED).length === 0;
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
    const got = checkRunnable(root, past, WORK_MOVED, touched).length;
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
    run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root);
    touchStep(root);
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
  // moves the arc's steps, and this window's transcript shows no write to it: not its work.
  {
    const root = shaped("m1-stop-other-writer");
    const transcript = join(root, "transcript.jsonl");
    const lines = (inputs) => inputs.map((input) => JSON.stringify({ type: "assistant", message: { role: "assistant",
      content: [{ type: "tool_use", id: "t", name: input.name, input: input.input }] } })).join("\n") + "\n";
    writeFileSync(transcript, lines([{ name: "Read", input: { file_path: join(root, SHAPED_AT) } }]), "utf8");
    const payload = { cwd: root, last_assistant_message: "done", session_id: "m1-reader", transcript_path: transcript };
    run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root);
    touchStep(root);                                   // another window works on the arc
    writeFileSync(transcript, readFileSync(transcript, "utf8") +
      lines([{ name: "Bash", input: { command: `cat ${SHAPED_AT}` } }]), "utf8");
    const quiet = !/\[runnable\]/.test(run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root));
    n += 1; if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  an arc this session only read, while another window changed it, is not its work`);

    // And the same session, once its own Edit writes the step rows.
    touchStep(root);
    const file = join(root, SHAPED_AT);
    writeFileSync(file, readFileSync(file, "utf8").replace("| the split check |", "| the split check, reworded |"), "utf8");
    writeFileSync(transcript, readFileSync(transcript, "utf8") +
      lines([{ name: "Edit", input: { file_path: file, old_string: "| the split check |", new_string: "| the split check, reworded |" } }]), "utf8");
    const warns = /\[runnable\]/.test(run("node", [`${HOOKS}/src/scripts/events/stop.ts`], payload, root));
    n += 1; if (!warns) failed += 1;
    console.log(`  ${warns ? "PASS" : "FAIL"}  the same arc once this session's own Edit changed its step rows`);
  }

  // THE TRANSCRIPT READER ON ITS OWN: writers count, a read does not, and a Bash command counts only
  // where it writes.
  {
    const root = workspace("m1-stop-transcript", {});
    const arc = join(root, "arcs", "N9-x.md");
    const transcript = join(root, "t.jsonl");
    const entry = (name, input) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
    for (const [what, line, expected] of [
      ["an Edit on the arc", entry("Edit", { file_path: arc }), true],
      ["a Write on the arc", entry("Write", { file_path: arc, content: "x" }), true],
      ["a Read of the arc", entry("Read", { file_path: arc }), false],
      ["a Bash command that only prints it", entry("Bash", { command: "cat arcs/N9-x.md" }), false],
      ["a Bash command that rewrites it", entry("Bash", { command: "sed -i '' 's/a/b/' arcs/N9-x.md" }), true],
    ]) {
      writeFileSync(transcript, `${line}\n`, "utf8");
      const got = arcsTouched(transcript, 0, [arc])?.touched.has(arc) ?? null;
      n += 1; const ok = got === expected; if (!ok) failed += 1;
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${what} ${expected ? "counts" : "does not count"} as a write`);
    }
    n += 1;
    const missing = arcsTouched(join(root, "absent.jsonl"), 0, [arc]) === null;
    if (!missing) failed += 1;
    console.log(`  ${missing ? "PASS" : "FAIL"}  an unreadable transcript is null, so the caller falls back to file times`);
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
// offered a new window with two cards standing. A card's answer can change which arc runs next and
// what the next window reads first, so a handover written over one is a brief that assumed an
// answer nobody gave.
one("a handover offered while a card is open is refused, and the card is named",
  build("stop-handover-open-card", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "Answer first, then hand over",
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
  const says = (reply) => checkHandover(reply, ROOT).length > 0;

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
    const stale = checkHandover("Open a new window and paste this.", ROOT);
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
        `<div class="eyebrow">x</div><section id="s4"><div class="open"><h4 id="q329">Q329 &middot; which way</h4>` +
        `<div class="rec"><b>Decision:</b> &mdash;</div></div></section><p>N1-a.md</p>`,
      [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-a.md`]: "# N1\n",
    });
    const reply = "Q329 · which way\n\n**What** — the gate.\n\n**Why** — what it costs to leave it.\n\n" +
      "| | Option | What it costs |\n| --- | --- | --- |\n| **A** | now | a cycle |\n| **B** | wait | a window |\n\n" +
      "Recommended: A. Once it is answered, the next window starts at step 2.\n\nOpen a new window after you answer.";
    const quiet = checkHandover(reply, CARDED).length === 0;
    n += 1; if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  a reply putting the open card in full is not refused for a handover`);
    const bare = checkHandover("Open a new window after you answer.", CARDED);
    const still = bare.length === 1 && /Answer first/.test(bare[0].message);
    n += 1; if (!still) failed += 1;
    console.log(`  ${still ? "PASS" : "FAIL"}  the same direction without the card is still told to answer first`);
  }

  const short = checkHandover("Pick this up in a new window.\n```\ncontinue: workstream 008-plain-language, arc N13\n```", ROOT);
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
    ["no [handover] finding on the diff preview", checkHandover(DIFF, ROOT).length, 0],
    ["no [handover] finding on a card fence holding {{", checkHandover(CARD_FENCE, ROOT).length, 0],
    ["the filled-in template, in the aligned layout with wrapped values, is a whole handover", checkHandover(`Pick this up in a new window.\n\n${FILLED}`, ROOT).length, 0],
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
    const got = checkHandover(`Pick this up in a new window.\n\n${withoutLabel(label)}`, ROOT);
    const ok = got.length === 1 && new RegExp(`missing \`${label}:\``).test(got[0].message);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a block missing \`${label}:\` is refused, naming it${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }

  // NO LEGACY: the sentence form is refused as a block missing every label.
  n += 1;
  const sentence = checkHandover(`Pick this up in a new window.\n\n${SENTENCE}`, ROOT);
  const refused = sentence.length === 1 && /missing `continue:` · `model:`/.test(sentence[0].message) && /`open:`/.test(sentence[0].message);
  if (!refused) failed += 1;
  console.log(`  ${refused ? "PASS" : "FAIL"}  the old sentence form is refused, naming the labels it lacks${refused ? "" : ` — got ${JSON.stringify(sentence)}`}`);

  // A LABEL IN CAPITALS IS NOT THE LABEL. The chapter fixes them lowercase.
  n += 1;
  const upper = checkHandover(`Pick this up in a new window.\n\n${FILLED.replace("\nmodel:", "\nModel:")}`, ROOT);
  const caseKept = upper.length === 1 && /missing `model:`/.test(upper[0].message);
  if (!caseKept) failed += 1;
  console.log(`  ${caseKept ? "PASS" : "FAIL"}  \`Model:\` in capitals does not count as \`model:\``);

  // `continue:` CARRIES THE WORKSTREAM AND THE ARC.
  for (const [what, from, to, says] of [
    ["no arc", "arc `N116`, ", "", /names no arc/],
    ["no workstream", "workstream `008-plain-language`, ", "", /names no workstream/],
  ]) {
    n += 1;
    const got = checkHandover(`Pick this up in a new window.\n\n${FILLED.replace(from, to)}`, ROOT);
    const ok = got.length === 1 && says.test(got[0].message);
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  a \`continue:\` line with ${what} is refused${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
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
  const found = checkRunnable(root, Date.now() - 60_000, { [arcPath]: "a-different-hash" }, new Set([arcPath]));
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
  const Q352 = (decision) => `  <div class="open">
    <h4 id="q352">Q352 &middot; which way</h4>
    <div class="scroll"><table><thead><tr><th></th><th>What</th></tr></thead>
    <tbody><tr><td><strong>A</strong></td><td>one way</td></tr></tbody></table></div>
    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> ${decision}</div>
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
    ["an open card and no Needs you is reported", needsYou(PROGRESS, ["Q356"]).length, 1],
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

console.log("\n=== stop — the hook reads the open cards off the page for Needs you");

one("known-bad: a reply over an open card that opens with progress",
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

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
