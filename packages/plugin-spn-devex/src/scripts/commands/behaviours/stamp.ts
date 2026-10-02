// Write what one named run found into the behaviour rows, and nothing else — the one writer of
// `Status` and `Updated at` in every repository (the book's RD.DEVEX.UTILS.071: the CLI writes the
// run's file and never a row). It reads the registers under `docs/`, and only the files of the run
// it is told to read: `<run>.json` and every `<run>.<phase>.json` under each node's
// `tests/.output/<tier>/runs/`.
//
//     spn-devex behaviours stamp check <run> <path> [--reach repository]   report the rows a write would change
//     spn-devex behaviours stamp write <run> <path> [--reach repository]   write them
//
// A SUBJECT WITH TWO ACTIONS, AND A `tree` PATH. The path may be the repository, a folder inside it
// or one register. The command finds the repository from the path, reads the run's files from the
// whole repository, and stamps only the registers that sit under the path. A path in no repository
// is read as it is: the folder itself holds the run's files and the `docs/` tree.
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
// Exit code: 1 where the named run left no file. Otherwise `check` exits 1 where a row would change
// or a file of the run is malformed, so a pipeline can gate on drift, and `write` exits 1 where a
// file of the run is malformed. A run or a path left out is a usage fault.

import { statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Action, REQUIRED, UsageFault, readWords, repositoryOf, scopeOf, under } from "../../../../../plugin-support-lib/src/lib/command.ts";
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

export const describe = "the one writer of Status and Updated at — stamp behaviour rows from one named run";

/** `--reach` takes one value: the run was the whole of its tiers, across the repository. */
const OPTIONS = { reach: ["repository"] };
const USAGE = "<run> <path> [--reach repository]";

/** The repository a typed path sits in, or the path itself where it sits in none. */
const rootOf = (path: string): string => repositoryOf(path) ?? path;

/**
 * The run and the path, read from the words typed after the action. A word that is no run name is
 * taken for a path typed with no run before it, and the fault names the newest runs under it.
 */
function runAndPath(typed: string[]): { name: string; path: string } {
  if (typed.length === 0) throw new UsageFault("needs a run and a path.");
  if (typed.length > 2) throw new UsageFault("takes one run and one path.");
  const [name, path] = typed;
  if (!RUN_NAME.test(name)) {
    const root = rootOf(resolve(path ?? name));
    throw new UsageFault(typed.length === 1
      ? `needs the run to stamp from, before the path. ${newestRuns(root)}`
      : `takes a run name first, and '${name}' is none: a letter or digit first, then letters, digits, dots, dashes and underscores. ${newestRuns(root)}`);
  }
  return { name, path: scopeOf(path === undefined ? [] : [path], REQUIRED)[0] };
}

/** Both actions are one reading of the run and the registers; `write` is the one that changes files. */
function run(args: string[], write: boolean): number {
  const words = readWords(args, OPTIONS);
  const reachIsRepository = words.given("reach");
  const { name, path } = runAndPath(words.paths);
  const root = rootOf(path);

  const { runs, findings } = namedRun(root, name);
  for (const finding of findings) console.error(`✗ ${finding}`);
  if (runs.length === 0) {
    console.error(findings.length > 0
      ? `✗ Run ${name} left no file that can be read, so nothing was stamped.`
      : `✗ No run named ${name} left a file under ${root}\n  ${newestRuns(root)}`);
    return 1;
  }

  const tiers = [...new Set(runs.map((one) => one.tier))].sort();
  const changes: Change[] = [];
  for (const file of walk(join(root, "docs"))) {
    if (!file.endsWith(".md") || !under(file, [path])) continue;
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
  return findings.length > 0 || (!write && changes.length > 0) ? 1 : 0;
}

export const actions: Record<string, Action> = {
  check: {
    describe: "report the rows one named run would change, and write nothing",
    usage: USAGE,
    run: (args) => run(args, false),
  },
  write: {
    describe: "write what one named run found into the Status and Updated at of the rows under the path",
    usage: USAGE,
    run: (args) => run(args, true),
  },
};
