// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § The build
// a session commits. The chapter is the source of truth; a rule change is edited there first, then
// here, in the same change.
//
// `spn-devex plugin build` — the door to the marketplace's own build, reached from inside a plugin.
// `scripts/build-plugins.mjs` lives once, at the checkout root (`N101` step 2), and this command
// runs it without asking a caller to know that path by hand.
//
//     spn-devex plugin build [<marketplace-root>] [--watch]
//
// AN ACTION OF ITS GROUP. Its one path is the marketplace checkout, or a folder inside it; given
// none, the checkout is found by walking up from the folder the command is run from. Exit code is
// `build-plugins.mjs`'s own. `--watch` runs the same script's watch mode and does not return.

import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { join } from "node:path";
import { FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
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
export const usage = "[<marketplace-root>] [--watch]";

export function run(args: string[], spawn = spawnBuild): number {
  const words = readWords(args, { watch: FLAG });
  if (words.paths.length > 1) throw new UsageFault("takes one marketplace root.");
  const root = marketplaceRoot(words.paths[0] ?? process.cwd());
  if (root === null) {
    console.error("plugin build: no `packages/plugin-*` above this — nothing to bundle");
    return 1;
  }
  const script = join(root, "scripts", "build-plugins.mjs");
  if (!isFile(script)) {
    console.error(`plugin build: no build script at ${script}`);
    return 1;
  }
  // `--watch` is the one option forwarded; the marketplace root is read above and never passed on.
  return spawn(script, words.given("watch") ? ["--watch"] : [], root);
}
