// How the devex plugin asks the plugin that serves a world for its passes. Each world's plugin declares them in a ref, a table read
// by its header names, resolved by plugin and path with the mechanism the plugins already share (`work-map.ts`). No world or stack
// name is decided here: a new stack brings a ref and the plan needs no change.

import { readFileSync } from "node:fs";
import { findUnder, refRoots, tableRowsOf, type Places } from "./work-map.ts";

/** One declared pass: what it holds, how it is proved, the passes it follows, what it runs with and what it waits on outside the plan. */
export type Pass = { id: string; title: string; kinds: string[]; proof: string; after: string[]; runsWith: string | null; waitsOn: string | null };

/** The header every pass table carries, read by name and never by position. */
export const PASS_HEADER = "| Pass | World | Holds | Proof | After | Runs with | Waits on |";

/** The places each world's passes are declared: the plugin that serves it and the ref's path under that plugin's refs. */
const WORLD_REF = { plugin: "devex", path: "devex/workspace/passes.md" };
const INFRA_REF = { plugin: "infra", path: "support/infra/passes.md" };
const DESIGN_REF = { plugin: "surface", path: "support/surface/passes.md" };

const listOf = (cell: string | undefined): string[] => (cell ?? "").split(/\s+·\s+/).map((one) => one.trim()).filter(Boolean);
const textOf = (cell: string | undefined): string | null => (cell && cell.trim() ? cell.trim() : null);

/** The rows of a pass table in one ref, or null where no install and no checkout holds it. */
function readTable(ref: { plugin: string; path: string }, places?: Places, world?: string | null): Pass[] | null {
  for (const dir of refRoots(ref.plugin, places)) {
    const file = findUnder(dir, ref.path);
    if (!file) continue;
    // The declaration is the table headed exactly PASS_HEADER; a chapter restated beside it may hold a table of its own that also starts `| Pass |`.
    const text = readFileSync(file, "utf8");
    const at = text.indexOf(PASS_HEADER);
    return tableRowsOf(at < 0 ? "" : text.slice(at), "Pass").filter((row) => row.pass && (world === undefined || row.world === world)).map((row) => ({
      id: row.pass.replace(/`/g, "").toLowerCase().replace(/\s+/g, "-"), title: row.pass.replace(/`/g, ""), kinds: listOf(row.holds), proof: row.proof ?? "",
      after: listOf(row.after).map((one) => one.replace(/`/g, "").toLowerCase()), runsWith: textOf(row["runs with"]), waitsOn: textOf(row["waits on"]),
    }));
  }
  return null;
}

/** The ref a world's passes are declared in, or null for a world or stack no plugin serves. */
function refOfWorld(world: string | null, stack: string | null): { plugin: string; path: string } | null {
  if (world === "FOUNDATION" || world === "GENERAL") return WORLD_REF;
  if (world === "INFRA") return INFRA_REF;
  if (world === "APPS" && stack) return { plugin: "apps", path: `support/apps/providers/${stack.toLowerCase()}/03-structure.md` };
  return null;
}

/**
 * The passes of a repository's world (the rows whose `World` cell names it), in the table's order: FOUNDATION and GENERAL from the devex plugin, APPS from the apps plugin's
 * restate of the stack's structure chapter, INFRA from the infra plugin. Returns `[]` where no plugin carries a ref for the world
 * (a stack with no provider); `passFindingOf` says why, and the plan reports it and never fills in a default list.
 */
export function passTableOf(world: string | null, stack: string | null, places?: Places): Pass[] {
  const ref = refOfWorld(world, stack);
  return ref ? (readTable(ref, places, world) ?? []) : [];
}

/** Why `passTableOf` returned `[]` for a world, or null where it returned passes. */
export function passFindingOf(world: string | null, stack: string | null, places?: Places): string | null {
  const ref = refOfWorld(world, stack);
  if (!ref) return world === "APPS" ? "an APPS repository declares no stack" : `no plugin declares passes for the world ${String(world)}`;
  const passes = readTable(ref, places, world);
  if (!passes) return `no plugin carries ${ref.path} for ${String(world)}${stack ? ` (${stack})` : ""}`;
  return passes.length ? null : `${ref.path} holds no row of the world ${String(world)} in a table headed ${PASS_HEADER}`;
}

/** The design track the surface plugin declares: `draw` after the book beside the code passes, `publish` waiting on the full run. `[]` where the ref is not there. */
export function designTrackOf(places?: Places): Pass[] {
  return readTable(DESIGN_REF, places) ?? [];
}
