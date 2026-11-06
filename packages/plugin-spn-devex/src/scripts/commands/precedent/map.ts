// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The agent loads what the work needs
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex precedent map [<kind>] [--json]
//
// The work map's kinds of work, or one row with each reference resolved to an absolute path, so an order's Read first line is filled by a
// command and never typed. A reference that resolves to nothing is named as not found here. It writes nothing.

import { FLAG, readWords, UsageFault } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { mapRows, resolvedRow, rowOf } from "../../lib/work-map.ts";
import { workspaceOf } from "../../lib/workstream.ts";

export const describe = "the work map's kinds of work, or one row with its references resolved to absolute paths";
export const usage = "[<kind>] [--json]";

export function run(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length > 1) throw new UsageFault("takes one kind of work, or none to list them.");
  const rows = mapRows();
  const kind = words.paths[0];
  if (!kind) {
    if (words.given("json")) console.log(JSON.stringify(rows.map((row) => ({ work: row.work, skill: row.skill || null })), null, 2));
    else for (const row of rows) console.log(`${row.work} · skill ${row.skill || "none"}`);
    return 0;
  }
  const row = rowOf(rows, kind);
  if (!row) throw new UsageFault(`finds no kind of work \`${kind}\` in the work map: ${rows.map((one) => one.work).join(", ")}.`);
  const { found, missing } = resolvedRow(row, { checkout: workspaceOf() });
  if (words.given("json")) {
    console.log(JSON.stringify({ ...row, found: found.map((ref) => ref.file), missing: missing.map((ref) => ref.text) }, null, 2));
    return 0;
  }
  console.log(`work: ${row.work} · skill ${row.skill || "none"}`);
  for (const ref of found) console.log(`  read ${ref.file}`);
  for (const ref of missing) console.log(`  read ${ref.text} (not found here)`);
  if (row.lookIn) console.log(`  look in ${row.lookIn}`);
  if (row.learned) console.log(`  learned ${row.learned}`);
  return 0;
}
