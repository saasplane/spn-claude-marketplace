// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a change is made there first, then here, in the same change.

// What every command and check needs to know about the shared page styles lives once, here: the
// address a version is served from, the names of the served files, the version a page links, and the
// versions that were cut. A command that reads a page asks `sharedStyles` first, because a page that
// links no shared stylesheet holds its own copy of the styles and the class names that copy used.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The address every version's folder sits under. A version's files are at `<address><version>/`. */
export const STYLES_ADDRESS = "https://saasplane.github.io/spn-claude-marketplace/assets/docs/";
/** The stylesheet every page links. */
export const STYLESHEET = "sds-docs.css";
/** The script every page loads. */
export const PAGE_SCRIPT = "sds-docs.js";
/** The script the index of artifacts loads. */
export const INDEX_SCRIPT = "sds-index.js";
/** The files one version serves, in the order `versions.json` lists them. */
export const SERVED_FILES: readonly string[] = Object.freeze([STYLESHEET, PAGE_SCRIPT, INDEX_SCRIPT]);
/** What the file name of a page's bundled copy ends in. A bundled copy is not a page of the tree. */
export const BUNDLED_SUFFIX = ".bundled.html";
/** The prefix of every class and token of the shared stylesheet. */
export const PREFIX = "sds-";

/** The link of a page to the shared stylesheet: everything of its `href` before the file's name. */
const STYLESHEET_LINK = /<link\b[^>]*\bhref="([^"]*)sds-docs\.css"[^>]*>/i;
/** A version as the last folder of an address: `…/1.0.0/`. */
const VERSION_FOLDER = /(?:^|\/)(\d+\.\d+\.\d+)\/$/;

/** What a page's link to the shared stylesheet says: the folder it loads from, and the version in it. */
export type SharedStyles = {
  /** Everything of the `href` before `sds-docs.css`: an address, or a relative path to a folder. */
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

/** Whether a page links the shared stylesheet. A page that does not holds its own copy of the styles. */
export function linksSharedStyles(html: string): boolean {
  return sharedStyles(html) !== null;
}

/** What a command says about a page that links no shared stylesheet, so every command says it in one way. */
export const OWN_COPY = "this page links no shared stylesheet: it holds its own copy of the styles, and the " +
  "class names that copy used. Produce it again with `docs page write`, or copy it from its template, so it links " +
  "`sds-docs.css` (05-artifacts.md, One stylesheet, served in versions)";

/** The two lines a page of one version carries: the stylesheet's, and the script's. */
export function linesFor(version: string, script: string = PAGE_SCRIPT): { stylesheet: string; script: string } {
  return {
    stylesheet: `<link rel="stylesheet" href="${STYLES_ADDRESS}${version}/${STYLESHEET}">`,
    script: `<script src="${STYLES_ADDRESS}${version}/${script}"></script>`,
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

/** The newest version that was cut, by its three numbers, or null where none was. */
export function newestVersion(versions: readonly string[]): string | null {
  const parts = (version: string): number[] => version.split(".").map(Number);
  const ordered = [...versions].sort((one, two) => {
    const a = parts(one), b = parts(two);
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  });
  return ordered.at(-1) ?? null;
}
