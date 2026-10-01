#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// Cut a version of the shared page styles, move the pages of a folder to one, or write a copy of a
// page that carries its version's styles inside it. Every refusal exits 1 and writes nothing.
//
//   spn-devex docs sds cut <version> [--root <folder>]
//   spn-devex docs sds repoint <version> <folder…> [--check] [--root <folder>]
//   spn-devex docs sds bundle <page> [--assets <folder>]

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEVEX_WORKSTREAMS, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import {
  BUNDLED_SUFFIX, INDEX_SCRIPT, OWN_COPY, PAGE_SCRIPT, SERVED_FILES, STYLESHEET, STYLES_ADDRESS, cutVersions, sharedStyles, stylesDir,
} from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { argsText, begin, commandFacts, end, record } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { resolveWorkspace } from "./_lib.ts";

export const describe = "cut a version of the shared page styles, move pages to one, or bundle a page with its styles inside";

const USAGE = [
  "usage: spn-devex docs sds cut <version> [--root <folder>]",
  "       spn-devex docs sds repoint <version> <folder…> [--check] [--root <folder>]",
  "       spn-devex docs sds bundle <page> [--assets <folder>]",
].join("\n");

/** A version as it is typed: three numbers. */
const VERSION = /^\d+\.\d+\.\d+$/;
/** The marketplace's checkout, as a workspace names its folder. */
const MARKETPLACE = "spn-claude-marketplace";
/** Where the built styles sit, under the marketplace's checkout. */
const STYLES_SEAT = join("packages", "plugin-spn-devex", "src", "styles");
/** Where every version's folder sits, under the marketplace's checkout. */
const SERVED_SEAT = join("public", "assets", "docs");
/** The list of versions, inside the styles folder. */
const VERSIONS_FILE = "versions.json";
/** What a bundled copy's name ends in, in place of `.html`. */
/** How long one fetch of a served file may take, in milliseconds. */
const FETCH_LIMIT_MS = 15_000;

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const SERVED_NAMES = SERVED_FILES.map(escaped).join("|");

/**
 * An element of a page that loads a shared file from the served address: everything before the
 * version, the version, and everything after it up to the closing quote. A sample of the two lines
 * in a page's text is written with `&lt;`, so it is no element and it is never matched.
 */
const LOADED_ADDRESS = new RegExp(
  `(<(?:link|script)\\b[^>]*?\\b(?:href|src)="${escaped(STYLES_ADDRESS)})(\\d+\\.\\d+\\.\\d+)(\\/(?:${SERVED_NAMES})")`, "gi");

/**
 * A line of a page that loads a shared file from anywhere: the stylesheet's link, or a shared
 * script's element. The second group names the script; a match with no second group is the link.
 */
const LOADING_LINE = new RegExp(
  `<link\\b[^>]*\\bhref="[^"]*${escaped(STYLESHEET)}"[^>]*>`
  + `|<script\\b[^>]*\\bsrc="(?:[^"]*\\/)?(${escaped(PAGE_SCRIPT)}|${escaped(INDEX_SCRIPT)})"[^>]*>\\s*<\\/script>`, "gi");

/** Whether a folder a page links is an address on the network, and not a path beside the page. */
const isAddress = (folder: string): boolean => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(folder);

const isDir = (path: string): boolean => {
  try { return statSync(path).isDirectory(); } catch { return false; }
};
const isFile = (path: string): boolean => {
  try { return statSync(path).isFile(); } catch { return false; }
};

/** Say why a command is refused, and hand back the exit code of a refusal. */
function refuse(action: string, reason: string): number {
  console.error(`✗ docs sds ${action} — refused: ${reason}`);
  return 1;
}

/** What follows `docs sds` on the command line: the plain words in order, and each option. */
type Typed = { words: string[]; root: string | null; assets: string | null; check: boolean };

/** Read the words and the options, or null where an option is unknown or has no value. */
function typed(args: string[]): Typed | null {
  const read: Typed = { words: [], root: null, assets: null, check: false };
  for (let index = 0; index < args.length; index += 1) {
    const word = args[index];
    if (word === "--check") { read.check = true; continue; }
    if (word === "--root" || word === "--assets") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) return null;
      if (word === "--root") read.root = value; else read.assets = value;
      index += 1;
      continue;
    }
    if (word.startsWith("--")) return null;
    read.words.push(word);
  }
  return read;
}

// ---------------------------------------------------------------------------- the marketplace

/** Whether a folder is the marketplace's checkout: it holds `public/` and the plugin's styles. */
function isMarketplace(folder: string): boolean {
  return isDir(join(folder, "public")) && isDir(join(folder, STYLES_SEAT));
}

/**
 * The marketplace's checkout: the folder `--root` names, or the nearest folder at or above the
 * working directory that is one. Null where neither is the marketplace.
 */
function marketplaceFrom(root: string | null): string | null {
  if (root !== null) return isMarketplace(resolve(root)) ? resolve(root) : null;
  for (let at = resolve(process.cwd()), last = ""; at !== last; last = at, at = dirname(at)) {
    if (isMarketplace(at)) return at;
  }
  return null;
}

const NOT_MARKETPLACE = (root: string | null): string =>
  `\`${resolve(root ?? process.cwd())}\` is not the marketplace's checkout: it holds no \`public/\` beside `
  + `\`${slashes(STYLES_SEAT)}/\`. Run it there, or name the checkout with \`--root <folder>\``;

/** Each version in the list, or a sentence where the list cannot be read. */
function versionsIn(styles: string): Record<string, Record<string, string>> | string {
  try { return cutVersions(styles); }
  catch (error) { return `\`${join(styles, VERSIONS_FILE)}\` cannot be read: ${(error as Error).message}`; }
}

// ---------------------------------------------------------------------------- cut

/** Copy the three built files into the version's folder, and list the version with each file's hash. */
function cut(version: string, root: string | null): number {
  if (!VERSION.test(version)) return refuse("cut", `\`${version}\` is not a version. A version is three numbers, such as \`1.1.0\``);
  const home = marketplaceFrom(root);
  if (home === null) return refuse("cut", NOT_MARKETPLACE(root));
  const styles = join(home, STYLES_SEAT);
  const folder = join(home, SERVED_SEAT, version);
  const versions = versionsIn(styles);
  if (typeof versions === "string") return refuse("cut", versions);
  if (existsSync(folder)) {
    return refuse("cut", `version ${version} exists at \`${folder}\`. A version never changes once it is cut, so cut the next one`);
  }
  if (version in versions) {
    return refuse("cut", `\`${join(styles, VERSIONS_FILE)}\` lists version ${version}, whose folder is \`${folder}\`. `
      + "A version never changes once it is cut, so cut the next one");
  }
  const missing = SERVED_FILES.filter((name) => !isFile(join(styles, name)));
  if (missing.length) return refuse("cut", `\`${styles}\` holds no ${missing.map((name) => `\`${name}\``).join(", ")}. Build the styles first`);

  const hashes: Record<string, string> = {};
  const built = SERVED_FILES.map((name) => ({ name, bytes: readFileSync(join(styles, name)) }));
  mkdirSync(folder, { recursive: true });
  for (const { name, bytes } of built) {
    writeFileSync(join(folder, name), bytes);
    hashes[name] = createHash("sha256").update(bytes).digest("hex");
  }
  writeFileSync(join(styles, VERSIONS_FILE), `${JSON.stringify({ ...versions, [version]: hashes }, null, 2)}\n`, "utf8");

  console.log(`✓ cut version ${version} → ${folder}`);
  for (const name of SERVED_FILES) console.log(`    ${name.padEnd(14)} sha256 ${hashes[name]}`);
  return 0;
}

// ---------------------------------------------------------------------------- repoint

const CLOSED_WORKSTREAMS = new RegExp(`(?:^|\\/)${escaped(DEVEX_WORKSTREAMS)}\\/closed(?:\\/|$)`);

/** Whether a path is a workstream's `closed/` folder, or sits inside it. Such a page is never moved. */
function inClosedWorkstream(path: string): boolean {
  return CLOSED_WORKSTREAMS.test(slashes(resolve(path)));
}

/**
 * Every `.html` file under a folder, in the order of its names. `node_modules`, a folder whose name
 * starts with a dot and a workstream's `closed/` folder are not entered. The folder the command
 * names is entered whatever its own name is.
 */
function pagesUnder(folder: string): string[] {
  if (inClosedWorkstream(folder)) return [];
  const pages: string[] = [];
  const entries = readdirSync(folder, { withFileTypes: true }).sort((one, two) => one.name.localeCompare(two.name));
  for (const entry of entries) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) pages.push(...pagesUnder(path));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      pages.push(path);
    }
  }
  return pages;
}

/** A count of pages in words: `1 page`, `3 pages`. */
const pagesText = (count: number): string => `${count} page${count === 1 ? "" : "s"}`;

/**
 * Rewrite the version in each address a page loads a shared file from, for every page under the
 * folders that links the served address.
 *
 * A PAGE IS READ AND WRITTEN ONE BYTE TO ONE CHARACTER (`latin1`), so every byte the rewrite does
 * not name reaches the disk unchanged, whatever encoding the page is in.
 */
function repoint(version: string, folders: string[], check: boolean, root: string | null): number {
  const home = root === null ? null : marketplaceFrom(root);
  if (root !== null && home === null) return refuse("repoint", NOT_MARKETPLACE(root));
  const styles = home === null ? stylesDir(fileURLToPath(import.meta.url)) : join(home, STYLES_SEAT);
  if (styles === null) return refuse("repoint", `no \`styles/${VERSIONS_FILE}\` sits above this command, so the list of versions cannot be read`);
  const versions = versionsIn(styles);
  if (typeof versions === "string") return refuse("repoint", versions);
  if (!(version in versions)) {
    const listed = Object.keys(versions);
    return refuse("repoint", `nobody cut version \`${version}\`. `
      + `${listed.length ? `The versions that exist: ${listed.join(", ")}` : "No version exists yet"}. `
      + `Cut it first with \`docs sds cut ${version}\`, or move the pages to a version that exists`);
  }
  const unreadable = folders.filter((folder) => !isDir(folder) && !(isFile(folder) && folder.endsWith(".html")));
  if (unreadable.length) {
    return refuse("repoint", `${unreadable.map((folder) => `\`${folder}\``).join(", ")} is not a folder and not a page`);
  }

  const pages = folders.flatMap((folder) => (isDir(folder) ? pagesUnder(folder) : inClosedWorkstream(folder) ? [] : [folder]));
  let moved = 0, already = 0, elsewhere = 0;
  for (const page of pages) {
    const text = readFileSync(page, "latin1");
    if (sharedStyles(text)?.served !== true) { elsewhere += 1; continue; }
    const repointed = text.replace(LOADED_ADDRESS, (_whole, before: string, _from: string, after: string) => `${before}${version}${after}`);
    if (repointed === text) { already += 1; continue; }
    if (!check) writeFileSync(page, repointed, "latin1");
    moved += 1;
    console.log(`${check ? "would move" : "moved"}  ${page}`);
  }
  console.log(`${pagesText(moved)} ${check ? "would move" : "moved"} to ${version} · ${already} already there · `
    + `${elsewhere} that link no served address left as they are`);
  return 0;
}

// ---------------------------------------------------------------------------- bundle

/** Where one version's files are read from, and how that place is named in a message. */
type Source = { named: string; read: (name: string) => Promise<string | null> };

/** A folder on disk that holds the shared files. */
function folderSource(folder: string): Source {
  return {
    named: `\`${folder}\``,
    read: async (name) => (isFile(join(folder, name)) ? readFileSync(join(folder, name), "utf8") : null),
  };
}

/** One version's folder at the served address, read over the network. */
function addressSource(version: string): Source {
  const address = `${STYLES_ADDRESS}${version}/`;
  return {
    named: address,
    read: async (name) => {
      try {
        const response = await fetch(`${address}${name}`, { signal: AbortSignal.timeout(FETCH_LIMIT_MS) });
        return response.ok ? await response.text() : null;
      } catch { return null; }
    },
  };
}

/**
 * Where a page's shared files are read from, or a sentence where they cannot be. `--assets` comes
 * first. A page that links a folder beside it reads that folder. A page that links the served address
 * reads its version from the marketplace's checkout in the workspace, and from the address where the
 * workspace holds no such folder.
 */
function sourceFor(page: string, html: string, assets: string | null): Source | string {
  const link = sharedStyles(html);
  if (link === null) return OWN_COPY;
  if (assets !== null) return folderSource(resolve(assets));
  if (!link.served) {
    if (isAddress(link.folder)) {
      return `the page links its stylesheet from \`${link.folder}\`, which is not the served address. Name the folder that holds its files with \`--assets <folder>\``;
    }
    return folderSource(resolve(dirname(page), link.folder));
  }
  if (link.version === null) {
    return `the page links \`${link.folder}\`, which names no version. Name the folder that holds its files with \`--assets <folder>\``;
  }
  const checkout = join(resolveWorkspace(), MARKETPLACE, SERVED_SEAT, link.version);
  return isDir(checkout) ? folderSource(checkout) : addressSource(link.version);
}

/** The element that holds a shared file's text inside a page. A closing tag inside the text is written so it closes nothing. */
function inside(name: string, text: string): string {
  const body = text.endsWith("\n") ? text : `${text}\n`;
  if (name === STYLESHEET) return `<style>\n${body.replace(/<\/style/gi, "<\\/style")}</style>`;
  return `<script>\n${body.replace(/<\/script/gi, "<\\/script")}</script>`;
}

/**
 * Write `<name>.bundled.html` beside `<name>.html`: the page, with each line that loads a shared
 * file replaced by an element that holds the file. Every other byte of the page stays as it is, its
 * own style block included.
 */
async function bundle(page: string, assets: string | null): Promise<number> {
  if (!isFile(page)) return refuse("bundle", `\`${page}\` is not a file`);
  if (page.endsWith(BUNDLED_SUFFIX)) return refuse("bundle", `\`${page}\` is a bundled copy. Bundle the page that links the stylesheet`);
  if (!page.endsWith(".html")) return refuse("bundle", `\`${page}\` is not an \`.html\` page`);
  const html = readFileSync(page, "utf8");
  const source = sourceFor(page, html, assets);
  if (typeof source === "string") return refuse("bundle", `\`${page}\`: ${source}`);

  const needed = new Set<string>();
  for (const line of html.matchAll(LOADING_LINE)) needed.add(line[1] ?? STYLESHEET);
  const held = new Map<string, string>();
  for (const name of needed) {
    const text = await source.read(name);
    if (text === null) {
      const version = sharedStyles(html)?.version;
      return refuse("bundle", `\`${page}\`: ${version ? `version ${version}` : "the version it links"} cannot be read. `
        + `\`${name}\` is not at ${source.named}. Name a folder that holds it with \`--assets <folder>\``);
    }
    held.set(name, text);
  }

  const bundled = html.replace(LOADING_LINE, (_line, script: string | undefined) => {
    const name = script ?? STYLESHEET;
    return inside(name, held.get(name) ?? "");
  });
  const target = `${page.slice(0, -".html".length)}${BUNDLED_SUFFIX}`;
  writeFileSync(target, bundled, "utf8");
  console.log(`✓ bundled ${[...needed].join(" · ")} from ${source.named} → ${target}`);
  return 0;
}

// ---------------------------------------------------------------------------- the command

async function body(args: string[]): Promise<number> {
  const read = typed(args);
  const [action, ...rest] = read?.words ?? [];
  if (read === null || action === undefined) { console.error(USAGE); return 2; }
  if (action === "cut" && rest.length === 1) return cut(rest[0], read.root);
  if (action === "repoint" && rest.length >= 2) return repoint(rest[0], rest.slice(1), read.check, read.root);
  if (action === "bundle" && rest.length === 1) return bundle(rest[0], read.assets);
  console.error(USAGE);
  return 2;
}

/** Run `docs sds` with the words that follow it, and resolve to its exit code. */
export async function run(args: string[]): Promise<number> {
  const startedAt = performance.now();
  begin(commandFacts("spn-devex", args), resolveWorkspace());
  const code = await body(args);
  record({ group: "docs", action: "sds", args: argsText(args) }, performance.now() - startedAt, code);
  end(code);
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "sds.ts")
  process.exit(await run(process.argv.slice(2)));
