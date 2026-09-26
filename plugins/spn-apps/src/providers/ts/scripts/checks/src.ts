#!/usr/bin/env node
// RESTATES: nothing. It is the TypeScript half of the `src` subject — the parse, the order, and the
// rules that read what the parse produced. Every rule it runs sits beside it in this folder.
//
// **THE SUBJECT IS `src`, AND `contract` IS NOT A PEER OF IT.** Every rule below watches a path
// UNDER `src/` — `/src/contract/services/` for the read-verb rule, `app/utils/authz.ts` and the
// seeds and services for the enablement rule, any `.ts` under `/src/` for await sequencing. While
// `contract` was a subject of its own, a write to `src/contract/services/Foo.ts` matched both and
// the file was read and masked TWICE, at write time, where a person is waiting. That is the waste
// the next paragraph exists to prevent, arriving one level up from where it was being prevented.
//
// **PARSED ONCE, NOT ONCE PER RULE.** Each rule used to call `resultingText` itself, so one write
// read and masked the same file once per rule.
//
// **WHICH RULES APPLY IS DECIDED BY THE PATH AND THE KIND, NEVER BY A SUBJECT NAME.** `watched`
// reads the path alone, and `await-sequencing` narrows further to a node whose kind names the
// server runtime. A subject that grouped rules by folder was standing in for both.
//
// **THE FIRST DENIAL WINS, AND A NOTE NEVER OUTRANKS ONE.** A person fixes one thing at a time, so
// four denials for one edit read as a broken gate rather than as four problems. Notes are collected
// only when nothing denied.
import type { ToolInput, Verdict } from "../../../../scripts/lib/payload.ts";
import { resultingText } from "../../../../scripts/lib/source.ts";
import { verdict as readVerbNaming, watched as readVerbWatched } from "./read-verb-naming.ts";
import { verdict as enablementGrammar, watched as enablementWatched } from "./enablement-grammar.ts";
import { verdict as awaitSequencing, watched as awaitWatched } from "./await-sequencing.ts";

/** One rule in this subject: what it looks at, and what it says once the text is parsed. */
type Bound = { name: string; watched: (path: string) => boolean; verdict: (path: string, source: string | null, added: string | null) => Verdict };

export const RULES: Bound[] = [
  { name: "read-verb-naming", watched: readVerbWatched, verdict: readVerbNaming },
  { name: "enablement-grammar", watched: (path) => path.endsWith(".ts") && enablementWatched(path), verdict: enablementGrammar },
  { name: "await-sequencing", watched: awaitWatched, verdict: awaitSequencing },
];

/**
 * Run the `src` subject against one write.
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
