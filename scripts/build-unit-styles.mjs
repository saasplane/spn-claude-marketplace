#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The blocks · § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// The cut of `ds-unit.css`: the design system's own `style.css`, every rule of it scoped under `.sds-unit`, so a unit's markup
// can stand in a docs page (the UNIT block) and the docs page's own styles are not touched by the design system's.
//
//     node scripts/build-unit-styles.mjs                          cut it from the design-system version `ds-tokens.css` was copied from
//     node scripts/build-unit-styles.mjs --from <style.css> [--version <v>]   cut it from this file
//     node scripts/build-unit-styles.mjs --check                  exit 1 where the file in the styles folder is not what a cut writes
//
// WHERE THE SOURCE IS READ. `ds-tokens.css` says in its first line which version of `support-web-ds-ts` it was copied from.
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

// ---------------------------------------------------------------------------- the command

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STYLES = join(ROOT, "packages", "plugin-spn-devex", "src", "styles");
const TARGET = join(STYLES, "ds-unit.css");

/** The version `ds-tokens.css` was copied from, or null. */
export function pinnedVersion(styles = STYLES) {
  const file = join(styles, "ds-tokens.css");
  return existsSync(file) ? /support-web-ds-ts v?(\d+\.\d+\.\d+)/.exec(readFileSync(file, "utf8").split("\n")[0])?.[1] ?? null : null;
}

function main(argv) {
  const at = (flag) => { const i = argv.indexOf(flag); return i < 0 ? null : argv[i + 1] ?? null; };
  const version = at("--version") ?? pinnedVersion();
  let source = at("--from");
  if (source === null) {
    if (!version) { console.error("ds-tokens.css names no design-system version in its first line. Name a file with `--from <style.css>`."); return 2; }
    source = join(homedir(), ".saasplane", "cache", "design-system", version, "node_modules", "@saasplane", "support-web-ds-ts", "styles", "style.css");
  }
  if (!existsSync(source)) { console.error(`\`${source}\` is not there. Sign in to the registry and run the render once so the design system ${version ?? ""} is cached, or name a file with \`--from <style.css>\`.`); return 2; }
  const cut = scopeUnitCss(readFileSync(source, "utf8"), version ? `v${version}` : "");
  if (argv.includes("--check")) {
    const same = existsSync(TARGET) && readFileSync(TARGET, "utf8") === cut;
    console.log(same ? "ds-unit.css is current: a fresh cut writes the same bytes" : "ds-unit.css is behind its source: run `node scripts/build-unit-styles.mjs`");
    return same ? 0 : 1;
  }
  writeFileSync(TARGET, cut, "utf8");
  console.log(`cut ${TARGET.slice(ROOT.length + 1)} — ${cut.length} bytes, from ${source}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
