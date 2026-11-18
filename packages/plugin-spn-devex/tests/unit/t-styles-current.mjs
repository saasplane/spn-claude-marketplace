// The shared page styles (`05-artifacts.md` § One stylesheet, served in versions): the built stylesheet
// is what its source builds, and a version that was cut holds the bytes it was cut with. A built file
// that fell behind its source would be served to every page at the next cut, and a version that
// changed would restyle every page that links it.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN = join(import.meta.dirname, "..", "..");
const ROOT = join(PLUGIN, "..", "..");
const STYLES = join(PLUGIN, "src", "styles");
const SERVED = join(ROOT, "public", "assets", "docs");
const FILES = ["sds-docs.css", "sds-docs.js", "sds-index.js"];

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

console.log("=== styles current — the built stylesheet equals a fresh build of its source");
let check = { status: 0, output: "" };
try {
  check.output = execFileSync(process.execPath, [join(ROOT, "scripts", "build-styles.mjs"), "--check"], { encoding: "utf8" });
} catch (error) {
  check = { status: error.status ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
}
ok("a fresh build of sds-docs.src.css writes the bytes of sds-docs.css", check.status === 0, check.output.trim());
for (const name of FILES) ok(`src/styles/${name} is there`, existsSync(join(STYLES, name)));

console.log("=== styles on the design system — the docs classes read the product's tokens");
{
  const built = readFileSync(join(STYLES, "sds-docs.css"), "utf8");
  const source = readFileSync(join(STYLES, "sds-docs.src.css"), "utf8");
  const tokens = readFileSync(join(STYLES, "ds-tokens.css"), "utf8");
  const variables = (names) => names.every((name) => new RegExp(`^\\s*${name}:`, "m").test(built));
  ok("the stylesheet holds the design system's token names: --surface, --surface-raised, --fg, --fg-quiet, --border, --radius, --font-text, --font-code, --seed-primary",
    variables(["--surface", "--surface-raised", "--fg", "--fg-quiet", "--border", "--radius", "--font-text", "--font-code", "--seed-primary"]));
  ok("the stylesheet derives a palette from --seed-primary, and sets dark with data-mode",
    built.includes("oklch(from var(--seed-primary)") && /\[data-mode=['"]dark['"]\]/.test(built));
  ok("ds-tokens.css names the design-system version it was copied from, and is imported first by the source",
    /copied whole by `spn-devex docs sds cut` from support-web-ds-ts v\d+\.\d+\.\d+/.test(tokens) && /@import "\.\/ds-tokens\.css";/.test(source));
  ok("the docs names read the design system's: --sds-paper is --surface, --sds-ink is --fg, --sds-rule is --border",
    /--sds-paper: var\(--surface\)/.test(built) && /--sds-ink: var\(--fg\)/.test(built) && /--sds-rule: var\(--border\)/.test(built));
  ok("the fonts are declared under the design system's names, DSDefaultText and DSDefaultCode, on the same two Geist files, and SDSText and SDSCode are gone",
    /font-family: DSDefaultText;[^}]*Geist-Variable\.woff2/.test(built) && /font-family: DSDefaultCode;[^}]*GeistMono-Variable\.woff2/.test(built) && !/SDSText|SDSCode/.test(built));
  ok("the page script sets data-mode where a page names none", /setAttribute\('data-mode'/.test(readFileSync(join(STYLES, "sds-docs.js"), "utf8")));
}

console.log("=== styles versions — a version that was cut never changes");
const versions = JSON.parse(readFileSync(join(STYLES, "versions.json"), "utf8"));
const folders = existsSync(SERVED) ? readdirSync(SERVED).sort() : [];
ok("every folder under public/assets/docs is a version the list holds, and every version has its folder",
  JSON.stringify(folders) === JSON.stringify(Object.keys(versions).sort()),
  `folders: ${folders.join(", ")} · listed: ${Object.keys(versions).join(", ")}`);
for (const [version, files] of Object.entries(versions)) {
  // From 1.12.0 a version also holds `fonts/`, the Geist files the stylesheet's @font-face rules name by a relative url.
  const withFonts = existsSync(join(SERVED, version, "fonts"));
  ok(`${version} serves the three files and no other${withFonts ? ", and the fonts folder beside them" : ""}`,
    JSON.stringify(Object.keys(files).sort()) === JSON.stringify(FILES)
      && JSON.stringify(readdirSync(join(SERVED, version)).sort()) === JSON.stringify((withFonts ? [...FILES, "fonts"] : FILES).sort()));
  if (withFonts) {
    ok(`${version}/fonts holds the two Geist files and their licence, the bytes the styles folder holds`,
      JSON.stringify(readdirSync(join(SERVED, version, "fonts")).sort()) === JSON.stringify(["Geist-Variable.woff2", "GeistMono-Variable.woff2", "OFL.txt"].sort())
        && readdirSync(join(SERVED, version, "fonts")).every((name) => sha(join(SERVED, version, "fonts", name)) === sha(join(STYLES, "fonts", name))));
  }
  for (const [name, hash] of Object.entries(files))
    ok(`${version}/${name} holds the bytes it was cut with`, sha(join(SERVED, version, name)) === hash);
}

console.log("=== styles integrity — every version carries the hash a browser checks its files against");
const integrity = JSON.parse(readFileSync(join(STYLES, "integrity.json"), "utf8"));
ok("the integrity table holds exactly the versions that were cut",
  JSON.stringify(Object.keys(integrity).sort()) === JSON.stringify(Object.keys(versions).sort()));
for (const version of Object.keys(versions))
  for (const name of FILES)
    ok(`${version}/${name} holds the sha384 the table records`,
      integrity[version]?.[name] === `sha384-${createHash("sha384").update(readFileSync(join(SERVED, version, name))).digest("base64")}`);

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-styles-current` : `\n  all ${total} passed — t-styles-current`);
process.exit(failed ? 1 : 0);
