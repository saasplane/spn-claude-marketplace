#!/usr/bin/env node
// The root `test` script: every `packages/*/tests/run.mjs`, in one command.
//
//     node scripts/test-all.mjs [<run>]
//
// Walked, never listed by hand, so a fourth package's suite runs the moment its `tests/run.mjs`
// exists. Each runner already prints its own suites and cases; this only sequences them and turns
// one runner's non-zero into the whole command's non-zero. A run name is handed to every runner, and
// each runner adds what its package proved to the one run file under that name: the file is cleared
// once here, so a reused name never keeps an older run's results.

import { spawnSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workspaceRoot, writeTest } from "../packages/plugin-support-lib/src/lib/timing.ts";
import { APPEND, runFilePath, runNameOf } from "../packages/plugin-support-lib/tests/helpers/run-file.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES = join(ROOT, "packages");
const runName = runNameOf(process.argv.slice(2));
if (runName !== null) rmSync(runFilePath(ROOT, "UNIT", runName), { force: true });

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
  const started = Date.now();
  const ran = spawnSync(process.execPath, [runner, ...process.argv.slice(2)],
    { stdio: ["inherit", "pipe", "inherit"], encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, [APPEND]: runName === null ? "" : "1" } });
  process.stdout.write(ran.stdout ?? "");
  const ok = ran.status === 0;
  if (!ok) failed += 1;
  const last = (word) => { const all = [...(ran.stdout ?? "").matchAll(new RegExp(`\\b(\\d+) ${word}\\b`, "g"))]; return all.length ? Number(all[all.length - 1][1]) : 0; };
  writeTest(workspaceRoot(ROOT), { script: "test-all.mjs", event: "command", tool: null, session: process.env.CLAUDE_CODE_SESSION_ID || null },
    { call: { program: "test-all.mjs", group: null, action: runName }, status: ok ? "SUCCESS" : "FAILURE",
      test: { node: label.split("/")[0], run: runName, tier: "UNIT", tests: { passed: last("passed"), failed: last("failed"), skipped: last("skipped") } },
      ms: Date.now() - started });
}

console.log(failed
  ? `\n${failed} of ${runners.length} package suite(s) FAILING`
  : `\nall ${runners.length} package suite(s) passing`);
process.exit(failed ? 1 : 0);
