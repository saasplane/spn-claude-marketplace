import { CHECKS, EVENTS } from "../../../helpers/harness.mjs";
// `checks/merge-told.ts` — after a Bash call that merged into `develop`, the agent is handed the running arcs of
// each open workstream whose set holds the repository, and the `workstream arc edit <arc> --note` line each
// owes. A note for the agent alone, never a refusal; silent where no running arc holds the repository, where
// the merge went into another branch, and where nothing moved.
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE } from "../../../helpers/fixture.mjs";
import { dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const { applies, checkMergeTold, owing } = await import(join(CHECKS, "merge-told.ts"));
const { rebasedNote } = await import(join(EVENTS, "rebased.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};

// A stand-in `gh` that answers the one question asked of it: the base branch of the pull request.
const shim = join(BASE, "shim");
mkdirSync(shim, { recursive: true });
writeFileSync(join(shim, "gh"), '#!/bin/sh\nprintf "%s" "${GH_BASE:-develop}"\n');
chmodSync(join(shim, "gh"), 0o755);
process.env.PATH = `${shim}:${process.env.PATH}`;

const bash = (command, cwd, response = { stdout: "", stderr: "" }) =>
  ({ tool_name: "Bash", tool_input: { command }, tool_response: response, hook_event_name: "PostToolUse", cwd, session_id: "w1" });
const running = [
  { id: "1", parent: "N001", title: "write the book", kind: "change", repo: "spn-x", altitude: "DOCS", blockedBy: [], touches: [], state: "running" },
  { id: "2", parent: "N001", title: "build it", kind: "change", repo: "spn-x", altitude: "CODE", blockedBy: ["1"], touches: [], state: "waiting" },
];
const commit = (git, message) => git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", message]);
// A merge commit needs an identity too, and a CI runner has none of its own.
const merge = (git, message, branch) => git(["-c", "user.email=t@t", "-c", "user.name=t", "merge", "-q", "--no-ff", "-m", message, branch]);

console.log("=== which commands it reads");
{
  for (const command of ["gh pr merge 12 --squash", "git merge feature", "git pull origin develop", "git -C spn-x merge feature"])
    ok(`\`${command}\` is read`, applies("", command));
  for (const command of ["gh pr view 12", "git status", "git merge --abort", "gh pr merge 12 --auto", "git log --merges"])
    ok(`\`${command}\` is left alone`, !applies("", command));
}

console.log("\n=== a merge into develop with a running arc in a set that holds the repository");
{
  const { root, repo, git } = await dataWorkspace("merge-told-bad", { rows: running });
  git(["checkout", "-q", "-b", "develop"]);
  git(["checkout", "-q", "-b", "feature"]);
  commit(git, "feature work");
  git(["checkout", "-q", "develop"]);
  merge(git, "merge feature", "feature");
  const verdict = checkMergeTold(bash("git merge --no-ff feature", repo));
  ok("a local merge that moved develop gives a note", Boolean(verdict?.note) && !verdict?.deny, JSON.stringify(verdict));
  ok("the note names the repository", verdict?.note?.includes("`spn-x`"), verdict?.note);
  ok("and the line each running arc owes, with its workstream", verdict?.note?.includes('031-probe: `spn-devex workstream arc edit 031/N001 --note "…"`'), verdict?.note);
  ok("and says the agent writes it", /You write the lines/.test(verdict?.note ?? ""), verdict?.note);
  ok("it never refuses", !("deny" in (verdict ?? {})));
  ok("a leading `cd` moves where the command ran", Boolean(checkMergeTold(bash(`cd ${repo} && git merge --no-ff feature`, root))?.note));
  ok("the post-tool hook hands the same note over", rebasedNote(bash("git merge --no-ff feature", repo)) === verdict.note);
  ok("a pull that found nothing new says nothing", checkMergeTold(bash("git pull", repo, { stdout: "Already up to date.\n", stderr: "" })) === null);
  const pr = checkMergeTold(bash("gh pr merge 12 --squash", repo));
  ok("a pull request merged into develop gives the same note", Boolean(pr?.note) && pr.note.includes("031/N001"), JSON.stringify(pr));
  process.env.GH_BASE = "main";
  ok("a pull request merged into another branch says nothing", checkMergeTold(bash("gh pr merge 12 --squash", repo)) === null);
  delete process.env.GH_BASE;
  ok("a failed call is not read", checkMergeTold({ ...bash("git merge feature", repo), hook_event_name: "PostToolUseFailure" }) === null);
  ok("owing lists the running arcs by workstream number", JSON.stringify(owing(root, "spn-x")) === JSON.stringify([{ workstream: "031-probe", arcs: ["031/N001"] }]));
  ok("a repository no set holds is owed nothing", owing(root, "spn-other").length === 0);
}

console.log("\n=== silent");
{
  const { repo, git } = await dataWorkspace("merge-told-silent");
  git(["checkout", "-q", "-b", "develop"]);
  git(["checkout", "-q", "-b", "feature"]);
  commit(git, "feature work");
  git(["checkout", "-q", "develop"]);
  merge(git, "merge feature", "feature");
  ok("a workstream whose arc is not running is told nothing", checkMergeTold(bash("git merge --no-ff feature", repo)) === null);
}
{
  const { repo, git } = await dataWorkspace("merge-told-feature", { rows: running });
  git(["checkout", "-q", "-b", "develop"]);
  git(["checkout", "-q", "-b", "feature"]);
  commit(git, "one");
  git(["checkout", "-q", "-b", "other"]);
  commit(git, "two");
  git(["checkout", "-q", "feature"]);
  merge(git, "merge other", "other");
  ok("a merge into a branch other than develop says nothing", checkMergeTold(bash("git merge --no-ff other", repo)) === null);
  ok("a call that is not Bash says nothing", checkMergeTold({ ...bash("git merge other", repo), tool_name: "Edit" }) === null);
}
{
  const { root, repo } = await dataWorkspace("merge-told-other-repo", { rows: running });
  mkdirSync(join(root, "elsewhere"), { recursive: true });
  ok("a folder that is no repository says nothing", checkMergeTold(bash("git merge feature", join(root, "elsewhere"))) === null);
  ok("a window outside any workspace says nothing", checkMergeTold(bash("git merge feature", shim)) === null);
  void repo;
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-merge-told` : `\n  all ${total} passed — t-merge-told`);
process.exit(failed ? 1 : 0);
