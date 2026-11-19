// `language write` — a construct's marked figures filled from the app's design-language.json, and nothing else changed.
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
const data = join(dir, "design-language.json");
const HEADINGS = { drawingStyle: "Drawing style", colourAndStrength: "Colour and strength", characters: "Characters" };
const text = (keys) => ["# Design Language", "", "Words the author wrote.", "", ...keys.flatMap((key) => [`### ${HEADINGS[key]}`, "", "{{Filled by `spn-surface language write`.}}", ""]), "After the blocks."].join("\n");

console.log("=== language write — fills the marked blocks from the data");
writeFileSync(data, JSON.stringify({
  drawingStyle: [{ element: "Wire", style: "thin, round caps" }],
  colourAndStrength: [{ element: "Wire", token: "--ds-drawing-wire", strength: "30% of the text" }],
}));
writeFileSync(construct, text(["drawingStyle", "colourAndStrength"]));
const filled = run(dir, "--construct", construct, "--data", data);
const after = readFileSync(construct, "utf8");
ok("[MKT.SCRIPTS.606] it prints one OK line and exits 0", filled.code === 0 && filled.out.trim() === `OK ${construct}: figures filled from ${data}`, filled.out);
ok("[MKT.SCRIPTS.607] each marked block holds its table", after.includes("| Element | Style |\n| --- | --- |\n| Wire | thin, round caps |") && after.includes("| Element | Token | Strength |\n| --- | --- | --- |\n| Wire | --ds-drawing-wire | 30% of the text |"), after);
ok("[MKT.SCRIPTS.608] the words outside the blocks are unchanged", after.startsWith("# Design Language\n\nWords the author wrote.\n") && after.endsWith("After the blocks."), after);
run(dir, "--construct", construct, "--data", data);
ok("[MKT.SCRIPTS.609] a second run changes nothing", readFileSync(construct, "utf8") === after);

console.log("\n=== language write — a block the data has no rows for");
writeFileSync(construct, text(["characters"]));
const missing = run(dir, "--construct", construct, "--data", data);
ok("[MKT.SCRIPTS.610] it is refused by name and the block stays as written", missing.code === 1 && missing.out.trim() === `REFUSED language-data ${data}: no rows for characters, which ${construct} marks to be filled` && readFileSync(construct, "utf8") === text(["characters"]), missing.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
