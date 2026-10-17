// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The approach page keeps up with its arcs
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream arc stamp write <arc>
//
// The stamp's only writer. The plugin's grammar reads three words after its name, so `stamp` is the
// action and `write` is the first word it takes, which keeps the command as the chapter types it.

import { readFileSync, writeFileSync } from "node:fs";
import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { approachOf, logEvent, readArc, restamped, rowStamp } from "../../lib/workstream.ts";
import { arcNamed } from "./_shared.ts";

export const describe = "the stamp an arc's Cycles row carries, written once the page is current with its rows";

function stamp(args: string[]): number {
  const words = readWords(args);
  const [verb, ref, ...more] = words.paths;
  if (verb !== "write") throw new UsageFault("is typed `arc stamp write <arc>`.");
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const data = readArc(ws, arc)!;
  const page = approachOf(ws);
  if (!page) throw new UsageFault(`finds no approach page beside ${arc}'s workstream.`);
  const value = rowStamp(data);
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

export const actions: Record<string, Action> = {
  stamp: { describe: "write: restamp an arc's Cycles row once its part of the page is current", usage: "write <arc>", run: stamp },
};
