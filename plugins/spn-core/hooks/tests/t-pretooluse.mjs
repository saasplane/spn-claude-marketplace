// `pretooluse` — the dispatcher. Its job is not to decide anything itself but to make sure every
// check's verdict SURVIVES, which is exactly what the Python one failed at.
//
// So the known-bad set here is one refusal per check routed through the chain, plus the two the
// Python dropped on the floor, plus the generated-file guard it absorbed from a shell script.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "./fixture.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
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

const BASE = "/private/tmp/claude-501/-opt-work-saasplane-code/ca4d9391-8043-477a-926d-fabfa4253bdf/scratchpad/fixtures/dispatch";

function verdict(out) {
  if (!out) return ["silent", ""];
  try {
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    const specific = parsed.hookSpecificOutput ?? {};
    const text = specific.permissionDecisionReason ?? specific.additionalContext ?? parsed.systemMessage ?? "";
    return [specific.permissionDecision === "deny" ? "deny" : "note", text];
  } catch { return ["unparsable", out.slice(0, 200)]; }
}

function run(cmd, args, payload, cwd) {
  try { return verdict(execFileSync(cmd, args, { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim()); }
  catch (e) { return ["error", String(e.stderr ?? e.message).slice(0, 300)]; }
}

let n = 0, failed = 0;
function one(label, payload, expect, { says, cwd = `${WORKSPACE}`, parity = true, why = "" } = {}) {
  n += 1;
  const [ts, tsWhy] = run("node", [`${HOOKS}/docs/pretooluse.ts`], payload, cwd);
  const [py] = hasPython("pretooluse.py") ? run("python3", [`${SCRIPTS}/pretooluse.py`], payload, cwd) : [null];
  const saysOk = !says || tsWhy.toLowerCase().includes(says.toLowerCase());
  const ok = ts === expect && saysOk && (py === null || !parity || ts === py);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${ts} · py ${py}${says ? ` · names "${says}" ${saysOk}` : ""}${parity ? "" : ` (parity waived: ${why})`}`);
  if (!ok) console.log(`        ts said: ${tsWhy.slice(0, 340)}`);
}

console.log("\n=== pretooluse — every check still reaches the turn through the chain");

// KNOWN-BAD, one per check.
one("env-seat's refusal survives the chain",
  { tool_name: "Bash", tool_input: { command: "cat ~/.spnenv" } }, "deny", { says: "renders ~/.spnenv" });

{
  // contract-cycle needs a real seat on disk.
  const dir = join(BASE, "states", "src", "contract", "states");
  rmSync(join(BASE, "states"), { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "app.ts"), "import { R } from './role';\nexport type App = R;\n");
  writeFileSync(join(dir, "role.ts"), "export type R = string;\n");
  one("contract-cycle's refusal survives the chain",
    { tool_name: "Write", tool_input: { file_path: join(dir, "role.ts"), content: "import { App } from './app';\nexport type R = App;\n" } },
    "deny", { says: "dependency cycle" });
}

one("doc-check's finding survives the chain",
  { tool_name: "Write", tool_input: {
    file_path: `${WORKSPACE}/spn-foundation/docs/03-capabilities/05-docs/probe.md`,
    content: "# A chapter\n\nYou will find that this one sentence runs on and on and on past the bar the " +
      "book sets for it, because it keeps adding clause after clause after clause until nobody reading " +
      "it can remember how it began or what it was ever meant to say.\n" } },
  "note", { says: "past thirty words" });

one("the generated-file guard, folded in from the shell script",
  { tool_name: "Write", tool_input: { file_path: `${WORKSPACE}/spn-support-ts/src/contract/validators/thing.ts`, content: "x" } },
  "deny", { says: "generated Zod validator" });

one("generated build output is refused too",
  { tool_name: "Write", tool_input: { file_path: `${WORKSPACE}/spn-support-ts/dist/generated/thing.ts`, content: "x" } },
  "deny", { says: "generated build output" });

{
  // split-plan's close gate, through the chain.
  const root = workspace("dispatch-close", {
    ".spndevex/workstreams/open/001-a-subject/a-subject-approach.html":
      `<div class="eyebrow">Workstream 001 &middot; closed</div><section id="s3"><table>
        <thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
        <tbody><tr><td>a</td><td>spn-foundation</td><td></td></tr></tbody></table></section>`,
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-x.md": "# Arc\n\n## Log\n\n- **2026-09-18 — go.**\n",
  });
  one("split-plan's close refusal survives the chain",
    { tool_name: "Bash", cwd: root, tool_input: { command: "mv .spndevex/workstreams/open/001-a-subject .spndevex/workstreams/closed/" } },
    "deny", { says: "row nobody decided", cwd: root });
}

{
  // F9 — the one the Python dropped on the floor every single time.
  const root = workspace("dispatch-confirmed", {
    ".spndevex/workstreams/open/001-a-subject/arcs/N1-x.md": "# Arc\n\n## Log\n\n- **2026-09-18 — opened.**\n",
    "spn-support-ts/src/existing.ts": "export const x = 1;\n",
  });
  one("F9: confirmed's warning now reaches the turn",
    { tool_name: "Write", cwd: root, session_id: "d1", tool_input: { file_path: "spn-support-ts/src/probe.ts", content: "x" } },
    "note", { says: "no open workstream records a go", cwd: root,
              parity: false, why: "the Python dispatcher discarded it — this is finding F9" });
}

{
  // STEP 7 — the mirror nudge, reached through the chain. It is not a port, so there is nothing to
  // compare against: the Python dispatcher never carried it.
  const root = workspace("dispatch-mirror", {
    "pkg/docs/03-capabilities/README.md":
      "# Capabilities\n\n## Map\n\n| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| [app.md](app.md) | [`src/app/`](../../src/app) | the seams | \u2705 |\n",
    "pkg/src/app/Service.ts": "export const x = 1;\n",
  });
  one("the mirror nudge reaches the turn through the dispatcher",
    { tool_name: "Edit", cwd: root, session_id: "m1",
      tool_input: { file_path: `${root}/pkg/src/app/Service.ts`, new_string: "export const x = 2;" } },
    "note", { says: "is the mirror of `src/app/`", cwd: root,
              parity: false, why: "step 7 is new work, and the Python dispatcher never carried it" });

  one("an edit under a src/ no mirror governs stays silent",
    { tool_name: "Edit", cwd: root, session_id: "m2",
      tool_input: { file_path: `${root}/pkg/src/migrations/001.ts`, new_string: "x" } },
    "silent", { cwd: root });
}

// UNTOUCHED — the ordinary calls that must stay silent and cheap.
one("an ordinary Bash call", { tool_name: "Bash", tool_input: { command: "git status --short" } }, "silent");
one("reading a source file", { tool_name: "Read", tool_input: { file_path: `${WORKSPACE}/CLAUDE.md` } }, "silent");
one("editing an ordinary source file",
  { tool_name: "Edit", tool_input: { file_path: `${WORKSPACE}/spn-support-ts/src/thing.ts`, new_string: "export const x = 2;" } }, "silent");
one("a malformed payload allows", {}, "silent");

console.log("\n=== pretooluse — the chain's cost per call");
{
  const RUNS = 15;
  const median = (fn) => {
    const times = [];
    for (let i = 0; i < RUNS; i += 1) { const t0 = performance.now(); fn(); times.push(performance.now() - t0); }
    return times.sort((a, b) => a - b)[Math.floor(RUNS / 2)];
  };
  const cases = {
    "an ordinary Bash call": { tool_name: "Bash", tool_input: { command: "git status --short" } },
    "an edit to a source file": { tool_name: "Edit", tool_input: { file_path: `${WORKSPACE}/spn-support-ts/src/a.ts`, new_string: "x" } },
  };
  for (const [label, payload] of Object.entries(cases)) {
    const py = median(() => run("python3", [`${SCRIPTS}/pretooluse.py`], payload, `${WORKSPACE}`));
    const ts = median(() => run("node", [`${HOOKS}/docs/pretooluse.ts`], payload, `${WORKSPACE}`));
    console.log(`  ${label.padEnd(26)} python3 ${py.toFixed(1).padStart(6)} ms   node ${ts.toFixed(1).padStart(6)} ms   (whole chain, start-up included)`);
  }
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
