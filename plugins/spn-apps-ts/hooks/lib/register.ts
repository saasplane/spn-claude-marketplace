// What a behaviour register IS, so two tools cannot disagree about it.
//
// `behaviour-rows` WRITES two cells of a row, and `action-coverage` READS every row to find a
// published action nothing claims. Were those two to parse a table differently, one would write
// rows the other could not see — so the headings and the row test live here rather than once in
// each.
//
// **A register is found by its HEADER and never by a path.** A tree that moves breaks neither
// tool, and it is the only way to be right in both the per-node layout and the one-tree-per-
// repository layout that follows it.

/** The eight cells, in order. A table with these headings is a behaviour register, wherever it sits. */
export const HEADINGS = ["id", "who", "does", "sees", "type", "tier", "status", "updated at"];

/** Where a row's cells are, if this line is a row of a behaviour table. */
export const cellsOf = (line: string): string[] | null => {
  if (!line.trimStart().startsWith("|")) return null;
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = trimmed.split("|");
  return cells.length === HEADINGS.length ? cells : null;
};

export const isHeader = (line: string): boolean => {
  const cells = cellsOf(line);
  return cells !== null && cells.every((cell, i) => cell.trim().toLowerCase() === HEADINGS[i]);
};

/** The dashes under a header — shaped like a row, carrying nothing. */
export const isUnderline = (cells: string[]): boolean => cells.every((cell) => /^[\s:-]*$/.test(cell));
