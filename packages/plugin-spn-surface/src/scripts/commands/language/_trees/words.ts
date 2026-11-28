// The words the trees draw: a language's own, read from its samples.json (RULE.SUPPORT.SURFACE.634), and never typed here.
// A site category's words are its `words` with its navigation's bar and groups; an app category's are its org and navigation.
import type { AppWords } from "./layouts.ts";

export type Line = [key: string, title: string, description: string, icon: string];
export type Brief = {
  org: string; promise: string; legal: string; emails: string[];
  nav: Array<[label: string, key: string]>;
  groups: Array<[key: string, title: string, pages: string[]]>;
  claim: string; claim2: string; problem: string; problem2: string; facts: string[];
  heroCta: [main: string, second: string];
  doors: Line[]; points: Line[]; steps: Line[]; qa: Array<[string, string]>;
  code: { file: string; language: string; text: string };
  records: Array<[title: string, description: string, date: string, key?: string]>;
  quotes: Array<[text: string, name: string, role: string]>;
  people: Array<[string, string]>;
  plans: Array<{ name: string; price: number; line: string; feats: string[]; recommended?: boolean }>;
  numbers: Array<[string, string]>;
  closing: { title: string; description: string; cta: string; second: string };
  article: { title: string; lede: string; by: string; date: string };
  choose: Array<[string, string]>;
  marks: string[];
  logosLine: string;
  places: Array<[string, string, string?, string?]>;
  picture: { hero: string; show: string; proof: string };
  /** The rows of the plan comparison, grouped by theme: a label, the kind of cell and one value for each plan. A tick cell holds "yes" or "no", a text cell its words. */
  planTable: Array<[group: string, rows: Array<[label: string, kind: "tick" | "text", values: string[]]>]>;
  /** The six parts a product is made of, as lines with an icon, and the head over them. */
  features?: Line[]; featuresHead?: [string, string];
  /** Pictures a page draws, by their path under the language's assets/: the hero, the product shown, the proof, the closing, and one for each door, feature, screen and place. */
  pictures?: { hero?: string; scene?: string; show?: string; proof?: string; closing?: string; culture?: string; story?: string; doors?: Record<string, string>; features?: Record<string, string>; showcase?: Record<string, string>; places?: Record<string, string> };
  /** The press that wrote about the product: key, name, headline, date; the partners it works with: key, name; the open roles: title, team, place, type; the story: year, title, line; the screens: key, title, line. */
  press?: Array<[string, string, string, string]>; partners?: Array<[string, string]>; jobs?: Array<[string, string, string, string]>; story?: Array<[string, string, string]>; showcase?: Array<[string, string, string]>;
  /** The listings of the item comparison, each a column of facts. */
  listings: Array<{ title: string; price: string; facts: Record<string, string> }>;
  /** The words a category says differently from the marketing site: a head over a run of records, over the three points and over the doors, the searches people make most and the tag on the hero. */
  heads?: { show?: [string, string]; quotes?: [string, string]; numbers?: [string, string, string]; steps?: [string, string]; sample?: [string, string]; records?: [string, string]; points?: [string, string]; doors?: [string, string]; popular?: string[]; heroTag?: string; shelves?: [string, string] };
  /** What a page says in its own hero, where it is not the home page: the page kind's code, then its title, its description and its two actions. */
  pageHeroes?: Record<string, [title: string, description: string, main: string, second: string]>;
};


/** Each site category's words, filled from the language's samples.json before a tree is drawn. */
export const BRIEFS: Record<string, Brief> = {};
/** Each app category's words, filled from the language's samples.json before a tree is drawn. */
export const APP_WORDS: Record<string, AppWords> = {};

type Json = unknown;
const isObj = (value: Json): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Fills the words from a language's samples.json; a category it does not hold draws with the nearest one held. */
export function useWords(samples: Json): void {
  for (const key of Object.keys(BRIEFS)) delete BRIEFS[key];
  for (const key of Object.keys(APP_WORDS)) delete APP_WORDS[key];
  const categories = isObj(samples) && isObj(samples.categories) ? samples.categories : {};
  for (const [code, entry] of Object.entries(categories)) {
    if (!isObj(entry)) continue;
    const words = isObj(entry.words) ? entry.words : {};
    const navigation = isObj(entry.navigation) ? entry.navigation : {};
    if (Array.isArray(navigation.dock)) {
      APP_WORDS[code] = { org: String(words.org ?? ""), selected: String(navigation.selected ?? ""), nav: navigation.nav as AppWords["nav"], dock: navigation.dock as AppWords["dock"] };
    } else {
      BRIEFS[code] = { ...(words as unknown as Brief), nav: (navigation.nav ?? []) as Brief["nav"], groups: (navigation.groups ?? []) as Brief["groups"] };
    }
  }
}
