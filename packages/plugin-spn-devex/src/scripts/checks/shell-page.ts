#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's
// A WORKSTREAM OR DOCS PAGE IS NEVER WRITTEN THROUGH THE SHELL. The Write and Edit hook reads what is typed, tells the agent
// to read `doc-sets.md` and `blocks.md` before it edits a preview, and runs the page checks; a page a script wrote or grew
// got none of that, and a preview built that way read as notes (041 N009). A sample is the work's own file in its own
// format, so a page under `samples/` is the one `.html` a shell may write.

import { bashWrites } from "./doc-check.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const SAYS = "write it with Write or Edit, so the page checks run";

/** Whether a path is a page of a workstream or a docs tree: `.html` under `.spndevex/workstreams/` or a `docs/` folder, and not a sample. */
export function isPagePath(path: string): boolean {
  const slashed = path.split("\\").join("/");
  if (!/\.html?$/i.test(slashed) || /\/samples\//.test(`/${slashed}`)) return false;
  return /(?:^|\/)\.spndevex\/workstreams\//.test(slashed) || /(?:^|\/)docs\//.test(slashed);
}

// A script that opens a page and writes it: the shell's other way to put bytes in a file, which `bashWrites` cannot read.
const SCRIPTED = /\b(?:python3?|node|perl|ruby)\b[\s\S]*(?:\bopen\s*\(|writeFile|write_text|\.write\s*\(|File\.write)/;

export function applies(_path: string, command: string): boolean {
  return /\.html?\b/i.test(command) && /(?:\.spndevex\/workstreams\/|\bdocs\/)/.test(command);
}

export function checkShellPage(payload: Payload): Verdict {
  const command = payload.tool_input?.command ?? "";
  if (!command || payload.tool_input?.file_path) return null;
  let named: string[] = [];
  try { named = bashWrites(command).map(([path]) => path).filter(isPagePath); } catch { named = []; }
  if (!named.length && SCRIPTED.test(command)) {
    for (const word of command.matchAll(/[^\s'"`()<>|;&]*\.html?\b/gi)) if (isPagePath(word[0])) named.push(word[0]);
  }
  if (!named.length) return null;
  return { deny: `Denied: this command writes ${[...new Set(named)].slice(0, 3).map((path) => `\`${path}\``).join(", ")}, a page of a workstream or of a docs tree — ${SAYS}.` };
}

if (runAlone("shell-page.ts")) {
  try { emit(checkShellPage(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
