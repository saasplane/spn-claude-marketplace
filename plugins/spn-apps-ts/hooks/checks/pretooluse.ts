#!/usr/bin/env node
// Every `spn-apps-ts` PreToolUse check, in one process.
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

import { resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../lib/payload.ts";
import { emit, payload } from "../lib/payload.ts";
import { isDir, isFile } from "../lib/source.ts";
import { CHECKS as COVERAGE_CHECKS, run as runCoverage } from "./coverage.ts";
import { run as runEnablementGrammar, watched as watchedEnablement } from "./enablement-grammar.ts";
import { run as runHostAssertion } from "./host-assertion.ts";
import { run as runReadVerbNaming, watched as watchedReadVerb } from "./read-verb-naming.ts";
import { run as runAwaitSequencing, watched as watchedAwait } from "./await-sequencing.ts";
import { run as runAssertionMessage, watched as watchedAssertion } from "./assertion-message.ts";

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

/**
 * `span` from `spn-core`'s `timing.ts`, or a pass-through.
 *
 * The timer lives in the other plugin, and a partner may hold one plugin without the other, so this
 * resolves it at runtime and records nothing when it is absent. A missing neighbour must never be
 * the reason a gate stops running.
 */
async function timer(): Promise<{
  begin: (facts: Record<string, unknown>, start?: string) => void;
  span: <T>(name: string, fn: () => T) => T;
  end: () => void;
}> {
  const passthrough = { begin: () => {}, span: <T,>(_: string, fn: () => T) => fn(), end: () => {} };
  const family = resolve(import.meta.dirname, "..", "..", "..");   // holds spn-core beside us
  const direct = resolve(family, "spn-core", "hooks", "docs", "timing.ts");
  let target = isFile(direct) ? direct : null;
  if (!target) {
    // The installed cache puts a VERSION directory between the plugin and its files.
    const versioned = resolve(family, "..", "spn-core");
    if (isDir(versioned)) {
      const { readdirSync } = await import("node:fs");
      const picks = readdirSync(versioned)
        .filter((d) => isFile(resolve(versioned, d, "hooks", "docs", "timing.ts"))).sort();
      if (picks.length) target = resolve(versioned, picks[picks.length - 1], "hooks", "docs", "timing.ts");
    }
  }
  if (!target) return passthrough;
  try { return (await import(target)) as Awaited<ReturnType<typeof timer>>; } catch { return passthrough; }
}

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
const clock = await timer();
// MEASURING IS FREE; WRITING IS THE COST. `begin` touches no filesystem, so the loop always times and
// always reports. What the window decides is whether any of it is ever written down — which is the
// only part anybody pays for.
clock.begin({ event: "PreToolUse", tool: event?.tool_name ?? null, session: event?.session_id ?? null },
            event?.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = event ? dispatch(event, clock.span) : null; } catch { verdict = null; }
clock.end();
emit(verdict);
process.exit(0);
