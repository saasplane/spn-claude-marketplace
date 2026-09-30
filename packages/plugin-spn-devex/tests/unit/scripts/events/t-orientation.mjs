// `orientation` — its output IS the session's first screen, so the test is a byte-for-byte diff of
// the two implementations. The real workspace covers the ordinary case; fixtures cover the states
// this workspace is not in and would otherwise never be exercised: day zero, a workspace with no
// workstreams, one with exactly one open (the standing offer), and the legacy shapes.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
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
  ["Welcome back to SaaS Plane!", "🧭 I work every stage", `\`${WORKSPACE}\``,
   "### Workstreams", "So — what are we building?"],
  ["Your team's time belongs to your product.", "I am the DevEx agent"]);

console.log("\n=== orientation — the states this workspace is not in");

compare("day zero: no sprepo.json anywhere",
  fixture("day-zero", { "README.md": "nothing here yet\n", ".spndevex/README.md": "the workspace state, and no repo cloned yet\n" }),
  ["This folder is empty, which is a good place to start",
   // Act 0 is a door, and the render has to BE the door rather than announce a form. The screen
   // that said "I have five questions" opened the walk on a question nobody had agreed to answer.
   "Would you like to start a new platform?", "lands in a file as you give it",
   "open a workstream to hold your answers"],
  [WORKSTREAMS, "wired", "So — what are we building?"]);

// THE WINDOW THAT CLOSES AFTER THE THIRD QUESTION. Still no sprepo.json, so this is still day 0 —
// and offering the door again asks somebody to name their organization twice. The screen has to
// find the workstream its own act 2 opened.
compare("day zero resumed: a new-platform workstream is already open",
  fixture("day-zero-resumed", {
    "README.md": "nothing here yet\n",
    ".spndevex/README.md": "the workspace state, and no repo cloned yet\n",
    [`.spndevex/${WORKSTREAMS}/open/001-new-platform/arcs/N1-estate-coordinates.md`]:
      "| 1 | The organization's code, its name, and the mail domain | `acme` | … |\n",
  }),
  ["You started a platform here and we did not finish", "001-new-platform",
   "Shall we carry on?", "Read its arc BEFORE you say anything"],
  ["Would you like to start a new platform?", "So — what are we building?"]);

compare("an estate-only workspace, rung 1",
  fixture("estate-only", {
    "spn-infra/sprepo.json": repo("INFRA"),
    "spn-infra/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-infra@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["spn-infra", "INFRA", "wired", "none yet"]);

compare("an APPS repo carrying no CONCEPT.md, rung 2",
  fixture("no-concept", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true } }),
    ".spndevex/README.md": "state\n",
  }),
  ["UNWIRED"]);

// EXACTLY ONE OPEN, NO OTHER SESSION — the standing offer. This workspace can never show it while
// three other windows are live here, so it exists only as a fixture.
const one = compare("exactly one workstream open: the standing offer appears",
  fixture("one-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-apps@saasplane": true } }),
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/widget-pricing-approach.html`]: "<html></html>",
    [`.spndevex/${WORKSTREAMS}/backlog/043-parked/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1-a.md`]: "# arc\n",
  }),
  ["Or ask me to continue 042 widget-pricing", "1 open · 1 backlog · 1 closed", "file://", "041-finished"]);

compare("two open: no offer is made, because naming one would be choosing for you",
  fixture("two-open", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/open/044-another/arcs/N1-a.md`]: "# arc\n",
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
      parsed.hookSpecificOutput.additionalContext.startsWith(parsed.systemMessage) &&
      parsed.hookSpecificOutput.additionalContext.includes("Ground, read at load");
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
  const installed = join(cache, "0.0.1", "scripts", "events", "orientation.ts");

  const check = (label, text, must, mustNot = []) => {
    n += 1;
    const ok = must.every((m) => text.includes(m)) && mustNot.every((m) => !text.includes(m));
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  };

  check("a window behind the newest install says so, and names both versions",
    run("node", [installed, WORKSPACE], WORKSPACE),
    ["this window loaded", "0.0.1", "9.9.9", "take a fresh window"]);

  // N33's lesson, as a case: a retired install carries `.orphaned_at` and nothing loads it, so a
  // clock that counts one reports a window behind a version that no longer exists.
  writeFileSync(join(cache, "9.9.9", ".orphaned_at"), "retired\n");
  check("a retired install is a corpse and does not count",
    run("node", [installed, WORKSPACE], WORKSPACE),
    [], ["this window loaded"]);
  rmSync(join(cache, "9.9.9", ".orphaned_at"), { force: true });

  // The everyday case, and the one that must never speak: a checkout is not behind an install.
  check("running from source says nothing — a checkout IS the source",
    run("node", [`${HOOKS}/src/scripts/events/orientation.ts`, WORKSPACE], WORKSPACE),
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
    text.includes("The closing question is asked ONLY when the developer's first message does not already"));
  says("it names what replaces the question, rather than only forbidding it",
    text.includes("A handover block, an arc name, or any named next step replaces it"));
  says("and the standing-offer rule beside it is untouched",
    text.includes("The standing offer") && text.includes("do not propose resuming"));
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
    "🧭 I work every stage of your engineering function with you: **Bootstrap** a repo, keep **Source Control** in order, **Ideate** and plan the change, **Develop** it, **Test** it, **Provision** the estate, **Deliver** it, and **Operate** what runs. Every stage has its standards and its proof, and I'll carry both for you.",
    "\n&nbsp;\n",
    "👥 I look at the work through every role on your team: engineering leader, business manager, product manager, architect, backend developer, web developer, quality engineer, operator, security engineer, partner and editor. Tell me whose view you need, and I'll bring it.",
  ].join("\n");
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
  const hook = (root, name, script = `${HOOKS}/src/scripts/events/orientation.ts`) => {
    try {
      const out = execFileSync("node", [script, "--stdin"], {
        input: JSON.stringify({ cwd: root, session_id: "t-orientation" }), encoding: "utf8", cwd: root,
        env: { ...process.env, HOME: home(name), SPN_TELEMETRY: "off" }, maxBuffer: 16 * 1024 * 1024 });
      const parsed = JSON.parse(out);
      return { message: parsed.systemMessage, context: parsed.hookSpecificOutput.additionalContext };
    } catch (e) { return { message: `ERROR ${e.stderr ?? e.message}`, context: "" }; }
  };
  const wired = JSON.stringify({ enabledPlugins: { "spn-devex@saasplane": true, "spn-apps@saasplane": true } });

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
  says("with no name, only the name's clause drops",
    isWelcome(hook(first, null).message, "# 👋 Welcome to SaaS Plane. Glad you're here!"));

  const returning = fixture("returning", {
    "spn-app-ts/sprepo.json": repo("APPS", { stack: "TS" }),
    "spn-app-ts/CONCEPT.md": "# concept\n",
    "spn-app-ts/.claude/settings.json": wired,
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1-a.md`]: "# arc\n",
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
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/open/044-another/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/backlog/043-parked/arcs/N1-a.md`]: "# arc\n",
    [`.spndevex/${WORKSTREAMS}/closed/041-finished/arcs/N1-a.md`]: "# arc\n",
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
    [`.spndevex/${WORKSTREAMS}/open/042-widget-pricing/arcs/N1-a.md`]: "# arc\n",
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
  says("the stack claim selects no plugin: an APPS repo loading spn-apps is wired",
    !statusOf(hook(ordinary, null).message).includes("unwired"));

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
  const tables = ["## The ground", "### Repositories", "| Repo | Law |", "### Workstreams", "So — what are we building?",
    "Or ask me to continue 042 widget-pricing"];
  const offer = hook(ordinary, null);
  says("the developer's pane carries the welcome and the status line and no table",
    tables.every((t) => !offer.message.includes(t)));
  says("the agent's context carries the same opening, then every table and the closing question",
    offer.context.startsWith(offer.message) && tables.every((t) => offer.context.includes(t)));
  says("the note tells the agent to open with the welcome word for word, and to hold the tables",
    offer.context.includes("Open your first reply with the welcome above, word for word: the heading, the italic line, and the 🤖, 🧭 and 👥 lines, each whole, with the `&nbsp;` spacer line after the italic line and after each of the three.")
    && offer.context.includes("Show the tables only when asked"));
  // N116 row 8, F1: a question and a pasted handover were the prompts that cut the welcome short.
  says("the note names the two prompts that cut the welcome, and puts the answer after it",
    offer.context.includes("a question and a pasted handover included: the prompt is answered after the welcome, never instead of it"));
  says("known-bad: the loose wording the proof windows shortened is gone",
    !offer.context.includes("Open your first reply with the welcome above, whatever the prompt, then the status line"));
  // N116 row 8, F5: a handover window took over a row another window had marked in progress.
  says("the pick-up line has one shape, after the status line",
    offer.context.includes("under the status line, one line: *Picking up N<nn> — <the arc's title>, at row <n>: <what the row does>.*"));
  // Q380 A: a window picking up a handover checks its model against the block's `model:` line first.
  says("a pasted handover's model is compared with the window's own before any action, and a mismatch names /model",
    offer.context.includes("A handover block names a `model:` with a model and an effort: before any action, compare the model with the one your system prompt names")
    && offer.context.includes("the `/model` command for the model")
    && offer.context.includes("nothing runs until the developer switches or says to go on"));
  // Q384 A: the effort is compared too, read from CLAUDE_EFFORT.
  says("the effort is compared with CLAUDE_EFFORT, and a mismatch names claude --effort",
    offer.context.includes("the effort with `CLAUDE_EFFORT`")
    && offer.context.includes("a window started with `claude --effort <level>` for the effort"));
  says("a new idea's goal is asked in plain questions, never a card (RD.DEVEX.AGENT.077)",
    offer.context.includes("Something new in the first prompt gets its goal asked in one or two plain questions, never lettered options and never a `Q<n>` card"));
  says("a row marked in progress is left, its age said, and asked about",
    offer.context.includes("If that row's State reads `in progress <time>`, another window may be on it: leave it, say how old the mark is, and ask before you touch it."));

  // Day zero opens on the same welcome, and its door follows.
  const zero = hook(fixture("day-zero-welcome", { ".spndevex/README.md": "state\n" }), "Dhruv");
  says("day zero opens on the first-visit welcome, then the door, and no status line",
    zero.message.startsWith(`# 👋 Welcome to SaaS Plane, Dhruv. Glad you're here!\n\n${BODY}\n\n&nbsp;\n\nThis folder is empty`)
    && zero.context.includes("open your first reply with the welcome above, word for word and whole, whatever the prompt"));
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
