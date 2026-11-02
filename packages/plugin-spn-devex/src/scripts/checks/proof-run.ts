#!/usr/bin/env node
// A proof is read from the run itself. A test or check command whose result is hidden proves nothing: piped into
// `tail`, `head` or `grep` it loses its exit status, with its errors sent to `/dev/null` they are never read, and an
// nx run replayed from its cache while a PROOF row is in progress repeats an old result instead of making a new one.
// Each is refused with the plain form. The design is in the marketplace's hooks chapter.
//
//   called by: events/pretooluse.ts, before a Bash call

import { execFileSync } from "node:child_process";
import { arcIdsOf, logFileOf, ranOnTree, readArc, readJsonl, workstreamsOf } from "../lib/workstream.ts";
import { namedRun } from "../../../../plugin-support-lib/src/lib/runs.ts";
import { windowWorkstreams } from "../lib/window.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** A test or check command: the repository's own runners and the nx targets that run tests. */
const TEST = String.raw`(?:spnutils\s+(?:apps|infra)\s+(?:test|check)|nx\s+(?:run-many|run|affected|test)\b|node\s+\S*tests/(?:run|unit/\S+)\.mjs|node\s+\S*scripts/test-all\.mjs|pnpm\s+(?:run\s+)?test)`;
const PIPED = new RegExp(`${TEST}[^;\\n|&]*(?:2>&1[^;\\n|&]*)?\\|(?!\\|)\\s*(?:tail|head|grep)\\b`);
// Stdout and stderr both sent to a file (never `/dev/null`), and the status echoed in the same command: the run's result is read, whatever follows the `;`.
const BOTH_TO_FILE = new RegExp(String.raw`&>>?(?!\s*/dev/null\b)\s*[^\s;&|<>]+|(?<![0-9&>])>>?(?!\s*/dev/null\b|\s*&)\s*[^\s;&|<>]+[^;\n|]*2>&1|2>&1[^;\n|]*(?<![0-9&>])>>?(?!\s*/dev/null\b|\s*&)\s*[^\s;&|<>]+`);
const STATUS_ECHOED = /\becho\b[^\n;]*\$\?/;
const SILENCED = new RegExp(`${TEST}[^;\\n&|]*2>\\s*/dev/null`);

/**
 * The command read on its parts, not its raw text: a heredoc's body is dropped and the inside of a quoted string is emptied, so a
 * test word or a `2>/dev/null` that is only written there is not a run.
 */
export function commandParts(command: string): string {
  const kept: string[] = [];
  let closing: { word: string; dash: boolean } | null = null;
  for (const line of command.split("\n")) {
    if (closing) {
      if ((closing.dash ? line.replace(/^\t+/, "") : line) === closing.word) closing = null;
      continue;
    }
    kept.push(line);
    const open = /<<(-?)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/.exec(line);
    if (open) closing = { word: open[2] ?? open[3] ?? open[4], dash: open[1] === "-" };
  }
  return kept.join("\n").replace(/'[^']*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

const NX_RUN = /(?:^|[\s;&|])(?:npx\s+|pnpm\s+)?nx\s+(?:run-many|run|affected|test)\b/;

/** The arcs of this window's workstreams that have a PROOF row in progress, as `[workstream, arc]`. */
function proofRunning(root: string, session: string | undefined): Array<[string, string]> {
  const owned = new Set(windowWorkstreams(root, session));
  const out: Array<[string, string]> = [];
  for (const ws of workstreamsOf(root)) {
    if (!owned.has(ws.split("/").pop() ?? "")) continue;
    for (const arc of arcIdsOf(ws))
      if (readArc(ws, arc)?.rows?.some((row) => row.work === "PROOF" && row.state === "running")) out.push([ws, arc]);
  }
  return out;
}

/**
 * Whether the tree a run from `cwd` would read equals the tree of the arc's latest recorded run (the `ranOnTree` test the landing gate
 * uses): the node is clean and its committed content is the one the run's stamp names. A replay of that tree is the run's result, not an old one.
 */
function sameTreeAsLatestRun(ws: string, arc: string, cwd: string): boolean {
  try {
    const noted = readJsonl(logFileOf(ws, arc))
      .map((line) => /· run (\S+)/.exec(String((line as { note?: unknown } | undefined)?.note ?? ""))?.[1])
      .filter((name): name is string => !!name);
    const name = noted.at(-1);
    if (!name) return false;
    const git = (args: string[]): string => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const top = git(["rev-parse", "--show-toplevel"]);
    const sha = git(["rev-parse", "HEAD"]);
    const runs = namedRun(top, name).runs;
    if (!runs.length) return false;
    return runs.every((one) => git(["status", "--porcelain", "--", `${top}/${one.node}`]) === "" && ranOnTree(top, one, sha));
  } catch { return false; }
}

export function checkProofRun(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command) return null;
  const parts = commandParts(command);
  // A run whose output and errors both go to a file and whose status is echoed in the same command is read, whatever follows.
  const read = BOTH_TO_FILE.test(parts) && /\becho\b/.test(parts) && STATUS_ECHOED.test(command);
  if (!read && PIPED.test(parts))
    return { deny:
      "This pipes a test or check run into `tail`, `head` or `grep`, so its exit status is lost and the proof is a guess. " +
      "Run it alone and read its exit status; if its output is long, write it to a file in the scratchpad and read the part you need." };
  if (!read && SILENCED.test(parts))
    return { deny:
      "This sends a test or check run's errors to `/dev/null`, so the run's own reasons are never read. " +
      "Run it with its errors in view, or write its output to a file and read that." };
  if (NX_RUN.test(parts) && !command.includes("--skip-nx-cache")) {
    const root = workspaceRoot(payload.cwd ?? process.cwd());
    const running = root ? proofRunning(root, payload.session_id) : [];
    // On a moved tree the demand stays; on the tree of the arc's latest recorded run a replay is that run's result.
    if (running.length && !running.every(([ws, arc]) => sameTreeAsLatestRun(ws, arc, payload.cwd ?? process.cwd())))
      return { deny:
        "A PROOF row is in progress, and this nx run may replay its result from the cache. A proof is a fresh run: " +
        "add `--skip-nx-cache` so the tests run again." };
  }
  return null;
}

if (runAlone("proof-run.ts")) {
  try { emit(checkProofRun(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
