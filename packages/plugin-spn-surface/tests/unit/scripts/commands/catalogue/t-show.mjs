// `catalogue show` — one slice of the catalogue this plugin carries (RULE.SUPPORT.SURFACE.601).
//
// Against a fixture catalogue of one category, two parts and a kind with two cases it proves each
// slice in words and as JSON, the narrowing by `--case`, the matching in any case of letters, and
// every refusal. Against the plugin's own copy it proves the copy is the book's catalogue byte for
// byte where the book sits beside the checkout, and that it reads whole for every category.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PLUGIN_SRC = resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src");
const CLI = join(PLUGIN_SRC, "scripts", "cli.ts");
const COPY = join(PLUGIN_SRC, "refs", "support", "surface", "catalogue.json");
const BOOK = resolve(PLUGIN_SRC, "..", "..", "..", "..", "spn-foundation", "docs", "specs", "surface", "catalogue.json");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 400)}` : ""}`);
};
function run(root, ...args) {
  const env = { ...process.env, SPN_TELEMETRY: "off" };
  if (root) env.SPN_SURFACE_CATALOGUE_ROOT = root; else delete env.SPN_SURFACE_CATALOGUE_ROOT;
  try { return { out: execFileSync("node", [CLI, "catalogue", "show", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
}

const root = mkdtempSync(join(tmpdir(), "t-catalogue-show-"));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const kind = (code, extra = {}) => ({ code, title: code.toLowerCase(), description: `what ${code} is`, guidance: { for: { persons: ["SEEKER"] }, chooseWhen: `when ${code}`, rules: ["RULE.SUPPORT.SURFACE.221"] }, config: { mtype: "WIDGETS" }, units: { unit: "DSFeature" }, placement: { text: "START" }, style: {}, status: "BUILT", ...extra });
writeFileSync(join(root, "catalogue.json"), JSON.stringify({
  version: "9.9.9",
  outline: {
    categories: { MARKETPLACE: { family: "SITE", person: "SEEKER", description: "a site for a Seeker" } },
    partNotes: { MARKETPLACE: { WIDGETS: { code: "WIDGETS", description: "the units placed beside others" } } },
  },
  categories: { MARKETPLACE: {
    LAYOUTS: [kind("TOPNAV")],
    WIDGETS: [kind("RECORD_CARD", { status: "PLANNED", defaultCase: "GRID_CELL", cases: [
      { code: "GRID_CELL", when: "a cell of a grid", units: ["DSFeature"], placement: { standsIn: "GRID_CELL" }, style: {}, status: "BUILT" },
      { code: "SIDE_LIST", when: "a row of a side list", units: ["DSFeature"], placement: { standsIn: "SIDE_LIST" }, style: {}, status: "PLANNED", why: "Q76 A" },
    ] })],
  } },
}));

{
  const { out, code } = run(root, "marketplace");
  ok("[MKT.SCRIPTS.672] a category, typed in any case, gives its head and the catalogue's version", code === 0 && out.startsWith("MARKETPLACE · SITE · SEEKER — a site for a Seeker (catalogue 9.9.9)"), out);
  ok("[MKT.SCRIPTS.672] then each part with its count and note, and a line per kind", out.includes("WIDGETS (1) — the units placed beside others") && out.includes("  RECORD_CARD · record_card · PLANNED — what RECORD_CARD is") && out.includes("LAYOUTS (1)"), out);
  ok("[MKT.SCRIPTS.672] and no kind's facts or cases", !out.includes("choose when") && !out.includes("GRID_CELL"), out);
}
{
  const { out, code } = run(root, "MARKETPLACE", "widgets");
  ok("[MKT.SCRIPTS.672] a part gives each kind whole, its cases by code with the default marked", code === 0 && out.includes("choose when: when RECORD_CARD") && out.includes("rules: RULE.SUPPORT.SURFACE.221") && out.includes('units: {"unit":"DSFeature"}') && out.includes("cases: GRID_CELL (default) · SIDE_LIST"), out);
  ok("[MKT.SCRIPTS.672] and no case's own facts", !out.includes("a row of a side list"), out);
}
{
  const { out } = run(root, "MARKETPLACE", "WIDGETS", "record_card");
  ok("[MKT.SCRIPTS.672] a kind gives every case with its facts", out.includes("case GRID_CELL (default) · BUILT — a cell of a grid") && out.includes("case SIDE_LIST · PLANNED — a row of a side list") && out.includes('placement: {"standsIn":"SIDE_LIST"}') && out.includes("why: Q76 A"), out);
  const one = run(root, "MARKETPLACE", "WIDGETS", "RECORD_CARD", "--case", "side_list").out;
  ok("[MKT.SCRIPTS.672] `--case` narrows to one case", one.includes("case SIDE_LIST") && !one.includes("case GRID_CELL"), one);
  const json = JSON.parse(run(root, "MARKETPLACE", "WIDGETS", "RECORD_CARD", "--case", "SIDE_LIST", "--json").out);
  ok("[MKT.SCRIPTS.672] `--json` gives the same slice as data", json.version === "9.9.9" && json.category === "MARKETPLACE" && json.part === "WIDGETS" && json.kind.code === "RECORD_CARD" && json.kind.cases.length === 1 && json.kind.cases[0].code === "SIDE_LIST", JSON.stringify(json));
  const part = JSON.parse(run(root, "MARKETPLACE", "WIDGETS", "--json").out);
  ok("[MKT.SCRIPTS.672] a part as JSON names its kinds' cases by code", part.kinds[0].cases.join() === "GRID_CELL,SIDE_LIST" && part.note.description === "the units placed beside others", JSON.stringify(part));
  const category = JSON.parse(run(root, "MARKETPLACE", "--json").out);
  ok("[MKT.SCRIPTS.672] a category as JSON lists each part's kinds", category.person === "SEEKER" && category.parts.WIDGETS.kinds[0].code === "RECORD_CARD", JSON.stringify(category));
}
{
  const noCategory = run(root, "SHOP");
  ok("[MKT.SCRIPTS.673] an unknown category is refused naming the ones there are", noCategory.code !== 0 && noCategory.out.includes("no category `SHOP`") && noCategory.out.includes("MARKETPLACE"), noCategory.out);
  const noPart = run(root, "MARKETPLACE", "SHELVES");
  ok("[MKT.SCRIPTS.673] an unknown part is refused naming the category's parts", noPart.code !== 0 && noPart.out.includes("no part `SHELVES` in MARKETPLACE") && noPart.out.includes("LAYOUTS · WIDGETS"), noPart.out);
  const noKind = run(root, "MARKETPLACE", "WIDGETS", "NOPE");
  ok("[MKT.SCRIPTS.673] an unknown kind is refused naming the part's kinds", noKind.code !== 0 && noKind.out.includes("no kind `NOPE` in MARKETPLACE WIDGETS") && noKind.out.includes("RECORD_CARD"), noKind.out);
  const noCase = run(root, "MARKETPLACE", "WIDGETS", "RECORD_CARD", "--case", "SLIDE");
  ok("[MKT.SCRIPTS.673] an unknown case is refused naming the kind's cases", noCase.code !== 0 && noCase.out.includes("no case `SLIDE` of RECORD_CARD") && noCase.out.includes("GRID_CELL · SIDE_LIST"), noCase.out);
  const none = run(root);
  ok("[MKT.SCRIPTS.673] no category is a usage fault", none.code === 2 && none.out.includes("takes a category"), none.out);
  const caseAlone = run(root, "MARKETPLACE", "--case", "GRID_CELL");
  ok("[MKT.SCRIPTS.673] `--case` without a kind is a usage fault", caseAlone.code === 2 && caseAlone.out.includes("narrows one kind"), caseAlone.out);
  const empty = mkdtempSync(join(tmpdir(), "t-catalogue-none-"));
  const missing = run(empty, "MARKETPLACE");
  rmSync(empty, { recursive: true, force: true });
  ok("[MKT.SCRIPTS.673] a release with no copy says so and exits 1", missing.code === 1 && missing.out.includes("carries no catalogue.json"), missing.out);
}
{
  ok("[MKT.SCRIPTS.674] the plugin carries its copy of the catalogue", existsSync(COPY));
  if (existsSync(BOOK)) ok("[MKT.SCRIPTS.674] and with the book beside the checkout it is the book's catalogue byte for byte", readFileSync(COPY).equals(readFileSync(BOOK)));
  const categories = Object.keys(JSON.parse(readFileSync(COPY, "utf8")).categories);
  const read = categories.map((category) => run(null, category));
  ok("[MKT.SCRIPTS.674] the real copy reads whole for every category", categories.length >= 5 && read.every((one) => one.code === 0 && one.out.includes("PAGES (")), read.map((one) => one.out.slice(0, 80)).join(" | "));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
