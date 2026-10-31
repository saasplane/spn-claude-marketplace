#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.207 — no source or test file changes while a test run for
// that repository is in flight, and a whole suite runs at the go's named points, never per change.
//
// Refuses a write under a repository's `src` or `tests` while a test command for that repository has
// a start file under `.spndevex/.debug/sessions/<id>/pending/`, which `lib/bash-timing.ts` writes before a
// timed Bash command. The design is in the hooks chapter, § A source edit waits while a test run is going.
//
// Refuses a whole suite, by any runner the repository uses, unless a baseline or full run of a go is running for that
// repository: `workstream go start` marks one running in the lead arc's `go.json`. A narrowed run always passes.

import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { bashWrites } from "./doc-check.ts";
import { markAge } from "./split-plan.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { repoOf } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { isRunnerRun, loadPrograms, readCommand, TEST_RUNNERS, type Reading } from "../lib/command-reader.ts";
import { readGo } from "../lib/go-plan.ts";
import { windowWorkstreams } from "../lib/window.ts";
import { arcIdsOf, workstreamsOf } from "../lib/workstream.ts";
import type { GoPart, GoPlan } from "../lib/workstream-schema.ts";

/**
 * The harness's longest timeout for a foreground Bash call, in milliseconds. A start file older than
 * this has no call behind it, and is not read as a run.
 */
export const RUN_BOUND_MS = 600_000;

/** The folders of a repository a test run reads. */
const GUARDED = ["src", "tests"];
const GUARDED_SEGMENT = new RegExp(`(?:^|/)(?:${GUARDED.join("|")})/`);
const NAMES_GUARDED = new RegExp(`(?:^|[^\\w-])(?:${GUARDED.join("|")})(?:[^\\w-]|$)`);
// A command that names a runner may run a whole suite: `spnutils`, `nx`, or one of `TEST_RUNNERS`.
// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
const NAMES_RUNNER = new RegExp(`(?:^|[^\\w.-])(?:spnutils|nx|${TEST_RUNNERS.map((name) => name.replace(/\./g, "\\.")).join("|")})(?:[^\\w.-]|$)`);

/** One test run that is going: the command as it was read, its repository, when it started, and its start file. */
export type TestRun = { command: string; repo: string; startedAt: number; file: string };

/**
 * A path under a `src` or `tests` folder, or a command that names either word. A command is judged
 * by the paths it writes, and only one that names a guarded folder can write under it.
 */
export function applies(path: string, command: string): boolean {
  return GUARDED_SEGMENT.test(path.split(sep).join("/")) || NAMES_GUARDED.test(command) || NAMES_RUNNER.test(command);
}

/** An nx target that runs tests: `test`, or one tier of it, such as `test:integration`. */
const isTestTarget = (name: string): boolean => name === "test" || name.startsWith("test:");

/** The targets `nx run-many` was given, from `-t`, `--target` or `--targets`, with `=` or a space. */
function targetsOf(args: string): string[] {
  const words = args.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let at = 0; at < words.length; at += 1) {
    const option = /^(?:-t|--targets?)(?:=(.*))?$/.exec(words[at]);
    if (!option) continue;
    const value = option[1] ?? words[at + 1] ?? "";
    out.push(...value.split(",").map((name) => name.trim()).filter(Boolean));
  }
  return out;
}

/**
 * Whether one program a command ran is a test run: `spnutils apps test`, `spnutils infra test`,
 * `nx test`, `nx run-many` with `test` among its targets, or one of `TEST_RUNNERS`.
 */
export function isTestCommand(found: Reading): boolean {
  if (isRunnerRun(found)) return true;
  if (found.script === "spnutils") return (found.group === "apps" || found.group === "infra") && found.action === "test";
  if (found.script !== "nx" || !found.action) return false;
  if (found.action === "run-many") return targetsOf(found.args ?? "").some(isTestTarget);
  return isTestTarget(found.action);
}

/** The scripts a repository runs its whole suite by: they take no selection, so every call of one is whole. */
const WHOLE_RUNNERS = ["run.mjs", "test-all.mjs"];

/**
 * Whether a test run is a whole suite: a repository's own runner, `nx run-many` over `test`, a `spnutils` test with no
 * selection after `--`, or a framework's CLI given no file or pattern. `nx test <project>` is one project's, and passes.
 */
export function isWholeSuite(found: Reading): boolean {
  if (!isTestCommand(found)) return false;
  if (WHOLE_RUNNERS.includes(found.script)) return true;
  const words = [found.action, ...(found.args ?? "").split(/\s+/)].filter((word): word is string => Boolean(word));
  const selection = words.indexOf("--");
  if (found.script === "spnutils") return selection < 0 || selection === words.length - 1;
  if (found.script === "nx") return found.action === "run-many";
  return !words.some((word) => !word.startsWith("-") && word !== "run" && word !== "test");
}

/** A part of a go that lets a whole suite run: a baseline or a full run. */
const isSuitePart = (part: GoPart): boolean => part.pass === "BASELINE" || part.pass === "FULL_RUN";

/** The go plans of the open workstreams, each with its workstream's folder; a plan that fails its schema is skipped. */
function openPlans(root: string): Array<{ ws: string; plan: GoPlan }> {
  const out: Array<{ ws: string; plan: GoPlan }> = [];
  for (const ws of workstreamsOf(root, ["open"]))
    for (const arc of arcIdsOf(ws)) {
      try { const plan = readGo(ws, arc); if (plan) out.push({ ws, plan }); } catch { /* a broken plan is not read */ }
    }
  return out;
}

/** The repository a command runs in: its member folder, or the one a workstream's worktree checks out. */
function repoAt(root: string, dir: string): string | null {
  const member = repoOf(root, dir);
  if (member) return member;
  const [first, , repo] = relative(root, dir).split(sep);
  return first === ".worktrees" && repo ? repo : null;
}

/** The workstream's number, `036`, as a refusal names its go. */
const numberOf = (ws: string): string => /^\d+/.exec(basename(ws))?.[0] ?? basename(ws);

/**
 * Refuse a whole suite unless a baseline or full run of a go is running for its repository. The refusal names the window's
 * go, or another open one, and the part that starts the full run; with no plan anywhere it names the command that starts one.
 */
export function checkWholeSuite(payload: Payload): Verdict {
  const command = payload.tool_input?.command;
  if (payload.tool_name !== "Bash" || !command) return null;
  const cwd = payload.cwd ?? process.cwd();
  const root = workspaceRoot(cwd);
  if (!root) return null;
  const whole = readCommand(command, cwd, loadPrograms(root), root).filter(isWholeSuite);
  if (!whole.length) return null;
  const repo = whole.map((found) => found.repo).find(Boolean) ?? repoAt(root, cwd);
  const plans = openPlans(root);
  const forRepo = (part: GoPart): boolean => isSuitePart(part) && (!repo || part.repo === repo);
  if (plans.some(({ plan }) => plan.parts.some((part) => forRepo(part) && part.state === "running"))) return null;
  const own = new Set(windowWorkstreams(root, payload.session_id));
  const named = plans.find(({ ws }) => own.has(basename(ws))) ?? plans[0];
  const quoted = command.trim().length > 120 ? `${command.trim().slice(0, 117)}…` : command.trim();
  if (!named) {
    return { deny:
      `Refused: \`${quoted}\` runs the whole suite, and no baseline or full run of a go is running.\n` +
      `Run your own test files, each directly. A whole suite runs at a go's named points, after ` +
      `\`workstream go start <workstream>/N<nnn> <part>\` marks its baseline or full run running (RULE.DEVEX.WORKSPACE.207).` };
  }
  const part = named.plan.parts.find((one) => forRepo(one) && one.pass === "FULL_RUN" && one.state !== "landed")
    ?? named.plan.parts.find((one) => forRepo(one) && one.state !== "landed");
  const go = `${numberOf(named.ws)}/${named.plan.lead}`;
  return { deny:
    `Refused: \`${quoted}\` runs the whole suite, and no full run of ${numberOf(named.ws)}'s go is running.\n` +
    `Run the part's own test files, or start the full run with \`workstream go start ${go} ${part?.id ?? `full-${repo ?? "<repo>"}`}\` ` +
    `(RULE.DEVEX.WORKSPACE.207).` };
}

/** A reading as the command a person typed: the program, its levels and its arguments. */
const commandOf = (found: Reading): string =>
  [found.script, found.group, found.subgroup, found.action, found.args].filter(Boolean).join(" ");

/**
 * Every test run that has a start file under `root`, younger than the bound. A start file that cannot
 * be read, or that names no repository, is not a run.
 */
export function testRuns(root: string, now = Date.now()): TestRun[] {
  // Every window's folder is looked in: a run another window started is a run.
  const windows = dirname(sessionDir(root, "-"));
  let sessions: string[];
  try { sessions = readdirSync(windows).sort(); } catch { return []; }
  const out: TestRun[] = [];
  for (const session of sessions) {
    const pending = join(sessionDir(root, session), "pending");
    let names: string[];
    try { names = readdirSync(pending).filter((name) => name.endsWith(".json")).sort(); } catch { continue; }
    for (const name of names) {
      let started: { at?: unknown; found?: unknown };
      try { started = JSON.parse(readFileSync(join(pending, name), "utf8")); } catch { continue; }
      if (!started || typeof started.at !== "number" || !Array.isArray(started.found)) continue;
      if (now - started.at > RUN_BOUND_MS) continue;
      for (const found of started.found as Reading[]) {
        if (!found || typeof found !== "object" || !found.repo || !isTestCommand(found)) continue;
        out.push({ command: commandOf(found), repo: found.repo, startedAt: started.at, file: join(pending, name) });
      }
    }
  }
  return out;
}

/** The repository a written path sits in, where the path is under that repository's `src` or `tests`. */
function guardedRepo(root: string, path: string): string | null {
  const repo = repoOf(root, path);
  if (!repo) return null;
  const within = relative(join(root, repo), path).split(sep);
  return within.slice(0, -1).some((part) => GUARDED.includes(part)) ? repo : null;
}

/** Every path this call writes: the `file_path` form, and the routes a shell command writes by. */
function writtenPaths(payload: Payload): string[] {
  const supplied = payload.tool_input ?? {};
  if (supplied.file_path) return [supplied.file_path];
  if (!supplied.command) return [];
  try { return bashWrites(supplied.command).map(([path]) => path); } catch { return []; }
}

export function checkTestRun(payload: Payload, now = Date.now()): Verdict {
  const cwd = payload.cwd ?? process.cwd();
  for (const written of writtenPaths(payload)) {
    const path = isAbsolute(written) ? written : resolve(cwd, written);
    const root = workspaceRoot(dirname(path)) ?? workspaceRoot(cwd);
    if (!root) continue;
    const repo = guardedRepo(root, path);
    if (!repo) continue;
    const run = testRuns(root, now).find((one) => one.repo === repo);
    if (!run) continue;
    return {
      deny:
        `Denied: a test run for \`${repo}\` is going — \`${run.command}\`, started ` +
        `${markAge(new Date(run.startedAt), now)} ago — and \`${relative(root, path)}\` is under that ` +
        `repository's \`src\` or \`tests\`. No source or test file changes while a test run for that ` +
        `repository is in flight (RULE.DEVEX.WORKSPACE.207): the run reads the tree it started on, so an ` +
        `edit made now costs the run again. Wait for the run to end, then make the edit. A document, ` +
        `another folder and another repository are open to you meanwhile. The run is known by its start ` +
        `file, \`${relative(root, run.file)}\`; one that no call closed stops counting ` +
        `${RUN_BOUND_MS / 60_000} minutes after it was written.`,
    };
  }
  return checkWholeSuite(payload);
}

if (runAlone("test-run.ts")) {
  try { emit(checkTestRun(readPayload())); } catch { /* when unsure, allow */ }
  process.exit(0);
}
