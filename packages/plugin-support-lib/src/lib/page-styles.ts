// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a change is made there first, then here, in the same change.

// What every command and check needs to know about the shared page styles lives once, here: the
// address a version is served from, the names of the served files, the version a page links, and the
// versions that were cut. A command that reads a page asks `sharedStyles` first, because a page that
// links no shared stylesheet holds its own copy of the styles and the class names that copy used.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The address every version's folder sits under. A version's files are at `<address><version>/`. */
export const STYLES_ADDRESS = "https://saasplane.github.io/spn-claude-marketplace/assets/docs/";
/** The first version whose served files carry the names below. Versions before it keep the names they were cut with, which never change. */
export const NEW_NAMES_FROM = "1.16.0";
/** The stylesheet every page links, from `NEW_NAMES_FROM`. */
export const STYLESHEET = "docs-language.css";
/** The script every page loads, from `NEW_NAMES_FROM`. */
export const PAGE_SCRIPT = "docs-page.js";
/** The script the index of artifacts loads, from `NEW_NAMES_FROM`. */
export const INDEX_SCRIPT = "docs-index.js";
/** The files one version serves, in the order `versions.json` lists them, from `NEW_NAMES_FROM`. */
export const SERVED_FILES: readonly string[] = Object.freeze([STYLESHEET, PAGE_SCRIPT, INDEX_SCRIPT]);
/** The scoped design-system stylesheet a page with an inline unit links, beside the shared stylesheet. Served from 1.16.0. */
export const UNIT_STYLESHEET = "design-system-units.css";
/** The design system's whole stylesheet, unscoped, for a page of its own that holds the system's markup. Served from 1.16.0. */
export const DESIGN_SYSTEM_STYLESHEET = "design-system.css";
/** The first version that serves the two design-system stylesheets beside the three shared files. */
export const UNIT_FILES_FROM = "1.16.0";
/** The two design-system stylesheets a version from `UNIT_FILES_FROM` serves, after the three shared files. */
export const UNIT_FILES: readonly string[] = Object.freeze([UNIT_STYLESHEET, DESIGN_SYSTEM_STYLESHEET]);
/** The names versions before `NEW_NAMES_FROM` were cut with, each beside the name that replaced it. They are published and never change. */
export const OLD_NAMES: Readonly<Record<string, string>> = Object.freeze({
  [STYLESHEET]: "sds-docs.css", [PAGE_SCRIPT]: "sds-docs.js", [INDEX_SCRIPT]: "sds-index.js", [UNIT_STYLESHEET]: "ds-unit.css",
});
/** Every name a served file has had, as one list: for a pattern that finds a page's link to a served file of any version. */
export const ANY_SERVED_NAMES: readonly string[] = Object.freeze([...SERVED_FILES, ...UNIT_FILES, ...Object.values(OLD_NAMES)]);
/** What the file name of a page's bundled copy ends in. A bundled copy is not a page of the tree. */
export const BUNDLED_SUFFIX = ".bundled.html";
/** The table of each cut version's integrity hash of each file it serves, beside `versions.json`. */
export const INTEGRITY_FILE = "integrity.json";
/** The prefix of every class and token of the shared stylesheet. */
export const PREFIX = "sds-";

/** The link of a page to the shared stylesheet: everything of its `href` before the file's name. */
const STYLESHEET_LINK = /<link\b[^>]*\bhref="([^"]*)(?:docs-language|sds-docs)\.css"[^>]*>/i;
/** A version as the last folder of an address: `…/1.0.0/`. */
const VERSION_FOLDER = /(?:^|\/)(\d+\.\d+\.\d+)\/$/;

/** What a page's link to the shared stylesheet says: the folder it loads from, and the version in it. */
export type SharedStyles = {
  /** Everything of the `href` before the stylesheet's name: an address, or a relative path to a folder. */
  folder: string;
  /** The version the folder names, or null where the folder names none. */
  version: string | null;
  /** Whether the folder is the served address, and not a folder beside the page. */
  served: boolean;
};

/** A page's link to the shared stylesheet, or null where the page links none. */
export function sharedStyles(html: string): SharedStyles | null {
  const folder = STYLESHEET_LINK.exec(html)?.[1];
  if (folder === undefined) return null;
  return { folder, version: VERSION_FOLDER.exec(folder)?.[1] ?? null, served: folder.startsWith(STYLES_ADDRESS) };
}

/** Whether a version is `later` than or equal to another: three numbers each. */
const atLeast = (version: string, later: string): boolean => {
  const a = version.split(".").map(Number), b = later.split(".").map(Number);
  return (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) >= 0;
};

/** A served file as one version names it: a name of `SERVED_FILES` or `UNIT_FILES`, in the old name where the version predates `NEW_NAMES_FROM`. */
export function nameIn(version: string, name: string): string {
  return atLeast(version, NEW_NAMES_FROM) ? name : OLD_NAMES[name] ?? name;
}

/** The pattern text, for a regular expression, that matches a served file's name in any version: the new name or the one it replaced. */
export function anyNameOf(name: string): string {
  const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return OLD_NAMES[name] ? `(?:${escape(name)}|${escape(OLD_NAMES[name])})` : escape(name);
}

/** Whether a page links the shared stylesheet. A page that does not holds its own copy of the styles. */
export function linksSharedStyles(html: string): boolean {
  return sharedStyles(html) !== null;
}

/** What a command says about a page that links no shared stylesheet, so every command says it in one way. */
export const OWN_COPY = "this page links no shared stylesheet: it holds its own copy of the styles, and the " +
  "class names that copy used. Produce it again with `docs page write`, or copy it from its template, so it links " +
  "`docs-language.css` (05-artifacts.md, One stylesheet, served in versions)";

/** One file's integrity hash as a browser reads it: `sha384-` and the base64 of the SHA-384 of its bytes. */
export function sha384Of(bytes: Uint8Array): string {
  return `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
}

/**
 * The two lines a page of one version carries: the stylesheet's, and the script's. Given the version's
 * hashes (`integrity`, file name to hash), each line also carries its `integrity` and `crossorigin`, so the
 * browser refuses a file that changed under a published version. The served address answers a cross-origin
 * request with `access-control-allow-origin: *`, which is why `crossorigin="anonymous"` loads it.
 */
export function linesFor(version: string, script: string = PAGE_SCRIPT, integrity?: Record<string, string>): { stylesheet: string; script: string } {
  const pinned = (file: string): string => (integrity?.[file] ? ` integrity="${integrity[file]}" crossorigin="anonymous"` : "");
  // THE NAMES ARE THE VERSION'S: a version before `NEW_NAMES_FROM` serves the old ones, so the line names the file as that version holds it.
  const sheet = nameIn(version, STYLESHEET), loaded = nameIn(version, script);
  return {
    stylesheet: `<link rel="stylesheet" href="${STYLES_ADDRESS}${version}/${sheet}"${pinned(sheet)}>`,
    script: `<script src="${STYLES_ADDRESS}${version}/${loaded}"${pinned(loaded)}></script>`,
  };
}

/**
 * The plugin's `styles/` folder, found by walking up from a file of the plugin. From source it is
 * `src/styles/`, and in an installed plugin it sits beside `dist/`. Null where no folder above holds one.
 */
export function stylesDir(from: string): string | null {
  for (let at = dirname(from), last = ""; at !== last; last = at, at = dirname(at)) {
    if (existsSync(join(at, "styles", "versions.json"))) return join(at, "styles");
  }
  return null;
}

/** Each version that was cut, with the hash of each file it serves, as `versions.json` lists them. */
export function cutVersions(styles: string): Record<string, Record<string, string>> {
  const file = join(styles, "versions.json");
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, string>>;
}

/** Each version that was cut, with the integrity hash of each file it serves, as `integrity.json` lists them. */
export function integrityTable(styles: string): Record<string, Record<string, string>> {
  const file = join(styles, INTEGRITY_FILE);
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, string>>;
}

/**
 * The hashes of the files a page of `version` loads. Throws a sentence naming the version, or the file, where the table
 * holds none, because a page written without its hash would load a file the browser cannot check.
 */
export function integrityFor(styles: string, version: string, files: readonly string[]): Record<string, string> {
  const table = integrityTable(styles);
  const entry = table[version];
  if (!entry) {
    const listed = Object.keys(table);
    throw new Error(`version ${version} has no integrity hash in \`${join(styles, INTEGRITY_FILE)}\`. `
      + `${listed.length ? `The versions that have one: ${listed.join(", ")}` : "No version has one yet"}`);
  }
  const missing = files.filter((file) => !entry[file]);
  if (missing.length) throw new Error(`version ${version} has no integrity hash for ${missing.join(", ")} in \`${join(styles, INTEGRITY_FILE)}\``);
  return entry;
}

/** The files one version serves, under the names it was cut with: three shared files, and from `UNIT_FILES_FROM` the two design-system stylesheets. */
export function servedFilesOf(version: string): readonly string[] {
  const shared = SERVED_FILES.map((name) => nameIn(version, name));
  return atLeast(version, UNIT_FILES_FROM) ? [...shared, ...UNIT_FILES.map((name) => nameIn(version, name))] : shared;
}

/** The newest version that was cut, by its three numbers, or null where none was. */
export function newestVersion(versions: readonly string[]): string | null {
  const parts = (version: string): number[] => version.split(".").map(Number);
  const ordered = [...versions].sort((one, two) => {
    const a = parts(one), b = parts(two);
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  });
  return ordered.at(-1) ?? null;
}
