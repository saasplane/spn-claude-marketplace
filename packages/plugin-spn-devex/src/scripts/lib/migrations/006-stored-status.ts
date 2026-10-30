// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status is one of six, stored or worked out · § The agent's steps carry their own states · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 006: each arc of an open or backlog workstream kept as data comes to `schemaVersion` 2
// (RULE.DEVEX.WORKSPACE.307). `HELD` becomes `DECIDED` with its reason kept as the wait; `RUNNING` and `PART-LANDED`
// become `DECIDED`, which the steps work out as `RUNNING`. Every design row becomes a `change`, a step written before
// the go that starts at it; `closed/` is never read.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { arcIdsOf, arcStatus, isDataLayout, logEvent, readArc, workstreamsOf, writeArc } from "../workstream.ts";
import { SCHEMA_VERSION, type ArcData } from "../workstream-schema.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** The kind version 1 gave to a row added while its arc was `PROPOSED`. */
const DESIGN_KIND = "design";
/** The statuses version 1 stored that version 2 works out, or keeps as a wait. */
const WORKED_OUT: ReadonlySet<string> = new Set(["RUNNING", "PART-LANDED", "HELD"]);

/** Each step of the brought-over data, and what changed, in a line each; nothing where the arc is at version 2. */
function brought(data: ArcData): { next: ArcData; said: string[] } | null {
  const designRows = data.rows.filter((row) => row.kind === DESIGN_KIND);
  if (data.schemaVersion === SCHEMA_VERSION && !designRows.length && !WORKED_OUT.has(data.status)) return null;
  const said: string[] = [];
  const next: ArcData = { ...data, schemaVersion: SCHEMA_VERSION, rows: data.rows.map((row) => ({ ...row })) };
  if (data.status === "HELD") {
    next.status = "DECIDED";
    next.wait = data.reason ?? "held";
    next.reason = null;
    said.push(`HELD → DECIDED, its reason kept as the wait`);
  } else if (data.status === "RUNNING" || data.status === "PART-LANDED") {
    next.status = "DECIDED";
    said.push(`${data.status} → DECIDED, which the steps work out as ${arcStatus({ ...next, status: "DECIDED" })}`);
  }
  // A STEP MAY BE WRITTEN BEFORE THE GO (RULE.DEVEX.WORKSPACE.278), and version 1 gave the design kind to every row
  // added while its arc was `PROPOSED`, the build steps among them. So no row leaves: each is a `change`, and none of
  // them starts until the go.
  for (const row of next.rows) if (row.kind === DESIGN_KIND) row.kind = "change";
  if (designRows.length) said.push(`${designRows.length} design row(s) became change`);
  if (data.schemaVersion !== SCHEMA_VERSION) said.push(`version ${String(data.schemaVersion)} → ${SCHEMA_VERSION}`);
  return { next, said };
}

type Owed = { ws: string; name: string; data: ArcData };

/** Each arc of an open or backlog workstream kept as data that is not at version 2. */
function owedArcs(root: string): Owed[] {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return arcIdsOf(ws).flatMap((arc) => {
      const data = readArc(ws, arc);
      if (!data || typeof data.status !== "string" || !Array.isArray(data.rows)) return [];
      return brought(data) ? [{ ws, name: `${name}/arcs/${arc}`, data }] : [];
    });
  });
}

/** Each arc still at version 1, with what bringing it over changes. */
export function arcsOwedVersionTwo(root: string): string[] {
  return owedArcs(root).map((one) => `${one.name}: ${brought(one.data)!.said.join(" · ")}`);
}

/**
 * Brings each arc to version 2, and says what it wrote. An arc the version 2 schema refuses is left as it is and
 * named, so the check keeps it pending. Run twice, it writes nothing.
 */
function writeAll(root: string): string[] {
  return owedArcs(root).map((one) => {
    const { next, said } = brought(one.data)!;
    try { writeArc(one.ws, next); } catch (thrown) {
      return `${one.name}: not written — ${thrown instanceof Error ? thrown.message : String(thrown)}`;
    }
    if (one.data.status !== next.status)
      logEvent(one.ws, next.arc, "status", null, `${one.data.status} → ${next.status} · plugin migration 006${next.wait ? ` · wait: ${next.wait}` : ""}`);
    return `${one.name}: ${said.join(" · ")}`;
  });
}

export const migration006: Migration = {
  id: "006",
  version: "0.67.0",
  changed: "An arc's state is version 2: its status is the developer's words, `PROPOSED`, `DECIDED` with any wait, `CARRIED` " +
    "or `DROPPED`, and `RUNNING` and `LANDED` are worked out from the steps, so `HELD` becomes `DECIDED` with its reason as " +
    "the wait, `RUNNING` and `PART-LANDED` become `DECIDED`, and the design kind goes: every design row becomes a `change`, " +
    "a step written before the go that starts only at it.",
  check: arcsOwedVersionTwo,
  script: writeAll,
};
