// What each model turn of a window and of its children cost, written beside the timing log.
//
// Only the agent's own machinery writes this, and only while `telemetry.on` is present: the `Stop`
// event reads the transcript it is handed, from where it stopped last time, and appends one line to
// `.spndevex/.debug/telemetry/usage.jsonl` for each model turn it finds. `plugin cost show` reads the
// lines back, so nobody reads a transcript by hand to learn what a window cost.
//
// ONE LINE IS ONE MODEL TURN: `at`, `session`, `agent` (null for the main window), `workstream`,
// `arc`, `order` (the work tags every timing line carries), `turn` (the message id), and the four
// counts of the turn's own `usage`: `input` (read fresh), `cache_read`, `cache_write` and `output`.
// A transcript streams one turn over several lines, so a turn is counted once, by its id, with the
// counts of its last line.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors.

import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { carryTags, telemetryDir, utcNow, type Facts } from "../../../../plugin-support-lib/src/lib/timing.ts";

export const USAGE_LOG = "usage.jsonl";
const OFFSETS = "usage-offsets.json";

/** One model turn's counts. */
export type Turn = { turn: string; input: number; cache_read: number; cache_write: number; output: number };

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** The model turns in the text of a transcript, once each, in the order they first appear. */
export function turnsIn(text: string): Turn[] {
  const byId = new Map<string, Turn>();
  for (const line of text.split("\n")) {
    if (!line.includes('"usage"')) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; message?: { id?: string; usage?: Record<string, unknown> } };
      const usage = entry.message?.usage;
      if (entry.type !== "assistant" || !usage) continue;
      const id = entry.message?.id ?? `line-${byId.size}`;
      byId.set(id, { turn: id, input: count(usage.input_tokens), cache_read: count(usage.cache_read_input_tokens),
                     cache_write: count(usage.cache_creation_input_tokens), output: count(usage.output_tokens) });
    } catch { /* a torn line is skipped, not a crash */ }
  }
  return [...byId.values()];
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
    if (!dir || !transcript || !existsSync(transcript)) return;
    mkdirSync(dir, { recursive: true });
    const marks = join(dir, OFFSETS);
    let offsets: Record<string, number> = {};
    try { offsets = JSON.parse(readFileSync(marks, "utf8")) ?? {}; } catch { offsets = {}; }
    const read = readFrom(transcript, offsets[transcript] ?? 0);
    if (!read) return;
    const turns = turnsIn(read.text);
    offsets[transcript] = read.next;
    writeFileSync(marks, JSON.stringify(offsets), "utf8");
    if (!turns.length) return;
    let work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: facts.order ?? null };
    try { work = carryTags(dir, facts); } catch { /* the call's own tags stand */ }
    const at = utcNow();
    appendFileSync(join(dir, USAGE_LOG), turns.map((one) => JSON.stringify({
      at, session: facts.session ?? null, agent: facts.agent ?? null, ...work, ...one })).join("\n") + "\n");
  } catch { /* a tool never fails because timing failed */ }
}
