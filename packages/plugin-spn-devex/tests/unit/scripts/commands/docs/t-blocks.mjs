// `docs blocks units` — the units of one seat file a block pass reads: a unit for each section and subsection, with its prose, its
// tables, lists and fences with line numbers, and the hints the page writer's block checks raise for it.
import { PLUGIN } from "../../../../helpers/harness.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TOOL = join(PLUGIN, "src", "scripts", "cli.ts");
const BASE = mkdtempSync(join(tmpdir(), "t-blocks-"));
process.on("exit", () => rmSync(BASE, { recursive: true, force: true }));
const { unitsOf } = await import("../../../../../src/scripts/commands/docs/blocks.ts");

let n = 0, failed = 0;
function one(label, ok, detail = "") { n += 1; if (!ok) failed += 1; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `\n        ${detail}` : ""}`); }
function run(args) {
  try { return { out: execFileSync(process.execPath, [TOOL, "docs", "blocks", ...args], { encoding: "utf8", stdio: "pipe" }), code: 0 }; }
  catch (e) { return { out: String(e.stdout ?? "") + String(e.stderr ?? ""), code: e.status ?? 1 }; }
}

const ROW = "one two three four five six seven eight nine ten eleven twelve";
const SEAT = [
  "---", "title: x", "---", "# Page", "", "A lead paragraph.", "",
  "## Steps", "", "First open it. Then read it. Next write it. Finally close it.", "",
  "| Name | What |", "| --- | --- |", `| \`a\` | ${ROW} |`, `| \`b\` | ${ROW} |`, `| \`c\` | ${ROW} |`, "",
  "```sh", "spn-devex docs prose paragraphs a.md", "```", "",
  "### Detail", "", "- one", "- two", "- three", "",
  "## Conditions", "", "| When | Do |", "| --- | --- |", "| a file has no title | add one |", "| a file has two | drop one |", "| the title is long | cut it |", "",
].join("\n");
const units = unitsOf(SEAT);

console.log("=== the units");
one("a unit for each heading that holds anything", units.map((u) => u.path.join(">")).join("|") === "Page|Page>Steps|Page>Steps>Detail|Page>Conditions", units.map((u) => u.path.join(">")).join("|"));
one("front matter is not read, and line numbers count it", units[0].from === 4, String(units[0].from));
const steps = units[1];
one("the prose of a unit is its paragraphs", steps.prose.length === 1 && steps.prose[0].startsWith("First open it."));
one("a table and a fence carry their line numbers", steps.blocks.map((b) => `${b.kind}:${b.from}-${b.to}`).join(",") === "table:12-16,fence:18-20", steps.blocks.map((b) => `${b.kind}:${b.from}-${b.to}`).join(","));
one("a list is a block of the subsection it sits in", units[2].blocks.length === 1 && units[2].blocks[0].kind === "list" && units[2].blocks[0].detail === "3 items");

console.log("\n=== the hints");
one("steps written as prose are a hint", steps.hints.some((h) => h.startsWith("steps written as prose")));
one("a table of a name and a sentence reads as a catalog", steps.hints.some((h) => h.includes("reads as a catalog")));
one("a first column of conditions is a table, and says so", units[3].hints.some((h) => h.includes("conditions")), units[3].hints.join("|"));
one("a plain unit raises none", units[0].hints.length === 0);

console.log("\n=== the command");
const file = join(BASE, "seat.md");
writeFileSync(file, SEAT);
const text = run(["units", file]);
one("it prints a heading line for each unit", text.code === 0 && (text.out.match(/^--- /gm) ?? []).length === 4, text.out);
one("a heading line names the file, the lines and the path", text.out.includes(`${file}:8-21  Page › Steps`), text.out);
const json = run(["units", file, "--json"]);
const parsed = JSON.parse(json.out);
one("--json is the same units as data", json.code === 0 && parsed.units.length === 4 && parsed.file === file);
const refused = run(["units", join(BASE, "x.html")]);
one("a file that is not markdown is refused", refused.code !== 0, refused.out);
one("it writes nothing: the file is as it was", (await import("node:fs")).readFileSync(file, "utf8") === SEAT);

console.log(failed ? `\n  ${failed} of ${n} FAILED — t-blocks` : `\n  all ${n} passed — t-blocks`);
process.exit(failed ? 1 : 0);
