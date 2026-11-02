// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript (RULE.DEVEX.AGENT.082). The chapter is the source of truth; a rule
// change is edited there first, then here, in the same change.
//
// What a target cost, read from `usage.jsonl` alone, each reply once by its `id`; no transcript is read. A row is
// read by its `mtype` (a `TURN`, `v` 1); any other row, and any row of another version, is skipped.
//
//     all                     one row for each workstream
//     <workstream>            one row for each arc, in the order Ideate, the build arcs, Follow-ups
//     <workstream>/<arc>      one row for each part; an arc's address is `N<nnn>`, `ideate` or `follow-ups` (`ARC_ID`)
//     window/<session>        the window, and one row for each child by its `agent`
//     window/this             the same, for the window the command runs in

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { UsageFault } from "../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, sessionDir, telemetryFolder } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workstreamsDir, type WorkstreamState } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import {
  SPDevExStageType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType, known, stageOf,
} from "../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { priceOf } from "./model-prices.ts";
import { USAGE_LOG } from "./usage.ts";
import { ARC_ID } from "./workstream-schema.ts";

/** What one group of replies cost. `money` is null where any of its replies ran on a model the price table lacks. */
export type CostRow = {
  key: string; replies: number; input: number; cacheRead: number; cacheWrite: number; output: number;
  modelMs: number; models: string[]; money: number | null;
};

type Line = {
  at: string | null; session: string | null; agent: string | null; workstream: string | null; arc: string | null;
  part: string | null; skill: string | null; stage: string | null; work: string | null; id: string | null; model: string | null; ms: number;
  input: number; cacheRead: number; cacheWrite: number; output: number;
};

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** Every `TURN` row, rotated log first and live log second, each reply once by its id; a row the writer could not have produced is skipped. */
function readLines(root: string): Line[] {
  const seen = new Set<string>();
  const lines: Line[] = [];
  for (const file of logFiles(join(telemetryFolder(root), USAGE_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1 || one.mtype !== SPDevExWorkspaceTelemetryRowType.TURN) continue;
        const id = text(one.id);
        if (id) { if (seen.has(id)) continue; seen.add(id); }
        const tokens = (one.tokens && typeof one.tokens === "object" ? one.tokens : {}) as Record<string, unknown>;
        lines.push({ at: text(one.at), session: text(one.session), agent: text(one.agent), workstream: text(one.workstream),
          arc: text(one.arc), part: text(one.part), skill: text(one.skill), stage: text(one.stage), work: text(one.work), id, model: text(one.model), ms: count(one.ms),
          input: count(tokens.in), cacheRead: count(tokens.cacheRead), cacheWrite: count(tokens.cacheWrite), output: count(tokens.out) });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return lines;
}

/** The session id as its folder spells it, so an id typed or tagged with a character the folder drops still matches. */
const folderOf = (root: string, session: string): string => basename(sessionDir(root, session));

/** The window whose command is this invocation: the newest start file, under any window's `pending/`, whose call is `debug cost show`. */
function windowRunning(root: string): string {
  const sessions = dirname(sessionDir(root, "-"));
  let best: { session: string; at: number } | null = null;
  try {
    for (const session of readdirSync(sessions)) {
      const pending = join(sessions, session, "pending");
      if (!existsSync(pending)) continue;
      for (const name of readdirSync(pending)) {
        try {
          const file = join(pending, name);
          const started = JSON.parse(readFileSync(file, "utf8")) as { found?: Array<Record<string, unknown>> };
          // The pending file keeps the call (program, group, action) and never its arguments, so the newest `debug cost show` stands.
          const mine = (started.found ?? []).some((one) => {
            const call = one.call as { program?: unknown; group?: unknown; action?: unknown } | undefined;
            return call?.program === "spn-devex" && call.group === "debug" && call.action === "cost show";
          });
          const at = statSync(file).mtimeMs;
          if (mine && (!best || at > best.at)) best = { session, at };
        } catch { /* a start file that does not read is not this one */ }
      }
    }
  } catch { /* no sessions folder */ }
  if (!best) throw new UsageFault("finds no window that is running this command. Name the window as `window/<session>`; `debug window show <session>` reads one window's folder.");
  return best.session;
}

function rowOf(key: string, lines: Line[]): CostRow {
  const sum = (field: "input" | "cacheRead" | "cacheWrite" | "output" | "ms") => lines.reduce((total, one) => total + one[field], 0);
  let money: number | null = 0;
  for (const one of lines) {
    const priced = priceOf(one.model, one);
    money = money === null || priced === null ? null : money + priced;
  }
  return { key, replies: lines.length, input: sum("input"), cacheRead: sum("cacheRead"), cacheWrite: sum("cacheWrite"), output: sum("output"),
    modelMs: sum("ms"), models: [...new Set(lines.map((one) => one.model).filter((one): one is string => one !== null))],
    money: money === null ? null : Math.round(money * 1e6) / 1e6 };
}

/** Groups in the order each key first appears. */
function group(lines: Line[], keyOf: (one: Line) => string): CostRow[] {
  const groups = new Map<string, Line[]>();
  for (const one of lines) groups.set(keyOf(one), [...(groups.get(keyOf(one)) ?? []), one]);
  return [...groups].map(([key, held]) => rowOf(key, held));
}

/**
 * Arcs in the order a workstream reads: Ideate first, the build arcs by number, Follow-ups last. An arc is placed by its address
 * (`ideate`, `N<nnn>`, `follow-ups`), never by what a header says it is.
 */
export function byArc(a: string, b: string): number {
  const rank = (arc: string) => (arc === "ideate" ? 0 : arc === "follow-ups" ? 2 : ARC_ID.test(arc) ? 1 : 3);
  return rank(a) - rank(b) || a.localeCompare(b, "en", { numeric: true });
}

/** The workstream and the arc of a `<workstream>/<arc>` target, the arc read through `ARC_ID`; null where the target is no arc's. */
export function arcTarget(target: string): { workstream: string; arc: string } | null {
  const at = target.lastIndexOf("/");
  if (at < 1) return null;
  const arc = target.slice(at + 1);
  const spelled = /^n\d+[a-z]?$/i.test(arc) ? `N${arc.slice(1)}` : arc;
  return ARC_ID.test(spelled) ? { workstream: target.slice(0, at), arc: spelled } : null;
}

/** Whether a workstream tag is the one the target names: its whole folder name, or its number. */
const isWorkstream = (tag: string | null, named: string): boolean => tag === named || (/^\d{3}$/.test(named) && !!tag && tag.startsWith(`${named}-`));

/**
 * What the target cost: its rows, and `earliest`, the time of the first line the logs hold (null with none), which is
 * how far back a reading reaches once a log has been rotated.
 */
export function readCost(root: string, target: string): { rows: CostRow[]; earliest: string | null } {
  const lines = readLines(root);
  const earliest = lines[0]?.at ?? null;
  const window = /^window\/(.+)$/.exec(target);
  if (window) {
    const session = folderOf(root, window[1] === "this" ? windowRunning(root) : window[1]);
    const mine = lines.filter((one) => one.session !== null && folderOf(root, one.session) === session);
    return { rows: group(mine, (one) => (one.agent ? `child ${one.agent}` : "window")), earliest };
  }
  if (target === "all") return { rows: group(lines, (one) => one.workstream ?? "(no workstream)"), earliest };
  const arc = arcTarget(target);
  if (arc) {
    const mine = lines.filter((one) => isWorkstream(one.workstream, arc.workstream) && one.arc?.replace(/^n/, "N") === arc.arc);
    return { rows: group(mine, (one) => (one.part ? `part ${one.part}` : "(no part)")), earliest };
  }
  const mine = lines.filter((one) => isWorkstream(one.workstream, target));
  const rows = group(mine, (one) => one.arc ?? "(no arc)").sort((a, b) => byArc(a.key, b.key));
  return { rows, earliest };
}

// ---------------------------------------------------------------------------------------------- how the time was spent

/** The stage of a row nothing names: no stored stage, and no skill or work that gives one. */
export const NO_STAGE = "none";

/** Where an arc's own `log.jsonl` places a moment: before its PROPOSED → DECIDED line, from there until it lands, and after. */
export type Phase = "planning" | "executing" | "closing";

/** One arc's model time by DevEx stage and by phase, in milliseconds. */
export type StageLine = { arc: string; stages: Record<string, number>; phases: Record<Phase, number>; modelMs: number; money: number | null };

/** One line of a go's block: the parts of one work, the helpers that ran them, and their replies, model time and money. */
export type GoLine = { label: string; parts: number; helpers: number; replies: number; modelMs: number; money: number | null; elapsedMin: number | null };

/** A go: its lead arc, the arcs it covers, a line for each work, the lead apart, and the helpers' replies that name no part. */
export type GoBlock = { lead: string; scope: string[]; lines: GoLine[]; leadLine: GoLine; noPart: GoLine | null };

/** A window's time under one arc and phase, split four ways: working, waiting on you, waiting on a run, and idle (a long gap with no run in flight). */
export type WindowLine = { arc: string; phase: Phase; workingMs: number; waitingOnYouMs: number; waitingOnRunMs: number; idleMs: number };

/**
 * The intervals each part of a go ran, in ms, read from the lead arc's `log.jsonl` lines of kind `go`: `<part> launched` or `<part> started`
 * to the next `<part> landed`. A part that lands with no launch or start has none.
 */
function partIntervals(folder: string | null, arc: string): Map<string, Array<[number, number]>> {
  const out = new Map<string, Array<[number, number]>>();
  const file = folder ? join(folder, "arcs", arc, "log.jsonl") : null;
  if (!file || !existsSync(file)) return out;
  const begun = new Map<string, number>();
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    try {
      const line = JSON.parse(raw) as { at?: unknown; kind?: unknown; note?: unknown };
      const at = stampOf(line.at);
      const m = line.kind === "go" && at !== null ? /^(.+) (launched|started|landed)$/.exec(String(line.note ?? "")) : null;
      if (!m || at === null) continue;
      if (m[2] === "landed") {
        const from = begun.get(m[1]);
        if (from !== undefined && at >= from) out.set(m[1], [...(out.get(m[1]) ?? []), [from, at]]);
        begun.delete(m[1]);
      } else begun.set(m[1], at);
    } catch { /* a torn line is skipped */ }
  }
  return out;
}

/** The spans a window's own turns cover: each turn from its start to its end, held on to the next turn where the gap is the tools running. */
function workingSpans(rows: Line[]): Array<[number, number]> {
  const ordered = rows.filter((one) => one.at !== null).sort((a, b) => Date.parse(a.at as string) - Date.parse(b.at as string));
  return ordered.map((one, index) => {
    const start = Date.parse(one.at as string), end = start + one.ms;
    const next = ordered[index + 1] ? Date.parse(ordered[index + 1].at as string) : null;
    return [start, next !== null && next > end && next - end <= TOOL_GAP_MS ? next : end] as [number, number];
  });
}

/** The whole minutes the intervals cover together (parallel parts count once), or null for none. */
function coveredMin(spans: Array<[number, number]>): number | null {
  if (!spans.length) return null;
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let total = 0, [from, to] = sorted[0];
  for (const [a, b] of sorted.slice(1)) { if (a <= to) to = Math.max(to, b); else { total += to - from; from = a; to = b; } }
  return Math.round((total + to - from) / 60_000);
}

const STATES = ["open", "closed", "backlog"] as const;

/** The folder of a workstream, by its folder name, wherever it sits in the lifecycle; null with none. */
function workstreamFolder(root: string, workstream: string): string | null {
  for (const state of STATES) {
    const dir = join(workstreamsDir(root, state as WorkstreamState), workstream);
    if (existsSync(dir)) return dir;
  }
  return null;
}

/** The moment, in ms, of an arc's log line, or null. */
const stampOf = (value: unknown): number | null => { const ms = Date.parse(String(value ?? "")); return Number.isNaN(ms) ? null : ms; };

/** When an arc was decided and when it last landed a row, from its own `log.jsonl`; null for what the log does not say. */
function phasesOf(folder: string | null, arc: string): { decided: number | null; landed: number | null } {
  const file = folder ? join(folder, "arcs", arc, "log.jsonl") : null;
  let decided: number | null = null, landed: number | null = null;
  if (!file || !existsSync(file)) return { decided, landed };
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    try {
      const line = JSON.parse(raw) as { at?: unknown; kind?: unknown; note?: unknown };
      const at = stampOf(line.at);
      if (at === null) continue;
      if (line.kind === "status" && decided === null && /→\s*DECIDED/.test(String(line.note ?? ""))) decided = at;
      if (line.kind === "landed") landed = landed === null ? at : Math.max(landed, at);
    } catch { /* a torn line is skipped */ }
  }
  return { decided, landed };
}

/** The phase of an arc at a moment: planning before the decision, executing until the arc lands, closing after. Executing where the log says nothing. */
function phaseAt(marks: { decided: number | null; landed: number | null } | undefined, at: number): Phase {
  if (!marks || marks.decided === null) return marks ? "planning" : "executing";
  if (at < marks.decided) return "planning";
  if (marks.landed !== null && at > marks.landed) return "closing";
  return "executing";
}

const moneyOf = (lines: Line[]): number | null => rowOf("", lines).money;

/** The label of a part's work in a go's block, `Test · baseline` and `Test · full` told apart by the part's id. */
function labelOf(part: string, work: string | null): string {
  const w = work ? work[0] + work.slice(1).toLowerCase() : "Other";
  if (work === "TEST") return part.startsWith("baseline-") ? "Test · baseline" : part.startsWith("full-") ? "Test · full" : "Test";
  return w;
}

type GoFile = { lead?: string; scope?: string[]; parts?: Array<{ id?: string; work?: string; pass?: string }> };

/** A reply gap at most this long is the window working (its tools ran); a longer one is the window waiting. */
const TOOL_GAP_MS = 2 * 60_000;

/** A gap after a turn longer than this, with no run in flight, is idle: nobody was waiting on the window, and it was not waiting on the developer. */
const IDLE_MS = 30 * 60_000;

type TimeField = "workingMs" | "waitingOnYouMs" | "waitingOnRunMs" | "idleMs";

/**
 * Where a gap after a turn belongs: working up to two minutes; else waiting on a run where one of the window's background runs began
 * between the turn and the next; else waiting on you, and idle past thirty minutes.
 */
function gapKind(gap: number, runs: number[], start: number, nextAt: number): TimeField {
  if (gap <= TOOL_GAP_MS) return "workingMs";
  if (runs.some((at) => at >= start && at <= nextAt)) return "waitingOnRunMs";
  return gap > IDLE_MS ? "idleMs" : "waitingOnYouMs";
}

/** Background runs of a window: the starts of its `COMMAND` rows with no exit, and of its `TEST` rows, from `hooks.jsonl`. */
function runStarts(root: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1) continue;
        const run = one.mtype === SPDevExWorkspaceTelemetryRowType.TEST || (one.mtype === SPDevExWorkspaceTelemetryRowType.COMMAND && one.exit === null);
        const session = text(one.session), at = stampOf(one.at);
        if (run && session && at !== null) out.set(session, [...(out.get(session) ?? []), at]);
      } catch { /* a torn line is skipped */ }
    }
  }
  return out;
}

/**
 * How a workstream's time was spent, read from `usage.jsonl` and `hooks.jsonl` alone: each arc's model time by DevEx stage (the row's stored
 * `stage`, and for a row written before that `stageOf(skill, work)`) and by phase (from the arc's own `log.jsonl`), the arcs in the order
 * Ideate, the build arcs, Follow-ups, each placed by its address; a block for each go by work (a part's rows whatever their agent) with the lead
 * on its own line (the rows with no part) and its own elapsed span; and each window's time split into working, waiting on you, waiting on a run
 * and idle, counted under the arc the window's rows carry.
 * A window's rows do not name a prompt, so the gap between two replies of its own is read by its length: up to two minutes the tools were running
 * and the window was working; longer, it waited, on a run where a background command or test of that window began since the earlier reply;
 * else on you, and past thirty minutes idle.
 */
export function readTime(root: string, workstream: string): { stages: StageLine[]; goBlocks: GoBlock[]; windows: WindowLine[] } {
  const lines = readLines(root).filter((one) => isWorkstream(one.workstream, workstream));
  const folder = workstreamFolder(root, workstream);
  const marks = new Map<string, { decided: number | null; landed: number | null }>();
  const marksOf = (arc: string) => { if (!marks.has(arc)) marks.set(arc, phasesOf(folder, arc)); return marks.get(arc); };

  const stages: StageLine[] = [];
  for (const [arc, held] of [...group2(lines.filter((one) => one.arc !== null), (one) => one.arc as string)].sort((a, b) => byArc(a[0], b[0]))) {
    const line: StageLine = { arc, stages: {}, phases: { planning: 0, executing: 0, closing: 0 }, modelMs: 0, money: moneyOf(held) };
    for (const one of held) {
      const stage = known(SPDevExStageType, one.stage) ?? stageOf(one.skill, one.work) ?? NO_STAGE;
      line.stages[stage] = (line.stages[stage] ?? 0) + one.ms;
      line.phases[phaseAt(marksOf(arc), one.at ? Date.parse(one.at) : 0)] += one.ms;
      line.modelMs += one.ms;
    }
    stages.push(line);
  }

  const goBlocks: GoBlock[] = [];
  const arcsDir = folder ? join(folder, "arcs") : null;
  for (const arc of arcsDir && existsSync(arcsDir) ? readdirSync(arcsDir).filter((name) => ARC_ID.test(name)).sort(byArc) : []) {
    let go: GoFile;
    try { go = JSON.parse(readFileSync(join(arcsDir as string, arc, "go.json"), "utf8")) as GoFile; } catch { continue; }
    const scope = Array.isArray(go.scope) && go.scope.length ? go.scope : [arc];
    const mine = lines.filter((one) => one.arc !== null && scope.includes(one.arc));
    const parts = Array.isArray(go.parts) ? go.parts : [];
    const labelOfPart = new Map(parts.filter((one) => typeof one.id === "string").map((one) => [one.id as string, labelOf(one.id as string, one.work ?? null)]));
    const lineOf = (label: string, held: Line[], partCount: number): GoLine => ({ label, parts: partCount, replies: held.length,
      helpers: new Set(held.map((one) => one.agent).filter(Boolean)).size, modelMs: held.reduce((total, one) => total + one.ms, 0), money: held.length ? moneyOf(held) : null, elapsedMin: null });
    const labels = [...new Set(labelOfPart.values())];
    const out: GoLine[] = labels.map((label) => lineOf(label,
      mine.filter((one) => one.part !== null && labelOfPart.get(one.part) === label),
      parts.filter((one) => labelOfPart.get(one.id as string) === label).length));
    const intervals = partIntervals(folder, arc);
    for (const line of out) {
      const spans = parts.filter((one) => labelOfPart.get(one.id as string) === line.label).flatMap((one) => intervals.get(one.id as string) ?? []);
      line.elapsedMin = coveredMin(spans);
    }
    // A part's rows count whatever their agent (a part the lead ran shows its replies); the lead line holds only rows with no part.
    const leadRows = mine.filter((one) => one.part === null && one.agent === null);
    const noPart = mine.filter((one) => (one.part === null && one.agent !== null) || (one.part !== null && !labelOfPart.has(one.part)));
    const leadLine = lineOf("Lead", leadRows, 0);
    leadLine.elapsedMin = coveredMin(workingSpans(leadRows));
    goBlocks.push({ lead: go.lead ?? arc, scope, lines: out, leadLine, noPart: noPart.length ? lineOf("No part", noPart, 0) : null });
  }

  const runs = runStarts(root);
  const times = new Map<string, WindowLine>();
  const add = (arc: string, phase: Phase, field: TimeField, ms: number) => {
    const key = `${arc} ${phase}`;
    const line = times.get(key) ?? { arc, phase, workingMs: 0, waitingOnYouMs: 0, waitingOnRunMs: 0, idleMs: 0 };
    line[field] += ms;
    times.set(key, line);
  };
  for (const [session, held] of group2(lines.filter((one) => one.session !== null && one.agent === null && one.at !== null), (one) => one.session as string)) {
    const ordered = [...held].sort((a, b) => Date.parse(a.at as string) - Date.parse(b.at as string));
    ordered.forEach((one, index) => {
      const start = Date.parse(one.at as string);
      const arc = one.arc ?? "(no arc)";
      const phase = one.arc ? phaseAt(marksOf(one.arc), start) : "executing";
      add(arc, phase, "workingMs", one.ms);
      const next = ordered[index + 1];
      if (!next) return;
      const gap = Date.parse(next.at as string) - (start + one.ms);
      if (gap <= 0) return;
      add(arc, phase, gapKind(gap, runs.get(session) ?? [], start, Date.parse(next.at as string)), gap);
    });
  }
  return { stages, goBlocks, windows: [...times.values()].sort((a, b) => byArc(a.arc, b.arc)) };
}

/** Groups in the order each key first appears. */
function group2<T>(items: T[], keyOf: (one: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const one of items) groups.set(keyOf(one), [...(groups.get(keyOf(one)) ?? []), one]);
  return groups;
}

// ------------------------------------------------------------------------------------------ what a row's bytes carried, and plugin versions

/** The replies each window and agent made, as the time each ended, oldest first, by `<session> <agent>` (the agent empty for the window's own). */
export type Replies = Map<string, number[]>;

const streamOf = (session: string | null, agent: string | null): string => `${session ?? "-"} ${agent ?? ""}`;

/** Every reply of `usage.jsonl`, by its window and agent, as the time it ended (its start and its model time). */
export function readReplies(root: string): Replies {
  const out: Replies = new Map();
  for (const one of readLines(root)) {
    const at = stampOf(one.at);
    if (at === null) continue;
    const key = streamOf(one.session, one.agent);
    out.set(key, [...(out.get(key) ?? []), at + one.ms]);
  }
  for (const ends of out.values()) ends.sort((a, b) => a - b);
  return out;
}

/**
 * What a hook row's output carried: its `out` bytes times the replies the same window (and the same agent) made from the row on. A reply
 * of another window, or of another agent, or one that ended before the row, adds nothing.
 */
export function carriedBytes(replies: Replies, row: { session: string | null; agent: string | null; at: number | null; out: number }): number {
  const ends = replies.get(streamOf(row.session, row.agent));
  if (!ends || row.at === null || !row.out) return 0;
  let low = 0, high = ends.length;
  while (low < high) { const mid = (low + high) >> 1; if (ends[mid] < row.at) low = mid + 1; else high = mid; }
  return row.out * (ends.length - low);
}

/** A window's time, the four ways it is split, in milliseconds. */
export type TimeSplit = { workingMs: number; waitingOnYouMs: number; waitingOnRunMs: number; idleMs: number };

/** What the windows that loaded one plugin version spent: model time by stage, tokens and money by kind of part, window time, and the hook bytes carried. */
export type VersionReading = {
  version: string; windows: number; stages: Record<string, number>; parts: CostRow[]; time: TimeSplit; carried: number;
};

/** Each plugin version a window loaded, from the `pluginVersion` of its `SessionStart` row, with the windows that loaded it; the first row of a window stands. */
export function loadedVersions(root: string): Map<string, string[]> {
  const bySession = new Map<string, string>();
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const session = text(one.session), version = text(one.pluginVersion);
        if (one.v === SPDevExWorkspaceTelemetryVersionType.V1 && one.event === SPDevExWorkspaceTelemetryEventType.SESSION_START && session && version && !bySession.has(session))
          bySession.set(session, version);
      } catch { /* a torn line is skipped */ }
    }
  }
  const out = new Map<string, string[]>();
  for (const [session, version] of bySession) out.set(version, [...(out.get(version) ?? []), session]);
  return out;
}

/** The kind of part a reply belongs to: the work its part stands for, `no part` for a reply of none. */
const kindOf = (one: Line): string => (one.part ? one.work ?? "other" : "no part");

/** What the windows `sessions` of one plugin version spent, read from the same logs `show` reads. */
export function readVersion(root: string, version: string, sessions: string[]): VersionReading {
  const held = new Set(sessions.map((one) => folderOf(root, one)));
  const lines = readLines(root).filter((one) => one.session !== null && held.has(folderOf(root, one.session)));
  const stages: Record<string, number> = {};
  for (const one of lines) {
    const stage = known(SPDevExStageType, one.stage) ?? stageOf(one.skill, one.work) ?? NO_STAGE;
    stages[stage] = (stages[stage] ?? 0) + one.ms;
  }
  const parts = [...group2(lines, kindOf)].map(([key, list]) => rowOf(key, list)).sort((a, b) => a.key.localeCompare(b.key));
  const runs = runStarts(root);
  const time: TimeSplit = { workingMs: 0, waitingOnYouMs: 0, waitingOnRunMs: 0, idleMs: 0 };
  for (const [session, list] of group2(lines.filter((one) => one.agent === null && one.at !== null), (one) => one.session as string)) {
    const ordered = [...list].sort((a, b) => Date.parse(a.at as string) - Date.parse(b.at as string));
    ordered.forEach((one, index) => {
      const start = Date.parse(one.at as string);
      time.workingMs += one.ms;
      const next = ordered[index + 1];
      const gap = next ? Date.parse(next.at as string) - (start + one.ms) : 0;
      if (next && gap > 0) time[gapKind(gap, runs.get(session) ?? [], start, Date.parse(next.at as string))] += gap;
    });
  }
  const replies = readReplies(root);
  let carried = 0;
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const session = text(one.session);
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1 || one.mtype !== SPDevExWorkspaceTelemetryRowType.CHECK || !session || !held.has(folderOf(root, session))) continue;
        carried += carriedBytes(replies, { session, agent: text(one.agent), at: stampOf(one.at), out: count(one.out) });
      } catch { /* a torn line is skipped */ }
    }
  }
  return { version, windows: held.size, stages, parts, time, carried };
}
