// What the language commands share about a design language kept as a folder (RULE.SUPPORT.SURFACE.628 to 636): where a language is,
// how `extends` names its parent, and what the folder holds. A file whose name starts with `_` is a helper and is never dispatched.
//
//     docs/specs/surface/languages/<name>/spdl.json            the choices; its `name` is the folder's
//     docs/specs/surface/languages/<name>/types.json           each record type: file, medium, roles, required, derived, neededBy
//     docs/specs/surface/languages/<name>/samples.json         per category: person, navigation, words, pages, flows
//     docs/specs/surface/languages/<name>/data/index.json      the domain, the day, the currency, the models, the files
//     docs/specs/surface/languages/<name>/data/<file>.json     { "type", "records" }
//     docs/specs/surface/languages/<name>/assets/sources.json  where each picture comes from
//
// A language was once `<name>/<name>.spdl.json`, and before that one flat file; each is read for one release, and the reading says so.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const MEDIA = ["PICTURE", "LOGO", "AVATAR", "ICON", "NONE"] as const;
/** The roles a record type may name a field for. A role is only ever added. */
export const ROLES = ["title", "line", "picture", "price", "previousPrice", "owner", "ratingSource", "date", "state", "place"] as const;
/** A field that links by key, and the data file it links to. */
export const LINKS: Record<string, string> = {
  teacher: "people", person: "people", academy: "orgs", org: "orgs", parent: "orgs", subject: "subjects", item: "items", items: "items",
};
/** The tenancy's org types (02-organizations.md § The organization tree). */
export const ORG_TYPES = ["PLATFORM", "ENTERPRISE", "CONSUMER"] as const;
/** The record types a page kind needs before a sample of it can be drawn. A page kind that is not here needs none of the data. */
export const PAGE_NEEDS: Record<string, string[]> = {
  MARKET_HOME: ["Item", "Subject"], MARKET_CATEGORY: ["Subject", "Item"], MARKET_BRAND: ["Org", "Item"], MARKET_SELLER: ["Person", "Item"],
  MARKET_SEARCH: ["Item"], MARKET_ITEM: ["Item", "Review"], MARKET_COMPARE: ["Item"], MARKET_CART: ["Org", "Item"], MARKET_CHECKOUT: ["Org", "Item"],
  MARKET_CONFIRMATION: ["Org", "Item"], MARKET_PRICING: ["Plan"], MAIN_PRICING: ["Plan"],
};

type Json = unknown;
const isObj = (value: Json): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The parent a spec's `extends` names: `base`; `base@1`, `surface` and `surface@1` for one release more. Null for a language with no parent. */
export function parentName(extendsRef: unknown): string | null {
  if (typeof extendsRef !== "string") return null;
  const found = /^([a-z][a-z0-9-]*)(?:@\d+)?$/.exec(extendsRef);
  return found ? (RENAMED[found[1]] ?? found[1]) : null;
}

/** Where a language is kept: `docs/specs/surface/languages/<name>/`, and the older place a release still reads. */
export const LANGUAGES = join("docs", "specs", "surface", "languages");
const OLD_LANGUAGES = join("docs", "specs", "design-languages");
/** A language's spec, by its fixed name. */
export const SPEC_FILE = "spdl.json";

/** The repository that holds the language: the folder named, or the first of the working folder and its parents that is or holds one. */
export function bookFrom(start: string): string | null {
  for (let at = resolve(start), up = 0; up < 8; up++, at = dirname(at)) {
    for (const candidate of [at, join(at, "spn-foundation")]) if (existsSync(join(candidate, LANGUAGES)) || existsSync(join(candidate, OLD_LANGUAGES))) return candidate;
  }
  return null;
}

/** The names Surface's own language has gone by: it is `base` now, and `surface` is read as `base` for one release. */
const RENAMED: Record<string, string> = { surface: "base" };

export type Found = { spec: string; folder: string; name: string; notes: string[] };

/**
 * A language's spec: `docs/specs/surface/languages/<name>/spdl.json`. For one release it also reads `<name>/<name>.spdl.json`,
 * the older `docs/specs/design-languages/` folder and the flat `<name>.spdl.json`, and `surface` as `base`; each older reading says so.
 */
export function findLanguage(asked: string, book: string | null, spec: string | undefined): Found | null {
  const name = RENAMED[asked] ?? asked;
  const notes = name === asked ? [] : [`note: \`${asked}\` is now named \`${name}\`; read as \`${name}\`, which is the only name a later release reads`];
  if (spec) {
    const file = resolve(spec);
    return existsSync(file) ? { spec: file, folder: dirname(file), name, notes } : null;
  }
  if (!book) return null;
  for (const [base, older] of [[LANGUAGES, false], [OLD_LANGUAGES, true]] as const) {
    for (const candidate of name === asked ? [name] : [name, asked]) {
      const fixed = join(book, base, candidate, SPEC_FILE);
      const later = `a language is kept at ${join(book, LANGUAGES, candidate, SPEC_FILE)}, the only path a later release reads`;
      if (existsSync(fixed)) return { spec: fixed, folder: dirname(fixed), name: candidate, notes: older ? [...notes, `note: read ${fixed}, the old folder; ${later}`] : notes };
      const named = join(book, base, candidate, `${candidate}.spdl.json`);
      if (existsSync(named)) return { spec: named, folder: dirname(named), name: candidate, notes: [...notes, `note: read ${named}, the old file name; ${later}`] };
      const flat = join(book, base, `${candidate}.spdl.json`);
      if (existsSync(flat)) return { spec: flat, folder: dirname(flat), name: candidate, notes: [...notes, `note: read ${flat}, the old flat path; ${later}`] };
    }
  }
  return null;
}

export type RecordFile = { type?: unknown; records?: unknown; [field: string]: Json };
export type RecordType = { type: string; file: string; medium: string; roles: Record<string, string>; required: string[]; derived: string[]; neededBy: string[] };
export type LanguageData = {
  folder: string; index: Record<string, Json> | null; files: Record<string, RecordFile>; types: Record<string, RecordType>;
  samples: Record<string, Json> | null; assets: string | null; sources: Json | null;
};

/** What a language folder holds of data, and the problems found reading it (a file that is not there or not JSON). */
export function loadData(folder: string): { data: LanguageData; problems: string[] } {
  const dir = join(folder, "data");
  const problems: string[] = [];
  const read = (file: string, where = dir): Json => {
    try { return JSON.parse(readFileSync(join(where, file), "utf8")); } catch (error) { problems.push(`${file} is not JSON: ${(error as Error).message}`); return null; }
  };
  const data: LanguageData = { folder, index: null, files: {}, types: {}, samples: null, assets: null, sources: null };
  if (existsSync(join(folder, "types.json"))) {
    const types = read("types.json", folder);
    if (isObj(types) && Array.isArray(types.types)) for (const one of types.types) if (isObj(one) && typeof one.type === "string") data.types[one.type] = one as unknown as RecordType;
    else if (types !== null && !(isObj(types) && Array.isArray(types.types))) problems.push("types.json holds no `types` list");
  }
  if (existsSync(join(folder, "samples.json"))) {
    const samples = read("samples.json", folder);
    if (isObj(samples)) data.samples = samples; else if (samples !== null) problems.push("samples.json is not an object");
  }
  const assets = join(folder, "assets");
  if (existsSync(assets)) {
    data.assets = assets;
    if (!existsSync(join(assets, "sources.json"))) problems.push("assets/ holds no sources.json");
    else try { data.sources = JSON.parse(readFileSync(join(assets, "sources.json"), "utf8")); } catch (error) { problems.push(`assets/sources.json is not JSON: ${(error as Error).message}`); }
  }
  if (!existsSync(dir)) return { data, problems };
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

/** The keys of a data file's records: `key`, or a category's `code`. */
const keysOf = (data: LanguageData, file: string): Set<string> =>
  new Set((data.files[file] ? recordsOf(data.files[file]) : []).map((one) => one.key ?? one.code).filter((key): key is string => typeof key === "string"));

/** The problems of a language's data, each one sentence naming the file: what `language check` refuses of it. */
export function checkData(data: LanguageData, spec: Json, catalogue: Json, icons: string[] | null = null): string[] {
  const problems: string[] = [];
  const index = data.index;
  if (index) {
    for (const key of ["domain", "today", "currency", "files"]) if (index[key] === undefined) problems.push(`data/index.json names no \`${key}\``);
    const listed = Array.isArray(index.files) ? index.files.map(String) : [];
    for (const name of listed) if (!data.files[name]) problems.push(`data/index.json lists \`${name}\`, and data/${name}.json is not there`);
    for (const name of Object.keys(data.files)) if (!listed.includes(name)) problems.push(`data/${name}.json is not listed in data/index.json`);
  }
  // Every data file names a type types.json holds; each type has a medium, roles whose fields exist, and no stored number the data can derive.
  for (const [name, file] of Object.entries(data.files)) {
    const where = `data/${name}.json`;
    if (typeof file.type !== "string" || !file.type) { problems.push(`${where} has no \`type\``); continue; }
    const type = data.types[file.type];
    if (!type) { problems.push(`${where} holds the type ${file.type}, which types.json does not hold`); continue; }
    if (type.file !== name) problems.push(`types.json gives ${file.type} the file ${type.file}, and data/${name}.json holds it`);
    if (!(MEDIA as readonly string[]).includes(String(type.medium))) problems.push(`types.json: ${file.type} has no medium, which is one of ${MEDIA.join(", ")}`);
    const records = recordsOf(file);
    if (!isObj(type.roles) || Object.keys(type.roles).length === 0) problems.push(`types.json: ${file.type} has no roles: it names no field for any role`);
    else for (const [role, field] of Object.entries(type.roles)) {
      if (!(ROLES as readonly string[]).includes(role)) { problems.push(`types.json: ${file.type}: \`${role}\` is not a role (${ROLES.join(", ")})`); continue; }
      const source = String(field);
      const other = role === "ratingSource" && source.includes(".") ? data.files[source.split(".")[0]] : undefined;
      const found = other ? recordsOf(other).some((record) => atPath(record, source.split(".").slice(1).join(".")) !== undefined) : records.some((record) => atPath(record, source) !== undefined);
      if (!found) problems.push(`types.json: the role \`${role}\` of ${file.type} names \`${source}\`, which no record of ${where} holds`);
    }
    for (const field of Array.isArray(type.required) ? type.required : []) for (const record of records) if (record[field] === undefined) problems.push(`${where}: ${String(record.key ?? record.code)} has no \`${field}\`, which ${file.type} requires`);
    const ratingHere = isObj(type.roles) && type.roles.ratingSource === "rating";
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
      if (!target || !data.files[target] || target === name && field !== "parent") return;
      for (const link of Array.isArray(value) ? value : [value]) if (typeof link === "string" && !keysOf(data, target).has(link)) unresolved.add(`${field} "${link}"`);
    });
    for (const link of unresolved) problems.push(`data/${name}.json: ${link} resolves to no record of data/${LINKS[link.split(" ")[0]]}.json`);
  }
  for (const record of data.files.items ? recordsOf(data.files.items) : []) {
    const subject = (data.files.subjects ? recordsOf(data.files.subjects) : []).find((one) => one.key === record.subject);
    if (subject && typeof record.sub === "string" && !((subject.subs as Json[]) ?? []).some((sub) => isObj(sub) && sub.key === record.sub)) problems.push(`data/items.json: ${String(record.key)} names the sub-subject "${record.sub}", which the subject "${String(record.subject)}" lacks`);
  }
  checkSamples(data, spec, catalogue, problems);
  checkTenancy(data, problems);
  checkAssets(data, problems);
  return problems;
}

/** The persons the catalogue's outline gives its categories: the surface person types. */
function personsOf(catalogue: Json): Set<string> | null {
  const outline = isObj(catalogue) && isObj(catalogue.outline) ? catalogue.outline : null;
  const categories = outline && isObj(outline.categories) ? outline.categories : null;
  return categories ? new Set(Object.values(categories).filter(isObj).map((one) => String(one.person))) : null;
}

/** A `<file>/<key>` a sample names, as a problem where it does not resolve, or null. */
function recordProblem(data: LanguageData, ref: Json, what: string): string | null {
  if (ref === null || ref === undefined) return null;
  const [file, key] = String(ref).split("/");
  if (!file) return `${what} \`${String(ref)}\` is not \`<file>\` or \`<file>/<key>\``;
  if (!data.files[file]) return `${what} ${String(ref)} names ${file}, and data/${file}.json is not there`;
  if (key !== undefined && !keysOf(data, file).has(key)) return `${what} ${String(ref)} resolves to no record of data/${file}.json`;
  return null;
}

/** `samples.json`: each category's person, its pages with the record each shows and whose eyes it is seen through, and its flows. */
function checkSamples(data: LanguageData, spec: Json, catalogue: Json, problems: string[]): void {
  if (!data.samples) return;
  const categories = isObj(data.samples.categories) ? data.samples.categories : null;
  if (!categories) { problems.push("samples.json holds no `categories`"); return; }
  const persons = personsOf(catalogue);
  const have = new Set(Object.values(data.files).map((file) => String(file.type)));
  for (const [category, entry] of Object.entries(categories)) {
    const where = `samples.json ${category}`;
    if (!isObj(entry)) { problems.push(`${where} is not an object`); continue; }
    const person = isObj(entry.person) ? entry.person : null;
    if (!person) problems.push(`${where} names no \`person\``);
    else {
      for (const field of ["type", "who", "comes", "asks", "sees"]) if (typeof person[field] !== "string" || !person[field]) problems.push(`${where} person names no \`${field}\``);
      if (persons && typeof person.type === "string" && !persons.has(person.type)) problems.push(`${where}: the person ${person.type} is not a surface person type (${[...persons].join(", ")})`);
    }
    const catalogued = isObj(catalogue) && isObj(catalogue.categories) && isObj(catalogue.categories[category]) && Array.isArray((catalogue.categories[category] as Record<string, Json>).PAGES)
      ? new Set(((catalogue.categories[category] as Record<string, Json>).PAGES as Json[]).filter(isObj).map((kind) => String(kind.code))) : null;
    const pages = Array.isArray(entry.pages) ? entry.pages.filter(isObj) : [];
    for (const page of pages) {
      const at = `${where} ${String(page.page)}`;
      if (catalogued && !catalogued.has(String(page.page))) problems.push(`${at}: ${String(page.page)} is no page kind of ${category} in the catalogue`);
      for (const [field, what] of [["record", "record"], ["as", "as"]] as const) { const refused = recordProblem(data, page[field], what); if (refused) problems.push(`${at}: ${refused}`); }
      for (const type of PAGE_NEEDS[String(page.page)] ?? []) if (Object.keys(data.files).length && !have.has(type)) problems.push(`${at} needs ${type} records, and the data holds none`);
    }
    for (const flow of Array.isArray(entry.flows) ? entry.flows.filter(isObj) : []) {
      const listed = new Set(pages.map((page) => String(page.page)));
      for (const step of Array.isArray(flow.pages) ? flow.pages.map(String) : []) if (!listed.has(step)) problems.push(`${where} flow ${String(flow.key)}: ${step} is none of the category's sample pages`);
      const refused = recordProblem(data, flow.record, "record");
      if (refused) problems.push(`${where} flow ${String(flow.key)}: ${refused}`);
    }
  }
  for (const category of pickedCategories(spec)) if (!categories[category]) problems.push(`samples.json holds no ${category}, which the spec serves`);
}

/** The categories a spec states. */
function pickedCategories(spec: Json): string[] {
  return isObj(spec) && isObj(spec.categories) ? Object.keys(spec.categories) : [];
}

/**
 * The tenancy a language's samples show (RULE.SUPPORT.SURFACE.636): `categories.json` holds the org categories with their
 * `code`, `label`, `pluralLabel`, `orgType` and `parentOrgCategoryCode`; each org of `orgs.json` names its `category` and
 * its `parent`, the parent of the category its own category names; each member of `members.json` names a person, an org
 * and a role.
 */
function checkTenancy(data: LanguageData, problems: string[]): void {
  const categories = data.files.categories, orgs = data.files.orgs, members = data.files.members;
  const byCode = new Map<string, Record<string, Json>>();
  if (categories) {
    for (const record of recordsOf(categories)) {
      const code = String(record.code);
      byCode.set(code, record);
      for (const field of ["code", "label", "pluralLabel", "orgType"]) if (typeof record[field] !== "string" || !record[field]) problems.push(`data/categories.json: ${code} has no \`${field}\``);
      if (!(ORG_TYPES as readonly string[]).includes(String(record.orgType))) problems.push(`data/categories.json: ${code} has the org type ${String(record.orgType)}, which is one of ${ORG_TYPES.join(", ")}`);
    }
    for (const [code, record] of byCode) {
      const parent = record.parentOrgCategoryCode;
      if (parent !== null && parent !== undefined && !byCode.has(String(parent))) problems.push(`data/categories.json: ${code} has the parent category ${String(parent)}, which the file does not hold`);
    }
    if ([...byCode.values()].filter((one) => one.orgType === "PLATFORM").length !== 1) problems.push("data/categories.json holds exactly one category of the org type PLATFORM");
  }
  if (orgs) {
    const records = recordsOf(orgs);
    const orgByKey = new Map(records.map((one) => [String(one.key), one]));
    for (const record of records) {
      const name = String(record.key);
      const category = byCode.get(String(record.category));
      if (!category) { problems.push(`data/orgs.json: ${name} has the category ${String(record.category)}, which data/categories.json does not hold`); continue; }
      const parentCode = category.parentOrgCategoryCode;
      if (parentCode === null || parentCode === undefined) { if (record.parent !== null && record.parent !== undefined) problems.push(`data/orgs.json: ${name} is the platform and has a parent`); continue; }
      const parent = orgByKey.get(String(record.parent));
      if (!parent) problems.push(`data/orgs.json: ${name} has the parent "${String(record.parent)}", which resolves to no org`);
      else if (String(parent.category) !== String(parentCode)) problems.push(`data/orgs.json: ${name} is a ${String(record.category)}, whose parent is a ${String(parentCode)}, and its parent ${String(record.parent)} is a ${String(parent.category)}`);
    }
  }
  if (members) {
    const people = keysOf(data, "people"), orgKeys = keysOf(data, "orgs");
    for (const record of recordsOf(members)) {
      const name = String(record.key ?? record.person);
      if (!people.has(String(record.person))) problems.push(`data/members.json: ${name} has the person "${String(record.person)}", which resolves to no record of data/people.json`);
      if (!orgKeys.has(String(record.org))) problems.push(`data/members.json: ${name} has the org "${String(record.org)}", which resolves to no record of data/orgs.json`);
      if (typeof record.role !== "string" || !record.role) problems.push(`data/members.json: ${name} has no role`);
    }
  }
}

/** A picture field's `asset` is a path under `assets/` and the file stands there; each picture `sources.json` lists names a record that is there. */
function checkAssets(data: LanguageData, problems: string[]): void {
  for (const [name, file] of Object.entries(data.files)) {
    walk(file.records ?? file, (field, asset) => {
      if (field !== "asset" || typeof asset !== "string") return;
      if (!data.assets) problems.push(`data/${name}.json: the asset ${asset} is named, and the language has no assets/ folder`);
      else if (!existsSync(join(data.assets, asset))) problems.push(`data/${name}.json: the asset ${asset} is not under assets/`);
    });
  }
  const pictures = isObj(data.sources) && Array.isArray(data.sources.pictures) ? data.sources.pictures.filter(isObj) : [];
  for (const picture of pictures) {
    const refused = recordProblem(data, picture.record, "record");
    if (refused) problems.push(`assets/sources.json: ${refused}`);
    if (picture.file !== null && picture.file !== undefined && data.assets && !existsSync(join(data.assets, String(picture.file)))) problems.push(`assets/sources.json: ${String(picture.file)} is not under assets/`);
  }
}

/** A node `spnutils apps installed --json` lists. */
export type InstalledNode = { name: string; version: string | null; kind: string | null; code: string | null; root: string; own: boolean; language: string | null };

/**
 * A type a module's state defines, `IAM.Principal`, is held to that state: the node whose code is `IAM` and whose
 * `generated/spn-symbols.json` holds the state `Principal`. One no node holds reads *awaiting contract*; a local module
 * whose symbols are not generated reads *not built*.
 */
export function checkTypesAgainstStates(data: LanguageData, nodes: InstalledNode[]): string[] {
  const problems: string[] = [];
  for (const type of Object.keys(data.types)) {
    const at = type.indexOf(".");
    if (at < 0) continue;
    const code = type.slice(0, at), state = type.slice(at + 1);
    const node = nodes.find((one) => one.code === code && (one.kind ?? "").startsWith("MODULE"));
    if (!node) { problems.push(`types.json: ${type} is awaiting contract: no node of the code ${code} is installed`); continue; }
    const symbols = [join(node.root, "generated", "spn-symbols.json"), join(node.root, "dist", "generated", "spn-symbols.json")].find(existsSync);
    if (!symbols) { problems.push(`types.json: ${type}: the module ${node.name} is not built, so its states cannot be read`); continue; }
    const text = readFileSync(symbols, "utf8");
    if (!new RegExp(`"(name|symbol)"\\s*:\\s*"${state}"`).test(text)) problems.push(`types.json: ${type} is awaiting contract: ${node.name} holds no state ${state}`);
  }
  return problems;
}
