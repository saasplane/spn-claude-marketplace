// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A review's findings and the developer's corrections are records
//           docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The agent loads what the work needs
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream correction write <workstream>/<arc> --said "…" --answered-by book|code|review|none --ref <file[:line]> --work <kind>
//
// A correction the developer makes on something the book, the code or a saved review already answered is one line on the arc's log.
// The command prints the work map's row, or the reference, that should have held the answer, so the agent amends it in the same work.
// `none` records a decision nothing had answered, and does not count.

import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { arcIdsOf, logEvent, logLinesOf } from "../../lib/workstream.ts";
import { ANSWERED_BY, CORRECTION_KIND, type LogLine } from "../../lib/workstream-schema.ts";
import { mapRows, rowOf } from "../../lib/work-map.ts";
import { arcNamed } from "./_shared.ts";

export const describe = "a correction the developer made on something already answered, logged and counted";

/** The corrections an arc's log holds, counted by what answered each; `none` is listed and does not count. */
export type Corrections = { total: number; book: number; code: number; review: number; none: number };

/** The corrections of every arc of a workstream. */
export function correctionsOf(ws: string): Corrections {
  const out: Corrections = { total: 0, book: 0, code: 0, review: 0, none: 0 };
  for (const arc of arcIdsOf(ws))
    for (const line of logLinesOf(ws, arc) as LogLine[]) {
      if (line?.kind !== CORRECTION_KIND) continue;
      const by = String(line.answeredBy) as keyof Omit<Corrections, "total">;
      if (!(by in out)) continue;
      out[by] += 1;
      if (by !== "none") out.total += 1;
    }
  return out;
}

function write(args: string[]): number {
  const words = readWords(args, { said: VALUE, "answered-by": ANSWERED_BY, ref: VALUE, work: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one arc: `correction write <workstream>/<arc> --said \"…\" --answered-by book|code|review|none --ref <file[:line]> --work <kind>`.");
  const { ws, arc } = arcNamed(words.paths[0]);
  const said = words.value("said");
  const by = words.value("answered-by");
  const ref = words.value("ref");
  const work = words.value("work");
  if (!said?.trim() || !by || !ref?.trim() || !work?.trim()) throw new UsageFault("needs `--said`, `--answered-by`, `--ref` and `--work`: what you said, what answered it, the file and line, and the kind of work.");
  const rows = mapRows();
  const row = rowOf(rows, work);
  if (!row) throw new UsageFault(`finds no kind of work \`${work}\` in the work map: ${rows.map((one) => one.work).join(", ")}.`);
  logEvent(ws, arc, CORRECTION_KIND, null, said, { answeredBy: by, ref, work });
  const counts = correctionsOf(ws);
  if (by === "none") console.log("logged · decided by nothing written · does not count");
  else {
    console.log(`logged · answered by the ${by} · counts as 1 (${counts.total} for the workstream)`);
    console.log(`amend now: refs/devex/agent/work-map.md row ${row.work} (Learned), or the reference that restates ${ref}`);
  }
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "log a correction you made on something already answered, and print the map row or reference to amend", usage: "<workstream>/<arc> --said \"…\" --answered-by book|code|review|none --ref <file[:line]> --work <kind>", run: write },
};
