#!/usr/bin/env node
// RESTATES: spn-foundation docs/03-capabilities/05-docs/03-tree.md · 05-artifacts.md · 02-document.md
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
//
// Grades, per the N2 arc: RULE refuses, SOFT reports. N7 flips the SOFTs.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, basename, relative } from "node:path";
import { renderPage } from "./render.ts";

type Grade = "RULE" | "SOFT";
type Finding = { check: string; grade: Grade; file: string; message: string };

const VARIANTS = ["approach", "overview", "construct", "behaviors", "report"] as const;
type Variant = (typeof VARIANTS)[number];

/** The lens register, as the document chapter's table renders each value for a reader. */
const LENS_LABEL: Record<string, string> = {
  LEAD: "Engineering leader", BUSINESS: "Business manager", PRODUCT: "Product manager",
  ARCHITECT: "Architect", SERVER_DEV: "Backend developer", WEB_DEV: "Web developer",
  QA: "Quality engineer", INFRA: "DevOps / SRE", TRUST: "DevSecOps / Security",
  PARTNER: "Partner / integrator", VOICE: "Editor",
};

const STATUS_WORD: Record<string, string> = { PLANNING: "PLANNING", IMPLEMENTING: "IMPLEMENTING", DONE: "DONE" };

/** The fixed outlines. A construct's Terms and an approach's Terms are the only optional sections. */
const OUTLINE: Partial<Record<Variant, { required: string[]; optional: string[] }>> = {
  construct: {
    required: ["Boundary", "Model", "Parts", "Relations", "Binds", "Proof"],
    optional: ["Terms"],
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

function readBlock(src: string): { block: any | null; error: string | null } {
  const m = src.match(/<!--\s*spn:doc\s*([\s\S]*?)-->/);
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

  // An overview describes; it has no status. Every other page kind carries one.
  if (variant === "overview") {
    if ("status" in block) add("RULE", "an overview carries no `status` — a face is either current or a defect");
  } else if (!(block.status in STATUS_WORD)) {
    add("RULE", "`status` must be PLANNING · IMPLEMENTING · DONE");
  }

  if (variant === "construct") {
    if (!block.parentId) add("RULE", "a construct names the outline it belongs to in `parentId`");
    if (!Array.isArray(block.dependsOn)) add("SOFT", "a construct declares `dependsOn`, even as an empty list");
  }
  if ("keywords" in block && (!Array.isArray(block.keywords) || block.keywords.length < 1))
    add("SOFT", "`keywords` is present but carries nothing");
  return f;
}

function checkOutline(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const variant: Variant | undefined = block?.variant;
  const spec = variant ? OUTLINE[variant] : undefined;
  const got = headings(src, "h2").map(sectionName);
  if (!spec) return f;

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

function checkHeader(file: string, src: string, block: any): Finding[] {
  const f: Finding[] = [];
  const add = (grade: Grade, message: string) => f.push({ check: "header", grade, file, message });
  if (!block) return f;
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
  const openSec = src.match(/<section id="s4"[\s\S]*?<\/section>/);
  if (openSec) {
    for (const body of openSec[0].matchAll(/<div class="open">([\s\S]*?)(?=<div class="open">|<\/section>)/g)) {
      const num = body[1].match(/<h4 id="(q\d+)"/i)?.[1]?.toUpperCase();
      if (num && /<b>\s*Decision/i.test(body[1]))
        f.push({ check: "cards", grade: "RULE", file, message: `${num} is answered and still sits in \`Open\`; fold it into the section that now states it` });
    }
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
  const i = src.search(/<h2[^>]*>\s*Proof\b/);
  if (i < 0) return f;
  const seg = src.slice(i);
  const rows = [...seg.matchAll(/<tr><td>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]));
  if (!rows.length) return f;
  const installable = /^(spnutils\b|pnpm test|pnpm test:|npx nx\b|node .*\.ts\b)|\.py\b|\bguard\b|\bgate\b/;
  for (const r of rows) {
    if (!r) continue;
    if (/^pnpm task:/.test(r))
      f.push({ check: "proof", grade: "SOFT", file, message: `\`${r}\` is not installable — a \`pnpm task:*\` script is a repository's own, so a partner cannot run it. It is accepted only while no verb exists` });
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
      } catch { /* a manifest that does not parse is another check's finding */ }
    }
  };
  walk(workspace, 0);
  return names;
}

function checkBinds(file: string, src: string, block: any, nodes: Set<string>): Finding[] {
  const f: Finding[] = [];
  if (block?.variant !== "construct") return f;
  const i = src.search(/<h2[^>]*>\s*Binds\b/);
  const j = src.search(/<h2[^>]*>\s*Proof\b/);
  if (i < 0) return f;
  const seg = src.slice(i, j > i ? j : undefined);
  const tables = [...seg.matchAll(/<table>[\s\S]*?<\/table>/g)].map((m) => m[0]);
  if (tables.length < 2) {
    f.push({ check: "binds", grade: "RULE", file, message: `Binds carries ${tables.length} table${tables.length === 1 ? "" : "s"}; it is two — the rules that hold it, and where it lives today` });
    return f;
  }
  const rows = [...tables[tables.length - 1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1]))
    .filter((cells) => cells.length >= 4);
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
    const proof = src.slice(j < 0 ? 0 : j);
    if (j < 0 || !/<tr><td>/.test(proof))
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
  const got = headings(src, "h2").map(sectionName);

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
  const source = readFileSync(concept, "utf8")
    .split("\n").filter((l) => /^## /.test(l))
    .map((l) => sectionName(l.replace(/^##\s*/, "").replace(/`[^`]*`/g, "").trim()));
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

/** A capability face's Map: one row per mirror beside it, each governing the src folder it is named for. */
function buildMap(faceFile: string): { body: string; findings: Finding[] } {
  const findings: Finding[] = [];
  const dir = dirname(faceFile);
  const mirrors = walkFiles(dir, (p) => p.endsWith(".md") && basename(p) !== "README.md" && basename(p) !== "data-model.md")
    .sort((a, b) => a.localeCompare(b));
  const glyph: Record<string, string> = { DONE: "✅", IMPLEMENTING: "🚧", PLANNING: "🔮" };
  const lines = ["| File | Governs | Carries | Status |", "| --- | --- | --- | --- |"];
  for (const m of mirrors) {
    const rel = relative(dir, m);
    const { block } = readBlock(readFileSync(m, "utf8"));
    if (!block) { findings.push({ check: "face", grade: "RULE", file: m, message: "a mirror with no `spn:doc` block cannot be put in the Map" }); continue; }
    // The mirror is named for the folder it governs, so the path is the derivation.
    const governs = `src/${rel.replace(/\.md$/, "")}/`;
    lines.push(`| [${rel}](${rel}) | \`${governs}\` | ${block.summary} | ${glyph[block.status] ?? "🔮"} |`);
  }
  if (mirrors.length === 0) lines.push("| — | — | this layer carries no mirror yet | 🔮 |");
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
  const flush = () => { if (name) out.set(name, { bridge: bridge.join(" ").trim(), lines: items }); };
  for (const l of lines) {
    if (/^##\s/.test(l)) { flush(); name = l.replace(/^##\s*/, "").trim(); bridge = []; items = []; continue; }
    if (name === null) continue;
    if (/^[-*]\s/.test(l)) { items.push(l.replace(/^[-*]\s*/, "")); continue; }
    if (l.trim() && !items.length) bridge.push(l.trim());
  }
  flush();
  return out;
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

function domainFaces(tree: string, concept: string | null): { faces: Map<string, string>; concept: string | null; findings: Finding[] } {
  const findings: Finding[] = [];
  const faces = new Map<string, string>();
  const sections = concept ? conceptSections(concept) : new Map();

  const constructsDir = join(tree, "02-constructs");
  const domains = (() => { try { return readdirSync(constructsDir).filter((d) => statSync(join(constructsDir, d)).isDirectory()); } catch { return []; } })();

  const all: { id: string; title: string; summary: string; deps: string[]; file: string; domain: string }[] = [];
  for (const d of domains) {
    for (const f of walkFiles(join(constructsDir, d), (p) => p.endsWith(".md") && basename(p) !== "README.md")) {
      const { block } = readBlock(readFileSync(f, "utf8"));
      if (!block) continue;
      all.push({ id: block.id, title: block.title, summary: block.summary, deps: block.dependsOn ?? [], file: f, domain: d });
    }
  }

  for (const d of domains) {
    const mine = readingOrder(all.filter((c) => c.domain === d));
    // The concept names the group; a domain folder the concept does not name is invariant 1's finding.
    const label = d.replace(/^\d+-/, "");
    const key = [...sections.keys()].find((k) => k.toLowerCase() === label.toLowerCase());
    if (!key && concept) findings.push({ check: "face", grade: "RULE", file: join(constructsDir, d), message: `the concept names no section \`${label}\`, and a domain folder exists only where the concept names that domain (invariant 1)` });
    const bridge = key ? sections.get(key)!.bridge : "";
    const body = [bridge, "", "| Construct | What it is |", "| --- | --- |",
      ...mine.map((c) => `| [${c.title}](${relative(join(constructsDir, d), c.file)}) | ${c.summary} |`)]
      .filter((l, i) => !(i === 0 && !l)).join("\n");
    faces.set(join(constructsDir, d, "README.md"), body);
  }

  // The concept's own line per construct, from each summary.
  let conceptBody: string | null = null;
  if (concept) {
    // The concept names the group, so the heading is its own section name and never the folder slug.
    const byDomain = new Map<string, typeof all>();
    for (const c of all) {
      const label = c.domain.replace(/^\d+-/, "");
      const k = [...sections.keys()].find((x) => x.toLowerCase() === label.toLowerCase()) ?? label;
      byDomain.set(k, [...(byDomain.get(k) ?? []), c]);
    }
    const out: string[] = [];
    for (const [k, cs] of [...byDomain].sort()) {
      out.push(`**${k}**`, "");
      for (const c of readingOrder(cs)) out.push(`- **${c.title}** — ${c.summary}`);
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

  for (const faceFile of walkFiles(join(tree, "04-capabilities"), (p) => basename(p) === "README.md")) {
    const { body, findings: mf } = buildMap(faceFile);
    findings.push(...mf);
    const before = readFileSync(faceFile, "utf8");
    const after = replaceRegion(before, "map", body);
    if (after !== before) { if (write) writeFileSync(faceFile, after); touched.push(relative(tree, faceFile)); }
  }

  console.log(touched.length
    ? `${write ? "wrote" : "would write"} ${touched.length} face${touched.length > 1 ? "s" : ""}:\n  ${touched.join("\n  ")}`
    : "every face is already current");
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

/** The furniture: one stylesheet and one pair of rail scripts, taken from the template. */
function furniture(templates: string): { style: string; scripts: string; footer: string } {
  const t = readFileSync(join(templates, "pages", "construct-template.html"), "utf8");
  const styles = [...t.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]);
  const scripts = [...t.matchAll(/<script>[\s\S]*?<\/script>/g)].map((m) => m[0]);
  const foldStyle = styles.slice(1).join("\n\n");
  const footer = t.match(/<footer>[\s\S]*?<\/footer>/)?.[0] ?? "<footer></footer>";
  return {
    style: styles[0] ?? "",
    scripts: [scripts[0] ?? "", foldStyle, scripts[1] ?? ""].filter(Boolean).join("\n\n"),
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

function pageFor(seat: string, workspace: string, templates: string, write: boolean): Finding[] {
  const findings: Finding[] = [];
  const src = readFileSync(seat, "utf8");
  const { block, error } = readBlock(src);
  if (!block) { findings.push({ check: "page", grade: "RULE", file: seat, message: error ?? "no spn:doc block" }); return findings; }

  const markdown = src.replace(/<!--\s*spn:doc[\s\S]*?-->\n?/, "");
  const org = process.env.SPN_ORG ?? "SaaS Plane";
  const location = process.env.SPN_LOCATION ?? locationOf(seat, workspace);
  if (location === "—")
    findings.push({ check: "page", grade: "SOFT", file: seat, message: "no manifest above this file declares a `name`, so the header's location reads `—` (Q79 puts `name` on the manifests)" });

  const { html, findings: rf } = renderPage({ block, markdown, workspace: org, location, furniture: furniture(templates) });
  for (const r of rf) findings.push({ check: "page", grade: "RULE", file: seat, message: r.message });

  // The page sits beside its seat file, in the pocket that mirrors the seat folder for folder.
  const out = seat.replace(/\/02-constructs\//, "/artifacts/constructs/").replace(/\.md$/, "-construct.html");
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

// ---------------------------------------------------------------------------- the command

function audit(paths: string[], workspace: string): Finding[] {
  const findings: Finding[] = [];
  const blocks = new Map<string, any>();
  const nodes = nodeIndex(workspace);
  const templates = process.env.SPN_TEMPLATES
    ?? join(workspace, "spn-foundation", "docs", "03-capabilities", "05-docs", "templates");
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
const workspace = process.env.SPN_WORKSPACE ?? process.cwd();

if (cmd === "face") {
  const tree = resolve(rest.find((r) => !r.startsWith("--")) ?? ".");
  const f = face(tree, !rest.includes("--check"));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd === "status") {
  const nodes = nodeIndex(resolve(workspace));
  const check = rest.includes("--check");
  const seats = rest.filter((r) => !r.startsWith("--")).map((p) => resolve(p));
  const f = seats.flatMap((p) => statusFor(p, resolve(workspace), nodes, !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd === "page") {
  const templates = process.env.SPN_TEMPLATES
    ?? join(resolve(workspace), "spn-foundation", "docs", "03-capabilities", "05-docs", "templates");
  const check = rest.includes("--check");
  const seats = rest.filter((r) => !r.startsWith("--")).map((p) => resolve(p));
  const f = seats.flatMap((p) => pageFor(p, resolve(workspace), templates, !check));
  for (const x of f) console.log(`${x.grade === "RULE" ? "✗" : "!"} ${x.grade.padEnd(4)} ${x.check.padEnd(9)} ${relative(workspace, x.file)}\n         ${x.message}`);
  process.exit(f.some((x) => x.grade === "RULE") ? 1 : 0);
}

if (cmd !== "audit" || rest.length === 0) {
  console.error("usage: node docs.ts audit <path…> | face <tree> | page <seat.md…> | status <seat.md…>   (--check reports without writing)");
  process.exit(2);
}

const found = audit(rest.map((p) => resolve(p)), resolve(workspace));
const rule = found.filter((f) => f.grade === "RULE");
for (const f of found) console.log(`${f.grade === "RULE" ? "✗" : "!"} ${f.grade.padEnd(4)} ${f.check.padEnd(9)} ${relative(workspace, f.file)}\n         ${f.message}`);
console.log(found.length
  ? `\n${found.length} finding${found.length > 1 ? "s" : ""} — ${rule.length} RULE, ${found.length - rule.length} SOFT, over ${rest.length} page${rest.length > 1 ? "s" : ""}`
  : `\nclean — ${rest.length} page${rest.length > 1 ? "s" : ""}`);
process.exit(rule.length ? 1 : 0);
