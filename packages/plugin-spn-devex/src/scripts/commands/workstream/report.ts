// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The formats
//           RULE.DEVEX.WORKSPACE.495, a helper that meets a name, a shape or a construct no entry holds stops and lists it under `unnamed:`
//           RULE.DEVEX.WORKSPACE.488, a suggestion belongs to an arc, as a card does, and the arc's sheet cites it
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream report write [<workstream>] <notes/<arc>/orders/<row>.report.md>
//   spn-devex workstream report write <workstream>/<arc> <part-id> [--run <name>]
//
// The second form has no report file: it writes `<part-id>.report.md` itself and folds it. `go` and `part` come from the plan, `commits`
// from the part's repository commits made since the part's `go start` (else since its brief was written) in the worktree the brief names,
// `proof` from the named run, `outcome: landed` when that run is green and `stopped` when it is not, and `followUps` and `unnamed` are empty.
// A helper's own report file, saved to return `needs-you`, a follow-up or an `unnamed:` list, is folded as the first form does.
//
// Folds a child's hand-back into its row from the report's front matter alone: the outcome as the
// row's state, the proof, the commits and each follow-up as a new row. The cost is never read from the report: it is
// measured from the usage rows the telemetry holds for the arc and the part.
//
// A report named for a part of the arc's go plan folds into the part: it lands the part, and lands each step
// whose entries all sit in landed parts, a code or proving step on the full run, or on the run the report names.
// A row it lands or leaves is printed with its split of change, proof, managing and refusals; every fault that
// keeps a row is named at once. It ends with the next step.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type Action, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { frontMatter } from "../../lib/front-matter.ts";
import { readGo } from "../../lib/go-plan.ts";
import { doneOf, landingFault, logEvent, logFileOf, suggestionLandingFault, notesDirOf, readArc, readJsonl, readQuestions, readyRows, workspaceOf, writeArc, writeWhole } from "../../lib/workstream.ts";
import { OUTCOMES, ROW_ID, type ArcRow, type Cost, type GoPart, type GoPlan } from "../../lib/workstream-schema.ts";
import { afterWrite, arcNamed, arcSignatures, refreshIfMoved, typed, workstreamNamed } from "./_shared.ts";
import { namedRun, worst } from "../../../../../plugin-support-lib/src/lib/runs.ts";
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

/** What a report lists under `unnamed:`: each name, shape or construct the helper met that no entry holds. */
export function unnamedOf(matter: Record<string, unknown>): string[] {
  const listed = matter.unnamed;
  const items = Array.isArray(listed) ? listed : typeof listed === "string" && listed.trim() ? [listed] : [];
  return items.map((one) => String(one).trim()).filter(Boolean);
}

/** Folds a part's report: the part lands, and so does each step whose entries all sit in landed parts. */
function foldPart(ws: string, lead: string, plan: GoPlan, part: GoPart, outcome: string, matter: Record<string, unknown>): number {
  const signatures = arcSignatures(ws);
  // The part's measured cost, from the same usage rows a row's cost is read from, goes onto the part as it lands (MKT.SCRIPTS.454).
  const cost = outcome === "landed" ? measuredCost(ws, lead, part.id) : null;
  const parts = plan.parts.map((one) => (one.id === part.id
    ? { ...one, state: outcome === "landed" ? "landed" as const : "ready" as const, ...(cost ? { cost } : {}) } : one));
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

/** The commits a part's repository took since the part started, in the worktree its brief names: from its `go start` line, else from when its brief was written. */
function commitsSince(ws: string, lead: string, part: GoPart, root: string): string[] {
  const dir = join(root, ".worktrees", basename(ws), part.repo);
  if (!existsSync(dir)) return [];
  const started = readJsonl(logFileOf(ws, lead)).map((line) => line as { at?: string; kind?: string; note?: string } | undefined)
    .filter((one) => one?.kind === "go" && one.note === `${part.id} started` && typeof one.at === "string").map((one) => one!.at as string).at(-1);
  let since = started;
  if (!since) { try { since = statSync(join(notesDirOf(ws, lead), "orders", `${part.id}.md`)).mtime.toISOString(); } catch { return []; } }
  try {
    return execFileSync("git", ["-C", dir, "log", `--since=${since}`, "--format=%H", "--reverse"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch { return []; }
}

/**
 * The report a part's `--run` writes for it where the helper saved none: the plan's go and part, the commits since the part started, the proof from the
 * named run, `landed` when that run is all green and `stopped` when it is not. A part that names no run and owes no test lands on its commits.
 */
function composedReport(ws: string, lead: string, plan: GoPlan, part: GoPart, run: string | null): string {
  const root = workspaceOf(ws) ?? process.cwd();
  const commits = commitsSince(ws, lead, part, root);
  let green = false;
  let proof = "no run named";
  if (run) {
    const results = namedRun(join(root, ".worktrees", basename(ws), part.repo), run).runs.flatMap((one) => one.results);
    green = results.length > 0 && worst(results.map((result) => result.status)) === "SUCCESS";
    proof = results.length ? `run ${run} · ${results.length} ids · ${green ? "SUCCESS" : "not all SUCCESS"}` : `run ${run} is in no run file of ${part.repo}`;
  } else green = part.tests.length === 0;
  return ["---", `go: "${plan.lead}"`, `part: "${part.id}"`, `outcome: ${green ? "landed" : "stopped"}`, `proof: ${JSON.stringify(proof)}`,
    ...(run ? [`run: ${JSON.stringify(run)}`] : []),
    `commits: { ${commits.length ? `${part.repo}: [${commits.map((sha) => `"${sha}"`).join(", ")}]` : ""} }`, "followUps: []", "unnamed: []", "---", ""].join("\n");
}

function write(args: string[]): number {
  const words = readWords(args, { run: VALUE });
  const [first, second, ...more] = words.paths;
  if (more.length || !first) throw new UsageFault("takes a report, after its workstream where it is named from there, or an arc and a part: `report write <workstream>/<arc> <part-id> [--run <name>]`.");
  // THE SECOND FORM NAMES A PART, NOT A FILE: with no report saved for it, the report is written here and folded.
  const byPart = !!second && !second.endsWith(".md") && !existsSync(resolve(second));
  let path: string;
  if (byPart) {
    const { ws, arc } = arcNamed(first);
    renameGo(ws, arc);
    const plan = typed(() => readGo(ws, arc));
    const part = plan?.parts.find((one) => one.id === second);
    if (!plan || !part) throw new UsageFault(`finds no part ${second} in ${arc}'s plan.`);
    path = join(notesDirOf(ws, arc), "orders", `${part.id}.report.md`);
    if (!existsSync(path)) writeWhole(path, composedReport(ws, arc, plan, part, words.value("run") ?? null));
  } else {
    const ws0 = second ? workstreamNamed(first) : null;
    path = second ? (existsSync(resolve(second)) ? resolve(second) : join(ws0!, second)) : resolve(first);
  }
  if (!existsSync(path)) throw new UsageFault(`finds no report at \`${second ?? first}\`.`);
  const placed = /^(.*)\/notes\/(N\d+[a-z]?|ideate|follow-ups)\/orders\/([^/]+)\.report\.md$/.exec(path.split("\\").join("/"));
  if (!placed) throw new UsageFault("reads a report at `notes/<arc>/orders/<row>.report.md`, the arc being `N<nnn>`, `ideate` or `follow-ups`.");
  const [, ws, arc, named] = placed;
  renameFirstRead(ws, arc);
  renameGo(ws, arc);
  const data = typed(() => { const one = readArc(ws, arc); if (!one) throw new Error(`finds no arcs/${arc}/state.json`); return one; });
  const matter = frontMatter(readFileSync(path, "utf8"));
  if (!matter) throw new UsageFault("reads a report that opens with front matter between two `---` lines.");
  const rowId = String(matter.row ?? named);
  const outcome = String(matter.outcome ?? "");
  if (!(OUTCOMES as readonly string[]).includes(outcome)) throw new UsageFault(`reads \`outcome: ${outcome}\`, and it is one of ${OUTCOMES.join(" · ")}.`);
  // A HELPER THAT MET A NAME NO ENTRY HOLDS STOPPED (RULE.DEVEX.WORKSPACE.495): the part does not land with it unraised.
  const unnamed = unnamedOf(matter);
  if (outcome === "landed" && unnamed.length) {
    console.log(`Refused: ${named} reports \`outcome: landed\` and lists ${unnamed.length === 1 ? "a name" : `${unnamed.length} names`} no entry holds under \`unnamed:\`: ${unnamed.map((one) => `\`${one}\``).join(", ")}. ` +
      "Raise each one (a suggestion that improves the book in the builder's workspace, a card where it decides the shape), and give the helper the name in a new order. Nothing was written. (RULE.DEVEX.WORKSPACE.495)");
    return 1;
  }
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
  write: { describe: "fold a child's report into its row: state, proof, commits, follow-ups; with an arc and a part id and no report file it writes the report itself from the plan, the commits since the part started and the named run", usage: "[<workstream>] <report.md> | <workstream>/<arc> <part-id> [--run <name>]", run: write },
};
