// `spn-surface language diff` — a design language, its data and the catalogue only grow (RULE.SUPPORT.SURFACE.630).
//
//     spn-surface language diff <old.json> <new.json>
//     spn-surface language diff <language> --against <git-ref> [--book <folder>]
//
// It reads two readings of one spec, one data file or the catalogue, and refuses a change that breaks a reader of the old one: a key, a
// kind, a case or a field the old one named that the new one does not, which is what a removal and a rename both look like. A kind, case, role or
// field is retired with `"status": "DEPRECATED"` and `"replacedBy"`, and stays. Anything added, and any value changed, is not a breaking
// change. The `version` key is the one key that may go, because Support's contract stops requiring it in its next release.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { bookFrom, findLanguage } from "./_folder.ts";

export const describe = "Refuse a change to a design language, its data or the catalogue that removes or renames a kind, case, role or field";
export const usage = "<old.json> <new.json> | <language> --against <git-ref> [--book <folder>]";

type Json = unknown;
const isObj = (value: Json): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);
/** The name an array element goes by: its `code`, else its `key`. */
const nameOf = (value: Json): string | null => (isObj(value) ? (typeof value.code === "string" ? value.code : typeof value.key === "string" ? value.key : null) : null);
/** The names the old reading had that the new one lacks, each as a path. */
export function removed(before: Json, after: Json, path = ""): string[] {
  if (isObj(before)) {
    if (!isObj(after)) return [`${path || "/"} was an object and is not`];
    return Object.keys(before).flatMap((key) => {
      const here = path ? `${path}.${key}` : key;
      if (!(key in after)) return path === "" && key === "version" ? [] : [here];
      return removed(before[key], after[key], here);
    });
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    return before.flatMap((one, at) => {
      const name = nameOf(one);
      if (name === null) return [];
      const match = after.find((other) => nameOf(other) === name);
      return match === undefined ? [`${path}[${name}]`] : removed(one, match, `${path}[${name}]`);
    });
  }
  return [];
}

export function run(args: string[]): number {
  const words = readWords(args, { against: VALUE, book: VALUE });
  let before: string; let after: string; let label: string;
  const against = words.value("against");
  if (against) {
    if (words.paths.length !== 1) throw new UsageFault("takes one language with `--against`.");
    const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
    const found = findLanguage(words.paths[0], book, undefined);
    if (!found || !book) throw new UsageFault(`found no spec for \`${words.paths[0]}\`.`);
    try { before = execFileSync("git", ["-C", book, "show", `${against}:${relative(book, found.spec)}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (error) { throw new UsageFault(`git could not read ${relative(book, found.spec)} at ${against}: ${String((error as { stderr?: string }).stderr ?? error).trim()}`); }
    after = readFileSync(found.spec, "utf8"); label = found.spec;
  } else {
    if (words.paths.length !== 2) throw new UsageFault("takes the old file and the new file, or one language with `--against`.");
    for (const file of words.paths) if (!existsSync(file)) throw new UsageFault(`${file} does not exist.`);
    before = readFileSync(words.paths[0], "utf8"); after = readFileSync(words.paths[1], "utf8"); label = words.paths[1];
  }
  const gone = removed(JSON.parse(before), JSON.parse(after));
  if (gone.length) {
    console.log(`REFUSED language-diff ${label}: ${gone.length} name(s) of the old reading are gone, so a reader of it breaks: ${gone.slice(0, 12).join(", ")}${gone.length > 12 ? ", …" : ""}; retire an entry with "status": "DEPRECATED" and "replacedBy" and never remove or rename it`);
    return 1;
  }
  console.log(`OK ${label}: nothing the old reading named is gone`);
  return 0;
}
