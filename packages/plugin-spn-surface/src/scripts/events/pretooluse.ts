#!/usr/bin/env node
// Every `spn-surface` PreToolUse check, in one process.
//
// ONE REGISTRATION, ONE PROCESS. `hooks.json` declares this file as its single `PreToolUse` entry, so a
// call the matcher names starts one program, and a check added later is a call in the dispatcher below
// rather than a second registration. Each check keeps its own file, its own logic and its own words;
// this imports it and calls it, so a verdict here is the same verdict the check gives alone, and each
// one still runs by hand.
//
// HOW A COMBINED VERDICT IS FORMED. The first deny wins and stops the chain, because a refusal is an
// answer and running further checks would only add noise to it. Warnings accumulate: they are advice,
// and two pieces of advice are better than one.
//
// IT NEVER TAKES THE CHAIN DOWN. A check that throws is skipped, not fatal. A gate that crashes the
// PreToolUse chain removes every other gate with it, which is worse than any single miss.

import type { Payload, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { begin, span, end as endTiming, tagsOf, type SpanName } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { emit, payload } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { FIGMA_TOOL, run as runFigmaConnector } from "../checks/figma-connector.ts";
import { isTsxSource } from "../lib/node.ts";

export async function dispatch(event: Payload, span: <T>(name: SpanName, fn: () => T) => T): Promise<Verdict> {
  // THE CONNECTOR'S SCRIPT RUNNER IS READ BY ITS OWN CHECK: its call has no file path and the check
  // knows no stack.
  if (event.tool_name === FIGMA_TOOL)
    return span({ group: "figma", action: "connector" }, () => runFigmaConnector(event));
  // THE SURFACE CHECK (RD.DEVEX.AGENT.107). Every other path leaves here, on a test of the path's own
  // text, before a file is read or the check is loaded: start-up and loading were nine tenths of a
  // hook's cost, and most writes are not Surface code.
  const path = event.tool_input?.file_path;
  if ((event.tool_name !== "Write" && event.tool_name !== "Edit") || !path || !isTsxSource(path)) return null;
  const reader = await span({ group: "surface", action: "load" },
    async () => (await import("../checks/subjects.ts")).surfaceFor(path));
  if (!reader) return null;
  return span({ group: "surface", action: reader.stack }, () => reader.validate(event.tool_input ?? {}));
}

const event = await payload();
// MEASURING IS FREE; WRITING IS THE COST. `begin` touches no filesystem, so the loop always times and
// always reports. What the window decides is whether any of it is ever written down — which is the
// only part anybody pays for.
//
// THE TIMER IS THIS PLUGIN'S OWN, and that is the rule rather than a convenience. A plugin carries
// its libraries; a neighbour's file is not a dependency it may have. Plugins version and install
// separately, a partner may hold either without the other, and the installed cache puts a version
// directory between a plugin and its files, so a library is imported from `plugin-support-lib`, which
// the build bundles into this plugin's own `dist/`.
begin({ script: "spn-surface", event: "PreToolUse", tool: event?.tool_name ?? null, session: event?.session_id ?? null,
        ...tagsOf(event), process: { group: "events", action: "pretooluse" } },
      event?.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = event ? await dispatch(event, span) : null; } catch { verdict = null; }
endTiming();
emit(verdict);
process.exit(0);
