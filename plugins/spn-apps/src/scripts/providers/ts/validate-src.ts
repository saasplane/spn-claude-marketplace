#!/usr/bin/env node
// RESTATES: nothing. The rules are in `checks/src/`, stated once and stack-free.
//
// The src subject, for TypeScript: read the resulting text once, then run every src rule.
//
// **THE SAME ARGUMENT AS THE CONTRACT SUBJECT, ONE AXIS OVER.** *Await is how you sequence work on
// the server* is a rule about the code a person writes; what an await LOOKS LIKE is TypeScript's.
//
// **THE SUBJECT IS SEPARATE BECAUSE THE FILES ARE.** A contract file and an ordinary source file
// are read for different things, and one subject over both would make every finding say the wrong
// thing about half its inputs.
import type { ToolInput, Verdict } from "../../lib/payload.ts";
import { resultingText } from "../../lib/source.ts";
import { verdict as awaitSequencing, watched as awaitWatched } from "../../checks/src/await-sequencing.ts";

type Bound = { name: string; watched: (path: string) => boolean; verdict: (path: string, source: string | null, added: string | null) => Verdict };

export const RULES: Bound[] = [
  { name: "await-sequencing", watched: awaitWatched, verdict: awaitSequencing },
];

export function validate(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  const applies = RULES.filter((rule) => { try { return rule.watched(path); } catch { return false; } });
  if (!applies.length) return null;

  let source: string | null;
  let added: string | null;
  try {
    [source, added] = resultingText(input, path);
  } catch {
    source = added = input.content ?? input.new_string ?? null;
  }
  if (source === null) return null;

  // EVERY NOTE THIS SUBJECT RAISES, NOT THE FIRST. A note is advice and several can be true at
  // once; a denial is the answer and there is only ever one.
  const notes: string[] = [];
  for (const rule of applies) {
    let found: Verdict = null;
    try { found = rule.verdict(path, source, added); } catch { continue; }
    if (found?.deny) return found;
    if (found?.note) notes.push(found.note);
  }
  return notes.length ? { note: notes.join("\n\n") } : null;
}
