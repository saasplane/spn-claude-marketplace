// This file OWNS these rules — the switch, the line's shape, the size cap and the carried tags — and
// restates the book's RD.DEVEX.WORKSPACE.185 (spn-foundation `04-capabilities/01-devex/03-utils/
// 01-spnutils/01-utils.md` § the `timings` paragraph).
//
// What a plugin's checks, its commands and the agent's Bash commands cost, written only while the
// developer has asked for it. ONE LIBRARY, IN THE SHARED SUPPORT FOLDER: spn-devex, spn-apps and
// spn-infra each import it by relative path, so the build copies it into each installed plugin's own
// bundle and no plugin reaches into another. All three write the one log `workspace timings` reads.
//
// ONE LINE SHAPE, WHOEVER WRITES IT (`LINE_KEYS`, in this order): `script` (the plugin, or the program
// a Bash command ran), `group`, `subgroup`, `action` (up to three levels below it, null where unused),
// `args` (what was typed after the action, a secret-looking option's value written `***`; null for a
// hook check), `event`, `tool`, `ms`, `exit` (null for a hook check), `at` (UTC, ending in `Z`),
// `repo` (the member repository the call ran in; null at the workspace root), `pid`, and the work
// tags `session`, `agent`, `workstream`, `arc`, `order`.
//
// NAMES ARE STRUCTURED AT THE CALL SITE, never parsed from a string. A check file with sub-checks is
// `{ group: <file>, action: <sub-check> }` (`split-plan` › `close`); a check file with one check names
// it twice (`env-seat` › `env-seat`), so every check line has a group to sum by. A whole hook run is
// `{ group: "events", action: <entry> }`, and a whole CLI run `{ group: "cli", action: "cli" }`.
//
// Measuring is free; writing is the cost. `begin()` touches no filesystem, so a check that refuses
// early and exits pays nothing. The switch is read at the moment of writing.
//
// EACH LINE SAYS WHICH WORK IT BELONGS TO. `workstream`, `arc` and `order` are read from the paths the
// tool call touches, and `agent` from the hook input when it carries one, so `workspace tokens` joins
// a transcript to its work by `session`. A call that touches no workstream path inherits the tags its
// session and agent last carried (`carryTags`).
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors: a gate that
// refuses to run is infinitely more expensive than a number nobody recorded.

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { workstreamPrefixSource } from "./docs-tree.ts";

const DEVEX = ".spndevex", DEBUG = ".debug", SWITCH = "telemetry.on", FOLDER = "telemetry", LOG = "hooks.jsonl";
const CARRIED = "tags.json";
// A session's carried tags are kept this long after its last tagged call, then dropped when the file is written.
const KEEP_MS = 14 * 24 * 3600 * 1000;
const MAX_BYTES = 4 * 1024 * 1024;

/** Every key a line carries, in the order it is written. */
export const LINE_KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "session", "agent", "workstream", "arc", "order"] as const;

/** What ran, in up to three levels. `args` is what was typed after the action, or null. */
export type SpanName = { group?: string | null; subgroup?: string | null; action: string | null; args?: string | null };

/** One measured thing, before the facts every line of a run shares are added. */
export type Entry = SpanName & { ms: number; exit?: number | null; script?: string; repo?: string | null };

/**
 * What every line of one run shares. `script` is the plugin; `cwd` is where the call ran, read for
 * `repo`; `process` names the whole run, written as one more line at `end()`.
 */
export type Facts = {
  script: string;
  event: string | null;
  tool: string | null;
  session: string | null;
  agent?: string | null;
  workstream?: string | null;
  arc?: string | null;
  order?: string | null;
  cwd?: string;
  process?: SpanName;
};

const state: { root: string | null; cwd: string | null; facts: Facts | null; spans: Entry[] } =
  { root: null, cwd: null, facts: null, spans: [] };

/** The folder holding `.spndevex`, walked up from where the caller stood. */
export function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, DEVEX))) return path;
      const up = dirname(path);
      if (up === path) return null;
      path = up;
    }
  } catch { return null; }
}

/**
 * The telemetry folder, where recording is on; null where it is off. A test run launches hooks inside
 * the real workspace, and `SPN_TELEMETRY=off` keeps its records from reading as the developer's.
 */
export function telemetryDir(root: string | null): string | null {
  try {
    if (!root || process.env.SPN_TELEMETRY === "off") return null;
    const debug = join(root, DEVEX, DEBUG);
    return existsSync(join(debug, SWITCH)) ? join(debug, FOLDER) : null;
  } catch { return null; }
}

/** The member repository `dir` sits in: its first folder below the workspace root. Null at the root and outside it. */
export function repoOf(root: string | null, dir: string | null | undefined): string | null {
  try {
    if (!root || !dir) return null;
    const rel = relative(resolve(root), resolve(dir));
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
    const first = rel.split(sep)[0];
    return first && !first.startsWith(".") ? first : null;
  } catch { return null; }
}

// An option whose name carries one of these words has its value written `***`.
const SECRET = /token|password|secret|key/i;

/**
 * The words typed after the action, as one string for the line: an option whose name suggests a
 * secret has its value written `***` (`--token ***`, `--api-key=***`), and a word holding a space
 * keeps its quotes. Nothing typed reads null.
 */
export function argsText(words: string[]): string | null {
  const out: string[] = [];
  let maskNext = false;
  for (const word of words) {
    if (maskNext && !word.startsWith("-")) { out.push("***"); maskNext = false; continue; }
    maskNext = false;
    if (word.startsWith("-")) {
      const eq = word.indexOf("=");
      const name = (eq >= 0 ? word.slice(0, eq) : word).replace(/^-+/, "");
      if (SECRET.test(name)) {
        if (eq >= 0) { out.push(`${word.slice(0, eq)}=***`); continue; }
        maskNext = true;
      }
    }
    out.push(/\s/.test(word) || word === "" ? JSON.stringify(word) : word);
  }
  return out.length ? out.join(" ") : null;
}

/** The work a line belongs to. Every field is `null` where the call named none. */
export type WorkTags = { workstream: string | null; arc: string | null; order: string | null; agent: string | null };

// `.spndevex/workstreams/<state>/<NNN-subject>/` and whatever follows it inside that folder.
const IN_WORKSTREAM = new RegExp(`${workstreamPrefixSource()}(\\d{3}-[A-Za-z0-9-]+)((?:\\/[^\\s'"\`)\\]|;&<>]*)?)`, "g");
// Inside one: `arcs/N<n>…` names the arc, `notes/N<n>/…` names it too (and so does a notes folder
// named past its arc, `notes/N<n>-<subject>/`), `notes/N<n>…/orders/<order>…` names the order as well.
const ARC_FILE = /^\/arcs\/(N\d+[a-z]?)(?:[-.]|$)/i;
const ARC_NOTES = /^\/notes\/(N\d+[a-z]?)(?:-[^/]*)?(?:\/|$)/i;
const ORDER_FILE = /^\/notes\/N\d+[a-z]?(?:-[^/]*)?\/orders\/([^/]+?)(?:\.md)?(?:\/|$)/i;
// A relative path from inside a workstream folder, as a command run there spells it.
const RELATIVE = /(?:^|[\s'"`=(])((?:arcs\/N\d+[a-z]?[^\s'"`)\]|;&<>]*)|(?:notes\/N\d+[a-z]?[^\s'"`)\]|;&<>]*))/gi;

function stringsOf(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const one of value) stringsOf(one, out);
  else if (value && typeof value === "object") for (const one of Object.values(value)) stringsOf(one, out);
  return out;
}

function tagsIn(workstream: string, rest: string): Omit<WorkTags, "agent"> {
  const order = rest.match(ORDER_FILE)?.[1] ?? null;
  const arc = rest.match(ARC_FILE)?.[1] ?? rest.match(ARC_NOTES)?.[1] ?? null;
  return { workstream, arc: arc ? arc.toUpperCase() : null, order };
}

const depth = (tags: Omit<WorkTags, "agent">) => (tags.order ? 3 : tags.arc ? 2 : 1);

/**
 * The workstream, arc and order a hook's tool call touches, and the agent that made it.
 *
 * Every string in `tool_input` is read — a file path, a command, an edit — for a path under
 * `.spndevex/workstreams/<state>/<NNN-subject>/`. A relative `arcs/N<n>…` or `notes/N<n>/…` counts
 * only when the call's `cwd` is itself inside a workstream folder, because only then does it name one.
 * Where one call touches several, the most specific wins (an order over an arc over a bare
 * workstream), and the first of those. Never throws.
 */
export function tagsOf(payload: { tool_input?: unknown; cwd?: string; agent_id?: unknown } | null | undefined): WorkTags {
  const none: WorkTags = { workstream: null, arc: null, order: null, agent: null };
  try {
    if (!payload) return none;
    const agent = typeof payload.agent_id === "string" && payload.agent_id ? payload.agent_id : null;
    let best: Omit<WorkTags, "agent"> | null = null;
    const consider = (found: Omit<WorkTags, "agent">) => { if (!best || depth(found) > depth(best)) best = found; };
    const strings = stringsOf(payload.tool_input);
    for (const text of strings)
      for (const m of text.matchAll(IN_WORKSTREAM)) consider(tagsIn(m[1], m[2] ?? ""));
    const here = typeof payload.cwd === "string" ? [...payload.cwd.matchAll(IN_WORKSTREAM)][0] : undefined;
    if (here) {
      const base = here[2] ?? "";
      for (const text of strings)
        for (const m of text.matchAll(RELATIVE)) consider(tagsIn(here[1], `${base.replace(/\/+$/, "")}/${m[1]}`));
    }
    const found = best as Omit<WorkTags, "agent"> | null;
    return found ? { ...found, agent } : { ...none, agent };
  } catch { return none; }
}

/**
 * The facts a plugin command's lines carry. A command is run by the agent through the shell, so it
 * has no hook payload: its session comes from `CLAUDE_CODE_SESSION_ID`, the variable Claude Code
 * exports to every command it runs, and its workstream, arc and order from the paths in its own
 * arguments and the folder it runs in, read by the same `tagsOf` a hook uses. Its whole run is
 * `cli` › `cli`, with everything typed after the CLI as its `args`. Never throws.
 */
export function commandFacts(script: string, args: string[]): Facts {
  const session = process.env.CLAUDE_CODE_SESSION_ID || null;
  let tags: WorkTags = { workstream: null, arc: null, order: null, agent: null };
  try { tags = tagsOf({ tool_input: { command: args.join(" ") }, cwd: process.cwd() }); } catch { /* ignore */ }
  let typed: string | null = null;
  try { typed = argsText(process.argv.slice(2)); } catch { typed = null; }
  return { script, event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session, ...tags,
           cwd: process.cwd(), process: { group: "cli", action: "cli", args: typed } };
}

type Work = { workstream: string | null; arc: string | null; order: string | null };
type Carried = Record<string, Work & { at: number }>;

/**
 * The work a line is written under: its own tags, or the ones carried from the same session and
 * agent's last tagged call (RD.DEVEX.WORKSPACE.185).
 *
 * - **A call that touches no workstream path inherits** the carried tags.
 * - **A call inside the carried work keeps what it does not name**: the same workstream, and the same
 *   arc where it names one, fills in the carried arc and order. A lane reading its arc's spec is
 *   still working its order.
 * - **A call that names other work replaces them.**
 *
 * The carried tags are written back whenever they change. Keyed by session and agent, so a lane never
 * lends its tags to the main window or to another lane. With no session there is nothing to key on,
 * and the call's own tags stand.
 */
export function carryTags(dir: string, facts: Partial<Facts>): Work {
  const own: Work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: facts.order ?? null };
  const session = typeof facts.session === "string" && facts.session ? facts.session : null;
  if (!session) return own;
  const key = `${session}|${typeof facts.agent === "string" && facts.agent ? facts.agent : "main"}`;
  const path = join(dir, CARRIED);
  let carried: Carried = {};
  try { carried = JSON.parse(readFileSync(path, "utf8")) ?? {}; } catch { carried = {}; }
  const was = carried[key];
  let work: Work;
  if (!own.workstream) work = was ? { workstream: was.workstream, arc: was.arc, order: was.order } : own;
  else if (was && was.workstream === own.workstream && (!own.arc || own.arc === was.arc) && (!own.order || own.order === was.order))
    work = { workstream: own.workstream, arc: own.arc ?? was.arc, order: own.order ?? was.order };
  else work = own;
  if (work.workstream && (!was || was.workstream !== work.workstream || was.arc !== work.arc || was.order !== work.order)) {
    const now = Date.now();
    for (const [name, entry] of Object.entries(carried)) if (!entry || now - (entry.at ?? 0) > KEEP_MS) delete carried[name];
    carried[key] = { ...work, at: now };
    try { writeFileSync(path, JSON.stringify(carried), "utf8"); } catch { /* a tool never fails because timing failed */ }
  }
  return work;
}

/** Now, in UTC to the second, ending in `Z`. */
export function utcNow(): string {
  return `${new Date().toISOString().slice(0, 19)}Z`;
}

const round = (ms: number) => Math.round(ms * 100) / 100;

/**
 * Append one line per entry to the workspace's log, if and only if recording is on. The facts are
 * shared by every entry; an entry may name its own `script` and `repo` (a Bash command's program, and
 * the folder its `cd` moved to). Never throws.
 */
export function write(root: string | null, facts: Facts, entries: Entry[], cwd?: string | null): void {
  try {
    if (!entries.length) return;
    const dir = telemetryDir(root);
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    const log = join(dir, LOG);
    // A log nobody prunes becomes a cost of its own. Rewritten from empty past the cap.
    try { if (existsSync(log) && statSync(log).size > MAX_BYTES) writeFileSync(log, ""); } catch { /* ignore */ }

    let work: Work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: facts.order ?? null };
    try { work = carryTags(dir, facts); } catch { /* the call's own tags stand */ }
    const at = utcNow();
    const repo = repoOf(root, cwd ?? facts.cwd ?? null);
    const lines = entries.map((entry) => JSON.stringify({
      script: entry.script ?? facts.script,
      group: entry.group ?? null, subgroup: entry.subgroup ?? null, action: entry.action ?? null, args: entry.args ?? null,
      event: facts.event ?? null, tool: facts.tool ?? null,
      ms: entry.ms, exit: entry.exit ?? null, at,
      repo: entry.repo !== undefined ? entry.repo : repo, pid: process.pid,
      session: facts.session ?? null, agent: facts.agent ?? null,
      workstream: work.workstream, arc: work.arc, order: work.order,
    }));
    appendFileSync(log, lines.join("\n") + "\n");
  } catch { /* a tool never fails because timing failed */ }
}

/** Arm the recorder. Touches no filesystem beyond the walk, and never throws. */
export function begin(facts: Facts, start?: string): void {
  try {
    state.root = workspaceRoot(start ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
    state.cwd = facts.cwd ?? start ?? process.cwd();
    state.facts = facts;
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}

/**
 * Time one call and hand the span over. Two clock reads are nanoseconds. A call that returns a
 * promise is timed until it settles, so an asynchronous check is not recorded as free.
 */
export function span<T>(name: SpanName, fn: () => T): T {
  const t0 = performance.now();
  const done = () => { try { state.spans.push({ ...name, ms: round(performance.now() - t0) }); } catch { /* ignore */ } };
  let result: T;
  try { result = fn(); } catch (error) { done(); throw error; }
  if (result && typeof (result as { then?: unknown }).then === "function") {
    return (result as unknown as Promise<unknown>).then(
      (value) => { done(); return value; },
      (error) => { done(); throw error; },
    ) as unknown as T;
  }
  done();
  return result;
}

/** Hand over a span measured elsewhere. `exit` is a command's exit code; a hook check leaves it null. */
export function record(name: SpanName, ms: number, exit: number | null = null): void {
  try { state.spans.push({ ...name, ms: round(ms), exit }); } catch { /* ignore */ }
}

/**
 * Write what was measured, and the whole run as one more line, if and only if the switch is present.
 * `exit` is the whole run's exit code for a command; a hook run leaves it null.
 */
export function end(exit: number | null = null): void {
  try {
    const facts = state.facts;
    if (!facts || !state.root || !state.spans.length) return;
    // The whole process, Node start to here. Startup, TypeScript loading and the imports are most of
    // a hook's cost, and no span inside a check can see them.
    const whole: Entry = { ...(facts.process ?? { group: "events", action: null }), ms: round(performance.now()), exit };
    write(state.root, facts, [...state.spans, whole], state.cwd);
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}
