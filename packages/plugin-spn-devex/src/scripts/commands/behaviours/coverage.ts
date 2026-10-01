#!/usr/bin/env node
// The tests report's measurement — every behaviour row, read as the stamp wrote it.
//
//     spn-devex behaviours coverage [--json] [root]
//
// It reads the stamped rows only: each row's `Status`, and the run its `Updated at` cites. It opens
// no run file, so what it counts is what the stamp wrote (the book's RD.DEVEX.UTILS.071). It measures
// and never writes a page: a report is written by the agent and produced by no command (the book's
// RD.DEVEX.WORKSPACE.149). Every tier the repository owes appears, and the same tree measures to the
// same bytes — the instant is the newest `Updated at` it read, in the local zone with its offset, and
// the digest hashes the measurement alone.
//
// It also reads each case title from the test source, and lists three things as findings: a case
// that names an id no row declares, an id whose cases all sit at another level than its row's `Tier`,
// and an id that more than one row declares. A finding never changes the exit code, which is 0.

import { createHash } from "node:crypto";
import { withOffset } from "../../lib/clock.ts";
import { readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { DOCS, reportsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { declaredIds, declaredRows, idsIn } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { owedBy, TIERS } from "../../../../../plugin-support-lib/src/lib/kinds.ts";
import { cited, read } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import { constructKeyOf, domainName, domainOf, domainsOf, readChapters } from "../coverage/_join.ts";

const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };

type Finding = { project: string; kind: null; severity: string; ftype: string; message: string };

/** Where the tests report lands in a repository's pocket, named by its kind (RD.DEVEX.WORKSPACE.149). */
export const TESTS_REPORT = join(reportsDir(DOCS), "tests-report.html");

const finding = (file: string, message: string, ftype = "BEHAVIOUR_ROW"): Finding =>
  ({ project: file, kind: null, severity: "WARN", ftype: ftype, message: message });

const digestOf = (value: unknown): string =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)}`;

/** A cell left empty on purpose — a row that declares no tier says so with a dash. */
const isBlankCell = (cell: string): boolean => /^[\s`—–-]*$/.test(cell);

/** The kind a folder declares in its `spkind.json`, or null. */
const kindOf = (folder: string): string | null => {
  const text = read(join(folder, "spkind.json"));
  if (text === null) return null;
  try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
};

/**
 * Every node: the root, each project under `apps/` and `packages/` that declares a kind in its
 * `spkind.json`, and the modules an application owns. The manifest is SaaS Plane's own, so no
 * stack's package file is read.
 */
export function nodesOf(root: string): string[] {
  const nodes = [root];
  for (const folder of ["apps", "packages"]) {
    let entries: string[];
    try { entries = readdirSync(join(root, folder)).sort(); } catch { continue; }
    for (const entry of entries) {
      const project = join(root, folder, entry);
      if (!isDir(project) || !isFile(join(project, "spkind.json"))) continue;
      nodes.push(project);
      let modules: string[];
      try { modules = readdirSync(join(project, "src", "modules")).sort(); } catch { continue; }
      for (const module of modules) {
        if (isFile(join(project, "src", "modules", module, "spkind.json"))) nodes.push(join(project, "src", "modules", module));
      }
    }
  }
  return nodes;
}

/** A foundation repository's answer: its rows are promises with no status and no tier, so nothing is measured. */
export function foundationAbsence(root: string): Record<string, unknown> | null {
  const text = read(join(root, "sprepo.json"));
  if (text === null) return null;
  let type: string | undefined;
  try { type = (JSON.parse(text) as { type?: string }).type; } catch { return null; }
  if (type !== "FOUNDATION") return null;
  const name = basename(root);
  const measured = {
    repository: name,
    measuredAt: null,
    absence:
      `${name} declares FOUNDATION: its behaviour rows are promises, with no Status and no Tier (RD.SUPPORT.APPS.129), ` +
      `and it runs no proving tier. There is nothing to measure, so no tests report is owed — an empty one ` +
      `would read as a failure rather than as an absence.`,
    tiers: [],
    rows: [],
    domains: [],
    wholeRepository: null,
    findings: [],
  };
  return { ...measured, digest: digestOf(measured), report: null };
}

/**
 * Where a tier's cases sit under a node's `tests/`, and the file names that count as one. Every tier
 * keeps a folder of its own, so one case file never reads as two tiers: a `CLIENT_API`'s contract
 * suite sits in `contract/`, and an `APP_SERVER`'s `integration/` cases are integration cases.
 */
const CASE_FOLDERS: Record<string, ReadonlyArray<{ folder: string; match: RegExp }>> = {
  UNIT: [{ folder: "unit", match: /\.(spec|test)\.(tsx?|mjs)$/ }],
  COMPONENT: [{ folder: "component", match: /\.ct\.spec\.tsx?$/ }],
  INTEGRATION: [{ folder: "integration", match: /\.int\.(spec|test)\.tsx?$/ }],
  CONTRACT: [{ folder: "contract", match: /\.contract\.spec\.tsx?$/ }],
  JOURNEY: [{ folder: "journeys", match: /\.spec\.tsx?$/ }],
};

/**
 * The node whose run carries this node's cases, and the folder under its tier folder they sit in.
 *
 * A module an application owns keeps its cases in the COMPOSING APPLICATION's tree, under a folder
 * named for the module, and the application's run executes them.
 */
export function carrierOf(node: string): { carrier: string; scope: string } {
  const inApp = node.match(/^(.*)\/src\/modules\/([^/]+)$/);
  return inApp === null ? { carrier: node, scope: "" } : { carrier: inApp[1], scope: inApp[2] };
}

/** Whether a node carries at least one case for this tier, on disk. */
export function carriesCase(node: string, tier: string): boolean {
  const { carrier, scope } = carrierOf(node);
  return (CASE_FOLDERS[tier] ?? []).some((surface) => {
    const folder = join(carrier, "tests", surface.folder, scope);
    if (!isDir(folder)) return false;
    try {
      return readdirSync(folder, { recursive: true, withFileTypes: true })
        .some((entry) => entry.isFile() && surface.match.test(entry.name));
    } catch { return false; }
  });
}

/**
 * A `describe`, `it` or `test` call's title. A `.skip` or `.todo` call proves nothing, so it is not
 * read. The same pattern is in `spn-apps`, `providers/ts/scripts/lib/cases.ts`: a plugin imports
 * nothing from another plugin, so the two are kept alike by hand.
 */
const TITLE_CALL = /\b(?:describe|it|test)(?:\.(?!skip|todo)\w+)?\s*\(\s*(['"`])([\s\S]*?)\1/g;

/** One behaviour id a case title cites, with the file the case sits in and the level of its folder. */
export type CitingCase = { id: string; title: string; file: string; tier: string };

/**
 * Every id a case title cites, read from the test source under each node's `tests/` folder. The
 * level of a case is the folder it sits in, as `CASE_FOLDERS` names them.
 *
 * A module that an application owns keeps its cases in the application's tree, so only the
 * application is walked. A `TOOLCHAIN` node is not read: its cases prove the runner itself, and
 * their sample titles carry ids that no row is meant to declare.
 */
export function citingCases(root: string, nodes: string[]): CitingCase[] {
  const cases: CitingCase[] = [];
  for (const node of nodes) {
    if (carrierOf(node).scope !== "" || kindOf(node) === "TOOLCHAIN") continue;
    for (const [tier, surfaces] of Object.entries(CASE_FOLDERS)) {
      for (const surface of surfaces) {
        const folder = join(node, "tests", surface.folder);
        let entries: Array<{ name: string; parentPath: string; isFile(): boolean }>;
        try { entries = readdirSync(folder, { recursive: true, withFileTypes: true }); } catch { continue; }
        const files = entries.filter((entry) => entry.isFile() && surface.match.test(entry.name))
          .map((entry) => join(entry.parentPath, entry.name)).sort();
        for (const file of files) {
          const source = read(file);
          if (source === null) continue;
          const shown = relative(root, file).split("\\").join("/");
          for (const call of source.matchAll(TITLE_CALL)) {
            for (const id of idsIn(call[2])) cases.push({ id: id, title: call[2], file: shown, tier: tier });
          }
        }
      }
    }
  }
  return cases;
}

/**
 * The row statuses a Repository row counts, each always present so a zero reads as counted. A `MANUAL`
 * row counts in none of the numbers (05-artifacts.md § The tests report): a person proves it by the
 * repository's browser guide, so it is listed as `manual` beside the counts, and the four sum to Written.
 */
const STATUS_WORDS = ["SUCCESS", "FAILED", "PENDING", "PLANNED"] as const;

/** Whether a row is proved by a person rather than by a run. */
const isManual = (row: { status: string | null }): boolean => row.status === "MANUAL";

/** The `MANUAL` rows of a group, as the report lists them. */
const manualOf = (group: Array<{ id: string; file: string; status: string | null }>) =>
  group.filter(isManual).map((row) => ({ id: row.id, file: row.file }));

/** The measurement for one repository. */
export function measure(root: string): Record<string, unknown> {
  const nodes = nodesOf(root);
  const nameOf = (node: string): string => relative(root, node).split("\\").join("/") || ".";
  const { rows: declared, repeated } = declaredRows(root);
  const findings: Finding[] = [];
  const owedByNode = new Map(nodes.map((node) => [nameOf(node), owedBy(kindOf(node))]));

  const measurable = declared.filter((row) => {
    if (row.type !== "PROMISE") return true;
    findings.push(finding(row.file,
      `${row.id} reads Type \`PROMISE\`, which belongs to the foundation alone and carries no proof state, so it ` +
      `is left out of the join. Write \`POSITIVE\` or \`NEGATIVE\`.`));
    return false;
  });

  const rows = measurable.map((row) => {
    const tier = TIERS.includes(row.tier) ? row.tier : null;
    const status = ["PLANNED", "PENDING", "SUCCESS", "FAILED", "MANUAL"].includes(row.status) ? row.status : null;
    const cites = cited(row.updatedAt);
    return {
      id: row.id, file: row.file, who: row.who, does: row.does, tier: tier, status: status, updatedAt: row.updatedAt,
      // What the stamp wrote: the instant, and the run it cites. The run's file is never opened.
      ranAt: cites?.at ?? null,
      run: cites?.run ?? null,
    };
  });
  for (const row of measurable) {
    const misspelt = [
      !TIERS.includes(row.tier) && !isBlankCell(row.tierCell) ? `Tier "${row.tierCell.trim()}"` : null,
      !["PLANNED", "PENDING", "SUCCESS", "FAILED", "MANUAL"].includes(row.status) && !isBlankCell(row.statusCell)
        ? `Status "${row.statusCell.trim()}"` : null,
    ].filter((one): one is string => one !== null);
    if (misspelt.length > 0) {
      findings.push(finding(row.file,
        `${row.id} carries ${misspelt.join(" and ")}, which no closed vocabulary declares, so it is listed without ` +
        `a verdict — correct the spelling and a run can speak for it.`));
    }
  }

  // An id that more than one row declares. `rows` keeps the first row, and both are named here.
  for (const one of repeated) {
    findings.push(finding(one.rows[0].file,
      `${one.id} is declared by ${one.rows.length} rows — ${one.rows.map((row) => `${row.file}:${row.line}`).join(" · ")}. ` +
      `The first is the row that is counted. An id names one promise, so give the other row an id of its own.`,
      "DUPLICATE_ID"));
  }

  // What the test source says, read from the case titles and never from a run file.
  const known = declaredIds(root);
  const tierOfId = new Map(rows.filter((row) => row.tier !== null).map((row) => [row.id, row.tier as string]));
  const casesById = new Map<string, CitingCase[]>();
  for (const one of citingCases(root, nodes)) casesById.set(one.id, [...(casesById.get(one.id) ?? []), one]);
  for (const [id, cases] of [...casesById.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (!known.has(id)) {
      for (const file of [...new Set(cases.map((one) => one.file))]) {
        findings.push(finding(file,
          `a case title cites ${id}, which no behaviour row declares. A case names the row it proves: declare the row, ` +
          `or correct the id in the title.`, "CASE_UNKNOWN_ID"));
      }
      continue;
    }
    const owed = tierOfId.get(id);
    if (owed === undefined || cases.some((one) => one.tier === owed)) continue;
    const found = [...new Set(cases.map((one) => one.tier))].sort().join(" · ");
    findings.push(finding(cases[0].file,
      `${id} is a ${owed} row, and every case that cites it sits at another level (${found}): ` +
      `${[...new Set(cases.map((one) => one.file))].join(" · ")}. A run counts for a row only at the row's own Tier, ` +
      `so write the case at ${owed}, or correct the row's Tier.`, "CASE_OTHER_LEVEL"));
  }

  // Built is the coverage report's own: a behaviour whose design topic is built, read from the same
  // capability chapters by the same join, so the two reports can never disagree on it. A behaviour
  // about the whole repository has no design topic and is never built.
  const levels = nodes.filter((node) => /^(apps|packages)\/[^/]+$/.test(nameOf(node)));
  const builtKeys = new Set(readChapters(root, rows.map((row) => constructKeyOf(row.file)).filter((key): key is string => key !== null), levels).built);
  const tally = (all: typeof rows) => {
    const group = all.filter((row) => !isManual(row));
    return {
      written: group.length,
      built: group.filter((row) => { const key = constructKeyOf(row.file); return key !== null && builtKeys.has(key); }).length,
      status: {
        ...Object.fromEntries(STATUS_WORDS.map((word) => [word, group.filter((row) => row.status === word).length])),
        unreadable: group.filter((row) => row.status === null).length,
      },
      manual: manualOf(all),
    };
  };

  const tierSet = new Set<string>();
  for (const owed of owedByNode.values()) owed.forEach((tier) => tierSet.add(tier));
  rows.forEach((row) => row.tier !== null && tierSet.add(row.tier));

  const tiers = TIERS.filter((tier) => tierSet.has(tier)).map((tier) => {
    const owedByNames = [...owedByNode.entries()].filter(([, owed]) => owed.includes(tier)).map(([name]) => name);
    // Owed and never written is a gap in the cases, read from the tree; it opens no run file.
    const noCase = owedByNames.filter((name) => { const node = nodes.find((one) => nameOf(one) === name); return node !== undefined && !carriesCase(node, tier); });
    const atTier = rows.filter((row) => row.tier === tier && !isManual(row));
    // The runs this tier's rows cite, newest first, each with how many rows cite it.
    const byRun = new Map<string, { run: string; ranAt: string; rows: number }>();
    for (const row of atTier) {
      if (row.run === null) continue;
      const one = byRun.get(row.run) ?? { run: row.run, ranAt: row.ranAt ?? "", rows: 0 };
      one.rows += 1;
      if ((row.ranAt ?? "") > one.ranAt) one.ranAt = row.ranAt ?? "";
      byRun.set(row.run, one);
    }
    const runs = [...byRun.values()].sort((left, right) => right.ranAt.localeCompare(left.ranAt) || left.run.localeCompare(right.run));
    const { written, built, status } = tally(atTier);
    return { tier: tier, owedBy: owedByNames, noCase: noCase, runs: runs, rows: atTier.length, written: written, built: built, status: status };
  });

  // THE REPOSITORY TABLE, BY DOMAIN.
  const domains = domainsOf(root, rows.map((row) => domainOf(row.file)).filter((one): one is string => one !== null))
    .map((domain) => ({ domain, name: domainName(root, domain), ...tally(rows.filter((row) => domainOf(row.file) === domain)) }));
  const aboutTheRepository = rows.filter((row) => domainOf(row.file) === null);
  const wholeRepository = { files: [...new Set(aboutTheRepository.map((row) => row.file))].sort(), ...tally(aboutTheRepository) };

  // When the numbers were true: the newest instant among the rows it read (RD.DEVEX.WORKSPACE.192).
  const ranAt = rows.map((row) => row.ranAt).filter((at): at is string => at !== null).sort().slice(-1)[0] ?? null;
  const measured = {
    repository: basename(root),
    measuredAt: ranAt === null ? null : withOffset(new Date(ranAt)),
    absence: null,
    tiers: tiers,
    rows: rows,
    domains: domains,
    wholeRepository: wholeRepository,
    manual: [...domains.flatMap((domain) => domain.manual), ...wholeRepository.manual],
    findings: findings,
  };
  const digest = digestOf(measured);
  const page = read(join(root, TESTS_REPORT));
  return { ...measured, digest: digest, report: { path: TESTS_REPORT, exists: page !== null, current: page !== null && page.includes(digest) } };
}

/** The measurement as a person reads it in a terminal. The rows themselves are in `--json`. */
export function describeResult(result: Record<string, any>): string[] {
  if (result.absence !== null) return [`${result.repository} — no measurement. ${result.absence}`];
  const lines = [
    `${result.repository} — the behaviour rows, as the stamp wrote them · ` +
    (result.measuredAt === null ? "no row cites a run" : `newest Updated at ${result.measuredAt}`),
  ];
  for (const tier of result.tiers) {
    const runs = tier.runs.length === 0 ? "no run cited"
      : `run(s) cited: ${tier.runs.map((one: any) => `${one.run} (${one.rows})`).join(" · ")}`;
    lines.push(`  ${tier.tier.padEnd(11)} ${tier.rows} row(s) · ${runs}` +
      (tier.noCase.length === 0 ? "" : ` · owed and no case: ${tier.noCase.join(" · ")}`));
  }
  const byStatus = new Map<string, number>();
  const counted = result.rows.filter((row: any) => row.status !== "MANUAL");
  for (const row of counted) byStatus.set(row.status ?? "unreadable", (byStatus.get(row.status ?? "unreadable") ?? 0) + 1);
  const counts = [...byStatus.entries()].sort().map(([word, count]) => `${word} ${count}`).join(" · ");
  lines.push(`  rows ${counted.length}${counts === "" ? "" : ` — ${counts}`}` +
    (result.manual.length === 0 ? "" : ` · ${result.manual.length} proved by hand, counted in none of these`));
  lines.push(`  no tier: ${result.rows.filter((row: any) => row.tier === null).length} row(s) no run can reach · ` +
    `no run cited: ${counted.filter((row: any) => row.run === null && row.status !== "PLANNED").length} stamped row(s) whose Updated at names no run`);
  const rowsLine = (label: string, one: any): string =>
    `  ${label}: ${one.written} written · ${one.built} built · ${STATUS_WORDS.map((word) => `${word} ${one.status[word]}`).join(" · ")}`;
  for (const domain of result.domains) lines.push(rowsLine(`domain ${domain.domain} (${domain.name})`, domain));
  lines.push(rowsLine("the whole repository", result.wholeRepository));
  for (const one of result.findings) lines.push(`  ${one.ftype} ${one.project} ${one.message}`);
  if (result.report !== null) {
    lines.push(`  ${result.report.path} — ` +
      (!result.report.exists ? "not written yet" : result.report.current ? "current, nothing to write" : "stale") +
      ` · ${result.digest}`);
  }
  return lines;
}

export const describe = "the tests report's measurement — every behaviour row, read as the stamp wrote it";

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const result = foundationAbsence(root) ?? measure(root);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else for (const line of describeResult(result)) console.log(line);
  return 0;
}

// The exit code is set and the process is left to end by itself, so `--json` sent through a pipe is
// written whole before the process ends.
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exitCode = run(process.argv.slice(2));
