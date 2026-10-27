// `unit show` — one unit from the snapshot this plugin carries, with its restated choice table, and
// a unit beyond the core from the symbol index of the repository it runs in, or of each repository of
// the workspace it runs at the root of.
//
// THIS SUITE OWNS THE COMMAND'S READING. Against a fixture of two units and one table it proves the
// head and the book's release, the props with the library's word, the cases with their rules, a case
// that sends the reader elsewhere, the limits, the index by value, the line of a unit its place sizes,
// and the three refusals. Against a fixture index, laid out as a repository's merged index and as a
// package's own, it proves a unit beyond the core prints its props and the core block its name points
// to, and that the snapshot still answers first. Against a fixture workspace of two members it proves
// a module's unit is found from the root and named with its member, that a name both members carry
// comes from the one whose entry carries props, and that inside a member nothing changes. Against the
// plugin's own copy it proves the real snapshot reads whole.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PLUGIN_SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(PLUGIN_SRC, "scripts", "cli.ts");
const FIXTURE = resolve(import.meta.dirname, "..", "..", "..", "..", "fixtures", "unit-show");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

function runIn(cwd, root, ...args) {
  const env = { ...process.env, SPN_TELEMETRY: "off" };
  if (root) env.SPN_SURFACE_UNIT_ROOT = root; else delete env.SPN_SURFACE_UNIT_ROOT;
  try {
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env, cwd }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
}

const run = (root, ...args) => runIn(tmpdir(), root, ...args);

/** A repository holding the fixture index as `repo agent-sync` writes it, the merged one under `.claude/saasplane/`. */
function mergedRepo() {
  const repo = mkdtempSync(join(tmpdir(), "unit-show-merged-"));
  mkdirSync(join(repo, ".claude", "saasplane"), { recursive: true });
  copyFileSync(join(FIXTURE, "spn-symbols.json"), join(repo, ".claude", "saasplane", "spn-symbols.json"));
  writeFileSync(join(repo, "sprepo.json"), "{}\n");
  mkdirSync(join(repo, "apps", "web"), { recursive: true });
  return repo;
}

/** A repository with no merged index, where each package of the fixture writes its own under `dist/generated/`. */
function packagesRepo() {
  const repo = mkdtempSync(join(tmpdir(), "unit-show-packages-"));
  writeFileSync(join(repo, "sprepo.json"), "{}\n");
  const index = JSON.parse(readFileSync(join(FIXTURE, "spn-symbols.json"), "utf8"));
  for (const capability of index.capabilities) {
    const folder = join(repo, "packages", capability.name.split("/").at(-1), "dist", "generated");
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "spn-symbols.json"), JSON.stringify({ capabilities: [capability] }));
  }
  return repo;
}

/** One member of a workspace: a folder with a `sprepo.json` and a merged index of the capabilities given. */
function member(root, name, capabilities) {
  const folder = join(root, name);
  mkdirSync(join(folder, ".claude", "saasplane"), { recursive: true });
  mkdirSync(join(folder, "apps", "web"), { recursive: true });
  writeFileSync(join(folder, "sprepo.json"), "{}\n");
  writeFileSync(join(folder, ".claude", "saasplane", "spn-symbols.json"), JSON.stringify({ capabilities }));
  return folder;
}

/**
 * A workspace root, where every fresh window starts: `.spndevex/` and no `sprepo.json` of its own,
 * with two members. The first pins the design system at a build that wrote no props; the second
 * holds that package whole and the module's own, so a name in both has one member with props.
 */
function workspaceRoot() {
  const root = mkdtempSync(join(tmpdir(), "unit-show-workspace-"));
  mkdirSync(join(root, ".spndevex", "workstreams"), { recursive: true });
  const { capabilities } = JSON.parse(readFileSync(join(FIXTURE, "spn-symbols.json"), "utf8"));
  const ds = capabilities.find((one) => one.name.endsWith("support-web-ds-ts"));
  member(root, "a-platform", [{ ...ds, version: "5.34.0", symbols: ds.symbols.map((symbol) => ({ ...symbol, roleMeta: null })) }]);
  member(root, "z-support", capabilities);
  return root;
}

console.log("=== unit show — a unit with a table, from the fixture");
{
  const { out, code } = run(FIXTURE, "unit", "show", "DSSheet");
  const lines = out.split("\n");
  ok("exits clean", code === 0, out);
  ok("its first line is the unit, its group and its line, with no closing stop",
    lines[0] === "DSSheet · Overlays · a dialog pinned to one edge of the screen", lines[0]);
  ok("its second line names the book's release and the copy the plugin carries",
    lines[1] === "the book: spn-foundation@0000abcd, 01-components.md#overlays, the copy this release of spn-surface carries", lines[1]);
  ok("a choice prop gives its default, the library's word and its values", /placement\s+RIGHT\s+not drawn\s+LEFT RIGHT/.test(out), out);
  ok("a flag reads as a flag, drawn once", /modal\s+true\s+once\s+a flag/.test(out), out);
  ok("content the page gives stands on one line, not drawn", out.includes("not drawn, content the page gives: ariaTitle"), out);
  ok("the usage is the snapshot's", out.includes("usage   a medium entry at the side of its page"), out);
  ok("the table is a guide, and a partner's choice stands", out.includes("a guide: start from the first case that matches, and a partner's choice stands"), out);
  ok("a case gives its words, its rule, and its props with what the page writes",
    /a medium entry · at the side of the page\s+RD\.SUPPORT\.SURFACE\.075/.test(out)
      && out.includes("placement RIGHT (the unit's) · size the place's · the page writes nothing"), out);
  ok("a case that draws another unit sends the reader there, with its rule",
    /a small entry → not a sheet: a DSDialog\s+RD\.SUPPORT\.SURFACE\.075/.test(out), out);
  ok("the limits across a view are printed", out.includes("The limits across a view. A sheet over a page is a view of its own."), out);
  ok("the index joins the values that share their cases", out.includes("the index by value: prop · value · its cases") && out.includes("size       SM MD · the place's"), out);
  ok("the next unit's table is not read into this one", !out.includes("something else"), out);
}

console.log("\n=== unit show — a unit its place sizes, and the data as JSON");
{
  const { out, code } = run(FIXTURE, "unit", "show", "DSList");
  ok("a listed unit says its size is the place's, so silence is never read as no rule",
    code === 0 && out.includes("their size from the place, a field's check from its DSForm.Field") && !out.includes("no choice table yet"), out);
  const json = run(FIXTURE, "unit", "show", "DSSheet", "--json");
  let parsed;
  try { parsed = JSON.parse(json.out); } catch { parsed = null; }
  ok("--json gives the cases, the index and the book", parsed?.book === "spn-foundation@0000abcd" && parsed?.cases?.length === 2
    && parsed.cases[1].redirect === "not a sheet: a DSDialog" && parsed?.index?.length === 2, json.out);
}

console.log("\n=== unit show — refusals");
{
  const none = run(FIXTURE, "unit", "show");
  ok("no name is a usage fault, exit 2", none.code === 2 && none.out.includes("needs one unit's name"), none.out);
  const unknown = run(FIXTURE, "unit", "show", "DSSheeet");
  ok("an unknown name exits 1 and names the closest units", unknown.code === 1 && unknown.out.includes("no unit `DSSheeet`") && unknown.out.includes("DSSheet"), unknown.out);
  const empty = mkdtempSync(join(tmpdir(), "unit-show-empty-"));
  const missing = run(empty, "unit", "show", "DSSheet");
  rmSync(empty, { recursive: true, force: true });
  ok("a release with no snapshot says so, exit 1", missing.code === 1 && missing.out.includes("this release carries no construct.snapshot.json"), missing.out);
}

console.log("\n=== unit show — a unit beyond the core, from the repository's symbol index");
{
  const repo = mergedRepo();
  const inside = join(repo, "apps", "web");
  const badge = runIn(inside, FIXTURE, "unit", "show", "IdentityFactorVerificationBadge");
  const lines = badge.out.split("\n");
  ok("a module's badge exits clean", badge.code === 0, badge.out);
  ok("its first line is the unit, its package and its intent line, with no closing stop",
    lines[0] === "IdentityFactorVerificationBadge · @saasplane/module-web-iam-ts@2.3.0 · Whether a factor has been proven end to end", lines[0]);
  ok("its second line names the index it was read from, found from the working folder upwards",
    lines[1] === "the symbol index: .claude/saasplane/spn-symbols.json, of the repository this runs in", lines[1]);
  ok("its props stand as a table: prop, default, values", /^prop\s+default\s+values$/m.test(badge.out) && /^size\s+XS\s+XS SM MD LG XL$/m.test(badge.out), badge.out);
  ok("each prop's description stands under it", /^factor\n    The factor: it counts once it has a verification time\.$/m.test(badge.out)
    && /^size .*\n    The size step of the badge\.$/m.test(badge.out), badge.out);
  ok("it names the core block its suffix points to",
    badge.out.includes("beyond the core: its props carry its use; the cases are DSBadge's — run `spn-surface unit show DSBadge`"), badge.out);

  const detail = runIn(inside, FIXTURE, "unit", "show", "DSListDetail");
  ok("the design system's own unit prints beyond the core with its four props",
    detail.code === 0 && detail.out.startsWith("DSListDetail · @saasplane/support-web-ds-ts@5.40.0 · A list and the detail of its chosen row\n")
      && ["list", "detail", "backAnchor"].every((prop) => new RegExp(`^${prop}\\n    `, "m").test(detail.out))
      && /^listWidth\s+WIDE\s+COMPACT NARROW WIDE$/m.test(detail.out), detail.out);
  ok("a name that ends in no block's word says no core table decides the rest",
    detail.out.includes("beyond the core: its props carry its use; its name ends in no block's word, so no core table decides the rest"), detail.out);

  const container = runIn(inside, FIXTURE, "unit", "show", "RoleListContainer");
  ok("a container is sent to the container patterns, and a unit with none says it has no props",
    container.code === 0 && container.out.includes("no props") && container.out.includes("the rest is the container patterns'"), container.out);
  const old = runIn(inside, FIXTURE, "unit", "show", "DSPortal");
  ok("an index written before the props existed says it carries none, rather than printing an empty table",
    old.code === 0 && old.out.includes("the index carries no props for it"), old.out);

  const core = runIn(inside, FIXTURE, "unit", "show", "DSSheet");
  ok("a core unit still prints its cases from the snapshot", core.code === 0 && core.out.includes("not a sheet: a DSDialog") && !core.out.includes("beyond the core"), core.out);

  const unknown = runIn(inside, FIXTURE, "unit", "show", "DSListDetai");
  ok("an unknown name exits 1 and names the closest from both the snapshot and the index",
    unknown.code === 1 && unknown.out.includes("no unit `DSListDetai` in the snapshot or the symbol index")
      && unknown.out.includes("DSListDetail") && /\bDSList(?!Detail)\b/.test(unknown.out), unknown.out);
  const type = runIn(inside, FIXTURE, "unit", "show", "IDSListDetailProps");
  ok("a symbol of the index that is not a component is not a unit", type.code === 1 && type.out.includes("no unit `IDSListDetailProps`"), type.out);

  const json = runIn(inside, FIXTURE, "unit", "show", "IdentityFactorVerificationBadge", "--json");
  let parsed;
  try { parsed = JSON.parse(json.out); } catch { parsed = null; }
  ok("--json carries the package, the props and the block", parsed?.package === "@saasplane/module-web-iam-ts" && parsed?.version === "2.3.0"
    && parsed?.props?.length === 2 && parsed.props[1].default === "XS" && parsed.props[1].values.length === 5
    && parsed?.block === "DSBadge" && parsed?.pattern === null && parsed?.index === ".claude/saasplane/spn-symbols.json", json.out);
  rmSync(repo, { recursive: true, force: true });

  const packages = packagesRepo();
  const fromPackage = runIn(packages, FIXTURE, "unit", "show", "DSListDetail");
  ok("with no merged index, each package's own dist/generated/spn-symbols.json is read",
    fromPackage.code === 0 && fromPackage.out.includes("the symbol index: packages/support-web-ds-ts/dist/generated/spn-symbols.json")
      && /^listWidth\s+WIDE\s+COMPACT NARROW WIDE$/m.test(fromPackage.out), fromPackage.out);
  rmSync(packages, { recursive: true, force: true });

  const nowhere = run(FIXTURE, "unit", "show", "DSListDetai");
  ok("outside a repository with an index, the refusal says there is none and names the snapshot's closest",
    nowhere.code === 1 && nowhere.out.includes("no symbol index here") && nowhere.out.includes("DSList"), nowhere.out);
}

console.log("\n=== unit show — from a workspace's root, the index of each repository in it");
{
  const root = workspaceRoot();
  const badge = runIn(root, FIXTURE, "unit", "show", "IdentityFactorVerificationBadge");
  const lines = badge.out.split("\n");
  ok("a module's unit is found from the root, where no sprepo.json stands above", badge.code === 0
    && lines[0] === "IdentityFactorVerificationBadge · @saasplane/module-web-iam-ts@2.3.0 · Whether a factor has been proven end to end", badge.out);
  ok("the index line names the member it was read from, path and repository",
    lines[1] === "the symbol index: z-support/.claude/saasplane/spn-symbols.json, of the repository z-support in this workspace", lines[1]);
  ok("its props and its core block are the member's own", /^size\s+XS\s+XS SM MD LG XL$/m.test(badge.out)
    && badge.out.includes("the cases are DSBadge's"), badge.out);

  const inside = runIn(join(root, "z-support", "apps", "web"), FIXTURE, "unit", "show", "IdentityFactorVerificationBadge");
  ok("from inside its member nothing changes: the line stays the repository the command runs in",
    inside.code === 0 && inside.out.split("\n")[1] === "the symbol index: .claude/saasplane/spn-symbols.json, of the repository this runs in", inside.out);

  const detail = runIn(root, FIXTURE, "unit", "show", "DSListDetail");
  ok("a unit both members carry prints from the first whose entry carries props, not the first member",
    detail.code === 0 && detail.out.includes("of the repository z-support in this workspace")
      && /^listWidth\s+WIDE\s+COMPACT NARROW WIDE$/m.test(detail.out) && !detail.out.includes("carries no props"), detail.out);

  const core = runIn(root, FIXTURE, "unit", "show", "DSSheet");
  ok("a core unit still comes from the snapshot at a workspace's root", core.code === 0 && core.out.includes("not a sheet: a DSDialog"), core.out);

  const json = runIn(root, FIXTURE, "unit", "show", "IdentityFactorVerificationBadge", "--json");
  let parsed;
  try { parsed = JSON.parse(json.out); } catch { parsed = null; }
  ok("--json carries the repository beside the index", parsed?.repository === "z-support"
    && parsed?.index === "z-support/.claude/saasplane/spn-symbols.json", json.out);

  const unknown = runIn(root, FIXTURE, "unit", "show", "IdentityFactorVerificationBadg");
  ok("a name no member carries exits 1 and names the closest from the members and the snapshot",
    unknown.code === 1 && unknown.out.includes("in the snapshot or the symbol index")
      && unknown.out.includes("IdentityFactorVerificationBadge"), unknown.out);
  rmSync(root, { recursive: true, force: true });

  const bare = mkdtempSync(join(tmpdir(), "unit-show-bare-workspace-"));
  mkdirSync(join(bare, ".spndevex"), { recursive: true });
  mkdirSync(join(bare, "a-repo"), { recursive: true });
  writeFileSync(join(bare, "a-repo", "sprepo.json"), "{}\n");
  const none = runIn(bare, FIXTURE, "unit", "show", "DSListDetail");
  ok("a workspace whose members hold no index says so, rather than saying there is none here",
    none.code === 1 && none.out.includes("no symbol index in this workspace's repositories"), none.out);
  rmSync(bare, { recursive: true, force: true });
}

console.log("\n=== unit show — the plugin's own copy");
{
  const { out, code } = run(null, "unit", "show", "DSSheet");
  ok("reads the snapshot the plugin carries, written from a book release", code === 0 && /^the book: spn-foundation@[0-9a-f]{8}, /m.test(out), out.slice(0, 400));
  ok("finds the sheet's restated table", out.includes("not a sheet: a DSDialog"), out.slice(0, 1200));
  const widget = run(null, "unit", "show", "DSCardWidget");
  ok("finds a widget's table in the widgets ref", widget.code === 0 && widget.out.includes("not this unit: a DSCard"), widget.out.slice(0, 1200));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — unit show` : `\n  all ${total} passed — unit show`);
process.exit(failed ? 1 : 0);
