#!/usr/bin/env node
// RESTATES: spn-foundation RD.DEVEX.WORKSPACE.207 — no source or test file changes while a test run for
// that repository is in flight.
//
// Refuses a write under a repository's `src` or `tests` while a test command for that repository has
// a start file under `.spndevex/.debug/telemetry/pending/`, which `lib/bash-timing.ts` writes before a
// timed Bash command. The design is in the hooks chapter, § A source edit waits while a test run is going.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { bashWrites } from "./doc-check.ts";
import { markAge } from "./split-plan.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { DEVEX } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { repoOf } from "../../../../plugin-support-lib/src/lib/timing.ts";
import type { Reading } from "../lib/command-reader.ts";

/**
 * The harness's longest timeout for a foreground Bash call, in milliseconds. A start file older than
 * this has no call behind it, and `lib/bash-timing.ts` removes one at the same age.
 */
export const RUN_BOUND_MS = 600_000;

/** The folders of a repository a test run reads. */
const GUARDED = ["src", "tests"];
const GUARDED_SEGMENT = new RegExp(`(?:^|/)(?:${GUARDED.join("|")})/`);
const NAMES_GUARDED = new RegExp(`(?:^|[^\\w-])(?:${GUARDED.join("|")})(?:[^\\w-]|$)`);

/** One test run that is going: the command as it was read, its repository, when it started, and its start file. */
export type TestRun = { command: string; repo: string; startedAt: number; file: string };

/**
 * A path under a `src` or `tests` folder, or a command that names either word. A command is judged
 * by the paths it writes, and only one that names a guarded folder can write under it.
 */
export function applies(path: string, command: string): boolean {
  return GUARDED_SEGMENT.test(path.split(sep).join("/")) || NAMES_GUARDED.test(command);
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
 * `nx test`, or `nx run-many` with `test` among its targets.
 */
export function isTestCommand(found: Reading): boolean {
  if (found.script === "spnutils") return (found.group === "apps" || found.group === "infra") && found.action === "test";
  if (found.script !== "nx" || !found.action) return false;
  if (found.action === "run-many") return targetsOf(found.args ?? "").some(isTestTarget);
  return isTestTarget(found.action);
}

/** A reading as the command a person typed: the program, its levels and its arguments. */
const commandOf = (found: Reading): string =>
  [found.script, found.group, found.subgroup, found.action, found.args].filter(Boolean).join(" ");

/**
 * Every test run that has a start file under `root`, younger than the bound. A start file that cannot
 * be read, or that names no repository, is not a run.
 */
export function testRuns(root: string, now = Date.now()): TestRun[] {
  const pending = join(root, DEVEX, ".debug", "telemetry", "pending");
  let names: string[];
  try { names = readdirSync(pending).filter((name) => name.endsWith(".json")).sort(); } catch { return []; }
  const out: TestRun[] = [];
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
        `repository is in flight (RD.DEVEX.WORKSPACE.207): the run reads the tree it started on, so an ` +
        `edit made now costs the run again. Wait for the run to end, then make the edit. A document, ` +
        `another folder and another repository are open to you meanwhile. The run is known by its start ` +
        `file, \`${relative(root, run.file)}\`; one that no call closed stops counting ` +
        `${RUN_BOUND_MS / 60_000} minutes after it was written.`,
    };
  }
  return null;
}

if (runAlone("test-run.ts")) {
  try { emit(checkTestRun(readPayload())); } catch { /* when unsure, allow */ }
  process.exit(0);
}
