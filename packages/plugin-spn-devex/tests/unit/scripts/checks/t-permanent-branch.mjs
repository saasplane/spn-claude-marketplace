// `checks/permanent-branch.ts` — a `git commit` on develop, qa, uat or main of a SaaS Plane repository is
// refused; work reaches them only by a pull request. Each case builds a throwaway repository on a named branch,
// holding `sprepo.json` unless the case is about a repository without one, and calls the check.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { applies, checkPermanentBranch, PERMANENT_BRANCHES, isSaasPlaneRepository } = await import("../../../../src/scripts/checks/permanent-branch.ts");
const { readCommits } = await import("../../../../src/scripts/lib/command-reader.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-permanent-branch-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const git = (repo, ...args) => execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" });
function onBranch(name, branch, { saasPlane = true } = {}) {
  const repo = join(BASE, name);
  execFileSync("git", ["init", "-q", "-b", branch, repo]);
  if (saasPlane) writeFileSync(join(repo, "sprepo.json"), "{}\n");
  git(repo, "commit", "-q", "--allow-empty", "-m", "base");
  return repo;
}
const commit = (repo, command = "git commit -m x") => ({ tool_name: "Bash", cwd: repo, tool_input: { command } });

console.log("=== a commit on a permanent branch is refused");
for (const branch of PERMANENT_BRANCHES) {
  const refused = checkPermanentBranch(commit(onBranch(`on-${branch}`, branch)));
  ok(`a commit on ${branch} is refused, naming the branch and the pull request`,
    Boolean(refused?.deny) && refused.deny.includes(`\`${branch}\``) && refused.deny.includes("pull request"), JSON.stringify(refused));
}
ok("the four branches are develop, qa, uat and main", PERMANENT_BRANCHES.join(",") === "develop,qa,uat,main");

console.log("\n=== every other commit passes");
{
  const feature = onBranch("feature", "feat/031-compliance");
  ok("a commit on a workstream's branch passes", checkPermanentBranch(commit(feature)) === null);
  ok("a call that is not a commit gets no verdict", checkPermanentBranch(commit(onBranch("status-on-develop", "develop"), "git status")) === null);
  ok("a dry run commits nothing and passes", checkPermanentBranch(commit(onBranch("dry-on-main", "main"), "git commit --dry-run -m x")) === null);
  const main = onBranch("moved-by-cd", "main");
  ok("a `cd` or `git -C` into a feature branch moves where the commit runs",
    checkPermanentBranch(commit(main, `git -C ${feature} commit -m x`)) === null && checkPermanentBranch(commit(main, `cd ${feature} && git commit -m x`)) === null);
  ok("a `git -C` into a permanent branch is refused from anywhere", Boolean(checkPermanentBranch(commit(feature, `git -C ${main} commit -m x`))?.deny));
  git(feature, "checkout", "-q", "--detach");
  ok("a detached HEAD is not a permanent branch", checkPermanentBranch(commit(feature)) === null);
}

console.log("\n=== a repository SaaS Plane does not know is not judged");
{
  const plain = onBranch("plain-on-main", "main", { saasPlane: false });
  ok("[MKT.HOOKS.84] a commit on main in a repository with no sprepo.json gets no verdict",
    checkPermanentBranch(commit(plain)) === null && !isSaasPlaneRepository(plain));
  const workspace = join(BASE, "workspace");
  mkdirSync(workspace);
  const store = join(workspace, ".spndevex");
  execFileSync("git", ["init", "-q", "-b", "main", store]);
  git(store, "commit", "-q", "--allow-empty", "-m", "base");
  const member = onBranch("workspace/spn-member", "main");
  ok("[MKT.HOOKS.84] a commit on main in the workspace's .spndevex gets no verdict, from the workspace root too",
    checkPermanentBranch(commit(store)) === null && checkPermanentBranch(commit(workspace, "git -C .spndevex commit -m x -- workstreams")) === null);
  ok("[MKT.HOOKS.69] a member repository on main beside it is still refused",
    Boolean(checkPermanentBranch(commit(workspace, `git -C ${member} commit -m x`))?.deny));
  ok("[MKT.HOOKS.84] a folder git does not know is not a SaaS Plane repository", !isSaasPlaneRepository(workspace));
}

console.log("\n=== the reader and the fast path");
ok("readCommits reads the folder, the -a flag and the paths after `--`",
  (() => { const [call] = readCommits("git commit -am x -- a.ts", "/r"); return call.dir === "/r" && call.all && call.pathspecs.join() === "a.ts"; })());
ok("a `git commit` applies, even after a `cd`", applies("", "git commit -m x") && applies("", "cd spn-x && git -C spn-x commit -F msg.txt"));
ok("a command that only names the word does not", !applies("", "echo commit") && !applies("", "git push"));

console.log(`\n${failed ? `${failed} of ${total} FAILED` : `all ${total} passed`}`);
process.exit(failed ? 1 : 0);
