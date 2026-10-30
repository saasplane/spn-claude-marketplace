// `lib/precedent.ts` — the decisions and rules whose words match a subject, found from a register's text and the rules
// index, and none for an unrelated subject. `suggestion add` prints what it finds.
import { precedentFor, precedentLines, decisionsIn, rulesIn } from "../../../../src/scripts/lib/precedent.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const register = [
  "| Id | Decision |",
  "| --- | --- |",
  "| **DEC.DEVEX.WORKSPACE.012** | A workstream number is never reused once a folder has held it |",
  "| DEC.DEVEX.AGENT.004 | The session start names each running go in one line |",
  "### D18 — Is the reserved `platform` key of the domain map enforced by the contract?",
].join("\n");
const rules = [
  { id: "RULE.DEVEX.WORKSPACE.101", chapter: "docs/a/01-workstream.md", heading: "A suggestion is recorded the moment it is raised", line: { text: "Record each suggestion as it is raised.", ref: "r", heading: "h" } },
  { id: "RULE.DEVEX.HOOKS.020", chapter: "docs/a/02-hooks.md", heading: "A hook returns one of three grades" },
];

console.log("=== what a register and the rules index hold");
{
  const found = decisionsIn(register, "spn-foundation/docs/registers/decisions.md");
  ok("[MKT.SCRIPTS.316] a register's id rows and card headings are read as decisions", found.map((one) => one.id).join(",") === "DEC.DEVEX.WORKSPACE.012,DEC.DEVEX.AGENT.004,D18", found.map((one) => one.id).join(","));
  ok("[MKT.SCRIPTS.316] a rule is read with its heading and its short line", rulesIn(rules)[0].text.includes("moment it is raised") && rulesIn(rules)[0].text.includes("Record each suggestion"));
}

const candidates = [...decisionsIn(register, "register"), ...rulesIn(rules)];

console.log("\n=== a subject finds what speaks to it");
{
  const number = precedentFor("workstream number reuse", candidates);
  ok("[MKT.SCRIPTS.316] a subject finds the decision whose words match", number.map((one) => one.id).join(",") === "DEC.DEVEX.WORKSPACE.012", number.map((one) => one.id).join(","));
  const raised = precedentFor("record a suggestion when raised", candidates);
  ok("[MKT.SCRIPTS.316] a subject finds the rule whose words match", raised.some((one) => one.kind === "rule" && one.id === "RULE.DEVEX.WORKSPACE.101"), JSON.stringify(raised));
  ok("[MKT.SCRIPTS.316] a subject of one word finds what holds that word", precedentFor("hook", candidates).map((one) => one.id).join(",") === "RULE.DEVEX.HOOKS.020");
}

console.log("\n=== an unrelated subject finds nothing");
{
  ok("[MKT.SCRIPTS.316] an unrelated subject finds no precedent", precedentFor("colour of the footer", candidates).length === 0);
  ok("[MKT.SCRIPTS.316] a subject of common words finds no precedent", precedentFor("the and for", candidates).length === 0);
  ok("[MKT.SCRIPTS.316] an unrelated subject prints no line", precedentLines("/nowhere-at-all", "colour of the footer").length === 0);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — precedent` : `\n  all ${total} passed — precedent`);
process.exit(failed ? 1 : 0);
