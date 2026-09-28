// Fixture proof for `../../helpers/staleness.mjs` — `N101` step 4's acceptance, read literally: a
// source edit without a rebuild turns the check red; rebuilding turns it green. B3c-2's per-plugin
// `tests/unit/dist/t-dist-current.mjs` calls the same helper against the real plugins; this proves
// the helper itself, against a fixture plugin nobody else depends on.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { bannerFor, pluginSourceHash } from "../../../../../scripts/lib/source-hash.mjs";
import { staleness } from "../../helpers/staleness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A minimal plugin shape: one event source file, and an (empty) support-lib sibling folder. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "staleness-fixture-"));
  const pluginDir = join(root, "packages", "plugin-spn-fixture");
  const supportLibDir = join(root, "packages", "plugin-support-lib");
  mkdirSync(join(pluginDir, "src", "scripts", "events"), { recursive: true });
  mkdirSync(join(supportLibDir, "src", "lib"), { recursive: true });
  writeFileSync(join(pluginDir, "src", "scripts", "events", "ping.ts"), 'console.log("ping v1");\n', "utf8");
  return { root, pluginDir, supportLibDir };
}

/** Bundles the fixture's one event exactly as `scripts/build-plugins.mjs` bundles a real one. */
async function buildFixtureBundle(pluginDir, supportLibDir) {
  const entry = join(pluginDir, "src", "scripts", "events", "ping.ts");
  const outfile = join(pluginDir, "src", "dist", "events", "ping.mjs");
  const hash = pluginSourceHash(pluginDir, supportLibDir);
  await esbuild.build({
    entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm", target: "node22",
    banner: { js: bannerFor(hash) },
  });
  return outfile;
}

console.log("=== staleness — a freshly built bundle reads current");
{
  const { root, pluginDir, supportLibDir } = fixture();
  try {
    const bundle = await buildFixtureBundle(pluginDir, supportLibDir);
    const result = staleness(pluginDir, supportLibDir, [bundle]);
    ok("current right after the build", result.current === true, JSON.stringify(result));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== staleness — a source edit with no rebuild is caught, and a rebuild clears it");
{
  const { root, pluginDir, supportLibDir } = fixture();
  try {
    const bundle = await buildFixtureBundle(pluginDir, supportLibDir);
    ok("built once, and current", staleness(pluginDir, supportLibDir, [bundle]).current === true);

    // The source changes; the bundle does not.
    writeFileSync(join(pluginDir, "src", "scripts", "events", "ping.ts"), 'console.log("ping v2");\n', "utf8");
    const edited = staleness(pluginDir, supportLibDir, [bundle]);
    ok("an edited source with no rebuild reads stale", edited.current === false, JSON.stringify(edited));
    ok("the stale bundle is named", edited.bundles[0].path === bundle && edited.bundles[0].current === false);

    // Rebuilding must clear it — the hash it now carries matches the edited source.
    await buildFixtureBundle(pluginDir, supportLibDir);
    const rebuilt = staleness(pluginDir, supportLibDir, [bundle]);
    ok("rebuilding clears the staleness", rebuilt.current === true, JSON.stringify(rebuilt));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== staleness — a bundle imported from plugin-support-lib turns stale when that helper changes");
{
  const { root, pluginDir, supportLibDir } = fixture();
  try {
    writeFileSync(join(supportLibDir, "src", "lib", "shared.ts"), "export const v = 1;\n", "utf8");
    writeFileSync(join(pluginDir, "src", "scripts", "events", "ping.ts"),
      'import { v } from "../../../../plugin-support-lib/src/lib/shared.ts";\nconsole.log("v", v);\n', "utf8");
    const bundle = await buildFixtureBundle(pluginDir, supportLibDir);
    ok("current right after the build", staleness(pluginDir, supportLibDir, [bundle]).current === true);

    writeFileSync(join(supportLibDir, "src", "lib", "shared.ts"), "export const v = 2;\n", "utf8");
    const afterSharedEdit = staleness(pluginDir, supportLibDir, [bundle]);
    ok("editing the imported shared helper (no rebuild) reads stale too",
      afterSharedEdit.current === false, JSON.stringify(afterSharedEdit));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — staleness` : `\n  all ${total} passed — staleness`);
process.exit(failed ? 1 : 0);
