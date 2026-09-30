// `lib/bash-timing.ts` — the Bash commands the agent runs, timed by pairing the hooks before and
// after the call on `tool_use_id` (RD.DEVEX.WORKSPACE.185, N8 row 2p).
//
// Driven through the real entries: `events/pretooluse.ts` writes `telemetry/pending/<id>.json` for a
// matched command while recording is on, and `events/closed.ts` — registered for `PostToolUse` and
// `PostToolUseFailure` on Bash — reads it, writes one line per program, and removes it. Every case
// points a temporary workspace (with `.spndevex/.debug/telemetry.on`) at the recorder.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const EVENTS = resolve(PLUGIN, "src", "scripts", "events");
const KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "session", "agent", "workstream", "arc", "order"];

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
  same("with every key, in the book's order", Object.keys(line), KEYS);
  same("script, levels and args read from the command",
    [line.script, line.group, line.subgroup, line.action, line.args], ["spnutils", "infra", "platform", "up", "dmo --apply"]);
  same("the agent ran it, through Bash, and it worked", [line.event, line.tool, line.exit], ["command", "Bash", 0]);
  same("ms is a whole number of milliseconds", Number.isInteger(line.ms) && line.ms >= 0, true);
  same("at is UTC ending in Z", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(line.at ?? ""), true);
  same("repo is the member the call ran in, and the session is the hook's", [line.repo, line.session], ["spn-infra-ts", "sess-2p"]);
  same("the start file is removed", existsSync(join(pendingOf(root), "toolu_pair.json")), false);
  same("every hook line carries at ending in Z too", logOf(root).every((one) => /Z$/.test(one.at)), true);
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
  same("a compound command writes one line per match", written.map((one) => `${one.script} ${one.action}`),
    ["git add", "git commit", "spnutils check"]);
  same("each with the whole call's ms", new Set(written.map((one) => one.ms)).size, 1);

  mkdirSync(pendingOf(root), { recursive: true });
  const stale = join(pendingOf(root), "toolu_stale.json");
  writeFileSync(stale, "{}");
  const twoDaysAgo = (Date.now() - 2 * 24 * 3600 * 1000) / 1000;
  utimesSync(stale, twoDaysAgo, twoDaysAgo);
  hook("pretooluse", { ...call(root, "toolu_fresh", "git status"), hook_event_name: "PreToolUse" });
  same("a start file older than a day is removed when one is written", readdirSync(pendingOf(root)).sort(), ["toolu_fresh.json"]);
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
