// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript (RD.DEVEX.AGENT.082). The chapter is the source of truth; a rule
// change is edited there first, then here, in the same change.
//
// What a target cost, read from `usage.jsonl` alone, each reply once by its `turn`; no transcript is read.
//
//     all                     one row for each workstream
//     <workstream>            one row for each arc
//     <workstream>/N<nnn>     one row for each row and order
//     window/<session>        the window, and one row for each child by its `agent`
//     window/this             the same, for the window the command runs in

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { UsageFault } from "../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, sessionDir, telemetryFolder } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { priceOf } from "./model-prices.ts";
import { USAGE_LOG } from "./usage.ts";

/** What one group of replies cost. `money` is null where any of its replies ran on a model the price table lacks. */
export type CostRow = {
  key: string; replies: number; input: number; cacheRead: number; cacheWrite: number; output: number;
  modelMs: number; models: string[]; money: number | null;
};

type Line = {
  at: string | null; session: string | null; agent: string | null; workstream: string | null; arc: string | null;
  order: string | null; row: string | null; turn: string | null; model: string | null; ms: number;
  input: number; cacheRead: number; cacheWrite: number; output: number;
};

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** Every usage line, rotated log first and live log second, each reply once; a line the writer could not have produced is skipped. */
function readLines(root: string): Line[] {
  const seen = new Set<string>();
  const lines: Line[] = [];
  for (const file of logFiles(join(telemetryFolder(root), USAGE_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const turn = text(one.turn);
        if (turn) { if (seen.has(turn)) continue; seen.add(turn); }
        lines.push({ at: text(one.at), session: text(one.session), agent: text(one.agent), workstream: text(one.workstream),
          arc: text(one.arc), order: text(one.order), row: text(one.row), turn, model: text(one.model), ms: count(one.ms),
          input: count(one.input), cacheRead: count(one.cache_read), cacheWrite: count(one.cache_write), output: count(one.output) });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return lines;
}

/** The session id as its folder spells it, so an id typed or tagged with a character the folder drops still matches. */
const folderOf = (root: string, session: string): string => basename(sessionDir(root, session));

/** The window whose command is this invocation: the newest start file, under any window's `pending/`, whose reading is `debug cost show` with this target. */
function windowRunning(root: string, target: string): string {
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
          const mine = (started.found ?? []).some((one) => one.script === "spn-devex" && one.group === "debug" && one.subgroup === "cost"
            && one.action === "show" && typeof one.args === "string" && one.args.split(/\s+/).includes(target));
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
    const session = folderOf(root, window[1] === "this" ? windowRunning(root, target) : window[1]);
    const mine = lines.filter((one) => one.session !== null && folderOf(root, one.session) === session);
    return { rows: group(mine, (one) => (one.agent ? `child ${one.agent}` : "window")), earliest };
  }
  if (target === "all") return { rows: group(lines, (one) => one.workstream ?? "(no workstream)"), earliest };
  const arc = /^(.+)\/(N\d+[a-z]?)$/i.exec(target);
  if (arc) {
    const mine = lines.filter((one) => isWorkstream(one.workstream, arc[1]) && one.arc?.toUpperCase() === arc[2].toUpperCase());
    return { rows: group(mine, (one) => [one.row ? `row ${one.row}` : null, one.order ? `order ${one.order}` : null].filter(Boolean).join(" · ") || "(no row or order)"), earliest };
  }
  const mine = lines.filter((one) => isWorkstream(one.workstream, target));
  return { rows: group(mine, (one) => one.arc ?? "(no arc)"), earliest };
}
