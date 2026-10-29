// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The state file has a node for each owner
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 008: the switch moves from `.debug/switches.json` into the `debug` node of `.spndevex/state.json`.
// spnutils makes that file (Support 5.50.0), so before it exists the script moves nothing and the migration
// stays pending; the plugin goes on reading and writing the old file meanwhile, so the switch is never lost.

import { existsSync, readFileSync, rmSync } from "node:fs";
import { relative, sep } from "node:path";
import { type Migration } from "../migration.ts";
import { switchesFile } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { hasStateFile, stateFile, writeDebugNode } from "../../../../../plugin-support-lib/src/lib/workspace-state.ts";

/** The line the script answers with while spnutils has not made the file: the release order's, word for word. */
const REFUSAL = "Install Support 5.50.0 or later and run `spnutils workspace init <name>`; the switch moves into .spndevex/state.json after that.";

const shown = (root: string, path: string): string => relative(root, path).split(sep).join("/");

/** The old file, while it exists. */
function oldSwitches(root: string): string[] {
  return existsSync(switchesFile(root)) ? [`${shown(root, switchesFile(root))} → the debug node of ${shown(root, stateFile(root))}`] : [];
}

/** `telemetry` as the old file holds it: on only where it reads `true`. */
function oldTelemetry(root: string): boolean {
  try {
    const parsed: unknown = JSON.parse(readFileSync(switchesFile(root), "utf8"));
    return !!parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed as Record<string, unknown>).telemetry === true;
  } catch { return false; }
}

/**
 * Folds the old file into the `debug` node under the file's lock and deletes it. A `debug` node already there
 * wins: the plugin wrote it, so it is newer than the old file. Refuses, moving nothing, where there is no
 * `.spndevex/state.json` yet.
 */
function fold(root: string): string[] {
  if (!existsSync(switchesFile(root))) return [];
  if (!hasStateFile(root)) return [REFUSAL];
  const old = shown(root, switchesFile(root)), file = shown(root, stateFile(root));
  const telemetry = oldTelemetry(root);
  let kept: Record<string, unknown> | null = null;
  writeDebugNode(root, (current) => {
    kept = current;
    return current && typeof current.telemetry === "boolean" ? { ...current, telemetry: current.telemetry } : { telemetry };
  });
  rmSync(switchesFile(root), { force: true });
  const there = kept as Record<string, unknown> | null;
  return there && typeof there.telemetry === "boolean"
    ? [`${old} deleted — ${file} holds a debug node already, and it is kept (telemetry ${there.telemetry ? "on" : "off"})`]
    : [`${old} → ${file}, the debug node (telemetry ${telemetry ? "on" : "off"}; the old file is deleted)`];
}

export const migration008: Migration = {
  id: "008",
  version: "0.89.0",
  changed: "The switch moves from `.debug/switches.json` into the `debug` node of `.spndevex/state.json`, once Support 5.50.0 has made that file.",
  check: oldSwitches,
  script: fold,
};
