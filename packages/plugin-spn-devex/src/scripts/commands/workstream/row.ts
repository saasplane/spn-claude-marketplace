// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is named for the cycle it pays · § The commands · § The formats · § The life of an arc, and every file it touches
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream row write <arc> [<row>] [--field value …] [--position <n>] [--note "…"]
//
// Given the arc alone, it opens the arc as PROPOSED (`--title` and `--subject` needed), or changes its
// header and its status; `--goal` sets the outcome the arc's name file leads with, and `--subject` takes
// one to three words of at most 24 characters. Every write of the data writes the arc's name file too. Given a row, it adds the row (`--title` and `--kind` needed) or changes its
// fields and its state. A list option takes values separated by commas, and `none` empties it.
// `--note` alone writes a line on the arc's log, which has no other writer. A write that moves an arc's
// status or a row's state refreshes every view of it (RD.DEVEX.WORKSPACE.273), and says which.

import { type Action, VALUE, UsageFault, readWords, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { STATUSES } from "../../checks/arc-status.ts";
import { doneOf, logEvent, newArc, readArc, stateOfRow, writeArc } from "../../lib/workstream.ts";
import { ALTITUDES, ROW_ID, ROW_KINDS, ROW_STATES, parentIds, subjectFault, type ArcData, type ArcRow } from "../../lib/workstream-schema.ts";
import { afterWrite, arcNamed, arcSignatures, listOf, refreshIfMoved, typed } from "./_shared.ts";

export const describe = "open an arc or change its header, or add a row or change its fields and its state";

const HEADER_TEXT = ["title", "subject", "goal", "reason", "decides", "cycle", "follows", "model"] as const;
const ROW_TEXT = ["parent", "title", "repo", "mechanism", "acceptance", "model", "proof", "order"] as const;
const ROW_LISTS: Record<string, keyof ArcRow> = { "blocked-by": "blockedBy", touches: "touches", decisions: "decisions", facts: "facts" };

const OPTIONS = {
  title: VALUE, subject: VALUE, goal: VALUE, status: STATUSES, reason: VALUE, decides: VALUE, repos: VALUE, cycle: VALUE, follows: VALUE,
  model: VALUE, parent: VALUE, kind: ROW_KINDS, repo: VALUE, altitude: ALTITUDES, mechanism: VALUE, acceptance: VALUE,
  "blocked-by": VALUE, touches: VALUE, decisions: VALUE, facts: VALUE, state: ROW_STATES, proof: VALUE, order: VALUE, note: VALUE, position: VALUE,
} as const;

const ROW_ONLY = ["parent", "kind", "repo", "altitude", "mechanism", "acceptance", "blocked-by", "touches", "decisions", "facts", "state", "proof", "order"];
const HEADER_ONLY = ["subject", "goal", "status", "reason", "decides", "repos", "cycle", "follows", "position"];

/** The header as the words change it; the names of the fields that changed. */
function header(data: ArcData, words: Words): string[] {
  const changed: string[] = [];
  for (const name of HEADER_TEXT) {
    const value = words.value(name);
    if (value !== null && data[name] !== value) { (data as Record<string, unknown>)[name] = value; changed.push(name); }
  }
  const repos = listOf(words, "repos");
  if (repos) { data.repos = repos; changed.push("repos"); }
  const position = words.value("position");
  if (position !== null) {
    if (!/^[1-9]\d*$/.test(position)) throw new UsageFault(`takes \`--position\` as a whole number from 1, the arc's place in the planned sequence: \`${position}\` is not one.`);
    if (data.position !== Number(position)) { data.position = Number(position); changed.push("position"); }
  }
  const status = words.value("status");
  if (status && status !== data.status) {
    data.status = status;
    if (!["HELD", "CARRIED", "DROPPED"].includes(status) && !words.given("reason")) data.reason = null;
    changed.push("status");
  }
  return changed;
}

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

function write(args: string[]): number {
  const words = readWords(args, OPTIONS);
  const [ref, rowId, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes an arc and at most one row.");
  const { ws, arc } = arcNamed(ref, true);
  const note = words.value("note");
  const subject = words.value("subject");
  const short = subject === null ? null : subjectFault(subject);
  if (short) throw new UsageFault(`takes a short subject: \`${subject}\` ${short}, such as \`layout-model\` (RD.DEVEX.WORKSPACE.265).`);
  let data = readArc(ws, arc);
  const said: string[] = [];
  const before = arcSignatures(ws);

  if (rowId === undefined) {
    const stray = ROW_ONLY.filter((name) => words.given(name));
    if (stray.length) throw new UsageFault(`changes a row with ${stray.map((name) => `\`--${name}\``).join(", ")} — name the row after the arc.`);
    if (!data) {
      const title = words.value("title");
      if (!title || !subject) throw new UsageFault(`opens ${arc} with \`--title\` and \`--subject\`.`);
      data = newArc(arc, subject, title);
      header(data, words);
      typed(() => writeArc(ws, data!));
      logEvent(ws, arc, "opened", null, note ?? `opened as ${data.status}`);
      said.push(`${arc} opened · ${data.status}`);
    } else {
      const was = data.status;
      const changed = header(data, words);
      if (!changed.length && !note) throw new UsageFault("changes nothing: name a field, or `--note`.");
      if (changed.length) typed(() => writeArc(ws, data!));
      logEvent(ws, arc, changed.includes("status") ? "status" : changed.length ? "header" : "note", null,
        note ?? (changed.includes("status") ? `${was} → ${data.status}${data.reason ? ` · ${data.reason}` : ""}` : `changed ${changed.join(", ")}`));
      said.push(changed.length ? `${arc} · ${changed.join(", ")}` : `${arc} · log line written`);
    }
  } else {
    if (!data) throw new UsageFault(`finds no ${arc} — open it first: \`row write ${ref} --title "…" --subject …\`.`);
    if (!ROW_ID.test(rowId)) throw new UsageFault(`reads \`${rowId}\` as no row id — a row is \`57\`, \`57b\` or \`3e.1\`.`);
    const stray = HEADER_ONLY.filter((name) => words.given(name));
    if (stray.length) throw new UsageFault(`changes the arc's header with ${stray.map((name) => `\`--${name}\``).join(", ")} — leave the row out.`);
    let row = data.rows.find((one) => one.id === rowId);
    if (!row) {
      const title = words.value("title");
      const kind = words.value("kind");
      if (!title || !kind) throw new UsageFault(`adds row ${rowId} with \`--title\` and \`--kind\`.`);
      row = { id: rowId, parent: arc, title, kind, state: "waiting" };
      rowFields(row, words);
      data.rows.push(row);
      // A row that now has rows under it takes its state from them.
      const parents = parentIds(data.rows);
      for (const one of data.rows) if (parents.has(one.id)) delete one.state;
      typed(() => writeArc(ws, data!));
      logEvent(ws, arc, "added", rowId, note ?? title);
      said.push(`row ${rowId} added`);
    } else {
      const was = stateOfRow(data.rows, row);
      const changed = rowFields(row, words);
      if (!changed.length && !note) throw new UsageFault("changes nothing: name a field, or `--note`.");
      if (changed.length) typed(() => writeArc(ws, data!));
      const kind = changed.includes("state") ? row.state! : changed.length ? "changed" : "note";
      logEvent(ws, arc, kind, rowId, note ?? (changed.includes("state") ? `${was} → ${row.state}` : `changed ${changed.join(", ")}`));
      said.push(changed.length ? `row ${rowId} · ${changed.join(", ")}` : `row ${rowId} · log line written`);
    }
  }
  const refreshed = refreshIfMoved(ws, before);
  const { done, total } = doneOf(data);
  console.log(`ok · ${arc} ${done}/${total} · ${[...said, ...refreshed.said].join(" · ")}`);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  return 0;
}

export const actions: Record<string, Action> = {
  write: {
    describe: "open an arc or change its header and status; add a row or change its fields and state; --note writes a log line",
    usage: "<arc> [<row>] [--title …] [--subject …] [--goal …] [--status …] [--reason …] [--kind …] [--state …] [--blocked-by …] [--touches …] [--position …] [--note …] …",
    run: write,
  },
};
