// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc carries its specification, or names the note that holds it · § The folder · § An arc is named for the cycle it pays · § Open and backlog workstreams follow the standard as it moves
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 002: every open and backlog workstream gets the fixed tree (RD.DEVEX.WORKSPACE.262), the
// arc's goal and name file (.264), its short subject (.265) and its address on the approach page (.263).
// Folding a note or reading a goal is judgement, so the agent applies it by its steps; the check is
// mechanical and never reads `closed/`.

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { isDir, isFile, listdir } from "../payload.ts";
import {
  NOTES, PREVIEW_FILE, approachOf, arcIdsOf, firstOpenArc, isDataLayout, nameFileHolds, nameFileOf, readArc, stampsOn, strayLevels,
  strayNotes, workstreamsOf,
} from "../workstream.ts";
import { subjectFault } from "../workstream-schema.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** A link to an arc's data, in HTML or Markdown: `href="arcs/N013/state.json"`, `](../../arcs/N013/state.json)`. */
export const DATA_LINK = /(?:href="|\]\(\s*<?)(?:[^"\s)>]*\/)?arcs\/N\d+[a-z]?\/state\.json/g;

/** The pages of a workstream that link an arc: its approach page, and each arc's preview, plan and orders. */
function linkingPages(ws: string): string[] {
  const pages: string[] = [];
  const page = approachOf(ws);
  if (page) pages.push(page);
  for (const arc of listdir(join(ws, NOTES))) {
    const notes = join(ws, NOTES, arc);
    if (!isDir(notes)) continue;
    for (const file of [PREVIEW_FILE, "plan.md"]) if (isFile(join(notes, file))) pages.push(join(notes, file));
    for (const order of listdir(join(notes, "orders"))) if (order.endsWith(".md")) pages.push(join(notes, "orders", order));
  }
  return pages;
}

/** What one workstream kept as data still owes this migration: goals, subjects, name files, addresses and links. */
function addressFindings(ws: string, name: string): string[] {
  const out: string[] = [];
  const page = approachOf(ws);
  let text = "";
  try { text = page ? readFileSync(page, "utf8") : ""; } catch { /* no page */ }
  const rows = stampsOn(text);
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc);
    // Data that does not read is the state check's schema finding, and holds nothing to migrate yet.
    if (!data || typeof data.subject !== "string" || !data.subject) continue;
    if (!(typeof data.goal === "string" && data.goal.trim())) out.push(`${name}/arcs/${arc}: no goal → \`row write ${arc} --goal "…"\`, from its plan's What done means`);
    const short = subjectFault(data.subject);
    if (short) out.push(`${name}/arcs/${arc}: its subject \`${data.subject}\` ${short} → a finding for ${name}'s own window, never shortened by guessing`);
    let current: string | null = null;
    try { current = readFileSync(nameFileOf(ws, arc, data.subject), "utf8"); } catch { /* absent */ }
    if (current === null || !nameFileHolds(ws, data, current)) out.push(`${name}/arcs/${arc}/${data.subject}.md: not as the commands write it → \`docs cycles write\``);
    const row = rows.get(arc);
    if (row && /\bid="([^"]*)"/.exec(row.tag)?.[1] !== arc) out.push(`${name}: ${arc}'s Cycles row carries no \`id="${arc}"\` → \`docs cycles write\``);
  }
  for (const file of linkingPages(ws)) {
    let body = "";
    try { body = readFileSync(file, "utf8"); } catch { continue; }
    const links = body.match(DATA_LINK)?.length ?? 0;
    if (links) out.push(`${name}/${relative(ws, file).split("\\").join("/")}: ${links} link(s) to an arc's state.json → \`approach.html#N<nnn>\``);
  }
  return out;
}

/**
 * Each place in an open or backlog workstream not yet in the shape, from the workspace's workstreams
 * folder, with where it belongs: an entry beside the five in an arc's notes folder, an entry beside the
 * arc folders in `notes/` or `arcs/`, and for a workstream kept as data an arc with no goal, a long
 * subject, a name file not the commands', a Cycles row with no id and a link to an arc's `state.json`.
 * A `previews/` folder and a second preview are migration 001's, which applies first.
 */
export function strayEntries(root: string): string[] {
  const out: string[] = [];
  for (const ws of workstreamsOf(root)) {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    const data = isDataLayout(ws);
    for (const [entry, home] of strayLevels(ws, firstOpenArc(ws), !data)) out.push(`${name}/${entry} → ${home}`);
    for (const arc of listdir(join(ws, NOTES))) {
      if (!/^N\d+[a-z]?$/.test(arc) || !isDir(join(ws, NOTES, arc))) continue;
      for (const [entry, home] of strayNotes(join(ws, NOTES, arc), true)) out.push(`${name}/${NOTES}/${arc}/${entry} → ${home}`);
    }
    if (data) out.push(...addressFindings(ws, name));
  }
  return out;
}

export const migration002: Migration = {
  id: "002",
  version: "0.41.0",
  changed: "An arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/` and `scripts/`, and nothing else, and " +
    "`notes/` and `arcs/` hold only arc folders: screenshots and real files sit in `samples/`, every other note is a section of " +
    "`plan.md`, pinned facts are records in `facts.jsonl` and cards are records in `questions.jsonl`. Each arc has a short subject, " +
    "a goal and a name file `arcs/N<nnn>/<subject>.md`, and an address on the approach page, `approach.html#N<nnn>`, which every " +
    "link to it points at.",
  check: strayEntries,
  steps: [
    "Start at a clean point: no child agent running, and no other window writing the workstream. Never open `closed/`.",
    "For each workstream the check names, write a move table in the arc's `plan.md` first: each stray entry beside the place " +
      "the check gives it, each target named once. A note's target is the heading of its new `plan.md` section, so a link " +
      "becomes `plan.md#<heading>`. Rewrite every link to a stray, in the approach page, the preview, the plans and the orders, " +
      "from the table before anything moves.",
    "Screenshots, rendered pages and every other real file move into `samples/`, a folder of them as a folder there " +
      "(`mv notes/N<nnn>/shots notes/N<nnn>/samples/shots`). Scripts and the data they read move into `scripts/`; a brief, " +
      "a report or a ledger into `orders/`.",
    "Each note (a how-to, an inventory, a measurement, an ideation note) becomes a section of the arc's `plan.md`, under a " +
      "heading named for its subject, with nothing dropped; then remove the file. A note loose at `notes/` itself goes to the " +
      "plan of the arc it belongs to, or of the workstream's first open arc where it names none, as the check says.",
    "Each fact pinned to a commit becomes a record in the arc's `facts.jsonl` by `spn-devex workstream fact write`, its pin " +
      "kept. A fact with no pin is a line of the plan's section instead.",
    "Each card file is read against the workstream's `questions.jsonl` first: a card already recorded there is a duplicate, " +
      "and the file only goes. One that is not becomes a record by `spn-devex workstream question raise <arc> --file <card.json>` " +
      "(the card JSON written in the session's scratch folder, never in the arc), then `question answer` with the developer's " +
      "words for one already answered, or `question withdraw` for one dropped; a parked one stays open. Then remove the file.",
    "Rewrite every link to an arc's data — `arcs/N<nnn>/state.json` in the approach page, the previews, the plans and the " +
      "orders — to the arc's address: `approach.html#N<nnn>` from the approach page, `../../approach.html#N<nnn>` from a " +
      "preview or a plan, `../../../approach.html#N<nnn>` from an order.",
    "Give each arc its goal from its plan's *What done means*, one or two sentences of the outcome in a reader's words: " +
      "`spn-devex workstream row write <ws>/N<nnn> --goal \"…\"`. A subject the check names as long is not renamed here: " +
      "list it for that workstream's own window, whose owner chooses the short name.",
    "Run `spn-devex docs cycles write <workstream>`: it gives each Cycles row its id and writes each arc's name file.",
    "`spn-devex workstream state check <workstream>` names no `[notes]` or `[name]` finding for each one, and `spn-devex plugin " +
      "migration check` finds nothing for 002; then `spn-devex plugin migration write 002 --steps-done` records it.",
  ],
};
