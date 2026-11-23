// `checks/where-tree.ts` — a preview's `Where it lands` is one folder tree for each repository (RULE.DEVEX.WORKSPACE.238), and each
// layer of `Proposed` carries a `data-layer` mark (RULE.DEVEX.WORKSPACE.233); a block carries no For, Layer or Reads line.
const { whereTreeFindings, whereItLandsFindings, proposedFindings, whereTreeOnDisk } = await import("../../../../src/scripts/checks/where-tree.ts");
const { mkdtempSync, rmSync, writeFileSync } = await import("node:fs");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const TREE = "<pre>spn-x/\n├── src/\n│   └── a.ts   changed: the thing\n└── tests/\n    └── t-a.mjs   new: its test</pre>";
const section = (name, body = "") => `<section><div class="sds-section-head"><h2>${name}</h2></div>${body}</section>`;
const proposed = (inner) => section("Proposed", inner);
const layer = `<h3 id="s3-plugins" data-layer="plugins">Plugins</h3><h4 id="p-a">The page check</h4><p class="sds-small">For: you · Layer: Plugins</p><p>A reason.</p>`;
const where = (inner) => section("Where it lands", inner);
const one = `<p><strong>1 &middot; spn-x</strong> &mdash; the change</p>${TREE}`;
const two = `${one}<p><strong>2 &middot; spn-y</strong> &mdash; the other change</p>`;

console.log("=== Where it lands — one folder tree for each repository (238)");
ok("[MKT.HOOKS.513] a repository named with a tree of tree characters passes", whereItLandsFindings(where(one)).length === 0);
const none = whereItLandsFindings(where("<table><tr><td>spn-x/src/a.ts</td></tr></table>"));
ok("[MKT.HOOKS.513] a section with no tree is refused as it prints", none.length === 1 &&
  none[0] === "Where it lands holds no folder tree — it is one tree for each repository, and never a table of paths (05-artifacts.md § The approach document; RULE.DEVEX.WORKSPACE.238) · draw each repository as one `<pre>` tree, a folder or file on each line with `├──` and `└──`, and its note in one column on the right", none[0]);
const short = whereItLandsFindings(where(two));
ok("[MKT.HOOKS.513] a second repository named with no tree of its own is refused, with the counts", short.length === 1 && short[0].startsWith("Where it lands names 2 repositories and draws 1 tree — one tree for each repository"), short.join("|"));
ok("the section with a tree for each repository passes", whereItLandsFindings(where(`${one}<p><strong>2 &middot; spn-y</strong> &mdash; the other</p>${TREE}`)).length === 0);
ok("a page with no Where it lands has nothing to find", whereItLandsFindings(section("Today")).length === 0);

const steps = `<p><strong>1 &middot; Build the bundle first</strong> &mdash; run it</p><p><strong>2 &middot; Then release</strong> &mdash; in order</p>`;
ok("[MKT.HOOKS.513] a numbered step paragraph is a step, never a repository", whereItLandsFindings(where(`${steps}${one}`)).length === 0, whereItLandsFindings(where(`${steps}${one}`)).join("|"));
ok("[MKT.HOOKS.527] a tree marked data-lang=tree counts as a tree", whereItLandsFindings(where(`<p><strong>1 &middot; spn-x</strong> &mdash; the change</p><pre data-lang="tree">spn-x/\n└── a.ts   new</pre>`)).length === 0);
ok("[MKT.HOOKS.527] a second repository name with no tree is still refused beside steps", whereItLandsFindings(where(`${steps}${two}`)).length === 1);

console.log("\n=== Proposed — a data-layer mark, and no For, Layer or Reads line (233)");
ok("a layer with its mark and a block passes", proposedFindings(proposed(layer)).length === 0);
ok("Shape needs no mark", proposedFindings(proposed(`<h3 id="s3-shape">Shape</h3>${layer}`)).length === 0);
const unmarked = proposedFindings(proposed(layer.replace(' data-layer="plugins"', "")));
ok("[MKT.HOOKS.513] a layer with no data-layer mark is refused as it prints", unmarked.length === 1 &&
  unmarked[0] === 'Proposed\'s layer "Plugins" carries no `data-layer` mark from server · web · surface · plugins · estate (05-artifacts.md § The approach document; RULE.DEVEX.WORKSPACE.233) · write `<h3 data-layer="…">`', unmarked[0]);
ok("a mark that is no layer is refused too", proposedFindings(proposed(layer.replace('data-layer="plugins"', 'data-layer="tools"'))).length === 1);
const bare = proposedFindings(proposed(layer.replace('<p class="sds-small">For: you · Layer: Plugins</p>', "")));
ok("[MKT.HOOKS.513] a block with no For, Layer or Reads line has no finding (233)", bare.length === 0, bare.join(" | "));
ok("the fixed page passes", proposedFindings(proposed(layer)).length === 0);

console.log("\n=== both, on text and from disk");
ok("a preview that still holds a slot of its template is left to the slot check", whereTreeFindings("<h2>Where it lands</h2><pre>{{repository}}/</pre>").length === 0);
ok("a whole preview with both parts right passes", whereTreeFindings(`${proposed(layer)}${where(one)}`).length === 0);
ok("both rules are read from one call", whereTreeFindings(`${proposed(layer.replace(' data-layer="plugins"', ""))}${where("")}`).length === 2);
const dir = mkdtempSync(join(tmpdir(), "where-tree-"));
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, "preview.html"), `${proposed(layer)}${where("")}`);
ok("[MKT.HOOKS.513] a preview saved on disk is read the same way", whereTreeOnDisk(join(dir, "preview.html")).length === 1);
ok("a file that is not there has nothing to find", whereTreeOnDisk(join(dir, "none.html")).length === 0);

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-where-tree` : `\n  all ${total} passed — t-where-tree`);
process.exit(failed ? 1 : 0);
