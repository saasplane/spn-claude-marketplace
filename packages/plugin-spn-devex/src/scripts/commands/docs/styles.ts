// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// The shared page styles, served in versions: cut a version, move the pages of a folder to one, or
// write a copy of a page that carries its version's styles inside it. Every refusal exits 1 and
// writes nothing.
//
//   spn-devex docs styles cut <version> [--replace] [--root <folder>] [--ds <folder>] [--ds-version <tag>]   cut a version, with the design system's tokens copied first where --ds names its checkout; --replace recuts one that is not published
//   spn-devex docs styles preview <folder> [--root <folder>]               the quick loop: build, and copy the built files into <folder>/_assets/docs/<next version>/, no hashes
//   spn-devex docs styles check <version> <folder…> [--root <folder>]      list the pages a move would change
//   spn-devex docs styles repoint <version> <folder…> [--root <folder>]    move the pages
//   spn-devex docs styles bundle <page> [--assets <folder>]                write the bundled copy
//
// A SUBJECT WITH FIVE ACTIONS, AND A `file` PATH. `check` is the look before `repoint` and writes
// nothing. The version is a word of its own before the paths, so it is never read as a path.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEVEX_WORKSTREAMS, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import {
  ANY_SERVED_NAMES, BUNDLED_SUFFIX, INTEGRITY_FILE, OLD_NAMES, OWN_COPY, STYLESHEET, STYLES_ADDRESS, anyNameOf, cutVersions, integrityTable,
  nameIn, newestVersion, servedFilesOf, sha384Of, sharedStyles, stylesDir,
} from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { type Action, FLAG, REQUIRED, UsageFault, VALUE, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { resolveWorkspace } from "./_lib.ts";

export const describe = "the shared page styles, served in versions: cut one, move pages to one, or bundle a page with its styles inside";

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
const SERVED_NAMES = ANY_SERVED_NAMES.map(escaped).join("|");

/** A name a served file had before `NEW_NAMES_FROM`, with the name that replaced it. */
const CURRENT_NAME: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(OLD_NAMES).map(([current, old]) => [old, current]));

/** A whole element of a page that loads a shared file from the served address, with the version and the file it names. */
const LOADED_ELEMENT = new RegExp(
  `<(?:link|script)\\b[^>]*?\\b(?:href|src)="${escaped(STYLES_ADDRESS)}(\\d+\\.\\d+\\.\\d+)\\/(${SERVED_NAMES})"[^>]*>`, "gi");

/** An element with its `integrity` and `crossorigin` set to `hash`, whatever it carried before. */
function pinnedTo(element: string, hash: string): string {
  return element.replace(/\s+integrity="[^"]*"/i, "").replace(/\s+crossorigin(?:="[^"]*")?/i, "")
    .replace(/\s*(\/?)>$/, ` integrity="${hash}" crossorigin="anonymous"$1>`);
}

/**
 * A line of a page that loads a shared file from anywhere: the stylesheet's link, or a shared
 * script's element. The second group names the script; a match with no second group is the link.
 */
const LOADING_LINE = new RegExp(
  `<link\\b[^>]*\\bhref="[^"]*(${anyNameOf(STYLESHEET)})"[^>]*>`
  + `|<script\\b[^>]*\\bsrc="(?:[^"]*\\/)?(${anyNameOf("docs-page.js")}|${anyNameOf("docs-index.js")})"[^>]*>\\s*<\\/script>`, "gi");

/** Whether a served file's name is the shared stylesheet's, in any version. */
const isStylesheet = (name: string): boolean => (CURRENT_NAME[name] ?? name) === STYLESHEET;

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
  console.error(`✗ docs styles ${action} — refused: ${reason}`);
  return 1;
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

/** The folder of font files beside the built stylesheet, in the styles folder and in every version's folder. */
const FONTS_FOLDER = "fonts";

/** Copy the font files, one level, from the styles folder into the version's folder; nothing where there are none. */
function copyFonts(from: string, to: string): void {
  if (!isDir(from)) return;
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (isFile(join(from, name))) writeFileSync(join(to, name), readFileSync(join(from, name)));
  }
}

/** Where the design system's own variables sit, under a checkout of the support repository. */
const DS_VARIABLES = join("packages", "support-web-ds-ts", "src", "assets", "styles", "_variables.css");
/** The file in the styles folder that holds those variables, which the stylesheet's source imports first. */
const TOKENS_FILE = "design-system-tokens.css";

/** The newest released version of the design system, as a tag of the support checkout: `v11.13.1`. Null where there is none. */
function newestTag(ds: string): string | null {
  try {
    const tags = execFileSync("git", ["-C", ds, "tag", "--list", "v[0-9]*", "--sort=-v:refname"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return tags.split("\n").find((tag) => /^v\d+\.\d+\.\d+$/.test(tag)) ?? null;
  } catch { return null; }
}

/**
 * THE TOKENS ARE TAKEN, NEVER WRITTEN: the design system's own variables, read from the pinned version's commit, so the
 * file holds the values that version released. Returns the file's text, or a sentence where it cannot be read.
 */
export function tokensFrom(ds: string, tag: string | null): { text: string; tag: string } | string {
  const pinned = tag ?? newestTag(ds);
  if (pinned === null) return `\`${ds}\` holds no released version of the design system (a tag such as \`v11.13.1\`). Name one with \`--ds-version <tag>\``;
  let variables = "";
  try {
    variables = execFileSync("git", ["-C", ds, "show", `${pinned}:${slashes(DS_VARIABLES)}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });
  } catch { return `version \`${pinned}\` of the design system holds no \`${slashes(DS_VARIABLES)}\` in \`${ds}\``; }
  return { tag: pinned, text: `/* The design system's own variables, copied whole by \`spn-devex docs styles cut\` from support-web-ds-ts ${pinned}. Never edited by hand: cut copies them again. */\n${variables}` };
}

/** Copy the design system's tokens into the styles folder, and build the stylesheet from them. Null where it went, a sentence where it did not. */
function refreshTokens(home: string, styles: string, ds: string, tag: string | null): string | null {
  if (!isDir(ds)) return `\`${ds}\` is not a folder. \`--ds\` names the support repository's checkout`;
  const tokens = tokensFrom(ds, tag);
  if (typeof tokens === "string") return tokens;
  writeFileSync(join(styles, TOKENS_FILE), tokens.text, "utf8");
  try { execFileSync(process.execPath, [join(home, "scripts", "build-styles.mjs")], { stdio: ["ignore", "pipe", "pipe"], cwd: home }); }
  catch (error) { return `the build of the styles failed after the tokens were copied: ${String((error as { stderr?: unknown }).stderr ?? error).trim()}`; }
  console.log(`✓ copied the design system's tokens from ${tokens.tag} → ${join(styles, TOKENS_FILE)}`);
  return null;
}

/** The branch the pages workflow serves `public/` from, as a remote-tracking ref, and the local branch it falls back to. */
const PUBLISHED_REFS: readonly string[] = ["origin/develop", "develop"];

/**
 * THE VERSIONS THAT ARE PUBLISHED: the ones `versions.json` lists on the branch the pages workflow deploys (`develop`, the
 * branch a plugin is installed from; `.github/workflows/pages.yml`). The release reads the remote's tags, but a version's
 * folder is served from `develop`, so a version listed there is one a page may already link. The remote-tracking
 * `origin/develop` is read first, then the local `develop`. Null where neither can be read.
 */
export function publishedVersions(home: string): Set<string> | null {
  for (const ref of PUBLISHED_REFS) {
    try {
      const text = execFileSync("git", ["-C", home, "show", `${ref}:${slashes(join(STYLES_SEAT, VERSIONS_FILE))}`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 16 * 1024 * 1024 });
      return new Set(Object.keys(JSON.parse(text) as Record<string, unknown>));
    } catch { /* try the next ref */ }
  }
  return null;
}

const CANNOT_TELL = (): string => `which versions are published cannot be read: neither \`${PUBLISHED_REFS.join("`, nor `")}\` holds \`${slashes(join(STYLES_SEAT, VERSIONS_FILE))}\``;
const PUBLISHED = (version: string): string => `${version} is published; a published version never changes. Cut a new one.`;

/** Build the stylesheet from its source, so nothing served or previewed carries a stale built file. Null where it built, a sentence where it did not. */
function buildStyles(home: string): string | null {
  const script = join(home, "scripts", "build-styles.mjs");
  if (!isFile(script)) return null;
  try { execFileSync(process.execPath, [script], { stdio: ["ignore", "pipe", "pipe"], cwd: home }); return null; }
  catch (error) { return `the build of the styles failed: ${String((error as { stderr?: unknown }).stderr ?? error).trim()}`; }
}

/** Copy the three built files, and the fonts beside them, into the version's folder, and list the version with each file's hash. */
function cut(version: string, root: string | null, ds: string | null = null, dsVersion: string | null = null, replace = false): number {
  if (!VERSION.test(version)) return refuse("cut", `\`${version}\` is not a version. A version is three numbers, such as \`1.1.0\``);
  const home = marketplaceFrom(root);
  if (home === null) return refuse("cut", NOT_MARKETPLACE(root));
  const styles = join(home, STYLES_SEAT);
  const folder = join(home, SERVED_SEAT, version);
  const earlier = versionsIn(styles);
  if (typeof earlier === "string") return refuse("cut", earlier);
  const exists = existsSync(folder) || version in earlier;
  if (exists) {
    const published = publishedVersions(home);
    if (published?.has(version)) return refuse("cut", PUBLISHED(version));
    if (!replace) {
      const where = existsSync(folder) ? `exists at \`${folder}\`` : `is listed in \`${join(styles, VERSIONS_FILE)}\`, whose folder is \`${folder}\``;
      return refuse("cut", `version ${version} ${where}. A version never changes once it is published, so cut the next one`
        + (published === null ? `. \`--replace\` recuts a version that is not published, and it needs to read which are: ${CANNOT_TELL()}`
          : ". Or, since it is not published, `--replace` recuts it in place"));
    }
    if (published === null) return refuse("cut", `\`--replace\` recuts only a version that is not published: ${CANNOT_TELL()}`);
  } else if (replace) {
    console.log(`note: version ${version} does not exist yet, so \`--replace\` changes nothing about this cut`);
  }
  if (ds !== null) {
    const failed = refreshTokens(home, styles, resolve(ds), dsVersion);
    if (failed !== null) return refuse("cut", failed);
  } else if (dsVersion !== null) return refuse("cut", "`--ds-version` names a version of the design system, and it is read from the checkout `--ds` names");
  else {
    const failed = buildStyles(home);
    if (failed !== null) return refuse("cut", failed);
  }
  const versions = versionsIn(styles);
  if (typeof versions === "string") return refuse("cut", versions);
  // From 1.16.0 a version also serves the design system's two stylesheets, cut by `scripts/build-unit-styles.mjs`.
  const served = servedFilesOf(version);
  const missing = served.filter((name) => !isFile(join(styles, name)));
  if (missing.length) return refuse("cut", `\`${styles}\` holds no ${missing.map((name) => `\`${name}\``).join(", ")}. Build the styles first`);

  const hashes: Record<string, string> = {};
  const pinned: Record<string, string> = {};
  const built = served.map((name) => ({ name, bytes: readFileSync(join(styles, name)) }));
  mkdirSync(folder, { recursive: true });
  // A RECUT LEAVES NO FILE OF THE OLD CUT BEHIND: a file of the folder the version no longer serves is removed, one file at a time.
  if (replace) {
    for (const name of readdirSync(folder)) if (!served.includes(name) && isFile(join(folder, name))) unlinkSync(join(folder, name));
  }
  for (const { name, bytes } of built) {
    writeFileSync(join(folder, name), bytes);
    hashes[name] = createHash("sha256").update(bytes).digest("hex");
    pinned[name] = sha384Of(bytes);
  }
  // THE FONTS SIT BESIDE THE STYLESHEET: its @font-face urls are relative to it, so the version's folder holds `fonts/` too.
  copyFonts(join(styles, FONTS_FOLDER), join(folder, FONTS_FOLDER));
  writeFileSync(join(styles, VERSIONS_FILE), `${JSON.stringify({ ...versions, [version]: hashes }, null, 2)}\n`, "utf8");
  // THE INTEGRITY HASH IS RECORDED WITH THE VERSION: a page links it beside the address. It changes only with `--replace`, on a version nobody has published.
  writeFileSync(join(styles, INTEGRITY_FILE), `${JSON.stringify({ ...integrityTable(styles), [version]: pinned }, null, 2)}\n`, "utf8");

  console.log(`✓ ${exists ? "recut" : "cut"} version ${version} → ${folder}`);
  for (const name of served) console.log(`    ${name.padEnd(18)} sha256 ${hashes[name]} · ${pinned[name]}`);
  return 0;
}

// ---------------------------------------------------------------------------- preview

/** The folders a preview may write into: a workstream's folder, or a repository's artifacts pocket. */
const PREVIEW_PLACE = new RegExp(`(?:^|\\/)(?:${escaped(DEVEX_WORKSTREAMS)}|docs\\/artifacts)(?:\\/|$)`);

/** The version the next cut will be: the newest listed version where it is not published, else the next minor after it. */
function nextVersion(versions: readonly string[], published: Set<string>): string {
  const newest = newestVersion(versions);
  if (newest === null) return "1.0.0";
  if (!published.has(newest)) return newest;
  const [major, minor] = newest.split(".").map(Number);
  return `${major}.${minor + 1}.0`;
}

/**
 * THE QUICK LOOP: build the stylesheet and copy the built shared files, and the fonts, into a samples folder under the name of
 * the version the next cut will have. It lists no version and records no hash, so the pages of the folder link it with none.
 * The one cut, with `--replace`, comes at the end.
 */
function preview(folder: string, root: string | null): number {
  const target = resolve(folder);
  if (!PREVIEW_PLACE.test(slashes(target))) {
    return refuse("preview", `\`${target}\` is not under a workstream's folder (\`${slashes(DEVEX_WORKSTREAMS)}/\`) or a repository's \`docs/artifacts/\`, so nothing is written there`);
  }
  if (!isDir(target)) return refuse("preview", `\`${target}\` is not a folder`);
  const home = marketplaceFrom(root);
  if (home === null) return refuse("preview", NOT_MARKETPLACE(root));
  const styles = join(home, STYLES_SEAT);
  const versions = versionsIn(styles);
  if (typeof versions === "string") return refuse("preview", versions);
  const published = publishedVersions(home);
  if (published === null) return refuse("preview", CANNOT_TELL());
  const failed = buildStyles(home);
  if (failed !== null) return refuse("preview", failed);
  const version = nextVersion(Object.keys(versions), published);
  const served = servedFilesOf(version);
  const missing = served.filter((name) => !isFile(join(styles, name)));
  if (missing.length) return refuse("preview", `\`${styles}\` holds no ${missing.map((name) => `\`${name}\``).join(", ")}. Build the styles first`);
  const into = join(target, "_assets", "docs", version);
  mkdirSync(into, { recursive: true });
  for (const name of served) writeFileSync(join(into, name), readFileSync(join(styles, name)));
  copyFonts(join(styles, FONTS_FOLDER), join(into, FONTS_FOLDER));
  console.log(`✓ previewed ${served.length} files → ${into}  (version ${version}, nothing listed, no hashes)`);
  for (const name of served) console.log(`    ${name}`);
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
  const action = check ? "check" : "repoint";
  const home = root === null ? null : marketplaceFrom(root);
  if (root !== null && home === null) return refuse(action, NOT_MARKETPLACE(root));
  const styles = home === null ? stylesDir(fileURLToPath(import.meta.url)) : join(home, STYLES_SEAT);
  if (styles === null) return refuse(action, `no \`styles/${VERSIONS_FILE}\` sits above this command, so the list of versions cannot be read`);
  const versions = versionsIn(styles);
  if (typeof versions === "string") return refuse(action, versions);
  if (!(version in versions)) {
    const listed = Object.keys(versions);
    return refuse(action, `nobody cut version \`${version}\`. `
      + `${listed.length ? `The versions that exist: ${listed.join(", ")}` : "No version exists yet"}. `
      + `Cut it first with \`docs styles cut ${version}\`, or move the pages to a version that exists`);
  }
  const hashes = integrityTable(styles)[version];
  if (!hashes) {
    return refuse(action, `version \`${version}\` has no integrity hash in \`${join(styles, INTEGRITY_FILE)}\`, so a page moved to it would load files the browser cannot check. `
      + `Cut it with \`docs styles cut ${version}\`, which records it`);
  }
  const unreadable = folders.filter((folder) => !isDir(folder) && !(isFile(folder) && folder.endsWith(".html")));
  if (unreadable.length) {
    return refuse(action, `${unreadable.map((folder) => `\`${folder}\``).join(", ")} is not a folder and not a page`);
  }

  const pages = folders.flatMap((folder) => (isDir(folder) ? pagesUnder(folder) : inClosedWorkstream(folder) ? [] : [folder]));
  let moved = 0, already = 0, elsewhere = 0;
  for (const page of pages) {
    const text = readFileSync(page, "latin1");
    if (sharedStyles(text)?.served !== true) { elsewhere += 1; continue; }
    // THE VERSION AND ITS HASH MOVE TOGETHER: an element that carries a hash is given the new version's, so the
    // browser never checks a file against the hash of another.
    // A VERSION FROM 1.16.0 NAMES ITS FILES ANEW, so the name moves with the version: `sds-docs.css` of an old version becomes
    // `docs-language.css`, and the other way where a page is moved back to an old version. The hash is read under the new name.
    const repointed = text.replace(LOADED_ELEMENT, (element: string, _from: string, name: string) => {
      const named = nameIn(version, CURRENT_NAME[name] ?? name);
      const moved = element.replace(new RegExp(`(${escaped(STYLES_ADDRESS)})\\d+\\.\\d+\\.\\d+\\/${escaped(name)}"`, "i"), (_whole, before: string) => `${before}${version}/${named}"`);
      return /\bintegrity=/i.test(moved) ? pinnedTo(moved, hashes[named]) : moved;
    });
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
  if (isStylesheet(name)) return `<style>\n${body.replace(/<\/style/gi, "<\\/style")}</style>`;
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
  for (const line of html.matchAll(LOADING_LINE)) needed.add(line[1] ?? line[2]);
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

  const bundled = html.replace(LOADING_LINE, (_line, sheet: string | undefined, script: string | undefined) => {
    const name = sheet ?? script ?? "";
    return inside(name, held.get(name) ?? "");
  });
  const target = `${page.slice(0, -".html".length)}${BUNDLED_SUFFIX}`;
  writeFileSync(target, bundled, "utf8");
  console.log(`✓ bundled ${[...needed].join(" · ")} from ${source.named} → ${target}`);
  return 0;
}


// ---------------------------------------------------------------------------- the actions

/** The version typed before the paths, and the words after it. Throws where no version was typed. */
function versionFirst(words: string[]): { version: string; rest: string[] } {
  const [version, ...rest] = words;
  if (version === undefined) throw new UsageFault("needs a version.");
  return { version, rest };
}

function cutAction(args: string[]): number {
  const words = readWords(args, { root: VALUE, ds: VALUE, "ds-version": VALUE, replace: FLAG });
  const { version, rest } = versionFirst(words.paths);
  if (rest.length) throw new UsageFault("takes one version.");
  return cut(version, words.value("root"), words.value("ds"), words.value("ds-version"), words.given("replace"));
}

function previewAction(args: string[]): number {
  const words = readWords(args, { root: VALUE });
  return preview(onePath(scopeOf(words.paths, REQUIRED)), words.value("root"));
}

/** `check` and `repoint` are one reading of the pages; `repoint` is the one that writes them. */
function move(args: string[], check: boolean): number {
  const words = readWords(args, { root: VALUE });
  const { version, rest } = versionFirst(words.paths);
  return repoint(version, scopeOf(rest, REQUIRED), check, words.value("root"));
}

function bundleAction(args: string[]): Promise<number> {
  const words = readWords(args, { assets: VALUE });
  return bundle(onePath(scopeOf(words.paths, REQUIRED)), words.value("assets"));
}

export const actions: Record<string, Action> = {
  cut: {
    describe: "copy the built styles into a version's folder, and list the version; --replace recuts a version that is not published; with --ds, copy the design system's tokens first and build",
    usage: "<version> [--replace] [--root <folder>] [--ds <folder>] [--ds-version <tag>]",
    run: cutAction,
  },
  preview: {
    describe: "the quick loop: build the styles and copy the built files into <folder>/_assets/docs/<next version>/, with no hash and no version listed",
    usage: "<folder> [--root <folder>]",
    run: previewAction,
  },
  check: {
    describe: "list the pages a move to the version would change, and write nothing",
    usage: "<version> <folder…> [--root <folder>]",
    run: (args) => move(args, true),
  },
  repoint: {
    describe: "move every page under the folders to the version",
    usage: "<version> <folder…> [--root <folder>]",
    run: (args) => move(args, false),
  },
  bundle: {
    describe: "write a copy of a page that carries its version's styles inside it",
    usage: "<page> [--assets <folder>]",
    run: bundleAction,
  },
};
