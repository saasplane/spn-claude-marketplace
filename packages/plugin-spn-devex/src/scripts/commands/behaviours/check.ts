#!/usr/bin/env node
// The proof check: every `SUCCESS` row against the last run of its own tier. A repository gate — it
// reads every register and every run artifact whole, so it runs over a tree, never on one write. The
// judging logic itself lives in `checks/behaviour-proof.ts`, since a PostToolUse hook calls it
// directly; this action is the CLI door onto the same judgment.
//
//     spn-devex behaviours check [root]
//
// Exit code is 1 when a row reads `SUCCESS` and a run of its tier contradicts it, or when an
// artifact is malformed; 0 otherwise.

import { resolve } from "node:path";
import { declaredRows } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { artifacts } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import { judge } from "../../checks/behaviour-proof.ts";

export const describe = "every SUCCESS row against the last run of its own tier — the proof gate";

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const { rows, registers } = declaredRows(root);
  const read = artifacts(root);
  const report = judge(rows, read.runs);
  const faults = [...read.findings.map((finding) => `artifact  ${finding}`), ...report.findings];
  for (const fault of faults) console.log(`✗ ${fault}`);
  console.log(
    `\n${report.claimed} SUCCESS row(s) · ${report.upheld} upheld · ${report.unspoken} at a tier no run spoke for · ` +
    `${report.rowsJudged} row(s) in ${registers} register(s) · ${report.runsRead} run(s) read` +
    (faults.length ? ` — ${faults.length} REFUSED` : "")
  );
  return faults.length ? 1 : 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
