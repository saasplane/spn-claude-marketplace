// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.058 — an arc carries a status, and it is one of a closed set of six —
// and RULE.DEVEX.WORKSPACE.307, which stores the developer's words and works out the rest from the steps.
// The register rows are the source of truth. A rule change is edited there first, then here.
//
// THE SET, STATED ONCE IN THE PLUGIN. The schema (`lib/workstream-schema.ts`) takes the stored statuses from here,
// so `workstream arc edit --status` refuses a word outside them, and `workstream state check` names a `state.json`
// that holds one. What an arc reads as is worked out by one owner, `arcStatus` in `lib/workstream.ts`, which every
// reader asks.
//
// THE GO'S WORDS ARE THE DEVELOPER'S (RULE.DEVEX.WORKSPACE.058, .307). `checkArcStatus` refuses a move to DECIDED whose
// quoted words appear in no user prompt of this window and in no log line of the workstream: a go carries what the
// developer typed, and words the agent wrote itself are a plan, never an agreement.
//
//   called by: events/pretooluse.ts, before a Bash call

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { segments } from "../lib/command-reader.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** The six statuses, in the order the register states them. The last three are terminal. */
export const STATUSES = ["PROPOSED", "DECIDED", "RUNNING", "LANDED", "CARRIED", "DROPPED"] as const;
export type Status = (typeof STATUSES)[number];
/**
 * The statuses an arc's data stores: the developer's words. `RUNNING` is never stored, and `LANDED` is stored only
 * where no step works it out: the review-fixes arc at the close, and an arc that landed under the version 1 rules.
 */
export const STORED_STATUSES = ["PROPOSED", "DECIDED", "LANDED", "CARRIED", "DROPPED"] as const;
export const TERMINAL: ReadonlySet<string> = new Set(["LANDED", "CARRIED", "DROPPED"]);

/**
 * Whether a status is past `DECIDED` in the order of the set: `RUNNING` or terminal. A word outside the set is past
 * nothing.
 */
export function pastDecided(status: string | null): boolean {
  const order = STATUSES as readonly string[];
  return status !== null && order.indexOf(status) > order.indexOf("DECIDED");
}

/** What a person typed in one transcript line, or null where the line is not a user prompt. */
function promptOf(line: string): string | null {
  try {
    const row = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
    if (row.type !== "user") return null;
    const content = row.message?.content;
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return null;
    return content.map((part: { type?: string; text?: string }) => (part.type === "text" ? part.text ?? "" : "")).join(" ");
  } catch { return null; }
}

/** Words compared as the developer would read them: case, spacing and edge punctuation do not tell two phrasings apart. */
const plain = (text: string): string => text.toLowerCase().replace(/\s+/g, " ").replace(/^[\s"'“”‘’·:—.-]+|[\s"'“”‘’·:—.-]+$/g, "");

/** The words a go note quotes: each quoted piece where it has any, else the note after a leading `the developer:`. */
function quotedWords(note: string): string[] {
  const pieces = [...note.matchAll(/"([^"]+)"|'([^']+)'|“([^”]+)”/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  const words = pieces.length ? pieces : [note.replace(/^(the )?developer( said| typed)?\s*[:—-]\s*/i, "")];
  return words.map(plain).filter(Boolean);
}

/** The status and note a `workstream arc edit` call sets, with its arc reference; null where the call is not a move to DECIDED with a note. */
function goOf(command: string): { ref: string; note: string } | null {
  for (const words of segments(command)) {
    const at = words.findIndex((word, index) => word === "workstream" && words[index + 1] === "arc" && words[index + 2] === "edit");
    if (at < 0) continue;
    const value = (flag: string): string | null => {
      const index = words.findIndex((word, i) => i > at && (word === flag || word.startsWith(`${flag}=`)));
      if (index < 0) return null;
      return words[index].includes("=") ? words[index].slice(flag.length + 1) : words[index + 1] ?? null;
    };
    const note = value("--note");
    if (value("--status") !== "DECIDED" || !note) continue;
    return { ref: words[at + 3] ?? "", note };
  }
  return null;
}

/** Every note the logs of the workstream a reference names hold, or of every open workstream where it names none. */
function loggedWords(root: string, ref: string): string[] {
  const named = ref.includes("/") ? ref.slice(0, ref.lastIndexOf("/")) : null;
  const folders: string[] = [];
  for (const state of ["open", "backlog", "closed"] as const) {
    const base = workstreamsDir(root, state);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      if (named === null ? state === "open" : entry === named || entry.startsWith(`${named}-`)) folders.push(join(base, entry));
    }
  }
  const notes: string[] = [];
  for (const folder of folders) {
    const arcs = join(folder, "arcs");
    if (!existsSync(arcs)) continue;
    for (const arc of readdirSync(arcs)) {
      try {
        for (const line of readFileSync(join(arcs, arc, "log.jsonl"), "utf8").split("\n")) {
          try { const note = (JSON.parse(line) as { note?: unknown }).note; if (typeof note === "string") notes.push(note); } catch { /* a torn line says nothing */ }
        }
      } catch { /* an arc with no log says nothing */ }
    }
  }
  return notes;
}

/** Refuse a move to DECIDED whose quoted words the developer never typed in this window and the workstream never logged. */
export function checkArcStatus(payload: Payload & { transcript_path?: string }): Verdict {
  try {
    if (payload.tool_name !== "Bash") return null;
    const go = payload.tool_input?.command ? goOf(payload.tool_input.command) : null;
    if (!go || !payload.transcript_path) return null;
    const root = workspaceRoot(payload.cwd ?? process.cwd());
    if (!root) return null;
    const said: string[] = [];
    for (const line of readFileSync(payload.transcript_path, "utf8").split("\n")) {
      const prompt = promptOf(line);
      if (prompt !== null) said.push(plain(prompt));
    }
    const logged = loggedWords(root, go.ref).map(plain);
    const missing = quotedWords(go.note).find((words) => ![...said, ...logged].some((text) => text.includes(words)));
    if (!missing) return null;
    return { deny:
      `The go on ${go.ref.slice(go.ref.lastIndexOf("/") + 1) || "the arc"} quotes '${missing}', and the developer typed no such words. ` +
      `Quote their words as they wrote them (RULE.DEVEX.WORKSPACE.058, RULE.DEVEX.WORKSPACE.307).` };
  } catch {
    return null;                                    // a check that throws is skipped, never fatal
  }
}

if (runAlone("arc-status.ts")) {
  try { emit(checkArcStatus(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
