// Where a paragraph should have been a block (RULE.DEVEX.WORKSPACE.530 and .531, and the preview limits of .522): each finding is SOFT and names the block,
// and each has a known-good twin that is silent. Read through `blockFit` directly and through the doc-check hook on a seat file.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { blockFit, fitKind, BOUNDS } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "block-fit.ts")).href);

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

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-block-fit` : `\n  all ${total} passed — t-block-fit`);
process.exit(failed ? 1 : 0);
