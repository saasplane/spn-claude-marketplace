#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Roll the behaviour rows at a construct's own path up into its status — written unless `--check`
// asks only for a report.
//
//   spn-devex docs status <seat.md…> [--check]

import { basename, relative, resolve } from "node:path";
import { begin, record, end, commandFacts } from "../../lib/timing.ts";
import { resolveWorkspace, seatPaths, statusFor } from "./_lib.ts";

export const describe = "roll the behaviour rows at a construct's own path up into its status";

function body(args: string[], workspace: string): number {
  const check = args.includes("--check");
  const seats = seatPaths(args);
  const f = seats.flatMap((p) => statusFor(p, resolve(workspace), !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  return f.some((x) => x.grade === "RULE") ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts(args), workspace);
  const code = body(args, workspace);
  record("docs-status", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "status.ts")
  process.exit(run(process.argv.slice(2)));
