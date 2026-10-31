// Where every package's suite runner leaves what a run proved: `tests/.output/<tier>/runs/<run>.json` at
// the repository root, under the name the caller gave, in the shape every stack's runner writes
// (the book's RULE.DEVEX.UTILS.071). A reused name replaces that one file, and the tier keeps its 20
// newest. It lives once, here in the shared folder, because each plugin's runner writes the same file.

import { RUN_NAME, RUNS_KEPT, runFilePath, writeRunFile } from "../../src/lib/runs.ts";

// THE WRITER IS THE LIBRARY'S, so a runner and a plugin command that records a run write one shape.
export { RUN_NAME, RUNS_KEPT, runFilePath, writeRunFile };

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
