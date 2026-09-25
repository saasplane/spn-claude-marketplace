#!/usr/bin/env node
// RESTATES: nothing. The rules are in `checks/tests/`, stated once and stack-free.
//
// The tests subject, for TypeScript: read the resulting text once, then run every tests rule.
//
// **THIS IS THE SUBJECT THE PARSE-ONCE SPLIT BUYS MOST.** Four rules look at a test file — the
// assertion message, the anchored host pattern, and the coverage checks — and each one used to
// read and mask it for itself.
//
// **COVERAGE IS SEVERAL RULES BEHIND ONE MODULE**, so it is expanded here rather than counted as
// one. A reader of this list sees what actually runs.
import type { ToolInput, Verdict } from "../../lib/payload.ts";
import { resultingText } from "../../lib/source.ts";
import { verdict as assertionMessage, watched as assertionWatched } from "../../checks/tests/assertion-message.ts";
import { verdict as hostAssertion, watched as hostWatched } from "../../checks/tests/host-assertion.ts";
import { CHECKS as COVERAGE, verdict as coverage, watched as coverageWatched } from "../../checks/tests/coverage.ts";

type Bound = { name: string; watched: (path: string) => boolean; verdict: (path: string, source: string | null, added: string | null) => Verdict };

export const RULES: Bound[] = [
  { name: "assertion-message", watched: assertionWatched, verdict: assertionMessage },
  { name: "host-assertion", watched: hostWatched, verdict: hostAssertion },
  ...Object.keys(COVERAGE).map((name) => ({
    name: `coverage:${name}`,
    watched: coverageWatched,
    verdict: (path: string, source: string | null, added: string | null) => coverage(name, path, source, added),
  })),
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
