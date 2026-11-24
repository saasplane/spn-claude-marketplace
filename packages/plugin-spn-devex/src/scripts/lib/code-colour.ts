// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/06-blocks.md § Code forms · 08-stylesheet.md § One stylesheet, served in versions
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The colour of a code excerpt, written into the page with the shared script's rules and its `sds-tk-*` token classes.
// A hand-written tokenizer, no library: a token the rules do not know stays plain.

/** One run of a line: its token class (`k` keyword, `s` string, `c` comment, `t` type, `n` number, `add`, `del`), or plain. */
export type Run = { cls: string | null; text: string };

type Spec = { keywords?: Set<string>; comment?: RegExp; type?: RegExp; keys?: RegExp };

const words = (list: string): Set<string> => new Set(list.split(" "));

const TS: Spec = {
  keywords: words("const let var function return if else for while class interface type enum export import from as await async new extends implements readonly public private void null undefined true false"),
  comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
  type: /^[A-Z][A-Za-z0-9_]+$/,
};

/** The languages the writer colours, by the name a fence tag gives; the page script knows the same ones, and the writer adds the names of the same grammar. */
const LANGS: Record<string, Spec> = {
  ts: TS, tsx: TS, typescript: TS, js: TS, mjs: TS, javascript: TS,
  json: { keywords: words("true false null") },
  jsonc: { keywords: words("true false null"), comment: /\/\/[^\n]*/y },
  yaml: { comment: /#[^\n]*/y, keywords: words("true false null yes no on off"), keys: /^([ \t]*(?:- )?)([A-Za-z_][A-Za-z0-9_.\-]*)(?=:)/ },
  sql: { keywords: words("SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX PRIMARY KEY FOREIGN REFERENCES NOT NULL UNIQUE ON DEFAULT ALTER ADD CONSTRAINT AND OR JOIN LEFT INNER GROUP BY ORDER LIMIT"), comment: /--[^\n]*/y },
  sh: { comment: /#[^\n]*/y },
  bash: { comment: /#[^\n]*/y },
  css: { comment: /\/\*[\s\S]*?\*\//y },
  md: {},
};

/** Whether the writer colours this language: a diff by its first character, and the rest by the rules above. */
export const colours = (lang: string): boolean => lang === "diff" || lang in LANGS;

/** The token pattern: a comment is tried first at each position, then a string, a number, a word. A word is classed by the language's lists. */
const STRING = /'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/y;
const NUMBER = /\d+(?:\.\d+)?(?![A-Za-z0-9_])/y;
const WORD = /[A-Za-z_][A-Za-z0-9_]*/y;

function runsOf(code: string, spec: Spec): Run[] {
  const runs: Run[] = [];
  let plain = "";
  const flush = () => { if (plain) { runs.push({ cls: null, text: plain }); plain = ""; } };
  const take = (cls: string, text: string) => { flush(); runs.push({ cls, text }); };
  let at = 0;
  while (at < code.length) {
    const ch = code[at];
    // A key at the start of a line (yaml): the key is the type colour.
    if (spec.keys && (at === 0 || code[at - 1] === "\n")) {
      const line = code.slice(at, code.indexOf("\n", at) < 0 ? code.length : code.indexOf("\n", at));
      const key = spec.keys.exec(line);
      if (key) { plain += key[1]; at += key[1].length; take("t", key[2]); at += key[2].length; continue; }
    }
    // A comment of `#` (yaml, shell) opens at the start of a line or after a space, never inside a word.
    if (spec.comment) {
      spec.comment.lastIndex = at;
      const found = spec.comment.exec(code);
      if (found && (ch !== "#" || at === 0 || /\s/.test(code[at - 1]))) { take("c", found[0]); at += found[0].length; continue; }
    }
    STRING.lastIndex = at;
    const str = STRING.exec(code);
    if (str) { take("s", str[0]); at += str[0].length; continue; }
    if (/[A-Za-z_]/.test(ch)) {
      WORD.lastIndex = at;
      const word = (WORD.exec(code) as RegExpExecArray)[0];
      const cls = spec.keywords?.has(word) ? "k" : spec.type?.test(word) ? "t" : null;
      if (cls) take(cls, word); else plain += word;
      at += word.length;
      continue;
    }
    if (/\d/.test(ch) && (at === 0 || !/[A-Za-z0-9_]/.test(code[at - 1]))) {
      NUMBER.lastIndex = at;
      const num = NUMBER.exec(code);
      if (num) { take("n", num[0]); at += num[0].length; continue; }
    }
    plain += ch;
    at += 1;
  }
  flush();
  return runs;
}

/**
 * The runs of each line of `code` in `lang`, a run that crosses a line break cut at the break so a line holds only its own runs. A
 * language the writer does not colour gives each line one plain run.
 */
export function linesOf(code: string, lang: string): Run[][] {
  if (lang === "diff") {
    return code.split("\n").map((line) => [{ cls: line[0] === "+" ? "add" : line[0] === "-" ? "del" : null, text: line }]);
  }
  const spec = LANGS[lang];
  const lines: Run[][] = [[]];
  for (const run of spec ? runsOf(code, spec) : [{ cls: null, text: code } as Run]) {
    const parts = run.text.split("\n");
    parts.forEach((part, k) => {
      if (k > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ cls: run.cls, text: part });
    });
  }
  return lines;
}
