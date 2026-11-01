// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug hooks show [--json]
//
// A hook check's line carries a `verdict`; an event's line is the whole run (`group` `events`); a command's line
// carries none and is read by neither part. A turn-end check's refusal column is headed Found and a tool-call
// check's Denies. The Send-backs part reads one line per send-back from `sendbacks.jsonl` and judges each by
// `hooks.jsonl`, never a transcript (MKT.HOOKS.341).

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { REPLY_CHECKS } from "../../lib/payload.ts";

export const describe = "every hook check's runs, time, notes and refusals, then every event's runs, time and bytes put into the context";

const HOOKS_LOG = "hooks.jsonl";
const SENDBACKS_LOG = "sendbacks.jsonl";

type Check = { script: string; group: string; action: string; event: string | null; runs: number; ms: number; notes: number; denies: number; out: number };
type Event = { event: string; runs: number; ms: number; out: number };
/** A line of the hook log that carries a verdict, kept in file order for the answers. */
type Logged = { at: number; seq: number; session: string | null; event: string | null; group: string; action: string; whole: boolean; verdict: string };
type SendBack = { at: number; session: string | null; event: "Stop" | "PreToolUse"; check: string };
type Standing = { check: string; sent: number; per100: number; judged: number; unanswered: number | null };
type Part = { runs: number; sent: number; per100: number; checks: Standing[] };
type SendBacks = { turnEnd: Part; toolCalls: Part };
type ToFix = { check: string; sent: number; judged: number; unanswered: number };

const round = (ms: number): number => Math.round(ms * 100) / 100;
const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const number = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const per100 = (part: number, whole: number): number => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

function read(root: string): { checks: Check[]; events: Event[]; logged: Logged[] } {
  const checks = new Map<string, Check>(), events = new Map<string, Event>(), logged: Logged[] = [];
  for (const file of logFiles(join(telemetryFolder(root), HOOKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const verdict = text(one.verdict);
        if (!verdict) continue;
        const ms = number(one.ms), out = number(one.out);
        const whole = one.group === "events";
        logged.push({ at: Date.parse(text(one.at) ?? "") || 0, seq: logged.length, session: text(one.session), event: text(one.event),
                      group: text(one.group) ?? "-", action: text(one.action) ?? "-", whole, verdict });
        if (whole) {
          const name = text(one.event) ?? text(one.action) ?? "(no event)";
          const held = events.get(name) ?? { event: name, runs: 0, ms: 0, out: 0 };
          events.set(name, { ...held, runs: held.runs + 1, ms: held.ms + ms, out: held.out + out });
          continue;
        }
        const script = text(one.script) ?? "(no script)", group = text(one.group) ?? "-", action = text(one.action) ?? "-";
        const key = `${script} › ${group} › ${action}`;
        const held = checks.get(key) ?? { script, group, action, event: text(one.event), runs: 0, ms: 0, notes: 0, denies: 0, out: 0 };
        checks.set(key, { ...held, runs: held.runs + 1, ms: held.ms + ms, out: held.out + out,
          notes: held.notes + (verdict === "note" ? 1 : 0), denies: held.denies + (verdict === "deny" ? 1 : 0) });
      } catch { /* a torn last line is skipped */ }
    }
  }
  const byMs = <T extends { ms: number }>(a: T, b: T) => b.ms - a.ms;
  return { checks: [...checks.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })),
           events: [...events.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })), logged };
}

/** The send-backs: one line each in `sendbacks.jsonl`, written when the send-back is made. A line of the older cumulative form is skipped. */
function readSendBacks(root: string): SendBack[] {
  const out: SendBack[] = [];
  for (const file of logFiles(join(telemetryFolder(root), SENDBACKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const check = text(one.check), event = one.event;
        if (!check || (event !== "Stop" && event !== "PreToolUse")) continue;
        out.push({ at: Date.parse(text(one.at) ?? "") || 0, session: text(one.session), event, check });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return out;
}

/**
 * Whether a send-back was answered, by the kind of check (MKT.HOOKS.341); null where the log holds nothing to judge by.
 * A run's lines are written when it ends, after its send-back, so the run that made a send-back is the first of its
 * kind at or after the send-back's time, and the answer is read after it.
 *  - a check about the work: a tool call of the window before its next Stop;
 *  - a check about the reply (`REPLY_CHECKS`): its own span on the next Stop finding nothing;
 *  - a tool-call check: its next span in the window passing.
 */
function answered(back: SendBack, logged: readonly Logged[]): boolean | null {
  const mine = logged.filter((one) => one.session === back.session);
  const after = (one: Logged) => one.at >= back.at;
  if (back.event === "PreToolUse") {
    const spans = mine.filter((one) => !one.whole && one.event === "PreToolUse" && one.action === back.check);
    const next = spans.filter(after)[1];
    return next ? next.verdict === "pass" : null;
  }
  if (back.check === "window") return null;
  const stops = mine.filter((one) => one.whole && one.event === "Stop").filter(after);
  const next = stops[1];
  if (REPLY_CHECKS.has(back.check)) {
    if (!next) return null;
    const span = mine.find((one) => !one.whole && one.event === "Stop" && one.action === back.check && one.at === next.at);
    return span ? span.verdict === "pass" : null;
  }
  const calls = mine.filter((one) => one.whole && one.event === "PreToolUse" && one.at > back.at && (!next || one.at < next.at));
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
function readSendBackParts(root: string, events: readonly Event[], logged: readonly Logged[]): SendBacks {
  const backs = readSendBacks(root);
  const runsOf = (name: string) => events.find((one) => one.event === name)?.runs ?? 0;
  return { turnEnd: standings(backs.filter((one) => one.event === "Stop"), runsOf("Stop"), logged),
           toolCalls: standings(backs.filter((one) => one.event === "PreToolUse"), runsOf("PreToolUse"), logged) };
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
  const { checks, events, logged } = read(root);
  const sendBacks = readSendBackParts(root, events, logged);
  const toFix = toFixOf(sendBacks);
  if (words.given("json")) { console.log(JSON.stringify({ checks, events, sendBacks, toFix }, null, 2)); return 0; }
  const anyBack = sendBacks.turnEnd.sent + sendBacks.toolCalls.sent > 0;
  if (!checks.length && !events.length && !anyBack) {
    console.log(`no hook telemetry in ${telemetryFolder(root)} — \`debug switch on telemetry\` records from the next hook`);
    return 0;
  }
  const label = (one: Check) => `${one.script} › ${one.group} › ${one.action}`;
  const width = Math.max(5, ...checks.map((one) => label(one).length), ...[...sendBacks.turnEnd.checks, ...sendBacks.toolCalls.checks].map((one) => one.check.length)) + 2;
  // A turn-end check's deny is a finding and a tool-call check's is a refusal; any other event's checks refuse nothing.
  const head = (refusal: string) => "Check".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Notes".padStart(8) + refusal.padStart(8) + "Out bytes".padStart(11);
  const row = (one: Check, refusal: string) => label(one).padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) +
    String(one.notes).padStart(8) + refusal.padStart(8) + String(one.out).padStart(11);
  const turnEnd = checks.filter((one) => one.event === "Stop"), toolCalls = checks.filter((one) => one.event === "PreToolUse");
  const others = checks.filter((one) => one.event !== "Stop" && one.event !== "PreToolUse");
  let first = true;
  for (const [refusal, list, dash] of [["Found", turnEnd, false], ["Denies", toolCalls, false], ["Denies", others, true]] as const) {
    if (!list.length) continue;
    console.log((first ? "" : "\n") + head(refusal));
    first = false;
    for (const one of list) console.log(row(one, dash ? "-" : String(one.denies)));
  }
  if (first) console.log(head("Denies"));
  console.log("\n" + "Event".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Out bytes".padStart(11));
  for (const one of events)
    console.log(one.event.padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) + String(one.out).padStart(11));
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
  show: { describe: "every hook check's, then every event's, runs, time and bytes", usage: "[--json]", run: show },
};
