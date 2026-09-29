#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Produce each construct page from its seat file — written unless `--check` asks only for a report.
//
//   spn-devex docs page <seat.md…> [--check]

import { basename, join, relative, resolve } from "node:path";
import { begin, record, end } from "../../lib/timing.ts";
import { bookTemplatesDir } from "../../lib/docs-tree.ts";
import { pageFor, resolveWorkspace, seatPaths } from "./_lib.ts";

export const describe = "produce each construct page from its seat file";

function body(args: string[], workspace: string): number {
  const templates = process.env.SPN_TEMPLATES
    ?? bookTemplatesDir(join(resolve(workspace), "spn-foundation"));
  const check = args.includes("--check");
  const seats = seatPaths(args);
  const f = seats.flatMap((p) => pageFor(p, resolve(workspace), templates, !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  return f.some((x) => x.grade === "RULE") ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin({ event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session: process.env.CLAUDE_SESSION_ID ?? null }, workspace);
  const code = body(args, workspace);
  record("docs-page", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "page.ts")
  process.exit(run(process.argv.slice(2)));
