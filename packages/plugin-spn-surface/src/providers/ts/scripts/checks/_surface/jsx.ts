// RESTATES: nothing. It is the TypeScript reader the Surface check stands on: it finds the JSX tags of a
// `.tsx` file and their attributes, and states no rule of its own.
//
// **A TAG READER, NOT A COMPILER.** Bundling the TypeScript compiler would add megabytes and a slow load
// to every write, and borrowing the copy in the repository being edited is a neighbour's file. So this
// walks the text once, in about two hundred lines, and knows four modes: code, a string, a template
// literal and JSX. That is enough for what the notes read, and what it cannot read it leaves alone.
//
// **WHY THE SHARED MASKER IS NOT ENOUGH.** `mask` treats every `'` as a string's start, so an apostrophe
// in JSX text (`You can't`) blanks the file to the next quote; and a tag matched by a pattern such as
// `<DSButton[^>]*>` stops at the `>` of `=>` in `anchor={() => go()}`. Here JSX text is text, and an
// attribute's `{…}` is code read to its matching brace, so neither can move the reader.
//
// **WHERE `<` STARTS A TAG.** In code, only after a token that can come before an expression (`(`, `,`,
// `=`, `?`, `:`, `{`, `&&`, `=>`, `return` …) and only when a name or `>` follows. After a name, a `)` or
// a number it is a comparison or a type's argument (`Record<A, B>`). A tag that does not parse — the
// generic `<T,>(x) => x` of an arrow — is read again as code, and nothing is lost.
//
// **A CONDITION'S BRANCHES ARE KEPT.** Each tag carries the branches it stands in: the two arms of every
// ternary around it and the right side of every `&&`, `||` and `??`. Two tags in the two arms of one
// condition are never on screen together, and a note that counts across a view needs to know it.

/** One attribute as written: a string, an expression, a bare name, or a spread. */
export type Attr = { name: string; kind: "string" | "expr" | "bool" | "spread"; value: string; start: number };

/** One JSX element: its name (`''` for a fragment), where it starts, its attributes and where it stands. */
export type Tag = {
  name: string; start: number; attrs: Attr[]; parent: Tag | null;
  /** The attribute of the parent whose `{…}` holds this tag, or null for a child. */
  inAttr: string | null;
  /** The branches this tag stands in, outermost first, such as `t3:then` or `l5:rhs`. */
  branches: string[];
};

/** Every tag the text holds, and the text with comments, strings and JSX text blanked. */
export type Read = { tags: Tag[]; code: string };

const NAME_START = /[A-Za-z_$]/;
const NAME_CHAR = /[\w$.:-]/;
const BEFORE_EXPRESSION = new Set(["return", "yield", "await", "case", "default", "else", "do", "in", "of",
  "typeof", "void", "delete"]);

export function readJsx(source: string): Read {
  const tags: Tag[] = [];
  const blank: Array<[number, number]> = [];
  let ids = 0;

  const isSpace = (c: string): boolean => c === " " || c === "\t" || c === "\n" || c === "\r";
  const skipSpace = (i: number): number => { while (i < source.length && isSpace(source[i])) i += 1; return i; };
  const nameAt = (i: number): string => {
    if (!NAME_START.test(source[i] ?? "")) return "";
    let j = i + 1;
    while (j < source.length && NAME_CHAR.test(source[j])) j += 1;
    return source.slice(i, j);
  };

  /** A quoted string from `i`; returns the index after its close. A string in code ends at a newline. */
  const skipString = (i: number, inCode: boolean): number => {
    const quote = source[i];
    let j = i + 1;
    while (j < source.length && source[j] !== quote) {
      if (inCode && source[j] === "\\") j += 1;
      else if (inCode && source[j] === "\n") break;
      j += 1;
    }
    blank.push([i + 1, j]);
    return j + 1;
  };

  /**
   * Code from `i` to the first unmatched `close` (or the end), reading every JSX element in it.
   * Returns the index of the close. `parent` and `inherited` are what an element found here stands in.
   */
  const readCode = (i: number, close: string | null, parent: Tag | null, inAttr: string | null, inherited: string[]): number => {
    const marks: string[][] = [[]];
    const ternaries: number[][] = [[]];
    let prev = "";                       // the last token: a punctuation character, or a word
    while (i < source.length) {
      const c = source[i];
      const two = source.slice(i, i + 2);
      const depth = marks.length - 1;
      if (isSpace(c)) { i += 1; continue; }
      if (two === "//") { const end = source.indexOf("\n", i); blank.push([i, end < 0 ? source.length : end]); i = end < 0 ? source.length : end; continue; }
      if (two === "/*") { const end = source.indexOf("*/", i + 2); const stop = end < 0 ? source.length : end + 2; blank.push([i, stop]); i = stop; continue; }
      if (c === "'" || c === '"') { i = skipString(i, true); prev = "x"; continue; }
      if (c === "`") { i = readTemplate(i, parent, inAttr, inherited); prev = "x"; continue; }
      if (depth === 0 && close !== null && c === close) return i;
      if (c === "(" || c === "[" || c === "{") { marks.push([]); ternaries.push([]); prev = c; i += 1; continue; }
      if (c === ")" || c === "]" || c === "}") {
        if (depth > 0) { marks.pop(); ternaries.pop(); }
        prev = c; i += 1; continue;
      }
      if (c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev) || BEFORE_EXPRESSION.has(prev))) {
        let j = i + 1, inClass = false;
        while (j < source.length && source[j] !== "\n" && (inClass || source[j] !== "/")) {
          if (source[j] === "\\") j += 1;
          else if (source[j] === "[") inClass = true;
          else if (source[j] === "]") inClass = false;
          j += 1;
        }
        if (source[j] === "/") { i = j + 1; prev = "x"; continue; }
      }
      if (c === "<" && (prev === "" || "(,=:?[{}!&|;>".includes(prev) || BEFORE_EXPRESSION.has(prev))
          && (source[i + 1] === ">" || NAME_START.test(source[i + 1] ?? ""))) {
        const kept = tags.length, keptBlank = blank.length;
        const end = readElement(i, parent, inAttr, [...inherited, ...marks.flat()]);
        if (end !== null) { i = end; prev = "x"; continue; }
        tags.length = kept; blank.length = keptBlank;
      }
      if (c === "?" && source[i + 1] !== "." && source[i + 1] !== "?") {
        ids += 1; ternaries[depth].push(ids); marks[depth].push(`t${ids}:then`); prev = c; i += 1; continue;
      }
      if (c === ":" && ternaries[depth].length) {
        const id = ternaries[depth].pop() as number;
        const at = marks[depth].indexOf(`t${id}:then`);
        marks[depth].splice(at, marks[depth].length - at, `t${id}:else`);
        prev = c; i += 1; continue;
      }
      if (two === "&&" || two === "||" || two === "??") { ids += 1; marks[depth].push(`l${ids}:rhs`); prev = "&"; i += 2; continue; }
      if (c === "," || c === ";") { marks[depth] = []; ternaries[depth] = []; prev = c; i += 1; continue; }
      const word = /^[A-Za-z_$][\w$]*/.exec(source.slice(i, i + 64))?.[0] ?? "";
      if (word) {
        if (word === "return") { marks[depth] = []; ternaries[depth] = []; }
        prev = BEFORE_EXPRESSION.has(word) ? word : "x"; i += word.length; continue;
      }
      prev = /[\w$]/.test(c) ? "x" : c;
      i += 1;
    }
    return i;
  };

  /** A template literal from its backtick; its `${…}` are code. Returns the index after its close. */
  const readTemplate = (i: number, parent: Tag | null, inAttr: string | null, inherited: string[]): number => {
    let j = i + 1, from = j;
    while (j < source.length && source[j] !== "`") {
      if (source[j] === "\\") { j += 2; continue; }
      if (source[j] === "$" && source[j + 1] === "{") {
        blank.push([from, j]);
        j = readCode(j + 2, "}", parent, inAttr, inherited) + 1;
        from = j;
        continue;
      }
      j += 1;
    }
    blank.push([from, j]);
    return j + 1;
  };

  /** One element from its `<`. Returns the index after it, or null where it is no element. */
  const readElement = (i: number, parent: Tag | null, inAttr: string | null, branches: string[]): number | null => {
    const name = source[i + 1] === ">" ? "" : nameAt(i + 1);
    const tag: Tag = { name, start: i, attrs: [], parent, inAttr, branches };
    tags.push(tag);
    let j = i + 1 + name.length;
    if (name && source[j] === "<") {                           // type arguments: `<DSForm.Field<string | null>`
      let depth = 0;
      for (; j < source.length; j += 1) {
        if (source[j] === "<") depth += 1;
        else if (source[j] === ">" && source[j - 1] !== "=" && --depth === 0) break;
      }
      j += 1;
    }
    if (name) {
      for (;;) {
        j = skipSpace(j);
        if (source.startsWith("/>", j)) return j + 2;
        if (source[j] === ">") break;
        if (source.startsWith("/*", j)) { const end = source.indexOf("*/", j); if (end < 0) return null; blank.push([j, end + 2]); j = end + 2; continue; }
        if (source.startsWith("//", j)) { const end = source.indexOf("\n", j); if (end < 0) return null; blank.push([j, end]); j = end; continue; }
        if (source[j] === "{") {
          const at = skipSpace(j + 1);
          if (!source.startsWith("...", at)) return null;
          const end = readCode(at + 3, "}", tag, null, branches);
          tag.attrs.push({ name: "", kind: "spread", value: source.slice(at + 3, end), start: j });
          j = end + 1;
          continue;
        }
        const attr = nameAt(j);
        if (!attr || attr.includes(".")) return null;
        const start = j;
        j = skipSpace(j + attr.length);
        if (source[j] !== "=") { tag.attrs.push({ name: attr, kind: "bool", value: "", start }); continue; }
        j = skipSpace(j + 1);
        if (source[j] === '"' || source[j] === "'") {
          const end = source.indexOf(source[j], j + 1);
          if (end < 0) return null;
          tag.attrs.push({ name: attr, kind: "string", value: source.slice(j + 1, end), start });
          blank.push([j + 1, end]);
          j = end + 1;
        } else if (source[j] === "{") {
          const end = readCode(j + 1, "}", tag, attr, branches);
          if (end >= source.length) return null;
          tag.attrs.push({ name: attr, kind: "expr", value: source.slice(j + 1, end), start });
          j = end + 1;
        } else if (source[j] === "<") {
          const end = readElement(j, tag, attr, branches);
          if (end === null) return null;
          tag.attrs.push({ name: attr, kind: "expr", value: source.slice(j, end), start });
          j = end;
        } else return null;
      }
    }
    j += 1;                                                    // past the `>` that opens the children
    for (;;) {
      if (j >= source.length) return null;
      if (source.startsWith("</", j)) {
        const closing = nameAt(skipSpace(j + 2));
        if (closing !== name) return null;
        const end = skipSpace(skipSpace(j + 2) + closing.length);
        return source[end] === ">" ? end + 1 : null;
      }
      if (source[j] === "<") {
        const end = readElement(j, tag, null, branches);
        if (end === null) return null;
        j = end;
        continue;
      }
      if (source[j] === "{") {
        const end = readCode(j + 1, "}", tag, null, branches);
        if (end >= source.length) return null;
        j = end + 1;
        continue;
      }
      const from = j;
      while (j < source.length && source[j] !== "<" && source[j] !== "{") j += 1;
      blank.push([from, j]);                                   // JSX text: an apostrophe here is a word
    }
  };

  readCode(0, null, null, null, []);
  const chars = source.split("");
  for (const [from, to] of blank) for (let k = from; k < to && k < chars.length; k += 1) if (chars[k] !== "\n") chars[k] = " ";
  tags.sort((a, b) => a.start - b.start);
  return { tags, code: chars.join("") };
}

/** The attribute of this name, or undefined. */
export const attrOf = (tag: Tag, name: string): Attr | undefined => tag.attrs.find((attr) => attr.name === name);

/** The member a literal enum value names, such as `SOLID` for `{DSVariantType.SOLID}`, or null. */
export function memberOf(tag: Tag, name: string, enumName: string): string | null {
  const attr = attrOf(tag, name);
  if (!attr || attr.kind !== "expr") return null;
  const match = new RegExp(`^\\s*${enumName}\\.([A-Z][A-Z0-9_]*)\\s*$`).exec(attr.value);
  return match ? match[1] : null;
}

/** Whether a tag spreads props it does not name, so a value it seems to lack may arrive unseen. */
export const spreads = (tag: Tag): boolean => tag.attrs.some((attr) => attr.kind === "spread");

/** The 1-based line an offset falls on. */
export function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let k = 0; k < offset && k < source.length; k += 1) if (source[k] === "\n") line += 1;
  return line;
}
