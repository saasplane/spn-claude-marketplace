#!/usr/bin/env node
// RESTATES: the foundation book — 02-document.md rule 9 (RD.GOV.008), rules 11-12 (RD.DOCS.031, the
// one voice; RD.DOCS.043, its reach and its measure; RD.DOCS.044, the three moves that reach the
// reader), 04-discipline.md § Voice discipline, 05-artifacts.md (the approach document) and
// 06-registers.md § Writing a row. The chapters are the source of truth: a rule change is edited
// there first, then here, in the same change. This script checks only what a script CAN check; the
// register itself is judgement.
//
// Calibrated to the rule, never to the corpus (RD.DOCS.043: the check reads the row's numbers, never
// the corpus's own average). Over prose only — records are exempt, headings and derived chrome are
// not prose — the numbers are:
//
//   around fifteen words a sentence   an average past 18 is SOFT; past 24 is RULE
//   none past thirty                  any sentence past 30 words is RULE
//   *you* present                     8+ sentences with no second person is RULE;
//                                     fewer than one *you* in twelve sentences is SOFT
//   a register row stays a record     a cell sentence past 25 words is RULE, and so is a bare
//                                     *you* inside a row — a record is never warmed
//   the seat's share of reach         a share under the bar is SOFT: 25 % on a README face and
//                                     15 % on every other seat
//
// Reach is the share of prose sentences that reach the reader by any of the three moves, and a share
// is what you measure — an occurrence count falls every time a long sentence is split. Every reach
// finding is SOFT for now: the corpus is swept for length, not yet for reach.
//
// A finding is a finding whatever the file's age. The fix is one of four moves — split it, say *you*,
// define the term, land it on your reader — never a shorter sentence.
//
//   hook   :  node doc-check.ts --stdin          (one file, from PreToolUse JSON on stdin)
//   writes :  node doc-check.ts --bash-writes    (every path a Bash command writes, one per line)
//   sweep  :  node doc-check.ts <path> [...]     (findings per file, then the rates per root)
//   rates  :  node doc-check.ts --summary <path> (the rates only — the number a tranche moves)
//
// PORTED FROM `hooks/scripts/doc-check.py`. Its median was 0.09 ms because a file kind that does not
// match exits at once, and the audit named it the model the other checks should follow.
//
// ONE DIFFERENCE THE PORT HAD TO MAKE. Python's `\w` is unicode-aware and JavaScript's is ASCII, so
// every word count would have dropped a word carrying an accent. The token test here is an explicit
// unicode class, which is what Python was doing all along.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { basename, dirname, join, resolve, relative, sep } from "node:path";
import { emit, readPayload, runAlone, unescape, type Payload, type Verdict } from "../lib/payload.ts";

export type Finding = [severity: string, message: string];

const slashes = (path: string) => path.split(sep).join("/");

// Only sets that GROW. RD.GOV.008 keeps the count where it carries a ruling: "if adding a member
// would be an ordinary decision entry, drop the count; if it would be a redesign, keep it." Scopes,
// kinds, nouns, flows, seats and lenses are closed by a decision — a count there is load-bearing and
// must not be flagged. Decisions, findings and open items are not.
const CARD = new RegExp(
  "\\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|" +
  "fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\\s+" +
  "(decisions|items|questions|findings|blockers|gaps|defects|open items|todos|tasks)\\b", "gi");
// RD.DOCS.049 — a check reads how a phrase is used, never that it appeared. The four idioms here are
// impersonal obligation and have no innocent use. `the reader` is different in kind: it is an
// ordinary noun phrase, and every one of the ten occurrences this corpus carried was legitimate. So
// it counts only in the obligation form, which is the construction the rule is named after.
const ABOUT = new RegExp(
  "\\b(the reader\\s+(?:must|should|needs?\\s+to|is\\s+expected)|" +
  // `one` is a pronoun as often as it is an impersonal subject, and the obligation form is the only
  // one this rule is named after. `a change to one must not force a redeploy of another` counts one
  // module, and read as a breach it asked a page to be rewritten away from what it meant.
  "(?<!\\b(?:to|of|in|on|at|for|from|than|with|and|or|but|is|as|only|than)\\s)one (?:must|should)|" +
  "the user is expected|it is recommended that)\\b", "gi");
// RD.DOCS.052 — an idiom means something its words do not say, so a reader whose first language is
// not English cannot guess it. Length limits do not catch one, because an idiom is usually short.
// The house-term rule does not catch one either, because nobody defines an idiom. Listed rather than
// inferred: a phrase earns its place here only when its meaning is not its words.
// Ruled out by the developer 2026-09-07 and deliberately absent: `by hand`, `baked in`, `day one`,
// `from scratch`, `sanity check`. All are ordinary engineering English. `paved road` and `front door`
// were both listed here and both removed: the book defines them, so they are vocabulary a reader is
// taught. Check for a definition before adding a phrase.
const IDIOMS = ["say the word", "earns its keep", "earn its keep", "at first glance", "boils down to",
  "boil down to", "out of the box", "under the hood", "hand in hand", "on the hook",
  "low-hanging fruit", "rule of thumb", "in the wild", "cuts both ways",
  "cut both ways", "a far cry", "the whole point", "goes stale", "go stale", "went stale",
  "falls over", "fall over", "moving parts", "off the shelf", "the elephant in", "moving the needle",
  "across the board", "on the fly", "hard and fast", "grey area", "gray area", "chicken and egg",
  "bells and whistles", "in the weeds", "the lay of the land", "more often than not",
  "by and large", "for good measure", "the jury is out", "reads like", "read like",
  "a build log", "nail down", "nails down", "pin down", "pins down", "hold water",
  "holds water", "rings true", "ring true", "as it stands", "give or take"];
export const IDIOM = new RegExp(
  "(?<![a-z])(" + IDIOMS.map((i) => i.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![a-z])", "gi");

// A rule has to be able to quote the mistake it bans. The corpus marks a quoted counter-example the
// way it marks any term — italics or backticks — so both are blanked before CARD and ABOUT run.
const QUOTE_L = "\x02", QUOTE_R = "\x03";
export const MARKED = /\x02[^\x03\n]{0,200}\x03|\*[^*\n]{1,120}\*|`[^`\n]*`|“[^”\n]{1,120}”|"[^"\n]{1,120}"/g;

// RD.DOCS.043 — the measure. Second person is whole-word and case-insensitive. Longest form first, or
// `your` claims the front of `yours` and the rest never matches.
// A sentence that reaches ONLY because a bare `… <prep> you` was appended to it satisfies the counter
// and gives the reader nothing (RD.DOCS.046). Detection is exact: strip the phrase and ask whether
// what remains still reaches.
const BOLT = /(?:,\s*)?\s(?:for|to|on|with|around|before|beneath)\s+you\b\s*(?=[.!?;]|$)/i;
// TWO SPELLINGS OF ONE PATTERN, AND THE REASON IS A REAL BUG THIS PORT HAD. A global regex carries a
// `lastIndex` that `.test()` advances and never resets, so testing a list of sentences with one
// global regex passes the first, resumes mid-string on the second, and misses matches at random. The
// reach share came out one to two points low across the whole corpus until the corpus diff caught it.
// So: `YOU` asks the question, `YOU_ALL` counts the answers, and nothing asks with a global.
const YOU_SOURCE = "\\b(?:you['’](?:re|ll|ve)|yourselves|yourself|yours|your|you)\\b";
const YOU = new RegExp(YOU_SOURCE, "i");
const YOU_ALL = new RegExp(YOU_SOURCE, "gi");
// A row may MENTION the word as a term — *you* in italics, or in backticks — and that is not warming.
// RD.DOCS.049 — the marking is how a check tells quotation from breach. This exempted the bare word
// in italics and any code span, and missed the shape this corpus actually quotes in: a WHOLE PHRASE
// in italics or quotation marks. Two rows carried one — a developer's own sentence, and another
// document's phrase cited as the thing the row corrects — and both read as the row warming its
// reader when neither does.
//
// IT ANCHORS ON THE WORD, AND THAT IS WHY IT IS WRITTEN THIS WAY. Stripping every marked span
// instead is what the general `MARKED` does, and on a row it is wrong: `**reader.**` leaves an
// unpaired `*`, which then pairs with the opening `*` of a later `*you*` and EXPOSES the word the
// marking was protecting. Requiring the word inside the span makes that pairing impossible.
const YOU_WORD = "you(?:['’](?:re|ll|ve)|rself|rs|r)?";
const YOU_AS_TERM = new RegExp(
  `\\*[^*\\n]{0,200}?\\b${YOU_WORD}\\b[^*\\n]{0,200}?\\*` + "|" +
  `"[^"\\n]{0,200}?\\b${YOU_WORD}\\b[^"\\n]{0,200}?"` + "|" +
  `“[^”\\n]{0,200}?\\b${YOU_WORD}\\b[^”\\n]{0,200}?”` + "|" +
  "`[^`]*`", "gi");
// `ROW_LONG` is the ONE length rule the book kept, and it is a register row's shape rather than a
// count of prose: one clause a sentence, because a row is a record. The prose measures that stood
// beside it — an average, a thirty-word cap, and a `you` frequency — were dropped by the book and
// are gone from here (`RD.DOCS.043` as `01-corpus.md` and `04-discipline.md` now state it).
const ROW_LONG = 25;
// Reported in the sweep's statistics table, never as a finding. A number is evidence you cite and
// never the verdict you reach.
const PAST_25 = 25, PAST_30 = 30;

// RD.DOCS.044 — reaching the reader has three moves, and a script sees two of them: the reader as
// subject, which YOU already finds, and the imperative, which opens the sentence with its verb. The
// beneficiary clause is judgement, so the number a script produces is a FLOOR. The verb list is
// closed and deliberately short — every member is a word this corpus almost never opens a sentence
// with as a noun, which is why `state`, `name`, `report` and `list` are absent.
const IMPERATIVE_VERBS =
  "add|apply|ask|avoid|choose|cite|configure|convene|copy|create|declare|" +
  "define|delete|edit|find|fix|follow|generate|give|keep|leave|load|" +
  "look|make|open|pass|prefer|prove|put|read|regenerate|remove|resolve|run|" +
  "say|scaffold|see|send|set|skip|split|start|stop|take|treat|use|verify|" +
  "wear|write|pick|hold|derive|conflate|scatter|compose|mount|expect|assume|refuse|" +
  "enable|purge|validate|authorize|perform|expose|convert|reuse|" +
  "hoist|attach|throw|modify|exercise|stub|serve|invoke|reload|ensure|" +
  "replace|exclude|deregister|unregister|retire|converge|begin|nest|consider|" +
  "include|deploy|recreate|confirm|adopt|bind|populate|realize|aim|scan";
// Many real imperatives open with a word that is also a common noun, so a closed list either misses
// them or scores a noun subject as reaching. The discriminator is what FOLLOWS: an imperative takes an
// object straight away, while a noun subject carries its own verb. "State the consequence" instructs;
// "State machines are declared" does not.
const IMPERATIVE_AMBIGUOUS =
  "review|report|state|name|list|present|check|flag|draft|audit|record|number|register|" +
  "close|promote|group|branch|embed|plan|mark|design|order|process|test|log|link|reference|" +
  "access|address|comment|display|format|handle|label|model|place|question|release|request|" +
  "result|return|route|scope|search|section|service|source|stage|store|structure|support|" +
  "surface|target|trigger|type|value|version|view|watch|classify|restate|typecheck|" +
  "file|cache|match|batch|document|stack|build|return|point|join|seed|pin|let|split|" +
  "update|require|note|monitor|query|provision|install|export|sign";
const IMPERATIVE_OBJECT =
  "(?:the|this|that|these|those|each|every|any|all|a|an|your|its|their|it|" +
  "them|what|how|when|where|one|two|both)\\b";
const IMPERATIVE_NEGATIVE = "(?:never|always|do\\s+not|don't|don’t|avoid|prefer)\\s+[a-z]+";
const IMPERATIVE_LABEL = "(?:\\*\\*[^*\\n]{1,48}\\*\\*\\s*[:—-]\\s*)?";
const IMPERATIVE = new RegExp(
  "^[^A-Za-z]*" + IMPERATIVE_LABEL + "[^A-Za-z]*" +
  "(?:(?:" + IMPERATIVE_VERBS + ")\\b" +
  "|" + IMPERATIVE_NEGATIVE +
  "|(?:" + IMPERATIVE_AMBIGUOUS + ")\\s+" + IMPERATIVE_OBJECT +
  "|(?:" + IMPERATIVE_AMBIGUOUS + ")\\s*,\\s*(?:and\\s+)?(?:" + IMPERATIVE_VERBS + ")\\b)", "i");
// MUST-grammar is uppercase by rule, so the match is case-sensitive: a lowercase *may* is ordinary
// prose and excluding it would empty the denominator.
const NORMATIVE = /\b(?:MUST NOT|MUST|SHOULD NOT|SHOULD|MAY)\b/;
// The bar per seat, as a percentage. A register row has none — it is a record (RD.DOCS.043).
// RD.DOCS.045 — an artifact is read by the same developers who read a chapter, so it carries a
// chapter's share and not a higher one.
const REACH_BAR: Record<string, number> = { "artifact-html": 15, readme: 25, chapter: 15, concept: 15 };
const REACH_MIN_N = 8;

// RD.DOCS.040 — the suffix names the kind, and the set is closed.
const POCKET_KIND: Record<string, string> = { approaches: "-approach.html", overviews: "-overview.html" };
const NODE_MANIFESTS = ["spkind.json", "spinfrapkg.json"];
const SKIP = new Set(["node_modules", ".git", "dist", "build", "coverage", "tool-results", ".output", ".nx"]);

const MD_LINK = /!?\[([^\]]*)\]\([^)]*\)/g;
const MD_BLOCK_START = /^(?:#{1,6}\s|[-*+]\s|\d+[.)]\s)/;
const MD_HEADING = /^#{1,6}\s/;
const HTML_BLOCK_END = /<\/(?:p|h[1-6]|li|dt|dd|blockquote|figcaption|div|section|article|header|footer|nav|aside|summary|details)\s*>|<(?:br|hr)\b[^>]*>/gi;
const SENT_END = /(?<=[.!?])[)"'”’\]]*\s+/;
export const BLOCK_BREAK = /\n\s*\n/;
const TABLE_SEP = /^\|?\s*:?-{3,}/;

const read = (path: string): string => {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
};
const exists = (path: string): boolean => { try { return existsSync(path); } catch { return false; } };

// ---------------------------------------------------------------------------- structure

/** Placement errors a script CAN settle. Both are the wrong turn a partner takes first. */
export function structural(path: string): Finding[] {
  const out: Finding[] = [];
  const folder = dirname(resolve(path));
  const base = basename(path);

  // RD.DOCS.012 — a concept belongs to a repo root, never to a node.
  if (base === "CONCEPT.md") {
    const hasNode = NODE_MANIFESTS.some((m) => exists(join(folder, m)));
    if (hasNode && !exists(join(folder, "sprepo.json")))
      out.push(["BLOCK", "CONCEPT.md sits beside a node manifest — RD.DOCS.012: a concept " +
        "belongs to a repo root. Ideating a node lands as sections of its repo's concept, " +
        "never as a file at the node"]);
  }

  // RD.DOCS.040 — folder and suffix must agree.
  const parts = slashes(resolve(path)).split("/");
  if (parts.includes("artifacts") && base.endsWith(".html")) {
    const pocket = parts[parts.length - 2];
    const want = POCKET_KIND[pocket];
    if (want && !base.endsWith(want)) {
      const other = Object.entries(POCKET_KIND).find(([f]) => f !== pocket)?.[1] ?? "";
      const hint = base.endsWith(other)
        ? " — an overview explains, an approach argues; the test is whether options were weighed and one chosen"
        : "";
      out.push(["BLOCK", `${base} sits in ${pocket}/ but does not end ${want} — RD.DOCS.040: the suffix names the kind${hint}`]);
    }
  }
  return out;
}

// 05-artifacts.md § `How` has two halves — what is built, and what re-aligns. The chapter names the
// failure before it happens: *the document half is the one you are most likely to forget*.
// Recognised two ways, because a page may name the heading or just carry the table.
const HALF_HEADING = /<h[34]\b[^>]*>(?:(?!<\/h[34]>)[\s\S])*re-?align/i;
// RULE since workstream 008 closed. It was SOFT for one reason and the reason has gone: fifty pages
// would have fired the day it landed, and a gate nobody can get green is a gate everybody learns to
// scroll past. Approach pages no longer sit in a repository at all — they live in the workstream
// that argues them — and of the ten that exist, eight carry the heading. The two that do not are in
// CLOSED workstreams, which are records of a moment and are never rewritten.
const TWO_HALVES = "RULE";

/** The body of one `<h2>` section, to the next `<h2>`. */
function section(text: string, name: string): string | null {
  const found = new RegExp(
    `<h2\\b[^>]*>\\s*(?:<[^>]+>\\s*)*${name}\\b[\\s\\S]*?</h2>([\\s\\S]*?)(?=<h2\\b|$)`, "i").exec(text);
  return found ? found[1] : null;
}

/** `How` owes two tables: what is built, and which documents the design obliges. */
export function howHalves(text: string): Finding[] {
  const body = section(text, "How");
  if (body === null) return [];
  // THE TABLE COUNT WAS A FALSE NEGATIVE, and a large one. Allowing "two tables in How" let 22 pages
  // pass that carry no re-alignment at all. The heading is the signal every page doing this right
  // uses, and it is the only one that means what it says.
  if (HALF_HEADING.test(body)) return [];
  return [[TWO_HALVES,
    "How carries one half. It says what is built and never which documents this reasoning obliges, " +
    "so the second table is missing (05-artifacts.md, How has two halves) · add What re-aligns — one " +
    "row per document, what re-aligns inside it, and its state. An empty one is worth saying out " +
    "loud; a missing one usually means somebody stopped early"]];
}

/** The chrome an approach page owes its reader, and the one part nothing checked. */
export function pageFurniture(text: string): Finding[] {
  if (!text.includes('id="rail"') && !text.includes('id="rail-list"')) return [];  // no rail is a short page's right
  if (text.includes("rail-fold") || text.includes("sub-group")) return [];
  return [[TWO_HALVES,
    "The outline does not fold. A rail listing every heading of every section is a wall in the shape " +
    "of an outline (05-artifacts.md, A page carries its own subsections) · append the rail-fold " +
    "block, verbatim, after this page's own rail builder — take it from any approach page in the " +
    "foundation's artifacts pocket"]];
}

/** The first word of every `<h2>`, lowercased — what decides a page's kind. */
function headings(text: string): string[] {
  return [...text.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter((h) => h.length > 0)
    .map((h) => h.split(/\s+/)[0].replace(/[:—-]+$/, "").toLowerCase());
}

/** Why -> What -> How -> Open -> Deferred, Terms optional first (05-artifacts). */
export function approachShape(text: string): Finding[] {
  const heads = headings(text);
  if (!heads.length) return [];
  // The SKELETON decides the kind. A settled approach legitimately lacks Open, and a closed one lacks
  // Deferred — neither is a routing signal. Why + What + How is.
  const missing = ["why", "what", "how"].filter((s) => !heads.includes(s));
  if (missing.length)
    return [["RULE", "carries no " + missing.join(" + ") + " — this explains rather than argues, so " +
      "it is an overview: artifacts/overviews/<name>-overview.html (RD.DOCS.039 / 040). An approach " +
      "is Why > What > How > Open > Deferred"]];
  return [];
}

/** An overview borrows its outline and carries no argument organs (05-artifacts). */
export function overviewShape(text: string): Finding[] {
  const organs = headings(text).filter((h) => h === "open" || h === "deferred");
  if (organs.length)
    return [["RULE", "overview carries " + organs.join(" + ") + " — those are an argument's organs. " +
      "A question found while writing an overview is an approach document waiting to be offered, or " +
      "a register row"]];
  return [];
}

/**
 * Each `<div class="open">` with its own matching close, nesting counted.
 *
 * THE BLIND SPOT THIS CLOSES. Splitting the section on headings alone left the LAST card's chunk
 * running to the end of the section, so it borrowed whatever came after it. On the 009 page a card
 * carrying no options table passed, because a receipt table sat below it — and the card a writer adds
 * in a hurry is always the last one.
 */
function cardDivs(body: string): string[] {
  const out: string[] = [];
  for (const opening of body.matchAll(/<div\b[^>]*class="[^"]*\bopen\b[^"]*"[^>]*>/gi)) {
    const from = opening.index! + opening[0].length;
    let depth = 1;
    let at = from;
    for (const tag of body.slice(from).matchAll(/<div\b[^>]*>|<\/div\s*>/gi)) {
      depth += tag[0].startsWith("</") ? -1 : 1;
      if (depth === 0) { at = from + tag.index!; break; }
    }
    out.push(body.slice(from, at));
  }
  return out;
}

/**
 * Cards are h3 OR h4 — the corpus uses h4, and both read as a card to a person. Where the page marks
 * its cards with `<div class="open">` those bounds win, because they are what the writer actually
 * drew. The heading split is the fallback for a page that does not.
 */
function cards(body: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const divs = cardDivs(body);
  const chunks = divs.length ? divs : body.split(/(?=<h[34]\b)/);
  for (const chunk of chunks) {
    const title = /<h[34]\b[^>]*>([\s\S]*?)<\/h[34]>/i.exec(chunk);
    if (title)
      out.push([title[1].replace(/<[^>]+>/g, "").trim().slice(0, 60),
                chunk.slice(title.index! + title[0].length)]);
  }
  return out;
}

/**
 * Open and Deferred carry cards in the agreed shape (refs/decision-cards.md).
 *
 * A card with no options is a status update; one with no recommendation makes the reader do the
 * analysis twice; a deferred one with no trigger is a question nobody will bring back. All three read
 * as progress, which is why they need a checker rather than a convention — the failure is invisible
 * to whoever wrote it.
 *
 * The card TITLE is excluded from every scan: a card called "options but no recommendation" otherwise
 * satisfies the recommendation check by naming it.
 */
export function openCards(text: string): Finding[] {
  const out: Finding[] = [];
  const open = section(text, "Open");
  if (open !== null)
    for (const [name, rest] of cards(open)) {
      if (!rest.includes("<table"))
        out.push(["RULE", `Open card "${name}" carries no options table — a card with no options is a status update (refs/decision-cards.md)`]);
      else if (!/recommend|(?:→|&rarr;|&#8594;)\s*(?:<[^>]+>)*\s*\**[A-D]\b/i.test(rest))
        out.push(["RULE", `Open card "${name}" carries no recommendation — the reader does the analysis twice (refs/decision-cards.md)`]);
    }
  const deferred = section(text, "Deferred");
  if (deferred !== null)
    for (const [name, rest] of cards(deferred))
      // A deferred card keeps its parts AND names what brings it back. "Later" is not a trigger; an
      // event somebody will notice happening is.
      if (!/\btrigger|\buntil\b|\bonce\b|\bwhen\b|\bbrings? it back\b/i.test(rest))
        out.push(["RULE", `Deferred card "${name}" names no trigger — what would bring it back (refs/decision-cards.md)`]);
  return out;
}

// ---------------------------------------------------------------------------- prose

/**
 * Records are exempt — RD.DOCS.031: a warmed record is a defect.
 *
 * What comes back is prose with a blank line at every block boundary, so a heading or a list item
 * never runs into the paragraph below it and reads as one long sentence. Headings, an outline rail,
 * the tag line and the book strip are not prose either — a reader learns from none of them.
 */
export function proseOf(text: string, isHtml: boolean): string {
  if (isHtml) {
    let t = text.replace(/<!--[\s\S]*?-->/g, " ");
    t = t.replace(/<(table|svg|pre|script|style|nav|h[1-6])\b[\s\S]*?<\/\1>/gi, " ");
    t = t.replace(HTML_BLOCK_END, "\n\n");
    return unescape(t.replace(/<[^>]+>/g, " "));
  }
  let t = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, " ");
  t = t.replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/```[\s\S]*?```/g, " ");
  const lines: string[] = [];
  for (const line of t.split("\n")) {
    // A record inside a blockquote is still a record: strip any '>' quote prefix before deciding. A
    // table row written as "> | a | b |" is a table, not a 60-word sentence.
    const stripped = line.replace(/^(?:\s*>)+\s*/, "").trim();
    if (stripped.startsWith("|") || stripped.startsWith("📖") || stripped.startsWith("`Lenses:")
        || MD_HEADING.test(stripped)) {
      lines.push("");
      continue;
    }
    if (MD_BLOCK_START.test(stripped)) lines.push("");
    lines.push(line);
  }
  t = lines.join("\n").replace(MD_LINK, "$1");
  t = t.replace(/\[!(?:NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]/g, " ");
  // RD.DOCS.049 lets a rule quote the mistake it bans, and the marking is how a check tells quotation
  // from breach. That marking used to die on the strip below, which removes every `*` and backtick —
  // so `MARKED` was matching a string no longer carrying a marker, and a rule was flagged by itself.
  // Italic and code spans become sentinel-wrapped, which survives the strip. One delimiter in, one
  // sentinel out — never a space, and never two; `sentences()` turns each sentinel back into the
  // space the strip used to leave, so segmentation is unchanged to the character. Bold is emphasis
  // rather than quotation, so it is left for that same strip.
  t = t.replace(/`([^`\n]*)`/g, (_, inner: string) => QUOTE_L + inner + QUOTE_R);
  t = t.replace(/(?<!\*)\*([^*\n]{1,200})\*(?!\*)/g, (_, inner: string) => QUOTE_L + inner + QUOTE_R);
  return t.replace(/[*`#>[\]]/g, " ");
}

// A token is a word when it carries a letter or a digit — an em dash is not one. Python's `\w` is
// unicode-aware and JavaScript's is ASCII, so this names the class explicitly: without it every
// accented word would stop counting and every measured average would move.
const WORD_CHAR = /[\p{L}\p{N}_]/u;

export function words(s: string): string[] {
  return s.split(/\s+/).filter((t) => t && WORD_CHAR.test(t));
}

export type Sentence = [text: string, count: number];

/**
 * A prose sentence: split on . ! ? plus whitespace and on block boundaries; more than three words.
 *
 * A quotation sentinel becomes the space its delimiter used to leave, so what counts as a sentence
 * does not move when a rule quotes the mistake it bans. Only `voice()` reads the sentinels, and only
 * to tell a quotation from a breach.
 */
export function sentences(prose: string): Sentence[] {
  const plain = prose.split(QUOTE_L).join(" ").split(QUOTE_R).join(" ");
  const out: Sentence[] = [];
  for (const block of plain.split(BLOCK_BREAK))
    for (const s of block.split(SENT_END)) {
      const n = words(s).length;
      if (n > 3) out.push([s.split(/\s+/).filter(Boolean).join(" "), n]);
    }
  return out;
}

const countOf = (pattern: RegExp, text: string): number =>
  [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))].length;

/**
 * RD.DOCS.044 — how many prose sentences reach the reader, and how many were counted.
 *
 * A chapter and a concept keep their normative sentences out of the denominator: a rule binds a party
 * and its subject may not move, so the reader is reached in the sentence beside it. Every other seat
 * counts every sentence.
 */
export function reach(sents: Sentence[], kind: string): [reaching: number, counted: number] {
  let counted = sents.map(([s]) => s);
  if (kind === "chapter" || kind === "concept") counted = counted.filter((s) => !NORMATIVE.test(s));
  const hit = counted.filter((s) => YOU.test(s) || IMPERATIVE.test(s)).length;
  return [hit, counted.length];
}

export type Metrics = Record<string, number>;

/** The rates a tranche moves: counts, never a verdict. */
export function measure(sents: Sentence[], kind = "chapter"): Metrics {
  const [hit, counted] = reach(sents, kind);
  return {
    sentences: sents.length,
    words: sents.reduce((sum, [, n]) => sum + n, 0),
    past25: sents.filter(([, n]) => n > PAST_25).length,
    past30: sents.filter(([, n]) => n > PAST_30).length,
    you: sents.reduce((sum, [s]) => sum + countOf(YOU_ALL, s), 0),
    reach: hit,
    counted,
  };
}

/**
 * A number formatted the way Python's `:.Nf` formats it — halves to EVEN, not away from zero.
 *
 * `toFixed` rounds 12.5 up and Python rounds it down, so a reach share of exactly one in eight read
 * 13 % here and 12 % there. The verdict never moved, because the share is compared against the bar as
 * a float. What moves is the RATES TABLE, and that table is the baseline a tranche is measured
 * against — a one-point shift in it reads as the corpus having changed when only the printer did.
 */
function fixed(value: number, digits: number): string {
  const scale = 10 ** digits;
  const scaled = value * scale;
  const floor = Math.floor(scaled);
  const part = scaled - floor;
  const rounded = part > 0.5 ? floor + 1 : part < 0.5 ? floor : (floor % 2 === 0 ? floor : floor + 1);
  if (digits === 0) return String(rounded);
  const digitsOut = String(Math.abs(rounded)).padStart(digits + 1, "0");
  return (rounded < 0 ? "-" : "") + digitsOut.slice(0, -digits) + "." + digitsOut.slice(-digits);
}

export function opening(s: string, n = 6): string {
  return s.split(/\s+/).filter(Boolean).slice(0, n).join(" ") + "…";
}

/**
 * RD.DOCS.043 § Measure, over prose only.
 *
 * Every check holds on every file, with one exception the book states. On an operative surface the
 * two second-person counts do not apply, and the reach share is the whole measure (RD.DOCS.048).
 * CARD and ABOUT read marked text as quotation, never as prose (RD.DOCS.049).
 */
export function voice(prose: string, sents: Sentence[], kind = "chapter", operative = false): Finding[] {
  const out: Finding[] = [];
  const unmarked = prose.replace(MARKED, " ");

  const cardinality = [...unmarked.matchAll(CARD)];
  if (cardinality.length) {
    const eg = cardinality.slice(0, 4).map((m) => `${m[1]} ${m[2]}`).join(", ");
    out.push(["RULE", `${cardinality.length} cardinality-in-prose (${eg}) — RD.GOV.008: name a set by its rule, not its count`]);
  }
  const idioms = [...unmarked.matchAll(IDIOM)].map((m) => m[1]);
  if (idioms.length) {
    const eg = [...new Set(idioms)].sort().slice(0, 4).map((i) => `"${i}"`).join(" · ");
    out.push(["RULE", `${idioms.length} idiom(s) — RD.DOCS.052: an idiom means something its words ` +
      `do not say, so a second-language reader cannot guess it: ${eg} · write the plain phrase`]);
  }
  const nAbout = [...unmarked.matchAll(ABOUT)].length;
  if (nAbout)
    out.push(["RULE", `${nAbout} construction(s) written about the reader, not to them — RD.DOCS.031 talks to the reader · say *you*`]);

  if (!sents.length) return out;
  const n = sents.length;

  // NOTHING HERE MEASURES LENGTH. An average and a thirty-word cap were both findings until the book
  // dropped them (`05-docs/01-corpus.md` § The readability bar, rule 4; `04-discipline.md` — *no rule
  // measures length, and no rule counts `you`*). A sentence may be long when the idea needs it, and
  // cutting the link between two ideas to make one shorter is the defect the count was causing.
  //
  // A register row is the one place a length rule survives, and it is a shape rather than a count —
  // one clause a sentence, because a row is a record. `ROW_LONG` below is that rule and stays.

  const bolted = sents.filter(([s]) => {
    if (!BOLT.test(s)) return false;
    const rest = s.replace(BOLT, "");
    return !(YOU.test(rest) || IMPERATIVE.test(rest));
  }).map(([s]) => s);
  if (bolted.length) {
    const eg = bolted.slice(0, 3).map((s) => `"${opening(s)}"`).join(" · ");
    out.push(["RULE", `${bolted.length} sentence(s) reach only by a tacked-on "… for you" — ` +
      `RD.DOCS.046: the measure serves personalization, so a sentence that reaches only by its last ` +
      `two words reached nobody: ${eg} · rewrite it to address the reader`]);
  }

  // AND NOTHING COUNTS `you`. A count of a pronoun cannot see an imperative, so it read every
  // instruction file as silent when it was anything but — which is why `operative` had to be carved
  // out of it, and a measure needing a carve-out for a whole class of surface was measuring the
  // wrong thing. What reaches the reader is judged by the reach share below and by a person.

  // THE REACH SHARE IS A STATISTIC, NEVER A FINDING (Q100, decided N13). It was reported per file as
  // a SOFT, and a share is not a defect in the file it is measured on: reaching the reader is three
  // moves, a script sees two of them, and the one it cannot see — a second person addressed without
  // the word *you* — is the commonest. So a file scoring low is as likely to be prose the counter
  // cannot read as prose that fails its reader, and a per-file verdict from a measure that admits it
  // under-counts is a verdict nobody can act on. It stays in the rates table at the foot of a run,
  // where a share is read across a corpus and compared against its bar, which is what a share is for.
  return out;
}

// ---------------------------------------------------------------------------- registers

/**
 * Resolve the path first, exactly as `watched()` does. Testing the string as given made a register's
 * classification depend on where the checker was invoked from: `doc-check glossary.md`, run inside
 * `registers/`, saw no `/registers/` segment, so every row check was silently skipped and the file
 * was measured as a chapter.
 */
export function isRegister(path: string): boolean {
  const p = slashes(resolve(path));
  return p.endsWith(".md") && p.includes("/registers/") && basename(p) !== "README.md";
}

// 06-registers.md § A row states present truth, and carries no supersession — a row is never
// annotated, struck through, or left standing with a note, and it never names what it replaced.
// THE WORD IS NOT THE BREACH; the ruling is. A row legitimately says `superseding the working label
// "AGT"` — ordinary English about an enum value, a file set or a config key. So a ruling is only a
// ruling when a REGISTER ID sits inside the clause, and the two directions are read separately.
const REGISTER_ID = "(?:[A-Z]{2,6}\\.[A-Z]{1,8}\\.\\d{1,4}|[A-Z]{2,4}\\d{1,4})";
const IS_REGISTER_ID = new RegExp("^" + REGISTER_ID + "$");
// The gap stops at `. ! ? ; |` so one clause never reaches into the next.
const RULE_GAP = "(?:[^|.!?;]|\\.(?=\\d)|\\.(?=[A-Za-z]))";
const RULES_OVER = new RegExp(
  "\\b(?:supersedes?|superseding|amends?|amending)\\b(?:\\s+in\\s+part)?" + RULE_GAP + "{0,70}?(" + REGISTER_ID + ")", "gi");
const RULED_BY = new RegExp(
  "\\b(?:superseded|amended)\\b" + RULE_GAP + "{0,60}?\\bby\\b" + RULE_GAP + "{0,40}?(" + REGISTER_ID + ")", "gi");
// An annotation the chapter names outright. `<s>` is deliberately absent — it is too short to tell
// from a stray angle bracket, and no corpus row has ever used it.
const ANNOTATED = /~~[^~\n]+~~|<del\b/i;
// SOFT, and the number is why. Both register files pass every other bar today, so a RULE turns a
// green file red in one commit — and a gate nobody can get green is a gate everybody learns to scroll
// past. When `doc-check <register>` reads zero, change this word to RULE. Nothing else moves.
const SUPERSESSION = "SOFT";

/**
 * A row ruling over another row, and a row wearing an annotation. Both are refused.
 *
 * `body` is the row's cells with links collapsed and `*` and backtick markup stripped, so an id reads
 * the same whether it was written bare or as a link. `raw` keeps the markup, because strikethrough IS
 * markup and stripping it first would hide the thing being looked for.
 */
export function supersession(rid: string, body: string, raw: string): Finding[] {
  const out: Finding[] = [];
  const over = [...new Set([...body.matchAll(RULES_OVER)].map((m) => m[1]).filter((id) => id !== rid))].sort();
  const under = [...new Set([...body.matchAll(RULED_BY)].map((m) => m[1]).filter((id) => id !== rid))].sort();
  for (const [name, how] of [...over.map((n) => [n, "rules over"] as const),
                             ...under.map((n) => [n, "is ruled by"] as const)])
    out.push([SUPERSESSION, `row ${rid} ${how} ${name} — a row states present truth and never names ` +
      `what it replaced (06-registers.md § A row states present truth) · rewrite the row, and let git ` +
      `keep the old wording`]);
  if (ANNOTATED.test(raw))
    out.push([SUPERSESSION, `row ${rid} carries struck-through or annotated text — a row is never ` +
      `annotated, struck through, or left standing with a note (06-registers.md § A row states ` +
      `present truth) · rewrite the cell, and let git keep the old wording`]);
  return out;
}

/**
 * RD.DOCS.043 § Rows — a register row takes the plain substrate and stays a record.
 *
 * Every table body line is a row: the first cell is its id and is skipped; links collapse to their
 * text; `*` and backtick markup is stripped for the count. A cell sentence past twenty-five words is
 * a finding. A bare *you* is a finding — a record is never warmed — unless the row mentions the word
 * as a term, in italics or in backticks.
 */
export function rows(text: string): [Finding[], Metrics] {
  const out: Finding[] = [];
  const sents: Sentence[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const s = lines[i].trim();
    if (!s.startsWith("|") || TABLE_SEP.test(s)) continue;
    const next = i + 1 < lines.length ? lines[i + 1].trim() : "";
    if (TABLE_SEP.test(next)) continue;             // the header row
    let cells = s.split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.length && cells[0] === "") cells = cells.slice(1);
    if (cells.length && cells[cells.length - 1] === "") cells = cells.slice(0, -1);
    if (cells.length < 2) continue;
    const rid = cells[0].replace(MD_LINK, "$1").replace(/[*`]/g, "").trim() || `line ${i + 1}`;
    const body = cells.slice(1).map((c) => c.replace(MD_LINK, "$1"));
    if (IS_REGISTER_ID.test(rid))
      // Only a row with a register id: an Open card's `| **A** | option | cost |` table lives in this
      // same file and legitimately weighs a supersession as an option.
      out.push(...supersession(rid, body.join(" ").replace(/[*`]/g, " "), cells.slice(1).join(" ")));
    if (YOU.test(body.join(" ").replace(YOU_AS_TERM, " ")))
      out.push(["RULE", `row ${rid} says *you* — a record is never warmed (RD.DOCS.043 § Rows; 04-discipline § Voice discipline)`]);
    for (const cell of body)
      for (const [sent, n] of sentences(cell.replace(/[*`]/g, ""))) {
        sents.push([sent, n]);
        if (n > ROW_LONG)
          out.push(["RULE", `row ${rid}: a sentence of ${n} words, "${opening(sent)}" — a row states ` +
            `one clause a sentence, none past twenty-five (RD.DOCS.043 § Rows) · split it`]);
      }
  }
  return [out, measure(sents, "register")];
}

// ---------------------------------------------------------------------------- kinds and templates

// How a stack spells a scaffold template. A stack DERIVES from the repo's own claim — `sprepo.json`
// `config.stack`. Nothing here may assume one stack: `.tmpl` and `dot-` are TypeScript's, and the
// `dot-` reason is npm's alone. This table READS the declaration and never authors it (RD.APPS.077).
const STACK_TEMPLATES: Record<string, { suffixes: string[]; dotPrefix: string | null }> = {
  TS: { suffixes: [".tmpl"], dotPrefix: "dot-" },
};
// The fallback for a stack with no row yet. It fails OPEN — checking a little more than it must —
// because every defect this checker has had was a gate that measured nothing and read as a pass.
const GENERIC_TEMPLATE = { suffixes: [".tmpl", ".template", ".j2", ".jinja", ".mustache", ".erb"], dotPrefix: null };
const stackCache = new Map<string, string | null>();

/** The stack a file's repository claims, or null. Walks up to the nearest `sprepo.json`. */
export function stackOf(path: string): string | null {
  let folder = dirname(resolve(path));
  for (;;) {
    if (stackCache.has(folder)) return stackCache.get(folder)!;
    const manifest = join(folder, "sprepo.json");
    if (exists(manifest)) {
      let claim: string | null = null;
      try { claim = (JSON.parse(read(manifest))?.config ?? {})?.stack ?? null; } catch { claim = null; }
      stackCache.set(folder, claim);
      return claim;
    }
    const up = dirname(folder);
    if (up === folder) return null;
    folder = up;
  }
}

/**
 * The file a scaffold template becomes. `README.md.tmpl` is a README and is held to a README's bars,
 * so a new node is BORN in the one voice instead of being swept into it later. A template left in the
 * old voice regenerates the drift with every new node, and no amount of sweeping catches it.
 */
export function asWritten(path: string): string {
  const folder = dirname(path);
  let base = basename(path);
  const convention = STACK_TEMPLATES[stackOf(path) ?? ""] ?? GENERIC_TEMPLATE;
  for (const suffix of convention.suffixes)
    if (base.endsWith(suffix)) { base = base.slice(0, -suffix.length); break; }
  const prefix = convention.dotPrefix;
  if (prefix && base.startsWith(prefix)) base = "." + base.slice(prefix.length);
  return folder === "." && !path.startsWith("./") ? base : join(folder, base);
}

/**
 * A surface an agent acts from, rather than one a person reads to learn (RD.DOCS.047).
 *
 * Two members. The foundation's provider set, matched by its domains rather than by a bare
 * `providers/`, which is an ordinary folder name a consuming repo may use for its own code. And the
 * plugins' own instruction surface, which an agent loads every session and acts on. The scripts
 * beside them are code, never corpus. RD.DOCS.048 exempts this surface from the two second-person
 * counts. Reach still binds.
 */
export function isOperative(path: string): boolean {
  const p = slashes(resolve(path));
  // TWO DOMAINS, NOT THREE. `providers/devex/` was removed (RD.DEVEX.061): devex has one CLI and one
  // agent runtime, which are complementary surfaces rather than alternatives, so the seat held nothing
  // its own. An axis exists where a domain has alternatives.
  if (["/providers/apps/", "/providers/infra/"].some((d) => p.includes(d))) return true;
  return p.includes("/plugins/") && ["agents", "skills", "refs", "commands"].some((d) => p.includes(`/${d}/`));
}

/**
 * What the hook and the sweep read (RD.DOCS.043 § Reach): every .md under docs/, every README.md,
 * CONCEPT.md, every .html under artifacts/, an approach or overview page anywhere, and .html under
 * .spndevex/notes/. A scaffold template counts as the file it writes. Not .md under .spndevex/ —
 * arcs, orders and notes are state, not corpus — and nothing under a build or dependency directory.
 */
export function watched(path: string): boolean {
  const p = slashes(resolve(asWritten(path)));
  const parts = p.split("/");
  if (parts.slice(0, -1).some((d) => SKIP.has(d))) return false;
  const base = parts[parts.length - 1];
  if (base.endsWith(".md") && p.includes("/.spndevex/")) return false;
  if (base.endsWith(".html"))
    return base.endsWith("-approach.html") || base.endsWith("-overview.html")
        || p.includes("/artifacts/") || p.includes("/.spndevex/notes/");
  if (base === "README.md" || base === "CONCEPT.md") return true;
  if (!base.endsWith(".md")) return false;
  if (p.includes("/docs/")) return true;
  // The operative surface — the provider set and the plugins' instruction files. One predicate,
  // because RD.DOCS.048 measures that surface differently and must name the same set.
  return isOperative(p);
}

const KINDS = ["chapter", "readme", "concept", "artifact-html", "register"];

export function kindOf(path: string): string {
  const written = asWritten(path);
  const base = basename(written);
  if (base === "CONCEPT.md") return "concept";
  if (base === "README.md") return "readme";
  if (written.endsWith(".html")) return "artifact-html";
  if (isRegister(written)) return "register";
  return "chapter";
}

// ---------------------------------------------------------------------------- one file

/**
 * All findings for one file. A fragment is an Edit's new_string: path-based structure still applies,
 * the whole-document shape checks do not, and the prose measure runs only once the fragment carries
 * five prose sentences.
 */
export function check(path: string, text: string, fragment = false): Finding[] {
  const isHtml = path.endsWith(".html");
  const isApproach = path.endsWith("-approach.html");
  const isOverview = path.endsWith("-overview.html");
  const prose = proseOf(text, isHtml);
  const out: Finding[] = structural(path);

  if ((isApproach || isOverview) && !fragment) {
    if (!/who this is for|audience/i.test(text))
      out.push(["BLOCK", "masthead names no audience — an artifact has no seat, so its content is decided by its audience (05-artifacts)"]);
    const terms = /<section id="s0"[\s\S]*?<\/section>/.exec(text);
    if (terms) {
      const n = [...terms[0].matchAll(/<tr>/g)].length - 1;
      if (n > 8) out.push(["BLOCK", `Terms carries ${n} rows; the bar is five to eight`]);
    }
  }
  if (isApproach) {
    if (!fragment) {
      out.push(...approachShape(text));
      out.push(...howHalves(text));
      out.push(...pageFurniture(text));
    }
    out.push(...openCards(text));
  } else if (isOverview) {
    out.push(...overviewShape(text));
  }

  const sents = sentences(prose);
  if (!fragment || sents.length >= 5) out.push(...voice(prose, sents, kindOf(path), isOperative(path)));
  if (isRegister(path)) out.push(...rows(text)[0]);
  return out;
}

// ---------------------------------------------------------------------------- shell writes

const HEREDOC = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g;
const REDIRECT = /(?:^|\s)(>>?)\s*([^\s;|&<>]+)/g;
const TEE = /\btee\b\s+(?:-a\s+)?([^\s;|&<>]+)/g;
const SEGMENT = /[;|&\n]+/;

/**
 * The files a `sed -i` invocation rewrites, or none if it is not editing in place.
 *
 * Tokens decide this, never a pattern: sed's file operands sit AFTER its script, and a regex that
 * simply took the next token captured `s/a/b/` and let the real file through. BSD's `-i` takes a
 * backup suffix, often the empty string, and `-e`/`-f` each consume the token after them — so the
 * script is skipped only when neither flag supplied one.
 */
function sedFiles(args: string[]): string[] {
  if (!args.some((t) => t === "-i" || t.startsWith("-i"))) return [];
  const scripted = args.some((t) => t === "-e" || t === "-f");
  const files: string[] = [];
  let skipNext = false;
  let seenScript = false;
  for (const t of args) {
    if (skipNext) { skipNext = false; continue; }
    if (t === "-e" || t === "-f") { skipNext = true; continue; }
    if (!t || t.startsWith("-")) continue;
    if (!scripted && !seenScript) { seenScript = true; continue; }   // the bare script expression
    files.push(t);
  }
  return files;
}

/**
 * Writers that name their target as an argument — `sed -i`, and a copy or a move whose destination is
 * its last operand. Their bytes are on disk rather than in the command, so a path-based guard decides
 * on these and a content measure cannot.
 */
function argvWrites(head: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const segment of head.split(SEGMENT)) {
    let tokens = shlexSplit(segment);
    if (tokens === null) continue;                  // an unbalanced quote — allow, never guess
    while (tokens.length && (["sudo", "env", "command", "nohup"].includes(tokens[0]) || /^\w+=/.test(tokens[0])))
      tokens = tokens.slice(1);
    if (!tokens.length) continue;
    const cmd = basename(tokens[0]);
    const args = tokens.slice(1);
    if (cmd === "sed") {
      out.push(...sedFiles(args).map((f) => [f, "inplace"] as [string, string]));
    } else if (["cp", "mv", "install", "rsync"].includes(cmd)) {
      const operands = args.filter((a) => !a.startsWith("-"));
      if (operands.length >= 2) out.push([operands[operands.length - 1], "copy"]);  // the destination is last
    }
  }
  return out;
}

/** A shell command split into words the way the shell would; null on an unbalanced quote. */
function shlexSplit(segment: string): string[] | null {
  const out: string[] = [];
  let word = "";
  let started = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (quote === "'") { if (ch === "'") quote = null; else word += ch; continue; }
    if (quote === '"') {
      if (ch === "\\" && i + 1 < segment.length) { word += segment[i + 1]; i += 1; }
      else if (ch === '"') quote = null;
      else word += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; started = true; continue; }
    if (ch === "\\" && i + 1 < segment.length) { word += segment[i + 1]; i += 1; started = true; continue; }
    if (/\s/.test(ch)) { if (started) { out.push(word); word = ""; started = false; } continue; }
    word += ch;
    started = true;
  }
  if (quote !== null) return null;
  if (started) out.push(word);
  return out;
}

export type Write = [path: string, text: string | null, append: boolean, how: string];

/**
 * Every path a shell command writes, as (path, text, append, how).
 *
 * `how` is why the path was found, and it decides what a caller may conclude:
 *
 *   redirect · tee   the target of `>` `>>` or `tee`. A heredoc body comes back as `text`, which the
 *                    checker reads exactly as it reads a Write's content. Without one `text` is null —
 *                    a write the gate cannot measure, and it owes you that fact rather than a pass.
 *   inplace · copy   `sed -i`, `cp`, `mv`, `install`, `rsync`. The bytes are on disk, never in the
 *                    command, so `text` is always null.
 *
 * The hook's matcher covers Bash, so a file written through the shell is seen like any other — before
 * this the matcher fired and the handler read nothing.
 */
export function bashWrites(command: string): Write[] {
  const bare = (s: string) => s.trim().replace(/^['"]|['"]$/g, "");
  const out: Write[] = [];
  const lines = command.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    i += 1;
    const delimiters = [...line.matchAll(HEREDOC)].map((m) => m[2]);
    const head = line.replace(HEREDOC, " ");
    const targets: Array<[string, boolean, string]> = [
      ...[...head.matchAll(REDIRECT)].map((m) => [bare(m[2]), m[1] === ">>", "redirect"] as [string, boolean, string]),
      ...[...head.matchAll(TEE)].map((m) => [bare(m[1]), head.includes(" -a "), "tee"] as [string, boolean, string]),
    ];
    const bodies: string[] = [];
    for (const d of delimiters) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim() !== d) { body.push(lines[i]); i += 1; }
      i += 1;                                       // step over the delimiter's own line
      bodies.push(body.join("\n"));
    }
    targets.forEach(([target, append, how], n) => out.push([target, n < bodies.length ? bodies[n] : null, append, how]));
    // Content is never recoverable for these, so they carry no body and take no heredoc.
    for (const [target, how] of argvWrites(head)) out.push([bare(target), null, how === "inplace", how]);
  }
  return out;
}

// ---------------------------------------------------------------------------- the hook

const UNREAD: Record<string, string> = {
  redirect: "written by a shell redirect carrying no readable body",
  tee: "written through `tee` carrying no readable body",
  inplace: "edited in place, so the new text never appears in the command",
  copy: "put here by a copy or a move, so its bytes are only on disk",
};

export function checkDoc(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  const path = supplied.file_path ?? "";
  let found: Finding[] = [];
  let plural = false;
  let fragment = false;

  if (path) {
    if (!watched(path)) return null;
    fragment = supplied.content === undefined && supplied.new_string !== undefined;
    const text = supplied.content || supplied.new_string || "";
    if (!text && !structural(path).length) return null;
    found = check(path, text, fragment);
  } else {
    const writes = bashWrites(supplied.command ?? "").filter((w) => watched(w[0]));
    if (!writes.length) return null;
    plural = writes.length > 1;
    for (const [target, text, append, how] of writes) {
      const tag = basename(target) + ": ";
      if (text === null) {
        found.push(["SOFT", tag + UNREAD[how] + " — the gate cannot measure this write. Write the " +
          "document with Write or Edit, or sweep the file afterwards, and it is checked"]);
        continue;
      }
      found.push(...check(target, text, append).map(([sev, msg]) => [sev, tag + msg] as Finding));
    }
  }
  if (!found.length) return null;

  const body = found.map(([sev, msg]) => `  - [${sev}] ${msg}`).join("\n");
  const moves = found.some(([, m]) => m.includes("RD.DOCS.04") || m.includes("RD.DOCS.031"))
    ? "\n  The four moves: split it · say *you* · define the term · land it on your reader — never " +
      "shorten (`refs/doc-sets.md` § One voice; decisions RD.DOCS.043 · RD.DOCS.044)."
    : "";
  const subject = plural ? "these files miss" : "this file misses";
  // A GATE MUST SAY WHAT IT DID NOT CHECK. On an Edit the hook sees the REPLACEMENT TEXT and not the
  // document, so two whole classes of finding cannot be reached from here: a cell scored as prose
  // because nothing says it sits in a table, and an opening sentence that is only an opening sentence
  // relative to a paragraph this run never had. Saying so costs one line and stops a clean run
  // reading as more than it is.
  const limits = fragment
    ? "\n  This run scored the replacement text, not the document — a table cell reads as prose here, " +
      "and a paragraph's opening sentence is not a fragment's. Sweep the whole file to reach those: " +
      "`node doc-check.ts <path>`."
    : "";
  return { note: `Doc standard — ${subject} bars the book states:\n${body}${moves}${limits}` +
    "\n  Load `refs/doc-sets.md` (One voice / Every surface / The artifacts pocket) and the `plan` " +
    "skill's approach-document section." };
}

// ---------------------------------------------------------------------------- the sweep

function* walk(roots: string[]): Generator<string> {
  for (const root of roots) {
    let stat;
    try { stat = statSync(root); } catch { continue; }
    if (stat.isFile()) { yield root; continue; }
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop()!;
      let entries: string[];
      try { entries = readdirSync(dir).sort(); } catch { continue; }
      for (const entry of entries) {
        const full = join(dir, entry);
        let entryStat;
        try { entryStat = statSync(full); } catch { continue; }
        if (entryStat.isDirectory()) { if (!SKIP.has(entry)) stack.push(full); }
        else if (watched(full)) yield full;
      }
    }
  }
}

type Stats = Metrics & { files: number; rule: number; soft: number };
const emptyStats = (): Stats => ({ files: 0, sentences: 0, words: 0, past25: 0, past30: 0,
  you: 0, reach: 0, counted: 0, rule: 0, soft: 0 });

/**
 * One markdown table per root. The register line measures the ROW sentences — the text the rows
 * tranche moves — so it is never summed into the prose line.
 */
function rates(root: string, stats: Record<string, Stats>): void {
  const line = (name: string, s: Stats, bar?: string) => {
    const n = s.sentences || 1;
    const c = s.counted || 1;
    return `| ${name} | ${s.files} | ${s.sentences} | ${fixed(s.words / n, 1)} | ` +
      `${fixed((100 * s.past25) / n, 0)} % | ${fixed((100 * s.past30) / n, 1)} | ` +
      `${fixed((100 * s.you) / n, 1)} | ${fixed((100 * s.reach) / c, 0)} % | ` +
      `${bar ?? "—"} | ${s.rule} | ${s.soft} |`;
  };
  console.log(`\n### rates · ${root}\n`);
  console.log("| kind | files | sentences | words/sentence | % past 25 | past 30 per 100 | " +
    "*you* per 100 | reach % | reach bar | files with RULE | files with SOFT |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  const prose = emptyStats();
  for (const kind of KINDS.slice(0, -1)) {
    if (stats[kind].files) console.log(line(kind, stats[kind], `${REACH_BAR[kind]} %`));
    for (const key of Object.keys(prose) as Array<keyof Stats>) prose[key] += stats[kind][key];
  }
  console.log(line("prose (all four)", prose));
  if (stats.register.files) console.log(line("register (rows)", stats.register));
}

function sweep(roots: string[], summaryOnly: boolean): number {
  const total: Record<string, number> = { BLOCK: 0, RULE: 0, SOFT: 0 };
  let files = 0, dirty = 0;
  const perRoot: Array<[string, Record<string, Stats>]> = [];
  for (const root of roots) {
    const stats: Record<string, Stats> = Object.fromEntries(KINDS.map((k) => [k, emptyStats()]));
    for (const path of [...walk([root])].sort()) {
      const text = read(path);
      files += 1;
      const found = check(path, text);
      const kind = kindOf(path);
      const s = stats[kind];
      s.files += 1;
      const m = kind === "register" ? rows(text)[1] : measure(sentences(proseOf(text, path.endsWith(".html"))), kind);
      for (const [key, value] of Object.entries(m)) s[key] += value;
      const severities = new Set(found.map(([sev]) => sev));
      s.rule += severities.has("RULE") || severities.has("BLOCK") ? 1 : 0;
      s.soft += severities.has("SOFT") ? 1 : 0;
      if (!found.length) continue;
      dirty += 1;
      for (const [sev] of found) total[sev] += 1;
      if (summaryOnly) continue;
      console.log(relative(process.cwd(), path));
      for (const [sev, msg] of found) console.log(`   [${sev}] ${msg}`);
    }
    perRoot.push([root, stats]);
  }
  if (!summaryOnly)
    console.log(`\n${files} documents scanned · ${dirty} with findings · ` +
      `BLOCK ${total.BLOCK} · RULE ${total.RULE} · SOFT ${total.SOFT}`);
  for (const [root, stats] of perRoot) rates(root, stats);
  // THE EXIT CODE MATCHES THE OUTPUT. This returned 0 while printing a RULE, so
  // `doc-check docs/ && echo clean` printed `clean` over a list of findings — and a gate read by its
  // colour is the failure this workstream opened on. SOFT stays 0: the corpus is swept for length and
  // not yet for reach, so a SOFT is a measurement rather than a verdict.
  return Math.min(total.BLOCK + total.RULE, 250);
}

if (runAlone("doc-check.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--bash-writes")) {
    // Every path a Bash command may write, one per line, for a guard that decides on the path alone.
    // One parser serves both hooks, so a new shell-write route is learned once. Content is not the
    // question here, so every route is printed whether or not its bytes were recoverable.
    const payload = readPayload();
    for (const [path] of bashWrites(payload.tool_input?.command ?? "")) console.log(path);
    process.exit(0);
  }
  if (argv.includes("--stdin")) {
    try { emit(checkDoc(readPayload())); } catch { /* never take the chain down */ }
    process.exit(0);
  }
  const roots = argv.filter((a) => !a.startsWith("-"));
  process.exit(sweep(roots.length ? roots : ["."], argv.includes("--summary")));
}
