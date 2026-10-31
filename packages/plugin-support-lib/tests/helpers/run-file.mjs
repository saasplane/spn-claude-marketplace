// Where every package's suite runner leaves what a run proved: `tests/.output/<tier>/runs/<run>.json` at
// the repository root, under the name the caller gave, in the shape every stack's runner writes
// (the book's RULE.DEVEX.UTILS.071). A reused name replaces that one file, and the tier keeps its 20
// newest. It lives once, here in the shared folder, because each plugin's runner writes the same file.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { RUN_NAME } from "../../src/lib/runs.ts";

export { RUN_NAME };

/** How many run files each tier keeps. */
export const RUNS_KEPT = 20;

/** The behaviour id a case's title carries in brackets — the book's rule that a test title carries the id. */
export const ID = /\[([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+){2})\]/;

/**
 * Set by the full run (`scripts/test-all.mjs`) for every package's runner, so each adds its results to the
 * one run file rather than replacing what the package before it proved. A runner called on its own replaces.
 */
export const APPEND = "SPN_RUN_APPEND";

/**
 * Whether this runner adds to the run file, read once and then taken out of the environment: the suites
 * inherit it, and a suite that runs a runner of its own must not add to a file it never meant to.
 */
export function takeAppend() {
  const append = process.env[APPEND] === "1";
  delete process.env[APPEND];
  return append;
}

/** The run file a named run of one tier writes under a repository. */
export const runFilePath = (repo, tier, run) => join(repo, "tests", ".output", tier.toLowerCase(), "runs", `${run}.json`);

/** The instant a run finished, to the second, in UTC — the string a row's `Updated at` carries unchanged. */
const instant = () => `${new Date().toISOString().slice(0, 19)}Z`;

/** The run's name the caller gave — the first argument that is not an option — or null. A name that cannot be a file exits. */
export function runNameOf(argv) {
  const name = argv.find((arg) => !arg.startsWith("--")) ?? null;
  if (name !== null && !RUN_NAME.test(name)) {
    console.error(`'${name}' is not a run name: a letter or digit first, then letters, digits, dots, dashes and underscores.`);
    process.exit(2);
  }
  return name;
}

/** What one suite's output proved: each PASS or FAIL line whose title carries an id. A case with no id proves nothing to the register. */
export function resultsOf(out, tier) {
  const results = [];
  for (const line of out.split("\n")) {
    const verdict = /^\s*(PASS|FAIL)\s+(.*)$/.exec(line);
    const id = verdict && ID.exec(verdict[2]);
    if (id) results.push({ id: id[1], tier, status: verdict[1] === "PASS" ? "SUCCESS" : "FAILED", title: verdict[2].trim() });
  }
  return results;
}

/**
 * Writes one run's file and prunes the tier's folder to its newest `RUNS_KEPT`. Refuses a name that
 * cannot be a file name, rather than writing somewhere nobody would look. With `append`, the results
 * join those a file of the same run already holds.
 */
export function writeRunFile(repo, run, tier, results, append = false) {
  if (!RUN_NAME.test(run)) {
    throw new Error(`'${run}' is not a run name: a letter or digit first, then letters, digits, dots, dashes and underscores`);
  }
  const file = runFilePath(repo, tier, run);
  mkdirSync(dirname(file), { recursive: true });
  const before = append && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).results ?? [] : [];
  writeFileSync(file, `${JSON.stringify({ run, tier, phase: null, ranAt: instant(), env: "local", results: [...before, ...results] }, null, 2)}\n`, "utf8");
  const older = readdirSync(dirname(file))
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dirname(file), name))
    .filter((path) => path !== file)
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  for (const stale of older.slice(RUNS_KEPT - 1)) rmSync(stale, { force: true });
  return file;
}

/** Writes a named run's file and says where, or says that no run name was given. */
export function recordRun(repo, run, tier, results, append = false) {
  if (run === null) {
    console.log("  no run name given, so no run file was written — name one to leave what this run proved: node run.mjs <run>");
    return null;
  }
  const file = writeRunFile(repo, run, tier, results, append);
  console.log(`  ${results.length} case(s) carry a behaviour id -> ${file.slice(repo.length + 1)}`);
  return file;
}
