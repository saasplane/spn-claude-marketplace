// What this plugin's checks cost, written only while the developer has asked for it.
//
// A PLUGIN CARRIES ITS OWN LIBRARIES. This is a copy of `spn-core/hooks/lib/timing.ts` and is meant
// to be one: a partner may hold either plugin without the other, plugins version and install
// separately, and the installed cache puts a version directory between a plugin and its files. The
// same reasoning already gives this plugin its own `payload.ts`. The switch, the record shape and
// the size cap are stated in both copies on purpose — both write the one log `workspace timings`
// reads, so the shapes must agree, and a reader who has learned one plugin has learned both.
//
// Measuring is free; writing is the cost. `begin()` touches no filesystem, so a check that refuses
// early and exits pays nothing. The switch is read at the moment of writing.
//
// A TOOL MUST NEVER FAIL BECAUSE TIMING FAILED. Every path here swallows its own errors: a gate that
// refuses to run is infinitely more expensive than a number nobody recorded.

import { appendFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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
    const debug = join(root, DEVEX, DEBUG);
    if (!existsSync(join(debug, SWITCH))) return;      // off by default, and reading it is the only cost

    const dir = join(debug, FOLDER);
    mkdirSync(dir, { recursive: true });
    const log = join(dir, LOG);
    // A log nobody prunes becomes a cost of its own. Rewritten from empty past the cap.
    try { if (existsSync(log) && statSync(log).size > MAX_BYTES) writeFileSync(log, ""); } catch { /* ignore */ }

    const at = new Date().toISOString().slice(0, 19);
    const lines = state.spans.map((s) => JSON.stringify({
      script: s.script, ms: s.ms,
      event: state.facts.event ?? null, tool: state.facts.tool ?? null,
      session: state.facts.session ?? null, at, pid: process.pid,
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
