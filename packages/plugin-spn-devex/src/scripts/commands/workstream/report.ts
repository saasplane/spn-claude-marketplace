// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The formats
//           RULE.DEVEX.WORKSPACE.488, a suggestion belongs to an arc, as a card does, and the arc's sheet cites it
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream report write [<workstream>] <notes/N<nnn>/orders/<row>.report.md>
//
// Folds a child's hand-back into its row from the report's front matter alone: the outcome as the
// row's state, the proof, the commits and each follow-up as a new row. The cost is never read from the report: it is
// measured from the usage rows the telemetry holds for the arc and the part.
//
// A report named for a part of the arc's go plan folds into the part: it lands the part, and lands each step
// whose entries all sit in landed parts, a code or proving step on the full run, or on the run the report names.
// A row it lands or leaves is printed with its split of change, proof, managing and refusals; every fault that
// keeps a row is named at once. It ends with the next step.

import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { frontMatter } from "../../lib/front-matter.ts";
import { readGo } from "../../lib/go-plan.ts";
import { doneOf, landingFault, logEvent, suggestionLandingFault, notesDirOf, readArc, readQuestions, readyRows, workspaceOf, writeArc } from "../../lib/workstream.ts";
import { OUTCOMES, ROW_ID, type ArcRow, type Cost, type GoPart, type GoPlan } from "../../lib/workstream-schema.ts";
import { afterWrite, arcSignatures, refreshIfMoved, typed, workstreamNamed } from "./_shared.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { USAGE_LOG } from "../../lib/usage.ts";
import { isFullRun, nextStep, renameGo, save } from "./go.ts";
import { renameFirstRead } from "./sheet.ts";
import { readSplit } from "../debug/cost.ts";

export const describe = "a child's hand-back, folded into its row from the report's front matter";

/** The cost of one part: the v 1 TURN rows of this workstream, arc and part, each reply once by its id, or null where the telemetry holds none. */
function measuredCost(ws: string, arc: string, part: string): Cost | null {
  try {
    const root = workspaceOf(ws);
    if (!root) return null;
    const seen = new Set<string>();
    let tokens = 0, ms = 0, found = 0;
    for (const file of logFiles(join(telemetryFolder(root), USAGE_LOG))) {
      for (const raw of readFileSync(file, "utf8").split("\n")) {
        if (!raw.trim()) continue;
        try {
          const one = JSON.parse(raw) as Record<string, unknown>;
          if (one.v !== 1 || one.mtype !== "TURN") continue;
          if (one.workstream !== basename(ws) || String(one.arc).toUpperCase() !== arc.toUpperCase() || one.part !== part) continue;
          if (typeof one.id === "string" && one.id) { if (seen.has(one.id)) continue; seen.add(one.id); }
          const n = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
          const used = (one.tokens ?? {}) as Record<string, unknown>;
          tokens += n(used.in) + n(used.cacheRead) + n(used.cacheWrite) + n(used.out);
          ms += n(one.ms);
          found += 1;
        } catch { /* a torn line is skipped */ }
      }
    }
    return found ? { tokens, minutes: Math.round(ms / 60000) } : null;
  } catch { return null; }
}

/** The row's calls and minutes in each class, as `debug cost show` splits them, or null where the telemetry holds none for it. */
function splitLine(ws: string, arc: string, rowId: string): string | null {
  try {
    const root = workspaceOf(ws);
    if (!root) return null;
    const found = readSplit(root, `${basename(ws)}/${arc}`).find((one) => one.key === `${arc} · row ${rowId}`);
    const share = (kind: "change" | "proof" | "managing" | "refusals"): string => `${kind} ${found ? `${found[kind].calls} · ${found[kind].minutes}m` : "0 · 0m"}`;
    return `row ${rowId} split: ${(["change", "proof", "managing", "refusals"] as const).map(share).join(" · ")}`;
  } catch { return null; }
}

/** Folds a part's report: the part lands, and so does each step whose entries all sit in landed parts. */
function foldPart(ws: string, lead: string, plan: GoPlan, part: GoPart, outcome: string, matter: Record<string, unknown>): number {
  const signatures = arcSignatures(ws);
  const parts = plan.parts.map((one) => (one.id === part.id ? { ...one, state: outcome === "landed" ? "landed" as const : "ready" as const } : one));
  const next: GoPlan = { ...plan, parts };
  save(ws, lead, next);
  logEvent(ws, lead, "go", null, `${part.id} ${outcome}`);
  const said: string[] = [];
  const refused: string[] = [];
  const splits: string[] = [];
  if (outcome === "landed") {
    const landed = new Set(parts.filter((one) => one.state === "landed").flatMap((one) => one.entries));
    const run = typeof matter.run === "string" ? matter.run : null;
    const commits = matter.commits && typeof matter.commits === "object" && !Array.isArray(matter.commits) ? matter.commits as Record<string, unknown> : {};
    for (const arc of plan.scope) {
      const data = readArc(ws, arc);
      if (!data) continue;
      for (const row of data.rows) {
        const held = row.entries ?? [];
        if (row.state === "landed" || !held.length) continue;
        if (held.some((id) => part.entries.includes(`${arc}/${id}`)) && Object.keys(commits).length) {
          const all: Record<string, string[]> = { ...(row.commits ?? {}) };
          for (const [repo, list] of Object.entries(commits)) all[repo] = [...new Set([...(all[repo] ?? []), ...(Array.isArray(list) ? list : [list]).map(String)])];
          row.commits = all;
        }
        if (!held.every((id) => landed.has(`${arc}/${id}`))) continue;
        // A code or proof step waits for a TEST part's full run, unless the report names a run, which the landing gate judges.
        if ((row.work === "CODE" || row.work === "PROOF") && !isFullRun(part) && !run) continue;
        const fault = landingFault(ws, arc, data, row, run) ?? suggestionLandingFault(ws, arc, data, row);
        const split = splitLine(ws, arc, row.id);
        if (split) splits.push(split);
        if (fault) { refused.push(`${arc} ${row.id} stays: ${fault}`); continue; }
        row.state = "landed";
        if (run) row.proof = `run ${run}`;
        said.push(`${arc} ${row.id} landed`);
        logEvent(ws, arc, "landed", row.id, `part ${part.id}${run ? ` · run ${run}` : ""}`);
      }
      typed(() => writeArc(ws, data));
    }
  }
  const refreshed = refreshIfMoved(ws, signatures);
  console.log([`ok`, `${lead} part ${part.id} ${outcome === "landed" ? "landed" : "not landed"}`, ...said, ...refreshed.said].join(" · "));
  for (const line of [...refused.map((one) => `! ${one}`), ...splits, ...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  console.log(nextStep(`${basename(ws)}/${lead}`, ws, next));
  return 0;
}

function write(args: string[]): number {
  const words = readWords(args);
  const [first, second, ...more] = words.paths;
  if (more.length || !first) throw new UsageFault("takes a report, after its workstream where it is named from there.");
  const ws0 = second ? workstreamNamed(first) : null;
  const path = second ? (existsSync(resolve(second)) ? resolve(second) : join(ws0!, second)) : resolve(first);
  if (!existsSync(path)) throw new UsageFault(`finds no report at \`${second ?? first}\`.`);
  const placed = /^(.*)\/notes\/(N\d+[a-z]?)\/orders\/([^/]+)\.report\.md$/.exec(path.split("\\").join("/"));
  if (!placed) throw new UsageFault("reads a report at `notes/N<nnn>/orders/<row>.report.md`.");
  const [, ws, arc, named] = placed;
  renameFirstRead(ws, arc);
  renameGo(ws, arc);
  const data = typed(() => { const one = readArc(ws, arc); if (!one) throw new Error(`finds no arcs/${arc}/state.json`); return one; });
  const matter = frontMatter(readFileSync(path, "utf8"));
  if (!matter) throw new UsageFault("reads a report that opens with front matter between two `---` lines.");
  const rowId = String(matter.row ?? named);
  const outcome = String(matter.outcome ?? "");
  if (!(OUTCOMES as readonly string[]).includes(outcome)) throw new UsageFault(`reads \`outcome: ${outcome}\`, and it is one of ${OUTCOMES.join(" · ")}.`);
  const plan = typed(() => readGo(ws, arc));
  const part = plan?.parts.find((one) => one.id === named);
  if (plan && part) return foldPart(ws, arc, plan, part, outcome, matter);
  const row = data.rows.find((one) => one.id === rowId);
  if (!row) throw new UsageFault(`finds no row ${rowId} in ${arc}.`);

  const before = new Set(readyRows(ws, data).map((one) => one.id));
  const signatures = arcSignatures(ws);
  row.state = outcome === "landed" ? "landed" : "stopped";
  if (typeof matter.proof === "string") row.proof = matter.proof;
  if (matter.commits && typeof matter.commits === "object" && !Array.isArray(matter.commits)) {
    const commits: Record<string, string[]> = { ...(row.commits ?? {}) };
    for (const [repo, list] of Object.entries(matter.commits))
      commits[repo] = [...new Set([...(commits[repo] ?? []), ...(Array.isArray(list) ? list : [list]).map(String)])];
    row.commits = commits;
  }
  if (outcome === "landed") {
    const fault = landingFault(ws, arc, data, row, typeof matter.run === "string" ? matter.run : null);
    if (fault) { console.log(`Refused: ${fault} Nothing was written.`); return 1; }
  }
  // A `cost:` line a report still carries is not read: the cost is what the usage rows of the part say.
  row.cost = measuredCost(ws, arc, named) ?? row.cost ?? null;
  const order = `orders/${named}.md`;
  if (existsSync(join(notesDirOf(ws, arc), order))) row.order = order;

  const added: string[] = [];
  for (const followUp of Array.isArray(matter.followUps) ? matter.followUps.map(String) : []) {
    const [id, ...title] = followUp.trim().split(/\s+/);
    if (!ROW_ID.test(id) || !title.length || data.rows.some((one) => one.id === id)) continue;
    // A follow-up is a build step, a fix (RULE.DEVEX.WORKSPACE.278).
    const next: ArcRow = { id, parent: row.parent, title: title.join(" "), kind: "fix", state: "waiting" };
    for (const field of ["repo", "work", "model"] as const) if (row[field]) next[field] = row[field];
    data.rows.push(next);
    added.push(id);
  }
  typed(() => writeArc(ws, data));
  logEvent(ws, arc, outcome, rowId, typeof matter.proof === "string" ? matter.proof : null);
  for (const id of added) logEvent(ws, arc, "added", id, `follow-up of ${rowId}`);

  const ready = readyRows(ws, data, readQuestions(ws)).map((one) => one.id).filter((id) => !before.has(id) && !added.includes(id));
  const refreshed = refreshIfMoved(ws, signatures);
  const { done, total } = doneOf(data);
  console.log(["ok", `${arc} ${done}/${total}`, ...added.map((id) => `${id} added`), ...ready.map((id) => `${id} ready`),
    ...(outcome === "needs-you" ? [`${rowId} needs you`] : []), ...refreshed.said].join(" · "));
  for (const line of [...refreshed.lines, ...afterWrite(ws)]) console.log(line);
  const split = outcome === "landed" ? splitLine(ws, arc, rowId) : null;
  if (split) console.log(split);
  if (plan) console.log(nextStep(`${basename(ws)}/${arc}`, ws, plan));
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "fold a child's report into its row: state, proof, commits, follow-ups", usage: "[<workstream>] <report.md>", run: write },
};
