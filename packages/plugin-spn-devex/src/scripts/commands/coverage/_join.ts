// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § What a Where row declares
//           docs/04-capabilities/02-support/01-apps/10-providers/ts/03-structure.md § What a Where Row May Name
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The coverage report — written, built and proved
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// The join both reports read Built from: each capability chapter's Where section, read against the
// seat table of the project that owns it, decides which design topics are built; and each behaviour
// belongs to the domain folder it is written in. `coverage measure` and `behaviours coverage` both
// import it, and neither imports the other for it, so the two can never count Built two ways.

import { readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  DOCS, FACE, SEAT, behaviorsDir, capabilitiesDir, constructsDir, slashes,
} from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { read } from "../../../../../plugin-support-lib/src/lib/runs.ts";

export const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
export const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };
export const entriesOf = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };

/** Folders that hold generated code, which no chapter declares, and folders nothing here reads. */
const GENERATED = new Set(["generated", "validators"]);
export const NEVER_READ = new Set(["node_modules", "dist", "build", ".output", ".nx", "coverage"]);
const skipped = (name: string): boolean => GENERATED.has(name) || NEVER_READ.has(name) || name.startsWith(".");

/** A file that is source a person wrote: code or styles, never a type stub the toolchain emits. */
const SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|css|scss|sql)$/;
const isSource = (name: string): boolean => SOURCE.test(name) && !name.endsWith(".d.ts");

/** A code span that names a path: a folder, a file with a known extension, or an elided name. */
const PATH_CHARS = /^[\w@.\-/…*]+$/;
const EXTENSION = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json|css|scss|sql|env|md|html|ya?ml|hcl|tf|sh|svg|txt|toml)$/;
const looksLikeAPath = (span: string): boolean =>
  PATH_CHARS.test(span) && !/^\.+$/.test(span) && (span.includes("/") || EXTENSION.test(span) || span.startsWith("…"));

/** The kind a folder declares in its `spkind.json`, or null. */
export const kindOf = (folder: string): string | null => {
  const text = read(join(folder, "spkind.json"));
  if (text === null) return null;
  try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
};

// ---------------------------------------------------------------------------- the seats

/** One seat: a path relative to its node, and whether it is one file or a folder covering its tree. */
export type Seat = { path: string; folder: boolean };

/** Whether a folder holds at least one source file anywhere beneath it, generated folders aside. */
export function holdsSource(dir: string): boolean {
  for (const entry of entriesOf(dir)) {
    if (skipped(entry)) continue;
    const full = join(dir, entry);
    if (isDir(full) ? holdsSource(full) : isSource(entry)) return true;
  }
  return false;
}

/** The folders directly in `dir` that hold source, generated and private folders aside. */
const foldersIn = (node: string, dir: string): Seat[] => entriesOf(join(node, dir))
  .filter((entry) => !skipped(entry) && !entry.startsWith("_") && isDir(join(node, dir, entry)) && holdsSource(join(node, dir, entry)))
  .map((entry) => ({ path: `${dir}/${entry}`, folder: true }));

/** The source files directly in `dir`. */
const filesIn = (node: string, dir: string): Seat[] => entriesOf(join(node, dir))
  .filter((entry) => isSource(entry) && isFile(join(node, dir, entry)))
  .map((entry) => ({ path: `${dir}/${entry}`, folder: false }));

/** Every source file under `dir`, each a seat of its own, never entering a generated folder. */
function filesUnder(node: string, dir: string): Seat[] {
  const out: Seat[] = [...filesIn(node, dir)];
  for (const entry of entriesOf(join(node, dir))) {
    if (!skipped(entry) && isDir(join(node, dir, entry))) out.push(...filesUnder(node, `${dir}/${entry}`));
  }
  return out;
}

/** One folder as a single seat, where it exists and holds source. */
const folderSeat = (node: string, dir: string): Seat[] =>
  isDir(join(node, dir)) && holdsSource(join(node, dir)) ? [{ path: dir, folder: true }] : [];

/**
 * A server module's seats, from its base: `src` in a package, `src/modules/<module>` in an app.
 * A package's root barrel is generated, so it is never a wiring file; an app module's is.
 */
function serverModuleSeats(node: string, base: string, inPackage: boolean): Seat[] {
  const perFile = ["app/services", "app/repositories", "app/entities", "app/utils", "entry/api/controllers", "entry/queue/listeners", "contract/states"];
  return [
    ...perFile.flatMap((dir) => filesUnder(node, `${base}/${dir}`)),
    ...foldersIn(node, `${base}/app/support`),
    ...filesIn(node, base).filter((seat) => !(inPackage && /\/index\.tsx?$/.test(seat.path))),
    ...folderSeat(node, `${base}/migrations`),
  ];
}

/** A web module's seats, from its `entry/ui/` folder. */
function webModuleSeats(node: string, ui: string): Seat[] {
  return [
    ...["pages", "hooks", "components"].flatMap((dir) => foldersIn(node, `${ui}/${dir}`)),
    ...foldersIn(node, `${ui}/utils`),
    ...filesIn(node, `${ui}/utils`),
    ...folderSeat(node, `${ui}/routes`),
    ...foldersIn(node, `${ui}/widgets`),
    ...filesIn(node, `${ui}/widgets`),
  ];
}

/** The folders directly under `src/`, less the ones a kind reads more finely. */
const otherTopFolders = (node: string, handled: string[]): Seat[] =>
  foldersIn(node, "src").filter((seat) => !handled.includes(seat.path.slice("src/".length)));

/** A private folder directly under `src/`, such as a vendored `_shadcn/`, is a seat of its own. */
const privateTopFolders = (node: string): Seat[] => entriesOf(join(node, "src"))
  .filter((entry) => entry.startsWith("_") && isDir(join(node, "src", entry)) && holdsSource(join(node, "src", entry)))
  .map((entry) => ({ path: `src/${entry}`, folder: true }));

/** Where a kind's Where paths are read from, relative to its node. */
export function whereRoot(kind: string | null): string {
  return kind === "MODULE_WEB" ? "src/entry/ui" : "";
}

/** The module folders an app composes, each with the kind its seats are read by. */
export function modulesOf(node: string, appKind: string | null): Array<{ path: string; kind: string | null }> {
  return entriesOf(join(node, "src", "modules"))
    .filter((entry) => isDir(join(node, "src", "modules", entry)))
    .map((entry) => ({
      path: `src/modules/${entry}`,
      kind: kindOf(join(node, "src", "modules", entry)) ?? (appKind === "APP_SERVER" ? "MODULE_SERVER" : appKind === "APP_WEB" ? "MODULE_WEB" : null),
    }));
}

/** Every seat a node's `src/` holds, per its kind (the TypeScript table). */
export function seatsOf(node: string, kind: string | null): Seat[] {
  let seats: Seat[];
  switch (kind) {
    case "MODULE_SERVER": seats = serverModuleSeats(node, "src", true); break;
    case "MODULE_WEB": seats = webModuleSeats(node, "src/entry/ui"); break;
    case "SUPPORT_WEB":
      seats = [
        ...foldersIn(node, "src/ui/components"),
        ...["boot", "core", "hooks", "managers", "utils", "widgets"].flatMap((dir) => folderSeat(node, `src/ui/${dir}`)),
        ...folderSeat(node, "src/assets"),
        ...otherTopFolders(node, ["ui", "assets"]),
      ];
      break;
    case "SUPPORT_SERVER":
    case "SUPPORT_UNIVERSAL": {
      const triad = ["contract", "app", "entry"].every((dir) => isDir(join(node, "src", dir)));
      seats = [
        ...filesIn(node, "src/contract/states"),
        ...foldersIn(node, "src/contract/states"),
        ...(triad ? [...foldersIn(node, "src/app"), ...foldersIn(node, "src/entry")] : []),
        ...otherTopFolders(node, triad ? ["contract", "app", "entry"] : ["contract"]),
      ];
      break;
    }
    case "CLIENT_API": seats = isFile(join(node, "src", "index.ts")) ? [{ path: "src/index.ts", folder: false }] : []; break;
    case "TOOLCHAIN": seats = foldersIn(node, "src"); break;
    case "APP_SERVER":
    case "APP_WEB":
      seats = [
        ...filesIn(node, "src"),
        ...modulesOf(node, kind).flatMap((module) =>
          module.kind === "MODULE_SERVER" ? serverModuleSeats(node, module.path, false)
            : module.kind === "MODULE_WEB" ? webModuleSeats(node, `${module.path}/entry/ui`) : []),
      ];
      break;
    case "APP_UTILITY":
      seats = [
        ...filesUnder(node, "src/app/services"),
        ...filesUnder(node, "src/contract/states"),
        ...foldersIn(node, "src/app/support"),
        ...foldersIn(node, "src/entry"),
        ...filesIn(node, "src"),
      ];
      break;
    default: seats = [];
  }
  const known = new Set(seats.map((seat) => seat.path));
  for (const seat of privateTopFolders(node)) if (!known.has(seat.path)) seats.push(seat);
  return [...new Map(seats.map((seat) => [seat.path, seat])).values()].sort((left, right) => left.path.localeCompare(right.path));
}

// ---------------------------------------------------------------------------- the Where section

/** The `## Where` section of a chapter, or null where it has none. */
export function whereSection(text: string): string | null {
  const match = text.match(/^## Where[ \t]*$([\s\S]*?)(?=^## |(?![\s\S]))/m);
  return match === null ? null : match[1];
}

/**
 * Every path a Where table names, in order. The `Lives in` column is read where the header names
 * it, and every cell after the first where it does not. A bare name in a cell — `interface.ts`
 * after `src/cache/interface.ts`, or `…5000` after `src/migrations/…3000` — is the sibling of the
 * path before it in the same cell.
 */
export function wherePaths(section: string): string[] {
  const out: string[] = [];
  let livesIn = -1;
  let header = true;
  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) { header = true; continue; }
    const cells = trimmed.replace(/^\||\|$/g, "").split("|");
    if (cells.every((cell) => /^[\s:-]*$/.test(cell))) continue;
    if (header) {
      header = false;
      livesIn = cells.findIndex((cell) => cell.trim().toLowerCase() === "lives in");
      continue;
    }
    const cellsRead = livesIn >= 0 ? [cells[livesIn] ?? ""] : cells.slice(1);
    for (const cell of cellsRead) {
      let before: string | null = null;
      for (const match of cell.matchAll(/`([^`]+)`/g)) {
        const span = match[1].trim().replace(/[.,;]+$/, "");
        if (!looksLikeAPath(span)) continue;
        const bare = !span.replace(/\/$/, "").includes("/");
        const path: string = bare && before !== null ? `${holderOf(before)}${span}` : span;
        out.push(path);
        before = path;
      }
    }
  }
  return out;
}

/** The folder holding a path, with its trailing slash: `src/cache/` for `src/cache/a.ts` or `src/cache/redis/`. */
const holderOf = (path: string): string => {
  const trimmed = path.replace(/\/$/, "");
  const at = trimmed.lastIndexOf("/");
  return at < 0 ? "" : trimmed.slice(0, at + 1);
};

/** The files or folders a declared path names under a root. An ellipsis or `*` is a wildcard within one folder. */
export function resolvePath(root: string, path: string): string[] {
  const clean = path.replace(/\/$/, "");
  if (!/[…*]/.test(clean)) return isFile(join(root, clean)) || isDir(join(root, clean)) ? [join(root, clean)] : [];
  const folder = holderOf(clean);
  let name = clean.slice(folder.length);
  if (name.includes("…") && !EXTENSION.test(name)) name = `${name}*`;
  const pattern = new RegExp(`^${name.split(/[…*]/).map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
  return entriesOf(join(root, folder)).filter((entry) => pattern.test(entry)).map((entry) => join(root, folder, entry));
}

// ---------------------------------------------------------------------------- the chapters

/** Every `.md` under a folder, faces aside, as paths relative to it. */
function pagesUnder(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of entriesOf(dir)) {
    const full = join(dir, entry);
    if (isDir(full)) out.push(...pagesUnder(full, `${prefix}${entry}/`));
    else if (entry.endsWith(".md") && entry !== FACE) out.push(`${prefix}${entry}`);
  }
  return out;
}

/** A document's `spn:doc` block, or an empty object where it has none or it does not parse. */
const docBlock = (text: string): { id?: string; realizes?: string[] } => {
  const found = text.match(/<!--\s*spn:doc\s*([\s\S]*?)-->/);
  if (found === null) return {};
  try { return JSON.parse(found[1]) as { id?: string; realizes?: string[] }; } catch { return {}; }
};

export type StatedNotBuilt = { construct: string; chapter: string | null; reason: string; path?: string; hint?: string };

/** One capability page, owned by the project its folder names, and what its Where section resolved to. */
export type Chapter = { file: string; node: string; construct: string | null; unresolved: Array<{ path: string; hint?: string }>; declaring: number; where: boolean };

/** Everything the capability chapters say about one repository's projects. */
export type Chapters = {
  /** Every construct: each construct seat file, and each behaviours file holding rows. */
  constructs: Set<string>;
  chapters: Chapter[];
  seatsByNode: Map<string, Seat[]>;
  /** The seats some Where row names, per project. */
  stated: Map<string, Set<string>>;
  declaresNothing: Map<string, Array<{ chapter: string; path: string }>>;
  findings: Array<{ file: string; message: string }>;
  /** The constructs some chapter realizes, each built where every chapter of it is built. */
  built: string[];
};

/** Why a construct chapter is not built, or an empty list where it is. */
export function whyNotBuilt(chapter: Chapter): StatedNotBuilt[] {
  const construct = chapter.construct!;
  if (!chapter.where) return [{ construct, chapter: chapter.file, reason: "the chapter has no `## Where` section" }];
  const out: StatedNotBuilt[] = chapter.unresolved.map((one) => ({
    construct, chapter: chapter.file, reason: "a Where path resolves to nothing", path: one.path, ...(one.hint ? { hint: one.hint } : {}),
  }));
  if (out.length === 0 && chapter.declaring === 0) out.push({ construct, chapter: chapter.file, reason: "the Where section declares no code" });
  return out;
}

/** The constructs among `owned` whose every chapter in `chapters` is built. */
export const builtAmong = (chapters: Chapter[], owned: string[]): string[] =>
  owned.filter((construct) => chapters.filter((chapter) => chapter.construct === construct).every((chapter) => whyNotBuilt(chapter).length === 0));

/**
 * Each capability chapter joined to its construct and read against its project's seats.
 *
 * `rowKeys` are the behaviours files that hold rows, relative to `03-behaviors/`; a file holding
 * rows is a construct even where no construct page exists yet. `levels` are the projects under
 * `apps/` and `packages/` that declare a kind.
 */
export function readChapters(root: string, rowKeys: Iterable<string>, levels: string[]): Chapters {
  const nameOf = (node: string): string => slashes(relative(root, node)) || ".";
  const docs = join(root, DOCS);
  const findings: Array<{ file: string; message: string }> = [];
  const constructs = new Set(pagesUnder(constructsDir(docs)));
  // A chapter binds to its construct by `realizes`, the construct's id; the file name is the fallback.
  const byId = new Map([...constructs].map((key) => [docBlock(read(join(constructsDir(docs), key)) ?? "").id, key]));
  for (const key of rowKeys) constructs.add(key);

  const byName = new Map(levels.map((node) => [basename(node), node]));
  const seatsByNode = new Map(levels.map((node) => [node, seatsOf(node, kindOf(node))]));
  const modulesByNode = new Map(levels.map((node) => [node, modulesOf(node, kindOf(node)).map((module) => module.path)]));
  const stated = new Map(levels.map((node) => [node, new Set<string>()]));
  const declaresNothing = new Map(levels.map((node) => [node, [] as Array<{ chapter: string; path: string }>]));
  const chapters: Chapter[] = [];
  const capabilities = capabilitiesDir(docs);

  /** The node whose folder holds a path, or null. */
  const ownerOf = (abs: string): string | null => levels.find((node) => abs === node || abs.startsWith(`${node}/`)) ?? null;

  for (const page of pagesUnder(capabilities)) {
    const parts = page.split("/");
    const at = parts.findIndex((part, index) => index < parts.length - 1 && byName.has(part));
    const file = `${DOCS}/${SEAT.capabilities}/${page}`;
    if (at < 0) {
      findings.push({ file, message: "its folder names no package or app in this repository, so nothing it declares is counted" });
      continue;
    }
    const node = byName.get(parts[at])!;
    const kind = kindOf(node);
    const direct = at === parts.length - 2;
    const key = [...parts.slice(0, at), parts[parts.length - 1]].join("/");
    const text = read(join(root, file)) ?? "";
    const declared = (docBlock(text).realizes ?? []).map((id) => byId.get(id)).find((one) => one !== undefined);
    const construct = direct ? declared ?? (constructs.has(key) ? key : null) : null;
    const section = whereSection(text);
    const chapter: Chapter = { file, node, construct, unresolved: [], declaring: 0, where: section !== null };
    chapters.push(chapter);
    if (section === null) continue;
    const from = join(node, whereRoot(kind));
    // A path two rows name is one declaration.
    for (const path of [...new Set(wherePaths(section))]) {
      const found = resolvePath(from, path);
      if (found.length === 0) {
        const fromRepo = resolvePath(root, path).length > 0;
        const fromNode = whereRoot(kind) !== "" && resolvePath(node, path).length > 0;
        chapter.unresolved.push({
          path,
          ...(fromRepo || fromNode ? { hint: `it resolves from the ${fromRepo ? "repository root" : "package folder"}; a ${kind ?? "node"}'s Where path is read from ${slashes(join(nameOf(node), whereRoot(kind)))}/` } : {}),
        });
        continue;
      }
      let declares = false;
      for (const abs of found) {
        const owner = ownerOf(abs);
        if (owner === null) { declares = true; continue; }
        const rel = slashes(relative(owner, abs));
        const seats = seatsByNode.get(owner) ?? [];
        const own = stated.get(owner)!;
        const inside = seats.filter((seat) => rel === seat.path || (seat.folder && rel.startsWith(`${seat.path}/`)));
        if (inside.length > 0) { inside.forEach((seat) => own.add(seat.path)); declares = true; continue; }
        if (!isDir(abs)) { declares = true; continue; }
        const beneath = seats.filter((seat) => seat.path.startsWith(`${rel}/`));
        if ((modulesByNode.get(owner) ?? []).includes(rel)) { beneath.forEach((seat) => own.add(seat.path)); declares = true; continue; }
        if (beneath.length === 0 && !holdsSource(abs)) { declares = true; continue; }
        declaresNothing.get(node)!.push({ chapter: file, path });
      }
      if (declares) chapter.declaring += 1;
    }
  }

  const realized = chapters.filter((chapter) => chapter.construct !== null);
  const built = builtAmong(realized, [...new Set(realized.map((chapter) => chapter.construct!))]);
  return { constructs, chapters, seatsByNode, stated, declaresNothing, findings, built };
}

// ---------------------------------------------------------------------------- the domains

const BEHAVIOURS = `${DOCS}/${SEAT.behaviors}/`;

/** The construct a behaviours file speaks for, relative to `03-behaviors/`, or null for a face or a file outside the seat. */
export function constructKeyOf(file: string): string | null {
  return file.startsWith(BEHAVIOURS) && basename(file) !== FACE ? file.slice(BEHAVIOURS.length) : null;
}

/**
 * The domain a behaviours file belongs to: the first entry under `03-behaviors/`, which is a folder,
 * or the page itself where it sits there directly. Null for the seat's own README and for any file
 * outside the seat, whose behaviours are about the whole repository.
 */
export function domainOf(file: string): string | null {
  if (!file.startsWith(BEHAVIOURS)) return null;
  const rel = file.slice(BEHAVIOURS.length);
  if (rel === FACE) return null;
  return rel.split("/")[0];
}

/** The domain a construct key belongs to: its first path part. */
export const domainOfKey = (key: string): string => key.split("/")[0];

/**
 * A domain's name, as its README's title says it after the dash (`# Behaviors — Web` → `Web`), or
 * its folder's name without the number where the README says nothing.
 */
export function domainName(root: string, domain: string): string {
  const face = domain.endsWith(".md") ? join(behaviorsDir(join(root, DOCS)), domain) : join(behaviorsDir(join(root, DOCS)), domain, FACE);
  const title = /^# (.+)$/m.exec(read(face) ?? "")?.[1]?.trim() ?? "";
  const named = title.split(/\s+[—–-]\s+/).slice(1).join(" — ").trim();
  return named || domain.replace(/\.md$/, "").replace(/^\d+-/, "");
}

/** Every domain folder under `03-behaviors/`, and every domain a row names, in the docs tree's order. */
export function domainsOf(root: string, named: Iterable<string>): string[] {
  const folders = entriesOf(behaviorsDir(join(root, DOCS))).filter((entry) => isDir(join(behaviorsDir(join(root, DOCS)), entry)));
  return [...new Set([...folders, ...named])].sort();
}
