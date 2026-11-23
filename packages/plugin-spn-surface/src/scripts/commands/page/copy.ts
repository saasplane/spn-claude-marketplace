// `spn-surface page copy` — one running page, copied into a folder as a self-contained file for a surface preview.
//
//     spn-surface page copy <url> <folder> [--notes <notes.json>]
//
// Writes `<folder>/index.html`: the page's rendered markup, every stylesheet the page holds inlined in one `<style>`, its scripts
// removed, and its fonts copied beside it into `<folder>/fonts/`. It adds what a surface preview needs, with no outside
// names: a `preview-mode` meta naming the page's own mode switch, one hidden note for each section from the notes file
// (`[{ "title": "<the section's heading>", "note": "<line>" }]`, marked `data-note`), and a few lines that read the preview's
// message `{ "surface-page-preview": { mode, notes } }`. Opened alone, the copy is just the page. The site is only read, and
// nothing in it or in any repository is changed.
//
// THE BROWSER IS THE ONE THE MACHINE ALREADY HAS, found the way `spn-devex docs look` finds it: the global Playwright (`npm root -g`)
// and its own chromium. No path into a user's own install is named, and no browser profile is opened.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "Copy one running page into a folder as one self-contained file, with a hidden note for each section, for a surface preview";
export const usage = "<url> <folder> [--notes <notes.json>]";

/** One note of the notes file: the heading of the section it belongs to, and its line. */
export type Note = { title: string; note: string };
/** One heading of the page and the place (the order among the page's sections) of the section that holds it. */
export type Heading = { title: string; section: number };
/** One note placed: its number, the section it is prepended to, and its markup. */
export type Placed = { number: number; section: number; html: string };

/** The page's own mode switch, as the preview's meta names it: the attribute, its light value and its dark value. */
export const MODE_SWITCH = "data-mode light dark";

/** The meta that tells the preview which attribute switches the page's mode. */
export const previewMeta = (switchWords: string = MODE_SWITCH): string => `<meta name="preview-mode" content="${switchWords}">`;

/** The few lines that read the preview's message; opened alone, they do nothing. */
export const LISTENER = `<script>(function(){var m=document.querySelector('meta[name="preview-mode"]');var s=((m&&m.content)||'${MODE_SWITCH}').split(' ');addEventListener('message',function(e){var d=e.data&&e.data['surface-page-preview'];if(!d)return;document.documentElement.setAttribute(s[0],d.mode==='dark'?s[2]:s[1]);Array.prototype.forEach.call(document.querySelectorAll('[data-note]'),function(n){n.hidden=!d.notes;});});})();</script>`;

const escapeHtml = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One note's markup: a hidden aside, numbered from 1, pinned to the top left of its section. */
export function noteHtml(number: number, note: string): string {
  const badge = `<b style="display:inline-grid;place-items:center;width:20px;height:20px;margin-right:6px;border-radius:50%;background:#f9fafb;color:#111827;font-size:12px">${number}</b>`;
  return `<aside data-note="${number}" hidden style="position:absolute;top:12px;left:12px;z-index:60;max-width:300px;padding:8px 10px;border-radius:8px;background:#111827;color:#f9fafb;font:500 13px/1.45 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25)">${badge}${escapeHtml(note)}</aside>`;
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

/** The copy: the page's markup with the style, the mode meta and the listener put in. */
export function assemble(html: string, css: string): string {
  const page = html.replace("</head>", () => `${previewMeta()}\n<style>\n${css}\n</style>\n</head>`).replace("</body>", () => `${LISTENER}\n</body>`);
  return `<!doctype html>\n${page}`;
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
  const words = readWords(args, { notes: VALUE });
  if (words.paths.length !== 2) throw new UsageFault("takes a url and a folder.");
  const [url, folderWord] = words.paths;
  if (!/^(https?|file):\/\//.test(url)) throw new UsageFault(`takes a url that opens with http://, https:// or file://, and \`${url}\` does not.`);
  const folder = resolve(folderWord);
  const notesFile = words.value("notes");
  if (notesFile && !existsSync(resolve(notesFile))) throw new UsageFault(`names \`${notesFile}\`, and nothing is there.`);
  const notes: Note[] = notesFile ? JSON.parse(readFileSync(resolve(notesFile), "utf8")) : [];

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
    const copy = assemble(read.html, css);
    writeFileSync(join(folder, "index.html"), copy);
    console.log(`OK ${join(folder, "index.html")}: copied ${url} · ${read.fontUrls.length} fonts · ${Math.round(copy.length / 1024)} KB`);
    return 0;
  } finally {
    await browser.close();
  }
}
