#!/usr/bin/env node
// Write what the last run found into the behaviour rows, and nothing else.
//
//     node behaviour-rows.ts [--write] [--reach repository] [root]
//
// **What a row is for.** `Type` and `Tier` are decisions somebody makes, so a person writes them.
// `Status` and `Updated at` are what the last run FOUND, so the agent writes them and a hand edit to
// either is a claim rather than a finding. The two were one cell until they disagreed quietly: a
// single green mark meant both *this works* and *something proves it*, so a row whose case had
// stopped running still read as proven.
//
// **It reads the run's own artifact and never a spec.** Before this, a status was derived — a route
// crossed with a surface, a source tree scanned for case titles — and every derivation reported a
// case that exists as a case that ran. `spn-tests.json` is what the runner actually did, so a case
// that was skipped, filtered out or never reached says so.
//
// **A run speaks for the tiers it ran, and for nothing else.** A `CONTRACT` run updates rows
// declaring `CONTRACT` and leaves every `JOURNEY` row exactly as it found them. This is why `Tier`
// is hand-declared: without it a partial run would reset everything it had not covered, and the
// register would swing on every run.
//
// **And it never resets unless it is told the run was the whole tier.** Runs are per node while a
// register is per repository, so an artifact from one node covers a tier it does not own alone: a
// journey run of the web app would otherwise put the service's journey rows back to `PLANNED`.
// `--reach repository` is the caller saying *these artifacts are the whole of these tiers* — which a
// person or a pipeline knows and no tool can see. Without it, rows nothing named are left alone.
//
// **`MANUAL` is never written over.** A behaviour a person checks by hand has no case and no run, so
// it is the one intent no evidence can recover — and the one value a person writes.
//
// **It finds a register by its HEADER, never by a path.** A tree that moves does not break it, and
// it is the only way to be right in both the per-node layout and the one-tree-per-repository layout
// that follows it.
//
// Exit code is the number of rows it would change, so a pipeline can gate on drift without writing.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { isFile, read } from "../lib/source.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage"]);

/** The eight cells, in order. A table with these headings is a behaviour register, wherever it sits. */
const HEADINGS = ["id", "who", "does", "sees", "type", "tier", "status", "updated at"];

/** The three a run can produce, plus the two a person owns. */
const FROM_A_RUN = new Set(["SUCCESS", "FAILED", "PENDING"]);
const PERSONS_OWN = new Set(["PLANNED", "MANUAL"]);

type Result = { id: string; tier: string; status: string; title: string };
type Run = { env: string; tiers: string[]; ranAt: string; results: Result[]; from: string };

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try { entries = readdirSync(dir).sort(); } catch { return; }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Every run artifact under the root, refusing one that does not match its own shape.
 *
 * A malformed artifact is a NAMED finding rather than a skipped file. The toolchain writes this
 * shape by hand — it cannot import the contract — so the one thing that keeps the two together is
 * that a drift is reported the first time somebody applies a run.
 */
function artifacts(root: string): { runs: Run[]; findings: string[] } {
  const runs: Run[] = [];
  const findings: string[] = [];
  for (const file of walk(root)) {
    if (!file.endsWith("/spn-tests.json")) continue;
    const body = read(file);
    if (body === null) continue;
    let parsed: Partial<Run>;
    try { parsed = JSON.parse(body) as Partial<Run>; }
    catch { findings.push(`${relative(root, file)}: not parseable as JSON`); continue; }
    const where = relative(root, file);
    if (!Array.isArray(parsed.tiers) || parsed.tiers.length === 0) {
      findings.push(`${where}: names no tier, so it speaks for nothing`);
      continue;
    }
    if (!Array.isArray(parsed.results)) { findings.push(`${where}: carries no results list`); continue; }
    const bad = parsed.results.find((r) => !FROM_A_RUN.has(r?.status ?? ""));
    if (bad) {
      findings.push(
        `${where}: \`${bad.id ?? "a result"}\` carries status "${bad.status ?? ""}" — a run produces ` +
        `${[...FROM_A_RUN].join(" · ")}. PLANNED says nothing cites the id, which a result contradicts ` +
        `by existing, and MANUAL is a person's intent`
      );
      continue;
    }
    runs.push({ env: parsed.env ?? "", tiers: parsed.tiers, ranAt: parsed.ranAt ?? "",
                results: parsed.results, from: where });
  }
  return { runs: runs, findings: findings };
}

/** Where a row's cells are, if this line is a row of a behaviour table. */
const cellsOf = (line: string): string[] | null => {
  if (!line.trimStart().startsWith("|")) return null;
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = trimmed.split("|");
  return cells.length === HEADINGS.length ? cells : null;
};

const isHeader = (line: string): boolean => {
  const cells = cellsOf(line);
  return cells !== null && cells.every((cell, i) => cell.trim().toLowerCase() === HEADINGS[i]);
};

/** The worst of what a tier's results said about one id — a behaviour with a failing proof is not proven. */
const worst = (statuses: string[]): string =>
  statuses.includes("FAILED") ? "FAILED" : statuses.includes("PENDING") ? "PENDING" : "SUCCESS";

type Change = { file: string; line: number; id: string; from: string; to: string };

function apply(source: string, runs: Run[], reachIsRepository: boolean, file: string): { text: string; changes: Change[] } {
  const lines = source.split("\n");
  const changes: Change[] = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (isHeader(lines[i])) { inTable = true; continue; }
    const cells = cellsOf(lines[i]);
    if (!inTable) continue;
    if (cells === null) { inTable = false; continue; }
    if (cells.every((cell) => /^[\s:-]*$/.test(cell))) continue;   // the header's underline

    const id = cells[0].trim().replace(/`/g, "");
    const tier = cells[5].trim().toUpperCase();
    const was = cells[6].trim().toUpperCase();
    if (was === "MANUAL") continue;                                // a person's, never written over

    const speaking = runs.filter((run) => run.tiers.map((t) => t.toUpperCase()).includes(tier));
    if (speaking.length === 0) continue;                           // no run spoke for this tier

    const said = speaking.flatMap((run) => run.results.filter((r) => r.id === id));
    let status: string;
    let stamp: string;
    if (said.length > 0) {
      status = worst(said.map((r) => r.status.toUpperCase()));
      stamp = speaking.map((run) => run.ranAt).sort().slice(-1)[0] ?? "";
    } else if (reachIsRepository) {
      // Nothing cites it any more, and the caller said these artifacts were the whole tier. The row
      // goes back to what an author writes when a row is born, and loses its instant with it.
      status = "PLANNED";
      stamp = "";
    } else {
      continue;                                                    // silence is not evidence of absence
    }
    if (status === was && stamp === cells[7].trim()) continue;

    const width = (cell: string, value: string) => {
      const lead = cell.match(/^\s*/)?.[0] ?? " ";
      const tail = cell.match(/\s*$/)?.[0] ?? " ";
      return `${lead}${value}${tail}`;
    };
    cells[6] = width(cells[6], status);
    cells[7] = stamp === "" ? " " : width(cells[7], stamp);
    lines[i] = `|${cells.join("|")}|`;
    changes.push({ file: file, line: i + 1, id: id, from: was, to: status });
  }
  return { text: lines.join("\n"), changes: changes };
}

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const reachIsRepository = argv[argv.indexOf("--reach") + 1] === "repository" && argv.includes("--reach");
const root = resolve(argv.find((a) => !a.startsWith("--") && a !== "repository") ?? ".");

const { runs, findings } = artifacts(root);
for (const finding of findings) console.error(`✗ ${finding}`);
if (runs.length === 0) {
  console.log(findings.length ? "· no usable run artifact" : "· no run artifact — nothing has said what it proved");
  process.exit(findings.length);
}

const tiers = [...new Set(runs.flatMap((r) => r.tiers))].sort();
const changes: Change[] = [];
for (const file of walk(root)) {
  if (!file.endsWith(".md")) continue;
  const body = read(file);
  if (body === null || !body.includes("|")) continue;
  const outcome = apply(body, runs, reachIsRepository, relative(root, file));
  if (outcome.changes.length === 0) continue;
  changes.push(...outcome.changes);
  if (write && isFile(file)) writeFileSync(file, outcome.text, "utf8");
}

console.log(
  `${write ? "wrote" : "would change"} ${changes.length} row(s) from ${runs.length} artifact(s) ` +
  `speaking for ${tiers.join(" · ")}${reachIsRepository ? " across the repository" : ""}`
);
for (const change of changes) console.log(`  ${change.file}:${change.line}  ${change.id}  ${change.from} → ${change.to}`);
if (!reachIsRepository && changes.length > 0) {
  console.log(
    "\n· rows no artifact named were left alone. Pass `--reach repository` where these artifacts ARE " +
    "the whole of these tiers, and a row nothing cites goes back to PLANNED."
  );
}
process.exit(findings.length);
