// How a handover's `continue:` line names the workstream and the arc the next window starts on
// (RULE.DEVEX.WORKSPACE.394, RULE.DEVEX.WORKSPACE.236). The prompt hook binds the window by it and the
// stop hook sends back a block that cannot bind, so both read one set of patterns, kept here because
// `events/prompt.ts` already imports `events/stop.ts`.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { WORKSTREAM_STATES, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { isDir } from "./payload.ts";
import { ARC_ID } from "./workstream-schema.ts";

/** A workstream folder's name, as a text writes it: three digits, a hyphen and the subject. */
export const WORKSTREAM_NAME = /\b\d{3}-[a-z0-9][a-z0-9-]*/;

/** An arc's address as a pattern part, read from `ARC_ID`: `N<nnn>`, `ideate` or `follow-ups`. */
export const ARC_PART = ARC_ID.source.slice(1, -1);

/** An arc named right after a workstream: `, N001`, `/ideate`, ` · follow-ups` or ` N001`. */
export const ARC_AFTER = new RegExp(`^\\s*(?:[,/·]\\s*|\\s)?${ARC_PART}(?![\\w-])`);

/**
 * What may stand before the workstream a `continue:` line opens with: the template's `workstream` word and its marks, and
 * the reload form's `open`.
 */
const CONTINUE_OPENING = /^\s*(?:open\s+)?(?:workstreams?\s*)?[`*]*$/i;

/** The arc right after the opening workstream as the template writes it: its marks, then `, arc` or `/`, then the arc. */
const CONTINUE_ARC = new RegExp(`^[\`*]*\\s*(?:[,/·]\\s*|\\s)?(?:arc\\s*)?[\`*]*(${ARC_PART})(?![\\w-])`, "i");

/** The folder of the workstream with this name, in whichever state holds it, or null where none does. */
export function workstreamFolder(root: string, name: string): string | null {
  for (const state of WORKSTREAM_STATES) {
    const folder = join(workstreamsDir(root, state), name);
    if (isDir(folder)) return folder;
  }
  return null;
}

/** The one folder whose name begins `NNN-`, in whichever state holds it, or null where none or several do. */
export function workstreamOfNumber(root: string, number: string): string | null {
  const found = new Set<string>();
  for (const state of WORKSTREAM_STATES) {
    let entries: string[];
    try { entries = readdirSync(workstreamsDir(root, state)); } catch { continue; }
    for (const entry of entries) if (entry.startsWith(`${number}-`) && isDir(join(workstreamsDir(root, state), entry))) found.add(entry);
  }
  return found.size === 1 ? [...found][0] : null;
}

/**
 * The workstreams a `continue:` line names, in the order it names them, each with where it stands in
 * the line: by its folder's name, or by a standalone three-digit number. `name` is null where the
 * folder or the number matches no folder.
 */
export function workstreamsOfLine(line: string, root: string): Array<{ name: string | null; index: number; end: number; whole: boolean }> {
  const either = new RegExp(`${WORKSTREAM_NAME.source}|\\b\\d{3}\\b(?!-)`, "g");
  return [...line.matchAll(either)].map((found) => ({
    name: found[0].length > 3 ? (workstreamFolder(root, found[0]) ? found[0] : null) : workstreamOfNumber(root, found[0]),
    index: found.index ?? 0,
    end: (found.index ?? 0) + found[0].length,
    whole: found[0].length > 3,
  }));
}

/** Whether a `continue:` line opens with the first workstream it names: nothing but the template's word stands before it. */
export function opensWithWorkstream(line: string, root: string): boolean {
  const first = workstreamsOfLine(line, root)[0];
  return first !== undefined && first.name !== null && CONTINUE_OPENING.test(line.slice(0, first.index));
}

/**
 * Why a handover's `continue:` line cannot start the next window, or null when it can: it opens with a workstream, by
 * its folder's name or its number, and names one of its arcs right after it. The reload form, which names the
 * workstream to open next and no arc, needs only the workstream. The line is judged by its form; whether the folder
 * exists is the prompt hook's to find when the next window opens.
 */
export function continueRefusal(next: string): string | null {
  const first = new RegExp(`${WORKSTREAM_NAME.source}|\\b\\d{3}\\b(?!-)`).exec(next);
  if (first === null || !CONTINUE_OPENING.test(next.slice(0, first.index))) {
    return "it does not open with a workstream, so the next window is bound to whichever workstream the line names first";
  }
  if (/\breload\b|^\s*open\b/i.test(next) || CONTINUE_ARC.test(next.slice(first.index + first[0].length))) return null;
  return `it names ${first[0]} and no arc right after it`;
}
