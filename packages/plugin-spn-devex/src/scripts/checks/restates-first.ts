#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.229 — the plugin's templates are the book's, copied by a command.
//
// A write under the plugin's copy of the book's templates (`PLUGIN_TEMPLATES`) is refused: the copy is
// byte-identical to the book's, so a hand edit makes a second source that the next `restates files write`
// overwrites. So is a write under spn-surface's copy of the book's surface specs (`refs/specs/surface/`) and to its
// language list (`languages.json`), which the plugins build writes (RULE.SUPPORT.SURFACE.640).

import { PLUGIN_TEMPLATES } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

export function checkRestatesFirst(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const path = payload.tool_input?.file_path ?? "";
  if (path.includes("/plugin-spn-surface/src/refs/specs/surface/")) return { deny:
    "Denied: this spec is the book's copy. Change it in the book's docs/specs/surface/, then run the plugins build " +
    "(`node scripts/build-plugins.mjs`), which checks it against the contract and copies it here (RULE.SUPPORT.SURFACE.601)." };
  if (path.endsWith("/plugin-spn-surface/src/languages.json")) return { deny:
    "Denied: the language list is written by the plugins build from scripts/surface-languages.json and base. Change that " +
    "file, then run `node scripts/build-plugins.mjs` (RULE.SUPPORT.SURFACE.640)." };
  if (!path.includes(`/src/${PLUGIN_TEMPLATES}/`)) return null;
  return { deny:
    `Denied: this template is the book's copy. Change the book's template first, then run ` +
    `\`spn-devex restates files write\` to copy it here (RULE.DEVEX.WORKSPACE.229).` };
}

if (runAlone("restates-first.ts")) {
  try { emit(checkRestatesFirst(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
