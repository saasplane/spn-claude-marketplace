// The surface catalogue as the book keeps it: a folder, `docs/specs/surface/catalogue/`, holding `spcatalogue.json` (the
// outline a tool finds it by, with the file of each category) and one file for each category, `{ category, parts }`.
// A kind's units are one list `{ unit, part, role, props }`, and its placement and style hold the fields their part types,
// with every other value a note `{ on, value }`. This reads the folder, and gives the drawing and the page renderers,
// which read a kind's units by role and its placement by key, the same values in that older in-memory shape.
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

type Json = unknown;
type Obj = Record<string, Json>;
const isObj = (value: Json): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);

/** The outline's file, and the folder's name in a book or a plugin's refs. */
export const CATALOGUE_FILE = "spcatalogue.json";
export const CATALOGUE_FOLDER = "catalogue";

/** The catalogue as one read: the outline, and each category's kinds by part. */
export type CatalogueFolder = { outline: Obj; categories: Record<string, Record<string, Obj[]>>; folder: string };

/** The folder a path names: the folder itself, or the one `spcatalogue.json` stands in. */
export function catalogueFolderOf(path: string): string {
  return existsSync(path) && statSync(path).isDirectory() ? path : basename(path) === CATALOGUE_FILE ? dirname(path) : path;
}

/** Reads the catalogue's folder: the outline, then the file of each category it names, as the book wrote them. */
export function readCatalogueFolder(path: string): { catalogue: CatalogueFolder | null; problems: string[] } {
  const folder = catalogueFolderOf(path);
  const outlineFile = join(folder, CATALOGUE_FILE);
  if (!existsSync(outlineFile)) return { catalogue: null, problems: [`${outlineFile} does not exist`] };
  let outline: Json;
  try { outline = JSON.parse(readFileSync(outlineFile, "utf8")); } catch (e) { return { catalogue: null, problems: [`${outlineFile} is not JSON: ${(e as Error).message}`] }; }
  if (!isObj(outline) || !isObj(outline.files)) return { catalogue: null, problems: [`${outlineFile} names no \`files\`, the file of each category`] };
  const problems: string[] = [];
  const categories: Record<string, Record<string, Obj[]>> = {};
  for (const [category, name] of Object.entries(outline.files)) {
    if (typeof name !== "string") continue;
    const file = join(folder, name);
    let read: Json;
    try { read = JSON.parse(readFileSync(file, "utf8")); } catch (e) { problems.push(`${file} cannot be read: ${(e as Error).message}`); continue; }
    if (!isObj(read) || read.category !== category || !isObj(read.parts)) { problems.push(`${file} holds no \`parts\` of ${category}`); continue; }
    categories[category] = read.parts as Record<string, Obj[]>;
  }
  if (problems.length) return { catalogue: null, problems };
  return { catalogue: { outline, categories, folder }, problems: [] };
}

/** A unit list as the older shape read it: each role to its unit and props; a unit with no role under its own name. */
function unitsByRole(units: Json): Json {
  if (!Array.isArray(units)) return units;
  const out: Obj = {};
  for (const one of units) {
    if (!isObj(one)) continue;
    const props = isObj(one.props) ? one.props : {};
    const role = typeof one.role === "string" && one.role !== "" ? one.role : typeof one.unit === "string" ? one.unit : null;
    if (role === null) continue;
    out[role] = one.unit === null || one.unit === undefined ? { ...props } : { unit: one.unit, ...props };
  }
  return out;
}

/** Placement or style with its notes laid back under their own keys. */
function withNotes(value: Json): Json {
  if (!isObj(value)) return value;
  const { notes, ...rest } = value;
  const out: Obj = { ...rest };
  if (Array.isArray(notes)) for (const note of notes) if (isObj(note) && typeof note.on === "string") out[note.on] = note.value;
  return out;
}

/** A kind or a case as the older shape read it. */
function legacyItem(item: Obj): Obj {
  const out: Obj = { ...item, units: unitsByRole(item.units), placement: withNotes(item.placement), style: withNotes(item.style) };
  if (Array.isArray(item.notes)) {
    for (const note of item.notes) if (isObj(note) && typeof note.on === "string") out[note.on] = note.value;
    delete out.notes;
  }
  if (Array.isArray(item.cases)) out.cases = item.cases.map((one) => (isObj(one) ? legacyItem(one) : one));
  return out;
}

/** The catalogue in the in-memory shape the drawing and the renderers read: `{ outline, categories }`, units by role, notes by key. */
export function legacyCatalogue(read: CatalogueFolder): { version: string; outline: Obj; categories: Record<string, Record<string, Obj[]>> } {
  const categories: Record<string, Record<string, Obj[]>> = {};
  for (const [category, parts] of Object.entries(read.categories)) {
    categories[category] = Object.fromEntries(Object.entries(parts).map(([part, kinds]) => [part, (kinds ?? []).map(legacyItem)]));
  }
  const { files: _files, ...outline } = read.outline;
  return { version: "", outline, categories };
}
