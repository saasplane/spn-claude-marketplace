// Where this plugin's own suites leave what a run proved: `tests/.output/<tier>/runs/<run>.json` at
// the repository root, under the name the caller gave, in the shape every stack's runner writes
// (the book's RD.DEVEX.UTILS.071). A reused name replaces that one file, and the tier keeps its 20
// newest.

import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { RUN_NAME } from "../../../plugin-support-lib/src/lib/runs.ts";

export { RUN_NAME };

/** How many run files each tier keeps. */
export const RUNS_KEPT = 20;

/** The run file a named run of one tier writes under a repository. */
export const runFilePath = (repo, tier, run) => join(repo, "tests", ".output", tier.toLowerCase(), "runs", `${run}.json`);

/** The instant a run finished, to the second, in UTC — the string a row's `Updated at` carries unchanged. */
const instant = () => `${new Date().toISOString().slice(0, 19)}Z`;

/**
 * Writes one run's file and prunes the tier's folder to its newest `RUNS_KEPT`. Refuses a name that
 * cannot be a file name, rather than writing somewhere nobody would look.
 */
export function writeRunFile(repo, run, tier, results) {
  if (!RUN_NAME.test(run)) {
    throw new Error(`'${run}' is not a run name: a letter or digit first, then letters, digits, dots, dashes and underscores`);
  }
  const file = runFilePath(repo, tier, run);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ run, tier, phase: null, ranAt: instant(), env: "local", results }, null, 2)}\n`, "utf8");
  const older = readdirSync(dirname(file))
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dirname(file), name))
    .filter((path) => path !== file)
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  for (const stale of older.slice(RUNS_KEPT - 1)) rmSync(stale, { force: true });
  return file;
}
