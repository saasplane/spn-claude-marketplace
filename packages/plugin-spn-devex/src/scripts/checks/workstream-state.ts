// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The life of an arc, and every file it touches · § The approach page keeps up with its arcs · § Open and backlog workstreams follow the standard as it moves
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § A preview shows, and an approach page argues
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// `workstream state check`, as a function: whether each open and backlog workstream is whole. The
// command prints it, and the Stop hook refuses to end a turn while it fails for this window's work.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { pastDecided } from "./arc-status.ts";
import { cardsDiffer, openWithoutCard } from "./questions.ts";
import { isDir, isFile, listdir } from "../lib/payload.ts";
import {
  FACTS_FILE, LOG_FILE, NOTES, PREVIEW_FILE, approachOf, arcIdsOf, factsFileOf, isDataLayout, logFileOf, markdownArcsOf,
  notesDirOf, previewOf, questionsFileOf, readJsonl, readQuestions, rowStamp, stampsOn, stateFileOf, suggestionsFileOf, readJson, workstreamsOf,
} from "../lib/workstream.ts";
import { arcFaults, factFaults, logFaults, questionFaults, suggestionFaults, type ArcData, type Fact } from "../lib/workstream-schema.ts";

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
  if (data && data.status !== "PROPOSED" && !isFile(previewOf(ws, arc)))
    out.push(`${arc} is ${data.status} and has no preview at \`${NOTES}/${arc}/${PREVIEW_FILE}\``);
  return out;
}

/** S7: the arc's row in Cycles, its stamp against its rows, and its preview linked from `What`. */
export function pageFindings(ws: string, arc: string, data: ArcData, page: string | null, text: string): string[] {
  if (!page) return [`${arc} has no approach page to stand on`];
  const out: string[] = [];
  const row = stampsOn(text).get(arc);
  if (!row) out.push(`${arc} has no row in Cycles carrying \`data-arc="arcs/${arc}/state.json"\``);
  else if (row.stamp !== rowStamp(data))
    out.push(`${arc}'s part on the approach page is behind its rows — bring Why, What and How current, then \`workstream arc stamp write ${arc}\``);
  if (isFile(previewOf(ws, arc)) && !sectionText(text, "What").includes(`${NOTES}/${arc}/${PREVIEW_FILE}`))
    out.push(`${arc}'s preview is not linked from the page's What`);
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
    if (!data) continue;
    out.push(...pageFindings(ws, arc, data, page, text).map(say(arc, "stamp")));
    out.push(...stepFindings(ws, arc, data).map(say(arc, "steps")));
  }
  // A notes folder with no arc data is an arc the page cannot show.
  for (const arc of listdir(join(ws, NOTES)))
    if (/^N\d+[a-z]?$/.test(arc) && !isFile(stateFileOf(ws, arc))) out.push(say(arc, "steps")(`\`${NOTES}/${arc}/\` has no \`arcs/${arc}/state.json\``));
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
