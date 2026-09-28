#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § The behaviours join is checked in both directions
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// The behaviours join, both directions: a `SUCCESS` row names a case that cites it, and a case
// citing an id finds a row that declares it. A repository gate — it reads both sets whole.
//
//     node behaviour-join.ts [--report] [root]
//
// Where a case lives and how its title is written are the stack's, so the stack's half is imported
// from `providers/<stack>/scripts/lib/cases.ts` by a composed path. Exit code is 1 on a finding;
// `--report` prints the same and exits 0.

import { resolve } from "node:path";
import { declaredIds, declaredRows } from "../../../../plugin-support-lib/src/lib/register.ts";
import type { DeclaredRow } from "../../../../plugin-support-lib/src/lib/register.ts";
import { runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { stackOf } from "../lib/stack.ts";

export type Case = { id: string; title: string; file: string; tier: string };

export type JoinReport = { rows: number; claimed: number; cited: number; findings: string[] };

/** The join, over rows, the ids any table declares, and the cases a stack found. */
export function join(rows: DeclaredRow[], declared: Set<string>, cases: Case[]): JoinReport {
  const citing = new Map<string, Case[]>();
  for (const one of cases) citing.set(one.id, [...(citing.get(one.id) ?? []), one]);
  const findings: string[] = [];
  const claimed = rows.filter((row) => row.status === "SUCCESS" && row.type !== "PROMISE");
  for (const row of claimed) {
    if ((citing.get(row.id) ?? []).length > 0) continue;
    findings.push(
      `${row.file}:${row.line}  ${row.id} reads SUCCESS and no case cites it. Cite the id in the title of ` +
      `the case that proves it, or, if no case does any more, set the row back to PLANNED.`
    );
  }
  for (const one of cases) {
    if (declared.has(one.id)) continue;
    findings.push(
      `${one.file}  "${one.title.slice(0, 80)}" cites ${one.id}, which no behaviour row declares. A case ` +
      `names the row it proves — declare the row, or correct the id in the title.`
    );
  }
  return { rows: rows.length, claimed: claimed.length, cited: new Set(cases.map((one) => one.id)).size, findings: findings };
}

if (runAlone("behaviour-join.ts")) {
  const argv = process.argv.slice(2);
  const root = resolve(argv.find((a) => !a.startsWith("--")) ?? ".");
  const stack = stackOf(`${root}/sprepo.json`);
  let cases: Case[] = [];
  let filesRead = 0;
  if (stack) {
    try {
      const provider = await import(`../../providers/${stack}/scripts/lib/cases.ts`);
      ({ cases, filesRead } = provider.casesUnder(root));
    } catch {
      console.log(`· this plugin ships no case reader for the ${stack} stack, so only the rows are read`);
    }
  } else {
    console.log("· no stack is declared here, so no case can be read — every SUCCESS row reads as uncited");
  }
  const { rows } = declaredRows(root);
  const report = join(rows, declaredIds(root), cases);
  for (const finding of report.findings) console.log(`✗ ${finding}`);
  console.log(
    `\n${report.rows} row(s) · ${report.claimed} SUCCESS · ${report.cited} id(s) cited by ${cases.length} case title(s) ` +
    `in ${filesRead} file(s)` + (report.findings.length ? ` — ${report.findings.length} finding(s)` : "")
  );
  process.exit(report.findings.length && !argv.includes("--report") ? 1 : 0);
}
