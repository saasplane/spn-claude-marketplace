// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Every block has a rule · § Prose and lists have limits · § A page is written in two passes
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// Where a paragraph should have been a block: each paragraph, list and callout is held to its block's limit. Every finding is SOFT and names the block.
//
//   a paragraph past its page kind's bound                        a subsection or a table
//   a paragraph that lists three or more parallel items           a list, or a table of item cells
//   a paragraph that compares today and after                     a table with a Today and a Proposed column
//   steps written as prose                                        a numbered list, a chain or a flowchart
//   a sentence with three or more code spans                      a list, a table or a FILE frame
//   a list past seven items, or an item of 25 words or more        a table of item cells
//   a callout that is more than one sentence                      a paragraph, with the rule in one sentence

import { basename } from "node:path";

export type Finding = [severity: string, message: string];

/** The page kinds whose prose is bounded, and the bound each holds. */
export type FitKind = "preview" | "approach" | "hub" | "overview" | "construct" | "report" | "guide" | "seat";

/** The bounds of a page kind: a paragraph in words (beside another block, and as its part's only content), a list's items and each item's words, a callout's sentences. */
export type Bound = { beside: number; alone: number; items: number; itemWords: number; callout: number };
const SHORT: Bound = { beside: 60, alone: 120, items: 7, itemWords: 25, callout: 1 };
const EXPLAINING: Bound = { beside: 120, alone: 200, items: 10, itemWords: 60, callout: 3 };
export const BOUNDS: Record<FitKind, Bound> = {
  // A preview and an approach page argue in short reasons, so they hold the book's limits (RULE.DEVEX.WORKSPACE.522).
  preview: SHORT,
  approach: SHORT,
  // A page that explains a thing carries a claim with its grounds, so a paragraph runs to twice that and a list or a callout a little past it.
  hub: EXPLAINING,
  overview: EXPLAINING,
  construct: EXPLAINING,
  report: EXPLAINING,
  guide: EXPLAINING,
  seat: EXPLAINING,
};
export const CODE_NAMES = 2;
/** The check reads a run of this many code names joined by commas or "and", or this many in one sentence, as the limit broken. */
export const RUN_LIST = 4;
export const SPREAD_TABLE = 5;

/** The page kind a path is, or null where the content is not held to the page-kind bounds. */
export function fitKind(path: string): FitKind | null {
  const base = basename(path);
  if (/(?:^|[\\/])notes[\\/][^\\/]+[\\/](?:arc|preview)\.html$/.test(path) || /-preview\.html$/.test(base) || base === "preview.html" || base === "arc.html") return "preview";
  if (base === "approach.html" || base.endsWith("-approach.html")) return "approach";
  if (base.endsWith("-overview.html")) return "overview";
  // A construct page is produced from its seat file, which is read in its place.
  if (base.endsWith("-report.html") || /^report-/.test(base)) return "report";
  if (base.endsWith("-guide.html")) return "guide";
  if (/(?:^|[\\/])hub\.html$|-hub\.html$/.test(path) || base === "index.html" && /[\\/]artifacts[\\/]docs[\\/]index\.html$/.test(path)) return "hub";
  return null;
}

type Unit =
  | { kind: "p"; text: string; part: Part }
  | { kind: "list"; items: string[]; part: Part }
  | { kind: "callout"; text: string; part: Part };
type Part = { name: string; other: boolean };

const entity = (s: string): string => s.replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&rarr;/g, "→").replace(/&larr;/g, "←").replace(/&middot;/g, "·")
  .replace(/&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#\d+;|&[a-z]+;/g, " ");

/** Inline html to plain text, a code span kept as `x`. */
const plain = (html: string): string => entity(html.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner: string) => "`" + inner.replace(/<[^>]+>/g, "") + "`").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const wordsOf = (s: string): string[] => s.replace(/`/g, " ").split(/\s+/).filter((one) => /[\p{L}\p{N}]/u.test(one));
const countWords = (s: string): number => wordsOf(s).length;

/** A paragraph that is a fact, a caption or a lead-in is small type, and carries none of these limits. */
const SMALL_P = /class="[^"]*\b(?:sds-small|sds-standfirst|sds-eyebrow|sds-caption|sds-fact|sds-more|sds-direction|sds-title|sds-number|dl-[a-z-]+)\b/;

function unitsOfHtml(text: string): Unit[] {
  let t = text.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|svg|nav|template|head)\b[\s\S]*?<\/\1>/gi, " ");
  // A table, a figure, a code block and a tile are blocks of their own: kept as a marker, never read for prose.
  t = t.replace(/<(table|figure|pre|details)\b[\s\S]*?<\/\1>/gi, "\x01");
  t = t.replace(/<div class="sds-prose"[\s\S]*?<\/div>\s*(?=<(?:h[1-6]|p|div|section|\/section)\b|$)/gi, "\x01");
  t = t.replace(/<div class="sds-tile[^"]*"[\s\S]*?<\/div>/gi, "\x01");
  t = t.replace(/<div class="sds-nextnav"[\s\S]*?<\/div>/gi, "\x01");
  const out: Unit[] = [];
  let part: Part = { name: "", other: false };
  const token = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>|<div class="sds-pull"[^>]*>([\s\S]*?)<\/div>|<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>|<(ul|ol)\b[^>]*>([\s\S]*?)<\/\5>|<p\b([^>]*)>([\s\S]*?)<\/p>|\x01/gi;
  const held: Unit[] = [];
  for (let found = token.exec(t); found; found = token.exec(t)) {
    if (found[1]) { if (Number(found[1]) <= 4) { flushPart(held, out, part); part = { name: plain(found[2]), other: false }; } continue; }
    if (found[3] !== undefined || found[4] !== undefined) { part.other = true; held.push({ kind: "callout", text: plain(found[3] ?? found[4]), part }); continue; }
    if (found[5]) {
      part.other = true;
      const items = [...found[6].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => plain(li[1]));
      held.push({ kind: "list", items, part });
      continue;
    }
    if (found[8] !== undefined) {
      if (SMALL_P.test(found[7] ?? "")) continue;
      const body = plain(found[8]);
      if (!body || /\{\{/.test(body)) continue;
      held.push({ kind: "p", text: body, part });
      continue;
    }
    part.other = true; // a marker
  }
  flushPart(held, out, part);
  return out;
}

/** A part's units go out once the part is whole, so each knows whether another block sits beside it. */
function flushPart(held: Unit[], out: Unit[], _part: Part): void {
  out.push(...held.splice(0));
}

function unitsOfMarkdown(text: string): Unit[] {
  const lines = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const out: Unit[] = [];
  let part: Part = { name: "", other: false };
  let para: string[] = [];
  const flush = () => { if (para.length) { const body = para.join(" ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim(); if (body) out.push({ kind: "p", text: body, part }); para = []; } };
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at];
    if (/^```/.test(line)) { flush(); part.other = true; at += 1; while (at < lines.length && !/^```/.test(lines[at])) at += 1; continue; }
    if (/^#{1,4}\s/.test(line)) { flush(); if (/^#{2,4}\s/.test(line)) part = { name: line.replace(/^#+\s*/, ""), other: false }; continue; }
    if (/^\s*\|/.test(line)) { flush(); part.other = true; continue; }
    if (/^\s*>\s?/.test(line)) { flush(); part.other = true; const q = [line.replace(/^\s*>\s?/, "")]; while (at + 1 < lines.length && /^\s*>\s?/.test(lines[at + 1])) { at += 1; q.push(lines[at].replace(/^\s*>\s?/, "")); } if (!/^\s*\[!/.test(q[0])) out.push({ kind: "callout", text: q.join(" ").replace(/\*\*/g, ""), part }); continue; }
    if (/^\s*(?:[-*]|\d+[.)])\s/.test(line)) {
      flush(); part.other = true;
      const items = [line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")];
      while (at + 1 < lines.length && (/^\s*(?:[-*]|\d+[.)])\s/.test(lines[at + 1]) || /^\s{2,}\S/.test(lines[at + 1]))) {
        at += 1;
        if (/^\s*(?:[-*]|\d+[.)])\s/.test(lines[at])) items.push(lines[at].replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")); else items[items.length - 1] += ` ${lines[at].trim()}`;
      }
      out.push({ kind: "list", items: items.map((one) => one.replace(/\*\*/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")), part });
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    if (/^\s*📖|^`Lenses:/.test(line)) { flush(); continue; }
    para.push(line.trim());
  }
  flush();
  return out;
}

const SENTENCE = /(?<=[.!?])\s+(?=[A-Z"'`*(\[<])/;
const sentencesOf = (s: string): string[] => s.split(SENTENCE).map((one) => one.trim()).filter(Boolean);
const codeSpans = (s: string): string[] => [...s.matchAll(/`([^`\n]+)`/g)].map((one) => one[1]);
const lead = (s: string): string => `"${s.split(/\s+/).slice(0, 12).join(" ")}…"`;

const STEP_WORD = /^(?:first|second|third|then|next|after that|finally|lastly|secondly)\b/i;
/** Steps in prose: a sentence that opens First, followed by one that opens Then, Next or Second, or three sentences that open on a step word. */
function stepsInProse(sents: string[]): boolean {
  const opens = sents.map((one) => STEP_WORD.test(one));
  if (opens.filter(Boolean).length >= 3) return true;
  return sents.some((one, at) => /^first\b/i.test(one) && at + 1 < sents.length && /^(?:then|next|second|secondly|after that)\b/i.test(sents[at + 1]));
}
const NUMBERED_INLINE = /\(\s*(?:1|a|i)\s*\)[^()]{3,}\(\s*(?:2|b|ii)\s*\)/i;
/** Two states compared in prose: today named, and the proposed state named in the same paragraph. */
const COMPARE_PROSE = /\btoday\b[\s\S]*?\b(?:proposed|after the change|from now on|would become|will become|will read|will say)\b|\b(?:proposed|after the change)\b[\s\S]*?\btoday\b/i;
const PARALLEL_ORDINALS = /\bfirst\b[^.!?]*[;,.]\s*(?:the\s+)?second\b[\s\S]*?\bthird\b/i;

/**
 * Parallel items in a sentence: after a colon, four or more noun phrases of up to four words (two of them of two words or more), or three of two or three words,
 * with nothing after the last; or three or more clauses joined by semicolons, each of three words or more.
 */
function parallelItems(sentence: string): number {
  const bare = sentence.replace(/\([^)]*\)/g, "").replace(/`[^`]*`/g, "X");
  const colon = bare.indexOf(":");
  if (colon >= 0) {
    const parts = bare.slice(colon + 1).replace(/[.!?]\s*$/, "").split(/;\s*|,\s*(?:and\s+|or\s+)?|\s+(?:and|or)\s+/).map((one) => one.trim()).filter(Boolean);
    const sizes = parts.map(countWords);
    if (((parts.length >= 4 && sizes.every((n) => n >= 1 && n <= 4) && sizes.filter((n) => n >= 2).length >= 2) || (parts.length === 3 && sizes.every((n) => n >= 2 && n <= 3))) && !/[.!?]\s+\S/.test(bare.slice(colon + 1)) && !parts.some((one) => /^(?:which|that|who|then|so|but|where)\b/i.test(one))) return parts.length;
  }
  const clauses = bare.split(/;\s*/).filter((one) => countWords(one) >= 3);
  return clauses.length >= 3 && clauses.length === bare.split(/;\s*/).length ? clauses.length : 0;
}

/** The most code names joined in one run by commas, "and", "or" or a middot, and the most in the whole sentence. */
function codeRun(sentence: string): [run: number, all: number] {
  const spans = [...sentence.matchAll(/`[^`\n]+`/g)];
  let run = spans.length ? 1 : 0, best = run;
  for (let at = 1; at < spans.length; at += 1) {
    const between = sentence.slice((spans[at - 1].index ?? 0) + spans[at - 1][0].length, spans[at].index ?? 0);
    run = /^\s*(?:,|·|\/|and|or|,\s*and|,\s*or|,\s*\x2D)?\s*$/i.test(between) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return [best, spans.length];
}

/** A name that reads as a condition, a question or a case: it starts with a lower-case article or question word, or with a digit. */
export const readsAsCondition = (name: string): boolean => /^(?:a|an|the|how|when|if|what)\s/.test(name.trim().replace(/^[`*_]+/, "")) || /^\d/.test(name.trim().replace(/^[`*_]+/, ""));

const CONDITIONS = "a first column of conditions is a table (rule 549)";
export const HAND_WRITTEN_CARDS = "this card block is hand-written without the writer's attributes, so its rows will not line up: use a table, or the writer's markup";

/** Card blocks written by hand in html: item headings that read as conditions, and facts in a block the writer did not emit. */
function tileFindings(text: string): Finding[] {
  const t = text.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ");
  const out: Finding[] = [];
  for (const block of t.matchAll(/<div\b([^>]*\bclass="[^"]*\bsds-tiles\b[^"]*"[^>]*)>([\s\S]*?)(?=<div\b[^>]*\bclass="[^"]*\bsds-tiles\b|<\/section>|$)/gi)) {
    const attrs = block[1];
    const tiles = [...block[2].matchAll(/<div\b([^>]*\bclass="[^"]*\bsds-tile\b(?!s|-)[^"]*"[^>]*)>([\s\S]*?)(?=<div\b[^>]*\bclass="[^"]*\bsds-tile\b(?!s|-)|<\/section>|$)/gi)];
    const heads = tiles.map((tile) => plain(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(tile[2])?.[1] ?? "")).filter(Boolean);
    const first = heads.find(readsAsCondition);
    if (first) out.push(["SOFT", `a card block whose item "${first}" reads as a condition: ${CONDITIONS}`]);
    const withFacts = tiles.filter((tile) => /\bsds-tile-facts\b/.test(tile[2]));
    const noLayout = !/\bdata-layout=/.test(attrs);
    const noFacts = /\bdata-layout="GRID"/.test(attrs) && withFacts.some((tile) => !/\bdata-facts=/.test(tile[1]));
    if (withFacts.length && (noLayout || noFacts)) out.push(["SOFT", HAND_WRITTEN_CARDS]);
  }
  return out;
}

/** The shared script's `TREE_LINE` and `isTree` (src/styles/sds-docs.js), copied: a block of lines that opens on a folder and whose every line is a path with a branch and an optional note. */
const TREE_LINE = /^([\s\u2502\u251c\u2514\u252c\u2500|`+\\-]*?)([^\s\u2502\u251c\u2514\u252c\u2500]\S*)(?:(\s{2,})(\S.*))?$/;
export function isTree(code: string): boolean {
  const lines = code.replace(/\n+$/, "").split("\n");
  if (!lines.length || !/\/$/.test(lines[0].trim())) return false;
  return lines.every((line) => !line.trim() || TREE_LINE.test(line));
}
export const BARE_TREE = "this block is a tree: mark it `<pre data-lang=\"tree\">` so the script colours it (rule 238)";

/** A `<pre>` with no `data-lang` whose text reads as a tree: the shared script colours only a block it is told is one. */
function treeFindings(text: string): Finding[] {
  const t = text.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ");
  const out: Finding[] = [];
  for (const pre of t.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi)) {
    if (/\bdata-lang=/.test(pre[1])) continue;
    if (pre[2].includes("<")) continue; // already marked up: the script leaves it
    if (isTree(entity(pre[2]))) out.push(["SOFT", BARE_TREE]);
  }
  return out;
}

export type FitOptions = { kind: FitKind };

/** The findings for one page's content. */
export function blockFit(text: string, isHtml: boolean, kind: FitKind): Finding[] {
  const units = isHtml ? unitsOfHtml(text) : unitsOfMarkdown(text);
  const out: Finding[] = isHtml ? [...tileFindings(text), ...treeFindings(text)] : [];
  const bound = BOUNDS[kind];
  for (const unit of units) {
    if (unit.kind === "callout") {
      if (sentencesOf(unit.text).length > bound.callout)
        out.push(["SOFT", `a callout of ${sentencesOf(unit.text).length} sentences, ${lead(unit.text)} — a callout of a ${kind} page is ${bound.callout === 1 ? "one sentence" : `at most ${bound.callout} sentences`} (RULE.DEVEX.WORKSPACE.530) · keep the rule in one sentence and put the reason in a paragraph under it`]);
      continue;
    }
    if (unit.kind === "list") {
      const long = unit.items.filter((item) => countWords(item) >= bound.itemWords);
      if (unit.items.length > bound.items)
        out.push(["SOFT", `a list of ${unit.items.length} items, ${lead(unit.items[0])} — a list holds at most ${bound.items} (RULE.DEVEX.WORKSPACE.530) · make it a table of item cells`]);
      else if (long.length)
        out.push(["SOFT", `a list with ${long.length} item${long.length === 1 ? "" : "s"} of ${bound.itemWords} words or more, ${lead(long[0])} — a list item is under ${bound.itemWords} words (RULE.DEVEX.WORKSPACE.530) · make it a table of item cells`]);
      continue;
    }
    const n = countWords(unit.text);
    const limit = unit.part.other ? bound.beside : bound.alone;
    if (n > limit)
      out.push(["SOFT", `a paragraph of ${n} words, ${lead(unit.text)} — ${kind} pages hold a paragraph to ${limit} words${unit.part.other ? " beside another block" : " where it is the part's only content"} (RULE.DEVEX.WORKSPACE.531) · split it into subsections, or make what it holds a table`]);
    const sents = sentencesOf(unit.text);
    const listed = sents.find((one) => parallelItems(one) >= 3);
    if (listed)
      out.push(["SOFT", `a paragraph that lists ${parallelItems(listed)} parallel items, ${lead(listed)} — parallel things are a list, or a table of item cells (RULE.DEVEX.WORKSPACE.530)`]);
    else if (PARALLEL_ORDINALS.test(unit.text))
      out.push(["SOFT", `a paragraph that counts its items (first, second, third), ${lead(unit.text)} — parallel things are a list, or a table of item cells (RULE.DEVEX.WORKSPACE.530)`]);
    if (COMPARE_PROSE.test(unit.text))
      out.push(["SOFT", `a paragraph that compares today and after, ${lead(unit.text)} — two states compared are a table with a Today and a Proposed column (RULE.DEVEX.WORKSPACE.530)`]);
    if (stepsInProse(sents) || NUMBERED_INLINE.test(unit.text))
      out.push(["SOFT", `steps written as prose, ${lead(unit.text)} — steps are a numbered list, a chain where the path never turns, or a flowchart where it does (RULE.DEVEX.WORKSPACE.530)`]);
    const crowded = sents.find((one) => { const [run, all] = codeRun(one); return run >= RUN_LIST || all >= SPREAD_TABLE; });
    if (crowded)
      out.push(["SOFT", `a sentence with ${codeRun(crowded)[1]} code names, ${lead(crowded)} — a sentence names at most ${CODE_NAMES}; a run of four joined by commas is a list, and five in a sentence are a table or a FILE frame (RULE.DEVEX.WORKSPACE.530)`]);
  }
  return out;
}
