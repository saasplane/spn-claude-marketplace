#!/usr/bin/env node
// What the agent's machinery and its commands cost, read back from the telemetry log.
//
// `workspace timings --on` arms the recorder (a switch file under `.spndevex/.debug/`); every hook
// check, every plugin command and every Bash command the filter names then appends one line to
// `.spndevex/.debug/telemetry/hooks.jsonl` (`plugin-support-lib/src/lib/timing.ts`). This reads the
// log back, one row per `script` › `group` › `subgroup` › `action`: runs, total, median, p95, slowest,
// and failures (a non-zero `exit`; a hook check's null exit is never one).
//
//     spn-devex plugin timings [--json] [root]
//
// With no root, the workspace holding `.spndevex` is found by walking up from the current directory,
// the same walk every hook does. Quiet and exit 0 where the log does not exist — a switch left off is
// a fact about this session, not a finding. A line written before the levels existed reads under its
// `script` alone.

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";

type Span = {
  script: string; group: string | null; subgroup: string | null; action: string | null;
  ms: number; exit: number | null; at: string;
};

const text = (value: unknown) => (typeof value === "string" && value ? value : null);

/** Every span the log carries, oldest first, skipping a line the writer could not have produced. */
function readLog(root: string): Span[] {
  const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
  if (!existsSync(log) || !statSync(log).isFile()) return [];
  const out: Span[] = [];
  for (const line of readFileSync(log, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (typeof parsed.script === "string" && typeof parsed.ms === "number")
        out.push({ script: parsed.script, group: text(parsed.group), subgroup: text(parsed.subgroup), action: text(parsed.action),
                   ms: parsed.ms, exit: typeof parsed.exit === "number" ? parsed.exit : null, at: String(parsed.at ?? "") });
    } catch { /* a torn last line from a truncated write is skipped, not a crash */ }
  }
  return out;
}

const round = (ms: number) => Math.round(ms * 100) / 100;

/** The middle value. Even counts average the two middle spans, which is what a two-run sample needs. */
function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type Row = {
  script: string; group: string | null; subgroup: string | null; action: string | null;
  runs: number; totalMs: number; medianMs: number; p95Ms: number; slowestMs: number; failures: number; lastAt: string;
};

/**
 * One row per script › group › subgroup › action. The rows of one script sit together, the script
 * with the largest total first, and inside a script the largest total first — the costliest first,
 * which is what a reading tells you first.
 */
export function summarize(spans: Array<Partial<Span> & { script: string; ms: number }>): Row[] {
  const byName = new Map<string, Array<Partial<Span> & { script: string; ms: number }>>();
  for (const span of spans) {
    const key = JSON.stringify([span.script, span.group ?? null, span.subgroup ?? null, span.action ?? null]);
    byName.set(key, [...(byName.get(key) ?? []), span]);
  }
  const rows: Row[] = [];
  for (const [key, group] of byName) {
    const [script, levelOne, levelTwo, action] = JSON.parse(key) as [string, string | null, string | null, string | null];
    const ms = group.map((s) => s.ms).sort((a, b) => a - b);
    // Nearest rank: the smallest value at or above 95 in every 100.
    const p95 = ms[Math.max(0, Math.ceil(ms.length * 0.95) - 1)];
    rows.push({
      script, group: levelOne, subgroup: levelTwo, action, runs: group.length,
      totalMs: round(ms.reduce((sum, one) => sum + one, 0)), medianMs: round(median(ms)), p95Ms: p95, slowestMs: ms[ms.length - 1],
      failures: group.filter((s) => typeof s.exit === "number" && s.exit !== 0).length,
      lastAt: group.map((s) => String(s.at ?? "")).sort().at(-1) ?? "",
    });
  }
  const scriptTotal = new Map<string, number>();
  for (const row of rows) scriptTotal.set(row.script, (scriptTotal.get(row.script) ?? 0) + row.totalMs);
  return rows.sort((a, b) =>
    (scriptTotal.get(b.script)! - scriptTotal.get(a.script)!) || a.script.localeCompare(b.script) || (b.totalMs - a.totalMs));
}

/** A duration as a person reads it: milliseconds below a second, seconds above. */
function shown(ms: number): string {
  return ms >= 1000 ? `${round(ms / 1000)}s` : `${round(ms)}ms`;
}

export const describe = "what each script › group › subgroup › action cost — runs, total, median, p95, slowest, failures — read from the telemetry log";

export function run(args: string[]): number {
  const json = args.includes("--json");
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? workspaceRoot(process.cwd()) ?? process.cwd());
  const spans = readLog(root);
  if (spans.length === 0) {
    if (json) console.log(JSON.stringify({ root, spans: 0, rows: [] }, null, 2));
    else console.log(`no telemetry at ${join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl")} — run \`workspace timings --on\` first, or nothing has run since`);
    return 0;
  }
  const rows = summarize(spans);
  if (json) { console.log(JSON.stringify({ root, spans: spans.length, rows }, null, 2)); return 0; }
  console.log(`${spans.length} span(s) from ${root}\n`);
  console.log("Run".padEnd(44) + "Runs".padStart(6) + "Total".padStart(10) + "Median".padStart(10) + "p95".padStart(10) +
    "Slowest".padStart(10) + "Failures".padStart(10));
  let script = "";
  for (const row of rows) {
    if (row.script !== script) { script = row.script; console.log(script); }
    const name = [row.group, row.subgroup, row.action].filter(Boolean).join(" ") || "(no level)";
    console.log(`  ${name}`.padEnd(44) + String(row.runs).padStart(6) + shown(row.totalMs).padStart(10) + shown(row.medianMs).padStart(10) +
      shown(row.p95Ms).padStart(10) + shown(row.slowestMs).padStart(10) + String(row.failures).padStart(10));
  }
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
