#!/usr/bin/env node
// The tests report's measurement — every behaviour row, joined to the last run of its own tier.
//
//     spn-devex behaviours coverage [--json] [root]
//
// It measures and never writes a page: a report is written by the agent and produced by no command
// (the book's RD.DEVEX.WORKSPACE.149). Every tier the repository owes appears, whether or not it ran, and the
// same tree measures to the same bytes — the instant is the newest run's, in the local zone with its
// offset, and the digest hashes the measurement alone.

import { createHash } from "node:crypto";
import { withOffset } from "../../lib/clock.ts";
import { readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { DOCS, reportsDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { declaredRows, idsIn } from "../../../../../plugin-support-lib/src/lib/register.ts";
import { owedBy, TIERS } from "../../../../../plugin-support-lib/src/lib/kinds.ts";
import { artifactPaths, newest, read, readArtifact, worst } from "../../../../../plugin-support-lib/src/lib/runs.ts";
import type { Run } from "../../../../../plugin-support-lib/src/lib/runs.ts";

const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };

type Finding = { project: string; kind: null; severity: string; ftype: string; message: string };
type TierState = "RAN" | "PARTIAL" | "NOT_RUN";

/** Where the tests report lands in a repository's pocket, named by its kind (RD.DEVEX.WORKSPACE.149). */
export const TESTS_REPORT = join(reportsDir(DOCS), "tests-report.html");

const finding = (file: string, message: string): Finding =>
  ({ project: file, kind: null, severity: "WARN", ftype: "BEHAVIOUR_ROW", message: message });

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
  UNIT: [{ folder: "unit", match: /\.(spec|test)\.tsx?$/ }],
  COMPONENT: [{ folder: "component", match: /\.ct\.spec\.tsx?$/ }],
  INTEGRATION: [{ folder: "integration", match: /\.int\.(spec|test)\.tsx?$/ }],
  CONTRACT: [{ folder: "contract", match: /\.contract\.spec\.tsx?$/ }],
  JOURNEY: [{ folder: "journeys", match: /\.spec\.tsx?$/ }],
};

/**
 * The node whose run carries this node's cases, and the folder under its tier folder they sit in.
 *
 * A module an application owns keeps its cases in the COMPOSING APPLICATION's tree, under a folder
 * named for the module, and the application's run executes them. Reading the module's own folder for
 * an artifact reported every such module as unrun while its cases had just passed.
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

/** A journey configuration at the repository root: `playwright.config.ts` and its phase files, never `playwright-ct`. */
const ROOT_JOURNEY_CONFIG = /^playwright(\.[a-z]+)?\.config\.(ts|mts|cts|js|mjs|cjs)$/;

/** Every journey case file under a folder's `tests/journeys/`. */
const journeyFiles = (folder: string): string[] => {
  const dir = join(folder, "tests", "journeys");
  if (!isDir(dir)) return [];
  try {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && CASE_FOLDERS.JOURNEY[0].match.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name));
  } catch { return []; }
};

/**
 * The web applications a repository's one root journey run drives (RD.SUPPORT.APPS.135).
 *
 * A repository runs its journeys from one root configuration when a `playwright.config.*` sits at its
 * root, or when a journey artifact sits at the root itself. That run writes its artifact under
 * whichever node invoked it, and it collects every journey in the repository. It drives an
 * `APP_WEB` when an id the run named at `JOURNEY` is written in one of that application's journey
 * files: a case file beside it (`<app>/tests/journeys/`), or a root case file (`tests/journeys/`)
 * that reaches into the application's own folder by path, the way a case imports the test handles
 * a screen carries. Both are read from files that already exist; nothing new is declared.
 */
export function drivenByRootRun(root: string, nodes: string[], runsByNode: Map<string, Run[]>): string[] {
  const nameOf = (node: string): string => relative(root, node).split("\\").join("/") || ".";
  let rootConfig = false;
  try { rootConfig = readdirSync(root).some((entry) => ROOT_JOURNEY_CONFIG.test(entry)); } catch { rootConfig = false; }
  const journeyRuns = [...runsByNode.entries()]
    .filter(([name]) => rootConfig || name === ".")
    .flatMap(([, found]) => found.filter((run) => run.tiers.includes("JOURNEY")));
  if (journeyRuns.length === 0) return [];
  const named = new Set(journeyRuns.flatMap((run) => run.results.filter((result) => result.tier === "JOURNEY").map((result) => result.id)));
  const rootCases = journeyFiles(root).map((file) => read(file) ?? "");
  return nodes
    .filter((node) => node !== root && kindOf(node) === "APP_WEB")
    .filter((node) => {
      const reach = `${nameOf(node)}/`;
      const texts = [...journeyFiles(node).map((file) => read(file) ?? ""), ...rootCases.filter((text) => text.includes(reach))];
      return texts.some((text) => idsIn(text).some((id) => named.has(id)));
    })
    .map(nameOf);
}

/**
 * The services a client's contract run speaks for (RD.SUPPORT.APPS.135).
 *
 * An `APP_SERVER` carries no contract suite of its own: the `CLIENT_API` beside it drives the running
 * service through the generated client, and that suite IS the service's contract tier. So a contract
 * run left by any `CLIENT_API` in the repository meets the tier for every `APP_SERVER` in it, which
 * is the rule `apps validate` applies to the cases on disk. Nothing declares which client belongs to
 * which service, so the credit is repository-wide.
 */
export function creditedByClientRun(root: string, nodes: string[], ranBy: string[]): string[] {
  const nameOf = (node: string): string => relative(root, node).split("\\").join("/") || ".";
  const clientRan = nodes.some((node) => kindOf(node) === "CLIENT_API" && ranBy.includes(nameOf(node)));
  if (!clientRan) return [];
  return nodes.filter((node) => kindOf(node) === "APP_SERVER").map(nameOf);
}

/** The measurement for one repository. */
export function measure(root: string): Record<string, unknown> {
  const nodes = nodesOf(root);
  const nameOf = (node: string): string => relative(root, node).split("\\").join("/") || ".";
  const { rows: declared } = declaredRows(root);
  const findings: Finding[] = [];

  const runsByNode = new Map<string, Run[]>();
  for (const node of nodes) {
    const found: Run[] = [];
    for (const tier of TIERS) {
      for (const file of artifactPaths(node, tier)) {
        const readOne = readArtifact(root, file);
        if (readOne === null) continue;
        if ("finding" in readOne) {
          findings.push({ project: readOne.finding.split(":")[0], kind: null, severity: "WARN", ftype: "BEHAVIOUR_PROOF",
            message: `${readOne.finding.slice(readOne.finding.indexOf(":") + 2)} — until it matches, nothing can be read from this run.` });
          continue;
        }
        found.push(readOne.run);
      }
    }
    runsByNode.set(nameOf(node), found);
  }
  const allRuns = [...runsByNode.values()].flat();
  const driven = drivenByRootRun(root, nodes, runsByNode);
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
    const speaking = tier === null ? [] : allRuns.filter((run) => run.tiers.includes(tier));
    const naming = speaking.filter((run) => run.results.some((result) => result.id === row.id && result.tier === tier));
    const said = naming.flatMap((run) => run.results.filter((result) => result.id === row.id && result.tier === tier));
    const found = said.length === 0 ? null : worst(said.map((result) => result.status));
    const ranAt = newest(naming);
    return {
      id: row.id, file: row.file, who: row.who, does: row.does, tier: tier, status: status, updatedAt: row.updatedAt,
      tierRan: speaking.length > 0,
      found: found,
      // A MANUAL row is a person's, and no run writes it — so it can never lag one.
      unstamped: found !== null && status !== "MANUAL" && (status !== found || row.updatedAt !== ranAt),
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

  const tierSet = new Set<string>();
  for (const owed of owedByNode.values()) owed.forEach((tier) => tierSet.add(tier));
  rows.forEach((row) => row.tier !== null && tierSet.add(row.tier));
  allRuns.forEach((run) => run.tiers.forEach((tier) => tierSet.add(tier)));

  const tiers = TIERS.filter((tier) => tierSet.has(tier)).map((tier) => {
    const owedByNames = [...owedByNode.entries()].filter(([, owed]) => owed.includes(tier)).map(([name]) => name);
    const ranBy = [...runsByNode.entries()].filter(([, found]) => found.some((run) => run.tiers.includes(tier))).map(([name]) => name);
    // A repository's one root journey run meets the journey tier of every application it drives, and a
    // client's contract run meets the contract tier of the service it mirrors.
    const credited = tier === "JOURNEY" ? driven : tier === "CONTRACT" ? creditedByClientRun(root, nodes, ranBy) : [];
    const creditedTo = credited.filter((name) => !ranBy.includes(name));
    const nodeOf = new Map(nodes.map((node) => [nameOf(node), node]));
    // A module an application owns is proved by the application's run, where its cases execute.
    const ranThrough = (name: string): boolean => {
      const node = nodeOf.get(name);
      if (node === undefined) return false;
      const { carrier, scope } = carrierOf(node);
      return scope !== "" && ranBy.includes(nameOf(carrier)) && carriesCase(node, tier);
    };
    const pending = owedByNames.filter((name) => !ranBy.includes(name) && !creditedTo.includes(name) && !ranThrough(name));
    // Owed and never written is a different gap from written and never run, and it takes different work.
    const noCase = pending.filter((name) => { const node = nodeOf.get(name); return node !== undefined && !carriesCase(node, tier); });
    const unrunBy = pending.filter((name) => !noCase.includes(name));
    const runs = [...runsByNode.entries()].flatMap(([name, found]) => found
      .filter((run) => run.tiers.includes(tier))
      .map((run) => ({ node: name, file: run.from, ranAt: run.ranAt, results: run.results.length })));
    const rowCount = rows.filter((row) => row.tier === tier).length;
    const command = `\`spnutils apps test ${tier.toLowerCase()} <package>\``;
    const state: TierState = runs.length === 0 ? "NOT_RUN" : unrunBy.length + noCase.length > 0 ? "PARTIAL" : "RAN";
    const reason = state === "RAN"
      ? null
      : state === "PARTIAL"
        ? [
            unrunBy.length > 0 ? `${unrunBy.length} of ${owedByNames.length} node(s) that owe it carry cases and left no run artifact: ${unrunBy.join(" · ")}.` : null,
            noCase.length > 0 ? `${noCase.length} of ${owedByNames.length} node(s) that owe it carry no case for it yet: ${noCase.join(" · ")}.` : null,
            `Their share of the ${rowCount} row(s) at this tier is unproved, not failing.`,
          ].filter((part) => part !== null).join(" ")
        : owedByNames.length === 0
          ? `no run artifact speaks for it, and no node's kind owes it — ${rowCount} row(s) declare it, so they are ` +
            `unproved until a node carrying this tier runs it with ${command}.`
          : `no node that owes it has left a run artifact (owed by ${owedByNames.join(" · ")}), so its ${rowCount} ` +
            `row(s) are unproved, not failing. ${command} leaves one.`;
    return { tier: tier, state: state, owedBy: owedByNames, unrunBy: unrunBy, noCase: noCase, creditedTo: creditedTo, runs: runs, rows: rowCount, reason: reason };
  });

  const ranAt = newest(allRuns);
  const measured = {
    repository: basename(root),
    measuredAt: ranAt === null ? null : withOffset(new Date(ranAt)),
    absence: null,
    tiers: tiers,
    rows: rows,
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
    `${result.repository} — the behaviour rows, joined to the last run of each tier · ` +
    (result.measuredAt === null ? "no run artifact on disk" : `newest run ${result.measuredAt}`),
  ];
  for (const tier of result.tiers) {
    const ran = (tier.runs.length === 0 ? "" : ` · ${tier.runs.length} artifact(s)`) +
      (tier.creditedTo.length === 0 ? "" :
        ` · ${tier.tier === "CONTRACT" ? "a client's contract run" : "the root run"} credited to ${tier.creditedTo.join(" · ")}`);
    lines.push(`  ${tier.tier.padEnd(11)} ${tier.state.padEnd(7)} ${tier.rows} row(s)${ran}` +
      (tier.reason === null ? "" : ` — ${tier.state === "NOT_RUN" ? "not run: " : ""}${tier.reason}`));
  }
  const byStatus = new Map<string, number>();
  for (const row of result.rows) byStatus.set(row.status ?? "unreadable", (byStatus.get(row.status ?? "unreadable") ?? 0) + 1);
  const counts = [...byStatus.entries()].sort().map(([word, count]) => `${word} ${count}`).join(" · ");
  lines.push(`  rows ${result.rows.length}${counts === "" ? "" : ` — ${counts}`}`);
  lines.push(`  not run: ${result.rows.filter((row: any) => row.tier !== null && !row.tierRan).length} row(s) whose tier no ` +
    `artifact speaks for · no tier: ${result.rows.filter((row: any) => row.tier === null).length} row(s) no run can reach`);
  lines.push(`  unstamped: ${result.rows.filter((row: any) => row.unstamped).length} row(s) a run named that do not carry what it found`);
  for (const one of result.findings) lines.push(`  ${one.ftype} ${one.project} ${one.message}`);
  if (result.report !== null) {
    lines.push(`  ${result.report.path} — ` +
      (!result.report.exists ? "not written yet" : result.report.current ? "current, nothing to write" : "stale") +
      ` · ${result.digest}`);
  }
  return lines;
}

export const describe = "the tests report's measurement — every behaviour row joined to the last run of its own tier";

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const result = foundationAbsence(root) ?? measure(root);
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else for (const line of describeResult(result)) console.log(line);
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
