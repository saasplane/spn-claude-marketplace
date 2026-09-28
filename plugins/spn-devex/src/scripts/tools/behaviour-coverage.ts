#!/usr/bin/env node
// The tests report's measurement — every behaviour row, joined to the last run of its own tier.
//
//     node behaviour-coverage.ts [--json] [root]
//
// It measures and never writes a page: a report is written by the agent and produced by no command
// (the book's RD.DOCS.089). Every tier the repository owes appears, whether or not it ran, and the
// same tree measures to the same bytes — the date is the newest run's, and the digest hashes the
// measurement alone.

import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { declaredRows } from "../lib/register.ts";
import { owedBy, TIERS } from "../lib/kinds.ts";
import { artifactPath, newest, read, readArtifact, worst } from "../lib/runs.ts";
import type { Run } from "../lib/runs.ts";

const isDir = (path: string): boolean => { try { return statSync(path).isDirectory(); } catch { return false; } };
const isFile = (path: string): boolean => { try { return statSync(path).isFile(); } catch { return false; } };

type Finding = { project: string; kind: null; severity: string; ftype: string; message: string };
type TierState = "RAN" | "PARTIAL" | "NOT_RUN";

/** Where the tests report lands in a repository's pocket, named by its kind (RD.DOCS.089). */
export const TESTS_REPORT = "docs/artifacts/reports/tests-report.html";

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
      `${name} declares FOUNDATION: its behaviour rows are promises, with no Status and no Tier (RD.APPS.129), ` +
      `and it runs no proving tier. There is nothing to measure, so no tests report is owed — an empty one ` +
      `would read as a failure rather than as an absence.`,
    tiers: [],
    rows: [],
    findings: [],
  };
  return { ...measured, digest: digestOf(measured), report: null };
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
      const readOne = readArtifact(root, artifactPath(node, tier));
      if (readOne === null) continue;
      if ("finding" in readOne) {
        findings.push({ project: readOne.finding.split(":")[0], kind: null, severity: "WARN", ftype: "BEHAVIOUR_PROOF",
          message: `${readOne.finding.slice(readOne.finding.indexOf(":") + 2)} — until it matches, nothing can be read from this run.` });
        continue;
      }
      found.push(readOne.run);
    }
    runsByNode.set(nameOf(node), found);
  }
  const allRuns = [...runsByNode.values()].flat();
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
    const unrunBy = owedByNames.filter((name) => !ranBy.includes(name));
    const runs = [...runsByNode.entries()].flatMap(([name, found]) => found
      .filter((run) => run.tiers.includes(tier))
      .map((run) => ({ node: name, file: run.from, ranAt: run.ranAt, results: run.results.length })));
    const rowCount = rows.filter((row) => row.tier === tier).length;
    const command = `\`spnutils apps test ${tier.toLowerCase()} <package>\``;
    const state: TierState = runs.length === 0 ? "NOT_RUN" : unrunBy.length > 0 ? "PARTIAL" : "RAN";
    const reason = state === "RAN"
      ? null
      : state === "PARTIAL"
        ? `${unrunBy.length} of ${owedByNames.length} node(s) that owe it left no run artifact: ${unrunBy.join(" · ")}. ` +
          `Their share of the ${rowCount} row(s) at this tier is unproved, not failing.`
        : owedByNames.length === 0
          ? `no run artifact speaks for it, and no node's kind owes it — ${rowCount} row(s) declare it, so they are ` +
            `unproved until a node carrying this tier runs it with ${command}.`
          : `no node that owes it has left a run artifact (owed by ${owedByNames.join(" · ")}), so its ${rowCount} ` +
            `row(s) are unproved, not failing. ${command} leaves one.`;
    return { tier: tier, state: state, owedBy: owedByNames, unrunBy: unrunBy, runs: runs, rows: rowCount, reason: reason };
  });

  const ranAt = newest(allRuns);
  const measured = {
    repository: basename(root),
    measuredAt: ranAt === null ? null : ranAt.slice(0, 10),
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
export function describe(result: Record<string, any>): string[] {
  if (result.absence !== null) return [`${result.repository} — no measurement. ${result.absence}`];
  const lines = [
    `${result.repository} — the behaviour rows, joined to the last run of each tier · ` +
    (result.measuredAt === null ? "no run artifact on disk" : `newest run ${result.measuredAt}`),
  ];
  for (const tier of result.tiers) {
    const ran = tier.runs.length === 0 ? "" : ` · ${tier.runs.length} artifact(s)`;
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

if (process.argv[1]?.endsWith("behaviour-coverage.ts")) {
  const argv = process.argv.slice(2);
  const root = resolve(argv.find((a) => !a.startsWith("--")) ?? ".");
  const result = foundationAbsence(root) ?? measure(root);
  if (argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else for (const line of describe(result)) console.log(line);
}
