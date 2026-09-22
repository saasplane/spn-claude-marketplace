#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` § Restatement discipline, which makes
// it a MUST in both directions.
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

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { isDir, isFile } from "../lib/payload.ts";
import { check, declaresASource, headerSources, nameIndex, namedSources, parse, registerRows, resolveSource, undeclared } from "../lib/restates.ts";

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
  if (out.length) return out.sort();
  // A WORKSPACE IS NOT A REPOSITORY, AND THIS IS RUN FROM THE WORKSPACE. `<root>/plugins` exists in
  // the marketplace checkout and nowhere else, so run from the folder the sibling checkouts sit in
  // — which is where every other tool here is run from — this found nothing, printed "no plugins
  // here" and RETURNED 0. A record then carried `restate-drift 0` that had compared nothing at all.
  // So a root holding no `plugins/` of its own looks one level down for the sibling that has one.
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

/** Every source file under `plugins/` whose comments could carry a `RESTATES:` header. */
function pluginSources(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) walk(full); }
      else if (/\.(ts|mjs|py)$/.test(entry)) out.push(full);
    }
  };
  walk(join(root, "plugins"));
  if (out.length) return out.sort();
  // The same blindness as `pluginDocuments` above, and the same fix. Run from the workspace this
  // found no sources and the summary read `0 broken header(s)` having opened none of them.
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

/**
 * Headers whose named source resolves nowhere on disk.
 *
 * A HEADER IS A CLAIM ABOUT ANOTHER FILE, and a claim naming a path that does not exist is worse
 * than no claim: a reader follows it, finds nothing, and cannot tell a moved chapter from a typo.
 * Nine of these named `docs/04-capabilities/01-foundation/…`, a folder N13 renamed, and the tenth
 * named a chapter that never existed.
 */
function headerFindings(root: string, book: string): string[] {
  const out: string[] = [];
  // ONE INDEX FOR THE WHOLE WORKSPACE, built once and only because a bare name needs it. The CLI
  // that owns a rule is a different repository from the plugins restating it, so `contract-purity.ts`
  // is a true claim about a file two repositories away.
  const workspace = dirname(root);
  let index: Map<string, string[]> | null = null;
  const byName = (name: string): string[] => {
    index ??= nameIndex(workspace, SKIP);
    return index.get(name) ?? [];
  };
  for (const path of pluginSources(root)) {
    const plugin = /(.*\/plugins\/[^/]+)\//.exec(path)?.[1] ?? root;
    let carried = "";
    for (const header of headerSources(readFileSync(path, "utf8"))) {
      for (const token of header.cited) {
        const where = resolveSource(token, [
          carried, book, join(book, "docs"), join(book, "docs/04-capabilities"),
          // `dirname(plugin)` is the plugins root the file was actually found under, and it is
          // what makes the answer the same from the workspace as from the marketplace. Without it
          // `join(root, "plugins")` resolved only when the tool was run from inside the marketplace,
          // so one header read as broken from one directory and fine from the other.
          root, join(root, "plugins"), dirname(plugin), plugin, dirname(path),
        ]);
        if (where !== null) { carried = dirname(where); continue; }
        const at = token.includes("/") ? [] : byName(token);
        if (at.length) continue;
        // A PATH THAT IS WRONG IS TOLD WHERE THE FILE WENT, because the fix is the rename and a
        // finding that names it costs the reader nothing to act on.
        const moved = token.includes("/") ? byName(token.split("/").pop() as string) : [];
        const hint = moved.length === 1 ? ` — that name is at \`${relative(workspace, moved[0])}\`` : "";
        out.push(`${relative(root, path)}:${header.line}: names \`${token}\`, which resolves to no file${hint}`);
      }
    }
  }
  return out;
}

/** The book's location, or null. An explicit path wins and is never second-guessed. */
export function findBook(argument: string | undefined, root: string): string | null {
  if (argument) {
    const given = resolve(argument);
    return isFile(join(given, "docs/registers/decisions.md")) ? given : null;
  }
  // A sibling checkout, which only a producer workspace has. Named by what it CARRIES rather than by
  // what it is called, so a differently-named checkout still answers.
  const here = resolve(root);
  const parent = dirname(here);
  let siblings: string[];
  try { siblings = readdirSync(parent).sort(); } catch { return null; }
  for (const name of siblings) {
    const sibling = join(parent, name);
    // A SIBLING, WHICH IS NEVER THE REPOSITORY BEING CHECKED. The test is *carries a decisions
    // register and a concept*, and the marketplace earned both the day it was documented as a
    // GENERAL repository — so the check compared the plugins against their own repository's docs
    // and reported 77 drifts that were not drift at all. A repository cannot be the book it
    // restates.
    if (resolve(sibling) === here) continue;
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

  // THE CODE'S OWN HEADERS, which no run had ever read. Reported apart from a document's drift,
  // because a broken header is a claim pointing at nothing rather than a chapter that moved.
  const headers = headerFindings(root, book);
  if (headers.length) {
    console.log();
    console.log(`HEADER      ${headers.length} \`// RESTATES:\` header(s) in code name a file that is not there.`);
    console.log("            A reader follows the claim, finds nothing, and cannot tell a moved");
    console.log("            chapter from a typo:");
    for (const finding of headers) console.log(`              ${finding}`);
  }

  console.log();
  console.log(`${documents.length} plugin document(s) · ${stamped} carrying spn:restates · ` +
    `${findings.length} drift · ${omissions.length} undeclared · ${unstamped.length} unstamped · ` +
    `${unclassified.size} unread name(s) · ${headers.length} broken header(s) — book at ${book}`);
  // UNSTAMPED IS REPORTED AND DOES NOT FAIL. It is coverage, not drift: those files are not wrong,
  // they are unmeasured. Failing on them would leave the gate red from the day it shipped until
  // somebody hand-wrote every last block — and a gate that is always red is one nobody reads.
  // AN OMISSION FAILS, WHERE AN UNSTAMPED FILE DOES NOT. The unstamped list is the whole tree on day
  // one; an omission is bounded and each one has a named fix.
  // A BROKEN HEADER FAILS FROM THE DAY IT SHIPS, and it can, because the fourteen it found were
  // fixed in the same sitting. Each one is bounded and the finding names the fix: the file the path
  // meant is printed beside it.
  return findings.length + omissions.length + headers.length;
}

if (process.argv[1] && basename(process.argv[1]) === "restate-drift.ts")
  process.exit(Math.min(main(process.argv.slice(2), process.cwd()), 250));
