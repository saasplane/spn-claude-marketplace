// The areas a window's last prompt touched, kept for the reply check (S48, RULE.DEVEX.AGENT.177). The prompt event writes them,
// the stop event reads them; this file is the one place both reach, so neither imports the other.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";

/** An area a prompt touches: the lens map's views and the skill it brings before an answer. */
export type AreaViews = { area: string; views: string[]; skill: string };

/** The file that keeps the areas the window's last prompt named, which the reply check reads; null for a session with no usable id. */
export function areasFile(root: string, session: string): string | null {
  const key = session.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return key ? join(sessionDir(root, key), "areas.json") : null;
}

/** The areas a window's last prompt named, or none where the file is absent or holds something else. */
export function readAreas(root: string, session: string): AreaViews[] {
  const file = areasFile(root, session);
  if (!file) return [];
  try {
    const held = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return Array.isArray(held) ? held.filter((one): one is AreaViews =>
      !!one && typeof (one as AreaViews).area === "string" && Array.isArray((one as AreaViews).views) && typeof (one as AreaViews).skill === "string") : [];
  } catch { return []; }
}

