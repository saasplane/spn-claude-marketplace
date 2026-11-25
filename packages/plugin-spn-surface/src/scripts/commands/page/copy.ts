// `spn-surface page copy` — one running page, copied into a surface page: the surface page template with the copy's markup in it.
//
//     spn-surface page copy <url> <folder> [--notes <notes.json>] [--name <name>] [--ds <version>] [--app-css <path>] [--template <file>]
//
// Writes `<folder>/<name>.html`, the surface page template (`surface-page-template.html`) with the page's rendered markup in its `<template id="page">`:
// every stylesheet the page holds inlined in one `<style>`, its scripts removed, one hidden note for each section from the notes file
// (`[{ "title": "<the section's heading>", "note": "<line>" }]`, marked `data-note`), and the template's two metas set (`surface-ds` from `--ds`,
// `surface-app-css` from `--app-css`, empty by default). The page's fonts are copied beside it into `<folder>/fonts/`. The shared script builds the
// frame's document from the template, so the copy holds no meta for a mode switch and listens to no message. The site is only read, and nothing in
// it or in any repository is changed.
//
// THE BROWSER IS THE ONE THE MACHINE ALREADY HAS, found the way `spn-devex docs look` finds it: the global Playwright (`npm root -g`)
// and its own chromium. No path into a user's own install is named, and no browser profile is opened.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "Copy one running page into a folder as a surface page: the surface page template holding the copy's markup, with a hidden note for each section";
export const usage = "<url> <folder> [--notes <notes.json>] [--name <name>] [--ds <version>] [--app-css <path>] [--template <file>]";

/** One note of the notes file: the heading of the section it belongs to, and its line. */
export type Note = { title: string; note: string };
/** One heading of the page and the place (the order among the page's sections) of the section that holds it. */
export type Heading = { title: string; section: number };
/** One note placed: its number, the section it is prepended to, and its markup. */
export type Placed = { number: number; section: number; html: string };

const escapeHtml = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One note's markup: a hidden aside of the class `sds-note` (the page script draws the sticky note), numbered from 1, pinned to the top left of its section. */
export function noteHtml(number: number, note: string): string {
  return `<aside class="sds-note" data-note="${number}" hidden>${number} &middot; ${escapeHtml(note)}</aside>`;
}

/**
 * Where each note goes. A note stands in the section of the first heading that carries its title, numbered by its place in the
 * notes file; a note whose title no heading carries is left out, and a section takes one note only, the first.
 */
export function placeNotes(notes: Note[], headings: Heading[]): Placed[] {
  const taken = new Set<number>();
  const placed: Placed[] = [];
  notes.forEach((entry, at) => {
    const heading = headings.find((candidate) => candidate.title === entry.title);
    if (!heading || heading.section < 0 || taken.has(heading.section)) return;
    taken.add(heading.section);
    placed.push({ number: at + 1, section: heading.section, html: noteHtml(at + 1, entry.note) });
  });
  return placed;
}

/** The page's markup for the template: the page's style in one `<style>`, then what is inside its `<body>`. */
export function pageMarkup(html: string, css: string): string {
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  return `<style>\n${css}\n</style>\n${body.trim()}\n`;
}

/** A name as a file name: lower case words joined by dashes. */
export const slugOf = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "page";

/**
 * The surface page template filled with one copy: the name in its `<title>`, bar title and frame title, the page's id, the two metas, and the
 * page's markup in place of the sample between the template's first `<template id="page-<MODE>-<DEVICE>">` tag and its end. A template that holds no such tags is refused by the caller.
 */
export function fillTemplate(template: string, markup: string, options: { name: string; ds: string; appCss: string }): string {
  const tag = /<template id="page(?:-(?:LIGHT|DARK)-(?:DESKTOP|TABLET|PHONE))?">/.exec(template);
  const open = tag ? tag.index : -1;
  const close = template.indexOf("</template>", open);
  if (!tag || close < 0) throw new UsageFault("takes a surface page template that holds a `<template id=\"page-<MODE>-<DEVICE>\">`, and this one does not.");
  const head = template.slice(0, open + tag[0].length);
  const filled = `${head}\n${markup}${template.slice(close)}`
    .replace(/\{\{NAME\}\}/g, escapeHtml(options.name))
    .replace(/\{\{page\}\}/g, slugOf(options.name))
    .replace(/<meta name="surface-ds" content="[^"]*">/, () => `<meta name="surface-ds" content="${escapeHtml(options.ds)}">`)
    .replace(/<meta name="surface-app-css" content="[^"]*">/, () => `<meta name="surface-app-css" content="${escapeHtml(options.appCss)}">`);
  return filled;
}

/** Where the build puts the surface page template inside the spn-devex plugin: the copy of the book's template, under its refs. */
export const TEMPLATE_IN_DEVEX = join("refs", "devex", "workspace", "docs", "templates", "surface", "surface-page-template.html");

/** Three numbers as a version, to put the newest first. */
const versionParts = (name: string): number[] => name.split(".").map((part) => Number(part) || 0);

/**
 * Where the surface page template is looked for when `--template` names none: the copy the plugins' build writes into the spn-devex plugin,
 * read through the folder of the plugins beside this one. In the marketplace that is `packages/plugin-spn-devex/src/refs/…` beside this plugin;
 * installed, it is the newest version of `spn-devex` beside `spn-surface` in the plugins' folder (`…/<marketplace>/spn-devex/<version>/refs/…`).
 * Null where neither holds it; the caller then refuses by name and says to pass `--template`. `from` is the folder this file runs from.
 */
export function templateBeside(from: string = import.meta.dirname): string | null {
  for (let at = resolve(from), up = 0; up < 6; up++, at = resolve(at, "..")) {
    const inMarketplace = join(at, "..", "plugin-spn-devex", "src", TEMPLATE_IN_DEVEX);
    if (existsSync(inMarketplace)) return resolve(inMarketplace);
    const installed = join(at, "..", "spn-devex");
    if (existsSync(installed)) {
      const versions = readdirSync(installed).filter((name) => /^\d+\.\d+\.\d+$/.test(name))
        .sort((one, two) => { const a = versionParts(two), b = versionParts(one); return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
      for (const version of versions) {
        const held = join(installed, version, TEMPLATE_IN_DEVEX);
        if (existsSync(held)) return resolve(held);
      }
    }
  }
  return null;
}

// What runs in the page, as text: this file is checked without a browser's types.
const HEADINGS = "[...document.querySelectorAll('section h1, section h2, section h3')].map(function(h){var s=h.closest('section');return {title:h.textContent.trim(),section:s?[...document.querySelectorAll('section')].indexOf(s):-1};})";
const PLACE = "(function(plan){var all=document.querySelectorAll('section');plan.forEach(function(p){var sec=all[p.section];if(!sec||sec.querySelector(':scope > [data-note]'))return;if(getComputedStyle(sec).position==='static')sec.style.position='relative';sec.insertAdjacentHTML('afterbegin',p.html);});})";
const SCROLL = "(async function(){for(var y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(function(r){setTimeout(r,60);});}window.scrollTo(0,0);})()";
const READ = "(function(){var css=[...document.styleSheets].map(function(s){try{return [...s.cssRules].map(function(r){return r.cssText;}).join('\\n');}catch(e){return '';}}).join('\\n');var doc=document.documentElement.cloneNode(true);doc.querySelectorAll('script, link[rel=stylesheet], style, link[rel=modulepreload]').forEach(function(n){n.remove();});var fontUrls=[...new Set([...css.matchAll(/url\\([\"']?([^\"')]+\\.(?:woff2?|ttf|otf))[\"']?\\)/g)].map(function(m){return new URL(m[1],location.href).href;}))];return {css:css,html:doc.outerHTML,fontUrls:fontUrls};})()";

/** Where the global install lives today, or null where there is none. */
function playwrightPath(): string | null {
  try {
    const entry = join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "playwright", "index.mjs");
    return existsSync(entry) ? entry : null;
  } catch {
    return null;
  }
}

export async function run(args: string[]): Promise<number> {
  const words = readWords(args, { notes: VALUE, name: VALUE, ds: VALUE, "app-css": VALUE, template: VALUE });
  if (words.paths.length !== 2) throw new UsageFault("takes a url and a folder.");
  const [url, folderWord] = words.paths;
  if (!/^(https?|file):\/\//.test(url)) throw new UsageFault(`takes a url that opens with http://, https:// or file://, and \`${url}\` does not.`);
  const folder = resolve(folderWord);
  const notesFile = words.value("notes");
  if (notesFile && !existsSync(resolve(notesFile))) throw new UsageFault(`names \`${notesFile}\`, and nothing is there.`);
  const notes: Note[] = notesFile ? JSON.parse(readFileSync(resolve(notesFile), "utf8")) : [];

  const named = words.value("template");
  const found = named ? resolve(named) : templateBeside();
  if (found === null) throw new UsageFault("finds no surface page template beside this plugin: the spn-devex plugin's copy is not installed next to spn-surface. Pass `--template <file>`, the `surface-page-template.html` of the spn-devex plugin's refs.");
  const templateFile = found;
  if (!existsSync(templateFile)) throw new UsageFault(`names the surface page template \`${templateFile}\`, and nothing is there. Pass \`--template <file>\`, the \`surface-page-template.html\` of the spn-devex plugin's refs.`);

  const entry = playwrightPath();
  if (!entry) {
    console.log("REFUSED page-copy: no browser on this machine, so nothing was copied.");
    console.log("To install one: npm install -g playwright && npx playwright install chromium");
    return 1;
  }
  const { chromium } = await import(pathToFileURL(entry).href);
  mkdirSync(join(folder, "fonts"), { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true, reducedMotion: "no-preference" });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(SCROLL);
    await page.waitForTimeout(400);
    const headings: Heading[] = await page.evaluate(HEADINGS);
    await page.evaluate(`${PLACE}(${JSON.stringify(placeNotes(notes, headings))})`);
    const read: { css: string; html: string; fontUrls: string[] } = await page.evaluate(READ);
    let css = read.css;
    for (const font of read.fontUrls) {
      const name = basename(new URL(font).pathname);
      const response = await context.request.get(font);
      if (response.ok()) {
        writeFileSync(join(folder, "fonts", name), await response.body());
        css = css.split(font).join(`fonts/${name}`);
      }
      const relative = new URL(font).pathname;
      css = css.split(`url("${relative}")`).join(`url("fonts/${name}")`).split(`url(${relative})`).join(`url(fonts/${name})`);
    }
    const name = words.value("name") ?? (await page.title()) ?? "Page";
    const copy = fillTemplate(readFileSync(templateFile, "utf8"), pageMarkup(read.html, css), { name, ds: words.value("ds") ?? "", appCss: words.value("app-css") ?? "" });
    const out = join(folder, `${slugOf(name)}.html`);
    writeFileSync(out, copy);
    console.log(`OK ${out}: copied ${url} into the surface page template · ${read.fontUrls.length} fonts · ${Math.round(copy.length / 1024)} KB`);
    return 0;
  } finally {
    await browser.close();
  }
}
