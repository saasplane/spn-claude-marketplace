// `spn-surface language check` — a construct whose filled tables differ from the block they are filled from is refused.
//
//     spn-surface language check <app> [--construct <construct.md>]
//
// `language write` fills each figure between `<!-- spn:filled <key> -->` markers from the construct's own `language` block, and the words
// and the values must never drift apart. This reads every marked table, writes it again from the block, and refuses each one that differs,
// naming its key. It also refuses a block whose `template` it does not read, and a marked key the block holds no rows for. It changes
// nothing: `language write` is what brings a construct back in step. It also refuses a part whose words are a pointer alone, such as
// "Decided in 041 N008.", because no part holds a pointer in place of its rule (RULE.SUPPORT.SURFACE.590).
import { readFileSync } from "node:fs";
import { REQUIRED, UsageFault, VALUE, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { CONSTRUCT_WORDS, PART_MARKER, constructOf, languageOf, markedBlocks, pointerParts, rowsFor, tableOf, templateRefusal } from "./_data.ts";

export const describe = "Refuse a design-language construct whose filled tables differ from the `language` block they are filled from";
export const usage = "<app> [--construct <construct.md>]";

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
  const drifted: string[] = [];
  const empty: string[] = [];
  let filled = 0;
  for (const match of source.matchAll(markedBlocks())) {
    filled += 1;
    const key = match[1];
    const found = rowsFor(language, key);
    if (!found) { empty.push(key); continue; }
    // The table is the marked body without the lead line `language write` keeps above it.
    const table = match[2].split("\n").filter((line) => line.startsWith("|")).join("\n");
    if (table !== tableOf(found.rows)) drifted.push(key);
  }
  if (empty.length) { console.log(`REFUSED language-data ${construct}: no rows for ${empty.join(", ")}, which ${construct} holds filled tables of`); return 1; }
  if (drifted.length) { console.log(`REFUSED language-drift ${construct}: the table for ${drifted.join(", ")} differs from the \`language\` block it is filled from; run \`spn-surface language write\``); return 1; }
  const pointers = pointerParts(source);
  if (pointers.length) { console.log(`REFUSED language-pointer ${construct}: ${pointers.length} part(s) hold a pointer and no rule: ${pointers.join(", ")}; write the choice, or the status DEFAULT with the design system's default it follows, or NONE (RULE.SUPPORT.SURFACE.590)`); return 1; }
  console.log(`OK ${construct}: ${filled} filled table(s) match the language block`);
  return 0;
}
