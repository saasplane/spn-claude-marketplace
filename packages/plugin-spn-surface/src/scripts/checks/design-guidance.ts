#!/usr/bin/env node
// Notes a MUST, a "never" or a refusal that a Surface ref, a design-system page or a check source attaches
// to how a prop is used. A design rule about a prop is guidance, with cases, so this notes and never refuses.
//
//   hook :  design-guidance.ts --stdin        (PreToolUse JSON on stdin)

import type { Payload, ToolInput, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";

/** Whether a path is a Surface ref, a design-system page or a check source: the files this check reads. */
export function watched(path: string): boolean {
  const normalized = path.split("\\").join("/");
  if (/\/plugin-spn-surface\/src\/refs\/.+\.md$/.test(normalized)) return true;
  if (/design-system/.test(normalized) && normalized.endsWith(".md")) return true;
  return /\/scripts\/checks\/[^/]+\.ts$/.test(normalized);
}

const FORCE = /\bMUST(?: NOT)?\b|\b[Nn]ever\b|\bmust not\b|\b[Rr]efus(?:e|es|al|ed|ing)\b/;
const PROP_USE = /\bprops?\b|`[a-z][A-Za-z0-9]*`/;
const USE = /\b(?:use|uses|used|using|set|sets|setting|pass|passes|passed|passing)\b/;

/** One sentence per finding: the prop whose use is made a rule. */
export function findings(text: string): string[] {
  const found: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    if (!FORCE.test(sentence) || !PROP_USE.test(sentence) || !USE.test(sentence)) continue;
    const prop = /`([a-z][A-Za-z0-9]*)`/.exec(sentence)?.[1];
    found.push(`This makes how ${prop ?? "a prop"} is used ${/\bnever\b/i.test(sentence) ? "a never" : /refus/i.test(sentence) ? "a refusal" : "a MUST"}. A design rule about a prop is guidance, with cases.`);
  }
  return [...new Set(found)];
}

/** The verdict for one write: a note when it makes a prop's use a rule, silence otherwise. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  const text = input.content ?? input.new_string ?? null;
  if (!watched(path) || text === null) return null;
  const found = findings(text);
  return found.length ? { note: `spn-surface: ${found.join(" ")}` } : null;
}

export const CHECK = { name: "design-guidance", run, watched };

if (runAlone("design-guidance.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
