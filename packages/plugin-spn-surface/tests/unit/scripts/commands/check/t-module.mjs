// `check module` — a web module's folders, refused where they leave its taxonomy, and the fixed module passing.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
const run = (dir) => {
  try { return { out: execFileSync("node", [CLI, "check", "module", dir], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, SPN_TELEMETRY: "off" } }), code: 0 }; }
  catch (error) { return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status ?? 1 }; }
};

const root = mkdtempSync(join(tmpdir(), "check-module-"));
const module = (name, folders) => {
  const dir = join(root, name);
  for (const folder of folders) mkdirSync(join(dir, folder), { recursive: true });
  return dir;
};

console.log("=== check module — a folder outside a module's taxonomy");
const bad = module("bad", ["assets/drawings/home", "entry/ui", "images"]);
const refused = run(bad);
ok("[MKT.SCRIPTS.605] a folder beside assets/ and entry/ is refused", refused.code === 1 && refused.out.trim() === `REFUSED folder-outside-taxonomy ${bad}/images: a module holds \`assets/\` and \`entry/\` only; move the files into the folder of their kind`, `exit ${refused.code}: ${refused.out.trim()}`);

const mixed = module("mixed", ["assets/drawings/home", "entry/ui"]);
writeFileSync(join(mixed, "assets", "drawings", "stray.svg"), "<svg/>");
const second = run(mixed);
ok("[MKT.SCRIPTS.605] an assets folder holding folders and files is refused", second.code === 1 && second.out.includes("holds folders or files, never both"), second.out.trim());

const good = module("good", ["assets/language", "assets/drawings/home", "entry/ui"]);
writeFileSync(join(good, "assets", "language", "design-language.json"), "{}\n");
const fixed = run(good);
ok("[MKT.SCRIPTS.605] assets/ and entry/ with folders by kind passes", fixed.code === 0 && fixed.out.startsWith("OK "), `exit ${fixed.code}: ${fixed.out.trim()}`);

const offSchema = module("off-schema", ["assets/language", "entry/ui"]);
writeFileSync(join(offSchema, "assets", "language", "design-language.json"), '{"drawingStyle": 7, "nothing": "a schema would refuse"}\n');
const unread = run(offSchema);
ok("[MKT.SCRIPTS.612] the module check reads no design-language data file: one off any schema passes", unread.code === 0 && unread.out.startsWith("OK "), `exit ${unread.code}: ${unread.out.trim()}`);

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
