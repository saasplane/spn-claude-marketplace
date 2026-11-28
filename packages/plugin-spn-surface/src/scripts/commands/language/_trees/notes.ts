// The words of a note and of a name, read from the catalogue's own words.
import type { CatCase, CatKind } from "./types.ts";

/** A catalogue's words made one plain sentence of at most 150 characters: the first sentence, a capital first, a SHOUTED code lower case. */
export function sentence(text: string | undefined): string {
  let line = (text ?? "").replace(/\s+/g, " ").trim();
  if (!line) return "";
  line = line.charAt(0).toUpperCase() + line.slice(1);
  line = line.split(/(?<=[.!?])\s/)[0].replace(/\.$/, "");
  const ends = /[?!]$/.test(line);
  if (line.length > 150) {
    const cut = Math.max(line.lastIndexOf(", ", 150), line.lastIndexOf(": ", 150));
    line = (cut > 50 ? line.slice(0, cut) : line.slice(0, 150).replace(/\s\S*$/, "")).replace(/[ ,;:]+$/, "");
  }
  line = line.replace(/\b(?!DS)(?:[A-Z]{2,}(?:_[A-Z]+)+|[A-Z]{4,})\b/g, (word) => word.toLowerCase().replace(/_/g, " "));
  return ends && /[?!]$/.test(line) ? line : `${line}.`;
}

/** A code in words: `ON_SCENE` is `on scene`. */
export const words = (code: string): string => code.replace(/_/g, " ").toLowerCase().trim();

/** The note of a kind drawn in one case: what the case says it is for, or what is missing where the design system has not built it. */
export function noteOf(kind: CatKind, one?: CatCase): string {
  const planned = kind.status !== "BUILT" || (one && one.status !== undefined && one.status !== "BUILT");
  if (planned) return `Planned: needs ${(one?.missing ?? kind.missing ?? "a unit the design system has not built").replace(/\.$/, "")}.`;
  return sentence(one?.when ?? kind.description);
}

/** The slug of a code: `GROUP_HOME` is `group-home`. */
export const slugOf = (code: string): string => code.toLowerCase().replace(/_/g, "-");
