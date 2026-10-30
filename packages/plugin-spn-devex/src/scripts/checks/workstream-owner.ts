// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A script or an agent writes each file, never both · § The approach page keeps up with its arcs · § An arc carries its specification, or names the note that holds it
//           docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The refusal that makes one owner per file hold by force: a direct write to a file the `workstream`
// commands own, an edit that touches a `progress` or `open` block, a hand edit of an arc's stamp, and
// a write to the workspace's migrations ledger, which `plugin migration write` alone appends to, and
// a write that would create a sixth entry in an arc's notes folder of an open or backlog workstream, or
// anything but an arc's folder directly under its `notes/` or `arcs/`. Every file in an arc's data
// folder, its name file `<subject>.md` too, is the commands' (RULE.DEVEX.WORKSPACE.264).
// A command writes these through the library, never through a tool call, so nothing here refuses it.

import { existsSync, readFileSync } from "node:fs";
import { basename, resolve, sep } from "node:path";
import { bashWrites } from "./doc-check.ts";
import { type Payload, type Verdict } from "../lib/payload.ts";
import { NOTES, NOTES_ENTRIES, blocksIn, scriptOwned, stampsOn, strayHome, workstreamAround, wrongKind } from "../lib/workstream.ts";
import { ARC_ID } from "../lib/workstream-schema.ts";
import { DEVEX, DEVEX_WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { LEDGER } from "../lib/migration.ts";

const WRITERS: Record<string, string> = {
  "state.json": "`workstream arc edit` and the `workstream row` commands (and `report write`)",
  "log.jsonl": "every `workstream` write, which appends its event",
  "facts.jsonl": "`workstream fact write`",
  "sheet.json": "the `workstream sheet` commands, and the opening write of `workstream arc edit`",
  "questions.jsonl": "the `workstream question` commands",
  "suggestions.jsonl": "`workstream suggestion add`, `suggestion state` and `suggestion edit`",
};

/** Why a path a call writes is a script's alone, or null. */
export function ownedRefusal(path: string): string | null {
  if (resolve(path).split(sep).join("/").endsWith(`/${DEVEX}/${LEDGER}`))
    return `Denied: \`${DEVEX}/${LEDGER}\` is the workspace's ledger of applied plugin migrations, appended to only by ` +
      "`spn-devex plugin migration write`, and never written by hand (01-plugins.md § A release carries its migration, and a window " +
      "runs what is pending first). A ledger that does not read is the developer's to mend.";
  const owned = scriptOwned(path);
  if (!owned) return null;
  const name = owned.file.split("/").pop()!;
  const writer = WRITERS[name] ?? (name.endsWith(".md")
    ? "`workstream arc edit` and `docs cycles write`, from the arc's `state.json` — it is the arc's name file"
    : "the `workstream` commands");
  return `Denied: \`${owned.file}\` is written only by ${writer}, and never by hand ` +
    `(01-workstream.md § A script or an agent writes each file, never both). Run \`spn-devex workstream\` for the change, ` +
    `or \`spn-devex workstream state show\` to read it.`;
}

const NOTES_ENTRY = new RegExp(`^(.*/${DEVEX_WORKSTREAMS.replace(/\./g, "\\.")}/(?:open|backlog)/[^/]+/${NOTES}/N\\d+[a-z]?)/([^/]+)(/.*)?$`);

/**
 * Why a write may not make this path, or null: one that would create an entry beside the six in an
 * arc's notes folder (RULE.DEVEX.WORKSPACE.262). An entry already on disk is not refused, so the tidy
 * that folds a stray away can still rewrite its links first. A closed workstream is never read.
 */
export function notesTreeRefusal(path: string, makesFolder = false): string | null {
  const found = NOTES_ENTRY.exec(resolve(path).split(sep).join("/"));
  if (!found) return null;
  const [, arcDir, entry, below] = found;
  if (entry.startsWith(".") || existsSync(`${arcDir}/${entry}`)) return null;
  const kind = NOTES_ENTRIES.get(entry);
  const folder = below !== undefined || makesFolder;
  if (kind === (folder ? "folder" : "file")) return null;
  const arc = basename(arcDir);
  const home = kind ? wrongKind(entry, kind) : strayHome(entry, folder);
  return `Denied: this write makes \`${NOTES}/${arc}/${entry}${folder ? "/" : ""}\`, and an arc's notes folder holds \`preview.html\`, ` +
    `\`samples/\`, \`plan.md\`, \`orders/\`, \`scripts/\` and \`work/\`, and nothing else (01-workstream.md § An arc carries its specification, ` +
    `or names the note that holds it; RULE.DEVEX.WORKSPACE.262). It belongs in ${home}.`;
}

const LEVEL_ENTRY = new RegExp(`^(.*/${DEVEX_WORKSTREAMS.replace(/\./g, "\\.")}/(?:open|backlog)/[^/]+)/(${NOTES}|arcs)/([^/]+)(/.*)?$`);

/**
 * Why a write may not make this path, or null: one that would create anything but an arc's folder,
 * `N<nnn>/`, directly under a workstream's `notes/` or `arcs/` (RULE.DEVEX.WORKSPACE.262). An entry
 * already on disk is not refused, so a loose note can still be folded into a plan. A closed workstream
 * is never read.
 */
export function levelRefusal(path: string, makesFolder = false): string | null {
  const found = LEVEL_ENTRY.exec(resolve(path).split(sep).join("/"));
  if (!found) return null;
  const [, ws, level, entry, below] = found;
  if (entry.startsWith(".") || existsSync(`${ws}/${level}/${entry}`)) return null;
  const folder = below !== undefined || makesFolder;
  if (folder && ARC_ID.test(entry)) return null;
  const home = level === NOTES
    ? "a section of the `plan.md` of the arc it belongs to, or of the workstream's first open arc where it names none"
    : "nowhere by hand: the `workstream` commands write `arcs/N<nnn>/`";
  return `Denied: this write makes \`${level}/${entry}${folder ? "/" : ""}\`, and \`notes/\` and \`arcs/\` hold only arc folders, ` +
    `\`N<nnn>/\` (01-workstream.md § The folder; RULE.DEVEX.WORKSPACE.262). It belongs in ${home}.`;
}

/** The folders a `mkdir` in a command makes, as written. */
export function mkdirTargets(command: string): string[] {
  const out: string[] = [];
  for (const segment of command.split(/&&|\|\||[;|\n]/)) {
    const words = segment.trim().split(/\s+/).map((word) => word.replace(/^['"]|['"]$/g, ""));
    if (words[0] && basename(words[0]) === "mkdir") out.push(...words.slice(1).filter((word) => word && !word.startsWith("-")));
  }
  return out;
}

/** The page an `Edit` or `Write` leaves, or null where the call is neither. */
function written(before: string, payload: Payload): string | null {
  const supplied = payload.tool_input ?? {};
  if (supplied.content !== undefined) return supplied.content;
  if (supplied.old_string === undefined || supplied.new_string === undefined) return null;
  return supplied.replace_all ? before.split(supplied.old_string).join(supplied.new_string) : before.replace(supplied.old_string, () => supplied.new_string!);
}

/**
 * Why a write to a workstream's page may not be made, or null: an `Edit` whose old text reaches into
 * a generated block, a `Write` that leaves one different from the one on disk, and a write that
 * changes an arc's stamp, which `workstream arc stamp write` alone writes.
 */
export function pageRefusal(payload: Payload): string | null {
  const supplied = payload.tool_input ?? {};
  if (!supplied.file_path || !supplied.file_path.endsWith(".html")) return null;
  const path = resolve(payload.cwd ?? process.cwd(), supplied.file_path);
  if (!workstreamAround(path)) return null;
  let before: string;
  try { before = readFileSync(path, "utf8"); } catch { return null; }
  const blocks = blocksIn(before);

  if (supplied.content === undefined && supplied.old_string) {
    const replaced = supplied.old_string;
    for (let at = before.indexOf(replaced); at >= 0; at = before.indexOf(replaced, at + 1)) {
      const touched = blocks.find((block) => at < block.to && at + replaced.length > block.from);
      if (touched) return blockRefusal(touched.kind);
      if (!supplied.replace_all) break;
    }
  } else if (supplied.content !== undefined) {
    const after = blocksIn(supplied.content);
    for (const block of blocks) {
      const now = after.find((one) => one.kind === block.kind);
      if (!now || supplied.content.slice(now.from, now.to) !== before.slice(block.from, block.to)) return blockRefusal(block.kind);
    }
  }

  const after = written(before, payload);
  if (after === null) return null;
  const was = stampsOn(before);
  for (const [arc, row] of stampsOn(after)) {
    const old = was.get(arc);
    if (row.stamp !== null && (old === undefined ? true : old.stamp !== row.stamp))
      return `Denied: this write sets ${arc}'s \`data-arc-stamp\` by hand. The stamp says the page is current with the arc's rows, ` +
        `so only \`spn-devex workstream arc stamp write ${arc}\` writes it, once the page's Why, What and How are brought current ` +
        `(01-workstream.md § The approach page keeps up with its arcs).`;
  }
  return null;
}

function blockRefusal(kind: string): string {
  const writer = kind === "progress" ? "`spn-devex workstream progress write`" : "the `spn-devex workstream question` commands";
  return `Denied: this write touches the generated \`${kind}\` block, between \`<!-- spn:generated ${kind} -->\` and its closing ` +
    `marker. ${writer} write it, and a hand edit there is lost at the next write. Every other part of the page is yours.`;
}

/** The PreToolUse check: refuses a write to what a script owns. */
export function checkOwner(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  const paths: string[] = [];
  const folders: string[] = [];
  if (supplied.file_path) paths.push(resolve(payload.cwd ?? process.cwd(), supplied.file_path));
  else if (supplied.command) {
    try { paths.push(...bashWrites(supplied.command).map(([path]) => resolve(payload.cwd ?? process.cwd(), path))); } catch { /* no route read */ }
    folders.push(...mkdirTargets(supplied.command).map((path) => resolve(payload.cwd ?? process.cwd(), path)));
  }
  const isRead = payload.tool_name === "Read" || payload.tool_name === "Grep" || payload.tool_name === "Glob";
  if (!isRead) for (const path of paths) {
    const reason = ownedRefusal(path) ?? levelRefusal(path) ?? notesTreeRefusal(path);
    if (reason) return { deny: reason };
  }
  if (!isRead) for (const folder of folders) {
    const reason = levelRefusal(folder, true) ?? notesTreeRefusal(folder, true);
    if (reason) return { deny: reason };
  }
  if (isRead) return null;
  const reason = pageRefusal(payload);
  return reason ? { deny: reason } : null;
}

/** Only a path or a command inside a workstream folder. */
export const applies = (path: string, command: string): boolean =>
  path.includes(`${DEVEX_WORKSTREAMS}/`) || command.includes(`${DEVEX_WORKSTREAMS}/`) || /\.jsonl|state\.json/.test(command) ||
  path.endsWith(LEDGER) || /(?:^|\/)notes\/N\d/.test(path) || /(?:^|[\s'"/])notes\/N\d/.test(command) ||
  (/^[^/]/.test(path) && /\.(?:html|json|jsonl)$/.test(path));
