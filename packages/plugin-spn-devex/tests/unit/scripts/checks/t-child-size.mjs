import { CHECKS, EVENTS, run } from "../../../helpers/harness.mjs";
// `checks/child-size.ts` — a child past the stop line of its order is refused its next tool call, except the
// call that saves the report the order owes. Silent in the main window and in a child that runs no order.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace, BASE } from "../../../helpers/fixture.mjs";

const { checkChildSize, stopLine, childTranscript } = await import(join(CHECKS, "child-size.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};

const ORDER_PATH = ".spndevex/workstreams/open/031-probe/notes/N001/orders/7-build.md";
const ORDER = "---\nrow: 1\n---\n# Order 7\n\nStop at 150k of context or 100 turns, at the next whole step, and say where you stopped.\n";
const root = workspace("child-size", { [ORDER_PATH]: ORDER });
const order = join(root, ORDER_PATH);
const report = order.replace(/\.md$/, ".report.md");

/** A child's transcript: its brief, then `turns` model turns, the last holding `held` tokens. */
const transcript = (name, { turns, held, brief = `Carry out the order ${order} and nothing more.` }) => {
  const lines = [JSON.stringify({ type: "user", message: { role: "user", content: brief } })];
  for (let at = 1; at <= turns; at += 1) {
    const size = at === turns ? held : 1000;
    lines.push(JSON.stringify({ type: "assistant", message: { id: `m${at}`, usage: { input_tokens: 10, cache_read_input_tokens: size - 20, cache_creation_input_tokens: 10, output_tokens: 5 } } }));
  }
  const path = join(BASE, `${name}.jsonl`);
  writeFileSync(path, `${lines.join("\n")}\n`);
  return path;
};
const call = (agent_transcript_path, tool_name, tool_input, extra = {}) =>
  ({ tool_name, tool_input, cwd: root, session_id: "w1", agent_id: "a1", agent_transcript_path, ...extra });

console.log("=== the line an order sets");
{
  ok("`Stop at 150k of context or 100 turns` reads as 150000 and 100", JSON.stringify(stopLine(ORDER)) === JSON.stringify({ context: 150000, turns: 100 }));
  ok("a line with only turns reads turns alone", JSON.stringify(stopLine("Stop at 40 turns.")) === JSON.stringify({ context: null, turns: 40 }));
  ok("an order with no stop line sets none", stopLine("# no line here\n") === null);
}

console.log("\n=== refused: a child past its line");
{
  const heavy = transcript("heavy", { turns: 5, held: 160000 });
  const verdict = checkChildSize(call(heavy, "Bash", { command: "ls" }));
  ok("past the context line, the next call is refused", Boolean(verdict?.deny), JSON.stringify(verdict));
  ok("the refusal names the report the order owes", verdict?.deny?.includes(report), verdict?.deny);
  ok("and says how far past the line it is", /160k tokens, past the order's 150k/.test(verdict?.deny ?? ""), verdict?.deny);
  const long = transcript("long", { turns: 100, held: 50000 });
  ok("past the turns line, the next call is refused", /100 turns, past the order's 100/.test(checkChildSize(call(long, "Read", { file_path: "/x" }))?.deny ?? ""));
  ok("a call with no command and no path is refused too", Boolean(checkChildSize(call(heavy, "Grep", { pattern: "x" }))?.deny));
  ok("a Write of the order's report passes", checkChildSize(call(heavy, "Write", { file_path: report, content: "x" })) === null);
  ok("an Edit of the order's report passes", checkChildSize(call(heavy, "Edit", { file_path: report, old_string: "a", new_string: "b" })) === null);
  ok("a Write of another file is refused", Boolean(checkChildSize(call(heavy, "Write", { file_path: join(root, "other.md"), content: "x" }))?.deny));
  ok("a shell write of the report passes", checkChildSize(call(heavy, "Bash", { command: `cat > ${report} <<'EOF'\nx\nEOF` })) === null);
}

console.log("\n=== silent");
{
  const light = transcript("light", { turns: 99, held: 149000 });
  ok("a child under both lines hears nothing", checkChildSize(call(light, "Bash", { command: "ls" })) === null);
  const heavy = transcript("heavy-main", { turns: 5, held: 160000 });
  ok("the main window, which has no agent id, hears nothing", checkChildSize({ ...call(heavy, "Bash", { command: "ls" }), agent_id: undefined }) === null);
  const nobrief = transcript("no-order", { turns: 5, held: 160000, brief: "Look around and report." });
  ok("a child that runs no order hears nothing", checkChildSize(call(nobrief, "Bash", { command: "ls" })) === null);
  ok("a child whose transcript cannot be found hears nothing", checkChildSize(call(join(BASE, "absent.jsonl"), "Bash", { command: "ls" })) === null);
  const gone = transcript("gone-order", { turns: 5, held: 160000, brief: `Carry out ${join(root, "notes/N001/orders/9-missing.md")}.` });
  ok("a brief naming an order that is not on disk hears nothing", checkChildSize(call(gone, "Bash", { command: "ls" })) === null);
}

console.log("\n=== where the child's transcript is found");
{
  const window = join(BASE, "window.jsonl");
  const derived = join(BASE, "w9", "subagents", "agent-a9.jsonl");
  ok("the path the event hands is used first", childTranscript({ agent_transcript_path: transcript("handed", { turns: 1, held: 1000 }) })?.endsWith("handed.jsonl"));
  ok("with none beside the window's transcript, nothing is found", childTranscript({ transcript_path: window, session_id: "w9", agent_id: "a9" }) === null);
  mkdirSync(join(BASE, "w9", "subagents"), { recursive: true });
  writeFileSync(derived, "");
  ok("otherwise it is the child's file beside the window's transcript", childTranscript({ transcript_path: window, session_id: "w9", agent_id: "a9" }) === derived);
}

{
  console.log("\n=== the dispatcher carries it");
  const heavy = transcript("heavy-dispatch", { turns: 5, held: 160000 });
  const out = run("node", [join(EVENTS, "pretooluse.ts")], call(heavy, "Bash", { command: "ls" }), root);
  ok("the pre-tool hook refuses a child past its line", /"permissionDecision":"deny"/.test(out) && out.includes(report), out);
  const main = run("node", [join(EVENTS, "pretooluse.ts")], { ...call(heavy, "Bash", { command: "ls" }), agent_id: undefined }, root);
  ok("and says nothing in the main window", !/permissionDecision/.test(main), main);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-child-size` : `\n  all ${total} passed — t-child-size`);
process.exit(failed ? 1 : 0);
