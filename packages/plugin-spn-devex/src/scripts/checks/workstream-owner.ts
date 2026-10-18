// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A script or an agent writes each file, never both · § The approach page keeps up with its arcs
//           docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The refusal that makes one owner per file hold by force: a direct write to a file the `workstream`
// commands own, an edit that touches a `progress` or `open` block, a hand edit of an arc's stamp, and
// a write to the workspace's migrations ledger, which `plugin migration write` alone appends to.
// A command writes these through the library, never through a tool call, so nothing here refuses it.

import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { bashWrites } from "./doc-check.ts";
import { type Payload, type Verdict } from "../lib/payload.ts";
import { blocksIn, scriptOwned, stampsOn, workstreamAround } from "../lib/workstream.ts";
import { DEVEX, DEVEX_WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { LEDGER } from "../lib/migration.ts";

const WRITERS: Record<string, string> = {
  "state.json": "`workstream row write` (and `report write`)",
  "log.jsonl": "every `workstream` write, which appends its event",
  "facts.jsonl": "`workstream fact write`",
  "questions.jsonl": "the `workstream question` commands",
  "suggestions.jsonl": "`workstream suggestion write`",
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
  return `Denied: \`${owned.file}\` is written only by ${WRITERS[name] ?? "the `workstream` commands"}, and never by hand ` +
    `(01-workstream.md § A script or an agent writes each file, never both). Run \`spn-devex workstream\` for the change, ` +
    `or \`spn-devex workstream state show\` to read it.`;
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
  if (supplied.file_path) paths.push(resolve(payload.cwd ?? process.cwd(), supplied.file_path));
  else if (supplied.command) {
    try { paths.push(...bashWrites(supplied.command).map(([path]) => resolve(payload.cwd ?? process.cwd(), path))); } catch { /* no route read */ }
  }
  const isRead = payload.tool_name === "Read" || payload.tool_name === "Grep" || payload.tool_name === "Glob";
  if (!isRead) for (const path of paths) {
    const reason = ownedRefusal(path);
    if (reason) return { deny: reason };
  }
  if (isRead) return null;
  const reason = pageRefusal(payload);
  return reason ? { deny: reason } : null;
}

/** Only a path or a command inside a workstream folder. */
export const applies = (path: string, command: string): boolean =>
  path.includes(`${DEVEX_WORKSTREAMS}/`) || command.includes(`${DEVEX_WORKSTREAMS}/`) || /\.jsonl|state\.json/.test(command) ||
  path.endsWith(LEDGER) ||
  (/^[^/]/.test(path) && /\.(?:html|json|jsonl)$/.test(path));
