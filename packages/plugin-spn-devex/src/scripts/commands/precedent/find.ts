// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The agent loads what the work needs
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex precedent find "<subject>" [--work <kind>] [--code] [--json]
//
// What is already decided, written or built for a subject, for any task: the work's row of the map first, then the matches by kind,
// each with its file and line. It reads the registers, the rules index, every plugin's references, the answered cards of every
// workstream and the shared contract types; with `--code` it also reads the exported names under every contract. It writes nothing
// and never refuses: a subject nothing speaks to prints that.

import { VALUE, FLAG, readWords, UsageFault } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { lookup, precedentLine, KINDS } from "../../lib/precedent.ts";
import { mapRows, resolvedRow, rowOf } from "../../lib/work-map.ts";
import { workspaceOf } from "../../lib/workstream.ts";

export const describe = "what is already decided, written or built for a subject: the work's row first, then the matches by kind with file and line";
export const usage = "\"<subject>\" [--work <kind>] [--code] [--json]";

/** How many matches of each kind a lookup prints before it says how many more there are. */
const PER_KIND = 5;

export function run(args: string[]): number {
  const words = readWords(args, { work: VALUE, code: FLAG, json: FLAG });
  const subject = words.paths.join(" ").trim();
  if (!subject) throw new UsageFault("takes a subject: `precedent find \"<subject>\" [--work <kind>] [--code]`.");
  const root = workspaceOf();
  const found = lookup(root, subject, { code: words.given("code") });
  const kind = words.value("work");
  const rows = mapRows();
  const row = kind ? rowOf(rows, kind) : null;
  if (kind && !row) throw new UsageFault(`finds no kind of work \`${kind}\` in the work map: ${rows.map((one) => one.work).join(", ")}.`);
  if (words.given("json")) {
    console.log(JSON.stringify({ subject, work: row, matches: found }, null, 2));
    return 0;
  }
  if (row) {
    const { found: refs, missing } = resolvedRow(row, { checkout: root });
    console.log(`work: ${row.work} · skill ${row.skill || "none"}`);
    for (const ref of refs) console.log(`  read ${ref.file}`);
    for (const ref of missing) console.log(`  read ${ref.text} (not found here)`);
    if (row.lookIn) console.log(`  look in ${row.lookIn}`);
    if (row.learned) console.log(`  learned ${row.learned}`);
  }
  if (!found.length) { console.log(`nothing speaks to "${subject}".`); return 0; }
  for (const kindName of KINDS) {
    const some = found.filter((one) => one.kind === kindName);
    if (!some.length) continue;
    console.log(`${kindName} (${some.length}):`);
    for (const one of some.slice(0, PER_KIND)) console.log(precedentLine(one));
    if (some.length > PER_KIND) console.log(`  and ${some.length - PER_KIND} more`);
  }
  return 0;
}
