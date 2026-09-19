// `orientation` — its output IS the session's first screen, so the test is a byte-for-byte diff of
// the two implementations. The real workspace covers the ordinary case; fixtures cover the states
// this workspace is not in and would otherwise never be exercised: day zero, a workspace with no
// workstreams, one with exactly one open (the standing offer), and the legacy shapes.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

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

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

// A THROWAWAY ROOT, MADE FRESH EACH RUN. This named a session scratchpad that no longer
// exists on any other machine, so the suite passed only where it was written.
const BASE = mkdtempSync(join(tmpdir(), "t-orientation-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

function run(cmd, args, cwd) {
  try { return execFileSync(cmd, args, { encoding: "utf8", cwd, maxBuffer: 16 * 1024 * 1024 }); }
  catch (e) { return `ERROR ${String(e.stderr ?? e.message).slice(0, 400)}`; }
}

let n = 0, failed = 0;

/** Both implementations against one root, compared line for line. */
function compare(label, root, mustSay = [], mustNotSay = []) {
  n += 1;
  const py = hasPython("orientation.py") ? run("python3", [`${SCRIPTS}/orientation.py`, root], root) : null;
  const ts = run("node", [`${HOOKS}/docs/orientation.ts`, root], root);
  const identical = py === null || py === ts;
  const says = mustSay.every((s) => ts.includes(s));
  const quiet = mustNotSay.every((s) => !ts.includes(s));
  const ok = identical && says && quiet && !ts.startsWith("ERROR");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}\n        identical ${identical}${mustSay.length ? ` · says what it must ${says}` : ""}${mustNotSay.length ? ` · silent where it must be ${quiet}` : ""}`);
  if (!identical) {
    const p = py.split("\n"), t = ts.split("\n");
    let shown = 0;
    for (let i = 0; i < Math.max(p.length, t.length) && shown < 6; i += 1)
      if (p[i] !== t[i]) { console.log(`        line ${i + 1}\n          py |${p[i] ?? "(none)"}|\n          ts |${t[i] ?? "(none)"}|`); shown += 1; }
  }
  return ts;
}

function fixture(name, files = {}, folders = []) {
  const root = join(BASE, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  for (const dir of folders) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
}

const repo = (type, extra = {}) => JSON.stringify({ type, config: extra }, null, 2);

// THE CORPUS CASES NEED THE WORKSPACE THIS PLUGIN NORMALLY SITS IN. Run from a copy somewhere else
// — which is how the port was proven against a tree with no `hooks/scripts/` — there is no workspace
// above it to read, and a case that cannot run must say so rather than fail.
const IN_WORKSPACE = existsSync(resolve(WORKSPACE, ".spndevex"));

console.log(IN_WORKSPACE ? "\n=== orientation — the real workspace"
  : "\n=== orientation — the real workspace: not run, this copy sits outside one");
if (IN_WORKSPACE) compare("this workspace, as a window actually sees it", `${WORKSPACE}`,
  ["Welcome to SaaS Plane", `workspace  ${WORKSPACE}`, "workstreams", "So — what are we building?"]);

console.log("\n=== orientation — the states this workspace is not in");

compare("day zero: no sprepo.json anywhere",
  fixture("day-zero", { "README.md": "nothing here yet\n", ".spndevex/README.md": "the workspace state, and no repo cloned yet\n" }),
  ["This folder is empty, which is a good place to start"],
  ["workstreams", "wired"]);

compare("an estate-only workspace, rung 1",
  fixture("estate-only", {
    "spn-infra/sprepo.json": repo("INFRA"),
    "spn-infra/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-core@saasplane": true, "spn-infra@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["spn-infra", "INFRA", "wired", "none yet"]);

compare("an APPS repo carrying no CONCEPT.md, rung 2",
  fixture("no-concept", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-core@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["UNWIRED"]);

// EXACTLY ONE OPEN, NO OTHER SESSION — the standing offer. This workspace can never show it while
// three other windows are live here, so it exists only as a fixture.
const one = compare("exactly one workstream open: the standing offer appears",
  fixture("one-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-core@saasplane": true, "spn-apps-ts@saasplane": true } }),
    ".spndevex/workstreams/open/042-widget-pricing/arcs/N1-a.md": "# arc\n",
    ".spndevex/workstreams/open/042-widget-pricing/widget-pricing-approach.html": "<html></html>",
    ".spndevex/workstreams/backlog/043-parked/arcs/N1-a.md": "# arc\n",
    ".spndevex/workstreams/closed/041-finished/arcs/N1-a.md": "# arc\n",
  }),
  ["Or ask me to continue 042 widget-pricing", "1 open · 1 backlog · 1 closed", "file://", "041-finished"]);

compare("two open: no offer is made, because naming one would be choosing for you",
  fixture("two-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    ".spndevex/workstreams/open/042-widget-pricing/arcs/N1-a.md": "# arc\n",
    ".spndevex/workstreams/open/044-another/arcs/N1-a.md": "# arc\n",
  }),
  ["2 open"], ["Or ask me to continue"]);

compare("the legacy shapes still read: sessions/ and a bare arc",
  fixture("legacy", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    ".spndevex/sessions/open/old-subject/arcs/N1-a.md": "# arc\n",
    ".spndevex/arcs/arc-older-subject.md": "# arc\n",
    ".spndevex/notes/older-subject-approach.html": "<html></html>",
  }),
  ["still in sessions/", "still in arcs/"]);

compare("a repo with no claim at all reports one, rather than guessing",
  fixture("no-claim", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "some-repo/.git/HEAD": "ref: refs/heads/main\n",
    ".spndevex/README.md": "state\n",
  }),
  ["no claim"]);

console.log(IN_WORKSPACE ? "\n=== orientation — the hook form, which is what a window actually runs"
  : "\n=== orientation — the hook form: not run, this copy sits outside a workspace");
if (IN_WORKSPACE) {
  n += 1;
  const root = `${WORKSPACE}`;
  const payload = JSON.stringify({ cwd: root, session_id: "t-orientation" });
  const one = (cmd, args) => {
    try { return execFileSync(cmd, args, { input: payload, encoding: "utf8", cwd: root, maxBuffer: 16 * 1024 * 1024 }).trim(); }
    catch (e) { return `ERROR ${e.stderr}`; }
  };
  const py = hasPython("orientation.py") ? one("python3", [`${SCRIPTS}/orientation.py`, "--stdin"]) : null;
  const ts = one("node", [`${HOOKS}/docs/orientation.ts`, "--stdin"]);
  // COMPARED AS PARSED OBJECTS, NOT AS TEXT. Python's json.dumps puts a space after each separator
  // and JSON.stringify does not, so the two strings differ while carrying identical content — and
  // the harness reads the parsed object, never the bytes.
  const same = (a, b) => JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
  let ok = false;
  try { ok = same(py, ts); } catch { ok = false; }
  let shape = false;
  try {
    const parsed = JSON.parse(ts);
    shape = Boolean(parsed.systemMessage) &&
      parsed.hookSpecificOutput?.hookEventName === "SessionStart" &&
      parsed.hookSpecificOutput.additionalContext.startsWith(parsed.systemMessage) &&
      parsed.hookSpecificOutput.additionalContext.includes("Ground, read at load");
  } catch { shape = false; }
  ok = ok && shape;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  --stdin returns one JSON object, identical to the Python\n        same content ${ok || "false"} · systemMessage plus the agent's extra line ${shape}`);
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
