// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Written from a layout
//           docs/04-capabilities/01-devex/01-function/01-bootstrap.md § The foundation workstream
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream layout write <workstream> [--known <section>=<words> …] [--layout <file>]
//   spn-devex workstream layout answer <workstream> <section>[,<section>…] --said "…" [--known "…"]
//   spn-devex workstream layout change <workstream> <decision> --said "…"
//   spn-devex workstream layout decide <workstream> <section>[,<section>…]
//   spn-devex workstream layout strike <workstream> <section>[,<section>…] --said "…"
//   spn-devex workstream layout check <workstream>
//   spn-devex workstream layout show <workstream> [--json]
//
// The sections of bootstrap's layout data, kept in `arcs/ideate/layout.json` with their answers, and the go's refusal
// (RULE.DEVEX.WORKSPACE.539 to .542). "Newer" is read from a decision's revision, never from a clock.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { refFile } from "../../lib/work-map.ts";
import { logEvent, now, readJson, writeWhole } from "../../lib/workstream.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "a workstream written whole from bootstrap's layout data: every section Pending until answered, each answer kept once, and the go's refusal";

export const LAYOUT_FILE = "layout.json";
export const LAYOUT_ARC = "ideate";
export const SECTION_STATES = ["PENDING", "PROPOSED", "DECIDED", "STRUCK"] as const;
type SectionState = (typeof SECTION_STATES)[number];

type LayoutSection = { id: string; title: string; needed: string; waitsOn: string[]; lands: string[] };
type LayoutRound = { id: string; title: string; startsWith: string[]; joinsWhen: string[]; sections: LayoutSection[] };
type LayoutArc = { id: string; title: string; subject: string; landsIn: string; goal: string; tree: string[] };
export type LayoutData = { layout: string; version: number; rounds: LayoutRound[]; arcs: LayoutArc[]; ground?: unknown[]; questions?: unknown[] };

type Section = LayoutSection & { round: string; state: SectionState; known: string | null; cites: Record<string, number> };
type Decision = { id: string; said: string; at: string; rev: number; history: { said: string; at: string; rev: number }[] };
export type Layout = { schemaVersion: 1; layout: string; version: number; written: string; sections: Section[]; decisions: Decision[]; arcs: LayoutArc[] };

/** The plugin's own layout data, or the file `--layout` names. */
export function layoutDataOf(file: string | null = null): LayoutData {
  const path = file ?? refFile("devex/workspace/foundation-layout.json");
  if (!existsSync(path)) throw new UsageFault(`finds no layout data at \`${path}\`.`);
  const data = readJson(path) as LayoutData;
  if (!data || !Array.isArray(data.rounds) || !Array.isArray(data.arcs)) throw new UsageFault(`reads no rounds and arcs in \`${path}\`.`);
  return data;
}

export const layoutFileOf = (ws: string): string => join(ws, "arcs", LAYOUT_ARC, LAYOUT_FILE);

export function readLayout(ws: string): Layout | null {
  const path = layoutFileOf(ws);
  return existsSync(path) ? (readJson(path) as Layout) : null;
}

function layoutOf(ws: string): Layout {
  const layout = readLayout(ws);
  if (!layout) throw new UsageFault(`finds no layout in this workstream: \`workstream layout write\` writes it, from bootstrap's layout data.`);
  return layout;
}

const save = (ws: string, layout: Layout): void => writeWhole(layoutFileOf(ws), `${JSON.stringify(layout, null, 2)}\n`);

/** The sections a comma list names, each one known, or a usage fault naming the ones that are not. */
function sectionsNamed(layout: Layout, list: string | undefined): Section[] {
  const ids = (list ?? "").split(",").map((one) => one.trim()).filter(Boolean);
  if (!ids.length) throw new UsageFault("needs one section or more, by id, such as `1.4` or `1.4,3.1`.");
  const unknown = ids.filter((id) => !layout.sections.some((one) => one.id === id));
  if (unknown.length) throw new UsageFault(`finds no section ${unknown.join(", ")} in the layout.`);
  return ids.map((id) => layout.sections.find((one) => one.id === id)!);
}

/** Why the go may not run, one line per section: still PENDING, or citing a decision newer than itself. Empty when it may run. */
export function layoutFindings(layout: Layout): string[] {
  const out: string[] = [];
  for (const section of layout.sections) {
    if (section.state === "STRUCK") continue;
    if (section.state === "PENDING") { out.push(`${section.id} ${section.title} is Pending: ${section.needed}`); continue; }
    for (const [id, rev] of Object.entries(section.cites)) {
      const decision = layout.decisions.find((one) => one.id === id);
      if (decision && decision.rev > rev) out.push(`${section.id} ${section.title} cites ${id}, which changed since: decide it again`);
    }
  }
  return out;
}

function newDecision(layout: Layout, said: string): Decision {
  const id = `D${String(layout.decisions.length + 1).padStart(3, "0")}`;
  const decision: Decision = { id, said, at: now(), rev: 1, history: [] };
  layout.decisions.push(decision);
  return decision;
}

function write(args: string[]): number {
  const words = readWords(args, { known: VALUE, layout: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("takes one workstream: `layout write <workstream> [--known <section>=<words> …]`.");
  const ws = workstreamNamed(words.paths[0]);
  if (readLayout(ws)) throw new UsageFault("finds a layout already written here: its sections hold answers, and a second write would lose them.");
  const data = layoutDataOf(words.value("layout") ?? null);
  const layout: Layout = {
    schemaVersion: 1, layout: data.layout, version: data.version, written: now(), decisions: [], arcs: data.arcs,
    sections: data.rounds.flatMap((round) => round.sections.map((one) => ({ ...one, round: round.id, state: "PENDING" as SectionState, known: null, cites: {} }))),
  };
  // What the chat questions already told is Known, and it is a decision like any other answer, recorded once.
  for (const pair of words.given("known") ? words.values("known") : []) {
    const at = pair.indexOf("=");
    const [id, said] = at > 0 ? [pair.slice(0, at).trim(), pair.slice(at + 1).trim()] : ["", ""];
    const section = layout.sections.find((one) => one.id === id);
    if (!section || !said) throw new UsageFault(`reads \`--known ${pair}\` as no section: write it as \`<section>=<the founder's words>\`.`);
    const decision = newDecision(layout, said);
    section.known = said;
    section.state = "PROPOSED";
    section.cites[decision.id] = decision.rev;
  }
  save(ws, layout);
  logEvent(ws, LAYOUT_ARC, "layout", null, `written from ${data.layout} layout v${data.version}: ${layout.sections.length} sections, ${data.arcs.length} arcs`);
  const pending = layout.sections.filter((one) => one.state === "PENDING").length;
  console.log(`wrote ${LAYOUT_ARC}/${LAYOUT_FILE} · ${layout.sections.length} sections, ${pending} Pending · ${data.arcs.length} arcs to open`);
  // The arcs open from the same data, each by the command that owns an arc, and its note says the layout proposed it.
  for (const arc of data.arcs)
    console.log(`  spn-devex workstream arc edit <workstream>/${arc.id} --title "${arc.title}" --subject ${arc.subject} --goal "${arc.goal}" --note "opened from bootstrap's layout: every section names what it waits on"`);
  return 0;
}

function answer(args: string[]): number {
  const words = readWords(args, { said: VALUE, known: VALUE });
  const [ref, list, ...more] = words.paths;
  if (!ref || more.length) throw new UsageFault("takes a workstream and its sections: `layout answer <workstream> <section>[,<section>…] --said \"…\"`.");
  const ws = workstreamNamed(ref);
  const said = words.value("said");
  if (!said?.trim()) throw new UsageFault("needs `--said`: the founder's words, as they gave them.");
  const layout = layoutOf(ws);
  const sections = sectionsNamed(layout, list);
  const decision = newDecision(layout, said);
  for (const section of sections) {
    section.known = words.value("known") ?? said;
    section.state = "PROPOSED";
    section.cites[decision.id] = decision.rev;
  }
  save(ws, layout);
  logEvent(ws, LAYOUT_ARC, "answered", null, said, { decision: decision.id, sections: sections.map((one) => one.id) });
  console.log(`recorded ${decision.id} · cited by ${sections.map((one) => one.id).join(", ")} · each Proposed until the founder's yes`);
  return 0;
}

function change(args: string[]): number {
  const words = readWords(args, { said: VALUE });
  const [ref, id, ...more] = words.paths;
  if (!ref || !id || more.length) throw new UsageFault("takes a workstream and one decision: `layout change <workstream> <decision> --said \"…\"`.");
  const ws = workstreamNamed(ref);
  const said = words.value("said");
  if (!said?.trim()) throw new UsageFault("needs `--said`: the founder's new words.");
  const layout = layoutOf(ws);
  const decision = layout.decisions.find((one) => one.id === id);
  if (!decision) throw new UsageFault(`finds no decision ${id}: \`layout show\` lists them.`);
  decision.history.push({ said: decision.said, at: decision.at, rev: decision.rev });
  decision.said = said;
  decision.at = now();
  decision.rev += 1;
  // EVERY SECTION THAT CITES IT REOPENS: its Known is the new words, it reads Proposed, and the revision it cites stays the old
  // one until the founder decides it again, so the go refuses it meanwhile.
  const reopened = layout.sections.filter((one) => id in one.cites && one.state !== "STRUCK");
  for (const section of reopened) { section.state = "PROPOSED"; section.known = said; }
  save(ws, layout);
  logEvent(ws, LAYOUT_ARC, "answer-changed", null, said, { decision: id, rev: decision.rev, reopened: reopened.map((one) => one.id) });
  console.log(`changed ${id} to rev ${decision.rev} · reopened ${reopened.length ? reopened.map((one) => one.id).join(", ") : "no section"}`);
  return 0;
}

function decide(args: string[]): number {
  const words = readWords(args, {});
  const [ref, list, ...more] = words.paths;
  if (!ref || more.length) throw new UsageFault("takes a workstream and its sections: `layout decide <workstream> <section>[,<section>…]`.");
  const ws = workstreamNamed(ref);
  const layout = layoutOf(ws);
  const sections = sectionsNamed(layout, list);
  const pending = sections.filter((one) => one.state === "PENDING");
  if (pending.length) throw new UsageFault(`finds ${pending.map((one) => one.id).join(", ")} still Pending: answer a section before it is decided.`);
  for (const section of sections) {
    if (section.state === "STRUCK") continue;
    section.state = "DECIDED";
    for (const id of Object.keys(section.cites)) section.cites[id] = layout.decisions.find((one) => one.id === id)?.rev ?? section.cites[id];
  }
  save(ws, layout);
  logEvent(ws, LAYOUT_ARC, "layout-decided", null, sections.map((one) => one.id).join(", "));
  console.log(`decided ${sections.map((one) => one.id).join(", ")}`);
  return 0;
}

function strike(args: string[]): number {
  const words = readWords(args, { said: VALUE });
  const [ref, list, ...more] = words.paths;
  if (!ref || more.length) throw new UsageFault("takes a workstream and its sections: `layout strike <workstream> <section>[,<section>…] --said \"…\"`.");
  const ws = workstreamNamed(ref);
  const said = words.value("said");
  if (!said?.trim()) throw new UsageFault("needs `--said`: a part is struck only by the founder's recorded words.");
  const layout = layoutOf(ws);
  const sections = sectionsNamed(layout, list);
  const decision = newDecision(layout, said);
  for (const section of sections) { section.state = "STRUCK"; section.known = said; section.cites[decision.id] = decision.rev; }
  save(ws, layout);
  logEvent(ws, LAYOUT_ARC, "struck", null, said, { decision: decision.id, sections: sections.map((one) => one.id) });
  console.log(`struck ${sections.map((one) => one.id).join(", ")} by ${decision.id}`);
  return 0;
}

function check(args: string[]): number {
  const words = readWords(args, {});
  if (words.paths.length !== 1) throw new UsageFault("takes one workstream: `layout check <workstream>`.");
  const ws = workstreamNamed(words.paths[0]);
  const layout = readLayout(ws);
  if (!layout) { console.log("no layout · this workstream was not written from one, so nothing here refuses the go"); return 0; }
  const findings = layoutFindings(layout);
  if (!findings.length) { console.log(`the go may run · ${layout.sections.length} sections, none Pending, none citing a newer decision`); return 0; }
  console.log(`Refused: the go waits on ${findings.length} section${findings.length === 1 ? "" : "s"}.`);
  for (const line of findings) console.log(`  ${line}`);
  return 1;
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one workstream: `layout show <workstream> [--json]`.");
  const layout = layoutOf(workstreamNamed(words.paths[0]));
  if (words.given("json")) { console.log(JSON.stringify(layout, null, 2)); return 0; }
  let round = "";
  for (const section of layout.sections) {
    if (section.round !== round) { round = section.round; console.log(`round ${round}`); }
    const waits = section.state === "PENDING" && section.waitsOn.length ? ` · waits on ${section.waitsOn.join(", ")}` : "";
    console.log(`  ${section.id} ${section.title} · ${section.state}${waits}${section.known ? ` · Known: ${section.known}` : ` · Needed: ${section.needed}`}`);
  }
  for (const decision of layout.decisions) console.log(`${decision.id} rev ${decision.rev} · ${decision.said}`);
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "write the workstream's sections from bootstrap's layout data, every one Pending, and print the arcs to open", usage: "<workstream> [--known <section>=<words> …] [--layout <file>]", run: write },
  answer: { describe: "record the founder's answer once, as a decision every named section cites, each then Proposed", usage: "<workstream> <section>[,<section>…] --said \"…\" [--known \"…\"]", run: answer },
  change: { describe: "change a recorded answer, reopening every section that cites it", usage: "<workstream> <decision> --said \"…\"", run: change },
  decide: { describe: "mark sections Decided on the founder's yes", usage: "<workstream> <section>[,<section>…]", run: decide },
  strike: { describe: "strike a part that does not apply, by the founder's recorded words", usage: "<workstream> <section>[,<section>…] --said \"…\"", run: strike },
  check: { describe: "refuse the go while a section is Pending or cites a decision newer than itself", usage: "<workstream>", run: check },
  show: { describe: "print each section's state, Known or Needed, and the decisions", usage: "<workstream> [--json]", run: show },
};
