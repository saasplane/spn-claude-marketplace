// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md § Restatement discipline · docs/04-capabilities/02-support/01-apps/07-comments/README.md § The check, and what each finding costs
//      This file carries rules it does not own. The chapter above is the source of truth.
//      A rule change is edited there first, then here, in the same change. Never add a rule here.
//      The plugin's restates check reports this copy when its source moves.
//
// {{check-name}} — {{what it decides, in one sentence}}.
//
// Event: {{PreToolUse | PostToolUse | SessionStart | UserPromptSubmit | Stop}} · Tools: {{Edit, Write, Bash}} · Files: {{the pattern it reads}}
// Grades: BLOCK (refused, no override) · RULE (refused; the message names the rule and the fix) · SOFT (reported, not refused).
// A BLOCK or a RULE returns `deny`. A SOFT returns `note`. A call the check does not decide returns null.
//
// Where it runs: the event script imports this file and calls the check inside a `span`, so its cost
// is timed. A check reads the call it is given and the files it names. It never edits a file, and it
// never starts `spnutils`.
//
// Known-bad test: `tests/unit/scripts/checks/t-{{check-name}}.mjs` runs the check on a call it must
// refuse and on an untouched call it must pass. A check that has not failed on its known-bad input is
// not trusted. Copied from hook-template.ts.

import type { Payload, Verdict } from "../lib/payload.ts";

/** The rule this check holds, as the sentence a refusal shows. */
const RULE = "{{RD.X.NNN}} — {{the rule, in one line}}";

/** The tools whose calls this check reads. */
const TOOLS = new Set(["{{Edit}}", "{{Write}}"]);

/** The files this check reads: {{why these files and no others}}. */
const FILES = /{{file pattern}}/;

/** One place where the text breaks the rule. */
export type {{CheckName}}Finding = { line: number; message: string };

/** Whether this call is one the check decides. Every other call passes untouched. */
export function {{decidesCall}}(payload: Payload): boolean {
  if (!TOOLS.has(payload.tool_name ?? "")) return false;
  const input = (payload.tool_input ?? {}) as Record<string, unknown>;
  return typeof input.file_path === "string" && FILES.test(input.file_path);
}

/** Every line of the text that breaks the rule. It reads the text it is given and nothing else. */
export function {{findBreaks}}(text: string): {{CheckName}}Finding[] {
  const findings: {{CheckName}}Finding[] = [];
  text.split("\n").forEach((line, index) => {
    if (/{{pattern}}/.test(line)) findings.push({ line: index + 1, message: "{{what to change}}" });
  });
  return findings;
}

/** The verdict for one call: a refusal that names the rule and the fix, or null. */
export function {{checkName}}(payload: Payload): Verdict {
  if (!{{decidesCall}}(payload)) return null;
  const input = (payload.tool_input ?? {}) as Record<string, unknown>;
  const text = [input.content, input.new_string].find((value) => typeof value === "string") as string | undefined;
  if (!text) return null;
  const findings = {{findBreaks}}(text);
  if (!findings.length) return null;
  const lines = findings.map((finding) => `line ${finding.line}: ${finding.message}`).join("; ");
  return { deny: `${RULE}. ${lines}.` };
}
