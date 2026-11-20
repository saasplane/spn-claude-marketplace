// `language write` — a construct's marked figures filled from its own `language` block, and nothing else changed.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CLI = join(resolve(import.meta.dirname, "..", "..", "..", "..", "..", "src"), "scripts", "cli.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const run = (...args) => {
  try { return { out: execFileSync("node", [CLI, "language", "write", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};

const dir = mkdtempSync(join(tmpdir(), "language-write-"));
const construct = join(dir, "design-language.md");
const HEADINGS = { drawingStyle: "Drawing style", colourAndStrength: "Colour and strength", characters: "Characters" };
const block = (language) => ["### The language as data", "", "```json", JSON.stringify({ language }, null, 2), "```", ""];
const text = (keys, language = {}) => ["# Design Language", "", "Words the author wrote.", "", ...block(language), ...keys.flatMap((key) => [`### ${HEADINGS[key]}`, "", "{{Filled by `spn-surface language write`.}}", ""]), "After the blocks."].join("\n");

console.log("=== language write — fills the marked blocks from the data");
const LANGUAGE = {
  drawingStyle: [{ element: "Wire", style: "thin, round caps" }],
  colourAndStrength: [{ element: "Wire", token: "--ds-drawing-wire", strength: "30% of the text" }],
};
writeFileSync(construct, text(["drawingStyle", "colourAndStrength"], LANGUAGE));
const filled = run(dir, "--construct", construct);
const after = readFileSync(construct, "utf8");
ok("[MKT.SCRIPTS.606] it prints one OK line and exits 0", filled.code === 0 && filled.out.trim() === `OK ${construct}: figures filled from its language block`, filled.out);
ok("[MKT.SCRIPTS.607] each marked block holds its table", after.includes("| Element | Style |\n| --- | --- |\n| Wire | thin, round caps |") && after.includes("| Element | Token | Strength |\n| --- | --- | --- |\n| Wire | --ds-drawing-wire | 30% of the text |"), after);
ok("[MKT.SCRIPTS.608] the words outside the blocks are unchanged", after.startsWith("# Design Language\n\nWords the author wrote.\n") && after.endsWith("After the blocks."), after);
run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.609] a second run changes nothing", readFileSync(construct, "utf8") === after);

console.log("\n=== language write — a block the data has no rows for");
writeFileSync(construct, text(["characters"], LANGUAGE));
const missing = run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.610] it is refused by name and the block stays as written", missing.code === 1 && missing.out.trim() === `REFUSED language-data ${construct}: no rows for characters, which ${construct} marks to be filled` && readFileSync(construct, "utf8") === text(["characters"], LANGUAGE), missing.out);

console.log("\n=== language write — the construct's language block");
writeFileSync(construct, text(["drawingStyle"], LANGUAGE));
const read = run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.615] language write reads the construct's language block, and refuses a construct with none", read.code === 0 && readFileSync(construct, "utf8").includes("| Wire | thin, round caps |"), read.out);
const bare = ["# Design Language", "", "### Drawing style", "", "{{Filled by `spn-surface language write`.}}", ""].join("\n");
writeFileSync(construct, bare);
const none = run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.615] a construct with no language block is refused naming it and the heading", none.code !== 0 && none.out.includes(construct) && none.out.includes("### The language as data") && readFileSync(construct, "utf8") === bare, none.out);

console.log("\n=== language write — a placeholder found by its part id, a template it does not read, the default construct");
const BYID = { mediaStyle: { drawingStyle: [{ element: "Tile", style: "radius 10" }] }, drawingStyle: [{ element: "Wire", style: "by words" }] };
const idText = (language) => ["# Design Language", "", ...block(language), "#### Drawing style", "<!-- spn:part media-style.drawing-style status=SET applies=SITE samples=none -->", "", "{{Filled by `spn-surface language write`.}}", ""].join("\n");
writeFileSync(construct, idText({ template: 2, ...BYID }));
const byId = run(dir, "--construct", construct);
const idAfter = readFileSync(construct, "utf8");
ok("[MKT.SCRIPTS.618] a placeholder under a #### heading is filled from its part id, before the heading's words", byId.code === 0 && idAfter.includes("<!-- spn:filled media-style.drawing-style -->") && idAfter.includes("| Tile | radius 10 |") && !idAfter.includes("| Wire | by words |"), idAfter);
run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.618] a second run on an id-filled construct changes nothing", readFileSync(construct, "utf8") === idAfter);
writeFileSync(construct, idText({ drawingStyle: BYID.drawingStyle }));
run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.618] with no row under its id, the heading's words fill it", readFileSync(construct, "utf8").includes("| Wire | by words |"));
const future = idText({ template: 9, ...BYID });
writeFileSync(construct, future);
const refused = run(dir, "--construct", construct);
ok("[MKT.SCRIPTS.619] a block of template 9 is refused naming the version, and the construct stays as written", refused.code === 1 && refused.out.includes("names template 9") && readFileSync(construct, "utf8") === future, refused.out);
const repo = mkdtempSync(join(tmpdir(), "language-repo-"));
mkdirSync(join(repo, "docs", "02-constructs", "10-surfaces"), { recursive: true });
mkdirSync(join(repo, "apps", "web"), { recursive: true });
writeFileSync(join(repo, "docs", "02-constructs", "10-surfaces", "03-design-language.md"), idText({ template: 2, ...BYID }));
const found = run(join(repo, "apps", "web"));
ok("[MKT.SCRIPTS.620] with no flag the construct is found in a surfaces folder of any number above the app", found.code === 0 && found.out.includes("10-surfaces") && readFileSync(join(repo, "docs", "02-constructs", "10-surfaces", "03-design-language.md"), "utf8").includes("| Tile | radius 10 |"), found.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
