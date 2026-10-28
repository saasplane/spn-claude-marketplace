// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-artifacts.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// What is generated, between markers: a domain's glossary, the maps, and the tag lines.
//
//   spn-devex docs face check [<path>] [--block <name>]   report what a write would change
//   spn-devex docs face write <path> [--block <name>]     write it
//
// A SUBJECT WITH TWO ACTIONS, AND A `tree` PATH. The path may be a docs tree, a folder inside one, or
// one seat file. The command finds the docs tree from the path, and reads only the generated regions
// that the path feeds. `--block` narrows the run to the blocks it names.

import { relative } from "node:path";
import { type Action, OPTIONAL, REQUIRED, docsTreeOf, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { FACE_BLOCKS, face, resolveWorkspace } from "./_lib.ts";

export const describe = "what is generated, between markers: a domain's glossary, the maps, the tag lines";

const OPTIONS = { block: FACE_BLOCKS };
const BLOCK_USAGE = `[--block ${FACE_BLOCKS.join("|")}]`;

/** Both actions are one reading of the tree; `write` is the one that changes files. */
function run(args: string[], write: boolean): number {
  const words = readWords(args, OPTIONS);
  const path = onePath(scopeOf(words.paths, write ? REQUIRED : OPTIONAL));
  const blocks = words.values("block");
  const workspace = resolveWorkspace();
  const found = face(docsTreeOf(path), write, { paths: [path], blocks: blocks.length ? blocks : FACE_BLOCKS });
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  return found.some((finding) => finding.grade === "RULE") ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "report the generated regions a write would change, and write nothing",
    usage: `[<path>] ${BLOCK_USAGE}`,
    run: (args) => run(args, false),
  },
  write: {
    describe: "write the generated regions the path feeds",
    usage: `<path> ${BLOCK_USAGE}`,
    run: (args) => run(args, true),
  },
};
