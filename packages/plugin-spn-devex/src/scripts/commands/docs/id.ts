// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/06-registers.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// The next free number of an id's place.
//
//   spn-devex docs id next <AREA.DOMAIN> [<repository>]   the next RULE. and DEC. id of that place
//
// `RULE` and `DEC` share one number line per place, so it is one past the highest of either, read
// from the register and chapters of the repository that owns the place. A place no id carries is refused.

import { readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type Action, REQUIRED, UsageFault, readWords, repositoryOf, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { decisionsRegister, docsOf } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { isDir, isFile, read } from "../../lib/payload.ts";
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

/**
 * The repositories of the workspace that own the place: those whose chapters state one of its rules,
 * written `(rule RULE.<place>.<NNN>`, or whose register holds one of its rows as a first cell.
 *
 * A CITATION IS NOT OWNERSHIP. The book cites a repository's ids and a repository cites the book's, so
 * counting every id a repository's docs carry put a repository's place on the book's number line once
 * an id stopped naming its repository (RULE.DEVEX.WORKSPACE.178).
 */
function ownersOf(place: string, workspace: string): string[] {
  const escaped = place.replace(".", "\\.");
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- the place is checked against PLACE, so it holds capitals, underscores and one dot
  const stated = new RegExp(`\\(rule RULE\\.${escaped}\\.\\d{3}\\b`);
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- as above
  const row = new RegExp(`^\\|\\s*DEC\\.${escaped}\\.\\d{3}\\s*\\|`, "m");
  const owners: string[] = [];
  let entries: string[];
  try { entries = readdirSync(workspace).sort(); } catch { return owners; }
  for (const entry of entries) {
    const repository = join(workspace, entry);
    if (!isDir(docsOf(repository))) continue;
    const register = decisionsRegister(docsOf(repository));
    if ((isFile(register) && row.test(read(register))) ||
        markdownUnder(docsOf(repository)).some((file) => stated.test(read(file))))
      owners.push(repository);
  }
  return owners;
}

function next(args: string[]): number {
  const words = readWords(args);
  const [place, ...rest] = words.paths;
  if (!place || !PLACE.test(place)) throw new UsageFault("needs a place written `<AREA.DOMAIN>`, such as `SUPPORT.SURFACE`.");
  if (rest.length > 1) throw new UsageFault("takes one repository.");
  const workspace = resolveWorkspace();
  const named = rest.length ? (repositoryOf(scopeOf(rest, REQUIRED)[0]) ?? resolve(rest[0])) : null;
  const owners = ownersOf(place, workspace);
  if (owners.length > 1)
    throw new UsageFault(`finds \`${place}\` stated in ${owners.map((owner) => basename(owner)).join(" and ")}, and a place belongs to one repository.`);
  // A REPOSITORY IS KNOWN BY ITS FOLDER'S NAME, so a worktree of the owner answers as the owner and is
  // read in its place: it holds the branch being written.
  const owner = owners[0] ?? null;
  if (owner && named && basename(named) !== basename(owner))
    throw new UsageFault(`refuses \`${place}\` in \`${basename(named)}\`: ${basename(owner)} states its rules, so its next number is that repository's.`);
  const repository = named ?? owner ?? join(workspace, "spn-foundation");
  const docs = docsOf(repository);
  if (!isDir(docs)) throw new UsageFault(`finds no docs tree in \`${repository}\`.`);
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- the place is checked against PLACE above, so it holds capitals, underscores and one dot
  const carried = new RegExp(`\\b(?:RULE|DEC)\\.${place.replace(".", "\\.")}\\.(\\d{3})\\b`, "g");
  let highest = -1;
  for (const file of markdownUnder(docs))
    for (const hit of read(file).matchAll(carried)) highest = Math.max(highest, Number(hit[1]));
  if (highest < 0) throw new UsageFault(`finds no id at \`${place}\` in \`${repository}\`, and a new place is the developer's call.`);
  const number = String(highest + 1).padStart(3, "0");
  console.log(`RULE.${place}.${number}`);
  console.log(`DEC.${place}.${number}` + (owner ? `  read from ${basename(owner)}, which states the rules of ${place}` : ""));
  return 0;
}

export const actions: Record<string, Action> = {
  next: {
    describe: "the next RULE. and DEC. id of a place, one past the highest of either kind in the register and chapters of the repository that owns it",
    usage: "<AREA.DOMAIN> [<repository>]",
    run: next,
  },
};
