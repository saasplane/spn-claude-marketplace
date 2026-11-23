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
const FILES = ["docs-language.css", "docs-page.js", "docs-index.js"];
// Versions before 1.16.0 keep the names they were cut with, which never change.
const OLD_FILES = ["sds-docs.css", "sds-docs.js", "sds-index.js"];
// From 1.16.0 a version also serves the design system's scoped stylesheet and its whole one.
const UNIT_FILES = ["design-system-units.css", "design-system.css"];
const filesOf = (version) => { const [major, minor] = version.split(".").map(Number); return major > 1 || minor >= 16 ? [...FILES, ...UNIT_FILES] : OLD_FILES; };

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
ok("[MKT.SCRIPTS.589] a fresh build of docs-language.src.css writes the bytes of docs-language.css", check.status === 0, check.output.trim());
for (const name of [...FILES, ...UNIT_FILES, "design-system-units.json"]) ok(`src/styles/${name} is there`, existsSync(join(STYLES, name)));
{
  const units = JSON.parse(readFileSync(join(STYLES, "design-system-units.json"), "utf8"));
  ok("design-system-units.json names the design-system version of design-system-units.css and lists the units it builds",
    units.designSystem === /support-web-ds-ts v(\d+\.\d+\.\d+)/.exec(readFileSync(join(STYLES, "design-system-units.css"), "utf8").split("\n")[0])?.[1] && Array.isArray(units.units) && units.units.includes("DSLayout") && units.units.includes("DSFeature"));
  ok("design-system.css is the scoped stylesheet's source whole: every rule of it stands unscoped",
    !readFileSync(join(STYLES, "design-system.css"), "utf8").includes(".sds-unit") && readFileSync(join(STYLES, "design-system.css"), "utf8").length < readFileSync(join(STYLES, "design-system-units.css"), "utf8").length);
}

console.log("=== styles on the design system — the docs classes read the product's tokens");
{
  const built = readFileSync(join(STYLES, "docs-language.css"), "utf8");
  const source = readFileSync(join(STYLES, "docs-language.src.css"), "utf8");
  const tokens = readFileSync(join(STYLES, "design-system-tokens.css"), "utf8");
  const variables = (names) => names.every((name) => new RegExp(`^\\s*${name}:`, "m").test(built));
  ok("[RULE.DEVEX.WORKSPACE.524] [MKT.SCRIPTS.588] the stylesheet holds the design system's token names: --surface, --surface-raised, --fg, --fg-quiet, --border, --radius, --font-text, --font-code, --seed-primary",
    variables(["--surface", "--surface-raised", "--fg", "--fg-quiet", "--border", "--radius", "--font-text", "--font-code", "--seed-primary"]));
  ok("[MKT.SCRIPTS.588] the stylesheet derives a palette from --seed-primary, and sets dark with data-mode",
    built.includes("oklch(from var(--seed-primary)") && /\[data-mode=['"]dark['"]\]/.test(built));
  ok("[MKT.SCRIPTS.588] design-system-tokens.css names the design-system version or commit it was copied from, and is imported first by the source",
    /copied whole by `spn-devex docs styles cut` from support-web-ds-ts (?:v\d+\.\d+\.\d+|[0-9a-f]{7,})/.test(tokens) && /@import "\.\/design-system-tokens\.css";/.test(source));
  ok("[MKT.SCRIPTS.588] the docs names read the design system's: --sds-paper is --surface, --sds-ink is --fg, --sds-rule is --border",
    /--sds-paper: var\(--surface\)/.test(built) && /--sds-ink: var\(--fg\)/.test(built) && /--sds-rule: var\(--border\)/.test(built));
  ok("[MKT.SCRIPTS.588] the fonts are declared under the design system's names, DSDefaultText and DSDefaultCode, on the same two Geist files, and SDSText and SDSCode are gone",
    /font-family: DSDefaultText;[^}]*Geist-Variable\.woff2/.test(built) && /font-family: DSDefaultCode;[^}]*GeistMono-Variable\.woff2/.test(built) && !/SDSText|SDSCode/.test(built));
  ok("[MKT.SCRIPTS.589] the page script sets data-mode where a page names none", /setAttribute\('data-mode'/.test(readFileSync(join(STYLES, "docs-page.js"), "utf8")));
  const script = readFileSync(join(STYLES, "docs-page.js"), "utf8");
  ok("[MKT.SCRIPTS.589] the surface page builds its frame's document from the template named page, with design-system.css and the app's stylesheet linked, and sets the mode on the frame directly",
    /getElementById\('page'\)/.test(script) && /frame\.srcdoc = pageDocument\(\)/.test(script) && /design-system\.css/.test(script) && /surface-app-css/.test(script)
      && /documentElement\.setAttribute\('data-mode', state\.mode\)/.test(script));
  ok("[MKT.SCRIPTS.589] the surface page sends no message and reads no preview-mode meta: the switches set the frame's own document",
    !/postMessage/.test(script) && !/preview-mode/.test(script) && !/surface-page-preview/.test(script));
  ok("[MKT.SCRIPTS.589] a page with no rail and three or more sections whose heads hold an h2 gets the rail from the script, and one with fewer gets none",
    /secs\.length<3\)return/.test(script) && /sds-has-rail/.test(script) && /createElement\('nav'\);rail\.className='sds-rail'/.test(script));
  ok("[MKT.SCRIPTS.589] the page grid gives the content the free width and the outline its own: .sds-page's columns put minmax(0,1fr) first and the rail's width second",
    /\.sds-page\{[^}]*grid-template-columns:minmax\(0,1fr\) var\(--sds-rail-width\)/.test(source));
  ok("[MKT.SCRIPTS.589] a narrow page folds the rail into a menu under the title, opened by a button",
    /sds-rail-toggle/.test(script) && /matchMedia\('\(max-width: 69rem\)'\)/.test(script));
  ok("[MKT.SCRIPTS.589] the page grid puts the wrap first and the rail second, on the right, and a page template page has the whole width",
    /\.sds-page > \.sds-wrap\{grid-column:1/.test(source) && /\.sds-page > \.sds-rail\{grid-column:2/.test(source) && /\.sds-page\[data-frame="page"\]\{grid-template-columns:minmax\(0,1fr\)\}/.test(source));
  const token = (name) => new RegExp(`${name}:\\s*([0-9.]+)rem`).exec(source)?.[1];
  const index = readFileSync(join(STYLES, "docs-index.js"), "utf8");
  ok("[MKT.SCRIPTS.589] the widths of the regions are tokens: the reading width 58rem, the content floor 48rem, the page's side padding 2rem, the page cap 90rem, the outline 14rem, the tree 13.5rem growing to 22rem, and the two folds 69rem and 82.5rem",
    token("--sds-measure") === "58" && token("--sds-content-floor") === "48" && token("--sds-page-pad") === "2" && token("--sds-page-max") === "90" && token("--sds-rail-width") === "14" && /--sds-tree-width:clamp\(13\.5rem,calc\(100vw - 71\.5rem\),22rem\)/.test(source) && token("--sds-outline-fold") === "69" && token("--sds-tree-fold") === "82.5"
      && Number(token("--sds-tree-fold")) - Number(token("--sds-outline-fold")) === 13.5 && 71.5 === Number(token("--sds-outline-fold")) + 2.5);
  ok("[MKT.SCRIPTS.589] the outline folds at the content floor plus the outline, its gap and the two side paddings, so the content never narrows below the floor, and the tree folds first, at that and the tree's least width",
    Number(token("--sds-outline-fold")) === Number(token("--sds-content-floor")) + Number(token("--sds-rail-width")) + 3 + 2 * Number(token("--sds-page-pad")) && Number(token("--sds-tree-fold")) === Number(token("--sds-outline-fold")) + 13.5
      && Number(token("--sds-tree-fold")) > Number(token("--sds-outline-fold")));
  ok("[MKT.SCRIPTS.589] the typed numbers agree with the tokens: the page's query and the page script at the outline's fold, the index's query and the index script at the tree's fold",
    source.includes(`@media (max-width:${token("--sds-outline-fold")}rem){\n    .sds-page, .sds-page[data-frame="page"].sds-has-rail{`) && source.includes(`@media (max-width:${token("--sds-tree-fold")}rem){\n    .sds-index,.sds-index.sds-is-folded{`)
      && script.includes(`matchMedia('(max-width: ${token("--sds-outline-fold")}rem)')`) && index.includes(`matchMedia('(max-width:${token("--sds-tree-fold")}rem)')`));
  ok("[MKT.SCRIPTS.589] a surface page's note is a sticky note drawn by one class in the frame's document, from the design system's warning tokens",
    /\.sds-note\{[^}]*border:1px solid var\(--warning\)[^}]*background:var\(--warning-subtle\);color:var\(--on-warning-subtle\)/.test(script) && !/\[data-note\]\{[^}]*background/.test(script));
  ok("[MKT.SCRIPTS.589] running text stops at the reading width, and a page's content column is never narrower than it where the outline stands",
    /p\{margin:0 0 1rem; max-width:var\(--sds-measure\)\}/.test(source) && /\.sds-standfirst\{[^}]*max-width:var\(--sds-measure\)/.test(source) && /\.sds-page > \.sds-rail\{grid-column:2/.test(source));
  ok("[MKT.SCRIPTS.589] the breadcrumb is a small muted line, and the rail's title reads the name over On this page",
    /\.sds-crumb\{/.test(source) && /\.sds-rail-title::after\{content:"On this page"/.test(source) && /\.sds-crumb/.test(built) && /On this page/.test(built));
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
  const served = filesOf(version);
  ok(`${version} serves the ${served.length === 3 ? "three" : "five"} files and no other${withFonts ? ", and the fonts folder beside them" : ""}`,
    JSON.stringify(Object.keys(files).sort()) === JSON.stringify([...served].sort())
      && JSON.stringify(readdirSync(join(SERVED, version)).sort()) === JSON.stringify((withFonts ? [...served, "fonts"] : served).sort()));
  if (withFonts) {
    // From 1.15.0 the design system's display font, Schibsted Grotesk, ships beside Geist, with its own licence.
    const wanted = ["Geist-Variable.woff2", "GeistMono-Variable.woff2", "OFL.txt", ...(Number(version.split(".")[1]) >= 15 ? ["SchibstedGrotesk-Variable.woff2", "OFL-SchibstedGrotesk.txt"] : [])];
    ok(`${version}/fonts holds the Geist files and their licence${wanted.length > 3 ? ", and the display font and its licence from 1.15.0" : ""}, the bytes the styles folder holds`,
      JSON.stringify(readdirSync(join(SERVED, version, "fonts")).sort()) === JSON.stringify(wanted.sort())
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
  for (const name of filesOf(version))
    ok(`${version}/${name} holds the sha384 the table records`,
      integrity[version]?.[name] === `sha384-${createHash("sha384").update(readFileSync(join(SERVED, version, name))).digest("base64")}`);

console.log("=== styles fonts — a surface page draws in the design system's own fonts");
{
  // design-system.css is loaded from the folder of its version by a surface page, so its @font-face urls must read `fonts/<file>` like the scoped file's, and each file
  // they name must be in the cut's `fonts/` folder.
  for (const name of ["design-system.css", "design-system-units.css"]) {
    const css = readFileSync(join(STYLES, name), "utf8");
    const urls = [...css.matchAll(/url\(\s*["']?([^)"']*\.woff2)["']?\s*\)/g)].map((match) => match[1]);
    ok(`${name} names its fonts as fonts/<file>, and never ../assets/fonts`, urls.length > 0 && urls.every((url) => /^fonts\/[^/]+$/.test(url)) && !css.includes("../assets/fonts"), urls.join(" "));
    const cut = join(SERVED, "1.16.0", "fonts");
    ok(`every font ${name} names is in the cut's fonts folder`, urls.every((url) => existsSync(join(cut, url.slice("fonts/".length)))), urls.join(" "));
  }
}

console.log("=== the design system's version — the cut files, the tokens and the units list are one release");
{
  const first = (name) => readFileSync(join(STYLES, name), "utf8").split("\n")[0];
  const versionOf = (name) => /support-web-ds-ts v(\d+\.\d+\.\d+)/.exec(first(name))?.[1];
  const units = JSON.parse(readFileSync(join(STYLES, "design-system-units.json"), "utf8"));
  ok("design-system.css, design-system-units.css, design-system-tokens.css and the units list name one design-system version",
    new Set([versionOf("design-system.css"), versionOf("design-system-units.css"), versionOf("design-system-tokens.css"), units.designSystem]).size === 1 && Boolean(units.designSystem),
    [versionOf("design-system.css"), versionOf("design-system-units.css"), versionOf("design-system-tokens.css"), units.designSystem].join(" "));
}

console.log("=== the index's brand — a link to the index itself, which opens its default page");
{
  const index = readFileSync(join(STYLES, "docs-index.js"), "utf8");
  ok("[MKT.SCRIPTS.589] the index opens its default page, the first row of the tree, from one function, and the brand says which page that is: aria-label `Open <name>`",
    /function defaultRow\(\)\{return rows\[0\];\}/.test(index) && /show\(start\)/.test(index) && /var start=\(first\|\|defaultRow\(\)\)\.entry;/.test(index)
      && /var openName='Open '\+named\(defaultRow\(\)\.entry\);/.test(index) && /brand\.setAttribute\('aria-label',openName\)/.test(index));
  ok("[MKT.SCRIPTS.589] the brand is a real link to index.html in the index template, so a click, a middle click and copy link give the index with no hash",
    /<a class="sds-rail-brand" href="index\.html"/.test(readFileSync(join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "templates", "docs", "pages", "index-template.html"), "utf8")));
}

console.log("=== the index shows one page at a time — no tab strip, and a door is one link");
{
  const index = readFileSync(join(STYLES, "docs-index.js"), "utf8");
  const source = readFileSync(join(STYLES, "docs-language.src.css"), "utf8");
  const template = readFileSync(join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "templates", "docs", "pages", "index-template.html"), "utf8");
  ok("[MKT.SCRIPTS.589] the index script holds no tab: no strip, no close, no state of tabs, one frame, and the address is pushed by a click",
    !/sds-tab\b|sds-tab-|tablist|role','tab'|shut\(|tabs\.push|data\.tabs/.test(index) && /pushState\(null,'',hashOf\(entry\)\)/.test(index) && /addEventListener\('hashchange'/.test(index));
  ok("[MKT.SCRIPTS.589] the bar holds the page's name and three buttons: reload, copy link and open in a new window",
    /data-act|tool\('reload'/.test(index) && /tool\('copy','Copy link'/.test(index) && /tool\('away','Open in a new window'/.test(index) && /sds-bar-name/.test(index));
  ok("[MKT.SCRIPTS.589] a key held on a click, and a middle click, are left to the browser, and no row carries a second arrow",
    /if\(held&&!unfilled\(entry\)\)return;/.test(index) && !/sds-tree-new/.test(index) && !/sds-tree-new/.test(source));
  ok("[MKT.SCRIPTS.589] the stylesheet holds no rule only the tab strip used, and keeps the bar's",
    !/\.sds-tabs\{|\.sds-tab\{|\.sds-tab-|\.sds-tab\./.test(source) && /\.sds-pagebar\{/.test(source) && /\.sds-bar-button\{/.test(source) && /\.sds-bar-copied\{/.test(source));
  ok("[MKT.SCRIPTS.589] the index template has the bar and the frame's place and no tab strip, and its data holds no limit of tabs",
    /id="index-bar"/.test(template) && /id="index-panes"/.test(template) && !/index-tabs|role="tablist"|"tabs"/.test(template));
  ok("[MKT.SCRIPTS.532] a door is one link: the arrow moves right on hover and focus, the border and the title turn to the accent, and focus draws the tree's ring",
    /a\.sds-door:hover \.sds-door-arrow,a\.sds-door:focus-visible \.sds-door-arrow\{transform:translateX\(\.25rem\)\}/.test(source)
      && /a\.sds-door:hover,a\.sds-door:focus-visible\{border-color:var\(--sds-accent\)\}/.test(source) && /a\.sds-door:focus-visible\{outline:2px solid var\(--sds-accent\); outline-offset:-2px\}/.test(source));
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — t-styles-current` : `\n  all ${total} passed — t-styles-current`);
process.exit(failed ? 1 : 0);
