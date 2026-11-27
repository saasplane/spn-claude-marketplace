// `spn-surface language data check` — a design language's own dataset, read before a tree is prepared from it (RULE.SUPPORT.SURFACE.629).
//
//     spn-surface language data check <language> [--book <folder>] [--spec <file>] [--catalogue <file>] [--icons <file>]
//
// The dataset is `docs/specs/surface/languages/<language>/data/`: `index.json` and one file for each kind of record. It refuses a link that
// does not resolve, a record file with no medium or no roles, a stored number the data can derive (a count, a rating average, a cart
// total), and a page kind the language picks whose records are missing, and an icon the design system's DSIconType does not hold (`refs/support/surface/icons.json`, or `--icons <file>`). A language kept in the old flat file has no data, and is said so.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { UsageFault, VALUE, readWords, type Action } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { root as catalogueRoot } from "../catalogue/show.ts";
import { bookFrom, checkData, findLanguage, iconsFrom, loadData } from "./_folder.ts";

const checkWords = "Check a design language's dataset: links that resolve, a medium and roles for each record file, no stored number the data can derive, the records its page kinds need";
const usage = "<language> [--book <folder>] [--spec <file>] [--catalogue <file>] [--icons <file>]";

function check(args: string[]): number {
  const words = readWords(args, { book: VALUE, spec: VALUE, catalogue: VALUE, icons: VALUE });
  if (words.paths.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(words.paths[0])) throw new UsageFault("takes one language, by its name, such as `surface`.");
  const name = words.paths[0];
  const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
  const found = findLanguage(name, book, words.value("spec"));
  if (!found) throw new UsageFault(`found no spec for \`${name}\`; name it with \`--spec <file>\` or the book with \`--book <folder>\`.`);
  for (const note of found.notes) console.log(note);
  if (!found.folder) { console.log(`REFUSED language-data ${name}: ${found.spec} is not in a language folder, so it has no data/; move it to <name>/<name>.spdl.json and write its data/`); return 1; }
  const catalogueFile = words.value("catalogue") ?? join(catalogueRoot(), "catalogue.json");
  const catalogue = existsSync(catalogueFile) ? JSON.parse(readFileSync(catalogueFile, "utf8")) : null;
  const { data, problems } = loadData(found.folder);
  if (!problems.length) problems.push(...checkData(data, JSON.parse(readFileSync(found.spec, "utf8")), catalogue, iconsFrom(words.value("icons") ?? join(catalogueRoot(), "icons.json"))));
  if (problems.length) {
    for (const problem of problems) console.log(`REFUSED language-data ${name}: ${problem}`);
    return 1;
  }
  console.log(`OK ${found.folder}/data: ${Object.keys(data.files).length} record file(s) agree`);
  return 0;
}

export const describe = "A design language's own dataset: the records its samples and pages are drawn from";
export const actions: Record<string, Action> = { check: { describe: checkWords, usage, run: check } };
