// `spn-surface check module` — a web module's folders, refused where they leave its taxonomy.
//
//     spn-surface check module <module folder>
//
// A module holds `assets/` and `entry/`, and `assets/` holds folders grouped by kind; `spnutils apps validate` passed
// a folder outside them, so this reads the folders themselves. It prints one line for each refusal and exits 1.
import { statSync } from "node:fs";
import { UsageFault, REQUIRED, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { refusals } from "./_page/taxonomy.ts";

export const describe = "Refuse a folder of a web module that is outside its taxonomy: assets/ and entry/ only, folders by kind";
export const usage = "<module folder>";

export function run(args: string[]): number {
  const module = onePath(scopeOf(readWords(args).paths, REQUIRED));
  try { if (!statSync(module).isDirectory()) throw new Error(); } catch { throw new UsageFault(`${module} is no folder.`); }
  const found = refusals(module);
  if (found.length) { console.log(found.join("\n")); return 1; }
  console.log(`OK ${module}: only assets/ and entry/, grouped by kind`);
  return 0;
}
