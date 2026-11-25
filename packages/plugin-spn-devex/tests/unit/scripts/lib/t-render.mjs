// The page renderer and a code block (`08-stylesheet.md` § One stylesheet, served in versions): a produced page
// holds plain code in a `pre` tagged with its language, and no colour. The shared script colours the block when
// the page opens, so the renderer writes the same block a person writes by hand.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { renderPage, setUnitRender, setUnitFence, designSystemVersion, pageFromRender, pagesFromRender, DEFAULT_RENDER_APP } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "render.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** The page a seat file with this body becomes. */
const produced = (body) => renderPage({
  block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
  markdown: `# Probe\n\nThe lead.\n\n## What it is\n\nSome prose.\n\n${body}`,
  workspace: "/workspace",
  location: "/workspace/docs/02-constructs/probe.md",
  furniture: { stylesheet: "<link rel=\"stylesheet\" href=\"sds-docs.css\">", script: "<script src=\"sds-docs.js\"></script>", footer: "" },
}).html;
const fence = (lang, code) => `\`\`\`${lang}\n${code}\n\`\`\`\n`;

/** One sample for each language the shared script colours, as an author types it in a fence. */
const SAMPLES = {
  ts: "export const size = 26; // the size of a class",
  json: "{ \"deploys\": true, \"count\": 3 }",
  yaml: "# one row\nsetup: dev",
  sql: "CREATE TABLE iam_identity (id CHAR(26) PRIMARY KEY); -- the row",
  sh: "# wire the agent\nspnutils repo agent-sync",
  md: "| Estate | `SPEstate` |",
  diff: "- what the file says today\n+ what it will say",
};

console.log("=== the page renderer — a fenced block becomes plain code, tagged with its language");
for (const [lang, code] of Object.entries(SAMPLES)) {
  const html = produced(fence(lang, code));
  ok(`a \`${lang}\` fence is written as \`<pre data-lang="${lang}">\` holding its own text`, html.includes(`<pre data-lang="${lang}">${code}</pre>`),
    html.slice(html.indexOf("<pre"), html.indexOf("</pre>") + 6));
  ok(`and the \`${lang}\` block carries no colour span`, !html.includes("sds-tk-"));
}
const literal = produced(fence("ts", "const label = '<one> & two &amp; three';"));
ok("a `<`, a `>` and every `&` of tagged code are written as entities, so the block shows what its author typed",
  literal.includes(`<pre data-lang="ts">const label = '&lt;one&gt; &amp; two &amp;amp; three';</pre>`),
  literal.slice(literal.indexOf("<pre"), literal.indexOf("</pre>") + 6));
const untagged = produced(fence("", "folder/\n  file 26"));
ok("a fence with no language is written as `<pre>` with no tag", untagged.includes("<pre>folder/\n  file 26</pre>") && !untagged.includes("data-lang"),
  untagged.slice(untagged.indexOf("<pre"), untagged.indexOf("</pre>") + 6));
ok("and it carries no colour span", !untagged.includes("sds-tk-"));

console.log("=== the page renderer — a construct's fixed tables are written as item cells");
const rowsOf = (html, head) => {
  const at = html.indexOf(head);
  return at < 0 ? "" : html.slice(at, html.indexOf("</table>", at));
};
const table = (head, ...rows) => `| ${head.join(" | ")} |\n| ${head.map(() => "---").join(" | ")} |\n${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n`;
const terms = rowsOf(produced(table(["Term", "Contract term", "What it means"],
  ["Estate", "`SPEstate`", "everything a product runs on"], ["Ring", "—", "a set of estates"], ["—", "`SPRingType`", "the ring's kind"],
  ["Kind", "`SPKind` — the closed set, stated in the tenancy chapter", "which of six a node is"])), "<thead>");
ok("Terms is three columns, Term · Contract term · Description", terms.startsWith("<thead><tr><th>Term</th><th>Contract term</th><th>Description</th></tr></thead>"), terms.slice(0, 120));
ok("a term reads as its word in bold, the contract's spelling in code style, and the meaning in plain text",
  terms.includes("<tr><td><strong>Estate</strong></td><td><code>SPEstate</code></td><td>everything a product runs on</td></tr>"), terms);
ok("a term the contract does not spell has an empty Contract term cell", terms.includes("<tr><td><strong>Ring</strong></td><td></td><td>a set of estates</td></tr>"), terms);
ok("a row with no consumer word is titled by the contract's spelling", terms.includes("<tr><td><code>SPRingType</code></td><td></td><td>the ring's kind</td></tr>"), terms);
ok("a note the seat adds after the code is set under it in small type",
  terms.includes("<td><code>SPKind</code><br><span class=\"sds-small\">the closed set, stated in the tenancy chapter</span></td>"), terms);
ok("and no Terms cell is an item cell any more", !terms.includes("<p>") && !terms.includes("Contract term:"), terms);
const termsTable = produced(table(["Term", "Contract term", "What it means"], ["Estate", "`SPEstate`", "everything a product runs on"]));
ok("the Terms table carries the class `sds-terms`, which gives the three columns their fixed shares",
  termsTable.includes('<div class="sds-scroll"><table class="sds-terms">'), termsTable);
ok("a table that is not the Terms table carries no such class",
  !produced(table(["Rule", "What it decides", "Weight"], ["`RD.X.1`", "what every provider delivers", "MUST"])).includes("sds-terms")
  && !produced(table(["Term", "Meaning"], ["Estate", "everything a product runs on"])).includes("sds-terms"));
{
  const empty = rowsOf(produced(table(["Term", "Contract term", "What it means"], ["Estate", "—", "everything a product runs on"], ["Ring", "", "a set of estates"])), "<thead>");
  ok("[MKT.SCRIPTS.647] a Terms table whose Contract term cells are all empty or a dash draws no Contract term column, in its head or its rows",
    empty.startsWith("<thead><tr><th>Term</th><th>Description</th></tr></thead>") && empty.includes("<tr><td><strong>Estate</strong></td><td>everything a product runs on</td></tr>") && !empty.includes("Contract term"), empty);
  ok("[MKT.SCRIPTS.647] it takes the class `sds-terms sds-terms-two`, so the stylesheet gives its two columns their own shares",
    produced(table(["Term", "Contract term", "What it means"], ["Estate", "—", "x"])).includes('<table class="sds-terms sds-terms-two">'));
  ok("[MKT.SCRIPTS.647] one contract term in any row keeps the column",
    rowsOf(produced(table(["Term", "Contract term", "What it means"], ["Estate", "—", "x"], ["Ring", "`SPRing`", "y"])), "<thead>").includes("<th>Contract term</th>"));
}
{
  const css = (await import("node:fs")).readFileSync(resolve(HERE, "src", "styles", "docs-language.src.css"), "utf8");
  const piece = produced(table(["Piece", "The question it answers", "Its terms"], ["A provider", "What must it build?", "Provider"]));
  ok("[MKT.SCRIPTS.648] an item cell's facts are a key and a value, each its own element, in the one inline-fact look: no `Key: value` text",
    piece.includes('<span class="sds-small sds-facts"><span class="sds-fact-key">Terms</span><span class="sds-fact-value">Provider</span></span>') && !piece.includes("Terms: Provider"), piece.slice(-400));
  ok("[MKT.SCRIPTS.648] the stylesheet draws every inline fact from one set of rules: the key in the fact colour at medium weight, the value in the card title colour, in the text font",
    /\.sds-tile-facts dt,\s*\.sds-fact-key\s*\{[^}]*font-family:\s*inherit[^}]*font-weight:\s*var\(--font-weight-medium\)[^}]*color:\s*var\(--sds-text-fact-card\)/.test(css)
      && /\.sds-tile-facts dd,\s*\.sds-fact-value\s*\{[^}]*color:\s*var\(--sds-text-title-card\)/.test(css));
  ok("[MKT.SCRIPTS.648] and no block keeps a copy: a group row, a GRID card, a LIST row and a one-line fact set no colour or weight of their own for their key and value",
    !/\.sds-group-body \.sds-fact-(?:key|value)/.test(css) && !/data-layout='(?:GRID|LIST)'\] \.sds-tile-facts(?:-one)? d[td] \{[^}]*(?:color|font-weight|font-style)/.test(css));
}
{
  const numbered = produced(table(["No", "Step", "What happens"], ["1", "Pick", "Choose the template by the page's kind, and start it from the seat"], ["2", "Fill", "Write each section in the block its content takes, in order"], ["3", "Check", "Run the page check until it reports no finding"]));
  ok("[MKT.SCRIPTS.649] a table whose first column is only a number draws the number and the item's title on one line, its sentence under the title",
    numbered.includes('<tr><td><p><span class="sds-num">1</span> <strong>Pick</strong></p><p>Choose the template by the page\'s kind, and start it from the seat</p></td></tr>'), numbered);
  ok("[MKT.SCRIPTS.649] the number column is gone, and the head is the title column's name",
    numbered.includes("<thead><tr><th>Step</th></tr></thead>") && !numbered.includes("<th>No</th>"), numbered);
  ok("[MKT.SCRIPTS.649] a table whose first column holds words is not read this way, and a number beside other columns keeps those columns",
    !produced(table(["Name", "Count"], ["a", "1"])).includes("sds-num") && produced(table(["No", "Step", "Owner"], ["1", "Pick", "lead"], ["2", "Fill", "agent"])).includes("<th>Owner</th>"));
}
const { cutVersions, integrityTable, newestVersion, linesFor } = await import(pathToFileURL(resolve(HERE, "..", "plugin-support-lib", "src", "lib", "page-styles.ts")).href);
const { readFileSync } = await import("node:fs");
const STYLES_HOME = resolve(HERE, "src", "styles");
ok("the newest version of the shared styles is 1.17.2, which serves design-system-units.css and design-system.css, so every page writer links it",
  newestVersion(Object.keys(cutVersions(STYLES_HOME))) === "1.17.2");
ok("and 1.10.0 serves the Terms shares: a fixed layout, and the stacked rows under 40rem",
  /table\.sds-terms\{table-layout:fixed\}|table\.sds-terms\s*\{[^}]*table-layout:\s*fixed/.test(readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8"))
  && readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8").includes("max-width:40rem"));
for (const name of ["construct", "overview", "blocks"]) {
  const template = readFileSync(resolve(HERE, "src", "refs", "devex", "workspace", "docs", "templates", "docs", "pages", `${name}-template.html`), "utf8");
  ok(`the ${name} template links 1.17.2, the version every page writer links, with its hash`,
    template.includes(linesFor("1.17.2", undefined, integrityTable(STYLES_HOME)["1.17.2"]).stylesheet) && !template.includes("/1.15.0/"));
}
const binds = rowsOf(produced(table(["Rule", "What it decides", "Weight"], ["`RD.X.1`", "what every provider delivers", "MUST"])), "<thead>");
ok("Binds keeps the Weight a reader compares down, and folds what a rule decides into the rule's cell",
  binds.includes("<thead><tr><th>Rule</th><th>Weight</th></tr></thead>") && binds.includes("<tr><td><p><code>RD.X.1</code></p><p>what every provider delivers</p></td><td>MUST</td></tr>"), binds);
const pieces = rowsOf(produced(table(["Piece", "The question it answers", "Its terms"], ["**A provider**", "What must it build?", "Provider"], ["**Figma**", "Why elsewhere?", "—"])), "<thead>");
ok("a Model's pieces are one column: the piece, its question, and its terms as a fact",
  pieces.includes("<tr><td><p><strong>A provider</strong></p><p>What must it build?</p><span class=\"sds-small sds-facts\"><span class=\"sds-fact-key\">Terms</span><span class=\"sds-fact-value\">Provider</span></span></td></tr>") &&
  pieces.includes("<tr><td><p><strong>Figma</strong></p><p>Why elsewhere?</p></td></tr>"), pieces);
const edges = rowsOf(produced(table(["Owns", "Refuses", "Who owns that instead"], ["the build", "what a kind is", "[Targets](targets.md)"])), "<thead>");
ok("a Boundary keeps Owns beside Refuses, and who owns the refused part is a fact",
  edges.includes("<thead><tr><th>Owns</th><th>Refuses</th></tr></thead>") &&
  edges.includes("<tr><td>the build</td><td>what a kind is<span class=\"sds-small sds-facts\"><span class=\"sds-fact-key\">Owned by</span><span class=\"sds-fact-value\"><a href=\"targets.md\">Targets</a></span></span></td></tr>"), edges);
const other = rowsOf(produced(table(["Key", "Example", "Why"], ["`a`", "`b`", "c"])), "<thead>");
ok("any other table of short values keeps its columns, as written",
  other.includes("<thead><tr><th>Key</th><th>Example</th><th>Why</th></tr></thead>") && other.includes("<tr><td><code>a</code></td><td><code>b</code></td><td>c</td></tr>"), other);
// RULE.DEVEX.WORKSPACE.259: a column whose cells hold sentences is a level of the item cell, never a column.
const one = rowsOf(produced(table(["Gate", "Why there", "Weight"],
  ["the release", "it is the last point where a change can still be stopped cheaply", "MUST"],
  ["the commit", "a change is smallest there, so a finding costs the least to answer", "SHOULD"])), "<thead>");
ok("red: one column of sentences is the line under the first column's title, and the short column stays",
  one.includes("<thead><tr><th>Gate</th><th>Weight</th></tr></thead>")
  && one.includes("<tr><td><p><strong>the release</strong></p><p>it is the last point where a change can still be stopped cheaply</p></td><td>MUST</td></tr>"), one);
const two = rowsOf(produced(table(["Direction", "The question", "What it costs"],
  ["`UP`", "does the plan still hold when the estate grows by one ring", "one more pass of every check over the new ring"],
  ["`DOWN`", "can the estate shrink without a reader losing a page they rely on", "a redirect for every page that goes"])), "<thead>");
ok("red: several columns of sentences are a paragraph each, led by the column's name, under a title of code left as code",
  two.includes("<thead><tr><th>Direction</th></tr></thead>")
  && two.includes("<tr><td><p><code>UP</code></p><p><strong>The question:</strong> does the plan still hold when the estate grows by one ring</p><p><strong>What it costs:</strong> one more pass of every check over the new ring</p></td></tr>"), two);

// A rule's parenthesis on a book page is a chip, and a parenthesis that does not read stays as written.
{
  const chipped = produced("A page is handed over whole (rule RULE.DEVEX.AGENT.113 · MUST · check:page-path).\n");
  ok("[MKT.SCRIPTS.202] a checked rule's parenthesis renders as the chip, the id as its anchor and the holder on hover",
    chipped.includes('<a class="sds-badge" id="RULE.DEVEX.AGENT.113" href="#RULE.DEVEX.AGENT.113" title="check:page-path">MUST \u00b7 checked</a>'), chipped);
  ok("[MKT.SCRIPTS.202] a guidance rule renders as Guidance",
    produced("A table may carry badges (rule RULE.SUPPORT.SURFACE.059 · GUIDE).\n").includes('>Guidance</a>'));
  const bare = produced("A page is handed over whole (rule RULE.DEVEX.AGENT.113).\n");
  ok("[MKT.SCRIPTS.202] a bare parenthesis stays text", bare.includes("(rule RULE.DEVEX.AGENT.113)") && !bare.includes('id="RULE.DEVEX.AGENT.113"'));
  ok("[MKT.SCRIPTS.202] a parenthesis that does not read stays text",
    produced("A page (rule RULE.DEVEX.AGENT.113 · MUST · since:2026).\n").includes("(rule RULE.DEVEX.AGENT.113 · MUST · since:2026)"));
}

// The blocks that have a markdown spelling: catalog, cards, next, and a file frame (RULE.DEVEX.WORKSPACE.532).
{
  console.log("=== the page renderer — catalog, cards, next and a file frame, in markdown");
  const catalog = produced(fence("catalog", "Hub | the page every path starts from | hub-template.html\nGuide | stages and steps"));
  ok("[RULE.DEVEX.WORKSPACE.532] a catalog fence is one tile a line: the name, its line, its literal in code",
    catalog.includes('<div class="sds-tiles">') && catalog.includes('<div class="sds-tile"><h4>Hub</h4><p>the page every path starts from</p><p class="sds-small"><code>hub-template.html</code></p></div>')
    && catalog.includes('<div class="sds-tile"><h4>Guide</h4><p>stages and steps</p></div>'), catalog);
  ok("[RULE.DEVEX.WORKSPACE.532] a catalog line draws no code line when it has no literal", !catalog.split("\n").find((row) => row.includes("<h4>Guide</h4>"))?.includes("<code>"), catalog);
  const cards = produced(fence("cards", "Reading path | what it covers | path.md\nOther | a second door | other.md"));
  ok("[RULE.DEVEX.WORKSPACE.532] a cards fence is a tile a door: the whole tile is one link, with an arrow after the title and no Read more",
    cards.includes('<a class="sds-tile sds-door" href="path.md"><span class="sds-door-title">Reading path<span class="sds-door-arrow" aria-hidden="true">&rarr;</span></span><span class="sds-door-line">what it covers</span></a>')
      && cards.includes('href="other.md"') && !cards.includes("Read more") && !cards.includes("sds-door-kicker"), cards);
  const kicked = produced(fence("cards", "Start here | Reading path | what it covers | path.md\nOther | a second door | other.md"));
  ok("[RULE.DEVEX.WORKSPACE.532] a line of four parts puts a kicker before the title, and a line of three reads as before",
    kicked.includes('<span class="sds-door-kicker">Start here</span><span class="sds-door-title">Reading path<') && kicked.includes('href="path.md"')
      && kicked.includes('<span class="sds-door-title">Other<') && (kicked.match(/sds-door-kicker/g) ?? []).length === 1, kicked);
  ok("[RULE.DEVEX.WORKSPACE.532] one grid holds every card of the fence", (cards.match(/<div class="sds-tiles">/g) ?? []).length === 1, cards);
  const next = produced(fence("next", "previous | The page before | before.md\nnext | The page after | after.md"));
  ok("[RULE.DEVEX.WORKSPACE.532] a next fence is the two doors, previous then next",
    next.includes('<div class="sds-nextnav">') && next.includes('<a class="sds-nextnav-card" href="before.md"><span class="sds-direction">&larr; Previous</span><span class="sds-title">The page before</span></a>')
    && next.includes('<a class="sds-nextnav-card sds-next" href="after.md"><span class="sds-direction">Next &rarr;</span><span class="sds-title">The page after</span></a>'), next);
  const file = produced("```ts file=packages/x/src/theme.ts\nexport const size = 26;\n```\n");
  ok("[RULE.DEVEX.WORKSPACE.532] a fence tagged with file=<path> stands in a FILE frame: the path as the title, the language as the badge, the code plain",
    file.includes('<figure class="sds-file">') && file.includes('<span class="sds-file-path">packages/x/src/theme.ts</span><span class="sds-file-lang">ts</span>') && file.includes('<pre data-lang="ts">export const size = 26;</pre>'), file);
  const diff = produced("```diff file=docs/a.md\n- today\n+ proposed\n```\n");
  ok("[RULE.DEVEX.WORKSPACE.532] a diff stands in a FILE frame the same way", diff.includes('<span class="sds-file-lang">diff</span>') && diff.includes('data-lang="diff"'), diff);
  const plain = produced(fence("ts", "export const size = 26;"));
  ok("[RULE.DEVEX.WORKSPACE.532] a code fence with no file= stays a bare code block, no frame", !plain.includes("sds-file") && plain.includes('<pre data-lang="ts">'), plain);
  const empty = renderPage({ block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." }, markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${fence("cards", "")}`, workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md",
    furniture: { stylesheet: "", script: "", footer: "" } });
  ok("[RULE.DEVEX.WORKSPACE.532] an empty cards fence is a finding, not a silent gap", empty.findings.some((f) => f.message.includes("`cards` block with no line")), JSON.stringify(empty.findings));
}

console.log("\n=== the page renderer — a unit fence is drawn by the render and set in a frame");
{
  setUnitFence(true);
  const tree = { unit: "DSFeature", props: { pageLevel: "PAGE", type: "BACKDROP", title: "A title" } };
  const seen = [];
  setUnitRender((file) => { seen.push(JSON.parse(readFileSync(file, "utf8"))); return "<html><head></head><body><p class=\"x\">drawn & ready</p></body></html>"; });
  const made = renderPage({
    block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
    markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${fence("unit", JSON.stringify(tree))}`,
    workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md", furniture: { stylesheet: "", script: "", footer: "" },
  });
  const pageOf = (markdown, stylesheet = "") => renderPage({
    block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
    markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${markdown}`, workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md",
    furniture: { stylesheet, script: "", footer: "" },
  });
  setUnitRender(() => "<body><p>x</p></body>");
  const linked = pageOf(fence("unit", JSON.stringify(tree)), '<link rel="stylesheet" href="https://x/1.16.0/docs-language.css" integrity="sha384-b" crossorigin="anonymous">');
  setUnitRender(() => "<!doctype html><html><head><style>.a{color:red}</style></head><body><style>.b{}</style><p>body</p><script>alert(1)</script></body></html>");
  const styled = pageOf(fence("unit", JSON.stringify(tree)));
  const captionSeen = [];
  setUnitRender((file) => { captionSeen.push(JSON.parse(readFileSync(file, "utf8"))); return "<body><p>x</p></body>"; });
  const captioned = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, caption: "The `feature` hero" })));
  const sectionsSeen = [];
  setUnitRender((file) => { sectionsSeen.push(...JSON.parse(readFileSync(file, "utf8")).sections); return "<body><p>x</p></body>"; });
  pageOf(fence("unit", JSON.stringify({ sections: [{ unit: "DSFeature", props: {} }], caption: "Two" })));
  const badCaption = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, caption: 3 })));
  setUnitRender((file) => { seen.push(JSON.parse(readFileSync(file, "utf8"))); return "<html><head></head><body><p class=\"x\">drawn & ready</p></body></html>"; });
  const pinned = readFileSync(resolve(HERE, "src", "styles", "design-system-units.css"), "utf8").split("\n")[0].match(/support-web-ds-ts v(\d+\.\d+\.\d+)/)?.[1];
  ok("[MKT.SCRIPTS.613] a unit fence is wrapped as a render file holding the tree alone, `treeVersion` and its one section, and the render is given the `surface` app with the version its unit stylesheet was cut from",
    seen.length === 1 && JSON.stringify(seen[0]) === JSON.stringify({ treeVersion: 1, sections: [tree] }) && designSystemVersion(undefined, "design-system-units.css") === pinned && DEFAULT_RENDER_APP === "surface", JSON.stringify(seen));
  ok("[MKT.SCRIPTS.613] the unit's markup stands in the page itself, once in light and once in dark, side by side, with the tree below as code, and no frame",
    made.findings.length === 0 && made.html.includes('<span class="sds-file-path">DSFeature</span><span class="sds-file-lang">unit</span>')
      && made.html.includes('<div class="sds-unit" data-mode="light"><p class="x">drawn & ready</p></div>') && made.html.includes('<div class="sds-unit" data-mode="dark"><p class="x">drawn & ready</p></div>')
      && made.html.includes('<div class="sds-unit-pair">') && !made.html.includes("<iframe") && !made.html.includes("srcdoc") && made.html.includes('<pre data-lang="json">'), made.html.slice(-1800));
  ok("[MKT.SCRIPTS.613] a page with a unit fence links design-system-units.css after the shared stylesheet, from the same folder, and a page with none does not",
    linked.html.indexOf("docs-language.css") > 0 && linked.html.indexOf("design-system-units.css") > linked.html.indexOf("docs-language.css") && linked.html.includes('href="https://x/1.16.0/design-system-units.css"') && !/design-system-units\.css"[^>]*integrity/.test(linked.html)
      && !produced(fence("json", "{}")).includes("design-system-units.css"), linked.html.slice(0, 600));
  ok("[MKT.SCRIPTS.613] the unit's markup holds no style and no script, whatever the printed page carried",
    !/<style|<script/.test(styled.html.slice(styled.html.indexOf("sds-unit-pair"), styled.html.indexOf("</figure>"))) && styled.html.includes("<p>body</p>"), styled.html.slice(-900));
  ok("[MKT.SCRIPTS.613] a caption is the figcaption's text, the unit's name stays as the small label, and the caption is out of the tree sent to the render and of the tree shown",
    captioned.html.includes('<span class="sds-file-path">The <code>feature</code> hero</span><span class="sds-file-lang">DSFeature</span>')
      && captionSeen.length === 1 && !("caption" in captionSeen[0].sections[0]) && !JSON.stringify(captionSeen[0]).includes("hero")
      && !captioned.html.includes('"caption"'), captioned.html.slice(-900));
  ok("[MKT.SCRIPTS.613] a caption beside sections is taken out too, and a caption that is no string stops the write",
    JSON.stringify(sectionsSeen) === JSON.stringify([{ unit: "DSFeature", props: {} }]) && badCaption.findings.length === 1 && badCaption.findings[0].stops === true, JSON.stringify(badCaption.findings));
  setUnitRender(() => { throw new Error("DSFeature has no prop `kind`"); });
  const refused = renderPage({
    block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
    markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${fence("unit", JSON.stringify(tree))}`,
    workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md", furniture: { stylesheet: "", script: "", footer: "" },
  });
  ok("[MKT.SCRIPTS.613] a render's refusal is a finding that stops the write, with the render's words, and no frame is drawn",
    refused.findings.length === 1 && refused.findings[0].stops === true && refused.findings[0].message.includes("DSFeature has no prop `kind`") && !refused.html.includes("<iframe"), JSON.stringify(refused.findings));
  // Window-sized units stand in a frame.
  const framedSeen = [];
  setUnitRender((file) => { framedSeen.push(JSON.parse(readFileSync(file, "utf8"))); return '<!doctype html><html lang="en"><head><style>a{}</style></head><body><p class="w">a "whole" page & more</p></body></html>'; });
  const layoutTree = { unit: "DSLayout", props: { type: "RAIL" } };
  const layout = pageOf(fence("unit", JSON.stringify(layoutTree)), '<link rel="stylesheet" href="https://x/1.16.0/docs-language.css">');
  const manySections = pageOf(fence("unit", JSON.stringify({ sections: [{ unit: "DSFeature", props: {} }, { unit: "DSFeature", props: {} }] })));
  const forcedOff = pageOf(fence("unit", JSON.stringify({ ...layoutTree, frame: false })));
  const forcedOn = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, frame: true, caption: "Framed" })));
  const badFrame = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, frame: "yes" })));
  const iframes = layout.html.match(/<iframe\b[^>]*>/g) ?? [];
  ok("[MKT.SCRIPTS.627] a unit fence whose first unit is DSLayout is drawn in two frames, light and dark, side by side, 640px high and full width",
    layout.findings.length === 0 && iframes.length === 2 && iframes[0].includes('data-mode="light"') && iframes[1].includes('data-mode="dark"')
      && iframes.every((tag) => tag.includes('height="640"') && tag.includes('width="100%"')) && layout.html.includes('<div class="sds-unit-pair">') && !layout.html.includes('class="sds-unit"'), layout.html.slice(-1500));
  const srcdocs = [...layout.html.matchAll(/srcdoc="([^"]*)"/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  ok("[MKT.SCRIPTS.627] a frame's srcdoc is a document built from the render's markup alone: design-system.css linked at the page's stylesheet version with no integrity, its mode on the html element, its quotes and ampersands escaped in the attribute",
    srcdocs.length === 2 && srcdocs[0].startsWith("<!doctype html><html lang=\"en\" data-mode=\"light\">") && srcdocs[1].includes('data-mode="dark"') && !srcdocs[0].includes("<style>a{}</style>")
      && srcdocs[0].includes('<link rel="stylesheet" href="https://x/1.16.0/design-system.css">') && srcdocs[1].includes('data-mode="dark"')
      && srcdocs[0].includes('<p class="w">a "whole" page & more</p>') && layout.html.includes("a &quot;whole&quot; page &amp; more"), layout.html.slice(-1500));
  ok("[MKT.SCRIPTS.627] a unit drawn in a frame needs no design-system-units.css, so the page links none, and the tree is still shown below",
    !layout.html.includes("design-system-units.css") && layout.html.includes('<pre data-lang="json">'));
  ok("[MKT.SCRIPTS.627] a tree with more than one section is drawn in a frame too",
    (manySections.html.match(/<iframe\b/g) ?? []).length === 2 && !manySections.html.includes("design-system-units.css"), manySections.html.slice(-800));
  ok("[MKT.SCRIPTS.627] \"frame\": false draws a layout inline, and \"frame\": true frames a small unit; the key is out of the tree sent to the render and of the tree shown",
    !forcedOff.html.includes("<iframe") && forcedOff.html.includes('class="sds-unit" data-mode="light"') && (forcedOn.html.match(/<iframe\b/g) ?? []).length === 2
      && !forcedOn.html.includes('"frame"') && !forcedOff.html.includes('"frame"') && framedSeen.every((seen) => !JSON.stringify(seen).includes('"frame"')) && forcedOn.html.includes("Framed"), forcedOff.html.slice(-800));
  ok("[MKT.SCRIPTS.627] a frame that is no boolean stops the write",
    badFrame.findings.length === 1 && badFrame.findings[0].stops === true && badFrame.findings[0].message.includes("`frame`"), JSON.stringify(badFrame.findings));
  // The new render: the tree alone, the app from `--app`, both modes in one call, html by mode and device.
  const calls = [];
  const modes = (light, dark, extra = {}) => JSON.stringify({ renderVersion: 1, ds: "11.21.0", app: "www", renders: { LIGHT: { DESKTOP: { html: light, findings: [], ...extra } }, DARK: { DESKTOP: { html: dark, findings: [] } } } });
  setUnitRender((file, options) => { calls.push({ file: JSON.parse(readFileSync(file, "utf8")), options }); return modes('<p class="l">light</p>', '<p class="d">dark</p>'); });
  const small = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, app: "docs" })));
  const whole = pageOf(fence("unit", JSON.stringify({ unit: "DSLayout", props: {} })));
  ok("[MKT.SCRIPTS.632] a unit fence is drawn by one call of the new render, each mode taking its own html, and the fence's `app` names the app row and is out of the tree",
    calls.length === 2 && calls[0].options.app === "docs" && !("inline" in calls[0].options) && JSON.stringify(calls[0].file) === JSON.stringify({ treeVersion: 1, sections: [{ unit: "DSFeature", props: {} }] })
      && small.html.includes('data-mode="light"><p class="l">light</p>') && small.html.includes('data-mode="dark"><p class="d">dark</p>') && !small.html.includes('"app"'), small.html.slice(-700));
  ok("[MKT.SCRIPTS.632] the `surface` app is drawn with --ds, the version design-system-units.css was cut from, and a fence naming another app sends no --ds",
    calls[1].options.ds === designSystemVersion(undefined, "design-system-units.css") && /^\d+\.\d+\.\d+$/.test(calls[1].options.ds) && calls[0].options.app === "docs" && !("ds" in calls[0].options));
  ok("[MKT.SCRIPTS.632] a framed unit is drawn by the same render call as any other, with the default app where the fence names none, and each frame holds its mode's page",
    !("inline" in calls[1].options) && calls[1].options.app === DEFAULT_RENDER_APP && /srcdoc="[^"]*light/.test(whole.html) && /srcdoc="[^"]*dark/.test(whole.html), whole.html.slice(-700));
  setUnitRender(() => modes("<p>x</p>", "<p>y</p>", { findings: [{ message: "DSFeature has no prop `kind`" }] }));
  const lightFinding = pageOf(fence("unit", JSON.stringify(tree)));
  setUnitRender(() => JSON.stringify({ renders: { LIGHT: { DESKTOP: { html: "<p>x</p>", findings: [] } }, DARK: { DESKTOP: { html: "<p>y</p>", findings: ["dark said no"] } } } }));
  const darkFinding = pageOf(fence("unit", JSON.stringify(tree)));
  ok("[MKT.SCRIPTS.632] a finding in any mode stops the write with the render's words",
    lightFinding.findings.length === 1 && lightFinding.findings[0].stops === true && lightFinding.findings[0].message.includes("no prop `kind`")
      && darkFinding.findings.length === 1 && darkFinding.findings[0].stops === true && darkFinding.findings[0].message.includes("dark said no"), JSON.stringify([lightFinding.findings, darkFinding.findings]));
  ok("[MKT.SCRIPTS.632] a `unit` fence whose `app` is no string stops the write", pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, app: 3 }))).findings.some((f) => f.stops && f.message.includes("`app`")));
  const both = pagesFromRender(modes("<p>L</p>", "<p>D</p>"));
  const oldShape = pagesFromRender(JSON.stringify({ pages: [{ html: "<p>one</p>", findings: [] }] }));
  ok("[MKT.SCRIPTS.632] pagesFromRender reads the new shape by mode, and the released `pages` shape for both modes",
    both.LIGHT === "<p>L</p>" && both.DARK === "<p>D</p>" && oldShape.LIGHT === "<p>one</p>" && oldShape.DARK === "<p>one</p>" && pageFromRender(modes("<p>L</p>", "<p>D</p>")) === "<p>L</p>");
  let refusedNew = "";
  try { pagesFromRender(JSON.stringify({ renders: { LIGHT: { DESKTOP: { findings: [] } } } })); } catch (e) { refusedNew = e.message; }
  ok("[MKT.SCRIPTS.632] a mode with no html is refused by its name", refusedNew.includes("LIGHT") && refusedNew.includes("`html`"), refusedNew);
  setUnitRender();
  setUnitFence();
}

const made = (markdown) => renderPage({
  block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
  markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${markdown}\n`, workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md",
  furniture: { stylesheet: "", script: "", footer: "" },
});
const tilde = (tag, body) => `~~~${tag}\n${body}\n~~~\n`;

console.log("\n=== the page renderer — a skeleton of a built unit, and a table that reads as a catalog");
{
  const skeleton = (extra, unit = "DSFeature") => fence("dg", JSON.stringify({
    kind: "skeleton", caption: "A sketch", ...extra,
    frame: { label: "A frame", unit, rows: [{ label: "Row", items: [{ text: "One" }] }] },
  }));
  const built = made(skeleton({}));
  ok("[MKT.SCRIPTS.629] a `dg` skeleton whose frame names a unit the design system builds is drawn on a docs page, with no finding",
    built.findings.length === 0 && built.html.includes("<svg"), JSON.stringify(built.findings));
  ok("[MKT.SCRIPTS.629] a skeleton marked `\"planned\": true` and one whose unit is not built are drawn too",
    made(skeleton({ planned: true })).findings.length === 0 && made(skeleton({}, "DSCard")).findings.length === 0, JSON.stringify(made(skeleton({ planned: true })).findings));
  const deep = made(fence("dg", JSON.stringify({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame: { rows: [{ items: [{ frame: { unit: "DSLayout", rows: [{ items: [{ text: "x" }] }] } }] }] } }] })));
  ok("[MKT.SCRIPTS.629] a unit named in a view or a nested frame is drawn without a stop", !deep.findings.some((f) => f.stops === true), JSON.stringify(deep.findings));
  const fenced = made(fence("unit", JSON.stringify({ unit: "DSFeature", props: {} })));
  ok("[MKT.SCRIPTS.629] a `unit` fence on a docs page stops the write: a render belongs on a surface sample page, and the page draws the unit's structure as a skeleton and names its showcase page",
    fenced.findings.length === 1 && fenced.findings[0].stops === true && fenced.findings[0].message.includes("surface sample page") && fenced.findings[0].message.includes("`dg` skeleton") && fenced.findings[0].message.includes("showcase page") && !fenced.html.includes("sds-unit"), JSON.stringify(fenced.findings));

  const rows = (n) => Array.from({ length: n }, (_, k) => [`Thing ${k + 1}`, `what thing ${k + 1} is`]);
  const catalog = made(table(["Name", "Description"], ...rows(5)));
  ok("[MKT.SCRIPTS.630] a plain table of a name column and a description column past four rows is a soft finding that points to a catalog fence",
    catalog.findings.length === 1 && !catalog.findings[0].stops && catalog.findings[0].message.includes("reads as a catalog") && catalog.findings[0].message.includes("`catalog`"), JSON.stringify(catalog.findings));
  ok("[MKT.SCRIPTS.630] four rows, a wide comparison of attributes, and a Terms table draw none",
    made(table(["Name", "Description"], ...rows(4))).findings.length === 0
      && made(table(["Name", "Reads", "Writes", "Owns"], ...rows(6).map((r) => [...r, "x", "y"]))).findings.length === 0
      && made(table(["Term", "Contract term", "What it means"], ...rows(6).map((r) => [r[0], "`X`", r[1]]))).findings.length === 0
      && made(table(["Piece", "The question it answers", "Its terms"], ...rows(6).map((r) => [r[0], r[1], "t"]))).findings.every((f) => !f.message.includes("reads as a catalog")));
}

console.log("\n=== the page renderer — a catalog whose names read as conditions");
{
  const cond = made(fence("catalog", "how ideas connect | a map\na unit not built | a unit fence"));
  ok("[RULE.DEVEX.WORKSPACE.549] a catalog item whose name starts with a lower-case article or question word is a soft finding naming the item",
    cond.findings.length === 1 && !cond.findings[0].stops && cond.findings[0].message === 'a `catalog` item "how ideas connect" reads as a condition: a first column of conditions is a table (rule 549)', JSON.stringify(cond.findings));
  ok("[RULE.DEVEX.WORKSPACE.549] a digit opens a condition, and a capitalised or plain name does not",
    made(fence("catalog", "5 files | a count")).findings.length === 1 && made(fence("catalog", "The Map | a map\nReach | a measure")).findings.length === 0);
}

console.log("\n=== the page renderer — a catalog with no layout whose items are long for cards");
{
  const longLine = Array.from({ length: 18 }, (_, k) => "w" + k).join(" ");
  const long = made(fence("catalog", "Reach | " + longLine));
  ok("[RULE.DEVEX.WORKSPACE.549] a catalog with no layout whose item line is past fifteen words is a soft finding to use LIST",
    long.findings.length === 1 && !long.findings[0].stops && long.findings[0].message === "these items are long for cards: layout=LIST (rule 549)", JSON.stringify(long.findings));
  ok("[RULE.DEVEX.WORKSPACE.549] a short card, and a long item with layout=LIST, draw none",
    made(fence("catalog", "Reach | a short line")).findings.length === 0 && made(fence("catalog layout=LIST", "Reach | " + longLine)).findings.length === 0);
}

console.log("\n=== the page renderer — a catalog in three layouts, with media and facts");
{
  const legacy = made(fence("catalog", "Name | one line | `literal`\nOther | more"));
  ok("[MKT.SCRIPTS.614] today's catalog spelling draws exactly as it did: one tile each, no data attribute",
    legacy.html.includes('  <div class="sds-tiles">\n    <div class="sds-tile"><h4>Name</h4><p>one line</p><p class="sds-small"><code>literal</code></p></div>\n    <div class="sds-tile"><h4>Other</h4><p>more</p></div>\n  </div>') && legacy.findings.length === 0, legacy.html);
  const grid = made(fence("catalog", "`RAIL` | a sidebar\n  Navigation: at the side\n  Takes: DASHBOARD; RESOURCES\nCANVAS | the body alone\n  Navigation: none"));
  ok("[MKT.SCRIPTS.614] facts under an item draw a GRID card: a data-facts count, the line, and a dl of key and value; two short facts share one row (S77)",
    grid.html.includes('<div class="sds-tiles" data-layout="GRID">') && grid.html.includes('<div class="sds-tile" data-facts="1"><h4><code>RAIL</code></h4><p class="sds-tile-line">a sidebar</p>')
      && grid.html.includes('<dl class="sds-tile-facts"><div class="sds-tile-fact-row"><div><dt>Navigation</dt><dd>at the side</dd></div><div><dt>Takes</dt><dd>DASHBOARD; RESOURCES</dd></div></div></dl>')
      && grid.html.includes('<dl class="sds-tile-facts"><div><dt>Navigation</dt><dd>none</dd></div></dl>') && grid.findings.length === 0, grid.html);
  const mixed = made(fence("catalog", "PORTAL | an app many Everyday users use for themselves\n  Category: APP\n  Person: Everyday users\n  Example: the SPNHiring job portal, and a customer's own account"));
  ok("[MKT.SCRIPTS.614] a GRID card's short facts stand in one row and a longer fact stacks under them, counted as two rows (S77)",
    mixed.html.includes('data-facts="2"') && mixed.html.includes('<div class="sds-tile-fact-row"><div><dt>Category</dt><dd>APP</dd></div><div><dt>Person</dt><dd>Everyday users</dd></div></div><div class="sds-tile-fact-wide"><dt>Example</dt>'), mixed.html);
  const list = made(fence("catalog layout=LIST", "MARKETING | a site\n  Layouts: `TOPNAV` for the site\n  Sections: every site section"));
  ok("[MKT.SCRIPTS.614] layout=LIST draws one card a row, its words and its facts in a body",
    list.html.includes('data-layout="LIST"') && list.html.includes('<div class="sds-tile"><div class="sds-tile-body"><h4>MARKETING</h4><p>a site</p>') && list.html.includes("<dt>Layouts</dt><dd><code>TOPNAV</code> for the site</dd>") && !list.html.includes("data-facts"), list.html);
  ok("[MKT.SCRIPTS.614] a LIST card with one fact says so, for the stylesheet", made(fence("catalog layout=LIST", "A | a\n  Key: one longer phrase of a value")).html.includes("sds-tile-facts sds-tile-facts-one"));
  const sideList = made(fence("catalog layout=LIST facts=END", "A | a\n  Weight: MUST\nB | b\n  Weight: GUIDE"));
  ok("[MKT.SCRIPTS.614] a LIST with facts=END marks the list data-facts=side, names the column once in a head row and draws no one-line fact",
    sideList.html.includes('data-layout="LIST" data-facts="side" data-columns="1"') && sideList.html.includes('<div class="sds-tiles-head" aria-hidden="true"><span>Item</span><span>Weight</span></div>')
      && sideList.html.includes('<div class="sds-tile-main"><div class="sds-tile-body"><h4>A</h4><p>a</p></div></div>') && sideList.html.includes('<dl class="sds-tile-facts"><div><dt>Weight</dt><dd>MUST</dd></div></dl>') && !sideList.html.includes("facts-one"), sideList.html);
  const quoted = made(fence("catalog layout=LIST facts=END", "Block | what it catches\n  > a table of 6 rows reads as a catalog\n  ~ When: only on a seat file\n  Grade: soft"));
  ok("[MKT.SCRIPTS.614] a > line under an item is a quoted italic line and a ~ line is a note, both in the body under the description, beside a side fact",
    quoted.html.includes('<p>what it catches</p><p class="sds-tile-quote">&ldquo;a table of 6 rows reads as a catalog&rdquo;</p><p class="sds-tile-note"><span>When</span> <em>only on a seat file</em></p></div></div>') && quoted.html.includes('data-facts="side"') && quoted.findings.length === 0, quoted.html);
  const counted = made(fence("catalog layout=LIST facts=END name=Form", "Trees | boxes\n  Items: 11\n  State: new\nTables | rows\n  Items: 24\n  State: old"));
  ok("[MKT.SCRIPTS.614] a list with side columns heads the main column with name= and every side column with its key, each heading and value set at the start (S75)",
    counted.html.includes('<div class="sds-tiles-head" aria-hidden="true"><span>Form</span><span>Items</span><span>State</span></div>') && counted.html.includes('<div><dt>Items</dt><dd>11</dd></div>') && !counted.html.includes('data-align'), counted.html);
  const below = made(fence("catalog layout=LIST", "ORG | members\n  Per call: the record's organization is the caller\n  Writes: as permitted\nPARENT_ORG | above\n  Per call: the platform: no filter; otherwise the record's parent organization is the caller\nCHILD_ORG | below\n  Per call: the child column is the caller"));
  ok("[MKT.SCRIPTS.614] facts below the line stand in one column per fact name on every item: no fact takes the row, and a missing fact keeps its column empty",
    !below.html.includes("sds-tile-fact-wide") && below.html.includes('<dl class="sds-tile-facts"><div><dt>Per call</dt><dd>the platform: no filter; otherwise the record&#39;s parent organization is the caller</dd></div><div class="sds-tile-fact-none"></div></dl>') || (!below.html.includes("sds-tile-fact-wide") && below.html.includes('<div><dt>Per call</dt><dd>the child column is the caller</dd></div><div class="sds-tile-fact-none"></div></dl>')));
  const tagged = made(fence("catalog layout=LIST facts=END", "TOOLCHAIN | the bases resolve\n  Owes: [UNIT]\nAPP_WEB | the UI face\n  Owes: [JOURNEY] [COMPONENT]"));
  ok("[MKT.SCRIPTS.614] a fact written as bracketed codes draws one badge for each, and up to three tags stand in a side column",
    tagged.html.includes('data-facts="side"') && tagged.html.includes('<dd><span class="sds-tags"><span class="sds-badge">JOURNEY</span> <span class="sds-badge">COMPONENT</span></span></dd>'));
  ok("[MKT.SCRIPTS.614] one long fact, a sentence, or three facts keeps the facts under the description",
    !made(fence("catalog layout=LIST", "A | a\n  Weight: MUST\nB | b\n  Weight: this value is longer than twenty")).html.includes("data-facts")
      && !made(fence("catalog layout=LIST", "A | a\n  Weight: Do it. Now")).html.includes("data-facts")
      && !made(fence("catalog layout=LIST", "A | a\n  K1: x\n  K2: y\n  K3: z")).html.includes("data-facts"));
  ok("[MKT.SCRIPTS.614] two short facts make two columns, an empty cell where an item has none of a key",
    made(fence("catalog layout=LIST facts=END", "A | a\n  Weight: MUST\n  Since: 1.2\nB | b\n  Since: 1.3")).html.includes('data-columns="2"') && made(fence("catalog layout=LIST facts=END", "A | a\n  Weight: MUST\n  Since: 1.2\nB | b\n  Since: 1.3")).html.includes('<div class="sds-tile-fact-none"></div>'));
  const bare = made(fence("catalog layout=LIST facts=END", "Kinds | which rules are shared?\n  Terms: Kind of surface\nLevels | what does each level own?\n  Terms: Level · Block\nOwes | what does every page owe?"));
  ok("[MKT.SCRIPTS.614] an item with no fact keeps the list's short facts in a side column, its own cell empty (RULE.DEVEX.WORKSPACE.563)",
    bare.html.includes('data-columns="1"') && bare.html.includes('<div class="sds-tile-fact-none"></div>') && !bare.html.includes("sds-tile-facts-one"));
  const tab = made(fence("catalog layout=TABLE", "A | first\n  Layouts: x\n  Pages: p\nB | second\n  Layouts: y\n  Sections: s"));
  ok("[MKT.SCRIPTS.614] layout=TABLE makes the things columns and each fact key a row, an empty cell where a thing has none",
    tab.html.includes('<table class="sds-catalog-table">') && tab.html.includes("<thead><tr><th></th><th><h4>A</h4><p>first</p></th><th><h4>B</h4><p>second</p></th></tr></thead>")
      && tab.html.includes("<tr><th>Layouts</th><td>x</td><td>y</td></tr>") && tab.html.includes("<tr><th>Pages</th><td>p</td><td></td></tr>") && tab.html.includes("<tr><th>Sections</th><td></td><td>s</td></tr>"), tab.html);
  const icon = made(fence("catalog media=ICON", "Text page | plain text | file\n  Types: MARKETING"));
  ok("[MKT.SCRIPTS.614] media=ICON draws the named icon beside the words, in a head row",
    icon.html.includes('data-layout="GRID" data-media="ICON"') && icon.html.includes('<div class="sds-tile-head"><span class="sds-tile-media" data-media="ICON"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 22a2') && icon.html.includes("<h4>Text page</h4><p>plain text</p></div></div>"), icon.html);
  ok("[MKT.SCRIPTS.614] media=MARK draws the icon in a mark, and an icon that is not named is a finding with a plain circle",
    made(fence("catalog media=MARK", "Site | a site | globe\n  For: a Visitor")).html.includes('data-media="MARK"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5')
      && made(fence("catalog media=MARK", "Site | a site | nonesuch\n  For: a Visitor")).findings.some((f) => f.message.includes("nonesuch")));
  ok("[MKT.SCRIPTS.667] media=MARK draws MARKETPLACE's search icon, a lens and its handle, with no finding",
    ((one) => one.html.includes('data-media="MARK"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>') && !one.findings.length)(made(fence("catalog media=MARK", "MARKETPLACE | a site for a Seeker | search\n  Person: Seeker"))));
  ok("[MKT.SCRIPTS.614] media=AVATAR draws initials, the name's first letter or the third cell",
    made(fence("catalog media=AVATAR", "Team | who work\n  Often: daily")).html.includes('data-media="AVATAR">T</span>') && made(fence("catalog media=AVATAR", "Team | who work | ab\n  Often: daily")).html.includes('data-media="AVATAR">AB</span>'));
  ok("[MKT.SCRIPTS.614] media=AVATAR_GROUP draws several overlapping initials",
    made(fence("catalog media=AVATAR_GROUP", "Crew | a team | a, b, c\n  Often: daily")).html.includes('data-media="AVATAR_GROUP"><span>A</span><span>B</span><span>C</span></span>'));
  const top = made(fence("catalog media=MEDIA_TOP", "`RAIL` | a sidebar | rail\n  Navigation: at the side"));
  ok("[MKT.SCRIPTS.614] media=MEDIA_TOP draws a picture over the words, the drawing the third cell names",
    top.html.includes('data-media="MEDIA_TOP"') && top.html.includes('<div class="sds-tile-picture"><svg class="sds-wire"') && top.html.includes('<rect class="nav" x="1" y="1" width="34"') && top.html.includes("<h4><code>RAIL</code></h4>") && top.findings.length === 0, top.html);
  ok("[MKT.SCRIPTS.614] a layout or a media that is none of the closed names stops the write",
    made(fence("catalog layout=ROWS", "A | a")).findings.some((f) => f.stops && f.message.includes("ROWS")) && made(fence("catalog media=PHOTO", "A | a")).findings.some((f) => f.stops && f.message.includes("PHOTO")));
  ok("[MKT.SCRIPTS.614] a fact whose key is a sentence is a finding, and so is a GRID card of four facts",
    made(fence("catalog", "A | a\n  This is a whole sentence of a key: value")).findings.some((f) => f.message.includes("never a sentence"))
      && made(fence("catalog", "A | a\n  One: 1\n  Two: 2\n  Three: 3\n  Four: 4")).findings.some((f) => f.message.includes("up to three facts")));
  // S75 (the developer, 2026-11-24): the fence names where a LIST's facts stand, and the writer never infers it.
  const guess = made(fence("catalog layout=LIST", "A | a\n  Weight: MUST\nB | b\n  Weight: GUIDE"));
  ok("[RULE.DEVEX.WORKSPACE.563] a LIST with no facts= draws its facts after the description, and short facts alone are a soft finding that names facts=END",
    !guess.html.includes('data-facts="side"') && guess.html.includes("sds-tile-facts-one") && guess.findings.length === 1 && !guess.findings[0].stops && guess.findings[0].message.includes("`facts=END`"), JSON.stringify(guess.findings));
  const tooLong = made(fence("catalog layout=LIST facts=END", "A | a\n  Weight: MUST\nB | b\n  Weight: this value is longer than twenty"));
  ok("[RULE.DEVEX.WORKSPACE.563] facts=END with a value past a short fact stops the write, naming the item, the key and facts=AFTER_DESCRIPTION",
    tooLong.findings.some((f) => f.stops && f.message.includes("B: Weight") && f.message.includes("`facts=AFTER_DESCRIPTION`")), JSON.stringify(tooLong.findings));
  ok("[RULE.DEVEX.WORKSPACE.563] facts=END holds up to three columns, and a fourth key stops the write",
    made(fence("catalog layout=LIST facts=END", "A | a\n  K1: x\n  K2: y\n  K3: z\n  K4: w")).findings.some((f) => f.stops && f.message.includes("up to three columns")));
  const one = made(fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "Move | going to another place\n  Blocks: the layout · `DSNavList` · `DSNavMenu` · `DSTabs`\nFind | search and filter\n  Blocks: `DSFilterBar` · `DSDataTable`"));
  ok("[RULE.DEVEX.WORKSPACE.563] one fact name across the list is one Key: value line under the description",
    one.html.includes('<dl class="sds-tile-facts sds-tile-facts-one"><div><dt>Blocks</dt>') && !one.html.includes("data-columns") && one.findings.length === 0, one.html);
  const cells = made(fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "MARKETING | a site\n  Example: saasplane.ai, and the SPNHiring site\n  For: a Visitor deciding whether a product is for them\nDOCS | pages\n  Example: the book's pages, and a help centre"));
  ok("[RULE.DEVEX.WORKSPACE.563] two or more fact names are cells, a column per key in the same place on every item, an empty cell kept",
    cells.html.includes('<dl class="sds-tile-facts" data-columns="2"><div><dt>Example</dt>') && cells.html.includes('<div class="sds-tile-fact-none"></div></dl>') && !cells.html.includes("sds-tile-fact-wide"), cells.html);
  const bareTags = made(fence("catalog layout=GRID", "MARKETING | a site\n  [UNIT] [PAGE]"));
  ok("[RULE.DEVEX.WORKSPACE.564] a line of tags with no key is the item's one fact, drawn as its badges alone",
    bareTags.html.includes('<div class="sds-tile-fact-bare"><dt hidden>Tags</dt><dd><span class="sds-tags"><span class="sds-badge">UNIT</span> <span class="sds-badge">PAGE</span></span></dd></div>') && !bareTags.html.includes("<dt>") && bareTags.findings.length === 0, bareTags.html);
  ok("[RULE.DEVEX.WORKSPACE.564] tags with no key beside another fact are a finding, and facts= on a GRID is a finding",
    made(fence("catalog layout=GRID", "MARKETING | a site\n  [UNIT]\n  Person: Visitor")).findings.some((f) => f.message.includes("tags stand bare only"))
      && made(fence("catalog layout=GRID facts=END", "A | a\n  K: v")).findings.some((f) => f.message.includes("in LIST only"))
      && made(fence("catalog layout=LIST facts=BELOW", "A | a\n  K: v")).findings.some((f) => f.stops && f.message.includes("END, AFTER_DESCRIPTION")));
  ok("[MKT.SCRIPTS.614] a media in TABLE and MEDIA_TOP in LIST are findings, not silent",
    made(fence("catalog layout=TABLE media=ICON", "A | a\n  K: v")).findings.length === 1 && made(fence("catalog layout=LIST media=MEDIA_TOP facts=AFTER_DESCRIPTION", "A | a\n  K: v")).findings.length === 1);
}

console.log("\n=== the page renderer — groups in a catalog are panels");
{
  const grouped = made(fence("catalog", "## Actions\n`DSButton` | a button\n`DSToolbar` | a toolbar\n## Typography\n`DSKbd` | a key"));
  ok("[MKT.SCRIPTS.614] two groups are two panels, each with its name and count in the head and its members as a catalog in the body",
    grouped.html.includes('<section class="sds-group" id="g-actions" aria-labelledby="g-actions-title">') && grouped.html.includes('<h5 id="g-actions-title">Actions</h5><span class="sds-group-count">2 items</span>')
      && grouped.html.includes('<span class="sds-group-count">1 item</span>') && grouped.html.includes('<div class="sds-group-body"><div class="sds-tiles sds-tiles-compact" data-layout="GRID">') && grouped.findings.length === 0, grouped.html);
  ok("[MKT.SCRIPTS.614] a row of links above the panels jumps to each",
    grouped.html.includes('<nav class="sds-group-jumps" aria-label="Groups"><a class="sds-group-jump" href="#g-actions">Actions <span>2</span></a> <a class="sds-group-jump" href="#g-typography">Typography <span>1</span></a></nav>')
      && grouped.html.indexOf("sds-group-jumps") < grouped.html.indexOf('<section class="sds-group"'));
  const one = made(fence("catalog", "## Only\nA | a\nB | b"));
  ok("[MKT.SCRIPTS.614] one group is no panel: the catalog is drawn as one, with no jump row",
    !one.html.includes("sds-group") && one.html.includes('<div class="sds-tiles">'));
  ok("[MKT.SCRIPTS.614] a group takes the fence's layout, and items above the first group are a finding",
    made(fence("catalog layout=LIST", "## A\nx | y\n  K: v\n## B\nz | w\n  K: u")).html.includes('data-layout="LIST"')
      && made(fence("catalog", "stray | item\n## A\nx | y\n## B\nz | w")).findings.some((f) => f.message.includes("above its first")));
}

console.log("\n=== the page renderer — group fences are panels");
{
  const inTabs = tilde("group Structure | how a category's pages are built", tilde("tabs", "--- Layouts\n" + fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "Topnav | a bar\n  Unit: DSTopnav") + "--- Pages\nNone yet."));
  const g = made(inTabs);
  ok("[MKT.SCRIPTS.638] a group with a description holding tabs is one panel: its name and tab count in the head, the description a line under the name, the tabs in the body",
    g.html.includes('<section class="sds-group" id="g-structure" aria-labelledby="g-structure-title">') && g.html.includes(`<h5 id="g-structure-title">Structure</h5><p class="sds-group-line">how a category's pages are built</p>`)
      && g.html.includes('<span class="sds-group-count">2 tabs</span>') && /<div class="sds-group-body">\s*<div class="sds-tabset"/.test(g.html) && g.findings.length === 0 && !g.html.includes("~~~"), g.html + JSON.stringify(g.findings));
  ok("[MKT.SCRIPTS.638] a LIST in a tab is the Plan table's rows: the name in bold, the description under it, the other facts on one small line joined with a dot, and the bracketed code a badge at the row's end",
    g.html.includes('<tr><td><p><strong>Topnav</strong></p><p>a bar</p><span class="sds-small sds-facts"><span class="sds-fact-key">Unit</span><span class="sds-fact-value">DSTopnav</span></span></td>') && !g.html.includes("sds-tile"), g.html);
  const b = made(tilde("group Structure", tilde("tabs", "--- Layouts\n" + fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "Topnav | a bar\n  Code: [TOPNAV]\n  Unit: DSSiteLayout\n  Level: site") + "--- Pages\nNone yet.")));
  ok("[MKT.SCRIPTS.638] the one fact of bracketed codes is a badge in a second cell, and the facts left are one small line joined with a dot",
    b.html.includes('<span class="sds-small sds-facts"><span class="sds-fact-key">Unit</span><span class="sds-fact-value">DSSiteLayout</span> &middot; <span class="sds-fact-key">Level</span><span class="sds-fact-value">site</span></span></td><td><span class="sds-tags"><span class="sds-badge">TOPNAV</span></span></td>'), b.html);
  const c = made(tilde("group Data entry", fence("catalog", "DSInput | one line of text\nDSSelect | a choice")));
  ok("[MKT.SCRIPTS.639] a group holding a catalog is one panel with the item count, and one group has no jump row",
    c.html.includes('<h5 id="g-data-entry-title">Data entry</h5><span class="sds-group-count">2 items</span>') && c.html.includes('<div class="sds-tiles">') && !c.html.includes("sds-group-jumps") && !c.html.includes("sds-group-line") && c.findings.length === 0, c.html);
  const two = made(inTabs + "\n" + tilde("group Style | how pages look", tilde("tabs", "--- Theme\nColours.\n--- Media\nPictures.\n--- Words\nText.")) + "\n\nAfter prose.");
  ok("[MKT.SCRIPTS.640] consecutive fenced groups stand as panels with no row of jump links, and the prose after them is a paragraph",
    !two.html.includes("sds-group-jumps") && two.html.includes("<p>After prose.</p>") && (two.html.match(/<section class="sds-group"/g) ?? []).length === 2 && two.findings.length === 0, two.html + JSON.stringify(two.findings));
  const guided = "Topnav | a bar\n  Code: [TOPNAV]\n  For: VISITOR\n  Choose when: a site with few pages\n  Not when: the pages are many → RAIL\n  Not when: the page is an app → DOCK\n  Rules: RULE.SUPPORT.SURFACE.206";
  const gp = made(tilde("group Structure | how pages are built", tilde("tabs", "--- Layouts\n" + fence("catalog layout=LIST facts=AFTER_DESCRIPTION", guided) + "--- Pages\nNone yet.")));
  const gl = made(fence("catalog layout=LIST facts=AFTER_DESCRIPTION", guided));
  const fold = (h) => (h.match(/<details class="sds-fold sds-guidance"><summary>Guidance<\/summary>/g) ?? []).length === 1 && !/<details[^>]* open/.test(h)
    && h.includes("<strong>For</strong> VISITOR") && h.includes("<strong>Choose when</strong> a site with few pages") && (h.match(/<strong>Not when<\/strong>/g) ?? []).length === 2
    && h.includes("<strong>Not when</strong> the pages are many → RAIL") && h.includes('<strong>Rules</strong> <span class="sds-guidance-ids"><span>RULE.SUPPORT.SURFACE.206</span></span>');
  ok("[MKT.SCRIPTS.642] an item's For, Choose when, Not when (one a case) and Rules lines are one closed fold titled Guidance under its row, in a group's Plan-style list and in a plain LIST, and are no facts of the row",
    fold(gp.html) && fold(gl.html) && gp.findings.length === 0 && gl.findings.length === 0, gp.html + gl.html + JSON.stringify([gp.findings, gl.findings]));
  const open = made("~~~group Never closed\n" + fence("catalog", "A | a"));
  ok("[MKT.SCRIPTS.641] a group never closed stops the write, and so does one holding neither tabs nor a catalog",
    open.findings.some((f) => f.stops && f.message.includes("never closed")) && made(tilde("group Empty", "Just words.")).findings.some((f) => f.stops && f.message.includes("neither")));
}

console.log("\n=== the page renderer — tabs");
{
  const body = "--- MARKETING\nSome *prose* here.\n\n```json\n{ \"a\": 1 }\n```\n--- RESOURCES\n- one\n- two";
  const tabs = made(tilde("tabs", body));
  ok("[MKT.SCRIPTS.615] a tilde fence tagged tabs draws a LINE tabset: a tablist, the first tab selected, and a panel for each tab",
    tabs.html.includes('<div class="sds-tabset" data-type="LINE">') && tabs.html.includes('role="tablist"') && tabs.html.includes('id="t-1-1" aria-controls="p-1-1" aria-selected="true">MARKETING</button>')
      && tabs.html.includes('id="t-1-2" aria-controls="p-1-2" aria-selected="false">RESOURCES</button>') && tabs.html.includes('<div class="sds-tabset-panel" role="tabpanel" id="p-1-2" aria-labelledby="t-1-2">') && tabs.findings.length === 0, tabs.html);
  ok("[MKT.SCRIPTS.615] a panel's body is drawn by the same body renderer: prose, code and lists, and every panel is in the markup",
    tabs.html.includes("<em>prose</em>") && tabs.html.includes('<pre data-lang="json">{ "a": 1 }</pre>') && tabs.html.includes("<li>one</li>") && !tabs.html.includes("hidden"));
  ok("[MKT.SCRIPTS.615] look=SWITCH and look=PILL set the type, and each page numbers its sets",
    made(tilde("tabs look=SWITCH", "--- A\nx\n--- B\ny")).html.includes('data-type="SWITCH"') && made(tilde("tabs look=PILL", "--- A\nx\n--- B\ny")).html.includes('data-type="PILL"')
      && made(tilde("tabs", "--- A\nx\n--- B\ny") + "\n" + tilde("tabs", "--- C\nx\n--- D\ny")).html.includes('id="t-2-1"'));
  ok("[MKT.SCRIPTS.615] six tabs stand, a seventh stops the write with a finding",
    made(tilde("tabs", ["A", "B", "C", "D", "E", "F"].map((l) => `--- ${l}\nx`).join("\n"))).findings.length === 0
      && made(tilde("tabs", ["A", "B", "C", "D", "E", "F", "G"].map((l) => `--- ${l}\nx`).join("\n"))).findings.some((f) => f.stops && f.message.includes("two to six")));
  ok("[MKT.SCRIPTS.615] a single tab stops the write", made(tilde("tabs", "--- A\nx")).findings.some((f) => f.stops && f.message.includes("two to six")));
  ok("[MKT.SCRIPTS.615] tabs inside tabs are refused", made(tilde("tabs", "--- A\nx\n~~~tabs\n--- B\ny\n--- C\nz")).findings.some((f) => f.stops && f.message.includes("tabs inside tabs")));
  ok("[MKT.SCRIPTS.615] a look that is none of the three stops the write", made(tilde("tabs look=BOX", "--- A\nx\n--- B\ny")).findings.some((f) => f.stops && f.message.includes("BOX")));
  ok("[MKT.SCRIPTS.615] words before the first label, and a fence never closed, stop the write",
    made(tilde("tabs", "stray\n--- A\nx\n--- B\ny")).findings.some((f) => f.stops && f.message.includes("before the first"))
      && made("~~~tabs\n--- A\nx\n--- B\ny\n").findings.some((f) => f.stops && f.message.includes("never closed")));
  ok("[MKT.SCRIPTS.615] a --- line inside a code fence of a panel is code, not a label", made(tilde("tabs", "--- A\n```text\n--- not a tab\n```\n--- B\ny")).findings.length === 0);
}

{
  const rows = Array.from({ length: 26 }, (_, k) => `| \`R${k}\` | what rule ${k} decides | MUST |`).join("\n");
  const longTable = `| Rule | What it decides | Weight |\n| --- | --- | --- |\n${rows}`;
  const folded = produced(`~~~fold The 26 rules\n${longTable}\n~~~\n\nAfter it.\n`);
  ok("[MKT.SCRIPTS.650] a `~~~fold <summary>` fence draws its table inside a shut details whose summary is the fence's words",
    folded.includes('<details class="sds-fold sds-fold-block">\n    <summary>The 26 rules</summary>') && folded.includes("<table") && !folded.includes("<details open") && folded.indexOf("<summary>") < folded.indexOf("<table"), folded.slice(-600));
  ok("[MKT.SCRIPTS.650] the prose after the fence is a paragraph of the page, not of the fold", /<\/details>\s*<p>After it\.<\/p>/.test(folded), folded.slice(-300));
  ok("[MKT.SCRIPTS.650] a fold with no summary, or never closed, stops the write",
    made("~~~fold\nx\n~~~\n").findings.some((f) => f.stops && f.message.includes("summary")) && made("~~~fold Long\nx\n").findings.some((f) => f.stops && f.message.includes("never closed")));
  ok("[MKT.SCRIPTS.650] a fold stands inside a tab, and the tab's fence still closes on its own line",
    made(tilde("tabs", `--- A\n~~~fold More\ntext\n~~~\n--- B\ny`)).findings.length === 0 && made(tilde("tabs", `--- A\n~~~fold More\ntext\n~~~\n--- B\ny`)).html.includes("<summary>More</summary>"));
}
console.log("\n=== the page renderer — a LIST's fact keys, facts=END with no fact, and bare tags");
{
  const four = made(fence("catalog layout=LIST", "Item | line\n  A: 1\n  B: 2\n  C: 3\n  D: 4"));
  ok("[MKT.SCRIPTS.652] a LIST with four or more fact keys stops the write and names the keys", four.findings.some((f) => f.stops && f.message.includes("up to three fact keys") && f.message.includes("A, B, C, D")), JSON.stringify(four.findings));
  ok("[MKT.SCRIPTS.652] three keys draw as before", !made(fence("catalog layout=LIST", "Item | line\n  A: 1\n  B: 2\n  C: 3")).findings.some((f) => f.stops));
  const badged = `~~~group Containers | what a page is made of\n${fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "Hero | the opening\n  Code: [HERO]\n  Unit: DSSectionContainer\n  Size: XL\n  Color: BRAND")}\n~~~`;
  ok("[MKT.SCRIPTS.658] in a group panel a fact of bracketed codes is the row's badge, so three facts and a badge draw", !made(badged).findings.some((f) => f.stops), JSON.stringify(made(badged).findings));
  ok("[MKT.SCRIPTS.658] known-bad: the same four keys outside a group still stop the write",
    made(fence("catalog layout=LIST facts=AFTER_DESCRIPTION", "Hero | the opening\n  Code: [HERO]\n  Unit: DSSectionContainer\n  Size: XL\n  Color: BRAND")).findings.some((f) => f.stops && f.message.includes("Code, Unit, Size, Color")));
  const tags = made(fence("catalog layout=LIST", "Kinds | which rules are shared?\n  [UNIT] [COMPONENT]\nLevels | what does each level own?\n  [WIDGET]\nPages | what a page holds\n  [PAGE]"));
  ok("[MKT.SCRIPTS.653] bare tags never get the advice to write facts=END, which does not draw a keyless fact", !tags.findings.some((f) => f.message.includes("facts=END")), JSON.stringify(tags.findings));
  ok("[MKT.SCRIPTS.653] a list of short keyed facts still gets it", made(fence("catalog layout=LIST", "Kinds | q\n  Owes: one\nLevels | q\n  Owes: two")).findings.some((f) => f.message.includes("facts=END")));
  const none = made(fence("catalog layout=LIST facts=END", "Kinds | which rules are shared?\nLevels | what does each level own?"));
  ok("[MKT.SCRIPTS.654] facts=END with no fact on any item raises a finding", none.findings.some((f) => f.message.includes("no item of this list holds one")), JSON.stringify(none.findings));
  ok("[MKT.SCRIPTS.655] a line of bare tags is a fact whose definition term is hidden, so the definition list is whole", tags.html.includes('<div class="sds-tile-fact-bare"><dt hidden>Tags</dt><dd>'), tags.html.slice(-500));
  ok("[MKT.SCRIPTS.655] and the stylesheet carries no display rule for the bare tags' row",
    !/\.sds-tile-facts > \.sds-tile-fact-bare\s*\{\s*display/.test(readFileSync(resolve(HERE, "src", "styles", "docs-language.src.css"), "utf8")));
}

console.log("\n=== the page renderer — the catalog check leaves Terms, glossary and Binds tables as tables");
{
  const many = (head, first) => table(head, ...Array.from({ length: 8 }, (_, k) => [`${first}${k}`, `what ${first}${k} means in this domain`, ...head.slice(2).map(() => "x")]));
  const reads = (md) => made(md).findings.some((f) => f.message.includes("reads as a catalog"));
  ok("[MKT.SCRIPTS.656] a glossary of eight terms with a Term and a Description column is not read as a catalog", !reads(many(["Term", "Description"], "T")));
  ok("[MKT.SCRIPTS.656] a Terms table with a What it means column, and a Binds table with a What it decides column, are not read as one either", !reads(many(["Term", "What it means"], "T")) && !reads(many(["Rule", "What it decides"], "R")));
  ok("[MKT.SCRIPTS.656] a table of names and descriptions that is neither still is", reads(many(["Name", "Description"], "N")) && reads(many(["Command", "What it does"], "C")));
}

console.log("\n=== the page renderer — a file frame that folds");
{
  const plain = made("```json file=docs/specs/x.json\n{}\n```");
  const folded = made("```json file=docs/specs/x.json fold\n{}\n```");
  ok("[MKT.SCRIPTS.616] a file frame without fold is as it was, with no details",
    plain.html.includes('<figure class="sds-file">') && !plain.html.includes("<details"));
  ok("[MKT.SCRIPTS.616] the word fold draws the same frame inside a details whose summary is the path",
    folded.html.includes('<details class="sds-fold">\n    <summary>docs/specs/x.json</summary>\n  <figure class="sds-file">') && folded.html.includes('<span class="sds-file-lang">json</span>') && folded.html.includes('data-lang="json"') && folded.findings.length === 0, folded.html);
  ok("[MKT.SCRIPTS.616] fold with no file= is a finding, and the code is drawn plain", made("```json fold\n{}\n```").findings.some((f) => f.message.includes("`file=<path>`")));
}

console.log("\n=== the page renderer — a folded fence with no body reads its file");
{
  const root = mkdtempSync(join(tmpdir(), "spn-fold-"));
  mkdirSync(join(root, "docs", "specs"), { recursive: true });
  writeFileSync(join(root, "docs", "specs", "x.json"), '{ "a": 1 }\n');
  const withRoot = (markdown, rootDir = root) => renderPage({
    block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
    markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${markdown}\n`, workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md",
    furniture: { stylesheet: "", script: "", footer: "" }, root: rootDir,
  });
  const read = withRoot("```json file=docs/specs/x.json fold\n```");
  ok("[MKT.SCRIPTS.616] a folded fence with no body shows the file's content, relative to the folder holding docs/",
    read.findings.length === 0 && read.html.includes('<summary>docs/specs/x.json</summary>') && read.html.includes('<pre data-lang="json">{ "a": 1 }</pre>'), read.html.slice(-700));
  ok("[MKT.SCRIPTS.616] a folded fence with a body still shows the body, and the file is not read",
    withRoot("```json file=docs/specs/x.json fold\n{ \"b\": 2 }\n```").html.includes('{ "b": 2 }') && !withRoot("```json file=docs/specs/x.json fold\n{ \"b\": 2 }\n```").html.includes('"a": 1'));
  const missing = withRoot("```json file=docs/specs/none.json fold\n```");
  ok("[MKT.SCRIPTS.616] a path that does not exist stops the write with a finding naming it",
    missing.findings.length === 1 && missing.findings[0].stops === true && missing.findings[0].message.includes("docs/specs/none.json") && !missing.html.includes("sds-fold"), JSON.stringify(missing.findings));
  ok("[MKT.SCRIPTS.616] with no root known, an empty folded fence stops the write; an empty fence that does not fold is not read",
    made("```json file=docs/specs/x.json fold\n```").findings.some((f) => f.stops) && made("```json file=docs/specs/x.json\n```").findings.length === 0);
  rmSync(root, { recursive: true, force: true });
}

console.log("\n=== the page renderer — code forms: an excerpt of a file, a marked line, a long block");
{
  const root = mkdtempSync(join(tmpdir(), "spn-code-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "a.ts"), Array.from({ length: 30 }, (_, k) => k % 7 === 0 ? `export const v${k} = ${k}; // n` : `const s${k} = "x";`).join("\n") + "\n");
  const rooted = (markdown) => renderPage({
    block: { id: "probe", title: "Probe", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is." },
    markdown: `# Probe\n\nThe lead.\n\n## What it is\n\n${markdown}\n`, workspace: "/workspace", location: "/workspace/docs/02-constructs/probe.md",
    furniture: { stylesheet: "", script: "", footer: "" }, root,
  });
  const excerpt = rooted("```ts file=src/a.ts lines=2-4 mark=3\n```");
  ok("[MKT.SCRIPTS.643] file= with lines= draws that excerpt, titled with its path and lines, each line its own element numbered from the file",
    excerpt.findings.length === 0 && excerpt.html.includes('<span class="sds-file-path">src/a.ts<span class="sds-file-lines">:2-4</span></span>')
      && excerpt.html.includes('data-n="2"') && excerpt.html.includes('data-n="4"') && !excerpt.html.includes('data-n="5"') && !excerpt.html.includes('data-n="1"'), excerpt.html.slice(-900));
  ok("[MKT.SCRIPTS.643] mark= shades the lines named, by file line number, and no other",
    excerpt.html.includes('<span class="sds-ln sds-mark" data-n="3">') && !excerpt.html.includes('sds-mark" data-n="2"') && !excerpt.html.includes('sds-mark" data-n="4"'));
  ok("[MKT.SCRIPTS.643] the excerpt's syntax colours are written into the page, in the docs palette's token classes, and the page's own script leaves it alone",
    excerpt.html.includes('<span class="sds-tk-k">const</span>') && excerpt.html.includes('<span class="sds-tk-s">"x"</span>'));
  const whole = rooted("```ts file=src/a.ts lines=1-1\n```");
  ok("[MKT.SCRIPTS.643] a comment and a number are coloured, and the code's own characters are escaped",
    whole.html.includes('<span class="sds-tk-c">// n</span>') && whole.html.includes('<span class="sds-tk-n">0</span>'));
  const long = rooted("```ts file=src/a.ts lines=1-25\n```");
  ok("[MKT.SCRIPTS.644] an excerpt past 20 lines folds: the first ten stand in the frame and the rest sit behind a fold that counts them",
    long.html.includes('<details class="sds-more"><summary>Show 15 more lines</summary>') && long.html.indexOf('data-n="10"') < long.html.indexOf("<details class=\"sds-more\"") && long.html.indexOf('data-n="11"') > long.html.indexOf("<details class=\"sds-more\""), long.html.slice(-500));
  ok("[MKT.SCRIPTS.644] twenty lines stay open, and a pasted fence past twenty lines folds the same way",
    !rooted("```ts file=src/a.ts lines=1-20\n```").html.includes("sds-more") && rooted(fence("ts", Array.from({ length: 22 }, (_, k) => `const a${k} = 1;`).join("\n"))).html.includes("Show 12 more lines"));
  ok("[MKT.SCRIPTS.643] a pasted fence with no file=, lines= or mark= still draws as plain code",
    rooted("```ts\nconst a = 1;\n```").html.includes('<pre data-lang="ts">const a = 1;</pre>'));
  const bad = [rooted("```ts file=src/a.ts lines=1-99\n```"), rooted("```ts file=src/none.ts lines=1-2\n```"), rooted("```ts lines=1-2\n```"), rooted("```ts file=src/a.ts lines=1-2\nconst x = 1;\n```"), rooted("```ts file=src/a.ts lines=2-4 mark=9\n```"), rooted("```ts file=src/a.ts lines=4-2\n```")];
  ok("[MKT.SCRIPTS.645] a range past the file, a missing file, lines= with no file=, a body beside lines=, a mark outside the excerpt and a backward range each stop the write",
    bad.every((one) => one.findings.some((f) => f.stops === true)), JSON.stringify(bad.map((one) => one.findings.map((f) => f.message))));
  ok("[MKT.SCRIPTS.645] with no root known, an excerpt stops the write", made("```ts file=src/a.ts lines=1-2\n```").findings.some((f) => f.stops));
  const asTabs = rooted(tilde("tabs", "--- Contract\n```ts file=src/a.ts lines=1-1\n```\n--- Today\n```ts file=src/a.ts lines=2-2\n```"));
  ok("[MKT.SCRIPTS.646] two forms of one thing are tabs: each panel holds its own excerpt frame", asTabs.findings.length === 0 && (asTabs.html.match(/class="sds-file sds-code/g) ?? []).length === 2 && asTabs.html.includes('class="sds-tabset"'));
  rmSync(root, { recursive: true, force: true });
}

{
  const page = pageFromRender(JSON.stringify({ pages: [{ html: '<body><svg width="1em"></svg></body>', findings: [] }] }));
  let refused = "";
  try { pageFromRender(JSON.stringify({ pages: [{ html: "<body></body>", findings: [{ message: "DSTabs has no prop `x`" }] }] })); } catch (e) { refused = e.message; }
  ok("[MKT.SCRIPTS.613] the render's printed JSON gives its first page's html, decoded, and a finding stops with the render's words; text that is no JSON is the page",
    page === '<body><svg width="1em"></svg></body>' && refused.includes("DSTabs has no prop `x`") && pageFromRender("<body>x</body>") === "<body>x</body>", page + " | " + refused);
}

console.log("\n=== the page renderer — the page's name and its title are two things, and the way back is a breadcrumb");
{
  const block = (extra = {}) => ({ id: "probe", title: "Probe Overview Of Everything", status: "DONE", lenses: ["ARCHITECT"], summary: "What a probe is.", ...extra });
  const write = (b, home) => renderPage({ block: b, markdown: `# Probe\n\nThe lead.\n\n## What it is\n\nText.\n`, workspace: "/workspace",
    location: "/workspace/docs/02-constructs/probe.md", furniture: { stylesheet: "", script: "", footer: "" }, ...(home ? { home } : {}) });
  const named = write(block({ name: "Probe", title: "A Probe Says What It Is" }), { href: "../up.html", label: "Up" });
  const heading = (html, tag) => (new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`).exec(html) ?? [])[1];
  ok("[MKT.SCRIPTS.614] a block's `name` is the tab, the outline's title and the eyebrow's last segment, and its `title` is the heading alone",
    heading(named.html, "title") === "Probe" && heading(named.html, "h1") === "A Probe Says What It Is" && /class="sds-rail-title">Probe</.test(named.html) && /&middot; Probe<\/span>/.test(named.html), named.html.slice(0, 900));
  const plain = write(block({ title: "Probe" }));
  ok("[MKT.SCRIPTS.614] a block with no `name` has its `title` for all of them, so no seat needs a change",
    heading(plain.html, "title") === "Probe" && heading(plain.html, "h1") === "Probe" && /class="sds-rail-title">Probe</.test(plain.html) && plain.findings.length === 0, JSON.stringify(plain.findings));
  const long = write(block({ name: "Name Of Four Words" }));
  ok("[MKT.SCRIPTS.614] a `name` of more than three words stops the write, citing the short-name rule (RULE.DEVEX.WORKSPACE.517)",
    long.findings.some((f) => f.stops === true && f.message.includes("RULE.DEVEX.WORKSPACE.517") && f.message.includes("4 words")), JSON.stringify(long.findings));
  ok("[MKT.SCRIPTS.614] a `name` of three words, and one with a dash and a number, are within the rule",
    write(block({ name: "Three Word Name" })).findings.length === 0 && write(block({ name: "Infra · Shape 2" })).findings.length === 0);
  ok("[MKT.SCRIPTS.614] the way back is the masthead's first line, the breadcrumb: the location links the page above, the name is plain, and there is no line above the masthead and no back link in the rail",
    /<div class="sds-wrap">\n<header class="sds-masthead">\n[^\n]*\n  <div class="sds-eyebrow"><span class="sds-line1">\/workspace &middot; <a href="\.\.\/up\.html">[^<]*<\/a> &middot; Probe<\/span>/.test(named.html)
      && !/sds-crumb/.test(named.html) && !/sds-home/.test(named.html), named.html.slice(0, 1400));
  ok("[MKT.SCRIPTS.614] where no page is named above it the constructs face stands as the location's link", /<span class="sds-line1">[^<]*&middot; <a href="[^"]*README\.md">[^<]*<\/a> &middot; Probe/.test(plain.html) && !/sds-crumb/.test(plain.html));
  const hubbed = renderPage({ block: block({ title: "Probe" }), markdown: "# Probe\n\nThe lead.\n\n## What it is\n\nText.\n", workspace: "SaaS Plane", location: "spn-probe",
    furniture: { stylesheet: "", script: "", footer: "" }, home: { href: "../up.html", label: "Up" }, hub: "../../hub.html" });
  ok("[MKT.SCRIPTS.614] where the repository has a hub the organization links it, and the location links the page above",
    hubbed.html.includes('<span class="sds-line1"><a href="../../hub.html">SaaS Plane</a> &middot; <a href="../up.html">spn-probe</a> &middot; Probe</span>'), hubbed.html.slice(0, 900));
}

{
  // A fact whose value is JSON opens in a popover (rule 580).
  const catalog = (value) => produced("```catalog layout=LIST\nRoom | the room\n  Value: " + value + "\n```\n");
  const obj = catalog('`{"roomAndLayouts": {"kind": "SPLIT", "sizes": [1, 2]}, "tone": "WARM", "tags": ["A", "B"]}`');
  ok("[MKT.SCRIPTS.660] a JSON object fact draws a chip with a tree icon and its first keys in words (no count), bound to a dialog",
    /<button type="button" class="sds-json-chip" data-json-open="(sds-json-\d+)" aria-haspopup="dialog" aria-expanded="false"[^>]*><svg class="sds-json-mark"[^>]*aria-hidden="true"[\s\S]*?<\/svg><span class="sds-json-label">Room and layouts, Tone<\/span><\/button><dialog id="\1" class="sds-json-dialog"/.test(obj), obj.slice(-1200));
  const head = obj.slice(obj.indexOf('<div class="sds-json-head">'), obj.indexOf('<div class="sds-json-body">'));
  ok("[MKT.SCRIPTS.660] the dialog's head is one slim line: the fact's name and the close button, no count and no Copy button",
    head.includes('<div class="sds-json-title" id=') && head.includes('>Value</div></div><button type="button" class="sds-json-close" aria-label="Close"') && !/\d+ (keys?|items?)/.test(head) && !head.includes("sds-json-copy") && !head.includes("sds-json-count") && !obj.includes("sds-json-count"), head);
  ok("[MKT.SCRIPTS.660] Copy JSON is a copy icon button at the JSON panel's top right, labelled and with a tooltip, holding the JSON, with a check icon and a polite live region",
    /<div class="sds-json-caprow"><div class="sds-json-cap">JSON<\/div><button type="button" class="sds-json-copy" aria-label="Copy JSON" data-tip="Copy JSON" data-json="\{\n  &quot;roomAndLayouts&quot;[^>]*><svg class="sds-json-ico-copy"[\s\S]*?<svg class="sds-json-ico-check"/.test(obj)
      && obj.includes('<span class="sds-json-live" role="status" aria-live="polite"></span>') && /<div class="sds-json-scroll" role="region" tabindex="0" aria-label="JSON">/.test(obj));
  ok("[MKT.SCRIPTS.660] the words panel lists each key in words, an enum code in code, a list as tags, a nested object indented",
    obj.includes('<section class="sds-json-words"') && obj.includes("<dt>Room and layouts</dt><dd><dl class=\"sds-json-nest\">") && obj.includes("<dt>Kind</dt><dd><code>SPLIT</code></dd>") && obj.includes('<ul class="sds-json-tags"><li><code>A</code></li><li><code>B</code></li></ul>'), obj.slice(-2400));
  ok("[MKT.SCRIPTS.660] the JSON panel holds the indented JSON with its keys, strings and numbers marked, and the fact no longer draws one line of code",
    obj.includes('<span class="sds-jk">"roomAndLayouts"</span>:') && obj.includes('<span class="sds-js">"SPLIT"</span>') && obj.includes('<span class="sds-jn">1</span>') && !/<dd><code>\{/.test(obj));
  const arr = catalog('`["ONE", "TWO", "THREE"]`');
  ok("[MKT.SCRIPTS.660] a JSON list draws a chip with its first items in words, and no count", arr.includes('<span class="sds-json-label">One, Two</span>') && arr.includes('aria-label="One, Two, JSON value, opens a dialog"') && !/\d+ items/.test(arr) && arr.includes("<li><code>ONE</code></li>"), arr.slice(-900));
  ok("[MKT.SCRIPTS.660] a value that is not JSON draws as before, and no dialog stands for it",
    !catalog("`PLAIN`").includes("<dialog") && catalog("`PLAIN`").includes("<code>PLAIN</code>") && !catalog("`{not json}`").includes("<dialog") && catalog("a sentence").includes("a sentence"));
  ok("[MKT.SCRIPTS.660] a short value takes the design system's XL extent, and each panel is focusable and labelled",
    obj.includes('class="sds-json-dialog" data-extent="XL"') && obj.includes('role="region" tabindex="0" aria-label="In words"') && obj.includes('role="region" tabindex="0" aria-label="JSON"'));
  const long = catalog('`{"alpha": ' + JSON.stringify(Array.from({ length: 30 }, (_, i) => "ITEM_" + i)) + '}`');
  ok("[MKT.SCRIPTS.660] a value of more than 24 formatted lines takes the FIT extent", long.includes('class="sds-json-dialog" data-extent="FIT"'));
  const wide = catalog('`{"note": "' + "w".repeat(60) + '"}`');
  ok("[MKT.SCRIPTS.660] a value with a line over 56 characters takes FIT",
    wide.includes('data-extent="FIT"') && !wide.includes('data-extent="XL"'));
  const css = (await import("node:fs")).readFileSync(resolve(HERE, "src", "styles", "docs-language.src.css"), "utf8");
  ok("[MKT.SCRIPTS.660] the stylesheet gives the dialog the XL width capped at 95vw, FIT capped at 85vw, 80vh at most, panels that scroll alone, and panels stacking under 48rem",
    /\.sds-json-chip\s*\{/.test(css) && /\.sds-json-dialog\s*\{[^}]*width:\s*min\(720px, 95vw\)[^}]*max-height:\s*80vh/.test(css) && /data-extent="FIT"\][^}]*max-width:\s*85vw/.test(css)
    && /\.sds-json-body > section:not\(\.sds-json-code\), \.sds-json-scroll\s*\{[^}]*overflow:\s*auto/.test(css) && /max-width:\s*47\.99rem/.test(css));
  ok("[MKT.SCRIPTS.660] the stylesheet gives the head the SM step, a 32px close button with a 40px hit area, and pins Copy beside the JSON caption",
    /\.sds-json-head\s*\{[^}]*padding:\s*1rem \.75rem 1rem 1\.25rem/.test(css) && /\.sds-json-close\s*\{[^}]*width:\s*2rem/.test(css) && /\.sds-json-close::after\s*\{[^}]*inset:\s*-4px/.test(css) && /\.sds-json-caprow\s*\{/.test(css) && !css.includes(".sds-json-count"));
  const js = (await import("node:fs")).readFileSync(resolve(HERE, "src", "styles", "docs-page.js"), "utf8");
  ok("[MKT.SCRIPTS.660] the page script opens with showModal, closes on the button and outside, returns focus to the chip and copies the JSON",
    js.includes("showModal") && js.includes(".sds-json-close") && js.includes("chip.focus()") && js.includes("navigator.clipboard.writeText"));
}

{
  // A catalog item's `Anchor:` line is the id of its row or tile (S87: the entry a sample's note links to), and is no fact.
  const tiles = produced("```catalog layout=LIST\nClosing call | What do I do now?\n  Code: [CLOSING_CALL]\n  Anchor: marketing-closing-call\n```\n");
  ok("[MKT.SCRIPTS.661] an `Anchor:` line is the id of the item's tile, and no fact is drawn for it", tiles.includes('<div class="sds-tile" id="marketing-closing-call">') && !tiles.includes(">Anchor<"), tiles.slice(-600));
  const row = produced("~~~group G | a group\n```catalog layout=LIST\nClosing call | What do I do now?\n  Code: [CLOSING_CALL]\n  Anchor: marketing-closing-call\n```\n~~~\n");
  ok("[MKT.SCRIPTS.661] and in a group panel it is the id of the row", row.includes('<tr id="marketing-closing-call">') && !row.includes(">Anchor<"), row.slice(-700));
  ok("[MKT.SCRIPTS.661] an item with no `Anchor:` gets no id", !produced("```catalog layout=LIST\nHero | what\n  Code: [HERO]\n```\n").includes('class="sds-tile" id='));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-render` : `\n  all ${total} passed — t-render`);
process.exit(failed ? 1 : 0);
