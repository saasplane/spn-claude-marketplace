// `spn-surface language check` — a design language's whole folder, read against the contract (RULE.SUPPORT.SURFACE.628 to 640).
//
//     spn-surface language check <language> [--book <folder>] [--spec <file>] [--catalogue <folder>] [--icons <file>]
//
// It reads the language the way the agent will draw from it, and refuses what would not draw: the chain `extends` names, each
// language of it found the way `language resolve` finds it; `spdl.json`, `types.json`, `samples.json`, each data file and
// `assets/sources.json` against their states in support-contract-ts, whose validators this plugin bundles; the data's links, roles,
// derived numbers and tenancy; each sample page against the page kinds of its category in the catalogue; and each type named after a
// module's state, such as `IAM.Principal`, against the symbols of the installed module (`spnutils apps installed`), awaiting
// contract where no installed module holds it. It notes when the repository's Support is newer than the one this plugin bundles,
// and the design system spnutils draws the samples with. It changes nothing. The theme check of an app stays spnutils'.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { readCarriedCatalogue, root as surfaceRoot, specsRoot } from "../catalogue/show.ts";
import { bookFrom, checkData, checkTypesAgainstStates, findLanguage, iconsFrom, loadData, parentName } from "./_folder.ts";
import { runTables } from "./_tables.ts";
import { installedNodes, resolveLanguage } from "./resolve.ts";

export const describe = "Check a design language's whole folder against the contract: its chain, its files, its data, its samples and its module types";
export const usage = "<language> [--book <folder>] [--spec <file>] [--catalogue <folder>] [--icons <file>] | <app> --construct <construct.md>";

export async function run(args: string[]): Promise<number> {
  if (args.includes("--construct")) return runTables(args);
  const words = readWords(args, { book: VALUE, spec: VALUE, catalogue: VALUE, icons: VALUE });
  if (words.paths.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(words.paths[0])) throw new UsageFault("takes one language, by its name, such as `base`.");
  const name = words.paths[0];
  const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
  const found = findLanguage(name, book, words.value("spec"));
  if (!found) throw new UsageFault(`found no language \`${name}\`; name its spdl.json with \`--spec <file>\` or the repository with \`--book <folder>\`.`);
  for (const note of found.notes) console.log(note);
  const catalogue = readCarriedCatalogue(words.value("catalogue") ? resolve(words.value("catalogue") as string) : join(specsRoot(), "catalogue"));
  if (!catalogue) throw new UsageFault("found no catalogue; name its folder with `--catalogue <folder>`.");
  const problems: string[] = [];

  // The chain: each parent found as `language resolve` finds it, ending in base.
  const nodes = installedNodes(book ?? process.cwd());
  const spec = JSON.parse(readFileSync(found.spec, "utf8")) as Record<string, unknown>;
  const chain = [found.name];
  for (let parent = parentName(spec.extends), guard = 0; parent && guard < 8; guard++) {
    const step = resolveLanguage(parent, book, nodes);
    if (!step.found) { problems.push(`${found.name} extends ${parent}, which resolves nowhere: ${step.steps.join("; ")}`); break; }
    chain.push(parent);
    parent = parentName((JSON.parse(readFileSync(join(step.found, "spdl.json"), "utf8")) as Record<string, unknown>).extends);
  }
  if (spec.name !== found.name) problems.push(`spdl.json names the language "${String(spec.name)}", and its folder is ${found.name}`);
  // RULE.SUPPORT.SURFACE.642: a category holds seven parts and no Theme part; a colour, a mode, a size or a radius is the app's own theme.
  const categories = (spec as { categories?: Record<string, Record<string, unknown>> }).categories ?? {};
  for (const [category, parts] of Object.entries(categories)) {
    if (parts && typeof parts === "object" && "THEME" in parts) problems.push(`categories.${category}.THEME is a Theme part, and a language holds none: move its values to the app's src/spn.surface.json, under themes.categories.${category}`);
  }
  if (found.name !== "base" && chain[chain.length - 1] !== "base") problems.push(`${found.name}'s chain ends in ${chain[chain.length - 1]}, and every product language extends base`);

  // Each file against its contract state.
  // The validators are the contract's, bundled at build; loaded here so the construct-tables check needs none of them.
  const { readContractProblems } = await import("./_contract.ts");
  problems.push(...readContractProblems(found.folder));

  // The data, the samples and the tenancy.
  const { data, problems: reading } = loadData(found.folder);
  problems.push(...reading);
  if (!reading.length) problems.push(...checkData(data, spec, catalogue, iconsFrom(words.value("icons") ?? join(surfaceRoot(), "icons.json"))));
  problems.push(...checkTypesAgainstStates(data, nodes));

  for (const note of supportNotes(book)) console.log(note);
  if (problems.length) {
    for (const problem of problems) console.log(`REFUSED language ${found.name}: ${problem}`);
    return 1;
  }
  console.log(`OK ${found.folder}: the chain ${chain.join(" → ")}, ${Object.keys(data.files).length} data file(s), ${Object.keys(data.types).length} type(s) agree`);
  return 0;
}

/** The Support this plugin bundles, beside the repository's, as notes: a newer repository asks for the plugins to be updated. */
function supportNotes(book: string | null): string[] {
  const bundled = (() => {
    const file = join(import.meta.dirname, "..", "..", "..", "refs", "specs", "surface", "support.json");
    return existsSync(file) ? String((JSON.parse(readFileSync(file, "utf8")) as { version?: unknown }).version ?? "") : "";
  })();
  const pin = (() => {
    const file = book ? join(book, "node_modules", "@saasplane", "support-contract-ts", "package.json") : "";
    return file && existsSync(file) ? String((JSON.parse(readFileSync(file, "utf8")) as { version?: unknown }).version ?? "") : "";
  })();
  const notes: string[] = [];
  if (bundled) notes.push(`note: this plugin reads languages with support-contract-ts ${bundled}; spnutils draws the samples with its own design system`);
  if (bundled && pin && pin.localeCompare(bundled, undefined, { numeric: true }) > 0) notes.push(`note: the repository installs support-contract-ts ${pin}, newer than the plugin's ${bundled}: update the plugins`);
  return notes;
}
