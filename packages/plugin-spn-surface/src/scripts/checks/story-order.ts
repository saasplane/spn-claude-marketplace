#!/usr/bin/env node
// Notes a unit whose Playground is not the last of its stories, or is missing from the storySort order.
// It names the corrected form in its words. Its applies test (`watched`) returns before any read on a
// call it does not concern: only a Write or Edit of a stories file or a Storybook preview is read.
//
//   hook :  story-order.ts --stdin        (PreToolUse JSON on stdin)

import type { Payload, ToolInput, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";

const STORIES = /\.stories\.(?:tsx?|jsx?|mdx)$/;
const PREVIEW = /\/\.storybook\/preview\.(?:tsx?|jsx?)$/;

/** Whether a path is a stories file or a Storybook preview: the only files this check reads. */
export function watched(path: string): boolean {
  const normalized = path.split("\\").join("/");
  return STORIES.test(normalized) || PREVIEW.test(normalized);
}

/** The stories a file exports, in the order it writes them. */
export function exportedStories(text: string): string[] {
  return [...text.matchAll(/^export\s+(?:const|function)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
}

/** One sentence per finding. */
export function findings(path: string, text: string): string[] {
  const found: string[] = [];
  if (STORIES.test(path.split("\\").join("/"))) {
    const stories = exportedStories(text);
    const at = stories.indexOf("Playground");
    if (at !== -1 && at !== stories.length - 1)
      found.push(`Playground is not the last story here (it comes before ${stories[stories.length - 1]}): move the Playground export to the end, so a unit's Playground is the last page of the unit.`);
    return found;
  }
  const sort = /storySort\s*:\s*\{[\s\S]*?order\s*:\s*(\[[\s\S]*?\])\s*[,}]/.exec(text);
  if (sort && !/["'`]Playground["'`]/.test(sort[1]))
    found.push("The storySort order does not name Playground: add \"Playground\" as the last entry of the unit's order, so the unit's Playground is its last page.");
  return found;
}

/** The verdict for one write: a note, never a refusal, or silence. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  const text = input.content ?? input.new_string ?? null;
  if (text === null) return null;
  const found = findings(path, text);
  return found.length ? { note: `spn-surface: ${found.join(" ")}` } : null;
}

export const CHECK = { name: "story-order", run, watched };

if (runAlone("story-order.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
