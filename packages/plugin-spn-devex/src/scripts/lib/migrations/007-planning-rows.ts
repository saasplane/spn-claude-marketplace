// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The agent's steps carry their own states
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 007: a planning job is never a step (RULE.DEVEX.WORKSPACE.278). On a decided arc whose build steps have not
// started, a row that landed ahead of them, whose kind is `question` or whose title names the arc's preview, leaves the
// arc's steps and becomes one line on its log, so the arc reads `DECIDED`. `closed/` is never read.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { PREVIEW_FILE, arcIdsOf, isDataLayout, logEvent, readArc, workstreamsOf, writeArc } from "../workstream.ts";
import { type ArcData, type ArcRow, parentIds } from "../workstream-schema.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** The step states that say a build step has started. */
const STARTED: ReadonlySet<string> = new Set(["running", "stopped", "replaced", "landed"]);

/** Whether a row is a planning job: a question, or a row whose title names the arc's preview. */
function isPlanning(data: ArcData, row: ArcRow): boolean {
  if (row.kind === "question") return true;
  const named = [data.preview, `notes/${data.arc}/${PREVIEW_FILE}`].filter((path): path is string => typeof path === "string" && path.includes("/"));
  return named.some((path) => row.title.includes(path));
}

type Owed = { ws: string; name: string; data: ArcData; rows: ArcRow[] };

/**
 * Each leaf row of a decided arc that landed as a planning job ahead of its build: none where the arc is not
 * `DECIDED`, and none where a build step has started, since the arc then reads `RUNNING` or `LANDED` by its own steps.
 */
function planningRows(data: ArcData): ArcRow[] {
  if (data.status !== "DECIDED") return [];
  const parents = parentIds(data.rows);
  const leaves = data.rows.filter((row) => !parents.has(row.id));
  const planning = leaves.filter((row) => row.state === "landed" && isPlanning(data, row));
  const build = leaves.filter((row) => !planning.includes(row));
  return build.some((row) => STARTED.has(row.state ?? "")) ? [] : planning;
}

/** Each arc of an open or backlog workstream kept as data that holds such a row. */
function owedArcs(root: string): Owed[] {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const data = readArc(ws, arc);
      if (!data || typeof data.title !== "string" || !Array.isArray(data.rows)) return [];
      const rows = planningRows(data);
      return rows.length ? [{ ws, name: `${name}/arcs/${arc}`, data, rows }] : [];
    });
  });
}

/** Each arc still holding a planning row among its steps, with the rows that leave. */
export function arcsOwedPlanningRows(root: string): string[] {
  return owedArcs(root).map((one) => `${one.name}: row${one.rows.length === 1 ? "" : "s"} ${one.rows.map((row) => row.id).join(", ")} landed as planning → one line on the log`);
}

/**
 * Takes each planning row out of its arc's steps and writes one line on the log for it, and says what it wrote. An arc
 * the schema refuses is left as it is and named, so the check keeps it pending. Run twice, it writes nothing.
 */
function writeAll(root: string): string[] {
  return owedArcs(root).map((one) => {
    const { ws, data, rows } = one;
    const leaving = new Set(rows.map((row) => row.id));
    const next: ArcData = { ...data, rows: data.rows.filter((row) => !leaving.has(row.id)).map((row) =>
      Array.isArray(row.blockedBy) ? { ...row, blockedBy: row.blockedBy.filter((blocker) => !leaving.has(blocker)) } : row) };
    try { writeArc(ws, next); } catch (thrown) {
      return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
    }
    for (const row of rows)
      logEvent(ws, data.arc, "discarded", row.id, `plugin migration 007: a planning job is never a step (RULE.DEVEX.WORKSPACE.278) · the row read: ${row.title}`);
    return `${one.name}: ${rows.map((row) => `row ${row.id}`).join(", ")} → the log`;
  });
}

export const migration007: Migration = {
  id: "007",
  version: "0.69.0",
  changed: "A planning job is never a step: a landed question row, or one naming the arc's preview, leaves a decided arc's steps for one line on its log, so the arc reads `DECIDED`.",
  check: arcsOwedPlanningRows,
  script: writeAll,
};
