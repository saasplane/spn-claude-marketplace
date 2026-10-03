#!/usr/bin/env node
// Advice, not a rule from the book: a long command typed in the foreground costs the window more
// than the same command started in the background and read when it ends.
//
// WHAT IT CATCHES. `pnpm test`, `pnpm run build`, `pnpm run build:plugins`, `spnutils workspace
// agent-sync`, `spnutils apps check`, `spnutils apps test` and `spnutils apps release` each run long
// enough that a foreground wait blocks every other call in the window until it ends. None of them
// needs to be watched live, so the fix is the same for all seven: run it in a background shell and
// carry on — the result arrives, through `PostToolUse`, when it ends.
//
// IT NEVER BLOCKS. Running one of these in the foreground is slower, not wrong, so this is a `note`
// and never a `deny` — the one thing a note can do is remind, and the call still goes through.
//
// A LEADING `cd <dir> &&` MOVES WHERE A COMMAND RUNS, NEVER WHAT IT IS, so it is stripped before the
// first words are read against the list below — the same read `release-go.ts`'s `commandCwd` gives
// the directory half of the same prefix.

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

/**
 * Commands long enough that a foreground wait costs the window more than starting them in the
 * background and reading the result later.
 */
export const LONG_COMMANDS = [
  "pnpm test",
  "pnpm run build",
  "pnpm run build:plugins",
  "spnutils workspace agent-sync",
  "spnutils apps check",
  "spnutils apps test",
  "spnutils apps release",
];

// A leading `cd <dir> &&`, quoted or bare, and only before `&&` — anything more elaborate than that
// is a shape this cannot reason about, and the whole command is read as it stands.
const CD_PREFIX = /^\s*cd\s+(?:'[^']*'|"[^"]*"|[^\s;&|]+)\s*&&\s*/;

/** `command` with a leading `cd <dir> &&` removed, so the program it actually runs reads first. */
export function afterCd(command: string): string {
  return command.replace(CD_PREFIX, "");
}

/** The entry of `LONG_COMMANDS` that `command` opens with, after an optional leading `cd … &&`, or null. */
export function longCommand(command: string): string | null {
  const rest = afterCd(command).trim();
  return LONG_COMMANDS.find((one) => rest === one || rest.startsWith(`${one} `)) ?? null;
}

/** Whether this check could possibly have an opinion: a `Bash` call naming one of `LONG_COMMANDS`. */
export function applies(_path: string, command: string): boolean {
  return longCommand(command) !== null;
}

export function checkLongRun(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command) return null;
  if (payload.tool_input?.run_in_background) return null;
  const matched = longCommand(command);
  if (!matched) return null;
  return {
    note:
      `\`${matched}\` runs long enough that waiting on it here costs the window more than starting ` +
      `it does: run it in a background shell and carry on — the result arrives when it ends.`,
  };
}

if (runAlone("long-run.ts")) {
  try { emit(checkLongRun(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
