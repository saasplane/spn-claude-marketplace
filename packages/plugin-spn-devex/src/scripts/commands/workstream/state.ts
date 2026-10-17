// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream state show [<workstream>] [--json]            where everything stands, a line per workstream
//   spn-devex workstream state check [<workstream>] [--facts] [--json]  whether each open and backlog workstream is whole
//
// `check` exits 1 on a finding. `--facts` also names each fact whose source moved since its pin, as a
// note that never fails the check.

import { basename } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { TERMINAL } from "../../checks/arc-status.ts";
import { checkWorkstream, staleFacts } from "../../checks/workstream-state.ts";
import {
  arcIdsOf, doneOf, markdownArcsOf, readArc, readJsonl, readQuestions, stateOfRow, suggestionsFileOf, workspaceOf, workstreamsOf,
} from "../../lib/workstream.ts";
import { type Suggestion } from "../../lib/workstream-schema.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "where a workstream stands, and whether it is whole";

export type Standing = {
  workstream: string; moved: boolean;
  arcs: Array<{ arc: string; status: string; reason: string | null; done: number; total: number; running: string[] }>;
  openCards: string[]; suggestions: Record<string, number>;
};

/** One workstream's standing, read from its data. */
export function standingOf(ws: string): Standing {
  const name = basename(ws);
  if (markdownArcsOf(ws).length) return { workstream: name, moved: false, arcs: [], openCards: [], suggestions: {} };
  const arcs = arcIdsOf(ws).map((arc) => readArc(ws, arc)).filter((data) => data !== null).map((data) => ({
    arc: data!.arc, status: data!.status, reason: data!.reason, ...doneOf(data!),
    running: data!.rows.filter((row) => ["running", "stopped"].includes(stateOfRow(data!.rows, row)) && !data!.rows.some((one) => one.parent === row.id))
      .map((row) => `${row.id} ${stateOfRow(data!.rows, row)}`),
  }));
  const suggestions: Record<string, number> = {};
  for (const line of readJsonl(suggestionsFileOf(ws)) as Suggestion[])
    if (line && typeof line.state === "string") suggestions[line.state] = (suggestions[line.state] ?? 0) + 1;
  return { workstream: name, moved: true, arcs, openCards: readQuestions(ws).filter((one) => one.state === "open").map((one) => one.id), suggestions };
}

/** The standing as the one line `show` prints: `025 · N007 18/19 · 57b running · N010 proposed · 0 open cards · 1 suggestion shaped`. */
export function standingLine(standing: Standing): string {
  const number = standing.workstream.slice(0, 3);
  if (!standing.moved) return `${number} · keeps its arcs as Markdown — not moved to the data layout yet`;
  const parts = [number];
  const closed = standing.arcs.filter((arc) => TERMINAL.has(arc.status));
  for (const arc of standing.arcs.filter((one) => !TERMINAL.has(one.status))) {
    if (["RUNNING", "PART-LANDED"].includes(arc.status)) parts.push(`${arc.arc} ${arc.done}/${arc.total}`, ...arc.running);
    else parts.push(`${arc.arc} ${arc.status.toLowerCase()}${arc.reason ? ` (${arc.reason})` : ""}`);
  }
  if (closed.length) parts.push(`${closed.length} arc(s) closed`);
  parts.push(`${standing.openCards.length} open card${standing.openCards.length === 1 ? "" : "s"}`);
  for (const state of ["raised", "shaped"])
    if (standing.suggestions[state]) parts.push(`${standing.suggestions[state]} suggestion${standing.suggestions[state] === 1 ? "" : "s"} ${state}`);
  return parts.join(" · ");
}

function chosen(target: string | undefined): string[] {
  if (target) return [workstreamNamed(target)];
  const root = workspaceOf();
  if (!root) throw new UsageFault("needs a workstream here, because the folder it is run from is in no workspace.");
  return workstreamsOf(root);
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const standings = chosen(words.paths[0]).map(standingOf);
  if (words.given("json")) console.log(JSON.stringify(standings, null, 2));
  else for (const standing of standings) console.log(standingLine(standing));
  return 0;
}

function check(args: string[]): number {
  const words = readWords(args, { json: FLAG, facts: FLAG });
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const folders = chosen(words.paths[0]);
  const findings = folders.flatMap(checkWorkstream);
  const root = workspaceOf() ?? "";
  const notes = words.given("facts") ? folders.flatMap((ws) => arcIdsOf(ws).flatMap((arc) => staleFacts(ws, arc, root).map((line) => `${basename(ws)} ${line}`))) : [];
  if (words.given("json")) console.log(JSON.stringify({ findings, facts: notes }, null, 2));
  else {
    for (const finding of findings)
      console.log(`${finding.workstream}${finding.arc ? ` ${finding.arc}` : ""} [${finding.check}] ${finding.message}`);
    for (const note of notes) console.log(`note ${note}`);
    console.log(findings.length ? `${findings.length} finding(s) in ${new Set(findings.map((one) => one.workstream)).size} workstream(s)`
      : `ok · ${folders.length} workstream(s) whole`);
  }
  return findings.length ? 1 : 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "where each open and backlog workstream stands, in a line; with --json, as data", usage: "[<workstream>] [--json]", run: show },
  check: { describe: "whether each open and backlog workstream is whole: its data, previews, stamps, cards and step files", usage: "[<workstream>] [--facts] [--json]", run: check },
};
