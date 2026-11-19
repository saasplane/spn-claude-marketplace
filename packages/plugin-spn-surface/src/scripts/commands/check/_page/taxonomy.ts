// A MODULE'S FOLDERS ARE ITS TAXONOMY AND NOTHING ELSE: `assets/` for the files the code imports and `entry/` for its layers, and under `assets/`
// a folder holds folders or files, never both, grouped by kind first and then by page.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { refusal } from "./page.ts";

const ALLOWED = new Set(["assets", "entry"]);
const folders = (dir: string): string[] => readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory()).sort();

/** The refusals for one module's folder, from its own folders alone. */
export function refusals(module: string): string[] {
  const found: string[] = [];
  for (const name of folders(module))
    if (!ALLOWED.has(name)) found.push(refusal("folder-outside-taxonomy", `${module}/${name}`, "a module holds `assets/` and `entry/` only; move the files into the folder of their kind"));
  const assets = join(module, "assets");
  const mixed = (dir: string): void => {
    const names = readdirSync(dir);
    const directories = names.filter((name) => statSync(join(dir, name)).isDirectory());
    if (directories.length && directories.length < names.length)
      found.push(refusal("folder-outside-taxonomy", dir, "a folder under `assets/` holds folders or files, never both; group by kind first, then by page"));
    for (const name of directories) mixed(join(dir, name));
  };
  try {
    for (const name of readdirSync(assets))
      if (!statSync(join(assets, name)).isDirectory()) found.push(refusal("folder-outside-taxonomy", `${assets}/${name}`, "`assets/` holds folders only, grouped by kind; move the file into the folder of its kind"));
    for (const name of folders(assets)) mixed(join(assets, name));
  } catch { /* a module with no assets/ has none to hold */ }
  return found;
}
