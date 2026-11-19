// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A new window by presence
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// Whether the developer is here, away or watching, and the greeting their clock earns. The `developer` node of
// `.spndevex/state.json` (their timezone and usual hours) is spnutils's and is only read here; the `presence` node is
// this plugin's, written by `spn-devex presence` and by the prompt hook from the developer's words.
//
// WORDS FIRST, THEN SILENCE. AWAY is set by the developer's words, and WATCHING only by their words. With no words,
// silence reads as away when it is read: 30 minutes outside the usual hours, 3 hours inside them. Silence is never written.
// The time of the last message is never written to the node either: the prompt hook stamps `prompt.at` in the window's own
// folder under `.spndevex/.debug/sessions/`, and the newest stamp of any window is the last message.
//
// A TOOL MUST NEVER FAIL BECAUSE THIS FILE COULD NOT BE READ: every read answers its default on any fault.

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { stateFile, writePresenceNode } from "../../../../plugin-support-lib/src/lib/workspace-state.ts";
import { withOffset } from "./clock.ts";

export type PresenceState = "PRESENT" | "AWAY" | "WATCHING";

/** The developer, as spnutils's `developer` node says: a timezone and the hours they usually work, which may cross midnight. */
export type Developer = { timezone: string; from: number; to: number };

/** How presence was decided: by the developer's words, by silence, or not at all (no one has written yet). */
export type Decided = "said" | "silence" | "none";

export type PresenceRead = { state: PresenceState; how: Decided; said: string | null; since: string | null; lastMessageAt: number | null; local: string | null };

/** Minutes of silence that read as away outside the usual hours, and inside them. */
export const SILENCE_OUTSIDE_MS = 30 * 60 * 1000;
export const SILENCE_INSIDE_MS = 3 * 60 * 60 * 1000;
/** A gap this long since the last message is a night away: the greeting welcomes the developer back. */
export const NIGHT_AWAY_MS = 6 * 60 * 60 * 1000;

const STAMP = "prompt.at";
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

function stateObject(root: string): Record<string, unknown> | null {
  try { const parsed: unknown = JSON.parse(readFileSync(stateFile(root), "utf8")); return isObject(parsed) ? parsed : null; }
  catch { return null; }
}

const minutesOf = (clock: unknown): number | null => {
  const found = /^(\d{1,2}):(\d{2})$/.exec(typeof clock === "string" ? clock : "");
  return found && Number(found[1]) < 24 && Number(found[2]) < 60 ? Number(found[1]) * 60 + Number(found[2]) : null;
};

/** The `developer` node, or null where it is missing or does not read: then the machine's timezone and always inside the usual hours. */
export function readDeveloper(root: string): Developer | null {
  const node = stateObject(root)?.developer;
  if (!isObject(node) || typeof node.timezone !== "string") return null;
  try { new Intl.DateTimeFormat("en-GB", { timeZone: node.timezone }); } catch { return null; }
  const hours = isObject(node.usualHours) ? node.usualHours : {};
  const from = minutesOf(hours.from), to = minutesOf(hours.to);
  return from === null || to === null ? null : { timezone: node.timezone, from, to };
}

/** The clock in the developer's timezone (the machine's where there is none): hour and minute, 24-hour. */
export function localTime(at: number, developer: Developer | null): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...(developer ? { timeZone: developer.timezone } : {}) })
    .formatToParts(new Date(at));
  const get = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hour: get("hour") % 24, minute: get("minute") };
}

const clockText = (time: { hour: number; minute: number }): string => `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

/** Whether the developer's local time is inside their usual hours. With no `developer` node it always is, so silence is never read as away too soon. */
export function insideUsualHours(at: number, developer: Developer | null): boolean {
  if (!developer) return true;
  const time = localTime(at, developer);
  const now = time.hour * 60 + time.minute;
  return developer.from <= developer.to ? now >= developer.from && now < developer.to : now >= developer.from || now < developer.to;
}

// ---------------------------------------------------------------------------- the developer's words

const NOT_WATCHING = /\b(?:no longer|not|stopped|stop) watching\b|\bback at my (?:desk|laptop|computer)\b|\bi(?:'|’)?m (?:here|back)\b(?!\s+(?:tomorrow|later|in\b|at\b|on\b))|\bi am (?:here|back)\b(?!\s+(?:tomorrow|later|in\b|at\b|on\b))/i;
const WATCHING_WORDS = /\bwatching (?:from my phone|remotely|from remote|via remote)\b|\bon remote control\b|\busing remote control\b|\bremote control\b.{0,20}\bwatch/i;
const AWAY_WORDS = /\bgoing to (?:sleep|bed)\b|\bi(?:'|’)?m going now\b|\bi am going now\b|\bi(?:'|’)?m (?:away|off now)\b|\bi am away\b|\bback tomorrow\b|^\s*away[.!]?\s*$/i;
const STAY_WORDS = /^\s*stay[.!]?\s*$|\bstay (?:in|with|on) (?:this|the same|here)\b|\bstay here\b|\bkeep going in (?:this|the same) window\b|\bno new window\b/i;

/**
 * What presence a message sets, as the developer's words give it, or null where the words say nothing: a message with
 * none of these flips AWAY back to PRESENT (`nextState`), and WATCHING holds until words say otherwise.
 */
export function presenceWords(text: string): PresenceState | null {
  if (NOT_WATCHING.test(text)) return "PRESENT";
  if (AWAY_WORDS.test(text)) return "AWAY";
  if (WATCHING_WORDS.test(text)) return "WATCHING";
  return null;
}

/** Whether the developer's words say to stay in this window (the window's own note keeps it). */
export const staysInWindow = (text: string): boolean => STAY_WORDS.test(text);

/** The state a message leaves, from the state it found and its words. */
export function nextState(current: PresenceState, text: string): PresenceState {
  const said = presenceWords(text);
  if (said) return said;
  return current === "AWAY" ? "PRESENT" : current;
}

// ---------------------------------------------------------------------------- the node, and the last message

/** The `presence` node as stored, or null where it is missing or does not read. */
export function readNode(root: string): { state: PresenceState; said: string | null; since: string | null } | null {
  const node = stateObject(root)?.presence;
  if (!isObject(node) || (node.state !== "PRESENT" && node.state !== "AWAY" && node.state !== "WATCHING")) return null;
  return { state: node.state, said: typeof node.said === "string" ? node.said : null, since: typeof node.since === "string" ? node.since : null };
}

/** Write the node: the state, the words that set it, and when. Throws where the plugin may not write (no `state.json`). */
export function writeState(root: string, state: PresenceState, said: string | null, now: number = Date.now()): void {
  writePresenceNode(root, () => ({ state, said, since: withOffset(new Date(now)) }));
}

/** Stamp the message of this window: the file's own write time is the message's time. Never throws. */
export function stampMessage(root: string, session: string): void {
  try {
    const key = session.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
    if (!key) return;
    const file = join(sessionDir(root, key), STAMP);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, new Date().toISOString(), "utf8");
  } catch { /* a message that cannot be stamped is a silence that reads a little longer */ }
}

/** The time of the developer's last message in any window, from the newest stamp under `.spndevex/.debug/sessions/`, or null. */
export function lastMessageAt(root: string): number | null {
  try {
    const parent = dirname(sessionDir(root, "x"));
    let newest: number | null = null;
    for (const name of readdirSync(parent)) {
      try { const at = statSync(join(parent, name, STAMP)).mtimeMs; if (newest === null || at > newest) newest = at; } catch { /* a window with no stamp */ }
    }
    return newest;
  } catch { return null; }
}

/** Presence as read now: the node's words first, then silence. WATCHING is never read from silence. */
export function readPresence(root: string, now: number = Date.now()): PresenceRead {
  const developer = readDeveloper(root);
  const node = readNode(root);
  const last = lastMessageAt(root);
  const local = clockText(localTime(now, developer));
  const base = { said: node?.said ?? null, since: node?.since ?? null, lastMessageAt: last, local };
  if (node && node.state !== "PRESENT") return { ...base, state: node.state, how: "said" };
  const limit = insideUsualHours(now, developer) ? SILENCE_INSIDE_MS : SILENCE_OUTSIDE_MS;
  if (last !== null && now - last >= limit) return { ...base, state: "AWAY", how: "silence" };
  return { ...base, state: "PRESENT", how: node ? "said" : "none" };
}

// ---------------------------------------------------------------------------- the greeting

/** The clock line for a welcome, and whether the catch-up follows it, or null where there is no `developer` node. */
export function clockLine(root: string, name: string | null, now: number = Date.now()): { line: string; catchUp: boolean } | null {
  const developer = readDeveloper(root);
  if (!developer) return null;
  const last = lastMessageAt(root);
  if (last !== null && now - last >= NIGHT_AWAY_MS)
    return { line: `Welcome back. You've been away since ${clockText(localTime(last, developer))}.`, catchUp: true };
  const { hour } = localTime(now, developer);
  const who = name ? `, ${name}` : "";
  if (hour < 5) return { line: `It's ${hour % 12 || 12} a.m. for you, a late one.`, catchUp: false };
  if (hour < 12) return { line: `Morning${who}.`, catchUp: false };
  if (hour < 18) return { line: `Afternoon${who}.`, catchUp: false };
  return { line: `Evening${who}.`, catchUp: false };
}
