// The Bash commands the agent runs, timed (RULE.DEVEX.WORKSPACE.185). No hook sees a command's
// duration, so the hooks before and after the call pair on its `tool_use_id`:
//
// - `startCommand`, from `PreToolUse`: while recording is on, the command is read (`command-reader.ts`)
//   and, only where a program the filter names is in it, `sessions/<id>/pending/<tool_use_id>.json` is
//   written with the start time and, for each reading, its repository, its call (program, group and action,
//   a plugin command's subgroup written into the action: `docs cycles write` is group docs, action `cycles write`)
//   and `suite`: true where `isTestCommand` judged it a test run when the file was written. No arguments are kept,
//   here or in the row. An unmatched call pays for the reading and nothing more.
// - `finishCommand`, from `PostToolUse` or `PostToolUseFailure`: the start file is read and removed,
//   and one `COMMAND` row is written for the call with its `ms` and its `exit`. The row names the first
//   program the filter matched, so a total by program holds a call's time once. A failure with no code reads
//   1; a background call (`run_in_background`) returns before its command ends, so its row is written with
//   `exit` null. The next call of the same program, group and action after a failure carries `retryOf`, the
//   failed row's id. A background `spnutils apps test` writes no command row: it leaves a marker, and one
//   `TEST` row for each tier and node is written from the verdict the run leaves (`landTests`), in its place.
//
// A START FILE NO HOOK CLOSES. A call refused after `PreToolUse` wrote its start file never runs, so
// no hook comes after it; a crashed call leaves one the same way. Nothing prunes it here: the window's
// folder is swept whole once nothing in it has been written for 14 days (`debug-store.ts`).

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { appendLog, sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { carryTags, rowId, tagsOf, telemetryDir, utcNow, workOfPart, type WorkTags } from "../../../../plugin-support-lib/src/lib/timing.ts";
import {
  ARC_PATTERN, ID_PATTERN, NODE_PATTERN, PART_PATTERN, WORKSTREAM_PATTERN, SPDevExAgentSkillType, SPDevExWorkspaceTelemetryEventType,
  SPDevExWorkspaceTelemetryRowType, SPDevExWorkspaceTelemetryVersionType, SPDevExWorkstreamWorkType, SPDocBehaviourStatusType, SPTestTierType,
  SPDevExStageType, held, known,
} from "../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { isTestCommand } from "../checks/test-run.ts";
import { loadPrograms, readCommand, type Reading } from "./command-reader.ts";
import { eventWorkspace, type Payload } from "./payload.ts";

const PENDING = "pending";
const MARKERS = "tests";
const RETRIES = "retries.json";
const HOOKS_LOG = "hooks.jsonl";
/** A background test run's marker is looked at for a verdict for this long. */
const MARKER_KEEP_MS = 6 * 3600 * 1000;

/** What a call is: the program, the group, and the action, with a plugin command's subgroup written into the action. Never its arguments. */
export type Call = { program: string; group: string | null; action: string | null };

/** One program the filter matched: its repository, its call, and `suite` where `isTestCommand` judged it a test run. */
export type StartedReading = { repo: string | null; call: Call; suite: boolean };

/** The start file: when the call began, whether it runs in the background, and every program the filter matched in it. */
export type Started = { at: number; background: boolean; found: StartedReading[] };

/** A reading as the call it names: `docs cycles write` is group `docs`, action `cycles write`. */
export function callOfReading(found: Pick<Reading, "script" | "group" | "subgroup" | "action">): Call {
  return { program: found.script, group: found.group ?? null, action: found.subgroup ? [found.subgroup, found.action].filter(Boolean).join(" ") : found.action ?? null };
}

/** The call id as a file name, or null where there is none to pair on. */
function fileOf(payload: Payload): string | null {
  const id = typeof payload.tool_use_id === "string" ? payload.tool_use_id : "";
  return /^[A-Za-z0-9_-]{1,200}$/.test(id) ? `${id}.json` : null;
}

/** `PreToolUse` on Bash: write the start file for a matched command while recording is on. Never throws. */
export function startCommand(payload: Payload): void {
  try {
    if (payload.tool_name !== "Bash") return;
    const file = fileOf(payload);
    const command = payload.tool_input?.command;
    const session = typeof payload.session_id === "string" ? payload.session_id : "";
    if (!file || !command || !session) return;
    const cwd = payload.cwd ?? process.cwd();
    const root = eventWorkspace(cwd);
    const dir = telemetryDir(root);
    if (!dir) return;
    if (!root) return;
    const found = readCommand(command, cwd, loadPrograms(root), root);
    if (!found.length) return;
    const pending = join(sessionDir(root, session), PENDING);
    mkdirSync(pending, { recursive: true });
    const started: Started = { at: Date.now(), background: payload.tool_input?.run_in_background === true,
      found: found.map((one) => ({ repo: one.repo, call: callOfReading(one), suite: isTestCommand(one) })) };
    writeFileSync(join(pending, file), JSON.stringify(started), "utf8");
  } catch { /* a tool never fails because timing failed */ }
}

const CODE_FIELDS = ["exit_code", "exitCode", "returnCode", "return_code", "code", "status"] as const;

/** The call's exit code: from the tool response, else from a failure's text, else 1 for a failure and 0 otherwise. */
export function exitOf(payload: Payload, failed: boolean): number {
  const response = payload.tool_response;
  if (response && typeof response === "object") {
    for (const field of CODE_FIELDS) {
      const value = (response as Record<string, unknown>)[field];
      if (typeof value === "number" && Number.isInteger(value)) return value;
    }
  }
  const text = typeof payload.error === "string" ? payload.error
    : typeof response === "string" ? response : "";
  const said = /exit(?:ed with)? code:?\s*(-?\d+)/i.exec(text);
  if (said) return Number(said[1]);
  return failed ? 1 : 0;
}

/** The bytes a tool's response put into the context: a Bash call's stdout and stderr, else the response as it is. */
function bytesOfResponse(payload: Payload): number {
  const response = payload.tool_response;
  if (response === undefined || response === null) return 0;
  if (typeof response === "string") return Buffer.byteLength(response);
  const shell = response as { stdout?: unknown; stderr?: unknown };
  if (typeof shell.stdout === "string" || typeof shell.stderr === "string")
    return Buffer.byteLength(typeof shell.stdout === "string" ? shell.stdout : "") + Buffer.byteLength(typeof shell.stderr === "string" ? shell.stderr : "");
  try { return Buffer.byteLength(JSON.stringify(response)); } catch { return 0; }
}

const callKey = (call: Call): string => `${call.program} ${call.group ?? ""} ${call.action ?? ""}`;

/** The rows that failed and have not been retried, by call (or `TEST node tier`), kept per window and agent. */
type Retries = Record<string, Record<string, string>>;

function readRetries(path: string): Retries {
  try { return JSON.parse(readFileSync(path, "utf8")) ?? {}; } catch { return {}; }
}

/**
 * The id of the failed row this one retries, and the failures kept afterwards. A row retries the failure of its own key, if any;
 * a failed row becomes that key's failure, and a row that succeeded clears it.
 */
function retryOf(path: string, agent: string | null, key: string, id: string, failed: boolean): string | null {
  try {
    const all = readRetries(path);
    const mine = all[agent ?? "main"] ?? {};
    const was = mine[key] ?? null;
    if (failed) mine[key] = id; else delete mine[key];
    const keys = Object.keys(mine);
    for (const old of keys.slice(0, Math.max(0, keys.length - 50))) delete mine[old];
    all[agent ?? "main"] = mine;
    if (was !== null || failed) writeFileSync(path, JSON.stringify(all), "utf8");
    return was;
  } catch { return null; }
}

/** The head every row of the family carries, from the call's own ids and the ones the window carries. */
function headOf(root: string, payload: Payload, tags: WorkTags): Record<string, unknown> {
  const session = typeof payload.session_id === "string" ? payload.session_id : null;
  const own = { workstream: tags.workstream, arc: tags.arc, part: tags.part, skill: null as string | null };
  let work = own;
  try { work = carryTags(root, { session, agent: tags.agent, ...own }); } catch { /* the call's own ids stand */ }
  const part = held(work.part, PART_PATTERN);
  return {
    session, agent: tags.agent,
    workstream: held(work.workstream, WORKSTREAM_PATTERN), arc: held(work.arc, ARC_PATTERN), part,
    skill: known(SPDevExAgentSkillType, work.skill), stage: known(SPDevExStageType, (work as { stage?: string | null }).stage ?? null),
    work: workOfPart(part) ?? null,
  };
}

const COMMAND_ROW = { v: SPDevExWorkspaceTelemetryVersionType.V1, mtype: SPDevExWorkspaceTelemetryRowType.COMMAND };

/**
 * `PostToolUse` or `PostToolUseFailure` on Bash: write the call's row and remove the start file.
 * Returns the bytes the tool's response put into the context, for the run's own whole-run line. Never throws.
 */
export function finishCommand(payload: Payload, failed: boolean): number {
  let out = 0;
  try {
    out = bytesOfResponse(payload);
    if (payload.tool_name !== "Bash") return out;
    const file = fileOf(payload);
    const session = typeof payload.session_id === "string" ? payload.session_id : "";
    if (!file || !session) return out;
    const root = eventWorkspace(payload.cwd ?? process.cwd());
    if (!root) return out;
    const path = join(sessionDir(root, session), PENDING, file);
    let started: Started;
    try { started = JSON.parse(readFileSync(path, "utf8")) as Started; } catch { return out; }
    try { rmSync(path, { force: true }); } catch { /* ignore */ }
    const dir = telemetryDir(root);
    if (!dir) return out;
    try { landTests(root, session, payload.cwd ?? process.cwd()); } catch { /* a verdict that does not read waits for the next call */ }
    if (!Array.isArray(started.found) || !started.found.length || typeof started.at !== "number") return out;
    const ms = Math.max(0, Math.round(Date.now() - started.at));
    const background = started.background || payload.tool_input?.run_in_background === true;
    const exit = background && !failed ? null : exitOf(payload, failed);
    const call = started.found[0].call;
    const tags = tagsOf(payload);
    const head = headOf(root, payload, tags);
    // A background `spnutils apps test` is written as one TEST row per tier and node when its verdicts land, not as a command.
    if (background && !failed && isTestRunCall(call)) {
      const folder = join(sessionDir(root, session), MARKERS);
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, file), JSON.stringify({ at: started.at, cwd: payload.cwd ?? process.cwd(), call, head, done: [] }), "utf8");
      return out;
    }
    const id = rowId();
    const was = retryOf(join(sessionDir(root, session), RETRIES), tags.agent, callKey(call), id, exit !== null && exit !== 0);
    appendLog(join(dir, HOOKS_LOG), JSON.stringify({
      ...COMMAND_ROW, id, at: utcNow(ms), ms, event: SPDevExWorkspaceTelemetryEventType.COMMAND, ...head,
      retryOf: held(was, ID_PATTERN), call, exit,
    }));
  } catch { /* a tool never fails because timing failed */ }
  return out;
}

const isTestRunCall = (call: Call): boolean => call.program === "spnutils" && call.group === "apps" && call.action === "test";

/** Where `spnutils` keeps the verdicts of tiers it has proven: `<machine home>/cache/verdicts/<org>/<repo>/<tier>/<key>.json`. */
const verdictsRoom = (): string => join(process.env.SPN_MACHINE_HOME || join(homedir(), ".saasplane"), "cache", "verdicts");

type Verdict = { project?: string; tier?: string; run?: string; worktree?: string; at?: string; durationMs?: number; passed?: number; failed?: number; skipped?: number;
                 tests?: { passed?: number; failed?: number; skipped?: number } | null };

/** Every verdict file written at or after `since` (ms), with its path. */
function verdictsSince(since: number): Array<{ file: string; verdict: Verdict }> {
  const found: Array<{ file: string; verdict: Verdict }> = [];
  const room = verdictsRoom();
  if (!existsSync(room)) return found;
  for (const org of readdirSync(room)) for (const repo of readdirSync(join(room, org))) for (const tier of readdirSync(join(room, org, repo))) {
    const folder = join(room, org, repo, tier);
    for (const name of readdirSync(folder)) {
      if (!name.endsWith(".json")) continue;
      const file = join(folder, name);
      try {
        if (statSync(file).mtimeMs < since - 1000) continue;
        const verdict = JSON.parse(readFileSync(file, "utf8")) as Verdict;
        if (Date.parse(String(verdict.at)) >= since - 1000) found.push({ file, verdict });
      } catch { /* a file that does not read is not a verdict */ }
    }
  }
  return found;
}

const inside = (a: string, b: string): boolean => { const x = resolve(a), y = resolve(b); return x === y || x.startsWith(y + sep) || y.startsWith(x + sep); };

/**
 * Write the `TEST` rows for the background test runs this window left a marker for: one row for each tier and node whose verdict was
 * written after the run started, from a checkout the run was started in. A row is written once; a marker that is old is removed.
 */
export function landTests(root: string, session: string, cwd: string): void {
  void cwd;
  const dir = telemetryDir(root);
  const folder = join(sessionDir(root, session), MARKERS);
  if (!dir || !existsSync(folder)) return;
  for (const name of readdirSync(folder)) {
    const markerFile = join(folder, name);
    let marker: { at: number; cwd: string; call: Call; head: Record<string, unknown>; done: string[] };
    try { marker = JSON.parse(readFileSync(markerFile, "utf8")); } catch { continue; }
    if (Date.now() - marker.at > MARKER_KEEP_MS) { rmSync(markerFile, { force: true }); continue; }
    let changed = false;
    for (const { file, verdict } of verdictsSince(marker.at)) {
      if (marker.done.includes(file) || typeof verdict.worktree !== "string" || !inside(verdict.worktree, marker.cwd)) continue;
      const tier = known(SPTestTierType, verdict.tier);
      const node = held(String(verdict.project ?? "").replace(/^@[^/]+\//, ""), NODE_PATTERN);
      const run = held(verdict.run, /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/);
      if (!tier || !node || !run) continue;
      const counts = verdict.tests ?? { passed: verdict.passed, failed: verdict.failed, skipped: verdict.skipped };
      const tests = { passed: Number(counts.passed) || 0, failed: Number(counts.failed) || 0, skipped: Number(counts.skipped) || 0 };
      const ms = Math.max(0, Math.round(Number(verdict.durationMs) || 0));
      const id = rowId();
      const failed = tests.failed > 0;
      const agent = typeof marker.head.agent === "string" ? marker.head.agent : null;
      const was = retryOf(join(sessionDir(root, session), RETRIES), agent, `TEST ${node} ${tier}`, id, failed);
      appendLog(join(dir, HOOKS_LOG), JSON.stringify({
        v: SPDevExWorkspaceTelemetryVersionType.V1, mtype: SPDevExWorkspaceTelemetryRowType.TEST, id,
        at: `${new Date(Date.parse(String(verdict.at)) - ms).toISOString().slice(0, 19)}Z`, ms,
        event: SPDevExWorkspaceTelemetryEventType.COMMAND, ...marker.head, work: SPDevExWorkstreamWorkType.TEST, retryOf: held(was, ID_PATTERN),
        call: marker.call, status: failed ? SPDocBehaviourStatusType.FAILED : SPDocBehaviourStatusType.SUCCESS,
        test: { node, run, tier, tests },
      }));
      marker.done.push(file);
      changed = true;
    }
    if (changed) writeFileSync(markerFile, JSON.stringify(marker), "utf8");
  }
}
