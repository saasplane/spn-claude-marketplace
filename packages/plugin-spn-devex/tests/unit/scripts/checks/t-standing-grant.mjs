// `checks/standing-grant.ts` — a reply that ends the turn by asking leave for an act a standing grant already
// allows sends the agent back to do it. Each failing reply is shaped on one the developer corrected ("why u need
// me ur allowed how many times I have to tell u"). Every one ends the turn on today's plugin, because no check
// reads what a reply asks leave for, so the suite is red until the check exists.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkStandingGrant, grantOf, lastParagraph } = await import(join(CHECKS, "standing-grant.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const settings = (allow, ask = [], deny = []) => `${JSON.stringify({ permissions: { allow, ask, deny } }, null, 2)}\n`;
// The builder's floor as this workspace keeps it on 30 October 2026, with the developer's own widening beside it.
const BUILDER = workspace("grant-builder", {
  ".claude/settings.json": settings(["Bash(git commit:*)", "Bash(gh pr create:*)", "Bash(gh pr view:*)"], [], ["Bash(git push --force:*)"]),
  ".claude/settings.local.json": settings(["Bash(git push:*)", "Bash(gh pr merge * --repo saasplane/* --merge --admin)"]),
});
// A partner's floor: a push and a merge ask (RULE.DEVEX.WORKSPACE.318).
const PARTNER = workspace("grant-partner", {
  ".claude/settings.json": settings(["Bash(git commit:*)", "Bash(gh pr create:*)"], ["Bash(git push:*)", "Bash(gh pr merge:*)"]),
});

console.log("=== a reply that asks leave the developer already gave");
{
  const merge = checkStandingGrant("Row 3 landed and the checks are green.\n\nShall I merge the pull request now?", BUILDER);
  ok("[MKT.HOOKS.117] an ask to merge, which settings.local.json allows, names the rule and its file",
    merge.length === 1 && merge[0].message.includes("`gh pr merge * --repo saasplane/* --merge --admin` in `.claude/settings.local.json`"), merge[0]?.message);
  const open = checkStandingGrant("The branch is pushed. Want me to open the PR?", BUILDER);
  ok("[MKT.HOOKS.117] an ask to open the pull request, which settings.json allows, names that file",
    open.length === 1 && open[0].message.includes("`gh pr create:*` in `.claude/settings.json`"), open[0]?.message);
  const push = checkStandingGrant("Committed by path. Let me know if you want me to push the branch.", BUILDER);
  ok("[MKT.HOOKS.117] a let-me-know is an ask too", push.length === 1 && push[0].message.includes("- push: `git push:*`"), push[0]?.message);
  const release = checkStandingGrant("Everything is merged. Should I cut the plugins release 0.98.0?", BUILDER);
  ok("[MKT.HOOKS.117] an ask to release a minor version cites the release rule",
    release.length === 1 && release[0].message.includes("RULE.DEVEX.WORKSPACE.069"), release[0]?.message);
  const both = checkStandingGrant("Shall I open the PR and merge it once the checks pass?", BUILDER);
  ok("[MKT.HOOKS.117] one finding names every act the sentence asks for",
    both.length === 1 && both[0].message.includes("- merge:") && both[0].message.includes("- open the pull request:"), both[0]?.message);
}

console.log("\n=== a reply the check leaves alone");
{
  ok("[MKT.HOOKS.118] an ask the floor sends for approval is a real ask", checkStandingGrant("Shall I merge the pull request now?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] an ask to push on a partner's floor is a real ask", checkStandingGrant("Should I push the branch?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a major release is agreed on the go, so the ask is right", checkStandingGrant("Shall I cut the major release 1.0.0?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] an ask in an earlier paragraph is not what the turn ends on",
    checkStandingGrant("Shall I merge it?\n\nMerged #12, and row 4 runs now.", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] a statement of what was done asks nothing", checkStandingGrant("I merged #12 and pushed the branch.", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] an ask no grant covers is the developer's", checkStandingGrant("Shall I rename the heading to Short titles?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] committing to a shape is not a commit", checkStandingGrant("Shall I commit to the first shape?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] a push the floor denies is never a grant", grantOf(BUILDER, "git push --force") === null);
  ok("[MKT.HOOKS.118] the last paragraph is the one the reply ends on", lastParagraph("one\n\ntwo\n\n  three  \n") === "three");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — standing grant` : `\n  all ${total} passed — standing grant`);
process.exit(failed ? 1 : 0);
