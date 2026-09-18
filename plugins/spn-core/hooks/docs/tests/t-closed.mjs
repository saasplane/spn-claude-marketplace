// `closed` — the line a finished scope earns. The known-bad is every shape that must NOT produce a
// congratulation, because congratulating a move that closed nothing makes the one moment that speaks
// mean nothing.
//
// PARITY IS WAIVED ON THE ORDINARY CLOSE, and that is finding F10: the Python took the subject from
// the destination, so `mv <subject> closed/` landed on `closed` and it said nothing. Agreeing with it
// there would mean the fix did not land. One case below pins the spelling the Python DID handle, so
// the port is still held to it.
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
    [`.spndevex/workstreams/${where}/001-a-subject/a-subject-approach.html`]: page(rows),
    [`.spndevex/workstreams/${where}/001-a-subject/arcs/N1-x.md`]: "# Arc\n\n## Log\n\n- **2026-09-18 — go.**\n",
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
  const ts = run("node", [`${DOCS}/closed.ts`], payload, root);
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
  "mv .spndevex/workstreams/open/001-a-subject .spndevex/workstreams/closed/",
  "speaks", { says: "3 rows landed", parity: false, why: F10 });

one("carried and deferred are named beside what landed",
  build("cl-mixed", [["a", "spn-foundation", "&#x2705; landed"], ["b", "spn-support-ts", "&#x21B7; carried to N4"], ["c", "spn-platform-ts", "&#x2298; deferred until asked"]]),
  "mv .spndevex/workstreams/open/001-a-subject .spndevex/workstreams/closed/",
  "speaks", { says: "1 row landed, and 1 carried to a named successor and 1 deferred with its trigger", parity: false, why: F10 });

one("git mv is the same act by another spelling",
  build("cl-gitmv", [["a", "spn-foundation", "&#x2705; landed"]]),
  "git mv .spndevex/workstreams/open/001-a-subject .spndevex/workstreams/closed/",
  "speaks", { says: "1 row landed", parity: false, why: F10 });

one("the one spelling the Python did handle, so the port is held to it",
  build("cl-spelled", [["a", "spn-foundation", "&#x2705; landed"]]),
  "mv .spndevex/workstreams/open/001-a-subject .spndevex/workstreams/closed/001-a-subject",
  "speaks", { says: "1 row landed" });

// KNOWN-BAD — every move that closed nothing and must stay silent.
one("backlog moving into open is work starting, not finishing",
  build("cl-start", [["a", "spn-foundation", "&#x2705; landed"]], "backlog"),
  "mv .spndevex/workstreams/backlog/001-a-subject .spndevex/workstreams/open/",
  "silent");

one("an ordinary move inside a repository",
  build("cl-repo", [["a", "spn-foundation", "&#x2705; landed"]]),
  "mv spn-support-ts/src/a.ts spn-support-ts/src/b.ts",
  "silent");

one("a command that moves nothing",
  build("cl-nothing", [["a", "spn-foundation", "&#x2705; landed"]]),
  "git status --short",
  "silent");

one("a loose file moved into closed/ is not a scope finishing",
  build("cl-file", [["a", "spn-foundation", "&#x2705; landed"]]),
  "mv notes.md .spndevex/workstreams/closed/",
  "silent");

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
