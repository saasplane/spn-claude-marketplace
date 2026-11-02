#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.314 and RULE.DEVEX.WORKSPACE.213, which say a window commits
// its own files by path and never touches a peer's work, and that the workspace's `.spndevex` is committed
// locally and never pushed. The chapters are the source of truth; a rule change is edited there first, then here.
//
// THE COMMAND IS READ WITH ITS QUOTED STRINGS, `$( ... )` BODIES AND HEREDOC BODIES TAKEN OUT, and only a `git` that is the first word of
// a part counts: a `-m` message of several lines, or one holding `;`, `|` or `&`, cuts nothing before the `--` that names the paths, and
// the words `git commit` inside a `grep` or `echo` argument are not a commit.
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

import { execFileSync } from "node:child_process";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

/** A `git` word and the subcommand that follows it, past the options git takes before it. */
const GIT = String.raw`\bgit\b(?:\s+-C\s+(?:"[^"]*"|'[^']*'|\S+))?`;

/** A `git` that is the first word of a part, past any `NAME=value` words before it. */
const FIRST = String.raw`^(?:\w+=\S*\s+)*`;
const ADD_ALL = new RegExp(`${FIRST}${GIT}\\s+add\\s+(?:\\S+\\s+)*?(?:-A|--all|\\.)(?=\\s|$)`);
const STASH = new RegExp(`${FIRST}${GIT}\\s+stash\\b`);
const COMMIT = new RegExp(`${FIRST}${GIT}\\s+commit\\b(.*)$`);
const ANY = new RegExp(`${GIT}\\s+(?:add|stash|commit|push|remote)\\b`);
const REMOTE_OUT = new RegExp(`${FIRST}${GIT}\\s+(?:push|remote\\s+add)\\b`);

/**
 * The command with what is not a command taken out: each quoted string becomes an empty pair of quotes, each `$( ... )` body becomes
 * `$()`, each backtick body becomes an empty pair, and each heredoc body is dropped. What is left is the command's own words, so a
 * `;`, `|` or `&` inside a message cuts nothing, and a path after `--` stays a word.
 *
 * @param inBody  scanning inside a `$( ... )`: stop at the `)` that closes it
 */
function scan(text: string, from: number, inBody: boolean): { out: string; end: number } {
  let out = "";
  let depth = 0;
  const pending: string[] = [];
  let at = from;
  while (at < text.length) {
    const c = text[at];
    if (c === "\\") { out += text.slice(at, at + 2); at += 2; continue; }
    if (c === "'") { const close = text.indexOf("'", at + 1); out += "''"; at = close < 0 ? text.length : close + 1; continue; }
    if (c === '"') {
      at += 1;
      while (at < text.length && text[at] !== '"') {
        if (text[at] === "\\") at += 2;
        else if (text[at] === "$" && text[at + 1] === "(") at = scan(text, at + 2, true).end;
        else at += 1;
      }
      out += '""'; at += 1; continue;
    }
    if (c === "`") { const close = text.indexOf("`", at + 1); out += "``"; at = close < 0 ? text.length : close + 1; continue; }
    if (c === "$" && text[at + 1] === "(") { out += "$()"; at = scan(text, at + 2, true).end; continue; }
    if (c === "<" && text[at + 1] === "<" && text[at + 2] !== "<") {
      const word = /^<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z0-9_]+))/.exec(text.slice(at));
      if (word) { pending.push(word[1] ?? word[2] ?? word[3]); out += "<<"; at += word[0].length; continue; }
    }
    if (c === "\n" && pending.length) {
      out += "\n"; at += 1;
      for (const delimiter of pending.splice(0)) {
        while (at < text.length) {
          const stop = text.indexOf("\n", at);
          const line = text.slice(at, stop < 0 ? text.length : stop);
          at = stop < 0 ? text.length : stop + 1;
          if (line.trim() === delimiter) break;
        }
      }
      continue;
    }
    if (inBody) {
      if (c === "(") depth += 1;
      else if (c === ")") { if (depth === 0) return { out, end: at + 1 }; depth -= 1; }
    }
    out += c; at += 1;
  }
  return { out, end: text.length };
}

/** The parts of a command, each with its quoted strings, bodies and heredocs taken out, cut at `;`, `|`, `&` and line breaks. */
function partsOf(command: string): string[] {
  return scan(command, 0, false).out.split(/[;|&\n]/).map((part) => part.trim()).filter(Boolean);
}

/** Whether a command could be one of these: a regular expression over the text, so every other call pays that and stops. */
export function applies(_path: string, command: string): boolean {
  return ANY.test(command);
}

/** Whether a `git commit` names its files after `--`, or takes the index it is given. `-m "…"` alone commits what is staged. */
function commitNamesPaths(rest: string): boolean {
  return /\s--\s+\S/.test(rest) || /(?:^|\s)-\w*o\b/.test(rest);
}

/** The paths the index deletes against HEAD, when it holds deletions only; null where it holds any other change, none, or cannot be read. */
function stagedDeletions(cwd: string): string[] | null {
  try {
    const rows = execFileSync("git", ["diff", "--cached", "--name-status", "--no-renames", "-z", "HEAD"], { cwd: cwd || undefined, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).split("\0").filter(Boolean);
    const paths: string[] = [];
    for (let i = 0; i + 1 < rows.length; i += 2) { if (rows[i] !== "D") return null; paths.push(rows[i + 1]); }
    return paths.length ? paths : null;
  } catch { return null; }
}

/** Whether a pathless commit takes only staged deletions and the command names every one of them: the case-only rename of a file on a case-insensitive disk, where `git commit -- Old.ts` finds `OLD.ts` and skips the staged deletion. */
function namesEveryDeletion(command: string, cwd: string): boolean {
  const deleted = stagedDeletions(cwd);
  if (!deleted) return false;
  const words = new Set(command.split(/\s+/).map((word) => word.replace(/^["']|["']$/g, "")));
  return deleted.every((path) => words.has(path));
}

/** The refusal for a command, or null. */
export function refusal(command: string, cwd: string): string | null {
  const parts = partsOf(command);
  if (parts.some((part) => ADD_ALL.test(part)))
    return "`git add -A` and `git add .` stage every file in the checkout, including a peer window's. Name your own files: `git add <path> …`, or commit them with `git commit -m \"…\" -- <path> …` (RULE.DEVEX.WORKSPACE.314).";
  if (parts.some((part) => STASH.test(part)))
    return "`git stash` sets aside the whole checkout, including a peer window's unfinished work. Commit your own files by path instead (RULE.DEVEX.WORKSPACE.314).";
  const commits = parts.map((part) => COMMIT.exec(part)).filter((found): found is RegExpExecArray => found !== null);
  if (commits.some((found) => !commitNamesPaths(found[1])) && !namesEveryDeletion(command, cwd))
    return "A `git commit` with no path commits whatever is staged, and a peer window may have staged it. Name your files on the commit itself: `git commit -m \"…\" -- <path> …` (RULE.DEVEX.WORKSPACE.314).";
  if (parts.some((part) => REMOTE_OUT.test(part)) && /(?:^|[\s"'\\/])\.spndevex(?:[\s"'\\/]|$)/.test(`${cwd} ${command}`))
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
