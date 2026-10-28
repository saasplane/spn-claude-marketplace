// RESTATES: docs/04-capabilities/02-support/02-apps/06-tests/README.md § Kind decides the tier — the kind
// sits in the node's own `spkind.json`, and its runtime is the kind's second word.
//
// Which files the Surface check reads: a `.tsx` file in the `src/` of a node whose kind runs in a browser.
// The walk is spn-surface's own, because a plugin never imports a neighbour's file.
import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { read } from "../../../../plugin-support-lib/src/lib/source.ts";

const WEB_KINDS = new Set(["APP_WEB", "MODULE_WEB", "SUPPORT_WEB"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", ".nx", "coverage", ".output", "storybook-static"]);

const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };
const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };

/** Whether a path names a `.tsx` source file at all: the test the hook makes before it loads anything. */
export const isTsxSource = (path: string): boolean => {
  const normalized = path.split("\\").join("/");
  return normalized.endsWith(".tsx") && normalized.includes("/src/") && !/\.(spec|test)\.tsx$/.test(normalized);
};

/**
 * The `kind` of the nearest node manifest above a file, or null. The walk stops at the repository's
 * root, so a file outside every node borrows no kind from further up the machine.
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

/** A `.tsx` file in a web node's `src/`: the one place the Surface check reads. */
export const isWebSource = (path: string): boolean => isTsxSource(path) && WEB_KINDS.has(nodeKind(path) ?? "");

/** Every file under these roots, sorted, generated and vendored folders skipped. */
export function filesUnder(roots: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (isDir(full)) { if (!SKIP.has(entry)) walk(full); } else out.push(full);
    }
  };
  for (const root of roots) { if (isFile(root)) out.push(root); else walk(root); }
  return out.sort();
}
