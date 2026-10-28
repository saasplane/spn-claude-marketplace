#!/usr/bin/env node
// Advice, not a rule from the book: after a `git rebase`, `git merge` or `git pull` that names `develop`,
// say what moved under the branch: the files `develop` changed that the branch also changed, and the facts
// this window's open arcs pinned whose source has moved (`plan stale` reads them the same way).
// A note for the agent alone (`additionalContext`), never a refusal, and silent where the window has no
// workstream, no arcs or no pinned facts.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { arcIdsOf, notesDirOf } from "../lib/workstream.ts";
import { windowSet } from "../lib/window.ts";
import { factPinsOf, movedFiles } from "../commands/plan/stale.ts";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

// `git rebase develop`, `git merge origin/develop`, `git pull --rebase origin develop`, `git -C dir rebase develop`.
const TAKES_IN = /\bgit\s+(?:-C\s+(?:'[^']*'|"[^"]*"|\S+)\s+)?(?:rebase|merge|pull)\b[^;&|\n]*\bdevelop\b/;
const CD_PREFIX = /^\s*cd\s+('[^']*'|"[^"]*"|[^\s;&|]+)\s*&&\s*/;

/** Whether the command could be a branch taking `develop` in: a `Bash` call only, read from its text alone. */
export function applies(_path: string, command: string): boolean {
  return TAKES_IN.test(command);
}

/** Where the command ran: the payload's directory, moved by a leading `cd <dir> &&`. */
export function ranIn(payload: Payload, command: string): string {
  const base = payload.cwd ?? process.cwd();
  const dir = CD_PREFIX.exec(command)?.[1]?.replace(/^['"]|['"]$/g, "");
  return dir ? resolve(base, dir) : base;
}

function git(cwd: string, args: string[]): string | null {
  try { return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return null; }
}

const lines = (text: string | null): string[] => (text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);

/**
 * The files `develop` changed since the branch's old merge base that the branch also changed. The old tip
 * is `ORIG_HEAD`, which git sets before a rebase, merge or pull moves the branch; the old merge base is
 * where that tip met `develop`. Empty where git cannot say.
 */
export function overlap(cwd: string): string[] {
  const dev = ["origin/develop", "develop"].find((ref) => git(cwd, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]));
  if (!dev || !git(cwd, ["rev-parse", "--verify", "--quiet", "ORIG_HEAD^{commit}"])) return [];
  const base = git(cwd, ["merge-base", "ORIG_HEAD", dev]);
  if (!base) return [];
  const theirs = new Set(lines(git(cwd, ["diff", "--name-only", base, dev])));
  return lines(git(cwd, ["diff", "--name-only", base, "ORIG_HEAD"])).filter((file) => theirs.has(file)).sort();
}

/** The open workstream folders of this window. */
function windowFolders(root: string, session: string): string[] {
  const mine = windowSet(root, session);
  if (!mine.size) return [];
  const dir = workstreamsDir(root, "open");
  try { return readdirSync(dir).filter((name) => mine.has(name)).map((name) => join(dir, name)).filter((p) => statSync(p).isDirectory()); }
  catch { return []; }
}

/** The pinned facts of this window's open arcs, and the ones whose source has moved since they were pinned. */
export function pinnedFacts(root: string, session: string): { pinned: number; stale: string[] } {
  let pinned = 0;
  const stale: string[] = [];
  for (const ws of windowFolders(root, session)) {
    for (const arc of arcIdsOf(ws)) {
      // The same reading `plan stale` gives a plan at `notes/N<nnn>/plan.md`: the arc's `facts.jsonl`.
      for (const fact of factPinsOf(join(notesDirOf(ws, arc), "plan.md"))) {
        pinned += 1;
        const moved = movedFiles(join(root, fact.repo), fact.commit, fact.paths);
        if (moved.length) stale.push(`${arc} ${fact.id}: \`${fact.repo}/${fact.paths[0]}\` moved since ${fact.commit}`);
      }
    }
  }
  return { pinned, stale };
}

export function checkRebaseMoved(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  const cwd = ranIn(payload, command);
  const root = workspaceRoot(cwd);
  if (!root || !payload.session_id) return null;
  const { pinned, stale } = pinnedFacts(root, payload.session_id);
  if (!pinned) return null;
  const both = overlap(cwd);
  if (!both.length && !stale.length) return null;
  const parts = [
    ...(both.length ? [`Files \`develop\` changed since this branch's old merge base that the branch also changed: ${both.join(", ")}.`] : []),
    ...(stale.length ? [`Facts pinned by this window's open arcs whose source has moved (\`plan stale\`): ${stale.join("; ")}.`] : []),
  ];
  return { note: `The branch took \`develop\` in. ${parts.join(" ")} Read each against the work in hand before going on; this is a note, nothing is refused.` };
}

