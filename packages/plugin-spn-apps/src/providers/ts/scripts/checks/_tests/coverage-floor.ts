#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § A code-coverage floor is measured, and it only rises
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// Refuses a write to a Jest or Vitest configuration that lowers a coverage floor, or that adds an
// exclude with no comment giving its reason. The floor script writes the file directly, so what
// reaches this check is a person's edit.
//
//   hook :  coverage-floor.ts --stdin
//   scan :  coverage-floor.ts <path> …      (every exclude with no reason, in the files named)

import { basename } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { filesUnder, read, resultingText } from "../../../../../scripts/lib/source.ts";
import { MEASURES, excludesOf, floorOf, isDated, isFloorConfig } from "../../lib/floors.ts";

/** Whether this rule reads the file at all: a configuration that runs code. */
export const watched = (path: string): boolean => isFloorConfig(path);

/** What this write does wrong, judged against the file as it stands on disk. */
export function findings(before: string, after: string): string[] {
  const found: string[] = [];
  const was = floorOf(before);
  const now = floorOf(after);
  // An undated floor is a guess nobody measured; its first measurement may replace it either way,
  // so a lowering is refused only once the floor it lowers carries the dated comment.
  if (isDated(before)) {
    for (const measure of MEASURES) {
      if (was[measure] === undefined) continue;
      const next = now[measure] ?? 0;
      if (next < (was[measure] as number)) {
        found.push(`${measure} falls from ${was[measure]} to ${now[measure] ?? "nothing"}`);
      }
    }
  }
  const existing = new Set(excludesOf(before).map((one) => one.entry));
  for (const one of excludesOf(after)) {
    if (!one.reasoned && !existing.has(one.entry)) found.push(`the exclude \`${one.entry}\` carries no comment giving its reason`);
  }
  return found;
}

/** The verdict for one write, given its resulting text. Called by the tests subject. */
export function verdict(path: string, source: string | null, _added: string | null): Verdict {
  if (source === null || !watched(path)) return null;
  const found = findings(read(path) ?? "", source);
  if (!found.length) return null;
  return {
    deny: `A coverage floor rises and never falls, and an exclude says why — ${basename(path)}:\n` +
      found.map((item) => `  - ${item}`).join("\n") +
      "\n  A floor is raised by the floor script after a run, to what the run measured; it is never typed " +
      "down. To lower one, the code has to be covered or excluded: an exclude names the code a case " +
      "cannot reach, with a comment on its entry giving the reason (RD.APPS.133).",
  };
}

export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  try { [source] = resultingText(input, path); } catch { source = input.content ?? null; }
  return verdict(path, source, null);
}

if (runAlone("coverage-floor.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  let total = 0;
  for (const file of filesUnder(argv.length ? argv : ["."])) {
    if (!watched(file)) continue;
    for (const one of excludesOf(read(file) ?? "").filter((entry) => !entry.reasoned)) {
      total += 1;
      console.log(`${file}: the exclude \`${one.entry}\` carries no comment giving its reason`);
    }
  }
  console.log(`\n${total} finding(s) — an exclude with no reason`);
  process.exit(total ? 1 : 0);
}
