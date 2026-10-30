// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc carries its specification, or names the note that holds it · § The approach page keeps up with its arcs · § Open and backlog workstreams follow the standard as it moves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 005, in open and backlog workstreams kept as data: a row 0 that writes `plan.md` and has not landed
// leaves its arc as `row discard` takes a row out (RULE.DEVEX.WORKSPACE.227). A Cycles row current under the stamp
// of its rows is restamped from the arc's goal, title and repositories, and one behind stays behind
// (RULE.DEVEX.WORKSPACE.251). Migration 001 applies first, and `closed/` is never read.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { approachOf, arcIdsOf, arcStamp, isDataLayout, logEvent, readArc, restamped, stampsOn, workstreamsOf, writeArcAsIs } from "../workstream.ts";
import { DONE_STATES, type ArcData, type ArcRow } from "../workstream-schema.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** A row 0 that writes the arc's plan: the step the rules no longer have. */
const PLAN_ROW = /\bwrite\b[^.;]{0,40}\bplan\.md\b/i;

/** Row 0, where it writes the arc's plan and has not landed, been carried or deferred. */
function planRowOf(data: ArcData): ArcRow | null {
  const row = data.rows.find((one) => one.id === "0");
  return row && PLAN_ROW.test(row.title) && !DONE_STATES.has(row.state ?? "waiting") ? row : null;
}

/** The stamp the Cycles row carried before this migration: a hash of the rows' ids and titles. */
function rowsStamp(data: Pick<ArcData, "rows">): string {
  const rows = [...data.rows].map((row) => [row.id, row.title]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 12);
}

type Owed = { ws: string; name: string; data: ArcData; planRow: ArcRow | null; restamp: boolean };

/** Each arc of an open or backlog workstream kept as data that holds a plan row, or a stamp of its rows. */
function owedArcs(root: string): Owed[] {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const page = approachOf(ws);
    const stamps = page ? stampsOn(readFileSync(page, "utf8")) : new Map();
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const data = readArc(ws, arc);
      if (!data || typeof data.title !== "string" || !Array.isArray(data.rows)) return [];
      const stamp = stamps.get(arc)?.stamp ?? null;
      const planRow = planRowOf(data);
      const restamp = stamp !== null && stamp === rowsStamp(data) && stamp !== arcStamp(data);
      return planRow || restamp ? [{ ws, name: `${name}/arcs/${arc}`, data, planRow, restamp }] : [];
    });
  });
}

/** Each arc still in the old shape, with what it is owed. */
export function arcsOwedLean(root: string): string[] {
  return owedArcs(root).map((one) => `${one.name}: ${[
    one.planRow ? "row 0 writes plan.md → discarded" : "",
    one.restamp ? "a stamp of its rows → its goal, title and repositories" : "",
  ].filter(Boolean).join(" · ")}`);
}

/**
 * Takes each plan row out and restamps each current Cycles row, and says what it wrote. An arc whose data fails
 * the schema is left as it is and named, so the check keeps it pending. Run twice, it writes nothing.
 */
function writeAll(root: string): string[] {
  return owedArcs(root).map((one) => {
    const said: string[] = [];
    const { ws, data } = one;
    if (one.planRow) {
      const title = one.planRow.title;
      data.rows = data.rows.filter((row) => row !== one.planRow);
      for (const row of data.rows) if (Array.isArray(row.blockedBy)) row.blockedBy = row.blockedBy.filter((blocker) => blocker !== "0");
      try { writeArcAsIs(ws, data); } catch (thrown) {
        return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
      }
      logEvent(ws, data.arc, "discarded", "0", `plugin migration 005: no row writes a plan (RULE.DEVEX.WORKSPACE.227) · the row read: ${title}`);
      said.push("row 0 discarded");
    }
    if (one.restamp) {
      const page = approachOf(ws)!;
      const value = arcStamp(data);
      const next = restamped(readFileSync(page, "utf8"), data.arc, value);
      if (next !== null) {
        writeFileSync(page, next, "utf8");
        logEvent(ws, data.arc, "stamped", null, value);
        said.push(`restamped ${value}`);
      }
    }
    return `${one.name}: ${said.join(" · ")}`;
  });
}

export const migration005: Migration = {
  id: "005",
  version: "0.67.0",
  changed: "An arc grows by rows and the approach page follows what it states about the arc: a row 0 that writes `plan.md` and has " +
    "not landed leaves its arc, because a plan is optional and no row writes one, and each Cycles row's stamp becomes a hash of " +
    "the arc's goal, title and repositories, so adding a row never puts the page behind.",
  check: arcsOwedLean,
  script: writeAll,
};
