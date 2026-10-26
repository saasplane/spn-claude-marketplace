#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § The build
// a session commits. The chapter is the source of truth; a rule change is edited there first, then
// here, in the same change.
//
// The one command that bundles every entry of all three plugins — `N101` step 2.
//
//     node scripts/build-plugins.mjs            build once
//     node scripts/build-plugins.mjs --watch    rebuild on every source edit, and keep running
//
// FOR EACH PLUGIN: `src/scripts/cli.ts` → `src/dist/cli.mjs` (skipped where a plugin ships no
// `cli.ts` — spn-infra has none today), and every `src/scripts/events/*.ts` → `src/dist/events/*.mjs`
// — the files `hooks.json` names directly, which a hook reaches without going through the command
// dispatcher at all. Bundled with esbuild: `bundle: true`, `platform: 'node'`, `format: 'esm'`,
// `target: 'node22'`. A relative import of `plugin-support-lib` is a real file on disk, so esbuild
// follows it and inlines it the same way it inlines any other local module — the installed plugin's
// `src/dist/` therefore needs nothing outside its own `src/`.
//
// EACH BUNDLE'S BANNER CARRIES A HASH OF THE PLUGIN'S SOURCES (`scripts/lib/source-hash.mjs`) — its
// whole `src/scripts/` tree, plus whichever `plugin-support-lib/src/lib/*.ts` files that source
// actually imports. One hash per plugin, the same value in every bundle that plugin ships, because a
// source edit anywhere under a plugin's own `scripts/` is what the staleness case
// (`plugin-support-lib/tests/helpers/staleness.mjs`) must catch, not only an edit to the one file a
// particular bundle happened to import.
//
// DETERMINISTIC ON PURPOSE. No timestamp anywhere in a bundle's bytes — the banner carries a content
// hash and nothing else — so two builds of the same sources are byte-identical, which is the gate
// this arc names: `node scripts/build-plugins.mjs` run twice must not move a single byte.
//
// EVERY COMMAND SHIPS BUNDLED, ONE FILE PER COMMAND. `commands/<group>/<file>.ts` →
// `dist/commands/<group>/<file>.mjs`, and the bundled `cli.mjs` dispatches there. A command file
// imports `plugin-support-lib` by a path that exists only in this repository — five folders up — so
// the unbundled source reached the installed plugin with its imports pointing outside it, and every
// command failed with ERR_MODULE_NOT_FOUND in a fresh window (008 N119). One bundle per command
// keeps `cli.mjs` the size of the dispatcher, so a run pays for the one command it calls.

import * as esbuild from "esbuild";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bannerFor, pluginSourceHash } from "./lib/source-hash.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const PACKAGES = join(ROOT, "packages");
const SUPPORT_LIB_DIR = join(PACKAGES, "plugin-support-lib");
const ALL_PLUGINS = ["plugin-spn-devex", "plugin-spn-apps", "plugin-spn-infra"];
// Naming plugins on the command line builds only those, so a change to one plugin rebuilds (and
// cleans) that plugin's `dist/` alone, never a neighbour's that another run may be reading.
const named = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const unknown = named.filter((name) => !ALL_PLUGINS.includes(name));
if (unknown.length > 0) {
  console.error(`unknown plugin(s): ${unknown.join(", ")} — expected one of ${ALL_PLUGINS.join(", ")}`);
  process.exit(2);
}
const PLUGINS = named.length > 0 ? named : ALL_PLUGINS;

function isFile(path) { try { return statSync(path).isFile(); } catch { return false; } }
function isDir(path) { try { return statSync(path).isDirectory(); } catch { return false; } }

/** `{ outName: absoluteSourcePath }` — `cli` (if the plugin ships one), every `commands/<group>/<file>`, and every `events/<name>`. */
function entriesOf(pluginDir) {
  const scripts = join(pluginDir, "src", "scripts");
  const entries = {};
  const cli = join(scripts, "cli.ts");
  if (isFile(cli)) entries.cli = cli;
  const commandsDir = join(scripts, "commands");
  if (isDir(commandsDir)) {
    for (const group of readdirSync(commandsDir).sort()) {
      if (group.startsWith("_") || !isDir(join(commandsDir, group))) continue;
      for (const file of readdirSync(join(commandsDir, group)).sort()) {
        if (!file.endsWith(".ts") || file.startsWith("_")) continue;
        entries[`commands/${group}/${file.slice(0, -3)}`] = join(commandsDir, group, file);
      }
    }
  }
  const eventsDir = join(scripts, "events");
  if (isDir(eventsDir)) {
    for (const file of readdirSync(eventsDir).sort()) {
      if (!file.endsWith(".ts")) continue;
      entries[`events/${file.slice(0, -3)}`] = join(eventsDir, file);
    }
  }
  return entries;
}

/** One plugin's esbuild options — shared by a one-shot build and a watch context. */
function buildOptionsFor(pluginName) {
  const pluginDir = join(PACKAGES, pluginName);
  const entryPoints = entriesOf(pluginDir);
  if (Object.keys(entryPoints).length === 0) return null;
  const sourceHash = pluginSourceHash(pluginDir, SUPPORT_LIB_DIR);
  return {
    pluginName,
    outdir: join(pluginDir, "src", "dist"),
    sourceHash,
    options: {
      entryPoints,
      outdir: join(pluginDir, "src", "dist"),
      outExtension: { ".js": ".mjs" },
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
      logLevel: "silent",
      legalComments: "none",
      banner: { js: bannerFor(sourceHash) },
    },
  };
}

/** `dist/` rebuilt from nothing every time, so a renamed or removed source leaves no orphan bundle. */
function cleanDist(outdir) {
  if (existsSync(outdir)) rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });
}

async function buildOnce() {
  let builtAny = false;
  for (const pluginName of PLUGINS) {
    const plan = buildOptionsFor(pluginName);
    if (!plan) {
      console.log(`  skip  ${pluginName} — no cli.ts and no events/, nothing to bundle`);
      continue;
    }
    cleanDist(plan.outdir);
    const result = await esbuild.build({ ...plan.options, metafile: true });
    builtAny = true;
    // `metafile.outputs` keys are relative to esbuild's own working directory (this process's cwd),
    // never to `ROOT` — printed as-is rather than sliced against an assumption that does not hold
    // when the build is invoked from somewhere other than the checkout root.
    const built = Object.keys(result.metafile.outputs)
      .filter((f) => f.endsWith(".mjs")).sort();
    console.log(`  ok    ${pluginName}  (${built.length} bundle(s), source hash ${plan.sourceHash.slice(0, 12)})`);
    for (const file of built) console.log(`          ${file}`);
  }
  return builtAny;
}

async function watch() {
  const contexts = [];
  for (const pluginName of PLUGINS) {
    const plan = buildOptionsFor(pluginName);
    if (!plan) continue;
    cleanDist(plan.outdir);
    const ctx = await esbuild.context(plan.options);
    await ctx.watch();
    contexts.push(ctx);
    console.log(`  watching  ${pluginName}`);
  }
  console.log("\nbuild:plugins:watch running — Ctrl-C to stop");
  const stop = async () => { await Promise.all(contexts.map((c) => c.dispose())); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  // Keep the process alive; esbuild's watcher runs on its own timers.
  await new Promise(() => {});
}

const isWatch = process.argv.includes("--watch");
if (isWatch) {
  await watch();
} else {
  const builtAny = await buildOnce();
  process.exit(builtAny ? 0 : 1);
}
