// What the samples command does, apart from how it is typed: read the language's spec and the catalogue, make each category's pages, find
// what the design system does not build and draw it as planned, draw every page, and write the pages, the index data and the home.
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { appPages } from "./draw-app.ts";
import { type Folders, sitePages, wrapSite } from "./draw-site.ts";
import { categoryValuePages, sharedPages } from "./values.ts";
import { type PageOptions, indexHtml, pageHtml, treeOf } from "./files.ts";
import { plannedPanel, plannedSection, setDs } from "./kit.ts";
import { appLayout } from "./layouts.ts";
import { slugOf } from "./notes.ts";
import { DEVICES, type Device, type Drawn, MODES, type Mode, drawSections } from "./render.ts";
import { BRIEFS } from "./site-words.ts";
import type { CatKind, Entry, Page, Tree } from "./types.ts";
import { APP_WORDS } from "./app-words.ts";

export type OutlinePart = { code: string; title: string; description: string; values?: { ALL?: string[] } };
export type Catalogue = { version: string; outline: { groups?: Array<{ code: string; parts: OutlinePart[] }>; categories: Record<string, { family: string; person: string; description: string }> }; categories: Record<string, Record<string, CatKind[]>> };
export type PartSetting = { source?: string; pick?: string | string[]; notUsed?: unknown[]; add?: unknown[] };
export type Spec = { name: string; shared?: Record<string, Record<string, unknown>>; categories: Record<string, Record<string, PartSetting>> };
export type Options = { indexShell: string; language: string; catalogue: Catalogue; spec: Spec; out: string; template: string; ds: string; app: string; assets: string | null; place: string; only: string | null; log: (line: string) => void };

const PARTS = ["LAYOUTS", "PAGES", "CONTAINERS", "WIDGETS"] as const;
const ALL_PARTS = [...PARTS, "THEME", "MEDIA", "MOTION", "WORDS", "BRAND", "DRAWING", "VOICE"];
const TITLES: Record<string, string> = { site: "Site", app: "App", shared: "Shared" };
const num = (n: number): string => String(n).padStart(2, "0");

/** The kinds of a part a language takes: all, or the codes it picks, less those it does not use, and the kinds it adds built from units. */
export function pickKinds(catalogue: Catalogue, spec: Spec, category: string, part: string): CatKind[] {
  const all = catalogue.categories[category]?.[part] ?? [];
  const setting = spec.categories[category]?.[part] ?? {};
  const picked = setting.pick === undefined || setting.pick === "ALL" ? all : all.filter((kind) => (setting.pick as string[]).includes(kind.code));
  const out = new Set((setting.notUsed ?? []).map((one) => (typeof one === "string" ? one : (one as { code?: string }).code)));
  const added = (setting.add ?? []).filter((one): one is CatKind => typeof one === "object" && one !== null && "code" in (one as object) && "title" in (one as object));
  return [...picked.filter((kind) => !out.has(kind.code)), ...added.map((kind) => ({ status: "BUILT", description: "", ...kind }))];
}

/** The categories the language serves, in the catalogue's order, each with its family's folder. */
export function categoriesOf(catalogue: Catalogue, spec: Spec): Array<{ code: string; family: string; folder: string }> {
  const served = Object.keys(catalogue.outline.categories).filter((code) => spec.categories[code]);
  const seen: Record<string, number> = {};
  return served.map((code) => {
    const family = catalogue.outline.categories[code].family === "APP" ? "app" : "site";
    seen[family] = (seen[family] ?? 0) + 1;
    return { code, family, folder: `${family === "site" ? "02-site" : "03-app"}/${num(seen[family])}-${code.toLowerCase()}` };
  });
}

/** Every page of the language, before any is drawn. */
export function pagesOf(options: Options): Array<Page & { family: string }> {
  const { catalogue, spec } = options;
  const out: Array<Page & { family: string }> = [];
  const outline = (catalogue.outline.groups ?? []).flatMap((group) => group.parts);
  const sharedParts = (catalogue.outline.groups ?? []).find((group) => group.code === "SHARED")?.parts ?? [];
  const titles: Record<string, string> = {};
  for (const part of outline) { titles[part.code] = part.title; titles[`${part.code}-ask`] = part.description; }
  for (const page of sharedPages(sharedParts, spec.shared)) out.push({ ...page, family: "site" });
  for (const { code, family, folder } of categoriesOf(catalogue, spec)) {
    const folders: Folders = { base: folder, part: (part) => `${folder}/${num(PARTS.indexOf(part as (typeof PARTS)[number]) + 1)}-${part.toLowerCase()}` };
    const picked = (part: string): CatKind[] => pickKinds(catalogue, spec, code, part);
    const pages = family === "site" ? sitePages(code, catalogue.categories[code], BRIEFS[code] ?? BRIEFS.MARKETING, folders, picked) : appPages(code, folders, picked);
    for (const page of [...pages, ...categoryValuePages(code, folder, catalogue.categories[code], spec.categories[code] as never, titles)]) out.push({ ...page, family });
  }
  return options.only ? out.filter((page) => page.file.includes(options.only as string)) : out;
}

const wrapperOf = (page: Page & { family: string }, children: Tree[]): Tree =>
  page.family === "site" ? wrapSite(BRIEFS[page.category] ?? BRIEFS.MARKETING, page, children) : appLayout(APP_WORDS[page.category] ?? APP_WORDS.DASHBOARD, page.layout, children);

/** Draw the entries the design system cannot draw as the planned mark, and say which unit each needs. */
function probe(pages: Array<Page & { family: string }>, options: Options): number {
  const spots: Array<{ entry: Entry; page: Page & { family: string } }> = [];
  const sections: Tree[] = [];
  for (const page of pages) for (const entry of page.entries) {
    if (entry.planned) continue;
    spots.push({ entry, page });
    sections.push(wrapperOf(page, [entry.node]));
  }
  let planned = 0;
  const CHUNK = 60;
  for (let from = 0; from < sections.length; from += CHUNK) {
    options.log(`probing sections ${from + 1} to ${Math.min(from + CHUNK, sections.length)} of ${sections.length}`);
    const part = sections.slice(from, from + CHUNK);
    const drawn = drawSections(part, options.app, options.ds, ["LIGHT"], ["DESKTOP"], true);
    const units = new Map<number, Set<string>>();
    for (const finding of drawn.findings) units.set(finding.section, (units.get(finding.section) ?? new Set()).add(finding.unit));
    for (const [at, set] of units) {
      const { entry, page } = spots[from + at];
      const need = [...set].join(", ");
      entry.note = `Planned: needs ${need}, which the design system has not built.`;
      entry.planned = true;
      entry.node = page.family === "site" ? plannedSection(entry.kind, `${entry.kind}${entry.case ? `, ${entry.case}` : ""}: a section a visitor would meet, drawn once the unit is built.`, `${entry.kind}${entry.case ? `, ${entry.case}` : ""}`) : plannedPanel(entry.kind, `${entry.kind}${entry.case ? `, ${entry.case}` : ""}`);
      planned += 1;
      options.log(`planned ${page.file} · ${entry.kind} ${entry.case} (${need})`);
    }
  }
  return planned;
}

/** The segment of a path in words: `02-site` is Site, `01-marketing` is Marketing, `03-containers` is Containers. */
export const titleOf = (segment: string): string => {
  const name = segment.replace(/^\d+-/, "").replace(/\.html$/, "");
  return TITLES[name] ?? name.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export function run(options: Options): { pages: number; entries: number; planned: number; byCategory: Record<string, Record<string, number>>; files: string[] } {
  setDs(options.ds);
  const pages = pagesOf(options);
  const name = options.spec.name.charAt(0).toUpperCase() + options.spec.name.slice(1);
  if (!pages.length) throw new Error("the language serves no page the catalogue draws.");
  probe(pages, options);
  const planned = pages.reduce((sum, page) => sum + page.entries.filter((entry) => entry.planned).length, 0);
  const pageOptions: PageOptions = { template: options.template, ds: options.ds, appCss: "", assets: options.assets, out: options.out };
  const written: string[] = [];
  const CHUNK = 12;
  for (let from = 0; from < pages.length; from += CHUNK) {
    const batch = pages.slice(from, from + CHUNK);
    const drawn: Drawn = drawSections(batch.map((page) => wrapperOf(page, page.entries.map((entry) => entry.node))), options.app, options.ds);
    if (drawn.findings.length) throw new Error(`the render has findings after planned units were set aside: ${JSON.stringify(drawn.findings.slice(0, 3))}`);
    batch.forEach((page, at) => {
      const html = {} as Record<Mode, Record<Device, string>>;
      for (const mode of MODES) { html[mode] = {} as Record<Device, string>; for (const device of DEVICES) html[mode][device] = drawn.html[mode][device][at]; }
      const notes = page.entries.map((entry, n) => ({ n, kind: entry.kind, case: entry.case, text: entry.note }));
      const file = join(options.out, page.file);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, pageHtml(page, notes, html, pageOptions));
      written.push(page.file);
      options.log(`wrote ${page.file}`);
    });
  }
  // the index data and the home
  const label = (page: Page): string => `${titleOf(page.category.toLowerCase())} · ${titleOf(page.part.toLowerCase())} · ${page.title}`;
  const samples = pages.map((page) => ({ file: page.file, label: label(page), category: page.category, part: page.part, kinds: page.kinds, ask: page.ask }));
  const dataFile = join(options.out, "samples.json");
  if (existsSync(dataFile)) {
    // a page an earlier run listed and this run no longer draws is taken away, so no stale page stands beside the new ones
    try {
      const old = JSON.parse(readFileSync(dataFile, "utf8")) as { samples?: Array<{ file: string; category?: string | null; part?: string }> };
      const drawn = new Set(categoriesOf(options.catalogue, options.spec).map((c) => c.code));
      for (const entry of old.samples ?? []) if (entry.category && (drawn.has(entry.category) || entry.category === "SHARED") && ALL_PARTS.includes(entry.part as string) && !written.includes(entry.file) && !options.only) {
        try { unlinkSync(join(options.out, entry.file)); } catch { /* already gone */ }
      }
    } catch { /* an index that cannot be read is written again */ }
  }
  writeFileSync(dataFile, `${JSON.stringify({ language: options.language, name, home: "index.html", samples }, null, 1)}\n`);
  const tree = treeOf(pages.map((page) => ({ file: page.file, title: page.title, label: label(page) })), titleOf);
  writeFileSync(join(options.out, "index.html"), indexHtml(options.indexShell, name, options.place, `One sample for each layout, page kind, container case and widget form of ${name}'s catalogue: each category in turn.`, tree, "", options.assets, options.out));
  const byCategory: Record<string, Record<string, number>> = {};
  for (const page of pages) { const cat = (byCategory[page.category] ??= {}); cat[page.part] = (cat[page.part] ?? 0) + 1; }
  return { pages: pages.length, entries: pages.reduce((sum, page) => sum + page.entries.length, 0), planned, byCategory, files: written };
}
export { basename, slugOf };
