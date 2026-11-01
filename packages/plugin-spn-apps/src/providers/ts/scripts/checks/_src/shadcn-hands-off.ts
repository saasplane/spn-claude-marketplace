#!/usr/bin/env node
// Refuse any write to a path under `src/_shadcn/` (MKT.HOOKS.145).
//
// The rule: never edit files under `src/_shadcn/` by hand. The folder holds what the shadcn CLI generated or
// copied, and a hand edit is lost the next time the CLI refreshes it. The decision is made by the path alone,
// so this check never reads the file.
//
//   hook :  shadcn-hands-off.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)

import { resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";

const REMEDY = "Files under src/_shadcn/ are generated or copied by the shadcn CLI, so a hand edit is lost on the " +
  "next refresh. Add or update the unit with the shadcn CLI, and put your own change in a component outside " +
  "src/_shadcn/ that wraps it.";

export function watched(path: string): boolean {
  return resolve(path).split("\\").join("/").includes("/src/_shadcn/");
}

/** The verdict for one write. The path was already judged by `watched`; no text is read. */
export function verdict(path: string, _source: string | null, _added: string | null): Verdict {
  if (!watched(path)) return null;
  return { deny: `Denied — ${path} sits under src/_shadcn/ and is never edited by hand.\n  ${REMEDY}` };
}

/** The verdict for one write. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  return watched(path) ? verdict(path, null, null) : null;
}

export const CHECK = { name: "shadcn-hands-off", run, watched };

if (runAlone("shadcn-hands-off.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
