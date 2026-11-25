#!/usr/bin/env node
// The root `test` script: every `packages/*/tests/run.mjs`, in one command.
//
//     node scripts/test-all.mjs [<run>] [--all]
//
// A PACKAGE WHOSE INPUTS ARE AS THEY WERE WHEN ITS SUITE LAST PASSED reuses that green run (scripts/lib/package-scope.mjs): its
// results join the run file, and the line says which run they came from. Every other package runs, and `--all` runs them all.
// The last lines name which ran and which were reused, and `tests/.output/unit/green/summary.json` keeps them for the release.
//
// Walked, never listed by hand, so a fourth package's suite runs the moment its `tests/run.mjs`
// exists. Each runner already prints its own suites and cases; this only sequences them and turns
// one runner's non-zero into the whole command's non-zero. A run name is handed to every runner, and
// each runner adds what its package proved to the one run file under that name: the file is cleared
// once here, so a reused name never keeps an older run's results.

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workspaceRoot, writeTest } from "../packages/plugin-support-lib/src/lib/timing.ts";
import { APPEND, resultsOf, runFilePath, runNameOf, writeRunFile } from "../packages/plugin-support-lib/tests/helpers/run-file.mjs";
import { dropGreen, greenFile, planRun, writeGreen } from "./lib/package-scope.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES = join(ROOT, "packages");
const all = process.argv.includes("--all");
const given = process.argv.slice(2).filter((arg) => arg !== "--all");
const runName = runNameOf(given);
if (runName !== null) rmSync(runFilePath(ROOT, "UNIT", runName), { force: true });

function isDir(path) { try { return statSync(path).isDirectory(); } catch { return false; } }
function isFile(path) { try { return statSync(path).isFile(); } catch { return false; } }

const runners = readdirSync(PACKAGES)
  .filter((entry) => isDir(join(PACKAGES, entry)))
  .map((entry) => join(PACKAGES, entry, "tests", "run.mjs"))
  .filter(isFile)
  .sort();

const plan = new Map(planRun(ROOT, { all }).map((one) => [one.label, one]));
const ranNow = [], reused = [];
let failed = 0;
for (const runner of runners) {
  const label = runner.slice(PACKAGES.length + 1, -"/tests/run.mjs".length);
  console.log(`\n── ${label} ──────────────────────────────────────────`);
  const scoped = plan.get(label);
  if (scoped?.reuse) {
    const { run: from, ranAt, results } = scoped.green;
    if (runName !== null) writeRunFile(ROOT, runName, "UNIT", results, true);
    console.log(`  reused: its inputs are as they were when it passed in ${from ?? "an unnamed run"} at ${ranAt} · ${results.length} result(s)`);
    reused.push({ package: label, from: from ?? null, ranAt });
    continue;
  }
  ranNow.push(label);
  const started = Date.now();
  const ran = spawnSync(process.execPath, [runner, ...given],
    { stdio: ["inherit", "pipe", "inherit"], encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, [APPEND]: runName === null ? "" : "1" } });
  process.stdout.write(ran.stdout ?? "");
  const ok = ran.status === 0;
  if (!ok) failed += 1;
  // A GREEN SUITE LEAVES ITS RECORD, read from the cases it printed; a red one takes its record away, so it is never reused.
  if (ok && scoped) writeGreen(ROOT, label, { fingerprint: scoped.fingerprint, run: runName, ranAt: `${new Date().toISOString().slice(0, 19)}Z`, results: resultsOf(ran.stdout ?? "", "UNIT") });
  else dropGreen(ROOT, label);
  const last = (word) => { const all = [...(ran.stdout ?? "").matchAll(new RegExp(`\\b(\\d+) ${word}\\b`, "g"))]; return all.length ? Number(all[all.length - 1][1]) : 0; };
  writeTest(workspaceRoot(ROOT), { script: "test-all.mjs", event: "command", tool: null, session: process.env.CLAUDE_CODE_SESSION_ID || null },
    { call: { program: "test-all.mjs", group: null, action: runName }, status: ok ? "SUCCESS" : "FAILURE",
      test: { node: label.split("/")[0], run: runName, tier: "UNIT", tests: { passed: last("passed"), failed: last("failed"), skipped: last("skipped") } },
      ms: Date.now() - started });
}

const summary = { run: runName, at: `${new Date().toISOString().slice(0, 19)}Z`, ran: ranNow, reused };
mkdirSync(dirname(greenFile(ROOT, "summary")), { recursive: true });
writeFileSync(greenFile(ROOT, "summary"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`\nran: ${ranNow.join(", ") || "none"} · reused: ${reused.map((one) => `${one.package} (${one.from ?? "unnamed"})`).join(", ") || "none"}`);
console.log(failed
  ? `\n${failed} of ${runners.length} package suite(s) FAILING`
  : `\nall ${runners.length} package suite(s) passing`);
process.exit(failed ? 1 : 0);
