#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § The behaviours join is checked in both directions
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// The proof check: every `SUCCESS` row against the run its `Updated at` cites, and no other run
// (the book's RD.DEVEX.UTILS.071). A repository gate — it reads every register, and the files of
// each run a row cites, so it runs over a tree, never on one write.
//
//     node behaviour-proof.ts [root]
//
// Exit code is 1 when a row reads `SUCCESS` and the run it cites contradicts it, or when a file of
// a cited run is malformed; 0 otherwise.

import { resolve } from "node:path";
import { declaredRows } from "../../../../plugin-support-lib/src/lib/register.ts";
import type { DeclaredRow } from "../../../../plugin-support-lib/src/lib/register.ts";
import { runAlone } from "../lib/payload.ts";
import { cited, namedRun } from "../../../../plugin-support-lib/src/lib/runs.ts";
import type { Run } from "../../../../plugin-support-lib/src/lib/runs.ts";

/** What the gate looked at and what it found. Zero rows over zero runs has proven nothing, and reads as that. */
export type ProofReport = {
  claimed: number;
  upheld: number;
  /** `SUCCESS` rows citing a run that left no file at the row's tier on this disk — counted, never judged. */
  absent: number;
  /** `SUCCESS` rows whose `Updated at` names no run — counted, never judged. */
  uncited: number;
  rowsJudged: number;
  /** Run files read, across every run a row cites. */
  runsRead: number;
  findings: string[];
};

/** The files of one named run, read once however many rows cite it. */
export type RunReader = (name: string) => { runs: Run[]; findings: string[] };

/** A reader over one tree, remembering each run it read. */
export function runReader(root: string): RunReader {
  const read = new Map<string, { runs: Run[]; findings: string[] }>();
  return (name) => {
    if (!read.has(name)) read.set(name, namedRun(root, name));
    return read.get(name)!;
  };
}

/**
 * The gate, over rows already read and a reader of the runs they cite.
 *
 *   a `SUCCESS` the cited run did not name  its tier ran under that name and this row was not in it
 *   a `SUCCESS` the cited run contradicts   the run found `FAILED` or `PENDING`
 *   a result at a tier the row denies       a claim is proven once, at the level that owns it
 *
 * `MANUAL`, `PLANNED`, `PENDING` and `FAILED` are never findings: each is a row honest about itself.
 * A row citing a run whose file is not on this disk is counted and never judged, because a run's
 * files are output a fresh checkout does not hold and a tier keeps only its 20 newest.
 */
export function judge(rows: DeclaredRow[], runsOf: RunReader): ProofReport {
  const findings: string[] = [];
  const files = new Set<string>();
  const malformed = new Set<string>();
  let claimed = 0;
  let upheld = 0;
  let absent = 0;
  let uncited = 0;
  for (const row of rows) {
    if (row.status !== "SUCCESS" || row.type === "PROMISE") continue;
    claimed += 1;
    const cites = cited(row.updatedAt);
    if (cites === null || cites.run === null) { uncited += 1; continue; }
    const read = runsOf(cites.run);
    read.runs.forEach((one) => files.add(one.from));
    for (const finding of read.findings) {
      if (malformed.has(finding)) continue;
      malformed.add(finding);
      findings.push(`run file  ${finding}`);
    }
    const atItsTier = read.runs.filter((one) => one.tier === row.tier);
    if (atItsTier.length === 0) {
      // A cited run with a malformed file is already a finding; otherwise the file is simply not here.
      if (read.findings.length === 0) absent += 1;
      continue;
    }
    const results = read.runs.flatMap((one) =>
      one.results.filter((result) => result.id === row.id).map((result) => ({ ...result, from: one.from })));
    const named = results.filter((result) => result.tier === row.tier);
    const elsewhere = [...new Set(results.filter((result) => result.tier !== row.tier).map((result) => result.tier))];
    const where = `${row.file}:${row.line}`;
    if (named.length === 0) {
      findings.push(elsewhere.length === 0
        ? `${where}  ${row.id} reads SUCCESS and the ${row.tier} run it cites, ${cites.run}, did not name it. A status is ` +
          `what the run found — run the tier and stamp again, or the row is a claim with nothing behind it.`
        : `${where}  ${row.id} declares ${row.tier}, and in run ${cites.run} it was proven at ${elsewhere.join(" · ")} instead. A claim is ` +
          `proven once, at the level that owns it — move the case, or correct the row's Tier.`);
      continue;
    }
    const failing = named.find((result) => result.status === "FAILED") ?? named.find((result) => result.status === "PENDING");
    if (failing !== undefined) {
      findings.push(
        `${where}  ${row.id} reads SUCCESS and run ${cites.run} found ${failing.status} in "${failing.title.slice(0, 60)}" ` +
        `(${failing.from}). The row states a claim the evidence it cites contradicts.`
      );
      continue;
    }
    upheld += 1;
  }
  return {
    claimed: claimed, upheld: upheld, absent: absent, uncited: uncited,
    rowsJudged: rows.length, runsRead: files.size, findings: findings,
  };
}

/** The gate's one summary line, shared by this check and `behaviours check`. */
export const summaryOf = (report: ProofReport, registers: number): string =>
  `${report.claimed} SUCCESS row(s) · ${report.upheld} upheld · ${report.absent} citing a run not on disk · ` +
  `${report.uncited} citing no run · ${report.rowsJudged} row(s) in ${registers} register(s) · ${report.runsRead} run file(s) read` +
  (report.findings.length ? ` — ${report.findings.length} REFUSED` : "");

if (runAlone("behaviour-proof.ts")) {
  const root = resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? ".");
  const { rows, registers } = declaredRows(root);
  const report = judge(rows, runReader(root));
  for (const fault of report.findings) console.log(`✗ ${fault}`);
  console.log(`\n${summaryOf(report, registers)}`);
  process.exit(report.findings.length ? 1 : 0);
}
