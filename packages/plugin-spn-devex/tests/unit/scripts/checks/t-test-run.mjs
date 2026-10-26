// `checks/test-run.ts` — a write under a repository's `src` or `tests` waits while a test run for that
// repository is going (the book's RD.DEVEX.WORKSPACE.207).
//
// The guard knows a run only by its start file, `.spndevex/.debug/telemetry/pending/<tool_use_id>.json`,
// which `lib/bash-timing.ts` writes before a timed command and removes after it. Each case writes a
// start file into a temporary workspace and calls the check's own function. The suites run with
// recording off, so the check reads `pending/` by path and never asks whether recording is on.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspace } from "../../../helpers/fixture.mjs";

const { RUN_BOUND_MS, applies, checkTestRun, isTestCommand, testRuns } = await import("../../../../src/scripts/checks/test-run.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const NOW = Date.parse("2026-10-01T12:00:00Z");
const reading = (script, group, action, args, repo = "spn-x") => ({ script, group, subgroup: null, action, args, repo });
const APPS_TEST = reading("spnutils", "apps", "test", "contract r1 api");

/** A workspace holding one start file, written `ageMs` before NOW. */
function withRun(name, found, ageMs = 120_000, files = {}) {
  const root = workspace(name, { "spn-x/README.md": "x\n", "spn-y/README.md": "y\n", ...files });
  const pending = join(root, ".spndevex", ".debug", "telemetry", "pending");
  mkdirSync(pending, { recursive: true });
  writeFileSync(join(pending, "toolu_run.json"), JSON.stringify({ at: NOW - ageMs, background: false, found }), "utf8");
  return root;
}
const edit = (root, path) => ({ tool_name: "Edit", cwd: root, tool_input: { file_path: join(root, path), old_string: "a", new_string: "b" } });
const verdictOf = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== a source edit waits while a test run for that repository is going");
{
  const root = withRun("test-run-bad", [APPS_TEST]);
  const refused = checkTestRun(edit(root, "spn-x/apps/api/src/a.ts"), NOW);
  ok("[MKT.HOOKS.31] an Edit under src is refused while `spnutils apps test` runs for that repository",
    verdictOf(refused) === "deny", JSON.stringify(refused));
  ok("[MKT.HOOKS.31] the refusal names the run", (refused?.deny ?? "").includes("spnutils apps test contract r1 api"), refused?.deny);
  ok("[MKT.HOOKS.31] and how long ago it started", (refused?.deny ?? "").includes("2 min ago"), refused?.deny);
  ok("[MKT.HOOKS.31] and the repository", (refused?.deny ?? "").includes("`spn-x`"), refused?.deny);
  ok("[MKT.HOOKS.31] and the start file it knows the run by, with the age at which one stops counting",
    (refused?.deny ?? "").includes(".spndevex/.debug/telemetry/pending/toolu_run.json") && (refused?.deny ?? "").includes("10 minutes"), refused?.deny);
  ok("[MKT.HOOKS.31] an Edit under tests is refused too",
    verdictOf(checkTestRun(edit(root, "spn-x/apps/api/tests/unit/a.spec.ts"), NOW)) === "deny");
  ok("[MKT.HOOKS.31] a Write of a new file under src is refused",
    verdictOf(checkTestRun({ tool_name: "Write", cwd: root, tool_input: { file_path: join(root, "spn-x/packages/p/src/new.ts"), content: "x" } }, NOW)) === "deny");
  ok("[MKT.HOOKS.31] a path given from the call's own folder is read from that folder",
    verdictOf(checkTestRun({ tool_name: "Edit", cwd: join(root, "spn-x"), tool_input: { file_path: "apps/api/src/a.ts", old_string: "a", new_string: "b" } }, NOW)) === "deny");
  ok("[MKT.HOOKS.31] a Bash command is judged by the paths it writes",
    verdictOf(checkTestRun({ tool_name: "Bash", cwd: root, tool_input: { command: "sed -i '' 's/a/b/' spn-x/apps/api/src/a.ts" } }, NOW)) === "deny");
  ok("[MKT.HOOKS.31] and so is a redirect into src",
    verdictOf(checkTestRun({ tool_name: "Bash", cwd: root, tool_input: { command: "echo x > spn-x/apps/api/src/a.ts" } }, NOW)) === "deny");
}

console.log("\n=== what the guard leaves alone");
{
  const root = withRun("test-run-untouched", [APPS_TEST]);
  ok("[MKT.HOOKS.32] an edit of a document in the same repository gets no verdict",
    checkTestRun(edit(root, "spn-x/docs/a.md"), NOW) === null);
  ok("[MKT.HOOKS.32] an edit under src in another repository gets no verdict",
    checkTestRun(edit(root, "spn-y/src/a.ts"), NOW) === null);
  ok("[MKT.HOOKS.32] a file whose name only holds the word is not under src",
    checkTestRun(edit(root, "spn-x/docs/src-layout.md"), NOW) === null);
  ok("[MKT.HOOKS.32] a Bash command that writes nothing gets no verdict",
    checkTestRun({ tool_name: "Bash", cwd: root, tool_input: { command: "cat spn-x/apps/api/src/a.ts" } }, NOW) === null);
  ok("[MKT.HOOKS.32] a Bash command that writes a document gets no verdict",
    checkTestRun({ tool_name: "Bash", cwd: root, tool_input: { command: "echo x > spn-x/docs/a.md" } }, NOW) === null);

  const git = withRun("test-run-git", [reading("git", null, "status", null)]);
  ok("[MKT.HOOKS.32] a start file for `git status` in that repository is not a test run",
    checkTestRun(edit(git, "spn-x/apps/api/src/a.ts"), NOW) === null);

  const stale = withRun("test-run-stale", [APPS_TEST], RUN_BOUND_MS + 1_000);
  ok("[MKT.HOOKS.32] a start file older than 600,000 ms is not read as a run",
    RUN_BOUND_MS === 600_000 && checkTestRun(edit(stale, "spn-x/apps/api/src/a.ts"), NOW) === null);
  const fresh = withRun("test-run-inside-bound", [APPS_TEST], RUN_BOUND_MS - 1_000);
  ok("[MKT.HOOKS.31] known-bad: the same start file just inside the bound still refuses",
    verdictOf(checkTestRun(edit(fresh, "spn-x/apps/api/src/a.ts"), NOW)) === "deny");

  const none = workspace("test-run-no-pending", { "spn-x/README.md": "x\n" });
  ok("[MKT.HOOKS.32] with no pending/ folder at all there is no verdict",
    checkTestRun(edit(none, "spn-x/apps/api/src/a.ts"), NOW) === null);

  const broken = withRun("test-run-unreadable", [APPS_TEST]);
  writeFileSync(join(broken, ".spndevex", ".debug", "telemetry", "pending", "toolu_run.json"), "{ not json", "utf8");
  ok("[MKT.HOOKS.32] a start file that cannot be read is not a run, and nothing throws",
    checkTestRun(edit(broken, "spn-x/apps/api/src/a.ts"), NOW) === null);
  ok("[MKT.HOOKS.32] a payload with no path and no command gets no verdict", checkTestRun({ cwd: root }, NOW) === null);
}

console.log("\n=== which commands are a test run, and which repository each is for");
{
  for (const [what, found, expected] of [
    ["`spnutils apps test`", reading("spnutils", "apps", "test", "unit api"), true],
    ["`spnutils infra test`", reading("spnutils", "infra", "test", "dmo"), true],
    ["`nx test <project>`", reading("nx", null, "test", "api"), true],
    ["`nx run-many -t test`", reading("nx", null, "run-many", "-t test"), true],
    ["`nx run-many --target=test`", reading("nx", null, "run-many", "--target=test --all"), true],
    ["`nx run-many -t lint,test`", reading("nx", null, "run-many", "-t lint,test"), true],
    ["`nx run-many -t lint`", reading("nx", null, "run-many", "-t lint"), false],
    ["`nx build`", reading("nx", null, "build", "api"), false],
    ["`spnutils apps check`", reading("spnutils", "apps", "check", "api"), false],
    ["`spnutils repo agent-sync`", reading("spnutils", "repo", "agent-sync", null), false],
    ["`git status`", reading("git", null, "status", null), false],
  ]) ok(`[MKT.HOOKS.${expected ? "31" : "32"}] ${what} ${expected ? "is" : "is not"} a test command`, isTestCommand(found) === expected);

  const two = withRun("test-run-two", [reading("git", null, "status", null, "spn-y"), reading("nx", null, "test", "api", "spn-y")]);
  const runs = testRuns(two, NOW);
  ok("[MKT.HOOKS.31] a compound command is read for the test command inside it, with its repository",
    runs.length === 1 && runs[0].repo === "spn-y" && runs[0].command === "nx test api", JSON.stringify(runs));
  ok("[MKT.HOOKS.31] so an edit in that repository is refused", verdictOf(checkTestRun(edit(two, "spn-y/src/a.ts"), NOW)) === "deny");
  ok("[MKT.HOOKS.32] and one in the other repository is not", checkTestRun(edit(two, "spn-x/apps/api/src/a.ts"), NOW) === null);

  ok("[MKT.HOOKS.32] the dispatcher's fast path: a path outside src and tests does not apply", applies("/w/spn-x/docs/a.md", "") === false);
  ok("[MKT.HOOKS.31] a path under src applies, and so does a command that names src or tests",
    applies("/w/spn-x/apps/api/src/a.ts", "") && applies("", "echo x > apps/api/src/a.ts") && applies("", "cd tests && touch a"));
  ok("[MKT.HOOKS.32] a command that names neither folder does not apply", applies("", "git status --short") === false && applies("", "ls srcs testsuite") === false);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — test-run` : `\n  all ${total} passed — test-run`);
process.exit(failed ? 1 : 0);
