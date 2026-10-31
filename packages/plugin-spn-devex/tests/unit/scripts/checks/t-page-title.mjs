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

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);

