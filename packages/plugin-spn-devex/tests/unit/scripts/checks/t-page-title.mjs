// `checks/page-title.ts` — a subsection heading is a topic name of at most five words, with no comma.
const { checkPageTitle } = await import("../../../../src/scripts/checks/page-title.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const write = (file_path, content, tool_name = "Write") =>
  ({ tool_name, cwd: "/repo", tool_input: tool_name === "Write" ? { file_path, content } : { file_path, new_string: content } });

const page = (body) => write("/ws/.spndevex/workstreams/open/036-x/approach.html", body);

console.log("=== a long or comma heading");
const long = checkPageTitle(page("<h3>What the agent misses most, by kind</h3>"));
ok("[MKT.HOOKS.137] an h3 past five words is refused", verdictOf(long) === "deny", JSON.stringify(long));
ok("[MKT.HOOKS.137] the refusal quotes the heading", (long?.deny ?? "").includes("What the agent misses most, by kind"), long?.deny);
ok("[MKT.HOOKS.137] an h4 with a comma is refused",
  verdictOf(checkPageTitle(page("<h4>Cost, then proof</h4>"))) === "deny");
ok("[MKT.HOOKS.137] a short topic name passes", verdictOf(checkPageTitle(page("<h3>The shape of it</h3>"))) === "silent");
ok("[MKT.HOOKS.137] an h2 is not judged", verdictOf(checkPageTitle(page("<h2>A very long section heading with many words</h2>"))) === "silent");
ok("[MKT.HOOKS.137] a markdown ### heading is judged too",
  verdictOf(checkPageTitle(write("/repo/docs/a.md", "### One two three four five six\n"))) === "deny");

console.log("\n=== a card keeps its question");
const card = '<div class="sds-open"><h3>Which of these two shapes should the check take for a long page?</h3></div>';
ok("[MKT.HOOKS.138] a card's question heading inside div.sds-open passes", verdictOf(checkPageTitle(page(card))) === "silent");
ok("[MKT.HOOKS.138] a long heading after the card closes is refused again",
  verdictOf(checkPageTitle(page(card + "<h3>Another long heading right here now</h3>"))) === "deny");

console.log("\n=== the same rule on a page read from disk");
{
  const { titleFindingsOnDisk, longHeadings, titleRefusal } = await import("../../../../src/scripts/checks/page-title.ts");
  const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "page-title-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  const ws = join(dir, ".spndevex", "workstreams", "open", "036-x");
  mkdirSync(ws, { recursive: true });
  const file = join(ws, "approach.html");
  writeFileSync(file, "<h3>What the agent misses most, by kind</h3><h4>The shape of it</h4>");
  const found = titleFindingsOnDisk(file);
  ok("[MKT.HOOKS.512] a saved page's long heading is named, with its rule and the way out",
    found.length === 1 && found[0] === 'heading "What the agent misses most, by kind" is past 5 words or holds a comma (RULE.DEVEX.WORKSPACE.451) · keep a topic name, and move the sentence to the lead line under it', found.join("|"));
  ok("[MKT.HOOKS.512] the hook and the disk read one rule: the same headings are found in the same text",
    JSON.stringify(longHeadings(file, "<h3>What the agent misses most, by kind</h3>")) === JSON.stringify(["What the agent misses most, by kind"]));
  ok("[MKT.HOOKS.512] the refusal prints as it did before the rule was shared",
    titleRefusal(["Cost, then proof"]).startsWith("Denied: a subsection heading is a topic name of at most 5 words with no comma.\n\n  • \"Cost, then proof\""));
  writeFileSync(file, "<h3>The shape of it</h3>");
  ok("[MKT.HOOKS.512] the page with the heading cut to a topic name passes", titleFindingsOnDisk(file).length === 0);
  writeFileSync(file, "<h3>{{A topic name, at most five words, no comma}}</h3>");
  ok("[MKT.HOOKS.512] a slot of the template is not yet a heading, and passes", titleFindingsOnDisk(file).length === 0);
  ok("[MKT.HOOKS.512] a page that is not there has nothing to find", titleFindingsOnDisk(join(ws, "missing.html")).length === 0);
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

