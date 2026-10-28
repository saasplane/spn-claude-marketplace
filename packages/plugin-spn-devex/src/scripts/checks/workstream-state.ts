// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is cut by what is reviewed and released together, and named for its domain · § The folder · § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs · § Open and backlog workstreams follow the standard as it moves · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's · § `How` ends in Cycles, and the arcs are the state
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// `workstream state check`, as a function: whether each open and backlog workstream is whole. The
// command prints it, and the Stop hook refuses to end a turn while it fails for this window's work.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cardsDiffer, openWithoutCard } from "./questions.ts";
import { cyclesOf, headerStatusRule, tableStatuses } from "../commands/docs/cycles.ts";
import { isDir, isFile, listdir } from "../lib/payload.ts";
import { linksSharedStyles } from "../../../../plugin-support-lib/src/lib/page-styles.ts";
import {
  DATA_FILES, FACTS_FILE, LOG_FILE, NOTES, PREVIEW_FILE, approachOf, arcStatus, stepsMayStart, arcDataDir, arcIdsOf, factsFileOf, firstOpenArc, leafRows, isDataLayout, logFileOf, markdownArcsOf,
  NO_REPO, arcStamp, markdownIn, nameFileHolds, nameFileOf, notesDirOf, previewOf, questionsFileOf, readJsonl, readQuestions, stampsOn, stateFileOf,
  strayLevels, strayNotes, suggestionsFileOf, readJson, workstreamsOf, previewWithStatus,
  localLinks, previewHrefOf, previewOwners, slotsIn, whatEntryOf, whatId, whatRange, workstreamName,
} from "../lib/workstream.ts";
import { ALTITUDES, DONE_STATES, arcFaults, factFaults, logFaults, questionFaults, subjectFault, suggestionFaults, type ArcData, type Fact } from "../lib/workstream-schema.ts";

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
 * Q99: at most one preview per arc, by its fixed name, and no `previews/` folder. That every arc has its one
 * is `arcPreviewFindings`' (RD.DEVEX.WORKSPACE.254).
 */
export function previewFindings(ws: string, arc: string): string[] {
  const out: string[] = [];
  const notes = notesDirOf(ws, arc);
  if (isDir(join(notes, "previews"))) out.push(`${arc} keeps a \`previews/\` folder — an arc's one preview is \`${NOTES}/${arc}/${PREVIEW_FILE}\``);
  for (const [base, under] of [[notes, `${NOTES}/${arc}`], [join(ws, "arcs", arc), `arcs/${arc}`]] as const)
    for (const file of filesUnder(base))
      if (/preview[^/]*\.html$/i.test(file) && !(base === notes && file === PREVIEW_FILE))
        out.push(`\`${under}/${file}\` is a second preview — an arc has at most one, \`${NOTES}/${arc}/${PREVIEW_FILE}\``);
  return out;
}

/** The kinds of page the book has. A sample whose masthead names one is a page of the book the work produces. */
export const BOOK_PAGE_KINDS: readonly string[] = ["approach", "preview", "construct", "overview", "report", "guide", "index", "hub"];

/** A review copy of one of the book's templates, named for it: `blocks-template.html`, `approach-template-v2.html`. */
const TEMPLATE_COPY = /-template(?:-[^/.]+)?\.html?$/i;

/** The page kind a page says it is: its `spn:doc` block's `variant`, else its masthead's `Type`, lowercased; "" where it says none. */
function pageKind(text: string): string {
  const variant = /<!--\s*spn:doc[\s\S]*?"variant"\s*:\s*"([^"]+)"/.exec(text)?.[1];
  const type = /<span class="sds-label">Type:<\/span>\s*<span\b[^>]*class="[^"]*sds-type[^"]*"[^>]*>([^<]*)<\/span>/.exec(text)?.[1];
  return (variant ?? type ?? "").trim().toLowerCase();
}

/**
 * RD.DEVEX.WORKSPACE.267: a sample is the work's own file, so a page under `samples/` built with the page template —
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

/**
 * RD.DEVEX.WORKSPACE.262: an arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/`,
 * `scripts/` and `work/`, and nothing else. Each other entry is named with where it belongs. The `previews/`
 * folder and a second preview are left to the one-preview check, which names them in its own words.
 */
export function notesTreeFindings(ws: string, arc: string): string[] {
  return strayNotes(notesDirOf(ws, arc), true)
    .map(([entry, home]) => `\`${NOTES}/${arc}/${entry}\` is not one of the six entries of an arc's notes folder — it belongs in ${home}`);
}

/**
 * RD.DEVEX.WORKSPACE.264 and .265: the arc's goal, its subject's length, and its data folder — the three
 * data files and one name file, which reads as the commands write it from the data.
 */
export function nameFindings(ws: string, arc: string, data: ArcData): string[] {
  const out: string[] = [];
  if (!(typeof data.goal === "string" && data.goal.trim()))
    out.push(`${arc} has no goal — \`spn-devex workstream row write ${arc} --goal "…"\`, the outcome once it is done, in a sentence or two`);
  const short = subjectFault(data.subject);
  if (short) out.push(`${arc}'s subject \`${data.subject}\` ${short} — \`spn-devex workstream row write ${arc} --subject <short-name>\``);
  const name = `${data.subject}.md`;
  const markdown = markdownIn(ws, arc);
  for (const other of markdown.filter((one) => one !== name))
    out.push(`\`arcs/${arc}/${other}\` is a second Markdown file — an arc's data folder holds one, \`${name}\`, which the commands write`);
  for (const entry of listdir(arcDataDir(ws, arc)).filter((one) => !one.endsWith(".md") && !DATA_FILES.includes(one) && !one.startsWith(".")))
    out.push(`\`arcs/${arc}/${entry}\` is not the arc's data — \`arcs/${arc}/\` holds \`state.json\`, \`log.jsonl\`, \`facts.jsonl\` and \`${name}\``);
  let current: string | null = null;
  try { current = readFileSync(nameFileOf(ws, arc, data.subject), "utf8"); } catch { /* absent */ }
  if (current === null) out.push(`${arc} has no name file \`arcs/${arc}/${name}\` — \`spn-devex docs cycles write\` writes it`);
  else if (!nameFileHolds(ws, data, current))
    out.push(`\`arcs/${arc}/${name}\` is not what the commands write from the data — it is never edited by hand; \`spn-devex docs cycles write\` writes it again`);
  return out;
}

/** The path a preview named by the arc sits at: the fixed place, or where a carried arc's `preview` field names it. */
const previewPathOf = (ws: string, arc: string, data: ArcData): string => resolve(ws, previewHrefOf(arc, data));

/**
 * RD.DEVEX.WORKSPACE.254: every arc has one preview, written when it opens; an arc's preview names another arc by its What,
 * never by its preview; and once the arc is decided, no slot of the template is left in it.
 */
export function arcPreviewFindings(ws: string, arc: string, data: ArcData, owners: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  const path = previewPathOf(ws, arc, data);
  const href = previewHrefOf(arc, data);
  const number = workstreamName(ws).number;
  if (!isFile(path)) {
    out.push(`${arc} has no preview — every arc has one, \`${href}\`, written when it opens; \`spn-devex workstream row write ${number}/${arc}\` writes it from the template (RD.DEVEX.WORKSPACE.254)`);
    return out;
  }
  const text = readFileSync(path, "utf8");
  const seen = new Set<string>();
  for (const link of localLinks(text, dirname(path))) {
    const other = owners.get(link.path);
    if (!other || other === arc || seen.has(other)) continue;
    seen.add(other);
    out.push(`${arc}'s preview links \`${link.href}\`, ${other}'s preview — a preview names another arc by its What, \`../../approach.html#${whatId(other)}\`, and never links its preview`);
  }
  const status = arcStatus(data);
  const slots = slotsIn(text);
  if (slots.length && !["PROPOSED", "CARRIED", "DROPPED"].includes(status))
    out.push(`${arc} is ${status} and its preview still holds ${slots.length} slot(s), \`{{…}}\`, the first at \`${href}:${slots[0].line}\` — a decided arc's preview is filled; a slot is expected only while the arc is PROPOSED`);
  return out;
}

/**
 * S7: the arc's row in Cycles under its address, its stamp against its goal, title and repositories, and its own What
 * entry, `N<nnn>-what`, which links its preview and no other arc's (RD.DEVEX.WORKSPACE.254).
 */
export function pageFindings(ws: string, arc: string, data: ArcData, page: string | null, text: string, owners: ReadonlyMap<string, string> = previewOwners(ws)): string[] {
  if (!page) return [`${arc} has no approach page to stand on`];
  const out: string[] = [];
  const row = stampsOn(text).get(arc);
  if (!row) out.push(`${arc} has no row in Cycles carrying \`data-arc="arcs/${arc}/state.json"\``);
  else if (!/\bid="([^"]*)"/.test(row.tag) || /\bid="([^"]*)"/.exec(row.tag)![1] !== arc)
    out.push(`${arc}'s row in Cycles carries no \`id="${arc}"\`, so \`approach.html#${arc}\` opens nothing — \`spn-devex docs cycles write\` writes it`);
  else if (row.stamp !== arcStamp(data))
    out.push(`${arc}'s part on the approach page is behind its goal, title or repositories — bring Why, What and How current, then \`workstream arc stamp write ${arc}\``);
  const entry = whatEntryOf(text, arc);
  if (!entry) {
    out.push(`${arc} has no What entry, \`${whatId(arc)}\`, on the approach page — \`spn-devex workstream row write ${workstreamName(ws).number}/${arc} --under <heading id>\` anchors it on its subject heading, or writes it under a domain heading`);
    return out;
  }
  const own = previewPathOf(ws, arc, data);
  const links = localLinks(text.slice(entry.from, entry.to), dirname(page));
  const crossed = new Set<string>();
  for (const link of links) {
    const other = owners.get(link.path);
    if (!other || other === arc || crossed.has(other)) continue;
    crossed.add(other);
    out.push(`${arc}'s What entry links \`${link.href}\`, ${other}'s preview — an arc's entry links its own preview only, and names another arc by its What, \`approach.html#${whatId(other)}\``);
  }
  if (!links.some((link) => link.path === own)) out.push(`${arc}'s preview is not linked from its What entry, \`#${whatId(arc)}\``);
  return out;
}

/** RD.DEVEX.WORKSPACE.254: a preview is linked from its own arc's What entry, and from no other place in What. One finding for each arc whose preview is so linked. */
export function whatLinkFindings(ws: string, page: string | null, text: string, owners: ReadonlyMap<string, string>): string[] {
  const range = whatRange(text);
  if (!page || !range) return [];
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
 * RD.DEVEX.WORKSPACE.273: the views of an arc's status against its data. The Cycles row's word and badge,
 * and the preview's Status badge, each name the arc, the view and the command that mends it.
 */
export function viewFindings(ws: string, arc: string, data: ArcData, text: string): string[] {
  const out: string[] = [];
  const fix = `\`spn-devex docs cycles write ${basename(ws).slice(0, 3)}\``;
  const status = arcStatus(data);
  const row = text ? tableStatuses(text).get(arc) : undefined;
  if (row && row.word !== status)
    out.push(`${arc} reads ${row.word ?? "no status"} in the approach page's Cycles table and its data reads ${status} — ${fix} writes the page from the arcs`);
  else if (row && !row.cell.includes(`sds-status sds-${status.toLowerCase()}`))
    out.push(`${arc}'s Status in the Cycles table is not its badge, \`sds-status sds-${status.toLowerCase()}\` — ${fix} writes it`);
  const preview = previewOf(ws, arc);
  if (isFile(preview)) {
    const shown = readFileSync(preview, "utf8");
    if (previewWithStatus(shown, arc, status) !== shown)
      out.push(`${arc}'s preview badge does not show ${status} — ${fix} writes it from the arc`);
  }
  return out;
}

/**
 * RD.DEVEX.WORKSPACE.278 and .307: no step runs on an arc that is not decided, or that holds the developer's wait. A
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
      `\`spn-devex workstream row write ${arc} ${running[0].id} --state stopped\` until the developer's word (RD.DEVEX.WORKSPACE.278)`);
  }
  const open = leaves.filter((row) => !DONE_STATES.has(row.state ?? "waiting"));
  if (data.status === "LANDED" && open.length)
    out.push(`${arc} is LANDED and step ${open[0].id} is ${open[0].state ?? "waiting"} — a landed arc is never reopened: a fix to it is a step ` +
      `on the review-fixes arc, naming ${arc}, and new scope is a new arc (RD.DEVEX.WORKSPACE.261)`);
  return out;
}

// The altitudes in the order they run (01-workstream.md § A step row).
const ALTITUDE_ORDER: readonly string[] = ALTITUDES;

/**
 * RD.DEVEX.WORKSPACE.183: an arc's steps, each with a repository and an altitude, in chain order by repository,
 * the foundation first, then DOCS · CODE · GENERATED · RELEASE · PROOF inside each, read in the order the arc keeps
 * them. A row whose repository is `—` changes none and takes no place in the chain. `row write` prints what this finds and never refuses on it: the chain between two
 * stack repositories is judgement.
 */
export function stepRowFindings(data: ArcData): string[] {
  const rows = leafRows(data);
  const bare: string[] = [];
  const disorder: string[] = [];
  const seen = new Set<string>();
  let repo: string | null = null;
  let lastAltitude = -1;
  for (const row of rows) {
    const rowRepo = typeof row.repo === "string" ? row.repo.trim() : "";
    const altitude = ALTITUDE_ORDER.indexOf(typeof row.altitude === "string" ? row.altitude : "");
    if (!rowRepo || altitude < 0) { bare.push(row.id); continue; }
    if (NO_REPO.has(rowRepo)) continue;
    if (rowRepo !== repo) {
      if (seen.has(rowRepo)) disorder.push(`row ${row.id} returns to ${rowRepo} after ${repo}`);
      else if (/\bspn-foundation\b/.test(rowRepo) && seen.size) disorder.push(`row ${row.id} is spn-foundation after ${[...seen][0]} — the foundation comes first`);
      seen.add(rowRepo);
      repo = rowRepo;
      lastAltitude = -1;
    }
    if (altitude < lastAltitude) disorder.push(`row ${row.id} is ${ALTITUDE_ORDER[altitude]} after ${ALTITUDE_ORDER[lastAltitude]} in ${rowRepo}`);
    lastAltitude = Math.max(lastAltitude, altitude);
  }
  const where = "(01-workstream.md § A step row says where, at what altitude, and how; RD.DEVEX.WORKSPACE.183)";
  const out: string[] = [];
  if (bare.length) out.push(`${data.arc} row(s) ${bare.join(", ")} carry no repo, or no altitude from ${ALTITUDE_ORDER.join(" · ")} ${where}`);
  if (disorder.length) out.push(`${data.arc} rows out of chain order: ${disorder.join(" · ")} — rows run by repository, the foundation ` +
    `first, then DOCS · CODE · GENERATED · RELEASE · PROOF inside each ${where}`);
  return out;
}

/**
 * The files of every step an arc has passed: the report of each landed row with an order. A plan is asked of no
 * arc, because one is kept only where the arc has traps, a set or a move table to hold (RD.DEVEX.WORKSPACE.227).
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

/** The facts whose source moved since the commit they were pinned at, each as a line. */
export function staleFacts(ws: string, arc: string, root: string): string[] {
  const out: string[] = [];
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
    if (moved) out.push(`${arc} ${fact.id}: \`${fact.source}\` moved since ${fact.commit} (${moved.split("\n").length} commit(s))`);
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
    const data = faults.length ? null : raw as ArcData;
    out.push(...previewFindings(ws, arc).map(say(arc, "preview")));
    out.push(...sampleFindings(ws, arc).map(say(arc, "samples")));
    if (!data) continue;
    out.push(...arcPreviewFindings(ws, arc, data, owners).map(say(arc, "preview")));
    out.push(...pageFindings(ws, arc, data, page, text, owners).map(say(arc, "stamp")));
    out.push(...viewFindings(ws, arc, data, text).map(say(arc, "views")));
    out.push(...nameFindings(ws, arc, data).map(say(arc, "name")));
    out.push(...stepFindings(ws, arc, data).map(say(arc, "steps")));
    out.push(...statusFindings(arc, data).map(say(arc, "status")));
  }
  // A preview linked from What outside its arc's entry belongs to no arc's check.
  out.push(...whatLinkFindings(ws, page, text, owners).map(say(null, "stamp")));
  // The status card is read from every arc together, so it belongs to none of them.
  const card = page ? headerStatusRule(ws, text, cyclesOf(ws)) : null;
  if (card)
    out.push(say(null, "views")(`the approach page's status card reads ${card.shows} and the arcs give ${card.gives} — \`spn-devex docs cycles write ${name.slice(0, 3)}\` writes it`));
  // A notes folder with no arc data is an arc the page cannot show.
  for (const arc of listdir(join(ws, NOTES)))
    if (/^N\d+[a-z]?$/.test(arc) && !isFile(stateFileOf(ws, arc))) out.push(say(arc, "steps")(`\`${NOTES}/${arc}/\` has no \`arcs/${arc}/state.json\``));
  // `notes/` and `arcs/` hold arc folders, and nothing else.
  for (const [entry, home] of strayLevels(ws, firstOpenArc(ws)))
    out.push(say(null, "notes")(`\`${entry}\` is not an arc's folder — \`notes/\` and \`arcs/\` hold only \`N<nnn>/\` folders; it belongs in ${home}`));
  // Every arc's notes folder holds the five, whether or not its data reads.
  for (const arc of listdir(join(ws, NOTES)))
    if (/^N\d+[a-z]?$/.test(arc) && isDir(join(ws, NOTES, arc))) out.push(...notesTreeFindings(ws, arc).map(say(arc, "notes")));
  out.push(...linesFindings(suggestionsFileOf(ws), "suggestions.jsonl", suggestionFaults).map(say(null, "schema")));
  const questionLines = linesFindings(questionsFileOf(ws), "questions.jsonl", questionFaults);
  out.push(...questionLines.map(say(null, "schema")));
  const records = readQuestions(ws);
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) out.push(say(record.arc ?? null, "questions")(`${record.id} is recorded twice`));
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
