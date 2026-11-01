// `events/subagentstop.ts` — a child's turns are logged to telemetry when the child stops, under the child's
// agent id, read from `agent_transcript_path` (the event's own `transcript_path` is the window's).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const SCRIPT = join(PLUGIN, "src", "scripts", "events", "subagentstop.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-subagentstop-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let n = 0, failed = 0;
const check = (label, ok, detail = "") => {
  n += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n        ${String(detail).slice(0, 400)}`}`);
};
const assistant = (id, output) => JSON.stringify({ type: "assistant", message: { id, usage: { input_tokens: 1, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: output } } });

// The telemetry switch is read from the environment, and the suite runs with it off.
const env = { ...process.env };
delete env.SPN_TELEMETRY;
const stop = (root, payload, extra = {}) => execFileSync("node", [SCRIPT], { input: JSON.stringify(payload), encoding: "utf8", cwd: root, env: { ...env, ...extra } });

console.log("=== a child's stop logs its turns under its agent id");
{
  const root = join(BASE, "recording");
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  const window = join(root, "window.jsonl");
  const child = join(root, "agent-a1.jsonl");
  writeFileSync(window, assistant("w1", 99) + "\n");
  writeFileSync(child, [assistant("c1", 10), assistant("c1", 11), JSON.stringify({ type: "user", message: {} }), assistant("c2", 20)].join("\n") + "\n");
  const log = join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl");
  const out = stop(root, { cwd: root, session_id: "s1", hook_event_name: "SubagentStop", agent_id: "a1", transcript_path: window, agent_transcript_path: child });
  const lines = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line)) : [];
  check("the child's two turns are logged, once each, by message id, with the counts of the last line of each",
    lines.length === 2 && lines.every((line) => line.v === 1 && line.mtype === "TURN" && line.event === "SubagentStop") && lines[0].id === "c1" && lines[0].tokens.out === 11 && lines[1].id === "c2" && lines[1].tokens.out === 20, JSON.stringify(lines));
  check("every line carries the child's agent id and the session", lines.every((line) => line.agent === "a1" && line.session === "s1"), JSON.stringify(lines));
  check("the window's own transcript is not read: its turn is not logged", !lines.some((line) => line.id === "w1"));
  check("the hook says nothing to the child", out === "");
  appendLine(child, assistant("c3", 5));
  stop(root, { cwd: root, session_id: "s1", hook_event_name: "SubagentStop", agent_id: "a1", agent_transcript_path: child });
  const after = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  check("a second stop logs only what the child gained since the first", after.length === 3 && after[2].id === "c3", JSON.stringify(after.map((line) => line.id)));
}

console.log("\n=== [MKT.HOOKS.340] a child's stop sent from outside the workspace is filed under the workspace");
{
  const root = join(BASE, "outside-home");
  const elsewhere = join(BASE, "outside-elsewhere");
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  mkdirSync(elsewhere, { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  const child = join(root, "agent-o.jsonl");
  writeFileSync(child, assistant("o1", 7) + "\n");
  const log = join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl");
  stop(elsewhere, { cwd: elsewhere, session_id: "so", hook_event_name: "SubagentStop", agent_id: "ao", agent_transcript_path: child }, { CLAUDE_PROJECT_DIR: root });
  const lines = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line)) : [];
  check("the child's turn is filed under the workspace the project directory names", lines.length === 1 && lines[0].id === "o1" && lines[0].agent === "ao", JSON.stringify(lines));
  check("and nothing is written in the folder the event stood in", !existsSync(join(elsewhere, ".spndevex")));
}

console.log("\n=== a TURN row says the model, the model's own time and the work (MKT.SCRIPTS.326)");
{
  const root = join(BASE, "fields");
  const ws = "036-agent-follows-rules";
  const order = join(root, ".spndevex", "workstreams", "open", ws, "notes", "N014", "orders", "docs-spn-support-ts-2.md");
  mkdirSync(join(order, ".."), { recursive: true });
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  writeFileSync(order, '---\ngo: "N012"\npart: "docs-spn-support-ts-2"\n---\n# order\n');
  const stamped = (type, at, extra = {}) => JSON.stringify({ type, timestamp: new Date(at).toISOString(), ...extra });
  const reply = (id, at, model) => stamped("assistant", at, { message: { id, model, usage: { input_tokens: 1, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 4 } } });
  const child = join(root, "agent-b.jsonl");
  // The helper's first prompt names the order; it reads N014's folder, while the order's front matter says the go is N012's.
  writeFileSync(child, [stamped("user", 1_000_000, { message: { content: `Do the work in ${order} now.` } }), reply("m1", 1_003_500, "claude-sonnet-5-5"), reply("m1", 1_004_000, "claude-sonnet-5-5"),
    stamped("user", 1_005_000, { message: { content: [{ type: "tool_result" }] } }), reply("m2", 1_007_250, "claude-sonnet-5-5")].join("\n") + "\n");
  stop(root, { cwd: root, session_id: "sf", agent_id: "b", agent_transcript_path: child });
  const log = join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl");
  const lines = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  check("a row's keys are in the book's order",
    lines.every((line) => Object.keys(line).join(",") === "v,mtype,id,at,ms,event,session,agent,workstream,arc,part,skill,work,retryOf,model,tokens"), JSON.stringify(lines[0]));
  check("`model` is the reply's own", lines.map((line) => line.model).join() === "claude-sonnet-5-5,claude-sonnet-5-5", JSON.stringify(lines));
  check("`ms` runs from the line before the reply to the reply's first line", lines.map((line) => line.ms).join() === "3500,2250", JSON.stringify(lines));
  check("[MKT.SCRIPTS.326] a helper launched for docs-spn-support-ts-2 reading N014's folder: its rows carry arc N012, that part, work DOCS and event SubagentStop",
    lines.every((line) => line.arc === "N012" && line.part === "docs-spn-support-ts-2" && line.work === "DOCS" && line.workstream === ws && line.event === "SubagentStop"), JSON.stringify(lines));
  check("[MKT.SCRIPTS.326] a row holds no `row`, `order` or `turn` field", lines.every((line) => !("row" in line) && !("order" in line) && !("turn" in line)));
}

console.log("\n=== it is silent where there is nothing to log");
{
  const root = join(BASE, "off");
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  const child = join(root, "agent.jsonl");
  writeFileSync(child, assistant("c1", 1) + "\n");
  stop(root, { cwd: root, session_id: "s", agent_id: "a9", agent_transcript_path: child });
  check("with recording off nothing is written", !existsSync(join(root, ".spndevex", ".debug")));
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  let code = 0;
  try { stop(root, { cwd: root, session_id: "s", agent_id: "a9" }); } catch (error) { code = error.status ?? 1; }
  check("an event with no transcript path exits 0 and logs nothing", code === 0 && !existsSync(join(root, ".spndevex", ".debug", "telemetry", "usage.jsonl")));
  let garbage = 0;
  try { execFileSync("node", [SCRIPT], { input: "not json", cwd: root, env }); } catch (error) { garbage = error.status ?? 1; }
  check("a payload that is not JSON still exits 0", garbage === 0);
}

console.log("\n=== the hook is registered");
{
  const hooks = JSON.parse(readFileSync(join(PLUGIN, "src", "hooks", "hooks.json"), "utf8")).hooks;
  const entry = hooks.SubagentStop?.[0]?.hooks?.[0];
  check("hooks.json runs dist/events/subagentstop.mjs on SubagentStop", Boolean(entry) && entry.command.includes("/dist/events/subagentstop.mjs"), JSON.stringify(entry));
}

function appendLine(file, line) { writeFileSync(file, readFileSync(file, "utf8") + line + "\n"); }

console.log(failed ? `\n  ${failed} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
