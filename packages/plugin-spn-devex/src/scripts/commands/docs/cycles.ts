// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status is one of six, stored or worked out
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// A workstream's Cycles table, read from its arcs' data (`arcs/N<nnn>/state.json`): one row per arc, in
// the order the arcs run, in two columns. Arc holds the title, the description and the facts as links
// separated by middots: the preview by its fixed name, each sample, and for CARRIED and DROPPED the reason, and for a decided arc its wait
// the reason. Status holds the badge. The arc's number is the row's id, so `approach.html#N013` opens it
// (RD.DEVEX.WORKSPACE.263), with `data-arc` and its stamp on the row; a rewrite keeps the stamp, which
// only `workstream arc stamp write` writes. `write` also writes
// each arc's name file, `arcs/N<nnn>/<subject>.md` (RD.DEVEX.WORKSPACE.264), and the status in the
// header of each arc's preview, read from the arc (RD.DEVEX.WORKSPACE.266).
//
//   spn-devex docs cycles show <workstream> [--json]   print the table, or the rows as data
//   spn-devex docs cycles write <workstream>           write the parts of the page the arcs decide
//
// <workstream> is the workstream's folder, its approach page, its number (`016`) or its folder name
// (`016-provider-secret-storage`), looked up in `.spndevex/workstreams/{open,backlog,closed}/`.
//
// A SUBJECT WITH TWO ACTIONS. `show` writes no file. `write` writes the parts of the page that the
// arcs decide (RD.DEVEX.WORKSPACE.204): the header's status, the places of `How` with their `Arcs:`
// lines, read from the rows' `repo` (RD.DEVEX.WORKSPACE.251), the Cycles table and the heading of
// `Open`. `doc-check` compares a page with the same reading, through `tableDifferences` and
// `headerStatusRule`.
//
// Every class it reads and writes is a name of the shared stylesheet (05-artifacts.md § One stylesheet,
// served in versions). A page that links no shared stylesheet is refused by `write`, and not written.

import { writeFileSync } from "node:fs";
import { basename, dirname, join, posix, relative, resolve } from "node:path";
import { STATUSES, TERMINAL } from "../../checks/arc-status.ts";
import { cardsIn, mastheadStatus } from "../../checks/split-plan.ts";
import { isDir, isFile, listdir, read, unescape, workspaceRoot } from "../../lib/payload.ts";
import { NO_REPO, PREVIEW_FILE, approachOf, arcIdsOf, arcStatus, blockAt, previewHrefOf, readArc, stampsOn, workstreamWord, writeNameFile, writePreviewStatus } from "../../lib/workstream.ts";
import { ARCS, WORKSTREAM_STATES, isApproachPage, workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linksSharedStyles } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "a workstream's Cycles table, read from its arcs: one row per arc, with its file, its status and its previews";

/** An arc's preview or one of its samples, as its Cycles row links it. */
export type Preview = {
  name: string;            // the file's name
  href: string;            // its path from the workstream folder
  kind: string;            // `preview` or `sample`
};

/** One row of Cycles, and the `state.json` it was read from. */
export type Cycle = {
  id: string;              // `N001`, `N12`, `N1a`
  name: string;            // the arc's title
  does: string;            // one line: what the arc decides
  status: string | null;   // one of STATUSES, or null where the data holds none the set knows
  detail: string;          // the blocker, destination or reason a CARRIED or DROPPED arc carries
  file: string;
  previews: Preview[];     // the preview by its fixed name, then each sample
};

/** The columns of the Cycles table, in order: the arc with its description and facts, then its status. */
export const CYCLES_COLUMNS = ["Arc", "Status"];
/** A header as `tableColumns` reads it: lower case, joined by a middle dot. */
export const headerOf = (columns: string[]): string => columns.join(" · ").toLowerCase();

const MUST_CARRY = new Set(["CARRIED", "DROPPED"]);
// Longest word first, so a longer word that ends in another is never read as the shorter one.
const BY_LENGTH = [...STATUSES].sort((a, b) => b.length - a.length);

/** A cell's text as a person reads it: links to their text, code and emphasis marks gone, spaces collapsed. */
function plain(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The status word at the start of a text, or null. `DROPPED on Q5` and `DROPPED · no account` both read DROPPED. */
export function statusWord(text: string): string | null {
  const head = plain(text).toUpperCase();
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  return BY_LENGTH.find((word) => new RegExp(`^${word}(?![A-Z-])`).test(head)) ?? null;
}

/** The order arcs run in: by number, then by the letter after it. */
function runOrder(a: Cycle, b: Cycle): number {
  const [, an, al] = /^N(\d+)([a-z]?)$/i.exec(a.id) ?? [, "0", ""];
  const [, bn, bl] = /^N(\d+)([a-z]?)$/i.exec(b.id) ?? [, "0", ""];
  if (Number(an) !== Number(bn)) return Number(an) - Number(bn);
  return al < bl ? -1 : al > bl ? 1 : 0;
}

/**
 * One arc kept as data, read into its Cycles row: the title and the line from its `state.json`, the
 * preview by its fixed name and each sample from `notes/N<nnn>/`, or from the folder the arc's
 * `preview` path names where it carries one, and a reason as one of its facts.
 */
export function cycleOfData(folder: string, arc: string): Cycle | null {
  const file = join(folder, ARCS, arc, "state.json");
  let data: { title?: unknown; decides?: unknown; status?: unknown; reason?: unknown; wait?: unknown; preview?: unknown; rows?: unknown } | null = null;
  try { data = JSON.parse(read(file)); } catch { return null; }
  if (!data || typeof data !== "object") return null;
  // The status as it reads, from the one owner: the developer's words, or worked out from the steps (RD.DEVEX.WORKSPACE.307).
  const status = typeof data.status === "string" && (STATUSES as readonly string[]).includes(data.status) && Array.isArray(data.rows)
    ? arcStatus(data as Parameters<typeof arcStatus>[0]) : null;
  const wait = typeof data.wait === "string" && data.wait.trim() ? `wait: ${data.wait.trim()}` : "";
  // An arc carried to another workstream names where its preview now lives, and its samples sit beside it.
  const previewHref = previewHrefOf(arc, { preview: typeof data.preview === "string" ? data.preview : PREVIEW_FILE });
  const notes = posix.dirname(previewHref);
  const previews: Preview[] = [];
  if (isFile(join(folder, previewHref))) previews.push({ name: PREVIEW_FILE, href: previewHref, kind: "preview" });
  for (const sample of listdir(join(folder, notes, "samples")))
    previews.push({ name: sample, href: `${notes}/samples/${sample}`, kind: "sample" });
  return { id: arc, name: typeof data.title === "string" ? data.title : arc, does: typeof data.decides === "string" ? data.decides : "",
           status, detail: wait || (typeof data.reason === "string" ? data.reason : ""), file, previews };
}

/** Every arc of a workstream folder kept as data, as Cycles rows in run order. A folder with no `arcs/` has none. */
export function cyclesOf(folder: string): Cycle[] {
  return arcIdsOf(folder).map((arc) => cycleOfData(folder, arc)).filter((cycle): cycle is Cycle => cycle !== null).sort(runOrder);
}

/** The Arc cell as a person reads it: `N12 — the name`. */
export function arcLabel(cycle: Cycle): string {
  return `${cycle.id} — ${cycle.name}`;
}

/** The Status cell: the word, then what a CARRIED or DROPPED arc must also carry. */
export function statusLabel(cycle: Cycle): string {
  if (!cycle.status) return "(no status)";
  return cycle.detail ? `${cycle.status} · ${cycle.detail}` : cycle.status;
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/—/g, "&mdash;").replace(/·/g, "&middot;");
const attribute = (text: string) => escape(text).replace(/"/g, "&quot;");

/**
 * The facts of an arc, one line of `Key: value` facts separated by middots: its preview first and each
 * sample, keyed by its kind, its name a link; then a CARRIED or DROPPED reason. The arc's data is
 * not linked: it rides on the row as `data-arc`.
 */
export function factsCell(cycle: Cycle): string {
  const link = (href: string, text: string) => `<a href="${attribute(href)}">${escape(text)}</a>`;
  const keyOf = (kind: string) => kind[0].toUpperCase() + kind.slice(1);
  const facts = cycle.previews.map((preview) => `${keyOf(preview.kind)}: ${link(preview.href, preview.name)}`);
  if (cycle.detail && cycle.status && (MUST_CARRY.has(cycle.status) || cycle.detail.startsWith("wait: "))) facts.push(escape(cycle.detail));
  return facts.join(" &middot; ");
}

// A level of an Arc cell: a plain paragraph. The shared stylesheet spaces a cell's title, line and facts.
const CELL_LINE = "<p>";

/**
 * The Arc cell's HTML, in three levels: the title in bold, what the arc does below it in plain text,
 * then its facts as one line of links, in the page's small type.
 */
export function arcCell(cycle: Cycle): string {
  const description = cycle.does ? `${CELL_LINE}${escape(cycle.does)}</p>` : "";
  return `${CELL_LINE}<strong>${escape(arcLabel(cycle))}</strong></p>${description}<span class="sds-small">${factsCell(cycle)}</span>`;
}

/**
 * The Status cell's HTML: the status as its badge. A CARRIED or DROPPED reason, or a wait, is one of the arc's
 * facts, and is shown once, in the Arc cell.
 */
export function statusCell(cycle: Cycle): string {
  if (!cycle.status) return escape(statusLabel(cycle));
  return `<span class="sds-badge sds-status sds-${cycle.status.toLowerCase()}">${escape(cycle.status)}</span>`;
}

/** The two cells of one Cycles row, as HTML, in the order of `CYCLES_COLUMNS`. */
export function rowCells(cycle: Cycle): string[] {
  return [arcCell(cycle), statusCell(cycle)];
}

/**
 * The row's opening tag: an arc kept as data carries its number as the row's id, which is the arc's
 * address on the page (`approach.html#N013`), its data's path, and the stamp the page held for it,
 * which only `workstream arc stamp write` writes, so a rewrite of the table keeps it.
 */
export function rowTag(cycle: Cycle, stamps: Map<string, { stamp: string | null }> = new Map()): string {
  const stamp = stamps.get(cycle.id)?.stamp;
  return `<tr id="${cycle.id}" data-arc="${ARCS}/${cycle.id}/state.json"${stamp ? ` data-arc-stamp="${attribute(stamp)}"` : ""}>`;
}

/** Whether a table holds the row of an arc kept as data under its address, `id="N013"`. */
export const carriesAddress = (table: string, arc: string): boolean =>
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  new RegExp(`<tr\\b[^>]*\\bid="${arc}"[^>]*\\bdata-arc="`).test(table) || new RegExp(`<tr\\b[^>]*\\bdata-arc="[^"]*"[^>]*\\bid="${arc}"`).test(table);

/** The table the approach template's Cycles subsection carries, ready to replace it. */
export function tableOf(cycles: Cycle[], stamps: Map<string, { stamp: string | null }> = new Map()): string {
  const rows = cycles.map((cycle) =>
    `      ${rowTag(cycle, stamps)}${rowCells(cycle).map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
  const statusHead = `<th class="sds-status-col">`;
  return [
    `  <div class="sds-scroll"><table>`,
    `    <thead><tr>${CYCLES_COLUMNS.map((column) => `${column === "Status" ? statusHead : "<th>"}${column}</th>`).join("")}</tr></thead>`,
    `    <tbody>`,
    ...rows,
    `    </tbody>`,
    `  </table></div>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------- the page against the arcs

/** A cell or heading as a person reads it: tags gone, entities resolved, spaces collapsed. */
const flat = (html: string): string => unescape(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Every link in a cell, in order: where it points and the text it shows. */
function anchorsOf(html: string): Array<{ href: string; text: string }> {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((found) => ({ href: unescape(found[1]), text: flat(found[2]) }));
}

/** A cell with its links taken out, as a person reads the rest. */
const withoutAnchors = (html: string): string => flat(html.replace(/<a\b[\s\S]*?<\/a>/gi, " "));

/** The key one Cycles row and one arc share: the arc number, or a row's name where it names none. */
function cycleKey(label: string): string {
  const id = /\bN\d+[a-z]?\b/i.exec(label);
  if (id) return id[0].charAt(0).toUpperCase() + id[0].slice(1);
  return label.toLowerCase().replace(/^arc\s*[—–:-]\s*/, "").replace(/\s+/g, " ").trim();
}

/** The header cells of a table, as a page writes them: lower case, joined by a middle dot. */
export function tableColumns(table: string): string {
  return [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((found) => flat(found[1]).toLowerCase()).join(" · ");
}

/** The title of an Arc cell: its bold text. The description and the links sit around it. */
const titleOf = (cell: string): string => {
  const bold = /<strong\b[^>]*>([\s\S]*?)<\/strong>/i.exec(cell);
  return bold ? flat(bold[1]) : withoutAnchors(cell);
};

/** The facts of an Arc cell: what follows its last paragraph, the line of links. */
const factsOf = (cell: string): string => cell.replace(/^[\s\S]*<\/p>/i, "");

/** The description of an Arc cell: its second paragraph, or in an older cell what is left with the title and the links taken out. */
const lineOf = (cell: string): string => {
  const paragraphs = [...cell.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  return paragraphs.length > 0 ? (paragraphs[1] ? flat(paragraphs[1][1]) : "") : withoutTitle(cell);
};

/** The description of an Arc cell: what is left of it with the title and the links taken out. */
const withoutTitle = (cell: string): string => withoutAnchors(cell.replace(/<strong\b[\s\S]*?<\/strong>/i, " "));

/** The rows of a page's Cycles table, each under the key of the arc it names, in the page's order. */
function tableRows(table: string): Map<string, string[]> {
  const rows = [...(table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [])]
    .map((row) => [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((found) => found[1]))
    .filter((cells) => cells.length >= 2);
  return new Map(rows.map((cells) => [cycleKey(titleOf(cells[0])), cells]));
}

/** The arcs of a workstream, each under the key a Cycles row names it by. */
function arcsByKey(cycles: Cycle[]): Map<string, Cycle> {
  return new Map(cycles.map((cycle) => [cycle.id, cycle]));
}

/**
 * What a page's Cycles table says that its arcs do not: the arcs with no row, the rows naming no arc,
 * and one line for each row that differs from its arc. Rows are matched by arc and never by position,
 * so a page may list the arcs in the order a person chooses. A closed workstream's page stays as it
 * closed, and is not compared.
 */
export function tableDifferences(table: string, cycles: Cycle[]): { missing: string[]; unknown: string[]; stale: string[] } {
  const onPage = tableRows(table);
  const inArcs = arcsByKey(cycles);
  const stale: string[] = [];
  // Cells are read by the header's name, never by position.
  const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((found) => flat(found[1]).toLowerCase());
  const statusAt = headers.indexOf("status") >= 0 ? headers.indexOf("status") : 1;
  for (const [key, cells] of onPage) {
    const cycle = inArcs.get(key);
    if (!cycle) continue;
    const status = flat(cells[statusAt] ?? "");
    if (cycle.status && statusWord(status) !== cycle.status)
      stale.push(`${key} reads ${statusWord(status) ?? `"${status}"`} and the arc reads ${cycle.status}`);
    // The Arc cell holds the title, the description and the facts.
    const expected = arcCell(cycle);
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
    if (!new RegExp(`<tr\\b[^>]*\\bdata-arc="${ARCS}/${cycle.id}/state\\.json"`).test(table))
      stale.push(`${key}'s row does not carry \`data-arc="${ARCS}/${cycle.id}/state.json"\``);
    else if (!carriesAddress(table, cycle.id))
      stale.push(`${key}'s row carries no \`id="${cycle.id}"\`, so \`approach.html#${cycle.id}\` opens nothing`);
    if (titleOf(cells[0]) !== arcLabel(cycle).replace(/\s+/g, " ").trim())
      stale.push(`${key} is named "${titleOf(cells[0])}" and the arc is "${arcLabel(cycle)}"`);
    if (lineOf(cells[0]) !== lineOf(expected))
      stale.push(`${key}'s line is not the arc's own line`);
    // The facts are compared whole, links and their text, as plain text.
    const facts = (html: string) => `${anchorsOf(html).map((anchor) => `${anchor.href} ${anchor.text}`).join("\n")}\n${flat(factsOf(html))}`;
    if (facts(cells[0]) !== facts(expected))
      stale.push(`${key}'s links are not the arc's preview and samples`);
    if (cycle.status && !(cells[statusAt] ?? "").includes(`sds-status sds-${cycle.status.toLowerCase()}`))
      stale.push(`${key}'s Status is not its badge, \`sds-badge sds-status sds-${cycle.status.toLowerCase()}\``);
  }
  return {
    missing: [...inArcs.keys()].filter((key) => !onPage.has(key)),
    unknown: [...onPage.keys()].filter((key) => !inArcs.has(key)),
    stale,
  };
}

/**
 * Where a page's Cycles table sits: the first table after the last `h3` named Cycles inside How,
 * which is where `cyclesRule` reads it. Null where How has no such `h3`, or no table follows it.
 */
export function cyclesTableAt(text: string): { from: number; to: number } | null {
  const how = /<h2\b[^>]*>\s*(?:<[^>]+>\s*)*How\b[\s\S]*?<\/h2>/i.exec(text);
  if (!how) return null;
  const bodyAt = how.index + how[0].length;
  const next = text.slice(bodyAt).search(/<h2\b/i);
  const body = next < 0 ? text.slice(bodyAt) : text.slice(bodyAt, bodyAt + next);
  const named = [...body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)].filter((found) => /^Cycles\b/i.test(flat(found[1]))).at(-1);
  if (!named) return null;
  const table = /<table\b[\s\S]*?<\/table>/i.exec(body.slice(named.index!));
  if (!table) return null;
  const from = bodyAt + named.index! + table.index;
  return { from, to: from + table[0].length };
}

// The three words a workstream page's header shows, each with the class and the glyph the approach
// template writes its badge with (`templates/workstream/approach-template.html`).
export const HEADER_STATUSES = {
  PLANNING: { badge: "sds-planning", glyph: "&#x1F52E;" },
  IMPLEMENTING: { badge: "sds-implementing", glyph: "&#x1F6A7;" },
  DONE: { badge: "sds-done", glyph: "&#x2705;" },
} as const;
export type HeaderStatus = keyof typeof HEADER_STATUSES;
const HEADER_WORDS = Object.keys(HEADER_STATUSES) as HeaderStatus[];

/** Whether a workstream folder sits in `closed/`. */
const isClosed = (folder: string): boolean => basename(dirname(resolve(folder))) === "closed";

/** The word a page's header shows in its labelled status field, or null where it shows none of the three. */
export function headerStatusOf(text: string): HeaderStatus | null {
  const field = mastheadStatus(text)?.toUpperCase();
  if (!field) return null;
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  return HEADER_WORDS.find((word) => new RegExp(`\\b${word}\\b`).test(field)) ?? null;
}

/**
 * The word the arcs give a workstream page's header (05-artifacts.md § How ends in Cycles):
 * `PLANNING` while no arc is past `DECIDED`, `IMPLEMENTING` once one is, and `DONE` for a
 * workstream in `closed/`. It is `workstreamWord`, which the progress block's *Overall* takes too.
 */
export function headerStatusFor(folder: string, cycles: Cycle[] = cyclesOf(folder)): HeaderStatus {
  return workstreamWord(folder, cycles.map((cycle) => cycle.status));
}

/**
 * The header's status where it disagrees with the arcs: the word the page shows and the word the
 * arcs give. Null where they agree, and where the header labels none of the three words. A page in
 * `open/` may read `DONE` once every arc carries a terminal status, because the close gate asks for
 * that stamp before the folder moves.
 */
export function headerStatusRule(folder: string, text: string, cycles: Cycle[] = cyclesOf(folder)): { shows: HeaderStatus; gives: HeaderStatus } | null {
  const shows = headerStatusOf(text);
  if (shows === null) return null;
  const gives = headerStatusFor(folder, cycles);
  if (shows === gives) return null;
  if (shows === "DONE" && cycles.length > 0 && cycles.every((cycle) => cycle.status !== null && TERMINAL.has(cycle.status))) return null;
  return { shows, gives };
}

/** Where the heading of `Open` sits in a page: the inside of the first `h2` whose text starts with Open. */
function openHeadingAt(text: string): { from: number; to: number } | null {
  for (const found of text.matchAll(/(<h2\b[^>]*>)([\s\S]*?)<\/h2>/gi)) {
    if (!/^Open\b/.test(flat(found[2]))) continue;
    const from = found.index! + found[1].length;
    return { from, to: from + found[2].length };
  }
  return null;
}

/** The heading of `Open` as the page writes it, read as a person reads it, or null where it has none. */
export function openHeadingOf(text: string): string | null {
  const at = openHeadingAt(text);
  return at ? flat(text.slice(at.from, at.to)) : null;
}

/**
 * The heading the page's own cards give `Open`: `Open — Q<n> · Q<n>`, each open card by its number,
 * or `Open — no card is open`. A card that carries its decision is not open.
 */
export function openHeadingFor(text: string): string {
  const open = [...new Set(cardsIn(text).filter((card) => !card.decided).map((card) => card.number))];
  return `Open — ${open.length ? open.join(" · ") : "no card is open"}`;
}

// ---------------------------------------------------------------------------- the places of How

/** One place of `How`: a repository the arcs' rows name, and the arcs whose rows reach it, in run order. */
export type Place = { repo: string; arcs: string[] };

/**
 * The places of `How`, read from the arcs (05-artifacts.md § `How` ends in Cycles): each repository an arc's
 * header or rows name, in the order the arcs first reach it, with the arcs that reach it. A row that names
 * no repository reaches no place.
 */
export function placesOf(folder: string): Place[] {
  const places = new Map<string, string[]>();
  for (const cycle of cyclesOf(folder)) {
    const data = readArc(folder, cycle.id);
    if (!data || !Array.isArray(data.rows)) continue;
    const named = [...(Array.isArray(data.repos) ? data.repos : []), ...data.rows.map((row) => row.repo)]
      .filter((repo): repo is string => typeof repo === "string").map((repo) => repo.trim())
      .filter((repo) => repo && !NO_REPO.has(repo));
    for (const repo of new Set(named)) {
      const arcs = places.get(repo) ?? [];
      if (!arcs.includes(cycle.id)) arcs.push(cycle.id);
      places.set(repo, arcs);
    }
  }
  return [...places].map(([repo, arcs]) => ({ repo, arcs }));
}

/** The facts value of a place: its arcs, separated by middots as the page writes them. */
const arcsValue = (place: Place): string => place.arcs.join(" &middot; ");
/** A place's `Arcs:` fact as a page holds it: the arc numbers, separated by middots, and nothing after them. */
const ARCS_FACT = /Arcs:[ \t]*(?:N\d+[a-z]?(?:[ \t]*(?:&middot;|·)[ \t]*N\d+[a-z]?)*)?/;

/** Whether an `h3`'s text names a place: it starts with the repository's name, and the name ends there. */
const namesPlace = (heading: string, repo: string): boolean =>
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  new RegExp(`^${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "i").test(heading);

/** An `h3` id free on the page for a new place, from the repository's name. */
function placeId(text: string, repo: string): string {
  const base = `how-${repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "place"}`;
  let id = base;
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
  for (let at = 2; new RegExp(`\\bid="${id}"`).test(text); at += 1) id = `${base}-${at}`;
  return id;
}

/**
 * The page with each place of `How` written from the arcs, and whether it changed. A place whose `h3` is there
 * gets its `Arcs:` facts line: rewritten where it holds one, put first on its facts line where it has one, or
 * added under its line. A place with no `h3` is added before Cycles, its heading and its `Arcs:` line, for the
 * agent to write the one line under it. A heading that names no place is the agent's and is left as it is.
 */
export function placedPage(text: string, places: Place[]): string {
  const how = /<h2\b[^>]*>\s*(?:<[^>]+>\s*)*How\b[\s\S]*?<\/h2>/i.exec(text);
  if (!how || !places.length) return text;
  let out = text;
  for (const place of places) {
    const bodyAt = how.index + how[0].length;
    const rest = out.slice(bodyAt);
    const next = rest.search(/<h2\b/i);
    const body = next < 0 ? rest : rest.slice(0, next);
    const headings = [...body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
    const cycles = headings.filter((found) => /^Cycles\b/i.test(flat(found[1]))).at(-1);
    if (!cycles) return out;
    const before = headings.filter((found) => found.index! < cycles.index!);
    const value = arcsValue(place);
    const at = before.findIndex((found) => namesPlace(flat(found[1]), place.repo));
    if (at < 0) {
      const where = bodyAt + cycles.index!;
      const added = `<h3 id="${placeId(out, place.repo)}">${escape(place.repo)}</h3>\n  <p><span class="sds-small">Arcs: ${value}</span></p>\n  `;
      out = out.slice(0, where) + added + out.slice(where);
      continue;
    }
    const from = bodyAt + before[at].index! + before[at][0].length;
    const to = bodyAt + (before[at + 1] ?? cycles).index!;
    const part = out.slice(from, to);
    let written: string;
    if (ARCS_FACT.test(part)) written = part.replace(ARCS_FACT, `Arcs: ${value}`);
    else if (/<span class="sds-small">/.test(part)) written = part.replace(/<span class="sds-small">/, `<span class="sds-small">Arcs: ${value} &middot; `);
    else {
      const trail = /\s*$/.exec(part)![0];
      written = `${part.slice(0, part.length - trail.length)}\n  <p><span class="sds-small">Arcs: ${value}</span></p>${trail}`;
    }
    out = out.slice(0, from) + written + out.slice(to);
  }
  return out;
}

/** The parts of a page that the arcs decide, as `write` names them. */
export const PRODUCED_PARTS = { status: "the header's status", places: "the places of How", table: "the Cycles table", open: "the heading of Open" } as const;

/**
 * A workstream's page as `write` leaves it: the header's status, the places of `How`, the Cycles table
 * and the heading of `Open`, each replaced once and only where it differs from what the arcs and the cards give.
 * `wrote` names the parts that changed, and `skipped` says why a part that differs could not be
 * written. Null where the page holds no Cycles table to write.
 */
export function producedPage(folder: string, text: string, cycles: Cycle[] = cyclesOf(folder)): { text: string; wrote: string[]; skipped: string[] } | null {
  if (!cyclesTableAt(text)) return null;
  const wrote: string[] = [];
  const skipped: string[] = [];
  let out = text;
  const splice = (at: { from: number; to: number }, replacement: string): void => {
    out = out.slice(0, at.from) + replacement + out.slice(at.to);
  };

  const status = headerStatusRule(folder, out, cycles);
  if (status) {
    const header = out.indexOf('class="sds-eyebrow"');
    const badge = /<span\b[^>]*\bclass="sds-badge sds-status\b[^"]*"[^>]*>[\s\S]*?<\/span>/i.exec(out.slice(Math.max(header, 0)));
    const ends = out.indexOf("</div>", Math.max(header, 0));
    if (header < 0 || !badge || (ends >= 0 && header + badge.index > ends))
      skipped.push(`${PRODUCED_PARTS.status} reads ${status.shows} and the arcs give ${status.gives}, and the header holds no status badge to write`);
    else {
      const { badge: name, glyph } = HEADER_STATUSES[status.gives];
      splice({ from: header + badge.index, to: header + badge.index + badge[0].length },
        `<span class="sds-badge sds-status ${name}">${glyph} ${status.gives}</span>`);
      wrote.push(PRODUCED_PARTS.status);
    }
  }

  const placed = placedPage(out, placesOf(folder));
  if (placed !== out) { out = placed; wrote.push(PRODUCED_PARTS.places); }

  const table = cyclesTableAt(out)!;
  const current = out.slice(table.from, table.to);
  const differences = tableDifferences(current, cycles);
  if (tableColumns(current) !== headerOf(CYCLES_COLUMNS)
      || differences.missing.length || differences.unknown.length || differences.stale.length) {
    // The rows keep the order the page lists them in, which is the order a person chose. An arc the
    // page does not list yet is added after them, in the order of the arc numbers.
    const inArcs = arcsByKey(cycles);
    const listed = [...tableRows(current).keys()].filter((key) => inArcs.has(key));
    const ordered = [...listed.map((key) => inArcs.get(key)!),
                     ...[...inArcs].filter(([key]) => !listed.includes(key)).map(([, cycle]) => cycle)];
    splice(table, tableOf(ordered, stampsOn(current)).replace(/^\s*<div class="sds-scroll">/, "").replace(/<\/div>$/, ""));
    wrote.push(PRODUCED_PARTS.table);
  }

  // A PAGE WHOSE OPEN IS THE GENERATED `open` BLOCK has its heading written by the `workstream question`
  // commands, from the records, so this leaves it alone.
  const heading = blockAt(out, "open") ? null : openHeadingAt(out);
  const wanted = openHeadingFor(out);
  if (heading && flat(out.slice(heading.from, heading.to)) !== wanted) {
    splice(heading, escape(wanted));
    wrote.push(PRODUCED_PARTS.open);
  }
  return { text: out, wrote, skipped };
}

/**
 * The workstream folder an argument names: a folder, an approach page inside one, or a number or
 * folder name looked up under the workspace's workstreams. Null where none matches.
 */
export function workstreamFolder(target: string, workspace: string | null): string | null {
  const direct = resolve(target);
  if (isDir(direct)) return direct;
  if (isFile(direct) && isApproachPage(direct)) return dirname(direct);
  if (!workspace) return null;
  for (const state of WORKSTREAM_STATES) {
    const base = workstreamsDir(workspace, state);
    const found = listdir(base).find((entry) => entry === target || entry.startsWith(`${target}-`));
    if (found && isDir(join(base, found))) return join(base, found);
  }
  return null;
}

/**
 * The action `write`: bring each approach page of the folder current, or the one page the argument names. A
 * page that is already current is not written, so its bytes and its time stay as they are. A page
 * that links no shared stylesheet is refused with `OWN_COPY`, and no class of it is read.
 */
/**
 * Writes the name file of every arc kept as data, `arcs/N<nnn>/<subject>.md`, where it differs from
 * the arc's data, and says which it wrote. A closed workstream's folder stays as it closed.
 */
function writeNameFiles(folder: string): string[] {
  const wrote: string[] = [];
  for (const arc of arcIdsOf(folder)) {
    const data = readArc(folder, arc);
    if (data && typeof data.subject === "string" && data.subject && writeNameFile(folder, data)) wrote.push(`${arc}/${data.subject}.md`);
  }
  return wrote;
}

/** The views of an arc's status that the approach page holds, as a refresh names them. */
export const VIEW_NAMES: Record<keyof typeof PRODUCED_PARTS, string> = { status: "card", places: "places", table: "cycles", open: "headings" };

/**
 * Every view of the arcs' state, brought current from the arcs' data in one pass: the name files, each
 * preview's Status badge, and the approach page's status card, Cycles table and headings, across all
 * the workstream's arcs. It is what `docs cycles write` does, as a function the `workstream` writes
 * call. `views` names what changed, `skipped` says why a part that differs could not be written. A
 * closed workstream stays as it closed.
 */
export function refreshViews(folder: string): { views: string[]; skipped: string[] } {
  const views: string[] = [];
  const skipped: string[] = [];
  if (isClosed(folder)) return { views, skipped };
  writeNameFiles(folder);
  const previews = writePreviewStatus(folder);
  const page = approachOf(folder);
  if (page) {
    const text = read(page);
    if (!linksSharedStyles(text)) skipped.push(`${basename(page)}: ${OWN_COPY}`);
    else {
      const produced = producedPage(folder, text);
      if (!produced) skipped.push(`${basename(page)} has no Cycles table to write`);
      else {
        skipped.push(...produced.skipped.map((reason) => `${basename(page)}: ${reason}`));
        if (produced.text !== text) writeFileSync(page, produced.text, "utf8");
        const named = (Object.keys(PRODUCED_PARTS) as Array<keyof typeof PRODUCED_PARTS>).filter((key) => produced.wrote.includes(PRODUCED_PARTS[key]));
        if (named.length) views.push(`approach: ${named.map((key) => VIEW_NAMES[key]).join(", ")}`);
      }
    }
  }
  if (previews.length) views.push("preview badge");
  return { views, skipped };
}

/** The status each arc's row in the page's Cycles table shows: the word, and whether its cell is the arc's badge. */
export function tableStatuses(text: string): Map<string, { word: string | null; cell: string }> {
  const at = cyclesTableAt(text);
  if (!at) return new Map();
  const table = text.slice(at.from, at.to);
  const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((found) => flat(found[1]).toLowerCase());
  const statusAt = headers.indexOf("status") >= 0 ? headers.indexOf("status") : 1;
  return new Map([...tableRows(table)].map(([key, cells]) => [key, { word: statusWord(flat(cells[statusAt] ?? "")), cell: cells[statusAt] ?? "" }]));
}

function writePages(folder: string, target: string, cycles: Cycle[]): number {
  const named = resolve(target);
  const pages = isFile(named) && isApproachPage(named)
    ? [named]
    : listdir(folder).filter((entry) => isApproachPage(entry) && isFile(join(folder, entry))).map((entry) => join(folder, entry));
  if (!pages.length) { console.error(`${basename(folder)} has no approach page to write`); return 1; }
  if (isClosed(folder)) {
    console.log(`${basename(folder)} is closed, and its page keeps what it closed with — nothing was written`);
    return 0;
  }
  const names = writeNameFiles(folder);
  if (names.length) console.log(`${basename(folder)}: wrote the name file of ${names.join(", ")}`);
  const previews = writePreviewStatus(folder);
  if (previews.length) console.log(`${basename(folder)}: wrote the status of ${previews.join(", ")}`);
  let code = 0;
  for (const page of pages) {
    const shown = relative(dirname(folder), page);
    const text = read(page);
    if (!linksSharedStyles(text)) {
      console.error(`${shown}: ${OWN_COPY}. Nothing was written.`);
      code = 1;
      continue;
    }
    const produced = producedPage(folder, text, cycles);
    if (!produced) {
      console.error(`${shown} has no Cycles table to write — How ends in an h3 named Cycles, with a table under it ` +
        `(05-artifacts.md § How ends in Cycles). Nothing was written.`);
      code = 1;
      continue;
    }
    for (const reason of produced.skipped) console.error(`! ${shown}: ${reason}`);
    if (produced.text === text) { console.log(`${shown} is current — nothing was written`); continue; }
    writeFileSync(page, produced.text, "utf8");
    console.log(`${shown}: wrote ${produced.wrote.join(", ")}`);
  }
  return code;
}

/** What `show` prints: the table as the page carries it, or each row as data. */
type Form = "table" | "json";

/**
 * Both actions are one reading of the arcs. `show` prints it, and `write` puts it into the page. The
 * workstream is one word, and it is read as typed: a number or a folder name is no path.
 */
function run(args: string[], write: boolean): number {
  const words = readWords(args, write ? {} : { json: FLAG });
  const [target, ...more] = words.paths;
  if (target === undefined) throw new UsageFault("needs a workstream.");
  if (more.length) throw new UsageFault("takes one workstream.");
  const form: Form = words.given("json") ? "json" : "table";
  const workspace = process.env.SPN_WORKSPACE ?? workspaceRoot(process.cwd());
  const folder = workstreamFolder(target, workspace);
  if (!folder)
    throw new UsageFault(`finds no workstream \`${target}\`. Name its folder, its approach page, or its number, as \`spnutils workspace status\` lists it.`);
  const cycles = cyclesOf(folder);
  if (!cycles.length) { console.error(`${basename(folder)} has no arcs — an empty \`arcs/\` has no Cycles yet`); return 1; }
  let code = 0;
  if (write) {
    code = writePages(folder, target, cycles);
  } else if (form === "json") {
    console.log(JSON.stringify(cycles.map((cycle) => ({
      arc: arcLabel(cycle), does: cycle.does, status: statusLabel(cycle), file: basename(cycle.file),
      previews: cycle.previews })), null, 2));
  } else {
    console.log(tableOf(cycles));
  }
  // An arc whose status the set does not know is printed and named, never guessed at: the row still
  // appears, and the arc is the data to mend.
  for (const cycle of cycles.filter((one) => !one.status))
    console.error(`! ${cycle.id} holds no status the set knows (${STATUSES.join(" · ")})`);
  return code;
}

export const actions: Record<string, Action> = {
  show: {
    describe: "print the Cycles table of a workstream from its arcs; with --json, each row as data",
    usage: "<workstream> [--json]",
    run: (args) => run(args, false),
  },
  write: {
    describe: "write the parts of a workstream's page that its arcs decide",
    usage: "<workstream>",
    run: (args) => run(args, true),
  },
};
