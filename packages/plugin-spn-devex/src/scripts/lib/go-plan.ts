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
export type ScopeSheet = { arc: string; sheet: Sheet; landed?: readonly string[]; proofs?: readonly string[]; dropped?: readonly string[] };
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
 * What the landed rows of the arcs took: the cost each row recorded, which `report write` measures from the usage rows of its
 * part. A row with no repository, kind of change or entries measures nothing.
 */
export function landedMeasures(root: string, workstream: string, arcs: readonly ArcData[]): Measure[] {
  void root; void workstream;
  const out: Measure[] = [];
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
};

/** The ids of the parts that landed, oldest first, read from the `<part> landed` go lines of the lead arc's log. */
export function landedOrder(ws: string, lead: string): string[] {
  const rows: Array<{ at: number; id: string }> = [];
  for (const line of logLinesOf(ws, lead) as Array<{ kind?: unknown; note?: unknown; at?: unknown }>) {
    const found = line && line.kind === "go" && typeof line.note === "string" ? /^(\S+) landed$/.exec(line.note) : null;
    if (found) rows.push({ at: Date.parse(String(line.at)) || 0, id: found[1] });
  }
  return rows.sort((a, b) => a.at - b.at).map((one) => one.id);
}

/** Entries to a part: the 45 minutes over the rate for a repository and kind of change, or 8 where it is unmeasured. */
export function boundOf(rates: Record<string, number>, repo: string, work: string): number {
  const rate = rates[`${repo}|${work}`];
  return rate && rate > 0 ? Math.max(1, Math.floor(PART_MINUTES / rate)) : UNMEASURED_ENTRIES;
}

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

const entrySlot = (entry: SheetEntry): Slot => {
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

const numberOf = (part: GoPart): number => Number(part.id.slice(part.id.lastIndexOf("-") + 1)) || 0;

/**
 * A repository's code entries in the order they can be built: an entry that creates a file comes before an entry that uses it,
 * read from the entries' `file` against the other's `callers` and `then`. Where nothing says, the number order stands (s60).
 */
export function orderByUse(group: { refs: string[]; entries: SheetEntry[] }): void {
  const count = group.entries.length;
  const before: Set<number>[] = group.entries.map(() => new Set<number>());
  group.entries.forEach((maker, at) => {
    if (maker.op !== "create") return;
    const users = namedFiles(maker, ["callers", "then"]);
    group.entries.forEach((user, other) => { if (other !== at && users.has(user.file)) before[other].add(at); });
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
export function deriveGo(scope: readonly ScopeSheet[], options: DeriveOptions = {}): GoPlan {
  const rates = options.rates ?? {};
  const chain: string[] = [];
  for (const { sheet } of scope) for (const repo of sheet.releaseChain ?? []) if (!chain.includes(repo)) chain.push(repo);
  const kept = (options.previous?.parts ?? []).filter((part) => part.state === "landed" || part.state === "running");
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
  for (const { arc, sheet } of scope) {
    for (const entry of sheet.entries) {
      const ref = refOf(arc, entry);
      if (keptRefs.has(ref) || done.has(ref)) continue;
      const repo = repoOf(entry);
      if (!repos.includes(repo)) repos.push(repo);
      const pass = entrySlot(entry);
      const group = groups.get(`${repo}|${pass}`) ?? { repo, pass, refs: [], entries: [] };
      group.refs.push(ref);
      group.entries.push(entry);
      groups.set(`${repo}|${pass}`, group);
    }
  }
  for (const part of kept) if (!repos.includes(part.repo) && slotOf(part) !== "RELEASE") repos.push(part.repo);
  const owed = new Set(scope.flatMap(({ proofs }) => proofs ?? []));
  for (const repo of owed) if (!repos.includes(repo)) repos.push(repo);
  const rank = (repo: string) => { const at = chain.indexOf(repo); return at < 0 ? chain.length : at; };
  repos.sort((a, b) => rank(a) - rank(b));

  const measuredOf = (repo: string, pass: Slot): string | null => {
    const rate = rates[`${repo}|${pass}`];
    if (!(rate > 0)) return null;
    const count = (options.measures ?? []).filter((one) => one.repo === repo && one.work === workOf(pass) && one.entries > 0 && one.minutes > 0).length;
    return `cost of ${count ? `${count} ` : ""}landed ${pass} rows in ${repo}`;
  };
  const full = typeof options.fullRunMinutes === "number" ? Math.round(options.fullRunMinutes * 10) / 10 : null;
  const part = (id: string, repo: string, pass: Slot, refs: string[], held: SheetEntry[], extra: Partial<GoPart> = {}): GoPart => ({
    id, repo, work: workOf(pass), entries: refs, tests: [], minutes: null, measuredFrom: null, waitsOn: [],
    model: ENTRY_SLOTS.includes(pass) ? "sonnet" : "none", signature: held.map(entryHash).join("."), state: "ready", ...extra,
  });

  const fresh: GoPart[] = [];
  for (const repo of repos) {
    const hasCode = groups.has(`${repo}|CODE`) || kept.some((one) => one.repo === repo && slotOf(one) === "CODE");
    for (const pass of SLOT_ORDER) {
      if (pass === "BASELINE" || pass === "FULL_RUN") {
        let id = `${pass === "BASELINE" ? "baseline" : "full"}-${repo}`;
        // A proof still owed needs the repository's full run once its code has landed; a baseline needs code to compare.
        let runs = hasCode || (pass === "FULL_RUN" && owed.has(repo));
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
            if (groups.has(`${repo}|CODE`) || lateCode) id = `${id}-${landedN + 1}`; else runs = false;
          }
        }
        if (runs && !keptIds.has(id)) fresh.push(part(id, repo, pass, [], [], {
          minutes: full, measuredFrom: full === null ? null : "last 3 full runs",
        }));
        continue;
      }
      const group = groups.get(`${repo}|${pass}`);
      if (!group) continue;
      if (pass === "CODE") orderByUse(group);
      const bound = boundOf(rates, repo, pass);
      const rate = rates[`${repo}|${pass}`];
      let next = Math.max(0, ...kept.filter((one) => one.repo === repo && slotOf(one) === pass).map(numberOf)) + 1;
      for (let at = 0; at < group.refs.length; at += bound) {
        const refs = group.refs.slice(at, at + bound);
        const held = group.entries.slice(at, at + bound);
        const ids = held.flatMap((entry) => Object.values(entry.tiers ?? {}).flat());
        fresh.push(part(`${pass.toLowerCase()}-${repo}-${next++}`, repo, pass, refs, held, {
          tests: testFilesOf([...new Set(ids)], options.dirsOf?.(repo) ?? []),
          minutes: rate > 0 ? Math.round(rate * refs.length * 10) / 10 : null, measuredFrom: measuredOf(repo, pass),
        }));
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
    if (old?.state === "waiting" && !keptIds.has(one.id) && !one.waitingOn) { one.state = "waiting"; one.waitingOn = old.waitingOn; }
  }
  const ending = parts.filter((one) => slotOf(one) === "GENERATED" || slotOf(one) === "FULL_RUN").map((one) => one.id);
  const releases: string[] = [];
  for (const { sheet } of scope) for (const repo of sheet.releaseChain ?? []) if (!releases.includes(repo)) releases.push(repo);
  for (const repo of releases) {
    // A RELEASE THAT LANDED SHIPPED WHAT WAS THEN: docs or code planned after it need the next release, release-<repo>-2 and so on (s38).
    const mine = kept.filter((one) => one.repo === repo && slotOf(one) === "RELEASE");
    parts.push(...mine);
    const lastN = Math.max(0, ...mine.map(numberOf));
    const live = mine.some((one) => one.state === "running");
    const planned = fresh.some((one) => one.repo === repo && ENTRY_SLOTS.includes(slotOf(one)));
    if (!mine.length) parts.push(part(`release-${repo}-1`, repo, "RELEASE", [], [], { waitsOn: ending }));
    else if (!live && planned) parts.push(part(`release-${repo}-${lastN + 1}`, repo, "RELEASE", [], [], { waitsOn: ending }));
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
  return {
    schemaVersion: GO_SCHEMA_VERSION, lead: scope[0]?.arc ?? "", scope: scope.map((one) => one.arc),
    writtenAt: options.writtenAt ?? new Date().toISOString(), parts,
  };
}

/** The entries of a part that are no longer as its signature says, by their refs: what `go check` names. */
export function changedEntries(part: GoPart, scope: readonly ScopeSheet[]): string[] {
  const hashes = part.signature.split(".");
  const now = new Map(scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => [refOf(arc, entry), entry] as const)));
  return part.entries.filter((ref, at) => {
    const entry = now.get(ref);
    return !entry || hashes[at] !== entryHash(entry);
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
 * The plan with one hand-marked wait taken off (`go wait <part> --clear`). The part reads `ready` when every part it waits
 * on in the plan has landed, else `waiting` again, on those parts. The plan given is not changed; a part that is not
 * waiting, or not in the plan, is refused.
 */
export function clearWaiting(plan: GoPlan, partId: string): GoPlan {
  const one = plan.parts.find((part) => part.id === partId);
  if (!one) throw new Error(`${partId} is not a part of the plan`);
  if (one.state !== "waiting") throw new Error(`${partId} is ${one.state}, not waiting`);
  const open = one.waitsOn.filter((id) => plan.parts.find((part) => part.id === id)?.state !== "landed");
  const { waitingOn: _held, ...rest } = one;
  const next: GoPart = open.length ? { ...rest, state: "waiting", waitingOn: `${open.join(", ")}, which has not landed` } : { ...rest, state: "ready" };
  return { ...plan, parts: plan.parts.map((part) => (part.id === partId ? next : part)) };
}

/** The parts a helper may be launched for: `ready`, and every part they wait on landed. A `waiting` part is never one. */
export function readyParts(plan: GoPlan): GoPart[] {
  const landed = new Set(plan.parts.filter((one) => one.state === "landed").map((one) => one.id));
  return plan.parts.filter((one) => one.state === "ready" && one.waitsOn.every((id) => landed.has(id)));
}
