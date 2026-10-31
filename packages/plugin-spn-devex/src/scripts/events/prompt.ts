#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A session is named for the work it is on.
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// What a session is called (RULE.DEVEX.WORKSPACE.222): the hook for `UserPromptSubmit`. The design and
// its reasons are in `docs/04-capabilities/01-devex/plugin-spn-devex/02-hooks.md` § A session is
// named for the workstream and the arc it works on.
//
//   none        the prompt binds no workstream: nothing is printed, and Claude Code's own name stays
//   workstream  the prompt names exactly one workstream folder that exists, and nothing is recorded
//               for the session: the folder's name, `020-agent-workstream-improvements`
//   arc         the prompt holds a handover block whose `continue:` line names a workstream that
//               exists and an arc of it: the workstream's number, the arc's number and the subject
//               from `arcs/N<nnn>/state.json`: `020-N011 artifacts-by-domain`
//
// A handover's `also open:` names other workstreams that are open beside it, as its own line or inside
// the `continue:` value. Those are recorded as visited, never owned, so the window is not asked to carry
// another window's cards; only what `continue:` names before it is this window's own.
//
// WHILE A GO RUNS, every prompt also carries the mid-run reminder to the agent (`midRunReminder`): a go of the
// window's workstreams with a part running or ready.
//
// A handover names its workstream by the folder or by the number: `025-partner-web, N011` and
// `025 · N011` name the same workstream, because a number is never given to a second workstream. A
// prompt with no handover binds a workstream only by its folder's name, because a three-digit number
// in ordinary text is too often something else.
//
// IT NEVER FAILS A PROMPT. Every error ends in exit 0 with nothing on stdout, and it starts no other
// program.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isDir, readPayload, runAlone, workspaceRoot, type Payload } from "../lib/payload.ts";
import { ARCS, DEVEX, WORKSTREAM_STATES, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { begin, end, span, tagsOf } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { ARC_NAME, WORKSTREAM_NAME, handoverLines } from "./stop.ts";
import { bindNamed, bindVisited, readWindow, windowSet } from "../lib/window.ts";
import { goStandings } from "./orientation.ts";

/** What a session is called, and which of the two forms the name has. */
export type SessionName = { name: string; form: "workstream" | "arc" };

const STATE_FILE = "state.json";

const everyWorkstreamName = (): RegExp => new RegExp(WORKSTREAM_NAME.source, "g");

/** The folder of the workstream with this name, in whichever state holds it, or null where none does. */
function workstreamFolder(root: string, name: string): string | null {
  for (const state of WORKSTREAM_STATES) {
    const folder = join(workstreamsDir(root, state), name);
    if (isDir(folder)) return folder;
  }
  return null;
}

/** The one folder whose name begins `NNN-`, in whichever state holds it, or null where none or several do. */
function workstreamOfNumber(root: string, number: string): string | null {
  const found = new Set<string>();
  for (const state of WORKSTREAM_STATES) {
    let entries: string[];
    try { entries = readdirSync(workstreamsDir(root, state)); } catch { continue; }
    for (const entry of entries) if (entry.startsWith(`${number}-`) && isDir(join(workstreamsDir(root, state), entry))) found.add(entry);
  }
  return found.size === 1 ? [...found][0] : null;
}

/**
 * The workstreams a `continue:` line names, in the order it names them, each with where it stands in
 * the line: by its folder's name, or by a standalone three-digit number. `name` is null where the
 * folder or the number matches no folder.
 */
function workstreamsOfLine(line: string, root: string): Array<{ name: string | null; index: number; whole: boolean }> {
  const either = new RegExp(`${WORKSTREAM_NAME.source}|\\b\\d{3}\\b(?!-)`, "g");
  return [...line.matchAll(either)].map((found) => ({
    name: found[0].length > 3 ? (workstreamFolder(root, found[0]) ? found[0] : null) : workstreamOfNumber(root, found[0]),
    index: found.index ?? 0,
    whole: found[0].length > 3,
  }));
}

/** Where a handover names the other open workstreams, as a line of its own or inside `continue:`. */
const ALSO_OPEN = /\balso open\s*:/i;

/** The part of a `continue:` value that names this window's work: everything before an `also open:` in it. */
function continuedPart(next: string): string {
  const at = next.search(ALSO_OPEN);
  return at < 0 ? next : next.slice(0, at);
}

/**
 * The workstreams a handover names after `also open:`, each once, that exist: on a line of its own, with
 * the lines indented under it, or inside the `continue:` value. A prompt with no `continue:` has none.
 */
export function alsoOpenOf(prompt: string, root: string): string[] {
  const next = handoverLines(prompt).get("continue");
  if (next === undefined) return [];
  const texts: string[] = [];
  if (ALSO_OPEN.test(next)) texts.push(next.slice(next.search(ALSO_OPEN)));
  const lines = prompt.split("\n");
  lines.forEach((line, index) => {
    const at = line.search(ALSO_OPEN);
    if (at < 0) return;
    const held = [line.slice(at)];
    for (const after of lines.slice(index + 1)) { if (!/^\s+\S/.test(after)) break; held.push(after.trim()); }
    texts.push(held.join(" "));
  });
  const named = texts.flatMap((text) => workstreamsOfLine(text, root).map((found) => found.name))
    .filter((name): name is string => name !== null);
  return [...new Set(named)];
}

/** Every workstream folder a text names that exists, each one once, in the order the text names them. */
function workstreamsNamed(text: string, root: string): string[] {
  const named: string[] = [];
  for (const found of text.matchAll(everyWorkstreamName()))
    if (!named.includes(found[0]) && workstreamFolder(root, found[0])) named.push(found[0]);
  return named;
}

/**
 * The subject an arc carries: the `subject` of `arcs/N011/state.json`, such as `artifacts-by-domain`.
 * Null where the arc has no such file or its subject is not a non-empty text.
 */
function arcSubject(folder: string, arc: string): string | null {
  try {
    const held = JSON.parse(readFileSync(join(folder, ARCS, arc, STATE_FILE), "utf8")) as { subject?: unknown } | null;
    return held && typeof held.subject === "string" && held.subject ? held.subject : null;
  } catch { return null; }
}

/**
 * The name a handover's `continue:` line gives, or null where the first workstream it names has no
 * folder.
 *
 * THE FIRST WORKSTREAM THE LINE NAMES IS THE ONE THE WINDOW WORKS ON, and the arc is read only from
 * the text before a second workstream. The reload form reads `open workstream <next>; <this> N<nnn>
 * waits on it`: its arc belongs to the workstream that waits, so the window that opens `<next>` has
 * no arc to start on and takes the workstream form. An arc with no `state.json` subject in the
 * workstream's `arcs/N<nnn>/` folder has nothing to show, and it gives the workstream form too.
 */
function handoverName(next: string, root: string): SessionName | null {
  const line = continuedPart(next);
  const named = workstreamsOfLine(line, root);
  const workstream = named[0]?.name;
  if (!workstream) return null;
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
 * The workstreams a prompt makes this window OWN (RULE.DEVEX.WORKSPACE.236), and how.
 *
 * A handover owns the workstream its `continue:` line opens with, and each other one the line names by its whole
 * folder name, before any `also open:`: the reload form names two, and a window that continues one while the other
 * waits on it owns both. A bare number after the first, such as "waits for 035", is a mention and owns nothing. What
 * `also open:` names is visited, never owned (`alsoOpenOf`). A prompt with no handover owns
 * a workstream only where it names exactly one workstream folder that exists, and only while the window
 * owns none yet: a later prompt often names a second workstream to compare it or cite it.
 */
export function bindingsOf(prompt: string, root: string, session: string): Array<{ name: string; by: "prompt" | "handover" }> {
  const next = handoverLines(prompt).get("continue");
  if (next !== undefined) {
    const owned = [...new Set(workstreamsOfLine(continuedPart(next), root).filter((found, at) => at === 0 || found.whole).map((found) => found.name))]
      .filter((name): name is string => name !== null);
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
  return key ? join(sessionDir(root, key), "name.json") : null;
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
    for (const visited of alsoOpenOf(prompt, root)) bindVisited(root, session, visited);
  } catch { /* a binding that cannot be written is a window that hears less */ }
  const reminder = midRunReminder(root, windowSet(root, session));
  const file = recordFile(root, session);
  let give = file ? nameToGive(sessionName(prompt, root), readRecord(file)) : null;
  if (file && give) {
    try { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(give), "utf8"); } catch { give = null; }
  }
  if (!give && !reminder) return "";
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit",
    ...(give ? { sessionTitle: give.name } : {}), ...(reminder ? { additionalContext: reminder } : {}) } });
}

/**
 * The mid-run reminder: while a go of this window's workstreams has a part running or ready, the developer's
 * message is read for what it changes before anything else. Empty while no go runs.
 */
export function midRunReminder(root: string, mine: Set<string>): string {
  if (!mine.size) return "";
  let gos: ReturnType<typeof goStandings> = [];
  try { gos = goStandings(root, mine).filter((go) => go.running.length || go.ready.length); } catch { return ""; }
  if (!gos.length) return "";
  return `A go is running: ${gos.map((go) => `${go.workstream}/${go.lead} (${go.running.length} running, ${go.ready.length} ready)`).join(" · ")}. ` +
    "Read this message for what it changes before you go on. An idea or a later want is a suggestion, and nothing that runs changes. " +
    "A change to what is being built follows the steps of a change mid-run: what is running finishes, the parts it touches are held, " +
    "the entries and the preview take the change, the plan is derived again with `workstream go write`, and the full run comes after.";
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
