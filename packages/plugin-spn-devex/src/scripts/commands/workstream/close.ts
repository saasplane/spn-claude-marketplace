// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § The close gate
//           RULE.DEVEX.WORKSPACE.485, a go's first plan and each release part wait for a panel's verdict on record
//           RULE.DEVEX.WORKSPACE.206, a close is a milestone, and the agent writes its message before it asks, or right after it closes on a standing grant
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream close <workstream>
//
// Runs the retrospective, then the close gate, stamps the approach page DONE and moves the folder into `closed/`. A go that `go check` finds
// anything in refuses the close before the gate runs, and a refused close leaves the page and the folder as they were.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { gateClose } from "../../checks/split-plan.ts";
import { logFiles, telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { stageOf } from "../../../../../plugin-support-lib/src/lib/telemetry-values.ts";
import { isTestCommand } from "../../checks/test-run.ts";
import { goFileOf } from "../../lib/go-plan.ts";
import { USAGE_LOG } from "../../lib/usage.ts";
import { approachOf, arcIdsOf, logFileOf, readJson, readJsonl, suggestionsFileOf, workspaceOf, writeJsonl, writeWhole } from "../../lib/workstream.ts";
import { OUTCOMES, cardName, suggestionFaults, type Suggestion } from "../../lib/workstream-schema.ts";
import { checkGo, renameGo } from "./go.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "close a workstream: run the close gate, stamp the approach page DONE, and move the folder into closed/";
export const usage = "<workstream>";

const refuse = (why: string): number => { console.log(`Refused: ${why}. Nothing was changed.`); return 1; };

/** What a closed page carries as its closing block: what was delivered, what was learned and the thanks. */
const CLOSING_PARTS: Array<[RegExp, string]> = [
  [/What (?:was|we) delivered/i, "\"What was delivered\""], [/What (?:was|we) learned/i, "\"What was learned\""], [/Thank you/i, "\"Thank you\""],
];

/** The closing block's pieces an approach page lacks, named; none where it carries all. */
export function missingClosingBlock(page: string): string[] {
  return CLOSING_PARTS.filter(([pattern]) => !pattern.test(page)).map(([, name]) => name);
}

/** The refusal of a page without its closing block: the shape closed pages carry, the rule, and that nothing was changed. */
const closingRefusal = (missing: string[]): string =>
  `the approach page has no closing block (missing ${missing.join(", ")}). Write it under the masthead, in the shape closed pages carry: ` +
  "a `<div class=\"sds-note\">` holding a 🚀 lead line, `<p>&nbsp;</p>`, `<p><strong>📦 What was delivered</strong></p>` and a list, " +
  "`<p>&nbsp;</p>`, `<p><strong>🧠 What was learned</strong></p>` and a list, `<p>&nbsp;</p>`, then `<p><strong>Thank you 👍</strong></p>` and a line " +
  "(RULE.DEVEX.WORKSPACE.206)";

/** The page with its masthead status and its header block reading DONE. */
function stamped(text: string): string {
  return text
    .replace(/(<span class="sds-label">Status:<\/span> )<span class="sds-badge sds-status sds-[a-z]+">[^<]*<\/span>/, '$1<span class="sds-badge sds-status sds-done">&#x2705; DONE</span>')
    .replace(/("status":\s*)"[A-Z]+"/, '$1"DONE"');
}

// ---------------------------------------------------------------------------- the retrospective

type Tally = { n: number; bad: number };
type Retro = {
  v: 1; workstream: string; at: string;
  stages: Record<string, { turns: number; ms: number }>; works: Record<string, { turns: number; ms: number }>;
  outcomes: Record<string, number>;
  checks: Record<string, { runs: number; denies: number; retried: number }>;
  parts: Record<string, { repo: string | null; work: string | null; starts: number; needsYou: number; modelMs: number; plannedMs: number | null }>;
  commands: Record<string, { runs: number; failed: number; retried: number; refused: number }>;
  shape: Record<string, number>;
  ungated: string[];
};

type Row = Record<string, unknown>;
const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);
const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** The v 1 rows of one workstream, hook log and usage log, rotated file first, each row once by its id. */
function rowsOf(root: string, name: string): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const log of ["hooks.jsonl", USAGE_LOG]) {
    for (const file of logFiles(join(telemetryFolder(root), log))) {
      for (const raw of readFileSync(file, "utf8").split("\n")) {
        if (!raw.trim()) continue;
        try {
          const one = JSON.parse(raw) as Row;
          if (one.v !== 1 || one.workstream !== name) continue;
          const id = text(one.id);
          if (id) { if (seen.has(id)) continue; seen.add(id); }
          out.push(one);
        } catch { /* a torn line is skipped */ }
      }
    }
  }
  return out;
}

/** The shape patterns an arc's log shows between its opening and its PROPOSED → DECIDED line: each of the developer's words and each card's answer is a line. */
const SHAPE: Record<string, RegExp> = {
  "names-replaced": /already written|replac|renam|existing name|one name/i,
  "fields-cut-or-restored": /\b(cut|restor|dropp?e?d?|remov)/i,
  "panel-overturned": /panel|overturn|blocked/i,
};

function shapeOf(ws: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const arc of arcIdsOf(ws)) {
    for (const line of readJsonl(logFileOf(ws, arc))) {
      const one = line as { kind?: string; note?: string } | undefined;
      if (!one) continue;
      if (one.kind === "status" && /PROPOSED\s*→\s*DECIDED/.test(one.note ?? "")) break;
      if (one.kind !== "header" && one.kind !== "answered" && one.kind !== "note") continue;
      for (const [pattern, re] of Object.entries(SHAPE)) if (re.test(one.note ?? "")) out[pattern] = (out[pattern] ?? 0) + 1;
    }
  }
  return out;
}

function retroOf(ws: string, root: string): Retro {
  const name = basename(ws);
  const rows = rowsOf(root, name);
  const retro: Retro = { v: 1, workstream: name, at: new Date().toISOString(), stages: {}, works: {}, outcomes: {}, checks: {}, parts: {}, commands: {}, shape: shapeOf(ws), ungated: [] };
  const part = (id: string) => (retro.parts[id] ??= { repo: null, work: null, starts: 0, needsYou: 0, modelMs: 0, plannedMs: null });
  const helpers = new Map<string, Set<string>>();
  const panels = { parts: new Set<string>(), arcs: new Set<string>() };
  const ordered = [...rows].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  for (const one of ordered) {
    const mtype = text(one.mtype);
    const id = text(one.part);
    const work = text(one.work);
    if (mtype === "TURN") {
      const stage = stageOf(text(one.skill), work) ?? "none";
      const s = (retro.stages[stage] ??= { turns: 0, ms: 0 }); s.turns += 1; s.ms += num(one.ms);
      const w = (retro.works[work ?? "none"] ??= { turns: 0, ms: 0 }); w.turns += 1; w.ms += num(one.ms);
      if (id) {
        part(id).modelMs += num(one.ms);
        const agent = text(one.agent);
        if (agent) helpers.set(id, (helpers.get(id) ?? new Set()).add(agent));
      }
    } else if (mtype === "CHECK") {
      const check = text(one.check);
      if (!check) continue;
      const c = (retro.checks[check] ??= { runs: 0, denies: 0, retried: 0 });
      c.runs += 1;
      if (one.verdict === "DENY") { c.denies += 1; if (text(one.retryOf)) c.retried += 1; }
    } else if (mtype === "COMMAND" || mtype === "TEST") {
      const call = (one.call ?? {}) as Record<string, unknown>;
      const key = [text(call.group), text(call.action)].filter(Boolean).join(" ") || String(text(call.program));
      // Only a code part's own tests failing and then passing inside that part are its red first: no pattern counts them.
      // Any other test or build that failed and was run again counts.
      const own = work === "CODE" || !!id?.startsWith("code-");
      if (own && mtype === "COMMAND" && isTestCommand({ script: text(call.program), group: text(call.group), action: text(call.action) } as never)) continue;
      if (own && mtype === "TEST") continue;
      const c = (retro.commands[key] ??= { runs: 0, failed: 0, retried: 0, refused: 0 });
      c.runs += 1;
      if (mtype === "TEST") { if (text(one.status) && one.status !== "SUCCESS") c.failed += 1; }
      else if (one.exit === 2) c.refused += 1; else if (one.exit !== null && one.exit !== undefined && num(one.exit) !== 0) c.failed += 1;
      if (text(one.retryOf)) c.retried += 1;
    } else if (mtype === "PANEL") {
      // A PANEL ROW GATES WHAT IT NAMES: its part, and its arc (RULE.DEVEX.WORKSPACE.485), so a release part counts as gated by a row naming either.
      if (id) panels.parts.add(id);
      if (text(one.arc)) panels.arcs.add(String(one.arc));
    }
  }
  for (const [id, agents] of helpers) part(id).starts = agents.size;
  for (const arc of arcIdsOf(ws)) {
    for (const line of readJsonl(logFileOf(ws, arc))) {
      const one = line as { kind?: string; row?: string | null } | undefined;
      if (!one?.kind) continue;
      if ((OUTCOMES as readonly string[]).includes(one.kind)) {
        retro.outcomes[one.kind] = (retro.outcomes[one.kind] ?? 0) + 1;
        if (one.kind === "needs-you" && one.row) part(one.row).needsYou += 1;
      }
    }
    if (!existsSync(goFileOf(ws, arc))) continue;
    renameGo(ws, arc);
    const plan = readJson(goFileOf(ws, arc)) as { parts?: Array<{ id: string; repo: string; work: string; minutes: number | null; entries?: string[] }> } | null;
    for (const one of plan?.parts ?? []) {
      const p = part(one.id);
      p.repo = one.repo; p.work = one.work; p.plannedMs = one.minutes === null ? null : one.minutes * 60000;
      const arcs = [arc, ...(one.entries ?? []).map((ref) => ref.split("/")[0])];
      if (one.work === "RELEASE" && !panels.parts.has(one.id) && !arcs.some((name) => panels.arcs.has(name))) retro.ungated.push(`release part ${one.id} has no panel row`);
    }
    if (!panels.arcs.has(arc) && plan?.parts?.length) retro.ungated.push(`${arc} go has no panel row on its preview`);
  }
  return retro;
}

/** Whether a count stands out against earlier workstreams': at least two, and a rate past one and a half times theirs; where they never had the pattern, two is enough. */
function stands(bad: number, n: number, before: Tally): boolean {
  if (bad < 2 || n === 0) return false;
  if (before.n === 0) return true;
  // 3 / 2 by whole numbers: exactly one and a half times does not stand out.
  return bad * before.n * 2 > 3 * before.bad * n;
}

function findingsOf(now: Retro, earlier: Retro[]): string[] {
  const out: string[] = [];
  // A panel is convened at the release gate and the design gate, so a gate without one is a finding whatever earlier workstreams did.
  for (const line of now.ungated) out.push(`gate:${line}`);
  if (!earlier.length) return out;
  const sum = (pick: (r: Retro) => Tally): Tally => earlier.reduce((t, r) => { const x = pick(r); return { n: t.n + x.n, bad: t.bad + x.bad }; }, { n: 0, bad: 0 });
  const allDenies = Object.values(now.checks).reduce((t, c) => t + c.denies, 0);
  for (const [name, c] of Object.entries(now.checks)) {
    const before = sum((r) => ({ n: r.checks[name]?.runs ?? 0, bad: (r.checks[name]?.retried ?? 0) }));
    if (stands(c.retried, c.runs, before)) { out.push(`check:${name} refuses a call again after it was retried`); continue; }
    const share = sum((r) => ({ n: Object.values(r.checks).reduce((t, x) => t + x.denies, 0), bad: r.checks[name]?.denies ?? 0 }));
    if (allDenies >= 3 && stands(c.denies, allDenies, share)) out.push(`check:${name} holds a larger share of the refused calls than before`);
  }
  for (const [key, c] of Object.entries(now.commands)) {
    const before = sum((r) => ({ n: r.commands[key]?.runs ?? 0, bad: (r.commands[key]?.failed ?? 0) + (r.commands[key]?.retried ?? 0) + (r.commands[key]?.refused ?? 0) }));
    if (stands(c.failed + c.retried + c.refused, c.runs, before)) out.push(`command:${key} fails and is run again, or is refused for how it was typed`);
  }
  const launches = Object.values(now.parts);
  const startsNow = { n: launches.length, bad: launches.reduce((t, p) => t + (p.starts > 1 ? 1 : 0) + p.needsYou, 0) };
  const startsBefore = sum((r) => ({ n: Object.keys(r.parts).length, bad: Object.values(r.parts).reduce((t, p) => t + (p.starts > 1 ? 1 : 0) + p.needsYou, 0) }));
  if (stands(startsNow.bad, startsNow.n, startsBefore)) {
    const works = [...new Set(launches.filter((p) => p.starts > 1 || p.needsYou).map((p) => p.work ?? "none"))];
    for (const work of works) out.push(`brief:${work} parts launched again, or reports needing you, more than before`);
  }
  const sizes = new Map<string, { off: number; n: number }>();
  for (const p of launches) {
    if (!p.repo || !p.work || !p.plannedMs || !p.modelMs) continue;
    const key = `${p.repo}|${p.work}`;
    const one = sizes.get(key) ?? { off: 0, n: 0 };
    one.n += 1;
    if (p.modelMs > 2 * p.plannedMs || p.modelMs < p.plannedMs / 2) one.off += 1;
    sizes.set(key, one);
  }
  for (const [key, one] of sizes) if (one.off === one.n && one.n >= 1) out.push(`part-size:${key} model time is far from the plan's`);
  for (const [pattern, count] of Object.entries(now.shape)) {
    const before = sum((r) => ({ n: 1, bad: r.shape?.[pattern] ?? 0 }));
    if (count >= 2 && before.n > 0 && count * before.n * 2 > 3 * before.bad) out.push(`ideate:${pattern} the decided shape is far from its first preview`);
  }
  return out;
}

/** Reads the workstream's rows beside earlier workstreams' retro.json, writes this one's retro.json and raises one suggestion for each pattern that stands out. Returns the titles raised. */
function retrospective(ws: string, root: string): string[] {
  const here = basename(ws);
  const closed = workstreamsDir(root, "closed");
  const earlier: Retro[] = [];
  if (existsSync(closed)) {
    for (const name of readdirSync(closed)) {
      if (name === here) continue;
      const one = readJson(join(closed, name, "retro.json")) as Retro | null;
      if (one && one.v === 1) earlier.push(one);
    }
  }
  const now = retroOf(ws, root);
  writeWhole(join(ws, "retro.json"), `${JSON.stringify(now, null, 2)}\n`);
  const file = suggestionsFileOf(ws);
  const records = readJsonl(file).filter((line): line is Suggestion => !!line && typeof line === "object");
  const raised: string[] = [];
  for (const finding of findingsOf(now, earlier)) {
    const title = `Retrospective · ${finding}`;
    if (records.some((one) => one.title === title)) continue;
    const next = Math.max(0, ...records.map((one) => Number(/^s(\d+)$/.exec(one.id)?.[1] ?? 0))) + 1;
    const record: Suggestion = { id: `s${next}`, title, state: "raised", preview: null, words: null };
    if (suggestionFaults(record, cardName(record.id)).length) continue;
    records.push(record);
    raised.push(`${cardName(record.id)} ${title}`);
  }
  if (raised.length) writeJsonl(file, records);
  return raised;
}

export function run(args: string[]): number {
  const words = readWords(args);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one workstream.");
  const ws = workstreamNamed(ref);
  const root = workspaceOf();
  if (!root) throw new UsageFault("runs inside a workspace.");
  const held = basename(dirname(ws));
  if (held === "closed") return refuse(`${basename(ws)} is already closed`);

  // THE CLOSING BLOCK IS WRITTEN BEFORE THE CLOSE (RULE.DEVEX.WORKSPACE.206): a page found without it after its folder has moved has to be
  // opened again, so a page without it refuses here, before anything is stamped, raised or moved.
  const closingPage = approachOf(ws);
  if (closingPage) {
    const missing = missingClosingBlock(readFileSync(closingPage, "utf8"));
    if (missing.length) return refuse(closingRefusal(missing));
  }

  // Each go is read against its sheets first; the gate then reads the plan again for the parts that have not landed.
  for (const arc of arcIdsOf(ws)) {
    if (!existsSync(goFileOf(ws, arc))) continue;
    if (checkGo([`${basename(ws)}/${arc}`]) !== 0) return refuse(`the go of ${arc} is not whole: \`workstream go write\` derives it again`);
  }

  // The retrospective runs before the gate: it only reads rows and raises suggestions, and a refused close keeps what it raised.
  const raised = retrospective(ws, root);
  for (const line of raised) console.log(`retrospective · raised ${line}`);

  const page = approachOf(ws);
  const target = `${workstreamsDir(root, "closed")}/${basename(ws)}`;
  const original = page ? readFileSync(page, "utf8") : null;
  if (page && original !== null) writeFileSync(page, stamped(original), "utf8");
  const verdict = gateClose({ tool_name: "Bash", tool_input: { command: `mv '${ws}' '${target}'` }, cwd: root });
  if (verdict?.deny) {
    if (page && original !== null) writeFileSync(page, original, "utf8");
    console.log(verdict.deny);
    return refuse(`the close gate holds ${basename(ws)}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  renameSync(ws, target);
  console.log(`ok · ${basename(ws)} closed · approach page stamped DONE · moved from ${held}/ into closed/`);
  // A CLOSE IS A MILESTONE (RULE.DEVEX.WORKSPACE.206): the message is written right now, and the Stop hook sends back a reply that lacks it.
  console.log("Next: write the closing message now: a `# 🚀 <title>` heading (or ✈️), a line reading `&nbsp;`, `### 📦 What we delivered` with bullets, " +
    "`### 🧠 What we learned` with bullets, `Thank you 👍`, and one plain line that the window can be retired (RULE.DEVEX.WORKSPACE.206).");
  return 0;
}
