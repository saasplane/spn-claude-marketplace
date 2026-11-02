// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug hooks show [--json]
//
// Only `v` 1 rows are read, each by its `mtype`. A hook check's run is a `CHECK` row: its `check`, its `verdict` (PASS, NOTE or
// DENY), its own `ms` and the bytes `out` it put into the context, and the size it carries: `out` times the replies the same window (and
// the same agent) made from the row on, counted from `usage.jsonl` by session, agent and time (`carried`, in the Carried column and in `--json`). No row holds a hook's whole run, so an event's time is added
// up from its checks, and its runs are those of its busiest check. A turn-end check's refusal column is headed Found and a
// tool-call check's Denies. A send-back is a `CHECK` row whose verdict is DENY, under PreToolUse or Stop (there is no
// `sendbacks.jsonl`); the Send-backs part judges each by the rows after it in the same window and workstream, never a transcript
// (MKT.HOOKS.341).

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import {
  SPDevExAgentHookVerdictType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType,
} from "../../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { carriedBytes, readReplies, type Replies } from "../../lib/cost.ts";
import { REPLY_CHECKS } from "../../lib/payload.ts";

export const describe = "every hook check's runs, time, notes and refusals, then every event's runs, time and bytes put into the context, each with the size those bytes carried over the replies after them";

const HOOKS_LOG = "hooks.jsonl";
const { STOP, PRE_TOOL_USE } = SPDevExWorkspaceTelemetryEventType;
const { PASS, NOTE, DENY } = SPDevExAgentHookVerdictType;

type Check = { check: string; event: string | null; runs: number; ms: number; notes: number; denies: number; out: number; carried: number };
type Event = { event: string; runs: number; ms: number; out: number; carried: number };
/** A row of the hook log that a send-back is judged by, kept in file order: a check's run, or a call (a command or a test run). */
type Logged = { seq: number; session: string | null; workstream: string | null; call: boolean; event: string | null; check: string; verdict: string | null };
type SendBack = { seq: number; session: string | null; workstream: string | null; event: "Stop" | "PreToolUse"; check: string };
type Standing = { check: string; sent: number; per100: number; judged: number; unanswered: number | null };
type Part = { runs: number; sent: number; per100: number; checks: Standing[] };
type SendBacks = { turnEnd: Part; toolCalls: Part };
type ToFix = { check: string; sent: number; judged: number; unanswered: number };

const round = (ms: number): number => Math.round(ms * 100) / 100;
const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const number = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const per100 = (part: number, whole: number): number => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

function read(root: string, replies: Replies): { checks: Check[]; events: Event[]; logged: Logged[]; backs: SendBack[] } {
  const checks = new Map<string, Check>(), logged: Logged[] = [], backs: SendBack[] = [];
  for (const file of logFiles(join(telemetryFolder(root), HOOKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        if (one.v !== SPDevExWorkspaceTelemetryVersionType.V1) continue;
        const session = text(one.session), workstream = text(one.workstream), seq = logged.length;
        if (one.mtype === SPDevExWorkspaceTelemetryRowType.COMMAND || one.mtype === SPDevExWorkspaceTelemetryRowType.TEST) {
          logged.push({ seq, session, workstream, call: true, event: text(one.event), check: "", verdict: null });
          continue;
        }
        const name = text(one.check), verdict = text(one.verdict);
        if (one.mtype !== SPDevExWorkspaceTelemetryRowType.CHECK || !name || !verdict) continue;
        const event = text(one.event);
        logged.push({ seq, session, workstream, call: false, event, check: name, verdict });
        if (verdict === DENY && (event === STOP || event === PRE_TOOL_USE)) backs.push({ seq, session, workstream, event, check: name });
        const key = `${event ?? "-"} ${name}`;
        const held = checks.get(key) ?? { check: name, event, runs: 0, ms: 0, notes: 0, denies: 0, out: 0, carried: 0 };
        const out = number(one.out);
        const carried = carriedBytes(replies, { session, agent: text(one.agent), at: Date.parse(text(one.at) ?? "") || null, out });
        checks.set(key, { ...held, runs: held.runs + 1, ms: held.ms + number(one.ms), out: held.out + out, carried: held.carried + carried,
          notes: held.notes + (verdict === NOTE ? 1 : 0), denies: held.denies + (verdict === DENY ? 1 : 0) });
      } catch { /* a torn last line is skipped */ }
    }
  }
  const byMs = <T extends { ms: number }>(a: T, b: T) => b.ms - a.ms;
  const events = new Map<string, Event>();
  for (const one of checks.values()) {
    const name = one.event ?? "(no event)";
    const held = events.get(name) ?? { event: name, runs: 0, ms: 0, out: 0, carried: 0 };
    events.set(name, { event: name, runs: Math.max(held.runs, one.runs), ms: held.ms + one.ms, out: held.out + one.out, carried: held.carried + one.carried });
  }
  return { checks: [...checks.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })),
           events: [...events.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })), logged, backs };
}

/**
 * Whether a send-back was answered, by the kind of check (MKT.HOOKS.341); null where the log holds nothing to judge by.
 * Only the rows after the send-back in the same window and workstream count, in the order the file holds them. The check's
 * own next run is the first row of that check under the same event after the send-back.
 *  - a check about the work: a call of the window before the check's next run on a Stop;
 *  - a check about the reply (`REPLY_CHECKS`): its own next run on a Stop passing;
 *  - a tool-call check: its next run in the window passing.
 */
function answered(back: SendBack, logged: readonly Logged[]): boolean | null {
  const after = logged.filter((one) => one.seq > back.seq && one.session === back.session && one.workstream === back.workstream);
  const next = after.find((one) => !one.call && one.event === back.event && one.check === back.check);
  if (back.event === PRE_TOOL_USE) return next ? next.verdict === PASS : null;
  if (back.check === "window") return null;
  if (REPLY_CHECKS.has(back.check)) return next ? next.verdict === PASS : null;
  const calls = after.filter((one) => (one.call || one.event === PRE_TOOL_USE) && (!next || one.seq < next.seq));
  if (calls.length) return true;
  return next ? false : null;
}

function standings(backs: readonly SendBack[], runs: number, logged: readonly Logged[]): Part {
  const by = new Map<string, SendBack[]>();
  for (const back of backs) by.set(back.check, [...(by.get(back.check) ?? []), back]);
  const checks = [...by.entries()].map(([check, list]): Standing => {
    const judged = list.map((back) => answered(back, logged)).filter((one): one is boolean => one !== null);
    return { check, sent: list.length, per100: per100(list.length, runs), judged: judged.length,
             unanswered: judged.length ? judged.filter((one) => !one).length : null };
  }).sort((a, b) => b.sent - a.sent || a.check.localeCompare(b.check));
  return { runs, sent: backs.length, per100: per100(backs.length, runs), checks };
}

/** The send-backs per kind of check, with the runs they are counted against: Stop runs for the turn end, PreToolUse runs for the tool calls. */
function readSendBackParts(backs: readonly SendBack[], events: readonly Event[], logged: readonly Logged[]): SendBacks {
  const runsOf = (name: string) => events.find((one) => one.event === name)?.runs ?? 0;
  return { turnEnd: standings(backs.filter((one) => one.event === STOP), runsOf(STOP), logged),
           toolCalls: standings(backs.filter((one) => one.event === PRE_TOOL_USE), runsOf(PRE_TOOL_USE), logged) };
}

/** The checks to fix: a check with more than half of the send-backs the log can judge unanswered (not exactly half). */
function toFixOf(parts: SendBacks): ToFix[] {
  return [...parts.turnEnd.checks, ...parts.toolCalls.checks]
    .filter((one) => one.unanswered !== null && one.unanswered * 2 > one.judged)
    .map((one) => ({ check: one.check, sent: one.sent, judged: one.judged, unanswered: one.unanswered as number }))
    .sort((a, b) => b.unanswered - a.unanswered);
}

/** A duration as a person reads it: milliseconds below a second, seconds above. */
const shown = (ms: number): string => (ms >= 1000 ? `${round(ms / 1000)}s` : `${round(ms)}ms`);

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no target.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { checks, events, logged, backs } = read(root, readReplies(root));
  const sendBacks = readSendBackParts(backs, events, logged);
  const toFix = toFixOf(sendBacks);
  if (words.given("json")) { console.log(JSON.stringify({ checks, events, sendBacks, toFix }, null, 2)); return 0; }
  const anyBack = sendBacks.turnEnd.sent + sendBacks.toolCalls.sent > 0;
  if (!checks.length && !events.length && !anyBack) {
    console.log(`no hook telemetry in ${telemetryFolder(root)} — \`debug switch on telemetry\` records from the next hook`);
    return 0;
  }
  const label = (one: Check) => one.check;
  const width = Math.max(5, ...checks.map((one) => label(one).length), ...[...sendBacks.turnEnd.checks, ...sendBacks.toolCalls.checks].map((one) => one.check.length)) + 2;
  // A turn-end check's deny is a finding and a tool-call check's is a refusal; any other event's checks refuse nothing.
  const head = (refusal: string) => "Check".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Notes".padStart(8) + refusal.padStart(8) + "Out bytes".padStart(11) + "Carried".padStart(12);
  const row = (one: Check, refusal: string) => label(one).padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) +
    String(one.notes).padStart(8) + refusal.padStart(8) + String(one.out).padStart(11) + String(one.carried).padStart(12);
  const turnEnd = checks.filter((one) => one.event === STOP), toolCalls = checks.filter((one) => one.event === PRE_TOOL_USE);
  const others = checks.filter((one) => one.event !== STOP && one.event !== PRE_TOOL_USE);
  let first = true;
  for (const [refusal, list, dash] of [["Found", turnEnd, false], ["Denies", toolCalls, false], ["Denies", others, true]] as const) {
    if (!list.length) continue;
    console.log((first ? "" : "\n") + head(refusal));
    first = false;
    for (const one of list) console.log(row(one, dash ? "-" : String(one.denies)));
  }
  if (first) console.log(head("Denies"));
  console.log("\n" + "Event".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Out bytes".padStart(11) + "Carried".padStart(12));
  for (const one of events)
    console.log(one.event.padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) + String(one.out).padStart(11) + String(one.carried).padStart(12));
  for (const [title, part, noun, verb, column] of [
    ["Send-backs, turn end", sendBacks.turnEnd, "replies", "sent back", "Sent back"],
    ["Send-backs, tool calls", sendBacks.toolCalls, "calls", "refused", "Refused"]] as const) {
    if (!part.sent) continue;
    console.log(`\n${title}: ${part.sent} of ${part.runs} ${noun} ${verb}, ${part.per100} per 100`);
    console.log("Check".padEnd(width) + column.padStart(11) + "Per 100".padStart(9) + "Unanswered".padStart(14));
    for (const one of part.checks)
      console.log(one.check.padEnd(width) + String(one.sent).padStart(11) + String(one.per100).padStart(9) +
        (one.unanswered === null ? "-" : `${one.unanswered} of ${one.judged}`).padStart(14));
  }
  if (toFix.length) {
    console.log("\nChecks to fix: most of their send-backs were left unanswered");
    for (const one of toFix) console.log(`${one.check}`.padEnd(width) + `${one.unanswered} of ${one.judged} unanswered`.padStart(24));
  }
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "every hook check's, then every event's, runs, time, bytes and the size they carried", usage: "[--json]", run: show },
};
