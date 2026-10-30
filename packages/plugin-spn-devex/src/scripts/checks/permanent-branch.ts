#!/usr/bin/env node
// RESTATES: spn-foundation 02-scm.md — work reaches develop, qa, uat and main only by a pull request.
//
// Refuses a `git commit` on a permanent branch of a SaaS Plane repository, one whose root holds `sprepo.json`.
// Every other repository is ignored, the workspace's own .spndevex among them: it has no remote and only main.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { readCommits } from "../lib/command-reader.ts";

/** The branches work reaches only through a pull request. */
export const PERMANENT_BRANCHES = ["develop", "qa", "uat", "main"];

/** Whether a command could be a `git commit`: a regular expression over the text, so every other call pays that and stops. */
export function applies(_path: string, command: string): boolean {
  return /\bgit\b[^|;&\n]*\bcommit\b/.test(command);
}

/** The branch a folder's checkout is on, or "" for a detached HEAD or a folder git does not know. */
function currentBranch(dir: string): string {
  try {
    return execFileSync("git", ["-C", dir, "branch", "--show-current"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { return ""; }
}

/** Whether a folder sits in a SaaS Plane repository: the root of its git checkout holds `sprepo.json`. */
export function isSaasPlaneRepository(dir: string): boolean {
  try {
    const root = execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return Boolean(root) && existsSync(join(root, "sprepo.json"));
  } catch { return false; }
}

export function checkPermanentBranch(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (!applies("", command)) return null;
  for (const call of readCommits(command, payload.cwd ?? process.cwd())) {
    if (!isSaasPlaneRepository(call.dir)) continue;
    const branch = currentBranch(call.dir);
    if (!PERMANENT_BRANCHES.includes(branch)) continue;
    return {
      deny:
        `Denied: this commit is on \`${branch}\`, a permanent branch. Work reaches develop, qa, uat and main only by a pull request.\n` +
        `Commit on the workstream's branch, in its worktree set: \`feat/<NNN>-<subject>\`.`,
    };
  }
  return null;
}

if (runAlone("permanent-branch.ts")) {
  try { emit(checkPermanentBranch(readPayload())); } catch { /* when unsure, allow */ }
  process.exit(0);
}
