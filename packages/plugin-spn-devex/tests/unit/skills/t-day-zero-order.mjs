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

console.log("=== the bootstrap asks the three shape questions before any repository is made");
{
  const bootstrap = read("skills", "bootstrap", "SKILL.md");
  const row = (act) => bootstrap.split("\n").find((one) => one.startsWith(`| ${act} |`)) ?? "";
  // The shape questions are section 6.4 of the foundation workstream's estate round, and the read-back carries the recommendation (N013).
  const shape = row("6.4"), readBack = row("The recommended repositories");
  ok("[MKT.SKILLS.29] section 6.4 asks the three shape questions, at most three, one at a time", shape !== "" && shape.includes("at most three, one at a time") && shape.includes("(1)") && shape.includes("(2)") && shape.includes("(3)") && !shape.includes("(4)"), shape.slice(0, 300));
  ok("[MKT.SKILLS.29] the questions ask the teams, the services or libraries of their own and the infra material of their own, each with its reason",
    /How many teams/.test(shape) && /own services or app libraries/.test(shape) && /infra material of your own/.test(shape)
      && shape.includes("One team keeps the platform's concept") && shape.includes("Each becomes a repository that joins when the team starts") && shape.includes("It becomes an infra support repository, made before the estate"), shape);
  ok("[MKT.SKILLS.29] the read-back reads the three-way recommendation back before any repository is made: one team, several teams with a book first, own infra material",
    /one team, the estate then the platform/.test(readBack) && /several teams, their own book \(FOUNDATION\) first/.test(readBack) && /own infra material, an infra support repository before the estate/.test(readBack)
      && readBack.includes("before any repository is made"), readBack.slice(0, 400));
  const goActs = bootstrap.slice(bootstrap.indexOf("## The go's acts"));
  const acts = goActs.split("\n").filter((one) => /^\| \d+ \|/.test(one)).map((one) => one.split(" | ")[0].slice(2).trim());
  ok("[MKT.SKILLS.29] the go's acts stay 5 to 13 in order, after the shape questions and the read-back", acts.join(",") === "5,6,7,8,9,10,11,12,13"
    && bootstrap.indexOf("| 6.4 |") < bootstrap.indexOf("## The read-back") && bootstrap.indexOf("## The read-back") < bootstrap.indexOf("## The go's acts"), acts.join(","));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
