// The pages of an app category: its layouts, its page kinds (and each case of a kind as a page of its own), its container kinds and its
// widget kinds, drawn with the words of the category's sample product.
import { type W, WORDS, appContainer, appPage, appWidget, layoutBody } from "./app.ts";
import type { Folders } from "./draw-site.ts";
import { plannedPanel } from "./kit.ts";
import { noteOf, sentence, slugOf, words } from "./notes.ts";
import type { CatCase, CatKind, Entry, Page, Tree } from "./types.ts";
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
  const file = (part: string, at: number, slug: string): string => `${folders.part(part)}/${String(at).padStart(2, "0")}-${slug}.html`;
  picked("LAYOUTS").forEach((k, at) => {
    const entries: Entry[] = [{ kind: k.title, case: "", note: noteOf(k), node: one(layoutBody(w)), planned: false }, ...(k.cases ?? []).filter((c) => c.status !== "BUILT").map((c) => plannedEntry(k, c))];
    pages.push({ file: file("LAYOUTS", at + 1, slugOf(k.code)), title: k.title, category, part: "LAYOUTS", kinds: [k.code], entries, ask: sentence(k.description), layout: k.code });
  });
  let at = 0;
  for (const k of picked("PAGES")) {
    const cases: Array<CatCase | undefined> = [undefined, ...(k.cases ?? [])];
    for (const c of cases) {
      at += 1;
      const planned = isPlanned(k, c);
      const drawn = planned ? null : appPage(k.code, c?.code ?? "", w);
      const entry: Entry = drawn && !drawn.planned ? { kind: k.title, case: c ? words(c.code) : "", note: noteOf(k, c), node: one(drawn.children), planned: false } : plannedEntry(k, c);
      pages.push({ file: file("PAGES", at, `${slugOf(k.code)}${c ? `-${slugOf(c.code)}` : ""}`), title: c ? `${k.title} · ${words(c.code)}` : k.title, category, part: "PAGES", kinds: [k.code], entries: [entry], ask: sentence(c?.when ?? k.description), layout: drawn?.layout && layouts.includes(drawn.layout) ? drawn.layout : own });
    }
  }
  picked("CONTAINERS").forEach((k, i) => {
    const entries = (k.cases?.length ? [undefined, ...k.cases] : [undefined]).map((c): Entry => {
      if (isPlanned(k, c)) return plannedEntry(k, c);
      const nodes = appContainer(k.code, c?.code ?? "", w);
      return nodes ? { kind: k.title, case: c ? words(c.code) : "", note: noteOf(k, c), node: one(nodes), planned: false } : plannedEntry(k, c);
    });
    pages.push({ file: file("CONTAINERS", i + 1, slugOf(k.code)), title: k.title, category, part: "CONTAINERS", kinds: [k.code], entries, ask: sentence(k.description), layout: own });
  });
  picked("WIDGETS").forEach((k, i) => {
    const entries = (k.cases?.length ? [undefined, ...k.cases] : [undefined]).map((c): Entry => {
      if (isPlanned(k, c)) return plannedEntry(k, c);
      const nodes = appWidget(k.code, c?.code ?? "", w);
      return nodes ? { kind: k.title, case: c ? words(c.code) : "", note: noteOf(k, c), node: one(nodes), planned: false } : plannedEntry(k, c);
    });
    pages.push({ file: file("WIDGETS", i + 1, slugOf(k.code)), title: k.title, category, part: "WIDGETS", kinds: [k.code], entries, ask: sentence(k.description), layout: own });
  });
  return pages;
}
