#!/usr/bin/env node
// RESTATES: RD.DOCS.031 rule 7 and RD.DOCS.052. The chapters are the source of truth.
//
// Find the paragraphs worth rewriting, so a prose pass reads candidates rather than a corpus.
//
// Workstream 008 covers every prose sentence in the workspace — 33,166 of them at the time this was
// written. Handing that to agents whole is the expensive way to do it, and most of it needs no
// change. Six of the nine faults that workstream names are detectable by pattern, so this reports
// where they are and a rewriting pass reads only those paragraphs and their headings.
//
//   node prose-triage.ts [path ...]            report per file, most candidates first
//   node prose-triage.ts --comments            include prose in code comments, not markdown alone
//   node prose-triage.ts --paragraphs <path>   print the flagged paragraphs of one file
//   node prose-triage.ts --ledger=<file>       skip files whose content hash is already recorded
//   node prose-triage.ts --record=<file>       append the hashes of every file reported
//
// What it never reads is what must never change: a code block, a table row, a heading, front matter
// and the reading strip are all removed before anything is scored, because `proseOf` removes them. A
// record keeps its form, and generated files are skipped by name.
//
// Three of the nine faults are left to a reader on purpose. A compressed claim, a rule with no
// action, and an abstraction that is merely dull cannot be told from good prose by a pattern. The
// report says so rather than implying the flagged set is the whole job.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, appendFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { isFile, read } from "./hook.ts";
import { BLOCK_BREAK, IDIOM, MARKED, opening, proseOf, sentences, type Sentence } from "./doc-check.ts";

const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", ".output",
  "__pycache__", ".venv", "tool-results", ".pnpm-store"]);
// Regenerated from something else, so an edit here is overwritten by the next build.
const SKIP_FILE = /^(CHANGELOG|LICENSE|spn-symbols|.*\.generated)\.md$/i;

// A comment is prose a developer and an agent both read, so RD.DOCS.052 reaches it exactly as it
// reaches a chapter. What is never touched is the code around it.
const CODE_EXT: Record<string, string> = { ".ts": "c", ".tsx": "c", ".js": "c", ".jsx": "c", ".py": "py", ".sh": "sh" };
// An instruction to a tool rather than a sentence to a reader. Rewriting one breaks the tool.
const DIRECTIVE = /^\s*(?:eslint|prettier|@ts-|ts-|type:|noqa|pylint|pragma|istanbul|biome-ignore|v8 ignore|c8 ignore|TODO\b|FIXME\b|HACK\b|XXX\b|https?:\/\/|#!|-\*-|coding[:=])/i;
const GENERATED = /(generated|do not edit|auto-?generated)/i;

/**
 * Every comment body in one source file, with the code removed.
 *
 * A run of consecutive line comments is one block, because that is how it reads. A generated file is
 * skipped whole — an edit there is overwritten by the next build.
 */
export function commentBlocks(src: string, style: string): string[] {
  if (GENERATED.test(src.slice(0, 400))) return [];
  const out: string[] = [];
  let run: string[] = [];
  let linePattern: RegExp;
  if (style === "c") {
    for (const found of src.matchAll(/\/\*\*?([\s\S]*?)\*\//g))
      out.push(found[1].replace(/^\s*\*+/gm, ""));
    linePattern = /^\s*\/\/+(.*)$/;
  } else {
    for (const found of src.matchAll(/"""([\s\S]*?)"""|'''([\s\S]*?)'''/g))
      out.push(found[1] || found[2] || "");
    linePattern = /^\s*#+(.*)$/;
  }
  for (const line of src.split("\n")) {
    const found = linePattern.exec(line);
    if (found) run.push(found[1]);
    else if (run.length) { out.push(run.join("\n")); run = []; }
  }
  if (run.length) out.push(run.join("\n"));
  return out;
}

type Block = [text: string, sentences: Sentence[]];

/**
 * Comment blocks carrying a real sentence.
 *
 * Eight words and a sentence end is the floor. Below that a comment is a label rather than prose, and
 * holding a label to a writing standard produces noise a reader has to clear.
 */
export function proseComments(path: string, style: string): Block[] {
  const src = read(path);
  const out: Block[] = [];
  for (const body of commentBlocks(src, style)) {
    const text = body.split(/\s+/).filter(Boolean).join(" ");
    if (!text || DIRECTIVE.test(text)) continue;
    const sents = sentences(text);
    if (text.split(/\s+/).filter(Boolean).length >= 8 && sents.length) out.push([text, sents]);
  }
  return out;
}

// Two rules were built here and cut after sampling, because every hit was good prose. A count opener
// flagged "Five tiers, each buying you something the others cannot", where the count is the ruling
// and `coherence` already checks cardinality properly. A negation opener flagged "A percentage is not
// the answer", which is a strong opening line. Both cost more to clear than they saved. What survives
// fires on a real fault or not at all — a triage a reader learns to distrust is worse than none.
const OPENERS: Record<string, RegExp> = {
  pronoun: /^(?:it|they|this|these|those)\s+(?:is|are|was|were|arrives|carries|holds|has|have|makes|does|comes|goes|means|sits|lives)\b/i,
  defines: /^\w[\w\s`'-]{0,40}?\s+is\s+(?:what\s+happens|the\s+\w+\s+that\s+\w+s\b)/i,
};
const ABSTRACT = /\bthe (?:property|thing|point|reason|part) (?:that|which)\b|\bcomes down to\b|\bis always the\b/gi;
// Metaphor doing real work. Kept short and literal — a long guess list produces noise a reader then
// has to clear, which costs more than it saves.
const METAPHOR = /\b(?:fates?|degrade[sd]? into|centre of gravity|center of gravity|lifeblood|heartbeat|marriage of|wedded to|a home for|breathes?)\b/i;

const FAULTS = ["idiom", "opener", "abstract", "metaphor"];

/**
 * Prose blocks, each with its sentences. `proseOf` has already removed every code block, table row,
 * heading and rail, so what is left is what a reader actually reads.
 */
export function paragraphs(raw: string): Block[] {
  const out: Block[] = [];
  for (const block of proseOf(raw, false).split(BLOCK_BREAK)) {
    const sents = sentences(block);
    if (sents.length) out.push([block.split(/\s+/).filter(Boolean).join(" "), sents]);
  }
  return out;
}

/**
 * Which of the detectable faults this paragraph carries, and why — the reason is what a rewriting
 * agent is given, so it never has to re-derive the finding.
 */
export function score(block: string, sents: Sentence[]): Record<string, string> {
  const found: Record<string, string> = {};
  const clean = block.replace(MARKED, " ");
  const idioms = [...new Set([...clean.matchAll(IDIOM)].map((m) => m[1].toLowerCase()))].sort();
  if (idioms.length) found.idiom = idioms.join(" · ");
  const first = sents[0][0];
  const hits = Object.entries(OPENERS).filter(([, pattern]) => pattern.test(first)).map(([name]) => name);
  if (hits.length) found.opener = `${hits.join(" + ")} — "${opening(first, 8)}"`;
  const abstract = [...clean.matchAll(ABSTRACT)].map((m) => m[0].trim().toLowerCase());
  if (abstract.length) found.abstract = [...new Set(abstract)].sort().join(" · ");
  const metaphor = METAPHOR.exec(clean);
  if (metaphor) found.metaphor = metaphor[0].toLowerCase();
  return found;
}

/**
 * A child path that keeps the root's own spelling.
 *
 * `join` NORMALISES, AND THE REPORT IS A LIST OF PATHS. `join(".", "CLAUDE.md")` is `CLAUDE.md`,
 * where Python's `os.path.join` gives `./CLAUDE.md` — so run over `.`, which is how the tool is
 * almost always invoked, every path in the report differed from the incumbent's by a prefix. The
 * finding was the same and the line was not, which is enough to break a diff nobody can re-check by
 * eye.
 */
function under(dir: string, entry: string): string {
  return dir.endsWith("/") ? `${dir}${entry}` : `${dir}/${entry}`;
}

/** Markdown always; source files too when comments are in scope. */
export function* filesUnder(roots: string[], comments = false): Generator<string> {
  for (const root of roots) {
    let stat;
    try { stat = statSync(root); } catch { continue; }
    if (stat.isFile()) { yield root; continue; }
    const walk = function* (dir: string): Generator<string> {
      let entries: string[];
      try { entries = readdirSync(dir).sort(); } catch { return; }
      const folders: string[] = [];
      for (const entry of entries) {
        const full = under(dir, entry);
        let entryStat;
        try { entryStat = statSync(full); } catch { continue; }
        if (entryStat.isDirectory()) {
          if (!SKIP_DIR.has(entry) && !entry.startsWith(".")) folders.push(full);
          continue;
        }
        if (entry.endsWith(".md") && !SKIP_FILE.test(entry)) yield full;
        else if (comments && CODE_EXT[extname(entry)]) yield full;
      }
      for (const folder of folders) yield* walk(folder);
    };
    yield* walk(root);
  }
}

function digest(path: string): string {
  try { return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16); }
  catch { return ""; }
}

type Row = [path: string, blocks: number, sentences: number, flagged: Array<[string, Sentence[], Record<string, string>]>];

function survey(roots: string[], done: Set<string>, comments: boolean): [Row[], number] {
  const rows: Row[] = [];
  let skipped = 0;
  for (const path of filesUnder(roots, comments)) {
    const raw = read(path);
    if (done.has(digest(path))) { skipped += 1; continue; }
    const style = CODE_EXT[extname(path)];
    const blocks = style ? proseComments(path, style) : paragraphs(raw);
    const flagged = blocks.map(([b, s]) => [b, s, score(b, s)] as [string, Sentence[], Record<string, string>])
      .filter(([, , found]) => Object.keys(found).length);
    if (blocks.length)
      rows.push([path, blocks.length, blocks.reduce((sum, [, s]) => sum + s.length, 0), flagged]);
  }
  return [rows, skipped];
}

export function main(argv: string[]): number {
  const args = argv.filter((a) => !a.startsWith("--"));
  const flags = argv.filter((a) => a.startsWith("--"));
  const opt: Record<string, string | true> = {};
  for (const flag of flags) {
    const at = flag.indexOf("=");
    if (at >= 0) opt[flag.slice(0, at)] = flag.slice(at + 1);
    else opt[flag] = true;
  }
  const roots = args.length ? args : ["."];
  let done = new Set<string>();
  const ledger = opt["--ledger"];
  if (typeof ledger === "string" && isFile(ledger))
    done = new Set(read(ledger).split("\n").filter((line) => line.trim()).map((line) => line.split(/\s+/)[0]));

  const comments = Boolean(opt["--comments"]);
  if (opt["--paragraphs"]) {
    for (const path of filesUnder(roots, comments)) {
      const style = CODE_EXT[extname(path)];
      const blocks = style ? proseComments(path, style) : paragraphs(read(path));
      for (const [block, sents] of blocks) {
        const found = score(block, sents);
        if (!Object.keys(found).length) continue;
        console.log(`\n--- ${path}  [${Object.entries(found).map(([k, v]) => `${k}: ${v}`).join(" · ")}]`);
        console.log(block);
      }
    }
    return 0;
  }

  const [rows, skipped] = survey(roots, done, comments);
  // Stable, so files with equal counts keep the order they were walked in.
  const ordered = rows.map((row, index) => ({ row, index }))
    .sort((a, b) => (b.row[3].length - a.row[3].length) || (a.index - b.index)).map((r) => r.row);
  const totalParagraphs = ordered.reduce((sum, r) => sum + r[1], 0);
  const totalSentences = ordered.reduce((sum, r) => sum + r[2], 0);
  const flaggedParagraphs = ordered.reduce((sum, r) => sum + r[3].length, 0);
  const withAny = ordered.filter((r) => r[3].length);
  const tally: Record<string, number> = Object.fromEntries(FAULTS.map((f) => [f, 0]));
  for (const [, , , flagged] of ordered)
    for (const [, , found] of flagged)
      for (const key of Object.keys(found)) tally[key] += 1;

  console.log("file".padEnd(64) + "paras".padStart(7) + "flagged".padStart(9));
  for (const [path, blocks, , flagged] of withAny.slice(0, 25))
    console.log(path.slice(-63).padEnd(64) + String(blocks).padStart(7) + String(flagged.length).padStart(9));
  if (withAny.length > 25) console.log(`... and ${withAny.length - 25} more files with candidates`);
  console.log();
  console.log(`  scanned        ${ordered.length} files · ${totalParagraphs} paragraphs · ${totalSentences} sentences`);
  if (skipped) console.log(`  skipped        ${skipped} files already recorded in the ledger`);
  console.log(`  candidates     ${flaggedParagraphs} paragraphs in ${withAny.length} files ` +
    `— ${Math.floor((100 * flaggedParagraphs) / Math.max(totalParagraphs, 1))} % of paragraphs`);
  console.log(`  by fault       ` + FAULTS.map((k) => `${k} ${tally[k]}`).join(" · "));
  console.log();
  console.log("  A reader still owns the three faults no pattern can see: a claim compressed past");
  console.log("  reading, a rule that never says what to do, and an abstraction that is merely dull.");
  console.log("  So this narrows the reading. It does not replace it.");

  const record = opt["--record"];
  if (typeof record === "string") {
    for (const [path] of ordered) appendFileSync(record, `${digest(path)}  ${path}\n`);
    console.log(`\n  recorded ${ordered.length} file hashes to ${record}`);
  }
  return 0;
}

if (process.argv[1] && basename(process.argv[1]) === "prose-triage.ts")
  process.exit(main(process.argv.slice(2)));
