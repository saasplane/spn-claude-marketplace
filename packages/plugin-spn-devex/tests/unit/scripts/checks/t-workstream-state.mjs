// `checks/workstream-state.ts` — `workstream state check` as a function. Each check is made to fail
// once on a fixture that breaks it, and to pass once the fixture is mended the way the agent would.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arcData, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkWorkstream, checkWorkspace, sectionText } = await import("../../../../src/scripts/checks/workstream-state.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const said = (findings) => findings.map((one) => `[${one.check}] ${one.message}`).join(" | ");
const has = (findings, check, pattern) => findings.some((one) => one.check === check && pattern.test(one.message));

console.log("=== a whole workstream");
{
  const { ws } = await dataWorkspace("state-whole");
  const findings = checkWorkstream(ws);
  ok("green: a workstream kept as data and whole has no finding", findings.length === 0, said(findings));
}

console.log("\n=== S7 — the stamp on each arc's Cycles row");
{
  const { root, ws } = await dataWorkspace("state-stamp");
  const file = join(ws, "arcs", "N001", "state.json");
  const data = arcData();
  data.rows.push({ id: "3", parent: "N001", title: "a row the page has not taken in", kind: "change", state: "waiting" });
  writeFileSync(file, JSON.stringify(data, null, 2));
  const red = checkWorkstream(ws);
  ok("red: a row added with the page left behind fails", has(red, "stamp", /N001's part on the approach page is behind its rows/), said(red));
  ok("the finding names the command that restamps", has(red, "stamp", /workstream arc stamp write N001/));
  const stamped = cli(root, ["workstream", "arc", "stamp", "write", "031/N001"]);
  ok("`arc stamp write` restamps the row", stamped.code === 0 && /N001 · stamped [0-9a-f]{12}/.test(stamped.out), stamped.out);
  ok("green: after the restamp the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  data.rows[0].state = "landed";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: a row's state moving leaves the stamp current", !has(checkWorkstream(ws), "stamp", /behind/));
  const page = join(ws, "approach.html");
  const text = readFileSync(page, "utf8");
  writeFileSync(page, text.replace(/<tr id="N001" data-arc="arcs\/N001\/state.json"[^>]*>/, "<tr>"));
  ok("red: an arc with no row in Cycles fails", has(checkWorkstream(ws), "stamp", /has no row in Cycles/), said(checkWorkstream(ws)));
  writeFileSync(page, text.replace('<a href="notes/N001/preview.html">the probe</a>', "the probe"));
  ok("red: an arc whose preview What does not link fails", has(checkWorkstream(ws), "stamp", /not linked from the page's What/), said(checkWorkstream(ws)));
  writeFileSync(page, text);
  ok("green: the page put back passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.273 — a view of an arc's status that disagrees with the arc is a finding");
{
  const { root, ws } = await dataWorkspace("state-views");
  const page = join(ws, "approach.html");
  const preview = join(ws, "notes", "N001", "preview.html");
  const original = readFileSync(page, "utf8");
  const badge = (word) => `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-${word.toLowerCase()}" href="../../approach.html#N001">${word}</a></span></span></div><h1>Probe</h1></header>\n<div class="sds-wrap"></div>\n`;
  writeFileSync(preview, badge("DECIDED"));
  ok("green: a preview badge that shows the arc's status passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  writeFileSync(preview, badge("LANDED"));
  const redBadge = checkWorkstream(ws);
  ok("red: a hand-edited preview badge fails, naming the arc, the view and the command", has(redBadge, "views", /N001's preview badge does not show DECIDED — `spn-devex docs cycles write 031`/), said(redBadge));
  const mended = cli(root, ["docs", "cycles", "write", "031"]);
  ok("`docs cycles write` mends it", mended.code === 0 && checkWorkstream(ws).length === 0, `${mended.out} ${said(checkWorkstream(ws))}`);
  writeFileSync(page, original.replace('sds-decided">DECIDED', 'sds-running">RUNNING'));
  const redRow = checkWorkstream(ws);
  ok("red: a Cycles row showing another status fails", has(redRow, "views", /N001 reads RUNNING in the approach page's Cycles table and its data reads DECIDED — `spn-devex docs cycles write 031`/), said(redRow));
  writeFileSync(page, original.replace('sds-planning">&#x1F52E; PLANNING', 'sds-implementing">&#x1F6A7; IMPLEMENTING'));
  const redCard = checkWorkstream(ws);
  ok("red: a status card that disagrees with the arcs fails", has(redCard, "views", /status card reads IMPLEMENTING and the arcs give PLANNING/), said(redCard));
  writeFileSync(page, original);
  ok("green: the page put back passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.263 — every arc has an address, its Cycles row's id");
{
  const { root, ws } = await dataWorkspace("state-address");
  const page = join(ws, "approach.html");
  const text = readFileSync(page, "utf8");
  writeFileSync(page, text.replace('<tr id="N001" ', "<tr "));
  const red = checkWorkstream(ws);
  ok("red: a Cycles row with no id fails, naming the address it leaves empty", has(red, "stamp", /carries no `id="N001"`, so `approach.html#N001` opens nothing/), said(red));
  const wrote = cli(root, ["docs", "cycles", "write", "031"]);
  ok("`docs cycles write` gives the row its id", wrote.code === 0 && readFileSync(page, "utf8").includes('<tr id="N001" data-arc="arcs/N001/state.json"'), wrote.out);
  ok("green: the row under its address passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.264 and .265 — the goal, the name file, a short subject");
{
  const { root, ws } = await dataWorkspace("state-name");
  const file = join(ws, "arcs", "N001", "state.json");
  const name = join(ws, "arcs", "N001", "probe.md");
  const data = arcData();
  writeFileSync(file, JSON.stringify({ ...data, goal: null }, null, 2));
  const noGoal = checkWorkstream(ws);
  ok("red: an arc with no goal is named, with the command that sets it", has(noGoal, "name", /N001 has no goal — `spn-devex workstream row write N001 --goal/), said(noGoal));
  const set = cli(root, ["workstream", "row", "write", "031/N001", "--goal", "the probe is answered"]);
  ok("green: `row write --goal` sets it and writes the name file with it", set.code === 0 && checkWorkstream(ws).length === 0 &&
    readFileSync(name, "utf8").includes("**Goal.** the probe is answered"), set.out + said(checkWorkstream(ws)));
  const good = readFileSync(name, "utf8");
  writeFileSync(name, good.replace("**Status.** DECIDED", "**Status.** LANDED"));
  ok("red: a hand edit of the name file is named", has(checkWorkstream(ws), "name", /`arcs\/N001\/probe.md` is not what the commands write/), said(checkWorkstream(ws)));
  writeFileSync(name, good);
  writeFileSync(join(ws, "arcs", "N001", "notes.md"), "# mine\n");
  ok("red: a second Markdown file in the data folder is named", has(checkWorkstream(ws), "name", /`arcs\/N001\/notes.md` is a second Markdown file/), said(checkWorkstream(ws)));
  rmSync(join(ws, "arcs", "N001", "notes.md"));
  rmSync(name);
  ok("red: a missing name file is named", has(checkWorkstream(ws), "name", /has no name file `arcs\/N001\/probe.md`/), said(checkWorkstream(ws)));
  cli(root, ["docs", "cycles", "write", "031"]);
  ok("green: `docs cycles write` writes it back", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  const long = cli(root, ["workstream", "row", "write", "031/N001", "--subject", "web-stack-and-partner-choices"]);
  ok("red: `row write --subject` refuses a subject of more than three words", long.code !== 0 && /is 5 words, and a subject is one to three/.test(long.out), long.out);
  writeFileSync(file, JSON.stringify({ ...data, subject: "the-probe-of-everything" }, null, 2));
  ok("red: the check names a long subject already in the data", has(checkWorkstream(ws), "name", /subject `the-probe-of-everything` is 4 words/), said(checkWorkstream(ws)));
  const short = cli(root, ["workstream", "row", "write", "031/N001", "--subject", "probe"]);
  ok("green: a short subject written, the file renamed with it", short.code === 0 && checkWorkstream(ws).length === 0, short.out + said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.262 — notes/ and arcs/ hold only arc folders");
{
  const { ws } = await dataWorkspace("state-levels");
  writeFileSync(join(ws, "notes", "ideation.md"), "# how the idea arrived\n");
  writeFileSync(join(ws, "notes", "N001-inventory.md"), "# what exists\n");
  mkdirSync(join(ws, "notes", "shots"), { recursive: true });
  const red = checkWorkstream(ws);
  ok("red: a note loose at notes/ goes to the first open arc's plan, since it names none",
    has(red, "notes", /`notes\/ideation.md` is not an arc's folder .* `notes\/N001\/plan.md`, the workstream's first open arc/), said(red));
  ok("red: a note naming its arc goes to that arc's plan", has(red, "notes", /`notes\/N001-inventory.md` .* `notes\/N001\/plan.md`, the arc it names/), said(red));
  ok("red: a folder loose at notes/ is named", has(red, "notes", /`notes\/shots\/` is not an arc's folder/), said(red));
  writeFileSync(join(ws, "arcs", "index.txt"), "x");
  ok("red: a file loose at arcs/ is named", has(checkWorkstream(ws), "notes", /`arcs\/index.txt` is not an arc's folder/), said(checkWorkstream(ws)));
  for (const one of ["notes/ideation.md", "notes/N001-inventory.md", "arcs/index.txt"]) rmSync(join(ws, one));
  rmSync(join(ws, "notes", "shots"), { recursive: true });
  writeFileSync(join(ws, "notes", ".DS_Store"), "");
  ok("green: folded away, and a dot-file is no one's", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== Q99 — one preview per arc, by its fixed name");
{
  const { ws } = await dataWorkspace("state-preview");
  const notes = join(ws, "notes", "N001");
  mkdirSync(join(notes, "previews"), { recursive: true });
  ok("red: a previews/ folder fails", has(checkWorkstream(ws), "preview", /keeps a `previews\/` folder/), said(checkWorkstream(ws)));
  rmSync(join(notes, "previews"), { recursive: true });
  writeFileSync(join(notes, "layout-preview.html"), "<p>a second</p>");
  ok("red: a second preview by another name fails", has(checkWorkstream(ws), "preview", /layout-preview\.html` is a second preview/), said(checkWorkstream(ws)));
  rmSync(join(notes, "layout-preview.html"));
  renameSync(join(notes, "preview.html"), join(notes, "draft.html"));
  ok("red: an arc past PROPOSED with no preview fails", has(checkWorkstream(ws), "preview", /DECIDED and has no preview/), said(checkWorkstream(ws)));
  renameSync(join(notes, "draft.html"), join(notes, "preview.html"));
  mkdirSync(join(notes, "samples"), { recursive: true });
  writeFileSync(join(notes, "samples", "badge-dark.png"), "png");
  ok("green: samples stay beside the one preview", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RD.DEVEX.WORKSPACE.267 — a sample is the work's own file, never a page built with the page template");
{
  const { root, ws } = await dataWorkspace("state-samples");
  const samples = join(ws, "notes", "N001", "samples");
  const stylesheet = `<link rel="stylesheet" href="https://saasplane.github.io/spn-claude-marketplace/assets/docs/1.7.0/sds-docs.css">`;
  const masthead = (type) => `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line">${type ? `<span class="sds-label">Type:</span> <span class="sds-badge sds-type">${type}</span>` : ""}</span></div><h1>Find in a list</h1></header>`;
  mkdirSync(join(samples, "patterns"), { recursive: true });
  writeFileSync(join(samples, "patterns", "find-in-a-list.html"), `<meta charset="utf-8">\n${stylesheet}\n<div class="sds-page">${masthead("Sample")}<svg class="sds-drawing"></svg></div>\n`);
  writeFileSync(join(samples, "about.html"), `<meta charset="utf-8">\n${stylesheet}\n${masthead("")}\n`);
  const red = checkWorkstream(ws);
  ok("red: a sample with the shared stylesheet and a masthead whose Type is Sample is named, in a sub-folder too",
    has(red, "samples", /`notes\/N001\/samples\/patterns\/find-in-a-list\.html` is built with the page template/), said(red));
  ok("red: one with a masthead and no Type is named", has(red, "samples", /`notes\/N001\/samples\/about\.html` is built with the page template/), said(red));
  ok("the finding says what a sample is and where many are browsed", has(red, "samples", /the work's own file in its own format, browsed through `samples\/index\.html`/), said(red));
  const command = cli(root, ["workstream", "state", "check", "031"]);
  ok("the command exits 1 and prints the [samples] finding", command.code === 1 && /031-probe N001 \[samples\]/.test(command.out), command.out);
  writeFileSync(join(samples, "patterns", "find-in-a-list.html"), `<!doctype html>\n${stylesheet}\n<main><svg class="sds-drawing"></svg></main>\n`);
  rmSync(join(samples, "about.html"));
  writeFileSync(join(samples, "index.html"), `<!doctype html>\n<title>Samples of N001</title>\n<nav><a href="patterns/find-in-a-list.html">Find in a list</a></nav>\n`);
  writeFileSync(join(samples, "approach-sample.html"), `<meta charset="utf-8">\n${stylesheet}\n${masthead("Approach")}\n`);
  writeFileSync(join(samples, "screen.html"), `<!doctype html>\n<header class="sds-masthead">its own look</header>\n`);
  mkdirSync(join(samples, "template-review"), { recursive: true });
  writeFileSync(join(samples, "template-review", "blocks-template.html"), `<meta charset="utf-8">\n${stylesheet}\n${masthead("")}\n`);
  writeFileSync(join(samples, "template-review", "approach-template-v2.html"), `<meta charset="utf-8">\n${stylesheet}\n${masthead("")}\n`);
  const green = checkWorkstream(ws);
  ok("green: a drawing that borrows the stylesheet with no masthead, a plain index, a book page the work produces, a review copy of a book template named for it, and a page with its own styles pass",
    green.length === 0, said(green));
}

console.log("\n=== RD.DEVEX.WORKSPACE.262 — an arc's notes folder holds the five, and nothing else");
{
  const { root, ws } = await dataWorkspace("state-notes-tree");
  const notes = join(ws, "notes", "N001");
  mkdirSync(join(notes, "shots"), { recursive: true });
  writeFileSync(join(notes, "shots", "rail-dark.png"), "png");
  writeFileSync(join(notes, "answered-cards.md"), "# answered\n");
  writeFileSync(join(notes, "inventory.md"), "# what exists\n");
  writeFileSync(join(notes, "orders"), "not a folder");
  const red = checkWorkstream(ws);
  ok("red: a folder of screenshots beside the five is named, and sent to samples/", has(red, "notes", /`notes\/N001\/shots\/` is not one of the five .* belongs in `samples\/`/), said(red));
  ok("red: a card file is sent to questions.jsonl, checked for duplicates", has(red, "notes", /answered-cards\.md` .* `questions\.jsonl`.*checked against the records/), said(red));
  ok("red: a note is sent to a section of plan.md", has(red, "notes", /inventory\.md` .* a section of `plan\.md`/), said(red));
  ok("red: one of the five made as the other kind is named", has(red, "notes", /`notes\/N001\/orders` .* `orders` itself, which is a folder and never a file/), said(red));
  const command = cli(root, ["workstream", "state", "check"]);
  ok("the command exits 1 and prints the [notes] finding", command.code === 1 && /031-probe N001 \[notes\]/.test(command.out), command.out);
  rmSync(join(notes, "orders"));
  mkdirSync(join(notes, "samples"), { recursive: true });
  renameSync(join(notes, "shots"), join(notes, "samples", "shots"));
  writeFileSync(join(notes, "plan.md"), "# N001 plan\n\n## What exists\n");
  rmSync(join(notes, "inventory.md"));
  rmSync(join(notes, "answered-cards.md"));
  writeFileSync(join(notes, ".DS_Store"), "");
  ok("green: folded into the five — a folder inside samples/ and a dot-file are no one's finding", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  mkdirSync(join(notes, "previews"), { recursive: true });
  const previews = checkWorkstream(ws);
  ok("a previews/ folder is named once, by the one-preview check", previews.length === 1 && previews[0].check === "preview", said(previews));
}

console.log("\n=== the life of an arc — the files of every step it has passed");
{
  const { ws } = await dataWorkspace("state-steps");
  rmSync(join(ws, "notes", "N001", "plan.md"));
  ok("red: a decided arc with no plan fails", has(checkWorkstream(ws), "steps", /DECIDED and has no `notes\/N001\/plan.md`/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "notes", "N001", "plan.md"), "# plan\n");
  const data = JSON.parse(readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8"));
  data.rows[0].state = "landed";
  data.rows[0].order = "orders/1.md";
  writeFileSync(join(ws, "arcs", "N001", "state.json"), JSON.stringify(data));
  ok("red: a landed row with an order and no report fails", has(checkWorkstream(ws), "steps", /row 1 landed and its report/), said(checkWorkstream(ws)));
  put(ws, "notes/N001/orders/1.report.md", "---\nrow: \"1\"\noutcome: landed\n---\n");
  ok("green: the report there, the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  mkdirSync(join(ws, "notes", "N002"), { recursive: true });
  ok("red: a notes folder with no arc data fails", has(checkWorkstream(ws), "steps", /`notes\/N002\/` has no `arcs\/N002\/state.json`/), said(checkWorkstream(ws)));
  rmSync(join(ws, "notes", "N002"), { recursive: true });
}

console.log("\n=== the schema — data that does not hold");
{
  const { ws } = await dataWorkspace("state-schema");
  const file = join(ws, "arcs", "N001", "state.json");
  const good = readFileSync(file, "utf8");
  writeFileSync(file, good.replace('"DECIDED"', '"OPEN"'));
  ok("red: a status outside the eight fails", has(checkWorkstream(ws), "schema", /`status` is `OPEN`/), said(checkWorkstream(ws)));
  writeFileSync(file, "{ not json");
  ok("red: a state.json that is not JSON fails", has(checkWorkstream(ws), "schema", /is not JSON/), said(checkWorkstream(ws)));
  writeFileSync(file, good);
  writeFileSync(join(ws, "arcs", "N001", "log.jsonl"), '{"at":"t","kind":"added"}\nnot json\n');
  ok("red: a log line that is not JSON fails", has(checkWorkstream(ws), "schema", /log.jsonl line 2 is not JSON/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "arcs", "N001", "log.jsonl"), '{"at":"t","kind":"added"}\n');
  writeFileSync(join(ws, "suggestions.jsonl"), '{"id":"s1","title":"x","state":"maybe","preview":null,"words":null}\n');
  ok("red: a suggestion state outside the five fails", has(checkWorkstream(ws), "schema", /suggestions.jsonl line 1/), said(checkWorkstream(ws)));
  writeFileSync(join(ws, "suggestions.jsonl"), '{"id":"s1","title":"x","state":"raised","preview":null,"words":null}\n');
  ok("green: every file mended, the check passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== open and backlog follow the standard; closed stays as it closed");
{
  const root = workspace("state-layout", {
    ".spndevex/workstreams/open/026-old/arcs/N001-old.md": "# N001 — old\n\nStatus: **RUNNING**\n",
    ".spndevex/workstreams/closed/020-done/arcs/N001-done.md": "# N001 — done\n\nStatus: **LANDED**\n",
  });
  const findings = checkWorkspace(root);
  ok("red: an open workstream keeping its arcs as Markdown is named for the move", has(findings, "layout", /keeps 1 arc\(s\) as Markdown/), said(findings));
  ok("a closed workstream is never read", !findings.some((one) => one.workstream === "020-done"));
  const moved = cli(root, ["workstream", "state", "check"]);
  ok("the command exits 1 on a finding, and names it", moved.code === 1 && /026-old \[layout\]/.test(moved.out), moved.out);
}

console.log("\n=== a section of a page, by its heading");
{
  const text = "<h2>What</h2><p>in what</p><h2>How</h2><p>in how</p>";
  ok("the part under What stops at the next h2", sectionText(text, "What") === "<p>in what</p>");
  ok("a page with no such heading gives nothing", sectionText(text, "Why") === "");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream state check` : `\n  all ${total} passed — workstream state check`);
process.exit(failed ? 1 : 0);
