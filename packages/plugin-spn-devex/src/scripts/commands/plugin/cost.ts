// What a window and its children cost, read back from the telemetry the `Stop` event writes.
//
// `workspace timings --on` arms the recorder, and then each `Stop` appends one line per model turn to
// `.spndevex/.debug/telemetry/usage.jsonl` (`scripts/lib/usage.ts`). This reads those lines back into
// the table `notes/N010/measure.md` was written as by hand: for the window and for each child, the
// turns, the tokens read fresh, read from cache and written to cache, the output, and what a turn
// read from cache on average. It never reads a transcript.
//
//     spn-devex plugin cost show [--json] [<root>]
//
// A SUBJECT WITH ONE ACTION. Its one path is a workspace, found by walking up from the current
// directory when none is given. Where the log holds no usage the command says so in one line and
// exits 0: a switch left off is a fact about this session, not a finding.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { USAGE_LOG } from "../../lib/usage.ts";

type Line = { session: string | null; agent: string | null; order: string | null; input: number; cache_read: number; cache_write: number; output: number };

export type Row = { who: string; turns: number; input: number; cacheRead: number; cacheWrite: number; output: number; readPerTurn: number };

const text = (value: unknown) => (typeof value === "string" && value ? value : null);
const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** Every usage line the log carries, oldest first, skipping a line the writer could not have produced. */
export function readUsage(root: string): Line[] {
  const log = join(root, ".spndevex", ".debug", "telemetry", USAGE_LOG);
  if (!existsSync(log) || !statSync(log).isFile()) return [];
  const out: Line[] = [];
  for (const line of readFileSync(log, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      out.push({ session: text(parsed.session), agent: text(parsed.agent), order: text(parsed.order), input: number(parsed.input),
                 cache_read: number(parsed.cache_read), cache_write: number(parsed.cache_write), output: number(parsed.output) });
    } catch { /* a torn last line is skipped */ }
  }
  return out;
}

function rowOf(who: string, lines: Line[]): Row {
  const sum = (key: "input" | "cache_read" | "cache_write" | "output") => lines.reduce((total, one) => total + one[key], 0);
  return { who, turns: lines.length, input: sum("input"), cacheRead: sum("cache_read"), cacheWrite: sum("cache_write"), output: sum("output"),
           readPerTurn: lines.length ? Math.round(sum("cache_read") / lines.length) : 0 };
}

/** The window first, then each child in the order it first appears, then the children together. */
export function summarize(lines: Line[]): Row[] {
  const window = lines.filter((one) => !one.agent);
  const children = new Map<string, Line[]>();
  for (const one of lines) if (one.agent) children.set(one.agent, [...(children.get(one.agent) ?? []), one]);
  const rows: Row[] = [];
  if (window.length) rows.push(rowOf("The main window", window));
  for (const [agent, group] of children) {
    const order = group.map((one) => one.order).find(Boolean);
    rows.push(rowOf(order ? `Child ${agent.slice(0, 8)}, order ${order}` : `Child ${agent.slice(0, 8)}`, group));
  }
  if (children.size) rows.push(rowOf("The children together", [...children.values()].flat()));
  return rows;
}

/** A count as a person reads it: millions and thousands with their letter. */
export function shown(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

export const describe = "what a window and each of its children cost — turns, tokens read, written and read from cache — read from the telemetry log";

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length > 1) throw new UsageFault("takes one workspace root.");
  const json = words.given("json");
  const root = resolve(words.paths[0] ?? workspaceRoot(process.cwd()) ?? process.cwd());
  const lines = readUsage(root);
  if (lines.length === 0) {
    if (json) console.log(JSON.stringify({ root, turns: 0, rows: [] }, null, 2));
    else console.log(`no usage at ${join(root, ".spndevex", ".debug", "telemetry", USAGE_LOG)} — run \`workspace timings --on\`, and each turn that ends after it is counted`);
    return 0;
  }
  const rows = summarize(lines);
  if (json) { console.log(JSON.stringify({ root, turns: lines.length, rows }, null, 2)); return 0; }
  const width = Math.max(12, ...rows.map((row) => row.who.length)) + 2;
  console.log("Who".padEnd(width) + "Turns".padStart(7) + "Read".padStart(9) + "Read from cache".padStart(17) + "Written to cache".padStart(18) +
    "Output".padStart(9) + "Read per turn".padStart(15));
  for (const row of rows)
    console.log(row.who.padEnd(width) + String(row.turns).padStart(7) + shown(row.input).padStart(9) + shown(row.cacheRead).padStart(17) +
      shown(row.cacheWrite).padStart(18) + shown(row.output).padStart(9) + `~${shown(row.readPerTurn)}`.padStart(15));
  return 0;
}

export const actions: Record<string, Action> = {
  show: {
    describe: "print the turns and tokens of the window and of each child; with --json, as data",
    usage: "[--json] [<root>]",
    run: show,
  },
};
