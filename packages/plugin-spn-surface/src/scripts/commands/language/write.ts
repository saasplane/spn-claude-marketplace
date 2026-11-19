// `spn-surface language write` — a construct's figures, filled from its own `language` block.
//
//     spn-surface language write <app> [--construct <construct.md>]
//
// The book's construct template marks each figure this command owns as `{{Filled by `spn-surface language write`…}}` under a `###`
// heading. The data is the construct's own fenced `json` block whose top key is `language`, under `### The language as data`. The heading names a list of rows in that block (`Drawing style` is `drawingStyle`, `Grounds and drawing kinds` is
// `groundsAndDrawingKinds`), and the rows become one table between `<!-- spn:filled <key> -->` markers, its columns the keys of the first
// row. A later run fills the same markers again. Nothing outside a placeholder or a marked block is read or changed, so the words of the
// construct stay its author's. With no flag the construct is the nearest `docs/02-constructs/02-surfaces/03-design-language.md` above the app.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { REQUIRED, UsageFault, VALUE, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { DOCS, constructsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

export const describe = "Fill a design-language construct's figures (drawing style, characters and building blocks, grounds, samples) from the `language` block of its own construct";
export const usage = "<app> [--construct <construct.md>]";

const PLACEHOLDER = /^\{\{Filled by `spn-surface language write`[^}]*\}\}$/;
const MARKED = /<!-- spn:filled (\w+) -->\n([\s\S]*?)<!-- \/spn:filled -->/g;
const CONSTRUCT = join(constructsDir(DOCS), "02-surfaces", "03-design-language.md");

/** A heading's words as the data's key: `Drawing style` is `drawingStyle`. */
export const keyOf = (heading: string): string =>
  heading.trim().split(/\s+/).map((word, at) => (at ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase())).join("");

const heading = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1").toLowerCase();
const cell = (value: unknown): string => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** One table for a list of rows, in the columns the first row names. */
export function tableOf(rows: Record<string, unknown>[]): string {
  const columns = Object.keys(rows[0] ?? {});
  return [`| ${columns.map(heading).join(" | ")} |`, `| ${columns.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`)].join("\n");
}

/** The construct's own `language` block: the fenced `json` block whose top key is `language`, or null. */
export function languageOf(text: string): Record<string, Record<string, unknown>[] | undefined> | null {
  for (const match of text.matchAll(/^```json[^\n]*\n([\s\S]*?)^```/gm)) {
    try {
      const parsed = JSON.parse(match[1]) as { language?: unknown };
      if (parsed && typeof parsed === "object" && parsed.language && typeof parsed.language === "object") return parsed.language as Record<string, Record<string, unknown>[] | undefined>;
    } catch { /* a block that is not JSON is not the data */ }
  }
  return null;
}

/** The nearest construct above the app, or null. */
function constructOf(app: string): string | null {
  for (let at = resolve(app); dirname(at) !== at; at = dirname(at)) {
    const found = join(at, CONSTRUCT);
    if (existsSync(found)) return found;
  }
  return null;
}

export function run(args: string[]): number {
  const words = readWords(args, { construct: VALUE });
  const app = onePath(scopeOf(words.paths, REQUIRED));
  const construct = words.value("construct") ?? constructOf(app);
  if (!construct) throw new UsageFault(`found no ${CONSTRUCT} above ${app}; name it with \`--construct <construct.md>\`.`);
  const source = readFileSync(construct, "utf8");
  const language = languageOf(source);
  if (!language) throw new UsageFault(`${construct} holds no \`language\` block; add a fenced \`json\` block \`{ "language": { … } }\` under the heading \`### The language as data\`.`);
  const missing: string[] = [];
  const block = (key: string, lead: string): string | null => {
    const rows = language[key];
    if (!Array.isArray(rows) || !rows.length) { missing.push(key); return null; }
    return `<!-- spn:filled ${key} -->\n${lead}${tableOf(rows)}\n<!-- /spn:filled -->`;
  };
  // THE PLACEHOLDERS FIRST, each under the `###` heading that names its rows, then the blocks an earlier run marked.
  let current = "";
  const lines = source.split("\n").map((line) => {
    const named = /^###\s+(.+)$/.exec(line);
    if (named) { current = keyOf(named[1]); return line; }
    return PLACEHOLDER.test(line) && current ? block(current, "") ?? line : line;
  });
  const text = lines.join("\n").replace(MARKED, (whole, key: string, body: string) => {
    const lead = body.split("\n")[0].startsWith("Filled by") ? `${body.split("\n")[0]}\n\n` : "";
    return block(key, lead) ?? whole;
  });
  writeFileSync(construct, text);
  if (missing.length) { console.log(`REFUSED language-data ${construct}: no rows for ${[...new Set(missing)].join(", ")}, which ${construct} marks to be filled`); return 1; }
  console.log(`OK ${construct}: figures filled from its language block`);
  return 0;
}
