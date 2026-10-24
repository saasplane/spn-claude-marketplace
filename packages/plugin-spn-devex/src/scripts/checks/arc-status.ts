// RESTATES: spn-foundation RD.DEVEX.WORKSPACE.058 — an arc carries a status, and it is one of a closed set.
// The register row is the source of truth. A rule change is edited there first, then here.
//
// THE SET, STATED ONCE IN THE PLUGIN. Every check that reads an arc reads this word, so the schema
// (`lib/workstream-schema.ts`) takes its statuses from here: `workstream row write --status` refuses a
// word outside them, and `workstream state check` names a `state.json` that holds one. No write guard
// is needed beside them, because the owner check refuses a hand write into `arcs/` (`workstream-owner.ts`).

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The set, in the order the register states it. The last three are terminal. */
export const STATUSES = ["PROPOSED", "DECIDED", "RUNNING", "HELD", "PART-LANDED", "LANDED", "CARRIED", "DROPPED"] as const;
export const TERMINAL = new Set(["LANDED", "CARRIED", "DROPPED"]);

/**
 * Whether a status is past `DECIDED` in the order of the set. A workstream's page reads `PLANNING`
 * while none of its arcs is, and `IMPLEMENTING` once one is. A word outside the set is past nothing.
 */
export function pastDecided(status: string | null): boolean {
  const order = STATUSES as readonly string[];
  return status !== null && order.indexOf(status) > order.indexOf("DECIDED");
}

/**
 * The status an arc kept as data holds in `arcs/<arc>/state.json` (01-workstream.md § The formats), or
 * null where the file is absent, does not parse, or holds a word outside the set. The schema refuses
 * such a word before it is written, so null here is an arc with no data.
 */
export function statusOfData(arcsDir: string, arc: string): string | null {
  try {
    const status = (JSON.parse(readFileSync(join(arcsDir, arc, "state.json"), "utf8")) as { status?: unknown }).status;
    return typeof status === "string" && (STATUSES as readonly string[]).includes(status) ? status : null;
  } catch { return null; }
}
