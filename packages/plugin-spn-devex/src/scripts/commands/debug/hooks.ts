// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug hooks show [--json]
//
// A hook check's line carries a `verdict`; an event's line is the whole run (`group` `events`); a command's line
// carries none and is read by neither part.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";

export const describe = "every hook check's runs, time, notes and refusals, then every event's runs, time and bytes put into the context";

const HOOKS_LOG = "hooks.jsonl";
const SENDBACKS_LOG = "sendbacks.jsonl";

type Check = { script: string; group: string; action: string; runs: number; ms: number; notes: number; denies: number; out: number };
type Event = { event: string; runs: number; ms: number; out: number };
type ToFix = { check: string; sent: number; idle: number };

const round = (ms: number): number => Math.round(ms * 100) / 100;
const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const number = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function read(root: string): { checks: Check[]; events: Event[] } {
  const checks = new Map<string, Check>(), events = new Map<string, Event>();
  for (const file of logFiles(join(telemetryFolder(root), HOOKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const verdict = text(one.verdict);
        if (!verdict) continue;
        const ms = number(one.ms), out = number(one.out);
        if (one.group === "events") {
          const name = text(one.event) ?? text(one.action) ?? "(no event)";
          const held = events.get(name) ?? { event: name, runs: 0, ms: 0, out: 0 };
          events.set(name, { ...held, runs: held.runs + 1, ms: held.ms + ms, out: held.out + out });
          continue;
        }
        const script = text(one.script) ?? "(no script)", group = text(one.group) ?? "-", action = text(one.action) ?? "-";
        const key = `${script} › ${group} › ${action}`;
        const held = checks.get(key) ?? { script, group, action, runs: 0, ms: 0, notes: 0, denies: 0, out: 0 };
        checks.set(key, { ...held, runs: held.runs + 1, ms: held.ms + ms, out: held.out + out,
          notes: held.notes + (verdict === "note" ? 1 : 0), denies: held.denies + (verdict === "deny" ? 1 : 0) });
      } catch { /* a torn last line is skipped */ }
    }
  }
  const byMs = <T extends { ms: number }>(a: T, b: T) => b.ms - a.ms;
  return { checks: [...checks.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })),
           events: [...events.values()].sort(byMs).map((one) => ({ ...one, ms: round(one.ms) })) };
}

/**
 * The checks to fix (MKT.HOOKS.321): a check whose send-backs were mostly, which is more than half, followed by no tool
 * call. A session writes one cumulative line each time, so the last line per session is the one that counts.
 */
function readToFix(root: string): ToFix[] {
  const last = new Map<string, Record<string, unknown>>();
  for (const file of logFiles(join(telemetryFolder(root), SENDBACKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const session = text(one.session);
        if (session && one.checks && typeof one.checks === "object") last.set(session, one.checks as Record<string, unknown>);
      } catch { /* a torn last line is skipped */ }
    }
  }
  const sums = new Map<string, ToFix>();
  for (const checks of last.values()) {
    for (const [check, counts] of Object.entries(checks)) {
      const held = sums.get(check) ?? { check, sent: 0, idle: 0 };
      const { sent, idle } = (counts ?? {}) as Record<string, unknown>;
      sums.set(check, { check, sent: held.sent + number(sent), idle: held.idle + number(idle) });
    }
  }
  return [...sums.values()].filter((one) => one.idle * 2 > one.sent).sort((a, b) => b.idle - a.idle);
}

/** A duration as a person reads it: milliseconds below a second, seconds above. */
const shown = (ms: number): string => (ms >= 1000 ? `${round(ms / 1000)}s` : `${round(ms)}ms`);

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no target.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { checks, events } = read(root);
  const toFix = readToFix(root);
  if (words.given("json")) { console.log(JSON.stringify({ checks, events, toFix }, null, 2)); return 0; }
  if (!checks.length && !events.length && !toFix.length) {
    console.log(`no hook telemetry in ${telemetryFolder(root)} — \`debug switch on telemetry\` records from the next hook`);
    return 0;
  }
  const width = Math.max(5, ...checks.map((one) => `${one.script} › ${one.group} › ${one.action}`.length)) + 2;
  console.log("Check".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Notes".padStart(8) + "Denies".padStart(8) + "Out bytes".padStart(11));
  for (const one of checks)
    console.log(`${one.script} › ${one.group} › ${one.action}`.padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) +
      String(one.notes).padStart(8) + String(one.denies).padStart(8) + String(one.out).padStart(11));
  console.log("\n" + "Event".padEnd(width) + "Runs".padStart(7) + "Time".padStart(10) + "Out bytes".padStart(11));
  for (const one of events)
    console.log(one.event.padEnd(width) + String(one.runs).padStart(7) + shown(one.ms).padStart(10) + String(one.out).padStart(11));
  if (toFix.length) {
    console.log("\nChecks to fix: most of their send-backs were followed by no tool call");
    for (const one of toFix) console.log(`${one.check}`.padEnd(width) + `${one.idle} of ${one.sent} unanswered`.padStart(24));
  }
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "every hook check's, then every event's, runs, time and bytes", usage: "[--json]", run: show },
};
