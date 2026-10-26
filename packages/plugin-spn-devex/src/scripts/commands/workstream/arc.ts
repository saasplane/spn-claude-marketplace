// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The approach page keeps up with its arcs · § The commands · § Shaping: arcs open as the plan becomes clear
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream arc stamp write <arc>
//   spn-devex workstream arc delete <arc> --note "<the developer's words>"
//
// `stamp` is the stamp's only writer. The plugin's grammar reads three words after its name, so `stamp` is the
// action and `write` is the first word it takes, which keeps the command as the chapter types it. `delete` takes
// out an arc never decided: an arc being shaped is reshaped freely, with no history (RD.DEVEX.WORKSPACE.280). An
// arc ever decided is refused, because it becomes DROPPED instead (RD.DEVEX.WORKSPACE.311).

import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { approachOf, arcDataDir, arcStamp, everDecided, logEvent, logLinesOf, notesDirOf, readArc, restamped } from "../../lib/workstream.ts";
import { refreshViews } from "../docs/cycles.ts";
import { afterWrite, arcNamed } from "./_shared.ts";
import { VALUE } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "the stamp an arc's Cycles row carries, written once the page is current with its goal, title and repositories; or an arc never decided, deleted";

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
  if (!note?.trim()) throw new UsageFault("deletes an arc on the developer's words: `--note \"<their words>\"` (RD.DEVEX.WORKSPACE.311).");
  const { ws, arc } = arcNamed(ref);
  const data = readArc(ws, arc);
  if (!data) throw new UsageFault(`finds no ${arc}.`);
  if (everDecided(data, logLinesOf(ws, arc)))
    throw new UsageFault(`keeps ${arc}: it was decided, so it is dropped, never deleted — \`row write ${arc} --status DROPPED --reason "…" --note "<the developer's words>"\` (RD.DEVEX.WORKSPACE.311).`);
  rmSync(arcDataDir(ws, arc), { recursive: true, force: true });
  rmSync(notesDirOf(ws, arc), { recursive: true, force: true });
  const { views } = refreshViews(ws);
  console.log(`${arc} · deleted, never decided · ${note}${views.length ? ` · ${views.join(" · ")}` : ""}`);
  for (const line of afterWrite(ws)) console.log(line);
  return 0;
}

export const actions: Record<string, Action> = {
  stamp: { describe: "write: restamp an arc's Cycles row once its part of the page is current", usage: "write <arc>", run: stamp },
  delete: { describe: "delete an arc never decided, on the developer's words", usage: "<arc> --note \"…\"", run: remove },
};
