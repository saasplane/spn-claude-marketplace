#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § A case title carries the id and the sentence
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The id check: contract, component and journey cases with no behaviour id in their title or an
// enclosing `describe`, read from the test source.
//
//     spn-devex behaviours ids [root]
//
// Source, not run artifacts: an artifact lists only the cases that name an id. A title built from a
// template literal in a file that writes an id literally, or imports the table that does, carries its
// id through data (Q363 A), and
// is reported on its own line. Exit code is 1 when any case has no id.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const describe = "contract, component and journey cases with no behaviour id — read from the test source";

/** A behaviour id: dotted upper-case segments ending in two digits, `IAM.LOGIN.01`. */
const ID = /\b[A-Z][A-Z0-9]+(?:\.[A-Z][A-Z0-9]+)+\.\d{2}\b/;
/** A `describe`, `it` or `test` call with a literal title, modifiers included (`test.serial(`, `it.each(…)(`). */
const CALL = /\b(describe|it|test)(?:\.(?:only|skip|each\([^)]*\)|serial|parallel|fixme|concurrent))?\s*\(\s*([`'"])((?:\\.|(?!\2)[^\\])*)\2/gs;
const SKIP = new Set(["node_modules", "dist", ".output", "coverage", ".nx", ".cache", "playwright-report", "test-results"]);
const SPEC = /\.(spec|test)\.(ts|tsx|mjs|js)$/;

export type BoundTier = "CONTRACT" | "COMPONENT" | "JOURNEY";
export type Case = { file: string; title: string; hasId: boolean; throughData: boolean };

/**
 * Every `it`/`test` in one file, with whether it carries an id — its own title, or an enclosing
 * `describe` that does. Enclosure is read by brace depth, which is what a `describe` block is.
 */
export function casesIn(text: string, tableWritesAnId = false): { title: string; hasId: boolean; throughData: boolean }[] {
  const events = [...text.matchAll(CALL)].map((m) => ({ at: m.index ?? 0, kind: m[1], title: m[3], quote: m[2] }));
  const out: { title: string; hasId: boolean; throughData: boolean }[] = [];
  // A title the runner builds from data carries its id when the file writes one for it to build from.
  const writesAnId = tableWritesAnId || ID.test(text);
  let stack: { depth: number; hasId: boolean }[] = [];
  let depth = 0;
  let next = 0;
  for (let i = 0; i < text.length; i += 1) {
    while (next < events.length && events[next].at === i) {
      const { kind, title, quote } = events[next];
      const inherited = stack.some((frame) => frame.depth <= depth && frame.hasId);
      const computed = quote === "`" && title.includes("${");
      const throughData = !ID.test(title) && !inherited && computed && writesAnId;
      const hasId = ID.test(title) || inherited || throughData;
      if (kind === "describe") stack.push({ depth: depth + 1, hasId });
      else out.push({ title, hasId, throughData });
      next += 1;
    }
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      stack = stack.filter((frame) => frame.depth <= depth);
    }
  }
  return out;
}

/**
 * The tier that binds an id for this file, or null when it is a unit or integration case.
 *
 * Every tier keeps a folder of its own: a `CLIENT_API`'s contract suite sits in `tests/contract/`,
 * and an `APP_SERVER`'s `tests/integration/` cases are integration cases, which bind no id.
 */
export function boundTier(root: string, file: string): BoundTier | null {
  const parts = relative(root, file).split(sep);
  if (parts[parts.indexOf("tests") + 1] === "contract") return "CONTRACT";
  if (parts.includes("component")) return "COMPONENT";
  if (parts.includes("journeys")) return "JOURNEY";
  return null;
}

function* specFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) yield* specFiles(join(dir, entry.name));
    } else if (SPEC.test(entry.name) && join(dir, entry.name).split(sep).includes("tests")) {
      yield join(dir, entry.name);
    }
  }
}

/** Whether a file this one imports by a relative path writes a behaviour id: the table a data-built title reads. */
function importsAnId(file: string): boolean {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    for (const ext of ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts"]) {
      const target = resolve(dirname(file), m[1] + ext);
      if (existsSync(target) && statSync(target).isFile() && ID.test(readFileSync(target, "utf8"))) return true;
    }
  }
  return false;
}

/** Every bound case in the repository, by tier. */
export function boundCases(root: string): Map<BoundTier, Case[]> {
  const found = new Map<BoundTier, Case[]>([["CONTRACT", []], ["COMPONENT", []], ["JOURNEY", []]]);
  for (const file of specFiles(root)) {
    const tier = boundTier(root, file);
    if (tier === null) continue;
    for (const one of casesIn(readFileSync(file, "utf8"), importsAnId(file))) found.get(tier)?.push({ file: relative(root, file), ...one });
  }
  return found;
}

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const found = boundCases(root);
  let missing = 0;
  let viaData = 0;
  for (const [tier, cases] of found) {
    const without = cases.filter((one) => !one.hasId);
    missing += without.length;
    viaData += cases.filter((one) => one.throughData).length;
    const files = new Map<string, number>();
    for (const one of without) files.set(one.file, (files.get(one.file) ?? 0) + 1);
    for (const [file, count] of [...files].sort()) console.log(`✗ ${tier.toLowerCase()}  ${file}  ${count} case(s) with no id`);
    const built = new Map<string, number>();
    for (const one of cases.filter((c) => c.throughData)) built.set(one.file, (built.get(one.file) ?? 0) + 1);
    for (const [file, count] of [...built].sort()) console.log(`· ${tier.toLowerCase()}  ${file}  ${count} case(s) whose id arrives through data — the run's result file is their proof`);
  }
  const summary = [...found].map(([tier, cases]) => `${tier.toLowerCase()} ${cases.filter((c) => !c.hasId).length} of ${cases.length}`).join(" · ");
  console.log(`\n${missing} case(s) with no id — ${summary}; ${viaData} through data (a contract, component or journey case carries its row's id; RD.DEVEX.FUNCTION.064)`);
  return missing ? 1 : 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
