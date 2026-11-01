// This file OWNS these rules — the switch, the row's shape, the size cap and the carried ids — and
// restates the book's RULE.DEVEX.WORKSPACE.185 (spn-foundation `04-capabilities/01-devex/04-workspace/01-workspace/
// 01-workspace.md`, the telemetry row; the spnutils chapter's `timings` paragraph points there).
//
// What a plugin's checks, its commands and the agent's Bash commands cost, written only while the
// developer has asked for it. ONE LIBRARY, IN THE SHARED SUPPORT FOLDER: spn-devex, spn-surface, spn-apps
// and spn-infra each import it by relative path, so the build copies it into each installed plugin's own
// bundle and no plugin reaches into another. All four write the one log `debug hooks show` reads.
//
// ONE ROW FAMILY, READ BY ITS `mtype`: every row holds the base (`LINE_KEYS`, in this order) — `v` (1), `mtype`,
// `id` (a short random id; a model turn's is its message id), `at` (UTC, ending in `Z`, when the thing started),
// `ms`, `event`, then the head `session`, `agent`, `workstream`, `arc`, `part`, `skill`, `work`, `retryOf` — and
// its variant adds only what its kind needs. This library writes two variants: a hook check's run, `CHECK`
// (`check`, `verdict` PASS, NOTE or DENY, `out`), and a command, `COMMAND` (`call` { program, group, action },
// `exit`), and a review panel's verdict, `PANEL` (`lens`, `verdict`), written by `writePanel`. A model turn is `usage.ts`'s, a test run the test runner's. The values are the
// contract's, copied into `telemetry-values.ts`, which toolchain-ts holds to the contract.
//
// A ROW HOLDS IDS, TIMES, COUNTS AND NAMES, NEVER WHAT WAS TYPED: a command is its program, group and action and
// never its arguments, and a free-text field (`workstream`, `arc`, `part`, `check`) that does not match its
// pattern is written as null.
//
// `verdict` is what a hook check decided: `PASS` (it said nothing), `NOTE` (it added words to the context) or
// `DENY` (it refused the call or held the turn). `out` is the bytes put into the context. A send-back is a
// `DENY` row, under PreToolUse or Stop; the words are not kept.
//
// A hook's whole-run line is gone: each check is a row with its own ms. A command's row is its whole run.
//
// NAMES ARE STRUCTURED AT THE CALL SITE, never parsed from a string. A check file with sub-checks is
// `{ group: <file>, action: <sub-check> }` (`split-plan` › `close`); a check file with one check names
// it twice (`saasplane-env` › `saasplane-env`), so every check line has a group to sum by. A whole hook run is
// `{ group: "events", action: <entry> }`, and a whole CLI run `{ group: "cli", action: "cli" }`.
//
// Measuring is free; writing is the cost. `begin()` touches no filesystem, so a check that refuses
// early and exits pays nothing. The switch is read at the moment of writing.
//
// EACH ROW SAYS WHICH WORK IT BELONGS TO. `workstream`, `arc` and `part` are read from what the tool call
// touches (the paths under a workstream, a part's order, or the `workstream go start` call that starts a part),
// `agent` from the hook input when it carries one, and `skill` from the Skill call that names it, so a
// transcript joins to its work by `session`. A call that names none of them inherits what its session and agent
// last carried (`carryTags`); a helper that has no skill of its own takes the one its window runs under.
// `work` is read from the part's id (`workOfPart`).
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors: a gate that
// refuses to run is infinitely more expensive than a number nobody recorded.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomBytes } from "node:crypto";
import { appendLog, readSwitch, sessionDir, telemetryFolder } from "./debug-store.ts";
import { isWorkspaceDevex, workstreamPrefixSource } from "./docs-tree.ts";
import {
  ARC_PATTERN, CHECK_PATTERN, PART_PATTERN, WORKSTREAM_PATTERN, SPDevExAgentHookVerdictType, SPDevExAgentSkillType,
  SPDevExAgentLensType, SPDevExAgentPanelVerdictType, SPDevExWorkspaceTelemetryEventType, SPDevExWorkspaceTelemetryRowType,
  SPDevExWorkspaceTelemetryVersionType, SPDevExWorkstreamWorkType, held, known,
} from "./telemetry-values.ts";

const DEVEX = ".spndevex", LOG = "hooks.jsonl";
const CARRIED = "tags.json";

/** Every key each row carries, in the order it is written; a variant adds its own after them. */
export const LINE_KEYS = ["v", "mtype", "id", "at", "ms", "event", "session", "agent", "workstream", "arc", "part", "skill",
  "work", "retryOf"] as const;

/** What a hook check decided: said nothing, added words to the context, or refused the call or held the turn. */
export type Verdict = "pass" | "note" | "deny";

/** What ran, in up to three levels. `args` is what was typed after the action, or null. */
export type SpanName = { group?: string | null; subgroup?: string | null; action: string | null; args?: string | null };

/**
 * One measured thing, before the facts every row of a run shares are added. For a command, `script` is the
 * program, and `group` and `action` the rest of its call; `args`, `subgroup`, `repo`, `programs`, `program` and
 * `pathKind` are accepted from a caller and written nowhere. `found` names the checks whose findings a Stop
 * run's verdict was judged from.
 */
export type Entry = SpanName & { ms: number; exit?: number | null; script?: string; repo?: string | null; programs?: number;
  program?: string | null; pathKind?: PathKind | null; verdict?: Verdict | null; out?: number | null; found?: string[] };

/**
 * What every row of one run shares. `script` is the plugin; `cwd` is where the call ran, read for
 * `repo`;  `process` names the whole run of a command, written as its row at `end()`.
 */
export type Facts = {
  script: string;
  event: string | null;
  tool: string | null;
  session: string | null;
  agent?: string | null;
  workstream?: string | null;
  arc?: string | null;
  part?: string | null;
  /** The value of SPDevExAgentSkillType the window runs under, where this call names it. */
  skill?: string | null;
  /** The work the row stands for where the caller knows it; else read from the part's id. */
  work?: string | null;
  cwd?: string;
  program?: string | null;
  pathKind?: PathKind | null;
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

/** The kind of file a call touches: under a `.spndevex/` folder, a test, any other file of a repository, or none of those. */
export type PathKind = "WORKSTREAM" | "TEST" | "SOURCE" | "OTHER";

const TEST_PATH = /(?:^|\/)tests?\/|(?:^|\/)t-[^/]+\.mjs$|\.(?:test|spec)\.[A-Za-z]+$/;
const IN_DEVEX = /(?:^|\/)\.spndevex(?:\/|$)/;
const KIND_RANK: PathKind[] = ["OTHER", "SOURCE", "TEST", "WORKSTREAM"];

function kindOfPath(path: string, cwd: string, root: string | null): PathKind {
  const whole = isAbsolute(path) ? path : resolve(cwd, path);
  if (IN_DEVEX.test(whole)) return "WORKSTREAM";
  if (!/\/\.worktrees\//.test(whole) && !repoOf(root, whole)) return "OTHER";
  return TEST_PATH.test(whole) ? "TEST" : "SOURCE";
}

/** The first program of a command, after any `cd …&&` and env assignments; its name, never its folder. */
function programIn(command: string): string | null {
  let rest = command.trim();
  for (let m = /^(?:cd\s+\S+\s*(?:&&|;)\s*|[A-Za-z_]\w*=\S*\s+)/.exec(rest); m; m = /^(?:cd\s+\S+\s*(?:&&|;)\s*|[A-Za-z_]\w*=\S*\s+)/.exec(rest))
    rest = rest.slice(m[0].length);
  const first = rest.split(/\s+/)[0]?.replace(/^["']|["']$/g, "");
  return first ? basename(first) : null;
}

/** The strongest kind among the paths a command names: a word with a slash, or one ending in a file extension. */
function kindInCommand(command: string, cwd: string, root: string | null): PathKind | null {
  let best: PathKind | null = null;
  for (const word of command.split(/\s+/)) {
    const path = word.replace(/^[^=]*=(?=.*[/.])/, "").replace(/^["'(]+|["')\],;]+$/g, "");
    if (!path || /:\/\//.test(path) || !(path.includes("/") || /^[\w.-]+\.(?:mjs|cjs|js|ts|json|jsonl|md|html|py|sh)$/.test(path))) continue;
    const kind = kindOfPath(path, cwd, root);
    if (best === null || KIND_RANK.indexOf(kind) > KIND_RANK.indexOf(best)) best = kind;
  }
  return best;
}

/**
 * What kind of call a hook payload is: the `program` of a Bash command, and the `pathKind` of the file a Read, Edit, Write or
 * search touches (for Bash, of the paths the command names, the strongest of them). Neither holds the path or the command.
 * Null for what the call does not have. Never throws.
 */
export function callOf(payload: { tool_name?: unknown; tool_input?: unknown; cwd?: string } | null | undefined): { program: string | null; pathKind: PathKind | null } {
  const none = { program: null, pathKind: null };
  try {
    if (!payload || !payload.tool_input || typeof payload.tool_input !== "object") return none;
    const input = payload.tool_input as Record<string, unknown>;
    const cwd = typeof payload.cwd === "string" && payload.cwd ? payload.cwd : process.cwd();
    const root = workspaceRoot(cwd);
    if (payload.tool_name === "Bash") {
      const command = typeof input.command === "string" ? input.command : "";
      return { program: programIn(command), pathKind: kindInCommand(command, cwd, root) };
    }
    const file = [input.file_path, input.notebook_path, input.path].find((one) => typeof one === "string" && one) as string | undefined;
    return { program: null, pathKind: file ? kindOfPath(file, cwd, root) : null };
  } catch { return none; }
}

/** The work a row belongs to. Every field is `null` where the call named none. */
export type WorkTags = { workstream: string | null; arc: string | null; part: string | null; agent: string | null };

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

// A Bash call that starts a part names it: `workstream go start <ws>/N<nnn> <part>`; a bare `<NNN>` names no workstream folder.
const GO_START = /\bworkstream\s+go\s+start\s+["']?(?:(\d{3}-[a-z0-9][a-z0-9-]*)|\d{3})\/(N\d{3})["']?\s+["']?([a-z0-9][a-z0-9-]*)/;

/** The work a part's id stands for, from its prefix: `baseline-` and `full-` are TEST, and `docs-`, `code-`, `generated-`, `design-`, `release-` and `proof-` are their own. */
export function workOfPart(part: string | null | undefined): SPDevExWorkstreamWorkType | null {
  const prefix = typeof part === "string" ? /^([a-z]+)-/.exec(part)?.[1] : undefined;
  if (prefix === "baseline" || prefix === "full") return SPDevExWorkstreamWorkType.TEST;
  return prefix ? known(SPDevExWorkstreamWorkType, prefix.toUpperCase()) : null;
}

/**
 * The workstream, arc and part a hook's tool call touches (a part is its order's name, or the part a `workstream go start` names), and the agent that made it.
 *
 * Every string in `tool_input` is read — a file path, a command, an edit — for a path under
 * `.spndevex/workstreams/<state>/<NNN-subject>/`. A relative `arcs/N<n>…` or `notes/N<n>/…` counts
 * only when the call's `cwd` is itself inside a workstream folder, because only then does it name one.
 * Where one call touches several, the most specific wins (an order over an arc over a bare
 * workstream), and the first of those. Never throws.
 */
export function tagsOf(payload: { tool_input?: unknown; cwd?: string; agent_id?: unknown } | null | undefined): WorkTags {
  const none: WorkTags = { workstream: null, arc: null, part: null, agent: null };
  try {
    if (!payload) return none;
    const agent = typeof payload.agent_id === "string" && payload.agent_id ? payload.agent_id : null;
    let best: Place | null = null;
    const consider = (found: Place) => { if (!best || depth(found) > depth(best)) best = found; };
    const strings = stringsOf(payload.tool_input);
    for (const text of strings)
      for (const m of text.matchAll(IN_WORKSTREAM)) {
        const found = tagsIn(m[1], m[2] ?? "");
        consider(found);
      }
    const here = typeof payload.cwd === "string" ? [...payload.cwd.matchAll(IN_WORKSTREAM)][0] : undefined;
    if (here) {
      const base = here[2] ?? "";
      for (const text of strings)
        for (const m of text.matchAll(RELATIVE)) {
          const found = tagsIn(here[1], `${base.replace(/\/+$/, "")}/${m[1]}`);
          consider(found);
        }
    }
    let started: { workstream: string | null; arc: string; part: string } | null = null;
    for (const text of strings) {
      const said = GO_START.exec(text);
      if (said) { started = { workstream: said[1] ?? null, arc: said[2], part: said[3] }; break; }
    }
    const found = best as Place | null;
    if (found) return { workstream: found.workstream, arc: found.arc ?? started?.arc ?? null, part: found.order ?? started?.part ?? null, agent };
    if (started) return { workstream: started.workstream, arc: started.arc, part: started.part, agent };
    return { ...none, agent };
  } catch { return none; }
}

/**
 * The facts a plugin command's lines carry. A command is run by the agent through the shell, so it
 * has no hook payload: its session comes from `CLAUDE_CODE_SESSION_ID`, the variable Claude Code
 * exports to every command it runs, and its workstream, arc and part from the paths in its own
 * arguments and the folder it runs in, read by the same `tagsOf` a hook uses. Its row is one command: the
 * plugin as the program, the first two words typed after the CLI as the group and action (each only if it
 * is a plain lowercase word), and nothing else that was typed. Never throws.
 */
export function commandFacts(script: string, args: string[]): Facts {
  const session = process.env.CLAUDE_CODE_SESSION_ID || null;
  let tags: WorkTags = { workstream: null, arc: null, part: null, agent: null };
  try { tags = tagsOf({ tool_input: { command: args.join(" ") }, cwd: process.cwd() }); } catch { /* ignore */ }
  const word = (one: string | undefined) => (one && /^[a-z0-9][a-z0-9-]*$/.test(one) ? one : null);
  const [group, action] = [word(args[0]), word(args[1])];
  return { script, event: process.env.CLAUDE_HOOK_EVENT ?? "command", tool: null, session, ...tags,
           cwd: process.cwd(), process: { group, action: group ? action : null } };
}

type Work = { workstream: string | null; arc: string | null; part: string | null; skill: string | null };
type Carried = Record<string, Work>;

/**
 * The work a row is written under: its own ids, or the ones carried from the same session and
 * agent's last tagged call (RULE.DEVEX.WORKSPACE.185).
 *
 * - **A call that touches no workstream path inherits** the carried ids.
 * - **A call inside the carried work keeps what it does not name**: the same workstream, and the same
 *   arc where it names one, fills in the carried arc and part.
 * - **A call that names other work replaces them.**
 * - **The skill is the window's**: the one a Skill call named last, carried across work; a helper with none of
 *   its own takes the one its main window runs under.
 *
 * The carried ids are written back whenever they change, in the window's own folder
 * (`sessions/<id>/tags.json`), keyed by agent (`main` for none), so a lane never lends its ids to the
 * main window or to another lane. With no session there is nothing to key on, and the call's own ids
 * stand. A part stays carried until the window names other work; this library cannot see a part land.
 */
export function carryTags(root: string, facts: Partial<Facts>): Work {
  const agent = typeof facts.agent === "string" && facts.agent ? facts.agent : null;
  const own: Work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, part: facts.part ?? null, skill: facts.skill ?? null };
  const session = typeof facts.session === "string" && facts.session ? facts.session : null;
  if (!session) return own;
  const key = agent ?? "main";
  const path = join(sessionDir(root, session), CARRIED);
  let carried: Carried = {};
  try { carried = JSON.parse(readFileSync(path, "utf8")) ?? {}; } catch { carried = {}; }
  const was = carried[key];
  const skill = own.skill ?? was?.skill ?? (agent ? carried.main?.skill ?? null : null);
  let work: Work;
  if (!own.workstream) {
    work = was ? { workstream: was.workstream, arc: own.arc ?? was.arc, part: own.part ?? was.part ?? null, skill } : { ...own, skill };
  }
  else if (was && was.workstream === own.workstream && (!own.arc || own.arc === was.arc) && (!own.part || own.part === was.part))
    work = { workstream: own.workstream, arc: own.arc ?? was.arc, part: own.part ?? was.part ?? null, skill };
  else work = { ...own, skill };
  if ((work.workstream || work.skill) && (!was || was.workstream !== work.workstream || was.arc !== work.arc || (was.part ?? null) !== work.part
      || (was.skill ?? null) !== work.skill)) {
    carried[key] = work;
    try { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(carried), "utf8"); }
    catch { /* a tool never fails because timing failed */ }
  }
  return work;
}

/** Now, in UTC to the second, ending in `Z`; `before` milliseconds earlier where given. */
export function utcNow(before = 0): string {
  return `${new Date(Date.now() - Math.max(0, before)).toISOString().slice(0, 19)}Z`;
}

const round = (ms: number) => Math.round(ms * 100) / 100;

/** A short random id for a row that has no message id. */
export function rowId(): string {
  return randomBytes(4).toString("hex");
}

const VERDICTS: Record<Verdict, string> = {
  pass: SPDevExAgentHookVerdictType.PASS, note: SPDevExAgentHookVerdictType.NOTE, deny: SPDevExAgentHookVerdictType.DENY };

/**
 * Append one row per entry to the workspace's log, if and only if recording is on: a `COMMAND` row where the
 * facts' event is `command`, and a `CHECK` row for any other event. The ids and the head are shared by every
 * entry; an entry may name its own `script`, the command's program. A row whose event the contract does not
 * hold is not written. Never throws.
 */
export function write(root: string | null, facts: Facts, entries: Entry[], cwd?: string | null): void {
  try {
    void cwd;
    if (!entries.length) return;
    const dir = telemetryDir(root);
    if (!dir) return;
    const event = known(SPDevExWorkspaceTelemetryEventType, facts.event);
    if (!event) return;
    let work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, part: facts.part ?? null, skill: facts.skill ?? null };
    try { if (root) work = carryTags(root, facts); } catch { /* the call's own ids stand */ }
    const head = {
      session: facts.session ?? null, agent: facts.agent ?? null,
      workstream: held(work.workstream, WORKSTREAM_PATTERN), arc: held(work.arc, ARC_PATTERN), part: held(work.part, PART_PATTERN),
      skill: known(SPDevExAgentSkillType, work.skill), work: known(SPDevExWorkstreamWorkType, facts.work) ?? workOfPart(held(work.part, PART_PATTERN)),
      retryOf: null,
    };
    const lines = entries.flatMap((entry) => {
      // A CHECK row's `check` is a non-null name; a check whose name fails the pattern writes no row, as an event the contract does not hold writes none.
      const check = held(entry.action ?? entry.group, CHECK_PATTERN);
      if (event !== SPDevExWorkspaceTelemetryEventType.COMMAND && !check) return [];
      const base = {
        v: SPDevExWorkspaceTelemetryVersionType.V1,
        mtype: event === SPDevExWorkspaceTelemetryEventType.COMMAND ? SPDevExWorkspaceTelemetryRowType.COMMAND : SPDevExWorkspaceTelemetryRowType.CHECK,
        id: rowId(), at: utcNow(entry.ms), ms: entry.ms, event,
      };
      if (event === SPDevExWorkspaceTelemetryEventType.COMMAND)
        return [JSON.stringify({ ...base, ...head, call: { program: entry.script ?? facts.script ?? null, group: entry.group ?? null, action: entry.action ?? null },
                                exit: entry.exit ?? null })];
      return [JSON.stringify({ ...base, ...head, check,
                              verdict: VERDICTS[entry.verdict ?? "pass"], out: entry.out ?? null })];
    });
    if (lines.length) appendLog(join(dir, LOG), lines.join("\n"));
  } catch { /* a tool never fails because timing failed */ }
}

/**
 * Append one `PANEL` row to the workspace's log, if and only if recording is on: a review panel's verdict (RULE.DEVEX.WORKSPACE.485).
 * The row holds the base and the head every row carries, then the `lens` and the `verdict`. The facts' own workstream, arc and part
 * stand where the panel's launch named a workstream; where it named none, the main window's carried ids are read, with no agent,
 * so a lane never lends its ids and the main window's are only read here. A lens or verdict the contract does not hold writes no
 * row. Never throws.
 *
 * @param panel  the lens and the verdict, as the contract's values; `ms` is how long the panel ran
 */
export function writePanel(root: string | null, facts: Facts, panel: { lens: string | null; verdict: string | null; ms?: number }): void {
  try {
    const dir = telemetryDir(root);
    if (!root || !dir) return;
    const lens = known(SPDevExAgentLensType, panel.lens);
    const verdict = known(SPDevExAgentPanelVerdictType, panel.verdict);
    if (!lens || !verdict) return;
    let work = { workstream: facts.workstream ?? null, arc: facts.arc ?? null, part: facts.part ?? null, skill: facts.skill ?? null };
    if (!work.workstream) {
      try { work = carryTags(root, { session: facts.session, script: facts.script, event: facts.event, tool: null, arc: facts.arc, part: facts.part, skill: facts.skill }); }
      catch { /* the call's own ids stand */ }
    }
    const part = held(work.part, PART_PATTERN);
    const ms = Math.max(0, Math.round(panel.ms ?? 0));
    const row = {
      v: SPDevExWorkspaceTelemetryVersionType.V1, mtype: SPDevExWorkspaceTelemetryRowType.PANEL, id: rowId(), at: utcNow(ms), ms,
      event: SPDevExWorkspaceTelemetryEventType.SUBAGENT_STOP,
      session: facts.session ?? null, agent: facts.agent ?? null,
      workstream: held(work.workstream, WORKSTREAM_PATTERN), arc: held(work.arc, ARC_PATTERN), part,
      skill: known(SPDevExAgentSkillType, work.skill), work: known(SPDevExWorkstreamWorkType, facts.work) ?? workOfPart(part), retryOf: null,
      lens, verdict,
    };
    appendLog(join(dir, LOG), JSON.stringify(row));
  } catch { /* a tool never fails because timing failed */ }
}

/**
 * Carry the facts' workstream, arc, part and skill onto the window's later rows without writing a row. A call that runs no
 * check (a `Skill` call) uses this: it names the skill the window runs under, and a CHECK row is one check's run.
 */
export function carry(): void {
  try {
    if (!state.root || !state.facts || !telemetryDir(state.root)) return;
    carryTags(state.root, state.facts);
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
function judge(result: unknown, event: string | null): { verdict: Verdict; out: number | null; found?: string[] } {
  const items = Array.isArray(result) ? result : [result];
  const spoken = items.filter((one) => wordsOf(one) !== null);
  if (!spoken.length) return { verdict: "pass", out: null };
  const found = spoken.flatMap((one) => typeof one === "object" && one && typeof (one as { check?: unknown }).check === "string" ? [(one as { check: string }).check] : []);
  const out = spoken.reduce((sum, one) => sum + Buffer.byteLength(wordsOf(one) as string), 0);
  const refused = spoken.some((one) => typeof one === "object" && typeof (one as { deny?: unknown }).deny === "string")
    || (Array.isArray(result) && event === "Stop");
  return { verdict: refused ? "deny" : "note", out, found };
}

/**
 * Settle a Stop run's verdicts to what was said. A Stop check's findings are judged `deny` as they are found, and a
 * finding that is held or already said is not a send-back, so the checks that were said keep `deny` and the others
 * with findings become `note`. A run of any other event is left as judged.
 */
export function settle(said: string[]): void {
  try {
    if (state.facts?.event !== "Stop") return;
    for (const one of state.spans)
      if (one.verdict === "deny" && !(one.found ?? []).some((check) => said.includes(check))) one.verdict = "note";
  } catch { /* ignore */ }
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
 * Write what was measured, if and only if the switch is present. A hook run writes one `CHECK` row for each check it
 * timed and nothing for the run as a whole, so a run that timed no check writes nothing (`always` is kept for the callers
 * that pass it, and changes nothing). A command run writes its one `COMMAND` row, with `exit` as the whole run's exit code.
 */
export function end(exit: number | null = null, always = false, run?: { verdict?: Verdict; out?: number | null }): void {
  try {
    void always; void run;
    const facts = state.facts;
    if (!facts || !state.root) return;
    if (facts.event === "command") {
      // The whole process, Node start to here: a command's cost is its run.
      const whole: Entry = { ...(facts.process ?? { group: null, action: null }), script: facts.script, ms: round(performance.now()), exit };
      write(state.root, facts, [whole], state.cwd);
    } else if (state.spans.length) write(state.root, facts, state.spans, state.cwd);
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}
