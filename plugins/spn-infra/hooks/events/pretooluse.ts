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
import { RULES, written } from "../checks/estate-violations.ts";

export function dispatch(event: Payload, time: <T>(name: string, fn: () => T) => T): Verdict {
  const supplied: ToolInput = event.tool_input ?? {};
  const path = supplied.file_path;
  if (!path) return null;                          // every rule here is about a file

  // THE PATH RULE RUNS BEFORE THE TEXT IS READ, because `dist/` is refused whatever it holds — an
  // empty write into build output is still an edit to something the build owns.
  const text = written(supplied);
  for (const rule of RULES) {
    let applies = false;
    try { applies = rule.applies(path); } catch { continue; }
    if (!applies) continue;
    // A rule that needs text and has none has nothing to say. `dist-is-build-output` reads the path
    // alone, so it is never skipped here.
    if (!text && rule.name !== "dist-is-build-output") continue;
    let verdict: Verdict = null;
    try { verdict = time(rule.name, () => rule.run(path, text)); }
    catch { continue; }                            // a rule that throws is skipped, never fatal
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
try { verdict = event ? dispatch(event, span) : null; } catch { verdict = null; }
endTiming();
emit(verdict);
process.exit(0);
