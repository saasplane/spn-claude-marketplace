// RESTATES: RULE.SUPPORT.SURFACE.601 — spn-surface carries the catalogue of each release's book, and
// the design skill reads it one slice at a time; RULE.SUPPORT.SURFACE.392 — what reads a copy the
// plugin carries reads that copy alone, never the book, a sibling checkout or the machine's home folder.
//
// `spn-surface catalogue show` — one slice of the catalogue, for the agent:
//
//     spn-surface catalogue show <CATEGORY>                      the category's parts, one line per kind
//     spn-surface catalogue show <CATEGORY> <PART>               that part's kinds, each whole but its cases
//     spn-surface catalogue show <CATEGORY> <PART> <KIND>        one kind whole, with every case
//     … [--case <CASE>] [--json]                                  one case of the kind; the same slice as JSON
//
// THE COPY IS `refs/support/surface/catalogue.json`, which `scripts/build-plugins.mjs` copies from
// the book's `docs/specs/surface/catalogue.json` at every build. A restate keeps the catalogue's rules
// and none of its kinds, so a second copy of the kinds never drifts from the catalogue: a step that
// needs a kind runs this command.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "Print one slice of the surface catalogue this plugin carries: a category, one part of it, or one kind with its cases";
export const usage = "<CATEGORY> [<PART>] [<KIND>] [--case <CASE>] [--json]";

export const CATALOGUE = "catalogue.json";

type Case = { code: string; when?: string; units?: unknown; placement?: unknown; style?: unknown; status?: string; why?: string };
type Kind = {
  code: string; title: string; description: string; status: string;
  guidance?: { for?: { persons?: string[] }; chooseWhen?: string; rules?: string[] };
  config?: unknown; units?: unknown; placement?: unknown; style?: unknown;
  order?: unknown; level?: unknown; cases?: Case[]; defaultCase?: string;
};
type CategoryInfo = { family: string; person: string; description: string };
type PartNote = { code: string; description?: string; definedIn?: string };
export type Catalogue = {
  version: string;
  outline: { categories: Record<string, CategoryInfo>; partNotes?: Record<string, Record<string, PartNote>> };
  categories: Record<string, Record<string, Kind[]>>;
};

/** The folder the copy sits in: the plugin's own refs, three folders above both `scripts/commands/catalogue/` and `dist/commands/catalogue/`, unless a test names another. */
export function root(): string {
  return process.env.SPN_SURFACE_CATALOGUE_ROOT ?? resolve(import.meta.dirname, "..", "..", "..", "refs", "support", "surface");
}

/** A value of the catalogue matched as it is spelled there, whatever case of letters was typed. */
function pick(word: string, have: string[], what: string, within: string): string {
  const found = have.find((one) => one.toUpperCase() === word.toUpperCase());
  if (!found) throw new UsageFault(`no ${what} \`${word}\`${within}. The ${what}s: ${have.join(" · ")}`);
  return found;
}

/** A structured fact on one line, as the catalogue writes it. */
const json = (value: unknown): string => JSON.stringify(value);
const has = (value: unknown): boolean => value !== undefined && value !== null && !(typeof value === "object" && Object.keys(value as object).length === 0);

/** The lines of one kind: its head, then each fact it carries, then its cases' codes or, whole, the cases. */
function kindLines(kind: Kind, cases: "codes" | Case[]): string[] {
  const out = [`${kind.code} · ${kind.title} · ${kind.status}`, `  ${kind.description}`];
  const persons = kind.guidance?.for?.persons;
  if (persons?.length) out.push(`  for: ${persons.join(" · ")}`);
  if (kind.guidance?.chooseWhen) out.push(`  choose when: ${kind.guidance.chooseWhen}`);
  if (kind.guidance?.rules?.length) out.push(`  rules: ${kind.guidance.rules.join(" · ")}`);
  for (const [name, value] of [["order", kind.order], ["level", kind.level], ["units", kind.units], ["placement", kind.placement], ["style", kind.style], ["config", kind.config]] as const)
    if (has(value)) out.push(`  ${name}: ${typeof value === "string" ? value : json(value)}`);
  const all = kind.cases ?? [];
  if (cases === "codes") {
    if (all.length) out.push(`  cases: ${all.map((one) => (one.code === kind.defaultCase ? `${one.code} (default)` : one.code)).join(" · ")}`);
    return out;
  }
  for (const one of cases) {
    out.push(`  case ${one.code}${one.code === kind.defaultCase ? " (default)" : ""} · ${one.status ?? kind.status}${one.when ? ` — ${one.when}` : ""}`);
    for (const [name, value] of [["units", one.units], ["placement", one.placement], ["style", one.style]] as const)
      if (has(value)) out.push(`    ${name}: ${json(value)}`);
    if (one.why) out.push(`    why: ${one.why}`);
  }
  return out;
}

export function run(args: string[]): number {
  const words = readWords(args, { json: FLAG, case: VALUE });
  const [categoryWord, partWord, kindWord, ...more] = words.paths;
  if (!categoryWord || more.length) throw new UsageFault("takes a category, and then a part and a kind if you want them: `catalogue show MARKETPLACE WIDGETS DS_CARD_WIDGET`.");
  const caseWord = words.value("case");
  if (caseWord && !kindWord) throw new UsageFault("`--case` narrows one kind: name the category, the part and the kind first.");

  const file = join(root(), CATALOGUE);
  if (!existsSync(file)) {
    process.stderr.write(`catalogue show: this release carries no ${CATALOGUE}\n`);
    return 1;
  }
  const catalogue = JSON.parse(readFileSync(file, "utf8")) as Catalogue;
  const category = pick(categoryWord, Object.keys(catalogue.categories), "category", "");
  const info = catalogue.outline.categories[category];
  const parts = catalogue.categories[category];
  const notes = catalogue.outline.partNotes?.[category] ?? {};

  if (!partWord) {
    const slice = { version: catalogue.version, category, ...info, parts: Object.fromEntries(Object.entries(parts).map(([part, kinds]) =>
      [part, { description: notes[part]?.description ?? null, kinds: kinds.map((kind) => ({ code: kind.code, title: kind.title, status: kind.status, description: kind.description })) }])) };
    if (words.given("json")) { console.log(JSON.stringify(slice, null, 2)); return 0; }
    console.log(`${category} · ${info.family} · ${info.person} — ${info.description} (catalogue ${catalogue.version})`);
    for (const [part, kinds] of Object.entries(parts)) {
      console.log(`\n${part} (${kinds.length})${notes[part]?.description ? ` — ${notes[part].description}` : ""}`);
      for (const kind of kinds) console.log(`  ${kind.code} · ${kind.title} · ${kind.status} — ${kind.description}`);
    }
    return 0;
  }

  const part = pick(partWord, Object.keys(parts), "part", ` in ${category}`);
  const kinds = parts[part];
  if (!kindWord) {
    if (words.given("json")) { console.log(JSON.stringify({ version: catalogue.version, category, part, note: notes[part] ?? null, kinds: kinds.map(({ cases, ...kind }) => ({ ...kind, cases: (cases ?? []).map((one) => one.code) })) }, null, 2)); return 0; }
    console.log(`${category} ${part} (${kinds.length})${notes[part]?.description ? ` — ${notes[part].description}` : ""}`);
    for (const kind of kinds) console.log(["", ...kindLines(kind, "codes")].join("\n"));
    return 0;
  }

  const code = pick(kindWord, kinds.map((kind) => kind.code), "kind", ` in ${category} ${part}`);
  const kind = kinds.find((one) => one.code === code)!;
  const cases = kind.cases ?? [];
  const chosen = caseWord ? [cases.find((one) => one.code === pick(caseWord, cases.map((c) => c.code), "case", ` of ${code}`))!] : cases;
  if (words.given("json")) { console.log(JSON.stringify({ version: catalogue.version, category, part, kind: { ...kind, cases: chosen } }, null, 2)); return 0; }
  console.log(`${category} ${part}`);
  console.log(kindLines(kind, chosen).join("\n"));
  return 0;
}
