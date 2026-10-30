// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status is one of six, stored or worked out · § The formats · § Open and backlog workstreams follow the standard as it moves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 004: rows that were design work take the kind `design` (RULE.DEVEX.WORKSPACE.278), as the command gives it
// to a row added from now on, in open and backlog workstreams kept as data. That is every row of an arc at PROPOSED,
// and every row of any other arc that landed while it read PROPOSED, before it first left PROPOSED, read from the
// arc's log; an arc whose log shows no move out of PROPOSED keeps its kinds. Nothing else in an arc changes. A workstream still keeping
// its arcs as Markdown is migration 001's, which applies first, and `closed/` is never read.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { arcIdsOf, isDataLayout, landedLines, logLinesOf, readArc, statusMoves, workstreamsOf, writeArcAsIs } from "../workstream.ts";
import { type ArcData, type ArcRow } from "../workstream-schema.ts";

/** The kind this migration gave, which version 1 of the data held; migration 006 takes it out. */
const DESIGN_KIND = "design";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/**
 * The rows of an arc owed the kind design and not holding it: every row while the arc is PROPOSED; else each row
 * whose landing the log places before the arc's first move out of PROPOSED, while it read PROPOSED, and none where
 * the log shows no such move.
 */
function owedRows(ws: string, data: ArcData): ArcRow[] {
  if (data.status === "PROPOSED") return data.rows.filter((row) => row.kind !== DESIGN_KIND);
  const lines = logLinesOf(ws, data.arc);
  const { outOfProposed: out, firstProposed } = statusMoves(lines);
  if (out === null) return [];
  // Only while the arc read PROPOSED: a row an arc opened past PROPOSED built before it was ever reopened stays build.
  const from = firstProposed ?? -1;
  const landedAt = landedLines(data, lines);
  return data.rows.filter((row) => row.kind !== DESIGN_KIND && row.state === "landed" && landedAt.has(row.id)
    && landedAt.get(row.id)! > from && landedAt.get(row.id)! < out);
}

/** Each arc in an open or backlog workstream kept as data with rows owed the kind design, and those rows. */
function owedArcs(root: string): Array<{ ws: string; name: string; data: ArcData; owed: ArcRow[] }> {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const data = readArc(ws, arc);
      if (!data || typeof data.status !== "string" || !Array.isArray(data.rows)) return [];
      const owed = owedRows(ws, data);
      return owed.length ? [{ ws, name: `${name}/arcs/${arc}`, data, owed }] : [];
    });
  });
}

const why = (data: ArcData): string => (data.status === "PROPOSED" ? "at PROPOSED" : "landed before the go");

/** Each arc with rows owed the kind design, by the count of them and why. */
export function rowsOwedDesign(root: string): string[] {
  return owedArcs(root).map((one) => `${one.name}: ${one.owed.length} row(s) ${why(one.data)} not design → design`);
}

/**
 * Gives each owed row the kind design, and says which arcs it wrote. An arc whose data fails the schema is left as
 * it is and named, so the check keeps it pending. Run twice, it writes nothing.
 */
function writeAll(root: string): string[] {
  return owedArcs(root).map((one) => {
    for (const row of one.owed) row.kind = DESIGN_KIND;
    try { writeArcAsIs(one.ws, one.data); } catch (thrown) {
      return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
    }
    return `${one.name}: ${one.owed.length} row(s) ${why(one.data)} given the kind design (${one.owed.map((row) => row.id).join(", ")})`;
  });
}

export const migration004: Migration = {
  id: "004",
  version: "0.62.0",
  changed: "An arc's design rows run under `PROPOSED`, and only the developer's go moves it: every row of an arc at `PROPOSED`, " +
    "and every row of another arc that landed while it read `PROPOSED`, before its first go, takes the kind `design`, which the command " +
    "gives every row added while its arc is `PROPOSED`, so the progress bar counts build rows only and the state check no " +
    "longer names an arc for its design work.",
  check: rowsOwedDesign,
  script: writeAll,
};
