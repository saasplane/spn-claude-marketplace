// `stop` — the four arc-to-page checks and reply-shape, merged into stop.ts.
//
// EACH KNOWN-BAD IS RUN TWICE: once with arcs named `arc-{subject}.md`, which is what the Python
// looks for, and once with them named `N1-{subject}.md`, which is what this workspace actually uses.
// The first pair proves parity. The second is finding F11 — the Python goes silent and the port does
// not, which is the whole reason the filter had to go.
import { execFileSync } from "node:child_process";
import { workspace } from "./fixture.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..", "..");
const SCRIPTS = resolve(HOOKS, "scripts");
const DOCS = resolve(HOOKS, "docs");

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

const CARD = `  <div class="open"><h4 id="q1">Q1 &middot; a real question</h4>
    <div class="scroll"><table><thead><tr><th></th><th>What</th></tr></thead>
    <tbody><tr><td><strong>A</strong></td><td>one way</td></tr></tbody></table></div>
    <div class="rec"><b>Recommended: A.</b> <b>Decision:</b> &mdash;</div></div>`;

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
  const ts = said(run("node", [`${DOCS}/stop.ts`], payload, root));
  const py = hasPython("stop.py") ? said(run("python3", [`${SCRIPTS}/stop.py`], payload, root)) : null;
  const saysOk = !says || ts.includes(says);
  const spoke = Boolean(ts), pySpoke = Boolean(py);
  const ok = spoke === (expect === "warns") && saysOk && (py === null || !parity || spoke === pySpoke);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${spoke ? "warns" : "silent"} · py ${py === null ? "not installed" : pySpoke ? "warns" : "silent"}${says ? ` · names "${says}" ${saysOk}` : ""}${parity ? "" : ` (parity waived: ${why})`}`);
  if (!ok) console.log(`        ts: ${ts.slice(0, 300)}\n        py: ${py.slice(0, 300)}`);
}

const F11 = "the Python listed arcs as `arc-*` only, so an N-named arc was invisible to it";

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
  "warns", { says: "asks for a lettered choice and shows no options table",
             reply: "I recommend we do this. Say A and I will start, or say B to wait." });

one("the same choice, shown as a lettered table",
  build("stop-reply-good", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Q9 · which way\n\n| | What it does | What it costs |\n| --- | --- | --- |\n| **A** | start now | the cycle |\n| **B** | wait | the delay |\n\nRecommended: A. Say A and I will start." });

one("a reply that merely mentions a letter",
  build("stop-reply-plain", { arcNames: ["arc-a-subject.md"], pageOpts: { cards: CARD, names: ["arc-a-subject.md"] } }),
  "silent", { reply: "Appendix A of the chapter covers it. Nothing is open." });

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
