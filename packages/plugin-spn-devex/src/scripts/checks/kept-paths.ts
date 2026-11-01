#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.261 (a closed workstream is never modified), RULE.DEVEX.UTILS.075
// (the tool's home folder is written only through `spnutils` commands), and the plugin chapters' three sentences:
// a plugin's cache lives in the machine store, the allow tier is derived by `agent-sync`, and a new
// `spn:generated` block kind needs the developer's approval. The chapters are the source of truth; a rule
// change is edited there first, then here.
//
// Refuses a `Write` or `Edit` to five places a window is told to leave alone: a closed workstream, a plugin cache
// (under the tool's `plugins/` folder, or in the workspace folder), the rest of the tool's home folder, a settings
// file that gains a path wildcard in its allow rules, and a document that opens a new `spn:generated` block kind.
// The memory folder under the tool's `projects/` is the agent's own and is let through.
//
// A REFUSAL, BECAUSE EACH WRITE IS LOST OR WRONG THE MOMENT IT LANDS: a closed workstream is read as history, a cache
// is rebuilt, and a settings rule written by hand is overwritten by the next `agent-sync`. Every refusal names the
// corrected form. `applies` is a few string comparisons over the path, so an ordinary edit pays that and stops.
//
//   called by: events/pretooluse.ts, on a Write or Edit call

import { homedir } from "node:os";
import { resolve } from "node:path";
import { DEVEX, WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

/** The kinds of `spn:generated` block the book names; a kind outside this list needs the developer's yes. */
export const KNOWN_KINDS = ["constructs", "glossary", "glossary-html", "progress", "open", "contents", "dictionary", "commands"];

const CLOSED = `/${DEVEX}/${WORKSTREAMS}/closed/`;
const WORKSPACE_CACHE = /\/\.spndevex\/(?:\.?cache|\.?state-cache)\//;
const SETTINGS = /\/\.claude\/settings(?:\.local)?\.json$/;
/** An allow rule that writes a path wildcard: a file tool with a `*`, or a Bash rule with a path and a `*`. */
const PATH_WILDCARD = /"(?:(?:Read|Edit|Write|MultiEdit|NotebookEdit)\([^")]*\*[^")]*|Bash\([^")]*\/[^")]*\*[^")]*)\)"/;
const GENERATED = /<!--\s*spn:generated\s+([A-Za-z][\w-]*)/g;

/** Whether a call could concern this check: a few string comparisons over the path. */
export function applies(path: string, _command = ""): boolean {
  if (!path) return false;
  return path.includes(CLOSED) || path.includes("/.claude") || path.includes("/.spndevex/") || /\.(?:md|html)$/.test(path);
}

/** The tool's home folder, `~/.claude`, as an absolute path with no trailing slash. */
function toolHome(): string {
  return resolve(process.env.HOME || homedir(), ".claude");
}

/** The refusal for a write to `path` with `text` as what it adds, or null. */
export function refusal(path: string, text: string): string | null {
  if (path.includes(CLOSED))
    return "A closed workstream is history and is never modified or migrated (RULE.DEVEX.WORKSPACE.261). " +
      "Put the change in an open workstream's notes, or open a new workstream with the developer's yes.";
  if (WORKSPACE_CACHE.test(path))
    return "A plugin's cache and mutable state live in the machine store, under `~/.saasplane/cache/plugins/<name>/`, keyed by content, and never in the shared workspace folder.";
  const home = toolHome();
  if (path.startsWith(`${home}/`)) {
    const inside = path.slice(home.length + 1);
    if (inside.startsWith("projects/")) return null;
    if (inside.startsWith("plugins/"))
      return "A plugin's cache and mutable state are written by the plugin's own commands into the machine store, keyed by content; this folder is installed state. " +
        "Run `spnutils workspace agent-sync` instead of writing here.";
    return "The tool's home folder is written only through `spnutils` commands, and the developer is never asked to change a file there (RULE.DEVEX.UTILS.075). " +
      "Use `spnutils workspace agent-sync`, or the `spnutils` command that owns this file.";
  }
  if (SETTINGS.test(path) && PATH_WILDCARD.test(text))
    return "Allow rules come from the plugins' declaration through `spnutils workspace agent-sync`, never from a path wildcard written into settings. " +
      "Change the plugin's declared allow list, then run `spnutils workspace agent-sync`.";
  if (/\.(?:md|html)$/.test(path) && text.includes("spn:generated")) {
    for (const found of text.matchAll(GENERATED))
      if (!KNOWN_KINDS.includes(found[1]))
        return `\`spn:generated ${found[1]}\` is a new block kind, and a kind is added only with the developer's explicit approval. ` +
          `Declare the block by hand and check it instead, or ask the developer for the kind.`;
  }
  return null;
}

export function checkKeptPaths(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const input = payload.tool_input ?? {};
  const given = input.file_path;
  if (!given || !applies(given)) return null;
  const path = resolve(payload.cwd ?? process.cwd(), given);
  const why = refusal(path, `${input.content ?? ""}\n${input.new_string ?? ""}`);
  return why ? { deny: `Denied: ${why}` } : null;
}

if (runAlone("kept-paths.ts")) {
  try { emit(checkKeptPaths(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
