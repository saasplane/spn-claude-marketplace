// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream handover <workstream> [--continue "…"] [--do-not-touch "…"]
//
// Writes the handover block from the data (the arcs' rows, the cards, the orders still running and the facts' pins)
// as a note in the log of the arc that is running (or the lead of the newest go, else the first open arc), and prints it. The agent's own words are the two it cannot
// read from the data: what to continue, and what not to touch.

import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  arcIdsOf, arcStatus, builtOf, factsFileOf, firstOpenArc, logEvent, notesDirOf, openQuestions, readArc, readJsonl, readQuestions,
  suggestionOpen, suggestionsOf, whatId,
} from "../../lib/workstream.ts";
import { readGo } from "../../lib/go-plan.ts";
import { cardName, type ArcData, type GoPlan } from "../../lib/workstream-schema.ts";
import { HANDOVER_COLUMN } from "../../events/stop.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "the handover block, written from the rows, the cards, the live orders and the pins into the arc's log, and printed";
export const usage = "<workstream> [--continue \"…\"] [--do-not-touch \"…\"]";

const OWED = "(yours to add: `--continue \"…\"`)";
const OWED_TOUCH = "(yours to add: `--do-not-touch \"…\"`, or `nothing`)";

/** The go plans of a workstream, newest first by `writtenAt`. */
function goPlans(ws: string, arcs: readonly string[]): GoPlan[] {
  const plans: GoPlan[] = [];
  for (const arc of arcs) { try { const plan = readGo(ws, arc); if (plan) plans.push(plan); } catch { /* a plan that fails its schema is not read here */ } }
  return plans.sort((a, b) => String(b.writtenAt).localeCompare(String(a.writtenAt)));
}

/** THE ARC THE NEXT WINDOW READS FIRST: the lead of a go with a part running, else an arc that is running, else the lead of the newest go, else the first open arc. */
export function runningArc(ws: string, arcs: readonly ArcData[]): string | null {
  const plans = goPlans(ws, arcs.map((one) => one.arc));
  const running = plans.find((plan) => plan.parts.some((part) => part.state === "running"));
  return running?.lead ?? arcs.find((one) => arcStatus(one) === "RUNNING")?.arc ?? plans[0]?.lead ?? firstOpenArc(ws) ?? arcs[0]?.arc ?? null;
}

/** THE LIVE ORDERS: a part that is `running` in a go plan and has no report yet, one line for each. */
export function liveOrders(ws: string, arcs: readonly string[]): string[] {
  const out: string[] = [];
  for (const plan of goPlans(ws, arcs)) {
    const dir = join(notesDirOf(ws, plan.lead), "orders");
    for (const part of plan.parts)
      if (part.state === "running" && !existsSync(join(dir, `${part.id}.report.md`))) out.push(`${plan.lead} order ${part.id}`);
  }
  return out;
}

/** One value after its label, the label padded so the value starts in `HANDOVER_COLUMN`, a long value wrapped at a word with each continuation indented to that column. */
function blockLine(label: string, value: string): string {
  const width = 100;
  const pad = " ".repeat(HANDOVER_COLUMN);
  const rows: string[] = [];
  let row = "";
  for (const word of value.split(" ")) {
    if (row && row.length + 1 + word.length > width) { rows.push(row); row = word; } else row = row ? `${row} ${word}` : word;
  }
  rows.push(row);
  return rows.map((one, at) => (at === 0 ? `${label}:`.padEnd(HANDOVER_COLUMN) : pad) + one).join("\n");
}

/** The block, as `text` (the one line the arc's log keeps) and `block` (the nine lines the agent pastes), each read from the workstream's data. */
export function handoverBlock(ws: string, said: { continue?: string; doNotTouch?: string }): { lead: string; text: string; block: string } {
  const arcs = arcIdsOf(ws).map((arc) => readArc(ws, arc)).filter((one) => one !== null);
  const lead = runningArc(ws, arcs);
  if (!lead) throw new UsageFault(`finds no arc in ${basename(ws)} to write a handover in.`);
  const questions = readQuestions(ws);
  const open = [...openQuestions(questions).map((one) => cardName(one.id)), ...suggestionsOf(ws).filter(suggestionOpen).map((one) => cardName(one.id))];
  const pins = new Set<string>();
  for (const arc of arcs.filter((one) => one.arc === lead)) for (const fact of readJsonl(factsFileOf(ws, arc.arc)) as Array<{ source?: string; commit?: string }>)
    if (fact.commit && fact.source) pins.add(`${fact.source.split("/")[0].split(":")[0]} ${fact.commit}`);
  const state = arcs.map((arc) => { const built = builtOf(arc); return `${arc.arc} ${arcStatus(arc)} ${built.done}/${built.total}`; });
  const live = liveOrders(ws, arcs.map((arc) => arc.arc));
  const unfinished = arcs.filter((arc) => arcStatus(arc) !== "LANDED").map((arc) => `${arc.arc} LANDED`);
  const leadData = arcs.find((arc) => arc.arc === lead);
  const date = new Date().toISOString().slice(0, 10);
  const values: Array<[string, string]> = [
    ["continue", said.continue ?? OWED],
    ["model", `${leadData?.model ?? "unchanged"}.`],
    ["read first", `approach.html#${whatId(lead)}; notes/${lead}/preview.html; arcs/${lead}/log.jsonl, its last lines.`],
    ["pins", `${pins.size ? [...pins].join("; ") : "none read"}.`],
    ["state", `${state.join("; ") || "no arc"}.`],
    ["live now", `${live.length ? live.join("; ") : "nothing running"}.`],
    ["done when", `${unfinished.length ? unfinished.join("; ") : "every arc is LANDED, and the workstream closes"}.`],
    ["do not touch", said.doNotTouch ?? OWED_TOUCH],
    ["open", `${open.length ? open.join(", ") : "none"}.`],
  ];
  const text = [`HANDOVER, ${date}.`, ...values.map(([label, value]) => `${label}: ${value}`)].join(" ");
  const block = values.map(([label, value]) => blockLine(label, value)).join("\n");
  return { lead, text, block };
}

export function run(args: string[]): number {
  const words = readWords(args, { continue: VALUE, "do-not-touch": VALUE });
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const ws = workstreamNamed(words.paths[0]);
  const { lead, text, block } = handoverBlock(ws, { continue: words.value("continue") ?? undefined, doNotTouch: words.value("do-not-touch") ?? undefined });
  logEvent(ws, lead, "note", null, text);
  console.log(`\`\`\`text\n${block}\n\`\`\``);
  return 0;
}
