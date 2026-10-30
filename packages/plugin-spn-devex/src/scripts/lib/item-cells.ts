// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The shape of a section, on every page kind
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// When a table's column holds sentences rather than short values (RULE.DEVEX.WORKSPACE.259). `doc-check` names such
// a column on a page written by hand, and `docs page` writes it as a level of the item cell on a construct's page.

import { unescape } from "./payload.ts";

/** The words of prose a cell holds past which it reads as a sentence, never a short value such as a status, a count, a version or a weight. */
export const SENTENCE_WORDS = 7;

/** A cell as a person reads it: tags gone, entities resolved, whitespace collapsed. */
const flat = (html: string): string => unescape(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** A cell a dash or nothing fills says nothing, so it is never counted. */
export const isBlankCell = (cellHtml: string): boolean => /^(?:—|–|-)?$/.test(flat(cellHtml));

/** A cell's words of prose: code is a value however long its list, so `IDLE` · `WORKING` · `DONE` counts as none. */
export const proseWords = (cellHtml: string): number =>
  flat(cellHtml.replace(/<code\b[\s\S]*?<\/code>/gi, " ")).split(/\s+/).filter((word) => /[a-z]/i.test(word)).length;

/**
 * How many of a column's cells hold sentences, of the cells that say something, and whether that makes it a column of
 * sentences: two cells at least, and at least half of them sentences.
 */
export function sentenceColumn(cellsHtml: readonly string[]): { long: number; cells: number; sentences: boolean } {
  const said = cellsHtml.filter((cell) => !isBlankCell(cell));
  const long = said.filter((cell) => proseWords(cell) >= SENTENCE_WORDS).length;
  return { long, cells: said.length, sentences: said.length >= 2 && long * 2 >= said.length };
}
