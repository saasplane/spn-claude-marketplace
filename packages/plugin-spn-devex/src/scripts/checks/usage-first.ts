#!/usr/bin/env node
// A command group's usage is read before it is written to. The first writing call of a `spnutils` or `spn-devex` group
// in a window, with no bare or `--help` call of that group before it, is refused: the agent that guesses an option
// writes a wrong record, and the usage says what each command takes. Running the group bare, or with `--help`, is the
// reading, and it is recorded in the window's note (`lib/window.ts`), so it is asked for once for each group.
//
//   called by: events/pretooluse.ts, before a Bash call

import { recordUsage, usageRead } from "../lib/window.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

const PROGRAM = /^(spnutils|spn-devex)\s+([a-z][a-z-]*)((?:\s.*)?)$/;
/** The words of a command that only read, so a call of one writes nothing. */
const READING = /^(?:show|list|status|get|read|check|explain|print|view|doctor|help|look|diff|find|search)$/;

/** The groups of the call that are written to, and the groups it reads the usage of. */
function groupsOf(command: string): { writes: string[]; reads: string[] } {
  const writes: string[] = [];
  const reads: string[] = [];
  for (const part of command.split(/&&|\|\||[;|\n]/)) {
    const found = PROGRAM.exec(part.trim());
    if (!found) continue;
    const group = `${found[1]} ${found[2]}`;
    const words = found[3].trim().split(/\s+/).filter(Boolean);
    if (!words.length || words.includes("--help") || words.includes("-h")) reads.push(group);
    else if (!READING.test(words[0]) && !words[0].startsWith("-")) writes.push(group);
  }
  return { writes, reads };
}

export function checkUsageFirst(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !payload.session_id) return null;
  const root = workspaceRoot(payload.cwd ?? process.cwd());
  if (!root) return null;
  const { writes, reads } = groupsOf(command);
  for (const group of reads) recordUsage(root, payload.session_id, group);
  const unread = [...new Set(writes)].filter((group) => !usageRead(root, payload.session_id, group));
  if (!unread.length) return null;
  return { deny:
    `This is the first \`${unread[0].split(" ")[1]}\` write in this window. Run \`${unread[0]}\` bare and read its usage first, ` +
    `then run this again.` };
}

if (runAlone("usage-first.ts")) {
  try { emit(checkUsageFirst(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
