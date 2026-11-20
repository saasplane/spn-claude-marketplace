// `spn-surface language write` — a construct's figures, filled from its own `language` block.
//
//     spn-surface language write <app> [--construct <construct.md>]
//
// The book's construct template marks each figure this command owns as `{{Filled by `spn-surface language write`…}}` under a `###` or a
// `####` heading. The data is the construct's own fenced `json` block whose top key is `language`, under `### The language as data`.
// A placeholder is found by the nearest `<!-- spn:part <part>.<subsection> … -->` marker above it, and the id names a list of rows in the
// block (`media-style.drawing-style` is `language.mediaStyle.drawingStyle`). A heading with no marker above its placeholder falls back to
// its words (`Drawing style` is `language.drawingStyle`). The rows become one table between `<!-- spn:filled <key> -->` markers, its columns
// the keys of the first row. A later run fills the same markers again. Nothing outside a placeholder or a marked block is read or changed,
// so the words of the construct stay its author's. The block's `template` names the version of the construct template it follows, and a
// block whose version this command does not read is refused. With no flag the construct is the nearest `design-language.md` of a
// `surfaces` domain folder, under the repository's constructs folder, above the app. `spn-surface language check` refuses a construct whose
// filled table differs from the block it is filled from.
import { readFileSync, writeFileSync } from "node:fs";
import { REQUIRED, UsageFault, VALUE, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { CONSTRUCT_WORDS, PART_MARKER, PLACEHOLDER, constructOf, keyOf, languageOf, markedBlocks, rowsFor, tableOf, templateRefusal } from "./_data.ts";

export const describe = "Fill a design-language construct's figures (drawing style, characters and building blocks, grounds, drawing kinds) from the `language` block of its own construct";
export const usage = "<app> [--construct <construct.md>]";

export { keyOf, tableOf, languageOf } from "./_data.ts";

export function run(args: string[]): number {
  const words = readWords(args, { construct: VALUE });
  const app = onePath(scopeOf(words.paths, REQUIRED));
  const construct = words.value("construct") ?? constructOf(app);
  if (!construct) throw new UsageFault(`found no ${CONSTRUCT_WORDS} above ${app}; name it with \`--construct <construct.md>\`.`);
  const source = readFileSync(construct, "utf8");
  const language = languageOf(source);
  if (!language) throw new UsageFault(`${construct} holds no \`language\` block; add a fenced \`json\` block \`{ "language": { … } }\` under the heading \`### The language as data\`.`);
  const refused = templateRefusal(language, construct);
  if (refused) { console.log(refused); return 1; }
  const missing: string[] = [];
  // A part id names its rows first, and the heading's words are the fallback.
  const block = (key: string, lead: string, words = ""): string | null => {
    const found = rowsFor(language, key, words);
    if (!found) { missing.push(key); return null; }
    return `<!-- spn:filled ${found.key} -->\n${lead}${tableOf(found.rows)}\n<!-- /spn:filled -->`;
  };
  // THE PLACEHOLDERS FIRST, each under the `###` or `####` heading that holds it, then the blocks an earlier run marked.
  // The nearest `spn:part` marker under a heading names its id; with none, the heading's words do.
  let current = "";
  let byWords = "";
  const lines = source.split("\n").map((line) => {
    const named = /^#{3,4}\s+(.+)$/.exec(line);
    if (named) { byWords = keyOf(named[1]); current = byWords; return line; }
    const marker = PART_MARKER.exec(line);
    if (marker) { current = marker[1]; return line; }
    return PLACEHOLDER.test(line) && current ? block(current, "", byWords) ?? line : line;
  });
  const text = lines.join("\n").replace(markedBlocks(), (whole, key: string, body: string) => {
    const lead = body.split("\n")[0].startsWith("Filled by") ? `${body.split("\n")[0]}\n\n` : "";
    return block(key, lead) ?? whole;
  });
  writeFileSync(construct, text);
  if (missing.length) { console.log(`REFUSED language-data ${construct}: no rows for ${[...new Set(missing)].join(", ")}, which ${construct} marks to be filled`); return 1; }
  console.log(`OK ${construct}: figures filled from its language block`);
  return 0;
}
