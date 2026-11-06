// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The agent loads what the work needs
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The work map: one table in `refs/devex/agent/work-map.md` with a row for each kind of work. It says which skill covers the work,
// which references to read first, where in the repositories the answer to "what exists" is, and what past corrections taught it.
//
// A ROW NAMES ANOTHER PLUGIN'S REFERENCE BY PLUGIN AND PATH, AS TEXT, never as an import: a partner holds only the plugins, so the
// path is resolved when it is needed, from the installed list (`installed_plugins.json`) and from the checkout beside the workspace.
// A row that resolves to nothing is dropped from a note, and `MKT.REFS.09` names it.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** One kind of work: its row of the map. */
export type MapRow = {
  work: string;
  /** What opens the row: `skill:<name>`, `write:<glob>`, `layer:<name>`, `command:<words>`. */
  seenWhen: string[];
  skill: string;
  /** The references to read first, each as the plugin that holds it and its path. */
  readFirst: Reference[];
  lookIn: string;
  learned: string;
};
export type Reference = { plugin: string; path: string; text: string };

/** The plugins a reference may name by their short word, and `book` for a page of the book. */
export const PLUGIN_OF: Readonly<Record<string, string>> = { devex: "spn-devex", apps: "spn-apps", surface: "spn-surface", infra: "spn-infra" };
const BOOK = "book";

const cells = (line: string): string[] => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));

/** The references a `Read first` cell lists: items split at ` · `, each `<plugin> <path>` or a bare path of the plugin before it. */
export function referencesOf(cell: string): Reference[] {
  const out: Reference[] = [];
  let plugin = "";
  for (const raw of cell.split(/\s+·\s+/)) {
    const item = raw.replace(/\s*§.*$/, "").trim();
    if (!item || item === "—") continue;
    const parts = item.split(/\s+/);
    if (parts.length > 1 && (parts[0] in PLUGIN_OF || parts[0] === BOOK)) { plugin = parts[0]; parts.shift(); }
    const path = parts.join(" ");
    if (plugin && /\.md$/.test(path)) out.push({ plugin, path, text: `${plugin} ${path}` });
  }
  return out;
}

/** The rows of the map's table, read by the header's names and never by position. */
export function parseMap(text: string): MapRow[] {
  const lines = text.split("\n");
  const head = lines.findIndex((line) => /^\s*\|\s*Work\s*\|/.test(line));
  if (head < 0) return [];
  const names = cells(lines[head]).map((name) => name.toLowerCase());
  const rows: MapRow[] = [];
  for (const line of lines.slice(head + 2)) {
    if (!/^\s*\|/.test(line)) break;
    const row = cells(line);
    const get = (name: string): string => { const cell = row[names.indexOf(name)] ?? ""; return cell === "—" ? "" : cell; };
    const work = get("work");
    if (!work) continue;
    rows.push({
      work,
      seenWhen: get("seen when").split(/\s+·\s+/).map((one) => one.trim()).filter((one) => one && one !== "—"),
      skill: get("skill"), readFirst: referencesOf(get("read first")), lookIn: get("look in"), learned: get("learned"),
    });
  }
  return rows;
}

/** The map the plugin carries, or `[]` where it cannot be read. */
/** A file under the plugin's refs, found by walking up from this code: source and each bundle sit at different depths. */
export function refFile(path: string): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const found = join(dir, "refs", path);
    if (existsSync(found)) return found;
    const up = dirname(dir);
    if (up === dir) return join("refs", path);
    dir = up;
  }
}

export function mapRows(file = refFile("devex/agent/work-map.md")): MapRow[] {
  try { return parseMap(readFileSync(file, "utf8")); } catch { return []; }
}

/** A glob of a `write:` mark as a pattern: `**` crosses folders, `*` does not. */
export function globToRegExp(glob: string): RegExp {
  const source = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "\u0000").replace(/\*\*/g, "\u0001").replace(/\*/g, "[^/]*").replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*");
  return new RegExp(`(?:^|/)${source}$`);
}

/** What a trigger offers the map: a skill opening, a file written, a layer written under, or a command run. */
export type Trigger = { skill?: string; write?: string; layer?: string; command?: string };

/** Each row a trigger opens: by a `Seen when` mark, else, for a skill, by the row's Skill column. */
export function rowsFor(rows: readonly MapRow[], trigger: Trigger): MapRow[] {
  const marked = rows.filter((row) => row.seenWhen.some((mark) => {
    const [kind, ...rest] = mark.split(":");
    const value = rest.join(":");
    if (kind === "skill") return trigger.skill === value;
    if (kind === "write") return !!trigger.write && globToRegExp(value).test(trigger.write);
    if (kind === "layer") return trigger.layer === value;
    if (kind === "command") return !!trigger.command && trigger.command.trim().startsWith(value);
    return false;
  }));
  if (marked.length || !trigger.skill) return marked;
  return rows.filter((row) => row.skill === trigger.skill);
}

/** The row of a kind of work, by its name. */
export const rowOf = (rows: readonly MapRow[], work: string): MapRow | null => rows.find((row) => row.work === work) ?? null;

/** Where plugins and the checkout are looked for. Every field is replaceable, so a test names its own. */
export type Places = { installed?: string | null; checkout?: string | null };

/** The default place Claude Code records what is installed. */
export const installedFile = (): string => join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude"), "plugins", "installed_plugins.json");

/** The folders a plugin's references may sit in: each install of it, and its checkout beside the workspace. Newest install first. */
export function refRoots(plugin: string, places: Places = {}): string[] {
  const out: string[] = [];
  const installed = places.installed === undefined ? installedFile() : places.installed;
  if (plugin !== BOOK && installed) {
    try {
      const data = JSON.parse(readFileSync(installed, "utf8")) as { plugins?: Record<string, Array<{ installPath?: string }>> };
      for (const [key, installs] of Object.entries(data.plugins ?? {}))
        if (key.split("@")[0] === (PLUGIN_OF[plugin] ?? plugin))
          for (const one of installs) if (one.installPath) out.push(join(one.installPath, "refs"));
    } catch { /* no installed list: only the checkout speaks */ }
    out.reverse();
  }
  if (places.checkout) {
    if (plugin === BOOK) out.push(join(places.checkout, "spn-foundation", "docs"));
    else out.push(join(places.checkout, "spn-claude-marketplace", "packages", `plugin-${PLUGIN_OF[plugin] ?? plugin}`, "src", "refs"));
  }
  return out.filter((dir) => existsSync(dir));
}

/** A file under `dir` whose path ends with `tail`, by a walk that skips dot folders and `node_modules`; the first in sorted order. */
function findUnder(dir: string, tail: string, depth = 0): string | null {
  if (depth > 9) return null;
  let names: string[] = [];
  try { names = readdirSync(dir).sort(); } catch { return null; }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const path = join(dir, name);
    let kind: "dir" | "file" | null = null;
    try { kind = statSync(path).isDirectory() ? "dir" : "file"; } catch { /* a broken link */ }
    if (kind === "file" && (path.endsWith(`/${tail}`) || path === tail)) return path;
    if (kind === "dir") { const inside = findUnder(path, tail, depth + 1); if (inside) return inside; }
  }
  return null;
}

/** The absolute path of a reference, or null where no install and no checkout holds it. */
export function resolveRef(ref: Reference, places: Places = {}): string | null {
  for (const dir of refRoots(ref.plugin, places)) {
    const found = findUnder(dir, ref.path);
    if (found) return found;
  }
  return null;
}

/** A row's references split into those that resolve, as absolute paths, and those that do not, which a note drops. */
export function resolvedRow(row: MapRow, places: Places = {}): { found: Array<Reference & { file: string }>; missing: Reference[] } {
  const found: Array<Reference & { file: string }> = [];
  const missing: Reference[] = [];
  for (const ref of row.readFirst) {
    const file = resolveRef(ref, places);
    if (file) found.push({ ...ref, file }); else missing.push(ref);
  }
  return { found, missing };
}

/** The row's name for a note's first line, and a file's own name for a reference's label. */
export const labelOf = (ref: Reference & { file: string }): string => `${PLUGIN_OF[ref.plugin] ?? ref.plugin} ${basename(ref.file)}`;
