// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The change sheet is the arc's data
//           RULE.DEVEX.WORKSPACE.490, the plugin's templates are the book's, copied
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The generated copies of a changed book file, so a change sheet names every file the build will move (s59):
//   - each ref or skill step of the plugins that restates the file (its `spn:restates` block cites the book path),
//   - the plugins' rules index, `refs/rules.json`, when the file states a rule,
//   - for a template, the plugin's copy of it, and the templates folder's `README.md` and `index.md`.
// A workspace with no marketplace checkout beside it has no copies to name.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BOOK_TEMPLATES, PLUGIN_TEMPLATES } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** The repository that holds the plugins. */
export const PLUGINS_REPO = "spn-claude-marketplace";
/** The repository that holds the book. */
export const BOOK_REPO = "spn-foundation";
const TEMPLATES_IN_BOOK = `${BOOK_TEMPLATES}/`;
const TEMPLATES_IN_PLUGIN = `packages/plugin-spn-devex/src/${PLUGIN_TEMPLATES}/`;
const RULES_INDEX = "packages/plugin-spn-devex/src/refs/rules.json";

/** The markdown files under a folder, as paths from it; nothing where the folder is not there. */
function markdownUnder(dir: string, from = ""): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort().flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) return [];
    try { return statSync(full).isDirectory() ? markdownUnder(full, `${from}${name}/`) : name.endsWith(".md") ? [`${from}${name}`] : []; } catch { return []; }
  });
}

/** Whether the first part of a file cites a book path in its restates block or its RESTATES header. */
function cites(file: string, path: string): boolean {
  try { return readFileSync(file, "utf8").slice(0, 6000).includes(`${BOOK_REPO}/${path}`) || readFileSync(file, "utf8").slice(0, 600).includes(`${BOOK_REPO} ${path}`); }
  catch { return false; }
}

/** Whether a book file states a rule; true where it cannot be read, because a rule index missing from a sheet costs more than one named too often. */
function statesRules(root: string, path: string): boolean {
  for (const dir of [join(root, BOOK_REPO)]) {
    try { return /RULE\.[A-Z_]+\.[A-Z_]+\.\d{3}/.test(readFileSync(join(dir, path), "utf8")); } catch { /* try the next */ }
  }
  return true;
}

/**
 * The generated copies of a changed book file, each as `<repository>:<path>`: empty for a file that is not the book's, a book file
 * that is not a document, or a workspace with no plugins checkout.
 */
export function generatedCopiesOf(root: string, entryFile: string): string[] {
  const at = entryFile.indexOf(":");
  const repo = entryFile.slice(0, at), path = entryFile.slice(at + 1);
  if (repo !== BOOK_REPO || !path.startsWith("docs/") || !path.endsWith(".md")) return [];
  const plugins = join(root, PLUGINS_REPO);
  if (!existsSync(plugins)) return [];
  const out = new Set<string>();
  if (path.startsWith(TEMPLATES_IN_BOOK)) {
    out.add(`${PLUGINS_REPO}:${TEMPLATES_IN_PLUGIN}${path.slice(TEMPLATES_IN_BOOK.length)}`);
    out.add(`${PLUGINS_REPO}:${TEMPLATES_IN_PLUGIN}README.md`);
    out.add(`${PLUGINS_REPO}:${TEMPLATES_IN_PLUGIN}index.md`);
  }
  for (const pkg of existsSync(join(plugins, "packages")) ? readdirSync(join(plugins, "packages")).sort() : []) {
    const src = join(plugins, "packages", pkg, "src");
    for (const sub of ["refs", "skills", "agents"])
      for (const file of markdownUnder(join(src, sub)))
        if (cites(join(src, sub, file), path)) out.add(`${PLUGINS_REPO}:packages/${pkg}/src/${sub}/${file}`);
  }
  if (statesRules(root, path)) out.add(`${PLUGINS_REPO}:${RULES_INDEX}`);
  return [...out];
}

/** Each generated copy of a sheet's changed book files that no entry of the sheet names, once, with the entries that move it. */
export function missingCopies(root: string, entries: ReadonlyArray<{ id: string; file: string }>): string[] {
  const named = new Set(entries.map((entry) => entry.file));
  const by = new Map<string, string[]>();
  for (const entry of entries)
    for (const copy of generatedCopiesOf(root, entry.file))
      if (!named.has(copy)) by.set(copy, [...(by.get(copy) ?? []), entry.id]);
  return [...by].map(([copy, ids]) => `${ids.join(", ")} change${ids.length === 1 ? "s" : ""} a book file, and the sheet names no entry for its generated copy ${copy}`);
}
