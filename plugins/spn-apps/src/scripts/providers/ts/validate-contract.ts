#!/usr/bin/env node
// RESTATES: nothing. The rules are in `checks/contract/`, stated once and stack-free. This file
// parses TypeScript and runs them; it states no rule of its own.
//
// The contract subject, for TypeScript: read the resulting text once, then run every contract rule.
//
// **THE RULE IS THE DOMAIN'S AND THE PARSE IS THE STACK'S.** *A read verb is named for the list it
// returns* is true in any language. What a method signature LOOKS LIKE is TypeScript's business,
// and so is which files count as a contract here. Keeping the two apart is what lets a second
// stack join by adding a folder rather than by copying a rule.
//
// **PARSED ONCE, NOT ONCE PER RULE.** Each rule used to call `resultingText` itself, so one write
// read and masked the same file once per rule — at write time, which is where a person is waiting.
//
// **THE FIRST DENIAL WINS, AND A NOTE NEVER OUTRANKS ONE.** A person fixes one thing at a time, so
// four denials for one edit read as a broken gate rather than as four problems. Notes are collected
// only when nothing denied.
import type { ToolInput, Verdict } from "../../lib/payload.ts";
import { resultingText } from "../../lib/source.ts";
import { verdict as readVerbNaming, watched as readVerbWatched } from "../../checks/contract/read-verb-naming.ts";
import { verdict as enablementGrammar, watched as enablementWatched } from "../../checks/contract/enablement-grammar.ts";

/** One rule in this subject: what it looks at, and what it says once the text is parsed. */
type Bound = { name: string; watched: (path: string) => boolean; verdict: (path: string, source: string | null, added: string | null) => Verdict };

export const RULES: Bound[] = [
  { name: "read-verb-naming", watched: readVerbWatched, verdict: readVerbNaming },
  { name: "enablement-grammar", watched: (path) => path.endsWith(".ts") && enablementWatched(path), verdict: enablementGrammar },
];

/**
 * Run the contract subject against one write.
 *
 * **A RULE THAT THROWS IS SKIPPED, NEVER FATAL.** A subject that crashes takes every other rule in
 * the chain with it, which is worse than any single miss.
 */
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
