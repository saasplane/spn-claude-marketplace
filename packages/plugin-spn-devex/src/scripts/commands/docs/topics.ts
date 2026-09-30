#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Refuse a numbered topic the constructs seat does not name, and two documents under one id.
//
//   spn-devex docs topics <repo…>

import { basename, relative, resolve } from "node:path";
import { begin, record, end, commandFacts } from "../../lib/timing.ts";
import { duplicateIds, resolveWorkspace, topicsCheck } from "./_lib.ts";

export const describe = "refuse a numbered topic the constructs seat does not name, and two documents under one id";

function body(args: string[], workspace: string): number {
  const targets = args.filter((r) => !r.startsWith("--")).map((r) => resolve(r));
  if (!targets.length) { console.error("usage: spn-devex docs topics <repo…>"); return 2; }
  const f = targets.flatMap((t) => [...topicsCheck(t), ...duplicateIds(t)]);
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  const rule = f.filter((x) => x.grade === "RULE").length;
  console.log(f.length ? `\n${f.length} finding(s) — ${rule} RULE, ${f.length - rule} SOFT` : `\nclean — ${targets.length} repository(ies)`);
  return rule ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts(args), workspace);
  const code = body(args, workspace);
  record("docs-topics", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "topics.ts")
  process.exit(run(process.argv.slice(2)));
