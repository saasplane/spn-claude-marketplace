#!/usr/bin/env node
// RESTATES: RD.DEVEX.AGENT.107 — `spn-surface` checks Surface code as it is written, and in its first
// release every rule is a note. The rows each note restates sit in `_surface/notes.ts`.
//
// The TypeScript half of the Surface check: the reader (`_surface/jsx.ts`) over the text a write produces,
// the eight notes (`_surface/notes.ts`), and the one question the hook asks of them — which notes did
// THIS write bring. A note already true of the file before the write is not this write's, so an edit
// beside an old slip says nothing about it.
//
//   hook :  surface.ts --stdin          (PreToolUse JSON on stdin; a note, never a refusal)
//   scan :  surface.ts <path> …         (every `.tsx` in a web node's `src/`, whole files)
import { basename } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../plugin-support-lib/src/lib/payload.ts";
import { read, resultingText } from "../../../../../../plugin-support-lib/src/lib/source.ts";
import { filesUnder, isWebSource } from "../../../../scripts/lib/node.ts";
import { readJsx } from "./_surface/jsx.ts";
import { notesOf, type Finding } from "./_surface/notes.ts";

/** Every note a text gets. A text the reader cannot walk gets none: a check that cannot read allows. */
export function findings(source: string): Finding[] {
  try { return notesOf(source, readJsx(source)); } catch { return []; }
}

/**
 * The notes the text after a write holds that the text before it did not.
 *
 * Compared by key, as many of each as there were: a key names what a tag writes, never its line, so a
 * slip that an edit only moves is still the file's and not the write's.
 */
export function introduced(before: string | null, after: string): Finding[] {
  const seen = new Map<string, number>();
  for (const note of before ? findings(before) : []) seen.set(note.key, (seen.get(note.key) ?? 0) + 1);
  return findings(after).filter((note) => {
    const left = seen.get(note.key) ?? 0;
    if (left > 0) { seen.set(note.key, left - 1); return false; }
    return true;
  });
}

/** The verdict for one write: a note to the agent, or nothing. Called by the dispatcher and alone. */
export function validate(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!isWebSource(path)) return null;
  const [after] = resultingText(input, path);
  if (after === null) return null;
  const notes = introduced(read(path), after);
  if (!notes.length) return null;
  const lines = [`Surface check — ${notes.length === 1 ? "a note" : `${notes.length} notes`} on what this write adds to ${basename(path)}. Advice, never a refusal; each names its book row and the fix:`];
  for (const note of notes) lines.push(`  - line ${note.line}: ${note.text}`);
  return { note: lines.join("\n") };
}

/** Every note in every web source under these roots, whole files; prints them and a count by note. */
export function scan(paths: string[]): number {
  const counts = new Map<string, number>();
  let files = 0;
  for (const target of filesUnder(paths)) {
    if (!isWebSource(target)) continue;
    const source = read(target);
    if (source === null) continue;
    files += 1;
    for (const note of findings(source)) {
      counts.set(note.rule, (counts.get(note.rule) ?? 0) + 1);
      console.log(`${target}:${note.line}: [${note.rule}] ${note.text}`);
    }
  }
  console.log(`\n${files} file(s) read · ${[...counts.values()].reduce((a, b) => a + b, 0)} note(s)`);
  for (const [rule, count] of [...counts].sort()) console.log(`  ${rule.padEnd(26)} ${count}`);
  console.log("\nWhat it cannot see: a colour or a variant from a lookup, a ternary or a spread; a variant left to the place;"
    + " a status map in a `.ts` file or built by a `switch`; a view that spans files; whether a badge says a state or a kind.");
  return 0;
}

if (runAlone("surface.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? validate(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  process.exit(scan(argv.length ? argv : ["."]));
}
