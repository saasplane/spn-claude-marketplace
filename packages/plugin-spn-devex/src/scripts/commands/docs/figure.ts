#!/usr/bin/env node
// RESTATES: `docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md` § The figures, and
// `docs/05-guides/README.md` § Before step 1 — your machine, which names the browser this needs.
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Two halves under one action: the geometry check reads a spec and the SVG it draws to; the browser
// render answers what a real layout paints. `check`/`colour` in `args[0]` pick the first; any other
// `args[0]` is a path, and the whole list renders.
//
//   spn-devex docs figure check <path…>    labels fit and connectors join · a block's colouring matches its text
//   spn-devex docs figure colour <path…>   the audit's half: a coloured block strips back to what the author wrote
//   spn-devex docs figure <svg-or-html…>   render each in a headless browser and report what it painted
//
// THE BROWSER IS OPTIONAL AND THIS SAYS SO RATHER THAN FAILING, on a machine carrying no global
// `playwright` install (the guides seat carries the line to add one).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { checkFigures, colour, stripSpans } from "../../lib/figures.ts";
import { draw } from "../../lib/draw.ts";
import { argsText, begin, commandFacts, end, record } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { resolveWorkspace, walkFiles } from "./_lib.ts";

export const describe = "figure check|colour: a spec's own geometry against the page · figure <path…>: what a browser paints";

// ---------------------------------------------------------------------------- check | colour

function geometryCli(sub: string, args: string[], workspace: string): number {
  // A PATH IS A FILE OR A FOLDER, exactly as it is for `audit`. Given a folder this reads the
  // directory itself rather than dying on EISDIR with a raw stack trace — `figure check
  // <repo>/docs/artifacts` is the only way a whole corpus gets judged in one call. The same walk
  // `audit` uses, so `templates/` is skipped by the rule that already exists.
  const missing: string[] = [];
  const files = args.filter((a) => !a.startsWith("--")).flatMap((p) => {
    const full = resolve(p);
    let st;
    // A PATH THAT IS NOT THERE IS NAMED, never read. Falling through to `readFileSync` turned a typo
    // into a raw ENOENT stack trace, which is the same fault as the folder one wearing a different
    // error code: the tool reporting itself as broken when the argument was.
    try { st = statSync(full); } catch { missing.push(full); return []; }
    return st.isDirectory() ? walkFiles(full, (f) => f.endsWith(".html") || f.endsWith(".md")) : [full];
  });
  for (const m of missing) console.log(`✗ RULE figure    ${relative(workspace, m)}\n         no such file or folder`);
  if (!files.length && !missing.length) { console.log("no page under that path"); return 0; }
  if (!files.length) return 1;

  if (sub === "check") {
    let total = 0;
    // SOFTS ARE COUNTED APART FROM RULES, and the exit code is a RULE's alone. Nothing this check
    // reports is SOFT today; the split stays because the next soft finding should not have to
    // reinvent the summary line, and a reader of the line can tell a report from a refusal.
    let soft = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
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

  if (sub === "colour") {
    // The audit's half: a coloured block must strip back to what the author wrote.
    let bad = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<pre data-lang="([a-z]+)">([\s\S]*?)<\/pre>/g)) {
        const round = colour(stripSpans(m[2]), m[1]);
        if (round !== m[2]) { bad++; console.log(`✗ RULE figure    ${relative(workspace, f)}\n         a \`${m[1]}\` block's colouring is not what \`figures colour\` produces from its own text`); }
      }
    }
    console.log(bad ? `\n${bad} block${bad > 1 ? "s" : ""} off` : "every coloured block matches its own text");
    return bad ? 1 : 0;
  }

  console.error("usage: spn-devex docs figure check|colour <path…>");
  return 2;
}

// ---------------------------------------------------------------------------- browser render

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

async function renderCli(files: string[]): Promise<number> {
  if (!files.length) {
    console.log("usage: spn-devex docs figure <svg-or-html> [...]");
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

// ---------------------------------------------------------------------------- dispatch

export async function run(args: string[]): Promise<number> {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts("spn-devex", args), workspace);
  const [sub, ...rest] = args;
  const code = sub === "check" || sub === "colour"
    ? geometryCli(sub, rest, workspace)
    : await renderCli(args.filter((a) => !a.startsWith("-")));
  record({ group: "docs", action: "figure", args: argsText(args) }, performance.now() - startedAt, code);
  end(code);
  return code;
}

if (process.argv[1] && basename(process.argv[1]) === "figure.ts")
  process.exit(await run(process.argv.slice(2)));
