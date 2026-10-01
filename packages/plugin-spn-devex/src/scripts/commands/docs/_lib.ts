// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// This file carries rules it does not own. Those chapters are the source of truth. A rule change is
// edited there first, then here, in the same change. `restates check` reports this copy when a
// source moves, and reports this header too when a chapter it names is not where it says.
//
// The docs checks and builders themselves — every constant, reading helper and `check*` function the
// `docs` group's actions call. A name starting with `_` is a shared-helper convention `cli.ts`
// already skips when it discovers actions, so this file is never itself dispatched; `audit.ts`,
// `face.ts`, `page.ts`, `status.ts`, `topics.ts` and `parity.ts` each import what they need from
// here, and `figure.ts` imports `walkFiles` for its own `figures check|colour` wiring.
//
// Grades, per the N2 arc: RULE refuses, SOFT reports. N7 flips the SOFTs.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { hrefForPage, renderPage } from "../../lib/render.ts";
import { cardsOf } from "../../checks/split-plan.ts";
import { masthead, type MastheadKind } from "../../checks/doc-check.ts";
import { filesUnder as proseFilesUnder, paragraphs as proseParagraphs, score as proseScore } from "./prose.ts";

import { withOffset } from "../../lib/clock.ts";
import { ARTIFACT_FOLDERS, ARTIFACT_INDEX, DEVEX_WORKSTREAMS, DOCS, FACE, POCKET, SEAT, SEATS, TEMPLATES, artifactFolderOf,
  behaviorsDir, bookTemplatesDir, capabilitiesDir, constructsDir, docsOf, inSeat, inTemplates, isProducedPage, mirrorPath,
  overviewsDir, producedPageOf, seatOf, splitAtSeat, workstreamDirOf } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, PAGE_SCRIPT, SERVED_FILES, STYLESHEET, cutVersions, linksSharedStyles,
  stylesDir, BUNDLED_SUFFIX } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
export type Grade = "RULE" | "SOFT";
export type Finding = { check: string; grade: Grade; file: string; message: string };

// THE SET IS OWNED BY `SPDocVariantType` in the CLI's contract, and this is a copy of it. Nothing
// links the two, so a value added there and not here is silently refused, and one added here and
// not there passes a check the contract would reject. Keeping them in step is manual until a check
// reads the contract; that check is owed (workstream 008, N63).
//
// `capability` joined the set with Q130. The chapter kind existed, its template existed, and the
// checker had never heard of it — so every capability chapter in the corpus was a document whose
// own declared variant was not a variant. It carries no fixed outline: a chapter is Where ·
// Follows the pattern · Special handling · Between modules, and a construct that is pure pattern
// legitimately has no Special handling at all.
//
// The five that joined in 2026-09: a FACE is 226 documents of one shape that no kind could name,
// and 29 of them declared a chapter's variant instead. A DATA_MODEL's table shape is stated in
// `RD.DEVEX.WORKSPACE.134` and was written four different ways across 25 files. SURFACE_MAP and ROUTE_MAP
// carry no document yet.
//
// DATA_MODEL AND SURFACE_MAP HAVE THEIR OUTLINES NOW, AND THEY REPORT SOFTLY (N37 step 3). Both are
// stated in `03-tree.md` § *A capability is realized by halves*. A new check ships SOFT, so the
// files are brought to the shape by the pass that rewrites them rather than refused by a gate that
// arrived first. FACE, ROUTE_MAP and REGISTER still have none, for the reason above.
//
// A PREVIEW is a page a workstream shows the developer before the work is built. It sits in
// `notes/N<nnn>/previews/`, its file name ends `-preview.html`, and it is written from
// `workstream/approach-preview-template.html`. It carries no fixed outline.
/**
 * The kinds a document's block may declare. `guide` and `index` are the two produced pages beside
 * a construct page (05-artifacts.md § The guide page, § The index of artifacts).
 */
export const VARIANTS = ["approach", "overview", "construct", "behaviors", "capability", "report",
                  "face", "data_model", "surface_map", "route_map", "register", "preview",
                  "guide", "index"] as const;
export type Variant = (typeof VARIANTS)[number];

/** The words a preview's Status chip shows, as the preview template writes them: the arc's own two. */
export const PREVIEW_STATES = ["PROPOSED", "DECIDED"];

/** The lens register, as the document chapter's table renders each value for a reader. */
export const LENS_LABEL: Record<string, string> = {
  LEAD: "Engineering leader", BUSINESS: "Business manager", PRODUCT: "Product manager",
  ARCHITECT: "Architect", SERVER_DEV: "Backend developer", WEB_DEV: "Web developer",
  QA: "Quality engineer", INFRA: "DevOps / SRE", TRUST: "DevSecOps / Security",
  PARTNER: "Partner / integrator", VOICE: "Editor",
};

export const STATUS_WORD: Record<string, string> = { PLANNING: "PLANNING", IMPLEMENTING: "IMPLEMENTING", DONE: "DONE" };

/**
 * The fixed outlines. A construct is six sections in one order — Terms first, because the model uses
 * those words; Boundary after the parts, because an edge can be judged only once the shape is seen
 * (workstream 008, N13, 2026-09-21). Relations is gone: `dependsOn` in the block carries it.
 *
 * `order` IS THE ONLY PLACE THE SEQUENCE IS WRITTEN, and `optional` names which of those sections a
 * page may leave out. Required is derived from the two. Two separate lists, `required` and
 * `optional`, would declare the order of an optional section nowhere: the order check would read
 * every optional name as coming first, and judge a page carrying `Binds` last out of order by an
 * outline that has no opinion about where `Binds` goes.
 */
export const OUTLINE: Partial<Record<Variant, { order: string[]; optional: string[] }>> = {
  construct: {
    // OVERVIEW COMES FIRST, AND IT WAS OPTIONAL FOR ONE SITTING (N67). It answers WHY the construct
    // exists; Model answers WHAT it is, and Parts carries the detail of that what. Terms sits
    // between Overview and Model because the Model uses those words and the Overview does not.
    //
    // ADDING A REQUIRED SECTION TO DOCUMENTS THAT ALREADY EXIST HAS NO SAFE ORDER, and that is worth
    // stating because the next new section will meet it too. Move the corpus first and this check
    // refuses every page that has the section, because one the outline does not name is an `extra`.
    // Require it first and it refuses every page that has not moved yet. **Optional is the state
    // where both pass**, so the corpus moves a slice at a time and the word becomes required the day
    // the last slice lands. 117 constructs crossed on 2026-09-24 that way.
    //
    // `BINDS` AND `PROOF` ARE OPTIONAL BECAUSE THE CORPUS CROSSES IN TWO STEPS. Decision `E` takes
    // the realization table out of `Binds` and takes `Proof` off the construct altogether: a
    // construct states the model, and what proves it is rolled up from the behaviour rows at its own
    // path. The tool agrees with that shape from today; the sweep that edits the 122 pages is its own
    // arc. Optional is the one state where both shapes pass — required refuses every swept page, and
    // absent refuses every page not yet swept. They leave this list the day the sweep lands.
    order: ["Overview", "Terms", "Model", "Parts", "Boundary", "Binds", "Proof"],
    optional: ["Binds", "Proof"],
  },
  approach: {
    order: ["Terms", "Why", "What", "How", "Open", "Deferred"],
    optional: ["Terms"],
  },
  // WHAT A MIGRATION KNOWS, AND NOTHING ELSE (03-tree.md, RD.DEVEX.WORKSPACE.134). A data model defines no
  // term; the words are the constructs' `Terms` tables. What seeds and what must run first is
  // storage knowledge too (RD.DEVEX.WORKSPACE.089), so it closes the file rather than moving elsewhere.
  data_model: {
    order: ["Tables", "Indexes", "Seeds and order"],
    optional: ["Seeds and order"],
  },
};

/**
 * The heading row a section's first table carries, per kind — the column names a reader trusts.
 *
 * A HEADING IS A PROMISE ABOUT EVERY CELL UNDER IT, which is the whole of `N37`. Four vocabularies
 * sat under one file kind for a year because nothing read the first row. A surface map has no
 * fixed section names — one section per folder under `ui/` — so its heading is the whole outline.
 */
export const TABLE_HEAD: Partial<Record<Variant, Record<string, string[]>>> = {
  data_model: {
    Tables: ["Table", "Stores", "The rule it keeps"],
    Indexes: ["Index", "Why it exists"],
  },
  surface_map: {
    "*": ["Surface", "Kind", "Contract term", "What it is for"],
  },
};

/** The four kinds of surface a package's `ui/` exports (N63 `Q243`). */
export const SURFACE_KINDS = ["page", "component", "widget", "hook"];

/** The kinds whose outline findings are still SOFT, because the check is new (N37 step 3). */
export const SOFT_OUTLINES = new Set<Variant>(["data_model", "surface_map"]);

/** A fixed file name and the kind it must declare — the name is the location's claim, the block the file's. */
export const NAMED_KIND: Record<string, Variant> = { "data-model.md": "data_model", "surface-map.md": "surface_map" };

/** An overview's outline is borrowed, with one fixed opener and two fixed closers. */
export const OVERVIEW_FIXED_FIRST = "Overview";
export const OVERVIEW_FIXED_LAST = ["Glossary", "Where to go next"];

// ---------------------------------------------------------------------------- reading

export function text(html: string): string {
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
export function sectionName(heading: string): string {
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
 *
 * AN INLINE CODE SPAN IS A MENTION FOR THE SAME REASON A FENCE IS. A brief describing what to write
 * says *the `<!-- spn:doc { ... } -->` block*, and reading that as this document's own reported
 * `not strict JSON` against the literal three dots — a refusal about prose that was correctly
 * quoting the grammar. Spans are blanked to their own length, so every later offset still lines up.
 */
export function readBlock(src: string): { block: any | null; error: string | null } {
  const mentions = outsideFences(src).replace(/`[^`\n]*`/g, (s) => " ".repeat(s.length));
  const m = mentions.match(/<!--\s*spn:doc\s*([\s\S]*?)-->/);
  if (!m) return { block: null, error: "no spn:doc block" };
  try {
    return { block: JSON.parse(m[1].trim()), error: null };
  } catch (e) {
    return { block: null, error: `spn:doc is not strict JSON — ${(e as Error).message}` };
  }
}

export function headings(src: string, tag: "h1" | "h2" | "h3"): string[] {
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
export function sections(file: string, src: string, tag: "h1" | "h2" | "h3"): string[] {
  if (!file.endsWith(".md")) return headings(src, tag);
  const level = tag === "h1" ? 1 : tag === "h2" ? 2 : 3;
  return [...outsideFences(src).matchAll(new RegExp(`^#{${level}}\\s+(.+)$`, "gm"))].map((m) => m[1]);
}

// ---------------------------------------------------------------------------- the checks

/**
 * A moment as a report stamps it: a date, a time and the offset, such as `2026-09-30T12:57+05:30`.
 * A date alone cannot order two reports of one day, and a time with no offset is read differently
 * by the UTC database and a developer's machine.
 */
export function isMoment(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** Whether a file sits directly in a docs tree's artifacts pocket, in no folder of it. */
export function directlyInPocket(file: string): boolean {
  const parts = file.replace(/\\/g, "/").split("/");
  return parts.length >= 3 && parts.at(-3) === DOCS && parts.at(-2) === POCKET.artifacts;
}

export function checkBlock(file: string, src: string, block: any, err: string | null): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "block", grade, file, message });
  if (err) { add("RULE", err); return f; }

  for (const key of ["id", "title", "summary"]) {
    if (typeof block[key] !== "string" || !block[key].trim()) add("RULE", `\`${key}\` is missing or empty`);
  }
  const variant: Variant | undefined = block.variant;
  // THE INDEX NAMES NO READER. It is a frame around the other pages, and each page it opens carries
  // its own lenses, so `lenses` is asked of every kind but the index.
  if (variant === "index" && block.lenses === undefined) { /* an index has no lenses */ }
  else if (!Array.isArray(block.lenses) || block.lenses.length === 0) add("RULE", "`lenses` is missing or empty");
  else for (const l of block.lenses) if (!(l in LENS_LABEL)) add("RULE", `\`${l}\` is not a lens`);

  if (variant && !VARIANTS.includes(variant)) add("RULE", `\`variant\` \`${variant}\` is not one of ${VARIANTS.join(" · ")}`);

  // AN ARGUMENT IS A WORKSTREAM'S, NEVER A REPOSITORY'S (05-artifacts.md § What the pocket holds).
  // A repository states what is true now; an approach page weighs options and carries open cards,
  // and a docs tree holding both is how a stale argument comes to be read as a statement of today.
  // Fifteen pages had accumulated in repositories before this fired.
  if (variant === "approach" && /(^|\/)docs\//.test(file.replace(/\\/g, "/")))
    add("RULE", `an approach page belongs to the workstream that argues it, never to a repository's \`docs/\` — move it under \`${DEVEX_WORKSTREAMS}/\``);

  // THE POCKET'S FOLDER SET IS FIXED: OVERVIEWS, CONSTRUCTS, GUIDES, REPORTS AND NOTHING ELSE
  // (05-artifacts.md § What the pocket holds). A file in any other folder of the pocket is a file
  // some seat needs, so it is a seat depending on a pocket, which is the one thing the pocket rule
  // forbids. A fact a seat needs lives in a seat.
  const pocketFolder = artifactFolderOf(file);
  if (pocketFolder !== null && !ARTIFACT_FOLDERS.includes(pocketFolder))
    add("RULE", `the pocket holds ${ARTIFACT_FOLDERS.map((folder) => `\`${folder}/\``).join(", ").replace(/, ([^,]*)$/, " and $1")} — a fact a seat needs lives in a seat, never in \`${pocketFolder}/\``);

  // BESIDE ITS FOLDERS THE POCKET HOLDS ITS FACE AND ONE PAGE, THE INDEX. Every other page sits in
  // the folder of its kind, and the index sits nowhere but directly in the pocket.
  const direct = directlyInPocket(file);
  if (direct && ![FACE, ARTIFACT_INDEX].includes(basename(file)))
    add("RULE", `\`${ARTIFACT_INDEX}\` is the one page that sits directly in the pocket — this file belongs in ${ARTIFACT_FOLDERS.map((folder) => `\`${folder}/\``).join(", ").replace(/, ([^,]*)$/, " or $1")}`);
  if (variant === "index" && !(direct && basename(file) === ARTIFACT_INDEX))
    add("RULE", `a repository has one index, and it is \`${DOCS}/${POCKET.artifacts}/${ARTIFACT_INDEX}\` — \`docs index\` writes it there`);

  // An overview describes, a FOUNDATION construct states a standard, and a report is a snapshot;
  // none of the three carries a status. Every other page kind carries one. `carriesStatus` states
  // why, in one place, and the report's own keys are checked below.
  //
  // A FOUNDATION CONSTRUCT STILL CARRYING THE WORD IS `docs.ts status`'s FINDING, NOT THIS ONE. That
  // command derives the status and strips it where nothing is derived, so it both reports the fault
  // and fixes it, and it names all 51 of the book's constructs in one run. Reporting it here as well
  // put 204 findings on the foundation — the same fault twice per page, from the block and from the
  // header it renders — where there had been one, and a count that size is a count nobody reads.
  if (variant === "overview") {
    if ("status" in block) add("RULE", "an overview carries no `status` — a face is either current or a defect");
  } else if (carriesStatus(file, block) && !(block.status in STATUS_WORD)) {
    add("RULE", "`status` must be PLANNING · IMPLEMENTING · DONE");
  }

  // A REPORT CARRIES NO STATUS AND SAYS WHEN IT WAS GENERATED (02-document.md § Metadata,
  // RD.DEVEX.WORKSPACE.192). `generatedAt` is what lets the next report supersede this one. Only a
  // tests report adds `measuredAt`, because only its runs can be older than the page. Where no row
  // cites a run there is no such moment, so the block leaves the key out; `null` is refused.
  if (variant === "report") {
    if ("status" in block)
      add("RULE", "a report carries no `status` — it is a snapshot, and its Summary says what was found (RD.DEVEX.WORKSPACE.192)");
    if (!isMoment(block.generatedAt))
      add("RULE", "a report carries `generatedAt`, the moment the page was generated, as a date and a time with its offset — `2026-09-30T12:57+05:30`");
    if ("measuredAt" in block) {
      if (block.reportType !== "TESTS")
        add("RULE", "only a `tests` report carries `measuredAt` — every other report is generated in the moment it measures, and `generatedAt` says when");
      else if (block.measuredAt === null)
        add("RULE", "`measuredAt` is written only where a run is stamped — where no row cites a run, leave the key out of the block and say in Measured that no run is stamped");
      else if (!isMoment(block.measuredAt))
        add("RULE", "`measuredAt` is the newest run the tests report read, as a date and a time with its offset — `2026-09-30T12:44+05:30`");
    }
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

export function checkOutline(file: string, src: string, block: any): Finding[] {
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

  const want = spec.order.filter((w) => !spec.optional.includes(w));
  const seen = got.filter((g) => spec.order.includes(g));
  const missing = want.filter((w) => !got.includes(w));
  const extra = got.filter((g) => !spec.order.includes(g));
  const grade: Grade = SOFT_OUTLINES.has(variant!) ? "SOFT" : "RULE";

  if (missing.length) f.push({ check: "outline", grade, file, message: `missing section${missing.length > 1 ? "s" : ""}: ${missing.join(" · ")}` });
  if (extra.length) f.push({ check: "outline", grade, file, message: `section${extra.length > 1 ? "s" : ""} the ${variant} outline does not have: ${extra.join(" · ")}` });

  // Order, over the sections that belong — a swapped pair is the fault this catches.
  const order = spec.order;
  const ranked = seen.map((s) => order.indexOf(s));
  for (let i = 1; i < ranked.length; i++) {
    if (ranked[i] < ranked[i - 1]) {
      f.push({ check: "outline", grade, file, message: `\`${seen[i - 1]}\` comes before \`${seen[i]}\`; the ${variant} outline is ${order.join(" → ")}` });
      break;
    }
  }
  return f;
}

/** Every markdown table in a slice, with its heading row kept apart from its data rows. */
export function headedTables(seg: string): { head: string[]; rows: string[][] }[] {
  const out: { head: string[]; rows: string[][] }[] = [];
  let cur: { head: string[]; rows: string[][] } | null = null;
  for (const raw of outsideFences(seg).split("\n")) {
    const t = raw.trim();
    if (!(t.startsWith("|") && t.endsWith("|") && t.length > 2)) { cur = null; continue; }
    // AN ESCAPED PIPE IS CONTENT. `Write\|Edit` is one cell, and splitting on it shifted every
    // column after it one place to the right.
    const cells = t.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim());
    if (/^[\s:|-]*$/.test(cells.join(""))) continue;
    if (!cur) { cur = { head: cells, rows: [] }; out.push(cur); continue; }
    cur.rows.push(cells);
  }
  return out;
}

/** A markdown document cut at its `##` headings: each section's name and its body. */
export function sectionsWithBodies(src: string): { name: string; body: string }[] {
  const bare = outsideFences(src).split("\n");
  const raw = src.split("\n");
  const out: { name: string; body: string }[] = [];
  let name: string | null = null;
  let lines: string[] = [];
  bare.forEach((l, i) => {
    const m = l.match(/^##\s+(.+)$/);
    if (m) {
      if (name !== null) out.push({ name, body: lines.join("\n") });
      name = sectionName(m[1]); lines = [];
      return;
    }
    if (name !== null) lines.push(raw[i]);
  });
  if (name !== null) out.push({ name, body: lines.join("\n") });
  return out;
}

/**
 * The two realization files: the kind a fixed name declares, where it sits, and the heading rows.
 *
 * A FILE KIND NOTHING CAN NAME IS A FILE KIND NOTHING CAN CHECK, and that is how one document grew
 * four incompatible shapes (N37). So a `data-model.md` or a `surface-map.md` that declares no kind
 * is itself a finding: the outline below would otherwise never be read for it.
 *
 * A DATA MODEL AT A DOMAIN'S ROOT SITS ABOVE THE HALF THAT OWNS THE STORAGE (RD.DEVEX.WORKSPACE.134). It sits
 * beside the migrations it mirrors, which is always a package folder: `04-capabilities/<domain>/
 * <package>/data-model.md`. A domain that stores nothing writes none at all.
 *
 * ALL SOFT, BECAUSE THE CHECK IS NEW. It reports the corpus as it is while the pass that rewrites
 * the files is under way, and it is flipped once that pass has landed.
 */
export function checkRealizationFile(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  if (!file.endsWith(".md")) return f;
  const add = (message: string) => f.push({ check: "outline", grade: "SOFT", file, message });
  const name = basename(file);
  const want = NAMED_KIND[name];
  const variant: Variant | undefined = block?.variant;
  if (want && variant !== want) add(`\`${name}\` declares \`variant\` \`${variant ?? "—"}\`; the file kind is \`${want}\`, and a file with no kind is one no outline is read against`);
  const kind = variant ?? want;
  if (!kind) return f;

  const rel = splitAtSeat(file, "capabilities")?.rel;
  if (kind === "data_model" && rel !== undefined && rel.split("/").length < 3)
    add("a data model sits beside the migrations it mirrors, in the package that owns `src/migrations` — at a domain's root it sits above the half that owns the storage (RD.DEVEX.WORKSPACE.134)");

  const heads = TABLE_HEAD[kind];
  if (!heads) return f;
  for (const sec of sectionsWithBodies(src)) {
    const wantHead = heads[sec.name] ?? heads["*"];
    if (!wantHead) continue;
    const tables = headedTables(sec.body);
    if (!tables.length) { add(`\`${sec.name}\` carries no table; its first row is \`${wantHead.join(" · ")}\``); continue; }
    const got = tables[0].head.map((c) => c.replace(/\*\*/g, "").trim());
    if (got.join("|") !== wantHead.join("|"))
      add(`\`${sec.name}\`'s first row is \`${got.join(" · ")}\`; the ${kind} heading is \`${wantHead.join(" · ")}\``);
    if (kind === "surface_map") {
      const at = got.indexOf("Kind");
      for (const row of tables[0].rows) {
        const k = (row[at] ?? "").replace(/`/g, "").trim();
        if (at >= 0 && !SURFACE_KINDS.includes(k))
          add(`\`${(row[0] ?? "").replace(/`/g, "")}\` is of kind \`${k || "—"}\`; a surface is one of ${SURFACE_KINDS.join(" · ")}`);
      }
    }
  }
  return f;
}

/**
 * THE CHECK THIS ARC WAS OPENED FOR: A GENERATED COLUMN IS READ AGAINST ITS OWN HEADING (N37 step 7).
 *
 * *Where it is stored* carried an environment variable on 64 rows and a status marker on 12, and
 * named a table on none of 252. `audit`, `face --check`, `topics` and `parity` were all green over
 * it, because each asked whether a document was well-formed and none asked whether a column meant
 * what its heading said. So every heading a generator writes has a reading of its values here, and
 * **a heading with no reading is itself a finding** — a column cannot ship without somebody saying
 * what belongs under it, which is the step the deleted column skipped.
 *
 * Only the regions `docs.ts face` writes are read. A hand-written table is the author's, and the
 * outline checks above read the ones whose shape is fixed. SOFT, because the check is new.
 */
export const LINK = /^\[[^\]]+\]\([^)]+\)$/;
export const COLUMN_READING: Record<string, { says: string; ok: (cell: string) => boolean }> = {
  "Term": { says: "a word linked to the construct that declares it", ok: (c) => LINK.test(c) },
  // THE TERM AS THE SYSTEM SPELLS IT, SO IT CARRIES CODE. A cell may qualify the spelling — a field
  // after `§`, a list of siblings — but a cell with no code span at all is a description standing
  // where a spelling belongs, and a status marker there is the defect this check was written for.
  "Contract term": {
    says: "the term as the system spells it — at least one code span, or `—`",
    ok: (c) => c === "—" || (/`[^`]+`/.test(c) && !/^[✅🚧🔮]/u.test(c)),
  },
  "What it means": { says: "a meaning in words", ok: (c) => /[a-z]{3}/i.test(c) && !/^[✅🚧🔮]/u.test(c) },
  "Chapter": { says: "a link to the chapter", ok: (c) => LINK.test(c) || c === "—" },
  "File": { says: "a link to the mirror", ok: (c) => LINK.test(c) || c === "—" },
  "Realizes": { says: "a construct id in a code span", ok: (c) => /^`[^`\s]+`$/.test(c) || c === "—" },
  "Governs": { says: "a source path in a code span, or `—`", ok: (c) => /^`[^`\s]+`$/.test(c) || c === "—" },
  "Carries": { says: "what the file carries, in words", ok: (c) => /[a-z]{3}/i.test(c) },
  "Status": { says: "one of ✅ · 🚧 · 🔮", ok: (c) => /^(✅|🚧|🔮)$/u.test(c) },
  "Construct": { says: "a link to the construct", ok: (c) => LINK.test(c) },
  "Domain": { says: "a link to the domain", ok: (c) => LINK.test(c) },
  "What it is": { says: "a sentence", ok: (c) => /[a-z]{3}/i.test(c) },
  "What it holds": { says: "a sentence", ok: (c) => /[a-z]{3}/i.test(c) },
};

export function checkGeneratedColumns(file: string, src: string): Finding[] {
  const f: Finding[] = [];
  if (!file.endsWith(".md")) return f;
  const re = /<!-- spn:generated (\S+)[^>]*-->([\s\S]*?)<!-- \/spn:generated -->/g;
  for (const m of src.matchAll(re)) {
    const kind = m[1];
    for (const t of headedTables(m[2])) {
      t.head.forEach((heading, col) => {
        const reading = COLUMN_READING[heading];
        if (!reading) {
          f.push({ check: "column", grade: "SOFT", file, message: `the generated ${kind} column \`${heading}\` has no reading of its values — a heading nothing checks can sit over anything` });
          return;
        }
        const bad: string[] = [];
        for (const row of t.rows) {
          // A GROUP ROW IS A CONSTRUCT'S NAME IN BOLD WITH THE REST EMPTY: a divider, not data.
          if (/^\*\*[^*]+\*\*$/.test(row[0] ?? "") && row.slice(1).every((c) => !c)) continue;
          const cell = (row[col] ?? "").trim();
          if (!reading.ok(cell)) bad.push(cell || "(empty)");
        }
        if (bad.length) f.push({ check: "column", grade: "SOFT", file, message: `${bad.length} cell${bad.length > 1 ? "s" : ""} under the generated ${kind} column \`${heading}\` ${bad.length > 1 ? "are" : "is"} not ${reading.says}: ${bad.slice(0, 3).map((b) => `\`${b.replace(/`/g, "")}\``).join(" · ")}${bad.length > 3 ? " …" : ""}` });
      });
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
export function outsideFences(src: string): string {
  return src.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) => m.replace(/[^\n]/g, " "));
}

/** The status chip: the icon is the rendering and the word is the value (02-document.md). */
export function tagStatus(status: string): string {
  const icon: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  return `${icon[status] ?? "🔮"} ${STATUS_WORD[status] ?? "PLANNING"}`;
}

/**
 * The tag line a document's block renders to, in the fixed order.
 *
 * The status chip is left off where the block carries no status, which is a face and a FOUNDATION
 * repository's construct. Rendering `Status: 🔮 PLANNING` from an absent field is how a page comes to
 * claim a proof state its own rows never mention.
 */
export function tagLine(file: string, block: any): string {
  const actors = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean).join(" · ");
  const forPart = `\`For: ${actors}\``;
  return carriesStatus(file, block) ? `${forPart} · \`Status: ${tagStatus(block.status)}\`` : forPart;
}

/**
 * The tag line is RENDERED FROM THE BLOCK, NEVER TYPED (02-document.md, *The tag line*), so it is
 * written here beside the faces rather than corrected file by file. It is the one generated thing
 * that lives in every document rather than between markers in a few, which is why it carries no
 * markers: the whole line is the generated region.
 */
export function writeTagLines(tree: string, write: boolean): { touched: string[]; findings: Finding[] } {
  const findings: Finding[] = [];
  const touched: string[] = [];
  for (const file of walkFiles(tree, (p) => p.endsWith(".md"))) {
    const before = readFileSync(file, "utf8");
    const { block } = readBlock(before);
    if (!block || !block.lenses?.length) continue;
    // A STATUSLESS BLOCK IS STILL RENDERED, and skipping it left the old chip standing forever. The
    // guard used to require a status word, so a face or a FOUNDATION construct fell through here and
    // kept whatever word a person had typed, with nothing able to remove it.
    if (carriesStatus(file, block) && !(block.status in STATUS_WORD)) continue;
    const want = tagLine(file, block);
    const bare = outsideFences(before);
    // A CHIP AFTER STATUS IS THE AUTHOR'S AND IS KEPT. The pattern used to end at the Status
    // chip, so a capability chapter's `· `Realizes: …`` made it miss its own tag line and fall
    // through to *there is no tag line* — writing a second one under the title, in every chapter
    // of the corpus. The audit could not see it either, because it reads the first match.
    // `For` and `Status` are rendered from the block; anything after them is carried across.
    // THE STATUS CHIP IS OPTIONAL IN THE PATTERN TOO. A face and a FOUNDATION construct render
    // `For: …` alone, so a pattern demanding `Status:` matched nothing on them and the fallback
    // wrote a SECOND tag line under the title.
    const TAG = /^`(?:For|Lenses):[^`\n]*`(?:[ \t]*·[ \t]*`Status:[^`\n]*`)?((?:[ \t]*·[ \t]*`[^`\n]*`)*)[ \t]*$/m;

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

export function checkSeatHeader(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "header", grade, file, message });

  const bare = outsideFences(src);
  // The block's `title` is plain text; the heading may FORMAT it — `\`support-server-ts\`` is the
  // same title in code voice. What must agree is the rendering, so the backticks come off both.
  const plain = (t: string) => text(t).replace(/`/g, "").replace(/\s+/g, " ").trim();
  const h1 = [...bare.matchAll(/^#\s+(.+)$/gm)].map((m) => plain(m[1]));
  if (h1.length !== 1) add("RULE", `${h1.length} \`#\` title${h1.length === 1 ? "" : "s"}; a document has exactly one`);
  else if (h1[0] !== plain(block.title)) add("RULE", `the title \`${h1[0]}\` is not the block's \`${block.title}\``);

  const wantsStatus = carriesStatus(file, block);
  const rule = bare.match(/^`For:\s*([^`]*)`(?:\s*·\s*`Status:\s*([^`]*)`)?/m);
  if (!rule) { add("RULE", "no `For: …` line — every seat file carries one under its title, rendered from its block"); return f; }

  const want = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean);
  const got = rule[1].split("·").map((x) => x.trim()).filter(Boolean);
  const missing = want.filter((w: string) => !got.includes(w));
  const extra = got.filter((g) => !want.includes(g));
  if (missing.length) add("RULE", `the lens line does not carry ${missing.join(" · ")}, which the block declares`);
  if (extra.length) add("RULE", `the lens line carries ${extra.join(" · ")}, which the block does not declare`);

  // A CHIP THE BLOCK DOES NOT DECLARE IS A PAGE NOBODY RE-RENDERED, and that is this check's fault to
  // report. A chip that agrees with a block still carrying the word is the block's fault, and
  // `docs.ts status` names it — saying it twice reported one fault as two on every page in the book.
  if (!wantsStatus) {
    if (rule[2] !== undefined && !("status" in block))
      add("RULE", `the status chip reads \`${rule[2].trim()}\` and the block declares no status — render the tag line from the block again`);
  } else if (rule[2] === undefined) {
    add("RULE", "no `Status: …` chip on the tag line; every page but a face and a FOUNDATION construct carries one");
  } else if (rule[2].trim() !== tagStatus(block.status)) {
    add("RULE", `the status chip reads \`${rule[2].trim()}\`; the block says \`${block.status}\``);
  }
  return f;
}

export function checkHeader(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "header", grade, file, message });
  if (!block) return f;

  // A seat file and a page wear the same six fields in different clothes. The page's two-line
  // `<header>` is the artifacts chapter's; a markdown seat file opens with its `# ` title and the
  // one-line `Lenses: … · Status: …` rule under it. Checking a seat file for a `<header>` element
  // reports every markdown document in the corpus as malformed, which is what it was doing.
  if (!file.endsWith(".html")) return checkSeatHeader(file, src, block);

  // THE INDEX HAS NO HEADER LINE AND NO MASTHEAD (05-artifacts.md § The index of artifacts). It is a
  // frame around other pages, and each page it opens carries its own, so nothing here is asked of it.
  if (block.variant === "index") return f;

  const head = src.match(/<header[\s\S]*?<\/header>/);
  if (!head) { add("RULE", "no `<header>` — every page opens with the two-line header"); return f; }
  const h = head[0];

  // A HEADER'S FIELDS ARE FOUND BY THE SHARED STYLESHEET'S CLASS NAMES, and by no other. A page that
  // links no shared stylesheet holds the names of its own copy, so only what its header says with
  // no class is read: its `<h1>`, its file name and the word before its lenses.
  const shared = !holdsOwnCopy(file, src);

  const line1 = h.match(/class="sds-line1"[^>]*>([\s\S]*?)<\/span>/);
  if (shared && !line1) add("RULE", "no identity line — `{workspace} | {location} | {title}`");
  else if (shared && line1) {
    const parts = text(line1[1]).split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length !== 3) add("RULE", `the identity line carries ${parts.length} fields, not three`);
    else if (parts[2] !== text(block.title)) add("RULE", `the header title \`${parts[2]}\` is not the block's \`${block.title}\``);
  }

  // AN OVERVIEW IS NAMED IN THE MASTHEAD AND PROMISES IN ITS `h1`, and the template says so in its
  // own placeholders: one slot asks for `{{PAGE NAME: Concept · Infra · Shape}}` and the other for
  // `{{The promise, as a short sentence…}}`. Requiring both to equal the block title made that
  // impossible, so all forty overviews put the promise in all three and the tab strip read as forty
  // sentences. Every other kind's name and title are the same words, which is why this hid.
  const h1 = headings(src, "h1").map(text);
  if (h1.length !== 1) add("RULE", `${h1.length} \`<h1>\`; a page has exactly one`);
  else if (block.variant !== "overview" && h1[0] !== text(block.title))
    add("RULE", `the \`<h1>\` \`${h1[0]}\` is not the block's \`${block.title}\``);

  // Type equals the block's variant, and the file name's suffix.
  const typeBadge = h.match(/class="sds-badge sds-type"[^>]*>([\s\S]*?)<\/span>/);
  if (block.variant) {
    const want = block.variant.charAt(0).toUpperCase() + block.variant.slice(1);
    if (shared && !typeBadge) add("RULE", "no Type chip");
    else if (shared && typeBadge && text(typeBadge[1]) !== want) add("RULE", `Type reads \`${text(typeBadge[1])}\`; the block's variant is \`${block.variant}\``);
    const suffix = basename(file).replace(/\.html$/, "").split("-").pop();
    if (suffix !== block.variant && !basename(file).includes(`-${block.variant}.`))
      add("SOFT", `the file name does not end \`-${block.variant}.html\``);
  }

  // For: the lenses, rendered as labels, in the block's order. Never who wrote the page.
  // A preview's header names its arc and its Shown date where every other page names its readers,
  // so its template carries no For chips and none are compared.
  const chips = [...h.matchAll(/class="sds-badge sds-lens"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
  const wantChips = (block.lenses ?? []).map((l: string) => LENS_LABEL[l]).filter(Boolean);
  if (shared && block.variant !== "preview" && chips.join(" · ") !== wantChips.join(" · "))
    add("RULE", `For reads \`${chips.join(" · ")}\`; the block's lenses render as \`${wantChips.join(" · ")}\``);
  if (/\bLenses:/.test(h)) add("RULE", "the tag line reads `For:`, never `Lenses:`");
  if (!shared) return f;

  // Status: the chip carries the enum word; a face and a FOUNDATION construct have no chip at all.
  const statusChip = h.match(/class="sds-badge sds-status[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  if (block.variant === "report") {
    // A REPORT'S HEADER IS TWO LINES UNDER THE BREADCRUMB (05-artifacts.md § The header,
    // RD.DEVEX.WORKSPACE.192): Type and For, then Generated and Commit. Read with the comments
    // removed, because the template explains the lines inside the header itself.
    const shown = h.replace(/<!--[\s\S]*?-->/g, " ");
    if (statusChip || /\bStatus:/.test(shown))
      add("RULE", "a report shows no status chip — it is a snapshot, and its Summary says what was found (RD.DEVEX.WORKSPACE.192)");
    const time = shown.match(/<time\b([^>]*)>/);
    const datetime = time ? /\bdatetime="([^"]*)"/.exec(time[1])?.[1] : undefined;
    if (!/>\s*Generated:\s*</.test(shown) || datetime === undefined)
      add("RULE", "no Generated line — `Generated:` and a `<time class=\"sds-local\" datetime=\"…\">` holding the block's `generatedAt`");
    else {
      if (datetime !== block.generatedAt)
        add("RULE", `Generated reads \`${datetime}\`; the block's \`generatedAt\` is \`${block.generatedAt}\``);
      if (!/\bclass="(?:[^"]*\s)?sds-local(?:\s[^"]*)?"/.test(time![1]))
        add("RULE", "the Generated `<time>` carries `class=\"sds-local\"` — the shared script renders only that element in the reader's own time zone");
    }
    if (!/>\s*Commit:\s*</.test(shown))
      add("RULE", "no Commit — a report names the commit it read, beside Generated");
  } else if (block.variant === "preview") {
    // A PREVIEW'S CHIP SAYS WHETHER THE DEVELOPER HAS ANSWERED IT, never the block's `status`. The
    // block's word says how far the workstream's page has come; the chip reads `PROPOSED` until the
    // developer answers and `DECIDED` after, so the two are not compared.
    if (!statusChip) add("RULE", `no Status chip — a preview shows ${PREVIEW_STATES.join(" · ")}`);
    else if (!PREVIEW_STATES.includes(text(statusChip[1])))
      add("RULE", `the Status chip reads \`${text(statusChip[1])}\`; a preview shows ${PREVIEW_STATES.join(" · ")}`);
  } else if (!carriesStatus(file, block)) {
    if (statusChip && (block.variant === "overview" || !("status" in block)))
      add("RULE", block.variant === "overview" ? "an overview shows no status chip"
        : "a status chip is here and the block declares no status — produce the page again from its seat file");
  } else if (!statusChip) {
    add("RULE", "no Status chip");
  } else if (!text(statusChip[1]).includes(STATUS_WORD[block.status])) {
    add("RULE", `the status chip reads \`${text(statusChip[1])}\`; the block says \`${block.status}\``);
  }

  // The masthead's three levels, from the one check the doc-check hook runs too, so the page an
  // author saves and the page `docs audit` reads are judged by the same rule. The kind is the
  // block's variant; a hub is the overview named `concept-overview.html`.
  const kind: MastheadKind | null = basename(file) === "concept-overview.html" ? "hub"
    : ["overview", "construct", "report", "approach", "preview"].includes(block.variant) ? block.variant : null;
  for (const [grade, message] of masthead(file, src, kind))
    f.push({ check: "masthead", grade: grade as Grade, file, message });
  return f;
}

export function checkCards(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  // A card is found by its class, and a page that links no shared stylesheet holds other names.
  if (holdsOwnCopy(file, src)) return f;
  const variant = block?.variant;
  const opens = [...src.matchAll(/<div class="sds-open">/g)];

  // A construct and an overview carry no cards at all — the status word says how settled it is.
  if (opens.length && (variant === "construct" || variant === "overview"))
    f.push({ check: "cards", grade: "RULE", file, message: `${opens.length} card${opens.length > 1 ? "s" : ""} on a ${variant}; a question found here becomes a workstream card` });

  // A card never contains another. Whole-file tag balance cannot see this (finding F6).
  let depth = 0, nested = 0;
  for (const m of src.matchAll(/<div class="sds-open">|<div\b|<\/div>/g)) {
    const t = m[0];
    if (t === '<div class="sds-open">') { if (depth > 0) nested++; depth++; }
    else if (t.startsWith("<div")) { if (depth > 0) depth++; }
    else if (depth > 0) depth--;
  }
  if (nested) f.push({ check: "cards", grade: "RULE", file, message: `${nested} card${nested > 1 ? "s are" : " is"} nested inside another; a \`.sds-open\` div was left unclosed` });

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

/**
 * The folders an ASCII tree draws, as paths relative to the tree's own root.
 *
 * A tree is read by its indentation: every two columns before the branch marker is one level. The
 * markers themselves are the only thing that identifies a row, so a caption, a blank line or a
 * trailing note between rows is skipped rather than guessed at.
 *
 * ONLY FOLDERS COUNT. A tree names files to show where they sit, and a file is already covered by
 * the figure check above — widening this to files would refuse every tree that elides one.
 */
export function treeFolders(body: string): string[] {
  const out: string[] = [];
  const stack: string[] = [];
  // NOT `text()`, WHICH ENDS IN `.replace(/\s+/g, " ")`. That is right for the file figure beside
  // this one, which compares a snippet whitespace-blind — and fatal here, because a tree IS its
  // whitespace. Collapsed to one line it parsed as nothing, and the check read clean over a tree
  // drawing a folder that did not exist.
  const lines = body
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  for (const raw of lines.split("\n")) {
    const m = raw.match(/^([\s\u2502]*)[\u251c\u2514]\u2500\u2500\s+(.+?)\s*$/);
    if (!m) continue;
    const depth = Math.floor(m[1].replace(/\t/g, "    ").length / 4);
    // A trailing comment after two spaces is a note to the reader, never part of the name.
    const name = m[2].split(/\s{2,}/)[0].trim();
    if (!name.endsWith("/")) continue;
    const bare = name.replace(/\/$/, "");
    stack.length = depth;
    stack.push(bare);
    out.push(stack.join("/"));
  }
  return out;
}

/** Every folder under a directory, relative to it, sorted. */
export function folderTree(dir: string): string[] {
  const out: string[] = [];
  const walk = (at: string, prefix: string): void => {
    let entries: string[];
    try { entries = readdirSync(at).sort(); } catch { return; }
    for (const e of entries) {
      if (e === "node_modules" || e === "dist" || e.startsWith(".")) continue;
      const full = join(at, e);
      let st; try { st = statSync(full); } catch { continue; }
      if (!st.isDirectory()) continue;
      const rel = prefix ? `${prefix}/${e}` : e;
      out.push(rel);
      walk(full, rel);
    }
  };
  walk(dir, "");
  return out.sort();
}

/**
 * Whether a file is an html page that links no shared stylesheet. Such a page holds its own copy of
 * the styles and the class names that copy used, so no check reads a class of it. A bundled copy,
 * `<page>.bundled.html`, is not such a page: it holds the shared styles and the shared names.
 */
export function holdsOwnCopy(file: string, src: string): boolean {
  return file.endsWith(".html") && !file.endsWith(BUNDLED_SUFFIX) && !linksSharedStyles(src);
}

/**
 * Whether a page sits under a workstream's `closed/` folder. A closed argument stays as it is
 * rendered, so its styles are never checked (05-artifacts.md § The page itself).
 */
export function inClosedWorkstream(file: string): boolean {
  return file.replace(/\\/g, "/").includes(`/${DEVEX_WORKSTREAMS}/closed/`);
}

/**
 * The folder that lists each version of the shared styles in its `versions.json`. `SPN_STYLES`
 * names it; without that it is the plugin's own `styles/` folder. Null where neither is found.
 */
export function stylesFolder(): string | null {
  return process.env.SPN_STYLES ?? stylesDir(fileURLToPath(import.meta.url));
}

/** The version named by each `<link>` and `<script>` of a page that loads one of the served files. */
const SERVED_VERSION = new RegExp(
  `<(?:link|script)\\b[^>]*\\b(?:href|src)="(?:[^"]*/)?(\\d+\\.\\d+\\.\\d+)/(?:${SERVED_FILES.map((served) => served.replace(/\./g, "\\.")).join("|")})"`, "gi");

/**
 * A page's furniture is the shared stylesheet's and the shared script's (05-artifacts.md § The page
 * itself, RD.DEVEX.WORKSPACE.214).
 *
 * A PAGE THAT LINKS THE SHARED STYLESHEET IS HELD TO ONE THING: each version its two lines name is
 * a version that exists. `versions.json` lists them. A line that loads from a folder beside the
 * page names no version, so there is nothing to compare. A `<style>` block of the page's own draws
 * no finding, because a page may add a style for a case the shared classes do not cover. A
 * `<script type="application/json">` draws none either, because data is not furniture.
 *
 * A PAGE THAT LINKS NO SHARED STYLESHEET IS NAMED ONCE, SOFT, with the text every command uses for
 * it. Nothing else is said about its styles, its class names or how it is produced.
 */
export function checkFurniture(file: string, src: string): Finding[] {
  if (!file.endsWith(".html") || inClosedWorkstream(file)) return [];
  if (!linksSharedStyles(src)) return [{ check: "styles", grade: "SOFT", file, message: OWN_COPY }];
  const named = [...new Set([...src.matchAll(SERVED_VERSION)].map((found) => found[1]))];
  const styles = stylesFolder();
  if (!named.length || styles === null) return [];
  const versions = Object.keys(cutVersions(styles));
  const absent = named.filter((version) => !versions.includes(version));
  if (!absent.length) return [];
  return [{ check: "furniture", grade: "RULE", file, message:
    `this page links version ${absent.map((version) => "`" + version + "`").join(" · ")} of the shared styles, and no such version exists. ` +
    `The versions that exist: ${versions.map((version) => "`" + version + "`").join(" · ") || "none"}. ` +
    "Link one of them, or cut the version with `docs sds cut` (05-artifacts.md, One stylesheet, served in versions)" }];
}

/**
 * A page's stylesheet closes every brace it opens.
 *
 * ONE STRAY `}` ENDS THE SHEET AND EVERY RULE AFTER IT IS DISCARDED, silently — the page still
 * renders, the rules that came first still apply, and nothing reports anything. That is how 47
 * pages shipped with a dead tail: a restore spliced a `@media` rule in without its opener and kept
 * both closing braces, so the sheet balanced at -1 from that point on. It was found by reading a
 * browser's inspector, which is the opposite of a gate.
 *
 * Comments are removed first, because a brace inside one is text rather than structure.
 */
export function checkStyleBalance(file: string, src: string): Finding[] {
  if (holdsOwnCopy(file, src)) return [];
  const f: Finding[] = [];
  const blocks = [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
  blocks.forEach((m, i) => {
    const body = m[1].replace(/\/\*[\s\S]*?\*\//g, "");
    const depth = (body.match(/\{/g) ?? []).length - (body.match(/\}/g) ?? []).length;
    if (depth === 0) return;
    const which = blocks.length > 1 ? ` (style block ${i + 1} of ${blocks.length})` : "";
    f.push({ check: "style", grade: "RULE", file, message: depth < 0
      ? `the stylesheet closes ${-depth} more brace(s) than it opens${which} — everything after the extra \`}\` is discarded`
      : `the stylesheet leaves ${depth} brace(s) open${which} — the rules after it are swallowed by whatever did not close` });
  });
  return f;
}

/**
 * A figure that names a DIRECTORY draws that directory's folders, and the audit compares them.
 *
 * This is the same promise the pathed-file figure makes, and the reason it was widened is a page
 * that said *that is what makes the shape checkable on sight* while drawing one skeleton of ten and
 * describing the other nine in a paragraph. A described folder set is a second source: it was wrong
 * about a `SUPPORT_WEB` package the day it was measured, and nothing could have caught it.
 *
 * BOTH DIRECTIONS, because one direction is the weaker half of the promise. A folder drawn that
 * does not exist misleads a reader following the page; a folder that exists and is not drawn is how
 * the page silently falls behind the code it describes. Only the second one happens by itself.
 */
export function checkTreeFigures(file: string, src: string, root: string): Finding[] {
  const f: Finding[] = [];
  // THE PARAGRAPH BEFORE A TREE NAMES ITS FOLDER, and the path is the LAST `<code>` in it.
  //
  // A first draft required the path to be the only code in the paragraph, and it matched nothing —
  // including the fixture written to prove it. A real caption names the kind first and the folder
  // last (*the skeleton a `SUPPORT_UNIVERSAL` starts from, in `…/support-universal/`*), so reading
  // the first code span reads the kind and gives up. Taking the last one is what a reader does.
  //
  // ONLY THE PARAGRAPH DIRECTLY BEFORE THE TREE IS READ. The caption cannot hold another `<p>`, so a
  // folder named in an earlier paragraph, or in an earlier section, is never taken as this tree's.
  for (const m of src.matchAll(/<p>((?:(?!<p[\s>])[\s\S])*?)<\/p>\s*<pre[^>]*>([\s\S]*?)<\/pre>/g)) {
    const [, caption, body] = m;
    const codes = [...caption.matchAll(/<code>([^<]+)<\/code>/g)].map((c) => c[1]);
    // A CITATION NAMES A FOLDER THAT EXISTS, and it reaches it one of two ways.
    //
    // Workspace-rooted is the plain case: the first segment names a repository. That test alone is
    // what every folder name in a caption was measured against at first, and it is necessary —
    // `entry/ui/` and `src/aws/` are layer names a chapter is DESCRIBING, and refusing them as
    // stale citations reported trees that were perfectly correct.
    //
    // It is not sufficient, because the book's stack-agnostic chapters may not carry a
    // repository's identifiers (the workspace law). Their captions name the repository in prose
    // and the path inside it — *the Support repo → `apps/utility-ts/assets/…`* — so the first
    // segment is `apps`, no repository matches, and the citation was skipped. SILENTLY, because a
    // paragraph citing no folder is the ordinary case. Measured across the corpus at the time:
    // 15 folder-shaped paths, of which 0 resolved and 10 were real citations the check owed.
    //
    // So a repository-relative path is resolved against every repository, and accepted ONLY where
    // exactly one holds it. One match is the citation; several would be a guess, and a guess in a
    // gate is worse than the silence this replaces.
    const repoRoots = (): string[] => {
      try {
        return readdirSync(root).filter((e) => {
          try { return statSync(join(root, e)).isDirectory() && existsSync(join(root, e, ".git")); }
          catch { return false; }
        });
      } catch { return []; }
    };
    const resolveCited = (c: string): string | null => {
      if (!c.endsWith("/") || !c.slice(0, -1).includes("/")) return null;
      const head = join(root, c.split("/")[0]);
      try { if (statSync(head).isDirectory()) return resolve(root, c); } catch { /* not a repo */ }
      const hits = repoRoots().filter((r) => {
        try { return statSync(join(root, r, c)).isDirectory(); } catch { return false; }
      });
      return hits.length === 1 ? join(root, hits[0], c) : null;
    };
    let path: string | null = null;
    let abs: string | null = null;
    for (const c of codes.reverse()) {
      const hit = resolveCited(c);
      if (hit) { path = c; abs = hit; break; }
    }
    if (!path || !abs) continue;
    if (!existsSync(abs)) {
      f.push({ check: "treefig", grade: "RULE", file, message: `a tree names \`${path}\`, and no such folder exists` });
      continue;
    }
    const shown = treeFolders(body);
    if (!shown.length) continue;
    const actual = folderTree(abs);
    const ghost = shown.filter((d) => !actual.includes(d));
    const unseen = actual.filter((d) => !shown.includes(d));
    for (const d of ghost)
      f.push({ check: "treefig", grade: "RULE", file, message: `the tree for \`${path}\` draws \`${d}/\`, and that folder is not there` });
    for (const d of unseen)
      f.push({ check: "treefig", grade: "RULE", file, message: `\`${path}\` holds \`${d}/\` and the tree does not draw it` });
  }
  return f;
}

export function checkCodeFigures(file: string, src: string, root: string): Finding[] {
  const f: Finding[] = [];
  // A pathed CODE figure names the file above it. The audit reads that file and compares.
  for (const m of src.matchAll(/<p>[^<]*<code>([^<]*?\.(?:ts|tsx|json|sql|md|py|sh|yml|yaml))<\/code>[^<]*<\/p>\s*<pre([^>]*)>([\s\S]*?)<\/pre>/g)) {
    const [, path, attributes, body] = m;
    // A DIFF SHOWS A CHANGE, so it never matches the file its caption names. A page writes one as
    // `<pre data-lang="diff">`, and such a block is not a figure copied from a file.
    if (/\bdata-lang="diff"/.test(attributes)) continue;
    // A PATHED FIGURE NAMES A PATH. A bare file name is a TERM — the book's whole job is to
    // describe `spkind.json`, and refusing the chapter for not containing one gets it exactly
    // backwards: a standard names the file a stack has, and has none of them itself. The rule's
    // own sentence says *pathed*, and this read every mention of a file name as one.
    if (!path.includes("/")) continue;
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

/**
 * The repository a document sits in: the nearest folder at or above it that declares itself.
 *
 * A MAP CELL IS REPOSITORY-RELATIVE, not workspace-relative — `src/…` in a node repo,
 * `plugins/…` here — so resolving one against the workspace root is the wrong question.
 * `checkCodeFigures` resolves against the workspace because a figure names a workspace path.
 */
export function repoOf(file: string): string | null {
  let dir = dirname(resolve(file));
  for (;;) {
    if (existsSync(join(dir, "sprepo.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/**
 * The world a repository declares in its `sprepo.json` — FOUNDATION · APPS · INFRA · GENERAL.
 *
 * Null where nothing declares one, which is what a fixture directory looks like. A caller reading
 * null judges the file as an ordinary repository's, because a missing declaration is another check's
 * finding and never a reason for this one to change its answer.
 */
export function worldOf(file: string): string | null {
  const repo = repoOf(file);
  if (!repo) return null;
  try { return JSON.parse(readFileSync(join(repo, "sprepo.json"), "utf8")).type ?? null; }
  catch { return null; }
}

/**
 * Whether this document's block carries a `status` at all.
 *
 * THREE KINDS CARRY NONE. An overview describes, so a face is either current or a defect. A
 * FOUNDATION repository's construct states a standard, and its behaviour rows are `PROMISE` — five
 * columns, no `Status` and no `Tier` — so there is no run to roll up and no proof state to name. A
 * word written there would be a claim somebody typed once, which is exactly what `05-artifacts.md`
 * § *A construct's status is derived, never typed* forbids. A report is a snapshot, and the next run
 * replaces it rather than moving it through states.
 */
export function carriesStatus(file: string, block: any): boolean {
  if (block?.variant === "overview") return false;
  // A REPORT IS A SNAPSHOT (RD.DEVEX.WORKSPACE.192). It is true of one moment and the next run
  // replaces it, so it has no states to move through. A chip on the first coverage page read
  // IMPLEMENTING, and readers took the page to be unfinished when the repository had gaps.
  if (block?.variant === "report") return false;
  if (block?.variant === "construct" && worldOf(file) === "FOUNDATION") return false;
  // A GUIDE PAGE AND THE INDEX ARE PRODUCED FROM A SOURCE, and neither has a state of its own
  // (05-artifacts.md § The guide page). The guide's markdown keeps the status it has.
  if ((block?.variant === "guide" || block?.variant === "index") && file.endsWith(".html")) return false;
  return true;
}

/**
 * A `Governs` cell in a generated Map names a folder that exists.
 *
 * NOTHING PROVED A MAP CELL, AND THE AUDIT READ CLEAN OVER SEVENTEEN FOLDERS THAT WERE NOT THERE.
 * `checkCodeFigures` already proves that a pathed figure resolves; a Map row is the same kind of
 * claim — *this document governs that folder* — and it was derived by a generator rather than
 * typed, which is exactly why no reader caught it. A derived path is still a claim about disk.
 *
 * ONLY THE GENERATED REGION IS READ. `Governs` is also a column heading in authored tables, where
 * the cell is a sentence rather than a path — the foundation's register index and its docs domain
 * both carry one, and a cell reading *auth/data policies* looks like a path to anything that only
 * tests for a slash. The marked region is where the derivation happens, so it is what is judged.
 */
export function checkGovernsMap(file: string, src: string): Finding[] {
  const f: Finding[] = [];
  const repo = repoOf(file);
  if (!repo) return f;
  for (const region of src.matchAll(/<!-- spn:generated contents[^>]*-->([\s\S]*?)<!-- \/spn:generated -->/g)) {
    const rows = region[1].split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"))
      .map((l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
    const column = (rows[0] ?? []).findIndex((c) => c.toLowerCase() === "governs");
    if (column < 0) continue;
    for (const cells of rows.slice(1)) {
      const cell = (cells[column] ?? "").replace(/`/g, "").trim();
      // The separator row, and the empty-Map row the generator writes when a level has no mirror.
      if (!cell || cell === "—" || /^[-:]+$/.test(cell)) continue;
      if (!existsSync(resolve(repo, cell))) {
        // The first cell is a markdown link, and the finding wants the mirror's name rather than
        // its link syntax — a message a reader has to parse is a message that gets skimmed.
        const mirror = (cells[0] ?? "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim() || "a mirror";
        f.push({ check: "contents", grade: "SOFT", file, message: `the Contents table says \`${mirror}\` governs \`${cell}\`, and no such folder exists` });
      }
    }
  }
  return f;
}

/** A Proof row names something an installed workspace can run. */
export function checkProof(file: string, src: string): Finding[] {
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
      f.push({ check: "proof", grade: "RULE", file, message: "`Proof` carries a table of behaviour rows. The rows live in \`${SEAT.behaviors}/\` — the register the test run writes — and the produced page joins them with the status of the last run (Q131). What is typed here is the checks a reader can run, or nothing" });
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
  // `node <path>` is the same fact whatever the extension: all three plugins ship their suite as
  // `hooks/tests/run.mjs`, and accepting only `.ts` reported the standard runner as unrunnable.
  const installable = /^(spnutils\b|pnpm test|pnpm test:|npx nx\b|node .*\.(ts|mjs|cjs|js)\b)|\.py\b|\bguard\b|\bgate\b/;
  for (const r of rows) {
    if (!r) continue;
    // A REPOSITORY'S OWN SCRIPT IS NOT A FALSE POSITIVE, and saying so plainly matters: a batch read
    // the vaguer message below as the check being wrong and defended its row. A `pnpm task:*`
    // entry, a `bash tests/…` invocation and a `./script` are all the same fact — real, runnable
    // by whoever holds this checkout, and unrunnable by the partner the Proof row is written for.
    if (/^pnpm task:|^(bash|sh|zsh) \S|^\.\//.test(r))
      f.push({ check: "proof", grade: "SOFT", file, message: `\`${r}\` runs here and not for a partner — it is a script this repository carries rather than a command an installed workspace has. **This is a true finding, not a heuristic miss.** It is accepted only while no command runs it; when one exists, name the command` });
    else if (!installable.test(r) && r.split(" ").length <= 6 && /[a-z]/.test(r) && !/^the /.test(r))
      f.push({ check: "proof", grade: "SOFT", file, message: `\`${r}\` may not name a command an installed workspace has` });
  }
  return f;
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
/**
 * A SECTION IS FOUND BY ITS WHOLE NAME, never by a prefix. `\\b` after the name matches any heading
 * that STARTS with it, so an overview's *Proof Tiers* was read as the construct's *Proof* and its
 * glossary rows were judged as proof rows — sixteen false findings on one page. A heading is
 * `## Proof`, or `## Proof — how you check it` where an em dash separates a subtitle from the
 * name; anything else is a different section that happens to share a first word.
 */
export function sectionAt(file: string, src: string, name: string): number {
  const tail = "(?=\\s*(?:$|—|&mdash;|</h2>))";
  return file.endsWith(".md")
    ? outsideFences(src).search(new RegExp(`^##\\s+${name}${tail}`, "m"))
    : src.search(new RegExp(`<h2[^>]*>\\s*${name}${tail}`));
}

/** Every table in a slice, as data rows of cells — header and separator dropped, both formats. */
export function tablesIn(file: string, seg: string): string[][][] {
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

/**
 * `Binds` carries the rules that hold a construct, and — while the corpus crosses — where it lives today.
 *
 * THE `NODE` CELL IS NO LONGER RESOLVED, and the resolver it used went with decision `E`. It matched a
 * declared name anywhere inside the cell, or the cell anywhere inside a declared name, so
 * `docs/…/10-providers` resolved through `support` and *the estate declaration* through `estate` — loose
 * in the dangerous direction, because a cell that resolves to the wrong node reads as checked. `E`
 * removes the table the cell sits in, and the four set checks in `docs parity` compare whole paths.
 *
 * ONE TABLE OR TWO, BOTH PASS. `E` leaves the rules table alone and takes the realization table out, and
 * the sweep that edits the 122 pages is a separate arc. Demanding two refuses every swept page; so the
 * count is judged only when a second table is there to judge.
 */
export function checkBinds(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  if (block?.variant !== "construct") return f;
  const i = sectionAt(file, src, "Binds");
  const j = sectionAt(file, src, "Proof");
  if (i < 0) return f;
  const seg = src.slice(i, j > i ? j : undefined);
  const tables = tablesIn(file, seg);
  if (!tables.length) {
    f.push({ check: "binds", grade: "RULE", file, message: "Binds carries no table; it carries the rules that hold this construct" });
    return f;
  }
  // The realization table is the second one, and its rows are four cells — `Repo · Node · What it
  // realizes · State`. One table is the rules alone, which is the shape `E` leaves behind.
  if (tables.length < 2) return f;
  const rows = tables[tables.length - 1].filter((cells) => cells.length >= 4);
  for (const state of rows.map((r) => text(r[3]).toLowerCase()))
    if (!/^(planned|partial|done)\b/.test(state))
      f.push({ check: "binds", grade: "SOFT", file, message: `a realization row's state reads \`${state}\`; it is planned · partial · done` });
  return f;
}

/** An overview's sections are borrowed from its source, in the source's order. */
/**
 * The domain a domain overview is the face of, or null where it is a hub (Q228).
 *
 * THE JOIN IS THE TITLE, exactly as it is for the way back: a domain's `README.md` and its overview
 * carry the same name, and the overview's file name carries the area in one repository and not in
 * another. Null means this page is not a domain's overview — a repository hub, or a reading path
 * beneath a face — and its source stays `CONCEPT.md`.
 */
export function domainFaceFor(file: string, block: any, workspace: string): string | null {
  const title = block?.title;
  if (!title) return null;
  let dir = dirname(resolve(file));
  while (dir !== dirname(dir) && !existsSync(constructsDir(dir))) dir = dirname(dir);
  const seat = constructsDir(dir);
  if (!existsSync(seat)) return null;
  for (const d of constructFolders(seat).filter((x) => isDomainFolder(seat, x))) {
    const face = join(d, "README.md");
    if (!existsSync(face)) continue;
    if (readBlock(readFileSync(face, "utf8")).block?.title === title) return d;
  }
  return null;
}

export function checkOverviewSource(file: string, src: string, block: any, workspace: string): Finding[] {
  const f: Finding[] = [];
  if (block?.variant !== "overview") return f;
  const got = sections(file, src, "h2").map(sectionName);

  if (got[0] !== OVERVIEW_FIXED_FIRST)
    f.push({ check: "overview", grade: "RULE", file, message: `an overview opens with \`${OVERVIEW_FIXED_FIRST}\`, not \`${got[0]}\`` });
  const tail = got.slice(-2);
  if (tail.join(" · ") !== OVERVIEW_FIXED_LAST.join(" · "))
    f.push({ check: "overview", grade: "RULE", file, message: `an overview closes with ${OVERVIEW_FIXED_LAST.join(" then ")}; it closes with ${tail.join(" then ")}` });

  // A DOMAIN OVERVIEW BORROWS FROM ITS DOMAIN, NOT FROM `CONCEPT.md` (Q228). The concept names a
  // domain and, in most repositories, nothing below it — so holding a domain overview to the
  // concept's headings left twelve pages in `spn-platform-ts` unable to borrow anything at all, and
  // they carry `Overview → Glossary → Where to go next` with nothing between. The domain's own
  // constructs are what it has sections for, in the reading order its face already computes.
  const domainDir = domainFaceFor(file, block, workspace);
  if (domainDir) {
    const constructs: { id: string; title: string; summary: string; deps: string[]; file: string }[] = [];
    for (const cf of walkFiles(domainDir, (x) => x.endsWith(".md") && basename(x) !== "README.md")) {
      const b = readBlock(readFileSync(cf, "utf8")).block;
      if (b?.id) constructs.push({ id: b.id, title: b.title, summary: b.summary, deps: b.dependsOn ?? [], file: cf });
    }
    const order = readingOrder(constructs).map((c) => sectionName(c.title));
    const borrowed = got.slice(1, -2);
    // AT MOST ONE SECTION NAMES NO CONSTRUCT (Q229). `overview-template.html` ships it as `s3` and
    // marks it *only when a rule is decided on one page and relied on by the others*; seven
    // foundation overviews carry exactly one. Two would mean the page has grown an argument its
    // domain does not account for.
    const loose = borrowed.filter((b) => !order.includes(b));
    if (loose.length > 1)
      f.push({ check: "overview", grade: "RULE", file, message: `${loose.length} sections name no construct of this domain — ${loose.join(" · ")}. A domain overview takes one section per construct, plus at most one that carries what they share` });
    const kept = borrowed.filter((b) => order.includes(b));
    const ranked = kept.map((k) => order.indexOf(k));
    for (let i = 1; i < ranked.length; i++)
      if (ranked[i] < ranked[i - 1]) {
        f.push({ check: "overview", grade: "RULE", file, message: `\`${kept[i]}\` comes before \`${kept[i - 1]}\`; a domain overview holds its face's reading order` });
        break;
      }
    return f;
  }

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

export function findConcept(workspace: string, file: string): string | null {
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
export function checkProduced(file: string, src: string, block: any, workspace: string, templates: string): Finding[] {
  if (block?.variant !== "construct") return [];
  // THIS CHECK JUDGES A PRODUCED PAGE, NEVER THE SEAT FILE IT IS PRODUCED FROM. Asked about a seat
  // file it has nothing to compare: the substitution below is a no-op, so `seat === file`, and it
  // reported the seat as a page missing its own source. Saying nothing is the honest answer — the
  // page does not exist yet, and `docs.ts page` is what creates it.
  if (!isProducedPage(file)) return [];
  // A page that links no shared stylesheet is named once, by the furniture check, and `docs page`
  // is what moves it. Comparing it here would say the same thing a second time.
  if (holdsOwnCopy(file, src)) return [];
  // The pocket mirrors the seat folder for folder, so the pair is found by path alone.
  const seat = seatOf(file);
  if (seat === file || !existsSync(seat))
    return [{ check: "produced", grade: "SOFT", file, message: "no seat file sits at the mirrored path, so this page cannot be compared with what it would be produced from" }];
  const seatSrc = readFileSync(seat, "utf8");
  const { block: sb } = readBlock(seatSrc);
  if (!sb) return [{ check: "produced", grade: "RULE", file: seat, message: "the seat file has no `spn:doc` block" }];
  let html: string;
  try {
    html = renderPage({
      block: sb,
      // THE SAME MARKDOWN `page` RENDERS: the seat without its metadata block, and nothing added.
      // Two halves of one tool disagreeing about what the page IS reads every page as hand-edited.
      markdown: seatSrc.replace(/<!--\s*spn:doc[\s\S]*?-->\n?/, ""),
      workspace: process.env.SPN_ORG ?? "SaaS Plane",
      location: process.env.SPN_LOCATION ?? locationOf(seat, workspace),
      furniture: furniture(templates),
      // The same rewriter `page` used, or this check re-renders with seat-relative links and
      // reports every correctly produced page as hand-edited.
      link: hrefForPage(seat, file),
      // AND THE SAME WAY BACK, for the same reason the two lines above exist. `page` resolves the
      // domain's overview and writes `← IAM`; a check that re-renders without it writes
      // `← the model` and calls all 20 pages of a repository hand-edited. Third time this file has
      // learned that both halves must be handed the same inputs.
      home: overviewAbove(seat, file) ?? undefined,
    }).html;
  } catch (e) {
    return [{ check: "produced", grade: "SOFT", file, message: `the page could not be produced for comparison — ${(e as Error).message}` }];
  }
  if (html === src) return [];
  return [{ check: "produced", grade: "RULE", file,
    message: `this page is not what \`docs.ts page\` produces from ${relative(workspace, seat)}. A page is never edited by hand: edit the seat file and produce it again` }];
}

/** dependsOn is one way and acyclic, over whatever set of constructs is given. */
export function checkDepends(files: string[], blocks: Map<string, any>): Finding[] {
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

/**
 * A CLOSED VALUE IS NAMED IN A CHAPTER, AND NOTHING SAID WHAT ITS MEMBERS ARE.
 *
 * `RD.DEVEX.WORKSPACE.165` is a MUST and had zero compliant instances when this was written: *a chapter that
 * owns a closed vocabulary states it as a contract block, and every other mention cites it.* A
 * vocabulary named but never listed cannot be implemented from the document, which is the one thing
 * the book is for — somebody building a second stack reads a page and writes the value.
 *
 * Measured the day it was written: the tier ladder documented all five rungs with more than an enum
 * carries, and beside it one chapter promised a third behaviour kind the corpus and the contract
 * disagree about. Both states were invisible because nothing compared a page with the code under it.
 *
 * **The finder is TypeScript-shaped and the rule is not.** A realization is found by reading
 * `export enum <Name>` out of the workspace's source, which is this stack's spelling. A workspace
 * holding no such file is not in breach: the book is the source, a realization is a realization,
 * and a value nothing realizes yet is reported as unrealized rather than as a disagreement.
 *
 * SOFT on purpose, for now. A new check that refuses is a check people satisfy by editing the page
 * to match the tool, and this one is reading a corpus that has never been held to it.
 */

/** A declaration block: a fenced `ts` enum in a chapter, with one line of meaning per member. */
export type Declaration = { name: string; members: string[]; file: string };

export const ENUM_BLOCK = /```ts\n([\s\S]*?)```/g;
/**
 * An enum's name and its body. The body holds no brace of its own, so it ends at its first `}` and a
 * one-line enum never runs on into the enum after it. A comment inside it may hold a balanced pair,
 * as `{@link Other}` does, and the body reads through such a pair.
 */
export const ENUM_HEAD = /export enum ([A-Za-z][A-Za-z0-9_]*)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g;
// A member on its own line, or several on one line in a compact declaration.
export const ENUM_MEMBER = /(?:^|[{,]|\n)\s*([A-Z][A-Z0-9_]*)\s*=/g;

/** Every closed value a chapter declares, read out of its fenced `ts` blocks. */
export function declarationsIn(file: string, src: string): Declaration[] {
  const found: Declaration[] = [];
  for (const fence of src.matchAll(ENUM_BLOCK)) {
    for (const decl of fence[1].matchAll(ENUM_HEAD)) {
      const members = [...decl[2].matchAll(ENUM_MEMBER)].map((m) => m[1]);
      found.push({ name: decl[1], members: members, file: file });
    }
  }
  return found;
}

/** A name ending in `Type` that source declares as an interface, a type alias or a class. */
export const SHAPE_HEAD = /export (?:interface|type|(?:abstract )?class) ([A-Z][A-Za-z0-9_]*Type)\b/g;

/** What the workspace's source declares: each enum with its members, and each `…Type` name that is a shape. */
export type SourceDeclarations = { enums: Map<string, { file: string; members: string[] }>; shapes: Set<string> };

/**
 * Every closed value the workspace's source declares, indexed by name, and every name ending in
 * `Type` that the source declares as something other than an enum.
 *
 * Built once per run rather than per page. Only `src/` is read: a build output and a dependency
 * hold copies, and a copy disagreeing with its source is a finding about the build rather than
 * about the book.
 *
 * A SHAPE IS NOT A CLOSED VALUE. `EntityType` is a row an interface describes, so no chapter owes
 * it a list of members. A name the source declares both ways is an enum, and stays out of `shapes`.
 */
export function sourceDeclarations(workspace: string): SourceDeclarations {
  const index = new Map<string, { file: string; members: string[] }>();
  const shaped = new Set<string>();
  const walk = (dir: string, depth: number): void => {
    if (depth > 8) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name[0] === ".") continue;
        walk(full, depth + 1);
      } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        let body;
        try { body = readFileSync(full, "utf8"); } catch { continue; }
        if (body.includes("Type")) for (const shape of body.matchAll(SHAPE_HEAD)) shaped.add(shape[1]);
        if (!body.includes("export enum ")) continue;
        for (const decl of body.matchAll(ENUM_HEAD)) {
          const members = [...decl[2].matchAll(ENUM_MEMBER)].map((m) => m[1]);
          // A generated client mirrors somebody else's vocabulary. First writer wins, and a
          // generated file never overwrites a hand-written declaration.
          if (index.has(decl[1]) && full.includes("/generated/")) continue;
          index.set(decl[1], { file: full.slice(workspace.length + 1), members: members });
        }
      }
    }
  };
  /** The nodes of one repository — `<repo>/apps/<node>/src` and `<repo>/packages/<node>/src`. */
  const nodesOf = (repo: string): void => {
    for (const holder of ["apps", "packages"]) {
      const under = join(repo, holder);
      if (!existsSync(under)) continue;
      for (const node of readdirSync(under, { withFileTypes: true })) {
        if (node.isDirectory()) walk(join(under, node.name, "src"), 0);
      }
    }
  };
  // THE WORKSPACE IS SOMETIMES THE REPOSITORY, and reading only one shape finds nothing in the
  // other. `workspaceRoot` walks up to the folder holding the sibling checkouts, so a normal run
  // gets `<workspace>/<repo>/packages/…`; a run with `SPN_WORKSPACE` pointed at a single
  // repository gets `<workspace>/packages/…`. Both are read, because an index that quietly finds
  // no source reports no disagreement and looks exactly like a corpus that agrees.
  nodesOf(workspace);
  for (const repo of (() => { try { return readdirSync(workspace, { withFileTypes: true }); } catch { return []; } })()) {
    if (!repo.isDirectory() || repo.name[0] === ".") continue;
    nodesOf(join(workspace, repo.name));
  }
  return { enums: index, shapes: new Set([...shaped].filter((name) => !index.has(name))) };
}

/** Every closed value the workspace's source declares, indexed by name. */
export function realizationIndex(workspace: string): Map<string, { file: string; members: string[] }> {
  return sourceDeclarations(workspace).enums;
}

/** Each declaration in this chapter, read against the code that realizes it. */
export function checkVocabulary(
  file: string, src: string, realized: Map<string, { file: string; members: string[] }>
): Finding[] {
  const f: Finding[] = [];
  for (const decl of declarationsIn(file, src)) {
    if (decl.members.length === 0) {
      f.push({ check: "vocabulary", grade: "SOFT", file,
        message: `\`${decl.name}\` is declared with no members a reader can enumerate` });
      continue;
    }
    const code = realized.get(decl.name);
    // A value the book states and nothing realizes yet is the normal state of a standard. It is
    // reported nowhere, because a book that could only name what exists would never lead anything.
    if (!code) continue;
    const extra = decl.members.filter((m) => !code.members.includes(m));
    const missing = code.members.filter((m) => !decl.members.includes(m));
    if (extra.length === 0 && missing.length === 0) continue;
    const said: string[] = [];
    if (extra.length) said.push(`names ${extra.join(" · ")}, which ${code.file} does not have`);
    if (missing.length) said.push(`does not name ${missing.join(" · ")}, which ${code.file} carries`);
    f.push({ check: "vocabulary", grade: "SOFT", file,
      message: `\`${decl.name}\` ${said.join("; and ")} — one of the two is wrong, and nothing else compares them` });
  }
  return f;
}

/**
 * A value named as a contract term, and nowhere declared.
 *
 * Read across the whole corpus rather than per page, because the chapter naming a value is often
 * not the chapter that owns it: `Terms` gives a reader the word, and the declaration gives an
 * implementer the members. Both are correct, and only the second may be absent.
 *
 * A second declaration of one value is the other half of `RD.DEVEX.WORKSPACE.165` — *it is the ONE place the
 * vocabulary is written* — and two pages drifting apart is exactly what the rule prevents.
 */
// A MEMBER REFERENCE NAMES ITS TYPE, and reading only the bare form missed three of the four stale
// terms found the day this was written: `SPDocPassType.FRAME` is as much a claim that the type
// exists as `SPDocPassType` is, and the contract had deleted it the day before.
export const TERMS_CONTRACT = /^\|[^|]*\|\s*`([A-Z][A-Za-z0-9_]*Type)(?:\.[A-Z][A-Za-z0-9_]*)?`\s*\|/gm;

/**
 * The coverage check over a corpus. `shapes` holds the names ending in `Type` that the source
 * declares as an interface, a type alias or a class: such a term is no closed value, so it is not
 * reported. A term the source declares nowhere is still reported, because the book may lead the code.
 */
export function checkVocabularyCoverage(
  files: string[], sources: Map<string, string>, shapes: ReadonlySet<string> = new Set<string>()
): Finding[] {
  const f: Finding[] = [];
  const declaredIn = new Map<string, string[]>();
  for (const file of files) {
    for (const decl of declarationsIn(file, sources.get(file) ?? "")) {
      declaredIn.set(decl.name, [...(declaredIn.get(decl.name) ?? []), file]);
    }
  }
  // Only where a corpus was given. One page on its own cannot say whether another declares a value.
  if (files.length < 2) return f;
  for (const [name, where] of declaredIn) {
    if (where.length > 1) f.push({ check: "vocabulary", grade: "SOFT", file: where[0],
      message: `\`${name}\` is declared in ${where.length} chapters — ${where.join(" · ")}; a closed vocabulary is written in one place and cited everywhere else` });
  }
  const named = new Map<string, string>();
  for (const file of files) {
    for (const row of (sources.get(file) ?? "").matchAll(TERMS_CONTRACT)) {
      if (!named.has(row[1])) named.set(row[1], file);
    }
  }
  for (const [name, file] of named) {
    if (declaredIn.has(name) || shapes.has(name)) continue;
    f.push({ check: "vocabulary", grade: "SOFT", file,
      message: `\`${name}\` is named as a contract term and no chapter declares its members — a reader cannot write the value from the book` });
  }
  return f;
}

// ---------------------------------------------------------------------------- face

// What is generated is generated, and it sits between markers so the prose around it is a person's.
// `face` writes the same bytes on every run: it reads, renders, and replaces the marked region only.
export const BEGIN = (what: string) => `<!-- spn:generated ${what} — do not edit inside these markers; \`docs.ts face\` writes it -->`;
export const END = "<!-- /spn:generated -->";

export function replaceRegion(src: string, what: string, body: string): string {
  const begin = BEGIN(what);
  const i = src.indexOf(begin);
  if (i < 0) return src.trimEnd() + `\n\n${begin}\n${body}\n${END}\n`;
  const j = src.indexOf(END, i);
  if (j < 0) return src.trimEnd() + `\n\n${begin}\n${body}\n${END}\n`;
  return src.slice(0, i) + `${begin}\n${body}\n${END}` + src.slice(j + END.length);
}

/**
 * A generated region taken off a page for good.
 *
 * A region nothing regenerates does not stand still, it goes stale: the glossary left on the seat
 * face would be a copy of a table that now lives in 36 places, and the only thing keeping it right
 * was the run that stopped writing it.
 */
export function removeRegion(src: string, what: string): string {
  const begin = BEGIN(what);
  const i = src.indexOf(begin);
  if (i < 0) return src;
  const j = src.indexOf(END, i);
  if (j < 0) return src;
  return (src.slice(0, i).trimEnd() + "\n" + src.slice(j + END.length).replace(/^\n+/, "\n")).trimEnd() + "\n";
}

export type Row = { term: string; contract: string; means: string; file: string };

/** A markdown table's data rows, as trimmed cells. */
export function mdRows(block: string): string[][] {
  return block.split("\n")
    .filter((l) => l.trim().startsWith("|") && !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    // AN ESCAPED PIPE IS CONTENT. Splitting `Write\|Edit` on it wrote a glossary row whose contract
    // term was `Write\` and whose meaning was `Edit` — found by the column check below, which is the
    // first thing that ever read a generated cell against its heading (N37 step 7).
    .map((l) => l.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim()))
    .slice(1); // the header
}

export function sectionBody(src: string, heading: RegExp): string | null {
  const lines = src.split("\n");
  const i = lines.findIndex((l) => /^##\s/.test(l) && heading.test(l));
  if (i < 0) return null;
  const j = lines.findIndex((l, k) => k > i && /^##\s/.test(l));
  return lines.slice(i + 1, j < 0 ? undefined : j).join("\n");
}

export function walkFiles(dir: string, keep: (p: string) => boolean, out: string[] = []): string[] {
  let entries: string[]; try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".git" || e === "dist") continue;
    // `templates/` is excluded BY THE FOLDER rather than per file (03-tree.md, *A seat may carry
    // `templates/`*). A template's block carries placeholders, it sits in no reading order, and it
    // is never a mirror of anything — so no walk of a seat may pick one up as a document.
    if (e === TEMPLATES) continue;
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkFiles(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

/**
 * The files directly in a folder, with nothing below it read.
 *
 * A MIRROR IS A DIRECT CHILD, and the recursive walk is what made the Map name folders that do not
 * exist. `walkFiles` reaches every depth, so a seat face three levels above the chapters collected
 * them all and derived `<root>/<the docs-relative path>/` from each — a source root with the seat's
 * own numbering concatenated onto it. 36 such cells stood across three repositories, every one
 * naming nothing. A level that holds no `.md` of its own governs no mirror, and saying so is the
 * correct answer rather than an empty table to be filled in later.
 */
export function directFiles(dir: string, keep: (p: string) => boolean): string[] {
  let entries: string[]; try { entries = readdirSync(dir); } catch { return []; }
  const out: string[] = [];
  for (const e of entries) {
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    // A folder is never a mirror here. `templates/` needs no exception of its own: nothing inside
    // any folder is a direct child.
    if (st.isDirectory()) continue;
    if (keep(p)) out.push(p);
  }
  return out;
}

/**
 * The glossary of ONE DOMAIN: one row per term, three columns, generated from that domain's own
 * constructs.
 *
 * IT SITS ON THE DOMAIN RATHER THAN ON THE SEAT. A repository-wide table ran to 573 rows in the
 * foundation and 347 in the platform, where a single domain's is twelve to a hundred and twenty-two
 * — and a term written twice in one domain sat two hundred rows apart, which is why 55 duplicates
 * across the workspace were never read as duplicates (`refs/doc-sets.md`, *A domain face carries its
 * glossary*).
 *
 * THERE IS NO *WHERE IT IS STORED* COLUMN, AND ITS DELETION IS THE REPAIR. It was joined from the
 * domain's `data-model.md` by taking each row's first cell as a table name, and it named a table in
 * none of 252 rows measured. No correction to those files could have repaired it either: a data
 * model is grouped by table and a glossary row is keyed by term, so even a faithful storage mirror
 * answers *which terms live in this table* while the column asks the opposite. Storage is read in
 * the data model itself, beside the migrations it mirrors (RD.DEVEX.WORKSPACE.134).
 *
 * THE CONSTRUCT IS THE TERM'S LINK RATHER THAN A FOURTH COLUMN. A reader wanting the page that
 * defines the word follows the word.
 */
/**
 * The rows of one domain's glossary, gathered once.
 *
 * TWO RENDERERS SHARE THIS AND NEITHER GATHERS ITS OWN. The markdown face and the HTML overview
 * carry the same glossary, and this file has already learned three times what happens when two
 * halves of one tool are given different inputs — the Proof join, the link rewriter, and the way
 * back, each of which reported a correct corpus as broken until both halves were handed the same
 * thing. A glossary written twice would be the fourth.
 */
export function glossaryRows(domainDir: string): { rows: Array<Row & { group: string }>; findings: Finding[] } {
  const findings: Finding[] = [];
  const rows: Row[] = [];
  type Construct = { id: string; title: string; summary: string; deps: string[]; file: string };
  const constructs: Construct[] = [];
  for (const file of walkFiles(domainDir, (p) => p.endsWith(".md") && basename(p) !== "README.md")) {
    const src = readFileSync(file, "utf8");
    const { block } = readBlock(src);
    if (block?.id) constructs.push({ id: block.id, title: block.title, summary: block.summary, deps: block.dependsOn ?? [], file });
    const body = sectionBody(src, /Terms\b/);
    if (!body) continue;
    const cells = mdRows(body);
    if (cells.length && cells[0].length < 3) {
      findings.push({ check: "face", grade: "RULE", file, message: "the `Terms` table has two columns; the glossary needs the consumer's word, the contract term and the meaning (03-tree.md, the glossary's three sources)" });
      continue;
    }
    for (const c of cells) rows.push({ term: c[0], contract: c[1], means: c[2], file });
  }

  // THE ORDER A NEWCOMER MEETS THEM, NOT THE ALPHABET (Q233). `overview-template.html` asks a
  // glossary for "capitalised concept names, in the order a newcomer meets them" and this sorted
  // A-Z, so a reader met `Access token` two hundred rows before the `Identity` it hangs off. The
  // order is the domain face's OWN reading order — the one the construct table directly above is
  // already written in — and terms sort by name inside their construct. A construct contributes a
  // heading row, so the grouping is visible rather than implied.
  const order = new Map(readingOrder(constructs).map((c, i) => [c.file, i]));
  const label = new Map(constructs.map((c) => [c.file, sectionName(c.title)]));
  const rank = (f: string) => order.get(f) ?? Number.MAX_SAFE_INTEGER;
  rows.sort((a, b) => rank(a.file) - rank(b.file) || a.term.localeCompare(b.term));

  return { rows: rows.map((r) => ({ ...r, group: label.get(r.file) ?? basename(r.file, ".md") })), findings };
}

/** The produced page a construct seat becomes, so an HTML page links an HTML page (Q234). */
export function pageForSeat(seat: string): string {
  return producedPageOf(seat);
}

/**
 * The overview that is a domain's face in HTML, or null where the domain has none.
 *
 * NINE DOMAINS HAVE NO OVERVIEW and they arrive with `N41`; a null here means the glossary lands on
 * the markdown face alone, which is what every domain had before this. The join is the title, the
 * same one the way back uses.
 */
export function overviewForDomain(domainDir: string): string | null {
  const dir = resolve(domainDir).replace(/\\/g, "/");
  const split = splitAtSeat(dir, "constructs", "last");
  if (!split) return null;
  const face = join(dir, "README.md");
  if (!existsSync(face)) return null;
  const title = readBlock(readFileSync(face, "utf8")).block?.title;
  if (!title) return null;
  const overviews = overviewsDir(split.docs);
  if (!existsSync(overviews)) return null;
  for (const f of readdirSync(overviews).filter((x) => x.endsWith(".html")).sort()) {
    const full = join(overviews, f);
    if (readBlock(readFileSync(full, "utf8")).block?.title === title) return full;
  }
  return null;
}

/** The same glossary, as the domain's overview carries it (Q226 `A`). */
export function buildGlossaryHtml(domainDir: string, overviewFile: string): { body: string; findings: Finding[] } {
  const { rows, findings } = glossaryRows(domainDir);
  const esc = (x: string) => x.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // `\|` is markdown's way to keep a pipe inside a cell; HTML has no such need, so the pipe is bare.
  const cell = (x: string) => esc(x.replace(/\\\|/g, "|")).replace(/`([^`]*)`/g, "<code>$1</code>");
  const out = [
    '  <div class="sds-scroll"><table class="sds-glossary">',
    "    <thead><tr><th>Term</th><th>Contract term</th><th>What it means</th></tr></thead>",
    "    <tbody>",
  ];
  let group: string | null = null;
  for (const r of rows) {
    if (r.group !== group) { out.push(`      <tr class="sds-group"><td colspan="3">${esc(r.group)}</td></tr>`); group = r.group; }
    const href = relative(dirname(overviewFile), pageForSeat(r.file));
    const term = r.term && r.term !== "—" ? `<a href="${href}">${esc(r.term)}</a>` : esc(r.term);
    out.push(`      <tr><td>${term}</td><td>${cell(r.contract)}</td><td>${cell(r.means)}</td></tr>`);
  }
  if (!rows.length) out.push('      <tr><td>&mdash;</td><td>&mdash;</td><td>no construct in this domain carries a <code>Terms</code> table yet</td></tr>');
  out.push("    </tbody>", "  </table></div>");
  return { body: out.join("\n"), findings };
}

/** One domain's glossary as the markdown face carries it. */
export function buildGlossary(domainDir: string, faceFile: string): { body: string; findings: Finding[] } {
  const { rows, findings } = glossaryRows(domainDir);
  const lines = ["## Glossary", "", "| Term | Contract term | What it means |", "| --- | --- | --- |"];
  let group: string | null = null;
  for (const r of rows) {
    if (r.group !== group) { lines.push(`| **${r.group}** | | |`); group = r.group; }
    // A term no consumer speaks of carries a deliberate dash in this column, and a dash links
    // nowhere — the reader is being told there is no word, not sent to a page.
    const target = relative(dirname(faceFile), r.file);
    const term = r.term && r.term !== "—" ? `[${r.term}](${target})` : r.term;
    lines.push(`| ${term} | ${r.contract} | ${r.means} |`);
  }
  if (!rows.length) lines.push("| — | — | no construct in this domain carries a `Terms` table yet |");
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
export function buildMap(faceFile: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const dir = dirname(faceFile);
  // A package folder is the level below a domain: `04-capabilities/<domain>/<package>/README.md`.
  const rel = splitAtSeat(faceFile, "capabilities")?.rel ?? "";
  if (rel.split("/").length >= 3) return buildChapterMap(faceFile);
  // WHERE THE SOURCE ROOT IS, READ FROM THE FACE RATHER THAN ASSUMED. A mirror is named for the
  // folder it governs, and almost every node roots that at `src/`. A repository whose source is
  // laid out differently — the marketplace, whose source is `plugins/<name>/` — declares its root
  // on the face, and the Map then names a folder that exists instead of one that does not.
  const { block: faceBlock } = readBlock(readFileSync(faceFile, "utf8"));
  const root = (faceBlock?.governs ?? "src").replace(/\/+$/, "");
  // ONLY THE DIRECT CHILDREN, BECAUSE THE DERIVATION BELOW IS ONE LEVEL DEEP. `governs` is a source
  // root and `rel` is appended to it whole, so a file collected from further down carries the
  // levels between — the domain folder and the package folder — into a path that never existed.
  // The chapter branch above is where a deeper file belongs, and it is reached by the face that
  // owns it. A folder with no `.md` of its own governs no mirror, and the empty case below says so.
  const mirrors = directFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md" && basename(p) !== "data-model.md")
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
export function buildChapterMap(faceFile: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const dir = dirname(faceFile);
  // THE REALIZATION FILES ARE NOT CHAPTERS. A data model and a surface map sit beside a package's
  // chapters and realize no construct, so a Map row for either would name a topic nobody declared.
  const chapters = walkFiles(dir, (p) => p.endsWith(".md") && !["README.md", "data-model.md", "surface-map.md"].includes(basename(p)))
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
export function conceptSections(concept: string): Map<string, { bridge: string; lines: string[] }> {
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
export function sectionKey(heading: string): string {
  return heading
    .replace(/`[^`]*`/g, "")
    .replace(/^SaaS Plane\s*[—–-]\s*/i, "")
    .replace(/^(?:The|A|An)\s+/i, "")
    .replace(/\s*&\s*/g, "-and-")
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The folder name a domain or group folder carries, with its reading-order prefix stripped. */
export function folderKey(folder: string): string {
  return folder.replace(/^\d+-/, "").toLowerCase();
}

/** Constructs in an order no construct precedes one it depends on. */
export function readingOrder(constructs: { id: string; title: string; summary: string; deps: string[]; file: string }[]) {
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
 * A link written for one document, re-based for another document that carries the same prose.
 *
 * A face's bridge is the concept's own prose, and the concept sits at the repository root. Its
 * relative links resolve from there. Copied verbatim into `02-constructs/<group>/<domain>/README.md`
 * they resolve from four levels down, which is a broken link the generator itself wrote.
 */
export function rebase(body: string, fromDir: string, toDir: string): string {
  return body.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
    if (/^(?:https?:|mailto:|#|\/)/.test(target)) return whole;
    const [path, hash] = target.split(/(?=#)/);
    if (!path) return whole;
    return `](${relative(toDir, resolve(fromDir, path))}${hash ?? ""})`;
  });
}

/** Every folder under the constructs seat, deepest last — each one carries a face. */
export function constructFolders(root: string): string[] {
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
export function isGroup(dir: string): boolean {
  try {
    const entries = readdirSync(dir);
    // A group holds DOMAINS. An empty folder holds neither, so it is a domain with nothing written
    // in it yet — which is the compact state of every seat the day it is minted, and reporting it
    // as a group would hide every domain in a repository that has not started writing.
    if (!entries.some((e) => { try { return statSync(join(dir, e)).isDirectory(); } catch { return false; } })) return false;
    return !entries.some((e) => e.endsWith(".md") && e !== "README.md");
  } catch { return false; }
}

/**
 * A DOMAIN, which is the half of invariant 1's test that excludes a group.
 *
 * A domain sits directly under the constructs seat, or one level down where its parent is a group.
 * A group maps the domains beneath it and declares no term of its own; a level beneath a domain
 * organizes one domain's argument and its terms belong to the domain above it. So the glossary
 * lands on a domain folder and on no other kind.
 */
export function isDomainFolder(constructsDir: string, dir: string): boolean {
  if (isGroup(dir)) return false;
  const depth = relative(constructsDir, dir).split("/").length;
  return depth === 1 || (depth === 2 && isGroup(dirname(dir)));
}

export function domainFaces(tree: string, concept: string | null): { faces: Map<string, string>; findings: Finding[] } {
  const findings: Finding[] = [];
  const faces = new Map<string, string>();
  const sections = concept ? conceptSections(concept) : new Map();
  const conceptDir = concept ? dirname(concept) : tree;

  const constructsSeat = constructsDir(tree);
  const folders = constructFolders(constructsSeat);

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
    const depth = relative(constructsSeat, dir).split("/").length;
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

  return { faces, findings };
}

/**
 * The generated glossary placed inside an overview's `Glossary` section.
 *
 * AN OVERVIEW IS WRITTEN BY HAND AND THIS IS THE FIRST GENERATED REGION IN ONE. So the markers go
 * INSIDE the section rather than at the end of the file, which is where `replaceRegion` puts a
 * region it cannot find — correct for a markdown face, and after the closing tag on a page.
 *
 * THE AUTHORED LEAD SENTENCE ABOVE THE TABLE SURVIVES (Q231): only the table is replaced, because
 * a generated table with no sentence above it makes a reader work out what they are looking at.
 * Null where the page has no `Glossary` section or no table in it — the caller reports that rather
 * than inventing a place to put it.
 */
export function placeGlossary(src: string, body: string): string | null {
  const m = src.match(/<section[^>]*data-block="glossary"[^>]*>[\s\S]*?<\/section>/);
  if (!m) return null;
  const sec = m[0];
  const begin = BEGIN("glossary-html");
  const i = sec.indexOf(begin);
  let next: string;
  if (i >= 0) {
    const j = sec.indexOf(END, i);
    if (j < 0) return null;
    next = sec.slice(0, i) + `${begin}\n${body}\n  ${END}` + sec.slice(j + END.length);
  } else {
    const t = sec.match(/[ \t]*<div class="sds-scroll"><table>[\s\S]*?<\/table><\/div>/);
    if (!t) return null;
    next = sec.replace(t[0], `  ${begin}\n${body}\n  ${END}`);
  }
  return src.replace(sec, next);
}

export function face(tree: string, write: boolean): Finding[] {
  const findings: Finding[] = [];
  const touched: string[] = [];

  // ONE DICTIONARY PER DOMAIN, AND NONE ON THE SEAT. The seat face keeps the domain table it already
  // carries, and a reader who wants the words goes to the domain that decides their meaning
  // (`refs/doc-sets.md`, *It sits on the domain, not on the seat face*).
  const constructsSeat = constructsDir(tree);
  for (const dir of constructFolders(constructsSeat).filter((d) => isDomainFolder(constructsSeat, d))) {
    const domainFace = join(dir, "README.md");
    if (!existsSync(domainFace)) {
      findings.push({ check: "face", grade: "SOFT", file: domainFace, message: "no domain face to write the glossary into" });
      continue;
    }
    const { body, findings: df } = buildGlossary(dir, domainFace);
    findings.push(...df);
    const before = readFileSync(domainFace, "utf8");
    const after = replaceRegion(before, "glossary", body);
    if (after !== before) { if (write) writeFileSync(domainFace, after); touched.push(relative(tree, domainFace)); }

    // AND THE SAME GLOSSARY ON THE DOMAIN'S OVERVIEW (Q226 `A`). A reader of the overview meets the
    // whole vocabulary at once and then learns it going through the constructs, which is what earns
    // the contract term a column there. The rows are gathered once for both, so the two cannot
    // drift; the findings are taken from the markdown build alone, or every two-column `Terms`
    // table would be reported twice.
    const overview = overviewForDomain(dir);
    if (overview) {
      const { body: html } = buildGlossaryHtml(dir, overview);
      const ovBefore = readFileSync(overview, "utf8");
      // THE GLOSSARY IS WRITTEN WITH THE SHARED STYLESHEET'S CLASS NAMES, so it goes only into an
      // overview that links the shared stylesheet. An overview that links none is named once, with
      // the text every command uses, and nothing is written into it.
      const ownCopy = holdsOwnCopy(overview, ovBefore);
      const ovAfter = ownCopy ? ovBefore : placeGlossary(ovBefore, html);
      if (ownCopy)
        findings.push({ check: "styles", grade: "SOFT", file: overview, message: OWN_COPY });
      else if (ovAfter === null)
        findings.push({ check: "face", grade: "SOFT", file: overview, message: "this domain's overview has no `Glossary` section with a table in it, so the domain's glossary has nowhere to land" });
      else if (ovAfter !== ovBefore) { if (write) writeFileSync(overview, ovAfter); touched.push(relative(tree, overview)); }
    }
  }

  const seatFace = join(constructsSeat, "README.md");
  if (existsSync(seatFace)) {
    const before = readFileSync(seatFace, "utf8");
    const after = removeRegion(before, "glossary");
    if (after !== before) { if (write) writeFileSync(seatFace, after); touched.push(relative(tree, seatFace)); }
  } else {
    findings.push({ check: "face", grade: "SOFT", file: seatFace, message: "no constructs seat face" });
  }

  // THE DOMAIN FACE IS THE ONE PLACE A CONSTRUCT LIST IS GENERATED. The concept carries no second
  // copy of it, because that copy would be the face's inventory wearing the concept's clothes: one
  // source, two generated homes, and a reader one click from the place whose whole job is to be
  // that list. A concept states the model at SHAPE depth — which domains exist and why the
  // repository divides that way — and a construct's summary is depth (MD10).
  const conceptFile = ["CONCEPT.md", join("..", "CONCEPT.md")].map((c) => join(tree, c)).find(existsSync) ?? null;
  const { faces, findings: dfz } = domainFaces(tree, conceptFile);
  findings.push(...dfz);
  for (const [file, body] of faces) {
    if (!existsSync(file)) { findings.push({ check: "face", grade: "SOFT", file, message: "no domain face to write into" }); continue; }
    const before = readFileSync(file, "utf8");
    const after = replaceRegion(before, "constructs", body);
    if (after !== before) { if (write) writeFileSync(file, after); touched.push(relative(tree, file)); }
  }
  // A Map is a list of MIRRORS, and a mirror is named for the source folder it governs. Where a
  // repository's capabilities seat is AUTHORED rather than derived — the foundation book, and only
  // it (03-tree.md, *Number what is ordered*) — there is no source folder for a row to name, and
  // generating one invents a `src/` the repository does not have.
  const authored = (() => {
    try { return JSON.parse(readFileSync(join(tree, "..", "sprepo.json"), "utf8")).type === "FOUNDATION"; }
    catch { return false; }
  })();

  for (const faceFile of authored ? [] : walkFiles(capabilitiesDir(tree), (p) => basename(p) === "README.md")) {
    const { body, findings: mf } = buildMap(faceFile);
    findings.push(...mf);
    const before = readFileSync(faceFile, "utf8");
    const after = replaceRegion(before, "contents", body);
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
 * The status a set of behaviour rows rolls up to.
 *
 * A construct's status is what the runs say about the behaviours at its own path, and nothing else.
 * It is never read from the *where it lives today* rows in `Binds` or from `Proof` — a table
 * somebody typed about where code sits, which says where the work is rather than whether it works.
 * Decision `E` reads it from the rows, so the word changes when a run changes and at no other moment.
 *
 * `PLANNED` is the author's mark and means nothing has run, so a file of `PLANNED` rows and a file of
 * no rows roll up the same way. **A file with no rows is honest** where the product is not built:
 * `spn-launchpad-ts` has two, because Surfaces and Web Shell settle declarations rather than acts.
 *
 * `MANUAL` is counted as started and never as proven. It is the one status a run never writes — the
 * contract says the agent never writes it — so letting it reach `DONE` would put a hand-typed word
 * back in charge of the badge, which is the thing this derivation exists to remove.
 *
 * A `Tier` is required for `DONE` because a proven row with no tier names no rung anybody can re-run.
 */
export function deriveStatus(rows: BehaviourRow[]): "PLANNING" | "IMPLEMENTING" | "DONE" {
  const value = (r: BehaviourRow) => r.status.replace(/[`*]/g, "").trim().toUpperCase();
  const started = rows.filter((r) => ["PENDING", "SUCCESS", "FAILED", "MANUAL"].includes(value(r)));
  if (!started.length) return "PLANNING";
  const proven = rows.filter((r) => value(r) === "SUCCESS");
  const tiered = (r: BehaviourRow) => !["", "—", "-"].includes(r.tier.replace(/[`*]/g, "").trim());
  if (proven.length === rows.length && proven.every(tiered)) return "DONE";
  return "IMPLEMENTING";
}

/**
 * The behaviours file at a construct's own path, or null.
 *
 * `02-constructs/01-iam/04-sign-in.md` is proved by `03-behaviors/01-iam/04-sign-in.md` and by
 * nothing else. **No fallback.** `registerFor` keeps two, for the Proof join that has to render a
 * page during a move; a derivation must not, because rolling a domain's whole register up into one
 * construct stamps every page in the domain with the same word and each one reads as its own claim.
 * An absent file is what path parity reports, and this returns null rather than guessing.
 */
export function behavioursFor(seat: string): string | null {
  const mirrored = mirrorPath(seat, "constructs", "behaviors");
  return mirrored !== null && existsSync(mirrored) ? mirrored : null;
}

/**
 * A construct's status, derived from the behaviour rows at its own path and never typed.
 *
 * A FOUNDATION repository's construct derives nothing at all: its rows are `PROMISE`, five columns
 * with no `Status`, and a promise has no proof state. So the word is REMOVED there rather than
 * computed — from the block and from the tag line, the two places it renders.
 *
 * It writes the seat file only. The page follows from `docs.ts page`, so there is one writer per file.
 *
 * `say` receives each line the status command prints about a seat. `docs audit` calls this with the
 * write turned off and passes a `say` that prints nothing, so only the findings reach its output.
 */
export function statusFor(seat: string, workspace: string, write: boolean, say: (line: string) => void = console.log): Finding[] {
  const findings: Finding[] = [];
  const src = readFileSync(seat, "utf8");
  const { block, error } = readBlock(src);
  if (!block) return [{ check: "status", grade: "RULE", file: seat, message: error ?? "no spn:doc block" }];
  if (block.variant !== "construct") return [];
  const shown = relative(workspace, seat);

  if (!carriesStatus(seat, block)) {
    // ONE COMMA GOES WITH THE FIELD, AND WHICH ONE DEPENDS ON WHERE THE FIELD SITS. Taking the
    // leading comma unconditionally leaves `{ , "title": …` behind when `status` is the first key,
    // and the block then fails to parse — a page broken by the command that was tidying it.
    const pair = '"status":\\s*"(?:DONE|IMPLEMENTING|PLANNING)"';
    const leading = new RegExp(`,\\s*${pair}`);
    const out = (leading.test(src) ? src.replace(leading, "") : src.replace(new RegExp(`${pair}\\s*,\\s*`), ""))
      .replace(/(`For:[^`\n]*`)[ \t]*·[ \t]*`Status:[^`\n]*`/u, "$1");
    if (out === src) { say(`current  ${shown} — a FOUNDATION construct states a standard and carries no status`); return findings; }
    // SOFT while the book's constructs still carry the word. The sweep runs this command in write
    // mode over the tree; until it does, the finding says what is owed rather than refusing 51 pages.
    if (write) { writeFileSync(seat, out); say(`wrote    ${shown} — status removed; a FOUNDATION construct's rows are \`PROMISE\``); }
    else findings.push({ check: "status", grade: "SOFT", file: seat,
      message: "a construct in a FOUNDATION repository carries no `status` — its behaviour rows are `PROMISE` and a promise has no proof state" });
    return findings;
  }

  const behaviours = behavioursFor(seat);
  if (!behaviours) {
    // AN ABSENT FILE AND AN EMPTY ONE ARE DIFFERENT ANSWERS. No rows means nothing has run, which
    // rolls up to PLANNING. No file means the derivation has no input at all, so it claims nothing
    // and names what is missing — silently stamping PLANNING would read as a measurement.
    findings.push({ check: "status", grade: "SOFT", file: seat,
      message: `no behaviours file at this construct's own path, so nothing rolls up — \`${SEAT.behaviors}/\` mirrors \`${SEAT.constructs}/\` file for file, and \`docs parity\` reports the pair` });
    say(`unread   ${shown} — no behaviours file at the mirrored path`);
    return findings;
  }

  const rows = behaviourRows(behaviours);
  const derived = deriveStatus(rows);

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
  const from = relative(workspace, behaviours);
  if (out === src) { say(`current  ${shown} — ${derived} from ${rows.length} row(s) in ${from}`); return findings; }
  if (write) { writeFileSync(seat, out); say(`wrote    ${shown} — ${block.status} → ${derived}, from ${rows.length} row(s) in ${from}`); }
  else findings.push({ check: "status", grade: "RULE", file: seat, message: `the block says \`${block.status}\` and the ${rows.length} behaviour row(s) in \`${from}\` derive \`${derived}\`` });
  return findings;
}

// ---------------------------------------------------------------------------- page

/**
 * The furniture: the two lines of the construct template that load the shared files. The first is
 * the line that links `sds-docs.css`, and the second is the line that loads `sds-docs.js`. A
 * produced page carries those two lines and nothing else of the template's: no `<style>` block and
 * no script with code (05-artifacts.md § What a stored page carries).
 *
 * A TEMPLATE THAT LACKS EITHER LINE IS REFUSED, because a page produced from it would link no
 * shared file and would show its text with no styling.
 *
 * THE TEMPLATE'S FOOTER IS NOT FURNITURE. It is a note to the author who copies the template, and a
 * produced page is read by somebody else, so the produced footer is empty. A seat carries no footer
 * of its own today; when it does, it is rendered from the seat, never from the template.
 */
export function furniture(templates: string): { stylesheet: string; script: string; footer: string } {
  const template = readFileSync(join(templates, "pages", "construct-template.html"), "utf8");
  const named = (file: string): string => file.replace(/\./g, "\\.");
  const stylesheet = new RegExp(`<link\\b[^>]*\\bhref="[^"]*${named(STYLESHEET)}"[^>]*>`, "i").exec(template)?.[0];
  const script = new RegExp(`<script\\b[^>]*\\bsrc="[^"]*${named(PAGE_SCRIPT)}"[^>]*>\\s*</script>`, "i").exec(template)?.[0];
  if (!stylesheet || !script)
    throw new Error(`\`construct-template.html\` holds no line that loads \`${stylesheet ? PAGE_SCRIPT : STYLESHEET}\`, ` +
      "so a page produced from it would link no shared file (05-artifacts.md, One stylesheet, served in versions)");
  return { stylesheet, script, footer: "" };
}

/** The location field: a declared name, never a folder. */
export function locationOf(seat: string, workspace: string): string {
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

/**
 * The instant this call is made, in the local zone with its offset — `2026-09-29T14:32+05:30`, never
 * a bare UTC `Z`. An audit measures the tree at the moment it reads it, so this is what it stamps;
 * `toISOString` is UTC, which reads as a different day on a machine east of Greenwich.
 */
export function measuredNow(): string {
  return withOffset(new Date());
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
export function registerFor(seat: string): { file: string; exact: boolean } | null {
  const split = splitAtSeat(seat, "constructs");
  if (!split) return null;
  const rel = split.rel;
  const root = `${behaviorsDir(split.docs)}/`;
  if (existsSync(root + rel)) return { file: root + rel, exact: true };
  const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
  if (!dir) return null;
  for (const fallback of [`${root}${dir}/README.md`, `${root}${dir}.md`])
    if (existsSync(fallback)) return { file: fallback, exact: false };
  return null;
}

export type BehaviourRow = { id: string; who: string; does: string; tier: string; status: string };

/**
 * Every behaviour row in a register file, read by COLUMN NAME rather than by position.
 *
 * The row grammar is nine cells and a foundation promise is four, so a fixed index would read the
 * wrong cell on one of the two. Reading the header means a register that gains a column keeps
 * joining, and a table that is not a behaviour table — a persona list, an explanatory table inside
 * the prose — is skipped because it has no `Id` and no `Status`.
 */
export function behaviourRows(file: string): BehaviourRow[] {
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
      // `Who` is the actor the row is written for, and `personaCoverage` joins it to `personas.md`.
      who: cells[at("who")] ?? cells[at("actor")] ?? "",
      does: cells[at("does")] ?? cells[at("journey")] ?? "",
      tier: cells[at("tier")] ?? "—",
      status: cells[at("status")] ?? "—",
    });
  }
  return out;
}

/**
 * The page a construct returns to: its domain's overview (Q238).
 *
 * A DOMAIN AND ITS OVERVIEW SHARE ONE TITLE, AND THAT IS THE ONLY JOIN. The file is
 * `concept-devex-function-overview.html` in one repository and `concept-iam-overview.html` in
 * another — area in the name here, not there — so the path cannot be computed from the seat. Both
 * carry the block title `DevEx Function`, and that is stable because `face` writes the domain's own
 * README from the same concept section the overview borrows.
 *
 * NULL WHERE THE DOMAIN HAS NO OVERVIEW, which is nine domains today, and the caller then keeps the
 * constructs seat's face. A guess would be worse than the old link: it would name a page that is
 * not there, and a link is a promise a reader can follow it.
 */
export function overviewAbove(seat: string, out: string): { href: string; label: string } | null {
  const seatPath = resolve(seat).replace(/\\/g, "/");
  const split = splitAtSeat(seatPath, "constructs", "last");
  if (!split) return null;
  const seatDir = constructsDir(split.docs);

  // The domain is the folder invariant 1 already tests for: depth 1 under the seat, or depth 2
  // where its parent is a group. Walk up from the seat until one of those is true.
  let dir = dirname(seatPath);
  while (dir.startsWith(seatDir) && dir !== seatDir && !isDomainFolder(seatDir, dir)) dir = dirname(dir);
  if (dir === seatDir || !dir.startsWith(seatDir)) return null;

  const face = join(dir, "README.md");
  if (!existsSync(face)) return null;
  const { block } = readBlock(readFileSync(face, "utf8"));
  const title = block?.title;
  if (!title) return null;

  const overviews = overviewsDir(split.docs);
  if (!existsSync(overviews)) return null;
  for (const f of readdirSync(overviews).filter((x) => x.endsWith(".html")).sort()) {
    const b = readBlock(readFileSync(join(overviews, f), "utf8")).block;
    if (b?.title === title) return { href: relative(dirname(out), join(overviews, f)), label: title };
  }
  return null;
}

export function pageFor(seat: string, workspace: string, templates: string, write: boolean): Finding[] {
  const findings: Finding[] = [];

  // A PAGE IS PRODUCED FROM A CONSTRUCT SEAT AND FROM NOTHING ELSE. Given a whole docs tree, this
  // walked every `.md` in it and wrote `<name>-construct.html` beside each one — purpose files,
  // guides, data models, even a report — because the seat-to-page mapping below silently falls
  // through for a path with no `/02-constructs/` in it. Eighteen junk pages in one run, all of them
  // claiming to be constructs. A folder is a convenience for the caller, never a licence to produce.
  if (!inSeat(seat, "constructs")) return findings;

  const src = readFileSync(seat, "utf8");
  const { block, error } = readBlock(src);
  if (!block) { findings.push({ check: "page", grade: "RULE", file: seat, message: error ?? "no spn:doc block" }); return findings; }

  // A construct types no proof (RD.DEVEX.WORKSPACE.132), so the page is the seat and nothing is joined into it.
  // What proves it is read in the tests report, from the behaviour rows at the construct's own path.
  const markdown = src.replace(/<!--\s*spn:doc[\s\S]*?-->\n?/, "");
  const org = process.env.SPN_ORG ?? "SaaS Plane";
  const location = process.env.SPN_LOCATION ?? locationOf(seat, workspace);
  if (location === "—")
    findings.push({ check: "page", grade: "SOFT", file: seat, message: "no manifest above this file declares a `name`, so the header's location reads `—` (Q79 puts `name` on the manifests)" });

  // The page sits beside its seat file, in the pocket that mirrors the seat folder for folder.
  // It is computed BEFORE rendering because the body's links are re-expressed against it: the seat
  // writes `platform-grants.md` for a sibling, and beside the page that sibling is
  // `platform-grants-construct.html`.
  const out = producedPageOf(seat);

  let lines: ReturnType<typeof furniture>;
  try { lines = furniture(templates); }
  catch (error) { findings.push({ check: "page", grade: "RULE", file: seat, message: (error as Error).message }); return findings; }

  const { html, findings: rf } = renderPage({
    block, markdown, workspace: org, location, furniture: lines,
    link: hrefForPage(seat, out),
    home: overviewAbove(seat, out) ?? undefined,
  });
  for (const r of rf) findings.push({ check: "page", grade: "RULE", file: seat, message: r.message });
  const before = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (before === html) { console.log(`current  ${relative(workspace, out)}`); return findings; }
  if (write) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    console.log(`${before ? "rewrote " : "wrote   "} ${relative(workspace, out)}`);
  } else if (before && holdsOwnCopy(out, before)) {
    // THE PAGE ON DISK LINKS NO SHARED STYLESHEET, so it is named once, the way every command names
    // such a page, and its markup is not compared. Running this command without `--check` is what
    // moves it: the page is produced again, with the two lines that load the shared files.
    findings.push({ check: "styles", grade: "SOFT", file: out, message: OWN_COPY });
  } else {
    findings.push({ check: "page", grade: "RULE", file: out,
      message: before ? "this page is not what `docs.ts page` produces from its seat file — it was edited by hand, or the seat file moved on" : "no page has been produced from this seat file yet" });
  }
  return findings;
}

// ------------------------------------------------- the topics check, and the parity checks

/** A numbered document's topic name: `04-sign-in.md` is `sign-in`. Unnumbered files are not topics. */
export function topicName(file: string): string | null {
  const m = /^(\d\d)-(.+)\.md$/.exec(basename(file));
  return m ? m[2] : null;
}

/**
 * Every topic the constructs seat names, with EVERY domain each sits in.
 *
 * A topic name is unique inside its domain and not across the seat, which this returned a single
 * domain per name and so got wrong. The foundation names `shape`, `ships`, `resources` and
 * `operate` in two domains each — the applications half and the infra half both have a shape and
 * both ship something, and neither is the other. Keeping one domain per name meant the last one
 * walked won, and a behaviours file under the other reported as *sitting in the wrong domain*
 * while sitting in exactly the right one.
 *
 * It was worse than a false finding: a merge agent read the rule off this check, concluded topic
 * names must be unique seat-wide, and renamed a page to satisfy it. A check that is wrong does not
 * only report noise — it gets obeyed.
 */
export function constructTopics(repo: string): Map<string, Set<string>> {
  const seat = constructsDir(docsOf(repo));
  const out = new Map<string, Set<string>>();
  if (!existsSync(seat)) return out;
  for (const f of walkFiles(seat, (x) => x.endsWith(".md"))) {
    const name = topicName(f);
    if (!name) continue;
    if (!out.has(name)) out.set(name, new Set());
    out.get(name)!.add(relative(seat, dirname(f)).replace(/\\/g, "/"));
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
export function topicsCheck(repo: string): Finding[] {
  const f: Finding[] = [];
  const named = constructTopics(repo);
  // NO EARLY RETURN ON AN EMPTY SET. It was here, and it made the check vacuous on every repository
  // in the corpus: constructs are not numbered until step 6 numbers them, so `named` was empty, and
  // an empty set made every numbered behaviours file pass by being compared against nothing. A check
  // that reports clean because it found no rule to apply is worse than no check — it is a green light
  // over an unexamined tree. An absent seat is the one honest silence, and `constructTopics` already
  // gives it.
  if (!existsSync(constructsDir(docsOf(repo)))) return f;

  const behaviors = behaviorsDir(docsOf(repo));
  for (const file of existsSync(behaviors) ? walkFiles(behaviors, (x) => x.endsWith(".md")) : []) {
    const name = topicName(file);
    if (name === null) continue;
    const domains = named.get(name);
    if (domains === undefined) {
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` is a numbered topic of the behaviours seat and \`${SEAT.constructs}/\` names no such construct — the constructs name the topics and the other two seats follow (03-tree.md, *One outline, three seats*)` });
      continue;
    }
    const here = relative(behaviors, dirname(file)).replace(/\\/g, "/");
    if (!domains.has(here))
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` sits under \`${here}\` here and under ${[...domains].map((d) => `\`${d}\``).join(" · ")} in the constructs seat — a topic keeps one domain, and the same number, in all three seats` });
  }

  // THE CAPABILITIES SEAT HAS TWO SHAPES AND BOTH ARE RIGHT. In a built repository a topic is one
  // chapter inside each package that realizes the construct, so the FILE carries the topic's name.
  // In this book a topic is a FOLDER of chapters, numbered inside it — `05-app/01-config.md` — so
  // the folder carries it and the file's own number is a reading order within the topic. Judging
  // every numbered file by its own name reported 80 perfectly correct chapters of the book as
  // topics nobody had declared.
  const caps = capabilitiesDir(docsOf(repo));
  for (const file of existsSync(caps) ? walkFiles(caps, (x) => x.endsWith(".md")) : []) {
    const name = topicName(file);
    if (name === null) continue;
    // The topic folder is not at a fixed depth: the book nests a runtime split inside it
    // (`05-app/01-server/01-lifecycle.md`), so the topic is the grandparent there and the parent
    // elsewhere. Walk up to the seat and accept the first ancestor that names a construct —
    // guessing the depth reported 38 correct chapters as topics nobody had declared.
    const ancestors = relative(caps, dirname(file)).split(/[\\/]/).filter(Boolean);
    const viaFolder = ancestors.some((a) => /^\d\d-/.test(a) && named.has(a.replace(/^\d\d-/, "")));
    if (!named.has(name) && !viaFolder)
      f.push({ check: "topics", grade: "RULE", file, message: `\`${name}\` is a numbered chapter of the capabilities seat, and neither it nor the topic folder it sits in is a construct \`${SEAT.constructs}/\` names — a chapter realizes a construct or it is not a chapter (Q130)` });
  }
  return f;
}

/**
 * ONE ID NAMES ONE DOCUMENT, and nothing checked it until two waves of agents collided on it.
 *
 * `id` is identity and never changes; the path is only a document's current address. Two documents
 * sharing one id make every reference ambiguous — a `dependsOn`, a `Realizes`, a restatement — and
 * the ambiguity is silent, because each file is individually correct. Found twice in one sitting:
 * seventeen package faces that inherited the ids of the layer faces they replaced, and a merge
 * agent asking out loud whether `operate` and `test` were already taken in another domain. Nothing
 * enforced global uniqueness, so nobody could answer.
 *
 * Repository-scoped, because that is the scope an id is unique in — the same id in the foundation
 * and in a stack repository is two different books naming their own thing.
 */
export function duplicateIds(repo: string): Finding[] {
  const f: Finding[] = [];
  const tree = join(repo, "docs");
  if (!existsSync(tree)) return f;
  const seen = new Map<string, string[]>();
  for (const file of walkFiles(tree, (p) => p.endsWith(".md"))) {
    const { block } = readBlock(readFileSync(file, "utf8"));
    const id = block?.id;
    if (typeof id !== "string" || !id) continue;
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id)!.push(file);
  }
  for (const [id, files] of seen) {
    if (files.length < 2) continue;
    const where = files.map((x) => relative(tree, x)).sort();
    for (const file of files)
      f.push({ check: "ids", grade: "RULE", file, message: `\`${id}\` is the id of ${files.length} documents — ${where.join(" · ")}. An id is identity and never changes; a path is only a document's current address. Two documents under one id make every \`dependsOn\`, every \`realizes\` and every restatement that names it ambiguous, and silently` });
  }
  return f;
}

/**
 * The set checks — four questions about whole SETS of paths, rows and packages (decision `E`).
 *
 * THEY REPLACE A RESOLVER, AND THE RESOLVER IS WHY THEY ARE SET CHECKS. `Binds`' `Node` cell was
 * matched against every declared name, accepting a hit anywhere inside either string, so
 * `docs/…/10-providers` resolved through a node called `support` and *the estate declaration* through
 * one called `estate`. A cell that resolves to the wrong thing reads as checked, which is the worse
 * of the two possible errors. Each check below compares whole values: a path to a path, an id to an
 * id, a folder name to a package name, a persona to a persona.
 *
 * **Three are here and one is not.** Id coverage — every behaviour id cited by a case, and every
 * cited id declared as a row — is the behaviours join's, under `RD.SUPPORT.APPS.084`. It is built in
 * `spn-apps`, in `scripts/checks/behaviour-join.ts`, and `spn-devex behaviours coverage` lists a case
 * that cites an id no row declares. Building one more here would be two implementations of one
 * idea, disagreeing about the same estate.
 *
 * **A check that cannot run says so.** An absent scan and an absent finding must never share a
 * verdict, so a seat with no ids and a seat with no `personas.md` are each reported by name with the
 * reason, rather than counted clean.
 *
 * **Every one of them ships SOFT.** An agent once read a rule off a buggy check and renamed a page to
 * satisfy it; a check firing over a whole corpus on day one is read as noise and then obeyed anyway.
 */

/** A seat file that is neither a face nor the personas table — the files the seats mirror. */
export const isTopicFile = (p: string) => {
  const name = basename(p);
  return name !== "README.md" && name !== "personas.md";
};

/** Every topic file under a seat, as paths relative to that seat. */
export function topicPaths(seat: string): string[] {
  if (!existsSync(seat)) return [];
  return walkFiles(seat, (p) => p.endsWith(".md") && isTopicFile(p))
    .map((p) => relative(seat, p).replace(/\\/g, "/")).sort();
}

/**
 * `03-behaviors/` mirrors `02-constructs/` file for file, both ways.
 *
 * **PATHS, NEVER ROWS.** A behaviours file with no rows in it is honest wherever the product is not
 * built — `spn-launchpad-ts` has two, because Surfaces and Web Shell settle declarations rather than
 * acts — so a check that demanded a row per file would fail truthfully empty files on day one. What
 * the pairing promises is that one number names one thing in both seats, and that is a question about
 * file paths alone.
 */
export function pathParity(repo: string): Finding[] {
  const f: Finding[] = [];
  const constructs = constructsDir(docsOf(repo));
  const behaviors = behaviorsDir(docsOf(repo));
  if (!existsSync(constructs)) return f;
  if (!existsSync(behaviors)) {
    f.push({ check: "parity", grade: "SOFT", file: constructs,
      message: `the constructs seat is here and \`${SEAT.behaviors}/\` is not, so nothing was compared — the two seats mirror each other file for file` });
    return f;
  }
  const here = topicPaths(constructs);
  const there = topicPaths(behaviors);
  for (const p of here) if (!there.includes(p))
    f.push({ check: "parity", grade: "SOFT", file: join(constructs, p),
      message: `no \`${SEAT.behaviors}/${p}\` — a construct's rows sit at the construct's own path, and a status is rolled up from them` });
  for (const p of there) if (!here.includes(p))
    f.push({ check: "parity", grade: "SOFT", file: join(behaviors, p),
      message: `no \`${SEAT.constructs}/${p}\` — these rows prove a construct nothing declares` });
  return f;
}

/**
 * Every package folder of a repository, by the manifest that declares it.
 *
 * A MANIFEST SITS TWO LEVELS DOWN AND NO DEEPER. `apps/utility-ts/spkind.json` declares a package;
 * `apps/service-sample-ts/src/modules/order/spkind.json` declares a module inside one, and a fixture
 * estate under `tests/` declares nothing about this repository at all. Walking every manifest indexed
 * all three as packages, so a capability folder that had to exist for a test fixture would have
 * counted as owed.
 *
 * A plugin is a package with no manifest of its own, so the marketplace's own declaration is read
 * beside the two — otherwise every plugin's chapters would read as mirroring nothing.
 */
export function packageIndex(repo: string): Set<string> {
  const names = new Set<string>();
  for (const group of existsSync(repo) ? readdirSync(repo) : []) {
    const dir = join(repo, group);
    if (group.startsWith(".") || group === "node_modules" || group === "docs") continue;
    let st; try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const entry of readdirSync(dir)) {
      const at = join(dir, entry);
      try { if (!statSync(at).isDirectory()) continue; } catch { continue; }
      if (["spkind.json", "spinfrapkg.json", "spestate.json"].some((m) => existsSync(join(at, m)))) names.add(entry);
    }
  }
  const marketplace = join(repo, ".claude-plugin", "marketplace.json");
  if (existsSync(marketplace)) {
    try {
      const j = JSON.parse(readFileSync(marketplace, "utf8"));
      for (const pl of j.plugins ?? []) if (typeof pl?.name === "string") names.add(pl.name);
    } catch { /* a manifest that does not parse is another check's finding */ }
  }
  return names;
}

/**
 * `04-capabilities/<domain>/<package>/` names a real package, and every real package has one.
 *
 * IT COMPARES FOLDERS TO PACKAGES, and it used to compare `Binds` rows to folders. `E` takes the
 * realization table away, so the claim *this node realizes this construct* is no longer written down
 * anywhere — and it does not need to be. The folder IS the claim: a chapter sits inside the package
 * it describes, so the seat and the code are the same shape or they are not.
 *
 * A BOOK MIRRORS NO PACKAGES. The foundation's capabilities seat is the STANDARD per topic, authored
 * rather than derived, and its folders are areas rather than packages. Judging it this way reported
 * 129 correct constructs as uncovered.
 */
export function capabilityMirror(repo: string, workspace: string): Finding[] {
  const f: Finding[] = [];
  const caps = capabilitiesDir(docsOf(repo));
  if (!existsSync(caps)) return f;
  if (worldOf(caps) === "FOUNDATION") return f;

  const packages = packageIndex(repo);
  if (!packages.size) {
    f.push({ check: "mirror", grade: "SOFT", file: caps,
      message: "nothing in this repository declares a package, so the capabilities seat was compared against nothing — a chapter mirrors the package it describes" });
    return f;
  }

  const mirrored = new Set<string>();
  for (const domain of readdirSync(caps)) {
    const domainDir = join(caps, domain);
    try { if (!statSync(domainDir).isDirectory()) continue; } catch { continue; }
    for (const entry of readdirSync(domainDir)) {
      const at = join(domainDir, entry);
      try { if (!statSync(at).isDirectory()) continue; } catch { continue; }
      if (packages.has(entry)) { mirrored.add(entry); continue; }
      f.push({ check: "mirror", grade: "SOFT", file: at,
        message: `\`${entry}\` is a folder of the capabilities seat and no package of this repository is called that — a chapter sits inside the package it describes (Q130)` });
    }
  }
  for (const name of [...packages].sort())
    if (!mirrored.has(name))
      f.push({ check: "mirror", grade: "SOFT", file: caps,
        message: `\`${name}\` declares itself a package and \`${SEAT.capabilities}/\` carries no folder for it — either it realizes a construct nobody wrote down, or it is a package nobody documented (${relative(workspace, repo)})` });
  return f;
}

/**
 * A persona as the join compares it — the actor, with the article and the formatting off.
 *
 * `Service app` in the personas table and `a service app` in a `Who` cell are the same person, and
 * the two repositories that write them differently are each internally consistent. So a leading
 * article comes off, the formatting comes off, and the rest must match WHOLE. **No substring**: that
 * looseness is exactly what the retired `Node` resolver did, and a `Who` of *a module* would have
 * matched a persona called *a module service* without anybody being told.
 */
export function personaKey(value: string): string {
  return value.replace(/[`*]/g, "").replace(/^(?:a|an|the)\s+/i, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Every actor the personas table names, keyed for comparison, with the spelling it used. */
export function personasIn(file: string): Map<string, string> {
  const out = new Map<string, string>();
  let head: string[] | null = null;
  for (const raw of outsideFences(readFileSync(file, "utf8")).split("\n")) {
    const t = raw.trim();
    if (!(t.startsWith("|") && t.endsWith("|") && t.length > 2)) { head = null; continue; }
    const cells = t.slice(1, -1).split("|").map((c) => c.trim());
    if (/^[\s:|-]*$/.test(cells.join(""))) continue;
    if (!head) { head = cells.map((c) => c.toLowerCase()); continue; }
    // THE TABLE IS FOUND BY ITS OWN FIRST COLUMN. A personas page also carries explanatory tables,
    // and reading every table's first cell as an actor indexed prose as people.
    if (head[0] !== "actor" && head[0] !== "persona") continue;
    const shown = cells[0].replace(/[`*]/g, "").trim();
    if (shown) out.set(personaKey(shown), shown);
  }
  return out;
}

/**
 * Every `Who` resolves to the personas table, and every persona is named by a row.
 *
 * The rule is `02-document.md`'s — *every `Who` resolves to one personas table, in the behaviors
 * seat's face, and a persona is invented nowhere else*. It is anchored to the CELL, so a seat whose
 * rows carry no `Who` owes no personas table: `spn-infra` and `spn-support-infra` write their rows as
 * `Observably · Where · Because`, with neither an id nor an actor, and there is nothing to compare.
 *
 * Both directions, because each is invisible to the other. A `Who` nobody declared is a person
 * invented in a row; a persona no row names is a person the seat promises nothing to.
 */
export function personaCoverage(repo: string): Finding[] {
  const f: Finding[] = [];
  const behaviors = behaviorsDir(docsOf(repo));
  if (!existsSync(behaviors)) return f;

  const used = new Map<string, { shown: string; file: string }>();
  for (const file of walkFiles(behaviors, (p) => p.endsWith(".md") && isTopicFile(p))) {
    for (const who of behaviourRows(file).map((r) => r.who)) {
      const key = personaKey(who);
      if (key && !used.has(key)) used.set(key, { shown: who.replace(/[`*]/g, "").trim(), file });
    }
  }

  const table = join(behaviors, "personas.md");
  if (!existsSync(table)) {
    if (used.size)
      f.push({ check: "personas", grade: "SOFT", file: behaviors,
        message: `${used.size} \`Who\` cell${used.size > 1 ? "s" : ""} name a person and there is no \`personas.md\` beside the rows — every \`Who\` resolves to one personas table, in the behaviors seat's face (02-document.md)` });
    else
      f.push({ check: "personas", grade: "SOFT", file: behaviors,
        message: "no `personas.md` and no row carrying a `Who`, so nothing was compared — this seat's rows are written without an actor" });
    return f;
  }

  const declared = personasIn(table);
  if (!declared.size) {
    f.push({ check: "personas", grade: "SOFT", file: table,
      message: "`personas.md` is here and its table declares no actor, so nothing was compared — the first column is `Actor`" });
    return f;
  }
  for (const [key, { shown, file }] of used)
    if (!declared.has(key))
      f.push({ check: "personas", grade: "SOFT", file,
        message: `\`${shown}\` is a \`Who\` and \`personas.md\` declares no such actor — a persona is invented nowhere else (02-document.md)` });
  for (const [key, shown] of declared)
    if (!used.has(key))
      f.push({ check: "personas", grade: "SOFT", file: table,
        message: `\`${shown}\` is declared as a persona and no behaviour row names it — a persona is somebody the rows promise an outcome` });
  return f;
}

/**
 * The three halves of *the capabilities seat mirrors the code*, plus the two seats' own pairing.
 *
 * They run together because each alone is satisfiable by doing nothing. A check that every chapter
 * names a package passes on an empty seat; a check that every package has a chapter passes on a
 * repository with no packages. Only together do they say the seat and the code are the same shape.
 */
export function parityCheck(repo: string, workspace: string): Finding[] {
  return [...pathParity(repo), ...capabilityMirror(repo, workspace), ...personaCoverage(repo)];
}

// ---------------------------------------------------------------------------- the gap scan

/**
 * One report per repository, written into its own pocket — which is where the standard puts a
 * measurement, and why a stale one is safe to leave standing.
 *
 * IT EDITS NOTHING IT MEASURES. A scan that fixes as it goes cannot be trusted as a measure, and
 * that is the whole reason this is an audit of its own rather than a flag on `face`.
 *
 * **It says what it does not measure.** Three of the nine prose faults cannot be told from good
 * prose by a pattern; a construct nobody has written cannot be counted against a list nobody has
 * written either; and the symbol index is a per-package build this cannot run. Each is named in the
 * report rather than left to look like a zero.
 */
export function gapReport(repo: string, workspace: string, asJson: boolean): number {
  const tree = join(repo, "docs");
  if (!existsSync(tree)) { console.error(`${relative(workspace, repo)} has no docs/ tree`); return 2; }
  const name = basename(resolve(repo));
  const at = measuredNow();

  const seats = SEATS;
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
  const constructsSeat = constructsDir(tree);
  const domainRows = constructFolders(constructsSeat).filter((d) => !isGroup(d)).map((dir) => {
    const key = [...sections.keys()].find((k) => k === folderKey(basename(dir)));
    return {
      domain: relative(constructsSeat, dir),
      named: Boolean(key),
      has: walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md").length,
      owed: key ? sections.get(key)!.lines.length : 0,
    };
  });

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
    for (const [text, sents, section] of blocks) if (Object.keys(proseScore(text, sents, section)).length) flagged += 1;
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
    `  "generatedAt": "${at}",`,
    `  "summary": "What this repository's corpus looks like on ${at}, measured against the landed standard — its seats, what each domain owes, the pages off the standard, and the paragraphs a language pass would read."`,
    "}",
    "-->",
    "",
    `# Docs Audit — ${name}`,
    "",
    // A report is a snapshot and carries no status (RD.DEVEX.WORKSPACE.192).
    "`For: Architect · Editor`",
    "",
    `Measured ${at}. **Nothing here was fixed while it was counted** — a scan that edits as it goes cannot be trusted as a measure, so this audit writes one file and touches nothing else.`,
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
    row(["Comments owed per package", "the symbol index is a per-package build this audit does not run", "`spnutils apps gen-symbols <package>`"]),
    row(["Whether a written construct is TRUE", "a count cannot read", "the two-per-wave read"]),
    row(["The constructs a concept has not listed", "see the note above", "`docs.ts face`, once the constructs exist"]),
    "",
  ].join("\n");

  // THE MEASUREMENT GOES TO THE CALLER, NEVER INTO A DEVELOPER'S POCKET (RD.DEVEX.WORKSPACE.149). A report is
  // written by the agent from what it read; a tool that holds a measurement the agent needs hands it
  // over on standard output. Writing one here made this the only machine-authored file in a folder
  // of authored pages, and it regenerated on every run whether anybody had asked for it or not.
  if (asJson) {
    console.log(JSON.stringify({
      repo: name,
      measuredAt: at,
      seats: seatRows,
      nodeTrees: strays,
      domains: domainRows,
      pageFindings: findings,
      proseCandidates: { total: totalFlagged, files: prose.length },
    }, null, 2));
    return 0;
  }
  console.log(body);
  console.error(`  seats ${seatRows.filter((r) => r.present).length}/5 · node trees ${strays.length} · domains ${domainRows.length}` +
    ` · constructs ${domainRows.reduce((n, d) => n + d.has, 0)}` +
    ` · page findings ${findings.length} · prose candidates ${totalFlagged} in ${prose.length} file(s)`);
  return 0;
}

// ---------------------------------------------------------------------------- the command

/**
 * A link is opened, rather than merely written.
 *
 * TWELVE LINKS NAMING A FOLDER `N13` DELETED SURVIVED A CORPUS REPORTING 0 RULE. Every check here
 * asks whether a document is well-formed, and a link that resolves nowhere is perfectly well-formed
 * — so a page could name a path that had not existed for days and nothing said so. Two of those
 * links sat on pages a reader opens.
 *
 * What it reads is a RELATIVE link to a file: markdown `](path)` and HTML `href="path"`. An absolute
 * URL belongs to somebody else's server, a root-relative path belongs to a rendering this corpus
 * does not control, and a bare `#fragment` names this page. A `path#anchor` is checked as its path,
 * because the anchor is a heading and headings move for good reasons.
 *
 * TEMPLATES ARE SKIPPED, and the reason is not convenience. A template's links are placeholders —
 * `{{path}}.md` is the shape a produced page fills in — so reading them as paths reports the
 * template for being a template.
 */
/**
 * An HTML page links the HTML page (Q234).
 *
 * MEASURED BEFORE IT WAS WRITTEN: of the links the 39 overviews make into a construct, 155 reached
 * the produced page and 102 reached the markdown seat, with 20 of the 39 carrying both — one page
 * doing it inside a single section. A reader of the rendered corpus who follows a `.md` link leaves
 * it: they land on raw markdown rather than on the page with its rail, its figures and its
 * furniture.
 *
 * A SEAT README IS NOT A CONSTRUCT AND KEEPS ITS `.md`. The constructs seat's own face, an area's
 * and a domain's are produced as no page at all, so a link to one has nowhere else to go — which is
 * why this tests for a construct FILE rather than for the folder.
 */
export function checkConstructLink(file: string, src: string): Finding[] {
  if (!file.endsWith(".html")) return [];
  const f: Finding[] = [];
  const seen = new Set<string>();
  for (const m of src.matchAll(new RegExp(`href="([^"]*\\/${SEAT.constructs}\\/[^"]*\\.md)"`, "g"))) {
    const href = m[1];
    if (basename(href.split("#")[0]) === "README.md") continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const page = basename(href).replace(/\.md(#.*)?$/, "-construct.html");
    f.push({ check: "link", grade: "RULE", file, message:
      "names the seat `" + href + "` — an HTML page links the HTML page, and this construct is produced as `" +
      page + "`. A reader following it leaves the rendering" });
  }
  return f;
}

export function checkLinks(file: string, src: string): Finding[] {
  if (inTemplates(file)) return [];
  const f: Finding[] = [];
  const here = dirname(file);
  const seen = new Set<string>();
  // A fenced block is a SAMPLE, and a page teaching link syntax writes one on purpose. Reading it as
  // a path reports the page for explaining itself. No corpus page carries that shape today, which is
  // exactly why it is handled now rather than after somebody writes one and is told they are wrong.
  const prose = outsideFences(src).replace(/<pre\b[\s\S]*?<\/pre>/gi, (m) => m.replace(/[^\n]/g, " "));
  const targets = [
    ...[...prose.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ...[...prose.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const raw of targets) {
    const target = raw.split("#")[0].trim();
    if (!target) continue;                                    // a fragment names this page
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;        // http, mailto, data, anything scheme-led
    if (target.startsWith("/")) continue;                     // a rendering this corpus does not control
    if (target.includes("{{")) continue;                      // a placeholder, not a path
    if (seen.has(target)) continue;
    seen.add(target);
    if (!existsSync(resolve(here, target)))
      f.push({ check: "link", grade: "RULE", file,
        message: `names \`${target}\`, and nothing is there — a link is a promise that a reader can follow it` });
  }
  return f;
}

/**
 * Whether the audit reads a path as a page. Three kinds of file are not pages. A file under a
 * workstream's `samples/` is a real file of the kind the work produces, in its own format. A template,
 * which is any file under `templates/` or one named `<name>-template.<ext>`, carries placeholders
 * where a page carries its content. A bundled copy, `<page>.bundled.html`, is a page with its styles
 * inside it, written to be published, and the page it copies is the one the tree holds.
 */
export function isAuditedPage(path: string): boolean {
  const norm = path.replace(/\\/g, "/");
  if (inTemplates(norm) || /-template\.[a-z]+$/i.test(basename(norm))) return false;
  if (norm.endsWith(BUNDLED_SUFFIX)) return false;
  const workstream = workstreamDirOf(norm);
  if (workstream && norm.slice(workstream.folder.length).split("/").includes("samples")) return false;
  return true;
}

export function audit(paths: string[], workspace: string): Finding[] {
  const findings: Finding[] = [];
  const blocks = new Map<string, any>();
  const sources = new Map<string, string>();
  // Read once for the whole run. Per page this would walk every repository's source once per
  // chapter, and the corpus is 339 of them.
  const { enums: realized, shapes } = sourceDeclarations(workspace);
  const templates = process.env.SPN_TEMPLATES
    ?? bookTemplatesDir(join(workspace, "spn-foundation"));
  for (const p of paths) {
    if (!isAuditedPage(p)) continue;
    const src = readFileSync(p, "utf8");
    const { block, error } = readBlock(src);
    blocks.set(p, block);
    sources.set(p, src);
    findings.push(...checkBlock(p, src, block, error));
    if (!block) continue;
    findings.push(...checkOutline(p, src, block));
    findings.push(...checkRealizationFile(p, src, block));
    findings.push(...checkGeneratedColumns(p, src));
    findings.push(...checkHeader(p, src, block));
    findings.push(...checkCards(p, src, block));
    findings.push(...checkCodeFigures(p, src, workspace));
    findings.push(...checkTreeFigures(p, src, workspace));
    findings.push(...checkStyleBalance(p, src));
    findings.push(...checkLinks(p, src));
    findings.push(...checkConstructLink(p, src));
    findings.push(...checkFurniture(p, src));
    findings.push(...checkGovernsMap(p, src));
    findings.push(...checkProof(p, src));
    findings.push(...checkBinds(p, src, block));
    findings.push(...checkOverviewSource(p, src, block, workspace));
    findings.push(...checkProduced(p, src, block, workspace, templates));
    findings.push(...checkVocabulary(p, src, realized));
    // THE STATUS CHECK, WITH ITS WRITE TURNED OFF. A construct whose status differs from what its
    // behaviour rows derive is an audit finding, and the seat file is left as it is. Only that
    // refusal is taken: a construct with no behaviours file is the parity check's to report, and a
    // FOUNDATION construct that still carries the word is the status command's own.
    if (block.variant === "construct" && p.endsWith(".md"))
      findings.push(...statusFor(p, workspace, false, () => {}).filter((found) => found.grade === "RULE"));
  }
  findings.push(...checkDepends(paths, blocks));
  findings.push(...checkVocabularyCoverage(paths, sources, shapes));
  return findings;
}

/** `SPN_WORKSPACE`, or the nearest holder of `spn-foundation/`/`.spndevex/` above cwd — computed once per run, the same way every action needs it. */
export function resolveWorkspace(): string {
  return process.env.SPN_WORKSPACE ?? workspaceRoot(process.cwd());
}
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
export function workspaceRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, "spn-foundation")) || existsSync(join(dir, ".spndevex"))) return dir;
    const up = dirname(dir);
    if (up === dir) return resolve(from);
    dir = up;
  }
}

/**
 * A path is a file or a folder, for `status` and `page` exactly as for `audit`. Given a folder each
 * of these reads the directory itself rather than dying on `EISDIR` with a raw stack trace. A folder
 * means every seat file under it — markdown only, because these two act on the file an author writes
 * rather than on the page produced from it. Shared by `page.ts` and `status.ts`.
 */
export const seatPaths = (args: string[]): string[] =>
  args.filter((r) => !r.startsWith("--")).flatMap((p) => {
    const full = resolve(p);
    let st; try { st = statSync(full); } catch { return [full]; }
    return st.isDirectory() ? walkFiles(full, (f) => f.endsWith(".md") && basename(f) !== "README.md") : [full];
  });
