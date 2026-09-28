#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// What is generated, between markers — written unless `--check` asks only for a report.
//
//   spn-devex docs face <docs-tree> [--check]

import { basename, relative, resolve } from "node:path";
import { begin, record, end } from "../../lib/timing.ts";
import { face, resolveWorkspace } from "./_lib.ts";

export const describe = "write what is generated, between markers — the domain glossary, the maps, the tag lines";

function body(args: string[], workspace: string): number {
  const tree = resolve(args.find((r) => !r.startsWith("--")) ?? ".");
  const f = face(tree, !args.includes("--check"));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  return f.some((x) => x.grade === "RULE") ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin({ event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session: process.env.CLAUDE_SESSION_ID ?? null }, workspace);
  const code = body(args, workspace);
  record("docs-face", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "face.ts")
  process.exit(run(process.argv.slice(2)));
