#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The invariants a page must hold — every check `_lib.ts` carries, run over one path or many.
//
//   spn-devex docs audit <path…>          the invariants a page must hold
//   spn-devex docs audit --report <repo>  the gap scan, to stdout — add --json for the agent, never a file
//
// Grades, per the N2 arc: RULE refuses, SOFT reports.

import { statSync } from "node:fs";
import { basename, resolve, relative } from "node:path";
import { begin, record, end, commandFacts } from "../../lib/timing.ts";
import { audit, gapReport, resolveWorkspace, walkFiles } from "./_lib.ts";

export const describe = "the invariants a page must hold, over one path or many — the whole audit, plus --report's gap scan";

function body(args: string[], workspace: string): number {
  if (args.includes("--report")) {
    const target = args.find((r) => !r.startsWith("--"));
    if (!target) { console.error("usage: spn-devex docs audit --report <repo>"); return 2; }
    return gapReport(resolve(target), resolve(workspace), args.includes("--json"));
  }

  if (args.length === 0) {
    console.error("usage: spn-devex docs audit <path…> | audit --report <repo> [--json]");
    return 2;
  }

  // A PATH IS A FILE OR A FOLDER. Given a folder this means every document under it, which is what
  // anyone typing one meant, and the walk is the same one `face` uses, so `templates/` is skipped by
  // the rule that already exists.
  const pages = args.flatMap((p) => {
    const full = resolve(p);
    let st; try { st = statSync(full); } catch { return [full]; }
    return st.isDirectory() ? walkFiles(full, (f) => f.endsWith(".md") || f.endsWith(".html")) : [full];
  });
  if (!pages.length) { console.log("no document under that path"); return 0; }

  const found = audit(pages, resolve(workspace));
  const rule = found.filter((f) => f.grade === "RULE");
  for (const f of found) console.log(`${f.grade === "RULE" ? "✗" : "!"} ${f.grade.padEnd(4)} ${f.check.padEnd(9)} ${relative(workspace, f.file)}\n         ${f.message}`);
  console.log(found.length
    ? `\n${found.length} finding${found.length > 1 ? "s" : ""} — ${rule.length} RULE, ${found.length - rule.length} SOFT, over ${pages.length} page${pages.length > 1 ? "s" : ""}`
    : `\nclean — ${pages.length} page${pages.length > 1 ? "s" : ""}`);
  return rule.length ? 1 : 0;
}

export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts(args), workspace);
  const code = body(args, workspace);
  record("docs-audit", performance.now() - startedAt);
  end();
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "audit.ts")
  process.exit(run(process.argv.slice(2)));
