#!/usr/bin/env node
// After a Bash call that merged into `develop`, remind the agent which open workstreams hold that repository
// and which of their arcs are running, and the `workstream arc edit <ws>/<arc> --note` line each one is owed.
// The agent writes the lines, because what changed is judgement; this reads no diff and writes nothing.
// A note for the agent alone, never a refusal, and silent where no running arc holds the repository.

import { execFileSync } from "node:child_process";
import { basename, join } from "node:path";
import { isDir, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { arcIdsOf, arcRepos, arcStatus, readArc, workstreamsOf } from "../lib/workstream.ts";
import { ranIn } from "./rebase-moved.ts";

const PR_MERGE = /\bgh\s+pr\s+merge\b/;
const LOCAL_MERGE = /\bgit\s+(?:-C\s+(?:'[^']*'|"[^"]*"|\S+)\s+)?(?:merge|pull)\b/;
const NOT_A_MERGE = /--abort\b|--quit\b|--auto\b|--disable-auto\b|--dry-run\b/;

/** Whether the command could merge into `develop`, from its text alone. */
export function applies(_path: string, command: string): boolean {
  return (PR_MERGE.test(command) || LOCAL_MERGE.test(command)) && !NOT_A_MERGE.test(command);
}

function run(cwd: string, program: string, args: string[], timeout = 10000): string | null {
  try { return execFileSync(program, args, { cwd, encoding: "utf8", timeout, stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return null; }
}

/** The pull request a `gh pr merge` names: the first word that is not an option, else the checked-out branch's. */
function selector(command: string): string[] {
  const after = command.slice(command.search(PR_MERGE)).split(/\s+/).slice(3);
  const word = after.find((one) => one && !one.startsWith("-"));
  return word ? [word] : [];
}

/** Whether the merge went into `develop`, and the repository it went into by its folder name. Null where it did not or cannot be told. */
function mergedRepo(payload: Payload, command: string): string | null {
  const cwd = ranIn(payload, command);
  if (PR_MERGE.test(command)) {
    const base = run(cwd, "gh", ["pr", "view", ...selector(command), "--json", "baseRefName", "--jq", ".baseRefName"], 15000);
    if (base !== "develop") return null;
  } else {
    const said = typeof payload.tool_response === "string" ? payload.tool_response
      : String((payload.tool_response as { stdout?: unknown } | undefined)?.stdout ?? "");
    if (/already up[- ]to[- ]date/i.test(said)) return null;
    if (run(cwd, "git", ["rev-parse", "--abbrev-ref", "HEAD"]) !== "develop") return null;
    const before = run(cwd, "git", ["rev-parse", "--verify", "--quiet", "ORIG_HEAD^{commit}"]);
    if (!before || before === run(cwd, "git", ["rev-parse", "HEAD"])) return null;
  }
  const top = run(cwd, "git", ["rev-parse", "--show-toplevel"]);
  return top ? basename(top) : null;
}

/** Whether a workstream's set holds the repository: a worktree for it in the set's folder, or an arc that names it. */
function holds(root: string, ws: string, repo: string): boolean {
  if (isDir(join(root, ".worktrees", basename(ws), repo))) return true;
  return arcIdsOf(ws).some((arc) => { const data = readArc(ws, arc); return !!data && arcRepos(data).includes(repo); });
}

/** The running arcs of each open workstream whose set holds the repository, as the ref `arc edit` takes. */
export function owing(root: string, repo: string): Array<{ workstream: string; arcs: string[] }> {
  const out: Array<{ workstream: string; arcs: string[] }> = [];
  for (const ws of workstreamsOf(root, ["open"])) {
    if (!holds(root, ws, repo)) continue;
    const number = /^(\d+)/.exec(basename(ws))?.[1] ?? basename(ws);
    const arcs = arcIdsOf(ws).filter((arc) => { const data = readArc(ws, arc); return !!data && arcStatus(data) === "RUNNING"; })
      .map((arc) => `${number}/${arc}`);
    if (arcs.length) out.push({ workstream: basename(ws), arcs });
  }
  return out;
}

export function checkMergeTold(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash" || payload.hook_event_name === "PostToolUseFailure") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  const root = workspaceRoot(ranIn(payload, command));
  if (!root) return null;
  const repo = mergedRepo(payload, command);
  if (!repo) return null;
  const owed = owing(root, repo);
  if (!owed.length) return null;
  const lines = owed.flatMap((one) => one.arcs.map((arc) => `- ${one.workstream}: \`spn-devex workstream arc edit ${arc} --note "…"\``));
  return { note: `\`${repo}\` took a merge into \`develop\`. Each running arc below belongs to an open workstream whose set holds it, and each is owed one line: what changed, a dependency the merge added, and for a breaking change its cutover (what must land with it, and in what order). You write the lines; nothing was written for you.\n${lines.join("\n")}` };
}
