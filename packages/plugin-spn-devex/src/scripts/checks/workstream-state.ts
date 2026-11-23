// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is cut by what is reviewed and released together, and named for its domain · § The folder · § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs · § Open and backlog workstreams follow the standard as it moves · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's · § After `How` comes a section of its own, Plan (RULE.DEVEX.WORKSPACE.487)
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// `workstream state check`, as a function: whether each open and backlog workstream is whole. The
// command prints it, and the Stop hook refuses to end a turn while it fails for this window's work.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cardsDiffer, openWithoutCard } from "./questions.ts";
import { TERMINAL } from "./arc-status.ts";
import { pageRulesOnDisk, unfilledPage } from "./doc-check.ts";
import { cyclesOf, headerStatusRule, tableStatuses } from "../commands/docs/cycles.ts";
import { isDir, isFile, listdir } from "../lib/payload.ts";
import { linksSharedStyles } from "../../../../plugin-support-lib/src/lib/page-styles.ts";
import {
  DATA_FILES, FACTS_FILE, findingsFileOf, SHEET_FILE, LOG_FILE, NOTES, ARC_FILE, PREVIEW_FILE, arcPageNameOf, approachOf, arcStatus, stepsMayStart, arcDataDir, arcIdsOf, factsFileOf, sheetFileOf, readSheet, firstOpenArc, leafRows, isDataLayout, logFileOf, markdownArcsOf,
  NO_REPO, arcStamp, markdownIn, nameFileHolds, nameFileOf, notesDirOf, previewOf, questionsFileOf, readJsonl, readQuestions, stampsOn, stateFileOf,
  strayLevels, strayNotes, suggestionsFileOf, readJson, readArc, workstreamsOf, previewWithStatus, builtOf,
  holdsArcEntries, localLinks, planRowOf, previewHrefOf, previewOwners, slotsIn, whatEntryOf, whatId, whatRange, workstreamName,
} from "../lib/workstream.ts";
import { ARC_ID, WORK, DONE_STATES, arcFaults, factFaults, findingFaults, type Finding as ReviewFinding, sheetFaults, logFaults, questionFaults, cardName, subjectFault, suggestionFaults, type ArcData, type ArcRow, type Fact } from "../lib/workstream-schema.ts";

export type Finding = { workstream: string; arc: string | null; check: string; message: string };

/** The part of a page under its `h2` named `name`, to the next `h2`. Empty where it has none. */
export function sectionText(text: string, name: string): string {
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  const heading = new RegExp(`<h2\\b[^>]*>\\s*${name}\\b[\\s\\S]*?</h2>`, "i").exec(text);
  if (!heading) return "";
  const rest = text.slice(heading.index + heading[0].length);
  const next = rest.search(/<h2\b/i);
  return next < 0 ? rest : rest.slice(0, next);
}

/** Every file under a folder, as paths from it. */
function filesUnder(dir: string, base = dir): string[] {
  return listdir(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return isDir(path) ? filesUnder(path, base) : [relative(base, path).split("\\").join("/")];
  });
}

/**
 * A surface page: a page whose `spn:doc` variant is `surface-page` (or `surface-page-preview`, as the pages written before it) (RULE.DEVEX.WORKSPACE.534). It is the work's page
 * for one surface page, a viewer for the copy beside it, and never an arc's preview.
 */
export function isSurfacePagePreview(path: string): boolean {
  try { return /<!--\s*spn:doc[\s\S]*?"variant"\s*:\s*"surface-page(?:-preview)?"/.test(readFileSync(path, "utf8")); } catch { return false; }
}

/**
 * Q99: at most one preview per arc, by its fixed name, and no `previews/` folder. A file under `samples/` is a sample, never a preview: a
 * template copy named `arc-template.html` there is read by the sample check, not this one. That every arc has its one
 * is `arcPreviewFindings`' (RULE.DEVEX.WORKSPACE.254).
 */
export function previewFindings(ws: string, arc: string): string[] {
  const out: string[] = [];
  const notes = notesDirOf(ws, arc);
  if (isDir(join(notes, "previews"))) out.push(`${arc} keeps a \`previews/\` folder — an arc's one page is \`${NOTES}/${arc}/${ARC_FILE}\``);
  for (const [base, under] of [[notes, `${NOTES}/${arc}`], [join(ws, "arcs", arc), `arcs/${arc}`]] as const)
    for (const file of filesUnder(base))
      if (/preview[^/]*\.html$/i.test(file) && !(base === notes && (file === ARC_FILE || file === PREVIEW_FILE)) && !(base === notes && file.startsWith("samples/")) && !isSurfacePagePreview(join(base, file)))
        out.push(`\`${under}/${file}\` is a second preview — an arc has at most one page, \`${NOTES}/${arc}/${ARC_FILE}\``);
  return out;
}

/** The kinds of page the book has. A sample whose masthead names one is a page of the book the work produces. */
export const BOOK_PAGE_KINDS: readonly string[] = ["approach", "preview", "arc", "construct", "overview", "report", "guide", "index", "hub", "page"];

/** A review copy of one of the book's templates, named for it: `blocks-template.html`, `approach-template-v2.html`. */
const TEMPLATE_COPY = /-template(?:-[^/.]+)?\.html?$/i;

/** The page kind a page says it is: its `spn:doc` block's `variant`, else its masthead's `Type`, lowercased; "" where it says none. */
function pageKind(text: string): string {
  const variant = /<!--\s*spn:doc[\s\S]*?"variant"\s*:\s*"([^"]+)"/.exec(text)?.[1];
  const type = /<span class="sds-label">Type:<\/span>\s*<span\b[^>]*class="[^"]*sds-type[^"]*"[^>]*>([^<]*)<\/span>/.exec(text)?.[1];
  return (variant ?? type ?? "").trim().toLowerCase();
}

/**
 * RULE.DEVEX.WORKSPACE.267: a sample is the work's own file, so a page under `samples/` built with the page template —
 * linking the shared docs stylesheet and opening with a masthead — is named. A sample of a page of the book the
 * work produces passes, by the page kind its masthead names, or as a review copy of a book template named for it.
 */
export function sampleFindings(ws: string, arc: string): string[] {
  const samples = join(notesDirOf(ws, arc), "samples");
  const out: string[] = [];
  for (const file of filesUnder(samples).filter((one) => /\.html?$/i.test(one)).sort()) {
    let text = "";
    try { text = readFileSync(join(samples, file), "utf8"); } catch { continue; }
    if (!linksSharedStyles(text) || !/<header\b[^>]*class="[^"]*\bsds-masthead\b/.test(text)) continue;
    if (BOOK_PAGE_KINDS.includes(pageKind(text)) || TEMPLATE_COPY.test(basename(file))) continue;
    out.push(`\`${NOTES}/${arc}/samples/${file}\` is built with the page template, the shared docs stylesheet and a masthead — ` +
      "a sample is the work's own file in its own format, browsed through `samples/index.html`; only a sample of a book page " +
      "the work produces carries a masthead, its `Type` naming the page kind or its name the template it copies");
  }
  return out;
}

/** Every `path` a samples index's `index-data` lists, with the group's `base` put in front where it names one. */
function indexPaths(node: unknown, base: string, out: string[]): void {
  if (Array.isArray(node)) { for (const one of node) indexPaths(one, base, out); return; }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  if (typeof record.path === "string") out.push(base + record.path);
  for (const key of ["groups", "children", "items"]) indexPaths(record[key], base, out);
}

/**
 * RULE.DEVEX.WORKSPACE.560: no page of the work reaches the developer unfilled. A page the work holds, the approach page, an arc's page,
 * and every HTML page a samples index lists, has no `{{…}}` slot left and no section with a heading and nothing under it. A review copy of a
 * template, named `…-template.html`, is a template and is not read.
 */
export function unfilledFindings(file: string, label: string, generated: readonly string[] = []): string[] {
  let text = "";
  try { text = readFileSync(file, "utf8"); } catch { return []; }
  if (TEMPLATE_COPY.test(file)) return [];
  // A section the commands fill from the arcs and the cards (How, Open, Deferred on the approach page) is empty until they have something to write.
  return unfilledPage(file, text).filter(([, message]) => !generated.some((name) => message.startsWith(`the section "${name}" has a heading and nothing under it`)))
    .map(([, message]) => `${label}: ${message}`);
}

/** The pages a samples index lists, as files that exist. */
export function listedSamples(ws: string, arc: string): string[] {
  const dir = join(notesDirOf(ws, arc), "samples");
  let text = "";
  try { text = readFileSync(join(dir, "index.html"), "utf8"); } catch { return []; }
  const json = /<script\b[^>]*\bid="index-data"[^>]*>([\s\S]*?)<\/script>/i.exec(text)?.[1];
  if (!json) return [];
  let data: unknown;
  try { data = JSON.parse(json); } catch { return []; }
  const base = typeof (data as { base?: unknown })?.base === "string" ? (data as { base: string }).base : "";
  const paths: string[] = [];
  indexPaths(data, base, paths);
  return [...new Set(paths)].filter((one) => /\.html?$/i.test(one) && !one.split("/").includes("..")).map((one) => join(dir, one.split("#")[0])).filter((one) => isFile(one));
}

/**
 * RULE.DEVEX.WORKSPACE.267: an arc's samples index lists only what the work produces. An entry whose path leaves
 * `samples/` (a `..` segment) is a view of the work, kept in `work/` and never linked from samples; an entry that is no
 * HTML page is a file the agent manages, kept out of samples.
 */
export function sampleIndexFindings(ws: string, arc: string): string[] {
  let text = "";
  try { text = readFileSync(join(notesDirOf(ws, arc), "samples", "index.html"), "utf8"); } catch { return []; }
  const json = /<script\b[^>]*\bid="index-data"[^>]*>([\s\S]*?)<\/script>/i.exec(text)?.[1];
  if (!json) return [];
  let data: unknown;
  try { data = JSON.parse(json); } catch { return []; }
  const base = typeof (data as { base?: unknown })?.base === "string" ? (data as { base: string }).base : "";
  const paths: string[] = [];
  indexPaths(data, base, paths);
  const out: string[] = [];
  for (const one of paths) {
    if (one.split(/[\\/]/).includes(".."))
      out.push(`${arc}'s samples index lists \`${one}\`: a samples index lists only what the work produces; ${one} is a view of the work, kept in work/ and never linked from samples (rule 267)`);
    else if (!/\.html?$/i.test(one.split(/[?#]/)[0]))
      out.push(`${arc}'s samples index lists \`${one}\`: a samples index shows only pages a reader reviews; ${one} is a file the agent manages, kept out of samples (rule 267)`);
  }
  return out;
}

/**
 * RULE.DEVEX.WORKSPACE.552: an arc whose notes hold `samples/index.html` links it from its preview, so a reviewer
 * opens the built thing without hunting for it. The preview holds a link whose `href` ends in `samples/index.html`.
 */
export function sampleLinkFindings(ws: string, arc: string): string[] {
  if (!isFile(join(notesDirOf(ws, arc), "samples", "index.html"))) return [];
  let text = "";
  try { text = readFileSync(previewOf(ws, arc), "utf8"); } catch { return []; }
  if (/<a\b[^>]*\bhref="[^"]*samples\/index\.html(?:[?#][^"]*)?"/i.test(text)) return [];
  return [`${arc}'s preview does not link its samples: end its Overview with a line that opens samples/index.html (rule 552)`];
}

/**
 * RULE.DEVEX.WORKSPACE.262: an arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/`,
 * `scripts/` and `work/`, and nothing else. Each other entry is named with where it belongs. The `previews/`
 * folder and a second preview are left to the one-preview check, which names them in its own words.
 */
export function notesTreeFindings(ws: string, arc: string): string[] {
  return strayNotes(notesDirOf(ws, arc), true)
    .map(([entry, home]) => `\`${NOTES}/${arc}/${entry}\` is not one of the six entries of an arc's notes folder — it belongs in ${home}`);
}

/** The most words an arc's title may run to: a topic name, with its sentence kept in the goal. */
const TITLE_WORDS_MAX = 5;

/** The arc folder a path inside the workstream's `notes/` sits in, or null where it sits elsewhere. */
const notesFolderOf = (ws: string, path: string): string | null => ARC_ID.exec(relative(join(ws, NOTES), path).split(/[\\/]/)[0])?.[0] ?? null;

/**
 * RULE.DEVEX.WORKSPACE.264 and .265: the arc's goal, its subject's length, and its data folder — the three
 * data files and one name file, which reads as the commands write it from the data.
 */
export function nameFindings(ws: string, arc: string, data: ArcData): string[] {
  const out: string[] = [];
  if (!(typeof data.goal === "string" && data.goal.trim()))
    out.push(`${arc} has no goal — \`spn-devex workstream arc edit ${arc} --goal "…"\`, the outcome once it is done, in a sentence or two`);
  const short = subjectFault(data.subject);
  if (short) out.push(`${arc}'s subject \`${data.subject}\` ${short} — \`spn-devex workstream arc edit ${arc} --subject <short-name>\``);
  const words = typeof data.title === "string" ? data.title.trim().split(/\s+/).filter(Boolean).length : 0;
  if (words > TITLE_WORDS_MAX || (typeof data.title === "string" && data.title.includes(",")))
    out.push(`${arc}'s title \`${data.title}\` ${words > TITLE_WORDS_MAX ? `is ${words} words` : "holds a comma"} — an arc title is a topic name of at most ${TITLE_WORDS_MAX} words and no comma; the sentence goes in the goal, \`spn-devex workstream arc edit ${arc} --title "…"\``);
  const name = `${data.subject}.md`;
  const markdown = markdownIn(ws, arc);
  for (const other of markdown.filter((one) => one !== name))
    out.push(`\`arcs/${arc}/${other}\` is a second Markdown file — an arc's data folder holds one, \`${name}\`, which the commands write`);
  for (const entry of listdir(arcDataDir(ws, arc)).filter((one) => !one.endsWith(".md") && !DATA_FILES.includes(one) && !one.startsWith(".")))
    out.push(`\`arcs/${arc}/${entry}\` is not the arc's data — \`arcs/${arc}/\` holds \`state.json\`, \`log.jsonl\`, \`facts.jsonl\`, \`sheet.json\`, \`patches/\` and \`${name}\``);
  let current: string | null = null;
  try { current = readFileSync(nameFileOf(ws, arc, data.subject), "utf8"); } catch { /* absent */ }
  if (current === null) out.push(`${arc} has no name file \`arcs/${arc}/${name}\` — \`spn-devex docs cycles write\` writes it`);
  else if (!nameFileHolds(ws, data, current))
    out.push(`\`arcs/${arc}/${name}\` is not what the commands write from the data — it is never edited by hand; \`spn-devex docs cycles write\` writes it again`);
  return out;
}

/** The path a preview named by the arc sits at: the fixed place, or where a carried arc's `preview` field names it. */
const previewPathOf = (ws: string, arc: string, data: ArcData): string => resolve(ws, previewHrefOf(arc, data, ws));

/**
 * RULE.DEVEX.WORKSPACE.254: every arc has one preview, written when it opens; an arc's preview names another arc by its What,
 * never by its preview; and once the arc is decided, no slot of the template is left in it.
 */
export function arcPreviewFindings(ws: string, arc: string, data: ArcData, owners: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  const path = previewPathOf(ws, arc, data);
  const href = previewHrefOf(arc, data, ws);
  const number = workstreamName(ws).number;
  const inFolder = notesFolderOf(ws, path);
  if (inFolder && inFolder !== arc)
    out.push(`${arc}'s \`preview\` field names \`${href}\`, ${inFolder}'s folder — an arc's preview sits in its own, \`${NOTES}/${arc}/\``);
  if (!isFile(path)) {
    out.push(`${arc} has no preview — every arc has one, \`${href}\`, written when it opens; \`spn-devex workstream arc edit ${number}/${arc}\` writes it from the template (RULE.DEVEX.WORKSPACE.254)`);
    return out;
  }
  const text = readFileSync(path, "utf8");
  const seen = new Set<string>();
  for (const link of localLinks(text, dirname(path))) {
    const other = owners.get(link.path);
    if (!other || other === arc || seen.has(other)) continue;
    seen.add(other);
    out.push(`${arc}'s preview links \`${link.href}\`, ${other}'s preview — a preview names another arc by its Plan row, \`../../approach.html#${other}\`, and never links its preview`);
  }
  const status = arcStatus(data);
  const slots = slotsIn(text);
  if (slots.length && !["PROPOSED", "CARRIED", "DROPPED"].includes(status))
    out.push(`${arc} is ${status} and its preview still holds ${slots.length} slot(s), \`{{…}}\`, the first at \`${href}:${slots[0].line}\` — a decided arc's preview is filled; a slot is expected only while the arc is PROPOSED`);
  return out;
}

/**
 * The findings line: an arc that is not terminal, holds open findings of a saved review and has a preview with no slot left is named
 * with the open ids and the three ways to answer. An arc with no findings, or with all of them answered, passes, and so does one whose
 * preview still has a slot, because a review is still being read. This is the workstream's own bookkeeping and reads no code.
 */
export function findingsFindings(ws: string, arc: string, data: ArcData): string[] {
  const open = readJsonl(findingsFileOf(ws, arc)).filter((one): one is ReviewFinding => !!one && typeof one === "object" && (one as ReviewFinding).state === "open");
  if (!open.length || TERMINAL.has(arcStatus(data))) return [];
  const preview = previewOf(ws, arc);
  if (!isFile(preview) || slotsIn(readFileSync(preview, "utf8")).length) return [];
  return [`${open.length} review finding${open.length === 1 ? " is" : "s are"} open (${open.map((one) => one.id).join(", ")}): carry each into a sheet entry, decide it on a card, or drop it with a reason, before the preview is shown (\`workstream finding decide\`)`];
}

/**
 * S7: the arc's row in Plan under its address, its stamp against its goal, title and repositories, and the place that links
 * its preview and no other arc's (RULE.DEVEX.WORKSPACE.254): its Plan row, and, on a page written before What was told by
 * construct, its own What entry, `<arc>-what`.
 */
export function pageFindings(ws: string, arc: string, data: ArcData, page: string | null, text: string, owners: ReadonlyMap<string, string> = previewOwners(ws)): string[] {
  if (!page) return [`${arc} has no approach page to stand on`];
  const out: string[] = [];
  const row = stampsOn(text).get(arc);
  if (!row) out.push(`${arc} has no row in Plan carrying \`data-arc="arcs/${arc}/state.json"\``);
  else if (!/\bid="([^"]*)"/.test(row.tag) || /\bid="([^"]*)"/.exec(row.tag)![1] !== arc)
    out.push(`${arc}'s row in Plan carries no \`id="${arc}"\`, so \`approach.html#${arc}\` opens nothing — \`spn-devex docs cycles write\` writes it`);
  else if (row.stamp !== arcStamp(data))
    out.push(`${arc}'s part on the approach page is behind its goal, title or repositories — bring Why, What and How current, then \`workstream arc stamp write ${arc}\``);
  // A page told by construct has no entry per arc: the Plan row is the arc's address and links its page. A page that still tells What by arc is read as it was.
  const entry = whatEntryOf(text, arc) ?? planRowOf(text, arc);
  if (!entry) {
    if (holdsArcEntries(text))
      out.push(`${arc} has no What entry, \`${whatId(arc)}\`, on the approach page — \`spn-devex workstream arc edit ${workstreamName(ws).number}/${arc} --under <heading id>\` anchors it on its subject heading, or writes it under a domain heading`);
    return out;
  }
  const place = entry.kind === "row" ? "Plan row" : "What entry";
  const own = previewPathOf(ws, arc, data);
  const links = localLinks(text.slice(entry.from, entry.to), dirname(page));
  const crossed = new Set<string>();
  for (const link of links) {
    const other = owners.get(link.path);
    if (!other || other === arc || crossed.has(other)) continue;
    crossed.add(other);
    out.push(`${arc}'s ${place} links \`${link.href}\`, ${other}'s preview — an arc's entry links its own preview only, and names another arc by its ${entry.kind === "row" ? "Plan row" : "What"}, \`approach.html#${entry.kind === "row" ? other : whatId(other)}\``);
  }
  for (const link of links) {
    const folder = notesFolderOf(ws, link.path);
    if (!folder || folder === arc || owners.get(link.path)) continue;
    out.push(`${arc}'s ${place} links \`${link.href}\`, inside ${folder}'s folder — an arc's entry links into \`${NOTES}/${arc}/\` only, and names another arc by its ${entry.kind === "row" ? "Plan row" : "What"}, \`approach.html#${entry.kind === "row" ? folder : whatId(folder)}\``);
  }
  if (!links.some((link) => link.path === own)) out.push(`${arc}'s preview is not linked from its ${place}, \`#${entry.kind === "row" ? arc : whatId(arc)}\``);
  return out;
}

/** RULE.DEVEX.WORKSPACE.254: a preview is linked from its own arc's What entry, and from no other place in What. One finding for each arc whose preview is so linked. */
export function whatLinkFindings(ws: string, page: string | null, text: string, owners: ReadonlyMap<string, string>): string[] {
  const range = whatRange(text);
  // A page told by construct links arc pages from the constructs the arcs change, so the rule binds only a page that tells What by arc.
  if (!page || !range || !holdsArcEntries(text)) return [];
  const inside = [...new Set(owners.values())].flatMap((arc) => { const entry = whatEntryOf(text, arc); return entry ? [entry] : []; });
  const out: string[] = [];
  const seen = new Set<string>();
  for (const found of text.slice(range.from, range.to).matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    const at = range.from + found.index!;
    const [link] = localLinks(found[0], dirname(page));
    const arc = link ? owners.get(link.path) : undefined;
    if (!link || !arc || seen.has(arc) || inside.some((entry) => at >= entry.from && at < entry.to)) continue;
    seen.add(arc);
    out.push(`the approach page's What links \`${link.href}\` outside ${arc}'s entry — a preview is linked from its own arc's What entry, and from no other place in What`);
  }
  return out;
}

/**
 * RULE.DEVEX.WORKSPACE.273: the views of an arc's status against its data. The Plan row's word and badge,
 * and the preview's Status badge, each name the arc, the view and the command that mends it.
 */
export function viewFindings(ws: string, arc: string, data: ArcData, text: string): string[] {
  const out: string[] = [];
  const fix = `\`spn-devex docs cycles write ${basename(ws).slice(0, 3)}\``;
  const status = arcStatus(data);
  const row = text ? tableStatuses(text).get(arc) : undefined;
  if (row && row.word !== status)
    out.push(`${arc} reads ${row.word ?? "no status"} in the approach page's Plan table and its data reads ${status} — ${fix} writes the page from the arcs`);
  else if (row && !row.cell.includes(`sds-status sds-${status.toLowerCase()}`))
    out.push(`${arc}'s Status in the Plan table is not its badge, \`sds-status sds-${status.toLowerCase()}\` — ${fix} writes it`);
  const preview = previewOf(ws, arc);
  if (isFile(preview)) {
    const shown = readFileSync(preview, "utf8");
    const built = builtOf(data);
    if (previewWithStatus(shown, arc, status, built.done, built.total) !== shown)
      out.push(`${arc}'s preview badge does not show ${status} — ${fix} writes it from the arc`);
  }
  return out;
}

/**
 * RULE.DEVEX.WORKSPACE.278 and .307: no step runs on an arc that is not decided, or that holds the developer's wait. A
 * stored `PROPOSED` stops what was building, so a step still `running` there is behind the arc. An arc whose `LANDED`
 * is stored, which only the close and version 1 do, with a step neither landed, replaced, carried nor deferred is
 * ahead of its steps: a landed arc is never reopened, so the step's fix goes on the review-fixes arc.
 */
export function statusFindings(arc: string, data: ArcData): string[] {
  const leaves = leafRows(data);
  const out: string[] = [];
  const running = leaves.filter((row) => row.state === "running");
  if (running.length && !stepsMayStart(data) && !["LANDED", "CARRIED", "DROPPED"].includes(data.status)) {
    const why = data.status === "DECIDED" ? `holds the developer's wait, "${data.wait}"` : `is ${data.status}`;
    out.push(`${arc} ${why} and step ${running[0].id} is running — a step runs only on a decided arc with no wait: ` +
      `\`spn-devex workstream row state ${arc} ${running[0].id} stopped\` until the developer's word (RULE.DEVEX.WORKSPACE.278)`);
  }
  const open = leaves.filter((row) => !DONE_STATES.has(row.state ?? "waiting"));
  if (data.status === "LANDED" && open.length)
    out.push(`${arc} is LANDED and step ${open[0].id} is ${open[0].state ?? "waiting"} — a landed arc is never reopened: a fix to it is a step ` +
      `on the review-fixes arc, naming ${arc}, and new scope is a new arc (RULE.DEVEX.WORKSPACE.261)`);
  return out;
}

// The kinds of work in the order WORK lists them (01-workstream.md § A step row says where, what work, and how).
const WORK_ORDER: readonly string[] = WORK;

/**
 * RULE.DEVEX.WORKSPACE.183: an arc's steps, each with a repository and a kind of work, in chain order by repository,
 * the foundation first, then the work in the order WORK lists it inside each, read in the order the arc keeps
 * them. A row whose repository is `—` changes none and takes no place in the chain. `arc edit` prints what this finds and never refuses on it: the chain between two
 * stack repositories is judgement.
 */
export function stepRowFindings(
  data: ArcData,
  before?: { rows: Map<string, string>; order: string[] } | null,
  mapOrder?: readonly string[],
): string[] {
  const rows = leafRows(data);
  const bare: string[] = [];
  const disorder: string[] = [];
  const seen = new Set<string>();
  // ONLY A ROW THE WRITE ADDED OR MOVED IS NAMED: an untouched row out of order was named when it was written. No `before` reads every row as added.
  const touched = (row: ArcRow, at: number): boolean => !before || !before.rows.has(row.id) || before.order.indexOf(row.id) !== at;
  const rankOf = (repo: string): number => mapOrder?.indexOf(repo) ?? -1;
  let repo: string | null = null;
  let lastWork = -1;
  for (const [at, row] of rows.entries()) {
    const rowRepo = typeof row.repo === "string" ? row.repo.trim() : "";
    const work = WORK_ORDER.indexOf(typeof row.work === "string" ? row.work : "");
    if (!rowRepo || work < 0) { bare.push(row.id); continue; }
    if (NO_REPO.has(rowRepo)) continue;
    if (rowRepo !== repo) {
      if (mapOrder) {
        // The map, not the order the repositories first appear in, says what comes first: a row is out where its repository ranks before an earlier row's.
        const earlier = [...seen].find((one) => rankOf(one) >= 0 && rankOf(rowRepo) >= 0 && rankOf(rowRepo) < rankOf(one));
        if (earlier && touched(row, at)) disorder.push(`row ${row.id} is ${rowRepo} after ${earlier}, which the workspace map puts after it`);
      } else if (seen.has(rowRepo)) { if (touched(row, at)) disorder.push(`row ${row.id} returns to ${rowRepo} after ${repo}`); }
      else if (/\bspn-foundation\b/.test(rowRepo) && seen.size && touched(row, at)) disorder.push(`row ${row.id} is spn-foundation after ${[...seen][0]} — the foundation comes first`);
      seen.add(rowRepo);
      repo = rowRepo;
      lastWork = -1;
    }
    if (work < lastWork && touched(row, at)) disorder.push(`row ${row.id} is ${WORK_ORDER[work]} after ${WORK_ORDER[lastWork]} in ${rowRepo}`);
    lastWork = Math.max(lastWork, work);
  }
  const where = "(01-workstream.md § A step row says where, what work, and how; RULE.DEVEX.WORKSPACE.183)";
  const out: string[] = [];
  if (bare.length) out.push(`${data.arc} row(s) ${bare.join(", ")} carry no repo, or no work from ${WORK_ORDER.join(" · ")} ${where}`);
  if (disorder.length) out.push(`${data.arc} rows out of chain order: ${disorder.join(" · ")} — rows run by repository, the foundation ` +
    `first, then ${WORK_ORDER.join(" · ")} inside each ${where}`);
  return out;
}

/**
 * The files of every step an arc has passed: the report of each landed row with an order. A plan is asked of no
 * arc, because one is kept only where the arc has traps, a set or a move table to hold (RULE.DEVEX.WORKSPACE.227).
 */
export function stepFindings(ws: string, arc: string, data: ArcData): string[] {
  const out: string[] = [];
  const notes = notesDirOf(ws, arc);
  for (const row of data.rows) {
    if (row.state !== "landed" || typeof row.order !== "string" || !row.order) continue;
    const report = row.order.replace(/\.md$/, ".report.md");
    if (!isFile(join(notes, report))) out.push(`${arc} row ${row.id} landed and its report \`${NOTES}/${arc}/${report}\` is not there`);
  }
  return out;
}

/** Every line of a `.jsonl` file against its rule. */
function linesFindings(path: string, label: string, faults: (line: unknown, where: string) => string[]): string[] {
  return readJsonl(path).flatMap((line, at) => line === undefined ? [`${label} line ${at + 1} is not JSON`] : faults(line, `${label} line ${at + 1}`));
}

/** ` · refresh E2, E4`: each entry of the arc's sheet whose `facts` cite a fact, or nothing where the arc keeps no sheet or no entry cites it. */
const refresh = (entries: unknown, fact: string): string => {
  const named = (Array.isArray(entries) ? entries : []).filter((entry) => Array.isArray(entry?.facts) && entry.facts.includes(fact)).map((entry) => entry.id);
  return named.length ? ` · refresh ${named.join(", ")}` : "";
};

/** The facts whose source moved since the commit they were pinned at, each as a line. */
export function staleFacts(ws: string, arc: string, root: string): string[] {
  const out: string[] = [];
  const entries = readSheet(ws, arc)?.entries;
  for (const line of readJsonl(factsFileOf(ws, arc))) {
    const fact = line as Fact | undefined;
    if (!fact || typeof fact.source !== "string") continue;
    const [repo, ...rest] = fact.source.replace(/:\d+(?:-\d+)?$/, "").split("/");
    const file = rest.join("/");
    if (!repo || !file || file.includes("…")) continue;
    let moved = "";
    try {
      moved = execFileSync("git", ["-C", join(root, repo), "log", "--format=%h", `${fact.commit}..HEAD`, "--", file],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch { continue; }
    if (moved) out.push(`${arc} ${fact.id}: \`${fact.source}\` moved since ${fact.commit} (${moved.split("\n").length} commit(s))${refresh(entries, fact.id)}`);
  }
  return out;
}

/**
 * A suggestion an arc takes up reads shaped, at the arc's go decided, and at its drop dropped: one still at `raised`
 * while an arc carries it was missed by that move. Only `suggestion edit --arc` takes one up; a log line that
 * mentions a suggestion is a mention, not a take-up.
 */
export function carriedSuggestionFindings(ws: string): string[] {
  const raised: string[] = [];
  for (const line of readJsonl(suggestionsFileOf(ws)) as Array<Record<string, unknown> | undefined>)
    if (line && line.state === "raised" && typeof line.id === "string") raised.push(line.id);
  const out: string[] = [];
  if (!raised.length) return out;
  for (const arc of arcIdsOf(ws)) {
    const data = readJson(stateFileOf(ws, arc)) as Record<string, unknown> | null;
    const carried = Array.isArray(data?.carries) ? (data!.carries as unknown[]).filter((id): id is string => typeof id === "string") : [];
    for (const id of raised)
      if (carried.includes(id)) out.push(`${id} is still raised and ${arc} carries it — a suggestion an arc carries reads shaped, and decided at the arc's go; move it with \`spn-devex workstream suggestion\``);
  }
  return out;
}

/** Every finding of one workstream. A workstream that still keeps its arcs as Markdown gets one, and nothing else is read. */
export function checkWorkstream(ws: string): Finding[] {
  const name = basename(ws);
  const say = (arc: string | null, check: string) => (message: string): Finding => ({ workstream: name, arc, check, message });
  const legacy = markdownArcsOf(ws);
  if (legacy.length)
    return [say(null, "layout")(`keeps ${legacy.length} arc(s) as Markdown under \`arcs/\` — the one-time move brings it to the data layout`)];
  const out: Finding[] = [];
  const page = approachOf(ws);
  const text = page ? readFileSync(page, "utf8") : "";
  const owners = previewOwners(ws);
  for (const arc of arcIdsOf(ws)) {
    const raw = readJson(stateFileOf(ws, arc));
    const faults = raw === null ? [`arcs/${arc}/state.json is not JSON`] : arcFaults(raw, `arcs/${arc}/state.json`);
    out.push(...faults.map(say(arc, "schema")));
    out.push(...linesFindings(logFileOf(ws, arc), `arcs/${arc}/${LOG_FILE}`, logFaults).map(say(arc, "schema")));
    out.push(...linesFindings(factsFileOf(ws, arc), `arcs/${arc}/${FACTS_FILE}`, factFaults).map(say(arc, "schema")));
    out.push(...linesFindings(findingsFileOf(ws, arc), `arcs/${arc}/findings.jsonl`, findingFaults).map(say(arc, "schema")));
    const sheetRaw = existsSync(sheetFileOf(ws, arc)) ? readJson(sheetFileOf(ws, arc)) : undefined;
    if (sheetRaw !== undefined)
      out.push(...(sheetRaw === null ? [`arcs/${arc}/${SHEET_FILE} is not JSON`] : sheetFaults(sheetRaw, `arcs/${arc}/${SHEET_FILE}`).map((fault) => fault.startsWith("arcs/") ? fault : `arcs/${arc}/${SHEET_FILE}: ${fault}`)).map(say(arc, "schema")));
    const data = faults.length ? null : readArc(ws, arc);
    out.push(...previewFindings(ws, arc).map(say(arc, "preview")));
    out.push(...sampleFindings(ws, arc).map(say(arc, "samples")));
    out.push(...sampleLinkFindings(ws, arc).map(say(arc, "preview")));
    out.push(...sampleIndexFindings(ws, arc).map(say(arc, "samples")));
    if (!data) continue;
    out.push(...arcPreviewFindings(ws, arc, data, owners).map(say(arc, "preview")));
    out.push(...pageFindings(ws, arc, data, page, text, owners).map(say(arc, "stamp")));
    out.push(...viewFindings(ws, arc, data, text).map(say(arc, "views")));
    out.push(...nameFindings(ws, arc, data).map(say(arc, "name")));
    out.push(...stepFindings(ws, arc, data).map(say(arc, "steps")));
    out.push(...statusFindings(arc, data).map(say(arc, "status")));
    out.push(...findingsFindings(ws, arc, data).map(say(arc, "findings")));
  }
  // THE PAGE RULES READ THE SAVED FILE, whichever way it was written: the Write and Edit hook reads only what is typed.
  for (const arc of arcIdsOf(ws))
    for (const message of pageRulesOnDisk(previewOf(ws, arc))) out.push(say(arc, "pages")(`${NOTES}/${arc}/${arcPageNameOf(ws, arc)}: ${message}`));
  if (page) for (const message of pageRulesOnDisk(page)) out.push(say(null, "pages")(`${basename(page)}: ${message}`));
  // NO PAGE REACHES THE DEVELOPER UNFILLED (RULE.DEVEX.WORKSPACE.560): the approach page, each arc's page, and every page a samples index lists.
  if (page) for (const message of unfilledFindings(page, basename(page), ["How", "Open", "Deferred"])) out.push(say(null, "unfilled")(message));
  for (const arc of arcIdsOf(ws)) {
    for (const message of unfilledFindings(previewOf(ws, arc), `${NOTES}/${arc}/${arcPageNameOf(ws, arc)}`)) out.push(say(arc, "unfilled")(message));
    for (const sample of listedSamples(ws, arc)) for (const message of unfilledFindings(sample, `${NOTES}/${arc}/samples/${relative(join(notesDirOf(ws, arc), "samples"), sample)}`)) out.push(say(arc, "unfilled")(message));
  }
  // A preview linked from What outside its arc's entry belongs to no arc's check.
  out.push(...whatLinkFindings(ws, page, text, owners).map(say(null, "stamp")));
  // The status card is read from every arc together, so it belongs to none of them.
  const card = page ? headerStatusRule(ws, text, cyclesOf(ws)) : null;
  if (card)
    out.push(say(null, "views")(`the approach page's status card reads ${card.shows} and the arcs give ${card.gives} — \`spn-devex docs cycles write ${name.slice(0, 3)}\` writes it`));
  // A notes folder with no arc data is an arc the page cannot show.
  for (const arc of listdir(join(ws, NOTES)))
    if (ARC_ID.test(arc) && !isFile(stateFileOf(ws, arc))) out.push(say(arc, "steps")(`\`${NOTES}/${arc}/\` has no \`arcs/${arc}/state.json\``));
  // `notes/` and `arcs/` hold arc folders, and nothing else.
  for (const [entry, home] of strayLevels(ws, firstOpenArc(ws)))
    out.push(say(null, "notes")(`\`${entry}\` is not an arc's folder — \`notes/\` and \`arcs/\` hold only arc folders: \`N<nnn>/\`, \`ideate/\` and \`follow-ups/\`; it belongs in ${home}`));
  // Every arc's notes folder holds the five, whether or not its data reads.
  for (const arc of listdir(join(ws, NOTES)))
    if (ARC_ID.test(arc) && isDir(join(ws, NOTES, arc))) out.push(...notesTreeFindings(ws, arc).map(say(arc, "notes")));
  out.push(...linesFindings(suggestionsFileOf(ws), "suggestions.jsonl", suggestionFaults).map(say(null, "schema")));
  out.push(...carriedSuggestionFindings(ws).map(say(null, "suggestions")));
  const questionLines = linesFindings(questionsFileOf(ws), "questions.jsonl", questionFaults);
  out.push(...questionLines.map(say(null, "schema")));
  const records = readQuestions(ws);
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) out.push(say(record.arc ?? null, "questions")(`${cardName(record.id)} is recorded twice`));
    seen.add(record.id);
  }
  out.push(...openWithoutCard(ws, records).map(say(null, "questions")));
  out.push(...cardsDiffer(ws, records).map(say(null, "questions")));
  return out;
}

/** Every finding of every open and backlog workstream, or of the ones named. A closed workstream is never read. */
export function checkWorkspace(root: string, only: readonly string[] | null = null): Finding[] {
  return workstreamsOf(root).filter((ws) => !only || only.includes(ws)).flatMap(checkWorkstream);
}

/** Whether a workstream is the data kind the Stop hook holds to the check: one with no arc kept as Markdown. */
export const heldByStop = (ws: string): boolean => isDataLayout(ws);
