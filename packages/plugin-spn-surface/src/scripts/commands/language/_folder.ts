// What the language commands share about a design language kept as a folder (RULE.SUPPORT.SURFACE.628 to 631): where a language is,
// how `extends` names its parent, and the dataset in `data/`. A file whose name starts with `_` is a helper and is never dispatched.
//
//     docs/specs/design-languages/<name>/<name>.spdl.json     the spec
//     docs/specs/design-languages/<name>/data/index.json      the domain, the day, the currency, who uses each surface, the files
//     docs/specs/design-languages/<name>/data/<file>.json     { "type", "medium", "roles", "records" }
//
// A language was once one flat file, `<name>.spdl.json`; it is still read for one release, and the reading says so.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const MEDIA = ["PICTURE", "LOGO", "AVATAR", "ICON", "NONE"] as const;
/** The roles a record file may name a field for. A role is only ever added. */
export const ROLES = ["title", "line", "picture", "price", "previousPrice", "owner", "ratingSource", "date", "state", "place"] as const;
/** A field that links by key, and the record file it links to. */
export const LINKS: Record<string, string> = { teacher: "teachers", academy: "academies", category: "categories", item: "items", items: "items" };
/** The record types a page kind needs before a sample of it can be drawn. A page kind that is not here needs none of the data. */
export const PAGE_NEEDS: Record<string, string[]> = {
  MARKET_HOME: ["ITEM", "CATEGORY"], MARKET_CATEGORY: ["CATEGORY", "ITEM"], MARKET_BRAND: ["BRAND", "ITEM"], MARKET_SELLER: ["SELLER", "ITEM"],
  MARKET_SEARCH: ["ITEM"], MARKET_ITEM: ["ITEM", "REVIEW"], MARKET_COMPARE: ["ITEM"], MARKET_CART: ["PERSON", "ITEM"], MARKET_CHECKOUT: ["PERSON", "ITEM"],
  MARKET_CONFIRMATION: ["PERSON", "ITEM"], MARKET_PRICING: ["PLAN"], MAIN_PRICING: ["PLAN"],
};

type Json = unknown;
const isObj = (value: Json): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The parent a spec's `extends` names: `surface`, or `surface@1` for one release more. Null for a language with no parent. */
export function parentName(extendsRef: unknown): string | null {
  if (typeof extendsRef !== "string") return null;
  const found = /^([a-z][a-z0-9-]*)(?:@\d+)?$/.exec(extendsRef);
  return found ? found[1] : null;
}

/** The book that holds the language: the folder named, or the first of the working folder and its parents that is or holds one. */
export function bookFrom(start: string): string | null {
  for (let at = resolve(start), up = 0; up < 8; up++, at = dirname(at)) {
    for (const candidate of [at, join(at, "spn-foundation")]) if (existsSync(join(candidate, "docs", "specs", "design-languages"))) return candidate;
  }
  return null;
}

export type Found = { spec: string; folder: string | null; notes: string[] };

/** A language's spec: the folder's `<name>/<name>.spdl.json` first, then the old flat file in the same place, and each older reading says so. */
export function findLanguage(name: string, book: string | null, spec: string | undefined): Found | null {
  if (spec) return existsSync(spec) ? { spec: resolve(spec), folder: existsSync(join(dirname(resolve(spec)), "data")) ? dirname(resolve(spec)) : null, notes: [] } : null;
  if (!book) return null;
  const base = join(book, "docs", "specs", "design-languages");
  const folder = join(base, name, `${name}.spdl.json`);
  if (existsSync(folder)) return { spec: folder, folder: dirname(folder), notes: [] };
  const flat = join(base, `${name}.spdl.json`);
  if (existsSync(flat)) return { spec: flat, folder: null, notes: [`note: read ${flat}, the old flat path; keep a language in its own folder, ${join(base, name)}/${name}.spdl.json, which is the only path a later release reads`] };
  return null;
}

export type RecordFile = { type?: unknown; medium?: unknown; roles?: unknown; records?: unknown; [field: string]: Json };
export type LanguageData = { folder: string; index: Record<string, Json> | null; files: Record<string, RecordFile> };

/** The dataset of a language folder, and the problems found reading it (a file that is not there or not JSON). */
export function loadData(folder: string): { data: LanguageData; problems: string[] } {
  const dir = join(folder, "data");
  const problems: string[] = [];
  const read = (file: string): Json => {
    try { return JSON.parse(readFileSync(join(dir, file), "utf8")); } catch (error) { problems.push(`${file} is not JSON: ${(error as Error).message}`); return null; }
  };
  const data: LanguageData = { folder, index: null, files: {} };
  if (!existsSync(dir)) { problems.push(`${folder} has no data/ folder`); return { data, problems }; }
  if (!existsSync(join(dir, "index.json"))) problems.push("data/index.json is missing");
  else { const index = read("index.json"); if (isObj(index)) data.index = index; else if (index !== null) problems.push("data/index.json is not an object"); }
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json") && name !== "index.json").sort()) {
    const value = read(file);
    if (isObj(value)) data.files[file.replace(/\.json$/, "")] = value as RecordFile; else if (value !== null) problems.push(`data/${file} is not an object`);
  }
  return { data, problems };
}

/** The records of a file: its `records` list, the lists inside a `records` object, or the file itself where it is one record. */
export function recordsOf(file: RecordFile): Record<string, Json>[] {
  const records = file.records;
  if (Array.isArray(records)) return records.filter(isObj);
  if (isObj(records)) return Object.values(records).flatMap((list) => (Array.isArray(list) ? list.filter(isObj) : isObj(list) ? [list] : []));
  return [file as Record<string, Json>];
}

/** A dotted path read from a record: `record.name`. */
function atPath(record: Json, path: string): Json {
  return path.split(".").reduce<Json>((at, part) => (isObj(at) ? at[part] : undefined), record);
}

/** The names a stored number may never carry, because the data can derive it: a count, an average, a total. */
const DERIVED = /^(count|total|subtotal|average|avg|mean|sum)$|(Count|Total|Average|Avg)$/;

/** Every object property of a value, deep, with the property's name and value. */
function walk(value: Json, visit: (name: string, value: Json) => void): void {
  if (Array.isArray(value)) { for (const one of value) walk(one, visit); return; }
  if (!isObj(value)) return;
  for (const [name, inner] of Object.entries(value)) { visit(name, inner); walk(inner, visit); }
}

/** The page kinds a spec picks in a category: `ALL` is every page kind of the catalogue, a list is the codes it names, and `notUsed` leaves some out. */
export function pickedPages(spec: Json, category: string, catalogue: Json): string[] {
  const decision = isObj(spec) && isObj(spec.categories) && isObj(spec.categories[category]) ? (spec.categories[category] as Record<string, Json>).PAGES : undefined;
  if (!isObj(decision)) return [];
  const base = isObj(catalogue) && isObj(catalogue.categories) && isObj(catalogue.categories[category]) ? ((catalogue.categories[category] as Record<string, Json>).PAGES as Json) : [];
  const all = (Array.isArray(base) ? base : []).filter(isObj).map((kind) => String(kind.code));
  const pick = decision.pick;
  const named = Array.isArray(pick) ? pick.map((one) => String(one).split(".")[0]) : isObj(pick) ? Object.keys(pick) : all;
  const added = (Array.isArray(decision.add) ? decision.add : []).filter(isObj).map((kind) => String(kind.code));
  const left = new Set((Array.isArray(decision.notUsed) ? decision.notUsed : []).map((one) => String(one).split(".")[0]));
  return [...new Set([...named, ...added])].filter((code) => !left.has(code));
}

/** The icon names the design system holds, from the file this plugin carries (`refs/support/surface/icons.json`, the values of DSIconType), or null where it is not there. */
export function iconsFrom(file: string): string[] | null {
  if (!existsSync(file)) return null;
  const list = (JSON.parse(readFileSync(file, "utf8")) as { icons?: unknown }).icons;
  return Array.isArray(list) ? list.map(String) : null;
}

/** The problems of a dataset, each one sentence naming the file: what `language data check` refuses. */
export function checkData(data: LanguageData, spec: Json, catalogue: Json, icons: string[] | null = null): string[] {
  const problems: string[] = [];
  const index = data.index;
  if (index) {
    for (const key of ["domain", "today", "currency", "surfaces", "files"]) if (index[key] === undefined) problems.push(`data/index.json names no \`${key}\``);
    const listed = Array.isArray(index.files) ? index.files.map(String) : [];
    for (const name of listed) if (!data.files[name]) problems.push(`data/index.json lists \`${name}\`, and data/${name}.json is not there`);
    for (const name of Object.keys(data.files)) if (!listed.includes(name)) problems.push(`data/${name}.json is not listed in data/index.json`);
  }
  // Every record file: a medium, roles whose fields exist, no stored number the data can derive.
  const keys: Record<string, Set<string>> = {};
  for (const [name, file] of Object.entries(data.files)) {
    const where = `data/${name}.json`;
    if (typeof file.type !== "string" || !file.type) problems.push(`${where} has no \`type\``);
    if (!(MEDIA as readonly string[]).includes(String(file.medium))) problems.push(`${where} has no medium, which is one of ${MEDIA.join(", ")}`);
    const records = recordsOf(file);
    if (!isObj(file.roles) || Object.keys(file.roles).length === 0) problems.push(`${where} has no roles: it names no field for any role`);
    else for (const [role, field] of Object.entries(file.roles)) {
      if (!(ROLES as readonly string[]).includes(role)) { problems.push(`${where}: \`${role}\` is not a role (${ROLES.join(", ")})`); continue; }
      const source = String(field);
      const file2 = role === "ratingSource" && source.includes(".") ? data.files[source.split(".")[0]] : undefined;
      const found = file2 ? recordsOf(file2).some((record) => atPath(record, source.split(".").slice(1).join(".")) !== undefined) : records.some((record) => atPath(record, source) !== undefined);
      if (!found) problems.push(`${where}: the role \`${role}\` names \`${source}\`, which no record holds`);
    }
    keys[name] = new Set(records.map((record) => record.key).filter((key): key is string => typeof key === "string"));
    const ratingHere = isObj(file.roles) && file.roles.ratingSource === "rating";
    walk(file.records ?? file, (field, value) => {
      if (field === "icon" && icons && typeof value === "string" && !icons.includes(value)) problems.push(`${where}: the icon ${value} is not one of the design system's DSIconType`);
      if (DERIVED.test(field)) problems.push(`${where}: \`${field}\` is a number the data can derive, so it is worked out where it is drawn and never stored`);
      else if (field === "rating" && !ratingHere) problems.push(`${where}: \`rating\` is stored outside the reviews; a rating is averaged from the reviews where it is drawn`);
    });
  }
  // Records link by key: each link names a record that is there.
  for (const [name, file] of Object.entries(data.files)) {
    const unresolved = new Set<string>();
    walk(file.records ?? file, (field, value) => {
      const target = LINKS[field];
      if (!target || !data.files[target]) return;
      for (const link of Array.isArray(value) ? value : [value]) if (typeof link === "string" && !keys[target].has(link)) unresolved.add(`${field} "${link}"`);
    });
    for (const link of unresolved) problems.push(`data/${name}.json: ${link} resolves to no record of data/${LINKS[link.split(" ")[0]]}.json`);
  }
  for (const record of data.files.items ? recordsOf(data.files.items) : []) {
    const category = (data.files.categories ? recordsOf(data.files.categories) : []).find((one) => one.key === record.category);
    if (category && typeof record.sub === "string" && !((category.subs as Json[]) ?? []).some((sub) => isObj(sub) && sub.key === record.sub)) problems.push(`data/items.json: ${String(record.key)} names the sub-category "${record.sub}", which the category "${String(record.category)}" lacks`);
  }
  // A page kind the language picks needs the records it shows.
  if (index && isObj(index.surfaces)) {
    const have = new Set(Object.values(data.files).map((file) => String(file.type)));
    for (const category of Object.keys(index.surfaces)) {
      const missing = new Map<string, string[]>();
      for (const page of pickedPages(spec, category, catalogue)) for (const type of PAGE_NEEDS[page] ?? []) if (!have.has(type)) missing.set(type, [...(missing.get(type) ?? []), page]);
      for (const [type, pages] of missing) problems.push(`${category} picks ${pages.join(", ")}, which need ${type} records, and the data holds none`);
    }
  }
  return problems;
}
