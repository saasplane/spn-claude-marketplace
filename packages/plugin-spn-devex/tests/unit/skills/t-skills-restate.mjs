// Every `SKILL.md` of the four plugins names the book chapters it restates, in its restates block, so a check can read
// where each of its rules is stated and say when a chapter has moved past it (MKT.SKILLS.07). A skill states no rule
// of its own; the block is how it points at the chapter that does.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { PLUGIN } from "../../helpers/harness.mjs";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const PACKAGES = resolve(PLUGIN, "..");
const skills = [];
for (const plugin of readdirSync(PACKAGES).filter((name) => name.startsWith("plugin-spn-"))) {
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === "SKILL.md") skills.push(path);
    }
  };
  walk(join(PACKAGES, plugin, "src", "skills"));
  walk(join(PACKAGES, plugin, "src", "providers"));
}

/** The book chapters a skill's restates block names, each with the hash last read from it. */
const cited = (text) => {
  const block = /<!-- spn:restates\s*(\{[\s\S]*?\})\s*-->/.exec(text);
  if (!block) return [];
  try { return (JSON.parse(block[1]).docs ?? []).filter((doc) => /^spn-foundation\/docs\//.test(doc.path) && /^[0-9a-f]{8}$/.test(doc.seen)); }
  catch { return []; }
};

ok("[MKT.SKILLS.07] the four plugins' skills are found", skills.length >= 20, String(skills.length));
const bare = skills.filter((path) => cited(readFileSync(path, "utf8")).length === 0).map((path) => path.slice(PACKAGES.length + 1));
ok("[MKT.SKILLS.07] every skill names at least one book chapter it restates, with the hash last read from it", bare.length === 0, bare.join(", "));

console.log(failed ? `\n  ${failed} of ${total} FAILED — skills restate` : `\n  all ${total} passed — skills restate`);
process.exit(failed ? 1 : 0);
