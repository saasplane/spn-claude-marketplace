// `checks/how-it-runs.ts` — a reply that asks the developer how the work runs sends the agent back to decide it. The
// failing replies are shaped on ones the developer corrected: the baseline the agent took itself, which arc runs first,
// the go for a release, and every ask for an act a standing grant allows ("why u need me ur allowed how many times I have
// to tell u"). The cases the standing-grant check held are kept whole.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkHowItRuns, grantOf, lastParagraph, runsTheWork } = await import(join(CHECKS, "how-it-runs.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const settings = (allow, ask = [], deny = []) => `${JSON.stringify({ permissions: { allow, ask, deny } }, null, 2)}\n`;
// The builder's floor as this workspace keeps it on 30 October 2026, with the developer's own widening beside it.
const BUILDER = workspace("runs-builder", {
  ".claude/settings.json": settings(["Bash(git commit:*)", "Bash(gh pr create:*)", "Bash(gh pr view:*)"], [], ["Bash(git push --force:*)"]),
  ".claude/settings.local.json": settings(["Bash(git push:*)", "Bash(gh pr merge * --repo saasplane/* --merge --admin)"]),
});
// A partner's floor: a push and a merge ask (RULE.DEVEX.WORKSPACE.318).
const PARTNER = workspace("runs-partner", {
  ".claude/settings.json": settings(["Bash(git commit:*)", "Bash(gh pr create:*)"], ["Bash(git push:*)", "Bash(gh pr merge:*)"]),
});

console.log("=== a reply that asks how the work runs");
{
  const baseline = checkHowItRuns("N002 is decided.\n\nMay I discard the develop baseline that was taken before N002's code?", PARTNER);
  ok("[MKT.HOOKS.117] the baseline ask is sent back as the agent's own measurement",
    baseline.length === 1 && baseline[0].check === "how-it-runs" && baseline[0].message.includes("the agent's own measurement")
      && baseline[0].message.includes("RULE.DEVEX.WORKSPACE.467"), baseline[0]?.message);
  const order = checkHowItRuns("Both arcs are decided.\n\nWhich arc should I start first?", PARTNER);
  ok("[MKT.HOOKS.117] the arc-order ask is sent back as the order of the work",
    order.length === 1 && order[0].message.includes("the order of the work"), order[0]?.message);
  const needs = checkHowItRuns("## Needs you\n\n- May I hold the helper until the baseline is in?\n\n## Progress\n\nThe checks are green.", PARTNER);
  ok("[MKT.HOOKS.117] an ask in the Needs you part is read too", needs.length === 1 && needs[0].message.includes("hold the helper"), needs[0]?.message);
  const release = checkHowItRuns("Everything is merged. Say the word and I'll cut the plugins release 0.98.0.", BUILDER);
  ok("[MKT.HOOKS.117] the go for a minor release is sent back, citing the release rule",
    release.length === 1 && release[0].message.includes("RULE.DEVEX.WORKSPACE.069"), release[0]?.message);
}

console.log("\n=== an act a standing grant already allows");
{
  const merge = checkHowItRuns("Row 3 landed and the checks are green.\n\nShall I merge the pull request now?", BUILDER);
  ok("[MKT.HOOKS.117] an ask to merge, which settings.local.json allows, names the rule and its file",
    merge.length === 1 && merge[0].message.includes("`gh pr merge * --repo saasplane/* --merge --admin` in `.claude/settings.local.json`"), merge[0]?.message);
  const open = checkHowItRuns("The branch is pushed. Want me to open the PR?", BUILDER);
  ok("[MKT.HOOKS.117] an ask to open the pull request, which settings.json allows, names that file",
    open.length === 1 && open[0].message.includes("`gh pr create:*` in `.claude/settings.json`"), open[0]?.message);
  const push = checkHowItRuns("Committed by path. Let me know if you want me to push the branch.", BUILDER);
  ok("[MKT.HOOKS.117] a let-me-know is an ask too", push.length === 1 && push[0].message.includes("push, which `git push:*`"), push[0]?.message);
  const both = checkHowItRuns("Shall I open the PR and merge it once the checks pass?", BUILDER);
  ok("[MKT.HOOKS.117] one finding names every act the sentence asks for",
    both.length === 1 && both[0].message.includes("merge, which") && both[0].message.includes("open the pull request, which"), both[0]?.message);
}

console.log("\n=== a reply the check leaves alone");
{
  ok("[MKT.HOOKS.118] an ask the floor sends for approval is a real ask", checkHowItRuns("Shall I merge the pull request now?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] an ask to push on a partner's floor is a real ask", checkHowItRuns("Should I push?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a major release is agreed on the go, so the ask is right", checkHowItRuns("Shall I cut the major release 1.0.0?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] an ask in an earlier paragraph is not what the turn ends on",
    checkHowItRuns("Shall I merge it?\n\nMerged #12, and row 4 runs now.", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] a statement of what was done asks nothing", checkHowItRuns("I merged #12 and pushed the branch.", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] an ask no grant covers is the developer's", checkHowItRuns("Shall I rename the heading to Short titles?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] committing to a shape is not a commit", checkHowItRuns("Shall I commit to the first shape?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] a push the floor denies is never a grant", grantOf(BUILDER, "git push --force") === null);
  ok("[MKT.HOOKS.118] the last paragraph is the one the reply ends on", lastParagraph("one\n\ntwo\n\n  three  \n") === "three");
  ok("[MKT.HOOKS.118] a card's line passes: its number with its question in words",
    checkHowItRuns("Q3 · which arc should the probe join first?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a page to look at passes", checkHowItRuns("The design is ready.\n\nWould you look at the preview page before I start?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a refused merge, said with what the agent needs, passes",
    checkHowItRuns("May I merge it with the admin flag, since the permission system refused the plain merge?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a major release passes where a grant covers a minor one",
    checkHowItRuns("The plugins are ready.\n\nShall I cut the major release?", BUILDER).length === 0);
  ok("[MKT.HOOKS.118] a boundary passes: deleting a person's data", checkHowItRuns("Should I delete the person's data from the export?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a new workstream is the developer's to create", checkHowItRuns("Should I open a new workstream for the arc order?", PARTNER).length === 0);
  ok("[MKT.HOOKS.118] a card or suggestion text with no act of running reads as null", runsTheWork("Which grid do the cards sit on?") === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — how it runs` : `\n  all ${total} passed — how it runs`);
process.exit(failed ? 1 : 0);
