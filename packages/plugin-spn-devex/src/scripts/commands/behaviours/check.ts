// The proof check: every `SUCCESS` row against the run its `Updated at` cites. A repository gate —
// it reads every register, and the files of each run a row cites, so it runs over a tree, never on
// one write. The judging logic itself lives in `checks/behaviour-proof.ts`; this action is the CLI
// door onto the same judgment.
//
//     spn-devex behaviours check [<path>]
//
// AN ACTION OF ITS GROUP, AND A `tree` PATH. The command finds the repository from the path, reads a
// cited run's files from the whole repository, and judges the rows whose register sits under the path.
//
// Exit code is 1 when a row reads `SUCCESS` and the run it cites contradicts it, or when a file of a
// cited run is malformed; 0 otherwise.

import { join } from "node:path";
import { OPTIONAL, onePath, readWords, repositoryOf, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { declaredRows } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { judge, runReader, summaryOf } from "../../checks/behaviour-proof.ts";

export const describe = "every SUCCESS row against the run its Updated at cites — the proof gate";

export const usage = "[<path>]";

export function run(args: string[]): number {
  const path = onePath(scopeOf(readWords(args).paths, OPTIONAL));
  const root = repositoryOf(path) ?? path;
  const { rows, registers } = declaredRows(root);
  const judged = rows.filter((row) => under(join(root, row.file), [path]));
  const report = judge(judged, runReader(root));
  for (const fault of report.findings) console.log(`✗ ${fault}`);
  // A narrowed run counts the register files it judged a row of; the repository's own count is of every table.
  console.log(`\n${summaryOf(report, path === root ? registers : new Set(judged.map((row) => row.file)).size)}`);
  return report.findings.length ? 1 : 0;
}
