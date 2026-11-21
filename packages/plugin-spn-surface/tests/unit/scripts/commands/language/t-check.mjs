// `language check` — a construct whose filled tables differ from the block they are filled from is refused, and a matching one passes.
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
const run = (command, ...args) => {
  try { return { out: execFileSync("node", [CLI, "language", command, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};

const dir = mkdtempSync(join(tmpdir(), "language-check-"));
const construct = join(dir, "design-language.md");
const text = (language) => ["# Design Language", "", "### The language as data", "", "```json", JSON.stringify({ language }, null, 2), "```", "", "#### Drawing style", "<!-- spn:part media-style.drawing-style status=SET applies=SITE samples=none -->", "", "{{Filled by `spn-surface language write`.}}", ""].join("\n");
const LANGUAGE = { template: 2, mediaStyle: { drawingStyle: [{ element: "Tile", style: "radius 10" }] } };

console.log("=== language check — the filled tables against the block");
writeFileSync(construct, text(LANGUAGE));
run("write", dir, "--construct", construct);
const same = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.621] a construct filled from its block passes with one OK line and exit 0", same.code === 0 && same.out.trim() === `OK ${construct}: 1 filled table(s) match the language block`, same.out);
const filled = readFileSync(construct, "utf8");
writeFileSync(construct, filled.replace("radius 10", "radius 12"));
const drift = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.621] a table edited by hand is refused naming its key, and the construct is not changed", drift.code === 1 && drift.out.includes("REFUSED language-drift") && drift.out.includes("media-style.drawing-style") && readFileSync(construct, "utf8") === filled.replace("radius 10", "radius 12"), drift.out);
writeFileSync(construct, filled.replace('"radius 10"', '"radius 14"'));
const moved = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.621] a block that moved on while its table stayed is refused", moved.code === 1 && moved.out.includes("media-style.drawing-style"), moved.out);

console.log("\n=== language check — a template it does not read");
writeFileSync(construct, filled.replace('"template": 2', '"template": 9'));
const future = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.619] a block of template 9 is refused naming the version", future.code === 1 && future.out.includes("names template 9"), future.out);

console.log("\n=== language check — a part holds its rule, never a pointer to it");
writeFileSync(construct, filled);
const pointerText = filled + "\n#### Colour and strength\n<!-- spn:part media-style.colour-and-strength status=SET applies=SITE samples=none -->\n\nDecided in 041 N008.\n";
writeFileSync(construct, pointerText);
const pointer = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.621] a part that reads only a pointer is refused naming its id", pointer.code === 1 && pointer.out.includes("REFUSED language-pointer") && pointer.out.includes("media-style.colour-and-strength"), pointer.out);
writeFileSync(construct, filled + "\n#### Colour and strength\n<!-- spn:part media-style.colour-and-strength status=DEFAULT applies=SITE samples=none -->\n\nThe design system's neutral ramp, with the accent on one unit.\n");
const named = run("check", dir, "--construct", construct);
ok("[MKT.SCRIPTS.621] a part that names the default it follows passes", named.code === 0, named.out);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
