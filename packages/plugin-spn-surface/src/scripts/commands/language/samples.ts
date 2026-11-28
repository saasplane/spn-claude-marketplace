// `spn-surface language samples write` — the samples of a design language, drawn the same way for every language.
//
//     spn-surface language samples write <language> [--out <dir>] [--book <folder>] [--spec <file>] [--catalogue <folder>] [--template <file>]
//                                        [--assets <folder>] [--ds <version>] [--app <package> | --theme <file>] [--only <text>]
//
// It reads the language's folder (`docs/specs/surface/languages/<language>/` of the repository: `spdl.json`, `samples.json` and `data/`; the older
// names for one release; `surface` is read as `base`) and the surface catalogue's folder, and for each
// category the language serves it draws the samples home's shape (RULE.SUPPORT.SURFACE.643): the Layouts as one page of tabs, each
// page kind in its family's folder with its cases on the Case switch, each container and widget family as one page drawing every kind and case
// at once, and Media, Motion and Words. Each screen is a tree of the design system's units, carrying its category, with the language's own
// words from its samples.json, drawn by `spnutils apps surface render` for light and dark and for a desktop, a tablet and a phone, in the design
// system's default theme, or an app's with `--app <package>`, or a theme file's with `--theme <file>`. A picture a tree names by its language
// and path is copied beside the pages (RULE.SUPPORT.SURFACE.644). A unit the design system has not built is drawn as the planned mark, and its note says
// which unit it needs. It writes each page in the surface page template, `samples.json` and the home's `index.html` under `--out`, which is
// `docs/artifacts/public/surface/<language>/` of the book unless named. The same spec and catalogue write the same files, so a second run changes nothing.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOCS, surfacePagesDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { type Action, FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readCarriedCatalogue, specsRoot } from "../catalogue/show.ts";
import { templateBeside } from "../page/copy.ts";
import { bookFrom, findLanguage, loadData, parentName } from "./_folder.ts";
import { unnamedTypes } from "./_trees/data.ts";
import { INDEX_SHELL } from "./_trees/index-shell.ts";
import { type Catalogue, type Spec, run as draw } from "./_trees/draw.ts";
import { installedVersion } from "./_trees/render.ts";
import { installedNodes, resolveLanguage } from "./resolve.ts";

export const describe = "Draw a design language's samples home: Shared, then each category's layouts, pages, containers, widgets, media, motion and words, in the surface page template";
export const usage = "<language> [--out <dir>] [--book <folder>] [--spec <file>] [--catalogue <folder>] [--template <file>] [--assets <folder>] [--ds <version>] [--app <package> | --theme <file>] [--only <text>]";

/**
 * The words a language's samples draw: its own samples.json, else its parent's, up the chain, ending in the base this plugin
 * carries, so a language that sets no words of its own still draws real ones and never filler.
 */
function samplesOf(folder: string | null, book: string | null): unknown {
  for (let at = folder, guard = 0; at && guard < 8; guard++) {
    if (existsSync(join(at, "samples.json"))) return JSON.parse(readFileSync(join(at, "samples.json"), "utf8"));
    const spec = existsSync(join(at, "spdl.json")) ? (JSON.parse(readFileSync(join(at, "spdl.json"), "utf8")) as { extends?: unknown }) : null;
    const parent = parentName(spec?.extends);
    at = parent ? (findLanguage(parent, book, undefined)?.folder ?? null) : null;
  }
  const carried = join(specsRoot(), "languages", "base", "samples.json");
  return existsSync(carried) ? JSON.parse(readFileSync(carried, "utf8")) : null;
}

function write(args: string[]): number {
  const words = readWords(args, { out: VALUE, book: VALUE, spec: VALUE, catalogue: VALUE, template: VALUE, assets: VALUE, ds: VALUE, app: VALUE, theme: VALUE, only: VALUE, place: VALUE, quiet: FLAG });
  if (words.value("app") && words.value("theme")) throw new UsageFault("takes `--app <package>` or `--theme <file>`, never both: a sample wears one theme.");
  if (words.paths.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(words.paths[0])) throw new UsageFault("takes one language, by its name, such as `base`.");
  const asked = words.paths[0];
  const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
  const located = findLanguage(asked, book, words.value("spec"));
  const language = located?.name ?? asked;
  const specFile = located?.spec ?? "";
  for (const note of located?.notes ?? []) console.log(note);
  if (!specFile || !existsSync(specFile)) throw new UsageFault(`found no spec for \`${language}\`; name it with \`--spec <file>\` or the book with \`--book <folder>\`.`);
  const catalogueFolder = words.value("catalogue") ? resolve(words.value("catalogue") as string) : join(specsRoot(), "catalogue");
  const catalogue = readCarriedCatalogue(catalogueFolder) as unknown as Catalogue | null;
  if (!catalogue) throw new UsageFault(`found no catalogue at ${catalogueFolder}; name its folder with \`--catalogue <folder>\`.`);
  const out = resolve(words.value("out") ?? (book ? join(surfacePagesDir(join(book, DOCS)), language) : ""));
  if (!out || out === resolve("/")) throw new UsageFault("needs `--out <dir>`, because no book was found to put the samples in.");
  const templateFile = words.value("template") ?? templateBeside();
  if (!templateFile || !existsSync(templateFile)) throw new UsageFault("found no surface page template; name it with `--template <file>`.");
  const spec = JSON.parse(readFileSync(specFile, "utf8")) as Spec;
  const quiet = words.given("quiet");
  // THE ONE HAND-OVER: the language's dataset, read from its `data/` folder, goes to the drawers as `data`; a language with none passes null.
  const options: Parameters<typeof draw>[0] & { data: ReturnType<typeof loadData>["data"] | null } = {
    indexShell: INDEX_SHELL, language, catalogue, spec, out, template: readFileSync(templateFile, "utf8"), ds: words.value("ds") ?? installedVersion(), theme: { app: words.value("app") ?? null, theme: words.value("theme") ? resolve(words.value("theme") as string) : null },
    assets: words.value("assets") ? resolve(words.value("assets") as string) : null, place: words.value("place") ?? `SaaS Plane · ${book ? resolve(book).split("/").pop() : language}`,
    only: words.value("only"), log: (line) => { if (!quiet) console.log(line); },
    data: located?.folder && existsSync(join(located.folder, "data")) ? loadData(located.folder).data : null,
    samples: samplesOf(located?.folder ?? null, book),
    languageFolder: located?.folder ?? null,
    assetFile: (name, path) => {
      const folder = resolveLanguage(name, book, name === language ? [] : installedNodes(book ?? process.cwd())).found;
      return folder ? join(folder, "assets", path) : null;
    },
  };
  const result = draw(options);
  console.log(`OK ${out}: ${result.pages} pages, ${result.entries} sections, ${result.planned} planned`);
  for (const [category, parts] of Object.entries(result.byCategory)) console.log(`  ${category}: ${Object.entries(parts).map(([part, count]) => `${part.toLowerCase()} ${count}`).join(", ")}`);
  const unnamed = unnamedTypes(options.data ?? null);
  if (unnamed.length) console.log(`  unnamed: ${unnamed.join(", ")} (no catalogue widget; drawn as a table)`);
  return 0;
}

export const actions: Record<string, Action> = { write: { describe, usage, run: write } };
