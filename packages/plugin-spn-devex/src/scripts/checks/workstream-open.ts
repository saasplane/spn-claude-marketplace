#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.243 and RULE.DEVEX.WORKSPACE.308, which say creating a workstream
// is always the developer's decision, taken on a block that says six things back, and that its folder carries
// the next free number. The chapters are the source of truth; a rule change is edited there first, then here.
//
// Refuses a `mkdir` of a workstream folder, directly under `workstreams/open/` or `workstreams/backlog/`, when
// the folder's number is not the next free one across open, backlog and closed, or when a subagent makes it:
// a child never holds the developer's yes. A folder with the right number from the main window is let through
// with a note that the yes must be on the developer's words.
//
// A REFUSAL ON THE NUMBER, BECAUSE A NUMBER SPENT TWICE CANNOT BE TAKEN BACK. Two folders with one number
// make every later reference ambiguous. Its fast path is one regular expression over the command, so every
// call that is not a `mkdir` into a workstreams folder pays that and stops.
//
//   called by: events/pretooluse.ts, on a Bash call

import { isAbsolute, resolve } from "node:path";
import { segments } from "../lib/command-reader.ts";
import { emit, listdir, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { DEVEX, WORKSTREAM_STATES, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

const MKDIR = /\bmkdir\b[^|;&\n]*workstreams\//;
const FOLDER = new RegExp(`^(.*)/${DEVEX.replace(/\./g, "\\.")}/workstreams/(open|backlog)/([^/]+)/?$`);

/** Whether a command could make a workstream folder: a regular expression over the text, so every other call stops here. */
export function applies(_path: string, command: string): boolean {
  return MKDIR.test(command);
}

/** The next free workstream number, three digits, across open, backlog and closed. */
export function nextFree(root: string): string {
  let top = 0;
  for (const state of WORKSTREAM_STATES)
    for (const entry of listdir(workstreamsDir(root, state))) {
      const found = /^(\d+)-/.exec(entry);
      if (found) top = Math.max(top, Number(found[1]));
    }
  return String(top + 1).padStart(3, "0");
}

/** The workstream folders a command makes: the workspace, the state and the folder's name. */
export function madeFolders(command: string, cwd: string): Array<{ root: string; state: string; name: string }> {
  const made: Array<{ root: string; state: string; name: string }> = [];
  for (const words of segments(command)) {
    if (words[0] !== "mkdir") continue;
    for (const word of words.slice(1)) {
      if (word.startsWith("-")) continue;
      const found = FOLDER.exec(resolve(isAbsolute(word) ? word : resolve(cwd, word)));
      if (found) made.push({ root: found[1], state: found[2], name: found[3] });
    }
  }
  return made;
}

export function checkWorkstreamOpen(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command || !applies("", command)) return null;
  for (const made of madeFolders(command, payload.cwd ?? process.cwd())) {
    const free = nextFree(made.root);
    const number = /^(\d+)-/.exec(made.name)?.[1];
    if (number !== free)
      return { deny:
        `Denied: \`${made.name}\` does not carry the next free workstream number, ${free}. Name it \`${free}-<subject>\` ` +
        `and make it under \`${DEVEX}/workstreams/${made.state}/\` (RULE.DEVEX.WORKSPACE.308); \`spnutils workspace status\` prints the next free number.` };
    if (payload.agent_id)
      return { deny:
        `Denied: creating a workstream is always the developer's decision, and a subagent never holds their yes. ` +
        `Hand back, and let the window that spoke with the developer make \`${made.name}\` (RULE.DEVEX.WORKSPACE.243).` };
    return { note:
      `Creating \`${made.name}\` needs the developer's yes to a block that says back the subject, the goal, why now, what it reaches, ` +
      `what they want to see first and the limits (RULE.DEVEX.WORKSPACE.308). \`workstream open\` takes that block and the next number; ` +
      `if you have no yes, remove the folder and ask.` };
  }
  return null;
}

if (runAlone("workstream-open.ts")) {
  try { emit(checkWorkstreamOpen(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
