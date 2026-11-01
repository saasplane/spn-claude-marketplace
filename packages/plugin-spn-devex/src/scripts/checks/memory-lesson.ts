#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.UTILS.019, which says a lesson that holds for every window belongs in the
// book or a plugin, and the machine's memory holds only what this machine alone knows. The chapter is the source
// of truth; a rule change is edited there first, then here.
//
// Notes a write to a memory folder (`.claude/projects/<project>/memory/`) when this window has written under
// neither the book (`spn-foundation`) nor the plugins (`spn-claude-marketplace`), and names where the rule belongs.
//
// A NOTE, NEVER A REFUSAL: some memory is rightly the machine's own, a path or a sign-in. Its fast path is one
// string test on the path, so an ordinary edit pays that and stops; only a memory write reads the window's note.
//
//   called by: events/pretooluse.ts, on a Write or Edit call

import { reposWritten } from "../lib/window.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";

/** The repositories whose files carry a rule: the book and the plugins. */
export const RULE_HOMES = ["spn-foundation", "spn-claude-marketplace"];

/** Whether a path sits in a memory folder: a string test, so every other write stops here. */
export function applies(path: string, _command = ""): boolean {
  return path.includes("/memory/") && /\/\.claude\/projects\/[^/]+\/memory\//.test(path);
}

export function checkMemoryLesson(payload: Payload): Verdict {
  const tool = payload.tool_name;
  if (tool !== "Write" && tool !== "Edit") return null;
  const path = payload.tool_input?.file_path ?? "";
  if (!applies(path)) return null;
  const root = workspaceRoot(payload.cwd ?? process.cwd());
  if (root && RULE_HOMES.some((home) => reposWritten(root, payload.session_id).has(home))) return null;
  return { note:
    "This memory write follows a turn that changed neither the book nor a plugin. A lesson every window needs belongs there: " +
    "a rule in the book chapter that owns it, restated in the plugin's ref, so the next window reads it without this machine " +
    "(RULE.DEVEX.UTILS.019). Keep in memory only what this machine alone knows, a path or a sign-in." };
}

if (runAlone("memory-lesson.ts")) {
  try { emit(checkMemoryLesson(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
