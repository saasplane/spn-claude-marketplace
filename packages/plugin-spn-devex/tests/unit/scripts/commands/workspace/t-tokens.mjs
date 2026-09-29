// `workspace tokens` — hook telemetry joined to the transcripts by session (RD.DEVEX.WORKSPACE.185).
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

const line = (session, at, tags = {}, agent = null) => JSON.stringify({
  script: "process", ms: 30, event: "PreToolUse", tool: "Read", session, at, pid: 1,
  workstream: null, arc: null, order: null, agent, ...tags,
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

console.log("\n=== workspace tokens — the command");
{
  const text = execFileSync("node", [CLI, "workspace", "tokens", "--root", root, "--projects", projects], { encoding: "utf8" });
  ok("prints the tree with the totals", /008-plain-language/.test(text) && /\n  N116/.test(text) && /M7-order-rules-telemetry-subtitle/.test(text) && /\ntotal/.test(text), text);
  ok("says untagged rather than guessing", /untagged \(2 session\(s\)\)/.test(text), text);
  const json = JSON.parse(execFileSync("node", [CLI, "workspace", "tokens", "008", "--json", "--root", root, "--projects", projects], { encoding: "utf8" }));
  ok("--json carries the filter and the rows", json.filter === "008" && json.rows.length === 2, JSON.stringify(json).slice(0, 200));
  let refused = false;
  try { execFileSync("node", [CLI, "workspace", "tokens", "--root", projects], { encoding: "utf8", stdio: "pipe" }); }
  catch (error) { refused = error.status === 2; }
  ok("a folder that is not a workspace exits 2", refused);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workspace tokens` : `\n  all ${total} passed — workspace tokens`);
process.exit(failed ? 1 : 0);
