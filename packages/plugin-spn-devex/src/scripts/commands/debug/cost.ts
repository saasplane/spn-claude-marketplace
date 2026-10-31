// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug cost show <target> [--json]
//
// What a target cost, read from the telemetry alone (`lib/cost.ts`): `all` prints a line for each workstream, a
// workstream one for each arc, an arc one for each row and order, a window the window and each child. The target
// chooses the breakdown, so there is no option to group or to choose money; `--from` and `--to` bound the split to a time,
// and `--lead` to the windows the developer talks to, with no child.
//
// A workstream or an arc is also split by what its calls were: change, proof, managing, refusals and waiting, counted
// from `hooks.jsonl` alone (MKT.HOOKS.321). A call is one tool call the hooks saw; the agent's own words are never read.
// The classes are the 31 October measure's (`036-agent-follows-rules`, notes N010 `slowness-measure.md`): its MANAGE is managing, its
// CHANGE and PROOF the same, its REFUSED and RETRY together refusals, and its READ is kept as reading, with no column.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { TEST_RUNNERS } from "../../lib/command-reader.ts";
import { type CostRow, readCost } from "../../lib/cost.ts";
import { MODEL_PRICES } from "../../lib/model-prices.ts";

export const describe = "what a target cost, read from the telemetry: replies, tokens, the model's time, the model and the money, and a workstream's calls split into change, proof, managing, refusals and waiting";

/** A count as a person reads it: millions and thousands with their letter. */
function shown(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

/** The model's time as minutes and seconds. */
function clock(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, "0")}s` : `${seconds}s`;
}

const dollars = (money: number | null): string => (money === null ? "unknown" : `$${money.toFixed(2)}`);

function print(rows: CostRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("Line".padEnd(width) + "Replies".padStart(8) + "Fresh".padStart(9) + "Cache read".padStart(12) + "Cache write".padStart(13) +
    "Output".padStart(9) + "Model time".padStart(12) + "  " + "Model".padEnd(24) + "Money".padStart(9));
  for (const row of rows)
    console.log(row.key.padEnd(width) + String(row.replies).padStart(8) + shown(row.input).padStart(9) + shown(row.cacheRead).padStart(12) +
      shown(row.cacheWrite).padStart(13) + shown(row.output).padStart(9) + clock(row.modelMs).padStart(12) + "  " +
      (row.models.join(", ") || "-").padEnd(24) + dollars(row.money).padStart(9));
}

const CLASSES = ["change", "proof", "managing", "refusals", "waiting"] as const;
type Class = (typeof CLASSES)[number];
/** What a call was before it is a column: the five, and reading, which the sheet has no column for but the measure's percentages count. */
type Kind = Class | "reading";
const KINDS: readonly Kind[] = [...CLASSES, "reading"];
type Share = { calls: number; minutes: number };
/** One line of the split: the calls and the minutes of each class under a key (an arc, or an arc's row). */
export type SplitRow = { key: string } & Record<Kind, Share>;
/** What bounds a split: a time (ms) from and to, and whether only the windows the developer talks to (no child) count. */
export type SplitScope = { from?: number; to?: number; lead?: boolean };

/** A gap longer than this between two calls of a window is the window waiting, not working. */
const WAIT_MS = 5 * 60_000;
/** A refusal is retried by a call within this many calls of it (4 in the measure), a proof run within `PROOF_RETRY` of a land, test-run or push refusal. */
const RETRY_CALLS = 4, PROOF_RETRY = 10;

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** The strongest wins: change over proof over managing over reading (the measure's order). */
const STRENGTH: readonly Kind[] = ["reading", "managing", "proof", "change"];
const stronger = (a: Kind | null, b: Kind): Kind => (a !== null && STRENGTH.indexOf(a) >= STRENGTH.indexOf(b) ? a : b);

const GIT_MANAGING = /^(add|commit|push|pull|merge|rebase|checkout|switch|branch|worktree|stash|tag|fetch|reset|cherry-pick|status)$/;

/**
 * What one program of a Bash command was, as the measure's `bashcls.py` classes a segment: a test run or a check of docs is
 * proof, the workstream CLI, `spnutils`, git and the process tools are managing, a write the generator makes or a git move
 * of a repo file is change, and anything else the hooks record is reading.
 */
function classOfCommand(line: Record<string, unknown>): Kind {
  const script = text(line.script) ?? "", group = text(line.group) ?? "", sub = text(line.subgroup) ?? "", action = text(line.action) ?? "", args = text(line.args) ?? "";
  if (TEST_RUNNERS.includes(script) || script === "nx" || group === "test") return "proof";
  if (script === "git") {
    if (/^(mv|rm|restore|apply)$/.test(action)) return args.includes(".spndevex") ? "managing" : "change";
    return GIT_MANAGING.test(action) ? "managing" : "reading";
  }
  if (script === "spn-devex" || script.startsWith("spn-")) {
    if (group === "restates" || group === "docs") return [sub, action].includes("write") ? (sub === "cycles" ? "managing" : "change") : "proof";
    return "managing";
  }
  if (script === "spnutils") return /\b(test|verify|validate)\b/.test(`${group} ${sub} ${action}`) ? "proof" : "managing";
  if (script === "gh" || script === "claude" || /^(lsof|pgrep|ps|kill|pkill)$/.test(script)) return "managing";
  if (/^(test|verify|lint|typecheck|build)$/.test(action)) return "proof";
  return "reading";
}

const WRITERS = /^(cp|mv|rm|mkdir|rmdir|touch|ln|tar)$/;

/**
 * What a call was from the `program` and `pathKind` its record carries, the measure's way (`bashcls.py`, `classify.py`): a file or a
 * path of the workstream is managing, a write to a source or test file is change, a test runner or a `node` run of a test file is
 * proof, and a read or a write elsewhere is reading. Null where the record says nothing that settles it, or lacks both.
 */
function classOfKind(tool: string | null, program: string | null, pathKind: string | null): Kind | null {
  if (tool === "Bash") {
    if (program && /^(vitest|tsc|eslint)$/.test(program)) return "proof";
    if (program === "node" && pathKind === "TEST") return "proof";
    if (program && WRITERS.test(program)) return pathKind === "WORKSTREAM" ? "managing" : pathKind === "SOURCE" || pathKind === "TEST" ? "change" : null;
    return pathKind === "WORKSTREAM" ? "managing" : null;
  }
  if (!pathKind) return null;
  if (pathKind === "WORKSTREAM") return "managing";
  return tool === "Read" || pathKind === "OTHER" ? "reading" : "change";
}

/** A command of the plugin or `spnutils` that exited with a status is a refusal (the measure reads `usage:`, `Refused:` and `Denied:` from the output, which the log does not hold). */
const refusedByExit = (line: Record<string, unknown>): boolean =>
  (line.script === "spn-devex" || line.script === "spnutils") && typeof line.exit === "number" && line.exit !== 0;

type Call = { workstream: string | null; arc: string | null; row: string | null; kind: Kind; minutes: number; at: number; lead: boolean };
/** A window's line of calls, as the retry rule reads it. */
type Stream = { at: number | null; commands: Kind[]; targets: string[]; bare: boolean; refused: boolean; check: string | null; index: number;
  refusals: Refusal[] };
/** A refusal a later call may retry; `open` is a refused Bash command (no text in the log) not yet followed by its retry. */
type Refusal = { index: number; check: string; target: string; open: boolean };

/**
 * Every call the hooks log holds, once, with the minutes since the stream's previous call. A stream is a window or one
 * child of it. A call is one Bash command that ran (`PostToolUse`, its programs giving the class), a Read, Edit or Write the
 * hooks saw before it ran, an `Agent` launch, or a call a check refused (`PreToolUse` with a `deny`). A refusal that
 * a call of the same kind repeats within a few calls is followed by a retry, and counts with the refusals. A gap past `WAIT_MS` is
 * a wait of its own.
 *
 * A record that carries `program` and `pathKind` (`callOf`) is classed from them (`classOfKind`). An older record lacks them, and
 * then the log cannot say what the measure's transcripts could: a Read, Edit or Write holds no path, so it is read by who made
 * it (a window's own Read, Edit or Write is its records, which the measure found were most of them; a child's Edit or Write is the change and its Read is reading); a Bash command
 * of a program the hooks do not record (`cat`, `sed`, `python`) holds no text, so it is reading, never a write in the repository or
 * a read of the workstream's files; a `sleep` or a `Monitor` is not seen, so waiting is the long gap alone; and a refusal by a
 * CLI is read from its exit status, not from the words it printed.
 */
function readCalls(root: string, scope: SplitScope = {}): Call[] {
  const calls: Call[] = [];
  const streams = new Map<string, Stream>();
  const stream = (key: string): Stream => {
    let held = streams.get(key);
    if (!held) { held = { at: null, commands: [], targets: [], bare: false, refused: false, check: null, index: 0, refusals: [] }; streams.set(key, held); }
    return held;
  };
  for (const file of logFiles(join(telemetryFolder(root), "hooks.jsonl"))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const one = JSON.parse(raw) as Record<string, unknown>;
        const at = Date.parse(text(one.at) ?? "");
        if (!Number.isFinite(at)) continue;
        if (scope.from !== undefined && at < scope.from) continue;
        if (scope.to !== undefined && at > scope.to) continue;
        const lead = !text(one.agent);
        if (scope.lead && !lead) continue;
        const held = stream(`${text(one.session) ?? "-"}/${text(one.agent) ?? ""}`);
        const event = text(one.event), tool = text(one.tool);
        if (event === "command") {
          held.commands.push(classOfCommand(one));
          held.targets.push([one.script, one.group, one.action].filter((word) => typeof word === "string" && word).join(" "));
          held.bare ||= one.script === "spn-devex" && !text(one.group) && !text(one.args);
          if (refusedByExit(one)) { held.refused = true; held.check = `cli:${text(one.action) ?? ""}`; }
          continue;
        }
        if (event === "PreToolUse" && one.verdict === "deny" && one.group !== "events") { held.check = text(one.group); continue; }
        if (one.group !== "events" || one.script !== "spn-devex") continue;
        let kind: Kind | null = null, refused = false;
        if (event === "PreToolUse" && one.verdict === "deny") { refused = true; held.commands = []; held.targets = []; held.bare = false; }
        else if (event === "PostToolUse" || event === "PostToolUseFailure") {
          if (tool !== "Bash") continue;
          kind = stronger(held.commands.reduce<Kind | null>(stronger, null), classOfKind("Bash", text(one.program), text(one.pathKind)) ?? "reading");
          refused = held.refused;
        }
        else if (event === "PreToolUse" && tool === "Read") kind = classOfKind(tool, null, text(one.pathKind)) ?? (lead ? "managing" : "reading");
        else if (event === "PreToolUse" && tool && /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) kind = classOfKind(tool, null, text(one.pathKind)) ?? (lead ? "managing" : "change");
        else if (event === "PreToolUse" && tool === "Agent") kind = "managing";
        else continue;
        const target = tool === "Bash" ? held.targets[0] ?? "Bash" : tool ?? "";
        const bare = held.bare, check = held.check ?? "";
        held.commands = []; held.targets = []; held.bare = false; held.refused = false; held.check = null;
        if (refused) kind = "refusals";
        else {
          const first = held.refusals.find((past) => retries(past, held.index, target, tool === "Bash", bare, kind as Kind));
          if (first) { first.open = false; kind = "refusals"; }
        }
        if (refused) held.refusals.push({ index: held.index, check, target, open: tool === "Bash" && event === "PreToolUse" });
        held.index += 1;
        const gap = held.at === null ? 0 : Math.max(0, at - held.at);
        held.at = at;
        const tags = { workstream: text(one.workstream), arc: text(one.arc), row: text(one.row), at, lead };
        if (gap > WAIT_MS) { calls.push({ ...tags, kind: "waiting", minutes: gap / 60_000 }); calls.push({ ...tags, kind, minutes: 0 }); }
        else calls.push({ ...tags, kind, minutes: gap / 60_000 });
      } catch { /* a torn last line is skipped */ }
    }
  }
  return calls;
}

/**
 * Whether a call retries a refusal, as the measure's `classify.py` reads one: the bare usage read a `usage-first` refusal asks
 * for, a proof run soon after a land, test-run, proof-run or push refusal, the call right after a command-shape refusal, or a call of
 * the same target within `RETRY_CALLS` (a refused Bash command has no text in the log, so the next Bash command stands for its retry).
 */
function retries(past: Refusal, index: number, target: string, bash: boolean, bare: boolean, kind: Kind): boolean {
  const distance = index - past.index;
  if (distance > PROOF_RETRY) return false;
  if (past.check === "usage-first" && distance <= 3 && bare) return true;
  if (/^(test-run|proof-run|push-tiers|cli:land)$/.test(past.check) && kind === "proof") return true;
  if (past.check === "command-shape" && distance <= 1) return true;
  return distance <= RETRY_CALLS && (bash && past.open ? true : past.target !== "Bash" && past.target === target);
}

const empty = (key: string): SplitRow => ({ key, change: { calls: 0, minutes: 0 }, proof: { calls: 0, minutes: 0 }, managing: { calls: 0, minutes: 0 },
  refusals: { calls: 0, minutes: 0 }, waiting: { calls: 0, minutes: 0 }, reading: { calls: 0, minutes: 0 } });

/**
 * The split of a workstream (a line for each arc, then each of its rows) or of an arc (a line for each row); nothing
 * for any other target. A scope bounds it to a time or to the windows the developer talks to.
 */
export function readSplit(root: string, target: string, scope: SplitScope = {}): SplitRow[] {
  if (target === "all" || target.startsWith("window/")) return [];
  const arcTarget = /^(.+)\/(N\d+[a-z]?)$/i.exec(target);
  const named = arcTarget ? arcTarget[1] : target;
  const same = (tag: string | null) => tag === named || (/^\d{3}$/.test(named) && !!tag && tag.startsWith(`${named}-`));
  const rows = new Map<string, SplitRow>();
  const add = (key: string, call: Call) => {
    const held = rows.get(key) ?? empty(key);
    held[call.kind].calls += 1;
    held[call.kind].minutes += call.minutes;
    rows.set(key, held);
  };
  for (const call of readCalls(root, scope)) {
    if (!same(call.workstream) || !call.arc) continue;
    if (arcTarget && call.arc.toUpperCase() !== arcTarget[2].toUpperCase()) continue;
    if (!arcTarget) add(call.arc, call);
    if (call.row) add(`${call.arc} · row ${call.row}`, call);
  }
  const keys = [...rows.keys()].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return keys.map((key) => {
    const row = rows.get(key) as SplitRow;
    for (const kind of KINDS) row[kind].minutes = Math.round(row[kind].minutes * 10) / 10;
    return row;
  });
}

function printSplit(rows: SplitRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("\n" + "Split".padEnd(width) + CLASSES.map((kind) => kind.padStart(16)).join(""));
  for (const row of rows)
    console.log(row.key.padEnd(width) + CLASSES.map((kind) => `${row[kind].calls} · ${row[kind].minutes}m`.padStart(16)).join(""));
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG, lead: FLAG, from: VALUE, to: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one target: `all`, a workstream, `<workstream>/N<nnn>`, or `window/<session>` or `window/this`.");
  const target = words.paths[0];
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { rows, earliest } = readCost(root, target);
  const scope: SplitScope = { lead: words.given("lead") };
  for (const bound of ["from", "to"] as const) {
    const given = words.value(bound);
    if (given === null) continue;
    const time = Date.parse(given);
    if (!Number.isFinite(time)) throw new UsageFault(`takes \`--${bound}\` as a time such as 2026-10-30T12:12Z, and \`${given}\` is not one.`);
    scope[bound] = time;
  }
  const split = readSplit(root, target, scope);
  if (words.given("json")) {
    console.log(JSON.stringify({ target, earliest, pricesAsOf: MODEL_PRICES.asOf, estimate: true, rows, split }, null, 2));
    return 0;
  }
  if (!rows.length && split.length) { printSplit(split); return 0; }
  if (!rows.length) {
    console.log(`no usage for \`${target}\` in ${telemetryFolder(root)}${earliest ? `, which reaches back to ${earliest}` : " — it holds none; `debug switch on telemetry` records from the next reply"}`);
    return 0;
  }
  print(rows);
  if (split.length) printSplit(split);
  console.log(`\nTelemetry reaches back to ${earliest}. Money is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "what a target cost, a line for each part its breakdown names", usage: "<target> [--from <time>] [--to <time>] [--lead] [--json]", run: show },
};
