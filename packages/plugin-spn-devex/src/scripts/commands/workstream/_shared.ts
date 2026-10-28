// What every `workstream` command shares: a reference read as a usage fault where it names nothing,
// a list option read from its words, and what runs after every write — the progress block refreshed,
// each preview's status written from its arc, and the workstream's own `state check`, printed as
// lines the agent reads.

import { basename } from "node:path";
import { UsageFault, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { checkWorkstream } from "../../checks/workstream-state.ts";
import { refreshViews } from "../docs/cycles.ts";
import { arcIdsOf, arcStatus, findWorkstream, readArc, resolveArc, stateOfRow, workspaceOf, writePreviewStatus, writeProgress } from "../../lib/workstream.ts";

/** A library call whose plain error is a fault in what was typed. */
export function typed<T>(read: () => T): T {
  try { return read(); } catch (thrown) {
    if (thrown instanceof Error && thrown.name !== "UsageFault") throw new UsageFault(`${thrown.message}.`);
    throw thrown;
  }
}

export const arcNamed = (ref: string | undefined, allowNew = false): { ws: string; arc: string } => {
  if (!ref) throw new UsageFault("needs an arc, as `N<nnn>` or `<workstream>/N<nnn>`.");
  return typed(() => resolveArc(ref, process.cwd(), allowNew));
};

export function workstreamNamed(ref: string | undefined): string {
  if (!ref) throw new UsageFault("needs a workstream: its number, its folder name or its folder.");
  const ws = findWorkstream(ref, workspaceOf(), process.cwd());
  if (!ws) throw new UsageFault(`finds no workstream \`${ref}\`. Name its number or its folder, as \`spnutils workspace status\` lists it.`);
  return ws;
}

/** A list option: every value typed, each split at commas, with `none` for the empty list. */
export function listOf(words: Words, name: string): string[] | null {
  if (!words.given(name)) return null;
  const items = words.values(name).flatMap((value) => value.split(",")).map((item) => item.trim()).filter(Boolean);
  return items.length === 1 && items[0] === "none" ? [] : items;
}

/** After a write: the progress block refreshed, each preview's status written, and the workstream's check, each finding on a line. */
export function afterWrite(ws: string): string[] {
  const lines: string[] = [];
  const progress = writeProgress(ws);
  if (!/^progress (?:current|written)$/.test(progress)) lines.push(`! ${progress}`);
  writePreviewStatus(ws);
  for (const finding of checkWorkstream(ws))
    lines.push(`! state check · ${basename(ws)}${finding.arc ? ` ${finding.arc}` : ""} · ${finding.message}`);
  return lines;
}

/** Where each arc stands: its status, and the state of each row by id. Taken before a write, to see what it moved. */
export function arcSignatures(ws: string): Map<string, { status: string; rows: Map<string, string> }> {
  const out = new Map<string, { status: string; rows: Map<string, string> }>();
  for (const arc of arcIdsOf(ws)) {
    const data = readArc(ws, arc);
    // The status as read, worked out from the steps, with any wait: a write that moves either moves a view.
    if (data) out.set(arc, { status: `${arcStatus(data)}${data.wait ? " · wait" : ""}`, rows: new Map(data.rows.map((row) => [row.id, stateOfRow(data.rows, row)])) });
  }
  return out;
}

/**
 * RD.DEVEX.WORKSPACE.273: when a write moved the status of an arc, or the state of a row it already had,
 * every view of it is refreshed in the same command, across all the workstream's arcs. An arc just
 * opened or a row just added moves no status, so `docs cycles write` and the stamp still bring them in.
 * `alsoRefresh` is a write that moved a view by another field, as an arc's `--preview` does.
 * `said` names each view rewritten, for the command's one line; `lines` carries a part that could not be written.
 */
export function refreshIfMoved(ws: string, before: ReturnType<typeof arcSignatures>, alsoRefresh = false): { said: string[]; lines: string[] } {
  const after = arcSignatures(ws);
  const moved = [...before].some(([arc, was]) => {
    const now = after.get(arc);
    return !!now && (now.status !== was.status || [...was.rows].some(([id, state]) => now.rows.has(id) && now.rows.get(id) !== state));
  });
  if (!moved && !alsoRefresh) return { said: [], lines: [] };
  const { views, skipped } = refreshViews(ws);
  return { said: views, lines: skipped.map((reason) => `! ${reason}`) };
}

/** The options that describe a row, and no arc: `arc edit` refuses them and names `row edit`. */
export const ROW_FLAGS = ["parent", "kind", "repo", "altitude", "mechanism", "acceptance", "blocked-by", "touches", "decisions", "facts", "state", "proof", "order"];
/** The options that describe an arc's header, and no row: `row add` and `row edit` refuse them and name `arc edit`. */
export const ARC_FLAGS = ["under", "subject", "goal", "status", "reason", "wait", "start", "review-fixes", "decides", "repos", "cycle", "follows", "preview"];

/**
 * Throws, before the words are read, where one of `names` was typed as an option: the option belongs to another command,
 * and the refusal says which. `say` completes the sentence that opens with the command's words.
 */
export function refuseFlags(args: string[], names: readonly string[], say: (name: string) => string): void {
  for (const word of args) {
    if (!word.startsWith("--")) continue;
    const name = word.slice(2).split("=")[0];
    if (names.includes(name)) throw new UsageFault(say(name));
  }
}
