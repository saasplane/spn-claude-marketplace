// `checks/commit-by-path.ts` — a Bash call that stages or commits more than the window's own files is
// refused, and the refusal names the command to use. Every refusal case below is a command the developer
// corrected, and every one passes on today's plugin, because no check reads these commands.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkCommitByPath } = await import(join(CHECKS, "commit-by-path.ts"));

let total = 0, failed = 0;
const okAs = (id) => (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [${id}] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [${id}] ${label}${detail ? `\n        ${detail}` : ""}`);
};
const ok = okAs("MKT.HOOKS.382");
const passes = okAs("MKT.HOOKS.383");

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
  passes("a commit that names its files after -- passes", kind(checkCommitByPath(bash("git commit -m 'milestone' -- a.ts b.ts"))) === "silent");
  passes("adding one named file passes", kind(checkCommitByPath(bash("git add packages/a/src/a.ts"))) === "silent");
  passes("a push in an ordinary repository passes", kind(checkCommitByPath(bash("git push -u origin feature"))) === "silent");
  passes("a file merely named like a flag in a message passes", kind(checkCommitByPath(bash("git log --oneline -5"))) === "silent");
  passes("a call that is not git is not read", applies("", "ls -la") === false);
  passes("a tool that is not Bash is not read", kind(checkCommitByPath({ tool_name: "Write", tool_input: { command: "git add -A" } })) === "silent");
}

console.log("\n=== a message is read as a message, and only a first-word git is a commit (MKT.HOOKS.383)");
{
  const G = "git " + "commit";
  const named = [
    ["a two-line message", `${G} -m "feat: a\n\nbody line" -- src/a.ts`],
    ["a message holding ;", `${G} -m "feat: a; b" -- src/a.ts`],
    ["a message holding | and &", `${G} -m "a | b & c" -- src/a.ts`],
    ["a heredoc message", `${G} -m "$(cat <<'EOF'\nfeat: a; b\n\nbody (with) parens\nEOF\n)" -- src/a.ts`],
    ["a quoted path", `${G} -m "x" -- "src/a b.ts"`],
  ];
  for (const [label, command] of named)
    passes(`${label} before a -- that names a path passes`, kind(checkCommitByPath(bash(command))) === "silent", JSON.stringify(checkCommitByPath(bash(command))));
  passes("the words in a grep argument are not a commit", kind(checkCommitByPath(bash(`grep -rn "${G} with no path" docs/`))) === "silent");
  passes("the words in an echo argument are not a commit", kind(checkCommitByPath(bash(`echo '${G} -m x'`))) === "silent");
  ok("a commit with a multi-line message and no path is still refused", kind(checkCommitByPath(bash(`${G} -m "feat: a\n\nbody"`))) === "deny");
  ok("a commit with a heredoc message and no path is still refused", kind(checkCommitByPath(bash(`${G} -m "$(cat <<'EOF'\nmsg; more\nEOF\n)"`))) === "deny");
  ok("a commit after && with no path is still refused", kind(checkCommitByPath(bash(`cd x && ${G} -m "a;b"`))) === "deny");
}

console.log("\n=== a pathless commit of staged deletions the command names (MKT.HOOKS.382, MKT.HOOKS.383)");
{
  const repo = mkdtempSync(join(tmpdir(), "spn-cbp-"));
  const git = (...args) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd: repo, stdio: "ignore" });
  const reset = () => { git("reset", "-q", "--hard"); };
  const C = "git " + "commit";
  try {
    git("init", "-q");
    for (const name of ["Old.ts", "Older.ts", "keep.ts"]) writeFileSync(join(repo, name), `// ${name}\n`);
    git("add", "-A"); git("commit", "-q", "-m", "seed");

    git("rm", "-q", "Old.ts", "Older.ts");
    const both = checkCommitByPath(bash(`${C} -m "drop Old.ts and Older.ts" Old.ts Older.ts`, repo));
    passes("two staged deletions, both named in the command, pass without a --", kind(both) === "silent", JSON.stringify(both));
    const one = checkCommitByPath(bash(`${C} -m "drop Old.ts" Old.ts`, repo));
    ok("the same with one deletion not named is refused", kind(one) === "deny", JSON.stringify(one));
    ok("a pathless commit that names none of them is refused", kind(checkCommitByPath(bash(`${C} -m "drop them"`, repo))) === "deny");

    reset();
    git("rm", "-q", "Old.ts", "Older.ts");
    writeFileSync(join(repo, "added.ts"), "// added\n"); git("add", "added.ts");
    const added = checkCommitByPath(bash(`${C} -m "x" Old.ts Older.ts added.ts`, repo));
    ok("a staged change that holds an addition is refused", kind(added) === "deny", JSON.stringify(added));

    reset();
    git("rm", "-q", "Old.ts", "Older.ts");
    writeFileSync(join(repo, "keep.ts"), "// changed\n"); git("add", "keep.ts");
    const modified = checkCommitByPath(bash(`${C} -m "x" Old.ts Older.ts keep.ts`, repo));
    ok("a staged change that holds a modification is refused", kind(modified) === "deny", JSON.stringify(modified));
  } finally { rmSync(repo, { recursive: true, force: true }); }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — commit by path` : `\n  all ${total} passed — commit by path`);
process.exit(failed ? 1 : 0);
