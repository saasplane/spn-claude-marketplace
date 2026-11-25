// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-pages.md § Overviews kept in step
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// An overview records the construct pages it summarises, each with the seen hash of its seat file
// when the overview was last written against it (RULE.DEVEX.WORKSPACE.581). The stamp is written
// from the overview's own doors, so nobody types it; the check reads it back against the seat files
// as they are now; and `docs page write` names the overviews a construct page it wrote leaves owed.

import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { isOverview, isProducedPage, producedPageOf, seatOf, slashes } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { seenHash } from "./restates.ts";

/** One construct page an overview summarises: its address from the overview's folder, and its seat file's hash when stamped. */
export type Summarised = { page: string; seen: string };

const BLOCK = /<!--\s*spn:doc\s*([\s\S]*?)-->/;
/** A generated region is written by a command, so a door inside it is the command's, not the overview's own (a glossary links every construct). */
const GENERATED = /<!-- spn:generated [\s\S]*?<!-- \/spn:generated -->/g;

/** The `summarises` list an overview's block carries, or null where it carries none (or no readable block). */
export function summarisesOf(text: string): Summarised[] | null {
  const found = BLOCK.exec(text);
  if (!found) return null;
  try {
    const block = JSON.parse(found[1].trim());
    return Array.isArray(block.summarises) ? block.summarises.filter((one: unknown): one is Summarised =>
      typeof one === "object" && one !== null && typeof (one as Summarised).page === "string" && typeof (one as Summarised).seen === "string") : null;
  } catch { return null; }
}

/**
 * The construct pages an overview opens a door to, as addresses from its own folder, each once, in
 * the order the page first links them. A link with a scheme, an absolute path or only a fragment is
 * no door to a construct page; neither is a link inside a generated region.
 */
export function overviewDoors(file: string, text: string): string[] {
  const body = text.replace(BLOCK, "").replace(GENERATED, "");
  const folder = dirname(resolve(file));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const found of body.matchAll(/href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const href = found[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href)) continue;
    const target = slashes(resolve(folder, href));
    if (!isProducedPage(target)) continue;
    const address = slashes(relative(folder, target));
    if (seen.has(address)) continue;
    seen.add(address);
    out.push(address);
  }
  return out;
}

/** The seen hash of the seat file a construct page is produced from, or null where that seat file is not there. */
export function seatHashOf(page: string): string | null {
  const seat = seatOf(slashes(page));
  return existsSync(seat) ? seenHash(readFileSync(seat, "utf8")) : null;
}

/** The overview's text with its block's `summarises` list written as given, every other byte of the block kept. */
export function withSummarises(text: string, list: Summarised[]): string {
  const found = BLOCK.exec(text);
  if (!found) throw new Error("the overview has no spn:doc block to stamp");
  const inside = found[1];
  const without = inside.replace(/,?\s*"summarises"\s*:\s*\[[^\]]*\]/, "");
  const close = without.lastIndexOf("}");
  if (close < 0) throw new Error("the overview's spn:doc block is not a JSON object");
  const entries = list.map((one) => `    { "page": ${JSON.stringify(one.page)}, "seen": ${JSON.stringify(one.seen)} }`).join(",\n");
  const key = `,\n  "summarises": [${list.length ? `\n${entries}\n  ` : ""}]\n`;
  const next = without.slice(0, close).replace(/\s*$/, "") + key + without.slice(close);
  JSON.parse(next.trim());
  return text.replace(inside, () => next);
}

/** The stamp an overview owes now: one entry for each door to a construct page whose seat file is there, and the doors that lead nowhere. */
export function stampFor(file: string, text: string): { list: Summarised[]; nowhere: string[] } {
  const folder = dirname(resolve(file));
  const list: Summarised[] = [];
  const nowhere: string[] = [];
  for (const page of overviewDoors(file, text)) {
    const hash = seatHashOf(resolve(folder, page));
    if (hash === null) nowhere.push(page);
    else list.push({ page, seen: hash });
  }
  return { list, nowhere };
}

/**
 * What the page check says of an overview against its stamp (RULE.DEVEX.WORKSPACE.581): an entry whose
 * seat file changed since, an entry or a door that leads nowhere, and a door the list does not name.
 * An overview with no stamp yet is told to run it. A page that is no overview gives nothing.
 */
export function stampFindings(file: string, text: string): [grade: "RULE" | "SOFT", message: string][] {
  if (!isOverview(slashes(resolve(file)))) return [];
  const folder = dirname(resolve(file));
  const doors = overviewDoors(file, text);
  const list = summarisesOf(text);
  const out: [grade: "RULE" | "SOFT", message: string][] = [];
  if (list === null) {
    if (doors.length) out.push(["SOFT", `this overview records no construct pages it summarises (${doors.length} doors): once its sections are written against them, run \`spn-devex docs page stamp\` on it (RULE.DEVEX.WORKSPACE.581)`]);
    return out;
  }
  const listed = new Set(list.map((one) => one.page));
  for (const one of list) {
    const now = seatHashOf(resolve(folder, one.page));
    if (now === null) out.push(["RULE", `\`${one.page}\` leads nowhere: no construct page's seat file is there. Take the door out or point it at the page that replaced it, then stamp again (RULE.DEVEX.WORKSPACE.581)`]);
    else if (now !== one.seen) out.push(["RULE", `\`${one.page}\` has moved since this overview was written against it (seen ${one.seen}, now ${now}): rewrite the sections that summarise it, then \`docs page stamp\` (RULE.DEVEX.WORKSPACE.581)`]);
  }
  for (const door of doors)
    if (!listed.has(door)) out.push(["RULE", `the door to \`${door}\` is not in \`summarises\`: write that section against the page, then \`docs page stamp\` (RULE.DEVEX.WORKSPACE.581)`]);
  return out;
}

/**
 * The overviews a seat file leaves owed: each overview of the given set whose stamp names the seat's
 * construct page with a hash the seat file no longer has.
 */
export function overviewsOwedBy(seat: string, overviews: string[]): string[] {
  if (!existsSync(seat)) return [];
  const page = slashes(resolve(producedPageOf(slashes(resolve(seat)))));
  const now = seenHash(readFileSync(seat, "utf8"));
  return overviews.filter((overview) => {
    const list = summarisesOf(readFileSync(overview, "utf8"));
    return !!list && list.some((one) => slashes(resolve(dirname(overview), one.page)) === page && one.seen !== now);
  });
}
