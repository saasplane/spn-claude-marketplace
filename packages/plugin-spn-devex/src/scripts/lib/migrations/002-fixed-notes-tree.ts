// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc carries its specification, or names the note that holds it · § The folder · § Open and backlog workstreams follow the standard as it moves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 002: every arc's notes folder in an open or backlog workstream holds `preview.html`,
// `samples/`, `plan.md`, `orders/` and `scripts/`, and nothing else. A stray note is folded into the
// plan and a card file into the records, which is reading and judgement, so the agent applies it by
// its steps; its check is the same finding `workstream state check` makes, and never reads `closed/`.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { isDir, listdir } from "../payload.ts";
import { NOTES, strayNotes, workstreamsOf } from "../workstream.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/**
 * Each entry beside the five in an arc's notes folder of an open or backlog workstream, from the
 * workspace's workstreams folder, with where it belongs. A `previews/` folder and a second preview
 * are migration 001's, which applies first.
 */
export function strayEntries(root: string): string[] {
  const out: string[] = [];
  for (const ws of workstreamsOf(root)) {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    for (const arc of listdir(join(ws, NOTES))) {
      if (!/^N\d+[a-z]?$/.test(arc) || !isDir(join(ws, NOTES, arc))) continue;
      for (const [entry, home] of strayNotes(join(ws, NOTES, arc), true)) out.push(`${name}/${NOTES}/${arc}/${entry} → ${home}`);
    }
  }
  return out;
}

export const migration002: Migration = {
  id: "002",
  version: "0.41.0",
  changed: "An arc's notes folder holds `preview.html`, `samples/`, `plan.md`, `orders/` and `scripts/`, and nothing else: " +
    "screenshots and real files sit in `samples/`, every other note is a section of `plan.md`, pinned facts are records in " +
    "`facts.jsonl` and cards are records in `questions.jsonl`.",
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
      "heading named for its subject, with nothing dropped; then remove the file.",
    "Each fact pinned to a commit becomes a record in the arc's `facts.jsonl` by `spn-devex workstream fact write`, its pin " +
      "kept. A fact with no pin is a line of the plan's section instead.",
    "Each card file is read against the workstream's `questions.jsonl` first: a card already recorded there is a duplicate, " +
      "and the file only goes. One that is not becomes a record by `spn-devex workstream question raise <arc> --file <card.json>` " +
      "(the card JSON written in the session's scratch folder, never in the arc), then `question answer` with the developer's " +
      "words for one already answered, or `question withdraw` for one dropped; a parked one stays open. Then remove the file.",
    "`spn-devex workstream state check <workstream>` names no `[notes]` finding for each one, and `spn-devex plugin migration " +
      "check` finds nothing for 002; then `spn-devex plugin migration write 002 --steps-done` records it.",
  ],
};
