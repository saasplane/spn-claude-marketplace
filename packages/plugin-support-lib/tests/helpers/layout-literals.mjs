// Every literal a TypeScript source spells — strings, template chunks and regular expressions —
// with comments dropped, and the ones that spell a docs layout folder.
//
// A comment may name a folder: it cites the book, and a citation is prose. What must not name one is
// code, because a path built from a literal is a second statement of the tree that `lib/docs-tree.ts`
// already makes, and the first folder the book moves leaves that copy wrong.

/** Words after which a `/` opens a regular expression rather than dividing. */
const REGEX_AFTER_WORD = new Set(["return", "typeof", "case", "in", "of", "new", "delete", "void", "throw", "else", "do", "yield", "await"]);

/**
 * The literals in a source file, in order: `{ kind: "string" | "template" | "regex", text, line }`.
 * A template is reported one chunk at a time, so `${…}` substitutions are code and are read as code.
 */
export function literalsOf(source) {
  const out = [];
  let i = 0;
  let line = 1;
  let prev = "";            // the last significant character outside a literal
  let word = "";            // the last identifier, when `prev` ended one
  const braces = [];        // for each open `${`, the brace depth it returns to the template at
  let depth = 0;

  const advance = (n = 1) => { for (let k = 0; k < n; k += 1) { if (source[i] === "\n") line += 1; i += 1; } };

  const readTemplate = () => {
    // `i` sits just after a backtick or a closing `}` of a substitution.
    let text = "";
    const start = line;
    while (i < source.length) {
      const c = source[i];
      if (c === "\\") { text += c + (source[i + 1] ?? ""); advance(2); continue; }
      if (c === "`") { advance(); out.push({ kind: "template", text, line: start }); prev = "`"; word = ""; return; }
      if (c === "$" && source[i + 1] === "{") {
        out.push({ kind: "template", text, line: start });
        advance(2);
        braces.push(depth);
        depth += 1;
        prev = "{"; word = "";
        return;
      }
      text += c;
      advance();
    }
    out.push({ kind: "template", text, line: start });
  };

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === "/" && next === "/") { while (i < source.length && source[i] !== "\n") advance(); continue; }
    if (c === "/" && next === "*") {
      advance(2);
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) advance();
      advance(2);
      continue;
    }
    if (c === "'" || c === '"') {
      const start = line;
      advance();
      let text = "";
      while (i < source.length && source[i] !== c && source[i] !== "\n") {
        if (source[i] === "\\") { text += source[i] + (source[i + 1] ?? ""); advance(2); continue; }
        text += source[i];
        advance();
      }
      advance();
      out.push({ kind: "string", text, line: start });
      prev = c; word = "";
      continue;
    }
    if (c === "`") { advance(); readTemplate(); continue; }
    if (c === "/") {
      const opens = prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev) || REGEX_AFTER_WORD.has(word);
      if (opens) {
        const start = line;
        advance();
        let text = "";
        let inClass = false;
        while (i < source.length && source[i] !== "\n") {
          const r = source[i];
          if (r === "\\") { text += r + (source[i + 1] ?? ""); advance(2); continue; }
          if (r === "[") inClass = true;
          else if (r === "]") inClass = false;
          else if (r === "/" && !inClass) break;
          text += r;
          advance();
        }
        advance();
        while (i < source.length && /[a-z]/i.test(source[i])) advance();
        out.push({ kind: "regex", text, line: start });
        prev = ")"; word = "";
        continue;
      }
      prev = "/"; word = "";
      advance();
      continue;
    }
    if (c === "{") { depth += 1; prev = c; word = ""; advance(); continue; }
    if (c === "}") {
      depth -= 1;
      advance();
      if (braces.length && braces[braces.length - 1] === depth) { braces.pop(); readTemplate(); continue; }
      prev = "}"; word = "";
      continue;
    }
    if (/\s/.test(c)) { advance(); continue; }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let w = "";
      while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) { w += source[i]; advance(); }
      word = w;
      prev = "a";
      continue;
    }
    prev = c; word = "";
    advance();
  }
  return out;
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The patterns a layout folder is spelled by, in three strengths:
 *
 * - `numbered` — a seat — counts anywhere, because `02-constructs` means nothing but the folder.
 * - `distinctive` — a pocket, the workstreams container — counts as a whole literal, after a slash
 *   or a regular expression's `(`, `|` or `:`, or before a slash.
 * - `common` — `constructs`, `reports`, `templates` — counts only beside a slash, so a region
 *   named `constructs` is not a folder.
 */
export function layoutPatterns({ numbered, distinctive, common }) {
  const word = "A-Za-z0-9_-";
  const slash = "(?:/|\\\\/)";
  return [
    ...numbered.map((name) => ({ name, pattern: new RegExp(`(?<![${word}])${escape(name)}(?![A-Za-z0-9_])`) })),
    ...distinctive.map((name) => ({ name, pattern:
      new RegExp(`(?:^|[/|(:]|\\\\/)${escape(name)}(?![?${word}])|(?<![${word}])${escape(name)}${slash}`) })),
    ...common.map((name) => ({ name, pattern:
      new RegExp(`${slash}${escape(name)}(?![${word}])|(?<![${word}])${escape(name)}${slash}`) })),
  ];
}

/** Every literal in `source` that spells a layout folder: `[{ line, name, text }]`. */
export function layoutLiterals(source, names) {
  const patterns = layoutPatterns(names);
  const found = [];
  for (const literal of literalsOf(source))
    for (const { name, pattern } of patterns)
      if (pattern.test(literal.text)) found.push({ line: literal.line, name, text: literal.text });
  return found;
}

/**
 * Every layout literal in the `.ts` files under `dir`, skipping the files `exempt` names by their
 * path relative to `dir`: `[{ file, line, name, text }]`.
 */
export async function scanTree(dir, names, exempt = []) {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join, relative } = await import("node:path");
  const walk = (at) => readdirSync(at).sort().flatMap((entry) => {
    const full = join(at, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
  const found = [];
  for (const file of walk(dir).filter((f) => f.endsWith(".ts"))) {
    const rel = relative(dir, file).split("\\").join("/");
    if (exempt.includes(rel)) continue;
    for (const hit of layoutLiterals(readFileSync(file, "utf8"), names)) found.push({ file: rel, ...hit });
  }
  return found;
}
