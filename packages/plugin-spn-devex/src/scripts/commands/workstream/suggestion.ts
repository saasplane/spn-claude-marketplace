// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A suggestion is recorded the moment it is raised
//           RULE.DEVEX.WORKSPACE.486, a question is named Q<n> and a suggestion S<n>, with a capital letter, wherever a person reads it
//           RULE.DEVEX.WORKSPACE.488, a suggestion belongs to an arc, as a card does, and the arc's sheet cites it
//           RULE.DEVEX.WORKSPACE.491 and .492, a proposal starts from the construct that exists, and its views are fresh and on record; RULE.DEVEX.AGENT.168
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
// Input takes either case (`q28`, `Q28`, `036/Q28`); a stored id stays lowercase and everything printed or logged names the card with the capital.
//
//   spn-devex workstream suggestion add <workstream>[/<arc>] "<title>" [--preview …]        raise the next one, against the arc it names
//   spn-devex workstream suggestion state <workstream> S<n> <state> [--words "…"] [--arc <arc>]   move it on; shaped or decided with --arc sets or moves its arc
//   spn-devex workstream suggestion edit <workstream> S<n> [--title …] [--preview …]         change its title or its preview

import { basename } from "node:path";
import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PANELS_BLIND, raiseFaults, runningWorkFault } from "../../checks/questions.ts";
import { panelsVisible } from "../../checks/split-plan.ts";
import { precedentLines } from "../../lib/precedent.ts";
import { followUpArcOf, readArc, readJsonl, suggestionsFileOf, workspaceOf, writeJsonl } from "../../lib/workstream.ts";
import { ABOUT, RECORD_VERSION, SUGGESTION_ID, SUGGESTION_STATES, cardAbout, cardFaults, cardId, cardName, suggestionFaults, suggestionRaisedFaults, type Card, type Suggestion } from "../../lib/workstream-schema.ts";
import { arcNamed, refuseFlags, workstreamNamed } from "./_shared.ts";

export const describe = "a suggestion, raised the moment it is raised and moved on as it is shaped, decided, parked or dropped";

/** The states `suggestion state` moves to: every state but the one a suggestion is raised in. */
const MOVES = SUGGESTION_STATES.filter((one) => one !== "raised");

/** Every option `suggestion write` ever took, read loosely: the refusal needs the words, not their values. */
const RETIRED = { title: VALUE, state: VALUE, preview: VALUE, words: VALUE } as const;

/** The workstream a reference names, and the arc where it is `<workstream>/<arc>` (RULE.DEVEX.WORKSPACE.488); a suggestion raised against the workstream alone belongs to its `follow-ups` arc where it holds that folder, else to none. */
function placeOf(ref: string | undefined): { ws: string; arc: string | null } {
  if (ref && ref.includes("/")) {
    const { ws, arc } = arcNamed(ref);
    return { ws, arc };
  }
  const ws = workstreamNamed(ref);
  return { ws, arc: followUpArcOf(ws) };
}

function load(ref: string | undefined): { file: string; records: Suggestion[] } {
  const file = suggestionsFileOf(placeOf(ref).ws);
  const records = readJsonl(file).filter((line): line is Suggestion => !!line && typeof line === "object");
  return { file, records };
}

function find(records: Suggestion[], typed: string): Suggestion {
  const id = cardId(typed);
  if (!SUGGESTION_ID.test(id)) throw new UsageFault(`reads \`${typed}\` as no suggestion — a suggestion is \`S<n>\`.`);
  const found = records.find((one) => one.id === id);
  if (!found) throw new UsageFault(`finds no ${cardName(id)} in this workstream.`);
  return found;
}

function save(file: string, records: Suggestion[], record: Suggestion): number {
  const faults = suggestionFaults(record, cardName(record.id));
  if (faults.length) throw new UsageFault(`${faults.join("; ")}.`);
  writeJsonl(file, records);
  console.log(`${cardName(record.id)} · ${record.state}`);
  return 0;
}

function add(args: string[]): number {
  refuseFlags(args, ["state"], () => "does not take `--state`: a suggestion is raised, and `suggestion state <workstream> S<n> <state>` moves it on.");
  refuseFlags(args, ["words"], () => "does not take `--words`: the words come beside a move, `suggestion state <workstream> S<n> <state> --words \"…\"`.");
  refuseFlags(args, ["title"], () => "does not take `--title`: the title is the second word, `suggestion add <workstream> \"<title>\"`.");
  const words = readWords(args, { preview: VALUE, file: VALUE, about: VALUE });
  const [ref, given, ...more] = words.paths;
  // A suggestion MAY CARRY THE SAME CARD A QUESTION DOES (RULE.DEVEX.WORKSPACE.491); the title-only form stays for one raised without it.
  const cardFile = words.value("file");
  let card: (Card & { title?: string; preview?: unknown }) | null = null;
  if (cardFile) {
    try { card = JSON.parse(readFileSync(resolve(cardFile), "utf8")); } catch { throw new UsageFault(`reads no JSON at \`${cardFile}\`.`); }
  }
  const title = given ?? card?.title;
  if (!title?.trim() || more.length) throw new UsageFault("takes a workstream, or an arc as `<workstream>/<arc>`, and one title: `suggestion add <workstream>[/<arc>] \"<title>\" [--preview …]`.");
  const { file, records } = load(ref);
  const place = placeOf(ref);
  const running = runningWorkFault(place.ws, title);
  if (running) throw new UsageFault(running);
  let kept: Card | null = null;
  // THE CHOICE A SUGGESTION SHOWS follows a card's shape (RULE.DEVEX.WORKSPACE.491): the lookup runs and prints what it finds before any refusal,
  // a suggestion about code needs its preview (the fragment of each option, or a link), and one that carries a card or names what it is about
  // needs its `settled` block. A title alone stays a thought, as it was.
  const about = words.value("about");
  if (about !== null && !(ABOUT as readonly string[]).includes(about)) throw new UsageFault(`takes \`--about\` as one of ${ABOUT.join(" · ")}: \`${about}\` is none.`);
  const found = precedentLines(workspaceOf(), [title, card?.what].filter(Boolean).join(" "), 5, !!card || about !== null);
  const shown = (): void => { for (const line of found) console.log(line); };
  const settled = card?.settled;
  const derived = card ? cardAbout({ about: about ?? card.about, nearest: card.nearest }) : about;
  if (card) {
    if (!place.arc || !ref?.includes("/")) throw new UsageFault("takes a card against an arc, `suggestion add <workstream>/<arc> \"<title>\" --file card.json`: its fresh views are on record for that arc.");
    const { title: _title, ...rest } = card;
    if (typeof rest.preview === "string") delete rest.preview;
    const root = workspaceOf();
    const shape = cardFaults(rest);
    const raised = raiseFaults(place.ws, place.arc, rest, root);
    const unsettled = suggestionRaisedFaults({ settled });
    if (shape.length || raised.faults.length || unsettled.length) { shown(); throw new UsageFault(`refuses a card with a part missing: ${[...shape, ...raised.faults, ...unsettled].join("; ")}.`); }
    rest.signs = raised.signs;
    kept = rest;
    if (root && !panelsVisible(root) && rest.views.some((view) => view.made === "FRESH")) console.log(PANELS_BLIND);
  } else if (about !== null) {
    shown();
    throw new UsageFault(`refuses a suggestion about ${about} with no \`settled\` block: ${suggestionRaisedFaults({}, "it").join("; ")}.`);
  }
  // THE PREVIEW is the fragment of each option, a link to the page that shows it, or the card's option code set side by side.
  const optionCode = (card?.options ?? []).filter((option) => option.code?.trim()).map((option) => `${option.key}: ${option.code!.trim()}`).join("\n");
  const preview = words.value("preview") ?? (typeof card?.preview === "string" ? card.preview : optionCode || null);
  const next = Math.max(0, ...records.map((one) => Number(/^s(\d+)$/.exec(one.id)?.[1] ?? 0))) + 1;
  const record: Suggestion = { v: RECORD_VERSION, id: `s${next}`, title, state: "raised", preview, words: null, arc: place.arc, ...(derived && derived !== "OTHER" ? { about: derived } : {}), ...(settled ? { settled } : {}), ...(kept ? { card: kept } : {}) };
  records.push(record);
  const faults = suggestionFaults(record, cardName(record.id));
  if (faults.length) shown();
  const saved = save(file, records, record);
  if (!faults.length) shown();
  return saved;
}

function state(args: string[]): number {
  refuseFlags(args, ["title", "preview"], (name) => `does not take \`--${name}\`: it is the suggestion's own — \`suggestion edit <workstream> S<n> --${name} …\` changes it.`);
  const words = readWords(args, { words: VALUE, arc: VALUE });
  const [ref, id, to, ...more] = words.paths;
  if (!id || !to || more.length) throw new UsageFault(`takes a workstream, a suggestion and a state: \`suggestion state <workstream> S<n> <${MOVES.join(" · ")}> [--words "…"]\`.`);
  if (!(MOVES as readonly string[]).includes(to)) throw new UsageFault(`reads \`${to}\` as no state to move to — one of ${MOVES.join(" · ")}. (A suggestion is raised by \`suggestion add\`.)`);
  const { file, records } = load(ref);
  const record = find(records, id);
  // `--arc` sets or moves the arc a suggestion belongs to (RULE.DEVEX.WORKSPACE.488), and goes with the moves that give an arc its plan.
  const arc = words.value("arc");
  if (arc !== null) {
    if (to !== "shaped" && to !== "decided") throw new UsageFault(`takes \`--arc\` only with \`shaped\` or \`decided\`: ${cardName(record.id)} moves to ${to}, and an arc takes up a suggestion it shapes or decides.`);
    const named = arcNamed(`${basename(placeOf(ref).ws)}/${arc}`);
    if (!readArc(named.ws, named.arc)) throw new UsageFault(`finds no arc ${arc} in ${basename(named.ws)}.`);
    record.arc = named.arc;
  }
  record.state = to as Suggestion["state"];
  const said = words.value("words");
  if (said !== null) record.words = said;
  return save(file, records, record);
}

function edit(args: string[]): number {
  refuseFlags(args, ["state"], () => "does not take `--state`: a suggestion's state moves with `suggestion state <workstream> S<n> <state>`.");
  refuseFlags(args, ["words"], () => "does not take `--words`: the words come beside a move, `suggestion state <workstream> S<n> <state> --words \"…\"`.");
  const words = readWords(args, { title: VALUE, preview: VALUE });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes a workstream and one suggestion: `suggestion edit <workstream> S<n> [--title …] [--preview …]`.");
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
  add: { describe: "raise a suggestion: the next number, raised; it also prints the decisions and rules that already speak to its title", usage: "<workstream>[/<arc>] \"<title>\" [--preview …] [--about CODE|FLOW|OTHER] [--file card.json]", run: add },
  state: { describe: "move it on: shaped, decided, parked or dropped, with the words beside the move", usage: "<workstream> S<n> <state> [--words \"…\"] [--arc <arc>]", run: state },
  edit: { describe: "change its title or its preview, never its state", usage: "<workstream> S<n> [--title …] [--preview …]", run: edit },
  write: { describe: "retired: refuses, and names the command that fits what it was typed with", usage: "<workstream> [S<n>] …", hidden: true, run: write },
};
