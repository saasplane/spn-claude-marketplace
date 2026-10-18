// `checks/workstream-owner.ts`, through the PreToolUse dispatcher — one owner per file, by force. Each
// refusal is shown firing on the call that breaks the rule, and the call that keeps it going through.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";
import { CARD, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";

const { levelRefusal, notesTreeRefusal, ownedRefusal, pageRefusal } = await import("../../../../src/scripts/checks/workstream-owner.ts");
const HOOK = resolve(PLUGIN, "src", "scripts", "events", "pretooluse.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** The dispatcher's verdict on one call: `deny`, `note` or `silent`, and what it said. */
function hook(payload, cwd) {
  let out = "";
  try { out = execFileSync(process.execPath, [HOOK], { input: JSON.stringify(payload), cwd, encoding: "utf8", env: { ...process.env, SPN_TELEMETRY: "off" } }).trim(); }
  catch (error) { return ["error", String(error.stderr ?? error.message)]; }
  if (!out) return ["silent", ""];
  const parsed = JSON.parse(out.split("\n").filter(Boolean).at(-1));
  const specific = parsed.hookSpecificOutput ?? {};
  return [specific.permissionDecision === "deny" ? "deny" : "note", specific.permissionDecisionReason ?? specific.additionalContext ?? ""];
}

const { root, ws } = await dataWorkspace("owner");
const page = join(ws, "approach.html");
const state = join(ws, "arcs", "N001", "state.json");

console.log("=== a file a script owns is written only by its command");
{
  for (const file of ["arcs/N001/state.json", "arcs/N001/log.jsonl", "arcs/N001/facts.jsonl", "questions.jsonl", "suggestions.jsonl"]) {
    const [verdict, why] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, file), content: "{}" } }, root);
    ok(`red: a Write to ${file} is refused`, verdict === "deny" && why.includes(`\`${file}\` is written only by`), `${verdict}: ${why.slice(0, 200)}`);
  }
  const [edit, why] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: state, old_string: '"DECIDED"', new_string: '"RUNNING"' } }, root);
  ok("red: an Edit to state.json is refused, and names its command", edit === "deny" && why.includes("`workstream row write`"), why.slice(0, 200));
  const [bash] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `echo '{}' > ${join(ws, "questions.jsonl")}` } }, root);
  ok("red: a shell redirect into questions.jsonl is refused", bash === "deny");
  const [read] = hook({ tool_name: "Read", cwd: root, tool_input: { file_path: state } }, root);
  ok("green: reading state.json is never refused", read !== "deny");
  const [notes] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, "notes", "N001", "plan.md"), content: "# plan\n" } }, root);
  ok("green: the agent's plan is the agent's to write", notes !== "deny");
  ok("the workspace's own workstreams/state.json is spnutils', not refused here", ownedRefusal(join(root, ".spndevex", "workstreams", "state.json")) === null);
  const command = cli(root, ["workstream", "row", "write", "031/N001", "--status", "RUNNING"]);
  ok("green: the command writes state.json itself", command.code === 0 && JSON.parse(readFileSync(state, "utf8")).status === "RUNNING", command.out);
}

console.log("\n=== a generated block is written only by its command");
{
  const text = readFileSync(page, "utf8");
  const overall = /<p>Overall: [^<]*<\/p>/.exec(text)[0];
  const [progress, why] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: overall, new_string: "<p>typed</p>" } }, root);
  ok("red: an Edit inside the progress block is refused", progress === "deny" && why.includes("generated `progress` block"), why.slice(0, 200));
  const [open] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: "Open &mdash; no card is open", new_string: "Open &mdash; Q3" } }, root);
  ok("red: an Edit inside the open block is refused", open === "deny");
  const [whole] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: page, content: text.replace(overall, "<p>typed</p>") } }, root);
  ok("red: a Write that changes a block is refused", whole === "deny");
  const [outside] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: "<h4 id=\"c1\">The probe</h4>", new_string: "<h4 id=\"c1\">The probe, renamed</h4>" } }, root);
  ok("green: an Edit outside the blocks goes through", outside !== "deny");
  const [rewrite] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: page, content: text.replace("The probe</h4>", "The probe, renamed</h4>") } }, root);
  ok("green: a Write that keeps every block as it is goes through", rewrite !== "deny");
}

console.log("\n=== the stamp is written only by `arc stamp write`");
{
  const text = readFileSync(page, "utf8");
  const stamp = /data-arc-stamp="([^"]*)"/.exec(text)[1];
  const [hand, why] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: `data-arc-stamp="${stamp}"`, new_string: 'data-arc-stamp="000000000000"' } }, root);
  ok("red: a hand edit of the stamp is refused, and names the command", hand === "deny" && why.includes("workstream arc stamp write N001"), why.slice(0, 200));
  ok("green: a write that keeps the stamp is not judged", pageRefusal({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: "<p>what it decides</p>", new_string: "<p>what it decides, now</p>" } }) === null);
}

console.log("\n=== a card is raised, never typed");
{
  put(root, "card.json", JSON.stringify(CARD));
  cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
  const text = readFileSync(page, "utf8");
  const forged = '<div class="sds-open">\n<h4 id="q42">Q42 &middot; typed by hand</h4>\n</div>\n';
  const [typed, why] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: page, old_string: "<h4 id=\"c1\">The probe</h4>", new_string: `<h4 id="c1">The probe</h4>\n${forged}` } }, root);
  ok("red: a card typed by hand is refused in the hook's words", typed === "deny" && why.includes("q42 has no record: raise it with `workstream question raise`"), why.slice(0, 240));
  ok("green: the raised card stands on the page", /<h4 id="q1">Q1 &middot; Which way the <code>probe<\/code> goes<\/h4>/.test(text));
}

console.log("\n=== the migrations ledger is appended to only by `plugin migration write`");
{
  const ledger = join(root, ".spndevex", "migrations.jsonl");
  const [write, why] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: ledger, content: "{}\n" } }, root);
  ok("red: a Write to .spndevex/migrations.jsonl is refused, and names its command", write === "deny" && why.includes("`spn-devex plugin migration write`"), `${write}: ${why.slice(0, 200)}`);
  const [bash] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `echo '{}' >> ${ledger}` } }, root);
  ok("red: a shell append to it is refused", bash === "deny");
  const [read] = hook({ tool_name: "Read", cwd: root, tool_input: { file_path: ledger } }, root);
  ok("green: reading it is never refused", read !== "deny");
  const command = cli(root, ["plugin", "migration", "show"]);
  ok("green: the command reads it", command.code === 0 && /^001 · /.test(command.out), command.out);
}

console.log("\n=== RD.DEVEX.WORKSPACE.262 — a write that would make a sixth entry in an arc's notes folder");
{
  const notes = join(ws, "notes", "N001");
  const [shot, why] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(notes, "shots", "rail.png"), content: "png" } }, root);
  ok("red: a Write into a new shots/ folder is refused, and names samples/", shot === "deny" && why.includes("`notes/N001/shots/`") && why.includes("belongs in `samples/`"), `${shot}: ${why.slice(0, 300)}`);
  const [note, noteWhy] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(notes, "inventory.md"), content: "# x\n" } }, root);
  ok("red: a new note beside the plan is refused, and sent to a section of plan.md", note === "deny" && noteWhy.includes("a section of `plan.md`"), `${note}: ${noteWhy.slice(0, 300)}`);
  const [made, madeWhy] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `mkdir -p ${join(notes, "screens")}` } }, root);
  ok("red: a mkdir of a new folder there is refused", made === "deny" && madeWhy.includes("`notes/N001/screens/`"), `${made}: ${madeWhy.slice(0, 300)}`);
  const [moved] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `mv /tmp/a.png ${join(notes, "looks")}/a.png` } }, root);
  ok("red: a move into a new folder there is refused", moved === "deny");
  const [sample] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(notes, "samples", "shots", "rail.png"), content: "png" } }, root);
  ok("green: a folder inside samples/ is the agent's", sample !== "deny");
  const [samplesDir] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `mkdir -p ${join(notes, "samples", "looks")} ${join(notes, "orders")}` } }, root);
  ok("green: a mkdir of samples/ and orders/ goes through", samplesDir !== "deny");
  const [plan] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(notes, "plan.md"), content: "# plan\n" } }, root);
  ok("green: the plan is written", plan !== "deny");
  const [fresh] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, "notes", "N002", "preview.html"), content: "<p>x</p>" } }, root);
  ok("green: a new arc's preview is written", fresh !== "deny");
  put(root, ".spndevex/workstreams/open/031-probe/notes/N001/old-note.md", "# old\n");
  const [existing] = hook({ tool_name: "Edit", cwd: root, tool_input: { file_path: join(notes, "old-note.md"), old_string: "# old", new_string: "# old, links rewritten" } }, root);
  ok("green: a stray already on disk can still be edited, so its links are rewritten before it is folded", existing !== "deny");
  const closed = join(root, ".spndevex", "workstreams", "closed", "020-done", "notes", "N001", "shots", "a.png");
  ok("green: a closed workstream is never judged", ownedRefusal(closed) === null && notesTreeRefusal(closed) === null);
}

console.log("\n=== RD.DEVEX.WORKSPACE.262 and .264 — notes/ and arcs/ hold arc folders, and the name file is the commands'");
{
  const [loose, looseWhy] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, "notes", "ideation.md"), content: "# x\n" } }, root);
  ok("red: a note loose at notes/ is refused, and sent to an arc's plan", loose === "deny" && looseWhy.includes("`notes/ideation.md`") && looseWhy.includes("`plan.md`"), `${loose}: ${looseWhy.slice(0, 300)}`);
  const [folder] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `mkdir -p ${join(ws, "notes", "shots")}` } }, root);
  ok("red: a mkdir of a folder at notes/ that is no arc's is refused", folder === "deny");
  const [arcsFile, arcsWhy] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, "arcs", "N009-new.md"), content: "# N009\n" } }, root);
  ok("red: a file written at arcs/ is refused", arcsFile === "deny" && arcsWhy.includes("`arcs/N009-new.md`"), `${arcsFile}: ${arcsWhy.slice(0, 300)}`);
  const [name, nameWhy] = hook({ tool_name: "Write", cwd: root, tool_input: { file_path: join(ws, "arcs", "N001", "probe.md"), content: "# mine\n" } }, root);
  ok("red: a hand write of the arc's name file is refused, and names its commands", name === "deny" && nameWhy.includes("`docs cycles write`"), `${name}: ${nameWhy.slice(0, 300)}`);
  const [arcDir] = hook({ tool_name: "Bash", cwd: root, tool_input: { command: `mkdir -p ${join(ws, "notes", "N007", "samples")}` } }, root);
  ok("green: a new arc's notes folder is made", arcDir !== "deny");
  const closed = join(root, ".spndevex", "workstreams", "closed", "020-done", "notes", "ideation.md");
  ok("green: a closed workstream is never judged", levelRefusal(closed) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream owner` : `\n  all ${total} passed — workstream owner`);
process.exit(failed ? 1 : 0);
