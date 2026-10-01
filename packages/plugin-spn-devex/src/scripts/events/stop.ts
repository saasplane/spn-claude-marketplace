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
//   runnable   a turn that ends while an arc THIS SESSION worked on still has rows to do, and nothing
//              blocks them; a row `⏸ held on Q<n>` is not runnable while that card is open
//   needs-you  a reply given while a card is open opens with **Needs you**: a card raised this turn in
//              full there, once, and every card still open from an earlier reply named in one line
//   notes      an answer logged in an arc lands in that arc's notes (spec, plan, samples) the same turn
//   carried    a proposed arc never carries a review point to a later step of itself
//   hold       an arc whose status reads HELD must name a card that exists and is unanswered
//   handover   a reply that says a new window is needed carries the nine labelled lines
//   welcome    a session's first turn opens with the welcome, word for word: the heading and its four lines
//   corpus     the docs trees still answer the questions only a whole-corpus read can ask
//
// `corpus` is the newest and the odd one out: every other check here reads what the TURN wrote, and
// that one reads the workspace. It is here because nothing else ran it — `N38` found that every
// corpus tool in this plugin was hand-run, so a defect was only ever found by somebody looking for
// something else. It keeps one verdict per docs tree, keyed by content, in `~/.spnutils/cache/corpus/`
// — a tree that has not moved since its verdict was written replays it rather than re-running every
// tool over it, which is what makes a per-turn hook affordable; see `checks/corpus.ts` for why that
// matters and what it costs.
//
// `runnable` is the one the developer asked for by name: *you keep getting stuck after reporting, and
// you should continue when there is no blocker.* Reporting is not stopping. A milestone line belongs
// between steps, in the same turn as the next step.

import { closeSync, openSync, readFileSync, readSync, readdirSync, rmSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { checkCorpus } from "../checks/corpus.ts";
import { STEP_ID, answeredNumbers, cardsOf, heldOn, isInProgress, markedAgo, openWorkstreams, stateOf, stepsOf,
         workstreamPlan } from "../checks/split-plan.ts";
import { TERMINAL } from "../checks/arc-status.ts";
import { workspaceRoot } from "../lib/payload.ts";
import { DEVEX, isApproachPage, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { cacheState, welcome } from "./orientation.ts";
import { begin, span, end, tagsOf } from "../../../../plugin-support-lib/src/lib/timing.ts";

type Warning = { check: string; message: string };

// The labels the handover template carries (`templates/workstream/handover-template.md`), in its
// order. Every handover owes all nine: a line that has nothing to say still says so (`no reload`,
// `none`), because a label left out cannot be told from a label forgotten. A label counts only where
// it opens a line, lowercase, with its colon, which is the layout the chapter states; the sentence
// form (`Continue workstream …`, `Model: …`) names none of them and is refused as a block missing
// all nine.
const HANDOVER_LABELS = ["continue", "model", "read first", "pins", "state", "live now", "done when",
  "do not touch", "open"];
const HANDOVER_LABEL_LINE = new RegExp(`^(${HANDOVER_LABELS.join("|")}):(.*)$`);
// `continue:` must carry the workstream (`008-plain-language`) and the arc (`N119`), because the next
// window finds everything else from those two.
const WORKSTREAM_NAME = /\b\d{3}-[a-z0-9][a-z0-9-]*/;
const ARC_NAME = /\bN\d+\b/;

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
// A GLYPH IS UNAMBIGUOUS AND A WORD IS NOT, so the two are read differently.
//
// `landed`, `carried` and `deferred` are ordinary English. Read against a whole row joined into one
// string, a step counted its own DESCRIPTION as its marker: thirteen rows in `008-plain-language`
// say one of those words in their prose, and `N90` step 3 — *spot-check the claimed-LANDED steps
// rather than trusting them* — reported as done because it is a step ABOUT landed steps. That is the
// direction that hides work, so the count it feeds is an undercount and nothing in the tables can
// fix it.
//
// So a word counts only where a marker is WRITTEN — as a cell's whole content, or at its start so a
// date or a commit may follow — and a glyph counts anywhere in the row, which is where the corpus
// puts it (`| 4 | ✅ **done 2026-09-23** — …`).
const DONE_GLYPHS = ["✅", "↷", "⊘"];
const DONE_WORDS = ["landed", "carried", "deferred"];

/** Whether a step row carries a done-mark, as opposed to merely naming one. */
function isDone(cells: string[]): boolean {
  if (cells.some((c) => DONE_GLYPHS.some((g) => c.includes(g)))) return true;
  return cells.some((c) => {
    const bare = c.replace(/[*_`~]/g, "").trim().toLowerCase();
    return DONE_WORDS.some((w) => bare === w || bare.startsWith(`${w} `));
  });
}

function read(p: string): string {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function openWorkstreamFolders(root: string): string[] {
  const dir = workstreamsDir(root, "open");
  try { return readdirSync(dir).map((d) => join(dir, d)).filter((d) => statSync(d).isDirectory()); }
  catch { return []; }
}

function arcsOf(ws: string): string[] {
  const dir = join(ws, "arcs");
  try { return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f)); }
  catch { return []; }
}

function pagesOf(ws: string): string[] {
  try { return readdirSync(ws).filter(isApproachPage).map((f) => join(ws, f)); }
  catch { return []; }
}

/**
 * An arc's status word, from the first `Status:` line, in either spelling the corpus uses.
 *
 * **IT READ ONE SPELLING AND THE CORPUS HAS TWO.** The pattern was `Status: **WORD`, and every arc
 * written from `N30` onward opens `**Status: WORD` — the bold around the label rather than after it.
 * Measured 2026-09-23 over workstream `008`: 37 arcs read, **10 unread, and the 10 are `N30` to
 * `N39`** — every arc of the current week. So the checks that read a status were blind to exactly
 * the arcs somebody was working on, which is the worst possible subset to be blind to.
 *
 * A hyphen is part of the word: `PART-LANDED` is a status, not `PART`.
 */
function statusOf(arc: string): string {
  const m = read(arc).match(/^\*{0,2}Status:?\*{0,2}\s*\*{0,2}\s*([A-Z][A-Z-]*)/m);
  return m ? m[1] : "";
}

/** Statuses that mean the arc is finished, so unfinished rows in it are history rather than work. */
// TERMINAL IS IMPORTED NOW, BECAUSE A SECOND COPY OF A CLOSED SET DRIFTS. This file
// kept its own — `LANDED · DONE · CLOSED · CARRIED · DEFERRED` — against the register's
// `LANDED · CARRIED · DROPPED`. Three of those five are not arc statuses at all, and `DROPPED` was
// missing, so an arc abandoned on purpose reported as runnable work for as long as anybody touched
// it. `arc-status.ts` already exported the set; this file simply did not ask for it.
//
// A STATUS THAT MEANS *DO NOT START THIS* IS NOT RUNNABLE, and four of the eight say so for four
// different reasons: nobody agreed it, its turn has not come, it is blocked, or it is finished.
// Inferring runnable from *has unfinished steps* is true of `RUNNING` and `PART-LANDED` and false of
// the rest — which is how an arc opened at `DECIDED` was reported, within a minute of being written,
// as work somebody had abandoned.
const NOT_RUNNABLE = new Set(["PROPOSED", "DECIDED", "HELD"]);

const DEBUG = ".debug";

/** The cards open on the approach page of the workstream an arc sits in (`<workstream>/arcs/<arc>`). */
function openCardsOf(arc: string): Set<string> {
  return new Set(pagesOf(dirname(dirname(arc))).flatMap(openCards));
}

/** Every card the approach page of an arc's workstream carries, open or answered. */
function pageCardsOf(arc: string): Set<string> {
  return new Set(pagesOf(dirname(dirname(arc))).flatMap((page) => cardsOf(page).map((card) => card.number)));
}

/**
 * The rows of an arc's own step table that are not yet done, or `null` where it has no `## Steps`.
 * A row marked `in progress <time>` is left out: somebody is on it, so it is not runnable work
 * (RD.DEVEX.WORKSPACE.184). `inProgressSteps` names those rows instead.
 *
 * A row marked `⏸ held on Q<n>` is left out while card `Q<n>` is open, because the card's answer can
 * change it (RD.DEVEX.WORKSPACE.188). Once the card is answered the row is runnable again, and its
 * line says so: `step 7 was held on Q352, which is answered — …`. A row held on a card the page does
 * not carry at all is runnable too, and its line names that instead: `step 7 is held on Q9, which is
 * not on the approach page — …`.
 *
 * @param open    the card numbers open on the workstream's page; read from the page when not given
 * @param onPage  every card number the page carries, open or answered; read from the page when not given
 */
export function unfinishedSteps(arc: string, open: Set<string> = openCardsOf(arc),
                                onPage: Set<string> = pageCardsOf(arc)): string[] | null {
  const steps = stepsOf(read(arc));
  if (steps === null) return null;
  // THE STATE CELL IS READ WHERE THE TABLE HAS ONE. The step row carries What, Mechanism and
  // Acceptance beside State, and any of them may open with `carried` or hold a `✅` in a quotation,
  // so a table with a State column is judged by that cell alone. An older table has none, and there
  // every cell is read as before.
  return steps
    .filter((step) => !isDone(step.state === null ? step.cells : [step.state]))
    .filter((step) => step.state === null || !isInProgress(step.state))
    .filter((step) => { const card = heldCard(step); return card === null || !open.has(card); })
    .map((step) => {
      const card = heldCard(step);
      if (card === null) return `step ${step.id} — ${step.what.slice(0, 70)}`;
      return onPage.has(card)
        ? `step ${step.id} was held on ${card}, which is answered — ${step.what.slice(0, 70)}`
        : `step ${step.id} is held on ${card}, which is not on the approach page — ${step.what.slice(0, 70)}`;
    });
}

/** The card a step's State cell holds it on, or `null`. A table with no State column holds nothing. */
function heldCard(step: { state: string | null }): string | null {
  return step.state === null ? null : heldOn(step.state);
}

/** The rows whose State cell reads `in progress <time>`, each with how old its mark is. */
export function inProgressSteps(arc: string, now = Date.now()): string[] {
  return (stepsOf(read(arc)) ?? [])
    .filter((step) => step.state !== null && isInProgress(step.state))
    .map((step) => `step ${step.id} — ${step.what.slice(0, 70)} (${markedAgo(step.state ?? "", now)})`);
}

/**
 * A card that is open and unanswered.
 *
 * **F16 — THIS HELD A SECOND, WRONG COPY OF THE TEST, AND IT MADE BOTH CHECKS BLIND.** It asked
 * whether `<b>Decision` appears at all. The card template ships `<b>Decision:</b> &mdash;`, which is
 * a card still waiting — so every card written the way the template asks read as ANSWERED here.
 * `runnable` therefore never saw a card as open and nagged through sittings where one was, and
 * `hold` would have reported every HELD arc as naming no open card.
 *
 * `split-plan.ts` fixed exactly this as F5 and its `cardsOf` carries the correct test: the marker's
 * presence is not the answer, what follows it is. There is one implementation now, because two were
 * how this drifted.
 */
function openCards(page: string): string[] {
  return cardsOf(page).filter((card) => !card.decided).map((card) => card.number);
}

/**
 * Just the step table's rows, so a log entry, a status line or a handover block cannot look like
 * work. This is the whole discriminator: the sitting writing ABOUT an arc moves everything else.
 */
function stepRows(text: string): string {
  return text.split("\n").filter((line) => {
    const first = /^\|\s*([^|]*)\|/.exec(line);
    return first !== null && STEP_ID.test(first[1].replace(/[*_`]/g, "").trim());
  }).join("\n");
}

/** A short hash of an arc's step rows — what a sitting working ON the arc changes. */
export function stepHash(text: string): string {
  return createHash("sha256").update(stepRows(text)).digest("hex").slice(0, 12);
}

/**
 * What one SESSION saw at its last `Stop`: when, each arc's step-row hash, how far into its
 * transcript it had read, and which checks it reported.
 *
 * **THE BASELINE IS PER SESSION, BECAUSE THE WORKSPACE IS SHARED.** One file per workspace compared
 * this window's turn against whichever window stopped last, so an arc another session was executing
 * read as this one's work. In a headless `claude -p` window that fired on `N114`, an arc nobody in
 * that window had touched, after every reply, and forced eight "Blocked" turns.
 *
 * **IT CANNOT USE `git`.** The workstream folder lives at the workspace root, which is not a
 * repository, so `git show HEAD:./arc.md` fails there for every arc.
 */
export type Baseline = { at: number; steps: Record<string, string>; transcriptAt?: number; fired?: string[];
                         cards?: string[]; arcs?: Record<string, ArcMark> };

/**
 * What one arc looked like at a Stop, for the `notes` and `carried` checks: a short hash of each of
 * its log entries, a signature of its notes (the spec, the plan and the samples under
 * `notes/N<nn>/`), and its status word.
 */
export type ArcMark = { log: string[]; notes: string; status: string };

const sessionKey = (id: string): string => (id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "_";
const sessionsDir = (root: string): string => join(root, DEVEX, DEBUG, "stop", "sessions");
// A session file older than this belongs to a window long closed, and is removed when a Stop writes.
const KEEP_MS = 14 * 24 * 3600 * 1000;

export function readBaseline(root: string, session: string): Baseline | null {
  try { return JSON.parse(readFileSync(join(sessionsDir(root), `${sessionKey(session)}.json`), "utf8")); }
  catch { return null; }
}

/** Every open arc's step-row hash, as this Stop sees it. */
function currentSteps(root: string): Record<string, string> {
  const seen: Record<string, string> = {};
  for (const ws of openWorkstreamFolders(root))
    for (const arc of arcsOf(ws)) seen[arc] = stepHash(read(arc));
  return seen;
}

export function writeBaseline(root: string, session: string, baseline: Baseline): void {
  try {
    const dir = sessionsDir(root);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${sessionKey(session)}.json`), JSON.stringify(baseline), "utf8");
    const cutoff = Date.now() - KEEP_MS;
    for (const name of readdirSync(dir))
      try { if (statSync(join(dir, name)).mtimeMs < cutoff) rmSync(join(dir, name), { force: true }); } catch { /* next */ }
  } catch { /* the check must never fail because it could not write its own note */ }
}

// The tools whose input can change a file. `Bash` counts only where its command writes, so a
// session that merely READ an arc while another window changed it is not taken for the writer.
const FILE_WRITERS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const SHELL_WRITES = /(?:>|\btee\b|\bsed\s+-i|\bperl\s+-[a-z]*i|\bpython3?\b|\bnode\b|\bmv\b|\bcp\b)/;

/**
 * The arcs this session's own tool calls wrote since `from` (a byte offset into its transcript), and
 * the transcript's size now. `null` where the transcript cannot be read, so the caller falls back to
 * the file times.
 *
 * THE TRANSCRIPT IS THE ONLY RECORD OF WHO WROTE A FILE. A file's time says it moved and never who
 * moved it, and several windows write the same workstream at once.
 */
export function arcsTouched(transcript: string, from: number, arcs: string[]): { touched: Set<string>; size: number } | null {
  let text = "";
  let size = 0;
  try {
    size = statSync(transcript).size;
    const start = from > 0 && from <= size ? from : 0;
    const buffer = Buffer.alloc(size - start);
    const fd = openSync(transcript, "r");
    try { readSync(fd, buffer, 0, buffer.length, start); } finally { closeSync(fd); }
    text = buffer.toString("utf8");
  } catch { return null; }
  const written: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.includes('"tool_use"')) continue;
    let entry: { message?: { content?: unknown } };
    try { entry = JSON.parse(line); } catch { continue; }
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const item of content as Array<{ type?: string; name?: string; input?: unknown }>) {
      if (item?.type !== "tool_use" || !item.name) continue;
      const input = JSON.stringify(item.input ?? {});
      if (FILE_WRITERS.has(item.name)) written.push(input);
      else if (item.name === "Bash" && SHELL_WRITES.test(input)) written.push(input);
    }
  }
  const touched = new Set(arcs.filter((arc) => written.some((input) => input.includes(arc) || input.includes(basename(arc)))));
  return { touched, size };
}

// ---------------------------------------------------------------------------- notes and carried

/** The top-level entries of an arc's `## Log`, each a line beginning `- `. */
export function logEntries(text: string): string[] {
  const at = text.search(/^##[ \t]+Log\b/m);
  if (at < 0) return [];
  const body = text.slice(at).split("\n").slice(1);
  const out: string[] = [];
  for (const line of body) {
    if (/^##[ \t]/.test(line)) break;
    if (/^- /.test(line)) out.push(line.trim());
  }
  return out;
}

const entryHash = (line: string): string => createHash("sha256").update(line).digest("hex").slice(0, 10);

/**
 * The files an arc's notes hold that an answer must land in: `notes/N<nn>/spec.md`, `plan.md`, and
 * everything under `samples/`. Orders and scratch are not the spec, so they are left out.
 */
export function notesFiles(arc: string): string[] {
  const id = basename(arc).match(/^(N\d+[a-z]?)(?:[-.]|$)/i)?.[1];
  if (!id) return [];
  const folder = join(dirname(dirname(arc)), "notes", id);
  const out: string[] = [];
  for (const name of ["spec.md", "plan.md"]) {
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
  walk(join(folder, "samples"));
  return out;
}

/** A signature of the notes files: each one's path, size and time, so reading it costs a stat each. */
function notesSignature(files: string[]): string {
  return createHash("sha256").update(files.map((file) => {
    try { const stat = statSync(file); return `${file}\u0000${stat.size}\u0000${stat.mtimeMs}`; } catch { return file; }
  }).join("\n")).digest("hex").slice(0, 12);
}

/** Every open arc's mark at this Stop. */
export function arcMarks(root: string): Record<string, ArcMark> {
  const out: Record<string, ArcMark> = {};
  for (const arc of openArcs(root)) {
    const text = read(arc);
    out[arc] = { log: logEntries(text).map(entryHash), notes: notesSignature(notesFiles(arc)), status: statusOf(arc) };
  }
  return out;
}

// AN ENTRY THAT RECORDS AN ANSWER OR A REVIEW POINT: a card answered (`Q396 B`, `Q401 revised`), an
// `update`, or the developer quoted. A `go.`, a landing or the agent's own decision is not one.
const RECORDS_AN_ANSWER = /\bQ\d+\s+(?:[A-D]\b|revised\b|answered\b)|\bupdates?\b|\breview points?\b|\(the developer\b/i;
const CARRIED_FORWARD = /\bcarried\b[^.;]{0,40}\bto\s+(?:step|row)\s+\d/i;

/**
 * The `notes` and `carried` checks (RD.DEVEX.WORKSPACE.193), over the arcs whose log gained entries
 * since this session's last Stop.
 *
 * `notes`: an entry that records an answer or a review point, in an arc whose `notes/N<nn>/` holds a
 * spec, a plan or samples, when none of those files changed. The answer lands in the card, the arc
 * and the notes in the same turn; a spec left as it was is what the next reader plans from.
 *
 * `carried`: an entry saying a point is carried to a later step, in an arc that was PROPOSED. Nothing
 * is built on its spec yet, so the point changes the spec now.
 *
 * @param before   each arc's mark at this session's last Stop; nothing is judged without one
 * @param touched  the arcs this session wrote, from its transcript; `null` reads every arc
 */
export function checkNotesLanded(root: string, before: Record<string, ArcMark> | undefined,
                                 touched: Set<string> | null = null): Warning[] {
  if (!before) return [];
  const out: Warning[] = [];
  for (const arc of openArcs(root)) {
    const was = before[arc];
    if (!was) continue;
    if (touched && !touched.has(arc)) continue;
    const text = read(arc);
    const seen = new Set(was.log);
    const added = logEntries(text).filter((line) => !seen.has(entryHash(line)));
    if (!added.length) continue;
    const files = notesFiles(arc);
    if (files.length && added.some((line) => RECORDS_AN_ANSWER.test(line)) && notesSignature(files) === was.notes) {
      const shown = files.filter((file) => !file.includes("/samples/")).map((file) => file.slice(file.indexOf("/notes/") + 1));
      if (files.some((file) => file.includes("/samples/"))) shown.push(`${files[0].slice(files[0].indexOf("/notes/") + 1).replace(/\/[^/]+$/, "")}/samples/`);
      out.push({ check: "notes", message:
        `\`${basename(arc)}\` logged an answer this turn and its notes did not move — ${shown.join(" · ")}. ` +
        `An answer, or any review point, lands in the same turn in the card, in the arc (a log line and every ` +
        `row it changes) and in the arc's notes: the spec, the plan and any sample they name — MUST ` +
        `(RD.DEVEX.WORKSPACE.193). Bring the notes the answer changes up to date now, and name them in the ` +
        `log line.` });
    }
    const status = statusOf(arc);
    if ((was.status === "PROPOSED" || status === "PROPOSED") && added.some((line) => CARRIED_FORWARD.test(line)))
      out.push({ check: "carried", message:
        `\`${basename(arc)}\` is PROPOSED and its log carries a review point to a later step of itself. A proposed ` +
        `arc never does: nothing is built on its spec yet, so the point changes the spec now (RD.DEVEX.WORKSPACE.193). ` +
        `Write it into the spec and the plan this turn.` });
  }
  return out;
}

/** Every arc file of every open workstream. */
function openArcs(root: string): string[] {
  return openWorkstreamFolders(root).flatMap(arcsOf);
}

/**
 * Arcs this session worked on that still have runnable steps, with no card open to block them.
 *
 * @param since    when THIS SESSION last stopped; 0 is its first Stop, and the check stays quiet
 * @param stepsAt  each arc's step-row hash at that Stop
 * @param touched  the arcs this session's own tool calls wrote since then, read from its transcript;
 *                 `null` where no transcript could be read, and then a file time newer than `since`
 *                 stands in for it
 */
export function checkRunnable(root: string, since = 0, stepsAt: Record<string, string> = {},
                              touched: Set<string> | null = null): Warning[] {
  const out: Warning[] = [];

  for (const ws of openWorkstreamFolders(root)) {
    const cards = pagesOf(ws).flatMap(openCards);
    for (const arc of arcsOf(ws)) {
      // WHICH ARC IS BEING EXECUTED IS A FACT, NOT A CLAIM, AND IT IS THIS SESSION'S FACT. A status
      // word is a claim any window can have written: `RUNNING` fired on `N114` in a headless window
      // that had never opened it, after every reply. What this session wrote is in its transcript,
      // and an arc it wrote whose step rows moved since its own last Stop is the arc it is executing.
      const status = statusOf(arc);
      if (TERMINAL.has(status)) continue;          // its unfinished rows are history, not work
      // `HELD` names its blocker in its own line, and that blocker is frequently an ARC rather than a
      // card, which the `cards.length` guard below cannot see. `PROPOSED` and `DECIDED` have not
      // started. None of the three is runnable, whoever touched it.
      if (NOT_RUNNABLE.has(status)) continue;
      // NO BASELINE MEANS NO INFERENCE. A session's first Stop has nothing of its own to compare
      // against, and a headless window has only a first Stop, so it stays quiet.
      if (!since) continue;
      let wrote = false;
      if (touched) wrote = touched.has(arc);
      else { try { wrote = statSync(arc).mtimeMs > since; } catch { wrote = false; } }
      if (!wrote) continue;
      // EDITING AN ARC IS NOT EXECUTING IT. A status line, a log entry and a handover block are the
      // sitting writing ABOUT the arc; a step table changing is the sitting working ON it. An arc
      // absent from the baseline was written after it, and that is not evidence of work either.
      const now = stepHash(read(arc));
      if ((stepsAt[arc] ?? now) === now) continue;           // the record moved, the work did not
      const steps = unfinishedSteps(arc, new Set(cards));
      // A ROW IN PROGRESS IS NAMED WITH ITS AGE, NEVER CALLED RUNNABLE. The mark says somebody is on
      // it; whether that is this sitting or a window that has gone, only the developer can say.
      const claimed = inProgressSteps(arc);
      if (claimed.length && !cards.length)
        out.push({
          check: "runnable",
          message: `\`${basename(arc)}\` has ${claimed.length === 1 ? "a row" : `${claimed.length} rows`} marked in progress: ` +
            `${claimed.join(" · ")}. If this sitting is on it, finish it and mark it landed with its commit, or mark ` +
            `it \`◐ stopped\` with what was done. If another window marked it, leave it and ask the developer, ` +
            `saying how old the mark is (02-workstream/01-workstream.md § A step row says where, at what altitude, and how).`,
        });
      if (steps === null) {
        out.push({ check: "runnable", message: `\`${basename(arc)}\` reads ${status || "no status"} and has no \`## Steps\` table, so nothing can say whether work is left. Give it the step table the arc template carries.` });
        continue;
      }
      if (!steps.length) continue;
      if (cards.length) continue;   // a card blocks: the hold reply covers that case
      out.push({
        check: "runnable",
        message: `stopped with runnable work — this session changed the step rows of \`${basename(arc)}\`, and ${steps.length} step` +
          `${steps.length > 1 ? "s are" : " is"} not landed, and no card is open. The next one is ${steps[0]}. ` +
          `Reporting is not stopping: a milestone line goes between steps, in the same turn as the next step ` +
          `(02-workstream/01-workstream.md § Say what you opened, and know when to wait for the answer).`,
      });
    }
  }
  return out;
}

export function checkHold(root: string): Warning[] {
  const out: Warning[] = [];
  for (const ws of openWorkstreamFolders(root)) {
    const cards = new Set(pagesOf(ws).flatMap(openCards));
    for (const arc of arcsOf(ws)) {
      if (statusOf(arc) !== "HELD") continue;
      const named = [...read(arc).matchAll(/`?(Q\d+)`?/g)].map((m) => m[1].toUpperCase());
      const live = named.filter((n) => cards.has(n));
      if (!live.length)
        out.push({ check: "hold", message: `\`${arc.split("/").pop()}\` reads HELD and names no card that is open and unanswered. A HELD arc waits on a card; if its cards are answered, re-plan it and lift the hold.` });
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
const SESSION = /\b(?:new|fresh|another|next)\s+(?:window|session)\b|\bhand(?:ing)?\s+(?:this |it )?over\b/gi;
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
 * Every `Q<n>` open and unanswered across every open workstream's page.
 *
 * `openCards` above takes ONE page and is about that page's own cards; this asks the workspace-wide
 * question a handover has to answer, and it subtracts what an arc records as settled — a card the
 * page still shows but an arc has answered is not work anybody is waiting on.
 */
function cardsWaiting(root: string): string[] {
  const out: string[] = [];
  for (const [, pages] of argued(root)) {
    const folder = dirname(pages[0]);
    const answered = answeredNumbers(folder);
    for (const page of pages)
      for (const card of cardsOf(page))
        if (!card.decided && !answered.has(card.number)) out.push(card.number);
  }
  return [...new Set(out)].sort();
}

export function checkHandover(reply: string, root: string): Warning[] {
  if (!passingOn(reply)) return [];
  // A REPLY PUTTING THE OPEN CARD IN FULL IS THE ANSWER THIS CHECK ASKS FOR. It fired twice in a row
  // on replies that handed nothing over and carried `Q329` whole, demanding the card they carried.
  if (carriesCard(reply)) return [];

  // AN OPEN CARD BEATS A HANDOVER, AND IT COMES FIRST — finding F20, caught by the developer twice
  // in one session after the agent offered a new window with two cards standing.
  //
  // **A card open is work nobody can plan around.** Its answer may change which arc runs next, what
  // the next window reads first, and whether the step named in the block is still the right step —
  // so a handover written over an open card is a plan built on an unknown. The next window inherits
  // the question AND a brief that assumed an answer to it.
  //
  // The rule the book already states is *you stop only when something needs deciding*, and a card is
  // exactly that. What it never said is the converse: **while something needs deciding, you do not
  // hand the work to somebody else** — you ask, and the answer either changes the plan or it does
  // not. Asking costs a turn; a handover built on a guess costs a window.
  //
  // This fires BEFORE the wiring check because it is the cheaper truth: there is no point telling
  // somebody their install is stale if the work itself is not ready to pass on.
  const waiting = cardsWaiting(root);
  if (waiting.length) {
    return [{ check: "handover", message:
      `This reply passes work on while ${waiting.length === 1 ? "a card is" : `${waiting.length} cards are`} ` +
      `open — ${waiting.join(" \u00b7 ")}. **Answer first, then hand over.** A card's answer can change which ` +
      `arc runs next and what the next window reads first, so a handover written over one is a brief that ` +
      `assumed an answer nobody gave. Put the cards to the developer in full, and offer the window once they ` +
      `are settled.` }];
  }

  // THE SECOND HALF FIRST, because it is the one that costs a window. A reply that tells somebody to
  // open a session is only true if the wiring that session will load is actually installed. The
  // previous sitting's own note read *the release, which is the developer's* — it was committed,
  // green, and stopped. The next window then ran the release, the release changed the wiring, and
  // changed wiring costs a window: one sitting's work became three windows, every note correct.
  //
  // `RD.DEVEX.AGENT.057` says the tool that changed the wiring owes the note. It says what the note must
  // CONTAIN and never what must be TRUE before one is offered, so a note naming un-installed wiring
  // satisfies it completely. This is that missing precondition (N39 step 4).
  // ROOT IS PASSED IN, never read from `process.cwd()`. That is the fault this file already carries
  // a note about: a check reading the process's directory went silent whenever the hook ran anywhere
  // but the workspace root, which is most of the time.
  let wiring = "";
  try { wiring = cacheState(root, ["spn-devex", "spn-apps", "spn-infra"]); } catch { wiring = ""; }
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
  const shaped = fencesOf(reply).filter((fence) => fence.info !== "diff" && looksLikeHandover(fence.body));
  const block = shaped.find((fence) => !quotesTemplate(fence));
  if (!block && shaped.length)
    return [{ check: "handover", message: `the handover block still holds \`{{…}}\` placeholders. Fill in every one — ${labels} — and write the same block into the arc's log.` }];
  if (!block)
    return [{ check: "handover", message: `this reply passes work on to another session and carries no handover block. Fill in the handover template in a fenced block — ${labels}, one per line, each value starting in the column \`do not touch:\` sets — with no \`{{…}}\` left, and write the same block into the arc's log.` }];
  const lines = handoverLines(block.body);
  const missing = HANDOVER_LABELS.filter((label) => !lines.has(label));
  if (missing.length)
    return [{ check: "handover", message: `the handover block is missing ${missing.map((label) => `\`${label}:\``).join(" · ")}. Each label opens its own line, lowercase, in this order: ${labels}. The next window starts from that block and has nothing else.` }];
  const next = lines.get("continue") ?? "";
  if (!WORKSTREAM_NAME.test(next) || !ARC_NAME.test(next))
    return [{ check: "handover", message: `the handover block's \`continue:\` line names no ${WORKSTREAM_NAME.test(next) ? "arc (\`N<n>\`)" : "workstream (\`NNN-subject\`)"}. The next window finds everything else from those two.` }];
  return [];
}


// ---------------------------------------------------------------------------- the arc-to-page checks
//
// PORTED FROM `hooks/scripts/stop.py`, WHICH WAS SILENT ON THIS WORKSPACE. Every one of its four
// checks listed an open workstream's arcs as `name.startswith('arc-')`. The naming moved to
// `N1-{subject}.md` and the filter was never followed, so on 2026-09-19 workstream `008` held
// FOURTEEN arcs, none of them named `arc-`, and the whole file reported nothing.
//
// Drop the filter and the same code has three real findings on that workstream, and an arc carrying
// two `Q` cards while the page's `Open` reads *none* — which is precisely the shape `cardsInArcs`
// was written for. Finding F11 in this arc.
//
// So these read every `.md` under `arcs/`, which is what `arcsOf` above already did.

/**
 * Whether a page names a card number anywhere — an open card, a settled row, or a deferred one.
 *
 * `\b` after the digits is what keeps `Q1` from matching inside `Q11`.
 */
function namesCard(text: string, card: string): boolean {
  return new RegExp(`\\b${card}\\b`, "i").test(text);
}

/** Whether a page carries at least one card in the card pattern. */
function hasOpenCard(text: string): boolean {
  return /<div\b[^>]*class="[^"]*\bopen\b[^"]*"/i.test(text);
}

/** The open workstreams that have a page, as subject → its pages. */
function argued(root: string): Array<[string, string[]]> {
  return [...openWorkstreams(root)].filter(([, pages]) => pages.length)
    .sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Every arc in an open workstream that no row of its page names.
 *
 * AN ARC IS NOT WRITTEN UNTIL THE PAGE CARRIES IT. The arc is the plan and the page is what you
 * read, so an arc no row names is work that looks finished from the only surface anybody opens.
 *
 * The page must name the arc FILE. Rows name pieces of work, never the arc they belong to, so
 * matching a row's words against a filename was guesswork — it fired on a page that carried every
 * arc under a heading. A citation is explicit, greppable, and useful to a reader who wants the
 * argument behind a plan.
 */
export function unnamedArcs(root: string): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const pageText = pages.map(read).join(" ");
    for (const arc of arcsOf(dirname(pages[0]))) {
      const name = basename(arc);
      if (!pageText.includes(name)) out.push([subject, name, basename(pages[0])]);
    }
  }
  return out;
}

/**
 * Every open workstream that holds arcs and has no page at all.
 *
 * THE CHECK'S OWN WORST CASE, AND IT WAVED IT THROUGH. `unnamedArcs` begins by skipping a workstream
 * with no pages, so the strongest form of the failure it exists to catch — an arc nobody can read,
 * because there is no page to read — was the one shape it never reported. `008-plain-language` sat in
 * exactly that state while the check ran green beside it.
 */
export function pagelessWorkstreams(root: string): string[] {
  const out: string[] = [];
  for (const [subject, pages] of [...openWorkstreams(root)].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (pages.length) continue;
    for (const folder of openWorkstreamFolders(root))
      if (basename(folder) === subject && arcsOf(folder).length) { out.push(subject); break; }
  }
  return out;
}

/**
 * Every open workstream whose plan records a stop while its page says nothing is open.
 *
 * THE THIRD SHAPE, AND THE WORST OF THE THREE. The other two put a question in the wrong file, where
 * a reader could still find it. Here the split plan knows a row waits on somebody and the one section
 * they read says nothing does, so the question is written nowhere at all.
 */
export function stopsWithEmptyOpen(root: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const text = pages.map(read).join(" ");
    const waiting = workstreamPlan([dirname(pages[0])], pages).filter((row) => stateOf(row) === "stopped");
    if (waiting.length && !hasOpenCard(text)) out.push([subject, waiting[0].label]);
  }
  return out;
}

/**
 * Every open workstream whose ARCS carry `Q<n>` cards while its page shows none.
 *
 * THIS IS THE SHAPE THAT ACTUALLY HAPPENED, twice in one sitting on `011`. The agent wrote five cards
 * into an arc while the page's `Open` said nothing, and the developer caught it both times.
 * `stopsWithEmptyOpen` reads a row's STATE, which catches a related shape and would not have caught
 * this one: those rows read `pending`, and the question was never a row at all.
 *
 * A CARD THE PAGE ALREADY NAMES IS NOT THIS SHAPE. An arc is where a card's argument belongs — the
 * options, what each costs, and why one won — once the page carries the answer somewhere a reader
 * finds it. Finding F12: this fired on `008`'s `Q11`, argued in `N1b` and answered on the page in
 * its *Settled already* table, which is the arrangement the convention asks for. The question is
 * whether the PAGE names the number at all, not whether it still has a card open.
 */
export function cardsInArcs(root: string): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const pageText = pages.map(read).join(" ");
    if (hasOpenCard(pageText)) continue;
    for (const arc of arcsOf(dirname(pages[0]))) {
      const unrecorded = [...read(arc).matchAll(/^#{2,4}\s+`?(Q\d+[A-Z]?)`?\s*[·\u00b7]/gm)]
        .map((found) => found[1])
        .filter((card) => !namesCard(pageText, card));
      if (unrecorded.length) { out.push([subject, basename(arc), unrecorded[0]]); break; }
    }
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
const asking = (reply: string) =>
  ASKS.test(withoutFences(reply).split(/(?<=[.!?\n])\s+/).filter((line) => !REPORTS.test(line)).join(" "));

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

// THE REPLY OPENS WITH WHAT NEEDS YOU (RD.DEVEX.WORKSPACE.189). While a card is open, the reply's
// first non-blank line is `## Needs you`, `**Needs you**` or a plain `Needs you:` line. With no card
// open the part is left out, so a reply is only read for it while a card is open.
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

/** Whether a stretch of text puts card `card` in full: its number and a lettered options table. */
function putsInFull(text: string, card: string): boolean {
  return namesCard(text, card) && TABLE.test(text) && LETTERED_ROW.test(text);
}

/**
 * The reply's shape: a decision it puts carries the whole card, and a reply given while a card is
 * open opens with **Needs you**, which holds each card this turn raised in full, once, and names
 * every card still open from an earlier reply in one line (RD.DEVEX.WORKSPACE.189).
 *
 * A CARD IS PUT IN FULL ONCE. This asked for every open card in full in every reply, and one card
 * was repeated five or six times; one reply carried it twice, once in its body and once at the top
 * where this check then asked for it. Only a card the turn raised is asked for whole, and only at
 * the top; an older card is a line naming it.
 *
 * @param open    the cards open on the approach pages; read from the workspace at `root` in the hook,
 *                and empty when not given, so a reply is then read for the card's parts alone
 * @param raised  the open cards this turn raised — open now and not open at the session's last Stop;
 *                empty when there is no last Stop to compare with, and then every card is an older one
 */
export function checkReplyShape(reply: string, open: string[] = [], raised: string[] = []): Warning[] {
  const out: Warning[] = [];
  const fresh = open.filter((card) => raised.includes(card));
  const older = open.filter((card) => !raised.includes(card));
  const oneLine = "each card still open from an earlier reply is one line — its number, its question, and where it is";
  if (open.length && !opensWithNeedsYou(reply))
    out.push({ check: "needs-you", message:
      `A card is open — ${open.slice(0, 4).join(" · ")} — and the reply does not open with **Needs you**. ` +
      `Every reply while work runs opens with what needs you, then the progress — MUST (RD.DEVEX.WORKSPACE.189). ` +
      (fresh.length ? `A card raised in this reply goes there in full once (${fresh.join(" · ")}); ` : "") +
      `${oneLine}. Do not repeat a card already put in full.` });
  else if (open.length) {
    const part = needsYouPart(reply);
    const notWhole = fresh.filter((card) => !putsInFull(part, card));
    if (notWhole.length)
      out.push({ check: "needs-you", message:
        `${notWhole.join(" · ")} ${notWhole.length > 1 ? "were" : "was"} raised in this reply and ${notWhole.length > 1 ? "are" : "is"} not ` +
        `in full under **Needs you** at its top. A card is put in full once, at the top of the reply that raises it, and ` +
        `never again in its body — MUST (RD.DEVEX.WORKSPACE.189). Do not repeat it now: from your next reply it is ` +
        `one line — its number, its question, and where it is — and the full card stays on the approach page.` });
    const unnamed = older.filter((card) => !namesCard(part, card));
    if (unnamed.length)
      out.push({ check: "needs-you", message:
        `${unnamed.slice(0, 4).join(" · ")} ${unnamed.length > 1 ? "are" : "is"} still open and the **Needs you** part does not ` +
        `name ${unnamed.length > 1 ? "them" : "it"}. ${oneLine[0].toUpperCase()}${oneLine.slice(1)}, before the progress — ` +
        `MUST (RD.DEVEX.WORKSPACE.189). Never the full card again: that stays on the approach page.` });
  }
  if (!asking(reply)) return out;
  const missing = missingParts(reply);
  if (!missing.length) return out;
  out.push({ check: "reply-shape", message:
    "Your reply puts a decision and the card is not whole. Missing: " + missing.join(" · ") + ". " +
    "A card put to a person in chat follows the same layout a document uses — MUST — and it assumes " +
    "**no memory of this session**, because people decide days later (refs/devex/workspace/docs/decision-cards.md). " +
    "Write it in full in the reply, with the detail to decide from, and put the same card on the " +
    "approach page." });
  return out;
}

/** The four arc-to-page checks, as warnings. */
export function checkArcToPage(root: string): Warning[] {
  const out: Warning[] = [];
  const pageless = pagelessWorkstreams(root);
  if (pageless.length)
    out.push({ check: "pageless", message:
      `An open workstream with arcs and no page — ${pageless.join(" · ")}. The arc is the plan and ` +
      `the page is what anybody reads, so a workstream with no page is work nobody can pick up. ` +
      `Give it an approach page in the fixed shape (05-artifacts.md, The approach document).` });

  const inArcs = cardsInArcs(root);
  if (inArcs.length)
    out.push({ check: "cards-in-arcs", message:
      `A card written into an arc while the page shows none — ` +
      inArcs.slice(0, 4).map(([subject, arc, card]) => `${card} in ${arc} (${subject})`).join(" · ") +
      `. An arc plans work and never holds a question. Move it to the page's \`Open\` as a \`Q<n>\` ` +
      `card, in the card pattern (refs/devex/workspace/docs/decision-cards.md).` });

  const stopped = stopsWithEmptyOpen(root);
  if (stopped.length)
    out.push({ check: "stopped-no-card", message:
      `A row waiting on the developer while \`Open\` carries no card — ` +
      stopped.slice(0, 4).map(([subject, row]) => `row ${row} in ${subject}`).join(" · ") +
      `. A stop is an open item like any other, and a question the plan knows about while the page ` +
      `says nothing is one nobody can answer. Write it as a \`Q<n>\` card in the page's \`Open\` ` +
      `(refs/devex/workspace/docs/decision-cards.md).` });

  const missing = unnamedArcs(root);
  if (missing.length)
    out.push({ check: "unnamed-arc", message:
      `An arc the page does not name — ` +
      missing.slice(0, 4).map(([subject, arc]) => `${arc} in ${subject}`).join(" · ") +
      `. An arc is the plan and the page is what anybody reads, so an arc nothing names is work that ` +
      `looks finished from the only surface they open. Give it its row in the page's Cycles table, ` +
      `citing the arc file (05-artifacts.md, The approach document).` });
  return out;
}

// ---------------------------------------------------------------------------- welcome

/** Markdown emphasis off and white space folded, so a line compares as the words a reader sees. */
function plain(text: string): string {
  return text.replace(/\*\*|__|(?<![\w*])\*(?!\s)|(?<!\s)\*(?![\w*])/g, "").replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ").trim();
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

/**
 * The welcome's parts a first turn left out. The heading is matched by the words after the name,
 * because the name is optional and the heading has a first-visit form; the four lines under it are
 * matched whole, as text. A proof run (N116 row 8) met a heading alone, a line cut at its last
 * sentence, and no welcome at all, each on a prompt that carried work — so a line counts only when
 * every word of it is there.
 */
export function missingWelcome(text: string): string[] {
  const said = plain(text);
  const [, , tagline, , agent, , stages, , roles] = welcome(null, false).map(plain);
  const missing: string[] = [];
  if (!/Welcome back to SaaS Plane!|Glad you're here!/.test(said)) missing.push("the heading");
  for (const [name, line] of [["the italic line", tagline], ["the 🤖 line", agent], ["the 🧭 line", stages], ["the 👥 line", roles]] as const)
    if (!said.includes(line)) missing.push(name);
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
    `the status line, then the answer (RD.DEVEX.WORKSPACE.045). In some editors that reply is the only ` +
    `place the developer sees it. Say it in full at the top of your next reply.` }];
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
  const root = workspaceRoot(start || process.env.CLAUDE_PROJECT_DIR || process.cwd())
            ?? (start || process.env.CLAUDE_PROJECT_DIR || process.cwd());

  let event: { session_id?: string; transcript_path?: string; stop_hook_active?: boolean; agent_id?: string; cwd?: string } = {};
  try { event = JSON.parse(input || "{}") ?? {}; } catch { event = {}; }
  const session = String(event.session_id ?? "");
  begin({ script: "spn-devex", event: "Stop", tool: null, session: event.session_id ?? null, ...tagsOf(event),
          process: { group: "events", action: "stop" } }, root);
  // THIS SESSION'S OWN BASELINE, and what its own tool calls wrote since it. The transcript is read
  // from where the last Stop left off, so a long session pays for its newest turn and not its whole
  // history. A first Stop reads nothing: there is no baseline to judge the writes against.
  const baseline = readBaseline(root, session);
  let touched: Set<string> | null = null;
  let transcriptAt: number | undefined;
  if (event.transcript_path) {
    if (baseline) {
      const found = arcsTouched(event.transcript_path, baseline.transcriptAt ?? 0, openArcs(root));
      if (found) { touched = found.touched; transcriptAt = found.size; }
    } else {
      try { transcriptAt = statSync(event.transcript_path).size; } catch { transcriptAt = undefined; }
    }
  }
  const repeated = event.stop_hook_active === true && (baseline?.fired ?? []).includes("handover");
  // No baseline means this Stop ends the session's first turn: the one the welcome belongs to.
  const firstTurn = !baseline && event.transcript_path && !event.agent_id ? firstTurnText(event.transcript_path) : "";
  const waiting = span({ group: "stop", action: "cards" }, () => cardsWaiting(root));
  const warnings = [
    ...span({ group: "stop", action: "reply-shape" }, () => checkReplyShape(reply, waiting,
      baseline?.cards ? waiting.filter((card) => !baseline.cards!.includes(card)) : [])),
    ...span({ group: "stop", action: "notes" }, () => checkNotesLanded(root, baseline?.arcs, touched)),
    ...span({ group: "stop", action: "arc-to-page" }, () => checkArcToPage(root)),
    ...span({ group: "stop", action: "runnable" }, () => checkRunnable(root, baseline?.at ?? 0, baseline?.steps ?? {}, touched)),
    ...span({ group: "stop", action: "hold" }, () => checkHold(root)),
    // A REPLY ANSWERING THE LAST FINDING IS NOT JUDGED BY THE SAME CHECK AGAIN. `stop_hook_active`
    // says this turn continues because a Stop hook spoke; where the handover check was what spoke,
    // the reply is its answer, and demanding the block a second time is the loop the developer met.
    ...span({ group: "stop", action: "handover" }, () => repeated ? [] : checkHandover(reply, root)),
    ...span({ group: "stop", action: "welcome" }, () => checkWelcome(firstTurn)),
    ...span({ group: "stop", action: "corpus" }, () => checkCorpus(root)),
  ];
  end();
  // AFTER the checks, never before: they compare against this and would compare against now.
  writeBaseline(root, session, { at: Date.now(), steps: currentSteps(root), transcriptAt,
                                 fired: warnings.map((warning) => warning.check), cards: waiting,
                                 arcs: arcMarks(root) });
  if (warnings.length) {
    console.error(warnings.map((w) => `[${w.check}] ${w.message}`).join("\n\n"));
    process.exit(2);   // a Stop hook's non-zero is how the message reaches the turn
  }
  process.exit(0);
}
