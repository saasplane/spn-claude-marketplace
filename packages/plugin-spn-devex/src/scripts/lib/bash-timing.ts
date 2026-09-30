// The Bash commands the agent runs, timed (RD.DEVEX.WORKSPACE.185). No hook sees a command's
// duration, so the hooks before and after the call pair on its `tool_use_id`:
//
// - `startCommand`, from `PreToolUse`: while recording is on, the command is read (`command-reader.ts`)
//   and, only where a program the filter names is in it, `telemetry/pending/<tool_use_id>.json` is
//   written with the start time and the reading. Writing one removes any older than a day, which a
//   crashed or refused call left behind. An unmatched call pays for the reading and nothing more.
// - `finishCommand`, from `PostToolUse` or `PostToolUseFailure`: the start file is read and removed,
//   and one line per program is written with the whole call's `ms` and its `exit`. A failure with no
//   code reads 1; a background call (`run_in_background`) returns before its command ends, so its
//   line is written with `exit` null.

import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tagsOf, telemetryDir, write, type Entry } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { loadPrograms, readCommand, type Reading } from "./command-reader.ts";
import { workspaceRoot, type Payload } from "./payload.ts";

const PENDING = "pending";
const DAY_MS = 24 * 3600 * 1000;

type Started = { at: number; background: boolean; found: Reading[] };

/** The call id as a file name, or null where there is none to pair on. */
function fileOf(payload: Payload): string | null {
  const id = typeof payload.tool_use_id === "string" ? payload.tool_use_id : "";
  return /^[A-Za-z0-9_-]{1,200}$/.test(id) ? `${id}.json` : null;
}

function prune(dir: string): void {
  const now = Date.now();
  for (const name of readdirSync(dir)) {
    try { if (now - statSync(join(dir, name)).mtimeMs > DAY_MS) rmSync(join(dir, name), { force: true }); }
    catch { /* another hook removed it first */ }
  }
}

/** `PreToolUse` on Bash: write the start file for a matched command while recording is on. Never throws. */
export function startCommand(payload: Payload): void {
  try {
    if (payload.tool_name !== "Bash") return;
    const file = fileOf(payload);
    const command = payload.tool_input?.command;
    if (!file || !command) return;
    const cwd = payload.cwd ?? process.cwd();
    const root = workspaceRoot(cwd);
    const dir = telemetryDir(root);
    if (!dir) return;
    const found = readCommand(command, cwd, loadPrograms(dir), root);
    if (!found.length) return;
    const pending = join(dir, PENDING);
    mkdirSync(pending, { recursive: true });
    prune(pending);
    const started: Started = { at: Date.now(), background: payload.tool_input?.run_in_background === true, found };
    writeFileSync(join(pending, file), JSON.stringify(started), "utf8");
  } catch { /* a tool never fails because timing failed */ }
}

const CODE_FIELDS = ["exit_code", "exitCode", "returnCode", "return_code", "code", "status"] as const;

/** The call's exit code: from the tool response, else from a failure's text, else 1 for a failure and 0 otherwise. */
export function exitOf(payload: Payload, failed: boolean): number {
  const response = payload.tool_response;
  if (response && typeof response === "object") {
    for (const field of CODE_FIELDS) {
      const value = (response as Record<string, unknown>)[field];
      if (typeof value === "number" && Number.isInteger(value)) return value;
    }
  }
  const text = typeof payload.error === "string" ? payload.error
    : typeof response === "string" ? response : "";
  const said = /exit(?:ed with)? code:?\s*(-?\d+)/i.exec(text);
  if (said) return Number(said[1]);
  return failed ? 1 : 0;
}

/** `PostToolUse` or `PostToolUseFailure` on Bash: write the lines and remove the start file. Never throws. */
export function finishCommand(payload: Payload, failed: boolean): void {
  try {
    if (payload.tool_name !== "Bash") return;
    const file = fileOf(payload);
    if (!file) return;
    const root = workspaceRoot(payload.cwd ?? process.cwd());
    if (!root) return;
    const path = join(root, ".spndevex", ".debug", "telemetry", PENDING, file);
    let started: Started;
    try { started = JSON.parse(readFileSync(path, "utf8")) as Started; } catch { return; }
    try { rmSync(path, { force: true }); } catch { /* ignore */ }
    if (!Array.isArray(started.found) || !started.found.length || typeof started.at !== "number") return;
    const ms = Math.max(0, Math.round(Date.now() - started.at));
    const background = started.background || payload.tool_input?.run_in_background === true;
    const exit = background && !failed ? null : exitOf(payload, failed);
    const entries: Entry[] = started.found.map((one) => ({
      script: one.script, group: one.group, subgroup: one.subgroup, action: one.action, args: one.args,
      repo: one.repo, ms, exit,
    }));
    write(root, { script: "spn-devex", event: "command", tool: "Bash", session: payload.session_id ?? null, ...tagsOf(payload) },
          entries);
  } catch { /* a tool never fails because timing failed */ }
}
