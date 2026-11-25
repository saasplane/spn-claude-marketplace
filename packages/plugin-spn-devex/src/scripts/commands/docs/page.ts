// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md · 05-pages.md · 02-document.md
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// Each construct page, produced from its seat file.
//
//   spn-devex docs page check <seat…>   report each page that differs from what its seat file gives
//   spn-devex docs page write <seat…>   write each page, and name the overviews it leaves owed
//   spn-devex docs page stamp <overview…>   record in each overview the construct pages it summarises (RULE.DEVEX.WORKSPACE.581)
//
// A SUBJECT WITH TWO ACTIONS, AND A `file` PATH. A path names one seat file, or a folder of them, and
// the command acts on exactly those. Both actions need a path, because a page is produced from the
// seat file that is named and from no other.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Action, REQUIRED, UsageFault, VALUE, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { bookTemplatesDir, inSeat } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { overviewPages, pageFor, resolveWorkspace, seatPaths } from "./_lib.ts";
import { docsRootOf, isOverview, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { overviewsOwedBy, stampFor, summarisesOf, withSummarises } from "../../lib/overview-stamp.ts";
import { check as docCheck, unfilledPage } from "../../checks/doc-check.ts";
import { PAGE_KINDS, writeNewPage } from "../../lib/page-new.ts";
import { Refusal } from "./_pages.ts";

export const describe = "each construct page, produced from its seat file";

const USAGE = "<seat…>";

/**
 * An HTML page, read for what no page may reach the developer with: a slot left, a section with a heading and nothing under it, or
 * one that holds only a placeholder; and then every finding the page rules give it. A RULE or a BLOCK is exit 1; a hint is said.
 */
function checkPage(file: string, workspace: string): boolean {
  const text = readFileSync(file, "utf8");
  const found = [...unfilledPage(file, text), ...docCheck(file, text)];
  const seen = new Set<string>();
  let failed = false;
  for (const [grade, message] of found) {
    if (seen.has(`${grade}${message}`)) continue;
    seen.add(`${grade}${message}`);
    if (grade === "RULE" || grade === "BLOCK") failed = true;
    console.log(`${grade === "SOFT" ? "!" : "✗"} ${grade.padEnd(4)} page      ${relative(workspace, resolve(file))}\n         ${message}`);
  }
  if (!found.length) console.log(`clean    ${relative(workspace, resolve(file))}`);
  return failed;
}

/** Both actions are one production of each page; `write` is the one that puts it on disk. */
function run(args: string[], write: boolean): number {
  const words = readWords(args);
  const all = scopeOf(words.paths, REQUIRED);
  const workspace = resolveWorkspace();
  // A PAGE IS READ AS ONE: an `.html` file named is checked as a page, a seat file as a seat.
  const pages = all.filter((path) => /\.html?$/i.test(path) && existsSync(path));
  if (pages.length) {
    if (write) { console.log("`docs page write` produces a page from a seat; a hand page is started with `docs page new <kind> <path>`"); return 1; }
    const failed = pages.map((page) => checkPage(page, workspace)).some(Boolean);
    const rest = all.filter((path) => !pages.includes(path));
    return (rest.length ? run(rest, write) : 0) || (failed ? 1 : 0);
  }
  const paths = all;
  // A NAMED PATH THAT IS NOT THERE IS A FINDING, and a run that read no seat file says so. `pageFor`
  // passes over what is not a construct seat in silence, which let a mistyped path exit 0 with no output.
  const missing = paths.filter((path) => !existsSync(path));
  for (const gone of missing) console.log(`✗ RULE page      ${relative(workspace, resolve(gone))}\n         no such file or folder`);
  const seats = seatPaths(paths.filter((path) => !missing.includes(path)));
  if (!seats.some((seat) => inSeat(seat, "constructs")) && !missing.length) {
    console.log("no construct seat file under that path — a page is produced from a construct seat file only");
    return 1;
  }
  const templates = process.env.SPN_TEMPLATES ?? bookTemplatesDir(join(resolve(workspace), "spn-foundation"));
  const found = seats.flatMap((seat) => pageFor(seat, resolve(workspace), templates, write));
  for (const finding of found)
    console.log(`${finding.grade === "RULE" ? "✗" : "!"} ${finding.grade.padEnd(4)} ${finding.check.padEnd(9)} ${relative(workspace, finding.file)}\n         ${finding.message}`);
  // A CONSTRUCT PAGE WRITTEN AGAIN LEAVES ITS OVERVIEWS OWED (RULE.DEVEX.WORKSPACE.581): each one whose stamp names it with an older seat is named, so it is rewritten in the same work.
  if (write) for (const line of owedOverviews(seats, workspace)) console.log(line);
  return missing.length || found.some((finding) => finding.grade === "RULE") ? 1 : 0;
}

/** The overviews of each seat's docs tree that summarise one of these seats with a hash it no longer has, one line each. */
function owedOverviews(seats: string[], workspace: string): string[] {
  const byTree = new Map<string, string[]>();
  const out: string[] = [];
  for (const seat of seats.filter((one) => inSeat(one, "constructs"))) {
    const docs = docsRootOf(slashes(resolve(seat)));
    if (!docs) continue;
    if (!byTree.has(docs)) byTree.set(docs, overviewPages(docs));
    for (const overview of overviewsOwedBy(seat, byTree.get(docs)!))
      out.push(`owed     ${relative(workspace, overview)}\n         summarises ${relative(workspace, resolve(seat))}, which has moved: rewrite the sections that summarise it, then \`docs page stamp\` (RULE.DEVEX.WORKSPACE.581)`);
  }
  return out;
}

/** `docs page stamp <overview…>`: each overview's `summarises`, written from its own doors to construct pages. */
function stamp(args: string[]): number {
  const words = readWords(args);
  const paths = scopeOf(words.paths, REQUIRED);
  const workspace = resolveWorkspace();
  let failed = false;
  for (const path of paths) {
    const file = resolve(path);
    const shown = relative(workspace, file);
    if (!existsSync(file) || !isOverview(slashes(file))) { console.log(`✗ RULE stamp     ${shown}\n         no overview there: a stamp is written on an \`…-overview.html\` in the artifacts pocket's docs folder`); failed = true; continue; }
    const text = readFileSync(file, "utf8");
    const { list, nowhere } = stampFor(file, text);
    for (const door of nowhere) console.log(`✗ RULE stamp     ${shown}\n         the door to \`${door}\` leads nowhere: no construct page's seat file is there`);
    if (nowhere.length) { failed = true; continue; }
    const before = JSON.stringify(summarisesOf(text));
    if (before === JSON.stringify(list)) { console.log(`current  ${shown} · ${list.length} construct pages`); continue; }
    writeFileSync(file, withSummarises(text, list));
    console.log(`stamped  ${shown} · ${list.length} construct pages`);
  }
  return failed ? 1 : 0;
}

/** `docs page new <kind> <path>`: a hand page from its kind's template. */
function made(args: string[]): number {
  const words = readWords(args, { name: VALUE, workstream: VALUE, arc: VALUE });
  const [kind, path, ...more] = words.paths;
  if (!kind || !path || more.length) throw new UsageFault(`takes a kind and a path: \`page new <kind> <path>\`. The kinds: ${Object.keys(PAGE_KINDS).join(" · ")}`);
  const workstream = words.value("workstream");
  try {
    for (const line of writeNewPage(kind, resolve(path), { name: words.value("name") ?? undefined, arc: words.value("arc") ?? undefined, workstream: workstream ? resolve(workstream) : undefined })) console.log(line);
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    console.log(`Refused: ${error.message}. Nothing was written.`);
    return 1;
  }
}

export const actions: Record<string, Action> = {
  check: {
    describe: "report each page that differs from what its seat file gives, and write nothing; an `.html` page is read for slots, empty sections and every page finding",
    usage: USAGE,
    run: (args) => run(args, false),
  },
  write: {
    describe: "write each construct page from its seat file",
    usage: USAGE,
    run: (args) => run(args, true),
  },
  stamp: {
    describe: "record in each overview the construct pages it summarises, each with its seat file's seen hash, read from the overview's own doors; run it after the overview is written against them",
    usage: "<overview…>",
    run: stamp,
  },
  new: {
    describe: "start a hand page from its kind's template: the tool fills what it knows and names the placeholders still to fill",
    usage: "<kind> <path> [--name <name>] [--workstream <NNN-subject>] [--arc <arc>]",
    run: made,
  },
};
