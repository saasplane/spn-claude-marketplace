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

import type { Payload, ToolInput, Verdict } from "../lib/payload.ts";
import { begin, span, end as endTiming } from "../lib/timing.ts";
import { emit, payload } from "../lib/payload.ts";
import { CHECKS as COVERAGE_CHECKS, run as runCoverage } from "../checks/tests/coverage.ts";
import { run as runEnablementGrammar, watched as watchedEnablement } from "../checks/contract/enablement-grammar.ts";
import { run as runHostAssertion } from "../checks/tests/host-assertion.ts";
import { run as runReadVerbNaming, watched as watchedReadVerb } from "../checks/contract/read-verb-naming.ts";
import { run as runAwaitSequencing, watched as watchedAwait } from "../checks/src/await-sequencing.ts";
import { run as runAssertionMessage, watched as watchedAssertion } from "../checks/tests/assertion-message.ts";

type Check = {
  name: string;
  run: (input: ToolInput) => Verdict;
  /** What this check could possibly have an opinion about, from the path alone. */
  applies: (path: string) => boolean;
};

const CODE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const isCode = (path: string) => CODE.some((extension) => path.endsWith(extension));

// Cheapest first: a path test before a file read, a file read before a repository walk. The three
// `coverage` checks come last because `route-e2e` reads a whole test tree to answer.
const CHECKS: Check[] = [
  { name: "read-verb-naming", run: runReadVerbNaming, applies: watchedReadVerb },
  { name: "await-sequencing", run: runAwaitSequencing, applies: watchedAwait },
  { name: "assertion-message", run: runAssertionMessage, applies: watchedAssertion },
  { name: "enablement-grammar", run: runEnablementGrammar, applies: (path) => path.endsWith(".ts") && watchedEnablement(path) },
  { name: "host-assertion", run: runHostAssertion, applies: isCode },
  ...Object.keys(COVERAGE_CHECKS).map((name) => ({
    name: `coverage.${name}`,
    run: (input: ToolInput) => runCoverage(name, input),
    applies: isCode,
  })),
];

export function dispatch(event: Payload, span: <T>(name: string, fn: () => T) => T): Verdict {
  const supplied = event.tool_input ?? {};
  if (!supplied.file_path) return null;            // every check here reads a path
  const path = supplied.file_path;
  const notes: string[] = [];
  for (const check of CHECKS) {
    let applies = false;
    try { applies = check.applies(path); } catch { continue; }
    if (!applies) continue;
    let verdict: Verdict = null;
    try { verdict = span(check.name, () => check.run(supplied)); }
    catch { continue; }                             // a check that throws is skipped, never fatal
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
begin({ event: "PreToolUse", tool: event?.tool_name ?? null, session: event?.session_id ?? null },
      event?.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = event ? dispatch(event, span) : null; } catch { verdict = null; }
endTiming();
emit(verdict);
process.exit(0);
