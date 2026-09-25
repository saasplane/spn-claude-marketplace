#!/usr/bin/env node
// RESTATES: CONCEPT.md § DevEx Delivery — a partner receives the public marketplace and neither the
// foundation book nor its registers.
//
// Prove every hook runs in a repo that holds the plugins and nothing else.
//
// So a hook may read the book where it exists and may never require it. A check that crashes on its
// absence takes the whole hook down, and the partner sees a broken agent rather than a missing input.
//
// This builds a repo carrying only what a partner actually has — `sprepo.json`, `spkind.json`,
// `CONCEPT.md`, `README.md` — and runs every hook against it. A crash is a failure; a finding is not.
// Findings are that repo's business. SILENCE ON A MISSING INPUT IS THE CONTRACT.
//
//     node partner-shape.ts [--keep]     run it; --keep leaves the fixture for inspection
//
// Run it after touching any hook, and before any release of the plugins.
//
// PORTED WITH THE HOOKS IT TESTS. It runs the TypeScript wherever a plugin's `hooks/` keeps it and
// whatever Python is still under `hooks/scripts/`, choosing the interpreter from the extension — so it keeps working
// through a port rather than only at its two ends.

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { isDir, isFile, listdir, read } from "../lib/payload.ts";

const HERE = resolve(import.meta.dirname);

const FIXTURE: Record<string, string> = {
  "sprepo.json": '{"world":"APPS","stacks":["spn-devex","spn-apps"]}\n',
  "spkind.json": '{"kind":"APP_WEB","config":null}\n',
  "CONCEPT.md": "# Partner Platform — Concept\n\n## What this is\n\n" +
    "A partner platform built on SaaS Plane. You read this to learn its shape.\n\n" +
    "### Boundary\n\nOne deployable, one API face, one browser face.\n",
  "README.md": "# Partner Platform\n\nYou run this locally with `pnpm dev`.\n",
};

// Every hook, with the arguments it takes when swept over a tree.
const SCRIPTS: Array<[plugin: string, script: string, args: string[]]> = [
  ["spn-devex", "coherence.ts", ["."]],
  ["spn-devex", "doc-check.ts", ["."]],
  ["spn-devex", "prose-triage.ts", ["."]],
  ["spn-devex", "split-plan.ts", ["."]],
  ["spn-devex", "contract-cycle.ts", ["."]],
  ["spn-devex", "orientation.ts", []],
  // Runs in the fixture, which holds plugins and NO book. That is a partner's shape exactly, and the
  // check must print one line and exit clean rather than report every file as drifted.
  ["spn-devex", "restate-drift.ts", []],
  // Reads its event from stdin and gets none here. It must exit clean rather than block or crash: it
  // guards a file the loop legitimately uses, and a guard that takes the chain down is worse than the
  // exposure it was written for.
  ["spn-devex", "env-seat.ts", []],
  // Same contract, and the same reason to prove it here: it fires on a source write, which is the
  // most common call a partner makes, and it opens no file of its own — so getting no event at all
  // must leave it silent rather than throwing where the whole chain would go down with it.
  ["spn-devex", "comment-check.ts", []],
  // The dispatcher, with no event to dispatch. Same contract as the guard it carries.
  ["spn-devex", "pretooluse.ts", []],
  // Reads the reply from stdin and gets none here, so it must exit clean. It runs on `Stop`, which is
  // the end of every turn — a crash there would report on work already finished.
  ["spn-devex", "stop.ts", []],
  ["spn-devex", "closed.ts", []],
  // The `spn-apps` half. Its dispatcher reads its event from stdin and gets none here, so it must
  // exit clean; the six checks behind it are swept the way the core tools are.
  ["spn-apps", "pretooluse.ts", []],
  ["spn-apps", "coverage.ts", ["--check", "route-e2e", "."]],
  ["spn-apps", "coverage.ts", ["--check", "spec-restore", "."]],
  ["spn-apps", "coverage.ts", ["--check", "foreign-double", "."]],
  ["spn-apps", "enablement-grammar.ts", ["."]],
  ["spn-apps", "host-assertion.ts", ["."]],
  ["spn-apps", "read-verb-naming.ts", ["."]],
  ["spn-apps", "await-sequencing.ts", ["."]],
  ["spn-apps", "assertion-message.ts", ["."]],
];

/**
 * Where a plugin's runnable files sit, in either layout this script legitimately runs from, and
 * whichever language the file is in.
 *
 * The marketplace repo puts plugins side by side (`plugins/spn-devex/hooks/…`). The installed cache
 * puts a VERSION directory between the plugin and its files. RUNNING FROM THE CACHE IS THE TEST THAT
 * MATTERS MOST, because that is the copy a partner's session actually loads.
 */
export function pluginRoot(name: string, folder: string): string | null {
  const family = resolve(HERE, "..", "..", "..");   // holds spn-devex beside us
  const direct = join(family, name, "hooks", folder);
  if (isDir(direct)) return direct;                 // repo layout
  const versioned = join(resolve(family, ".."), name);   // cache layout
  if (isDir(versioned)) {
    const picks = listdir(versioned).filter((d) => isDir(join(versioned, d, "hooks", folder))).sort();
    if (picks.length) return join(versioned, picks[picks.length - 1], "hooks", folder);
  }
  return null;
}

/**
 * The folder a plugin keeps a given file in — FOUND, never guessed.
 *
 * This was a guess: TypeScript meant `checks/` in `spn-apps` and `docs/` in `spn-devex`, Python
 * meant `scripts/`. Two things were wrong with that. It hard-coded one plugin's name into a tool
 * meant to sweep any of them, and it went stale the moment the tree was arranged by nature — a
 * sweep then reported every file as *declared, no file*, which reads exactly like the outage it
 * exists to catch.
 *
 * So it LOOKS. The folder set is the shape of a plugin's `hooks/`, and a file is wherever it is.
 */
const HOOK_FOLDERS = ["events", "checks", "tools", "lib", "docs", "scripts"];

const folderFor = (plugin: string, script: string): string | null => {
  for (const folder of HOOK_FOLDERS) {
    const where = pluginRoot(plugin, folder);
    if (where && isFile(join(where, script))) return folder;
  }
  return null;
};
const runnerFor = (script: string) => (script.endsWith(".ts") ? process.execPath : "python3");

/**
 * Every script named by a `hooks.json`, as [plugin, script] pairs.
 *
 * A HOOK DECLARED WITH NO FILE BEHIND IT is the failure this reads for. `SCRIPTS` above is hand-kept,
 * so it can agree with itself while `hooks.json` points at a script nobody shipped. A partner meets
 * that as a broken agent, because the declaration is what their session loads.
 */
export function declared(): Array<[string, string]> {
  const family = resolve(HERE, "..", "..", "..");
  const found = new Set<string>();
  for (const plugin of isDir(family) ? readdirSync(family).sort() : []) {
    const manifest = join(family, plugin, "hooks", "hooks.json");
    if (!isFile(manifest)) continue;
    for (const match of read(manifest).matchAll(/\/hooks\/[A-Za-z0-9_-]+\/([A-Za-z0-9_.-]+\.(?:py|sh|ts))/g))
      found.add(`${plugin} ${match[1]}`);
  }
  return [...found].sort().map((entry) => entry.split(" ") as [string, string]);
}

/**
 * Whether this run CRASHED, as opposed to reporting findings.
 *
 * Several of these tools use their exit code as a finding count, so a non-zero exit proves nothing.
 * A crash is a stack trace: Python opens one with `Traceback`, and node prints indented `at` frames.
 * `stop.ts` writes its warnings to stderr and exits 2 — which is a finding, and must not read as one.
 */
function crashed(stderr: string): boolean {
  return stderr.includes("Traceback (most recent call last)")
      || /\n\s+at\s/.test(stderr)
      || /^[A-Za-z]*Error:/m.test(stderr);
}

export function main(argv: string[]): number {
  // KEEP THE FIXTURE PATH IN ITS OWN NAME. This loop used to reassign `root` to each plugin's scripts
  // directory, so the run happened inside the plugins rather than the fixture, and the delete below
  // then REMOVED the last plugin's scripts folder. That is how spn-apps lost three scripts in
  // 88ac5ca — the verifier removed its own test subjects, and the deletion was committed.
  const fixture = mkdtempSync(join(tmpdir(), "partner-shape-"));
  for (const [name, text] of Object.entries(FIXTURE)) writeFileSync(join(fixture, name), text, "utf8");

  const failed: Array<[string, string]> = [];
  for (const [plugin, script] of declared()) {
    const folder = folderFor(plugin, script);
    const where = folder === null ? null : pluginRoot(plugin, folder);
    if (!where || !isFile(join(where, script))) {
      failed.push([`${plugin}/${script}`, "declared by hooks.json and absent from the plugin"]);
      console.log(`  ✘ ${plugin}/${script} — declared, no file`);
    }
  }

  for (const [plugin, script, args] of SCRIPTS) {
    const folder = folderFor(plugin, script);
    const where = folder === null ? null : pluginRoot(plugin, folder);
    const path = where ? join(where, script) : "";
    const label = `${script} ${args.join(" ")}`.trim();
    if (!path || !isFile(path)) {
      failed.push([label, "not found"]);
      console.log(`  ✘ ${label}`);
      continue;
    }
    // stdin is CLOSED, not inherited. A PreToolUse hook reads its event from stdin, so running one
    // here without this waits forever on the parent's terminal — and a harness that hangs is a
    // harness nobody runs.
    let stderr = "";
    try {
      execFileSync(runnerFor(script), [path, ...args],
        { cwd: fixture, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    } catch (error) {
      stderr = String((error as { stderr?: string }).stderr ?? "");
    }
    if (crashed(stderr)) {
      failed.push([label, stderr.trim().split("\n").filter(Boolean).pop()?.slice(0, 96) ?? "crashed"]);
      console.log(`  ✘ ${label}`);
    } else {
      console.log(`  ✔ ${label}`);
    }
  }

  if (argv.includes("--keep")) console.log(`\nfixture kept at ${fixture}`);
  else rmSync(fixture, { recursive: true, force: true });

  if (failed.length) {
    console.log(`\n${failed.length} hook(s) failed the partner shape:`);
    for (const [label, why] of failed) console.log(`    ${label}\n      ${why}`);
    console.log("\n  A hook reads the book where it exists and never requires it,");
    console.log("  and every script a hooks.json declares ships beside it.");
    return failed.length;
  }
  console.log(`\n${SCRIPTS.length} hook run(s) — every one survives a repo with no foundation.`);
  console.log(`${declared().length} declared script(s) — every one present.`);
  return 0;
}

if (process.argv[1] && basename(process.argv[1]) === "partner-shape.ts")
  process.exit(Math.min(main(process.argv.slice(2)), 250));
