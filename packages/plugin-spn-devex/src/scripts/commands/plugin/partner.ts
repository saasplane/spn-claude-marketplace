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
//
// IT RUNS FROM A CHECKOUT AND FROM AN INSTALLED PLUGIN. A checkout holds each plugin's sources, and
// the sweep runs them. An installed plugin has no `src/` folder and its shipped sources cannot run
// there, so the proof runs the bundled hooks and gives the same answer from the install cache.

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { isDir, isFile, listdir, read } from "../../lib/payload.ts";

/** One plugin the proof reads: its bare name, the folder that holds its `hooks/`, `scripts/` and `dist/`, and its layout. */
export type PluginHome = { name: string; root: string; installed: boolean };

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

/** Version folder names, oldest first, compared part by part as numbers, so `0.10.2` follows `0.9.9`. */
const byVersion = (left: string, right: string): number => {
  const parts = (version: string): number[] => version.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const [one, other] = [parts(left), parts(right)];
  for (let at = 0; at < Math.max(one.length, other.length); at += 1) {
    if ((one[at] ?? 0) !== (other[at] ?? 0)) return (one[at] ?? 0) - (other[at] ?? 0);
  }
  return 0;
};

/**
 * Every plugin beside this one, in whichever layout this file runs from.
 *
 * `here` is the folder this command's file sits in: `<root>/scripts/commands/plugin` from source,
 * and `<root>/dist/commands/plugin` bundled. `<root>` is the plugin's own home in both.
 *
 * A CHECKOUT names that home `src`, under `packages/plugin-<name>/`. The folder carries the kind
 * prefix and the plugin's own name never does, so the prefix is removed.
 *
 * AN INSTALLED PLUGIN names its home by its version, under `<cache>/<marketplace>/<name>/`. Each
 * sibling plugin is read at this plugin's own version, because the plugins are released together;
 * a sibling that has no such version is read at its newest. RUNNING FROM THE CACHE IS THE TEST THAT
 * MATTERS MOST, because that is the copy a partner's session loads.
 */
export function pluginHomes(here: string = HERE): PluginHome[] {
  const own = resolve(here, "..", "..", "..");
  const family = resolve(own, "..", "..");
  const declares = (root: string): boolean => isFile(join(root, "hooks", "hooks.json"));
  const homes: PluginHome[] = [];
  for (const folder of isDir(family) ? readdirSync(family).sort() : []) {
    if (basename(own) === "src") {
      const root = join(family, folder, "src");
      if (declares(root)) homes.push({ name: folder.replace(/^plugin-/, ""), root: root, installed: false });
      continue;
    }
    const versions = listdir(join(family, folder)).filter((version) => declares(join(family, folder, version))).sort(byVersion);
    const version = versions.includes(basename(own)) ? basename(own) : versions[versions.length - 1];
    if (version !== undefined) homes.push({ name: folder, root: join(family, folder, version), installed: true });
  }
  return homes;
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
const scriptPath = (homes: PluginHome[], plugin: string, script: string): string | null => {
  const home = homes.find((one) => one.name === plugin);
  return home ? findIn(home.root, script) : null;
};

const runnerFor = (script: string) => (/\.(ts|mjs)$/.test(script) ? process.execPath : "python3");

/** One run of the sweep: what the report calls it, the file, and its arguments. */
type HookRun = { label: string; path: string | null; args: string[] };

/**
 * What the sweep runs. From a checkout it is `SCRIPTS`, each found in its plugin's sources. From an
 * installed plugin it is every bundled hook each plugin ships, `dist/events/*.mjs`, with no
 * arguments: the checks and commands of `SCRIPTS` are inside those bundles there.
 */
function hookRuns(homes: PluginHome[]): HookRun[] {
  if (homes.some((home) => !home.installed)) {
    return SCRIPTS.map(([plugin, script, args]) =>
      ({ label: `${script} ${args.join(" ")}`.trim(), path: scriptPath(homes, plugin, script), args: args }));
  }
  return homes.flatMap((home) => listdir(join(home.root, "dist", "events")).filter((file) => file.endsWith(".mjs")).sort()
    .map((file) => ({ label: `${home.name} dist/events/${file}`, path: join(home.root, "dist", "events", file), args: [] })));
}

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

export function declared(homes: PluginHome[] = pluginHomes()): Array<[string, string]> {
  // EVERY PLUGIN BESIDE THIS ONE IS READ, never this plugin alone: a walk that stopped at this
  // plugin's own folder found no sibling and read as clean having swept nothing. The name is the
  // plugin's bare one, which `SCRIPTS` above and every report line already say.
  const found = new Set<string>();
  for (const home of homes) {
    for (const match of read(join(home.root, "hooks", "hooks.json")).matchAll(HOOK_SCRIPT))
      found.add(`${home.name} ${match[1]}`);
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

export function main(argv: string[], here: string = HERE): number {
  // KEEP THE FIXTURE PATH IN ITS OWN NAME. Reassigning it to each plugin's scripts directory would
  // run inside the plugins rather than the fixture, and the delete below would then remove real
  // scripts.
  const fixture = mkdtempSync(join(tmpdir(), "partner-shape-"));
  for (const [name, text] of Object.entries(FIXTURE)) writeFileSync(join(fixture, name), text, "utf8");

  const homes = pluginHomes(here);
  const scripts = declared(homes);
  const failed: Array<[string, string]> = [];
  for (const [plugin, script] of scripts) {
    if (!scriptPath(homes, plugin, script)) {
      failed.push([`${plugin}/${script}`, "declared by hooks.json and absent from the plugin"]);
      console.log(`  ✘ ${plugin}/${script} — declared, no file`);
    }
  }

  const runs = hookRuns(homes);
  // A SWEEP THAT RAN NOTHING PROVES NOTHING. Where no plugin is found beside this file, the proof
  // fails by name, so an empty sweep is never reported as every hook surviving.
  if (runs.length === 0) {
    failed.push(["the sweep", `no hook was found to run from ${here}`]);
    console.log("  ✘ no hook was found to run");
  }
  for (const { label, path, args } of runs) {
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
      execFileSync(runnerFor(path), [path, ...args],
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
  console.log(`\n${runs.length} hook run(s) — every one survives a repo with no foundation.`);
  console.log(`${scripts.length} declared script(s) — every one present.`);
  return 0;
}

export const describe = "run every hook in a fixture holding only what a partner has, never the book";
export function run(args: string[]): number { return Math.min(main(args), 250); }

if (process.argv[1] && basename(process.argv[1]) === "partner.ts") process.exit(run(process.argv.slice(2)));
