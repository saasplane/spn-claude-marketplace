#!/usr/bin/env node
// Advises, when a Read opens a unit's own `.tsx`, that `spn-surface unit show <Unit>` answers it first.
//
// A UNIT'S FILE IS NAMED FOR THE UNIT, so the advice is exact: `ForgotPasswordStep.tsx` under a UI
// folder is the unit `ForgotPasswordStep`. The note stands beside the Read it is about, which the
// design skill's words could not do. The scripts page of the plugin states why it exists.
//
// IT ADVISES AND NEVER REFUSES, since a window may need what the index does not carry. A search gets
// no note: its words name a task and not a unit, and `unit find` answers those.
//
//   hook :  unit-read.ts --stdin        (PreToolUse JSON on stdin)

import { basename } from "node:path";
import type { Payload, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";

/** A unit's folder: a module's `src/entry/ui/` or the design system's `src/ui/`, then the layer. */
const UNIT_FOLDER = /\/src\/(?:entry\/)?ui\/(?:components|containers|widgets)\//;

/** Whether a path names a unit's own source: a `.tsx` under a unit's folder, not a test and not an index. */
export function isUnitSource(path: string): boolean {
  const normalized = path.split("\\").join("/");
  return UNIT_FOLDER.test(normalized) && /\/[A-Z][A-Za-z0-9]*\.tsx$/.test(normalized) && !/\.(spec|test|stories)\.tsx$/.test(normalized);
}

/** The note for one unit's file: the command that answers it, and when the source is still the place to read. */
export function noteFor(path: string): string {
  const unit = basename(path.split("\\").join("/"), ".tsx");
  return `spn-surface: \`${unit}\` is a unit. Run \`spn-surface unit show ${unit}\` first: it prints the unit's props, `
    + "their values and defaults, and the core block whose cases decide the rest, from the symbol index, "
    + "at the workspace root from every member. Read the source only for what that leaves out.";
}

/** The verdict for one event: a Read of a unit's file gets the note, every other call is left alone. */
export function run(event: Payload): Verdict {
  const path = event.tool_input?.file_path;
  if (event.tool_name !== "Read" || !path || !isUnitSource(path)) return null;
  return { note: noteFor(path) };
}

export const CHECK = { name: "unit-read", run };

if (runAlone("unit-read.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event) : null);
  process.exit(0);
}
