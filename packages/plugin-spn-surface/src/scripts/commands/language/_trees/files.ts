// The files of a samples home: each page in the surface page template, the samples.json index and the home's index.html.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { Device, Mode } from "./render.ts";
import type { Page } from "./types.ts";

const esc = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (file: string): string => file.replace(/\.html$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

/** Where a language's asset is, by the language's name and the path in its assets/: the resolver's answer, or null where it is not there. */
export type AssetFile = (language: string, path: string) => string | null;
export type PageOptions = { template: string; ds: string; appCss: string; assets: string | null; out: string; assetFile?: AssetFile; log?: (line: string) => void };

/** One whole screen as drawn: its case's code and title, its markup for each mode and device, and its notes. */
export type DrawnCase = { code: string; title: string; html: Record<Mode, Record<Device, string>>; notes: Array<{ n: number; kind: string; case: string; text: string }> };

/** A case's code as the page's script reads it in a template's id and an address: letters, digits and underscores. */
export const caseKey = (code: string): string => code.replace(/[^A-Za-z0-9_]/g, "_");

/** The markup of one page for each mode and device, as the templates the page script reads: the light desktop always, and each other copy
 * only where it differs, because the script falls back to the nearest copy and restyles it. */
export function templatesOf(html: Record<Mode, Record<Device, string>>, prefix = ""): string {
  const base = html.LIGHT.DESKTOP;
  const out: string[] = [`<template id="page-${prefix}LIGHT-DESKTOP">\n${base}\n</template>`];
  for (const device of ["DESKTOP", "TABLET", "PHONE"] as const) {
    const light = html.LIGHT[device];
    const dark = html.DARK[device];
    const wantLight = device !== "DESKTOP" && light !== base;
    const wantDark = dark !== light;
    if (wantLight) out.push(`<template id="page-${prefix}LIGHT-${device}">\n${light}\n</template>`);
    if (wantDark) out.push(`<template id="page-${prefix}DARK-${device}">\n${dark}\n</template>`);
  }
  return out.join("\n");
}

/**
 * Each `src="asset:<language>/<path>"` the render wrote, made a file beside the page (RULE.SUPPORT.SURFACE.644): the language's file is
 * copied into the home's `assets/<language>/<path>`, and the src is written relative to the page. A file the resolver does not find is
 * left as the render wrote it, and said.
 */
export function placeAssets(markup: string, here: string, opts: PageOptions): string {
  return markup.replace(/(src|href)="asset:([a-z][a-z0-9-]*)\/([^"]+)"/g, (whole, attribute: string, language: string, path: string) => {
    const from = opts.assetFile ? opts.assetFile(language, path) : null;
    if (!from || !existsSync(from)) { opts.log?.(`asset not found: ${language}/${path}`); return whole; }
    const to = join(opts.out, "assets", language, path);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    return `${attribute}="${relative(dirname(here), to).split("\\").join("/")}"`;
  });
}

/** The Case switch of a page with cases, the default first; a page with one screen has none. */
function caseSwitch(cases: DrawnCase[]): string {
  if (cases.length < 2) return "";
  const buttons = cases.map((one) => `      <button type="button" role="tab" data-surface="case" data-value="${caseKey(one.code)}">${esc(one.title)}</button>`).join("\n");
  return `<div class="sds-surface-switch sds-surface-cases" role="tablist" aria-label="Case">\n${buttons}\n    </div>`;
}

/** One page: the template with its name, its metas, its Case switch, its notes and its markup, one set of templates for each case. */
export function pageHtml(page: Page, cases: DrawnCase[], opts: PageOptions): string {
  const first = opts.template.indexOf("<template id=\"page-LIGHT-DESKTOP\">");
  const closing = opts.template.lastIndexOf("</template>") + "</template>".length;
  if (first < 0 || closing < first) throw new Error("the surface page template holds no `<template id=\"page-<MODE>-<DEVICE>\">`.");
  if (!cases.length) throw new Error(`${page.file}: the page holds no screen to draw.`);
  const here = join(opts.out, page.file);
  const templates = cases.map((one, at) => templatesOf(one.html, at === 0 ? "" : `${caseKey(one.code)}-`)).join("\n");
  const notes = cases.length > 1 ? Object.fromEntries(cases.map((one) => [caseKey(one.code), one.notes])) : cases[0].notes;
  let text = opts.template.slice(0, first) + placeAssets(templates, here, opts) + opts.template.slice(closing);
  text = text.replace(/^(?:\s*<!--[\s\S]*?-->)+\s*/, "");
  text = text.replace(/<meta name="surface-ds" content="[^"]*">/, () => `<meta name="surface-ds" content="${esc(opts.ds)}">`)
    .replace(/<meta name="surface-app-css" content="[^"]*">/, () => `<meta name="surface-app-css" content="${esc(opts.appCss)}">`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(page.title)}</title>`)
    .replace(/(<!-- spn:doc\n)[\s\S]*?(\n-->)/, (_m, a: string, b: string) => `${a}${JSON.stringify({ id: `surface-sample-${slug(page.file)}`, variant: "surface-page", title: page.title })}${b}`)
    .replace(/<h1 class="sds-surface-title">[\s\S]*?<\/h1>/, () => `<h1 class="sds-surface-title">${esc(page.title)}</h1>`)
    .replace(/[ \t]*<div class="sds-surface-switch sds-surface-cases"[\s\S]*?<\/div>\n?/, () => { const sw = caseSwitch(cases); return sw ? `    ${sw}\n` : ""; })
    .replace(/<iframe class="sds-surface-frame" title="[^"]*">/, () => `<iframe class="sds-surface-frame" title="${esc(page.title)}">`)
    .replace(/(<script type="application\/json" id="sample-notes">\n)[\s\S]*?(\n<\/script>)/, (_m, a: string, b: string) => `${a}${JSON.stringify(notes, null, 1)}${b}`);
  if (opts.assets) {
    const base = `${relative(dirname(here), opts.assets).split("\\").join("/")}/`;
    text = text.replace(/<link rel="stylesheet" href="[^"]*docs-language\.css"[^>]*>/, () => `<link rel="stylesheet" href="${base}docs-language.css">`)
      .replace(/<script src="[^"]*docs-page\.js"[^>]*><\/script>/, () => `<script src="${base}docs-page.js"></script>`);
  }
  if (/\{\{[^}]*\}\}/.test(text.replace(/<template[\s\S]*?<\/template>/g, ""))) throw new Error(`${page.file}: the page still holds a placeholder ${JSON.stringify(text.replace(/<template[\s\S]*?<\/template>/g, "").match(/\{\{[^}]*\}\}/g))}.`);
  return text;
}

type Node = { label: string; title?: string; kind?: string; path?: string; children?: Node[] };

/** The sidebar of the index: the folders of the samples, each named by the catalogue's own title. */
export function treeOf(pages: Array<{ file: string; title: string; label: string }>, titleOf: (segment: string) => string): Node[] {
  const roots: Node[] = [];
  for (const page of pages) {
    const segments = page.file.split("/");
    let level = roots;
    for (const segment of segments.slice(0, -1)) {
      let found = level.find((node) => node.label === titleOf(segment) && node.children);
      if (!found) { found = { label: titleOf(segment), children: [] }; level.push(found); }
      level = found.children as Node[];
    }
    level.push({ label: page.title, title: page.label, kind: "guide", path: page.file });
  }
  return roots;
}

/** The home: the index template's shell with the tree written into its data block. */
export function indexHtml(shell: string, name: string, place: string, summary: string, tree: Node[], base: string, assets: string | null, out: string): string {
  let text = shell.replace(/\{\{NAME\}\}/g, esc(name)).replace(/\{\{PLACE\}\}/g, esc(place)).replace(/\{\{SUMMARY\}\}/g, esc(summary)).replace(/\{\{SLUG\}\}/g, slug(`${name}-samples`));
  text = text.replace("{{DATA}}", JSON.stringify({ base, groups: tree }, null, 1));
  if (assets) {
    const prefix = `${relative(out, assets).split("\\").join("/")}/`;
    text = text.replace(/<link rel="stylesheet" href="[^"]*docs-language\.css"[^>]*>/, () => `<link rel="stylesheet" href="${prefix}docs-language.css">`)
      .replace(/<script src="[^"]*docs-index\.js"[^>]*><\/script>/, () => `<script src="${prefix}docs-index.js"></script>`);
  }
  return text;
}
