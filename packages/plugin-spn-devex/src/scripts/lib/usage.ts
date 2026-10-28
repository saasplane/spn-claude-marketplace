// What each model turn of a window and of its children cost, written beside the timing log.
//
// Only the agent's own machinery writes this, and only while the `telemetry` switch is on: the `Stop`
// event reads the transcript it is handed, from where it stopped last time, and appends one line to
// `.spndevex/.debug/telemetry/usage.jsonl` for each model turn it finds. `debug cost show` reads the
// lines back, so nobody reads a transcript by hand to learn what a window cost.
//
// ONE LINE IS ONE MODEL TURN: `at`, `session`, `agent` (null for the main window), `workstream`,
// `arc`, `order`, `row` (the work tags every timing line carries), `turn` (the message id), `model`
// (the reply's own), `ms` (the model's own time before the reply: from the stamp of the transcript
// line before it to the reply's own stamp, null where there is no line before it), and the four
// counts of the turn's own `usage`: `input` (read fresh), `cache_read`, `cache_write` and `output`.
// A transcript streams one turn over several lines, so a turn is counted once, by its id, with the
// counts of its last line and the `model` and `ms` of its first.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors.

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { appendLog, sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { carryTags, telemetryDir, utcNow, type Facts } from "../../../../plugin-support-lib/src/lib/timing.ts";

export const USAGE_LOG = "usage.jsonl";
const OFFSETS = "usage-offsets.json";

/** One model turn: its model, the model's own time before it, and its counts. */
export type Turn = { turn: string; model: string | null; ms: number | null; input: number; cache_read: number; cache_write: number; output: number };

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/**
 * The model turns in the text of a transcript, once each, in the order they first appear. `before` is
 * the stamp of the line that precedes the text, so the first reply's `ms` can be read too.
 */
export function turnsIn(text: string, before: number | null = null): Turn[] {
  const byId = new Map<string, Turn>();
  let previous = before;
  for (const line of text.split("\n")) {
    if (!line.includes('"user"') && !line.includes('"assistant"')) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; timestamp?: string; message?: { id?: string; model?: string; usage?: Record<string, unknown> } };
      if (entry.type !== "assistant" && entry.type !== "user") continue;
      const stamp = Date.parse(String(entry.timestamp ?? ""));
      const was = previous;
      if (!Number.isNaN(stamp)) previous = stamp;
      const usage = entry.message?.usage;
      if (entry.type !== "assistant" || !usage) continue;
      const id = entry.message?.id ?? `line-${byId.size}`;
      const first = byId.get(id);
      byId.set(id, { turn: id, model: first ? first.model : typeof entry.message?.model === "string" ? entry.message.model : null,
                     ms: first ? first.ms : !Number.isNaN(stamp) && was !== null ? Math.max(0, stamp - was) : null,
                     input: count(usage.input_tokens), cache_read: count(usage.cache_read_input_tokens),
                     cache_write: count(usage.cache_creation_input_tokens), output: count(usage.output_tokens) });
    } catch { /* a torn line is skipped, not a crash */ }
  }
  return [...byId.values()];
}

/** The stamp of the last user or assistant line in the text, or `before` where it holds none. */
function lastStamp(text: string, before: number | null): number | null {
  let last = before;
  for (const line of text.split("\n")) {
    if (!line.includes('"user"') && !line.includes('"assistant"')) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; timestamp?: string };
      const stamp = Date.parse(String(entry.timestamp ?? ""));
      if ((entry.type === "assistant" || entry.type === "user") && !Number.isNaN(stamp)) last = stamp;
    } catch { /* a torn line is skipped */ }
  }
  return last;
}

/**
 * What the window held at its last model turn: what was sent fresh, what was written to the cache and
 * what was read from it. Zero where the text holds no turn.
 */
export function windowSize(text: string): number {
  const last = turnsIn(text).at(-1);
  return last ? last.input + last.cache_read + last.cache_write : 0;
}

/** Whole lines of `file` from byte `from`, and the byte the next read starts at. */
function readFrom(file: string, from: number): { text: string; next: number } | null {
  const size = statSync(file).size;
  if (size < from) from = 0;
  const buffer = Buffer.alloc(size - from);
  const fd = openSync(file, "r");
  try { readSync(fd, buffer, 0, buffer.length, from); } finally { closeSync(fd); }
  const text = buffer.toString("utf8");
  const end = text.lastIndexOf("\n") + 1;
  return { text: text.slice(0, end), next: from + Buffer.byteLength(text.slice(0, end)) };
}

/**
 * Append the turns a transcript gained since this was last called for it. A no-op while recording is
 * off, and when the transcript cannot be read. Never throws.
 */
export function recordUsage(root: string | null, facts: Facts, transcript: string | undefined): void {
  try {
    const dir = telemetryDir(root);
    const session = typeof facts.session === "string" && facts.session ? facts.session : null;
    if (!root || !dir || !session || !transcript || !existsSync(transcript)) return;
    const marks = join(sessionDir(root, session), OFFSETS);
    mkdirSync(dirname(marks), { recursive: true });
    // The byte each transcript was read to, and (under `<transcript>@stamp`) the stamp of the last line read.
    let offsets: Record<string, number> = {};
    try { offsets = JSON.parse(readFileSync(marks, "utf8")) ?? {}; } catch { offsets = {}; }
    const read = readFrom(transcript, offsets[transcript] ?? 0);
    if (!read) return;
    const before = typeof offsets[`${transcript}@stamp`] === "number" && (offsets[transcript] ?? 0) > 0 ? offsets[`${transcript}@stamp`] : null;
    const turns = turnsIn(read.text, before);
    offsets[transcript] = read.next;
    const last = lastStamp(read.text, before);
    if (last !== null) offsets[`${transcript}@stamp`] = last;
    writeFileSync(marks, JSON.stringify(offsets), "utf8");
    if (!turns.length) return;
    let work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: facts.agent ? facts.order ?? null : null, row: facts.row ?? null };
    try { work = carryTags(root, facts); } catch { /* the call's own tags stand */ }
    const at = utcNow();
    appendLog(join(dir, USAGE_LOG), turns.map((one) => JSON.stringify({
      at, session: facts.session ?? null, agent: facts.agent ?? null, ...work,
      turn: one.turn, model: one.model, ms: one.ms,
      input: one.input, cache_read: one.cache_read, cache_write: one.cache_write, output: one.output })).join("\n"));
  } catch { /* a tool never fails because timing failed */ }
}
