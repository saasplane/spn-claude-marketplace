#!/usr/bin/env node
// Every `spn-apps` PreToolUse check, in one process.
//
// WHY THIS EXISTS, AND WHAT IT IS WORTH. `hooks.json` declared six scripts as EIGHT separate
// `PreToolUse` entries, each its own matcher block, so every `Write` and every `Edit` started eight
// Python interpreters. Measured 2026-09-19 on one ordinary edit:
//
//     enablement-grammar 137 ms · host-assertion 137 ms · coverage×3 434 ms
//     read-verb-naming 143 ms · await-sequencing 134 ms · assertion-message 138 ms
//     ────────────────────────────────────────────────────────────────────────
//     1,123 ms per write — of which 1,040 ms was bare `python3` start-up
//
// The checking itself is about 83 ms for all eight together. NINE PARTS IN TEN OF THE COST WAS
// PAYING TO START A PROGRAM. One process pays start-up once, so the same eight checks cost about
// 120 ms — a second back on every write.
//
// The port alone does not collect that. Eight TypeScript entries would still be eight node
// start-ups. **The registration change is where the saving is**, and this file is what makes one
// registration possible.
//
// WHAT IT DOES NOT CHANGE. Each check keeps its own file, its own logic and its own words. This
// imports them and calls them, so a verdict here is the same verdict the check gave alone — and each
// one still runs by hand exactly as before.
//
// HOW A COMBINED VERDICT IS FORMED. The first deny wins and stops the chain, because a refusal is an
// answer and running further checks would only add noise to it. Warnings accumulate: they are
// advice, and two pieces of advice are better than one. Order is cheapest first, so an ordinary edit
// pays as little as possible before something decides.
//
// IT NEVER TAKES THE CHAIN DOWN. A check that throws is skipped, not fatal. A gate that crashes the
// PreToolUse chain removes every other gate with it, which is worse than any single miss.

import type { Payload, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { begin, span, end as endTiming, tagsOf, type SpanName } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { emit, payload } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { subjectsFor } from "../checks/subjects.ts";
import { FIGMA_TOOL, run as runFigmaConnector } from "../checks/figma-connector.ts";

// THE SUBJECTS ARE RESOLVED PER WRITE, not held in a module-level list, because which provider
// answers is a fact about the file being written rather than about this plugin. A workspace holding
// two stacks gets each one's rules on its own files, from one installed plugin.
export async function dispatch(event: Payload, span: <T>(name: SpanName, fn: () => T) => T): Promise<Verdict> {
  // THE CONNECTOR'S SCRIPT RUNNER IS READ BY ITS OWN CHECK, not through a subject: its call has no
  // file path and the check knows no stack.
  if (event.tool_name === FIGMA_TOOL)
    return span({ group: "figma", action: "connector" }, () => runFigmaConnector(event));
  const supplied = event.tool_input ?? {};
  if (!supplied.file_path) return null;            // every other rule here reads a path
  const notes: string[] = [];
  for (const subject of await subjectsFor(supplied.file_path)) {
    let verdict: Verdict = null;
    // A SUBJECT THAT THROWS IS SKIPPED, NEVER FATAL. A gate that crashes the PreToolUse chain
    // removes every other gate with it, which is worse than any single miss.
    try { verdict = await span({ group: subject.group, action: subject.action }, () => subject.validate(supplied)); }
    catch { continue; }
    if (!verdict) continue;
    if (verdict.deny) return verdict;               // the first refusal is the answer
    if (verdict.note) notes.push(verdict.note);
  }
  return notes.length ? { note: notes.join("\n\n") } : null;
}

const event = await payload();
// MEASURING IS FREE; WRITING IS THE COST. `begin` touches no filesystem, so the loop always times and
// always reports. What the window decides is whether any of it is ever written down — which is the
// only part anybody pays for.
//
// THE TIMER IS THIS PLUGIN'S OWN, and that is the rule rather than a convenience. A plugin carries
// its libraries; a neighbour's file is not a dependency it may have. Plugins version and install
// separately, a partner may hold either without the other, and the installed cache puts a version
// directory between a plugin and its files — so reaching across resolves at runtime, and a resolve
// that misses returns the working pass-through, which is silence wearing the shape of success.
begin({ script: "spn-apps", event: "PreToolUse", tool: event?.tool_name ?? null, session: event?.session_id ?? null,
        ...tagsOf(event), process: { group: "events", action: "pretooluse" } },
      event?.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = event ? await dispatch(event, span) : null; } catch { verdict = null; }
endTiming();
emit(verdict);
process.exit(0);
