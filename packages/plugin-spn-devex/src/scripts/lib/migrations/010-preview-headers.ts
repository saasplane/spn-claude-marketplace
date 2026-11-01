// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Open and backlog workstreams follow the standard as it moves
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 010: every preview of an arc, in an open or backlog workstream, whose header is not what the arc's commands write is
// rewritten by that same writer. WHY IT EXISTS: a release that adds a fact to the preview header (Progress was one) changes what the
// writer produces, so every preview held in an open or backlog workstream is behind it at once; with this migration the release
// rewrites them all, and no other window's state check fails on a header the new plugin would write differently.
//
// It is migration 003's check and migration 003's script, run again: 003 wrote the header's status, and this keeps the whole header
// current. `closed/` is never read: a closed workstream stays as it closed.

import { type Migration } from "../migration.ts";
import { previewsWithoutStatus, writeAll } from "./003-preview-status.ts";

export const migration010: Migration = {
  id: "010",
  version: "0.105.0",
  changed: "A preview of an open or backlog workstream is rewritten to the header the arc's commands write now, so a release that adds a fact to the header " +
    "brings every held preview with it.",
  check: previewsWithoutStatus,
  script: writeAll,
};
