// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug cost show <target> [--json]
//
// What a target cost, read from the telemetry alone (`lib/cost.ts`): `all` prints a line for each workstream, a
// workstream one for each arc, an arc one for each row and order, a window the window and each child. The target
// chooses the breakdown, so there is no option to group, to bound a time or to choose money.
//
// A workstream or an arc is also split by what its calls were: change, proof, managing, refusals and waiting, counted
// from `hooks.jsonl` alone (MKT.HOOKS.321). A call is one tool call the hooks saw; the agent's own words are never read.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { TEST_RUNNERS } from "../../lib/command-reader.ts";
import { type CostRow, readCost } from "../../lib/cost.ts";
import { MODEL_PRICES } from "../../lib/model-prices.ts";

export const describe = "what a target cost, read from the telemetry: replies, tokens, the model's time, the model and the money, and a workstream's calls split into change, proof, managing, refusals and waiting";

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
type Share = { calls: number; minutes: number };
/** One line of the split: the calls and the minutes of each class under a key (an arc, or an arc's row). */
export type SplitRow = { key: string } & Record<Class, Share>;

/** A gap longer than this between two calls of a window is the window waiting, not working. */
const WAIT_MS = 5 * 60_000;

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** What a Bash command was: a test run is proof, a command of the plugin or `spnutils` (and git on `.spndevex`) is managing, anything else is change. */
function classOfCommand(line: Record<string, unknown>): Class {
  const script = text(line.script) ?? "", group = text(line.group) ?? "", action = text(line.action) ?? "", args = text(line.args) ?? "";
  if (TEST_RUNNERS.includes(script) || script === "nx" || group === "test" || /^(test|verify|lint)\b/.test(action)) return "proof";
  if (script === "git") return args.includes(".spndevex") ? "managing" : "change";
  if (script === "spnutils" || script.startsWith("spn-")) return "managing";
  return "change";
}

type Call = { workstream: string | null; arc: string | null; row: string | null; kind: Class; minutes: number };

/**
 * Every call the hooks log holds, once, with the minutes since the window's previous line. A call is a tool call that ran
 * (`PostToolUse`, its Bash command line giving the class) or one that was refused (`PreToolUse` with a `deny`), or a
 * send-back at the turn's end. A gap past `WAIT_MS` is a wait of its own.
 */
function readCalls(root: string): Call[] {
  const calls: Call[] = [];
  const lastAt = new Map<string, number>(), command = new Map<string, Class>();
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const session = text(one.session) ?? "-", at = Date.parse(text(one.at) ?? "");
        if (one.event === "command") { command.set(session, classOfCommand(one)); continue; }
        if (one.group !== "events" || !Number.isFinite(at)) continue;
        const gap = lastAt.has(session) ? Math.max(0, at - (lastAt.get(session) as number)) : 0;
        lastAt.set(session, at);
        const event = text(one.event);
        const tags = { workstream: text(one.workstream), arc: text(one.arc), row: text(one.row) };
        const kinds: Class | null = one.verdict === "deny" && (event === "PreToolUse" || event === "Stop") ? "refusals"
          : event === "PostToolUse" || event === "PostToolUseFailure" ? (one.tool === "Bash" ? command.get(session) ?? "change" : "change") : null;
        if (event === "PostToolUse" || event === "PostToolUseFailure") command.delete(session);
        if (!kinds) continue;
        if (gap > WAIT_MS) { calls.push({ ...tags, kind: "waiting", minutes: gap / 60_000 }); calls.push({ ...tags, kind: kinds, minutes: 0 }); }
        else calls.push({ ...tags, kind: kinds, minutes: gap / 60_000 });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return calls;
}

const empty = (key: string): SplitRow => ({ key, change: { calls: 0, minutes: 0 }, proof: { calls: 0, minutes: 0 }, managing: { calls: 0, minutes: 0 },
  refusals: { calls: 0, minutes: 0 }, waiting: { calls: 0, minutes: 0 } });

/**
 * The split of a workstream (a line for each arc, then each of its rows) or of an arc (a line for each row); nothing
 * for any other target.
 */
export function readSplit(root: string, target: string): SplitRow[] {
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
  for (const call of readCalls(root)) {
    if (!same(call.workstream) || !call.arc) continue;
    if (arcTarget && call.arc.toUpperCase() !== arcTarget[2].toUpperCase()) continue;
    if (!arcTarget) add(call.arc, call);
    if (call.row) add(`${call.arc} · row ${call.row}`, call);
  }
  const keys = [...rows.keys()].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return keys.map((key) => {
    const row = rows.get(key) as SplitRow;
    for (const kind of CLASSES) row[kind].minutes = Math.round(row[kind].minutes * 10) / 10;
    return row;
  });
}

function printSplit(rows: SplitRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("\n" + "Split".padEnd(width) + CLASSES.map((kind) => kind.padStart(16)).join(""));
  for (const row of rows)
    console.log(row.key.padEnd(width) + CLASSES.map((kind) => `${row[kind].calls} · ${row[kind].minutes}m`.padStart(16)).join(""));
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one target: `all`, a workstream, `<workstream>/N<nnn>`, or `window/<session>` or `window/this`.");
  const target = words.paths[0];
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { rows, earliest } = readCost(root, target);
  const split = readSplit(root, target);
  if (words.given("json")) {
    console.log(JSON.stringify({ target, earliest, pricesAsOf: MODEL_PRICES.asOf, estimate: true, rows, split }, null, 2));
    return 0;
  }
  if (!rows.length && split.length) { printSplit(split); return 0; }
  if (!rows.length) {
    console.log(`no usage for \`${target}\` in ${telemetryFolder(root)}${earliest ? `, which reaches back to ${earliest}` : " — it holds none; `debug switch on telemetry` records from the next reply"}`);
    return 0;
  }
  print(rows);
  if (split.length) printSplit(split);
  console.log(`\nTelemetry reaches back to ${earliest}. Money is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "what a target cost, a line for each part its breakdown names", usage: "<target> [--json]", run: show },
};
