#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § Reports and templates
//           docs/04-capabilities/01-devex/04-workspace/04-docs/02-document.md § Metadata
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Measure a report again and write its numbers into its page.
//
//     spn-devex report refresh <page>
//
// It writes numbers and never a sentence, and it names each row it could not place; the capability
// chapter "Scripts in spn-devex", § A report's numbers are measured again by a command, says what it
// refreshes and what it refuses.

import { readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { withOffset } from "../../lib/clock.ts";
import { foundationAbsence as testsAbsence, measure as measureTests } from "../behaviours/coverage.ts";
import { foundationAbsence as coverageAbsence, levelRows, measure as measureCoverage } from "../coverage/measure.ts";

export const describe = "measure a coverage or a tests report again and write the numbers into its page";

/** The report types one measuring command covers, and the ones several commands and a reading cover. */
const REFRESHED = ["COVERAGE", "TESTS"];
const READ_BY_HAND = ["AUDIT", "CODE", "DOCS"];

/** The statuses a tests report counts, in the order its tiles and its legend carry them. */
const STATUSES = ["SUCCESS", "FAILED", "PENDING", "PLANNED"] as const;

/** A column whose number above 0 is a gap, and the one whose number above 0 is a failure. */
const GAP_COLUMNS = new Set(["PENDING", "PLANNED", "Not written", "Not built", "Not proved"]);
const FAIL_COLUMNS = new Set(["FAILED"]);

/** The counts of one table row, by column heading. `null` is a column that does not apply to the row. */
type Counts = Record<string, number | null>;

/** One measured row of a Findings table: what the output calls it, how a page row is known to be it, and its counts. */
type MeasuredRow = { label: string; matches: (name: string, second: string) => boolean; counts: Counts };

/** Everything a measurement gives the page, in the page's own terms. */
type Numbers = {
  digest: string;
  /** `undefined` where the report type carries no `measuredAt`; `null` where no run is stamped. */
  measuredAt: string | null | undefined;
  tiles: Array<{ label: string; count: number; of: number | null }>;
  states: Array<{ label: string; count: number }>;
  tables: Array<{ heading: string; rows: MeasuredRow[]; total: Counts }>;
};

// ---------------------------------------------------------------------------- reading the page

/** The text a reader sees in a piece of markup. */
const shown = (html: string): string => html.replace(/<[^>]+>/g, "")
  .replace(/&mdash;/g, "—").replace(/&middot;/g, "·").replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "’").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A count as a report writes it: `1,084`. */
const written = (count: number): string => count.toLocaleString("en-US");

/** The nearest folder at or above a file that declares itself a repository. */
function repositoryOf(file: string): string | null {
  let dir = dirname(resolve(file));
  for (;;) {
    try { if (statSync(join(dir, "sprepo.json")).isFile()) return dir; } catch { /* not this folder */ }
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** The page's `spn:doc` block: its text as written, where it sits, and its parsed value. */
function blockOf(page: string): { at: number; text: string; value: Record<string, unknown> } | null {
  const found = /<!--\s*spn:doc\s*([\s\S]*?)-->/.exec(page);
  if (found === null) return null;
  try { return { at: found.index, text: found[0], value: JSON.parse(found[1]) as Record<string, unknown> }; } catch { return null; }
}

/**
 * One section of the page, by its heading: where it starts and where it ends. A section's `id`
 * follows the page's order, and a page that leaves Records out numbers Measured differently, so the
 * heading is what names it.
 */
function sectionOf(page: string, heading: string): { from: number; to: number } | null {
  const titled = new RegExp(`<h2\\b[^>]*>\\s*${escaped(heading)}\\s*</h2>`).exec(page);
  if (titled === null) return null;
  const from = page.lastIndexOf("<section", titled.index);
  const end = page.indexOf("</section>", titled.index);
  return { from: from < 0 ? titled.index : from, to: end < 0 ? page.length : end };
}

// ---------------------------------------------------------------------------- the measurements

const sum = (values: number[]): number => values.reduce((all, one) => all + one, 0);

/** A tests report's numbers, from `behaviours coverage` and the join the coverage report counts projects by. */
function testsNumbers(root: string): Numbers {
  const result = measureTests(root) as Record<string, any>;
  type Tally = { written: number; built: number; status: Record<string, number> };
  const countsOf = (one: Tally): Counts =>
    ({ Written: one.written, Built: one.built, ...Object.fromEntries(STATUSES.map((status) => [status, one.status[status] ?? 0])) });
  const added = (all: Tally[]): Tally => ({
    written: sum(all.map((one) => one.written)), built: sum(all.map((one) => one.built)),
    status: Object.fromEntries(STATUSES.map((status) => [status, sum(all.map((one) => one.status[status] ?? 0))])),
  });
  const everything = added([...result.domains, result.wholeRepository]);

  // By tier: each tier the repository owes or names, and the rows whose Tier cell names none.
  const tiered = added(result.tiers);
  const tierRows: MeasuredRow[] = result.tiers.map((measured: any) => ({
    label: `${measured.tier[0]}${measured.tier.slice(1).toLowerCase()}`,
    matches: (name: string) => name.toUpperCase() === measured.tier,
    counts: { Runs: measured.runs.length, ...countsOf(measured) },
  }));
  const untiered: Tally = {
    written: everything.written - tiered.written, built: everything.built - tiered.built,
    status: Object.fromEntries(STATUSES.map((status) => [status, everything.status[status] - tiered.status[status]])),
  };
  if (untiered.written > 0) {
    tierRows.push({ label: "No test level", matches: (name: string) => /^no test level/i.test(name), counts: { Runs: 0, ...countsOf(untiered) } });
  }
  const runs = new Set<string>(result.tiers.flatMap((tier: any) => tier.runs.map((run: any) => run.run)));

  // Apps and Packages: a project counts the rows of the constructs it has a chapter for.
  const levels = levelRows(root, result.rows as Array<{ file: string; status: string | null }>).map((level) => ({
    path: level.path,
    row: {
      label: level.name,
      matches: (name: string) => name === level.name,
      counts: {
        Written: level.rows.length, Built: level.built.length,
        ...Object.fromEntries(STATUSES.map((status) => [status, level.rows.filter((row) => row.status === status).length])),
      } as Counts,
    },
  }));
  const levelTable = (heading: string, folder: string) => {
    const rows = levels.filter((level) => level.path.startsWith(`${folder}/`)).map((level) => level.row);
    return { heading: heading, rows: rows, total: totalOf(rows) };
  };

  return {
    digest: result.digest,
    measuredAt: result.measuredAt,
    tiles: STATUSES.map((status) => ({ label: status, count: everything.status[status], of: everything.written })),
    states: STATUSES.map((status) => ({ label: status, count: everything.status[status] })),
    tables: [
      { heading: "By tier", rows: tierRows, total: { Runs: runs.size, ...countsOf(everything) } },
      { heading: "Repository", rows: repositoryRows(result, countsOf), total: countsOf(everything) },
      levelTable("Apps", "apps"),
      levelTable("Packages", "packages"),
    ],
  };
}

/** A coverage report's numbers, from `coverage measure`. */
function coverageNumbers(root: string): Numbers {
  const result = measureCoverage(root) as Record<string, any>;
  type Side = { written: { rows: number }; built: { rows: number }; proved: { rows: number } };
  const sides = (one: Side): Counts => ({
    Written: one.written.rows, Built: one.built.rows, Proved: one.proved.rows,
    "Not built": one.written.rows - one.built.rows, "Not proved": one.written.rows - one.proved.rows,
  });
  const all = result.repositoryLevel;
  const levelRow = (level: any): MeasuredRow =>
    ({ label: level.name, matches: (name: string) => name === level.name, counts: { ...sides(level), "Not written": level.builtNotStated.count } });
  const levelTable = (heading: string, levels: any[]) => {
    const rows = levels.map(levelRow);
    return { heading: heading, rows: rows, total: totalOf(rows) };
  };
  return {
    digest: result.digest,
    measuredAt: undefined,
    tiles: [
      { label: "Written", count: all.written.rows, of: null },
      { label: "Built", count: all.built.rows, of: all.written.rows },
      { label: "Proved", count: all.proved.rows, of: all.written.rows },
      { label: "Not written", count: all.builtNotStated.count, of: null },
    ],
    states: [{ label: "Proved", count: all.proved.rows }, { label: "Not proved", count: all.written.rows - all.proved.rows }],
    tables: [
      // Not written counts seats in `src/`, which a domain does not have, so its cell is a dash on the page.
      { heading: "Repository", rows: repositoryRows(result, (one: Side) => ({ ...sides(one), "Not written": null })),
        total: { ...sides(all), "Not written": all.builtNotStated.count } },
      levelTable("Apps", result.apps),
      levelTable("Packages", result.packages),
    ],
  };
}

/** The Repository table's rows: one for each domain, found by its folder or its name, then the whole-repository row. */
function repositoryRows(result: Record<string, any>, countsOf: (one: any) => Counts): MeasuredRow[] {
  return [
    ...result.domains.map((domain: any) => ({
      label: domain.domain,
      matches: (name: string, second: string) => second.replace(/\/$/, "") === domain.domain || name === domain.name,
      counts: countsOf(domain),
    })),
    {
      label: "the behaviours about the whole repository",
      matches: (name: string, second: string) => /README\.md$/.test(second) || /^behaviours about the whole repository/i.test(name),
      counts: countsOf(result.wholeRepository),
    },
  ];
}

/** A table's total row: each column summed over its rows, a column no row counts left out. */
function totalOf(rows: MeasuredRow[]): Counts {
  const total: Counts = {};
  for (const row of rows) {
    for (const [column, count] of Object.entries(row.counts)) {
      if (count !== null) total[column] = (total[column] ?? 0) + count;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------- writing the page

/** What one pass over the page wrote, and what it could not place. */
type Written = { page: string; placed: number; unplaced: string[] };

/** A share as a tile writes it: whole, never `100%` short of the whole and never `0%` above nothing. */
const shareOf = (count: number, of: number): string => {
  if (of === 0 || count === 0) return "0%";
  if (count === of) return "100%";
  const share = (count / of) * 100;
  return share < 1 ? "&lt;1%" : `${Math.min(99, Math.round(share))}%`;
};

/** A share as a bar's width: one decimal, so a small share still draws. */
const widthOf = (count: number, of: number): string =>
  of === 0 || count === 0 ? "0%" : count === of ? "100%" : `${((count / of) * 100).toFixed(1)}%`;

/** The tiles: each `div.side`, found by its label, from its opening to the next tile or the end of the row of tiles. */
function writeTiles(page: string, tiles: Numbers["tiles"]): Written {
  const unplaced: string[] = [];
  const seen = new Set<string>();
  let placed = 0;
  const out = page.replace(/<div class="side"><span class="lbl">([^<]*)<\/span>[\s\S]*?(?=\s*<div class="side">|\s*<\/div>\s*<div class="breakdown">|\s*<\/div>\s*<h3|\s*<\/div>\s*<\/section>)/g, (tile, label: string) => {
    const measured = tiles.find((one) => one.label === shown(label));
    if (measured === undefined) { unplaced.push(`the tile \`${shown(label)}\` is on the page, and the measurement returns no such count`); return tile; }
    seen.add(measured.label);
    placed += 1;
    const { count, of } = measured;
    let next = tile.replace(/(<span class="big">)[^<]*(<span class="tot">)[^<]*(<\/span>)/, (_all, open: string, tot: string, close: string) =>
      `${open}${written(count)}${tot} / ${of === null ? "" : written(of)}${close}`);
    if (next === tile) next = tile.replace(/(<span class="big">)[^<]*(<\/span>)/, `$1${written(count)}$2`);
    if (of === null) return next;
    next = next.replace(/(<span class="pct">)[^<]*(<\/span>)/, `$1${shareOf(count, of)}$2`);
    // A bar is green only for a measure that is done. A tile that counts a gap or a failure keeps its colour.
    return next.replace(/<i(?: class="([^"]*)")? style="width:[^"]*">/, (_all, marks: string | undefined) => {
      const kept = (marks ?? "").split(/\s+/).filter((mark) => mark !== "" && mark !== "ok");
      if (!kept.includes("gap") && !kept.includes("fail") && count === of && of > 0) kept.push("ok");
      return `<i${kept.length ? ` class="${kept.join(" ")}"` : ""} style="width:${widthOf(count, of)}">`;
    });
  });
  for (const tile of tiles) if (!seen.has(tile.label)) unplaced.push(`the page has no tile \`${tile.label}\` — ${written(tile.count)}${tile.of === null ? "" : ` of ${written(tile.of)}`}`);
  return { page: out, placed: placed, unplaced: unplaced };
}

/** The breakdown: each legend entry's count, then the bar rebuilt from the legend, one segment for each state above 0. */
function writeBreakdown(page: string, states: Numbers["states"]): Written {
  const unplaced: string[] = [];
  const from = page.indexOf('<div class="breakdown">');
  if (from < 0) return { page: page, placed: 0, unplaced: ["the page has no breakdown bar"] };
  const end = page.indexOf("</ul>", from);
  if (end < 0) return { page: page, placed: 0, unplaced: ["the breakdown has no legend, so its bar cannot be rebuilt"] };
  let region = page.slice(from, end);

  const keys = new Map<string, string>();
  const seen = new Set<string>();
  region = region.replace(/(<li><i class="bd-key ([^"]*)"><\/i>)([^<]*?)(\s*<b>)[^<]*(<\/b>)/g, (entry, open: string, key: string, label: string, bold: string, close: string) => {
    const measured = states.find((one) => one.label === shown(label));
    if (measured === undefined) { unplaced.push(`the legend entry \`${shown(label)}\` is on the page, and the measurement returns no such state`); return entry; }
    seen.add(measured.label);
    keys.set(measured.label, key);
    return `${open}${label}${bold}${written(measured.count)}${close}`;
  });
  for (const state of states) if (!seen.has(state.label)) unplaced.push(`the legend has no entry \`${state.label}\` — ${written(state.count)}`);

  region = region.replace(/(<div class="bd-bar"[^>]*>)([\s\S]*?)(\n?[ \t]*<\/div>)/, (_all, open: string, inner: string, close: string) => {
    const indent = /\n([ \t]*)<span/.exec(inner)?.[1] ?? `${/\n([ \t]*)<\/div>/.exec(close)?.[1] ?? "    "}  `;
    const segments = states.filter((state) => state.count > 0 && keys.has(state.label)).map((state) =>
      `\n${indent}<span class="bd-seg ${keys.get(state.label)}" style="flex-grow:${state.count}" ` +
      `title="${state.label}: ${written(state.count)} behaviour${state.count === 1 ? "" : "s"}"></span>`);
    const label = states.map((state) => `${state.label} ${written(state.count)}`).join(", ");
    return `${open.replace(/aria-label="[^"]*"/, `aria-label="${label}"`)}${segments.join("")}${close.startsWith("\n") ? close : `\n${close}`}`;
  });
  return { page: page.slice(0, from) + region + page.slice(end), placed: seen.size, unplaced: unplaced };
}

/** The class a count cell carries: a gap or a failure above 0 is marked, and `done` stays only on a count that is the whole. */
function cellClass(column: string, count: number, whole: number | null | undefined, marks: string): string {
  const kept = marks.split(/\s+/).filter((mark) => mark !== "" && mark !== "gap" && mark !== "fail");
  if (FAIL_COLUMNS.has(column) && count > 0) kept.push("fail");
  else if (GAP_COLUMNS.has(column) && count > 0) kept.push("gap");
  const done = kept.includes("done") && typeof whole === "number" && whole > 0 && count === whole;
  return [...kept.filter((mark) => mark !== "done"), ...(done ? ["done"] : [])].join(" ");
}

/** One row with its count cells rewritten. A cell that holds a dash, and a column the counts do not name, stay as they are. */
function writeRow(row: string, columns: string[], counts: Counts): { row: string; cells: number } {
  let at = 0;
  let cells = 0;
  const next = row.replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/g, (cell, attributes: string, inner: string) => {
    const column = columns[at];
    at += 1;
    const count = column === undefined ? undefined : counts[column];
    if (at === 1 || count === undefined || count === null || /^(?:—|–|-|&mdash;)$/.test(inner.trim())) return cell;
    cells += 1;
    const marks = /\bclass="([^"]*)"/.exec(attributes)?.[1] ?? "num-cell";
    return `<td class="${cellClass(column, count, counts.Written, marks)}">${written(count)}</td>`;
  });
  return { row: next, cells: cells };
}

/** One Findings table, found by its heading: each row the measurement returns is written, and each row on one side alone is named. */
function writeTable(page: string, table: Numbers["tables"][number]): Written {
  // A table the page leaves out is missing only where the measurement has a row for it: a
  // repository with no package carries a sentence under Packages, and no table.
  const absent: Written = { page: page, placed: 0, unplaced: table.rows.length === 0 ? [] : [`the page has no \`${table.heading}\` table`] };
  const heading = new RegExp(`<h3\\b[^>]*>\\s*${escaped(table.heading)}\\s*</h3>`).exec(page);
  if (heading === null) return absent;
  const after = heading.index + heading[0].length;
  const rest = page.slice(after);
  const stop = rest.search(/<h3\b|<\/section>/);
  const region = stop < 0 ? rest : rest.slice(0, stop);
  const found = /<table\b[\s\S]*?<\/table>/.exec(region);
  if (found === null) return absent;

  const columns = [...found[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((cell) => shown(cell[1]));
  const unplaced: string[] = [];
  const seen = new Set<MeasuredRow>();
  let placed = 0;
  const next = found[0].replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g, (row, attributes: string, inner: string) => {
    if (/<th\b/.test(inner)) return row;
    if (/\bclass="[^"]*\btotal\b/.test(attributes)) {
      const total = writeRow(row, columns, table.total);
      placed += total.cells;
      return total.row;
    }
    const first = /<td\b[^>]*>([\s\S]*?)<\/td>/.exec(inner)?.[1] ?? "";
    const name = shown(/<strong>([\s\S]*?)<\/strong>/.exec(first)?.[1] ?? first.replace(/<span class="sl">[\s\S]*?<\/span>/, ""));
    const second = shown(/<span class="sl">([\s\S]*?)<\/span>/.exec(first)?.[1] ?? "");
    const measured = table.rows.find((one) => !seen.has(one) && one.matches(name, second));
    if (measured === undefined) {
      unplaced.push(`${table.heading}: the row \`${name}\` is on the page, and the measurement returns no such row`);
      return row;
    }
    seen.add(measured);
    const wrote = writeRow(row, columns, measured.counts);
    placed += wrote.cells;
    return wrote.row;
  });
  for (const row of table.rows) {
    if (seen.has(row)) continue;
    const counts = Object.entries(row.counts).filter(([, count]) => count !== null).map(([column, count]) => `${column} ${written(count as number)}`).join(" · ");
    unplaced.push(`${table.heading}: the page has no row for ${/\s/.test(row.label) ? row.label : `\`${row.label}\``} — ${counts}`);
  }
  const start = after + (found.index ?? 0);
  return { page: page.slice(0, start) + next + page.slice(start + found[0].length), placed: placed, unplaced: unplaced };
}

/** The block's two moments, written into the block's own text so its layout stays as the author wrote it. */
function writeBlock(page: string, block: { at: number; text: string }, generatedAt: string, measuredAt: string | null | undefined): string | null {
  let text = block.text.replace(/("generatedAt"\s*:\s*)"[^"]*"/, `$1"${generatedAt}"`);
  if (measuredAt !== undefined) {
    const has = /"measuredAt"\s*:/.test(text);
    if (measuredAt === null) {
      // One comma goes with the key, on whichever side it has one.
      if (has) text = /,\s*"measuredAt"\s*:\s*(?:"[^"]*"|null)/.test(text)
        ? text.replace(/,\s*"measuredAt"\s*:\s*(?:"[^"]*"|null)/, "")
        : text.replace(/"measuredAt"\s*:\s*(?:"[^"]*"|null)\s*,\s*/, "");
    } else if (has) {
      text = text.replace(/("measuredAt"\s*:\s*)(?:"[^"]*"|null)/, `$1"${measuredAt}"`);
    } else {
      text = text.replace(/("generatedAt"\s*:\s*"[^"]*")(,\s*)?/, (_all, generated: string, comma: string | undefined) =>
        `${generated}${comma ?? ", "}"measuredAt": "${measuredAt}"${comma === undefined ? "" : comma}`);
    }
  }
  const wrote = blockOf(text);
  if (wrote === null || wrote.value.generatedAt !== generatedAt) return null;
  if (measuredAt !== undefined && (measuredAt === null ? "measuredAt" in wrote.value : wrote.value.measuredAt !== measuredAt)) return null;
  return page.slice(0, block.at) + text + page.slice(block.at + block.text.length);
}

// ---------------------------------------------------------------------------- the command

/** Prints why a page is not refreshed, and answers the exit code for a refusal. */
const refused = (reason: string): number => { console.error(reason); return 1; };

/** `spn-devex report refresh <page>`. */
export function run(args: string[]): number {
  const named = args.find((arg) => !arg.startsWith("--"));
  if (named === undefined) { console.error("usage: spn-devex report refresh <page>"); return 2; }
  const path = resolve(named);
  let page: string;
  try { page = readFileSync(path, "utf8"); } catch { return refused(`${named}: no such page`); }

  const block = blockOf(page);
  if (block === null || block.value.variant !== "report")
    return refused(`${named}: not a report page — its \`spn:doc\` block must declare the variant \`report\``);
  const type = String(block.value.reportType ?? "");
  if (READ_BY_HAND.includes(type)) {
    const name = type.toLowerCase();
    return refused(`${named}: ${name === "audit" ? "an" : "a"} \`${name}\` report is not refreshed by a command. It is measured by several commands and a reading, ` +
      `so the \`report\` skill writes it again. This command refreshes a \`coverage\` report and a \`tests\` report.`);
  }
  if (!REFRESHED.includes(type))
    return refused(`${named}: the block's \`reportType\` reads \`${type}\`, and this command refreshes ${REFRESHED.map((one) => `\`${one}\``).join(" and ")}`);

  const root = repositoryOf(path);
  if (root === null) return refused(`${named}: no \`sprepo.json\` at or above the page, so there is no repository to measure`);
  if (typeof block.value.repository === "string" && block.value.repository !== basename(root))
    return refused(`${named}: the block names the repository \`${block.value.repository}\`, and the page sits in \`${basename(root)}\``);
  const absence = (type === "TESTS" ? testsAbsence(root) : coverageAbsence(root)) as { absence?: string } | null;
  if (absence !== null) return refused(`${named}: ${absence.absence}`);

  const measured = sectionOf(page, "Measured");
  const old = measured === null ? null : /sha256:[0-9a-f]{16}/.exec(page.slice(measured.from, measured.to))?.[0] ?? null;
  if (old === null)
    return refused(`${named}: the Measured section names no digest, so the new digest has nowhere to go. Write the page's Measure again line from the \`report\` skill first.`);

  const numbers = type === "TESTS" ? testsNumbers(root) : coverageNumbers(root);
  const where = relative(process.cwd(), path) || named;
  if (old === numbers.digest) {
    console.log(`current  ${where} — its digest ${numbers.digest} is the measurement's, so nothing is written`);
    return 0;
  }

  // The numbers, one kind of place at a time, each pass reading the page the pass before it wrote.
  const unplaced: string[] = [];
  const tiles = writeTiles(page, numbers.tiles);
  const breakdown = writeBreakdown(tiles.page, numbers.states);
  unplaced.push(...tiles.unplaced, ...breakdown.unplaced);
  let next = breakdown.page;
  let cells = 0;
  let tables = 0;
  for (const table of numbers.tables) {
    const wrote = writeTable(next, table);
    next = wrote.page;
    cells += wrote.placed;
    if (wrote.placed > 0) tables += 1;
    unplaced.push(...wrote.unplaced);
  }

  // The digest, wherever the page names the one it was written at.
  next = next.split(old).join(numbers.digest);

  // The moments. Generated is the moment of this measurement; `measuredAt` is the newest run the rows cite.
  const generatedAt = withOffset(new Date());
  const before = blockOf(next)!;
  const oldMeasuredAt = typeof block.value.measuredAt === "string" ? block.value.measuredAt : null;
  const stamped = writeBlock(next, before, generatedAt, numbers.measuredAt);
  if (stamped === null) return refused(`${named}: the block's \`generatedAt\` could not be written, so the page is left as it was`);
  next = stamped;
  const header = /<header\b[\s\S]*?<\/header>/.exec(next);
  if (header === null || !/<time\b[^>]*\bdatetime="[^"]*"[^>]*>[^<]*<\/time>/.test(header[0])) {
    unplaced.push(`the header has no Generated \`<time>\` — its moment is ${generatedAt}`);
  } else {
    const dated = header[0].replace(/(<time\b[^>]*\bdatetime=")[^"]*("[^>]*>)[^<]*(<\/time>)/, `$1${generatedAt}$2${generatedAt}$3`);
    next = next.slice(0, header.index) + dated + next.slice(header.index + header[0].length);
  }
  if (numbers.measuredAt !== undefined && oldMeasuredAt !== null && oldMeasuredAt !== block.value.generatedAt) {
    const body = blockOf(next)!;
    const tail = next.slice(body.at + body.text.length);
    if (numbers.measuredAt === null) {
      if (tail.includes(oldMeasuredAt)) unplaced.push(`Measured still names ${oldMeasuredAt}, and no run is stamped now — say so there`);
    } else {
      next = next.slice(0, body.at + body.text.length) + tail.split(oldMeasuredAt).join(numbers.measuredAt);
    }
  } else if (numbers.measuredAt === null) {
    unplaced.push("no run is stamped, so the block carries no `measuredAt` — Measured says so in its Scope sentence");
  }

  writeFileSync(path, next, "utf8");
  console.log(`wrote    ${where} — the ${type.toLowerCase()} report of ${basename(root)}, measured again`);
  console.log(`  ${tiles.placed} tile(s) · ${breakdown.placed} state(s) in the breakdown · ${cells} cell(s) in ${tables} table(s) · digest ${numbers.digest}`);
  console.log(`  generatedAt ${generatedAt}` + (numbers.measuredAt === undefined ? "" : ` · measuredAt ${numbers.measuredAt ?? "left out: no run is stamped"}`));
  for (const line of unplaced) console.log(`  ! ${line}`);
  console.log("  left to the agent: the verdict, the terms line, the breakdown's title, Top gaps, Records and Recommendations, " +
    "each read against the new numbers; and Commit in the header.");
  return 0;
}

// The exit code is set and the process is left to end by itself, so everything printed is written first.
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exitCode = run(process.argv.slice(2));
