#!/usr/bin/env node
// Write what one named run found into the behaviour rows, and nothing else — the one writer of
// `Status` and `Updated at` in every repository (the book's RD.DEVEX.UTILS.071: the CLI writes the
// run's file and never a row). It reads the registers under `docs/`, and only the files of the run
// it is told to read: `<run>.json` and every `<run>.<phase>.json` under each node's
// `tests/.output/<tier>/runs/`.
//
//     spn-devex behaviours stamp <run> <repo> [--write] [--reach repository]
//
// **What a row is for.** `Type` and `Tier` are decisions somebody makes, so a person writes them.
// `Status` and `Updated at` are what a run FOUND, so the agent writes them, `Updated at` as
// `<time> · <run>`, and a hand edit to either is a claim rather than a finding.
//
// **A run speaks for the tiers it ran, and for nothing else.** A `CONTRACT` file updates rows
// declaring `CONTRACT` and leaves every `JOURNEY` row exactly as it found them, and a result proven
// at another tier than the row's is never read as evidence for it.
//
// **And it never resets unless it is told the run was the whole tier.** Runs are per node while a
// register is per repository, so one node's file covers a tier it does not own alone.
// `--reach repository` is the caller saying *this run is the whole of these tiers*. Without it,
// rows the run does not name are left alone.
//
// **`MANUAL` is never written over, and a `PROMISE` row is never stamped.** The first is the one
// intent no evidence can recover; the second is the foundation's grammar, which carries no proof.
//
// **Columns are found by heading**, so an eight-, nine- or ten-cell register is stamped alike and
// keeps its width. A file is rewritten only where a row of it changed.
//
// Exit code: 2 when no run is named, 1 when the named run left no file; otherwise, without
// `--write`, the rows that would change plus the malformed files, so a pipeline can gate on drift;
// with it, the malformed files alone.

import { statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { cellValue, registerRows, statusOf } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { namedRun, newest, read, RUN_NAME, runNames, stampOf, walk, worst } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import type { Run } from "../../../../../plugin-support-lib/src/lib/runs.ts";

type Change = { file: string; line: number; id: string; from: string; to: string };

/** A replacement cell keeping the padding the table was written with, so no row changes width. */
const repadded = (cell: string, value: string): string => {
  const lead = cell.match(/^\s*/)?.[0] || " ";
  const tail = cell.match(/\s*$/)?.[0] || " ";
  return `${lead}${value}${tail}`;
};

/** What one file's rows become, given what the runs said. */
function apply(source: string, name: string, runs: Run[], reachIsRepository: boolean, file: string): { text: string; changes: Change[] } {
  const lines = source.split("\n");
  const changes: Change[] = [];
  for (const row of registerRows(source)) {
    if (row.columns.updated < 0) continue;                          // no instant to write beside the status
    const id = cellValue(row, "id");
    const tier = cellValue(row, "tier").toUpperCase();
    const was = statusOf(row);
    if (was === "MANUAL") continue;                                  // a person's, never written over
    if (cellValue(row, "type").toUpperCase() === "PROMISE") continue; // the foundation's grammar, no proof state

    const speaking = runs.filter((run) => run.tier === tier);
    if (speaking.length === 0) continue;                             // the run left no file at this tier

    // The row's own tier binds a result to it. A result at another tier is a claim proven at the
    // wrong level, which the proof check reports; reading it here would write that finding away.
    const naming = speaking.filter((run) => run.results.some((result) => result.id === id && result.tier === tier));
    let status: string;
    let stamp: string;
    if (naming.length > 0) {
      status = worst(naming.flatMap((run) => run.results.filter((result) => result.id === id && result.tier === tier))
        .map((result) => result.status.toUpperCase()));
      // Dated by the files that NAMED the row, never by a newer file of the run that did not.
      stamp = stampOf(newest(naming) ?? "", name);
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

/** The runs on disk, newest first, as a refusal names them. */
function newestRuns(root: string): string {
  const found = runNames(root).slice(0, 5);
  return found.length === 0
    ? "No run has left a file under this repository yet: run a tier under a name first."
    : `The newest runs here: ${found.map((one) => `${one.run} (${one.ranAt})`).join(" · ")}.`;
}

/** The options this command takes. Any other is refused, so a stray value is never read as the repository. */
const OPTIONS = new Set(["--write", "--reach"]);

export const describe = "the one writer of Status and Updated at — stamp behaviour rows from one named run";

export function run(argv: string[]): number {
  const write = argv.includes("--write");
  const reachIsRepository = argv.includes("--reach") && argv[argv.indexOf("--reach") + 1] === "repository";
  const unknown = argv.filter((arg) => arg.startsWith("--") && !OPTIONS.has(arg));
  const words = argv.filter((arg, at) => !arg.startsWith("--") && argv[at - 1] !== "--reach");
  const root = resolve(words[1] ?? ".");
  const usage = "spn-devex behaviours stamp <run> <repo> [--write] [--reach repository]";
  if (unknown.length > 0) {
    console.error(`✗ ${unknown.join(" ")}: not an option of this command. Usage: ${usage}`);
    return 2;
  }
  const name = words[0];
  if (name === undefined) {
    console.error(`✗ Name the run to stamp from. Usage: ${usage}\n  ${newestRuns(root)}`);
    return 2;
  }
  if (!RUN_NAME.test(name)) {
    console.error(`✗ '${name}' is not a run name: a letter or digit first, then letters, digits, dots, dashes and underscores. ` +
      `Usage: ${usage}\n  ${newestRuns(root)}`);
    return 2;
  }

  const { runs, findings } = namedRun(root, name);
  for (const finding of findings) console.error(`✗ ${finding}`);
  if (runs.length === 0) {
    console.error(findings.length > 0
      ? `✗ Run ${name} left no file that can be read, so nothing was stamped.`
      : `✗ No run named ${name} left a file under ${root}\n  ${newestRuns(root)}`);
    return Math.max(findings.length, 1);
  }

  const tiers = [...new Set(runs.map((one) => one.tier))].sort();
  const changes: Change[] = [];
  for (const file of walk(join(root, "docs"))) {
    if (!file.endsWith(".md")) continue;
    const body = read(file);
    if (body === null || !body.includes("|")) continue;
    const outcome = apply(body, name, runs, reachIsRepository, relative(root, file));
    if (outcome.changes.length === 0) continue;
    changes.push(...outcome.changes);
    if (write && statSync(file).isFile()) writeFileSync(file, outcome.text, "utf8");
  }

  console.log(
    `${write ? "wrote" : "would change"} ${changes.length} row(s) from run ${name}, ${runs.length} file(s) ` +
    `speaking for ${tiers.join(" · ")}${reachIsRepository ? " across the repository" : ""}`
  );
  for (const change of changes) console.log(`  ${change.file}:${change.line}  ${change.id}  ${change.from} → ${change.to}`);
  if (!reachIsRepository && changes.length > 0) {
    console.log(
      `\n· rows run ${name} did not name were left alone. Pass \`--reach repository\` where this run IS ` +
      "the whole of these tiers, and a row nothing cites goes back to PLANNED."
    );
  }
  return Math.min(findings.length + (write ? 0 : changes.length), 250);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
