import { PLUGIN } from "../../../helpers/harness.mjs";
// `pretooluse` — the dispatcher. Its job is not to decide anything itself but to make sure every
// check's verdict SURVIVES, which is exactly what the Python one failed at.
//
// So the known-bad set here is one refusal per check routed through the chain, plus the two the
// Python dropped on the floor, plus the generated-file guard it absorbed from a shell script.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";
import { ARCS, DEVEX_WORKSTREAMS, DOCS, SEAT, capabilitiesDir, docsOf, workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { linesFor } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const HOOKS = PLUGIN;
const SCRIPTS = resolve(HOOKS, "scripts");
const EVENTS = resolve(HOOKS, "src", "scripts", "events");

// An arc's data as the `workstream` commands keep it: `state.json` at `status`, and `log.jsonl` holding the
// developer's go where `go` says so (RD.DEVEX.WORKSPACE.278) — the state `confirmed` reads.
function arcFiles(status, go) {
  // RUNNING is worked out from the steps, never stored: an arc that runs stores the developer's DECIDED, and a step runs.
  const data = { schemaVersion: 2, arc: "N001", subject: "probe", title: "the probe", goal: null, status: status === "RUNNING" ? "DECIDED" : status, reason: null,
    preview: "preview.html", rows: [{ id: "1", parent: "N001", title: "probe", kind: "change", state: status === "RUNNING" ? "running" : "waiting" }] };
  const lines = [{ at: "2026-09-29T10:00+05:30", kind: "opened", row: null, note: "opened as PROPOSED" },
    ...(go ? [{ at: "2026-09-29T10:05+05:30", kind: "status", row: null, note: "PROPOSED → DECIDED · the developer: 'go'" },
              { at: "2026-09-29T10:06+05:30", kind: "status", row: null, note: "DECIDED → RUNNING · row 1 running" }] : [])];
  return { [join("N001", "state.json")]: `${JSON.stringify(data)}\n`,
           [join("N001", "log.jsonl")]: lines.map((line) => JSON.stringify(line)).join("\n") + "\n" };
}
const arcAt = (workstream, status, go) => Object.fromEntries(Object.entries(arcFiles(status, go))
  .map(([file, body]) => [join(DEVEX_WORKSTREAMS, "open", workstream, ARCS, file), body]));

// EVERY PROBE SITS IN A TEMPORARY WORKSPACE. A probe path is the target of a simulated tool call,
// never a file the suite reads, so a neutral repository, `probe-repo`, stands in for any member
// repository. The workspace holds one open workstream whose arc holds the developer's go, which is
// the state an ordinary write into a member repository expects.
const WORKSPACE = realpathSync(mkdtempSync(join(tmpdir(), "pretooluse-probe-")));
process.on("exit", () => rmSync(WORKSPACE, { recursive: true, force: true }));
const PROBE_REPO = join(WORKSPACE, "probe-repo");
{
  const arcs = join(workstreamsDir(WORKSPACE, "open"), "041-probe", ARCS);
  for (const [file, body] of Object.entries(arcFiles("RUNNING", true))) {
    mkdirSync(join(arcs, file, ".."), { recursive: true });
    writeFileSync(join(arcs, file), body);
  }
}

// THE PARITY ARM IS THE INCUMBENT, AND THE INCUMBENT IS GOING AWAY. Until the plugin reinstall
// deletes `hooks/scripts/`, every case runs both implementations and requires them to agree. After
// that the Python is not there to run, and each case still asserts what the port itself must decide
// — which is the half that outlives the port.
const hasPython = (name) => existsSync(resolve(SCRIPTS, name));

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
  const [ts, tsWhy] = run("node", [`${HOOKS}/src/scripts/events/pretooluse.ts`], payload, cwd);
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


// The case is that doc-check's finding reaches the dispatcher at all. It rode a long sentence until
// 2026-09-19, when the book retired the length measure; cardinality is a live rule and serves the
// same purpose. A case whose fixture stops being a finding goes green while proving nothing.
one("doc-check's finding survives the chain",
  { tool_name: "Write", tool_input: {
    file_path: join(capabilitiesDir(docsOf(PROBE_REPO)), "01-devex", "04-workspace", "04-docs", "probe.md"),
    content: "# A chapter\n\nYou will find five decisions here. You read each one and you move on.\n" } },
  "note", { says: "cardinality-in-prose" });

one("the generated-file guard, folded in from the shell script",
  { tool_name: "Write", tool_input: { file_path: join(PROBE_REPO, "src", "contract", "validators", "thing.ts"), content: "x" } },
  "deny", { says: "generated Zod validator" });

one("generated build output is refused too",
  { tool_name: "Write", tool_input: { file_path: join(PROBE_REPO, "dist", "generated", "thing.ts"), content: "x" } },
  "deny", { says: "generated build output" });

// ONCE FOR A FILE IN A WINDOW (RD.DEVEX.AGENT.092): the same doc finding about one file is said once
// to a window with a session id, a second file is said, and a second window hears it again.
function onceForAFile(shown) {
  const session = `t-once-${process.pid}-${Date.now()}`;
  const ask = (name, id) => shown({ tool_name: "Write", session_id: id, tool_input: {
    file_path: join(capabilitiesDir(docsOf(PROBE_REPO)), "01-devex", "04-workspace", "04-docs", name),
    content: "# A chapter\n\nYou will find five decisions here. You read each one and you move on.\n" } })[1];
  const first = ask("probe.md", session), second = ask("probe.md", session);
  const otherFile = ask("probe-two.md", session), otherWindow = ask("probe.md", `${session}-b`);
  return [
    ["a doc finding is said the first time", Boolean(first)],
    ["the same finding about the same file is not said again", second === undefined],
    ["the same finding about another file is said", Boolean(otherFile)],
    ["another window hears it", Boolean(otherWindow)],
  ];
}

{
  // WHO A LINE IS FOR (RD.DEVEX.AGENT.092). `systemMessage` is the developer's pane: advice never
  // reaches it, and a refusal does.
  const shown = (payload) => {
    const out = execFileSync("node", [`${HOOKS}/src/scripts/events/pretooluse.ts`],
      { input: JSON.stringify(payload), encoding: "utf8", cwd: `${WORKSPACE}` }).trim();
    if (!out) return [undefined, undefined];
    const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
    return [parsed.systemMessage, parsed.hookSpecificOutput?.additionalContext];
  };
  const [adviceShown, adviceRead] = shown({ tool_name: "Write", tool_input: {
    file_path: join(capabilitiesDir(docsOf(PROBE_REPO)), "01-devex", "04-workspace", "04-docs", "probe.md"),
    content: "# A chapter\n\nYou will find five decisions here. You read each one and you move on.\n" } });
  const [refusalShown] = shown({ tool_name: "Write",
    tool_input: { file_path: join(PROBE_REPO, "dist", "generated", "thing.ts"), content: "x" } });
  for (const [label, ok] of [
    ["advice reaches the agent", Boolean(adviceRead)],
    ["advice is not shown to the developer", adviceShown === undefined],
    ["a refusal is shown to the developer", Boolean(refusalShown)],
    ...onceForAFile(shown),
  ]) {
    n += 1;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  }
}

{
  // split-plan's close gate, through the chain.
  const root = workspace("dispatch-close", {
    [join(DEVEX_WORKSTREAMS, "open", "001-a-subject", "a-subject-approach.html")]:
      `${linesFor("1.0.0").stylesheet}<div class="sds-eyebrow">Workstream 001 &middot; closed</div><section id="s3"><table>
        <thead><tr><th>What</th><th>Scope</th><th>State</th></tr></thead>
        <tbody><tr><td>a</td><td>spn-foundation</td><td></td></tr></tbody></table></section>`,
    [join(DEVEX_WORKSTREAMS, "open", "001-a-subject", ARCS, "N001", "state.json")]: `${JSON.stringify({ schemaVersion: 2, arc: "N001",
      subject: "x", title: "x", status: "LANDED", reason: null, preview: "preview.html",
      rows: [{ id: "1", parent: "N001", title: "a", kind: "change", repo: "spn-foundation", state: "landed" }] })}\n`,
  });
  one("split-plan's close refusal survives the chain",
    { tool_name: "Bash", cwd: root, tool_input: { command: `mv ${DEVEX_WORKSTREAMS}/open/001-a-subject ${DEVEX_WORKSTREAMS}/closed/` } },
    "deny", { says: "row nobody decided", cwd: root });
}

{
  // F9 — the one the Python dropped on the floor every single time.
  const root = workspace("dispatch-confirmed", {
    ...arcAt("001-a-subject", "PROPOSED", false),
    "probe-repo/src/existing.ts": "export const x = 1;\n",
  });
  one("F9: confirmed's warning now reaches the turn",
    { tool_name: "Write", cwd: root, session_id: "d1", tool_input: { file_path: "probe-repo/src/probe.ts", content: "x" } },
    "note", { says: "no open workstream records a go", cwd: root,
              parity: false, why: "the Python dispatcher discarded it — this is finding F9" });
}

{
  // STEP 7 — the mirror nudge, reached through the chain. It is not a port, so there is nothing to
  // compare against: the Python dispatcher never carried it.
  const root = workspace("dispatch-mirror", {
    // The face lives once, in the repository's tree; the node's README is what reaches it.
    [join(capabilitiesDir(DOCS), "01-domain", "01-server", "README.md")]:
      "# Capabilities\n\n## Map\n\n| File | Governs | Carries | Status |\n| --- | --- | --- | --- |\n" +
      "| [app.md](app.md) | [`src/app/`](../../src/app) | the seams | \u2705 |\n",
    "pkg/README.md":
      `# pkg\n\nIts capability face is [the server layer](../${DOCS}/${SEAT.capabilities}/01-domain/01-server/README.md).\n`,
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

{
  // COMMENT-CHECK REACHES THE TURN TOO, and it is the newest link in the chain — a check whose file
  // exists but which no dispatcher imports is a check that never fires, which is how a rule the book
  // names by name went three arcs with nothing behind it.
  one("a history word in a source write is refused through the dispatcher",
    { tool_name: "Write",
      tool_input: { file_path: join(PROBE_REPO, "packages", "pkg", "src", "app", "Session.ts"),
                    content: "/**\n * The live sessions. This used to be a regular expression.\n */\nexport const sessionsOf = (id) => id;\n" } },
    "deny", { says: "history word", parity: false, why: "the Python dispatcher never carried this check" });

  one("and a source write whose comments are right passes the chain untouched",
    { tool_name: "Write",
      tool_input: { file_path: join(PROBE_REPO, "packages", "pkg", "src", "app", "Session.ts"),
                    content: "/**\n * Every session an identity holds, across devices.\n */\nexport const sessionsOf = (id) => id;\n" } },
    "silent", { parity: false, why: "the Python dispatcher never carried this check" });
}

console.log("\n=== pretooluse — a source edit waits while a test run for that repository is going");
{
  // The start file `lib/bash-timing.ts` writes before a timed command, written here by path: the
  // suites run with recording off, and the guard reads the folder whether recording is on or not.
  const root = workspace("dispatch-test-run", {
    ...arcAt("001-a-subject", "RUNNING", true),
    "spn-x/apps/api/src/a.ts": "export const x = 1;\n",
    "spn-x/docs/a.md": "# A\n",
  });
  const pending = join(root, ".spndevex", ".debug", "telemetry", "pending");
  mkdirSync(pending, { recursive: true });
  writeFileSync(join(pending, "toolu_run.json"), JSON.stringify({ at: Date.now() - 90_000, background: false,
    found: [{ script: "spnutils", group: "apps", subgroup: null, action: "test", args: "contract r1 api", repo: "spn-x" }] }));
  one("[MKT.HOOKS.31] the test-run refusal survives the chain, naming the run",
    { tool_name: "Edit", cwd: root, tool_input: { file_path: join(root, "spn-x/apps/api/src/a.ts"), old_string: "1", new_string: "2" } },
    "deny", { says: "spnutils apps test contract r1 api", cwd: root, parity: false, why: "a new guard" });
  one("[MKT.HOOKS.32] a write outside src and tests passes the same chain",
    { tool_name: "Write", cwd: root, tool_input: { file_path: join(root, "spn-x/notes.txt"), content: "x" } },
    "silent", { cwd: root, parity: false, why: "a new guard" });
}

console.log("\n=== pretooluse — a push waits for a whole run of its tree, and a permanent branch takes no commit");
{
  const root = workspace("dispatch-push-tiers", {});
  const repo = join(root, "spn-x");
  mkdirSync(join(repo, "pkg", "src"), { recursive: true });
  writeFileSync(join(repo, "pkg", "spkind.json"), JSON.stringify({ kind: "SUPPORT_SERVER", name: "Pkg", config: { mtype: "SUPPORT_SERVER" } }));
  writeFileSync(join(repo, "pkg", "package.json"), JSON.stringify({ name: "pkg", private: true }));
  writeFileSync(join(repo, "pkg", "src", "a.ts"), "export const a = 1;\n");
  const git = (...args) => execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { stdio: "ignore" });
  git("init", "-q", "-b", "feat/001-x");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  writeFileSync(join(repo, "pkg", "src", "a.ts"), "export const a = 2;\n");
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  one("[MKT.HOOKS.64] the push refusal survives the chain, naming the command to run",
    { tool_name: "Bash", cwd: repo, tool_input: { command: "git push" } },
    "deny", { says: "spnutils apps test unit commit-unit pkg", cwd: root, parity: false, why: "a new guard" });
  one("[MKT.HOOKS.63] a Bash call that is not a push or a commit passes the same chain",
    { tool_name: "Bash", cwd: repo, tool_input: { command: "git status" } },
    "silent", { cwd: root, parity: false, why: "a new guard" });
  one("[MKT.HOOKS.70] a commit on the workstream's branch passes the same chain",
    { tool_name: "Bash", cwd: repo, tool_input: { command: "git commit -m x" } },
    "silent", { cwd: root, parity: false, why: "a new guard" });
  git("checkout", "-q", "-b", "develop");
  one("[MKT.HOOKS.69] a commit on develop is refused by the chain, naming the pull request",
    { tool_name: "Bash", cwd: repo, tool_input: { command: "git commit -m x" } },
    "deny", { says: "pull request", cwd: root, parity: false, why: "a new guard" });
}

console.log("\n=== pretooluse — a long foreground command is met with a note to run it in the background");
one("[MKT.HOOKS.53] `pnpm test` in the foreground gets a note through the chain",
  { tool_name: "Bash", tool_input: { command: "pnpm test" } }, "note",
  { says: "background shell", parity: false, why: "a new guard" });
one("[MKT.HOOKS.54] the same command with run_in_background:true passes the chain silently",
  { tool_name: "Bash", tool_input: { command: "pnpm test", run_in_background: true } }, "silent",
  { parity: false, why: "a new guard" });

console.log("\n=== pretooluse — a block `spnutils` writes is never edited by hand");
{
  // The two marker lines, as `managed-keys.ts` in `spn-support-ts` states them. Each is built here from
  // its parts, so this file holds no line that is a marker.
  const BEGIN = `<!-- spnutils:agent:${"begin"} -->`, END = `<!-- spnutils:agent:${"end"} -->`;
  const BLOCK = [BEGIN, "# CLAUDE.md — probe-repo", "The plugins carry every rule.", "@docs/README.md", END].join("\n");
  const OWN = "\n## Notes of my own\n\nA line a person wrote.\n";
  const managed = join(PROBE_REPO, "CLAUDE.md");
  mkdirSync(PROBE_REPO, { recursive: true });
  writeFileSync(managed, BLOCK + "\n" + OWN);
  const waived = { parity: false, why: "a new guard" };

  one("[MKT.HOOKS.33] an Edit whose old_string sits between the markers is refused, naming both commands",
    { tool_name: "Edit", tool_input: { file_path: managed, old_string: "The plugins carry every rule.", new_string: "The plugins carry most rules." } },
    "deny", { says: "spnutils workspace agent-sync", ...waived });
  one("[MKT.HOOKS.33] and the refusal names the repository's command too",
    { tool_name: "Edit", tool_input: { file_path: managed, old_string: "@docs/README.md", new_string: "@docs/OTHER.md" } },
    "deny", { says: "spnutils repo agent-sync", ...waived });
  one("[MKT.HOOKS.33] an Edit that takes out a marker line is refused",
    { tool_name: "Edit", tool_input: { file_path: managed, old_string: `${END}\n`, new_string: "" } },
    "deny", { says: "agent-sync", ...waived });
  one("[MKT.HOOKS.33] an Edit that starts below the block and reaches into it is refused",
    { tool_name: "Edit", tool_input: { file_path: managed, old_string: `@docs/README.md\n${END}\n\n## Notes of my own`, new_string: "## Notes" } },
    "deny", { says: "agent-sync", ...waived });
  one("[MKT.HOOKS.33] a Write whose text between the markers differs from the file on disk is refused",
    { tool_name: "Write", tool_input: { file_path: managed, content: BLOCK.replace("every rule", "no rule") + "\n" + OWN } },
    "deny", { says: "agent-sync", ...waived });
  one("[MKT.HOOKS.33] a Write that drops the block is refused",
    { tool_name: "Write", tool_input: { file_path: managed, content: OWN } },
    "deny", { says: "agent-sync", ...waived });

  one("[MKT.HOOKS.34] an Edit below the end marker passes",
    { tool_name: "Edit", tool_input: { file_path: managed, old_string: "A line a person wrote.", new_string: "A line a person changed." } },
    "silent", waived);
  one("[MKT.HOOKS.34] a Write that keeps the block's bytes passes",
    { tool_name: "Write", tool_input: { file_path: managed, content: BLOCK + "\n\n## Other notes\n\nAnother line.\n" } },
    "silent", waived);
  const plain = join(PROBE_REPO, "NOTES.txt");
  writeFileSync(plain, "one\ntwo\nthree\n");
  one("[MKT.HOOKS.34] an Edit of a file with no marker passes",
    { tool_name: "Edit", tool_input: { file_path: plain, old_string: "two", new_string: "2" } }, "silent", waived);
  // A file that names the markers inside a line, as source code and a plan do, holds no block.
  const quoting = join(PROBE_REPO, "markers.txt");
  writeFileSync(quoting, `const begin = '${BEGIN}';\nconst between = 1;\nconst end = '${END}';\n`);
  one("[MKT.HOOKS.34] a file that only quotes a marker inside a line holds no block",
    { tool_name: "Edit", tool_input: { file_path: quoting, old_string: "const between = 1;", new_string: "const between = 2;" } },
    "silent", waived);
  one("[MKT.HOOKS.34] a Write of a file that is not on disk yet passes",
    { tool_name: "Write", tool_input: { file_path: join(PROBE_REPO, "fresh.txt"), content: BLOCK } }, "silent", waived);
  one("[MKT.HOOKS.34] a Bash call that runs the command which writes the block is not judged by the agent-block guard",
    { tool_name: "Bash", tool_input: { command: "spnutils workspace agent-sync" } }, "note",
    { ...waived, says: "background shell" });
}

// UNTOUCHED — the ordinary calls that must stay silent and cheap.
one("an ordinary Bash call", { tool_name: "Bash", tool_input: { command: "git status --short" } }, "silent");
one("reading a source file", { tool_name: "Read", tool_input: { file_path: `${WORKSPACE}/CLAUDE.md` } }, "silent");
one("editing an ordinary source file",
  { tool_name: "Edit", tool_input: { file_path: join(PROBE_REPO, "src", "thing.ts"), new_string: "export const x = 2;" } }, "silent");
one("a malformed payload allows", {}, "silent");

console.log("\n=== 2l — a publish is met by a reminder (RD.DEVEX.WORKSPACE.117), and refused for a page that loads its styles from outside (RD.DEVEX.WORKSPACE.215)");

const APPROACH = join(WORKSPACE, ".spndevex", "workstreams", "open", "041-probe", "probe-approach.html");
one("2l: publishing an approach page reminds that nothing is published unless the developer asks",
  { tool_name: "Artifact", tool_input: { file_path: APPROACH, icon: "plan" } }, "note",
  { says: "unless the developer asks", parity: false, why: "a new check" });
one("2l: the reminder names the full path to hand over instead",
  { tool_name: "Artifact", tool_input: { action: "publish", file_path: APPROACH } }, "note",
  { says: APPROACH, parity: false, why: "a new check" });
one("2l: a publish of a report reminds too",
  { tool_name: "Artifact", tool_input: { file_path: join(PROBE_REPO, "docs", "artifacts", "reports", "coverage-report.html") } }, "note",
  { says: "RD.DEVEX.WORKSPACE.117", parity: false, why: "a new check" });
one("2l: reading an artifact is not a publish, so it is silent",
  { tool_name: "Artifact", tool_input: { action: "read", url: "https://claude.ai/artifact/x" } }, "silent",
  { parity: false, why: "a new check" });
one("2l: listing artifacts is silent",
  { tool_name: "Artifact", tool_input: { action: "list" } }, "silent", { parity: false, why: "a new check" });
one("2l: an asset upload to a page already published is silent",
  { tool_name: "Artifact", tool_input: { url: "https://claude.ai/artifact/x", asset: true, file_path: "/tmp/a.png" } }, "silent",
  { parity: false, why: "a new check" });
{
  // KNOWN-BAD: a stored page, which loads its version's stylesheet and script from the shared address.
  const reports = join(PROBE_REPO, "docs", "artifacts", "reports");
  mkdirSync(reports, { recursive: true });
  const stored = join(reports, "tests-report.html");
  const BODY = `<header class="sds-masthead"><h1>Tests report</h1></header>\n<section id="s0"><p>You read it once.</p></section>\n`;
  writeFileSync(stored, `<!doctype html>\n${linesFor("1.0.0").stylesheet}\n${BODY}${linesFor("1.0.0").script}\n`);
  one("[MKT.HOOKS.46] known-bad: a publish of a page that links the shared address is refused through the chain",
    { tool_name: "Artifact", tool_input: { file_path: stored, icon: "chart" } }, "deny",
    { says: `spn-devex docs sds bundle ${stored}`, parity: false, why: "a new check" });
  one("[MKT.HOOKS.46] and the refusal names the copy to publish instead",
    { tool_name: "Artifact", tool_input: { action: "publish", file_path: stored } }, "deny",
    { says: join(reports, "tests-report.bundled.html"), parity: false, why: "a new check" });
  // UNTOUCHED: the bundled copy carries its styles and its script inside it.
  const bundled = join(reports, "tests-report.bundled.html");
  writeFileSync(bundled, `<!doctype html>\n<style>.sds-masthead{margin:0}</style>\n${BODY}<script>document.documentElement.classList.add("sds-has-script");</script>\n`);
  one("[MKT.HOOKS.46] untouched: the bundled copy is reminded and not refused",
    { tool_name: "Artifact", tool_input: { file_path: bundled } }, "note",
    { says: "unless the developer asks", parity: false, why: "a new check" });
}
{
  n += 1;
  const hooks = JSON.parse(readFileSync(resolve(HOOKS, "src", "hooks", "hooks.json"), "utf8"));
  const matchers = (hooks.hooks.PreToolUse ?? []).map((entry) => entry.matcher ?? "");
  const ok = matchers.some((matcher) => new RegExp(`^(?:${matcher})$`).test("Artifact"));
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  2l: hooks.json routes the Artifact tool through PreToolUse\n        matchers ${JSON.stringify(matchers)}`);
}

console.log("\n=== pretooluse — a launch of a helper agent names its model, and the order's");
{
  const orders = join(WORKSPACE, ".spndevex", "workstreams", "open", "041-probe", "notes", "N1", "orders");
  mkdirSync(orders, { recursive: true });
  writeFileSync(join(orders, "01-the-thing.md"), '---\nrow: "1"\nmodel: sonnet\n---\n# Order 1\n');
  const order = join(orders, "01-the-thing.md");
  const launch = (extra, tool = "Agent") => ({ tool_name: tool, session_id: "agent-model", cwd: WORKSPACE,
    tool_input: { description: "a helper", prompt: "Do the work.", ...extra } });
  const waived = { parity: false, why: "the Python has no Agent branch" };
  one("agent-model: a launch with no model is refused", launch({ subagent_type: "general-purpose" }), "deny", { says: "model", ...waived });
  one("agent-model: the same under the name Task", launch({}, "Task"), "deny", { says: "model", ...waived });
  one("agent-model: a fork is refused", launch({ subagent_type: "fork", model: "sonnet" }), "deny", { says: "fork", ...waived });
  one("agent-model: an order saying sonnet, launched on opus, is refused",
    launch({ model: "opus", prompt: `Carry out the order at ${order} exactly.` }), "deny", { says: "sonnet", ...waived });
  one("agent-model: an order saying sonnet, launched on sonnet, is allowed",
    launch({ model: "sonnet", prompt: `Carry out the order at ${order} exactly.` }), "silent", waived);
  one("agent-model: a full model name in the same family is allowed",
    launch({ model: "claude-sonnet-5-5", prompt: `Carry out the order at ${order} exactly.` }), "silent", waived);
  one("agent-model: a prompt naming no order, with a model, is allowed", launch({ model: "haiku" }), "silent", waived);
}

console.log("\n=== pretooluse — an order asks for no screenshot unless the developer asked to see a look");
{
  const orders = join(WORKSPACE, ".spndevex", "workstreams", "open", "041-probe", "notes", "N1", "orders");
  mkdirSync(orders, { recursive: true });
  const write = (name, content, tool = "Write") => ({ tool_name: tool, session_id: "order-picture", cwd: WORKSPACE,
    tool_input: { file_path: join(orders, name), ...(tool === "Write" ? { content } : { old_string: "x", new_string: content }) } });
  const waived = { parity: false, why: "the Python has no order-picture check" };
  one("order-picture: a step asking for screenshots is refused, naming the probe",
    write("03-look.md", "# Order\n\n1. Open the page and take a screenshot of the card.\n"), "deny", { says: "browser probe", ...waived });
  one("order-picture: a `.png` in a step is refused", write("03-look.md", "Save the result to card.png.\n"), "deny", { says: "277", ...waived });
  one("order-picture: a `.png` the step captures is refused",
    write("03-look.md", "1. Capture the card in dark as `card-dark.png`.\n"), "deny", { says: "277", ...waived });
  one("order-picture: an image file imported as media is allowed",
    write("16-feature.md", "1. Import `Welcome.page-tour-light.png` and `Welcome.page-tour-dark.png` from `SC/pages/start/` as the feature's media.\n"), "silent", waived);
  one("order-picture: a `.png` named as a file the page shows is allowed",
    write("16-feature.md", "The hero's media is `hero.png`, already in the repository.\n"), "silent", waived);
  one("order-picture: `page.screenshot` is refused under the name Edit too", write("03-look.md", "Run page.screenshot on it.\n", "Edit"), "deny", { says: "browser probe", ...waived });
  one("order-picture: a screenshot with the developer's ask cited is allowed",
    write("03-look.md", "The developer asked to see the card in dark.\n\n1. Take a screenshot of the card.\n"), "silent", waived);
  one("order-picture: a quoted ask with a time is allowed",
    write("03-look.md", 'The developer: "show me the card" 2026-10-19 17:10.\n\n1. Take a screenshot.\n'), "silent", waived);
  one("order-picture: a line saying never to take one is allowed", write("03-look.md", "Never take a screenshot; read the values.\n"), "silent", waived);
  one("order-picture: a Do not section naming screenshots is allowed", write("03-look.md", "## Do not\n\nTake any screenshot.\n"), "silent", waived);
  one("order-picture: an order that asks for values only is allowed", write("03-look.md", "1. Run `spn-devex browser probe <url> --select .card`.\n"), "silent", waived);
  one("order-picture: a report is not judged", write("03-look.report.md", "I took a screenshot.\n"), "silent", waived);
  one("order-picture: a file outside orders is not judged", { tool_name: "Write", session_id: "order-picture", cwd: WORKSPACE,
    tool_input: { file_path: join(WORKSPACE, "notes.md"), content: "take a screenshot\n" } }, "silent", waived);
}

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
    "an edit to a source file": { tool_name: "Edit", tool_input: { file_path: join(PROBE_REPO, "src", "a.ts"), new_string: "x" } },
  };
  for (const [label, payload] of Object.entries(cases)) {
    const py = median(() => run("python3", [`${SCRIPTS}/pretooluse.py`], payload, `${WORKSPACE}`));
    const ts = median(() => run("node", [`${HOOKS}/src/scripts/events/pretooluse.ts`], payload, `${WORKSPACE}`));
    console.log(`  ${label.padEnd(26)} python3 ${py.toFixed(1).padStart(6)} ms   node ${ts.toFixed(1).padStart(6)} ms   (whole chain, start-up included)`);
  }
}

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
