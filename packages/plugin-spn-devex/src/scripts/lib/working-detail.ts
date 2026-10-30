// The agent's working detail a reader never sees: the numbers and file names it keeps for itself while it
// works. A reply, an approach page and a preview speak in goals and in the developer's words, so a sentence
// that names a row or order number, an order's file, a suggestion by its number alone, a rule id or a check's
// file name is sent back to be rewritten. An arc number, and a card number beside its words, are the reader's
// own and pass. One list serves the turn's end (`events/stop.ts`) and the doc check (`checks/doc-check.ts`).

/** One sentence that holds working detail, and the kind of detail it holds. */
export type DetailFinding = { kind: string; sentence: string };

/** A suggestion number followed by words of its own (a bracket, a dash or a colon) names what it is; the rest are bare. */
const BARE_SUGGESTION = /\bS\d+\b(?!\s*(?:\(|—|–|-\s|:))/;

/** The kinds of working detail, in the order they are told. */
const DETAIL: ReadonlyArray<{ kind: string; found: RegExp }> = [
  { kind: "row", found: /\brows?\s+#?\d+\b/i },
  { kind: "order", found: /\borders?\s+#?\d+\b/i },
  { kind: "order file", found: /\borders\/\d+(?:\.report)?\.md\b|\b\d+\.report\.md\b/ },
  { kind: "suggestion", found: BARE_SUGGESTION },
  { kind: "rule", found: /\bRULE\.[A-Z]+(?:\.[A-Z]+)*\.\d+\b/ },
  { kind: "check file", found: /\bchecks\/[\w-]+\.ts\b|\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\.ts\b/ },
];

/** The sentences of a text, split after a full stop, question mark or exclamation mark and at a line break. */
function sentencesOf(text: string): string[] {
  return text.split(/\n+|(?<=[.?!])\s+/).map((one) => one.trim()).filter(Boolean);
}

/**
 * Every sentence of the text that holds working detail, with the first kind it holds.
 *
 * @param text  the prose to read, with its fenced blocks already taken out
 */
export function findWorkingDetail(text: string): DetailFinding[] {
  const out: DetailFinding[] = [];
  for (const sentence of sentencesOf(text)) {
    const hit = DETAIL.find((one) => one.found.test(sentence));
    if (hit) out.push({ kind: hit.kind, sentence });
  }
  return out;
}
