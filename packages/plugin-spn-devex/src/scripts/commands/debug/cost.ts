// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug cost show <target> [--json]
//
// What a target cost, read from the telemetry alone (`lib/cost.ts`): `all` prints a line for each workstream, a
// workstream one for each arc, an arc one for each row and order, a window the window and each child. The target
// chooses the breakdown, so there is no option to group or to choose money; `--from` and `--to` bound the split to a time,
// and `--lead` to the windows the developer talks to, with no child.
//
// A workstream or an arc is also split by what its calls were: change, proof, managing, refusals and waiting, counted
// from `hooks.jsonl` alone (MKT.HOOKS.321). A call is one tool call the hooks saw; the agent's own words are never read.
// The classes are the 31 October measure's (`036-agent-follows-rules`, notes N010 `slowness-measure.md`): its MANAGE is managing, its
// CHANGE and PROOF the same, its REFUSED and RETRY together refusals, and its READ is kept as reading, with no column.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import {
  SPDevExAgentHookVerdictType, SPDevExStageType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType,
} from "../../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { TEST_RUNNERS } from "../../lib/command-reader.ts";
import { type CostRow, type GoBlock, NO_STAGE, type StageLine, type WindowLine, readCost, readTime } from "../../lib/cost.ts";
import { MODEL_PRICES } from "../../lib/model-prices.ts";

export const describe = "what a target cost, read from the telemetry: replies, tokens, the model's time, the model and the money, a workstream's calls split into change, proof, managing, refusals and waiting, and its time by stage, by go and by window";

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

const CLASSES = ["change", "proof", "managing", "refusals", "waiting"] as const;
type Class = (typeof CLASSES)[number];
/** What a call was before it is a column: the five, and reading, which the sheet has no column for but the measure's percentages count. */
type Kind = Class | "reading";
const KINDS: readonly Kind[] = [...CLASSES, "reading"];
type Share = { calls: number; minutes: number };
/** One line of the split: the calls and the minutes of each class under a key (an arc, or an arc's row). */
export type SplitRow = { key: string } & Record<Kind, Share>;
/** What bounds a split: a time (ms) from and to, and whether only the windows the developer talks to (no child) count. */
export type SplitScope = { from?: number; to?: number; lead?: boolean };

/** A gap longer than this between two calls of a window is the window waiting, not working. */
const WAIT_MS = 5 * 60_000;

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

const GIT_MANAGING = /^(add|commit|push|pull|merge|rebase|checkout|switch|branch|worktree|stash|tag|fetch|reset|cherry-pick|status)$/;

/**
 * What one command was, from the `call` its row keeps (program, group, action; never the arguments): a test run or a check of
 * docs is proof, the workstream CLI, `spnutils`, git and the process tools are managing, a write the generator makes or a git
 * mv, rm, restore or apply is change wherever it points (no argument is written), and anything else the hooks record is reading.
 * A plugin command with a subgroup writes it into the action (`docs cycles write` is group `docs`, action `cycles write`).
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
    if (group === "restates" || group === "docs") return words.includes("write") ? (sub === "cycles" ? "managing" : "change") : "proof";
    return "managing";
  }
  if (program === "spnutils") return /\b(test|verify|validate)\b/.test(`${group} ${action}`) ? "proof" : "managing";
  if (program === "gh" || program === "claude" || /^(lsof|pgrep|ps|kill|pkill)$/.test(program)) return "managing";
  if (/^(test|verify|lint|typecheck|build)$/.test(words.at(-1) ?? "")) return "proof";
  return "reading";
}

type Call = { workstream: string | null; arc: string | null; part: string | null; kind: Kind; minutes: number; at: number; lead: boolean };

/**
 * Every call the hooks log holds, once, with the minutes since its stream's previous call. A stream is a window or one child of it.
 * Only `v` 1 rows are read, by their `mtype`: a `COMMAND` row is a call (its class from its `call`; a plugin command that exited with a
 * status, or a call that retries another, is a refusal), a `TEST` row is proof, and a `CHECK` row whose verdict is `DENY` under
 * `PreToolUse` is a call a check refused. Any other row is skipped. A gap past `WAIT_MS` is a wait of its own.
 */
function readCalls(root: string, scope: SplitScope = {}): Call[] {
  const calls: Call[] = [];
  const last = new Map<string, number>();
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
        let kind: Kind;
        const call = (one.call && typeof one.call === "object" ? one.call : {}) as Record<string, unknown>;
        if (one.mtype === SPDevExWorkspaceTelemetryRowType.COMMAND) {
          const program = text(call.program);
          const refusedByExit = (program === "spn-devex" || program === "spnutils") && typeof one.exit === "number" && one.exit !== 0;
          kind = refusedByExit || text(one.retryOf) ? "refusals" : classOfCommand(call);
        } else if (one.mtype === SPDevExWorkspaceTelemetryRowType.TEST) kind = "proof";
        else if (one.mtype === SPDevExWorkspaceTelemetryRowType.CHECK && one.event === SPDevExWorkspaceTelemetryEventType.PRE_TOOL_USE
          && one.verdict === SPDevExAgentHookVerdictType.DENY) kind = "refusals";
        else continue;
        const stream = `${text(one.session) ?? "-"}/${text(one.agent) ?? ""}`;
        const before = last.get(stream);
        const gap = before === undefined ? 0 : Math.max(0, at - before);
        last.set(stream, at);
        const tags = { workstream: text(one.workstream), arc: text(one.arc), part: text(one.part), at, lead };
        if (gap > WAIT_MS) { calls.push({ ...tags, kind: "waiting", minutes: gap / 60_000 }); calls.push({ ...tags, kind, minutes: 0 }); }
        else calls.push({ ...tags, kind, minutes: gap / 60_000 });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return calls;
}

const empty = (key: string): SplitRow => ({ key, change: { calls: 0, minutes: 0 }, proof: { calls: 0, minutes: 0 }, managing: { calls: 0, minutes: 0 },
  refusals: { calls: 0, minutes: 0 }, waiting: { calls: 0, minutes: 0 }, reading: { calls: 0, minutes: 0 } });

/**
 * The split of a workstream (a line for each arc, then each of its rows) or of an arc (a line for each row); nothing
 * for any other target. A scope bounds it to a time or to the windows the developer talks to.
 */
export function readSplit(root: string, target: string, scope: SplitScope = {}): SplitRow[] {
  if (target === "all" || target.startsWith("window/")) return [];
  const arcTarget = /^(.+)\/(N\d+[a-z]?)$/i.exec(target);
  const named = arcTarget ? arcTarget[1] : target;
  const same = (tag: string | null) => tag === named || (/^\d{3}$/.test(named) && !!tag && tag.startsWith(`${named}-`));
  const rows = new Map<string, SplitRow>();
  const add = (key: string, call: Call) => {
    const held = rows.get(key) ?? empty(key);
    held[call.kind].calls += 1;
    held[call.kind].minutes += call.minutes;
    rows.set(key, held);
  };
  for (const call of readCalls(root, scope)) {
    if (!same(call.workstream) || !call.arc) continue;
    if (arcTarget && call.arc.toUpperCase() !== arcTarget[2].toUpperCase()) continue;
    if (!arcTarget) add(call.arc, call);
    if (call.part) add(`${call.arc} · part ${call.part}`, call);
  }
  const keys = [...rows.keys()].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return keys.map((key) => {
    const row = rows.get(key) as SplitRow;
    for (const kind of KINDS) row[kind].minutes = Math.round(row[kind].minutes * 10) / 10;
    return row;
  });
}

function printSplit(rows: SplitRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("\n" + "Split".padEnd(width) + CLASSES.map((kind) => kind.padStart(16)).join(""));
  for (const row of rows)
    console.log(row.key.padEnd(width) + CLASSES.map((kind) => `${row[kind].calls} · ${row[kind].minutes}m`.padStart(16)).join(""));
}

/** A model time or a window's span as minutes and seconds, a dash for none. */
const span = (ms: number): string => (ms > 0 ? clock(ms) : "—");

/** The folder name of the workstream a target names (its whole name, or its number), or null where the target names none. */
function workstreamOf(root: string, target: string): string | null {
  if (target === "all" || target.startsWith("window/") || target.includes("/")) return null;
  for (const state of ["open", "closed", "backlog"]) {
    const dir = join(root, ".spndevex", "workstreams", state);
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
  console.log("\n" + "Window time".padEnd(width) + "Agent".padStart(10) + "Waiting on you".padStart(16) + "Waiting on a run".padStart(18));
  for (const one of lines)
    console.log(`${one.arc} · ${one.phase}`.padEnd(width) + clock(one.workingMs).padStart(10) + clock(one.waitingOnYouMs).padStart(16) + clock(one.waitingOnRunMs).padStart(18));
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG, lead: FLAG, from: VALUE, to: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one target: `all`, a workstream, `<workstream>/N<nnn>`, or `window/<session>` or `window/this`.");
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
  const named = workstreamOf(root, target);
  const time = named ? readTime(root, named) : null;
  if (words.given("json")) {
    console.log(JSON.stringify({ target, earliest, pricesAsOf: MODEL_PRICES.asOf, estimate: true, rows, split,
      stages: time?.stages ?? [], goBlocks: time?.goBlocks ?? [], windows: time?.windows ?? [] }, null, 2));
    return 0;
  }
  if (!rows.length && split.length) { printSplit(split); return 0; }
  if (!rows.length) {
    console.log(`no usage for \`${target}\` in ${telemetryFolder(root)}${earliest ? `, which reaches back to ${earliest}` : " — it holds none; `debug switch on telemetry` records from the next reply"}`);
    return 0;
  }
  print(rows);
  if (split.length) printSplit(split);
  if (time?.stages.length) printStages(time.stages);
  if (time?.goBlocks.length) printGoBlocks(time.goBlocks);
  if (time?.windows.length) printWindows(time.windows);
  console.log(`\nTelemetry reaches back to ${earliest}. Money is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "what a target cost, a line for each part its breakdown names", usage: "<target> [--from <time>] [--to <time>] [--lead] [--json]", run: show },
};
