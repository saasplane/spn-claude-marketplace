// RESTATES: RULE.SUPPORT.SURFACE.392 — spn-surface carries the CONSTRUCT snapshot of each release's
// book, and what reads it in the plugin reads that copy alone.
//
// `spn-surface unit show <Unit>` — one unit, for the agent: its props, their values and defaults,
// whether the library draws each, its usage, its choice table's cases with the rule each rests on,
// and its index by value.
//
//     spn-surface unit show <Unit> [--json]
//
// A CORE UNIT IS READ FROM THE PLUGIN AND NOTHING ELSE: the snapshot beside the refs, and the
// restated table, which holds the cases that draw nothing. The capability page of the plugin's
// scripts states why.
//
// A UNIT BEYOND THE CORE HAS A SECOND SOURCE: the symbol index of the repository the command runs
// in. Such a unit, the design system's own or a module's, has no table in the book, so its props
// and their descriptions are what carries its use. They are read from the repository's own index,
// which its installed packages wrote at their build, and never from source: a partner's repository
// holds the packages and not the code that produced them. The index is `.claude/saasplane/
// spn-symbols.json`, found from the working folder upwards, else each package's own
// `dist/generated/spn-symbols.json` under `packages/*` and `apps/*`. Its name's last word then names
// the core block whose table decides what its props do not.
//
// THAT SECOND SOURCE REACHES A WORKSPACE'S MEMBERS, because a fresh window starts at the workspace
// root, which is no repository and holds no index of its own: there the command would see nothing,
// and the agent would read the unit's source instead. So where no `sprepo.json` stands above the
// working folder and `.spndevex/` does, each child folder that holds a `sprepo.json` is a member,
// and the merged index of each is read in name order. A name one member carries prints from it. A
// name several carry prints from the first whose entry carries props, else the first: a member may
// pin a release of a package whose index was written before props were read from the code, and the
// member that built the package holds them. The line printed names the member, a line under it names
// every other member that carries the name, and inside a repository nothing changes.
//
// `--repo <name or path>` READS ONE REPOSITORY, from anywhere: a member's name, found in the
// workspace above the working folder, or a path inside a repository (RULE.DEVEX.AGENT.112).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "Print one unit's props, values, defaults, usage and cases from the snapshot this plugin carries";
export const usage = "<Unit> [--repo <name or path>] [--json]";

export const SNAPSHOT = "construct.snapshot.json";
const REFS = ["architecture-components.md", "architecture-widgets.md"];
const PLACE_SIZED = "their size from the place, a field's check from its DSForm.Field";

/** The word for how the library draws a prop, by the prop's `mtype`. */
const LIBRARY: Record<string, string> = {
  CROSSED: "crossed", ONCE: "once", MODE: "mode", TEXT: "text", SWAP: "swap", NO: "not drawn",
};

type Prop = { name: string; mtype: string; kind: string; values: string[] | null; default: unknown };
type Unit = {
  name: string; group: string; line: string; link: string; props: Prop[];
  usage?: { words?: string; caption?: string } | null;
};
type IndexRow = { unit: string; prop: string; values: { value: string; cases: string }[] };
export type Snapshot = { source: { readFrom: string[] }; units: Unit[]; choiceIndex: IndexRow[]; placeSized?: string[] };

/** One case of a unit's table: what it is, where it stands, each prop's value, what the page writes, and its rule. */
type Case = { when: string; props: { prop: string; value: string }[]; writes: string; rule: string; redirect: string | null };
type Table = { cases: Case[]; limits: string[] };

/** A component's prop as the symbol index carries it, read from its code at the package's build. */
type IndexProp = { name: string; values: string[] | null; default: string | null; description: string | null };
type IndexSymbol = { name: string; role: string; intent: string | null; roleMeta: { mtype: string; props?: IndexProp[] } | null };
type IndexPackage = { name: string; version: string; symbols: IndexSymbol[] };
/**
 * The packages of a symbol index, each with the file it was read from and, across a workspace, the
 * member repository that holds it. `workspace` says the read was across a workspace's members.
 */
type IndexEntry = { pkg: IndexPackage; file: string; repository: string | null };
/** `named` is the repository `--repo` named, whose index alone was read. */
type Index = { packages: IndexEntry[]; workspace: boolean; named?: string };
/** One component found in an index: its symbol, its package, the file, and the member it came from. */
type Found = { symbol: IndexSymbol; pkg: IndexPackage; file: string; repository: string | null };

// RESTATES: RULE.SUPPORT.APPS.207 — a unit that is one design-system block made specific ends in that
// block's word, and leaves to that block's choice table everything its data does not decide. A badge
// is one enum's or one state's `DSBadge` (RULE.SUPPORT.APPS.206), `Step` is one step of a flow and a
// `DSForm`, `Entry` is an entry's content opened by `DSEntryOverlay`, and a `Container` follows the
// container patterns rather than one block. A word several blocks share lists them, and the one the
// unit's name ends in is chosen, else the first: `TagColorPicker` is a `DSColorPicker`.
const BLOCK_WORDS: [word: string, blocks: string[]][] = [
  ["Badge", ["DSBadge"]], ["Item", ["DSItem"]], ["Dialog", ["DSDialog", "DSConfirmDialog"]],
  ["Sheet", ["DSSheet"]], ["Drawer", ["DSDrawer"]], ["Popover", ["DSPopover", "DSConfirmPopover"]],
  ["Menu", ["DSDropdownMenu", "DSContextMenu"]], ["Select", ["DSSelect"]], ["Autocomplete", ["DSAutocomplete"]],
  ["Card", ["DSCard", "DSItemCard"]],
  ["Picker", ["DSDatePicker", "DSDateRangePicker", "DSTimePicker", "DSDateTimePicker", "DSColorPicker", "DSImagePicker"]],
  ["Step", ["DSForm"]], ["Entry", ["DSEntryOverlay"]], ["Container", []],
];
const CONTAINER_PATTERNS = "the container patterns";
const CONTAINERS_REF = "refs/support/surface/architecture-containers.md";
const MERGED_INDEX = join(".claude", "saasplane", "spn-symbols.json");
const PACKAGE_INDEX = join("dist", "generated", "spn-symbols.json");
const WORKSPACE_STATE = ".spndevex";

/**
 * The folder the snapshot and the two refs sit in: the plugin's own, three folders above both
 * `scripts/commands/unit/` and `dist/commands/unit/`, unless a test names another.
 */
export function root(): string {
  return process.env.SPN_SURFACE_UNIT_ROOT ?? resolve(import.meta.dirname, "..", "..", "..", "refs", "support", "surface");
}

/** A cell or a line as plain words: no backticks and no bold marks. */
export const plain = (text: string): string => text.replace(/`/g, "").replace(/\*\*/g, "").trim();

/** The cells of one markdown table row. */
const cells = (row: string): string[] => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

/** The section of a ref that holds one unit's choice table, up to the next heading at its level or above. */
function sectionOf(text: string, unit: string): string | null {
  const lines = text.split("\n");
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  const start = lines.findIndex((line) => new RegExp(`^#{3,4} The choice table of \`${unit}\`\\s*$`).test(line));
  if (start < 0) return null;
  const level = /^(#+)/.exec(lines[start])![1].length;
  let end = lines.length;
  for (let at = start + 1; at < lines.length; at += 1) {
    const heading = /^(#+) /.exec(lines[at]);
    if (heading && heading[1].length <= level) { end = at; break; }
  }
  return lines.slice(start + 1, end).join("\n");
}

/**
 * The cases and the limits of a section. The cases are the first table whose last two headers are
 * *The page writes* and *Rule*; a prop column is a header in backticks, and every header before the
 * first prop column says when the case holds. A case whose prop cell starts with "not" sends the
 * reader to another unit or a page, and carries no props.
 */
function tableOf(section: string): Table {
  const lines = section.split("\n");
  const cases: Case[] = [];
  const at = lines.findIndex((line, index) => {
    if (!line.startsWith("|")) return false;
    const head = cells(line);
    return head.length >= 3 && head.at(-2) === "The page writes" && head.at(-1) === "Rule" && (lines[index + 1] ?? "").startsWith("| ---");
  });
  if (at >= 0) {
    const head = cells(lines[at]);
    const firstProp = head.findIndex((header) => /^`[^`]+`$/.test(header));
    const whenColumns = firstProp < 0 ? head.length - 2 : firstProp;
    for (let row = at + 2; row < lines.length && lines[row].startsWith("|"); row += 1) {
      const cell = cells(lines[row]);
      const when = cell.slice(0, whenColumns).filter((text) => text && text !== "—").map(plain).join(" · ");
      const props = head.slice(whenColumns, head.length - 2).map((header, index) => ({ prop: plain(header), value: plain(cell[whenColumns + index] ?? "") }));
      const redirect = props.find((prop) => /^not\b/.test(prop.value))?.value ?? null;
      cases.push({ when, props: redirect ? [] : props, writes: plain(cell.at(-2) ?? ""), rule: plain(cell.at(-1) ?? ""), redirect });
    }
  }
  const limits = lines.filter((line) => line.startsWith("**The limits across")).map(plain);
  return { cases, limits };
}

/** The distance between two names, in edits, for naming the closest units to one that is unknown. */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let last = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const kept = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = kept;
    }
  }
  return row[b.length];
}

/** A prop's values as one cell: the list of a choice, "a flag", or nothing for content. */
function valuesOf(prop: Prop): string {
  if (prop.values?.length) return prop.values.join(" ");
  return prop.kind === "flag" ? "a flag" : "";
}

/** A column of rows padded to one width each, two spaces apart. */
function columns(rows: string[][]): string[] {
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => (row[index] ?? "").length)));
  return rows.map((row) => row.map((cell, index) => (index === row.length - 1 ? cell : cell.padEnd(widths[index]))).join("  ").trimEnd());
}

/** The index of one unit: for each prop, a line for each set of values that share their cases, in the order first met. */
function indexLines(rows: IndexRow[]): string[] {
  const lines: string[][] = [];
  for (const row of rows) {
    const shared = new Map<string, string[]>();
    for (const entry of row.values) shared.set(entry.cases, [...(shared.get(entry.cases) ?? []), entry.value]);
    for (const [cases, values] of shared) lines.push([row.prop, values.join(" "), plain(cases)]);
  }
  const width = Math.max(0, ...lines.map(([prop]) => prop.length));
  return lines.map(([prop, values, cases]) => `${prop.padEnd(width)}  ${values} · ${cases}`);
}

/** The repository a folder sits in: the nearest folder upwards that holds a `sprepo.json`. */
function repositoryOf(start: string): string | null {
  for (let here = resolve(start); ; here = dirname(here)) {
    if (existsSync(join(here, "sprepo.json"))) return here;
    if (dirname(here) === here) return null;
  }
}

/** The packages of one index file, or none where it cannot be read: an unreadable index costs its own units. */
function packagesOf(path: string): IndexPackage[] {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { capabilities?: IndexPackage[] };
    return Array.isArray(parsed.capabilities) ? parsed.capabilities : [];
  } catch { return []; }
}

/** The workspace a folder sits in: the nearest folder upwards that holds `.spndevex/`, the workspace's own state. */
function workspaceOf(start: string): string | null {
  for (let here = resolve(start); ; here = dirname(here)) {
    if (existsSync(join(here, WORKSPACE_STATE))) return here;
    if (dirname(here) === here) return null;
  }
}

/**
 * The merged index of every member of a workspace, in name order: a member is a child folder that
 * holds a `sprepo.json`. Each entry keeps its member, so what is printed can name the repository.
 */
function membersIndex(workspace: string): IndexEntry[] {
  const entries: IndexEntry[] = [];
  let names: string[];
  try { names = readdirSync(workspace).sort(); } catch { return entries; }
  for (const name of names) {
    if (!existsSync(join(workspace, name, "sprepo.json"))) continue;
    const merged = join(workspace, name, MERGED_INDEX);
    if (!existsSync(merged)) continue;
    entries.push(...packagesOf(merged).map((pkg) => ({ pkg, file: join(name, MERGED_INDEX), repository: name })));
  }
  return entries;
}

/**
 * The symbol index the command reads: of the repository it runs in — the merged one, found from the
 * working folder upwards and no higher than the repository, else each package's own under
 * `packages/*` and `apps/*` — or, from a workspace's root, of each member repository. `packages` is
 * empty where there is none to read.
 */
export function symbolIndex(start: string): Index {
  const repository = repositoryOf(start);
  if (!repository) {
    const workspace = workspaceOf(start);
    if (workspace) return { packages: membersIndex(workspace), workspace: true };
  }
  for (let here = resolve(start); ; here = dirname(here)) {
    const merged = join(here, MERGED_INDEX);
    if (existsSync(merged)) {
      return { packages: packagesOf(merged).map((pkg) => ({ pkg, file: MERGED_INDEX, repository: null })), workspace: false };
    }
    if (here === repository || dirname(here) === here) break;
  }
  const base = repository ?? resolve(start);
  const packages: IndexEntry[] = [];
  for (const group of ["packages", "apps"]) {
    let names: string[];
    try { names = readdirSync(join(base, group)).sort(); } catch { continue; }
    for (const name of names) {
      const path = join(base, group, name, PACKAGE_INDEX);
      if (existsSync(path)) packages.push(...packagesOf(path).map((pkg) => ({ pkg, file: relative(base, path), repository: null })));
    }
  }
  return { packages, workspace: false };
}

/** The members of a workspace: its child folders that hold a `sprepo.json`, in name order. */
function membersOf(workspace: string): string[] {
  try { return readdirSync(workspace).sort().filter((name) => existsSync(join(workspace, name, "sprepo.json"))); } catch { return []; }
}

/**
 * The repository `--repo` names, from the folder the command runs in: a path inside a repository,
 * else a member's name in the workspace above. A value that is neither is a usage fault that lists
 * the members, so a wrong name never passes as an empty index.
 */
function namedRepository(value: string, from: string): string {
  const path = resolve(from, value);
  if (existsSync(path)) {
    const repository = repositoryOf(path);
    if (repository) return repository;
    throw new UsageFault(`\`--repo ${value}\` is in no repository: no sprepo.json stands at or above it.`);
  }
  const workspace = workspaceOf(from);
  if (workspace && existsSync(join(workspace, value, "sprepo.json"))) return join(workspace, value);
  const members = workspace ? membersOf(workspace) : [];
  throw new UsageFault(`\`--repo ${value}\` names no repository${members.length ? ` — this workspace's members: ${members.join(" · ")}` : ""}.`);
}

/**
 * The symbol index a lookup reads: the one repository `--repo` names, else what `symbolIndex` finds
 * from the working folder — the repository's own, or each member's from a workspace's root.
 */
export function indexFor(repo: string | null, from: string): Index {
  if (repo === null) return symbolIndex(from);
  const repository = namedRepository(repo, from);
  const named = basename(repository);
  const index = symbolIndex(repository);
  return { packages: index.packages.map((entry) => ({ ...entry, repository: named })), workspace: false, named };
}

/** The other members of a workspace's read that carry a component of this name, besides the one printed. */
function othersHolding(index: Index, name: string, printed: string | null): string[] {
  if (!index.workspace) return [];
  const holding = index.packages
    .filter(({ pkg }) => (pkg.symbols ?? []).some((symbol) => symbol.role === "COMPONENT" && symbol.name === name))
    .map(({ repository }) => repository)
    .filter((repository): repository is string => repository !== null && repository !== printed);
  return [...new Set(holding)];
}

/** Whether an index's entry for a component carries its props at all: an older build wrote none. */
const hasProps = (symbol: IndexSymbol): boolean => Boolean(symbol.roleMeta?.props);

/**
 * Every component an index holds, by name, with the package, the file and the member it came from.
 * Within one repository the first of a name wins; across a workspace's members the first whose entry
 * carries props wins, so a member's pin of an older build never hides the member that built it.
 */
export function componentsOf(index: Index): Map<string, Found> {
  const found = new Map<string, Found>();
  for (const { pkg, file, repository } of index.packages) {
    for (const symbol of pkg.symbols ?? []) {
      if (symbol.role !== "COMPONENT") continue;
      const standing = found.get(symbol.name);
      if (standing && !(index.workspace && !hasProps(standing.symbol) && hasProps(symbol))) continue;
      found.set(symbol.name, { symbol, pkg, file, repository });
    }
  }
  return found;
}

/** The core block a unit's last word points to, the container patterns, or neither. */
export function blockOf(name: string): { block: string | null; pattern: string | null } {
  for (const [word, blocks] of BLOCK_WORDS) {
    if (!name.endsWith(word) || name === word) continue;
    if (!blocks.length) return { block: null, pattern: CONTAINER_PATTERNS };
    const named = blocks.filter((block) => name.endsWith(block.slice(2))).sort((a, b) => b.length - a.length);
    return { block: named[0] ?? blocks[0], pattern: null };
  }
  return { block: null, pattern: null };
}

/** The line that says what decides a unit beyond the core, past its own props. */
function beyondLine(block: string | null, pattern: string | null): string {
  const head = "beyond the core: its props carry its use;";
  if (block) return `${head} the cases are ${block}'s — run \`spn-surface unit show ${block}\``;
  if (pattern) return `${head} the rest is ${pattern}' — read ${CONTAINERS_REF}`;
  return `${head} its name ends in no block's word, so no core table decides the rest`;
}

/** A unit beyond the core, printed from the symbol index: its package, its intent line, its props, and the block its name points to. */
function showFromIndex(found: Found, index: Index, json: boolean): number {
  const { symbol, pkg, file, repository } = found;
  const props = symbol.roleMeta?.props ?? null;
  const line = plain((symbol.intent ?? "").replace(/\.$/, ""));
  const { block, pattern } = blockOf(symbol.name);
  const alsoIn = othersHolding(index, symbol.name, repository);
  if (json) {
    console.log(JSON.stringify({ unit: symbol.name, package: pkg.name, version: pkg.version, line, index: file,
      repository, alsoIn, props: props ?? [], block, pattern, beyondCore: true }, null, 2));
    return 0;
  }
  const out: string[] = [];
  out.push([`${symbol.name}`, `${pkg.name}@${pkg.version}`, ...(line ? [line] : [])].join(" · "));
  out.push(index.named ? `the symbol index: ${file}, of the repository ${index.named}, which --repo names`
    : repository ? `the symbol index: ${file}, of the repository ${repository} in this workspace`
    : `the symbol index: ${file}, of the repository this runs in`);
  if (alsoIn.length) out.push(`also in ${alsoIn.join(" · ")} — \`--repo <name>\` reads one alone`);
  out.push("");
  if (props === null) {
    out.push("the index carries no props for it: it was written before spnutils 5.40.0, which reads them from the code");
  } else if (!props.length) {
    out.push("no props");
  } else {
    const rows = columns([["prop", "default", "values"],
      ...props.map((prop) => [prop.name, prop.default ?? "", (prop.values ?? []).join(" ")])]);
    out.push(rows[0]);
    props.forEach((prop, at) => {
      out.push(rows[at + 1]);
      if (prop.description) out.push(`    ${plain(prop.description)}`);
    });
  }
  out.push("");
  out.push(beyondLine(block, pattern));
  console.log(out.join("\n"));
  return 0;
}

export function run(args: string[]): number {
  const words = readWords(args, { json: FLAG, repo: VALUE });
  if (words.paths.length !== 1) throw new UsageFault("needs one unit's name, such as `DSSheet`.");
  const name = words.paths[0];
  const repo = words.value("repo");

  const folder = root();
  const snapshotPath = join(folder, SNAPSHOT);
  if (!existsSync(snapshotPath)) {
    process.stderr.write(`unit show: this release carries no ${SNAPSHOT}\n`);
    return 1;
  }
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Snapshot;
  const unit = snapshot.units.find((candidate) => candidate.name === name);
  if (!unit) {
    const index = indexFor(repo, process.cwd());
    const components = componentsOf(index);
    const found = components.get(name);
    if (found) return showFromIndex(found, index, words.given("json"));
    const closest = [...new Set([...snapshot.units.map((candidate) => candidate.name), ...components.keys()])]
      .sort((a, b) => distance(name.toLowerCase(), a.toLowerCase()) - distance(name.toLowerCase(), b.toLowerCase()) || a.localeCompare(b))
      .slice(0, 3);
    const where = index.named ? `in the snapshot or the symbol index of ${index.named}`
      : index.packages.length ? "in the snapshot or the symbol index"
      : index.workspace ? "in the snapshot, and no symbol index in this workspace's repositories,"
      : "in the snapshot, and no symbol index here,";
    process.stderr.write(`unit show: no unit \`${name}\` ${where} — the closest: ${closest.join(" · ")}\n`);
    return 1;
  }

  let table: Table | null = null;
  for (const ref of REFS) {
    const path = join(folder, ref);
    if (!existsSync(path)) continue;
    const section = sectionOf(readFileSync(path, "utf8"), name);
    if (section !== null) { table = tableOf(section); break; }
  }
  const index = snapshot.choiceIndex.filter((row) => row.unit === name);
  const placeSized = (snapshot.placeSized ?? []).includes(name);
  const book = snapshot.source.readFrom.join(", ");
  const link = basename(unit.link ?? "");
  const line = plain((unit.line ?? "").replace(/\.$/, ""));

  if (words.given("json")) {
    console.log(JSON.stringify({ unit: name, group: unit.group, line, book, link: unit.link, props: unit.props,
      usage: unit.usage?.words ?? null, placeSized, cases: table?.cases ?? [], limits: table?.limits ?? [], index }, null, 2));
    return 0;
  }

  const out: string[] = [];
  out.push(`${name} · ${unit.group} · ${line}`);
  out.push(`the book: ${book}, ${link}, the copy this release of spn-surface carries`);
  out.push("");

  const drawn = unit.props.filter((prop) => !(prop.kind === "content" && prop.mtype === "NO"));
  const content = unit.props.filter((prop) => prop.kind === "content" && prop.mtype === "NO").map((prop) => prop.name);
  const rows = [["prop", "default", "the library", "values"],
    ...drawn.map((prop) => [prop.name, prop.default === null || prop.default === undefined ? "" : String(prop.default), LIBRARY[prop.mtype] ?? prop.mtype, valuesOf(prop)])];
  if (drawn.length) out.push(...columns(rows));
  if (content.length) out.push(`${drawn.length ? "\n" : ""}${LIBRARY.NO}, content the page gives: ${content.join(" · ")}`);
  if (!unit.props.length) out.push("no props");

  if (unit.usage?.words) { out.push(""); out.push(`usage   ${plain(unit.usage.words)}`); }

  const closed = unit.props.some((prop) => prop.kind === "choice");
  if (placeSized) { out.push(""); out.push(PLACE_SIZED); }
  if (table && table.cases.length) {
    out.push("");
    out.push("the choice table, a guide: start from the first case that matches, and a partner's choice stands");
    const width = Math.max(...table.cases.map((one) => (one.redirect ? `${one.when} → ${one.redirect}` : one.when).length));
    for (const one of table.cases) {
      const head = one.redirect ? `${one.when} → ${one.redirect}` : one.when;
      out.push(`  ${head.padEnd(width)}  ${one.rule}`);
      if (!one.redirect) {
        const props = one.props.map((prop) => `${prop.prop} ${prop.value}`);
        out.push(`      ${[...props, `the page writes ${one.writes}`].join(" · ")}`);
      }
    }
    for (const limit of table.limits) { out.push(""); out.push(limit); }
  } else if (closed && !placeSized) {
    out.push("");
    out.push("no choice table yet: the book gives this unit's closed props no cases");
  }

  if (index.length) {
    out.push("");
    out.push("the index by value: prop · value · its cases");
    out.push(...indexLines(index).map((text) => `  ${text}`));
  }

  console.log(out.join("\n"));
  return 0;
}
