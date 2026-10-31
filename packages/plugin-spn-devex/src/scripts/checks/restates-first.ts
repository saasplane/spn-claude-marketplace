#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.229 — the plugin's templates are the book's, copied by a command.
//
// A write under the plugin's copy of the book's templates (`PLUGIN_TEMPLATES`) is refused: the copy is
// byte-identical to the book's, so a hand edit makes a second source that the next `restates files write`
// overwrites.

import { PLUGIN_TEMPLATES } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

export function checkRestatesFirst(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const path = payload.tool_input?.file_path ?? "";
  if (!path.includes(`/src/${PLUGIN_TEMPLATES}/`)) return null;
  return { deny:
    `Denied: this template is the book's copy. Change the book's template first, then run ` +
    `\`spn-devex restates files write\` to copy it here (RULE.DEVEX.WORKSPACE.229).` };
}

if (runAlone("restates-first.ts")) {
  try { emit(checkRestatesFirst(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
