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
    lines.every((line) => Object.keys(line).join(",") === "v,mtype,id,at,ms,event,session,agent,workstream,arc,part,skill,stage,work,retryOf,model,tokens"), JSON.stringify(lines[0]));
  check("`model` is the reply's own", lines.map((line) => line.model).join() === "claude-sonnet-5-5,claude-sonnet-5-5", JSON.stringify(lines));
  check("`ms` runs from the line before the reply to the reply's first line", lines.map((line) => line.ms).join() === "3500,2250", JSON.stringify(lines));
  check("[MKT.SCRIPTS.326] a helper launched for docs-spn-support-ts-2 reading N014's folder: its rows carry arc N012, that part, work DOCS and event SubagentStop",
    lines.every((line) => line.arc === "N012" && line.part === "docs-spn-support-ts-2" && line.work === "DOCS" && line.workstream === ws && line.event === "SubagentStop"), JSON.stringify(lines));
  check("[MKT.SCRIPTS.326] a row holds no `row`, `order` or `turn` field", lines.every((line) => !("row" in line) && !("order" in line) && !("turn" in line)));
}

console.log("\n=== a review panel's stop writes one PANEL row (RULE.DEVEX.WORKSPACE.485)");
{
  const user = (text) => JSON.stringify({ type: "user", message: { role: "user", content: text } });
  const said = (text) => JSON.stringify({ type: "assistant", message: { id: `m-${text.length}`, role: "assistant", content: [{ type: "text", text }], usage: { input_tokens: 1, output_tokens: 1 } } });
  const setup = (name, { type = "spn-devex:spn-panel", prompt, reply, via = "meta" }) => {
    const root = join(BASE, name);
    mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
    mkdirSync(join(root, ".spndevex", "workstreams", "open", "031-probe"), { recursive: true });
    writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
    const child = join(root, "agent-ad63e6e35a5b14a80.jsonl");
    writeFileSync(child, [user(prompt), said("reading the work"), ...[].concat(reply).map(said)].join("\n") + "\n");
    if (via === "meta") writeFileSync(join(root, "agent-ad63e6e35a5b14a80.meta.json"), JSON.stringify({ agentType: type, description: "panel" }));
    const payload = { cwd: root, session_id: "sp", agent_id: "ad63", agent_transcript_path: child, ...(via === "payload" ? { agent_type: type } : {}) };
    const out = stop(root, payload);
    const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
    const rows = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((row) => row.mtype === "PANEL") : [];
    return { root, rows, out };
  };
  const a = setup("panel-meta", { prompt: "Convene the architect lens on 031-probe/N001 for the release part release-spn-foundation-1.", reply: "Pass with advice\n\nRename the helper." });
  check("[MKT.HOOKS.439] a panel known by the agentType in the meta file beside its transcript writes one PANEL row, the helper's own, v 1 and event SubagentStop",
    a.rows.length === 1 && a.rows[0].v === 1 && a.rows[0].event === "SubagentStop" && a.rows[0].agent === "ad63" && a.rows[0].session === "sp", JSON.stringify(a.rows));
  check("[MKT.HOOKS.439] it holds the head, then the lens and the verdict",
    Object.keys(a.rows[0] ?? {}).join(",") === "v,mtype,id,at,ms,event,session,agent,workstream,arc,part,skill,stage,work,retryOf,lens,verdict", JSON.stringify(a.rows[0]));
  check("[MKT.HOOKS.439] the lens is the first one the prompt names, the verdict the first line of the last reply, and PASS_WITH_ADVICE is not PASS",
    a.rows[0]?.lens === "ARCHITECT" && a.rows[0]?.verdict === "PASS_WITH_ADVICE", JSON.stringify(a.rows[0]));
  check("[MKT.HOOKS.439] the workstream, arc and part are the ones the prompt names, and work is read from the part", a.rows[0]?.workstream === "031-probe" && a.rows[0]?.arc === "N001"
    && a.rows[0]?.part === "release-spn-foundation-1" && a.rows[0]?.work === "RELEASE", JSON.stringify(a.rows[0]));
  check("[MKT.HOOKS.439] the hook says nothing to the child", a.out === "");

  const b = setup("panel-payload", { via: "payload", type: "other:spn-panel", prompt: "Read 031/N001 as the INFRA lens.", reply: "**BLOCKED** — the file moves." });
  check("[MKT.HOOKS.439] the payload's agent_type is read first, and a type that ends in spn-panel is the panel; a bare 031/N001 names the workstream folder",
    b.rows.length === 1 && b.rows[0].lens === "INFRA" && b.rows[0].verdict === "BLOCKED" && b.rows[0].workstream === "031-probe" && b.rows[0].arc === "N001" && b.rows[0].part === null, JSON.stringify(b.rows));

  const c = setup("panel-nocarry", { prompt: "Judge the proposal as the product lens.", reply: "Pass." });
  check("[MKT.HOOKS.439] a prompt that names no work leaves the workstream, arc and part null where the main window carries none", c.rows.length === 1 && c.rows[0].workstream === null && c.rows[0].verdict === "PASS" && c.rows[0].lens === "PRODUCT", JSON.stringify(c.rows));
  const d = join(BASE, "panel-carried-main");
  mkdirSync(join(d, ".spndevex", ".debug", "sessions", "sp"), { recursive: true });
  writeFileSync(join(d, ".spndevex", ".debug", "sessions", "sp", "tags.json"), JSON.stringify({ main: { workstream: "031-probe", arc: "N002", part: null, skill: null }, ad63: { workstream: "099-lane", arc: "N009", part: null, skill: null } }));
  const child = join(d, "agent-x.jsonl");
  writeFileSync(child, [user("Judge it as the lead lens."), said("PASS")].join("\n") + "\n");
  writeFileSync(join(d, "agent-x.meta.json"), JSON.stringify({ agentType: "spn-devex:spn-panel" }));
  writeFileSync(join(d, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  stop(d, { cwd: d, session_id: "sp", agent_id: "ad63", agent_transcript_path: child });
  const carriedRows = readFileSync(join(d, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line)).filter((row) => row.mtype === "PANEL");
  check("[MKT.HOOKS.439] a prompt that names no work takes the main window's carried tags, never the helper's own lane",
    carriedRows.length === 1 && carriedRows[0].workstream === "031-probe" && carriedRows[0].arc === "N002" && carriedRows[0].lens === "LEAD", JSON.stringify(carriedRows));
  check("[MKT.HOOKS.439] and the main window's carried tags are left as they were",
    JSON.parse(readFileSync(join(d, ".spndevex", ".debug", "sessions", "sp", "tags.json"), "utf8")).main.arc === "N002");

  const beside = (name, prompt) => setup(name, { prompt, reply: "Pass" }).rows[0]?.lens;
  check("[MKT.HOOKS.410] the lens beside the word lens wins over an earlier lens word: \"lens: architect\", \"Lens ARCHITECT\", \"the architect lens\", \"through the infra lens\"",
    beside("lens-a", "Read the lead arc 031/N001, lens: architect.") === "ARCHITECT" && beside("lens-b", "Read the data for 031/N001. Lens ARCHITECT") === "ARCHITECT"
      && beside("lens-c", "The product work in 031/N001, through the infra lens.") === "INFRA" && beside("lens-d", "Support asks about 031/N001: the server dev lens please.") === "SERVER_DEV");
  check("[MKT.HOOKS.410] with no lens beside the word lens, the earliest lens word stands", beside("lens-e", "Judge 031/N001 as ux, then as ui.") === "UX");
  const other = setup("panel-not", { type: "general-purpose", prompt: "Review 031/N001 as the architect.", reply: "Pass" });
  check("[MKT.HOOKS.440] a helper that is not the panel writes no PANEL row", other.rows.length === 0, JSON.stringify(other.rows));
  const unsure = setup("panel-unsure", { prompt: "Review 031/N001 as the architect.", reply: "Looks fine to me.\n\nPass" });
  check("[MKT.HOOKS.440] a panel whose last reply opens with no verdict writes no row", unsure.rows.length === 0, JSON.stringify(unsure.rows));
  const twoRounds = setup("panel-two-rounds", { prompt: "Review 031/N001 as the architect.", reply: ["Pass with advice\n\nRename the helper.", "Noted, nothing to add after the second round."] });
  check("[MKT.HOOKS.439] a panel whose first answer opens 'Pass with advice' and whose second opens with no verdict is recorded PASS_WITH_ADVICE",
    twoRounds.rows.length === 1 && twoRounds.rows[0].verdict === "PASS_WITH_ADVICE", JSON.stringify(twoRounds.rows));
  const joined = setup("panel-joined", { prompt: "Review 031/N001 as the architect.", reply: "PASS_WITH_ADVICE\n\nRename the helper." });
  check("[MKT.HOOKS.439] a panel whose answer opens 'PASS_WITH_ADVICE' is recorded PASS_WITH_ADVICE too", joined.rows.length === 1 && joined.rows[0].verdict === "PASS_WITH_ADVICE", JSON.stringify(joined.rows));
  const noneTwice = setup("panel-none-twice", { prompt: "Review 031/N001 as the architect.", reply: ["Looking at the work now.", "Still reading; more soon."] });
  check("[MKT.HOOKS.440] a panel whose replies open with no verdict writes no row", noneTwice.rows.length === 0, JSON.stringify(noneTwice.rows));
  const ideate = setup("panel-ideate", { prompt: "Convene the lens architect on 031-probe/ideate.", reply: "Pass" });
  check("[MKT.HOOKS.439] a prompt naming `<ws>/ideate` records the arc ideate, and `<ws>/follow-ups` records follow-ups",
    ideate.rows[0]?.arc === "ideate" && setup("panel-followups", { prompt: "Convene the lens architect on 031-probe/follow-ups.", reply: "Pass" }).rows[0]?.arc === "follow-ups", JSON.stringify(ideate.rows));
  const lens = setup("panel-nolens", { prompt: "Review 031/N001, no view named.", reply: "Pass" });
  check("[MKT.HOOKS.440] a prompt that names no lens writes no row, since a row holds a lens of the contract", lens.rows.length === 0, JSON.stringify(lens.rows));
  const handback = (name, message) => {
    const root = join(BASE, name);
    mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
    writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
    const child = join(root, "agent-h.jsonl");
    const handed = JSON.stringify({ type: "assistant", message: { id: "m-h", role: "assistant", content: [{ type: "tool_use", id: "t-h", name: "SubagentHandback", input: { message } }], usage: { input_tokens: 1, output_tokens: 1 } } });
    writeFileSync(child, [user("Review 031/N001 through the lead lens."), said("reading the work"), handed].join("\n") + "\n");
    writeFileSync(join(root, "agent-h.meta.json"), JSON.stringify({ agentType: "spn-devex:spn-panel" }));
    stop(root, { cwd: root, session_id: "sp", agent_id: "h", agent_transcript_path: child });
    const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
    return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((row) => row.mtype === "PANEL") : [];
  };
  const handed = handback("panel-handback", "Pass with advice\n\n**Lead:** the plan is the right size.");
  check("[MKT.HOOKS.442] a panel that ends by handing its report back writes one PANEL row with the verdict the report opens with",
    handed.length === 1 && handed[0].verdict === "PASS_WITH_ADVICE" && handed[0].lens === "LEAD", JSON.stringify(handed));
  const handedNone = handback("panel-handback-none", "Read the plan; see below.\n\nPass");
  check("[MKT.HOOKS.442] a handed-back report that opens with no verdict writes no row", handedNone.length === 0, JSON.stringify(handedNone));
  const off = join(BASE, "panel-off");
  mkdirSync(join(off, ".spndevex"), { recursive: true });
  const offChild = join(off, "agent-o.jsonl");
  writeFileSync(offChild, [user("architect 031/N001"), said("Pass")].join("\n") + "\n");
  writeFileSync(join(off, "agent-o.meta.json"), JSON.stringify({ agentType: "spn-devex:spn-panel" }));
  stop(off, { cwd: off, session_id: "sp", agent_id: "o", agent_transcript_path: offChild });
  check("[MKT.HOOKS.439] with recording off nothing is written", !existsSync(join(off, ".spndevex", ".debug")));
}

console.log("\n=== a panel whose stop fired before its last reply was saved gets its PANEL row from `replayPanels` (RULE.DEVEX.WORKSPACE.485)");
{
  const { replayPanels } = await import(join(PLUGIN, "src", "scripts", "lib", "panel.ts"));
  // The replay runs in this process, so recording must not read as off here.
  const switchWas = process.env.SPN_TELEMETRY;
  delete process.env.SPN_TELEMETRY;
  process.on("exit", () => { if (switchWas !== undefined) process.env.SPN_TELEMETRY = switchWas; });
  const user = (text) => JSON.stringify({ type: "user", message: { role: "user", content: text } });
  const said = (text) => JSON.stringify({ type: "assistant", message: { id: `m-${text.length}`, role: "assistant", content: [{ type: "text", text }], usage: { input_tokens: 1, output_tokens: 1 } } });
  const root = join(BASE, "replay");
  mkdirSync(join(root, ".spndevex", ".debug"), { recursive: true });
  mkdirSync(join(root, ".spndevex", "workstreams", "open", "031-probe"), { recursive: true });
  writeFileSync(join(root, ".spndevex", ".debug", "switches.json"), '{"telemetry": true}');
  const window = join(root, "window.jsonl");
  writeFileSync(window, assistant("w1", 1) + "\n");
  const folder = join(root, "window", "subagents");
  mkdirSync(folder, { recursive: true });
  const child = join(folder, "agent-pr1.jsonl");
  writeFileSync(join(folder, "agent-pr1.meta.json"), JSON.stringify({ agentType: "spn-devex:spn-panel" }));
  writeFileSync(child, [user("Convene the architect lens on 031-probe/N001 for the release part release-spn-foundation-1."), said("reading the work")].join("\n") + "\n");
  const facts = { script: "spn-devex", event: "Stop", tool: null, session: "sr" };
  const rowsOf = () => {
    const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
    return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((row) => row.mtype === "PANEL") : [];
  };
  const early = replayPanels(root, window, facts, []);
  check("[MKT.HOOKS.439] a panel whose last reply holds no verdict yet writes no row, and is left for the next turn end", rowsOf().length === 0 && !early.includes("pr1"), JSON.stringify({ rows: rowsOf(), early }));
  appendLine(child, said("Pass with advice\n\nRename the helper."));
  const later = replayPanels(root, window, facts, early);
  const rows = rowsOf();
  check("[MKT.HOOKS.439] once the reply is there it writes one PANEL row, the helper's own, with the lens and the verdict (event SubagentStop, as support's contract types a PANEL row)",
    rows.length === 1 && rows[0].agent === "pr1" && rows[0].event === "SubagentStop" && rows[0].session === "sr" && rows[0].lens === "ARCHITECT" && rows[0].verdict === "PASS_WITH_ADVICE", JSON.stringify(rows));
  check("[MKT.HOOKS.439] the row carries the workstream, arc and part the prompt names, and work read from the part",
    rows[0]?.workstream === "031-probe" && rows[0]?.arc === "N001" && rows[0]?.part === "release-spn-foundation-1" && rows[0]?.work === "RELEASE", JSON.stringify(rows[0]));
  check("[MKT.HOOKS.439] the agent id is settled, so a later turn end does not read it again", later.includes("pr1"), JSON.stringify(later));
  replayPanels(root, window, facts, []);
  replayPanels(root, window, facts, later);
  check("[MKT.HOOKS.439] a replay that has lost its record of reads still writes none twice for one agent id", rowsOf().length === 1, JSON.stringify(rowsOf()));
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
