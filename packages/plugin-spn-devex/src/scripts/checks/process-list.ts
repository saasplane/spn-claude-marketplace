#!/usr/bin/env node
// RESTATES: spn-foundation's rule that processes are never listed with `pgrep -f`, `ps -f` or `ps -ww`, since each
// prints the whole command line, and a command line carries credentials. The chapter is the source of truth; a
// rule change is edited there first, then here.
//
// Refuses `pgrep -f` and `ps` with `-f` or `-ww`, and names the forms that print no environment: `pgrep -l <name>`
// to find a process, and `lsof -i :<port>` to find what holds a port.
//
// A REFUSAL, BECAUSE A PRINTED CREDENTIAL CANNOT BE UNPRINTED. Its fast path is one regular expression over the
// command, so every call that does not name `pgrep` or `ps` pays that and stops.
//
//   called by: events/pretooluse.ts, on a Bash call

import { segments } from "../lib/command-reader.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const LISTS = /(?:^|[\s;&|(`])(?:pgrep|ps)(?=\s|$)/;

/** Whether a command could list processes: a regular expression over the text, so every other call stops here. */
export function applies(_path: string, command: string): boolean {
  return LISTS.test(command);
}

/** The short flags of a command's words, one string for each cluster such as `-ef` or `-ww`. */
const clusters = (words: string[]): string[] => words.filter((w) => /^-[A-Za-z]+$/.test(w)).map((w) => w.slice(1));

/** The word of a segment that is the command, past `sudo`. */
function commandOf(words: string[]): string[] {
  return words[0] === "sudo" ? words.slice(1) : words;
}

/** Whether one command prints the whole command line of the processes it lists. */
export function printsEnvironment(words: string[]): boolean {
  const [name, ...rest] = commandOf(words);
  if (name === "pgrep") return clusters(rest).some((c) => c.includes("f"));
  if (name !== "ps") return false;
  if (clusters(rest).some((c) => c.includes("f") || c.includes("ww"))) return true;
  return rest.some((w) => /^[A-Za-z]*ww[A-Za-z]*$/.test(w));
}

export function checkProcessList(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  if (!segments(command).some(printsEnvironment)) return null;
  return { deny:
    "Denied: `pgrep -f`, `ps -f` and `ps -ww` print every process's whole command line, and a command line carries credentials. " +
    "Find a process by name with `pgrep -l <name>`, and what holds a port with `lsof -i :<port>`." };
}

if (runAlone("process-list.ts")) {
  try { emit(checkProcessList(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
