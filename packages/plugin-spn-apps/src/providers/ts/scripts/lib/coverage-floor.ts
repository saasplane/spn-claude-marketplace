#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § A code-coverage floor is measured, and it only rises
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// Raise each coverage floor in a project's own configuration to what its last run measured.
//
//     node coverage-floor.ts [--write] <project> …
//
// For each Jest or Vitest configuration in a project it reads the `coverage-summary.json` in the
// directory that configuration names, and sets each of the four numbers to the measured value
// rounded down, with the date of the measurement in a comment. It never lowers a number. A
// Playwright configuration is never read. Without `--write` it says what it would change.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { read } from "../../../../scripts/lib/source.ts";
import { MEASURES, floorBlock, floorOf, isDated, isFloorConfig } from "./floors.ts";
import type { Floor, Measure } from "./floors.ts";

/** The comment a raised floor carries. The date is the measurement's, never the moment the script ran. */
const COMMENT = /\/\/ Coverage floor measured \d{4}-\d{2}-\d{2}[^\n]*\n/;
const commentFor = (date: string): string =>
  `// Coverage floor measured ${date} by the spn-apps floor script — it rises and never falls (RD.SUPPORT.APPS.133).`;

export type Outcome = {
  config: string;
  /** What happened, in one sentence a person reads. */
  said: string;
  changed: boolean;
  text?: string;
};

/** The coverage directory a configuration names, relative to its project, or the tool's default. */
const coverageDirOf = (text: string): string =>
  (text.match(/\b(?:coverageDirectory|reportsDirectory)\s*:\s*(['"`])([^'"`]+)\1/)?.[2]) ?? "coverage";

/** The four totals a run measured, as its `json-summary` reporter wrote them, and the day it wrote them. */
function measured(summaryPath: string): { totals: Floor; date: string } | null {
  const text = read(summaryPath);
  if (text === null) return null;
  try {
    const total = (JSON.parse(text) as { total?: Record<string, { pct?: number }> }).total ?? {};
    const totals: Floor = {};
    for (const measure of MEASURES) {
      const pct = total[measure]?.pct;
      if (typeof pct === "number") totals[measure] = pct;
    }
    return { totals: totals, date: statSync(summaryPath).mtime.toISOString().slice(0, 10) };
  } catch { return null; }
}

/** The configuration's text with the floor set to `next`, and the dated comment above it. */
function rewritten(text: string, next: Required<Floor>, date: string): string | null {
  const numbers = (indent: string) =>
    MEASURES.map((measure) => `${indent}${measure}: ${next[measure]},`).join("\n");
  const block = floorBlock(text);
  if (block !== null) {
    let body = text.slice(block.start, block.end);
    for (const measure of MEASURES) {
      const key = new RegExp(`\\b${measure}\\s*:\\s*\\d+(?:\\.\\d+)?`);
      body = key.test(body) ? body.replace(key, `${measure}: ${next[measure]}`) : body.replace(/\}$/, ` ${measure}: ${next[measure]} }`);
    }
    let out = text.slice(0, block.start) + body + text.slice(block.end);
    const lineStart = out.lastIndexOf("\n", out.search(/\b(coverageThreshold|thresholds)\s*:/)) + 1;
    const indent = out.slice(lineStart).match(/^\s*/)?.[0] ?? "";
    const before = out.slice(0, lineStart);
    const previous = before.slice(before.lastIndexOf("\n", before.length - 2) + 1);
    if (COMMENT.test(previous)) out = before.slice(0, before.length - previous.length) + `${indent}${commentFor(date)}\n` + out.slice(lineStart);
    else out = before + `${indent}${commentFor(date)}\n` + out.slice(lineStart);
    return out;
  }
  // No floor yet. Jest takes one beside the other root keys; Vitest takes one inside `coverage`.
  const jest = text.search(/module\.exports\s*=\s*\{/);
  if (jest >= 0 && !/vitest/.test(text)) {
    const at = text.indexOf("{", jest) + 1;
    return text.slice(0, at) + `\n  ${commentFor(date)}\n  coverageThreshold: {\n    global: {\n${numbers("      ")}\n    },\n  },` + text.slice(at);
  }
  const coverage = text.search(/\bcoverage\s*:\s*\{/);
  if (coverage >= 0) {
    const at = text.indexOf("{", coverage) + 1;
    const indent = (text.slice(text.lastIndexOf("\n", coverage) + 1).match(/^\s*/)?.[0] ?? "") + "  ";
    return text.slice(0, at) + `\n${indent}${commentFor(date)}\n${indent}thresholds: {\n${numbers(indent + "  ")}\n${indent}},` + text.slice(at);
  }
  return null;
}

/** What one project's configurations become, given what their runs measured. */
export function raiseFloors(project: string): Outcome[] {
  const outcomes: Outcome[] = [];
  let entries: string[];
  try { entries = readdirSync(project).sort(); } catch { return outcomes; }
  const configs = entries.filter(isFloorConfig).map((entry) => join(project, entry));
  const byDir = new Map<string, string[]>();
  for (const config of configs) {
    const dir = resolve(project, coverageDirOf(read(config) ?? ""));
    byDir.set(dir, [...(byDir.get(dir) ?? []), config]);
  }
  for (const config of configs) {
    const text = read(config) ?? "";
    const dir = resolve(project, coverageDirOf(text));
    const name = relative(process.cwd(), config);
    if ((byDir.get(dir) ?? []).length > 1) {
      outcomes.push({ config: name, changed: false, said: `shares ${relative(process.cwd(), dir)} with another configuration, so its measurement cannot be told apart — give each tier its own coverageDirectory` });
      continue;
    }
    const run = measured(join(dir, "coverage-summary.json"));
    if (run === null) {
      outcomes.push({ config: name, changed: false, said: `no coverage-summary.json in ${relative(process.cwd(), dir)} — run the tier with coverage collected first` });
      continue;
    }
    const was = floorOf(text);
    const dated = isDated(text);
    const next = {} as Required<Floor>;
    const below: string[] = [];
    for (const measure of MEASURES as readonly Measure[]) {
      const measuredFloor = Math.floor(run.totals[measure] ?? 0);
      const current = was[measure] ?? 0;
      // An undated floor is a guess nobody measured: its first measurement replaces it, up or down.
      // Once a floor is dated, it only ever rises.
      next[measure] = dated ? Math.max(current, measuredFloor) : measuredFloor;
      if (dated && measuredFloor < current) below.push(`${measure} ${run.totals[measure]} under ${current}`);
    }
    const same = MEASURES.every((measure) => was[measure] === next[measure]);
    const fall = below.length ? ` The run falls below the floor (${below.join(" · ")}), and the floor stays.` : "";
    if (same) {
      outcomes.push({ config: name, changed: false, said: `floor already ${MEASURES.map((m) => next[m]).join("/")}.${fall}` });
      continue;
    }
    const out = rewritten(text, next, run.date);
    if (out === null) {
      outcomes.push({ config: name, changed: false, said: "carries no seat for a floor — add coverage.thresholds inside its coverage block" });
      continue;
    }
    outcomes.push({ config: name, changed: true, text: out,
      said: `${MEASURES.map((m) => was[m] ?? "—").join("/")} → ${MEASURES.map((m) => next[m]).join("/")}, measured ${run.date}.${fall}` });
  }
  return outcomes;
}

/**
 * The whole CLI, argv to exit code. `commands/coverage/floor.ts` calls this directly once it has
 * found the stack — the same function this file's own guard below runs, so a run through either
 * door reads and writes identically. One implementation only.
 */
export function cli(argv: string[]): number {
  const write = argv.includes("--write");
  const projects = argv.filter((a) => !a.startsWith("--"));
  if (projects.length === 0) {
    process.stderr.write("usage: coverage-floor.ts [--write] <project> …\n");
    return 2;
  }
  let changed = 0;
  for (const project of projects) {
    for (const outcome of raiseFloors(resolve(project))) {
      if (outcome.changed) {
        changed += 1;
        if (write) writeFileSync(resolve(outcome.config), outcome.text ?? "", "utf8");
      }
      console.log(`  ${outcome.changed ? (write ? "raised " : "would raise ") : "left   "} ${outcome.config}  ${outcome.said}`);
    }
  }
  console.log(`\n${changed} floor(s) ${write ? "raised" : "would rise — pass --write"}`);
  return 0;
}

if (process.argv[1]?.endsWith("coverage-floor.ts")) {
  process.exit(cli(process.argv.slice(2)));
}
