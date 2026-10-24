#!/usr/bin/env node
// RESTATES: plugin-spn-devex/src/refs/devex/workspace/workstream.md S3 — execution is confirmed, never assumed.
// The ref is the source of truth. A rule change is edited there first, then here, in the same change.
//
// WHAT IT CATCHES. A session reads an open workstream, understands the plan, and starts editing a
// repository. Nobody said go. The page still reads as a proposal, the developer still thinks they are
// being shown something, and the first they learn otherwise is a diff. The failure is silent on both
// sides: the agent believes the plan is agreement, and the developer believes the plan is a plan.
//
// WHAT A GO LOOKS LIKE, so this can be checked at all. A go is the write that moves an arc out of
// `PROPOSED`, and it carries the developer's words (RD.DEVEX.WORKSPACE.278):
//
//     workstream row write <arc> --status DECIDED --note "<the developer's words>"
//
// It leaves two marks, and the hook reads both: the arc's status in `arcs/N<nnn>/state.json` reads
// `DECIDED`, `RUNNING` or `LANDED`, and its `log.jsonl` holds the status line that moved it out of
// `PROPOSED`, the words beside the move (`PROPOSED → DECIDED · <their words>`). A status alone is not
// enough, and neither is a move with no words: a plan the agent wrote must not pass as an agreement.
// An arc opened straight at `DECIDED` on the developer's words, as one go opens every step's arc
// (RD.DEVEX.WORKSPACE.280), holds its go in the `opened` line. An arc moved back to `PROPOSED` needs a
// go again, so only the last move out of it counts.
//
// Nothing else counts, because nothing else is written down. A conversation is not a record: the
// window ends and the go ends with it, which is exactly the state this hook exists to make visible.
//
// WHEN IT FIRES. On the first write into a MEMBER REPOSITORY — never on `.spndevex/` itself, because
// writing the plan is how a session earns the go. One workstream open with no go, one warning.
//
// AND IT DOES NOT NAG. A warning repeated on every write is a warning nobody reads, and it would fire
// several times inside one turn. The session is remembered under `.spndevex/.debug/`, the container
// the workspace already keeps for what its machinery says about itself, so a second write is silent.
//
// PORTED FROM `hooks/scripts/confirmed.py`, WHICH HAD NEVER SPOKEN. The Python printed its warning as
// plain text; the dispatcher kept only stdout it could parse as JSON, so every one of its 147 recorded
// fires was discarded. The port returns a verdict rather than printing one, which is why the same
// mistake cannot be made again — there is no round trip to lose it in. Finding F9 in this arc.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { windowWorkstreams } from "../lib/window.ts";
import { arcIdsOf, logLinesOf, moveOf, readArc } from "../lib/workstream.ts";
import type { LogLine } from "../lib/workstream-schema.ts";
import { DEVEX, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, isDir, listdir, readPayload, runAlone, workspaceRoot,
         type Payload, type Verdict } from "../lib/payload.ts";

const DEBUG = ".debug";
const CONFIRMED = "confirmed";

/** The statuses an arc reaches only after a go. */
const PAST_THE_GO: ReadonlySet<string> = new Set(["DECIDED", "RUNNING", "LANDED"]);
const PROPOSED = "PROPOSED";

/** The words a status line carries beside its move: everything after `FROM → TO`, or the whole note where it names none. */
function wordsOf(note: unknown): string {
  const text = typeof note === "string" ? note : "";
  return (moveOf(text) ? text.replace(/^[A-Z][A-Z-]* → [A-Z][A-Z-]*/, "") : text).replace(/^[\s·:—-]+/, "").trim();
}

/** The note `row write` gives an `opened` line when the opening write carries no `--note`. */
const OPENED_BARE = /^opened as ([A-Z][A-Z-]*)$/;

/**
 * The status an arc was opened at, as the commands record it. With no `--note`, the `opened` line says it
 * (`opened as DECIDED`). With one, the note replaces those words, so the status is the `from` of the next
 * status line's move; with no status line after it, the arc never moved and `state.json` still holds it.
 * A next line that names no move says nothing, and the arc is read as opened at `PROPOSED`, as `newArc` opens it.
 */
function openedAt(lines: readonly unknown[], at: number, status: string): string {
  const bare = OPENED_BARE.exec(String((lines[at] as LogLine).note ?? "").trim());
  if (bare) return bare[1];
  const next = lines.slice(at + 1).find((raw) => (raw as LogLine | undefined)?.kind === "status") as LogLine | undefined;
  if (!next) return status;
  return moveOf(next.note)?.from ?? PROPOSED;
}

/**
 * The developer's words of the go an arc's log holds, or null where it holds none. The go is the last move out of
 * `PROPOSED` that carries words: a status line with words beside its move, or an `opened` line whose note carries
 * them on an arc opened past `PROPOSED`, as one go opens every step's arc at `DECIDED` (RD.DEVEX.WORKSPACE.280).
 * The log is read in order, as `statusMoves` reads it; a status line naming no move moves from the status the log
 * last showed, and a move back to `PROPOSED` needs a go again. `release-go` reads a major release's version in
 * these words (RD.DEVEX.WORKSPACE.069), so the two checks read one go.
 */
export function goWordsOf(lines: readonly unknown[], status: string): string | null {
  let shown: string | null = PROPOSED;
  let go: string | null = null;
  lines.forEach((raw, at) => {
    const line = raw as LogLine | undefined;
    if (!line || typeof line !== "object") return;
    if (line.kind === "opened") {
      shown = openedAt(lines, at, status);
      const words = String(line.note ?? "").trim();
      go = shown !== PROPOSED && words.length > 0 && !OPENED_BARE.test(words) ? words : null;
      return;
    }
    if (line.kind !== "status") return;
    const move = moveOf(line.note);
    const from = move?.from ?? shown;
    const to = move?.to ?? null;
    if (from === PROPOSED && to !== PROPOSED) go = wordsOf(line.note) || null;
    if (to === PROPOSED) go = null;
    shown = to;
  });
  return go;
}

/** Whether an arc's log holds the go its status needs: its words, read by `goWordsOf`. */
export function logHoldsGo(lines: readonly unknown[], status: string): boolean {
  return goWordsOf(lines, status) !== null;
}

/**
 * The developer's words of an arc's go, or null where the arc holds none: a status past the go in `state.json`,
 * and the go's line in `log.jsonl`.
 */
export function arcGoWords(status: unknown, lines: readonly unknown[]): string | null {
  return typeof status === "string" && PAST_THE_GO.has(status) ? goWordsOf(lines, status) : null;
}

/** Whether an arc holds the developer's go: a status past it in `state.json`, and the go's line in `log.jsonl`. */
export function arcHoldsGo(status: unknown, lines: readonly unknown[]): boolean {
  return arcGoWords(status, lines) !== null;
}

/** Every folder under `workstreams/open/`, which is the state that means available now. */
function openWorkstreams(root: string): string[] {
  const folder = workstreamsDir(root, "open");
  return listdir(folder).map((name) => join(folder, name)).filter(isDir);
}

/** Whether any arc of this workstream holds the developer's go, read from its `state.json` and `log.jsonl`. */
function hasGo(workstream: string): boolean {
  return arcIdsOf(workstream).some((arc) => arcHoldsGo(readArc(workstream, arc)?.status, logLinesOf(workstream, arc)));
}

/**
 * A write into a member repository, rather than into the working state or the workspace floor.
 *
 * `.spndevex/` is deliberately excluded. Writing the plan is how a session earns a go, so a hook
 * that fired on it would refuse the very act that answers it. The workspace's own `.claude/` is
 * excluded for the same reason: wiring the window is not executing the plan.
 */
function isRepoWrite(root: string, path: string): boolean {
  const within = relative(root, resolve(path));
  if (!within || within.startsWith("..") || isAbsolute(within)) return false;
  const head = within.split("/")[0];
  return head !== "" && head !== "." && head !== DEVEX && head !== ".claude";
}

// The tools whose `file_path` names a file they change.
const FILE_WRITERS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

/** One warning per session, remembered where the workspace keeps its own machinery's state. */
function alreadyWarned(root: string, session: string | undefined): boolean {
  if (!session) return false;
  const marker = join(root, DEVEX, DEBUG, CONFIRMED, session);
  try {
    if (existsSync(marker)) return true;
    mkdirSync(join(root, DEVEX, DEBUG, CONFIRMED), { recursive: true });
    writeFileSync(marker, "warned\n", "utf8");
    return false;
  } catch { return false; }
}

/** Warn once when a repository write happens and no open workstream records a go. */
export function checkConfirmed(payload: Payload): Verdict {
  try {
    const written = payload.tool_input?.file_path;
    if (!written) return null;
    // A `Read` carries a `file_path` too, and reading a repository is not writing to it.
    if (payload.tool_name && !FILE_WRITERS.has(payload.tool_name)) return null;
    const cwd = payload.cwd ?? process.cwd();
    const root = workspaceRoot(cwd);
    if (!root) return null;
    if (!isRepoWrite(root, resolve(cwd, written))) return null;
    // THE GO MUST BE IN A WORKSTREAM THIS WINDOW WORKS ON (RD.DEVEX.WORKSPACE.236). A go in another
    // window's workstream licenses nothing here. A window that works on none has no workstream to
    // name, so it is asked about the workspace as a whole and the note names no workstream.
    const own = new Set(windowWorkstreams(root, payload.session_id));
    const open = openWorkstreams(root);
    const workstreams = own.size ? open.filter((folder) => own.has(basename(folder))) : open;
    if (!workstreams.length) return null;
    if (workstreams.some(hasGo)) return null;
    if (alreadyWarned(root, payload.session_id)) return null;
    const names = own.size ? workstreams.map((w) => basename(w)).join(" · ") : "";
    return {
      note:
        `This is a repository write and ${own.size ? "no workstream of this window records a go — " + names : "no open workstream records a go"}. ` +
        `Execution is confirmed rather than assumed: show the plan, ask, and record the ` +
        `developer's answer as the go — \`workstream row write <arc> --status DECIDED --note "<the developer's words>"\`. ` +
        `An arc holds a go when it reads DECIDED, RUNNING or LANDED and its log holds that line. ` +
        `A go held only in the conversation ends with the window, and the next session cannot tell ` +
        `a plan from an agreement (refs/devex/workspace/workstream.md, S3).`,
    };
  } catch {
    return null;                                    // never fail a gate over a warning
  }
}

if (runAlone("confirmed.ts")) {
  try { emit(checkConfirmed(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
