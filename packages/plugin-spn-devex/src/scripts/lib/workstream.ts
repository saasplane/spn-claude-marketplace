// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is named for the cycle it pays · § The workstream is kept as data, and every file has one owner · § The folder · § The formats · § The approach page keeps up with its arcs · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// The shared state library: where each file a script owns sits, how it is read and written, the
// stamp of an arc's rows, and the two generated blocks a page holds. Every `workstream` command, the
// checks and the hooks read through it, so a path or a format is spelled once.

import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { TERMINAL, pastDecided } from "../checks/arc-status.ts";
import { withOffset } from "./clock.ts";
import { isDir, isFile, listdir, workspaceRoot } from "./payload.ts";
import { APPROACH_PAGE, ARCS, WORKSTREAM_STATES, isApproachPage, workstreamPrefixSource, workstreamsDir, type WorkstreamState } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import {
  ARC_ID, DONE_STATES, QUESTION_ID, SCHEMA_VERSION, arcFaults, parentIds,
  type ArcData, type ArcRow, type Card, type Question, type RowState,
} from "./workstream-schema.ts";

// ---------------------------------------------------------------------------- the folder

export const NOTES = "notes";
export const STATE_FILE = "state.json";
export const LOG_FILE = "log.jsonl";
export const FACTS_FILE = "facts.jsonl";
export const QUESTIONS_FILE = "questions.jsonl";
export const SUGGESTIONS_FILE = "suggestions.jsonl";
/** An arc's one preview, by its fixed name, in `notes/N<nnn>/`. */
export const PREVIEW_FILE = "preview.html";
/** The states whose workstreams are held to the standard of the day. A closed one stays as it closed. */
export const HELD_STATES: readonly WorkstreamState[] = ["open", "backlog"];

/**
 * What an arc's notes folder holds, and nothing else (RD.DEVEX.WORKSPACE.262): each entry's name and
 * whether it is a file or a folder. `samples/` may hold folders of its own; the others are flat.
 */
export const NOTES_ENTRIES: ReadonlyMap<string, "file" | "folder"> = new Map([
  [PREVIEW_FILE, "file"], ["samples", "folder"], ["plan.md", "file"], ["orders", "folder"], ["scripts", "folder"],
]);

const SAMPLE_KINDS = /\.(?:png|jpe?g|gif|webp|svg|avif|mp4|mov|webm|pdf)$/i;
const SCRIPT_KINDS = /\.(?:mjs|cjs|js|ts|py|sh)$/i;
const DATA_KINDS = /\.(?:json|csv|tsv|ya?ml)$/i;
const ORDER_NAME = /(?:^\d+[a-z]?(?:[-.][^/]*)?\.md$|\.(?:report|ledger)\.md$)/i;

/**
 * Where an entry found beside the five in an arc's notes folder belongs, by its name and kind, as the
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
    return `its screenshots and real files in \`samples/${name}/\`, and each note in it a section of \`plan.md\``;
  }
  if (SAMPLE_KINDS.test(lower)) return "`samples/`";
  if (SCRIPT_KINDS.test(lower)) return "`scripts/`";
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
export const notesDirOf = (ws: string, arc: string): string => join(ws, NOTES, arc);
export const previewOf = (ws: string, arc: string): string => join(notesDirOf(ws, arc), PREVIEW_FILE);
export const questionsFileOf = (ws: string): string => join(ws, QUESTIONS_FILE);
/** The arc's name file beside its data, named for its subject (RD.DEVEX.WORKSPACE.264). */
export const nameFileOf = (ws: string, arc: string, subject: string): string => join(arcDataDir(ws, arc), `${subject}.md`);
/** The data files of an arc's folder; with the one name file, `arcs/N<nnn>/` holds these and nothing else. */
export const DATA_FILES: readonly string[] = [STATE_FILE, LOG_FILE, FACTS_FILE];

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
 * The workspace's own `workstreams/state.json` is `spnutils`'s and is not one of these.
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
    const status = (readJson(stateFileOf(ws, arc)) as { status?: unknown } | null)?.status;
    if (typeof status === "string" && !TERMINAL.has(status)) open.push(arc);
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
    : `(none yet: \`spn-devex workstream row write ${data.arc} --goal "…"\`)`;
  const lines = [
    `<!-- ${data.arc}'s name. \`spn-devex workstream row write\` and \`docs cycles write\` write it from state.json; never by hand. -->`,
    `# ${data.arc} — ${data.title}`,
    "",
    `**Goal.** ${goal}`,
    "",
    `**Status.** ${data.status}${data.reason ? ` — ${data.reason}` : ""}`,
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

/** Rows done of rows, counting only the rows that are work. */
export function doneOf(data: ArcData): { done: number; total: number } {
  const leaves = leafRows(data);
  return { done: leaves.filter((row) => DONE_STATES.has(row.state ?? "")).length, total: leaves.length };
}

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
    if (!cross[2]) return TERMINAL.has(other.status);
    const row = other.rows.find((one) => one.id === cross[2]);
    return !!row && DONE_STATES.has(stateOfRow(other.rows, row));
  }
  const row = data.rows.find((one) => one.id === blocker);
  return !!row && DONE_STATES.has(stateOfRow(data.rows, row));
}

/** The rows ready to run: work rows marked `ready`, or `waiting` with every blocker resolved, in an arc that is decided. */
export function readyRows(ws: string, data: ArcData, questions: readonly Question[] = readQuestions(ws)): ArcRow[] {
  if (["PROPOSED", "HELD", ...TERMINAL].includes(data.status)) return [];
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

/**
 * The stamp of an arc's rows: a hash of their ids and their *What*, never their states, so a row's
 * state changing does not move it and the check fires only when an arc's coverage changes.
 */
export function rowStamp(data: Pick<ArcData, "rows">): string {
  const coverage = [...data.rows].map((row) => [row.id, row.title]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(coverage)).digest("hex").slice(0, 12);
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
const bar = (done: number, total: number): string => `<div class="sds-bar"><i style="width:${share(done, total)}%"></i></div>`;

/**
 * One arc's tile in the progress grid: its number and its subject as words, linking its Cycles row; its
 * status badge beside done/total; and its bar, last. The status word is the tile's second class, and the
 * stylesheet colours the bar from it.
 */
function arcTile(data: ArcData, done: number, total: number): string[] {
  const word = data.status.toLowerCase();
  return [
    `    <div class="sds-arc sds-${word}">`,
    `      <a class="sds-arc-name" href="#${data.arc}"><span class="sds-mono">${data.arc}</span> ${escapeHtml(data.subject.replace(/-/g, " "))}</a>`,
    `      <div class="sds-arc-line"><span class="sds-badge sds-status sds-${word}">${escapeHtml(data.status)}</span><span class="sds-arc-count">${done}/${total}</span></div>`,
    `      ${bar(done, total)}`,
    `    </div>`,
  ];
}

/** How far along an arc is, in five steps of one hue by rows done (0-19, 20-39, 40-59, 60-79, 80-99 per cent), and `done` at 100. */
export function progressStep(done: number, total: number): string {
  const percent = share(done, total);
  return percent >= 100 && total ? "done" : String(Math.min(5, Math.floor(percent / 20) + 1));
}

/**
 * One arc's chip in the sticky card: its number and short name, its status badge beside done/total, and a thin
 * bar. The bar's shade is the chip's second class, `sds-step-1` to `sds-step-5` by rows done and `sds-step-done`
 * at the end, so it says how far along the arc is. The chip links the arc's Cycles row.
 */
function arcChip(data: ArcData, done: number, total: number): string {
  const word = data.status.toLowerCase();
  return `      <a class="sds-chip sds-${word} sds-step-${progressStep(done, total)}" href="#${data.arc}"><span class="sds-chip-name"><span class="sds-mono">${data.arc}</span><span class="sds-chip-subject"> ${escapeHtml(data.subject.replace(/-/g, " "))}</span></span>`
    + `<span class="sds-chip-line"><span class="sds-badge sds-status sds-${word}">${escapeHtml(data.status)}</span><span class="sds-arc-count">${done}/${total}</span></span>`
    + `<span class="sds-chip-bar"><i style="width:${share(done, total)}%"></i></span></a>`;
}

/**
 * The sticky card, fixed to the bottom of the window within the page's width: two sections side by side, divided
 * by a line. The arcs are on the left, one chip each, scrolling sideways inside their section; the overall line
 * is on the right, drawn as a chip of its own: Overall, the workstream's status beside rows done, a bar, and the arcs closed. It is written as soon as the workstream has its first arc, and each arc is a chip from then on.
 */
function statusBar(ws: string, counts: readonly { data: ArcData; done: number; total: number }[], done: number, total: number, closed: number): string[] {
  if (!counts.length) return [];
  const word = basename(dirname(resolve(ws))) === "closed" ? "DONE" : counts.some((one) => pastDecided(one.data.status)) ? "IMPLEMENTING" : "PLANNING";
  return [
    `  <nav class="sds-footbar" aria-label="Workstream status">`,
    `    <div class="sds-footbar-chips">`,
    ...counts.map((one) => arcChip(one.data, one.done, one.total)),
    `    </div>`,
    `    <div class="sds-footbar-summary">`,
    `      <div class="sds-chip sds-overall sds-step-${progressStep(done, total)}">`,
    `        <span class="sds-chip-name">Overall</span>`,
    `        <span class="sds-chip-line"><span class="sds-badge sds-status sds-${word.toLowerCase()}">${word}</span><span class="sds-arc-count">${done}/${total}</span></span>`,
    `        <span class="sds-chip-bar"><i style="width:${share(done, total)}%"></i></span>`,
    `        <span class="sds-chip-note">${closed} of ${counts.length} arcs closed</span>`,
    `      </div>`,
    `    </div>`,
    `  </nav>`,
  ];
}

/** The inside of the progress block: an overall line and bar, a grid of one tile per arc, each linking its Cycles row, and the sticky card. */
export function progressInside(ws: string, arcs: readonly ArcData[] = arcIdsOf(ws).map((arc) => readArc(ws, arc)!).filter(Boolean)): string {
  const counts = arcs.map((data) => ({ data, ...doneOf(data) }));
  const done = counts.reduce((sum, one) => sum + one.done, 0);
  const total = counts.reduce((sum, one) => sum + one.total, 0);
  const closed = arcs.filter((data) => TERMINAL.has(data.status)).length;
  const overall = `Overall: ${done} of ${total} rows done &middot; ${closed} of ${arcs.length} arcs closed`;
  const lines = [
    `  <p>${overall}</p>`,
    `  ${bar(done, total)}`,
  ];
  if (counts.length) lines.push(`  <div class="sds-arcs">`, ...counts.flatMap((one) => arcTile(one.data, one.done, one.total)), `  </div>`);
  lines.push(...statusBar(ws, counts, done, total, closed));
  return `${lines.join("\n")}\n`;
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
 * A preview's page with its `Open` current: the block rewritten, added as the last section where a
 * card is shown and the page has none, and the section dropped where no card is shown there.
 */
export function previewWithOpen(ws: string, preview: string, text: string, questions: readonly Question[]): string {
  const rel = fromWorkstream(ws, preview);
  const shown = openQuestions(questions).filter((one) => one.shownIn.includes(rel));
  const at = blockAt(text, "open");
  if (!shown.length) {
    if (!at) return text;
    const opens = text.lastIndexOf("<section", at.from);
    const closes = text.indexOf("</section>", at.to);
    if (opens < 0 || closes < 0) return text.slice(0, at.from) + text.slice(at.to);
    const end = closes + "</section>".length;
    return text.slice(0, opens).replace(/[ \t]*$/, "") + text.slice(end).replace(/^\n?/, "");
  }
  const inside = previewOpenInside(ws, preview, questions);
  if (at) return withBlock(text, "open", inside)!;
  const section = `<section id="s5" data-block="reasons">\n  ${OPEN_SECTION_MARKER}\n${inside}  ${BLOCK_END}\n</section>\n`;
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
