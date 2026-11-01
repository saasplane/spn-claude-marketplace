#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.446 — the seat file's keys are the agent's to manage, and its values
// are never printed. The chapter is the source of truth; a rule change is edited there first, then here.
//
// Refuses a Bash command that would print a value from the seat file (the `.spnenv` file in the home folder): a
// reader such as `cat`, `head`, `grep` or `sed -n` over it. A command that prints only key NAMES (`cut -d= -f1`),
// only counts or tests (`grep -q`, `-c`, `-l`), or WRITES the file (`sed -i`) is let through.
//
// A REFUSAL, BECAUSE A PRINTED CREDENTIAL IS EXPOSED FROM THAT MOMENT: the transcript outlives the window, and
// rotation is the only repair. Its fast path is one substring test for the file's name, so every other call pays that
// and stops.
//
//   called by: events/pretooluse.ts, on a Bash call

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const SEAT_NAME = ".spnenv";

/** Programs that put what they read on screen. */
const READERS = /(?:^|[\s;&|(`])(?:cat|bat|head|tail|less|more|nl|tac|od|xxd|strings|sort|uniq|tee|awk|rg|grep|egrep|fgrep|sed|cut|source|\.)\s/;

/** Whether a command could name the seat file: a substring test, so every other call pays that and stops. */
export function applies(command: string): boolean {
  return command.includes(SEAT_NAME);
}

/** Whether a command, naming the seat file, only edits it, tests it, counts it or lists key names. */
function harmless(command: string): boolean {
  if (/\|/.test(command)) return /\bcut\b[^|;&\n]*-f\s*1\b/.test(command) && !/\bcat\b[^|]*\|[^|]*\b(?:grep|sed)\b/.test(command);
  if (/\bsed\b[^;&\n]*\s-[a-zA-Z]*i/.test(command)) return true;                       // an in-place edit prints nothing
  if (/\bgrep\b[^;&\n]*\s-[a-zA-Z]*[qcl]/.test(command)) return true;
  if (/\bcut\b[^;&\n]*-f\s*1\b/.test(command)) return true;                              // key names only
  if (/\bawk\b[^;&\n]*\{\s*print\s+\$1\s*\}/.test(command)) return true;
  return false;
}

/** The refusal for a command, or null. */
export function refusal(command: string): string | null {
  if (!applies(command)) return null;
  if (harmless(command)) return null;
  if (!READERS.test(command) && !command.includes("$(<")) return null;
  return "That command would print a value from the seat file, and a transcript outlives the window that wrote it. " +
    "Read it through the door: `spnutils workspace env show` prints each key and whether it is set, and `spnutils workspace env set <key> --value …` writes one " +
    "that is not secret. A secret is typed by the developer in their own editor (RULE.DEVEX.WORKSPACE.446).";
}

export function checkSeatPrint(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies(command)) return null;
  const why = refusal(command);
  return why ? { deny: `Denied: ${why}` } : null;
}

if (runAlone("seat-print.ts")) {
  try { emit(checkSeatPrint(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
