// The pictures a language's data and words hold, found by a record's name or key and drawn as slots that name their file (RULE.SUPPORT.SURFACE.644).
// A language that holds no data, or whose file is not on disk, gets nothing here, and the recipe draws what it drew before.
// The render draws a slot with an `asset` as an image, and `DSAvatar` takes no picture from a tree, so a person's face stands as a square picture of its own.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { recordsOf } from "../_folder.ts";
import type { LanguageData } from "../_folder.ts";
import type { Tree } from "./types.ts";

type Rec = Record<string, unknown>;
const isObj = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string => (typeof value === "string" ? value : "");

let language = "";
let folder: string | null = null;
let held = new Map<string, string>();
let records: Record<string, Rec[]> = {};
let money = "USD";

/** The language whose files are drawn, its folder, and its data: the pictures `assets/sources.json` holds, by record and field, where the file stands. */
export function setMedia(name: string, languageFolder: string | null, data: LanguageData | null): void {
  language = name; folder = languageFolder; held = new Map(); records = {}; money = "USD";
  if (data && isObj(data.index) && str(data.index.currency)) money = str(data.index.currency);
  if (!data) return;
  for (const [file, holder] of Object.entries(data.files)) records[file] = recordsOf(holder).filter(isObj);
  const sources = isObj(data.sources) && Array.isArray(data.sources.pictures) ? data.sources.pictures.filter(isObj) : [];
  for (const one of sources) {
    const file = str(one.file);
    if (one.state === "HELD" && file && data.assets && existsSync(join(data.assets, file))) held.set(`${str(one.record)}#${str(one.field)}`, file);
  }
}

/** The currency the language prices in. */
export const currencyOf = (): string => money;

/** The path under assets/ of a held picture of a record's field, or null. */
export const heldPicture = (record: string, field: string): string | null => held.get(`${record}#${field}`) ?? null;

/** A slot that names its file: the image the render draws, in the shape of its ratio or a size in pixels. */
export function picture(path: string, label: string, ratio: string, size: { width?: number; height?: number } = {}): Tree {
  return { slot: path.replace(/^.*\//, "").replace(/\.[a-z]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40), label, ratio, ...size, asset: { language, path } };
}

/** A picture a words file names by its path under assets/ (a drawing), where the file stands in the language's folder. */
export function drawing(path: string | undefined, label: string, ratio: string, size: { width?: number; height?: number } = {}): Tree | null {
  if (!path || !folder || !existsSync(join(folder, "assets", path))) return null;
  return picture(path, label, ratio, size);
}

const find = (file: string, test: (record: Rec) => boolean): Rec | null => (records[file] ?? []).find(test) ?? null;
const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** An org by the name a page says it with: its full name, or the name a short form of it opens. */
export const orgNamed = (name: string): Rec | null => find("orgs", (r) => same(str(r.name), name)) ?? find("orgs", (r) => str(r.name).toLowerCase().startsWith(name.trim().toLowerCase()));
/** A person by name. */
export const personNamed = (name: string): Rec | null => find("people", (r) => same(str(r.name), name));

/** The org named inside a line such as `Teacher, Kiln & Co`. */
export function orgIn(text: string): Rec | null {
  let best: Rec | null = null;
  for (const org of records.orgs ?? []) { const name = str(org.name); if (name && text.includes(name) && (!best || name.length > str(best.name).length)) best = org; }
  return best;
}

/** An org's logo drawn alone, a square of its own, or null. */
export function logoOf(org: Rec | null, px = 40): Tree | null {
  const path = org ? heldPicture(`orgs/${str(org.key)}`, "logo") : null;
  return path ? picture(path, `${str(org?.name)}, logo`, "1:1", { width: px, height: px }) : null;
}
/** An org's wide logo, the whole of its mark and name, `height` tall and five times as wide. */
export function wideOf(org: Rec | null, height = 32): Tree | null {
  const path = org ? heldPicture(`orgs/${str(org.key)}`, "wide") : null;
  return path ? picture(path, `${str(org?.name)}, wide logo`, "5:1", { width: height * 5, height }) : null;
}
/** An org's banner, or null. */
export function bannerOf(org: Rec | null, ratio = "16:9"): Tree | null {
  const path = org ? heldPicture(`orgs/${str(org.key)}`, "banner") : null;
  return path ? picture(path, `${str(org?.name)}, banner`, ratio) : null;
}
/** A person's face as a square picture `px` wide, or null. */
export function faceOf(person: Rec | null, px = 40): Tree | null {
  const path = person ? heldPicture(`people/${str(person.key)}`, "avatar") : null;
  return path ? picture(path, `${str(person?.name)}`, "1:1", { width: px, height: px }) : null;
}
/** The face of whoever a page names, a person of the data or a reviewer, as an item's media; null where the language holds none. */
export function faceMedia(name: string, px = 40): Tree | null {
  const person = personNamed(name);
  let node = faceOf(person, px);
  if (!node) {
    const review = find("reviews", (r) => same(str(r.by), name));
    const path = review ? heldPicture(`reviews/${str(review.key)}`, "avatar") : null;
    node = path ? picture(path, name, "1:1", { width: px, height: px }) : null;
  }
  return node ? { mtype: "CUSTOM", node } : null;
}

/** What a record shown by a key holds to draw a card of it: its cover and its facts, from the items or the posts the language holds. */
export type Cover = { node: Tree; title: string; facts: string[] };
export function coverOf(key: string | undefined, ratio = "16:9"): Cover | null {
  if (!key) return null;
  for (const [file, type] of [["posts", "posts"], ["items", "items"]] as const) {
    const one = find(file, (r) => r.key === key);
    const path = one ? heldPicture(`${type}/${key}`, "cover") : null;
    if (!one || !path) continue;
    const facts = file === "posts" ? [str(one.category), typeof one.minutes === "number" ? `${one.minutes} min read` : ""] : [str(find("people", (p) => p.key === one.teacher)?.name), str(one.level)];
    return { node: picture(path, str(one.title) || key, ratio), title: str(one.title), facts: facts.filter(Boolean) };
  }
  return null;
}
/** A post or an item by its key, the fields a card needs. */
export const recordByKey = (key: string): Rec | null => find("posts", (r) => r.key === key) ?? find("items", (r) => r.key === key);
export const personByKey = (key: string): Rec | null => find("people", (r) => r.key === key);

/** The subjects a marketplace browses, each with its picture. */
export function subjects(): Array<{ key: string; name: string; line: string; picture: Tree | null; icon: string }> {
  return (records.subjects ?? []).map((r) => {
    const path = heldPicture(`subjects/${str(r.key)}`, "picture");
    return { key: str(r.key), name: str(r.name), line: str(r.line), picture: path ? picture(path, str(isObj(r.picture) ? r.picture.caption : r.name), "4:3") : null, icon: str(r.icon) };
  });
}
/** The org that stands for a seller, the first merchant that holds a banner, or null. */
export function sellerOrg(): Rec | null {
  return find("orgs", (r) => r.category === "MERCHANT" && heldPicture(`orgs/${str(r.key)}`, "banner") !== null);
}
/** The first course of the data, as a record a hero or a card draws. */
export const firstItem = (): Rec | null => (records.items ?? [])[0] ?? null;
/** An item's teacher's name. */
export const teacherOf = (item: Rec | null): string => str(personByKey(str(item?.teacher))?.name);
/** The wide logo, as the brand a header carries, for the org the language is called: the platform org, the one with no parent. */
export function brandOrg(): Rec | null {
  return find("orgs", (r) => r.parent === null || r.category === "PLATFORM");
}

/** The name of the person who holds the first membership of an org, or its owner: the person a dashboard says is signed in. */
export function memberOf(org: string): string {
  const key = str(orgNamed(org)?.key);
  const mine = (records.members ?? []).filter((r) => r.org === key);
  const owner = mine.find((r) => r.role === "OWNER") ?? mine[0];
  return owner ? str(personByKey(str(owner.person))?.name) : "";
}
