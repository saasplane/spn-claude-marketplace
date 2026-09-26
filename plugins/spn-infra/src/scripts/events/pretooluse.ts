#!/usr/bin/env node
// spn-infra's PreToolUse chain: one process, the estate laws in order, first deny wins.
//
// IT NEVER TAKES THE CHAIN DOWN. A rule that throws is skipped, not fatal. A gate that crashes the
// PreToolUse chain removes every other gate with it, which is worse than any single miss.
//
// CONSERVATIVE WHEN IT CANNOT TELL. No path, no parseable event, nothing to read — allow. A gate
// that refuses what it does not understand teaches people to work around it.

import { emit, payload, type Payload, type ToolInput, type Verdict } from "../lib/payload.ts";
import { begin, span, end as endTiming } from "../lib/timing.ts";
import { subjects, pathOnly, written } from "../checks/subjects.ts";

// THE SUBJECTS ARE RESOLVED PER WRITE rather than held in a module-level list, because which
// providers exist is read from the folder rather than written here. The set is the same every
// time in practice; what changes is that adding a cloud needs no edit to this file or its gate.
export async function dispatch(event: Payload, time: <T>(name: string, fn: () => T) => T): Promise<Verdict> {
  const supplied: ToolInput = event.tool_input ?? {};
  const path = supplied.file_path;
  if (!path) return null;                          // every rule here is about a file

  // THE PATH-ONLY SUBJECTS RUN BEFORE THE TEXT IS READ, because `dist/` is refused whatever it
  // holds — an empty write into build output is still an edit to something the build owns.
  const text = written(supplied);
  for (const subject of await subjects()) {
    // A subject that needs text and has none has nothing to say.
    if (!text && !pathOnly(subject.name)) continue;
    let verdict: Verdict = null;
    // A SUBJECT THAT THROWS IS SKIPPED, NEVER FATAL. A gate that crashes the PreToolUse chain
    // removes every other gate with it, which is worse than any single miss.
    try { verdict = time(subject.name, () => subject.validate(path, text)); }
    catch { continue; }
    if (verdict?.deny) return verdict;             // first deny wins
  }
  return null;
}

const event = await payload();
// MEASURING IS FREE; WRITING IS THE COST. `begin` touches no filesystem, so the loop always times
// and always reports. What the window decides is whether any of it is ever written down.
begin({ event: "PreToolUse", tool: event?.tool_name ?? null, session: event?.session_id ?? null },
      event?.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = event ? await dispatch(event, span) : null; } catch { verdict = null; }
endTiming();
emit(verdict);
process.exit(0);
