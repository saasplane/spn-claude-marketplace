#!/usr/bin/env node
// A guide names the spnutils command that does the job, never the `npx` or `pnpm` one under it.
//
// WHAT IT READS. The text a `.md` or `.html` write adds under a `guides/` folder (`05-guides/` included).

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const RUNNER = /(?:^|[\s`$>(])((?:npx|pnpm)\s+[^\n`<]*)/m;

/** The spnutils command that does what the runner line does, where the line says what it does. */
function spnutilsFor(line: string): string {
  if (/\b(?:test|vitest|jest)\b/.test(line)) return "spnutils apps test";
  if (/\b(?:build|tsc)\b/.test(line)) return "spnutils apps build";
  if (/\b(?:install|add|i)\b/.test(line)) return "spnutils apps install";
  return "the matching spnutils command";
}

/** A page under a `guides/` or `NN-guides/` folder. */
export function applies(path: string): boolean {
  return /\.(?:md|html)$/.test(path) && /\/(?:\d+-)?guides\//.test(path);
}

export function checkGuideCommands(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const supplied = payload.tool_input ?? {};
  if (!applies(supplied.file_path ?? "")) return null;

  const line = RUNNER.exec(supplied.content ?? supplied.new_string ?? "")?.[1]?.trim();
  if (!line) return null;
  return { deny:
    `Denied: this guide runs \`${line}\`. A guide names the spnutils command, such as ` +
    `\`${spnutilsFor(line)}\`, so a reader runs the same thing the workspace does.` };
}

if (runAlone("guide-commands.ts")) {
  try { emit(checkGuideCommands(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
