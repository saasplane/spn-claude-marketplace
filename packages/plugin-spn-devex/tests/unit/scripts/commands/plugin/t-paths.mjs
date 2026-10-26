// `plugin paths check` (RD.DEVEX.AGENT.070) — a `${CLAUDE_PLUGIN_ROOT}` path a skill, a ref or `hooks.json`
// names must resolve to a file the plugin actually ships. Built with a known-bad case first, per
// `N101` step 6b's acceptance: a broken path is reported, and every current plugin path resolves.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { check, findDead, marketplaceRoot } from "../../../../../src/scripts/commands/plugin/paths.ts";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
/** `plugin paths` through the entry, from the folder given, with the words typed after it: what it printed, and its exit code. */
const typed = (cwd, ...words) => {
  try { return { out: execFileSync("node", [TOOL, "plugin", "paths", ...words], { cwd, encoding: "utf8", stdio: "pipe", env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? -1 }; }
};

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
  // The corpus proof: this repo's own plugins, run for real. `check` logs to stdout, which this case
  // does not capture — its own exit code is enough, and a regression prints the finding when it fails.
  const code = check([PLUGIN.split("/packages/")[0]]);
  ok("this checkout is clean — every current plugin path resolves", code === 0, `exit code ${code}`);
}

console.log("\n=== plugin paths — the action is a word, and a narrow path reads the plugin files under it");
{
  const { root, plugin } = fixturePlugin();
  // A second skill of the same plugin, and a second plugin, each naming a path nobody ships.
  mkdirSync(join(plugin, "src", "skills", "other"), { recursive: true });
  writeFileSync(join(plugin, "src", "skills", "other", "SKILL.md"), 'node "${CLAUDE_PLUGIN_ROOT}"/scripts/tools/second-ghost.ts\n', "utf8");
  const sibling = join(root, "packages", "plugin-spn-sibling");
  mkdirSync(join(sibling, "src", ".claude-plugin"), { recursive: true });
  writeFileSync(join(sibling, "src", ".claude-plugin", "plugin.json"), '{"name":"spn-sibling"}\n', "utf8");
  mkdirSync(join(sibling, "src", "skills", "run"), { recursive: true });
  writeFileSync(join(sibling, "src", "skills", "run", "SKILL.md"), 'node "${CLAUDE_PLUGIN_ROOT}"/scripts/tools/third-ghost.ts\n', "utf8");
  writeFileSync(join(root, "sprepo.json"), '{"type":"GENERAL","config":null}\n', "utf8");
  try {
    const USAGE = "usage: spn-devex plugin paths check [<path>]\n";
    const none = typed(root);
    ok("[MKT.SCRIPTS.111] with no action the entry prints the usage line and says an action is owed",
      none.code === 2 && none.out === USAGE + "`plugin paths` needs an action.\n", none.out);
    ok("[MKT.SCRIPTS.111] a path where the action belongs is refused with exit 2", typed(root, ".").code === 2);
    const option = typed(root, "check", ".", "--json");
    ok("[MKT.SCRIPTS.174] an option the command does not take is refused with exit 2", option.code === 2 && option.out === USAGE + "`plugin paths check` does not take `--json`.\n", option.out);

    const whole = typed(root, "check", ".");
    ok("known-bad: the checkout, checked, names the dead path of every plugin and exits 1, never the count",
      whole.code === 1 && whole.out.includes("ghost.ts") && whole.out.includes("second-ghost.ts") && whole.out.includes("third-ghost.ts")
        && whole.out.includes("3 plugin path(s) named that resolve to nothing, over 2 plugin(s)"), whole.out);
    const onePlugin = typed(root, "check", join("packages", "plugin-spn-sibling"));
    ok("[MKT.SCRIPTS.171] a run narrowed to one plugin reads that plugin's files, and no plugin beside it",
      onePlugin.code === 1 && onePlugin.out.includes("third-ghost.ts") && !onePlugin.out.includes("second-ghost.ts") && onePlugin.out.includes("over 1 plugin(s)"), onePlugin.out);
    const oneSkill = typed(root, "check", join("packages", "plugin-spn-fixture", "src", "skills", "other"));
    ok("[MKT.SCRIPTS.171] a run narrowed to one skill names the dead path in it, and none from the skill beside it",
      oneSkill.code === 1 && oneSkill.out.includes("second-ghost.ts") && !oneSkill.out.includes("tools/ghost.ts") && oneSkill.out.includes("1 plugin path(s)"), oneSkill.out);
    const inside = typed(join(plugin, "src", "skills"), "check");
    ok("[MKT.SCRIPTS.113] with no path the run takes the repository the caller is in, from a folder inside it",
      inside.code === 1 && inside.out.includes("3 plugin path(s)"), inside.out);
    const nowhere = mkdtempSync(join(tmpdir(), "no-repository-"));
    try {
      const lost = typed(nowhere, "check");
      ok("[MKT.SCRIPTS.113] where the caller is in no repository, the run with no path says to name one, with exit 2",
        lost.code === 2 && lost.out === USAGE + "`plugin paths check` needs a path here, because the folder it is run from is in no repository. Name a repository.\n", lost.out);
    } finally { rmSync(nowhere, { recursive: true, force: true }); }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin paths` : `\n  all ${total} passed — plugin paths`);
process.exit(failed ? 1 : 0);
