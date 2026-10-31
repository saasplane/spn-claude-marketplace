// Whether this workspace is the builder's: the one the developer who builds SaaS Plane works in. It lives in a module of its
// own so a check that asks only this does not load the session start to get it.

import { realpathSync } from "node:fs";

/** Whether `SPN_DEVEX_AGENT_WORKSPACE` is set and names this workspace, both resolved to their real paths. */
export function isBuilderWorkspace(root: string): boolean {
  const named = process.env.SPN_DEVEX_AGENT_WORKSPACE;
  if (!named) return false;
  try { return realpathSync(named) === realpathSync(root); } catch { return false; }
}
