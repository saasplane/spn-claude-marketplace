// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Every block has a rule · § A page is written in two passes
// The chapter is the source of truth.
//
// The units of one file a block pass reads, so a rewriting agent picks the best block for each section rather than reading a whole file.
//
//   spn-devex docs blocks units <file> [--json]    one unit for each section and subsection
//
// The block counterpart of `docs prose paragraphs`. A unit is the text under one heading, up to the next heading of any level. It
// carries its heading path, its prose, its tables, lists and fences with line numbers, and the hints the page writer's block checks
// raise for it. The command reads and prints; it never writes.

import { extname } from "node:path";
import { read } from "../../lib/payload.ts";
import { type Action, REQUIRED, FLAG, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { blockFit, readsAsCondition } from "../../lib/block-fit.ts";

export type Span = { kind: "table" | "list" | "fence"; from: number; to: number; detail: string };
export type Unit = { path: string[]; from: number; to: number; prose: string[]; blocks: Span[]; hints: string[] };

const LIST_LINE = /^\s*(?:[-*]|\d+[.)])\s/;
const CELLS = (line: string): string[] => line.replace(/^\s*\||\|\s*$/g, "").split("|").map((cell) => cell.trim());

/** A table that reads as a catalog: three or more rows, a bare name in the first column, a sentence of twelve words or more in the next. */
function catalogHint(rows: string[][]): boolean {
  const body = rows.filter((cells) => !cells.every((cell) => /^:?-{2,}:?$/.test(cell))).slice(1);
  if (body.length < 3 || body.some((cells) => cells.length !== 2)) return false;
  return body.every((cells) => /^`[^`]+`$|^\*\*[^*]+\*\*$/.test(cells[0]) && cells[1].split(/\s+/).length >= 12);
}

/** The units of one markdown text, front matter and fenced code kept out of the heading scan. */
export function unitsOf(text: string): Unit[] {
  const front = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(text)?.[0] ?? "";
  const skipped = front ? front.split("\n").length - 1 : 0;
  const lines = text.slice(front.length).split("\n");
  const units: Unit[] = [];
  const stack: string[] = [];
  let current: Unit = { path: [], from: skipped + 1, to: skipped + 1, prose: [], blocks: [], hints: [] };
  let raw: string[] = [];
  let tableRows: string[][] = [];
  const close = (at: number) => {
    if (current.prose.length || current.blocks.length) {
      current.to = skipped + at;
      for (const [, message] of blockFit([`## ${current.path.join(" › ")}`, ...raw].join("\n"), false, "seat")) current.hints.push(message);
      units.push(current);
    }
  };
  const endTable = (at: number, start: number) => {
    if (!tableRows.length) return;
    current.blocks.push({ kind: "table", from: skipped + start + 1, to: skipped + at, detail: `${tableRows.length - 1} rows, ${tableRows[0].length} columns` });
    if (catalogHint(tableRows)) current.hints.push("a table that reads as a catalog: a name and a sentence for each row is a catalog block (rule 548)");
    if (tableRows.slice(2).length >= 3 && tableRows.slice(2).every((cells) => readsAsCondition(cells[0] ?? "")))
      current.hints.push("a first column of conditions is a table (rule 549): keep it a table, never cards");
    tableRows = [];
  };
  let tableStart = 0;
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at];
    const fence = /^\s*(```+|~~~+)\s*([\w-]*)/.exec(line);
    if (fence) {
      const start = at;
      raw.push(line);
      while (at + 1 < lines.length && !lines[at + 1].trim().startsWith(fence[1])) { at += 1; raw.push(lines[at]); }
      if (at + 1 < lines.length) { at += 1; raw.push(lines[at]); }
      current.blocks.push({ kind: "fence", from: skipped + start + 1, to: skipped + at + 1, detail: fence[2] || "no language" });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (heading) {
      endTable(at, tableStart);
      close(at);
      stack.length = heading[1].length - 1;
      stack[heading[1].length - 1] = heading[2].replace(/\*\*|`/g, "");
      current = { path: stack.filter(Boolean), from: skipped + at + 1, to: skipped + at + 1, prose: [], blocks: [], hints: [] };
      raw = [];
      continue;
    }
    raw.push(line);
    if (/^\s*\|/.test(line)) {
      if (!tableRows.length) tableStart = at;
      tableRows.push(CELLS(line));
      continue;
    }
    endTable(at, tableStart);
    if (LIST_LINE.test(line)) {
      const start = at;
      let items = 1;
      while (at + 1 < lines.length && (LIST_LINE.test(lines[at + 1]) || /^\s{2,}\S/.test(lines[at + 1]))) {
        at += 1; raw.push(lines[at]);
        if (LIST_LINE.test(lines[at])) items += 1;
      }
      current.blocks.push({ kind: "list", from: skipped + start + 1, to: skipped + at + 1, detail: `${items} items` });
      continue;
    }
    if (line.trim() && !/^\s*>|^<!--|^`Lenses:/.test(line)) {
      const last = current.prose.length - 1;
      if (last >= 0 && lines[at - 1]?.trim()) current.prose[last] += ` ${line.trim()}`; else current.prose.push(line.trim());
    }
  }
  endTable(lines.length, tableStart);
  close(lines.length);
  return units;
}

function print(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  const file = onePath(scopeOf(words.paths, REQUIRED));
  if (![".md", ".markdown"].includes(extname(file))) {
    console.error(`docs blocks units reads a markdown seat file; ${file} is not one`);
    return 2;
  }
  const units = unitsOf(read(file));
  if (words.given("json")) { console.log(JSON.stringify({ file, units }, null, 2)); return 0; }
  for (const unit of units) {
    console.log(`\n--- ${file}:${unit.from}-${unit.to}  ${unit.path.join(" › ") || "(before the first heading)"}`);
    for (const span of unit.blocks) console.log(`  ${span.kind} lines ${span.from}-${span.to} (${span.detail})`);
    for (const hint of unit.hints) console.log(`  hint: ${hint}`);
    if (unit.prose.length) console.log(`\n${unit.prose.join("\n\n")}`);
  }
  return 0;
}

export const describe = "the units of one file a block pass reads — each section's prose, tables, lists and fences with line numbers, and the block hints raised for it";

export const actions: Record<string, Action> = {
  units: {
    describe: "print one unit for each section and subsection of a seat file, with the block hints raised for it",
    usage: "<file> [--json]",
    run: print,
  },
};
