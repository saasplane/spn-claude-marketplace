// Where a paragraph should have been a block (RULE.DEVEX.WORKSPACE.530 and .531, and the preview limits of .522): each finding is SOFT and names the block,
// and each has a known-good twin that is silent. Read through `blockFit` directly and through the doc-check hook on a seat file.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { blockFit, fitKind, BOUNDS, templateFrameFindings, holdsTemplateFrame } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "block-fit.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const md = (body) => `## A part\n\n${body}\n`;
const say = (body, kind = "seat") => blockFit(md(body), false, kind).map(([, message]) => message);
const html = (body) => `<section id="s1"><div class="sds-section-head"><h2>A part</h2></div>\n${body}\n</section>`;
const sayHtml = (body, kind = "preview") => blockFit(html(body), true, kind).map(([, message]) => message);
const words = (n) => Array.from({ length: n }, (_, at) => `word${at}`).join(" ") + ".";

console.log("=== a paragraph past its page kind's bound (RULE.DEVEX.WORKSPACE.531, and 522 on a preview)");
ok("[RULE.DEVEX.WORKSPACE.522] red: a preview paragraph of 70 words beside a table is over its 60", sayHtml(`<p>${words(70)}</p><table><tr><td>a</td></tr></table>`).some((m) => m.includes("70 words") && m.includes("60 words")));
ok("[RULE.DEVEX.WORKSPACE.522] green: a preview paragraph of 55 words beside a table is silent", sayHtml(`<p>${words(55)}</p><table><tr><td>a</td></tr></table>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.522] green: a part with no other block may carry 110 words on a preview", sayHtml(`<p>${words(110)}</p>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.522] red: a part with no other block stops at 120 on a preview", sayHtml(`<p>${words(130)}</p>`).some((m) => m.includes("130 words") && m.includes("120 words")));
ok("[RULE.DEVEX.WORKSPACE.531] red: a seat paragraph of 130 words beside a table is over its 120", say(`| a | b |\n| - | - |\n| 1 | 2 |\n\n${words(130)}`).some((m) => m.includes("130 words") && m.includes("120 words")));
ok("[RULE.DEVEX.WORKSPACE.531] green: a seat part with no other block holds to 200", say(words(130)).length === 0);
ok("[RULE.DEVEX.WORKSPACE.531] green: a small-type fact is no paragraph of the page", sayHtml(`<p class="sds-small">${words(90)}</p>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.531] every page kind has a bound, an explaining kind twice a preview's", Object.keys(BOUNDS).length === 8 && BOUNDS.hub.beside === 2 * BOUNDS.preview.beside);

console.log("=== a list, and a callout (RULE.DEVEX.WORKSPACE.522 on a preview, 530 and 531 elsewhere)");
const items = (n, w = 5) => Array.from({ length: n }, () => `<li>${words(w)}</li>`).join("");
ok("[RULE.DEVEX.WORKSPACE.522] red: a list of eight items on a preview", sayHtml(`<ul>${items(8)}</ul>`).some((m) => m.includes("8 items") && m.includes("at most 7")));
ok("[RULE.DEVEX.WORKSPACE.522] green: a list of seven short items", sayHtml(`<ul>${items(7)}</ul>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.522] red: a list item of 30 words on a preview", sayHtml(`<ul>${items(2, 30)}</ul>`).some((m) => m.includes("25 words")));
ok("[RULE.DEVEX.WORKSPACE.522] red: a two-sentence callout on a preview", sayHtml(`<div class="sds-pull"><p>One rule here. And its reason here.</p></div>`).some((m) => m.includes("2 sentences")));
ok("[RULE.DEVEX.WORKSPACE.522] green: a one-sentence callout", sayHtml(`<div class="sds-pull"><p>One rule, said once.</p></div>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.531] green: a two-sentence callout on a seat, whose callouts run to three", say("> One rule here. And its reason here.").length === 0);
ok("[RULE.DEVEX.WORKSPACE.531] red: a list of eleven items on a seat", say(Array.from({ length: 11 }, () => "- short item here").join("\n")).some((m) => m.includes("11 items")));

console.log("=== a paragraph that lists parallel items (RULE.DEVEX.WORKSPACE.530)");
ok("[RULE.DEVEX.WORKSPACE.530] red: a colon and four short items is a list", say("A platform runs on backing services that hold state: a database, a cache, a queue and object storage.").some((m) => m.includes("4 parallel items")));
ok("[RULE.DEVEX.WORKSPACE.530] green: the same four things as a list", say("- a database\n- a cache\n- a queue\n- object storage").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] red: three clauses joined by semicolons", say("The checker reads the page headers each night; the writer renders every seat file on a save; the index lists each page that lands.").some((m) => m.includes("3 parallel items")));
ok("[RULE.DEVEX.WORKSPACE.530] green: an ordinary sentence with a comma and an and", say("The checker reads the header, then the writer renders the page and the index lists it.").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] green: a colon and a single clause is no list", say("There is one rule: a block is chosen by what the content is.").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] red: first, second and third counted in one paragraph", say("The page opens with a title. First the masthead says who it is for, and why it was written. Second comes the rule, with its reason beside it. Third there is one example, in the reader's own words.").some((m) => m.includes("counts its items")));

console.log("=== a paragraph that compares today and after (RULE.DEVEX.WORKSPACE.530)");
ok("[RULE.DEVEX.WORKSPACE.530] red: today and proposed in one paragraph", say("Today the header holds six fields and a person reads them in a row. The proposed header holds three and the rest sit below.").some((m) => m.includes("compares today and after") && m.includes("Today and a Proposed")));
ok("[RULE.DEVEX.WORKSPACE.530] green: the same comparison as a table", say("| | Today | Proposed |\n| --- | --- | --- |\n| Header | six fields | three fields |").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] green: 'today' alone is no comparison", say("A person reads the header today and understands it at once.").length === 0);

console.log("=== steps written as prose (RULE.DEVEX.WORKSPACE.530)");
ok("[RULE.DEVEX.WORKSPACE.530] red: First, then Then", say("The writer works in a fixed order. First it reads the seat file and its metadata block. Then it renders each fenced block as the page draws it.").some((m) => m.includes("steps written as prose")));
ok("[RULE.DEVEX.WORKSPACE.530] green: the same steps as a numbered list", say("1. Read the seat file.\n2. Render each block.").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] green: a sentence that says 'first' once, with no step after it", say("The first thing a reader sees is the title, and nothing sits above it.").length === 0);

console.log("=== code names in a sentence (RULE.DEVEX.WORKSPACE.530)");
ok("[RULE.DEVEX.WORKSPACE.530] red: a run of four code names joined by commas", say("The file names `a`, `b`, `c` and `d` in that order.").some((m) => m.includes("code names")));
ok("[RULE.DEVEX.WORKSPACE.530] red: five code names in one sentence", say("A `a` reads `b` and `c`, then `d` writes the `e` file.").some((m) => m.includes("5 code names")));
ok("[RULE.DEVEX.WORKSPACE.530] green: a run of three joined, and two more apart", say("It reads `FOUNDATION`, `INFRA` or `GENERAL` and writes `x` once.").length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] green: a code block is no sentence", say("```ts\nexport const a = `b`, c = `d`, e = `f`, g = `h`;\n```").length === 0);

console.log("=== what the check reads, and what it leaves");
ok("[RULE.DEVEX.WORKSPACE.530] every finding is SOFT", blockFit(md("A platform runs on state: a database, a cache, a queue and object storage."), false, "seat").every(([severity]) => severity === "SOFT"));
ok("[RULE.DEVEX.WORKSPACE.530] a template's {{ }} paragraph is not read", sayHtml(`<p>{{${words(90)}}}</p>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.530] a table cell and a code block are not paragraphs", sayHtml(`<table><tr><td>${words(90)}</td></tr></table><pre>${words(90)}</pre>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.531] a preview, an approach page and an overview have a kind; a produced construct page and a chapter have none",
  fitKind("/r/.spndevex/workstreams/open/041-x/notes/N001/preview.html") === "preview" && fitKind("/r/x/041-approach.html") === "approach"
  && fitKind("/r/docs/artifacts/docs/a-overview.html") === "overview" && fitKind("/r/docs/artifacts/docs/a-construct.html") === null && fitKind("/r/docs/04-capabilities/a.md") === null);

console.log("=== hand-written card blocks (RULE.DEVEX.WORKSPACE.549)");
const tiles = (attrs, tile, heads) => `<div class="sds-tiles"${attrs}>${heads.map((h) => `<div class="sds-tile"${tile}><h4>${h}</h4><p>one line</p><dl class="sds-tile-facts"><div><dt>Key</dt><dd>value</dd></div></dl></div>`).join("")}</div>`;
const written = ' data-layout="GRID"', facts = ' data-facts="1"';
ok("[RULE.DEVEX.WORKSPACE.549] red: an sds-tiles block whose item headings read as conditions is a soft finding naming the item",
  sayHtml(tiles(written, facts, ["how ideas connect", "Reach"])).some((m) => m.includes('"how ideas connect"') && m.includes("a first column of conditions is a table (rule 549)")));
ok("[RULE.DEVEX.WORKSPACE.549] red: a heading that opens on a digit reads as a condition",
  sayHtml(tiles(written, facts, ["3 steps in a row"])).some((m) => m.includes("reads as a condition")));
ok("[RULE.DEVEX.WORKSPACE.549] green: named things in the writer's markup are silent",
  sayHtml(tiles(written, facts, ["Reach", "Voice", "The Voice Check"])).length === 0);
ok("[RULE.DEVEX.WORKSPACE.549] red: tiles with facts in a block without the writer's attributes is a soft finding",
  sayHtml(tiles("", "", ["Reach"])).includes("this card block is hand-written without the writer's attributes, so its rows will not line up: use a table, or the writer's markup"));
ok("[RULE.DEVEX.WORKSPACE.549] red: a GRID block whose tile lacks data-facts is the same finding",
  sayHtml(tiles(written, "", ["Reach"])).some((m) => m.includes("hand-written without the writer's attributes")));
ok("[RULE.DEVEX.WORKSPACE.549] green: tiles with no facts and no attributes are silent",
  sayHtml('<div class="sds-tiles"><div class="sds-tile"><h4>Reach</h4><p>one line</p></div></div>').length === 0);
ok("[RULE.DEVEX.WORKSPACE.549] red: facts whose values are phrases read as description and are folded into the line",
  sayHtml(`<div class="sds-tiles" data-layout="LIST"><div class="sds-tile"><div class="sds-tile-body"><h4>Rail</h4><p>a rail</p>\n<dl class="sds-tile-facts"><div><dt>Width</dt><dd>on the right, from three sections</dd></div></dl></div></div></div>`).some((m) => m.includes("these facts read as description") && m.includes("(rule 549)")));
ok("[RULE.DEVEX.WORKSPACE.549] red: a fact holding a quoted message says make it a quote, and not also fold it",
  (() => { const m = sayHtml(`<div class="sds-tiles" data-layout="LIST"><div class="sds-tile"><div class="sds-tile-body"><h4>Block</h4><p>a line</p>\n<dl class="sds-tile-facts"><div><dt>Says</dt><dd>&ldquo;a table of six rows reads as a catalog&rdquo;</dd></div></dl></div></div></div>`); return m.some((x) => x.includes("make it a quote")) && !m.some((x) => x.includes("read as description")); })());
ok("[RULE.DEVEX.WORKSPACE.549] green: short values as facts are silent",
  !sayHtml(tiles(' data-layout="LIST"', "", ["Reach"])).some((m) => m.includes("read as description")));

console.log("=== the hook reads a construct's seat file");
const WORK = realpathSync(mkdtempSync(join(tmpdir(), "block-fit-")));
process.on("exit", () => rmSync(WORK, { recursive: true, force: true }));
const folder = join(WORK, "probe-repo", "docs", "02-constructs", "01-probe", "01-one");
mkdirSync(folder, { recursive: true });
const seatPath = join(folder, "01-thing.md");
const run = (content) => {
  try { return execFileSync("node", [resolve(HERE, "src/scripts/checks/doc-check.ts"), "--stdin"], { input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: seatPath, content } }), encoding: "utf8", cwd: WORK }); }
  catch (e) { return String(e.stdout ?? e.message); }
};
const hooked = run("# Thing\n\nA platform runs on backing services that hold state: a database, a cache, a queue and object storage.\n");
ok("[RULE.DEVEX.WORKSPACE.530] red: the doc-check hook names the paragraph that lists on a construct's seat file", hooked.includes("parallel items"), hooked.slice(0, 300));
const clean = run("# Thing\n\n- a database\n- a cache\n- a queue\n- object storage\n");
ok("[RULE.DEVEX.WORKSPACE.530] green: the known-good twin, as a list, is silent on that finding", !clean.includes("parallel items"), clean.slice(0, 300));

console.log("=== a tree on a hand-written page (RULE.DEVEX.WORKSPACE.238)");
const TREE = "notes/\n  N018/\n    preview.html   the arc's preview\n    samples/\n      index.html";
const BARE = "this block is a tree: mark it `<pre data-lang=\"tree\">` so the script colours it (rule 238)";
ok("[RULE.DEVEX.WORKSPACE.238] red: a bare pre that reads as a tree is a soft finding with the exact message", blockFit(html(`<pre>${TREE}</pre>`), true, "preview").some(([sev, m]) => sev === "SOFT" && m === BARE));
ok("[RULE.DEVEX.WORKSPACE.238] green: the same tree marked data-lang=\"tree\" is silent", sayHtml(`<pre data-lang="tree">${TREE}</pre>`).length === 0);
ok("[RULE.DEVEX.WORKSPACE.238] green: a pre of code is no tree", sayHtml(`<pre>const a = 1;\nconst b = 2;</pre>`).length === 0);


console.log("=== a figure beside the passage that calls for it, and matching it (RULE.DEVEX.WORKSPACE.548)");
const FIG = (labels) => "```dg\n" + JSON.stringify({ kind: "chain", title: "t", caption: "c", boxes: labels.map((label, at) => ({ id: `b${at}`, label })) }) + "\n```";
const STEPS = "A seat file is read by the page writer → drawn as a page → read by the check → listed by the index. The reader then opens it.";
ok("[MKT.HOOKS.530] red: a paragraph with three arrows and no dg figure says what kind of figure to add", say(STEPS).some((m) => m.includes("a learner would see this faster as a chain: add a dg figure beside it") && m.includes("548")), JSON.stringify(say(STEPS)));
ok("[MKT.HOOKS.530] green: the same paragraph with a dg fence in its section is silent on that", !say(`${STEPS}\n\n${FIG(["Seat file", "Page writer", "Page", "Check", "Index"])}`).some((m) => m.includes("add a dg figure")));
ok("[MKT.HOOKS.530] red: a numbered list of three steps and no figure is flagged", say("1. Write the contract.\n2. Regenerate the validators.\n3. Write the service.").some((m) => m.includes("add a dg figure")));
ok("[MKT.HOOKS.530] green: a paragraph of two steps is silent", !say("The writer draws the page, then the check reads it.").some((m) => m.includes("add a dg figure")));
ok("[MKT.HOOKS.530] red: a sequence passage names a sequence", say("The client asks the server for a token. The server answers with one. The client then asks again → the server answers → done → ok.").some((m) => m.includes("as a sequence")));
ok("[MKT.HOOKS.530] red: a figure whose box the section's prose never names is flagged with that label", say(`The writer draws the page and the check reads it.\n\n${FIG(["Writer", "Page", "Unicorn"])}`).some((m) => m.includes("the figure names Unicorn, which the passage does not")));
ok("[MKT.HOOKS.530] green: a figure whose boxes the prose names is silent", say(`The writer draws the page and the check reads it.\n\n${FIG(["Writer", "Page", "Check"])}`).length === 0, JSON.stringify(say(`The writer draws the page and the check reads it.\n\n${FIG(["Writer", "Page", "Check"])}`)));
ok("[MKT.HOOKS.530] green: a skeleton figure is never matched against the prose", say("A screen.\n\n```dg\n{\"kind\":\"skeleton\",\"frame\":{\"label\":\"Zzz\"}}\n```").length === 0);
ok("[MKT.HOOKS.530] every figure hint is SOFT", blockFit(md(STEPS), false, "seat").every(([sev]) => sev === "SOFT"));

console.log("=== a page with no template's frame (RULE.DEVEX.WORKSPACE.554)");
const FRAMED = '<div class="sds-page"><div class="sds-wrap"><header class="sds-masthead"><h1>x</h1></header></div></div>';
ok("[MKT.HOOKS.529] red: a bare page is a finding that names the page template", templateFrameFindings("<p>hi</p>").some(([sev, m]) => sev === "RULE" && m.includes("page-template.html") && m.includes("554")));
ok("[MKT.HOOKS.529] green: .sds-page with .sds-wrap and .sds-masthead is a frame", holdsTemplateFrame(FRAMED) && templateFrameFindings(FRAMED).length === 0);
ok("[MKT.HOOKS.529] green: the index template's index-data is a frame", holdsTemplateFrame('<script type="application/json" id="index-data">{}</script>'));
ok("[MKT.HOOKS.529] red: .sds-page without .sds-masthead is no frame", !holdsTemplateFrame('<div class="sds-page"><div class="sds-wrap"></div></div>'));
ok("[MKT.HOOKS.529] green: a frame named only inside a comment is no frame", !holdsTemplateFrame(`<!-- ${FRAMED} --><p>x</p>`));

console.log("=== a list of links to other pages is a `cards` block (rule 549)");
{
  const DOORS = "these items are doors to other pages: a `cards` block (rule 549)";
  ok("red: a list of two links to other pages is a SOFT hint to use cards", sayHtml('<ul><li><a href="a.html">The first path</a></li><li><a href="b.html">The second path</a></li></ul>', "overview").includes(DOORS));
  ok("red: an item that names the link after a label is still a door", sayHtml('<ul><li>New here <a href="a.html">the day-zero walk</a></li><li>Building <a href="b.html">the path</a></li></ul>', "hub").includes(DOORS));
  ok("green: links to anchors of the same page are a list of contents, silent", !sayHtml('<ul><li><a href="#one">One</a></li><li><a href="#two">Two</a></li></ul>').includes(DOORS));
  ok("green: a list with one door among plain items is silent", !sayHtml('<ul><li>a plain item with several words in it</li><li><a href="b.html">The second path</a></li></ul>').includes(DOORS));
  ok("green: a link that is a small part of a long item is silent", !sayHtml('<ul><li>This item says a good deal more than it links, in many words, <a href="a.html">see</a></li><li>And so does this item, in as many words as the first, <a href="b.html">here</a></li></ul>').includes(DOORS));
  ok("green: a single link is no list of doors", !sayHtml('<ul><li><a href="a.html">The first path</a></li></ul>').includes(DOORS));
  ok("red: a markdown list of two links to other pages is the same hint", say("- [The first path](a.md)\n- [The second path](b.md)").includes(DOORS));
  ok("green: a markdown list of anchors is silent", !say("- [One](#one)\n- [Two](#two)").includes(DOORS));
  ok("the hint is SOFT", blockFit(html('<ul><li><a href="a.html">The first path</a></li><li><a href="b.html">The second path</a></li></ul>'), true, "overview").every(([severity]) => severity === "SOFT"));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-block-fit` : `\n  all ${total} passed — t-block-fit`);
process.exit(failed ? 1 : 0);
