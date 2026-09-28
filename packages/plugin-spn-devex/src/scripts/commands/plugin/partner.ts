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
//     spn-devex plugin partner [--keep]     run it; --keep leaves the fixture for inspection
//
// Run it after touching any hook, and before any release of the plugins.

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { isDir, isFile, listdir, read } from "../../lib/payload.ts";

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
  ["spn-devex", "docs/prose.ts", ["."]],
  ["spn-devex", "split-plan.ts", ["."]],
  ["spn-apps", "contract-cycle.ts", ["."]],
  ["spn-devex", "orientation.ts", []],
  // Runs in the fixture, which holds plugins and NO book. That is a partner's shape exactly, and the
  // check must print one line and exit clean rather than report every file as drifted. Named
  // `restates/check.ts` — there are two files named bare `check.ts` in this plugin
  // (`commands/behaviours/check.ts` is the other), so the parent folder disambiguates which one
  // `findIn` below walks to.
  ["spn-devex", "restates/check.ts", []],
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
 * The marketplace repo puts plugins side by side under `packages/`, one folder per plugin, named
 * `plugin-<name>` — a plain name never carries the kind prefix, so both spellings are tried; the
 * installed cache puts a VERSION directory between the plugin and its files, named by the plugin's
 * own `name` field alone. RUNNING FROM THE CACHE IS THE TEST THAT MATTERS MOST, because that is the
 * copy a partner's session actually loads.
 */
export function pluginRoot(name: string, folder: string): string | null {
  const family = resolve(HERE, "..", "..", "..", "..", "..");   // holds every plugin folder beside us
  // A PLUGIN'S CODE SITS UNDER `src/`, and `hooks/` holds only `hooks.json`. Two spellings of the
  // folder are tried because the checkout names it `plugin-<name>` while a partner's `name` field —
  // and the installed cache below — never carries that prefix.
  for (const candidate of [name, `plugin-${name}`]) {
    const direct = join(family, candidate, "src", folder);
    if (isDir(direct)) return direct;                 // repo layout
  }
  const versioned = join(resolve(family, ".."), name);   // cache layout
  if (isDir(versioned)) {
    const picks = listdir(versioned).filter((d) => isDir(join(versioned, d, "src", folder))).sort();
    if (picks.length) return join(versioned, picks[picks.length - 1], "src", folder);
  }
  return null;
}

/**
 * The folder a plugin keeps a given file in — FOUND, never guessed.
 *
 * The folder set is the shape of a plugin's `hooks/`, and a file is wherever it is. A fixed folder
 * list goes stale the moment the tree is rearranged; a walk costs one directory scan and survives
 * the next move.
 */
const findIn = (base: string, script: string): string | null => {
  const direct = join(base, script);
  if (isFile(direct)) return direct;
  for (const entry of listdir(base)) {
    const next = join(base, entry);
    if (!isDir(next)) continue;
    const found = findIn(next, script);
    if (found) return found;
  }
  return null;
};

/** The file behind a declared script, wherever the plugin keeps it. */
const scriptPath = (plugin: string, script: string): string | null => {
  const root = pluginRoot(plugin, ".");
  return root ? findIn(root, script) : null;
};

const runnerFor = (script: string) => (script.endsWith(".ts") ? process.execPath : "python3");

/**
 * Every script named by a `hooks.json`, as [plugin, script] pairs.
 *
 * A HOOK DECLARED WITH NO FILE BEHIND IT is the failure this reads for. `SCRIPTS` above is hand-kept,
 * so it can agree with itself while `hooks.json` points at a script nobody shipped. A partner meets
 * that as a broken agent, because the declaration is what their session loads.
 *
 * `hooks.json` names `"${CLAUDE_PLUGIN_ROOT}"/scripts/events/<script>.ts` (source) or
 * `.../dist/events/<script>.mjs` (bundled), so a script is matched only under one of those two
 * folders — found here rather than by a run turning red, which is exactly the class of defect this
 * sweep exists to stop.
 */
export const HOOK_SCRIPT = /\/(?:scripts\/events|dist\/events)\/([A-Za-z0-9_.-]+\.(?:ts|mjs))/g;

export function declared(): Array<[string, string]> {
  // `family` IS THE FOLDER HOLDING EVERY PLUGIN, BESIDE THIS ONE — `packages/`, the same folder
  // `pluginRoot` above resolves to. A prior version climbed one `..` short and landed on this
  // plugin's own folder, so the walk below found no sibling plugin and read as clean having swept
  // nothing.
  const family = resolve(HERE, "..", "..", "..", "..", "..");
  const found = new Set<string>();
  for (const folder of isDir(family) ? readdirSync(family).sort() : []) {
    const manifest = join(family, folder, "src", "hooks", "hooks.json");
    if (!isFile(manifest)) continue;
    // THE BARE NAME, NEVER THE FOLDER'S OWN — `SCRIPTS` above and every report line already say
    // `spn-devex`, and a folder is `plugin-spn-devex` only because `02-shape.md` prefixes kind
    // folders under `packages/`; the plugin's own name never carries that prefix.
    const plugin = folder.replace(/^plugin-/, "");
    for (const match of read(manifest).matchAll(HOOK_SCRIPT))
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
  // KEEP THE FIXTURE PATH IN ITS OWN NAME. Reassigning it to each plugin's scripts directory would
  // run inside the plugins rather than the fixture, and the delete below would then remove real
  // scripts.
  const fixture = mkdtempSync(join(tmpdir(), "partner-shape-"));
  for (const [name, text] of Object.entries(FIXTURE)) writeFileSync(join(fixture, name), text, "utf8");

  const failed: Array<[string, string]> = [];
  for (const [plugin, script] of declared()) {
    if (!scriptPath(plugin, script)) {
      failed.push([`${plugin}/${script}`, "declared by hooks.json and absent from the plugin"]);
      console.log(`  ✘ ${plugin}/${script} — declared, no file`);
    }
  }

  for (const [plugin, script, args] of SCRIPTS) {
    const path = scriptPath(plugin, script) ?? "";
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

export const describe = "run every hook in a fixture holding only what a partner has, never the book";
export function run(args: string[]): number { return Math.min(main(args), 250); }

if (process.argv[1] && basename(process.argv[1]) === "partner.ts") process.exit(run(process.argv.slice(2)));
