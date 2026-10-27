#!/usr/bin/env node
// Every PostToolUse check that reads what a Bash call changed under the branch, in one process.
//
// A check RETURNS a `Verdict` and only a `note` counts here: a command that has already run cannot be
// refused, so what a check says reaches the agent alone, as `additionalContext`. A check that throws
// is skipped.

import { readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";
import { checkRebaseMoved } from "../checks/rebase-moved.ts";
import { begin, end, span, tagsOf, type SpanName } from "../../../../plugin-support-lib/src/lib/timing.ts";

type Check = { name: SpanName; run: (payload: Payload) => Verdict };

const CHECKS: Check[] = [
  { name: { group: "rebase-moved", action: "rebase-moved" }, run: checkRebaseMoved },
];

/** What the checks have to say about this call, joined, or null. */
export function rebasedNote(payload: Payload): string | null {
  if (payload.tool_name !== "Bash" || payload.hook_event_name === "PostToolUseFailure") return null;
  const notes: string[] = [];
  for (const check of CHECKS) {
    let verdict: Verdict = null;
    try { verdict = span(check.name, () => check.run(payload)); } catch { continue; }
    if (verdict?.note) notes.push(verdict.note);
  }
  return notes.length ? notes.join("\n\n") : null;
}

if (runAlone("rebased.ts")) {
  const payload = readPayload();
  begin({ script: "spn-devex", event: "PostToolUse", tool: payload.tool_name ?? null, session: payload.session_id ?? null,
          ...tagsOf(payload), process: { group: "events", action: "rebased" } }, payload.cwd ?? process.cwd());
  let note: string | null = null;
  try { note = rebasedNote(payload); } catch { note = null; }
  end();
  if (note) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: note } }));
  process.exit(0);
}
