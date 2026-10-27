// `unit show` — one unit from the snapshot this plugin carries, with its restated choice table.
//
// THIS SUITE OWNS THE COMMAND'S READING. Against a fixture of two units and one table it proves the
// head and the book's release, the props with the library's word, the cases with their rules, a case
// that sends the reader elsewhere, the limits, the index by value, the line of a unit its place sizes,
// and the three refusals. Against the plugin's own copy it proves the real snapshot reads whole.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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

function run(root, ...args) {
  const env = { ...process.env, SPN_TELEMETRY: "off" };
  if (root) env.SPN_SURFACE_UNIT_ROOT = root; else delete env.SPN_SURFACE_UNIT_ROOT;
  try {
    return { out: execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env, cwd: tmpdir() }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 };
  }
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
