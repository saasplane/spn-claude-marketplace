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

import { readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { emit, readPayload, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { recordWrites } from "../lib/window.ts";
import { checkEnvSeat } from "../checks/env-seat.ts";
import { checkDoc, bashWrites } from "../checks/doc-check.ts";
import { gateDocumentsFirst, gateClose, moves } from "../checks/split-plan.ts";
import { checkConfirmed } from "../checks/confirmed.ts";
import { checkReleaseGo, applies as releaseApplies } from "../checks/release-go.ts";
import { checkArcStatus, applies as arcStatusApplies } from "../checks/arc-status.ts";
import { applies as commentsApply, checkComments } from "../checks/comment-check.ts";
import { applies as mirrorApplies, checkMirror } from "../checks/mirror.ts";
import { PUBLISHER, checkPublish } from "../checks/publish.ts";
import { applies as testRunApplies, checkTestRun } from "../checks/test-run.ts";
import { applies as longRunApplies, checkLongRun } from "../checks/long-run.ts";
import { begin, end, span, tagsOf, type SpanName } from "../../../../plugin-support-lib/src/lib/timing.ts";
import { startCommand } from "../lib/bash-timing.ts";

type Check = {
  /** The check file, and the check inside it: `split-plan` › `close`. A file with one check names it twice. */
  name: SpanName;
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
  { name: { group: "env-seat", action: "env-seat" }, run: checkEnvSeat, needs: ["command", "file_path"], applies: () => true },
  // A refusal, so it runs before the checks that only advise. Its fast path is one pattern over the
  // path or the command, so a call that names no `src` and no `tests` pays that and stops. A call
  // that names one lists the start files, a folder that is absent or empty unless a timed command runs.
  { name: { group: "test-run", action: "test-run" }, run: checkTestRun, needs: ["command", "file_path"],
    applies: (path, command) => testRunApplies(path, command) },
  // A `note`, never a `deny`, so its cost is one regular expression over the command — cheaper than
  // any refusal above it, and it still runs this early because a Bash call pays no other check here.
  { name: { group: "long-run", action: "long-run" }, run: checkLongRun, needs: ["command"],
    applies: (path, command) => longRunApplies(path, command) },
  { name: { group: "doc-check", action: "doc-check" }, run: checkDoc, needs: ["command", "file_path"],
    applies: (path, command) => PROSE_SUFFIXES.some((s) => path.endsWith(s) || command.includes(s)) },
  // Its workspace sweep is the point: an answered card must be caught on ANY write. What it cannot
  // matter to is a call that writes nothing at all. Both gates carry their own fast path as well.
  { name: { group: "split-plan", action: "documents-first" }, run: gateDocumentsFirst, needs: ["command", "file_path"],
    applies: (path, command) => Boolean(path || command) },
  { name: { group: "split-plan", action: "close" }, run: gateClose, needs: ["command"],
    applies: (path, command) => Boolean(path || command) },
  { name: { group: "confirmed", action: "confirmed" }, run: checkConfirmed, needs: ["file_path"], applies: () => true },
  // BEFORE the workspace walks below it, because a release is the one call in this list that cannot
  // be taken back. Its fast path is a regular expression over the command, so every edit pays that
  // and stops.
  { name: { group: "release-go", action: "release-go" }, run: checkReleaseGo, needs: ["command"],
    applies: (path, command) => releaseApplies(path, command) },
  // It reads the fragment it was handed and opens no file, so its whole cost is the path test above
  // it and a pass over the text being written.
  // Its fast path is one regular expression over the path, so every write outside an `arcs/` folder
  // pays that and stops.
  { name: { group: "arc-status", action: "arc-status" }, run: checkArcStatus, needs: ["command", "file_path"],
    applies: (path, command) => arcStatusApplies(path, command) },
  { name: { group: "comment-check", action: "comment-check" }, run: checkComments, needs: ["file_path"], applies: (path) => commentsApply(path) },
  // LAST, BECAUSE IT IS THE ONLY ONE THAT READS A DOCS TREE. Its fast path is a substring of the
  // path, so an edit outside any `src/` pays that and stops; an edit inside one reads a single face.
  { name: { group: "mirror", action: "mirror" }, run: checkMirror, needs: ["file_path"], applies: (path) => mirrorApplies(path) },
];

const REGEN_HINT =
  "This file is generated — hand edits are lost on the next generator run. Edit the source instead " +
  "and regenerate: contract validators come from contract/states/** via 'spnutils apps gen-validators " +
  "<package>'; package barrels via 'spnutils apps gen-barrel <package>'; client SDKs regenerate from the " +
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
  // THE ROUTE LOCK IS WRITTEN FROM THE ROUTERS, like a barrel from its exports. A hand edit here is
  // the one that matters most: the lock exists so a deleted route cannot delete its own obligation,
  // and typing a row by hand is exactly how somebody makes a missing screen look accounted for.
  if (path.endsWith("/tests/.routes.lock.json"))
    return `Denied: ${path} is the generated route lock (spnutils apps gen-routes). ` +
      `Run the command and read the diff — every removed line is a screen that stopped existing. ${REGEN_HINT}`;
  try {
    const head = readFileSync(path, "utf8").split("\n", 3).join("\n");
    if (head.includes("Generated by spnutils"))
      return `Denied: ${path} declares 'Generated by spnutils' in its header. ${REGEN_HINT}`;
  } catch { /* an unreadable file is not a generated one */ }
  return null;
}

// The two lines that open and close the block `spnutils` writes. Their source is `MANAGED_BLOCK` in
// `spn-support-ts`, `apps/utility-ts/src/app/support/workspace/managed-keys.ts`. A plugin imports
// nothing from `spnutils`, so a change there is made here too.
const AGENT_BLOCK_BEGIN = "<!-- spnutils:agent:begin -->";
const AGENT_BLOCK_END = "<!-- spnutils:agent:end -->";

/**
 * Where the block `spnutils` writes sits in a text, from the start of its begin marker to the end of
 * its end marker, or null where the text holds none. A marker counts only as a whole line, so a file
 * that quotes one inside a line holds no block.
 */
function agentBlock(text: string): { from: number; to: number } | null {
  let offset = 0;
  let from = -1;
  for (const line of text.split("\n")) {
    const whole = line.replace(/\s+$/, "");
    if (from < 0 && whole === AGENT_BLOCK_BEGIN) from = offset;
    else if (from >= 0 && whole === AGENT_BLOCK_END) return { from, to: offset + line.length };
    offset += line.length + 1;
  }
  return null;
}

/**
 * Why this `Edit` or `Write` may not be made, or null. The text between the `spnutils:agent` markers
 * is written by a command, so a hand edit there is lost at the next sync. An `Edit` is refused where
 * the text it replaces reaches into the block, and a `Write` where it leaves the block different
 * from the one on disk. A Bash command is not judged: the command that writes the block is one.
 */
export function agentBlockRefusal(payload: Payload): string | null {
  const supplied = payload.tool_input ?? {};
  if (!supplied.file_path || (supplied.content === undefined && !supplied.old_string)) return null;
  const path = resolve(payload.cwd ?? process.cwd(), supplied.file_path);
  let current: string;
  try { current = readFileSync(path, "utf8"); } catch { return null; }   // a file not on disk holds no block
  const block = agentBlock(current);
  if (!block) return null;

  let touched = false;
  if (supplied.content !== undefined) {
    const written = agentBlock(supplied.content);
    touched = !written || supplied.content.slice(written.from, written.to) !== current.slice(block.from, block.to);
  } else {
    const replaced = supplied.old_string!;
    for (let at = current.indexOf(replaced); at >= 0 && !touched; at = current.indexOf(replaced, at + 1)) {
      touched = at < block.to && at + replaced.length > block.from;
      if (!supplied.replace_all) break;
    }
  }
  if (!touched) return null;
  return `Denied: ${path} holds a block that \`spnutils\` writes, between \`${AGENT_BLOCK_BEGIN}\` and ` +
    `\`${AGENT_BLOCK_END}\`, and this ${supplied.content !== undefined ? "write" : "edit"} changes it. A hand ` +
    `edit there is lost at the next sync. Run \`spnutils workspace agent-sync\` for the workspace's files, or ` +
    `\`spnutils repo agent-sync\` for a repository's, and change what the block is written from. The text ` +
    `below the end marker is yours to edit.`;
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

// A folder made, or a folder moved into a state, is a write that opens a workstream, but `bashWrites`
// reads redirects, `tee`, `sed -i` and copies, and a `mkdir` is none of them.
// The tools whose `file_path` names a file they change.
const FILE_WRITERS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

const MKDIR = /(?:^|[;&|\n])\s*mkdir\s+((?:-\S+\s+)*)([^;&|\n]+)/g;

/** The folders a command makes. */
function madeFolders(command: string): string[] {
  const out: string[] = [];
  for (const found of command.matchAll(MKDIR))
    for (const word of found[2].trim().split(/\s+/)) if (!word.startsWith("-")) out.push(word.replace(/^['"]|['"]$/g, ""));
  return out;
}

/** Where a move lands: the destination, or the destination holding the source's name where it is a folder. */
function landings(command: string, cwd: string): string[] {
  const out: string[] = [];
  for (const [source, destination] of moves(command)) {
    out.push(destination);
    try { if (statSync(resolve(cwd, destination)).isDirectory()) out.push(`${destination.replace(/\/+$/, "")}/${basename(source)}`); } catch { /* not there yet */ }
  }
  return out;
}

/**
 * EVERY PATH A CALL PUTS A WRITE INSIDE, for the one question of which workstream a window works on:
 * the paths a call writes, the folders it makes and the places a move lands. Never text inside a write.
 */
export function bindingPaths(payload: Payload): string[] {
  const supplied = payload.tool_input ?? {};
  const cwd = payload.cwd ?? process.cwd();
  // A `Read` carries a `file_path` too, and reading a file binds nothing.
  const writes = !payload.tool_name || FILE_WRITERS.has(payload.tool_name) || payload.tool_name === "Bash";
  const paths = writes ? writtenPaths(payload) : [];
  if (writes && supplied.command) {
    try { paths.push(...madeFolders(supplied.command), ...landings(supplied.command, cwd)); } catch { /* the binding is best effort */ }
  }
  const notebook = (supplied as { notebook_path?: string }).notebook_path;
  if (notebook && writes) paths.push(notebook);
  return paths;
}

export function dispatch(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};

  // A PUBLISH WRITES NO FILE HERE, so no other check has anything to read in it. It gets the one
  // reminder (RD.DEVEX.WORKSPACE.117), and a refusal where the page it names loads its styles from
  // outside (RD.DEVEX.WORKSPACE.215). The refusal leaves here as any other check's does.
  if (payload.tool_name === PUBLISHER) {
    try { return span({ group: "publish", action: "publish" }, () => checkPublish(payload)); } catch { return null; }
  }

  // The generated-file guard runs first: it is the cheapest refusal there is, and it needs no
  // workspace walk to decide.
  for (const path of writtenPaths(payload)) {
    const reason = generatedRefusal(path);
    if (reason) return { deny: reason };
  }
  // The block `spnutils` writes is refused beside it: the same kind of text, inside a file that also
  // holds a person's own.
  let blocked: string | null = null;
  try { blocked = agentBlockRefusal(payload); } catch { blocked = null; }
  if (blocked) return { deny: blocked };

  // THE WINDOW'S BINDING IS WRITTEN HERE, from the paths this call writes (RD.DEVEX.WORKSPACE.236), and
  // before the checks read it: the first write into a workstream makes it this window's. A child's call
  // carries its window's session id, so its writes bind the window that dispatched it.
  try {
    const cwd = payload.cwd ?? process.cwd();
    const root = workspaceRoot(cwd);
    if (root && payload.session_id) recordWrites(root, payload.session_id, cwd, bindingPaths(payload));
  } catch { /* a binding that cannot be written is a window that hears less */ }

  const path = supplied.file_path ?? "";
  const command = supplied.command ?? "";
  const notes: string[] = [];
  for (const check of CHECKS) {
    if (!check.applies(path, command)) continue;
    if (!check.needs.some((key) => supplied[key])) continue;
    // Named file › check so the two `split-plan` gates are told apart — one sweeps the workspace and
    // one reads a path, and an optimisation needs to know which is costing.
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
begin({ script: "spn-devex", event: "PreToolUse", tool: payload.tool_name ?? null, session: payload.session_id ?? null,
        ...tagsOf(payload), process: { group: "events", action: "pretooluse" } },
      payload.cwd ?? process.cwd());
let verdict: Verdict = null;
try { verdict = dispatch(payload); } catch { verdict = null; }   // never take the chain down
// A BASH COMMAND THIS HOOK LETS THROUGH IS TIMED: the start file its `PostToolUse` pairs with. A
// refused call never runs, so it gets none.
if (!verdict?.deny) startCommand(payload);
end();
emit(verdict);
process.exit(0);
