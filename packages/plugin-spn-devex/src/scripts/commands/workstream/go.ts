// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Once an arc is decided, it runs in three passes per repository · § The formats
//           RULE.DEVEX.WORKSPACE.485, a go's first plan and each release part wait for a panel's verdict on record
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream go write <workstream>/<arc> [--scope <arc>,…] [--after-close]
//   spn-devex workstream go show  <workstream>/<arc> [--part <id>] [--json]
//   spn-devex workstream go check <workstream>/<arc>
//   spn-devex workstream go start <workstream>/<arc> <part>
//   spn-devex workstream go wait  <workstream>/<arc> <part> --on "<what it waits on>"
//
// A go is the plan of the work after the developer's go: `go.json` in the lead arc's folder, derived from the sheets of the
// scope, and one brief for each part. `write` refuses a scope that is not decided or whose sheet has a finding; run again
// it keeps every landed and running part and names every fault of the scope in one refusal. `check` reads the plan against the sheets and holds the parts whose entries moved.
// Every command ends with the next step to run.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  clearWaiting, deriveGo, fullRunMinutes, goFileOf, isApplyPart, landedEntries, landedOrder, landedMeasures, markWaiting, planScope, proposeScopes, readGo, readyParts, redCheckIds, ratesOf, staleEntries, tangledParts, testFilesOf, unheldEntries,
  type ScopeSheet,
} from "../../lib/go-plan.ts";
import { arcDataDir, arcIdsOf, logEvent, logFileOf, notesDirOf, readArc, readJson, readJsonl, readSheet, workspaceOf, writeWhole } from "../../lib/workstream.ts";
import { DONE_STATES, renameDataToWork, type ArcData, type GoPart, type GoPlan, type SheetEntry } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf, workstreamNamed } from "./_shared.ts";
import { sizedStop } from "../../checks/child-size.ts";
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
    if (isApplyPart(first)) return `Next: make the lead's edits for the light entries of ${first.id} in the ${first.repo} worktree, then \`workstream go start ${ref} ${first.id}\`, which applies its patches and lands it as one commit.`;
    if (first.model === "lead") return `Next: carry out ${first.id} yourself from its brief ${briefOf(ws, plan.lead, first)}, then \`workstream report write\` on its report.`;
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
  if (scope[0] !== lead) faults.push(`\`--scope\` starts with \`${scope[0] ?? "nothing"}\`, and the lead is \`${lead}\`: the lead is the first arc of the scope: run \`workstream go write ${basename(ws)}/${lead} --scope ${[lead, ...scope.filter((one) => one !== lead)].join(",")}\``);
  for (const arc of scope) {
    renameFirstRead(ws, arc);
    const data = readArc(ws, arc);
    const sheet = readSheet(ws, arc);
    if (!data) { faults.push(`${arc} has no data: run \`workstream arc edit ${basename(ws)}/${arc} --status DECIDED\``); continue; }
    if (data.status !== "DECIDED") faults.push(`${arc} is ${data.status}, not DECIDED: run \`workstream arc edit ${basename(ws)}/${arc} --status DECIDED\``);
    if (!sheet) { faults.push(`${arc} keeps no sheet: run \`workstream sheet write ${basename(ws)}/${arc} --file <sheet.json>\``); continue; }
    for (const finding of sheetFindings(ws, arc)) faults.push(`${arc} sheet: ${finding}: run \`workstream sheet edit ${basename(ws)}/${arc} ${/^(E\d+)\b/.exec(finding)?.[1] ?? "<E>"} …\``);
    // A release part is named for its repository, so a line that is not one name would make a part no reader accepts.
    for (const line of sheet.releaseChain) if (!/^\S+$/.test(line)) faults.push(`${arc} sheet: the release order line "${line}" is not a repository's name: run \`workstream sheet write ${basename(ws)}/${arc} --file <sheet.json>\``);
    // A proof step not landed owes its repository a full run; an arc that changes no repository lands its proof on its check's run.
    const proofs = data.rows.filter((row) => row.work === "PROOF" && !DONE_STATES.has(row.state) && row.repo && row.repo !== "none").map((row) => row.repo as string);
    sheets.push({ arc, sheet, landed: landedEntries(data), proofs: [...new Set(proofs)] });
    arcs.push(data);
  }
  return { sheets, arcs, faults };
}

/** The directories a repository's test files are looked for in: the workstream's worktree first, then the checkout. */
const dirsIn = (root: string, ws: string, repo: string): string[] => [join(root, ".worktrees", basename(ws), repo), join(root, repo)];

/** A brief's acceptance: each test id the part's entries name in their tiers, beside the file that holds it, `<ID> · node <file>`. */
function acceptanceOf(part: GoPart, ws: string, root: string): string[] {
  const ids: string[] = [];
  for (const ref of part.entries) {
    const [arc, id] = ref.split("/");
    const entry = readSheet(ws, arc)?.entries.find((one) => one.id === id);
    for (const test of Object.values(entry?.tiers ?? {}).flat()) if (!ids.includes(test)) ids.push(test);
  }
  const lines = ids.flatMap((id) => {
    const files = testFilesOf([id], dirsIn(root, ws, part.repo));
    return files.length ? files.map((file) => `- \`${id} · node ${file}\`, run directly, never a whole suite`) : [`- \`${id}\`: no test file holds it yet, and this part's test entry writes it`];
  });
  return lines.length ? lines : part.tests.length ? part.tests.map((file) => `- \`node ${file}\`, run directly, never a whole suite`) : ["- the part names no test file of its own"];
}

/** What a part's time reads: for a landed part the cost its row recorded (minutes and tokens), else the plan's estimate, else "not measured". */
function workOf(part: GoPart, withSource: boolean): string {
  if (part.state === "landed" && part.cost) return `${part.cost.minutes} min · ${part.cost.tokens} tokens`;
  if (part.minutes === null) return "not measured";
  return withSource ? `${part.minutes} min (${part.measuredFrom})` : `${part.minutes} min`;
}

/** What a part's entries hold, read from its arcs' sheets: the files as `repository:place`, the cards that decided them and the facts they rest on. */
function entriesHeld(part: GoPart, ws: string): { files: string[]; decisions: string[]; facts: string[] } {
  const files: string[] = [], decisions: string[] = [], facts: string[] = [];
  const add = (list: string[], item: string): void => { if (item && !list.includes(item)) list.push(item); };
  for (const ref of part.entries) {
    const [arc, id] = ref.split("/");
    const entry = readSheet(ws, arc)?.entries.find((one) => one.id === id);
    if (!entry) continue;
    add(files, entry.file);
    for (const card of entry.decidedBy ?? []) if (/^q\d+$/i.test(card)) add(decisions, card.toLowerCase());
    for (const fact of entry.facts ?? []) add(facts, fact);
  }
  return { files, decisions, facts };
}

/** A code part's format line (S153): in an APPS repository, one `spnutils apps format <folder>` for each project folder its files sit in, run before its proof. */
function formatLines(part: GoPart, files: string[], ws: string, root: string): string[] {
  if (part.work !== "CODE") return [];
  const dir = repoDirOf(root, ws, part.repo);
  let type = "";
  try { type = dir ? String((JSON.parse(readFileSync(join(dir, "sprepo.json"), "utf8")) as { type?: unknown }).type) : ""; } catch { /* no sprepo.json: no format line */ }
  if (type !== "APPS") return [];
  const folders = [...new Set(files.map((file) => /:(?:apps|packages)\/([^/]+)\//.exec(file)?.[1]).filter((one): one is string => !!one))];
  return folders.length ? ["## Format", "", ...folders.map((folder) => `Before its proof, run \`spnutils apps format ${folder}\`.`), ""] : [];
}

/** The baseline's red check: the new cases run once on the base commit and must fail there. */
function redCheckLines(plan: GoPlan, part: GoPart, ws: string): string[] {
  const ids = redCheckIds(plan, planScope(ws, plan), part.repo);
  return ["## Red check", "", ...(ids.length ? ids.map((id) => `- \`${id}\``) : ["- the scope's code entries name no test id"]), "",
    "Each new case runs once on the base commit and must fail there.", ""];
}

function brief(plan: GoPlan, part: GoPart, ws: string, root: string): string {
  const held = entriesHeld(part, ws);
  const stop = sizedStop(part.entries.length);
  const ref = `${basename(ws)}/${plan.lead}`;
  const lines = [
    "---", `go: "${plan.lead}"`, `part: "${part.id}"`, `model: ${part.model}`,
    `blockedBy: [${part.waitsOn.map((id) => `"${id}"`).join(", ")}]`, `entries: [${part.entries.join(", ")}]`,
    `touches: [${held.files.map((file) => `"${file}"`).join(", ")}]`, `decisions: [${held.decisions.join(", ")}]`, `facts: [${held.facts.join(", ")}]`, "---",
    `# Order ${part.id}`, "",
    "| | |", "| --- | --- |",
    `| **Repo** | \`${part.repo}\` · **Run from:** \`${join(root, ".worktrees", basename(ws), part.repo)}\` |`,
    `| **Work** | ${part.work} · ${workOf(part, true)} |`, "",
    ...(part.model === "lead"
      ? ["**An after-close batch: the lead window carries this out itself**, as one part with one report, and launches no helper.",
         `Run \`workstream report write ${ref} ${part.id} --run <name>\` when it lands; save a report file beside this brief as \`${part.id}.report.md\`, its front matter first, only to return \`needs-you\`, a follow-up or an \`unnamed:\` list.`, ""]
      : [`**Launch no agent.** Stop at ${Math.round(stop.context / 1000)}k of context or ${stop.turns} turns, at the next whole step, say what is left and hand back.`,
         "**Read only the files below**; read further only where one of them sends you. **Search with `grep` in Bash, since you have no Grep tool.**",
         "Commit nothing. Hand back at most 8 lines, and run " + `\`workstream report write ${ref} ${part.id} --run <name>\`, which writes and folds the report. ` +
         `Save a report file beside this brief as \`${part.id}.report.md\`, at most 15 lines, its front matter first, only to return \`needs-you\`, a follow-up or an \`unnamed:\` list.`, ""]),
    "**A name, a shape or a construct no entry holds is not yours to make up** (RULE.DEVEX.WORKSPACE.495): stop, return `needs-you`, and list what you met under `unnamed:` in the report.", "",
    "## The entries", "",
    ...[...new Set(part.entries.map((ref) => ref.split("/")[0]))].map((arc) =>
      `- ${part.entries.filter((ref) => ref.startsWith(`${arc}/`)).map((ref) => `\`${ref}\``).join(", ")}: \`workstream sheet show ${arc} --part ${part.id}\` prints them`), "",
    ...(held.files.length ? ["## The files", "", ...held.files.map((file) => `- \`${file}\``), ""] : []),
    ...formatLines(part, held.files, ws, root),
    ...(part.id === `baseline-${part.repo}` ? redCheckLines(plan, part, ws) : []),
    "## Acceptance", "",
    ...acceptanceOf(part, ws, root), "",
    "## Report", "",
    "The front matter a saved report keeps, for the case that needs it; `workstream report write` folds it into the plan:", "",
    "```text", "---", `go: "${plan.lead}"`, `part: "${part.id}"`, "outcome: landed · stopped · needs-you",
    'proof: "<what you ran, and what it printed>"', "commits: {}", "followUps: []", "unnamed: []", "---", "```", "",
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

const gitIn = (dir: string, args: string[]): string => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const repoDirOf = (root: string, ws: string, repo: string): string | undefined => dirsIn(root, ws, repo).find((one) => existsSync(one));
const patchFileOf = (ws: string, arc: string, entry: SheetEntry): string => join(arcDataDir(ws, arc), entry.patch?.file ?? "");

/** Whether a patch is stale: the file at its base differs from the file at the worktree's head (content, not ancestry). */
function patchStale(dir: string, entry: SheetEntry): boolean {
  const path = entry.file.slice(entry.file.indexOf(":") + 1);
  const rev = (spec: string): string => { try { return gitIn(dir, ["rev-parse", spec]).trim(); } catch { return ""; } };
  return rev(`${entry.patch?.base}:${path}`) !== rev(`HEAD:${path}`);
}

/** Whether an entry's patch applies on its repository's worktree, read with `git apply --3way --check`; a patch that does not is cut into a helper's part on the entry's prose. */
function patchApplies(ws: string, arc: string, entry: SheetEntry, root: string): boolean {
  const dir = repoDirOf(root, ws, entry.file.slice(0, entry.file.indexOf(":")));
  if (!dir || !entry.patch || !existsSync(patchFileOf(ws, arc, entry)) || patchStale(dir, entry)) return false;
  try { gitIn(dir, ["apply", "--3way", "--check", patchFileOf(ws, arc, entry)]); return true; } catch { return false; }
}

function write(args: string[]): number {
  const words = readWords(args, { scope: VALUE, "after-close": FLAG });
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
  const measures = landedMeasures(root, basename(ws), arcs, previous);
  // The arcs of the workstream outside the scope, with their sheets and data: what a `dependsOn` line or a DOCS row names there waits as a line.
  const siblings: ScopeSheet[] = [];
  for (const other of arcIdsOf(ws).filter((one) => !scope.includes(one))) {
    const sheet = readSheet(ws, other);
    if (sheet) siblings.push({ arc: other, sheet, data: readArc(ws, other) });
  }
  const { circles, ...plan } = deriveGo(sheets.map((one) => ({ ...one, data: arcs.find((data) => data.arc === one.arc) ?? null })), {
    siblings,
    rates: ratesOf(measures), measures, previous, fullRunMinutes: fullRunMinutes(root), landedOrder: landedOrder(ws, lead), followUp: words.given("after-close"),
    dirsOf: (repo) => dirsIn(root, ws, repo),
    patchOk: (arc, entry) => patchApplies(ws, arc, entry, root),
  });
  if (circles.length) {
    const held = plan.parts.find((one) => one.id === circles[0][0])?.entries[0] ?? `${lead}/<E>`;
    console.log(`Refused: the waits of the plan close a circle through a release, ${tangledParts(plan.parts).length} parts held in circles; the shortest through each release: ${circles.map((one) => one.join(" -> ")).join(" · ")}: run \`workstream sheet edit ${basename(ws)}/${held.replace("/", " ")} --then …\`. Nothing was written.`);
    return 1;
  }
  save(ws, lead, plan);
  // The lead carries an apply part out itself: it has no brief.
  for (const part of plan.parts) if (part.entries.length && !isApplyPart(part) && part.state !== "landed" && part.state !== "running") writeWhole(briefOf(ws, lead, part), brief(plan, part, ws, root));
  logEvent(ws, lead, "go", null, `written · ${plan.parts.length} parts · scope ${scope.join(",")}`);
  console.log(`ok · ${lead} go written · ${plan.parts.length} parts over ${scope.join(", ")}`);
  console.log(nextStep(`${basename(ws)}/${lead}`, ws, plan));
  return 0;
}

function propose(args: string[]): number {
  const words = readWords(args, {});
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one workstream.");
  const ws = workstreamNamed(ref);
  const root = workspaceOf() ?? process.cwd();
  const decided: ScopeSheet[] = [];
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc), sheet = readSheet(ws, arc);
    if (data?.status === "DECIDED" && sheet) decided.push({ arc, sheet, data });
  }
  const minutes: Record<string, number | null> = {};
  const run = fullRunMinutes(root);
  for (const one of decided) for (const entry of one.sheet.entries) minutes[entry.file.slice(0, entry.file.indexOf(":"))] = run;
  const scopes = proposeScopes({ arcs: decided, minutes });
  if (!scopes.length) { console.log(`${basename(ws)} holds no decided arc with a sheet.`); return 0; }
  scopes.forEach((one, at) => {
    console.log(`scope ${at + 1} · ${one.arcs.join(", ")} · ${one.repos.join(", ")}`);
    console.log(`          one whole run and one release for each of the ${one.repos.length}, in place of ${one.arcs.length} · about ${one.savedMinutes} min saved`);
    if (one.waitsOn !== null) console.log(`scope ${at + 1} · ${one.arcs.join(", ")} · waits on scope ${one.waitsOn}'s releases`);
  });
  return 0;
}

function partLine(part: GoPart, waiting: boolean): string {
  const state = part.state === "ready" && waiting ? "waiting" : part.state;
  const time = workOf(part, false);
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

/**
 * Starts an apply part: its patches are checked, then applied in plan order with `git apply --3way` in the repository's worktree, and
 * committed with the lead's edits for the part's light entries as one commit, and the part lands on that commit. It has no brief and no report.
 */
function startApply(ws: string, arc: string, plan: GoPlan, part: GoPart, refuse: (why: string) => number): number {
  const root = workspaceOf() ?? process.cwd();
  const dir = repoDirOf(root, ws, part.repo);
  if (!dir) return refuse(`${part.id} finds no worktree of ${part.repo} for ${basename(ws)}`);
  const entries = part.entries.map((ref) => {
    const [from, id] = ref.split("/");
    return { ref, from, entry: readSheet(ws, from)?.entries.find((one) => one.id === id) };
  });
  const missing = entries.filter((one) => !one.entry).map((one) => one.ref);
  if (missing.length) return refuse(`${part.id} holds ${missing.join(", ")}, which no sheet holds`);
  const patched = entries.filter((one) => one.entry!.patch);
  for (const one of patched) {
    if (patchStale(dir, one.entry!)) {
      const path = one.entry!.file.slice(one.entry!.file.indexOf(":") + 1);
      return refuse(`${one.ref}'s patch is stale: ${path} moved since ${one.entry!.patch!.base}; run \`workstream sheet patch ${basename(ws)}/${one.from} ${one.entry!.id}\` against the new head`);
    }
    try { gitIn(dir, ["apply", "--3way", "--check", patchFileOf(ws, one.from, one.entry!)]); }
    catch (thrown) { return refuse(`${one.ref}'s patch does not apply in ${part.repo}: ${String((thrown as Error).message).split("\n").find((line) => line.trim()) ?? "git apply failed"}`); }
  }
  let commit: string;
  try {
    for (const one of patched) gitIn(dir, ["apply", "--3way", patchFileOf(ws, one.from, one.entry!)]);
    gitIn(dir, ["add", "--", ...entries.map((one) => one.entry!.file.slice(one.entry!.file.indexOf(":") + 1))]);
    gitIn(dir, ["commit", "-m", `${part.id}: ${patched.length} patch${patched.length === 1 ? "" : "es"} and ${entries.length - patched.length} light edit${entries.length - patched.length === 1 ? "" : "s"} (${basename(ws)}/${arc} ${entries.map((one) => one.ref).join(", ")})`]);
    commit = gitIn(dir, ["rev-parse", "HEAD"]).trim();
  } catch (thrown) { return refuse(`${part.id} could not be committed in ${part.repo}: ${String((thrown as Error).message).split("\n").find((line) => line.trim()) ?? "git failed"}`); }
  save(ws, arc, { ...plan, parts: plan.parts.map((one) => (one.id === part.id ? { ...one, state: "landed" as const } : one)) });
  logEvent(ws, arc, "go", null, `${part.id} applied · commit ${commit}`);
  logEvent(ws, arc, "go", null, `${part.id} landed`);
  console.log(`ok · ${arc} ${part.id} landed · ${patched.length} patch${patched.length === 1 ? "" : "es"} applied and committed as ${commit.slice(0, 10)}`);
  console.log(nextStep(`${basename(ws)}/${arc}`, ws, { ...plan, parts: plan.parts.map((one) => (one.id === part.id ? { ...one, state: "landed" as const } : one)) }));
  return 0;
}

function start(args: string[]): number {
  const words = readWords(args);
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one part: `go start <workstream>/<arc> <part>`.");
  const { ws, arc } = arcNamed(ref);
  const plan = planOf(ws, arc);
  const part = plan.parts.find((one) => one.id === id);
  if (!part) throw new UsageFault(`finds no part ${id} in ${arc}'s plan.`);
  const refuse = (why: string): number => { console.log(`Refused: ${why}. Nothing was changed.`); return 1; };
  if (part.work !== "TEST" && part.work !== "RELEASE" && !isApplyPart(part)) return refuse(`${id} is a ${part.work} part: only a baseline, a full run, a release or an apply part starts here, and a helper's part is launched from its brief`);
  if (part.state !== "ready") return refuse(`${id} is ${part.state}, not ready`);
  const open = part.waitsOn.filter((wait) => plan.parts.find((one) => one.id === wait)?.state !== "landed");
  if (open.length) return refuse(`${id} waits on ${open.join(", ")}, which has not landed`);
  // A full run, and the proof run after the releases, are taken on a tree that is not about to change, so the repository holds no uncommitted file.
  if (part.work === "RELEASE") {
    const held = releaseGate(ws, arc, plan, part, workspaceOf() ?? process.cwd());
    if (held) return refuse(held);
  }
  if (isApplyPart(part)) return startApply(ws, arc, plan, part, refuse);
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
  if (!id || more.length || (clear ? !!reason : !reason)) throw new UsageFault("takes an arc, one part and what it waits on, or `--clear`: `go wait <workstream>/<arc> <part> --on \"…\"` or `go wait <workstream>/<arc> <part> --clear`.");
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
  write: { describe: "after the go: derive the plan from the scope's sheets and the telemetry, and write every part's brief; run again it keeps landed and running parts; an arc is N<nnn>, ideate or follow-ups, and --scope takes a mixed list; --after-close makes the lead carry an after-close batch itself, as one part", usage: "<workstream>/<arc> --scope <arc>,… [--after-close]", run: write },
  propose: { describe: "before the go: print each proposed scope, the decided arcs that share a repository grouped in chain order, with the full runs and releases the grouping saves", usage: "<workstream>", run: propose },
  show: { describe: "print the parts: their files, their tests, their measured time and what each waits on", usage: "<workstream>/<arc> [--part <id>] [--json]", run: show },
  check: { describe: "read the plan against the sheets: an entry no part holds, or a part whose entries changed since the plan was written, which it marks held; exits 1 on any", usage: "<workstream>/<arc>", run: checkGo },
  start: { describe: "mark a baseline, a full run or a release as running; only a baseline or a full run lets the test-run check open the whole suite", usage: "<workstream>/<arc> <part>", run: start },
  wait: { describe: "mark a part waiting on something outside the plan (a release, a sign-in, another window's hold), with the reason in plain words; `--clear` takes the wait off, and the part reads ready when what it waits on in the plan has landed", usage: "<workstream>/<arc> <part> (--on \"…\" | --clear)", run: wait },
};
