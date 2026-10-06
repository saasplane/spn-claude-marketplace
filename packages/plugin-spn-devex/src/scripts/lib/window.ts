// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The workstream is a scope of work, not a window · § A check at the end of a turn speaks once, and only about this window's work
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// Which workstreams a window works on (RD.DEVEX.WORKSPACE.236), and the one reader every hook uses.
// A window is bound by the PATH a write goes to, by its first prompt, or by a handover; never by text
// inside a write, and never by a read. The note is `.spndevex/.debug/windows/<session>.json`, removed
// after fourteen days. The reader returns the empty set, never "everything", for a window with no
// binding, and a workstream that has left `open/` drops out of its answer.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { ARCS, DEVEX, legacyWorkstreamsDir, workstreamDirOf, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

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
};

const DEBUG = ".debug";
const WINDOWS = "windows";
// A note older than this belongs to a window long closed, and is removed when a new note is made.
const KEEP_MS = 14 * 24 * 3600 * 1000;

const empty = (): WindowNote => ({ workstreams: {}, wrote: {}, told: {}, repos: {} });

const sessionKey = (id: string): string => (id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);

/** The folder of the notes, `<root>/.spndevex/.debug/windows`. */
export const windowsDir = (root: string): string => join(root, DEVEX, DEBUG, WINDOWS);

/** The file that holds a window's note, or null for a session with no usable id. */
export function windowFile(root: string, session: string | undefined): string | null {
  const key = sessionKey(session ?? "");
  return key ? join(windowsDir(root), `${key}.json`) : null;
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
             repos: held?.repos && typeof held.repos === "object" ? held.repos : {} };
  } catch { return empty(); }
}

/** Write the note whole, by a rename so a reader never meets half of it. Never throws. */
function save(root: string, session: string | undefined, note: WindowNote): void {
  const file = windowFile(root, session);
  if (!file) return;
  try {
    const fresh = !existsSync(file);
    mkdirSync(dirname(file), { recursive: true });
    const draft = `${file}.${process.pid}.tmp`;
    writeFileSync(draft, JSON.stringify(note), "utf8");
    renameSync(draft, file);
    if (fresh) prune(dirname(file));
  } catch { /* a note that cannot be written is a note that is missing, and nothing more */ }
}

/** Remove every note older than fourteen days. */
function prune(dir: string): void {
  const cutoff = Date.now() - KEEP_MS;
  try {
    for (const name of readdirSync(dir))
      try { if (statSync(join(dir, name)).mtimeMs < cutoff) rmSync(join(dir, name), { force: true }); } catch { /* next */ }
  } catch { /* nothing to prune */ }
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

/** Whether a path is an arc's file or sits in the arc's notes folder, and which arc file that is. */
function arcOfPath(folder: string, path: string): string | null {
  const within = relative(folder, path).split("/");
  if (within[0] === ARCS && within.length === 2 && within[1].endsWith(".md")) return path;
  if (within[0] === "notes" && within.length >= 3) {
    const number = within[1];
    try {
      const file = readdirSync(join(folder, ARCS)).find((name) => name.startsWith(`${number}-`) && name.endsWith(".md"));
      return file ? join(folder, ARCS, file) : null;
    } catch { return null; }
  }
  return null;
}

/**
 * Record what a window's writes did to its binding: each path inside a workstream folder binds that
 * workstream, and a path that is an arc, or inside an arc's notes, records the time it was written.
 * Nothing is written to disk where nothing changed in the binding and no arc was written.
 *
 * @param paths  every path the tool call writes, as the call gave it
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

/** The arcs (absolute paths) this window wrote after `since`, and that are still files. */
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
