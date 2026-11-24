// A whole page, rendered in light and in dark.
//
//     spn-devex docs look <page> [--out <folder>]
//
// `docs figure render` takes a picture of one figure. This takes a picture of the page, twice: once
// with the browser asking for a light colour scheme and once for a dark one, and saves both as PNG
// files in the folder named, or in the system's temporary folder. It also reports what a person
// opening the page would run into: an error the page wrote to the console, a request that failed,
// and a page wider than its window.
//
// THE BROWSER IS THE ONE THE MACHINE ALREADY HAS. The global Playwright is found the way `figure.ts`
// finds it (`npm root -g`; the same few lines, written again here because that file does not export
// them). The profile at `~/.saasplane/state/browser/chrome` is used where it exists, and Playwright's own
// chromium where it does not or where the profile cannot be opened. NO OTHER BROWSER PROFILE IS EVER
// OPENED.
//
// IT REPORTS AND NEVER REFUSES. Where no browser is installed it says `not checked`, with the line
// that installs one, and exits 0, as `docs figure render` does.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MISSING_PROFILE_LINE, findRoom, roomPath } from "../../lib/machine-home.ts";
import { REQUIRED, UsageFault, VALUE, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "render a whole page in light and in dark, and report console errors, failed requests and a page wider than its window";
export const usage = "<page> [--out <folder>]";

/** The window the page is opened in, in pixels. */
const WINDOW = { width: 1280, height: 800 };

/** Where the global install lives today. `null` where there is none, which is not an error. */
function playwrightPath(): string | null {
  try {
    const root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    const entry = join(root, "playwright", "index.mjs");
    return existsSync(entry) ? entry : null;
  } catch {
    return null;
  }
}

/** The one browser profile this command may open. */
export const PROFILE = roomPath("state", "browser", "chrome");

const NOT_CHECKED = [
  "not checked — no browser on this machine, so nothing was rendered. This is not a failure.",
  "To install one: npm install -g playwright && npx playwright install chromium",
];

export async function run(args: string[]): Promise<number> {
  const words = readWords(args, { out: VALUE });
  const paths = scopeOf(words.paths, REQUIRED);
  if (paths.length !== 1) throw new UsageFault("takes one page.");
  const file = resolve(paths[0]);
  if (!existsSync(file)) throw new UsageFault(`names \`${paths[0]}\`, and nothing is there.`);
  const folder = words.value("out") ? resolve(words.value("out")!) : mkdtempSync(join(tmpdir(), "spn-look-"));

  const entry = playwrightPath();
  if (!entry) { for (const line of NOT_CHECKED) console.log(line); return 0; }

  // A MISSING PROFILE IS SAID IN ONE LINE AND NEVER STOPS THE RUN: this command reports and never refuses.
  if (!findRoom("state", "browser", "chrome")) console.log(MISSING_PROFILE_LINE);

  // THE PROFILE FIRST, THE BUNDLED CHROMIUM SECOND. A profile another window holds open cannot be
  // opened twice, so a failed open falls back rather than ending the run.
  const { chromium } = await import(entry);
  let browser: { close: () => Promise<void> } | null = null;
  let context: any = null;
  try {
    if (findRoom("state", "browser", "chrome")) {
      try { context = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: WINDOW }); browser = context; }
      catch { context = null; }
    }
    if (!context) {
      const launched = await chromium.launch();
      browser = launched;
      context = await launched.newContext({ viewport: WINDOW });
    }
  } catch {
    for (const line of NOT_CHECKED) console.log(line);
    return 0;
  }

  mkdirSync(folder, { recursive: true });
  const stem = basename(file, extname(file));
  const errors: string[] = [], failed: string[] = [];
  const page = await context.newPage();
  page.on("console", (message: { type: () => string; text: () => string }) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error: Error) => errors.push(error.message));
  page.on("requestfailed", (request: { url: () => string; failure: () => { errorText?: string } | null }) =>
    failed.push(`${request.url()} — ${request.failure()?.errorText ?? "failed"}`));
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });

  const saved: string[] = [];
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const picture = join(folder, `${stem}-${scheme}.png`);
    await page.screenshot({ path: picture, fullPage: true });
    saved.push(picture);
  }
  const wider: { page: number; window: number } = await page.evaluate(
    "({ page: document.documentElement.scrollWidth, window: window.innerWidth })");
  await page.emulateMedia({ colorScheme: "light" });
  const layout: string[] = await page.evaluate(LAYOUT_PROBE);
  // THE PINNED KEY COLUMN IS READ IN DARK, where a fill the light page gets from a token can be missing (RULE.DEVEX.WORKSPACE.576).
  await page.emulateMedia({ colorScheme: "dark" });
  const pinned: string[] = await page.evaluate(PINNED_PROBE);
  await browser!.close();

  console.log(`${basename(file)}: rendered in light and in dark`);
  for (const picture of saved) console.log(`  ${picture}`);
  console.log(`  console errors   ${errors.length}`);
  for (const line of errors) console.log(`    ${line}`);
  console.log(`  failed requests  ${failed.length}`);
  for (const line of failed) console.log(`    ${line}`);
  console.log(wider.page > wider.window
    ? `  width            the page is ${wider.page}px wide in a window of ${wider.window}px`
    : `  width            fits the window (${wider.window}px)`);
  console.log(`  layout           ${layout.length ? `${layout.length} finding(s)` : "no text drawn over other text, every one-fact line on one line, and every END column under its heading"}`);
  for (const line of layout) console.log(`    ${line}`);
  console.log(`  pinned (dark)    ${pinned.length ? `${pinned.length} finding(s)` : "every pinned key column takes its row's fill"}`);
  for (const line of pinned) console.log(`    ${line}`);
  return 0;
}

/**
 * WHAT THE MARKUP CANNOT SHOW, MEASURED ON THE DRAWN PAGE (RULE.DEVEX.WORKSPACE.277: a page is checked by its computed values).
 * A page check reads the markup, so a stylesheet that draws a tile's line over its title passes it. This reads the boxes the
 * browser drew: two pieces of text inside one tile whose boxes overlap, and a one-fact item whose label and value do not share a
 * line although they would fit on one (the developer, 2026-11-23: "a catalog item with one short fact draws it as one line").
 * Exported for the probe's own test and for a run over many pages.
 */
export const LAYOUT_PROBE = `(() => {
  const found = [];
  const name = (tile) => ((tile.querySelector('h4, .sds-door-title') || tile).textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
  const boxes = (els) => els.map((el) => ({ el, r: el.getBoundingClientRect() })).filter((b) => b.r.width > 0 && b.r.height > 0);
  for (const tile of document.querySelectorAll('.sds-tile')) {
    const parts = boxes([...tile.querySelectorAll('h4, p, dt, dd, .sds-door-title, .sds-door-line')]);
    let hit = null;
    for (let i = 0; i < parts.length && !hit; i++) for (let j = i + 1; j < parts.length && !hit; j++) {
      const a = parts[i], b = parts[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 4 && h > 4) hit = a.el.tagName.toLowerCase() + ' and ' + b.el.tagName.toLowerCase();
    }
    if (hit) found.push('overlap  "' + name(tile) + '": its ' + hit + ' are drawn over each other');
  }
  for (const one of document.querySelectorAll('.sds-tile-facts-one > div')) {
    const dt = one.querySelector('dt'), dd = one.querySelector('dd');
    if (!dt || !dd) continue;
    const t = dt.getBoundingClientRect(), d = dd.getBoundingClientRect(), row = one.getBoundingClientRect();
    if (d.top - t.top > t.height * 0.6 && t.width + d.width + 12 < row.width)
      found.push('stacked  "' + name(one.closest('.sds-tile') || one) + '": its one fact draws "' + dt.textContent.trim() + '" above its value, not on one line');
  }
  // An END list's header names each column once, so a heading starts where its column's values start (the developer,
  // 2026-11-24: "Why Owes title and text is not aligned"; a row's own column gap had moved its cells 7px).
  const textLeft = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().left; };
  for (const list of document.querySelectorAll('.sds-tiles[data-facts="side"]')) {
    const heads = [...list.querySelectorAll(':scope > .sds-tiles-head > span')].slice(1);
    if (!heads.length || !heads[0].getBoundingClientRect().width) continue;
    for (const tile of list.querySelectorAll(':scope > .sds-tile')) {
      const cells = [...tile.querySelectorAll('.sds-tile-facts > div')];
      cells.forEach((cell, i) => {
        const dd = cell.querySelector('dd');
        if (!heads[i] || !dd || !dd.getBoundingClientRect().width) return;
        const off = Math.round(textLeft(dd) - textLeft(heads[i]));
        if (Math.abs(off) > 1) found.push('column   "' + name(tile) + '": its "' + heads[i].textContent.trim() + '" value starts ' + off + 'px from its heading');
      });
    }
  }
  return found;
})()`;

/**
 * A TABLE catalog's key column stays at the start while the table scrolls, so it must take its row's fill, or a value scrolled beneath it
 * shows through. Run in DARK, where the fills are the tokens' dark values: each pinned key cell must be opaque and draw the colour its row's
 * value cells sit on. Exported for the probe's own test.
 */
export const PINNED_PROBE = `(() => {
  const found = [];
  const fill = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const m = /rgba?\\(([^)]+)\\)/.exec(c);
      if (!m) continue;
      const [r, g, b, a = '1'] = m[1].split(',').map((x) => x.trim());
      if (parseFloat(a) > 0) return { r, g, b, a: parseFloat(a) };
    }
    return { r: '255', g: '255', b: '255', a: 1 };
  };
  const same = (x, y) => x.r === y.r && x.g === y.g && x.b === y.b;
  for (const table of document.querySelectorAll('.sds-catalog-table')) {
    const label = ((table.querySelector('thead th:nth-child(2)') || table).textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    for (const row of table.querySelectorAll('tbody > tr')) {
      const key = row.querySelector(':scope > th'), value = row.querySelector(':scope > td');
      if (!key || !value) continue;
      const own = getComputedStyle(key).backgroundColor;
      if (/rgba\\([^)]*,\\s*0\\)$/.test(own) || own === 'transparent') { found.push('pinned   "' + label + '": the key "' + key.textContent.trim() + '" has no fill in dark, so a value scrolled beneath it shows through'); break; }
      if (!same(fill(key), fill(value))) { found.push('pinned   "' + label + '": the key "' + key.textContent.trim() + '" is not the fill of its row in dark'); break; }
    }
  }
  return found;
})()`;
