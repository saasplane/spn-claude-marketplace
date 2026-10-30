// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The formats · § The life of an arc, and every file it touches · § A step row says where, at what altitude, and how
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream row add <workstream>/N<nnn> "<title>" --repo <repo> --altitude <altitude> [--kind change] [--state ready] …
//   spn-devex workstream row state <workstream>/N<nnn> <row> <state> [--note "…"]
//   spn-devex workstream row note <workstream>/N<nnn> <row> "<text>"
//   spn-devex workstream row edit <workstream>/N<nnn> <row> [--title …] [--kind …] [--repo …] [--altitude …] …
//   spn-devex workstream row discard <workstream>/N<nnn> <row> --note "<the developer's words>"
//
// One command per target: a positional word is the target and its one value, an option is named, and a required option left out is
// refused (RULE.DEVEX.WORKSPACE.321). An arc's fields are `arc edit`'s. `row write` is retired and refuses, naming the command that fits.
// `row add` takes the arc's next number and prints it; the rules for a started step and a landed arc are RULE.DEVEX.WORKSPACE.278 and .261.

import { type Action, FLAG, VALUE, UsageFault, readWords, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { arcStatus, doneOf, landingFault, logEvent, readArc, stateOfRow, stepsMayStart, writeArc } from "../../lib/workstream.ts";
import { ALTITUDES, ROW_ID, ROW_KINDS, ROW_STATES, parentIds, type ArcData, type ArcRow } from "../../lib/workstream-schema.ts";
import { ARC_FLAGS, afterWrite, arcNamed, arcSignatures, listOf, refreshIfMoved, refuseFlags, typed } from "./_shared.ts";
import { stepRowFindings } from "../../checks/workstream-state.ts";

export const describe = "add a row, move its state, write a note on it, change its fields, or discard one found invalid";

const ROW_TEXT = ["parent", "title", "repo", "mechanism", "acceptance", "model", "proof", "order"] as const;
const ROW_LISTS: Record<string, keyof ArcRow> = { "blocked-by": "blockedBy", touches: "touches", decisions: "decisions", facts: "facts", entries: "entries" };

/** What a row carries beyond its title, shared by `row add` and `row edit`. */
const FIELDS = {
  repo: VALUE, altitude: ALTITUDES, kind: ROW_KINDS, model: VALUE, "blocked-by": VALUE, touches: VALUE, position: VALUE,
  parent: VALUE, mechanism: VALUE, acceptance: VALUE, decisions: VALUE, facts: VALUE, entries: VALUE, proof: VALUE, order: VALUE,
} as const;
const ADD_OPTIONS = { ...FIELDS, state: ROW_STATES, note: VALUE } as const;
const EDIT_OPTIONS = { ...FIELDS, title: VALUE } as const;

/** The row as the words change it; the names of the fields that changed. */
function rowFields(row: ArcRow, words: Words): string[] {
  const changed: string[] = [];
  for (const name of ROW_TEXT) {
    const value = words.value(name);
    if (value !== null && row[name] !== value) { row[name] = value; changed.push(name); }
  }
  for (const name of ["kind", "altitude", "state"] as const) {
    const value = words.value(name);
    if (value !== null && row[name] !== value) { (row as Record<string, unknown>)[name] = value; changed.push(name); }
  }
  for (const [option, field] of Object.entries(ROW_LISTS)) {
    const list = listOf(words, option);
    if (list) { (row as Record<string, unknown>)[field] = list; changed.push(field as string); }
  }
  return changed;
}

/** `--position` as a place in the arc's rows, counted from 1. */
function placeOf(words: Words): number | null {
  const position = words.value("position");
  if (position === null) return null;
  if (!/^[1-9]\d*$/.test(position)) throw new UsageFault(`takes \`--position\` as a whole number from 1, the row's place among the arc's rows: \`${position}\` is not one.`);
  return Number(position);
}

/** The next free id of the arc: one past its highest number, or a child of `parent` where one is named. */
function nextId(rows: readonly ArcRow[], parent: string | null): string {
  if (parent === null) return String(Math.max(0, ...rows.map((row) => parseInt(row.id, 10))) + 1);
  const taken = new Set(rows.map((row) => row.id));
  if (/^\d+$/.test(parent)) {
    for (const letter of "abcdefghijklmnopqrstuvwxyz") if (!taken.has(`${parent}${letter}`)) return `${parent}${letter}`;
    throw new UsageFault(`finds no free letter under row ${parent}.`);
  }
  let at = 1;
  while (taken.has(`${parent}.${at}`)) at += 1;
  return `${parent}.${at}`;
}

/** The arc as it is written, or a refusal that names `arc edit` where it is not. */
function arcOf(ref: string | undefined): { ws: string; arc: string; data: ArcData } {
  const { ws, arc } = arcNamed(ref, true);
  const data = readArc(ws, arc);
  if (!data) throw new UsageFault(`finds no ${arc} — open it first: \`arc edit ${ref} --title "…" --subject … --goal "…"\`.`);
  return { ws, arc, data };
}

/** The row an existing-row command acts on, or a refusal that names `row add`. */
function rowOf(ref: string | undefined, rowId: string | undefined): { ws: string; arc: string; data: ArcData; row: ArcRow } {
  if (!rowId) throw new UsageFault("takes an arc and a row, as `<workstream>/N<nnn> <row>`.");
  const { ws, arc, data } = arcOf(ref);
  if (!ROW_ID.test(rowId)) throw new UsageFault(`reads \`${rowId}\` as no row id — a row is \`57\`, \`57b\` or \`3e.1\`.`);
  const row = data.rows.find((one) => one.id === rowId);
  if (!row) throw new UsageFault(`finds no row ${rowId} in ${arc} — \`row add ${ref} "<title>" --repo <repo> --altitude <altitude>\` adds one and prints its number.`);
  return { ws, arc, data, row };
}

/** Throws where a step would start against the arc's go or wait: a row set `running` or `landed` needs the arc decided with no wait. */
function mayStart(arc: string, data: ArcData, rowId: string, state: string | null | undefined): void {
  if (!["running", "landed"].includes(state ?? "") || stepsMayStart(data)) return;
  const why = data.status !== "DECIDED" ? `${arc} is ${arcStatus(data)}, and a step starts only after the developer's go — \`arc edit ${arc} --status DECIDED --note "<the developer's words>"\``
    : `${arc} holds the developer's wait, "${data.wait}", and starts at their word — \`arc edit ${arc} --start --note "<their words>"\``;
  throw new UsageFault(`keeps step ${rowId} from starting: ${why} (RULE.DEVEX.WORKSPACE.278).`);
}

/** The one line a row command ends on, then what the write left to say. */
function finish(ws: string, arc: string, data: ArcData, before: ReturnType<typeof arcSignatures>, statusBefore: string, said: string[]): number {
  const statusAfter = arcStatus(data);
  if (statusAfter !== statusBefore) said.push(`${arc} reads ${statusAfter}`);
  const refreshed = refreshIfMoved(ws, before);
  const { done, total } = doneOf(data);
  console.log(`ok · ${arc} ${done}/${total} · ${[...said, ...refreshed.said].join(" · ")}`);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  for (const line of stepRowFindings(data)) console.log(`note: ${line}`);
  return 0;
}

function add(args: string[]): number {
  refuseFlags(args, ARC_FLAGS, (name) => `does not take \`--${name}\`: it is the arc's — \`arc edit <workstream>/N<nnn> --${name} …\` changes it.`);
  const words = readWords(args, ADD_OPTIONS);
  const [ref, title, ...more] = words.paths;
  if (!title || more.length) throw new UsageFault("takes an arc and one title: `row add <workstream>/N<nnn> \"<title>\" --repo <repo> --altitude <altitude>`.");
  for (const need of ["repo", "altitude"] as const)
    if (!words.value(need)?.trim()) throw new UsageFault(`adds a row with \`--repo\` and \`--altitude\`: \`--${need}\` is missing, and a step says where it lands and at what altitude (RULE.DEVEX.WORKSPACE.183).`);
  const place = placeOf(words);
  const { ws, arc, data } = arcOf(ref);
  const statusBefore = arcStatus(data);
  if (statusBefore === "LANDED" || statusBefore === "CARRIED" || statusBefore === "DROPPED")
    throw new UsageFault(`keeps ${arc} as it is: it is ${statusBefore}, and a landed arc is never reopened — a fix to it is a step on the review-fixes arc, naming ${arc}; new scope is a new arc (RULE.DEVEX.WORKSPACE.261).`);
  const parent = words.value("parent");
  if (parent !== null && !data.rows.some((row) => row.id === parent)) throw new UsageFault(`finds no row ${parent} in ${arc} to put the row under.`);
  const rowId = nextId(data.rows, parent);
  const row: ArcRow = { id: rowId, parent: arc, title, kind: words.value("kind") ?? "change", state: words.value("state") ?? "ready" };
  rowFields(row, words);
  mayStart(arc, data, rowId, row.state);
  const before = arcSignatures(ws);
  if (place === null) data.rows.push(row);
  else data.rows.splice(Math.min(place - 1, data.rows.length), 0, row);
  // A row that now has rows under it takes its state from them.
  const parents = parentIds(data.rows);
  for (const one of data.rows) if (parents.has(one.id)) delete one.state;
  typed(() => writeArc(ws, data));
  logEvent(ws, arc, "added", rowId, title);
  return finish(ws, arc, data, before, statusBefore, [`row ${rowId} added`]);
}

function state(args: string[]): number {
  const words = readWords(args, { note: VALUE, run: VALUE });
  const [ref, rowId, next, ...more] = words.paths;
  if (!rowId || !next || more.length) throw new UsageFault(`takes an arc, a row and the state: \`row state <workstream>/N<nnn> <row> <state>\`, one of ${ROW_STATES.join(" · ")}.`);
  if (!(ROW_STATES as readonly string[]).includes(next)) throw new UsageFault(`takes a state from ${ROW_STATES.join(" · ")}, and \`${next}\` is none of them.`);
  const { ws, arc, data, row } = rowOf(ref, rowId);
  const was = stateOfRow(data.rows, row);
  if (was === next) throw new UsageFault(`changes nothing: row ${rowId} is already ${next}; \`row note\` writes a line on it.`);
  mayStart(arc, data, rowId, next);
  const run = words.value("run");
  if (next === "landed") {
    const fault = landingFault(ws, arc, data, row, run);
    if (fault) { console.log(`Refused: ${fault}`); return 1; }
  }
  const statusBefore = arcStatus(data);
  const before = arcSignatures(ws);
  row.state = next;
  typed(() => writeArc(ws, data));
  logEvent(ws, arc, next, rowId, words.value("note") ?? `${was} → ${next}${next === "landed" && run ? ` · run ${run}` : ""}`);
  return finish(ws, arc, data, before, statusBefore, [`row ${rowId} · state`]);
}

function note(args: string[]): number {
  const words = readWords(args);
  const [ref, rowId, text, ...more] = words.paths;
  if (!rowId || !text?.trim() || more.length) throw new UsageFault("takes an arc, a row and the words: `row note <workstream>/N<nnn> <row> \"<text>\"`.");
  const { ws, arc, data } = rowOf(ref, rowId);
  logEvent(ws, arc, "note", rowId, text);
  return finish(ws, arc, data, arcSignatures(ws), arcStatus(data), [`row ${rowId} · log line written`]);
}

function edit(args: string[]): number {
  refuseFlags(args, ARC_FLAGS, (name) => `does not take \`--${name}\`: it is the arc's — \`arc edit <workstream>/N<nnn> --${name} …\` changes it.`);
  refuseFlags(args, ["state"], () => "does not take `--state`: a row's state moves with `row state <workstream>/N<nnn> <row> <state>`.");
  refuseFlags(args, ["note"], () => "does not take `--note`: a line on a row's log is `row note <workstream>/N<nnn> <row> \"<text>\"`.");
  const words = readWords(args, EDIT_OPTIONS);
  const [ref, rowId, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes an arc and one row.");
  const place = placeOf(words);
  const { ws, arc, data, row } = rowOf(ref, rowId);
  const statusBefore = arcStatus(data);
  const before = arcSignatures(ws);
  const changed = rowFields(row, words);
  if (place !== null) {
    const at = data.rows.indexOf(row);
    const to = Math.min(place - 1, data.rows.length - 1);
    if (at !== to) { data.rows.splice(at, 1); data.rows.splice(to, 0, row); changed.push("position"); }
  }
  if (!changed.length) throw new UsageFault("changes nothing: name a field to change.");
  typed(() => writeArc(ws, data));
  logEvent(ws, arc, "changed", rowId, `changed ${changed.join(", ")}`);
  return finish(ws, arc, data, before, statusBefore, [`row ${rowId} · ${changed.join(", ")}`]);
}

/** Every option `row write` ever took, read loosely: the refusal needs the words, not their values. */
const RETIRED = {
  title: VALUE, subject: VALUE, goal: VALUE, status: VALUE, reason: VALUE, wait: VALUE, start: FLAG, "review-fixes": FLAG, decides: VALUE, repos: VALUE, cycle: VALUE, follows: VALUE,
  model: VALUE, parent: VALUE, kind: VALUE, repo: VALUE, altitude: VALUE, mechanism: VALUE, acceptance: VALUE, "blocked-by": VALUE, touches: VALUE, decisions: VALUE, facts: VALUE,
  state: VALUE, proof: VALUE, order: VALUE, note: VALUE, position: VALUE, preview: VALUE, under: VALUE,
} as const;

/** `row write` is retired: it names the command that fits the words it was typed with, and writes nothing. */
function write(args: string[]): number {
  const words = readWords(args, RETIRED);
  const [ref, rowId] = words.paths;
  const given = Object.keys(RETIRED).filter((name) => words.given(name));
  const flags = (names: string[]): string => names.map((name) => `--${name}${RETIRED[name as keyof typeof RETIRED] === FLAG ? "" : " …"}`).join(" ");
  const arcRef = ref ?? "<workstream>/N<nnn>";
  let fits: string;
  if (rowId === undefined) fits = `arc edit ${arcRef} ${flags(given)}`;
  else {
    let known = true;
    try { known = !!arcOf(ref).data.rows.find((one) => one.id === rowId); } catch { known = true; }
    const rest = given.filter((name) => name !== "state" && name !== "note");
    if (!known) fits = `row add ${arcRef} "<title>" --repo <repo> --altitude <altitude> ${flags(given.filter((name) => name !== "title" && name !== "repo" && name !== "altitude"))}`;
    else if (given.includes("state") && !rest.length) fits = `row state ${arcRef} ${rowId} ${words.value("state") ?? "<state>"}${given.includes("note") ? ' --note "…"' : ""}`;
    else if (given.length === 1 && given[0] === "note") fits = `row note ${arcRef} ${rowId} "<text>"`;
    else fits = `row edit ${arcRef} ${rowId} ${flags(rest)}${given.includes("state") ? `; then \`row state ${arcRef} ${rowId} ${words.value("state")}\`` : ""}`;
  }
  throw new UsageFault(`is retired, and writes nothing: type \`spn-devex workstream ${fits.replace(/\s+/g, " ").trim()}\`.`);
}

/** The states a row may be discarded from: none of them has reached its node. */
const DISCARDABLE = new Set(["waiting", "ready", "deferred"]);

function discard(args: string[]): number {
  const words = readWords(args, { note: VALUE });
  const [ref, rowId, ...more] = words.paths;
  if (!rowId || more.length) throw new UsageFault("takes an arc and one row: `row discard <workstream>/N<nnn> <row> --note \"…\"`.");
  const note = words.value("note");
  if (!note?.trim()) throw new UsageFault(`discards row ${rowId} with \`--note\` carrying the developer's words, so nobody raises it again.`);
  const { ws, arc } = arcNamed(ref, true);
  const data = readArc(ws, arc);
  if (!data) throw new UsageFault(`finds no ${arc}.`);
  const row = data.rows.find((one) => one.id === rowId);
  if (!row) throw new UsageFault(`finds no row ${rowId} in ${arc}.`);
  const under = data.rows.filter((one) => one.parent === rowId).map((one) => one.id);
  if (under.length) throw new UsageFault(`keeps row ${rowId}: rows ${under.join(", ")} sit under it — discard or move them first.`);
  const waiting = data.rows.filter((one) => one.blockedBy?.includes(rowId)).map((one) => one.id);
  if (waiting.length) throw new UsageFault(`keeps row ${rowId}: rows ${waiting.join(", ")} wait on it — rewrite their \`--blocked-by\` first.`);
  if (!DISCARDABLE.has(row.state!))
    throw new UsageFault(`keeps row ${rowId}: it is ${row.state}, and only a row that never reached its node is discarded — waiting, ready or deferred (RULE.DEVEX.WORKSPACE.279).`);

  const before = arcSignatures(ws);
  data.rows = data.rows.filter((one) => one !== row);
  // A parent left with no row under it keeps the state it showed, which was this row's.
  const parent = data.rows.find((one) => one.id === row.parent);
  if (parent && !parentIds(data.rows).has(parent.id)) parent.state = row.state;
  typed(() => writeArc(ws, data));
  logEvent(ws, arc, "discarded", rowId, `${note} · the row read: ${row.title}`);
  const refreshed = refreshIfMoved(ws, before);
  const { done, total } = doneOf(data);
  console.log(`ok · ${arc} ${done}/${total} · ${[`row ${rowId} discarded`, ...refreshed.said].join(" · ")}`);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  return 0;
}

export const actions: Record<string, Action> = {
  add: {
    describe: "add a row to an arc, taking the arc's next number and printing it",
    usage: "<workstream>/N<nnn> \"<title>\" --repo <repo> --altitude <altitude> [--kind change] [--state ready] [--blocked-by …] [--touches …] [--entries E1,E2] [--position …] [--model …] [--note …]",
    run: add,
  },
  state: {
    describe: "move a row to a state; --note carries the words beside the move, and --run names the run a CODE or PROOF row of a sheet arc lands on",
    usage: "<workstream>/N<nnn> <row> <state> [--note …] [--run <name>]",
    run: state,
  },
  note: {
    describe: "write one line on a row's log, and change nothing else",
    usage: "<workstream>/N<nnn> <row> \"<text>\"",
    run: note,
  },
  edit: {
    describe: "change the fields of a row the arc holds; a row it lacks is refused, and `row add` is named",
    usage: "<workstream>/N<nnn> <row> [--title …] [--kind …] [--repo …] [--altitude …] [--model …] [--blocked-by …] [--touches …] [--entries E1,E2] [--position …]",
    run: edit,
  },
  discard: {
    describe: "take a row found invalid or not needed out of the arc; --note carries the developer's words into its one log line",
    usage: "<workstream>/N<nnn> <row> --note \"…\"",
    run: discard,
  },
  write: {
    describe: "retired: refuses, and names the command that fits what it was typed with",
    usage: "<workstream>/N<nnn> [<row>] …",
    hidden: true,
    run: write,
  },
};
