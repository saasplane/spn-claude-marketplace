// `workspace tokens show` — hook telemetry joined to the transcripts by session (RD.DEVEX.WORKSPACE.185).
//
// THE KNOWN BAD IS A REPLY WRITTEN ON THREE LINES. A transcript writes one line per content block of
// a reply and repeats its `usage` on each, so a reader summing lines counts that reply three times.
// It must be counted once. The second known bad is a session with no tagged line: it is reported as
// untagged, never assigned to the work a neighbouring session did.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { workspace } from "../../../../helpers/fixture.mjs";
import { projectFolder, readReplies, report, tagFor } from "../../../../../src/scripts/commands/workspace/tokens.ts";

const CLI = join(PLUGIN, "src", "scripts", "cli.ts");
let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

// The line in the one shape every writer uses, `at` in UTC ending in Z (RD.DEVEX.WORKSPACE.185).
const line = (session, at, tags = {}, agent = null) => JSON.stringify({
  script: "spn-devex", group: "events", subgroup: null, action: "pretooluse", args: null, event: "PreToolUse", tool: "Read",
  ms: 30, exit: null, at: `${at}Z`, repo: null, pid: 1, session, agent, workstream: null, arc: null, order: null, ...tags,
});
const reply = (id, session, timestamp, usage, agentId) => JSON.stringify({
  type: "assistant", sessionId: session, timestamp, ...(agentId ? { agentId, isSidechain: true } : {}),
  message: { id, role: "assistant", usage: {
    input_tokens: usage[0], cache_creation_input_tokens: usage[1], cache_read_input_tokens: usage[2], output_tokens: usage[3],
  } },
});

const M7 = { workstream: "008-plain-language", arc: "N116", order: "M7-order-rules-telemetry-subtitle" };
const N116 = { workstream: "008-plain-language", arc: "N116", order: null };
const OTHER = { workstream: "015-something-else", arc: "N3", order: null };

const root = workspace("m7-tokens", {
  ".spndevex/.debug/telemetry/hooks.jsonl": [
    // session `s-main`: the main window works on N116, and its agent on order M7
    line("s-main", "2026-09-29T10:00:05", N116),
    line("s-main", "2026-09-29T10:05:05", N116),
    line("s-main", "2026-09-29T10:01:05", M7, "agent1"),
    "{ a torn line from a truncated write",
    // session `s-other`: another workstream entirely
    line("s-other", "2026-09-29T11:00:05", OTHER),
    // session `s-bare`: telemetry with no tag at all
    line("s-bare", "2026-09-29T12:00:05"),
    // session `s-gone`: in the log, no transcript in this project folder
    line("s-gone", "2026-09-29T12:00:05", N116),
  ].join("\n") + "\n",
  "projects/s-main.jsonl": [
    // THE KNOWN BAD: reply `r1` on three lines, one per content block, usage repeated on each
    reply("r1", "s-main", "2026-09-29T10:00:04.500Z", [3, 100, 1000, 7]),
    reply("r1", "s-main", "2026-09-29T10:00:04.600Z", [3, 100, 1000, 7]),
    reply("r1", "s-main", "2026-09-29T10:00:04.700Z", [3, 100, 1000, 20]),
    JSON.stringify({ type: "user", message: { role: "user", content: "go" } }),
    reply("r2", "s-main", "2026-09-29T10:05:04.000Z", [1, 10, 2000, 5]),
  ].join("\n") + "\n",
  "projects/s-main/subagents/agent-agent1.jsonl": [
    reply("r3", "s-main", "2026-09-29T10:01:04.000Z", [2, 50, 500, 11], "agent1"),
    reply("r3", "s-main", "2026-09-29T10:01:04.100Z", [2, 50, 500, 11], "agent1"),
  ].join("\n") + "\n",
  "projects/s-main/subagents/agent-agent2.jsonl":
    reply("r4", "s-main", "2026-09-29T10:02:00.000Z", [4, 40, 400, 4], "agent2") + "\n",
  "projects/s-other.jsonl": reply("r5", "s-other", "2026-09-29T11:00:04.000Z", [9, 90, 900, 9]) + "\n",
  "projects/s-bare.jsonl": reply("r6", "s-bare", "2026-09-29T12:00:04.000Z", [6, 60, 600, 6]) + "\n",
  "projects/s-old.jsonl": reply("r7", "s-old", "2026-09-01T12:00:04.000Z", [1, 1, 1, 1]) + "\n",
});
const projects = join(root, "projects");

console.log("=== workspace tokens — each reply is counted once");
{
  const { replies, repeatedLines } = readReplies([join(projects, "s-main.jsonl")]);
  const r1 = replies.get("r1");
  ok("a reply on three lines is one reply", replies.size === 2, `got ${replies.size}`);
  ok("the two repeated lines are set aside, not added", repeatedLines === 2, `got ${repeatedLines}`);
  ok("its input is counted once", r1.input === 3 && r1.cacheWrite === 100 && r1.cacheRead === 1000, JSON.stringify(r1));
  ok("its output is the streamed reply's final count", r1.output === 20, JSON.stringify(r1));
}

console.log("\n=== workspace tokens — joined by session and agent, never guessed");
{
  const all = report(root, projects, null);
  const row = (tag) => all.rows.find((one) => one.workstream === tag.workstream && one.arc === tag.arc && one.order === tag.order);
  const main = row(N116), order = row(M7), other = row(OTHER);
  ok("the main window's replies go to the arc its calls touched", main && main.replies === 2 && main.output === 25, JSON.stringify(main));
  ok("the agent's replies go to the order its own calls touched", order && order.replies === 1 && order.cacheRead === 500, JSON.stringify(order));
  ok("another workstream's session is its own row", other && other.input === 9, JSON.stringify(other));
  ok("an agent of a tagged session that made no tagged call is untagged, not given the window's arc",
    all.untagged.replies === 2 && all.untagged.input === 4 + 6, JSON.stringify(all.untagged));
  ok("a session with no tagged line is untagged", all.untagged.sessions === 2, JSON.stringify(all.untagged));
  ok("a session the log names with no transcript here is counted apart", all.noTranscript === 1, String(all.noTranscript));
  ok("a transcript outside the log's window is counted, not read", all.outsideWindow === 1, String(all.outsideWindow));
  ok("the total is every reply once", all.total.replies === 6 && all.total.input === 3 + 1 + 2 + 4 + 9 + 6, JSON.stringify(all.total));

  const filtered = report(root, projects, "008");
  ok("`008` names 008-plain-language, and another workstream's rows leave", filtered.rows.every((one) => one.workstream === "008-plain-language") && filtered.rows.length === 2,
    JSON.stringify(filtered.rows));
  ok("the untagged session is still reported under a filter", filtered.untagged.replies >= 1, JSON.stringify(filtered.untagged));
}

console.log("\n=== workspace tokens — which tagged line a reply takes");
{
  const lines = [{ at: Date.parse("2026-09-29T10:00:05Z"), ...N116 }, { at: Date.parse("2026-09-29T10:10:05Z"), ...M7 }];
  ok("a reply takes the tagged call that follows it", tagFor({ at: Date.parse("2026-09-29T10:06:00Z") }, lines).order === M7.order);
  ok("a call in the same second as the reply is the one that follows it", tagFor({ at: Date.parse("2026-09-29T10:00:05.900Z") }, lines).arc === "N116");
  ok("a reply after the last tagged call takes the last", tagFor({ at: Date.parse("2026-09-29T11:00:00Z") }, lines).order === M7.order);
  ok("no tagged line gives no tag", tagFor({ at: 0 }, []) === null);
  ok("the project folder is the workspace path with every other character a dash",
    projectFolder("/opt/work/saasplane/code", "/h/.claude") === "/h/.claude/projects/-opt-work-saasplane-code");
}

console.log("\n=== workspace tokens — the model's own time, apart from the tools' and the waiting");
{
  // One window: a prompt, a reply that asks for a tool, the tool's result, a reply on two lines, a
  // second prompt ten minutes later, and a last reply. Its agent runs while the window waits on it.
  const stamped = (type, timestamp, content, extra = {}) => JSON.stringify({ type, sessionId: "s-time", timestamp, ...extra,
    message: { role: type, content, ...(extra.id ? { id: extra.id, usage: { input_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1 } } : {}) } });
  const toolResult = [{ type: "tool_result", tool_use_id: "toolu_1", content: "ok" }];
  const timeRoot = workspace("n006-tokens-time", {
    ".spndevex/.debug/telemetry/hooks.jsonl": [
      line("s-time", "2026-10-01T10:13:35", N116),
      line("s-time", "2026-10-01T10:02:00", M7, "agent9"),
    ].join("\n") + "\n",
    "projects/s-time.jsonl": [
      stamped("user", "2026-10-01T10:00:00.000Z", "go"),
      stamped("assistant", "2026-10-01T10:01:00.000Z", [{ type: "tool_use", id: "toolu_1" }], { id: "t1" }),
      // Not a reply, a tool result or a prompt, so it is not read for time: the tool's 30 s stay whole.
      JSON.stringify({ type: "system", sessionId: "s-time", timestamp: "2026-10-01T10:01:10.000Z", subtype: "hook" }),
      stamped("user", "2026-10-01T10:01:30.000Z", toolResult),
      stamped("assistant", "2026-10-01T10:02:20.000Z", [{ type: "text", text: "a" }], { id: "t2" }),
      stamped("assistant", "2026-10-01T10:02:30.000Z", [{ type: "text", text: "b" }], { id: "t2" }),
      stamped("user", "2026-10-01T10:12:30.000Z", "and then"),
      stamped("assistant", "2026-10-01T10:13:30.000Z", [{ type: "text", text: "c" }], { id: "t3" }),
      // A line with no timestamp is not read for time either.
      JSON.stringify({ type: "user", sessionId: "s-time", message: { role: "user", content: "unstamped" } }),
    ].join("\n") + "\n",
    "projects/s-time/subagents/agent-agent9.jsonl": [
      stamped("user", "2026-10-01T10:01:01.000Z", "your order", { agentId: "agent9", isSidechain: true }),
      stamped("assistant", "2026-10-01T10:01:21.000Z", [{ type: "text", text: "done" }], { agentId: "agent9", isSidechain: true, id: "t4" }),
    ].join("\n") + "\n",
  });
  const timed = report(timeRoot, join(timeRoot, "projects"), null);
  const row = (tag) => timed.rows.find((one) => one.workstream === tag.workstream && one.arc === tag.arc && one.order === tag.order);
  const windowRow = row(N116), agentRow = row(M7);
  ok("[MKT.SCRIPTS.96] the time before each reply line is the model's own", windowRow?.modelMs === 60000 + 50000 + 10000 + 60000, JSON.stringify(windowRow));
  ok("[MKT.SCRIPTS.96] the time before a tool result is a tool's, and no other line splits it", windowRow?.toolMs === 30000, JSON.stringify(windowRow));
  ok("[MKT.SCRIPTS.96] the time before a prompt is spent waiting for the developer", windowRow?.waitingMs === 600000, JSON.stringify(windowRow));
  ok("[MKT.SCRIPTS.96] the three add up to the window's span", windowRow && windowRow.modelMs + windowRow.toolMs + windowRow.waitingMs
    === Date.parse("2026-10-01T10:13:30.000Z") - Date.parse("2026-10-01T10:00:00.000Z"), JSON.stringify(windowRow));
  ok("an agent's time goes to the order its own calls touched", agentRow?.modelMs === 20000 && agentRow?.toolMs === 0 && agentRow?.waitingMs === 0,
    JSON.stringify(agentRow));
  ok("the total holds each kind of time once", timed.total.modelMs === 200000 && timed.total.toolMs === 30000 && timed.total.waitingMs === 600000,
    JSON.stringify(timed.total));
  ok("the tokens beside the time are still counted once", timed.total.replies === 4 && windowRow?.replies === 3, JSON.stringify(timed.total));

  const text = execFileSync("node", [CLI, "workspace", "tokens", "show", "--root", timeRoot, "--projects", join(timeRoot, "projects")],
    { encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } });
  ok("[MKT.SCRIPTS.96] the report prints the model's time beside the tokens", /Model time/.test(text) && /\n    \(no order\) .* 3\.0 min\n/.test(text), text);
  ok("[MKT.SCRIPTS.96] and the tools' time and the waiting apart from it",
    /the model 3\.3 min · the tools 0\.5 min · waiting on a prompt 10\.0 min/.test(text), text);

  // UNTOUCHED — a transcript whose lines carry no time reads as no time, and its tokens are as before.
  const all = report(root, projects, null);
  const bare = all.rows.find((one) => one.workstream === OTHER.workstream);
  ok("a session with one stamped line has no time before it", bare?.modelMs === 0 && bare?.toolMs === 0 && bare?.waitingMs === 0, JSON.stringify(bare));
  ok("an untagged session's time is counted as untagged, never assigned", all.untagged.modelMs === 0 && all.untagged.replies === 2, JSON.stringify(all.untagged));
}

console.log("\n=== workspace tokens — the command");
{
  const ENV = { ...process.env, SPN_TELEMETRY: "off" };
  /** `workspace tokens` through the entry, with the words typed after it: what it printed, and its exit code. */
  const typed = (...words) => {
    try { return { out: execFileSync("node", [CLI, "workspace", "tokens", ...words], { encoding: "utf8", stdio: "pipe", env: ENV }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
  };
  const text = typed("show", "--root", root, "--projects", projects).out;
  ok("prints the tree with the totals", /008-plain-language/.test(text) && /\n  N116/.test(text) && /M7-order-rules-telemetry-subtitle/.test(text) && /\ntotal/.test(text), text);
  ok("says untagged rather than guessing", /untagged \(2 session\(s\)\)/.test(text), text);
  const json = JSON.parse(typed("show", "008", "--json", "--root", root, "--projects", projects).out);
  ok("--json carries the filter and the rows", json.filter === "008" && json.rows.length === 2, JSON.stringify(json).slice(0, 200));
  const USAGE = "usage: spn-devex workspace tokens show [<workstream>] [--json] [--root <workspace>] [--projects <folder>]\n";
  const lost = typed("show", "--root", projects);
  ok("a folder that is not a workspace is refused with the usage line, and exits 2",
    lost.code === 2 && lost.out.startsWith(USAGE + "`workspace tokens show` needs a workspace, and ") && lost.out.includes("pass `--root <workspace>`"), lost.out);
  const none = typed("--root", root);
  ok("[MKT.SCRIPTS.111] with no action the entry prints the usage line and says an action is owed",
    none.code === 2 && none.out === USAGE + "`workspace tokens` needs an action.\n", none.out);
  const option = typed("show", "--root", root, "--write");
  ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2", option.code === 2 && option.out === USAGE + "`workspace tokens show` does not take `--write`.\n", option.out);
  const valueless = typed("show", "--root");
  ok("an option that takes a value is refused without one, with exit 2", valueless.code === 2 && valueless.out.includes("needs a value after `--root`."), valueless.out);
  const two = typed("show", "008", "015", "--root", root, "--projects", projects);
  ok("a second workstream is refused with exit 2", two.code === 2 && two.out.includes("takes one workstream."), two.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workspace tokens` : `\n  all ${total} passed — workspace tokens`);
process.exit(failed ? 1 : 0);
