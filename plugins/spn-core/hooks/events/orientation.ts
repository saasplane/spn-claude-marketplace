#!/usr/bin/env node
// RESTATES: the foundation's `CONCEPT.md` (`#### DevEx Workspace`) and RD.DEVEX.020, and the
// workspace-level argument that decided this shape. A change is made there first, then here.
//
// The orientation a session opens with — read from the ground, never from a typed list.
//
// A workspace file naming its members in prose goes stale the first time somebody clones an eighth
// repo, so nothing here is typed: the script walks the root, reads each `sprepo.json` for the world
// and the stack claim, checks each repo's wiring against what that claim implies, and lists the
// workstreams in all three states.
//
//   SessionStart :  node orientation.ts --stdin   (the hook, from the event JSON on stdin)
//   by hand      :  node orientation.ts [path]    (the same text on stdout, so you can read it)
//
// Three parts, in this order — a session that opens with a status dump reads like a build log:
//
//   1. a welcome
//   2. the ground — the members, the law each carries, the wiring, and every workstream
//   3. ONE open question, and never a typed list of options — you arrive with something in mind, and
//      a leading question picks your subject for you. Beside it, and only when exactly one
//      workstream is open and no second session is live under this root, a standing offer to carry
//      that one on. Two offers is not a menu; three would be.
//
// A workstream carries its state in its parent folder, so the three are read and shown together:
// `open/` is available now, `backlog/` is parked, and `closed/` is the receipt. The number in the
// folder name is assigned once in creation order and never reused, so it is an identity rather than
// a priority — a workstream keeps it when it moves state.
//
// Day zero is the special case. No `sprepo.json` anywhere means there is no code to read, so the
// agent asks instead of reading and the rung points at the `day-zero` skill.
//
// Exit code is always 0 and every read is wrapped: a broken orientation must never cost a window.
//
// PORTED FROM `hooks/scripts/orientation.py`. Its output IS the session's first screen, so the port's
// test is a byte-for-byte diff of the two against this workspace and against fixtures for the states
// it is not in.

import { execFileSync } from "node:child_process";
import { readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDir, isFile, listdir, read, readPayload, runAlone, type Payload } from "../lib/payload.ts";
import { begin, end, record } from "../lib/timing.ts";

const MARKETPLACE = "saasplane";
const CORE = "spn-core";
// The derivation `repo agent-sync` already performs, from the manifest and nothing else. A repo with
// no claim at all — the marketplace itself is one — falls back to the core plugin alone.
const WORLD_PLUGINS: Record<string, string[]> = { FOUNDATION: [CORE], INFRA: [CORE, "spn-infra"] };
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", ".output",
  "tool-results", "__pycache__", ".venv"]);
const NODE_MANIFEST: Record<string, string> = { APPS: "spkind.json", INFRA: "spinfrapkg.json" };
// The lifecycle, in the order a window reads it: what you can pick up, what is parked, what is done.
// A workstream's state is its parent folder and nothing else.
const STATES = ["open", "backlog", "closed"];
const NUMBERED = /^(\d{1,4})-(.+)$/;

function readJson(path: string): Record<string, any> | null {
  try { return JSON.parse(read(path)); } catch { return null; }
}

const LETTER = /[\p{L}_]/u;

/**
 * Where a hyphenated word may be broken, the way Python's `textwrap` breaks one.
 *
 * THIS IS NOT A DETAIL. `textwrap.wrap` defaults to `break_on_hyphens=True`, so it splits
 * `011-coverage-proof` after `coverage-` and puts `proof` on the next line. A wrapper that keeps
 * words whole produces different output from the incumbent on the one line a reader scans for a
 * workstream number, and the diff that proves this port faithful would fail on it.
 *
 * The rule, restated from `wordsep_re`: break after a hyphen when two letters precede it, or a
 * letter-hyphen-letter does, AND a letter follows. So `011-` never breaks — a digit is not a letter.
 */
function hyphenChunks(word: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < word.length; i += 1) {
    if (word[i] !== "-") continue;
    const before = word.slice(0, i);
    const okBefore = new RegExp(`${LETTER.source}{2}$`, "u").test(before)
                  || new RegExp(`${LETTER.source}-${LETTER.source}$`, "u").test(before);
    const okAfter = new RegExp(`^${LETTER.source}-?${LETTER.source}`, "u").test(word.slice(i + 1));
    if (okBefore && okAfter) { out.push(word.slice(start, i + 1)); start = i + 1; }
  }
  out.push(word.slice(start));
  return out.filter(Boolean);
}

/** Greedy word wrap, the way Python's `textwrap.wrap` does it — hyphen breaks included. */
function wrap(text: string, width: number): string[] {
  const chunks: string[] = [];
  for (const piece of text.split(/(\s+)/)) {
    if (!piece) continue;
    if (/^\s+$/.test(piece)) chunks.push(piece.replace(/\s/g, " "));
    else chunks.push(...hyphenChunks(piece));
  }
  const out: string[] = [];
  let line: string[] = [];
  let length = 0;
  const flush = () => {
    while (line.length && /^\s+$/.test(line[line.length - 1])) length -= line.pop()!.length;
    if (line.length) out.push(line.join(""));
    line = [];
    length = 0;
  };
  for (const chunk of chunks) {
    if (!line.length && /^\s+$/.test(chunk)) continue;    // whitespace never opens a line
    if (length + chunk.length <= width) { line.push(chunk); length += chunk.length; continue; }
    flush();
    if (/^\s+$/.test(chunk)) continue;
    line.push(chunk);
    length = chunk.length;
  }
  flush();
  return out;
}

function hasLaw(path: string): boolean {
  return isFile(join(path, "sprepo.json"));
}

/**
 * The folder the sibling checkouts sit in. A child session is rooted in one member, so the walk goes
 * up: the first ancestor carrying `.spndevex/`, else the first with a member under it, else where
 * you started.
 */
export function workspaceRootOf(start: string): string {
  let path = resolve(start);
  const seen: string[] = [];
  for (;;) {
    seen.push(path);
    if (isDir(join(path, ".spndevex"))) return path;
    const up = resolve(path, "..");
    if (up === path) break;
    path = up;
  }
  for (const candidate of seen)
    if (listdir(candidate).some((d) => hasLaw(join(candidate, d)))) return candidate;
  return resolve(start);
}

/**
 * A member is a checkout sitting beside the others. Its law is `sprepo.json`; a member without one is
 * an artifact surface rather than a governed repo, and says so.
 */
function members(root: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const name of listdir(root)) {
    const path = join(root, name);
    if (!isDir(path)) continue;
    if (hasLaw(path) || isDir(join(path, ".git"))) out.push([name, path]);
  }
  return out;
}

/** World, stack claim and infra pins — from the manifest, never from the folder name. */
function lawOf(path: string): { world: string | null; stack: string | null; pins: string[] } {
  const manifest = readJson(join(path, "sprepo.json")) ?? {};
  const config = manifest.config ?? {};
  const pins: string[] = [];
  for (const [role, key] of [["org", "organization"], ["plt", "platform"]]) {
    const entry = (config.infra ?? {})[key] ?? {};
    if (!entry.package) continue;
    pins.push(`${role} ${basename(entry.package)}@${entry.version || "path"}`);
  }
  return { world: manifest.type ?? null, stack: config.stack ?? null, pins };
}

function expectedPlugins(world: string | null, stack: string | null): string[] {
  if (world === "APPS" && stack) return [CORE, `spn-apps-${stack.toLowerCase()}`];
  return WORLD_PLUGINS[world ?? ""] ?? [CORE];
}

function enabledPlugins(path: string): Set<string> {
  const settings = readJson(join(path, ".claude", "settings.json")) ?? {};
  return new Set(Object.entries(settings.enabledPlugins ?? {})
    .filter(([, on]) => on).map(([key]) => key.split("@")[0]));
}

/**
 * A node declares itself. `spkind.json` for an apps node, `spinfrapkg.json` for an estate one — a
 * per-world question, never a per-stack one.
 */
function countNodes(path: string, world: string | null): number | null {
  const manifest = NODE_MANIFEST[world ?? ""];
  if (!manifest) return null;
  const base = resolve(path);
  const baseDepth = base.split(sep).length;
  let found = 0;
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { continue; }
    if (dir.split(sep).length - baseDepth > 3) continue;
    if (entries.includes(manifest)) found += 1;
    for (const entry of entries) {
      if (SKIP.has(entry) || entry.startsWith(".")) continue;
      const next = join(dir, entry);
      if (isDir(next)) stack.push(next);
    }
  }
  return found;
}

function age(seconds: number): string {
  const days = Math.floor((Date.now() / 1000 - seconds) / 86400);
  if (days <= 0) return "touched today";
  if (days === 1) return "touched yesterday";
  return `untouched ${days} days`;
}

function newest(paths: string[]): number {
  const stamps: number[] = [];
  for (const path of paths) {
    try { stamps.push(statSync(path).mtimeMs / 1000); } catch { continue; }
  }
  return stamps.length ? Math.max(...stamps) : 0;
}

function treeFiles(path: string): string[] {
  const out: string[] = [];
  const stack = [path];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { continue; }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (isDir(full)) { if (!SKIP.has(entry)) stack.push(full); }
      else out.push(full);
    }
  }
  return out;
}

/**
 * `042-widget-pricing` reads as number `042`, subject `widget-pricing`. A folder carrying no number
 * is still a workstream — the older shapes have none.
 *
 * The example is deliberately not a real workstream. This file discovers them by reading
 * `.spndevex/`, so naming one here would be a second answer competing with the folders.
 */
function numbered(folder: string): [string, string] {
  const match = NUMBERED.exec(folder);
  return match ? [match[1], match[2]] : ["", folder];
}

type Workstream = { folder: string; number: string; subject: string; state: string;
                    page: string; arcs: number; when: number; legacy: string };

/**
 * Every workstream and the state it sits in — the shape, and the two it replaces.
 *
 * One window restructures `.spndevex/` and another may open before it lands, so
 * `sessions/{state}/{subject}/` and a bare `arcs/arc-{subject}.md` are read the same way and marked
 * as legacy.
 */
export function workstreams(root: string): Workstream[] {
  const devex = join(root, ".spndevex");
  const found = new Map<string, Workstream>();
  for (const state of STATES)
    for (const [base, legacy] of [[join(devex, "workstreams", state), ""],
                                  [join(devex, "sessions", state), "sessions/"]] as const)
      for (const folder of listdir(base)) {
        const path = join(base, folder);
        if (!isDir(path) || found.has(folder)) continue;
        const files = treeFiles(path);
        const [number, subject] = numbered(folder);
        found.set(folder, {
          folder, number, subject, state,
          // BOTH OF THESE READ ONE LEVEL, NOT THE TREE. `treeFiles` walks everything under the
          // folder, and a workstream's `notes/retired/` holds whole pockets that other repositories
          // gave up — 51 approach pages in one case, every one of them sorting before the
          // workstream's own. A recursive `find` therefore linked a retired page belonging to
          // another repo, and the arc count matched a template rather than the arcs.
          page: (() => {
            const own = listdir(path).filter((f) => f.endsWith("-approach.html")).sort()[0];
            return own ? join(path, own) : "";
          })(),
          arcs: listdir(join(path, "arcs")).filter((f) => f.endsWith(".md")).length,
          when: newest(files) || newest([path]),
          legacy,
        });
      }
  for (const name of listdir(join(devex, "arcs"))) {
    if (!name.startsWith("arc-") || !name.endsWith(".md")) continue;
    const subject = name.slice("arc-".length, -".md".length);
    if (found.has(subject)) continue;
    const arc = join(devex, "arcs", name);
    const page = join(devex, "notes", `${subject}-approach.html`);
    found.set(subject, { folder: subject, number: "", subject, state: "open",
      page: isFile(page) ? page : "", arcs: 1, when: newest([arc, page]), legacy: "arcs/" });
  }
  return [...found.values()].sort((a, b) => {
    const left = a.number || "zzz", right = b.number || "zzz";
    if (left !== right) return left < right ? -1 : 1;
    return a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0;
  });
}

/** `0.10.0` sorts above `0.2.0`, which a string comparison gets backwards. */
function versionKey(name: string): number[] {
  return name.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : -1));
}

function compareVersions(a: string, b: string): number {
  const left = versionKey(a), right = versionKey(b);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i] ?? -Infinity, r = right[i] ?? -Infinity;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

/**
 * A tree's content, ignoring what a copy legitimately changes: byte-compiled caches, and the
 * timestamps a copy rewrites. Sizes and names are enough to catch an edit that has not been
 * installed yet, which is the whole question.
 */
function digest(path: string): string {
  const base = resolve(path);
  const out: string[] = [];
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { continue; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) stack.push(full); }
      else out.push(`${relative(base, full)}\u0000${stat.size}`);
    }
  }
  return out.sort().join("\n");
}

/**
 * The wiring this window is running, when it is older than what is installed.
 *
 * `cacheState` above answers a different question — whether the cache was built from current source
 * — and it carries the assumption this one tests: *only the newest cache directory is the one a
 * window loads*. That is true of the NEXT window. A window loads whatever was installed the moment
 * it started, and it keeps that copy for its whole life, so a session running while somebody else
 * installs is reading a directory that is no longer the newest.
 *
 * THE VERSION IS READ OFF THIS FILE'S OWN PATH, because that is the one thing a running hook knows
 * for certain about itself. An installed copy lives at `…/cache/<marketplace>/<plugin>/<version>/`,
 * so the path names the version that answered. Running from source there is no such segment, and
 * this returns null rather than guessing — a checkout is not behind an install, it IS the source.
 *
 * `RD.DEVEX.057` puts the handover on the tool that changes the wiring. This is the other end of the
 * same rule: the window that cannot adopt its own new wiring can at least say so on the way in.
 */
function loadedBehind(): string | null {
  let here: string;
  try { here = fileURLToPath(import.meta.url).replace(/\\/g, "/"); }
  catch { return null; }
  // THE CACHE ROOT COMES FROM THE PATH TOO, rather than from `homedir()`. The copy that answered
  // knows where it lives, and deriving the root removes an assumption about where installs are kept.
  const at = /^(.*\/plugins\/cache)\/([^/]+)\/([^/]+)\/([^/]+)\//.exec(here);
  if (!at) return null;                                  // running from source
  const [, cacheRoot, , plugin, loaded] = at;
  const cached = join(cacheRoot, at[2], plugin);
  // A directory carrying `.orphaned_at` is a previous install nothing loads, and reading one is how
  // a clock came to report a window behind a version that had been retired.
  const versions = listdir(cached).filter((v) => !isFile(join(cached, v, ".orphaned_at")));
  if (!versions.length) return null;
  const newest = versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b));
  if (compareVersions(newest, loaded) <= 0) return null;
  return `⚠ this window loaded \`${plugin} ${loaded}\` and \`${newest}\` is installed — ` +
    "it keeps the copy it started with, so take a fresh window before trusting a skill, a brief or a rule file";
}

/**
 * Whether the cache a live window is judged by matches the source it was built from.
 *
 * The install directory is shared across the machine and the version moves, so the version is
 * globbed rather than named, and a directory carrying `.orphaned_at` is skipped — it is a previous
 * install nothing loads. Any surprise reads as unknown rather than as current.
 */
function cacheState(root: string, pluginNames: string[]): string {
  // The marketplace is registered in `settings.local.json` on this machine and could be in either
  // file, so both are read and the local one wins — it is the per-developer override.
  const sources: Record<string, any> = {};
  for (const name of ["settings.json", "settings.local.json"])
    Object.assign(sources, (readJson(join(root, ".claude", name)) ?? {}).extraKnownMarketplaces ?? {});
  let pairs: Array<[string, string | null]> = Object.entries(sources)
    .map(([market, entry]) => [market, ((entry ?? {}).source ?? {}).path ?? null]);
  if (!pairs.length) {
    // A marketplace registered at user scope is invisible to this file, and an empty loop below
    // would return `cache current` having compared nothing. The workspace still holds the source as
    // a member, so find the repo carrying these plugins and use that. Failing that, say so — a green
    // nobody earned is worse than an unknown.
    const holds = listdir(root)
      .map((name) => join(root, name))
      .filter((path) => pluginNames.every((plugin) => isDir(join(path, "plugins", plugin))));
    pairs = holds.length ? [[MARKETPLACE, holds[0]]] : [];
  }
  if (!pairs.length) return "cache unknown — no marketplace source";
  const stale: string[] = [];
  for (const [market, source] of pairs) {
    if (!source || !isDir(source)) return "cache unknown";
    for (const plugin of pluginNames) {
      const live = join(source, "plugins", plugin);
      const cached = join(homedir(), ".claude", "plugins", "cache", market, plugin);
      const versions = listdir(cached).filter((v) => !isFile(join(cached, v, ".orphaned_at")));
      if (!isDir(live) || !versions.length) return "cache unknown";
      // Only the newest cache directory is the one a window loads. Comparing every retained version
      // reported stale forever, because an older version differs from source by definition — which is
      // the same useless answer as always reporting current.
      const latest = versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b));
      if (digest(join(cached, latest)) !== digest(live)) stale.push(plugin);
    }
  }
  if (stale.length) return "cache stale — " + [...new Set(stale)].sort().join(" ");
  return "cache current";
}

type Repo = { name: string; path: string; world: string | null; stack: string | null;
              pins: string[]; want: string[]; have: Set<string>; wired: boolean; nodes: number | null };

/**
 * Which rung of the ladder the ground says you are on. The offer depends on it, so a partner in week
 * one and a partner in month six get different sessions. Rungs past building need the machine store
 * and the network, so this stops where the workspace can answer.
 */
function rung(repos: Repo[]): [number, string] {
  if (!repos.length) return [0, "empty — no sprepo.json anywhere"];
  const apps = repos.filter((r) => r.world === "APPS");
  if (!apps.length) return [1, "estate only — no APPS repo yet"];
  const withoutConcept = apps.filter((r) => !isFile(join(r.path, "CONCEPT.md")));
  if (withoutConcept.length)
    return [2, "an APPS repo carries no CONCEPT.md — " + withoutConcept.map((r) => r.name).join(" ")];
  if (apps.every((r) => (r.nodes ?? 0) < 3)) return [3, "concept present, very few nodes below it"];
  return [4, "building — apps and packages present"];
}

/**
 * Your Claude registration, so the session greets you rather than an empty chair.
 *
 * A greeting is chat, and this is the one place the name belongs — it is never written into a
 * document, a workstream page or any file the repo keeps. Read-only, one field, and a failure of any
 * kind just means the session says hello without it.
 */
function developerName(): string | null {
  try {
    const name = String(((readJson(join(homedir(), ".claude.json")) ?? {}).oauthAccount ?? {}).displayName ?? "");
    const first = name.trim().split(/\s+/)[0] ?? "";
    return first.length > 1 && first.length <= 20 && /^[a-z]+$/i.test(first.replace(/-/g, "")) ? first : null;
  } catch { return null; }
}

/**
 * Small numbers spelled out, because a numeral mid-sentence reads like a status line and this
 * paragraph is the one place the session is talking to you rather than reporting.
 */
function spell(n: number): string {
  const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve"];
  return n < words.length ? words[n] : String(n);
}

/**
 * Every ancestor of this process. The hook runs UNDER a session, so without this the session asking
 * the question counts itself as somebody else working here.
 */
function ownChain(): Set<number> {
  const chain = new Set<number>();
  let pid = process.pid;
  for (let i = 0; i < 12; i += 1) {
    chain.add(pid);
    let out: string;
    try { out = execFileSync("ps", ["-o", "ppid=", "-p", String(pid)], { encoding: "utf8", timeout: 2000 }).trim(); }
    catch { break; }
    if (!/^\d+$/.test(out) || Number(out) <= 1) break;
    pid = Number(out);
  }
  return chain;
}

/**
 * How many other Claude sessions are live under this workspace right now.
 *
 * A session announces itself nowhere on disk, so the honest check is the running one: which `claude`
 * processes are alive, and which of those are working below this root. It answers for the workspace
 * rather than for one workstream — the conservative direction, since it withholds the offer to resume
 * more often than it should and never less.
 *
 * `comm` rather than the full command line, deliberately: a process listing that prints arguments
 * prints whatever a developer typed beside them.
 */
function sessionsHere(root: string): number {
  try {
    const mine = ownChain();
    const listing = execFileSync("ps", ["-eo", "pid=,comm="], { encoding: "utf8", timeout: 3000 });
    let others = 0;
    for (const line of listing.split("\n")) {
      const parts = line.trim().split(/\s+(.+)/);
      if (parts.length < 2 || !/^\d+$/.test(parts[0])) continue;
      const pid = Number(parts[0]);
      if (mine.has(pid) || basename(parts[1].trim()) !== "claude") continue;
      let cwd: string;
      try { cwd = execFileSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], { encoding: "utf8", timeout: 3000 }); }
      catch { continue; }
      for (const entry of cwd.split("\n"))
        if (entry.startsWith("n")) {
          let real: string;
          try { real = realpathSync(entry.slice(1)); } catch { real = entry.slice(1); }
          if (real.startsWith(root)) { others += 1; break; }
        }
    }
    return others;
  } catch { return 0; }                             // never cost a window
}

/**
 * What is available now, above what is parked, above the receipt. State is printed on every row
 * rather than as a heading, so a window skimming one line still knows what it is looking at. Closed
 * collapses to one wrapped line — its number is what a later sitting cites.
 */
function workstreamLines(streams: Workstream[]): string[] {
  if (!streams.length)
    return ["### Workstreams — none yet", "",
            "A subject becomes one by `mkdir` under `backlog/` or `open/` — then update the agent "
            + "and reload BEFORE executing it (`cross-repo.md`)."];
  const byState: Record<string, Workstream[]> = Object.fromEntries(
    STATES.map((state) => [state, streams.filter((w) => w.state === state)]));
  const tally = STATES.filter((s) => byState[s].length).map((s) => `${byState[s].length} ${s}`).join(" · ");
  // RD.DEVEX.049. The MUST binds the moment a workstream is picked up, and this is the surface a
  // session meets before any skill. Printed with the tally rather than under a workstream: it is
  // true of whichever one you open, including one you are about to create.
  const out = [`### Workstreams — ${tally}`, "",
    "Open one with the agent update and the reload, then execute — `cross-repo.md`."];
  // A TABLE, BECAUSE THESE ROWS ARE COMPARED RATHER THAN READ. A reader scanning for what to pick up
  // is comparing the same four facts across every workstream, and aligned columns are what makes
  // that a glance instead of a parse. Markdown rather than padding: the surface renders it.
  const live = [...byState.open, ...byState.backlog];
  if (live.length) {
    out.push("", "| | # | Workstream | Page | Arcs | Touched |", "| --- | --- | --- | --- | --- | --- |");
    for (const state of ["open", "backlog"])
      for (const w of byState[state]) {
        // A page nobody can open is a page nobody reads. VS Code shows an `.html` file as source, so
        // the cell offers the URL a browser takes rather than the path an editor opens. Only an OPEN
        // workstream gets a link: a parked page is not being read.
        const page = !w.page ? "—"
          : state === "open" ? `[approach page](file://${w.page})`
          : "approach page";
        const legacy = w.legacy ? ` · still in ${w.legacy}` : "";
        out.push(`| ${state === "open" ? "🟢 open" : "⏸ backlog"} | ${w.number || "—"} | ${w.subject} `
          + `| ${page} | ${w.arcs} | ${age(w.when)}${legacy} |`);
      }
  }
  // CLOSED STAYS A LINE. It is a receipt rather than something to pick up, and twelve rows of it
  // would outweigh the handful a reader can actually act on.
  if (byState.closed.length) {
    out.push("", `**${byState.closed.length} closed** — `
      + byState.closed.map((w) => "`" + w.folder + "`").join(" · "));
  }
  return out;
}

/**
 * The last thing a session says before you type.
 *
 * Two offers and no menu: the open question you arrived with, and — only when exactly one workstream
 * is open — the standing one, by name. Two open workstreams would make naming one a choice on your
 * behalf, which is the thing this script refuses to do.
 *
 * The standing offer is withheld the moment another session is live under this root. Two windows on
 * one workstream is how an approach page grows two authors, and a cheap check is worth more than the
 * convenience it costs.
 */
function closingLines(root: string, streams: Workstream[]): string[] {
  const ask = "So — what are we building?";
  const openNow = streams.filter((w) => w.state === "open");
  if (openNow.length !== 1) return ["", ask, ""];
  const only = openNow[0];
  const name = [only.number, only.subject].filter(Boolean).join(" ");
  const others = sessionsHere(root);
  const offer = others
    ? `${name} is open, but ${others} other session${others > 1 ? "s are" : " is"} open in this ` +
      `workspace. I will not touch it unless you ask me to.`
    : `Or ask me to continue ${name}, and I will start where we stopped.`;
  return ["", ask, "", ...wrap(offer, 84), ""];
}

function claim(repo: Repo): string {
  if (!repo.world) return "—";
  return repo.world + (repo.stack ? ` · ${repo.stack}` : "");
}

export function orient(root: string, cwd: string): [text: string, note: string] {
  const repos: Repo[] = members(root).map(([name, path]) => {
    const { world, stack, pins } = lawOf(path);
    const want = expectedPlugins(world, stack);
    const have = enabledPlugins(path);
    return { name, path, world, stack, pins, want, have,
             wired: want.every((p) => have.has(p)), nodes: countNodes(path, world) };
  });
  const who = developerName();
  const governed = repos.filter((r) => r.world);
  const streams = workstreams(root);
  const [level, why] = rung(governed);

  if (!governed.length) {
    // A DAY-0 WALK IS RESUMED, NEVER RESTARTED. The answers land in a workstream before the first
    // repository exists, so a window lost mid-walk reopens on this same screen with three answers
    // already on disk. Offering the door again would ask somebody to name their organization twice
    // — and the second answer is the one that reaches the manifests.
    const started = streams.find((s) => s.state === "open" && s.subject === "new-platform");
    const text = `# Welcome to SaaS Plane${who ? ", " + who : ""}! Good to see you 👋\n\n` +
      "## Your team's time belongs to your product. 🚀\n\n" +
      "**The AI-native, DevEx-first Foundation for Building and Launching Secure, " +
      "Scalable, Compliance-ready SaaS Platforms.**\n\n" +
      "🤖 **I am the DevEx agent** — think of me as your engineering brain for this " +
      "platform, and I work on it with you.\n\n" +
      "I know the engineering workflows end to end: setting a repo up, shaping an idea, planning it, " +
      "developing, testing, provisioning the estate, delivering a change, and operating " +
      "what runs. Each has its own standards and its own proof, and I carry both. " +
      "Architects, QA, ops and security each have a road here, not developers alone.\n\n" +
      "&nbsp;\n\n" +
      (started
        ? "You started a platform here and we did not finish. No repository exists yet, and " +
          "your answers are on disk where you left them — `.spndevex/workstreams/open/" +
          started.folder + "/arcs/`.\n\n" +
          "I will read what you already answered, tell you where we stopped, and pick up at the " +
          "next question. Nothing you decided is asked again.\n\n" +
          "Shall we carry on?\n"
        : "This folder is empty, which is a good place to start. There is nothing to read " +
          "yet, so nothing here is decided.\n\n" +
          "Say yes and I mint the workspace, open a workstream to hold your answers, then " +
          "ask the estate questions one at a time. Your answers name every account, package " +
          "and prefix that comes after, and each one lands in a file as you give it — so " +
          "nothing rests on this window staying open. Say no and nothing is created.\n\n" +
          "Would you like to start a new platform?\n");
    const note = "\n---\nDay-0 mode: no sprepo.json under " + root + ". You have no code to read, " +
      "so do not orient — load the `day-zero` skill and walk it. " +
      (started
        ? "A day-0 walk is already open here: `.spndevex/workstreams/open/" + started.folder +
          "/`. Read its arc BEFORE you say anything. Resume at the first coordinate it does not " +
          "carry an answer for, and never ask again for one it holds.\n"
        : "Act 0 is the door above: ask, and run nothing until they answer. A no is a real " +
          "answer and this folder stays empty. On a yes, act 1 mints the workspace and act 2 " +
          "opens the workstream that holds the answers, before the first question is asked.\n");
    return [text, note];
  }

  // A partner's first session opens here, and a table of repos tells them nothing about what this is
  // or what the agent is for. Three short paragraphs, then the ground — never a fourth, because the
  // header's own rule is that a session opening with a status dump reads like a build log.
  //
  // THE WELCOME IS THE AGENT'S OWN, AND IT IS TYPED HERE ON PURPOSE. Do not read it from a repo. This
  // plugin runs in a partner's workspace, where the foundation book is not a member and absence is
  // how access control works — so a banner sourced from that book would render empty for the reader
  // who needs it most. Everything below the welcome is discovered, and the welcome alone is declared.
  const lines: string[] = [
    `# Welcome to SaaS Plane${who ? ", " + who : ""}! Good to see you 👋`,
    "",
    "## Your team's time belongs to your product. 🚀",
    "",
    "**The AI-native, DevEx-first Foundation for Building and Launching Secure, Scalable, Compliance-ready SaaS Platforms.**",
    "",
    "🤖 **I am the DevEx agent** — think of me as your engineering brain for this platform, and I work on it with you.",
    "",
    "I know the engineering workflows end to end: setting a repo up, shaping an idea, planning it, developing, testing, provisioning the estate, delivering a change, and operating what runs. Each has its own standards and its own proof, and I carry both. Architects, QA, ops and security each have a road here, not developers alone.",
    "",
    "### 💡 Tell me what you want to build",
    "",
    "Your idea can be rough. We shape it together first, then build it in four steps: the approach, the docs, the code, and the tests that prove it works.",
    "",
    `You have ${spell(repos.length)} repo${repos.length === 1 ? "" : "s"} here and one `
      + "window. Every file follows its own rules, and finding them is my job. You just build.",
    "",
  ];
  const settings = readJson(join(root, ".claude", "settings.json")) ?? {};
  const floor = Object.entries(settings.enabledPlugins ?? {}).filter(([, on]) => on).map(([k]) => k);
  const plugins = [...new Set(floor.map((k) => k.split("@")[0]))].sort();
  const head = plugins.length
    ? `floor ${plugins.length} plugins · ${cacheState(root, plugins)}`
    : "floor not minted — no plugins enabled here";
  lines.push("## The ground", "",
    `\`${root}\` · ${head}`);
  const behind = loadedBehind();
  if (behind) lines.push("", behind);
  if (resolve(cwd) !== root) lines.push("", `Rooted in \`${relative(root, resolve(cwd))}\`.`);
  lines.push("");

  // A TABLE, NOT PADDED COLUMNS. This text is rendered as markdown wherever a session actually
  // reads it, and a proportional font throws away every space `padEnd` inserted — so the columns
  // that lined up in a terminal arrive as ragged prose. The pipes survive both surfaces.
  lines.push("### Repositories", "",
    "| Repo | Law | Plugins | Wiring | Holds |",
    "| --- | --- | --- | --- | --- |");
  for (const r of repos) {
    const facts: string[] = [];
    if (r.nodes) facts.push(`${r.nodes} node${r.nodes !== 1 ? "s" : ""}`);
    facts.push(...r.pins);
    lines.push(`| \`${r.name}\` | ${r.world ? claim(r) : "_no claim_"} | ${r.want.join(" ") || "—"} `
      + `| ${r.wired ? "wired" : "**UNWIRED**"} | ${facts.join(" · ") || "—"} |`);
  }
  lines.push("");

  lines.push(...workstreamLines(streams));
  lines.push(...closingLines(root, streams));
  const note = "\n---\nGround, read at load — the members, their law, and every workstream in all " +
    "three states. `open/` is available now, `backlog/` is parked behind a named " +
    "blocker, and `closed/` is the receipt. The number is an identity, never a " +
    `priority. Rung ${level}: ${why}. Say hello with the welcome above, then this ground, ` +
    "then the closing question. Never turn the rung into a menu. The standing offer " +
    "under that question appears only when exactly one workstream is open and no other " +
    "session is live here — so where you cannot see one, do not propose resuming " +
    "anything.\n";
  return [lines.map((line) => line.replace(/\s+$/, "")).join("\n"), note];
}

if (runAlone("orientation.ts")) {
  const stdinMode = process.argv.includes("--stdin");
  let cwd = process.cwd();
  let payload: Payload = {};
  if (stdinMode) {
    payload = readPayload();
    cwd = payload.cwd || cwd;
  } else {
    const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
    if (args.length) cwd = args[0];
  }
  // `SessionStart` runs once, so its whole run is the useful number. `PreToolUse` is the hot path and
  // times per check instead.
  const started = performance.now();
  begin({ event: "SessionStart", tool: null, session: payload.session_id ?? null }, cwd);
  let result: [string, string] | null = null;
  try { result = orient(workspaceRootOf(cwd), cwd); }
  catch (err) {
    if (!stdinMode) console.error(`orientation unavailable: ${err}`);
  }
  record("orientation", performance.now() - started);
  end();
  if (result) {
    const [text, note] = result;
    if (stdinMode)
      // The same ground twice, and the agent's copy carries one line more: `systemMessage` is the
      // developer's pane, `additionalContext` is what the agent reads and acts on.
      console.log(JSON.stringify({ systemMessage: text,
        hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text + note } }));
    else console.log(text + note);
  }
  process.exit(0);
}
