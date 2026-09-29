import { PLUGIN } from "../../../helpers/harness.mjs";
// `closed` — the line a finished scope earns. The known-bad is every shape that must NOT produce a
// congratulation, because congratulating a move that closed nothing makes the one moment that speaks
// mean nothing.
//
// PARITY IS WAIVED ON THE ORDINARY CLOSE, and that is finding F10: the Python took the subject from
// the destination, so `mv <subject> closed/` landed on `closed` and it said nothing. Agreeing with it
// there would mean the fix did not land. One case below pins the spelling the Python DID handle, so
// the port is still held to it.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { WORKSTREAMS } from "../../../../src/scripts/lib/docs-tree.ts";

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


const page = (rows) => `<!doctype html>
<div class="eyebrow">Workstream 001 &middot; closed</div>
<section id="s3"><table>
  <thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
  <tbody>
${rows.map(([w, s, st]) => `    <tr><td>${w}</td><td>${s}</td><td>${st}</td></tr>`).join("\n")}
  </tbody>
</table></section>`;

function build(name, rows, where = "closed") {
  return workspace(name, {
    [`.spndevex/${WORKSTREAMS}/${where}/001-a-subject/a-subject-approach.html`]: page(rows),
    [`.spndevex/${WORKSTREAMS}/${where}/001-a-subject/arcs/N1-x.md`]: "# Arc\n\n## Log\n\n- **2026-09-18 — go.**\n",
    "spn-support-ts/src/a.ts": "export const a = 1;\n",
  });
}

const messageOf = (out) => {
  if (!out) return "";
  try { return JSON.parse(out.split("\n").filter(Boolean).at(-1)).systemMessage ?? ""; } catch { return out; }
};

function run(cmd, args, payload, cwd) {
  try { return messageOf(execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim()); }
  catch (e) { return `ERROR ${String(e.stderr ?? e.message).slice(0, 200)}`; }
}

let n = 0, failed = 0;
function one(label, root, command, expect, { says, parity = true, why = "" } = {}) {
  n += 1;
  const payload = { tool_name: "Bash", cwd: root, tool_input: { command } };
  const ts = run("node", [`${HOOKS}/src/scripts/events/closed.ts`], payload, root);
  const py = hasPython("closed.py") ? run("python3", [`${SCRIPTS}/closed.py`], payload, root) : null;
  const saysOk = !says || ts.includes(says);
  const agrees = py === null || !parity || (Boolean(ts) === Boolean(py));
  const ok = (Boolean(ts) === (expect === "speaks")) && agrees && saysOk;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${ts ? "speaks" : "silent"} · py ${py === null ? "not installed" : py ? "speaks" : "silent"}` +
    `${says ? ` · names "${says}" ${saysOk}` : ""}${parity ? "" : ` (parity waived: ${why})`}`);
  if (!ok) console.log(`        ts: ${ts.slice(0, 250)}\n        py: ${(py ?? "").slice(0, 250)}`);
}

console.log("\n=== closed");

const F10 = "the Python read the subject from the destination, so this spelling was silent";

// UNTOUCHED — a real close, counted from the page's own plan.
one("a close counts what landed",
  build("cl-ok", [["a", "spn-foundation", "&#x2705; landed"], ["b", "spn-support-ts", "&#x2705; landed"], ["c", "spn-platform-ts", "&#x2705; landed"]]),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "speaks", { says: "3 rows landed", parity: false, why: F10 });

one("carried and deferred are named beside what landed",
  build("cl-mixed", [["a", "spn-foundation", "&#x2705; landed"], ["b", "spn-support-ts", "&#x21B7; carried to N4"], ["c", "spn-platform-ts", "&#x2298; deferred until asked"]]),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "speaks", { says: "1 row landed, and 1 carried to a named successor and 1 deferred with its trigger", parity: false, why: F10 });

one("git mv is the same act by another spelling",
  build("cl-gitmv", [["a", "spn-foundation", "&#x2705; landed"]]),
  `git mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "speaks", { says: "1 row landed", parity: false, why: F10 });

one("the one spelling the Python did handle, so the port is held to it",
  build("cl-spelled", [["a", "spn-foundation", "&#x2705; landed"]]),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/001-a-subject`,
  "speaks", { says: "1 row landed" });

// THE SPLIT PLAN IS THE ARCS' STEP ROWS. A workstream written after that rule carries its plan in
// each arc's `## Steps` table and may have no page at all, so the count comes from the arcs.
const stepArc = (rows) => `# N2 — the arc\n\nStatus: **LANDED**\n\n## Steps\n\n` +
  `| # | Repo | Altitude | What | Mechanism | Acceptance | State |\n| --- | --- | --- | --- | --- | --- | --- |\n` +
  rows.map(([id, repo, state]) => `| ${id} | ${repo} | DOCS | a change | by hand | audit | ${state} |`).join("\n") + "\n\n## Log\n\n- **2026-09-29 — go.**\n";

one("a close with no page counts the arcs' landed steps, dotted ones included",
  workspace("m1-cl-arcs", {
    [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/arcs/N2-the-arc.md`]:
      stepArc([["1", "spn-foundation", "✅ landed — `abc1234`"], ["3e.1", "spn-support-ts", "LANDED — `def5678`"], ["4", "spn-platform-ts", "⊘ deferred until asked"]]),
  }),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "speaks", { says: "2 rows landed, and 1 deferred with its trigger", parity: false, why: "the Python reads only a page" });

one("a page's scope rows and the arcs' step rows are one plan",
  workspace("m1-cl-both", {
    [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/a-subject-approach.html`]: page([["a", "spn-foundation", "&#x2705; landed"]]),
    [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/arcs/N2-the-arc.md`]: stepArc([["1", "spn-support-ts", "✅ landed"]]),
  }),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "speaks", { says: "2 rows landed", parity: false, why: "the Python reads only a page" });

// RD.DEVEX.WORKSPACE.184 — `in progress <time>` IS NOT LANDED. The gate refuses it before the move,
// so a row found here was moved past the gate, and the line must not count it or cheer.
{
  const root = workspace("m7-cl-in-progress", {
    [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/arcs/N2-the-arc.md`]:
      stepArc([["1", "spn-foundation", "✅ landed — `abc1234`"], ["2", "spn-support-ts", "in progress 2026-09-29 14:32 +05:30"]]),
  });
  const said = run("node", [`${HOOKS}/src/scripts/events/closed.ts`],
    { tool_name: "Bash", cwd: root, tool_input: { command: `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/` } }, root);
  for (const [what, ok] of [
    ["a row in progress is named as not landed", /1 row still marked in progress/.test(said)],
    ["and it is not counted among the landed rows", /1 row landed/.test(said)],
    ["and the scope is not called finished", !/Well done/.test(said)],
  ]) { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : `\n        ts: ${said.slice(0, 250)}`}`); }
}

// RD.DEVEX.WORKSPACE.188 — `⏸ held on Q<n>` IS NOT LANDED EITHER. The gate refuses it before the move
// (the refusal is proved in `t-split-plan.mjs`), so a held row found here was moved past the gate.
for (const [label, mark] of [["the book's form", "⏸ held on Q352"], ["the mark without its glyph", "held on Q352"]]) {
  const root = workspace(`m11-cl-held-${mark.startsWith("held") ? "bare" : "glyph"}`, {
    [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/arcs/N2-the-arc.md`]:
      stepArc([["1", "spn-foundation", "✅ landed — `abc1234`"], ["2", "spn-support-ts", mark]]),
  });
  const said = run("node", [`${HOOKS}/src/scripts/events/closed.ts`],
    { tool_name: "Bash", cwd: root, tool_input: { command: `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/` } }, root);
  for (const [what, ok] of [
    [`a held row is named as not landed (${label})`, /1 row held on a card/.test(said)],
    [`and the scope is not called finished (${label})`, /1 row landed/.test(said) && !/Well done/.test(said)],
  ]) { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${what}${ok ? "" : `\n        ts: ${said.slice(0, 250)}`}`); }
}

// KNOWN-BAD — every move that closed nothing and must stay silent.
one("backlog moving into open is work starting, not finishing",
  build("cl-start", [["a", "spn-foundation", "&#x2705; landed"]], "backlog"),
  `mv .spndevex/${WORKSTREAMS}/backlog/001-a-subject .spndevex/${WORKSTREAMS}/open/`,
  "silent");

one("an ordinary move inside a repository",
  build("cl-repo", [["a", "spn-foundation", "&#x2705; landed"]]),
  "mv spn-support-ts/src/a.ts spn-support-ts/src/b.ts",
  "silent");

one("a command that moves nothing",
  build("cl-nothing", [["a", "spn-foundation", "&#x2705; landed"]]),
  "git status --short",
  "silent");

one("a folder with neither a page nor a step table is not a scope finishing",
  workspace("m1-cl-empty", { [`.spndevex/${WORKSTREAMS}/closed/001-a-subject/notes/a.md`]: "a note\n" }),
  `mv .spndevex/${WORKSTREAMS}/open/001-a-subject .spndevex/${WORKSTREAMS}/closed/`,
  "silent");

one("a loose file moved into closed/ is not a scope finishing",
  build("cl-file", [["a", "spn-foundation", "&#x2705; landed"]]),
  `mv notes.md .spndevex/${WORKSTREAMS}/closed/`,
  "silent");

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
