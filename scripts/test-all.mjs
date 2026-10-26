#!/usr/bin/env node
// The root `test` script: every `packages/*/tests/run.mjs`, in one command.
//
//     node scripts/test-all.mjs [<run>]
//
// Walked, never listed by hand, so a fourth package's suite runs the moment its `tests/run.mjs`
// exists. Each runner already prints its own suites and cases; this only sequences them and turns
// one runner's non-zero into the whole command's non-zero. A run name is handed to every runner, and
// a runner that writes what its run proved writes it under that name.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES = join(ROOT, "packages");

function isDir(path) { try { return statSync(path).isDirectory(); } catch { return false; } }
function isFile(path) { try { return statSync(path).isFile(); } catch { return false; } }

const runners = readdirSync(PACKAGES)
  .filter((entry) => isDir(join(PACKAGES, entry)))
  .map((entry) => join(PACKAGES, entry, "tests", "run.mjs"))
  .filter(isFile)
  .sort();

let failed = 0;
for (const runner of runners) {
  const label = runner.slice(PACKAGES.length + 1, -"/tests/run.mjs".length);
  console.log(`\n── ${label} ──────────────────────────────────────────`);
  try {
    execFileSync(process.execPath, [runner, ...process.argv.slice(2)], { stdio: "inherit" });
  } catch {
    failed += 1;
  }
}

console.log(failed
  ? `\n${failed} of ${runners.length} package suite(s) FAILING`
  : `\nall ${runners.length} package suite(s) passing`);
process.exit(failed ? 1 : 0);
