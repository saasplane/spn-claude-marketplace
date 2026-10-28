// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A suggestion is recorded the moment it is raised
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream suggestion add <workstream> "<title>" [--preview …]                 raise the next one
//   spn-devex workstream suggestion state <workstream> <sN> <state> [--words "…"]            move it on
//   spn-devex workstream suggestion edit <workstream> <sN> [--title …] [--preview …]         change its title or its preview

import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readJsonl, suggestionsFileOf, writeJsonl } from "../../lib/workstream.ts";
import { SUGGESTION_ID, SUGGESTION_STATES, suggestionFaults, type Suggestion } from "../../lib/workstream-schema.ts";
import { refuseFlags, workstreamNamed } from "./_shared.ts";

export const describe = "a suggestion, raised the moment it is raised and moved on as it is shaped, decided, parked or dropped";

/** The states `suggestion state` moves to: every state but the one a suggestion is raised in. */
const MOVES = SUGGESTION_STATES.filter((one) => one !== "raised");

/** Every option `suggestion write` ever took, read loosely: the refusal needs the words, not their values. */
const RETIRED = { title: VALUE, state: VALUE, preview: VALUE, words: VALUE } as const;

function load(ref: string | undefined): { file: string; records: Suggestion[] } {
  const file = suggestionsFileOf(workstreamNamed(ref));
  const records = readJsonl(file).filter((line): line is Suggestion => !!line && typeof line === "object");
  return { file, records };
}

function find(records: Suggestion[], id: string): Suggestion {
  if (!SUGGESTION_ID.test(id)) throw new UsageFault(`reads \`${id}\` as no suggestion — a suggestion is \`s<n>\`.`);
  const found = records.find((one) => one.id === id);
  if (!found) throw new UsageFault(`finds no ${id} in this workstream.`);
  return found;
}

function save(file: string, records: Suggestion[], record: Suggestion): number {
  const faults = suggestionFaults(record, record.id);
  if (faults.length) throw new UsageFault(`${faults.join("; ")}.`);
  writeJsonl(file, records);
  console.log(`${record.id} · ${record.state}`);
  return 0;
}

function add(args: string[]): number {
  refuseFlags(args, ["state"], () => "does not take `--state`: a suggestion is raised, and `suggestion state <workstream> <sN> <state>` moves it on.");
  refuseFlags(args, ["words"], () => "does not take `--words`: the words come beside a move, `suggestion state <workstream> <sN> <state> --words \"…\"`.");
  refuseFlags(args, ["title"], () => "does not take `--title`: the title is the second word, `suggestion add <workstream> \"<title>\"`.");
  const words = readWords(args, { preview: VALUE });
  const [ref, title, ...more] = words.paths;
  if (!title?.trim() || more.length) throw new UsageFault("takes a workstream and one title: `suggestion add <workstream> \"<title>\" [--preview …]`.");
  const { file, records } = load(ref);
  const next = Math.max(0, ...records.map((one) => Number(/^s(\d+)$/.exec(one.id)?.[1] ?? 0))) + 1;
  const record: Suggestion = { id: `s${next}`, title, state: "raised", preview: words.value("preview"), words: null };
  records.push(record);
  return save(file, records, record);
}

function state(args: string[]): number {
  refuseFlags(args, ["title", "preview"], (name) => `does not take \`--${name}\`: it is the suggestion's own — \`suggestion edit <workstream> <sN> --${name} …\` changes it.`);
  const words = readWords(args, { words: VALUE });
  const [ref, id, to, ...more] = words.paths;
  if (!id || !to || more.length) throw new UsageFault(`takes a workstream, a suggestion and a state: \`suggestion state <workstream> <sN> <${MOVES.join(" · ")}> [--words "…"]\`.`);
  if (!(MOVES as readonly string[]).includes(to)) throw new UsageFault(`reads \`${to}\` as no state to move to — one of ${MOVES.join(" · ")}. (A suggestion is raised by \`suggestion add\`.)`);
  const { file, records } = load(ref);
  const record = find(records, id);
  record.state = to as Suggestion["state"];
  const said = words.value("words");
  if (said !== null) record.words = said;
  return save(file, records, record);
}

function edit(args: string[]): number {
  refuseFlags(args, ["state"], () => "does not take `--state`: a suggestion's state moves with `suggestion state <workstream> <sN> <state>`.");
  refuseFlags(args, ["words"], () => "does not take `--words`: the words come beside a move, `suggestion state <workstream> <sN> <state> --words \"…\"`.");
  const words = readWords(args, { title: VALUE, preview: VALUE });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes a workstream and one suggestion: `suggestion edit <workstream> <sN> [--title …] [--preview …]`.");
  const title = words.value("title");
  const preview = words.value("preview");
  if (title === null && preview === null) throw new UsageFault("changes its title or its preview: give `--title …`, `--preview …`, or both.");
  const { file, records } = load(ref);
  const record = find(records, id);
  if (title !== null) record.title = title;
  if (preview !== null) record.preview = preview;
  return save(file, records, record);
}

/** `suggestion write` is retired: it names the command that fits the words it was typed with, and writes nothing. */
function write(args: string[]): number {
  const words = readWords(args, RETIRED);
  const [ref, id] = words.paths;
  const given = Object.keys(RETIRED).filter((name) => words.given(name));
  const flags = (names: string[]): string => names.map((name) => `--${name} …`).join(" ");
  const at = ref ?? "<workstream>";
  let fits: string;
  if (id === undefined) fits = `add ${at} "${words.value("title") ?? "<title>"}" ${flags(given.filter((name) => name === "preview"))}`;
  else {
    const move = given.includes("state") || given.includes("words");
    const change = given.filter((name) => name === "title" || name === "preview");
    const moveFits = `state ${at} ${id} ${words.value("state") ?? "<state>"}${given.includes("words") ? ' --words "…"' : ""}`;
    if (move && !change.length) fits = moveFits;
    else if (!move) fits = `edit ${at} ${id} ${flags(change)}`;
    else fits = `edit ${at} ${id} ${flags(change)}; then \`suggestion ${moveFits}\``;
  }
  throw new UsageFault(`is retired, and writes nothing: type \`spn-devex workstream suggestion ${fits.replace(/\s+/g, " ").trim()}\`.`);
}

export const actions: Record<string, Action> = {
  add: { describe: "raise a suggestion: the next number, raised", usage: "<workstream> \"<title>\" [--preview …]", run: add },
  state: { describe: "move it on: shaped, decided, parked or dropped, with the words beside the move", usage: "<workstream> <sN> <state> [--words \"…\"]", run: state },
  edit: { describe: "change its title or its preview, never its state", usage: "<workstream> <sN> [--title …] [--preview …]", run: edit },
  write: { describe: "retired: refuses, and names the command that fits what it was typed with", usage: "<workstream> [<sN>] …", hidden: true, run: write },
};
