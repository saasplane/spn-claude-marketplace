#!/usr/bin/env node
// A proof is read from the run itself. A test or check command whose result is hidden proves nothing: piped into
// `tail`, `head` or `grep` it loses its exit status, with its errors sent to `/dev/null` they are never read, and an
// nx run replayed from its cache while a PROOF row is in progress repeats an old result instead of making a new one.
// Each is refused with the plain form. The design is in the marketplace's hooks chapter.
//
//   called by: events/pretooluse.ts, before a Bash call

import { arcIdsOf, readArc, workstreamsOf } from "../lib/workstream.ts";
import { windowWorkstreams } from "../lib/window.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** A test or check command: the repository's own runners and the nx targets that run tests. */
const TEST = String.raw`(?:spnutils\s+(?:apps|infra)\s+(?:test|check)|nx\s+(?:run-many|run|affected|test)\b|node\s+\S*tests/(?:run|unit/\S+)\.mjs|node\s+\S*scripts/test-all\.mjs|pnpm\s+(?:run\s+)?test)`;
const PIPED = new RegExp(`${TEST}[^;\\n|&]*(?:2>&1[^;\\n|&]*)?\\|(?!\\|)\\s*(?:tail|head|grep)\\b`);
const SILENCED = new RegExp(`${TEST}[^;\\n&|]*2>\\s*/dev/null`);
const NX_RUN = /(?:^|[\s;&|])(?:npx\s+|pnpm\s+)?nx\s+(?:run-many|run|affected|test)\b/;

/** Whether a PROOF row of an arc of this window's workstreams is in progress. */
function proofRunning(root: string, session: string | undefined): boolean {
  const owned = new Set(windowWorkstreams(root, session));
  for (const ws of workstreamsOf(root)) {
    if (!owned.has(ws.split("/").pop() ?? "")) continue;
    for (const arc of arcIdsOf(ws))
      if (readArc(ws, arc)?.rows?.some((row) => row.altitude === "PROOF" && row.state === "running")) return true;
  }
  return false;
}

export function checkProofRun(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash") return null;
  const command = payload.tool_input?.command;
  if (!command) return null;
  if (PIPED.test(command))
    return { deny:
      "This pipes a test or check run into `tail`, `head` or `grep`, so its exit status is lost and the proof is a guess. " +
      "Run it alone and read its exit status; if its output is long, write it to a file in the scratchpad and read the part you need." };
  if (SILENCED.test(command))
    return { deny:
      "This sends a test or check run's errors to `/dev/null`, so the run's own reasons are never read. " +
      "Run it with its errors in view, or write its output to a file and read that." };
  if (NX_RUN.test(command) && !command.includes("--skip-nx-cache")) {
    const root = workspaceRoot(payload.cwd ?? process.cwd());
    if (root && proofRunning(root, payload.session_id))
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
