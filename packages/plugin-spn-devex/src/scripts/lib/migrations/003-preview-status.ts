// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Open and backlog workstreams follow the standard as it moves
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 003: every preview of an arc kept as data, in open and backlog workstreams, shows the arc's status in
// its header (RD.DEVEX.WORKSPACE.266), written by the same writer every `workstream` write calls. A workstream
// still keeping its arcs as Markdown is migration 001's, which applies first, and `closed/` is never read.

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { isFile } from "../payload.ts";
import { arcIdsOf, isDataLayout, previewOf, previewWithStatus, readArc, workstreamsOf, writePreviewStatus } from "../workstream.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** Each preview of an arc kept as data in an open or backlog workstream whose header does not show the arc's status as the commands write it. */
export function previewsWithoutStatus(root: string): string[] {
  const out: string[] = [];
  for (const ws of workstreamsOf(root).filter(isDataLayout)) {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    for (const arc of arcIdsOf(ws)) {
      const data = readArc(ws, arc);
      const path = previewOf(ws, arc);
      if (!data || typeof data.status !== "string" || !isFile(path)) continue;
      const text = readFileSync(path, "utf8");
      if (previewWithStatus(text, arc, data.status) !== text)
        out.push(`${name}/notes/${arc}/preview.html: its header does not show the arc's status → the arc's commands write it`);
    }
  }
  return out;
}

/** Writes the arc's status into each preview the check names, and says which it wrote. */
function writeAll(root: string): string[] {
  return workstreamsOf(root).filter(isDataLayout).flatMap((ws) => {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    return writePreviewStatus(ws).map((preview) => `${name}/${preview}: wrote the arc's status`);
  });
}

export const migration003: Migration = {
  id: "003",
  version: "0.43.0",
  changed: "A preview's header shows one status, labelled Status: the arc's, `PROPOSED` until the design is decided and then " +
    "the arc's own status, as a badge linking the arc's row on the approach page, which the arc's commands write from `state.json`.",
  check: previewsWithoutStatus,
  script: writeAll,
};
