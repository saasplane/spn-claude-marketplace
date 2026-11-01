#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The worktree set
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Two refusals about where a command that converges something runs, read from the command's words (a `cd` moves the folder):
// a workspace command or a plugin install run inside `.spndevex/workstreams` (a probe belongs in the scratchpad), and
// `spnutils repo agent-sync` run in a workspace member or a worktree (`spnutils workspace agent-sync` converges them all).
//
//   called by: events/pretooluse.ts, before a Bash call

import { existsSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { segments } from "../lib/command-reader.ts";
import { eventWorkspace, type Payload, type Verdict, emit, readPayload, runAlone } from "../lib/payload.ts";
import { DEVEX, DEVEX_WORKSTREAMS, WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** One command of a shell line, with the folder it runs in: the words after any `VAR=value`, and the `cd`s before it. */
export type Run = { words: string[]; dir: string };

/** The commands a line runs, each with the folder a `cd` before it moved to. */
export function runsOf(command: string, cwd: string): Run[] {
  const out: Run[] = [];
  let dir = cwd;
  for (const words of segments(command)) {
    let at = 0;
    while (at < words.length && ASSIGNMENT.test(words[at])) at += 1;
    if (words[at] === "cd" && words[at + 1]) { dir = resolve(dir, words[at + 1]); continue; }
    if (at < words.length) out.push({ words: words.slice(at), dir });
  }
  return out;
}

/** Whether a run is `spnutils <group> <action>`. */
const isSpnutils = (run: Run, group: string, actions: readonly string[]): boolean =>
  basename(run.words[0] ?? "") === "spnutils" && run.words[1] === group && actions.includes(run.words[2] ?? "");

/** Whether a run installs or updates a plugin, through the CLI or through spnutils. */
const installsPlugin = (run: Run): boolean => {
  const head = basename(run.words[0] ?? "");
  if (head !== "claude" && head !== "spnutils") return false;
  const at = run.words.findIndex((word) => word === "plugin" || word === "plugins");
  return at > 0 && ["install", "update"].includes(run.words[at + 1] ?? "");
};

/** Whether a folder is inside a workspace's `.spndevex/workstreams`. */
export const inWorkstreams = (dir: string): boolean => {
  const parts = resolve(dir).split(sep);
  const at = parts.indexOf(DEVEX);
  return at >= 0 && parts[at + 1] === WORKSTREAMS;
};

/** Whether a command could be either: one pattern over the text, so every other call pays that and stops. */
export function applies(_path: string, command: string): boolean {
  return /\b(?:init|agent-sync|install|update)\b/.test(command);
}

/** THE PROBE'S PLACE IS THE SCRATCHPAD: a workspace command in a workstream's folder is refused. */
export function checkWorkspaceCwd(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (payload.tool_name !== "Bash" || !applies("", command)) return null;
  for (const run of runsOf(command, payload.cwd ?? process.cwd())) {
    if (!(isSpnutils(run, "workspace", ["init", "agent-sync"]) || installsPlugin(run)) || !inWorkstreams(run.dir)) continue;
    return { deny:
      `Refused: this runs \`${run.words.slice(0, 3).join(" ")}\` with its working folder inside \`${DEVEX_WORKSTREAMS}\`, and it would converge that folder as if it were a workspace.\n` +
      "Probe in the session's scratchpad folder, and run the command for the workspace from its root." };
  }
  return null;
}

/** THE WORKSPACE COMMAND CONVERGES EVERY MEMBER: `repo agent-sync` in a member or a worktree is refused and names it. */
export function checkRepoSync(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (payload.tool_name !== "Bash" || !/\bagent-sync\b/.test(command)) return null;
  const root = eventWorkspace(payload.cwd);
  if (!root) return null;
  for (const run of runsOf(command, payload.cwd ?? process.cwd())) {
    if (!isSpnutils(run, "repo", ["agent-sync"])) continue;
    const within = relative(root, run.dir);
    if (!within || within.startsWith("..")) continue;
    const head = within.split(sep)[0];
    const kind = head === ".worktrees" ? "a worktree" : existsSync(join(root, head, "sprepo.json")) ? "a workspace member" : "";
    if (!kind) continue;
    return { deny:
      `Refused: \`spnutils repo agent-sync\` is run in ${kind} (${within}), and it would converge that checkout alone.\n` +
      "Run `spnutils workspace agent-sync` from the workspace root: it converges every member and its worktrees together." };
  }
  return null;
}

if (runAlone("where-it-runs.ts")) {
  try { const payload = readPayload(); emit(checkWorkspaceCwd(payload) ?? checkRepoSync(payload)); } catch { /* never take the chain down */ }
  process.exit(0);
}
