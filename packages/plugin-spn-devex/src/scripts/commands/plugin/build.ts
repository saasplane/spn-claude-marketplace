#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § The build
// a session commits. The chapter is the source of truth; a rule change is edited there first, then
// here, in the same change.
//
// `spn-devex plugin build` — the door to the marketplace's own build, reached from inside a plugin.
// `scripts/build-plugins.mjs` lives once, at the checkout root (`N101` step 2), and this command
// runs it without asking a caller to know that path by hand.
//
//     spn-devex plugin build [marketplace-root] [--watch]
//
// Exit code is `build-plugins.mjs`'s own. `--watch` runs the same script's watch mode and does not return.

import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { marketplaceRoot } from "./paths.ts";

export const describe = "bundle every plugin's cli and events, via the marketplace root's scripts/build-plugins.mjs";

function isFile(path: string): boolean { try { return statSync(path).isFile(); } catch { return false; } }

/** Runs `scripts/build-plugins.mjs` and hands back its exit code, unchanged. */
function spawnBuild(script: string, passthrough: string[], cwd: string): number {
  const result = spawnSync(process.execPath, [script, ...passthrough], { cwd, stdio: "inherit" });
  return result.status ?? 1;
}

/**
 * `spawn` is injectable so a fixture test can stand in for `spawnBuild` and prove the path-finding
 * and flag-passthrough here without spawning a real esbuild.
 */
export function run(args: string[], spawn = spawnBuild): number {
  const from = args.find((a) => !a.startsWith("--")) ?? process.cwd();
  const root = marketplaceRoot(from);
  if (root === null) {
    console.error("plugin build: no `packages/plugin-*` above this — nothing to bundle");
    return 1;
  }
  const script = join(root, "scripts", "build-plugins.mjs");
  if (!isFile(script)) {
    console.error(`plugin build: no build script at ${script}`);
    return 1;
  }
  // `--watch` is the only flag forwarded; the optional marketplace-root path is consumed above.
  const passthrough = args.filter((a) => a.startsWith("--"));
  return spawn(script, passthrough, root);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
