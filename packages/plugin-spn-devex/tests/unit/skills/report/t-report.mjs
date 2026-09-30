// `skills/report/SKILL.md` — the report skill restates the book's § Reports and templates and the
// construct *The Report* for the agent (N122 step 5.1): per report type the command to run, the
// tables with their columns, how Records are grouped, who decides, the plain words, and that the
// report fixes nothing and is never published unless the developer asks.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const SKILL = readFileSync(join(PLUGIN, "src", "skills", "report", "SKILL.md"), "utf8");

let total = 0, failed = 0;
const check = (label, ok) => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
};
const section = (heading) => {
  const at = SKILL.indexOf(`\n### ${heading}`);
  if (at < 0) return "";
  const next = SKILL.slice(at + 5).search(/\n#{2,3} /);
  return next < 0 ? SKILL.slice(at) : SKILL.slice(at, at + 5 + next);
};

console.log("=== 5.1 — the shared frame");
const order = ["Summary", "Findings", "Records", "Measured", "Recommendations"].map((name) => SKILL.indexOf(`| **${name}** |`));
check("5.1: the five sections are listed in the book's order", order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])));
check("5.1: the header's second line is Repo · Commit · Generated", SKILL.includes("Repo: <folder name> | Commit: <short hash> | Generated: <time>"));
check("5.1: the block carries `repository`", /`repository`/.test(SKILL) && /`reportType`/.test(SKILL));
check("5.1: no status and no comparison with an earlier report", /No status, and no comparison with an earlier report — MUST/.test(SKILL));
check("5.1: Measured shows Scope, Measure again and Not looked at, and folds Method",
  /\*\*Scope\*\*/.test(SKILL) && /\*\*Measure again\*\*/.test(SKILL) && /\*\*Not looked at\*\*/.test(SKILL) && /folded under \*How each number was produced\*/.test(SKILL));
check("5.1: the old section names are gone", !/What was measured|What this did not look at|What to do/.test(SKILL));
check("5.1: Recommendations is # · Recommendation · Closes · Done when, with no Effort column",
  SKILL.includes("**# · Recommendation · Closes · Done when**") && /No Decided by column and no Effort column/.test(SKILL));
check("5.1: Records are list items grouped by cause, with the five data attributes",
  /list items, never a table — MUST/.test(SKILL) && ["data-id", "data-rule", "data-severity", "data-decider", "data-location"].every((a) => SKILL.includes(a)));
check("5.1: who decides has the three values and the per-type starting table",
  /\| \*\*Agent\*\* \|/.test(SKILL) && /\| \*\*Agent, flagged\*\* \|/.test(SKILL) && /\| \*\*Developer\*\* \|/.test(SKILL)
  && ["Coverage", "Tests", "Audit", "Code", "Docs"].every((type) => new RegExp(`^\\| ${type} \\|`, "m").test(SKILL)));
check("5.1: the plain words table maps seat, construct, kind and owed tier",
  /\| seat \| docs folder/.test(SKILL) && /\| construct, construct page \| design topic/.test(SKILL) && /\| kind \| project type/.test(SKILL) && /\| owed tier \|/.test(SKILL));
check("5.1: the report fixes nothing — an arc for the agent's items, Q cards for the developer's",
  /\*\*The report fixes nothing\.\*\*/.test(SKILL) && /open an arc/.test(SKILL) && /`Q<n>` card/.test(SKILL));
check("2l: never published unless the developer asks, handed over as the full path",
  /Never publish a report unless the developer asks — MUST/.test(SKILL) && /full path/.test(SKILL) && /RD\.DEVEX\.WORKSPACE\.117/.test(SKILL));

console.log("\n=== 5.1 — each report type: its command, its tables and its record groups");
const TYPES = {
  "Coverage": [/spn-devex coverage measure <repo> --json/, /Name · Written · Built · Proved · Not written · Not built · Not proved/, /level 1 the gap/,
    /A `MANUAL` row counts in none of the numbers — MUST[\s\S]*Proved by hand/],
  "Tests": [/spn-devex behaviours coverage <repo> --json/, /Tier · Runs · Written · Built · SUCCESS · FAILED · PENDING · PLANNED/, /The tests report reads the stamped rows only/, /level 1 the status/,
    /A `MANUAL` row counts in none of the numbers — MUST[\s\S]*Proved by hand/],
  "Audit": [/spnutils apps validate repo/, /Plugin · Declared · Installed · Source · State/, /setup only — MUST/, /level 1 the area/],
  "Code": [/spnutils apps check <package>/, /Group · Checks · PASS · WARN · FAIL/, /Lint is one check per package/, /level 1 the rule group/],
  "Docs": [/docs status <repo>\/docs\/02-constructs --check/, /Docs folder · Pages · DONE · IMPLEMENTING · PLANNING · No status/, /Rule · State · Pages/, /level 1 the rule/],
};
for (const [type, patterns] of Object.entries(TYPES)) {
  const text = section(`${type} — `);
  check(`5.1: the skill has a section for the ${type.toLowerCase()} report`, text.length > 0);
  patterns.forEach((pattern, i) => check(`5.1: ${type.toLowerCase()} — ${pattern.source.replace(/\\/g, "").slice(0, 60)}`, pattern.test(text)));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — report skill` : `\n  all ${total} passed — report skill`);
process.exit(failed ? 1 : 0);
