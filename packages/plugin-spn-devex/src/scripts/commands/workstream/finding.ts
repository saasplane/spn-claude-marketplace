// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A review's findings and the developer's corrections are records
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream finding write <workstream>/<arc> --file findings.json         save a review's findings as open records
//   spn-devex workstream finding decide <workstream>/<arc> F<n> --carried E31,E35       answer it with sheet entries that exist
//                                                                 --decided Q12         ... or a card that exists
//                                                                 --dropped "<reason>"  ... or drop it with a reason
//   spn-devex workstream finding show <workstream>/<arc> [--open] [--json]               print them
//
// Each finding of a saved review is a record in `arcs/<arc>/findings.jsonl` that must be carried into a sheet entry, decided on a
// card or dropped with a reason before the proposal is shown. This is the workstream's own bookkeeping and reads no code.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { findingsFileOf, logEvent, readJsonl, readQuestions, readSheet, writeJsonl } from "../../lib/workstream.ts";
import { FINDING_ID, cardId, cardName, findingFaults, versioned, type Finding } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf } from "./_shared.ts";

export const describe = "a saved review's findings as records: written open, then carried into entries, decided on a card or dropped with a reason";

const load = (file: string): Finding[] => readJsonl(file).filter((one): one is Finding => !!one && typeof one === "object");

/** The next finding number of an arc: one past the highest it holds. */
const nextNumber = (found: readonly Finding[]): number => Math.max(0, ...found.map((one) => Number(/^F(\d+)$/.exec(one.id)?.[1] ?? 0))) + 1;

function write(args: string[]): number {
  const words = readWords(args, { file: VALUE });
  const { ws, arc } = arcNamed(words.paths[0]);
  const from = words.value("file");
  if (!from || words.paths.length > 1) throw new UsageFault("takes one arc and a file: `finding write <workstream>/<arc> --file findings.json`, a list of `{ \"view\": …, \"number\": …, \"text\": … }`.");
  let given: unknown;
  try { given = JSON.parse(readFileSync(resolve(from), "utf8")); } catch { throw new UsageFault(`reads no JSON at \`${from}\`.`); }
  const list = Array.isArray(given) ? given : (given as { findings?: unknown })?.findings;
  if (!Array.isArray(list) || !list.length) throw new UsageFault("reads no list of findings in the file.");
  const file = findingsFileOf(ws, arc);
  const held = load(file);
  let next = nextNumber(held);
  const made: Finding[] = [];
  for (const [at, one] of list.entries()) {
    const raw = (one ?? {}) as { view?: string; number?: number; text?: string };
    const record: Finding = { id: `F${next}`, view: String(raw.view ?? "").trim(), number: Number(raw.number ?? at + 1), text: String(raw.text ?? "").trim(), state: "open" };
    const faults = findingFaults(record, `finding ${at + 1}`);
    if (faults.length) throw new UsageFault(`${faults.join("; ")}.`);
    made.push(record);
    next += 1;
  }
  writeJsonl(file, [...held, ...made].map((one) => versioned(one)));
  logEvent(ws, arc, "finding", null, `${made.length} written · ${made.map((one) => one.id).join(", ")}`);
  for (const one of made) console.log(`${one.id} · open · ${one.view} #${one.number}`);
  return 0;
}

function decide(args: string[]): number {
  const words = readWords(args, { carried: VALUE, decided: VALUE, dropped: VALUE });
  const [ref, typed, ...more] = words.paths;
  if (!typed || more.length) throw new UsageFault("takes an arc and a finding: `finding decide <workstream>/<arc> F<n> --carried E31,E35 | --decided Q12 | --dropped \"<reason>\"`.");
  const given = ["carried", "decided", "dropped"].filter((name) => words.given(name));
  if (given.length !== 1) throw new UsageFault("answers a finding one way: `--carried <entries>`, `--decided <card>` or `--dropped \"<reason>\"`.");
  const { ws, arc } = arcNamed(ref);
  const id = typed.toUpperCase();
  if (!FINDING_ID.test(id)) throw new UsageFault(`reads \`${typed}\` as no finding: a finding is \`F<n>\`.`);
  const file = findingsFileOf(ws, arc);
  const found = load(file);
  const one = found.find((record) => record.id === id);
  if (!one) throw new UsageFault(`finds no ${id} in ${arc}.`);
  if (given[0] === "carried") {
    const entries = listOf(words, "carried") ?? [];
    const held = new Set((readSheet(ws, arc)?.entries ?? []).map((entry) => entry.id));
    const missing = entries.filter((entry) => !held.has(entry));
    if (!entries.length || missing.length) throw new UsageFault(`${entries.length ? `finds no entry ${missing.join(", ")} in ${arc}'s sheet` : "names no entry"}: carry a finding into entries the sheet holds.`);
    Object.assign(one, { state: "carried", carried: entries });
  } else if (given[0] === "decided") {
    const card = cardId(words.value("decided") ?? "");
    if (!readQuestions(ws).some((question) => question.id === card)) throw new UsageFault(`finds no card ${cardName(card)}: decide a finding on a card that exists.`);
    Object.assign(one, { state: "decided", decided: card });
  } else {
    const reason = (words.value("dropped") ?? "").trim();
    if (!reason) throw new UsageFault("drops a finding with a reason: `--dropped \"<reason>\"`.");
    Object.assign(one, { state: "dropped", reason });
  }
  writeJsonl(file, found.map((record) => versioned(record)));
  logEvent(ws, arc, "finding", null, `${id} ${one.state}`);
  console.log(`${id} · ${one.state}`);
  return 0;
}

function show(args: string[]): number {
  const words = readWords(args, { open: FLAG, json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one arc: `finding show <workstream>/<arc> [--open] [--json]`.");
  const { ws, arc } = arcNamed(words.paths[0]);
  const found = load(findingsFileOf(ws, arc)).filter((one) => !words.given("open") || one.state === "open");
  if (words.given("json")) { console.log(JSON.stringify(found, null, 2)); return 0; }
  if (!found.length) console.log(words.given("open") ? "no finding is open" : "no finding recorded");
  for (const one of found) console.log(`${one.id} · ${one.state} · ${one.view} #${one.number} · ${one.text}`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "save a review's findings from a file as open records", usage: "<workstream>/<arc> --file findings.json", run: write },
  decide: { describe: "answer a finding: carried into entries that exist, decided on a card that exists, or dropped with a reason", usage: "<workstream>/<arc> F<n> --carried E1,E2 | --decided Q<n> | --dropped \"<reason>\"", run: decide },
  show: { describe: "print an arc's findings, with --open only those not answered", usage: "<workstream>/<arc> [--open] [--json]", run: show },
};
