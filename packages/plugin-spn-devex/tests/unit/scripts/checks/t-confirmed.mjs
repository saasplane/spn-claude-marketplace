import { PLUGIN } from "../../../helpers/harness.mjs";
// `confirmed` — the known-bad is a repository write with no go recorded anywhere; the untouched is
// the same write once an arc logs one.
//
// PARITY IS CHECKED AGAINST THE PYTHON CALLED DIRECTLY, not through the dispatcher: through the
// dispatcher the Python says nothing at all, which is finding F9 and the reason for the port. So the
// comparison is against its plain-text output, which is the verdict it was always trying to give.
import { execFileSync } from "node:child_process";
import { workspace } from "../../../helpers/fixture.mjs";

import { existsSync } from "node:fs";
import { resolve } from "node:path";
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


const arc = (go) =>
  "# Arc — a subject\n\nStatus: **RUNNING**\n\n## Log\n\n- **2026-09-18 — opened.** Split out.\n" +
  (go ? "- **2026-09-18 — go.** The developer said finish it.\n" : "");

function build(name, go) {
  return workspace(name, {
    [`.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md`]: arc(go),
    "spn-support-ts/src/existing.ts": "export const x = 1;\n",
  });
}

function ts(payload, cwd) {
  try {
    return execFileSync("node", [`${HOOKS}/src/scripts/checks/confirmed.ts`], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim();
  } catch (e) { return `ERROR: ${e.stderr ?? e.message}`; }
}

function py(payload, cwd) {
  // The incumbent runs only while it is installed. After the reinstall deletes
  // `hooks/scripts/` there is nothing to compare against, and the case still asserts its own
  // expectation — which is the half that outlives the port.
  if (!hasPython("confirmed.py")) return null;
  try {
    return execFileSync("python3", ["-c", `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("confirmed", "${SCRIPTS}/confirmed.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.gate_confirmed(json.load(sys.stdin))
`], { input: JSON.stringify(payload), encoding: "utf8", cwd }).trim();
  } catch (e) { return `ERROR: ${e.stderr ?? e.message}`; }
}

const noteOf = (out) => {
  if (!out) return "";
  try { const p = JSON.parse(out.split("\n").filter(Boolean).at(-1));
        return p.hookSpecificOutput?.additionalContext ?? p.systemMessage ?? ""; }
  catch { return out; }
};

let n = 0, failed = 0;
function one(label, { go, path, session, tool = "Write" }, expect) {
  n += 1;
  const root = build(`confirmed-${n}`, go);
  // A SEPARATE SESSION ID PER IMPLEMENTATION. The warning is once per session, remembered on disk,
  // so whichever ran first would silence the other and the comparison would read as a mismatch.
  const payload = (who) => ({ tool_name: tool, cwd: root, session_id: `${session ?? `s${n}`}-${who}`,
                    tool_input: tool === "Bash" ? { command: "ls" } : { file_path: path, content: "x" } });
  const tsNote = noteOf(ts(payload("ts"), root));
  const pyNote = py(payload("py"), root);
  const spoke = Boolean(tsNote);
  const agrees = pyNote === null || (spoke === Boolean(pyNote) && (!spoke || tsNote === pyNote));
  const ok = spoke === (expect === "note") && agrees;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        expect ${expect} · ts ${spoke ? "note" : "silent"} · py ${pyNote === null ? "not installed" : pyNote ? "note" : "silent"} · words match ${agrees}`);
  if (!ok) console.log(`        ts: ${tsNote.slice(0, 200)}\n        py: ${(pyNote ?? "").slice(0, 200)}`);
  return root;
}

console.log("\n=== confirmed");
// KNOWN-BAD
one("a repository write with no go recorded", { go: false, path: "spn-support-ts/src/probe.ts" }, "note");
one("a write into a second repository, still no go", { go: false, path: "spn-platform-ts/src/a.ts" }, "note");
// UNTOUCHED
one("the same write once an arc logs a go", { go: true, path: "spn-support-ts/src/probe.ts" }, "silent");
one("writing the plan itself is how a go is earned", { go: false, path: `.spndevex/${WORKSTREAMS}/open/001-a-subject/arcs/N1-something.md` }, "silent");
one("wiring the window is not executing the plan", { go: false, path: ".claude/settings.json" }, "silent");
one("reading a repository file is not writing to it", { go: false, path: "spn-support-ts/src/existing.ts", tool: "Read" }, "silent");
one("a Bash call carries no file_path", { go: false, tool: "Bash" }, "silent");

// The no-nag rule needs two writes in ONE workspace and ONE session, so it is run on its own.
{
  const root = build("confirmed-nag", false);
  const payload = { tool_name: "Write", cwd: root, session_id: "same-session",
                    tool_input: { file_path: "spn-support-ts/src/probe.ts", content: "x" } };
  const first = noteOf(ts(payload, root));
  const second = noteOf(ts(payload, root));
  const ok = Boolean(first) && !second;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  it warns once and the second write in the same session is silent\n        first ${first ? "note" : "silent"} · second ${second ? "note" : "silent"}`);
  n += 1;
}

console.log(failed ? `  ${failed} FAILED` : `  all ${n} passed`);
process.exit(failed ? 1 : 0);
