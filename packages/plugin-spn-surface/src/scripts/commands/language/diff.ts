// `spn-surface language diff` — a design language, its data and the catalogue only grow (RULE.SUPPORT.SURFACE.630).
//
//     spn-surface language diff <old.json> <new.json>
//     spn-surface language diff <language> [--against <git-ref>] [--book <folder>]
//
// It reads two readings and refuses a change that breaks a reader of the old one: a key, a kind, a case, a type or a field the old
// one named that the new one does not, which is what a removal and a rename both look like. With a language it reads every file of
// the language's folder, and of each parent in the same repository, on the branch against the branch's base (`--against`, else
// where the branch leaves origin/develop or origin/main). A retired entry keeps `"status": "DEPRECATED"` and `"replacedBy"`.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { bookFrom, findLanguage, parentName } from "./_folder.ts";

export const describe = "Refuse a change to a design language, its data or the catalogue that removes or renames a kind, case, role or field";
export const usage = "<old.json> <new.json> | <language> [--against <git-ref>] [--book <folder>]";

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
      if (!(key in after)) return key === "version" ? [] : [here];
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

const git = (book: string, args: string[]): string => execFileSync("git", ["-C", book, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** Where the branch leaves the line it merges into: origin/develop, else origin/main. */
function branchBase(book: string): string {
  for (const line of ["origin/develop", "origin/main"]) {
    try { return git(book, ["merge-base", "HEAD", line]); } catch { /* the next line */ }
  }
  throw new UsageFault("found no origin/develop or origin/main to compare with; name the base with `--against <git-ref>`.");
}

/** Every JSON file of a language's folder, by its path from the repository. */
function folderFiles(book: string, folder: string): string[] {
  return git(book, ["ls-files", "--others", "--cached", "--exclude-standard", "--", relative(book, folder)]).split("\n").filter((one) => one.endsWith(".json"));
}

export function run(args: string[]): number {
  const words = readWords(args, { against: VALUE, book: VALUE });
  if (words.paths.length === 1) {
    const book = words.value("book") ? resolve(words.value("book") as string) : bookFrom(process.cwd());
    const found = findLanguage(words.paths[0], book, undefined);
    if (!found || !book) throw new UsageFault(`found no language \`${words.paths[0]}\`.`);
    const base = words.value("against") ?? branchBase(book);
    const folders = [found.folder];
    for (let parent = parentName((JSON.parse(readFileSync(found.spec, "utf8")) as Record<string, unknown>).extends), guard = 0; parent && guard < 8; guard++) {
      const next = findLanguage(parent, book, undefined);
      if (!next) break;
      folders.push(next.folder);
      parent = parentName((JSON.parse(readFileSync(next.spec, "utf8")) as Record<string, unknown>).extends);
    }
    const refused: string[] = [];
    let read = 0;
    for (const folder of folders) for (const file of folderFiles(book, folder)) {
      let before: string;
      try { before = git(book, ["show", `${base}:${file}`]); } catch { continue; }
      read += 1;
      if (!existsSync(join(book, file))) { refused.push(`${file} is gone`); continue; }
      const gone = removed(JSON.parse(before), JSON.parse(readFileSync(join(book, file), "utf8")));
      if (gone.length) refused.push(`${file}: ${gone.slice(0, 8).join(", ")}${gone.length > 8 ? ", …" : ""}`);
    }
    if (refused.length) {
      for (const line of refused) console.log(`REFUSED language-diff ${found.name}: ${line}; retire an entry with "status": "DEPRECATED" and "replacedBy" and never remove or rename it`);
      return 1;
    }
    console.log(`OK ${found.name}: ${read} file(s) of ${folders.length} language(s) against ${base.slice(0, 12)}, nothing the old reading named is gone`);
    return 0;
  }
  if (words.paths.length !== 2) throw new UsageFault("takes the old file and the new file, or one language.");
  for (const file of words.paths) if (!existsSync(file)) throw new UsageFault(`${file} does not exist.`);
  const gone = removed(JSON.parse(readFileSync(words.paths[0], "utf8")), JSON.parse(readFileSync(words.paths[1], "utf8")));
  if (gone.length) {
    console.log(`REFUSED language-diff ${words.paths[1]}: ${gone.length} name(s) of the old reading are gone, so a reader of it breaks: ${gone.slice(0, 12).join(", ")}${gone.length > 12 ? ", …" : ""}; retire an entry with "status": "DEPRECATED" and "replacedBy" and never remove or rename it`);
    return 1;
  }
  console.log(`OK ${words.paths[1]}: nothing the old reading named is gone`);
  return 0;
}
