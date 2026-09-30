#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The coverage report — written, built and proved
//           docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § What a Where row declares
//           docs/04-capabilities/02-support/01-apps/10-providers/ts/03-structure.md § What a Where Row May Name
//           docs/registers/decisions.md RD.DEVEX.WORKSPACE.191
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// The coverage report's measurement: how much of a repository is written, built and proved, and
// the gaps between the three, per package, per app and for the repository.
//
//     spn-devex coverage measure <repo> [--json]
//
// It never writes the page (RD.DEVEX.WORKSPACE.149); the units, the gaps and what a Where row
// declares are in the capability chapter "Scripts in spn-devex", § The coverage measurement reads
// the Where tables against a seat table.

import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { withOffset } from "../../lib/clock.ts";
import {
  DOCS, FACE, SEAT, capabilitiesDir, constructsDir, reportsDir, slashes,
} from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { read } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import { measure as measureTests, nodesOf, TESTS_REPORT } from "../behaviours/coverage.ts";

const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };
const entriesOf = (dir: string): string[] => { try { return readdirSync(dir).sort(); } catch { return []; } };

/** Where the coverage report lands in a repository's pocket, named by its kind (RD.DEVEX.WORKSPACE.149). */
export const COVERAGE_REPORT = join(reportsDir(DOCS), "coverage-report.html");

/** Folders that hold generated code, which no chapter declares, and folders nothing here reads. */
const GENERATED = new Set(["generated", "validators"]);
const NEVER_READ = new Set(["node_modules", "dist", "build", ".output", ".nx", "coverage"]);
const skipped = (name: string): boolean => GENERATED.has(name) || NEVER_READ.has(name) || name.startsWith(".");

/** A file that is source a person wrote: code or styles, never a type stub the toolchain emits. */
const SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|css|scss|sql)$/;
const isSource = (name: string): boolean => SOURCE.test(name) && !name.endsWith(".d.ts");

/** A code span that names a path: a folder, a file with a known extension, or an elided name. */
const PATH_CHARS = /^[\w@.\-/…*]+$/;
const EXTENSION = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json|css|scss|sql|env|md|html|ya?ml|hcl|tf|sh|svg|txt|toml)$/;
const looksLikeAPath = (span: string): boolean =>
  PATH_CHARS.test(span) && !/^\.+$/.test(span) && (span.includes("/") || EXTENSION.test(span) || span.startsWith("…"));

const digestOf = (value: unknown): string =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)}`;

/** The kind a folder declares in its `spkind.json`, or null. */
const kindOf = (folder: string): string | null => {
  const text = read(join(folder, "spkind.json"));
  if (text === null) return null;
  try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
};

// ---------------------------------------------------------------------------- the seats

/** One seat: a path relative to its node, and whether it is one file or a folder covering its tree. */
export type Seat = { path: string; folder: boolean };

/** Whether a folder holds at least one source file anywhere beneath it, generated folders aside. */
function holdsSource(dir: string): boolean {
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
function modulesOf(node: string, appKind: string | null): Array<{ path: string; kind: string | null }> {
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
    const read = livesIn >= 0 ? [cells[livesIn] ?? ""] : cells.slice(1);
    for (const cell of read) {
      let before: string | null = null;
      for (const match of cell.matchAll(/`([^`]+)`/g)) {
        const span = match[1].trim().replace(/[.,;]+$/, "");
        if (!looksLikeAPath(span)) continue;
        const bare = !span.replace(/\/$/, "").includes("/");
        const path = bare && before !== null ? `${holderOf(before)}${span}` : span;
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

// ---------------------------------------------------------------------------- proved seats

/** Every test file under a node's `tests/`, run output aside. */
function testFiles(node: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of entriesOf(dir)) {
      if (NEVER_READ.has(entry) || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      if (isDir(full)) walk(full);
      else if (/\.(ts|tsx|mts|js|mjs|jsx)$/.test(entry)) out.push(full);
    }
  };
  walk(join(node, "tests"));
  return out;
}

const withoutExtension = (path: string): string => path.replace(/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|css|scss|sql)$/, "");
const withoutCaseSuffix = (path: string): string =>
  withoutExtension(path).replace(/\.(spec|test|ct\.spec|int\.spec|int\.test|contract\.spec)$/, "").replace(/\.(ct|int|contract)$/, "");

/** The paths a test tree may mirror a seat at: without `src/`, without an app's `modules/`, without `entry/ui/`. */
function mirrorKeys(seat: Seat): string[] {
  const path = seat.folder ? seat.path : withoutExtension(seat.path);
  const keys = new Set<string>();
  const bare = path.replace(/^src\//, "");
  keys.add(bare);
  keys.add(bare.replace(/^modules\//, ""));
  for (const key of [...keys]) keys.add(key.replace(/(^|\/)entry\/ui\//, "$1"));
  return [...keys].filter((key) => key !== "");
}

/**
 * Whether a test in the node proves a seat: a case file sits at the seat's own path beneath a tier
 * folder, or a test file imports into the seat by a relative path.
 */
function provedSeat(node: string, seat: Seat, tests: Array<{ file: string; mirror: string; imports: string[] }>): boolean {
  const keys = mirrorKeys(seat);
  return tests.some((test) => {
    const mirrored = seat.folder
      ? keys.some((key) => test.mirror.startsWith(`${key}/`))
      : keys.includes(withoutCaseSuffix(test.mirror));
    if (mirrored) return true;
    return test.imports.some((target) => seat.folder
      ? target === seat.path || target.startsWith(`${seat.path}/`)
      : withoutExtension(target) === withoutExtension(seat.path) || `${target}/index` === withoutExtension(seat.path));
  });
}

/** Each test file, with its path beneath its tier folder and the node-relative targets of its relative imports. */
function readTests(node: string): Array<{ file: string; mirror: string; imports: string[] }> {
  return testFiles(node).map((file) => {
    const inTests = slashes(relative(join(node, "tests"), file));
    const text = read(file) ?? "";
    const imports = [...text.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)]
      .map((match) => slashes(relative(node, resolve(dirname(file), match[1]))));
    return { file, mirror: inTests.split("/").slice(1).join("/"), imports };
  });
}

// ---------------------------------------------------------------------------- the measurement

type StatedNotBuilt = { construct: string; chapter: string | null; reason: string; path?: string; hint?: string };
type Level = {
  name: string;
  path: string;
  kind: string | null;
  whereRoot: string;
  chapters: string[];
  written: { rows: number; constructs: number };
  built: { constructs: number };
  proved: { rows: number };
  statedNotBuilt: { count: number; items: StatedNotBuilt[] };
  builtNotStated: { count: number; proved: number; seats: Array<{ seat: string; proved: boolean }> };
  builtNotProved: { count: number; ids: string[] };
  declaresNothing: Array<{ chapter: string; path: string }>;
};

/** A repository whose type is FOUNDATION: its rows are promises, so there is nothing built or proved to count. */
export function foundationAbsence(root: string): Record<string, unknown> | null {
  const text = read(join(root, "sprepo.json"));
  if (text === null) return null;
  let type: string | undefined;
  try { type = (JSON.parse(text) as { type?: string }).type; } catch { return null; }
  if (type !== "FOUNDATION") return null;
  const name = basename(root);
  return {
    repository: name, measuredAt: null,
    absence: `${name} declares FOUNDATION: its behaviour rows are promises and it holds no packages or apps, so ` +
      `nothing is built or proved here and no coverage report is owed.`,
    repositoryLevel: null, packages: [], apps: [], findings: [], digest: null, report: null,
  };
}

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

/** The measurement for one repository. */
export function measure(root: string): Record<string, unknown> {
  const nameOf = (node: string): string => slashes(relative(root, node)) || ".";
  const docs = join(root, DOCS);
  const findings: Array<{ file: string; message: string }> = [];

  // Proved: the tests report's own join.
  const tests = measureTests(root) as { rows: Array<{ id: string; file: string; status: string | null; found: string | null }>; digest: string; measuredAt: string | null };
  const isProved = (row: { status: string | null; found: string | null }): boolean => (row.found ?? row.status) === "SUCCESS";

  // Written: every construct seat file, and the rows at each construct's own path.
  const constructs = new Set(pagesUnder(constructsDir(docs)));
  // A chapter binds to its construct by `realizes`, the construct's id; the file name is the fallback.
  const byId = new Map([...constructs].map((key) => [docBlock(read(join(constructsDir(docs), key)) ?? "").id, key]));
  const rowsOf = new Map<string, typeof tests.rows>();
  const behaviours = `${DOCS}/${SEAT.behaviors}/`;
  for (const row of tests.rows) {
    if (!row.file.startsWith(behaviours) || basename(row.file) === FACE) continue;
    const key = row.file.slice(behaviours.length);
    constructs.add(key);
    rowsOf.set(key, [...(rowsOf.get(key) ?? []), row]);
  }

  // The levels: each project under `apps/` and `packages/` that declares a kind.
  const levels = nodesOf(root).filter((node) => /^(apps|packages)\/[^/]+$/.test(nameOf(node)));
  const byName = new Map(levels.map((node) => [basename(node), node]));
  const seatsByNode = new Map(levels.map((node) => [node, seatsOf(node, kindOf(node))]));
  const modulesByNode = new Map(levels.map((node) => [node, modulesOf(node, kindOf(node)).map((module) => module.path)]));
  const stated = new Map(levels.map((node) => [node, new Set<string>()]));

  // Each capability page, owned by the node its folder names.
  type Chapter = { file: string; node: string; construct: string | null; unresolved: Array<{ path: string; hint?: string }>; declaring: number; where: boolean };
  const chapters: Chapter[] = [];
  const capabilities = capabilitiesDir(docs);
  const declaresNothing = new Map(levels.map((node) => [node, [] as Array<{ chapter: string; path: string }>]));

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

  /** Why a construct chapter is not built, or an empty list where it is. */
  const whyNotBuilt = (chapter: Chapter): StatedNotBuilt[] => {
    const construct = chapter.construct!;
    if (!chapter.where) return [{ construct, chapter: chapter.file, reason: "the chapter has no `## Where` section" }];
    const out: StatedNotBuilt[] = chapter.unresolved.map((one) => ({
      construct, chapter: chapter.file, reason: "a Where path resolves to nothing", path: one.path, ...(one.hint ? { hint: one.hint } : {}),
    }));
    if (out.length === 0 && chapter.declaring === 0) out.push({ construct, chapter: chapter.file, reason: "the Where section declares no code" });
    return out;
  };

  const levelOf = (node: string): Level => {
    const kind = kindOf(node);
    const own = chapters.filter((chapter) => chapter.node === node);
    const constructChapters = own.filter((chapter) => chapter.construct !== null);
    const owned = [...new Set(constructChapters.map((chapter) => chapter.construct!))].sort();
    const built = owned.filter((construct) => constructChapters.filter((chapter) => chapter.construct === construct).every((chapter) => whyNotBuilt(chapter).length === 0));
    const rows = owned.flatMap((construct) => rowsOf.get(construct) ?? []);
    const builtRows = built.flatMap((construct) => rowsOf.get(construct) ?? []);
    const testsHere = readTests(node);
    const unstated = (seatsByNode.get(node) ?? []).filter((seat) => !stated.get(node)!.has(seat.path))
      .map((seat) => ({ seat: seat.path, proved: provedSeat(node, seat, testsHere) }));
    const items = constructChapters.flatMap(whyNotBuilt);
    return {
      name: basename(node), path: nameOf(node), kind, whereRoot: whereRoot(kind) === "" ? "." : whereRoot(kind),
      chapters: own.map((chapter) => chapter.file),
      written: { rows: rows.length, constructs: owned.length },
      built: { constructs: built.length },
      proved: { rows: rows.filter(isProved).length },
      statedNotBuilt: { count: owned.length - built.length, items },
      builtNotStated: { count: unstated.length, proved: unstated.filter((one) => one.proved).length, seats: unstated },
      builtNotProved: { count: builtRows.filter((row) => !isProved(row)).length, ids: builtRows.filter((row) => !isProved(row)).map((row) => row.id) },
      declaresNothing: declaresNothing.get(node)!,
    };
  };

  const all = levels.map(levelOf);
  const packages = all.filter((level) => level.path.startsWith("packages/"));
  const apps = all.filter((level) => level.path.startsWith("apps/"));

  // The repository: each construct once, built where it has a chapter and every chapter of it is built.
  const constructChapters = chapters.filter((chapter) => chapter.construct !== null);
  const chaptered = [...new Set(constructChapters.map((chapter) => chapter.construct!))];
  // Written at the repository: a construct holding rows, or one some package or app has a chapter for.
  const written = [...constructs].filter((construct) => (rowsOf.get(construct) ?? []).length > 0 || chaptered.includes(construct)).sort();
  const repoBuilt = chaptered.filter((construct) => constructChapters.filter((chapter) => chapter.construct === construct).every((chapter) => whyNotBuilt(chapter).length === 0));
  const repoItems: StatedNotBuilt[] = written
    .filter((construct) => !repoBuilt.includes(construct))
    .flatMap((construct) => chaptered.includes(construct)
      ? constructChapters.filter((chapter) => chapter.construct === construct).flatMap(whyNotBuilt)
      : [{ construct, chapter: null, reason: "the construct has rows and no capability chapter in any package or app" }]);
  const builtRows = repoBuilt.flatMap((construct) => rowsOf.get(construct) ?? []);
  const repositoryLevel = {
    written: { rows: tests.rows.length, constructs: written.length },
    built: { constructs: repoBuilt.length },
    proved: { rows: tests.rows.filter(isProved).length },
    statedNotBuilt: { count: written.length - repoBuilt.length, items: repoItems },
    builtNotStated: { count: all.reduce((sum, level) => sum + level.builtNotStated.count, 0), proved: all.reduce((sum, level) => sum + level.builtNotStated.proved, 0) },
    builtNotProved: { count: builtRows.filter((row) => !isProved(row)).length },
    repositoryRows: tests.rows.filter((row) => !row.file.startsWith(behaviours) || basename(row.file) === FACE).length,
  };

  const measured = {
    repository: basename(root),
    absence: null,
    units: {
      written: "behaviour rows · constructs", built: "constructs", proved: "behaviour rows",
      statedNotBuilt: "constructs", builtNotStated: "seats in src/", builtNotProved: "behaviour rows",
    },
    repositoryLevel,
    packages,
    apps,
    findings,
    testsReport: { path: TESTS_REPORT, measuredAt: tests.measuredAt, digest: tests.digest },
  };
  const digest = digestOf(measured);
  const page = read(join(root, COVERAGE_REPORT));
  return {
    ...measured,
    measuredAt: withOffset(new Date()),
    digest,
    report: { path: COVERAGE_REPORT, exists: page !== null, current: page !== null && page.includes(digest) },
  };
}

// ---------------------------------------------------------------------------- the reading

/** The measurement as a person reads it in a terminal: the per-level table and the totals. */
export function describeResult(result: Record<string, any>): string[] {
  if (result.absence !== null) return [`${result.repository} — no measurement. ${result.absence}`];
  const head = ["Level", "Kind", "Written rows", "constructs", "Built", "Proved", "Stated, not built", "Built, not stated", "(proved)", "Built, not proved"];
  const rowOf = (name: string, kind: string, level: any): string[] => [
    name, kind, String(level.written.rows), String(level.written.constructs), String(level.built.constructs), String(level.proved.rows),
    String(level.statedNotBuilt.count), String(level.builtNotStated.count), String(level.builtNotStated.proved), String(level.builtNotProved.count),
  ];
  const table = [head, ...[...result.packages, ...result.apps].map((level: any) => rowOf(level.path, level.kind ?? "—", level)),
    rowOf(result.repository, "repository", result.repositoryLevel)];
  const widths = head.map((_, column) => Math.max(...table.map((row) => row[column].length)));
  const lines = [
    `${result.repository} — written, built and proved, measured ${result.measuredAt}`,
    `  units: written in ${result.units.written} · built in ${result.units.built} · proved in ${result.units.proved} · ` +
    `stated, not built in ${result.units.statedNotBuilt} · built, not stated in ${result.units.builtNotStated} · built, not proved in ${result.units.builtNotProved}`,
    ...table.map((row) => `  ${row.map((cell, column) => column < 2 ? cell.padEnd(widths[column]) : cell.padStart(widths[column])).join("  ")}`),
  ];
  const total = result.repositoryLevel;
  lines.push(`  totals: ${total.written.rows} rows in ${total.written.constructs} constructs written · ${total.built.constructs} constructs built · ` +
    `${total.proved.rows} rows proved · ${total.statedNotBuilt.count} stated, not built · ${total.builtNotStated.count} seats built, not stated ` +
    `(${total.builtNotStated.proved} proved) · ${total.builtNotProved.count} rows built, not proved`);
  for (const one of result.findings) lines.push(`  ${one.file}: ${one.message}`);
  lines.push(`  ${result.report.path} — ${!result.report.exists ? "not written yet" : result.report.current ? "current, nothing to write" : "stale"} · ${result.digest}`);
  return lines;
}

export const describe = "the coverage report's measurement — written, built and proved, and the gaps, per package, app and repository";

/** `spn-devex coverage measure <repo> [--json]`. */
export function run(args: string[]): number {
  const root = resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");
  const result = foundationAbsence(root) ?? measure(root);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else for (const line of describeResult(result)) console.log(line);
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
