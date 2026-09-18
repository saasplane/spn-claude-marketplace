#!/usr/bin/env node
// Every PreToolUse check, in one process.
//
// WHY THIS EXISTS. Five hooks matched a single `Edit`, and each one paid an interpreter's start-up
// before it read a byte. Measured 2026-09-08: the chain cost 117.7 ms per edit, and 60 ms of that was
// five interpreters starting. A hundred edits is nearly twelve seconds spent launching processes that
// then agree there is nothing to say. The checks were never the cost; running them apart was.
//
// WHAT IT DOES NOT CHANGE. Each check keeps its own file, its own logic and its own words. This
// imports them and calls them, so a verdict here is the same verdict they gave alone — and a check
// can still be run by hand exactly as before.
//
// HOW A COMBINED VERDICT IS FORMED. The first deny wins and stops the chain, because a refusal is an
// answer and running further checks would only add noise to it. Warnings accumulate: they are advice,
// and two pieces of advice are better than one. Order is cheapest first, so an ordinary edit pays as
// little as possible before something decides.
//
// IT NEVER TAKES THE CHAIN DOWN. A check that throws is skipped, not fatal. A gate that crashes the
// PreToolUse chain removes every other gate with it, which is worse than any single miss.
//
// PORTED FROM `hooks/scripts/pretooluse.py`, AND THE PORT REMOVES A WHOLE CLASS OF FAULT. The Python
// ran each check with a redirected stdout and a swapped `sys.argv`, then parsed the last line of what
// it printed. Anything that did not parse as JSON was discarded as though the check had said nothing
// — which is exactly what happened to `confirmed` on every one of its 147 fires (finding F9), and to
// `env-seat`'s refusal once before that, when only `Exception` was caught and not `SystemExit`.
//
// A check now RETURNS a `Verdict`. There is no round trip for a verdict to be lost in.

import { readFileSync } from "node:fs";
import { emit, readPayload, type Payload, type Verdict } from "./hook.ts";
import { checkEnvSeat } from "./env-seat.ts";
import { checkContractCycle } from "./contract-cycle.ts";
import { checkDoc, bashWrites } from "./doc-check.ts";
import { gateDocumentsFirst, gateClose } from "./split-plan.ts";
import { checkConfirmed } from "./confirmed.ts";
import { applies as mirrorApplies, checkMirror } from "./mirror.ts";
import { begin, end, span } from "./timing.ts";

type Check = {
  name: string;
  run: (payload: Payload) => Verdict;
  /** What this check could possibly have an opinion about, decided from the path or command alone. */
  applies: (path: string, command: string) => boolean;
  /** Which fields it needs. A check reading neither has nothing to read. */
  needs: Array<"command" | "file_path">;
};

const PROSE_SUFFIXES = [".md", ".html"];

// Cheapest first: a path check before a file read, a file read before a workspace walk.
//
// `applies` NO LONGER SAVES AN IMPORT, and it is kept anyway. In Python it decided whether to pay
// ~8 ms loading a module; here every check is imported once when the process starts. What it still
// saves is the check's own work, which is the same saving by a shorter route.
const CHECKS: Check[] = [
  { name: "env-seat", run: checkEnvSeat, needs: ["command", "file_path"], applies: () => true },
  { name: "contract-cycle", run: checkContractCycle, needs: ["file_path"],
    applies: (path, command) => path.includes("/contract/states/") || command.includes("/contract/states/") },
  { name: "doc-check", run: checkDoc, needs: ["command", "file_path"],
    applies: (path, command) => PROSE_SUFFIXES.some((s) => path.endsWith(s) || command.includes(s)) },
  // Its workspace sweep is the point: an answered card must be caught on ANY write. What it cannot
  // matter to is a call that writes nothing at all. Both gates carry their own fast path as well.
  { name: "split-plan.documents-first", run: gateDocumentsFirst, needs: ["command", "file_path"],
    applies: (path, command) => Boolean(path || command) },
  { name: "split-plan.close", run: gateClose, needs: ["command"],
    applies: (path, command) => Boolean(path || command) },
  { name: "confirmed", run: checkConfirmed, needs: ["file_path"], applies: () => true },
  // LAST, BECAUSE IT IS THE ONLY ONE THAT READS A DOCS TREE. Its fast path is a substring of the
  // path, so an edit outside any `src/` pays that and stops; an edit inside one reads a single face.
  { name: "mirror", run: checkMirror, needs: ["file_path"], applies: (path) => mirrorApplies(path) },
];

const REGEN_HINT =
  "This file is generated — hand edits are lost on the next generator run. Edit the source instead " +
  "and regenerate: contract validators come from contract/states/** via 'spnutils apps gen-validators " +
  "-p <pkg>'; package barrels via 'spnutils apps gen-barrel -p <pkg>'; client SDKs regenerate from the " +
  "running service's published API document. Never hand-edit generated output.";

/**
 * Why this path may not be hand-edited, or null.
 *
 * Folded in from `deny-generated-edits.sh` so the dispatcher carries every check rather than most of
 * them. A GUARD LEFT OUT OF A DISPATCHER IS A GUARD REMOVED, and this one refuses edits to files a
 * generator owns — the failure it prevents is silent, because a hand edit survives until the next
 * generation and then vanishes.
 */
export function generatedRefusal(path: string): string | null {
  if (!path) return null;
  if (path.includes("/src/contract/validators/") && path.endsWith(".ts"))
    return `Denied: ${path} is a generated Zod validator (spnutils apps gen-validators). ${REGEN_HINT}`;
  if (path.includes("/dist/generated/"))
    return `Denied: ${path} is generated build output. ${REGEN_HINT}`;
  try {
    const head = readFileSync(path, "utf8").split("\n", 3).join("\n");
    if (head.includes("Generated by spnutils"))
      return `Denied: ${path} declares 'Generated by spnutils' in its header. ${REGEN_HINT}`;
  } catch { /* an unreadable file is not a generated one */ }
  return null;
}

/**
 * Every path this tool call would write — the `file_path` form, and the shell write routes.
 *
 * The routes are parsed by `doc-check`'s `bashWrites`, which is the one place that knows them, so a
 * newly learned route serves this guard too.
 */
function writtenPaths(payload: Payload): string[] {
  const supplied = payload.tool_input ?? {};
  if (supplied.file_path) return [supplied.file_path];
  if (!supplied.command) return [];
  try { return bashWrites(supplied.command).map(([path]) => path); } catch { return []; }
}

export function dispatch(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};

  // The generated-file guard runs first: it is the cheapest refusal there is, and it needs no
  // workspace walk to decide.
  for (const path of writtenPaths(payload)) {
    const reason = generatedRefusal(path);
    if (reason) return { deny: reason };
  }

  const path = supplied.file_path ?? "";
  const command = supplied.command ?? "";
  const notes: string[] = [];
  for (const check of CHECKS) {
    if (!check.applies(path, command)) continue;
    if (!check.needs.some((key) => supplied[key])) continue;
    // Named `module.function` so the two `split-plan` gates are told apart — one sweeps the workspace
    // and one reads a path, and an optimisation needs to know which is costing.
    let verdict: Verdict = null;
    try { verdict = span(check.name, () => check.run(payload)); }
    catch { continue; }                             // a check that throws is skipped, never fatal
    if (!verdict) continue;
    if (verdict.deny) return verdict;               // the first refusal is the answer
    if (verdict.note) notes.push(verdict.note);
  }
  return notes.length ? { note: notes.join("\n\n") } : null;
}

const payload = readPayload();
// MEASURING IS FREE; WRITING IS THE COST. `begin` touches no filesystem, so the loop above always
// times and always reports. What the window decides is whether any of it is ever written down —
// which is the only part anybody pays for.
begin({ event: "PreToolUse", tool: payload.tool_name ?? null, session: payload.session_id ?? null },
      payload.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = dispatch(payload); } catch { verdict = null; }   // never take the chain down
end();
emit(verdict);
process.exit(0);
