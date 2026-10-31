// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The approach page keeps up with its arcs · § The commands · § The formats · § The life of an arc, and every file it touches · § An arc's status is one of six, stored or worked out · § Shaping: arcs open as the plan becomes clear
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream arc edit <workstream>/N<nnn> [--title …] [--goal …] [--status …] [--wait …] [--reason …] [--start] [--review-fixes] [--subject …] [--under …] [--preview …] …
//   spn-devex workstream arc stamp write <workstream>/N<nnn>
//   spn-devex workstream arc delete <workstream>/N<nnn> --note "<the developer's words>"
//
// `arc edit` is the one writer of an arc's header; a row's field is `row edit`'s. Given an arc that does not exist, it opens it as PROPOSED with
// `--title`, `--subject` and `--goal`, and leaves the page whole (RULE.DEVEX.WORKSPACE.254). The stored status is the developer's words
// (RULE.DEVEX.WORKSPACE.307, .311): every move of it, a wait and a start need `--note`. `stamp` is the stamp's only writer, and `delete` takes
// out an arc never decided; one ever decided is dropped (RULE.DEVEX.WORKSPACE.311).

import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { STORED_STATUSES } from "../../checks/arc-status.ts";
import { stepRowFindings } from "../../checks/workstream-state.ts";
import {
  NOTES, PREVIEW_FILE, approachOf, arcDataDir, arcIdsOf, arcStamp, arcStatus, doneOf, everDecided, logEvent, logLinesOf, newArc, notesDirOf, previewFromTemplate, previewHrefOf, previewOf,
  previewPathFault, proposedLines, readArc, readJsonl, restamped, sheetFileOf, stampsOn, suggestionsFileOf, whatEntryOf, whatId, withEntryLink, withWhatEntry, workspaceOf, writeArc, writeJsonl, writeWhole,
} from "../../lib/workstream.ts";
import { isFile } from "../../lib/payload.ts";
import { candidatesAt, precedentFor, wordsOf } from "../../lib/precedent.ts";
import { refreshViews } from "../docs/cycles.ts";
import { SHEET_SCHEMA_VERSION, subjectFault, type ArcData } from "../../lib/workstream-schema.ts";
import { sheetFindings } from "./sheet.ts";
import { ROW_FLAGS, afterWrite, arcNamed, arcSignatures, listOf, refreshIfMoved, refuseFlags, typed } from "./_shared.ts";

export const describe = "an arc's header written, opened or changed; the stamp an arc's Cycles row carries, written once the page is current with its goal, title and repositories; or an arc never decided, deleted";

const HEADER_TEXT = ["title", "subject", "goal", "reason", "decides", "cycle", "follows", "model"] as const;

const OPTIONS = {
  title: VALUE, subject: VALUE, goal: VALUE, status: STORED_STATUSES, reason: VALUE, wait: VALUE, start: FLAG, "review-fixes": FLAG, decides: VALUE, repos: VALUE, cycle: VALUE, follows: VALUE,
  model: VALUE, position: VALUE, preview: VALUE, under: VALUE, note: VALUE, carries: VALUE,
} as const;

const TITLE_WORDS = 5;

/**
 * The earlier decisions and rules that speak to an arc's title and goal, at most five, those that share the most of the
 * title's words first (the register's order breaks a tie), and how many more there are. None where nothing speaks to it.
 */
function rankedPrecedent(root: string | null, title: string, goal: string, limit = 5): string[] {
  const found = precedentFor(`${title} ${goal}`, candidatesAt(root));
  if (!found.length) return [];
  const named = wordsOf(title);
  const shared = (text: string): number => { const held = new Set(wordsOf(text)); return named.filter((word) => held.has(word)).length; };
  const ranked = found.map((one, at) => ({ one, at, shared: shared(one.text) })).sort((a, b) => b.shared - a.shared || a.at - b.at).map((one) => one.one);
  const cut = (text: string): string => (text.length > 110 ? `${text.slice(0, 107)}...` : text);
  return [
    `already decided or ruled on this subject (${found.length}): read before going on`,
    ...ranked.slice(0, limit).map((one) => `  ${one.id} · ${cut(one.text)} · ${one.where}`),
    ...(found.length > limit ? [`  and ${found.length - limit} more`] : []),
  ];
}

/** What is wrong with an arc's title, as the words a refusal ends with, or null where it is a topic name: at most five words, no comma. */
function titleFault(title: string): string | null {
  const words = title.split(/\s+/).filter(Boolean).length;
  if (title.includes(",")) return "holds a comma";
  return words > TITLE_WORDS ? `is ${words} words` : null;
}

/** Moves the suggestions an arc carries to a state, in the workstream's suggestions file; the names of those that moved. */
function moveCarried(ws: string, ids: readonly string[], to: string, only: string | null = null): string[] {
  const file = suggestionsFileOf(ws);
  const records = readJsonl(file).filter((line): line is Record<string, unknown> => !!line && typeof line === "object");
  const moved = records.filter((one) => ids.includes(String(one.id)) && one.state !== to && (only === null || one.state === only));
  for (const one of moved) one.state = to;
  if (moved.length) writeJsonl(file, records);
  return moved.map((one) => String(one.id));
}

/** The header as the words change it; the names of the fields that changed. */
function header(data: ArcData, words: Words): string[] {
  const changed: string[] = [];
  for (const name of HEADER_TEXT) {
    const value = words.value(name);
    if (value !== null && data[name] !== value) { (data as Record<string, unknown>)[name] = value; changed.push(name); }
  }
  const repos = listOf(words, "repos");
  if (repos) { data.repos = repos; changed.push("repos"); }
  const carries = listOf(words, "carries");
  if (carries) { data.carries = carries; changed.push("carries"); }
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

/** Whether a `--note` carries words: the developer's, where a write needs them. */
const hasWords = (note: string | null): note is string => !!note?.trim();

/**
 * RULE.DEVEX.WORKSPACE.307 and .311: the stored status is the developer's words. Throws where a write would store a
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
    throw new UsageFault(`keeps ${arc} at ${was}: a status is the developer's words, so it moves only with them in the same write — \`--status ${status} --note "<the developer's words>"\` (RULE.DEVEX.WORKSPACE.307).`);
  if (moves && status === "LANDED" && data?.reviewFixes !== true)
    throw new UsageFault(`keeps ${arc} at ${was}: its steps work out LANDED when the last one and its proof land, and only the review-fixes arc stores it, at the close (RULE.DEVEX.WORKSPACE.307).`);
  if (moves && status === "DROPPED" && !decidedBefore)
    throw new UsageFault(`keeps ${arc}: an arc never decided is deleted, not dropped — \`workstream arc delete ${arc} --note "<the developer's words>"\` (RULE.DEVEX.WORKSPACE.311).`);
  const after = status ?? was;
  if ((words.value("wait") !== null || words.given("start")) && after !== "DECIDED")
    throw new UsageFault(`holds or starts only a decided arc, and ${arc} is ${after} (RULE.DEVEX.WORKSPACE.311).`);
  if ((words.value("wait") !== null || words.given("start")) && !said)
    throw new UsageFault(`keeps ${arc} as it is: a wait and a start are the developer's words — add \`--note "<the developer's words>"\` (RULE.DEVEX.WORKSPACE.311).`);
  if (words.given("start") && !data?.wait)
    throw new UsageFault(`finds no wait on ${arc} to clear: it starts as soon as a step does (RULE.DEVEX.WORKSPACE.311).`);
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
function openingLines(data: ArcData, pieces: Pieces): string[] {
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
 * RULE.DEVEX.WORKSPACE.254: the three pieces an arc owes beside its data, each written only where it is missing, in the
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

/** The words that say which suggestions an arc took up: none where none moved. */
const movedWords = (ids: string[], to: string): string[] => (ids.length ? [`${ids.join(", ")} ${to}`] : []);
const shapedWords = (ws: string, ids: readonly string[]): string[] => movedWords(moveCarried(ws, ids, "shaped", "raised"), "shaped");

function edit(args: string[]): number {
  refuseFlags(args, ROW_FLAGS, (name) => `does not take \`--${name}\`: it is a row's field — \`row edit <workstream>/N<nnn> <row> --${name} …\` changes it, and \`row add\` adds the row.`);
  const words = readWords(args, OPTIONS);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc; a row is `row edit <workstream>/N<nnn> <row>`.");
  const { ws, arc } = arcNamed(ref, true);
  const note = words.value("note");
  const subject = words.value("subject");
  const short = subject === null ? null : subjectFault(subject);
  if (short) throw new UsageFault(`takes a short subject: \`${subject}\` ${short}, such as \`layout-model\` (RULE.DEVEX.WORKSPACE.265).`);
  let data = readArc(ws, arc);
  const said: string[] = [];
  const before = arcSignatures(ws);
  let goes = false;
  let previewMoved = false;
  let opened: Pieces | null = null;
  let repaired: Pieces | null = null;
  let bare = false;
  const precedent: string[] = [];
  const under = words.value("under");
  const titled = words.value("title");
  const long = titled === null ? null : titleFault(titled);
  if (long) throw new UsageFault(`takes a topic name of at most five words for an arc's title: \`${titled}\` ${long}. Keep the sentence in the goal.`);

  if (!data) {
    const title = words.value("title");
    if (!title || !subject || !words.value("goal")?.trim())
      throw new UsageFault(`opens ${arc} with \`--title\`, \`--subject\` and \`--goal\`: an arc opens only when all three are known, and until then its line stays in How (RULE.DEVEX.WORKSPACE.254).`);
    const reviewFixes = words.given("review-fixes");
    if (reviewFixes) {
      const other = arcIdsOf(ws).find((one) => readArc(ws, one)?.reviewFixes === true);
      if (other) throw new UsageFault(`keeps one review-fixes arc: ${other} takes every fix to a landed arc (RULE.DEVEX.WORKSPACE.261).`);
      if (!hasWords(note)) throw new UsageFault(`opens the review-fixes arc on the developer's words: \`--note "<their words>"\` (RULE.DEVEX.WORKSPACE.261).`);
    }
    data = newArc(arc, subject, title);
    if (reviewFixes) { data.reviewFixes = true; data.status = "DECIDED"; }
    wordsGuard(arc, null, reviewFixes, words);
    header(data, words);
    foresee(ws, data, under);
    typed(() => writeArc(ws, data!));
    writeWhole(sheetFileOf(ws, arc), `${JSON.stringify({ schemaVersion: SHEET_SCHEMA_VERSION, releaseChain: [], dependsOn: [], stack: null, entries: [] }, null, 2)}\n`);
    logEvent(ws, arc, "opened", null, note ? `opened as ${data.status} · ${note}` : `opened as ${data.status}`);
    said.push(`${arc} opened · ${data.status}${reviewFixes ? " · review fixes" : ""}`);
    opened = leavePageWhole(ws, data, under);
    said.push("preview", "What entry", "Cycles row");
    if (data.carries?.length) said.push(...shapedWords(ws, data.carries));
    precedent.push(...rankedPrecedent(workspaceOf(), title, words.value("goal") ?? ""));
  } else {
    const was = data.status;
    wordsGuard(arc, data, everDecided(data, logLinesOf(ws, arc)), words);
    const oldHref = previewHrefOf(arc, data);
    const changed = header(data, words);
    if (was === "PROPOSED" && data.status === "DECIDED") {
      const found = sheetFindings(ws, arc);
      if (found.length) {
        console.log(`Refused: ${arc} stays PROPOSED while its sheet reads ${found.length} finding${found.length === 1 ? "" : "s"} — bring each current, then give the go: ${found.join(" · ")}. Nothing was written.`);
        return 1;
      }
    }
    // A bare edit, or one with `--under`, leaves the page whole: whatever of the preview, the What entry and the Cycles row is missing.
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
    if (changed.includes("carries")) said.push(...shapedWords(ws, data.carries ?? []));
    if (goes && data.carries?.length) said.push(...movedWords(moveCarried(ws, data.carries, "decided"), "decided"));
    if (changed.includes("status") && data.status === "DROPPED" && data.carries?.length) said.push(...movedWords(moveCarried(ws, data.carries, "dropped"), "dropped"));
  }
  // A preview that moved is a view moved: the Cycles row links it in the same write.
  const refreshed = refreshIfMoved(ws, before, previewMoved);
  const { done, total } = doneOf(data);
  console.log(`ok · ${bare ? arc : `${arc} ${done}/${total}`} · ${[...said, ...refreshed.said].join(" · ")}`);
  if (opened) for (const line of openingLines(data, opened)) console.log(line);
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  for (const line of stepRowFindings(data)) console.log(`note: ${line}`);
  if (goes) for (const line of previewProposals(ws, arc)) console.log(line);
  for (const line of precedent) console.log(line);
  if (goes) console.log(`Next: \`workstream go write ${basename(ws)}/${arc} --scope ${arc}\`.`);
  return 0;
}

/**
 * RULE.DEVEX.WORKSPACE.273: the go's write lists each line of the arc's preview whose text still says "proposed",
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

function stamp(args: string[]): number {
  const words = readWords(args);
  const [verb, ref, ...more] = words.paths;
  if (verb !== "write") throw new UsageFault("is typed `arc stamp write <arc>`.");
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const data = readArc(ws, arc)!;
  const page = approachOf(ws);
  if (!page) throw new UsageFault(`finds no approach page beside ${arc}'s workstream.`);
  const value = arcStamp(data);
  const text = readFileSync(page, "utf8");
  const next = restamped(text, arc, value);
  if (next === null) {
    console.error(`${arc} has no row in Cycles carrying \`data-arc="arcs/${arc}/state.json"\` — run \`spn-devex docs cycles write\` first. Nothing was written.`);
    return 1;
  }
  if (next !== text) writeFileSync(page, next, "utf8");
  logEvent(ws, arc, "stamped", null, value);
  console.log(`${arc} · stamped ${value}`);
  return 0;
}

/** Deletes an arc never decided: its data and its notes folders, and its row on the page with the views refreshed. */
function remove(args: string[]): number {
  const words = readWords(args, { note: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const note = words.value("note");
  if (!note?.trim()) throw new UsageFault("deletes an arc on the developer's words: `--note \"<their words>\"` (RULE.DEVEX.WORKSPACE.311).");
  const { ws, arc } = arcNamed(ref);
  const data = readArc(ws, arc);
  if (!data) throw new UsageFault(`finds no ${arc}.`);
  if (everDecided(data, logLinesOf(ws, arc)))
    throw new UsageFault(`keeps ${arc}: it was decided, so it is dropped, never deleted — \`arc edit ${arc} --status DROPPED --reason "…" --note "<the developer's words>"\` (RULE.DEVEX.WORKSPACE.311).`);
  rmSync(arcDataDir(ws, arc), { recursive: true, force: true });
  rmSync(notesDirOf(ws, arc), { recursive: true, force: true });
  const { views } = refreshViews(ws);
  console.log(`${arc} · deleted, never decided · ${note}${views.length ? ` · ${views.join(" · ")}` : ""}`);
  for (const line of afterWrite(ws)) console.log(line);
  return 0;
}

export const actions: Record<string, Action> = {
  edit: {
    describe: "open an arc, or change any field of its header and its status; --note writes a log line",
    usage: "<workstream>/N<nnn> [--title …] [--goal …] [--status …] [--wait …] [--reason …] [--start] [--review-fixes] [--subject …] [--under …] [--preview …] [--decides …] [--repos …] [--cycle …] [--follows …] [--model …] [--position …] [--note …]",
    run: edit,
  },
  stamp: { describe: "write: restamp an arc's Cycles row once its part of the page is current", usage: "write <workstream>/N<nnn>", run: stamp },
  delete: { describe: "delete an arc never decided, on the developer's words", usage: "<workstream>/N<nnn> --note \"…\"", run: remove },
};
