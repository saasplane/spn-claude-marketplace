#!/usr/bin/env node
// The proof check: every `SUCCESS` row against the run its `Updated at` cites. A repository gate —
// it reads every register, and the files of each run a row cites, so it runs over a tree, never on
// one write. The judging logic itself lives in `checks/behaviour-proof.ts`; this action is the CLI
// door onto the same judgment.
//
//     spn-devex behaviours check [root]
//
// Exit code is 1 when a row reads `SUCCESS` and the run it cites contradicts it, or when a file of a
// cited run is malformed; 0 otherwise.

import { resolve } from "node:path";
import { declaredRows } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { judge, runReader, summaryOf } from "../../checks/behaviour-proof.ts";

export const describe = "every SUCCESS row against the run its Updated at cites — the proof gate";

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const { rows, registers } = declaredRows(root);
  const report = judge(rows, runReader(root));
  for (const fault of report.findings) console.log(`✗ ${fault}`);
  console.log(`\n${summaryOf(report, registers)}`);
  return report.findings.length ? 1 : 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
