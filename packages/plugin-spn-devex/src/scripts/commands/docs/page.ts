// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Each construct page, produced from its seat file.
//
//   spn-devex docs page check <seat…>   report each page that differs from what its seat file gives
//   spn-devex docs page write <seat…>   write each page
//
// A SUBJECT WITH TWO ACTIONS, AND A `file` PATH. A path names one seat file, or a folder of them, and
// the command acts on exactly those. Both actions need a path, because a page is produced from the
// seat file that is named and from no other.

import { join, relative, resolve } from "node:path";
import { type Action, REQUIRED, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { bookTemplatesDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { pageFor, resolveWorkspace, seatPaths } from "./_lib.ts";

export const describe = "each construct page, produced from its seat file";

const USAGE = "<seat…>";

/** Both actions are one production of each page; `write` is the one that puts it on disk. */
function run(args: string[], write: boolean): number {
  const words = readWords(args);
  const seats = seatPaths(scopeOf(words.paths, REQUIRED));
  const workspace = resolveWorkspace();
  const templates = process.env.SPN_TEMPLATES ?? bookTemplatesDir(join(resolve(workspace), "spn-foundation"));
  const found = seats.flatMap((seat) => pageFor(seat, resolve(workspace), templates, write));
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  return found.some((finding) => finding.grade === "RULE") ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "report each page that differs from what its seat file gives, and write nothing",
    usage: USAGE,
    run: (args) => run(args, false),
  },
  write: {
    describe: "write each construct page from its seat file",
    usage: USAGE,
    run: (args) => run(args, true),
  },
};
