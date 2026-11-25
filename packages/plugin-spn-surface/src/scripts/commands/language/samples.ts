// `spn-surface language samples write` — the samples of a design language, drawn the same way for every language.
//
//     spn-surface language samples write <language> [--out <dir>] [--book <folder>] [--spec <file>] [--catalogue <file>] [--template <file>]
//                                        [--assets <folder>] [--ds <version>] [--app <code>] [--only <text>]
//
// It reads the language's spec (`docs/specs/design-languages/<language>.spdl.json` of the book) and the surface catalogue, and for each
// category the language serves it draws each layout, each page kind, each case of each container kind and each case of each widget kind.
// Each is a tree of the design system's units, with the sample words of a made-up company, drawn by `spnutils apps surface render`
// for light and dark and for a desktop, a tablet and a phone. A unit the design system has not built is drawn as the planned mark, and its note says
// which unit it needs. It writes each page in the surface page template, `samples.json` and the home's `index.html` under `--out`, which is
// `docs/artifacts/public/surface/<language>/` of the book unless named. The same spec and catalogue write the same files, so a second run changes nothing.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type Action, FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { root as catalogueRoot } from "../catalogue/show.ts";
import { templateBeside } from "../page/copy.ts";
import { INDEX_SHELL } from "./_samples/index-shell.ts";
import { type Catalogue, type Spec, run as draw } from "./_samples/draw.ts";
import { installedVersion } from "./_samples/render.ts";

export const describe = "Draw a design language's samples: each layout, page kind, container case and widget form of each surface category it serves, in the surface page template";
export const usage = "<language> [--out <dir>] [--book <folder>] [--spec <file>] [--catalogue <file>] [--template <file>] [--assets <folder>] [--ds <version>] [--app <code>] [--only <text>]";

/** The book that holds the language's spec: the folder named, or the first of the working folder and its parents that is or holds one. */
function bookFrom(start: string): string | null {
  for (let at = resolve(start), up = 0; up < 8; up++, at = dirname(at)) {
    for (const candidate of [at, join(at, "spn-foundation")]) if (existsSync(join(candidate, "docs", "specs", "design-languages"))) return candidate;
  }
  return null;
}

function write(args: string[]): number {
  const words = readWords(args, { out: VALUE, book: VALUE, spec: VALUE, catalogue: VALUE, template: VALUE, assets: VALUE, ds: VALUE, app: VALUE, only: VALUE, place: VALUE, quiet: FLAG });
  if (words.paths.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(words.paths[0])) throw new UsageFault("takes one language, by its name, such as `surface`.");
  const language = words.paths[0];
  const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
  const specFile = words.value("spec") ?? (book ? join(book, "docs", "specs", "design-languages", `${language}.spdl.json`) : "");
  if (!specFile || !existsSync(specFile)) throw new UsageFault(`found no spec for \`${language}\`; name it with \`--spec <file>\` or the book with \`--book <folder>\`.`);
  const catalogueFile = words.value("catalogue") ?? join(catalogueRoot(), "catalogue.json");
  if (!existsSync(catalogueFile)) throw new UsageFault(`found no catalogue at ${catalogueFile}; name it with \`--catalogue <file>\`.`);
  const out = resolve(words.value("out") ?? (book ? join(book, "docs", "artifacts", "public", "surface", language) : ""));
  if (!out || out === resolve("/")) throw new UsageFault("needs `--out <dir>`, because no book was found to put the samples in.");
  const templateFile = words.value("template") ?? templateBeside();
  if (!templateFile || !existsSync(templateFile)) throw new UsageFault("found no surface page template; name it with `--template <file>`.");
  const spec = JSON.parse(readFileSync(specFile, "utf8")) as Spec;
  const catalogue = JSON.parse(readFileSync(catalogueFile, "utf8")) as Catalogue;
  const quiet = words.given("quiet");
  const result = draw({
    indexShell: INDEX_SHELL, language, catalogue, spec, out, template: readFileSync(templateFile, "utf8"), ds: words.value("ds") ?? installedVersion(), app: words.value("app") ?? "surface",
    assets: words.value("assets") ? resolve(words.value("assets") as string) : null, place: words.value("place") ?? `SaaS Plane · ${book ? resolve(book).split("/").pop() : language}`,
    only: words.value("only"), log: (line) => { if (!quiet) console.log(line); },
  });
  console.log(`OK ${out}: ${result.pages} pages, ${result.entries} sections, ${result.planned} planned`);
  for (const [category, parts] of Object.entries(result.byCategory)) console.log(`  ${category}: ${Object.entries(parts).map(([part, count]) => `${part.toLowerCase()} ${count}`).join(", ")}`);
  return 0;
}

export const actions: Record<string, Action> = { write: { describe, usage, run: write } };
