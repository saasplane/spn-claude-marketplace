// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A suggestion is recorded the moment it is raised
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream suggestion write <workstream> --title "…"                       raise the next one
//   spn-devex workstream suggestion write <workstream> <sN> [--state …] [--preview …] [--words "…"] [--title …]

import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readJsonl, suggestionsFileOf, writeJsonl } from "../../lib/workstream.ts";
import { SUGGESTION_ID, SUGGESTION_STATES, suggestionFaults, type Suggestion } from "../../lib/workstream-schema.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "a suggestion, raised the moment it is raised and moved on as it is shaped, decided, parked or dropped";

function write(args: string[]): number {
  const words = readWords(args, { title: VALUE, state: SUGGESTION_STATES, preview: VALUE, words: VALUE });
  const [ref, id, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes a workstream and at most one suggestion.");
  const ws = workstreamNamed(ref);
  const file = suggestionsFileOf(ws);
  const records = readJsonl(file).filter((line): line is Suggestion => !!line && typeof line === "object");
  let record: Suggestion;
  if (id === undefined) {
    const title = words.value("title");
    if (!title) throw new UsageFault("raises a suggestion with `--title \"…\"`.");
    const next = Math.max(0, ...records.map((one) => Number(/^s(\d+)$/.exec(one.id)?.[1] ?? 0))) + 1;
    record = { id: `s${next}`, title, state: words.value("state") ?? "raised", preview: words.value("preview"), words: words.value("words") };
    records.push(record);
  } else {
    if (!SUGGESTION_ID.test(id)) throw new UsageFault(`reads \`${id}\` as no suggestion — a suggestion is \`s<n>\`.`);
    const found = records.find((one) => one.id === id);
    if (!found) throw new UsageFault(`finds no ${id} in this workstream.`);
    record = found;
    for (const name of ["title", "state", "preview", "words"] as const) {
      const value = words.value(name);
      if (value !== null) record[name] = value;
    }
  }
  const faults = suggestionFaults(record, record.id);
  if (faults.length) throw new UsageFault(`${faults.join("; ")}.`);
  writeJsonl(file, records);
  console.log(`${record.id} · ${record.state}`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "raise a suggestion, or move it on", usage: "<workstream> [<sN>] [--title …] [--state …] [--preview …] [--words …]", run: write },
};
