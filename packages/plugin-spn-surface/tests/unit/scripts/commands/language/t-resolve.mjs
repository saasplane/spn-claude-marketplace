// `spn-surface language resolve` — a language found live: the repository's own, an installed package's, one the plugin lists, then base
// (RULE.SUPPORT.SURFACE.640). The listed step reads a languages.json and a store a case names, so no case reads the network.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

const dir = mkdtempSync(join(tmpdir(), "language-resolve-"));
const store = join(dir, "store");
const list = join(dir, "languages.json");
writeFileSync(list, JSON.stringify({ languages: [{ name: "base", package: "refs/specs/surface/languages/base", version: null }, { name: "platform", package: "@saasplane/support-web-ui-ts", version: "0.43.0" }] }));
const fetched = join(store, "@saasplane", "support-web-ui-ts@0.43.0", "surface", "languages", "platform");
mkdirSync(fetched, { recursive: true });
writeFileSync(join(fetched, "spdl.json"), JSON.stringify({ name: "platform", extends: "base" }));
process.env.SPN_SURFACE_LANGUAGES = list;
process.env.SPN_SURFACE_LANGUAGE_STORE = store;
const { resolveLanguage, listedLanguages } = await import("../../../../../src/scripts/commands/language/resolve.ts");

console.log("=== language resolve — the listed step");
ok("[MKT.SCRIPTS.725] the plugin's language list is read as { name, package, version }", listedLanguages().map((one) => one.name).join(",") === "base,platform");
const found = resolveLanguage("platform", null, []);
ok("[MKT.SCRIPTS.725] a language no repository holds or installs resolves from the list, read from the store once fetched", found.found === fetched && found.steps.some((step) => step.startsWith("listed: @saasplane/support-web-ui-ts@0.43.0")), JSON.stringify(found));
const nowhere = resolveLanguage("nosuch", null, []);
ok("[MKT.SCRIPTS.725] a language the list does not name says so, and resolves nowhere", nowhere.found === null && nowhere.steps.includes("listed: none"), JSON.stringify(nowhere));
const own = join(dir, "repo");
mkdirSync(join(own, "docs", "specs", "surface", "languages", "platform"), { recursive: true });
writeFileSync(join(own, "docs", "specs", "surface", "languages", "platform", "spdl.json"), JSON.stringify({ name: "platform", extends: "base" }));
writeFileSync(join(own, "sprepo.json"), "{}");
const first = resolveLanguage("platform", own, []);
ok("[MKT.SCRIPTS.725] the repository's own language answers before the list", first.found === join(own, "docs", "specs", "surface", "languages", "platform") && !first.steps.some((step) => step.startsWith("listed")), JSON.stringify(first));

console.log(failed ? `\n  ${failed} of ${total} FAILED` : `\n  all ${total} passed`);
process.exit(failed ? 1 : 0);
