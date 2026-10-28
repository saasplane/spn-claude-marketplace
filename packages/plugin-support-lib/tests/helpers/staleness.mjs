// The staleness helper — B3c-2's per-plugin `tests/unit/dist/t-dist-current.mjs` and this folder's
// own fixture proof both call this, so there is one implementation of "is this bundle current"
// rather than three that can quietly disagree about what a bundle's banner is supposed to say.
//
// It recomputes a plugin's source hash with the SAME function `scripts/build-plugins.mjs` uses to
// write the banner in the first place (`scripts/lib/source-hash.mjs`) and compares it against what
// each bundle's own banner carries. `N101` step 4's acceptance: editing a source file without
// rebuilding turns this red; rebuilding turns it green.

import { readFileSync } from "node:fs";
import { bundledHash, pluginSourceHash } from "../../../../scripts/lib/source-hash.mjs";

/** One bundle's staleness: whether its banner's hash matches `expected`. */
function checkOne(path, expected) {
  let found = null;
  try { found = bundledHash(readFileSync(path, "utf8")); } catch { found = null; }
  return { path, found, current: found !== null && found === expected };
}

/**
 * Whether every bundle in `bundlePaths` is current for the plugin at `pluginDir`.
 *
 * @param pluginDir     a plugin's package folder, e.g. `packages/plugin-spn-devex`
 * @param supportLibDir `packages/plugin-support-lib`
 * @param bundlePaths   every built `.mjs` file that plugin ships (`dist/cli.mjs`, `dist/events/*.mjs`)
 * @returns { expected, bundles: [{path, found, current}], current: boolean }
 */
export function staleness(pluginDir, supportLibDir, bundlePaths) {
  const expected = pluginSourceHash(pluginDir, supportLibDir);
  const bundles = bundlePaths.map((path) => checkOne(path, expected));
  return { expected, bundles, current: bundles.length > 0 && bundles.every((b) => b.current) };
}
