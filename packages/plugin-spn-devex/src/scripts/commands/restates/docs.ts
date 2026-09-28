#!/usr/bin/env node
// RESTATES: RD.DEVEX.WORKSPACE.118, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` §
// Restatement discipline.
//
// The `docs`-kind restatement alone: a plugin document that rewrote a chapter's rule in its own
// words, and whether that rewrite still says what the chapter says. `restates check` runs all four
// kinds together; this narrows to one, so a drift names its owed act — a `docs` drift is rewritten,
// never copied or re-run (RD.DEVEX.AGENT.072).
//
//     spn-devex restates docs [path/to/spn-foundation]
//
// Exit code is the number of findings.

import { dirname, relative } from "node:path";
import { DECISION_ID_SRC, check as checkKind, parse, undeclared } from "../../lib/restates.ts";
import { findBook, pluginDocuments } from "./check.ts";

const IS_ROW = new RegExp(`^${DECISION_ID_SRC}$`);

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
  const findings: string[] = [];
  const unrewritten: string[] = [];
  let stamped = 0;
  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) continue;
    stamped += 1;
    findings.push(...checkKind(shown(path), dirname(book), block, ["docs"]));
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
