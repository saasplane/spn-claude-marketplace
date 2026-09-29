#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § Code coverage is reported, never enforced
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// Refuses a write to a Jest or Vitest configuration that adds a coverage exclude with no comment
// giving its reason (conformance requirement 34). It reads no percentage: code coverage is measured
// and reported, never enforced (RD.SUPPORT.APPS.133).
//
//   hook :  coverage-excludes.ts --stdin
//   scan :  coverage-excludes.ts <path> …      (every exclude with no reason, in the files named)

import { basename } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { filesUnder, read, resultingText } from "../../../../../scripts/lib/source.ts";
import { excludesOf, isCodeConfig } from "../../lib/coverage-excludes.ts";

/** Whether this rule reads the file at all: a configuration that runs code. */
export const watched = (path: string): boolean => isCodeConfig(path);

/** Each exclude this write adds with no reason. One already on disk is not this write's to answer for. */
export function findings(before: string, after: string): string[] {
  const existing = new Set(excludesOf(before).map((one) => one.entry));
  return excludesOf(after)
    .filter((one) => !one.reasoned && !existing.has(one.entry))
    .map((one) => `the exclude \`${one.entry}\` carries no comment giving its reason`);
}

/** The verdict for one write, given its resulting text. Called by the tests subject. */
export function verdict(path: string, source: string | null, _added: string | null): Verdict {
  if (source === null || !watched(path)) return null;
  const found = findings(read(path) ?? "", source);
  if (!found.length) return null;
  return {
    deny: `A coverage exclude says why — ${basename(path)}:\n` +
      found.map((item) => `  - ${item}`).join("\n") +
      "\n  An exclude names code no automatic case can reach, such as a proof-of-person challenge or a " +
      "vendor round trip. Put a comment on its entry, or on the line above it, giving that reason, so a " +
      "reader can tell code that cannot be tested from code nobody tested (RD.SUPPORT.APPS.133).",
  };
}

export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  try { [source] = resultingText(input, path); } catch { source = input.content ?? null; }
  return verdict(path, source, null);
}

/**
 * The scan mode, argv (paths, never `--stdin`) to exit code. `commands/coverage/check.ts` calls
 * this directly once it has found the stack — the same function this file's own guard below runs
 * for the non-hook case, so a run through either door reads identically. One implementation only.
 */
export function scan(argv: string[]): number {
  let total = 0;
  for (const file of filesUnder(argv.length ? argv : ["."])) {
    if (!watched(file)) continue;
    for (const one of excludesOf(read(file) ?? "").filter((entry) => !entry.reasoned)) {
      total += 1;
      console.log(`${file}: the exclude \`${one.entry}\` carries no comment giving its reason`);
    }
  }
  console.log(`\n${total} finding(s) — an exclude with no reason`);
  return total ? 1 : 0;
}

if (runAlone("coverage-excludes.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  process.exit(scan(argv));
}
