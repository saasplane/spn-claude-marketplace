#!/usr/bin/env node
// RESTATES: nothing. This tool carries no rule of its own — it reads what the support repository
// publishes and writes it down.
//
// Which libraries a node may depend on, as a table a partner can read without a checkout.
//
// **THE SAME ARGUMENT AS THE MODULE CATALOGUE, ONE AXIS OVER.** A published set moves every
// release, so a hand-written list is stale the day after it is written and nothing reports it.
// The block is a `commands` entry: the citation says *this is what that command produced*, and
// re-running the command is how you check it.
//
// **WHAT IT LEAVES OUT IS THE POINT.** A package that is private, or that carries no name, is not
// something a partner can depend on, so listing it would answer a question about the repository
// rather than about what is available. The count in the table is the count a partner can install.
//
//     node library-catalogue.ts <workspace>            write the TS provider's 14-libraries.md
//     node library-catalogue.ts <workspace> --check    report what would change, write nothing
//
// **THE SUPPORT REPOSITORY IS FOUND, NEVER ASSUMED** — the same stance `restate-drift.ts` takes.
// Run from a partner's checkout it says so and exits clean; an empty table would read as *there
// are no libraries*, which is a different claim from *this checkout cannot see them*.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { seenHash } from "../lib/stamp.ts";

/** One published package, as its own `package.json` declares it. */
type Library = { name: string; version: string; description: string };

const SUPPORT = "spn-support-ts";
/** The TS provider folder's `14-libraries` entry. **THE TWO TREES ANSWER THIS ENTRY DIFFERENTLY**,
 *  and that is deliberate: the book's `14-libraries.md` states the RULE for how a stack distributes
 *  libraries, and this one carries the LIST a partner installs. A rule is written once and a list
 *  moves every release, so only one of them can be generated. */
const OUT = join("spn-claude-marketplace", "plugins", "spn-apps", "src", "refs",
  "support", "apps", "providers", "ts", "14-libraries.md");
/** The generator itself. A `commands` citation names what produced the file, and a hash of the
 *  generator is what says the output is stale: change the renderer and every catalogue it wrote is
 *  owed a re-run. A command STRING would resolve to nothing and report as broken forever. */
/** The book entry this ref answers. The RULE is the book's; the LIST is this file's. */
const BOOK_RULE = "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/14-libraries.md";

/**
 * The hash of the book entry, computed where the book is there and carried forward where it is not.
 *
 * **A HASH WRITTEN DOWN BY HAND IS A HASH SOMEBODY HAS TO REMEMBER**, and this tool already runs in
 * a workspace that holds the book — it needs the support and platform checkouts, and anywhere those
 * exist the book does too. So it reads the chapter and stamps what it read.
 *
 * **A PARTNER'S RUN KEEPS WHAT IS ALREADY STAMPED** rather than blanking it. The book is found,
 * never assumed — the same stance `restate-drift.ts` takes, and for the same reason: a builder's
 * gate that fails for a partner is a gate a partner turns off.
 */
function bookSeen(workspace: string, at: string): string {
  const chapter = join(workspace, BOOK_RULE);
  if (existsSync(chapter)) return seenHash(readFileSync(chapter, "utf8"));
  const standing = existsSync(at) ? /"path": "[^"]*14-libraries\.md", "seen": "([0-9a-f]+)"/.exec(readFileSync(at, "utf8")) : null;
  return standing?.[1] ?? "unread";
}

/**
 * Every published package under the support repository's `packages/`.
 *
 * **A PRIVATE PACKAGE IS NOT A LIBRARY**, and neither is one with no name. Both exist in the
 * repository for reasons of its own, and a partner cannot depend on either.
 */
function libraries(workspace: string): Library[] {
  const packages = join(workspace, SUPPORT, "packages");
  if (!existsSync(packages)) return [];
  const found: Library[] = [];
  for (const folder of readdirSync(packages).sort()) {
    const manifest = join(packages, folder, "package.json");
    if (!existsSync(manifest)) continue;
    const declared = JSON.parse(readFileSync(manifest, "utf8"));
    if (declared.private === true || typeof declared.name !== "string") continue;
    found.push({
      name: declared.name,
      version: typeof declared.version === "string" ? declared.version : "—",
      description: typeof declared.description === "string" ? declared.description : "—",
    });
  }
  return found;
}

function render(found: Library[], bookSeen: string): string {
  // A RESTATEMENT CITES ANOTHER REPOSITORY, NEVER ITS OWN (`RD.DOCS.095`). This file used to stamp
  // `library-catalogue.ts` beside the book rule — a ref in the marketplace citing a script in the
  // marketplace, which has no distance to measure because both move in the same commit. The
  // generator's freshness is the generator's problem, and the paragraph below names the command.
  let out = `<!-- spn:restates\n{\n  "docs": [\n    { "path": "${BOOK_RULE}", "seen": "${bookSeen}" }\n  ]\n}\n-->\n`;
  out += `<!-- spn:generated libraries — do not edit inside these markers; \`library-catalogue.ts\` writes it -->\n`;
  out += `# Libraries — the published packages a node may depend on\n\n`;
  out += `**Source of truth:** the foundation's \`10-providers/ts/14-libraries.md\`. **That chapter states the rule and this ref carries the list**, which is the one entry where the book and this folder answer the same question differently. How a package travels in this stack — the scopes, the registry each one publishes to, and why a consumer pins an exact version rather than a range — is the book's. Which packages exist is nobody's to write by hand, because the set moves at every release.\n\n`;
  out += `**This table is generated from the support repository's own manifests**, and it moves every release. **${found.length} package(s) are published.**\n\n`;
  out += `**A version here names what is published, never what is being worked on.** A release stamps the number and the first edit after it increments, so a number you cannot find published is one that has not been released yet.\n\n`;
  out += `| Package | Version | What it is |\n| --- | --- | --- |\n`;
  for (const library of found) out += `| \`${library.name}\` | \`${library.version}\` | ${library.description} |\n`;
  out += `\n**Depend on a published name, never on a path into a sibling checkout.** A path resolves only for somebody holding both repositories, and a partner holds one.\n`;
  out += `\n<!-- /spn:generated -->\n`;
  return out;
}

export function main(workspace: string, check = false): number {
  if (!existsSync(join(workspace, SUPPORT, "packages"))) {
    console.log("no support checkout here — nothing to catalogue, and the shipped catalogue stands");
    return 0;
  }
  const found = libraries(workspace);
  if (!found.length) {
    console.log("the support checkout publishes no packages — refusing to write an empty catalogue");
    return 0;
  }
  const at = join(workspace, OUT);
  const body = render(found, bookSeen(workspace, at));
  const now = existsSync(at) ? readFileSync(at, "utf8") : "";
  if (now === body) { console.log(`current  ${OUT} — ${found.length} package(s)`); return 0; }
  if (check) { console.log(`would write  ${OUT} — ${found.length} package(s)`); return 1; }
  writeFileSync(at, body);
  console.log(`wrote    ${OUT} — ${found.length} package(s)`);
  // WRITING IS SUCCESS. The exit code says whether the run FAILED, and only --check reports
  // staleness through it — a generator that exits non-zero after writing correctly fails every
  // build that regenerates as a step.
  return 0;
}

if (process.argv[1] && basename(process.argv[1]) === "library-catalogue.ts") {
  const args = process.argv.slice(2);
  process.exit(main(args.find((a) => !a.startsWith("-")) ?? process.cwd(), args.includes("--check")));
}
