// The front matter an order and its report open with (01-workstream.md § The formats): `key: value`
// lines between two `---` lines, each value a flow value — a text, quoted or bare, a number, a list
// in brackets or a map in braces. A `#` outside quotes starts a comment. So a command reads an order
// or a report and never needs to read its prose.

type Flow = string | number | boolean | null | Flow[] | { [key: string]: Flow };

/** The tokens of one flow value: brackets, braces, commas, colons, and scalars. */
function tokens(text: string): string[] {
  const out: string[] = [];
  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (/\s/.test(char)) { at += 1; continue; }
    if ("[]{},:".includes(char)) { out.push(char); at += 1; continue; }
    if (char === '"' || char === "'") {
      let end = at + 1;
      while (end < text.length && text[end] !== char) end += text[end] === "\\" ? 2 : 1;
      out.push(text.slice(at, end + 1));
      at = end + 1;
      continue;
    }
    let end = at;
    while (end < text.length && !"[]{},".includes(text[end]) && !(text[end] === ":" && /\s/.test(text[end + 1] ?? " "))) end += 1;
    out.push(text.slice(at, end).trim());
    at = end;
  }
  return out;
}

function scalar(token: string): Flow {
  if (/^"/.test(token)) { try { return JSON.parse(token) as string; } catch { return token.slice(1, -1); } }
  if (/^'/.test(token)) return token.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
  if (token === "true" || token === "false") return token === "true";
  if (token === "null" || token === "~") return null;
  return token;
}

function parse(list: string[], at: { i: number }): Flow {
  const token = list[at.i++];
  if (token === "[") {
    const items: Flow[] = [];
    while (at.i < list.length && list[at.i] !== "]") { items.push(parse(list, at)); if (list[at.i] === ",") at.i += 1; }
    at.i += 1;
    return items;
  }
  if (token === "{") {
    const map: Record<string, Flow> = {};
    while (at.i < list.length && list[at.i] !== "}") {
      const key = String(scalar(list[at.i++]));
      if (list[at.i] === ":") at.i += 1;
      map[key] = parse(list, at);
      if (list[at.i] === ",") at.i += 1;
    }
    at.i += 1;
    return map;
  }
  return scalar(token ?? "");
}

/** A value with its trailing comment removed. */
function withoutComment(value: string): string {
  let quote = "";
  for (let at = 0; at < value.length; at += 1) {
    const char = value[at];
    if (quote) { if (char === quote) quote = ""; continue; }
    if (char === '"' || char === "'") quote = char;
    else if (char === "#" && (at === 0 || /\s/.test(value[at - 1]))) return value.slice(0, at).trim();
  }
  return value.trim();
}

/** One flow value, read. */
export function flowValue(text: string): Flow {
  const list = tokens(withoutComment(text));
  return list.length ? parse(list, { i: 0 }) : null;
}

/** The front matter of a file as a map, or null where it opens with none. */
export function frontMatter(text: string): Record<string, Flow> | null {
  const lines = text.replace(/^﻿/, "").split("\n");
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((line, at) => at > 0 && line.trim() === "---");
  if (end < 0) return null;
  const out: Record<string, Flow> = {};
  for (const line of lines.slice(1, end)) {
    const found = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (found) out[found[1]] = flowValue(found[2]);
  }
  return out;
}
