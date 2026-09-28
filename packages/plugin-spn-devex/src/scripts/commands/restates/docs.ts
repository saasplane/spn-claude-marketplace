#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` §
// Restatement discipline.
//
// The `docs`-kind restatement alone: a plugin document that rewrote a chapter's rule in its own
// words, and whether that rewrite still says what the chapter says. `restates check` runs all four
// kinds together; this narrows to one, so a drift names its owed act — a `docs` drift is rewritten,
// never copied or re-run (RD.DOCS.091).
//
//     spn-devex restates docs [path/to/spn-foundation]
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
    console.log("  Pass the book's path to run it: restates docs path/to/spn-foundation");
    return 0;
  }
  const knownRows = registerRows(join(book, "docs/registers/decisions.md"));
  const findings: string[] = [];
  const unrewritten: string[] = [];
  let stamped = 0;
  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) continue;
    stamped += 1;
    findings.push(...checkKind(shown(path), dirname(book), block, knownRows, ["docs"]));
    unrewritten.push(...undeclared(path, block)
      .filter((name) => !IS_ROW.test(name))
      .map((name) => `${shown(path)}: restates \`${name}\` in prose and its block does not declare it`));
  }
  for (const finding of findings) console.log(`REWRITE     ${finding}`);
  if (unrewritten.length) {
    console.log();
    console.log(`UNDECLARED  ${unrewritten.length} doc source(s) a block leaves out:`);
    for (const one of unrewritten) console.log(`              ${one}`);
  }
  console.log();
  console.log(`${documents.length} plugin document(s) · ${stamped} carrying spn:restates · ` +
    `${findings.length} owe a rewrite · ${unrewritten.length} undeclared — book at ${book}`);
  return findings.length + unrewritten.length;
}

export const describe = "the `docs`-kind restatement alone — a drift here owes a rewrite";
export function run(args: string[]): number { return Math.min(main(args, process.cwd()), 250); }

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
