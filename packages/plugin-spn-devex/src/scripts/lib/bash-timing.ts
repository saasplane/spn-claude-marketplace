// The Bash commands the agent runs, timed (RD.DEVEX.WORKSPACE.185). No hook sees a command's
// duration, so the hooks before and after the call pair on its `tool_use_id`:
//
// - `startCommand`, from `PreToolUse`: while recording is on, the command is read (`command-reader.ts`)
//   and, only where a program the filter names is in it, `sessions/<id>/pending/<tool_use_id>.json` is
//   written with the start time and the reading. An unmatched call pays for the reading and nothing
//   more.
// - `finishCommand`, from `PostToolUse` or `PostToolUseFailure`: the start file is read and removed,
//   and one line is written for the call with its `ms` and its `exit`. The line names the first
//   program the filter matched, and `programs` holds how many the call ran, so a total by program
//   holds a call's time once. A failure with no code reads 1; a background call (`run_in_background`)
//   returns before its command ends, so its line is written with `exit` null.
//
// A START FILE NO HOOK CLOSES. A call refused after `PreToolUse` wrote its start file never runs, so
// no hook comes after it; a crashed call leaves one the same way. Nothing prunes it here: the window's
// folder is swept whole once nothing in it has been written for 14 days (`debug-store.ts`).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { tagsOf, telemetryDir, write, type Entry } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { loadPrograms, readCommand, type Reading } from "./command-reader.ts";
import { workspaceRoot, type Payload } from "./payload.ts";

const PENDING = "pending";

/** The start file: when the call began, whether it runs in the background, and every program the filter matched in it. */
export type Started = { at: number; background: boolean; found: Reading[] };

/** The call id as a file name, or null where there is none to pair on. */
function fileOf(payload: Payload): string | null {
  const id = typeof payload.tool_use_id === "string" ? payload.tool_use_id : "";
  return /^[A-Za-z0-9_-]{1,200}$/.test(id) ? `${id}.json` : null;
}

/** `PreToolUse` on Bash: write the start file for a matched command while recording is on. Never throws. */
export function startCommand(payload: Payload): void {
  try {
    if (payload.tool_name !== "Bash") return;
    const file = fileOf(payload);
    const command = payload.tool_input?.command;
    const session = typeof payload.session_id === "string" ? payload.session_id : "";
    if (!file || !command || !session) return;
    const cwd = payload.cwd ?? process.cwd();
    const root = workspaceRoot(cwd);
    const dir = telemetryDir(root);
    if (!dir) return;
    if (!root) return;
    const found = readCommand(command, cwd, loadPrograms(root), root);
    if (!found.length) return;
    const pending = join(sessionDir(root, session), PENDING);
    mkdirSync(pending, { recursive: true });
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

/** The bytes a tool's response put into the context: a Bash call's stdout and stderr, else the response as it is. */
function bytesOfResponse(payload: Payload): number {
  const response = payload.tool_response;
  if (response === undefined || response === null) return 0;
  if (typeof response === "string") return Buffer.byteLength(response);
  const shell = response as { stdout?: unknown; stderr?: unknown };
  if (typeof shell.stdout === "string" || typeof shell.stderr === "string")
    return Buffer.byteLength(typeof shell.stdout === "string" ? shell.stdout : "") + Buffer.byteLength(typeof shell.stderr === "string" ? shell.stderr : "");
  try { return Buffer.byteLength(JSON.stringify(response)); } catch { return 0; }
}

/**
 * `PostToolUse` or `PostToolUseFailure` on Bash: write the call's line and remove the start file.
 * Returns the bytes the tool's response put into the context, for the run's own whole-run line. Never throws.
 */
export function finishCommand(payload: Payload, failed: boolean): number {
  let out = 0;
  try {
    out = bytesOfResponse(payload);
    if (payload.tool_name !== "Bash") return out;
    const file = fileOf(payload);
    const session = typeof payload.session_id === "string" ? payload.session_id : "";
    if (!file || !session) return out;
    const root = workspaceRoot(payload.cwd ?? process.cwd());
    if (!root) return out;
    const path = join(sessionDir(root, session), PENDING, file);
    let started: Started;
    try { started = JSON.parse(readFileSync(path, "utf8")) as Started; } catch { return out; }
    try { rmSync(path, { force: true }); } catch { /* ignore */ }
    if (!Array.isArray(started.found) || !started.found.length || typeof started.at !== "number") return out;
    const ms = Math.max(0, Math.round(Date.now() - started.at));
    const background = started.background || payload.tool_input?.run_in_background === true;
    const exit = background && !failed ? null : exitOf(payload, failed);
    const first = started.found[0];
    const entry: Entry = {
      script: first.script, group: first.group, subgroup: first.subgroup, action: first.action, args: first.args,
      repo: first.repo, ms, exit, programs: started.found.length, out,
    };
    write(root, { script: "spn-devex", event: "command", tool: "Bash", session: payload.session_id ?? null, ...tagsOf(payload) },
          [entry]);
  } catch { /* a tool never fails because timing failed */ }
  return out;
}
