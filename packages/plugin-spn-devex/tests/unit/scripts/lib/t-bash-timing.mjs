// `lib/bash-timing.ts` — the Bash commands the agent runs, timed by pairing the hooks before and
// after the call on `tool_use_id` (RD.DEVEX.WORKSPACE.185, N8 row 2p).
//
// Driven through the real entries: `events/pretooluse.ts` writes `telemetry/pending/<id>.json` for a
// matched command while recording is on, and `events/closed.ts` — registered for `PostToolUse` and
// `PostToolUseFailure` on Bash — reads it, writes one line for the call, and removes it. Every case
// points a temporary workspace (with `.spndevex/.debug/telemetry.on`) at the recorder.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const EVENTS = resolve(PLUGIN, "src", "scripts", "events");
const KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "session", "agent", "workstream", "arc", "order"];
// A Bash command's line carries one more key, after the seventeen every line carries.
const COMMAND_KEYS = [...KEYS, "programs"];

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
const pendingOf = (root) => join(root, ".spndevex", ".debug", "telemetry", "pending");
const logOf = (root) => {
  const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
  return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
};
const commands = (root) => logOf(root).filter((line) => line.event === "command" && line.tool === "Bash");

const ON = { ".spndevex/.debug/telemetry.on": "on\n", "spn-infra-ts/README.md": "x\n" };
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
  hook("closed", { ...before, hook_event_name: "PostToolUse", tool_response: { stdout: "", stderr: "", interrupted: false } });
  const lines = commands(root);
  same("PostToolUse writes one line", lines.length, 1);
  const line = lines[0] ?? {};
  same("with every key, in the book's order, and `programs` after them", Object.keys(line), COMMAND_KEYS);
  same("[MKT.HOOKS.41] a call that ran one program reads programs 1", line.programs, 1);
  same("script, levels and args read from the command",
    [line.script, line.group, line.subgroup, line.action, line.args], ["spnutils", "infra", "platform", "up", "dmo --apply"]);
  same("the agent ran it, through Bash, and it worked", [line.event, line.tool, line.exit], ["command", "Bash", 0]);
  same("ms is a whole number of milliseconds", Number.isInteger(line.ms) && line.ms >= 0, true);
  same("at is UTC ending in Z", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(line.at ?? ""), true);
  same("repo is the member the call ran in, and the session is the hook's", [line.repo, line.session], ["spn-infra-ts", "sess-2p"]);
  same("the start file is removed", existsSync(join(pendingOf(root), "toolu_pair.json")), false);
  same("every hook line carries at ending in Z too", logOf(root).every((one) => /Z$/.test(one.at)), true);
  const checks = logOf(root).filter((one) => one.event !== "command");
  same("a hook check's line keeps the seventeen keys, and no `programs`",
    checks.length > 0 && checks.every((one) => JSON.stringify(Object.keys(one)) === JSON.stringify(KEYS)), true);
}

console.log("\n=== a failed call, read from PostToolUseFailure");
{
  const root = workspace("2p-fail", ON);
  const before = call(root, "toolu_fail", "cd /tmp && spnutils apps test journey service-platform-ts");
  hook("pretooluse", { ...before, hook_event_name: "PreToolUse" });
  hook("closed", { ...before, hook_event_name: "PostToolUseFailure", error: "Exit code 3\nnx failed" });
  const line = commands(root)[0] ?? {};
  same("the exit is the failure's code", line.exit, 3);
  same("a cd out of the workspace reads repo null", line.repo, null);
  const other = call(root, "toolu_fail2", "git push");
  hook("pretooluse", { ...other, hook_event_name: "PreToolUse" });
  hook("closed", { ...other, hook_event_name: "PostToolUseFailure", error: "interrupted" });
  same("a failure with no code reads 1", commands(root).at(-1)?.exit, 1);
  same("[MKT.HOOKS.42] each failed call's `events › closed` line sits beside its command line",
    logOf(root).filter((one) => one.event === "PostToolUseFailure").map((one) => `${one.group} › ${one.action}`),
    ["events › closed", "events › closed"]);
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
    [line.script, line.action, line.exit, line.agent], ["git", "rev-parse", 128, "agent-child-1"]);
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

console.log("\n=== a secret, a background call, a compound command, and the prune");
{
  const root = workspace("2p-more", ON);
  const secret = call(root, "toolu_secret", "spnutils infra config set --token abc123 --api-key=zzz FOO");
  hook("pretooluse", { ...secret, hook_event_name: "PreToolUse" });
  hook("closed", { ...secret, hook_event_name: "PostToolUse", tool_response: {} });
  same("a secret option's value is written ***", commands(root).at(-1)?.args, "--token *** --api-key=*** FOO");
  same("and the value appears nowhere in the log", readFileSync(join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").includes("abc123"), false);

  const background = call(root, "toolu_bg", "spnutils apps dev service-platform-ts", { input: { run_in_background: true } });
  hook("pretooluse", { ...background, hook_event_name: "PreToolUse" });
  hook("closed", { ...background, hook_event_name: "PostToolUse", tool_response: { backgroundTaskId: "b1" } });
  same("a background call writes its line at PostToolUse with exit null", commands(root).at(-1)?.exit, null);

  const before = commands(root).length;
  const compound = call(root, "toolu_many", "git add x && git commit -m 'a b' && spnutils apps check x");
  hook("pretooluse", { ...compound, hook_event_name: "PreToolUse" });
  hook("closed", { ...compound, hook_event_name: "PostToolUse", tool_response: {} });
  const written = commands(root).slice(before);
  same("[MKT.HOOKS.41] a call that ran three programs writes one line, named for the first the filter matches",
    written.map((one) => `${one.script} ${one.action} ${one.args}`), ["git add x"]);
  same("[MKT.HOOKS.41] and `programs` holds how many it ran", written.map((one) => one.programs), [3]);
  same("so the call's time is summed once", written.reduce((sum, one) => sum + one.ms, 0), written[0]?.ms);
  const mixed = call(root, "toolu_mixed", "ls -la && spnutils apps check x; git status");
  hook("pretooluse", { ...mixed, hook_event_name: "PreToolUse" });
  hook("closed", { ...mixed, hook_event_name: "PostToolUse", tool_response: {} });
  same("a program the filter does not name is neither the line's name nor counted",
    commands(root).slice(before + 1).map((one) => [one.script, one.action, one.programs]), [["spnutils", "check", 2]]);

  // A refused call leaves its start file behind: the hook wrote it, and no hook runs after a refusal.
  mkdirSync(pendingOf(root), { recursive: true });
  const minutesAgo = (minutes) => (Date.now() - minutes * 60 * 1000) / 1000;
  const refused = join(pendingOf(root), "toolu_refused.json");
  writeFileSync(refused, JSON.stringify({ at: Date.now() - 11 * 60 * 1000, background: false, found: [] }));
  utimesSync(refused, minutesAgo(11), minutesAgo(11));
  const running = join(pendingOf(root), "toolu_running.json");
  writeFileSync(running, JSON.stringify({ at: Date.now() - 9 * 60 * 1000, background: false, found: [] }));
  utimesSync(running, minutesAgo(9), minutesAgo(9));
  hook("pretooluse", { ...call(root, "toolu_fresh", "git status"), hook_event_name: "PreToolUse" });
  same("[MKT.HOOKS.43] a start file older than 600,000 ms is removed when the next one is written",
    existsSync(refused), false);
  same("[MKT.HOOKS.43] and one younger than that is left, because its call may still be running",
    readdirSync(pendingOf(root)).sort(), ["toolu_fresh.json", "toolu_running.json"]);
}

console.log("\n=== the workspace filter file");
{
  const root = workspace("2p-filter", { ...ON, ".spndevex/.debug/telemetry/filter.json": JSON.stringify({ remove: ["git"], add: [{ program: "make" }] }) });
  const git = call(root, "toolu_git", "git status");
  hook("pretooluse", { ...git, hook_event_name: "PreToolUse" });
  same("a program the filter removes writes no start file", existsSync(join(pendingOf(root), "toolu_git.json")), false);
  const make = call(root, "toolu_make", "make build");
  hook("pretooluse", { ...make, hook_event_name: "PreToolUse" });
  hook("closed", { ...make, hook_event_name: "PostToolUse", tool_response: {} });
  same("a program the filter adds is timed", commands(root).map((one) => [one.script, one.action]), [["make", "build"]]);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — bash timing` : `\n  all ${total} passed — bash timing`);
process.exit(failed ? 1 : 0);
