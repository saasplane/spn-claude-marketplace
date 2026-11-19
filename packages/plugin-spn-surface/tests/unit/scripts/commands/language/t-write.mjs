// `language write` — a construct's marked figures filled from its own `language` block, and nothing else changed.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
