// What a go is made of: the entries of the scope's change sheets, grouped into parts. A part is what one helper carries out:
// the entries of one repository in one pass, with a baseline and a full run around each repository's code. Repositories run
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
import { readCost } from "./cost.ts";
import {
  entryAltitude, goFaults, GO_SCHEMA_VERSION,
  type ArcData, type GoPart, type GoPass, type GoPlan, type Sheet, type SheetEntry,
} from "./workstream-schema.ts";
import { arcDataDir, readArc, readSheet } from "./workstream.ts";

/** The minutes a part is cut to. */
export const PART_MINUTES = 45;
/** Entries in a part where no landed row measures its repository and kind of change. */
export const UNMEASURED_ENTRIES = 8;
const GO_FILE = "go.json";
const HOOKS_LOG = "hooks.jsonl";

/** A sheet of the scope, with its arc, the ids of the entries its landed rows hold, and the repositories it still owes a proof in. */
export type ScopeSheet = { arc: string; sheet: Sheet; landed?: readonly string[]; proofs?: readonly string[] };
/** What a landed row took: entries done in a repository at a kind of change, in minutes. */
export type Measure = { repo: string; altitude: string; entries: number; minutes: number };
/** A line of `hooks.jsonl`, as far as a test command is told apart. */
export type CommandLine = { script?: string | null; group?: string | null; subgroup?: string | null; action?: string | null; args?: string | null; ms?: number; exit?: number | null };

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

/** The sheets of a plan's scope, each with the entries its arc's landed rows hold: what `go check` and the close gate read. */
export function planScope(ws: string, plan: GoPlan): ScopeSheet[] {
  const scope: ScopeSheet[] = [];
  for (const arc of plan.scope) {
    const sheet = readSheet(ws, arc);
    const data = readArc(ws, arc);
    if (sheet) scope.push({ arc, sheet, landed: data ? landedEntries(data) : [] });
  }
  return scope;
}

/** The entries of the scope that neither a part nor a landed row holds, by ref. */
export function unheldEntries(plan: GoPlan, scope: readonly ScopeSheet[]): string[] {
  const held = new Set([...plan.parts.flatMap((part) => part.entries), ...landedRefs(scope)]);
  return scope.flatMap(({ arc, sheet }) => sheet.entries.map((entry) => refOf(arc, entry)).filter((ref) => !held.has(ref)));
}

/** A short hash of one entry as written, so a part's signature changes with any change to any of its entries. */
export const entryHash = (entry: SheetEntry): string => createHash("sha1").update(JSON.stringify(entry)).digest("hex").slice(0, 8);

/** Minutes for one entry in each repository and kind of change, from rows that landed: `<repo>|<altitude>`. Absent where unmeasured. */
export function ratesOf(measures: readonly Measure[]): Record<string, number> {
  const sums = new Map<string, { entries: number; minutes: number }>();
  for (const one of measures) {
    if (!(one.entries > 0) || !(one.minutes > 0)) continue;
    const key = `${one.repo}|${one.altitude}`;
    const held = sums.get(key) ?? { entries: 0, minutes: 0 };
    sums.set(key, { entries: held.entries + one.entries, minutes: held.minutes + one.minutes });
  }
  return Object.fromEntries([...sums].map(([key, sum]) => [key, sum.minutes / sum.entries]));
}

/**
 * What the landed rows of the arcs took: each row's model time from telemetry (`workstream` is the folder name the usage lines
 * are tagged with), else the cost the row recorded. A row with no repository, kind of change or entries measures nothing.
 */
export function landedMeasures(root: string, workstream: string, arcs: readonly ArcData[]): Measure[] {
  const out: Measure[] = [];
  for (const data of arcs) {
    let modelMs = new Map<string, number>();
    try { modelMs = new Map(readCost(root, `${workstream}/${data.arc}`).rows.map((one) => [one.key.split(" · ")[0], one.modelMs])); } catch { /* no telemetry */ }
    for (const row of data.rows) {
      if (row.state !== "landed" || !row.repo || !row.altitude || !row.entries?.length) continue;
      const ms = modelMs.get(`row ${row.id}`) ?? 0;
      const minutes = ms > 0 ? ms / 60000 : row.cost?.minutes ?? 0;
      out.push({ repo: row.repo, altitude: row.altitude, entries: row.entries.length, minutes });
    }
  }
  return out;
}

/** The minutes of a full test run: the mean of the last three test commands in `hooks.jsonl` that exited 0, or null with none. */
export function fullRunMinutes(root: string, isTestCommand: (line: CommandLine) => boolean): number | null {
  const times: number[] = [];
  for (const file of logFiles(join(telemetryFolder(root), HOOKS_LOG))) {
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      if (!raw.trim()) continue;
      try {
        const line = JSON.parse(raw) as CommandLine & { event?: string; tool?: string };
        if (line.event === "command" && line.tool === "Bash" && line.exit === 0 && typeof line.ms === "number" && isTestCommand(line)) times.push(line.ms);
      } catch { /* a torn last line is skipped */ }
    }
  }
  const last = times.slice(-3);
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
};

/** Entries to a part: the 45 minutes over the rate for a repository and kind of change, or 8 where it is unmeasured. */
export function boundOf(rates: Record<string, number>, repo: string, altitude: string): number {
  const rate = rates[`${repo}|${altitude}`];
  return rate && rate > 0 ? Math.max(1, Math.floor(PART_MINUTES / rate)) : UNMEASURED_ENTRIES;
}

/** The passes that carry entries; an entry of another kind of change is built with the code. */
const ENTRY_PASSES: readonly GoPass[] = ["DOCS", "CODE", "GENERATED"];
/** The order passes run in inside a repository. */
const PASS_ORDER: readonly GoPass[] = ["DOCS", "BASELINE", "CODE", "FULL_RUN", "GENERATED"];

const passOf = (entry: SheetEntry): GoPass => {
  const altitude = entryAltitude(entry);
  return altitude === "DOCS" || altitude === "GENERATED" ? altitude : "CODE";
};
const numberOf = (part: GoPart): number => Number(part.id.slice(part.id.lastIndexOf("-") + 1)) || 0;

/**
 * The plan of a go over the arcs of its scope, the first being the lead. Entries are grouped by repository, in the order of
 * the scope's release chain (a repository outside the chain last), then by pass, and each group is cut into parts of at most
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
  const groups = new Map<string, { repo: string; pass: GoPass; refs: string[]; entries: SheetEntry[] }>();
  const repos: string[] = [];
  for (const { arc, sheet } of scope) {
    for (const entry of sheet.entries) {
      const ref = refOf(arc, entry);
      if (keptRefs.has(ref) || done.has(ref)) continue;
      const repo = repoOf(entry);
      if (!repos.includes(repo)) repos.push(repo);
      const pass = passOf(entry);
      const group = groups.get(`${repo}|${pass}`) ?? { repo, pass, refs: [], entries: [] };
      group.refs.push(ref);
      group.entries.push(entry);
      groups.set(`${repo}|${pass}`, group);
    }
  }
  for (const part of kept) if (!repos.includes(part.repo) && part.pass !== "RELEASE") repos.push(part.repo);
  const owed = new Set(scope.flatMap(({ proofs }) => proofs ?? []));
  for (const repo of owed) if (!repos.includes(repo)) repos.push(repo);
  const rank = (repo: string) => { const at = chain.indexOf(repo); return at < 0 ? chain.length : at; };
  repos.sort((a, b) => rank(a) - rank(b));

  const measuredOf = (repo: string, pass: GoPass): string | null => {
    const rate = rates[`${repo}|${pass}`];
    if (!(rate > 0)) return null;
    const count = (options.measures ?? []).filter((one) => one.repo === repo && one.altitude === pass && one.entries > 0 && one.minutes > 0).length;
    return `cost of ${count ? `${count} ` : ""}landed ${pass} rows in ${repo}`;
  };
  const full = typeof options.fullRunMinutes === "number" ? Math.round(options.fullRunMinutes * 10) / 10 : null;
  const part = (id: string, repo: string, pass: GoPass, refs: string[], held: SheetEntry[], extra: Partial<GoPart> = {}): GoPart => ({
    id, repo, pass, entries: refs, tests: [], minutes: null, measuredFrom: null, waitsOn: [],
    model: ENTRY_PASSES.includes(pass) ? "sonnet" : "none", signature: held.map(entryHash).join("."), state: "ready", ...extra,
  });

  const fresh: GoPart[] = [];
  for (const repo of repos) {
    const hasCode = groups.has(`${repo}|CODE`) || kept.some((one) => one.repo === repo && one.pass === "CODE");
    for (const pass of PASS_ORDER) {
      if (pass === "BASELINE" || pass === "FULL_RUN") {
        let id = `${pass === "BASELINE" ? "baseline" : "full"}-${repo}`;
        // A proof still owed needs the repository's full run once its code has landed; a baseline needs code to compare.
        let runs = hasCode || (pass === "FULL_RUN" && owed.has(repo));
        if (pass === "FULL_RUN") {
          // A new code part in a repository whose full run has landed opens the next full run, full-<repo>-2.
          const fulls = kept.filter((one) => one.repo === repo && one.pass === "FULL_RUN");
          const landedN = Math.max(0, ...fulls.filter((one) => one.state === "landed").map((one) => numberOf(one) || 1));
          if (fulls.some((one) => one.state === "running")) runs = false;
          else if (landedN > 0) { if (groups.has(`${repo}|CODE`)) id = `${id}-${landedN + 1}`; else runs = false; }
        }
        if (runs && !keptIds.has(id)) fresh.push(part(id, repo, pass, [], [], {
          minutes: full, measuredFrom: full === null ? null : "last 3 full runs",
        }));
        continue;
      }
      const group = groups.get(`${repo}|${pass}`);
      if (!group) continue;
      const bound = boundOf(rates, repo, pass);
      const rate = rates[`${repo}|${pass}`];
      let next = Math.max(0, ...kept.filter((one) => one.repo === repo && one.pass === pass).map(numberOf)) + 1;
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

  const all = [...kept.filter((one) => one.pass !== "RELEASE"), ...fresh];
  const parts = all.sort((a, b) => repos.indexOf(a.repo) - repos.indexOf(b.repo) || PASS_ORDER.indexOf(a.pass) - PASS_ORDER.indexOf(b.pass) || numberOf(a) - numberOf(b));
  // What each fresh part waits on: every part of the pass before it in its repository; a repository's first pass waits on the
  // docs of the repository before it; a baseline waits on nothing, and a full run waits on the repository's code.
  for (const one of parts) {
    if (keptIds.has(one.id) || one.pass === "BASELINE") continue;
    const mine = parts.filter((other) => other.repo === one.repo);
    const before = PASS_ORDER.slice(0, PASS_ORDER.indexOf(one.pass)).reverse().find((pass) => mine.some((other) => other.pass === pass));
    if (before) one.waitsOn = mine.filter((other) => other.pass === before).map((other) => other.id);
    else {
      const prior = repos[repos.indexOf(one.repo) - 1];
      one.waitsOn = prior ? parts.filter((other) => other.repo === prior && other.pass === "DOCS").map((other) => other.id) : [];
    }
  }
  // A repository's first pass waits on the release that ships a command it needs, which another go or window cuts: the part
  // is `waiting`, and it waits on no part of this plan, because the release it waits on is not one of them (s23).
  for (const { sheet } of scope) {
    for (const need of (Array.isArray(sheet.needsRelease) ? sheet.needsRelease : []) as { repo?: string; release?: string; command?: string }[]) {
      const first = parts.find((one) => one.repo === need.repo && one.pass !== "RELEASE" && !keptIds.has(one.id));
      if (first && need.release && !first.waitingOn) { first.state = "waiting"; first.waitingOn = `the release of ${need.release} that ships ${need.command ?? "a command it needs"}`; }
    }
  }
  // A wait marked by hand outlives a new derivation.
  for (const one of parts) {
    const old = (options.previous?.parts ?? []).find((was) => was.id === one.id);
    if (old?.state === "waiting" && !keptIds.has(one.id) && !one.waitingOn) { one.state = "waiting"; one.waitingOn = old.waitingOn; }
  }
  const ending = parts.filter((one) => one.pass === "GENERATED" || one.pass === "FULL_RUN").map((one) => one.id);
  const releases: string[] = [];
  for (const { sheet } of scope) for (const repo of sheet.releaseChain ?? []) if (!releases.includes(repo)) releases.push(repo);
  for (const repo of releases) {
    const id = `release-${repo}-1`;
    const old = (options.previous?.parts ?? []).find((one) => one.id === id && keptIds.has(id));
    parts.push(old ?? part(id, repo, "RELEASE", [], [], { waitsOn: ending }));
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

/** A part's changed entries that no later part of the plan carries: a follow-up part answers its landed part's change. */
export function staleEntries(part: GoPart, plan: GoPlan, scope: readonly ScopeSheet[]): string[] {
  const later = plan.parts.slice(plan.parts.indexOf(part) + 1).flatMap((one) => one.entries);
  return changedEntries(part, scope).filter((ref) => !later.includes(ref));
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
