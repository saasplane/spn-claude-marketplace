// `split-plan` — the two gates, finding F5's fix, and the fast path that is the whole budget.
//
// Every case runs the SAME payload through the Python and the port. The three F5 cases are marked
// `parity: false` on purpose: the Python cannot see a card answered on the page, which is the defect
// the port fixes, so agreeing with it there would mean the fix did not land.
import { execFileSync } from "node:child_process";
import { workspace } from "./fixture.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
const SCRIPTS = resolve(HOOKS, "scripts");
const EVENTS = resolve(HOOKS, "events");

// THESE SUITES ARE A BUILDER'S GATE, and they say so rather than pretending otherwise. Several cases
// name real files in the surrounding workspace — a chapter, an approach page, this workstream's own
// arcs — because what they prove is that the check agrees with the incumbent ON THE CORPUS, and a
// corpus cannot be invented. A partner holds the plugin without the workspace and runs
// `partner-shape.ts` instead, which needs nothing but the plugin itself.
const WORKSPACE = resolve(HOOKS, "..", "..", "..", "..");

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
  </div>`;

const arc = (log = "") =>
  `# Arc — a subject\n\nStatus: **RUNNING**\n\n## Log\n\n- **2026-09-18 — go.** Finish it.\n${log}`;

const LANDED = [["the chapter", "spn-foundation", "&#x2705; landed"], ["the check", "spn-support-ts", "&#x2705; landed"]];

function build(name, { eyebrow, rows = LANDED, cards = "", log = "", state = "open" } = {}) {
  const folder = `.spndevex/workstreams/${state}/001-a-subject`;
  return workspace(name, {
    [`${folder}/a-subject-approach.html`]: page({ eyebrow, rows, cards }),
    [`${folder}/arcs/N1-something.md`]: arc(log),
    "spn-support-ts/artifacts/approaches/keep.md": "placeholder\n",
  });
}

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
  try { return verdict(execFileSync("node", [`${HOOKS}/checks/split-plan.ts`, "--gate", gate], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim()); }
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
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "deny", { says: "row nobody decided" });

one("a row started and put down refuses too", "close",
  build("sp-stopped", { rows: [...LANDED, ["the third thing", "spn-platform-ts", "&#x25D0; 2026-09-08 half of it"]] }),
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "deny", { says: "started and put down" });

one("a page still saying it is running is stamped first", "close",
  build("sp-running", { eyebrow: "running" }),
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "deny", { says: "does not say it is closed" });

one("no split plan at all is refused, not passed", "close",
  workspace("sp-noplan", {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html":
      `<div class="eyebrow">Workstream 001 &middot; closed</div><section id="s3"><table><thead><tr><th>What</th></tr></thead><tbody><tr><td>a thing</td></tr></tbody></table></section>`,
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-something.md": arc(),
  }),
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "deny", { says: "checked NOTHING" });

one("landed, carried and deferred all pass", "close",
  build("sp-accounted", { rows: [["a", "spn-foundation", "&#x2705; landed"], ["b", "spn-support-ts", "&#x21B7; carried to N4"], ["c", "spn-platform-ts", "&#x2298; deferred until a partner asks"]] }),
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "silent");

one("backlog moving into open is not a close", "close",
  build("sp-start", { rows: [...LANDED, ["the third", "spn-platform-ts", ""]], state: "backlog" }),
  move(".spndevex/workstreams/backlog/001-a-subject", ".spndevex/workstreams/open/"),
  "silent");

console.log("\n=== split-plan — the documents-first gate, and finding F5");

one("F5: a card in Open carrying its own decision", "documents-first",
  build("sp-f5", { cards: card(88, "<strong>C.</strong> The capabilities seat, beside the data model.") }),
  { file_path: ".spndevex/workstreams/open/001-a-subject/arcs/N1-something.md", content: "x" },
  "note", { says: "the card carries its own decision", parity: false, why: "this is the defect F5 names — the Python reads only the arcs" });

one("F5: an unanswered card is left alone", "documents-first",
  build("sp-f5-open", { cards: card(88, "&mdash;") }),
  { file_path: ".spndevex/workstreams/open/001-a-subject/arcs/N1-something.md", content: "x" },
  "silent");

one("a card an arc records as answered is still caught", "documents-first",
  build("sp-arclog", { cards: card(88, "&mdash;"), log: "\n- **2026-09-18 — Q88 answered C.** The capabilities seat.\n" }),
  { file_path: ".spndevex/workstreams/open/001-a-subject/arcs/N1-something.md", content: "x" },
  "note", { says: "an arc records it as answered" });

one("a number in a code span is an example, not a record", "documents-first",
  build("sp-example", { cards: card(88, "&mdash;"), log: "\n- a log saying `Q88 answered` names one card\n" }),
  { file_path: ".spndevex/workstreams/open/001-a-subject/arcs/N1-something.md", content: "x" },
  "silent");

one("writing a seat page while the workstream's rows still pend", "documents-first",
  build("sp-seat", { rows: [["the chapter", "spn-foundation", "&#x2705; landed"], ["the check", "spn-support-ts", ""]] }),
  { file_path: "spn-support-ts/artifacts/approaches/a-thing-approach.html", content: "<html></html>" },
  "note", { says: "Documents-first" });

console.log("\n=== split-plan — the fast path");

// The budget claim: an ordinary Bash call that names no page and no workstream pays almost nothing.
// Measured against the REAL workspace, whose page is 214 KB and whose workstream holds fourteen arcs.
const REAL = `${WORKSPACE}`;
const ordinary = { tool_name: "Bash", cwd: REAL, tool_input: { command: "git status --short" } };
const plan = { tool_name: "Bash", cwd: REAL, tool_input: { command: "mv .spndevex/workstreams/open/x .spndevex/workstreams/closed/" } };

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
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "silent");

one("and one still saying it is running is refused", "close",
  build("sp-running", { eyebrow: "Status: &#x1F6A7; IMPLEMENTING" }),
  move(".spndevex/workstreams/open/001-a-subject", ".spndevex/workstreams/closed/"),
  "deny", { says: "does not say it is closed" });

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
