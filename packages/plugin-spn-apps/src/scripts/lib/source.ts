// Reading a source file the way an apps check has to read one: the folders it skips, the node it sits
// in, the files under a root, and the question *did THIS edit introduce it*. The masker, the resulting
// text of a write and the file read are shared with spn-surface, so they live in
// `plugin-support-lib/src/lib/source.ts`.

import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { read } from "../../../../plugin-support-lib/src/lib/source.ts";

export const SKIP = new Set([
  "node_modules", "dist", "build", ".git", ".nx", "coverage", ".output", "__pycache__",
]);

export function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}

export function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
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
