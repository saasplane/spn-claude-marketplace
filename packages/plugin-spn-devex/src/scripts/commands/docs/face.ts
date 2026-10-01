#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// What is generated, between markers — written unless `--check` asks only for a report.
//
//   spn-devex docs face <docs-tree> [--check]

import { basename, relative, resolve } from "node:path";
import { argsText, begin, commandFacts, end, record } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { face, resolveWorkspace } from "./_lib.ts";

export const describe = "write what is generated, between markers — the domain glossary, the maps, the tag lines";

function body(args: string[], workspace: string): number {
  // THE TREE IS NAMED, NEVER ASSUMED. This command writes unless `--check` is given, and the current
  // folder taken as the tree would walk every repository of a workspace, a workstream's notes too.
  const named = args.find((r) => !r.startsWith("--"));
  if (named === undefined) { console.error("usage: spn-devex docs face <docs-tree> [--check]"); return 2; }
  const tree = resolve(named);
  const f = face(tree, !args.includes("--check"));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  return f.some((x) => x.grade === "RULE") ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts("spn-devex", args), workspace);
  const code = body(args, workspace);
  record({ group: "docs", action: "face", args: argsText(args) }, performance.now() - startedAt, code);
  end(code);
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "face.ts")
  process.exit(run(process.argv.slice(2)));
