// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc's status says which of eight states it is in
// The chapters are the source of truth; a rule change is edited there first, then here.
//
// A workstream's Cycles table, read from its arcs: one row per arc, in the order the arcs run. A row
// names the arc and links its file, says what the arc does and where it stands, and lists the
// previews and samples the arc's own `## Previews` table carries.
//
//   spn-devex docs cycles show <workstream> [--json]   print the table, or the rows as data
//   spn-devex docs cycles write <workstream>           write the parts of the page the arcs decide
//
// <workstream> is the workstream's folder, its approach page, its number (`016`) or its folder name
// (`016-provider-secret-storage`), looked up in `.spndevex/workstreams/{open,backlog,closed}/`.
//
// A SUBJECT WITH TWO ACTIONS. `show` writes no file. `write` writes the parts of the page that the
// arcs decide (RD.DEVEX.WORKSPACE.204): the header's status, the Cycles table and the heading of
// `Open`. `doc-check` compares a page with the same reading, through `tableDifferences` and
// `headerStatusRule`.
//
// Every class it reads and writes is a name of the shared stylesheet (05-artifacts.md § One stylesheet,
// served in versions). A page that links no shared stylesheet is refused by `write`, and not written.

import { writeFileSync } from "node:fs";
import { basename, dirname, join, posix, relative, resolve } from "node:path";
import { STATUSES, TERMINAL, pastDecided } from "../../checks/arc-status.ts";
import { cardsIn, mastheadStatus } from "../../checks/split-plan.ts";
import { isDir, isFile, listdir, read, unescape, workspaceRoot } from "../../lib/payload.ts";
import { ARCS, WORKSTREAM_STATES, isApproachPage, workstreamsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { OWN_COPY, linksSharedStyles } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "a workstream's Cycles table, read from its arcs: one row per arc, with its file, its status and its previews";

/** One row of an arc's `## Previews` table: a preview page or a sample, and where its review stands. */
export type Preview = {
  name: string;            // the file's name
  href: string | null;     // its path from the workstream folder; null where the row links nothing
  kind: string;            // `preview` or `sample`, as the row states it
  state: string;           // `proposed` or `decided`, the arc's own words — the State cell before any date
};

/** One row of Cycles, and the file it was read from. */
export type Cycle = {
  id: string | null;       // `N001`, `N12`, `N1a` — from the file name; null for an arc file that carries none
  name: string;            // the heading, without the number
  does: string;            // one line: what the arc changes
  status: string | null;   // one of STATUSES, or null where the arc states none the set knows
  detail: string;          // the blocker, destination or reason a HELD, CARRIED or DROPPED arc carries
  file: string;
  previews: Preview[];     // the rows of the arc's `## Previews` table; empty where it reads `None.`
};

/** The columns of the Cycles table, in order. */
export const CYCLES_COLUMNS = ["Arc", "What it does", "Status", "Previews"];

const MUST_CARRY = new Set(["HELD", "CARRIED", "DROPPED"]);
// Longest word first, so `PART-LANDED` is never read as `LANDED`.
const BY_LENGTH = [...STATUSES].sort((a, b) => b.length - a.length);
const ARC_ID = /^(N\d+[a-z]?)(?=-|\.md$)/i;
const STATUS_LINE = /^\s*\*{0,2}Status:?\*{0,2}\s*/i;
const PREVIEWS_HEADING = /^##\s+Previews\b/i;
const TABLE_RULE = /^\|?\s*:?-{3,}/;
const LINK_TARGET = /\]\(\s*<?([^)\s>]+)>?[^)]*\)/;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const DATE = /\d{4}-\d{2}-\d{2}/;

/** Markdown as a person reads it: links to their text, code and emphasis marks gone, spaces collapsed. */
function plain(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The status word at the start of a text, or null. `HELD on Q5` and `HELD · no account` both read HELD. */
export function statusWord(text: string): string | null {
  const head = plain(text).toUpperCase();
  return BY_LENGTH.find((word) => new RegExp(`^${word}(?![A-Z-])`).test(head)) ?? null;
}

/**
 * The arc number a file name carries, with the digits the name writes, or null.
 * `N001-book-change.md` is `N001`, and `N7-N8-flip-and-close.md` is `N7`.
 */
export function arcId(file: string): string | null {
  const found = ARC_ID.exec(basename(file));
  return found ? found[1].charAt(0).toUpperCase() + found[1].slice(1) : null;
}

/**
 * The rows of an arc's `## Previews` table. Each column is found by its heading: File, Kind, State.
 * A link in the File cell is written from the arc file, which sits in `arcs/`, so it is resolved to a
 * path from the workstream folder, where the approach page sits. A section reading `None.`, and an arc
 * with no such section, have no rows.
 */
export function previewsOf(text: string): Preview[] {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => PREVIEWS_HEADING.test(line));
  if (at < 0) return [];
  const rows: string[][] = [];
  for (const line of lines.slice(at + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const row = line.trim();
    if (!row.startsWith("|") || TABLE_RULE.test(row)) continue;
    rows.push(row.replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim()));
  }
  if (rows.length < 2) return [];
  const header = rows[0].map((cell) => plain(cell).toLowerCase());
  const fileAt = header.indexOf("file");
  const kindAt = header.indexOf("kind");
  const stateAt = header.indexOf("state");
  if (fileAt < 0) return [];
  return rows.slice(1).filter((cells) => cells[fileAt]).map((cells) => {
    const target = LINK_TARGET.exec(cells[fileAt])?.[1].replace(/#.*$/, "") ?? null;
    const href = !target ? null
      : HAS_SCHEME.test(target) || target.startsWith("/") ? target
      : posix.normalize(posix.join(ARCS, target));
    const name = target ? posix.basename(target) : cells[fileAt].replace(/`/g, "").trim();
    const stated = plain(cells[stateAt] ?? "");
    const dated = DATE.exec(stated);
    const state = (dated ? stated.slice(0, dated.index) : stated).replace(/[\s—–·,:;(-]+$/, "");
    return { name, href, kind: plain(cells[kindAt] ?? ""), state };
  });
}

/**
 * The File cell an unlinked Previews row should carry: the file's name as a link written from the
 * arc file, which sits in `arcs/`. A name that already holds a path is linked at that path, and a
 * bare name under the arc's own `previews/` folder.
 */
export function previewLinkForm(file: string, name: string): string {
  const target = name.includes("/")
    ? `../${name.replace(/^(?:\.{1,2}\/)+/, "")}`
    : `../notes/${arcId(file) ?? "N<nnn>"}/previews/${name}`;
  return `[\`${posix.basename(name)}\`](${target})`;
}

/** The first sentence of a text. */
function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)[0]?.trim() ?? "";
}

/**
 * One arc file, read into its Cycles row. Arc: the number in the file name and the name in the
 * heading. What it does: the first sentence after the bold status, which the arc template reserves
 * for what the arc changes, or else the `Decides` field. Status: the word, then what a HELD, CARRIED
 * or DROPPED arc must also carry.
 */
export function cycleOf(file: string, text: string): Cycle {
  const lines = text.split("\n");
  const heading = lines.find((line) => /^#\s/.test(line)) ?? "";
  const id = arcId(file);
  const name = plain(heading.replace(/^#\s+/, ""))
    .replace(/^(?:Arc\s*)?(?:N?\d+[a-z]?)?\s*[—–:-]\s*/i, "")
    .trim() || basename(file, ".md");

  // The status line is a paragraph: a long one wraps, and the sentence after the status may sit on
  // the next line. It ends at the first blank line or the next field line.
  const at = lines.findIndex((line) => STATUS_LINE.test(line));
  const paragraph: string[] = [];
  for (let i = at; at >= 0 && i < lines.length; i += 1) {
    if (i > at && (!lines[i].trim() || /^\s*(?:Repos?:|\||#|>|<!--)/.test(lines[i]))) break;
    paragraph.push(lines[i]);
  }
  const afterLabel = paragraph.join(" ").replace(STATUS_LINE, "");
  // The bold span is the status itself; what follows it on the same line says what the arc changes.
  const bold = /^\*\*([^*]*)\*\*(.*)$/.exec(afterLabel.trim());
  const statusText = bold ? bold[1] : afterLabel;
  const status = statusWord(statusText);
  const rest = bold ? bold[2] : "";

  let detail = "";
  if (status && MUST_CARRY.has(status))
    detail = plain(statusText).slice(status.length).replace(/^[\s—–:·,-]+/, "").replace(/[.\s]+$/, "");

  // What precedes the sentence is bookkeeping the status already carries: a date, or when it opened.
  let does = firstSentence(plain(rest)
    .replace(/^[\s,.;:·—–-]+/, "")
    .replace(/^\d{4}-\d{2}-\d{2}\.?\s*/, "")
    .replace(/^Opened\b[^.]*\.\s*/i, ""));
  if (!does) {
    const decides = lines.find((line) => /^\|\s*\*{0,2}Decides\*{0,2}\s*\|/.test(line));
    if (decides) does = firstSentence(plain(decides.split("|")[2] ?? ""));
  }
  return { id, name, does, status, detail, file, previews: previewsOf(text) };
}

/** The order arcs run in: by number, then by the letter after it; an arc with no number last. */
function runOrder(a: Cycle, b: Cycle): number {
  if (a.id && !b.id) return -1;
  if (!a.id && b.id) return 1;
  if (a.id && b.id) {
    const [, an, al] = /^N(\d+)([a-z]?)$/i.exec(a.id)!;
    const [, bn, bl] = /^N(\d+)([a-z]?)$/i.exec(b.id)!;
    if (Number(an) !== Number(bn)) return Number(an) - Number(bn);
    if (al !== bl) return al < bl ? -1 : 1;
  }
  return basename(a.file) < basename(b.file) ? -1 : basename(a.file) > basename(b.file) ? 1 : 0;
}

/** Every arc of a workstream folder, as Cycles rows in run order. A folder with no `arcs/` has none. */
export function cyclesOf(folder: string): Cycle[] {
  const arcs = join(folder, "arcs");
  if (!isDir(arcs)) return [];
  return listdir(arcs)
    .filter((entry) => entry.endsWith(".md") && isFile(join(arcs, entry)))
    .map((entry) => cycleOf(join(arcs, entry), read(join(arcs, entry))))
    .sort(runOrder);
}

/** The Arc cell as a person reads it: `N12 — the name`. */
export function arcLabel(cycle: Cycle): string {
  return cycle.id ? `${cycle.id} — ${cycle.name}` : cycle.name;
}

/** The Status cell: the word, then what a HELD, CARRIED or DROPPED arc must also carry. */
export function statusLabel(cycle: Cycle): string {
  if (!cycle.status) return "(no status)";
  return cycle.detail ? `${cycle.status} · ${cycle.detail}` : cycle.status;
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/—/g, "&mdash;").replace(/·/g, "&middot;");
const attribute = (text: string) => escape(text).replace(/"/g, "&quot;");

/** The arc's file as the approach page links it: its path from the workstream folder. */
export function arcHref(cycle: Cycle): string {
  return `${ARCS}/${basename(cycle.file)}`;
}

/** The Arc cell's HTML: the label in bold, then the arc's file as a link from the page. */
export function arcCell(cycle: Cycle): string {
  const href = arcHref(cycle);
  return `<strong>${escape(arcLabel(cycle))}</strong><br><a class="sds-small" href="${attribute(href)}">${escape(href)}</a>`;
}

/**
 * The Previews cell's HTML: one entry per row of the arc's Previews table, each the file as a link
 * from the page, its kind and its state. An arc with no rows reads as a dash.
 */
export function previewsCell(cycle: Cycle): string {
  if (!cycle.previews.length) return "&mdash;";
  return cycle.previews.map((preview) => {
    const file = preview.href
      ? `<a href="${attribute(preview.href)}">${escape(preview.name)}</a>`
      : escape(preview.name);
    return [file, escape(preview.kind), escape(preview.state)].filter(Boolean).join(" &middot; ");
  }).join("<br>");
}

/** The four cells of one Cycles row, as HTML, in the order of `CYCLES_COLUMNS`. */
export function rowCells(cycle: Cycle): string[] {
  return [arcCell(cycle), escape(cycle.does), escape(statusLabel(cycle)), previewsCell(cycle)];
}

/** The table the approach template's Cycles subsection carries, ready to replace it. */
export function tableOf(cycles: Cycle[]): string {
  const rows = cycles.map((cycle) =>
    `      <tr>${rowCells(cycle).map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
  return [
    `  <div class="sds-scroll"><table>`,
    `    <thead><tr>${CYCLES_COLUMNS.map((column) => `<th>${column}</th>`).join("")}</tr></thead>`,
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

/** The key one Cycles row and one arc share: the arc number, or the name where there is none. */
function cycleKey(label: string): string {
  const id = /\bN\d+[a-z]?\b/i.exec(label);
  if (id) return id[0].charAt(0).toUpperCase() + id[0].slice(1);
  return label.toLowerCase().replace(/^arc\s*[—–:-]\s*/, "").replace(/\s+/g, " ").trim();
}

/** The header cells of a table, as a page writes them: lower case, joined by a middle dot. */
export function tableColumns(table: string): string {
  return [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((found) => flat(found[1]).toLowerCase()).join(" · ");
}

/** The rows of a page's Cycles table, each under the key of the arc it names, in the page's order. */
function tableRows(table: string): Map<string, string[]> {
  const rows = [...(table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [])]
    .map((row) => [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((found) => found[1]))
    .filter((cells) => cells.length >= 3);
  return new Map(rows.map((cells) => [cycleKey(withoutAnchors(cells[0])), cells]));
}

/** The arcs of a workstream, each under the key a Cycles row names it by. */
function arcsByKey(cycles: Cycle[]): Map<string, Cycle> {
  return new Map(cycles.map((cycle) => [cycle.id ?? cycleKey(cycle.name), cycle]));
}

/**
 * What a page's Cycles table says that its arcs do not: the arcs with no row, the rows naming no arc,
 * and one line for each row that differs from its arc. Rows are matched by arc and never by position,
 * so a page may list the arcs in the order a person chooses. With `withPreviews` false only the rows
 * and their statuses are compared, which is what a closed workstream's three-column table is held to.
 */
export function tableDifferences(table: string, cycles: Cycle[], withPreviews = true): { missing: string[]; unknown: string[]; stale: string[] } {
  const onPage = tableRows(table);
  const inArcs = arcsByKey(cycles);
  const stale: string[] = [];
  for (const [key, cells] of onPage) {
    const cycle = inArcs.get(key);
    if (!cycle) continue;
    const status = flat(cells[2]);
    if (cycle.status && statusWord(status) !== cycle.status)
      stale.push(`${key} reads ${statusWord(status) ?? `"${status}"`} and the arc reads ${cycle.status}`);
    if (!withPreviews) continue;
    if (withoutAnchors(cells[0]) !== arcLabel(cycle).replace(/\s+/g, " ").trim())
      stale.push(`${key} is named "${withoutAnchors(cells[0])}" and the arc is "${arcLabel(cycle)}"`);
    const href = arcHref(cycle);
    if (!anchorsOf(cells[0]).some((anchor) => anchor.href === href && anchor.text === href))
      stale.push(`${key} does not link its arc file as ${href}`);
    if (flat(cells[1]) !== cycle.does.replace(/\s+/g, " ").trim())
      stale.push(`${key}'s What it does is not the arc's own line`);
    const previews = previewsCell(cycle);
    const linked = (html: string) => anchorsOf(html).map((anchor) => anchor.href).join(" ");
    if (flat(cells[3] ?? "") !== flat(previews) || linked(cells[3] ?? "") !== linked(previews))
      stale.push(`${key}'s Previews cell is not what the arc's Previews table lists`);
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
  return HEADER_WORDS.find((word) => new RegExp(`\\b${word}\\b`).test(field)) ?? null;
}

/**
 * The word the arcs give a workstream page's header (05-artifacts.md § How ends in Cycles):
 * `PLANNING` while no arc is past `DECIDED`, `IMPLEMENTING` once one is, and `DONE` for a
 * workstream in `closed/`.
 */
export function headerStatusFor(folder: string, cycles: Cycle[] = cyclesOf(folder)): HeaderStatus {
  if (isClosed(folder)) return "DONE";
  return cycles.some((cycle) => pastDecided(cycle.status)) ? "IMPLEMENTING" : "PLANNING";
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

/** The parts of a page that the arcs decide, as `write` names them. */
export const PRODUCED_PARTS = { status: "the header's status", table: "the Cycles table", open: "the heading of Open" } as const;

/**
 * A workstream's page as `write` leaves it: the header's status, the Cycles table and the heading
 * of `Open`, each replaced once and only where it differs from what the arcs and the cards give.
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

  const table = cyclesTableAt(out)!;
  const current = out.slice(table.from, table.to);
  const differences = tableDifferences(current, cycles);
  if (tableColumns(current) !== CYCLES_COLUMNS.join(" · ").toLowerCase()
      || differences.missing.length || differences.unknown.length || differences.stale.length) {
    // The rows keep the order the page lists them in, which is the order a person chose. An arc the
    // page does not list yet is added after them, in the order of the arc numbers.
    const inArcs = arcsByKey(cycles);
    const listed = [...tableRows(current).keys()].filter((key) => inArcs.has(key));
    const ordered = [...listed.map((key) => inArcs.get(key)!),
                     ...[...inArcs].filter(([key]) => !listed.includes(key)).map(([, cycle]) => cycle)];
    splice(table, tableOf(ordered).replace(/^\s*<div class="sds-scroll">/, "").replace(/<\/div>$/, ""));
    wrote.push(PRODUCED_PARTS.table);
  }

  const heading = openHeadingAt(out);
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
  // appears, and the arc is the file to fix.
  for (const cycle of cycles.filter((one) => !one.status))
    console.error(`! ${basename(cycle.file)} states no status the set knows (${STATUSES.join(" · ")})`);
  // A Previews row that links nothing shows on the page as plain text, so the arc is the file to fix.
  for (const cycle of cycles)
    for (const preview of cycle.previews.filter((one) => !one.href))
      console.error(`! ${basename(cycle.file)} names the preview \`${preview.name}\` without a link — write its File cell as ` +
        previewLinkForm(cycle.file, preview.name));
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
