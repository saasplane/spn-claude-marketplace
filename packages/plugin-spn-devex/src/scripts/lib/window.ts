// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The workstream is a scope of work, not a window · § A check at the end of a turn speaks once, and only about this window's work
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// Which workstreams a window works on (RULE.DEVEX.WORKSPACE.236), and the one reader every hook uses.
// A window is bound by the PATH a write goes to, the arc a `workstream` command writes, its first prompt,
// or a handover; never by text inside a write, and never by a read. The note is
// `.spndevex/.debug/sessions/<id>/window.json`, swept with the window's folder. The reader returns the empty
// set, never "everything", for a window with no binding, and a workstream that has left `open/` drops out of its answer.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { sessionDir } from "../../../../plugin-support-lib/src/lib/debug-store.ts";
import { ARCS, DEVEX, legacyWorkstreamsDir, workstreamDirOf, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { isDir } from "./payload.ts";
import { LOG_FILE, NOTES, findWorkstream, readQuestions, workstreamAround, workstreamsOf } from "./workstream.ts";
import { ARC_ID } from "./workstream-schema.ts";

/** How a workstream came to be this window's. */
export type BoundBy = "write" | "prompt" | "handover";

/** How a window is tied to a workstream: it owns it, or only visits it. */
export type Tie = "owns" | "visits";

type BoundMap = Record<string, { since: string; by: BoundBy; tie: Tie }>;

/** What the note holds. `wrote` is epoch milliseconds by arc path from the workspace; `told` is the last finding said, by key. */
export type WindowNote = {
  workstreams: BoundMap;
  wrote: Record<string, number>;
  told: Record<string, string>;
  /** The repositories (folder names under the workspace) this window has written under, by when it first did. */
  repos: Record<string, string>;
  /** The command groups (`spn-devex workstream`) whose usage this window read, by when it first did, for usage-first. */
  usage: Record<string, string>;
};

const empty = (): WindowNote => ({ workstreams: {}, wrote: {}, told: {}, repos: {}, usage: {} });

const sessionKey = (id: string): string => (id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);

/** The file that holds a window's note, `sessions/<id>/window.json`, or null for a session with no usable id. */
export function windowFile(root: string, session: string | undefined): string | null {
  const key = sessionKey(session ?? "");
  return key ? join(sessionDir(root, key), "window.json") : null;
}

/** A window's note. Absent or unreadable is an empty note, never a failure. */
export function readWindow(root: string, session: string | undefined): WindowNote {
  const file = windowFile(root, session);
  if (!file) return empty();
  try {
    const held = JSON.parse(readFileSync(file, "utf8")) as Partial<WindowNote> | null;
    // A tie missing from a note written before ties existed reads as owned, the one thing it then meant.
    const bound: BoundMap = {};
    for (const [name, one] of Object.entries(held?.workstreams && typeof held.workstreams === "object" ? held.workstreams : {}))
      bound[name] = { ...one, tie: one?.tie === "visits" ? "visits" : "owns" };
    return { workstreams: bound,
             wrote: held?.wrote && typeof held.wrote === "object" ? held.wrote : {},
             told: held?.told && typeof held.told === "object" ? held.told : {},
             repos: held?.repos && typeof held.repos === "object" ? held.repos : {},
             usage: held?.usage && typeof held.usage === "object" ? held.usage : {} };
  } catch { return empty(); }
}

/** Write the note whole, by a rename so a reader never meets half of it. Never throws. */
function save(root: string, session: string | undefined, note: WindowNote): void {
  const file = windowFile(root, session);
  if (!file) return;
  try {
    mkdirSync(dirname(file), { recursive: true });
    const draft = `${file}.${process.pid}.tmp`;
    writeFileSync(draft, JSON.stringify(note), "utf8");
    renameSync(draft, file);
  } catch { /* a note that cannot be written is a note that is missing, and nothing more */ }
}

/**
 * The workstream folder a path sits inside, by its place in the tree and never by what it says, or
 * null outside one. The folder itself counts (`mkdir`, a move into a state). Only this workspace's
 * own `.spndevex/workstreams/` counts, so a path in another checkout binds nothing.
 */
export function workstreamOfPath(root: string, path: string, cwd: string = root): { name: string; folder: string } | null {
  if (!path) return null;
  const absolute = resolve(isAbsolute(cwd) ? cwd : root, path);
  const within = relative(root, absolute);
  if (!within || within.startsWith("..") || isAbsolute(within)) return null;
  const found = workstreamDirOf(`${absolute}/`);
  if (!found) return null;
  const inside = relative(join(root, DEVEX), found.folder);
  return inside && !inside.startsWith("..") ? { name: found.name, folder: found.folder } : null;
}

/**
 * The arc a path writes, as the arc's data folder `<workstream>/arcs/N<nnn>`, or null: a path inside
 * the arc's `arcs/N<nnn>/` or its `notes/N<nnn>/`, the folder itself included.
 */
function arcOfPath(folder: string, path: string): string | null {
  const within = relative(folder, path).split("/");
  return (within[0] === ARCS || within[0] === NOTES) && within.length >= 2 && ARC_ID.test(within[1])
    ? join(folder, ARCS, within[1]) : null;
}

// The `workstream` commands that write an arc's data, as the words after `workstream`, and what names
// the arc: the arc itself, one of its cards, or a report under its notes.
const ARC_WRITES: ReadonlyArray<{ words: string[]; names: "arc" | "card" | "report" }> = [
  { words: ["arc", "edit"], names: "arc" }, { words: ["row", "add"], names: "arc" }, { words: ["row", "state"], names: "arc" },
  { words: ["row", "note"], names: "arc" }, { words: ["row", "edit"], names: "arc" }, { words: ["row", "discard"], names: "arc" },
  { words: ["fact", "write"], names: "arc" }, { words: ["arc", "stamp", "write"], names: "arc" },
  { words: ["question", "raise"], names: "arc" }, { words: ["question", "show"], names: "card" },
  { words: ["question", "answer"], names: "card" }, { words: ["question", "withdraw"], names: "card" },
  { words: ["report", "write"], names: "report" },
];

/** The workstream a name gives (`030`, `030-page-patterns`, a folder), or the one the command stands in. */
function workstreamNamed(root: string, cwd: string, name: string | null): string | null {
  if (name) return findWorkstream(name, root, cwd);
  return workstreamAround(cwd);
}

/**
 * The arc data a `workstream` command in a shell command writes, as one path inside each arc's folder
 * (`<workstream>/arcs/N<nnn>/log.jsonl`, which every such write appends to), so the window that runs it
 * is bound and its arc recorded as a write inside the folder is (01-workstream.md § The workstream is a
 * scope of work, not a window). The arc is named as the command takes it: `030/N004`, or `N004` in the
 * workstream the command stands in or the one open or backlog workstream that holds it; a card as
 * `030/q12` or `q12`, whose record names its arc; a report by its path under `notes/N<nnn>/`. A command
 * that names nothing this can find writes nothing here.
 */
export function commandWrites(root: string, cwd: string, command: string): string[] {
  const out: string[] = [];
  for (const segment of command.split(/&&|\|\||[;|\n]/)) {
    const words = segment.trim().split(/\s+/).map((word) => word.replace(/^['"]|['"]$/g, ""));
    const at = words.indexOf("workstream");
    if (at < 0) continue;
    const write = ARC_WRITES.find((one) => one.words.every((word, step) => words[at + 1 + step] === word));
    if (!write) continue;
    const named = words.slice(at + 1 + write.words.length).filter((word) => word && !word.startsWith("-"));
    try {
      if (write.names === "report") {
        const report = named.at(-1);
        const ws = named.length > 1 ? workstreamNamed(root, cwd, named[0]) : null;
        const path = report ? resolve(ws ?? cwd, report) : null;
        const arc = path ? /\/notes\/(N\d+[a-z]?)\//.exec(path.split(sep).join("/"))?.[1] : null;
        const home = path ? workstreamOfPath(root, path, cwd)?.folder ?? null : null;
        if (arc && home) out.push(join(home, ARCS, arc, LOG_FILE));
        continue;
      }
      const ref = named[0];
      if (!ref) continue;
      const slash = ref.lastIndexOf("/");
      const id = slash > 0 ? ref.slice(slash + 1) : ref;
      const given = slash > 0 ? workstreamNamed(root, cwd, ref.slice(0, slash)) : workstreamAround(cwd);
      const holds = (ws: string): string | null => write.names === "arc"
        ? (ARC_ID.test(id) ? id : null)
        : readQuestions(ws).find((one) => one.id === id.toLowerCase())?.arc ?? null;
      const holders = given ? [given] : workstreamsOf(root).filter((ws) => write.names === "arc" ? isDir(join(ws, ARCS, id)) : holds(ws) !== null);
      if (holders.length !== 1) continue;
      const arc = holds(holders[0]);
      if (arc) out.push(join(holders[0], ARCS, arc, LOG_FILE));
    } catch { /* a command this cannot read writes nothing here */ }
  }
  return out;
}

/**
 * Record what a window's writes did to its binding: each path inside a workstream folder binds that
 * workstream, and a path inside an arc's data or notes folder records the time the arc was written.
 * Nothing is written to disk where nothing changed in the binding and no arc was written.
 *
 * @param paths  every path the tool call writes, as the call gave it, and the arc data its `workstream`
 *               commands write (`commandWrites`)
 */
export function recordWrites(root: string, session: string | undefined, cwd: string, paths: string[]): void {
  if (!windowFile(root, session)) return;
  const repos = reposWrittenUnder(root, cwd, paths);
  const found: Array<{ name: string; folder: string; arc: string | null; absolute: string }> = [];
  for (const path of paths) {
    const where = workstreamOfPath(root, path, cwd);
    if (!where) continue;
    const absolute = resolve(isAbsolute(cwd) ? cwd : root, path);
    found.push({ ...where, absolute, arc: arcOfPath(where.folder, absolute) });
  }
  const note = readWindow(root, session);
  let changed = false;
  // THE REPOSITORIES A WINDOW HAS WRITTEN UNDER, by path: the only ones whose docs findings it is told of.
  for (const repo of repos)
    if (!note.repos[repo]) { note.repos[repo] = new Date().toISOString(); changed = true; }
  if (!found.length && !changed) return;
  for (const one of found) {
    if (!note.workstreams[one.name]) {
      // THE FIRST WORKSTREAM A WINDOW WRITES INSIDE, WHEN NOTHING NAMED ONE, IS ITS OWN. Every other
      // workstream it writes inside is only visited: a window may rightly file an item in another
      // workstream while planning, and that makes it a visitor and never the one who answers for it.
      const owns = !Object.values(note.workstreams).some((held) => held.tie === "owns");
      note.workstreams[one.name] = { since: new Date().toISOString(), by: "write", tie: owns ? "owns" : "visits" };
      changed = true;
    }
    if (one.arc) { note.wrote[relative(root, one.arc)] = Date.now(); changed = true; }
  }
  if (changed) save(root, session, note);
}

/** Record that this window read a command group's usage (a bare or `--help` call of it), the first time only. */
export function recordUsage(root: string, session: string | undefined, group: string): void {
  if (!windowFile(root, session) || !group) return;
  const note = readWindow(root, session);
  if (note.usage[group]) return;
  note.usage[group] = new Date().toISOString();
  save(root, session, note);
}

/** Whether this window has read the usage of a command group. */
export function usageRead(root: string, session: string | undefined, group: string): boolean {
  return Boolean(readWindow(root, session).usage[group]);
}

/** The member repositories (folders with an `sprepo.json`) these paths sit under, by folder name. */
function reposWrittenUnder(root: string, cwd: string, paths: string[]): string[] {
  const out = new Set<string>();
  for (const path of paths) {
    if (!path) continue;
    const within = relative(root, resolve(isAbsolute(cwd) ? cwd : root, path));
    if (!within || within.startsWith("..") || isAbsolute(within)) continue;
    const head = within.split("/")[0];
    if (head && !head.startsWith(".") && head !== "node_modules" && existsSync(join(root, head, "sprepo.json"))) out.add(head);
  }
  return [...out];
}

/** The repositories this window has written under, by folder name. Empty for a window that wrote under none. */
export function reposWritten(root: string, session: string | undefined): Set<string> {
  return new Set(Object.keys(readWindow(root, session).repos));
}

/**
 * Make a workstream the developer's words name this window's own. A visit becomes ownership here and
 * nowhere else: a write never promotes it.
 */
export function bindNamed(root: string, session: string | undefined, name: string, by: "prompt" | "handover"): void {
  if (!windowFile(root, session) || !name) return;
  const note = readWindow(root, session);
  if (note.workstreams[name]?.tie === "owns") return;
  note.workstreams[name] = { since: note.workstreams[name]?.since ?? new Date().toISOString(), by, tie: "owns" };
  save(root, session, note);
}

/**
 * Record a workstream a handover's `also open:` names as one this window only visits. A workstream
 * the window already holds keeps its tie, so an owned one is never turned into a visit.
 */
export function bindVisited(root: string, session: string | undefined, name: string): void {
  if (!windowFile(root, session) || !name) return;
  const note = readWindow(root, session);
  if (note.workstreams[name]) return;
  note.workstreams[name] = { since: new Date().toISOString(), by: "handover", tie: "visits" };
  save(root, session, note);
}

const isOpen = (root: string, name: string): boolean =>
  [workstreamsDir(root, "open"), legacyWorkstreamsDir(root, "open")].some((dir) => {
    try { return statSync(join(dir, name)).isDirectory(); } catch { return false; }
  });

/**
 * The names of the workstreams this window OWNS that are still in `open/`, sorted. The empty list for a
 * window with no binding or no session id. Never "every open workstream".
 */
export function windowWorkstreams(root: string, session: string | undefined): string[] {
  return Object.entries(readWindow(root, session).workstreams)
    .filter(([name, one]) => one.tie === "owns" && isOpen(root, name)).map(([name]) => name).sort();
}

/** The open workstreams this window only visits: it wrote a file there, and answers for none of its cards. */
export function visitedWorkstreams(root: string, session: string | undefined): Set<string> {
  return new Set(Object.entries(readWindow(root, session).workstreams)
    .filter(([name, one]) => one.tie === "visits" && isOpen(root, name)).map(([name]) => name));
}

/** The same as a set of names, which is what the checks that take `mine` read. */
export function windowSet(root: string, session: string | undefined): Set<string> {
  return new Set(windowWorkstreams(root, session));
}

/** The arcs this window wrote after `since`, each as its absolute data folder `<workstream>/arcs/N<nnn>`. */
export function arcsWrittenSince(root: string, session: string | undefined, since: number): Set<string> {
  const out = new Set<string>();
  for (const [arc, at] of Object.entries(readWindow(root, session).wrote))
    if (at > since) out.add(join(root, arc));
  return out;
}

/**
 * Whether this window was already told this finding, and if it was not, remember that it is told now.
 *
 * @param slot     what the finding is about: `<check>|<workstream>`
 * @param finding  what it says: the cards or rows it names. The same slot with the same finding is said once;
 *                 a changed finding is said again
 * @returns true where the window has heard exactly this before, and the note should stay silent
 */
export function alreadyTold(root: string, session: string | undefined, slot: string, finding: string): boolean {
  if (!windowFile(root, session)) return false;
  const note = readWindow(root, session);
  if (note.told[slot] === finding) return true;
  note.told[slot] = finding;
  save(root, session, note);
  return false;
}

/**
 * A line about a workstream opens with its folder name and the tie, so a reader with two windows open
 * knows which workstream it is and whether this window owns it or only visits it.
 */
export function named(workstream: string, text: string, tie: Tie = "owns"): string {
  return `\`${workstream}\` (${tie === "owns" ? "owned" : "visited"}) · ${text}`;
}

/** A path from the workspace, never a base name, so `approach.html` is told from the other `approach.html`. */
export function fromWorkspace(root: string, path: string): string {
  const within = relative(root, path);
  return within && !within.startsWith("..") ? within : basename(path);
}
