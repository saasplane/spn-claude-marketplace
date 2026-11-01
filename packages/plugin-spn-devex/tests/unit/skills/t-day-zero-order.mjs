// The day-zero order (RULE.DEVEX.FUNCTION.098) is a step of the ideate and the bootstrap skills and is restated in the ideate ref, and the
// figure of an approach page's What (RULE.DEVEX.WORKSPACE.497) is decided in the step that writes it, in the ideate skill and in the execute skill.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN } from "../../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const read = (...parts) => readFileSync(join(PLUGIN, "src", ...parts), "utf8");

const ORDER = ["The idea, in their words", "The trade before the constructs", "The existing twin before a new construct",
  "Several modules are planned with a split test", "Open asks stay few", "Each new term is defined once", "The preview follows their spine"];
const cited = "(`RULE.DEVEX.FUNCTION.098` · MUST · skill:spn-devex/ideate)";
const inOrder = (text) => {
  const at = ORDER.map((step) => text.indexOf(`**${step}`));
  return at.every((place, i) => place >= 0 && (i === 0 || place > at[i - 1]));
};

console.log("=== the day-zero order is a step of the skills that take an idea in");
{
  const ideate = read("skills", "ideate", "SKILL.md"), bootstrap = read("skills", "bootstrap", "SKILL.md"), ref = read("refs", "devex", "function", "ideate.md");
  ok("[MKT.SCRIPTS.437] the ideate skill carries the seven steps in order, citing the rule with its full parenthesis", ideate.includes(cited) && inOrder(ideate));
  ok("[MKT.SCRIPTS.437] the bootstrap skill carries the seven steps in order, citing the rule with its full parenthesis", bootstrap.includes(cited) && inOrder(bootstrap));
  ok("[MKT.SCRIPTS.437] the ideate ref restates the rule and the seven steps, and keeps its restates header", ref.includes("RULE.DEVEX.FUNCTION.098") && inOrder(ref) && ref.startsWith("<!-- spn:restates"));
  ok("[MKT.SCRIPTS.437] known-bad: steps out of order are caught", !inOrder([...ORDER].reverse().map((step) => `**${step}`).join("\n")));
}

console.log("=== the figure is decided while the What is written");
{
  const line = (text) => text.split("\n").filter((one) => one.includes("RULE.DEVEX.WORKSPACE.497"));
  const ideate = line(read("skills", "ideate", "SKILL.md")), execute = line(read("skills", "execute", "SKILL.md"));
  ok("[MKT.SCRIPTS.438] the ideate skill has one line deciding the figure with the What, citing the rule and the no-figure line",
    ideate.length === 1 && ideate[0].includes("figure") && ideate[0].includes("<!-- no figure:"), JSON.stringify(ideate).slice(0, 200));
  ok("[MKT.SCRIPTS.438] the execute skill has one line deciding the figure when the What is rewritten",
    execute.length === 1 && execute[0].includes("What") && execute[0].includes("figure"), JSON.stringify(execute).slice(0, 200));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
