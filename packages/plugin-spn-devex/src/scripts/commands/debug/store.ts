// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § Two dot-homes
// (its `.debug/` table, three containers) and § The state file has a node for each owner.
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//     spn-devex debug store show [--json]
//     spn-devex debug store reset
//
// Each container of `.spndevex/.debug/`: its files, its bytes and its lifetime rule as the book's table states it.
// Then the switch, which is not in `.debug/`: the `debug` node of `.spndevex/state.json`, or `.debug/switches.json`
// until plugin migration 008 folds it in.
//
// `reset` removes the two telemetry logs, `usage.jsonl` and `hooks.jsonl`, and their `.1.jsonl` files at once, for a tidy
// start; the writer would move an old log aside before its first append anyway. It removes nothing else. Its own
// `COMMAND` row, written as the command ends, is the first of the new `hooks.jsonl` while telemetry is on.

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readSwitch, sessionDir, switchesFile, telemetryFolder, workspaceDir } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { DEVEX } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { STATE_FILE, readDebugNode, stateFile } from "../../../../../plugin-support-lib/src/lib/workspace-state.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";

export const describe = "each container of the agent's own store, its files, its size and its lifetime rule, and the switch";

type Container = { container: string; path: string; files: number; bytes: number; lifetime: string };

/** The book's table, row for row: the container as it is named there, where it sits, and its lifetime. */
function containers(root: string): Array<Pick<Container, "container" | "path" | "lifetime">> {
  return [
    { container: "sessions/<session-id>/", path: dirname(sessionDir(root, "-")),
      lifetime: "swept whole, 14 days after the folder's newest write, at session start and by `debug window sweep`; no store prunes on its own" },
    { container: "workspace/", path: workspaceDir(root), lifetime: "kept" },
    { container: "telemetry/", path: telemetryFolder(root),
      lifetime: "each log, past 20 MB, is renamed `<name>.1.jsonl`, replacing the previous one, and starts anew; a reader reads both" },
  ];
}

/** The switch, and the file it is read from: the `debug` node where the state file holds one, the old file where not. */
function switchOf(root: string): { from: string; telemetry: boolean; node: boolean } {
  const node = readDebugNode(root) !== null;
  const from = relative(root, node ? stateFile(root) : switchesFile(root)).split(sep).join("/");
  return { from, telemetry: readSwitch(root, "telemetry"), node };
}

/** The files at the path, and their bytes; a path that is not there holds none. */
function sizeOf(path: string): { files: number; bytes: number } {
  if (!existsSync(path)) return { files: 0, bytes: 0 };
  const info = statSync(path);
  if (!info.isDirectory()) return { files: 1, bytes: info.size };
  let files = 0, bytes = 0;
  for (const entry of readdirSync(path)) {
    const inner = sizeOf(join(path, entry));
    files += inner.files;
    bytes += inner.bytes;
  }
  return { files, bytes };
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no target.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const rows: Container[] = containers(root).map((one) => ({ ...one, ...sizeOf(one.path) }));
  const { from, telemetry, node } = switchOf(root);
  if (words.given("json")) { console.log(JSON.stringify({ containers: rows, debug: { from, telemetry } }, null, 2)); return 0; }
  for (const one of rows) console.log(`${one.container}  ${one.files} file(s), ${one.bytes} bytes\n  ${one.lifetime}`);
  const nodeFile = `${DEVEX}/${STATE_FILE}`;
  const where = node ? `the debug node of ${nodeFile}` : `read from ${from} until plugin migration 008 folds it into the debug node of ${nodeFile}`;
  console.log(`debug  telemetry ${telemetry ? "on" : "off"} — ${where}`);
  return 0;
}

/** The telemetry logs `reset` removes: the two logs, each with its rotated file, and nothing else in the folder. */
const RESET_FILES = ["usage.jsonl", "usage.1.jsonl", "hooks.jsonl", "hooks.1.jsonl"] as const;

function reset(args: string[]): number {
  const words = readWords(args);
  if (words.paths.length) throw new UsageFault("takes no target.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const folder = telemetryFolder(root);
  const removed = RESET_FILES.filter((name) => existsSync(join(folder, name)));
  for (const name of removed) rmSync(join(folder, name), { force: true });
  console.log(removed.length ? `removed ${removed.join(", ")} from ${relative(root, folder).split(sep).join("/")}` : "no usage or hooks log to remove");
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "each container of the store: files, size, lifetime", usage: "[--json]", run: show },
  reset: { describe: "remove usage.jsonl, hooks.jsonl and their .1 files, and nothing else", usage: "", run: reset },
};
