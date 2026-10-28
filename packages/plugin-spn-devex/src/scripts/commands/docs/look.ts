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
// them). The profile at `~/.spnutils/browser/chrome` is used where it exists, and Playwright's own
// chromium where it does not or where the profile cannot be opened. NO OTHER BROWSER PROFILE IS EVER
// OPENED.
//
// IT REPORTS AND NEVER REFUSES. Where no browser is installed it says `not checked`, with the line
// that installs one, and exits 0, as `docs figure render` does.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
export const PROFILE = join(homedir(), ".spnutils", "browser", "chrome");

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

  // THE PROFILE FIRST, THE BUNDLED CHROMIUM SECOND. A profile another window holds open cannot be
  // opened twice, so a failed open falls back rather than ending the run.
  const { chromium } = await import(entry);
  let browser: { close: () => Promise<void> } | null = null;
  let context: any = null;
  try {
    if (existsSync(PROFILE)) {
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
  return 0;
}
