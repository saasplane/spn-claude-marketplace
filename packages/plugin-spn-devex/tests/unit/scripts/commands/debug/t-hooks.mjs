// `debug hooks show` — every hook check's runs, time, notes and refusals, then every event's runs, time and bytes put
// into the context, always both (RULE.DEVEX.WORKSPACE.323), read from the rotated log and the live one.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const ENV = { ...process.env, SPN_TELEMETRY: "off" };
delete ENV.SPN_WORKSPACE;
/** `debug hooks` typed with exactly these words from the workspace: what it printed, and its exit code. */
const typed = (root, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "debug", "hooks", ...words], { encoding: "utf8", stdio: "pipe", env: ENV, cwd: root }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const line = (extra) => JSON.stringify({ script: "spn-devex", group: null, subgroup: null, action: null, args: null, event: "PreToolUse", tool: "Bash", ms: 10, exit: null,
  at: "2026-10-10T10:00:00Z", repo: null, pid: 1, verdict: "pass", out: null, session: "s1", agent: null, ...extra });
const check = (group, action, verdict, ms, out) => line({ group, action, verdict, ms, out });
const whole = (event, verdict, ms, out) => line({ group: "events", action: event.toLowerCase(), event, verdict, ms, out });

const root = realpathSync(mkdtempSync(join(tmpdir(), "debug-hooks-")));
try {
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  const none = typed(root, "show");
  ok("with no telemetry it says so and exits 0", none.code === 0 && /no hook telemetry/.test(none.out), none.out);
  const empty = JSON.parse(typed(root, "show", "--json").out);
  ok("and the data form still holds both parts, empty", Array.isArray(empty.checks) && Array.isArray(empty.events) && !empty.checks.length && !empty.events.length);

  const telemetry = join(root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  writeFileSync(join(telemetry, "hooks.1.jsonl"), [
    check("docs-face", "docs-face", "note", 5, 120),
    whole("PreToolUse", "note", 40, 120),
    "{ torn line",
  ].join("\n") + "\n");
  writeFileSync(join(telemetry, "hooks.jsonl"), [
    check("docs-face", "docs-face", "pass", 3, null),
    check("docs-face", "docs-face", "deny", 4, 300),
    check("split-plan", "close", "note", 20, 50),
    whole("PreToolUse", "deny", 60, 300),
    whole("Stop", "pass", 100, null),
    // A command's line and a command's whole run carry no verdict: they are neither a check nor an event.
    line({ script: "git", group: null, action: "status", event: "command", ms: 900, exit: 0, verdict: null, out: 77 }),
    line({ group: "cli", action: "cli", event: "command", ms: 300, exit: 0, verdict: null }),
  ].join("\n") + "\n");

  console.log("=== the data form");
  const data = JSON.parse(typed(root, "show", "--json").out);
  const docs = data.checks.find((one) => one.group === "docs-face");
  ok("a check is one row over script, group and action, the rotated and the live log both read",
    docs.script === "spn-devex" && docs.action === "docs-face" && docs.runs === 3, JSON.stringify(docs));
  ok("with its time, its notes, its refusals and the bytes it put into the context", docs.ms === 12 && docs.notes === 1 && docs.denies === 1 && docs.out === 420, JSON.stringify(docs));
  ok("a check of another file is its own row", data.checks.find((one) => one.group === "split-plan" && one.action === "close")?.runs === 1);
  ok("the costliest check is first", data.checks[0].group === "split-plan");
  ok("a command's lines are no check", data.checks.length === 2, JSON.stringify(data.checks.map((one) => one.group)));
  const pre = data.events.find((one) => one.event === "PreToolUse");
  ok("an event is one row of its whole runs: runs, time and bytes", pre.runs === 2 && pre.ms === 100 && pre.out === 420, JSON.stringify(pre));
  ok("and the events are listed beside the checks", data.events.length === 2 && data.events.some((one) => one.event === "Stop" && one.out === 0));

  console.log("\n=== the printed form");
  const printed = typed(root, "show").out;
  ok("it prints the checks, then the events, always both", printed.indexOf("Check") >= 0 && printed.indexOf("Event") > printed.indexOf("Check")
    && /spn-devex › docs-face › docs-face/.test(printed) && /PreToolUse/.test(printed) && /Out bytes/.test(printed), printed);

  console.log("\n=== the send-backs (MKT.HOOKS.341)");
  const before = JSON.parse(typed(root, "show", "--json").out);
  ok("with no sendbacks.jsonl the data form names no send-back and no check to fix", before.sendBacks?.turnEnd?.sent === 0 && before.sendBacks?.toolCalls?.sent === 0 && !before.toFix.length, JSON.stringify(before.sendBacks));
  ok("the checks that ran under a Stop are headed Found and those under a PreToolUse Denies", (() => {
    const text = typed(root, "show").out;
    return !/Found/.test(text) && /Denies/.test(text);
  })());
}
finally { /* the cases below read a root of their own */ }

const back = (at, session, event, check) => JSON.stringify({ at: `2026-10-10T${at}Z`, session, agent: null, event, check, workstream: null, finding: "0123456789ab" });
const at = (time) => `2026-10-10T${time}Z`;
const stopRun = (time, session, spans = {}) => [
  ...Object.entries(spans).map(([action, verdict]) => line({ script: "spn-devex", group: "stop", action, event: "Stop", verdict, at: at(time), session })),
  whole("Stop", Object.values(spans).includes("deny") ? "deny" : "pass", 50, null).replace('"at":"2026-10-10T10:00:00Z"', `"at":"${at(time)}"`).replace('"session":"s1"', `"session":"${session}"`),
];
const callRun = (time, session, spans = {}) => [
  ...Object.entries(spans).map(([action, verdict]) => line({ script: "spn-devex", group: "command-shape", action, event: "PreToolUse", verdict, at: at(time), session })),
  whole("PreToolUse", Object.values(spans).includes("deny") ? "deny" : "pass", 5, null).replace('"at":"2026-10-10T10:00:00Z"', `"at":"${at(time)}"`).replace('"session":"s1"', `"session":"${session}"`),
];
const second = realpathSync(mkdtempSync(join(tmpdir(), "debug-hooks-backs-")));
try {
  mkdirSync(join(second, ".spndevex", "workstreams"), { recursive: true });
  const folder = join(second, ".spndevex", ".debug", "telemetry");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "hooks.jsonl"), [
    // a check about the work: answered when a tool call comes before the window's next Stop
    ...stopRun("12:00:01", "w", { runnable: "deny" }), ...callRun("12:00:05", "w"), ...stopRun("12:00:10", "w"),
    // and unanswered when the next Stop comes with none, twice
    ...stopRun("12:01:01", "w", { runnable: "deny" }), ...stopRun("12:01:10", "w"),
    ...stopRun("12:08:01", "w", { runnable: "deny" }), ...stopRun("12:08:10", "w"),
    // a check about the reply: answered by its own span finding nothing on the next Stop, unanswered by a finding
    ...stopRun("12:02:01", "r", { cards: "deny" }), ...stopRun("12:02:10", "r", { cards: "pass" }),
    ...stopRun("12:03:01", "r", { cards: "deny" }), ...stopRun("12:03:10", "r", { cards: "deny" }),
    // a tool-call check: answered by its next span passing, unanswered by it refusing again
    ...callRun("12:04:01", "t", { "command-shape": "deny" }), ...callRun("12:04:05", "t", { "command-shape": "pass" }),
    ...callRun("12:05:01", "t", { "command-shape": "deny" }), ...callRun("12:05:05", "t", { "command-shape": "deny" }),
    // nothing to judge by: no next Stop, and the window check
    ...stopRun("12:06:01", "x", { "go-next": "deny" }),
    ...stopRun("12:07:01", "y", { window: "deny" }),
  ].join("\n") + "\n");
  writeFileSync(join(folder, "sendbacks.jsonl"), [
    back("12:00:00", "w", "Stop", "runnable"), back("12:01:00", "w", "Stop", "runnable"), back("12:08:00", "w", "Stop", "runnable"),
    back("12:02:00", "r", "Stop", "cards"), back("12:03:00", "r", "Stop", "cards"),
    back("12:06:00", "x", "Stop", "go-next"), back("12:07:00", "y", "Stop", "window"),
    back("12:04:00", "t", "PreToolUse", "command-shape"), back("12:05:00", "t", "PreToolUse", "command-shape"),
    // the older cumulative form is skipped
    JSON.stringify({ at: "2026-10-10T11:00:00Z", session: "w", agent: null, checks: { runnable: { sent: 9, idle: 9 } } }),
    "{ torn line",
  ].join("\n") + "\n");
  const data = JSON.parse(typed(second, "show", "--json").out);
  const turn = data.sendBacks?.turnEnd, calls = data.sendBacks?.toolCalls;
  const of = (part, name) => part?.checks.find((one) => one.check === name);
  ok("[MKT.HOOKS.341] the turn end counts its send-backs against its Stop runs, per 100 replies", turn?.sent === 7 && turn.runs === 12 && turn.per100 === 58.3, JSON.stringify(turn));
  ok("the tool calls count theirs against the PreToolUse runs, per 100 calls", calls?.sent === 2 && calls.runs === 5 && calls.per100 === 40, JSON.stringify(calls));
  ok("each check carries its sent-back count and its per 100", of(turn, "runnable")?.sent === 3 && of(turn, "runnable")?.per100 === 25 && of(turn, "cards")?.per100 === 16.7, JSON.stringify(turn?.checks));
  ok("a check about the work is answered by a tool call before the next Stop", of(turn, "runnable")?.judged === 3 && of(turn, "runnable")?.unanswered === 2, JSON.stringify(of(turn, "runnable")));
  ok("a check about the reply is answered by its own span on the next Stop finding nothing", of(turn, "cards")?.judged === 2 && of(turn, "cards")?.unanswered === 1, JSON.stringify(of(turn, "cards")));
  ok("a tool-call check is answered by its next judged call passing", of(calls, "command-shape")?.judged === 2 && of(calls, "command-shape")?.unanswered === 1, JSON.stringify(of(calls, "command-shape")));
  ok("where the log holds nothing to judge by, Unanswered is null", of(turn, "go-next")?.unanswered === null && of(turn, "window")?.unanswered === null);
  ok("Checks to fix lists the check with more than half unanswered, and not the one with exactly half",
    data.toFix.length === 1 && data.toFix[0].check === "runnable" && data.toFix[0].unanswered === 2, JSON.stringify(data.toFix));
  ok("an old cumulative line adds nothing", turn?.sent === 7);

  const printed = typed(second, "show").out;
  ok("Found heads a turn-end check's findings and Denies a tool-call check's refusals",
    /Found/.test(printed) && /Denies/.test(printed) && printed.indexOf("Found") < printed.indexOf("spn-devex › stop › runnable")
    && printed.indexOf("Denies") < printed.indexOf("spn-devex › command-shape › command-shape"), printed);
  ok("the Send-backs part prints per 100 replies and per 100 calls", /Send-backs, turn end: 7 of 12 replies sent back, 58\.3 per 100/.test(printed)
    && /Send-backs, tool calls: 2 of 5 calls refused, 40 per 100/.test(printed) && /Sent back/.test(printed) && /Refused/.test(printed) && /Unanswered/.test(printed), printed);
  ok("a check with nothing to judge by prints a dash", /go-next\s+1\s+8\.3\s+-\n/.test(printed), printed);
  const fixed = printed.split("Checks to fix")[1] ?? "";
  ok("the printed form names the check to fix", /runnable/.test(fixed) && !/cards/.test(fixed) && !/command-shape/.test(fixed), printed);
} finally {
  rmSync(second, { recursive: true, force: true });
}

try {
  console.log("\n=== the words");
  const USAGE = "usage: spn-devex debug hooks show [--json]\n";
  const option = typed(root, "show", "--since", "1");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2 and the usage line", option.code === 2 && option.out === USAGE + "`debug hooks show` does not take `--since`.\n", option.out);
  const second = typed(root, "show", "--json", "--top");
  ok("a second option is refused too", second.code === 2 && second.out.includes("does not take `--top`"), second.out);
  const target = typed(root, "show", "all");
  ok("a target is refused", target.code === 2 && target.out.startsWith(USAGE) && target.out.includes("takes no target"), target.out);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — debug hooks` : `\n  all ${total} passed — debug hooks`);
process.exit(failed ? 1 : 0);
