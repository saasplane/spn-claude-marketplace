// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 012: an arc's `position` is retired. The Plan table and the status bar follow `arcOrder`, and `dependsOn` sets the order of
// work, so `position` orders nothing. Each arc's state.json of an open or backlog workstream that still holds the field loses it;
// `closed/` is never read, and a file without the field is left as it is.

import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { arcIdsOf, isDataLayout, stateFileOf, workstreamsOf } from "../workstream.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

type Owed = { file: string; name: string; data: Record<string, unknown> };

/** Each arc state file of an open or backlog workstream that still holds `position`. */
function owedFiles(root: string): Owed[] {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const file = stateFileOf(ws, arc);
      try {
        const data = JSON.parse(readFileSync(file, "utf8"));
        return data && typeof data === "object" && "position" in data ? [{ file, name: `${name}/arcs/${arc}`, data }] : [];
      } catch { return []; }
    });
  });
}

/** Each arc that still holds a `position`, with what it holds. */
export function arcsHoldingPosition(root: string): string[] {
  return owedFiles(root).map((one) => `${one.name}: holds position ${JSON.stringify(one.data.position)} → dropped, the order is arcOrder`);
}

/** Drops `position` from each arc that holds it, keeping every other field and the file's two-space layout, and says which it wrote. */
function dropPosition(root: string): string[] {
  return owedFiles(root).map((one) => {
    const { position, ...rest } = one.data;
    try { writeFileSync(one.file, `${JSON.stringify(rest, null, 2)}\n`, "utf8"); } catch (thrown) {
      return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
    }
    return `${one.name}: dropped position ${JSON.stringify(position)}`;
  });
}

export const migration012: Migration = {
  id: "012",
  version: "0.112.0",
  changed: "An arc no longer carries a position: the Plan table and the status bar follow the arc order and `dependsOn` sets the order of work, " +
    "so each arc's state.json loses the field on this run.",
  check: arcsHoldingPosition,
  script: dropPosition,
};
