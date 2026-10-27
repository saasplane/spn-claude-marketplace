// RESTATES: RD.SUPPORT.SURFACE.392 — spn-surface carries the CONSTRUCT snapshot of each release's
// book, and what reads it in the plugin reads that copy alone.
//
// `spn-surface unit show <Unit>` — one unit, for the agent: its props, their values and defaults,
// whether the library draws each, its usage, its choice table's cases with the rule each rests on,
// and its index by value.
//
//     spn-surface unit show <Unit> [--json]
//
// IT READS THE PLUGIN AND NOTHING ELSE: the snapshot beside the refs, and the restated table, which
// holds the cases that draw nothing. The capability page of the plugin's scripts states why.
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "Print one unit's props, values, defaults, usage and cases from the snapshot this plugin carries";
export const usage = "<Unit> [--json]";

const SNAPSHOT = "construct.snapshot.json";
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
type Snapshot = { source: { readFrom: string[] }; units: Unit[]; choiceIndex: IndexRow[]; placeSized?: string[] };

/** One case of a unit's table: what it is, where it stands, each prop's value, what the page writes, and its rule. */
type Case = { when: string; props: { prop: string; value: string }[]; writes: string; rule: string; redirect: string | null };
type Table = { cases: Case[]; limits: string[] };

/**
 * The folder the snapshot and the two refs sit in: the plugin's own, three folders above both
 * `scripts/commands/unit/` and `dist/commands/unit/`, unless a test names another.
 */
function root(): string {
  return process.env.SPN_SURFACE_UNIT_ROOT ?? resolve(import.meta.dirname, "..", "..", "..", "refs", "support", "surface");
}

/** A cell or a line as plain words: no backticks and no bold marks. */
const plain = (text: string): string => text.replace(/`/g, "").replace(/\*\*/g, "").trim();

/** The cells of one markdown table row. */
const cells = (row: string): string[] => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

/** The section of a ref that holds one unit's choice table, up to the next heading at its level or above. */
function sectionOf(text: string, unit: string): string | null {
  const lines = text.split("\n");
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

export function run(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("needs one unit's name, such as `DSSheet`.");
  const name = words.paths[0];

  const folder = root();
  const snapshotPath = join(folder, SNAPSHOT);
  if (!existsSync(snapshotPath)) {
    process.stderr.write(`unit show: this release carries no ${SNAPSHOT}\n`);
    return 1;
  }
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Snapshot;
  const unit = snapshot.units.find((candidate) => candidate.name === name);
  if (!unit) {
    const closest = snapshot.units.map((candidate) => candidate.name)
      .sort((a, b) => distance(name.toLowerCase(), a.toLowerCase()) - distance(name.toLowerCase(), b.toLowerCase()) || a.localeCompare(b))
      .slice(0, 3);
    process.stderr.write(`unit show: no unit \`${name}\` in the snapshot — the closest: ${closest.join(" · ")}\n`);
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
