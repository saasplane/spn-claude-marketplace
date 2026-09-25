#!/usr/bin/env node
// RESTATES: `spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md`
// § Restatement discipline — the `seen` hash and what it covers. The chapter is the source of truth.
//
// The `seen` hash, computed here because a plugin may not read another plugin's files.
//
// **THE SPELLING IS THE WHOLE POINT, SO IT IS STATED ONCE PER PLUGIN AND NEVER INVENTED.** Two
// plugins computing a hash differently would report drift against each other for files that agree,
// which is worse than not checking: a finding that is wrong teaches people to stop reading the run.
//
// **A PLUGIN IS INSTALLED ALONE.** `spn-devex` carries the same function in its own `lib/`, and
// importing across plugin folders would work in this checkout and break in every install — a
// partner holding `spn-apps` has no `spn-devex` directory beside it on disk.
//
// The two must agree byte for byte. `tests/t-stamp.mjs` hashes a fixture with both and fails if
// they differ, so the copy cannot drift silently.
import { createHash } from "node:crypto";

/**
 * Trailing whitespace and the blank lines at either end carry no meaning, so they carry no hash.
 *
 * An editor that strips a trailing space would otherwise re-stamp every citation in the corpus, and
 * a run whose findings are mostly noise is a run nobody reads.
 */
export function normalize(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, ""));
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.join("\n");
}

/** Eight hex characters — enough to name a version, short enough to read in a block. */
export function seenHash(text: string): string {
  return createHash("sha256").update(normalize(text), "utf8").digest("hex").slice(0, 8);
}
