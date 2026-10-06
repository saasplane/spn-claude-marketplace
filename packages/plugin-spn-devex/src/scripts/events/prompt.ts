#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A session is named for the work it is on.
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// What a session is called (RD.DEVEX.WORKSPACE.222): the hook for `UserPromptSubmit`. The design and
// its reasons are in `docs/04-capabilities/01-devex/plugin-spn-devex/02-hooks.md` § A session is
// named for the workstream and the arc it works on.
//
//   none        the prompt binds no workstream: nothing is printed, and Claude Code's own name stays
//   workstream  the prompt names exactly one workstream folder that exists, and nothing is recorded
//               for the session: the folder's name, `020-agent-workstream-improvements`
//   arc         the prompt holds a handover block whose `continue:` line names a workstream folder
//               that exists and an arc with a file in it: `020-N011 artifacts-by-domain`
//
// IT NEVER FAILS A PROMPT. Every error ends in exit 0 with nothing on stdout, and it starts no other
// program.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isDir, readPayload, runAlone, workspaceRoot, type Payload } from "../lib/payload.ts";
import { ARCS, DEVEX, WORKSTREAM_STATES, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { begin, end, span, tagsOf } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { ARC_NAME, WORKSTREAM_NAME, handoverLines } from "./stop.ts";
import { bindNamed, readWindow } from "../lib/window.ts";

/** What a session is called, and which of the two forms the name has. */
export type SessionName = { name: string; form: "workstream" | "arc" };

// The folder under `.spndevex/` where the plugin records what it did, and the folder of names in it.
const DEBUG = ".debug";
const NAMES = "names";
const ARC_FILE_END = ".md";

const everyWorkstreamName = (): RegExp => new RegExp(WORKSTREAM_NAME.source, "g");

/** The folder of the workstream with this name, in whichever state holds it, or null where none does. */
function workstreamFolder(root: string, name: string): string | null {
  for (const state of WORKSTREAM_STATES) {
    const folder = join(workstreamsDir(root, state), name);
    if (isDir(folder)) return folder;
  }
  return null;
}

/** Every workstream folder a text names that exists, each one once, in the order the text names them. */
function workstreamsNamed(text: string, root: string): string[] {
  const named: string[] = [];
  for (const found of text.matchAll(everyWorkstreamName()))
    if (!named.includes(found[0]) && workstreamFolder(root, found[0])) named.push(found[0]);
  return named;
}

/**
 * The subject an arc's file name carries: `artifacts-by-domain` for `N011-artifacts-by-domain.md`.
 * Null where the workstream holds no file for that arc.
 */
function arcSubject(folder: string, arc: string): string | null {
  const opening = `${arc}-`;
  let files: string[];
  try { files = readdirSync(join(folder, ARCS)).sort(); } catch { return null; }
  const file = files.find((name) => name.startsWith(opening) && name.endsWith(ARC_FILE_END)
    && name.length > opening.length + ARC_FILE_END.length);
  return file ? file.slice(opening.length, -ARC_FILE_END.length) : null;
}

/**
 * The name a handover's `continue:` line gives, or null where the first workstream it names has no
 * folder.
 *
 * THE FIRST WORKSTREAM THE LINE NAMES IS THE ONE THE WINDOW WORKS ON, and the arc is read only from
 * the text before a second workstream. The reload form reads `open workstream <next>; <this> N<nnn>
 * waits on it`: its arc belongs to the workstream that waits, so the window that opens `<next>` has
 * no arc to start on and takes the workstream form. An arc with no file in the workstream's `arcs/`
 * folder has no subject to show, and it gives the workstream form too.
 */
function handoverName(line: string, root: string): SessionName | null {
  const named = [...line.matchAll(everyWorkstreamName())];
  if (!named.length) return null;
  const workstream = named[0][0];
  const folder = workstreamFolder(root, workstream);
  if (!folder) return null;
  const arc = line.slice(0, named.length > 1 ? named[1].index : line.length).match(ARC_NAME)?.[0];
  const subject = arc ? arcSubject(folder, arc) : null;
  if (!arc || !subject) return { name: workstream, form: "workstream" };
  return { name: `${workstream.slice(0, 3)}-${arc} ${subject}`, form: "arc" };
}

/**
 * The name a prompt gives a session in this workspace, or null where the prompt binds no workstream.
 *
 * A handover block is read first, by its `continue:` line. A prompt with no handover names the
 * session only where it names exactly one workstream folder that exists: two folders say nothing
 * about which of them the window works on, so they bind neither.
 */
export function sessionName(prompt: string, root: string): SessionName | null {
  const next = handoverLines(prompt).get("continue");
  const handed = next === undefined ? null : handoverName(next, root);
  if (handed) return handed;
  const named = workstreamsNamed(prompt, root);
  return named.length === 1 ? { name: named[0], form: "workstream" } : null;
}

/**
 * The workstreams a prompt makes this window OWN (RD.DEVEX.WORKSPACE.236), and how.
 *
 * A handover owns every workstream its `continue:` line names that exists: the reload form names two,
 * and a window that continues one while the other waits on it owns both. A prompt with no handover owns
 * a workstream only where it names exactly one workstream folder that exists, and only while the window
 * owns none yet: a later prompt often names a second workstream to compare it or cite it.
 */
export function bindingsOf(prompt: string, root: string, session: string): Array<{ name: string; by: "prompt" | "handover" }> {
  const next = handoverLines(prompt).get("continue");
  if (next !== undefined) {
    const owned = [...new Set([...next.matchAll(everyWorkstreamName())].map((found) => found[0]))]
      .filter((name) => workstreamFolder(root, name));
    if (owned.length) return owned.map((name) => ({ name, by: "handover" as const }));
  }
  if (Object.values(readWindow(root, session).workstreams).some((one) => one.tie === "owns")) return [];
  const named = workstreamsNamed(prompt, root);
  return named.length === 1 ? [{ name: named[0], by: "prompt" }] : [];
}

/**
 * The name to give the session, or null where the script stays silent.
 *
 * @param worked    the name the prompt gives, from `sessionName`
 * @param recorded  the last name this script gave the session, or null where it gave none
 */
export function nameToGive(worked: SessionName | null, recorded: SessionName | null): SessionName | null {
  if (!worked) return null;
  // The same name again is not a change, so a name the developer typed over it is left alone.
  if (recorded && recorded.name === worked.name) return null;
  // The workstream form is given once. Only a handover moves a session that already has a name.
  if (recorded && worked.form === "workstream") return null;
  return worked;
}

/** The file that holds a session's last given name, or null for a session with no usable id. */
export function recordFile(root: string, session: string): string | null {
  const key = session.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return key ? join(root, DEVEX, DEBUG, NAMES, `${key}.json`) : null;
}

/** The name a record file holds, or null where the file is absent or holds something else. */
export function readRecord(file: string): SessionName | null {
  try {
    const held = JSON.parse(readFileSync(file, "utf8")) as Partial<SessionName> | null;
    if (!held || typeof held.name !== "string" || !held.name) return null;
    return held.form === "workstream" || held.form === "arc" ? { name: held.name, form: held.form } : null;
  } catch { return null; }
}

/**
 * What the hook prints for one prompt: the answer that names the session, or the empty string.
 *
 * The record is written before the answer is returned. A name that cannot be recorded is not given,
 * because the next prompt would give it again and write over a name the developer typed.
 */
export function answerFor(payload: Payload, start: string): string {
  const session = typeof payload.session_id === "string" ? payload.session_id : "";
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
  if (!session || !prompt) return "";
  const root = workspaceRoot(start);
  if (!root) return "";
  // THE WINDOW'S BINDING, before the name: a window that asks before it writes is asked its cards.
  try {
    for (const bound of bindingsOf(prompt, root, session)) bindNamed(root, session, bound.name, bound.by);
  } catch { /* a binding that cannot be written is a window that hears less */ }
  const file = recordFile(root, session);
  if (!file) return "";
  const give = nameToGive(sessionName(prompt, root), readRecord(file));
  if (!give) return "";
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(give), "utf8");
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", sessionTitle: give.name } });
}

if (runAlone("prompt.ts")) {
  let answer = "";
  try {
    const payload = readPayload();
    const start = (typeof payload.cwd === "string" && payload.cwd) || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    begin({ script: "spn-devex", event: "UserPromptSubmit", tool: null,
            session: typeof payload.session_id === "string" ? payload.session_id : null, ...tagsOf(payload),
            process: { group: "events", action: "prompt" } }, start);
    answer = span({ group: "prompt", action: "name" }, () => answerFor(payload, start));
  } catch { answer = ""; }
  end();
  if (answer) console.log(answer);
  process.exit(0);
}
