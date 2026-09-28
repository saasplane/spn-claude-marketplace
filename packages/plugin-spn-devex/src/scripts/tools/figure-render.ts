#!/usr/bin/env node
// RESTATES: `docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` § The figures, and
// `docs/05-guides/README.md` § Before step 1 — your machine, which names the browser this needs.
//
// What does a figure look like once a browser has drawn it?
//
// `docs.ts figures check` reads a drawing's own geometry and catches more than a render does — it
// found a label seven pixels from its neighbour and an arrow shorter than a reader can see, both of
// which a rendered pass called clean. So this is NOT a second opinion on geometry, and it is not a
// gate. It answers the one question the spec cannot: what a browser actually painted.
//
// Run it when a figure is wrong on the page and `figures check` is silent about it, or to keep a
// picture of what a figure looks like today.
//
//     node figure-render.ts <svg-or-html> [...]
//
// It writes a PNG beside each input and reports any text a line or a box overlaps, measured from the
// real layout rather than from characters-per-pixel.
//
// THE BROWSER IS OPTIONAL AND THIS SAYS SO RATHER THAN FAILING. `playwright` is installed globally
// beside node (the guides seat carries the line). On a machine without it this prints one line and
// exits clean — the same property `restate-drift.ts` has when it finds no book.
//
// `npm root -g` IS THE ONLY WAY TO FIND IT. A version manager moves the global tree whenever the node
// version changes, so a path written down here would be right until the next `fnm use`.

import { execFileSync } from "node:child_process";
import { basename, dirname, extname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

/** The stylesheet a `dg` figure is drawn against, in the theme a reader is most likely to be in. */
const CSS = `
 body{margin:0;background:#0f1318;padding:20px}
 svg{display:block;width:auto;max-width:none;height:auto}
 .dg{color:#86a9da}
 .dg .box{fill:#171d24;stroke:#242d37;stroke-width:1.5}
 .dg .box.off{fill:none;stroke:#242d37;stroke-width:1.5;stroke-dasharray:5 4}
 .dg .box.em{fill:#18232f;stroke:#86a9da;stroke-width:1.5}
 .dg .box.warn{fill:#2a2113;stroke:#d59d4f;stroke-width:1.5}
 .dg .t{font:650 13px ui-sans-serif,sans-serif;fill:#e3e8ee}
 .dg .l{font:12px ui-sans-serif,sans-serif;fill:#e3e8ee}
 .dg .s{font:11px ui-monospace,monospace;fill:#a3adb9}
 .dg .n{font:11px ui-sans-serif,sans-serif;fill:#6f7986}
 .dg .c{stroke:#86a9da;stroke-width:1.6;fill:none}`;

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

/**
 * Every label a line crosses or a box covers, read from the rendered layout.
 *
 * A POLY-LINE'S BOUNDING BOX COVERS GROUND IT NEVER DRAWS ON, so the `d` attribute is parsed into
 * segments rather than measured with `getBBox`. Written after the bbox version reported a figure
 * broken because one L-shaped arrow's rectangle happened to contain a label it passes nowhere near.
 *
 * IT IS AN IIFE, NOT AN ARROW FUNCTION. A string handed to `evaluate` is evaluated as an
 * EXPRESSION, so `() => {…}` yields a function nobody calls and the probe returns `undefined`.
 */
const PROBE = `(() => {
  const root = document.querySelector('svg');
  if (!root) return ['no svg on the page'];
  const rects = [...root.querySelectorAll('rect')].map((r) => r.getBBox());
  const segs = [];
  for (const path of root.querySelectorAll('path')) {
    const d = path.getAttribute('d') || '';
    const m = d.match(/^M(-?[\\d.]+)[ ,](-?[\\d.]+)/);
    if (!m) continue;
    let x = +m[1], y = +m[2];
    for (const [, c, v] of d.matchAll(/([HV])(-?[\\d.]+)/g)) {
      const n = +v;
      if (c === 'H') { segs.push({ x1: Math.min(x, n), x2: Math.max(x, n), y1: y, y2: y }); x = n; }
      else { segs.push({ x1: x, x2: x, y1: Math.min(y, n), y2: Math.max(y, n) }); y = n; }
    }
  }
  const out = [];
  for (const t of root.querySelectorAll('text')) {
    const b = t.getBBox();
    const said = t.textContent.trim().slice(0, 52);
    for (const q of rects) {
      const over = b.x < q.x + q.width && b.x + b.width > q.x && b.y < q.y + q.height && b.y + b.height > q.y;
      const inside = b.x >= q.x - 3 && b.x + b.width <= q.x + q.width + 3 && b.y >= q.y - 3 && b.y + b.height <= q.y + q.height + 3;
      if (over && !inside) { out.push('a box covers "' + said + '"'); break; }
    }
    for (const s of segs) {
      if (s.x1 - 3 < b.x + b.width && s.x2 + 3 > b.x && s.y1 - 3 < b.y + b.height && s.y2 + 3 > b.y) {
        out.push('a line runs through "' + said + '"'); break;
      }
    }
  }
  return out;
})()`;

async function main(files: string[]): Promise<number> {
  if (!files.length) {
    console.log("usage: node figure-render.ts <svg-or-html> [...]");
    return 2;
  }
  const entry = playwrightPath();
  if (!entry) {
    console.log("No browser on this machine, so nothing was rendered — this is not a failure.");
    console.log("The guides seat carries the line: npm install -g playwright && npx playwright install chromium");
    return 0;
  }

  const { chromium } = await import(entry);
  const browser = await chromium.launch();
  let findings = 0;
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    // A bare `.svg` is wrapped; a page is loaded whole, so its own stylesheet wins over the fallback.
    const html = extname(file) === ".svg" ? `<style>${CSS}</style>${body}` : body;
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    await page.setContent(html);
    const svg = await page.$("svg");
    if (!svg) { console.log(`${basename(file)}: no figure on this page`); await page.close(); continue; }
    const png = join(dirname(file), basename(file, extname(file)) + ".png");
    await svg.screenshot({ path: png });
    const bad: string[] = await page.evaluate(PROBE);
    findings += bad.length;
    console.log(`${basename(file).padEnd(26)} ${bad.length ? `${bad.length} finding(s)` : "reads clean"}  ->  ${basename(png)}`);
    for (const line of bad) console.log(`    ${line}`);
    await page.close();
  }
  await browser.close();
  // IT REPORTS AND NEVER REFUSES. The geometry check is the one that grades; this one hands a person
  // a picture and a list, and a person decides whether the drawing says what it means to.
  return 0;
}

if (process.argv[1] && basename(process.argv[1]) === "figure-render.ts")
  process.exit(await main(process.argv.slice(2).filter((a) => !a.startsWith("-"))));
