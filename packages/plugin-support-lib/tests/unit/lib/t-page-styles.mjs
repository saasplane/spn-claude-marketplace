// The shared page styles (`05-artifacts.md` § One stylesheet, served in versions): what a page's link
// says, and which versions were cut. Every command that reads a page asks this module first.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = resolve(import.meta.dirname, "..", "..", "..");
const { OWN_COPY, STYLES_ADDRESS, SERVED_FILES, sharedStyles, linksSharedStyles, linesFor, stylesDir, cutVersions, newestVersion } =
  await import(pathToFileURL(resolve(HERE, "src", "lib", "page-styles.ts")).href);

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

console.log("=== page styles — what a page's link says");
const lines = linesFor("1.0.0");
const served = sharedStyles(`<meta charset="utf-8">\n${lines.stylesheet}\n<div class="sds-page"></div>\n${lines.script}`);
ok("a page of version 1.0.0 links the served address and names its version",
  served?.version === "1.0.0" && served.served === true && served.folder === `${STYLES_ADDRESS}1.0.0/`, JSON.stringify(served));
const beside = sharedStyles('<link rel="stylesheet" href="../assets/sds-docs.css">');
ok("a page that links a folder beside it names no version and is not served",
  beside?.version === null && beside.served === false && beside.folder === "../assets/", JSON.stringify(beside));
ok("a page with its own style block and no link links no shared stylesheet",
  sharedStyles("<style>.badge{color:red}</style><div class=\"page\"></div>") === null
    && linksSharedStyles("<style>.badge{color:red}</style>") === false);
ok("a page that links the shared stylesheet and adds a style of its own still links it",
  linksSharedStyles(`${lines.stylesheet}\n<style>.mine{color:red}</style>`) === true);
ok("another stylesheet is not the shared one", linksSharedStyles('<link rel="stylesheet" href="https://example.com/other.css">') === false);
ok("the index's lines load its own script", linesFor("1.2.0", "sds-index.js").script === `<script src="${STYLES_ADDRESS}1.2.0/sds-index.js"></script>`);

console.log("=== page styles — the versions that were cut");
const scratch = mkdtempSync(join(tmpdir(), "page-styles-"));
try {
  const plugin = join(scratch, "plugin");
  mkdirSync(join(plugin, "styles"), { recursive: true });
  mkdirSync(join(plugin, "dist", "commands", "docs"), { recursive: true });
  writeFileSync(join(plugin, "styles", "versions.json"), JSON.stringify({ "1.0.0": { "sds-docs.css": "a" }, "1.10.0": {}, "1.2.0": {} }));
  ok("the styles folder is found from a bundled command", stylesDir(join(plugin, "dist", "commands", "docs", "sds.mjs")) === join(plugin, "styles"));
  ok("a file with no styles folder above it finds none", stylesDir(join(scratch, "elsewhere", "x.mjs")) === null);
  const versions = cutVersions(join(plugin, "styles"));
  ok("each version is read with its files", Object.keys(versions).length === 3 && versions["1.0.0"]["sds-docs.css"] === "a");
  ok("the newest version is read by its numbers, never as text", newestVersion(Object.keys(versions)) === "1.10.0");
  ok("no version at all gives none", newestVersion([]) === null && Object.keys(cutVersions(join(scratch, "none"))).length === 0);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
// The sentence every command says about a page that holds its own copy tells the reader what to run.
// The command that produces a page is `docs page write`; the subject alone is refused by the entry.
ok("the sentence about a page that holds its own copy names the action that produces a page, `docs page write`",
  OWN_COPY.includes("Produce it again with `docs page write`, or copy it from its template"), OWN_COPY);
ok("a version serves the stylesheet and the two scripts", JSON.stringify(SERVED_FILES) === JSON.stringify(["sds-docs.css", "sds-docs.js", "sds-index.js"]));

console.log(failed ? `\n  ${failed} of ${total} FAILED — page-styles` : `\n  all ${total} passed — page-styles`);
process.exit(failed ? 1 : 0);
