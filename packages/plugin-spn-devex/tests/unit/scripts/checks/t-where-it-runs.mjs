// `checks/where-it-runs.ts` — a workspace command run inside a workstream's folder is refused, and so is
// `spnutils repo agent-sync` in a workspace member or a worktree; each names the way through.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";
import { workspace } from "../../../helpers/fixture.mjs";

const { checkWorkspaceCwd, checkRepoSync } = await import(join(CHECKS, "where-it-runs.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const root = workspace("where-it-runs", { "spn-x/sprepo.json": "{}", ".worktrees/031-probe/spn-x/sprepo.json": "{}" },
  [".spndevex/workstreams/open/031-probe/notes", "spn-x/src", ".worktrees/031-probe/spn-x"]);
const folder = join(root, ".spndevex/workstreams/open/031-probe/notes");
const bash = (cwd, command) => ({ tool_name: "Bash", cwd, tool_input: { command } });

console.log("=== a workspace command inside a workstream's folder");
for (const command of ["spnutils workspace init", "spnutils workspace agent-sync", "claude plugin install spn-devex@saasplane", "spnutils plugin update spn-devex"]) {
  const verdict = checkWorkspaceCwd(bash(folder, command));
  ok(`[MKT.HOOKS.417] \`${command}\` in a workstream's folder is refused, naming the scratchpad`, verdict?.deny?.includes("scratchpad") === true, JSON.stringify(verdict));
}
ok("[MKT.HOOKS.417] a cd into the folder counts", checkWorkspaceCwd(bash(root, `cd ${folder} && spnutils workspace init`))?.deny !== undefined);
ok("[MKT.HOOKS.417] the same command at the workspace root passes", checkWorkspaceCwd(bash(root, "spnutils workspace agent-sync")) === null);
ok("[MKT.HOOKS.417] another command in the folder passes", checkWorkspaceCwd(bash(folder, "spnutils workspace status")) === null);
ok("[MKT.HOOKS.417] a quoted mention passes", checkWorkspaceCwd(bash(folder, `echo "spnutils workspace init"`)) === null);

console.log("\n=== repo agent-sync in a member or a worktree");
{
  const member = checkRepoSync(bash(join(root, "spn-x"), "spnutils repo agent-sync"));
  ok("[MKT.HOOKS.418] in a workspace member it is refused, naming workspace agent-sync", member?.deny?.includes("spnutils workspace agent-sync") === true && member.deny.includes("member"), JSON.stringify(member));
  const tree = checkRepoSync(bash(join(root, ".worktrees/031-probe/spn-x"), "spnutils repo agent-sync"));
  ok("[MKT.HOOKS.418] in a worktree it is refused", tree?.deny?.includes("worktree") === true, JSON.stringify(tree));
  ok("[MKT.HOOKS.418] a cd into the member counts", checkRepoSync(bash(root, "cd spn-x && spnutils repo agent-sync"))?.deny !== undefined);
  ok("[MKT.HOOKS.418] the workspace command in a member passes", checkRepoSync(bash(join(root, "spn-x"), "spnutils workspace agent-sync")) === null);
  ok("[MKT.HOOKS.418] a folder that is no member passes", checkRepoSync(bash(join(root, ".spndevex"), "spnutils repo agent-sync")) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — where it runs` : `\n  all ${total} passed — where it runs`);
process.exit(failed ? 1 : 0);
