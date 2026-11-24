// The plugin's templates are the book's, copied by the build (RULE.DEVEX.WORKSPACE.490): with a book beside this checkout, every file of
// the book's `04-docs/templates/` folder but its own `index.md` is in `refs/devex/workspace/docs/templates/` byte for byte, and the build script copies, reports and
// keeps as it says. With no book beside, the copy stays as committed and the run says so.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { PLUGIN } from "../../../helpers/harness.mjs";

const { findBook } = await import("../../../../src/scripts/commands/restates/check.ts");

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${String(detail).slice(0, 600)}` : ""}`);
};

const CHECKOUT = resolve(PLUGIN, "..", "..");
const BOOK_TEMPLATES = join("docs", "04-capabilities", "01-devex", "04-workspace", "04-docs", "templates");
const COPY = join(PLUGIN, "src", "refs", "devex", "workspace", "docs", "templates");
const filesUnder = (folder) => {
  const out = [];
  const walk = (dir) => { for (const name of readdirSync(dir).sort()) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (!name.startsWith(".")) out.push(relative(folder, path)); } };
  if (existsSync(folder)) walk(folder);
  return out;
};

console.log("=== the plugin's templates are the book's, byte for byte");
{
  const book = findBook(undefined, CHECKOUT);
  if (book === null) ok("[MKT.SCRIPTS.407] no book beside this checkout: the plugin's copy is what is committed, and there is nothing to compare", true);
  else {
    const from = join(book, BOOK_TEMPLATES);
    // The folder's own index.md, which records each template's hash, stays in the book; the plugin keeps its README.md instead.
    const files = filesUnder(from).filter((file) => file !== "index.md");
    const differing = files.filter((file) => !existsSync(join(COPY, file)) || !readFileSync(join(COPY, file)).equals(readFileSync(join(from, file))));
    ok("[MKT.SCRIPTS.407] every template of the book's templates folder is in the plugin's, equal byte for byte", files.length > 0 && differing.length === 0, differing.join(", "));
    ok("[MKT.SCRIPTS.407] the book's own index of its templates is not copied into the plugin", !existsSync(join(COPY, "index.md")));
  }
}

console.log("\n=== the build script copies, reports and keeps");
{
  // The build script is read, not run: running it would rewrite the plugin and its bundles.
  const text = readFileSync(join(CHECKOUT, "scripts", "build-plugins.mjs"), "utf8");
  ok("[MKT.SCRIPTS.407] the build copies the book's templates folder into the plugin's, subfolders kept", /BOOK_TEMPLATES/.test(text) && /04-docs", "templates"/.test(text) && /refs", "devex", "workspace", "docs", "templates"/.test(text));
  ok("[MKT.SCRIPTS.407] it keeps the plugin's copy and says so when no book is beside the checkout", /no spn-foundation beside this checkout/.test(text) && /refs\/devex\/workspace\/docs\/templates/.test(text));
  ok("[MKT.SCRIPTS.407] a file only the plugin holds is reported, never deleted", /only in the plugin's templates, so it is kept/.test(text) && !/unlinkSync|rmSync\(join\(PLUGIN_TEMPLATES/.test(text));
}

console.log("\n=== the templates are laid out by where the made file lives, and their placeholders are names");
{
  const files = filesUnder(COPY).filter((file) => file !== "README.md");
  const folders = new Set(files.map((file) => file.split(/[\\/]/)[0]));
  ok("[MKT.SCRIPTS.407] the folders are docs, plugin, surface and workstream, and the old pages, seat-files and agent folders are gone",
    [...folders].sort().join() === "docs,plugin,surface,workstream" && files.some((file) => file.startsWith(join("docs", "pages"))) && files.some((file) => file.startsWith(join("docs", "seats"))), [...folders].join());
  const pages = files.filter((file) => file.endsWith(".html"));
  const text = (file) => readFileSync(join(COPY, file), "utf8");
  const ownCopy = pages.filter((file) => !/blocks-template/.test(file));
  const hasPlaceholders = (file) => /<!-- Placeholders:\n[\s\S]*?-->/.test(text(file));
  ok("[MKT.SCRIPTS.407] every page template that has a placeholder to explain explains each once, in one comment at the top, `<!-- Placeholders: {{NAME}} … -->`",
    ownCopy.filter((file) => /\{\{[A-Z][A-Z-]*\}\}/.test(text(file.replace(/\\/g, "/")))).every((file) => hasPlaceholders(file)), ownCopy.filter((file) => !hasPlaceholders(file)).join(", "));
  const outside = (file) => text(file).replace(/<!-- Placeholders:\n[\s\S]*?-->/, "").replace(/<!--[\s\S]*?-->/g, "");
  const sentence = (file) => [...outside(file).matchAll(/\{\{([^{}]*)\}\}/g)].map((m) => m[1]).filter((one) => /[.:;]/.test(one.replace(/&\w+;/g, "")) && one.length > 30);
  ok("[MKT.SCRIPTS.407] outside the example content, no page template holds a placeholder that is an instruction sentence", ownCopy.filter((file) => !/approach|arc-template|report|blocks|index/.test(file)).every((file) => sentence(file).length === 0), ownCopy.map((file) => `${file}: ${sentence(file)[0] ?? ""}`).filter((s) => !s.endsWith(": ")).join(" | "));
  const frame = text(join("docs", "pages", "page-template.html"));
  ok("[MKT.SCRIPTS.407] the page template is the bare frame: the two shared lines, a masthead whose first line is the breadcrumb, sections, no rail, variant `page`",
    /<div class="sds-page" data-frame="page"><div class="sds-wrap">/.test(frame) && /<span class="sds-line1">\{\{WORKSPACE\}\} &middot; <a href="\{\{UP-HREF\}\}">\{\{REPOSITORY\}\}<\/a> &middot; \{\{NAME\}\}<\/span>/.test(frame) && !/sds-crumb/.test(frame) && !/\{\{UP\}\}/.test(frame) && !/class="sds-rail"/.test(frame)
      && /"variant": "page"/.test(frame) && /<h1>\{\{TITLE\}\}<\/h1>/.test(frame) && /<title>\{\{NAME\}\}<\/title>/.test(frame) && (frame.match(/<section\b/g) ?? []).length >= 2);
  const withRail = ["construct", "overview", "guide", "report"].map((name) => text(join("docs", "pages", `${name}-template.html`)));
  ok("[MKT.SCRIPTS.407] a template with a rail has its back link as the links of the eyebrow's first line, the breadcrumb, never a line above the masthead and never in the rail, and its name and its heading are two placeholders",
    withRail.every((page) => /<span class="sds-line1">[^<]*<a href="\{\{(?:HUB|UP)-HREF\}\}">/.test(page) && !/sds-crumb/.test(page) && !/\{\{UP\}\}/.test(page) && !/sds-home/.test(page) && /<title>\{\{NAME\}\}<\/title>/.test(page) && /<h1>\{\{TITLE\}\}<\/h1>/.test(page) && /class="sds-rail-title">\{\{NAME\}\}</.test(page)));
  const surface = text(join("surface", "surface-page-template.html"));
  const frameOnly = surface.replace(/<!--[\s\S]*?-->/g, "");
  const sampleNotes = (() => { try { return JSON.parse(/<script type="application\/json" id="sample-notes">([\s\S]*?)<\/script>/.exec(frameOnly)?.[1] ?? "null"); } catch { return null; } })();
  ok("[MKT.SCRIPTS.407] the surface page template: the bar holds the title and the three switches, the frame stands over a notes layer, and the two metas stand, the app's stylesheet empty",
    /<header class="sds-surface-bar">[\s\S]*sds-surface-title[\s\S]*data-surface="width"[\s\S]*data-surface="mode"[\s\S]*data-surface="notes"[\s\S]*<\/header>/.test(frameOnly) && /<iframe class="sds-surface-frame"/.test(frameOnly) && /<div class="sds-surface-notes"[^>]*hidden>/.test(frameOnly)
      && /<meta name="surface-ds" content="\d+\.\d+\.\d+">/.test(frameOnly) && /<meta name="surface-app-css" content="">/.test(frameOnly) && !/<style/.test(frameOnly), String(surface.length));
  ok("[MKT.SCRIPTS.407] the frame holds the render's output and nothing else: two sections, no section wrapper, no aside, no note attribute inside the template",
    (frameOnly.match(/<section data-slot="section-container"/g) ?? []).length === 2 && !/data-section=|class="sds-note"|data-note=|<aside/.test(frameOnly));
  ok("[MKT.SCRIPTS.407] the notes stand outside the page, as a JSON list of { n, kind, case, status, text, href }, one for each top-level section, n counted from 1",
    Array.isArray(sampleNotes) && sampleNotes.length === 2 && sampleNotes.every((note, i) => note.n === i + 1 && ["kind", "case", "status", "text", "href"].every((key) => key in note)) && frameOnly.indexOf('id="sample-notes"') < frameOnly.indexOf("<template"));
  ok("[MKT.SCRIPTS.407] the markup stands in one template for each device and mode rendered, named page-<MODE>-<DEVICE>, and the old one-template page is gone",
    /<template id="page-LIGHT-DESKTOP">/.test(frameOnly) && !/<template id="page">/.test(frameOnly) && (frameOnly.match(/<template id="page-(LIGHT|DARK)-(DESKTOP|TABLET|PHONE)">/g) ?? []).length >= 1);
  ok("[MKT.SCRIPTS.407] the template's own links are the published stylesheet and script, each with its integrity; a local copy drops it",
    (frameOnly.match(/<link rel="stylesheet" href="https:[^>]*integrity="sha384-[^"]*"/g) ?? []).length === 1 && (frameOnly.match(/<script src="https:[^>]*integrity="sha384-[^"]*"/g) ?? []).length === 1 && surface.length < 15000);
}

console.log(failed ? `\n  ${failed} of ${total} FAILED — templates` : `\n  all ${total} passed — templates`);
process.exit(failed ? 1 : 0);
