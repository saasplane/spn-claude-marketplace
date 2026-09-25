// What every ported hook shares: the event it is handed, the verdict it gives back, and the two
// filesystem walks all of them do.
//
// WHY A VERDICT IS A RETURN VALUE. The Python checks each printed their JSON and called
// `sys.exit`, so the dispatcher had to redirect stdout, swap `sys.argv`, and catch `SystemExit`
// separately from `Exception` — and the one time it did not, the seat guard silently stopped
// refusing. A check that RETURNS what it decided cannot lose a refusal that way. Each file still
// runs alone: `emit` prints the same JSON the Python did, on the same stdout.
//
// EXIT 0, ALWAYS. A refusal is the documented PreToolUse decision on stdout, never a non-zero
// exit. A hook that crashes takes every other gate in the chain down with it.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const DEVEX = ".spndevex";

export type ToolInput = {
  file_path?: string;
  command?: string;
  content?: string;
  new_string?: string;
  path?: string;
  pattern?: string;
  glob?: string;
};

export type Payload = {
  tool_name?: string;
  tool_input?: ToolInput;
  cwd?: string;
  session_id?: string;
  last_assistant_message?: string;
};

/** What a check decided. `deny` refuses the call; `note` is advice the turn reads. */
export type Verdict = { deny?: string; note?: string } | null;

// The named entities this corpus actually writes, plus every numeric form. An entity nobody here
// uses is LEFT ALONE rather than blanked, which is what Python's `html.unescape` does — blanking it
// would silently delete a word, and a word count is what several of these checks measure.
const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", middot: "·", hellip: "…", bull: "•", dagger: "†",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  laquo: "«", raquo: "»", times: "×", divide: "÷", deg: "°", plusmn: "±",
  rarr: "→", larr: "←", uarr: "↑", darr: "↓", harr: "↔", check: "✓", cross: "✗",
  copy: "©", reg: "®", trade: "™", sect: "§", para: "¶", dash: "‐", minus: "−",
  ensp: " ", emsp: " ", thinsp: " ", shy: "", zwj: "", zwnj: "",
};

/** HTML entities resolved the way a person reads them. An unknown entity is left as written. */
export function unescape(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z][a-z0-9]*);/gi, (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole);
}

/** A file's text, or the empty string. A file that cannot be read is never a finding. */
export function read(path: string): string {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
}

/** The folder holding `.spndevex`, walked up from where the caller stood. */
export function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, DEVEX)) && statSync(join(path, DEVEX)).isDirectory()) return path;
      const up = dirname(path);
      if (up === path) return null;
      path = up;
    }
  } catch { return null; }
}

/** Visible entries of a folder, sorted, or nothing. */
export function listdir(path: string): string[] {
  try { return readdirSync(path).filter((name) => !name.startsWith(".")).sort(); }
  catch { return []; }
}

export function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

export function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}

/** The PreToolUse event on stdin. Unparsable input is not a finding — it allows. */
export function readPayload(): Payload {
  try { return JSON.parse(readFileSync(0, "utf8") || "{}") as Payload; } catch { return {}; }
}

/**
 * Print one verdict in the shape the harness reads.
 *
 * `additionalContext` is what the agent reads and `systemMessage` is the developer's pane — a
 * PreToolUse hook emitting only the latter is silent to the agent, which is how a gate comes to
 * fire all day and change nothing.
 */
export function emit(verdict: Verdict): void {
  if (!verdict) return;
  const specific: Record<string, unknown> = { hookEventName: "PreToolUse" };
  const message = verdict.note ?? verdict.deny ?? "";
  if (verdict.note) specific.additionalContext = verdict.note;
  if (verdict.deny) {
    specific.permissionDecision = "deny";
    specific.permissionDecisionReason = verdict.deny;
  }
  console.log(JSON.stringify({ systemMessage: message, hookSpecificOutput: specific }));
}

/** True when this file was the one node was asked to run, rather than imported by the dispatcher. */
export function runAlone(name: string): boolean {
  return Boolean(process.argv[1] && process.argv[1].endsWith(name));
}
