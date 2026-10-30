// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is cut by what is reviewed and released together, and named for its domain · § The workstream is kept as data, and every file has one owner · § The folder · § The formats · § The approach page keeps up with its arcs · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state · § The approach document — a workstream's, never a repository's
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// The shared state library: where each file a script owns sits, how it is read and written, the
// stamp of what the page states about an arc, the two generated blocks a page holds, and a preview's status. Every `workstream` command, the
// checks and the hooks read through it, so a path or a format is spelled once.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { namedRun, worst, type Run } from "../../../../plugin-support-lib/src/lib/runs.ts";
import { STATUSES, TERMINAL, type Status } from "../checks/arc-status.ts";
import { withOffset } from "./clock.ts";
import { isDir, isFile, listdir, workspaceRoot } from "./payload.ts";
import { APPROACH_PAGE, ARCS, PLUGIN_TEMPLATES, WORKSTREAM_STATES, isApproachPage, workstreamPrefixSource, workstreamsDir, type WorkstreamState } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import {
  ARC_ID, DONE_STATES, QUESTION_ID, SCHEMA_VERSION, arcFaults, parentIds,
  type ArcData, type ArcRow, type Card, type LogLine, type Question, type RowState, type Sheet,
} from "./workstream-schema.ts";

// ---------------------------------------------------------------------------- the folder

export const NOTES = "notes";
export const STATE_FILE = "state.json";
export const LOG_FILE = "log.jsonl";
export const FACTS_FILE = "facts.jsonl";
/** An arc's change sheet, written by the `workstream sheet` commands and the opening write of `arc edit`. */
export const SHEET_FILE = "sheet.json";
export const QUESTIONS_FILE = "questions.jsonl";
export const SUGGESTIONS_FILE = "suggestions.jsonl";
/** An arc's one preview, by its fixed name, in `notes/N<nnn>/`. */
export const PREVIEW_FILE = "preview.html";
/** The states whose workstreams are held to the standard of the day. A closed one stays as it closed. */
export const HELD_STATES: readonly WorkstreamState[] = ["open", "backlog"];

/**
 * What an arc's notes folder holds, and nothing else (RD.DEVEX.WORKSPACE.262): each entry's name and
 * whether it is a file or a folder. `samples/` and `work/` may hold folders of their own; the others are flat.
 */
export const NOTES_ENTRIES: ReadonlyMap<string, "file" | "folder"> = new Map([
  [PREVIEW_FILE, "file"], ["samples", "folder"], ["plan.md", "file"], ["orders", "folder"], ["scripts", "folder"],
  ["work", "folder"],
]);

/** What the work leaves behind for itself: a proof's output, a patch, a log. Never a sample to review. */
const WORK_KINDS = /\.(?:patch|diff|log)$/i;

const SAMPLE_KINDS = /\.(?:png|jpe?g|gif|webp|svg|avif|mp4|mov|webm|pdf)$/i;
const SCRIPT_KINDS = /\.(?:mjs|cjs|js|ts|py|sh)$/i;
const DATA_KINDS = /\.(?:json|csv|tsv|ya?ml)$/i;
const ORDER_NAME = /(?:^\d+[a-z]?(?:[-.][^/]*)?\.md$|\.(?:report|ledger)\.md$)/i;

/**
 * Where an entry found beside the six in an arc's notes folder belongs, by its name and kind, as the
 * words a finding or a refusal ends with. One that names a second preview belongs in the one preview.
 */
export function strayHome(name: string, folder: boolean): string {
  const lower = name.toLowerCase();
  const cards = "records in the workstream's `questions.jsonl`, by `workstream question raise`, once each is checked against the records already there";
  const facts = "records in the arc's `facts.jsonl`, by `workstream fact write`, each with the commit it was read at";
  const named = (pattern: RegExp): boolean => pattern.test(lower.replace(/\.[a-z0-9]+$/, ""));
  if (lower === "previews" || /preview[^/]*\.html$/.test(lower)) return `a section of the arc's one \`${PREVIEW_FILE}\``;
  if (folder) {
    if (named(/cards?|questions?/)) return cards;
    if (named(/(?:^|[-_.])facts?(?:[-_.]|$)/)) return facts;
    if (named(/shots?|screens?|images?|img|looks?|views?|captures?|renders?|pages?/)) return "`samples/`, as a folder of its own there if it helps";
    if (named(/orders?|briefs?|reports?/)) return "`orders/`, each brief named by its row";
    if (named(/scripts?|bin|tools?/)) return "`scripts/`";
    if (named(/(?:^|[-_.])(?:proofs?|evidence|baselines?|scans?|asks?|patch(?:es)?|logs?|outputs?|runs?)(?:[-_.]|$)/)) return "`work/`, as a folder of its own there if it helps";
    return `its screenshots and real files in \`samples/${name}/\`, and each note in it a section of \`plan.md\``;
  }
  if (SAMPLE_KINDS.test(lower)) return "`samples/`";
  if (SCRIPT_KINDS.test(lower)) return "`scripts/`";
  if (WORK_KINDS.test(lower)) return "`work/`";
  if (named(/cards?|questions?/)) return cards;
  if (named(/(?:^|[-_.])facts?(?:[-_.]|$)/)) return facts;
  if (ORDER_NAME.test(lower)) return "`orders/`, named by its row";
  if (/\.(?:md|txt)$/.test(lower)) return "a section of `plan.md`";
  if (DATA_KINDS.test(lower) || lower.endsWith(".jsonl")) return "`scripts/`, beside the script that reads it, or else a section of `plan.md`";
  if (lower.endsWith(".html")) return "`samples/` if it is a real page the work produces, or else a section of the arc's one `preview.html`";
  return "`samples/` if it is a real file the work produces, or else a section of `plan.md`";
}

/** Where an entry of the five belongs when it was made as the other kind: in itself, as its own kind. */
export const wrongKind = (entry: string, kind: "file" | "folder"): string =>
  `\`${entry}\` itself, which is a ${kind} and never a ${kind === "file" ? "folder" : "file"}`;

/**
 * Each entry of one arc's notes folder outside the five, with where it belongs, as `[entry, home]`.
 * A dot-name is no one's entry and is passed. `skipPreviews` leaves out the `previews/` folder and a
 * second `*preview*.html`, which the one-preview check names in its own words.
 */
export function strayNotes(notesDir: string, skipPreviews = false): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const entry of listdir(notesDir)) {
    const folder = isDir(join(notesDir, entry));
    const kind = NOTES_ENTRIES.get(entry);
    if (kind === (folder ? "folder" : "file")) continue;
    if (kind) { out.push([`${entry}${folder ? "/" : ""}`, wrongKind(entry, kind)]); continue; }
    if (skipPreviews && (entry === "previews" || /preview[^/]*\.html$/i.test(entry))) continue;
    out.push([`${entry}${folder ? "/" : ""}`, strayHome(entry, folder)]);
  }
  return out;
}

/**
 * Each entry directly under a workstream's `notes/` or `arcs/` that is not an arc's folder, with where
 * it belongs, as `[entry, home]` (RD.DEVEX.WORKSPACE.262). A note loose at `notes/` is a section of the
 * plan of the arc it names, or of `firstOpen`, the workstream's first open arc, where it names none.
 * A workstream that still keeps its arcs as Markdown under `arcs/` is migration 001's, so `arcs/` is
 * read only where `markdownArcs` is false. A dot-name is no one's entry and is passed.
 */
export function strayLevels(ws: string, firstOpen: string | null, markdownArcs = false): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const plan = (name: string): string => {
    const named = /\bN\d{3}[a-z]?\b/.exec(name)?.[0];
    const arc = named ?? firstOpen;
    return arc
      ? `a section of \`${NOTES}/${arc}/plan.md\`${named ? ", the arc it names" : ", the workstream's first open arc, since it names none"}`
      : "a section of the first arc's `plan.md`, once the workstream opens one";
  };
  for (const entry of listdir(join(ws, NOTES))) {
    if (entry.startsWith(".")) continue;
    const folder = isDir(join(ws, NOTES, entry));
    if (folder && ARC_ID.test(entry)) continue;
    const home = folder ? `the arc folder it belongs to, each note in it ${plan(entry)}`
      : SAMPLE_KINDS.test(entry) || entry.endsWith(".html") ? "the `samples/` of the arc it belongs to" : plan(entry);
    out.push([`${NOTES}/${entry}${folder ? "/" : ""}`, home]);
  }
  if (!markdownArcs) for (const entry of listdir(join(ws, ARCS))) {
    if (entry.startsWith(".")) continue;
    const folder = isDir(join(ws, ARCS, entry));
    if (folder && ARC_ID.test(entry)) continue;
    out.push([`${ARCS}/${entry}${folder ? "/" : ""}`, "nowhere by hand: `arcs/` holds only `N<nnn>/` folders, which the `workstream` commands write"]);
  }
  return out;
}

export const arcDataDir = (ws: string, arc: string): string => join(ws, ARCS, arc);
export const stateFileOf = (ws: string, arc: string): string => join(arcDataDir(ws, arc), STATE_FILE);
export const logFileOf = (ws: string, arc: string): string => join(arcDataDir(ws, arc), LOG_FILE);
export const factsFileOf = (ws: string, arc: string): string => join(arcDataDir(ws, arc), FACTS_FILE);
export const sheetFileOf = (ws: string, arc: string): string => join(arcDataDir(ws, arc), SHEET_FILE);
export const notesDirOf = (ws: string, arc: string): string => join(ws, NOTES, arc);
export const previewOf = (ws: string, arc: string): string => join(notesDirOf(ws, arc), PREVIEW_FILE);
/**
 * Where an arc's preview is linked from its workstream folder: the arc's `preview` field where it is a
 * path, as an arc carried to another workstream keeps it (`workstream arc edit <arc> --preview <path>`),
 * and `notes/N<nnn>/preview.html` where it is the fixed name alone.
 */
export function previewHrefOf(arc: string, data: Pick<ArcData, "preview"> | null): string {
  const given = typeof data?.preview === "string" ? data.preview.trim() : "";
  return given.includes("/") ? given : `${NOTES}/${arc}/${PREVIEW_FILE}`;
}
/** The fault in a `--preview` value, or null: a path from the workstream folder that ends in the fixed name. */
export function previewPathFault(value: string): string | null {
  if (value === PREVIEW_FILE) return null;
  if (value.startsWith("/") || /^[a-z]+:/i.test(value)) return "is not a path from the workstream folder";
  if (!value.endsWith(`/${PREVIEW_FILE}`)) return `does not end in the arc's one preview, \`${PREVIEW_FILE}\``;
  return null;
}
export const questionsFileOf = (ws: string): string => join(ws, QUESTIONS_FILE);
/** The arc's name file beside its data, named for its subject (RD.DEVEX.WORKSPACE.264). */
export const nameFileOf = (ws: string, arc: string, subject: string): string => join(arcDataDir(ws, arc), `${subject}.md`);
/** The data files of an arc's folder; with the one name file, `arcs/N<nnn>/` holds these and nothing else. */
export const DATA_FILES: readonly string[] = [STATE_FILE, LOG_FILE, FACTS_FILE, SHEET_FILE];

/**
 * The arc's address on the approach page: its Cycles row, by its number (RD.DEVEX.WORKSPACE.263).
 * `from` is the path from the folder the link is written in back to the workstream's folder.
 */
export const arcAddress = (arc: string, from = ""): string => `${from}${APPROACH_PAGE}#${arc}`;
export const suggestionsFileOf = (ws: string): string => join(ws, SUGGESTIONS_FILE);

/** The workstream's approach page: `approach.html`, or the one page named as a closed workstream keeps it. */
export function approachOf(ws: string): string | null {
  const direct = join(ws, APPROACH_PAGE);
  if (isFile(direct)) return direct;
  const found = listdir(ws).find((entry) => isApproachPage(entry) && isFile(join(ws, entry)));
  return found ? join(ws, found) : null;
}

/**
 * The file a script owns, as its place in a workstream, or null where the path is none: every file in
 * an arc's data folder, its three data files and its name file alike, and the workstream's two records.
 * The workspace's own `.spndevex/state.json` is `spnutils`'s but for its `debug` node, and is not one of these.
 */
export function scriptOwned(path: string): { workstream: string; file: string } | null {
  const slashed = resolve(path).split(sep).join("/");
  const found = new RegExp(`^(.*\\/${workstreamPrefixSource()}[^/]+)/` +
    `(${ARCS}/N\\d+[a-z]?/[^/]+|${QUESTIONS_FILE}|${SUGGESTIONS_FILE})$`).exec(slashed);
  return found ? { workstream: found[1], file: found[2] } : null;
}

/** Every arc of a workstream kept as data: each `arcs/N<nnn>/` folder holding a `state.json`, in run order. */
export function arcIdsOf(ws: string): string[] {
  return listdir(join(ws, ARCS))
    .filter((entry) => ARC_ID.test(entry) && isFile(stateFileOf(ws, entry)))
    .sort(arcOrder);
}

/**
 * The workstream's first arc that is not landed, carried or dropped, by number, or null: read from its
 * data, or from the status line of an arc still kept as Markdown, which migration 001 brings over.
 */
export function firstOpenArc(ws: string): string | null {
  const open: string[] = [];
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc);
    if (data && typeof data.status === "string" && Array.isArray(data.rows) && !TERMINAL.has(arcStatus(data))) open.push(arc);
  }
  for (const file of markdownArcsOf(ws)) {
    const arc = /^(N\d+[a-z]?)(?=-|\.md$)/.exec(file)?.[1];
    let text = "";
    try { text = readFileSync(join(ws, ARCS, file), "utf8"); } catch { continue; }
    const word = /^\s*\*{0,2}Status:?\*{0,2}\s*\*{0,2}([A-Z][A-Z-]*)/m.exec(text)?.[1] ?? "";
    if (arc && !TERMINAL.has(word)) open.push(arc);
  }
  return open.sort(arcOrder)[0] ?? null;
}

/** Arcs by number, then by the letter after it. */
export function arcOrder(a: string, b: string): number {
  const [, an, al = ""] = /^N(\d+)([a-z]?)$/.exec(a) ?? [, "0", ""];
  const [, bn, bl = ""] = /^N(\d+)([a-z]?)$/.exec(b) ?? [, "0", ""];
  return Number(an) - Number(bn) || (al < bl ? -1 : al > bl ? 1 : 0);
}

/** The arcs a workstream still keeps as Markdown files directly under `arcs/`, which the one-time move brings over. */
export function markdownArcsOf(ws: string): string[] {
  return listdir(join(ws, ARCS)).filter((entry) => entry.endsWith(".md") && isFile(join(ws, ARCS, entry)));
}

/**
 * Whether a workstream is kept as data: it holds no arc as Markdown. A workstream with no arc yet is
 * kept as data from its first one.
 */
export const isDataLayout = (ws: string): boolean => markdownArcsOf(ws).length === 0;

/** The workstream folders of the given states. */
export function workstreamsOf(root: string, states: readonly WorkstreamState[] = HELD_STATES): string[] {
  return states.flatMap((state) => listdir(workstreamsDir(root, state))
    .map((entry) => join(workstreamsDir(root, state), entry))
    .filter(isDir));
}

/** The workspace a command works in: `SPN_WORKSPACE`, or the one the caller stands in. */
export const workspaceOf = (from: string = process.cwd()): string | null =>
  process.env.SPN_WORKSPACE ?? workspaceRoot(from);

/** The workstream a word names: a folder, a page in one, a number (`025`) or a folder name, in any state. */
export function findWorkstream(target: string, root: string | null, from: string = process.cwd()): string | null {
  const direct = resolve(from, target);
  if (isDir(direct) && (isDir(join(direct, ARCS)) || approachOf(direct))) return direct;
  if (isFile(direct) && isApproachPage(direct)) return dirname(direct);
  if (!root) return null;
  for (const state of WORKSTREAM_STATES) {
    const base = workstreamsDir(root, state);
    const found = listdir(base).find((entry) => entry === target || entry.startsWith(`${target}-`));
    if (found && isDir(join(base, found))) return join(base, found);
  }
  return null;
}

/** The workstream the caller stands in, or null. */
export function workstreamAround(from: string): string | null {
  const slashed = resolve(from).split(sep).join("/");
  const found = new RegExp(`^(.*\\/${workstreamPrefixSource()}[^/]+)(?:/|$)`).exec(slashed);
  return found ? found[1] : null;
}

/**
 * The workstream and the id a reference names: `025/N010`, `025-partner-web/q94`, or the id alone,
 * which is read in the workstream the caller stands in, or else in the one open or backlog
 * workstream that holds it. Throws a plain error naming what to type where it is not one.
 */
export function resolveRef(ref: string, holds: (ws: string, id: string) => boolean, from: string = process.cwd()): { ws: string; id: string } {
  const root = workspaceOf(from);
  const slash = ref.lastIndexOf("/");
  if (slash > 0) {
    const ws = findWorkstream(ref.slice(0, slash), root, from);
    if (!ws) throw new Error(`finds no workstream \`${ref.slice(0, slash)}\``);
    return { ws, id: ref.slice(slash + 1) };
  }
  const around = workstreamAround(from);
  if (around) return { ws: around, id: ref };
  const holders = root ? workstreamsOf(root).filter((ws) => holds(ws, ref)) : [];
  if (holders.length === 1) return { ws: holders[0], id: ref };
  if (!holders.length) throw new Error(`finds \`${ref}\` in no open or backlog workstream — name it as \`<workstream>/${ref}\``);
  throw new Error(`finds \`${ref}\` in ${holders.map((ws) => basename(ws)).join(" and ")} — name it as \`<workstream>/${ref}\``);
}

/** An arc reference resolved, where the arc's data exists or `allowNew` lets it be opened. */
export function resolveArc(ref: string, from: string = process.cwd(), allowNew = false): { ws: string; arc: string } {
  const { ws, id } = resolveRef(ref, (folder, arc) => isFile(stateFileOf(folder, arc)), from);
  if (!ARC_ID.test(id)) throw new Error(`reads \`${id}\` as no arc — an arc is \`N<nnn>\``);
  if (!allowNew && !isFile(stateFileOf(ws, id))) throw new Error(`finds no \`${ARCS}/${id}/${STATE_FILE}\` in ${basename(ws)}`);
  return { ws, arc: id };
}

// ---------------------------------------------------------------------------- reading and writing

/** A JSON file's value, or null where it is absent or does not parse. */
export function readJson(path: string): unknown {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

/** Every line of a `.jsonl` file, parsed; a line that does not parse is `undefined`, so a check can name it. */
export function readJsonl(path: string): unknown[] {
  let text = "";
  try { text = readFileSync(path, "utf8"); } catch { return []; }
  return text.split("\n").filter((line) => line.trim()).map((line) => {
    try { return JSON.parse(line); } catch { return undefined; }
  });
}

/** A file written whole: to a sibling first, then moved over, so a reader never sees half of it. */
export function writeWhole(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const scratch = `${path}.${process.pid}.tmp`;
  writeFileSync(scratch, text, "utf8");
  renameSync(scratch, path);
}

export function writeJsonl(path: string, records: readonly unknown[]): void {
  writeWhole(path, records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : ""));
}

export function appendJsonl(path: string, record: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`, "utf8");
}

/** An arc's change sheet, or null where it keeps none: the arc is then judged as it was before sheets. */
export function readSheet(ws: string, arc: string): Sheet | null {
  const data = readJson(sheetFileOf(ws, arc));
  return data && typeof data === "object" && !Array.isArray(data) ? data as Sheet : null;
}

/** An arc's data, or null where its `state.json` is absent or does not parse. */
export function readArc(ws: string, arc: string): ArcData | null {
  const data = readJson(stateFileOf(ws, arc));
  return data && typeof data === "object" ? data as ArcData : null;
}

/** Writes an arc's data after the schema passes it, and its name file with it. Throws with every fault where it does not. */
export function writeArc(ws: string, data: ArcData): void {
  const faults = arcFaults(data, `${data.arc}'s state.json`);
  if (faults.length) throw new Error(faults.join("; "));
  writeWhole(stateFileOf(ws, data.arc), `${JSON.stringify(data, null, 2)}\n`);
  writeNameFile(ws, data);
}

/**
 * Writes an arc's data at the version it holds, with no schema run: for a migration that changes data written under an
 * earlier version, which applies before the migration that brings the data to this one. Every other writer uses `writeArc`.
 */
export function writeArcAsIs(ws: string, data: ArcData): void {
  writeWhole(stateFileOf(ws, data.arc), `${JSON.stringify(data, null, 2)}\n`);
  writeNameFile(ws, data);
}

/** The Markdown files in an arc's data folder: its name file, and any other, which the check names. */
export const markdownIn = (ws: string, arc: string): string[] =>
  listdir(arcDataDir(ws, arc)).filter((entry) => entry.endsWith(".md") && isFile(join(arcDataDir(ws, arc), entry)));

/**
 * The arc's name file as the commands write it (RD.DEVEX.WORKSPACE.264): the title, the goal, the
 * status with its reason, what it decides, its repositories, then links to its row on the approach
 * page, its preview, its plan and its samples, each linked only where it is on disk. No rows, no log.
 */
export function nameFileText(ws: string, data: ArcData): string {
  const goal = typeof data.goal === "string" && data.goal.trim() ? data.goal.trim()
    : `(none yet: \`spn-devex workstream arc edit ${data.arc} --goal "…"\`)`;
  const lines = [
    `<!-- ${data.arc}'s name. \`spn-devex workstream arc edit\` and \`docs cycles write\` write it from state.json; never by hand. -->`,
    `# ${data.arc} — ${data.title}`,
    "",
    `**Goal.** ${goal}`,
    "",
    `**Status.** ${arcStatus(data)}${data.reason ? ` — ${data.reason}` : ""}${typeof data.wait === "string" && data.wait.trim() ? ` — wait: ${data.wait.trim()}` : ""}`,
  ];
  if (typeof data.decides === "string" && data.decides.trim()) lines.push("", `**Decides.** ${data.decides.trim()}`);
  if (Array.isArray(data.repos) && data.repos.length) lines.push("", `**Repos.** ${data.repos.join(" · ")}`);
  const notes = `../../${NOTES}/${data.arc}`;
  const links = [`[the arc on the approach page](${arcAddress(data.arc, "../../")})`];
  if (isFile(previewOf(ws, data.arc))) links.push(`[preview](${notes}/${PREVIEW_FILE})`);
  if (isFile(join(notesDirOf(ws, data.arc), "plan.md"))) links.push(`[plan](${notes}/plan.md)`);
  if (isDir(join(notesDirOf(ws, data.arc), "samples"))) links.push(`[samples](${notes}/samples/)`);
  lines.push("", `**Links.** ${links.join(" · ")}`, "");
  return lines.join("\n");
}

/**
 * Whether a name file on disk is the commands' own for the data. Its links follow what is on disk in
 * the arc's notes, so a sample added since does not make it a hand edit: the links line is compared
 * by its being there, and the next write of the arc brings it current.
 */
export function nameFileHolds(ws: string, data: ArcData, text: string): boolean {
  const LINKS = /^\*\*Links\.\*\* .*$/m;
  const wanted = nameFileText(ws, data);
  return LINKS.test(text) && text.replace(LINKS, "") === wanted.replace(LINKS, "");
}

/**
 * Writes the arc's name file where it differs, and removes any other Markdown file in its data folder,
 * so a subject changed renames it. Says whether it wrote.
 */
export function writeNameFile(ws: string, data: ArcData): boolean {
  const file = nameFileOf(ws, data.arc, data.subject);
  const text = nameFileText(ws, data);
  let wrote = false;
  for (const other of markdownIn(ws, data.arc))
    if (other !== `${data.subject}.md`) { rmSync(join(arcDataDir(ws, data.arc), other)); wrote = true; }
  let current: string | null = null;
  try { current = readFileSync(file, "utf8"); } catch { /* absent */ }
  if (current !== text) { writeWhole(file, text); wrote = true; }
  return wrote;
}

/** The instant a record carries: the local date and time with its offset. */
export const now = (): string => withOffset(new Date());

/** One event on an arc's log. */
export function logEvent(ws: string, arc: string, kind: string, row: string | null, note: string | null): void {
  appendJsonl(logFileOf(ws, arc), { at: now(), kind, row, note });
}

/** A new arc's data, `PROPOSED`, with no row. */
export function newArc(arc: string, subject: string, title: string): ArcData {
  return { schemaVersion: SCHEMA_VERSION, arc, subject, title, goal: null, status: "PROPOSED", reason: null,
           decides: null, repos: [], cycle: null, follows: null, model: null, preview: PREVIEW_FILE, rows: [] };
}

export function readQuestions(ws: string): Question[] {
  return readJsonl(questionsFileOf(ws)).filter((line): line is Question => !!line && typeof line === "object");
}

// ---------------------------------------------------------------------------- rows

/** A row's state, the rows under it decide where it has any. */
export function stateOfRow(rows: readonly ArcRow[], row: ArcRow): RowState {
  const children = rows.filter((one) => one.parent === row.id);
  if (!children.length) return (row.state ?? "waiting") as RowState;
  const states = children.map((child) => stateOfRow(rows, child));
  if (states.every((state) => DONE_STATES.has(state))) return states.includes("landed") ? "landed" : states[0];
  for (const state of ["running", "stopped", "ready"] as const) if (states.includes(state)) return state;
  return "waiting";
}

/** The rows that are work: those with no row under them. */
export function leafRows(data: ArcData): ArcRow[] {
  const parents = parentIds(data.rows);
  return data.rows.filter((row) => !parents.has(row.id));
}

/** Rows done of rows, counting only the rows that are work, of the kinds `which` keeps; every kind by default. */
export function doneOf(data: ArcData, which: (row: ArcRow) => boolean = () => true): { done: number; total: number } {
  const leaves = leafRows(data).filter(which);
  return { done: leaves.filter((row) => DONE_STATES.has(row.state ?? "")).length, total: leaves.length };
}

/** Steps done of steps, which a chip and *Overall* count: every row is a build step (RD.DEVEX.WORKSPACE.278). */
export const builtOf = (data: ArcData): { done: number; total: number } => doneOf(data);

// ---------------------------------------------------------------------------- the status: stored, or worked out

/** The step states a status does not count: work that left the arc or was taken over by later steps. */
const UNCOUNTED: ReadonlySet<string> = new Set(["deferred", "carried", "replaced"]);
/** The step states that say a step has started. */
const STARTED: ReadonlySet<string> = new Set(["running", "stopped", "replaced", "landed"]);

/**
 * THE ONE OWNER OF AN ARC'S STATUS (RD.DEVEX.WORKSPACE.307). The developer's words are stored: `PROPOSED`,
 * `DECIDED` with any wait, `CARRIED`, `DROPPED`, and `LANDED` where the close stored it. A stored `DECIDED` is worked
 * out from the steps each time it is read: `RUNNING` once a step has started, and `LANDED` once every step counted
 * has landed, the deferred, carried and replaced ones left out. The review-fixes arc reads `RUNNING` until the close
 * stores its `LANDED`. A stored `PROPOSED` wins over the steps. Every reader asks this, so no two disagree.
 */
export function arcStatus(data: Pick<ArcData, "status" | "rows" | "reviewFixes">): Status {
  const stored = (STATUSES as readonly string[]).includes(data.status) ? data.status as Status : "PROPOSED";
  if (stored !== "DECIDED" || !Array.isArray(data.rows)) return stored;
  const leaves = leafRows(data as ArcData);
  if (!leaves.some((row) => STARTED.has(row.state ?? ""))) return "DECIDED";
  const counted = leaves.filter((row) => !UNCOUNTED.has(row.state ?? ""));
  if (data.reviewFixes !== true && counted.length > 0 && counted.every((row) => row.state === "landed")) return "LANDED";
  return "RUNNING";
}

/** An arc's data as a reader shows it: its status worked out. Never written back: the stored status is the words. */
export const withStatus = <T extends ArcData>(data: T): T => ({ ...data, status: arcStatus(data) });

/** The status an arc of a workstream reads as, from its `state.json`, or null where it has no data that reads. */
export function statusOfData(ws: string, arc: string): Status | null {
  const data = readArc(ws, arc);
  return data && typeof data.status === "string" && (STATUSES as readonly string[]).includes(data.status) && Array.isArray(data.rows)
    ? arcStatus(data) : null;
}

/**
 * Whether the arc was ever decided: its stored status is past `PROPOSED`, or its log holds a move to `DECIDED` or an
 * opening at it. An arc never decided is deleted rather than dropped (RD.DEVEX.WORKSPACE.311).
 */
export function everDecided(data: Pick<ArcData, "status">, lines: readonly unknown[]): boolean {
  if (data.status !== "PROPOSED") return true;
  return lines.some((raw) => {
    const line = raw as LogLine | undefined;
    if (!line || typeof line !== "object") return false;
    const note = String(line.note ?? "");
    return (line.kind === "status" && /→ DECIDED\b/.test(note)) || (line.kind === "opened" && /^opened as DECIDED\b/.test(note));
  });
}

/** Whether a step may start on the arc: its stored status is `DECIDED`, the developer's go, and it holds no wait. */
export function stepsMayStart(data: Pick<ArcData, "status" | "wait">): boolean {
  return data.status === "DECIDED" && !(typeof data.wait === "string" && data.wait.trim());
}

// ---------------------------------------------------------------------------- an arc's moves, from its log

/** A status line's move, read from the head of its note: `FROM → TO`, as `arc edit` writes it. Null where the note names none. */
export function moveOf(note: unknown): { from: string; to: string } | null {
  const found = typeof note === "string" ? /^([A-Z][A-Z-]*) → ([A-Z][A-Z-]*)(?![A-Z-])/.exec(note) : null;
  return found ? { from: found[1], to: found[2] } : null;
}

/**
 * Where an arc's status moved, by the place of each line in its log, which is only ever appended to and so orders
 * every event. `toProposed` is the last line at which the arc moved to `PROPOSED` or opened there; `outOfProposed`
 * the first line at which it left `PROPOSED`, and `firstProposed` the line that began the `PROPOSED` it then left,
 * so a row landed between the two landed before the arc's first go. A status line whose note names no move (an
 * older line, written with the words alone) is read as a move from the status the log last showed; an `opened`
 * line that names no status opened the arc at `PROPOSED`, as `newArc` does. Null where the log holds no such line.
 */
export function statusMoves(lines: readonly unknown[]): { toProposed: number | null; outOfProposed: number | null; firstProposed: number | null } {
  let toProposed: number | null = null;
  let outOfProposed: number | null = null;
  let firstProposed: number | null = null;
  let shown: string | null = null;
  lines.forEach((raw, at) => {
    const line = raw as LogLine | undefined;
    if (!line || typeof line !== "object") return;
    if (line.kind === "opened") {
      shown = /^opened as ([A-Z][A-Z-]*)/.exec(String(line.note ?? ""))?.[1] ?? "PROPOSED";
      if (shown === "PROPOSED") toProposed = at;
      return;
    }
    if (line.kind !== "status") return;
    const move = moveOf(line.note);
    const from = move?.from ?? shown;
    if (from === "PROPOSED" && outOfProposed === null) { outOfProposed = at; firstProposed = toProposed; }
    shown = move?.to ?? null;
    if (shown === "PROPOSED") toProposed = at;
  });
  return { toProposed, outOfProposed, firstProposed };
}

/**
 * The place in an arc's log where each row landed: its last `landed` line, else, for a row landed now with no such
 * line, the line that added it, since a row can be added landed. A row with neither is not in the map.
 */
export function landedLines(data: ArcData, lines: readonly unknown[]): Map<string, number> {
  const out = new Map<string, number>();
  const added = new Map<string, number>();
  lines.forEach((raw, at) => {
    const line = raw as LogLine | undefined;
    if (!line || typeof line !== "object" || typeof line.row !== "string") return;
    if (line.kind === "landed") out.set(line.row, at);
    if (line.kind === "added" && !added.has(line.row)) added.set(line.row, at);
  });
  for (const row of data.rows)
    if (!out.has(row.id) && row.state === "landed" && added.has(row.id)) out.set(row.id, added.get(row.id)!);
  return out;
}

/** An arc's log, line by line, as `statusMoves` and `landedLines` read it. */
export const logLinesOf = (ws: string, arc: string): unknown[] => readJsonl(logFileOf(ws, arc));

/**
 * Whether a blocker has resolved: a row of the same arc or another arc that is done, an arc that is
 * terminal, or a card that is no longer open.
 */
export function blockerResolved(ws: string, data: ArcData, blocker: string, questions: readonly Question[] = readQuestions(ws)): boolean {
  if (QUESTION_ID.test(blocker)) return !questions.some((one) => one.id === blocker && one.state === "open");
  const cross = /^(N\d+[a-z]?)(?:\/(.+))?$/.exec(blocker);
  if (cross) {
    const other = cross[1] === data.arc ? data : readArc(ws, cross[1]);
    if (!other) return false;
    if (!cross[2]) return TERMINAL.has(arcStatus(other));
    const row = other.rows.find((one) => one.id === cross[2]);
    return !!row && DONE_STATES.has(stateOfRow(other.rows, row));
  }
  const row = data.rows.find((one) => one.id === blocker);
  return !!row && DONE_STATES.has(stateOfRow(data.rows, row));
}

/** The rows ready to run: work rows marked `ready`, or `waiting` with every blocker resolved, in a decided arc with no wait. */
export function readyRows(ws: string, data: ArcData, questions: readonly Question[] = readQuestions(ws)): ArcRow[] {
  if (!stepsMayStart(data)) return [];
  return leafRows(data).filter((row) => (row.state === "ready" || row.state === "waiting") &&
    (row.blockedBy ?? []).every((blocker) => blockerResolved(ws, data, blocker, questions)));
}

/** From ready rows in order, those that can run side by side: no two whose `touches` overlap. */
export function parallelRows<T extends { touches?: string[] }>(rows: readonly T[]): T[] {
  const taken = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const touches = row.touches ?? [];
    if (touches.some((place) => taken.has(place))) continue;
    for (const place of touches) taken.add(place);
    out.push(row);
  }
  return out;
}

// ---------------------------------------------------------------------------- the stamp

/** A row's repository cell that names no repository: the row changes none, so it reaches no place. */
export const NO_REPO: ReadonlySet<string> = new Set(["—", "–", "-"]);

/**
 * The repositories an arc reaches, sorted: its header's `repos` and the `repo` of each of its rows, without
 * a cell that names no repository. They are the places of the approach page's `How`.
 */
export function arcRepos(data: Pick<ArcData, "repos" | "rows">): string[] {
  const named = [...(Array.isArray(data.repos) ? data.repos : []), ...data.rows.map((row) => row.repo)]
    .filter((repo): repo is string => typeof repo === "string")
    .map((repo) => repo.trim())
    .filter((repo) => repo && !NO_REPO.has(repo));
  return [...new Set(named)].sort();
}

/**
 * The stamp of what the approach page states about an arc: a hash of its goal, its title and its
 * repositories, never of its rows. A row added, moved or landed inside the arc's goal does not move it, so
 * the check fires only when the goal, the title or a repository the arc reaches changes.
 */
export function arcStamp(data: Pick<ArcData, "goal" | "title" | "repos" | "rows">): string {
  const stated = [typeof data.goal === "string" ? data.goal.trim() : "", data.title.trim(), arcRepos(data)];
  return createHash("sha256").update(JSON.stringify(stated)).digest("hex").slice(0, 12);
}

/** Every Cycles row of a page that names an arc's data, with the stamp it carries. */
export function stampsOn(text: string): Map<string, { stamp: string | null; at: number; tag: string }> {
  const out = new Map<string, { stamp: string | null; at: number; tag: string }>();
  for (const found of text.matchAll(/<tr\b[^>]*\bdata-arc="(?:[^"]*\/)?(N\d+[a-z]?)\/state\.json"[^>]*>/g)) {
    const stamp = /\bdata-arc-stamp="([^"]*)"/.exec(found[0])?.[1] ?? null;
    out.set(found[1], { stamp, at: found.index!, tag: found[0] });
  }
  return out;
}

/** The page with one arc's Cycles row restamped, or null where the page has no row for it. */
export function restamped(text: string, arc: string, stamp: string): string | null {
  const row = stampsOn(text).get(arc);
  if (!row) return null;
  const tag = row.stamp === null
    ? row.tag.replace(/>$/, ` data-arc-stamp="${stamp}">`)
    : row.tag.replace(/\bdata-arc-stamp="[^"]*"/, `data-arc-stamp="${stamp}"`);
  return text.slice(0, row.at) + tag + text.slice(row.at + row.tag.length);
}

// ---------------------------------------------------------------------------- the generated blocks

/** The two generated kinds a workstream's pages hold; a kind is added only with the developer's approval. */
export const GENERATED_KINDS = ["progress", "open"] as const;
export type GeneratedKind = (typeof GENERATED_KINDS)[number];
const BLOCK_END = "<!-- /spn:generated -->";

/** Where one generated block sits: its opening marker's line, its inside, and its closing marker. */
export function blockAt(text: string, kind: GeneratedKind): { from: number; inner: number; innerEnd: number; to: number } | null {
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  const open = new RegExp(`^[ \\t]*<!--\\s*spn:generated\\s+${kind}\\b[^\\n]*-->[ \\t]*$`, "m").exec(text);
  if (!open) return null;
  const inner = open.index + open[0].length + 1;
  const end = text.indexOf(BLOCK_END, inner);
  if (end < 0) return null;
  const lineStart = text.lastIndexOf("\n", end) + 1;
  return { from: open.index, inner, innerEnd: lineStart, to: end + BLOCK_END.length };
}

/** Every generated region of a page, of either kind. */
export function blocksIn(text: string): Array<{ kind: GeneratedKind; from: number; to: number }> {
  return GENERATED_KINDS.flatMap((kind) => {
    const at = blockAt(text, kind);
    return at ? [{ kind, from: at.from, to: at.to }] : [];
  });
}

/** The page with one block's inside replaced, or null where the page holds no such block. */
export function withBlock(text: string, kind: GeneratedKind, inside: string): string | null {
  const at = blockAt(text, kind);
  if (!at) return null;
  return text.slice(0, at.inner) + inside + (inside.endsWith("\n") || !inside ? "" : "\n") + text.slice(at.innerEnd);
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const escapeHtml = (text: string): string => text.replace(/[&<>"]/g, (char) => ESCAPES[char]);

/** Plain record text as markup: escaped, and code in backticks as `<code>`. */
export function inline(text: string): string {
  return text.split(/(`[^`]+`)/).map((part) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? `<code>${escapeHtml(part.slice(1, -1))}</code>` : escapeHtml(part)).join("");
}

const share = (done: number, total: number): number => (total ? Math.round((done / total) * 100) : 0);

/** When an arc finished: its last landed or status line on its log, else its last line of any kind; "" where it has none. */
function finishedAt(ws: string, arc: string): string {
  const lines = readJsonl(logFileOf(ws, arc)).filter((line): line is LogLine => !!line && typeof line === "object" && typeof (line as LogLine).at === "string");
  const marks = lines.filter((line) => line.kind === "landed" || line.kind === "status");
  return (marks.length ? marks : lines).map((line) => line.at).sort().at(-1) ?? "";
}

/**
 * The arcs in the order they run: the done ones first, in the order they finished (`CARRIED` and `DROPPED` at the
 * time they closed); then `RUNNING`; then `DECIDED` and `PROPOSED` in the planned sequence, which is the arc's
 * `position`, an arc without one after the others. The number breaks every tie. Read with the status worked out.
 */
export function executionOrder<T extends ArcData>(ws: string, arcs: readonly T[]): T[] {
  const group = (data: ArcData): number => {
    const status = arcStatus(data);
    return TERMINAL.has(status) ? 0 : status === "RUNNING" ? 1 : 2;
  };
  const finished = new Map(arcs.filter((data) => group(data) === 0).map((data) => [data.arc, finishedAt(ws, data.arc)]));
  const position = (data: ArcData): number => (typeof data.position === "number" ? data.position : Number.MAX_SAFE_INTEGER);
  return [...arcs].sort((left, right) => group(left) - group(right)
    || (group(left) === 0 ? (finished.get(left.arc) ?? "").localeCompare(finished.get(right.arc) ?? "") : 0)
    || (group(left) === 2 ? position(left) - position(right) : 0)
    || left.arc.localeCompare(right.arc));
}

/**
 * A workstream's own word, which its page's header shows and *Overall* takes (05-artifacts.md § How ends in
 * Cycles): `DONE` for a workstream in `closed/`, `IMPLEMENTING` once the first step of any arc has started, which an
 * arc `RUNNING` or `LANDED` says, else `PLANNING`. Read from the arcs' worked-out statuses alone, so the header and
 * *Overall* cannot disagree.
 */
export function workstreamWord(ws: string, statuses: readonly (string | null)[]): "PLANNING" | "IMPLEMENTING" | "DONE" {
  if (basename(dirname(resolve(ws))) === "closed") return "DONE";
  return statuses.some((status) => status === "RUNNING" || status === "LANDED") ? "IMPLEMENTING" : "PLANNING";
}

/** How far along an arc is, in five steps of one hue by rows done (0-19, 20-39, 40-59, 60-79, 80-99 per cent), and `done` at 100. */
export function progressStep(done: number, total: number): string {
  const percent = share(done, total);
  return percent >= 100 && total ? "done" : String(Math.min(5, Math.floor(percent / 20) + 1));
}

/**
 * One arc's chip in the sticky card, two lines: its number without the N and its short name, with its count on
 * the right, and a thin bar. Its border colour says its status, worked out by `arcStatus`, and the status is in its
 * tooltip and accessible name. A chip counts its arc's steps (RD.DEVEX.WORKSPACE.278): the bar's shade is the chip's
 * third class, `sds-step-1` to `sds-step-5` by steps landed and `sds-step-done` at the end. An arc with no step yet
 * says its status, with no bar to fill. A wait or a reason is in the tooltip. The chip links the arc's Cycles row.
 */
/** The moment an arc's log last moved, as its last line wrote it; "" where the log holds no line. */
export function lastMoved(ws: string, arc: string): string {
  const stamped = readJsonl(logFileOf(ws, arc))
    .filter((line): line is LogLine => !!line && typeof line === "object" && typeof (line as LogLine).at === "string")
    .map((line) => ({ at: line.at, time: Date.parse(line.at) }))
    .filter((line) => Number.isFinite(line.time));
  return stamped.sort((left, right) => left.time - right.time).at(-1)?.at ?? "";
}

/**
 * What the progress block says of a running arc: the rows in progress, the next row ready to run, and when its
 * log last moved. Null for an arc that is not running, which has no line in the block.
 */
export function runningLine(ws: string, data: ArcData, questions: readonly Question[] = readQuestions(ws)): { inProgress: ArcRow[]; next: ArcRow | null; moved: string } | null {
  if (arcStatus(data) !== "RUNNING") return null;
  const inProgress = leafRows(data).filter((row) => row.state === "running");
  const next = readyRows(ws, data, questions).find((row) => !inProgress.includes(row)) ?? null;
  return { inProgress, next, moved: lastMoved(ws, data.arc) };
}

function arcChip(data: ArcData, ws: string, questions: readonly Question[]): string {
  const status = arcStatus(data);
  const running = runningLine(ws, data, questions);
  const rowWords = (row: ArcRow): string => `row ${row.id}, ${row.title}`;
  const runningWords = running ? [
    `in progress: ${running.inProgress.length ? running.inProgress.map(rowWords).join("; ") : "none"}`,
    `next ready: ${running.next ? rowWords(running.next) : "none"}`,
    `log last moved: ${running.moved || "never"}`,
  ] : [];
  const word = status.toLowerCase();
  const number = String(Number(data.arc.replace(/^N/, "")));
  const name = escapeHtml(data.subject.replace(/-/g, " "));
  const why = typeof data.wait === "string" && data.wait.trim() ? `wait: ${data.wait.trim()}` : data.reason ?? "";
  const reason = why ? `, ${escapeHtml(why)}` : "";
  const built = builtOf(data);
  const building = built.total > 0;
  const step = building ? progressStep(built.done, built.total) : "1";
  const count = building ? `${built.done}/${built.total}` : word;
  const width = building ? share(built.done, built.total) : 0;
  const said = `${built.done} of ${built.total} steps landed`;
  const label = `${data.arc} ${name}, ${status}, ${said}${reason}${runningWords.length ? `, ${escapeHtml(runningWords.join(", "))}` : ""}`;
  const tip = `<span class="sds-tip"><span class="sds-badge sds-status sds-${word}">${escapeHtml(status)}</span><strong>${escapeHtml(data.title)}</strong><span>${said}</span>${why ? `<span>${escapeHtml(why)}</span>` : ""}${runningWords.map((words) => `<span>${escapeHtml(words)}</span>`).join("")}</span>`;
  return `      <a class="sds-chip sds-${word} sds-step-${step}" href="#${data.arc}" aria-label="${label}">`
    + `<span class="sds-chip-line"><span class="sds-chip-name"><span class="sds-mono">${number}</span><span class="sds-chip-subject"> &middot; ${name}</span></span><span class="sds-arc-count">${count}</span></span>`
    + `<span class="sds-chip-bar"><i style="width:${width}%"></i></span>${tip}</a>`;
}

/**
 * The sticky card, fixed to the bottom of the window within the page's width: two sections side by side, divided
 * by a line. The arcs are on the left, one chip each, scrolling sideways inside their section; the overall line
 * is on the right, a highlighted section of two lines like a chip: Overall with steps landed, and a full-width bar;
 * the workstream's status is its left edge's colour and its tooltip, and it is the workstream's own word, the one
 * the page's header shows (`workstreamWord`), so the two never disagree; its bar counts build rows only
 * (RD.DEVEX.WORKSPACE.278). It is written as soon as the workstream has its first arc, and each arc is a chip from
 * then on.
 */
function statusBar(ws: string, arcs: readonly ArcData[], closed: number): string[] {
  if (!arcs.length) return [];
  const questions = readQuestions(ws);
  const counts = arcs.map(builtOf);
  const done = counts.reduce((sum, one) => sum + one.done, 0);
  const total = counts.reduce((sum, one) => sum + one.total, 0);
  const word = workstreamWord(ws, arcs.map(arcStatus));
  return [
    `  <nav class="sds-footbar" aria-label="Workstream status">`,
    `    <div class="sds-footbar-chips">`,
    ...arcs.map((data) => arcChip(data, ws, questions)),
    `    </div>`,
    `    <div class="sds-footbar-summary sds-${word.toLowerCase()} sds-step-${progressStep(done, total)}" tabindex="0" aria-label="Workstream ${word}, ${done} of ${total} steps landed, ${closed} of ${arcs.length} arcs closed">`,
    `      <span class="sds-chip-line"><span class="sds-chip-name">Overall</span><span class="sds-arc-count">${done}/${total}</span></span>`,
    `      <span class="sds-chip-bar"><i style="width:${share(done, total)}%"></i></span>`,
    `      <span class="sds-tip"><span class="sds-badge sds-status sds-${word.toLowerCase()}">${word}</span><strong>Overall</strong><span>${closed} of ${arcs.length} arcs closed</span><span>${done} of ${total} steps landed</span></span>`,
    `    </div>`,
    `  </nav>`,
  ];
}

/** The inside of the progress block: the sticky card alone, its chips in the order the arcs run. Progress shows nowhere else on the page. */
export function progressInside(ws: string, arcs: readonly ArcData[] = arcIdsOf(ws).map((arc) => readArc(ws, arc)!).filter(Boolean)): string {
  const closed = arcs.filter((data) => TERMINAL.has(arcStatus(data))).length;
  const lines = statusBar(ws, executionOrder(ws, arcs), closed);
  return lines.length ? `${lines.join("\n")}\n` : "";
}

/** Writes the progress block of a workstream's page. Says what it did in a line, and never throws. */
export function writeProgress(ws: string): string {
  const page = approachOf(ws);
  if (!page) return `${basename(ws)} has no approach page — no progress block written`;
  const text = readFileSync(page, "utf8");
  const next = withBlock(text, "progress", progressInside(ws));
  if (next === null) return `${relative(dirname(ws), page)} holds no progress block — place its markers under the Cycles table, as the approach template does`;
  if (next === text) return "progress current";
  writeFileSync(page, next, "utf8");
  return "progress written";
}

// ---------------------------------------------------------------------------- a preview's status

const SEPARATOR = `<span class="sds-separator">|</span>`;
const LINE_OPEN = `<span class="sds-line">`;
const STATE_OPEN = `<span class="sds-state">`;

/** Where the span opening at `from` closes: the index just past its `</span>`, counting the spans inside it; -1 where it never does. */
function spanEnd(text: string, from: number): number {
  const tag = /<span\b[^>]*>|<\/span>/g;
  tag.lastIndex = from;
  let depth = 0;
  for (let found = tag.exec(text); found; found = tag.exec(text)) {
    depth += found[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return found.index + found[0].length;
  }
  return -1;
}

/** The header's arc fact as the commands write it: the arc's badge, which links the arc's row on the approach page. */
export function previewArc(arc: string): string {
  return `<span class="sds-label">Arc:</span> <a class="sds-badge" href="${arcAddress(arc, "../../")}">${escapeHtml(arc)}</a>`;
}

/**
 * The header's status as the commands write it: the arc's status, `PROPOSED` until the design is decided, as its
 * badge, which links the arc's row on the approach page.
 */
export function previewState(arc: string, status: string): string {
  return `${STATE_OPEN}<span class="sds-label">Status:</span> `
    + `<a class="sds-badge sds-status sds-${status.toLowerCase()}" href="${arcAddress(arc, "../../")}">${escapeHtml(status)}</a></span>`;
}

/**
 * A preview's page with its header naming its arc and showing the arc's status (RD.DEVEX.WORKSPACE.266): the header
 * line keeps its other facts, loses any `Arc:` or `Arc file:` fact of its own and the status it showed, gains the
 * arc fact `previewArc` writes right after the type, and ends in the state `previewState` writes. The page as it
 * was where it has no header line.
 */
export function previewWithStatus(text: string, arc: string, status: string): string {
  const eyebrow = text.indexOf(`<div class="sds-eyebrow"`);
  if (eyebrow < 0) return text;
  const lineAt = text.indexOf(LINE_OPEN, eyebrow);
  const eyebrowEnd = text.indexOf("</div>", eyebrow);
  if (lineAt < 0 || (eyebrowEnd >= 0 && lineAt > eyebrowEnd)) return text;
  const lineEnd = spanEnd(text, lineAt);
  if (lineEnd < 0) return text;
  let inner = text.slice(lineAt + LINE_OPEN.length, lineEnd - "</span>".length);
  const stateAt = inner.indexOf(STATE_OPEN);
  if (stateAt >= 0) {
    const stateEnd = spanEnd(inner, stateAt);
    if (stateEnd < 0) return text;
    inner = inner.slice(0, stateAt) + inner.slice(stateEnd);
  }
  const facts = inner.split(SEPARATOR).filter((fact) => fact.trim() && !/^\s*<span class="sds-label">Arc(?: file)?:<\/span>/.test(fact));
  const typeAt = facts.findIndex((fact) => /^\s*<span class="sds-label">Type:<\/span>/.test(fact));
  facts.splice(typeAt + 1, 0, previewArc(arc));
  const line = `${LINE_OPEN}${facts.join(SEPARATOR)}${previewState(arc, status)}</span>`;
  return text.slice(0, lineAt) + line + text.slice(lineEnd);
}

/**
 * Each line of a preview whose text says "proposed", in any case, with its number and its text: what the go's write
 * lists so the agent brings it current (RD.DEVEX.WORKSPACE.273). The text is the line with its tags taken out, so a
 * class such as `sds-proposed` is no text; a comment, the page's `spn:doc` block among them, is none either, and the
 * masthead's status badge is left out. Nothing checks these lines: which of them is still a proposal is the agent's
 * to read.
 */
export function proposedLines(text: string): Array<{ line: number; text: string }> {
  const uncommented = text.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ""));
  const out: Array<{ line: number; text: string }> = [];
  uncommented.split("\n").forEach((raw, at) => {
    let line = raw;
    const state = line.indexOf(STATE_OPEN);
    if (state >= 0) {
      const end = spanEnd(line, state);
      line = line.slice(0, state) + (end < 0 ? "" : line.slice(end));
    }
    const words = line.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim();
    // The template's own section heading, Proposed, names a part of every preview and is never a line to bring current.
    if (/\bproposed\b/i.test(words) && words !== "Proposed") out.push({ line: at + 1, text: words });
  });
  return out;
}

/**
 * Writes the arc's status into the header of each preview of an arc kept as data, from the arc's `state.json`,
 * and its `Open` from `questions.jsonl`, so a preview no card is shown on carries no `Open` section, the
 * template's empty one included. Every `workstream` write and `docs cycles write` call it, so neither is
 * typed. A closed workstream's previews stay as they closed. Returns the previews it changed, from the workstream.
 */
export function writePreviewStatus(ws: string): string[] {
  if (basename(dirname(resolve(ws))) === "closed") return [];
  const wrote: string[] = [];
  const questions = readQuestions(ws);
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc);
    const path = previewOf(ws, arc);
    if (!data || typeof data.status !== "string" || !isFile(path)) continue;
    const text = readFileSync(path, "utf8");
    const next = previewWithOpen(ws, path, previewWithStatus(text, arc, arcStatus(data)), questions);
    if (next !== text) { writeFileSync(path, next, "utf8"); wrote.push(fromWorkstream(ws, path)); }
  }
  return wrote;
}

/** One question rendered as the approach template's card. */
export function cardHtml(question: Pick<Question, "id" | "title"> & { card: Card }, indent = "  "): string {
  const number = question.id.replace(/^q/, "Q");
  const { card } = question;
  const lines = [
    `<div class="sds-open">`,
    `  <h4 id="${question.id}">${number} &middot; ${inline(question.title)}</h4>`,
    `  <span class="sds-key">Why it matters</span>`,
    `  <p>${inline(card.why)}</p>`,
    `  <span class="sds-key">What</span>`,
    `  <p>${inline(card.what)}</p>`,
    `  <span class="sds-key">Views</span>`,
    `  <p>${inline(card.viewsLead)}</p>`,
    ...card.views.map((view) => `  <p><strong>${inline(view.lens)}:</strong> ${inline(view.text)}</p>`),
    `  <span class="sds-key">Options</span>`,
    `  <div class="sds-scroll"><table>`,
    `    <thead><tr><th></th><th>What it does</th><th>What it costs</th></tr></thead>`,
    `    <tbody>`,
    ...card.options.map((option) => `      <tr><td><strong>${inline(option.key)}</strong></td><td>${inline(option.does)}</td><td>${inline(option.costs)}</td></tr>`),
    `    </tbody>`,
    `  </table></div>`,
    `  <div class="sds-recommended"><b>Recommended: ${inline(card.recommended.key)}.</b> ${inline(card.recommended.reason)}</div>`,
    `</div>`,
  ];
  return lines.map((line) => `${indent}${line}`).join("\n");
}

/** The heading `Open` carries: each open card by its number, or that none is open. */
export function openHeading(questions: readonly Pick<Question, "id">[]): string {
  return questions.length
    ? `Open &mdash; ${questions.map((one) => one.id.replace(/^q/, "Q")).join(" &middot; ")}`
    : "Open &mdash; no card is open";
}

/** The open questions in number order. */
export const openQuestions = (questions: readonly Question[]): Question[] =>
  questions.filter((one) => one.state === "open").sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

/** The inside of the approach page's `open` block: the heading, then every open card. */
export function approachOpenInside(questions: readonly Question[]): string {
  const open = openQuestions(questions);
  return [`  <div class="sds-section-head"><h2>${openHeading(open)}</h2></div>`, ...open.map((one) => cardHtml(one))].join("\n") + "\n";
}

/** The workstream-relative path of a page, with forward slashes. */
export const fromWorkstream = (ws: string, page: string): string => relative(ws, resolve(ws, page)).split(sep).join("/");

/** The inside of a preview's `open` block: the heading, the line back to the approach page, then its cards. */
export function previewOpenInside(ws: string, preview: string, questions: readonly Question[]): string {
  const shown = openQuestions(questions).filter((one) => one.shownIn.includes(fromWorkstream(ws, preview)));
  const back = relative(dirname(resolve(ws, preview)), join(ws, APPROACH_PAGE)).split(sep).join("/");
  return [
    `  <div class="sds-section-head"><h2>${openHeading(shown)}</h2></div>`,
    `  <p class="sds-standfirst">The questions this page raises, each answered on the approach page &rarr; <a href="${back}#s4">Open on the approach page</a></p>`,
    ...shown.map((one) => cardHtml(one)),
  ].join("\n") + "\n";
}

const OPEN_SECTION_MARKER = "<!-- spn:generated open — do not edit inside these markers; `workstream question show` writes it from questions.jsonl -->";

/**
 * The id of the section the tool adds for a preview's `Open`. A page numbers its own sections
 * `s1`, `s2` and on, so a word no page numbers with never clashes with one of them.
 */
const OPEN_SECTION_ID = "open";
/** A page drawn from the preview template, or written by an earlier plugin, holds its `Open` in `s5`. */
const OPEN_SECTION_IDS: readonly string[] = [OPEN_SECTION_ID, "s5"];

/** The section around the open block, where its id is one the `Open` section carries; null otherwise. */
function openSectionAround(text: string, at: { from: number; to: number }): { from: number; to: number; id: string; idAt: number } | null {
  const opens = text.lastIndexOf("<section", at.from);
  const closes = text.indexOf("</section>", at.to);
  if (opens < 0 || closes < 0 || text.slice(opens, at.from).includes("</section>")) return null;
  const tag = /^<section\b[^>]*>/.exec(text.slice(opens));
  const id = tag ? /\bid="([^"]*)"/.exec(tag[0]) : null;
  if (!tag || !id || !OPEN_SECTION_IDS.includes(id[1]) || opens + tag[0].length > at.from) return null;
  return { from: opens, to: closes + "</section>".length, id: id[1], idAt: opens + id.index };
}

/**
 * A preview's page with its `Open` current: the block rewritten, added as the last section where a
 * card is shown and the page has none, and the section dropped where no card is shown there. The
 * block is found by its marker; its section by the id `open`, or `s5`. A section held as `s5` on a
 * page where another element also carries `s5` is given the id `open` as the block is written.
 */
export function previewWithOpen(ws: string, preview: string, text: string, questions: readonly Question[]): string {
  const rel = fromWorkstream(ws, preview);
  const shown = openQuestions(questions).filter((one) => one.shownIn.includes(rel));
  const at = blockAt(text, "open");
  if (!shown.length) {
    if (!at) return text;
    const section = openSectionAround(text, at);
    if (!section) return text.slice(0, at.from).replace(/[ \t]*$/, "") + text.slice(at.to).replace(/^\n?/, "");
    return text.slice(0, section.from).replace(/[ \t]*$/, "") + text.slice(section.to).replace(/^\n?/, "");
  }
  const inside = previewOpenInside(ws, preview, questions);
  if (at) {
    const written = withBlock(text, "open", inside)!;
    const section = openSectionAround(written, blockAt(written, "open")!);
    if (!section || section.id === OPEN_SECTION_ID) return written;
    const idText = `id="${section.id}"`;
    const carriersOfId = written.split(idText).length - 1;
    if (carriersOfId < 2) return written;
    return written.slice(0, section.idAt) + `id="${OPEN_SECTION_ID}"` + written.slice(section.idAt + idText.length);
  }
  const section = `<section id="${OPEN_SECTION_ID}" data-block="reasons">\n  ${OPEN_SECTION_MARKER}\n${inside}  ${BLOCK_END}\n</section>\n`;
  const last = text.lastIndexOf("</section>");
  if (last < 0) return `${text}\n${section}`;
  const after = last + "</section>".length;
  return `${text.slice(0, after)}\n\n${section.replace(/\n$/, "")}${text.slice(after)}`;
}

/**
 * Writes every page's `Open` from the records: the approach page's block, and each preview a record
 * shows its card on or a page whose block shows a card no longer open. Returns the pages it changed,
 * from the workstream, and what it could not write.
 */
export function writeOpenBlocks(ws: string, questions: readonly Question[] = readQuestions(ws)): { wrote: string[]; skipped: string[] } {
  const wrote: string[] = [];
  const skipped: string[] = [];
  const page = approachOf(ws);
  if (page) {
    const text = readFileSync(page, "utf8");
    const next = withBlock(text, "open", approachOpenInside(questions));
    if (next === null) skipped.push(`${fromWorkstream(ws, page)} holds no open block — its Open is the block the approach template draws`);
    else if (next !== text) { writeFileSync(page, next, "utf8"); wrote.push(fromWorkstream(ws, page)); }
  }
  const previews = new Set<string>(questions.flatMap((one) => one.shownIn));
  for (const arc of listdir(join(ws, NOTES))) if (isFile(previewOf(ws, arc))) previews.add(fromWorkstream(ws, previewOf(ws, arc)));
  for (const rel of [...previews].sort()) {
    const path = join(ws, rel);
    if (!isFile(path)) continue;
    const text = readFileSync(path, "utf8");
    const next = previewWithOpen(ws, path, text, questions);
    if (next !== text) { writeFileSync(path, next, "utf8"); wrote.push(rel); }
  }
  return { wrote, skipped };
}

// ---------------------------------------------------------------------------- an arc's preview and its What entry

/** The id an arc's entry in the approach page's What carries, on its heading or as an anchor on a subject heading. */
export const whatId = (arc: string): string => `${arc}-what`;

/** Where the plugin keeps the book's templates for a workstream: the nearest folder above this file, or the bundle that holds it, that has them. */
function workstreamTemplates(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const found = join(dir, PLUGIN_TEMPLATES, "workstream");
    if (isDir(found)) return found;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** A slug as words in title case: `evidence-export` reads `Evidence Export`. */
export const titleCase = (slug: string): string => slug.split("-").filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

/** The workstream's number and its title as the approach page names it: `031 - Compliance Certification`. */
export function workstreamName(ws: string): { number: string; title: string } {
  const found = /^(\d+)-(.+)$/.exec(basename(ws));
  const number = found ? found[1] : basename(ws);
  return { number, title: `${number} - ${found ? titleCase(found[2]) : basename(ws)}` };
}

/**
 * A new arc's preview from the book's template: the masthead filled from the arc and its workstream, the back link
 * naming the arc's What entry, the badge reading the arc's status, and the template's own header comment left out.
 * The subtitle, the description and each section's standfirst stay slots for the agent.
 */
export function previewFromTemplate(ws: string, data: Pick<ArcData, "arc" | "subject" | "title" | "status">): string {
  const dir = workstreamTemplates();
  if (!dir) throw new Error("finds no approach-preview-template.html among the plugin's references");
  let text = readFileSync(join(dir, "approach-preview-template.html"), "utf8");
  const start = text.indexOf("<meta charset");
  if (start > 0) text = text.slice(start);
  const { number, title } = workstreamName(ws);
  const page = approachOf(ws);
  const workspace = page ? /<span class="sds-line1">([^<&]*?)\s*&nbsp;\|&nbsp;/.exec(readFileSync(page, "utf8"))?.[1] : undefined;
  const json = (value: string): string => JSON.stringify(value).slice(1, -1);
  text = text.replace(/<!-- spn:doc[\s\S]*?-->/, (block) => block
    .replace("ws-{{NNN}}-{{slug}}-{{preview-slug}}", json(`ws-${basename(ws)}-${data.subject}`))
    .replace("{{THE PREVIEW NAME}}", json(data.title)));
  const slots: Array<[string, string]> = [
    ["{{THE ARC'S SUBJECT, IN TITLE CASE}}", titleCase(data.subject)],
    ["{{THE PREVIEW NAME}}", escapeHtml(data.title)],
    ["{{NNN}} - {{TITLE}}", title],
    ["{{NNN}}", number],
    ["{{nnn}}", data.arc.slice(1)],
    ["{{arc status}}", data.status.toLowerCase()],
    ["{{THE ARC'S STATUS}}", data.status],
    ["{{date}}", now().slice(0, 10)],
  ];
  if (workspace) slots.push(["{{WORKSPACE}}", workspace]);
  for (const [slot, value] of slots) text = text.split(slot).join(value);
  return previewWithStatus(text, data.arc, data.status);
}

/** The parts of an HTML text that are slots, `{{…}}`, each with its line, in order. */
export function slotsIn(text: string): Array<{ line: number; slot: string }> {
  const out: Array<{ line: number; slot: string }> = [];
  for (const found of text.matchAll(/\{\{(?:(?!\{\{|\}\})[\s\S])*\}\}/g))
    out.push({ line: text.slice(0, found.index!).split("\n").length, slot: found[0] });
  return out;
}

/** The span of the approach page's What: from just past its `h2` to the next `h2` or the section's close. */
export function whatRange(text: string): { from: number; to: number } | null {
  const heading = /<h2\b[^>]*>\s*What\b[\s\S]*?<\/h2>/i.exec(text);
  if (!heading) return null;
  const from = heading.index + heading[0].length;
  const next = text.slice(from).search(/<h2\b|<\/section>/i);
  return { from, to: next < 0 ? text.length : from + next };
}

type Heading = { at: number; end: number; level: number; id: string | null };

/** Every heading that opens inside a span of the page, with where its tag sits and its id. */
function headingsIn(text: string, range: { from: number; to: number }): Heading[] {
  const out: Heading[] = [];
  for (const found of text.slice(range.from, range.to).matchAll(/<h([1-6])\b([^>]*)>/gi))
    out.push({ at: range.from + found.index!, end: range.from + found.index! + found[0].length, level: Number(found[1]), id: /\bid="([^"]*)"/.exec(found[2])?.[1] ?? null });
  return out;
}

/** A heading's words as a person reads them, tags gone. */
function headingWords(text: string, head: Heading): string {
  const close = text.indexOf(`</h${head.level}>`, head.end);
  return text.slice(head.end, close < 0 ? head.end : close).replace(/<[^>]*>/g, "").replace(/&middot;/g, "·").replace(/&amp;/g, "&").replace(/&mdash;/g, "—").replace(/\s+/g, " ").trim();
}

/**
 * An arc's entry in What (RD.DEVEX.WORKSPACE.254): the heading carrying its id, or the subject heading that holds the id as
 * an anchor, to the next heading of the same level or higher. Null where What holds neither.
 */
export function whatEntryOf(text: string, arc: string): { from: number; to: number; kind: "entry" | "anchor" } | null {
  const range = whatRange(text);
  if (!range) return null;
  const heads = headingsIn(text, range);
  const id = whatId(arc);
  let at = heads.findIndex((head) => head.id === id);
  let kind: "entry" | "anchor" = "entry";
  if (at < 0) {
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
    const span = new RegExp(`<span\\b[^>]*\\bid="${id}"[^>]*>\\s*</span>`).exec(text.slice(range.from, range.to));
    if (!span) return null;
    at = heads.filter((head) => head.at < range.from + span.index).length - 1;
    kind = "anchor";
  }
  if (at < 0) return null;
  const next = heads.slice(at + 1).find((head) => head.level <= heads[at].level);
  return { from: heads[at].at, to: next ? next.at : range.to, kind };
}

/** Every link of an HTML text that points inside the workspace's files, as written and as a path from `base`, fragment left off. */
export function localLinks(html: string, base: string): Array<{ href: string; path: string }> {
  const out: Array<{ href: string; path: string }> = [];
  for (const found of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    const href = found[1].replace(/&amp;/g, "&");
    if (!href || href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    out.push({ href, path: resolve(base, href.replace(/[#?].*$/, "")) });
  }
  return out;
}

/** Where each arc's preview sits, as a path, and whose it is: the fixed place, or the path an arc carried elsewhere names. */
export function previewOwners(ws: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc);
    if (data) out.set(resolve(ws, previewHrefOf(arc, data)), arc);
  }
  return out;
}

const entryHtml = (data: Pick<ArcData, "arc" | "title" | "goal" | "preview">): string => [
  `  <h4 id="${whatId(data.arc)}">${inline(data.title)}</h4>`,
  `  <p>${inline(typeof data.goal === "string" ? data.goal : "")}</p>`,
  `  <p>Read the preview &rarr; <a href="${previewHrefOf(data.arc, data)}">${inline(data.title)}</a></p>`,
].join("\n");

/**
 * The approach page with an arc's What entry written (RD.DEVEX.WORKSPACE.254), and how: under a domain heading, `h3`,
 * `under` names, at the end of that heading's part; as an anchor, `<span id="N<nnn>-what"></span>`, on a subject heading,
 * `h4` or lower, that `under` names; or at the end of What where `under` is null. Throws where What holds no such heading.
 */
export function withWhatEntry(text: string, data: Pick<ArcData, "arc" | "title" | "goal" | "preview">, under: string | null): { text: string; how: "entry" | "anchor"; where: string } {
  const range = whatRange(text);
  if (!range) throw new Error("finds no What on the approach page to write the entry in");
  const heads = headingsIn(text, range);
  let insertAt = range.to;
  let where = "at the end of What";
  if (under !== null) {
    const at = heads.findIndex((head) => head.id === under);
    if (at < 0 || heads[at].level < 3)
      throw new Error(`finds no domain or subject heading \`${under}\` in the approach page's What — \`--under\` takes the id of an \`h3\` domain heading to write the entry under, or of an \`h4\` subject heading to anchor it on`);
    const head = heads[at];
    if (head.level >= 4)
      return { text: `${text.slice(0, head.end)}<span id="${whatId(data.arc)}"></span>${text.slice(head.end)}`, how: "anchor", where: `anchored on ${under}` };
    const next = heads.slice(at + 1).find((one) => one.level <= head.level);
    insertAt = next ? next.at : range.to;
    where = `under ${under}, ${headingWords(text, head)}`;
  }
  let cut = insertAt;
  while (cut > 0 && /\s/.test(text[cut - 1])) cut -= 1;
  return { text: `${text.slice(0, cut)}\n${entryHtml(data)}${text.slice(cut)}`, how: "entry", where };
}

/** The page with the preview link inside an arc's What entry pointed at `to`; the page as it was where there is no entry or no such link. */
export function withEntryLink(text: string, arc: string, from: string, to: string): string {
  const entry = whatEntryOf(text, arc);
  if (!entry) return text;
  const inside = text.slice(entry.from, entry.to).split(`href="${from}"`).join(`href="${to}"`);
  return text.slice(0, entry.from) + inside + text.slice(entry.to);
}

// ---------------------------------------------------------------------------- landing on a run

/** Where a repository's run files can be: its checkout in the workspace, and each worktree of the workstream's set that begins with its name. */
function runPlaces(ws: string, repo: string): string[] {
  const root = dirname(dirname(dirname(dirname(ws))));
  const base = basename(dirname(root)) === ".worktrees" ? dirname(dirname(root)) : root;
  const set = join(base, ".worktrees", basename(ws));
  return [join(base, repo), ...listdir(set).filter((name) => name.startsWith(repo)).map((name) => join(set, name))].filter(isDir);
}

/** The newest commit time among a row's commits in its repository, or null where git knows none of them. */
function lastCommitOf(places: readonly string[], shas: readonly string[]): { at: number; sha: string } | null {
  let last: { at: number; sha: string } | null = null;
  for (const sha of shas) for (const cwd of places) {
    try {
      const at = Date.parse(execFileSync("git", ["log", "-1", "--format=%cI", sha], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
      if (!Number.isNaN(at)) { if (!last || at > last.at) last = { at, sha }; break; }
    } catch { /* try the next place */ }
  }
  return last;
}

const SHOWN: Record<string, string> = { FAILED: "FAILURE", PENDING: "PENDING", SUCCESS: "SUCCESS" };

/**
 * Whether a row may land on a run (RD.DEVEX.WORKSPACE.326–.331): null where it may, else the words of the refusal.
 * An arc with no sheet, and a row that is neither CODE nor PROOF, are judged as before sheets and get null.
 */
export function landingFault(ws: string, arc: string, data: ArcData, row: ArcRow, run: string | null): string | null {
  const sheet = readSheet(ws, arc);
  if (!sheet || (row.altitude !== "CODE" && row.altitude !== "PROOF")) return null;
  const entries = Array.isArray(sheet.entries) ? sheet.entries : [];
  if (!run)
    return `row ${row.id} is a ${row.altitude} row of an arc that keeps a sheet; it lands on a run of its entries' tests.\n`
      + `Name the run: \`workstream row state ${arc} ${row.id} landed --run <name>\`.`;
  const repo = row.repo ?? "";
  const mine = entries.filter((one) => (row.entries ?? []).includes(one.id));
  if (row.altitude === "CODE" && !mine.some((one) => Object.values(one.tiers ?? {}).some((ids) => ids.length)))
    return `row ${row.id} is a CODE row and its entries name no test; \`workstream sheet check ${arc}\` lists what is missing.`;

  const places = runPlaces(ws, repo);
  const found = places.map((place) => ({ place, runs: namedRun(place, run).runs })).filter((one) => one.runs.length);
  if (!found.length) return `${run} is in none of ${places.length ? places.join(" · ") : `the places of ${repo || "the row's repository"}`}.`;
  if (found.length > 1) return `${run} is in two places, ${found.map((one) => one.place).join(" and ")}; name a run that is in one.`;
  const runs: Run[] = found[0].runs;

  const shas = row.commits?.[repo] ?? [];
  if (!shas.length) return `row ${row.id} has no commit in ${repo || "its repository"}; \`workstream report write\` records them.`;
  const last = lastCommitOf(places, shas);
  const ranAt = runs.map((one) => one.ranAt).filter(Boolean).sort()[0] ?? null;
  if (last && ranAt && Date.parse(ranAt) < last.at) return `${run} was taken before ${last.sha.slice(0, 8)}, row ${row.id}'s last commit.`;

  const statusAt = (tier: string, id: string): string[] =>
    runs.flatMap((one) => one.results).filter((result) => result.id === id && String(result.tier).toLowerCase() === tier).map((result) => result.status);
  const faults: string[] = [];
  const judge = (tier: string, ids: readonly string[]): void => {
    for (const id of ids) {
      const seen = statusAt(tier, id);
      if (!seen.length) {
        const other = runs.flatMap((one) => one.results).filter((result) => result.id === id).map((result) => String(result.tier).toLowerCase());
        faults.push(other.length ? `${tier} ${id} is not in ${run} at ${tier}; it reads ${SHOWN[worst(runs.flatMap((one) => one.results).filter((result) => result.id === id).map((result) => result.status))]} at ${[...new Set(other)].join(", ")} only`
          : `${id} is not in the run`);
      } else if (worst(seen) !== "SUCCESS") faults.push(`${tier} ${id} reads ${SHOWN[worst(seen)]} in ${run}`);
    }
  };
  if (row.altitude === "CODE") {
    for (const one of mine) for (const [tier, ids] of Object.entries(one.tiers ?? {})) judge(tier, ids);
  } else {
    const owed = new Map<string, Set<string>>();
    for (const one of entries.filter((entry) => entry.file.startsWith(`${repo}:`)))
      for (const [tier, ids] of Object.entries(one.tiers ?? {})) owed.set(tier, new Set([...(owed.get(tier) ?? []), ...ids]));
    for (const [tier, ids] of owed) {
      judge(tier, [...ids]);
      for (const result of runs.flatMap((one) => one.results))
        if (String(result.tier).toLowerCase() === tier && result.status === "FAILED" && !ids.has(result.id)) faults.push(`${tier} ${result.id} reads FAILURE in ${run}`);
    }
  }
  return faults.length ? [...new Set(faults)].join(" · ") + "." : null;
}
