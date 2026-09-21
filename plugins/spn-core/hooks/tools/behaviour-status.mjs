#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-foundation/02-docs/02-document.md — the behaviour row
// This file carries rules it does not own. That chapter is the source of truth. A rule change is
// edited there first, then here, in the same change.
//
// Write what the last run of the PLUGINS' OWN suites found into the marketplace's behaviour rows.
//
//     node behaviour-status.mjs [--write] --results <spn-tests.json> <repo>
//
// **Why this exists at all (Q107).** `spnutils` serves a GENERAL repository with its docs verbs
// only — it has no test runner for a repository that is not a stack — so the marketplace's rows
// have no agent to write them. The plugins' own runner is the thing that knows, so the plugins'
// own runner writes them. `spn-apps-ts` does the same job for a stack repository through
// `behaviour-rows.ts`, reading the same artifact shape.
//
// **Two cells are the agent's and the rest are a person's.** `Status` and `Updated at` are what the
// last run FOUND. Everything else is a decision somebody made, and this never touches it.
//
// **A run speaks for the tiers it ran.** A row whose `Tier` no result covered is left exactly as it
// was — otherwise a partial run would reset the register and the status would swing on each run.
//
// **`MANUAL` is never written over.** A behaviour a person checks by hand has no case and no run.
//
// **The header is read BY NAME, never by position or width.** The row grammar has grown twice — it
// was eight cells, the chapter now states nine with `Where`, and a built repository's row adds
// `Names` for ten. A parser pinned to a width sees a widened register as no register at all and
// reports a confident zero, which is the worst answer a checker can give.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage"]);
const FROM_A_RUN = new Set(["SUCCESS", "FAILED", "PENDING"]);

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir).sort(); } catch { return; }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    let stat; try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) yield* walk(full);
    else if (full.endsWith(".md")) yield full;
  }
}

const cellsOf = (line) => {
  const t = line.trim();
  if (!(t.startsWith("|") && t.endsWith("|") && t.length > 2)) return null;
  return t.slice(1, -1).split("|");
};

/** The column index of each cell this tool needs, or null if the line is not a register header. */
function headerOf(line) {
  const cells = cellsOf(line);
  if (cells === null) return null;
  const names = cells.map((c) => c.trim().toLowerCase());
  const at = (n) => names.indexOf(n);
  if (at("id") < 0 || at("status") < 0 || at("tier") < 0) return null;
  return { width: cells.length, id: at("id"), tier: at("tier"), status: at("status"), updated: at("updated at") };
}

const isUnderline = (cells) => cells.every((c) => /^[\s:-]*$/.test(c));

/** Keep a cell's own padding, so a rewritten table is a one-cell diff and not a reformat. */
function setCell(cells, i, value) {
  const was = cells[i];
  const lead = /^\s*/.exec(was)[0] || " ";
  const tail = /\s*$/.exec(was)[0] || " ";
  cells[i] = `${lead}${value}${tail}`;
}

const args = process.argv.slice(2);
const write = args.includes("--write");
const resultsAt = args[args.indexOf("--results") + 1];
const root = resolve(args.filter((a) => !a.startsWith("--") && a !== resultsAt).at(-1) ?? ".");
if (!args.includes("--results")) {
  console.error("usage: node behaviour-status.mjs [--write] --results <spn-tests.json> <repo>");
  process.exit(2);
}

const run = JSON.parse(readFileSync(resultsAt, "utf8"));
const byId = new Map();
for (const r of run.results ?? []) {
  // A row is green only when EVERY case carrying its id is green. One red among five is a red row.
  const prev = byId.get(r.id);
  if (prev === undefined || r.status === "FAILED" || (prev !== "FAILED" && r.status === "PENDING")) byId.set(r.id, r.status);
}
const tiers = new Set((run.tiers ?? []).map((t) => t.toUpperCase()));
const at = run.ranAt ?? new Date().toISOString();

let changed = 0;
for (const file of walk(join(root, "docs"))) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  let head = null;
  let touched = false;
  for (let i = 0; i < lines.length; i += 1) {
    const maybe = headerOf(lines[i]);
    if (maybe !== null) { head = maybe; continue; }
    const cells = cellsOf(lines[i]);
    if (cells === null) { head = null; continue; }
    if (head === null || cells.length !== head.width || isUnderline(cells)) continue;

    const id = cells[head.id].trim().replace(/[`*]/g, "");
    const was = cells[head.status].trim();
    if (was === "MANUAL") continue;
    const tier = cells[head.tier].trim().toUpperCase();
    if (tiers.size && !tiers.has(tier)) continue;
    const found = byId.get(id);
    // A row in a tier this run DID cover, with no result, was not reached by it.
    const next = found ?? (FROM_A_RUN.has(was) ? "PENDING" : was);
    if (next === was) continue;
    setCell(cells, head.status, next);
    if (head.updated >= 0) setCell(cells, head.updated, at);
    lines[i] = `|${cells.join("|")}|`;
    touched = true;
    changed += 1;
    console.log(`  ${was.padEnd(8)} -> ${next.padEnd(8)} ${id}  ${relative(root, file)}`);
  }
  if (touched && write) writeFileSync(file, lines.join("\n"), "utf8");
}

console.log(changed
  ? `\n  ${changed} row(s) ${write ? "written" : "would change — pass --write"}`
  : "\n  every row already says what the run found");
process.exit(changed);
