#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `04-devex/10-delivery.md`, which makes it a MUST in both directions.
//
// Do the plugins still say what the book says?
//
// A plugin file restates chapters of the foundation book and adds no rule of its own. Nothing had
// ever checked it. When you changed a chapter and asked which files restate it, the only answer was
// re-reading everything.
//
// `coherence.ts` cannot take this question. Its contract is *run in any repo*, and all of its
// questions compare documents inside ONE repo. NO REPO HOLDS BOTH TREES — there is no book in the
// marketplace and no plugins in the foundation. So this check crosses the boundary, and it is the
// only thing here that does.
//
// A PARTNER NEVER RUNS THIS, AND THAT IS CORRECT. They hold the plugins and not the book. What the
// Foundation publishes is the corrected restatement, never the checker. You run it here, before you
// publish — so with no book to compare against it prints one line and exits clean, the property
// `partner-shape.ts` tests.
//
//     node restate-drift.ts [path/to/spn-foundation]
//
// With no argument it looks for a sibling checkout carrying the register. Exit code is the number of
// findings.

import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { isDir, isFile } from "./hook.ts";
import { check, declaresASource, namedSources, parse, registerRows, undeclared } from "./restates.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);

/** Every markdown file under `plugins/`, sorted, relative to where the tool was run. */
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
  return out.sort();
}

/** The book's location, or null. An explicit path wins and is never second-guessed. */
export function findBook(argument: string | undefined, root: string): string | null {
  if (argument) {
    const given = resolve(argument);
    return isFile(join(given, "docs/registers/decisions.md")) ? given : null;
  }
  // A sibling checkout, which only a producer workspace has. Named by what it CARRIES rather than by
  // what it is called, so a differently-named checkout still answers.
  const parent = dirname(resolve(root));
  let siblings: string[];
  try { siblings = readdirSync(parent).sort(); } catch { return null; }
  for (const name of siblings) {
    const sibling = join(parent, name);
    if (isFile(join(sibling, "docs/registers/decisions.md")) && isFile(join(sibling, "CONCEPT.md")))
      return sibling;
  }
  return null;
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
    console.log("  A partner holds the plugins and not the book, so this check is a builder's gate.");
    console.log("  Pass the book's path to run it: restate-drift.ts path/to/spn-foundation");
    return 0;
  }

  const knownRows = registerRows(join(book, "docs/registers/decisions.md"));
  const findings: string[] = [];
  const omissions: string[] = [];
  const unstamped: string[] = [];
  const unclassified = new Set<string>();
  let stamped = 0;

  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) {
      if (declaresASource(path)) unstamped.push(path);
      continue;
    }
    stamped += 1;
    findings.push(...check(shown(path), block, book, knownRows));
    omissions.push(...undeclared(path, block)
      .map((name) => `${shown(path)}: restates \`${name}\` and does not declare it`));
    for (const name of namedSources(path)[2]) unclassified.add(name);
  }

  for (const finding of findings) console.log(`DRIFT       ${finding}`);
  if (omissions.length) {
    console.log();
    console.log(`UNDECLARED  ${omissions.length} source(s) a block leaves out. The file restates them`);
    console.log("            and nothing watches them, so a moved chapter reaches nobody:");
    for (const omission of omissions) console.log(`              ${omission}`);
  }
  if (unstamped.length) {
    console.log();
    console.log(`UNSTAMPED   ${unstamped.length} file(s) say what they restate in prose and carry no block.`);
    console.log("            The sentence is not machine-readable, so no run can name them when a chapter moves:");
    for (const path of unstamped.slice(0, 10)) console.log(`              ${shown(path)}`);
    if (unstamped.length > 10) console.log(`              … and ${unstamped.length - 10} more`);
  }
  if (unclassified.size) {
    console.log();
    console.log(`UNREAD      ${unclassified.size} name(s) in a declaration that no rule here can`);
    console.log("            resolve to a document, so nothing compares them. This check");
    console.log("            under-reports by exactly this much, and says so rather than hiding it:");
    console.log("              " + [...unclassified].sort().slice(0, 12).join(" · "));
  }

  console.log();
  console.log(`${documents.length} plugin document(s) · ${stamped} carrying spn:restates · ` +
    `${findings.length} drift · ${omissions.length} undeclared · ${unstamped.length} unstamped · ` +
    `${unclassified.size} unread name(s) — book at ${book}`);
  // UNSTAMPED IS REPORTED AND DOES NOT FAIL. It is coverage, not drift: those files are not wrong,
  // they are unmeasured. Failing on them would leave the gate red from the day it shipped until
  // somebody hand-wrote every last block — and a gate that is always red is one nobody reads.
  // AN OMISSION FAILS, WHERE AN UNSTAMPED FILE DOES NOT. The unstamped list is the whole tree on day
  // one; an omission is bounded and each one has a named fix.
  return findings.length + omissions.length;
}

if (process.argv[1] && basename(process.argv[1]) === "restate-drift.ts")
  process.exit(Math.min(main(process.argv.slice(2), process.cwd()), 250));
