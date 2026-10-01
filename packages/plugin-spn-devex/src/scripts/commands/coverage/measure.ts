#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The coverage report — written, built and proved
//           docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § What a Where row declares
//           docs/04-capabilities/02-support/01-apps/10-providers/ts/03-structure.md § What a Where Row May Name
//           docs/registers/decisions.md RD.DEVEX.WORKSPACE.191
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// The coverage report's measurement: how much of a repository is written, built and proved, and
// the gaps between the three, per package, per app and for the repository.
//
//     spn-devex coverage measure <repo> [--json]
//
// It never writes the page (RD.DEVEX.WORKSPACE.149); the units, the gaps and what a Where row
// declares are in the capability chapter "Scripts in spn-devex", § The coverage measurement reads
// the Where tables against a seat table.


import { createHash } from "node:crypto";
import { basename, dirname, join, relative, resolve } from "node:path";
import { withOffset } from "../../lib/clock.ts";
import { DOCS, reportsDir, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { read } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import { measure as measureTests, nodesOf, TESTS_REPORT } from "../behaviours/coverage.ts";
import {
  NEVER_READ, builtAmong, constructKeyOf, domainName, domainOf, domainOfKey, domainsOf, entriesOf, isDir, kindOf,
  readChapters, whereRoot, whyNotBuilt, type Chapter, type Seat, type StatedNotBuilt,
} from "./_join.ts";

/** Where the coverage report lands in a repository's pocket, named by its kind (RD.DEVEX.WORKSPACE.149). */
export const COVERAGE_REPORT = join(reportsDir(DOCS), "coverage-report.html");

const digestOf = (value: unknown): string =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)}`;

// ---------------------------------------------------------------------------- proved seats

/** Every test file under a node's `tests/`, run output aside. */
function testFiles(node: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of entriesOf(dir)) {
      if (NEVER_READ.has(entry) || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      if (isDir(full)) walk(full);
      else if (/\.(ts|tsx|mts|js|mjs|jsx)$/.test(entry)) out.push(full);
    }
  };
  walk(join(node, "tests"));
  return out;
}

const withoutExtension = (path: string): string => path.replace(/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|css|scss|sql)$/, "");
const withoutCaseSuffix = (path: string): string =>
  withoutExtension(path).replace(/\.(spec|test|ct\.spec|int\.spec|int\.test|contract\.spec)$/, "").replace(/\.(ct|int|contract)$/, "");

/** The paths a test tree may mirror a seat at: without `src/`, without an app's `modules/`, without `entry/ui/`. */
function mirrorKeys(seat: Seat): string[] {
  const path = seat.folder ? seat.path : withoutExtension(seat.path);
  const keys = new Set<string>();
  const bare = path.replace(/^src\//, "");
  keys.add(bare);
  keys.add(bare.replace(/^modules\//, ""));
  for (const key of [...keys]) keys.add(key.replace(/(^|\/)entry\/ui\//, "$1"));
  return [...keys].filter((key) => key !== "");
}

/**
 * Whether a test in the node proves a seat: a case file sits at the seat's own path beneath a tier
 * folder, or a test file imports into the seat by a relative path.
 */
function provedSeat(node: string, seat: Seat, tests: Array<{ file: string; mirror: string; imports: string[] }>): boolean {
  const keys = mirrorKeys(seat);
  return tests.some((test) => {
    const mirrored = seat.folder
      ? keys.some((key) => test.mirror.startsWith(`${key}/`))
      : keys.includes(withoutCaseSuffix(test.mirror));
    if (mirrored) return true;
    return test.imports.some((target) => seat.folder
      ? target === seat.path || target.startsWith(`${seat.path}/`)
      : withoutExtension(target) === withoutExtension(seat.path) || `${target}/index` === withoutExtension(seat.path));
  });
}

/** Each test file, with its path beneath its tier folder and the node-relative targets of its relative imports. */
function readTests(node: string): Array<{ file: string; mirror: string; imports: string[] }> {
  return testFiles(node).map((file) => {
    const inTests = slashes(relative(join(node, "tests"), file));
    const text = read(file) ?? "";
    const imports = [...text.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)]
      .map((match) => slashes(relative(node, resolve(dirname(file), match[1]))));
    return { file, mirror: inTests.split("/").slice(1).join("/"), imports };
  });
}


// ---------------------------------------------------------------------------- the measurement

type Level = {
  name: string;
  path: string;
  kind: string | null;
  whereRoot: string;
  chapters: string[];
  written: { rows: number; constructs: number };
  built: { rows: number; constructs: number };
  proved: { rows: number };
  statedNotBuilt: { count: number; items: StatedNotBuilt[] };
  builtNotStated: { count: number; proved: number; seats: Array<{ seat: string; proved: boolean }> };
  builtNotProved: { count: number; ids: string[] };
  declaresNothing: Array<{ chapter: string; path: string }>;
  manual: Array<{ id: string; file: string }>;
};

/** One row of the Repository table: a domain, or the behaviours about the whole repository. */
type Rows = { written: { rows: number }; built: { rows: number }; proved: { rows: number }; notBuilt: { rows: number }; notProved: { rows: number };
              manual: Array<{ id: string; file: string }> };

/** What one package or app owns: its chapters that name a construct, those constructs, and the ones among them that are built. */
export function ownedBy(node: string, chapters: Chapter[]): { constructChapters: Chapter[]; owned: string[]; built: string[] } {
  const constructChapters = chapters.filter((chapter) => chapter.node === node && chapter.construct !== null);
  const owned = [...new Set(constructChapters.map((chapter) => chapter.construct!))].sort();
  return { constructChapters, owned, built: builtAmong(constructChapters, owned) };
}

/** The projects a repository's reports count: each folder under `apps/` and `packages/` that declares a kind. */
const levelsOf = (root: string): string[] =>
  nodesOf(root).filter((node) => /^(apps|packages)\/[^/]+$/.test(slashes(relative(root, node))));

/**
 * The behaviour rows each package and app counts, and the ones among them under a built construct.
 *
 * A project counts the rows of the constructs it has a capability chapter for, which is the join the
 * coverage report's Apps and Packages tables use. The tests report's tables count the same rows by
 * status, so both read this one join. `rows` is the tests measurement's rows; a `MANUAL` row counts
 * in none of the numbers and is left out.
 */
export function levelRows<Row extends { file: string; status: string | null }>(
  root: string, rows: Row[],
): Array<{ name: string; path: string; rows: Row[]; built: Row[] }> {
  const rowsOf = new Map<string, Row[]>();
  for (const row of rows) {
    const key = constructKeyOf(row.file);
    if (key !== null && row.status !== "MANUAL") rowsOf.set(key, [...(rowsOf.get(key) ?? []), row]);
  }
  const keys = new Set(rows.map((row) => constructKeyOf(row.file)).filter((key): key is string => key !== null));
  const levels = levelsOf(root);
  const { chapters } = readChapters(root, keys, levels);
  return levels.map((node) => {
    const { owned, built } = ownedBy(node, chapters);
    return {
      name: basename(node), path: slashes(relative(root, node)),
      rows: owned.flatMap((construct) => rowsOf.get(construct) ?? []),
      built: built.flatMap((construct) => rowsOf.get(construct) ?? []),
    };
  });
}

/** A repository whose type is FOUNDATION: its rows are promises, so there is nothing built or proved to count. */
export function foundationAbsence(root: string): Record<string, unknown> | null {
  const text = read(join(root, "sprepo.json"));
  if (text === null) return null;
  let type: string | undefined;
  try { type = (JSON.parse(text) as { type?: string }).type; } catch { return null; }
  if (type !== "FOUNDATION") return null;
  const name = basename(root);
  return {
    repository: name, measuredAt: null,
    absence: `${name} declares FOUNDATION: its behaviour rows are promises and it holds no packages or apps, so ` +
      `nothing is built or proved here and no coverage report is owed.`,
    repositoryLevel: null, packages: [], apps: [], domains: [], wholeRepository: null, findings: [], digest: null, report: null,
  };
}

/** The measurement for one repository. */
export function measure(root: string): Record<string, unknown> {
  const nameOf = (node: string): string => slashes(relative(root, node)) || ".";

  // Proved: the rows the stamp wrote SUCCESS, read as the tests report reads them; no run file is opened.
  const tests = measureTests(root) as {
    rows: Array<{ id: string; file: string; status: string | null }>; digest: string; measuredAt: string | null;
    findings: Array<{ project: string; ftype: string; message: string }>;
  };
  const isProved = (row: { status: string | null }): boolean => row.status === "SUCCESS";

  // A MANUAL row counts in none of the numbers (05-artifacts.md § The coverage report): a person proves
  // it by the repository's browser guide and no run records it, so counted it would read as Not proved.
  // Each level lists its own as `manual` instead.
  const counted = tests.rows.filter((row) => row.status !== "MANUAL");
  const manualOf = (rows: typeof tests.rows) => rows.filter((row) => row.status === "MANUAL").map((row) => ({ id: row.id, file: row.file }));
  const manualRowsOf = new Map<string, typeof tests.rows>();

  // Written: the rows at each construct's own path.
  const rowsOf = new Map<string, typeof tests.rows>();
  for (const row of tests.rows) {
    const key = constructKeyOf(row.file);
    if (key === null) continue;
    if (row.status === "MANUAL") manualRowsOf.set(key, [...(manualRowsOf.get(key) ?? []), row]);
    else rowsOf.set(key, [...(rowsOf.get(key) ?? []), row]);
  }

  // The levels: each project under `apps/` and `packages/` that declares a kind.
  const levels = levelsOf(root);
  const { constructs, chapters, seatsByNode, stated, declaresNothing, findings: chapterFindings, built: repoBuilt } =
    readChapters(root, new Set([...rowsOf.keys(), ...manualRowsOf.keys()]), levels);
  // An id that more than one row declares is counted once, from its first row, so the tests
  // measurement's finding is listed here too, with each file that declares the id.
  const findings = [
    ...chapterFindings,
    ...tests.findings.filter((one) => one.ftype === "DUPLICATE_ID").map((one) => ({ file: one.project, message: one.message })),
  ];

  const levelOf = (node: string): Level => {
    const kind = kindOf(node);
    const own = chapters.filter((chapter) => chapter.node === node);
    const { constructChapters, owned, built } = ownedBy(node, chapters);
    const rows = owned.flatMap((construct) => rowsOf.get(construct) ?? []);
    const builtRows = built.flatMap((construct) => rowsOf.get(construct) ?? []);
    const testsHere = readTests(node);
    const unstated = (seatsByNode.get(node) ?? []).filter((seat) => !stated.get(node)!.has(seat.path))
      .map((seat) => ({ seat: seat.path, proved: provedSeat(node, seat, testsHere) }));
    const items = constructChapters.flatMap(whyNotBuilt);
    return {
      name: basename(node), path: nameOf(node), kind, whereRoot: whereRoot(kind) === "" ? "." : whereRoot(kind),
      chapters: own.map((chapter) => chapter.file),
      written: { rows: rows.length, constructs: owned.length },
      built: { rows: builtRows.length, constructs: built.length },
      proved: { rows: rows.filter(isProved).length },
      statedNotBuilt: { count: owned.length - built.length, items },
      builtNotStated: { count: unstated.length, proved: unstated.filter((one) => one.proved).length, seats: unstated },
      builtNotProved: { count: builtRows.filter((row) => !isProved(row)).length, ids: builtRows.filter((row) => !isProved(row)).map((row) => row.id) },
      declaresNothing: declaresNothing.get(node)!,
      manual: manualOf(owned.flatMap((construct) => manualRowsOf.get(construct) ?? [])),
    };
  };

  const all = levels.map(levelOf);
  const packages = all.filter((level) => level.path.startsWith("packages/"));
  const apps = all.filter((level) => level.path.startsWith("apps/"));

  // The repository: each construct once, built where it has a chapter and every chapter of it is built.
  const constructChapters = chapters.filter((chapter) => chapter.construct !== null);
  const chaptered = [...new Set(constructChapters.map((chapter) => chapter.construct!))];
  // Written at the repository: a construct holding rows, or one some package or app has a chapter for.
  const written = [...constructs].filter((construct) => (rowsOf.get(construct) ?? []).length > 0 || chaptered.includes(construct)).sort();
  const repoItems: StatedNotBuilt[] = written
    .filter((construct) => !repoBuilt.includes(construct))
    .flatMap((construct) => chaptered.includes(construct)
      ? constructChapters.filter((chapter) => chapter.construct === construct).flatMap(whyNotBuilt)
      : [{ construct, chapter: null, reason: "the construct has rows and no capability chapter in any package or app" }]);
  const builtRows = repoBuilt.flatMap((construct) => rowsOf.get(construct) ?? []);
  const repositoryLevel = {
    written: { rows: counted.length, constructs: written.length },
    built: { rows: builtRows.length, constructs: repoBuilt.length },
    proved: { rows: counted.filter(isProved).length },
    statedNotBuilt: { count: written.length - repoBuilt.length, items: repoItems },
    builtNotStated: { count: all.reduce((sum, level) => sum + level.builtNotStated.count, 0), proved: all.reduce((sum, level) => sum + level.builtNotStated.proved, 0) },
    builtNotProved: { count: builtRows.filter((row) => !isProved(row)).length },
    repositoryRows: counted.filter((row) => constructKeyOf(row.file) === null).length,
    manual: manualOf(tests.rows),
  };

  // The Repository table: one row per domain, then the behaviours about the whole repository, which
  // belong to no design topic and so are never built. Not built and Not proved are Written less each.
  const isBuilt = (row: { file: string }): boolean => { const key = constructKeyOf(row.file); return key !== null && repoBuilt.includes(key); };
  const rowsIn = (all: typeof tests.rows): Rows => {
    const rows = all.filter((row) => row.status !== "MANUAL");
    const builtHere = rows.filter(isBuilt).length;
    const provedHere = rows.filter(isProved).length;
    return {
      written: { rows: rows.length }, built: { rows: builtHere }, proved: { rows: provedHere },
      notBuilt: { rows: rows.length - builtHere }, notProved: { rows: rows.length - provedHere },
      manual: manualOf(all),
    };
  };
  const domains = domainsOf(root, tests.rows.map((row) => domainOf(row.file)).filter((one): one is string => one !== null)).map((domain) => {
    const here = rowsIn(tests.rows.filter((row) => domainOf(row.file) === domain));
    const topics = written.filter((construct) => domainOfKey(construct) === domain);
    return {
      domain, name: domainName(root, domain), ...here,
      written: { ...here.written, constructs: topics.length },
      built: { ...here.built, constructs: topics.filter((construct) => repoBuilt.includes(construct)).length },
    };
  });
  const aboutTheRepository = tests.rows.filter((row) => domainOf(row.file) === null);
  const wholeRepository = { files: [...new Set(aboutTheRepository.map((row) => row.file))].sort(), ...rowsIn(aboutTheRepository) };

  const measured = {
    repository: basename(root),
    absence: null,
    units: {
      written: "behaviour rows · constructs", built: "behaviour rows · constructs", proved: "behaviour rows",
      statedNotBuilt: "constructs", builtNotStated: "seats in src/", builtNotProved: "behaviour rows",
    },
    repositoryLevel,
    packages,
    apps,
    domains,
    wholeRepository,
    findings,
    testsReport: { path: TESTS_REPORT, measuredAt: tests.measuredAt, digest: tests.digest },
  };
  const digest = digestOf(measured);
  const page = read(join(root, COVERAGE_REPORT));
  return {
    ...measured,
    measuredAt: withOffset(new Date()),
    digest,
    report: { path: COVERAGE_REPORT, exists: page !== null, current: page !== null && page.includes(digest) },
  };
}

// ---------------------------------------------------------------------------- the reading

/** The measurement as a person reads it in a terminal: the per-level table, the domains and the totals. */
export function describeResult(result: Record<string, any>): string[] {
  if (result.absence !== null) return [`${result.repository} — no measurement. ${result.absence}`];
  const head = ["Level", "Kind", "Written rows", "constructs", "Built rows", "constructs", "Proved", "Stated, not built", "Built, not stated", "(proved)", "Built, not proved"];
  const rowOf = (name: string, kind: string, level: any): string[] => [
    name, kind, String(level.written.rows), String(level.written.constructs), String(level.built.rows), String(level.built.constructs), String(level.proved.rows),
    String(level.statedNotBuilt.count), String(level.builtNotStated.count), String(level.builtNotStated.proved), String(level.builtNotProved.count),
  ];
  const table = [head, ...[...result.packages, ...result.apps].map((level: any) => rowOf(level.path, level.kind ?? "—", level)),
    rowOf(result.repository, "repository", result.repositoryLevel)];
  const widths = head.map((_, column) => Math.max(...table.map((row) => row[column].length)));
  const lines = [
    `${result.repository} — written, built and proved, measured ${result.measuredAt}`,
    `  units: written in ${result.units.written} · built in ${result.units.built} · proved in ${result.units.proved} · ` +
    `not written in ${result.units.builtNotStated} · not built in ${result.units.statedNotBuilt} · not proved in ${result.units.builtNotProved}`,
    ...table.map((row) => `  ${row.map((cell, column) => column < 2 ? cell.padEnd(widths[column]) : cell.padStart(widths[column])).join("  ")}`),
  ];
  const rowsLine = (label: string, one: any): string =>
    `  ${label}: ${one.written.rows} written · ${one.built.rows} built · ${one.proved.rows} proved · ${one.notBuilt.rows} not built · ${one.notProved.rows} not proved`;
  for (const domain of result.domains) lines.push(rowsLine(`domain ${domain.domain} (${domain.name})`, domain));
  lines.push(rowsLine("the whole repository", result.wholeRepository));
  const total = result.repositoryLevel;
  lines.push(`  totals: ${total.written.rows} rows in ${total.written.constructs} constructs written · ${total.built.rows} rows built, ` +
    `in ${total.built.constructs} constructs · ${total.proved.rows} rows proved · ${total.builtNotStated.count} not written (${total.builtNotStated.proved} of them proved) · ` +
    `${total.statedNotBuilt.count} not built · ${total.builtNotProved.count} not proved`);
  for (const one of result.findings) lines.push(`  ${one.file}: ${one.message}`);
  lines.push(`  ${result.report.path} — ${!result.report.exists ? "not written yet" : result.report.current ? "current, nothing to write" : "stale"} · ${result.digest}`);
  return lines;
}

export const describe = "the coverage report's measurement — written, built and proved, and the gaps, per package, app, domain and repository";

/** `spn-devex coverage measure <repo> [--json]`. */
export function run(args: string[]): number {
  const root = resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");
  const result = foundationAbsence(root) ?? measure(root);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else for (const line of describeResult(result)) console.log(line);
  return 0;
}

// The exit code is set and the process is left to end by itself, so `--json` sent through a pipe is
// written whole before the process ends.
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exitCode = run(process.argv.slice(2));
