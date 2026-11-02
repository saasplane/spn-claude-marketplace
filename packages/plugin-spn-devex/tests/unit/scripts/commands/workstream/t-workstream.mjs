// `commands/workstream/` — the only writers of what a script owns, run as the agent types them, in a
// throwaway workspace. Each command is shown answering in its line, writing its file, and refusing what
// it is typed with wrongly.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { CARD as BARE_CARD, arcData, cli, writeClosingBlock, dataWorkspace as dataArc, put } from "../../../../helpers/workstream-fixture.mjs";
// A card's What cites what it read, or `question raise` refuses it (MKT.SCRIPTS.383).
const CARD = { ...BARE_CARD, what: "The file is `a.ts:12`." };
import { workspace } from "../../../../helpers/fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
// An arc with no sheet lands a CODE row only on a run (MKT.SCRIPTS.231), so the default steps here are docs steps.
const dataWorkspace = (name, opts = {}) => dataArc(name, { ...opts, rows: opts.rows ?? arcData().rows.map((one) => ({ ...one, work: "DOCS" })) });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws, git } = await dataWorkspace("commands");
const arcFile = join(ws, "arcs", "N001", "state.json");
const log = join(ws, "arcs", "N001", "log.jsonl");

console.log("=== help lists the group");
{
  const help = cli(root, ["help"]);
  for (const words of ["workstream state show", "workstream state check", "workstream rows show", "workstream arc edit", "workstream row add", "workstream row state", "workstream row note", "workstream row edit", "workstream row discard", "workstream arc stamp",
    "workstream report write", "workstream fact write", "workstream suggestion add", "workstream suggestion state", "workstream suggestion edit", "workstream progress write",
    "workstream question raise", "workstream question show", "workstream question answer", "workstream question cite", "workstream question withdraw",
    "workstream sheet write", "workstream sheet edit", "workstream sheet drop", "workstream sheet show", "workstream sheet check"])
    ok(`help lists \`${words}\``, help.out.includes(words), words);
}

console.log("\n=== commandsRef — the plugin's own commands, one line each, from the same tree as help");
{
  const { commandsRef } = await import(resolve(PLUGIN, "src", "scripts", "cli.ts"));
  const ref = await commandsRef();
  ok("it opens with a heading that says it is generated", ref.startsWith("# spn-devex commands") && ref.includes("Never edited by hand"), ref.slice(0, 200));
  ok("a line carries the bin, the words, the usage and what it does", ref.split("\n").some((line) => line.startsWith("spn-devex workstream row discard <workstream>/<arc> <row> --note") && line.includes(" — take a row found invalid")), ref);
  ok("the retired `row write` is in neither help nor the ref", !ref.includes("row write") && !cli(root, ["help"]).out.includes("row write"));
  const edit = ref.split("\n").find((line) => line.startsWith("spn-devex workstream row edit ")) ?? "";
  ok("[MKT.SCRIPTS.209] `row edit` names `--proof` in its usage, in the ref the build writes", edit.includes("[--proof …]"), edit);
  ok("the subject-less and subject lines both appear", ref.includes("spn-devex workstream rows show"));
}

console.log("\n=== arc edit and the row commands — open an arc, change its header, add and move rows");
{
  const opened = cli(root, ["workstream", "arc", "edit", "031/N002", "--title", "the second arc", "--subject", "second", "--goal", "the second outcome"]);
  ok("an arc is opened as PROPOSED", opened.code === 0 && /ok · N002 0\/0 · N002 opened · PROPOSED/.test(opened.out), opened.out);
  const second = json(join(ws, "arcs", "N002", "state.json"));
  ok("its data holds the schema's header", second.schemaVersion === 2 && second.status === "PROPOSED" && second.preview === "preview.html" && second.rows.length === 0);
  const bare = cli(root, ["workstream", "arc", "edit", "031/N003"]);
  ok("red: an arc opened with no title is refused, exit 2", bare.code === 2 && bare.out.includes("opens N003 with `--title`, `--subject` and `--goal`: an arc opens only when all three are known, and until then its line stays in How (RULE.DEVEX.WORKSPACE.254)."), bare.out);
  const added = cli(root, ["workstream", "row", "add", "031/N001", "check it", "--kind", "fix", "--repo", "spn-x", "--work", "DOCS", "--blocked-by", "2", "--touches", "marketplace:b,foundation:c"]);
  ok("a row is added with the arc's next number, and the line prints it", added.code === 0 && /row 3 added/.test(added.out), added.out);
  const three = json(arcFile).rows.find((row) => row.id === "3");
  ok("with its lists read at commas, its repo and work, and its state ready by default", three.state === "ready" && three.repo === "spn-x" && three.work === "DOCS" && three.touches.join() === "marketplace:b,foundation:c" && three.blockedBy.join() === "2");
  ok("a row added never puts the page behind", !/N001's part on the approach page is behind/.test(added.out), added.out);
  const moved = cli(root, ["workstream", "row", "state", "031/N001", "1", "running"]);
  ok("a row's state moves, the log says from where, and no status line follows: RUNNING is worked out", moved.code === 0 && lines(log).at(-1).kind === "running" && lines(log).at(-1).note === "waiting → running" && /N001 reads RUNNING/.test(moved.out), `${moved.out}${JSON.stringify(lines(log).slice(-2))}`);
  const wrongKind = cli(root, ["workstream", "row", "add", "031/N001", "x", "--kind", "chore", "--repo", "spn-x", "--work", "CODE"]);
  ok("red: a kind outside the set is refused with the set", wrongKind.code === 2 && wrongKind.out.includes("fix · change · question"), wrongKind.out);
  const wrongWait = cli(root, ["workstream", "row", "add", "031/N001", "x", "--kind", "fix", "--repo", "spn-x", "--work", "CODE", "--blocked-by", "9"]);
  ok("red: a row waiting on a row the arc lacks is refused, and nothing is written", wrongWait.code === 2 && /waits on row 9/.test(wrongWait.out) && !json(arcFile).rows.some((row) => row.id === "4"), wrongWait.out);
  const mixed = cli(root, ["workstream", "arc", "edit", "031/N001", "--kind", "fix"]);
  ok("red: `arc edit` refuses a row's field and names `row edit`", mixed.code === 2 && mixed.out.includes("`row edit <workstream>/N<nnn> <row> --kind …`"), mixed.out);
  const noRepo = cli(root, ["workstream", "row", "add", "031/N001", "no repo", "--work", "CODE"]);
  ok("red: `row add` without --repo is refused, and nothing is added", noRepo.code === 2 && noRepo.out.includes("`--repo` and `--work`") && !json(arcFile).rows.some((row) => row.title === "no repo"), noRepo.out);
  const noWork = cli(root, ["workstream", "row", "add", "031/N001", "no work", "--repo", "spn-x"]);
  ok("red: `row add` without --work is refused, and nothing is added", noWork.code === 2 && noWork.out.includes("`--work` is missing") && !json(arcFile).rows.some((row) => row.title === "no work"), noWork.out);
  const ghostEdit = cli(root, ["workstream", "row", "edit", "031/N001", "99", "--title", "x"]);
  ok("red: `row edit` on a row the arc lacks is refused, naming `row add`", ghostEdit.code === 2 && ghostEdit.out.includes("finds no row 99") && ghostEdit.out.includes("row add"), ghostEdit.out);
  const ghostState = cli(root, ["workstream", "row", "state", "031/N001", "99", "landed"]);
  ok("red: `row state` on a row the arc lacks is refused, naming `row add`", ghostState.code === 2 && ghostState.out.includes("finds no row 99") && ghostState.out.includes("row add"), ghostState.out);
  const edited = cli(root, ["workstream", "row", "edit", "031/N001", "3", "--title", "check it twice", "--model", "Opus 5.5"]);
  ok("`row edit` changes a row's fields and logs it", edited.code === 0 && json(arcFile).rows.find((row) => row.id === "3").title === "check it twice" && lines(log).at(-1).kind === "changed", edited.out);
  const noted = cli(root, ["workstream", "row", "note", "031/N001", "3", "a line on three"]);
  ok("`row note` writes a log line on the row and changes nothing else", noted.code === 0 && lines(log).at(-1).note === "a line on three" && lines(log).at(-1).row === "3" && json(arcFile).rows.find((row) => row.id === "3").title === "check it twice", noted.out);
  const hiddenRow = cli(root, ["workstream", "row", "write", "031/N001", "3", "--state", "landed", "--note", "x"]);
  ok("red: the retired `row write` refuses and names `row state` for a state and a note", hiddenRow.code === 2 && hiddenRow.out.includes("row state 031/N001 3 landed --note") && json(arcFile).rows.find((row) => row.id === "3").state === "ready", hiddenRow.out);
  const hiddenArc = cli(root, ["workstream", "row", "write", "031/N001", "--goal", "x"]);
  ok("red: `row write` with no row names `arc edit`", hiddenArc.code === 2 && hiddenArc.out.includes("arc edit 031/N001 --goal"), hiddenArc.out);
  const hiddenAdd = cli(root, ["workstream", "row", "write", "031/N001", "77", "--title", "x", "--kind", "fix"]);
  ok("red: `row write` on a row the arc lacks names `row add`", hiddenAdd.code === 2 && hiddenAdd.out.includes("row add 031/N001"), hiddenAdd.out);
  const hiddenNote = cli(root, ["workstream", "row", "write", "031/N001", "3", "--note", "x"]);
  ok("red: `row write` with only a note names `row note`", hiddenNote.code === 2 && hiddenNote.out.includes("row note 031/N001 3"), hiddenNote.out);
  const hiddenEdit = cli(root, ["workstream", "row", "write", "031/N001", "3", "--title", "x"]);
  ok("red: `row write` with fields names `row edit`", hiddenEdit.code === 2 && hiddenEdit.out.includes("row edit 031/N001 3 --title"), hiddenEdit.out);
  const modelOnly = cli(root, ["workstream", "arc", "edit", "031/N001", "--model", "Opus 5.5"]);
  ok("--model with no row sets the arc's model, a field the arc and its rows share", modelOnly.code === 0 && json(arcFile).model === "Opus 5.5", modelOnly.out);
  const usageText = cli(root, ["workstream", "row"]);
  ok("[MKT.SCRIPTS.487] the usage of the row commands prints the forms exactly, with the arc as `<arc>`", /row add <workstream>\/<arc> "<title>" --repo <repo> --work <work>/.test(usageText.out) && /row state <workstream>\/<arc> <row> <state> \[--on "<what it waits on>"\] \[--note …\] \[--run <name>\]/.test(usageText.out) && /row note <workstream>\/<arc> <row> "<text>"/.test(usageText.out) && /row edit <workstream>\/<arc> <row> \[--title …\]/.test(usageText.out) && /row discard <workstream>\/<arc> <row>/.test(usageText.out) && !usageText.out.includes("row write"), usageText.out);
  const subjectAfter = cli(root, ["workstream", "031-probe", "row", "add", "--title", "x"]);
  ok("red: a subject placed after the group is refused, naming the right form", subjectAfter.code === 2 && subjectAfter.out.includes("spn-devex workstream row add 031-probe"), subjectAfter.out);
  const held = cli(root, ["workstream", "arc", "edit", "031/N001", "--status", "HELD"]);
  ok("red: HELD is no status, and the refusal names the stored set", held.code === 2 && held.out.includes("PROPOSED · DECIDED · LANDED · CARRIED · DROPPED"), held.out);
  const running = cli(root, ["workstream", "arc", "edit", "031/N001", "--status", "RUNNING", "--note", "the developer: go"]);
  ok("red: RUNNING is worked out from the steps, never written", running.code === 2 && running.out.includes("`RUNNING` is none of them"), running.out);
  const note = cli(root, ["workstream", "arc", "edit", "031/N001", "--note", "the developer: go"]);
  ok("--note alone writes a log line", note.code === 0 && lines(log).at(-1).note === "the developer: go", note.out);
  const nothing = cli(root, ["workstream", "row", "edit", "031/N001", "1"]);
  ok("red: a write that changes nothing is refused", nothing.code === 2 && nothing.out.includes("changes nothing"), nothing.out);
}

console.log("\n=== rows show — every row, the ready ones, the ones side by side, the tree");
{
  cli(root, ["workstream", "row", "state", "031/N001", "1", "landed"]);
  cli(root, ["workstream", "row", "add", "031/N001", "touches what 2 touches", "--kind", "fix", "--repo", "spn-x", "--work", "CODE", "--touches", "marketplace:b"]);
  const all = cli(root, ["workstream", "rows", "show", "031"]);
  ok("every row of every arc", all.code === 0 && /N001 1 +landed +write the book/.test(all.out) && /N001 4 /.test(all.out), all.out);
  const ready = cli(root, ["workstream", "rows", "show", "031", "--ready"]);
  ok("--ready: 2 is ready once 1 landed, 3 still waits on 2", /N001 2 /.test(ready.out) && !/N001 3 /.test(ready.out) && /N001 4 /.test(ready.out), ready.out);
  const side = cli(root, ["workstream", "rows", "show", "031", "--parallel", "--json"]);
  const ids = JSON.parse(side.out).map((row) => row.id);
  ok("--parallel: 2 and 5 both touch marketplace:b, so only one of them", ids.length === 1 && ids[0] === "2", side.out);
  cli(root, ["workstream", "row", "add", "031/N001", "under four", "--kind", "fix", "--repo", "spn-x", "--work", "CODE", "--parent", "4"]);
  const tree = cli(root, ["workstream", "rows", "show", "031/N001", "--tree"]);
  ok("--tree: a row under its parent is indented", /N001   4a/.test(tree.out), tree.out);
  ok("a row with a row under it loses its written state", !("state" in json(arcFile).rows.find((row) => row.id === "4")));
  const missing = cli(root, ["workstream", "rows", "show"]);
  ok("red: no workstream named is refused", missing.code === 2 && missing.out.includes("needs a workstream"), missing.out);
}

console.log("\n=== report write — a hand-back folded in from its front matter");
{
  put(ws, "notes/N001/orders/2.md", "---\nrow: \"2\"\nmodel: sonnet\n---\nthe brief\n");
  put(ws, "notes/N001/orders/2.report.md", ["---", 'row: "2"', "outcome: landed        # landed · stopped · needs-you", 'proof: "unit 12 ✓"',
    "commits: { spn-x: [abc12345] }", 'followUps: ["2b tidy the words"]', "cost: { tokens: 1500, minutes: 4 }", "---", "Short body.", ""].join("\n"));
  const folded = cli(root, ["workstream", "report", "write", "031", "notes/N001/orders/2.report.md"]);
  ok("the line says where the arc stands, what was added and what is ready", folded.code === 0 && /^ok · N001 \d+\/\d+ · 2b added · 3 ready/.test(folded.out), folded.out);
  const two = json(arcFile).rows.find((row) => row.id === "2");
  ok("the row takes the outcome, proof, commits and its order, and a `cost:` line the report carries is not read", two.state === "landed" && two.proof === "unit 12 ✓" &&
    two.commits["spn-x"][0] === "abc12345" && two.cost == null && two.order === "orders/2.md", JSON.stringify(two));
  const twoB = json(arcFile).rows.find((row) => row.id === "2b");
  ok("a follow-up becomes a row beside it, waiting", twoB?.state === "waiting" && twoB.title === "tidy the words" && twoB.repo === "spn-x");
  put(ws, "notes/N001/orders/3.report.md", "---\nrow: \"3\"\noutcome: finished\n---\n");
  const bad = cli(root, ["workstream", "report", "write", "031", "notes/N001/orders/3.report.md"]);
  ok("red: an outcome outside the three is refused", bad.code === 2 && bad.out.includes("landed · stopped · needs-you"), bad.out);
  const nowhere = cli(root, ["workstream", "report", "write", "031", "notes/N001/plan.md"]);
  ok("red: a file that is no report is refused", nowhere.code === 2 && nowhere.out.includes("notes/<arc>/orders/<row>.report.md"), nowhere.out);

  // A REPORT, AND A BRIEF, WITH NO `cost:` line: the part's cost is measured from the TURN rows of its part (MKT.SCRIPTS.326).
  const telemetry = join(root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  const reply = (id, part, ms) => JSON.stringify({ v: 1, mtype: "TURN", id, at: "2026-10-10T10:00:00Z", ms, event: "SubagentStop", session: "s1", agent: "c1", workstream: basename(ws), arc: "N001", part,
    skill: null, work: "CODE", retryOf: null, model: "claude-sonnet-5-5", tokens: { in: 100, cacheRead: 200, cacheWrite: 300, out: 50 } });
  writeFileSync(join(telemetry, "usage.jsonl"), [reply("a", "3", 90000), reply("b", "3", 30000), reply("b", "3", 30000), reply("c", "9", 600000)].join("\n") + "\n");
  put(ws, "notes/N001/orders/3.report.md", ["---", 'row: "3"', "outcome: landed", "---", "Body.", ""].join("\n"));
  const measured = cli(root, ["workstream", "report", "write", "031", "notes/N001/orders/3.report.md"]);
  const three = json(arcFile).rows.find((row) => row.id === "3");
  ok("the part's cost is measured from the usage rows of its part: tokens summed once for each reply, minutes from the model's time, another part's left out",
    measured.code === 0 && three.cost?.tokens === 1300 && three.cost?.minutes === 2, `${measured.out} ${JSON.stringify(three.cost)}`);
}

console.log("\n=== fact write — one fact, pinned to its source's commit");
{
  const head = git(["rev-parse", "--short=8", "HEAD"]);
  const fact = cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts:1", "--fact", "a is one", "--used-by", "q1"]);
  ok("the line names the id and the pin", fact.code === 0 && fact.out.trim() === `f1 · pinned ${head}`, fact.out);
  const written = lines(join(ws, "arcs", "N001", "facts.jsonl"))[0];
  ok("the record holds the schema's fields", written.id === "f1" && written.commit === head && written.usedBy[0] === "q1" && /^\d{4}-\d{2}-\d{2}T/.test(written.readAt));
  const second = cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts", "--fact", "a is a file"]);
  ok("the next fact takes the next id", second.out.startsWith("f2 · pinned"), second.out);
  const nowhere = cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-nope/a.ts", "--fact", "x"]);
  ok("red: a source in no checkout is refused", nowhere.code === 2 && nowhere.out.includes("finds no checkout `spn-nope`"), nowhere.out);
}

console.log("\n=== suggestion add, state and edit — raised, moved on, reworded");
{
  const raised = cli(root, ["workstream", "suggestion", "add", "031", "keep it as data"]);
  ok("a suggestion is raised with the next number", raised.code === 0 && raised.out.split("\n")[0].trim() === "S1 · raised", raised.out);
  const shaped = cli(root, ["workstream", "suggestion", "state", "031", "s1", "shaped", "--words", "shaped on the preview"]);
  ok("and moved on, with the words beside the move", shaped.code === 0 && shaped.out.trim() === "S1 · shaped", shaped.out);
  const upperS = cli(root, ["workstream", "suggestion", "state", "031", "S1", "parked"]);
  ok("[MKT.SCRIPTS.396] a suggestion is named in either case: S1 moves the suggestion s1 names, and it prints S1", upperS.code === 0 && upperS.out.trim() === "S1 · parked", upperS.out);
  ok("[MKT.SCRIPTS.395] the stored suggestion id stays lowercase", lines(join(ws, "suggestions.jsonl")).some((one) => one.id === "s1" && one.state === "parked"));
  cli(root, ["workstream", "suggestion", "state", "031", "s1", "shaped"]);
  const edited = cli(root, ["workstream", "suggestion", "edit", "031", "s1", "--title", "keep it as rows", "--preview", "notes/N001/preview.html#p1"]);
  ok("its title and preview are changed", edited.code === 0 && edited.out.trim() === "S1 · shaped", edited.out);
  const record = lines(join(ws, "suggestions.jsonl"))[0];
  ok("its record holds the new title, the preview, the state and the words", record.title === "keep it as rows" && record.state === "shaped" && record.preview === "notes/N001/preview.html#p1" && record.words === "shaped on the preview");
  const second = cli(root, ["workstream", "suggestion", "add", "031", "a second one", "--preview", "notes/N001/preview.html#p2"]);
  ok("the next one takes the next number and may carry a preview", second.code === 0 && second.out.trim() === "S2 · raised" && lines(join(ws, "suggestions.jsonl"))[1].preview === "notes/N001/preview.html#p2", second.out);
  const bad = cli(root, ["workstream", "suggestion", "state", "031", "s9", "decided"]);
  ok("red: a suggestion not recorded is refused", bad.code === 2 && bad.out.includes("finds no S9"), bad.out);
  const maybe = cli(root, ["workstream", "suggestion", "state", "031", "s1", "maybe"]);
  ok("red: a state outside the four is refused", maybe.code === 2 && maybe.out.includes("shaped · decided · parked · dropped"), maybe.out);
  const again = cli(root, ["workstream", "suggestion", "state", "031", "s1", "raised"]);
  ok("red: `raised` is no move", again.code === 2 && again.out.includes("suggestion add"), again.out);
  const addState = cli(root, ["workstream", "suggestion", "add", "031", "x", "--state", "shaped"]);
  ok("red: add refuses --state and names state", addState.code === 2 && addState.out.includes("suggestion state"), addState.out);
  const editState = cli(root, ["workstream", "suggestion", "edit", "031", "s1", "--state", "decided"]);
  ok("red: edit refuses --state and names state", editState.code === 2 && editState.out.includes("does not take `--state`") && editState.out.includes("suggestion state"), editState.out);
  const stateTitle = cli(root, ["workstream", "suggestion", "state", "031", "s1", "decided", "--title", "y"]);
  ok("red: state refuses --title and names edit", stateTitle.code === 2 && stateTitle.out.includes("suggestion edit"), stateTitle.out);
  const stillShaped = lines(join(ws, "suggestions.jsonl"))[0];
  ok("the refusals changed nothing", stillShaped.state === "shaped" && stillShaped.title === "keep it as rows");
  const retiredAdd = cli(root, ["workstream", "suggestion", "write", "031", "--title", "t"]);
  ok("red: write is retired and names add", retiredAdd.code === 2 && retiredAdd.out.includes("is retired, and writes nothing") && retiredAdd.out.includes("suggestion add 031 \"t\""), retiredAdd.out);
  const retiredState = cli(root, ["workstream", "suggestion", "write", "031", "s1", "--state", "decided", "--words", "w"]);
  ok("red: write with a state names state", retiredState.code === 2 && retiredState.out.includes("suggestion state 031 s1 decided --words"), retiredState.out);
  const retiredEdit = cli(root, ["workstream", "suggestion", "write", "031", "s1", "--preview", "p"]);
  ok("red: write with a preview names edit", retiredEdit.code === 2 && retiredEdit.out.includes("suggestion edit 031 s1 --preview"), retiredEdit.out);
  ok("write wrote nothing", lines(join(ws, "suggestions.jsonl")).length === 2);
}

console.log("\n=== progress write, and arc stamp write");
{
  const progress = cli(root, ["workstream", "progress", "write", "031"]);
  ok("the progress block is current after every write", progress.code === 0 && progress.out.trim() === "progress current", progress.out);
  ok("it reads the rows done and the arcs", /<span>0 of 2 arcs closed<\/span>/.test(readFileSync(join(ws, "approach.html"), "utf8")));
  const wrong = cli(root, ["workstream", "arc", "stamp", "031/N001"]);
  ok("red: `arc stamp` with no `write` is refused in the chapter's words", wrong.code === 2 && wrong.out.includes("is typed `arc stamp write <arc>`."), wrong.out);
  cli(root, ["workstream", "arc", "edit", "031/N003", "--title", "an unlisted arc", "--subject", "unlisted", "--goal", "the unlisted outcome", "--note", "the developer: open it beside N002"]);
  // The opening write puts the arc's row on the page; this arc is the one whose row was taken off by hand.
  put(ws, "approach.html", readFileSync(join(ws, "approach.html"), "utf8").replace(/\s*<tr id="N003"[^\n]*<\/tr>/, ""));
  const noRow = cli(root, ["workstream", "arc", "stamp", "write", "031/N003"]);
  ok("red: an arc with no Plan row is not stamped, and names `docs cycles write`", noRow.code === 1 && noRow.out.includes("docs cycles write"), noRow.out);
  const stamped = cli(root, ["workstream", "arc", "stamp", "write", "031/N001"]);
  ok("the arc is stamped", stamped.code === 0 && /N001 · stamped [0-9a-f]{12}/.test(stamped.out), stamped.out);
}

console.log("\n=== question — raise, show, answer, withdraw");
{
  const page = join(ws, "approach.html");
  put(root, "card.json", JSON.stringify(CARD));
  put(root, "half.json", JSON.stringify({ ...CARD, views: [] }));
  const half = cli(root, ["workstream", "question", "raise", "031/N001", "--file", "half.json"]);
  ok("red: a card with a part missing is refused", half.code === 2 && half.out.includes("refuses a card with a part missing") && half.out.includes("no `views`"), half.out);
  put(root, "bare.json", JSON.stringify({ ...CARD, what: "The file holds the probe and nothing else." }));
  const bare = cli(root, ["workstream", "question", "raise", "031/N001", "--file", "bare.json"]);
  ok("[MKT.SCRIPTS.383] red: a What that cites no path:line and no fact id is refused, in the rule's words, one example and the plugin's reference",
    bare.code === 2 && bare.out.includes("cites nothing it read") && bare.out.includes("`scripts/commands/workstream/question.ts:68` or `f9`") && bare.out.includes("refs/devex/workspace/docs/decision-cards.md"), bare.out);
  const text = readFileSync(page, "utf8");
  put(ws, "approach.html", text.replace('<h4 id="N001-what">', '<li id="q7">an answer folded earlier</li>\n  <h4 id="N001-what">'));
  const raised = cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
  ok("[MKT.SCRIPTS.383] a What with a path:line is taken, and the number is past every anchor the page carries", raised.code === 0 && raised.out.startsWith("Q8 · open · approach.html Open — Q8"), raised.out);
  ok("the card stands in the approach page's Open, under its heading", /<h2>Open &mdash; Q8<\/h2>/.test(readFileSync(page, "utf8")) && readFileSync(page, "utf8").includes('<h4 id="q8">'));
  const notPreview = cli(root, ["workstream", "question", "show", "031/q8", "--in", "notes/N001/plan.md"]);
  ok("red: a card is shown only on an arc's preview", notPreview.code === 2 && notPreview.out.includes("notes/<arc>/preview.html"), notPreview.out);
  const shown = cli(root, ["workstream", "question", "show", "031/q8", "--in", "notes/N001/preview.html"]);
  const preview = readFileSync(join(ws, "notes", "N001", "preview.html"), "utf8");
  ok("shown on the preview, with the line back to the approach page", shown.code === 0 && preview.includes('<h4 id="q8">') && preview.includes('href="../../approach.html#s4"'), shown.out);
  const upper = cli(root, ["workstream", "question", "show", "031/Q8", "--in", "notes/N001/preview.html"]);
  ok("[MKT.SCRIPTS.396] a question is named in either case: 031/Q8 reads the card 031/q8 reads", upper.code === 0 && upper.out.startsWith("Q8 · shown in"), upper.out);
  ok("[MKT.SCRIPTS.395] the log line a raise writes names the card with a capital, and the stored id stays lowercase",
    lines(join(ws, "arcs", "N001", "log.jsonl")).some((line) => line.kind === "question" && line.note.startsWith("Q8 raised")) && lines(join(ws, "questions.jsonl")).some((one) => one.id === "q8"));
  const key = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "Z", "--words", "Z"]);
  ok("red: an answer naming no option is refused with the options", key.code === 2 && key.out.includes("one of A · B"), key.out);
  cli(root, ["workstream", "suggestion", "add", "031", "x"]);
  put(root, "card2.json", JSON.stringify({ ...CARD, title: "a second question", what: "Today's check is f9." }));
  ok("[MKT.SCRIPTS.383] a What with a fact id is taken", cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card2.json"]).code === 0);
  const withdrawn = cli(root, ["workstream", "question", "withdraw", "031/q9", "--words", "not needed"]);
  ok("a card is withdrawn in your words, off its one page", withdrawn.code === 0 && withdrawn.out.startsWith("Q9 · withdrawn · off 1 page · owed: its Log line"), withdrawn.out);
  const answered = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "A", "--words", "Q8 - A"]);
  ok("a card is answered, and the line says what is owed", answered.code === 0 && answered.out.startsWith("Q8 · answered A · off 2 pages · owed: N001's What, its Log line"), answered.out);
  ok("it leaves both pages, and the preview drops its Open", !readFileSync(page, "utf8").includes('<h4 id="q8">') && !readFileSync(join(ws, "notes", "N001", "preview.html"), "utf8").includes("sds-open"));
  const record = lines(join(ws, "questions.jsonl")).find((one) => one.id === "q8");
  ok("the record holds the answer in your words", record.state === "answered" && record.answer.key === "A" && record.answer.words === "Q8 - A");
  const again = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "A", "--words", "again"]);
  ok("red: a card already answered is not answered again", again.code === 2 && again.out.includes("Q8 is answered"), again.out);
  ok("the arc's log carries the answer", lines(log).some((line) => line.kind === "answered" && /Q8 A · Q8 - A/.test(line.note)));
}

console.log("\n=== arc edit and row state — a status or a row state moved refreshes every view of it (RULE.DEVEX.WORKSPACE.273)");
{
  const views = await dataWorkspace("commands-views");
  const header = (badge) => `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span>${badge}</span></div><h1>Probe</h1></header>\n`;
  const stale = '<span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-decided" href="../../approach.html#N001">DECIDED</a></span>';
  put(views.ws, "notes/N001/preview.html", `${header(stale)}<div class="sds-wrap"><section id="s1"><h2>Overview</h2></section></div>\n`);
  const page = join(views.ws, "approach.html");
  const preview = join(views.ws, "notes", "N001", "preview.html");
  cli(views.root, ["workstream", "row", "state", "031/N001", "1", "landed"]);
  const landed = cli(views.root, ["workstream", "row", "state", "031/N001", "2", "landed"]);
  ok("red before the change: the last step landed names each view it rewrote", landed.code === 0 && /N001 2\/2 · row 2 · state · N001 reads LANDED · approach: (?:[a-z ]+, )*plan · preview badge/.test(landed.out), landed.out);
  ok("[MKT.SCRIPTS.479] `row state … landed` ends its ok line with `<arc> <row> landed`", landed.out.split("\n")[0].endsWith("N001 2 landed"), landed.out);
  const text = readFileSync(page, "utf8");
  ok("the Plan table row shows LANDED, worked out from the steps, as its badge", /<tr id="N001"[^>]*>.*sds-status sds-landed">LANDED<\/span><\/td><\/tr>/s.test(text) && !text.includes("sds-decided"), text);
  ok("the status card moves with the arcs", /<div class="sds-eyebrow">(?:(?!<\/div>).)*sds-status sds-implementing">[^<]*IMPLEMENTING/s.test(text), text);
  ok("the preview's badge shows LANDED", readFileSync(preview, "utf8").includes('sds-status sds-landed" href="../../approach.html#N001">LANDED</a>'));
  ok("the data still stores the developer's DECIDED", json(join(views.ws, "arcs", "N001", "state.json")).status === "DECIDED");
  ok("no state check finding follows", !/state check/.test(landed.out), landed.out);
  const moved = cli(views.root, ["workstream", "row", "edit", "031/N001", "1", "--title", "write the whole book"]);
  ok("a step's field moving with the views current writes none and names none", moved.code === 0 && !/approach:|preview badge/.test(moved.out), moved.out);
  const note = cli(views.root, ["workstream", "arc", "edit", "031/N001", "--note", "a line"]);
  ok("a note alone refreshes nothing", note.code === 0 && !/approach:|preview badge/.test(note.out), note.out);
}

console.log("\n=== arc edit --preview — a carried arc's Plan row links where its notes now live (S137)");
{
  const carried = await dataWorkspace("commands-preview");
  const elsewhere = "../032-next/notes/N002/preview.html";
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/preview.html", "<meta charset=\"utf-8\">\n<section id=\"s1\"><h2>Overview</h2></section>\n");
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/samples/table.md", "| a |\n");
  const page = join(carried.ws, "approach.html");
  const wrong = cli(carried.root, ["workstream", "arc", "edit", "031/N001", "--preview", "../032-next/notes/N002/draft.html"]);
  ok("red: a path that does not end in preview.html is refused, and nothing is written",
    wrong.code === 2 && wrong.out.includes("`preview.html`") && json(join(carried.ws, "arcs", "N001", "state.json")).preview === "preview.html", wrong.out);
  const onRow = cli(carried.root, ["workstream", "row", "edit", "031/N001", "1", "--preview", elsewhere]);
  ok("red: `--preview` belongs to the arc, never to a row", onRow.code === 2 && onRow.out.includes("`--preview`"), onRow.out);
  const moved = cli(carried.root, ["workstream", "arc", "edit", "031/N001", "--status", "CARRIED", "--reason", "to 032", "--preview", elsewhere, "--note", "the developer: move N001 to 032"]);
  const data = json(join(carried.ws, "arcs", "N001", "state.json"));
  ok("the path is written onto the arc's data", moved.code === 0 && data.preview === elsewhere && /N001 · status, preview|N001 · preview, status|preview/.test(moved.out), `${moved.out}\n${JSON.stringify(data.preview)}`);
  const cyclesRow = (/<tr id="N001"[^>]*>.*?<\/tr>/s.exec(readFileSync(page, "utf8")) ?? [""])[0];
  ok("the Plan row links the preview and the sample where the notes now live, and not the empty folder",
    cyclesRow.includes(`href="${elsewhere}"`) && cyclesRow.includes('href="../032-next/notes/N002/samples/table.md"') && !cyclesRow.includes('href="notes/N001/preview.html"'), cyclesRow);
  ok("no state check finding asks for a preview at notes/N001/", !/has no preview/.test(moved.out), moved.out);
  const back = cli(carried.root, ["workstream", "arc", "edit", "031/N001", "--preview", "preview.html"]);
  ok("`--preview preview.html` gives the fixed place back, and the row links it again",
    back.code === 0 && json(join(carried.ws, "arcs", "N001", "state.json")).preview === "preview.html"
      && (/<tr id="N001"[^>]*>.*?<\/tr>/s.exec(readFileSync(page, "utf8")) ?? [""])[0].includes('href="notes/N001/preview.html"'), `${back.out}\n${readFileSync(page, "utf8")}`);
}

console.log("\n=== state show and state check");
{
  const show = cli(root, ["workstream", "state", "show", "031"]);
  ok("show: one line, the arcs, the cards and the suggestions", show.code === 0 && /^031 · N001 \d+\/\d+ · .*N002 proposed · N003 proposed · 0 open cards · 2 suggestions raised/.test(show.out.trim()), show.out);
  const asData = JSON.parse(cli(root, ["workstream", "state", "show", "031", "--json"]).out);
  ok("show --json: the same, as data", asData[0].workstream === "031-probe" && asData[0].arcs.length === 3);
  const check = cli(root, ["workstream", "state", "check", "031"]);
  ok("check: N003 has no Plan row, and the check says so", check.code === 1 && /N003 \[stamp\] N003 has no row in Plan/.test(check.out), check.out);
  const legacy = workspace("commands-legacy", { ".spndevex/workstreams/open/026-old/arcs/N001-old.md": "# N001 — old\n\nStatus: **RUNNING**\n" });
  const old = cli(legacy, ["workstream", "state", "show"]);
  ok("show: a workstream not moved yet says so", old.out.trim() === "026 · keeps its arcs as Markdown — not moved to the data layout yet", old.out);
}

console.log("\n=== row state — RUNNING and LANDED are worked out from the steps (RULE.DEVEX.WORKSPACE.307)");
{
  const followed = await dataWorkspace("commands-follows");
  const file = join(followed.ws, "arcs", "N001", "state.json");
  const trail = join(followed.ws, "arcs", "N001", "log.jsonl");
  const before = lines(trail).length;
  const first = cli(followed.root, ["workstream", "row", "state", "031/N001", "1", "running"]);
  ok("a step started on a decided arc reads RUNNING, and the data keeps the developer's DECIDED", first.code === 0 && json(file).status === "DECIDED" && first.out.includes("N001 reads RUNNING"), first.out);
  ok("the log gains the step's line and no status line", lines(trail).slice(before).every((line) => line.kind !== "status"), JSON.stringify(lines(trail).slice(before)));
  cli(followed.root, ["workstream", "row", "state", "031/N001", "1", "landed"]);
  const last = cli(followed.root, ["workstream", "row", "state", "031/N001", "2", "landed"]);
  ok("the last step landed reads LANDED, and asks for no write", last.out.includes("N001 reads LANDED") && !last.out.includes("--status LANDED") && json(file).status === "DECIDED", last.out);
  const reopened = cli(followed.root, ["workstream", "row", "add", "031/N001", "one more thing", "--kind", "fix", "--repo", "spn-x", "--work", "CODE"]);
  ok("red: a step is never added to a landed arc: its fix goes on the review-fixes arc", reopened.code === 2 && reopened.out.includes("a landed arc is never reopened") && !json(file).rows.some((row) => row.id === "3"), reopened.out);
  const stored = cli(followed.root, ["workstream", "arc", "edit", "031/N001", "--status", "LANDED", "--note", "the developer: done"]);
  ok("red: LANDED is stored only on the review-fixes arc", stored.code === 2 && stored.out.includes("only the review-fixes arc stores it"), stored.out);

  const ready = await dataWorkspace("commands-follows-ready");
  const readyFile = join(ready.ws, "arcs", "N001", "state.json");
  cli(ready.root, ["workstream", "row", "state", "031/N001", "1", "ready"]);
  ok("a step written ready leaves a decided arc reading DECIDED", json(readyFile).status === "DECIDED" && !lines(join(ready.ws, "arcs", "N001", "log.jsonl")).some((line) => line.kind === "status"));
}

console.log("\n=== row add and row state — steps may be written before the go, and none starts until DECIDED with no wait (RULE.DEVEX.WORKSPACE.278, .311)");
{
  const plan = await dataWorkspace("commands-plan");
  const write = (...words) => cli(plan.root, ["workstream", "arc", "edit", ...words]);
  const row = (action, ...words) => cli(plan.root, ["workstream", "row", action, ...words]);
  const second = join(plan.ws, "arcs", "N002", "state.json");
  const secondLog = join(plan.ws, "arcs", "N002", "log.jsonl");
  write("031/N002", "--title", "the second arc", "--subject", "second", "--goal", "the second outcome");
  const given = row("add", "031/N002", "build the bar", "--kind", "change", "--repo", "spn-x", "--work", "CODE", "--state", "waiting");
  ok("a step written on a PROPOSED arc keeps the kind typed, a build step", given.code === 0 && json(second).rows[0].kind === "change", given.out);
  const bare = row("add", "031/N002", "draw the preview", "--work", "CODE");
  ok("red: a step needs its repo", bare.code === 2 && bare.out.includes("`--repo` is missing"), bare.out);
  const design = row("add", "031/N002", "read the code", "--kind", "design", "--repo", "spn-x", "--work", "CODE");
  ok("red: the kind design no longer exists: reading is a planning job", design.code === 2 && design.out.includes("fix · change · question"), design.out);
  const early = row("state", "031/N002", "1", "running");
  ok("red: a step written running on a PROPOSED arc is refused, and its state stays",
    early.code === 2 && early.out.includes("a step starts only after the developer's go") && json(second).rows[0].state === "waiting", early.out);
  const noWords = write("031/N002", "--status", "DECIDED");
  ok("red: the go without the developer's words is refused, and the arc stays PROPOSED",
    noWords.code === 2 && noWords.out.includes("moves only with them in the same write") && json(second).status === "PROPOSED", noWords.out);
  put(plan.ws, "notes/N002/preview.html", [
    '<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-proposed" href="../../approach.html#N002">PROPOSED</a></span></span></div></header>',
    '<section id="s3"><h2>Proposed</h2>', "<p>The bar, as proposed.</p>", "<p>Nothing else.</p>", "</section>"].join("\n"));
  rmSync(join(plan.ws, "arcs", "N002", "sheet.json"), { force: true }); // the steps here are by hand, so this arc keeps no sheet
  const go = write("031/N002", "--status", "DECIDED", "--wait", "the developer: approved, but wait", "--note", "the developer: approved, but wait");
  const status = lines(secondLog).filter((line) => line.kind === "status").at(-1);
  ok("the go with a wait stores DECIDED and the wait, its status line leading with the move and the words beside it",
    go.code === 0 && status?.note === "PROPOSED → DECIDED · the developer: approved, but wait" && json(second).status === "DECIDED" && json(second).wait === "the developer: approved, but wait", `${go.out}${JSON.stringify(status)}`);
  ok("the go lists each line of the preview that still says proposed, by its number, and not the masthead's badge or the Proposed heading",
    go.out.includes("the preview still says proposed in 1 line(s)") && go.out.includes("notes/N002/preview.html:3  The bar, as proposed.")
      && !go.out.includes("preview.html:1 ") && !go.out.includes("preview.html:2 "), go.out);
  const waited = row("state", "031/N002", "1", "running");
  ok("red: no step starts while the wait holds, and the refusal quotes it", waited.code === 2 && waited.out.includes("holds the developer's wait, \"the developer: approved, but wait\""), waited.out);
  const silentStart = write("031/N002", "--start");
  ok("red: a start needs the developer's words", silentStart.code === 2 && silentStart.out.includes("a wait and a start are the developer's words"), silentStart.out);
  const start = write("031/N002", "--start", "--note", "the developer: start N002");
  ok("a start clears the wait, with its words on one status line", start.code === 0 && !json(second).wait && lines(secondLog).at(-1).note === "DECIDED · started · the developer: start N002", `${start.out}${JSON.stringify(lines(secondLog).at(-1))}`);
  const run = row("state", "031/N002", "1", "running");
  ok("then the step starts, and the arc reads RUNNING", run.code === 0 && run.out.includes("N002 reads RUNNING"), run.out);
  const back = write("031/N002", "--status", "PROPOSED", "--note", "the developer: the goal moved, rethink N002");
  ok("a stored PROPOSED wins over the steps: the running step stops until the next go",
    back.code === 0 && json(second).rows[0].state === "stopped" && back.out.includes("stopped until the next go: 1 step(s)"), back.out);
  const dropped = write("031/N002", "--status", "DROPPED", "--reason", "not wanted", "--note", "the developer: drop it");
  ok("an arc decided before is dropped, with its reason", dropped.code === 0 && json(second).status === "DROPPED", dropped.out);
}

console.log("\n=== arc edit and arc delete — several arcs PROPOSED at once; one never decided is deleted (RULE.DEVEX.WORKSPACE.280, .311)");
{
  const many = await dataWorkspace("commands-many");
  const write = (...words) => cli(many.root, ["workstream", "arc", "edit", ...words]);
  write("031/N002", "--title", "the second arc", "--subject", "second", "--goal", "the second outcome");
  const third = write("031/N003", "--title", "the third arc", "--subject", "third", "--goal", "the third outcome");
  ok("a second arc opens while one is PROPOSED, with no words needed", third.code === 0 && json(join(many.ws, "arcs", "N003", "state.json")).status === "PROPOSED", third.out);
  const dropNew = write("031/N003", "--status", "DROPPED", "--reason", "x", "--note", "the developer: drop N003");
  ok("red: an arc never decided is not dropped: it is deleted", dropNew.code === 2 && dropNew.out.includes("`workstream arc delete N003"), dropNew.out);
  const silent = cli(many.root, ["workstream", "arc", "delete", "031/N003"]);
  ok("red: a delete needs the developer's words", silent.code === 2 && silent.out.includes("--note"), silent.out);
  const gone = cli(many.root, ["workstream", "arc", "delete", "031/N003", "--note", "the developer: drop N003"]);
  ok("arc delete takes out both folders of an arc never decided", gone.code === 0 && !existsSync(join(many.ws, "arcs", "N003")) && !existsSync(join(many.ws, "notes", "N003")), gone.out);
  const kept = cli(many.root, ["workstream", "arc", "delete", "031/N001", "--note", "the developer: drop N001"]);
  ok("red: an arc decided is never deleted: it is dropped", kept.code === 2 && kept.out.includes("dropped, never deleted") && existsSync(join(many.ws, "arcs", "N001")), kept.out);
}

console.log("\n=== arc edit --review-fixes — one arc takes every fix to a landed arc, and lands on the developer's word (RULE.DEVEX.WORKSPACE.261)");
{
  const fixes = await dataWorkspace("commands-review-fixes");
  const write = (...words) => cli(fixes.root, ["workstream", "arc", "edit", ...words]);
  const file = join(fixes.ws, "arcs", "N002", "state.json");
  const silent = write("031/N002", "--title", "review fixes", "--subject", "review-fixes", "--goal", "every fix to a landed arc", "--review-fixes");
  ok("red: the review-fixes arc opens on the developer's words", silent.code === 2 && silent.out.includes("on the developer's words"), silent.out);
  const opened = write("031/N002", "--title", "review fixes", "--subject", "review-fixes", "--goal", "every fix to a landed arc", "--review-fixes", "--note", "the developer: fix the footer's gap");
  ok("it opens DECIDED on those words, marked as the review-fixes arc", opened.code === 0 && json(file).status === "DECIDED" && json(file).reviewFixes === true, opened.out);
  cli(fixes.root, ["workstream", "row", "add", "031/N002", "N001: the footer's gap", "--kind", "fix", "--repo", "spn-x", "--work", "DOCS", "--state", "waiting"]);
  const fixed = cli(fixes.root, ["workstream", "row", "state", "031/N002", "1", "landed"]);
  ok("its steps all landed, it still reads RUNNING until the close", fixed.code === 0 && fixed.out.includes("N002 reads RUNNING"), fixed.out);
  const second = write("031/N003", "--title", "more fixes", "--subject", "more-fixes", "--goal", "more fixes", "--review-fixes", "--note", "the developer: fix it");
  ok("red: a workstream keeps one review-fixes arc", second.code === 2 && second.out.includes("keeps one review-fixes arc: N002"), second.out);
  const closed = write("031/N002", "--status", "LANDED", "--note", "the developer: close it");
  ok("the developer's word to close stores its LANDED", closed.code === 0 && json(file).status === "LANDED", closed.out);
}

console.log("\n=== arc edit — an arc opens whole: its data, its preview, its What entry and its stamped Plan row (RULE.DEVEX.WORKSPACE.254)");
{
  const whole = await dataWorkspace("commands-opening");
  const page = join(whole.ws, "approach.html");
  const domains = readFileSync(page, "utf8")
    .replace('  <h4 id="N001-what">The probe</h4>', '  <h3 id="d1">Platform &middot; Data and trust</h3>\n  <h4 id="N001-what">The probe</h4>')
    .replace('</section>\n<section id="s3"', '  <h3 id="d2">Second domain</h3>\n  <h4 id="c5">A subject heading</h4>\n  <p>its words</p>\n</section>\n<section id="s3"');
  writeFileSync(page, domains);
  const write = (...words) => cli(whole.root, ["workstream", "arc", "edit", ...words]);
  const goal = "Each control's evidence leaves as one file an auditor can read, named for the control.";
  const arcOf = (id) => join(whole.ws, "arcs", id);
  const noteOf = (id) => join(whole.ws, "notes", id, "preview.html");

  const noGoal = write("031/N002", "--title", "Evidence export", "--subject", "evidence-export", "--under", "d1");
  ok("red: an opening without --goal is refused in the chapter's words, exit 2", noGoal.code === 2
    && noGoal.out.includes("opens N002 with `--title`, `--subject` and `--goal`: an arc opens only when all three are known, and until then its line stays in How (RULE.DEVEX.WORKSPACE.254)."), noGoal.out);
  ok("red: and nothing is written: no data, no preview, the page as it was", !existsSync(arcOf("N002")) && !existsSync(noteOf("N002")) && readFileSync(page, "utf8") === domains);

  const unknown = write("031/N002", "--title", "Evidence export", "--subject", "evidence-export", "--goal", goal, "--under", "d9");
  ok("red: an --under id What does not hold is refused, naming it", unknown.code === 2 && unknown.out.includes("finds no domain or subject heading `d9`"), unknown.out);
  ok("red: and nothing is written", !existsSync(arcOf("N002")) && !existsSync(noteOf("N002")) && readFileSync(page, "utf8") === domains);

  const opened = write("031/N002", "--title", "Evidence export", "--subject", "evidence-export", "--goal", goal, "--under", "d1");
  ok("the line names the four pieces", opened.code === 0 && opened.out.startsWith("ok · N002 0/0 · N002 opened · PROPOSED · preview · What entry · Plan row\n"), opened.out);
  ok("and each piece's place, as drawn", opened.out.includes("  arcs/N002/state.json       written, with its log line and its name file, evidence-export.md\n")
    && opened.out.includes("  notes/N002/preview.html    written from the template: the masthead, the PROPOSED badge, the back link to #N002-what, four sections to fill\n")
    && opened.out.includes("  approach.html · What       #N002-what written under d1, Platform · Data and trust: the title, the goal, and the link to notes/N002/preview.html\n")
    && opened.out.includes("  approach.html · Plan       row N002 written and stamped, its preview linked\n"), opened.out);
  ok("the data holds the goal, PROPOSED, and the fixed preview", json(join(arcOf("N002"), "state.json")).goal === goal && json(join(arcOf("N002"), "state.json")).status === "PROPOSED");
  const preview = readFileSync(noteOf("N002"), "utf8");
  ok("the preview is the template with its masthead filled: title, back link, title, arc, badge",
    preview.includes("<title>031 · N002 - Evidence Export</title>") && preview.includes('href="../../approach.html#N002-what">&larr; 031 - Probe</a>')
      && preview.includes("<h1>Evidence export</h1>") && preview.includes('href="../../approach.html#N002">N002</a>') && preview.includes("sds-status sds-proposed")
      && !preview.includes("{{NNN}}") && !preview.includes("{{nnn}}") && !preview.includes("{{THE PREVIEW NAME}}") && !preview.includes("RESTATES"), preview.slice(0, 1500));
  ok("the subtitle and the description stay slots for the agent", preview.includes("{{THE SUBTITLE") && preview.includes("{{THE DESCRIPTION"));
  const after = readFileSync(page, "utf8");
  const entry = '  <h4 id="N002-what">Evidence export</h4>\n  <p>Each control\'s evidence leaves as one file an auditor can read, named for the control.</p>\n  <p>Read the preview &rarr; <a href="notes/N002/preview.html">Evidence export</a></p>\n  <h3 id="d2">';
  ok("the What entry stands at the end of d1's part, before d2, with the title, the goal and the link", after.includes(entry), after);
  ok("the Plan row is there, stamped", /<tr id="N002" data-arc="arcs\/N002\/state.json" data-arc-stamp="[0-9a-f]{12}">/.test(after) && after.includes('href="notes/N002/preview.html"'));
  const check = cli(whole.root, ["workstream", "state", "check", "031"]);
  ok("the workstream passes its own check at once", check.code === 0 && /whole/.test(check.out), check.out);

  const atEnd = write("031/N003", "--title", "Second export", "--subject", "second-export", "--goal", "A second outcome.");
  const endPage = readFileSync(page, "utf8");
  ok("with no --under the entry is written at the end of What", atEnd.code === 0 && atEnd.out.includes("#N003-what written at the end of What") && /<p>its words<\/p>\n  <h4 id="N003-what">Second export<\/h4>\n[^]*<\/section>\n<section id="s3"/.test(endPage), atEnd.out);

  // A bare write repairs what is missing, and changes nothing that is there.
  writeFileSync(noteOf("N002"), "<meta charset=\"utf-8\">\n<p>edited by the agent</p>\n");
  const kept = write("031/N002");
  ok("a bare write on a whole arc writes nothing", kept.code === 0 && kept.out.startsWith("ok · N002 · whole: nothing written"), kept.out);
  ok("a preview that is there is kept as the agent left it", readFileSync(noteOf("N002"), "utf8") === "<meta charset=\"utf-8\">\n<p>edited by the agent</p>\n");
  const bytes = readFileSync(page, "utf8");
  rmSync(noteOf("N003"));
  const filled = write("031/N003");
  ok("a bare write fills the preview it finds missing and keeps the entry and the row", filled.code === 0 && filled.out.startsWith("ok · N003 · preview written from the template · What entry kept · Plan row kept"), filled.out);
  ok("the fresh preview is the template again, and the page is as it was", readFileSync(noteOf("N003"), "utf8").includes("<title>031 · N003 - Second Export</title>") && readFileSync(page, "utf8") === bytes);
  const twice = write("031/N003");
  ok("and a second bare write finds it whole", twice.out.startsWith("ok · N003 · whole: nothing written") && readFileSync(page, "utf8") === bytes, twice.out);

  writeFileSync(page, bytes.replace(/\s*<h4 id="N003-what">[^]*?<\/p>\n  <p>Read the preview[^\n]*N003[^\n]*<\/p>/, "").replace(/\s*<tr id="N003"[^\n]*<\/tr>/, ""));
  const both = write("031/N003");
  ok("a bare write writes the entry and the row it finds missing, and keeps the preview",
    both.code === 0 && both.out.includes("What entry: #N003-what written at the end of What") && both.out.includes("Plan row written and stamped") && both.out.includes("preview kept"), both.out);
  ok("and the workstream passes its check again", cli(whole.root, ["workstream", "state", "check", "031"]).code === 0);

  // An existing arc takes the anchor on a subject heading.
  writeFileSync(page, readFileSync(page, "utf8").replace('<h4 id="N001-what">The probe</h4>', '<h4 id="c1">The probe</h4>'));
  const anchored = write("031/N001", "--under", "c1");
  ok("--under on a subject heading anchors an arc that already exists", anchored.code === 0
    && anchored.out.startsWith("ok · N001 · What entry: #N001-what anchored on c1 · preview kept · Plan row kept"), anchored.out);
  ok("the anchor is a span on the heading, and the heading is as it was", readFileSync(page, "utf8").includes('<h4 id="c1"><span id="N001-what"></span>The probe</h4>'));
  ok("and the workstream passes its check", cli(whole.root, ["workstream", "state", "check", "031"]).code === 0);
  const noHeading = write("031/N001", "--under", "zz");
  ok("red: an anchor on a heading What does not hold is refused", noHeading.code === 2 && noHeading.out.includes("finds no domain or subject heading `zz`"), noHeading.out);
  const onRow = cli(whole.root, ["workstream", "row", "edit", "031/N001", "1", "--under", "c1"]);
  ok("red: --under belongs to the arc, never to a row", onRow.code === 2 && onRow.out.includes("`--under`"), onRow.out);

  // A carried arc keeps its preview where its preview field names it, and its entry links it there.
  const carried = await dataWorkspace("commands-opening-carried");
  const elsewhere = "../032-next/notes/N002/preview.html";
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/preview.html", "<meta charset=\"utf-8\">\n<section id=\"s1\"><h2>Overview</h2></section>\n");
  const moved = cli(carried.root, ["workstream", "arc", "edit", "031/N001", "--status", "CARRIED", "--reason", "to 032", "--preview", elsewhere, "--note", "the developer: move N001 to 032"]);
  ok("a carried arc's What entry follows the preview to where its field names it", moved.code === 0
    && readFileSync(join(carried.ws, "approach.html"), "utf8").includes(`<a href="${elsewhere}">the probe</a>`) && !/has no preview|not linked from its What entry/.test(moved.out), moved.out);
  const carriedBare = cli(carried.root, ["workstream", "arc", "edit", "031/N001"]);
  ok("a bare write on it writes no preview at notes/N001/ and says the arc is whole", carriedBare.out.startsWith("ok · N001 · whole: nothing written") && !existsSync(join(carried.ws, "notes", "N001", "preview.html.new")) && readFileSync(join(carried.ws, "notes", "N001", "preview.html"), "utf8").length > 0, carriedBare.out);
  const reopened = cli(carried.root, ["workstream", "state", "check", "031"]);
  ok("and the check finds the carried preview", !/has no preview/.test(reopened.out), reopened.out);
}

console.log("\n=== row discard — a row found invalid leaves the arc, in the developer's words (RULE.DEVEX.WORKSPACE.279)");
{
  const base = { kind: "change", repo: "spn-x", work: "CODE", blockedBy: [], touches: [] };
  const gone = await dataWorkspace("commands-discard", { rows: [
    { ...base, id: "1", parent: "N001", title: "write the book", state: "landed" },
    { ...base, id: "2", parent: "N001", title: "a command nobody needs", state: "deferred" },
    { ...base, id: "3", parent: "N001", title: "waits on four", blockedBy: ["4"], state: "waiting" },
    { ...base, id: "4", parent: "N001", title: "four", state: "ready" },
    { ...base, id: "5", parent: "N001", title: "half done", state: "stopped" },
    { ...base, id: "6", parent: "N001", title: "a parent" },
    { ...base, id: "6a", parent: "6", title: "its only row", state: "waiting" },
  ] });
  const file = join(gone.ws, "arcs", "N001", "state.json");
  const trail = join(gone.ws, "arcs", "N001", "log.jsonl");
  const discard = (...words) => cli(gone.root, ["workstream", "row", "discard", "031/N001", ...words]);

  const bare = discard("2");
  ok("red: a discard with no words is refused, and the row stays", bare.code === 2 && bare.out.includes("`--note` carrying the developer's words") && json(file).rows.some((row) => row.id === "2"), bare.out);
  const done = discard("2", "--note", "the developer: not needed");
  ok("a deferred row is discarded, and the line says so", done.code === 0 && /^ok · N001 1\/5 · row 2 discarded/.test(done.out), done.out);
  ok("it is gone from the arc's data, with no state left behind", !json(file).rows.some((row) => row.id === "2"));
  const line = lines(trail).at(-1);
  ok("its one log line carries the words and the row's What", line.kind === "discarded" && line.row === "2" && line.note === "the developer: not needed · the row read: a command nobody needs", JSON.stringify(line));
  const landed = discard("1", "--note", "x");
  ok("red: a landed row is kept, naming the three states that go", landed.code === 2 && landed.out.includes("it is landed") && landed.out.includes("waiting, ready or deferred"), landed.out);
  const stopped = discard("5", "--note", "x");
  ok("red: a stopped row is kept", stopped.code === 2 && stopped.out.includes("it is stopped"), stopped.out);
  const awaited = discard("4", "--note", "x");
  ok("red: a row another row waits on is kept, naming it", awaited.code === 2 && awaited.out.includes("rows 3 wait on it"), awaited.out);
  const parent = discard("6", "--note", "x");
  ok("red: a row with rows under it is kept, naming them", parent.code === 2 && parent.out.includes("rows 6a sit under it"), parent.out);
  const only = discard("6a", "--note", "not needed");
  ok("the last row under a parent goes, and the parent keeps the state it showed", only.code === 0 && json(file).rows.find((row) => row.id === "6").state === "waiting", only.out);
  const missing = discard("9", "--note", "x");
  ok("red: a row the arc lacks is refused", missing.code === 2 && missing.out.includes("finds no row 9"), missing.out);
  const check = cli(gone.root, ["workstream", "state", "check", "031"]);
  ok("the arc's data still holds to the schema", !/\[data\]/.test(check.out), check.out);
}

console.log("\n=== the change sheet — the opening write, and a row's entries");
{
  const opened = cli(root, ["workstream", "arc", "edit", "031/N004", "--title", "the sheet arc", "--subject", "sheeted", "--goal", "the sheet is kept"]);
  const sheetFile = join(ws, "arcs", "N004", "sheet.json");
  ok("the opening write writes the empty sheet beside state.json", opened.code === 0 && existsSync(sheetFile) &&
    JSON.stringify(json(sheetFile)) === JSON.stringify({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: null, entries: [] }), opened.out);
  const added = cli(root, ["workstream", "row", "add", "031/N004", "build it", "--repo", "spn-x", "--work", "CODE", "--entries", "E1,E2"]);
  ok("`row add --entries` names the entries on the row", added.code === 0 && json(join(ws, "arcs", "N004", "state.json")).rows[0].entries.join() === "E1,E2", added.out);
  const edited = cli(root, ["workstream", "row", "edit", "031/N004", "1", "--entries", "E3"]);
  ok("`row edit --entries` changes them", edited.code === 0 && /entries/.test(edited.out) && json(join(ws, "arcs", "N004", "state.json")).rows[0].entries.join() === "E3", edited.out);
  const bad = cli(root, ["workstream", "row", "edit", "031/N004", "1", "--entries", "X1"]);
  ok("red: a name that is no entry id is refused", bad.code !== 0 && json(join(ws, "arcs", "N004", "state.json")).rows[0].entries.join() === "E3", bad.out);
  const arcSide = cli(root, ["workstream", "arc", "edit", "031/N004", "--entries", "E1"]);
  ok("red: `arc edit` refuses `--entries`, a row's field", arcSide.code !== 0 && arcSide.out.includes("row edit"), arcSide.out);
}

console.log("\n=== landing on a run — a sheet arc holds the agent to the sheet");
{
  const row = (id, work, over = {}) => ({ id, parent: "N001", title: `row ${id}`, kind: "change", repo: "spn-x", work, blockedBy: [], touches: [], state: "ready", ...over });
  const entry = (id, tiers) => ({ id, op: "edit", file: "spn-x:a.ts", what: `change ${id}`, decidedBy: [], facts: ["f1"], then: [], rules: [], callers: [], tiers, docs: [], book: [] });
  const sheetWith = (entries) => ({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: { folder: "x", dmo: "none", reset: "x" }, entries });
  const later = new Date(Date.now() + 3600e3).toISOString();
  const runFile = (base, tier, results, { name = "r1", ranAt = later } = {}) => put(base, `pkg/tests/.output/${tier}/runs/${name}.json`,
    JSON.stringify({ run: name, tier, ranAt, env: "local", results: results.map(([id, status]) => ({ id, tier, status, title: id })) }));
  const hold = await dataWorkspace("hold", { rows: [row("1", "DOCS", { state: "ready" }), row("2", "CODE", { entries: ["E1"] }), row("3", "PROOF"), row("4", "CODE", { entries: ["E2"] })] });
  const arcPath = join(hold.ws, "arcs", "N001", "state.json");
  const sha = hold.git(["rev-parse", "HEAD"]);
  const setRow = (id, fields) => { const data = json(arcPath); Object.assign(data.rows.find((one) => one.id === id), fields); writeFileSync(arcPath, JSON.stringify(data, null, 2)); };
  setRow("2", { commits: { "spn-x": [sha] } });
  setRow("3", { commits: { "spn-x": [sha] } });
  writeFileSync(join(hold.ws, "arcs", "N001", "sheet.json"), JSON.stringify(sheetWith([entry("E1", { unit: ["U.1", "U.2"], contract: ["C.1"] }), entry("E2", {})]), null, 2));
  const land = (rowId, ...more) => cli(hold.root, ["workstream", "row", "state", "031/N001", rowId, "landed", ...more]);
  const stateOf = (rowId) => json(arcPath).rows.find((one) => one.id === rowId).state;
  const unitDir = hold.root + "/spn-x";

  const bare = land("2");
  ok("a code row is refused without --run, naming it", bare.code === 1 && bare.out.includes("--run") && bare.out.startsWith("Refused: row 2 is a CODE row of an arc that keeps a sheet") && stateOf("2") === "ready", bare.out);
  const nowhere = land("2", "--run", "r1");
  ok("a run found nowhere is refused, naming where it looked", nowhere.code === 1 && nowhere.out.includes("spn-x") && nowhere.out.includes("r1"), nowhere.out);
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "FAILED"]]);
  runFile(unitDir, "contract", [["C.1", "SUCCESS"]]);
  const failing = land("2", "--run", "r1");
  ok("a FAILURE is refused, naming the id and the run", failing.code === 1 && failing.out.includes("unit U.2 reads FAILURE in r1") && stateOf("2") === "ready", failing.out);
  runFile(unitDir, "unit", [["U.1", "SUCCESS"]]);
  const missing = land("2", "--run", "r1");
  ok("an id missing from the run is refused", missing.code === 1 && missing.out.includes("U.2 is not in the run"), missing.out);
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]]);
  runFile(unitDir, "contract", [["C.9", "SUCCESS"]]);
  runFile(unitDir, "integration", [["C.1", "SUCCESS"]]);
  const other = land("2", "--run", "r1");
  ok("an id green only at another tier is refused", other.code === 1 && other.out.includes("contract C.1") && other.out.includes("integration"), other.out);
  runFile(unitDir, "contract", [["C.1", "SUCCESS"]]);
  rmSync(join(unitDir, "pkg/tests/.output/integration"), { recursive: true });
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]], { ranAt: "2020-01-01T00:00:00Z" });
  const old = land("2", "--run", "r1");
  ok("a run older than the row's last commit is refused", old.code === 1 && old.out.includes(`r1 was taken before ${sha.slice(0, 8)}, row 2's last commit`), old.out);
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]]);
  // a copy of the run in a worktree of the workstream's set is a second place
  const twin = join(hold.root, ".worktrees", "031-probe", "spn-x-n1");
  runFile(twin, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]]);
  const two = land("2", "--run", "r1");
  ok("a run found in two places is refused, naming both", two.code === 1 && two.out.includes("spn-x-n1") && two.out.includes("two places"), two.out);
  rmSync(join(hold.root, ".worktrees"), { recursive: true });
  const green = land("2", "--run", "r1");
  ok("a code row lands when every id reads SUCCESS at its tier", green.code === 0 && stateOf("2") === "landed", green.out);
  ok("the log line names the run", lines(join(hold.ws, "arcs", "N001", "log.jsonl")).at(-1).note.includes("run r1"));

  const noCommit = (() => { setRow("4", { entries: ["E1"] }); return land("4", "--run", "r1"); })();
  ok("a row with no commit is refused, naming `report write`", noCommit.code === 1 && noCommit.out.includes("report write"), noCommit.out);
  setRow("4", { entries: ["E2"], commits: { "spn-x": [sha] } });
  const noTest = land("4", "--run", "r1");
  ok("a code row whose entries name no test is refused, naming `sheet check`", noTest.code === 1 && noTest.out.includes("sheet check"), noTest.out);

  // a proof row owes a whole run of each tier the entries name for its repository
  runFile(unitDir, "contract", [["C.1", "SUCCESS"]], { name: "r2" });
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]], { name: "r2" });
  rmSync(join(unitDir, "pkg/tests/.output/contract/runs/r2.json"));
  const partial = land("3", "--run", "r2");
  ok("a proof row is refused without a run of each owed tier", partial.code === 1 && partial.out.includes("C.1 is not in the run"), partial.out);
  runFile(unitDir, "contract", [["C.1", "SUCCESS"], ["C.7", "FAILED"]], { name: "r2" });
  const stray = land("3", "--run", "r2");
  ok("a proof row is refused where any result of a tier reads FAILED", stray.code === 1 && stray.out.includes("contract C.7 reads FAILURE"), stray.out);
  runFile(unitDir, "contract", [["C.1", "SUCCESS"]], { name: "r2" });
  const whole = land("3", "--run", "r2");
  ok("a proof row lands on a whole run", whole.code === 0 && stateOf("3") === "landed", whole.out);

  // a proof row with no commits of its own, and the proof of an arc that changes no repository
  const addRow = (fields) => { const data = json(arcPath); data.rows.push(row(fields.id, "PROOF", fields)); writeFileSync(arcPath, JSON.stringify(data, null, 2)); };
  addRow({ id: "5" });
  runFile(unitDir, "unit", [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]], { name: "r3", ranAt: "2020-01-01T00:00:00Z" });
  runFile(unitDir, "contract", [["C.1", "SUCCESS"]], { name: "r3", ranAt: "2020-01-01T00:00:00Z" });
  const before = land("5", "--run", "r3");
  ok("[MKT.SCRIPTS.323] a proof row with no commits is refused on a run taken before its arc's last commit", before.code === 1 && before.out.includes("r3 was taken before") && stateOf("5") === "ready", before.out);
  const ownless = land("5", "--run", "r2");
  ok("[MKT.SCRIPTS.323] a proof row with no commits lands on a run taken after its arc's commits", ownless.code === 0 && stateOf("5") === "landed", ownless.out);
  addRow({ id: "6", repo: "none" });
  const work = join(hold.ws, "notes", "N001", "work");
  const noWork = land("6", "--run", "m1");
  ok("[MKT.SCRIPTS.323] the proof of an arc with no repository is refused without its run in the work folder", noWork.code === 1 && noWork.out.includes("work") && stateOf("6") === "ready", noWork.out);
  runFile(work, "unit", [["M.1", "SUCCESS"]], { name: "m1" });
  const onWork = land("6", "--run", "m1");
  ok("[MKT.SCRIPTS.323] it lands on the run its check recorded in the work folder", onWork.code === 0 && stateOf("6") === "landed", onWork.out);

  const docs = land("1");
  ok("a docs row lands as today", docs.code === 0 && stateOf("1") === "landed", docs.out);

  // report write
  setRow("4", { entries: ["E1"], commits: { "spn-x": [] }, state: "ready" });
  put(hold.ws, "notes/N001/orders/4.report.md", ["---", 'row: "4"', "outcome: landed", `commits: { spn-x: [${sha}] }`, "---", "Body.", ""].join("\n"));
  const noRun = cli(hold.root, ["workstream", "report", "write", "031", "notes/N001/orders/4.report.md"]);
  ok("a landed report without `run:` is refused and writes nothing", noRun.code === 1 && noRun.out.includes("Nothing was written") && stateOf("4") === "ready", noRun.out);
  put(hold.ws, "notes/N001/orders/4.report.md", ["---", 'row: "4"', "outcome: landed", "run: r1", `commits: { spn-x: [${sha}] }`, "---", "Body.", ""].join("\n"));
  const withRun = cli(hold.root, ["workstream", "report", "write", "031", "notes/N001/orders/4.report.md"]);
  ok("a landed report with a good `run:` lands the row", withRun.code === 0 && stateOf("4") === "landed", withRun.out);
}

console.log("\n=== a proof row lands on a full run of the same tree; on a moved tree the refusal names only the entries whose files changed");
{
  const proof = (id, title) => ({ id, parent: "N001", title, kind: "change", repo: "spn-x", work: "PROOF", blockedBy: [], touches: [], state: "ready" });
  const full = await dataWorkspace("full-run", { rows: [proof("1", "proof after a readme change"), proof("2", "proof after a.ts moved")] });
  const arcPath = join(full.ws, "arcs", "N001", "state.json");
  // Each commit is dated by hand, so the run's ranAt falls between them: A 01-01, the run 01-02, C 01-03, B 01-04.
  const commit = (day, message, files) => {
    for (const [path, body] of Object.entries(files)) put(full.repo, path, body);
    full.git(["add", ...Object.keys(files)]);
    const when = `2026-01-0${day}T12:00:00Z`;
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", message], { cwd: full.repo, stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, GIT_COMMITTER_DATE: when, GIT_AUTHOR_DATE: when } });
    return full.git(["rev-parse", "HEAD"]);
  };
  const first = commit(1, "A: the package", { "pkg/a.ts": "export const a = 1;\n", "pkg/b.ts": "export const b = 1;\n" });
  const readme = commit(3, "C: a readme only", { "README.md": "read me\n" });
  const moved = commit(4, "B: a.ts changes", { "pkg/a.ts": "export const a = 2;\n" });
  // The stamp a full run leaves: the hash of the node's content at the commit it ran on (the push-tiers content hash).
  const contentAt = (sha) => {
    const tree = full.git(["ls-tree", "-r", sha, "--", "pkg"]).split("\n").filter(Boolean).map((line) => { const tab = line.indexOf("\t"); return [line.slice(tab + 1).slice("pkg/".length), line.slice(0, tab).split(" ")[2]]; });
    return createHash("sha256").update(tree.sort((left, right) => (left[0] < right[0] ? -1 : 1)).map(([path, id]) => `${path}\t${id}\n`).join("")).digest("hex");
  };
  const results = [["U.1", "SUCCESS"], ["U.2", "SUCCESS"]].map(([id, status]) => ({ id, tier: "unit", status, title: id }));
  put(full.repo, "pkg/tests/.output/unit/runs/r2.json", JSON.stringify({ run: "r2", tier: "unit", ranAt: "2026-01-02T12:00:00Z", env: "local", results }));
  put(full.repo, "pkg/tests/.output/unit/runs/r2.stamp.json", JSON.stringify({ narrowed: false, content: contentAt(first) }));
  const entry = (id, file, unit) => ({ id, op: "edit", file, what: `change ${id}`, decidedBy: [], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit }, docs: [], book: [] });
  writeFileSync(join(full.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: { folder: "x", dmo: "none", reset: "x" }, entries: [entry("E1", "spn-x:pkg/a.ts", ["U.1"]), entry("E2", "spn-x:pkg/b.ts", ["U.2"])] }, null, 2));
  const data = json(arcPath);
  data.rows.find((one) => one.id === "1").commits = { "spn-x": [readme] };
  data.rows.find((one) => one.id === "2").commits = { "spn-x": [moved] };
  writeFileSync(arcPath, JSON.stringify(data, null, 2));
  const land = (rowId) => cli(full.root, ["workstream", "row", "state", "031/N001", rowId, "landed", "--run", "r2"]);
  const stateOf = (rowId) => json(arcPath).rows.find((one) => one.id === rowId).state;

  const refused = land("2");
  ok("a proof row whose commit changed a.ts after the full run is refused, naming E1 and the entry to rerun, and not E2",
    refused.code === 1 && refused.out.includes("E1") && refused.out.includes("rerun the tests of that entry") && !refused.out.includes("E2") && stateOf("2") === "ready", refused.out);
  const same = land("1");
  ok("a proof row whose commit left every file of the run's tree alone lands on that full run, though the run is older than the commit", same.code === 0 && stateOf("1") === "landed", same.out);
}

console.log("\n=== a code row of an arc with no sheet is refused with no run");
{
  const plain = await dataArc("nosheet", { rows: [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "CODE", blockedBy: [], touches: [], state: "ready" }] });
  const stateFile = join(plain.ws, "arcs", "N001", "state.json");
  const landed = cli(plain.root, ["workstream", "row", "state", "031/N001", "1", "landed"]);
  ok("[MKT.SCRIPTS.231] a code row lands with no --run: refused, and the row stays", landed.code === 1 && landed.out.includes("--run") && json(stateFile).rows[0].state === "ready", landed.out);
  const docs = await dataArc("nosheet-docs", { rows: [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready" }] });
  const docsLanded = cli(docs.root, ["workstream", "row", "state", "031/N001", "1", "landed"]);
  ok("[MKT.SCRIPTS.231] a docs row of the same kind of arc still lands", docsLanded.code === 0 && json(join(docs.ws, "arcs", "N001", "state.json")).rows[0].state === "landed", docsLanded.out);
}

console.log("\n=== the go is refused while the sheet has a finding");
{
  const rows = [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "waiting" }];
  const going = await dataArc("go", { rows });
  const file = join(going.ws, "arcs", "N001", "state.json");
  const data = json(file); data.status = "PROPOSED"; writeFileSync(file, JSON.stringify(data, null, 2));
  writeFileSync(join(going.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: null, entries: [] }));
  const go = cli(going.root, ["workstream", "arc", "edit", "031/N001", "--status", "DECIDED", "--note", "the developer: go"]);
  ok("[MKT.SCRIPTS.235] the go is refused, names the finding, and the status stays PROPOSED", go.code === 1 && go.out.includes("row 1 names no entry") && go.out.includes("Nothing was written") && json(file).status === "PROPOSED", go.out);
}

console.log("\n=== an arc title is a topic name");
{
  const long = cli(root, ["workstream", "arc", "edit", "031/N001", "--title", "one two three four five six"]);
  ok("[MKT.SCRIPTS.230] a title over five words is refused, and the title stays", long.code === 2 && long.out.includes("at most five words") && json(arcFile).title === "the probe arc", long.out);
  const comma = cli(root, ["workstream", "arc", "edit", "031/N001", "--title", "probe, then more"]);
  ok("[MKT.SCRIPTS.230] a title with a comma is refused, and the title stays", comma.code === 2 && comma.out.includes("holds a comma") && json(arcFile).title === "the probe arc", comma.out);
}

console.log("\n=== a marketplace's own run file is found");
{
  const entry = { id: "E1", op: "edit", file: "spn-x:a.ts", what: "change E1", decidedBy: [], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: ["U.1"] }, docs: [], book: [] };
  const row = { id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "CODE", blockedBy: [], touches: [], state: "ready", entries: ["E1"] };
  const market = await dataArc("market", { rows: [row] });
  const sha = market.git(["rev-parse", "HEAD"]);
  const stateFile = join(market.ws, "arcs", "N001", "state.json");
  const data = json(stateFile); data.rows[0].commits = { "spn-x": [sha] }; writeFileSync(stateFile, JSON.stringify(data, null, 2));
  writeFileSync(join(market.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: { folder: "x", dmo: "none", reset: "x" }, entries: [entry] }));
  put(market.root, "spn-x/sprepo.json", JSON.stringify({ type: "GENERAL" }));
  put(market.root, "spn-x/packages/pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: new Date(Date.now() + 3600e3).toISOString(), env: "local", results: [{ id: "U.1", tier: "unit", status: "SUCCESS", title: "U.1" }] }));
  const landed = cli(market.root, ["workstream", "row", "state", "031/N001", "1", "landed", "--run", "r1"]);
  ok("[MKT.SCRIPTS.232] a code row lands on the run file the marketplace's runner writes", landed.code === 0 && json(stateFile).rows[0].state === "landed", landed.out);
}

console.log("\n=== state check writes the Open block");
{
  const stale = await dataWorkspace("open-block");
  const page = join(stale.ws, "approach.html");
  writeFileSync(page, readFileSync(page, "utf8").replace("Open &mdash; no card is open", "Open &mdash; 2 cards are open"));
  const checked = cli(stale.root, ["workstream", "state", "check", "031"]);
  ok("[MKT.SCRIPTS.234] the Open block reads from the cards, a page with no card reading `no card is open`", checked.code === 0 && readFileSync(page, "utf8").includes("no card is open") && !readFileSync(page, "utf8").includes("2 cards are open"), checked.out);
}

console.log("\n=== fact write — pinned on the workstream's own branch");
{
  const own = await dataWorkspace("fact-branch");
  const wt = join(own.root, ".worktrees", "031-probe", "spn-x");
  mkdirSync(join(wt, ".."), { recursive: true });
  own.git(["worktree", "add", "-q", "-b", "feat/031-probe", wt]);
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "on the branch"], { cwd: wt });
  const branchHead = execFileSync("git", ["rev-parse", "--short=8", "HEAD"], { cwd: wt, encoding: "utf8" }).trim();
  const mainHead = own.git(["rev-parse", "--short=8", "HEAD"]);
  const pinned = cli(own.root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts:1", "--fact", "a is one"]);
  ok("[MKT.SCRIPTS.312] the fact is pinned to the worktree's commit, not the main checkout's", branchHead !== mainHead && pinned.out.trim() === `f1 · pinned ${branchHead}`, `${pinned.out} ${branchHead} ${mainHead}`);
}

console.log("\n=== report write — a part's report lands the part, and the steps whose parts landed");
{
  const rows = [
    { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "waiting", entries: ["E1"] },
    { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", work: "CODE", blockedBy: ["1"], touches: [], state: "waiting", entries: ["E2"] },
  ];
  const fold = await dataArc("fold", { rows });
  const entry = (id, file) => ({ id, op: "edit", file, what: `change ${id}`, decidedBy: ["q1"], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: [`T.${id}.01`] }, docs: [], book: [] });
  const sheetIn = join(fold.root, "sheet-in.json");
  writeFileSync(sheetIn, JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: { folder: "the spn-x checkout", dmo: "none", reset: "from empty" }, entries: [entry("E1", "spn-x:docs/a.md"), entry("E2", "spn-x:src/b.ts")] }));
  cli(fold.root, ["workstream", "fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1"]);
  cli(fold.root, ["workstream", "sheet", "write", "N001", "--file", sheetIn]);
  const written = cli(fold.root, ["workstream", "go", "write", "N001", "--scope", "N001"]);
  const plan = json(join(fold.ws, "arcs", "N001", "go.json"));
  // A baseline and a full run are both TEST work, told apart by their ids.
  const part = (slot) => plan.parts.find((one) => (slot === "FULL_RUN" ? one.work === "TEST" && !one.id.startsWith("baseline-") : one.work === slot));
  const stateOf = (id) => json(join(fold.ws, "arcs", "N001", "state.json")).rows.find((one) => one.id === id).state;
  const partState = (id) => json(join(fold.ws, "arcs", "N001", "go.json")).parts.find((one) => one.id === id).state;
  const sha = fold.git(["rev-parse", "HEAD"]);
  const report = (id, ...extra) => { put(fold.ws, `notes/N001/orders/${id}.report.md`, ["---", 'row: "2"', "outcome: landed", ...extra, "---", "Body.", ""].join("\n")); return cli(fold.root, ["workstream", "report", "write", "031", `notes/N001/orders/${id}.report.md`]); };
  ok("the go wrote a docs, a code and a full-run part", written.code === 0 && !!part("DOCS") && !!part("CODE") && !!part("FULL_RUN"), written.out);

  const docs = report(part("DOCS").id, `commits: { spn-x: [${sha}] }`);
  ok("[MKT.SCRIPTS.306] a report named for a part lands the part", docs.code === 0 && partState(part("DOCS").id) === "landed", docs.out);
  ok("[MKT.SCRIPTS.313] the step whose entries all sit in a landed part lands", stateOf("1") === "landed" && stateOf("2") !== "landed", docs.out);
  ok("[MKT.SCRIPTS.315] the report ends with the next step", docs.out.trim().split("\n").at(-1).startsWith("Next:"), docs.out);

  const code = report(part("CODE").id, `commits: { spn-x: [${sha}] }`);
  ok("[MKT.SCRIPTS.313] a code step waits for the full run, though its part landed", partState(part("CODE").id) === "landed" && stateOf("2") !== "landed", code.out);

  put(fold.root, "spn-x/pkg/tests/.output/unit/runs/r1.json", JSON.stringify({ run: "r1", tier: "unit", ranAt: new Date(Date.now() + 3600e3).toISOString(), env: "local", results: [{ id: "T.E2.01", tier: "unit", status: "SUCCESS", title: "T.E2.01" }] }));
  const full = report(part("FULL_RUN").id, "run: r1");
  ok("[MKT.SCRIPTS.313] the full run lands the code step", partState(part("FULL_RUN").id) === "landed" && stateOf("2") === "landed", full.out);
}

console.log("\n=== a suggestion's stage follows the arc that carries it");
{
  const carry = await dataWorkspace("carry");
  const stage = (id) => lines(join(carry.ws, "suggestions.jsonl")).find((one) => one.id === id).state;
  for (const title of ["first", "second"]) cli(carry.root, ["workstream", "suggestion", "add", "031", title]);
  cli(carry.root, ["workstream", "arc", "edit", "031/N002", "--title", "the carrier", "--subject", "carrier", "--goal", "carries two"]);
  cli(carry.root, ["workstream", "arc", "edit", "031/N002", "--carries", "s1,s2"]);
  ok("[MKT.SCRIPTS.317] an arc that carries a suggestion moves it to shaped", stage("s1") === "shaped" && stage("s2") === "shaped");
  cli(carry.root, ["workstream", "arc", "edit", "031/N002", "--status", "DECIDED", "--note", "the developer: go"]);
  ok("[MKT.SCRIPTS.317] its go moves it to decided", stage("s1") === "decided" && stage("s2") === "decided");
  cli(carry.root, ["workstream", "arc", "edit", "031/N002", "--status", "DROPPED", "--reason", "not wanted", "--note", "the developer: drop it"]);
  ok("[MKT.SCRIPTS.317] its drop moves it to dropped", stage("s1") === "dropped" && stage("s2") === "dropped");
}

console.log("\n=== state show — cost and rework of the running arc");
{
  const row = (id, over = {}) => ({ id, parent: "N001", title: `r${id}`, kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", ...over });
  const cost = await dataWorkspace("cost", { rows: [row("1", { state: "landed", cost: { tokens: 200000, minutes: 3 } }), row("2", { cost: { tokens: 212000, minutes: 4 } }),
    row("3", { decisions: ["q5"] }), row("4"), row("5", { decisions: ["q2"] })] });
  const arcDir = join(cost.ws, "arcs", "N001");
  const at = (minute) => `2030-01-01T10:${String(minute).padStart(2, "0")}:00+05:30`;
  writeFileSync(join(arcDir, "log.jsonl"), [
    { at: at(0), kind: "added", row: "1", note: "r1" }, { at: at(1), kind: "status", row: null, note: "PROPOSED → DECIDED · go" },
    { at: at(2), kind: "added", row: "3", note: "r3" }, { at: at(3), kind: "added", row: "4", note: "r4" }, { at: at(4), kind: "added", row: "5", note: "r5" },
  ].map((one) => JSON.stringify(one)).join("\n") + "\n");
  const question = (id, when) => JSON.stringify({ id, arc: "N001", title: id, state: "answered", raised: at(0), shownIn: [], card: {}, answer: { key: "A", words: "A", at: when } });
  writeFileSync(join(cost.ws, "questions.jsonl"), [question("q5", at(2)), question("q2", at(0))].join("\n") + "\n");
  mkdirSync(join(cost.ws, "notes", "N001", "orders"), { recursive: true });
  for (const name of ["1.md", "2.md", "1.report.md"]) writeFileSync(join(cost.ws, "notes", "N001", "orders", name), "x\n");
  const shown = cli(cost.root, ["workstream", "state", "show", "031"]);
  ok("the line carries orders, tokens and rework split by cause", /N001 1\/5 · 2 orders · 412k tokens · rework 3: 2 missed, 1 from your answers/.test(shown.out), shown.out);
  const asJson = JSON.parse(cli(cost.root, ["workstream", "state", "show", "031", "--json"]).out)[0].arcs[0];
  ok("--json carries the numbers", asJson.orders === 2 && asJson.tokens === 412000 && asJson.rework.missed === 2 && asJson.rework.fromAnswers === 1, JSON.stringify(asJson));
}

console.log("\n=== question answer — a card settled in one call; addresses read both ways; rows by arc address (MKT.HOOKS.323, .325)");
{
  const one = await dataWorkspace("settle");
  const sheetFile = join(one.ws, "arcs", "N001", "sheet.json");
  const entry = (id) => ({ id, op: "edit", file: "spn-x:a.ts", what: "x", decidedBy: ["an earlier word"], facts: [], then: [], rules: [], callers: [], tiers: {}, docs: [], book: [] });
  put(one.root, ".spndevex/workstreams/open/031-probe/arcs/N001/sheet.json", JSON.stringify({ schemaVersion: 1, releaseChain: [], dependsOn: [], stack: null, entries: [entry("E7"), entry("E9")] }));
  put(one.root, "card.json", JSON.stringify(CARD));
  const raised = cli(one.root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
  const id = /^([Qq]\d+)/.exec(raised.out)?.[1] ?? "Q1";
  const missing = cli(one.root, ["workstream", "question", "answer", `031/${id}`, "--key", "A", "--words", "go", "--entries", "E7,E8,E10"]);
  ok("[MKT.HOOKS.323] red: entries that do not exist are all named at once, and nothing is recorded", missing.code === 2 && missing.out.includes("E8") && missing.out.includes("E10") &&
    lines(join(one.ws, "questions.jsonl")).find((row) => row.id === id.toLowerCase()).state === "open", missing.out);
  const done = cli(one.root, ["workstream", "question", "answer", `031/${id}`, "--key", "A", "--words", "take A, folded", "--entries", "E7,E9"]);
  const record = lines(join(one.ws, "questions.jsonl")).find((row) => row.id === id.toLowerCase());
  ok("[MKT.HOOKS.323] a card is settled in one call: the record", done.code === 0 && record.state === "answered" && record.answer.words === "take A, folded", done.out);
  ok("[MKT.HOOKS.323] the answer is folded into the arc's What", /<p>[^<]*take A, folded[^<]*<\/p>/.test(readFileSync(join(one.ws, "approach.html"), "utf8").split('id="N001-what"')[1] ?? ""));
  ok("[MKT.HOOKS.323] the log line is written", lines(join(one.ws, "arcs", "N001", "log.jsonl")).some((line) => line.kind === "answered" && line.note.includes("take A, folded")));
  const sheet = json(sheetFile);
  ok("[MKT.HOOKS.323] the card is cited in both entries", sheet.entries.every((one2) => one2.decidedBy.some((text) => new RegExp(`\\b${id}\\b`, "i").test(text))), JSON.stringify(sheet.entries));
  ok("[MKT.HOOKS.323] nothing is owed by the line", !/owed:/.test(done.out), done.out);
  const bare = cli(one.root, ["workstream", "question", "show", id, "--in", "notes/N001/preview.html"]);
  ok("[MKT.HOOKS.325] the bare id and the address both read the card", /is answered/.test(bare.out) && /is answered/.test(cli(one.root, ["workstream", "question", "show", `031/${id}`, "--in", "notes/N001/preview.html"]).out), bare.out);
  const rows = cli(one.root, ["workstream", "rows", "031/N001"]);
  ok("[MKT.HOOKS.325] `rows 031/N001` shows the arc's rows", rows.code === 0 && /N001 1 /.test(rows.out), rows.out);
  const second = cli(one.root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
  const secondId = /^(q\d+)/.exec(second.out)?.[1] ?? "q2";
  const noFile = cli(one.root, ["workstream", "question", "answer", `031/${secondId}`, "--key", "A", "--words", "a local fix", "--entries", "none"]);
  const noFileRecord = lines(join(one.ws, "questions.jsonl")).find((row) => row.id === secondId);
  ok("[MKT.HOOKS.402] `--entries none` records the answer as changing no repository file, and owes nothing", noFile.code === 0 && JSON.stringify(noFileRecord.answer.entries) === "[]" &&
    noFile.out.includes("changes no repository file") && !/owed:/.test(noFile.out), noFile.out);
  ok("[MKT.HOOKS.402] no entry is cited for it", json(sheetFile).entries.every((one2) => !one2.decidedBy.some((text) => new RegExp(`\\b${secondId}\\b`).test(text))));
  ok("[MKT.HOOKS.325] `rows 031/N001 --json` takes the options of show", cli(one.root, ["workstream", "rows", "031/N001", "--json"]).out.trim().startsWith("["));
}

console.log("\n=== row state waiting --on — a row waits on something outside the window, and says what (MKT.HOOKS.322)");
{
  const one = await dataWorkspace("waiting-on");
  const file = join(one.ws, "arcs", "N001", "state.json"), history = join(one.ws, "arcs", "N001", "log.jsonl");
  const rowOne = () => json(file).rows.find((row) => row.id === "1");
  cli(one.root, ["workstream", "row", "state", "031/N001", "1", "ready"]);
  const waiting = cli(one.root, ["workstream", "row", "state", "031/N001", "1", "waiting", "--on", "the partner's keys"]);
  ok("[MKT.HOOKS.322] `--on` with waiting writes `waitingOn` and a log line that carries it", waiting.code === 0 && rowOne().state === "waiting" && rowOne().waitingOn === "the partner's keys"
    && lines(history).at(-1).kind === "waiting" && lines(history).at(-1).row === "1" && lines(history).at(-1).note.includes("the partner's keys"), `${waiting.out}${JSON.stringify(lines(history).at(-1))}`);
  const shown = cli(one.root, ["workstream", "rows", "show", "031/N001"]);
  ok("`rows show` prints the row's wait after its blockers", /N001 1 +waiting .*· waiting on the partner's keys/.test(shown.out) && /N001 2 .*waits on 1/.test(shown.out), shown.out);
  const ready = cli(one.root, ["workstream", "rows", "show", "031/N001", "--ready"]);
  ok("`--ready` leaves the waiting row out", !/N001 1 /.test(ready.out), ready.out);
  const stray = cli(one.root, ["workstream", "row", "state", "031/N001", "1", "ready", "--on", "something"]);
  ok("`--on` with another state is refused, exit 2, and nothing is written", stray.code === 2 && stray.out.includes("--on") && rowOne().state === "waiting" && rowOne().waitingOn === "the partner's keys", stray.out);
  const blank = cli(one.root, ["workstream", "row", "state", "031/N001", "2", "waiting", "--on", " "]);
  ok("a blank `--on` is refused too, and nothing is written", blank.code === 2 && json(file).rows.find((row) => row.id === "2").waitingOn == null && json(file).rows.find((row) => row.id === "2").state === "waiting", blank.out);
  const cleared = cli(one.root, ["workstream", "row", "state", "031/N001", "1", "ready"]);
  ok("any other state clears `waitingOn`", cleared.code === 0 && rowOne().state === "ready" && rowOne().waitingOn == null, cleared.out);
  const back = cli(one.root, ["workstream", "rows", "show", "031/N001", "--ready"]);
  ok("set to ready, the row is listed again", /N001 1 /.test(back.out), back.out);
}

console.log("\n=== work write — altitude and pass become work in every open workstream (MKT.SCRIPTS.326)");
{
  const old = await dataWorkspace("work-write");
  const rowsOld = arcData().rows.map(({ work, ...rest }) => ({ ...rest, altitude: "DOCS" }));
  const stateFile = join(old.ws, "arcs", "N001", "state.json");
  writeFileSync(stateFile, JSON.stringify({ ...json(stateFile), rows: rowsOld }, null, 2));
  const renamed = cli(old.root, ["workstream", "work", "write"]);
  const after = json(stateFile).rows;
  ok("[MKT.SCRIPTS.326] `work write` renames altitude to work in each row, and says how many", renamed.code === 0 && after.every((row) => row.work === "DOCS" && !("altitude" in row)) && /\d+ records? renamed to work/.test(renamed.out), renamed.out);
  ok("[MKT.SCRIPTS.326] one `work` line is left in the arc's log", lines(join(old.ws, "arcs", "N001", "log.jsonl")).filter((line) => line.kind === "work").length === 1);
  const again = cli(old.root, ["workstream", "work", "write"]);
  ok("[MKT.SCRIPTS.326] run again it changes nothing and writes no second line", again.code === 0 && again.out.includes("no open workstream holds altitude or pass") && lines(join(old.ws, "arcs", "N001", "log.jsonl")).filter((line) => line.kind === "work").length === 1, again.out);
  const target = cli(old.root, ["workstream", "work", "write", "031"]);
  ok("red: `work write` takes no target", target.code === 2 && target.out.includes("takes no target"), target.out);
}

console.log("\n=== go start — a release part starts, a helper's part does not (MKT.SCRIPTS.326)");
{
  const rel = await dataArc("go-release", { rows: [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", entries: ["E1"] }] });
  const entry = { id: "E1", op: "edit", file: "spn-x:docs/a.md", what: "x", decidedBy: ["q1"], facts: [], then: [], rules: [], callers: [], tiers: {}, docs: [], book: [] };
  writeFileSync(join(rel.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: null, entries: [entry] }));
  cli(rel.root, ["workstream", "go", "write", "N001", "--scope", "N001"]);
  const goFile = join(rel.ws, "arcs", "N001", "go.json");
  const plan = json(goFile);
  const release = plan.parts.find((one) => one.work === "RELEASE");
  ok("[MKT.SCRIPTS.326] the go holds a RELEASE part, named by `work`", !!release && plan.parts.every((one) => !("pass" in one) && typeof one.work === "string"), JSON.stringify(plan.parts.map((one) => [one.id, one.work])));
  const helper = plan.parts.find((one) => one.work === "DOCS");
  const refusedHelper = cli(rel.root, ["workstream", "go", "start", "031/N001", helper.id]);
  ok("[MKT.SCRIPTS.326] red: a helper's part is refused, and nothing changes", refusedHelper.code === 1 && /DOCS part/.test(refusedHelper.out) && json(goFile).parts.find((one) => one.id === helper.id).state === helper.state, refusedHelper.out);
  // a release waits on its repository's parts (E3), so they have landed before it is ready
  writeFileSync(goFile, JSON.stringify({ ...plan, parts: plan.parts.map((one) => (one.work === "RELEASE" || one.state === "landed" ? one : { ...one, state: "landed" })) }, null, 2));
  const started = cli(rel.root, ["workstream", "go", "start", "031/N001", release.id]);
  ok("[MKT.SCRIPTS.326] a ready release part starts: running, and the next step is the release", started.code === 0 && json(goFile).parts.find((one) => one.id === release.id).state === "running" && /Next: release spn-x/.test(started.out), started.out);
  const twice = cli(rel.root, ["workstream", "go", "start", "031/N001", release.id]);
  ok("[MKT.SCRIPTS.326] red: a release part already running is refused, not ready", twice.code === 1 && /not ready/.test(twice.out), twice.out);
}

console.log("\n=== workstream close — retro.json and the suggestions it raises; a part's red first is not counted (MKT.SCRIPTS.332)");
{
  const retro = await dataWorkspace("retro");
  const closedEarlier = join(retro.root, ".spndevex", "workstreams", "closed", "030-older");
  mkdirSync(closedEarlier, { recursive: true });
  const calm = { v: 1, workstream: "030-older", at: "2026-09-01T00:00:00Z", stages: {}, works: {}, outcomes: {}, parts: {}, shape: {}, ungated: [],
    checks: { "test-run": { runs: 10, denies: 0, retried: 0 } }, commands: { "workstream row": { runs: 10, failed: 0, retried: 0, refused: 0 } } };
  writeFileSync(join(closedEarlier, "retro.json"), JSON.stringify(calm));
  const telemetry = join(retro.root, ".spndevex", ".debug", "telemetry");
  mkdirSync(telemetry, { recursive: true });
  const base = { v: 1, event: "PostToolUse", session: "s1", agent: null, workstream: "031-probe", arc: "N001", part: null, skill: null, work: null };
  let n = 0;
  const at = () => `2026-10-10T10:${String(n).padStart(2, "0")}:00Z`;
  const check = (verdict, retryOf = null) => JSON.stringify({ ...base, mtype: "CHECK", id: `c${++n}`, at: at(), check: "test-run", verdict, retryOf });
  const command = (call, exit, retryOf = null, extra = {}) => JSON.stringify({ ...base, mtype: "COMMAND", id: `m${++n}`, at: at(), call, exit, retryOf, ...extra });
  const own_part = { part: "code-spn-x-1", work: "CODE" };
  const own = { program: "spn-devex", group: "workstream", action: "row" };
  const suite = { program: "spnutils", group: "apps", action: "test" };
  writeFileSync(join(telemetry, "hooks.jsonl"), [
    check("DENY"), check("DENY", "c1"), check("DENY", "c2"),
    command(own, 2), command(own, 2, "m4"),
    // a part's own red first: the suite fails, then passes inside the part
    command(suite, 1, null, own_part), command(suite, 0, "m6", own_part),
  ].join("\n") + "\n");
  writeFileSync(join(retro.ws, "arcs", "N001", "log.jsonl"), [
    { at: "2026-10-01T10:00:00Z", kind: "header", row: null, note: "the panel overturned the first shape" },
    { at: "2026-10-01T10:01:00Z", kind: "note", row: null, note: "the panel blocked it" },
  ].map((one) => JSON.stringify(one)).join("\n") + "\n");
  writeClosingBlock(retro.ws);
  const closing = cli(retro.root, ["workstream", "close", "031"]);
  const home = existsSync(join(retro.root, ".spndevex", "workstreams", "closed", "031-probe", "retro.json")) ? join(retro.root, ".spndevex", "workstreams", "closed", "031-probe") : retro.ws;
  const record = existsSync(join(home, "retro.json")) ? json(join(home, "retro.json")) : null;
  ok("[MKT.SCRIPTS.332] `close` with no arguments writes retro.json, a version 1 record of this workstream", !!record && record.v === 1 && record.workstream === "031-probe", closing.out);
  ok("[MKT.SCRIPTS.332] the record tallies the checks and commands from the telemetry", record?.checks["test-run"]?.runs === 3 && record.checks["test-run"].denies === 3 && record.checks["test-run"].retried === 2 && record.commands["workstream row"]?.refused === 2, JSON.stringify(record?.checks) + JSON.stringify(record?.commands));
  ok("[MKT.SCRIPTS.418] the close prints the workstream's split and retro.json holds the same, with the managing-to-change ratio",
    /split · change \d+ calls [\d.]+m · proof .* · waiting \d+ calls [\d.]+m · managing to change /.test(closing.out) && ["change", "proof", "managing", "refusals", "waiting"].every((kind) => typeof record?.split?.[kind]?.calls === "number") && "managingToChange" in record, closing.out);
  const { splitLine } = await import("../../../../../src/scripts/commands/workstream/close.ts");
  const none = { change: { calls: 0, minutes: 0 }, proof: { calls: 0, minutes: 0 }, managing: { calls: 0, minutes: 0 }, refusals: { calls: 0, minutes: 0 }, waiting: { calls: 0, minutes: 0 } };
  ok("[MKT.SCRIPTS.418] the line states the ratio of managing minutes to change minutes, and says so when there is no change",
    splitLine({ split: { ...none, change: { calls: 4, minutes: 10 }, managing: { calls: 9, minutes: 25 } }, managingToChange: 2.5 }).endsWith("managing to change 2.5 to 1") && splitLine({ split: none, managingToChange: null }).includes("not known"));
  ok("[MKT.SCRIPTS.332] a part's red first is not counted: the suite runs are in no command tally", !!record && !Object.keys(record.commands).some((key) => key.includes("test")), JSON.stringify(record?.commands));
  const raised = lines(join(home, "suggestions.jsonl")).map((one) => one.title);
  ok("[MKT.SCRIPTS.332] it raises the check, the command and the shape that stand out against the earlier workstream", raised.some((t) => t.includes("check:test-run")) && raised.some((t) => t.includes("command:workstream row")) && raised.some((t) => t.includes("ideate:panel-overturned")), JSON.stringify(raised));
  ok("[MKT.SCRIPTS.332] and none for the suite's red first", !raised.some((t) => /apps test|command:apps/.test(t)), JSON.stringify(raised));
  ok("each suggestion is raised, not decided", lines(join(home, "suggestions.jsonl")).filter((one) => /^Retrospective/.test(one.title)).every((one) => one.state === "raised"));
  ok("[MKT.SCRIPTS.395] the close prints each one it raised, with a capital S", /retrospective · raised S\d+ Retrospective · check:test-run/.test(closing.out), closing.out);
}

console.log("\n=== workstream close — the retrospective counts failed tests, the release gate, brief:, part-size: and the thresholds (MKT.SCRIPTS.332)");
{
  const sinceThen = (name, earlierCommands, earlierParts = {}) => async () => {
    const w = await dataWorkspace(name);
    const old = join(w.root, ".spndevex", "workstreams", "closed", "030-older");
    mkdirSync(old, { recursive: true });
    writeFileSync(join(old, "retro.json"), JSON.stringify({ v: 1, workstream: "030-older", at: "2026-09-01T00:00:00Z", stages: {}, works: {}, outcomes: {}, checks: {}, parts: earlierParts, shape: {}, ungated: [], commands: earlierCommands }));
    mkdirSync(join(w.root, ".spndevex", ".debug", "telemetry"), { recursive: true });
    return w;
  };
  let n = 0;
  const base = { v: 1, event: "PostToolUse", session: "s1", agent: null, workstream: "031-probe", arc: "N001", part: null, skill: null, work: null };
  const at = () => `2026-10-10T11:${String(n % 60).padStart(2, "0")}:${String(Math.floor(n / 60)).padStart(2, "0")}Z`;
  const row = (extra) => JSON.stringify({ ...base, id: `r${++n}`, at: at(), ...extra });
  const command = (action, exit, retryOf = null, extra = {}) => row({ mtype: "COMMAND", call: { program: "spn-devex", group: "probe", action }, exit, retryOf, ...extra });
  const testRow = (status, retryOf = null, extra = {}) => row({ mtype: "TEST", work: "TEST", status, retryOf, call: { program: "spnutils", group: "apps", action: "test" }, test: { node: "page-ts", tier: "UNIT", tests: { passed: 1, failed: status === "FAILED" ? 1 : 0, skipped: 0 } }, ...extra });
  const finish = (w, rows) => {
    writeFileSync(join(w.root, ".spndevex", ".debug", "telemetry", "hooks.jsonl"), rows.join("\n") + "\n");
    writeClosingBlock(w.ws);
    const closing = cli(w.root, ["workstream", "close", "031"]);
    const home = existsSync(join(w.root, ".spndevex", "workstreams", "closed", "031-probe", "retro.json")) ? join(w.root, ".spndevex", "workstreams", "closed", "031-probe") : w.ws;
    return { record: json(join(home, "retro.json")), raised: existsSync(join(home, "suggestions.jsonl")) ? lines(join(home, "suggestions.jsonl")).map((one) => one.title) : [], out: closing.out };
  };
  const has = (raised, text) => raised.some((t) => t.includes(text));

  // a test that failed and ran again counts, a code part's own red first does not
  {
    const w = await sinceThen("retro-tests", { "apps test": { runs: 10, failed: 0, retried: 0, refused: 0 } })();
    const got = finish(w, [
      testRow("FAILED"), testRow("SUCCESS", "r1"),
      testRow("FAILED", null, { part: "code-spn-x-1" }), testRow("SUCCESS", "r3", { part: "code-spn-x-1" }),
      command("test", 1, null, { call: { program: "spnutils", group: "apps", action: "test" }, part: "code-spn-x-1", work: "CODE" }),
    ]);
    const c = got.record.commands["apps test"];
    ok("[MKT.SCRIPTS.332] a test that failed and ran again is counted: a TEST row's status and retryOf are read", c?.failed === 1 && c.retried === 1 && c.runs === 2, JSON.stringify(got.record.commands));
    ok("[MKT.SCRIPTS.332] only a CODE part's own runs are skipped, whether a TEST row or a command", c?.runs === 2, JSON.stringify(got.record.commands));
    ok("[MKT.SCRIPTS.332] and the count raises command:apps test once, against earlier workstreams that never failed", has(got.raised, "command:apps test"), JSON.stringify(got.raised));
  }
  // a pattern with no earlier rate raises at 2 or more, never at 1
  {
    const two = finish(await sinceThen("retro-new-2", {})(), [command("fresh", 1), command("fresh", 1), command("fresh", 0)]);
    ok("[MKT.SCRIPTS.332] a pattern earlier workstreams never had raises at exactly 2", has(two.raised, "command:probe fresh"), JSON.stringify(two.raised));
    const one = finish(await sinceThen("retro-new-1", {})(), [command("fresh", 1), command("fresh", 0), command("fresh", 0)]);
    ok("[MKT.SCRIPTS.332] and does not raise at 1", !has(one.raised, "command:probe fresh"), JSON.stringify(one.raised));
  }
  // thresholds against an earlier rate of 2 in 10
  {
    const earlier = { "probe fresh": { runs: 10, failed: 2, retried: 0, refused: 0 } };
    const runs = (bad) => Array.from({ length: 10 }, (_, i) => command("fresh", i < bad ? 1 : 0));
    const exact = finish(await sinceThen("retro-x15", earlier)(), runs(3));
    ok("[MKT.SCRIPTS.332] a rate of exactly 1.5 times the earlier rate does not raise", !has(exact.raised, "command:probe fresh"), JSON.stringify(exact.raised));
    const past = finish(await sinceThen("retro-x16", earlier)(), runs(4));
    ok("[MKT.SCRIPTS.332] a rate past 1.5 times raises", has(past.raised, "command:probe fresh"), JSON.stringify(past.raised));
    const few = finish(await sinceThen("retro-one", { "probe fresh": { runs: 100, failed: 0, retried: 0, refused: 0 } })(), [command("fresh", 1)]);
    ok("[MKT.SCRIPTS.332] a count of 1 never raises, whatever the rate", !has(few.raised, "command:probe fresh"), JSON.stringify(few.raised));
  }
  // brief: parts launched again by a second helper
  {
    const turn = (part, agent) => row({ mtype: "TURN", part, agent, work: "CODE", ms: 1000, skill: null });
    const got = finish(await sinceThen("retro-brief", {})(), [turn("code-a-1", "h1"), turn("code-a-1", "h2"), turn("code-b-1", "h1"), turn("code-b-1", "h3"), turn("code-c-1", "h1")]);
    ok("[MKT.SCRIPTS.332] parts launched again for a second helper raise brief:<work>", has(got.raised, "brief:CODE") || has(got.raised, "brief:none"), JSON.stringify(got.raised) + JSON.stringify(got.record.parts));
  }
  // the release gate and part-size: from a go
  {
    const w = await dataArc("retro-go", { rows: [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", entries: ["E1"] }] });
    const old = join(w.root, ".spndevex", "workstreams", "closed", "030-older");
    mkdirSync(old, { recursive: true });
    writeFileSync(join(old, "retro.json"), JSON.stringify({ v: 1, workstream: "030-older", at: "2026-09-01T00:00:00Z", stages: {}, works: {}, outcomes: {}, checks: {}, parts: {}, shape: {}, ungated: [], commands: {} }));
    mkdirSync(join(w.root, ".spndevex", ".debug", "telemetry"), { recursive: true });
    const entry = { id: "E1", op: "edit", file: "spn-x:docs/a.md", what: "x", decidedBy: ["q1"], facts: [], then: [], rules: [], callers: [], tiers: {}, docs: [], book: [] };
    writeFileSync(join(w.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: null, entries: [entry] }));
    // rows of the arc's state are DOCS rows of repo spn-x already; the go derives a docs part and a release part
    cli(w.root, ["workstream", "go", "write", "N001", "--scope", "N001"]);
    const goFile = join(w.ws, "arcs", "N001", "go.json");
    const plan = json(goFile);
    const docs = plan.parts.find((one) => one.work === "DOCS");
    const release = plan.parts.find((one) => one.work === "RELEASE");
    for (const one of plan.parts) one.minutes = one.id === docs.id ? 10 : one.minutes;
    writeFileSync(goFile, JSON.stringify(plan, null, 2));
    const got = finish(w, [row({ mtype: "TURN", part: docs.id, work: "DOCS", ms: 3600000, agent: "h1", skill: null })]);
    ok("[MKT.SCRIPTS.332] a release part with no panel row is a finding: gate:", !!release && has(got.raised, `gate:release part ${release.id} has no panel row`), JSON.stringify(got.raised));
    ok("[MKT.SCRIPTS.332] a go with no panel row on its preview is a finding too", has(got.raised, "N001 go has no panel row"), JSON.stringify(got.raised));
    ok("[MKT.SCRIPTS.332] part-size: names the repository and work whose model time is far from the plan's", has(got.raised, "part-size:spn-x|DOCS"), JSON.stringify(got.raised) + got.out);
  }
  // a PANEL row gates what it names: its part, and its arc, both when it names both (RULE.DEVEX.WORKSPACE.485)
  {
    const gatedGo = async (name) => {
      const w = await dataArc(name, { rows: [{ id: "1", parent: "N001", title: "r", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", entries: ["E1"] }] });
      mkdirSync(join(w.root, ".spndevex", ".debug", "telemetry"), { recursive: true });
      const entry = { id: "E1", op: "edit", file: "spn-x:docs/a.md", what: "x", decidedBy: ["q1"], facts: [], then: [], rules: [], callers: [], tiers: {}, docs: [], book: [] };
      writeFileSync(join(w.ws, "arcs", "N001", "sheet.json"), JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: null, entries: [entry] }));
      cli(w.root, ["workstream", "go", "write", "N001", "--scope", "N001"]);
      return { w, release: json(join(w.ws, "arcs", "N001", "go.json")).parts.find((one) => one.work === "RELEASE") };
    };
    const panelRow = (extra) => row({ mtype: "PANEL", event: "SubagentStop", lens: "LEAD", verdict: "PASS", ...extra });
    const byArc = await gatedGo("retro-panel-arc");
    const gotArc = finish(byArc.w, [panelRow({ part: null })]);
    ok("[MKT.SCRIPTS.391] a panel row naming the arc gates the arc's go and its release part", !has(gotArc.raised, "go has no panel row") && !has(gotArc.raised, "has no panel row"), JSON.stringify(gotArc.raised));
    const byPart = await gatedGo("retro-panel-part");
    const gotPart = finish(byPart.w, [panelRow({ arc: null, part: byPart.release.id })]);
    ok("[MKT.SCRIPTS.391] a panel row naming only the release part gates that part, and not the arc's go",
      !has(gotPart.raised, `release part ${byPart.release.id} has no panel row`) && has(gotPart.raised, "N001 go has no panel row"), JSON.stringify(gotPart.raised));
    const both = await gatedGo("retro-panel-both");
    const gotBoth = finish(both.w, [panelRow({ part: both.release.id })]);
    ok("[MKT.SCRIPTS.391] a panel row naming the part and the arc gates both: the arc is not skipped for having a part", !has(gotBoth.raised, "go has no panel row") && !has(gotBoth.raised, "has no panel row"), JSON.stringify(gotBoth.raised));
  }
}

console.log("\n=== the role arcs by their addresses: ideate and follow-ups (Q33)");
{
  const rowsOf = [{ id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", entries: ["E1"] }];
  const role = await dataWorkspace("role-arcs", { rows: rowsOf });
  const run = (...args) => cli(role.root, ["workstream", ...args]);
  const openRole = (arc, subject) => run("arc", "edit", `031/${arc}`, "--title", `the ${arc}`, "--subject", subject, "--goal", "a role arc's goal");
  ok("[MKT.SCRIPTS.484] `fact write <ws>/ideate` needs an ideate arc: none opened yet, the fact is refused", run("fact", "write", "031/ideate", "--source", "spn-x/a.ts", "--fact", "a is one").code !== 0 && !existsSync(join(role.ws, "arcs", "ideate")));
  const ideate = openRole("ideate", "the-shape");
  ok("[MKT.SCRIPTS.484] the ideate arc is opened by its address", ideate.code === 0 && existsSync(join(role.ws, "arcs", "ideate", "state.json")), ideate.out);
  const fact = run("fact", "write", "031/ideate", "--source", "spn-x/a.ts:1", "--fact", "a is one");
  ok("[MKT.SCRIPTS.484] a fact against `<ws>/ideate` goes to arcs/ideate/facts.jsonl", fact.code === 0 && lines(join(role.ws, "arcs", "ideate", "facts.jsonl")).length === 1, fact.out);
  const preview = join(role.ws, "notes", "ideate", "preview.html");
  ok("[MKT.SCRIPTS.485] the ideate arc's preview is written at notes/ideate/preview.html", existsSync(preview), ideate.out);
  const other = run("arc", "edit", "031/other", "--title", "x", "--subject", "x", "--goal", "x");
  ok("[MKT.SCRIPTS.484] red: an address that is none of the three forms is refused naming them", other.code !== 0 && other.out.includes("N<nnn>") && other.out.includes("ideate") && other.out.includes("follow-ups"), other.out);
  const follow = openRole("follow-ups", "follow-ups");
  ok("[MKT.SCRIPTS.484] the follow-up arc is opened by its address", follow.code === 0 && existsSync(join(role.ws, "arcs", "follow-ups", "state.json")), follow.out);
  const kind = JSON.parse(readFileSync(join(role.ws, "arcs", "follow-ups", "state.json"), "utf8"));
  ok("[MKT.SCRIPTS.487] no kind is stored on a role arc: the address is the kind", kind.kind === undefined && JSON.parse(readFileSync(join(role.ws, "arcs", "ideate", "state.json"), "utf8")).kind === undefined);
  const proposes = run("arc", "edit", "031/ideate", "--proposes", "N002,follow-ups");
  ok("[MKT.SCRIPTS.484] `--proposes` on the ideate arc takes a mixed list", proposes.code === 0 && JSON.stringify(JSON.parse(readFileSync(join(role.ws, "arcs", "ideate", "state.json"), "utf8")).proposes) === '["N002","follow-ups"]', proposes.out);
  const onFollow = run("arc", "edit", "031/follow-ups", "--proposes", "N002");
  ok("[MKT.SCRIPTS.484] red: `--proposes` is refused on any arc but the ideate arc", onFollow.code !== 0 && onFollow.out.includes("only on the ideate arc"), onFollow.out);
  const odd = run("arc", "edit", "031/ideate", "--proposes", "N002,later");
  ok("[MKT.SCRIPTS.484] red: a `--proposes` id that is none of the forms is refused", odd.code !== 0 && odd.out.includes("`later`"), odd.out);
  const skip = run("arc", "edit", "031/N005", "--title", "skipped", "--subject", "skipped", "--goal", "a number skipped");
  ok("[MKT.SCRIPTS.486] red: a numbered arc opens only at the next free number, and the refusal names it", skip.code !== 0 && skip.out.includes("N002") && !existsSync(join(role.ws, "arcs", "N005")), skip.out);
  const next = run("arc", "edit", "031/N002", "--title", "the next", "--subject", "next", "--goal", "the next free number");
  ok("[MKT.SCRIPTS.486] the next free number opens", next.code === 0 && existsSync(join(role.ws, "arcs", "N002", "state.json")), next.out);
  const withKind = run("arc", "edit", "031/N002", "--kind", "ideate");
  ok("[MKT.SCRIPTS.487] red: `--kind` is an option `arc edit` does not take", withKind.code !== 0 && withKind.out.includes("does not take `--kind`"), withKind.out);
  const into = run("suggestion", "add", "031", "a thought for later");
  ok("[MKT.SCRIPTS.489] a suggestion with no arc is recorded against follow-ups where the workstream holds that folder", into.code === 0 && lines(join(role.ws, "suggestions.jsonl")).at(-1).arc === "follow-ups", into.out);
}

console.log("\n=== a suggestion belongs to an arc (RULE.DEVEX.WORKSPACE.488, .489)");
{
  const rowsOf = [{ id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "ready", entries: ["E1"] }];
  const sg = await dataWorkspace("sugg-arc", { rows: rowsOf });
  const run = (...args) => cli(sg.root, ["workstream", ...args]);
  const records = () => lines(join(sg.ws, "suggestions.jsonl"));
  const into = run("suggestion", "add", "031/N001", "keep the footbar under Plan");
  const loose = run("suggestion", "add", "031", "a thought for later");
  ok("[MKT.SCRIPTS.403] suggestion add takes <NNN>/N<nnn> and writes the arc into the record, S<n> printed with a capital",
    into.code === 0 && into.out.trim().split("\n")[0] === "S1 · raised" && records()[0].arc === "N001" && records()[0].id === "s1", into.out);
  ok("[MKT.SCRIPTS.489] raised against a workstream with no follow-ups folder, the record's arc is null, as today", loose.code === 0 && records()[1].arc === null, loose.out);
  const noArc = run("suggestion", "add", "031/N009", "against an arc that is not there");
  ok("[MKT.SCRIPTS.403] an arc the workstream does not hold is refused", noArc.code !== 0 && records().length === 2, noArc.out);
  const moved = run("suggestion", "state", "031", "S2", "shaped", "--arc", "N001");
  ok("[MKT.SCRIPTS.403] suggestion state shaped --arc N<nnn> sets the arc of a suggestion that had none", moved.code === 0 && records()[1].arc === "N001" && records()[1].state === "shaped", moved.out);
  const parkedArc = run("suggestion", "state", "031", "S2", "parked", "--arc", "N001");
  ok("[MKT.SCRIPTS.403] --arc goes only with shaped or decided", parkedArc.code === 2 && /only with `shaped` or `decided`/.test(parkedArc.out), parkedArc.out);
  writeFileSync(join(sg.ws, "suggestions.jsonl"), `${JSON.stringify({ id: "s1", title: "an older record", state: "raised", preview: null, words: null })}\n`);
  ok("[MKT.SCRIPTS.403] a record with no arc field is read as null, never as an error", run("suggestion", "state", "031", "S1", "parked").code === 0 && records()[0].state === "parked" && !("arc" in records()[0]));

  // the last row does not land while a suggestion against the arc is open
  writeFileSync(join(sg.ws, "suggestions.jsonl"), `${JSON.stringify({ id: "s1", title: "x".repeat(80), state: "raised", preview: null, words: null, arc: "N001" })}\n${JSON.stringify({ id: "s2", title: "another", state: "shaped", preview: null, words: null, arc: "N001" })}\n${JSON.stringify({ id: "s3", title: "someone else's", state: "raised", preview: null, words: null, arc: "N002" })}\n`);
  const refused = run("row", "state", "031/N001", "1", "landed");
  ok("[MKT.SCRIPTS.404] the write that lands an arc's last row refuses while a suggestion against it is raised or shaped, naming each and saying to decide, park or drop it",
    refused.code === 1 && refused.out.includes("S1") && refused.out.includes("S2") && !refused.out.includes("S3") && /decide, park or drop/i.test(refused.out) && refused.out.includes("Nothing was changed")
      && json(join(sg.ws, "arcs", "N001", "state.json")).rows[0].state === "ready", refused.out);
  writeFileSync(join(sg.ws, "suggestions.jsonl"), `${JSON.stringify({ id: "s1", title: "done", state: "decided", preview: null, words: null, arc: "N001" })}\n${JSON.stringify({ id: "s2", title: "later", state: "parked", preview: null, words: null, arc: "N001" })}\n${JSON.stringify({ id: "s3", title: "someone else's", state: "raised", preview: null, words: null, arc: "N002" })}\n`);
  const landed = run("row", "state", "031/N001", "1", "landed");
  ok("[MKT.SCRIPTS.404] decided, parked or dropped suggestions, and another arc's, let it land", landed.code === 0 && json(join(sg.ws, "arcs", "N001", "state.json")).rows[0].state === "landed", landed.out);
}

console.log("\n=== a go over a mixed scope: a numbered arc and the ideate arc (Q33)");
{
  const rows = [{ id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", work: "DOCS", blockedBy: [], touches: [], state: "waiting", entries: ["E1"] }];
  const mixed = await dataArc("mixed-scope", { rows });
  const run = (...args) => cli(mixed.root, ["workstream", ...args]);
  const sheetOf = (file) => JSON.stringify({ schemaVersion: 1, releaseChain: ["spn-x"], dependsOn: [], stack: { folder: "the spn-x checkout", dmo: "none", reset: "from empty" },
    entries: [{ id: "E1", op: "edit", file, what: "change E1", decidedBy: ["q1"], facts: ["f1"], then: [], rules: [], callers: [], tiers: { unit: ["T.E1.01"] }, docs: [], book: [] }] });
  writeFileSync(join(mixed.root, "sheet-n001.json"), sheetOf("spn-x:docs/a.md"));
  writeFileSync(join(mixed.root, "sheet-ideate.json"), sheetOf("spn-x:docs/b.md"));
  run("fact", "write", "N001", "--source", "spn-x/a.ts", "--fact", "a is 1", "--used-by", "1");
  run("sheet", "write", "N001", "--file", join(mixed.root, "sheet-n001.json"));
  run("arc", "edit", "031/ideate", "--title", "the ideate", "--subject", "the-shape", "--goal", "the shape is settled");
  run("fact", "write", "031/ideate", "--source", "spn-x/a.ts:1", "--fact", "a is 1");
  run("row", "add", "031/ideate", "the idea row", "--repo", "spn-x", "--work", "DOCS");
  run("sheet", "write", "ideate", "--file", join(mixed.root, "sheet-ideate.json"));
  run("arc", "edit", "031/ideate", "--status", "DECIDED", "--note", "the developer: go");
  const written = run("go", "write", "N001", "--scope", "N001,ideate");
  ok("[MKT.SCRIPTS.484] `go write N001 --scope N001,ideate` takes the mixed list and names both arcs", written.code === 0 && written.out.includes("over N001, ideate"), written.out);
  ok("[MKT.SCRIPTS.484] the plan holds the scope as written, the lead first", JSON.stringify(json(join(mixed.ws, "arcs", "N001", "go.json")).scope) === '["N001","ideate"]');
  const lead = run("go", "write", "N001", "--scope", "ideate,N001");
  ok("[MKT.SCRIPTS.484] red: a scope that does not start with the lead is refused", lead.code === 1 && lead.out.includes("the lead is the first arc"), lead.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream commands` : `\n  all ${total} passed — workstream commands`);
process.exit(failed ? 1 : 0);
