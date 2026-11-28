// The Data pages of Shared (RULE.SUPPORT.SURFACE.643): one page for each record type the language's types.json holds, in its order. A page shows
// the type's fields (role, field and medium, as types.json states them) in one short table, then every record of the type from the language's
// data/ drawn with the widget the language uses for that type, each under its own heading. A type no catalogue widget names is drawn as a plain
// table of its records, and the writer reports it as unnamed.
import { LINKS, ROLES, recordsOf } from "../_folder.ts";
import type { LanguageData } from "../_folder.ts";
import { U, badge, col, feat, muted, quote as quoteCard, row, sec, slot, table, txt } from "./kit.ts";
import { personCard, questionCard } from "./site.ts";
import { heldPicture, logoOf, picture as filePicture, bannerOf } from "./media.ts";
import { sentence, slugOf, words } from "./notes.ts";
import type { Entry, Page, Tree } from "./types.ts";

type Json = unknown;
type Rec = Record<string, Json>;
const isObj = (value: Json): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);

/** The types a widget of the catalogue draws, by the widget's code; every other type is drawn as a table. */
export const WIDGET_OF: Record<string, string> = { Item: "CARD_ITEM", Subject: "CARD_CATEGORY", Org: "CARD_ORG", Person: "CARD_PERSON", Review: "CARD_REVIEW", Plan: "CARD_PLAN", Question: "CARD_QUESTION" };

/** The record types of a language whose records are drawn as a table, because the catalogue names no widget for them. */
export const unnamedTypes = (data: LanguageData | null): string[] => Object.keys(data?.types ?? {}).filter((type) => !WIDGET_OF[type]);

const text = (value: Json): string => (value === null || value === undefined ? "" : typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : "");
const capital = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
/** A record type in words: `OrgCategory` is `org category`. */
const typeWords = (type: string): string => type.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
const humanKey = (key: string): string => capital(key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase());

/** Where a record's roles point: its type's roles over a data file, a linked key shown as the linked record's title. */
function reader(data: LanguageData): { say: (type: string, record: Rec, role: string) => string; field: (type: string, record: Rec, field: string) => string } {
  const typeOfFile = Object.fromEntries(Object.values(data.types).map((one) => [one.file, one]));
  const find = (file: string, key: string): Rec | null => {
    const holder = data.files[file];
    return holder ? (recordsOf(holder).find((one) => one.key === key || one.code === key) ?? null) : null;
  };
  const field = (type: string, record: Rec, name: string): string => {
    const value = record[name];
    const file = LINKS[name];
    if (typeof value === "string" && file && typeOfFile[file]) {
      const target = find(file, value);
      const title = target ? text(target[typeOfFile[file].roles.title]) : "";
      return title || value;
    }
    if (typeof value === "string" && /^[A-Z0-9_]+$/.test(value)) return words(value);
    if (Array.isArray(value)) return `${value.length}`;
    return text(value);
  };
  const say = (type: string, record: Rec, role: string): string => {
    const name = data.types[type]?.roles[role];
    return name ? field(type, record, name) : "";
  };
  return { say, field };
}

/** The fields table of a type: each role, the field that fills it and the medium where one stands; types.json's words, no more. */
function fieldsEntry(type: string, data: LanguageData): Entry {
  const one = data.types[type];
  const medium = capital(one.medium.toLowerCase());
  const mediumRole = one.medium === "PICTURE" ? "picture" : one.medium === "NONE" ? "" : "title";
  const rows = ROLES.filter((role) => one.roles[role]).map((role) => [humanKey(role), one.roles[role], role === mediumRole ? medium : ""]);
  const description = `${type} holds ${recordsFor(type, data).length} records here. Its medium is ${one.medium === "NONE" ? "none" : medium.toLowerCase()}.`;
  return { kind: "Fields", case: "", note: sentence(`The fields ${type} names for each role`), node: sec([feat({ title: `${capital(typeWords(type))} fields`, description }), table(["Role", "Field", "Medium"], rows)], "MD"), planned: false };
}

/** A type's records in the file's order; a Plan file groups its records, and each carries its group. */
function recordsFor(type: string, data: LanguageData): Array<Rec & { __group?: string }> {
  const file = data.files[data.types[type].file];
  if (!file) return [];
  if (isObj(file.records) && !Array.isArray(file.records)) {
    return Object.entries(file.records).flatMap(([group, list]) => (Array.isArray(list) ? list.filter(isObj).map((one) => ({ ...one, __group: group })) : []));
  }
  return recordsOf(file);
}

/** The card a type's record is drawn with, the catalogue widget's recipe on the record's own words. */
function cardOf(type: string, record: Rec & { __group?: string }, data: LanguageData, read: ReturnType<typeof reader>): Tree | null {
  const say = (role: string): string => read.say(type, record, role);
  const currency = text((data.index ?? {}).currency) || "USD";
  const picture = (key: string, fallback: string, ratio: string): Tree => {
    const value = record[key];
    const held = heldPicture(`${data.types[type].file}/${text(record.key)}`, key);
    if (held) return filePicture(held, isObj(value) && text(value.caption) ? text(value.caption) : fallback, isObj(value) && text(value.ratio) ? text(value.ratio) : ratio);
    return slot(isObj(value) && text(value.caption) ? text(value.caption) : fallback, isObj(value) && text(value.ratio) ? text(value.ratio) : ratio);
  };
  const money = (value: Json): Tree => U("DSFormatCurrency", { value: Number(value), currencyCode: currency });
  switch (type) {
    case "Item": {
      const rating = say("ratingSource");
      const bits = [say("owner"), say("place"), say("date") ? `Updated ${say("date")}` : "", rating].filter(Boolean);
      const price = record[data.types.Item.roles.price];
      const was = record[data.types.Item.roles.previousPrice];
      return U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "cover", node: picture(data.types.Item.roles.picture, say("title"), "16:9") }, { mtype: "FREE", key: "body", node: col([U("DSItem", { pageLevel: "WIDGET", title: say("title"), description: say("line"), facts: bits }), row([...(typeof price === "number" ? [money(price)] : []), ...(typeof was === "number" ? [muted("was"), money(was)] : []), ...(say("state") ? [badge(say("state"), "PRIMARY", "SOLID")] : [])], "SM")], "SM") }] });
    }
    case "Subject": return U("DSCardWidget", { parts: [{ mtype: "MEDIA", key: "cover", node: picture("picture", say("title"), "4:3") }, { mtype: "FREE", key: "name", node: U("DSItem", { pageLevel: "WIDGET", title: say("title"), description: say("line") }) }] });
    case "Org": {
      const mark = isObj(record.mark) && text(record.mark.icon) ? { mtype: "MARK", icon: text(record.mark.icon) } : { mtype: "MARK", text: say("title").slice(0, 2).toUpperCase() };
      const logo = logoOf(record, 40);
      const banner = bannerOf(record, "21:9");
      return U("DSCardWidget", { parts: [...(banner ? [{ mtype: "MEDIA", key: "banner", node: banner }] : []), { mtype: "FREE", key: "org", node: U("DSItem", { pageLevel: "WIDGET", title: say("title"), description: say("line") || read.field(type, record, "category"), media: logo ? { mtype: "CUSTOM", node: logo } : mark, facts: [say("place"), say("date") ? `Since ${say("date")}` : ""].filter(Boolean) }) }] });
    }
    case "Person": return personCard(say("title"), say("line"));
    case "Review": return quoteCard(say("line"), say("title"), [`${text(record.rating)} out of 5`, say("owner"), say("date")].filter(Boolean).join(" · "), true);
    case "Plan": {
      const feats = Array.isArray(record.feats) ? (record.feats as Json[]).map(text) : [];
      const recommended = record[data.types.Plan.roles.state] === true;
      return U("DSCardWidget", { header: { title: say("title"), description: say("line") }, surface: { raised: recommended, elevation: "MD" }, parts: [{ mtype: "FREE", key: "price", node: row([money(record.price), muted("a month")], "SM") }, { mtype: "ITEMS", key: "feats", items: feats.map((one, at) => ({ key: `f${at}`, title: one })) }, ...(recommended ? [{ mtype: "FREE", key: "mark", node: badge("Recommended", "PRIMARY", "SOLID") }] : [])] });
    }
    case "Question": return questionCard(say("title"), say("line"), Number(record.helpful) || 0);
    default: return null;
  }
}

/** The records of a type with no widget, as one table: each role's field, then the required fields no role names. */
function tableEntry(type: string, records: Rec[], data: LanguageData, read: ReturnType<typeof reader>): Entry {
  const one = data.types[type];
  const named = ROLES.filter((role) => one.roles[role]).map((role) => one.roles[role]);
  const columns = [...new Set([...named, ...one.required.filter((name) => !named.includes(name))])].slice(0, 6);
  const rows = records.map((record) => columns.map((name) => read.field(type, record, name)));
  const head = columns.map(humanKey);
  return { kind: "Records", case: "", note: sentence(`Every ${typeWords(type)} record, one row each, in a table`), node: sec([feat({ title: `Every ${typeWords(type)} record`, description: `No catalogue widget names ${typeWords(type)}, so its records stand as one table, a row each.` }), ...(rows.length ? [table(head, rows)] : [muted(`The language holds no ${typeWords(type)} record.`)])], "MD"), planned: false };
}

/** The Data pages of a language, one for each type its types.json holds, in that order; none for a language with no types. */
export function dataPages(data: LanguageData | null): Page[] {
  if (!data) return [];
  const read = reader(data);
  return Object.keys(data.types).map((type, at) => {
    const records = recordsFor(type, data);
    const entries: Entry[] = [fieldsEntry(type, data)];
    if (WIDGET_OF[type]) {
      for (const record of records) {
        const card = cardOf(type, record, data, read);
        if (!card) continue;
        const label = read.say(type, record, "title") || text(record.key);
        const heading = record.__group ? `${label} · ${text(record.__group)}` : label;
        entries.push({ kind: heading, case: "", note: sentence(`${typeWords(type)} record ${text(record.key) || label}, drawn as ${WIDGET_OF[type].toLowerCase().replace(/_/g, " ")}`), node: sec([txt(heading, "TITLE_SM", { tone: "MUTED" }), card], "SM"), planned: false });
      }
      if (!records.length) entries.push({ kind: "Records", case: "", note: sentence(`The language holds no ${typeWords(type)} record`), node: sec([muted(`The language holds no ${typeWords(type)} record.`)], "SM"), planned: false });
    } else entries.push(tableEntry(type, records, data, read));
    const title = capital(typeWords(type));
    return { file: `01-shared/05-data/${String(at + 1).padStart(2, "0")}-${slugOf(type)}.html`, title, category: "SHARED", part: "DATA", kinds: [], entries, ask: sentence(`What ${typeWords(type)} records the language holds, and how they are drawn`), layout: "CANVAS" };
  });
}
