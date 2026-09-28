#!/usr/bin/env node
// Write what the last run found into the behaviour rows, and nothing else — the one writer of
// `Status` and `Updated at` in every repository (the book's RD.DEVEX.071: the CLI writes the run
// artifact and never a row). It reads the registers under `docs/`, and every `spn-tests.json` under
// the root unless `--results` names the artifacts to read.
//
//     spn-devex behaviours stamp [--write] [--reach repository] [--results <spn-tests.json> …] [root]
//
// **What a row is for.** `Type` and `Tier` are decisions somebody makes, so a person writes them.
// `Status` and `Updated at` are what the last run FOUND, so the agent writes them and a hand edit to
// either is a claim rather than a finding.
//
// **A run speaks for the tiers it ran, and for nothing else.** A `CONTRACT` run updates rows
// declaring `CONTRACT` and leaves every `JOURNEY` row exactly as it found them, and a result proven
// at another tier than the row's is never read as evidence for it.
//
// **And it never resets unless it is told the run was the whole tier.** Runs are per node while a
// register is per repository, so one node's artifact covers a tier it does not own alone.
// `--reach repository` is the caller saying *these artifacts are the whole of these tiers*.
// Without it, rows nothing named are left alone.
//
// **`MANUAL` is never written over, and a `PROMISE` row is never stamped.** The first is the one
// intent no evidence can recover; the second is the foundation's grammar, which carries no proof.
//
// **Columns are found by heading**, so an eight-, nine- or ten-cell register is stamped alike and
// keeps its width. A file is rewritten only where a row of it changed.
//
// Exit code: without `--write`, the rows that would change plus the malformed artifacts, so a
// pipeline can gate on drift; with it, the malformed artifacts alone.

import { statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { cellValue, registerRows, statusOf } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { artifacts, newest, read, readArtifact, walk, worst } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import type { Run } from "../../../../../plugin-support-lib/src/lib/runs.ts";

type Change = { file: string; line: number; id: string; from: string; to: string };

/** A replacement cell keeping the padding the table was written with, so no row changes width. */
const repadded = (cell: string, value: string): string => {
  const lead = cell.match(/^\s*/)?.[0] || " ";
  const tail = cell.match(/\s*$/)?.[0] || " ";
  return `${lead}${value}${tail}`;
};

/** What one file's rows become, given what the runs said. */
function apply(source: string, runs: Run[], reachIsRepository: boolean, file: string): { text: string; changes: Change[] } {
  const lines = source.split("\n");
  const changes: Change[] = [];
  for (const row of registerRows(source)) {
    if (row.columns.updated < 0) continue;                          // no instant to write beside the status
    const id = cellValue(row, "id");
    const tier = cellValue(row, "tier").toUpperCase();
    const was = statusOf(row);
    if (was === "MANUAL") continue;                                  // a person's, never written over
    if (cellValue(row, "type").toUpperCase() === "PROMISE") continue; // the foundation's grammar, no proof state

    const speaking = runs.filter((run) => run.tiers.includes(tier));
    if (speaking.length === 0) continue;                             // no run spoke for this tier

    // The row's own tier binds a result to it. A result at another tier is a claim proven at the
    // wrong level, which the proof check reports; reading it here would write that finding away.
    const naming = speaking.filter((run) => run.results.some((result) => result.id === id && result.tier === tier));
    let status: string;
    let stamp: string;
    if (naming.length > 0) {
      status = worst(naming.flatMap((run) => run.results.filter((result) => result.id === id && result.tier === tier))
        .map((result) => result.status.toUpperCase()));
      // Dated by the runs that NAMED the row, never by a newer run of the tier that did not.
      stamp = newest(naming) ?? "";
    } else if (reachIsRepository) {
      status = "PLANNED";
      stamp = "";
    } else {
      continue;                                                      // silence is not evidence of absence
    }
    if (status === was && stamp === cellValue(row, "updated")) continue;

    const cells = [...row.cells];
    cells[row.columns.status] = repadded(cells[row.columns.status], status);
    cells[row.columns.updated] = stamp === "" ? " " : repadded(cells[row.columns.updated], stamp);
    lines[row.index] = `|${cells.join("|")}|`;
    changes.push({ file: file, line: row.index + 1, id: id, from: was, to: status });
  }
  return { text: lines.join("\n"), changes: changes };
}

/** The runs this write speaks from: the artifacts `--results` names, or every one under the root. */
function readNamed(root: string, named: string[]): { runs: Run[]; findings: string[] } {
  const runs: Run[] = [];
  const findings: string[] = [];
  for (const file of named) {
    const one = readArtifact(root, resolve(file));
    if (one === null) findings.push(`${file}: no artifact there`);
    else if ("finding" in one) findings.push(one.finding);
    else runs.push(one.run);
  }
  return { runs: runs, findings: findings };
}

export const describe = "the one writer of Status and Updated at — stamp behaviour rows from a run's artifacts";

export function run(argv: string[]): number {
  const write = argv.includes("--write");
  const reachIsRepository = argv.includes("--reach") && argv[argv.indexOf("--reach") + 1] === "repository";
  const named = argv.flatMap((arg, at) => (argv[at - 1] === "--results" ? [arg] : []));
  const root = resolve(argv.find((arg, at) => !arg.startsWith("--") && argv[at - 1] !== "--reach" && argv[at - 1] !== "--results") ?? ".");

  const { runs, findings } = named.length ? readNamed(root, named) : artifacts(root);
  for (const finding of findings) console.error(`✗ ${finding}`);
  if (runs.length === 0) {
    console.log(findings.length ? "· no usable run artifact" : "· no run artifact — nothing has said what it proved");
    return findings.length;
  }

  const tiers = [...new Set(runs.flatMap((r) => r.tiers))].sort();
  const changes: Change[] = [];
  for (const file of walk(join(root, "docs"))) {
    if (!file.endsWith(".md")) continue;
    const body = read(file);
    if (body === null || !body.includes("|")) continue;
    const outcome = apply(body, runs, reachIsRepository, relative(root, file));
    if (outcome.changes.length === 0) continue;
    changes.push(...outcome.changes);
    if (write && statSync(file).isFile()) writeFileSync(file, outcome.text, "utf8");
  }

  console.log(
    `${write ? "wrote" : "would change"} ${changes.length} row(s) from ${runs.length} artifact(s) ` +
    `speaking for ${tiers.join(" · ")}${reachIsRepository ? " across the repository" : ""}`
  );
  for (const change of changes) console.log(`  ${change.file}:${change.line}  ${change.id}  ${change.from} → ${change.to}`);
  if (!reachIsRepository && changes.length > 0) {
    console.log(
      "\n· rows no artifact named were left alone. Pass `--reach repository` where these artifacts ARE " +
      "the whole of these tiers, and a row nothing cites goes back to PLANNED."
    );
  }
  return Math.min(findings.length + (write ? 0 : changes.length), 250);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
