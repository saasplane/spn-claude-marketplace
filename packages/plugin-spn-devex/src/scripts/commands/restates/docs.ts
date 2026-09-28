#!/usr/bin/env node
// RESTATES: RD.DEVEX.WORKSPACE.118, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` §
// Restatement discipline.
//
// The `docs`-kind restatement alone: a plugin document that rewrote a chapter's rule in its own
// words, and whether that rewrite still says what the chapter says. `restates check` runs all four
// kinds together; this narrows to one, so a drift names its owed act — a `docs` drift is rewritten,
// never copied or re-run (RD.DEVEX.AGENT.072).
//
//     spn-devex restates docs [path/to/spn-foundation]      check: is every citation current?
//     spn-devex restates docs --write <ref>                  restamp one ref's docs citations
//
// Exit code is the number of findings.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { isFile, read, workspaceRoot } from "../../lib/payload.ts";
import {
  BLOCK_COMMENT, DECISION_ID_SRC, type Citation, check as checkKind, isDir, parse,
  sectionText, seenHash, treeHash, undeclared,
} from "../../lib/restates.ts";
import { findBook, pluginDocuments } from "./check.ts";

const IS_ROW = new RegExp(`^${DECISION_ID_SRC}$`);

/**
 * Restamp one ref's `docs` citations after the developer has re-read each source and corrected any
 * disagreement in the ref's own prose — this never rewrites the ref's text, only the `seen` each
 * citation carries. A citation whose source does not resolve is left as found and named, because
 * there is nothing here to restamp it against.
 */
function writeOne(refPath: string): number {
  const workspace = workspaceRoot(dirname(refPath));
  if (!workspace) {
    console.error(`${refPath}: no workspace found walking up from this file (no .spndevex)`);
    return 2;
  }
  const [block, broken] = parse(refPath);
  if (broken) { console.error(`${refPath}: ${broken}`); return 1; }
  const citations: Citation[] = block?.docs ?? [];
  if (!citations.length) { console.log(`${refPath}: no docs citations to restamp`); return 0; }
  let restamped = 0;
  const unresolved: string[] = [];
  for (const citation of citations) {
    if (!citation.path) { unresolved.push("a citation with no `path`"); continue; }
    const cited = join(workspace, citation.path);
    if (isDir(cited)) {
      if (citation.section) { unresolved.push(`\`${citation.path}\` — a folder has no sections`); continue; }
      const now = treeHash(cited);
      if (citation.seen !== now) { citation.seen = now; restamped += 1; }
      continue;
    }
    if (!isFile(cited)) { unresolved.push(`\`${citation.path}\` — does not resolve`); continue; }
    let document: string | null = read(cited);
    let where = citation.path;
    if (citation.section) {
      document = sectionText(document, citation.section);
      where = `${citation.path} § ${citation.section}`;
      if (document === null) { unresolved.push(`\`${where}\` — no such heading exists`); continue; }
    }
    const now = seenHash(document);
    if (citation.seen !== now) { citation.seen = now; restamped += 1; }
  }
  if (restamped) {
    const src = readFileSync(refPath, "utf8");
    const next = src.replace(BLOCK_COMMENT, `<!-- spn:restates\n${JSON.stringify(block, null, 2)}\n-->`);
    writeFileSync(refPath, next, "utf8");
  }
  console.log(`${refPath}: ${restamped} doc(s) restamped` +
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
export function run(args: string[]): number {
  if (args.includes("--write")) {
    const ref = args.find((a) => !a.startsWith("-"));
    if (!ref) { console.error("usage: restates docs --write <ref>"); return 2; }
    return writeOne(resolve(ref));
  }
  return Math.min(main(args, process.cwd()), 250);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
