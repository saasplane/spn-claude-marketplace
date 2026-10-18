// `commands/workstream/` — the only writers of what a script owns, run as the agent types them, in a
// throwaway workspace. Each command is shown answering in its line, writing its file, and refusing what
// it is typed with wrongly.
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
const lines = (path) => readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));

const { root, ws, git } = await dataWorkspace("commands");
const arcFile = join(ws, "arcs", "N001", "state.json");
const log = join(ws, "arcs", "N001", "log.jsonl");

console.log("=== help lists the group");
{
  const help = cli(root, ["help"]);
  for (const words of ["workstream state show", "workstream state check", "workstream rows show", "workstream row write", "workstream arc stamp",
    "workstream report write", "workstream fact write", "workstream suggestion write", "workstream progress write",
    "workstream question raise", "workstream question show", "workstream question answer", "workstream question withdraw"])
    ok(`help lists \`${words}\``, help.out.includes(words), words);
}

console.log("\n=== row write — opens an arc, changes its header, adds and moves rows");
{
  const opened = cli(root, ["workstream", "row", "write", "031/N002", "--title", "the second arc", "--subject", "second"]);
  ok("an arc is opened as PROPOSED", opened.code === 0 && /ok · N002 0\/0 · N002 opened · PROPOSED/.test(opened.out), opened.out);
  const second = json(join(ws, "arcs", "N002", "state.json"));
  ok("its data holds the schema's header", second.schemaVersion === 1 && second.status === "PROPOSED" && second.preview === "preview.html" && second.rows.length === 0);
  const bare = cli(root, ["workstream", "row", "write", "031/N003"]);
  ok("red: an arc opened with no title is refused, exit 2", bare.code === 2 && bare.out.includes("opens N003 with `--title` and `--subject`."), bare.out);
  const added = cli(root, ["workstream", "row", "write", "031/N001", "3", "--title", "check it", "--kind", "fix", "--blocked-by", "2", "--touches", "marketplace:b,foundation:c"]);
  ok("a row is added", added.code === 0 && /row 3 added/.test(added.out), added.out);
  const three = json(arcFile).rows.find((row) => row.id === "3");
  ok("with its lists read at commas and its state waiting", three.state === "waiting" && three.touches.join() === "marketplace:b,foundation:c" && three.blockedBy.join() === "2");
  ok("the write names the page left behind its rows", /N001's part on the approach page is behind its rows/.test(added.out), added.out);
  const moved = cli(root, ["workstream", "row", "write", "031/N001", "1", "--state", "running"]);
  ok("a row's state moves, and the log says from where", moved.code === 0 && lines(log).at(-1).kind === "running" && lines(log).at(-1).note === "waiting → running", JSON.stringify(lines(log).at(-1)));
  const wrongKind = cli(root, ["workstream", "row", "write", "031/N001", "4", "--title", "x", "--kind", "chore"]);
  ok("red: a kind outside the set is refused with the set", wrongKind.code === 2 && wrongKind.out.includes("fix · change · question"), wrongKind.out);
  const wrongWait = cli(root, ["workstream", "row", "write", "031/N001", "4", "--title", "x", "--kind", "fix", "--blocked-by", "9"]);
  ok("red: a row waiting on a row the arc lacks is refused, and nothing is written", wrongWait.code === 2 && /waits on row 9/.test(wrongWait.out) && !json(arcFile).rows.some((row) => row.id === "4"), wrongWait.out);
  const mixed = cli(root, ["workstream", "row", "write", "031/N001", "--kind", "fix"]);
  ok("red: a row's field with no row named is refused", mixed.code === 2 && mixed.out.includes("name the row after the arc"), mixed.out);
  const held = cli(root, ["workstream", "row", "write", "031/N001", "--status", "HELD"]);
  ok("red: HELD with no reason is refused", held.code === 2 && /carries no `reason`/.test(held.out), held.out);
  const heldWith = cli(root, ["workstream", "row", "write", "031/N001", "--status", "HELD", "--reason", "waits on q1"]);
  ok("HELD with its reason is written", heldWith.code === 0 && json(arcFile).status === "HELD" && json(arcFile).reason === "waits on q1", heldWith.out);
  cli(root, ["workstream", "row", "write", "031/N001", "--status", "RUNNING"]);
  ok("leaving HELD clears the reason", json(arcFile).reason === null);
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
  cli(root, ["workstream", "row", "write", "031/N009", "--title", "an arc the page does not list", "--subject", "unlisted"]);
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
  put(ws, "approach.html", text.replace('<h4 id="c1">', '<li id="q7">an answer folded earlier</li>\n  <h4 id="c1">'));
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
  const landed = cli(views.root, ["workstream", "row", "write", "031/N001", "--status", "LANDED"]);
  ok("red before the change: the line names each view it rewrote", landed.code === 0 && /N001 0\/2 · N001 · status · approach: card, cycles · preview badge/.test(landed.out), landed.out);
  const text = readFileSync(page, "utf8");
  ok("the Cycles table row shows LANDED as its badge", /<tr id="N001"[^>]*>.*sds-status sds-landed">LANDED<\/span><\/td><\/tr>/s.test(text) && !text.includes("sds-decided"), text);
  ok("the status card moves with the arcs", /<div class="sds-eyebrow">(?:(?!<\/div>).)*sds-status sds-implementing">[^<]*IMPLEMENTING/s.test(text), text);
  ok("the preview's badge shows LANDED", readFileSync(preview, "utf8").includes('sds-status sds-landed" href="../../approach.html#N001">LANDED</a>'));
  ok("no state check finding follows", !/state check/.test(landed.out), landed.out);
  const moved = cli(views.root, ["workstream", "row", "write", "031/N001", "1", "--state", "landed"]);
  ok("a row's state moving with the views current writes none and names none", moved.code === 0 && !/approach:|preview badge/.test(moved.out), moved.out);
  const note = cli(views.root, ["workstream", "row", "write", "031/N001", "--note", "a line"]);
  ok("a note alone refreshes nothing", note.code === 0 && !/approach:|preview badge/.test(note.out), note.out);
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

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream commands` : `\n  all ${total} passed — workstream commands`);
process.exit(failed ? 1 : 0);
