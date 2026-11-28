// The pages of an app category, in the samples home's shape (RULE.SUPPORT.SURFACE.643): its layouts as one page of tabs, its page kinds in a
// folder for each family with each kind's cases on the Case switch, and its container and widget kinds as a page for each family, every kind
// and case drawn at once, all with the words of the category's sample product.
import { type W, WORDS, appContainer, appPage, appWidget, layoutBody } from "./app.ts";
import type { Folders } from "./draw-site.ts";
import { plannedPanel } from "./kit.ts";
import { noteOf, sentence, words } from "./notes.ts";
import { appHeading, commonPagesFile, familiesOf, familyFile, familyTitle, headingEntry, pageKindFile, pageWithCases, partPath, titleInFamily } from "./home.ts";
import type { CatCase, CatKind, Entry, Page, PageCase, Tree } from "./types.ts";
import { col } from "./kit.ts";

const OWN: Record<string, string> = { DASHBOARD: "RAIL", PORTAL: "TOPNAV" };
const plannedEntry = (kind: CatKind, one?: CatCase): Entry => ({ kind: kind.title, case: one ? words(one.code) : "", note: noteOf(kind, one), node: plannedPanel(kind.title, `${kind.title}${one ? `, ${words(one.code)}` : ""}`), planned: true });
const isPlanned = (kind: CatKind, one?: CatCase): boolean => kind.status !== "BUILT" || (one !== undefined && one.status !== undefined && one.status !== "BUILT");
const one = (nodes: Tree[]): Tree => (nodes.length === 1 ? nodes[0] : col(nodes, "LG"));

export function appPages(category: string, folders: Folders, picked: (part: string) => CatKind[]): Page[] {
  const w: W = WORDS[category] ?? WORDS.DASHBOARD;
  const pages: Page[] = [];
  const layouts = picked("LAYOUTS").map((l) => l.code);
  const own = layouts.includes(OWN[category]) ? OWN[category] : layouts[0];
  // LAYOUTS: one page, a tab for each layout and each of its cases
  const layoutCases: PageCase[] = [];
  for (const k of picked("LAYOUTS")) {
    layoutCases.push({ code: k.code, title: k.title, entries: [{ kind: k.title, case: "", note: noteOf(k), node: one(layoutBody(w)), planned: false }], layout: k.code });
    for (const c of k.cases ?? []) {
      layoutCases.push({ code: `${k.code}.${c.code}`, title: `${k.title}, ${words(c.code)}`, entries: [isPlanned(k, c) ? plannedEntry(k, c) : { kind: k.title, case: words(c.code), note: noteOf(k, c), node: one(layoutBody(w)), planned: false }], layout: k.code });
    }
  }
  if (layoutCases.length) pages.push(pageWithCases({ file: `${partPath(folders.base, "LAYOUTS")}.html`, title: "Layouts", category, part: "LAYOUTS", kinds: layouts, ask: "Which frame does each page of this category stand in?" }, layoutCases));
  // PAGES: a folder for each family, a page for each kind with its cases on the Case switch; Common one page of tabs
  const screen = (k: CatKind, c: CatCase | undefined): PageCase => {
    const planned = isPlanned(k, c);
    const drawn = planned ? null : appPage(k.code, c?.code ?? "", w);
    const entry: Entry = drawn && !drawn.planned ? { kind: k.title, case: c ? words(c.code) : "", note: noteOf(k, c), node: one(drawn.children), planned: false } : plannedEntry(k, c);
    return { code: c ? c.code : "DEFAULT", title: c ? words(c.code).replace(/^./, (x) => x.toUpperCase()) : "Default", entries: [entry], layout: drawn?.layout && layouts.includes(drawn.layout) ? drawn.layout : own };
  };
  let folderAt = 0;
  for (const { family, kinds } of familiesOf(picked("PAGES"))) {
    folderAt += 1;
    if (family === "COMMON") {
      const tabs = kinds.map((k) => ({ ...screen(k, undefined), code: k.code, title: titleInFamily(k) }));
      pages.push(pageWithCases({ file: commonPagesFile(folders.base, folderAt), title: "Common", category, part: "PAGES", kinds: kinds.map((k) => k.code), ask: "What does a person meet when a page is missing, closed to them, broken, down or locked?" }, tabs));
      continue;
    }
    kinds.forEach((k, at) => {
      const tabs = [screen(k, undefined), ...(k.cases ?? []).map((c) => screen(k, c))];
      pages.push(pageWithCases({ file: pageKindFile(folders.base, folderAt, family, at + 1, titleInFamily(k)), title: titleInFamily(k), category, part: "PAGES", kinds: [k.code], ask: sentence(k.description) }, tabs));
    });
  }
  // CONTAINERS and WIDGETS: a page for each family, every kind and case at once, each under its own heading
  const familyPages = (part: "CONTAINERS" | "WIDGETS", draw: (code: string, c: string, w: W) => Tree[] | null): void => {
    familiesOf(picked(part)).forEach(({ family, kinds }, at) => {
      const entries: Entry[] = [];
      for (const k of kinds) for (const c of k.cases?.length ? [undefined, ...k.cases] : [undefined]) {
        const label = `${k.title}${c ? ` · ${words(c.code)}` : ""}`;
        entries.push(headingEntry(label, appHeading(label)));
        if (isPlanned(k, c)) { entries.push(plannedEntry(k, c)); continue; }
        const nodes = draw(k.code, c?.code ?? "", w);
        entries.push(nodes ? { kind: k.title, case: c ? words(c.code) : "", note: noteOf(k, c), node: one(nodes), planned: false } : plannedEntry(k, c));
      }
      pages.push({ file: familyFile(folders.base, part, at + 1, family), title: familyTitle(family), category, part, kinds: kinds.map((k) => k.code), entries, ask: `The ${familyTitle(family).toLowerCase()} ${part === "CONTAINERS" ? "containers" : "widgets"}, every kind and case at once.`, layout: own });
    });
  };
  familyPages("CONTAINERS", appContainer);
  familyPages("WIDGETS", appWidget);
  return pages;
}
