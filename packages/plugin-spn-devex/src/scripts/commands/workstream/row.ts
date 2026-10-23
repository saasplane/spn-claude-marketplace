// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is named for the cycle it pays · § The commands · § The formats · § The life of an arc, and every file it touches · § An arc's status says which of eight states it is in · § An arc opens when its work can be reviewed on its own, and a workstream ideates one at a time
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
//
// An arc's design rows run under PROPOSED, and only the developer's go moves it (RD.DEVEX.WORKSPACE.278). A row
// added while its arc is PROPOSED takes the kind `design` from the command, whatever `--kind` says, and needs no
// `--kind`; on any other arc `--kind design` is refused, and a row's kind is never moved to or from `design`. The go
// is its own write, and it carries the developer's words: `--status DECIDED --note "<their words>"`. A move out of
// PROPOSED without `--note` is refused, and no write moves a PROPOSED arc to RUNNING. A build row starts only after
// the go: one written `running` or `landed` on a PROPOSED arc is refused, and on an arc at DECIDED, HELD or
// PART-LANDED it moves the arc to RUNNING. It never sets LANDED, CARRIED or DROPPED: the last row landed prints a
// line asking for `--status LANDED`, except on a PROPOSED arc, whose next step is the go.
//
// A workstream ideates one arc at a time (RD.DEVEX.WORKSPACE.280). While one arc reads PROPOSED, opening another
// is refused unless `--note` carries the developer's words, and the refusal names the arc being ideated.
//
//   spn-devex workstream row discard <arc> <row> --note "<the developer's words>"
//
// A row found invalid or not needed leaves the arc's data (RD.DEVEX.WORKSPACE.279). The log keeps one
// `discarded` line with the words and the row's What; no state is written. Only a row that never reached
// its node goes: waiting, ready or deferred, with no rows under it and no row waiting on it.

import { basename } from "node:path";
import { type Action, VALUE, UsageFault, readWords, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { STATUSES, TERMINAL } from "../../checks/arc-status.ts";
import { arcIdsOf, doneOf, logEvent, newArc, readArc, stateOfRow, writeArc } from "../../lib/workstream.ts";
import { ALTITUDES, DESIGN_KIND, ROW_ID, ROW_KINDS, ROW_STATES, isBuildRow, parentIds, subjectFault, type ArcData, type ArcRow } from "../../lib/workstream-schema.ts";
import { afterWrite, arcNamed, arcSignatures, listOf, refreshIfMoved, typed } from "./_shared.ts";

export const describe = "open an arc or change its header, add a row or change its fields and its state, or discard a row found invalid";

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

/** Whether a `--note` carries words: the developer's, where a write needs them. */
const hasWords = (note: string | null): note is string => !!note?.trim();

/**
 * RD.DEVEX.WORKSPACE.278: an arc leaves PROPOSED only with the developer's words in the same write, and never to
 * RUNNING. Throws where `--status` would move an arc at `was` against that.
 */
function goGuard(arc: string, was: string, words: Words): void {
  const status = words.value("status");
  if (was !== "PROPOSED" || !status || status === "PROPOSED") return;
  if (status === "RUNNING")
    throw new UsageFault(`keeps ${arc} at PROPOSED: no write moves a \`PROPOSED\` arc to \`RUNNING\`. The go is \`--status DECIDED --note "<the developer's words>"\`, and a build row written running after it moves the arc on (RD.DEVEX.WORKSPACE.278).`);
  if (!hasWords(words.value("note")))
    throw new UsageFault(`keeps ${arc} at PROPOSED: an arc leaves \`PROPOSED\` only with the developer's words in the same write — \`--status ${status} --note "<their words>"\` (RD.DEVEX.WORKSPACE.278).`);
}

/**
 * RD.DEVEX.WORKSPACE.280: a workstream ideates one arc at a time. Throws where another arc reads PROPOSED and the
 * opening write carries no words of the developer's, naming the arc being ideated.
 */
function openingGuard(ws: string, arc: string, note: string | null): void {
  if (hasWords(note)) return;
  const ideated = arcIdsOf(ws).filter((other) => other !== arc && readArc(ws, other)?.status === "PROPOSED");
  if (!ideated.length) return;
  const named = ideated.join(", ");
  throw new UsageFault(`refuses to open ${arc}: ${basename(ws)} is ideating ${named} — a new arc opens when ${named} has its go, ` +
    `or with the developer's words: \`--note "<their words>"\` (RD.DEVEX.WORKSPACE.280).`);
}

/**
 * RD.DEVEX.WORKSPACE.278: the kind of a row added to an arc at `status` — `design` while the arc is PROPOSED,
 * whatever was typed, and else the kind typed, which is never `design`.
 */
function kindAdded(arc: string, rowId: string, status: string, typedKind: string | null): string | null {
  if (status === "PROPOSED") return DESIGN_KIND;
  if (typedKind === DESIGN_KIND)
    throw new UsageFault(`gives \`design\` only to a row added while its arc is \`PROPOSED\`, and ${arc} is ${status}: row ${rowId} is a build row — \`--kind\` ${ROW_KINDS.filter((one) => one !== DESIGN_KIND).join(" · ")} (RD.DEVEX.WORKSPACE.278).`);
  return typedKind;
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
  let closing = false;

  if (rowId === undefined) {
    const stray = ROW_ONLY.filter((name) => words.given(name));
    if (stray.length) throw new UsageFault(`changes a row with ${stray.map((name) => `\`--${name}\``).join(", ")} — name the row after the arc.`);
    goGuard(arc, data?.status ?? "PROPOSED", words);
    if (!data) {
      const title = words.value("title");
      if (!title || !subject) throw new UsageFault(`opens ${arc} with \`--title\` and \`--subject\`.`);
      openingGuard(ws, arc, note);
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
      const kind = kindAdded(arc, rowId, data.status, words.value("kind"));
      if (!title || !kind) throw new UsageFault(`adds row ${rowId} with \`--title\` and \`--kind\`.`);
      row = { id: rowId, parent: arc, title, kind, state: "waiting" };
      rowFields(row, words);
      row.kind = kind;
      data.rows.push(row);
      // A row that now has rows under it takes its state from them.
      const parents = parentIds(data.rows);
      for (const one of data.rows) if (parents.has(one.id)) delete one.state;
      typed(() => writeArc(ws, data!));
      logEvent(ws, arc, "added", rowId, note ?? title);
      said.push(`row ${rowId} added`);
    } else {
      const was = stateOfRow(data.rows, row);
      const wasKind = row.kind;
      const changed = rowFields(row, words);
      if (!changed.length && !note) throw new UsageFault("changes nothing: name a field, or `--note`.");
      // RD.DEVEX.WORKSPACE.278: the command gives `design`, so no hand moves a row to it or from it.
      if (changed.includes("kind") && (wasKind === DESIGN_KIND || row.kind === DESIGN_KIND))
        throw new UsageFault(`keeps row ${rowId} a ${wasKind} row: a row's kind is never moved to or from \`design\` by hand — the command gives it to every row added while its arc is \`PROPOSED\` (RD.DEVEX.WORKSPACE.278).`);
      const starts = changed.includes("state") && ["running", "landed"].includes(row.state!) && isBuildRow(row);
      // A build row starts only after the go.
      if (starts && data.status === "PROPOSED")
        throw new UsageFault(`keeps row ${rowId} ${was}: ${arc} is PROPOSED, and a build row starts only after the developer's go — \`row write ${arc} --status DECIDED --note "<their words>"\` (RD.DEVEX.WORKSPACE.278).`);
      // After the go, a build row that runs or lands moves a decided, held or part-landed arc to RUNNING.
      const startedFrom = starts && ["DECIDED", "HELD", "PART-LANDED"].includes(data.status) ? data.status : null;
      if (startedFrom) { data.status = "RUNNING"; data.reason = null; }
      if (changed.length) typed(() => writeArc(ws, data!));
      const kind = changed.includes("state") ? row.state! : changed.length ? "changed" : "note";
      logEvent(ws, arc, kind, rowId, note ?? (changed.includes("state") ? `${was} → ${row.state}` : `changed ${changed.join(", ")}`));
      said.push(changed.length ? `row ${rowId} · ${changed.join(", ")}` : `row ${rowId} · log line written`);
      if (startedFrom) {
        logEvent(ws, arc, "status", null, `${startedFrom} → RUNNING · row ${rowId} ${row.state}`);
        said.push(`${arc} ${startedFrom} → RUNNING`);
      }
      if (changed.includes("state") && row.state === "landed" && !TERMINAL.has(data.status) && data.status !== "PROPOSED") {
        const counted = doneOf(data);
        if (counted.total > 0 && counted.done === counted.total) closing = true;
      }
    }
  }
  const refreshed = refreshIfMoved(ws, before);
  const { done, total } = doneOf(data);
  console.log(`ok · ${arc} ${done}/${total} · ${[...said, ...refreshed.said].join(" · ")}`);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  if (closing) console.log(`every row landed: write --status LANDED once proven`);
  return 0;
}

/** The states a row may be discarded from: none of them has reached its node. */
const DISCARDABLE = new Set(["waiting", "ready", "deferred"]);

function discard(args: string[]): number {
  const words = readWords(args, { note: VALUE });
  const [ref, rowId, ...more] = words.paths;
  if (!rowId || more.length) throw new UsageFault("takes an arc and one row: `row discard <arc> <row> --note \"…\"`.");
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
    throw new UsageFault(`keeps row ${rowId}: it is ${row.state}, and only a row that never reached its node is discarded — waiting, ready or deferred (RD.DEVEX.WORKSPACE.279).`);

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
  if (total > 0 && done === total && !TERMINAL.has(data.status)) console.log(`every row landed: write --status LANDED once proven`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: {
    describe: "open an arc or change its header and status; add a row or change its fields and state; --note writes a log line",
    usage: "<arc> [<row>] [--title …] [--subject …] [--goal …] [--status …] [--reason …] [--kind …] [--state …] [--blocked-by …] [--touches …] [--position …] [--note …] …",
    run: write,
  },
  discard: {
    describe: "take a row found invalid or not needed out of the arc; --note carries the developer's words into its one log line",
    usage: "<arc> <row> --note \"…\"",
    run: discard,
  },
};
