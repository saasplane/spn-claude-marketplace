// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug cost show <target> [--json]
//     spn-devex debug cost compare <version> <version> [--json]
//
// What a target cost, read from the telemetry alone (`lib/cost.ts`): `all` prints a line for each workstream, a
// workstream one for each arc, an arc one for each row and order, a window the window and each child. The target
// chooses the breakdown (a target is `all`, a workstream, `<workstream>/<arc>` with the arc `N<nnn>`, `ideate` or `follow-ups`, or a window; a
// workstream's arcs read in the order Ideate, the build arcs, Follow-ups, each placed by its address), so there is no option to group or to choose money; `--from` and `--to` bound the split to a time,
// and `--lead` to the windows the developer talks to, with no child.
//
// A workstream's time is read by stage (the stage each row stored, all eight as they occur), by go (the lead line with its own elapsed
// time) and by window (working, waiting on you, waiting on a run, and idle: a gap past thirty minutes with no run in flight).
//
// `compare` is the before-and-after of a release: it takes two plugin versions, finds the windows each one loaded (the `pluginVersion` of a
// window's `SessionStart` row), and prints for each the lines `show` prints (model minutes by stage, tokens and money by kind of part, the
// window time split four ways, the hook bytes carried) and then the difference, the second version less the first. A version no window loaded is refused by name.
//
// A workstream or an arc is also read on two axes, counted from `hooks.jsonl` alone (MKT.HOOKS.321). Columns say what the agent was
// doing: Reading, Thinking (the gap before a call less the previous row's own time), Changing, Running, Bookkeeping and Waiting. Rows say
// where the time went, from the telemetry row's `work`: Planning, Docs, Code, Generated, Test, Release, Proof and Coordinating. Each cell
// carries its refused calls (a refused or retried call keeps its class). A call is one tool call the hooks saw; the agent's own words
// are never read.
//
//     spn-devex debug cost review <workstream>/N<nnn>
//
// compares an arc's cells with the three arcs before it and prints a finding for each that rose past 25%.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workstreamsDir, type WorkstreamState } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import {
  SPDevExAgentHookVerdictType, SPDevExStageType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryToolType, SPDevExWorkspaceTelemetryVersionType,
} from "../../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { TEST_RUNNERS } from "../../lib/command-reader.ts";
import {
  type CostRow, type GoBlock, NO_STAGE, type StageLine, type TimeSplit, type VersionReading, type WindowLine, arcTarget, byArc, loadedVersions,
  readCost, readTime, readVersion,
} from "../../lib/cost.ts";
import { MODEL_PRICES } from "../../lib/model-prices.ts";
import { USAGE_LOG } from "../../lib/usage.ts";

export const describe = "what a target cost, read from the telemetry: replies, tokens, the model's time, the model and the money, a workstream's calls read by row (planning to coordinating) and by column (reading, thinking, changing, running, bookkeeping, waiting), and its time by stage, by go and by window with the idle time of each; and, between two plugin versions, `compare`";

/** A count as a person reads it: millions and thousands with their letter. */
function shown(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

/** The model's time as minutes and seconds. */
function clock(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, "0")}s` : `${seconds}s`;
}

const dollars = (money: number | null): string => (money === null ? "unknown" : `$${money.toFixed(2)}`);

function print(rows: CostRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("Line".padEnd(width) + "Replies".padStart(8) + "Fresh".padStart(9) + "Cache read".padStart(12) + "Cache write".padStart(13) +
    "Output".padStart(9) + "Model time".padStart(12) + "  " + "Model".padEnd(24) + "Money".padStart(9));
  for (const row of rows)
    console.log(row.key.padEnd(width) + String(row.replies).padStart(8) + shown(row.input).padStart(9) + shown(row.cacheRead).padStart(12) +
      shown(row.cacheWrite).padStart(13) + shown(row.output).padStart(9) + clock(row.modelMs).padStart(12) + "  " +
      (row.models.join(", ") || "-").padEnd(24) + dollars(row.money).padStart(9));
}

/** What a call was: the six, which are the columns the report prints (Reading, Thinking, Changing, Running, Bookkeeping, Waiting). */
const CLASSES = ["reading", "thinking", "change", "proof", "managing", "waiting"] as const;
type Kind = (typeof CLASSES)[number];
const KINDS: readonly Kind[] = CLASSES;
/** The name each class prints under. */
const COLUMNS: Record<Kind, string> = { reading: "Reading", thinking: "Thinking", change: "Changing", proof: "Running", managing: "Bookkeeping", waiting: "Waiting" };
/** The rows of the report: where the time went, from the step kinds the plan holds. */
const ROWS = ["Planning", "Docs", "Code", "Generated", "Test", "Release", "Proof", "Coordinating"] as const;
type Share = { calls: number; minutes: number; refused: number };
/** One line of the split: the calls, the minutes and the refused calls of each class under a key (an arc, an arc's part, or a row). */
export type SplitRow = { key: string } & Record<Kind, Share>;
/** What bounds a split: a time (ms) from and to, and whether only the windows the developer talks to (no child) count. */
export type SplitScope = { from?: number; to?: number; lead?: boolean };

/** A gap longer than this between two calls of a window is the window waiting, not working. */
const WAIT_MS = 5 * 60_000;

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

const GIT_MANAGING = /^(add|commit|push|pull|merge|rebase|checkout|switch|branch|worktree|stash|tag|fetch|reset|cherry-pick|status)$/;

/**
 * What one command was, from the `call` its row keeps (program, group, action; never the arguments): a test run or a check of
 * docs is proof, a `workstream sheet patch` is change, the workstream CLI, `spnutils`, git and the process tools are managing, a write
 * the generator makes or a git mv, rm, restore or apply is change wherever it points (no argument is written), and anything else the
 * hooks record is reading. A plugin command with a subgroup writes it into the action (`docs cycles write` is group `docs`, action
 * `cycles write`).
 */
function classOfCommand(call: Record<string, unknown>): Kind {
  const program = text(call.program) ?? "", group = text(call.group) ?? "", action = text(call.action) ?? "";
  const words = action.split(" ").filter(Boolean), sub = words.length > 1 ? words[0] : "";
  if (TEST_RUNNERS.includes(program) || program === "nx" || group === "test") return "proof";
  if (program === "git") {
    const verb = group || action;
    if (/^(mv|rm|restore|apply)$/.test(verb)) return "change";
    return GIT_MANAGING.test(verb) ? "managing" : "reading";
  }
  if (program === "spn-devex" || program.startsWith("spn-")) {
    if (group === "workstream" && action.startsWith("sheet patch")) return "change";
    if (group === "restates" || group === "docs") return words.includes("write") ? (sub === "cycles" ? "managing" : "change") : "proof";
    return "managing";
  }
  if (program === "spnutils") {
    if (group === "workstream" && action.startsWith("sheet patch")) return "change";
    return /\b(test|verify|validate)\b/.test(`${group} ${action}`) ? "proof" : "managing";
  }
  if (program === "gh" || program === "claude" || /^(lsof|pgrep|ps|kill|pkill)$/.test(program)) return "managing";
  if (/^(test|verify|lint|typecheck|build)$/.test(words.at(-1) ?? "")) return "proof";
  return "reading";
}

/** The row a call belongs to, from the telemetry row's `work`: DESIGN, or no work under the IDEATE stage, is Planning; any other no work is Coordinating. */
function rowOf(work: string | null, stage: string | null): (typeof ROWS)[number] {
  switch (work) {
    case "DOCS": return "Docs";
    case "CODE": return "Code";
    case "GENERATED": return "Generated";
    case "TEST": return "Test";
    case "RELEASE": return "Release";
    case "PROOF": return "Proof";
    case "DESIGN": return "Planning";
    default: return !work && stage === SPDevExStageType.IDEATE ? "Planning" : "Coordinating";
  }
}

/** One slice of time: the minutes it took, the class it counts under, and `count` calls (a gap counts none). */
type Call = {
  workstream: string | null; arc: string | null; part: string | null; kind: Kind; minutes: number; at: number; lead: boolean;
  row: (typeof ROWS)[number]; agent: string | null; node: string | null; refused: boolean; count: number; label: string | null;
};

/**
 * Every call the hooks log holds, once, each with its own `ms`, and between two calls of a stream the gap as thinking: the gap since
 * the stream's previous row's `at` (its start) less that row's `ms`; a gap past `WAIT_MS` is waiting instead. A stream is a window or
 * one child of it. Only `v` 1 rows are read, by their `mtype`: a `COMMAND` row is a call (its class from its `call`; a plugin command
 * that exited with a status, or a call that retries another, is refused and keeps its class), a `TEST` row is proof, a `FILE` row is
 * reading for a `READ`, change for an edit of a file under a repository and bookkeeping for a file outside every repository, and a `CHECK`
 * row whose verdict is `DENY` under `PreToolUse` is a refused call. Any other row is skipped.
 */
function readCalls(root: string, scope: SplitScope = {}): Call[] {
  const calls: Call[] = [];
  const last = new Map<string, { at: number; ms: number }>();
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1) continue;
        const at = Date.parse(text(one.at) ?? "");
        if (!Number.isFinite(at)) continue;
        if (scope.from !== undefined && at < scope.from) continue;
        if (scope.to !== undefined && at > scope.to) continue;
        const lead = !text(one.agent);
        if (scope.lead && !lead) continue;
        let kind: Kind, refused = false, label: string | null = null;
        const call = (one.call && typeof one.call === "object" ? one.call : {}) as Record<string, unknown>;
        if (one.mtype === SPDevExWorkspaceTelemetryRowType.COMMAND) {
          const program = text(call.program);
          refused = ((program === "spn-devex" || program === "spnutils") && typeof one.exit === "number" && one.exit !== 0) || !!text(one.retryOf);
          kind = classOfCommand(call);
          label = [text(call.program), text(call.group), text(call.action)].filter(Boolean).join(" ") || null;
        } else if (one.mtype === SPDevExWorkspaceTelemetryRowType.TEST) {
          kind = "proof";
          label = text((one.test && typeof one.test === "object" ? (one.test as Record<string, unknown>).node : null));
        } else if (one.mtype === SPDevExWorkspaceTelemetryRowType.FILE) {
          label = text(one.file);
          kind = one.tool === SPDevExWorkspaceTelemetryToolType.READ ? "reading" : text(one.file) ? "change" : "managing";
        } else if (one.mtype === SPDevExWorkspaceTelemetryRowType.CHECK && one.event === SPDevExWorkspaceTelemetryEventType.PRE_TOOL_USE
          && one.verdict === SPDevExAgentHookVerdictType.DENY) { kind = "managing"; refused = true; label = text(one.check); }
        else continue;
        const ms = typeof one.ms === "number" && Number.isFinite(one.ms) && one.ms > 0 ? one.ms : 0;
        const stream = `${text(one.session) ?? "-"}/${text(one.agent) ?? ""}`;
        const before = last.get(stream);
        const gap = before === undefined ? 0 : Math.max(0, at - before.at - before.ms);
        last.set(stream, { at, ms });
        const testNode = text((one.test && typeof one.test === "object" ? (one.test as Record<string, unknown>).node : null));
        const tags = { workstream: text(one.workstream), arc: text(one.arc), part: text(one.part), at, lead,
          row: rowOf(text(one.work), text(one.stage)), agent: text(one.agent), node: one.mtype === SPDevExWorkspaceTelemetryRowType.TEST ? testNode : null };
        if (gap > 0) calls.push({ ...tags, kind: gap > WAIT_MS ? "waiting" : "thinking", minutes: gap / 60_000, refused: false, count: 0, label: null });
        calls.push({ ...tags, kind, minutes: ms / 60_000, refused, count: 1, label });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return calls;
}

const empty = (key: string): SplitRow => {
  const row = { key } as SplitRow;
  for (const kind of KINDS) row[kind] = { calls: 0, minutes: 0, refused: 0 };
  return row;
};

/** The calls a workstream or an arc target holds, within the scope, each with its arc normalised to `N<nnn>`. */
function callsOf(root: string, target: string, scope: SplitScope): Call[] {
  if (target === "all" || target.startsWith("window/")) return [];
  const arcOf = arcTarget(target);
  const named = arcOf ? arcOf.workstream : target;
  const same = (tag: string | null) => tag === named || (/^\d{3}$/.test(named) && !!tag && tag.startsWith(`${named}-`));
  return readCalls(root, scope).filter((call) => same(call.workstream) && !!call.arc && (!arcOf || (call.arc as string).replace(/^n/, "N") === arcOf.arc));
}

const rounded = (row: SplitRow): SplitRow => {
  for (const kind of KINDS) row[kind].minutes = Math.round(row[kind].minutes * 10) / 10;
  return row;
};

const addTo = (rows: Map<string, SplitRow>, key: string, call: Call) => {
  const held = rows.get(key) ?? empty(key);
  held[call.kind].calls += call.count;
  held[call.kind].minutes += call.minutes;
  if (call.refused) held[call.kind].refused += 1;
  rows.set(key, held);
};

/**
 * The split of a workstream (a line for each arc, then each of its parts) or of an arc (a line for each part); nothing
 * for any other target. A scope bounds it to a time or to the windows the developer talks to.
 */
export function readSplit(root: string, target: string, scope: SplitScope = {}): SplitRow[] {
  const arcOf = arcTarget(target);
  const rows = new Map<string, SplitRow>();
  for (const call of callsOf(root, target, scope)) {
    const arc = (call.arc as string);
    if (!arcOf) addTo(rows, arc, call);
    if (call.part) addTo(rows, `${arc} · part ${call.part}`, call);
  }
  // Ideate first, the build arcs by number, Follow-ups last; an arc's own line before its parts.
  const keys = [...rows.keys()].sort((a, b) => byArc(a.split(" · ")[0], b.split(" · ")[0]) || a.localeCompare(b, "en", { numeric: true }));
  return keys.map((key) => rounded(rows.get(key) as SplitRow));
}

/** The work of a target: a line for each of the eight rows that holds time, in the order Planning to Coordinating. */
export function readWork(root: string, target: string, scope: SplitScope = {}): SplitRow[] {
  const rows = new Map<string, SplitRow>();
  for (const call of callsOf(root, target, scope)) addTo(rows, call.row, call);
  return ROWS.filter((name) => rows.has(name)).map((name) => rounded(rows.get(name) as SplitRow));
}

/** The three largest cells of the work table, by minutes. */
export type Cell = { row: string; column: string; minutes: number; calls: number; refused: number; top: { label: string; minutes: number }[] };
export function largestCells(work: SplitRow[], calls: Call[] = []): Cell[] {
  const cells: Cell[] = work.flatMap((row) => KINDS.map((kind) => ({ row: row.key, column: COLUMNS[kind], minutes: row[kind].minutes, calls: row[kind].calls, refused: row[kind].refused, top: [] })));
  const largest = cells.filter((cell) => cell.minutes > 0).sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  for (const one of largest) {
    const labels = new Map<string, number>();
    for (const call of calls)
      if (call.row === one.row && COLUMNS[call.kind] === one.column && call.label) labels.set(call.label, (labels.get(call.label) ?? 0) + call.minutes);
    one.top = [...labels].map(([label, minutes]) => ({ label, minutes: Math.round(minutes * 10) / 10 })).sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  }
  return largest;
}

const cell = (share: Share): string => `${share.calls} · ${share.minutes}m${share.refused ? ` · ${share.refused} refused` : ""}`;

function printSplit(rows: SplitRow[], title = "Split"): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("\n" + title.padEnd(width) + KINDS.map((kind) => COLUMNS[kind].padStart(20)).join(""));
  for (const row of rows) console.log(row.key.padEnd(width) + KINDS.map((kind) => cell(row[kind]).padStart(20)).join(""));
}

function printWork(work: SplitRow[], largest: Cell[]): void {
  printSplit(work, "Work");
  if (!largest.length) return;
  console.log("\nLargest cells");
  for (const one of largest) {
    console.log(`  ${one.row} · ${one.column}: ${one.minutes}m, ${one.calls} calls${one.refused ? `, ${one.refused} refused` : ""}`);
    for (const top of one.top) console.log(`    ${top.label}: ${top.minutes}m`);
  }
}

/** A model time or a window's span as minutes and seconds, a dash for none. */
const span = (ms: number): string => (ms > 0 ? clock(ms) : "—");

/** The folder name of the workstream a target names (its whole name, or its number), or null where the target names none. */
function workstreamOf(root: string, target: string): string | null {
  if (target === "all" || target.startsWith("window/") || target.includes("/")) return null;
  for (const state of ["open", "closed", "backlog"]) {
    const dir = workstreamsDir(root, state as WorkstreamState);
    if (!existsSync(dir)) continue;
    const found = readdirSync(dir).find((name) => name === target || (/^\d{3}$/.test(target) && name.startsWith(`${target}-`)));
    if (found) return found;
  }
  return null;
}

function printStages(lines: StageLine[]): void {
  const names = [...Object.values(SPDevExStageType)].filter((name) => lines.some((one) => one.stages[name]));
  const width = Math.max(8, ...lines.map((one) => one.arc.length)) + 2;
  console.log("\n" + "Stage".padEnd(width) + [...names, "No stage"].map((name) => name.padStart(11)).join("") + "Money".padStart(10));
  for (const one of lines)
    console.log(one.arc.padEnd(width) + [...names, NO_STAGE].map((name) => span(one.stages[name] ?? 0).padStart(11)).join("") + dollars(one.money).padStart(10));
  const total = (name: string) => lines.reduce((sum, one) => sum + (one.stages[name] ?? 0), 0);
  const money = lines.some((one) => one.money === null) ? null : lines.reduce((sum, one) => sum + (one.money ?? 0), 0);
  console.log("All arcs".padEnd(width) + [...names, NO_STAGE].map((name) => span(total(name)).padStart(11)).join("") + dollars(money).padStart(10));
}

function printGoBlocks(blocks: GoBlock[]): void {
  for (const block of blocks) {
    const lines = [...block.lines, ...(block.noPart ? [block.noPart] : [])];
    const title = `Go ${block.lead} · ${block.scope.join(", ")}`;
    const width = Math.max(title.length, 8, ...lines.map((one) => one.label.length), 4) + 2;
    console.log("\n" + title.padEnd(width) + "Parts".padStart(7) + "Helpers".padStart(9) + "Replies".padStart(9) + "Model time".padStart(12) + "Elapsed".padStart(9) + "Money".padStart(9));
    const row = (one: GoBlock["leadLine"]) => `  ${one.label}`.padEnd(width) + (one.parts ? String(one.parts) : "—").padStart(7) +
      (one.helpers ? String(one.helpers) : "—").padStart(9) + (one.replies ? String(one.replies) : "—").padStart(9) +
      span(one.modelMs).padStart(12) + (one.elapsedMin === null ? "—" : `${one.elapsedMin}m`).padStart(9) + (one.money === null ? "—" : dollars(one.money)).padStart(9);
    for (const one of block.lines) console.log(row(one));
    console.log(row(block.leadLine));
    if (block.noPart) console.log(row(block.noPart));
  }
}

function printWindows(lines: WindowLine[]): void {
  const width = Math.max(11, ...lines.map((one) => `${one.arc} · ${one.phase}`.length)) + 2;
  console.log("\n" + "Window time".padEnd(width) + "Agent".padStart(10) + "Waiting on you".padStart(16) + "Waiting on a run".padStart(18) + "Idle".padStart(10));
  for (const one of lines)
    console.log(`${one.arc} · ${one.phase}`.padEnd(width) + clock(one.workingMs).padStart(10) + clock(one.waitingOnYouMs).padStart(16) + clock(one.waitingOnRunMs).padStart(18) + clock(one.idleMs).padStart(10));
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG, lead: FLAG, from: VALUE, to: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one target: `all`, a workstream, `<workstream>/<arc>` (`N<nnn>`, `ideate` or `follow-ups`), or `window/<session>` or `window/this`.");
  const target = words.paths[0];
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { rows, earliest } = readCost(root, target);
  const scope: SplitScope = { lead: words.given("lead") };
  for (const bound of ["from", "to"] as const) {
    const given = words.value(bound);
    if (given === null) continue;
    const time = Date.parse(given);
    if (!Number.isFinite(time)) throw new UsageFault(`takes \`--${bound}\` as a time such as 2026-10-30T12:12Z, and \`${given}\` is not one.`);
    scope[bound] = time;
  }
  const split = readSplit(root, target, scope);
  const work = readWork(root, target, scope);
  const largest = largestCells(work, callsOf(root, target, scope));
  const named = workstreamOf(root, target);
  const time = named ? readTime(root, named) : null;
  if (words.given("json")) {
    console.log(JSON.stringify({ target, earliest, pricesAsOf: MODEL_PRICES.asOf, estimate: true, rows, split, work, largest,
      stages: time?.stages ?? [], goBlocks: time?.goBlocks ?? [], windows: time?.windows ?? [] }, null, 2));
    return 0;
  }
  if (!rows.length && split.length) { printSplit(split); printWork(work, largest); return 0; }
  if (!rows.length) {
    console.log(`no usage for \`${target}\` in ${telemetryFolder(root)}${earliest ? `, which reaches back to ${earliest}` : " — it holds none; `debug switch on telemetry` records from the next reply"}`);
    return 0;
  }
  print(rows);
  if (split.length) printSplit(split);
  if (work.length) printWork(work, largest);
  if (time?.stages.length) printStages(time.stages);
  if (time?.goBlocks.length) printGoBlocks(time.goBlocks);
  if (time?.windows.length) printWindows(time.windows);
  console.log(`\nTelemetry reaches back to ${earliest}. Money is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

const minutes = (ms: number): string => `${Math.round(ms / 6000) / 10}m`;
const signed = (n: number, text: string): string => (n > 0 ? `+${text}` : text);

/** The stages of both readings, in the order the skills construct lists them, then the rows nothing names. */
function stageNames(readings: VersionReading[]): string[] {
  const names = [...Object.values(SPDevExStageType), NO_STAGE] as string[];
  return names.filter((name) => readings.some((one) => one.stages[name]));
}

function printReading(one: VersionReading): void {
  console.log(`\nPlugin ${one.version} · ${one.windows} window${one.windows === 1 ? "" : "s"}`);
  const names = stageNames([one]);
  if (names.length) {
    console.log("Stage".padEnd(10) + names.map((name) => name.padStart(11)).join(""));
    console.log("Model time".padEnd(10) + names.map((name) => span(one.stages[name] ?? 0).padStart(11)).join(""));
  }
  if (one.parts.length) print(one.parts);
  const t = one.time;
  console.log("Window time".padEnd(16) + "Agent".padStart(10) + "Waiting on you".padStart(16) + "Waiting on a run".padStart(18) + "Idle".padStart(10));
  console.log("".padEnd(16) + clock(t.workingMs).padStart(10) + clock(t.waitingOnYouMs).padStart(16) + clock(t.waitingOnRunMs).padStart(18) + clock(t.idleMs).padStart(10));
  console.log(`Hook bytes carried: ${one.carried}`);
}

/** The second reading less the first: model time by stage, replies, tokens and money by kind of part, window time and hook bytes carried. */
function difference(a: VersionReading, b: VersionReading) {
  const tokens = (row: CostRow | undefined) => (row ? row.input + row.cacheRead + row.cacheWrite + row.output : 0);
  const kinds = [...new Set([...a.parts, ...b.parts].map((row) => row.key))].sort();
  const moneyOf = (row: CostRow | undefined) => (row ? row.money : 0);
  return {
    stagesMs: Object.fromEntries(stageNames([a, b]).map((name) => [name, (b.stages[name] ?? 0) - (a.stages[name] ?? 0)])),
    parts: kinds.map((key) => {
      const was = a.parts.find((row) => row.key === key), now = b.parts.find((row) => row.key === key);
      const m = moneyOf(was), n = moneyOf(now);
      return { key, modelMs: (now?.modelMs ?? 0) - (was?.modelMs ?? 0), tokens: tokens(now) - tokens(was), money: m === null || n === null ? null : Math.round((n - m) * 1e6) / 1e6 };
    }),
    time: Object.fromEntries((Object.keys(a.time) as Array<keyof TimeSplit>).map((key) => [key, b.time[key] - a.time[key]])),
    carried: b.carried - a.carried,
  };
}

function compare(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 2) throw new UsageFault("takes two plugin versions, such as `0.41.0 0.42.0`: the one before and the one after.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const loaded = loadedVersions(root);
  for (const version of words.paths)
    if (!loaded.has(version))
      throw new UsageFault(`finds no window that loaded plugin version \`${version}\`. The windows the telemetry holds loaded: ${[...loaded.keys()].sort().join(", ") || "none, for no window has recorded its plugin version"}.`);
  const [a, b] = words.paths.map((version) => readVersion(root, version, loaded.get(version) as string[]));
  const diff = difference(a, b);
  if (words.given("json")) { console.log(JSON.stringify({ versions: [a.version, b.version], readings: [a, b], difference: diff, pricesAsOf: MODEL_PRICES.asOf, estimate: true }, null, 2)); return 0; }
  printReading(a);
  printReading(b);
  console.log(`\nDifference, ${b.version} less ${a.version}`);
  const names = Object.keys(diff.stagesMs);
  if (names.length) {
    console.log("Stage".padEnd(10) + names.map((name) => name.padStart(11)).join(""));
    console.log("Model time".padEnd(10) + names.map((name) => signed(diff.stagesMs[name], minutes(diff.stagesMs[name])).padStart(11)).join(""));
  }
  const width = Math.max(8, ...diff.parts.map((row) => row.key.length)) + 2;
  console.log("Part kind".padEnd(width) + "Model time".padStart(12) + "Tokens".padStart(12) + "Money".padStart(10));
  for (const row of diff.parts)
    console.log(row.key.padEnd(width) + signed(row.modelMs, minutes(row.modelMs)).padStart(12) + signed(row.tokens, String(row.tokens)).padStart(12) +
      (row.money === null ? "unknown" : signed(row.money, `$${row.money.toFixed(2)}`)).padStart(10));
  console.log(`Window time: agent ${signed(diff.time.workingMs, minutes(diff.time.workingMs))}, waiting on you ${signed(diff.time.waitingOnYouMs, minutes(diff.time.waitingOnYouMs))}, ` +
    `waiting on a run ${signed(diff.time.waitingOnRunMs, minutes(diff.time.waitingOnRunMs))}, idle ${signed(diff.time.idleMs, minutes(diff.time.idleMs))}`);
  console.log(`Hook bytes carried: ${signed(diff.carried, String(diff.carried))}`);
  console.log(`\nMoney is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

/** The cached tokens each helper read in each arc of a workstream, from the `TURN` rows of the usage log. */
function cachedTokens(root: string, named: string): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  const seen = new Set<string>();
  for (const file of logFiles(join(telemetryFolder(root), USAGE_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1 || one.mtype !== SPDevExWorkspaceTelemetryRowType.TURN) continue;
        const ws = text(one.workstream), arc = text(one.arc), id = text(one.id);
        if (!arc || !(ws === named || (/^\d{3}$/.test(named) && !!ws && ws.startsWith(`${named}-`)))) continue;
        if (id) { if (seen.has(id)) continue; seen.add(id); }
        const read = Number(((one.tokens ?? {}) as Record<string, unknown>).cacheRead);
        if (!Number.isFinite(read) || read <= 0) continue;
        const key = arc.replace(/^n/, "N"), agent = text(one.agent) ?? "lead";
        const held = out.get(key) ?? new Map<string, number>();
        held.set(agent, (held.get(agent) ?? 0) + read);
        out.set(key, held);
      } catch { /* a torn last line is skipped */ }
    }
  }
  return out;
}

type Reading = { value: number; text: string; show: (n: number) => string };

/** The cells of one arc: minutes in each column, refused calls, test minutes for each node and cached tokens for each helper. */
function cellsOf(calls: Call[], cached: Map<string, number> | undefined): Map<string, Reading> {
  const cells = new Map<string, Reading>();
  const put = (name: string, value: number, show: (n: number) => string) => cells.set(name, { value, text: show(value), show });
  const mins = (n: number) => `${Math.round(n * 10) / 10}m`;
  for (const kind of KINDS) put(COLUMNS[kind], calls.filter((one) => one.kind === kind).reduce((sum, one) => sum + one.minutes, 0), mins);
  put("Refusals", calls.filter((one) => one.refused).length, String);
  for (const node of new Set(calls.map((one) => one.node).filter((one): one is string => !!one)))
    put(`Test ${node}`, calls.filter((one) => one.node === node).reduce((sum, one) => sum + one.minutes, 0), mins);
  for (const [agent, read] of cached ?? []) put(`Cached tokens ${agent}`, read, shown);
  return cells;
}

/** The cells of the arc that rose past 25% of the mean of the three arcs before it, one finding to a line. */
function review(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  const arcOf = words.paths.length === 1 ? arcTarget(words.paths[0]) : null;
  if (!arcOf || !/^N\d+/.test(arcOf.arc)) throw new UsageFault("takes one arc: `<workstream>/N<nnn>`.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const calls = callsOf(root, arcOf.workstream, {});
  const cached = cachedTokens(root, arcOf.workstream);
  const arcs = [...new Set(calls.map((one) => (one.arc as string).replace(/^n/, "N")).concat([...cached.keys()]))].filter((one) => /^N\d+/.test(one)).sort(byArc);
  const before = arcs.filter((one) => byArc(one, arcOf.arc) < 0).slice(-3);
  const of = (arc: string) => cellsOf(calls.filter((one) => (one.arc as string).replace(/^n/, "N") === arc), cached.get(arc));
  const now = of(arcOf.arc), earlier = before.map(of);
  const findings: string[] = [];
  if (earlier.length)
    for (const [name, one] of now) {
      const mean = earlier.reduce((sum, cells) => sum + (cells.get(name)?.value ?? 0), 0) / earlier.length;
      if (mean > 0 && one.value > mean * 1.25) findings.push(`${name} rose from ${one.show(name === "Refusals" || name.startsWith("Cached") ? Math.round(mean) : mean)} to ${one.text} against the last three arcs`);
    }
  if (words.given("json")) { console.log(JSON.stringify({ target: words.paths[0], against: before, cells: Object.fromEntries([...now].map(([name, one]) => [name, one.value])), findings }, null, 2)); return 0; }
  console.log(`${words.paths[0]} against ${before.length ? before.join(", ") : "no earlier arc"}`);
  for (const [name, one] of now) console.log(`  ${name.padEnd(28)}${one.text}`);
  if (findings.length) { console.log(""); for (const line of findings) console.log(line); }
  else console.log("\nNo cell rose past 25% against the last three arcs.");
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "what a target cost, a line for each part its breakdown names", usage: "<target> [--from <time>] [--to <time>] [--lead] [--json]", run: show },
  compare: { describe: "the before-and-after of a release: what the windows of two plugin versions cost, with the difference", usage: "<version> <version> [--json]", run: compare },
  review: { describe: "an arc's cells against the three arcs before it: a finding for each that rose past 25%", usage: "<workstream>/N<nnn> [--json]", run: review },
};
