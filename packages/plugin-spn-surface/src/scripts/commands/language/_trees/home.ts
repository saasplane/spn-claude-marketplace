// The shape of a samples home (RULE.SUPPORT.SURFACE.643), one for every language: under each category, Overview, Layouts as
// one page with a tab for each layout and case, Pages as a folder for each page-kind family with a page for each kind and
// its cases on a Case switch, Common as one page with a tab for each screen, Containers and Widgets as a folder each with a
// page for each family drawing every kind and case at once, and then Media, Motion and Words.
import { col, feat, sec, table, txt } from "./kit.ts";
import { sentence, slugOf, words } from "./notes.ts";
import type { CatKind, Entry, Page, PageCase, Tree } from "./types.ts";

const num = (n: number): string => String(n).padStart(2, "0");

/** The parts of a category, in the order its folder numbers them. */
export const CATEGORY_PARTS = ["OVERVIEW", "LAYOUTS", "PAGES", "CONTAINERS", "WIDGETS", "MEDIA", "MOTION", "WORDS"] as const;

/** A category's folder for a part: `02-site/01-marketing/04-containers`, or the file of a one-page part, `…/02-layouts.html`. */
export const partPath = (base: string, part: (typeof CATEGORY_PARTS)[number]): string =>
  `${base}/${num(CATEGORY_PARTS.indexOf(part) + 1)}-${part.toLowerCase()}`;

/** A kind's family: the first word of its code, `INTRO` of `INTRO_HERO`. */
export const familyOf = (code: string): string => code.split("_")[0];

/** A family's name in words: `INTRO` is `Intro`. */
export const familyTitle = (family: string): string => {
  const text = words(family);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** A kind's title under its family: the family's word left out where the title opens with it, so Main home reads Home. */
export function titleInFamily(kind: CatKind): string {
  const family = words(familyOf(kind.code));
  const title = kind.title.trim();
  if (title.toLowerCase().startsWith(`${family} `) && title.length > family.length + 1) {
    const rest = title.slice(family.length + 1);
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return title;
}

/** The families of a part's kinds, in the order the catalogue first names each. */
export function familiesOf(kinds: CatKind[]): Array<{ family: string; kinds: CatKind[] }> {
  const out: Array<{ family: string; kinds: CatKind[] }> = [];
  for (const kind of kinds) {
    const family = familyOf(kind.code);
    const found = out.find((one) => one.family === family);
    if (found) found.kinds.push(kind);
    else out.push({ family, kinds: [kind] });
  }
  return out;
}

/** The head a family page draws over each kind and case, so a reviewer reads which is which; it carries no note. */
export const headingEntry = (label: string, node: Tree): Entry => ({ kind: label, case: "", note: "", node, planned: false, heading: true });

/** A site's heading over an entry: a short section holding the kind and its case. */
export const siteHeading = (label: string): Tree => sec([txt(label, "TITLE_SM", { tone: "MUTED" })], "XS");

/** An app's heading over an entry: the kind and its case, as a line of the page. */
export const appHeading = (label: string): Tree => txt(label, "TITLE_SM", { tone: "MUTED" });

/** One page that shows several whole screens, a tab for each: the first case is what the page draws at first. */
export function pageWithCases(base: Omit<Page, "entries" | "layout" | "cases">, cases: PageCase[]): Page {
  return { ...base, entries: cases[0]?.entries ?? [], layout: cases[0]?.layout ?? "CANVAS", cases: cases.length > 1 ? cases : undefined };
}

type Samples = { categories?: Record<string, { person?: Record<string, unknown>; flows?: Array<{ key?: string; pages?: string[] }> }> };

/** A category's Overview: the person its samples are drawn for, the families the language picks in each part, and its flows. */
export function overviewPage(
  category: string,
  base: string,
  samples: unknown,
  parts: Record<string, CatKind[]>,
  wrap: (children: Tree[]) => Tree[]
): Page {
  const entry = ((samples ?? {}) as Samples).categories?.[category];
  const person = entry?.person ?? {};
  const say = (key: string): string => (typeof person[key] === "string" ? (person[key] as string) : "");
  const who = say("who") || `The person a ${category.toLowerCase()} page is for.`;
  const entries: Entry[] = [];
  const personRows = [["Who", who], ["Comes", say("comes")], ["Asks", say("asks")], ["Sees", say("sees")]].filter(([, value]) => value !== "");
  entries.push({
    kind: "Person",
    case: "",
    note: sentence(who),
    node: wrap([feat({ title: `Who ${words(category)} is for`, description: sentence(who) }), table(["", ""], personRows)])[0],
    planned: false,
  });
  const familyRows = (["LAYOUTS", "PAGES", "CONTAINERS", "WIDGETS"] as const).map((part) => [
    familyTitle(part),
    part === "LAYOUTS" ? (parts[part] ?? []).map((kind) => kind.title).join(" · ") : familiesOf(parts[part] ?? []).map((one) => familyTitle(one.family)).join(" · "),
  ]);
  entries.push({
    kind: "Families",
    case: "",
    note: "The families of each part this language picks.",
    node: wrap([feat({ title: "What this language picks", description: "Each part's families, in the catalogue's order." }), table(["Part", "Families"], familyRows)])[0],
    planned: false,
  });
  const flows = entry?.flows ?? [];
  entries.push({
    kind: "Flows",
    case: "",
    note: flows.length ? "The pages a person walks, in order." : "This category draws no flow yet.",
    node: wrap([
      feat({ title: "The flows", description: flows.length ? "Each flow is the pages a person walks, in order." : "The language names no flow for this category yet." }),
      ...(flows.length ? [table(["Flow", "Pages"], flows.map((flow) => [words(String(flow.key ?? "")), (flow.pages ?? []).map((page) => words(page)).join(" → ")]))] : []),
    ])[0],
    planned: false,
  });
  return { file: `${partPath(base, "OVERVIEW")}.html`, title: "Overview", category, part: "OVERVIEW", kinds: [], entries, ask: sentence(who), layout: "CANVAS" };
}

/** The file of a page kind in its family's folder, and the Common page's file. */
export const pageKindFile = (base: string, familyAt: number, family: string, kindAt: number, title: string): string =>
  `${partPath(base, "PAGES")}/${num(familyAt)}-${slugOf(family)}/${num(kindAt)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.html`;
export const commonPagesFile = (base: string, at: number): string => `${partPath(base, "PAGES")}/${num(at)}-common.html`;
export const familyFile = (base: string, part: "CONTAINERS" | "WIDGETS", at: number, family: string): string =>
  `${partPath(base, part)}/${num(at)}-${slugOf(family)}.html`;

export { col };
