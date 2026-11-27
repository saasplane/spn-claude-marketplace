// The pages of a site category, in the samples home's shape (RULE.SUPPORT.SURFACE.643): its layouts as one page of tabs, its page kinds in a
// folder for each family (each a run of container recipes in the order the catalogue states, its cases on the Case switch), and its container and
// widget kinds as a page for each family, every kind and case drawn at once.
import { feat, plannedSection, slot, sec } from "./kit.ts";
import { siteLayout } from "./layouts.ts";
import { noteOf, sentence, words } from "./notes.ts";
import { setPage, siteContainer } from "./site.ts";
import { siteWidget } from "./widgets-site.ts";
import type { Brief } from "./words.ts";
import { commonPagesFile, familiesOf, familyFile, familyTitle, headingEntry, pageKindFile, pageWithCases, partPath, siteHeading, titleInFamily } from "./home.ts";
import type { CatCase, CatKind, Entry, Page, PageCase, Tree } from "./types.ts";

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
  void cat;
  const pages: Page[] = [];
  const layouts = picked("LAYOUTS").map((l) => l.code);
  const containers = new Map(picked("CONTAINERS").map((k) => [k.code, k]));
  const usual = layouts.includes("TOPNAV") ? "TOPNAV" : layouts[0];
  // LAYOUTS: one page, a tab for each layout holding a short page, and a tab for each of its cases
  const layoutCases: PageCase[] = [];
  for (const k of picked("LAYOUTS")) {
    const base: Entry[] = ["INTRO_HERO", "EXPLAIN_FEATURES", "ACTION_CLOSING", "COMMON_FOOTER"].filter((c) => containers.has(c)).map((c) => {
      const kind = containers.get(c) as CatKind;
      const one = c === "COMMON_FOOTER" ? kind.cases?.find((x) => x.code === (k.code === "TOPNAV" ? "COLUMNS" : "SHORT")) : kind.cases?.[0];
      return containerEntry(kind, one, b);
    });
    layoutCases.push({ code: k.code, title: k.title, entries: base, layout: k.code });
    for (const c of k.cases ?? []) {
      const planned = c.status !== undefined && c.status !== "BUILT";
      layoutCases.push({
        code: `${k.code}.${c.code}`,
        title: `${k.title}, ${words(c.code)}`,
        entries: planned ? [{ kind: k.title, case: words(c.code), note: noteOf(k, c), node: plannedSection(k.title, sentence(c.when), `${k.title}, ${words(c.code)}`), planned: true }] : base,
        layout: k.code,
      });
    }
  }
  if (layoutCases.length) pages.push(pageWithCases({ file: `${partPath(folders.base, "LAYOUTS")}.html`, title: "Layouts", category, part: "LAYOUTS", kinds: layouts, ask: "Which frame does each page of this category stand in?" }, layoutCases));
  // PAGES: a page kind is the run of its container kinds in the catalogue's order, then the footer; a case may state its own order
  const screen = (k: CatKind, one: CatCase | undefined): PageCase => {
    const order = (one?.order ?? k.order ?? []).map((o) => (typeof o === "string" ? { kind: o, case: undefined } : o));
    const layout = layoutFor(category, k.code, layouts);
    setPage(k.code);
    const entries: Entry[] = order.map((o) => {
      const kind = containers.get(o.kind) ?? { code: o.kind, title: words(o.kind).replace(/^./, (c) => c.toUpperCase()), description: "", status: "BUILT" };
      return containerEntry(kind, kind.cases?.find((x) => x.code === o.case), b);
    });
    setPage("");
    if (!entries.length || k.status !== "BUILT") entries.splice(0, entries.length, { kind: k.title, case: "", note: noteOf(k), node: plannedSection(k.title, sentence(k.description), `${k.title}, as a page`), planned: true });
    else if (!order.some((o) => o.kind === "COMMON_FOOTER") && containers.has("COMMON_FOOTER")) entries.push(containerEntry(containers.get("COMMON_FOOTER") as CatKind, containers.get("COMMON_FOOTER")?.cases?.find((x) => x.code === (layout === "TOPNAV" ? "COLUMNS" : "SHORT")), b));
    return { code: one ? one.code : "DEFAULT", title: one ? words(one.code).replace(/^./, (c) => c.toUpperCase()) : "Default", entries, layout };
  };
  const families = familiesOf(picked("PAGES"));
  let folderAt = 0;
  for (const { family, kinds } of families) {
    folderAt += 1;
    if (family === "COMMON") {
      const tabs = kinds.map((k) => ({ ...screen(k, undefined), code: k.code, title: titleInFamily(k) }));
      pages.push(pageWithCases({ file: commonPagesFile(folders.base, folderAt), title: "Common", category, part: "PAGES", kinds: kinds.map((k) => k.code), ask: "What does a visitor meet when a page is a policy, missing, broken or down?" }, tabs));
      continue;
    }
    kinds.forEach((k, at) => {
      const tabs = [screen(k, undefined), ...(k.cases ?? []).map((one) => screen(k, one))];
      pages.push(pageWithCases({ file: pageKindFile(folders.base, folderAt, family, at + 1, titleInFamily(k)), title: titleInFamily(k), category, part: "PAGES", kinds: [k.code], ask: sentence(k.description) }, tabs));
    });
  }
  // CONTAINERS: a page for each family, every kind and every case drawn at once, each under its own heading
  familiesOf(picked("CONTAINERS")).forEach(({ family, kinds }, at) => {
    const entries: Entry[] = [];
    for (const k of kinds) for (const one of casesOf(k)) {
      entries.push(headingEntry(`${k.title}${one ? ` · ${words(one.code)}` : ""}`, siteHeading(`${k.title}${one ? ` · ${words(one.code)}` : ""}`)));
      entries.push(containerEntry(k, one, b));
    }
    pages.push({ file: familyFile(folders.base, "CONTAINERS", at + 1, family), title: familyTitle(family), category, part: "CONTAINERS", kinds: kinds.map((k) => k.code), entries, ask: `The ${familyTitle(family).toLowerCase()} sections, every kind and case at once.`, layout: usual });
  });
  // WIDGETS: a page for each family, every kind and case at once, each in a real section that uses it
  familiesOf(picked("WIDGETS")).forEach(({ family, kinds }, at) => {
    const entries: Entry[] = [];
    for (const k of kinds) for (const one of casesOf(k)) {
      const planned = k.status !== "BUILT" || (one !== undefined && one.status !== undefined && one.status !== "BUILT");
      const node = planned ? null : siteWidget(k.code, one?.code ?? "", b);
      const label = `${k.title}${one ? ` · ${words(one.code)}` : ""}`;
      entries.push(headingEntry(label, siteHeading(label)));
      entries.push({ kind: k.title, case: one ? words(one.code) : "", note: node ? noteOf(k, one) : planned ? noteOf(k, one) : `${noteOf(k, one)} Drawn from the kind's description.`, node: node ?? (planned ? plannedSection(k.title, sentence(one?.when ?? k.description), label) : generic(k)), planned });
    }
    pages.push({ file: familyFile(folders.base, "WIDGETS", at + 1, family), title: familyTitle(family), category, part: "WIDGETS", kinds: kinds.map((k) => k.code), entries, ask: `The ${familyTitle(family).toLowerCase()} widgets, every kind and case at once, each in its home section.`, layout: usual });
  });
  return pages;
}

export const wrapSite = (b: Brief, page: Page, children: Tree[]): Tree => siteLayout(b, page.layout, children, b.nav[0][1]);
