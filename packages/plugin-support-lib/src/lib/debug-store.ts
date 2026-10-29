// This file OWNS the layout of `.spndevex/.debug/` and is the one place the folder is named. It restates the
// book's `.debug/` table (spn-foundation `04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md`).
//
// `telemetry/` holds the two logs, `workspace/` what belongs to the workspace and `sessions/<id>/` everything
// one window keeps. The session start sweeps a window nobody has written to for `SESSION_KEEP_MS`; no other
// store prunes. The switches are not here: they are the `debug` node of `.spndevex/state.json`
// (`workspace-state.ts`), and `switches.json` is read only where that node is not there yet.
//
// A TOOL MUST NEVER FAIL BECAUSE THE DEBUG STORE FAILED: the reads answer "off" or "nothing", and the callers
// of the writes swallow their own errors.

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { type WorkspaceDebugState, hasStateFile, readDebugNode, writeDebugNode } from "./workspace-state.ts";

const DEVEX = ".spndevex", DEBUG = ".debug";

/** `<root>/.spndevex/.debug`. */
export const debugDir = (root: string): string => join(root, DEVEX, DEBUG);
/** The switches' file before `.spndevex/state.json`, kept only for the fold into its `debug` node and the fallback. */
export const switchesFile = (root: string): string => join(debugDir(root), "switches.json");
/** One window's folder, `sessions/<id>`; the id keeps its letters, digits, `_` and `-` (80 at most). */
export const sessionDir = (root: string, session: string): string =>
  join(debugDir(root), "sessions", session.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "-");
/** What belongs to the workspace as a whole, `workspace/`. */
export const workspaceDir = (root: string): string => join(debugDir(root), "workspace");
/** The folder of the two logs, `telemetry/`. */
export const telemetryFolder = (root: string): string => join(debugDir(root), "telemetry");

/** The switches there are. */
export const SWITCH_NAMES = ["telemetry"] as const;
export type SwitchName = (typeof SWITCH_NAMES)[number];

/** The switches as `.debug/switches.json` holds them, or null where it is absent or does not hold an object. Never throws. */
function readOldSwitches(root: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(switchesFile(root), "utf8"));
    return !!parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

/**
 * On only when the switch reads `true`: from the `debug` node of `.spndevex/state.json`, or from
 * `.debug/switches.json` where that file is absent or holds no `debug` node. Anything else is off. Never throws.
 */
export function readSwitch(root: string, name: SwitchName): boolean {
  const node = readDebugNode(root);
  if (node) return node[name] === true;
  return readOldSwitches(root)?.[name] === true;
}

/**
 * Set one switch, keeping the others: in the `debug` node of `.spndevex/state.json` where spnutils has made
 * that file, and in `.debug/switches.json` where it has not. The node is written by the file's five steps.
 */
export function writeSwitch(root: string, name: SwitchName, on: boolean): void {
  if (hasStateFile(root)) {
    writeDebugNode(root, (current) => {
      const next: Record<string, unknown> = { ...current };
      next[name] = on;
      return next as WorkspaceDebugState;
    });
    return;
  }
  const current = readOldSwitches(root) ?? {};
  current[name] = on;
  mkdirSync(debugDir(root), { recursive: true });
  writeFileSync(switchesFile(root), `${JSON.stringify(current, null, 2)}\n`, "utf8");
}

/** A log is rotated once it passes this many bytes. */
export const LOG_CAP = 20 * 1024 * 1024;

const rotatedOf = (file: string): string => file.replace(/\.jsonl$/, "") + ".1.jsonl";

/** Append one line. Past `cap` bytes the file moves to `<stem>.1.jsonl`, replacing the previous one, and the line starts a fresh file. */
export function appendLog(file: string, line: string, cap: number = LOG_CAP): void {
  mkdirSync(dirname(file), { recursive: true });
  try { if (existsSync(file) && statSync(file).size > cap) renameSync(file, rotatedOf(file)); } catch { /* append anyway */ }
  appendFileSync(file, line.endsWith("\n") ? line : `${line}\n`);
}

/** The files a reader reads, oldest first: the rotated one if it exists, then the live one if it exists. */
export function logFiles(file: string): string[] {
  return [rotatedOf(file), file].filter((one) => existsSync(one));
}

/** A window's folder is removed once nothing in it has been written for this long. */
export const SESSION_KEEP_MS = 14 * 24 * 3600 * 1000;

/** The newest write of any file under `path`, or of the folder itself where it holds no file. */
function newestWrite(path: string): number {
  let newest = 0;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? newestWrite(child) : statSync(child).mtimeMs);
  }
  return newest || statSync(path).mtimeMs;
}

/** Remove each `sessions/<id>/` whose newest file write is older than `SESSION_KEEP_MS`; the ids removed. Never throws. */
export function sweepSessions(root: string, now: number = Date.now()): string[] {
  const removed: string[] = [];
  try {
    const sessions = join(debugDir(root), "sessions");
    if (!existsSync(sessions)) return removed;
    for (const entry of readdirSync(sessions, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const folder = join(sessions, entry.name);
        if (now - newestWrite(folder) > SESSION_KEEP_MS) { rmSync(folder, { recursive: true, force: true }); removed.push(entry.name); }
      } catch { /* leave this one */ }
    }
  } catch { /* a sweep never fails a session start */ }
  return removed;
}
