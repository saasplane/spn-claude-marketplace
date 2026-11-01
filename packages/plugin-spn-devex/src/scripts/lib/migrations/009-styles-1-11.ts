// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Open and backlog workstreams follow the standard as it moves
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 009: the approach page of each open and backlog workstream, and the preview of each of its arcs, move to
// shared styles 1.11.0, as `docs sds repoint` moves a page, so the eyebrow's Progress and the chip's arrow show. A page
// on 1.11.0 or later is left, and `closed/` is never read: a closed workstream stays as it closed.

import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { type Migration } from "../migration.ts";
import { isFile, listdir } from "../payload.ts";
import { HELD_STATES, NOTES, previewOf, workstreamsOf } from "../workstream.ts";
import { APPROACH_PAGE, DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { SERVED_FILES, STYLES_ADDRESS, integrityFor, sha384Of, stylesDir } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

/** The version the pages move to. */
export const TARGET = "1.11.0";

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const SERVED_NAMES = SERVED_FILES.map(escaped).join("|");
/** An element of a page that loads a shared file from the served address, with the version and the file it names. */
const LOADED_ELEMENT = new RegExp(
  `<(?:link|script)\\b[^>]*?\\b(?:href|src)="${escaped(STYLES_ADDRESS)}(\\d+\\.\\d+\\.\\d+)\\/(${SERVED_NAMES})"[^>]*>`, "gi");

const parts = (version: string): number[] => version.split(".").map(Number);
/** Whether `version` is older than the one the pages move to. */
const older = (version: string): boolean => {
  const a = parts(version), b = parts(TARGET);
  return (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) < 0;
};

/** The pages of every open and backlog workstream the migration reads: the approach page, and the preview of each arc. */
function pagesOf(root: string): string[] {
  return workstreamsOf(root, HELD_STATES).flatMap((ws) => [
    join(ws, APPROACH_PAGE),
    ...listdir(join(ws, NOTES)).filter((arc) => /^N\d{3}$/.test(arc)).map((arc) => previewOf(ws, arc)),
  ]).filter(isFile);
}

/** Whether a page loads a shared file from the served address at a version older than the target. */
const behind = (text: string): boolean => [...text.matchAll(LOADED_ELEMENT)].some((one) => older(one[1]));

/** An element given the new version in its address and the new version's hash in its `integrity`, whatever it carried before. */
function moved(element: string, hash: string): string {
  const addressed = element.replace(/(\/assets\/docs\/)\d+\.\d+\.\d+(\/)/, `$1${TARGET}$2`);
  return addressed.replace(/\s+integrity="[^"]*"/i, "").replace(/\s+crossorigin(?:="[^"]*")?/i, "")
    .replace(/\s*(\/?)>$/, ` integrity="${hash}" crossorigin="anonymous"$1>`);
}

/** Each page still on a version older than 1.11.0. */
export function pagesBehind(root: string): string[] {
  return pagesOf(root).filter((page) => behind(readFileSync(page, "latin1")))
    .map((page) => `${relative(join(root, DEVEX_WORKSTREAMS), page).split("\\").join("/")}: loads the shared styles older than ${TARGET}`);
}

/**
 * Moves each page that is behind to 1.11.0, with that version's hashes from the styles folder `styles` names, and
 * says which it moved. A page is read and written one byte to one character (`latin1`), so every byte the rewrite
 * does not name reaches the disk unchanged. Refuses, moving nothing, where the folder holds no hash for 1.11.0.
 */
export function moveToTarget(root: string, styles: string | null): string[] {
  const todo = pagesOf(root).filter((page) => behind(readFileSync(page, "latin1")));
  if (!todo.length) return [];
  let hashes: Record<string, string>;
  try {
    if (styles === null) throw new Error("no `styles/` folder sits above this plugin");
    hashes = integrityFor(styles, TARGET, SERVED_FILES);
  } catch (thrown) {
    return [`Version ${TARGET} of the shared styles is not here (${thrown instanceof Error ? thrown.message : String(thrown)}); update the plugin and run this again.`];
  }
  return todo.map((page) => {
    const text = readFileSync(page, "latin1");
    writeFileSync(page, text.replace(LOADED_ELEMENT, (element, version: string, name: string) =>
      (older(version) ? moved(element, hashes[name]) : element)), "latin1");
    return `${relative(join(root, DEVEX_WORKSTREAMS), page).split("\\").join("/")}: moved to the shared styles ${TARGET}`;
  });
}

export const migration009: Migration = {
  id: "009",
  version: "0.104.0",
  changed: `A workstream's approach page and its arcs' previews in backlog/ and open/ move to shared styles ${TARGET}, so the eyebrow's Progress and the chip's arrow show; closed workstreams stay as they closed.`,
  check: pagesBehind,
  script: (root) => moveToTarget(root, stylesDir(fileURLToPath(import.meta.url))),
};
