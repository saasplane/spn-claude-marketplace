// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Once an arc is decided, it runs in three passes per repository · § The formats
//           RULE.DEVEX.WORKSPACE.485, a go's first plan and each release part wait for a panel's verdict on record
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream go write <workstream>/N<nnn> [--scope N<nnn>,…]
//   spn-devex workstream go show  <workstream>/N<nnn> [--part <id>] [--json]
//   spn-devex workstream go check <workstream>/N<nnn>
//   spn-devex workstream go start <workstream>/N<nnn> <part>
//   spn-devex workstream go wait  <workstream>/N<nnn> <part> --on "<what it waits on>"
//
// A go is the plan of the work after the developer's go: `go.json` in the lead arc's folder, derived from the sheets of the
// scope, and one brief for each part. `write` refuses a scope that is not decided or whose sheet has a finding; run again
// it keeps every landed and running part and names every fault of the scope in one refusal. `check` reads the plan against the sheets and holds the parts whose entries moved.
// Every command ends with the next step to run.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  clearWaiting, deriveGo, fullRunMinutes, goFileOf, landedEntries, landedMeasures, markWaiting, planScope, readGo, readyParts, ratesOf, staleEntries, unheldEntries,
  type ScopeSheet,
} from "../../lib/go-plan.ts";
import { logEvent, logFileOf, notesDirOf, readArc, readJson, readJsonl, readSheet, workspaceOf, writeWhole } from "../../lib/workstream.ts";
import { DONE_STATES, renameDataToWork, type ArcData, type GoPart, type GoPlan } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf } from "./_shared.ts";
import { panelOnRecord, panelsVisible } from "../../checks/split-plan.ts";
import { renameFirstRead, sheetFindings } from "./sheet.ts";

export const describe = "the plan of a go: derive it from the scope's sheets and write each part's brief, show it, check it against the sheets, start a baseline, a full run or a release";

export const save = (ws: string, lead: string, plan: GoPlan): void => writeWhole(goFileOf(ws, lead), `${JSON.stringify(plan, null, 2)}\n`);
const briefOf = (ws: string, lead: string, part: GoPart): string => join(notesDirOf(ws, lead), "orders", `${part.id}.md`);

/** Whether a TEST part is the repository's proof run, after the releases: told apart by its id. */
export const isProofRun = (part: GoPart): boolean => part.work === "TEST" && part.id.startsWith("proof-");
/** Whether a TEST part is a repository's full run or its proof run rather than its baseline: told apart by their ids. */
export const isFullRun = (part: GoPart): boolean => part.work === "TEST" && !part.id.startsWith("baseline-");

/** The first read of an open workstream's go plan: each part's `pass` becomes `work`, the file written back with one log line, before the schema reads it. A closed workstream's is left as it closed. */
export function renameGo(ws: string, lead: string): void {
  if (basename(dirname(resolve(ws))) === "closed") return;
  const data = readJson(goFileOf(ws, lead));
  const count = renameDataToWork(data);
  if (count > 0) { writeWhole(goFileOf(ws, lead), `${JSON.stringify(data, null, 2)}\n`); logEvent(ws, lead, "work", null, `pass renamed to work · ${count} part${count === 1 ? "" : "s"}`); }
}

function planOf(ws: string, lead: string): GoPlan {
  renameGo(ws, lead);
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
    if (first.work === "TEST") return `Next: \`workstream go start ${ref} ${first.id}\`, then run the repository's whole suite.`;
    if (first.work === "RELEASE") return `Next: \`workstream go start ${ref} ${first.id}\`, then release ${first.repo}.`;
    return `Next: launch the brief of ${first.id}: ${briefOf(ws, plan.lead, first)}${ready.length > 1 ? ` (${ready.length} parts ready)` : ""}.`;
  }
  const running = plan.parts.filter((one) => one.state === "running");
  if (running.length) return `Next: wait for ${running.map((one) => one.id).join(", ")}, then \`workstream report write\` on its report.`;
  return plan.parts.every((one) => one.state === "landed") ? `Next: \`workstream close ${ref}\`.` : `Next: \`workstream go show ${ref}\`.`;
}

/** The sheets of the scope, or the lines that refuse it. */
function scopeOf(ws: string, scope: string[], lead: string): { sheets: ScopeSheet[]; arcs: ArcData[]; faults: string[] } {
  const sheets: ScopeSheet[] = [];
  const arcs: ArcData[] = [];
  const faults: string[] = [];
  if (scope[0] !== lead) faults.push(`\`--scope\` starts with \`${scope[0] ?? "nothing"}\`, and the lead is \`${lead}\`: the lead is the first arc of the scope`);
  for (const arc of scope) {
    renameFirstRead(ws, arc);
    const data = readArc(ws, arc);
    const sheet = readSheet(ws, arc);
    if (!data) { faults.push(`${arc} has no data`); continue; }
    if (data.status !== "DECIDED") faults.push(`${arc} is ${data.status}, not DECIDED`);
    if (!sheet) { faults.push(`${arc} keeps no sheet`); continue; }
    for (const finding of sheetFindings(ws, arc)) faults.push(`${arc} sheet: ${finding}`);
    // A release part is named for its repository, so a line that is not one name would make a part no reader accepts.
    for (const line of sheet.releaseChain) if (!/^\S+$/.test(line)) faults.push(`${arc} sheet: the release order line "${line}" is not a repository's name`);
    // A proof step not landed owes its repository a full run; an arc that changes no repository lands its proof on its check's run.
    const proofs = data.rows.filter((row) => row.work === "PROOF" && !DONE_STATES.has(row.state) && row.repo && row.repo !== "none").map((row) => row.repo as string);
    sheets.push({ arc, sheet, landed: landedEntries(data), proofs: [...new Set(proofs)] });
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
    `| **Work** | ${part.work} · ${part.minutes === null ? "not measured" : `${part.minutes} min (${part.measuredFrom})`} |`, "",
    "**Launch no agent.** Stop at 150k of context or 100 turns, at the next whole step, save the report with what is left and hand back.",
    "Commit nothing. Hand back at most 8 lines; save the report, at most 15 lines, beside this brief as " + `\`${part.id}.report.md\`, its front matter first.`, "",
    "## The entries", "",
    ...part.entries.map((ref) => `- \`${ref}\`: \`workstream sheet show ${ref.split("/")[0]}\` prints it whole`), "",
    "## Acceptance", "",
    ...(part.tests.length ? part.tests.map((file) => `- \`node ${file}\`, run directly, never a whole suite`) : ["- the part names no test file of its own"]), "",
    "## Report", "",
    "Its front matter is what `workstream report write` folds into the plan:", "",
    "```text", "---", `go: "${plan.lead}"`, `part: "${part.id}"`, "outcome: landed · stopped · needs-you",
    'proof: "<what you ran, and what it printed>"', "commits: {}", "followUps: []", "---", "```", "",
  ];
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------- the panel gates

/** What a refusal names as the way through: the panel to convene, and what its prompt names (RULE.DEVEX.WORKSPACE.485). */
const conveneFix = (ref: string, part: string | null): string =>
  `convene \`spn-devex:spn-panel\` with the lens LEAD picks, naming \`${ref}\`${part ? ` and the part ${part}` : ""} in its prompt (RULE.DEVEX.WORKSPACE.485)`;

/** The one note a gate prints where recording is off and no verdict can be seen. */
const BLIND = "Note: telemetry recording is off, so a panel's verdict can't be seen; the panel gate (RULE.DEVEX.WORKSPACE.485) is not applied.";

/** When the last non-release part of a repository landed, from the lead arc's log, or null where none has. */
export function lastLandedAt(ws: string, arc: string, plan: GoPlan, repo: string): string | null {
  const ids = new Set(plan.parts.filter((one) => one.repo === repo && one.work !== "RELEASE").map((one) => `${one.id} landed`));
  const stamps = readJsonl(logFileOf(ws, arc)).map((line) => line as { at?: string; kind?: string; note?: string } | undefined)
    .filter((one) => one?.kind === "go" && typeof one.note === "string" && ids.has(one.note) && typeof one.at === "string").map((one) => one!.at as string);
  return stamps.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null;
}

/** The arcs a release part's entries belong to, else the lead arc: the arcs whose panel counts for it. */
const arcsOf = (part: GoPart, lead: string): string[] => [...new Set(part.entries.map((ref) => ref.split("/")[0]))].filter(Boolean).concat(part.entries.length ? [] : [lead]);

/**
 * The refusal of a release part's start where no panel's verdict is on record for its arc since its repository's last part landed,
 * else null. Recording off lets it through with the note.
 */
export function releaseGate(ws: string, lead: string, plan: GoPlan, part: GoPart, root: string): string | null {
  if (!panelsVisible(root)) { console.log(BLIND); return null; }
  const since = lastLandedAt(ws, lead, plan, part.repo);
  const arcs = arcsOf(part, lead);
  if (arcs.some((arc) => panelOnRecord(root, basename(ws), arc, part.id, since))) return null;
  return `${part.id} is a release, and no panel's verdict is on record for ${arcs.join(", ")}${since ? ` since ${part.repo}'s last part landed` : ""}: ${conveneFix(`${basename(ws)}/${arcs[0]}`, part.id)}`;
}

function write(args: string[]): number {
  const words = readWords(args, { scope: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc: lead } = arcNamed(ref);
  const scope = listOf(words, "scope") ?? [lead];
  const { sheets, arcs, faults } = scopeOf(ws, scope, lead);
  if (faults.length) { console.log(`Refused: ${faults.join(" · ")}. Nothing was written.`); return 1; }
  const root = workspaceOf() ?? process.cwd();
  // THE FIRST PLAN WAITS FOR A PANEL; deriving an existing plan again never does.
  if (!existsSync(goFileOf(ws, lead))) {
    if (!panelsVisible(root)) console.log(BLIND);
    else if (!panelOnRecord(root, basename(ws), lead, null)) {
      console.log(`Refused: ${lead} has no plan yet, and no panel's verdict is on record for it: ${conveneFix(`${basename(ws)}/${lead}`, null)}. Nothing was written.`);
      return 1;
    }
  }
  renameGo(ws, lead);
  const previous = readGo(ws, lead);
  const measures = landedMeasures(root, basename(ws), arcs);
  const plan = deriveGo(sheets, {
    rates: ratesOf(measures), measures, previous, fullRunMinutes: fullRunMinutes(root),
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
  const tail = [part.entries.length ? part.entries.join(" ") : "", part.tests.length ? `tests ${part.tests.join(" ")}` : "", part.waitsOn.length ? `waits on ${part.waitsOn.join(", ")}` : "",
    part.state === "waiting" && part.waitingOn ? `waiting on ${part.waitingOn}` : ""].filter(Boolean);
  return [`${part.id}  ${part.work}  ${state}  ${time}`, ...tail].join(" · ");
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
    const moved = staleEntries(part, plan, scope);
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

/** The files a repository's worktree for this workstream (else its checkout) holds uncommitted, or none where it is no git tree. */
function uncommitted(ws: string, repo: string): string[] {
  const root = workspaceOf() ?? process.cwd();
  const dir = [join(root, ".worktrees", basename(ws), repo), join(root, repo)].find((one) => existsSync(one));
  if (!dir) return [];
  try {
    return execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n").filter(Boolean).map((line) => line.slice(3));
  } catch { return []; }
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
  if (part.work !== "TEST" && part.work !== "RELEASE") return refuse(`${id} is a ${part.work} part: only a baseline, a full run or a release starts here, and a helper's part is launched from its brief`);
  if (part.state !== "ready") return refuse(`${id} is ${part.state}, not ready`);
  const open = part.waitsOn.filter((wait) => plan.parts.find((one) => one.id === wait)?.state !== "landed");
  if (open.length) return refuse(`${id} waits on ${open.join(", ")}, which has not landed`);
  // A full run, and the proof run after the releases, are taken on a tree that is not about to change, so the repository holds no uncommitted file.
  if (part.work === "RELEASE") {
    const held = releaseGate(ws, arc, plan, part, workspaceOf() ?? process.cwd());
    if (held) return refuse(held);
  }
  const changed = isFullRun(part) ? uncommitted(ws, part.repo) : [];
  if (changed.length) return refuse(`${id} is a ${isProofRun(part) ? "proof" : "full"} run, and ${part.repo} holds uncommitted changes: ${changed.join(", ")}; commit them, then start it`);
  const next: GoPlan = { ...plan, parts: plan.parts.map((one) => (one.id === id ? { ...one, state: "running" as const } : one)) };
  save(ws, arc, next);
  logEvent(ws, arc, "go", null, `${id} started`);
  console.log(`ok · ${arc} ${id} running`);
  if (part.work === "RELEASE") console.log(`Next: release ${part.repo}, then \`workstream report write\` on it.`);
  else if (isProofRun(part))
    console.log(`Next: run the whole tiers of ${part.repo} on what was released, then \`workstream row state ${basename(ws)}/${arc} <row> landed --run <name>\` for the arc's PROOF row, then \`workstream report write\` on it.`);
  else console.log(nextStep(`${basename(ws)}/${arc}`, ws, next).replace(/^Next: /, `Next: run the whole suite of ${part.repo}, then `));
  return 0;
}

function wait(args: string[]): number {
  const words = readWords(args, { on: VALUE, clear: FLAG });
  const [ref, id, ...more] = words.paths;
  const reason = words.value("on");
  const clear = words.given("clear");
  if (!id || more.length || (clear ? !!reason : !reason)) throw new UsageFault("takes an arc, one part and what it waits on, or `--clear`: `go wait <workstream>/N<nnn> <part> --on \"…\"` or `go wait <workstream>/N<nnn> <part> --clear`.");
  const { ws, arc } = arcNamed(ref);
  const plan = planOf(ws, arc);
  if (clear) {
    let cleared: GoPlan;
    try { cleared = clearWaiting(plan, id); } catch (thrown) { console.log(`Refused: ${(thrown as Error).message}. Nothing was changed.`); return 1; }
    save(ws, arc, cleared);
    const now = cleared.parts.find((one) => one.id === id)!;
    logEvent(ws, arc, "go", null, `${id} wait cleared, ${now.state === "ready" ? "ready" : `waiting on ${now.waitingOn}`}`);
    console.log(`ok · ${arc} ${id} ${now.state === "ready" ? "ready" : `waiting on ${now.waitingOn}`}`);
    console.log(nextStep(`${basename(ws)}/${arc}`, ws, cleared));
    return 0;
  }
  let next: GoPlan;
  try { next = markWaiting(plan, id, reason); } catch (thrown) { console.log(`Refused: ${(thrown as Error).message}. Nothing was changed.`); return 1; }
  save(ws, arc, next);
  logEvent(ws, arc, "go", null, `${id} waiting on ${reason.trim()}`);
  console.log(`ok · ${arc} ${id} waiting on ${reason.trim()}`);
  console.log(nextStep(`${basename(ws)}/${arc}`, ws, next));
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "after the go: derive the plan from the scope's sheets and the telemetry, and write every part's brief; run again it keeps landed and running parts", usage: "<workstream>/N<nnn> --scope N<nnn>,…", run: write },
  show: { describe: "print the parts: their files, their tests, their measured time and what each waits on", usage: "<workstream>/N<nnn> [--part <id>] [--json]", run: show },
  check: { describe: "read the plan against the sheets: an entry no part holds, or a part whose entries changed since the plan was written, which it marks held; exits 1 on any", usage: "<workstream>/N<nnn>", run: checkGo },
  start: { describe: "mark a baseline, a full run or a release as running; only a baseline or a full run lets the test-run check open the whole suite", usage: "<workstream>/N<nnn> <part>", run: start },
  wait: { describe: "mark a part waiting on something outside the plan (a release, a sign-in, another window's hold), with the reason in plain words; `--clear` takes the wait off, and the part reads ready when what it waits on in the plan has landed", usage: "<workstream>/N<nnn> <part> (--on \"…\" | --clear)", run: wait },
};
