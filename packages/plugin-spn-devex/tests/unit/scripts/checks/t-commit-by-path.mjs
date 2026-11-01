// `checks/commit-by-path.ts` — a Bash call that stages or commits more than the window's own files is
// refused, and the refusal names the command to use. Every refusal case below is a command the developer
// corrected, and every one passes on today's plugin, because no check reads these commands.
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkCommitByPath } = await import(join(CHECKS, "commit-by-path.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.HOOKS.382] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.HOOKS.382] ${label}${detail ? `\n        ${detail}` : ""}`);
};

const bash = (command, cwd = "/opt/work/saasplane/code/spn-claude-marketplace") => ({ tool_name: "Bash", cwd, tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== commands that take more than the window's own files");
for (const command of ["git add -A", "git add .", "git add --all", "git add -A && git commit -m 'x' -- a.ts", "git -C spn-x add ."]) {
  const verdict = checkCommitByPath(bash(command));
  ok(`\`${command}\` is refused, naming the path form`, kind(verdict) === "deny" && verdict.deny.includes("git add <path>"), JSON.stringify(verdict));
}
{
  const verdict = checkCommitByPath(bash("git commit -m 'milestone'"));
  ok("a commit with no path is refused, naming the commit-by-path form", kind(verdict) === "deny" && verdict.deny.includes("-- <path>"), JSON.stringify(verdict));
  ok("a stash is refused", kind(checkCommitByPath(bash("git stash"))) === "deny");
  ok("a push inside .spndevex is refused", kind(checkCommitByPath(bash("git push", "/opt/work/saasplane/code/.spndevex"))) === "deny");
  ok("a remote added to .spndevex is refused", kind(checkCommitByPath(bash("git -C .spndevex remote add origin x"))) === "deny");
}

console.log("\n=== commands it leaves alone");
{
  ok("a commit that names its files after -- passes", kind(checkCommitByPath(bash("git commit -m 'milestone' -- a.ts b.ts"))) === "silent");
  ok("adding one named file passes", kind(checkCommitByPath(bash("git add packages/a/src/a.ts"))) === "silent");
  ok("a push in an ordinary repository passes", kind(checkCommitByPath(bash("git push -u origin feature"))) === "silent");
  ok("a file merely named like a flag in a message passes", kind(checkCommitByPath(bash("git log --oneline -5"))) === "silent");
  ok("a call that is not git is not read", applies("", "ls -la") === false);
  ok("a tool that is not Bash is not read", kind(checkCommitByPath({ tool_name: "Write", tool_input: { command: "git add -A" } })) === "silent");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — commit by path` : `\n  all ${total} passed — commit by path`);
process.exit(failed ? 1 : 0);
