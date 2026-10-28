#!/usr/bin/env node
// RESTATES: nothing. The rules are in `checks/rendering/`, stated once and cloud-free.
//
// The rendering subject, for AWS: read the text once, then run every rendering rule against it.
//
// **A RENDERING IS WHAT THE DECLARATION PRODUCED**, so the rules here are about the relationship
// between a rendering and its source rather than about the cloud underneath. That is why the same
// rule set serves every provider and only the parse differs.
//
// **THE SUBJECT IS SEPARATE FROM `manifest` BECAUSE THE PARSE IS.** A manifest is JSON a person
// edits; a rendering is built output a person should not be editing at all. Running one set of
// rules over both would make every finding say the wrong thing about half its inputs.
import type { Verdict } from "../../../../../../plugin-support-lib/src/lib/payload.ts";
import type { Rule } from "../../../../scripts/lib/laws/law.ts";
import { RULES as BUILD_OUTPUT } from "../../../../scripts/lib/laws/no-edits-to-built-output.ts";

export const RULES: Rule[] = [...BUILD_OUTPUT];

export function validate(path: string, text: string): Verdict {
  for (const rule of RULES) {
    if (!rule.applies(path)) continue;
    const verdict = rule.run(path, text);
    if (verdict) return verdict;
  }
  return null;
}
