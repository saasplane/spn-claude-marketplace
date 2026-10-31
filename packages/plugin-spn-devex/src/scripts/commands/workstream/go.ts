// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Once an arc is decided, it runs in three passes per repository · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream go write <workstream>/N<nnn> [--scope N<nnn>,…]
//   spn-devex workstream go show  <workstream>/N<nnn> [--part <id>] [--json]
//   spn-devex workstream go check <workstream>/N<nnn>
//   spn-devex workstream go start <workstream>/N<nnn> <part>
//
// A go is the plan of the work after the developer's go: `go.json` in the lead arc's folder, derived from the sheets of the
// scope, and one brief for each part. `write` refuses a scope that is not decided or whose sheet has a finding; run again
// it keeps every landed and running part. `check` reads the plan against the sheets and holds the parts whose entries moved.
// Every command ends with the next step to run.

import { basename, join } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { isTestCommand } from "../../checks/test-run.ts";
import {
  changedEntries, deriveGo, fullRunMinutes, goFileOf, landedEntries, landedMeasures, planScope, readGo, readyParts, ratesOf, unheldEntries,
  type ScopeSheet,
} from "../../lib/go-plan.ts";
import { logEvent, notesDirOf, readArc, readSheet, workspaceOf, writeWhole } from "../../lib/workstream.ts";
import type { ArcData, GoPart, GoPlan } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf } from "./_shared.ts";
import { sheetFindings } from "./sheet.ts";

export const describe = "the plan of a go: derive it from the scope's sheets and write each part's brief, show it, check it against the sheets, start a baseline or full run";

export const save = (ws: string, lead: string, plan: GoPlan): void => writeWhole(goFileOf(ws, lead), `${JSON.stringify(plan, null, 2)}\n`);
const briefOf = (ws: string, lead: string, part: GoPart): string => join(notesDirOf(ws, lead), "orders", `${part.id}.md`);

function planOf(ws: string, lead: string): GoPlan {
  let plan: GoPlan | null;
  try { plan = readGo(ws, lead); } catch (thrown) { throw new UsageFault(`${(thrown as Error).message}.`); }
  if (!plan) throw new UsageFault(`finds no plan for ${lead}: \`workstream go write ${lead} --scope …\` writes it.`);
  return plan;
}

/** The step that follows: the first part that may be launched, or what is left. */
export function nextStep(ref: string, ws: string, plan: GoPlan): string {
  const held = plan.parts.filter((one) => one.state === "held");
  if (held.length) return `Next: derive the plan again with \`workstream go write ${ref} --scope ${plan.scope.join(",")}\`; held: ${held.map((one) => one.id).join(", ")}.`;
  const ready = readyParts(plan);
  const first = ready[0];
  if (first) {
    if (first.pass === "BASELINE" || first.pass === "FULL_RUN") return `Next: \`workstream go start ${ref} ${first.id}\`, then run the repository's whole suite.`;
    if (first.pass === "RELEASE") return `Next: release ${first.repo}.`;
    return `Next: launch the brief of ${first.id}: ${briefOf(ws, plan.lead, first)}${ready.length > 1 ? ` (${ready.length} parts ready)` : ""}.`;
  }
  const running = plan.parts.filter((one) => one.state === "running");
  if (running.length) return `Next: wait for ${running.map((one) => one.id).join(", ")}, then \`workstream report write\` on its report.`;
  return plan.parts.every((one) => one.state === "landed") ? `Next: \`workstream close ${ref}\`.` : `Next: \`workstream go show ${ref}\`.`;
}

/** The sheets of the scope, or the lines that refuse it. */
function scopeOf(ws: string, scope: string[]): { sheets: ScopeSheet[]; arcs: ArcData[]; faults: string[] } {
  const sheets: ScopeSheet[] = [];
  const arcs: ArcData[] = [];
  const faults: string[] = [];
  for (const arc of scope) {
    const data = readArc(ws, arc);
    const sheet = readSheet(ws, arc);
    if (!data) { faults.push(`${arc} has no data`); continue; }
    if (data.status !== "DECIDED") faults.push(`${arc} is ${data.status}, not DECIDED`);
    if (!sheet) { faults.push(`${arc} keeps no sheet`); continue; }
    for (const finding of sheetFindings(ws, arc)) faults.push(`${arc} sheet: ${finding}`);
    // A release part is named for its repository, so a line that is not one name would make a part no reader accepts.
    for (const line of sheet.releaseChain) if (!/^\S+$/.test(line)) faults.push(`${arc} sheet: the release order line "${line}" is not a repository's name`);
    sheets.push({ arc, sheet, landed: landedEntries(data) });
    arcs.push(data);
  }
  return { sheets, arcs, faults };
}

function brief(plan: GoPlan, part: GoPart, ws: string, root: string): string {
  const lines = [
    "---", `go: "${plan.lead}"`, `part: "${part.id}"`, `model: ${part.model}`,
    `blockedBy: [${part.waitsOn.map((id) => `"${id}"`).join(", ")}]`, `entries: [${part.entries.join(", ")}]`, "---",
    `# Part ${part.id}`, "",
    "| | |", "| --- | --- |",
    `| **Repo** | \`${part.repo}\` · **Run from:** \`${join(root, ".worktrees", basename(ws), part.repo)}\` |`,
    `| **Pass** | ${part.pass} · ${part.minutes === null ? "not measured" : `${part.minutes} min (${part.measuredFrom})`} |`, "",
    "**Launch no agent.** Stop at 150k of context or 100 turns, at the next whole step, save the report with what is left and hand back.",
    "Commit nothing. Hand back at most 8 lines; save the report, at most 15 lines, beside this brief as " + `\`${part.id}.report.md\`, its front matter first.`, "",
    "## The entries", "",
    ...part.entries.map((ref) => `- \`${ref}\`: \`workstream sheet show ${ref.split("/")[0]}\` prints it whole`), "",
    "## Acceptance", "",
    ...(part.tests.length ? part.tests.map((file) => `- \`node ${file}\`, run directly, never a whole suite`) : ["- the part names no test file of its own"]), "",
  ];
  return `${lines.join("\n")}\n`;
}

function write(args: string[]): number {
  const words = readWords(args, { scope: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc: lead } = arcNamed(ref);
  const scope = listOf(words, "scope") ?? [lead];
  if (scope[0] !== lead) throw new UsageFault(`names \`${lead}\` as the lead, and \`--scope\` starts with \`${scope[0] ?? "nothing"}\`: the lead is the first arc of the scope.`);
  const { sheets, arcs, faults } = scopeOf(ws, scope);
  if (faults.length) { console.log(`Refused: ${faults.join(" · ")}. Nothing was written.`); return 1; }
  const root = workspaceOf() ?? process.cwd();
  const previous = readGo(ws, lead);
  const measures = landedMeasures(root, basename(ws), arcs);
  const plan = deriveGo(sheets, {
    rates: ratesOf(measures), measures, previous, fullRunMinutes: fullRunMinutes(root, isTestCommand),
    dirsOf: (repo) => [join(root, ".worktrees", basename(ws), repo), join(root, repo)],
  });
  save(ws, lead, plan);
  for (const part of plan.parts) if (part.entries.length && part.state !== "landed" && part.state !== "running") writeWhole(briefOf(ws, lead, part), brief(plan, part, ws, root));
  logEvent(ws, lead, "go", null, `written · ${plan.parts.length} parts · scope ${scope.join(",")}`);
  console.log(`ok · ${lead} go written · ${plan.parts.length} parts over ${scope.join(", ")}`);
  console.log(nextStep(`${basename(ws)}/${lead}`, ws, plan));
  return 0;
}

function partLine(part: GoPart, waiting: boolean): string {
  const state = part.state === "ready" && waiting ? "waiting" : part.state;
  const time = part.minutes === null ? "not measured" : `${part.minutes} min`;
  const tail = [part.entries.length ? part.entries.join(" ") : "", part.tests.length ? `tests ${part.tests.join(" ")}` : "", part.waitsOn.length ? `waits on ${part.waitsOn.join(", ")}` : ""].filter(Boolean);
  return [`${part.id}  ${part.pass}  ${state}  ${time}`, ...tail].join(" · ");
}

function show(args: string[]): number {
  const words = readWords(args, { part: VALUE, json: FLAG });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const plan = planOf(ws, arc);
  const id = words.value("part");
  const parts = id === null ? plan.parts : plan.parts.filter((one) => one.id === id);
  if (id !== null && !parts.length) throw new UsageFault(`finds no part ${id} in ${arc}'s plan.`);
  if (words.given("json")) { console.log(JSON.stringify({ ...plan, parts }, null, 2)); return 0; }
  const ready = new Set(readyParts(plan).map((one) => one.id));
  console.log([arc, `scope ${plan.scope.join(",")}`, `${plan.parts.length} parts`, `written ${plan.writtenAt}`].join(" · "));
  for (const part of parts) console.log(partLine(part, !ready.has(part.id)));
  console.log(nextStep(`${basename(ws)}/${arc}`, ws, plan));
  return 0;
}

export function checkGo(args: string[]): number {
  const words = readWords(args);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const plan = planOf(ws, arc);
  const scope = planScope(ws, plan);
  const findings = unheldEntries(plan, scope).map((ref) => `${ref} is held by no part`);
  let marked = false;
  const parts = plan.parts.map((part) => {
    const moved = changedEntries(part, scope);
    if (!moved.length) return part;
    findings.push(`part ${part.id}${part.state === "ready" ? " is held" : ` (${part.state})`}: entries ${moved.join(" and ")} changed after the plan was written`);
    if (part.state !== "ready") return part;
    marked = true;
    return { ...part, state: "held" as const };
  });
  const next: GoPlan = { ...plan, parts };
  if (marked) { save(ws, arc, next); logEvent(ws, arc, "go", null, "check · held the parts whose entries changed"); }
  if (!findings.length) console.log(`${arc} go whole`);
  else { for (const line of findings) console.log(line); console.log(`${findings.length} finding${findings.length === 1 ? "" : "s"} · exit 1`); }
  console.log(nextStep(`${basename(ws)}/${arc}`, ws, next));
  return findings.length ? 1 : 0;
}

function start(args: string[]): number {
  const words = readWords(args);
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one part: `go start <workstream>/N<nnn> <part>`.");
  const { ws, arc } = arcNamed(ref);
  const plan = planOf(ws, arc);
  const part = plan.parts.find((one) => one.id === id);
  if (!part) throw new UsageFault(`finds no part ${id} in ${arc}'s plan.`);
  const refuse = (why: string): number => { console.log(`Refused: ${why}. Nothing was changed.`); return 1; };
  if (part.pass !== "BASELINE" && part.pass !== "FULL_RUN") return refuse(`${id} is a ${part.pass} part: only a baseline or a full run starts here, and a helper's part is launched from its brief`);
  if (part.state !== "ready") return refuse(`${id} is ${part.state}, not ready`);
  const open = part.waitsOn.filter((wait) => plan.parts.find((one) => one.id === wait)?.state !== "landed");
  if (open.length) return refuse(`${id} waits on ${open.join(", ")}, which has not landed`);
  const next: GoPlan = { ...plan, parts: plan.parts.map((one) => (one.id === id ? { ...one, state: "running" as const } : one)) };
  save(ws, arc, next);
  logEvent(ws, arc, "go", null, `${id} started`);
  console.log(`ok · ${arc} ${id} running`);
  console.log(nextStep(`${basename(ws)}/${arc}`, ws, next).replace(/^Next: /, `Next: run the whole suite of ${part.repo}, then `));
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "after the go: derive the plan from the scope's sheets and the telemetry, and write every part's brief; run again it keeps landed and running parts", usage: "<workstream>/N<nnn> --scope N<nnn>,…", run: write },
  show: { describe: "print the parts: their files, their tests, their measured time and what each waits on", usage: "<workstream>/N<nnn> [--part <id>] [--json]", run: show },
  check: { describe: "read the plan against the sheets: an entry no part holds, or a part whose entries changed since the plan was written, which it marks held; exits 1 on any", usage: "<workstream>/N<nnn>", run: checkGo },
  start: { describe: "mark a baseline or full run as running, so the test-run check lets the whole suite run", usage: "<workstream>/N<nnn> <part>", run: start },
};
