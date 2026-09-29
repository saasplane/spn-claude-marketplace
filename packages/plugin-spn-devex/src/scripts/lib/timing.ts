// This file OWNS these rules — the switch, the record shape and the size cap — and restates nothing.
// It carried a `RESTATES:` header naming the Python script it was ported from, and that script is
// gone, so the header pointed at nothing and a reader had no way to tell a moved rule from a typo.
//
// What the TypeScript tools cost, written only while the developer has asked for it. One record
// shape in one log, so `workspace timings` reads a single file. Without this the telemetry goes
// blind at exactly the moment it has to prove the per-write cost fell, which is the arc's own
// acceptance.
//
// Measuring is free; writing is the cost. `begin()` touches no filesystem, so a check that refuses
// early and exits pays nothing. The switch is read at the moment of writing.
//
// EACH LINE SAYS WHICH WORK IT BELONGS TO (RD.DEVEX.WORKSPACE.185). `workstream`, `arc` and `order`
// are read from the paths the tool call touches, and `agent` from the hook input when it carries one,
// so `workspace tokens` joins a transcript to its work by `session` rather than guessing from paths
// afterwards. A call that touches no workstream path carries `null` in all three.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors: a gate that
// refuses to run is infinitely more expensive than a number nobody recorded.

import { appendFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { workstreamPrefixSource } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

const DEVEX = ".spndevex", DEBUG = ".debug", SWITCH = "telemetry.on", FOLDER = "telemetry", LOG = "hooks.jsonl";
const MAX_BYTES = 4 * 1024 * 1024;

type Span = { script: string; ms: number };

const state: { root: string | null; facts: Record<string, unknown>; spans: Span[] } = { root: null, facts: {}, spans: [] };

/** The folder holding `.spndevex`, walked up from where the caller stood — the same walk timing.py does. */
function workspaceRoot(start: string): string | null {
  try {
    let path = resolve(start);
    for (;;) {
      if (existsSync(join(path, DEVEX))) return path;
      const up = dirname(path);
      if (up === path) return null;
      path = up;
    }
  } catch { return null; }
}

/** The work a line belongs to. Every field is `null` where the call named none. */
export type WorkTags = { workstream: string | null; arc: string | null; order: string | null; agent: string | null };

// `.spndevex/workstreams/<state>/<NNN-subject>/` and whatever follows it inside that folder.
const IN_WORKSTREAM = new RegExp(`${workstreamPrefixSource()}(\\d{3}-[A-Za-z0-9-]+)((?:\\/[^\\s'"\`)\\]|;&<>]*)?)`, "g");
// Inside one: `arcs/N<n>…` names the arc, `notes/N<n>/…` names it too, `notes/N<n>/orders/<order>…`
// names the order as well.
const ARC_FILE = /^\/arcs\/(N\d+[a-z]?)(?:[-.]|$)/i;
const ARC_NOTES = /^\/notes\/(N\d+[a-z]?)(?:\/|$)/i;
const ORDER_FILE = /^\/notes\/N\d+[a-z]?\/orders\/([^/]+?)(?:\.md)?(?:\/|$)/i;
// A relative path from inside a workstream folder, as a command run there spells it.
const RELATIVE = /(?:^|[\s'"`=(])((?:arcs\/N\d+[a-z]?[^\s'"`)\]|;&<>]*)|(?:notes\/N\d+[a-z]?(?:\/[^\s'"`)\]|;&<>]*)?))/gi;

function stringsOf(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const one of value) stringsOf(one, out);
  else if (value && typeof value === "object") for (const one of Object.values(value)) stringsOf(one, out);
  return out;
}

function tagsIn(workstream: string, rest: string): Omit<WorkTags, "agent"> {
  const order = rest.match(ORDER_FILE)?.[1] ?? null;
  const arc = rest.match(ARC_FILE)?.[1] ?? rest.match(ARC_NOTES)?.[1] ?? null;
  return { workstream, arc: arc ? arc.toUpperCase() : null, order };
}

const depth = (tags: Omit<WorkTags, "agent">) => (tags.order ? 3 : tags.arc ? 2 : 1);

/**
 * The workstream, arc and order a hook's tool call touches, and the agent that made it.
 *
 * Every string in `tool_input` is read — a file path, a command, an edit — for a path under
 * `.spndevex/workstreams/<state>/<NNN-subject>/`. A relative `arcs/N<n>…` or `notes/N<n>/…` counts
 * only when the call's `cwd` is itself inside a workstream folder, because only then does it name one.
 * Where one call touches several, the most specific wins (an order over an arc over a bare
 * workstream), and the first of those. Never throws.
 */
export function tagsOf(payload: { tool_input?: unknown; cwd?: string; agent_id?: unknown } | null | undefined): WorkTags {
  const none: WorkTags = { workstream: null, arc: null, order: null, agent: null };
  try {
    if (!payload) return none;
    const agent = typeof payload.agent_id === "string" && payload.agent_id ? payload.agent_id : null;
    let best: Omit<WorkTags, "agent"> | null = null;
    const consider = (found: Omit<WorkTags, "agent">) => { if (!best || depth(found) > depth(best)) best = found; };
    const strings = stringsOf(payload.tool_input);
    for (const text of strings)
      for (const m of text.matchAll(IN_WORKSTREAM)) consider(tagsIn(m[1], m[2] ?? ""));
    const here = typeof payload.cwd === "string" ? [...payload.cwd.matchAll(IN_WORKSTREAM)][0] : undefined;
    if (here) {
      const base = here[2] ?? "";
      for (const text of strings)
        for (const m of text.matchAll(RELATIVE)) consider(tagsIn(here[1], `${base.replace(/\/+$/, "")}/${m[1]}`));
    }
    const found = best as Omit<WorkTags, "agent"> | null;
    return found ? { ...found, agent } : { ...none, agent };
  } catch { return none; }
}

/** Arm the recorder. Touches no filesystem beyond the walk, and never throws. */
export function begin(facts: Record<string, unknown> = {}, start?: string): void {
  try {
    state.root = workspaceRoot(start ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
    state.facts = facts;
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}

/** Time one call and hand the span over. Two clock reads are nanoseconds. */
export function span<T>(script: string, fn: () => T): T {
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    try { state.spans.push({ script, ms: Math.round((performance.now() - t0) * 100) / 100 }); } catch { /* ignore */ }
  }
}

export function record(script: string, ms: number): void {
  try { state.spans.push({ script, ms: Math.round(ms * 100) / 100 }); } catch { /* ignore */ }
}

/** Write what was measured, if and only if the switch is present. */
export function end(): void {
  try {
    const root = state.root;
    if (!root || !state.spans.length) return;
    // A test run launches hooks inside the real workspace, and its records would read as the developer's.
    if (process.env.SPN_TELEMETRY === "off") return;
    const debug = join(root, DEVEX, DEBUG);
    if (!existsSync(join(debug, SWITCH))) return;      // off by default, and reading it is the only cost

    const dir = join(debug, FOLDER);
    mkdirSync(dir, { recursive: true });
    const log = join(dir, LOG);
    // A log nobody prunes becomes a cost of its own. Rewritten from empty past the cap.
    try { if (existsSync(log) && statSync(log).size > MAX_BYTES) writeFileSync(log, ""); } catch { /* ignore */ }

    const at = new Date().toISOString().slice(0, 19);
    // The whole process, Node start to here. Startup, TypeScript loading and the imports are most of
    // a hook's cost, and no span inside a check can see them.
    const spans = [...state.spans, { script: "process", ms: Math.round(performance.now() * 100) / 100 }];
    const lines = spans.map((s) => JSON.stringify({
      script: s.script, ms: s.ms,
      event: state.facts.event ?? null, tool: state.facts.tool ?? null,
      session: state.facts.session ?? null, at, pid: process.pid,
      workstream: state.facts.workstream ?? null, arc: state.facts.arc ?? null,
      order: state.facts.order ?? null, agent: state.facts.agent ?? null,
    }));
    appendFileSync(log, lines.join("\n") + "\n");
    state.spans = [];
  } catch { /* a tool never fails because timing failed */ }
}

/** Convenience for a one-shot tool: time the whole run under one name. */
export function around<T>(script: string, facts: Record<string, unknown>, fn: () => T): T {
  begin(facts);
  try { return span(script, fn); } finally { end(); }
}
