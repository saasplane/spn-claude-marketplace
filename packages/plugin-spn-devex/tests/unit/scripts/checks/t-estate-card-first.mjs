// `checks/estate-card-first.ts` — an edit to an estate declaration needs an answered card that names the change.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { applies, checkEstateCardFirst } = await import(join(CHECKS, "estate-card-first.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");
const card = (id, state, title) => JSON.stringify({ id, arc: "N001", title, state, raised: "2026-11-01", shownIn: [], card: { why: `change ${title}` }, answer: state === "answered" ? { key: "a", words: "yes", at: "2026-11-01" } : null }) + "\n";

const bare = workspace("estate-card-bare", { ".spndevex/workstreams/open/020-x/questions.jsonl": "" });
const answered = workspace("estate-card-answered", { ".spndevex/workstreams/open/020-x/questions.jsonl": card("q1", "answered", "Rename the org in infra-organization") });
const open = workspace("estate-card-open", { ".spndevex/workstreams/open/020-x/questions.jsonl": card("q1", "open", "Rename the org in infra-organization") });
const edit = (root, file) => ({ tool_name: "Edit", cwd: root, tool_input: { file_path: `${root}/spn-infra/packages/${file}` } });

console.log("=== edits it refuses");
{
  const verdict = checkEstateCardFirst(edit(bare, "infra-organization/src/spestate.json"));
  ok("[MKT.HOOKS.389] an estate declaration with no card is refused", kind(verdict) === "deny", JSON.stringify(verdict));
  ok("[MKT.HOOKS.389] the refusal names the corrected form", /workstream question raise/.test(verdict?.deny ?? "") && /infra-organization/.test(verdict?.deny ?? ""), verdict?.deny);
  ok("[MKT.HOOKS.389] a card still open does not count", kind(checkEstateCardFirst(edit(open, "infra-organization/src/spestate.json"))) === "deny");
  ok("[MKT.HOOKS.389] a card about another package does not count", kind(checkEstateCardFirst(edit(answered, "infra-module-idp/src/spestate.json"))) === "deny");
  ok("[MKT.HOOKS.389] a Write to spinfrapkg.json is read the same", kind(checkEstateCardFirst({ ...edit(bare, "infra-organization/spinfrapkg.json"), tool_name: "Write" })) === "deny");
}

console.log("\n=== edits it lets through");
{
  ok("[MKT.HOOKS.389] an answered card that names the package passes", kind(checkEstateCardFirst(edit(answered, "infra-organization/src/spestate.json"))) === "silent");
  ok("[MKT.HOOKS.389] an ordinary source file is not read", applies("/x/src/a.ts") === false && kind(checkEstateCardFirst(edit(bare, "infra-organization/src/a.ts"))) === "silent");
  ok("[MKT.HOOKS.389] a call that is not a Write or Edit is not read", kind(checkEstateCardFirst({ tool_name: "Bash", cwd: bare, tool_input: { command: "x" } })) === "silent");
  ok("[MKT.HOOKS.389] outside a workspace there is nothing to ask", kind(checkEstateCardFirst({ tool_name: "Edit", cwd: "/nonexistent", tool_input: { file_path: "/nonexistent/spestate.json" } })) === "silent");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — estate card first` : `\n  all ${total} passed — estate card first`);
process.exit(failed ? 1 : 0);
