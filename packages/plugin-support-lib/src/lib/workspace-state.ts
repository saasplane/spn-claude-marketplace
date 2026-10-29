// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The state file has a node for each owner
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// `.spndevex/state.json`, one node for each owner: spnutils writes `workspace` and `workstreams`, and THIS
// PLUGIN WRITES `debug` AND NOTHING ELSE, by the chapter's five steps. `WorkspaceState` restates spnutils's
// contract state `UTLWorkspaceState`.
//
// A TOOL MUST NEVER FAIL BECAUSE THE FILE COULD NOT BE READ: every read answers null on any fault.

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEVEX } from "./docs-tree.ts";

/** The file, in `.spndevex/`. */
export const STATE_FILE = "state.json";
/** The lock folder a writer makes, beside the file. */
export const STATE_LOCK_DIR = ".state.lock";
/** A lock older than this was left by a program that died, and is taken over. */
export const STATE_LOCK_STALE_MS = 30_000;
/** The temporary file a write goes to before it is renamed over the file; `{pid}` is the writer's process id. */
export const STATE_TEMP_FILE = ".state.json.{pid}.tmp";

/** How long a write waits between two tries at a lock another program holds. */
const LOCK_RETRY_MS = 50;

/** The workspace itself: spnutils's, written by `workspace init <name>`. */
export type WorkspaceIdentityState = {
  /** The workspace's name, given once. Null in a workspace made before names. */
  name: string | null;
};

/** The facts about the workstreams the folder tree cannot show: spnutils's. */
export type WorkspaceWorkstreamsState = {
  /** The highest workstream number ever used. */
  lastNumber: number;
};

/** The agent's machinery switches: this plugin's, and the one node it writes. */
export type WorkspaceDebugState = {
  /** Whether the agent's telemetry is recording. */
  telemetry: boolean;
};

/**
 * The file as spnutils's contract states it. A key the file leaves out reads as null, never as an absent
 * key: `debug` until the plugin first writes it, and `workspace.name` in a workspace made before names.
 */
export type WorkspaceState = {
  workspace: WorkspaceIdentityState;
  workstreams: WorkspaceWorkstreamsState;
  debug: WorkspaceDebugState | null;
};

/** `<root>/.spndevex/state.json`. */
export const stateFile = (root: string): string => join(root, DEVEX, STATE_FILE);

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** The file as the object it holds; throws where it is absent, not JSON, or not an object. */
function readStateObject(file: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!isObject(parsed)) throw new Error(`${DEVEX}/${STATE_FILE} does not hold a JSON object`);
  return parsed;
}

/** A `debug` node the plugin can read: an object whose `telemetry` is a boolean. Anything else is null. */
const debugOf = (value: unknown): WorkspaceDebugState | null =>
  isObject(value) && typeof value.telemetry === "boolean" ? { ...value, telemetry: value.telemetry } : null;

/** The file read as its contract states it, or null where it is absent or any part of it does not read. Never throws. */
function readWorkspaceState(root: string): WorkspaceState | null {
  try {
    const raw = readStateObject(stateFile(root));
    const workspace = isObject(raw.workspace) ? raw.workspace : null;
    const workstreams = isObject(raw.workstreams) ? raw.workstreams : null;
    if (!workspace || !workstreams || typeof workstreams.lastNumber !== "number") return null;
    return {
      workspace: { name: typeof workspace.name === "string" ? workspace.name : null },
      workstreams: { lastNumber: workstreams.lastNumber },
      debug: debugOf(raw.debug),
    };
  } catch { return null; }
}

/** Whether the workspace has its state file, which spnutils makes and the plugin never starts. */
export const hasStateFile = (root: string): boolean => existsSync(stateFile(root));

/** The `debug` node, or null where the file is absent, unreadable, or holds no `debug` node it can read. Never throws. */
export function readDebugNode(root: string): WorkspaceDebugState | null {
  return readWorkspaceState(root)?.debug ?? null;
}

/** Blocks this process for a moment. Every write here is synchronous, as its callers are. */
const pause = (milliseconds: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
};

/**
 * Step 1: take the lock — make the folder `.spndevex/.state.lock/`. Making a folder either succeeds or
 * fails at once, so only one writer holds it. A lock another program holds is waited on. One older than
 * 30 seconds was left by a program that died: it is renamed aside under a name of this process's own,
 * which only one taker can do, removed, and made again, with one line saying so.
 */
function takeLock(devex: string): string {
  const lock = join(devex, STATE_LOCK_DIR);
  for (;;) {
    try { mkdirSync(lock); return lock; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    let ageMs: number;
    try { ageMs = Date.now() - statSync(lock).mtimeMs; }
    catch { continue; } // released between the two calls: try again at once
    if (ageMs <= STATE_LOCK_STALE_MS) { pause(LOCK_RETRY_MS); continue; }
    const aside = `${lock}.${process.pid}.stale`;
    try { renameSync(lock, aside); }
    catch { continue; } // another writer took it over first, or its holder let it go
    rmSync(aside, { recursive: true, force: true });
    process.stderr.write(`⚠ ${DEVEX}/${STATE_LOCK_DIR}/ is ${Math.round(ageMs / 1000)} seconds old, so the program that took it died — taken over\n`);
  }
}

/**
 * Write the `debug` node, and nothing else, by the five steps. `change` is given the node as the file
 * holds it, read again under the lock (null where it has none), and returns the node to write, so a
 * decision that depends on what is there is made on what is there.
 *
 * The plugin never starts the file: it is spnutils's to make, so a write where it is absent throws, as
 * does one where it does not read. Every other top-level node is written back exactly as it was read.
 * Returns true when the file changed, false when it already held the node.
 */
export function writeDebugNode(root: string, change: (current: Record<string, unknown> | null) => WorkspaceDebugState): boolean {
  const devex = join(root, DEVEX);
  const file = stateFile(root);
  if (!existsSync(file)) throw new Error(`${DEVEX}/${STATE_FILE} is not there: spnutils makes it, and the plugin writes only its debug node`);
  const lock = takeLock(devex);
  const temp = join(devex, STATE_TEMP_FILE.replace("{pid}", String(process.pid)));
  try {
    const current = readStateObject(file);
    const node = change(isObject(current.debug) ? current.debug : null);
    const next: Record<string, unknown> = { ...current, debug: node };
    if (JSON.stringify(next) === JSON.stringify(current)) return false;
    writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    renameSync(temp, file);
    return true;
  } finally {
    rmSync(temp, { force: true });
    rmSync(lock, { recursive: true, force: true });
  }
}
