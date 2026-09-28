#!/usr/bin/env node
// RESTATES: `docs/04-capabilities/02-support/02-infra/02-packages/02-tests.md` §
// The build runs first and prints no case — "no run.sh checks its own manifest". That chapter
// governs; this file states no rule of its own.
//
// Warn, never refuse, when a harness looks like it re-checks the manifest `infra validate`
// already checks — narrow on purpose: an embedded Python heredoc reading a manifest file by name.
// A false positive here costs a read; a false negative costs nothing this rule was ever meant to
// catch, so it ships as a note rather than a denial until it has run against real harnesses.
import type { Rule } from "./laws/law.ts";
import type { Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";

const IS_HARNESS = /\/tests\/(?:[^/]+\/)*run\.sh$/;
const EMBEDS_PYTHON = /python3?\s+(?:<<|-c\b)/;
const READS_A_MANIFEST = /\b(spkind|spestate|spinfrapkg|sprepo)\.json\b/;

export const RULES: Rule[] = [
  {
    name: "harness-reimplements-manifest-identity",
    applies: (path) => IS_HARNESS.test(path),
    run: (_path, text): Verdict => {
      if (!EMBEDS_PYTHON.test(text) || !READS_A_MANIFEST.test(text)) return null;
      return { note: "This run.sh looks like it re-checks a manifest inside the harness. `infra validate` already checks identity, a declaration's shape and the one-organization rule before run.sh starts — a repeated check here is a second answer that can drift from the first (02-tests.md § The build runs first and prints no case)." };
    },
  },
];

export function validate(path: string, text: string): Verdict {
  for (const rule of RULES) {
    if (!rule.applies(path)) continue;
    const verdict = rule.run(path, text);
    if (verdict) return verdict;
  }
  return null;
}
