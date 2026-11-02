// What each model turn of a window and of its children cost, written beside the timing log.
//
// Only the agent's own machinery writes this, and only while the `telemetry` switch is on: the `Stop`
// event reads the transcript it is handed, from where it stopped last time, and appends one line to
// `.spndevex/.debug/telemetry/usage.jsonl` for each model turn it finds. `debug cost show` reads the
// lines back, so nobody reads a transcript by hand to learn what a window cost.
//
// ONE ROW IS ONE MODEL TURN, a `TURN` of the telemetry row family (the workspace construct's
// `SPDevExWorkspaceTelemetryRow`): the base `v` (1), `mtype`, `id` (the reply's message id), `at` (when the
// turn started, UTC to the second), `ms` (the model's own time before the reply), `event` (`Stop` or
// `SubagentStop`), then the head `session`, `agent`, `workstream`, `arc`, `part`, `skill`, `stage`, `work`, `retryOf`, and
// the turn's own `model` and `tokens` { in, out, cacheRead, cacheWrite }. A transcript streams one turn over
// several lines, so a turn is counted once, by its id, with the counts of its last line and the `model` and
// `ms` of its first.
//
// ONE CLOCK. A reply's `ms` runs from the latest stamp of any user or assistant line before it to the reply's own
// stamp, and an earlier stamp never moves that back: a line copied in later with an older time moves nothing.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors.

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { appendLog, sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { carryTags, telemetryDir, workOfPart, type Facts } from "../../../../plugin-support-lib/src/lib/timing.ts";
import {
  ARC_PATTERN, PART_PATTERN, WORKSTREAM_PATTERN, SPDevExAgentSkillType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType,
  SPDevExWorkspaceTelemetryVersionType, SPDevExStageType, SPDevExWorkstreamWorkType, held, known, stageOf,
} from "../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { workstreamPrefixSource } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

export const USAGE_LOG = "usage.jsonl";
const OFFSETS = "usage-offsets.json";
/** How much of a helper's transcript head is read to find the order its first prompt names. */
const HEAD_BYTES = 256 * 1024;

/**
 * One model turn: its message id, by which it is counted once, its own stamp, its model, and the model's own time
 * before it, from the latest stamp of any user or assistant line before it, which a line stamped earlier never moves
 * back, to the reply's own stamp.
 */
export type Turn = { id: string; at: string | null; model: string | null; ms: number | null;
                     tokens: { in: number; out: number; cacheRead: number; cacheWrite: number } };

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/**
 * The model turns in the text of a transcript, once each, in the order they first appear. `before` is
 * the latest stamp before the text, so the first reply's `ms` can be read too.
 */
export function turnsIn(text: string, before: number | null = null): Turn[] {
  const byId = new Map<string, Turn>();
  let latest = before;
  for (const line of text.split("\n")) {
    if (!line.includes('"user"') && !line.includes('"assistant"')) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; timestamp?: string; message?: { id?: string; model?: string; usage?: Record<string, unknown> } };
      if (entry.type !== "assistant" && entry.type !== "user") continue;
      const stamp = Date.parse(String(entry.timestamp ?? ""));
      const was = latest;
      if (!Number.isNaN(stamp)) latest = latest === null ? stamp : Math.max(latest, stamp);
      const usage = entry.message?.usage;
      if (entry.type !== "assistant" || !usage) continue;
      const id = entry.message?.id ?? `line-${byId.size}`;
      const first = byId.get(id);
      byId.set(id, { id, at: first ? first.at : !Number.isNaN(stamp) ? new Date(stamp).toISOString() : null,
                     model: first ? first.model : typeof entry.message?.model === "string" ? entry.message.model : null,
                     ms: first ? first.ms : !Number.isNaN(stamp) && was !== null ? Math.max(0, stamp - was) : null,
                     tokens: { in: count(usage.input_tokens), out: count(usage.output_tokens), cacheRead: count(usage.cache_read_input_tokens),
                               cacheWrite: count(usage.cache_creation_input_tokens) } });
    } catch { /* a torn line is skipped, not a crash */ }
  }
  return [...byId.values()];
}

/** The latest stamp of any user or assistant line in the text, or `before` where it holds none. */
function lastStamp(text: string, before: number | null): number | null {
  let last = before;
  for (const line of text.split("\n")) {
    if (!line.includes('"user"') && !line.includes('"assistant"')) continue;
    try {
      const entry = JSON.parse(line) as { type?: string; timestamp?: string };
      const stamp = Date.parse(String(entry.timestamp ?? ""));
      if ((entry.type === "assistant" || entry.type === "user") && !Number.isNaN(stamp)) last = last === null ? stamp : Math.max(last, stamp);
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
  return last ? last.tokens.in + last.tokens.cacheRead + last.tokens.cacheWrite : 0;
}

/** Whole lines of `file` from byte `from`, and the byte the next read starts at. */
export function readFrom(file: string, from: number, limit?: number): { text: string; next: number } | null {
  const size = statSync(file).size;
  if (size < from) from = 0;
  const buffer = Buffer.alloc(limit === undefined ? size - from : Math.min(limit, size - from));
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
    let tags: { workstream: string | null; arc: string | null; part: string | null; skill: string | null; stage?: string | null } =
      { workstream: facts.workstream ?? null, arc: facts.arc ?? null, part: facts.part ?? null, skill: facts.skill ?? null };
    try { tags = carryTags(root, facts); } catch { /* the call's own tags stand */ }
    const part = held(tags.part, PART_PATTERN);
    const event = facts.agent ? SPDevExWorkspaceTelemetryEventType.SUBAGENT_STOP : SPDevExWorkspaceTelemetryEventType.STOP;
    const skill = known(SPDevExAgentSkillType, tags.skill);
    const work = known(SPDevExWorkstreamWorkType, facts.work) ?? workOfPart(part);
    // The stage the skill and work give first, else the one the window last carried.
    const stage = stageOf(skill, work) ?? known(SPDevExStageType, tags.stage) ?? null;
    const head = {
      session, agent: facts.agent ?? null, workstream: held(tags.workstream, WORKSTREAM_PATTERN), arc: held(tags.arc, ARC_PATTERN), part,
      skill, stage, work, retryOf: null,
    };
    appendLog(join(dir, USAGE_LOG), turns.map((one) => {
      const ms = one.ms ?? 0;
      const ended = one.at ? Date.parse(one.at) : Date.now();
      return JSON.stringify({
        v: SPDevExWorkspaceTelemetryVersionType.V1, mtype: SPDevExWorkspaceTelemetryRowType.TURN, id: one.id,
        at: `${new Date(ended - ms).toISOString().slice(0, 19)}Z`, ms, event, ...head, model: one.model, tokens: one.tokens });
    }).join("\n"));
  } catch { /* a tool never fails because timing failed */ }
}

const ORDER_PATH = new RegExp(`${workstreamPrefixSource()}(\\d{3}-[a-z0-9][a-z0-9-]*)/notes/(N\\d{3})[^/\\s'"\`]*/orders/([A-Za-z0-9][A-Za-z0-9._-]*?)\\.md`);

/** The text of a message's content: a string, or the text blocks of a list. */
export function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((one) => (one && typeof one === "object" && typeof (one as { text?: unknown }).text === "string" ? (one as { text: string }).text : "")).join("\n");
  return "";
}

/** A front-matter value (`part: "code-x-2"`) of an order file's text, or null. */
function frontMatter(text: string, key: string): string | null {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  const found = new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|(\\S+))`, "m").exec(block);
  return found ? (found[1] ?? found[2] ?? found[3] ?? null) : null;
}

/**
 * The work a helper was launched for, read once from its transcript: the order its first prompt names under
 * `notes/N<nnn>/orders/`, with the part and arc that order's front matter holds (else the order's own name and the
 * arc of its folder) and the work the part's id stands for. Null where the transcript cannot be read, holds no prompt,
 * or the prompt names no order. Never throws.
 */
export function launchedWork(transcript: string | undefined): { workstream: string; arc: string; part: string | null; work: SPDevExWorkstreamWorkType | null } | null {
  try {
    if (!transcript || !existsSync(transcript)) return null;
    const read = readFrom(transcript, 0, HEAD_BYTES);
    if (!read) return null;
    for (const line of read.text.split("\n")) {
      if (!line.includes('"user"')) continue;
      let entry: { type?: string; message?: { content?: unknown } };
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry.type !== "user") continue;
      const named = ORDER_PATH.exec(contentText(entry.message?.content));
      if (!named) return null;
      const [whole, workstream, folderArc, stem] = named;
      let part: string | null = null, arc: string | null = null;
      const orderFile = pathOf(contentText(entry.message?.content), whole);
      if (orderFile && existsSync(orderFile)) {
        const text = readFileSync(orderFile, "utf8");
        part = held(frontMatter(text, "part"), PART_PATTERN);
        arc = held(frontMatter(text, "go"), ARC_PATTERN);
      }
      part = part ?? held(stem, PART_PATTERN);
      return { workstream, arc: arc ?? folderArc, part, work: workOfPart(part) };
    }
    return null;
  } catch { return null; }
}

/** The whole path of an order file in a prompt: the run of path characters around the part the pattern matched. */
function pathOf(text: string, tail: string): string | null {
  const at = text.indexOf(tail);
  if (at < 0) return null;
  let from = at;
  while (from > 0 && /[^\s'"`()<>]/.test(text[from - 1])) from -= 1;
  return text.slice(from, at + tail.length);
}
