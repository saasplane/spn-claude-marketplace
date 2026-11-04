// `checks/plugin-landed.ts` — a plugin row lands only when the four versions and the install record agree.
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS } from "../../../helpers/harness.mjs";

const { applies, pluginLandedRefusal, PLUGINS } = await import(join(CHECKS, "plugin-landed.ts"));

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const base = mkdtempSync(join(tmpdir(), "plugin-landed-"));
let n = 0;
function fixture(versions, installed) {
  const dir = join(base, String(n += 1));
  PLUGINS.forEach((name, i) => {
    const folder = join(dir, "packages", `plugin-${name}`, "src", ".claude-plugin");
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "plugin.json"), JSON.stringify({ name, version: versions[i] }));
  });
  const file = join(dir, "installed_plugins.json");
  if (installed) writeFileSync(file, JSON.stringify({ version: 2, plugins: Object.fromEntries(PLUGINS.map((name, i) => [`${name}@saasplane`, installed[i].map((version) => ({ scope: "project", version }))])) }));
  return { marketplace: dir, file };
}
const same = ["1.0.0", "1.0.0", "1.0.0", "1.0.0"];
const everywhere = PLUGINS.map(() => ["1.0.0", "1.0.0"]);

console.log("=== landings it refuses");
{
  const split = fixture(["1.0.1", "1.0.0", "1.0.0", "1.0.0"], everywhere);
  const why = pluginLandedRefusal(split.marketplace, split.file);
  ok("[MKT.SCRIPTS.382] four versions that differ are refused", !!why && /do not agree/.test(why), why);
  ok("[MKT.SCRIPTS.382] the refusal names the release command", /release:plugins prepare/.test(why ?? "") && /agent-sync/.test(why ?? ""));
  const behind = fixture(same, [["1.0.0"], ["1.0.0", "0.9.0"], ["1.0.0"], ["1.0.0"]]);
  ok("[MKT.SCRIPTS.382] one install location behind is refused, naming the plugin", /spn-apps/.test(pluginLandedRefusal(behind.marketplace, behind.file) ?? ""));
  const none = fixture(same, null);
  ok("[MKT.SCRIPTS.382] no install record is refused", !!pluginLandedRefusal(none.marketplace, none.file));
  const missing = fixture(same, [["1.0.0"], ["1.0.0"], ["1.0.0"], []]);
  ok("[MKT.SCRIPTS.382] a plugin installed nowhere is refused", /spn-infra/.test(pluginLandedRefusal(missing.marketplace, missing.file) ?? ""));
}

console.log("\n=== landings it lets through");
{
  const good = fixture(same, everywhere);
  ok("[MKT.SCRIPTS.382] agreeing versions installed everywhere pass", pluginLandedRefusal(good.marketplace, good.file) === null);
  ok("[MKT.SCRIPTS.382] only a landed marketplace row is read", applies("spn-claude-marketplace", "landed") && !applies("spn-claude-marketplace", "running") && !applies("spn-foundation", "landed") && !applies(null, "landed"));
  ok("[MKT.SCRIPTS.382] a row whose paths are under a plugin package is held",
    applies("spn-claude-marketplace", "landed", ["spn-claude-marketplace:packages/plugin-spn-devex/src/scripts/checks/agent-model.ts"]));
  ok("[MKT.SCRIPTS.382] a row whose paths are all outside the plugins is not held",
    !applies("spn-claude-marketplace", "landed", ["spn-claude-marketplace:docs/03-behaviors/01-devex/02-hooks.md", "docs/02-constructs/01-devex/05-scripts.md"]));
  ok("[MKT.SCRIPTS.382] a row that names no paths, a release among them, is held", applies("spn-claude-marketplace", "landed", []));
}

console.log("\n=== registrations whose folder is gone");
{
  const gone = join(base, "folder-that-is-gone");
  const here = join(base, "folder-that-is-here");
  mkdirSync(here, { recursive: true });
  const dir = join(base, "gone-fixture");
  const file = join(dir, "installed_plugins.json");
  const make = (stale) => {
    PLUGINS.forEach((name) => {
      const folder = join(dir, "packages", `plugin-${name}`, "src", ".claude-plugin");
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, "plugin.json"), JSON.stringify({ name, version: "1.0.0" }));
    });
    writeFileSync(file, JSON.stringify({ version: 2, plugins: Object.fromEntries(PLUGINS.map((name) => [`${name}@saasplane`, [
      { scope: "project", version: "1.0.0", projectPath: here }, { scope: "project", version: stale, projectPath: gone }]])) }));
  };
  make("0.9.0");
  ok("[MKT.SCRIPTS.388] a registration behind whose project folder is gone is not a place the plugin must land", pluginLandedRefusal(dir, file) === null, pluginLandedRefusal(dir, file) ?? "");
  mkdirSync(gone, { recursive: true });
  ok("[MKT.SCRIPTS.388] the same registration is read once its folder exists", /not at 1\.0\.0/.test(pluginLandedRefusal(dir, file) ?? ""));
}

console.log("\n=== registrations outside the workspace");
{
  const workspace = join(base, "workspace");
  const inside = join(workspace, "member");
  const outside = join(base, "another-window-scratchpad");
  mkdirSync(inside, { recursive: true });
  mkdirSync(outside, { recursive: true });
  const dir = join(base, "outside-fixture");
  PLUGINS.forEach((name) => {
    const folder = join(dir, "packages", `plugin-${name}`, "src", ".claude-plugin");
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "plugin.json"), JSON.stringify({ name, version: "1.0.0" }));
  });
  const file = join(dir, "installed_plugins.json");
  writeFileSync(file, JSON.stringify({ version: 2, plugins: Object.fromEntries(PLUGINS.map((name) => [`${name}@saasplane`, [
    { scope: "project", version: "1.0.0", projectPath: workspace }, { scope: "project", version: "1.0.0", projectPath: inside },
    { scope: "project", version: "0.9.0", projectPath: outside }]])) }));
  ok("[MKT.SCRIPTS.512] given the workspace, a registration behind outside it is not a place the plugin must land", pluginLandedRefusal(dir, file, workspace) === null, pluginLandedRefusal(dir, file, workspace) ?? "");
  ok("[MKT.SCRIPTS.512] with no workspace named, the same registration is read", /not at 1\.0\.0/.test(pluginLandedRefusal(dir, file) ?? ""));
  writeFileSync(file, JSON.stringify({ version: 2, plugins: Object.fromEntries(PLUGINS.map((name) => [`${name}@saasplane`, [
    { scope: "project", version: "1.0.0", projectPath: workspace }, { scope: "project", version: "0.9.0", projectPath: inside }]])) }));
  ok("[MKT.SCRIPTS.512] a registration behind inside the workspace is still refused", /not at 1\.0\.0/.test(pluginLandedRefusal(dir, file, workspace) ?? ""));
  // The workspace named through a link, as /tmp names /private/tmp: the registration behind it is still inside (s186).
  const linked = join(base, "workspace-link");
  symlinkSync(workspace, linked);
  ok("[MKT.SCRIPTS.512] a workspace named through a link still holds the registration recorded at its real path", /not at 1\.0\.0/.test(pluginLandedRefusal(dir, file, linked) ?? ""));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — plugin landed` : `\n  all ${total} passed — plugin landed`);
process.exit(failed ? 1 : 0);
