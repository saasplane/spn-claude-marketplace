#!/usr/bin/env node
// Notes a MUST, a "never" value or a refusal that a design-system document attaches to how a prop is used.
// A design rule about a prop is guidance, with cases, so this notes and never refuses. It names the
// corrected form in its words. Its applies test (`watched`) returns before any read on a call it does not
// concern: only a Write or Edit of a design-system Markdown document is read.
//
//   hook :  design-wording.ts --stdin        (PreToolUse JSON on stdin)

import type { Payload, ToolInput, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";

/** Whether a path is a design-system document: the only files this check reads. */
export function watched(path: string): boolean {
  const normalized = path.split("\\").join("/");
  return /design-system/.test(normalized) && /\.mdx?$/.test(normalized);
}

const FORCE = /\bMUST(?: NOT)?\b|\b[Nn]ever\b|\bmust not\b|\b[Rr]efus(?:e|es|al|ed|ing)\b/;
const PROP = /\bprops?\b|`[a-z][A-Za-z0-9]*`/;
const USE = /\b(?:use|uses|used|using|set|sets|setting|pass|passes|passed|passing)\b/;

/** One sentence per finding: the prop whose use is made a rule, and the form to write instead. */
export function findings(text: string): string[] {
  const found: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    if (!FORCE.test(sentence) || !PROP.test(sentence) || !USE.test(sentence)) continue;
    const prop = /`([a-z][A-Za-z0-9]*)`/.exec(sentence)?.[1] ?? "a prop";
    const kind = /\bnever\b/i.test(sentence) ? "a never value" : /refus/i.test(sentence) ? "a refusal" : "a MUST";
    found.push(`This makes how ${prop} is used ${kind}. Write it as guidance with cases instead: say what ${prop} usually carries, then when another value reads better, in the words of "usually X; when Y, Z".`);
  }
  return [...new Set(found)];
}

/** The verdict for one write: a note when a document makes a prop's use a rule, silence otherwise. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  const text = input.content ?? input.new_string ?? null;
  if (text === null) return null;
  const found = findings(text);
  return found.length ? { note: `spn-surface: ${found.join(" ")}` } : null;
}

export const CHECK = { name: "design-wording", run, watched };

if (runAlone("design-wording.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
