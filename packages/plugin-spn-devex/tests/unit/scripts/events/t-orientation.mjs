// `orientation` — its output IS the session's first screen, so the test is a byte-for-byte diff of
// the two implementations. The real workspace covers the ordinary case; fixtures cover the states
// this workspace is not in and would otherwise never be exercised: day zero, a workspace with no
// workstreams, one with exactly one open (the standing offer), and the legacy shapes.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, symlinkSync } from "node:fs";
import { join } from "node:path";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { SESSION_START_CEILING, SESSION_START_NOTE, WELCOME_LEAD, fitSessionStart, orient, workstreams } from "../../../../src/scripts/events/orientation.ts";

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
  const ts = run("node", [`${HOOKS}/src/scripts/events/orientation.ts`, root], root);
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
  ["Welcome back to SaaS Plane!", "🧭 I work with you through", "The ground is read on asking", "So — what are we building?"],
  ["Your team's time belongs to your product.", "I am the DevEx agent"]);

console.log("\n=== orientation — the states this workspace is not in");

compare("day zero: no sprepo.json anywhere, and workspace init already ran",
  fixture("day-zero", { "README.md": "nothing here yet\n", ".spndevex/README.md": "the workspace state, and no repo cloned yet\n" }),
  ["Your workspace is set up, and it holds no repository yet",
   // Act 0 is a door, and the render has to BE the door rather than announce a form. The screen
   // that said "I have five questions" opened the walk on a question nobody had agreed to answer.
   "Would you like to start a new platform?", "lands in a file as you give it",
   "Say yes and I open a workstream to hold your answers",
   "act 1 has already run — `spnutils workspace init` minted this folder, so do not run it again"],
  [WORKSTREAMS, "wired", "So — what are we building?", "I mint the workspace", "This folder is empty"]);

// THE BUILDER'S EMPTY FOLDER. Plugins installed at user scope reach a folder nobody minted, and there
// act 1 is still owed — so the door offers it. `orient` is handed its root: with no `.spndevex/` to stop
// at, the walk from a temp folder climbs into whatever other suites left beside it.
{
  n += 1;
  const bare = fixture("day-zero-unminted", { "README.md": "nothing here yet\n" });
  const [message, context] = orient(bare, bare);
  const ok = message.includes("This folder is empty, which is a good place to start")
    && message.includes("Say yes and I mint the workspace, open a workstream to hold your answers")
    && context.includes("act 1 mints the workspace and act 2")
    && !message.includes("Your workspace is set up") && !context.includes("act 1 has already run");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  day zero: an empty folder nobody minted`);
}

// THE WINDOW THAT CLOSES AFTER THE THIRD QUESTION. Still no sprepo.json, so this is still day 0 —
// and offering the door again asks somebody to name their organization twice. The screen has to
// find the workstream its own act 2 opened.
compare("day zero resumed: a new-platform workstream is already open",
  fixture("day-zero-resumed", {
    "README.md": "nothing here yet\n",
    ".spndevex/README.md": "the workspace state, and no repo cloned yet\n",
    [`.spndevex/${WORKSTREAMS}/open/001-new-platform/arcs/N001/state.json`]: "{}\n",
  }),
  ["You started a platform here and we did not finish", "001-new-platform",
   "Shall we carry on?", "Read its arc BEFORE you say anything"],
  ["Would you like to start a new platform?", "So — what are we building?"]);

// A `.spndevex/` HOLDING NOTHING BUT `.debug/` IS NO WORKSPACE. A Stop hook once wrote its session notes
// wherever a window stopped, so `/tmp` grew one, and every partner repository under it was told day 0.
compare("a partner's repository below a folder whose .spndevex holds only .debug: not day 0",
  join(fixture("stray-debug", {
    ".spndevex/.debug/sessions/s1/stop.json": "{}\n",
    "partner/acme-orders/sprepo.json": repo("APPS", { stack: "TS" }),
  }), "partner", "acme-orders"),
  ["1 repo"], ["This folder is empty", "Day-0 mode", "no sprepo.json under"]);

compare("an estate-only workspace, rung 1",
  fixture("estate-only", {
    "spn-infra/sprepo.json": repo("INFRA"),
    "spn-infra/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-infra@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["1 repo · rung 1: estate only — no APPS repo yet"], ["none yet"]);

compare("an APPS repo carrying no CONCEPT.md, rung 2",
  fixture("no-concept", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["1 repo · 1 unwired"], ["UNWIRED"]);

// EXACTLY ONE OPEN, NO OTHER SESSION — the standing offer. This workspace can never show it while
// three other windows are live here, so it exists only as a fixture.
const one = compare("exactly one workstream open: the standing offer appears",
  fixture("one-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-surface@saasplane": true, "spn-apps@saasplane": true } }),
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/widget-pricing-approach.html`]: "<html></html>",
    [`.spndevex/${WORKSTREAMS}/backlog/043-parked/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1/state.json`]: "{}\n",
  }),
  ["Or ask me to continue 042 widget-pricing", "1 workstream open (042) · 1 in backlog"], ["041-finished", "file://"]);

// ARCS NUMBERED WITH THREE DIGITS ARE COUNTED, beside one numbered with one digit, each by its data. The
// notes folder `notes/N001/` holds no arc, whatever sits in it, and a Markdown arc file is no arc.
const threeDigit = fixture("three-digit-arcs", {
  "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
  "spn-app-ts/CONCEPT.md": "# concept\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N001/state.json`]: "{}\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N002/state.json`]: "{}\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N3/state.json`]: "{}\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N9-the-old-form.md`]: "# arc\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/notes/N001/plan.md`]: "# plan\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/notes/N001/samples/close-message.md`]: "Closing.\n",
  [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/approach.html`]: "<html></html>",
});
// The ground is read on asking now, so the count is read from the function the status command shares.
{
  n += 1;
  const ok = workstreams(threeDigit).length === 1 && workstreams(threeDigit)[0].arcs === 3;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  arcs kept as data N001, N002 and N3 are counted, and neither notes/N001/ nor a Markdown arc file is`);
}

compare("two open: no offer is made, because naming one would be choosing for you",
  fixture("two-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/open/044-another/arcs/N1/state.json`]: "{}\n",
  }),
  ["2 workstreams open (042, 044)"], ["Or ask me to continue"]);

// THE CONTAINER'S OLDER NAME STILL READS, and a bare Markdown arc under `.spndevex/arcs/`, the shape
// before workstreams, is no workstream.
const legacyRoot = fixture("legacy", {
  "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
  "spn-app-ts/CONCEPT.md": "# concept\n",
  ".spndevex/sessions/open/old-subject/arcs/N1/state.json": "{}\n",
  ".spndevex/arcs/arc-older-subject.md": "# arc\n",
});
{
  n += 1;
  const found = workstreams(legacyRoot);
  const ok = found.length === 1 && found[0].legacy === "sessions/" && found[0].subject === "old-subject";
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  the container's older name still reads: sessions/, and a bare arc file is no workstream`);
}

compare("a repo with no claim at all still counts as a member, rather than being guessed at",
  fixture("no-claim", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "some-repo/.git/HEAD": "ref: refs/heads/main\n",
    ".spndevex/README.md": "state\n",
  }),
  ["2 repos"]);

// A WORKTREE SET OUTLIVES ITS WORKSTREAM ONLY BY NEGLECT (RULE.DEVEX.WORKSPACE.325). The status line names each
// one, the way it names a branch behind develop: a set whose workstream is in `closed/`, and a set no
// workstream folder carries. A set whose workstream is open or in backlog is in use, and says nothing.
const SETS = (extra = {}) => ({
  "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
  "spn-app-ts/CONCEPT.md": "# concept\n",
  [`.spndevex/${WORKSTREAMS}/open/031-in-use/arcs/N1/state.json`]: "{}\n",
  [`.spndevex/${WORKSTREAMS}/closed/033-finished/arcs/N1/state.json`]: "{}\n",
  ".worktrees/031-in-use/spn-app-ts/README.md": "a worktree\n",
  ...extra,
});
const left = compare("sets left behind: one for a closed workstream, one no workstream names",
  fixture("sets-left", SETS({
    ".worktrees/033-finished/spn-app-ts/README.md": "a worktree\n",
    ".worktrees/031-release/spn-app-ts/README.md": "a worktree\n",
  })),
  ["2 worktree sets left behind, remove each: " +
     ".worktrees/033-finished (033 is closed: spnutils workspace worktree remove 033), " +
     ".worktrees/031-release (no workstream has this name: git worktree remove, in each repository)"],
  [".worktrees/031-in-use"]);
{
  n += 1;
  const status = left.split("\n").find((line) => line.includes("worktree sets left behind")) ?? "";
  const ok = status.startsWith("1 repo · 1 workstream open (031)") && status.split("\n").length === 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  and they sit on the one status line, after the workstreams${ok ? "" : ` — ${status}`}`);
}
compare("no set on disk: the status line says nothing about sets", fixture("sets-none", SETS({ ".worktrees/031-in-use/spn-app-ts/README.md": "a worktree\n" })),
  ["1 workstream open (031)"], ["worktree set", "left behind"]);
compare("no .worktrees folder at all: the status line says nothing about sets", fixture("sets-no-folder", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    [`.spndevex/${WORKSTREAMS}/closed/033-finished/arcs/N1/state.json`]: "{}\n",
  }), ["1 repo"], ["worktree set", "left behind"]);
{
  // A window inside a set stands on the set as its root, with `.spndevex` and each member linked in.
  n += 1;
  const home = fixture("sets-from-within", SETS({ ".worktrees/033-finished/spn-app-ts/README.md": "a worktree\n" }));
  const inSet = join(home, ".worktrees", "031-in-use");
  symlinkSync(join(home, ".spndevex"), join(inSet, ".spndevex"));
  symlinkSync(join(home, "spn-app-ts"), join(inSet, "spn-app-ts-link"));
  const [, context] = orient(inSet, inSet);
  const ok = context.includes("1 worktree set left behind, remove it: .worktrees/033-finished (033 is closed:");
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  a window inside a set reads the sets from the workspace root above it`);
}

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
  const ts = one("node", [`${HOOKS}/src/scripts/events/orientation.ts`, "--stdin"]);
  // COMPARED AS PARSED OBJECTS, NOT AS TEXT. Python's json.dumps puts a space after each separator
  // and JSON.stringify does not, so the two strings differ while carrying identical content — and
  // the harness reads the parsed object, never the bytes.
  const same = (a, b) => JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
  // THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GONE. `hasPython` already guarded the
  // run; the comparison did not, so a null `py` threw inside `same` and the case read as a
  // disagreement with something that is not there. With no Python to agree with, what the case
  // still asserts is the half that outlives the port: the shape this hook must return.
  let ok = py === null;
  if (py !== null) { try { ok = same(py, ts); } catch { ok = false; } }
  let shape = false;
  try {
    const parsed = JSON.parse(ts);
    shape = Boolean(parsed.systemMessage) &&
      parsed.hookSpecificOutput?.hookEventName === "SessionStart" &&
      parsed.hookSpecificOutput.additionalContext.startsWith(`${WELCOME_LEAD}\n\n${parsed.systemMessage}`) &&
      parsed.hookSpecificOutput.additionalContext.includes("The ground is read on asking");
  } catch { shape = false; }
  ok = ok && shape;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  --stdin returns one JSON object${py === null ? "" : ", identical to the Python"}\n        ${py === null ? "no Python to compare — shape only" : `same content ${ok || "false"}`} · systemMessage plus the agent's extra line ${shape}`);
}

console.log("\n=== a window says when it loaded wiring older than what is installed");
{
  // N16 step 3. The copy is a COPY rather than a symlink on purpose: Node resolves a symlink when it
  // computes `import.meta.url`, so a symlinked fixture would report the source path and prove
  // nothing. A real install is a copy, which is the shape being tested.
  const cache = join(BASE, "pc", "plugins", "cache", "saasplane", "spn-devex");
  mkdirSync(join(cache, "9.9.9"), { recursive: true });
  mkdirSync(join(cache, "0.0.1"), { recursive: true });
  // The installed plugin IS `src/`, so the cache holds `scripts/` and not `hooks/` — the test
  // copies what a partner actually receives.
  cpSync(join(HOOKS, "src", "scripts"), join(cache, "0.0.1", "scripts"), { recursive: true });
  // The scripts import the shared `plugin-support-lib/src/lib/` by relative path, and an install
  // receives it bundled into `dist/`. The copy runs the `.ts` source, so the shared folder sits
  // where that relative path lands, four levels above `scripts/events/`.
  cpSync(join(HOOKS, "..", "plugin-support-lib", "src", "lib"), join(cache, "..", "plugin-support-lib", "src", "lib"), { recursive: true });
  // A workspace of its own, never the one this checkout sits in: a runner holds no sibling checkouts.
  const ROOT = join(BASE, "ws");
  mkdirSync(join(ROOT, ".spndevex"), { recursive: true });
  mkdirSync(join(ROOT, "spn-infra"), { recursive: true });
  writeFileSync(join(ROOT, "spn-infra", "sprepo.json"), JSON.stringify({ type: "INFRA" }));
  const installed = join(cache, "0.0.1", "scripts", "events", "orientation.ts");

  const check = (label, text, must, mustNot = []) => {
    n += 1;
    const ok = must.every((m) => text.includes(m)) && mustNot.every((m) => !text.includes(m));
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  };

  check("a window behind the newest install says so, and names both versions",
    run("node", [installed, ROOT], ROOT),
    ["this window loaded", "0.0.1", "9.9.9", "take a fresh window"]);

  // N33's lesson, as a case: a retired install carries `.orphaned_at` and nothing loads it, so a
  // clock that counts one reports a window behind a version that no longer exists.
  writeFileSync(join(cache, "9.9.9", ".orphaned_at"), "retired\n");
  check("a retired install is a corpse and does not count",
    run("node", [installed, ROOT], ROOT),
    [], ["this window loaded"]);
  rmSync(join(cache, "9.9.9", ".orphaned_at"), { force: true });

  // The everyday case, and the one that must never speak: a checkout is not behind an install.
  check("running from source says nothing — a checkout IS the source",
    run("node", [`${HOOKS}/src/scripts/events/orientation.ts`, ROOT], ROOT),
    [], ["this window loaded"]);
}

// ── the closing question is CONDITIONAL, and the hook cannot see the condition (N54) ──

// `SessionStart` fires before the developer has typed, so the script cannot know whether the first
// message carries a handover block. The question is therefore always right to EMIT, and the thing
// that had to change is the instruction the agent reads beside it. A developer who arrives with a
// handover block and is asked "what are we building?" has to retype what the block already said —
// and a handover block is the one artifact built to stop work living only in a conversation.
//
// So this case asserts both halves at once: the ground is unchanged, and the note now carries the
// condition. Asserting only the note would pass over a regression that silenced the question.
console.log("\n=== orientation — the closing question is asked only when nothing was said");

{
  /** Same tally as `compare`, for assertions over one captured render rather than two. */
  const says = (label, ok) => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  };

  const ground = fixture("conditional-ask", {
    "spn-infra/sprepo.json": repo("INFRA"),
    ".spndevex/README.md": "state\n",
  });
  const text = run("node", [`${HOOKS}/src/scripts/events/orientation.ts`, ground], ground);

  says("the ground still ends with the question, because the hook cannot see the first message",
    text.includes("So — what are we building?"));
  says("and the note now makes asking it conditional",
    text.includes("Ask the closing question ONLY when the first message does not say what to do"));
  says("it names what replaces the question, rather than only forbidding it",
    text.includes("A handover block, an arc name, or any named next step replaces it"));
  says("and the standing offer is the script's to print, only with exactly one workstream open and no other session live",
    !text.includes("Or ask me to continue") && !text.includes("The standing offer"));
}

// ── the welcome, and one status line (N116 row 6 item 2) ──
//
// THE WELCOME IS COMPARED WORD FOR WORD, because it is approved text and a paraphrase is a change
// nobody reviewed. HOME is pointed at a fixture so the name the heading greets is chosen here rather
// than read from whoever runs the suite, and so no real plugin cache reaches the status line.
console.log("\n=== orientation — the welcome word for word, and one status line");
{
  const says = (label, ok) => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  };

  const BODY = [
    "*The AI-native, DevEx-first Foundation for Building and Launching Secure, Scalable, Compliance-ready SaaS Platforms.*",
    "\n&nbsp;\n",
    "🤖 **I'm your DevEx agent.** Think of me as the engineering teammate who has read every standard in this workspace, so your time can go to the product.",
    "\n&nbsp;\n",
    "🧭 I work with you through the whole software lifecycle, five phases and the eight stages inside them: **Start** (Bootstrap, Source control), **Plan** (Ideate), **Build** (Develop, Test), **Ship** (Provision, Deliver) and **Run** (Operate). Each stage has its own standards and its own proof, and I carry both for you.",
    "\n&nbsp;\n",
    "👥 I look at the work through every role on your team: **Leadership** (Chief executive, Engineering leader), **Engineering** (Architect, Backend developer, Web developer, Quality engineer, DevOps / SRE, DevSecOps / Security), **Product and design** (Product manager, UX designer, UI designer, Editor), **Data and AI** (Data lead, AI lead), **Go-to-market** (Product marketer, Sales lead, Growth lead, Customer success lead) and **Finance and business** (Finance lead, Business manager). Tell me whose view you need, and I'll bring it.",
  ].join("\n");
  const PARTNER_SENTENCE = "And I speak for every partner who builds on SaaS Plane, so a change of ours never breaks them without a version and a way across. ";
  const BUILDER_BODY = BODY.replace("Tell me whose view", PARTNER_SENTENCE + "Tell me whose view");
  /** The approved welcome under `heading`, then exactly one status line, and nothing else. */
  const isWelcome = (message, heading) => message.startsWith(`${heading}\n\n${BODY}\n\n&nbsp;\n\n`)
    && message.slice(`${heading}\n\n${BODY}\n\n&nbsp;\n\n`.length).split("\n").filter(Boolean).length === 1;
  const statusOf = (message) => message.split("\n").filter(Boolean).at(-1);

  const home = (name) => {
    const dir = join(BASE, `home-${name ?? "anonymous"}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, ".claude.json"),
      JSON.stringify(name ? { oauthAccount: { displayName: `${name} Tester` } } : {}), "utf8");
    return dir;
  };
  const hook = (root, name, script = `${HOOKS}/src/scripts/events/orientation.ts`, workspaceKey = null) => {
    const env = { ...process.env, HOME: home(name), SPN_TELEMETRY: "off" };
    delete env.SPN_DEVEX_AGENT_WORKSPACE;
    if (workspaceKey !== null) env.SPN_DEVEX_AGENT_WORKSPACE = workspaceKey;
    try {
      const out = execFileSync("node", [script, "--stdin"], {
        input: JSON.stringify({ cwd: root, session_id: "t-orientation" }), encoding: "utf8", cwd: root,
        env, maxBuffer: 16 * 1024 * 1024 });
      const parsed = JSON.parse(out);
      return { message: parsed.systemMessage, context: parsed.hookSpecificOutput.additionalContext };
    } catch (e) { return { message: `ERROR ${e.stderr ?? e.message}`, context: "" }; }
  };
  const wired = JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-surface@saasplane": true, "spn-apps@saasplane": true } });

  // A first visit is a workspace with no workstream in any state, and nothing else decides it.
  const first = fixture("first-visit", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    "spn-infra/sprepo.json": repo("INFRA"),
    "spn-infra/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-infra@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  });
  const firstNamed = hook(first, "Dhruv");
  says("a first visit greets by name with the first-visit heading, then the approved welcome",
    isWelcome(firstNamed.message, "# 👋 Welcome to SaaS Plane, Dhruv. Glad you're here!"));
  // THE TWO VARIANTS follow SPN_DEVEX_AGENT_WORKSPACE: set and naming this workspace is a builder's;
  // unset, or naming another place, is a partner's.
  const HEADING = "# 👋 Welcome to SaaS Plane, Dhruv. Glad you're here!";
  const elsewhere = mkdtempSync(join(tmpdir(), "t-orientation-elsewhere-"));
  says("N023-85: the workspace the key names hears the partner sentence",
    hook(first, "Dhruv", undefined, first).message.startsWith(`${HEADING}\n\n${BUILDER_BODY}\n\n&nbsp;\n\n`)
    && hook(first, "Dhruv", undefined, first).message.includes(PARTNER_SENTENCE));
  says("N023-85: with the key unset, the partner variant omits it",
    isWelcome(hook(first, "Dhruv").message, HEADING) && !hook(first, "Dhruv").message.includes("every partner who builds"));
  says("N023-85: with the key naming a different folder, the partner variant omits it",
    isWelcome(hook(first, "Dhruv", undefined, elsewhere).message, HEADING)
    && !hook(first, "Dhruv", undefined, elsewhere).message.includes("every partner who builds"));
  says("with no name, only the name's clause drops",
    isWelcome(hook(first, null).message, "# 👋 Welcome to SaaS Plane. Glad you're here!"));

  const returning = fixture("returning", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1/state.json`]: "{}\n",
  });
  says("any workstream, even a closed one, makes it a returning visit",
    isWelcome(hook(returning, "Dhruv").message, "# 👋 Good to see you again, Dhruv. Welcome back to SaaS Plane!"));
  says("a returning visit with no name drops only the name's clause",
    isWelcome(hook(returning, null).message, "# 👋 Good to see you again. Welcome back to SaaS Plane!"));

  // THE KNOWN-BAD CASE. The check above has to reject the welcome it replaced, or it proves nothing.
  const OLD = "# Welcome to SaaS Plane, Dhruv! Good to see you 👋\n\n## Your team's time belongs to your product. 🚀\n\n"
    + "**The AI-native, DevEx-first Foundation for Building and Launching Secure, Scalable, Compliance-ready SaaS Platforms.**\n\n"
    + "🤖 **I am the DevEx agent** — think of me as your engineering brain for this platform, and I work on it with you.\n\n"
    + "1 repo · 1 workstream open (042)";
  says("the old welcome fails the same check, under either heading",
    !isWelcome(OLD, "# Welcome to SaaS Plane, Dhruv! Good to see you 👋")
    && !isWelcome(OLD, "# 👋 Good to see you again, Dhruv. Welcome back to SaaS Plane!"));
  says("and no render carries a word of it",
    [firstNamed.message, firstNamed.context].every((text) =>
      !text.includes("Your team's time belongs to your product.") && !text.includes("I am the DevEx agent")
      && !text.includes("Tell me what you want to build")));

  // THE STATUS LINE: every part, each dropped at zero, and each clause on the same line.
  const busy = fixture("status-busy", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    "spn-app-py/sprepo.json": repo("APPS", { stack: "PY" }),
    "spn-app-py/CONCEPT.md": "# concept\n",
    "spn-app-py/.claude/settings.json": wired,
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/open/044-another/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/backlog/043-parked/arcs/N1/state.json`]: "{}\n",
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1/state.json`]: "{}\n",
  });
  const plain = hook(busy, "Dhruv");
  // Rung 3 here — the fixtures hold no nodes — so the rung clause is expected, and asserted apart.
  says("the status line names repos, open workstreams by number and the backlog; closed is not a part",
    statusOf(plain.message) === "2 repos · 2 workstreams open (042, 044) · 1 in backlog · rung 3: concept present, very few nodes below it");
  says("a part at zero is dropped, and one of each reads in the singular",
    statusOf(hook(returning, null).message) === "1 repo · rung 3: concept present, very few nodes below it");

  const nodes = {};
  for (const node of ["a", "b", "c"]) nodes[`spn-app-ts/apps/${node}/spkind.json`] = "{}";
  const ordinary = fixture("status-ordinary", {
    ...nodes,
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
  });
  says("an ordinary session adds no clause at all",
    statusOf(hook(ordinary, null).message) === "1 repo · 1 workstream open (042)");

  const unwired = fixture("status-unwired", {
    ...nodes,
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  });
  const unwiredOut = hook(unwired, null);
  says("an unwired repository adds a clause to the same line",
    statusOf(unwiredOut.message) === "1 repo · 1 unwired" && isWelcome(unwiredOut.message, "# 👋 Welcome to SaaS Plane. Glad you're here!"));
  says("the stack claim selects no plugin: an APPS repo loading spn-surface and spn-apps is wired",
    !statusOf(hook(ordinary, null).message).includes("unwired"));
  const appsAlone = fixture("status-apps-without-surface", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-apps@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  });
  says("an APPS repo loading spn-apps without spn-surface is unwired (DEC.DEVEX.AGENT.039)",
    statusOf(hook(appsAlone, null).message).includes("1 unwired"));

  const lower = fixture("status-lower-rung", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/.claude/settings.json": wired,
    ".spndevex/README.md": "state\n",
  });
  const lowerOut = hook(lower, null);
  says("a lower rung adds a clause, never a line",
    statusOf(lowerOut.message) === "1 repo · rung 2: an APPS repo carries no CONCEPT.md — spn-app-ts"
    && isWelcome(lowerOut.message, "# 👋 Welcome to SaaS Plane. Glad you're here!"));

  // A STALE PLUGIN: a marketplace source whose bytes differ from the newest cached copy.
  const stale = fixture("status-stale", {
    ...nodes,
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    "market/.claude-plugin/marketplace.json": JSON.stringify({ plugins: [{ name: "spn-devex", source: "./devex" }] }),
    "market/devex/scripts/a.ts": "the source, edited after the install\n",
    ".spndevex/README.md": "state\n",
  });
  mkdirSync(join(stale, ".claude"), { recursive: true });
  writeFileSync(join(stale, ".claude", "settings.json"), JSON.stringify({
    enabledPlugins: { "spn-devex@saasplane": true },
    extraKnownMarketplaces: { saasplane: { source: { source: "directory", path: join(stale, "market") } } } }), "utf8");
  const cached = join(home("Stale"), ".claude", "plugins", "cache", "saasplane", "spn-devex", "1.0.0", "scripts");
  mkdirSync(cached, { recursive: true });
  writeFileSync(join(cached, "a.ts"), "the install\n", "utf8");
  const staleOut = hook(stale, "Stale");
  says("a stale plugin adds a clause to the same line",
    statusOf(staleOut.message) === "1 repo · cache stale — spn-devex"
    && isWelcome(staleOut.message, "# 👋 Welcome to SaaS Plane, Stale. Glad you're here!"));

  // A WINDOW BEHIND THE NEWEST INSTALL: the copy made by the case above, run as the hook.
  const behindCopy = join(BASE, "pc", "plugins", "cache", "saasplane", "spn-devex", "0.0.1", "scripts", "events", "orientation.ts");
  const behindOut = hook(ordinary, null, behindCopy);
  says("a window running an older install adds a clause, and the full warning stays with the agent",
    statusOf(behindOut.message) === "1 repo · 1 workstream open (042) · this window runs spn-devex 0.0.1, 9.9.9 is installed"
    && behindOut.context.includes("take a fresh window") && !behindOut.message.includes("take a fresh window"));

  // THE TABLES ARE FOR WHEN YOU ASK: in the agent's context, never in the developer's pane.
  const tables = ["## The ground", "### Repositories", "| Repo | Law |", "### Workstreams"];
  const closing = ["So — what are we building?", "Or ask me to continue 042 widget-pricing"];
  const offer = hook(ordinary, null);
  says("the developer's pane carries the welcome and the status line and no table",
    [...tables, ...closing].every((t) => !offer.message.includes(t)));
  says("the agent's context opens with the lead line, then the same opening, then the closing question, and no table",
    offer.context.startsWith(`${WELCOME_LEAD}\n\n${offer.message}`) && closing.every((t) => offer.context.includes(t))
    && tables.every((t) => !offer.context.includes(t)));
  says("the lead line says the welcome comes word for word and whole, before any tool call, and names every part",
    WELCOME_LEAD.includes("word for word and whole, before any tool call")
    && WELCOME_LEAD.includes("the heading, the italic line, and the 🤖, 🧭 and 👥 lines, each whole, with the `&nbsp;` spacer line after the italic line and after each of the three, then the status line. Trim nothing."));
  // N116 row 8, F1: a question and a pasted handover were the prompts that cut the welcome short.
  says("the lead line names the two prompts that cut the welcome, and puts the answer after it",
    WELCOME_LEAD.includes("a question and a pasted handover included") && WELCOME_LEAD.includes("The prompt is answered after it, never instead of it."));
  // 025 N020: Claude Code shows the agent the first 2 KB of a long session-start text and keeps the rest
  // in a file. The instruction once sat after the tables, at byte 2,934, so the agent never saw it.
  const status = statusOf(offer.message);
  says("N020: the lead line, the welcome and the status line end inside the first 2,000 bytes",
    Buffer.byteLength(offer.context.slice(0, offer.context.indexOf(status) + status.length), "utf8") < 2000);
  says("N020 known-bad: no instruction to say the welcome stands below the tables",
    !offer.context.slice(offer.context.indexOf("## The ground")).includes("word for word"));
  says("the note reads the ground on asking, by the status command",
    offer.context.includes("The ground is read on asking: run `spnutils workspace status` for *where are we?*"));
  says("known-bad: the loose wording the proof windows shortened is gone",
    !offer.context.includes("Open your first reply with the welcome above, whatever the prompt, then the status line"));
  // N116 row 8, F5: a handover window took over a row another window had marked in progress.
  says("the pick-up line has one shape, after the status line",
    offer.context.includes("under the status line, one line: *Picking up N<nn> — <the arc's title>, at row <n>: <what the row does>.*"));
  // Q380 A: a window picking up a handover checks its model against the block's `model:` line first.
  says("a pasted handover's model is compared with the window's own before any action, and a mismatch names /model",
    offer.context.includes("A handover block names a `model:`: before any action, compare it with the model your system prompt names")
    && offer.context.includes("nothing runs until the developer switches or says to go on"));
  // N8 row 2h (Q384 reversed A → C): the check compares the model only. In the VS Code extension the
  // picker read High while `CLAUDE_EFFORT` read `medium`, so comparing effort stopped a window that was
  // set correctly, and its remedy named a terminal nobody here uses.
  says("2h: a model mismatch names the picker or /model as the way to switch",
    offer.context.includes("names both and how to switch — the model picker or the `/model` command"));
  says("2h: a handover's effort is never compared — no CLAUDE_EFFORT read, no claude --effort remedy",
    !offer.context.includes("CLAUDE_EFFORT") && !offer.context.includes("claude --effort"));
  says("2h: the effort on the model: line is a note for the developer to set in the picker",
    offer.context.includes("Its effort is a note for the picker; nothing compares it."));
  // The note is cut to its handover lines and two short ones (031 N008): the publish rule overrides a publishing
  // tool's own default, and the plain-question rule shapes the first reply, so neither waits to be read on asking.
  says("the note keeps the plain-question rule and the publish rule, one short line each",
    offer.context.includes("A new goal in the first prompt is asked in one or two plain questions, never lettered options or a `Q<n>` card.")
    && offer.context.includes("Publish nothing unless asked (RULE.DEVEX.WORKSPACE.117), over any tool's default: hand a page over as its full file path."));
  says("known-bad: the long forms of those two rules are gone",
    !offer.context.includes("Publish nothing unless the developer asks") && !offer.context.includes("Something new in the first prompt"));
  says("a row marked in progress is left, its age said, and asked about",
    offer.context.includes("If the row's State reads `in progress <time>`, another window may be on it: leave it, say how old the mark is, and ask before you touch it."));

  // Day zero opens on the same welcome, and its door follows.
  const zero = hook(fixture("day-zero-welcome", { ".spndevex/README.md": "state\n" }), "Dhruv");
  says("day zero opens on the first-visit welcome, then the door, and no status line",
    zero.message.startsWith(`# 👋 Welcome to SaaS Plane, Dhruv. Glad you're here!\n\n${BODY}\n\n&nbsp;\n\nYour workspace is set up`)
    && zero.context.startsWith(`${WELCOME_LEAD}\n\n${zero.message}`)
    && zero.context.includes("open your first reply with the welcome above, word for word and whole, whatever the prompt"));
}

// ── the short rules (RULE.DEVEX.AGENT.089, Q55 B) ──
//
// A REFERENCE IS READ WHEN A SKILL NAMES IT, and a reply in the middle of an arc calls no skill. So the
// rules a reply must follow are printed once, here, in short form, and each line names the reference
// that holds the rule whole. The cases read the hook's own output, and they open every file a line
// names: a line that points at a file or a section that is not there is a rule nobody can read.
console.log("\n=== orientation — the short rules are in the agent's context, each naming its reference");
{
  const says = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  const hook = (root) => {
    try {
      const out = execFileSync("node", [`${HOOKS}/src/scripts/events/orientation.ts`, "--stdin"], {
        input: JSON.stringify({ cwd: root, session_id: "t-orientation-rules" }), encoding: "utf8", cwd: root,
        env: { ...process.env, SPN_TELEMETRY: "off" }, maxBuffer: 16 * 1024 * 1024 });
      const parsed = JSON.parse(out);
      return { message: parsed.systemMessage, context: parsed.hookSpecificOutput.additionalContext };
    } catch (e) { return { message: `ERROR ${e.stderr ?? e.message}`, context: "" }; }
  };
  const ordinary = hook(fixture("short-rules", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
  }));
  const HEADING = "## The short rules";
  const at = ordinary.context.indexOf(HEADING);
  const block = at < 0 ? "" : ordinary.context.slice(at);
  const lines = block.split("\n").filter((line) => line.startsWith("- "));

  says("the agent's context holds the short rules, after the note",
    at > ordinary.context.indexOf("The ground is read on asking") && ordinary.context.indexOf("The ground is read on asking") > 0);
  says("the developer's pane does not show them", !ordinary.message.includes(HEADING) && !ordinary.message.includes("in its own voice"));
  says("they are about ten lines: the heading and no more than ten rules",
    lines.length >= 7 && lines.length <= 10, `got ${lines.length} rule lines`);
  says("known-bad: no line asks for a person at the table, the wording the developer's correction replaced",
    block.length > 0 && !block.includes("person at the table") && !block.includes("one or two plain sentences"));

  for (const [what, words] of [
    ["lenses take part in any discussion about a shape, mid-run too",
      ["Lenses take part in any discussion about a shape", "mid-run too"]],
    ["the three signs", ["it crosses a repository", "changes what a partner builds on", "sets a pattern"]],
    ["what each number of signs brings",
      ["No sign: the owning view, one sentence", "One: the architect's and the owner's",
       "Two or more: the starting group with product and partner", "a fresh agent"]],
    ["a view speaks in its own voice, as a colleague, never a slogan",
      ["in its own voice", "as a colleague, never a slogan"]],
    ["on a card a view is one or two sentences, and names no option by its letter",
      ["on a card, one or two sentences", "no option by letter"]],
    ["a reply reads as one person to another",
      ["Reply as one person to another", "full sentences", "tables only for facts"]],
    ["one meaning-icon first, and a failure opens straight",
      ["one meaning-icon first", "a failure opens straight"]],
    ["a shape-setting decision is put to the developer before it is built",
      ["setting a shape, a name, a member, a check or a dependency's direction goes to the developer before it is built"]],
    ["structure before content", ["Structure before content"]],
    ["Needs you opens a reply only to raise a card or to end or stop the work",
      ["**Needs you** opens a reply only to raise a card", "(in full, once)", "a line per open card"]],
    ["arcs are the agent's to manage, and a workstream is the developer's call",
      ["Arcs are yours to manage", "a new workstream is the developer's call"]],
    ["no script judges whether a prompt is such a discussion", ["No script flags a discussion about a shape"]],
  ]) {
    const missing = words.filter((word) => !block.includes(word));
    says(`a line states: ${what}`, missing.length === 0, `missing: ${missing.join(" | ")}`);
  }

  // EACH LINE POINTS AT A REFERENCE THAT EXISTS, AND AT A SECTION THAT FILE REALLY HAS.
  const pointer = /→ `(refs\/[^`]+\.md)` § (.+)$/;
  const unpointed = lines.filter((line) => !pointer.test(line));
  says("every line ends with the path of its reference and the section that holds the rule",
    lines.length > 0 && unpointed.length === 0, `no pointer: ${unpointed.map((line) => line.slice(0, 60)).join(" | ")}`);
  const broken = [];
  for (const line of lines) {
    const found = pointer.exec(line);
    if (!found) continue;
    const file = resolve(HOOKS, "src", found[1]);
    let text = "";
    try { text = readFileSync(file, "utf8"); } catch { broken.push(`${found[1]} is not a file`); continue; }
    if (!text.split("\n").some((heading) => /^#{2,4} /.test(heading) && heading.replace(/^#+ /, "").trim() === found[2].trim()))
      broken.push(`${found[1]} has no section "${found[2]}"`);
  }
  says("every reference named is a file of the plugin, and every section named is a heading in it",
    lines.length > 0 && broken.length === 0, broken.join(" | "));

  // KNOWN-BAD: the same reader must reject a line that points nowhere.
  says("known-bad: a line with no reference fails the pointer test", !pointer.test("- Show each view in its own voice."));

  const zero = hook(fixture("short-rules-day-zero", { ".spndevex/README.md": "state\n" }));
  says("day zero carries the same rules, after its note",
    zero.context.includes(HEADING) && zero.context.indexOf(HEADING) > zero.context.indexOf("Day-0 mode") && !zero.message.includes(HEADING));
  says("the by-hand form prints them too, since it prints what the agent reads",
    run("node", [`${HOOKS}/src/scripts/events/orientation.ts`, WORKSPACE], WORKSPACE).includes(HEADING) || !IN_WORKSPACE);
}

// ── the plugin's migrations (RULE.DEVEX.AGENT.094) ──
//
// A WINDOW'S START IS WHERE THE PLUGIN'S MIGRATIONS ARE COMPARED WITH THE WORKSPACE'S LEDGER, and what
// is pending is told to the agent once, before anything else runs. The same workspace is read three
// times: in the old shape with an empty ledger, with 001 recorded, and kept as data with nothing recorded.
console.log("\n=== orientation — a pending plugin migration is the agent's first task");
{
  const says = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  const hook = (root) => {
    try {
      const out = execFileSync("node", [`${HOOKS}/src/scripts/events/orientation.ts`, "--stdin"], {
        input: JSON.stringify({ cwd: root, session_id: "t-orientation-migrations" }), encoding: "utf8", cwd: root,
        env: { ...process.env, SPN_TELEMETRY: "off" }, maxBuffer: 16 * 1024 * 1024 });
      const parsed = JSON.parse(out);
      return { message: parsed.systemMessage, context: parsed.hookSpecificOutput.additionalContext };
    } catch (e) { return { message: `ERROR ${e.stderr ?? e.message}`, context: "" }; }
  };
  const HEADING = "### Plugin migrations — before any other work";
  const ground = {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    ".spndevex/README.md": "state\n",
  };
  const old = fixture("migration-pending", { ...ground, [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1-a.md`]: "# arc\n" });
  const pending = hook(old);
  says("red: an arc kept as Markdown and an empty ledger — the agent is told 001 is pending, with its steps",
    pending.context.includes(HEADING) && /- \*\*001\*\* \(spn-devex /.test(pending.context) && pending.context.includes("open/042-widget-pricing: 1 arc(s) kept as Markdown"),
    pending.context.slice(pending.context.indexOf("### Plugin"), pending.context.indexOf("### Plugin") + 400));
  says("it comes before the closing question", pending.context.indexOf(HEADING) < pending.context.indexOf("So — what are we building?"));
  says("the developer's pane does not show it", !pending.message.includes(HEADING) && !pending.message.includes("migration"));
  writeFileSync(join(old, ".spndevex", "migrations.jsonl"),
    `${JSON.stringify({ plugin: "spn-devex", id: "001", version: "0.40.0", at: "2026-10-18T10:20+05:30", by: "t", how: "agent" })}\n`);
  const recorded = hook(old).context;
  says("green: once the ledger records 001, the window's start says nothing of it", !/\*\*001\*\*|- 001[:,]/.test(recorded), recorded.slice(recorded.indexOf(HEADING), recorded.indexOf(HEADING) + 300));
  const current = hook(fixture("migration-nothing", { ...ground, [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n" }));
  says("kept as data and nothing recorded — one line says 001 has nothing to do, and the command that records it",
    current.context.includes(HEADING) && current.context.includes("- 001, 002, 003, 004, 005, 006, 007, 008: the check finds nothing in the old shape — `spn-devex plugin migration write 001 002 003 004 005 006 007 008`"));
}


// ── the session start fetches every member, names a branch behind develop, and stays small (031 N008) ──
console.log("\n=== orientation — the fetch, the behind-develop clause and the size");
{
  const says = (label, ok, detail = "") => {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  };
  const git = (dir, ...args) => execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const hookIn = (root, env = {}) => {
    const started = Date.now();
    const out = execFileSync("node", [`${HOOKS}/src/scripts/events/orientation.ts`, "--stdin"], {
      input: JSON.stringify({ cwd: root, session_id: "t-orientation-fetch" }), encoding: "utf8", cwd: root,
      env: { ...process.env, SPN_TELEMETRY: "off", ...env }, maxBuffer: 16 * 1024 * 1024 });
    const parsed = JSON.parse(out);
    return { message: parsed.systemMessage, context: parsed.hookSpecificOutput.additionalContext, ms: Date.now() - started };
  };
  const statusOf = (message) => message.split("\n").filter(Boolean).at(-1);

  // A bare origin holding develop, a member cloned from it on a workstream's branch, and a second clone that
  // moves develop on by one commit: the member is one behind only once the session start has fetched.
  const root = fixture("fetch-behind", { ".spndevex/README.md": "state\n" });
  const origin = join(BASE, "fetch-behind-origin.git");
  const seed = join(BASE, "fetch-behind-seed");
  const member = join(root, "spn-x");
  const other = join(BASE, "fetch-behind-other");
  execFileSync("git", ["init", "-q", "--bare", "-b", "develop", origin]);
  execFileSync("git", ["init", "-q", "-b", "develop", seed]);
  writeFileSync(join(seed, "a.txt"), "a\n");
  git(seed, "add", "-A"); git(seed, "commit", "-q", "-m", "base");
  git(seed, "remote", "add", "origin", origin); git(seed, "push", "-q", "origin", "develop");
  execFileSync("git", ["clone", "-q", origin, member]);
  writeFileSync(join(member, "sprepo.json"), repo("APPS", { stack: "TS" }));
  git(member, "checkout", "-q", "-b", "feat/031-x");
  execFileSync("git", ["clone", "-q", origin, other]);
  writeFileSync(join(other, "b.txt"), "b\n");
  git(other, "add", "-A"); git(other, "commit", "-q", "-m", "ahead"); git(other, "push", "-q", "origin", "develop");
  const late = hookIn(root);
  says("a member's branch behind origin/develop is named in the status line, after a fetch the window made",
    statusOf(late.message).includes("1 branch behind origin/develop, rebase before the next push: spn-x feat/031-x by 1"), statusOf(late.message));
  says("the status stays one line, and the welcome is whole above it", late.message.split("\n").filter(Boolean).at(-1) === statusOf(late.message) && late.message.includes("🧭 I work with you through"));
  git(member, "checkout", "-q", "develop");
  says("a permanent branch is never told to rebase", !statusOf(hookIn(root).message).includes("behind origin"));
  git(member, "checkout", "-q", "feat/031-x"); git(member, "config", "branch.feat/031-x.spnBase", "main");
  says("a branch whose git config records another base is measured from that base, which here is not behind",
    !statusOf(hookIn(root).message).includes("behind origin"));

  // MANY BRANCHES BEHIND: a worktree set holds a member per worktree, so the late list grows with the workspace.
  // The rebase sentence is said once, the three most behind are named, and the rest are a count and the command.
  const crowded = fixture("fetch-behind-many", { ".spndevex/README.md": "state\n" });
  const crowdedNames = [];
  for (let at = 1; at <= 16; at += 1) {
    const name = `spn-a-rather-long-member-name-${String(at).padStart(2, "0")}`;
    crowdedNames.push(name);
    execFileSync("git", ["clone", "-q", origin, join(crowded, name)]);
    writeFileSync(join(crowded, name, "sprepo.json"), repo("APPS", { stack: "TS" }));
    writeFileSync(join(crowded, name, "CONCEPT.md"), "# concept\n");
    git(join(crowded, name), "checkout", "-q", "-b", `feat/0${at}-a-rather-long-workstream-subject`, "HEAD~1");
  }
  const crowdedHook = hookIn(crowded);
  const lateMany = statusOf(crowdedHook.message);
  says("sixteen branches behind say the rebase once, name three, and count the rest with the command that lists them",
    lateMany.includes("16 branches behind origin/develop, rebase before the next push: ")
      && (lateMany.match(/rebase before the next push/g) ?? []).length === 1
      && crowdedNames.filter((name) => lateMany.includes(`${name} `)).length === 3
      && lateMany.includes(" and 13 more, listed by `spnutils workspace status`"), lateMany);
  says(`and that workspace's session-start output stays inline, under ${SESSION_START_CEILING} characters (${crowdedHook.context.length})`,
    crowdedHook.context.length <= SESSION_START_CEILING);

  // THE FETCH'S BUDGET: a remote that never answers costs the window five seconds and no more.
  const slow = fixture("fetch-slow", { ".spndevex/README.md": "state\n" });
  mkdirSync(join(slow, "spn-slow"), { recursive: true });
  execFileSync("git", ["init", "-q", "-b", "feat/x", join(slow, "spn-slow")]);
  git(join(slow, "spn-slow"), "remote", "add", "origin", "ssh://example.invalid/x.git");
  writeFileSync(join(slow, "spn-slow", "sprepo.json"), repo("APPS", { stack: "TS" }));
  const waited = hookIn(slow, { GIT_SSH_COMMAND: "sh -c 'sleep 30' sh" });
  says("a remote that never answers is given up on within the five-second budget, and the window still opens",
    waited.ms < 9000 && waited.ms >= 4000 && waited.message.includes("🧭 I work with you through"), `${waited.ms} ms`);
  const parallel = fixture("fetch-parallel", { ".spndevex/README.md": "state\n" });
  for (const name of ["spn-a", "spn-b", "spn-c"]) {
    mkdirSync(join(parallel, name), { recursive: true });
    execFileSync("git", ["init", "-q", "-b", "feat/x", join(parallel, name)]);
    git(join(parallel, name), "remote", "add", "origin", "ssh://example.invalid/x.git");
    writeFileSync(join(parallel, name, "sprepo.json"), repo("APPS", { stack: "TS" }));
  }
  const together = hookIn(parallel, { GIT_SSH_COMMAND: "sh -c 'sleep 30' sh" });
  says("three members that never answer cost one budget, not three: the fetches run in parallel", together.ms < 9000, `${together.ms} ms`);

  // THE SIZE: the session start stays under the harness's inline ceiling. Past the soft line it still loads whole,
  // and the run names the size so a new text's reason is asked for (RULE.DEVEX.AGENT.105).
  const sized = (what, context) => {
    if (context.length > SESSION_START_NOTE)
      console.log(`        note: ${what} session start is ${context.length} characters, past ${SESSION_START_NOTE}: say why the new text earns its place`);
    return context.length <= SESSION_START_CEILING;
  };
  if (IN_WORKSPACE) {
    const real = hookIn(WORKSPACE);
    console.log(`        session-start additionalContext of this workspace: ${real.context.length} characters`);
    says(`the session-start output stays inline, under ${SESSION_START_CEILING} characters (${real.context.length})`, sized("this workspace's", real.context));
  }
  const big = hookIn(fixture("size-ordinary", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1/state.json`]: "{}\n",
  }));
  says(`a fixture workspace's session-start output stays inline (${big.context.length} characters)`, sized("a fixture workspace's", big.context));
  // SEVERAL OPEN WORKSTREAMS: the listing grows with every folder, and the text still stays under the line.
  const crowd = {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-web-ts/sprepo.json": repo("APPS", { stack: "TS" }),
  };
  for (let at = 1; at <= 12; at += 1) {
    const name = `${String(40 + at).padStart(3, "0")}-a-long-workstream-subject-number-${at}`;
    crowd[`.spndevex/${WORKSTREAMS}/open/${name}/arcs/N001/state.json`] = "{}\n";
    crowd[`.spndevex/${WORKSTREAMS}/open/${name}/approach.html`] = "<h1>x</h1>\n";
  }
  for (let at = 1; at <= 4; at += 1) crowd[`.spndevex/${WORKSTREAMS}/backlog/${String(60 + at).padStart(3, "0")}-waiting-subject-${at}/approach.html`] = "<h1>x</h1>\n";
  const many = hookIn(fixture("size-many-workstreams", crowd));
  says(`a workspace with twelve open workstreams still opens inline (${many.context.length} characters)`, sized("a twelve-workstream", many.context));
  // THE PRIORITY ORDER: past the ceiling the router goes first, then the debug lines, and the head never goes.
  const head = "H".repeat(6000);
  const fitted = fitSessionStart(head, [
    { text: "D".repeat(1500), rank: 2, readAt: "`refs/commands.md`" },
    { text: "R".repeat(1800), rank: 3, readAt: "`refs/devex/agent/way.md`" },
    { text: "S".repeat(1500), rank: 1, readAt: "the short rules" },
  ]);
  says("past the ceiling the router is left out first and named, and the head, the debug lines and the short rules stay",
    fitted.startsWith(head) && !fitted.includes("R") && fitted.includes("D".repeat(1500)) && fitted.includes("S".repeat(1500))
      && fitted.includes("read on asking: `refs/devex/agent/way.md`") && fitted.length <= SESSION_START_CEILING + 120);
  const tight = fitSessionStart(head, [
    { text: "D".repeat(2500), rank: 2, readAt: "`refs/commands.md`" },
    { text: "R".repeat(1800), rank: 3, readAt: "`refs/devex/agent/way.md`" },
    { text: "S".repeat(1500), rank: 1, readAt: "the short rules" },
  ]);
  says("and when that is not enough the debug lines go next, the short rules last",
    !tight.includes("R") && !tight.includes("D") && tight.includes("S".repeat(1500)) && tight.includes("`refs/devex/agent/way.md` · `refs/commands.md`"));
  says("and still carries the welcome lead and the status line in its first 2,000 bytes",
    Buffer.byteLength(many.context.slice(0, many.context.indexOf(" workstream")), "utf8") < 2000 && many.context.includes("12 workstreams open"), many.context.slice(0, 600));
  says("known-bad: the ground and the way's principles are not carried",
    !big.context.includes("### Repositories") && !big.context.includes("Start from what the thing is for"));

  // THE DEBUG GROUP'S COMMANDS, one line each under the pointer line, rendered from the same command tree as `refs/commands.md`.
  const { commandsRef } = await import("../../../../src/scripts/cli.ts");
  const treeDebug = (await commandsRef()).split("\n").filter((one) => one.startsWith("spn-devex debug "));
  const shown = big.context.split("\n").filter((one) => one.startsWith("spn-devex debug "));
  says(`the session start lists the eight debug commands, ${shown.length} lines`, shown.length === 8 && treeDebug.length === 8);
  says("and each line is the one the command tree renders, in the tree's order, arguments included",
    JSON.stringify(shown) === JSON.stringify(treeDebug) && shown.every((one) => /^spn-devex debug \w+ \w+/.test(one)), shown.join("\n"));
  says("and they sit right after the pointer line to `refs/commands.md`",
    big.context.includes("read it before a window's first write of a command.\n\n" + treeDebug.join("\n") + "\n\n"));
  says("and no other command line is carried", !big.context.includes("spn-devex workstream ") && !big.context.includes("spn-devex docs "));
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
