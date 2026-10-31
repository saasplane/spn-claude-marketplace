// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Ideation is kept as it happens · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream fact write <workstream>/N<nnn> --source <repository>/<path>[:<line>] --fact "…" [--used-by q59,57]
//
// One fact, read while ideating, pinned to the source repository's current commit (the workstream's own branch where it has one),
// which `git` gives so the agent never types a commit.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { appendJsonl, factsFileOf, logEvent, now, readJsonl, workspaceOf } from "../../lib/workstream.ts";
import { factFaults, type Fact } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf } from "./_shared.ts";

export const describe = "one fact, read while ideating, pinned to the commit of its source";

/** The commit a repository stands at, short, or null where it is no checkout. */
export function headOf(repository: string): string | null {
  try { return execFileSync("git", ["-C", repository, "rev-parse", "--short=8", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; }
  catch { return null; }
}

/** The next fact id of an arc: one past the highest it holds. */
export function nextFactId(facts: readonly unknown[]): string {
  const numbers = facts.map((line) => Number(/^f(\d+)$/.exec(String((line as Fact | undefined)?.id ?? ""))?.[1] ?? 0));
  return `f${Math.max(0, ...numbers) + 1}`;
}

function write(args: string[]): number {
  const words = readWords(args, { source: VALUE, fact: VALUE, "used-by": VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const source = words.value("source");
  const text = words.value("fact");
  if (!source || !text) throw new UsageFault("needs `--source <repository>/<path>` and `--fact \"…\"`.");
  const repository = source.split("/")[0];
  const root = workspaceOf(ws);
  // Where the workstream has a branch of its own in the worktree set, the fact is pinned to that branch's commit.
  const own = root ? join(root, ".worktrees", basename(ws), repository) : null;
  const commit = root ? (own && existsSync(own) ? headOf(own) : null) ?? headOf(join(root, repository)) : null;
  if (!commit) throw new UsageFault(`finds no checkout \`${repository}\` beside the workspace — the source starts with its repository.`);
  const file = factsFileOf(ws, arc);
  const fact: Fact = { id: nextFactId(readJsonl(file)), fact: text, source, commit, readAt: now(), usedBy: listOf(words, "used-by") ?? [] };
  const faults = factFaults(fact, "the fact");
  if (faults.length) throw new UsageFault(`${faults.join("; ")}.`);
  appendJsonl(file, fact);
  logEvent(ws, arc, "fact", null, `${fact.id} · ${source}`);
  console.log(`${fact.id} · pinned ${commit}`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "write one fact, the source's current commit pinned", usage: "<workstream>/N<nnn> --source <repository>/<path>[:<line>] --fact \"…\" [--used-by …]", run: write },
};
