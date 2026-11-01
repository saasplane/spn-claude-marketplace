#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.204 — a construct page is regenerated in the commit of the book
// change that moves it, and a book file a check reads as data lands with the code that reads it.
//
// Refuses a `git commit` that carries a construct seat file without its produced page, and notes a check
// that is committed while a book file it names is changed but not committed. Its fast path is one regular
// expression over the command; past it, one `git diff --cached`.
//
//   called by: events/pretooluse.ts, on a Bash call

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { isSeatFile, producedPageOf } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { readCommits } from "../lib/command-reader.ts";

/** Whether a command could be a `git commit`. */
export function applies(_path: string, command: string): boolean {
  return /\bgit\b[^|;&\n]*\bcommit\b/.test(command);
}

function git(dir: string, args: string[]): string[] {
  try {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch { return []; }
}

/** The absolute paths a commit would carry: what it names after `--`, else the index, and with `-a` every tracked change. */
function committed(dir: string, pathspecs: string[], all: boolean): Set<string> {
  const top = git(dir, ["rev-parse", "--show-toplevel"])[0];
  if (!top) return new Set();
  const found = pathspecs.length ? pathspecs.map((one) => resolve(dir, one)) : git(dir, ["diff", "--cached", "--name-only"]).map((one) => resolve(top, one));
  if (all && !pathspecs.length) found.push(...git(dir, ["diff", "--name-only"]).map((one) => resolve(top, one)));
  return new Set(found);
}

/** Book files named in a check's text that are changed in the working tree. */
function unstagedData(dir: string, text: string, carried: Set<string>): string[] {
  const top = git(dir, ["rev-parse", "--show-toplevel"])[0] ?? dir;
  const loose = [...git(dir, ["diff", "--name-only"]), ...git(dir, ["ls-files", "--others", "--exclude-standard"])]
    .map((one) => resolve(top, one))
    .filter((one) => /\.(?:md|json|jsonl)$/.test(one) && !carried.has(one));
  return loose.filter((one) => text.includes(basename(one))).map((one) => basename(one));
}

export function refusal(command: string, cwd: string): Verdict {
  const note: string[] = [];
  for (const call of readCommits(command, cwd)) {
    const carried = committed(call.dir, call.pathspecs, call.all);
    for (const file of carried) {
      if (isSeatFile(file)) {
        const page = resolve(producedPageOf(file));
        if (!carried.has(page))
          return { deny: `Denied: \`${basename(file)}\` is committed without its construct page. Regenerate it in the same commit: ` +
            `\`spn-devex docs page write ${file}\`, then add \`${page}\` to this commit (RULE.DEVEX.WORKSPACE.204). ` +
            `If \`docs page check\` says the page is already current, name it on the commit all the same.` };
      } else if (/\/checks?\/[^/]+\.(?:ts|mjs)$/.test(file)) {
        let text = "";
        try { text = readFileSync(file, "utf8"); } catch { continue; }
        const left = unstagedData(call.dir, text, carried);
        if (left.length) note.push(`${basename(file)} reads ${left.join(", ")}, which is changed but not in this commit`);
      }
    }
  }
  return note.length ? { note: `A check that reads a book file as data lands with that file in one commit: ${note.join("; ")}. Add the data file by path to this commit.` } : null;
}

export function checkCommitStaged(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  return refusal(command, payload.cwd ?? process.cwd());
}

if (runAlone("commit-staged.ts")) {
  try { emit(checkCommitStaged(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
