// The bundle-parity helper — B3c-2's per-plugin `tests/unit/dist/t-bundle-parity.mjs` and this
// folder's own fixture proof both call this: run a bundle and the source it was built from over the
// same argv and stdin, and compare stdout, stderr and exit code.
//
// `spawnSync`, never `execFileSync` — `execFileSync` only hands back `stderr` on a NON-ZERO exit,
// so a case comparing two runs that both succeed would silently compare `undefined` against
// `undefined` and call that a match. `spawnSync` returns `stdout`/`stderr`/`status` the same shape
// whichever way the process exits, which is what makes the two sides genuinely comparable.

import { spawnSync } from "node:child_process";

/** One entry run to completion, its stdout/stderr/exit code captured either way. */
function runOne(entryPath, argv, input) {
  const result = spawnSync(process.execPath, [entryPath, ...argv], {
    input: input ?? "",
    encoding: "utf8",
  });
  if (result.error) return { stdout: "", stderr: String(result.error), code: -1 };
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    code: result.status ?? (result.signal ? -1 : 0),
  };
}

/**
 * Run `sourcePath` (a `.ts` entry, type-stripped by Node) and `bundlePath` (its committed `.mjs`
 * build) with the same argv and stdin, and report whether they agree.
 *
 * @param sourcePath  the `.ts` file a bundle was built from
 * @param bundlePath  the built `.mjs` file
 * @param argv        argv passed to both, after the entry path
 * @param input       stdin text passed to both — `""` when neither reads stdin
 */
export function compareRun(sourcePath, bundlePath, { argv = [], input = "" } = {}) {
  const source = runOne(sourcePath, argv, input);
  const bundle = runOne(bundlePath, argv, input);
  return {
    source,
    bundle,
    parity: source.stdout === bundle.stdout && source.stderr === bundle.stderr && source.code === bundle.code,
  };
}
