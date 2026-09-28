// `plugin paths` (RD.DEVEX.070) — a `${CLAUDE_PLUGIN_ROOT}` path a skill, a ref or `hooks.json`
// names must resolve to a file the plugin actually ships. Built with a known-bad case first, per
// `N101` step 6b's acceptance: a broken path is reported, and every current plugin path resolves.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { findDead, marketplaceRoot, run } from "../../../../../src/scripts/commands/plugin/paths.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

/** A fixture plugin: `src/scripts/tools/real.ts` exists; its skill names both a real and a dead path. */
function fixturePlugin() {
  const root = mkdtempSync(join(tmpdir(), "plugin-paths-"));
  const plugin = join(root, "packages", "plugin-spn-fixture");
  mkdirSync(join(plugin, "src", ".claude-plugin"), { recursive: true });
  writeFileSync(join(plugin, "src", ".claude-plugin", "plugin.json"), '{"name":"spn-fixture"}\n', "utf8");
  mkdirSync(join(plugin, "src", "scripts", "tools"), { recursive: true });
  writeFileSync(join(plugin, "src", "scripts", "tools", "real.ts"), "// real\n", "utf8");
  mkdirSync(join(plugin, "src", "skills", "test"), { recursive: true });
  writeFileSync(join(plugin, "src", "skills", "test", "SKILL.md"),
    'run it:\n\n    node "${CLAUDE_PLUGIN_ROOT}"/scripts/tools/real.ts .\n' +
    '    node "${CLAUDE_PLUGIN_ROOT}"/scripts/tools/ghost.ts .\n', "utf8");
  return { root, plugin };
}

console.log("=== plugin paths — known-bad: a path nobody ships");
{
  const { root, plugin } = fixturePlugin();
  try {
    const dead = findDead(plugin);
    ok("the real path is not reported", !dead.some((d) => d.named.includes("real.ts")), JSON.stringify(dead));
    ok("the ghost path is reported, with its file and line", dead.some((d) => d.named === "scripts/tools/ghost.ts" && d.file.endsWith("SKILL.md")), JSON.stringify(dead));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== plugin paths — marketplaceRoot finds the folder holding packages/plugin-*");
{
  const { root, plugin } = fixturePlugin();
  try {
    ok("found from the marketplace root itself", marketplaceRoot(root) === root);
    ok("found by walking up from inside a plugin", marketplaceRoot(join(plugin, "src", "skills")) === root);
    const nowhere = mkdtempSync(join(tmpdir(), "no-packages-"));
    try { ok("a folder with no packages/plugin-* finds nothing", marketplaceRoot(nowhere) === null); }
    finally { rmSync(nowhere, { recursive: true, force: true }); }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log("\n=== plugin paths — every current plugin path in this checkout resolves");
{
  // The corpus proof: this repo's own plugins, run for real. `run` logs to stdout, which this case
  // does not capture — its own exit code is enough, and a regression prints the finding when it fails.
  const code = run([PLUGIN.split("/packages/")[0]]);
  ok("this checkout is clean — every current plugin path resolves", code === 0, `exit code (finding count) ${code}`);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin paths` : `\n  all ${total} passed — plugin paths`);
process.exit(failed ? 1 : 0);
