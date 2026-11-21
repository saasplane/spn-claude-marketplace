// What `language write` and `language check` share: the construct's `language` block, how a part id or a heading names its rows,
// and the table those rows become. A file whose name starts with `_` is a helper and is never dispatched.
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DOCS, SEAT, constructsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

export const PLACEHOLDER = /^\{\{Filled by `spn-surface language write`[^}]*\}\}$/;
/** A fresh pattern each call: a global pattern keeps its position between uses. */
export const markedBlocks = (): RegExp => /<!-- spn:filled ([\w.-]+) -->\n([\s\S]*?)<!-- \/spn:filled -->/g;
export const PART_MARKER = /^<!--\s*spn:part\s+([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*)(?:\s[^>]*)?-->\s*$/;
/** The versions of the construct template whose `language` block these commands read. A block with no `template` key is the first. */
export const READS_TEMPLATES: readonly number[] = [1, 2];
/** A construct's place under the constructs folder: a `surfaces` domain folder, whatever its number, holding the construct. */
const SURFACES = /^\d+-surfaces$/;
const CONSTRUCT_FILE = /^\d+-design-language\.md$/;
export const CONSTRUCT_WORDS = `\`${DOCS}/${SEAT.constructs}/<NN>-surfaces/<NN>-design-language.md\``;

/** A heading's words as the data's key: `Drawing style` is `drawingStyle`. */
export const keyOf = (heading: string): string =>
  heading.trim().split(/\s+/).map((word, at) => (at ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase())).join("");

/** A part id's words as the data's key: `media-style` is `mediaStyle`. */
export const camel = (id: string): string => id.split("-").map((word, at) => (at ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join("");

const heading = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1").toLowerCase();
const cell = (value: unknown): string => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** One table for a list of rows, in the columns the first row names. */
export function tableOf(rows: Record<string, unknown>[]): string {
  const columns = Object.keys(rows[0] ?? {});
  return [`| ${columns.map(heading).join(" | ")} |`, `| ${columns.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`)].join("\n");
}

/** The construct's own `language` block: the fenced `json` block whose top key is `language`, or null. */
export function languageOf(text: string): Record<string, unknown> | null {
  for (const match of text.matchAll(/^```json[^\n]*\n([\s\S]*?)^```/gm)) {
    try {
      const parsed = JSON.parse(match[1]) as { language?: unknown };
      if (parsed && typeof parsed === "object" && parsed.language && typeof parsed.language === "object") return parsed.language as Record<string, unknown>;
    } catch { /* a block that is not JSON is not the data */ }
  }
  return null;
}

/** The rows a part id names, `media-style.drawing-style` being `language.mediaStyle.drawingStyle`, or undefined. */
export function rowsOfId(language: Record<string, unknown>, id: string): Record<string, unknown>[] | undefined {
  const [part, subsection] = id.split(".");
  const group = language[camel(part)];
  const rows = group && typeof group === "object" && !Array.isArray(group) ? (group as Record<string, unknown>)[camel(subsection)] : undefined;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : undefined;
}

/** The rows a key names, and the key that found them: a part id first, then the heading's words, and a plain key names `language[key]`. */
export function rowsFor(language: Record<string, unknown>, key: string, words = ""): { rows: Record<string, unknown>[]; key: string } | null {
  const candidates = key.includes(".") ? [key, words] : [key];
  for (const candidate of candidates) {
    const rows = candidate.includes(".") ? rowsOfId(language, candidate) : language[candidate];
    if (Array.isArray(rows) && rows.length) return { rows: rows as Record<string, unknown>[], key: candidate };
  }
  return null;
}

/** The sentence that refuses a block whose `template` is a version these commands do not read, or null. */
export function templateRefusal(language: Record<string, unknown>, construct: string): string | null {
  const template = language.template === undefined ? 1 : language.template;
  if (typeof template === "number" && READS_TEMPLATES.includes(template)) return null;
  return `REFUSED language-template ${construct}: its \`language\` block names template ${JSON.stringify(template)}, and these commands read templates ${READS_TEMPLATES.join(" and ")}`;
}

/** The construct a repository holds, in its constructs folder's `surfaces` domain folder, or null. */
function constructIn(root: string): string | null {
  const constructs = constructsDir(join(root, DOCS));
  if (!existsSync(constructs)) return null;
  for (const domain of readdirSync(constructs).filter((name) => SURFACES.test(name)).sort()) {
    const file = readdirSync(join(constructs, domain)).filter((name) => CONSTRUCT_FILE.test(name)).sort()[0];
    if (file) return join(constructs, domain, file);
  }
  return null;
}

/** The nearest construct above the app, or null. */
export function constructOf(app: string): string | null {
  for (let at = resolve(app); dirname(at) !== at; at = dirname(at)) {
    const found = constructIn(at);
    if (found) return found;
  }
  return null;
}

/** A part's words that only point at where the choice was made, such as "Decided in 041 N008." or "See the arc". */
const POINTER = /^(?:decided|recorded|settled|chosen|agreed)\s+(?:in|by|on|at)\b|^(?:see|per|as in|same as|from)\b/i;

/**
 * The ids of the parts whose whole body is a pointer (RULE.SUPPORT.SURFACE.590). A body is what stands between a part's marker and the next
 * marker or heading, without comments; a table, a list item or a fenced block is a rule, and a body of more than one short sentence is words.
 */
export function pointerParts(source: string): string[] {
  const lines = source.split("\n");
  const found: string[] = [];
  for (let at = 0; at < lines.length; at += 1) {
    const marker = PART_MARKER.exec(lines[at]);
    if (!marker) continue;
    const body: string[] = [];
    for (let next = at + 1; next < lines.length && !PART_MARKER.test(lines[next]) && !/^#{1,6}\s/.test(lines[next]); next += 1) {
      if (lines[next].trim()) body.push(lines[next].trim());
    }
    const words = body.filter((line) => !/^<!--[\s\S]*-->$/.test(line)).join(" ");
    if (words && words.length <= 160 && !/[|`]|^[-*]\s/.test(words) && POINTER.test(words)) found.push(marker[1]);
  }
  return found;
}
