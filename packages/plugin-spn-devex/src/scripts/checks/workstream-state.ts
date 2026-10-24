// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is named for the cycle it pays · § The folder · § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs · § Open and backlog workstreams follow the standard as it moves · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's · § `How` ends in Cycles, and the arcs are the state
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// `workstream state check`, as a function: whether each open and backlog workstream is whole. The
// command prints it, and the Stop hook refuses to end a turn while it fails for this window's work.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { pastDecided } from "./arc-status.ts";
import { cardsDiffer, openWithoutCard } from "./questions.ts";
import { cyclesOf, headerStatusRule, tableStatuses } from "../commands/docs/cycles.ts";
import { isDir, isFile, listdir } from "../lib/payload.ts";
import { linksSharedStyles } from "../../../../plugin-support-lib/src/lib/page-styles.ts";
import {
  DATA_FILES, FACTS_FILE, LOG_FILE, NOTES, PREVIEW_FILE, approachOf, arcDataDir, arcIdsOf, factsFileOf, firstOpenArc, leafRows, isDataLayout, logFileOf, markdownArcsOf,
  markdownIn, nameFileHolds, nameFileOf, notesDirOf, previewHrefOf, previewOf,questionsFileOf, readJsonl, readQuestions, rowStamp, stampsOn, stateFileOf,
  strayLevels, strayNotes, suggestionsFileOf, readJson, workstreamsOf, previewWithStatus, statusMoves, landedLines, logLinesOf,
} from "../lib/workstream.ts";
import { DONE_STATES, arcFaults, factFaults, isBuildRow, logFaults, questionFaults, subjectFault, suggestionFaults, type ArcData, type Fact } from "../lib/workstream-schema.ts";

export type Finding = { workstream: string; arc: string | null; check: string; message: string };

/** The part of a page under its `h2` named `name`, to the next `h2`. Empty where it has none. */
export function sectionText(text: string, name: string): string {
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

/** Q99: one preview per arc, by its fixed name, and no `previews/` folder. */
export function previewFindings(ws: string, arc: string, data: ArcData | null): string[] {
  const out: string[] = [];
  const notes = notesDirOf(ws, arc);
  if (isDir(join(notes, "previews"))) out.push(`${arc} keeps a \`previews/\` folder — an arc's one preview is \`${NOTES}/${arc}/${PREVIEW_FILE}\``);
  for (const [base, under] of [[notes, `${NOTES}/${arc}`], [join(ws, "arcs", arc), `arcs/${arc}`]] as const)
    for (const file of filesUnder(base))
      if (/preview[^/]*\.html$/i.test(file) && !(base === notes && file === PREVIEW_FILE))
        out.push(`\`${under}/${file}\` is a second preview — an arc has one, \`${NOTES}/${arc}/${PREVIEW_FILE}\``);
  const previewHref = previewHrefOf(arc, data);
  if (data && data.status !== "PROPOSED" && !isFile(previewOf(ws, arc)) && !isFile(join(ws, previewHref)))
    out.push(`${arc} is ${data.status} and has no preview at \`${previewHref}\``);
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
 * RD.DEVEX.WORKSPACE.262: an arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/`
 * and `scripts/`, and nothing else. Each other entry is named with where it belongs. The `previews/`
 * folder and a second preview are left to the one-preview check, which names them in its own words.
 */
export function notesTreeFindings(ws: string, arc: string): string[] {
  return strayNotes(notesDirOf(ws, arc), true)
    .map(([entry, home]) => `\`${NOTES}/${arc}/${entry}\` is not one of the five entries of an arc's notes folder — it belongs in ${home}`);
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

/** S7: the arc's row in Cycles under its address, its stamp against its rows, and its preview linked from `What`. */
export function pageFindings(ws: string, arc: string, data: ArcData, page: string | null, text: string): string[] {
  if (!page) return [`${arc} has no approach page to stand on`];
  const out: string[] = [];
  const row = stampsOn(text).get(arc);
  if (!row) out.push(`${arc} has no row in Cycles carrying \`data-arc="arcs/${arc}/state.json"\``);
  else if (!/\bid="([^"]*)"/.test(row.tag) || /\bid="([^"]*)"/.exec(row.tag)![1] !== arc)
    out.push(`${arc}'s row in Cycles carries no \`id="${arc}"\`, so \`approach.html#${arc}\` opens nothing — \`spn-devex docs cycles write\` writes it`);
  else if (row.stamp !== rowStamp(data))
    out.push(`${arc}'s part on the approach page is behind its rows — bring Why, What and How current, then \`workstream arc stamp write ${arc}\``);
  if (isFile(previewOf(ws, arc)) && !sectionText(text, "What").includes(`${NOTES}/${arc}/${PREVIEW_FILE}`))
    out.push(`${arc}'s preview is not linked from the page's What`);
  return out;
}

/**
 * RD.DEVEX.WORKSPACE.273: the views of an arc's status against its data. The Cycles row's word and badge,
 * and the preview's Status badge, each name the arc, the view and the command that mends it.
 */
export function viewFindings(ws: string, arc: string, data: ArcData, text: string): string[] {
  const out: string[] = [];
  const fix = `\`spn-devex docs cycles write ${basename(ws).slice(0, 3)}\``;
  const row = text ? tableStatuses(text).get(arc) : undefined;
  if (row && row.word !== data.status)
    out.push(`${arc} reads ${row.word ?? "no status"} in the approach page's Cycles table and its data reads ${data.status} — ${fix} writes the page from the arcs`);
  else if (row && !row.cell.includes(`sds-status sds-${data.status.toLowerCase()}`))
    out.push(`${arc}'s Status in the Cycles table is not its badge, \`sds-status sds-${data.status.toLowerCase()}\` — ${fix} writes it`);
  const preview = previewOf(ws, arc);
  if (isFile(preview)) {
    const shown = readFileSync(preview, "utf8");
    if (previewWithStatus(shown, arc, data.status) !== shown)
      out.push(`${arc}'s preview badge does not show ${data.status} — ${fix} writes it from the arc`);
  }
  return out;
}

/**
 * RD.DEVEX.WORKSPACE.278: an arc's design rows run under PROPOSED, and only the developer's go moves it. A build
 * row running on a PROPOSED arc started before the go, and a DECIDED arc with one is behind its rows; so is one
 * landed since the arc last moved to PROPOSED or opened there, read from `lines`, the arc's log. A build row landed
 * before that landed under an earlier go, and is history: the check exists to stop build work before a go, and that
 * row was not. One whose landing the log does not show is named, as is every one where the log shows no move to
 * PROPOSED. A design row running or landed is never named. An arc at LANDED with a row neither landed, carried nor
 * deferred is ahead of its rows.
 */
export function statusFindings(arc: string, data: ArcData, lines: readonly unknown[] = []): string[] {
  const leaves = leafRows(data);
  const out: string[] = [];
  const since = statusMoves(lines).toProposed;
  const landedAt = landedLines(data, lines);
  const afterGo = (id: string): boolean => since === null || !landedAt.has(id) || landedAt.get(id)! > since;
  const started = leaves.filter((row) => isBuildRow(row) && (row.state === "running" || (row.state === "landed" && afterGo(row.id))));
  if (data.status === "PROPOSED" && started.length)
    out.push(`${arc} is PROPOSED and build row ${started[0].id} is ${started[0].state} — a build row starts only after the developer's go, ` +
      `which is theirs to give: \`spn-devex workstream row write ${arc} --status DECIDED --note "<the developer's words>"\``);
  if (data.status === "DECIDED" && started.length)
    out.push(`${arc} is DECIDED and row ${started[0].id} is ${started[0].state} — \`spn-devex workstream row write ${arc} --status RUNNING\` moves it to what its rows say`);
  const open = leaves.filter((row) => !DONE_STATES.has(row.state ?? "waiting"));
  if (data.status === "LANDED" && open.length)
    out.push(`${arc} is LANDED and row ${open[0].id} is ${open[0].state ?? "waiting"} — land the row with \`spn-devex workstream row write ${arc} ${open[0].id} --state landed\`, or move the arc back with \`--status RUNNING\``);
  return out;
}

/** The files of every step an arc has passed: its plan once decided, and the report of each landed row with an order. */
export function stepFindings(ws: string, arc: string, data: ArcData): string[] {
  const out: string[] = [];
  const notes = notesDirOf(ws, arc);
  if (pastDecided(data.status) || data.status === "DECIDED")
    if (!isFile(join(notes, "plan.md")) && !["CARRIED", "DROPPED"].includes(data.status)) out.push(`${arc} is ${data.status} and has no \`${NOTES}/${arc}/plan.md\``);
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
  for (const arc of arcIdsOf(ws)) {
    const raw = readJson(stateFileOf(ws, arc));
    const faults = raw === null ? [`arcs/${arc}/state.json is not JSON`] : arcFaults(raw, `arcs/${arc}/state.json`);
    out.push(...faults.map(say(arc, "schema")));
    out.push(...linesFindings(logFileOf(ws, arc), `arcs/${arc}/${LOG_FILE}`, logFaults).map(say(arc, "schema")));
    out.push(...linesFindings(factsFileOf(ws, arc), `arcs/${arc}/${FACTS_FILE}`, factFaults).map(say(arc, "schema")));
    const data = faults.length ? null : raw as ArcData;
    out.push(...previewFindings(ws, arc, data).map(say(arc, "preview")));
    out.push(...sampleFindings(ws, arc).map(say(arc, "samples")));
    if (!data) continue;
    out.push(...pageFindings(ws, arc, data, page, text).map(say(arc, "stamp")));
    out.push(...viewFindings(ws, arc, data, text).map(say(arc, "views")));
    out.push(...nameFindings(ws, arc, data).map(say(arc, "name")));
    out.push(...stepFindings(ws, arc, data).map(say(arc, "steps")));
    out.push(...statusFindings(arc, data, logLinesOf(ws, arc)).map(say(arc, "status")));
  }
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
