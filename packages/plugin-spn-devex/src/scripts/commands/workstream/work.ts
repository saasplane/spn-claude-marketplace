// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A step row says where, what work, and how
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream work write
//
// A row, an entry and a go part name their kind of work in `work`; a record written before that held `altitude` or `pass`
// (`BASELINE` and `FULL_RUN` becoming `TEST`). A reader renames an old record when it first reads it; this command does the
// same for every open workstream at once, for a tidy start. Each arc that changed leaves one `work` line in its `log.jsonl`.
// A backlog or closed workstream is left as it is: a closed one is history, and a backlog one is renamed when it opens.

import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { arcDataDir, arcIdsOf, logEvent, readJson, stateFileOf, sheetFileOf, workspaceOf, workstreamsOf, writeWhole } from "../../lib/workstream.ts";
import { renameDataToWork } from "../../lib/workstream-schema.ts";

export const describe = "rename altitude and pass to work in every open workstream's rows, entries and go parts";

/** The arc's three data files that can hold an old record: its rows, its sheet's entries and its go plan's parts. */
const filesOf = (ws: string, arc: string): string[] => [stateFileOf(ws, arc), sheetFileOf(ws, arc), join(arcDataDir(ws, arc), "go.json")];

/** Renames one arc's files in place; the count of records renamed, with the log line written where it is above zero. */
function renameArc(ws: string, arc: string): number {
  let count = 0;
  for (const file of filesOf(ws, arc)) {
    if (!existsSync(file)) continue;
    const data = readJson(file);
    const renamed = renameDataToWork(data);
    if (renamed > 0) { writeWhole(file, `${JSON.stringify(data, null, 2)}\n`); count += renamed; }
  }
  if (count > 0) logEvent(ws, arc, "work", null, `altitude and pass renamed to work · ${count} record${count === 1 ? "" : "s"}`);
  return count;
}

function write(args: string[]): number {
  const words = readWords(args);
  if (words.paths.length) throw new UsageFault("takes no target: it renames every open workstream.");
  const root = workspaceOf();
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  let records = 0, arcs = 0;
  for (const ws of workstreamsOf(root, ["open"])) {
    for (const arc of arcIdsOf(ws)) {
      const count = renameArc(ws, arc);
      if (count > 0) { records += count; arcs += 1; console.log(`${basename(ws)} ${arc}: ${count} record${count === 1 ? "" : "s"} renamed to work`); }
    }
  }
  console.log(records ? `${records} record${records === 1 ? "" : "s"} renamed to work in ${arcs} arc${arcs === 1 ? "" : "s"}` : "no open workstream holds altitude or pass");
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "rename altitude and pass to work in every open workstream, one log line for each arc", usage: "", run: write },
};
