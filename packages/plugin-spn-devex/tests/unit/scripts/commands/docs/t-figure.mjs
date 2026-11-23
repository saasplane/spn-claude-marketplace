import { PLUGIN } from "../../../../helpers/harness.mjs";
// `docs figure` — the three actions of the subject: `check` and `colour` read a page's own text, and
// `render` hands each file to a browser. What `check` finds in a drawing is proven case by case in
// `tests/unit/scripts/t-seats.mjs`. These cases prove that each action is reached by its own word,
// what each refuses, and that `--variant` narrows the pages `check` and `colour` read.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { colouredBlocks } from "../../../../../src/scripts/lib/figures.ts";
import { OWN_COPY, linesFor } from "../../../../../../plugin-support-lib/src/lib/page-styles.ts";

const TOOL = resolve(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-docs-figure-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

function run(args, cwd = BASE) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", "figure", ...args], { encoding: "utf8", cwd, stdio: "pipe" }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}

let n = 0, failed = 0;
function one(label, ok) {
  n += 1;
  if (!ok) { failed += 1; console.log(`  FAIL  ${label}`); }
  else console.log(`  PASS  ${label}`);
}

console.log("\n=== each action of `docs figure` is reached by its own word");

// A page in the shared form: the line that links the shared stylesheet, then the page's content.
const LINK = linesFor("1.0.0").stylesheet;
const shared = (content) => `${LINK}\n<div class="sds-page">\n${content}\n</div>\n`;
// A drawing whose connector ends in empty space, written with whichever class names are given.
const drawing = (svg, box, connector) =>
  `<figure><svg class="${svg}" viewBox="0 0 400 200"><rect class="${box}" x="40" y="60" width="100" height="60" rx="3"/>` +
  `<path class="${connector}" d="M240 30 H185"/></svg></figure>`;
/** One folder under the scratch base, holding one page. */
function pageIn(name, text) {
  const dir = join(BASE, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.html"), text);
  return dir;
}

// `check` reads a page's own geometry — no browser involved, so this is the same on every machine.
{
  const { out, code } = run(["check", pageIn("check", shared(`<h1>p</h1>\n<figure><svg class="dl-svg" viewBox="0 0 100 60"><rect class="dl-tile" x="10" y="10" width="40" height="20"/></svg></figure>`))]);
  one("[MKT.SCRIPTS.17] `figure check` runs the geometry check, not the render — it reports pages, not a render's PNG line",
    out.includes("clean — 1 page") && !out.includes("->"));
  one("[MKT.SCRIPTS.17] and it exits clean", code === 0);
}
{
  // VERIFY THE VERIFIER: the same faulty drawing, on a page in the shared form, is reported.
  const { out, code } = run(["check", pageIn("check-bad", shared(drawing("dl-svg", "dl-tile", "dl-wire")))]);
  one("[MKT.SCRIPTS.17] known-bad: a connector that ends in empty space, on a page that links the shared stylesheet, is refused",
    out.includes("RULE figure") && out.includes("empty space") && code === 1);
}
{
  // A PAGE THAT LINKS NO SHARED STYLESHEET HOLDS ITS OWN COPY, with the class names that copy used.
  // The check names the page once and reads no drawing of it, so the faulty drawing draws no finding.
  const own = `<!-- spn:doc\n{"id": "probe", "variant": "overview", "title": "Probe"}\n-->\n<style>.dg .c{stroke:blue}</style>\n<div class="page">\n${drawing("dg", "box", "c")}\n</div>\n`;
  const { out, code } = run(["check", pageIn("check-own", own)]);
  one("[MKT.SCRIPTS.108] `figure check` names a page that holds its own copy once, as a RULE, with the text every command uses",
    (out.match(/✗ RULE styles/g) ?? []).length === 1 && out.includes(OWN_COPY) && !out.includes("SOFT styles"));
  one("[MKT.SCRIPTS.108] and reads no drawing of it: no figure finding, and the exit is 1 for the page alone",
    !out.includes("RULE figure") && !out.includes("empty space") && code === 1);
  one("[MKT.SCRIPTS.108] the summary counts it as a RULE", out.includes("1 figure finding — 1 RULE, 0 SOFT, over 1 page"));
  // AN HTML FILE THAT IS NO PAGE OF OURS, such as a test report, has no `spn:doc` block and sits in no docs tree.
  const report = run(["check", pageIn("check-report", `<style>.x{color:red}</style>\n<div id="root"></div>\n`)]);
  one("[MKT.SCRIPTS.108] an html file that is no page of ours is read past: it is not named, and the exit is 0",
    !report.out.includes("RULE styles") && report.code === 0);
}

// A FIGURE COMES FROM A SPEC (RULE.DEVEX.WORKSPACE.523), and what a spec draws is measured as a page's drawing is.
{
  const flat = run(["check", pageIn("check-flat", shared(`<figure><svg class="sds-drawing" viewBox="0 0 100 60"><rect class="sds-box" x="10" y="10" width="40" height="20"/></svg></figure>`))]);
  one("[RULE.DEVEX.WORKSPACE.523] [MKT.SCRIPTS.616] red: `figure check` names a hand-drawn `sds-drawing` figure, whatever its geometry, and says to draw it from a spec",
    flat.code === 1 && flat.out.includes("hand-drawn `sds-drawing`") && flat.out.includes("RULE.DEVEX.WORKSPACE.523"));
  const arrow = run(["check", pageIn("check-arrow", shared(`<figure><svg class="dl-svg" viewBox="0 0 400 120"><rect class="dl-tile" x="16" y="16" width="120" height="48" rx="10"/><rect class="dl-tile" x="248" y="16" width="120" height="48" rx="10"/><path class="dl-wire" d="M136 40 H248" marker-end="url(#a)"/></svg></figure>`))]);
  one("[RULE.DEVEX.WORKSPACE.523] [MKT.SCRIPTS.616] red: `figure check` names an arrowhead (`marker-end`) on a figure", arrow.code === 1 && arrow.out.includes("marker-end"));
  const sample = run(["check", pageIn("check-sample", shared(`<figure><svg class="dl-svg" viewBox="0 0 400 120"><g data-dl-legend><path class="dl-wire" d="M40 60 H136" marker-end="url(#a)"/></g></svg></figure>`))]);
  one("[RULE.DEVEX.WORKSPACE.523] [MKT.SCRIPTS.616] green: a sample the design language's page marks data-dl-legend is not named", sample.code === 0 && sample.out.includes("clean — 1 page"));
  // The map that came back clean: the wire from Behaviors to How runs down through Capabilities, inside the What plate.
  const MAP = { kind: "map", caption: "What has three parts.", boxes: [
    { id: "why", label: "Why", note: "the benefit to the consumer" }, { id: "what", label: "What" },
    { id: "con", label: "Constructs", note: "the words for the things", in: "what" }, { id: "beh", label: "Behaviors", note: "what a consumer can do", in: "what" },
    { id: "cap", label: "Capabilities", note: "what must exist for it", in: "what" }, { id: "how", label: "How", note: "code, tests and guides" }],
    links: [{ from: "why", to: "con" }, { from: "con", to: "beh" }, { from: "con", to: "cap" }, { from: "beh", to: "how" }, { from: "cap", to: "how" }] };
  const specFile = join(BASE, "why-what-how.json");
  writeFileSync(specFile, JSON.stringify(MAP));
  const spec = run(["check", specFile]);
  one("[MKT.SCRIPTS.617] red: a spec file named on its own is drawn and measured, and the wire through a tile it does not join is named",
    spec.code === 1 && spec.out.includes("spec1: a connector runs through a box it does not join"), spec.out);
  const seat = join(BASE, "seat-map"); mkdirSync(seat, { recursive: true });
  writeFileSync(join(seat, "01-thing.md"), `# Thing\n\n\`\`\`dg\n${JSON.stringify(MAP)}\n\`\`\`\n`);
  const md = run(["check", seat]);
  one("[MKT.SCRIPTS.617] red: a seat file's `dg` spec is measured as it draws", md.code === 1 && md.out.includes("runs through a box it does not join"));
}

// `colour` reads a page's code blocks — also no browser. A page's file holds plain code, and the shared
// script colours it when the page opens, so a block that carries colour spans in the file is named.
{
  const coloured = `<pre data-lang="ts"><span class="sds-tk-k">const</span> a = <span class="sds-tk-n">1</span>;</pre>`;
  const plain = `<pre data-lang="ts">const a = 1; // a &lt;tag&gt;</pre>\n<pre data-lang="diff">- today\n+ after</pre>\n<pre>folder/\n  file</pre>`;
  const { out, code } = run(["colour", pageIn("colour", shared(plain))]);
  one("[MKT.SCRIPTS.629] `figure colour` runs the colour check, not the render: a plain block tagged with its language passes, and so does a block with no language",
    out.includes("every code block is plain in its file") && code === 0);
  const bad = run(["colour", pageIn("colour-bad", shared(coloured))]);
  one("[MKT.SCRIPTS.629] known-bad: a block whose file still carries colour spans is refused, and the finding names its language",
    bad.out.includes("1 block carries colour in the file") && bad.out.includes("a `ts` block carries colour spans in the file") && bad.code === 1);
  one("[MKT.SCRIPTS.629] the finding says who colours a block, and what to do", bad.out.includes("the shared script colours it when the page opens: remove the spans"));
  const untagged = run(["colour", pageIn("colour-untagged", shared(`<pre><span class="sds-tk-del">- today</span></pre>`))]);
  one("[MKT.SCRIPTS.629] known-bad: a block with no language that carries colour spans is refused too",
    untagged.out.includes("a block with no language carries colour spans in the file") && untagged.code === 1);
  one("[MKT.SCRIPTS.629] each of the seven classes the shared script writes is found, in a block of any language",
    ["k", "t", "s", "c", "n", "add", "del"].every((name) => colouredBlocks(`<pre data-lang="sql"><span class="sds-tk-${name}">x</span></pre>`).length === 1));
  one("[MKT.SCRIPTS.629] a span written as text, and a span outside a block, are not colour in a block",
    colouredBlocks(`<p><span class="sds-tk-k">const</span></p>\n<pre data-lang="md">&lt;span class="sds-tk-k"&gt;const&lt;/span&gt;</pre>`).length === 0);
  const own = run(["colour", pageIn("colour-own", `<!-- spn:doc\n{"id": "probe", "variant": "overview", "title": "Probe"}\n-->\n<style>.tk-k{color:red}</style>\n<pre data-lang="ts"><span class="tk-k">const</span> a = 1;</pre>\n`)]);
  one("[MKT.SCRIPTS.108] `figure colour` names a page that holds its own copy once, as a RULE, and reads no block of it",
    (own.out.match(/✗ RULE styles/g) ?? []).length === 1 && own.out.includes(OWN_COPY) && !own.out.includes("RULE figure") && !/blocks? carr/.test(own.out));
  one("[MKT.SCRIPTS.108] and it exits 1, and the summary says the page was not read", own.out.includes("1 page not read") && own.code === 1);
}

// `render` hands each file to a browser. The browser is optional on the machine running this suite,
// so both shapes the action can print are accepted. What is under test is that this is not the
// output of the geometry check.
{
  const svg = join(BASE, "plain.svg");
  writeFileSync(svg, `<svg viewBox="0 0 100 60"><rect x="10" y="10" width="40" height="20"/></svg>`);
  const { out, code } = run(["render", svg]);
  one("[MKT.SCRIPTS.142] `render` renders the file, and never reports `clean — N page(s)` as the geometry check does",
    !/clean — \d+ page/.test(out) && !out.includes("usage:"));
  one("[MKT.SCRIPTS.142] it either found no browser and said so, or rendered and reported per file",
    out.includes("No browser on this machine") || out.includes("plain.svg"));
  one("[MKT.SCRIPTS.142] and it exits 0 either way: `render` reports, and never refuses a drawing", code === 0);

  const USAGE = "usage: spn-devex docs figure check <path…> [--variant <name>]\n" +
                "       spn-devex docs figure colour <path…> [--variant <name>]\n" +
                "       spn-devex docs figure render <svg-or-html…>\n" +
                "       spn-devex docs figure draw <spec.json…> [--case]\n";
  const bare = run([svg]);
  one("[MKT.SCRIPTS.111] a file where the action belongs is refused: each usage line, an action is owed, and exit 2",
    bare.code === 2 && bare.out === `${USAGE}\`docs figure\` needs an action.\n`);
  one("[MKT.SCRIPTS.111] with no word at all the refusal is the same", run([]).code === 2 && run([]).out === bare.out);
  const noFile = run(["render"]);
  one("[MKT.SCRIPTS.142] `render` with no file says a path is owed, and exits 2",
    noFile.code === 2 && noFile.out === "usage: spn-devex docs figure render <svg-or-html…>\n`docs figure render` needs a path.\n");
  const noPath = run(["check"]);
  one("[MKT.SCRIPTS.628] `check` with no path says a path is owed, and exits 2",
    noPath.code === 2 && noPath.out === "usage: spn-devex docs figure check <path…> [--variant <name>]\n`docs figure check` needs a path.\n");
  one("[MKT.SCRIPTS.628] and so does `colour`", run(["colour"]).code === 2 && run(["colour"]).out.includes("`docs figure colour` needs a path."));
  const option = run(["check", svg, "--json"]);
  one("[MKT.SCRIPTS.628] an option the command does not take is refused by its name, with exit 2",
    option.code === 2 && option.out.includes("`docs figure check` does not take `--json`."));
  one("[MKT.SCRIPTS.628] `render` takes no `--variant`", run(["render", svg, "--variant", "overview"]).code === 2);
}

// `draw` is the same drawer offered to a hand-written page: a `.json` spec, or a `.md` page's own
// ```dg``` blocks, drawn in order and printed as the page would hold them.
console.log("\n=== `draw` prints the drawing of a spec a hand-written page holds");
{
  const spec = { kind: "skeleton", caption: "one named place.", frame: { rows: [{ items: [{ text: "Home" }] }] } };
  const file = join(BASE, "skel.json");
  writeFileSync(file, JSON.stringify(spec));
  const { out, code } = run(["draw", file]);
  one("[MKT.SCRIPTS.630] `draw` on a spec file prints one `<figure class=\"dl-figure\">`, the docs design language's", (out.match(/<figure class="dl-figure">/g) ?? []).length === 1);
  one("[MKT.SCRIPTS.630] with the spec's own caption as `<figcaption>`", out.includes("<figcaption>one named place.</figcaption>"));
  one("[MKT.SCRIPTS.630] and exits 0 on a spec with no finding", code === 0);

  const page = join(BASE, "skel.md");
  writeFileSync(page, "# A page\n\n```dg\n" + JSON.stringify(spec) + "\n```\n\n```dg\n" + JSON.stringify(spec) + "\n```\n");
  const md = run(["draw", page]);
  one("[MKT.SCRIPTS.630] a `.md` file's own ```dg``` blocks are drawn in order, one `<figure>` each",
    (md.out.match(/<figure class="dl-figure">/g) ?? []).length === 2 && md.code === 0);

  const badSpec = { kind: "skeleton", frame: { rows: [{ items: [{}] }] } };
  const badFile = join(BASE, "skel-bad.json");
  writeFileSync(badFile, JSON.stringify(badSpec));
  const bad = run(["draw", badFile]);
  one("[MKT.SCRIPTS.630] known-bad: an item that is none of the shapes a skeleton has is a finding",
    bad.out.includes("none of `text`, `note`, `slot`, `icon`, `control`, `standin`, `item`, `spacer` or `frame`") && bad.code === 1);

  const noPath2 = run(["draw"]);
  one("[MKT.SCRIPTS.628] `draw` with no path says a path is owed, and exits 2",
    noPath2.code === 2 && noPath2.out === "usage: spn-devex docs figure draw <spec.json…> [--case]\n`docs figure draw` needs a path.\n");
}

console.log("\n=== `draw` reads a flow file against the specs beside it, and draws nothing");
{
  const dir = join(BASE, "flow");
  mkdirSync(dir, { recursive: true });
  const frame = { rows: [{ items: [{ text: "x" }] }] };
  writeFileSync(join(dir, "members.dg.json"), JSON.stringify({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame }] }));
  writeFileSync(join(dir, "invite.dg.json"), JSON.stringify({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame }, { viewport: "DESKTOP", state: "FAILED", frame }] }));
  const flow = (moves) => JSON.stringify({ flow: "Invite a member", pages: [
    { page: "members", spec: "members.dg.json", moves: [{ on: "Invite a member", to: "invite" }] },
    { page: "invite", spec: "invite.dg.json", moves } ] });
  const clean = join(dir, "invite.flow.json");
  writeFileSync(clean, flow([{ on: "Send invite", to: "members" }, { on: "Send invite", to: "invite", state: "FAILED" }]));
  const good = run(["draw", clean]);
  one("[MKT.SCRIPTS.631] a clean flow file prints no `<figure>`, says it is clean, and exits 0",
    !good.out.includes("<figure>") && good.out.includes("clean — ") && good.code === 0);
  const bad = join(dir, "bad.flow.json");
  writeFileSync(bad, flow([{ on: "Send invite", to: "members", state: "EMPTY" }]));
  const refused = run(["draw", bad]);
  one("[MKT.SCRIPTS.631] known-bad: a move that lands on a state its page's spec does not draw is a RULE, and exits 1",
    refused.out.includes("✗ RULE flow") && refused.out.includes("draws no view in that state") && refused.code === 1);
}

console.log("\n=== `--variant` narrows the pages `check` and `colour` read");
{
  const block = (variant) => `<!-- spn:doc\n${JSON.stringify({ id: variant, variant, title: "Probe" })}\n-->\n`;
  const faulty = shared(drawing("dl-svg", "dl-tile", "dl-wire"));
  const offBlock = shared(`<pre data-lang="ts"><span class="sds-tk-k">const</span> a = <span class="sds-tk-k">1</span>;</pre>`);
  // Three pages with the same two faults: an overview, a report, and a page that declares no variant.
  const dir = join(BASE, "variants");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "overview.html"), block("overview") + faulty + offBlock);
  writeFileSync(join(dir, "report.html"), block("report") + faulty + offBlock);
  writeFileSync(join(dir, "plain.html"), faulty + offBlock);

  const whole = run(["check", dir]);
  one("[MKT.SCRIPTS.141] known-bad: with no filter `check` reports the fault on all three pages",
    whole.code === 1 && whole.out.includes("6 figure findings — 6 RULE, 0 SOFT, over 3 pages"));
  const overviews = run(["check", dir, "--variant", "overview"]);
  one("[MKT.SCRIPTS.141] `check --variant overview` reads the page whose block declares that variant, and no other",
    overviews.code === 1 && overviews.out.includes("2 figure findings — 2 RULE, 0 SOFT, over 1 page") && overviews.out.includes("overview.html")
      && !overviews.out.includes("report.html") && !overviews.out.includes("plain.html"));
  const two = run(["check", dir, "--variant", "overview", "--variant=report"]);
  one("[MKT.SCRIPTS.141] `--variant` typed twice reads both kinds, and never a page that declares none",
    two.out.includes("over 2 pages") && !two.out.includes("plain.html"));
  const none = run(["check", dir, "--variant", "guide"]);
  one("[MKT.SCRIPTS.141] a variant no page under the path declares is said, and the run exits 0",
    none.code === 0 && none.out.includes("no page under that path declares the variant guide"));
  const outside = run(["check", dir, "--variant", "chapter"]);
  one("[MKT.SCRIPTS.115] a variant outside the set is refused with the set, and exit 2",
    outside.code === 2 && outside.out.includes("takes `--variant` from approach · overview · construct") && outside.out.includes("and `chapter` is none of them."));

  const allBlocks = run(["colour", dir]);
  one("[MKT.SCRIPTS.141] known-bad: with no filter `colour` reports the block on all three pages", allBlocks.code === 1 && allBlocks.out.includes("3 blocks carry colour in the file"));
  const reports = run(["colour", dir, "--variant", "report"]);
  one("[MKT.SCRIPTS.141] `colour --variant report` reads the one page of that variant",
    reports.code === 1 && reports.out.includes("1 block carries colour in the file") && reports.out.includes("report.html") && !reports.out.includes("overview.html"));
  one("[MKT.SCRIPTS.141] the message names the block by its language", reports.out.includes("a `ts` block carries colour spans in the file"));
  const oneFile = run(["check", join(dir, "plain.html")]);
  one("[MKT.SCRIPTS.141] a path that names one file reads that file alone", oneFile.code === 1 && oneFile.out.includes("over 1 page") && !oneFile.out.includes("overview.html"));
}

console.log("\n=== a map is centred in its frame, and its wires stay inside the drawing");
{
  const { draw } = await import("../../../../../src/scripts/lib/draw.ts");
  const spec = { kind: "map", title: "Three feed one, which feeds a fourth", boxes: ["a", "b", "c", "d", "e"].map((id) => ({ id, label: id.toUpperCase() })),
    links: [{ from: "a", to: "d" }, { from: "b", to: "d" }, { from: "c", to: "d" }, { from: "d", to: "e" }] };
  const { svg } = draw(spec);
  const width = Number(/viewBox="0 0 ([\d.]+)/.exec(svg)[1]);
  const boxes = [...svg.matchAll(/<rect class="dl-tile" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
  const left = Math.min(...boxes.map((b) => b[0])), right = Math.max(...boxes.map((b) => b[0] + b[2])), top = Math.min(...boxes.map((b) => b[1]));
  one("the drawing's left and right margins are equal (frame " + width + ", boxes " + left + " to " + right + ")", Math.abs(left - (width - right)) <= 1);
  const xs = [...svg.matchAll(/<path class="dl-wire" d="([^"]+)"/g)].flatMap((m) => [...m[1].matchAll(/[ML]\s?([\d.]+)\s([\d.]+)/g)].map((q) => [Number(q[1]), Number(q[2])]));
  one("no wire runs outside the boxes' own extent, so none loops round the drawing's edge", xs.length > 0 && xs.every(([x]) => x >= left && x <= right));
  one("every wire's vertical run stays between the first row and the last box's bottom", xs.every(([, y]) => y >= top && y <= Math.max(...boxes.map((b) => b[1] + b[3]))));
}

console.log(failed ? `\n  ${failed} of ${n} FAILED` : `\n  all ${n} passed`);
process.exit(failed ? 1 : 0);
