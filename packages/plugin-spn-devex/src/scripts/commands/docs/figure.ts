// RESTATES: `docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` § The figures, and
// `docs/05-guides/README.md` § Before step 1 — your machine, which names the browser this needs.
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Two halves under one subject: the geometry check reads a spec and the SVG it draws to; the browser
// render answers what a real layout paints; `draw` is the same drawer, offered to a hand-written page.
//
//   spn-devex docs figure check <path…> [--variant <name>]    labels fit and connectors join · a block's colouring matches its text
//   spn-devex docs figure colour <path…> [--variant <name>]   the audit's half: a coloured block strips back to what the author wrote
//   spn-devex docs figure render <svg-or-html…>               render each in a headless browser and report what it painted
//   spn-devex docs figure draw <spec.json…>                   print the drawing of each spec — a `.json` file, or a `.md` page's own ```dg``` blocks
//
// A SUBJECT WITH FOUR ACTIONS. `check`, `colour` and `render` take a `file` path, one or a folder of
// them, and `--variant` narrows the first two; `draw` takes one or more spec files directly.
//
// THE BROWSER IS OPTIONAL AND THIS SAYS SO RATHER THAN FAILING, on a machine carrying no global
// `playwright` install (the guides seat carries the line to add one).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { checkFigures, colour, stripSpans } from "../../lib/figures.ts";
import { draw } from "../../lib/draw.ts";
import { type Action, REQUIRED, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { DEVEX_WORKSTREAMS, DOCS, hasSegment, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, cutVersions, linesFor, newestVersion } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { VARIANTS, holdsOwnCopy, inClosedWorkstream, readBlock, resolveWorkspace, stylesFolder, walkFiles } from "./_lib.ts";

/**
 * Whether an html file is a page of ours: it carries an `spn:doc` block, or it sits in a docs tree or in a
 * workstream's folder. A test report or an application's own `index.html` is neither, so a walk of a whole
 * repository reads past it and names nothing.
 */
function isPageOfOurs(file: string, src: string): boolean {
  const path = slashes(file);
  return /<!--\s*spn:doc\b/.test(src) || hasSegment(path, DOCS) || path.includes(`/${DEVEX_WORKSTREAMS}/`);
}

export const describe = "a figure's own geometry against the page, and what a browser paints of it";

// ---------------------------------------------------------------------------- check | colour

/** The two actions that read a page's own text: `check` judges its drawings, and `colour` its coloured blocks. */
function geometry(sub: "check" | "colour", args: string[]): number {
  const words = readWords(args, { variant: VARIANTS });
  const paths = scopeOf(words.paths, REQUIRED);
  const variants = words.values("variant");
  const workspace = resolveWorkspace();
  // A PATH IS A FILE OR A FOLDER, exactly as it is for `audit`. Given a folder this reads the
  // directory itself rather than dying on EISDIR with a raw stack trace — `figure check
  // <repo>/docs/artifacts` is the only way a whole corpus gets judged in one call. The same walk
  // `audit` uses, so `templates/` is skipped by the rule that already exists.
  const missing: string[] = [];
  const named = paths.flatMap((full) => {
    let st;
    // A PATH THAT IS NOT THERE IS NAMED, never read. Falling through to `readFileSync` turned a typo
    // into a raw ENOENT stack trace, which is the same fault as the folder one wearing a different
    // error code: the tool reporting itself as broken when the argument was.
    try { st = statSync(full); } catch { missing.push(full); return []; }
    return st.isDirectory() ? walkFiles(full, (file) => file.endsWith(".html") || file.endsWith(".md")) : [full];
  });
  // `--variant` narrows the run to the documents whose block declares one of the variants it names.
  const declares = (file: string): boolean => {
    try { return variants.includes(readBlock(readFileSync(file, "utf8")).block?.variant ?? ""); } catch { return false; }
  };
  const files = variants.length ? named.filter(declares) : named;
  for (const gone of missing) console.log(`✗ RULE figure    ${relative(workspace, gone)}\n         no such file or folder`);
  if (!files.length && !missing.length) {
    console.log(variants.length && named.length ? `no page under that path declares the variant ${variants.join(" · ")}` : "no page under that path");
    return 0;
  }
  if (!files.length) return 1;

  if (sub === "check") {
    let total = 0;
    // SOFTS ARE COUNTED APART FROM RULES, and the exit code is a RULE's alone. Nothing this check
    // reports is SOFT today; the split stays because the next soft finding should not have to
    // reinvent the summary line, and a reader of the line can tell a report from a refusal.
    let soft = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      // A DRAWING IS READ BY THE SHARED STYLESHEET'S CLASS NAMES. A page that links no shared
      // stylesheet holds other names, so it is named once, as a RULE, and its drawings are not read.
      // A page of a closed workstream is not named either.
      if (holdsOwnCopy(f, src)) {
        if (isPageOfOurs(f, src) && !inClosedWorkstream(f)) { total += 1; console.log(`✗ RULE styles    ${relative(workspace, f)}\n         ${OWN_COPY}`); }
        continue;
      }
      // A SPEC THAT DRAWS NOTHING IS INVISIBLE TO THE REST OF THIS CHECK, which judges the SVGs a
      // page HAS. Eight foundation seats asked for the retired `flow`; the drawer refuses it, the
      // renderer then emits no figure element at all, and seven of those pages carried no figure
      // while nothing reported a thing. So a seat file is judged on its specs as well: every `dg`
      // block is drawn here, and a block that yields a finding or no drawing is named.
      let n = 0;
      for (const m of src.matchAll(/```dg\n([\s\S]*?)```/g)) {
        n += 1;
        let spec;
        try { spec = JSON.parse(m[1]); }
        catch (e) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         spec${n}: not valid JSON — ${(e as Error).message}`); continue; }
        // A FIGURE SAYS WHAT IT SHOWS, and until now nothing said so. `05-artifacts.md § The
        // figures` has made it a MUST since it was written — *every figure has a sentence before it
        // saying what you are looking at, and a caption after it saying what to notice. A figure
        // with neither is decoration* — and 94 of the corpus's 150 specs carry neither field.
        // ONLY `caption` RENDERS A `<figcaption>`: `render.ts` reads that one field, and `title`
        // reaches the reader as the `aria-label` alone. So a spec carrying just a title satisfies
        // the arc's wording and still leaves the reader with nothing, and it is reported too.
        // IT WAS SOFT FOR ONE SITTING AND THE REASON HAS GONE. Reporting rather than refusing was
        // step 1, so the count could be seen and could fall; step 2 authored all 94, one agent per
        // repository; and every repository reads clean, so a RULE walls nothing off. N14 step 3.
        const said = (k: string) => (typeof spec?.[k] === "string" ? String(spec[k]).trim() : "");
        if (!said("caption")) {
          total += 1;
          const why = said("title")
            ? "carries a `title` and no `caption` — only a `caption` renders a `<figcaption>`, so the reader is still told nothing about what to notice"
            : `carries neither \`title\` nor \`caption\`, so the page renders no \`<figcaption>\` and the figure's \`aria-label\` falls back to \`${said("kind") || "figure"}\` — a screen reader announces the kind word`;
          console.log(`✗ RULE figure    ${relative(workspace, f)}\n         spec${n}: ${why}`);
        }
        let out;
        try { out = draw(spec); }
        catch (e) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         spec${n}: the drawer refused it — ${(e as Error).message}`); continue; }
        for (const d of out.findings) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         spec${n}: ${d}`); }
        if (!out.svg) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         spec${n}: draws nothing, so the page renders no figure at all`); }
      }
      const found = checkFigures(src);
      total += found.length;
      for (const x of found) console.log(`✗ RULE figure    ${relative(workspace, f)}\n         svg${x.figure}: ${x.message}`);
    }
    const all = total + soft;
    console.log(all
      ? `\n${all} figure finding${all > 1 ? "s" : ""} — ${total} RULE, ${soft} SOFT, over ${files.length} page${files.length > 1 ? "s" : ""}`
      : `clean — ${files.length} page${files.length > 1 ? "s" : ""}`);
    return total ? 1 : 0;
  }

  // The audit's half: a coloured block must strip back to what the author wrote.
  let bad = 0;
  let unread = 0;
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    // The colouring is spans that carry the shared stylesheet's class names, so a page that links
    // no shared stylesheet is named once, as a RULE, and its blocks are not read.
    if (holdsOwnCopy(f, src)) {
      if (isPageOfOurs(f, src) && !inClosedWorkstream(f)) { unread += 1; console.log(`✗ RULE styles    ${relative(workspace, f)}\n         ${OWN_COPY}`); }
      continue;
    }
    for (const m of src.matchAll(/<pre data-lang="([a-z]+)">([\s\S]*?)<\/pre>/g)) {
      const round = colour(stripSpans(m[2]), m[1]);
      if (round !== m[2]) { bad++; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         a \`${m[1]}\` block's colouring is not what \`docs figure colour\` produces from its own text`); }
    }
  }
  // A page that was not read is counted apart from a block that is off, and either one is a RULE.
  const summary = [
    ...(bad ? [`${bad} block${bad > 1 ? "s" : ""} off`] : []),
    ...(unread ? [`${unread} page${unread > 1 ? "s" : ""} not read`] : []),
  ];
  console.log(summary.length ? `\n${summary.join(" · ")}` : "every coloured block matches its own text");
  return bad || unread ? 1 : 0;
}

// ---------------------------------------------------------------------------- browser render

/**
 * The line that links the newest version of the shared stylesheet. A drawing that stands alone is
 * wrapped in a page that carries this line, so the browser draws it with the same styles a page
 * gives it. Null where no version is listed.
 */
function stylesheetLine(): string | null {
  const styles = stylesFolder();
  const newest = styles === null ? null : newestVersion(Object.keys(cutVersions(styles)));
  return newest === null ? null : linesFor(newest).stylesheet;
}

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

async function render(args: string[]): Promise<number> {
  const files = scopeOf(readWords(args).paths, REQUIRED);
  const entry = playwrightPath();
  if (!entry) {
    console.log("No browser on this machine, so nothing was rendered — this is not a failure.");
    console.log("The guides seat carries the line: npm install -g playwright && npx playwright install chromium");
    return 0;
  }

  const { chromium } = await import(entry);
  const browser = await chromium.launch();
  let findings = 0;
  const stylesheet = stylesheetLine();
  if (stylesheet === null && files.some((file) => extname(file) === ".svg"))
    console.log("No version of the shared stylesheet is listed, so a bare drawing is rendered with no styling.");
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    // A bare `.svg` is wrapped in a page that links the shared stylesheet; a page is loaded whole,
    // with the stylesheet it links itself.
    const html = extname(file) === ".svg" ? `${stylesheet ?? ""}\n${body}` : body;
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

// ---------------------------------------------------------------------------- draw

/**
 * A HAND-WRITTEN PAGE ASKS THE SAME HELPER a seat file's build step calls on its own: no author
 * places a coordinate either way. A `.json` file is one spec; a `.md` file's own ```` ```dg ```` blocks
 * are drawn in the order they appear, as the page itself would hold them.
 */
function drawSpecs(args: string[]): number {
  const files = scopeOf(readWords(args).paths, REQUIRED);
  const workspace = resolveWorkspace();
  let total = 0;
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const texts = file.endsWith(".md") ? [...src.matchAll(/```dg\n([\s\S]*?)```/g)].map((m) => m[1]) : [src];
    texts.forEach((text, i) => {
      let spec: { caption?: string; [k: string]: unknown };
      try { spec = JSON.parse(text); }
      catch (e) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, file)}\n         spec${i + 1}: not valid JSON — ${(e as Error).message}`); return; }
      const { svg, findings } = draw(spec as Parameters<typeof draw>[0]);
      for (const f of findings) { total += 1; console.log(`✗ RULE figure    ${relative(workspace, file)}\n         spec${i + 1}: ${f}`); }
      if (svg) console.log(`<figure>\n${svg}${spec.caption ? `\n<figcaption>${spec.caption}</figcaption>` : ""}\n</figure>`);
    });
  }
  return total ? 1 : 0;
}

// ---------------------------------------------------------------------------- the actions

export const actions: Record<string, Action> = {
  check: {
    describe: "labels fit and connectors join, and every spec draws: the findings of each page's own drawings",
    usage: "<path…> [--variant <name>]",
    run: (args) => geometry("check", args),
  },
  colour: {
    describe: "a coloured block strips back to the text its author wrote",
    usage: "<path…> [--variant <name>]",
    run: (args) => geometry("colour", args),
  },
  render: {
    describe: "render each figure in a headless browser, and report what it painted",
    usage: "<svg-or-html…>",
    run: render,
  },
  draw: {
    describe: "print the drawing of each spec — a `.json` file, or a `.md` page's own ```dg``` blocks",
    usage: "<spec.json…>",
    run: drawSpecs,
  },
};
