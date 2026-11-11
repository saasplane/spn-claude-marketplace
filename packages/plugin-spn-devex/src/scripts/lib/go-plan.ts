// What a go is made of: the entries of the scope's change sheets, grouped into parts. A part is what one helper carries out:
// the entries of one repository in one kind of work, with a baseline and a full run around each repository's code. Repositories run
// in release chain order, and the release comes last. `go.json` keeps the plan in the lead arc's folder, and a write or a
// read of it is checked by `goFaults`.
//
// A part is cut to what a window can do in about 45 minutes, priced from the rows already landed in the same repository
// and kind of change (model time from telemetry, else the cost the row recorded), or 8 entries where nothing is measured.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { logFiles, telemetryFolder } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import {
  entryWork, goFaults, GO_SCHEMA_VERSION,
  type ArcData, type GoPart, type GoPlan, type Sheet, type SheetEntry, type Work,
} from "./workstream-schema.ts";
import { arcDataDir, logLinesOf, readArc, readSheet } from "./workstream.ts";

/** The minutes a part is cut to. */
export const PART_MINUTES = 45;
/** Entries in a part where no landed row measures its repository and kind of change. */
export const UNMEASURED_ENTRIES = 8;
const GO_FILE = "go.json";
const HOOKS_LOG = "hooks.jsonl";

/**
 * A sheet of the scope, with its arc, the ids of the entries its landed rows hold, the repositories it still owes a proof in,
 * and the ids of the entries `sheet drop` took out with a logged note.
 */
export type ScopeSheet = { arc: string; sheet: Sheet; landed?: readonly string[]; proofs?: readonly string[]; dropped?: readonly string[]; data?: ArcData | null };
/** The repository that holds the book: outside every release chain, and first in a go (RULE.DEVEX.WORKSPACE.455). */
export const BOOK_REPO = "spn-foundation";
/** What a landed row took: entries done in a repository at a kind of change, in minutes. */
export type Measure = { repo: string; work: string; entries: number; minutes: number };
/** A `TEST` row of `hooks.jsonl`, as far as a full run is told apart. */
export type TestLine = { v?: number; mtype?: string; at?: string; ms?: number; part?: string | null; status?: string; test?: { run?: string } | null };

/** `go.json`, in the folder of the lead arc. */
export const goFileOf = (ws: string, lead: string): string => join(arcDataDir(ws, lead), GO_FILE);

/** The go plan of a lead arc, or null where there is none; a plan that fails the schema is an error naming each fault. */
export function readGo(ws: string, lead: string): GoPlan | null {
  const file = goFileOf(ws, lead);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8")) as unknown;
  const faults = goFaults(data, GO_FILE);
  if (faults.length) throw new Error(`${file} fails its schema: ${faults.join("; ")}`);
  return data as GoPlan;
}

const repoOf = (entry: SheetEntry): string => entry.file.slice(0, entry.file.indexOf(":"));

/** An entry as a go names it, `N009/E14`. */
export const refOf = (arc: string, entry: SheetEntry): string => `${arc}/${entry.id}`;

/** The ids of the entries an arc's landed rows hold. */
export const landedEntries = (data: ArcData): string[] => data.rows.filter((row) => row.state === "landed").flatMap((row) => row.entries ?? []);

/** The entries a landed row of the scope holds, by ref: work already done, which no part plans again. */
export const landedRefs = (scope: readonly ScopeSheet[]): Set<string> =>
  new Set(scope.flatMap(({ arc, landed }) => (landed ?? []).map((id) => `${arc}/${id}`)));

/** The ids of the entries `sheet drop` took out of an arc's sheet, read from the log lines it wrote: `E12 dropped · why`. */
export function droppedEntries(ws: string, arc: string): string[] {
  const ids: string[] = [];
  for (const line of logLinesOf(ws, arc) as Array<{ kind?: unknown; note?: unknown }>) {
    const found = line && line.kind === "sheet" && typeof line.note === "string" ? /^(E\d+) dropped · /.exec(line.note) : null;
    if (found) ids.push(found[1]);
  }
  return ids;
}

/** The sheets of a plan's scope, each with the entries its arc's landed rows hold: what `go check` and the close gate read. */
export function planScope(ws: string, plan: GoPlan): ScopeSheet[] {
  const scope: ScopeSheet[] = [];
  for (const arc of plan.scope) {
    const sheet = readSheet(ws, arc);
    const data = readArc(ws, arc);
    if (sheet) scope.push({ arc, sheet, landed: data ? landedEntries(data) : [], dropped: droppedEntries(ws, arc) });
  }
  return scope;
}

/** The entries of the scope that neither a part nor a landed row holds, by ref. */
export function unheldEntries(plan: GoPlan, scope: readonly ScopeSheet[]): string[] {
  const held = new Set([...plan.parts.flatMap((part) => part.entries), ...landedRefs(scope)]);
  return scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => refOf(arc, entry)).filter((ref) => !held.has(ref)));
}

/**
 * A short hash of one entry as written, so a part's signature changes with any change to any of its entries. CITING A CARD IS NO
 * CHANGE TO THE WORK: `decidedBy` is left out, so a citation added or moved plans no follow-up and flags no part stale (s35, s58).
 */
export const entryHash = (entry: SheetEntry): string => {
  const { decidedBy: _cited, ...work } = entry;
  return createHash("sha1").update(JSON.stringify(work)).digest("hex").slice(0, 8);
};

/** The hash a plan signed before citations left it, decidedBy hashed in: an entry that stands as it was still matches its landed part. */
const signedWhole = (entry: SheetEntry): string => createHash("sha1").update(JSON.stringify(entry)).digest("hex").slice(0, 8);

/** Minutes for one entry in each repository and kind of change, from rows that landed: `<repo>|<work>`. Absent where unmeasured. */
export function ratesOf(measures: readonly Measure[]): Record<string, number> {
  const sums = new Map<string, { entries: number; minutes: number }>();
  for (const one of measures) {
    if (!(one.entries > 0) || !(one.minutes > 0)) continue;
    const key = `${one.repo}|${one.work}`;
    const held = sums.get(key) ?? { entries: 0, minutes: 0 };
    sums.set(key, { entries: held.entries + one.entries, minutes: held.minutes + one.minutes });
  }
  return Object.fromEntries([...sums].map(([key, sum]) => [key, sum.minutes / sum.entries]));
}

/**
 * What the landed work took: the cost each landed part of the plan recorded (`report write` measures it from the usage rows of its part,
 * and the part's repository and kind of work are the part's own), and the cost each landed row recorded where no part did. A part
 * that holds no entry, and a row with no repository, kind of work or entries, measure nothing.
 */
export function landedMeasures(root: string, workstream: string, arcs: readonly ArcData[], plan: GoPlan | null = null): Measure[] {
  void root; void workstream;
  const out: Measure[] = [];
  for (const part of plan?.parts ?? []) {
    if (part.state !== "landed" || !part.entries.length || !(part.cost && part.cost.minutes > 0)) continue;
    out.push({ repo: part.repo, work: part.work, entries: part.entries.length, minutes: part.cost.minutes });
  }
  for (const data of arcs) {
    for (const row of data.rows) {
      if (row.state !== "landed" || !row.repo || !row.work || !row.entries?.length) continue;
      out.push({ repo: row.repo, work: row.work, entries: row.entries.length, minutes: row.cost?.minutes ?? 0 });
    }
  }
  return out;
}

/**
 * The minutes of a full test run: the mean of the last three full runs whose `TEST` rows in `hooks.jsonl` all read SUCCESS, or
 * null with none. A full run is the rows of a part named `full-<repo>`; its time is from the earliest start among the rows of
 * one run to the latest end, because its tiers and nodes run side by side.
 */
export function fullRunMinutes(root: string): number | null {
  const runs = new Map<string, { from: number; to: number; green: boolean }>();
  for (const file of logFiles(join(telemetryFolder(root), HOOKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const line = JSON.parse(raw) as TestLine;
        if (line.v !== 1 || line.mtype !== "TEST" || typeof line.part !== "string" || !line.part.startsWith("full-")) continue;
        const run = line.test?.run, from = Date.parse(String(line.at)), ms = line.ms;
        if (!run || Number.isNaN(from) || typeof ms !== "number") continue;
        const held = runs.get(run) ?? { from, to: from + ms, green: true };
        runs.delete(run);
        runs.set(run, { from: Math.min(held.from, from), to: Math.max(held.to, from + ms), green: held.green && line.status === "SUCCESS" });
      } catch { /* a torn last line is skipped */ }
    }
  }
  const last = [...runs.values()].filter((one) => one.green).slice(-3).map((one) => one.to - one.from);
  return last.length ? last.reduce((sum, ms) => sum + ms, 0) / last.length / 60000 : null;
}

/**
 * The test files that name a behaviour id as `[ID]`, found with `git grep` in each directory in turn: the set's worktree
 * first, then the main checkout, a directory only being asked where the one before it found none.
 */
export function testFilesOf(ids: readonly string[], dirs: readonly string[]): string[] {
  const found = new Set<string>();
  for (const id of ids) {
    for (const dir of dirs) {
      if (!existsSync(dir)) continue;
      let hit = false;
      try {
        const text = execFileSync("git", ["grep", "--untracked", "-o", "-F", `[${id}]`], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
        for (const line of text.split("\n")) {
          const path = line.slice(0, line.lastIndexOf(":"));
          if (path && /(^|\/)tests?\/|\.test\.|(^|\/)t-[^/]+\.mjs$/.test(path)) { found.add(path); hit = true; }
        }
      } catch { /* git grep exits 1 with no match */ }
      if (hit) break;
    }
  }
  return [...found].sort();
}

/** How a part is cut: the rates, the directories its tests are looked for in (by repository), and where a part already stands. */
export type DeriveOptions = {
  rates?: Record<string, number>;
  /** The landed rows the rates came from, to say what each part's minutes were read from. */
  measures?: readonly Measure[];
  dirsOf?: (repo: string) => string[];
  /** The plan as it stands: its landed and running parts are kept, whole. */
  previous?: GoPlan | null;
  /** The mean of the last three timed full runs, which prices a baseline and a full run. */
  fullRunMinutes?: number | null;
  /** When the plan is written. */
  writtenAt?: string;
  /** The ids of the parts that landed, in the order they landed (`landedOrder`): tells a code part kept from before from one that landed after a full run. */
  landedOrder?: readonly string[];
  /** A small follow-up the lead window carries out itself: each repository's new entries in ONE part with one report, no baseline and no new release (s22). */
  followUp?: boolean;
  /** The other arcs of the workstream, outside the scope, with their sheets and data: what a `dependsOn` line or a DOCS row names there waits as a line. */
  siblings?: readonly ScopeSheet[];
  /** Whether an entry's patch applies on the repository's worktree (`git apply --3way --check`); a patch that does not loses its patch for this go. Absent, every patch stands. */
  patchOk?: (arc: string, entry: SheetEntry) => boolean;
};
/** A derived plan, with the parts of every wait circle that runs through a release: `go write` refuses a plan that has one and never saves the field. */
/** `ignored` names each `dependsOn` line that adds no wait: an arc of the scope whose repositories all come later in the chain (s186). */
export type DerivedGo = GoPlan & { circles: string[][]; ignored: string[] };

/** The ids of the parts that landed, oldest first, read from the `<part> landed` go lines of the lead arc's log. */
export function landedOrder(ws: string, lead: string): string[] {
  const rows: Array<{ at: number; id: string }> = [];
  for (const line of logLinesOf(ws, lead) as Array<{ kind?: unknown; note?: unknown; at?: unknown }>) {
    const found = line && line.kind === "go" && typeof line.note === "string" ? /^(\S+) landed$/.exec(line.note) : null;
    if (found) rows.push({ at: Date.parse(String(line.at)) || 0, id: found[1] });
  }
  return rows.sort((a, b) => a.at - b.at).map((one) => one.id);
}

/**
 * The minutes for one entry in a repository and kind of work: the repository's own rate, else the rate of the same kind of work in
 * another repository (`from` names it), else none (rate 0).
 */
export function rateOf(rates: Record<string, number>, repo: string, work: string): { rate: number; from: string | null } {
  const own = rates[`${repo}|${work}`];
  if (own > 0) return { rate: own, from: null };
  for (const [key, rate] of Object.entries(rates)) {
    const at = key.lastIndexOf("|");
    if (rate > 0 && key.slice(at + 1) === work && key.slice(0, at) !== repo) return { rate, from: key.slice(0, at) };
  }
  return { rate: 0, from: null };
}

/** Entries to a part: the 45 minutes over the rate for a repository and kind of change, or that kind's rate in another repository, or 8 where no part of that kind has landed. */
export function boundOf(rates: Record<string, number>, repo: string, work: string): number {
  const { rate } = rateOf(rates, repo, work);
  return rate > 0 ? Math.max(1, Math.floor(PART_MINUTES / rate)) : UNMEASURED_ENTRIES;
}

/** Whether a part is a repository's apply part, `apply-<repo>`: the patches and light entries the lead carries out itself. */
export const isApplyPart = (part: Pick<GoPart, "id">): boolean => part.id.startsWith("apply-");

/** The places a part has in a repository's run: a baseline and a full run are both TEST work, told apart by their ids. */
type Slot = "DOCS" | "BASELINE" | "CODE" | "FULL_RUN" | "GENERATED" | "RELEASE" | "PROOF";
/** The slots that carry entries; an entry of another kind of work is built with the code. */
const ENTRY_SLOTS: readonly Slot[] = ["DOCS", "CODE", "GENERATED"];
/** The order slots run in inside a repository. */
const SLOT_ORDER: readonly Slot[] = ["DOCS", "BASELINE", "CODE", "FULL_RUN", "GENERATED"];
/** The order parts are listed in: those slots, then the proof run, which comes after the releases. */
const LISTED_ORDER: readonly Slot[] = [...SLOT_ORDER, "PROOF"];

/** The slot a part stands in: its work, and for TEST work its id (`baseline-`, `full-` or `proof-`). */
const slotOf = (part: Pick<GoPart, "id" | "work">): Slot =>
  part.work === "TEST" ? (part.id.startsWith("baseline-") ? "BASELINE" : part.id.startsWith("proof-") ? "PROOF" : "FULL_RUN") : part.work as Slot;
const workOf = (slot: Slot): Work => (slot === "BASELINE" || slot === "FULL_RUN" || slot === "PROOF" ? "TEST" : slot);

/** A step is an entry of kind `step`: prose for the agent, a command and its proof, and a part of its own. A sheet written before kinds has none. */
const isStep = (entry: SheetEntry): boolean => entry.kind === "step";

const entrySlot = (entry: SheetEntry): Slot => {
  if (isStep(entry)) return "GENERATED";
  const work = entryWork(entry);
  return work === "DOCS" || work === "GENERATED" ? work : "CODE";
};
/** The files an entry's `callers`, `then` and `book` strings name, each as `<repo>:<path>` (a bare path is in the entry's own repository). */
export function namedFiles(entry: SheetEntry, fields: ReadonlyArray<"callers" | "then" | "book">): Set<string> {
  const out = new Set<string>();
  for (const field of fields)
    for (const text of Array.isArray(entry[field]) ? entry[field] as string[] : [])
      for (const found of String(text).matchAll(/(?:[\w.@-]+:)?[\w@.-]+(?:\/[\w@.-]+)+/g)) out.add(found[0].includes(":") ? found[0] : `${repoOf(entry)}:${found[0]}`);
  return out;
}

/** The decision an entry cites first: a preview section (`…#s3a`) or a card (`Q29`, `S70`), as the lower-case name a part is called by. */
function decisionOf(entry: SheetEntry): { decision: string; preview: boolean } | null {
  for (const text of Array.isArray(entry.decidedBy) ? entry.decidedBy : []) {
    const section = /#(s\d+[a-z]?)\b/i.exec(text);
    if (section) return { decision: section[1].toLowerCase(), preview: true };
    const card = /^([QS]\d+)\b/i.exec(text.trim());
    if (card) return { decision: card[1].toLowerCase(), preview: false };
  }
  return null;
}

/** The names an entry's `what` says it exports, declares or adds: a code-looking word after the verb, up to the clause's end. */
export function exportedNames(entry: Pick<SheetEntry, "what">): string[] {
  const out: string[] = [];
  for (const clause of String(entry.what).matchAll(/\b(?:export(?:s|ing|ed)?|declar(?:es|ing|ed)?|add(?:s|ing|ed)?)\b([^.;]*)/gi))
    for (const word of clause[1].matchAll(/`([^`]+)`|([A-Za-z_$][\w$]*)/g)) {
      const name = word[1] ?? word[2];
      if (word[1] || /[a-z][A-Z0-9]|_|^[A-Z]{2}/.test(name)) out.push(name);
    }
  return [...new Set(out)];
}
/** Whether a text names a name as a whole word, never as part of a longer one. */
export const namesIn = (text: string, name: string): boolean => new RegExp(`(?<![\\w$])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w$])`).test(text);

const numberOf = (part: GoPart): number => Number(part.id.slice(part.id.lastIndexOf("-") + 1)) || 0;

/**
 * A repository's code entries in the order they can be built: an entry that creates a file comes before an entry that uses it,
 * read from the entries' `file` against the other's `callers` and `then`. Where nothing says, the number order stands (s60).
 */
export function orderByUse(group: { refs: string[]; entries: SheetEntry[] }): void {
  const count = group.entries.length;
  const before: Set<number>[] = group.entries.map(() => new Set<number>());
  group.entries.forEach((maker, at) => {
    const names = exportedNames(maker);
    const users = maker.op === "create" ? namedFiles(maker, ["callers", "then"]) : new Set<string>();
    group.entries.forEach((user, other) => { if (other !== at && (users.has(user.file) || names.some((name) => namesIn(user.what, name)))) before[other].add(at); });
  });
  // EACH ENTRY FOLLOWS WHAT IT BUILDS ON, placed just before its first user; ANY CYCLE KEEPS THE NUMBER ORDER, whole.
  let done: number[] = [];
  const state = new Map<number, "walking" | "done">();
  let cycle = false;
  const visit = (at: number): void => {
    if (state.get(at) === "done") return;
    if (state.get(at) === "walking") { cycle = true; return; }
    state.set(at, "walking");
    for (const one of [...before[at]].sort((x, y) => x - y)) visit(one);
    state.set(at, "done");
    done.push(at);
  };
  for (let at = 0; at < count; at += 1) visit(at);
  if (cycle) done = group.entries.map((_, at) => at);
  const refs = done.map((at) => group.refs[at]), entries = done.map((at) => group.entries[at]);
  group.refs.splice(0, count, ...refs); group.entries.splice(0, count, ...entries);
}

/**
 * The plan of a go over the arcs of its scope, the first being the lead. Entries are grouped by repository, in the order of
 * the scope's release chain (a repository outside the chain last), then by kind of work, and each group is cut into parts of at most
 * its bound. A repository with code also gets a baseline and a full run, and the release comes last, one part to each line of
 * the scope's release chain. An entry a landed row holds is left out, unless it changed after its part landed. Derived again after a change, the previous plan's landed
 * and running parts stay as they were and the entries they hold are left out, except a landed part's entry that changed, which
 * gets a follow-up part; every other part is cut anew.
 */
export function deriveGo(scope: readonly ScopeSheet[], options: DeriveOptions = {}): DerivedGo {
  const rates = options.rates ?? {};
  const chain: string[] = [];
  for (const { sheet } of scope) for (const repo of sheet.releaseChain ?? []) if (!chain.includes(repo)) chain.push(repo);
  // A DROPPED PART IS KEPT AS IT IS: the developer's word that it will not run outlives the plan being derived again.
  const kept = (options.previous?.parts ?? []).filter((part) => part.state === "landed" || part.state === "running" || part.state === "dropped");
  const keptIds = new Set(kept.map((part) => part.id));
  const moved = new Set<string>();
  const keptRefs = new Set(kept.flatMap((part) => {
    const changed = part.state === "landed" ? changedEntries(part, scope) : [];
    for (const ref of changed) moved.add(ref);
    return part.entries.filter((ref) => !changed.includes(ref));
  }));
  // A landed row's entry is done, unless it changed after the part that held it landed: that one gets a follow-up part.
  const done = new Set([...landedRefs(scope)].filter((ref) => !moved.has(ref)));
  const groups = new Map<string, { repo: string; pass: Slot; refs: string[]; entries: SheetEntry[] }>();
  const repos: string[] = [];
  // A repository's APPLY entries: a code entry with a patch that applies, and a code entry with no tiers whose file no other entry of the scope edits.
  const fileUse = new Map<string, number>();
  for (const { sheet } of scope) for (const entry of sheet.entries) fileUse.set(entry.file, (fileUse.get(entry.file) ?? 0) + 1);
  const applyGroups = new Map<string, { refs: string[]; entries: SheetEntry[] }>();
  const stepGroups = new Map<string, Array<{ arc: string; ref: string; entry: SheetEntry }>>();
  const appliesIn = (arc: string, entry: SheetEntry): boolean => {
    if (options.followUp || entrySlot(entry) !== "CODE") return false;
    // A PATCHED CHANGE IS THE LEAD'S: one that no longer applies is refused by `go write`, never cut into a helper's part on its prose.
    if (entry.kind === "change" && entry.patch) return true;
    if (entry.patch) return options.patchOk ? options.patchOk(arc, entry) : true;
    return Object.values(entry.tiers ?? {}).flat().length === 0 && fileUse.get(entry.file) === 1;
  };
  for (const { arc, sheet } of scope) {
    for (const entry of sheet.entries) {
      const ref = refOf(arc, entry);
      if (keptRefs.has(ref) || done.has(ref)) continue;
      const repo = repoOf(entry);
      if (!repos.includes(repo)) repos.push(repo);
      if (isStep(entry)) {
        const mine = stepGroups.get(repo) ?? [];
        mine.push({ arc, ref, entry }); stepGroups.set(repo, mine);
        continue;
      }
      if (appliesIn(arc, entry)) {
        const apply = applyGroups.get(repo) ?? { refs: [], entries: [] };
        apply.refs.push(ref); apply.entries.push(entry); applyGroups.set(repo, apply);
        continue;
      }
      const pass = entrySlot(entry);
      const group = groups.get(`${repo}|${pass}`) ?? { repo, pass, refs: [], entries: [] };
      group.refs.push(ref);
      group.entries.push(entry);
      groups.set(`${repo}|${pass}`, group);
    }
  }
  // A FOLLOW-UP IS ONE PART FOR EACH REPOSITORY: its entries of every kind together, in the code pass where any entry is code.
  if (options.followUp) {
    for (const repo of repos) {
      const mine = [...groups.values()].filter((group) => group.repo === repo);
      const into = mine.find((group) => group.pass === "CODE") ?? mine[0];
      for (const group of mine) {
        if (group === into) continue;
        into.refs.push(...group.refs); into.entries.push(...group.entries);
        groups.delete(`${repo}|${group.pass}`);
      }
    }
  }
  for (const part of kept) if (!repos.includes(part.repo) && slotOf(part) !== "RELEASE") repos.push(part.repo);
  const owed = new Set(scope.flatMap(({ proofs }) => proofs ?? []));
  for (const repo of owed) if (!repos.includes(repo)) repos.push(repo);
  const rank = (repo: string) => { const at = chain.indexOf(repo); return at >= 0 ? at : repo === BOOK_REPO ? -1 : chain.length; };
  repos.sort((a, b) => rank(a) - rank(b));

  const measuredOf = (repo: string, pass: Slot): string | null => {
    const { rate, from } = rateOf(rates, repo, workOf(pass));
    if (!(rate > 0)) return null;
    const there = from ?? repo;
    const count = (options.measures ?? []).filter((one) => one.repo === there && one.work === workOf(pass) && one.entries > 0 && one.minutes > 0).length;
    // The rate of the same kind of work in another repository is an estimate, and says so.
    if (from) return `estimated from ${from} (${count} landed ${workOf(pass)} parts there)`;
    return `cost of ${count ? `${count} ` : ""}landed ${pass} rows in ${repo}`;
  };
  const full = typeof options.fullRunMinutes === "number" ? Math.round(options.fullRunMinutes * 10) / 10 : null;
  const part = (id: string, repo: string, pass: Slot, refs: string[], held: SheetEntry[], extra: Partial<GoPart> = {}): GoPart => ({
    id, repo, work: workOf(pass), entries: refs, tests: [], minutes: null, measuredFrom: null, waitsOn: [],
    model: ENTRY_SLOTS.includes(pass) ? "sonnet" : "none", signature: held.map(entryHash).join("."), state: "ready", ...extra,
  });

  const fresh: GoPart[] = [];
  for (const repo of repos) {
    const hasCode = groups.has(`${repo}|CODE`) || applyGroups.has(repo) || kept.some((one) => one.repo === repo && slotOf(one) === "CODE");
    for (const pass of SLOT_ORDER) {
      if (pass === "BASELINE" || pass === "FULL_RUN") {
        let id = `${pass === "BASELINE" ? "baseline" : "full"}-${repo}`;
        // A proof still owed needs the repository's full run once its code has landed; a baseline needs code to compare.
        let runs = (hasCode && !(options.followUp && pass === "BASELINE")) || (pass === "FULL_RUN" && owed.has(repo));
        if (pass === "FULL_RUN") {
          // A new code part in a repository whose full run has landed opens the next full run, full-<repo>-2.
          const fulls = kept.filter((one) => one.repo === repo && slotOf(one) === "FULL_RUN");
          const landedN = Math.max(0, ...fulls.filter((one) => one.state === "landed").map((one) => numberOf(one) || 1));
          if (fulls.some((one) => one.state === "running")) runs = false;
          else if (landedN > 0) {
            // A CODE PART THAT LANDS AFTER THE FULL RUN OPENS THE NEXT ONE, fresh or kept from a previous plan (s34).
            const order = options.landedOrder ?? [];
            const lastFull = order.lastIndexOf(fulls.filter((one) => one.state === "landed").sort((a, b) => numberOf(b) - numberOf(a))[0]?.id ?? "");
            const lateCode = lastFull >= 0 && kept.some((one) => one.repo === repo && slotOf(one) === "CODE" && one.state === "landed" && order.lastIndexOf(one.id) > lastFull);
            if (groups.has(`${repo}|CODE`) || applyGroups.has(repo) || lateCode) id = `${id}-${landedN + 1}`; else runs = false;
          }
        }
        if (runs && !keptIds.has(id)) fresh.push(part(id, repo, pass, [], [], {
          minutes: full, measuredFrom: full === null ? null : "last 3 full runs",
        }));
        continue;
      }
      // THE APPLY PART is the repository's patched and light entries in one part the lead carries out, ahead of the helpers' code parts; a later one is apply-<repo>-<n>.
      const apply = pass === "CODE" ? applyGroups.get(repo) : undefined;
      if (apply) {
        orderByUse(apply);
        const before = kept.filter((one) => one.repo === repo && isApplyPart(one)).map((one) => numberOf(one) || 1);
        fresh.push(part(before.length ? `apply-${repo}-${Math.max(...before) + 1}` : `apply-${repo}`, repo, pass, apply.refs, apply.entries, { model: "lead" }));
      }
      // A STEP IS A PART OF ITS OWN, in its repository's generated pass.
      if (pass === "GENERATED") for (const one of stepGroups.get(repo) ?? []) {
        // A STEP THAT CHANGED AFTER ITS PART LANDED gets a follow-up of its own, `-2` and on: under the landed part's own id
        // `keptIds` would skip it, and `go check` would name the change for ever (026 N007/E27).
        const base = `generated-${repo}-${one.arc.toLowerCase()}-${one.entry.id.toLowerCase()}`;
        let id = base;
        for (let n = 2; keptIds.has(id) && moved.has(one.ref); n += 1) id = `${base}-${n}`;
        if (!keptIds.has(id)) fresh.push(part(id, repo, pass, [one.ref], [one.entry]));
      }
      const group = groups.get(`${repo}|${pass}`);
      if (!group) continue;
      const { rate } = rateOf(rates, repo, workOf(pass));
      const bound = options.followUp ? Number.POSITIVE_INFINITY : boundOf(rates, repo, pass);
      // A DECISION'S ENTRIES FORM PARTS OF THEIR OWN: grouped by the first card or preview section cited, a preview section first, before the cut.
      const subs = new Map<string, { decision: string; preview: boolean; refs: string[]; entries: SheetEntry[] }>();
      const decisionOfFile = new Map<string, string>();
      if (options.followUp) subs.set("", { decision: "", preview: false, refs: group.refs, entries: group.entries });
      else group.entries.forEach((one, at) => {
        const found = decisionOf(one);
        const key = decisionOfFile.get(one.file) ?? found?.decision ?? "";
        decisionOfFile.set(one.file, key);
        const sub = subs.get(key) ?? { decision: key, preview: !!found?.preview && found.decision === key, refs: [], entries: [] };
        if (found?.preview && found.decision === key) sub.preview = true;
        sub.refs.push(group.refs[at]); sub.entries.push(one); subs.set(key, sub);
      });
      const ranked = [...subs.values()].sort((a, b) => (a.preview ? 0 : a.decision ? 1 : 2) - (b.preview ? 0 : b.decision ? 1 : 2));
      for (const sub of ranked) {
        if (pass === "CODE") orderByUse(sub);
        // One file's entries stay in one part: the entries of a file are kept together, and a part is cut between files.
        const chunks: Array<{ refs: string[]; entries: SheetEntry[] }> = [];
        sub.entries.forEach((one, at) => {
          const chunk = chunks.find((c) => c.entries[0].file === one.file) ?? (chunks.push({ refs: [], entries: [] }), chunks[chunks.length - 1]);
          chunk.refs.push(sub.refs[at]); chunk.entries.push(one);
        });
        const cuts: Array<{ refs: string[]; entries: SheetEntry[] }> = [];
        for (const chunk of chunks) {
          const last = cuts[cuts.length - 1];
          if (last && last.refs.length + chunk.refs.length <= bound) { last.refs.push(...chunk.refs); last.entries.push(...chunk.entries); }
          else cuts.push({ refs: [...chunk.refs], entries: [...chunk.entries] });
        }
        const stem = `${pass.toLowerCase()}-${repo}-${sub.decision ? `${sub.decision}-` : ""}`;
        let next = Math.max(0, ...kept.map((one) => (one.id.startsWith(stem) && /^\d+$/.test(one.id.slice(stem.length)) ? Number(one.id.slice(stem.length)) : 0))) + 1;
        for (const cut of cuts) {
          const ids = cut.entries.flatMap((entry) => Object.values(entry.tiers ?? {}).flat());
          fresh.push(part(`${stem}${next++}`, repo, pass, cut.refs, cut.entries, {
            tests: testFilesOf([...new Set(ids)], options.dirsOf?.(repo) ?? []), ...(options.followUp ? { model: "lead" } : {}),
            minutes: rate > 0 ? Math.round(rate * cut.refs.length * 10) / 10 : null, measuredFrom: measuredOf(repo, pass),
          }));
        }
      }
    }
  }

  const all = [...kept.filter((one) => slotOf(one) !== "RELEASE" && slotOf(one) !== "PROOF"), ...fresh];
  const parts = all.sort((a, b) => repos.indexOf(a.repo) - repos.indexOf(b.repo) || LISTED_ORDER.indexOf(slotOf(a)) - LISTED_ORDER.indexOf(slotOf(b)) || numberOf(a) - numberOf(b));
  // What each fresh part waits on: every part of the pass before it in its repository; a repository's first pass waits on the
  // docs of the repository before it; a baseline waits on nothing, and a full run waits on the repository's code.
  for (const one of parts) {
    if (keptIds.has(one.id) || slotOf(one) === "BASELINE" || slotOf(one) === "PROOF") continue;
    const mine = parts.filter((other) => other.repo === one.repo);
    const before = SLOT_ORDER.slice(0, SLOT_ORDER.indexOf(slotOf(one))).reverse().find((pass) => mine.some((other) => slotOf(other) === pass));
    if (before) one.waitsOn = mine.filter((other) => slotOf(other) === before).map((other) => other.id);
    else {
      const prior = repos[repos.indexOf(one.repo) - 1];
      one.waitsOn = prior ? parts.filter((other) => other.repo === prior && slotOf(other) === "DOCS").map((other) => other.id) : [];
    }
  }
  // TWO PARTS THAT EDIT ONE FILE NEVER RUN TOGETHER, and a part is ready only once the parts that edit the files its entries' `book` lines
  // name have landed (s51). A wait that would close a circle is not added.
  const held = new Map(scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => [refOf(arc, entry), entry] as const)));
  const entriesOf = (one: GoPart): SheetEntry[] => one.entries.flatMap((ref) => held.get(ref) ?? []);
  const editsOf = (one: GoPart): Set<string> => new Set(entriesOf(one).map((entry) => entry.file));
  const sourcesOf = (one: GoPart): Set<string> => new Set(entriesOf(one).flatMap((entry) => [...namedFiles(entry, ["book"])]));
  const waitsFor = (from: GoPart, target: GoPart, seen = new Set<string>()): boolean =>
    from.id === target.id || (!seen.has(from.id) && (seen.add(from.id), from.waitsOn.some((id) => { const next = parts.find((other) => other.id === id); return !!next && waitsFor(next, target, seen); })));
  for (const [at, one] of parts.entries()) {
    if (keptIds.has(one.id) || !one.entries.length) continue;
    const mine = editsOf(one), sources = sourcesOf(one);
    for (const [other, q] of parts.entries()) {
      if (q === one || q.state === "landed" || !q.entries.length || one.waitsOn.includes(q.id) || waitsFor(q, one)) continue;
      const files = editsOf(q);
      const sameFile = other < at && [...files].some((file) => mine.has(file));
      if (sameFile || [...files].some((file) => sources.has(file))) one.waitsOn.push(q.id);
    }
  }
  // AN ENTRY THAT EXPORTS A NAME HOLDS EVERY ENTRY OF THE SCOPE WHOSE WHAT NAMES IT behind its part, where that part runs no earlier: a
  // repository before the maker's in the go, or a pass before the maker's in its repository (the book's docs naming a platform type), says
  // the name ahead of the code that exports it, and waiting there would close a circle through the release between them (s184).
  const runsBefore = (one: GoPart, other: GoPart): boolean => repos.indexOf(one.repo) < repos.indexOf(other.repo)
    || (one.repo === other.repo && SLOT_ORDER.indexOf(slotOf(one)) < SLOT_ORDER.indexOf(slotOf(other)));
  const makers =scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => ({ ref: refOf(arc, entry), names: exportedNames(entry) })).filter((one) => one.names.length));
  for (const one of parts) {
    if (keptIds.has(one.id) || !one.entries.length) continue;
    for (const ref of one.entries) {
      const text = held.get(ref)?.what ?? "";
      for (const maker of makers) {
        if (maker.ref === ref || !maker.names.some((name) => namesIn(text, name))) continue;
        const holder = parts.find((other) => other.entries.includes(maker.ref));
        if (holder && holder !== one && holder.state !== "landed" && !runsBefore(one, holder) && !one.waitsOn.includes(holder.id) && !waitsFor(holder, one)) one.waitsOn.push(holder.id);
      }
    }
  }
  // A repository's first pass waits on the release that ships a command it needs, which another go or window cuts: the part
  // is `waiting`, and it waits on no part of this plan, because the release it waits on is not one of them (s23).
  for (const { sheet } of scope) {
    for (const need of (Array.isArray(sheet.needsRelease) ? sheet.needsRelease : []) as { repo?: string; release?: string; command?: string }[]) {
      const first = parts.find((one) => one.repo === need.repo && slotOf(one) !== "RELEASE" && !keptIds.has(one.id));
      if (first && need.release && !first.waitingOn) { first.state = "waiting"; first.waitingOn = `the release of ${need.release} that ships ${need.command ?? "a command it needs"}`; }
    }
  }
  // A wait marked by hand outlives a new derivation.
  for (const one of parts) {
    const old = (options.previous?.parts ?? []).find((was) => was.id === one.id);
    // A hand wait is carried; a reason `go wait --clear` drew from the plan's own waits is not, since the new plan draws its own (s188).
    if (old?.state === "waiting" && !keptIds.has(one.id) && !one.waitingOn && !isDrawnFromPlan(old.waitingOn)) {
      one.state = "waiting"; one.waitingOn = old.waitingOn;
    }
  }
  const releases: string[] = [];
  for (const { sheet } of scope) for (const repo of sheet.releaseChain ?? []) if (!releases.includes(repo)) releases.push(repo);
  // A release waits on its own repository's full run and generated parts (its docs where it has no full run), and on the release before it in the chain.
  const endingOf = (repo: string): string[] => {
    const mine = parts.filter((one) => one.repo === repo);
    const ending = mine.filter((one) => slotOf(one) === "GENERATED" || slotOf(one) === "FULL_RUN");
    return (mine.some((one) => slotOf(one) === "FULL_RUN") ? ending : [...mine.filter((one) => slotOf(one) === "DOCS"), ...ending]).map((one) => one.id);
  };
  const lastRelease = (repo: string): string[] => {
    const ours = parts.filter((one) => one.repo === repo && slotOf(one) === "RELEASE").sort((a, b) => numberOf(a) - numberOf(b));
    return ours.length ? [ours[ours.length - 1].id] : [];
  };
  for (const [at, repo] of releases.entries()) {
    // A RELEASE THAT LANDED SHIPPED WHAT WAS THEN: docs or code planned after it need the next release, release-<repo>-2 and so on (s38).
    const mine = kept.filter((one) => one.repo === repo && slotOf(one) === "RELEASE");
    parts.push(...mine);
    if (options.followUp) continue;
    const lastN = Math.max(0, ...mine.map(numberOf));
    const live = mine.some((one) => one.state === "running");
    const planned = fresh.some((one) => one.repo === repo && ENTRY_SLOTS.includes(slotOf(one)));
    const before = at > 0 ? lastRelease(releases[at - 1]) : [];
    const waitsOn = [...endingOf(repo), ...before];
    if (!mine.length) parts.push(part(`release-${repo}-1`, repo, "RELEASE", [], [], { waitsOn }));
    else if (!live && planned) parts.push(part(`release-${repo}-${lastN + 1}`, repo, "RELEASE", [], [], { waitsOn }));
  }
  // WHAT ANOTHER ARC OF THE WORKSTREAM MUST SHIP FIRST: a `dependsOn` line naming an arc makes the code parts of the sheet that carries it wait
  // on that arc's release parts; the arc outside the scope is a line on the first such part, which waits. An arc in the scope ships in the
  // same release as the waiter's own repository, so there the waiter waits on the arc's parts in that repository instead (s184), and on the
  // arc's releases of the repositories before its own in the chain only: a repository later in the chain is not one it consumes.
  const reposOf = (sheet: Sheet): string[] => [...new Set(sheet.entries.map(repoOf))];
  const others = new Map((options.siblings ?? []).map((one) => [one.arc, one] as const));
  for (const one of scope) others.delete(one.arc);
  const ignored: string[] = [];
  for (const { arc, sheet } of scope) {
    for (const line of Array.isArray(sheet.dependsOn) ? sheet.dependsOn : []) {
      for (const named of new Set(String(line).match(/\bN\d+[a-z]?\b/g) ?? [])) {
        if (named === arc) continue;
        const inScope = scope.find((one) => one.arc === named);
        const target = inScope ?? others.get(named);
        if (!target) continue;
        const waiters = parts.filter((one) => slotOf(one) === "CODE" && !keptIds.has(one.id) && one.entries.some((ref) => ref.startsWith(`${arc}/`)));
        if (inScope) {
          const theirs = reposOf(target.sheet);
          for (const waiter of waiters) {
            const own = releases.indexOf(waiter.repo);
            const shipped = parts.filter((one) => slotOf(one) === "RELEASE" && theirs.includes(one.repo) && one.repo !== waiter.repo
              && (own < 0 || releases.indexOf(one.repo) < own));
            // The apply part carries entries of every arc and runs ahead of the helpers' code parts, so it never waits on
            // them for another arc's line; it still waits on the releases before its repository (s188).
            const alongside = isApplyPart(waiter) ? [] : parts.filter((one) => one.repo === waiter.repo && slotOf(one) === "CODE" && one.state !== "landed"
              && one.entries.some((ref) => ref.startsWith(`${named}/`)));
            for (const one of [...shipped, ...alongside]) if (one !== waiter && !waiter.waitsOn.includes(one.id) && !waitsFor(one, waiter)) waiter.waitsOn.push(one.id);
            const later = theirs.filter((repo) => repo !== waiter.repo && own >= 0 && releases.indexOf(repo) > own);
            const note = `${arc}'s dependsOn names ${named}, whose ${later.join(" and ")} comes later in the chain than ${waiter.repo}: ${waiter.id} does not wait on it`;
            if (!shipped.length && !alongside.length && later.length && !ignored.includes(note)) ignored.push(note);
          }
        } else if (waiters[0] && !waiters[0].waitingOn) {
          waiters[0].state = "waiting"; waiters[0].waitingOn = `${named}'s release of ${reposOf(target.sheet).join(" and ")}`;
        }
      }
    }
  }
  // A BASELINE WAITS ON THE PARTS HOLDING ITS REPOSITORY'S DOCS ROWS in every decided arc; an arc outside the scope is a line naming it.
  for (const one of parts) {
    if (slotOf(one) !== "BASELINE" || keptIds.has(one.id)) continue;
    for (const { arc, data } of scope) {
      if (data?.status !== "DECIDED") continue;
      for (const row of data.rows) {
        if (row.work !== "DOCS" || row.repo !== one.repo || row.state === "landed") continue;
        for (const id of row.entries ?? []) {
          const holder = parts.find((other) => slotOf(other) === "DOCS" && other.entries.includes(`${arc}/${id}`));
          if (holder && !one.waitsOn.includes(holder.id)) one.waitsOn.push(holder.id);
        }
      }
    }
    for (const { arc, data } of others.values()) {
      if (data?.status === "DECIDED" && data.rows.some((row) => row.work === "DOCS" && row.repo === one.repo && row.state !== "landed") && !one.waitingOn) {
        one.state = "waiting"; one.waitingOn = `${arc}'s docs of ${one.repo}`;
      }
    }
  }
  // A proof still owed after the releases is its own step: the whole suites on what was released, once every release has landed.
  // A proof part that landed or is running stays as it was.
  const released = parts.filter((one) => slotOf(one) === "RELEASE").map((one) => one.id);
  for (const repo of repos) {
    const id = `proof-${repo}`;
    const old = kept.find((one) => one.id === id);
    if (old) parts.push(old);
    else if (owed.has(repo)) parts.push(part(id, repo, "PROOF", [], [], { waitsOn: released }));
  }
  // A circle is looked for among the parts not yet landed: a landed part's recorded waits hold nothing, so a circle made only of
  // landed parts, as an old plan's kept parts can make, refuses no plan.
  return {
    schemaVersion: GO_SCHEMA_VERSION, lead: scope[0]?.arc ?? "", scope: scope.map((one) => one.arc),
    writtenAt: options.writtenAt ?? new Date().toISOString(), parts, circles: releaseCircles(parts.filter((one) => one.state !== "landed")), ignored,
  };
}

/** A scope `go propose` offers: its arcs, its repositories in chain order, the scope it waits on, and the minutes sharing one full run saves. */
export type ProposedScope = { arcs: string[]; repos: string[]; waitsOn: number | null; savedMinutes: number };

/** The repositories of an arc's entries, the book's left out. */
const reposOfSheet = (sheet: Sheet): string[] => [...new Set(sheet.entries.map(repoOf))].filter((repo) => repo !== BOOK_REPO);

/**
 * Groups decided arcs into scopes: arcs that share a repository, directly or through another arc, are one scope. `minutes` is
 * each repository's full-run time, null where unmeasured. Scopes are numbered from 1 in the chain rank of their first repository.
 */
export function proposeScopes(inputs: { arcs: readonly ScopeSheet[]; minutes: Record<string, number | null> }): ProposedScope[] {
  const arcs = [...inputs.arcs].sort((a, b) => a.arc.localeCompare(b.arc));
  const chain: string[] = [];
  for (const { sheet } of arcs) for (const repo of sheet.releaseChain ?? []) if (!chain.includes(repo)) chain.push(repo);
  const groups: { sheets: ScopeSheet[]; repos: Set<string> }[] = [];
  for (const one of arcs) {
    const mine = reposOfSheet(one.sheet);
    const joined = groups.filter((group) => mine.some((repo) => group.repos.has(repo)));
    const into = joined[0] ?? { sheets: [], repos: new Set<string>() };
    if (!joined.length) groups.push(into);
    for (const other of joined.slice(1)) {
      into.sheets.push(...other.sheets); other.repos.forEach((repo) => into.repos.add(repo));
      groups.splice(groups.indexOf(other), 1);
    }
    into.sheets.push(one); mine.forEach((repo) => into.repos.add(repo));
  }
  const rank = (repo: string) => { const at = chain.indexOf(repo); return at >= 0 ? at : chain.length; };
  const ordered = groups.map((group) => {
    const sheets = group.sheets.sort((a, b) => a.arc.localeCompare(b.arc));
    const own: string[] = [];
    for (const { sheet } of sheets) for (const repo of sheet.releaseChain ?? []) if (group.repos.has(repo) && !own.includes(repo)) own.push(repo);
    const repos = [...own, ...[...group.repos].filter((repo) => !own.includes(repo)).sort()];
    return { sheets, repos };
  }).sort((a, b) => rank(a.repos[0] ?? "") - rank(b.repos[0] ?? "") || (a.sheets[0]?.arc ?? "").localeCompare(b.sheets[0]?.arc ?? ""));
  return ordered.map((group) => {
    let waitsOn: number | null = null;
    for (const { sheet } of group.sheets) {
      const order = sheet.releaseChain ?? [];
      for (const repo of group.repos) {
        const index = order.indexOf(repo);
        if (index < 0) continue;
        const before = new Set(order.slice(0, index));
        ordered.forEach((other, number) => {
          if (other !== group && other.repos.some((one) => before.has(one))) waitsOn = Math.max(waitsOn ?? 0, number + 1);
        });
      }
    }
    const sum = group.repos.reduce((total, repo) => total + (inputs.minutes[repo] ?? 0), 0);
    return { arcs: group.sheets.map(({ arc }) => arc), repos: group.repos, waitsOn, savedMinutes: Math.round((group.sheets.length - 1) * sum) };
  });
}

/** The test ids a baseline runs once on the base commit: every tier of the entries the plan's CODE parts in `repo` hold, sorted and unique. */
export function redCheckIds(plan: GoPlan, scope: readonly ScopeSheet[], repo: string): string[] {
  const held = new Set(plan.parts.filter((part) => part.repo === repo && part.work === "CODE").flatMap((part) => part.entries));
  const ids = scope.flatMap(({ arc, sheet }) => sheet.entries.filter((entry) => held.has(refOf(arc, entry))).flatMap((entry) => Object.values(entry.tiers ?? {}).flat()));
  return [...new Set(ids)].sort();
}

/**
 * The shortest wait circle through each release that has one, each circle once: what `go write` refuses, naming them. One circle to a release,
 * found breadth first, since every simple circle of a tangled plan is more than any run can list (s184).
 */
export function releaseCircles(parts: readonly GoPart[]): string[][] {
  const byId = new Map(parts.map((one) => [one.id, one] as const));
  const found = new Map<string, string[]>();
  for (const release of parts.filter((one) => slotOf(one) === "RELEASE")) {
    const from = new Map<string, string>();
    const queue = [release.id];
    let end: string | null = null;
    while (queue.length && !end) {
      const id = queue.shift() as string;
      for (const next of byId.get(id)?.waitsOn ?? []) {
        if (next === release.id) { end = id; break; }
        if (!byId.has(next) || from.has(next)) continue;
        from.set(next, id); queue.push(next);
      }
    }
    if (!end) continue;
    const circle = [end];
    while (circle[circle.length - 1] !== release.id) circle.push(from.get(circle[circle.length - 1]) as string);
    circle.reverse();
    found.set([...circle].sort().join("|"), circle);
  }
  return [...found.values()];
}

/** The parts held in some wait circle, of every circle at once: what `go write` counts beside the circles it names. */
export function tangledParts(parts: readonly GoPart[]): string[] {
  const byId = new Map(parts.map((one) => [one.id, one] as const));
  const index = new Map<string, number>(), low = new Map<string, number>(), stack: string[] = [], held = new Set<string>(), tangled: string[] = [];
  let next = 0;
  const visit = (start: string): void => {
    // Tarjan's walk, kept on an explicit stack so a plan of any size cannot overflow the call stack.
    const frames: Array<{ id: string; at: number }> = [{ id: start, at: 0 }];
    index.set(start, next); low.set(start, next++); stack.push(start); held.add(start);
    while (frames.length) {
      const frame = frames[frames.length - 1];
      const waits = (byId.get(frame.id)?.waitsOn ?? []).filter((id) => byId.has(id));
      if (frame.at < waits.length) {
        const to = waits[frame.at++];
        if (!index.has(to)) { index.set(to, next); low.set(to, next++); stack.push(to); held.add(to); frames.push({ id: to, at: 0 }); }
        else if (held.has(to)) low.set(frame.id, Math.min(low.get(frame.id)!, index.get(to)!));
        continue;
      }
      frames.pop();
      if (frames.length) low.set(frames[frames.length - 1].id, Math.min(low.get(frames[frames.length - 1].id)!, low.get(frame.id)!));
      if (low.get(frame.id) === index.get(frame.id)) {
        const group: string[] = [];
        let id: string;
        do { id = stack.pop() as string; held.delete(id); group.push(id); } while (id !== frame.id);
        if (group.length > 1) tangled.push(...group);
      }
    }
  };
  for (const one of parts) if (!index.has(one.id)) visit(one.id);
  return tangled;
}

/** The entries of a part that are no longer as its signature says, by their refs: what `go check` names. */
export function changedEntries(part: GoPart, scope: readonly ScopeSheet[]): string[] {
  const hashes = part.signature.split(".");
  const now = new Map(scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => [refOf(arc, entry), entry] as const)));
  // An entry of an arc outside the plan's scope is another plan's to judge: an old plan whose parts held other arcs' entries before
  // its scope narrowed would otherwise read them as changed for ever (035's N003, at the close).
  const inScope = new Set(scope.map(({ arc }) => arc));
  return part.entries.filter((ref, at) => {
    if (!inScope.has(ref.split("/")[0])) return false;
    const entry = now.get(ref);
    return !entry || (hashes[at] !== entryHash(entry) && hashes[at] !== signedWhole(entry));
  });
}

/**
 * A part's changed entries that no later part of the plan carries: a follow-up part answers its landed part's change. An
 * entry another landed part holds as it stands now is done too, as `deriveGo` reads it, so it needs no follow-up.
 */
export function staleEntries(part: GoPart, plan: GoPlan, scope: readonly ScopeSheet[]): string[] {
  const later = plan.parts.slice(plan.parts.indexOf(part) + 1).flatMap((one) => one.entries);
  const current = new Set(plan.parts.filter((one) => one !== part && one.state === "landed")
    .flatMap((one) => { const changed = changedEntries(one, scope); return one.entries.filter((ref) => !changed.includes(ref)); }));
  // An entry the sheet dropped with its logged note is no change: nothing is left to do for it, so a landed part that held it is no finding.
  const dropped = new Set(scope.flatMap(({ arc, dropped }) => (dropped ?? []).map((id) => `${arc}/${id}`)));
  const gone = (ref: string): boolean => part.state === "landed" && dropped.has(ref)
    && !scope.some(({ arc, sheet }) => sheet.entries.some((entry) => refOf(arc, entry) === ref));
  return changedEntries(part, scope).filter((ref) => !later.includes(ref) && !current.has(ref) && !gone(ref));
}

/**
 * The plan with one part marked `waiting` on a reason (`go wait <part> --on "…"`): a release, a sign-in, another window's
 * hold. The plan given is not changed. A landed or running part, or a part not in the plan, is refused.
 */
export function markWaiting(plan: GoPlan, partId: string, reason: string): GoPlan {
  const one = plan.parts.find((part) => part.id === partId);
  if (!one) throw new Error(`${partId} is not a part of the plan`);
  if (one.state === "landed" || one.state === "running") throw new Error(`${partId} is ${one.state}, so it cannot be marked waiting`);
  if (!reason.trim()) throw new Error(`${partId} needs the reason it waits, in plain words`);
  return { ...plan, parts: plan.parts.map((part) => (part.id === partId ? { ...part, state: "waiting", waitingOn: reason.trim() } : part)) };
}

/**
 * The plan with one part marked `dropped` on the developer's words (`go drop <part> --words "…"`): a run, a release or a proof
 * the developer decided will not happen. A landed or running part, or a part not in the plan, is refused (RULE.DEVEX.WORKSPACE.463).
 */
export function markDropped(plan: GoPlan, partId: string, words: string): GoPlan {
  const one = plan.parts.find((part) => part.id === partId);
  if (!one) throw new Error(`${partId} is not a part of the plan`);
  if (one.state === "landed" || one.state === "running" || one.state === "dropped") throw new Error(`${partId} is ${one.state}, so it cannot be dropped`);
  if (!words.trim()) throw new Error(`${partId} needs the developer's words that drop it`);
  const { waitingOn: _waiting, ...rest } = one;
  return { ...plan, parts: plan.parts.map((part) => (part.id === partId ? { ...rest, state: "dropped", droppedWords: words.trim() } : part)) };
}

/**
 * The plan with one hand-marked wait taken off (`go wait <part> --clear`). The part reads `ready` when every part it waits
 * on in the plan has landed, else `waiting` again, on those parts. The plan given is not changed; a part that is not
 * waiting, or not in the plan, is refused.
 */
/** The ending of a waiting reason `clearWaiting` draws from the plan's own waits, which a later plan draws again rather than carries. */
const DRAWN_FROM_PLAN = ", which has not landed";
const isDrawnFromPlan = (reason: string | undefined): boolean => !!reason && reason.endsWith(DRAWN_FROM_PLAN);

export function clearWaiting(plan: GoPlan, partId: string): GoPlan {
  const one = plan.parts.find((part) => part.id === partId);
  if (!one) throw new Error(`${partId} is not a part of the plan`);
  if (one.state !== "waiting") throw new Error(`${partId} is ${one.state}, not waiting`);
  const open = one.waitsOn.filter((id) => plan.parts.find((part) => part.id === id)?.state !== "landed");
  const { waitingOn: _held, ...rest } = one;
  const next: GoPart = open.length ? { ...rest, state: "waiting", waitingOn: `${open.join(", ")}${DRAWN_FROM_PLAN}` } : { ...rest, state: "ready" };
  return { ...plan, parts: plan.parts.map((part) => (part.id === partId ? next : part)) };
}

/** The parts a helper may be launched for: `ready`, and every part they wait on landed. A `waiting` part is never one. */
export function readyParts(plan: GoPlan): GoPart[] {
  const landed = new Set(plan.parts.filter((one) => one.state === "landed").map((one) => one.id));
  return plan.parts.filter((one) => one.state === "ready" && one.waitsOn.every((id) => landed.has(id)));
}

/**
 * The go as one workflow script, made from the plan across every arc it covers: each part is one agent, and a part starts once
 * the parts the plan says it waits on have landed, so independent parts run together and the waits are the plan's own.
 * The lead's apply parts and a step are told what to run; any other part reads its brief.
 */
export function workflowOf(plan: GoPlan, scope: readonly ScopeSheet[]): string {
  const held = new Map(scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => [refOf(arc, entry), entry] as const)));
  const ref = `${plan.lead}`;
  const parts = plan.parts.map((one) => {
    const steps = one.entries.flatMap((entryRef) => { const entry = held.get(entryRef); return entry && isStep(entry) ? [`${entryRef}: run \`${String(entry.command ?? "")}\`; it is done when ${String(entry.proof ?? "")}`] : []; });
    const prompt = steps.length ? `Carry out the step of part ${one.id} in ${one.repo}'s worktree. ${steps.join(" ")} Commit nothing, launch no agent, and report what the command printed.`
      : isApplyPart(one) ? `Run \`spn-devex workstream go start ${ref} ${one.id}\` from the workspace, which applies the part's patches in order, and report what it printed.`
      : `Read the order for part ${one.id} (${ref}'s orders folder, ${one.id}.md) and carry it out as it says.`;
    return { id: one.id, repo: one.repo, work: one.work, waitsOn: one.waitsOn, prompt };
  });
  return [
    `export const meta = { name: ${JSON.stringify(`go-${plan.lead}`)}, description: ${JSON.stringify(`The go of ${plan.scope.join(", ")}: ${plan.parts.length} parts, each after the parts it waits on`)}, phases: [{ title: "Go", detail: "apply, steps and tests, in the plan's order" }] }`,
    `const PARTS = ${JSON.stringify(parts, null, 2)};`,
    "const byId = Object.fromEntries(PARTS.map((one) => [one.id, one]));",
    "const started = {};",
    "const run = (one) => (started[one.id] ??= Promise.all(one.waitsOn.filter((id) => byId[id]).map((id) => run(byId[id]))).then(() => agent(one.prompt, { label: one.id, phase: \"Go\" })));",
    "phase(\"Go\");",
    "return await Promise.all(PARTS.map(run));",
    "",
  ].join("\n");
}
