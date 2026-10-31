#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The arc · § A step row says where, at what altitude, and how · § Say what you opened, and know when to wait for the answer · § Stopping in the middle is a handover · § A prompt while an arc runs
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document
//           docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The reply while work runs shows what needs you, then what moved
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A card is only for what the rules leave open
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The Stop checks. They read what the turn is about to leave behind, and warn — never refuse, because
// the turn is already written and a refusal would only lose it.
//
//   runnable   a turn that ends while an arc THIS SESSION wrote still has rows ready to run, and no card
//              is open; a row waiting on an open card is not ready. A reply that ends on a promise of the
//              next step is sent back while a decided arc of the window has a ready row, moved or not
//   needs-you  a reply given while a card is open opens with **Needs you**: a card raised this turn in
//              full there, once, and every card still open from an earlier reply named in one line; only
//              cards this window raised, or that no window recorded, count (`raisedBy` in the card's record)
//   reply-shape a Needs you item is never a card or a suggestion by its number alone, and a reply holds no
//              working detail (`lib/working-detail.ts`)
//   cards      a reply names no card the window's pages do not carry, one answered, or one of another workstream
//   notes      a note, once: an answered card a preview shows, whose arc's notes did not move
//   carried    a proposed arc never carries a review point to a later row of itself
//   handover   a reply that says a new window is needed carries the eight labelled lines, in one column,
//              once while the rows stand, and names each open card in one line; a close or a handover
//              never opens with a table, a heading or a count
//   how-it-runs, partner-words, page-path  the reply's last asks about running the work, the words a partner cannot open, and its page addresses, after the handover
//   go-next    a go of the window with a part ready and not started, or a report waiting to be folded,
//              and no card open, is told its next step
//   page-stale an arc this window wrote left its workstream's page, or its preview's status, behind the arcs
//   state      `workstream state check` fails for a workstream of this window: among its findings an arc
//              the page does not carry, a workstream with no page, and a step running on an arc not decided
//   migration  a migration the workspace's ledger lacks still finds old shapes, in any window
//   own-copy   a page of this window's workstreams links no shared stylesheet; said once in a session
//   welcome    a session's first turn opens with the welcome, word for word: the heading and its four lines
//   corpus     the docs trees still answer the questions only a whole-corpus read can ask
//
// AN ARC IS READ FROM ITS DATA: its header and rows from `arcs/N<nnn>/state.json`, its events from
// `log.jsonl`, and the cards from the workstream's `questions.jsonl`, through `lib/workstream.ts`. An
// arc is named by its data folder, `<workstream>/arcs/N<nnn>`, which is also how the window's note
// records an arc the window wrote.
//
// A CHECK SPEAKS ONCE IN A TURN, AND ONLY ABOUT THIS SESSION'S OWN WORK (RULE.DEVEX.WORKSPACE.198). The
// reply that follows a finding is the answer to it, so a check that spoke at this session's last Stop
// is not run against that answer. The checks that read a page, its arcs and its cards read the
// workstreams bound to this window by the path of its writes, its first prompt or a handover
// (RULE.DEVEX.WORKSPACE.197 and .236, `lib/window.ts`); a workstream another window is still writing is
// unfinished, and that window hears about it. A window bound to none hears nothing about them.
//
// WHILE A ROW IS IN PROGRESS, ONLY A FINDING ABOUT THE REPLY SENDS THE AGENT BACK (RULE.DEVEX.WORKSPACE.244):
// `needs-you`, `reply-shape`, `cards`, `handover`, `how-it-runs`, `partner-words`, `page-path` and `welcome`. Every other finding is held, and the checks find
// it again at the first turn end where no row is in progress (`splitFindings`).
//
// `corpus` is the newest and the odd one out: every other check here reads what the TURN wrote, and
// that one reads the workspace. It is here because nothing else ran it — `N38` found that every
// corpus tool in this plugin was hand-run, so a defect was only ever found by somebody looking for
// something else. It keeps one verdict per docs tree, keyed by content, in `~/.saasplane/cache/plugins/spn-devex/corpus/`
// — a tree that has not moved since its verdict was written replays it rather than re-running every
// tool over it, which is what makes a per-turn hook affordable; see `checks/corpus.ts` for why that
// matters and what it costs.
//
// `runnable` is the one the developer asked for by name: *you keep getting stuck after reporting, and
// you should continue when there is no blocker.* Reporting is not stopping. A milestone line belongs
// between steps, in the same turn as the next step.

import { readFileSync, readdirSync, rmSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { checkCorpus } from "../checks/corpus.ts";
import { checkHowItRuns } from "../checks/how-it-runs.ts";
import { checkPartnerWords } from "../checks/partner-words.ts";
import { checkPagePath } from "../checks/page-path.ts";
import { checkWorkstream, heldByStop } from "../checks/workstream-state.ts";
import { PREVIEW_FILE, arcDataDir, arcStatus, stepsMayStart, arcIdsOf, leafRows, logLinesOf, notesDirOf, previewOf, readArc, readQuestions, readyRows, stateFileOf,
         workstreamsOf } from "../lib/workstream.ts";
import { findWorkingDetail } from "../lib/working-detail.ts";
import type { ArcData, LogLine, Question } from "../lib/workstream-schema.ts";
import { applyLine, standings } from "../lib/migration.ts";
import { MIGRATIONS } from "../lib/migrations/index.ts";
import { cardsOf, holdsOwnCopy, markAge, openWorkstreams, ownCopyLines, stateOf, workstreamPlan } from "../checks/split-plan.ts";
import { cyclesRule, exemptWorkstream, headerRule, openHeadingRule } from "../checks/doc-check.ts";
import { cyclesTableAt } from "../commands/docs/cycles.ts";
import { TERMINAL } from "../checks/arc-status.ts";
import { workspaceRoot } from "../lib/payload.ts";
import { DEVEX, isApproachPage, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { appendLog, sessionDir, telemetryFolder } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { cacheState, goStandings, welcome } from "./orientation.ts";
import { begin, span, end, tagsOf, telemetryDir, utcNow } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { recordUsage, windowSize } from "../lib/usage.ts";
import { arcsWrittenSince, fromWorkspace, named, reposWritten, visitedWorkstreams, windowSet } from "../lib/window.ts";

type Warning = { check: string; message: string };

// The labels the handover template carries (`templates/workstream/handover-template.md`), in its
// order. Every handover owes all eight: a line that has nothing to say still says so (`no reload`,
// `none`), because a label left out cannot be told from a label forgotten. A label counts only where
// it opens a line, lowercase, with its colon, which is the layout the chapter states; the sentence
// form (`Continue workstream …`, `Model: …`) names none of them and is refused as a block missing
// all eight. The state and the next steps are what `workstream go show` prints, so no label holds them.
const HANDOVER_LABELS = ["continue", "model", "read first", "pins", "live now", "done when",
  "do not touch", "open"];
const HANDOVER_LABEL_LINE = new RegExp(`^(${HANDOVER_LABELS.join("|")}):(.*)$`);
// `continue:` must carry the workstream (`008-plain-language`) and the arc (`N119`), because the next
// window finds everything else from those two. `events/prompt.ts` reads the same two patterns to
// name a session, so a workstream and an arc are spelled one way for both events.
/** A workstream folder's name, as a text writes it: three digits, a hyphen and the subject. */
export const WORKSTREAM_NAME = /\b\d{3}-[a-z0-9][a-z0-9-]*/;
/** An arc's number, as a text writes it: `N` and its digits. */
export const ARC_NAME = /\bN\d+\b/;

/**
 * The labelled lines of a handover block, each with its value. A line that starts with whitespace
 * continues the value above it; any other line that is not a label is ignored.
 */
export function handoverLines(body: string): Map<string, string> {
  const out = new Map<string, string>();
  let last: string | null = null;
  for (const line of body.split("\n")) {
    const m = line.match(HANDOVER_LABEL_LINE);
    if (m) { last = m[1]; out.set(last, m[2].trim()); continue; }
    if (last !== null && /^\s+\S/.test(line)) out.set(last, `${out.get(last)} ${line.trim()}`);
    else last = null;
  }
  return out;
}

// The column every value starts in, counted from 0: the longest label, `do not touch:`, and one space.
const HANDOVER_COLUMN = Math.max(...HANDOVER_LABELS.map((label) => label.length)) + 2;

/**
 * The column each label's value starts in, counted from 0, in the block's order. A line that starts
 * with whitespace continues the value above it and is not read as a label. A label with no value has
 * no column.
 */
export function handoverColumns(body: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of body.split("\n")) {
    const m = line.match(HANDOVER_LABEL_LINE);
    if (!m || !m[2].trim()) continue;
    out.set(m[1], line.length - m[2].trimStart().length);
  }
  return out;
}

/**
 * Whether a fence body is shaped as a handover: two of its labels or more, or the sentence form they
 * replace. One label alone is too little — `state:` opens many a status block that hands nothing on.
 */
function looksLikeHandover(body: string): boolean {
  return handoverLines(body).size >= 2 || (/workstream/i.test(body) && /\barc\b/i.test(body));
}

/** One fenced block of a reply: its info string (`diff`, `text`, or empty) and its body. */
type Fence = { info: string; body: string; start: number; end: number };

/**
 * Every fenced block in a reply, read line by line the way markdown reads it.
 *
 * A FENCE CLOSES ONLY ON A LINE THAT IS A FENCE. A lazy ``` pairing closes a ```diff``` block at its
 * first `+```text` line, so a diff of the handover template leaks the template's lines back into the
 * prose, and the `[handover]` check reads a quotation as a direction. A block opens on a line of
 * three or more backticks or tildes (up to three spaces in), and closes on a line of the same
 * character at least as long, with nothing after it. A block never closed runs to the end.
 */
export function fencesOf(reply: string): Fence[] {
  const out: Fence[] = [];
  const lines = reply.split("\n");
  let offset = 0;
  let open: { mark: string; info: string; start: number; bodyStart: number } | null = null;
  for (const line of lines) {
    const next = offset + line.length + 1;
    if (open === null) {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/);
      if (m) open = { mark: m[1], info: m[2].toLowerCase(), start: offset, bodyStart: next };
    } else {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (m && m[1][0] === open.mark[0] && m[1].length >= open.mark.length) {
        out.push({ info: open.info, body: reply.slice(open.bodyStart, offset), start: open.start, end: Math.min(next, reply.length) });
        open = null;
      }
    }
    offset = next;
  }
  if (open) out.push({ info: open.info, body: reply.slice(open.bodyStart), start: open.start, end: reply.length });
  return out;
}

/** The reply with every fenced block replaced by a space. */
export function withoutFences(reply: string): string {
  let out = "", at = 0;
  for (const fence of fencesOf(reply)) { out += reply.slice(at, fence.start) + " \n"; at = fence.end; }
  return out + reply.slice(at);
}

/**
 * A FENCE THAT QUOTES A TEMPLATE IS NOT A HANDOVER. A `diff` block is a change being previewed, and a
 * block still holding `{{` placeholders is a template nobody filled in. Both are somebody's text
 * about a handover, so neither is taken as the block the check asks for.
 */
export function quotesTemplate(fence: Fence): boolean {
  return fence.info === "diff" || fence.body.includes("{{");
}
function read(p: string): string {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function openWorkstreamFolders(root: string): string[] {
  const dir = workstreamsDir(root, "open");
  try { return readdirSync(dir).map((d) => join(dir, d)).filter((d) => statSync(d).isDirectory()); }
  catch { return []; }
}

/** Every arc of a workstream kept as data, each named by its data folder `<workstream>/arcs/N<nnn>`. */
function arcFoldersOf(ws: string): string[] {
  return arcIdsOf(ws).map((arc) => arcDataDir(ws, arc));
}

function pagesOf(ws: string): string[] {
  try { return readdirSync(ws).filter(isApproachPage).map((f) => join(ws, f)); }
  catch { return []; }
}

/** The workstream folder an arc's data folder sits in. */
const homeOf = (arc: string): string => dirname(dirname(arc));
/** An arc's number, from its data folder. */
const idOf = (arc: string): string => basename(arc);
/** An arc's data, from its `state.json`, or null where it has none. */
const dataOf = (arc: string): ArcData | null => readArc(homeOf(arc), idOf(arc));
/** An arc's status, or "" where it has no data. */
/** An arc's status as it reads, from the one owner (RULE.DEVEX.WORKSPACE.307), or "" where its data does not read. */
const statusOf = (arc: string): string => { const data = dataOf(arc); return data ? arcStatus(data) : ""; };
/** The cards still open in a workstream's `questions.jsonl`. */
const openQuestionsOf = (ws: string): Question[] => readQuestions(ws).filter((one) => one.state === "open");
/** The way a command names an arc: the workstream's number and the arc, `030/N004`. */
const arcRef = (arc: string): string => `${basename(homeOf(arc)).slice(0, 3)}/${idOf(arc)}`;


/**
 * A short hash of an arc's rows: each row's id, *What* and state, in the order the arc keeps them. A
 * sitting working ON the arc changes it; a header write, a log line or a status alone does not.
 */
export function rowsMark(data: ArcData | null): string {
  const rows = (data?.rows ?? []).map((row) => [row.id, row.title, row.state ?? null]);
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 12);
}

/**
 * The rows of an arc ready to run, as the runnable check names them: `row 2 — build it`. They are the
 * rows `workstream rows show --ready` lists (`readyRows`): work rows waiting or ready whose every
 * blocker has resolved, so a row waiting on a card that is open is not one, and is one again once the
 * card is answered (RULE.DEVEX.WORKSPACE.188). A running row is not ready; `runningRows` names it.
 *
 * @param questions  the workstream's question records; read from its `questions.jsonl` when not given
 */
export function readyRowsOf(arc: string, questions?: readonly Question[]): string[] {
  const data = dataOf(arc);
  if (!data) return [];
  return readyRows(homeOf(arc), data, questions ?? readQuestions(homeOf(arc)))
    .map((row) => `row ${row.id} — ${row.title.slice(0, 70)}`);
}

/** When a row last moved to `running`, from the arc's log, or null where the log does not say. */
function runningSince(lines: readonly unknown[], row: string): Date | null {
  for (let at = lines.length - 1; at >= 0; at -= 1) {
    const line = lines[at] as LogLine | undefined;
    if (!line || typeof line !== "object" || line.row !== row || line.kind !== "running") continue;
    const since = new Date(String(line.at));
    return Number.isNaN(since.getTime()) ? null : since;
  }
  return null;
}

/**
 * The rows of an arc that are `running`, each with how long ago its log line moved it there
 * (RULE.DEVEX.WORKSPACE.184). A row whose order is out with an agent is left out: the agent is on it,
 * and its report is what ends the wait.
 *
 * @param out  the rows of this arc whose order is out; read from the arc's orders folder when not given
 */
export function runningRows(arc: string, now = Date.now(), out: Set<string> = ordersOut(arc)): string[] {
  const data = dataOf(arc);
  if (!data) return [];
  const lines = logLinesOf(homeOf(arc), idOf(arc));
  return leafRows(data)
    .filter((row) => row.state === "running" && !out.has(row.id.toLowerCase()))
    .map((row) => `row ${row.id} — ${row.title.slice(0, 70)} (running for ${markAge(runningSince(lines, row.id), now)})`);
}

/**
 * Whether work still runs in this window: a row of an arc in one of its workstreams is `running`
 * (RULE.DEVEX.WORKSPACE.189). The Stop event says nothing about whether the agent now waits, so the
 * state is how a progress reply is told from a reply that waits.
 *
 * A row whose order is out with an agent counts here, though `runningRows` leaves it out: that agent
 * is the work that runs. An arc whose status is terminal does not count, because a row left running in
 * a finished arc is history, and it would hide the open cards for as long as the arc stays open.
 *
 * @param mine  the workstreams this window works on; a row in any other is another window's work
 */
export function workRuns(root: string, mine: Set<string>): boolean {
  return openArcs(root, mine).some((arc) => {
    const data = dataOf(arc);
    return !!data && !TERMINAL.has(arcStatus(data)) && leafRows(data).some((row) => row.state === "running");
  });
}

// A REPORT SITS BESIDE ITS ORDER, `57.md` and `57.report.md` (01-workstream.md § The folder); `57-report.md`
// is the name older orders of an open workstream still carry. A ledger is the child's running log, not an order.
const REPORT_SUFFIXES = [".report.md", "-report.md"];
const LEDGER_SUFFIX = ".ledger.md";
// The rows an order is for, as its first heading names them: `# Order 04a — N006 row 4: …`, or for an
// order that carries several, `rows 0, 1 and 2` or `rows 0 to 2`.
const ORDER_ROWS = /\brows?\s+(\d+[a-z]?(?:\.\d+[a-z]?)*(?:(?:\s*,\s*|\s+and\s+|\s+to\s+)\d+[a-z]?(?:\.\d+[a-z]?)*)*)/i;

/** The rows a heading names. `0 to 2` is each whole number from the first to the last. */
function rowsNamed(heading: string): string[] {
  const named = ORDER_ROWS.exec(heading)?.[1];
  if (!named) return [];
  const range = /^(\d+)\s+to\s+(\d+)$/i.exec(named.trim());
  if (range) {
    const rows: string[] = [];
    for (let row = Number(range[1]); row <= Number(range[2]); row += 1) rows.push(String(row));
    return rows;
  }
  return named.split(/\s*,\s*|\s+and\s+|\s+to\s+/i).map((row) => row.trim().toLowerCase()).filter(Boolean);
}

/**
 * The rows of an arc whose order is out, by row id. An order is out where a file under the arc's
 * `notes/N<nnn>/orders/` is for that row and no report sits beside it: `03-reports.md` with no
 * `03-reports.report.md`. The rows are the ones the order's first heading names (`row 3`, or
 * `rows 0, 1 and 2`, or `rows 0 to 2` for an order that carries several). Where the heading names
 * none, it is the number that opens the file name, so `04a-…` and `04b-…` are both for row 4. A row
 * with several orders is out until every report is back.
 */
export function ordersOut(arc: string): Set<string> {
  const out = new Set<string>();
  const folder = join(notesDirOf(homeOf(arc), idOf(arc)), "orders");
  let names: string[];
  try { names = readdirSync(folder).filter((name) => name.endsWith(".md")); } catch { return out; }
  for (const name of names) {
    if (REPORT_SUFFIXES.some((suffix) => name.endsWith(suffix)) || name.endsWith(LEDGER_SUFFIX)) continue;
    const stem = name.slice(0, -".md".length);
    if (REPORT_SUFFIXES.some((suffix) => names.includes(`${stem}${suffix}`))) continue;
    const heading = read(join(folder, name)).split("\n").find((line) => /^#\s/.test(line)) ?? "";
    const rows = rowsNamed(heading);
    const numbered = /^(\d+)/.exec(name)?.[1].replace(/^0+(?=\d)/, "");
    for (const row of rows.length ? rows : numbered ? [numbered] : []) out.add(row);
  }
  return out;
}

/**
 * What one SESSION saw at its last `Stop`: when, each arc's rows mark (`rowsMark`), and which checks
 * it reported. Both maps are keyed by the arc's data folder.
 *
 * **THE BASELINE IS PER SESSION, BECAUSE THE WORKSPACE IS SHARED.** One file per workspace compared
 * this window's turn against whichever window stopped last, so an arc another session was executing
 * read as this one's work. In a headless `claude -p` window that fired on `N114`, an arc nobody in
 * that window had touched, after every reply, and forced eight "Blocked" turns.
 *
 * **IT CANNOT USE `git`.** The workstream folder lives at the workspace root, which is not a
 * repository, so `git show HEAD:./arcs/N001/state.json` fails there for every arc.
 */
export type Baseline = { at: number; steps: Record<string, string>; fired?: string[];
                         cards?: string[]; arcs?: Record<string, ArcMark>;
                         /** The pages this session was already told hold their own copy of the styles. */
                         ownCopy?: string[];
                         /** `stepsMark` as it read when this session wrote a whole handover block. */
                         handover?: string;
                         /** The findings said and not yet gone, by check, as the hash of their words: an identical one is not said again. */
                         told?: Record<string, string> };

/**
 * What one arc looked like at a Stop, for the `notes` and `carried` checks: how many lines its
 * `log.jsonl` held, which is only ever appended to, a signature of its notes (the preview, the plan and
 * the samples under `notes/N<nnn>/`), and its status.
 */
export type ArcMark = { log: number; notes: string; status: string };

/** The window's baseline, `sessions/<id>/stop.json`; a child agent keeps its own beside it, `stop.<agent>.json`. */
const baselineFile = (root: string, session: string, agent: string | null): string =>
  join(sessionDir(root, session), agent ? `stop.${agent.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)}.json` : "stop.json");

export function readBaseline(root: string, session: string, agent: string | null = null): Baseline | null {
  try { return JSON.parse(readFileSync(baselineFile(root, session, agent), "utf8")); }
  catch { return null; }
}

/** Every open arc's rows mark, as this Stop sees it. */
function currentSteps(root: string): Record<string, string> {
  const seen: Record<string, string> = {};
  for (const arc of snapshotArcs(root)) seen[arc] = rowsMark(dataOf(arc));
  return seen;
}

export function writeBaseline(root: string, session: string, baseline: Baseline, agent: string | null = null): void {
  try {
    const file = baselineFile(root, session, agent);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(baseline), "utf8");
  } catch { /* the check must never fail because it could not write its own note */ }
}

/** The folders a check reads: the ones this window works on, and no others (RULE.DEVEX.WORKSPACE.236). */
function scoped(folders: string[], mine: Set<string>): string[] {
  return folders.filter((folder) => mine.has(basename(folder)));
}

// ---------------------------------------------------------------------------- notes and carried

// The folder of an arc's notes the developer reviews beside its preview and its plan: real files of the
// kind the work produces.
const SAMPLES = "samples";

/**
 * The files an arc's notes hold that an answer must land in: `notes/N<nnn>/preview.html`, which is the
 * arc's spec, `plan.md`, and everything under `samples/`. Orders and scripts are not the spec, so they
 * are left out.
 */
export function notesFiles(arc: string): string[] {
  const folder = notesDirOf(homeOf(arc), idOf(arc));
  const out: string[] = [];
  for (const name of [PREVIEW_FILE, "plan.md"]) {
    try { if (statSync(join(folder, name)).isFile()) out.push(join(folder, name)); } catch { /* absent */ }
  }
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      try { if (statSync(full).isDirectory()) walk(full); else out.push(full); } catch { /* next */ }
    }
  };
  walk(join(folder, SAMPLES));
  return out;
}

// A region a command writes inside a page, and the section that holds nothing else: `question answer` rewrites a
// preview's `open` block itself, and drops its section once no card is shown, so a preview whose only change is
// that has not been brought current by the agent.
const GENERATED_SECTION = /<section\b[^>]*>\s*<!--\s*spn:generated\b[\s\S]*?<!--\s*\/spn:generated\s*-->\s*<\/section>/g;
const GENERATED_REGION = /<!--\s*spn:generated\b[\s\S]*?<!--\s*\/spn:generated\s*-->/g;

/** A preview's text as the agent wrote it: without the regions a command writes, its spaces collapsed. */
export const previewAsWritten = (text: string): string =>
  text.replace(GENERATED_SECTION, " ").replace(GENERATED_REGION, " ").replace(/\s+/g, " ").trim();

/**
 * A signature of the notes files. The preview is read for its text as the agent wrote it, so a card leaving its
 * `Open` is not the agent bringing it current; every other file costs a stat, its path, size and time.
 */
function notesSignature(files: string[]): string {
  return createHash("sha256").update(files.map((file) => {
    try {
      if (basename(file) === PREVIEW_FILE) return `${file}\u0000${previewAsWritten(readFileSync(file, "utf8"))}`;
      const stat = statSync(file);
      return `${file}\u0000${stat.size}\u0000${stat.mtimeMs}`;
    } catch { return file; }
  }).join("\n")).digest("hex").slice(0, 12);
}

/** Every open arc's mark at this Stop. */
export function arcMarks(root: string): Record<string, ArcMark> {
  const out: Record<string, ArcMark> = {};
  for (const arc of snapshotArcs(root))
    out[arc] = { log: logLinesOf(homeOf(arc), idOf(arc)).length, notes: notesSignature(notesFiles(arc)), status: statusOf(arc) };
  return out;
}

const CARRIED_FORWARD = /\bcarried\b[^.;]{0,40}\bto\s+(?:step|row)\s+\d/i;

/**
 * The card an `answered` line names, which `question answer` writes as `q94 A · <the words>`; null for any other
 * line. Only an answer to a card can leave a preview behind, and only a preview that shows the card.
 */
const answeredCard = (line: LogLine): string | null =>
  line.kind === "answered" ? /^(q\d+)\b/i.exec(String(line.note ?? ""))?.[1].toLowerCase() ?? null : null;

/**
 * The `notes` and `carried` checks (RULE.DEVEX.WORKSPACE.193), over the lines an arc's `log.jsonl` gained
 * since this session's last Stop, in the arcs this window wrote.
 *
 * `notes`: a soft note, not a refusal. An `answered` line whose card a preview shows (the card's `shownIn`),
 * when the arc's notes did not change. The answer lands in the card and the arc in the same turn, and a
 * preview moves only where it shows that card; whether it changed what the preview shows is the agent's
 * judgement, so the note says so, and it is said once.
 *
 * `carried`: a line saying a point is carried to a later row, in an arc that was PROPOSED. Nothing is
 * built on its spec yet, so the point changes the spec now.
 *
 * @param before   each arc's mark at this session's last Stop; nothing is judged without one
 * @param touched  the arcs this window wrote since then, from the window's note (`lib/window.ts`)
 * @param mine     the workstreams this window owns; an arc of any other is nobody's business here
 * @param visits   the workstreams it only visits: the notes rule still holds for an arc the window itself
 *                 changed there (`touched`), and nothing else about them is read
 */
export function checkNotesLanded(root: string, before: Record<string, ArcMark> | undefined,
                                 touched: Set<string>, mine: Set<string>, visits: Set<string> = new Set()): Warning[] {
  if (!before) return [];
  const out: Warning[] = [];
  const tie = (arc: string) => (mine.has(workstreamOf(arc)) ? "owns" : "visits") as "owns" | "visits";
  for (const arc of openArcs(root, new Set([...mine, ...visits]))) {
    const was = before[arc];
    if (!was || typeof was.log !== "number") continue;
    if (!touched.has(arc)) continue;
    const added = logLinesOf(homeOf(arc), idOf(arc)).slice(was.log)
      .filter((line): line is LogLine => !!line && typeof line === "object");
    if (!added.length) continue;
    const answered = [...new Set(added.map(answeredCard).filter((card): card is string => card !== null))];
    const cards = answered.length ? readQuestions(homeOf(arc)) : [];
    const shownOn = answered.flatMap((id) => {
      const shownIn = cards.find((card) => card.id.toLowerCase() === id)?.shownIn ?? [];
      return shownIn.length ? [{ id, shownIn }] : [];
    });
    if (shownOn.length && notesSignature(notesFiles(arc)) === was.notes) {
      const where = shownOn.map((one) => `${one.id.toUpperCase()} on ${one.shownIn.map((path) => `\`${path}\``).join(", ")}`).join(" · ");
      out.push({ check: "notes", message: named(workstreamOf(arc),
        `A note, not a refusal: \`${fromWorkspace(root, arc)}\` logged an answer this turn to a card a preview shows, and its ` +
        `notes did not move — ${where}. A preview changes only where it shows the card that was answered ` +
        `(RULE.DEVEX.WORKSPACE.193). If the answer changed what that preview shows, bring the section current and name it ` +
        `in a log line: \`spn-devex workstream arc edit ${arcRef(arc)} --note "…"\`; if it did not, nothing is owed.`, tie(arc)) });
    }
    const status = statusOf(arc);
    if ((was.status === "PROPOSED" || status === "PROPOSED") && added.some((line) => CARRIED_FORWARD.test(String(line.note ?? ""))))
      out.push({ check: "carried", message: named(workstreamOf(arc),
        `\`${fromWorkspace(root, arc)}\` is PROPOSED and its log carries a review point to a later row of itself. A proposed ` +
        `arc never does: nothing is built on its spec yet, so the point changes the spec now (RULE.DEVEX.WORKSPACE.193). ` +
        `Write it into the preview and the plan this turn.`, tie(arc)) });
  }
  return out;
}

/** Every arc of the open workstreams this window works on, by its data folder. */
function openArcs(root: string, mine: Set<string>): string[] {
  return scoped(openWorkstreamFolders(root), mine).flatMap(arcFoldersOf);
}

/**
 * Every arc of every open workstream, for the baseline a Stop writes. A snapshot is state and never
 * speech: it is read only for the arcs of this window's workstreams, so a workstream the window binds
 * later already has its marks. It is the one read of every open arc in this file.
 */
function snapshotArcs(root: string): string[] {
  return openWorkstreamFolders(root).flatMap(arcFoldersOf);
}

/** The workstream an arc's data folder sits in, by the workstream folder's name. */
const workstreamOf = (arc: string): string => basename(homeOf(arc));

// A PROMISE OF THE NEXT STEP, in the reply's last paragraph: the agent says what it will do instead of doing it.
// A sentence that asks, or that waits on the developer (`if you`, `once you`), is an offer and no promise.
const PROMISE = /\b(?:I(?:'ll|\s+will|\s+am going to|'m going to|\s+am about to|'m about to)|[Nn]ext,?\s+I\b|[Nn]ext up\b|will (?:now|next)\b)/;
const WAITS_ON_YOU = /\b(?:if|once|when|after|until) you\b|\byour (?:go|answer|call|word)\b/i;

/** Whether the reply's last paragraph, fences set aside, promises the next step rather than taking it. */
export function endsOnPromise(reply: string): boolean {
  const paragraphs = withoutFences(reply).split(/\n\s*\n/).map((one) => one.trim()).filter(Boolean);
  const last = paragraphs.at(-1) ?? "";
  return last.split(/(?<=[.!?])\s+/).some((sentence) => PROMISE.test(sentence) && !sentence.trim().endsWith("?") && !WAITS_ON_YOU.test(sentence));
}

/**
 * Arcs this session wrote that still have rows ready to run, with no card open to block them.
 *
 * @param since    when THIS SESSION last stopped; 0 is its first Stop, and the check stays quiet
 * @param stepsAt  each arc's rows mark at that Stop
 * @param touched  the arcs this window's own tool calls wrote since then, from the window's note;
 *                 `null` where that is not known, and then a `state.json` time newer than `since` stands in
 * @param mine     the workstreams this window works on; the others are read by nobody here
 * @param reply    the reply that ends the turn; one that ends on a promise of the next step is sent back
 *                 while a decided arc of the window has a ready row and no card is open, its rows moved or not
 */
export function checkRunnable(root: string, since: number, stepsAt: Record<string, string>,
                              touched: Set<string> | null, mine: Set<string>, reply = ""): Warning[] {
  const out: Warning[] = [];
  const promises = endsOnPromise(reply);

  for (const ws of scoped(openWorkstreamFolders(root), mine)) {
    const questions = readQuestions(ws);
    const cards = questions.filter((one) => one.state === "open");
    for (const arc of arcFoldersOf(ws)) {
      const data = dataOf(arc);
      if (!data) continue;
      // WHICH ARC IS BEING EXECUTED IS A FACT, NOT A CLAIM, AND IT IS THIS SESSION'S FACT. A status
      // word is a claim any window can have written. What this session wrote is in its window's note,
      // and an arc it wrote whose rows moved since its own last Stop is the arc it is executing.
      if (TERMINAL.has(arcStatus(data))) continue;     // its unfinished rows are history, not work
      // AN ARC NOBODY AGREED, OR ONE HELD BY THE DEVELOPER'S WAIT, IS NOT RUNNABLE, whoever touched it: no step
      // starts until the arc is DECIDED with no wait (RULE.DEVEX.WORKSPACE.278).
      if (!stepsMayStart(data)) continue;
      // A PROMISE IS NOT A STOP. A reply that ends on what it will do next, while this arc has a row ready and
      // no card is open, is the stop the developer asked never to see; no baseline is needed to know it.
      if (promises && !cards.length) {
        const ready = readyRowsOf(arc, questions);
        if (ready.length) {
          out.push({ check: "runnable", message: named(basename(ws),
            `This reply ends on what you will do next, and ${idOf(arc)} has ${ready[0]} ready with no card open. Do it in this turn.`) });
          continue;
        }
      }
      // NO BASELINE MEANS NO INFERENCE. A session's first Stop has nothing of its own to compare
      // against, and a headless window has only a first Stop, so it stays quiet.
      if (!since) continue;
      let wrote = false;
      if (touched) wrote = touched.has(arc);
      else { try { wrote = statSync(stateFileOf(ws, idOf(arc))).mtimeMs > since; } catch { wrote = false; } }
      if (!wrote) continue;
      // WRITING ABOUT AN ARC IS NOT EXECUTING IT. A header, a status or a log line is the sitting
      // writing ABOUT the arc; its rows changing is the sitting working ON it. An arc absent from the
      // baseline was opened after it, and that is not evidence of work either.
      const now = rowsMark(data);
      if ((stepsAt[arc] ?? now) === now) continue;            // the record moved, the work did not
      // A RUNNING ROW IS NAMED WITH ITS AGE, NEVER CALLED RUNNABLE. Its state says somebody is on it;
      // whether that is this sitting or a window that has gone, only the developer can say.
      const claimed = runningRows(arc);
      if (claimed.length && !cards.length)
        out.push({
          check: "runnable",
          message: named(basename(ws), `\`${fromWorkspace(root, arc)}\` has ${claimed.length === 1 ? "a row" : `${claimed.length} rows`} running: ` +
            `${claimed.join(" · ")}. If this sitting is on it, finish it and land it with its commit ` +
            `(\`spn-devex workstream row state ${arcRef(arc)} <row> landed\`), or write it \`stopped\` with what was ` +
            `done. If another window is on it, leave it and ask the developer, saying how long it has run ` +
            `(02-workstream/01-workstream.md § A step row says where, at what altitude, and how).`),
        });
      const steps = readyRowsOf(arc, questions);
      if (!steps.length) continue;
      if (cards.length) continue;   // a card blocks: the hold reply covers that case
      out.push({
        check: "runnable",
        message: named(basename(ws), `stopped with runnable work — this session changed the rows of \`${fromWorkspace(root, arc)}\`, and ${steps.length} row` +
          `${steps.length > 1 ? "s are" : " is"} ready to run, and no card is open. The next one is ${steps[0]}. ` +
          `Reporting is not stopping: a milestone line goes between rows, in the same turn as the next row ` +
          `(02-workstream/01-workstream.md § Say what you opened, and know when to wait for the answer).`),
      });
    }
  }
  return out;
}


/**
 * A REPLY THAT ENDS A SITTING owes the next window the seven fields, because a session's context ends
 * with the session and the block is the only thing that crosses.
 *
 * WHAT COUNTS AS SAYING SO was the bare word `handover` anywhere in the reply, and that fired on
 * every sentence ABOUT a handover — *the handover marks it as not mine to decide*, *this reply
 * carries no handover block* — so answering a question about the open cards demanded a handover
 * block twice in a row. The check had no tests at all, which is how it survived: an unverified gate
 * is the thing this arc keeps finding. The signal is a statement that a window is needed or that the
 * work is being handed on, or a line that OPENS one, never a passing mention of the noun.
 */
/**
 * Whether this reply PASSES WORK ON, rather than merely naming a session that does not exist yet.
 *
 * THE PAYLOAD CANNOT ANSWER THIS, and saying otherwise would be the fault this whole arc is about.
 * `Stop` fires once per TURN, not once per sitting, so nothing in the event says the session is
 * ending — every turn looks identical to this hook. What the text CAN be read for is whether it
 * DIRECTS somebody to act, and that is a narrower question than whether it contains a phrase.
 *
 * WHY THE NARROWING WAS NEEDED. The first cut matched the words for a replacement session anywhere
 * in the reply, and it refused a reply that said a later build WOULD need one — nothing had changed,
 * no wiring had moved, and no work was being passed to anybody. Warning somebody what a build is
 * about to cost is the normal way to be useful about it, and a check that refuses it teaches people
 * to stop describing consequences.
 *
 * So a future or conditional mention is not a pass-on. A direction is.
 */
// A DIRECTION NAMES WHAT TO DO WITH THE SESSION; A MENTION ONLY NAMES ONE (RULE.DEVEX.WORKSPACE.198).
// The pattern was the noun phrase alone, so "another window closed the workstream" and "a release and
// a new window in each session" read as passing work on. On 2026-10-01 that fired on status replies
// in three sessions. A pass-on now needs the verb that sends the work there, or the next session as
// the one that starts, or the plain words for handing over. A handover block with no such sentence is
// the shape a stop for a question owes, and it is not read as passing work on.
const SESSION = new RegExp(
  String.raw`\b(?:open|start|launch|use|continue|resume|carry on|paste|pick (?:this|it|that|the work) up)\b[^.?!\n]{0,24}?\b(?:new|fresh|another|next)\s+(?:window|session)\b` +
  String.raw`|\bthe\s+next\s+(?:window|session)\s+(?:starts|begins|continues|resumes|picks)\b` +
  String.raw`|\bhand(?:ing)?\s+(?:this |it )?over\b`, "gi");
const NOT_YET = /\b(?:will|would|'ll|once|after|before|until|when|going to|about to|then|may|might|could|if)\b[^.?!]{0,80}$/i;
// AND IT CAN FOLLOW, which the first cut missed. "a fresh window WOULD load the installed copy" is a
// description of a consequence, and every conditional word in it sits after the phrase rather than
// before. Looking only backwards refused a reply that was explaining what a build costs.
const NOT_YET_AFTER = /^[^.?!]{0,60}\b(?:will|would|'ll|may|might|could|can|cannot|can't|is going to)\b/i;
// AN ARC'S TITLE IS A NAME, NOT A DIRECTION. `N119 — the fresh window proves both repositories` is
// what 008 calls an arc, so every honest status reply names it; a hit within a few words after an
// `N<nn>` reference, on the same line and in the same table cell, is that title (N116 row 8, F3).
const IN_AN_ARC_TITLE = /\bN\d{1,3}\b[^.?!|\n]{0,40}$/;
// ANY WINDOW IS NOT A PARTICULAR ONE. "any fresh window here can read the log" says what every
// window can see; a pass-on sends the work to one.
const ANY_WINDOW = /\b(?:any|every|each)\s+$/i;
// AND A COST IS NOT A DIRECTION, which the two guards above cannot see because they look for
// conditional WORDS and a cost is a noun phrase. "one bump, the installs, one `agent-sync`, and a
// fresh window" is a list of what a plugin cycle costs; it directs nobody to do anything, and this
// check fired on it twice in one sitting. The file's own note says why that matters: *warning
// somebody what a build is about to cost is the normal way to be useful about it, and a check that
// refuses it teaches people to stop describing consequences.*
//
// A LIST IS THE TEST, not a word. Where the phrase is the last item of a run of comma-separated
// items — two or more before it, joined by `and` or `or` — it is being counted rather than asked
// for. That is narrow on purpose: one comma is an ordinary sentence, and this must not swallow a
// real pass-on such as "finish the release, then open a fresh window".
const A_COST_LIST = /(?:,[^.?!,]{1,60}){2,}(?:,)?\s*(?:and|or)\s+[^.?!,]{0,30}$/i;
// AND AN EXPLANATION IS NOT A DIRECTION. A reply saying what a check matched, or what a phrase
// means — "it fired on the words new window" — names the phrase without asking anybody to open one.
const ABOUT_THE_WORDS = /\b(?:the (?:phrase|phrases|word|words|wording)|mention(?:s|ed|ing)?|fire[sd]? on|matche[sd]|triggered by|the \[?handover\]? check)\b[^.?!]{0,60}$/i;
// A heading or a labelled line that OPENS a handover: `## Handover`, `**Handover**`, `Handover:`.
// A sentence that merely begins with the noun is prose about a handover, not one.
const OPENS_A_HANDOVER = /^[ \t]{0,3}(?:#{1,4}[ \t]*|\*\*)handover\b|^[ \t]{0,3}handover[ \t]*(?:[:\u2014\u2013-]|$)/im;

/**
 * The reply with every quotation taken out: fenced blocks, code spans, block quotes, text in double
 * quotes (straight or curly), and single-asterisk italics, which is how a reply quotes a phrase.
 *
 * A QUOTED PHRASE IS SOMEBODY ELSE'S WORDS. The check fired on a reply explaining what it had fired
 * on, because the explanation repeated the phrase inside quotation marks. Bold is left in place: it
 * wraps a direction as readily as a quotation, and taking it out would hide a real one.
 */
export function unquoted(reply: string): string {
  return withoutFences(reply)
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^[ \t]{0,3}>.*$/gm, " ")
    .replace(/"[^"\n]*"/g, " ")
    .replace(/\u201c[^\u201d\n]*\u201d/g, " ")
    .replace(/(?<![*\w])\*(?![*\s])[^*\n]+?(?<![*\s])\*(?![*\w])/g, " ");
}

export function passingOn(reply: string): boolean {
  const prose = unquoted(reply);
  // A handover heading is a pass-on whatever the prose around it says.
  if (OPENS_A_HANDOVER.test(prose)) return true;
  for (const hit of prose.matchAll(SESSION)) {
    const at = hit.index ?? 0;
    const before = prose.slice(Math.max(0, at - 90), at);
    const after = prose.slice(at + hit[0].length, at + hit[0].length + 70);
    if (NOT_YET.test(before) || NOT_YET_AFTER.test(after)) continue;
    if (A_COST_LIST.test(before)) continue;      // counted as a cost, not asked for
    if (ABOUT_THE_WORDS.test(before)) continue;  // explained, not directed
    if (IN_AN_ARC_TITLE.test(before)) continue;  // an arc's name, not a direction
    if (ANY_WINDOW.test(before)) continue;       // every window, not the next one
    return true;                                 // stated plainly: this is being passed on
  }
  return false;
}

/**
 * Whether the reply puts a card to the reader: a `Q<n>` and a lettered options table, outside any
 * fence. That is the answer the handover check asks for when a card is open, so a reply carrying it
 * has already done what the check would demand.
 */
export function carriesCard(reply: string): boolean {
  const prose = withoutFences(reply);
  return NUMBERED.test(prose) && TABLE.test(prose) && LETTERED_ROW.test(prose);
}

/**
 * Every `Q<n>` open and unanswered on the pages of this window's workstreams: the question a handover
 * has to answer. It subtracts what a workstream records as settled — a card the page still shows but
 * a record has answered is not work anybody is waiting on.
 */
function cardsWaiting(root: string, mine: Set<string>): string[] {
  return [...new Set([...cardsByWorkstream(root, mine).values()].flat())].sort();
}

/**
 * The open cards of this window's workstreams that ANOTHER window raised: a card whose record names a
 * raiser that is not this session. A card with no raiser recorded is judged as it always was, as this
 * window's. Numbers are upper case, as a page writes them (`Q42`).
 */
export function raisedElsewhere(root: string, mine: Set<string>, session: string): Set<string> {
  const out = new Set<string>();
  for (const ws of scoped(openWorkstreamFolders(root), mine))
    for (const one of readQuestions(ws))
      if (one.state === "open" && typeof one.raisedBy === "string" && one.raisedBy && one.raisedBy !== session) out.add(one.id.toUpperCase());
  return out;
}

/** The open cards of each workstream this window works on, by the workstream's folder name. */
export function cardsByWorkstream(root: string, mine: Set<string>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [subject, pages] of argued(root, mine)) {
    // A card its record has answered or withdrawn in `questions.jsonl` is settled, whatever a page still shows.
    const answered = new Set(readQuestions(dirname(pages[0])).filter((one) => one.state !== "open").map((one) => one.id.toUpperCase()));
    const cards: string[] = [];
    for (const page of pages)
      for (const card of cardsOf(page))
        if (!card.decided && !answered.has(card.number)) cards.push(card.number);
    if (cards.length) out.set(subject, [...new Set(cards)].sort());
  }
  return out;
}

/** Every card each given workstream carries, on its pages or in `questions.jsonl`, with whether it is still open. */
function cardsOfWorkstreams(folders: string[]): Map<string, Map<string, boolean>> {
  const out = new Map<string, Map<string, boolean>>();
  for (const folder of folders) {
    const cards = new Map<string, boolean>();
    for (const page of pagesOf(folder)) for (const card of cardsOf(page)) cards.set(card.number, !card.decided);
    for (const one of readQuestions(folder)) cards.set(one.id.toUpperCase(), one.state === "open");
    out.set(basename(folder), cards);
  }
  return out;
}

/** Whether the turn's prompt names a card, or a workstream by its folder name or its number. */
function promptNames(prompt: string, card: string | null, workstream: string | null): boolean {
  if (card && namesCard(prompt, card)) return true;
  if (!workstream) return false;
  return prompt.includes(workstream) || new RegExp(`\\b${workstream.slice(0, 3)}\\b`).test(prompt);
}

/**
 * The cards check (RULE.DEVEX.WORKSPACE.147 and .197): a reply names no card that no page of this window's
 * workstreams carries, none that belongs to another workstream, in its number, in words or on a handover's
 * `open:` line, unless the turn's prompt named that card or that workstream, and its **Needs you** puts
 * no card that is already answered. A window bound to no workstream is not read.
 *
 * @param prompt  the turn's prompt, as the developer wrote it; "" where it is not known
 */
export function checkCardsNamed(reply: string, root: string, mine: Set<string>, prompt = ""): Warning[] {
  if (!mine.size) return [];
  const own = [...cardsOfWorkstreams(scoped(openWorkstreamFolders(root), mine))];
  if (!own.length) return [];
  const prose = unquoted(reply);
  const named = [...new Set(prose.match(/\bQ\d+\b/g) ?? [])];
  const part = needsYouPart(reply);
  const out: Warning[] = [];
  const ours = own.map(([name]) => name).join(", ");
  const others = [...cardsOfWorkstreams(openWorkstreamFolders(root).filter((folder) => !mine.has(basename(folder))))];
  const sent = new Set<string>();
  for (const card of named) {
    const home = own.find(([, cards]) => cards.has(card));
    if (home) {
      if (home[1].get(card) === false && namesCard(part, card))
        out.push({ check: "cards", message: `Needs you names ${card}, and ${home[0]} has answered it. Leave a settled card out of Needs you.` });
      continue;
    }
    const elsewhere = others.find(([, cards]) => cards.has(card));
    if (elsewhere && promptNames(prompt, card, elsewhere[0])) continue;
    sent.add(card);
    out.push({ check: "cards", message: elsewhere
      ? `This reply names ${card}, which belongs to ${elsewhere[0]}, not to ${ours}. It belongs to the window that works there, and the developer did not ask about it. ` +
        `Take the sentence out and change nothing else (RULE.DEVEX.WORKSPACE.197).`
      : `This reply names ${card}, and no approach page of ${ours} carries it.` });
  }
  // ANOTHER WORKSTREAM'S CARDS IN WORDS: a sentence that names an open workstream of another window with "card", "question" or "open".
  for (const [name] of others) {
    if (promptNames(prompt, null, name)) continue;
    const number = new RegExp(`\\b${name.slice(0, 3)}\\b`);
    const sentence = prose.split(/(?<=[.?!])\s+|\n+/).find((one) => (one.includes(name) || number.test(one)) && /\b(?:cards?|questions?|open)\b/i.test(one));
    if (sentence) out.push({ check: "cards", message:
      `This reply names the cards of another workstream: "${sentence.trim().slice(0, 120)}". ${name} belongs to the window that works there, and the developer did not ask about it. ` +
      `Take the sentence out and change nothing else (RULE.DEVEX.WORKSPACE.197).` });
  }
  // THE HANDOVER'S OPEN LINE holds this workstream's cards only.
  for (const fence of handoverFences(reply).filter((one) => !quotesTemplate(one))) {
    const open = handoverLines(fence.body).get("open") ?? "";
    const strange = [
      ...(open.match(/\bQ\d+\b/g) ?? []).filter((card) => !sent.has(card) && !own.some(([, cards]) => cards.has(card))
        && others.some(([name, cards]) => cards.has(card) && !promptNames(prompt, card, name))),
      ...others.map(([name]) => name).filter((name) => !promptNames(prompt, null, name)
        && (open.includes(name) || new RegExp(`\\b${name.slice(0, 3)}\\b`).test(open))),
    ];
    if (strange.length) out.push({ check: "cards", message:
      `The handover's \`open:\` line names ${[...new Set(strange)].join(" · ")}, which belongs to another workstream. The line holds only the cards of ${ours} ` +
      `(RULE.DEVEX.WORKSPACE.197).` });
  }
  return out.slice(0, 3);
}

/**
 * Cards as a line that says which workstream each belongs to: `021-figma-design-standard: Q10 · Q8`.
 * A card the map does not place is listed bare, so a caller with no map still gets its numbers.
 */
export function cardList(cards: string[], where: Map<string, string[]> = new Map()): string {
  const placed = new Set<string>();
  const parts: string[] = [];
  for (const [subject, held] of where) {
    const here = held.filter((card) => cards.includes(card));
    here.forEach((card) => placed.add(card));
    if (here.length) parts.push(`\`${subject}\`: ${here.join(" · ")}`);
  }
  const bare = cards.filter((card) => !placed.has(card));
  return [...parts, ...(bare.length ? [bare.join(" · ")] : [])].join("; ");
}

/** The fenced blocks of a reply that are shaped as a handover; a `diff` block never is. */
function handoverFences(reply: string): Fence[] {
  return fencesOf(reply).filter((fence) => fence.info !== "diff" && looksLikeHandover(fence.body));
}

/**
 * Whether the reply holds a handover block that is filled in and carries all eight labels. The hook
 * keeps this, so the block is asked for once (RULE.DEVEX.WORKSPACE.189).
 */
export function givesHandover(reply: string): boolean {
  const block = handoverFences(reply).find((fence) => !quotesTemplate(fence));
  if (!block) return false;
  const lines = handoverLines(block.body);
  return HANDOVER_LABELS.every((label) => lines.has(label));
}

/**
 * One hash of the rows of every arc in this window's workstreams. The hook keeps it when a whole
 * handover block is written. While it has not moved, the work stands where the block says, and no
 * second block is owed. Only this window's arcs are read, so another window's work never brings the
 * question back.
 */
export function stepsMark(root: string, mine: Set<string>): string {
  const rows = openArcs(root, mine).sort().map((arc) => `${arc}\n${rowsMark(dataOf(arc))}`);
  return createHash("sha256").update(rows.join("\n")).digest("hex").slice(0, 12);
}

// A REPLY THAT CLOSES A WORKSTREAM: the command that closes one, or the words that say it closed.
const CLOSES = /\bworkstream close\b|\b(?:closed|closes|closing) (?:the |this )?workstream\b|\bworkstream\s+(?:\d{3}[\w-]*\s+)?(?:is|was|now)\s+closed\b/i;

/**
 * What a reply opens with that a close or a handover may not: a table, a hash heading other than **Needs you**,
 * or a count, named for the message; null where its first line is prose.
 */
export function openingOf(reply: string): string | null {
  const first = reply.split("\n").find((line) => line.trim() !== "") ?? "";
  if (/^\s*\|/.test(first)) return "a table";
  if (/^[ \t]{0,3}#{1,6}[ \t]/.test(first) && !NEEDS_YOU.test(first)) return "a heading";
  if (/^[ \t]{0,3}(?:[-*][ \t]+)?(?:\*\*)?\d[\d,]*(?:[ \t]+of[ \t]+\d+)?[ \t]+\p{L}/u.test(first)) return "a count";
  return null;
}

/**
 * The handover check: a reply that passes work on carries the block, names each open card, and is
 * not sent while the installed plugins are behind their source.
 *
 * @param given  whether this window already wrote a whole block and the step rows of its arcs have
 *               not moved since (`stepsMark`); a pass-on with no block then owes nothing
 * @param earlier  the text messages of the turn before this reply (RULE.DEVEX.WORKSPACE.393): a block in one of them
 *               counts as given, and a second block in this reply is the extra one
 */
export function checkHandover(reply: string, root: string, mine: Set<string>, given = false, earlier: string[] = []): Warning[] {
  const handing = passingOn(reply);
  if (!handing && !CLOSES.test(unquoted(reply))) return [];
  // A REPLY THAT PUTS A WHOLE CARD ASKS A QUESTION, AND HANDS NOTHING OVER, also when it offers the
  // next window for after the answer.
  if (carriesCard(reply)) return [];

  // A CLOSE OR A HANDOVER OPENS WITH WHAT WAS DELIVERED AND WHAT WAS LEARNED (RULE.DEVEX.WORKSPACE.206), in
  // short paragraphs. A table, a heading or a count first is a status board the developer has to decode.
  const opening = openingOf(reply);
  if (opening)
    return [{ check: "handover", message:
      `This ${handing ? "handover" : "close"} opens with ${opening}. Open with what was delivered and what was learned, ` +
      `in short paragraphs, then the ask (RULE.DEVEX.WORKSPACE.206).` }];
  if (!handing) return [];

  // THE BLOCK IS OWED ONCE (RULE.DEVEX.WORKSPACE.189). A later reply names the handover in one line, and
  // so does the reply that answers a finding on the handover reply. A block printed again is still read.
  const shaped = handoverFences(reply);
  const earlierGiven = earlier.some((text) => givesHandover(text));
  if (earlierGiven && shaped.some((fence) => !quotesTemplate(fence)))
    return [{ check: "handover", message:
      `This turn holds two handover blocks: one in an earlier message and one in this reply. The second is the extra one. ` +
      `A handover is given once, as the turn's last message (RULE.DEVEX.WORKSPACE.393). Say in one line that the block above stands.` }];
  if ((given || earlierGiven) && !shaped.length) return [];

  // AN OPEN CARD IS NAMED IN ONE LINE, NEVER PUT IN FULL (RULE.DEVEX.WORKSPACE.189). The next window must
  // know the question is there, and the block's `open:` line is where it looks. This comes before the
  // wiring check because it is the cheaper truth.
  const where = cardsByWorkstream(root, mine);
  const unnamed = cardsWaiting(root, mine).filter((card) => !namesCard(reply, card));
  if (unnamed.length) {
    const many = unnamed.length > 1;
    return [{ check: "handover", message:
      `This reply passes work on while ${cardList(unnamed, where)} ${many ? "are" : "is"} open, and it does not name ` +
      `${many ? "them" : "it"}. Name each open card in one line on the block's \`open:\` line: its number and its question. ` +
      `Do not put the whole card in the reply: it is on the approach page, and the next window reads it there ` +
      `(RULE.DEVEX.WORKSPACE.189).` }];
  }

  // THE SECOND HALF FIRST, because it is the one that costs a window. A reply that tells somebody to
  // open a session is only true if the wiring that session will load is actually installed. The
  // previous sitting's own note read *the release, which is the developer's* — it was committed,
  // green, and stopped. The next window then ran the release, the release changed the wiring, and
  // changed wiring costs a window: one sitting's work became three windows, every note correct.
  //
  // `RULE.DEVEX.AGENT.057` says the tool that changed the wiring owes the note. It says what the note must
  // CONTAIN and never what must be TRUE before one is offered, so a note naming un-installed wiring
  // satisfies it completely. This is that missing precondition (N39 step 4).
  // ROOT IS PASSED IN, never read from `process.cwd()`. That is the fault this file already carries
  // a note about: a check reading the process's directory went silent whenever the hook ran anywhere
  // but the workspace root, which is most of the time.
  let wiring = "";
  try { wiring = cacheState(root, ["spn-devex", "spn-surface", "spn-apps", "spn-infra"]); } catch { wiring = ""; }
  if (wiring.startsWith("cache stale")) {
    return [{ check: "handover", message:
      `This reply passes work on while the plugin source is ahead of what is installed — ${wiring}. ` +
      `The session that changed the wiring is the one session that cannot load it, and it is also the ` +
      `only one that knows what changed. So finishing is this sitting's job, not the next reader's: ` +
      `release what changed, bump the plugins, install them, run \`workspace agent-sync\`, and verify ` +
      `every location from \`installed_plugins.json\`. Passing this on first is what turns one ` +
      `sitting into three windows (N39).` }];
  }

  const labels = HANDOVER_LABELS.map((label) => `${label}:`).join(" · ");
  const block = shaped.find((fence) => !quotesTemplate(fence));
  if (!block && shaped.length)
    return [{ check: "handover", message: `the handover block still holds \`{{…}}\` placeholders. Fill in every one — ${labels} — and write the same block into the arc's log.` }];
  if (!block)
    return [{ check: "handover", message: `this reply passes work on to another session and carries no handover block. Fill in the handover template in a fenced block — ${labels}, one per line, each value starting in the column \`do not touch:\` sets — with no \`{{…}}\` left, and write the same block into the arc's log.` }];
  const lines = handoverLines(block.body);
  const missing = HANDOVER_LABELS.filter((label) => !lines.has(label));
  if (missing.length)
    return [{ check: "handover", message: `the handover block is missing ${missing.map((label) => `\`${label}:\``).join(" · ")}. Each label opens its own line, lowercase, in this order: ${labels}. The next window starts from that block and has nothing else.` }];
  // THE LABELS FORM ONE COLUMN, so a missing line is visible and the next window can scan the block.
  // Every label is present here, so only where each value starts is left to read.
  const ragged = [...handoverColumns(block.body)].filter(([, column]) => column !== HANDOVER_COLUMN);
  if (ragged.length)
    return [{ check: "handover", message: `the handover block's values do not start in one column — ${ragged.map(([label, column]) => `\`${label}:\` starts its value in column ${column}`).join(" · ")}. Each value starts in column ${HANDOVER_COLUMN}, counted from 0, which is the column \`do not touch:\` sets with one space after it. Pad each shorter label with spaces, and indent a wrapped line to the same column.` }];
  const next = lines.get("continue") ?? "";
  if (!WORKSTREAM_NAME.test(next) || !ARC_NAME.test(next))
    return [{ check: "handover", message: `the handover block's \`continue:\` line names no ${WORKSTREAM_NAME.test(next) ? "arc (\`N<n>\`)" : "workstream (\`NNN-subject\`)"}. The next window finds everything else from those two.` }];
  return [];
}


// ---------------------------------------------------------------------------- the arc-to-page check
//
// A ROW WAITING ON THE DEVELOPER WHILE THE PAGE'S `Open` CARRIES NO CARD. The rest of what a page owes
// its arcs is `workstream state check`'s, which the `state` check below runs: an arc with no row in
// Cycles, a workstream with arcs and no page, and a card with no record or a record with no card.

/**
 * Whether a page names a card number anywhere — an open card, a settled row, or a deferred one.
 *
 * `\b` after the digits is what keeps `Q1` from matching inside `Q11`.
 */
function namesCard(text: string, card: string): boolean {
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  return new RegExp(`\\b${card}\\b`, "i").test(text);
}

/** Whether a page carries at least one card in the card pattern, which is a `div.sds-open`. */
function hasOpenCard(text: string): boolean {
  return /<div\b[^>]*class="(?:[^"]*\s)?sds-open(?:\s[^"]*)?"/i.test(text);
}

/**
 * Whether the card pattern can be read from these pages. The pattern is a class of the shared
 * stylesheet, and no class is read of a page that holds its own copy of the styles.
 */
function cardPatternReadable(pages: string[]): boolean {
  return !pages.some(holdsOwnCopy);
}

/** The open workstreams that have a page, as subject → its pages. */
function argued(root: string, mine: Set<string>): Array<[string, string[]]> {
  return [...openWorkstreams(root)].filter(([, pages]) => pages.length)
    .filter(([, pages]) => mine.has(basename(dirname(pages[0]))))
    .sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Every open workstream whose plan records a stop while its page says nothing is open.
 *
 * THE THIRD SHAPE, AND THE WORST OF THE THREE. The other two put a question in the wrong file, where
 * a reader could still find it. Here the split plan knows a row waits on somebody and the one section
 * they read says nothing does, so the question is written nowhere at all.
 */
export function stopsWithEmptyOpen(root: string, mine: Set<string>): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [subject, pages] of argued(root, mine)) {
    if (!cardPatternReadable(pages)) continue;
    const text = pages.map(read).join(" ");
    const waiting = workstreamPlan([dirname(pages[0])], pages).filter((row) => stateOf(row) === "stopped");
    if (waiting.length && !hasOpenCard(text)) out.push([subject, waiting[0].label]);
  }
  return out;
}

// ---------------------------------------------------------------------------- reply-shape
//
// RESTATES: 05-artifacts.md § The approach document → Open. The clause is the one most often missed:
// *open items put to a person in chat follow this layout exactly as a document's Open section does*
// — MUST. That covers a status reply, an answer to "what's left?", and a pending-work report.
//
// THE FAILURE IT CATCHES IS EXACT. A reply names lettered options — "say A and I will…", "my
// recommendation is B" — while showing no options table. The reader is asked to choose between
// things they were never shown, and the card grammar exists to stop precisely that.
//
// What it deliberately does NOT do: it never reads whether a recommendation is good, never counts
// words, and never fires on a reply that simply mentions a letter. Only a reply that asks for a
// choice, and does not show one.

// Every form seen in this workspace's own transcripts, and each needs a table.
//
// F18 — `option B` FIRED ON A REFERENCE. `It was option B, which F replaced` is somebody naming a
// superseded option in the past tense, not asking anybody to pick one, and the check's own contract
// says it never fires on a reply that merely mentions a letter. The discriminator is position: an
// option being PRESENTED opens a clause, an option being REFERRED TO sits inside one. So that branch
// now needs a sentence start or a clause break in front of it. Bold is NOT such a marker: emphasis
// wraps a reference as readily as an offer, and allowing it put the false positive straight back.
//
// CASE-SENSITIVE ON THE LETTER, AND THAT IS THE WHOLE OF F17. This carried an `i` flag, so `[A-D]`
// matched the English article `a` — and `pick a file`, `select a row`, `choosing with a sign-in` all
// read as somebody naming option A. It fired on a reply that asked nothing, over a behaviour row
// reading `sends an organization id of their own choosing with a sign-in`. An option is written
// upper-case, always, so the letter is upper-case here and only the leading word is either case.
const ASKS = /\b(?:[Ss]ay|[Aa]nswer|[Rr]eply|[Pp]ick|[Cc]hoose|[Cc]hoosing|[Ss]elect)\s+(?:with\s+)?[`"*]?(?:Q\d+)?[A-D]\b|\b[Rr]ecommendation\s+is\s+[`"*]?[A-D]\b|(?:^|[.:;\u2014]\s+)\**[Oo]ption\s+[`"*]?[A-D]\b|\b[A-D]\s*,\s*[A-D]\s*(?:,\s*[A-D]\s*)?(?:or|\/)\s*[A-D]\b/;

/**
 * A SENTENCE THAT REPORTS AN ANSWER IS NOT ASKING FOR ONE, and the pattern above cannot tell the
 * two apart because both name a letter. It fired on *…found it builds one file per domain — option
 * B*, which told the developer that their ALREADY ANSWERED card turned out to match option B: a
 * sentence about a decision they had made, demanded back as a decision card.
 *
 * Counting options was the wrong cure — *Two ways: option A now, or wait* is a real offer with one
 * letter in it. What separates them is the FRAME: a report says the thing was answered, decided or
 * chosen. So a sentence carrying one of those words is set aside, and whatever is left is read for
 * an ask. A reply that is genuinely putting a choice does not describe it as already made.
 */
const REPORTS = /\b(?:answered|decided|chose|chosen|settled|recorded)\b/i;
// A FENCED BLOCK IS A QUOTATION, NOT AN ASK — finding F19, and this check found it on itself.
//
// The handover block the chapter REQUIRES names the cards a session is leaving open, and naming one
// means writing its recommendation: *the recommendation is D then A*. That is a sentence about a
// card, inside a fence, in a reply whose whole purpose is to stop. This check read it as putting a
// decision and demanded the card be written out in full — in a block whose shape the book fixes.
//
// **So the gate refused the one reply shape the book makes mandatory**, on its first day, and the
// reply that tripped it was correct. The same reasoning `split-plan.ts` already applies to card
// numbers holds here: a number inside a code span is an EXAMPLE, and a card named inside a fence is
// a reference. An ask is something you write to the reader, in prose, outside the quotation.
//
// Stripping fences does not weaken the real check: a card's options are a markdown TABLE, never a
// fence, so every genuine card survives this unchanged.
//
// THE ONE LINE OF AN OLDER CARD IS A REFERENCE TOO (RULE.DEVEX.WORKSPACE.189). It may name the letter
// the agent recommends, and reading that as an ask demanded the whole card the **Needs you** check
// forbids. So a line that names a card open before this turn is set aside whole, and the rest is read.
const asking = (reply: string, older: string[] = []) =>
  ASKS.test(withoutFences(reply).split("\n").filter((line) => !older.some((card) => namesCard(line, card))).join("\n")
    .split(/(?<=[.!?\n])\s+/).filter((line) => !REPORTS.test(line)).join(" "));

// A markdown options table: a header row and the `| --- |` separator the grammar requires.
const TABLE = /^\|.*\|\s*$\n^\|[\s:-]*\|[\s:|-]*$/m;
// A lettered row inside a table — `| **A** | … | … |`. The shape the grammar actually asks for.
const LETTERED_ROW = /^\|\s*\**\s*[A-D]\s*\**\s*\|/m;

// THE CARD IS SIX PARTS AND THIS USED TO CHECK ONE. `refs/decision-cards.md` states the shape:
// number and summary, what, why, options, recommendation, preview. The gate tested for an options
// table and nothing else, so a reply carrying a heading, a table and two paragraphs was green —
// which is exactly what `008` sent, twice, with no `What`, no `Why` and no recommendation line.
//
// The developer's words are the contract (`Q258` `A`, 2026-09-24): *why ur not showing open question
// in correct format* · *prose should be always simple for chat as well as pages* · *when showing
// decision cards show information in detail such that devs can understand with context and take
// decision*.
//
// PRESENCE, NEVER QUALITY. This never reads whether a recommendation is good, never counts words and
// never scores an argument. A gate that judges prose is one people learn to write around, which is
// why `N43` step 5 was dropped. A part is here or it is not.
const NUMBERED = /\bQ\d+\b/;
// `What` and `Why` may be headings, bold leads or the `**What it changes**` form the pages use. What
// they may not be is absent — a reader deciding days later has only what the card carries.
const WHAT = /(^|\n)\s*(?:#{2,4}\s*|\*\*|<b>)?\s*What\b|\bwhat (?:it |this )?(?:changes|does|is being decided|it would change)\b/i;
const WHY = /(^|\n)\s*(?:#{2,4}\s*|\*\*|<b>)?\s*Why\b|\bwhat it costs to (?:leave|wait|do nothing)\b|\bwhat it blocks\b/i;
const RECOMMENDS = /\brecommend(?:ation|ed|s)?\b|\bI would take\b|\bthe one I would pick\b/i;

/** Which parts of the card a reply that puts a decision is missing, named one by one. */
function missingParts(reply: string): string[] {
  const out: string[] = [];
  if (!NUMBERED.test(reply)) out.push("**the number** — a card is `Q<n>`, stable across the whole exchange");
  if (!(TABLE.test(reply) && LETTERED_ROW.test(reply)))
    out.push("**the options as a lettered table**, the trade-off in its own column");
  if (!WHAT.test(reply)) out.push("**What** — the change concretely: the file, the rule, the before and after");
  if (!WHY.test(reply)) out.push("**Why** — what it costs to leave it alone, and what it blocks");
  if (!RECOMMENDS.test(reply)) out.push("**the recommendation** — one option, carrying the reason it wins");
  return out;
}

// THE REPLY OPENS WITH WHAT NEEDS YOU IN TWO CASES (RULE.DEVEX.WORKSPACE.189): it raises a card, or the
// agent waits while a card is open. Its first non-blank line is then `## Needs you`, `**Needs you**`
// or a plain `Needs you:` line. A progress reply owes no such part, and neither does a reply with no
// card open.
const NEEDS_YOU = /^[ \t]{0,3}(?:#{1,6}[ \t]*)?(?:\*\*|__)?[ \t]*Needs you\b/i;
// WHERE THE NEEDS YOU PART ENDS: the progress heading, or a rule. A card's own `### Q<n>` heading sits
// inside the part, so a heading ends it only when it names the progress.
const PART_ENDS = /^[ \t]{0,3}(?:(?:#{1,6}[ \t]*|\*\*|__)[ \t]*(?:Progress|What moved)\b|(?:-{3,}|\*{3,}|_{3,})[ \t]*$)/i;

/** Whether the reply's first non-blank line is the **Needs you** heading or line. */
export function opensWithNeedsYou(reply: string): boolean {
  const first = reply.split("\n").find((line) => line.trim() !== "") ?? "";
  return NEEDS_YOU.test(first);
}

/**
 * The reply's **Needs you** part: from its opening line to the progress heading or a rule, fences
 * set aside. Empty where the reply does not open with it.
 */
export function needsYouPart(reply: string): string {
  if (!opensWithNeedsYou(reply)) return "";
  const lines = withoutFences(reply).split("\n");
  const start = lines.findIndex((line) => line.trim() !== "");
  const out: string[] = [];
  for (let at = start; at < lines.length; at += 1) {
    if (at > start && PART_ENDS.test(lines[at])) break;
    out.push(lines[at]);
  }
  return out.join("\n");
}

/**
 * The cards and suggestions a **Needs you** part names by number alone: an item whose words, its markup and
 * separators set aside, are only `Q<n>` and `S<n>`.
 */
export function numbersOnly(part: string): string[] {
  const out: string[] = [];
  for (const line of part.split("\n").slice(1)) {
    const item = line.replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/, "").replace(/[*_`]/g, "").trim();
    if (!item || !/^(?:[QS]\d+)(?:[\s,;·&]+(?:and[\s]+)?[QS]\d+)*[.\s]*$/.test(item)) continue;
    out.push(...(item.match(/[QS]\d+/g) ?? []));
  }
  return [...new Set(out)];
}

/** Whether a stretch of text puts card `card` in full: its number and a lettered options table. */
function putsInFull(text: string, card: string): boolean {
  return namesCard(text, card) && TABLE.test(text) && LETTERED_ROW.test(text);
}

/**
 * The reply's shape: a decision it puts carries the whole card, and **Needs you** opens a reply in
 * two cases only (RULE.DEVEX.WORKSPACE.189). A reply that raises a card holds it there in full, once.
 * A reply that waits names each card still open from an earlier reply in one line. A progress reply
 * owes nothing for a card already read.
 *
 * A CARD IS PUT IN FULL ONCE. This asked for every open card in full in every reply, and one card
 * was repeated five or six times; one reply carried it twice, once in its body and once at the top
 * where this check then asked for it. Only a card the turn raised is asked for whole, and only at
 * the top; an older card is a line naming it.
 *
 * AND THE ONE LINE IS OWED ONLY WHEN THE AGENT WAITS. Asked for in every reply, the same lines opened
 * reply after reply while the work ran, and a new card arrived under a heading the developer had
 * learned to pass over.
 *
 * @param open     the cards open on the approach pages; read from the workspace at `root` in the hook,
 *                 and empty when not given, so a reply is then read for the card's parts alone
 * @param raised   the open cards this turn raised — open now and not open at the session's last Stop;
 *                 empty when there is no last Stop to compare with, and then every card is an older one
 * @param running  whether a row of this window's arcs is in progress (`workRuns`); the reply is then a
 *                 progress reply, and otherwise it is a reply that waits
 */
export function checkReplyShape(reply: string, open: string[] = [], raised: string[] = [],
                                where: Map<string, string[]> = new Map(), running = false): Warning[] {
  const out: Warning[] = [];
  const fresh = open.filter((card) => raised.includes(card));
  const older = open.filter((card) => !raised.includes(card));
  // The cards a reply that waits still owes one line each; a progress reply owes none.
  const owed = running ? [] : older;
  const many = (cards: string[]) => cards.length > 1;
  if (!opensWithNeedsYou(reply)) {
    if (fresh.length)
      out.push({ check: "needs-you", message:
        `${cardList(fresh, where)} ${many(fresh) ? "were" : "was"} raised in this reply, and the reply does not open with **Needs you**. ` +
        `Put ${many(fresh) ? "each" : "it"} in full under **Needs you** at the top, once` +
        (owed.length ? `, and name ${cardList(owed.slice(0, 4), where)} there in one line each` : "") +
        ` (RULE.DEVEX.WORKSPACE.189).` });
    else if (owed.length)
      out.push({ check: "needs-you", message:
        `No row of this window's arcs is in progress, so this reply waits, and it does not open with **Needs you** while ` +
        `${cardList(owed.slice(0, 4), where)} ${many(owed) ? "are" : "is"} open. Open the reply with **Needs you** and name each ` +
        `open card in one line: its number, its question, and where it is (RULE.DEVEX.WORKSPACE.189).` });
  } else if (open.length) {
    const part = needsYouPart(reply);
    const notWhole = fresh.filter((card) => !putsInFull(part, card));
    if (notWhole.length)
      out.push({ check: "needs-you", message:
        `${cardList(notWhole, where)} ${many(notWhole) ? "were" : "was"} raised in this reply and ${many(notWhole) ? "are" : "is"} not ` +
        `in full under **Needs you** at its top. A card goes there in full once; do not repeat it now, and from the next ` +
        `reply that waits it is one line (RULE.DEVEX.WORKSPACE.189).` });
    const unnamed = owed.filter((card) => !namesCard(part, card));
    if (unnamed.length)
      out.push({ check: "needs-you", message:
        `${cardList(unnamed.slice(0, 4), where)} ${many(unnamed) ? "are" : "is"} still open and the **Needs you** part does not ` +
        `name ${many(unnamed) ? "them" : "it"}. Add one line for each: its number, its question, and where it is; the full ` +
        `card stays on the approach page (RULE.DEVEX.WORKSPACE.189).` });
  }
  // A NEEDS YOU ITEM CARRIES ITS QUESTION OR ITS TITLE IN WORDS (RULE.DEVEX.WORKSPACE.189): a number alone is
  // the agent's handle, and the developer has to look it up.
  const bare = numbersOnly(needsYouPart(reply));
  if (bare.length)
    out.push({ check: "reply-shape", message:
      `Needs you names ${bare.join(" and ")} by number only. Write each one in words (RULE.DEVEX.WORKSPACE.189).` });
  // THE REPLY SPEAKS IN GOALS AND THE DEVELOPER'S WORDS, never the agent's working: the one list the doc check reads too.
  const detail = findWorkingDetail(withoutFences(reply));
  if (detail.length)
    out.push({ check: "reply-shape", message:
      `This reply names the agent's own working detail, which the developer does not read: ` +
      detail.slice(0, 3).map((one) => `${/^[aeiou]/.test(one.kind) ? "an" : "a"} ${one.kind} in "${one.sentence.slice(0, 160)}"`).join(" · ") +
      `. Rewrite ${detail.length > 1 ? "each sentence" : "the sentence"} in the goal's words; an arc number, and a card's number beside its words, may stay.` });
  if (!asking(reply, older)) return out;
  const missing = missingParts(reply);
  if (!missing.length) return out;
  out.push({ check: "reply-shape", message:
    "Your reply asks for a choice by its letter and the card is not whole. Missing: " + missing.join(" · ") + ". " +
    "Write the whole card once in this reply, in the layout the approach page uses, and put the same card on that page " +
    "(refs/devex/workspace/docs/decision-cards.md)." });
  return out;
}

/** The arc-to-page check, as warnings. */
export function checkArcToPage(root: string, mine: Set<string>): Warning[] {
  const stopped = stopsWithEmptyOpen(root, mine);
  if (!stopped.length) return [];
  return [{ check: "stopped-no-card", message:
    `A row waiting on the developer while \`Open\` carries no card — ` +
    stopped.slice(0, 4).map(([subject, row]) => `row ${row} in ${subject}`).join(" · ") +
    `. A stop is an open item like any other, and a question the plan knows about while the page ` +
    `says nothing is one nobody can answer. Write it as a \`Q<n>\` card in the page's \`Open\` ` +
    `(refs/devex/workspace/docs/decision-cards.md).` }];
}

/**
 * A go of this window's workstreams with a part ready and not started, or a report waiting to be folded,
 * while no card is open: the turn is told the next step the plan gives. A note to the agent, never a block
 * on the developer: with a card open the agent waits on the answer.
 *
 * @param cards  the cards open on this window's pages (`cardsWaiting`)
 */
export function checkGoNext(root: string, mine: Set<string>, cards: string[]): Warning[] {
  if (cards.length || !mine.size) return [];
  // A PART THAT WAITS ON SOMETHING OUTSIDE THE WINDOW IS SAID AS WAITING AND NEVER AS NEXT, and only beside a step that can be taken.
  return goStandings(root, mine).filter((go) => go.ready.length || go.unfolded.length).map((go) => ({ check: "go-next", message:
    `The go of ${go.workstream}/${go.lead} has ` +
    [go.ready.length ? `${go.ready.length === 1 ? "a part" : `${go.ready.length} parts`} ready and not started (${go.ready.join(", ")})` : "",
     go.unfolded.length ? `${go.unfolded.length === 1 ? "a report" : `${go.unfolded.length} reports`} waiting to be folded (${go.unfolded.join(", ")})` : ""]
      .filter(Boolean).join(" and ") +
    `, and no card is open. ` +
    (go.waiting.length ? `${go.waiting.map((one) => `${one.id} is waiting on ${one.on}`).join("; ")}, so it is not the next step. ` : "") +
    `Next: ${go.next}` }));
}

// ---------------------------------------------------------------------------- the page and the arcs

/**
 * A page left stale by an arc this session wrote (RULE.DEVEX.WORKSPACE.204). The parts of a page that
 * the arcs decide are the Cycles table, the header's status and the heading of `Open`. The write-time
 * check sees them only when the whole page is written, so an arc that moves leaves the page behind
 * and this is where it is said. A page with no Cycles table is left alone, because the command named
 * here has nothing to write on it. So is a page that holds its own copy of the styles, which that
 * command refuses.
 *
 * @param touched  the arcs this session's own tool calls wrote since its last Stop; `null` where that
 *                 is not known, and then nothing is compared
 */
export function checkPageCurrent(touched: Set<string> | null): Warning[] {
  if (!touched || !touched.size) return [];
  const behind: Array<{ workstream: string; parts: string[] }> = [];
  for (const folder of [...new Set([...touched].map((arc) => dirname(dirname(arc))))].sort()) {
    const parts = new Set<string>();
    for (const page of pagesOf(folder)) {
      const text = read(page);
      if (exemptWorkstream(page) || holdsOwnCopy(page) || !cyclesTableAt(text)) continue;
      if (cyclesRule(page, text).length) parts.add("the Cycles table");
      if (headerRule(page, text).length) parts.add("the header's status");
      if (openHeadingRule(page, text).length) parts.add("the heading of `Open`");
    }
    if (parts.size) behind.push({ workstream: basename(folder), parts: [...parts] });
  }
  // A PREVIEW SHOWS ITS ARC'S STATUS (RULE.DEVEX.WORKSPACE.251), and the same command writes it.
  const previews: Array<{ workstream: string; line: string }> = [];
  for (const arc of [...touched].sort()) {
    const data = dataOf(arc);
    const shows = previewStatusOf(read(previewOf(homeOf(arc), idOf(arc))));
    if (!data || !shows || exemptWorkstream(arc) || shows === arcStatus(data)) continue;
    previews.push({ workstream: basename(homeOf(arc)), line: `The preview of ${idOf(arc)} reads ${shows} and its arc is ${arcStatus(data)}` });
  }
  const said = previews.map((one) =>
    `${one.line}. Run \`spn-devex docs cycles write ${one.workstream}\`, which writes each preview's status from its arc ` +
    `(RULE.DEVEX.WORKSPACE.251).`).join(" ");
  if (!behind.length) return said ? [{ check: "page-stale", message: said }] : [];
  return [{ check: "page-stale", message: (said ? `${said} ` : "") +
    `An arc you wrote this turn left its page behind — ` +
    behind.map((one) => `\`${one.workstream}\`: ${one.parts.join(", ")}`).join(" · ") +
    `. The parts of a page that the arcs decide are produced, never typed (RULE.DEVEX.WORKSPACE.204). Run ` +
    behind.map((one) => `\`spn-devex docs cycles write ${one.workstream}\``).join(" and ") +
    `, which writes the header's status, the Cycles table and the heading of \`Open\` from the arcs. The rest ` +
    `of the page is yours to bring current in the same turn (05-artifacts.md § How ends in Cycles).` }];
}

/** The status a preview's header shows, as its status badge reads it; null where it shows none. */
export function previewStatusOf(text: string): string | null {
  return /<span class="sds-state">[\s\S]*?<(?:a|span)\b[^>]*\bsds-status\b[^>]*>(?:[^<A-Z]*?)\s*([A-Z][A-Z_]+)\s*<\/(?:a|span)>/.exec(text)?.[1] ?? null;
}

// ---------------------------------------------------------------------------- the workstream kept as data

/**
 * `workstream state check` over this window's workstreams kept as data (01-workstream.md § The commands).
 * The turn does not end while it fails, so a page behind its arcs, a missing preview or a card that
 * differs from its record is mended in the same turn, in any window. A workstream that still keeps
 * its arcs as Markdown waits for the one-time move, and is not read here.
 */
export function checkWorkstreamState(root: string, mine: Set<string>): Warning[] {
  const folders = workstreamsOf(root).filter((ws) => mine.has(basename(ws)) && heldByStop(ws));
  const findings = folders.flatMap(checkWorkstream);
  if (!findings.length) return [];
  const shown = findings.slice(0, 8).map((one) => `${one.workstream}${one.arc ? ` ${one.arc}` : ""}: ${one.message}`);
  return [{ check: "state", message:
    `\`spn-devex workstream state check\` fails — ${shown.join(" · ")}${findings.length > shown.length ? ` · and ${findings.length - shown.length} more` : ""}. ` +
    `Mend each before the turn ends: the page's parts by hand, then \`workstream arc stamp write <arc>\`; the data through ` +
    `the \`workstream\` commands, which are its only writers.` }];
}

/**
 * A migration the workspace's ledger lacks whose check still finds old shapes is owed work, and it
 * comes before any other (01-plugins.md § A release carries its migration, and a window runs what is
 * pending first). It reads the workspace, not this window's workstreams, because a migration is the
 * workspace's: work written in the old shape has to be moved again.
 */
export function checkMigrations(root: string): Warning[] {
  let pending;
  try { pending = standings(root, MIGRATIONS).filter((one) => one.state === "pending"); } catch { return []; }
  if (!pending.length) return [];
  const said = pending.map((one) => `${one.migration.id} (${one.found.length} place(s), such as ${one.found[0]}) — ${applyLine(one.migration)}`);
  return [{ check: "migration", message:
    `a plugin migration is pending, and it runs before any other work: ${said.join(" · ")}. ` +
    "`spn-devex plugin migration show` lists each one and its steps." }];
}

// ---------------------------------------------------------------------------- a page with its own copy of the styles

/**
 * The pages of the open workstreams this session reads that hold their own copy of the styles, each
 * as the line that names it: its path from the workspace, then `OWN_COPY`.
 */
export function ownCopyPages(root: string, mine: Set<string>): string[] {
  return argued(root, mine).flatMap(([, pages]) => ownCopyLines(root, pages));
}

/**
 * One warning for the pages that hold their own copy of the styles and were not named in this
 * session before. Such a page is read by its `id`s alone, so the checks on the shape of a card and on
 * the header's status say nothing about it, and this is where the developer is told why.
 *
 * @param told  the lines this session was given at an earlier Stop; a page is named once in a session
 */
export function checkOwnCopy(root: string, mine: Set<string>, told: string[] = []): Warning[] {
  const fresh = ownCopyPages(root, mine).filter((line) => !told.includes(line));
  if (!fresh.length) return [];
  return [{ check: "own-copy", message:
    `[RULE] ${fresh.join("\n[RULE] ")}\n` +
    `Until such a page links \`sds-docs.css\`, its cards are read by their \`id\`, and the shape of a card, ` +
    `the header's status and the parts that \`docs cycles write\` writes are not checked. Each page is ` +
    `named once in a session.` }];
}

// ---------------------------------------------------------------------------- welcome

/** Markdown emphasis off and white space folded, so a line compares as the words a reader sees. */
function plain(text: string): string {
  return text.replace(/\*\*|__|(?<![\w*])\*(?!\s)|(?<!\s)\*(?![\w*])/g, "").replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ").trim();
}

/**
 * How many prompts the developer has given in a transcript: the user entries that carry text of their own.
 * A tool result, a meta entry, a helper's side chain and a Stop hook's feedback are not prompts. The welcome
 * is judged only where this is exactly one, so a lost baseline can never make a later turn look like the first.
 */
export function promptCount(transcript: string): number {
  let raw = "";
  try { raw = readFileSync(transcript, "utf8"); } catch { return 0; }
  let count = 0;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry: { type?: string; isMeta?: boolean; isSidechain?: boolean; message?: { content?: unknown } };
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== "user" || entry.isMeta || entry.isSidechain) continue;
    const content = entry.message?.content;
    const text = typeof content === "string" ? content
      : Array.isArray(content) ? content.filter((part) => (part as { type?: string }).type === "text")
          .map((part) => (part as { text?: string }).text ?? "").join("\n") : "";
    if (text.trim() && !text.startsWith("Stop hook feedback:")) count += 1;
  }
  return count;
}

/**
 * Every assistant text block of a session's first turn, joined — the transcript from its start to
 * the first Stop. `last_assistant_message` is the turn's LAST text, and the welcome is its first.
 */
export function firstTurnText(transcript: string): string {
  let raw = "";
  try { raw = readFileSync(transcript, "utf8"); } catch { return ""; }
  const texts: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry: { type?: string; message?: { content?: unknown } };
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== "assistant" || !Array.isArray(entry.message?.content)) continue;
    for (const part of entry.message.content as Array<{ type?: string; text?: string }>)
      if (part.type === "text" && part.text) texts.push(part.text);
  }
  return texts.join("\n\n");
}

/** A user entry's own text: what the developer typed, with a tool result, a meta entry and a helper's side chain left out. */
function promptTextOf(entry: { type?: string; isMeta?: boolean; isSidechain?: boolean; message?: { content?: unknown } }): string {
  if (entry.type !== "user" || entry.isMeta || entry.isSidechain) return "";
  const content = entry.message?.content;
  const text = typeof content === "string" ? content
    : Array.isArray(content) ? content.filter((part) => (part as { type?: string }).type === "text")
        .map((part) => (part as { text?: string }).text ?? "").join("\n") : "";
  return text.trim() && !text.startsWith("Stop hook feedback:") ? text : "";
}

/**
 * The turn the Stop hook ends, from the transcript: the prompt that opened it and every text message the agent
 * wrote in it before this reply. The turn starts at the last prompt of the developer's own; a Stop hook's feedback
 * continues it. The reply itself, when the transcript already holds it, is left out of `earlier`.
 */
export function turnOf(transcript: string, reply: string): { prompt: string; earlier: string[] } {
  let raw = "";
  try { raw = readFileSync(transcript, "utf8"); } catch { return { prompt: "", earlier: [] }; }
  let prompt = "";
  let texts: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry: { type?: string; isMeta?: boolean; isSidechain?: boolean; message?: { content?: unknown } };
    try { entry = JSON.parse(line); } catch { continue; }
    const typed = promptTextOf(entry);
    if (typed) { prompt = typed; texts = []; continue; }
    if (entry.type !== "assistant" || entry.isSidechain || !Array.isArray(entry.message?.content)) continue;
    for (const part of entry.message.content as Array<{ type?: string; text?: string }>)
      if (part.type === "text" && part.text) texts.push(part.text);
  }
  if (texts.length && texts[texts.length - 1].trim() === reply.trim()) texts.pop();
  return { prompt, earlier: texts };
}

/**
 * The welcome's parts a first turn left out. The heading is matched by the words after the name,
 * because the name is optional and the heading has a first-visit form; the four lines under it are
 * matched whole, as text. A proof run (N116 row 8) met a heading alone, a line cut at its last
 * sentence, and no welcome at all, each on a prompt that carried work — so a line counts only when
 * every word of it is there.
 */
export function missingWelcome(text: string): string[] {
  // The 🤖 line carries the name as the heading does, so it is matched with the name's clause taken out.
  const said = plain(text).replace(/(I'm your DevEx agent), [^.]{1,21}\./, "$1.");
  const [, , tagline, , agent, , stages, , roles] = welcome(null, false).map(plain);
  // A builder's 👥 line carries the partner sentence, so either variant is the whole line.
  const builderRoles = plain(welcome(null, false, true)[8]);
  const missing: string[] = [];
  if (!/Welcome back to SaaS Plane!|Let's build something great\./.test(said)) missing.push("the heading");
  for (const [name, line] of [["the italic line", tagline], ["the 🤖 line", agent], ["the 🧭 line", stages]] as const)
    if (!said.includes(line)) missing.push(name);
  if (!said.includes(roles) && !said.includes(builderRoles)) missing.push("the 👥 line");
  return missing;
}

/** A session's first turn that does not open with the whole welcome (02-agent/01-agent.md § The session opens on the ground). */
export function checkWelcome(firstTurn: string): Warning[] {
  if (!firstTurn.trim()) return [];
  const missing = missingWelcome(firstTurn);
  if (!missing.length) return [];
  return [{ check: "welcome", message:
    `This session's first reply left out ${missing.join(" · ")} of the welcome. The first reply opens with ` +
    `the welcome word for word, whatever the prompt — a question and a pasted handover included — then ` +
    `the status line, then the answer (DEC.DEVEX.WORKSPACE.045). Do not print it again: a second welcome ` +
    `shows the developer a short one and then a long one. Say once, in one line, that the first reply ` +
    `missed it, then go on.` }];
}

// ---------------------------------------------------------------------------- what is said now, and what is held

// THE CHECKS WHOSE FINDING IS ABOUT THE REPLY ITSELF: a card it raised or a decision it put, a handover
// block, and the welcome of a first reply. The developer is reading that reply, so the finding cannot wait.
const ABOUT_THE_REPLY = new Set(["needs-you", "reply-shape", "cards", "handover", "how-it-runs", "partner-words", "page-path", "welcome", "window"]);

/**
 * The findings a turn end says now, and the ones it holds (RULE.DEVEX.WORKSPACE.244). While a row of this
 * window's arcs is in progress, only a finding about the reply sends the agent back. Every other one
 * is held, and the hook then leaves its baseline's marks where they were, so the checks find it again
 * at the first turn end where no row is in progress.
 *
 * @param running  whether a row of this window's arcs is in progress (`workRuns`)
 */
export function splitFindings(found: Warning[], running: boolean): { said: Warning[]; held: Warning[] } {
  if (!running) return { said: found, held: [] };
  return { said: found.filter((warning) => ABOUT_THE_REPLY.has(warning.check)),
           held: found.filter((warning) => !ABOUT_THE_REPLY.has(warning.check)) };
}

/**
 * A finding names only the workstreams of this window. One that names an open workstream of another window belongs to
 * that window, and nobody here can act on it. A finding about the reply is kept: it names another workstream to say it is
 * not this window's. The migration finding is the workspace's, and names the folders its ledger lacks. A workstream the
 * window visits is its own here too: the notes rule speaks for an arc the window changed there.
 *
 * @param visits  the workstreams the window only visits
 */
export function ownOnly(found: Warning[], root: string, mine: Set<string>, visits: Set<string> = new Set()): Warning[] {
  let open: string[] = [];
  try { open = readdirSync(workstreamsDir(root, "open")); } catch { /* none open */ }
  const others = open.filter((name) => !mine.has(name) && !visits.has(name));
  return found.filter((warning) => ABOUT_THE_REPLY.has(warning.check) || warning.check === "migration" || !others.some((name) => warning.message.includes(name)));
}

/**
 * An identical finding is said once, until its state changes. `told` holds each check's finding as a hash of its words;
 * a finding whose words are the same is left out, and a check that finds nothing is forgotten, so it is said again if it
 * returns. A finding about the reply is a new reply's own and is said every time.
 *
 * @param told  what the window's baseline holds from the turn ends before
 */
export function sayOnce(found: Warning[], told: Record<string, string>): { said: Warning[]; told: Record<string, string> } {
  const now: Record<string, string> = {};
  const said: Warning[] = [];
  for (const warning of found) {
    if (ABOUT_THE_REPLY.has(warning.check)) { said.push(warning); continue; }
    const mark = createHash("sha1").update(warning.message).digest("hex").slice(0, 12);
    now[warning.check] = mark;
    if (told[warning.check] !== mark) said.push(warning);
  }
  return { said, told: now };
}

// ---------------------------------------------------------------------------- the window's size

// WHEN A NEW WINDOW IS OFFERED, in tokens of context, all three in this one place, in any phase of the
// arc: at a clean point from CLEAN_POINT, always from ALWAYS_POINT. The offer is made once per window, and
// never while a helper runs.
const CLEAN_POINT = 200_000;
const ALWAYS_POINT = 450_000;

/**
 * THE WINDOW CHECK (RULE.DEVEX.AGENT.103): from 200k, at a clean point and in any phase, the turn is told to
 * offer a new window; past 450k it is told always. Clean is what can be computed: no row of this window's arcs
 * runs, no helper launched in the background is out, and `workstream state check` finds nothing for the
 * window's workstreams. That every open point is written first cannot be computed, so the message asks for it.
 * It reads the transcript and keeps no state: the offer is made once per window, and never while a helper runs.
 *
 * @param mine     the workstreams this window works on
 * @param running  whether a row of this window's arcs is in progress (`workRuns`): the offer then waits
 */
export function checkWindow(root: string, transcript: string, mine: Set<string>, running: boolean): Warning[] {
  const lines = transcript.split("\n");
  const size = Math.floor(windowSize(transcript) / 1000) * 1000;
  if (size < CLEAN_POINT) return [];
  // THE LAST OFFER, from the hook's own feedback in the transcript and never from other text.
  let offered = 0;
  for (const line of lines) {
    if (!line.includes("Stop hook feedback:") || !line.includes("[window] This window is at ")) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
      const content = entry.message?.content;
      const text = typeof content === "string" ? content
        : Array.isArray(content) ? content.map((part) => (part as { text?: string }).text ?? "").join("\n") : "";
      const told = /^Stop hook feedback:[\s\S]*?\[window\] This window is at (\d+)k/.exec(text);
      if (entry.type === "user" && told) offered = Number(told[1]) * 1000;
    } catch { /* a torn line is skipped */ }
  }
  // ONCE PER WINDOW: the offer was made, and the developer has it. A reply that ignored it is not asked again.
  if (offered) return [];
  // NEVER WHILE A HELPER RUNS: a row of the window's arcs in progress, or a background helper that has not handed back.
  if (running) return [];
  const always = size >= ALWAYS_POINT;
  const launched = new Map<string, number>();
  lines.forEach((line, at) => {
    if (!line.includes('"Agent"') || !line.includes("run_in_background")) return;
    try {
      const entry = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
      if (entry.type !== "assistant" || !Array.isArray(entry.message?.content)) return;
      for (const block of entry.message!.content as Array<Record<string, unknown>>) {
        const input = (block.input ?? {}) as Record<string, unknown>;
        if (block.type === "tool_use" && block.name === "Agent" && input.run_in_background === true) launched.set(String(block.id), at);
      }
    } catch { /* a torn line is skipped */ }
  });
  for (const [id, at] of launched) {
    const handed = `<tool-use-id>${id}</tool-use-id>`;
    if (!lines.slice(at + 1).some((line) => line.includes(handed))) return [];
  }
  if (!always && checkWorkstreamState(root, mine).length) return [];
  const written = "Write every open point first: a suggestion as S<n>, a question as a card, decided work as a row. ";
  // THE OFFER IS WHERE A PERSON LEARNS HOW WINDOWS WORK (01-workstream.md § The agent offers a new window):
  // a partner holds no book, so the reply says why, what is kept and how, in the person's words.
  const person = "Beside the handover, tell the person in one or two plain sentences, in their words and never this note's: " +
    "why a new window helps now (each reply re-reads the whole window, so a long one makes every reply cost more), " +
    "that nothing is lost (the handover and the workstream's folder carry every open point), " +
    "and how to open one (a new chat at the workspace root, in the editor they use, with the handover pasted as its first message). " +
    "Say no token count and no \"clean point\" unless you explain it. ";
  const small = "If the developer's ask is small (a question, a one-line change), say that each ask costs the window's whole size, and offer the new window then.";
  const message = always
    ? `This window is at ${size / 1000}k, past ${ALWAYS_POINT / 1000}k. ${written}Then say that the work moves to a new window, with its handover, whatever is running. ${person}${small}`
    : `This window is at ${size / 1000}k, past ${CLEAN_POINT / 1000}k, and the point is clean: no order running, \`workstream state check\` whole. ${written}Then end your reply with the offer of a new window and its handover. ${person}${small}`;
  return [{ check: "window", message }];
}

// ---------------------------------------------------------------------------- the send-backs

/**
 * Each check's send-backs in a transcript, and how many were followed by no tool call. A send-back is the hook's own
 * feedback entry, tagged `[check]`; it was acted on if the assistant called a tool before the next prompt or feedback.
 */
export function sendBackStats(transcript: string): Record<string, { sent: number; idle: number }> {
  const out: Record<string, { sent: number; idle: number }> = {};
  const lines = transcript.split("\n");
  const entries = lines.map((line) => { try { return line.includes("{") ? JSON.parse(line) as { type?: string; message?: { content?: unknown } } : null; } catch { return null; } });
  const textOf = (content: unknown): string => typeof content === "string" ? content
    : Array.isArray(content) ? content.map((part) => (part as { text?: string }).text ?? "").join("\n") : "";
  entries.forEach((entry, at) => {
    if (entry?.type !== "user") return;
    const text = textOf(entry.message?.content);
    if (!text.startsWith("Stop hook feedback:")) return;
    let acted = false;
    for (const next of entries.slice(at + 1)) {
      if (!next) continue;
      if (next.type === "assistant" && Array.isArray(next.message?.content) && (next.message!.content as Array<{ type?: string }>).some((block) => block.type === "tool_use")) { acted = true; break; }
      if (next.type === "user" && !(Array.isArray(next.message?.content) && (next.message!.content as Array<{ type?: string }>).every((block) => block.type === "tool_result"))) break;
    }
    for (const check of new Set([...text.matchAll(/(?:^|\n|\]: )\[([a-z][a-z-]*)\] /g)].map((one) => one[1]))) {
      const held = out[check] ?? { sent: 0, idle: 0 };
      out[check] = { sent: held.sent + 1, idle: held.idle + (acted ? 0 : 1) };
    }
  });
  return out;
}

/** The session's send-back counts so far, one cumulative line in `sendbacks.jsonl` beside the other turn-end telemetry; a no-op while recording is off. */
export function recordSendBacks(root: string | null, facts: { session?: string | null; agent?: string | null }, transcript: string | undefined): void {
  try {
    if (!root || !transcript || !facts.session || !telemetryDir(root)) return;
    const checks = sendBackStats(readFileSync(transcript, "utf8"));
    if (!Object.keys(checks).length) return;
    appendLog(join(telemetryFolder(root), "sendbacks.jsonl"), JSON.stringify({ at: utcNow(), session: facts.session, agent: facts.agent ?? null, checks }));
  } catch { /* a check never fails because telemetry did */ }
}

// ---------------------------------------------------------------------------- the hook

// MATCHES THE BUNDLED NAME TOO, BY EXACT BASENAME. This hook ships built as `dist/events/stop.mjs`,
// so the guard also accepts that name — but only the exact basename, never a suffix: this file's own
// test imports it from `t-stop.mjs`, which `endsWith("stop.mjs")` also matches, and a loose check
// made the test's own filename trip the guard it was never meant to fire for.
const argv1Base = process.argv[1] ? basename(process.argv[1]) : "";
if (argv1Base === "stop.ts" || argv1Base === "stop.mjs") {
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch { /* no stdin: run as a check */ }
  let reply = "";
  try { reply = JSON.parse(input || "{}")?.last_assistant_message ?? ""; } catch { reply = input; }
  // THE EVENT'S OWN `cwd` FIRST, AND THEN THE WALK UP. This read `process.cwd()` and stopped there,
  // so every check was silent whenever the hook ran anywhere but the workspace root — which is most
  // of the time, because a session is usually rooted in one member. The Python it replaces took the
  // payload's `cwd` and walked up to `.spndevex/`; this now does the same.
  let start = "";
  try { start = JSON.parse(input || "{}")?.cwd ?? ""; } catch { start = ""; }
  const inWorkspace = workspaceRoot(start || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const root = inWorkspace ?? (start || process.env.CLAUDE_PROJECT_DIR || process.cwd());

  let event: { session_id?: string; transcript_path?: string; stop_hook_active?: boolean; agent_id?: string; cwd?: string } = {};
  try { event = JSON.parse(input || "{}") ?? {}; } catch { event = {}; }
  const session = String(event.session_id ?? "");
  const facts = { script: "spn-devex", event: "Stop", tool: null, session: event.session_id ?? null, ...tagsOf(event),
                  process: { group: "events", action: "stop" } };
  begin(facts, root);
  // WHAT THE TURNS COST, written beside the timing log while recording is on, for `debug cost show`.
  recordUsage(root, facts, event.transcript_path);
  recordSendBacks(root, facts, event.transcript_path);
  // THIS SESSION'S OWN BASELINE, and the workstreams and arcs its own writes bound it to. Both come from
  // the window's note (`lib/window.ts`), which PreToolUse and the prompt hook write from the PATH of a
  // write, a prompt or a handover and never from text. The baseline's own old `workstreams` list is not
  // read: it was bound by names found anywhere in a write, and a log line mentioning another workstream
  // bound it for ever. A window with no binding gets the empty set and hears nothing about a card, a page,
  // an arc or a row (RULE.DEVEX.WORKSPACE.236).
  // A CHILD AGENT SHARES THE WINDOW'S session_id, so it keeps its own baseline file and never reads or
  // writes the window's: its view (no steps, no arcs) must not stand for the window's last turn.
  const baseline = readBaseline(root, session, event.agent_id ?? null);
  const mine = windowSet(root, session);
  const touched = baseline ? arcsWrittenSince(root, session, baseline.at) : new Set<string>();
  // A CHECK THAT SPOKE AT THIS SESSION'S LAST STOP HAS HAD ITS ANSWER. `stop_hook_active` says this
  // turn continues because a Stop hook spoke, so the reply is the answer to what it said. Judging it
  // with the same check again is the loop that held sessions until the harness ended the turn.
  const spoken = new Set(event.stop_hook_active === true ? baseline?.fired ?? [] : []);
  // The welcome belongs to the session's first prompt, read from the transcript: exactly one prompt so far.
  // No baseline alone never makes a turn the first.
  const firstTurn = !baseline && event.transcript_path && !event.agent_id && promptCount(event.transcript_path) === 1
    ? firstTurnText(event.transcript_path) : "";
  // THE WHOLE TURN, read from the transcript: its prompt, and the text messages before this reply.
  const turn = event.transcript_path ? turnOf(event.transcript_path, reply) : { prompt: "", earlier: [] as string[] };
  const where = cardsByWorkstream(root, mine);
  const waiting = span({ group: "stop", action: "cards" }, () => cardsWaiting(root, mine));
  // THE NEEDS-YOU CHECK READS ONLY THE CARDS THIS WINDOW RAISED, or no window recorded: a card another window
  // raised is put to that window, and demanding **Needs you** here for it is a demand nobody here can answer.
  const elsewhere = raisedElsewhere(root, mine, session);
  const ownCards = waiting.filter((card) => !elsewhere.has(card));
  // THE ARCS THIS WINDOW WROTE THIS TURN, IN ITS OWN WORKSTREAMS.
  const wrote = new Set([...touched].filter((arc) => mine.has(workstreamOf(arc))));
  // A VISITED WORKSTREAM IS READ FOR ONE THING: the notes rule on an arc this window itself changed there.
  const visits = visitedWorkstreams(root, session);
  const wroteAnywhere = new Set([...touched].filter((arc) => mine.has(workstreamOf(arc)) || visits.has(workstreamOf(arc))));
  // WHETHER WORK STILL RUNS, read once: it tells a progress reply from a reply that waits, and it
  // decides which findings are said now (RULE.DEVEX.WORKSPACE.189 and .244).
  const running = workRuns(root, mine);
  // A WHOLE HANDOVER BLOCK IS OWED ONCE. The baseline holds the step rows as they read when this window
  // wrote one, and while they read the same no second block is asked for.
  const rowsNow = stepsMark(root, mine);
  const given = baseline?.handover !== undefined && baseline.handover === rowsNow;
  const found = [
    ...span({ group: "stop", action: "reply-shape" }, () => checkReplyShape(reply, ownCards,
      baseline?.cards ? ownCards.filter((card) => !baseline.cards!.includes(card)) : [], where, running)),
    ...span({ group: "stop", action: "notes" }, () => checkNotesLanded(root, baseline?.arcs, wroteAnywhere, mine, visits)),
    ...span({ group: "stop", action: "arc-to-page" }, () => checkArcToPage(root, mine)),
    ...span({ group: "stop", action: "page-stale" }, () => checkPageCurrent(wrote)),
    ...span({ group: "stop", action: "state" }, () => checkWorkstreamState(root, mine)),
    ...span({ group: "stop", action: "migration" }, () => checkMigrations(root)),
    ...span({ group: "stop", action: "own-copy" }, () => checkOwnCopy(root, mine, baseline?.ownCopy ?? [])),
    ...span({ group: "stop", action: "cards" }, () => checkCardsNamed(reply, root, mine, turn.prompt)),
    ...span({ group: "stop", action: "runnable" }, () => checkRunnable(root, baseline?.at ?? 0, baseline?.steps ?? {}, wrote, mine, reply)),
    ...span({ group: "stop", action: "go-next" }, () => checkGoNext(root, mine, waiting)),
    ...span({ group: "stop", action: "handover" }, () => checkHandover(reply, root, mine, given, turn.earlier)),
    ...span({ group: "stop", action: "how-it-runs" }, () => checkHowItRuns(withoutFences(reply), root)),
    ...span({ group: "stop", action: "partner-words" }, () => checkPartnerWords(withoutFences(reply), root, turn.prompt)),
    ...span({ group: "stop", action: "page-path" }, () => checkPagePath(withoutFences(reply))),
    ...span({ group: "stop", action: "welcome" }, () => checkWelcome(firstTurn)),
    ...span({ group: "stop", action: "corpus" }, () => checkCorpus(root, reposWritten(root, session))),
    // A MAIN WINDOW ONLY, AND NOT WHERE THE TURN CONTINUES BECAUSE A HOOK SPOKE: the offer is made once.
    ...span({ group: "stop", action: "window" }, () => {
      if (event.agent_id || event.stop_hook_active === true || !event.transcript_path) return [];
      try { return checkWindow(root, readFileSync(event.transcript_path, "utf8"), mine, running); } catch { return []; }
    }),
  ];
  // WHILE A ROW IS IN PROGRESS, ONLY A FINDING ABOUT THE REPLY IS SAID (RULE.DEVEX.WORKSPACE.244).
  // AND A FINDING NAMES ONLY THIS WINDOW'S WORKSTREAMS, AND AN IDENTICAL ONE IS SAID ONCE UNTIL ITS STATE CHANGES.
  const split = splitFindings(ownOnly(found, root, mine, visits).filter((warning) => !spoken.has(warning.check)), running);
  const once = sayOnce(split.said, baseline?.told ?? {});
  const said = once.said, held = split.held;
  // A page is named once in a session, so the pages named now join the ones named before.
  const ownCopyTold = [...new Set([...(baseline?.ownCopy ?? []),
    ...(said.some((warning) => warning.check === "own-copy") ? ownCopyPages(root, mine) : [])])];
  end();
  // A HELD FINDING IS NOT STORED AS TEXT. A turn end that holds one leaves the baseline's marks where
  // they were, so the next turn end finds again what is still true. An arc new since then takes its
  // marks from now.
  const kept = held.length && baseline ? baseline : null;
  // AFTER the checks, never before: they compare against this and would compare against now. `fired`
  // keeps what spoke earlier in this turn beside what spoke now, so a third reply is not judged by
  // the first reply's check either. OUTSIDE A WORKSPACE NOTHING IS WRITTEN: the note would make the
  // `.spndevex/` it sits in, and every session below that folder would take it for a workspace.
  if (inWorkspace) writeBaseline(root, session, { at: kept ? kept.at : Date.now(),
                                 steps: kept ? { ...currentSteps(root), ...kept.steps } : currentSteps(root),
                                 fired: [...new Set([...spoken, ...said.map((warning) => warning.check)])],
                                 cards: waiting,
                                 arcs: kept ? { ...arcMarks(root), ...(kept.arcs ?? {}) } : arcMarks(root),
                                 ownCopy: ownCopyTold,
                                 told: { ...Object.fromEntries(Object.entries(baseline?.told ?? {}).filter(([check]) => held.some((warning) => warning.check === check))), ...once.told },
                                 handover: givesHandover(reply) ? rowsNow : given ? baseline?.handover : undefined }, event.agent_id ?? null);
  if (said.length) {
    console.error(said.map((w) => `[${w.check}] ${w.message}`).join("\n\n"));
    process.exit(2);   // a Stop hook's non-zero is how the message reaches the turn
  }
  process.exit(0);
}
