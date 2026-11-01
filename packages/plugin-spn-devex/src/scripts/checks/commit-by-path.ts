#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.314 and RULE.DEVEX.WORKSPACE.213, which say a window commits
// its own files by path and never touches a peer's work, and that the workspace's `.spndevex` is committed
// locally and never pushed. The chapters are the source of truth; a rule change is edited there first, then here.
//
// Refuses the four commands that commit or carry more than the window's own files: `git add -A`,
// `git add .`, a `git commit` with no path after it, and `git stash`. It also refuses `git push` and
// `git remote add` when the command runs inside `.spndevex`, which has no remote.
//
// A REFUSAL, BECAUSE EACH OF THESE CANNOT BE TAKEN BACK BY THE WINDOW THAT RUNS IT. A peer window's files
// swept into a commit, or its work stashed away, are lost to that window without a word. Its fast path is
// one regular expression over the command, so every call that is not one of these pays that and stops.
//
//   called by: events/pretooluse.ts, on a Bash call

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

/** A `git` word and the subcommand that follows it, past the options git takes before it. */
const GIT = String.raw`\bgit\b(?:\s+-C\s+(?:"[^"]*"|'[^']*'|\S+))?`;

const ADD_ALL = new RegExp(`${GIT}\\s+add\\s+(?:[^|;&\\n]*\\s)?(?:-A|--all|\\.)(?=\\s|$)`);
const STASH = new RegExp(`${GIT}\\s+stash\\b`);
const COMMIT = new RegExp(`${GIT}\\s+commit\\b([^|;&\\n]*)`);
const ANY = new RegExp(`${GIT}\\s+(?:add|stash|commit|push|remote)\\b`);
const REMOTE_OUT = new RegExp(`${GIT}\\s+(?:push|remote\\s+add)\\b`);

/** Whether a command could be one of these: a regular expression over the text, so every other call pays that and stops. */
export function applies(_path: string, command: string): boolean {
  return ANY.test(command);
}

/** Whether a `git commit` names its files after `--`, or takes the index it is given. `-m "…"` alone commits what is staged. */
function commitNamesPaths(rest: string): boolean {
  return /\s--\s+\S/.test(rest) || /(?:^|\s)-\w*o\b/.test(rest);
}

/** The refusal for a command, or null. */
export function refusal(command: string, cwd: string): string | null {
  if (ADD_ALL.test(command))
    return "`git add -A` and `git add .` stage every file in the checkout, including a peer window's. Name your own files: `git add <path> …`, or commit them with `git commit -m \"…\" -- <path> …` (RULE.DEVEX.WORKSPACE.314).";
  if (STASH.test(command))
    return "`git stash` sets aside the whole checkout, including a peer window's unfinished work. Commit your own files by path instead (RULE.DEVEX.WORKSPACE.314).";
  const commit = COMMIT.exec(command);
  if (commit && !commitNamesPaths(commit[1]))
    return "A `git commit` with no path commits whatever is staged, and a peer window may have staged it. Name your files on the commit itself: `git commit -m \"…\" -- <path> …` (RULE.DEVEX.WORKSPACE.314).";
  if (REMOTE_OUT.test(command) && /(?:^|[\s"'\\/])\.spndevex(?:[\s"'\\/]|$)/.test(`${cwd} ${command}`))
    return "`.spndevex` is local git: commit there by path, and never add a remote to it or push it (RULE.DEVEX.WORKSPACE.213).";
  return null;
}

export function checkCommitByPath(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  const why = refusal(command, payload.cwd ?? "");
  return why ? { deny: `Denied: ${why}` } : null;
}

if (runAlone("commit-by-path.ts")) {
  try { emit(checkCommitByPath(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
