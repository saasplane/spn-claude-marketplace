// `lib/work-map.ts` — the work map's table parsed, a row opened by a skill, a written path, a layer or a command, a sibling plugin's reference
// resolved from the installed list and from the checkout (MKT.SCRIPTS.518), and every row of the shipped map naming a skill and references that
// exist (MKT.REFS.09).
import { existsSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../../helpers/harness.mjs";

const { parseMap, mapRows, rowsFor, rowOf, resolveRef, resolvedRow, globToRegExp } = await import("../../../../src/scripts/lib/work-map.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const table = [
  "# map", "",
  "| Work | Seen when | Skill | Read first | Look in | Learned |", "| --- | --- | --- | --- | --- | --- |",
  "| server-contract | skill:spn-apps:implement · write:**/contract/states/*.ts | spn-apps:implement | apps providers/ts/02-naming.md · module/README.md | a sibling contract | boolean is isActive |",
  "| preview | write:**/notes/N*/preview.html · layer:plugins | spn-devex:ideate | devex workspace/docs/doc-sets.md · book 05-artifacts.md § The figures | the pinned code | — |",
  "| release | — | spn-apps:release | devex function/deliver.md | — | — |",
].join("\n");

console.log("=== the table is parsed by its header's names");
{
  const rows = parseMap(table);
  ok("[MKT.SCRIPTS.518] each row is read with its marks, skill, references, look-in and learned", rows.length === 3 && rows[0].seenWhen.length === 2 && rows[0].skill === "spn-apps:implement" && rows[0].learned === "boolean is isActive", JSON.stringify(rows[0]));
  ok("[MKT.SCRIPTS.518] a bare path takes the plugin before it, and a section mark is dropped", rows[0].readFirst.map((one) => `${one.plugin}:${one.path}`).join(" ") === "apps:providers/ts/02-naming.md apps:module/README.md" && rows[1].readFirst.map((one) => one.plugin).join() === "devex,book");
  ok("[MKT.SCRIPTS.518] an empty cell is no mark and no text", rows[2].seenWhen.length === 0 && rows[2].learned === "" && rows[2].lookIn === "");
  ok("[MKT.SCRIPTS.518] a text with no table gives no row", parseMap("nothing here").length === 0);
}

console.log("\n=== a trigger opens the rows it matches");
{
  const rows = parseMap(table);
  const names = (list) => list.map((row) => row.work).join(",");
  ok("[MKT.SCRIPTS.518] a skill opening opens the row that marks it", names(rowsFor(rows, { skill: "spn-apps:implement" })) === "server-contract");
  ok("[MKT.SCRIPTS.518] a skill no row marks opens the rows whose Skill column names it", names(rowsFor(rows, { skill: "spn-apps:release" })) === "release");
  ok("[MKT.SCRIPTS.518] a written path opens the row whose glob it matches, and ** crosses folders but * does not", names(rowsFor(rows, { write: "/w/spn-x/packages/m/src/contract/states/job.ts" })) === "server-contract" && names(rowsFor(rows, { write: "/w/x/notes/N002/preview.html" })) === "preview" && !globToRegExp("**/contract/states/*.ts").test("/a/contract/states/deep/job.ts"));
  ok("[MKT.SCRIPTS.518] a layer mark opens its row, and a path no row names opens none", names(rowsFor(rows, { layer: "plugins" })) === "preview" && rowsFor(rows, { write: "/w/readme.md" }).length === 0);
  ok("[MKT.SCRIPTS.518] a row is found by its name", rowOf(rows, "release")?.skill === "spn-apps:release" && rowOf(rows, "none") === null);
}

console.log("\n=== a sibling plugin's reference resolves from the installed list and from the checkout");
{
  const base = mkdtempSync(join(tmpdir(), "work-map-"));
  const installRefs = join(base, "cache", "spn-apps", "0.9.0", "refs", "support", "apps", "providers", "ts");
  mkdirSync(installRefs, { recursive: true });
  writeFileSync(join(installRefs, "02-naming.md"), "# naming\n");
  const list = join(base, "installed_plugins.json");
  writeFileSync(list, JSON.stringify({ version: 2, plugins: { "spn-apps@saasplane": [{ scope: "project", installPath: join(base, "cache", "spn-apps", "0.9.0") }] } }));
  const checkout = join(base, "ws");
  const checkoutRefs = join(checkout, "spn-claude-marketplace", "packages", "plugin-spn-apps", "src", "refs", "support", "apps", "module");
  mkdirSync(checkoutRefs, { recursive: true });
  writeFileSync(join(checkoutRefs, "README.md"), "# module\n");
  const [naming, module, missing] = [{ plugin: "apps", path: "providers/ts/02-naming.md" }, { plugin: "apps", path: "module/README.md" }, { plugin: "apps", path: "nowhere.md" }];
  ok("[MKT.SCRIPTS.518] a reference is found in the installed plugin from installed_plugins.json", resolveRef(naming, { installed: list, checkout: null })?.startsWith(installRefs));
  ok("[MKT.SCRIPTS.518] and in the checkout beside the workspace where the install does not hold it", resolveRef(module, { installed: list, checkout })?.startsWith(checkoutRefs));
  ok("[MKT.SCRIPTS.518] a reference neither holds resolves to nothing", resolveRef(missing, { installed: list, checkout }) === null);
  ok("[MKT.SCRIPTS.518] a missing or broken installed list leaves only the checkout", resolveRef(naming, { installed: join(base, "none.json"), checkout }) === null && resolveRef(module, { installed: join(base, "none.json"), checkout }) !== null);
  const row = { work: "x", seenWhen: [], skill: "", readFirst: [naming, module, missing].map((one) => ({ ...one, text: `${one.plugin} ${one.path}` })), lookIn: "", learned: "" };
  const split = resolvedRow(row, { installed: list, checkout });
  ok("[MKT.SCRIPTS.518] a row that resolves to nothing is dropped from the note and named", split.found.length === 2 && split.missing.map((one) => one.path).join() === "nowhere.md");
}

console.log("\n=== the shipped map names a skill and references that exist");
{
  const marketplace = resolve(PLUGIN, "..", "..");
  const workspaceDir = mkdtempSync(join(tmpdir(), "work-map-ws-"));
  symlinkSync(marketplace, join(workspaceDir, "spn-claude-marketplace"));
  const rows = mapRows();
  const SKILLS = new Set();
  for (const plugin of ["devex", "apps", "surface", "infra"]) {
    for (const name of existsSync(join(marketplace, "packages", `plugin-spn-${plugin}`, "src", "skills")) ? readdirSync(join(marketplace, "packages", `plugin-spn-${plugin}`, "src", "skills")) : [])
      SKILLS.add(`spn-${plugin}:${name}`);
  }
  // A skill that is not one of the four plugins' is named as the host lists it.
  const OUTSIDE = new Set(["artifact-diagramming"]);
  ok("[MKT.REFS.09] the map holds a row for each of the 26 kinds of work", rows.length === 26 && new Set(rows.map((row) => row.work)).size === 26, String(rows.length));
  const unknownSkill = rows.filter((row) => row.skill && !SKILLS.has(row.skill) && !OUTSIDE.has(row.skill)).map((row) => `${row.work}: ${row.skill}`);
  ok("[MKT.REFS.09] every row's skill is a skill of the plugins, or one the host lists", unknownSkill.length === 0, unknownSkill.join("; "));
  const dropped = rows.flatMap((row) => resolvedRow(row, { installed: null, checkout: workspaceDir }).missing.map((ref) => `${row.work}: ${ref.text}`));
  ok("[MKT.REFS.09] every reference of every row resolves to a file in the plugins", dropped.length === 0, dropped.join("; "));
  ok("[MKT.REFS.09] every row names at least one reference or says where to look", rows.every((row) => row.readFirst.length > 0 || row.lookIn));
  ok("[MKT.REFS.09] every mark is a skill, write, layer or command mark", rows.every((row) => row.seenWhen.every((mark) => /^(skill|write|layer|command):\S/.test(mark))));
}

// The shipped bundle sits at another depth than the source, so the map is read through the built command too.
{
  const { spawnSync } = await import("node:child_process");
  const { resolve: at } = await import("node:path");
  const bundle = at(import.meta.dirname, "../../../../src/dist/commands/precedent/map.mjs");
  const cli = at(import.meta.dirname, "../../../../src/dist/cli.mjs");
  const out = spawnSync(process.execPath, [cli, "precedent", "map"], { encoding: "utf8" });
  ok("[MKT.REFS.09] the built command reads the map from the bundle", /server-contract/.test(out.stdout), `${bundle} printed: ${out.stdout}${out.stderr}`.slice(0, 200));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — work map` : `\n  all ${total} passed — work map`);
process.exit(failed ? 1 : 0);
