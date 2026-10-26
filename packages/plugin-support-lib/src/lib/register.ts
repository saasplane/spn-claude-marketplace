// What a behaviour register IS, so no two tools can disagree about it.
//
// `behaviour-rows` WRITES two cells of a row; `behaviour-proof`, `behaviour-join` and
// `behaviour-coverage` READ rows. Were those to parse a table differently, one would write rows
// another could not see. This file lives once, in the shared support-lib folder — spn-devex and
// spn-apps each import it by relative path, so the two can no longer drift apart the way two
// hand-kept copies could.
//
// **A register is found by its HEADER and never by a path.** A tree that moves breaks no tool, and
// it is the only way to be right in both the per-node layout and the one-tree-per-repository layout
// that follows it.
//
// **A column is found by its HEADING and never by its position** (the book's RD.DEVEX.WORKSPACE.139). The row
// grammar has three widths: eight cells in the older registers, nine where `Where` or `Realizes`
// joins them, and ten where `Names` does. A reader pinned to one width sees a wider register as no
// register at all and reports a confident zero, which is the worst answer a tool can give.

import { join, relative } from "node:path";
import { read, walk } from "./runs.ts";

/** The headings a register is recognised by. A table naming all three is a register, wherever it sits. */
export const REQUIRED_HEADINGS = ["id", "tier", "status"];

/** Where each cell of a register's row sits, read off its header. `-1` is a column this table does not carry. */
export type Columns = {
  width: number;
  id: number;
  who: number;
  does: number;
  sees: number;
  type: number;
  tier: number;
  status: number;
  updated: number;
};

/** A table line's cells, whatever the table's width, with their padding kept. Null for a line that is not one. */
export const cellsOf = (line: string): string[] | null => {
  const trimmed = line.trim();
  if (!(trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1)) return null;
  return trimmed.slice(1, -1).split("|");
};

/** Where each named column sits, or null when this line is not a register's header. */
export const headerOf = (line: string): Columns | null => {
  const cells = cellsOf(line);
  if (cells === null) return null;
  const names = cells.map((cell) => cell.trim().toLowerCase());
  if (!REQUIRED_HEADINGS.every((name) => names.includes(name))) return null;
  const at = (name: string) => names.indexOf(name);
  return {
    width: cells.length,
    id: at("id"),
    who: at("who"),
    does: at("does"),
    sees: at("sees"),
    type: at("type"),
    tier: at("tier"),
    status: at("status"),
    updated: at("updated at"),
  };
};

export const isHeader = (line: string): boolean => headerOf(line) !== null;

/** The dashes under a header — shaped like a row, carrying nothing. */
export const isUnderline = (cells: string[]): boolean => cells.every((cell) => /^[\s:-]*$/.test(cell));

/** One row of a register: its line number (0-based), its raw cells, and where each column sits. */
export type RegisterRow = { index: number; cells: string[]; columns: Columns };

/**
 * Every row of every register in one file's text.
 *
 * A row belongs to the header above it and carries that header's width. A line of another width, a
 * blank line or prose closes the table, which is how a file holding several tables — or a table of
 * another shape — is read without guessing.
 */
export function* registerRows(text: string): Generator<RegisterRow> {
  let columns: Columns | null = null;
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const header = headerOf(lines[index]);
    if (header !== null) { columns = header; continue; }
    const cells = cellsOf(lines[index]);
    if (cells === null || columns === null || cells.length !== columns.width) { columns = null; continue; }
    if (isUnderline(cells)) continue;
    yield { index: index, cells: cells, columns: columns };
  }
}

/** One cell's value — backticks and emphasis stripped — or the empty string where the table has no such column. */
export const cellValue = (row: RegisterRow, column: keyof Omit<Columns, "width">): string => {
  const at = row.columns[column];
  return at < 0 ? "" : row.cells[at].trim().replace(/[`*]/g, "");
};

/** The status word a cell carries. The icon a page renders beside it is the rendering, and is stripped. */
export const statusOf = (row: RegisterRow): string =>
  cellValue(row, "status").replace(/[✅❌⏳🔮👤🚧]/gu, "").trim().toUpperCase();

/**
 * A behaviour id as the registers spell it, and as a case title cites one: `DOMAIN.AREA.NN`.
 *
 * The domain is two to seven letters, so `COMPOSE.BUILD.01` and `SERVICE.HEALTH.01` are read. The
 * middle segment admits a digit after its first letter, because `WEB.A11Y.01` is a row this estate
 * declares. `RD.` and `PD.` are the book's register ids, which titles cite and no row declares, and
 * nothing is read from inside one: an id never follows a letter, a digit or a dot.
 */
export const BEHAVIOUR_ID = /(?<![A-Za-z0-9.])(?!RD\.|PD\.)([A-Z]{2,7}\.[A-Z][A-Z0-9]*\.\d+)\b/g;

/** Every behaviour id a piece of text cites. */
export const idsIn = (text: string): string[] => [...text.matchAll(BEHAVIOUR_ID)].map((match) => match[1]);

/** One declared row, read as values, with the file and line it sits on. */
export type DeclaredRow = {
  id: string;
  /** Relative to the root the rows were read under. */
  file: string;
  line: number;
  who: string;
  does: string;
  type: string;
  tier: string;
  status: string;
  updatedAt: string;
  /** The cells as written, so a spelling no vocabulary declares is told apart from a dash. */
  tierCell: string;
  statusCell: string;
};

/** Every markdown file under a folder, in a stable order. */
const markdownUnder = (dir: string): string[] => [...walk(dir)].filter((file) => file.endsWith(".md"));

/** A behaviour id that more than one register row declares, with every row that declares it. */
export type RepeatedId = { id: string; rows: Array<{ file: string; line: number }> };

/**
 * Every register row under `<root>/docs/`, read by heading. A row declared twice is one row in
 * `rows`, and the first file wins. The id is returned in `repeated` with each row that declares it,
 * so a reader can show both rows and neither is dropped in silence.
 */
export function declaredRows(root: string): { rows: DeclaredRow[]; registers: number; repeated: RepeatedId[] } {
  const rows: DeclaredRow[] = [];
  const declaredAt = new Map<string, Array<{ file: string; line: number }>>();
  let registers = 0;
  for (const file of markdownUnder(join(root, "docs"))) {
    const text = read(file);
    if (text === null || !text.includes("|")) continue;
    registers += text.split("\n").filter(isHeader).length;
    const shown = relative(root, file).split("\\").join("/");
    for (const row of registerRows(text)) {
      const ids = idsIn(cellValue(row, "id"));
      if (ids.length !== 1) continue;
      const earlier = declaredAt.get(ids[0]);
      if (earlier !== undefined) { earlier.push({ file: shown, line: row.index + 1 }); continue; }
      declaredAt.set(ids[0], [{ file: shown, line: row.index + 1 }]);
      rows.push({
        id: ids[0],
        file: shown,
        line: row.index + 1,
        who: cellValue(row, "who"),
        does: cellValue(row, "does"),
        type: cellValue(row, "type").toUpperCase(),
        tier: cellValue(row, "tier").toUpperCase(),
        status: statusOf(row),
        updatedAt: cellValue(row, "updated"),
        tierCell: row.cells[row.columns.tier] ?? "",
        statusCell: row.cells[row.columns.status] ?? "",
      });
    }
  }
  const repeated = [...declaredAt.entries()]
    .filter(([, declarations]) => declarations.length > 1)
    .map(([id, declarations]) => ({ id: id, rows: declarations }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return { rows: rows.sort((left, right) => left.id.localeCompare(right.id)), registers: registers, repeated: repeated };
}

/**
 * Every behaviour id any table under `<root>/docs/` declares in its first cell, whatever the table's
 * shape. It is wider than `declaredRows` on purpose: a table carrying no `Tier` or `Status` still
 * declares its ids, and a case citing one of them cites something real.
 */
export function declaredIds(root: string): Set<string> {
  const ids = new Set<string>();
  for (const file of markdownUnder(join(root, "docs"))) {
    const text = read(file);
    if (text === null || !text.includes("|")) continue;
    for (const line of text.split("\n")) {
      const cells = cellsOf(line);
      if (cells === null || isUnderline(cells)) continue;
      const found = idsIn(cells[0].replace(/[`*~]/g, ""));
      if (found.length === 1 && !/~~/.test(cells[0])) ids.add(found[0]);
    }
  }
  return ids;
}
