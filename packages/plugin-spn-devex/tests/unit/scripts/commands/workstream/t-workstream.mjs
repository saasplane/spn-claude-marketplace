// `commands/workstream/` — the only writers of what a script owns, run as the agent types them, in a
// throwaway workspace. Each command is shown answering in its line, writing its file, and refusing what
// it is typed with wrongly.
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { CARD, cli, dataWorkspace, put } from "../../../../helpers/workstream-fixture.mjs";
import { workspace } from "../../../../helpers/fixture.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws, git } = await dataWorkspace("commands");
const arcFile = join(ws, "arcs", "N001", "state.json");
const log = join(ws, "arcs", "N001", "log.jsonl");

console.log("=== help lists the group");
{
  const help = cli(root, ["help"]);
  for (const words of ["workstream state show", "workstream state check", "workstream rows show", "workstream row write", "workstream row discard", "workstream arc stamp",
    "workstream report write", "workstream fact write", "workstream suggestion write", "workstream progress write",
    "workstream question raise", "workstream question show", "workstream question answer", "workstream question withdraw"])
    ok(`help lists \`${words}\``, help.out.includes(words), words);
}

console.log("\n=== commandsRef — the plugin's own commands, one line each, from the same tree as help");
{
  const { commandsRef } = await import(resolve(PLUGIN, "src", "scripts", "cli.ts"));
  const ref = await commandsRef();
  ok("it opens with a heading that says it is generated", ref.startsWith("# spn-devex commands") && ref.includes("Never edited by hand"), ref.slice(0, 200));
  ok("a line carries the bin, the words, the usage and what it does", ref.split("\n").some((line) => line.startsWith("spn-devex workstream row discard <workstream>/N<nnn> <row> --note") && line.includes(" — take a row found invalid")), ref);
  ok("the subject-less and subject lines both appear", ref.includes("spn-devex workstream rows show"));
}

console.log("\n=== row write — opens an arc, changes its header, adds and moves rows");
{
  const opened = cli(root, ["workstream", "row", "write", "031/N002", "--title", "the second arc", "--subject", "second", "--goal", "the second outcome"]);
  ok("an arc is opened as PROPOSED", opened.code === 0 && /ok · N002 0\/0 · N002 opened · PROPOSED/.test(opened.out), opened.out);
  const second = json(join(ws, "arcs", "N002", "state.json"));
  ok("its data holds the schema's header", second.schemaVersion === 2 && second.status === "PROPOSED" && second.preview === "preview.html" && second.rows.length === 0);
  const bare = cli(root, ["workstream", "row", "write", "031/N003"]);
  ok("red: an arc opened with no title is refused, exit 2", bare.code === 2 && bare.out.includes("opens N003 with `--title`, `--subject` and `--goal`: an arc opens only when all three are known, and until then its line stays in How (RD.DEVEX.WORKSPACE.254)."), bare.out);
  const added = cli(root, ["workstream", "row", "write", "031/N001", "3", "--title", "check it", "--kind", "fix", "--blocked-by", "2", "--touches", "marketplace:b,foundation:c"]);
  ok("a row is added", added.code === 0 && /row 3 added/.test(added.out), added.out);
  const three = json(arcFile).rows.find((row) => row.id === "3");
  ok("with its lists read at commas and its state waiting", three.state === "waiting" && three.touches.join() === "marketplace:b,foundation:c" && three.blockedBy.join() === "2");
  ok("a row added never puts the page behind", !/N001's part on the approach page is behind/.test(added.out), added.out);
  const moved = cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
  ok("a row's state moves, the log says from where, and no status line follows: RUNNING is worked out", moved.code === 0 && lines(log).at(-1).kind === "running" && lines(log).at(-1).note === "waiting → running" && /N001 reads RUNNING/.test(moved.out), `${moved.out}${JSON.stringify(lines(log).slice(-2))}`);
  const wrongKind = cli(root, ["workstream", "row", "write", "031/N001", "4", "--title", "x", "--kind", "chore"]);
  ok("red: a kind outside the set is refused with the set", wrongKind.code === 2 && wrongKind.out.includes("fix · change · question"), wrongKind.out);
  const wrongWait = cli(root, ["workstream", "row", "write", "031/N001", "4", "--title", "x", "--kind", "fix", "--blocked-by", "9"]);
  ok("red: a row waiting on a row the arc lacks is refused, and nothing is written", wrongWait.code === 2 && /waits on row 9/.test(wrongWait.out) && !json(arcFile).rows.some((row) => row.id === "4"), wrongWait.out);
  const mixed = cli(root, ["workstream", "row", "write", "031/N001", "--kind", "fix"]);
  ok("red: a row's field with no row named is refused", mixed.code === 2 && mixed.out.includes("row write <workstream>/N<nnn> <row> …"), mixed.out);
  const modelOnly = cli(root, ["workstream", "row", "write", "031/N001", "--model", "Opus 5.5"]);
  ok("red: a row-only flag with no row (--model) is refused naming the full form, and the arc is not written", modelOnly.code === 2 && modelOnly.out.includes("`--model`") && modelOnly.out.includes("row write <workstream>/N<nnn> <row> …"), modelOnly.out);
  const usageText = cli(root, ["workstream", "row"]);
  ok("the usage of row write and row discard prints <workstream>/N<nnn>", /row write <workstream>\/N<nnn> \[<row>\]/.test(usageText.out) && /row discard <workstream>\/N<nnn> <row>/.test(usageText.out) && !usageText.out.includes("<arc>"), usageText.out);
  const subjectAfter = cli(root, ["workstream", "031-probe", "row", "write", "--title", "x"]);
  ok("red: a subject placed after the group is refused, naming the right form", subjectAfter.code === 2 && subjectAfter.out.includes("spn-devex workstream row write 031-probe"), subjectAfter.out);
  const held = cli(root, ["workstream", "row", "write", "031/N001", "--status", "HELD"]);
  ok("red: HELD is no status, and the refusal names the stored set", held.code === 2 && held.out.includes("PROPOSED · DECIDED · LANDED · CARRIED · DROPPED"), held.out);
  const running = cli(root, ["workstream", "row", "write", "031/N001", "--status", "RUNNING", "--note", "the developer: go"]);
  ok("red: RUNNING is worked out from the steps, never written", running.code === 2 && running.out.includes("`RUNNING` is none of them"), running.out);
  const note = cli(root, ["workstream", "row", "write", "031/N001", "--note", "the developer: go"]);
  ok("--note alone writes a log line", note.code === 0 && lines(log).at(-1).note === "the developer: go", note.out);
  const nothing = cli(root, ["workstream", "row", "write", "031/N001", "1"]);
  ok("red: a write that changes nothing is refused", nothing.code === 2 && nothing.out.includes("changes nothing"), nothing.out);
}

console.log("\n=== rows show — every row, the ready ones, the ones side by side, the tree");
{
  cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
  cli(root, ["workstream", "row", "write", "031/N001", "5", "--title", "touches what 2 touches", "--kind", "fix", "--touches", "marketplace:b"]);
  const all = cli(root, ["workstream", "rows", "show", "031"]);
  ok("every row of every arc", all.code === 0 && /N001 1 +landed +write the book/.test(all.out) && /N001 5 /.test(all.out), all.out);
  const ready = cli(root, ["workstream", "rows", "show", "031", "--ready"]);
  ok("--ready: 2 is ready once 1 landed, 3 still waits on 2", /N001 2 /.test(ready.out) && !/N001 3 /.test(ready.out) && /N001 5 /.test(ready.out), ready.out);
  const side = cli(root, ["workstream", "rows", "show", "031", "--parallel", "--json"]);
  const ids = JSON.parse(side.out).map((row) => row.id);
  ok("--parallel: 2 and 5 both touch marketplace:b, so only one of them", ids.length === 1 && ids[0] === "2", side.out);
  cli(root, ["workstream", "row", "write", "031/N001", "5b", "--title", "under five", "--kind", "fix", "--parent", "5"]);
  const tree = cli(root, ["workstream", "rows", "show", "031/N001", "--tree"]);
  ok("--tree: a row under its parent is indented", /N001   5b/.test(tree.out), tree.out);
  ok("a row with a row under it loses its written state", !("state" in json(arcFile).rows.find((row) => row.id === "5")));
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
  ok("the row takes the outcome, proof, commits, cost and its order", two.state === "landed" && two.proof === "unit 12 ✓" &&
    two.commits["spn-x"][0] === "abc12345" && two.cost.tokens === 1500 && two.order === "orders/2.md", JSON.stringify(two));
  const twoB = json(arcFile).rows.find((row) => row.id === "2b");
  ok("a follow-up becomes a row beside it, waiting", twoB?.state === "waiting" && twoB.title === "tidy the words" && twoB.repo === "spn-x");
  put(ws, "notes/N001/orders/3.report.md", "---\nrow: \"3\"\noutcome: finished\n---\n");
  const bad = cli(root, ["workstream", "report", "write", "031", "notes/N001/orders/3.report.md"]);
  ok("red: an outcome outside the three is refused", bad.code === 2 && bad.out.includes("landed · stopped · needs-you"), bad.out);
  const nowhere = cli(root, ["workstream", "report", "write", "031", "notes/N001/plan.md"]);
  ok("red: a file that is no report is refused", nowhere.code === 2 && nowhere.out.includes("notes/N<nnn>/orders/<row>.report.md"), nowhere.out);
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

console.log("\n=== suggestion write — raised, then moved on");
{
  const raised = cli(root, ["workstream", "suggestion", "write", "031", "--title", "keep it as data"]);
  ok("a suggestion is raised with the next number", raised.code === 0 && raised.out.trim() === "s1 · raised", raised.out);
  const shaped = cli(root, ["workstream", "suggestion", "write", "031", "s1", "--state", "shaped", "--preview", "notes/N001/preview.html#p1"]);
  ok("and moved on", shaped.code === 0 && shaped.out.trim() === "s1 · shaped", shaped.out);
  const record = lines(join(ws, "suggestions.jsonl"))[0];
  ok("its record holds the preview it was shaped in", record.state === "shaped" && record.preview === "notes/N001/preview.html#p1" && record.words === null);
  const bad = cli(root, ["workstream", "suggestion", "write", "031", "s9", "--state", "decided"]);
  ok("red: a suggestion not recorded is refused", bad.code === 2 && bad.out.includes("finds no s9"), bad.out);
  const state = cli(root, ["workstream", "suggestion", "write", "031", "s1", "--state", "maybe"]);
  ok("red: a state outside the five is refused", state.code === 2 && state.out.includes("raised · shaped · decided · parked · dropped"), state.out);
}

console.log("\n=== progress write, and arc stamp write");
{
  const progress = cli(root, ["workstream", "progress", "write", "031"]);
  ok("the progress block is current after every write", progress.code === 0 && progress.out.trim() === "progress current", progress.out);
  ok("it reads the rows done and the arcs", /<span>0 of 2 arcs closed<\/span>/.test(readFileSync(join(ws, "approach.html"), "utf8")));
  const wrong = cli(root, ["workstream", "arc", "stamp", "031/N001"]);
  ok("red: `arc stamp` with no `write` is refused in the chapter's words", wrong.code === 2 && wrong.out.includes("is typed `arc stamp write <arc>`."), wrong.out);
  cli(root, ["workstream", "row", "write", "031/N009", "--title", "an arc the page does not list", "--subject", "unlisted", "--goal", "the unlisted outcome", "--note", "the developer: open it beside N002"]);
  // The opening write puts the arc's row on the page; this arc is the one whose row was taken off by hand.
  put(ws, "approach.html", readFileSync(join(ws, "approach.html"), "utf8").replace(/\s*<tr id="N009"[^\n]*<\/tr>/, ""));
  const noRow = cli(root, ["workstream", "arc", "stamp", "write", "031/N009"]);
  ok("red: an arc with no Cycles row is not stamped, and names `docs cycles write`", noRow.code === 1 && noRow.out.includes("docs cycles write"), noRow.out);
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
  const text = readFileSync(page, "utf8");
  put(ws, "approach.html", text.replace('<h4 id="N001-what">', '<li id="q7">an answer folded earlier</li>\n  <h4 id="N001-what">'));
  const raised = cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card.json"]);
  ok("the next number is past every anchor the page carries", raised.code === 0 && raised.out.startsWith("q8 · open · approach.html Open — Q8"), raised.out);
  ok("the card stands in the approach page's Open, under its heading", /<h2>Open &mdash; Q8<\/h2>/.test(readFileSync(page, "utf8")) && readFileSync(page, "utf8").includes('<h4 id="q8">'));
  const notPreview = cli(root, ["workstream", "question", "show", "031/q8", "--in", "notes/N001/plan.md"]);
  ok("red: a card is shown only on an arc's preview", notPreview.code === 2 && notPreview.out.includes("notes/N<nnn>/preview.html"), notPreview.out);
  const shown = cli(root, ["workstream", "question", "show", "031/q8", "--in", "notes/N001/preview.html"]);
  const preview = readFileSync(join(ws, "notes", "N001", "preview.html"), "utf8");
  ok("shown on the preview, with the line back to the approach page", shown.code === 0 && preview.includes('<h4 id="q8">') && preview.includes('href="../../approach.html#s4"'), shown.out);
  const key = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "Z", "--words", "Z"]);
  ok("red: an answer naming no option is refused with the options", key.code === 2 && key.out.includes("one of A · B"), key.out);
  cli(root, ["workstream", "suggestion", "write", "031", "--title", "x"]);
  put(root, "card2.json", JSON.stringify({ ...CARD, title: "a second question" }));
  cli(root, ["workstream", "question", "raise", "031/N001", "--file", "card2.json"]);
  const withdrawn = cli(root, ["workstream", "question", "withdraw", "031/q9", "--words", "not needed"]);
  ok("a card is withdrawn in your words, off its one page", withdrawn.code === 0 && withdrawn.out.startsWith("q9 · withdrawn · off 1 page · owed: its Log line"), withdrawn.out);
  const answered = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "A", "--words", "Q8 - A"]);
  ok("a card is answered, and the line says what is owed", answered.code === 0 && answered.out.startsWith("q8 · answered A · off 2 pages · owed: N001's What, its Log line"), answered.out);
  ok("it leaves both pages, and the preview drops its Open", !readFileSync(page, "utf8").includes('<h4 id="q8">') && !readFileSync(join(ws, "notes", "N001", "preview.html"), "utf8").includes("sds-open"));
  const record = lines(join(ws, "questions.jsonl")).find((one) => one.id === "q8");
  ok("the record holds the answer in your words", record.state === "answered" && record.answer.key === "A" && record.answer.words === "Q8 - A");
  const again = cli(root, ["workstream", "question", "answer", "031/q8", "--key", "A", "--words", "again"]);
  ok("red: a card already answered is not answered again", again.code === 2 && again.out.includes("q8 is answered"), again.out);
  ok("the arc's log carries the answer", lines(log).some((line) => line.kind === "answered" && /q8 A · Q8 - A/.test(line.note)));
}

console.log("\n=== row write — a status or a row state moved refreshes every view of it (RD.DEVEX.WORKSPACE.273)");
{
  const views = await dataWorkspace("commands-views");
  const header = (badge) => `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span>${badge}</span></div><h1>Probe</h1></header>\n`;
  const stale = '<span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-decided" href="../../approach.html#N001">DECIDED</a></span>';
  put(views.ws, "notes/N001/preview.html", `${header(stale)}<div class="sds-wrap"><section id="s1"><h2>Overview</h2></section></div>\n`);
  const page = join(views.ws, "approach.html");
  const preview = join(views.ws, "notes", "N001", "preview.html");
  cli(views.root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
  const landed = cli(views.root, ["workstream", "row", "write", "031/N001", "2", "--state", "landed"]);
  ok("red before the change: the last step landed names each view it rewrote", landed.code === 0 && /N001 2\/2 · row 2 · state · N001 reads LANDED · approach: (?:[a-z]+, )*cycles · preview badge/.test(landed.out), landed.out);
  const text = readFileSync(page, "utf8");
  ok("the Cycles table row shows LANDED, worked out from the steps, as its badge", /<tr id="N001"[^>]*>.*sds-status sds-landed">LANDED<\/span><\/td><\/tr>/s.test(text) && !text.includes("sds-decided"), text);
  ok("the status card moves with the arcs", /<div class="sds-eyebrow">(?:(?!<\/div>).)*sds-status sds-implementing">[^<]*IMPLEMENTING/s.test(text), text);
  ok("the preview's badge shows LANDED", readFileSync(preview, "utf8").includes('sds-status sds-landed" href="../../approach.html#N001">LANDED</a>'));
  ok("the data still stores the developer's DECIDED", json(join(views.ws, "arcs", "N001", "state.json")).status === "DECIDED");
  ok("no state check finding follows", !/state check/.test(landed.out), landed.out);
  const moved = cli(views.root, ["workstream", "row", "write", "031/N001", "1", "--title", "write the whole book"]);
  ok("a step's field moving with the views current writes none and names none", moved.code === 0 && !/approach:|preview badge/.test(moved.out), moved.out);
  const note = cli(views.root, ["workstream", "row", "write", "031/N001", "--note", "a line"]);
  ok("a note alone refreshes nothing", note.code === 0 && !/approach:|preview badge/.test(note.out), note.out);
}

console.log("\n=== row write --preview — a carried arc's Cycles row links where its notes now live (S137)");
{
  const carried = await dataWorkspace("commands-preview");
  const elsewhere = "../032-next/notes/N002/preview.html";
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/preview.html", "<meta charset=\"utf-8\">\n<section id=\"s1\"><h2>Overview</h2></section>\n");
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/samples/table.md", "| a |\n");
  const page = join(carried.ws, "approach.html");
  const wrong = cli(carried.root, ["workstream", "row", "write", "031/N001", "--preview", "../032-next/notes/N002/draft.html"]);
  ok("red: a path that does not end in preview.html is refused, and nothing is written",
    wrong.code === 2 && wrong.out.includes("`preview.html`") && json(join(carried.ws, "arcs", "N001", "state.json")).preview === "preview.html", wrong.out);
  const onRow = cli(carried.root, ["workstream", "row", "write", "031/N001", "1", "--preview", elsewhere]);
  ok("red: `--preview` belongs to the arc, never to a row", onRow.code === 2 && onRow.out.includes("`--preview`"), onRow.out);
  const moved = cli(carried.root, ["workstream", "row", "write", "031/N001", "--status", "CARRIED", "--reason", "to 032", "--preview", elsewhere, "--note", "the developer: move N001 to 032"]);
  const data = json(join(carried.ws, "arcs", "N001", "state.json"));
  ok("the path is written onto the arc's data", moved.code === 0 && data.preview === elsewhere && /N001 · status, preview|N001 · preview, status|preview/.test(moved.out), `${moved.out}\n${JSON.stringify(data.preview)}`);
  const cyclesRow = (/<tr id="N001"[^>]*>.*?<\/tr>/s.exec(readFileSync(page, "utf8")) ?? [""])[0];
  ok("the Cycles row links the preview and the sample where the notes now live, and not the empty folder",
    cyclesRow.includes(`href="${elsewhere}"`) && cyclesRow.includes('href="../032-next/notes/N002/samples/table.md"') && !cyclesRow.includes('href="notes/N001/preview.html"'), cyclesRow);
  ok("no state check finding asks for a preview at notes/N001/", !/has no preview/.test(moved.out), moved.out);
  const back = cli(carried.root, ["workstream", "row", "write", "031/N001", "--preview", "preview.html"]);
  ok("`--preview preview.html` gives the fixed place back, and the row links it again",
    back.code === 0 && json(join(carried.ws, "arcs", "N001", "state.json")).preview === "preview.html"
      && (/<tr id="N001"[^>]*>.*?<\/tr>/s.exec(readFileSync(page, "utf8")) ?? [""])[0].includes('href="notes/N001/preview.html"'), `${back.out}\n${readFileSync(page, "utf8")}`);
}

console.log("\n=== state show and state check");
{
  const show = cli(root, ["workstream", "state", "show", "031"]);
  ok("show: one line, the arcs, the cards and the suggestions", show.code === 0 && /^031 · N001 \d+\/\d+ · .*N002 proposed · N009 proposed · 0 open cards · 1 suggestion raised/.test(show.out.trim()), show.out);
  const asData = JSON.parse(cli(root, ["workstream", "state", "show", "031", "--json"]).out);
  ok("show --json: the same, as data", asData[0].workstream === "031-probe" && asData[0].arcs.length === 3);
  const check = cli(root, ["workstream", "state", "check", "031"]);
  ok("check: N009 has no Cycles row, and the check says so", check.code === 1 && /N009 \[stamp\] N009 has no row in Cycles/.test(check.out), check.out);
  const legacy = workspace("commands-legacy", { ".spndevex/workstreams/open/026-old/arcs/N001-old.md": "# N001 — old\n\nStatus: **RUNNING**\n" });
  const old = cli(legacy, ["workstream", "state", "show"]);
  ok("show: a workstream not moved yet says so", old.out.trim() === "026 · keeps its arcs as Markdown — not moved to the data layout yet", old.out);
}

console.log("\n=== row write — RUNNING and LANDED are worked out from the steps (RD.DEVEX.WORKSPACE.307)");
{
  const followed = await dataWorkspace("commands-follows");
  const file = join(followed.ws, "arcs", "N001", "state.json");
  const trail = join(followed.ws, "arcs", "N001", "log.jsonl");
  const before = lines(trail).length;
  const first = cli(followed.root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
  ok("a step started on a decided arc reads RUNNING, and the data keeps the developer's DECIDED", first.code === 0 && json(file).status === "DECIDED" && first.out.includes("N001 reads RUNNING"), first.out);
  ok("the log gains the step's line and no status line", lines(trail).slice(before).every((line) => line.kind !== "status"), JSON.stringify(lines(trail).slice(before)));
  cli(followed.root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
  const last = cli(followed.root, ["workstream", "row", "write", "031/N001", "2", "--state", "landed"]);
  ok("the last step landed reads LANDED, and asks for no write", last.out.includes("N001 reads LANDED") && !last.out.includes("--status LANDED") && json(file).status === "DECIDED", last.out);
  const reopened = cli(followed.root, ["workstream", "row", "write", "031/N001", "3", "--title", "one more thing", "--kind", "fix"]);
  ok("red: a step is never added to a landed arc: its fix goes on the review-fixes arc", reopened.code === 2 && reopened.out.includes("a landed arc is never reopened") && !json(file).rows.some((row) => row.id === "3"), reopened.out);
  const stored = cli(followed.root, ["workstream", "row", "write", "031/N001", "--status", "LANDED", "--note", "the developer: done"]);
  ok("red: LANDED is stored only on the review-fixes arc", stored.code === 2 && stored.out.includes("only the review-fixes arc stores it"), stored.out);

  const ready = await dataWorkspace("commands-follows-ready");
  const readyFile = join(ready.ws, "arcs", "N001", "state.json");
  cli(ready.root, ["workstream", "row", "write", "031/N001", "1", "--state", "ready"]);
  ok("a step written ready leaves a decided arc reading DECIDED", json(readyFile).status === "DECIDED" && !lines(join(ready.ws, "arcs", "N001", "log.jsonl")).some((line) => line.kind === "status"));
}

console.log("\n=== row write — steps may be written before the go, and none starts until DECIDED with no wait (RD.DEVEX.WORKSPACE.278, .311)");
{
  const plan = await dataWorkspace("commands-plan");
  const write = (...words) => cli(plan.root, ["workstream", "row", "write", ...words]);
  const second = join(plan.ws, "arcs", "N002", "state.json");
  const secondLog = join(plan.ws, "arcs", "N002", "log.jsonl");
  write("031/N002", "--title", "the second arc", "--subject", "second", "--goal", "the second outcome");
  const given = write("031/N002", "1", "--title", "build the bar", "--kind", "change");
  ok("a step written on a PROPOSED arc keeps the kind typed, a build step", given.code === 0 && json(second).rows[0].kind === "change", given.out);
  const bare = write("031/N002", "2", "--title", "draw the preview");
  ok("red: a step needs its kind", bare.code === 2 && bare.out.includes("with `--title` and `--kind`"), bare.out);
  const design = write("031/N002", "2", "--title", "read the code", "--kind", "design");
  ok("red: the kind design no longer exists: reading is a planning job", design.code === 2 && design.out.includes("fix · change · question"), design.out);
  const early = write("031/N002", "1", "--state", "running");
  ok("red: a step written running on a PROPOSED arc is refused, and its state stays",
    early.code === 2 && early.out.includes("a step starts only after the developer's go") && json(second).rows[0].state === "waiting", early.out);
  const noWords = write("031/N002", "--status", "DECIDED");
  ok("red: the go without the developer's words is refused, and the arc stays PROPOSED",
    noWords.code === 2 && noWords.out.includes("moves only with them in the same write") && json(second).status === "PROPOSED", noWords.out);
  put(plan.ws, "notes/N002/preview.html", [
    '<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-proposed" href="../../approach.html#N002">PROPOSED</a></span></span></div></header>',
    '<section id="s3"><h2>Proposed</h2>', "<p>The bar, as proposed.</p>", "<p>Nothing else.</p>", "</section>"].join("\n"));
  const go = write("031/N002", "--status", "DECIDED", "--wait", "the developer: approved, but wait", "--note", "the developer: approved, but wait");
  const status = lines(secondLog).filter((line) => line.kind === "status").at(-1);
  ok("the go with a wait stores DECIDED and the wait, its status line leading with the move and the words beside it",
    go.code === 0 && status?.note === "PROPOSED → DECIDED · the developer: approved, but wait" && json(second).status === "DECIDED" && json(second).wait === "the developer: approved, but wait", `${go.out}${JSON.stringify(status)}`);
  ok("the go lists each line of the preview that still says proposed, by its number, and not the masthead's badge or the Proposed heading",
    go.out.includes("the preview still says proposed in 1 line(s)") && go.out.includes("notes/N002/preview.html:3  The bar, as proposed.")
      && !go.out.includes("preview.html:1 ") && !go.out.includes("preview.html:2 "), go.out);
  const waited = write("031/N002", "1", "--state", "running");
  ok("red: no step starts while the wait holds, and the refusal quotes it", waited.code === 2 && waited.out.includes("holds the developer's wait, \"the developer: approved, but wait\""), waited.out);
  const silentStart = write("031/N002", "--start");
  ok("red: a start needs the developer's words", silentStart.code === 2 && silentStart.out.includes("a wait and a start are the developer's words"), silentStart.out);
  const start = write("031/N002", "--start", "--note", "the developer: start N002");
  ok("a start clears the wait, with its words on one status line", start.code === 0 && !json(second).wait && lines(secondLog).at(-1).note === "DECIDED · started · the developer: start N002", `${start.out}${JSON.stringify(lines(secondLog).at(-1))}`);
  const run = write("031/N002", "1", "--state", "running");
  ok("then the step starts, and the arc reads RUNNING", run.code === 0 && run.out.includes("N002 reads RUNNING"), run.out);
  const back = write("031/N002", "--status", "PROPOSED", "--note", "the developer: the goal moved, rethink N002");
  ok("a stored PROPOSED wins over the steps: the running step stops until the next go",
    back.code === 0 && json(second).rows[0].state === "stopped" && back.out.includes("stopped until the next go: 1 step(s)"), back.out);
  const dropped = write("031/N002", "--status", "DROPPED", "--reason", "not wanted", "--note", "the developer: drop it");
  ok("an arc decided before is dropped, with its reason", dropped.code === 0 && json(second).status === "DROPPED", dropped.out);
}

console.log("\n=== row write and arc delete — several arcs PROPOSED at once; one never decided is deleted (RD.DEVEX.WORKSPACE.280, .311)");
{
  const many = await dataWorkspace("commands-many");
  const write = (...words) => cli(many.root, ["workstream", "row", "write", ...words]);
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

console.log("\n=== row write --review-fixes — one arc takes every fix to a landed arc, and lands on the developer's word (RD.DEVEX.WORKSPACE.261)");
{
  const fixes = await dataWorkspace("commands-review-fixes");
  const write = (...words) => cli(fixes.root, ["workstream", "row", "write", ...words]);
  const file = join(fixes.ws, "arcs", "N009", "state.json");
  const silent = write("031/N009", "--title", "review fixes", "--subject", "review-fixes", "--goal", "every fix to a landed arc", "--review-fixes");
  ok("red: the review-fixes arc opens on the developer's words", silent.code === 2 && silent.out.includes("on the developer's words"), silent.out);
  const opened = write("031/N009", "--title", "review fixes", "--subject", "review-fixes", "--goal", "every fix to a landed arc", "--review-fixes", "--note", "the developer: fix the footer's gap");
  ok("it opens DECIDED on those words, marked as the review-fixes arc", opened.code === 0 && json(file).status === "DECIDED" && json(file).reviewFixes === true, opened.out);
  write("031/N009", "1", "--title", "N001: the footer's gap", "--kind", "fix", "--repo", "spn-x", "--altitude", "CODE");
  const fixed = write("031/N009", "1", "--state", "landed");
  ok("its steps all landed, it still reads RUNNING until the close", fixed.code === 0 && fixed.out.includes("N009 reads RUNNING"), fixed.out);
  const second = write("031/N010", "--title", "more fixes", "--subject", "more-fixes", "--goal", "more fixes", "--review-fixes", "--note", "the developer: fix it");
  ok("red: a workstream keeps one review-fixes arc", second.code === 2 && second.out.includes("keeps one review-fixes arc: N009"), second.out);
  const closed = write("031/N009", "--status", "LANDED", "--note", "the developer: close it");
  ok("the developer's word to close stores its LANDED", closed.code === 0 && json(file).status === "LANDED", closed.out);
}

console.log("\n=== row write — an arc opens whole: its data, its preview, its What entry and its stamped Cycles row (RD.DEVEX.WORKSPACE.254)");
{
  const whole = await dataWorkspace("commands-opening");
  const page = join(whole.ws, "approach.html");
  const domains = readFileSync(page, "utf8")
    .replace('  <h4 id="N001-what">The probe</h4>', '  <h3 id="d1">Platform &middot; Data and trust</h3>\n  <h4 id="N001-what">The probe</h4>')
    .replace('</section>\n<section id="s3"', '  <h3 id="d2">Second domain</h3>\n  <h4 id="c5">A subject heading</h4>\n  <p>its words</p>\n</section>\n<section id="s3"');
  writeFileSync(page, domains);
  const write = (...words) => cli(whole.root, ["workstream", "row", "write", ...words]);
  const goal = "Each control's evidence leaves as one file an auditor can read, named for the control.";
  const arcOf = (id) => join(whole.ws, "arcs", id);
  const noteOf = (id) => join(whole.ws, "notes", id, "preview.html");

  const noGoal = write("031/N003", "--title", "Evidence export", "--subject", "evidence-export", "--under", "d1");
  ok("red: an opening without --goal is refused in the chapter's words, exit 2", noGoal.code === 2
    && noGoal.out.includes("opens N003 with `--title`, `--subject` and `--goal`: an arc opens only when all three are known, and until then its line stays in How (RD.DEVEX.WORKSPACE.254)."), noGoal.out);
  ok("red: and nothing is written: no data, no preview, the page as it was", !existsSync(arcOf("N003")) && !existsSync(noteOf("N003")) && readFileSync(page, "utf8") === domains);

  const unknown = write("031/N003", "--title", "Evidence export", "--subject", "evidence-export", "--goal", goal, "--under", "d9");
  ok("red: an --under id What does not hold is refused, naming it", unknown.code === 2 && unknown.out.includes("finds no domain or subject heading `d9`"), unknown.out);
  ok("red: and nothing is written", !existsSync(arcOf("N003")) && !existsSync(noteOf("N003")) && readFileSync(page, "utf8") === domains);

  const opened = write("031/N003", "--title", "Evidence export", "--subject", "evidence-export", "--goal", goal, "--under", "d1");
  ok("the line names the four pieces", opened.code === 0 && opened.out.startsWith("ok · N003 0/0 · N003 opened · PROPOSED · preview · What entry · Cycles row\n"), opened.out);
  ok("and each piece's place, as drawn", opened.out.includes("  arcs/N003/state.json       written, with its log line and its name file, evidence-export.md\n")
    && opened.out.includes("  notes/N003/preview.html    written from the template: the masthead, the PROPOSED badge, the back link to #N003-what, four sections to fill\n")
    && opened.out.includes("  approach.html · What       #N003-what written under d1, Platform · Data and trust: the title, the goal, and the link to notes/N003/preview.html\n")
    && opened.out.includes("  approach.html · Cycles     row N003 written and stamped, its preview linked\n"), opened.out);
  ok("the data holds the goal, PROPOSED, and the fixed preview", json(join(arcOf("N003"), "state.json")).goal === goal && json(join(arcOf("N003"), "state.json")).status === "PROPOSED");
  const preview = readFileSync(noteOf("N003"), "utf8");
  ok("the preview is the template with its masthead filled: title, back link, title, arc, badge",
    preview.includes("<title>031 · N003 - Evidence Export</title>") && preview.includes('href="../../approach.html#N003-what">&larr; 031 - Probe</a>')
      && preview.includes("<h1>Evidence export</h1>") && preview.includes('href="../../approach.html#N003">N003</a>') && preview.includes("sds-status sds-proposed")
      && !preview.includes("{{NNN}}") && !preview.includes("{{nnn}}") && !preview.includes("{{THE PREVIEW NAME}}") && !preview.includes("RESTATES"), preview.slice(0, 1500));
  ok("the subtitle and the description stay slots for the agent", preview.includes("{{THE SUBTITLE") && preview.includes("{{THE DESCRIPTION"));
  const after = readFileSync(page, "utf8");
  const entry = '  <h4 id="N003-what">Evidence export</h4>\n  <p>Each control\'s evidence leaves as one file an auditor can read, named for the control.</p>\n  <p>Read the preview &rarr; <a href="notes/N003/preview.html">Evidence export</a></p>\n  <h3 id="d2">';
  ok("the What entry stands at the end of d1's part, before d2, with the title, the goal and the link", after.includes(entry), after);
  ok("the Cycles row is there, stamped", /<tr id="N003" data-arc="arcs\/N003\/state.json" data-arc-stamp="[0-9a-f]{12}">/.test(after) && after.includes('href="notes/N003/preview.html"'));
  const check = cli(whole.root, ["workstream", "state", "check", "031"]);
  ok("the workstream passes its own check at once", check.code === 0 && /whole/.test(check.out), check.out);

  const atEnd = write("031/N004", "--title", "Second export", "--subject", "second-export", "--goal", "A second outcome.");
  const endPage = readFileSync(page, "utf8");
  ok("with no --under the entry is written at the end of What", atEnd.code === 0 && atEnd.out.includes("#N004-what written at the end of What") && /<p>its words<\/p>\n  <h4 id="N004-what">Second export<\/h4>\n[^]*<\/section>\n<section id="s3"/.test(endPage), atEnd.out);

  // A bare write repairs what is missing, and changes nothing that is there.
  writeFileSync(noteOf("N003"), "<meta charset=\"utf-8\">\n<p>edited by the agent</p>\n");
  const kept = write("031/N003");
  ok("a bare write on a whole arc writes nothing", kept.code === 0 && kept.out.startsWith("ok · N003 · whole: nothing written"), kept.out);
  ok("a preview that is there is kept as the agent left it", readFileSync(noteOf("N003"), "utf8") === "<meta charset=\"utf-8\">\n<p>edited by the agent</p>\n");
  const bytes = readFileSync(page, "utf8");
  rmSync(noteOf("N004"));
  const filled = write("031/N004");
  ok("a bare write fills the preview it finds missing and keeps the entry and the row", filled.code === 0 && filled.out.startsWith("ok · N004 · preview written from the template · What entry kept · Cycles row kept"), filled.out);
  ok("the fresh preview is the template again, and the page is as it was", readFileSync(noteOf("N004"), "utf8").includes("<title>031 · N004 - Second Export</title>") && readFileSync(page, "utf8") === bytes);
  const twice = write("031/N004");
  ok("and a second bare write finds it whole", twice.out.startsWith("ok · N004 · whole: nothing written") && readFileSync(page, "utf8") === bytes, twice.out);

  writeFileSync(page, bytes.replace(/\s*<h4 id="N004-what">[^]*?<\/p>\n  <p>Read the preview[^\n]*N004[^\n]*<\/p>/, "").replace(/\s*<tr id="N004"[^\n]*<\/tr>/, ""));
  const both = write("031/N004");
  ok("a bare write writes the entry and the row it finds missing, and keeps the preview",
    both.code === 0 && both.out.includes("What entry: #N004-what written at the end of What") && both.out.includes("Cycles row written and stamped") && both.out.includes("preview kept"), both.out);
  ok("and the workstream passes its check again", cli(whole.root, ["workstream", "state", "check", "031"]).code === 0);

  // An existing arc takes the anchor on a subject heading.
  writeFileSync(page, readFileSync(page, "utf8").replace('<h4 id="N001-what">The probe</h4>', '<h4 id="c1">The probe</h4>'));
  const anchored = write("031/N001", "--under", "c1");
  ok("--under on a subject heading anchors an arc that already exists", anchored.code === 0
    && anchored.out.startsWith("ok · N001 · What entry: #N001-what anchored on c1 · preview kept · Cycles row kept"), anchored.out);
  ok("the anchor is a span on the heading, and the heading is as it was", readFileSync(page, "utf8").includes('<h4 id="c1"><span id="N001-what"></span>The probe</h4>'));
  ok("and the workstream passes its check", cli(whole.root, ["workstream", "state", "check", "031"]).code === 0);
  const noHeading = write("031/N001", "--under", "zz");
  ok("red: an anchor on a heading What does not hold is refused", noHeading.code === 2 && noHeading.out.includes("finds no domain or subject heading `zz`"), noHeading.out);
  const onRow = write("031/N001", "1", "--under", "c1");
  ok("red: --under belongs to the arc, never to a row", onRow.code === 2 && onRow.out.includes("`--under`"), onRow.out);

  // A carried arc keeps its preview where its preview field names it, and its entry links it there.
  const carried = await dataWorkspace("commands-opening-carried");
  const elsewhere = "../032-next/notes/N002/preview.html";
  put(carried.root, ".spndevex/workstreams/open/032-next/notes/N002/preview.html", "<meta charset=\"utf-8\">\n<section id=\"s1\"><h2>Overview</h2></section>\n");
  const moved = cli(carried.root, ["workstream", "row", "write", "031/N001", "--status", "CARRIED", "--reason", "to 032", "--preview", elsewhere, "--note", "the developer: move N001 to 032"]);
  ok("a carried arc's What entry follows the preview to where its field names it", moved.code === 0
    && readFileSync(join(carried.ws, "approach.html"), "utf8").includes(`<a href="${elsewhere}">the probe</a>`) && !/has no preview|not linked from its What entry/.test(moved.out), moved.out);
  const carriedBare = cli(carried.root, ["workstream", "row", "write", "031/N001"]);
  ok("a bare write on it writes no preview at notes/N001/ and says the arc is whole", carriedBare.out.startsWith("ok · N001 · whole: nothing written") && !existsSync(join(carried.ws, "notes", "N001", "preview.html.new")) && readFileSync(join(carried.ws, "notes", "N001", "preview.html"), "utf8").length > 0, carriedBare.out);
  const reopened = cli(carried.root, ["workstream", "state", "check", "031"]);
  ok("and the check finds the carried preview", !/has no preview/.test(reopened.out), reopened.out);
}

console.log("\n=== row discard — a row found invalid leaves the arc, in the developer's words (RD.DEVEX.WORKSPACE.279)");
{
  const base = { kind: "change", repo: "spn-x", altitude: "CODE", blockedBy: [], touches: [] };
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

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream commands` : `\n  all ${total} passed — workstream commands`);
process.exit(failed ? 1 : 0);
