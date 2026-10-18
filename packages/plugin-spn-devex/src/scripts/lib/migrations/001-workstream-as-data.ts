// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The folder · § The formats · § Open and backlog workstreams follow the standard as it moves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 001: every open and backlog workstream moves once to the folder kept as data. Its pages
// are rewritten, links first, so it is applied by the agent's steps; its check is mechanical.

import { join, relative } from "node:path";
import { type Migration } from "../migration.ts";
import { isDir, listdir } from "../payload.ts";
import { NOTES, markdownArcsOf, workstreamsOf } from "../workstream.ts";
import { DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** Each place in an open or backlog workstream still in the old shape, from the workspace's workstreams folder. */
export function oldShapes(root: string): string[] {
  const out: string[] = [];
  for (const ws of workstreamsOf(root)) {
    const name = relative(join(root, DEVEX_WORKSTREAMS), ws).split("\\").join("/");
    const markdown = markdownArcsOf(ws);
    if (markdown.length) out.push(`${name}: ${markdown.length} arc(s) kept as Markdown under arcs/`);
    for (const arc of listdir(join(ws, NOTES)))
      if (isDir(join(ws, NOTES, arc, "previews"))) out.push(`${name}/${NOTES}/${arc}/previews/`);
  }
  return out;
}

export const migration001: Migration = {
  id: "001",
  version: "0.41.0",
  changed: "A workstream keeps each arc as data — its rows in `arcs/N<nnn>/state.json` with its log and facts beside it, " +
    "the agent's files in `notes/N<nnn>/` with one preview at `preview.html`, and each card as a record in `questions.jsonl`.",
  check: oldShapes,
  steps: [
    "Start at a clean point: no child agent running, and no other window writing the workstream.",
    "For each workstream the check names, write a move table first: each old path (an arc's `arcs/N<nnn>-<subject>.md`, each preview under " +
      "`notes/N<nnn>/previews/`, an order not named by its row) beside its new path, each target named once. Rewrite every link in the " +
      "approach page, the previews, the plans and the orders from the table before any file moves.",
    "Bring each arc to its data: the header and every step row into `arcs/N<nnn>/state.json`, its Log into `log.jsonl`, and the facts of " +
      "its `plan.md` into `facts.jsonl` with their pins kept. The `workstream` commands write them (`row write`, `fact write`); for many rows, " +
      "a node script in the arc's `notes/N<nnn>/scripts/` on the plugin's state library. The hook refuses a hand write to `state.json`. " +
      "Then remove the Markdown arc.",
    "Move each arc's one preview to `notes/N<nnn>/preview.html`. A second preview becomes a section of it, or a sample; no `previews/` folder stays.",
    "Each open card becomes a record in `questions.jsonl`, keeping its number, and the approach page's Open becomes the `open` block. " +
      "Place the `progress` block's markers under the Cycles table.",
    "Run `spn-devex docs cycles write <workstream>`, bring each arc's part of the page current, then `spn-devex workstream arc stamp write <arc>` for each arc.",
    "`spn-devex workstream state check <workstream>` is clean for each one; then `spn-devex plugin migration write 001 --steps-done` records it.",
  ],
};
