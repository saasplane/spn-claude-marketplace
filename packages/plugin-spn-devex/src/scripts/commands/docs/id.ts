// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/06-registers.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The next free number of an id's place.
//
//   spn-devex docs id next <AREA.DOMAIN> [<repository>]   the next RULE. and DEC. id of that place
//
// `RULE` and `DEC` share one number line per place, so it is one past the highest of either, read
// from the repository's register and chapters (the book by default). A place no id carries is refused.

import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Action, REQUIRED, UsageFault, readWords, repositoryOf, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { isDir, read } from "../../lib/payload.ts";
import { resolveWorkspace } from "./_lib.ts";

export const describe = "the next free number of an id's place, past the highest RULE. or DEC. id there";

const PLACE = /^[A-Z_]+\.[A-Z_]+$/;

/** Every `.md` under one folder. */
function markdownUnder(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir).sort(); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) { if (entry !== "node_modules" && entry !== ".git") out.push(...markdownUnder(full)); }
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

function next(args: string[]): number {
  const words = readWords(args);
  const [place, ...rest] = words.paths;
  if (!place || !PLACE.test(place)) throw new UsageFault("needs a place written `<AREA.DOMAIN>`, such as `SUPPORT.SURFACE`.");
  if (rest.length > 1) throw new UsageFault("takes one repository.");
  const repository = rest.length
    ? (repositoryOf(scopeOf(rest, REQUIRED)[0]) ?? resolve(rest[0]))
    : join(resolveWorkspace(), "spn-foundation");
  const docs = join(repository, "docs");
  if (!isDir(docs)) throw new UsageFault(`finds no docs tree in \`${repository}\`.`);
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- the place is checked against PLACE above, so it holds capitals, underscores and one dot
  const carried = new RegExp(`\\b(?:RULE|DEC)\\.${place.replace(".", "\\.")}\\.(\\d{3})\\b`, "g");
  let highest = -1;
  for (const file of markdownUnder(docs))
    for (const hit of read(file).matchAll(carried)) highest = Math.max(highest, Number(hit[1]));
  if (highest < 0) throw new UsageFault(`finds no id at \`${place}\` in \`${repository}\`, and a new place is the developer's call.`);
  const number = String(highest + 1).padStart(3, "0");
  console.log(`RULE.${place}.${number}`);
  console.log(`DEC.${place}.${number}`);
  return 0;
}

export const actions: Record<string, Action> = {
  next: {
    describe: "the next RULE. and DEC. id of a place, one past the highest of either kind in the repository's register and chapters",
    usage: "<AREA.DOMAIN> [<repository>]",
    run: next,
  },
};
