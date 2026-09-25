// Reading a source file the way a check has to read one: with its comments and strings masked out,
// with the write the caller is about to make already applied, and with the question *did THIS edit
// introduce it* answerable.
//
// THESE HELPERS USED TO LIVE IN `enablement-grammar.py`, and four sibling scripts reached into it
// with `importlib` to borrow them — each paying a second module load on top of its own interpreter
// start-up. They are shared code, and they sit in a shared file that says so in its name.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import type { ToolInput } from "./payload.ts";

export const SKIP = new Set([
  "node_modules", "dist", "build", ".git", ".nx", "coverage", ".output", "__pycache__",
]);

const COMMENT = "\x01";
const STRING = "\x02";

/** A file's text, or null. A file that cannot be read is never a finding. */
export function read(path: string): string | null {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

export function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}

export function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
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

/**
 * Whether THIS write is what puts the offending text there.
 *
 * Any substantial line of the offending region appearing in the added text is the signal. It keeps
 * a violation that was already elsewhere in the file from blocking an unrelated edit, without
 * letting a multi-line shape through merely because only one of its lines moved.
 */
export function introduced(source: string, region: [number, number], added: string | null): boolean {
  if (added === null) return true;
  for (const raw of source.slice(region[0], region[1]).split("\n")) {
    const line = raw.trim();
    if (line.length >= 6 && added.includes(line)) return true;
  }
  return false;
}

/** The 1-based line an offset falls on. */
export function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i += 1) if (source[i] === "\n") line += 1;
  return line;
}

/**
 * The `kind` of the nearest node manifest above a file, or null.
 *
 * A rule that governs servers must not fire in a browser package, and the manifest is the only
 * thing that says which a folder is.
 *
 * THE WALK STOPS AT THE REPOSITORY ROOT — a `sprepo.json` or a `.git` — so a file outside every node
 * answers null rather than borrowing a kind from somewhere further up the machine. Without that
 * stop, a fixture in a temporary directory inherits whatever node happens to sit above it.
 */
export function nodeKind(path: string): string | null {
  let here = dirname(resolve(path));
  for (;;) {
    const text = read(join(here, "spkind.json"));
    if (text !== null) {
      try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
    }
    if (isFile(join(here, "sprepo.json")) || isDir(join(here, ".git"))) return null;
    const up = dirname(here);
    if (up === here) return null;
    here = up;
  }
}

/**
 * Every file under these roots, sorted by full path, generated and vendored folders skipped.
 *
 * SORTED AS ONE LIST, not directory by directory. Each Python scan ends with `sorted(set(targets))`
 * over every path it collected, so `a/b/x.ts` comes before `a/c.ts` — where a pre-order walk yields
 * the files of `a` first and puts `a/c.ts` ahead. Both are deterministic and they are not the same
 * order, and a report is a list of paths, so the difference is visible in every line.
 */
export function filesUnder(roots: string[]): string[] {
  return [...walkUnsorted(roots)].sort();
}

function* walkUnsorted(roots: string[]): Generator<string> {
  for (const root of roots) {
    let stat;
    try { stat = statSync(root); } catch { continue; }
    if (stat.isFile()) { yield root; continue; }
    const walk = function* (dir: string): Generator<string> {
      let entries: string[];
      try { entries = readdirSync(dir).sort(); } catch { return; }
      const folders: string[] = [];
      for (const entry of entries) {
        const full = dir.endsWith("/") ? `${dir}${entry}` : `${dir}/${entry}`;
        let entryStat;
        try { entryStat = statSync(full); } catch { continue; }
        if (entryStat.isDirectory()) { if (!SKIP.has(entry)) folders.push(full); continue; }
        yield full;
      }
      // SORTED, DIRECTORIES INCLUDED. `os.walk` sorts nothing, so the Python's report order came
      // from the filesystem — finding F13 in the N2 arc, where a truncated table listed different
      // files on different machines.
      for (const folder of folders) yield* walk(folder);
    };
    yield* walk(root);
  }
}
