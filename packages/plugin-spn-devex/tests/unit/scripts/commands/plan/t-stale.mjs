import { PLUGIN } from "../../../../helpers/harness.mjs";
// `commands/plan/stale.ts` — whether a plan's pinned facts have moved since the commit it read them
// at: a plan's `## Pins` table names a repository, a commit and the paths it read, and this reports
// what changed on those paths since, committed or still sitting in the working tree. It never
// refuses — the exit code is 0 whether anything moved or not — and it never runs `spnutils`.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPTS = resolve(PLUGIN, "src", "scripts");
const { movedFiles, pinsOf, run } = await import(join(SCRIPTS, "commands", "plan", "stale.ts"));

const BASE = mkdtempSync(join(tmpdir(), "t-plan-stale-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
function commit(cwd, message) {
  git(["add", "-A"], cwd);
  git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", message], cwd);
  return git(["rev-parse", "HEAD"], cwd);
}

/** A workspace holding one git repository per name, each with an initial commit. */
function withRepos(label, names) {
  const ws = join(BASE, label);
  mkdirSync(join(ws, ".spndevex"), { recursive: true });
  const pinned = {};
  for (const name of names) {
    const dir = join(ws, name);
    mkdirSync(dir, { recursive: true });
    git(["init", "-q"], dir);
    writeFileSync(join(dir, "README.md"), "x\n", "utf8");
    pinned[name] = commit(dir, "initial");
  }
  return { ws, pinned };
}

/** A line of `run`'s own output, captured rather than printed. */
function captured(fn) {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(line);
  try { return { code: fn(), said: lines.join("\n") }; } finally { console.log = original; }
}

console.log("=== plan stale — reading the `## Pins` table");
{
  const text = [
    "# N1 plan", "", "## Pins", "",
    "| Repo | Commit | Paths read |",
    "| --- | --- | --- |",
    "| spn-x | `abc1234` | `src/a.ts` · `docs/` |",
    "| spn-y | `def5678` | `README.md` |",
    "", "## Commands", "", "nothing here names a path",
  ].join("\n");
  const pins = pinsOf(text);
  ok("[MKT.SCRIPTS.176] reads one row per repository", pins.length === 2, JSON.stringify(pins));
  ok("[MKT.SCRIPTS.176] the repo and the commit, with the backticks stripped from the commit",
    pins[0].repo === "spn-x" && pins[0].commit === "abc1234");
  ok("[MKT.SCRIPTS.176] every backtick-quoted path in the third cell, in order",
    pins[0].paths.length === 2 && pins[0].paths[0] === "src/a.ts" && pins[0].paths[1] === "docs/", JSON.stringify(pins[0].paths));
  ok("[MKT.SCRIPTS.176] a second row reads its own commit and path",
    pins[1].repo === "spn-y" && pins[1].commit === "def5678" && pins[1].paths[0] === "README.md");
  ok("[MKT.SCRIPTS.176] the table stops at the next heading — nothing from `## Commands` leaks in", pins.length === 2);
}

console.log("\n=== plan stale — what the dispatcher leaves alone");
{
  ok("[MKT.SCRIPTS.177] a plan with no `## Pins` section gives nothing", pinsOf("# N1 plan\n\nno table here\n").length === 0);
  ok("[MKT.SCRIPTS.177] a `## Pins` section with no data row gives nothing",
    pinsOf("## Pins\n\n| Repo | Commit | Paths read |\n| --- | --- | --- |\n").length === 0);
}

console.log("\n=== plan stale — a repository where nothing moved");
{
  const { ws, pinned } = withRepos("nothing-moved", ["spn-x"]);
  ok("[MKT.SCRIPTS.178] known-bad: a repository with no change since the pin reports nothing moved",
    movedFiles(join(ws, "spn-x"), pinned["spn-x"], ["README.md"]).length === 0);
}

console.log("\n=== plan stale — a repository with a committed change since the pin");
{
  const { ws, pinned } = withRepos("committed-change", ["spn-x"]);
  writeFileSync(join(ws, "spn-x", "src.ts"), "x\n", "utf8");
  commit(join(ws, "spn-x"), "add src.ts");
  const moved = movedFiles(join(ws, "spn-x"), pinned["spn-x"], ["src.ts"]);
  ok("[MKT.SCRIPTS.178] a file committed after the pin is reported as moved", moved.includes("src.ts"), JSON.stringify(moved));
}

console.log("\n=== plan stale — a repository with an uncommitted change on a pinned path");
{
  const { ws, pinned } = withRepos("uncommitted-change", ["spn-x"]);
  writeFileSync(join(ws, "spn-x", "README.md"), "changed\n", "utf8");
  const moved = movedFiles(join(ws, "spn-x"), pinned["spn-x"], ["README.md"]);
  ok("[MKT.SCRIPTS.178] a file sitting uncommitted is reported as moved too, with no commit behind it yet",
    moved.includes("README.md"), JSON.stringify(moved));
}

console.log("\n=== plan stale — `run`, over a plan naming several repositories");
{
  const { ws, pinned } = withRepos("run-many-repos", ["spn-x", "spn-y", "spn-z"]);
  writeFileSync(join(ws, "spn-x", "README.md"), "changed\n", "utf8");          // uncommitted
  writeFileSync(join(ws, "spn-y", "new.md"), "x\n", "utf8");
  commit(join(ws, "spn-y"), "add new.md");                                     // committed
  // spn-z: left exactly as pinned
  const notes = join(ws, ".spndevex", "notes");
  mkdirSync(notes, { recursive: true });
  const plan = join(notes, "plan.md");
  writeFileSync(plan, [
    "## Pins", "", "| Repo | Commit | Paths read |", "| --- | --- | --- |",
    `| spn-x | \`${pinned["spn-x"]}\` | \`README.md\` |`,
    `| spn-y | \`${pinned["spn-y"]}\` | \`new.md\` |`,
    `| spn-z | \`${pinned["spn-z"]}\` | \`README.md\` |`,
  ].join("\n"), "utf8");
  const result = captured(() => run([plan]));
  ok("[MKT.SCRIPTS.178] the run exits 0 even though two repositories moved", result.code === 0, result.said);
  ok("[MKT.SCRIPTS.178] the uncommitted repository names its file", /spn-x: README\.md/.test(result.said), result.said);
  ok("[MKT.SCRIPTS.178] the committed repository names its file", /spn-y: new\.md/.test(result.said), result.said);
  ok("[MKT.SCRIPTS.178] the untouched repository reports nothing moved", /spn-z: nothing moved/.test(result.said), result.said);
}

console.log("\n=== plan stale — through the entry, with the native grammar");
{
  const TOOL = join(SCRIPTS, "cli.ts");
  const { ws, pinned } = withRepos("through-cli", ["spn-x"]);
  const notes = join(ws, ".spndevex", "notes");
  mkdirSync(notes, { recursive: true });
  const plan = join(notes, "plan.md");
  writeFileSync(plan, [
    "## Pins", "", "| Repo | Commit | Paths read |", "| --- | --- | --- |",
    `| spn-x | \`${pinned["spn-x"]}\` | \`README.md\` |`,
  ].join("\n"), "utf8");
  const typed = (...words) => {
    try { return { out: execFileSync("node", [TOOL, "plan", "stale", ...words], { encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
    catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
  };
  const typed1 = typed(plan);
  ok("[MKT.SCRIPTS.179] `plan stale <plan.md>` through the entry exits 0 and reports nothing moved",
    typed1.code === 0 && /spn-x: nothing moved/.test(typed1.out), typed1.out);
  const bare = typed();
  ok("[MKT.SCRIPTS.179] with no path the usage line is printed and a path is owed, with exit 2",
    bare.code === 2 && bare.out.includes("usage: spn-devex plan stale <plan.md>") && bare.out.includes("needs a path."), bare.out);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plan stale` : `\n  all ${total} passed — plan stale`);
process.exit(failed ? 1 : 0);
