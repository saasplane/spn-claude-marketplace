#!/usr/bin/env node
// Walks a running site the way a visitor meets it, and reads computed values, never a copy: every page at a phone, a tablet and a
// desktop width, in light and in dark. A review of a site, and an arc's final re-check of one, run it (RULE.SUPPORT.SURFACE.592).
//
//   node site-walk.mjs --base <https://host> --routes </,/a,/b> [--routes-file <file, one route a line>] [--out <folder>] [--shots]
//
// It writes `<out>/site-walk.json` (every reading) and `<out>/site-walk.md` (the findings, by page), prints the findings, and exits 1
// when there is one. Plain Node: it reads the site, changes nothing, and finds Playwright where `npm root -g` holds it.
//
// Per page and width it reads:
//   medium   each `[data-slot=feature-media]`: the drawing's scale (rendered width over its viewBox), its smallest rendered text,
//            an image's shown width over its natural width, and whether it leaves the viewport or stands empty
//   hidden   the parts of a medium still at opacity 0 or hidden after the page was scrolled through, so every reveal has played
//   scroll   the document wider than the window, which is sideways scroll
//   head     the title, the description, the canonical link, the share preview, `robots`, the language, the count of `h1` and the
//            images without alt text
// Once per site it reads the root files: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` and `/favicon.ico`.
//
// The widths are the design system's screen classes: phone under 768 px, tablet from 768 to 1023, side by side from 1024. The
// desktop pass runs at 1440, and the pass at 1024 is the narrowest column a drawing stands in beside its words.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VIEWS = [
  { name: "phone", width: 390, height: 844, scheme: "light" },
  { name: "tablet", width: 834, height: 1194, scheme: "light" },
  { name: "side-by-side-1024", width: 1024, height: 768, scheme: "light" },
  { name: "desktop", width: 1440, height: 900, scheme: "light" },
  { name: "desktop-dark", width: 1440, height: 900, scheme: "dark" },
  { name: "phone-dark", width: 390, height: 844, scheme: "dark" },
];
/** Under this rendered text height, in px, a drawing's text is no longer legible. */
const SMALLEST_TEXT = 11;
/** Under this scale a drawing is shown at less than half of the size it was made for. */
const SMALLEST_SCALE = 0.5;

const args = process.argv.slice(2);
const flag = (name) => { const at = args.indexOf(`--${name}`); return at < 0 ? null : (args[at + 1] ?? ""); };
const base = (flag("base") ?? "").replace(/\/$/, "");
const out = resolve(flag("out") ?? ".");
const routes = [...(flag("routes") ? flag("routes").split(",") : []), ...(flag("routes-file") ? readFileSync(flag("routes-file"), "utf8").split("\n") : [])]
  .map((one) => one.trim()).filter(Boolean);
if (!/^https?:\/\//.test(base) || !routes.length) {
  console.log("usage: node site-walk.mjs --base <https://host> --routes </,/a,/b> [--routes-file <file>] [--out <folder>] [--shots]");
  process.exit(2);
}

/** Playwright, from the global install. */
async function playwright() {
  const entry = join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "playwright", "index.mjs");
  if (!existsSync(entry)) { console.log("REFUSED site-walk: no browser on this machine. npm install -g playwright && npx playwright install chromium"); process.exit(2); }
  return import(pathToFileURL(entry).href);
}

/** What the page holds once it is loaded and scrolled through, read in the page. */
const READ = () => {
  const vw = document.documentElement.clientWidth;
  const rect = (el) => { const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x) }; };
  const media = [...document.querySelectorAll("[data-slot=feature-media]")].map((el) => {
    const heading = el.closest("section")?.querySelector("h1,h2,h3");
    const box = rect(el);
    const svg = [...el.querySelectorAll("svg")].find((one) => one.getBoundingClientRect().width > 60);
    let scale = null;
    let smallestText = null;
    if (svg) {
      const viewBox = svg.viewBox && svg.viewBox.baseVal;
      if (viewBox && viewBox.width) scale = +(svg.getBoundingClientRect().width / viewBox.width).toFixed(2);
      const sizes = [...svg.querySelectorAll("text")].map((one) => one.getBoundingClientRect().height).filter((one) => one > 0);
      if (sizes.length) smallestText = +Math.min(...sizes).toFixed(1);
    }
    const img = el.querySelector("img");
    const imageScale = img && img.naturalWidth ? +(img.getBoundingClientRect().width / img.naturalWidth).toFixed(2) : null;
    const all = [...el.querySelectorAll("svg *")];
    const hidden = all.filter((one) => {
      const style = getComputedStyle(one);
      return (style.opacity === "0" || style.visibility === "hidden") && one.getBoundingClientRect().width > 8;
    }).length;
    return {
      heading: heading ? heading.textContent.trim().slice(0, 60) : "?", box, scale, smallestText, imageScale, hidden, parts: all.length,
      leavesWindow: box.x < -2 || box.x + box.w > vw + 2, empty: box.h < 40,
    };
  });
  const meta = (selector, attribute) => document.querySelector(selector)?.getAttribute(attribute) ?? null;
  return {
    sidewaysScroll: document.documentElement.scrollWidth > vw + 1,
    media,
    head: {
      title: document.title || null,
      description: meta("meta[name=description]", "content"),
      canonical: meta("link[rel=canonical]", "href"),
      ogTitle: meta("meta[property='og:title']", "content"),
      ogImage: meta("meta[property='og:image']", "content"),
      robots: meta("meta[name=robots]", "content"),
      lang: document.documentElement.lang || null,
      h1: document.querySelectorAll("h1").length,
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((one) => !one.hasAttribute("alt")).length,
    },
  };
};

/** The findings in one reading of a page. */
function findingsOf(route, view, page) {
  const found = [];
  const at = `${route} @ ${view}`;
  if (page.sidewaysScroll) found.push(`${at}: the page scrolls sideways`);
  for (const one of page.media) {
    const name = `${at} · "${one.heading}"`;
    if (one.scale !== null && one.scale < SMALLEST_SCALE) found.push(`${name}: a drawing at scale ${one.scale}, under ${SMALLEST_SCALE}`);
    if (one.smallestText !== null && one.smallestText < SMALLEST_TEXT) found.push(`${name}: a drawing's smallest text is ${one.smallestText}px, under ${SMALLEST_TEXT}`);
    if (one.hidden > 0) found.push(`${name}: ${one.hidden} of ${one.parts} parts are hidden at rest`);
    if (one.leavesWindow) found.push(`${name}: the medium leaves the window`);
    if (one.empty) found.push(`${name}: the medium stands empty`);
  }
  if (view === "desktop") {
    const head = page.head;
    if (!head.title) found.push(`${route}: no title`);
    if (!head.description) found.push(`${route}: no description`);
    if (!head.canonical) found.push(`${route}: no canonical link`);
    if (!head.ogTitle || !head.ogImage) found.push(`${route}: no share preview`);
    if (!head.lang) found.push(`${route}: no language`);
    if (head.h1 !== 1) found.push(`${route}: ${head.h1} h1, not one`);
    if (head.imagesWithoutAlt) found.push(`${route}: ${head.imagesWithoutAlt} image(s) without alt text`);
  }
  return found;
}

const { chromium } = await playwright();
const browser = await chromium.launch();
const readings = [];
const findings = [];
try {
  // The root files stand once for the site.
  const rootFiles = {};
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  for (const file of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/favicon.ico"]) {
    const response = await context.request.get(base + file).catch(() => null);
    rootFiles[file] = response ? response.status() : 0;
    if (!response || !response.ok()) findings.push(`${file}: answers ${rootFiles[file] || "nothing"}`);
  }
  await context.close();
  readings.push({ rootFiles });
  for (const view of VIEWS) {
    const viewContext = await browser.newContext({ viewport: { width: view.width, height: view.height }, colorScheme: view.scheme, ignoreHTTPSErrors: true });
    const page = await viewContext.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      // Scroll through, so every reveal has played before anything is read as hidden.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += Math.round(view.height * 0.6)) { await page.evaluate((to) => scrollTo(0, to), y); await page.waitForTimeout(120); }
      await page.waitForTimeout(1800);
      const reading = await page.evaluate(READ);
      readings.push({ route, view: view.name, ...reading });
      findings.push(...findingsOf(route, view.name, reading));
      if (args.includes("--shots")) {
        mkdirSync(join(out, "shots", view.name), { recursive: true });
        await page.screenshot({ path: join(out, "shots", view.name, `${route === "/" ? "home" : route.slice(1).replace(/\//g, "-")}.png`), fullPage: true });
      }
    }
    await viewContext.close();
  }
} finally {
  await browser.close();
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "site-walk.json"), JSON.stringify(readings, null, 1));
writeFileSync(join(out, "site-walk.md"), `# Site walk of ${base}\n\n${findings.length ? findings.map((one) => `- ${one}`).join("\n") : "No finding."}\n`);
console.log(findings.length ? findings.join("\n") : "No finding.");
console.log(`\n${routes.length} page(s) · ${VIEWS.length} view(s) · ${findings.length} finding(s) · ${join(out, "site-walk.md")}`);
process.exit(findings.length ? 1 : 0);
