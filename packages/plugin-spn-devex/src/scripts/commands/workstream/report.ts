// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream report write [<workstream>] <notes/N<nnn>/orders/<row>.report.md>
//
// Folds a child's hand-back into its row from the report's front matter alone: the outcome as the
// row's state, the proof, the commits and the cost, and each follow-up as a new row. Where the report
// carries no cost, the cost is read from the telemetry (`debug cost show`) for the arc and the order.
//
// A report named for a part of the arc's go plan folds into the part: it lands the part, and lands each step
// whose entries all sit in landed parts, a code or proving step on the full run. It ends with the next step.

import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { frontMatter } from "../../lib/front-matter.ts";
import { readGo } from "../../lib/go-plan.ts";
import { doneOf, landingFault, logEvent, notesDirOf, readArc, readQuestions, readyRows, workspaceOf, writeArc } from "../../lib/workstream.ts";
import { OUTCOMES, ROW_ID, type ArcRow, type Cost, type GoPart, type GoPlan } from "../../lib/workstream-schema.ts";
import { afterWrite, arcSignatures, refreshIfMoved, typed, workstreamNamed } from "./_shared.ts";
import { readCost } from "../../lib/cost.ts";
import { nextStep, save } from "./go.ts";

export const describe = "a child's hand-back, folded into its row from the report's front matter";

/** The cost of one order as `debug cost show <workstream>/<arc>` reads it, or null where the telemetry holds none. */
function measuredCost(ws: string, arc: string, order: string): Cost | null {
  try {
    const root = workspaceOf(ws);
    if (!root) return null;
    const found = readCost(root, `${basename(ws)}/${arc}`).rows.filter((row) => row.key.split(" · ").includes(`order ${order}`));
    if (!found.length) return null;
    const tokens = found.reduce((sum, row) => sum + row.input + row.cacheWrite + row.cacheRead + row.output, 0);
    const minutes = Math.round(found.reduce((sum, row) => sum + row.modelMs, 0) / 60000);
    return { tokens, minutes };
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
        if ((row.altitude === "CODE" || row.altitude === "PROOF") && part.pass !== "FULL_RUN") continue;
        const fault = landingFault(ws, arc, data, row, run);
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
  for (const line of [...refused.map((one) => `! ${one}`), ...refreshed.lines, ...afterWrite(ws)]) console.log(line);
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
  const cost = matter.cost as { tokens?: unknown; minutes?: unknown } | null;
  if (cost && typeof cost === "object" && typeof cost.tokens === "number" && typeof cost.minutes === "number")
    row.cost = { tokens: cost.tokens, minutes: cost.minutes };
  else row.cost = measuredCost(ws, arc, named) ?? row.cost ?? null;
  const order = `orders/${named}.md`;
  if (existsSync(join(notesDirOf(ws, arc), order))) row.order = order;

  const added: string[] = [];
  for (const followUp of Array.isArray(matter.followUps) ? matter.followUps.map(String) : []) {
    const [id, ...title] = followUp.trim().split(/\s+/);
    if (!ROW_ID.test(id) || !title.length || data.rows.some((one) => one.id === id)) continue;
    // A follow-up is a build step, a fix (RULE.DEVEX.WORKSPACE.278).
    const next: ArcRow = { id, parent: row.parent, title: title.join(" "), kind: "fix", state: "waiting" };
    for (const field of ["repo", "altitude", "model"] as const) if (row[field]) next[field] = row[field];
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
  if (plan) console.log(nextStep(`${basename(ws)}/${arc}`, ws, plan));
  return 0;
}

export const actions: Record<string, Action> = {
  write: { describe: "fold a child's report into its row: state, proof, cost, commits, follow-ups", usage: "[<workstream>] <report.md>", run: write },
};
