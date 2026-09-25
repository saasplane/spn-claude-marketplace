// `stop` — the four arc-to-page checks and reply-shape, merged into stop.ts.
//
// EACH KNOWN-BAD IS RUN TWICE: once with arcs named `arc-{subject}.md`, which is what the Python
// looks for, and once with them named `N1-{subject}.md`, which is what this workspace actually uses.
// The first pair proves parity. The second is finding F11 — the Python goes silent and the port does
// not, which is the whole reason the filter had to go.
import { execFileSync } from "node:child_process";
import { workspace } from "./fixture.mjs";

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
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

const ARC = (extra = "") => `# Arc — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n\n## Log\n\n- **2026-09-19 — go.**\n${extra}`;

/** One workspace, with its arcs named either the old way or the way 008 actually names them. */
function build(name, { arcNames, pageOpts = {}, arcExtra = "" }) {
  const files = {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html": page(pageOpts),
  };
  for (const arc of arcNames)
    files[`.spndevex/workstreams/open/001-a-subject/arcs/${arc}`] = ARC(arcExtra);
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
function one(label, root, expect, { says, reply = "done", parity = true, why = "" } = {}) {
  n += 1;
  const payload = { cwd: root, last_assistant_message: reply };
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
  "warns", { says: "An arc no split-plan row names" });

one("a Q card written into an arc while the page shows none",
  build("stop-cards-old", { arcNames: ["arc-a-subject.md"], arcExtra: "\n### `Q9` · a question that belongs on the page\n\nsome argument\n" }),
  "warns", { says: "A card written into an arc" });

one("an open workstream with arcs and no page at all",
  workspace("stop-pageless-old", {
    ".spndevex/workstreams/open/001-a-subject/arcs/arc-a-subject.md": ARC(),
  }),
  "warns", { says: "An open workstream with arcs and no page" });

one("a stopped row while Open carries no card",
  build("stop-stopped-old", { arcNames: ["arc-a-subject.md"],
    pageOpts: { rows: [["half of it", "spn-support-ts", "&#x25D0; 2026-09-08 part done"]], names: ["arc-a-subject.md"] } }),
  "warns", { says: "A row waiting on the developer" });

console.log("\n=== stop — F11: the same four, with arcs named the way this workspace names them");

one("an arc no row names, N-named",
  build("stop-unnamed-new", { arcNames: ["N1-a-subject.md"], pageOpts: { cards: CARD } }),
  "warns", { says: "An arc no split-plan row names", parity: false, why: F11 });

one("a Q card in an N-named arc while the page shows none",
  build("stop-cards-new", { arcNames: ["N1-a-subject.md"], arcExtra: "\n### `Q9` · a question that belongs on the page\n\nsome argument\n" }),
  "warns", { says: "A card written into an arc", parity: false, why: F11 });

one("an open workstream whose only arcs are N-named, and no page",
  workspace("stop-pageless-new", { ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md": ARC() }),
  "warns", { says: "An open workstream with arcs and no page", parity: false, why: F11 });

console.log("\n=== stop — F16: the template's own unanswered card must read as open");

// The card template ships `<b>Decision:</b> &mdash;`. A check that asks only whether the marker is
// PRESENT reads every such card as answered — which is what `openCards` did, so `runnable` could
// never see a card as open and nagged through sittings where one was.
const RUNNING = "# Arc — a subject\n\nStatus: **RUNNING**\n\n## Steps\n\n| # | What | Where | How you would know |\n| --- | --- | --- | --- |\n| 1 | a thing | here | ✅ landed |\n| 2 | another thing | here | ☐ raised |\n\n## Log\n\n- **2026-09-19 — go.**\n";

function runningWorkspace(name, cards) {
  return workspace(name, {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html":
      page({ cards, names: ["N1-a-subject.md"] }),
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md": RUNNING,
  });
}

one("an unlanded step with the template's card open — runnable must stay quiet",
  runningWorkspace("stop-f16-open", CARD),
  "silent", { parity: false, why: "F16 — the Python read the template's `Decision:` marker as an answer" });

const ANSWERED = CARD.replace("<b>Decision:</b> &mdash;", "<b>Decision:</b> A, 2026-09-19.");
one("the same card once it carries a real decision — runnable speaks again",
  runningWorkspace("stop-f16-answered", ANSWERED),
  "warns", { says: "no card is open", parity: false, why: "F16 — the Python could not tell these two apart" });

one("an unlanded step with no card at all",
  runningWorkspace("stop-f16-none", ""),
  "warns", { says: "no card is open", parity: false, why: "F11 — the Python listed arcs as `arc-*` only" });

console.log("\n=== runnable — N39 step 8: which arc is being executed is a fact, not a status word");

// MEASURED 2026-09-23 OVER WORKSTREAM `008`: exactly ONE arc of 57 carries the word `RUNNING`, and
// it is not the arc any recent sitting has been executing. The rest read LANDED 26, PART-LANDED 15,
// DECIDED 2, OPEN 2, TAKEN 1, and 10 carry no status line at all. So this gate — the one written for
// *reported and stopped* — can speak about one arc in fifty-seven. What the sitting wrote is on disk.
{
  const { checkRunnable } = await import("../src/scripts/events/stop.ts");
  const OPEN_ARC = RUNNING.replace("Status: **RUNNING**", "**Status: OPEN \u2014 opened today**");
  const root = workspace("stop-runnable-touched", {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html": page({ cards: "", names: ["N1-a-subject.md"] }),
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md": OPEN_ARC,
  });
  const past = Date.now() - 60_000, future = Date.now() + 60_000;

  // The third argument is the STEP-ROW baseline. Editing an arc is not executing it: a sweep that set
  // the status line of five arcs made every one report as runnable work in the same turn, which is
  // five findings about arcs nobody touched the substance of. So a stale hash means the work moved,
  // a matching hash means only the record did, and an empty map means there is no baseline to judge by.
  const arcPath = join(root, ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md");
  const WORK_MOVED = { [arcPath]: "a-different-hash" };

  for (const [what, since, expected, baseline] of [
    ["an arc whose STEP ROWS moved this sitting, whatever its status says", past, 1, WORK_MOVED],
    ["the same arc when this sitting did not write it", future, 0, WORK_MOVED],
    ["no timestamp baseline — the first Stop of a workspace stays quiet", 0, 0, WORK_MOVED],
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
    const { createHash } = await import("node:crypto");
    const rows = (readFileSync(arcPath, "utf8").match(/^\|\s*\d+[a-z]?\s*\|.*$/gim) ?? []).join("\n");
    const same = { [arcPath]: createHash("sha256").update(rows).digest("hex").slice(0, 12) };
    const quiet = checkRunnable(root, past, same).length === 0;
    if (!quiet) failed += 1;
    console.log(`  ${quiet ? "PASS" : "FAIL"}  an arc whose RECORD moved but whose step rows did not is silent`);
  }

  // THE STATUS WORD STILL COUNTS where it appears, so nothing that worked before stops working —
  // and it must work with NO baseline, because it is a claim rather than something measured.
  n += 1;
  const claimed = checkRunnable(workspace("stop-runnable-claimed", {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html": page({ cards: "", names: ["N1-a-subject.md"] }),
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md": RUNNING,
  }), 0).length === 1;
  if (!claimed) failed += 1;
  console.log(`  ${claimed ? "PASS" : "FAIL"}  an arc that SAYS RUNNING still fires with no baseline`);

  // A LANDED ARC'S UNFINISHED ROWS ARE HISTORY. Editing one to add a log line must not report it.
  n += 1;
  const landed = checkRunnable(workspace("stop-runnable-landed", {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html": page({ cards: "", names: ["N1-a-subject.md"] }),
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-a-subject.md": RUNNING.replace("Status: **RUNNING**", "**Status: LANDED 2026-09-23**"),
  }), past).length === 0;
  if (!landed) failed += 1;
  console.log(`  ${landed ? "PASS" : "FAIL"}  a LANDED arc written this sitting is history, not work`);
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
  "silent");

console.log("\n=== stop — reply-shape");

one("a reply asking for a lettered choice with no options table",
  build("stop-reply-bad", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole",
             reply: "I recommend we do this. Say A and I will start, or say B to wait." });

one("the same choice, shown as a lettered table",
  build("stop-reply-good", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Q9 · which way\n\n**What** — the gate in stop.ts, one part checked or five.\n\n**Why** — what it costs to leave it: a half card passes.\n\n| | What it does | What it costs |\n| --- | --- | --- |\n| **A** | start now | the cycle |\n| **B** | wait | the delay |\n\nRecommended: A. Say A and I will start." });

one("a reply that merely mentions a letter",
  build("stop-reply-plain", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Appendix A of the chapter covers it. Nothing is open." });

// F17 — `[A-D]` under an `i` flag matched the English article `a`, so an ordinary sentence containing
// `choosing with a …` read as somebody naming option A. It fired on a reply that asked nothing.
one("an article after a choosing word is not an option",
  build("stop-reply-article", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "A caller sends an organization id of their own choosing with a sign-in, and it is ignored.",
              parity: false, why: F17 });

one("the other articles that used to fire",
  build("stop-reply-articles", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Pick a file, select a row, and choose a tier. Nothing is open.",
              parity: false, why: F17 });

// F18 — `option B` fired on a REFERENCE. Naming a superseded option in the past tense is not asking
// anybody to pick one, and the check's own contract says it never fires on a reply that merely
// mentions a letter. Bold is not a presenting marker: emphasis wraps a reference just as readily.
one("an option named in the past tense is a reference, not an ask",
  build("stop-reply-ref", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "It was **option B**, which F has now replaced. Nothing is open.",
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
  "silent", { reply: "Q256 · does the release go now\n\n**What** — spnutils 1.2.74, carrying N64 and N39 step 7.\n\n**Why** — what it costs to leave it: .spndevex has no history, which cost three status lines.\n\n| | Option | What it costs |\n| --- | --- | --- |\n| **A** | release now | two trains |\n| **B** | wait | open-ended |\n\nRecommended: A, because the wait is unbounded. Say A and I will release." });

// F19 — THE GATE REFUSED THE ONE REPLY SHAPE THE BOOK MAKES MANDATORY, on its first day. A handover
// block names the cards a session leaves open, and naming one means writing its recommendation —
// "the recommendation is D then A" — inside a fence, in a reply whose whole purpose is to stop. The
// check read that as putting a decision. A fenced block is a quotation, not an ask.
one("a handover block naming an open card's recommendation is not an ask",
  build("stop-reply-handover", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "This session is retiring.\n\n```text\nContinue workstream `008-x`, arc `N69`, step 1.\nOpen: `Q259` — how much of the book the plugins must restate; the recommendation is D then A.\n```\n\nBoth releases are done." });

// The other half, and it is what stops the fix being a hole: an ask in PROSE, with a fence elsewhere
// in the reply, still fires.
one("an ask outside the fence still fires, fence or no fence",
  build("stop-reply-fence-ask", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "the card is not whole",
             reply: "Here is the state.\n\n```text\nworkstream: 008\n```\n\nTwo ways: option A now, or wait." });

one("a reply that asks nothing is still silent, whatever parts it lacks",
  build("stop-reply-noask", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Landed and committed. Nothing is open." });

// F20 — A HANDOVER OVER AN OPEN CARD. The developer caught this twice in one session: the agent
// offered a new window with two cards standing. A card's answer can change which arc runs next and
// what the next window reads first, so a handover written over one is a brief that assumed an
// answer nobody gave.
one("a handover offered while a card is open is refused, and the card is named",
  build("stop-handover-open-card", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "warns", { says: "Answer first, then hand over",
             reply: "Pick this up in a new window.\n```\nworkstream: 001\narc and step: N1 step 1\nmodel: Opus 5\nread first: the page\nstate: clean\ndone when: it lands\ndo not touch: closed\nopen: none\n```" });

console.log("\n=== the handover check — what counts as saying a window is needed");
{
  // THIS CHECK HAD NO TESTS AT ALL, which is how it shipped triggering on the bare word `handover`
  // anywhere in a reply. Answering a question ABOUT the open cards — "the handover marks it as not
  // mine to decide" — demanded a handover block, twice in a row. An unverified gate is the thing
  // this arc keeps finding, so the narrowed trigger is asserted in both directions: what must fire,
  // and what must stay quiet.
  const { checkHandover, passingOn } = await import("../src/scripts/events/stop.ts");
  const ROOT = workspace("stop-handover-wiring");
  const BLOCK = ["```", "workstream: 008", "arc and step: N13 step 4", "model: Opus 5",
    "read first: the arc", "state: green", "done when: it lands", "do not touch: Q115",
    "open: Q138", "```"].join("\n");
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

  const short = checkHandover("Pick this up in a new window.\n```\nworkstream: 008\narc and step: N13\n```", ROOT);
  const named = short.length === 1 && /model/.test(short[0].message) && /open/.test(short[0].message);
  if (!named) failed += 1;
  console.log(`  ${named ? "PASS" : "FAIL"}  a short block is told which fields it is missing`);
}

console.log("\n=== reply-shape — a sentence that reports an answer is not asking for one");
{
  // It fired on a reply that had just told the developer their ALREADY ANSWERED card turned out to
  // match option B — a sentence ABOUT a decision they had made, demanded back as a decision card.
  // COUNTING options was the wrong cure, and the suite caught that: "Two ways: option A now, or
  // wait" is a real offer with one letter in it. What separates the two is the FRAME, so a sentence
  // saying the thing was answered, decided or chosen is set aside and the rest is read for an ask.
  const { checkReplyShape } = await import("../src/scripts/events/stop.ts");
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

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
