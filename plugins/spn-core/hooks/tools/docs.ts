#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-foundation/02-docs/03-tree.md · 05-artifacts.md · 02-document.md
// This file carries rules it does not own. Those chapters are the source of truth. A rule change is
// edited there first, then here, in the same change. restates.py reports this copy when a source moves.
//
// The docs tools. TypeScript run by node directly — Node 22 strips types, so there is no build step
// and no node_modules. One file serves the write-time hook and the on-demand tool, so a check exists
// once and answers the same way in both.
//
//   node docs.ts audit <path…>          the invariants a page must hold
//   node docs.ts face <docs-tree>       write what is generated, between markers
//   node docs.ts page <seat.md…>        produce each construct page from its seat file
//   node docs.ts status <seat.md…>      derive the status from Binds and Proof, and refuse a false claim
//   node docs.ts topics <repo…>         refuse a numbered topic the constructs seat does not name
//   node docs.ts coverage <repo…>       every construct a chapter, every chapter a construct, every package a construct
//   node docs.ts figures check|colour   labels fit and connectors join · a block's colouring matches its text
//   node docs.ts audit --report <repo>  the gap scan — one report per repository, written, never fixed
//
// Grades, per the N2 arc: RULE refuses, SOFT reports. N7 flips the SOFTs.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, basename, relative } from "node:path";
import { hrefForPage, renderPage } from "../lib/render.ts";
import { checkFigures, colour, stripSpans } from "../lib/figures.ts";
import { begin, record, end } from "../lib/timing.ts";
import { cardsOf } from "../checks/split-plan.ts";
import { filesUnder as proseFilesUnder, paragraphs as proseParagraphs, score as proseScore } from "./prose-triage.ts";

type Grade = "RULE" | "SOFT";
type Finding = { check: string; grade: Grade; file: string; message: string };

// `capability` joined the set with Q130. The chapter kind existed, its template existed, and the
// checker had never heard of it — so every capability chapter in the corpus was a document whose
// own declared variant was not a variant. It carries no fixed outline: a chapter is Where ·
// Follows the pattern · Special handling · Between modules, and a construct that is pure pattern
// legitimately has no Special handling at all.
const VARIANTS = ["approach", "overview", "construct", "behaviors", "capability", "report"] as const;
type Variant = (typeof VARIANTS)[number];

/** The lens register, as the document chapter's table renders each value for a reader. */
const LENS_LABEL: Record<string, string> = {
  LEAD: "Engineering leader", BUSINESS: "Business manager", PRODUCT: "Product manager",
  ARCHITECT: "Architect", SERVER_DEV: "Backend developer", WEB_DEV: "Web developer",
  QA: "Quality engineer", INFRA: "DevOps / SRE", TRUST: "DevSecOps / Security",
  PARTNER: "Partner / integrator", VOICE: "Editor",
};

const STATUS_WORD: Record<string, string> = { PLANNING: "PLANNING", IMPLEMENTING: "IMPLEMENTING", DONE: "DONE" };

/**
 * The fixed outlines. A construct is six sections in one order — Terms first, because the model uses
 * those words; Boundary after the parts, because an edge can be judged only once the shape is seen
 * (workstream 008, N13, 2026-09-21). Relations is gone: `dependsOn` in the block carries it. An
 * approach's Terms is its only optional section.
 */
const OUTLINE: Partial<Record<Variant, { required: string[]; optional: string[] }>> = {
  construct: {
    required: ["Terms", "Model", "Parts", "Boundary", "Binds", "Proof"],
    optional: [],
  },
  approach: {
    required: ["Why", "What", "How", "Open", "Deferred"],
    optional: ["Terms"],
  },
};

/** An overview's outline is borrowed, with one fixed opener and two fixed closers. */
const OVERVIEW_FIXED_FIRST = "Overview";
const OVERVIEW_FIXED_LAST = ["Glossary", "Where to go next"];

// ---------------------------------------------------------------------------- reading

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "—").replace(/&middot;/g, "·").replace(/&ndash;/g, "–")
    .replace(/&rarr;/g, "→").replace(/&larr;/g, "←").replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/** The section's name is the word before its dash — the rail shows only that word. */
function sectionName(heading: string): string {
  return text(heading).split(/\s+[—–-]\s+/)[0].trim();
}

/**
 * A document's own metadata block.
 *
 * A BLOCK INSIDE A FENCE IS AN EXAMPLE, NOT THIS DOCUMENT'S OWN. A chapter that teaches the
 * metadata block shows one, and reading the first match anywhere meant such a chapter appeared to
 * declare itself — so `face` rendered a tag line FOR THE EXAMPLE and wrote it into the file. That
 * is how `refs/doc-sets.md`, which carries no block of its own, acquired one: its only `spn:doc`
 * sits inside its `## Metadata` sample. The writer was one run away from editing the illustration
 * a rule is taught by.
 */
function readBlock(src: string): { block: any | null; error: string | null } {
  const m = outsideFences(src).match(/<!--\s*spn:doc\s*([\s\S]*?)-->/);
  if (!m) return { block: null, error: "no spn:doc block" };
  try {
    return { block: JSON.parse(m[1].trim()), error: null };
  } catch (e) {
    return { block: null, error: `spn:doc is not strict JSON — ${(e as Error).message}` };
  }
}

function headings(src: string, tag: "h1" | "h2" | "h3"): string[] {
  return [...src.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => m[1]);
}

/**
 * The section headings of a document, read in the spelling its own format uses.
 *
 * THE OUTLINE CHECK IS THE SAME CHECK IN BOTH FORMATS, and it could read only one of them. A
 * produced page writes its sections as `<h2>`; the seat file it is produced FROM writes them as
 * `##`. Reading only the HTML meant every hand-authored construct reported all six required
 * sections missing while carrying all six — the check was not finding a defect, it was blind. A
 * gate that cannot see its input is worse than no gate, because its refusal is believed. Found by
 * the first batch that ever wrote a construct, which distrusted the red light and traced it.
 *
 * Fences are blanked first, so an example inside a code block is content rather than structure.
 */
function sections(file: string, src: string, tag: "h1" | "h2" | "h3"): string[] {
  if (!file.endsWith(".md")) return headings(src, tag);
  const level = tag === "h1" ? 1 : tag === "h2" ? 2 : 3;
  return [...outsideFences(src).matchAll(new RegExp(`^#{${level}}\\s+(.+)$`, "gm"))].map((m) => m[1]);
}

// ---------------------------------------------------------------------------- the checks

function checkBlock(file: string, src: string, block: any, err: string | null): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "block", grade, file, message });
  if (err) { add("RULE", err); return f; }

  for (const key of ["id", "title", "summary"]) {
    if (typeof block[key] !== "string" || !block[key].trim()) add("RULE", `\`${key}\` is missing or empty`);
  }
  if (!Array.isArray(block.lenses) || block.lenses.length === 0) add("RULE", "`lenses` is missing or empty");
  else for (const l of block.lenses) if (!(l in LENS_LABEL)) add("RULE", `\`${l}\` is not a lens`);

  const variant: Variant | undefined = block.variant;
  if (variant && !VARIANTS.includes(variant)) add("RULE", `\`variant\` \`${variant}\` is not one of ${VARIANTS.join(" · ")}`);

  // AN ARGUMENT IS A WORKSTREAM'S, NEVER A REPOSITORY'S (05-artifacts.md § What the pocket holds).
  // The pocket's folder set is fixed — overviews, constructs, reports, resources — so `approaches/`
  // was never a legal folder, and the rule held only as long as somebody remembered it. Fifteen
  // pages had accumulated before this fired. A repository states what is true now; an approach page
  // weighs options and carries open cards, and a pocket holding both is how a stale argument comes
  // to be read as a statement of today.
  if (variant === "approach" && /(^|\/)docs\//.test(file.replace(/\\/g, "/")))
    add("RULE", "an approach page belongs to the workstream that argues it, never to a repository's `docs/` — move it under `.spndevex/workstreams/`");

  // THE POCKET'S FOLDER SET IS OVERVIEWS, CONSTRUCTS, REPORTS AND NOTHING ELSE. A `resources/`
  // folder held "what a document was written from" — and every such file is a file some seat needs,
  // so each one was a seat depending on a pocket, which is the one thing the pocket rule forbids.
  // 229 files had collected across five repositories, 187 cited by nothing at all. A fact a seat
  // needs lives in a seat.
  if (/\/artifacts\/resources\//.test(file.replace(/\\/g, "/")))
    add("RULE", "the pocket holds `overviews/`, `constructs/` and `reports/` — a fact a seat needs lives in a seat, never in `resources/`");

  // An overview describes; it has no status. Every other page kind carries one.
  if (variant === "overview") {
    if ("status" in block) add("RULE", "an overview carries no `status` — a face is either current or a defect");
  } else if (!(block.status in STATUS_WORD)) {
    add("RULE", "`status` must be PLANNING · IMPLEMENTING · DONE");
  }

  if (variant === "construct") {
    // `parentId` is no longer asked for: the folder is the parent (N13). A block that still carries it is not wrong.
    // RULE since workstream 008 closed. It was SOFT while the constructs were being written, because
    // a gate that fires on every unwritten file teaches everyone to scroll past it. Every construct
    // in the workspace now declares it, so the rule fires on nothing and holds the next one.
    if (!Array.isArray(block.dependsOn)) add("RULE", "a construct declares `dependsOn`, even as an empty list");
  }
  if ("keywords" in block && (!Array.isArray(block.keywords) || block.keywords.length < 1))
    add("SOFT", "`keywords` is present but carries nothing");
  return f;
}

function checkOutline(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const variant: Variant | undefined = block?.variant;
  const spec = variant ? OUTLINE[variant] : undefined;
  const got = sections(file, src, "h2").map(sectionName);
  if (!spec) return f;

  // UNTIL N13 MOVES THE CORPUS, a construct in the v1 shape (Boundary before Model, a Relations
  // section) is reported softly rather than refused: the rule binds every new page now, and the 177
  // existing pages are re-shaped by the arc that merges them, not by a gate that fires on all of them.
  if (variant === "construct" && got.includes("Relations")) {
    const v1 = ["Terms", "Boundary", "Model", "Parts", "Relations", "Binds", "Proof"];
    const missing1 = v1.slice(1).filter((w) => !got.includes(w));
    f.push({ check: "outline", grade: "SOFT", file, message: `carries the v1 outline (Boundary · Model · Parts · Relations · Binds · Proof); the construct outline is now Terms → Model → Parts → Boundary → Binds → Proof, and N13 re-shapes it${missing1.length ? ` — and it is missing ${missing1.join(" · ")}` : ""}` });
    return f;
  }

  const want = spec.required;
  const seen = got.filter((g) => want.includes(g) || spec.optional.includes(g));
  const missing = want.filter((w) => !got.includes(w));
  const extra = got.filter((g) => !want.includes(g) && !spec.optional.includes(g));

  if (missing.length) f.push({ check: "outline", grade: "RULE", file, message: `missing section${missing.length > 1 ? "s" : ""}: ${missing.join(" · ")}` });
  if (extra.length) f.push({ check: "outline", grade: "RULE", file, message: `section${extra.length > 1 ? "s" : ""} the ${variant} outline does not have: ${extra.join(" · ")}` });

  // Order, over the sections that belong — a swapped pair is the fault this catches.
  const order = [...spec.optional, ...want];
  const ranked = seen.map((s) => order.indexOf(s));
  for (let i = 1; i < ranked.length; i++) {
    if (ranked[i] < ranked[i - 1]) {
      f.push({ check: "outline", grade: "RULE", file, message: `\`${seen[i - 1]}\` comes before \`${seen[i]}\`; the ${variant} outline is ${order.join(" → ")}` });
      break;
    }
  }
  return f;
}

/**
 * A markdown seat file's header: the one `# ` title, and the lens and status line under it.
 *
 * Both are DERIVED from the metadata block, so the check is that they agree with it rather than
 * that they are present in some shape — a title that drifts from its block is the defect, and a
 * status word that drifts from it is how a face comes to claim what its area files deny.
 */
/**
 * The document with every fenced block blanked out, offsets preserved.
 *
 * A chapter that teaches the document shape SHOWS one, so its example carries a `#` title and a tag
 * line of its own. Scanning the raw text finds two titles in a document that has one.
 */
function outsideFences(src: string): string {
  return src.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) => m.replace(/[^\n]/g, " "));
}

/** The status chip: the icon is the rendering and the word is the value (02-document.md). */
function tagStatus(status: string): string {
  const icon: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  return `${icon[status] ?? "🔮"} ${STATUS_WORD[status] ?? "PLANNING"}`;
}

/** The tag line a document's block renders to, in the fixed order. */
function tagLine(block: any): string {
  const actors = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean).join(" · ");
  return `\`For: ${actors}\` · \`Status: ${tagStatus(block.status)}\``;
}

/**
 * The tag line is RENDERED FROM THE BLOCK, NEVER TYPED (02-document.md, *The tag line*), so it is
 * written here beside the faces rather than corrected file by file. It is the one generated thing
 * that lives in every document rather than between markers in a few, which is why it carries no
 * markers: the whole line is the generated region.
 */
function writeTagLines(tree: string, write: boolean): { touched: string[]; findings: Finding[] } {
  const findings: Finding[] = [];
  const touched: string[] = [];
  for (const file of walkFiles(tree, (p) => p.endsWith(".md"))) {
    const before = readFileSync(file, "utf8");
    const { block } = readBlock(before);
    if (!block || !block.lenses?.length || !(block.status in STATUS_WORD)) continue;
    const want = tagLine(block);
    const bare = outsideFences(before);
    // A CHIP AFTER STATUS IS THE AUTHOR'S AND IS KEPT. The pattern used to end at the Status
    // chip, so a capability chapter's `· `Realizes: …`` made it miss its own tag line and fall
    // through to *there is no tag line* — writing a second one under the title, in every chapter
    // of the corpus. The audit could not see it either, because it reads the first match.
    // `For` and `Status` are rendered from the block; anything after them is carried across.
    const TAG = /^`(?:For|Lenses):[^`\n]*`[ \t]*·[ \t]*`Status:[^`\n]*`((?:[ \t]*·[ \t]*`[^`\n]*`)*)[ \t]*$/m;

    let after: string;
    const at = bare.match(TAG);
    if (at) {
      after = before.slice(0, at.index!) + want + (at[1] ?? "") + before.slice(at.index! + at[0].length);
    } else {
      const h1 = [...bare.matchAll(/^#\s+.+$/gm)];
      if (h1.length !== 1) {
        findings.push({ check: "face", grade: "SOFT", file, message: "no tag line and no single `#` title to render one under" });
        continue;
      }
      const at = h1[0].index! + h1[0][0].length;
      after = before.slice(0, at) + `\n\n${want}` + before.slice(at);
    }
    if (after !== before) { if (write) writeFileSync(file, after); touched.push(relative(tree, file)); }
  }
  return { touched, findings };
}

function checkSeatHeader(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "header", grade, file, message });

  const bare = outsideFences(src);
  // The block's `title` is plain text; the heading may FORMAT it — `\`support-server-ts\`` is the
  // same title in code voice. What must agree is the rendering, so the backticks come off both.
  const plain = (t: string) => text(t).replace(/`/g, "").replace(/\s+/g, " ").trim();
  const h1 = [...bare.matchAll(/^#\s+(.+)$/gm)].map((m) => plain(m[1]));
  if (h1.length !== 1) add("RULE", `${h1.length} \`#\` title${h1.length === 1 ? "" : "s"}; a document has exactly one`);
  else if (h1[0] !== plain(block.title)) add("RULE", `the title \`${h1[0]}\` is not the block's \`${block.title}\``);

  const rule = bare.match(/^`For:\s*([^`]*)`\s*·\s*`Status:\s*([^`]*)`/m);
  if (!rule) { add("RULE", "no `For: … · Status: …` line — every seat file carries one under its title, rendered from its block"); return f; }

  const want = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean);
  const got = rule[1].split("·").map((x) => x.trim()).filter(Boolean);
  const missing = want.filter((w: string) => !got.includes(w));
  const extra = got.filter((g) => !want.includes(g));
  if (missing.length) add("RULE", `the lens line does not carry ${missing.join(" · ")}, which the block declares`);
  if (extra.length) add("RULE", `the lens line carries ${extra.join(" · ")}, which the block does not declare`);

  if (rule[2].trim() !== tagStatus(block.status))
    add("RULE", `the status chip reads \`${rule[2].trim()}\`; the block says \`${block.status}\``);
  return f;
}

function checkHeader(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "header", grade, file, message });
  if (!block) return f;

  // A seat file and a page wear the same six fields in different clothes. The page's two-line
  // `<header>` is the artifacts chapter's; a markdown seat file opens with its `# ` title and the
  // one-line `Lenses: … · Status: …` rule under it. Checking a seat file for a `<header>` element
  // reports every markdown document in the corpus as malformed, which is what it was doing.
  if (!file.endsWith(".html")) return checkSeatHeader(file, src, block);

  const head = src.match(/<header[\s\S]*?<\/header>/);
  if (!head) { add("RULE", "no `<header>` — every page opens with the two-line header"); return f; }
  const h = head[0];

  const line1 = h.match(/class="line1"[^>]*>([\s\S]*?)<\/span>/);
  if (!line1) add("RULE", "no identity line — `{workspace} | {location} | {title}`");
  else {
    const parts = text(line1[1]).split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 3) add("RULE", `the identity line carries ${parts.length} fields, not three`);
    else if (parts[2] !== text(block.title)) add("RULE", `the header title \`${parts[2]}\` is not the block's \`${block.title}\``);
  }

  const h1 = headings(src, "h1").map(text);
  if (h1.length !== 1) add("RULE", `${h1.length} \`<h1>\`; a page has exactly one`);
  else if (h1[0] !== text(block.title)) add("RULE", `the \`<h1>\` \`${h1[0]}\` is not the block's \`${block.title}\``);

  // Type equals the block's variant, and the file name's suffix.
  const typeBadge = h.match(/class="badge type"[^>]*>([\s\S]*?)<\/span>/);
  if (block.variant) {
    const want = block.variant.charAt(0).toUpperCase() + block.variant.slice(1);
    if (!typeBadge) add("RULE", "no Type chip");
    else if (text(typeBadge[1]) !== want) add("RULE", `Type reads \`${text(typeBadge[1])}\`; the block's variant is \`${block.variant}\``);
    const suffix = basename(file).replace(/\.html$/, "").split("-").pop();
    if (suffix !== block.variant && !basename(file).includes(`-${block.variant}.`))
      add("SOFT", `the file name does not end \`-${block.variant}.html\``);
  }

  // For: the lenses, rendered as labels, in the block's order. Never who wrote the page.
  const chips = [...h.matchAll(/class="badge lens"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
  const wantChips = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean);
  if (chips.join(" · ") !== wantChips.join(" · "))
    add("RULE", `For reads \`${chips.join(" · ")}\`; the block's lenses render as \`${wantChips.join(" · ")}\``);
  if (/\bLenses:/.test(h)) add("RULE", "the tag line reads `For:`, never `Lenses:`");

  // Status: the chip carries the enum word; an overview has no chip at all.
  const statusChip = h.match(/class="badge status[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  if (block.variant === "overview") {
    if (statusChip) add("RULE", "an overview shows no status chip");
  } else if (!statusChip) {
    add("RULE", "no Status chip");
  } else if (!text(statusChip[1]).includes(STATUS_WORD[block.status])) {
    add("RULE", `the status chip reads \`${text(statusChip[1])}\`; the block says \`${block.status}\``);
  }
  return f;
}

function checkCards(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const variant = block?.variant;
  const opens = [...src.matchAll(/<div class="open">/g)];

  // A construct and an overview carry no cards at all — the status word says how settled it is.
  if (opens.length && (variant === "construct" || variant === "overview"))
    f.push({ check: "cards", grade: "RULE", file, message: `${opens.length} card${opens.length > 1 ? "s" : ""} on a ${variant}; a question found here becomes a workstream card` });

  // A card never contains another. Whole-file tag balance cannot see this (finding F6).
  let depth = 0, nested = 0;
  for (const m of src.matchAll(/<div class="open">|<div\b|<\/div>/g)) {
    const t = m[0];
    if (t === '<div class="open">') { if (depth > 0) nested++; depth++; }
    else if (t.startsWith("<div")) { if (depth > 0) depth++; }
    else if (depth > 0) depth--;
  }
  if (nested) f.push({ check: "cards", grade: "RULE", file, message: `${nested} card${nested > 1 ? "s are" : " is"} nested inside another; a \`.open\` div was left unclosed` });

  // An answered card does not sit in `Open` — the page is the record, not the arc (finding F5).
  //
  // F19 — THIS TESTED FOR THE MARKER AND NOT FOR AN ANSWER, which is F16 in a second file. The card
  // TEMPLATE ships `<b>Decision:</b> &mdash;`, so a presence test reads every open card as answered
  // and the finding fires on a card nobody has decided. `cardsOf` already carries the right test:
  // a decision counts when its tail holds an actual character, not when the label is present.
  for (const card of cardsOf(file)) {
    if (card.decided)
      f.push({ check: "cards", grade: "RULE", file, message: `${card.number} is answered and still sits in \`Open\`; fold it into the section that now states it` });
  }
  return f;
}

function checkCodeFigures(file: string, src: string, root: string): Finding[] {
  const f: Finding[] = [];
  // A pathed CODE figure names the file above it. The audit reads that file and compares.
  for (const m of src.matchAll(/<p>[^<]*<code>([^<]*?\.(?:ts|tsx|json|sql|md|py|sh|yml|yaml))<\/code>[^<]*<\/p>\s*<pre[^>]*>([\s\S]*?)<\/pre>/g)) {
    const [, path, body] = m;
    const abs = resolve(root, path);
    if (!existsSync(abs)) {
      f.push({ check: "codefig", grade: "RULE", file, message: `a figure names \`${path}\`, and no such file exists` });
      continue;
    }
    const shown = text(body).replace(/\s+/g, " ").trim();
    const actual = readFileSync(abs, "utf8").replace(/\s+/g, " ");
    if (shown.length > 24 && !actual.includes(shown.slice(0, Math.min(shown.length, 120))))
      f.push({ check: "codefig", grade: "RULE", file, message: `the figure copied from \`${path}\` no longer matches that file` });
  }
  return f;
}

/** A Proof row names something an installed workspace can run. */
function checkProof(file: string, src: string): Finding[] {
  const f: Finding[] = [];
  const i = sectionAt(file, src, "Proof");
  if (i < 0) return f;

  // A BEHAVIOUR ROW TYPED INTO A SEAT FILE'S PROOF IS A SECOND COPY OF A STATUS (Q131). The rows
  // live in the register, where the test run writes them, and the produced page joins them; a row
  // typed here is a claim frozen at the moment somebody typed it, and it is the copy a reader
  // happens to be looking at. Recognised by the register's own header rather than by shape, so a
  // typed check table — `Check · Kind · What a green run shows` — is untouched.
  for (const line of src.slice(i).split("\n")) {
    const t = line.trim();
    if (!(t.startsWith("|") && t.endsWith("|"))) continue;
    const names = t.slice(1, -1).split("|").map((c) => c.trim().toLowerCase());
    if (names.includes("id") && names.includes("status")) {
      f.push({ check: "proof", grade: "RULE", file, message: "`Proof` carries a table of behaviour rows. The rows live in `03-behaviors/` — the register the test run writes — and the produced page joins them with the status of the last run (Q131). What is typed here is the checks a reader can run, or nothing" });
      break;
    }
  }

  // A COMMAND IS WRITTEN AS CODE IN BOTH FORMATS, and the markers differ. `text()` strips the
  // `<code>` tags an HTML page uses; markdown's backticks survive it, so every command read from a
  // seat file began with a backtick and matched none of the patterns below — 157 rows across the
  // corpus reported as "may not name a command" while naming perfectly good ones.
  const rows = tablesIn(file, src.slice(i))
    .flat().map((cells) => text(cells[0] ?? "").replace(/`/g, "").trim());
  if (!rows.length) return f;
  const installable = /^(spnutils\b|pnpm test|pnpm test:|npx nx\b|node .*\.ts\b)|\.py\b|\bguard\b|\bgate\b/;
  for (const r of rows) {
    if (!r) continue;
    // A REPOSITORY'S OWN SCRIPT IS NOT A FALSE POSITIVE, and saying so plainly matters: a batch read
    // the vaguer message below as the check being wrong and defended its row. A `pnpm task:*`
    // entry, a `bash tests/…` invocation and a `./script` are all the same fact — real, runnable
    // by whoever holds this checkout, and unrunnable by the partner the Proof row is written for.
    if (/^pnpm task:|^(bash|sh|zsh) \S|^\.\//.test(r))
      f.push({ check: "proof", grade: "SOFT", file, message: `\`${r}\` runs here and not for a partner — it is a script this repository carries rather than a verb an installed workspace has. **This is a true finding, not a heuristic miss.** It is accepted only while no verb runs it; when one exists, name the verb` });
    else if (!installable.test(r) && r.split(" ").length <= 6 && /[a-z]/.test(r) && !/^the /.test(r))
      f.push({ check: "proof", grade: "SOFT", file, message: `\`${r}\` may not name a command an installed workspace has` });
  }
  return f;
}

/** Every `where it lives today` row resolves to a real node — Q86's gate. */
function nodeIndex(workspace: string): Set<string> {
  const names = new Set<string>();
  const walk = (dir: string, depth: number) => {
    if (depth > 4) return;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      if (e === "node_modules" || e === ".git" || e === "dist" || e === ".nx") continue;
      if (e.startsWith(".") && e !== ".claude-plugin") continue;
      const p = join(dir, e);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) { walk(p, depth + 1); continue; }
      // A plugin is a realization with no manifest of its own, so the marketplace's own
      // declaration is read beside the four manifests. Without this, a construct realized by a
      // plugin cannot resolve, and the marketplace repository declares no `sprepo.json` at all.
      if (e === "marketplace.json") {
        try {
          const j = JSON.parse(readFileSync(p, "utf8"));
          for (const pl of j.plugins ?? []) if (typeof pl?.name === "string") names.add(pl.name.toLowerCase());
        } catch { /* another check's finding */ }
        continue;
      }
      if (!["sprepo.json", "spkind.json", "spinfrapkg.json", "spestate.json"].includes(e)) continue;
      try {
        const j = JSON.parse(readFileSync(p, "utf8"));
        for (const v of [j.name, j.code, j?.config?.name, basename(dirname(p))]) if (typeof v === "string" && v) names.add(v.toLowerCase());
        // A GENERAL REPOSITORY HAS NO NODES, so a construct there is realized by a FOLDER. Its
        // top-level source folders are indexed as realizations, because otherwise invariant 6 —
        // every construct has at least one realization row — could never be satisfied in a
        // repository the standard deliberately allows to have no nodes at all (`Q107`).
        if (e === "sprepo.json" && j?.type === "GENERAL") {
          const root = dirname(p);
          for (const entry of readdirSync(root)) {
            if (entry.startsWith(".") || ["docs", "node_modules", "dist"].includes(entry)) continue;
            try { if (statSync(join(root, entry)).isDirectory()) names.add(entry.toLowerCase()); } catch { /* unreadable */ }
          }
        }
      } catch { /* a manifest that does not parse is another check's finding */ }
    }
  };
  walk(workspace, 0);
  return names;
}

/**
 * Where a named section starts, in the spelling the file uses.
 *
 * SAME BLINDNESS AS THE OUTLINE CHECK, FOUND LATER AND IN THREE MORE PLACES. `checkBinds` and
 * `checkProof` looked for `<h2>Binds` and returned early when they did not find it — so on a
 * markdown seat file, which is the ONLY form an author writes, they passed without reading
 * anything. Every construct in the corpus had its Binds and Proof unchecked while the audit
 * reported clean. A check that cannot see its input does not fail loudly; it agrees with you.
 */
function sectionAt(file: string, src: string, name: string): number {
  return file.endsWith(".md")
    ? outsideFences(src).search(new RegExp(`^##\\s+${name}\\b`, "m"))
    : src.search(new RegExp(`<h2[^>]*>\\s*${name}\\b`));
}

/** Every table in a slice, as data rows of cells — header and separator dropped, both formats. */
function tablesIn(file: string, seg: string): string[][][] {
  if (!file.endsWith(".md"))
    return [...seg.matchAll(/<table>[\s\S]*?<\/table>/g)].map((t) =>
      [...t[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
        .map((r) => [...r[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => text(c[1])))
        .filter((cells) => cells.length));
  const out: string[][][] = [];
  let cur: string[][] | null = null;
  for (const raw of outsideFences(seg).split("\n")) {
    const t = raw.trim();
    if (!(t.startsWith("|") && t.endsWith("|") && t.length > 2)) { cur = null; continue; }
    const cells = t.slice(1, -1).split("|").map((c) => c.trim());
    if (/^[\s:|-]*$/.test(cells.join(""))) continue;   // the --- separator under the header
    if (!cur) { cur = []; out.push(cur); continue; }    // the header row itself is not data
    cur.push(cells);
  }
  // A HEADER WITH NO ROWS UNDER IT IS STILL A TABLE, and dropping it would turn *this table has no
  // row* into *this section is missing a table* — two different findings, and only one of them true.
  return out;
}

function checkBinds(file: string, src: string, block: any, nodes: Set<string>): Finding[] {
  const f: Finding[] = [];
  if (block?.variant !== "construct") return f;
  const i = sectionAt(file, src, "Binds");
  const j = sectionAt(file, src, "Proof");
  if (i < 0) return f;
  const seg = src.slice(i, j > i ? j : undefined);
  const tables = tablesIn(file, seg);
  if (tables.length < 2) {
    f.push({ check: "binds", grade: "RULE", file, message: `Binds carries ${tables.length} table${tables.length === 1 ? "" : "s"}; it is two — the rules that hold it, and where it lives today` });
    return f;
  }
  const rows = tables[tables.length - 1].filter((cells) => cells.length >= 4);
  if (!rows.length) {
    f.push({ check: "binds", grade: "RULE", file, message: "the `where it lives today` table has no row; every construct has at least one realization row (invariant 6)" });
    return f;
  }
  const states = rows.map((r) => text(r[3]).toLowerCase());
  const known = states.filter((s) => /^(planned|partial|done)\b/.test(s));
  for (const s of states) if (!/^(planned|partial|done)\b/.test(s))
    f.push({ check: "binds", grade: "SOFT", file, message: `a realization row's state reads \`${s}\`; it is planned · partial · done` });

  // Q86 A — the gate. A construct may not claim IMPLEMENTING or DONE on rows that do not resolve.
  if (block.status === "IMPLEMENTING" || block.status === "DONE") {
    for (const r of rows) {
      const node = text(r[1]);
      const parts = node.split("·").map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        const bare = p.replace(/^the\s+/i, "").toLowerCase();
        if (!bare) continue;
        if (![...nodes].some((n) => n === bare || n.includes(bare) || bare.includes(n)))
          f.push({ check: "binds", grade: "RULE", file, message: `\`${block.status}\` is claimed and the \`Node\` cell \`${p}\` resolves to no node, plugin or repository. A verb, a command or a house word is none of the three — name the node here and put what it provides in \`what it realizes\` (RD.DOCS.066)` });
      }
    }
    const proofRows = j < 0 ? [] : tablesIn(file, src.slice(j)).flat();
    if (j < 0 || !proofRows.length)
      f.push({ check: "binds", grade: "RULE", file, message: `\`${block.status}\` is claimed and \`Proof\` names no command anybody can run` });
  }
  if (known.length && known.every((s) => s.startsWith("done")) && block.status !== "DONE")
    f.push({ check: "binds", grade: "SOFT", file, message: `every realization row is done; the derived status is DONE, and the block says \`${block.status}\`` });
  return f;
}

/** An overview's sections are borrowed from its source, in the source's order. */
function checkOverviewSource(file: string, src: string, block: any, workspace: string): Finding[] {
  const f: Finding[] = [];
  if (block?.variant !== "overview") return f;
  const got = sections(file, src, "h2").map(sectionName);

  if (got[0] !== OVERVIEW_FIXED_FIRST)
    f.push({ check: "overview", grade: "RULE", file, message: `an overview opens with \`${OVERVIEW_FIXED_FIRST}\`, not \`${got[0]}\`` });
  const tail = got.slice(-2);
  if (tail.join(" · ") !== OVERVIEW_FIXED_LAST.join(" · "))
    f.push({ check: "overview", grade: "RULE", file, message: `an overview closes with ${OVERVIEW_FIXED_LAST.join(" then ")}; it closes with ${tail.join(" then ")}` });

  // The source is what parentId names. For a hub that is the repository's CONCEPT.md.
  if (block.parentId !== "concept") return f;
  const concept = process.env.SPN_DOCS_SOURCE ? resolve(process.env.SPN_DOCS_SOURCE) : findConcept(workspace, file);
  if (!concept) {
    f.push({ check: "overview", grade: "SOFT", file, message: "`parentId` is `concept` and no `CONCEPT.md` was found to compare against" });
    return f;
  }
  // A HEADING AT ANY DEPTH IS STILL THE SOURCE'S HEADING. This read `^## ` alone, which is the
  // level the repository's own hub borrows from — and **a domain sits one level down**. The
  // concept names a group at `##` and a domain inside it at `###`, so a domain overview could
  // never pass: every section it borrowed was reported as invented. The rule is *an overview never
  // invents a heading its source does not have*, and that rule says nothing about depth.
  // Fences are blanked first, so an example page inside a code block is not mistaken for structure.
  const source = outsideFences(readFileSync(concept, "utf8"))
    .split("\n").filter((l) => /^#{2,4} /.test(l))
    .map((l) => sectionName(l.replace(/^#{2,4}\s*/, "").replace(/`[^`]*`/g, "").trim()));
  const borrowed = got.slice(1, -2);
  const unknown = borrowed.filter((b) => !source.includes(b));
  if (unknown.length)
    f.push({ check: "overview", grade: "RULE", file, message: `section${unknown.length > 1 ? "s" : ""} with no counterpart in ${relative(workspace, concept)}: ${unknown.join(" · ")} — an overview never invents a heading its source does not have` });
  const kept = borrowed.filter((b) => source.includes(b));
  const ranked = kept.map((k) => source.indexOf(k));
  for (let i = 1; i < ranked.length; i++)
    if (ranked[i] < ranked[i - 1]) {
      f.push({ check: "overview", grade: "RULE", file, message: `\`${kept[i]}\` comes before \`${kept[i - 1]}\`; an overview holds its source's order` });
      break;
    }
  return f;
}

function findConcept(workspace: string, file: string): string | null {
  let dir = dirname(resolve(file));
  for (let i = 0; i < 8; i++) {
    const c = join(dir, "CONCEPT.md");
    if (existsSync(c)) return c;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

/**
 * The ninth check, and the one Q80 A traded for *md and html agree*: a page equals what `page`
 * produces from its seat file. It is cheaper than comparing prose and it catches more, because it
 * also catches a hand edit — the defect the old check could not see.
 */
function checkProduced(file: string, src: string, block: any, workspace: string, templates: string): Finding[] {
  if (block?.variant !== "construct") return [];
  // THIS CHECK JUDGES A PRODUCED PAGE, NEVER THE SEAT FILE IT IS PRODUCED FROM. Asked about a seat
  // file it has nothing to compare: the substitution below is a no-op, so `seat === file`, and it
  // reported the seat as a page missing its own source. Saying nothing is the honest answer — the
  // page does not exist yet, and `docs.ts page` is what creates it.
  if (!/\/artifacts\/constructs\/.*-construct\.html$/.test(file)) return [];
  // The pocket mirrors the seat folder for folder, so the pair is found by path alone.
  const seat = file.replace(/\/artifacts\/constructs\//, "/02-constructs/").replace(/-construct\.html$/, ".md");
  if (seat === file || !existsSync(seat))
    return [{ check: "produced", grade: "SOFT", file, message: "no seat file sits at the mirrored path, so this page cannot be compared with what it would be produced from" }];
  const seatSrc = readFileSync(seat, "utf8");
  const { block: sb } = readBlock(seatSrc);
  if (!sb) return [{ check: "produced", grade: "RULE", file: seat, message: "the seat file has no `spn:doc` block" }];
  let html: string;
  try {
    html = renderPage({
      block: sb,
      markdown: seatSrc.replace(/<!--\s*spn:doc[\s\S]*?-->\n?/, ""),
      workspace: process.env.SPN_ORG ?? "SaaS Plane",
      location: process.env.SPN_LOCATION ?? locationOf(seat, workspace),
      furniture: furniture(templates),
      // The same rewriter `page` used, or this check re-renders with seat-relative links and
      // reports every correctly produced page as hand-edited.
      link: hrefForPage(seat, file),
    }).html;
  } catch (e) {
    return [{ check: "produced", grade: "SOFT", file, message: `the page could not be produced for comparison — ${(e as Error).message}` }];
  }
  if (html === src) return [];
  return [{ check: "produced", grade: "RULE", file,
    message: `this page is not what \`docs.ts page\` produces from ${relative(workspace, seat)}. A page is never edited by hand: edit the seat file and produce it again` }];
}

/** dependsOn is one way and acyclic, over whatever set of constructs is given. */
function checkDepends(files: string[], blocks: Map<string, any>): Finding[] {
  const f: Finding[] = [];
  const byId = new Map<string, { file: string; deps: string[] }>();
  for (const [file, b] of blocks) if (b?.variant === "construct") byId.set(b.id, { file, deps: b.dependsOn ?? [] });
  for (const [id, { file, deps }] of byId) {
    if (deps.includes(id)) f.push({ check: "depends", grade: "RULE", file, message: `\`${id}\` depends on itself` });
    const seen = new Set<string>();
    const walk = (cur: string, trail: string[]): void => {
      for (const d of byId.get(cur)?.deps ?? []) {
        if (d === id) { f.push({ check: "depends", grade: "RULE", file, message: `a dependency cycle: ${[...trail, d].join(" → ")}` }); return; }
        if (seen.has(d)) continue;
        seen.add(d);
        walk(d, [...trail, d]);
      }
    };
    walk(id, [id]);
  }
  // An id nothing in the given set resolves is reported only where a corpus was given.
  if (byId.size > 1) for (const [id, { file, deps }] of byId)
    for (const d of deps) if (!byId.has(d))
      f.push({ check: "depends", grade: "SOFT", file, message: `\`${id}\` depends on \`${d}\`, which is not among the constructs given` });
  return f;
}

// ---------------------------------------------------------------------------- face

// What is generated is generated, and it sits between markers so the prose around it is a person's.
// `face` writes the same bytes on every run: it reads, renders, and replaces the marked region only.
const BEGIN = (what: string) => `<!-- spn:generated ${what} — do not edit inside these markers; \`docs.ts face\` writes it -->`;
const END = "<!-- /spn:generated -->";

function replaceRegion(src: string, what: string, body: string): string {
  const begin = BEGIN(what);
  const i = src.indexOf(begin);
  if (i < 0) return src.trimEnd() + `\n\n${begin}\n${body}\n${END}\n`;
  const j = src.indexOf(END, i);
  if (j < 0) return src.trimEnd() + `\n\n${begin}\n${body}\n${END}\n`;
  return src.slice(0, i) + `${begin}\n${body}\n${END}` + src.slice(j + END.length);
}

type Row = { term: string; contract: string; means: string; construct: string };

/** A markdown table's data rows, as trimmed cells. */
function mdRows(block: string): string[][] {
  return block.split("\n")
    .filter((l) => l.trim().startsWith("|") && !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()))
    .slice(1); // the header
}

function sectionBody(src: string, heading: RegExp): string | null {
  const lines = src.split("\n");
  const i = lines.findIndex((l) => /^##\s/.test(l) && heading.test(l));
  if (i < 0) return null;
  const j = lines.findIndex((l, k) => k > i && /^##\s/.test(l));
  return lines.slice(i + 1, j < 0 ? undefined : j).join("\n");
}

function walkFiles(dir: string, keep: (p: string) => boolean, out: string[] = []): string[] {
  let entries: string[]; try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".git" || e === "dist") continue;
    // `templates/` is excluded BY THE FOLDER rather than per file (03-tree.md, *A seat may carry
    // `templates/`*). A template's block carries placeholders, it sits in no reading order, and it
    // is never a mirror of anything — so no walk of a seat may pick one up as a document.
    if (e === "templates") continue;
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkFiles(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

/** The dictionary: one row per term, three columns, generated from the constructs and the data models. */
function buildDictionary(tree: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const constructsDir = join(tree, "02-constructs");
  const rows: Row[] = [];
  for (const file of walkFiles(constructsDir, (p) => p.endsWith(".md") && basename(p) !== "README.md")) {
    const src = readFileSync(file, "utf8");
    const { block } = readBlock(src);
    const body = sectionBody(src, /Terms\b/);
    if (!body) continue;
    const cells = mdRows(body);
    if (cells.length && cells[0].length < 3) {
      findings.push({ check: "face", grade: "RULE", file, message: "the `Terms` table has two columns; the dictionary needs the consumer's word, the contract term and the meaning (03-tree.md, the dictionary's three sources)" });
      continue;
    }
    for (const c of cells) rows.push({ term: c[0], contract: c[1], means: c[2], construct: block?.title ?? basename(file, ".md") });
  }

  // Where it is stored: the domain's data-model.md is keyed by table and names the term it holds.
  const stored = new Map<string, string>();
  for (const file of walkFiles(join(tree, "04-capabilities"), (p) => basename(p) === "data-model.md")) {
    const body = readFileSync(file, "utf8");
    for (const c of mdRows(body)) {
      if (c.length < 2) continue;
      const table = c[0].replace(/`/g, "").trim();
      for (const term of c[1].split("·").map((x) => x.replace(/`/g, "").trim()).filter(Boolean))
        if (term && !stored.has(term)) stored.set(term, table);
    }
  }

  rows.sort((a, b) => a.term.localeCompare(b.term));
  const lines = ["| Term | Contract term | Where it is stored | From |", "| --- | --- | --- | --- |"];
  for (const r of rows) {
    const key = r.contract.replace(/`/g, "").split("·")[0].trim();
    lines.push(`| ${r.term} | ${r.contract} | ${stored.get(key) ? `\`${stored.get(key)}\`` : "—"} | ${r.construct} |`);
  }
  if (!rows.length) lines.push("| — | — | — | no construct carries a `Terms` table yet |");
  return { body: lines.join("\n"), findings };
}

/**
 * A capability face's Map.
 *
 * TWO SHAPES, BECAUSE Q130 GAVE THE SEAT A SECOND ONE. A face at a seat or domain level still lists
 * MIRRORS, and a mirror is named for the source folder it governs. A face inside a PACKAGE folder
 * lists CHAPTERS, and a chapter realizes a construct — there is no `src/<chapter>/` to govern, and
 * deriving one names a folder that does not exist. Left unsplit, running `face` over a repository
 * that had just been given its chapters would have stamped `src/01-plugin-set/` on all of them.
 */
function buildMap(faceFile: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const dir = dirname(faceFile);
  // A package folder is the level below a domain: `04-capabilities/<domain>/<package>/README.md`.
  const rel = faceFile.replace(/\\/g, "/").split("/04-capabilities/")[1] ?? "";
  if (rel.split("/").length >= 3) return buildChapterMap(faceFile);
  // WHERE THE SOURCE ROOT IS, READ FROM THE FACE RATHER THAN ASSUMED. A mirror is named for the
  // folder it governs, and almost every node roots that at `src/`. A repository whose source is
  // laid out differently — the marketplace, whose source is `plugins/<name>/` — declares its root
  // on the face, and the Map then names a folder that exists instead of one that does not.
  const { block: faceBlock } = readBlock(readFileSync(faceFile, "utf8"));
  const root = (faceBlock?.governs ?? "src").replace(/\/+$/, "");
  const mirrors = walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md" && basename(p) !== "data-model.md")
    .sort((a, b) => a.localeCompare(b));
  const glyph: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  const lines = ["| File | Governs | Carries | Status |", "| --- | --- | --- | --- |"];
  for (const m of mirrors) {
    const rel = relative(dir, m);
    const { block } = readBlock(readFileSync(m, "utf8"));
    if (!block) { findings.push({ check: "face", grade: "RULE", file: m, message: "a mirror with no `spn:doc` block cannot be put in the Map" }); continue; }
    // The mirror is named for the folder it governs, so the path is the derivation.
    const governs = `${root}/${rel.replace(/\.md$/, "")}/`;
    lines.push(`| [${rel}](${rel}) | \`${governs}\` | ${block.summary} | ${glyph[block.status] ?? "🔮"} |`);
  }
  if (mirrors.length === 0) lines.push("| — | — | this layer carries no mirror yet | 🔮 |");
  return { body: lines.join("\n"), findings };
}

/** A package face's Map: one row per chapter, each naming the construct it realizes. */
function buildChapterMap(faceFile: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const dir = dirname(faceFile);
  const chapters = walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md" && basename(p) !== "data-model.md")
    .sort((a, b) => a.localeCompare(b));
  const glyph: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  const lines = ["| Chapter | Realizes | Carries | Status |", "| --- | --- | --- | --- |"];
  for (const m of chapters) {
    const name = relative(dir, m);
    const { block } = readBlock(readFileSync(m, "utf8"));
    if (!block) { findings.push({ check: "face", grade: "RULE", file: m, message: "a chapter with no `spn:doc` block cannot be put in the Map" }); continue; }
    // The construct is declared, and the file name is the fallback — a chapter is numbered as its
    // construct is, so the stem after the number IS the construct wherever nothing says otherwise.
    const realizes = (block.realizes ?? [])[0] ?? name.replace(/\.md$/, "").replace(/^\d\d-/, "");
    lines.push(`| [${name}](${name}) | \`${realizes}\` | ${block.summary} | ${glyph[block.status] ?? "🔮"} |`);
  }
  if (!chapters.length) lines.push("| — | — | this package realizes no construct yet | 🔮 |");
  return { body: lines.join("\n"), findings };
}

/**
 * A domain's face, generated from the concept's own section: the bridge paragraph, then its
 * constructs in dependency order. The story is written once, in the concept, so the tree cannot
 * disagree with it.
 */
function conceptSections(concept: string): Map<string, { bridge: string; lines: string[] }> {
  const out = new Map<string, { bridge: string; lines: string[] }>();
  const lines = readFileSync(concept, "utf8").split("\n");
  let name: string | null = null, bridge: string[] = [], items: string[] = [];
  // THE BRIDGE IS ONE PARAGRAPH, AND CLOSING IT IS THE WHOLE RULE. The concept's shape is *one
  // section per domain, opening with a paragraph saying why that domain comes here, followed by one
  // line per construct*. Collecting every non-bullet line until a bullet appears reads that as *the
  // paragraph is everything before the list* — which is true only for a section that HAS a list. A
  // section written as prose and tables has none, so the bridge swallowed the whole section and
  // joined it with single spaces: sub-headings, table pipes and all, on one line. `### Docs` is that
  // section, and every domain face in this book carried the dump.
  let closed = false;
  const flush = () => { if (name && !out.has(name)) out.set(name, { bridge: bridge.join(" ").trim(), lines: items }); };
  for (const l of lines) {
    // A group is named by a `##` section and a domain inside it by a `###` one, so both are read.
    // A repository that groups by stage names the group once and each domain once, at two depths.
    if (/^###?\s/.test(l)) { flush(); name = sectionKey(l.replace(/^###?\s*/, "")); bridge = []; items = []; closed = false; continue; }
    if (name === null) continue;
    if (/^[-*]\s/.test(l)) { items.push(l.replace(/^[-*]\s*/, "")); continue; }
    // A blank line ends the opening paragraph. What follows is the section's body, which the face
    // does not carry — the constructs under it do.
    if (!l.trim()) { if (bridge.length) closed = true; continue; }
    // A deeper heading, a table or a fence is body rather than prose, and ends the paragraph even
    // where no blank line separates it.
    if (/^#{4,}\s/.test(l) || l.trim().startsWith("|") || l.trim().startsWith("```")) { closed = true; continue; }
    if (!items.length && !closed) bridge.push(l.trim());
  }
  flush();

  // A CONCEPT ALSO NAMES ITS DOMAINS IN A TABLE, and that is not a shortcut its author took — the
  // document chapter's own format rule is *prefer a table over a prose list of parallel facts*, and
  // one line per domain is exactly that. `spn-support-ts` names all nine under *What the stack
  // ships*; `spn-platform-ts` names all nine under *The domains it holds*. Invariant 1 asks whether
  // the concept NAMES the domain, so a row naming it is a declaration and a heading is not the only
  // shape one can take. A heading wins where both exist, because it carries the argument.
  for (const l of lines) {
    const cells = l.trim().startsWith("|") ? l.split("|").slice(1, -1).map((c) => c.trim()) : null;
    if (!cells || cells.length < 2 || /^[\s:|-]+$/.test(cells.join(""))) continue;
    const key = sectionKey(cells[0]);
    if (!key || out.has(key)) continue;
    out.set(key, { bridge: cells.slice(1).filter(Boolean).join(" — "), lines: [] });
  }
  return out;
}

/**
 * The comparable name of a concept heading.
 *
 * A heading is written for a reader — `## SaaS Plane — Foundation`, `### Data & Trust` — and a
 * folder is written for a path. This strips what only the reader needs: the book's own name, the
 * status chip a concept section carries, and the punctuation a folder cannot hold.
 */
function sectionKey(heading: string): string {
  return heading
    .replace(/`[^`]*`/g, "")
    .replace(/^SaaS Plane\s*[—–-]\s*/i, "")
    .replace(/^(?:The|A|An)\s+/i, "")
    .replace(/\s*&\s*/g, "-and-")
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The folder name a domain or group folder carries, with its reading-order prefix stripped. */
function folderKey(folder: string): string {
  return folder.replace(/^\d+-/, "").toLowerCase();
}

/** Constructs in an order no construct precedes one it depends on. */
function readingOrder(constructs: { id: string; title: string; summary: string; deps: string[]; file: string }[]) {
  const byId = new Map(constructs.map((c) => [c.id, c]));
  const done = new Set<string>(), out: typeof constructs = [];
  const visit = (c: (typeof constructs)[number], trail: Set<string>) => {
    if (done.has(c.id) || trail.has(c.id)) return;
    trail.add(c.id);
    for (const d of c.deps) { const dep = byId.get(d); if (dep) visit(dep, trail); }
    trail.delete(c.id);
    if (!done.has(c.id)) { done.add(c.id); out.push(c); }
  };
  for (const c of constructs) visit(c, new Set());
  return out;
}

/**
 * A link target moved from one document into another, re-based.
 *
 * A face's bridge is the concept's own prose, and the concept sits at the repository root. Its
 * relative links resolve from there. Copied verbatim into `02-constructs/<group>/<domain>/README.md`
 * they resolve from four levels down, which is a broken link the generator itself wrote.
 */
function rebase(body: string, fromDir: string, toDir: string): string {
  return body.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^(?:https?:|mailto:|#|\/)/.test(target)) return whole;
    const [path, hash] = target.split(/(?=#)/);
    if (!path) return whole;
    return `](${relative(toDir, resolve(fromDir, path))}${hash ?? ""})`;
  });
}

/** Every folder under the constructs seat, deepest last — each one carries a face. */
function constructFolders(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e);
      if (!statSync(p).isDirectory()) continue;
      out.push(p);
      walk(p);
    }
  };
  walk(root);
  return out;
}

/**
 * A group holds domains and never constructs of its own.
 *
 * That is the tree chapter's grouping rule read as a test rather than as a convention: *a group
 * holding one domain IS that domain's folder*, so a folder carrying a construct file is the thing
 * itself and never a level above it.
 */
function isGroup(dir: string): boolean {
  try {
    const entries = readdirSync(dir);
    // A group holds DOMAINS. An empty folder holds neither, so it is a domain with nothing written
    // in it yet — which is the compact state of every seat the day it is minted, and reporting it
    // as a group would hide every domain in a repository that has not started writing.
    if (!entries.some((e) => { try { return statSync(join(dir, e)).isDirectory(); } catch { return false; } })) return false;
    return !entries.some((e) => e.endsWith(".md") && e !== "README.md");
  } catch { return false; }
}

function domainFaces(tree: string, concept: string | null): { faces: Map<string, string>; concept: string | null; findings: Finding[] } {
  const findings: Finding[] = [];
  const faces = new Map<string, string>();
  const sections = concept ? conceptSections(concept) : new Map();
  const conceptDir = concept ? dirname(concept) : tree;

  const constructsDir = join(tree, "02-constructs");
  const folders = constructFolders(constructsDir);

  type Construct = { id: string; title: string; summary: string; deps: string[]; file: string };
  const constructsUnder = (dir: string): Construct[] => {
    const out: Construct[] = [];
    for (const f of walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md")) {
      const { block } = readBlock(readFileSync(f, "utf8"));
      if (!block) continue;
      out.push({ id: block.id, title: block.title, summary: block.summary, deps: block.dependsOn ?? [], file: f });
    }
    return out;
  };

  /** The concept section a folder is named by, or null where the concept names no such thing. */
  const named = (dir: string): string | null => {
    const key = folderKey(basename(dir));
    return [...sections.keys()].find((k) => k === key) ?? null;
  };

  for (const dir of folders) {
    const depth = relative(constructsDir, dir).split("/").length;
    const key = named(dir);

    // Invariant 1 asks the concept, and it asks it of a DOMAIN. A group is depth 1 and a domain is
    // depth 1 flat or depth 2 grouped; anything deeper is a level, which organizes an argument and
    // is named by its author rather than by the concept.
    const isDomainOrGroup = depth === 1 || (depth === 2 && isGroup(dirname(dir)));
    if (!key && concept && isDomainOrGroup) {
      findings.push({ check: "face", grade: "RULE", file: dir, message: `the concept names no section \`${folderKey(basename(dir))}\`, and a domain folder exists only where the concept names that domain (invariant 1)` });
    }

    const bridge = key ? rebase(sections.get(key)!.bridge, conceptDir, dir) : "";

    // A group's face maps the domains under it; a domain's face lists its constructs in order.
    const body = isGroup(dir)
      ? [bridge, "", "| Domain | What it holds |", "| --- | --- |",
         ...readdirSync(dir).filter((e) => { try { return statSync(join(dir, e)).isDirectory(); } catch { return false; } }).sort()
           .map((e) => { const k = named(join(dir, e)); return `| [${k ?? folderKey(e)}](${e}/README.md) | ${k ? rebase(sections.get(k)!.bridge.split(". ")[0], conceptDir, dir) : "—"} |`; })]
      : [bridge, "", "| Construct | What it is |", "| --- | --- |",
         ...readingOrder(constructsUnder(dir)).map((c) => `| [${c.title}](${relative(dir, c.file)}) | ${c.summary} |`)];

    faces.set(join(dir, "README.md"), body.filter((l, i) => !(i === 0 && !l)).join("\n"));
  }

  // The concept's own line per construct, filed under the folder that holds it.
  //
  // ONE LINE PER CONSTRUCT, AND THE EMPHASIS IS ON *ONE*. `constructsUnder` recurses, which is
  // right for a FACE — a face maps everything below it — and wrong here: a domain and each level
  // beneath it both got a heading, so every construct in a nested domain was listed twice. The
  // concept is an outline, and an outline that names a thing twice is not one. So a folder
  // contributes only what sits DIRECTLY in it, and the nesting still shows through the headings.
  let conceptBody: string | null = null;
  if (concept) {
    const out: string[] = [];
    for (const dir of folders.filter((d) => !isGroup(d)).sort()) {
      const mine = constructsUnder(dir).filter((c) => dirname(c.file) === dir);
      if (!mine.length) continue;
      out.push(`**${named(dir) ?? folderKey(basename(dir))}**`, "");
      for (const c of readingOrder(mine)) out.push(`- **${c.title}** — ${c.summary}`);
      out.push("");
    }
    conceptBody = out.join("\n").trimEnd();
  }
  return { faces, concept: conceptBody, findings };
}

function face(tree: string, write: boolean): Finding[] {
  const findings: Finding[] = [];
  const touched: string[] = [];

  const dictFace = join(tree, "02-constructs", "README.md");
  if (existsSync(dictFace)) {
    const { body, findings: df } = buildDictionary(tree);
    findings.push(...df);
    const before = readFileSync(dictFace, "utf8");
    const after = replaceRegion(before, "dictionary", body);
    if (after !== before) { if (write) writeFileSync(dictFace, after); touched.push(relative(tree, dictFace)); }
  } else {
    findings.push({ check: "face", grade: "SOFT", file: dictFace, message: "no constructs seat face to write the dictionary into" });
  }

  // The domain faces, and the concept's one line per construct.
  const conceptFile = ["CONCEPT.md", join("..", "CONCEPT.md")].map((c) => join(tree, c)).find(existsSync) ?? null;
  const { faces, concept: conceptBody, findings: dfz } = domainFaces(tree, conceptFile);
  findings.push(...dfz);
  for (const [file, body] of faces) {
    if (!existsSync(file)) { findings.push({ check: "face", grade: "SOFT", file, message: "no domain face to write into" }); continue; }
    const before = readFileSync(file, "utf8");
    const after = replaceRegion(before, "domain", body);
    if (after !== before) { if (write) writeFileSync(file, after); touched.push(relative(tree, file)); }
  }
  if (conceptFile && conceptBody) {
    const before = readFileSync(conceptFile, "utf8");
    const after = replaceRegion(before, "constructs", conceptBody);
    if (after !== before) { if (write) writeFileSync(conceptFile, after); touched.push(relative(tree, conceptFile)); }
  }

  // A Map is a list of MIRRORS, and a mirror is named for the source folder it governs. Where a
  // repository's capabilities seat is AUTHORED rather than derived — the foundation book, and only
  // it (03-tree.md, *Number what is ordered*) — there is no source folder for a row to name, and
  // generating one invents a `src/` the repository does not have.
  const authored = (() => {
    try { return JSON.parse(readFileSync(join(tree, "..", "sprepo.json"), "utf8")).type === "FOUNDATION"; }
    catch { return false; }
  })();

  for (const faceFile of authored ? [] : walkFiles(join(tree, "04-capabilities"), (p) => basename(p) === "README.md")) {
    const { body, findings: mf } = buildMap(faceFile);
    findings.push(...mf);
    const before = readFileSync(faceFile, "utf8");
    const after = replaceRegion(before, "map", body);
    if (after !== before) { if (write) writeFileSync(faceFile, after); touched.push(relative(tree, faceFile)); }
  }

  const tags = writeTagLines(tree, write);
  findings.push(...tags.findings);

  console.log(touched.length
    ? `${write ? "wrote" : "would write"} ${touched.length} face${touched.length > 1 ? "s" : ""}:\n  ${touched.join("\n  ")}`
    : "every face is already current");
  console.log(tags.touched.length
    ? `${write ? "wrote" : "would write"} ${tags.touched.length} tag line${tags.touched.length > 1 ? "s" : ""}`
    : "every tag line is already rendered from its block");
  return findings;
}

// ---------------------------------------------------------------------------- status

/**
 * A construct's status is derived from its own content, never typed: from the *where it lives today*
 * rows in `Binds`, and from `Proof`. `Q86` A then made the derivation a **gate** — it refuses a claim
 * of IMPLEMENTING or DONE whose rows do not resolve, because deriving the badge proves a construct
 * is well-formed and says nothing about whether it is true.
 *
 * It writes the seat file only. The page follows from `docs.ts page`, so there is one writer per file.
 */
function statusFor(seat: string, workspace: string, nodes: Set<string>, write: boolean): Finding[] {
  const findings: Finding[] = [];
  const src = readFileSync(seat, "utf8");
  const { block, error } = readBlock(src);
  if (!block) return [{ check: "status", grade: "RULE", file: seat, message: error ?? "no spn:doc block" }];
  if (block.variant !== "construct") return [];

  const binds = sectionBody(src, /Binds\b/) ?? "";
  const proof = sectionBody(src, /Proof\b/) ?? "";

  // The second table of Binds is *where it lives today*. Split on the blank line between them.
  const tables = binds.split(/\n\s*\n/).filter((t) => /^\s*\|/m.test(t));
  const rows = tables.length ? mdRows(tables[tables.length - 1]) : [];
  const states = rows.map((r) => (r[3] ?? "").toLowerCase());
  const proofRows = mdRows(proof).filter((r) => r[0] && r[0] !== "—");

  let derived: "PLANNING" | "IMPLEMENTING" | "DONE";
  if (!rows.length || states.every((s) => s.startsWith("planned"))) derived = "PLANNING";
  else if (states.every((s) => s.startsWith("done")) && proofRows.length) derived = "DONE";
  else derived = "IMPLEMENTING";

  // The gate. A row resolves when its Node cell names a node, a plugin or a repository.
  if (derived !== "PLANNING") {
    for (const r of rows) {
      const cell = (r[1] ?? "").replace(/`/g, "").trim();
      if (!cell) continue;
      const bare = cell.replace(/^the\s+/i, "").toLowerCase();
      if (![...nodes].some((n) => n === bare || n.includes(bare) || bare.includes(n)))
        findings.push({ check: "status", grade: "RULE", file: seat,
          message: `\`${derived}\` is derived and the \`Node\` cell \`${cell}\` resolves to no node, plugin or repository — name the node and put what it provides in \`what it realizes\` (RD.DOCS.066)` });
    }
    if (!proofRows.length)
      findings.push({ check: "status", grade: "RULE", file: seat,
        message: `\`${derived}\` is derived and \`Proof\` names no command anybody can run (RD.DOCS.066)` });
  }

  if (findings.some((f) => f.grade === "RULE")) {
    console.log(`refused  ${relative(workspace, seat)} — ${derived} is claimed and the rows do not carry it`);
    return findings;
  }

  // Write the derived word into the block and the tag line. Both, or the page and the block disagree.
  const glyph: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  let out = src;
  if (block.status !== derived) {
    out = out.replace(/("status":\s*")(DONE|IMPLEMENTING|PLANNING)(")/, `$1${derived}$3`);
    // The tag line is two backtick spans — `For: …` · `Status: …` — so the status span is matched
    // on its own. Assuming one span is why the first version wrote the block and left the badge.
    out = out.replace(/(`Status:\s*)([✅🚧🔮])(\s*)(DONE|IMPLEMENTING|PLANNING)(`)/u,
                      `$1${glyph[derived]}$3${derived}$5`);
  }
  if (out === src) { console.log(`current  ${relative(workspace, seat)} — ${derived}`); return findings; }
  if (write) { writeFileSync(seat, out); console.log(`wrote    ${relative(workspace, seat)} — ${block.status} → ${derived}`); }
  else findings.push({ check: "status", grade: "RULE", file: seat, message: `the block says \`${block.status}\` and the rows derive \`${derived}\`` });
  return findings;
}

// ---------------------------------------------------------------------------- page

/**
 * The furniture: the template's first stylesheet, then every later stylesheet and every script,
 * taken from the template in its own order. The rail builder runs first, the fold and the anchor
 * links after it, so a script that reads a heading's text sees it before the anchor is appended.
 */
function furniture(templates: string): { style: string; scripts: string; footer: string } {
  const t = readFileSync(join(templates, "pages", "construct-template.html"), "utf8");
  const styles = [...t.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]);
  const scripts = [...t.matchAll(/<script>[\s\S]*?<\/script>/g)].map((m) => m[0]);
  const foldStyle = styles.slice(1).join("\n\n");
  const footer = t.match(/<footer>[\s\S]*?<\/footer>/)?.[0] ?? "<footer></footer>";
  return {
    style: styles[0] ?? "",
    scripts: [scripts[0] ?? "", foldStyle, ...scripts.slice(1)].filter(Boolean).join("\n\n"),
    footer,
  };
}

/** The location field: a declared name, never a folder. */
function locationOf(seat: string, workspace: string): string {
  let dir = dirname(resolve(seat));
  for (let i = 0; i < 8; i++) {
    for (const m of ["sprepo.json", "spkind.json"]) {
      const f = join(dir, m);
      if (existsSync(f)) {
        try {
          const j = JSON.parse(readFileSync(f, "utf8"));
          if (typeof j.name === "string" && j.name) return j.name;
        } catch { /* another check's finding */ }
      }
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return "—";
}

/** Today, on the clock the reader shares. `toISOString` is UTC, which is a day behind here. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------- the Proof join (Q131, opened by Q138)

/**
 * The register file holding one construct's behaviour rows.
 *
 * `Q138` A is what makes this a lookup rather than a search: a topic is one file of rows at the
 * SAME relative path as its construct, so `02-constructs/01-iam/04-sign-in.md` is proved by
 * `03-behaviors/01-iam/04-sign-in.md` and nothing has to guess which rows belong to which page.
 *
 * The fallbacks exist for exactly as long as the move does. Until step 6 regroups them, a domain
 * still keeps one register for all of its topics — as a `README.md` of rows in the platform today,
 * or as a single `<domain>.md` elsewhere — and a page that refused to render during the move would
 * make the move impossible to check as it went. A fallback is reported, never silent.
 */
function registerFor(seat: string): { file: string; exact: boolean } | null {
  const norm = seat.replace(/\\/g, "/");
  const at = norm.indexOf("/02-constructs/");
  if (at < 0) return null;
  const rel = norm.slice(at + "/02-constructs/".length);
  const root = `${norm.slice(0, at)}/03-behaviors/`;
  if (existsSync(root + rel)) return { file: root + rel, exact: true };
  const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
  if (!dir) return null;
  for (const fallback of [`${root}${dir}/README.md`, `${root}${dir}.md`])
    if (existsSync(fallback)) return { file: fallback, exact: false };
  return null;
}

type BehaviourRow = { id: string; does: string; tier: string; status: string };

/**
 * Every behaviour row in a register file, read by COLUMN NAME rather than by position.
 *
 * The row grammar is nine cells and a foundation promise is four, so a fixed index would read the
 * wrong cell on one of the two. Reading the header means a register that gains a column keeps
 * joining, and a table that is not a behaviour table — a persona list, an explanatory table inside
 * the prose — is skipped because it has no `Id` and no `Status`.
 */
function behaviourRows(file: string): BehaviourRow[] {
  const src = outsideFences(readFileSync(file, "utf8"));
  const out: BehaviourRow[] = [];
  let head: string[] | null = null;
  for (const raw of src.split("\n")) {
    const t = raw.trim();
    if (!(t.startsWith("|") && t.endsWith("|") && t.length > 2)) { head = null; continue; }
    const cells = t.slice(1, -1).split("|").map((c) => c.trim());
    if (/^[\s:|-]*$/.test(cells.join(""))) continue;
    if (!head) { head = cells.map((c) => c.toLowerCase()); continue; }
    const at = (name: string): number => head!.indexOf(name);
    if (at("id") < 0) continue;
    const id = cells[at("id")] ?? "";
    if (!/^[A-Z]/.test(id.replace(/[`*]/g, ""))) continue;   // a continuation line, not a row
    out.push({
      id: id.replace(/[`*]/g, ""),
      does: cells[at("does")] ?? cells[at("journey")] ?? "",
      tier: cells[at("tier")] ?? "—",
      status: cells[at("status")] ?? "—",
    });
  }
  return out;
}

/**
 * The joined rows, written into the seat's own `## Proof` before it is rendered.
 *
 * THE SEAT FILE IS NOT TOUCHED. The join happens on the markdown in memory, which is the whole
 * point of `Q131`: a status lives in one place — the register the test run writes — and a page
 * that carries it carries a copy that cannot drift, because it is produced again on every write.
 *
 * The rows go ABOVE the typed checks and below whatever prose the seat opens the section with,
 * which is the order the reviewed sample uses: what the product promises, then what you can run.
 */
function joinProof(seat: string, markdown: string, workspace: string): { md: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const reg = registerFor(seat);
  if (!reg) return { md: markdown, findings };
  const rows = behaviourRows(reg.file);
  if (!rows.length) return { md: markdown, findings };
  if (!reg.exact)
    findings.push({ check: "proof", grade: "SOFT", file: seat,
      message: `the behaviour rows were joined from \`${relative(workspace, reg.file)}\`, the domain's register, because this topic has no file of its own yet — \`Q138\` A puts one row file beside each construct, and step 6 writes it` });

  const lines = markdown.split("\n");
  const head = lines.findIndex((l) => /^##\s+Proof\b/.test(l));
  if (head < 0) return { md: markdown, findings };
  const next = lines.findIndex((l, k) => k > head && /^##\s/.test(l));
  const endOf = next < 0 ? lines.length : next;
  let cut = lines.findIndex((l, k) => k > head && k < endOf && l.trim().startsWith("|"));
  if (cut < 0) cut = endOf;

  const at = today();
  // Named relative to the repository's own `docs/`, which is how every other path on a page reads.
  const treeRoot = seat.replace(/\\/g, "/").slice(0, seat.replace(/\\/g, "/").indexOf("/02-constructs/"));
  const shown = relative(treeRoot, reg.file).replace(/\\/g, "/");
  const table = [
    "",
    `*Behaviours: joined from the register, \`${shown}\` as of ${at} — never typed in the seat file.*`,
    "",
    "| Row | Does | Tier | Status |",
    "| --- | --- | --- | --- |",
    ...rows.map((r) => `| \`${r.id}\` | ${r.does} | ${r.tier} | ${r.status} |`),
    "",
  ];
  return { md: [...lines.slice(0, cut), ...table, ...lines.slice(cut)].join("\n"), findings };
}

function pageFor(seat: string, workspace: string, templates: string, write: boolean): Finding[] {
  const findings: Finding[] = [];

  // A PAGE IS PRODUCED FROM A CONSTRUCT SEAT AND FROM NOTHING ELSE. Given a whole docs tree, this
  // walked every `.md` in it and wrote `<name>-construct.html` beside each one — purpose files,
  // guides, data models, even a report — because the seat-to-page mapping below silently falls
  // through for a path with no `/02-constructs/` in it. Eighteen junk pages in one run, all of them
  // claiming to be constructs. A folder is a convenience for the caller, never a licence to produce.
  if (!seat.replace(/\\/g, "/").includes("/02-constructs/")) return findings;

  const src = readFileSync(seat, "utf8");
  const { block, error } = readBlock(src);
  if (!block) { findings.push({ check: "page", grade: "RULE", file: seat, message: error ?? "no spn:doc block" }); return findings; }

  const stripped = src.replace(/<!--\s*spn:doc[\s\S]*?-->\n?/, "");
  const { md: markdown, findings: jf } = joinProof(seat, stripped, workspace);
  findings.push(...jf);
  const org = process.env.SPN_ORG ?? "SaaS Plane";
  const location = process.env.SPN_LOCATION ?? locationOf(seat, workspace);
  if (location === "—")
    findings.push({ check: "page", grade: "SOFT", file: seat, message: "no manifest above this file declares a `name`, so the header's location reads `—` (Q79 puts `name` on the manifests)" });

  // The page sits beside its seat file, in the pocket that mirrors the seat folder for folder.
  // It is computed BEFORE rendering because the body's links are re-expressed against it: the seat
  // writes `platform-grants.md` for a sibling, and beside the page that sibling is
  // `platform-grants-construct.html`.
  const out = seat.replace(/\/02-constructs\//, "/artifacts/constructs/").replace(/\.md$/, "-construct.html");

  const { html, findings: rf } = renderPage({
    block, markdown, workspace: org, location, furniture: furniture(templates),
    link: hrefForPage(seat, out),
  });
  for (const r of rf) findings.push({ check: "page", grade: "RULE", file: seat, message: r.message });
  const before = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (before === html) { console.log(`current  ${relative(workspace, out)}`); return findings; }
  if (write) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    console.log(`${before ? "rewrote " : "wrote   "} ${relative(workspace, out)}`);
  } else {
    findings.push({ check: "page", grade: "RULE", file: out,
      message: before ? "this page is not what `docs.ts page` produces from its seat file — it was edited by hand, or the seat file moved on" : "no page has been produced from this seat file yet" });
  }
  return findings;
}

// ------------------------------------------------- the topics check, and capability coverage

/** A numbered document's topic name: `04-sign-in.md` is `sign-in`. Unnumbered files are not topics. */
function topicName(file: string): string | null {
  const m = /^(\d\d)-(.+)\.md$/.exec(basename(file));
  return m ? m[2] : null;
}

/** Every topic the constructs seat names, with the domain folder each sits in. */
function constructTopics(repo: string): Map<string, string> {
  const seat = join(repo, "docs", "02-constructs");
  const out = new Map<string, string>();
  if (!existsSync(seat)) return out;
  for (const f of walkFiles(seat, (x) => x.endsWith(".md"))) {
    const name = topicName(f);
    if (name) out.set(name, relative(seat, dirname(f)).replace(/\\/g, "/"));
  }
  return out;
}

/**
 * A topic the constructs seat does not name may not appear in the other two seats.
 *
 * This is the rule `03-tree.md` states under *One outline, three seats*, and it is the reason the
 * numbers mean anything: one number names the model, the rows and the standard of one thing. Without
 * a check the three seats drift apart one file at a time, each growing a topic the others never
 * heard of — which is how a corpus ends up with three different answers to *what is this repository
 * about*.
 *
 * The domain is checked as well as the name, because a topic that moved domain without moving in
 * all three seats is the same drift wearing a name that still resolves.
 */
function topicsCheck(repo: string): Finding[] {
  const f: Finding[] = [];
  const named = constructTopics(repo);
  // NO EARLY RETURN ON AN EMPTY SET. It was here, and it made the check vacuous on every repository
  // in the corpus: constructs are not numbered until step 6 numbers them, so `named` was empty, and
  // an empty set made every numbered behaviours file pass by being compared against nothing. A check
  // that reports clean because it found no rule to apply is worse than no check — it is a green light
  // over an unexamined tree. An absent seat is the one honest silence, and `constructTopics` already
  // gives it.
  if (!existsSync(join(repo, "docs", "02-constructs"))) return f;

  const behaviors = join(repo, "docs", "03-behaviors");
  for (const file of existsSync(behaviors) ? walkFiles(behaviors, (x) => x.endsWith(".md")) : []) {
    const name = topicName(file);
    if (name === null) continue;
    const domain = named.get(name);
    if (domain === undefined) {
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` is a numbered topic of the behaviours seat and \`02-constructs/\` names no such construct — the constructs name the topics and the other two seats follow (03-tree.md, *One outline, three seats*)` });
      continue;
    }
    const here = relative(behaviors, dirname(file)).replace(/\\/g, "/");
    if (here !== domain)
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` sits under \`${here}\` here and under \`${domain}\` in the constructs seat — one topic, one domain, the same number in all three seats` });
  }

  // In capabilities a chapter sits inside its package folder, so the domain is its GRANDPARENT.
  const caps = join(repo, "docs", "04-capabilities");
  for (const file of existsSync(caps) ? walkFiles(caps, (x) => x.endsWith(".md")) : []) {
    const name = topicName(file);
    if (name === null) continue;
    if (!named.has(name))
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` is a numbered chapter of the capabilities seat and \`02-constructs/\` names no such construct — a chapter realizes a construct or it is not a chapter (Q130)` });
  }
  return f;
}

/** The nodes a construct's Binds table says realize it — the second table, whose first column is the repo. */
function realizingNodes(seatFile: string): string[] {
  const binds = sectionBody(readFileSync(seatFile, "utf8"), /Binds\b/);
  if (binds === null) return [];
  const out: string[] = [];
  for (const row of mdRows(binds)) {
    // The rules table is `Rule | What it decides | Weight`; the placements table is
    // `Repo | Node | What it realizes | State`. Four cells with a node in the second is the one.
    if (row.length < 4) continue;
    const node = (row[1] ?? "").replace(/[`*]/g, "").trim();
    if (/^[a-z][a-z0-9-]*$/.test(node)) out.push(node);
  }
  return out;
}

/**
 * The three halves of *the capabilities seat mirrors the code*, checked together.
 *
 * They are one verb because each alone is satisfiable by doing nothing. A check that every chapter
 * names a construct passes on an empty seat; a check that every construct has a chapter passes on a
 * repository with no packages. Only together do they say the seat and the code are the same shape.
 *
 * The third — every package with code realizes a construct — is the one that catches a package
 * nobody documented, which is the failure the gap scan kept finding by hand.
 */
function coverageCheck(repo: string, workspace: string): Finding[] {
  const f: Finding[] = [];
  const seat = join(repo, "docs", "02-constructs");
  const caps = join(repo, "docs", "04-capabilities");
  if (!existsSync(seat)) return f;

  // what the seat SAYS, per construct: which nodes realize it
  const claimed = new Map<string, { domain: string; nodes: string[]; file: string }>();
  for (const file of walkFiles(seat, (x) => x.endsWith(".md"))) {
    const name = topicName(file);
    if (name === null) continue;
    claimed.set(name, { domain: relative(seat, dirname(file)).replace(/\\/g, "/"), nodes: realizingNodes(file), file });
  }

  // what the seat HAS, per construct: which package folders hold a chapter for it
  const written = new Map<string, Set<string>>();
  for (const file of existsSync(caps) ? walkFiles(caps, (x) => x.endsWith(".md")) : []) {
    const name = topicName(file);
    if (name === null) continue;
    const pkg = basename(dirname(file));
    if (!written.has(name)) written.set(name, new Set());
    written.get(name)!.add(pkg);
  }

  for (const [name, { nodes, file }] of claimed) {
    const has = written.get(name) ?? new Set<string>();
    for (const node of nodes)
      if (!has.has(node))
        f.push({ check: "coverage", grade: "RULE", file, message: `\`${name}\` says \`${node}\` realizes it and \`04-capabilities/\` carries no chapter for it there — every construct owes a chapter in every package that realizes it (Q130)` });
  }

  // every package with code realizes something
  const nodes = walkFiles(repo, (x) => basename(x) === "spkind.json")
    .filter((x) => !x.includes("/dist/") && !x.includes("/node_modules/"))
    .map((x) => basename(dirname(x)));
  const realizes = new Set([...claimed.values()].flatMap((c) => c.nodes));
  for (const node of new Set(nodes))
    if (!realizes.has(node))
      f.push({ check: "coverage", grade: "SOFT", file: join(repo, "docs", "02-constructs", "README.md"),
        message: `\`${node}\` holds code and no construct's Binds names it — either it realizes a construct nobody wrote down, or it is a node nobody documented (${relative(workspace, repo)})` });
  return f;
}

// ---------------------------------------------------------------------------- the gap scan

/**
 * One report per repository, written into its own pocket — which is where the standard puts a
 * measurement, and why a stale one is safe to leave standing.
 *
 * IT EDITS NOTHING IT MEASURES. A scan that fixes as it goes cannot be trusted as a measure, and
 * that is the whole reason this is a verb of its own rather than a flag on `face`.
 *
 * **It says what it does not measure.** Three of the nine prose faults cannot be told from good
 * prose by a pattern; a construct nobody has written cannot be counted against a list nobody has
 * written either; and the symbol index is a per-package build this cannot run. Each is named in the
 * report rather than left to look like a zero.
 */
function gapReport(repo: string, workspace: string): number {
  const tree = join(repo, "docs");
  if (!existsSync(tree)) { console.error(`${relative(workspace, repo)} has no docs/ tree`); return 2; }
  const name = basename(resolve(repo));
  const at = today();

  const seats = ["01-purpose", "02-constructs", "03-behaviors", "04-capabilities", "05-guides"];
  const seatRows = seats.map((seat) => ({
    seat,
    present: existsSync(join(tree, seat, "README.md")),
    files: existsSync(join(tree, seat)) ? walkFiles(join(tree, seat), (p) => p.endsWith(".md")).length : 0,
  }));

  // A node carrying a docs tree is the shape the consolidation removed, so any at all is a finding.
  const strays: string[] = [];
  const walkNodes = (dir: string, depth: number): void => {
    if (depth > 4) return;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      if (e === "node_modules" || e === ".git" || e === "dist" || e === ".nx") continue;
      if (e === "docs") {
        if (resolve(dir) !== resolve(repo)) strays.push(relative(repo, join(dir, e)));
        continue;
      }
      const p = join(dir, e);
      try { if (statSync(p).isDirectory()) walkNodes(p, depth + 1); } catch { /* unreadable */ }
    }
  };
  walkNodes(repo, 0);

  // What a domain OWES is what its concept section lists; what it HAS is the files under it.
  const conceptFile = join(repo, "CONCEPT.md");
  const sections = existsSync(conceptFile) ? conceptSections(conceptFile) : new Map();
  const constructsDir = join(tree, "02-constructs");
  const domainRows = constructFolders(constructsDir).filter((d) => !isGroup(d)).map((dir) => {
    const key = [...sections.keys()].find((k) => k === folderKey(basename(dir)));
    return {
      domain: relative(constructsDir, dir),
      named: Boolean(key),
      has: walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md").length,
      owed: key ? sections.get(key)!.lines.length : 0,
    };
  });

  const approachDir = join(tree, "artifacts", "approaches");
  const approaches = existsSync(approachDir)
    ? readdirSync(approachDir).filter((f) => f.endsWith(".html")).sort() : [];

  const pages = walkFiles(tree, (p) => p.endsWith(".md") || p.endsWith(".html"));
  const findings = audit(pages, workspace);
  const byCheck = new Map<string, number>();
  for (const f of findings) {
    const k = `${f.check} (${f.grade})`;
    byCheck.set(k, (byCheck.get(k) ?? 0) + 1);
  }

  const prose: { file: string; paras: number; flagged: number }[] = [];
  for (const file of proseFilesUnder([tree], false)) {
    let raw: string;
    try { raw = readFileSync(file, "utf8"); } catch { continue; }
    // `paragraphs` takes the RAW text and strips what must never change itself — a code block, a
    // table row, a heading, the reading strip. A block is `[text, sentences]`.
    const blocks = proseParagraphs(raw);
    let flagged = 0;
    for (const [text, sents] of blocks) if (Object.keys(proseScore(text, sents)).length) flagged += 1;
    if (flagged) prose.push({ file: relative(repo, file), paras: blocks.length, flagged });
  }
  prose.sort((a, b) => b.flagged - a.flagged);

  const totalFlagged = prose.reduce((n, p) => n + p.flagged, 0);
  const totalParas = prose.reduce((n, p) => n + p.paras, 0);
  const row = (cells: string[]) => `| ${cells.join(" | ")} |`;

  const body = [
    "<!-- spn:doc",
    "{",
    `  "id": "${name}-docs-audit",`,
    `  "title": "Docs Audit — ${name}",`,
    '  "lenses": ["ARCHITECT", "VOICE"],',
    '  "status": "DONE",',
    `  "summary": "What this repository's corpus looks like on ${at}, measured against the landed standard — its seats, what each domain owes, the arguments still in its pocket, the pages off the standard, and the paragraphs a language pass would read."`,
    "}",
    "-->",
    "",
    `# Docs Audit — ${name}`,
    "",
    "`For: Architect · Editor` · `Status: ✅ DONE`",
    "",
    `Measured ${at}. **Nothing here was fixed while it was counted** — a scan that edits as it goes cannot be trusted as a measure, so this verb writes one file and touches nothing else.`,
    "",
    "## The seats",
    "",
    row(["Seat", "Face", "Documents"]), row(["---", "---", "---"]),
    ...seatRows.map((r) => row([`\`${r.seat}\``, r.present ? "✅" : "**missing**", String(r.files)])),
    "",
    strays.length
      ? `**${strays.length} node(s) still carry a docs tree**, which the one-tree rule removed: ${strays.map((x) => `\`${x}\``).join(" · ")}.`
      : "**No node carries a docs tree.** The repository has one, and every node carries `README.md` alone.",
    "",
    "## What each domain owes",
    "",
    "A domain owes what its concept section lists, and has what sits under it. A domain the concept does not name is invariant 1's finding.",
    "",
    row(["Domain", "Named by the concept", "Constructs written", "Lines the concept lists"]),
    row(["---", "---", "---", "---"]),
    ...domainRows.map((d) => row([`\`${d.domain}\``, d.named ? "✅" : "**no**", String(d.has), String(d.owed)])),
    "",
    "> [!NOTE]",
    "> **Read a 0 in the last column as *unmeasured*, never as *owes nothing*.** A concept is given its one line per construct by `docs.ts face`, and it can only write that once the constructs exist. Until then the column reports the concept's own bullet lists, which most concepts do not yet carry.",
    "",
    "## The arguments still in the pocket",
    "",
    approaches.length
      ? [`${approaches.length} approach page(s). Each argues one design and stays the record of the moment it was argued. Where a construct comes to carry its *What*, the page is retired rather than deleted.`, "",
         ...approaches.map((a) => `- [${a.replace(/-approach\.html$/, "")}](../approaches/${a})`)].join("\n")
      : "None.",
    "",
    "## Pages off the standard",
    "",
    findings.length
      ? [`${findings.length} finding(s) over ${pages.length} page(s).`, "",
         row(["Check", "Findings"]), row(["---", "---"]),
         ...[...byCheck].sort((a, b) => b[1] - a[1]).map(([k, v]) => row([`\`${k}\``, String(v)]))].join("\n")
      : `**Clean over ${pages.length} page(s).**`,
    "",
    "## The paragraphs a language pass would read",
    "",
    `${totalFlagged} candidate paragraph(s) in ${prose.length} file(s), out of ${totalParas} scanned.`,
    "",
    ...(prose.length
      ? [row(["File", "Flagged", "Paragraphs"]), row(["---", "---", "---"]),
         ...prose.slice(0, 40).map((p) => row([`\`${p.file}\``, String(p.flagged), String(p.paras)])),
         ...(prose.length > 40 ? ["", `…and ${prose.length - 40} more file(s).`] : [])]
      : []),
    "",
    "> [!NOTE]",
    "> **Three of the nine faults are not here, and that is deliberate.** A compressed claim, a rule with no action, and an abstraction that is merely dull cannot be told from good prose by a pattern. The flagged set is where a pass starts, never the whole job.",
    "",
    "## What this report does not measure",
    "",
    row(["Not measured", "Why", "What would measure it"]), row(["---", "---", "---"]),
    row(["Comments owed per package", "the symbol index is a per-package build this verb does not run", "`spnutils apps gen-symbols -p <pkg>`"]),
    row(["Whether a written construct is TRUE", "a count cannot read", "the two-per-wave read"]),
    row(["The constructs a concept has not listed", "see the note above", "`docs.ts face`, once the constructs exist"]),
    "",
  ].join("\n");

  const out = join(tree, "artifacts", "reports", "docs-audit.md");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body);
  console.log(relative(workspace, out));
  console.log(`  seats ${seatRows.filter((r) => r.present).length}/5 · node trees ${strays.length} · domains ${domainRows.length}` +
    ` · constructs ${domainRows.reduce((n, d) => n + d.has, 0)} · approaches ${approaches.length}` +
    ` · page findings ${findings.length} · prose candidates ${totalFlagged} in ${prose.length} file(s)`);
  return 0;
}

// ---------------------------------------------------------------------------- the command

function audit(paths: string[], workspace: string): Finding[] {
  const findings: Finding[] = [];
  const blocks = new Map<string, any>();
  const nodes = nodeIndex(workspace);
  const templates = process.env.SPN_TEMPLATES
    ?? join(workspace, "spn-foundation", "docs", "04-capabilities", "01-foundation", "02-docs", "templates");
  for (const p of paths) {
    const src = readFileSync(p, "utf8");
    const { block, error } = readBlock(src);
    blocks.set(p, block);
    findings.push(...checkBlock(p, src, block, error));
    if (!block) continue;
    findings.push(...checkOutline(p, src, block));
    findings.push(...checkHeader(p, src, block));
    findings.push(...checkCards(p, src, block));
    findings.push(...checkCodeFigures(p, src, workspace));
    findings.push(...checkProof(p, src));
    findings.push(...checkBinds(p, src, block, nodes));
    findings.push(...checkOverviewSource(p, src, block, workspace));
    findings.push(...checkProduced(p, src, block, workspace, templates));
  }
  findings.push(...checkDepends(paths, blocks));
  return findings;
}

const [cmd, ...rest] = process.argv.slice(2);

/**
 * The workspace root — the folder the sibling checkouts sit in, not wherever you happen to stand.
 *
 * THE SAME COMMAND GAVE DIFFERENT ANSWERS FROM DIFFERENT DIRECTORIES. Taking cwd as the workspace
 * means a run from inside a repository builds the templates path as `<repo>/spn-foundation/docs/…`,
 * which does not exist — so every construct page reported *the page could not be produced for
 * comparison*. 161 findings in one sweep, all of them the tool standing in the wrong place, and
 * none of them about the corpus. A result that depends on your shell's cwd is not a measurement.
 *
 * The workspace is the nearest folder at or above cwd that holds `spn-foundation/` or `.spndevex/`.
 * Neither found, cwd stands — which is what a fixture directory needs.
 */
function workspaceRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, "spn-foundation")) || existsSync(join(dir, ".spndevex"))) return dir;
    const up = dirname(dir);
    if (up === dir) return resolve(from);
    dir = up;
  }
}

const workspace = process.env.SPN_WORKSPACE ?? workspaceRoot(process.cwd());

// One line per verb, in the same log and the same shape as the Python checks, so the port can be
// measured against what it replaced. Off unless `workspace timings --on` has been run.
const startedAt = performance.now();
begin({ event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session: process.env.CLAUDE_SESSION_ID ?? null }, workspace);
process.on("exit", () => { record(`docs-${cmd ?? "none"}`, performance.now() - startedAt); end(); });

if (cmd === "face") {
  const tree = resolve(rest.find((r) => !r.startsWith("--")) ?? ".");
  const f = face(tree, !rest.includes("--check"));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd === "figures") {
  const [sub, ...args] = rest;
  const files = args.filter((a) => !a.startsWith("--")).map((p) => resolve(p));
  if (sub === "check") {
    let total = 0;
    for (const f of files) {
      const found = checkFigures(readFileSync(f, "utf8"));
      total += found.length;
      for (const x of found) console.log(`✗ RULE figure    ${relative(workspace, f)}\n         svg${x.figure}: ${x.message}`);
    }
    console.log(total ? `\n${total} figure finding${total > 1 ? "s" : ""}` : `clean — ${files.length} page${files.length > 1 ? "s" : ""}`);
    process.exit(total ? 1 : 0);
  }
  if (sub === "colour") {
    // The audit's half: a coloured block must strip back to what the author wrote.
    let bad = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<pre data-lang="([a-z]+)">([\s\S]*?)<\/pre>/g)) {
        const round = colour(stripSpans(m[2]), m[1]);
        if (round !== m[2]) { bad++; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         a \`${m[1]}\` block's colouring is not what \`figures colour\` produces from its own text`); }
      }
    }
    console.log(bad ? `\n${bad} block${bad > 1 ? "s" : ""} off` : "every coloured block matches its own text");
    process.exit(bad ? 1 : 0);
  }
  console.error("usage: node docs.ts figures check|colour <path…>");
  process.exit(2);
}

// A PATH IS A FILE OR A FOLDER, for `status` and `page` exactly as for `audit`. Given a folder
// each of these read the directory itself and died on `EISDIR` with a raw stack trace. A folder
// means every seat file under it — markdown only, because these two act on the file an author
// writes rather than on the page produced from it.
const seatPaths = (args: string[]): string[] =>
  args.filter((r) => !r.startsWith("--")).flatMap((p) => {
    const full = resolve(p);
    let st; try { st = statSync(full); } catch { return [full]; }
    return st.isDirectory() ? walkFiles(full, (f) => f.endsWith(".md") && basename(f) !== "README.md") : [full];
  });

if (cmd === "status") {
  const nodes = nodeIndex(resolve(workspace));
  const check = rest.includes("--check");
  const seats = seatPaths(rest);
  const f = seats.flatMap((p) => statusFor(p, resolve(workspace), nodes, !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd === "page") {
  const templates = process.env.SPN_TEMPLATES
    ?? join(resolve(workspace), "spn-foundation", "docs", "04-capabilities", "01-foundation", "02-docs", "templates");
  const check = rest.includes("--check");
  const seats = seatPaths(rest);
  const f = seats.flatMap((p) => pageFor(p, resolve(workspace), templates, !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd === "topics" || cmd === "coverage") {
  const targets = rest.filter((r) => !r.startsWith("--")).map((r) => resolve(r));
  if (!targets.length) { console.error(`usage: node docs.ts ${cmd} <repo…>`); process.exit(2); }
  const f = targets.flatMap((t) => (cmd === "topics" ? topicsCheck(t) : coverageCheck(t, resolve(workspace))));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  const rule = f.filter((x) => x.grade === "RULE").length;
  console.log(f.length ? `\n${f.length} finding(s) — ${rule} RULE, ${f.length - rule} SOFT` : `\nclean — ${targets.length} repository(ies)`);
  process.exit(rule ? 1 : 0);
}

if (cmd === "audit" && rest.includes("--report")) {
  const target = rest.find((r) => !r.startsWith("--"));
  if (!target) { console.error("usage: node docs.ts audit --report <repo>"); process.exit(2); }
  process.exit(gapReport(resolve(target), resolve(workspace)));
}

if (cmd !== "audit" || rest.length === 0) {
  console.error("usage: node docs.ts audit <path…> | face <tree> | page <seat.md…> | status <seat.md…> | topics <repo…> | coverage <repo…>   (--check reports without writing)");
  process.exit(2);
}

// A PATH IS A FILE OR A FOLDER, and the usage says `path` rather than `file`. Given a folder it
// used to read the directory itself and die on `EISDIR` with a raw stack trace — which reads as the
// tool being broken rather than as the argument being a folder. A folder now means *every document
// under it*, which is what anyone typing one meant, and the walk is the same one `face` uses, so
// `templates/` is skipped by the rule that already exists.
const pages = rest.flatMap((p) => {
  const full = resolve(p);
  let st; try { st = statSync(full); } catch { return [full]; }
  return st.isDirectory() ? walkFiles(full, (f) => f.endsWith(".md") || f.endsWith(".html")) : [full];
});
if (!pages.length) { console.log("no document under that path"); process.exit(0); }

const found = audit(pages, resolve(workspace));
const rule = found.filter((f) => f.grade === "RULE");
for (const f of found) console.log(`${f.grade === "RULE" ? "✗" : "!"} ${f.grade.padEnd(4)} ${f.check.padEnd(9)} ${relative(workspace, f.file)}\n         ${f.message}`);
console.log(found.length
  ? `\n${found.length} finding${found.length > 1 ? "s" : ""} — ${rule.length} RULE, ${found.length - rule.length} SOFT, over ${pages.length} page${pages.length > 1 ? "s" : ""}`
  : `\nclean — ${pages.length} page${pages.length > 1 ? "s" : ""}`);
process.exit(rule.length ? 1 : 0);
