// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream handover <workstream> [--continue "…"] [--do-not-touch "…"]
//
// Writes the handover block from the data (the arcs' rows, the cards, the orders still running and the facts' pins)
// as a note in the log of the workstream's first open arc, and prints it. The agent's own words are the two it cannot
// read from the data: what to continue, and what not to touch.

import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  arcIdsOf, arcStatus, builtOf, factsFileOf, firstOpenArc, logEvent, notesDirOf, openQuestions, readArc, readJsonl, readQuestions, whatId,
} from "../../lib/workstream.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "the handover block, written from the rows, the cards, the live orders and the pins into the arc's log, and printed";
export const usage = "<workstream> [--continue \"…\"] [--do-not-touch \"…\"]";

const OWED = "(yours to add: `--continue \"…\"`)";
const OWED_TOUCH = "(yours to add: `--do-not-touch \"…\"`, or `nothing`)";

/** The orders of an arc that have a brief and no report yet. */
function liveOrders(ws: string, arc: string): string[] {
  const dir = join(notesDirOf(ws, arc), "orders");
  if (!existsSync(dir)) return [];
  const names = readdirSync(dir);
  return names.filter((name) => /\.md$/.test(name) && !/\.(?:report|ledger)\.md$/.test(name) && !names.includes(name.replace(/\.md$/, ".report.md")))
    .map((name) => `${arc} order ${name.replace(/\.md$/, "")}`);
}

/** The block's text: one label after another, each read from the workstream's data. */
export function handoverBlock(ws: string, said: { continue?: string; doNotTouch?: string }): { lead: string; text: string } {
  const arcs = arcIdsOf(ws).map((arc) => readArc(ws, arc)).filter((one) => one !== null);
  const lead = firstOpenArc(ws) ?? arcs[0]?.arc;
  if (!lead) throw new UsageFault(`finds no arc in ${basename(ws)} to write a handover in.`);
  const questions = readQuestions(ws);
  const open = openQuestions(questions).map((one) => one.id);
  const pins = new Set<string>();
  for (const arc of arcs) for (const fact of readJsonl(factsFileOf(ws, arc.arc)) as Array<{ source?: string; commit?: string }>)
    if (fact.commit && fact.source) pins.add(`${fact.source.split("/")[0].split(":")[0]} ${fact.commit}`);
  const state = arcs.map((arc) => { const built = builtOf(arc); return `${arc.arc} ${arcStatus(arc)} ${built.done}/${built.total}`; });
  const live = arcs.flatMap((arc) => liveOrders(ws, arc.arc));
  const unfinished = arcs.filter((arc) => arcStatus(arc) !== "LANDED").map((arc) => `${arc.arc} LANDED`);
  const leadData = arcs.find((arc) => arc.arc === lead);
  const date = new Date().toISOString().slice(0, 10);
  const text = [
    `HANDOVER, ${date}.`,
    `continue: ${said.continue ?? OWED}`,
    `model: ${leadData?.model ?? "unchanged"}.`,
    `read first: approach.html#${whatId(lead)}; notes/${lead}/preview.html; arcs/${lead}/log.jsonl, its last lines.`,
    `pins: ${pins.size ? [...pins].join("; ") : "none read"}.`,
    `state: ${state.join("; ") || "no arc"}.`,
    `live now: ${live.length ? live.join("; ") : "nothing running"}.`,
    `done when: ${unfinished.length ? unfinished.join("; ") : "every arc is LANDED, and the workstream closes"}.`,
    `do not touch: ${said.doNotTouch ?? OWED_TOUCH}`,
    `open: ${open.length ? open.join(", ") : "none"}.`,
  ].join(" ");
  return { lead, text };
}

export function run(args: string[]): number {
  const words = readWords(args, { continue: VALUE, "do-not-touch": VALUE });
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const ws = workstreamNamed(words.paths[0]);
  const { lead, text } = handoverBlock(ws, { continue: words.value("continue") ?? undefined, doNotTouch: words.value("do-not-touch") ?? undefined });
  logEvent(ws, lead, "note", null, text);
  console.log(text);
  return 0;
}
