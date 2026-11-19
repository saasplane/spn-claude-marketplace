// The run claims the book states are carried by the skills: scm and deliver say the agent reads a pull request's failed checks while the pipeline stays
// agent-free, and operate says declaring on-call in the estate is proposed and an alert names its dashboard, runbook and version.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLUGIN } from "../../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const skill = (name) => readFileSync(resolve(PLUGIN, "src", "skills", name, "SKILL.md"), "utf8");

console.log("=== run claims — the pipeline and the agent");
for (const name of ["scm", "deliver"]) {
  const text = skill(name);
  ok(`the ${name} skill says the agent reads a pull request's failed checks and proposes the fix`, /agent reads[^.]*failed checks and proposes the fix/.test(text));
  ok(`the ${name} skill says the pipeline stays agent-free`, text.includes("the pipeline") && text.includes("agent-free"));
}

console.log("\n=== run claims — on-call and alerts");
const operate = skill("operate");
ok("the operate skill says declaring on-call in the estate is proposed", operate.includes("declaring one is proposed"));
ok("the operate skill says an alert names its dashboard, runbook and version", operate.includes("An alert names its dashboard, its runbook and the version it concerns"));

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
