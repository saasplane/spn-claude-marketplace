// `checks/workstream-state.ts` — `workstream state check` as a function. Each check is made to fail
// once on a fixture that breaks it, and to pass once the fixture is mended the way the agent would.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PREVIEW, arcData, cli, dataWorkspace, put } from "../../../helpers/workstream-fixture.mjs";
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

console.log("\n=== S7 — the stamp on each arc's Cycles row: its goal, title and repositories");
{
  const { root, ws } = await dataWorkspace("state-stamp");
  const file = join(ws, "arcs", "N001", "state.json");
  const data = arcData();
  data.rows.push({ id: "3", parent: "N001", title: "a row the page has not taken in", kind: "change", repo: "spn-x", altitude: "CODE", state: "waiting" });
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: a row added inside the arc's repositories never puts the page behind", !has(checkWorkstream(ws), "stamp", /behind/), said(checkWorkstream(ws)));
  data.goal = "another outcome";
  writeFileSync(file, JSON.stringify(data, null, 2));
  const red = checkWorkstream(ws);
  ok("red: the goal changed with the page left behind fails", has(red, "stamp", /N001's part on the approach page is behind its goal, title or repositories/), said(red));
  ok("the finding names the command that restamps", has(red, "stamp", /workstream arc stamp write N001/));
  cli(root, ["docs", "cycles", "write", "031"]);
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
  ok("red: an arc whose preview its What entry does not link fails", has(checkWorkstream(ws), "stamp", /N001's preview is not linked from its What entry, `#N001-what`/), said(checkWorkstream(ws)));
  writeFileSync(page, text);
  // The row landed by hand moved the status the steps work out, so the page's views and the name file wait for their command.
  const apart = (findings) => findings.filter((one) => !["status", "views", "name"].includes(one.check));
  ok("green: the page put back passes", apart(checkWorkstream(ws)).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.273 — a view of an arc's status that disagrees with the arc is a finding");
{
  const { root, ws } = await dataWorkspace("state-views");
  const page = join(ws, "approach.html");
  const preview = join(ws, "notes", "N001", "preview.html");
  const original = readFileSync(page, "utf8");
  const badge = (word) => `<header class="sds-masthead"><div class="sds-eyebrow"><span class="sds-line"><span class="sds-label">Type:</span> <span class="sds-badge sds-type">Preview</span><span class="sds-separator">|</span><span class="sds-label">Arc:</span> <a class="sds-badge" href="../../approach.html#N001">N001</a><span class="sds-state"><span class="sds-label">Status:</span> <a class="sds-badge sds-status sds-${word.toLowerCase()}" href="../../approach.html#N001">${word}</a></span></span></div><h1>Probe</h1></header>\n<div class="sds-wrap"></div>\n`;
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

console.log("\n=== RULE.DEVEX.WORKSPACE.263 — every arc has an address, its Cycles row's id");
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

console.log("\n=== RULE.DEVEX.WORKSPACE.264 and .265 — the goal, the name file, a short subject");
{
  const { root, ws } = await dataWorkspace("state-name");
  const file = join(ws, "arcs", "N001", "state.json");
  const name = join(ws, "arcs", "N001", "probe.md");
  const data = arcData();
  writeFileSync(file, JSON.stringify({ ...data, goal: null }, null, 2));
  const noGoal = checkWorkstream(ws);
  ok("red: an arc with no goal is named, with the command that sets it", has(noGoal, "name", /N001 has no goal — `spn-devex workstream arc edit N001 --goal/), said(noGoal));
  const set = cli(root, ["workstream", "arc", "edit", "031/N001", "--goal", "the probe is answered"]);
  ok("green: `arc edit --goal` sets it and writes the name file with it", set.code === 0 && checkWorkstream(ws).length === 0 &&
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
  const long = cli(root, ["workstream", "arc", "edit", "031/N001", "--subject", "web-stack-and-partner-choices"]);
  ok("red: `arc edit --subject` refuses a subject of more than three words", long.code !== 0 && /is 5 words, and a subject is one to three/.test(long.out), long.out);
  writeFileSync(file, JSON.stringify({ ...data, subject: "the-probe-of-everything" }, null, 2));
  ok("red: the check names a long subject already in the data", has(checkWorkstream(ws), "name", /subject `the-probe-of-everything` is 4 words/), said(checkWorkstream(ws)));
  const short = cli(root, ["workstream", "arc", "edit", "031/N001", "--subject", "probe"]);
  ok("green: a short subject written, the file renamed with it", short.code === 0 && checkWorkstream(ws).length === 0, short.out + said(checkWorkstream(ws)));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.262 — notes/ and arcs/ hold only arc folders");
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
  const page = join(ws, "approach.html");
  const text = readFileSync(page, "utf8");
  writeFileSync(page, text.replace('<a href="notes/N001/preview.html">the probe</a>', "the probe"));
  ok("red: an arc with no preview fails, every arc having one from the write that opens it",
    has(checkWorkstream(ws), "preview", /N001 has no preview — every arc has one, `notes\/N001\/preview\.html`, written when it opens; `spn-devex workstream arc edit 031\/N001` writes it from the template \(RULE\.DEVEX\.WORKSPACE\.254\)/), said(checkWorkstream(ws)));
  writeFileSync(page, text);
  renameSync(join(notes, "draft.html"), join(notes, "preview.html"));
  mkdirSync(join(notes, "samples"), { recursive: true });
  writeFileSync(join(notes, "samples", "badge-dark.png"), "png");
  ok("green: samples stay beside the one preview", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.254 — a What entry of its own, and a link to another arc by its What");
{
  const { root, ws } = await dataWorkspace("state-what");
  const page = join(ws, "approach.html");
  const whole = readFileSync(page, "utf8");
  const arcFile = (arc) => join(ws, "arcs", arc, "state.json");
  const second = { ...arcData(), arc: "N002", subject: "second", title: "the second arc", status: "PROPOSED", rows: [] };
  const open = (text) => {
    mkdirSync(join(ws, "arcs", "N002"), { recursive: true });
    mkdirSync(join(ws, "notes", "N002"), { recursive: true });
    writeFileSync(arcFile("N002"), JSON.stringify(second, null, 2));
    writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW);
    writeFileSync(page, text);
    cli(root, ["docs", "cycles", "write", "031"]);
    cli(root, ["workstream", "arc", "stamp", "write", "031/N002"]);
  };
  const entry2 = `  <h4 id="N002-what">The second arc</h4>\n  <p>Read the preview &rarr; <a href="notes/N002/preview.html">the second</a></p>\n`;
  open(whole.replace("</section>\n<section id=\"s3\"", `${entry2}</section>\n<section id="s3"`));
  const withSecond = readFileSync(page, "utf8");
  ok("green: two arcs, each with its own preview, its own entry, and links to no other's, pass", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));

  writeFileSync(page, withSecond.replace(entry2, `  <h4 id="c2">The second arc</h4>\n  <p>No entry id.</p>\n`));
  const noEntry = checkWorkstream(ws);
  ok("red: an arc with no What entry fails, naming the entry and the command that anchors or writes it",
    has(noEntry, "stamp", /N002 has no What entry, `N002-what`, on the approach page — `spn-devex workstream arc edit 031\/N002 --under <heading id>` anchors it on its subject heading, or writes it under a domain heading/), said(noEntry));

  writeFileSync(page, withSecond.replace('<a href="notes/N002/preview.html">the second</a>', "the second"));
  ok("red: an entry that does not link its arc's preview fails", has(checkWorkstream(ws), "stamp", /N002's preview is not linked from its What entry, `#N002-what`/), said(checkWorkstream(ws)));

  writeFileSync(page, withSecond.replace('<a href="notes/N002/preview.html">the second</a>', '<a href="notes/N002/preview.html">the second</a> and <a href="notes/N001/preview.html">the first</a>'));
  const crossed = checkWorkstream(ws);
  ok("red: an entry that links another arc's preview fails, naming the What it should link",
    has(crossed, "stamp", /N002's What entry links `notes\/N001\/preview\.html`, N001's preview — an arc's entry links its own preview only, and names another arc by its What, `approach\.html#N001-what`/), said(crossed));
  ok("the same link in an entry that is not N001's is no finding of the outside-an-entry kind", !has(crossed, "stamp", /outside N001's entry/), said(crossed));

  writeFileSync(page, withSecond);
  writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW.replace("<p>the probe</p>", '<p>after <a href="../N001/preview.html">the first</a></p>'));
  const previewLink = checkWorkstream(ws);
  ok("red: a preview that links another arc's preview fails, naming the What it should link",
    has(previewLink, "preview", /N002's preview links `\.\.\/N001\/preview\.html`, N001's preview — a preview names another arc by its What, `\.\.\/\.\.\/approach\.html#N001-what`, and never links its preview/), said(previewLink));
  writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW.replace("<p>the probe</p>", '<p>after <a href="../../approach.html#N001-what">the first</a></p>'));
  ok("green: a preview that names the other arc by its What passes", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW);

  writeFileSync(page, withSecond.replace(entry2, `  <h4 id="N002-what">The second arc</h4>\n  <p>No link here.</p>\n  <h4 id="c9">Elsewhere</h4>\n  <p><a href="notes/N002/preview.html">the second</a></p>\n`));
  const outside = checkWorkstream(ws);
  ok("red: a link to an arc's preview in What outside that arc's entry fails, once, with no arc",
    outside.filter((one) => one.arc === null && one.check === "stamp" && /^the approach page's What links `notes\/N002\/preview\.html` outside N002's entry — a preview is linked from its own arc's What entry, and from no other place in What$/.test(one.message)).length === 1, said(outside));

  writeFileSync(page, withSecond.replace("<h4 id=\"N002-what\">The second arc</h4>", "<h4 id=\"c3\"><span id=\"N002-what\"></span>The second arc</h4>"));
  ok("green: the id as an anchor on a subject heading is the arc's entry", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  writeFileSync(page, withSecond);

  const slotted = { ...second, status: "DECIDED" };
  writeFileSync(arcFile("N002"), JSON.stringify(slotted, null, 2));
  writeFileSync(join(ws, "notes", "N002", "preview.html"), PREVIEW.replace("<p>the probe</p>", "<p>{{one}}</p>\n<p>{{two}}</p>"));
  const decided = checkWorkstream(ws);
  ok("red: a slot left in a decided arc's preview fails, counting them and naming the first line",
    has(decided, "preview", /N002 is DECIDED and its preview still holds 2 slot\(s\), `\{\{…\}\}`, the first at `notes\/N002\/preview\.html:3` — a decided arc's preview is filled; a slot is expected only while the arc is PROPOSED/), said(decided));
  writeFileSync(arcFile("N002"), JSON.stringify(second, null, 2));
  ok("green: the same slots in a PROPOSED arc's preview are expected", !has(checkWorkstream(ws), "preview", /slot/), said(checkWorkstream(ws)));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.267 — a sample is the work's own file, never a page built with the page template");
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

console.log("\n=== RULE.DEVEX.WORKSPACE.262 — an arc's notes folder holds the five, and nothing else");
{
  const { root, ws } = await dataWorkspace("state-notes-tree");
  const notes = join(ws, "notes", "N001");
  mkdirSync(join(notes, "shots"), { recursive: true });
  writeFileSync(join(notes, "shots", "rail-dark.png"), "png");
  writeFileSync(join(notes, "answered-cards.md"), "# answered\n");
  writeFileSync(join(notes, "inventory.md"), "# what exists\n");
  writeFileSync(join(notes, "orders"), "not a folder");
  mkdirSync(join(notes, "proofs"), { recursive: true });
  writeFileSync(join(notes, "row-1.patch"), "diff");
  mkdirSync(join(notes, "work", "views"), { recursive: true });
  writeFileSync(join(notes, "work", "views", "ux.md"), "# the UX view\n");
  const red = checkWorkstream(ws);
  ok("red: a folder of screenshots beside the six is named, and sent to samples/", has(red, "notes", /`notes\/N001\/shots\/` is not one of the six .* belongs in `samples\/`/), said(red));
  ok("red: a folder of proofs is sent to work/", has(red, "notes", /`notes\/N001\/proofs\/` is not one of the six .* belongs in `work\/`/), said(red));
  ok("red: a patch is sent to work/", has(red, "notes", /`notes\/N001\/row-1\.patch` is not one of the six .* belongs in `work\/`/), said(red));
  ok("green: work/ with a folder of its own is one of the six", !has(red, "notes", /notes\/N001\/work/), said(red));
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
  renameSync(join(notes, "proofs"), join(notes, "work", "proofs"));
  renameSync(join(notes, "row-1.patch"), join(notes, "work", "row-1.patch"));
  writeFileSync(join(notes, ".DS_Store"), "");
  ok("green: folded into the six — a folder inside samples/ or work/ and a dot-file are no one's finding", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  mkdirSync(join(notes, "previews"), { recursive: true });
  const previews = checkWorkstream(ws);
  ok("a previews/ folder is named once, by the one-preview check", previews.length === 1 && previews[0].check === "preview", said(previews));
}

console.log("\n=== the life of an arc — the files of every step it has passed");
{
  const { ws } = await dataWorkspace("state-steps");
  rmSync(join(ws, "notes", "N001", "plan.md"));
  ok("green: a decided arc with no plan is whole, since a plan is kept only for traps, a set or a move table",
    !has(checkWorkstream(ws), "steps", /plan\.md/), said(checkWorkstream(ws)));
  const data = JSON.parse(readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8"));
  data.rows[0].state = "landed";
  data.rows[0].order = "orders/1.md";
  writeFileSync(join(ws, "arcs", "N001", "state.json"), JSON.stringify(data));
  ok("red: a landed row with an order and no report fails", has(checkWorkstream(ws), "steps", /row 1 landed and its report/), said(checkWorkstream(ws)));
  put(ws, "notes/N001/orders/1.report.md", "---\nrow: \"1\"\noutcome: landed\n---\n");
  ok("green: the report there, the check passes", checkWorkstream(ws).filter((one) => !["status", "views", "name"].includes(one.check)).length === 0, said(checkWorkstream(ws)));
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
  ok("red: a status outside the stored set fails", has(checkWorkstream(ws), "schema", /`status` is `OPEN`/), said(checkWorkstream(ws)));
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

console.log("\n=== RULE.DEVEX.WORKSPACE.278 and .307 — no step runs on an arc not decided, or held by a wait");
{
  const { ws } = await dataWorkspace("state-status");
  const file = join(ws, "arcs", "N001", "state.json");
  const statusOnly = () => checkWorkstream(ws).filter((one) => one.check === "status");
  const data = arcData();
  data.rows[0].state = "running";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: a decided arc with a step running has no status finding: it reads RUNNING", statusOnly().length === 0, said(statusOnly()));
  data.status = "PROPOSED";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("red: a step running on a PROPOSED arc is named, with the command that stops it",
    has(checkWorkstream(ws), "status", /N001 is PROPOSED and step 1 is running .*row state N001 1 stopped/), said(statusOnly()));
  data.status = "DECIDED";
  data.wait = "the developer: approved, but wait";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("red: a step running against the developer's wait is named, quoting it",
    has(checkWorkstream(ws), "status", /N001 holds the developer's wait, "the developer: approved, but wait" and step 1 is running/), said(statusOnly()));
  data.wait = null;
  data.status = "LANDED";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("red: a stored LANDED arc with a step not landed is named: a landed arc is never reopened",
    has(checkWorkstream(ws), "status", /N001 is LANDED and step 1 is running — a landed arc is never reopened.*review-fixes arc.*RULE\.DEVEX\.WORKSPACE\.261/), said(statusOnly()));
  data.rows[0].state = "landed";
  data.rows[1].state = "landed";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: LANDED with every step landed passes the status check", statusOnly().length === 0, said(statusOnly()));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.278 — the kind design is gone: reading and drafting are planning jobs");
{
  const { ws } = await dataWorkspace("state-design");
  const file = join(ws, "arcs", "N001", "state.json");
  const data = arcData();
  data.rows[0].kind = "design";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("red: a step of the kind design fails the schema, which names the three kinds", has(checkWorkstream(ws), "schema", /row 1's `kind` is `design`, and it is one of fix · change · question/), said(checkWorkstream(ws)));
  data.rows[0].kind = "change";
  data.status = "PROPOSED";
  writeFileSync(file, JSON.stringify(data, null, 2));
  ok("green: a PROPOSED arc with steps written before the go, none started, is whole",
    !checkWorkstream(ws).some((one) => one.check === "status" || one.check === "schema"), said(checkWorkstream(ws)));
}

console.log("\n=== RULE.DEVEX.WORKSPACE.183 — an arc's build rows carry a repository and an altitude, in chain order");
{
  const { stepRowFindings } = await import("../../../../src/scripts/checks/workstream-state.ts");
  const arcOf = (rows) => ({ ...arcData([]), rows: rows.map(([id, repo, altitude, kind = "change"]) =>
    ({ id, parent: "N001", title: `row ${id}`, kind, repo, altitude, state: "waiting" })) });
  const rows = (...list) => stepRowFindings(arcOf(list));
  ok("rows in chain order, a `—` proof row last, find nothing",
    rows(["1", "spn-foundation", "DOCS"], ["2", "spn-support-ts", "DOCS"], ["3", "spn-support-ts", "CODE"], ["4", "—", "PROOF"]).length === 0);
  ok("known-bad: DOCS after CODE inside one repository is named",
    rows(["1", "spn-support-ts", "CODE"], ["2", "spn-support-ts", "DOCS"]).some((line) => /row 2 is DOCS after CODE in spn-support-ts/.test(line)));
  ok("known-bad: the foundation after another repository is named",
    rows(["1", "spn-support-ts", "DOCS"], ["2", "spn-foundation", "DOCS"]).some((line) => /the foundation comes first/.test(line)));
  ok("known-bad: a repository that comes back after another is named",
    rows(["1", "spn-foundation", "DOCS"], ["2", "spn-support-ts", "DOCS"], ["3", "spn-foundation", "CODE"]).some((line) => /returns to spn-foundation/.test(line)));
  ok("known-bad: a build row with no repository or no altitude is named, with the set",
    rows(["1", "spn-foundation", null], ["2", null, "DOCS"]).some((line) => /row\(s\) 1, 2 carry no repo, or no altitude from DOCS · CODE/.test(line)));
  ok("a step that changes no repository, `—`, takes no place in the chain", rows(["1", "spn-foundation", "DOCS"], ["2", "—", "PROOF"]).length === 0);
  const { root, ws } = await dataWorkspace("state-chain");
  const wrote = cli(root, ["workstream", "row", "add", "031/N001", "the book again", "--kind", "change", "--repo", "spn-foundation", "--altitude", "DOCS"]);
  ok("known-bad: `row add` prints the finding in a note line after the write, and still writes",
    wrote.code === 0 && /note: N001 rows out of chain order: row 3 is spn-foundation after spn-x — the foundation comes first/.test(wrote.out)
      && JSON.parse(readFileSync(join(ws, "arcs", "N001", "state.json"), "utf8")).rows.some((row) => row.id === "3"), wrote.out);
}

console.log("\n=== the change sheet — allowed in the arc's data, held to its schema, and named by a moved fact");
{
  const { root, ws, repo, git } = await dataWorkspace("state-sheet");
  const sheetFile = join(ws, "arcs", "N001", "sheet.json");
  const whole = { schemaVersion: 1, releaseChain: [], dependsOn: [], stack: null, entries: [] };
  writeFileSync(sheetFile, JSON.stringify(whole, null, 2));
  ok("green: `sheet.json` is allowed in the arc's data", checkWorkstream(ws).length === 0, said(checkWorkstream(ws)));
  writeFileSync(join(ws, "arcs", "N001", "other.json"), "{}");
  ok("red: another file is still named, and the message lists `sheet.json`", has(checkWorkstream(ws), "name", /is not the arc's data.*`sheet.json`/), said(checkWorkstream(ws)));
  rmSync(join(ws, "arcs", "N001", "other.json"));
  writeFileSync(sheetFile, JSON.stringify({ ...whole, entries: [{ id: "E1", op: "mangle" }] }, null, 2));
  ok("red: a sheet with a fault is reported under the schema", has(checkWorkstream(ws), "schema", /sheet\.json/) && has(checkWorkstream(ws), "schema", /E1/), said(checkWorkstream(ws)));
  writeFileSync(sheetFile, "{ not json");
  ok("red: a sheet that is not JSON is reported", has(checkWorkstream(ws), "schema", /sheet\.json is not JSON/), said(checkWorkstream(ws)));
  const entry = (id, facts) => ({ id, op: "edit", file: "spn-x:a.ts", what: "x", decidedBy: [], facts, then: [], rules: [], callers: [], tiers: {}, docs: [], book: [] });
  writeFileSync(sheetFile, JSON.stringify({ ...whole, entries: [entry("E1", ["f1"]), entry("E2", ["f2"]), entry("E3", ["f1", "f2"])] }, null, 2));
  const fact = (n) => cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts", "--fact", `fact ${n}`]);
  fact(1); fact(2);
  writeFileSync(join(repo, "a.ts"), "export const a = 2;\n");
  git(["add", "-A"]);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "second"]);
  const { staleFacts } = await import("../../../../src/scripts/checks/workstream-state.ts");
  const stale = staleFacts(ws, "N001", root);
  ok("green: a moved fact names the entries that cite it", stale.length === 2 && stale[0].endsWith(" · refresh E1, E3") && stale[1].endsWith(" · refresh E2, E3"), stale.join(" | "));
  rmSync(sheetFile);
  ok("green: an arc with no sheet reads as before", staleFacts(ws, "N001", root).every((line) => !line.includes("refresh")), staleFacts(ws, "N001", root).join(" | "));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — workstream state check` : `\n  all ${total} passed — workstream state check`);
process.exit(failed ? 1 : 0);
