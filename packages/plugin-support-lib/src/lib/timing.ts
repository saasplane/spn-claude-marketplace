// This file OWNS these rules — the switch, the line's shape, the size cap and the carried tags — and
// restates the book's RULE.DEVEX.WORKSPACE.185 (spn-foundation `04-capabilities/01-devex/03-utils/
// 01-spnutils/01-utils.md` § the `timings` paragraph).
//
// What a plugin's checks, its commands and the agent's Bash commands cost, written only while the
// developer has asked for it. ONE LIBRARY, IN THE SHARED SUPPORT FOLDER: spn-devex, spn-surface, spn-apps
// and spn-infra each import it by relative path, so the build copies it into each installed plugin's own
// bundle and no plugin reaches into another. All four write the one log `debug hooks show` reads.
//
// ONE LINE SHAPE, WHOEVER WRITES IT (`LINE_KEYS`, in this order): `script` (the plugin, or the program
// a Bash command ran), `group`, `subgroup`, `action` (up to three levels below it, null where unused),
// `args` (what was typed after the action, a secret-looking option's value written `***`; null for a
// hook check), `event`, `tool`, `ms`, `exit` (null for a hook check), `at` (UTC, ending in `Z`),
// `repo` (the member repository the call ran in; null at the workspace root), `pid`, `verdict` and
// `out`, and the work tags `session`, `agent`, `workstream`, `arc`, `order`, `row`. A Bash command's
// line carries one more key after those, `programs`: how many programs the filter names the call ran.
// No other line carries it.
//
// `verdict` is what a hook check decided: `pass` (it said nothing), `note` (it added words to the
// context) or `deny` (it refused the call or held the turn); null on a command's line. `out` is the
// bytes put into the context: the words a check added, the tool's response on a `PostToolUse` run's
// whole-run line, a timed command's output; null where none.
//
// NAMES ARE STRUCTURED AT THE CALL SITE, never parsed from a string. A check file with sub-checks is
// `{ group: <file>, action: <sub-check> }` (`split-plan` › `close`); a check file with one check names
// it twice (`env-seat` › `env-seat`), so every check line has a group to sum by. A whole hook run is
// `{ group: "events", action: <entry> }`, and a whole CLI run `{ group: "cli", action: "cli" }`.
//
// Measuring is free; writing is the cost. `begin()` touches no filesystem, so a check that refuses
// early and exits pays nothing. The switch is read at the moment of writing.
//
// EACH LINE SAYS WHICH WORK IT BELONGS TO. `workstream`, `arc`, `order` and `row` are read from the paths
// the tool call touches (`row` from an order's front matter, or from the Bash call that moves a row to
// `running`), and `agent` from the hook input when it carries one, so a transcript joins to its work by
// `session`. A call that touches no workstream path inherits the tags its session and agent last carried
// (`carryTags`). An order is a child's brief, so a main window's lines carry `order: null`.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors: a gate that
// refuses to run is infinitely more expensive than a number nobody recorded.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { appendLog, readSwitch, sessionDir, telemetryFolder } from "./debug-store.ts";
import { isWorkspaceDevex, workstreamPrefixSource } from "./docs-tree.ts";

const DEVEX = ".spndevex", LOG = "hooks.jsonl";
const CARRIED = "tags.json";

/** Every key each line carries, in the order it is written. A Bash command's line adds `programs` after them. */
export const LINE_KEYS = ["script", "group", "subgroup", "action", "args", "event", "tool", "ms", "exit", "at",
  "repo", "pid", "verdict", "out", "session", "agent", "workstream", "arc", "order", "row"] as const;

/** What a hook check decided: said nothing, added words to the context, or refused the call or held the turn. */
export type Verdict = "pass" | "note" | "deny";

/** What ran, in up to three levels. `args` is what was typed after the action, or null. */
export type SpanName = { group?: string | null; subgroup?: string | null; action: string | null; args?: string | null };

/**
 * One measured thing, before the facts every line of a run shares are added. `programs` is set for a
 * Bash command alone, and only an entry that sets it writes the key.
 */
export type Entry = SpanName & { ms: number; exit?: number | null; script?: string; repo?: string | null; programs?: number;
  verdict?: Verdict | null; out?: number | null };

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
  row?: string | null;
  cwd?: string;
  process?: SpanName;
};

const state: { root: string | null; cwd: string | null; facts: Facts | null; spans: Entry[] } =
  { root: null, cwd: null, facts: null, spans: [] };

/** The folder holding a workspace's `.spndevex`, walked up from where the caller stood. */
export function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, DEVEX)) && isWorkspaceDevex(readdirSync(join(path, DEVEX)))) return path;
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
    return readSwitch(root, "telemetry") ? telemetryFolder(root) : null;
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
export type WorkTags = { workstream: string | null; arc: string | null; order: string | null; row: string | null; agent: string | null };

// `.spndevex/workstreams/<state>/<NNN-subject>/` and whatever follows it inside that folder.
const IN_WORKSTREAM = new RegExp(`${workstreamPrefixSource()}(\\d{3}-[A-Za-z0-9-]+)((?:\\/[^\\s'"\`)\\]|;&<>]*)?)`, "g");
// Inside one: `arcs/N<n>…` names the arc, and so does an arc kept as data, `arcs/N<n>/state.json`;
// `notes/N<n>/…` names it too (and so does a notes folder named past its arc, `notes/N<n>-<subject>/`),
// and `notes/N<n>…/orders/<order>…` names the order as well, its report and its ledger with it.
const ARC_FILE = /^\/arcs\/(N\d+[a-z]?)(?:[-./]|$)/i;
const ARC_NOTES = /^\/notes\/(N\d+[a-z]?)(?:-[^/]*)?(?:\/|$)/i;
const ORDER_FILE = /^\/notes\/N\d+[a-z]?(?:-[^/]*)?\/orders\/([^/]+?)(?:\.(?:report|ledger))?(?:\.md)?(?:\/|$)/i;
// A relative path from inside a workstream folder, as a command run there spells it.
const RELATIVE = /(?:^|[\s'"`=(])((?:arcs\/N\d+[a-z]?[^\s'"`)\]|;&<>]*)|(?:notes\/N\d+[a-z]?[^\s'"`)\]|;&<>]*))/gi;

function stringsOf(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const one of value) stringsOf(one, out);
  else if (value && typeof value === "object") for (const one of Object.values(value)) stringsOf(one, out);
  return out;
}

type Place = Pick<WorkTags, "workstream" | "arc" | "order">;

/** An order's name is its file's stem: no `.md`, `.report` or `.ledger`, and no punctuation a sentence left on it. */
function orderStem(name: string): string {
  let stem = name;
  for (let again = true; again;) {
    const next = stem.replace(/[,.:;]+$/, "").replace(/\.(?:md|report|ledger)$/, "");
    again = next !== stem;
    stem = next;
  }
  return stem;
}

function tagsIn(workstream: string, rest: string): Place {
  const order = rest.match(ORDER_FILE)?.[1] ?? null;
  const arc = rest.match(ARC_FILE)?.[1] ?? rest.match(ARC_NOTES)?.[1] ?? null;
  return { workstream, arc: arc ? arc.toUpperCase() : null, order: order ? orderStem(order) : null };
}

const depth = (tags: Place) => (tags.order ? 3 : tags.arc ? 2 : 1);

/** The `row:` an order's front matter names, or null where the file, the front matter or the field is absent. */
function rowOfOrder(file: string): string | null {
  try {
    const head = readFileSync(file, "utf8").slice(0, 2000);
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(head)?.[1];
    return front ? /^row:\s*["']?([^"'\s#]+)["']?\s*$/m.exec(front)?.[1] ?? null : null;
  } catch { return null; }
}

// A Bash call that moves a row to `running` names the row it works: `workstream row state <ws>/N<nnn> <row> running`.
const ROW_RUNNING = /\bworkstream\s+row\s+state\s+\S+\s+["']?([A-Za-z0-9._-]+)["']?\s+running\b/;

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
  const none: WorkTags = { workstream: null, arc: null, order: null, row: null, agent: null };
  try {
    if (!payload) return none;
    const agent = typeof payload.agent_id === "string" && payload.agent_id ? payload.agent_id : null;
    let best: Place | null = null;
    let bestFile: string | null = null;
    // The order file each candidate names, so the winning order's front matter can be read for its row.
    const consider = (found: Place, orderFile: string | null) => {
      if (!best || depth(found) > depth(best)) { best = found; bestFile = found.order ? orderFile : null; }
    };
    const strings = stringsOf(payload.tool_input);
    const orderPath = (folder: string, order: string | null) => (order ? `${folder.replace(/\/orders\/.*$/, "/orders/")}${order}.md` : null);
    for (const text of strings)
      for (const m of text.matchAll(IN_WORKSTREAM)) {
        const found = tagsIn(m[1], m[2] ?? "");
        const lead = text.slice(0, m.index).match(/[^\s'"`=(]*$/)?.[0] ?? "";
        const whole = `${lead}${m[0]}`;
        consider(found, orderPath(isAbsolute(whole) ? whole : resolve(payload.cwd ?? ".", whole), found.order));
      }
    const here = typeof payload.cwd === "string" ? [...payload.cwd.matchAll(IN_WORKSTREAM)][0] : undefined;
    if (here) {
      const base = here[2] ?? "";
      const folder = (payload.cwd as string).slice(0, (here.index ?? 0) + here[0].length - base.length);
      for (const text of strings)
        for (const m of text.matchAll(RELATIVE)) {
          const found = tagsIn(here[1], `${base.replace(/\/+$/, "")}/${m[1]}`);
          consider(found, orderPath(join(folder, base, m[1]), found.order));
        }
    }
    let row: string | null = null;
    for (const text of strings) { const said = ROW_RUNNING.exec(text)?.[1]; if (said) { row = said; break; } }
    const found = best as Place | null;
    if (!row && bestFile) row = rowOfOrder(bestFile);
    return found ? { ...found, row, agent } : { ...none, row, agent };
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
  let tags: WorkTags = { workstream: null, arc: null, order: null, row: null, agent: null };
  try { tags = tagsOf({ tool_input: { command: args.join(" ") }, cwd: process.cwd() }); } catch { /* ignore */ }
  let typed: string | null = null;
  try { typed = argsText(process.argv.slice(2)); } catch { typed = null; }
  return { script, event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session, ...tags,
           cwd: process.cwd(), process: { group: "cli", action: "cli", args: typed } };
}

type Work = { workstream: string | null; arc: string | null; order: string | null; row: string | null };
type Carried = Record<string, Work>;

/**
 * The work a line is written under: its own tags, or the ones carried from the same session and
 * agent's last tagged call (RULE.DEVEX.WORKSPACE.185).
 *
 * - **A call that touches no workstream path inherits** the carried tags.
 * - **A call inside the carried work keeps what it does not name**: the same workstream, and the same
 *   arc where it names one, fills in the carried arc, order and row. A lane reading its arc's spec is
 *   still working its order.
 * - **A call that names other work replaces them.**
 * - **A main window carries no order**: an order is a child's brief, so a main window's `order` is null
 *   and its `row` is the one of the order it writes or the row it moves to `running`.
 *
 * The carried tags are written back whenever they change, in the window's own folder
 * (`sessions/<id>/tags.json`), keyed by agent (`main` for none), so a lane never lends its tags to the
 * main window or to another lane. With no session there is nothing to key on, and the call's own tags
 * stand.
 */
export function carryTags(root: string, facts: Partial<Facts>): Work {
  const agent = typeof facts.agent === "string" && facts.agent ? facts.agent : null;
  const own: Work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: agent ? facts.order ?? null : null,
                      row: facts.row ?? null };
  const session = typeof facts.session === "string" && facts.session ? facts.session : null;
  if (!session) return own;
  const key = agent ?? "main";
  const path = join(sessionDir(root, session), CARRIED);
  let carried: Carried = {};
  try { carried = JSON.parse(readFileSync(path, "utf8")) ?? {}; } catch { carried = {}; }
  const was = carried[key];
  let work: Work;
  if (!own.workstream) {
    work = was ? { workstream: was.workstream, arc: was.arc, order: was.order, row: own.row ?? was.row ?? null } : own;
  }
  else if (was && was.workstream === own.workstream && (!own.arc || own.arc === was.arc) && (!own.order || own.order === was.order))
    work = { workstream: own.workstream, arc: own.arc ?? was.arc, order: own.order ?? was.order, row: own.row ?? was.row ?? null };
  else work = own;
  if (work.workstream && (!was || was.workstream !== work.workstream || was.arc !== work.arc || was.order !== work.order || (was.row ?? null) !== work.row)) {
    carried[key] = work;
    try { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(carried), "utf8"); }
    catch { /* a tool never fails because timing failed */ }
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
    let work: Work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, order: facts.agent ? facts.order ?? null : null,
                       row: facts.row ?? null };
    try { if (root) work = carryTags(root, facts); } catch { /* the call's own tags stand */ }
    const at = utcNow();
    const repo = repoOf(root, cwd ?? facts.cwd ?? null);
    const lines = entries.map((entry) => JSON.stringify({
      script: entry.script ?? facts.script,
      group: entry.group ?? null, subgroup: entry.subgroup ?? null, action: entry.action ?? null, args: entry.args ?? null,
      event: facts.event ?? null, tool: facts.tool ?? null,
      ms: entry.ms, exit: entry.exit ?? null, at,
      repo: entry.repo !== undefined ? entry.repo : repo, pid: process.pid,
      verdict: entry.verdict ?? null, out: entry.out ?? null,
      session: facts.session ?? null, agent: facts.agent ?? null,
      workstream: work.workstream, arc: work.arc, order: work.order, row: work.row,
      ...(entry.programs !== undefined ? { programs: entry.programs } : {}),
    }));
    appendLog(join(dir, LOG), lines.join("\n"));
  } catch { /* a tool never fails because timing failed */ }
}

/** The whole run's verdict and `out`: the worst of its checks' (`deny` over `note` over `pass`), their words summed, unless the run gives its own. */
function wholeJudgement(spans: Entry[], run?: { verdict?: Verdict; out?: number | null }): { verdict: Verdict; out: number | null } {
  const worst: Verdict = spans.some((one) => one.verdict === "deny") ? "deny" : spans.some((one) => one.verdict === "note") ? "note" : "pass";
  const words = spans.reduce((sum, one) => sum + (one.out ?? 0), 0);
  return { verdict: run?.verdict ?? worst, out: run && "out" in run ? run.out ?? null : worst === "pass" ? null : words };
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

/** The words a check's result carries: a string, or a `deny`, `note` or `message` field; nothing for anything else. */
function wordsOf(one: unknown): string | null {
  if (typeof one === "string") return one || null;
  if (!one || typeof one !== "object") return null;
  const held = one as { deny?: unknown; note?: unknown; message?: unknown };
  for (const field of [held.deny, held.note, held.message]) if (typeof field === "string" && field) return field;
  return null;
}

/**
 * What a check's result says. Nothing (null, an empty string or list, an object with no words) is
 * `pass`. A `deny` field is `deny`; a string or a `note` is `note`. A list of findings is `note`, and
 * `deny` where the event is `Stop` (a finding there holds the turn) or any finding carries a `deny`.
 */
function judge(result: unknown, event: string | null): { verdict: Verdict; out: number | null } {
  const items = Array.isArray(result) ? result : [result];
  const spoken = items.filter((one) => wordsOf(one) !== null);
  if (!spoken.length) return { verdict: "pass", out: null };
  const out = spoken.reduce((sum, one) => sum + Buffer.byteLength(wordsOf(one) as string), 0);
  const refused = spoken.some((one) => typeof one === "object" && typeof (one as { deny?: unknown }).deny === "string")
    || (Array.isArray(result) && event === "Stop");
  return { verdict: refused ? "deny" : "note", out };
}

/**
 * Time one call and hand the span over, with the verdict its result gives (`judge`). Two clock reads
 * are nanoseconds. A call that returns a promise is timed until it settles, so an asynchronous check
 * is not recorded as free.
 */
export function span<T>(name: SpanName, fn: () => T): T {
  const t0 = performance.now();
  const done = (result?: unknown) => {
    try { state.spans.push({ ...name, ms: round(performance.now() - t0), ...judge(result, state.facts?.event ?? null) }); }
    catch { /* ignore */ }
  };
  let result: T;
  try { result = fn(); } catch (error) { done(); throw error; }
  if (result && typeof (result as { then?: unknown }).then === "function") {
    return (result as unknown as Promise<unknown>).then(
      (value) => { done(value); return value; },
      (error) => { done(); throw error; },
    ) as unknown as T;
  }
  done(result);
  return result;
}

/**
 * Hand over a span measured elsewhere. `exit` is a command's exit code; a hook check leaves it null.
 * A hook check that is not run through `span` gives its `verdict` and `out` here.
 */
export function record(name: SpanName, ms: number, exit: number | null = null, verdict: Verdict | null = null, out: number | null = null): void {
  try { state.spans.push({ ...name, ms: round(ms), exit, verdict, out }); } catch { /* ignore */ }
}

/**
 * Write what was measured, and the whole run as one more line, if and only if the switch is present.
 * `exit` is the whole run's exit code for a command; a hook run leaves it null. A run that timed no
 * check writes nothing, unless `always` asks for its whole-run line: the hook after a failed call
 * runs no check, and its cost is still read from that line.
 */
export function end(exit: number | null = null, always = false, run?: { verdict?: Verdict; out?: number | null }): void {
  try {
    const facts = state.facts;
    if (!facts || !state.root || (!state.spans.length && !always)) return;
    // The whole process, Node start to here. Startup, TypeScript loading and the imports are most of
    // a hook's cost, and no span inside a check can see them.
    const whole: Entry = { ...(facts.process ?? { group: "events", action: null }), ms: round(performance.now()), exit,
                           ...(facts.event === "command" ? {} : wholeJudgement(state.spans, run)) };
    write(state.root, facts, [...state.spans, whole], state.cwd);
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}
