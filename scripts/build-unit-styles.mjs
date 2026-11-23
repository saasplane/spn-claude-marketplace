#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The blocks · § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// The cut of `design-system-units.css`: the design system's own `style.css`, every rule of it scoped under `.sds-unit`, so a unit's markup
// can stand in a docs page (the UNIT block) and the docs page's own styles are not touched by the design system's.
//
//     node scripts/build-unit-styles.mjs                          cut it from the design-system version `design-system-tokens.css` was copied from
//     node scripts/build-unit-styles.mjs --from <style.css> [--version <v>]   cut it from this file
//     node scripts/build-unit-styles.mjs --units <snapshot.json>  read the built units from this snapshot (default: the one `spnutils apps surface snapshot support-web-ds-ts` writes)
//     node scripts/build-unit-styles.mjs --check                  exit 1 where a file in the styles folder is not what a cut writes
//
// THREE FILES ARE CUT, and a version from 1.16.0 serves the first two beside the shared stylesheet:
//   design-system-units.css         the design system's `style.css`, scoped under `.sds-unit`, for a unit drawn inline in a docs page
//   design-system.css   the same `style.css`, whole and unscoped, for a page of its own that holds the design system's markup
//   design-system-units.json       the units the design system builds, `{ designSystem, readFrom, units: [...] }`, which the page writer reads to
//                       tell a skeleton of a built unit from one that is planned. It is read from the surface snapshot of
//                       `support-web-ds-ts`; where none is on the machine the list is not rewritten and says so.
//
// WHERE THE SOURCE IS READ. `design-system-tokens.css` says in its first line which version of `support-web-ds-ts` it was copied from.
// That version's published package holds `styles/style.css`; the agent's cache of the design system holds one folder per version
// at `~/.saasplane/cache/design-system/<version>/node_modules/@saasplane/support-web-ds-ts/styles/style.css`.
//
// THE SCOPING, rule by rule:
//   `:root`, `:host`, `html`, `body`       become `.sds-unit`
//   `[data-mode=light|dark]`               become `.sds-unit[data-mode=…]`, and `.sds-unit [data-mode=…]` too, because the design
//                                          system also forces a mode on a block inside a page
//   `*`, `::backdrop`, every element, class and attribute selector   become descendants of `.sds-unit`
//   `@font-face`, `@property`, `@keyframes` stay global; a font's `url(../assets/fonts/<folder>/<file>)` becomes `url(fonts/<file>)`,
//                                          the folder a version's stylesheet already finds the same files in
//   `@layer`, `@media`, `@supports`, `@container`   stay, and the rules inside them are scoped.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCOPE = ".sds-unit";
const GLOBAL_AT = new Set(["font-face", "property", "keyframes", "-webkit-keyframes", "import", "charset", "namespace", "page"]);

/** The statements of one level of a stylesheet: a prelude, and the text between its braces, or null where it ends with `;`. */
function statements(text) {
  const out = [];
  let depth = 0, start = 0, open = -1, quote = "", paren = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") { i++; continue; }
    if (quote) { if (c === quote) quote = ""; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === "(") paren++; else if (c === ")") paren--;
    if (depth === 0) {
      if (c === "{") { depth = 1; open = i; }
      else if (c === ";" && paren <= 0) { out.push({ prelude: text.slice(start, i).trim(), body: null }); start = i + 1; }
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) { out.push({ prelude: text.slice(start, open).trim(), body: text.slice(open + 1, i) }); start = i + 1; }
  }
  const rest = text.slice(start).trim();
  if (rest) out.push({ prelude: rest, body: null });
  return out;
}

/** A list split on its top-level commas: not those inside parentheses, brackets or strings. */
function splitTop(text) {
  const parts = [];
  let depth = 0, from = 0, quote = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") { i++; continue; }
    if (quote) { if (c === quote) quote = ""; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) { parts.push(text.slice(from, i)); from = i + 1; }
  }
  parts.push(text.slice(from));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** One selector of a rule, as the selectors under `.sds-unit` that stand for it. */
export function scopeSelector(selector) {
  const mode = /^\[data-mode=(?:"(light|dark)"|'(light|dark)'|(light|dark))\]/.exec(selector);
  if (mode) {
    const rest = selector.slice(mode[0].length);
    const m = mode[1] ?? mode[2] ?? mode[3];
    return [`${SCOPE}[data-mode=${m}]${rest}`, `${SCOPE} [data-mode=${m}]${rest}`];
  }
  const root = /^(?::root|:host|html|body)(?![\w-])/.exec(selector);
  if (root) {
    return [`${SCOPE}${selector.slice(root[0].length)}`];
  }
  return [`${SCOPE} ${selector}`];
}

/** `url(../assets/fonts/<folder>/<file>)` as the folder of a version's stylesheet holds the file: `url(fonts/<file>)`. */
const fontUrls = (body) => body.replace(/url\(\s*(["']?)(?:\.\.?\/)*assets\/fonts\/[^/)"']+\/([^/)"']+)\1\s*\)/g, "url($1fonts/$2$1)");

function scopeRules(text) {
  const out = [];
  for (const { prelude, body } of statements(text)) {
    if (prelude.startsWith("@")) {
      const name = /^@([\w-]+)/.exec(prelude)?.[1] ?? "";
      if (body === null) out.push(`${prelude};`);
      else if (GLOBAL_AT.has(name)) out.push(`${prelude}{${name === "font-face" ? fontUrls(body) : body}}`);
      else out.push(`${prelude}{${scopeRules(body)}}`);
    } else if (body !== null) {
      const selectors = [];
      for (const one of splitTop(prelude)) for (const scoped of scopeSelector(one)) if (!selectors.includes(scoped)) selectors.push(scoped);
      out.push(`${selectors.join(",")}{${body}}`);
    }
  }
  return out.join("");
}

/** The design system's whole `style.css`, with every rule scoped under `.sds-unit`. `version` goes in the file's first line. */
export function scopeUnitCss(css, version = "") {
  const kept = [];
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => { if (comment.startsWith("/*!")) kept.push(comment); return ""; });
  const head = `/* The design system's own stylesheet${version ? `, support-web-ds-ts ${version},` : ""} with every rule scoped under .sds-unit by scripts/build-unit-styles.mjs. Never edited by hand: the cut writes it again. */`;
  return `${head}\n${kept.join("\n")}${kept.length ? "\n" : ""}${scopeRules(bare)}\n`;
}

/** The design system's whole `style.css`, unscoped: the cut's comment first, then the file as it was released. */
export function wholeCss(css, version = "") {
  const head = `/* The design system's own stylesheet${version ? `, support-web-ds-ts ${version},` : ""} whole and unscoped, written by scripts/build-unit-styles.mjs. Never edited by hand: the cut writes it again. */`;
  // THE FONTS ARE FOUND BESIDE THE FILE, like the scoped one's: a surface page loads this file from the folder of its version, which holds `fonts/`, so
  // `url(../assets/fonts/<folder>/<file>)` becomes `url(fonts/<file>)`.
  const whole = fontUrls(css);
  return `${head}\n${whole.endsWith("\n") ? whole : `${whole}\n`}`;
}

/** The names of the units a surface snapshot of the design system holds, in its order; null where the snapshot holds none. */
export function unitsOf(snapshot) {
  const units = Array.isArray(snapshot?.units) ? snapshot.units.map((unit) => unit?.name).filter((name) => typeof name === "string") : [];
  return units.length ? units : null;
}

/**
 * Names the design system exports that are no unit: a host, a context, a manager. The rest of its exports under `ui/` whose name starts
 * with `DS` are the units it builds (its components, widgets, containers, layouts and the app's own).
 */
export const NOT_UNITS = new Set(["DSServerHost", "DSOverlayContainer", "DSOverlayContext", "DSReadyAttribute", "DSSurfaceContext", "DSElementObserveManager"]);

/** The units a published package's `index.d.ts` exports, in its order; null where the file is not there or holds none. */
export function unitsFromIndex(text) {
  const names = [];
  for (const [, path] of text.matchAll(/from '\.\/ui\/([^']+)'/g)) {
    const name = path.split("/").at(-1);
    if (/^DS[A-Z]/.test(name) && !NOT_UNITS.has(name) && !names.includes(name)) names.push(name);
  }
  return names.length ? names : null;
}

// ---------------------------------------------------------------------------- the command

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STYLES = join(ROOT, "packages", "plugin-spn-devex", "src", "styles");
const TARGET = join(STYLES, "design-system-units.css");
const WHOLE = join(STYLES, "design-system.css");
const UNITS = join(STYLES, "design-system-units.json");
const SNAPSHOT = join(homedir(), ".saasplane", "state", "surface", "compare", "support-web-ds-ts", "snapshot.json");

/** The version `design-system-tokens.css` was copied from, or null. */
export function pinnedVersion(styles = STYLES) {
  const file = join(styles, "design-system-tokens.css");
  return existsSync(file) ? /support-web-ds-ts v?(\d+\.\d+\.\d+)/.exec(readFileSync(file, "utf8").split("\n")[0])?.[1] ?? null : null;
}

function main(argv) {
  const at = (flag) => { const i = argv.indexOf(flag); return i < 0 ? null : argv[i + 1] ?? null; };
  const version = at("--version") ?? pinnedVersion();
  let source = at("--from");
  if (source === null) {
    if (!version) { console.error("design-system-tokens.css names no design-system version in its first line. Name a file with `--from <style.css>`."); return 2; }
    source = join(homedir(), ".saasplane", "cache", "design-system", version, "node_modules", "@saasplane", "support-web-ds-ts", "styles", "style.css");
  }
  if (!existsSync(source)) { console.error(`\`${source}\` is not there. Sign in to the registry and run the render once so the design system ${version ?? ""} is cached, or name a file with \`--from <style.css>\`.`); return 2; }
  const css = readFileSync(source, "utf8");
  const tag = version ? `v${version}` : "";
  const cut = scopeUnitCss(css, tag);
  const whole = wholeCss(css, tag);
  // The built units: from the published package the stylesheet was cut from (its `index.d.ts`, so a list and its stylesheet are one release);
  // else from the snapshot, kept as it was where the machine holds none.
  const snapshotFile = at("--units") ?? SNAPSHOT;
  let units = null;
  const indexFile = version ? join(homedir(), ".saasplane", "cache", "design-system", version, "node_modules", "@saasplane", "support-web-ds-ts", "index.d.ts") : "";
  const exported = at("--units") === null && indexFile && existsSync(indexFile) ? unitsFromIndex(readFileSync(indexFile, "utf8")) : null;
  if (exported) units = `${JSON.stringify({ designSystem: version, readFrom: version, units: exported }, null, 2)}\n`;
  else if (existsSync(snapshotFile)) {
    try {
      const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));
      const names = unitsOf(snapshot);
      if (names) units = `${JSON.stringify({ designSystem: version ?? null, readFrom: snapshot?.source?.version ?? null, units: names }, null, 2)}\n`;
    } catch { /* a snapshot that is no JSON gives no list */ }
  }
  if (argv.includes("--check")) {
    const same = (file, text) => existsSync(file) && readFileSync(file, "utf8") === text;
    const behind = [[TARGET, cut], [WHOLE, whole], ...(units ? [[UNITS, units]] : [])].filter(([file, text]) => !same(file, text)).map(([file]) => file.slice(STYLES.length + 1));
    console.log(behind.length ? `${behind.join(", ")} behind the source: run \`node scripts/build-unit-styles.mjs\`` : "design-system-units.css and design-system.css are current: a fresh cut writes the same bytes");
    return behind.length ? 1 : 0;
  }
  writeFileSync(TARGET, cut, "utf8");
  writeFileSync(WHOLE, whole, "utf8");
  console.log(`cut ${TARGET.slice(ROOT.length + 1)} — ${cut.length} bytes, from ${source}`);
  console.log(`cut ${WHOLE.slice(ROOT.length + 1)} — ${whole.length} bytes`);
  if (units) { writeFileSync(UNITS, units, "utf8"); console.log(`cut ${UNITS.slice(ROOT.length + 1)} — from ${snapshotFile}`); }
  else console.log(`${UNITS.slice(ROOT.length + 1)} not written: ${snapshotFile} holds no units. Run \`spnutils apps surface snapshot support-web-ds-ts\` first`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
