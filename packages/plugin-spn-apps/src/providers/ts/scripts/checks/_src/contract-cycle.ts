#!/usr/bin/env node
// RESTATES: the layer promise, and decisions RD.DEVEX.FUNCTION.035 · RD.DEVEX.WORKSPACE.024. The rule itself lives once,
// in the CLI's `contract-purity.ts`; a change is made there first, then here, in the same change.
//
// **IT IS A RULE OF THE `src` SUBJECT, IN THE TYPESCRIPT PROVIDER, AND NOT OF THE STACK-AGNOSTIC
// PLUGIN.** Everything it matches is this stack's: `src/contract/states`, a `.ts` extension, and
// `core.ts` as the named release valve. Filed under `spn-devex` it ran in every repository the
// agent opens, including ones with no contract states at all — free only because the path never
// matched, which is luck rather than design (RD.DEVEX.AGENT.066).
//
// Refuse a contract-state write that would close a dependency cycle.
//
// The rule: a contract state never closes a dependency cycle. A state importing a sibling one-way is
// correct — `role.ts` citing `AppPermissionMeta` from `app.ts` is right, and `app.ts` is that type's
// home. What cannot be supported is a bidirectional dependency: the generated validators import in
// the same shape as the states, so a loop resolves to `undefined` at boot rather than failing at
// build. The application starts, which is the worst way to fail.
//
// `core.ts` is the release valve for exactly that, and nothing else. A seat that has never hit a
// cycle correctly has no `core.ts` at all.
//
// WHY A HOOK AND NOT `apps validate` ALONE (RD.DEVEX.FUNCTION.035): the failure lands at boot, so a check that
// runs at review time runs after the damage. This reads the same graph at write time so the loop
// never reaches disk.
//
// It reads the SEAT, not the single file — a cycle is a property of the folder. The file being
// written is overlaid on what is on disk, so the graph checked is the one the write would produce.
//
//   hook :  node contract-cycle.ts          (PreToolUse JSON on stdin; denies with the loop named)
//   scan :  node contract-cycle.ts <path> …  (any folder or repo; prints every cycle it finds)
//
// PORTED FROM `hooks/scripts/contract-cycle.py`, WHICH HAD NEVER FIRED. The hook audit found it
// dispatched and never once triggered across 17 sessions — which is what a correct guard on a rule
// nobody broke looks like, and also what a broken guard looks like. The port is where it is finally
// run against a known cycle rather than trusted.

import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { emit, payload as readPayload, runAlone, type Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { read } from "../../../../../scripts/lib/source.ts";

const STATES_DIR = "src/contract/states";
const SIBLING = /from\s+'\.\/([\w-]+)'/g;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT = /\/\/[^\n]*/g;
const SKIP = new Set(["node_modules", "dist", ".git", ".nx"]);

const slashes = (path: string) => path.split(sep).join("/");

/** Sibling state files this source imports — comments stripped, self never counted. */
function siblings(source: string, seat: string, stem: string): string[] {
  const body = source.replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "");
  const found = new Set<string>();
  for (const match of body.matchAll(SIBLING)) {
    const name = match[1];
    if (name === stem) continue;
    try { if (statSync(join(seat, `${name}.ts`)).isFile()) found.add(name); } catch { /* not a sibling */ }
  }
  return [...found].sort();
}

/** The seat's import graph, with the pending write overlaid on what is on disk. */
export function graphFor(seat: string, overlayStem?: string, overlaySource?: string): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  let entries: string[] = [];
  try { entries = readdirSync(seat).sort(); } catch { return graph; }
  for (const entry of entries) {
    if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) continue;
    const stem = entry.slice(0, -3);
    if (stem === overlayStem) continue;
    graph[stem] = siblings(read(join(seat, entry)), seat, stem);
  }
  if (overlayStem !== undefined) graph[overlayStem] = siblings(overlaySource ?? "", seat, overlayStem);
  return graph;
}

/** Every distinct loop, each named as the path a reader follows to see it. */
export function cycles(graph: Record<string, string[]>): string[][] {
  const state: Record<string, number> = {};
  const out: string[][] = [];
  const seen = new Set<string>();

  function walk(node: string, trail: string[]): void {
    state[node] = 1;
    for (const next of graph[node] ?? []) {
      if (state[next] === 1) {
        const loop = [...trail.slice(trail.indexOf(next)), next];
        const key = [...new Set(loop)].sort().join("|");
        if (!seen.has(key)) { seen.add(key); out.push(loop); }
      } else if (!(next in state)) {
        walk(next, [...trail, next]);
      }
    }
    state[node] = 2;
  }

  for (const node of Object.keys(graph).sort()) if (!(node in state)) walk(node, [node]);
  return out;
}

/** The states seat a path sits in, or null — the hook only ever speaks about that folder. */
export function seatOf(path: string): string | null {
  const parent = dirname(resolve(path));
  return slashes(parent).endsWith(STATES_DIR) ? parent : null;
}

/** This rule reads a contract-state seat. `seatOf` answers null for anything else. */
export const watched = (path: string): boolean => path.endsWith(".ts") && seatOf(path) !== null;

/**
 * Refuse the write that would close the loop.
 *
 * **THE TEXT ARRIVES ASSEMBLED.** The subject reads and masks it once per write, so this rule never
 * touches the disk for a file the caller already holds — which is what the subject exists for.
 */
export function verdict(path: string, source: string | null, _added: string | null): Verdict {
  if (source === null) return null;
  const seat = seatOf(path);
  if (seat === null) return null;
  try { if (!statSync(seat).isDirectory()) return null; } catch { return null; }

  const stem = basename(path).slice(0, -3);
  const found = cycles(graphFor(seat, stem, source));
  if (!found.length) return null;
  const loops = found.map((loop) => loop.join(" -> ")).join(" · ");
  return {
    deny:
      `Contract-state dependency cycle: ${loops}\n` +
      `  The generated validators import in this shape too, so the loop resolves to undefined ` +
      `at boot rather than failing at build — the application starts.\n` +
      `  A one-way sibling import is fine and a type belongs in its own domain file. Move only ` +
      `the state that CLOSES the loop into core.ts, which exists to open exactly this.\n` +
      `  (layer promise; decisions RD.DEVEX.FUNCTION.035 · RD.DEVEX.WORKSPACE.024)`,
  };
}

/** Every states seat under these roots, reported with the loops it holds. */
function scan(roots: string[]): number {
  let total = 0;
  const walk = (base: string): void => {
    let entries: string[] = [];
    try { entries = readdirSync(base); } catch { return; }
    if (slashes(resolve(base)).endsWith(STATES_DIR)) {
      for (const loop of cycles(graphFor(base))) {
        total += 1;
        console.log(`${base}: ${loop.join(" -> ")}`);
      }
    }
    for (const entry of entries.sort()) {
      if (SKIP.has(entry)) continue;
      const next = join(base, entry);
      try { if (statSync(next).isDirectory()) walk(next); } catch { /* unreadable */ }
    }
  };
  for (const root of roots) walk(root);
  console.log(`\n${total} contract-state cycle(s)`);
  return total ? 1 : 0;
}

if (runAlone("contract-cycle.ts")) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (args.length) {
    process.exit(scan(args));
  } else {
    // STANDALONE, THE RULE ASSEMBLES ITS OWN TEXT, because no subject ran ahead of it. Under the
    // hook the subject does this once for every rule it carries.
    try {
      const event = await readPayload();
      const supplied = event?.tool_input ?? {};
      const path = supplied.file_path ?? "";
      let source = supplied.content;
      if (source === undefined) {
        const fragment = supplied.new_string;
        source = fragment === undefined ? undefined : `${read(resolve(path)) ?? ""}\n${fragment}`.trim();
      }
      emit(watched(path) && source !== undefined ? verdict(path, source, null) : null);
    } catch { /* never take the chain down */ }
    process.exit(0);
  }
}
