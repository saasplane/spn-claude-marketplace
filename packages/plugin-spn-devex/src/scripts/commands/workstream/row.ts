// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is cut by what is reviewed and released together, and named for its domain · § The commands · § The formats · § The life of an arc, and every file it touches · § An arc's status is one of six, stored or worked out · § Shaping: arcs open as the plan becomes clear
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream row write <arc> [<row>] [--field value …] [--position <n>] [--note "…"]
//
// Given the arc alone, it opens the arc as PROPOSED (`--title`, `--subject` and `--goal` all needed: an arc opens only
// when all three are known), or changes its header and its status; `--goal` is the outcome the arc's name file leads
// with, and `--subject` takes one to three words of at most 24 characters. The opening is one write that leaves the page
// whole (RD.DEVEX.WORKSPACE.254): the arc's data, its preview `notes/N<nnn>/preview.html` from the template, its What entry
// `N<nnn>-what` (at the end of the part of the domain heading `--under` names, as an anchor on the subject heading `--under`
// names, or at the end of What) and its stamped Cycles row. Given the arc alone again, it writes whatever of the four is
// missing and changes nothing that is there; `--under` with the id of a subject heading anchors an arc that already exists. `--preview` takes the path from the workstream folder to the
// arc's preview where its notes live in another workstream, as a carried arc's do, and the arc's Cycles row
// links it; `--preview preview.html` gives the fixed place back. Every write of the data writes the arc's name file too. Given a row, it adds the row (`--title` and `--kind` needed) or changes its
// fields and its state. A list option takes values separated by commas, and `none` empties it.
// `--note` alone writes a line on the arc's log, which has no other writer. A write that moves an arc's
// status or a row's state refreshes every view of it (RD.DEVEX.WORKSPACE.273), and says which.
//
// The developer's words are stored (RD.DEVEX.WORKSPACE.307): `--status` takes PROPOSED, DECIDED, CARRIED, DROPPED,
// and LANDED for the review-fixes arc at the close; RUNNING and LANDED are otherwise worked out from the steps by
// `arcStatus`. The go is its own write, with the developer's words: `--status DECIDED --note "<their words>"`, logged
// beside the move. Every move of the stored status needs `--note`. `--wait "<their words>"` holds a decided arc, and
// `--start --note "…"` clears the wait (RD.DEVEX.WORKSPACE.311). A move back to PROPOSED stops the arc's running steps.
// DROPPED is for an arc decided before; one never decided is deleted with `arc delete`. `--review-fixes` opens the
// review-fixes arc, DECIDED on the developer's words, one per workstream (RD.DEVEX.WORKSPACE.261). The go lists each
// line of the arc's preview whose text says "proposed", and checks none of them (RD.DEVEX.WORKSPACE.273).
//
// Steps are build steps of the kinds `fix`, `change` and `question` (RD.DEVEX.WORKSPACE.278). They may be written
// before the go; one written `running` or `landed` is refused unless the arc is DECIDED with no wait. A step is never
// added to an arc that reads LANDED: a landed arc is never reopened, and its fix goes on the review-fixes arc.
//
// After each write it names, in a `note:` line, a step with no repo or no altitude and a step out of chain order
// (RD.DEVEX.WORKSPACE.183). It refuses nothing for them: the chain between two stacks is judgement.
//
//   spn-devex workstream row discard <arc> <row> --note "<the developer's words>"
//
// A row found invalid or not needed leaves the arc's data (RD.DEVEX.WORKSPACE.279). The log keeps one
// `discarded` line with the words and the row's What; no state is written. Only a row that never reached
// its node goes: waiting, ready or deferred, with no rows under it and no row waiting on it.

import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { STORED_STATUSES } from "../../checks/arc-status.ts";
import {
  NOTES, PREVIEW_FILE, approachOf, arcIdsOf, arcStamp, arcStatus, doneOf, everDecided, logEvent, logLinesOf, newArc, previewFromTemplate, previewHrefOf, previewOf, previewPathFault, proposedLines, readArc,
  restamped, stampsOn, stateOfRow, stepsMayStart, whatEntryOf, whatId, withEntryLink, withWhatEntry, writeArc, writeWhole,
} from "../../lib/workstream.ts";
import { isFile } from "../../lib/payload.ts";
import { refreshViews } from "../docs/cycles.ts";
import { ALTITUDES, ROW_ID, ROW_KINDS, ROW_STATES, parentIds, subjectFault, type ArcData, type ArcRow } from "../../lib/workstream-schema.ts";
import { afterWrite, arcNamed, arcSignatures, listOf, refreshIfMoved, typed } from "./_shared.ts";
import { stepRowFindings } from "../../checks/workstream-state.ts";

export const describe = "open an arc or change its header, add a row or change its fields and its state, or discard a row found invalid";

const HEADER_TEXT = ["title", "subject", "goal", "reason", "decides", "cycle", "follows", "model"] as const;
const ROW_TEXT = ["parent", "title", "repo", "mechanism", "acceptance", "model", "proof", "order"] as const;
const ROW_LISTS: Record<string, keyof ArcRow> = { "blocked-by": "blockedBy", touches: "touches", decisions: "decisions", facts: "facts" };

const OPTIONS = {
  title: VALUE, subject: VALUE, goal: VALUE, status: STORED_STATUSES, reason: VALUE, wait: VALUE, start: FLAG, "review-fixes": FLAG, decides: VALUE, repos: VALUE, cycle: VALUE, follows: VALUE,
  model: VALUE, parent: VALUE, kind: ROW_KINDS, repo: VALUE, altitude: ALTITUDES, mechanism: VALUE, acceptance: VALUE,
  "blocked-by": VALUE, touches: VALUE, decisions: VALUE, facts: VALUE, state: ROW_STATES, proof: VALUE, order: VALUE, note: VALUE, position: VALUE,
  preview: VALUE, under: VALUE,
} as const;

const ROW_ONLY = ["parent", "kind", "repo", "altitude", "mechanism", "acceptance", "blocked-by", "touches", "decisions", "facts", "state", "proof", "order"];
const HEADER_ONLY = ["under", "subject", "goal", "status", "reason", "wait", "start", "review-fixes", "decides", "repos", "cycle", "follows", "position", "preview"];

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
  const preview = words.value("preview");
  if (preview !== null) {
    const fault = previewPathFault(preview);
    if (fault) throw new UsageFault(`takes \`--preview\` as the path from the workstream folder to the arc's preview, such as \`../030-next/notes/N002/${PREVIEW_FILE}\`: \`${preview}\` ${fault}.`);
    if (data.preview !== preview) { data.preview = preview; changed.push("preview"); }
  }
  const status = words.value("status");
  if (status && status !== data.status) {
    data.status = status;
    if (!["CARRIED", "DROPPED"].includes(status) && !words.given("reason")) data.reason = null;
    if (status !== "DECIDED") data.wait = null;
    changed.push("status");
  }
  const wait = words.value("wait");
  if (wait !== null && data.wait !== wait) { data.wait = wait; changed.push("wait"); }
  if (words.given("start") && data.wait) { data.wait = null; changed.push("start"); }
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
 * RD.DEVEX.WORKSPACE.307 and .311: the stored status is the developer's words. Throws where a write would store a
 * status, a wait or a start against them: any move of the stored status, a wait or a start without `--note`; a wait
 * or a start on an arc that is not DECIDED; a start with no wait; LANDED stored on any arc but the review-fixes arc;
 * DROPPED on an arc never decided, which `arc delete` deletes instead.
 */
function wordsGuard(arc: string, data: ArcData | null, decidedBefore: boolean, words: Words): void {
  const status = words.value("status");
  const was = data?.status ?? "PROPOSED";
  const moves = !!status && status !== was;
  const said = hasWords(words.value("note"));
  if (moves && !said)
    throw new UsageFault(`keeps ${arc} at ${was}: a status is the developer's words, so it moves only with them in the same write — \`--status ${status} --note "<the developer's words>"\` (RD.DEVEX.WORKSPACE.307).`);
  if (moves && status === "LANDED" && data?.reviewFixes !== true)
    throw new UsageFault(`keeps ${arc} at ${was}: its steps work out LANDED when the last one and its proof land, and only the review-fixes arc stores it, at the close (RD.DEVEX.WORKSPACE.307).`);
  if (moves && status === "DROPPED" && !decidedBefore)
    throw new UsageFault(`keeps ${arc}: an arc never decided is deleted, not dropped — \`workstream arc delete ${arc} --note "<the developer's words>"\` (RD.DEVEX.WORKSPACE.311).`);
  const after = status ?? was;
  if ((words.value("wait") !== null || words.given("start")) && after !== "DECIDED")
    throw new UsageFault(`holds or starts only a decided arc, and ${arc} is ${after} (RD.DEVEX.WORKSPACE.311).`);
  if ((words.value("wait") !== null || words.given("start")) && !said)
    throw new UsageFault(`keeps ${arc} as it is: a wait and a start are the developer's words — add \`--note "<the developer's words>"\` (RD.DEVEX.WORKSPACE.311).`);
  if (words.given("start") && !data?.wait)
    throw new UsageFault(`finds no wait on ${arc} to clear: it starts as soon as a step does (RD.DEVEX.WORKSPACE.311).`);
}

/** What one run of the page pieces did: each piece of an arc's opening, written or kept. */
type Pieces = { preview: "written" | "kept" | "elsewhere"; entry: "written" | "anchored" | "kept"; where: string; cycles: "written" | "stamped" | "kept" };

/** What a repair did, in the words the line carries: the pieces written first, then the ones kept; one word where nothing was missing. */
function repairedWords(pieces: Pieces, arc: string): string[] {
  const entry = `What entry: #${whatId(arc)} ${pieces.entry === "anchored" ? pieces.where : `written ${pieces.where}`}`;
  const done: string[] = [];
  const kept: string[] = [];
  (pieces.preview === "written" ? done : kept).push(pieces.preview === "written" ? "preview written from the template"
    : pieces.preview === "elsewhere" ? "preview not found where its field names it" : "preview kept");
  (pieces.entry === "kept" ? kept : done).push(pieces.entry === "kept" ? "What entry kept" : entry);
  (pieces.cycles === "kept" ? kept : done).push(`Cycles row ${pieces.cycles === "kept" ? "kept" : pieces.cycles === "written" ? "written and stamped" : "stamped"}`);
  return done.length ? [...done, ...kept] : ["whole: nothing written"];
}

/** The detail lines under an opening's one line: where each piece went, as the preview draws them. */
function openingLines(ws: string, data: ArcData, pieces: Pieces): string[] {
  const arc = data.arc;
  const href = previewHrefOf(arc, data);
  const rows: Array<[string, string]> = [
    [`arcs/${arc}/state.json`, `written, with its log line and its name file, ${data.subject}.md`],
    [href, pieces.preview === "written" ? `written from the template: the masthead, the ${arcStatus(data)} badge, the back link to #${whatId(arc)}, four sections to fill`
      : pieces.preview === "kept" ? "kept" : "not found where the arc's preview field names it"],
    ["approach.html · What", pieces.entry === "kept" ? `#${whatId(arc)} kept`
      : pieces.entry === "anchored" ? `#${whatId(arc)} ${pieces.where}`
      : `#${whatId(arc)} written ${pieces.where}: the title, the goal, and the link to ${href}`],
    ["approach.html · Cycles", `row ${arc} ${pieces.cycles === "kept" ? "kept" : "written and stamped"}, its preview linked`],
  ];
  return rows.map(([label, text]) => `  ${label.padEnd(27)}${text}`);
}

/** Throws, before anything is written, where the approach page cannot take the arc's What entry: no page, no What, or no such heading. */
function foresee(ws: string, data: ArcData, under: string | null): void {
  const page = approachOf(ws);
  if (!page) throw new UsageFault(`finds no approach page beside ${data.arc}'s workstream to write its What entry and its Cycles row in.`);
  const text = readFileSync(page, "utf8");
  if (under !== null || whatEntryOf(text, data.arc) === null) typed(() => withWhatEntry(text, data, under));
}

/**
 * RD.DEVEX.WORKSPACE.254: the three pieces an arc owes beside its data, each written only where it is missing, in the
 * order the page needs them: the preview from the template at its fixed place, the What entry `N<nnn>-what`, and the
 * Cycles row with its stamp. Nothing that is there is changed. An arc carried elsewhere keeps its preview where its
 * `preview` field names it, and its What entry links it there. Throws, before it writes anything, where `under` names
 * no heading of What.
 */
function leavePageWhole(ws: string, data: ArcData, under: string | null): Pieces {
  const page = approachOf(ws);
  if (!page) throw new UsageFault(`finds no approach page beside ${data.arc}'s workstream to write its What entry and its Cycles row in.`);
  const arc = data.arc;
  let text = readFileSync(page, "utf8");
  const needsEntry = whatEntryOf(text, arc) === null;
  const entry = needsEntry ? typed(() => withWhatEntry(text, data, under)) : null;
  const pieces: Pieces = { preview: "kept", entry: "kept", where: "", cycles: "kept" };
  const previewPath = resolve(ws, previewHrefOf(arc, data));
  if (!isFile(previewPath)) {
    if (previewHrefOf(arc, data) === `${NOTES}/${arc}/${PREVIEW_FILE}`) {
      typed(() => writeWhole(previewPath, previewFromTemplate(ws, { arc, subject: data.subject, title: data.title, status: arcStatus(data) })));
      pieces.preview = "written";
    } else pieces.preview = "elsewhere";
  }
  if (entry) {
    text = entry.text;
    pieces.entry = entry.how === "anchor" ? "anchored" : "written";
    pieces.where = entry.where;
  }
  const hadRow = stampsOn(text).get(arc);
  if (pieces.entry !== "kept") writeFileSync(page, text, "utf8");
  if (pieces.entry !== "kept" || pieces.preview === "written" || !hadRow) refreshViews(ws);
  const row = stampsOn(readFileSync(page, "utf8")).get(arc);
  if (row && !row.stamp) {
    const stamped = restamped(readFileSync(page, "utf8"), arc, arcStamp(data));
    if (stamped !== null) writeFileSync(page, stamped, "utf8");
    pieces.cycles = hadRow ? "stamped" : "written";
  }
  return pieces;
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
  const statusBefore = data ? arcStatus(data) : null;
  let goes = false;
  let previewMoved = false;
  let opened: Pieces | null = null;
  let repaired: Pieces | null = null;
  let bare = false;
  const under = words.value("under");

  if (rowId === undefined) {
    const stray = ROW_ONLY.filter((name) => words.given(name));
    if (stray.length) throw new UsageFault(`changes a row with ${stray.map((name) => `\`--${name}\``).join(", ")} — name the row after the arc.`);
    if (!data) {
      const title = words.value("title");
      if (!title || !subject || !words.value("goal")?.trim())
        throw new UsageFault(`opens ${arc} with \`--title\`, \`--subject\` and \`--goal\`: an arc opens only when all three are known, and until then its line stays in How (RD.DEVEX.WORKSPACE.254).`);
      const reviewFixes = words.given("review-fixes");
      if (reviewFixes) {
        const other = arcIdsOf(ws).find((one) => readArc(ws, one)?.reviewFixes === true);
        if (other) throw new UsageFault(`keeps one review-fixes arc: ${other} takes every fix to a landed arc (RD.DEVEX.WORKSPACE.261).`);
        if (!hasWords(note)) throw new UsageFault(`opens the review-fixes arc on the developer's words: \`--note "<their words>"\` (RD.DEVEX.WORKSPACE.261).`);
      }
      data = newArc(arc, subject, title);
      if (reviewFixes) { data.reviewFixes = true; data.status = "DECIDED"; }
      wordsGuard(arc, null, reviewFixes, words);
      header(data, words);
      foresee(ws, data, under);
      typed(() => writeArc(ws, data!));
      logEvent(ws, arc, "opened", null, note ? `opened as ${data.status} · ${note}` : `opened as ${data.status}`);
      said.push(`${arc} opened · ${data.status}${reviewFixes ? " · review fixes" : ""}`);
      opened = leavePageWhole(ws, data, under);
      said.push("preview", "What entry", "Cycles row");
    } else {
      const was = data.status;
      wordsGuard(arc, data, everDecided(data, logLinesOf(ws, arc)), words);
      const oldHref = previewHrefOf(arc, data);
      const changed = header(data, words);
      // A bare write, or one with `--under`, leaves the page whole: whatever of the preview, the What entry and the Cycles row is missing.
      const repairs = (!changed.length && !note) || under !== null;
      // A stored PROPOSED wins over the steps: a changed goal stops what the arc was building.
      const stopped = changed.includes("status") && data.status === "PROPOSED"
        ? data.rows.filter((row) => row.state === "running").map((row) => { row.state = "stopped"; return row.id; }) : [];
      previewMoved = changed.includes("preview");
      if (repairs) foresee(ws, data, under);
      if (changed.length) typed(() => writeArc(ws, data!));
      // A preview carried elsewhere is linked there by the arc's What entry.
      const page = approachOf(ws);
      if (previewMoved && page) {
        const text = readFileSync(page, "utf8");
        const linked = withEntryLink(text, arc, oldHref, previewHrefOf(arc, data));
        if (linked !== text) writeFileSync(page, linked, "utf8");
      }
      if (repairs) repaired = leavePageWhole(ws, data, under);
      // A status line leads with the move, so the log says where the arc went, and the developer's words sit beside it.
      const move = changed.includes("status") ? `${was} → ${data.status}${data.reason ? ` · ${data.reason}` : ""}`
        : changed.includes("wait") ? `${data.status} · wait: ${data.wait}` : changed.includes("start") ? `${data.status} · started` : "";
      const wrote = repaired ? [repaired.preview === "written" ? "preview" : "", repaired.entry !== "kept" ? "What entry" : "", repaired.cycles !== "kept" ? "Cycles row" : ""].filter(Boolean) : [];
      if (move || changed.length || note || wrote.length)
        logEvent(ws, arc, move ? "status" : changed.length || wrote.length ? "header" : "note", null,
          move ? (note ? `${move} · ${note}` : move) : note ?? (changed.length ? `changed ${changed.join(", ")}` : `wrote ${wrote.join(", ")}`));
      for (const id of stopped) logEvent(ws, arc, "stopped", id, "the goal changed: stopped until the developer's next go");
      if (repaired && !changed.length && !note) { said.push(...repairedWords(repaired, arc)); bare = true; }
      else said.push(changed.length ? `${arc} · ${changed.join(", ")}` : `${arc} · log line written`);
      if (stopped.length) said.push(`stopped until the next go: ${stopped.length} step(s)`);
      if (was === "PROPOSED" && data.status === "DECIDED") goes = true;
    }
  } else {
    if (!data) throw new UsageFault(`finds no ${arc} — open it first: \`row write ${ref} --title "…" --subject …\`.`);
    if (!ROW_ID.test(rowId)) throw new UsageFault(`reads \`${rowId}\` as no row id — a row is \`57\`, \`57b\` or \`3e.1\`.`);
    const stray = HEADER_ONLY.filter((name) => words.given(name));
    if (stray.length) throw new UsageFault(`changes the arc's header with ${stray.map((name) => `\`--${name}\``).join(", ")} — leave the row out.`);
    let row = data.rows.find((one) => one.id === rowId);
    const startsNow = (state: string | undefined | null): boolean => ["running", "landed"].includes(state ?? "");
    const mayStart = (state: string | undefined | null): void => {
      if (!startsNow(state) || stepsMayStart(data!)) return;
      const why = data!.status !== "DECIDED" ? `${arc} is ${arcStatus(data!)}, and a step starts only after the developer's go — \`row write ${arc} --status DECIDED --note "<the developer's words>"\``
        : `${arc} holds the developer's wait, "${data!.wait}", and starts at their word — \`row write ${arc} --start --note "<their words>"\``;
      throw new UsageFault(`keeps step ${rowId} from starting: ${why} (RD.DEVEX.WORKSPACE.278).`);
    };
    if (!row) {
      const title = words.value("title");
      const kind = words.value("kind");
      if (!title || !kind) throw new UsageFault(`adds row ${rowId} with \`--title\` and \`--kind\`.`);
      if (statusBefore === "LANDED" || statusBefore === "CARRIED" || statusBefore === "DROPPED")
        throw new UsageFault(`keeps ${arc} as it is: it is ${statusBefore}, and a landed arc is never reopened — a fix to it is a step on the review-fixes arc, naming ${arc}; new scope is a new arc (RD.DEVEX.WORKSPACE.261).`);
      row = { id: rowId, parent: arc, title, kind, state: "waiting" };
      rowFields(row, words);
      mayStart(row.state);
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
      if (changed.includes("state")) mayStart(row.state);
      if (changed.length) typed(() => writeArc(ws, data!));
      const kind = changed.includes("state") ? row.state! : changed.length ? "changed" : "note";
      logEvent(ws, arc, kind, rowId, note ?? (changed.includes("state") ? `${was} → ${row.state}` : `changed ${changed.join(", ")}`));
      said.push(changed.length ? `row ${rowId} · ${changed.join(", ")}` : `row ${rowId} · log line written`);
    }
  }
  // The status the steps work out moved: say so, in the line.
  const statusAfter = arcStatus(data);
  if (statusBefore && statusAfter !== statusBefore && rowId !== undefined) said.push(`${arc} reads ${statusAfter}`);
  // A preview that moved is a view moved: the Cycles row links it in the same write.
  const refreshed = refreshIfMoved(ws, before, previewMoved);
  const { done, total } = doneOf(data);
  console.log(`ok · ${bare ? arc : `${arc} ${done}/${total}`} · ${[...said, ...refreshed.said].join(" · ")}`);
  if (opened) for (const line of openingLines(ws, data, opened)) console.log(line);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  for (const line of stepRowFindings(data)) console.log(`note: ${line}`);
  if (goes) for (const line of previewProposals(ws, arc)) console.log(line);
  return 0;
}

/**
 * RD.DEVEX.WORKSPACE.273: the go's write lists each line of the arc's preview whose text still says "proposed",
 * outside the masthead's status badge, so the agent brings it current, with the preview's `Open`, in the same turn.
 * It lists them and checks nothing.
 */
function previewProposals(ws: string, arc: string): string[] {
  let text: string;
  try { text = readFileSync(previewOf(ws, arc), "utf8"); } catch { return []; }
  const found = proposedLines(text);
  if (!found.length) return [];
  const shown = (words: string): string => (words.length > 110 ? `${words.slice(0, 107)}…` : words);
  return [`the preview still says proposed in ${found.length} line(s) — bring each current now the go is given, with its Open:`,
    ...found.map((one) => `  ${NOTES}/${arc}/${PREVIEW_FILE}:${one.line}  ${shown(one.text)}`)];
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
  return 0;
}

export const actions: Record<string, Action> = {
  write: {
    describe: "open an arc or change its header and status; add a row or change its fields and state; --note writes a log line",
    usage: "<arc> [<row>] [--title …] [--subject …] [--goal …] [--under …] [--status …] [--wait …] [--start] [--review-fixes] [--reason …] [--kind …] [--state …] [--blocked-by …] [--touches …] [--position …] [--preview …] [--note …] …",
    run: write,
  },
  discard: {
    describe: "take a row found invalid or not needed out of the arc; --note carries the developer's words into its one log line",
    usage: "<arc> <row> --note \"…\"",
    run: discard,
  },
};
