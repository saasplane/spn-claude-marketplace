#!/usr/bin/env node
// What a hook actually costs, read back from what `lib/timing.ts` recorded.
//
// `workspace timings --on` arms the recorder (a switch file under `.spndevex/.debug/`); every hook
// and CLI call already times itself under `begin()`/`record()`/`end()` and appends one line per span
// to `.spndevex/.debug/telemetry/hooks.jsonl` once the switch is present. This reads that log back —
// the per-script median, which is what `N101` measured to justify a bundle over a `.ts` source.
//
//     spn-devex plugin timings [--json] [root]
//
// With no root, the workspace holding `.spndevex` is found by walking up from the current directory,
// the same walk every hook does. Quiet and exit 0 where the log does not exist — a switch left off is
// a fact about this session, not a finding.

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Span = { script: string; ms: number; event: unknown; tool: unknown; at: string };

function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, ".spndevex"))) return path;
      const up = dirname(path);
      if (up === path) return null;
      path = up;
    }
  } catch { return null; }
}

/** Every span the log carries, oldest first, skipping a line the writer could not have produced. */
function readLog(root: string): Span[] {
  const log = join(root, ".spndevex", ".debug", "telemetry", "hooks.jsonl");
  if (!existsSync(log) || !statSync(log).isFile()) return [];
  const out: Span[] = [];
  for (const line of readFileSync(log, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as Partial<Span>;
      if (typeof parsed.script === "string" && typeof parsed.ms === "number")
        out.push({ script: parsed.script, ms: parsed.ms, event: parsed.event ?? null, tool: parsed.tool ?? null, at: String(parsed.at ?? "") });
    } catch { /* a torn last line from a truncated write is skipped, not a crash */ }
  }
  return out;
}

/** The middle value. Even counts average the two middle spans, which is what a two-run sample needs. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type Row = { script: string; runs: number; medianMs: number; p90Ms: number; lastAt: string };

/** One row per script name, sorted by median falling — the costliest first, which is what a reading tells you first. */
export function summarize(spans: Span[]): Row[] {
  const byScript = new Map<string, Span[]>();
  for (const span of spans) byScript.set(span.script, [...(byScript.get(span.script) ?? []), span]);
  const rows: Row[] = [];
  for (const [script, group] of byScript) {
    const ms = group.map((s) => s.ms).sort((a, b) => a - b);
    const p90 = ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.9))];
    const lastAt = group.map((s) => s.at).sort().at(-1) ?? "";
    rows.push({ script, runs: group.length, medianMs: Math.round(median(ms) * 100) / 100, p90Ms: p90, lastAt });
  }
  return rows.sort((a, b) => b.medianMs - a.medianMs);
}

export const describe = "the per-script median a hook or a command cost, read from the telemetry log";

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
  console.log("Run".padEnd(28) + "Runs".padStart(7) + "Median".padStart(11) + "p90".padStart(11) + "  Last");
  for (const row of rows)
    console.log(row.script.padEnd(28) + String(row.runs).padStart(7) + `${row.medianMs}ms`.padStart(11) + `${row.p90Ms}ms`.padStart(11) + `  ${row.lastAt}`);
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
