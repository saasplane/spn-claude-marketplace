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

// Every row is a version 1 row read by its `mtype`: a hook check's run is a CHECK row (check, verdict PASS, NOTE or DENY, ms,
// out); a command's is a COMMAND row. No row holds a hook's whole run, and no log holds the send-backs: a send-back is a CHECK
// row whose verdict is DENY (MKT.SCRIPTS.328).
let serial = 0;
const line = (extra) => JSON.stringify({ v: 1, mtype: "CHECK", id: `r${++serial}`, event: "PreToolUse", at: "2026-10-10T10:00:00Z", session: "s1", agent: null,
  workstream: null, arc: null, part: null, skill: null, work: null, retryOf: null, check: "docs-face", verdict: "PASS", ms: 10, out: null, ...extra });
const check = (name, verdict, ms, out, extra = {}) => line({ check: name, verdict, ms, out, ...extra });

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
    check("docs-face", "NOTE", 5, 120),
    // a row of the old shape, with no version, is skipped; so is a row of another kind
    JSON.stringify({ script: "spn-devex", group: "docs-face", action: "docs-face", event: "PreToolUse", ms: 999, verdict: "deny", out: 999, session: "s1" }),
    line({ mtype: "TURN", check: undefined, verdict: undefined, ms: undefined }),
    "{ torn line",
  ].join("\n") + "\n");
  writeFileSync(join(telemetry, "hooks.jsonl"), [
    check("docs-face", "PASS", 3, null),
    check("docs-face", "DENY", 4, 300),
    check("split-plan", "NOTE", 20, 50),
    check("cards", "PASS", 100, null, { event: "Stop" }),
    // A command's row carries no check and no verdict: it is neither a check nor part of an event.
    line({ mtype: "COMMAND", event: "PostToolUse", check: undefined, verdict: undefined, ms: 900, out: 77, call: { program: "git", group: null, action: "status" }, exit: 0 }),
  ].join("\n") + "\n");

  console.log("=== the data form");
  const data = JSON.parse(typed(root, "show", "--json").out);
  const docs = data.checks.find((one) => one.check === "docs-face");
  ok("a check is one row over its name, the rotated and the live log both read, and a row without v 1 is skipped",
    docs.check === "docs-face" && docs.event === "PreToolUse" && docs.runs === 3, JSON.stringify(docs));
  ok("with its time, its notes, its refusals and the bytes it put into the context", docs.ms === 12 && docs.notes === 1 && docs.denies === 1 && docs.out === 420, JSON.stringify(docs));
  ok("a check of another file is its own row", data.checks.find((one) => one.check === "split-plan")?.runs === 1);
  ok("the costliest check is first", data.checks[0].check === "cards");
  ok("a command's row is no check", data.checks.length === 3, JSON.stringify(data.checks.map((one) => one.check)));
  const pre = data.events.find((one) => one.event === "PreToolUse");
  ok("[MKT.SCRIPTS.328] an event's time is the sum of its checks' time, its runs those of its busiest check, its bytes the sum of theirs",
    pre.runs === 3 && pre.ms === 32 && pre.out === 470, JSON.stringify(pre));
  ok("and the events are listed beside the checks, the costliest first", data.events.length === 2 && data.events[0].event === "Stop" && data.events[0].ms === 100 && data.events[0].out === 0, JSON.stringify(data.events));

  console.log("\n=== the printed form");
  const printed = typed(root, "show").out;
  ok("it prints the checks, then the events, always both", printed.indexOf("Check") >= 0 && printed.indexOf("Event") > printed.indexOf("Check")
    && /^docs-face\s+3\s/m.test(printed) && /PreToolUse/.test(printed) && /Out bytes/.test(printed), printed);

  console.log("\n=== the send-backs (MKT.HOOKS.341)");
  ok("[MKT.SCRIPTS.328] a send-back is a DENY check row, so the live log's one refusal is the one tool-call send-back, counted against the PreToolUse runs",
    data.sendBacks?.toolCalls?.sent === 1 && data.sendBacks.toolCalls.runs === 3 && data.sendBacks.toolCalls.per100 === 33.3 && data.sendBacks?.turnEnd?.sent === 0, JSON.stringify(data.sendBacks));
  ok("the checks that ran under a Stop are headed Found and those under a PreToolUse Denies", (() => {
    const text = typed(root, "show").out;
    return /Found/.test(text) && /Denies/.test(text) && text.indexOf("Found") < text.indexOf("Denies");
  })());
}
finally { /* the cases below read a root of their own */ }

const at = (time) => `2026-10-10T${time}Z`;
// Every run of a turn end writes a CHECK row for `always`, a check that never refuses, so the Stop runs are counted by it, then a row
// for each check named; a run of the tool calls does the same under PreToolUse.
const stopRun = (time, session, spans = {}) => [
  check("always", "PASS", 5, null, { event: "Stop", at: at(time), session }),
  ...Object.entries(spans).map(([name, verdict]) => check(name, verdict, 10, null, { event: "Stop", at: at(time), session })),
];
const callRun = (time, session, spans = {}) => [
  check("always", "PASS", 1, null, { event: "PreToolUse", at: at(time), session }),
  ...Object.entries(spans).map(([name, verdict]) => check(name, verdict, 10, null, { event: "PreToolUse", at: at(time), session })),
];
const second = realpathSync(mkdtempSync(join(tmpdir(), "debug-hooks-backs-")));
try {
  mkdirSync(join(second, ".spndevex", "workstreams"), { recursive: true });
  const folder = join(second, ".spndevex", ".debug", "telemetry");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "hooks.jsonl"), [
    // a check about the work: answered when a tool call comes before the check's next run
    ...stopRun("12:00:01", "w", { runnable: "DENY" }), ...callRun("12:00:05", "w"), ...stopRun("12:00:10", "w", { runnable: "PASS" }),
    // and unanswered when its next run comes with none, twice
    ...stopRun("12:01:01", "w", { runnable: "DENY" }), ...stopRun("12:01:10", "w", { runnable: "PASS" }),
    ...stopRun("12:08:01", "w", { runnable: "DENY" }), ...stopRun("12:08:10", "w", { runnable: "PASS" }),
    // a check about the reply: answered by its own next run passing, unanswered by a finding again; the last has no next run
    ...stopRun("12:02:01", "r", { cards: "DENY" }), ...stopRun("12:02:10", "r", { cards: "PASS" }),
    ...stopRun("12:03:01", "r", { cards: "DENY" }), ...stopRun("12:03:10", "r", { cards: "DENY" }),
    // a tool-call check: answered by its next run passing, unanswered by it refusing again
    ...callRun("12:04:01", "t", { "command-shape": "DENY" }), ...callRun("12:04:05", "t", { "command-shape": "PASS" }),
    ...callRun("12:05:01", "t", { "command-shape": "DENY" }), ...callRun("12:05:05", "t", { "command-shape": "DENY" }),
    // nothing to judge by: no next run, and the window check
    ...stopRun("12:06:01", "x", { "go-next": "DENY" }),
    ...stopRun("12:07:01", "y", { window: "DENY" }),
  ].join("\n") + "\n");
  // The old sendbacks.jsonl is gone from the code; one left on disk adds nothing.
  writeFileSync(join(folder, "sendbacks.jsonl"), JSON.stringify({ at: "2026-10-10T12:00:00Z", session: "w", agent: null, event: "Stop", check: "runnable", workstream: null, finding: "0123456789ab" }) + "\n");
  const data = JSON.parse(typed(second, "show", "--json").out);
  const turn = data.sendBacks?.turnEnd, calls = data.sendBacks?.toolCalls;
  const of = (part, name) => part?.checks.find((one) => one.check === name);
  ok("[MKT.HOOKS.341] the turn end counts its send-backs against its Stop runs, per 100 replies", turn?.sent === 8 && turn.runs === 12 && turn.per100 === 66.7, JSON.stringify(turn));
  ok("the tool calls count theirs against the PreToolUse runs, per 100 calls", calls?.sent === 3 && calls.runs === 5 && calls.per100 === 60, JSON.stringify(calls));
  ok("each check carries its sent-back count and its per 100", of(turn, "runnable")?.sent === 3 && of(turn, "runnable")?.per100 === 25 && of(turn, "cards")?.sent === 3 && of(turn, "cards")?.per100 === 25, JSON.stringify(turn?.checks));
  ok("a check about the work is answered by a tool call before the next Stop", of(turn, "runnable")?.judged === 3 && of(turn, "runnable")?.unanswered === 2, JSON.stringify(of(turn, "runnable")));
  ok("a check about the reply is answered by its own span on the next Stop finding nothing", of(turn, "cards")?.judged === 2 && of(turn, "cards")?.unanswered === 1, JSON.stringify(of(turn, "cards")));
  ok("a tool-call check is answered by its next judged call passing", of(calls, "command-shape")?.judged === 2 && of(calls, "command-shape")?.unanswered === 1, JSON.stringify(of(calls, "command-shape")));
  ok("where the log holds nothing to judge by, Unanswered is null", of(turn, "go-next")?.unanswered === null && of(turn, "window")?.unanswered === null);
  ok("Checks to fix lists the check with more than half unanswered, and not the one with exactly half",
    data.toFix.length === 1 && data.toFix[0].check === "runnable" && data.toFix[0].unanswered === 2, JSON.stringify(data.toFix));
  ok("[MKT.SCRIPTS.328] a sendbacks.jsonl left on disk adds nothing: the send-backs are the DENY rows", turn?.sent === 8 && calls?.sent === 3);

  const printed = typed(second, "show").out;
  const found = printed.indexOf("Found"), denies = printed.indexOf("Denies"), events = printed.indexOf("Event");
  ok("Found heads a turn-end check's findings and Denies a tool-call check's refusals",
    found >= 0 && denies > found && printed.indexOf("\nrunnable") > found && printed.indexOf("\nrunnable") < denies
    && printed.indexOf("\ncommand-shape") > denies && printed.indexOf("\ncommand-shape") < events, printed);
  ok("the Send-backs part prints per 100 replies and per 100 calls", /Send-backs, turn end: 8 of 12 replies sent back, 66\.7 per 100/.test(printed)
    && /Send-backs, tool calls: 3 of 5 calls refused, 60 per 100/.test(printed) && /Sent back/.test(printed) && /Refused/.test(printed) && /Unanswered/.test(printed), printed);
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
