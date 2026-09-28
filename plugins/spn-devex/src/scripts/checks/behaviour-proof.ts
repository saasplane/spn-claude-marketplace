#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § The behaviours join is checked in both directions
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// The proof check: every `SUCCESS` row against the last run of its own tier. A repository gate —
// it reads every register and every run artifact whole, so it runs over a tree, never on one write.
//
//     node behaviour-proof.ts [root]
//
// Exit code is 1 when a row reads `SUCCESS` and a run of its tier contradicts it, or when an
// artifact is malformed; 0 otherwise.

import { resolve } from "node:path";
import { declaredRows } from "../lib/register.ts";
import type { DeclaredRow } from "../lib/register.ts";
import { runAlone } from "../lib/payload.ts";
import { artifacts } from "../lib/runs.ts";
import type { Run } from "../lib/runs.ts";

/** What the gate looked at and what it found. Zero rows over zero runs has proven nothing, and reads as that. */
export type ProofReport = {
  claimed: number;
  upheld: number;
  /** `SUCCESS` rows whose tier no run spoke for — counted, never judged. */
  unspoken: number;
  rowsJudged: number;
  runsRead: number;
  findings: string[];
};

/**
 * The gate, over rows and runs already read.
 *
 *   a `SUCCESS` no run supports        the tier ran and this row was not in it — the claim is stale
 *   a `SUCCESS` a run contradicts      the run found `FAILED` or `PENDING`
 *   a result at a tier the row denies  a claim is proven once, at the level that owns it
 *
 * `MANUAL`, `PLANNED`, `PENDING` and `FAILED` are never findings: each is a row honest about itself.
 */
export function judge(rows: DeclaredRow[], runs: Run[]): ProofReport {
  const spokenFor = new Set(runs.flatMap((run) => run.tiers));
  const findings: string[] = [];
  let claimed = 0;
  let upheld = 0;
  let unspoken = 0;
  for (const row of rows) {
    if (row.status !== "SUCCESS" || row.type === "PROMISE") continue;
    claimed += 1;
    if (!spokenFor.has(row.tier)) { unspoken += 1; continue; }
    const results = runs.flatMap((run) =>
      run.results.filter((result) => result.id === row.id).map((result) => ({ ...result, from: run.from })));
    const atItsTier = results.filter((result) => result.tier === row.tier);
    const elsewhere = [...new Set(results.filter((result) => result.tier !== row.tier).map((result) => result.tier))];
    const where = `${row.file}:${row.line}`;
    if (atItsTier.length === 0) {
      findings.push(elsewhere.length === 0
        ? `${where}  ${row.id} reads SUCCESS and the ${row.tier} run that spoke did not name it. A status is ` +
          `what the last run found — run the tier, or the row is a claim with nothing behind it.`
        : `${where}  ${row.id} declares ${row.tier} and was proven at ${elsewhere.join(" · ")} instead. A claim is ` +
          `proven once, at the level that owns it — move the case, or correct the row's Tier.`);
      continue;
    }
    const failing = atItsTier.find((result) => result.status === "FAILED")
      ?? atItsTier.find((result) => result.status === "PENDING");
    if (failing !== undefined) {
      findings.push(
        `${where}  ${row.id} reads SUCCESS and the run found ${failing.status} in "${failing.title.slice(0, 60)}" ` +
        `(${failing.from}). The row states a claim the evidence beside it contradicts.`
      );
      continue;
    }
    upheld += 1;
  }
  return { claimed: claimed, upheld: upheld, unspoken: unspoken, rowsJudged: rows.length, runsRead: runs.length, findings: findings };
}

if (runAlone("behaviour-proof.ts")) {
  const root = resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? ".");
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
  process.exit(faults.length ? 1 : 0);
}
