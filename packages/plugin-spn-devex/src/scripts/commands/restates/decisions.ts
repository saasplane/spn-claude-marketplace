#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` §
// Restatement discipline.
//
// The `decisions`-kind restatement alone: a plugin document citing a register row by id, and whether
// that row still exists. `restates check` runs all four kinds together; this narrows to one, so a
// drift names its owed act — a `decisions` drift is re-read, never rewritten or copied (RD.DOCS.091).
//
//     spn-devex restates decisions [path/to/spn-foundation]
//
// Exit code is the number of findings.

import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { check as checkKind, parse, registerRows, undeclared } from "../../lib/restates.ts";
import { findBook } from "./check.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);
const IS_ROW = /^RD\.[A-Z]+\.\d{3}$/;

function pluginDocuments(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) walk(full); }
      else if (entry.endsWith(".md")) out.push(full);
    }
  };
  walk(join(root, "plugins"));
  if (out.length) return out.sort();
  let siblings: string[];
  try { siblings = readdirSync(root).sort(); } catch { return []; }
  for (const entry of siblings) {
    if (SKIP.has(entry)) continue;
    const sibling = join(root, entry);
    try { if (!statSync(sibling).isDirectory()) continue; } catch { continue; }
    walk(join(sibling, "plugins"));
    if (out.length) return out.sort();
  }
  return out.sort();
}

export function main(argv: string[], root: string): number {
  const documents = pluginDocuments(root);
  const shown = (path: string) => relative(root, path);
  if (!documents.length) {
    console.log("no plugins here — nothing restates the book in this repo");
    return 0;
  }
  const book = findBook(argv.find((a) => !a.startsWith("-")), root);
  if (book === null) {
    console.log(`${documents.length} plugin document(s) · no foundation book to compare against — quiet`);
    console.log("  Pass the book's path to run it: restates decisions path/to/spn-foundation");
    return 0;
  }
  const knownRows = registerRows(join(book, "docs/registers/decisions.md"));
  const findings: string[] = [];
  const unread: string[] = [];
  let stamped = 0;
  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) continue;
    stamped += 1;
    findings.push(...checkKind(shown(path), dirname(book), block, knownRows, ["decisions"]));
    unread.push(...undeclared(path, block)
      .filter((name) => IS_ROW.test(name))
      .map((row) => `${shown(path)}: cites \`${row}\` in prose and its block does not declare it`));
  }
  for (const finding of findings) console.log(`RE-READ     ${finding}`);
  if (unread.length) {
    console.log();
    console.log(`UNDECLARED  ${unread.length} row(s) a block leaves out:`);
    for (const one of unread) console.log(`              ${one}`);
  }
  console.log();
  console.log(`${documents.length} plugin document(s) · ${stamped} carrying spn:restates · ` +
    `${findings.length} owe a re-read · ${unread.length} undeclared — book at ${book}`);
  return findings.length + unread.length;
}

export const describe = "the `decisions`-kind restatement alone — a drift here owes a re-read of the row";
export function run(args: string[]): number { return Math.min(main(args, process.cwd()), 250); }

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
