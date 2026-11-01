// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript (RULE.DEVEX.AGENT.082). The chapter is the source of truth; a rule
// change is edited there first, then here, in the same change.
//
// What a target cost, read from `usage.jsonl` alone, each reply once by its `id`; no transcript is read. A row is
// read by its `mtype` (a `TURN`, `v` 1); any other row, and any row of another version, is skipped.
//
//     all                     one row for each workstream
//     <workstream>            one row for each arc
//     <workstream>/N<nnn>     one row for each part
//     window/<session>        the window, and one row for each child by its `agent`
//     window/this             the same, for the window the command runs in

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { UsageFault } from "../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, sessionDir, telemetryFolder } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import {
  SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType, stageOf,
} from "../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { priceOf } from "./model-prices.ts";
import { USAGE_LOG } from "./usage.ts";

/** What one group of replies cost. `money` is null where any of its replies ran on a model the price table lacks. */
export type CostRow = {
  key: string; replies: number; input: number; cacheRead: number; cacheWrite: number; output: number;
  modelMs: number; models: string[]; money: number | null;
};

type Line = {
  at: string | null; session: string | null; agent: string | null; workstream: string | null; arc: string | null;
  part: string | null; skill: string | null; work: string | null; id: string | null; model: string | null; ms: number;
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
          arc: text(one.arc), part: text(one.part), skill: text(one.skill), work: text(one.work), id, model: text(one.model), ms: count(one.ms),
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
  const arc = /^(.+)\/(N\d+[a-z]?)$/i.exec(target);
  if (arc) {
    const mine = lines.filter((one) => isWorkstream(one.workstream, arc[1]) && one.arc?.toUpperCase() === arc[2].toUpperCase());
    return { rows: group(mine, (one) => (one.part ? `part ${one.part}` : "(no part)")), earliest };
  }
  const mine = lines.filter((one) => isWorkstream(one.workstream, target));
  return { rows: group(mine, (one) => one.arc ?? "(no arc)"), earliest };
}

// ---------------------------------------------------------------------------------------------- how the time was spent

/** The stage a row falls in, as the skills construct maps `skill` and `work` (`stageOf`); `none` where no stage is written. */
export const NO_STAGE = "none";

/** Where an arc's own `log.jsonl` places a moment: before its PROPOSED → DECIDED line, from there until it lands, and after. */
export type Phase = "planning" | "executing" | "closing";

/** One arc's model time by DevEx stage and by phase, in milliseconds. */
export type StageLine = { arc: string; stages: Record<string, number>; phases: Record<Phase, number>; modelMs: number; money: number | null };

/** One line of a go's block: the parts of one work, the helpers that ran them, and their replies, model time and money. */
export type GoLine = { label: string; parts: number; helpers: number; replies: number; modelMs: number; money: number | null; elapsedMin: number | null };

/** A go: its lead arc, the arcs it covers, a line for each work, the lead apart, and the helpers' replies that name no part. */
export type GoBlock = { lead: string; scope: string[]; lines: GoLine[]; leadLine: GoLine; noPart: GoLine | null };

/** A window's time under one arc and phase, split three ways: working, waiting on you, waiting on a run. */
export type WindowLine = { arc: string; phase: Phase; workingMs: number; waitingOnYouMs: number; waitingOnRunMs: number };

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
    const dir = join(root, ".spndevex", "workstreams", state, workstream);
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
 * How a workstream's time was spent, read from `usage.jsonl` and `hooks.jsonl` alone: each arc's model time by DevEx stage (from the row's
 * `skill` and `work`, never stored) and by phase (from the arc's own `log.jsonl`), a block for each go by work with the lead on its own line,
 * and each window's time split into working, waiting on you and waiting on a run, counted under the arc the window's rows carry.
 * A window's rows do not name a prompt, so the gap between two replies of its own is read by its length: up to two minutes the tools were running
 * and the window was working; longer, it waited, on a run where a background command or test of that window began since the earlier reply, else on you.
 */
export function readTime(root: string, workstream: string): { stages: StageLine[]; goBlocks: GoBlock[]; windows: WindowLine[] } {
  const lines = readLines(root).filter((one) => isWorkstream(one.workstream, workstream));
  const folder = workstreamFolder(root, workstream);
  const marks = new Map<string, { decided: number | null; landed: number | null }>();
  const marksOf = (arc: string) => { if (!marks.has(arc)) marks.set(arc, phasesOf(folder, arc)); return marks.get(arc); };

  const stages: StageLine[] = [];
  for (const [arc, held] of group2(lines.filter((one) => one.arc !== null), (one) => one.arc as string)) {
    const line: StageLine = { arc, stages: {}, phases: { planning: 0, executing: 0, closing: 0 }, modelMs: 0, money: moneyOf(held) };
    for (const one of held) {
      const stage = stageOf(one.skill, one.work) ?? NO_STAGE;
      line.stages[stage] = (line.stages[stage] ?? 0) + one.ms;
      line.phases[phaseAt(marksOf(arc), one.at ? Date.parse(one.at) : 0)] += one.ms;
      line.modelMs += one.ms;
    }
    stages.push(line);
  }

  const goBlocks: GoBlock[] = [];
  const arcsDir = folder ? join(folder, "arcs") : null;
  for (const arc of arcsDir && existsSync(arcsDir) ? readdirSync(arcsDir).sort() : []) {
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
      mine.filter((one) => one.agent !== null && one.part !== null && labelOfPart.get(one.part) === label),
      parts.filter((one) => labelOfPart.get(one.id as string) === label).length));
    const intervals = partIntervals(folder, arc);
    for (const line of out) {
      const spans = parts.filter((one) => labelOfPart.get(one.id as string) === line.label).flatMap((one) => intervals.get(one.id as string) ?? []);
      line.elapsedMin = coveredMin(spans);
    }
    const noPart = mine.filter((one) => one.agent !== null && (one.part === null || !labelOfPart.has(one.part)));
    goBlocks.push({ lead: go.lead ?? arc, scope, lines: out, leadLine: lineOf("Lead", mine.filter((one) => one.agent === null), 0),
      noPart: noPart.length ? lineOf("No part", noPart, 0) : null });
  }

  const runs = runStarts(root);
  const times = new Map<string, WindowLine>();
  const add = (arc: string, phase: Phase, field: "workingMs" | "waitingOnYouMs" | "waitingOnRunMs", ms: number) => {
    const key = `${arc} ${phase}`;
    const line = times.get(key) ?? { arc, phase, workingMs: 0, waitingOnYouMs: 0, waitingOnRunMs: 0 };
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
      if (gap <= TOOL_GAP_MS) add(arc, phase, "workingMs", gap);
      else add(arc, phase, (runs.get(session) ?? []).some((at) => at >= start && at <= Date.parse(next.at as string)) ? "waitingOnRunMs" : "waitingOnYouMs", gap);
    });
  }
  return { stages, goBlocks, windows: [...times.values()] };
}

/** Groups in the order each key first appears. */
function group2<T>(items: T[], keyOf: (one: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const one of items) groups.set(keyOf(one), [...(groups.get(keyOf(one)) ?? []), one]);
  return groups;
}
