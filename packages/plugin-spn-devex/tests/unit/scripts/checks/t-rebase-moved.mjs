import { CHECKS } from "../../../helpers/harness.mjs";
// `checks/rebase-moved.ts` — after a `git rebase`, `git merge` or `git pull` that names `develop`, the agent
// is handed the files develop changed that the branch also changed, and the open arcs' pinned facts whose
// source has moved. A note for the agent alone, never a refusal; silent where the window has no workstream,
// no arcs or no pinned facts.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { bindOpen } from "../../../helpers/fixture.mjs";
import { cli, dataWorkspace } from "../../../helpers/workstream-fixture.mjs";

const { applies, checkRebaseMoved } = await import(join(CHECKS, "rebase-moved.ts"));
const { rebasedNote } = await import(join(CHECKS, "..", "events", "rebased.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 500)}` : ""}`);
};

const bash = (command, cwd, session) => ({ tool_name: "Bash", tool_input: { command }, cwd, session_id: session });

console.log("=== which commands it reads");
{
  for (const command of ["git rebase develop", "git rebase origin/develop", "git merge origin/develop", "git pull --rebase origin develop",
    "git -C spn-x rebase develop", "cd spn-x && git pull origin develop"])
    ok(`\`${command}\` is read`, applies("", command));
  for (const command of ["git rebase main", "git status", "git log develop", "echo rebase develop", "git rebase --continue"])
    ok(`\`${command}\` is left alone`, !applies("", command));
}

// A workspace with one workstream whose arc pinned a fact on `spn-x/a.ts`, and a repository `spn-x` with `develop`
// and a feature branch that changed `b.ts`. Develop then changes `a.ts` (the pinned source) and `b.ts`.
const built = async (name) => {
  const { root, repo, git } = await dataWorkspace(name);
  const fact = cli(root, ["workstream", "fact", "write", "031/N001", "--source", "spn-x/a.ts", "--fact", "a is one"]);
  const base = git(["rev-parse", "HEAD"]);
  git(["branch", "develop"]);
  git(["checkout", "-q", "-b", "feature"]);
  writeFileSync(join(repo, "b.ts"), "export const b = 1;\n");
  git(["add", "-A"]);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "feature"]);
  git(["checkout", "-q", "develop"]);
  writeFileSync(join(repo, "a.ts"), "export const a = 2;\n");
  writeFileSync(join(repo, "b.ts"), "export const b = 0;\n");
  git(["add", "-A"]);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "develop moves a and b"]);
  git(["checkout", "-q", "feature"]);
  return { root, repo, git, base, fact };
};
const rebase = (git) => { try { git(["-c", "user.email=t@t", "-c", "user.name=t", "rebase", "develop"]); } catch { /* a conflict leaves ORIG_HEAD set too */ } };

console.log("\n=== known-bad: develop moved a pinned fact's source, and the branch changed a file develop also changed");
{
  const { root, repo, git, fact } = await built("rebase-moved-bad");
  ok("the fixture pinned the fact", fact.code === 0, fact.out);
  bindOpen(root, "w1");
  rebase(git);
  const verdict = checkRebaseMoved(bash("git rebase develop", repo, "w1"));
  ok("it gives a note", Boolean(verdict?.note) && !verdict?.deny, JSON.stringify(verdict));
  ok("the note names the file both sides changed", /files? .*changed.*: b\.ts/i.test(verdict?.note ?? ""), verdict?.note);
  ok("the note names the pinned fact whose source moved", /N001 f1: `spn-x\/a\.ts` moved since/.test(verdict?.note ?? ""), verdict?.note);
  ok("it never refuses", !("deny" in (verdict ?? {})));
  ok("a leading `cd` moves where the command ran", Boolean(checkRebaseMoved(bash(`cd ${repo} && git rebase develop`, root, "w1"))?.note));
  const event = rebasedNote({ ...bash("git rebase develop", repo, "w1"), hook_event_name: "PostToolUse" });
  ok("the event hands the same note over", event === verdict.note, event);
  ok("a failed call is not read", rebasedNote({ ...bash("git rebase develop", repo, "w1"), hook_event_name: "PostToolUseFailure" }) === null);
}

console.log("\n=== silent");
{
  const { root, repo, git } = await built("rebase-moved-silent");
  rebase(git);
  ok("a window with no workstream hears nothing", checkRebaseMoved(bash("git rebase develop", repo, "no-window")) === null);
  ok("a command that does not name develop hears nothing", (bindOpen(root, "w2"), checkRebaseMoved(bash("git rebase main", repo, "w2")) === null));
  ok("a call that is not Bash hears nothing", checkRebaseMoved({ tool_name: "Edit", tool_input: { command: "git rebase develop" }, cwd: repo, session_id: "w2" }) === null);
  ok("a call with no session hears nothing", checkRebaseMoved({ tool_name: "Bash", tool_input: { command: "git rebase develop" }, cwd: repo }) === null);
}
{
  const { root, repo, git } = await dataWorkspace("rebase-moved-no-facts");
  git(["branch", "develop"]);
  bindOpen(root, "w3");
  ok("an arc with no pinned fact hears nothing", checkRebaseMoved(bash("git rebase develop", repo, "w3")) === null);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-rebase-moved` : `\n  all ${total} passed — t-rebase-moved`);
process.exit(failed ? 1 : 0);
