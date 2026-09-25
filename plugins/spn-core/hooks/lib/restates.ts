#!/usr/bin/env node
// RESTATES: RD.DOCS.055, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` § Restatement discipline, which makes
// it a MUST in both directions.
//
// The `spn:restates` block: how it is written, and what a hash covers.
//
// Two checks read this block and they must read it identically. `coherence.ts` compares the
// foundation's own provider restatements against its chapters, inside one repo. `restate-drift.ts`
// compares the marketplace's plugin restatements against a book it is handed. Writing the parser
// twice would be the defect this construct exists to stop — the same rule stated twice, drifting,
// with nothing comparing them.
//
// THE BLOCK
//
//     <!-- spn:restates
//     {
//       "docs": [
//         { "path": "CONCEPT.md", "section": "Kind Tests", "seen": "3f9c1e7a" },
//         { "path": "docs/04-capabilities/02-support/01-apps/06-tests/README.md", "seen": "b204d81c" }
//       ],
//       "decisions": ["RD.APPS.086"]
//     }
//     -->
//
// A CITATION IS AN OBJECT, and it carries its own `seen` (workstream 009, `Q11` answered A).
// `section` is optional: name one and the hash covers that heading's own text, leave it out and the
// hash covers the whole file. So a citation is exactly as precise as the sentence it replaces.
//
// WHY NOT ONE `seen` FOR THE BLOCK. `CONCEPT.md` is over seven thousand lines and eight restatements
// cite it. The QA lens cites one section of about a hundred lines. A hash over the whole file
// re-stamps that lens every time anything else in the file moves — measured at roughly 176 re-stamps
// in sixty days, almost all of them on content nobody cited. A finding that is usually wrong teaches
// people to stop reading the run.
//
// A BLOCK USED TO GET CREDIT FOR WHAT IT LEFT OUT (workstream 009, `A6`; fixed 2026-09-08). `check()`
// walked `docs` and `decisions` and nothing else, so it could only ever validate what a file DECLARED.
// A source the file named in its own prose and omitted from the block was unreachable rather than
// unstamped, and both gates printed green over it. Two design lenses found that by reading, and no
// run could have.
//
// So `check()` now reads the file's own `Source of truth:` line and compares it against the block.
// THE COMPARISON IS LOOSE IN ONE DIRECTION ONLY. Prose says `05-docs/01-corpus` where the block says
// `docs/04-capabilities/01-foundation/02-docs/01-corpus.md`, so a prose name counts as declared when some declared
// path contains it. WHAT IT CANNOT CLASSIFY IT REPORTS RATHER THAN DROPS — see `namedSources`,
// because an under-report here is the very defect this change closes.
//
// PORTED FROM `hooks/scripts/restates.py`. A hash is a promise: every `seen` already stamped across
// the plugins must still read the same, so the port's test hashes the whole corpus with both.

import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import { join, join as joinPath, resolve as resolvePath } from "node:path";
import { isFile, read } from "./payload.ts";

const BLOCK = /<!--\s*spn:restates\s*(\{[\s\S]*?\})\s*-->/;
// The DECLARATION form, which carries a colon. Bare prose does not declare anything, and one skill
// says *a node that restates what its kind already implies has introduced a second source of truth*
// — a sentence about the defect, matched as a declaration by a looser rule.
const SOURCE_LINE = /^.*Source of truth\s*:?\*{0,2}\s*:.*$|^.*\*\*Source of truth:\*\*.*$/gim;
const ROW_ID = /\bRD\.[A-Z]+\.\d{3}\b/g;
const IS_ROW_ID = /^RD\.[A-Z]+\.\d{3}$/;
const HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*$/gm;

export type Citation = { path?: string; section?: string; seen?: string };
/**
 * What a ref stands on. **Four kinds, because each names a different obligation** — a moved `docs`
 * entry means somebody rewrites a paragraph, `files` means somebody copies a file again, `commands`
 * means somebody re-runs something, and `decisions` moves when a row is rewritten. One list would
 * report that something changed and not what you owe (RD.DOCS.091).
 */
export type Block = {
  docs?: Citation[];        // rewritten in the ref's own words
  files?: Citation[];       // copied rather than rewritten; a path may name a folder
  commands?: Citation[];    // re-run to regenerate part of the ref
  decisions?: string[];     // register rows, cited by id because a row has no file
};

/** Every citation kind whose entries are objects carrying a `path` and a `seen`. */
export const PATH_KINDS = ["docs", "files", "commands"] as const;

/**
 * What a hash is taken over.
 *
 * Trailing whitespace and surrounding blank lines are invisible to a reader, so a change to them is
 * not a change to the rule. Everything else counts, including a reordering — a rule list whose order
 * changed is a rule list the restatement may now get wrong.
 */
export function normalize(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, ""));
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.join("\n");
}

/** Eight hex characters. Long enough that a collision is not the failure you will meet. */
export function seenHash(text: string): string {
  return createHash("sha256").update(normalize(text), "utf8").digest("hex").slice(0, 8);
}

/**
 * A WHOLE FOLDER's hash — every file's path and every file's content, in one stamp.
 *
 * **A citation per file cannot see a file that was added.** A set of seventeen stamps reports an
 * edit to any of the seventeen and says nothing at all about an eighteenth, because a file nobody
 * cited has nothing to compare against. The same hole swallows a deletion: the citation fails to
 * resolve, which reads as a broken reference rather than as *the book dropped this*.
 *
 * **So a folder is the honest unit wherever the SET is what is being restated**, which is exactly
 * the case for the templates a partner copies from: what they need is every shape the book has, not
 * a list somebody remembered to extend.
 *
 * THE PATH IS PART OF THE HASH, and that is not incidental. A template renamed is a template a
 * reader cannot find by its old name, so a rename must move the stamp exactly as an edit does.
 * Paths are sorted so the hash is the folder's contents rather than the order a filesystem
 * happened to hand them over.
 */
export function treeHash(dir: string): string {
  const files: string[] = [];
  const walk = (at: string, prefix: string): void => {
    for (const entry of readdirSync(at).sort()) {
      const full = joinPath(at, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) walk(full, rel);
      else files.push(rel);
    }
  };
  walk(dir, "");
  const body = files.map((rel) => `${rel}\n${normalize(read(joinPath(dir, rel)))}`).join("\n\u0000\n");
  return createHash("sha256").update(body, "utf8").digest("hex").slice(0, 8);
}

/** Whether a cited path is a folder rather than a file. */
function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/**
 * One heading's own text, to the next heading at the same level or above.
 *
 * Returns null where no heading matches, which is itself the finding: a section that was renamed
 * reads as absent, and a restatement citing it is pointing at nothing.
 */
export function sectionText(document: string, section: string): string | null {
  const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const wanted = plain(section.trim());
  const matches = [...document.matchAll(HEADING)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    // Compared with the heading's own decoration removed, so `## *Kind Tests*` and a citation of
    // `Kind Tests` are the same section. A citation names the words.
    if (plain(match[2].trim()) !== wanted) continue;
    const depth = match[1].length;
    let end = document.length;
    for (const later of matches.slice(index + 1))
      if (later[1].length <= depth) { end = later.index!; break; }
    return document.slice(match.index! + match[0].length, end);
  }
  return null;
}

/** The block in one file. Returns [block, error] — exactly one of them is null. */
export function parse(path: string): [Block | null, string | null] {
  const found = BLOCK.exec(read(path));
  if (found === null) return [null, null];
  let block: Block;
  try { block = JSON.parse(found[1]); }
  catch (broken) { return [null, `spn:restates is not valid JSON — ${(broken as Error).message}`]; }
  for (const kind of PATH_KINDS)
    if (block[kind] !== undefined && !Array.isArray(block[kind]))
      return [null, `spn:restates \`${kind}\` must be a list of citations`];
  if (block.decisions !== undefined && !Array.isArray(block.decisions))
    return [null, "spn:restates `decisions` must be a list of row ids"];
  return [block, null];
}

/**
 * A file that says what it restates in PROSE, whether or not it carries the block.
 *
 * Metadata is stripped first. `spn:doc` carries a `summary` field, and a summary describing a
 * standard can hold the words *source of truth* without the file declaring anything — one provider
 * guideline does exactly that. Reading it as a declaration reports a file as unstamped that never
 * claimed a source at all.
 */
export function declaresASource(path: string): boolean {
  const text = read(path).replace(/<!--[\s\S]*?-->/g, "");
  SOURCE_LINE.lastIndex = 0;
  return SOURCE_LINE.test(text);
}

// A prose citation names a chapter the way a person would. A token counts as naming a document when
// it carries a path separator or a markdown extension.
const PROSE_PATH = /`([^`]+)`/g;
// Names that appear inside a declaration and are NOT documents: the repository holding the book, and
// the concept's own product name. Listing them beats a rule that silently drops anything odd.
const NOT_A_DOCUMENT = new Set(["spn-foundation", "saasplane-concept", "spnutils"]);
// A seat named without a path — `01-saas`, `02-repo`, `03-module`. The corpus numbers its seats, so
// the shape is what tells a seat from an ordinary word. A declaration line also carries example
// values and plain nouns, and calling those unresolved sources would overstate the gap as badly as
// hiding it understates it.
const SEAT = /^(?:\d{2}-[a-z0-9-]+|README|CONCEPT|#{2,6} .+)$/;

/**
 * A markdown file, or a path carrying one of the corpus's numbered seats.
 *
 * THE CORPUS NUMBERS ITS SEATS, so `02-apps/03-module/01-server/contract/01-states` reads as a path
 * and `application/json` does not. Two earlier rules were wrong in the same direction: *contains a
 * slash* claimed the MIME type, and *two named segments* claimed it too. `ui/` is a taxonomy folder
 * inside a seat already declared, and it fails both halves.
 */
export function looksLikeADocument(token: string): boolean {
  if (token.toLowerCase().endsWith(".md")) return true;
  return token.split("/").some((segment) => /^\d{2}-[a-z0-9-]+$/.test(segment));
}

/**
 * What a file's own prose says it restates — `[documents, rows, unclassified]`.
 *
 * The declaration line is the only place read. A path elsewhere in the file is an example or a
 * cross-reference, and reading those would report a file for every path it mentions.
 *
 * `unclassified` IS RETURNED RATHER THAN DROPPED. A declaration naming `03-behaviors` names a real
 * seat and carries no path, so nothing here can resolve it to a file. Reporting those keeps the limit
 * visible: this check under-reports by exactly that list, and silently under-reporting is the defect
 * it exists to close.
 */
export function namedSources(path: string): [Set<string>, Set<string>, Set<string>] {
  const text = read(path).replace(/<!--[\s\S]*?-->/g, "");
  const documents = new Set<string>();
  const rows = new Set<string>();
  const unclassified = new Set<string>();
  SOURCE_LINE.lastIndex = 0;
  for (const line of text.match(SOURCE_LINE) ?? []) {
    for (const row of line.match(ROW_ID) ?? []) rows.add(row);
    for (const found of line.matchAll(PROSE_PATH)) {
      const token = found[1].trim();
      if (!token || NOT_A_DOCUMENT.has(token) || IS_ROW_ID.test(token)) continue;
      if (looksLikeADocument(token)) documents.add(token);
      else if (SEAT.test(token)) unclassified.add(token);
    }
  }
  return [documents, rows, unclassified];
}

/**
 * Sources the file's prose names that its block does not declare — NOT DRIFT.
 *
 * Until 2026-09-08 nothing asked this, so a block got credit for what it left out. An omitted source
 * is unreachable rather than unstamped: no run could name it when its chapter moved, and both gates
 * printed green.
 *
 * A prose name matches loosely and in one direction: `05-docs/01-corpus` is covered by a declared
 * `docs/04-capabilities/01-foundation/02-docs/01-corpus.md`, and never the other way round.
 */
export function undeclared(path: string, block: Block): string[] {
  const [documents, rows] = namedSources(path);
  const declared = PATH_KINDS.flatMap((kind) => block[kind] ?? [])
    .filter((c) => c && typeof c === "object")
    .map((c) => String(c.path ?? "").toLowerCase());
  const missing = [...documents].sort().filter((name) =>
    !declared.some((one) => one.includes(name.toLowerCase().replace(/^\/+|\/+$/g, ""))));
  missing.push(...[...rows].sort().filter((row) => !(block.decisions ?? []).includes(row)));
  return missing;
}

/**
 * Every DRIFT finding one restatement's block earns. Empty where it is current.
 *
 * THIS ASKS ONLY WHETHER WHAT THE FILE DECLARED IS STILL TRUE. Whether the file declared everything
 * it restates is `undeclared`, a separate question with a separate answer — an omission is not drift,
 * and reporting them as one hides which of the two you are looking at.
 *
 * `workspace` is the folder the sibling checkouts sit in, because a citation names its repository.\n *\n * `knownRows` may be empty, and then row citations are not checked at all — a repo holding no
 * register is a fact about that repo rather than a finding about it.
 */
export function check(path: string, workspace: string, block: Block, knownRows: Set<string>): string[] {
  const findings: string[] = [];
  for (const citation of PATH_KINDS.flatMap((kind) => block[kind] ?? [])) {
    if (!citation || typeof citation !== "object" || citation.path === undefined) {
      findings.push(`${path}: a citation must be an object with a \`path\``);
      continue;
    }
    // A CITATION STARTS AT THE REPOSITORY, so it resolves from the WORKSPACE rather than from
    // whichever checkout the reader happens to be standing in (RD.DOCS.091). That is what lets one
    // ref cite the book, the CLI's own source and a blueprint in three different repositories
    // without the checker needing to be told which tree each lives in.
    const cited = join(workspace, citation.path);
    // A FOLDER IS A CITATION TOO, and it answers a question a file cannot: whether the SET moved.
    // A stamp per file reports every edit and misses every addition, because a file nobody cited
    // has nothing to compare against. Where what is restated is *all of them* — the templates a
    // partner copies from — the folder is the unit.
    if (isDir(cited)) {
      if (citation.section) {
        findings.push(`${path}: cites \`${citation.path} \u00a7 ${citation.section}\` \u2014 a folder has no sections`);
        continue;
      }
      const now = treeHash(cited);
      if (citation.seen === undefined)
        findings.push(`${path}: cites \`${citation.path}\` with no \`seen\` — nothing to compare`);
      else if (citation.seen !== now)
        findings.push(`${path}: \`${citation.path}\` has moved since this file restated it — a file was added, removed or edited. seen ${citation.seen}, now ${now}`);
      continue;
    }
    if (!isFile(cited)) {
      findings.push(`${path}: cites \`${citation.path}\`, which does not resolve`);
      continue;
    }
    let document: string | null = read(cited);
    let where = citation.path;
    if (citation.section) {
      document = sectionText(document, citation.section);
      where = `${citation.path} § ${citation.section}`;
      if (document === null) {
        findings.push(`${path}: cites \`${where}\`, and no such heading exists`);
        continue;
      }
    }
    const current = seenHash(document);
    const stamped = citation.seen;
    if (stamped === undefined) findings.push(`${path}: cites \`${where}\` with no \`seen\` — nothing to compare`);
    else if (stamped !== current)
      findings.push(`${path}: \`${where}\` has moved since this file restated it — seen ${stamped}, now ${current}`);
  }
  for (const row of block.decisions ?? [])
    if (knownRows.size && !knownRows.has(row))
      findings.push(`${path}: cites \`${row}\`, which the register does not carry`);
  return findings;
}

/** Every decision id the register declares. Empty where there is no register to read. */
export function registerRows(register: string): Set<string> {
  if (!isFile(register)) return new Set();
  return new Set(read(register).match(ROW_ID) ?? []);
}

// ---------------------------------------------------------------- a code file's own header
//
// A SOURCE FILE SAYS WHAT IT RESTATES IN A COMMENT, AND NOTHING READ IT. `restate-drift` reads a
// DOCUMENT's `spn:restates` block, so a `// RESTATES:` header is outside its set — and ten hook
// sources sat behind a green light naming a folder that no longer exists. A header is the same
// promise a block makes, in the one place a reader of the code will see it, so it earns the same
// check (N15 step 2, 2026-09-22).

/** A `// RESTATES:` header: the line it starts on, and every source it names. */
export type Header = { line: number; cited: string[] };

/**
 * Every `// RESTATES:` header in a source file, with the sources each names.
 *
 * THE LINE MUST OPEN WITH THE MARKER, which is what tells a claim from a mention. A fixture string
 * inside a test carries `<!-- RESTATES: a chapter` mid-line, and reading that would report the test
 * for the document it invents. A header continues onto following `//` lines, the way every one of
 * them is written today.
 */
export function headerSources(text: string): Header[] {
  const out: Header[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\/\/\s*RESTATES:/.test(lines[i])) continue;
    const body: string[] = [lines[i].replace(/^\s*\/\/\s*RESTATES:/, "")];
    // A HEADER RUNS TO THE FIRST BARE `//`, and that is read from the corpus rather than assumed.
    // The first rule here wanted an indent of two, because `split-plan.ts` writes its second line
    // as `//           docs/…`. Six headers wrap at ONE space — `doc-check.ts` names four chapters
    // that way — so the rule read line two of those headers and silently dropped the rest, which is
    // the under-report this check exists to end. An empty comment line ends the claim; the prose
    // after it is the file explaining itself.
    for (let n = i + 1; n < lines.length; n++) {
      const m = /^\s*\/\/(?!\/)[ \t]*(\S.*)$/.exec(lines[n]);
      if (!m) break;
      body.push(m[1]);
      i = n;
    }
    const cited: string[] = [];
    for (const token of body.join(" ").split(/[\s`,;()]+/)) {
      const clean = token.replace(/^[·—–*“"']+|[.,:;·—–*”"']+$/g, "");
      if (!clean || NOT_A_DOCUMENT.has(clean) || IS_ROW_ID.test(clean)) continue;
      if (/\.(md|py|ts|mjs|sql|json)$/i.test(clean) && !clean.includes("*")) cited.push(clean);
    }
    out.push({ line: i + 1, cited });
  }
  return out;
}

/**
 * Where a header's source resolves, or null.
 *
 * A HEADER NAMES A SIBLING BARE. `03-tree.md · 05-artifacts.md · 02-document.md` is three chapters of
 * one folder, and only the first carries a path — so the folder of the last source that resolved is
 * a root for the next one. That is how these headers are written, and a resolver that missed it
 * would report two thirds of a correct header as broken.
 */
export function resolveSource(token: string, roots: string[]): string | null {
  for (const root of roots) {
    if (!root) continue;
    const full = resolvePath(root, token);
    if (isFile(full)) return full;
  }
  return null;
}

/**
 * Every file under a tree, indexed by its bare name.
 *
 * A PATH AND A BARE NAME ARE DIFFERENT CLAIMS, and one test cannot judge both. `docs/…/05-artifacts.md`
 * claims a LOCATION, so it is wrong the moment the folder is renamed — which is exactly the defect
 * nine headers carried. A bare `06-registers.md` claims only that the file EXISTS, and a reader finds
 * it; demanding a path there would report six correct headers as broken and push every one of them
 * into a verbose rewrite. So a bare name is looked up by name, across the whole workspace, because
 * the CLI that owns a rule is a different repository from the plugins that restate it.
 */
export function nameIndex(root: string, skip: Set<string>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (skip.has(entry) || entry.startsWith(".")) continue;
      const full = joinPath(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) walk(full);
      else { const at = index.get(entry) ?? []; at.push(full); index.set(entry, at); }
    }
  };
  walk(root);
  return index;
}
