import { PLUGIN } from "../../../helpers/harness.mjs";
// `stop` — the Stop hook's checks. An arc is read from its data (`arcs/N<nnn>/state.json`, `log.jsonl`)
// and the cards from `questions.jsonl`, so every case that is about an arc builds one kept as data.
import { execFileSync } from "node:child_process";
import { BASE, bindOpen, wroteArcs, workspace } from "../../../helpers/fixture.mjs";

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { CARD as DATA_CARD, PREVIEW, cli, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";
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

/** One workspace holding one open workstream and its page, for the checks that read a reply against its cards. */
function build(name, { pageOpts = {} } = {}) {
  return workspace(name, { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/a-subject-approach.html`]: page(pageOpts) });
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

const F17 = "the Python matches the article `a` as option A; the port is case-sensitive on the letter";
const F18 = "the Python fires on `option B` used as a reference; the port needs it to open a clause";

console.log("\n=== stop — an arc is read from its data: state.json, log.jsonl and questions.jsonl (030 N004 row 17)");
// EVERY CASE HERE BUILDS A WORKSTREAM KEPT AS DATA (`dataWorkspace`: `031-probe`, arc N001 DECIDED, row 2
// waiting on row 1), whole, so `workstream state check` finds nothing until a case breaks it. A write is
// made the way the agent makes it: a `workstream` command, with PreToolUse first recording it in the
// window's note, so the case proves the window's record and the Stop hook's reading together.
{
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const PRE = `${HOOKS}/src/scripts/events/pretooluse.ts`;
  const { checkRunnable, ordersOut, readyRowsOf, runningRows, rowsMark, stepsMark, workRuns } =
    await import("../../../../src/scripts/events/stop.ts");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`); };
  const stopAt = (root, session, reply = "done", extra = {}) => {
    bindOpen(root, session);
    return run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: reply, ...extra }, root);
  };
  // The agent's call: PreToolUse sees the command, then the command runs.
  const command = (root, session, args) => {
    run("node", [PRE], { cwd: root, session_id: session, tool_name: "Bash", tool_input: { command: `spn-devex ${args.join(" ")}` } }, root);
    return cli(root, args);
  };
  const raise = (root) => {
    writeFileSync(join(root, "card.json"), JSON.stringify(DATA_CARD));
    return cli(root, ["workstream", "question", "raise", "031/N001", "--file", join(root, "card.json")]);
  };
  const arcAt = (ws) => join(ws, "arcs", "N001");
  const editData = (ws, change) => {
    const file = join(arcAt(ws), "state.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    change(data);
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  };

  console.log("\n  --- runnable: the arc this window wrote, its rows, and the cards in questions.jsonl");
  {
    const { root } = await dataWorkspace("d17-runnable");
    stopAt(root, "d17-r");                                    // the session's first Stop: its baseline
    command(root, "d17-r", ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
    const out = stopAt(root, "d17-r");
    check("known-bad: a row landed by this window's `row write`, the next row ready and no card open, is runnable work",
      /\[runnable\].*stopped with runnable work/.test(out) && out.includes("row 2 — build it") && out.includes("031-probe/arcs/N001"), out);
  }
  {
    const { root } = await dataWorkspace("d17-runnable-other");
    stopAt(root, "d17-other");
    cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);   // another window's command
    check("the same write by another window, which this window's note does not record, is not its work",
      !/\[runnable\]/.test(stopAt(root, "d17-other")));
  }
  {
    const { root } = await dataWorkspace("d17-runnable-header");
    stopAt(root, "d17-header");
    command(root, "d17-header", ["workstream", "row", "write", "031/N001", "--goal", "the probe is answered, in full"]);
    check("a header write that moves no row is writing about the arc, not executing it", !/\[runnable\]/.test(stopAt(root, "d17-header")));
  }
  {
    const { root } = await dataWorkspace("d17-runnable-first");
    command(root, "d17-first", ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
    check("a session's first Stop has no baseline of its own, so it stays quiet", !/\[runnable\]/.test(stopAt(root, "d17-first")));
  }
  {
    const { root } = await dataWorkspace("d17-runnable-card");
    stopAt(root, "d17-card");
    raise(root);
    command(root, "d17-card", ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
    check("a card open in questions.jsonl holds the turn, so the rows are not called runnable", !/\[runnable\]/.test(stopAt(root, "d17-card")));
  }
  {
    const { root, ws } = await dataWorkspace("d17-ready-on-card");
    editData(ws, (data) => { data.rows[0].state = "landed"; data.rows[1].blockedBy = ["q1"]; });
    const open = [{ id: "q1", state: "open" }], answered = [{ id: "q1", state: "answered" }];
    check("a row waiting on a card that is open is not ready (RD.DEVEX.WORKSPACE.188)", readyRowsOf(arcAt(ws), open).length === 0, readyRowsOf(arcAt(ws), open));
    check("known-bad: once the card is answered the row is ready, by its id and its What",
      JSON.stringify(readyRowsOf(arcAt(ws), answered)) === JSON.stringify(["row 2 — build it"]), readyRowsOf(arcAt(ws), answered));
  }
  {
    const { root, ws } = await dataWorkspace("d17-running-row");
    cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
    const arc = arcAt(ws);
    const found = checkRunnable(root, Date.now() - 60_000, { [arc]: "a-different-mark" }, new Set([arc]), everyone(root));
    check("known-bad: a running row is named with how long it has run (RD.DEVEX.WORKSPACE.184)",
      found.length === 1 && /has a row running: row 1 — write the book \(running for (?:under a minute|\d+ min)\)/.test(found[0].message), JSON.stringify(found));
    check("and it is never called runnable", found.every((warning) => !/stopped with runnable work/.test(warning.message)));
    const orders = join(ws, "notes", "N001", "orders");
    mkdirSync(orders, { recursive: true });
    writeFileSync(join(orders, "01-the-book.md"), "# Order 01 — the book\n");
    check("a running row whose order is out with an agent is not named", [...ordersOut(arc)].join(",") === "1" && runningRows(arc).length === 0, [...ordersOut(arc)].join(","));
    writeFileSync(join(orders, "01-the-book.ledger.md"), "# the child's running log\n");
    check("a ledger beside the order is no order and no report", [...ordersOut(arc)].join(",") === "1");
    writeFileSync(join(orders, "01-the-book.report.md"), "---\nrow: \"1\"\noutcome: landed\n---\n");
    check("known-bad: once its report is beside the order, the row is named again", ordersOut(arc).size === 0 && runningRows(arc).length === 1);
    check("work runs while a row of this window's arcs is running", workRuns(root, everyone(root)));
    check("a running row in a workstream that is not this window's is not this window's work", !workRuns(root, new Set()));
    editData(ws, (data) => { data.status = "DROPPED"; data.reason = "not wanted"; });
    check("a row left running in an arc that was dropped is history, not work that runs", !workRuns(root, everyone(root)));
  }
  {
    const { root, ws } = await dataWorkspace("d17-marks");
    const before = rowsMark(JSON.parse(readFileSync(join(arcAt(ws), "state.json"), "utf8")));
    const mark = stepsMark(root, everyone(root));
    cli(root, ["workstream", "row", "write", "031/N001", "--goal", "a goal written again"]);
    check("the rows mark does not move on a header write", stepsMark(root, everyone(root)) === mark);
    cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
    check("known-bad: it moves when a row's state moves",
      stepsMark(root, everyone(root)) !== mark && rowsMark(JSON.parse(readFileSync(join(arcAt(ws), "state.json"), "utf8"))) !== before);
  }

  console.log("\n  --- a wait: a decided arc held by the developer's words has nothing runnable (RD.DEVEX.WORKSPACE.311)");
  {
    const { root, ws } = await dataWorkspace("d17-wait");
    editData(ws, (data) => { data.wait = "the developer: approved, but wait"; });
    check("a decided arc holding a wait has no ready row", readyRowsOf(arcAt(ws), []).length === 0, readyRowsOf(arcAt(ws), []));
    editData(ws, (data) => { data.wait = null; });
    check("known-bad: once the wait is cleared its first row is ready", readyRowsOf(arcAt(ws), []).length === 1, readyRowsOf(arcAt(ws), []));
  }

  console.log("\n  --- notes and carried: the lines this window's write added to the arc's log.jsonl");
  {
    const answered = async (name, { shown = true, movePreview = false } = {}) => {
      const { root, ws } = await dataWorkspace(name);
      raise(root);
      if (shown) cli(root, ["workstream", "question", "show", "q1", "--in", "notes/N001/preview.html"]);
      stopAt(root, name);
      command(root, name, ["workstream", "question", "answer", "q1", "--key", "A", "--words", "the first way"]);
      if (movePreview) writeFileSync(join(ws, "notes", "N001", "preview.html"), readFileSync(join(ws, "notes", "N001", "preview.html"), "utf8") + "<p>the first way</p>\n");
      return stopAt(root, name, NEEDS + "q1 answered.");
    };
    const red = await answered("d17-notes-red");
    check("known-bad: an answer to a card the preview shows, logged while the preview did not move, is named once as a note, with the card and the preview",
      /\[notes\] .*A note, not a refusal/.test(red) && red.includes("Q1 on `notes/N001/preview.html`") && red.includes("RD.DEVEX.WORKSPACE.193"), red);
    check("the card leaving the preview's Open, which the command writes, is not the preview brought current", /\[notes\]/.test(red), red);
    check("the same answer with the preview moved in the same turn is silent", !/\[notes\]/.test(await answered("d17-notes-green", { movePreview: true })));
    check("an answer to a card no preview shows owes the preview nothing", !/\[notes\]/.test(await answered("d17-notes-unshown", { shown: false })));
  }
  {
    const { root } = await dataWorkspace("d17-notes-plain");
    stopAt(root, "d17-plain");
    command(root, "d17-plain", ["workstream", "row", "write", "031/N001", "--note", "the book chapter is read"]);
    check("a log line that records no answer owes the notes nothing", !/\[notes\]/.test(stopAt(root, "d17-plain")));
    command(root, "d17-plain", ["workstream", "row", "write", "031/N001", "--note", "a review point: the probe answers in one line"]);
    check("a review point in a log line names no card a preview shows, so it owes the preview nothing", !/\[notes\]/.test(stopAt(root, "d17-plain")));
    command(root, "d17-plain", ["workstream", "row", "write", "031/N001", "--wait", "waits on N002", "--note", "(the developer: hold it)"]);
    check("a status line carrying the developer's words is a move, not an answer", !/\[notes\]/.test(stopAt(root, "d17-plain")));
  }
  {
    const { root } = await dataWorkspace("d17-carried");
    cli(root, ["workstream", "row", "write", "031/N002", "--title", "the next arc", "--subject", "next", "--goal", "the next outcome", "--note", "the developer: open it"]);
    stopAt(root, "d17-carried");
    command(root, "d17-carried", ["workstream", "row", "write", "031/N002", "--note", "two review points are carried to row 2"]);
    check("known-bad: a PROPOSED arc whose log carries a point to a later row of itself is named", /\[carried\]/.test(stopAt(root, "d17-carried")));
    command(root, "d17-carried", ["workstream", "row", "write", "031/N001", "--note", "two review points are carried to row 2"]);
    check("a DECIDED arc carrying a point to a later row is not", !/\[carried\]/.test(stopAt(root, "d17-carried")));
  }

  console.log("\n  --- what the retired checks guarded is said by the state check, which the hook runs");
  {
    const { root, ws } = await dataWorkspace("d17-unnamed");
    const page = join(ws, "approach.html");
    writeFileSync(page, readFileSync(page, "utf8").replace(/\s*<tr id="N001"[^\n]*<\/tr>/, ""));
    const out = stopAt(root, "d17-unnamed");
    check("an arc the page's Cycles does not carry is named by [state]", /\[state\].*N001 has no row in Cycles/.test(out), out);
  }
  {
    const { root, ws } = await dataWorkspace("d17-pageless");
    rmSync(join(ws, "approach.html"));
    const out = stopAt(root, "d17-pageless");
    check("a workstream with an arc and no page is named by [state]", /\[state\].*N001 has no approach page to stand on/.test(out), out);
  }
  {
    const { root, ws } = await dataWorkspace("d17-landed");
    editData(ws, (data) => { data.status = "LANDED"; });
    const out = stopAt(root, "d17-landed");
    check("a stored LANDED arc with a step not landed is named by [state]: a landed arc is never reopened",
      /\[state\].*N001 is LANDED and step 1 is waiting — a landed arc is never reopened.*RD\.DEVEX\.WORKSPACE\.261/.test(out), out);
  }
  {
    const { root, ws } = await dataWorkspace("d17-card-off-page");
    raise(root);
    const page = join(ws, "approach.html");
    writeFileSync(page, readFileSync(page, "utf8").replace(/<div class="sds-open">[\s\S]*?<div class="sds-recommended">[^\n]*\n\s*<\/div>/, ""));
    const out = stopAt(root, "d17-card-off-page", NEEDS + "done");
    check("an open record whose card is not on the page is named by [state]", /\[state\].*q1 is open and its card is not on/.test(out), out);
  }
}

console.log("\n=== stop — untouched");

one("a page that names its arc, with an open card, and every step landed",
  build("stop-clean", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "done" });

console.log("\n=== stop — reply-shape");

one("a reply asking for a lettered choice with no options table",
  build("stop-reply-bad", { pageOpts: { cards: CARD } }),
  "warns", { says: "the card is not whole",
             reply: "I recommend we do this. Say A and I will start, or say B to wait." });

one("the same choice, shown as a lettered table",
  build("stop-reply-good", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Q9 · which way\n\n**What** — the gate in stop.ts, one part checked or five.\n\n**Why** — what it costs to leave it: a half card passes.\n\n| | What it does | What it costs |\n| --- | --- | --- |\n| **A** | start now | the cycle |\n| **B** | wait | the delay |\n\nRecommended: A. Say A and I will start." });

one("a reply that merely mentions a letter",
  build("stop-reply-plain", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Appendix A of the chapter covers it. Nothing else is open." });

// F17 — `[A-D]` under an `i` flag matched the English article `a`, so an ordinary sentence containing
// `choosing with a …` read as somebody naming option A. It fired on a reply that asked nothing.
one("an article after a choosing word is not an option",
  build("stop-reply-article", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "A caller sends an organization id of their own choosing with a sign-in, and it is ignored.",
              parity: false, why: F17 });

one("the other articles that used to fire",
  build("stop-reply-articles", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Pick a file, select a row, and choose a tier. Nothing else is open.",
              parity: false, why: F17 });

// F18 — `option B` fired on a REFERENCE. Naming a superseded option in the past tense is not asking
// anybody to pick one, and the check's own contract says it never fires on a reply that merely
// mentions a letter. Bold is not a presenting marker: emphasis wraps a reference just as readily.
one("an option named in the past tense is a reference, not an ask",
  build("stop-reply-ref", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "It was **option B**, which F has now replaced. Nothing else is open.",
              parity: false, why: F18 });

one("an option PRESENTED still asks",
  build("stop-reply-present", { pageOpts: { cards: CARD } }),
  "warns", { says: "the card is not whole", reply: "Two ways: option A now, or wait." });

// `N68` — THE CARD IS SIX PARTS AND THE GATE CHECKED ONE. These four cases are the replies `008`
// actually sent on 2026-09-24: each was green, and each was missing a part the grammar requires.
// The developer caught all of them, which is the failure this arc exists to stop repeating.
one("a card with a table but no What and no Why — what 008 sent twice",
  build("stop-reply-nowhat", { pageOpts: { cards: CARD } }),
  "warns", { says: "**What**",
             reply: "Q256 · does the release go now\n\n| | Option | What it costs |\n| --- | --- | --- |\n| **A** | release now | two trains |\n| **B** | wait | open-ended |\n\nMy recommendation is A." });

one("a card cut to one sentence — the turn after",
  build("stop-reply-shrunk", { pageOpts: { cards: CARD } }),
  "warns", { says: "the card is not whole",
             reply: "One card is open and it is yours: Q256 — release 1.2.74 now, or wait. Say A or B." });

one("a card with every part is silent",
  build("stop-reply-whole", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Q256 · does the release go now\n\n**What** — spnutils 1.2.74, carrying N64 and N39 step 7.\n\n**Why** — what it costs to leave it: .spndevex has no history, which cost three status lines.\n\n| | Option | What it costs |\n| --- | --- | --- |\n| **A** | release now | two trains |\n| **B** | wait | open-ended |\n\nRecommended: A, because the wait is unbounded. Say A and I will release." });

// F19 — THE GATE REFUSED THE ONE REPLY SHAPE THE BOOK MAKES MANDATORY, on its first day. A handover
// block names the cards a session leaves open, and naming one means writing its recommendation —
// "the recommendation is D then A" — inside a fence, in a reply whose whole purpose is to stop. The
// check read that as putting a decision. A fenced block is a quotation, not an ask.
one("a handover block naming an open card's recommendation is not an ask",
  build("stop-reply-handover", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "This session is retiring.\n\n```text\ncontinue:     workstream `008-x`, arc `N69`, step 1\nopen:         `Q259` — how much of the book the plugins must restate; the recommendation is D then A.\n```\n\nBoth releases are done." });

// The other half, and it is what stops the fix being a hole: an ask in PROSE, with a fence elsewhere
// in the reply, still fires.
one("an ask outside the fence still fires, fence or no fence",
  build("stop-reply-fence-ask", { pageOpts: { cards: CARD } }),
  "warns", { says: "the card is not whole",
             reply: "Here is the state.\n\n```text\nworkstream: 008\n```\n\nTwo ways: option A now, or wait." });

one("a reply that asks nothing is still silent, whatever parts it lacks",
  build("stop-reply-noask", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Landed and committed. Nothing else is open." });

// F20 — A HANDOVER OVER AN OPEN CARD. The developer caught this twice in one session: the agent
// offered a new window with two cards open and neither one named. The next window must know the
// question is there. CHANGED ON PURPOSE (RD.DEVEX.WORKSPACE.189): the card is named in one line on the
// block's `open:` line, and the check no longer asks for it in full before any handover.
one("a handover whose block says `open: none` while a card is open is told to name the card in one line",
  build("stop-handover-open-card", { pageOpts: { cards: CARD } }),
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
        `<div class="sds-recommended"><b>Decision:</b> &mdash;</div></div></section>`,
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
    "read first:   `/w/approach.html#N116` (fields, and row 6),",
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
    "Read first: `/w/approach.html#N116` (fields, and row 6), `/w/notes/N116/plan.md`.",
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
  const { checkReplyShape } = await import("../../../../src/scripts/events/stop.ts");
  const PROGRESS = "Row 6d landed: the reply check reads the arcs' rows.";
  const RUNS = true;
  const of = (check) => (reply, open, raised, running) =>
    checkReplyShape(reply, open, raised, new Map(), running).filter((warning) => warning.check === check);
  const needsYou = of("needs-you"), shape = of("reply-shape");
  const LINE = "Q401 · which way does the drawer go — recommendation is B — on the approach page.";
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
  // A whole workstream kept as data, its card raised in questions.jsonl and row 1 running.
  const running = async (name) => {
    const { root } = await dataWorkspace(name);
    writeFileSync(join(root, "card.json"), JSON.stringify(DATA_CARD));
    cli(root, ["workstream", "question", "raise", "031/N001", "--file", join(root, "card.json")]);
    cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
    return root;
  };
  one("a progress reply over an older card, while a row is running, is silent",
    await running("m14-hook-progress"), "silent", { reply: "Row 1 landed.", parity: false, why: "Q49 B" });
  one("one line for an older card that names its recommended letter is silent",
    build("m14-hook-letter", { pageOpts: { cards: CARD } }),
    "silent", { session: "m14-letter", edit: () => {},
                reply: "## Needs you\n\nQ1 · a real question — recommendation is A — on the approach page.\n\n## Progress\n\nRow 1 landed.",
                parity: false, why: "Q49 B" });
}

console.log("\n=== stop — the hook reads the open cards off the page for Needs you");

one("known-bad: a reply that waits over an open card (no row in progress) and opens with progress",
  build("m13-needs-you-bad", { pageOpts: { cards: CARD } }),
  "warns", { says: "does not open with **Needs you**", reply: "Row 6d landed.\n\nQ1 is open on the page.", parity: false, why: "a new check" });

one("the same reply opening with Needs you is silent",
  build("m13-needs-you-good", { pageOpts: { cards: CARD } }),
  "silent", { reply: NEEDS + "Row 6d landed.", parity: false, why: "a new check" });

one("a reply with no card open is not read for Needs you",
  build("m13-needs-you-none", { pageOpts: { cards: "" } }),
  "silent", { reply: "Row 6d landed.", parity: false, why: "a new check" });

one("a card carrying its decision is not open, so the reply is not read for Needs you",
  build("m13-needs-you-answered", { pageOpts: { cards: CARD.replace("<b>Decision:</b> &mdash;", "<b>Decision:</b> A, 2026-09-29.") } }),
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
    writeFileSync(pagePath, page({ cards: CARD }), "utf8");
  };
  const fresh = (name) => build(name, { pageOpts: { cards: "" } });
  one("2m: a card that appeared this turn, named in one line only, warns",
    fresh("m2m-raised-line"), "warns", { says: "in full once", session: "m2m-a", edit: raise, reply: ONE_LINE_Q1, parity: false, why: "2m" });
  one("2m: a card that appeared this turn, put in full at the top, is silent",
    fresh("m2m-raised-full"), "silent", { session: "m2m-b", edit: raise, reply: FULL_Q1, parity: false, why: "2m" });
  const already = build("m2m-older", { pageOpts: { cards: CARD } });
  one("2m: a card already open at the last Stop is accepted in one line",
    already, "silent", { session: "m2m-c", edit: () => {}, reply: ONE_LINE_Q1, parity: false, why: "2m" });
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
    ["a builder's welcome, the partner sentence inside its 👥 line, counts", missingWelcome(welcome("Dhruv", false, true).join("\n")).length, 0],
    ["the same words without the markdown emphasis count", missingWelcome(plainText).length, 0],
    ["known-bad: a pasted handover answered with no welcome", missingWelcome("I'll start by reading the arc file.").join(","), "the heading,the italic line,the 🤖 line,the 🧭 line,the 👥 line"],
    ["known-bad: a question answered under the heading alone", missingWelcome(headingOnly).length, 4],
    ["known-bad: the 👥 line cut at its last sentence, emoji and all", missingWelcome(cut).join(","), "the 👥 line"],
    ["no first turn read (no transcript) is silent", checkWelcome("").length, 0],
    ["a cut welcome warns once, naming what is missing", checkWelcome(cut).map((w) => w.check + ":" + w.message.includes("the 👥 line")).join(), "welcome:true"],
    // 025 N020: asked for the whole welcome again, the agent showed a short one and then a long one.
    ["N020: the finding asks for one line and never a second welcome", checkWelcome(cut).map((w) =>
      w.message.includes("Do not print it again") && w.message.includes("Say once, in one line, that the first reply missed it")).join(), "true"],
    ["N020 known-bad: the finding no longer asks for the welcome in full", checkWelcome(cut).some((w) => /Say it in full/.test(w.message)), false],
    ["an unreadable transcript reads as nothing", firstTurnText("/nonexistent/transcript.jsonl"), ""],
  ]) { n += 1; const ok = got === expected; if (!ok) failed += 1;
       console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : ` — got ${got}, expected ${expected}`}`); }
}

console.log("\n=== welcome — the hook reads the first turn from the transcript, and only on the first Stop");
{
  const prompt = (text) => JSON.stringify({ type: "user", message: { role: "user", content: text } });
  const lines = (texts, prompts = 1) => [...Array.from({ length: prompts }, (_, at) => prompt(`prompt ${at + 1}`)),
    ...texts.map((text) => JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } }))].join("\n") + "\n";
  const { welcome } = await import("../../../../src/scripts/events/orientation.ts");
  const root = build("f1-welcome", { pageOpts: {} });
  const bad = join(root, "bad.jsonl"), good = join(root, "good.jsonl");
  writeFileSync(bad, lines(["I'll start by reading the arc file.", "Done."]), "utf8");
  writeFileSync(good, lines([welcome("Dhruv", false).join("\n") + "\n\n7 repos", "Done."]), "utf8");
  one("known-bad: a first turn with no welcome warns", root, "warns",
    { says: "[welcome]", session: "f1-bad", extra: { transcript_path: bad }, parity: false, why: "a new check" });
  one("a first turn that opens with the welcome is silent about it", root, "silent",
    { session: "f1-good", extra: { transcript_path: good }, parity: false, why: "a new check" });
  one("the second Stop of the same session is not read for the welcome", root, "silent",
    { session: "f1-bad", extra: { transcript_path: bad }, parity: false, why: "a new check" });
  // N019 row 7: THE FIRST TURN IS READ FROM THE TRANSCRIPT, AND A CHILD NEVER TOUCHES THE WINDOW'S BASELINE.
  const later = join(root, "later.jsonl");
  writeFileSync(later, lines(["I'll start by reading the arc file.", "Done."], 3), "utf8");
  one("a later turn (three prompts) with no baseline raises no welcome", root, "silent",
    { session: "f1-later", extra: { transcript_path: later }, parity: false, why: "a new check" });
  const baselineFile = (sid) => join(root, ".spndevex", ".debug", "stop", "sessions", `${sid}.json`);
  const marked = JSON.stringify({ at: 1, steps: { "arc": "x" }, fired: [], cards: [], arcs: {}, ownCopy: [] });
  mkdirSync(join(root, ".spndevex", ".debug", "stop", "sessions"), { recursive: true });
  writeFileSync(baselineFile("f1-window"), marked, "utf8");
  n += 1;
  bindOpen(root, "f1-window");
  run("node", [`${HOOKS}/src/scripts/events/stop.ts`],
    { cwd: root, last_assistant_message: "done", session_id: "f1-window", agent_id: "child-1", transcript_path: bad }, root);
  const kept = readFileSync(baselineFile("f1-window"), "utf8") === marked && existsSync(baselineFile("f1-window").replace(".json", "_child-1.json"));
  if (!kept) failed += 1;
  console.log(`  ${kept ? "PASS" : "FAIL"}  a child's Stop leaves the window's baseline as it was and writes its own`);
}

console.log("\n=== stop — a check speaks once in a turn, and only about this session's work (RD.DEVEX.WORKSPACE.198)");
{
  const { passingOn } = await import("../../../../src/scripts/events/stop.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const A = `.spndevex/${WORKSTREAMS}/open/001-a-subject`, B = `.spndevex/${WORKSTREAMS}/open/002-b-subject`;
  // Two open workstreams. A is whole: a page, and no arc. B keeps an arc as data that its page does not
  // carry, which `workstream state check` names, and an open card.
  const ARC_DATA = `${JSON.stringify({ schemaVersion: 2, arc: "N001", subject: "b-subject", title: "the b arc", goal: "it lands",
    status: "DECIDED", reason: null, preview: "preview.html", rows: [{ id: "1", parent: "N001", title: "a thing", kind: "change", state: "waiting" }] })}\n`;
  const two = (name) => workspace(name, {
    [`${A}/approach.html`]: page({}),
    [`${B}/approach.html`]: page({ cards: CARD }),
    [`${B}/arcs/N001/state.json`]: ARC_DATA,
  });
  // THE WINDOW'S NOTE IS THE ONLY RECORD OF WHICH WORKSTREAMS IT WORKS ON (RD.DEVEX.WORKSPACE.236): a write
  // whose path is inside the folder binds it, as PreToolUse records it.
  const wroteTo = (root, session, path) => recordWrites(root, session, root, [join(root, path)]);
  const check = (label, ok) => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`); };

  // The window wrote to A only, so B's arc and B's open card are another window's.
  {
    const root = two("s198-scope-a");
    wroteTo(root, "wrote-a", `${A}/approach.html`);
    const out = run("node", [HOOK], { cwd: root, session_id: "wrote-a", last_assistant_message: "done" }, root);
    check("a window that wrote to one workstream is not held for another's arc its page does not carry", !/\[state\]/.test(out));
    check("and is not asked for another workstream's open card", !/needs-you/.test(out));
  }
  // KNOWN-BAD: the window that wrote to B hears about B, and the message names B.
  {
    const root = two("s198-scope-b");
    wroteTo(root, "wrote-b", `${B}/arcs/N001/state.json`);
    const out = run("node", [HOOK], { cwd: root, session_id: "wrote-b", last_assistant_message: "done" }, root);
    check("known-bad: the window that wrote to that workstream is told about its arc", /\[state\]/.test(out));
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
    wroteTo(root, "kept", `${B}/arcs/N001/state.json`);
    run("node", [HOOK], { cwd: root, session_id: "kept", last_assistant_message: "done" }, root);
    const later = run("node", [HOOK], { cwd: root, session_id: "kept", last_assistant_message: "done" }, root);
    check("a workstream the window wrote to in an earlier turn is still its own", /\[state\]/.test(later));
  }
  // AN OLD BASELINE THAT BOUND A WINDOW BY A NAME FOUND IN TEXT IS HARMLESS: its list is never read.
  {
    const root = two("s198-old-baseline");
    wroteTo(root, "old", `${A}/approach.html`);
    const dir = join(root, ".spndevex", ".debug", "stop", "sessions");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "old.json"), JSON.stringify({ at: 1, steps: {}, workstreams: ["001-a-subject", "002-b-subject"], cards: [] }));
    const out = run("node", [HOOK], { cwd: root, session_id: "old", last_assistant_message: "done" }, root);
    check("an old baseline listing another workstream does not make the window answer for it", !/\[state\]/.test(out) && !/needs-you/.test(out), out.slice(0, 200));
  }
  // TWO WINDOWS, TWO WORKSTREAMS: each hears only its own. TWO WINDOWS, ONE WORKSTREAM: both hear it.
  {
    const root = two("s198-two-windows");
    wroteTo(root, "win-a", `${A}/approach.html`);
    wroteTo(root, "win-b", `${B}/approach.html`);
    wroteTo(root, "win-b2", `${B}/arcs/N001/state.json`);
    const said = (session) => run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: "done" }, root);
    const outA = said("win-a"), outB = said("win-b"), outB2 = said("win-b2");
    check("two windows on two workstreams: the first hears nothing of the second's", !/002-b-subject|\[state\]|needs-you/.test(outA), outA.slice(0, 200));
    check("and the second hears its own arc and card", /\[state\]/.test(outB) && /needs-you/.test(outB));
    check("two windows on one workstream both hear it", /\[state\]/.test(outB2) && /needs-you/.test(outB2));
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
    const first = /\[state\]/.test(hook({}));
    const second = /\[state\]/.test(hook({ stop_hook_active: true }));
    const third = /\[state\]/.test(hook({ stop_hook_active: true }));
    const nextTurn = /\[state\]/.test(hook({}));
    check("the first reply is told about the arc its page does not carry", first);
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

console.log("\n=== runnable — a running row whose order is out with an agent is not reported (MKT.HOOKS.30)");
{
  const { checkRunnable, ordersOut } = await import("../../../../src/scripts/events/stop.ts");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`); };
  const WS = `.spndevex/${WORKSTREAMS}/open/001-a-subject`;
  // Arc N003, RUNNING: row 1 landed, row 2 running since its log line.
  const RUNNING_ARC = { schemaVersion: 2, arc: "N003", subject: "a-subject", title: "a subject", goal: "it is built", status: "DECIDED", reason: null,
    preview: "preview.html", rows: [
      { id: "1", parent: "N003", title: "the chapter", kind: "change", state: "landed" },
      { id: "2", parent: "N003", title: "the split check", kind: "change", state: "running" }] };
  const build = (name, orders) => {
    const root = workspace(name, {
      [`${WS}/approach.html`]: page({ cards: "" }),
      [`${WS}/arcs/N003/state.json`]: `${JSON.stringify(RUNNING_ARC, null, 2)}\n`,
      [`${WS}/arcs/N003/log.jsonl`]: `${JSON.stringify({ at: "2026-09-29T14:32+05:30", kind: "running", row: "2", note: "waiting → running" })}\n`,
      ...Object.fromEntries(Object.entries(orders).map(([file, text]) => [`${WS}/notes/N003/orders/${file}`, text])),
    });
    const arc = join(root, WS, "arcs", "N003");
    return { arc, found: checkRunnable(root, Date.now() - 60_000, { [arc]: "a-different-mark" }, new Set([arc]), everyone(root)) };
  };
  const ORDER = "# Order 02 — N003 row 2: the split check\n\nBuild the check.\n";

  const out = build("n006-stop-order-out", { "02-the-split-check.md": ORDER });
  check("[MKT.HOOKS.30] an order file for the row with no report beside it is an order that is out", [...ordersOut(out.arc)].join(",") === "2", [...ordersOut(out.arc)].join(","));
  check("[MKT.HOOKS.30] the running row is not reported while its order is out", out.found.length === 0, JSON.stringify(out.found));

  // KNOWN-BAD, each way round: the report is back, the order is for another row, and there is no order at all.
  const back = build("n006-stop-order-back", { "02-the-split-check.md": ORDER, "02-the-split-check.report.md": "---\nrow: \"2\"\n---\n" });
  check("[MKT.HOOKS.30] known-bad: once the report is beside the order, the row is named with how long it has run",
    back.found.length === 1 && /has a row running/.test(back.found[0].message) && /row 2 — the split check \(running for \d+ d/.test(back.found[0].message), JSON.stringify(back.found));
  const other = build("n006-stop-order-other", { "05-the-release.md": "# Order 05 — N003 row 5: the release\n" });
  check("[MKT.HOOKS.30] known-bad: an order that is out for another row does not quiet this one", other.found.length === 1, JSON.stringify(other.found));
  const none = build("n006-stop-order-none", {});
  check("[MKT.HOOKS.30] known-bad: with no order file the row is named", none.found.length === 1 && [...ordersOut(none.arc)].length === 0);
  check("[MKT.HOOKS.30] and it is still never called runnable",
    [back, other, none].every((one) => one.found.every((warning) => !/stopped with runnable work/.test(warning.message))));

  // Where the order's heading names no row, the number that opens its file name is the row.
  const numbered = build("n006-stop-order-numbered", { "02a-the-split-check.md": "# The split check, first half\n" });
  check("[MKT.HOOKS.30] an order whose heading names no row is read by the number that opens its file name",
    [...ordersOut(numbered.arc)].join(",") === "2" && numbered.found.length === 0, JSON.stringify(numbered.found));
  // One order that carries several rows names them all, as a list or as a range.
  const several = build("n010-stop-order-several", { "15-three-rows.md": "# Order 15 — N003 rows 1, 2 and 4: three rows\n" });
  check("[MKT.HOOKS.30] an order whose heading names several rows is out for each of them",
    [...ordersOut(several.arc)].sort().join(",") === "1,2,4" && several.found.length === 0, [...ordersOut(several.arc)].join(","));
  const ranged = build("n010-stop-order-ranged", { "15-a-range.md": "# Order 15 — N003 rows 0 to 2: a range\n" });
  check("[MKT.HOOKS.30] `rows 0 to 2` is rows 0, 1 and 2", [...ordersOut(ranged.arc)].sort().join(",") === "0,1,2" && ranged.found.length === 0,
    [...ordersOut(ranged.arc)].join(","));
  // Two orders for one row: the row is out until both reports are back. The first report carries the
  // name an older order of an open workstream still has, `-report.md`.
  const split = build("n006-stop-order-split", { "02a-first.md": "# Order 02a — N003 row 2: first\n", "02a-first-report.md": "# report\n",
    "02b-second.md": "# Order 02b — N003 row 2: second\n" });
  check("[MKT.HOOKS.30] a row with two orders stays out until both reports are back", split.found.length === 0, JSON.stringify(split.found));
}

console.log("\n=== stop — a page left stale by an arc this session wrote");
{
  const { cyclesOf, tableOf, producedPage } = await import("../../../../src/scripts/commands/docs/cycles.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail.slice(0, 600)}`}`); };
  const A = `.spndevex/${WORKSTREAMS}/open/001-a-subject`, B = `.spndevex/${WORKSTREAMS}/open/002-b-subject`;
  // Arc N001, kept as data: row 1 landed, row 2 at `state`.
  // RUNNING and LANDED are worked out from the steps: the arc stores the developer's DECIDED, and its first step has landed.
  const arcText = (status, state = "waiting") => `${JSON.stringify({ schemaVersion: 2, arc: "N001", subject: "the-chapter", title: "the chapter",
    goal: "the chapter says where the model sits", status: ["RUNNING", "LANDED"].includes(status) ? "DECIDED" : status, reason: null, preview: "preview.html", rows: [
      { id: "1", parent: "N001", title: "the chapter", kind: "change", repo: "spn-foundation", altitude: "DOCS", state: ["RUNNING", "LANDED"].includes(status) ? "landed" : "waiting" },
      { id: "2", parent: "N001", title: "the check", kind: "change", repo: "spn-support-ts", altitude: "CODE", state }] }, null, 2)}\n`;
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
  const build = (name, status = "DECIDED", state = "waiting") => {
    const root = workspace(name, { [`${A}/arcs/N001/state.json`]: arcText(status, state) });
    const current = status === "DECIDED" || status === "PROPOSED" ? ["PLANNING", "&#x1F52E;"] : ["IMPLEMENTING", "&#x1F6A7;"];
    writeFileSync(join(root, A, "approach.html"), pageFor(join(root, A), ...current));
    const transcript = join(root, "transcript.jsonl");
    writeFileSync(transcript, toolCalls([{ name: "Read", input: { file_path: join(root, A, "arcs", "N001", "state.json") } }]));
    return { root, transcript, arc: join(root, A, "arcs", "N001"), page: join(root, A, "approach.html") };
  };
  const toolCalls = (calls) => calls.map((call) => JSON.stringify({ type: "assistant", message: { role: "assistant",
    content: [{ type: "tool_use", id: "t", name: call.name, input: call.input }] } })).join("\n") + "\n";
  // THE WINDOW OWNS WORKSTREAM A (RD.DEVEX.WORKSPACE.236): its prompt named it, and the case then says what it wrote.
  const stop = (built, session) => {
    bindNamed(built.root, session, "001-a-subject", "prompt");
    built.session = session;
    return run("node", [HOOK], { cwd: built.root, last_assistant_message: "done", session_id: session, transcript_path: built.transcript }, built.root);
  };
  /** The arc moves to `status`, and the session's own write is what moved it, where `mine` says so. */
  const move = (built, status, state, mine = true) => {
    writeFileSync(join(built.arc, "state.json"), arcText(status, state));
    // The window's own write is recorded by PreToolUse as a write of the arc; another window's is not.
    if (mine) recordWrites(built.root, built.session, built.root, [join(built.arc, "state.json")]);
  };
  const count = (text, piece) => text.split(piece).length - 1;

  // KNOWN-BAD: the page is current, the arc then moves from DECIDED to RUNNING, and this session wrote it.
  {
    const built = build("n006-stop-page-stale");
    const first = stop(built, "d-stale");
    move(built, "RUNNING", "waiting");
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
    move(built, "RUNNING", "waiting", false);
    check("[MKT.HOOKS.35] a turn that wrote no arc gets no warning", !/\[page-stale\]/.test(stop(built, "d-reader")));
  }
  // UNTOUCHED: the session moved the arc and produced the page again in the same turn.
  {
    const built = build("n006-stop-page-produced");
    stop(built, "d-produced");
    move(built, "RUNNING", "waiting");
    writeFileSync(built.page, producedPage(join(built.root, A), readFileSync(built.page, "utf8")).text);
    check("[MKT.HOOKS.35] a page produced again in the same turn gets no warning", !/\[page-stale\]/.test(stop(built, "d-produced")));
  }
  // UNTOUCHED: a first Stop has no baseline, so nothing says which arcs this turn wrote.
  {
    const built = build("n006-stop-page-first");
    move(built, "RUNNING", "waiting");
    check("[MKT.HOOKS.35] a first Stop with no baseline compares nothing", !/\[page-stale\]/.test(stop(built, "d-first")));
  }
  // UNTOUCHED: another session's workstream, whose page is stale, while this session wrote its own arc.
  {
    const built = build("n006-stop-page-other-workstream");
    const other = join(built.root, B);
    mkdirSync(join(other, "arcs", "N001"), { recursive: true });
    writeFileSync(join(other, "arcs", "N001", "state.json"), arcText("DECIDED"));
    writeFileSync(join(other, "approach.html"), pageFor(other, "PLANNING", "&#x1F52E;"));
    stop(built, "d-other");
    writeFileSync(join(other, "arcs", "N001", "state.json"), arcText("RUNNING"));       // another window's work
    recordWrites(built.root, "d-other", built.root, [join(built.arc, "state.json")]);
    const out = stop(built, "d-other");
    check("[MKT.HOOKS.35] a workstream another session wrote is not this session's to hear about", !/\[page-stale\]/.test(out), out);
  }
  // UNTOUCHED: a page in the older shape has no Cycles table, so the command has nothing to write.
  {
    const built = build("n006-stop-page-older-shape");
    writeFileSync(built.page, page({}));
    stop(built, "d-older");
    move(built, "RUNNING", "waiting");
    check("[MKT.HOOKS.35] a page with no Cycles table is not told to run the command", !/\[page-stale\]/.test(stop(built, "d-older")));
  }

  console.log("\n=== stop — a page that holds its own copy of the styles");
  const { checkOwnCopy, ownCopyPages } = await import("../../../../src/scripts/events/stop.ts");
  // A page as it was written before the shared stylesheet: it links nothing, it carries a style block,
  // and its classes have no prefix. Its one card is a `div.open`, the name its own copy uses.
  const OLD_CARD = `  <div class="open">\n    <h4 id="q1">Q1 &middot; a real question</h4>\n    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div>\n  </div>\n`;
  const ownPageFor = (folder, status, glyph) => pageFor(folder, status, glyph)
    .replace(STYLES, "<style>.eyebrow{font-size:.8rem} .open{border-left:2px solid orange}</style>").replace(/sds-/g, "")
    .replace(`no card is open</h2></div>\n`, `no card is open</h2></div>\n${OLD_CARD}`);
  const HALF = "stopped";
  const buildOwn = (name, form = ownPageFor) => {
    const built = build(name, "RUNNING", "waiting");
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
    check("[MKT.SCRIPTS.108] it reads no class of the page: it does not say that Open carries no card", !/\[stopped-no-card\]/.test(out), out);
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
// EVERY FINDING MADE THE AGENT REPLY AGAIN, and the developer saw that reply. While a row is running,
// a finding about a page, the notes or a docs tree is held: the hook exits 0. It is not kept as text.
// The baseline's marks stay where they were, so the checks find it again at the first turn end where
// no row is running. The cases below run the hook over several turn ends of one session, on a whole
// workstream kept as data (`031-probe`), its arc RUNNING with row 1 landed and row 2 at `state`.
{
  const { splitFindings, checkHandover, givesHandover } = await import("../../../../src/scripts/events/stop.ts");
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const built = async (name, { named = true, state = "running" } = {}) => {
    const { root, ws } = await dataWorkspace(name);
    const file = join(ws, "arcs", "N001", "state.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    // RUNNING is worked out: the arc stores the developer's DECIDED, and its first step has landed.
    data.rows[0].state = "landed";
    data.rows[1].state = state;
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    cli(root, ["docs", "cycles", "write", "031"]);
    // A page that does not carry the arc is a finding of the state check, which is not about the reply.
    if (!named) writeFileSync(join(ws, "approach.html"), readFileSync(join(ws, "approach.html"), "utf8").replace(/\s*<tr id="N001"[^\n]*<\/tr>/, ""));
    return root;
  };
  const stop = (root, session, reply = "Row 1 landed.", extra = {}) => {
    bindOpen(root, session);
    return run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: reply, ...extra }, root);
  };
  const W = `.spndevex/${WORKSTREAMS}/open/031-probe`;
  const write = (root, session, args) => { cli(root, ["workstream", "row", "write", "031/N001", ...args]); wroteArcs(root, session); };
  // A card the preview shows, raised before the session's first turn end; its answer is what the notes check reads.
  const showCard = (root) => {
    writeFileSync(join(root, "card.json"), JSON.stringify(DATA_CARD));
    cli(root, ["workstream", "question", "raise", "031/N001", "--file", join(root, "card.json")]);
    cli(root, ["workstream", "question", "show", "q1", "--in", "notes/N001/preview.html"]);
  };
  const logAnswer = (root, session) => {
    cli(root, ["workstream", "question", "answer", "q1", "--key", "B", "--words", "the second reading"]);
    wroteArcs(root, session);
  };
  // Row 2 lands in the data alone, so a page the case broke stays broken and its finding is the same one.
  const land = (root, session) => {
    const file = join(root, W, "arcs", "N001", "state.json");
    writeFileSync(file, readFileSync(file, "utf8").replace('"state": "running"', '"state": "landed"'));
    wroteArcs(root, session);
  };
  const movePreview = (root) => writeFileSync(join(root, W, "notes", "N001", "preview.html"), `${PREVIEW}<!-- the check reads setup only, as the developer chose -->\n`, "utf8");
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 300)}`}`); };

  console.log("\n=== stop — while a row is running, a finding that is not about the reply is held (RD.DEVEX.WORKSPACE.244)");
  {
    const root = await built("n009-held-page", { named: false });
    const running = stop(root, "held-page");
    check("a finding about the page, while a row is running, sends no reply: the hook is silent", running === "", running);
    land(root, "held-page");
    const waiting = stop(root, "held-page");
    check("known-bad: the same finding is said at the first turn end where no row is running",
      /\[state\]/.test(waiting) && waiting.includes("N001 has no row in Cycles"), waiting);
  }
  {
    const root = await built("n009-held-notes");
    showCard(root);
    stop(root, "held-notes");                       // the session's first turn end: its baseline
    logAnswer(root, "held-notes");
    const second = stop(root, "held-notes");
    check("an answer whose notes did not move is held while a row is running", !/\[notes\]/.test(second) && second === "", second);
    const third = stop(root, "held-notes");
    check("and it is still held at the next turn end of the same run", third === "", third);
    land(root, "held-notes");
    const waiting = stop(root, "held-notes");
    check("nothing held is lost: the notes finding is found again, whole, when the agent waits",
      /\[notes\]/.test(waiting) && waiting.includes("notes/N001/preview.html") && waiting.includes("RD.DEVEX.WORKSPACE.193"), waiting);
    const after = stop(root, "held-notes", "Done.", { stop_hook_active: true });
    check("and once said, the marks move on: the reply that answers it is not told again", !/\[notes\]/.test(after), after);
    const later = stop(root, "held-notes");
    check("nor is a later turn that changed nothing", !/\[notes\]/.test(later), later);
  }
  {
    const root = await built("n009-held-fixed");
    showCard(root);
    stop(root, "held-fixed");
    logAnswer(root, "held-fixed");
    const held = stop(root, "held-fixed");
    movePreview(root);
    land(root, "held-fixed");
    const waiting = stop(root, "held-fixed");
    check("a held finding that the agent fixed before it waits is not found again, so it is not said",
      held === "" && !/\[notes\]/.test(waiting), `${held} // ${waiting}`);
  }
  {
    const root = await built("n009-held-reply", { named: false });
    const out = stop(root, "held-reply", "Row 1 landed.\n\nPick B and we move on.");
    check("known-bad: a decision put with no card still sends the agent back while a row is running", /\[reply-shape\]/.test(out), out);
    check("and the finding about the page is held in that same turn", !/\[state\]/.test(out), out);
    land(root, "held-reply");
    const waiting = stop(root, "held-reply");
    check("the held finding is said when the agent waits, though another check spoke in between", /\[state\]/.test(waiting), waiting);
  }
  {
    const root = await built("n009-held-handover", { named: false });
    const out = stop(root, "held-handover", "Pick this up in a new window.");
    check("known-bad: a pass-on with no block still sends the agent back while a row is running",
      /\[handover\]/.test(out) && !/\[state\]/.test(out), out);
  }
  {
    const ABOUT_THE_REPLY = ["needs-you", "reply-shape", "handover", "welcome"];
    const THE_REST = ["notes", "carried", "stopped-no-card", "page-stale", "state", "own-copy", "runnable", "hold", "corpus"];
    const all = [...ABOUT_THE_REPLY, ...THE_REST].map((name) => ({ check: name, message: `the ${name} finding, whole` }));
    const names = (list) => list.map((warning) => warning.check).join(" ");
    const split = typeof splitFindings === "function" ? splitFindings : () => ({ said: [], held: [] });
    const running = split(all, true), waiting = split(all, false);
    check("while a row is running, the four findings about the reply are said", names(running.said) === ABOUT_THE_REPLY.join(" "), names(running.said));
    check("and every other finding is held, with its message as it was", names(running.held) === THE_REST.join(" ")
      && running.held.every((warning) => warning.message === `the ${warning.check} finding, whole`), names(running.held));
    check("with no row running, every finding is said and none is held", names(waiting.said) === names(all) && waiting.held.length === 0, names(waiting.held));
  }

  // ── a handover block is owed once, and an open card in a handover is one line (RD.DEVEX.WORKSPACE.189, .198) ──
  console.log("\n=== handover — the block is owed once, and a card that is open is named in one line, never asked for in full");
  const WHOLE = ["```text",
    "continue:     workstream `031-probe`, arc `N001`, row 2, in a `spn-x` window",
    "model:        Opus 5.5, effort high",
    "read first:   `approach.html#N001`, rows 1 and 2",
    "pins:         spn-x abc1234",
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
    ["a block with a {{…}} left does not", gives(`${PASS_ON}\n\n${WHOLE.replace("`N001`", "`N{{n}}`")}`), false],
    ["a reply with no block does not", gives(PASS_ON), false],
  ]) check(what, got === expected, `got ${got}`);
  {
    const root = await built("n009-handover-fn", { state: "landed" });
    const mine = everyone(root);
    check("a pass-on with no block, after a whole block was given, owes no second block",
      checkHandover(PASS_ON, root, mine, true).length === 0, JSON.stringify(checkHandover(PASS_ON, root, mine, true)));
    check("known-bad: the same pass-on, with no block given before, is told to write one",
      checkHandover(PASS_ON, root, mine, false).length === 1 && /carries no handover block/.test(checkHandover(PASS_ON, root, mine, false)[0].message));
    check("known-bad: a block printed again is still read, so one with a label missing is told so",
      checkHandover(`${PASS_ON}\n\n${WHOLE.replace(/\npins:[^\n]*/, "")}`, root, mine, true).length === 1);
  }
  {
    const carded = workspace("n009-handover-card", { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/approach.html`]: page({ cards: CARD }) });
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
    const root = await built("n009-handover-once", { state: "landed" });
    const first = stop(root, "ho-once", `${PASS_ON}\n\n${WHOLE}`);
    const second = stop(root, "ho-once", PASS_ON);
    check("the hook: the reply that gives the whole block is silent", first === "", first);
    check("the hook: a later reply in the same window that passes the work on again is not asked for a second block", !/\[handover\]/.test(second), second);
    write(root, "ho-once", ["2", "--state", "running"]);
    const moved = stop(root, "ho-once", PASS_ON);
    check("known-bad: once the rows have moved, the old block no longer says where to start, and a block is owed", /\[handover\]/.test(moved), moved);
  }
  {
    // A FINDING ON A HANDOVER REPLY IS ANSWERED WITHOUT THE BLOCK. The page does not carry the arc, so
    // the handover reply draws the state check. The answer mentions the new window and prints no block.
    const root = await built("n009-handover-answer", { named: false, state: "landed" });
    const first = stop(root, "ho-answer", `${PASS_ON}\n\n${WHOLE}`);
    check("the hook: a handover reply with a whole block is told only about the page", /\[state\]/.test(first) && !/\[handover\]/.test(first), first);
    const answer = stop(root, "ho-answer", "The page now carries the arc. The handover block above still holds: open a new window from it.",
      { stop_hook_active: true });
    check("the hook: the reply that answers that finding is not asked for the block again", !/\[handover\]/.test(answer), answer);
    const never = await built("n009-handover-never", { state: "landed" });
    stop(never, "ho-never", "Row 2 landed.");
    const asked = stop(never, "ho-never", PASS_ON);
    check("known-bad: a window that never gave a block is told to write one", /\[handover\]/.test(asked), asked);
  }
}

// A MIGRATION THE LEDGER LACKS THAT STILL FINDS OLD SHAPES IS OWED WORK (RD.DEVEX.AGENT.094), in any
// window, because the workspace's files are what it moves. Every other case here runs in a fixture that
// has applied every migration, so it hears nothing of this one.
console.log("\n=== migration — a pending plugin migration holds the turn");
{
  const { checkMigrations } = await import("../../../../src/scripts/events/stop.ts");
  const check = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  // The old shape migration 004 moves: a row of a PROPOSED arc that is not of the kind `design`.
  const owedData = { schemaVersion: 2, arc: "N001", subject: "a-subject", title: "a subject", goal: "it lands", status: "PROPOSED", reason: null,
    preview: "preview.html", rows: [{ id: "1", parent: "N001", title: "a thing", kind: "change", state: "waiting" }] };
  const files = { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N001/state.json`]: `${JSON.stringify(owedData)}\n` };
  const old = workspace("migration-owed", files, [], { migrated: false });
  const [warning] = checkMigrations(old);
  check("red: a PROPOSED arc's row not of the kind design and no ledger line — the turn is told 004 runs",
    warning?.check === "migration" && /004 \(1 place\(s\), such as open\/001-a-subject\/arcs\/N001: 1 row\(s\) at PROPOSED not design → design\)/.test(warning.message), warning?.message);
  const hooked = run("node", [`${HOOKS}/src/scripts/events/stop.ts`], { cwd: old, session_id: "migration-owed", last_assistant_message: "Row 2 landed." }, old);
  check("red: the hook itself says it, under its own name", /\[migration\] a plugin migration is pending/.test(hooked), hooked);
  check("green: the same workspace with every migration recorded hears nothing", checkMigrations(workspace("migration-applied", files)).length === 0);
  check("green: a workspace kept as data with nothing recorded hears nothing — there is no work owed",
    checkMigrations(workspace("migration-idle", { [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1/state.json`]: "{}\n" }, [], { migrated: false })).length === 0);
}

console.log("\n=== window — a new window is offered from 200k at a clean point, always past 450k, in any phase");
{
  // THE TRANSCRIPT IS BUILT FROM LINES OF A REAL ONE (`fixtures/window-transcript-lines.json`, trimmed),
  // with only the size of the last call chosen here.
  const lines = JSON.parse(readFileSync(resolve(HOOKS, "tests", "fixtures", "window-transcript-lines.json"), "utf8"));
  const sized = (kilo, id) => ({ ...lines["bash-row-write"], message: { ...lines["bash-row-write"].message, id,
    content: [{ type: "text", text: "ok" }],
    usage: { input_tokens: 2, cache_creation_input_tokens: 1000, cache_read_input_tokens: kilo * 1000 - 1002, output_tokens: 10 } } });
  const feedback = (kilo) => ({ ...lines["stop-feedback"], message: { role: "user",
    content: `Stop hook feedback:\n[node stop.mjs]: [window] This window is at ${kilo}k, past the point.` } });
  // A WHOLE WORKSTREAM, kept as data (`dataWorkspace`), so `workstream state check` finds nothing in it unless the case breaks it.
  let counter = 0;
  const hear = async ({ status = "DECIDED", parts = [lines["bash-row-write"]], kilo, extra = {}, running = false, broken = false }) => {
    counter += 1;
    const { root, ws } = await dataWorkspace(`window-${counter}`);
    const file = join(ws, "arcs", "N001", "state.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    // RUNNING is worked out from the steps: the arc stores the developer's DECIDED, and a step has started.
    data.status = status === "RUNNING" ? "DECIDED" : status;
    if (status === "RUNNING" && !running) data.rows[0].state = "landed";
    if (running) data.rows[0].state = "running";
    writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    if (status !== "DECIDED" || running) cli(root, ["docs", "cycles", "write", "031"]);
    if (broken) writeFileSync(join(ws, "notes", "N001", "layout-preview.html"), PREVIEW);
    bindNamed(root, `window-${counter}`, "031-probe", "prompt");   // the window works on this workstream
    const transcript = join(root, "transcript.jsonl");
    writeFileSync(transcript, [...parts, sized(kilo, `msg_w${counter}`)].map((line) => JSON.stringify({ ...line, cwd: ws })).join("\n") + "\n");
    return run("node", [`${HOOKS}/src/scripts/events/stop.ts`],
      { cwd: root, session_id: `window-${counter}`, transcript_path: transcript, last_assistant_message: "done", ...extra }, root);
  };
  const check = (label, ok, detail = "") => {
    n += 1; if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`);
  };
  const asks = (out) => /\[window\]/.test(out);
  const clean = await hear({ kilo: 210 });
  check("clean: offers at 210k, and the message names the size, the written points and the small asks",
    asks(clean) && /210k/.test(clean) && /S<n>/.test(clean) && /question as a card/.test(clean) && /small/.test(clean) && /whole size/.test(clean), clean);
  check("clean: silent below 200k", !asks(await hear({ kilo: 190 })));
  check("phase does not matter: a PROPOSED arc gets the same offer at 210k", asks(await hear({ status: "PROPOSED", kilo: 210 })));
  check("phase does not matter: a RUNNING arc gets the same offer at 210k", asks(await hear({ status: "RUNNING", kilo: 210 })));
  check("phase does not matter: a window that wrote to no arc gets the same offer at 210k", asks(await hear({ parts: [], kilo: 210 })));
  const busy = await hear({ status: "RUNNING", running: true, kilo: 210 });
  check("a child running at 210k: no offer", !asks(busy), busy);
  const found = await hear({ broken: true, kilo: 210 });
  check("a state finding at 210k: no offer", !asks(found) && /\[state\]/.test(found), found);
  const always = await hear({ status: "RUNNING", running: true, kilo: 460 });
  check("a child running at 460k: the always-message", asks(always) && /past 450k/.test(always) && /Write every open point first/.test(always) && /whatever is running/.test(always), always);
  // THE OFFER IS WHERE A PERSON LEARNS HOW WINDOWS WORK: a partner holds no book, so the note asks the
  // turn to say why a new window helps, that nothing is lost, and how to open one, in the person's words.
  const forThePerson = (out) => /one or two plain sentences/.test(out) && /never this note's/.test(out)
    && /each reply re-reads the whole window/.test(out)
    && /nothing is lost/.test(out) && /the handover and the workstream's folder carry every open point/.test(out)
    && /a new chat at the workspace root, in the editor they use, with the handover pasted as its first message/.test(out)
    && /no token count/.test(out) && /"clean point"/.test(out);
  check("clean: the note asks the turn to tell the person why, that nothing is lost, and how to open one", forThePerson(clean), clean);
  check("past 450k: the always-message asks for the same three things", forThePerson(always), always);
  check("does not ask again until the window grows 50k", !asks(await hear({ parts: [lines["bash-row-write"], sized(212, "msg_first"), feedback(212)], kilo: 240 })));
  check("asks again once the window has grown 50k", asks(await hear({ parts: [lines["bash-row-write"], sized(212, "msg_first"), feedback(212)], kilo: 265 })));
  const waiting = await hear({ parts: [lines["bash-row-write"], lines["agent-background-pending"]], kilo: 220 });
  check("waits while a background Agent has no notification", !asks(waiting), waiting);
  check("asks when every background Agent has its notification",
    asks(await hear({ parts: [lines["bash-row-write"], lines["agent-background-notified"], lines["notification"]], kilo: 220 })));
  check("silent for a subagent's stop (agent_id)", !asks(await hear({ kilo: 220, extra: { agent_id: "a1" } })));
  check("silent under stop_hook_active", !asks(await hear({ kilo: 220, extra: { stop_hook_active: true } })));
}

console.log("\n=== stop — the needs-you check judges only the cards this window raised");
{
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const check = (label, ok, detail = "") => { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`); };
  const raised = async (name, session) => {
    const { root, ws } = await dataWorkspace(name);
    writeFileSync(join(root, "card.json"), JSON.stringify(DATA_CARD));
    cli(root, ["workstream", "question", "raise", "031/N001", "--file", join(root, "card.json")], session ? { CLAUDE_CODE_SESSION_ID: session } : {});
    return { root, ws };
  };
  const stopAs = (root, session) => {
    bindOpen(root, session);
    return run("node", [HOOK], { cwd: root, session_id: session, last_assistant_message: "done" }, root);
  };
  {
    const { root, ws } = await raised("raiser-recorded", "window-a");
    const record = JSON.parse(readFileSync(join(ws, "questions.jsonl"), "utf8").trim().split("\n")[0]);
    check("`question raise` records the window that raised the card", record.raisedBy === "window-a", JSON.stringify(record).slice(0, 200));
    check("the window that raised the card is asked for **Needs you**", /\[needs-you\]/.test(stopAs(root, "window-a")));
    check("another window on that workstream is not asked for a card it did not raise", !/\[needs-you\]/.test(stopAs(root, "window-b")));
  }
  {
    const { root, ws } = await raised("raiser-none", null);
    const record = JSON.parse(readFileSync(join(ws, "questions.jsonl"), "utf8").trim().split("\n")[0]);
    check("a card raised with no window recorded has no raiser", record.raisedBy === undefined);
    check("and is judged as before: any window on the workstream is asked for it", /\[needs-you\]/.test(stopAs(root, "window-c")));
  }
}

console.log("\n=== stop — outside a workspace it writes nothing, so it makes no `.spndevex/`");
// A STOP OUTSIDE A WORKSPACE ONCE WROTE ITS SESSION NOTE THERE, and the `.spndevex/.debug/` that made
// rooted every later session below that folder in it: `/tmp` became a workspace, and a partner's
// repository under it was told day 0.
{
  const check = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  const HOOK = `${HOOKS}/src/scripts/events/stop.ts`;
  const outside = join(BASE, "no-workspace", "acme-orders");
  mkdirSync(outside, { recursive: true });
  run("node", [HOOK], { cwd: outside, session_id: "outside", last_assistant_message: "done" }, outside);
  check("a Stop in a folder with no workspace above it creates no .spndevex",
    !existsSync(join(outside, ".spndevex")) && !existsSync(join(BASE, "no-workspace", ".spndevex")));

  const stray = join(BASE, "stray-debug");
  const below = join(stray, "partner", "acme-orders");
  mkdirSync(join(stray, ".spndevex", ".debug", "stop", "sessions"), { recursive: true });
  mkdirSync(below, { recursive: true });
  run("node", [HOOK], { cwd: below, session_id: "below-stray", last_assistant_message: "done" }, below);
  check("a .spndevex holding only .debug is no workspace: the Stop writes no note into it",
    readdirSync(join(stray, ".spndevex", ".debug", "stop", "sessions")).length === 0);
}

console.log(failed ?`\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
