#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.AGENT.082 — a window's cost is read from telemetry by a plugin command, never from a transcript.
//           RULE.DEVEX.WORKSPACE.485 — a go's first plan and each release part wait for a panel's verdict on record.
//
// A child's turns, logged when the child stops.
//
// `Stop` records the turns of a window from the transcript it is handed. A child agent stops through
// `SubagentStop` instead, and Claude Code hands that event the child's own transcript in
// `agent_transcript_path` (its `transcript_path` is the window's). This reads the child's transcript the way
// `stop.ts` reads the window's and tags each turn with the child's `agent_id`, so a child's cost is read from
// telemetry by `debug cost show` and never from a transcript by hand.
//
// When the helper is the review panel it also writes one `PANEL` row, its lens and its verdict (`lib/panel.ts`).
//
// It writes nothing while recording is off, says nothing to the child and never blocks it.

import { eventWorkspace, readPayload, runAlone } from "../lib/payload.ts";
// launchedWork is added by E41 (lib/usage.ts): it reads the order a helper's first prompt names.
import { launchedWork, recordUsage } from "../lib/usage.ts";
import { elapsedOf, firstPrompt, isPanel, lastFirstLine, lensOf, namedWork, verdictOf } from "../lib/panel.ts";
import { begin, end, tagsOf, writePanel } from "../../../../plugin-support-lib/src/lib/timing.ts";

/**
 * A review panel's verdict, written as one `PANEL` row when the helper that stopped is the panel (RULE.DEVEX.WORKSPACE.485): its lens from
 * its first prompt, its verdict from the first line of its last reply, and the work its first prompt names, else the main window's carried
 * ids. A helper that is not the panel, and a reply that opens with no verdict, write nothing.
 */
export function recordPanel(root: string, event: { session_id?: string; agent_id?: string; agent_type?: string; agent_transcript_path?: string },
                            facts: { script: string; event: string | null; tool: string | null; session: string | null }): void {
  try {
    if (!isPanel(event)) return;
    const verdict = verdictOf(lastFirstLine(event.agent_transcript_path));
    if (!verdict) return;
    const prompt = firstPrompt(event.agent_transcript_path);
    writePanel(root, { ...facts, agent: event.agent_id ?? null, ...namedWork(root, prompt) },
      { lens: lensOf(prompt), verdict, ms: elapsedOf(event.agent_transcript_path) });
  } catch { /* a child never fails because its verdict could not be logged */ }
}

if (runAlone("subagentstop.ts")) {
  try {
    const event = readPayload() as { session_id?: string; cwd?: string; agent_id?: string; agent_type?: string; agent_transcript_path?: string };
    const start = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    // The workspace above the event's `cwd`, else above the project directory; the bare start only where neither holds one.
    const root = eventWorkspace(event.cwd) ?? start;
    // The part, arc, work and workstream the helper's launch named, read once from its transcript; a launch naming none leaves each null.
    const launched = launchedWork(event.agent_transcript_path) as { part?: string | null; arc?: string | null; work?: string | null; workstream?: string | null } | null;
    const tags = tagsOf(event);
    const facts = { script: "spn-devex", event: "SubagentStop", tool: null, session: event.session_id ?? null, ...tags,
                    part: launched?.part ?? tags.part, arc: launched?.arc ?? tags.arc, work: launched?.work ?? null,
                    workstream: launched?.workstream ?? tags.workstream,
                    process: { group: "events", action: "subagentstop" } };
    begin(facts, root);
    recordUsage(root, facts, event.agent_transcript_path);
    recordPanel(root, event, facts);
    end(null, true);
  } catch { /* a child never fails because its cost could not be logged */ }
  process.exit(0);
}
