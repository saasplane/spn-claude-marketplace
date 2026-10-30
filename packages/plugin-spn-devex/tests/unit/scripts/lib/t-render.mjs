// The page renderer and a code block (`05-artifacts.md` § One stylesheet, served in versions): a produced page
// holds plain code in a `pre` tagged with its language, and no colour. The shared script colours the block when
// the page opens, so the renderer writes the same block a person writes by hand.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..", "..");
const { renderPage } = await import(pathToFileURL(resolve(HERE, "src", "scripts", "lib", "render.ts")).href);

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
ok("the newest version of the shared styles is 1.10.0, so every page writer links it",
  newestVersion(Object.keys(cutVersions(STYLES_HOME))) === "1.10.0");
ok("and 1.10.0 serves the Terms shares: a fixed layout, and the stacked rows under 40rem",
  /table\.sds-terms\{table-layout:fixed\}|table\.sds-terms\s*\{[^}]*table-layout:\s*fixed/.test(readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8"))
  && readFileSync(resolve(HERE, "..", "..", "public", "assets", "docs", "1.10.0", "sds-docs.css"), "utf8").includes("max-width:40rem"));
for (const name of ["construct", "overview", "blocks"]) {
  const template = readFileSync(resolve(HERE, "src", "refs", "devex", "workspace", "docs", "templates", "pages", `${name}-template.html`), "utf8");
  ok(`the ${name} template links 1.10.0, with its hash`,
    template.includes(linesFor("1.10.0", undefined, integrityTable(STYLES_HOME)["1.10.0"]).stylesheet) && !template.includes("/1.9.0/"));
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

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-render` : `\n  all ${total} passed — t-render`);
process.exit(failed ? 1 : 0);
