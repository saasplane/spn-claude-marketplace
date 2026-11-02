// Whether this workspace is the builder's: the one the developer who builds SaaS Plane works in. It lives in a module of its
// own so a check that asks only this does not load the session start to get it.

import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";

/** Whether `SPN_DEVEX_AGENT_WORKSPACE` is set and names this workspace, both resolved to their real paths. */
function namedWorkspace(root: string): boolean {
  const named = process.env.SPN_DEVEX_AGENT_WORKSPACE;
  if (!named) return false;
  try { return realpathSync(named) === realpathSync(root); } catch { return false; }
}

/** Whether the workspace holds the book (an `spn-foundation` checkout with `sprepo.json`) beside the plugins' source (a checkout holding `packages/plugin-spn-devex`). */
function holdsBookAndPlugins(root: string): boolean {
  try {
    if (!existsSync(join(root, "spn-foundation", "sprepo.json"))) return false;
    return readdirSync(root).some((entry) => !entry.startsWith(".") && existsSync(join(root, entry, "sprepo.json")) && existsSync(join(root, entry, "packages", "plugin-spn-devex")));
  } catch { return false; }
}

/** Whether this is the builder's workspace: the key names it, or it holds the book beside the plugins' source. */
export function isBuilderWorkspace(root: string): boolean {
  return namedWorkspace(root) || holdsBookAndPlugins(root);
}
