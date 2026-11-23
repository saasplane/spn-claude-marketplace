// The page renderer and a code block (`05-artifacts.md` § One stylesheet, served in versions): a produced page
// holds plain code in a `pre` tagged with its language, and no colour. The shared script colours the block when
// the page opens, so the renderer writes the same block a person writes by hand.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { renderPage, setUnitRender, setBuiltUnits, designSystemVersion, pageFromRender, pagesFromRender, DEFAULT_RENDER_APP } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "render.ts")).href);

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
const { cutVersions, integrityTable, newestVersion, linesFor } = await import(pathToFileURL(resolve(HERE, "..", "plugin-support-lib", "src", "lib", "page-styles.ts")).href);
const { readFileSync } = await import("node:fs");
const STYLES_HOME = resolve(HERE, "src", "styles");
ok("the newest version of the shared styles is 1.16.0, which serves ds-unit.css and design-system.css, so every page writer links it",
  newestVersion(Object.keys(cutVersions(STYLES_HOME))) === "1.16.0");
ok("and 1.10.0 serves the Terms shares: a fixed layout, and the stacked rows under 40rem",
  /table\.sds-terms\{table-layout:fixed\}|table\.sds-terms\s*\{[^}]*table-layout:\s*fixed/.test(readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8"))
  && readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8").includes("max-width:40rem"));
for (const name of ["construct", "overview", "blocks"]) {
  const template = readFileSync(resolve(HERE, "src", "refs", "devex", "workspace", "docs", "templates", "pages", `${name}-template.html`), "utf8");
  ok(`the ${name} template links 1.16.0, the version every page writer links, with its hash`,
    template.includes(linesFor("1.16.0", undefined, integrityTable(STYLES_HOME)["1.16.0"]).stylesheet) && !template.includes("/1.15.0/"));
}
const binds = rowsOf(produced(table(["Rule", "What it decides", "Weight"], ["`RD.X.1`", "what every provider delivers", "MUST"])), "<thead>");
ok("Binds keeps the Weight a reader compares down, and folds what a rule decides into the rule's cell",
  binds.includes("<thead><tr><th>Rule</th><th>Weight</th></tr></thead>") && binds.includes("<tr><td><p><code>RD.X.1</code></p><p>what every provider delivers</p></td><td>MUST</td></tr>"), binds);
const pieces = rowsOf(produced(table(["Piece", "The question it answers", "Its terms"], ["**A provider**", "What must it build?", "Provider"], ["**Figma**", "Why elsewhere?", "—"])), "<thead>");
ok("a Model's pieces are one column: the piece, its question, and its terms as a fact",
  pieces.includes("<tr><td><p><strong>A provider</strong></p><p>What must it build?</p><span class=\"sds-small\">Terms: Provider</span></td></tr>") &&
  pieces.includes("<tr><td><p><strong>Figma</strong></p><p>Why elsewhere?</p></td></tr>"), pieces);
const edges = rowsOf(produced(table(["Owns", "Refuses", "Who owns that instead"], ["the build", "what a kind is", "[Targets](targets.md)"])), "<thead>");
ok("a Boundary keeps Owns beside Refuses, and who owns the refused part is a fact",
  edges.includes("<thead><tr><th>Owns</th><th>Refuses</th></tr></thead>") &&
  edges.includes("<tr><td>the build</td><td>what a kind is<span class=\"sds-small\">Owned by: <a href=\"targets.md\">Targets</a></span></td></tr>"), edges);
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
  ok("[RULE.DEVEX.WORKSPACE.532] a cards fence is a tile a door, its title and its Read more both links",
    cards.includes('<h4><a href="path.md">Reading path</a></h4><p>what it covers</p><a class="sds-more" href="path.md">Read more &rarr;</a>') && cards.includes('href="other.md">Read more'), cards);
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
  const linked = pageOf(fence("unit", JSON.stringify(tree)), '<link rel="stylesheet" href="https://x/1.16.0/sds-docs.css" integrity="sha384-b" crossorigin="anonymous">');
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
  const pinned = readFileSync(resolve(HERE, "src", "styles", "ds-unit.css"), "utf8").split("\n")[0].match(/support-web-ds-ts v(\d+\.\d+\.\d+)/)?.[1];
  ok("[MKT.SCRIPTS.613] a unit fence is wrapped as a render file holding the tree alone, `treeVersion` and its one section, and the render is given the `surface` app with the version its unit stylesheet was cut from",
    seen.length === 1 && JSON.stringify(seen[0]) === JSON.stringify({ treeVersion: 1, sections: [tree] }) && designSystemVersion(undefined, "ds-unit.css") === pinned && DEFAULT_RENDER_APP === "surface", JSON.stringify(seen));
  ok("[MKT.SCRIPTS.613] the unit's markup stands in the page itself, once in light and once in dark, side by side, with the tree below as code, and no frame",
    made.findings.length === 0 && made.html.includes('<span class="sds-file-path">DSFeature</span><span class="sds-file-lang">unit</span>')
      && made.html.includes('<div class="sds-unit" data-mode="light"><p class="x">drawn & ready</p></div>') && made.html.includes('<div class="sds-unit" data-mode="dark"><p class="x">drawn & ready</p></div>')
      && made.html.includes('<div class="sds-unit-pair">') && !made.html.includes("<iframe") && !made.html.includes("srcdoc") && made.html.includes('<pre data-lang="json">'), made.html.slice(-1800));
  ok("[MKT.SCRIPTS.613] a page with a unit fence links ds-unit.css after the shared stylesheet, from the same folder, and a page with none does not",
    linked.html.indexOf("sds-docs.css") > 0 && linked.html.indexOf("ds-unit.css") > linked.html.indexOf("sds-docs.css") && linked.html.includes('href="https://x/1.16.0/ds-unit.css"') && !/ds-unit\.css"[^>]*integrity/.test(linked.html)
      && !produced(fence("json", "{}")).includes("ds-unit.css"), linked.html.slice(0, 600));
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
  const layout = pageOf(fence("unit", JSON.stringify(layoutTree)), '<link rel="stylesheet" href="https://x/1.16.0/sds-docs.css">');
  const manySections = pageOf(fence("unit", JSON.stringify({ sections: [{ unit: "DSFeature", props: {} }, { unit: "DSFeature", props: {} }] })));
  const forcedOff = pageOf(fence("unit", JSON.stringify({ ...layoutTree, frame: false })));
  const forcedOn = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, frame: true, caption: "Framed" })));
  const badFrame = pageOf(fence("unit", JSON.stringify({ unit: "DSFeature", props: {}, frame: "yes" })));
  const iframes = layout.html.match(/<iframe\b[^>]*>/g) ?? [];
  ok("[MKT.SCRIPTS.627] a unit fence whose first unit is DSLayout is drawn in two frames, light and dark, side by side, 640px high and full width",
    layout.findings.length === 0 && iframes.length === 2 && iframes[0].includes('data-mode="light"') && iframes[1].includes('data-mode="dark"')
      && iframes.every((tag) => tag.includes('height="640"') && tag.includes('width="100%"')) && layout.html.includes('<div class="sds-unit-pair">') && !layout.html.includes('class="sds-unit"'), layout.html.slice(-1500));
  const srcdocs = [...layout.html.matchAll(/srcdoc="([^"]*)"/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  ok("[MKT.SCRIPTS.627] a frame's srcdoc is the render's whole printed page, with its mode on the html element, its quotes and ampersands escaped in the attribute",
    srcdocs.length === 2 && srcdocs[0].startsWith("<!doctype html><html lang=\"en\" data-mode=\"light\">") && srcdocs[1].includes('data-mode="dark"') && srcdocs[0].includes("<style>a{}</style>")
      && srcdocs[0].includes('a "whole" page & more') && layout.html.includes("a &quot;whole&quot; page &amp; more"), layout.html.slice(-1500));
  ok("[MKT.SCRIPTS.627] a unit drawn in a frame needs no ds-unit.css, so the page links none, and the tree is still shown below",
    !layout.html.includes("ds-unit.css") && layout.html.includes('<pre data-lang="json">'));
  ok("[MKT.SCRIPTS.627] a tree with more than one section is drawn in a frame too",
    (manySections.html.match(/<iframe\b/g) ?? []).length === 2 && !manySections.html.includes("ds-unit.css"), manySections.html.slice(-800));
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
    calls.length === 2 && calls[0].options.app === "docs" && calls[0].options.inline === false && JSON.stringify(calls[0].file) === JSON.stringify({ treeVersion: 1, sections: [{ unit: "DSFeature", props: {} }] })
      && small.html.includes('data-mode="light"><p class="l">light</p>') && small.html.includes('data-mode="dark"><p class="d">dark</p>') && !small.html.includes('"app"'), small.html.slice(-700));
  ok("[MKT.SCRIPTS.632] the `surface` app is drawn with --ds, the version ds-unit.css was cut from, and a fence naming another app sends no --ds",
    calls[1].options.ds === designSystemVersion(undefined, "ds-unit.css") && /^\d+\.\d+\.\d+$/.test(calls[1].options.ds) && calls[0].options.app === "docs" && !("ds" in calls[0].options));
  ok("[MKT.SCRIPTS.632] a framed unit is drawn with --inline, the default app where the fence names none, and each frame holds its mode's page",
    calls[1].options.inline === true && calls[1].options.app === DEFAULT_RENDER_APP && /srcdoc="[^"]*light/.test(whole.html) && /srcdoc="[^"]*dark/.test(whole.html), whole.html.slice(-700));
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
  setBuiltUnits(["DSFeature", "DSLayout"]);
  const built = made(skeleton({}));
  ok("[MKT.SCRIPTS.629] a `dg` skeleton whose frame names a unit the design system builds stops the write, naming the unit and the `unit` fence",
    built.findings.some((f) => f.stops === true && f.message.includes("`DSFeature`") && f.message.includes("`unit` fence") && f.message.includes('"planned": true')), JSON.stringify(built.findings));
  ok("[MKT.SCRIPTS.629] a skeleton marked `\"planned\": true` is let through, and so is one whose unit the design system does not build",
    !made(skeleton({ planned: true })).findings.some((f) => f.stops) && made(skeleton({}, "DSCard")).findings.length === 0, JSON.stringify(made(skeleton({ planned: true })).findings));
  const deep = made(fence("dg", JSON.stringify({ kind: "skeleton", views: [{ viewport: "DESKTOP", frame: { rows: [{ items: [{ frame: { unit: "DSLayout", rows: [{ items: [{ text: "x" }] }] } }] }] } }] })));
  ok("[MKT.SCRIPTS.629] a unit named in a view, a nested frame or a section is found too", deep.findings.some((f) => f.stops === true && f.message.includes("`DSLayout`")), JSON.stringify(deep.findings));
  setBuiltUnits(null);
  ok("[MKT.SCRIPTS.629] where no list of built units can be read, no skeleton is held against it", !made(skeleton({})).findings.some((f) => f.message.includes("builds")));
  setBuiltUnits();
  const fileList = made(skeleton({}));
  ok("[MKT.SCRIPTS.629] the list of built units is read from ds-units.json in the styles folder by default, and DSFeature is built",
    fileList.findings.some((f) => f.stops === true && f.message.includes("`DSFeature`")), JSON.stringify(fileList.findings));

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

console.log("\n=== the page renderer — a catalog in three layouts, with media and facts");
{
  const legacy = made(fence("catalog", "Name | one line | `literal`\nOther | more"));
  ok("[MKT.SCRIPTS.614] today's catalog spelling draws exactly as it did: one tile each, no data attribute",
    legacy.html.includes('  <div class="sds-tiles">\n    <div class="sds-tile"><h4>Name</h4><p>one line</p><p class="sds-small"><code>literal</code></p></div>\n    <div class="sds-tile"><h4>Other</h4><p>more</p></div>\n  </div>') && legacy.findings.length === 0, legacy.html);
  const grid = made(fence("catalog", "`RAIL` | a sidebar\n  Navigation: at the side\n  Takes: DASHBOARD; RESOURCES\nCANVAS | the body alone\n  Navigation: none"));
  ok("[MKT.SCRIPTS.614] facts under an item draw a GRID card: a data-facts count, the line, and a dl of key and value",
    grid.html.includes('<div class="sds-tiles" data-layout="GRID">') && grid.html.includes('<div class="sds-tile" data-facts="2"><h4><code>RAIL</code></h4><p class="sds-tile-line">a sidebar</p>')
      && grid.html.includes('<dl class="sds-tile-facts"><div><dt>Navigation</dt><dd>at the side</dd></div><div><dt>Takes</dt><dd>DASHBOARD; RESOURCES</dd></div></dl>') && grid.html.includes('data-facts="1"') && grid.findings.length === 0, grid.html);
  const list = made(fence("catalog layout=LIST", "MARKETING | a site\n  Layouts: `TOPNAV` for the site\n  Sections: every site section"));
  ok("[MKT.SCRIPTS.614] layout=LIST draws one card a row, its words and its facts in a body",
    list.html.includes('data-layout="LIST"') && list.html.includes('<div class="sds-tile"><div class="sds-tile-body"><h4>MARKETING</h4><p>a site</p>') && list.html.includes("<dt>Layouts</dt><dd><code>TOPNAV</code> for the site</dd>") && !list.html.includes("data-facts"), list.html);
  ok("[MKT.SCRIPTS.614] a LIST card with one fact says so, for the stylesheet", made(fence("catalog layout=LIST", "A | a\n  Key: one")).html.includes("sds-tile-facts sds-tile-facts-one"));
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
  ok("[MKT.SCRIPTS.614] a media in TABLE and MEDIA_TOP in LIST are findings, not silent",
    made(fence("catalog layout=TABLE media=ICON", "A | a\n  K: v")).findings.length === 1 && made(fence("catalog layout=LIST media=MEDIA_TOP", "A | a\n  K: v")).findings.length === 1);
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

{
  const page = pageFromRender(JSON.stringify({ pages: [{ html: '<body><svg width="1em"></svg></body>', findings: [] }] }));
  let refused = "";
  try { pageFromRender(JSON.stringify({ pages: [{ html: "<body></body>", findings: [{ message: "DSTabs has no prop `x`" }] }] })); } catch (e) { refused = e.message; }
  ok("[MKT.SCRIPTS.613] the render's printed JSON gives its first page's html, decoded, and a finding stops with the render's words; text that is no JSON is the page",
    page === '<body><svg width="1em"></svg></body>' && refused.includes("DSTabs has no prop `x`") && pageFromRender("<body>x</body>") === "<body>x</body>", page + " | " + refused);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-render` : `\n  all ${total} passed — t-render`);
process.exit(failed ? 1 : 0);
