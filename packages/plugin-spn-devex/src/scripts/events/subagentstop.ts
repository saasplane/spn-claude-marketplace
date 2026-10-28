#!/usr/bin/env node
// RESTATES: spn-foundation RD.DEVEX.AGENT.082 — a window's cost is read from telemetry by a plugin command, never from a transcript.
//
// A child's turns, logged when the child stops.
//
// `Stop` records the turns of a window from the transcript it is handed. A child agent stops through
// `SubagentStop` instead, and Claude Code hands that event the child's own transcript in
// `agent_transcript_path` (its `transcript_path` is the window's). This reads the child's transcript the way
// `stop.ts` reads the window's and tags each turn with the child's `agent_id`, so a child's cost is read from
// telemetry by `debug cost show` and never from a transcript by hand.
//
// It writes nothing while recording is off, says nothing to the child and never blocks it.

import { workspaceRoot, readPayload, runAlone } from "../lib/payload.ts";
import { recordUsage } from "../lib/usage.ts";
import { begin, end, tagsOf } from "../../../../plugin-support-lib/src/lib/timing.ts";

if (runAlone("subagentstop.ts")) {
  try {
    const event = readPayload() as { session_id?: string; cwd?: string; agent_id?: string; agent_transcript_path?: string };
    const start = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const root = workspaceRoot(start) ?? start;
    const facts = { script: "spn-devex", event: "SubagentStop", tool: null, session: event.session_id ?? null, ...tagsOf(event),
                    process: { group: "events", action: "subagentstop" } };
    begin(facts, root);
    recordUsage(root, facts, event.agent_transcript_path);
    end(null, true);
  } catch { /* a child never fails because its cost could not be logged */ }
  process.exit(0);
}
