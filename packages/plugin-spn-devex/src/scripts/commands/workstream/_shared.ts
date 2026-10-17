// What every `workstream` command shares: a reference read as a usage fault where it names nothing,
// a list option read from its words, and what runs after every write — the progress block refreshed
// and the workstream's own `state check`, printed as lines the agent reads.

import { basename } from "node:path";
import { UsageFault, type Words } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { checkWorkstream } from "../../checks/workstream-state.ts";
import { findWorkstream, resolveArc, workspaceOf, writeProgress } from "../../lib/workstream.ts";

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

/** After a write: the progress block refreshed, and the workstream's check, each finding on a line. */
export function afterWrite(ws: string): string[] {
  const lines: string[] = [];
  const progress = writeProgress(ws);
  if (!/^progress (?:current|written)$/.test(progress)) lines.push(`! ${progress}`);
  for (const finding of checkWorkstream(ws))
    lines.push(`! state check · ${basename(ws)}${finding.arc ? ` ${finding.arc}` : ""} · ${finding.message}`);
  return lines;
}
