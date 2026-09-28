#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` §
// Restatement discipline.
//
// The `decisions`-kind restatement alone: a plugin document citing a register row by id, and whether
// that row still exists. `restates check` runs all four kinds together; this narrows to one, so a
// drift names its owed act — a `decisions` drift is re-read, never rewritten or copied (RD.DOCS.091).
//
//     spn-devex restates decisions [path/to/spn-foundation]      check: is every cited row current?
//     spn-devex restates decisions --write <ref>                 restamp one ref's decisions citations
//
// Exit code is the number of findings.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { workspaceRoot } from "../../lib/payload.ts";
import { BLOCK_COMMENT, check as checkKind, type DecisionCitation, parse, registerPath, rowHash, undeclared } from "../../lib/restates.ts";
import { findBook, pluginDocuments } from "./check.ts";

const IS_ROW = /^RD\.[A-Z]+\.\d{3}$/;

/**
 * Restamp one ref's `decisions` citations after the developer has re-read each row and corrected
 * any disagreement in the ref's own prose — this never rewrites the ref's text, only the `seen`
 * hash each citation carries. A citation whose register or row does not resolve is left as found
 * and named, because there is nothing here to restamp it against.
 */
function writeOne(refPath: string): number {
  const workspace = workspaceRoot(dirname(refPath));
  if (!workspace) {
    console.error(`${refPath}: no workspace found walking up from this file (no .spndevex)`);
    return 2;
  }
  const [block, broken] = parse(refPath);
  if (broken) { console.error(`${refPath}: ${broken}`); return 1; }
  const citations: DecisionCitation[] = block?.decisions ?? [];
  if (!citations.length) { console.log(`${refPath}: no decisions citations to restamp`); return 0; }
  let restamped = 0;
  const unresolved: string[] = [];
  for (const citation of citations) {
    if (!citation.repo || !citation.row) { unresolved.push(`a citation with no \`repo\` or \`row\``); continue; }
    const now = rowHash(registerPath(workspace, citation.repo), citation.row);
    if (now === null) { unresolved.push(`\`${citation.row}\` — \`${citation.repo}\`'s register does not carry it`); continue; }
    if (citation.seen !== now) { citation.seen = now; restamped += 1; }
  }
  if (restamped) {
    const src = readFileSync(refPath, "utf8");
    const next = src.replace(BLOCK_COMMENT, `<!-- spn:restates\n${JSON.stringify(block, null, 2)}\n-->`);
    writeFileSync(refPath, next, "utf8");
  }
  console.log(`${refPath}: ${restamped} row(s) restamped` +
    (unresolved.length ? `, ${unresolved.length} left as found:\n  ${unresolved.join("\n  ")}` : ""));
  return 0;
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
  const findings: string[] = [];
  const unread: string[] = [];
  let stamped = 0;
  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) continue;
    stamped += 1;
    findings.push(...checkKind(shown(path), dirname(book), block, ["decisions"]));
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
export function run(args: string[]): number {
  if (args.includes("--write")) {
    const ref = args.find((a) => !a.startsWith("-"));
    if (!ref) { console.error("usage: restates decisions --write <ref>"); return 2; }
    return writeOne(resolve(ref));
  }
  return Math.min(main(args, process.cwd()), 250);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
