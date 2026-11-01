#!/usr/bin/env node
// Refuses the company and product name spelled SaasPlane, Saas Plane or SPN Demo in visible web or docs
// text. The corrected form is SaaS Plane, and the refusal says so. Its
// applies test (`watched`) returns before any read on a call it does not concern: only a Write or Edit
// of a Markdown, HTML or JSX/TSX file is read, and in code only visible text is, never an identifier.
//
//   hook :  product-name.ts --stdin        (PreToolUse JSON on stdin)

import type { Payload, ToolInput, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";

const WRONG = /\bSaasPlane\b|\bSaas Plane\b|\bSPN Demo\b/g;

/** Whether a path is web or docs text: the only files this check reads. */
export function watched(path: string): boolean {
  const normalized = path.split("\\").join("/");
  return /\.(?:mdx?|html?|tsx|jsx)$/.test(normalized);
}

/** The visible text of a file: all of a document, and the JSX text and string literals of a component. */
export function visibleText(path: string, text: string): string {
  if (/\.(?:tsx|jsx)$/.test(path)) {
    const parts = [...text.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
    parts.push(...[...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].map((m) => m[2]).filter((s) => /\s/.test(s)));
    return parts.join("\n");
  }
  return text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ").replace(/https?:\/\/\S+/g, " ");
}

/** Each wrong spelling the visible text holds, once. */
export function wrongNames(path: string, text: string): string[] {
  return [...new Set(visibleText(path, text).match(WRONG) ?? [])];
}

/** The verdict for one write: a refusal naming the corrected form, or silence. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  const text = input.content ?? input.new_string ?? null;
  if (text === null) return null;
  const wrong = wrongNames(path, text);
  if (!wrong.length) return null;
  const headline = `Denied — the text spells the name ${wrong.map((w) => `"${w}"`).join(", ")}: spell the company and product name SaaS Plane, with a capital S, a lowercase a, a capital S, a space and a capital P.`;
  return { deny: headline, headline };
}

export const CHECK = { name: "product-name", run, watched };

if (runAlone("product-name.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event.tool_input ?? {}) : null);
  process.exit(0);
}
