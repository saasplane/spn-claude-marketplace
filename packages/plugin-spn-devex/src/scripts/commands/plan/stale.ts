// A working tool, not a restatement of the book: whether the facts a plan pinned are still true.
//
//     spn-devex plan stale <plan.md>
//
// Reads the plan's `## Pins` table — columns Repo, Commit, Paths read, the paths given in backticks
// and separated by ` · ` — resolves each repository as a sibling of the workspace root, and for each
// one runs `git log --name-only` from the pinned commit to `HEAD` over the pinned paths, plus
// `git status --short` over the same paths for what the working tree holds uncommitted. One line per
// repository: `nothing moved`, or the files that did.
//
// AN ACTION OF NO SUBJECT, AND IT NEVER REFUSES. A plan going stale is something to read and act on,
// not something this can judge, so the exit code is 0 whether anything moved or not. It never runs
// `spnutils`, because a plugin script never does.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REQUIRED, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workspaceRoot } from "../../lib/payload.ts";

export type Pin = { repo: string; commit: string; paths: string[] };

/**
 * The plan's `## Pins` table, read as rows: the repository named in the first cell, the commit read
 * from the first backtick-quoted token of the second (or the cell itself, where it carries none),
 * and the paths read from every backtick-quoted token of the third. A plan with no such section, or
 * whose table holds no data row, gives nothing.
 */
export function pinsOf(text: string): Pin[] {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => /^##\s+Pins\s*$/.test(line.trim()));
  if (at < 0) return [];
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i += 1) {
    if (/^##\s+\S/.test(lines[i])) { end = i; break; }
  }
  const rows = lines.slice(at + 1, end).filter((line) => line.trim().startsWith("|")).slice(2);
  return rows
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .map((cells) => ({
      repo: cells[0].replace(/`/g, "").trim(),
      commit: /`([^`]+)`/.exec(cells[1])?.[1] ?? cells[1],
      paths: [...cells[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    }))
    .filter((pin) => pin.repo && pin.commit);
}

/** One `git` call in `repo`, or "" where the repository, the commit or the paths do not resolve. */
function git(repo: string, args: string[]): string {
  try { return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return ""; }
}

/**
 * Every file under `paths` that moved in `repo` since `commit`: committed between `commit` and
 * `HEAD`, or sitting uncommitted in the working tree right now. Sorted, with no path repeated.
 */
export function movedFiles(repo: string, commit: string, paths: string[]): string[] {
  const moved = new Set<string>();
  for (const line of git(repo, ["log", "--name-only", "--format=", `${commit}..HEAD`, "--", ...paths]).split("\n"))
    if (line.trim()) moved.add(line.trim());
  for (const line of git(repo, ["status", "--short", "--", ...paths]).split("\n")) {
    const name = line.slice(3).trim();
    if (name) moved.add(name);
  }
  return [...moved].sort();
}

export const describe = "whether a plan's pinned facts have moved since the commit it read them at";

export const usage = "<plan.md>";

export function run(args: string[]): number {
  const plan = onePath(scopeOf(readWords(args).paths, REQUIRED));
  const pins = pinsOf(readFileSync(plan, "utf8"));
  if (!pins.length) { console.log("no `## Pins` table in this plan — nothing to check"); return 0; }
  const workspace = workspaceRoot(dirname(plan)) ?? workspaceRoot(process.cwd());
  for (const pin of pins) {
    const repo = workspace ? join(workspace, pin.repo) : pin.repo;
    if (!pin.paths.length) { console.log(`${pin.repo}: no paths pinned — nothing to check`); continue; }
    if (!existsSync(join(repo, ".git"))) { console.log(`${pin.repo}: no checkout at ${repo} — skipped`); continue; }
    const moved = movedFiles(repo, pin.commit, pin.paths);
    console.log(moved.length ? `${pin.repo}: ${moved.join(", ")}` : `${pin.repo}: nothing moved`);
  }
  return 0;
}
