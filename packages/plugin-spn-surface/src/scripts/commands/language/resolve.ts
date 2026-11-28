// `spn-surface language resolve` — where a language is, found live (RULE.SUPPORT.SURFACE.640).
//
//     spn-surface language resolve <language> [--book <folder>] [--json]
//
// It looks in the repository's own `docs/specs/surface/languages/<name>/`, then in each node `spnutils apps installed list` gives, a
// published package's `surface/languages/<name>/` or a linked one's `dist/surface/languages/<name>/`, then in the languages this plugin's
// `languages.json` lists (a path inside the plugin, or a package fetched once at its version into `~/.saasplane/languages/<package>@<version>/`),
// then in the base this plugin carries; it prints each step it takes and the folder it found. It never reads a merged copy in `.claude/saasplane/`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { specsRoot } from "../catalogue/show.ts";
import { type InstalledNode, LANGUAGES, SPEC_FILE, bookFrom, findLanguage } from "./_folder.ts";
import { spnutils } from "./_trees/render.ts";

export const describe = "Find a design language live: the repository's own, then an installed package's, then one this plugin lists, then the base it carries";
export const usage = "<language> [--book <folder>] [--json]";

/** The nodes `spnutils apps installed --json` lists from a folder, or none where it does not answer. */
export function installedNodes(from: string): InstalledNode[] {
  const run = spawnSync(spnutils(), ["apps", "installed", "list", "--json"], { cwd: from, encoding: "utf8" });
  if (run.error || run.status !== 0) return [];
  try {
    const parsed = JSON.parse(run.stdout.slice(run.stdout.indexOf("{"))) as { nodes?: InstalledNode[] };
    return Array.isArray(parsed.nodes) ? parsed.nodes : [];
  } catch {
    return [];
  }
}

/** One language this plugin lists: a path inside the plugin, or a published package at a version. */
export type ListedLanguage = { name: string; package: string; version: string | null };

/** The plugin's `languages.json`, which its build writes; a test names another with SPN_SURFACE_LANGUAGES. */
export function listedLanguages(): ListedLanguage[] {
  const file = process.env.SPN_SURFACE_LANGUAGES ?? resolve(import.meta.dirname, "..", "..", "..", "languages.json");
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { languages?: ListedLanguage[] };
    return Array.isArray(parsed.languages) ? parsed.languages : [];
  } catch {
    return [];
  }
}

/** The machine's store of fetched languages, `~/.saasplane/languages/`; a test names another with SPN_SURFACE_LANGUAGE_STORE. */
export const languageStore = (): string => process.env.SPN_SURFACE_LANGUAGE_STORE ?? join(homedir(), ".saasplane", "languages");

/**
 * The folder of a listed package's language: fetched once, by `npm pack <package>@<version>`, into the store as
 * `<package>@<version>/`, and read from there every time after. Returns null where the fetch fails.
 */
export function fetchListed(entry: ListedLanguage): string | null {
  const home = join(languageStore(), `${entry.package}@${entry.version}`);
  const folder = join(home, "surface", "languages", entry.name);
  if (existsSync(join(folder, SPEC_FILE))) return folder;
  const work = mkdtempSync(join(tmpdir(), "surface-language-"));
  try {
    const pack = spawnSync("npm", ["pack", `${entry.package}@${entry.version}`, "--pack-destination", work, "--silent"], { encoding: "utf8" });
    const tarball = pack.status === 0 ? pack.stdout.trim().split("\n").pop() : "";
    if (!tarball) return null;
    const unpack = spawnSync("tar", ["-xzf", join(work, tarball), "-C", work], { encoding: "utf8" });
    if (unpack.status !== 0 || !existsSync(join(work, "package"))) return null;
    mkdirSync(join(home, ".."), { recursive: true });
    rmSync(home, { recursive: true, force: true });
    renameSync(join(work, "package"), home);
    return existsSync(join(folder, SPEC_FILE)) ? folder : null;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** A language's folder, and each step taken to find it. */
export function resolveLanguage(name: string, book: string | null, nodes: InstalledNode[]): { found: string | null; steps: string[] } {
  const steps: string[] = [];
  const own = book ? findLanguage(name, book, undefined) : null;
  steps.push(`own: ${book ? join(book, LANGUAGES, name) : "no repository"}${own ? " — found" : " — none"}`);
  if (own) return { found: own.folder, steps };
  for (const node of nodes.filter((one) => !one.own)) {
    for (const folder of [join(node.root, "surface", "languages", name), join(node.root, "dist", "surface", "languages", name)]) {
      if (existsSync(join(folder, SPEC_FILE))) { steps.push(`installed: ${node.name}@${node.version ?? "—"} — found`); return { found: folder, steps }; }
    }
  }
  steps.push(`installed: ${nodes.filter((one) => !one.own).length} package(s) — none ships ${name}`);
  const listed = listedLanguages().find((one) => one.name === name && one.version !== null);
  if (listed) {
    const fetched = fetchListed(listed);
    steps.push(`listed: ${listed.package}@${listed.version} → ${fetched ?? "could not be fetched"}`);
    if (fetched) return { found: fetched, steps };
  } else steps.push("listed: none");
  const carried = join(specsRoot(), "languages", name);
  const has = existsSync(join(carried, SPEC_FILE));
  steps.push(`plugin: ${carried}${has ? " — found" : " — none"}`);
  return { found: has ? carried : null, steps };
}

export function run(args: string[]): number {
  const words = readWords(args, { book: VALUE, json: FLAG });
  if (words.paths.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(words.paths[0])) throw new UsageFault("takes one language, by its name, such as `base`.");
  const name = words.paths[0];
  const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
  const result = resolveLanguage(name, book, installedNodes(book ?? process.cwd()));
  if (words.given("json")) { console.log(JSON.stringify({ language: name, ...result }, null, 2)); return result.found ? 0 : 1; }
  for (const step of result.steps) console.log(`  ${step}`);
  if (!result.found) { console.log(`REFUSED language ${name}: it resolves nowhere`); return 1; }
  console.log(`OK ${name}: ${result.found}`);
  return 0;
}
