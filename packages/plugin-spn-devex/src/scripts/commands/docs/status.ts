// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// A construct's status, rolled up from the behaviour rows at its own path.
//
//   spn-devex docs status check <seat…>   report each status that differs from what its rows derive
//   spn-devex docs status write <seat…>   write each derived status into its seat file
//
// A SUBJECT WITH TWO ACTIONS, AND A `file` PATH. A path names one seat file, or a folder of them, and
// the command acts on exactly those. Both actions need a path, because a status is derived for the
// seat file that is named and for no other.

import { relative, resolve } from "node:path";
import { type Action, REQUIRED, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { resolveWorkspace, seatPaths, statusFor } from "./_lib.ts";

export const describe = "a construct's status, rolled up from the behaviour rows at its own path";

const USAGE = "<seat…>";

/** Both actions are one derivation of each status; `write` is the one that changes the seat file. */
function run(args: string[], write: boolean): number {
  const words = readWords(args);
  const seats = seatPaths(scopeOf(words.paths, REQUIRED));
  const workspace = resolveWorkspace();
  const found = seats.flatMap((seat) => statusFor(seat, resolve(workspace), write));
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  return found.some((finding) => finding.grade === "RULE") ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "report each status that differs from what its behaviour rows derive, and write nothing",
    usage: USAGE,
    run: (args) => run(args, false),
  },
  write: {
    describe: "write the status the behaviour rows derive into each seat file",
    usage: USAGE,
    run: (args) => run(args, true),
  },
};
