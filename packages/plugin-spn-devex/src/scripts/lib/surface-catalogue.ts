// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The catalogue and a language as generated regions (`docs face write --block surface-catalogue|surface-design-language`):
// one reader, one resolver, one frame. Nothing is read or written here; `face` places the markers.

import { existsSync, readFileSync } from "node:fs";
import { keyInWords } from "./render.ts";
import { basename, dirname, join } from "node:path";

/** What a kind is in a language: the contract's `SPSurfaceItemStateType`. */
export type State = "PICKED" | "INHERITED" | "CUSTOMISED" | "NEW" | "NOT_USED";
export type Source = "OWN" | "INHERITED" | "NONE";
type Json = unknown;
type Obj = Record<string, Json>;

export type Kind = { code: string; title: string; description?: string; floor?: boolean; definedIn?: string; config?: Obj; guidance?: Obj };
export type PartOutline = { code: string; title: string; description: string; holds: string; values: Record<string, string[]> };
export type GroupOutline = { code: string; title: string; description: string; parts: PartOutline[] };
export type CategoryOutline = { family: string; person: string; description: string };
export type Outline = { groups: GroupOutline[]; categories: Record<string, CategoryOutline>; partNotes: Record<string, Record<string, { none?: string }>> };
export type Catalogue = { version: string; outline: Outline; categories: Record<string, Record<string, Kind[]>> };

const isObj = (v: Json): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const strings = (v: Json): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** One line, as a catalog row carries it: runs of space are one, and a ` | ` would split the row. */
const clean = (s: Json): string => String(s).replace(/\s+/g, " ").replace(/ \| /g, " / ").trim();
const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ---------------------------------------------------------------------------- the reader

/** The catalogue file, or the reasons it cannot be drawn. */
export function readCatalogue(file: string): { catalogue: Catalogue | null; problems: string[] } {
  if (!existsSync(file)) return { catalogue: null, problems: [`${file} does not exist`] };
  let raw: Json;
  try { raw = JSON.parse(readFileSync(file, "utf8")); } catch (e) { return { catalogue: null, problems: [`${file} is not JSON: ${(e as Error).message}`] }; }
  return checkCatalogue(raw);
}

export function checkCatalogue(raw: Json): { catalogue: Catalogue | null; problems: string[] } {
  const problems: string[] = [];
  if (!isObj(raw)) return { catalogue: null, problems: ["the catalogue is not an object"] };
  if (typeof raw.version !== "string") problems.push("`version` is missing");
  const outline = raw.outline;
  if (!isObj(outline) || !Array.isArray(outline.groups) || !isObj(outline.categories)) problems.push("`outline` is missing: it holds `groups`, `categories` and `partNotes`, the outline the contract states");
  if (!isObj(raw.categories)) problems.push("`categories` is missing");
  if (problems.length) return { catalogue: null, problems };
  const o = outline as unknown as Outline;
  const cats = raw.categories as Record<string, Record<string, Kind[]>>;
  const parts = o.groups.flatMap((g) => g.parts.map((p) => ({ group: g.code, ...p })));
  for (const [cat, byPart] of Object.entries(cats)) {
    if (!o.categories[cat]) problems.push(`category ${cat} has no entry in \`outline.categories\``);
    for (const p of parts.filter((p) => p.group !== "SHARED"))
      if (!Array.isArray(byPart[p.code])) problems.push(`${cat}.${p.code} is missing`);
  }
  for (const cat of Object.keys(o.categories)) if (!cats[cat]) problems.push(`\`outline.categories\` names ${cat}, which \`categories\` lacks`);
  for (const g of o.groups) for (const p of g.parts) if (!p.title || !p.description) problems.push(`outline part ${p.code} has no title or description`);
  if (problems.length) return { catalogue: null, problems };
  return { catalogue: { version: raw.version as string, outline: o, categories: cats }, problems: [] };
}

// ---------------------------------------------------------------------------- a language, read as §5 states it

export type Decision = { source?: Source; pick?: "ALL" | string[]; customise?: Array<{ code: string; change?: string; config?: Obj }>; add?: Kind[]; notUsed?: string[]; values?: Obj; why?: string };
export type Spec = {
  name: string; version: string; extends: string | null;
  domain: { product: string; records: string[]; reads: string };
  references: Array<Obj>;
  shared: Record<string, Decision>;
  categories: Record<string, Record<string, Decision> & { family?: string; person?: string; from?: string }>;
  gaps: Record<string, Json[] | { source?: Source; why?: string; cases?: Json[] }>;
};

/** A gap is a list of cases, or a part-shaped object holding them in `cases` with the why of an empty one. */
function gapCases(g: Json): Json[] | null {
  if (Array.isArray(g)) return g;
  return isObj(g) && Array.isArray(g.cases) ? g.cases : null;
}

const SPEC_TOP = ["name", "version", "extends", "domain", "references", "shared", "categories", "gaps"];
const DECISION_KEYS = ["source", "pick", "customise", "add", "notUsed", "values", "why"];

/** A language file against §5's shape and nothing else: what the old shape (site, app, serves, lower-case parts) fails on is named line by line. */
export function checkSpec(raw: Json, outline: Outline): { spec: Spec | null; problems: string[] } {
  const problems: string[] = [];
  if (!isObj(raw)) return { spec: null, problems: ["the spec is not an object"] };
  for (const k of Object.keys(raw)) if (!SPEC_TOP.includes(k)) problems.push(`\`${k}\` is not a key of a language (${SPEC_TOP.join(", ")})`);
  for (const k of SPEC_TOP) if (!(k in raw)) problems.push(`\`${k}\` is missing`);
  if (typeof raw.name !== "string") problems.push("`name` is not a string");
  if (typeof raw.version !== "string") problems.push("`version` is not a string");
  if (raw.extends !== null && typeof raw.extends !== "string") problems.push("`extends` is null or \"parent@major\"");
  if (isObj(raw.domain)) {
    for (const k of Object.keys(raw.domain)) if (!["product", "records", "reads"].includes(k)) problems.push(`\`domain.${k}\` is not a key of a domain (product, records, reads)`);
    if (typeof raw.domain.product !== "string") problems.push("`domain.product` is not a string");
    if (!Array.isArray(raw.domain.records)) problems.push("`domain.records` is not a list");
    if (typeof raw.domain.reads !== "string") problems.push("`domain.reads` is not a string");
  } else if ("domain" in raw) problems.push("`domain` is not an object");
  if ("references" in raw && !Array.isArray(raw.references)) problems.push("`references` is not a list");
  const sharedParts = outline.groups.find((g) => g.code === "SHARED")?.parts.map((p) => p.code) ?? [];
  const decision = (where: string, d: Json): void => {
    if (!isObj(d)) { problems.push(`\`${where}\` is not a decision`); return; }
    for (const k of Object.keys(d)) if (!DECISION_KEYS.includes(k)) problems.push(`\`${where}.${k}\` is not a key of a decision (${DECISION_KEYS.join(", ")})`);
    if (d.source !== undefined && !["OWN", "INHERITED", "NONE"].includes(d.source as string)) problems.push(`\`${where}.source\` is OWN, INHERITED or NONE`);
    if (d.values !== undefined && !isObj(d.values)) problems.push(`\`${where}.values\` is not an object`);
    if (isObj(d.values) && typeof d.values.mtype !== "string") problems.push(`\`${where}.values.mtype\` names the part`);
  };
  if (isObj(raw.shared)) {
    for (const [k, d] of Object.entries(raw.shared)) {
      if (!sharedParts.includes(k)) problems.push(`\`shared.${k}\` is not a shared part (${sharedParts.join(", ")})`);
      else decision(`shared.${k}`, d);
    }
  } else if ("shared" in raw) problems.push("`shared` is not an object");
  const styled = outline.groups.filter((g) => g.code !== "SHARED").flatMap((g) => g.parts.map((p) => p.code));
  if (isObj(raw.categories)) {
    for (const [cat, byPart] of Object.entries(raw.categories)) {
      if (!isObj(byPart)) { problems.push(`\`categories.${cat}\` is not an object`); continue; }
      const fresh = !outline.categories[cat];
      if (fresh) for (const k of ["family", "person", "from"]) if (typeof byPart[k] !== "string") problems.push(`\`categories.${cat}.${k}\`: a category of its own names its family, person and from`);
      for (const [k, d] of Object.entries(byPart)) {
        if (fresh && ["family", "person", "from"].includes(k)) continue;
        if (!styled.includes(k)) problems.push(`\`categories.${cat}.${k}\` is not a part (${styled.join(", ")})`);
        else decision(`categories.${cat}.${k}`, d);
      }
    }
  } else if ("categories" in raw) problems.push("`categories` is not an object");
  if (isObj(raw.gaps)) {
    for (const k of ["notInTheLanguage", "designSystemGaps", "whatTheAgentMustAsk"]) if (!gapCases(raw.gaps[k])) problems.push(`\`gaps.${k}\` is a list, or { source, why, cases[] }`);
  } else if ("gaps" in raw) problems.push("`gaps` is not an object");
  return problems.length ? { spec: null, problems } : { spec: raw as unknown as Spec, problems: [] };
}

/** `surface@1` → its name and major. */
export function parentRef(extendsRef: string): { name: string; major: string } | null {
  const m = /^([a-z][\w-]*)@(\d+)$/.exec(extendsRef);
  return m ? { name: m[1], major: m[2] } : null;
}

/** The chain of languages, the root first, read from `<name>.spdl.json` beside the spec or in the catalogue's `design-languages` folder. */
export function readChain(specFile: string, outline: Outline, otherFolders: string[]): { chain: Spec[]; problems: string[] } {
  const chain: Spec[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  let file = specFile;
  for (;;) {
    if (!existsSync(file)) { problems.push(`${file} does not exist`); break; }
    let raw: Json;
    try { raw = JSON.parse(readFileSync(file, "utf8")); } catch (e) { problems.push(`${file} is not JSON: ${(e as Error).message}`); break; }
    const { spec, problems: p } = checkSpec(raw, outline);
    if (!spec) { problems.push(...p.map((x) => `${basename(file)}: ${x}`)); break; }
    if (seen.has(spec.name)) { problems.push(`${spec.name} extends itself through a cycle`); break; }
    seen.add(spec.name);
    chain.unshift(spec);
    if (spec.extends === null) break;
    const ref = parentRef(spec.extends);
    if (!ref) { problems.push(`${spec.name}: \`extends\` "${spec.extends}" is not parent@major`); break; }
    const next = [dirname(file), ...otherFolders].map((d) => join(d, `${ref.name}.spdl.json`)).find(existsSync);
    if (!next) { problems.push(`${spec.name} extends ${spec.extends}, whose file ${ref.name}.spdl.json is in none of: ${[dirname(file), ...otherFolders].join(", ")}`); break; }
    file = next;
    const major = String((JSON.parse(readFileSync(file, "utf8")) as Obj).version).split(".")[0];
    if (major !== ref.major) { problems.push(`${spec.name} extends ${spec.extends}, but ${file} is version ${(JSON.parse(readFileSync(file, "utf8")) as Obj).version}`); break; }
  }
  if (!problems.length && chain[0].extends !== null) problems.push("the chain does not end in a language that extends null");
  return { chain, problems };
}

// ---------------------------------------------------------------------------- the resolver

export type ResolvedKind = { kind: Kind; state: State; definedIn: string; change?: string; was?: State };
export type ResolvedValue = { key: string; value: Json; source: "OWN" | "INHERITED"; definedIn: string };
export type ResolvedPart = { code: string; title: string; source: Source; why?: string; kinds: ResolvedKind[]; values: ResolvedValue[] };
export type ResolvedCategory = { code: string; description: string; fresh: boolean; wholly: boolean; parts: ResolvedPart[] };
export type Resolved = { spec: Spec; parent: string | null; shared: ResolvedPart[]; categories: ResolvedCategory[]; problems: string[] };

type Entry = { kind: Kind; state: State; definedIn: string; change?: string };

/** A part's values merged key by key down the chain; the leaf's own keys are OWN, every other key INHERITED from the language that set it last. */
function mergeValues(decisions: Array<{ lang: string; d: Decision | undefined }>): { values: ResolvedValue[]; why?: string } {
  const merged = new Map<string, { value: Json; definedIn: string }>();
  let why: string | undefined;
  for (const { lang, d } of decisions) {
    if (!d) continue;
    if (d.why) why = d.why;
    for (const [k, v] of Object.entries(d.values ?? {})) if (k !== "mtype" && k !== "provenance") merged.set(k, { value: v, definedIn: lang });
  }
  const leaf = decisions[decisions.length - 1].lang;
  return { values: [...merged].map(([key, { value, definedIn }]) => ({ key, value, definedIn, source: definedIn === leaf ? "OWN" as const : "INHERITED" as const })), why };
}

/** catalogue → each parent in turn → the language: the one tree every reader takes (contract §6). */
export function resolve(catalogue: Catalogue, chain: Spec[]): Resolved {
  const problems: string[] = [];
  const leaf = chain[chain.length - 1];
  const outline = catalogue.outline;
  const sharedGroup = outline.groups.find((g) => g.code === "SHARED");
  const styled = outline.groups.filter((g) => g.code !== "SHARED").flatMap((g) => g.parts);

  const shared: ResolvedPart[] = (sharedGroup?.parts ?? []).map((p) => {
    const decisions = chain.map((spec) => ({ lang: spec.name, d: spec.shared[p.code] }));
    const { values, why } = mergeValues(decisions);
    const own = decisions[decisions.length - 1].d;
    const source: Source = own?.source ?? (chain.length === 1 ? "NONE" : "INHERITED");
    return { code: p.code, title: p.title, source, why, kinds: [], values };
  });

  const cats = [...Object.keys(catalogue.categories), ...[...new Set(chain.flatMap((s) => Object.keys(s.categories)))].filter((c) => !catalogue.categories[c])];
  const categories: ResolvedCategory[] = cats.map((cat) => {
    const fresh = !catalogue.categories[cat];
    const fromSpec = chain.map((s) => s.categories[cat]).find(Boolean);
    const description = fresh ? `${fromSpec?.family?.toLowerCase() ?? "?"} for ${cap(String(fromSpec?.person ?? "?").toLowerCase())}, from ${fromSpec?.from ?? "?"}` : catalogue.outline.categories[cat].description;
    const parts: ResolvedPart[] = styled.map((p) => {
      const entries = new Map<string, Entry>();
      const base = catalogue.categories[cat]?.[p.code] ?? [];
      const order: string[] = base.map((k) => k.code);
      chain.forEach((spec, i) => {
        const d = spec.categories[cat]?.[p.code] as Decision | undefined;
        const root = i === 0;
        const touch = (code: string, state: State, extra: Partial<Entry> = {}): void => {
          const had = entries.get(code);
          const kind = had?.kind ?? base.find((k) => k.code === code);
          if (!kind) { problems.push(`${spec.name}: ${cat}.${p.code} names ${code}, which the catalogue and its parents lack`); return; }
          entries.set(code, { kind, state, definedIn: spec.name, ...extra });
        };
        if (root) for (const k of base) entries.set(k.code, { kind: k, state: "PICKED", definedIn: spec.name });
        if (!d) return;
        if (d.source === "NONE") { for (const code of entries.keys()) touch(code, "NOT_USED"); return; }
        if (d.source === "INHERITED") return;
        if (d.pick === "ALL") for (const code of [...entries.keys()]) touch(code, "PICKED");
        else if (Array.isArray(d.pick)) for (const code of [...entries.keys()]) touch(code, d.pick.includes(code) ? "PICKED" : "NOT_USED");
        for (const c of d.customise ?? []) {
          const had = entries.get(c.code);
          if (!had) { problems.push(`${spec.name}: ${cat}.${p.code} customises ${c.code}, which the catalogue and its parents lack`); continue; }
          if (had.kind.floor) problems.push(`${spec.name}: ${cat}.${p.code} customises ${c.code}, a floor kind`);
          const kind: Kind = { ...had.kind, config: { ...(had.kind.config ?? {}), ...(c.config ?? {}) } };
          entries.set(c.code, { kind, state: "CUSTOMISED", definedIn: spec.name, change: c.change });
        }
        for (const k of d.add ?? []) {
          if (entries.has(k.code)) { problems.push(`${spec.name}: ${cat}.${p.code} adds ${k.code}, which already exists`); continue; }
          entries.set(k.code, { kind: k, state: "NEW", definedIn: spec.name });
          order.push(k.code);
        }
        for (const code of d.notUsed ?? []) {
          if (!entries.has(code)) { problems.push(`${spec.name}: ${cat}.${p.code} leaves out ${code}, which the catalogue and its parents lack`); continue; }
          touch(code, "NOT_USED");
        }
      });
      const kinds: ResolvedKind[] = order.filter((c) => entries.has(c)).map((code) => {
        const e = entries.get(code) as Entry;
        // A kind this language says nothing about is INHERITED, and says what the parent made of it.
        return e.definedIn === leaf.name ? { kind: e.kind, state: e.state, definedIn: e.definedIn, change: e.change } : { kind: e.kind, state: "INHERITED" as State, definedIn: e.definedIn, was: e.state, change: e.change };
      });
      const decisions = chain.map((spec) => ({ lang: spec.name, d: spec.categories[cat]?.[p.code] as Decision | undefined }));
      const { values, why } = mergeValues(decisions);
      const own = decisions[decisions.length - 1].d;
      const source: Source = own?.source ?? (chain.length === 1 ? "OWN" : "INHERITED");
      return { code: p.code, title: p.title, source, why, kinds, values };
    });
    const wholly = chain.length > 1 && !fresh && !chain[chain.length - 1].categories[cat];
    return { code: cat, description, fresh, wholly, parts };
  });
  return { spec: leaf, parent: leaf.extends, shared, categories, problems };
}

// ---------------------------------------------------------------------------- the frame, one for both blocks

/** The facts a kind's config puts on its row, in the order the stand-in wrote them. */
function configFacts(part: string, kind: Kind): Array<[string, string]> {
  const c = (kind.config ?? {}) as Obj;
  const out: Array<[string, string]> = [["Code", `[${kind.code}]` + (kind.floor ? " [FLOOR]" : "")]];
  const text = (v: Json): string => (Array.isArray(v) ? v.join(", ") : String(v));
  if (part === "PAGES") {
    if ("level" in c) out.push(["Level", text(c.level)]);
    if (Array.isArray(c.sections) && c.sections.length) out.push(["Sections", c.sections.join(" → ")]);
    else if (c.tree) out.push(["Sections", "Tree"]);
  } else if (part === "CONTAINERS") {
    for (const k of ["unit", "size", "color"]) if (k in c) out.push([cap(k), text(c[k])]);
  } else if (part === "LAYOUTS") {
    if ("unit" in c) out.push(["Unit", text(c.unit)]);
  } else if (part === "MEDIA") {
    if ("framing" in c) out.push(["Framing", text(c.framing)]);
  }
  return out;
}

/** The detail lines a row opens to: For, Choose when, Not when (a case each, condition → instead), Rules. */
function guidanceLines(kind: Kind): Array<[string, string]> {
  const g = (kind.guidance ?? {}) as Obj;
  const out: Array<[string, string]> = [];
  const persons = isObj(g.for) ? strings(g.for.persons) : [];
  if (persons.length) out.push(["For", persons.map(cap).map((x) => x.toLowerCase()).map(cap).join(" · ")]);
  if (g.chooseWhen) out.push(["Choose when", clean(g.chooseWhen as string)]);
  for (const c of (Array.isArray(g.notWhen) ? g.notWhen : []) as Obj[])
    out.push(["Not when", clean(c.condition as string) + (c.instead ? ` → ${clean(c.instead as string)}` : "")]);
  const rules = strings(g.rules);
  if (rules.length) out.push(["Rules", rules.join(" ")]);
  return out;
}

/** A title that opens with a digit reads as a condition (rule 549): use the code's own words. */
function kindName(kind: Kind): string {
  if (!/^\d/.test(kind.title)) return kind.title;
  return kind.code === "THREE_D" ? "Three-dimensional" : cap(kind.code.replace(/_/g, " ").toLowerCase());
}

function kindLine(kind: Kind): string {
  const g = (kind.guidance ?? {}) as Obj;
  return clean(kind.description || (g.chooseWhen as string) || "");
}

const CATALOG = "```catalog layout=LIST facts=AFTER_DESCRIPTION";

/** A code in words: `CHILD_SECTION_WITH_POINTS` is "child section with points". */
const inWords = (code: string): string => code.replace(/_/g, " ").toLowerCase();

/**
 * The rest of a kind's entry in the catalogue, drawn once, in the kind's own place: its units, placement and style as JSON facts (each opens as the tree chip and its
 * dialog), its default case, level and order in words, and one line for each case with its `when` and, where PLANNED, the unit it needs.
 */
function entryLines(kind: Obj): string[] {
  const out: string[] = [];
  const empty = (v: Json): boolean => v === undefined || v === null || v === "" || (isObj(v) && !Object.keys(v).length) || (Array.isArray(v) && !v.length);
  const placement = isObj(kind.placement) ? kind.placement : {};
  for (const [key, value] of [["Units", kind.units], ["Placement", kind.placement], ["Style", kind.style]] as Array<[string, Json]>) if (!empty(value)) out.push(`  ${key}: \`${compact(value)}\``);
  if (typeof kind.defaultCase === "string") out.push(`  Default case: ${inWords(kind.defaultCase)}`);
  else if (Array.isArray(kind.cases) && kind.cases.length) out.push("  Default case: the kind's own arrangement");
  if (typeof placement.level === "string" || typeof placement.level === "number") out.push(`  At level: ${typeof placement.level === "string" ? inWords(placement.level) : placement.level}`);
  if (Array.isArray(kind.order) && kind.order.length)
    out.push(`  Order: ${kind.order.map((e) => (typeof e === "string" ? cap(inWords(e)) : isObj(e) ? `${cap(inWords(String(e.kind)))} (${inWords(String(e.case))})` : "")).join(" → ")}`);
  for (const c of (Array.isArray(kind.cases) ? kind.cases : []) as Obj[]) {
    const needs = c.status === "PLANNED" && c.missing ? ` Planned: needs ${clean(c.missing as string)}.` : "";
    out.push(`  Case: ${cap(inWords(String(c.code)))} | ${clean(c.when ?? "")}${needs}`);
  }
  return out;
}

/** A tab's list of kinds. `resolved` carries a language's states; the catalogue passes none and the rows are the stand-in's. */
function kindList(part: string, kinds: Array<{ kind: Kind; state?: State; definedIn?: string; change?: string; was?: State }>, anchors?: { category: string; seen: Set<string> }): string {
  const rows = [CATALOG];
  // The keys count across the whole list, one column each (RULE.DEVEX.WORKSPACE.576): where any row carries From or Change, every
  // row's config stands as one Config fact, so the list names three keys at most.
  const anyOwn = kinds.some(({ state, definedIn, change }) => (state === "INHERITED" && definedIn) || change);
  for (const { kind, state, definedIn, change, was } of kinds) {
    const line = kindLine(kind);
    const whole = kind as unknown as Obj;
    const planned = anchors && whole.status === "PLANNED";
    const needs = anchors && whole.missing ? ` Planned: needs ${clean(whole.missing as string)}.` : "";
    rows.push(kindName(kind) + (line || needs ? ` | ${line}${needs}`.replace(/^ \| $/, "") : ""));
    // The catalogue gives each kind's entry an anchor, `<category>-<kind>` in lower case with hyphens, which a sample's note links to; a kind that stands in a second part of a category keeps the first part's.
    const anchor = anchors ? `${anchors.category}-${kind.code}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
    if (anchor && !anchors!.seen.has(anchor)) { anchors!.seen.add(anchor); rows.push(`  Anchor: ${anchor}`); }
    const facts = configFacts(part, kind);
    // The first fact that is only tags is the row's badge, so the state stands in it beside the code.
    rows.push(`  ${facts[0][0]}: ${facts[0][1]}${state ? ` [${state}]` : ""}${planned ? " [PLANNED]" : ""}`);
    // A LIST HOLDS UP TO THREE FACTS BESIDE ITS BADGE (RULE.DEVEX.WORKSPACE.576): with From or Change on the row, the config stands as one fact.
    const own: Array<[string, string]> = [];
    if (state === "INHERITED" && definedIn) own.push(["From", `${definedIn}${was && was !== "PICKED" ? ` (${was.toLowerCase().replace("_", " ")})` : ""}`]);
    if (change) own.push(["Change", clean(change)]);
    const config = facts.slice(1);
    const merged: Array<[string, string]> = anyOwn && config.length ? [["Config", config.map(([k, v]) => `${k} ${v}`).join(" · ")]] : config;
    for (const [k, v] of [...own, ...merged]) rows.push(`  ${k}: ${v}`);
    for (const [k, v] of guidanceLines(kind)) rows.push(`  ${k}: ${v}`);
    if (anchors) rows.push(...entryLines(whole));
  }
  rows.push("```");
  return rows.join("\n");
}

/** An empty part is one row of the list: "None defined yet" and, after it, the part's own reason. */
function emptyList(none: string | undefined): string {
  const [head, ...rest] = (none ?? "none defined yet").split(": ");
  return `${CATALOG}\n${cap(head)}${rest.length ? ` | ${rest.join(": ")}` : ""}\n\`\`\``;
}

/** A value on one line, with a space after each comma outside a string so a long one can wrap. */
const compact = (v: Json): string => (typeof v === "string" ? v : JSON.stringify(v)).replace(/`/g, "'").replace(/("(?:[^"\\]|\\.)*")|,/g, (m, str) => (str ? m : ", "));

/** A part's values under its list: one row a key, tagged OWN or INHERITED; the part's why stands once, in its source line. */
function valueList(values: ResolvedValue[]): string {
  const rows = [CATALOG];
  for (const v of values) {
    rows.push(keyInWords(v.key));
    rows.push(`  Source: [${v.source}]`);
    if (v.source === "INHERITED") rows.push(`  From: ${v.definedIn}`);
    rows.push(`  Value: \`${clean(compact(v.value))}\``);
  }
  rows.push("```");
  return rows.join("\n");
}

/** A group is one panel: its name and one line, holding one tabs block, a tab to a part. */
function groupPanel(name: string, description: string, tabs: Array<{ label: string; body: string }>): string {
  return `~~~group ${name} | ${description}\n~~~tabs look=LINE\n${tabs.map((t) => `--- ${t.label}\n${t.body}`).join("\n")}\n~~~\n~~~`;
}

/** The Shared panel of the catalogue: a tab for each part, with the value keys a language sets it under. */
function catalogueShared(outline: Outline): string {
  const group = outline.groups.find((g) => g.code === "SHARED") as GroupOutline;
  const tabs = group.parts.map((p) => {
    const seen: string[] = [];
    for (const keys of Object.values(p.values)) for (const k of keys) if (!seen.includes(k)) seen.push(k);
    return { label: p.title, body: `${CATALOG}\n${p.title} | ${cap(p.description)}. Values only, set by each language\n  Value keys: ${seen.map((k) => `\`${k}\``).join(" ")}\n\`\`\`` };
  });
  return groupPanel("Shared", clean(group.description), tabs);
}

/** The Shared panel of a language: a tab for each part holding the values tagged OWN or INHERITED. */
function languageShared(outline: Outline, shared: ResolvedPart[]): string {
  const group = outline.groups.find((g) => g.code === "SHARED") as GroupOutline;
  const tabs = shared.map((p) => ({ label: p.title, body: `${sourceLine(p)}\n\n${p.values.length ? valueList(p.values) : emptyList(p.source === "NONE" ? `none used${p.why ? `: ${p.why}` : ""}` : "inherited whole: nothing differs")}` }));
  return groupPanel("Shared", clean(group.description), tabs);
}

/** Who fills a part, as a one-row list: the source as a tag and the part's why as its words. */
function sourceLine(p: ResolvedPart): string {
  return `${CATALOG}\nSource of this part${p.why ? ` | ${clean(p.why)}` : ""}\n  Filled by: [${p.source}]\n\`\`\``;
}

/** The catalogue: Shared, then each category's heading with its Structure and Style panels, then the JSON in a fold. */
export function renderCatalogue(catalogue: Catalogue, jsonPath: string): string {
  const { outline } = catalogue;
  const out: string[] = [catalogueShared(outline), ""];
  for (const [cat, byPart] of Object.entries(catalogue.categories)) {
    const seen = new Set<string>();
    out.push(`### ${cat} — ${clean(outline.categories[cat].description.split(", who")[0])}`, "");
    for (const g of outline.groups.filter((g) => g.code !== "SHARED")) {
      const tabs = g.parts.map((p) => {
        const kinds = byPart[p.code];
        return { label: p.title, body: kinds.length ? kindList(p.code, kinds.map((kind) => ({ kind })), { category: cat, seen }) : emptyList(outline.partNotes[cat]?.[p.code]?.none) };
      });
      out.push(groupPanel(g.title, clean(g.description), tabs) + "\n");
    }
  }
  out.push(`\`\`\`json file=${jsonPath} fold`, "```");
  return out.join("\n");
}

/** A language: its panel, Shared, each category in the catalogue's frame with the states, the gaps and the spec in a fold. */
export function renderLanguage(catalogue: Catalogue, resolved: Resolved, opts: { specPath: string; parentPage?: string }): string {
  const { outline } = catalogue;
  const { spec } = resolved;
  const out: string[] = [];
  const parent = spec.extends === null ? "none, this language is a root" : opts.parentPage ? `[${spec.extends}](${opts.parentPage})` : spec.extends;
  const refs = spec.references.map((r) => clean((r.id ?? r.url ?? JSON.stringify(r)) as string));
  // The panel's title carries the version and its line who reads the product, so the row holds three facts (RULE.DEVEX.WORKSPACE.576).
  const product = clean(spec.domain.product) + (spec.domain.reads ? `, read by ${clean(spec.domain.reads)}` : "");
  const panel = [CATALOG, `${spec.name} | ${product}`, `  Extends: ${parent}`,
    `  Records: ${spec.domain.records.map(clean).join(", ") || "none"}`, `  References: ${refs.join(", ") || "none"}`, "```"].join("\n");
  out.push(`~~~group Language | ${clean(spec.name)} ${clean(spec.version)}\n${panel}\n~~~`, "", languageShared(outline, resolved.shared), "");
  for (const cat of resolved.categories) {
    out.push(`### ${cat.code} — ${clean(cat.description.split(", who")[0])}${cat.fresh ? " (a category of its own)" : ""}`, "");
    if (cat.wholly) { out.push(`Inherited whole from ${spec.extends}: this language says nothing here.`, ""); continue; }
    for (const g of outline.groups.filter((g) => g.code !== "SHARED")) {
      const tabs = g.parts.map((p) => {
        const r = cat.parts.find((x) => x.code === p.code) as ResolvedPart;
        const list = r.kinds.length ? kindList(p.code, r.kinds) : emptyList(outline.partNotes[cat.code]?.[p.code]?.none);
        return { label: p.title, body: `${sourceLine(r)}\n\n${list}${r.values.length ? `\n\n${valueList(r.values)}` : ""}` };
      });
      out.push(groupPanel(g.title, clean(g.description), tabs) + "\n");
    }
  }
  const gaps = Object.entries({ notInTheLanguage: "Not in the language", designSystemGaps: "Design system gaps", whatTheAgentMustAsk: "What the agent must ask" })
    .map(([key, label]) => {
      const cases = gapCases(spec.gaps[key]) ?? [];
      const g = spec.gaps[key];
      const why = isObj(g) && typeof g.why === "string" ? clean(g.why) : "";
      return { label, body: `${CATALOG}\n${cases.length ? cases.map((c) => clean(typeof c === "string" ? c : JSON.stringify(c))).join("\n") : `None${why ? ` | ${why}` : ""}`}\n\`\`\`` };
    });
  out.push(groupPanel("Gaps", "what the language leaves to a person, the design system or the agent", gaps) + "\n");
  out.push(`\`\`\`json file=docs/${opts.specPath} fold`, "```");
  return out.join("\n");
}
