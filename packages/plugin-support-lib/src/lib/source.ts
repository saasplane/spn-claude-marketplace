// Reading a source file the way a check has to read one: with its comments and strings masked out,
// and with the write the caller is about to make already applied. This file lives once, in the shared
// support-lib folder; spn-apps and spn-surface each import it by relative path, and the build copies
// it into each installed plugin's own bundle, so no plugin reads a neighbour's file.
//
// THESE HELPERS USED TO LIVE IN `enablement-grammar.py`, and four sibling scripts reached into it
// with `importlib` to borrow them — each paying a second module load on top of its own interpreter
// start-up. They are shared code, and they sit in a shared file that says so in its name.

import { readFileSync } from "node:fs";

import type { ToolInput } from "./payload.ts";

const COMMENT = "\x01";
const STRING = "\x02";

/** A file's text, or null. A file that cannot be read is never a finding. */
export function read(path: string): string | null {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

/**
 * Same-length text with comment bodies and string bodies blanked.
 *
 * Brace matching and key detection run over this, so a `{` inside a comment or a SQL string can
 * never move the parser. NEWLINES SURVIVE, so line numbers still line up with the real source and
 * an offset taken here can be used against the original.
 */
export function mask(source: string): string {
  // SPLIT BY UTF-16 UNIT, NOT BY CODE POINT. `[...source]` iterates code points while `source[i]`
  // and `source.length` index UTF-16 units, so one emoji anywhere in the file slides the two out of
  // step and the mask lands on the wrong characters from there on. Python has no such split — its
  // strings are code points throughout — which is why this had to be found by diffing real files
  // rather than reasoned about. A non-BMP character inside a masked region becomes two placeholders
  // where Python writes one; nothing reads a placeholder's identity, and keeping the length equal to
  // the source is what lets an offset taken here be used against the original.
  const out = source.split("");
  const n = source.length;
  let i = 0;
  while (i < n) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      while (i < n && source[i] !== "\n") { out[i] = COMMENT; i += 1; }
    } else if (two === "/*") {
      while (i < n && source.slice(i, i + 2) !== "*/") {
        if (source[i] !== "\n") out[i] = COMMENT;
        i += 1;
      }
      for (let j = i; j < Math.min(i + 2, n); j += 1) out[j] = COMMENT;
      i += 2;
    } else if (source[i] === "'" || source[i] === '"' || source[i] === "`") {
      const quote = source[i];
      i += 1;
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") {
          if (source[i] !== "\n") out[i] = STRING;
          i += 1;
          if (i < n) {
            if (source[i] !== "\n") out[i] = STRING;
            i += 1;
          }
          continue;
        }
        if (source[i] !== "\n") out[i] = STRING;
        i += 1;
      }
      i += 1;
    } else {
      i += 1;
    }
  }
  return out.join("");
}

export function inComment(masked: string, index: number): boolean {
  return index >= 0 && index < masked.length && masked[index] === COMMENT;
}

/**
 * The text the write would PRODUCE, and the text it ADDS.
 *
 * A Write carries the whole file. An Edit carries only its replacement, so the replacement is
 * applied to what is on disk — SCORING THE FRAGMENT ALONE IS HOW A HOOK REPORTS GREEN HAVING
 * CHECKED NOTHING, because half a signature parses as no signature.
 */
export function resultingText(input: ToolInput, path: string): [string | null, string | null] {
  const content = input.content;
  if (content !== undefined && content !== null) return [content, content];
  const fragment = input.new_string;
  if (fragment === undefined || fragment === null) return [null, null];
  const disk = read(path);
  if (disk === null) return [fragment, fragment];
  const old = input.old_string;
  if (old && disk.includes(old)) {
    const produced = input.replace_all ? disk.split(old).join(fragment) : disk.replace(old, fragment);
    return [produced, fragment];
  }
  return [`${disk}\n${fragment}`, fragment];
}
