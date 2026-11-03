// RESTATES: spn-foundation RULE.DEVEX.AGENT.110 — the four plugins carry one version, and one command writes it.
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// Only the registrations whose project folder still exists are read: a folder that is gone is not a place the plugin must land. Given the
// workspace, only the registrations inside it are read too: another window's scratchpad is not a place the workspace loads from (s183).
//
// Refuses a landed row that changes a plugin until the four `plugin.json` versions agree and `installed_plugins.json`
// records that version in every location. A plugin change that is not installed is not landed.
//
//   called by: commands/workstream/row.ts, when a row is set landed

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, isAbsolute } from "node:path";

export const PLUGINS = ["spn-devex", "spn-apps", "spn-surface", "spn-infra"] as const;

/** A path inside one of the plugins' own packages: what a plugin change writes. */
const PLUGIN_PATH = /(?:^|[:/])packages\/plugin-spn-[a-z]+\//;

/**
 * Whether a row could be a plugin change being landed: a string test on the state, the repo and the paths the row
 * names (its sheet entries' files and its touches), before any read. A row that names paths changes a plugin only
 * where one is under `packages/plugin-…/`, so a docs row is not held; a row that names none, a release among them,
 * is held.
 */
export function applies(repo: string | null | undefined, state: string | null | undefined, paths: readonly string[] = []): boolean {
  if (state !== "landed" || !repo || !repo.endsWith("spn-claude-marketplace")) return false;
  return !paths.length || paths.some((path) => PLUGIN_PATH.test(path));
}

/** The default place Claude Code records what is installed. */
export const installedFile = (): string => join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude"), "plugins", "installed_plugins.json");

const versionOf = (file: string): string | null => {
  try { return (JSON.parse(readFileSync(file, "utf8")) as { version?: string }).version ?? null; } catch { return null; }
};

/** A registration counts only where its project folder is still on disk; one whose folder is gone is not a place the plugin must land. A registration naming no folder (a user install) counts. */
const folderExists = (place: { projectPath?: string }): boolean => !place.projectPath || existsSync(place.projectPath);

/** A registration counts only inside the workspace, where one is named; a registration naming no folder (a user install) counts. */
const insideOf = (workspace: string | null) => (place: { projectPath?: string }): boolean => {
  if (!workspace || !place.projectPath) return true;
  const path = relative(workspace, place.projectPath);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
};

/** The refusal for a marketplace checkout and an install record, or null where all agree; given the workspace, only its own registrations are read. */
export function pluginLandedRefusal(marketplace: string, installed: string = installedFile(), workspace: string | null = null): string | null {
  const versions = PLUGINS.map((name) => ({ name, version: versionOf(join(marketplace, "packages", `plugin-${name}`, "src", ".claude-plugin", "plugin.json")) }));
  const fix = "Release them together: `release:plugins prepare <version>`, merge, `release:plugins tag --push`, then `spnutils workspace agent-sync` (RULE.DEVEX.AGENT.110).";
  const distinct = [...new Set(versions.map((one) => one.version))];
  if (distinct.length !== 1 || distinct[0] === null)
    return `The four plugin versions do not agree (${versions.map((one) => `${one.name} ${one.version ?? "none"}`).join(", ")}), so the plugin change is not landed. ${fix}`;
  const version = distinct[0];
  if (!existsSync(installed)) return `${installed} does not exist, so ${version} is not installed. ${fix}`;
  let record: { plugins?: Record<string, { version?: string; projectPath?: string }[]> };
  try { record = JSON.parse(readFileSync(installed, "utf8")); } catch { return `${installed} cannot be read, so ${version} is not known to be installed. ${fix}`; }
  const behind: string[] = [];
  for (const name of PLUGINS) {
    const places = Object.entries(record.plugins ?? {}).filter(([key]) => key.startsWith(`${name}@`)).flatMap(([, list]) => list).filter(folderExists).filter(insideOf(workspace));
    if (!places.length) behind.push(`${name} (not installed)`);
    else if (places.some((place) => place.version !== version)) behind.push(`${name} (${places.filter((p) => p.version !== version).length} location(s) not at ${version})`);
  }
  return behind.length ? `Plugin ${version} is not installed everywhere: ${behind.join(", ")}, so the plugin change is not landed. ${fix}` : null;
}
