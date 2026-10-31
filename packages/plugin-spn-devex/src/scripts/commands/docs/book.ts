// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § In an arc that keeps a sheet, a row lands on a run of its tests
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// The book check over the whole book: every chapter's parentheses read, name a level and name a holder that exists.
//
//   spn-devex docs book check [<book>] [--run <name>]
//
// THE BOOK HAS NO SUITE, AND THIS READ IS ITS PROOF: a clean read given a run name is recorded as a named run in the
// book, so its proof row lands on it (DEC.DEVEX.WORKSPACE.328). A read with a fault records nothing, because the run
// carries no test id and would land the row all the same.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { type Action, readWords, UsageFault, VALUE } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { POCKET } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { writeRunFile } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import { bookClassFaults, knownHolders, ownMarketplace } from "../../checks/book-classes.ts";
import { workspaceRoot } from "../../lib/payload.ts";
import { bookLine, findBook, noBookReason } from "../restates/check.ts";

export const describe = "the book check over the whole book — every parenthesis reads, names a level and a holder that exists";

/** Every chapter of a book: the markdown under `docs/`, but the produced pages of `artifacts/`. */
export function chapters(book: string): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (name !== POCKET.artifacts) walk(full); }
      else if (name.endsWith(".md")) found.push(full);
    }
  };
  walk(join(book, "docs"));
  return found;
}

function check(args: string[]): number {
  const words = readWords(args, { run: VALUE });
  if (words.paths.length > 1) throw new UsageFault("takes one book.");
  const book = findBook(words.paths[0], process.cwd());
  if (book === null) { console.error(noBookReason(process.cwd())); return 2; }
  console.log(bookLine(book, words.paths.length === 1, process.cwd()));

  const known = knownHolders(ownMarketplace(), workspaceRoot(book));
  const read = chapters(book);
  let faults = 0;
  for (const file of read)
    for (const fault of bookClassFaults(readFileSync(file, "utf8"), known)) {
      faults += 1;
      console.log(`✗ ${relative(book, file)}: ${fault}`);
    }
  console.log(faults ? `\n${read.length} chapters read, ${faults} fault(s)` : `\nclean — ${read.length} chapters read`);

  const run = words.value("run");
  if (run !== null) {
    if (faults) console.log(`no run written: ${run} would land the book's proof row on a read with ${faults} fault(s)`);
    else console.log(`run ${run} -> ${relative(book, writeRunFile(book, run, "UNIT", []))}`);
  }
  return faults ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "read every chapter of the book through the book check; with --run, record a clean read as a named run in the book",
    usage: "[<book>] [--run <name>]",
    run: check,
  },
};
