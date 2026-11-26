// The pages of a site category: its layouts, its page kinds (each a run of container recipes in the order the catalogue states), its container
// kinds (each case of each kind) and its widget kinds (each case of each kind).
import { feat, plannedSection, slot, sec } from "./kit.ts";
import { siteLayout } from "./layouts.ts";
import { noteOf, sentence, slugOf, words } from "./notes.ts";
import { siteContainer } from "./site.ts";
import { siteWidget } from "./widgets-site.ts";
import type { Brief } from "./site-words.ts";
import type { CatCase, CatKind, Entry, Page, Tree } from "./types.ts";

export type Folders = { base: string; part: (part: string) => string };

/** The pages that stand in a bare layout, not the category's first one. */
const BARE = new Set(["MAIN_LANDING", "COMMON_MAINTENANCE", "COMMON_SERVER_ERROR"]);
/** Where a category stands its home, a search and a group home in its other layout, where it has two. */
const IN_TOP: Record<string, Set<string>> = { RESOURCES: new Set(["RESOURCES_HOME", "DOCS_HOME", "GUIDE_HOME", "HELP_HOME", "DOCS_SEARCH", "GUIDE_SEARCH", "HELP_SEARCH", "COMMON_NOT_FOUND"]) };

export function layoutFor(category: string, kind: string, layouts: string[]): string {
  if (BARE.has(kind) && layouts.includes("CANVAS")) return "CANVAS";
  if (IN_TOP[category]?.has(kind) && layouts.includes("TOPNAV")) return "TOPNAV";
  return layouts.find((l) => l !== "CANVAS") ?? layouts[0];
}

const generic = (kind: CatKind): Tree => sec([feat({ title: kind.title, description: sentence(kind.description), type: "MEDIA_BOTTOM", mediaNode: slot(`${kind.title}, as the catalogue describes it`, "16:5") })]);

/** One section of a kind in one case: its recipe, or the kind drawn from its description where the language holds none, or the planned mark. */
export function containerEntry(kind: CatKind, one: CatCase | undefined, b: Brief): Entry {
  const planned = kind.status !== "BUILT" || (one !== undefined && one.status !== undefined && one.status !== "BUILT");
  const recipe = planned ? null : siteContainer(kind.code, one?.code ?? "", b);
  const node = recipe ?? (planned ? plannedSection(kind.title, sentence(one?.when ?? kind.description), `${kind.title}${one ? `, ${words(one.code)}` : ""}`) : generic(kind));
  return { kind: kind.title, case: one ? words(one.code) : "", note: planned ? noteOf(kind, one) : recipe ? noteOf(kind, one) : `${noteOf(kind, one)} Drawn from the kind's description.`, node, planned };
}

/** The cases a kind is drawn in: each case it lists, or the kind once where it lists none. */
export const casesOf = (kind: CatKind): Array<CatCase | undefined> => (kind.cases && kind.cases.length ? kind.cases : [undefined]);

export function sitePages(category: string, cat: Record<string, CatKind[]>, b: Brief, folders: Folders, picked: (part: string) => CatKind[]): Page[] {
  const pages: Page[] = [];
  const layouts = picked("LAYOUTS").map((l) => l.code);
  const containers = new Map(picked("CONTAINERS").map((k) => [k.code, k]));
  // LAYOUTS: each layout holding a short page, the kind's cases after it
  picked("LAYOUTS").forEach((k, at) => {
    const base: Entry[] = ["INTRO_HERO", "EXPLAIN_FEATURES", "ACTION_CLOSING", "COMMON_FOOTER"].filter((c) => containers.has(c)).map((c) => {
      const kind = containers.get(c) as CatKind;
      const one = c === "COMMON_FOOTER" ? kind.cases?.find((x) => x.code === (k.code === "TOPNAV" ? "COLUMNS" : "SHORT")) : kind.cases?.[0];
      return containerEntry(kind, one, b);
    });
    const extra: Entry[] = (k.cases ?? []).filter((c) => c.status !== "BUILT").map((c) => ({ kind: k.title, case: words(c.code), note: noteOf(k, c), node: plannedSection(k.title, sentence(c.when), `${k.title}, ${words(c.code)}`), planned: true }));
    pages.push({ file: `${folders.part("LAYOUTS")}/${String(at + 1).padStart(2, "0")}-${slugOf(k.code)}.html`, title: k.title, category, part: "LAYOUTS", kinds: [k.code], entries: [...base, ...extra], ask: sentence(k.description), layout: k.code });
  });
  // PAGES: a page kind is the run of its container kinds in the catalogue's order, then the footer
  picked("PAGES").forEach((k, at) => {
    const order = (k.order ?? []).map((o) => (typeof o === "string" ? { kind: o, case: undefined } : o));
    const layout = layoutFor(category, k.code, layouts);
    const entries: Entry[] = order.map((o) => {
      const kind = containers.get(o.kind) ?? { code: o.kind, title: words(o.kind).replace(/^./, (c) => c.toUpperCase()), description: "", status: "BUILT" };
      return containerEntry(kind, kind.cases?.find((x) => x.code === o.case), b);
    });
    if (!entries.length || k.status !== "BUILT") entries.splice(0, entries.length, { kind: k.title, case: "", note: noteOf(k), node: plannedSection(k.title, sentence(k.description), `${k.title}, as a page`), planned: true });
    else if (!order.some((o) => o.kind === "COMMON_FOOTER") && containers.has("COMMON_FOOTER")) entries.push(containerEntry(containers.get("COMMON_FOOTER") as CatKind, containers.get("COMMON_FOOTER")?.cases?.find((x) => x.code === (layout === "TOPNAV" ? "COLUMNS" : "SHORT")), b));
    // a kind's own cases are further pages of the same kind, each its own order where it states one
    pages.push({ file: `${folders.part("PAGES")}/${String(at + 1).padStart(2, "0")}-${slugOf(k.code)}.html`, title: k.title, category, part: "PAGES", kinds: [k.code], entries, ask: sentence(k.description), layout });
  });
  // CONTAINERS: a page for each kind, one section for each case
  picked("CONTAINERS").forEach((k, at) => {
    pages.push({ file: `${folders.part("CONTAINERS")}/${String(at + 1).padStart(2, "0")}-${slugOf(k.code)}.html`, title: k.title, category, part: "CONTAINERS", kinds: [k.code], entries: casesOf(k).map((c) => containerEntry(k, c, b)), ask: sentence(k.description), layout: layouts.includes("TOPNAV") ? "TOPNAV" : layouts[0] });
  });
  // WIDGETS: a page for each kind, one section for each case, each in a real section that uses it
  picked("WIDGETS").forEach((k, at) => {
    const entries = casesOf(k).map((one): Entry => {
      const planned = k.status !== "BUILT" || (one !== undefined && one.status !== undefined && one.status !== "BUILT");
      const node = planned ? null : siteWidget(k.code, one?.code ?? "", b);
      return { kind: k.title, case: one ? words(one.code) : "", note: node ? noteOf(k, one) : planned ? noteOf(k, one) : `${noteOf(k, one)} Drawn from the kind's description.`, node: node ?? (planned ? plannedSection(k.title, sentence(one?.when ?? k.description), `${k.title}${one ? `, ${words(one.code)}` : ""}`) : generic(k)), planned };
    });
    pages.push({ file: `${folders.part("WIDGETS")}/${String(at + 1).padStart(2, "0")}-${slugOf(k.code)}.html`, title: k.title, category, part: "WIDGETS", kinds: [k.code], entries, ask: sentence(k.description), layout: layouts.includes("TOPNAV") ? "TOPNAV" : layouts[0] });
  });
  return pages;
}

export const wrapSite = (b: Brief, page: Page, children: Tree[]): Tree => siteLayout(b, page.layout, children, b.nav[0][1]);
