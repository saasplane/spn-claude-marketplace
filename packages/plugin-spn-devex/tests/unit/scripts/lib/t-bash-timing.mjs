// `lib/bash-timing.ts` — the Bash commands the agent runs, timed by pairing the hooks before and
// after the call on `tool_use_id` (RULE.DEVEX.WORKSPACE.185, N8 row 2p).
//
// Driven through the real entries: `events/pretooluse.ts` writes `sessions/<session>/pending/<id>.json` for a
// matched command while recording is on, and `events/closed.ts` — registered for `PostToolUse` and
// `PostToolUseFailure` on Bash — reads it, writes one line for the call, and removes it. Every case
// points a temporary workspace (with `.spndevex/.debug/switches.json`) at the recorder.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const EVENTS = resolve(PLUGIN, "src", "scripts", "events");
// Every row of the family holds the base, in this order; a variant adds only what its kind needs.
const BASE = ["v", "mtype", "id", "at", "ms", "event", "session", "agent", "workstream", "arc", "part", "skill", "stage", "work", "retryOf"];
const COMMAND_KEYS = [...BASE, "call", "exit"];
const CHECK_KEYS = [...BASE, "check", "verdict", "out", "pluginVersion"];
const TEST_KEYS = [...BASE, "call", "status", "test"];

let total = 0, failed = 0;
const same = (label, got, expected) => {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n        got ${JSON.stringify(got)}\n        expected ${JSON.stringify(expected)}`}`);
};

const env = () => { const copy = { ...process.env }; delete copy.SPN_TELEMETRY; return copy; };
const hook = (entry, payload) => {
  try {
    return execFileSync("node", [join(EVENTS, `${entry}.ts`)], { input: JSON.stringify(payload), env: env(), encoding: "utf8",
      cwd: payload.cwd, stdio: ["pipe", "pipe", "pipe"] });
  } catch (error) { return String(error.stdout ?? ""); }
};
const pendingOf = (root) => join(root, ".spndevex", ".debug", "sessions", "sess-2p", "pending");
const logOf = (root) => {
  const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
  return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
};
const commands = (root) => logOf(root).filter((line) => line.mtype === "COMMAND" && line.event === "command");
const checks = (root) => logOf(root).filter((line) => line.mtype === "CHECK");

const ON = { ".spndevex/.debug/switches.json": "{\"telemetry\": true}\n", "spn-infra-ts/README.md": "x\n" };
const call = (root, id, command, extra = {}) => ({
  session_id: "sess-2p", tool_name: "Bash", tool_use_id: id, cwd: join(root, "spn-infra-ts"),
  tool_input: { command, ...(extra.input ?? {}) }, ...(extra.payload ?? {}),
});

console.log("=== a matched command, paired before and after");
{
  const root = workspace("2p-pair", ON);
  const before = call(root, "toolu_pair", "spnutils infra platform up dmo --apply");
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  same("PreToolUse writes the start file for a matched command", existsSync(join(pendingOf(root), "toolu_pair.json")), true);
  const pending = readFileSync(join(pendingOf(root), "toolu_pair.json"), "utf8");
  same("[MKT.HOOKS.41] the pending file holds the repository, the call and whether it is a suite, and no arguments", [pending.includes("--apply"), pending.includes("dmo"), JSON.parse(pending).found[0].call, JSON.parse(pending).found[0].suite],
    [false, false, { program: "spnutils", group: "infra", action: "platform up" }, false]);
  hook("closed", { ...before, hook_event_name: "PostToolUse", tool_response: { stdout: "héllo", stderr: "!", interrupted: false } });
  const lines = commands(root);
  same("PostToolUse writes one line", lines.length, 1);
  const line = lines[0] ?? {};
  same("with every key, in the family's order: the base, then `call` and `exit`", Object.keys(line), COMMAND_KEYS);
  same("[MKT.HOOKS.41] the row is a version 1 COMMAND of the command event", [line.v, line.mtype, line.event], [1, "COMMAND", "command"]);
  same("the call is the program, the group and the action, a plugin command's subgroup written into the action",
    line.call, { program: "spnutils", group: "infra", action: "platform up" });
  same("it worked", line.exit, 0);
  same("ms is a whole number of milliseconds", Number.isInteger(line.ms) && line.ms >= 0, true);
  same("at is UTC ending in Z", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(line.at ?? ""), true);
  same("the session is the hook's and the id a short one", [line.session, typeof line.id === "string" && line.id.length > 0], ["sess-2p", true]);
  same("the start file is removed", existsSync(join(pendingOf(root), "toolu_pair.json")), false);
  same("[MKT.HOOKS.41] no arguments are written in the row", [JSON.stringify(line).includes("--apply"), JSON.stringify(line).includes("dmo")], [false, false]);
  same("every hook line carries at ending in Z too", logOf(root).every((one) => /Z$/.test(one.at)), true);
  // Each check is a row with its own ms; no row stands for the hook's whole run.
  const ran = checks(root);
  same("[MKT.SCRIPTS.328] each check writes one CHECK row with the check's own name and ms, and the family's keys", ran.length > 0 && ran.every((one) => JSON.stringify(Object.keys(one)) === JSON.stringify(CHECK_KEYS)
    && one.mtype === "CHECK" && typeof one.check === "string" && typeof one.ms === "number"), true);
  same("[MKT.SCRIPTS.328] no check is written twice for one call, and each holds a verdict of PASS, NOTE or DENY", [new Set(ran.map((one) => `${one.event} ${one.check}`)).size === ran.length, ran.every((one) => ["PASS", "NOTE", "DENY"].includes(one.verdict) && typeof one.ms === "number")], [true, true]);
  same("[MKT.SCRIPTS.328] and no whole-run row: no check is named for the entry itself", ran.some((one) => ["pretooluse", "closed-run", "events"].includes(one.check)), false);
}

console.log("\n=== a failed call, read from PostToolUseFailure");
{
  const root = workspace("2p-fail", ON);
  const before = call(root, "toolu_fail", "cd /tmp && spnutils apps check service-platform-ts");
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  hook("closed", { ...before, hook_event_name: "PostToolUseFailure", error: "Exit code 3\nnx failed" });
  const line = commands(root)[0] ?? {};
  same("the exit is the failure's code", line.exit, 3);
  same("a failed call is a COMMAND row with the failure's exit and no arguments", [line.mtype, line.call], ["COMMAND", { program: "spnutils", group: "apps", action: "check" }]);
  const other = call(root, "toolu_fail2", "git push");
  hook("pretooluse", { ...other, hook_event_name: "PreToolUse" });
  hook("closed", { ...other, hook_event_name: "PostToolUseFailure", error: "interrupted" });
  same("a failure with no code reads 1", commands(root).at(-1)?.exit, 1);
  same("[MKT.HOOKS.42] a failed call runs no check, so its command row stands alone: no CHECK row under PostToolUseFailure, and no whole-run row",
    [logOf(root).filter((one) => one.event === "PostToolUseFailure").length, commands(root).length], [0, 2]);
}

console.log("\n=== a failed call made by a child agent");
{
  const root = workspace("n006-agent-fail", ON);
  const before = call(root, "toolu_agent_fail", "git rev-parse --verify no-such-ref", { payload: { agent_id: "agent-child-1" } });
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  same("the start file is written for the agent's call", existsSync(join(pendingOf(root), "toolu_agent_fail.json")), true);
  hook("closed", { ...before, hook_event_name: "PostToolUseFailure", error: "Exit code 128\nfatal: Needed a single revision" });
  const line = commands(root).at(-1) ?? {};
  same("[MKT.HOOKS.44] the agent's failed call writes its line, with the exit code and the agent",
    [line.call, line.exit, line.agent], [{ program: "git", group: null, action: "rev-parse" }, 128, "agent-child-1"]);
  same("[MKT.HOOKS.44] and its start file is removed", existsSync(join(pendingOf(root), "toolu_agent_fail.json")), false);
  const main = call(root, "toolu_main_fail", "git rev-parse --verify no-such-ref");
  hook("pretooluse", { ...main, hook_event_name: "PreToolUse" });
  hook("closed", { ...main, hook_event_name: "PostToolUseFailure", error: "Exit code 128" });
  same("the main window's failed call is closed the same way, with no agent",
    [commands(root).at(-1)?.exit, commands(root).at(-1)?.agent, readdirSync(pendingOf(root))], [128, null, []]);
}

console.log("\n=== what writes nothing");
{
  const root = workspace("2p-none", ON);
  const before = call(root, "toolu_none", "ls -la && cat README.md | head -3");
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  same("an unmatched command writes no start file", existsSync(join(pendingOf(root), "toolu_none.json")), false);
  hook("closed", { ...before, hook_event_name: "PostToolUse", tool_response: { stdout: "" } });
  same("and no command line", commands(root).length, 0);
}
{
  const root = workspace("2p-off", { "spn-infra-ts/README.md": "x\n" });
  const before = call(root, "toolu_off", "spnutils apps test unit x");
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  same("with recording off, a matched command writes no start file", existsSync(pendingOf(root)), false);
}

console.log("\n=== a secret, a background call, and a compound command");
{
  const root = workspace("2p-more", ON);
  const secret = call(root, "toolu_secret", "spnutils infra config set --token abc123 --api-key=zzz FOO");
  hook("pretooluse", { ...secret, hook_event_name: "PreToolUse" });
  same("[MKT.HOOKS.41] a secret option's value is in no file the call writes, the start file included", readFileSync(join(pendingOf(root), "toolu_secret.json"), "utf8").includes("abc123"), false);
  hook("closed", { ...secret, hook_event_name: "PostToolUse", tool_response: {} });
  same("a command with a secret in it is its call and nothing it was typed with", commands(root).at(-1)?.call, { program: "spnutils", group: "infra", action: "config set" });
  same("and the value appears nowhere in the log", readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").includes("abc123"), false);

  const background = call(root, "toolu_bg", "spnutils apps dev service-platform-ts", { input: { run_in_background: true } });
  hook("pretooluse", { ...background, hook_event_name: "PreToolUse" });
  hook("closed", { ...background, hook_event_name: "PostToolUse", tool_response: { backgroundTaskId: "b1" } });
  same("a background call writes its line at PostToolUse with exit null", commands(root).at(-1)?.exit, null);

  const before = commands(root).length;
  const compound = call(root, "toolu_many", "git add x && git commit -m 'a b' -- x && spnutils apps check x");
  hook("pretooluse", { ...compound, hook_event_name: "PreToolUse" });
  hook("closed", { ...compound, hook_event_name: "PostToolUse", tool_response: {} });
  const written = commands(root).slice(before);
  same("[MKT.HOOKS.41] a call that ran three programs writes one row, named for the first the filter matches",
    written.map((one) => `${one.call.program} ${one.call.action}`), ["git add"]);
  same("so the call's time is summed once", written.reduce((sum, one) => sum + one.ms, 0), written[0]?.ms);
  const mixed = call(root, "toolu_mixed", "ls -la && spnutils apps check x; git status");
  hook("pretooluse", { ...mixed, hook_event_name: "PreToolUse" });
  hook("closed", { ...mixed, hook_event_name: "PostToolUse", tool_response: {} });
  same("a program the filter does not name is neither the line's name nor counted",
    commands(root).slice(before + 1).map((one) => [one.call.program, one.call.action]), [["spnutils", "check"]]);

  // A refused call leaves its start file behind: the hook wrote it, and no hook runs after a refusal.
  // Only the 14-day sweep of the window's folder removes it; writing the next start file prunes nothing.
  mkdirSync(pendingOf(root), { recursive: true });
  const minutesAgo = (minutes) => (Date.now() - minutes * 60 * 1000) / 1000;
  const refused = join(pendingOf(root), "toolu_refused.json");
  writeFileSync(refused, JSON.stringify({ at: Date.now() - 11 * 60 * 1000, background: false, found: [] }));
  utimesSync(refused, minutesAgo(11), minutesAgo(11));
  hook("pretooluse", { ...call(root, "toolu_fresh", "git status"), hook_event_name: "PreToolUse" });
  same("[MKT.HOOKS.43] a start file older than ten minutes is left where it is when the next one is written",
    readdirSync(pendingOf(root)).sort(), ["toolu_fresh.json", "toolu_refused.json"]);
}

console.log("\n=== usage-first no longer stands in the way");
{
  const root = workspace("2p-no-usage-first", ON);
  // The first call of a group, with no bare call before it: it was refused and never timed while usage-first stood.
  const first = call(root, "toolu_first", "spnutils infra platform up dmo --apply");
  const out = hook("pretooluse", { ...first, hook_event_name: "PreToolUse" });
  same("[MKT.HOOKS.325] a first write of a command group is not refused", out.includes("permissionDecision"), false);
  same("[MKT.HOOKS.325] and it is timed: its start file is written", existsSync(join(pendingOf(root), "toolu_first.json")), true);
  hook("closed", { ...first, hook_event_name: "PostToolUse", tool_response: {} });
  same("[MKT.HOOKS.325] and its line is written", commands(root).map((one) => one.call.action), ["platform up"]);
}

console.log("\n=== the workspace filter file");
{
  const root = workspace("2p-filter", { ...ON, ".spndevex/.debug/workspace/filter.json": JSON.stringify({ remove: ["git"], add: [{ program: "make" }] }) });
  const git = call(root, "toolu_git", "git status");
  hook("pretooluse", { ...git, hook_event_name: "PreToolUse" });
  same("a program the filter removes writes no start file", existsSync(join(pendingOf(root), "toolu_git.json")), false);
  const make = call(root, "toolu_make", "make build");
  hook("pretooluse", { ...make, hook_event_name: "PreToolUse" });
  hook("closed", { ...make, hook_event_name: "PostToolUse", tool_response: {} });
  same("a program the filter adds is timed", commands(root).map((one) => [one.call.program, one.call.action]), [["make", "build"]]);
}

console.log("\n=== a call made outside the workspace — MKT.HOOKS.340");
{
  const root = workspace("2p-outside", ON);
  const away = mkdtempSync(join(tmpdir(), "bash-timing-away-"));
  const withProject = () => ({ ...env(), CLAUDE_PROJECT_DIR: root });
  const run = (entry, payload) => { try { return execFileSync("node", [join(EVENTS, `${entry}.ts`)], { input: JSON.stringify(payload), env: withProject(), encoding: "utf8", cwd: away, stdio: ["pipe", "pipe", "pipe"] }); } catch (error) { return String(error.stdout ?? ""); } };
  const outside = { session_id: "sess-2p", tool_name: "Bash", tool_use_id: "toolu_out", cwd: away, tool_input: { command: "spnutils infra platform up dmo --apply" } };
  run("pretooluse", { ...outside, hook_event_name: "PreToolUse" });
  same("[MKT.HOOKS.340] PreToolUse writes the start file under the workspace", existsSync(join(pendingOf(root), "toolu_out.json")), true);
  run("closed", { ...outside, hook_event_name: "PostToolUse", tool_response: {} });
  same("[MKT.HOOKS.340] the call is timed under the workspace's telemetry", commands(root).map((one) => one.call.action), ["platform up"]);
}

console.log("\n=== a retried call carries the failed row's id — MKT.SCRIPTS.328");
{
  const root = workspace("2p-retry", ON);
  const run = (id, exit, payload = {}) => {
    const one = call(root, id, "git rev-parse --verify no-such-ref", { payload });
    hook("pretooluse", { ...one, hook_event_name: "PreToolUse" });
    hook("closed", exit ? { ...one, hook_event_name: "PostToolUseFailure", error: `Exit code ${exit}` } : { ...one, hook_event_name: "PostToolUse", tool_response: {} });
  };
  run("toolu_r1", 128);
  run("toolu_r2", 128);
  run("toolu_r3", 0);
  run("toolu_r4", 0);
  const rows = commands(root);
  same("[MKT.SCRIPTS.328] the first call has no retryOf, and the next call of the same program, group and action carries the failed row's id",
    [rows[0].retryOf, rows[1].retryOf === rows[0].id, rows[2].retryOf === rows[1].id], [null, true, true]);
  same("[MKT.SCRIPTS.328] a call that succeeded clears the failure: the one after it retries nothing", rows[3].retryOf, null);
  run("toolu_r5", 1, { agent_id: "agent-a" });
  run("toolu_r6", 0);
  run("toolu_r7", 0, { agent_id: "agent-b" });
  const after = commands(root).slice(4);
  same("[MKT.SCRIPTS.328] a failure is retried by the same agent only: another agent's call, and the main window's, retry nothing", after.map((one) => one.retryOf), [null, null, null]);
}

console.log("\n=== a plugin command refused for its usage — MKT.SCRIPTS.328");
{
  const root = workspace("2p-usage", ON);
  let code = 0;
  try { execFileSync("node", [join(PLUGIN, "src", "scripts", "cli.ts"), "debug", "store", "show", "--sizes"], { env: { ...env(), SPN_WORKSPACE: root }, cwd: root, stdio: "pipe" }); } catch (error) { code = error.status; }
  const line = commands(root).at(-1) ?? {};
  same("[MKT.SCRIPTS.328] a command refused for its usage is a COMMAND row with exit 2", [code, line.exit], [2, 2]);
  same("[MKT.SCRIPTS.328] and the row names the program and the group and action it was typed with, never the option", [line.call?.program, line.call?.group, line.call?.action, JSON.stringify(line).includes("sizes")], ["spn-devex", "debug", "store show", false]);
}

console.log("\n=== a background test run is written from its verdict — MKT.SCRIPTS.330");
{
  // The go's full run of the repository is running, so the whole suite is not refused and the start file is written.
  const OPEN = ".spndevex/workstreams/open/036-probe";
  const root = workspace("2p-tests", { ...ON,
    [`${OPEN}/arcs/N004/state.json`]: `${JSON.stringify({ schemaVersion: 2, arc: "N004", subject: "probe", title: "t", goal: null, status: "DECIDED", reason: null, preview: "preview.html", rows: [] })}\n`,
    [`${OPEN}/arcs/N004/go.json`]: `${JSON.stringify({ schemaVersion: 1, lead: "N004", scope: ["N004"], writtenAt: "2026-10-31T09:00+05:30", parts: [
      { id: "full-spn-infra-ts", repo: "spn-infra-ts", work: "TEST", entries: [], tests: [], minutes: null, measuredFrom: null, waitsOn: [], model: "sonnet", signature: "", state: "running" }] })}\n` });
  const home = mkdtempSync(join(tmpdir(), "bash-timing-home-"));
  const room = join(home, "cache", "verdicts", "org", "repo");
  const withHome = { ...env(), SPN_MACHINE_HOME: home };
  const run = (entry, payload) => { try { return execFileSync("node", [join(EVENTS, `${entry}.ts`)], { input: JSON.stringify(payload), env: withHome, encoding: "utf8", cwd: payload.cwd, stdio: ["pipe", "pipe", "pipe"] }); } catch (error) { return String(error.stdout ?? ""); } };
  const launch = call(root, "toolu_tests", "spnutils apps test unit full-036-n017 utility-ts", { input: { run_in_background: true } });
  run("pretooluse", { ...launch, hook_event_name: "PreToolUse" });
  run("closed", { ...launch, hook_event_name: "PostToolUse", tool_response: { backgroundTaskId: "b9" } });
  same("[MKT.SCRIPTS.330] a background test run writes no command row when it is launched", commands(root).length, 0);
  const write = (tier, project, passed, failed, durationMs) => {
    mkdirSync(join(room, tier), { recursive: true });
    writeFileSync(join(room, tier, `${project}.json`), JSON.stringify({ project, tier: tier.toUpperCase(), run: "full-036-n017", worktree: join(root, "spn-infra-ts"), at: new Date().toISOString(), durationMs, passed, failed, skipped: 0 }));
  };
  write("unit", "utility-ts", 2044, 0, 19387);
  write("component", "page-ts", 10, 2, 5000);
  const next = call(root, "toolu_next", "git status");
  run("pretooluse", { ...next, hook_event_name: "PreToolUse" });
  run("closed", { ...next, hook_event_name: "PostToolUse", tool_response: {} });
  const tests = logOf(root).filter((one) => one.mtype === "TEST").sort((a, b) => a.test.tier.localeCompare(b.test.tier));
  same("[MKT.SCRIPTS.330] one TEST row for each tier and node, in place of the command's row", tests.map((one) => [one.test.node, one.test.tier]), [["page-ts", "COMPONENT"], ["utility-ts", "UNIT"]]);
  same("[MKT.SCRIPTS.330] each row holds the verdict's time and counts and its status", tests.map((one) => [one.ms, one.status, one.test.tests]),
    [[5000, "FAILED", { passed: 10, failed: 2, skipped: 0 }], [19387, "SUCCESS", { passed: 2044, failed: 0, skipped: 0 }]]);
  same("[MKT.SCRIPTS.330] a TEST row holds the family's keys, the call without its arguments, and work TEST", [Object.keys(tests[0]).join(), tests[0].work, tests[0].call], [TEST_KEYS.join(), "TEST", { program: "spnutils", group: "apps", action: "test" }]);
  run("pretooluse", { ...call(root, "toolu_again", "git status"), hook_event_name: "PreToolUse" });
  run("closed", { ...call(root, "toolu_again", "git status"), hook_event_name: "PostToolUse", tool_response: {} });
  same("[MKT.SCRIPTS.330] a verdict is written once, however many calls follow", logOf(root).filter((one) => one.mtype === "TEST").length, 2);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — bash timing` : `\n  all ${total} passed — bash timing`);
process.exit(failed ? 1 : 0);
