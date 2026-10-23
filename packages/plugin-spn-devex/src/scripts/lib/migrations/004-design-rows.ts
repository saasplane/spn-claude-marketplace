// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status says which of eight states it is in · § The formats · § Open and backlog workstreams follow the standard as it moves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 004: every row of every arc at PROPOSED, in open and backlog workstreams kept as data, takes the kind
// `design` (RD.DEVEX.WORKSPACE.278), as the command gives it to a row added from now on. Nothing else in the arc
// changes, and an arc past PROPOSED keeps its kinds. A workstream still keeping its arcs as Markdown is migration
// 001's, which applies first, and `closed/` is never read.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { arcIdsOf, isDataLayout, readArc, workstreamsOf, writeArc } from "../workstream.ts";
import { DESIGN_KIND, type ArcData } from "../workstream-schema.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** Each arc at PROPOSED in an open or backlog workstream kept as data, with the rows of it that are not design. */
function proposedArcs(root: string): Array<{ ws: string; name: string; data: ArcData; owed: number }> {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const data = readArc(ws, arc);
      if (!data || data.status !== "PROPOSED" || !Array.isArray(data.rows)) return [];
      const owed = data.rows.filter((row) => row.kind !== DESIGN_KIND).length;
      return owed ? [{ ws, name: `${name}/arcs/${arc}`, data, owed }] : [];
    });
  });
}

/** Each arc at PROPOSED whose rows are not all design, by the count of them. */
export function proposedRowsNotDesign(root: string): string[] {
  return proposedArcs(root).map((one) => `${one.name}: ${one.owed} row(s) at PROPOSED not design → design`);
}

/**
 * Gives every row of each such arc the kind design, and says which arcs it wrote. An arc whose data fails the
 * schema is left as it is and named, so the check keeps it pending. Run twice, it writes nothing.
 */
function writeAll(root: string): string[] {
  return proposedArcs(root).map((one) => {
    for (const row of one.data.rows) row.kind = DESIGN_KIND;
    try { writeArc(one.ws, one.data); } catch (thrown) {
      return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
    }
    return `${one.name}: ${one.owed} row(s) given the kind design`;
  });
}

export const migration004: Migration = {
  id: "004",
  version: "0.62.0",
  changed: "An arc's design rows run under `PROPOSED`, and only the developer's go moves it: every row of an arc at `PROPOSED` " +
    "takes the kind `design`, which the command gives every row added while its arc is `PROPOSED`, so the progress bar counts " +
    "build rows only and the state check no longer names a `PROPOSED` arc for its design work.",
  check: proposedRowsNotDesign,
  script: writeAll,
};
