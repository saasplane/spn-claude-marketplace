// `checks/commit-staged.ts` (MKT.HOOKS.383) — a commit that carries a construct seat without its produced page is
// refused, naming `docs page write`; a check committed while the book file it reads is left out is noted.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, checkCommitStaged } = await import(join(CHECKS, "commit-staged.ts"));
const { producedPageOf } = await import("../../../../../plugin-support-lib/src/lib/docs-tree.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  [MKT.HOOKS.383] ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  [MKT.HOOKS.383] ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};

const BASE = realpathSync(mkdtempSync(join(tmpdir(), "spn-devex-commit-staged-")));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const git = (repo, ...args) => execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" });
const put = (repo, rel, text) => { const file = join(repo, rel); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); return file; };
const repo = (name) => { const dir = join(BASE, name); execFileSync("git", ["init", "-q", "-b", "feat/x", dir]); put(dir, "README.md", "x\n"); git(dir, "add", "README.md"); git(dir, "commit", "-q", "-m", "base"); return dir; };
const commit = (cwd, command = "git commit -m x") => ({ tool_name: "Bash", cwd, tool_input: { command } });
const kind = (verdict) => (verdict?.deny ? "deny" : verdict?.note ? "note" : "silent");

console.log("=== a construct seat without its page");
{
  const dir = repo("seat");
  const seat = put(dir, "docs/02-constructs/01-core/01-thing.md", "# Thing\n");
  const page = producedPageOf(seat);
  git(dir, "add", seat);
  const refused = checkCommitStaged(commit(dir));
  ok("a staged seat with no page is refused, naming docs page write", kind(refused) === "deny" && refused.deny.includes("docs page write"), JSON.stringify(refused));
  ok("the refusal names the page", kind(refused) === "deny" && refused.deny.includes(page), JSON.stringify(refused));
  const named = checkCommitStaged(commit(dir, `git commit -m x -- ${seat}`));
  ok("a commit naming the seat alone is refused too", kind(named) === "deny", JSON.stringify(named));
  put(dir, page.slice(dir.length + 1), "<html></html>");
  git(dir, "add", page);
  ok("the seat and its page together pass", kind(checkCommitStaged(commit(dir))) === "silent");
}

console.log("\n=== a check committed without its data file");
{
  const dir = repo("data");
  const script = put(dir, "src/scripts/checks/reader.ts", 'readFileSync("docs/words.md");\n');
  const data = put(dir, "docs/words.md", "w\n");
  git(dir, "add", script);
  const told = checkCommitStaged(commit(dir));
  ok("a staged check whose data file is left out is noted", kind(told) === "note" && told.note.includes("words.md"), JSON.stringify(told));
  git(dir, "add", data);
  ok("with the data file staged it passes", kind(checkCommitStaged(commit(dir))) === "silent");
}

console.log("\n=== calls it leaves alone");
{
  const dir = repo("plain");
  put(dir, "a.txt", "a\n"); git(dir, "add", "a.txt");
  ok("an ordinary commit passes", kind(checkCommitStaged(commit(dir))) === "silent");
  ok("a call that is not a commit is not read", applies("", "git status") === false);
  ok("a tool that is not Bash is not read", kind(checkCommitStaged({ tool_name: "Write", tool_input: { command: "git commit" } })) === "silent");
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — commit staged` : `\n  all ${total} passed — commit staged`);
process.exit(failed ? 1 : 0);
