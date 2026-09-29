#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/06-tests/README.md § A case title carries the id and the sentence
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The id check, soft: contract, component and journey cases with no behaviour id in their title or
// an enclosing `describe`, read from the test source.
//
//     spn-devex behaviours ids [root]
//
// Source, not run artifacts: an artifact lists only the cases that name an id. Exit code is always 0.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const describe = "contract, component and journey cases with no behaviour id — read from the test source";

/** A behaviour id: dotted upper-case segments ending in two digits, `IAM.LOGIN.01`. */
const ID = /\b[A-Z][A-Z0-9]+(?:\.[A-Z][A-Z0-9]+)+\.\d{2}\b/;
/** A `describe`, `it` or `test` call with a literal title, modifiers included (`test.serial(`, `it.each(…)(`). */
const CALL = /\b(describe|it|test)(?:\.(?:only|skip|each\([^)]*\)|serial|parallel|fixme|concurrent))?\s*\(\s*([`'"])((?:\\.|(?!\2)[^\\])*)\2/gs;
const SKIP = new Set(["node_modules", "dist", ".output", "coverage", ".nx", ".cache", "playwright-report", "test-results"]);
const SPEC = /\.(spec|test)\.(ts|tsx|mjs|js)$/;

export type BoundTier = "CONTRACT" | "COMPONENT" | "JOURNEY";
export type Case = { file: string; title: string; hasId: boolean };

/**
 * Every `it`/`test` in one file, with whether it carries an id — its own title, or an enclosing
 * `describe` that does. Enclosure is read by brace depth, which is what a `describe` block is.
 */
export function casesIn(text: string): { title: string; hasId: boolean }[] {
  const events = [...text.matchAll(CALL)].map((m) => ({ at: m.index ?? 0, kind: m[1], title: m[3] }));
  const out: { title: string; hasId: boolean }[] = [];
  let stack: { depth: number; hasId: boolean }[] = [];
  let depth = 0;
  let next = 0;
  for (let i = 0; i < text.length; i += 1) {
    while (next < events.length && events[next].at === i) {
      const { kind, title } = events[next];
      const inherited = stack.some((frame) => frame.depth <= depth && frame.hasId);
      const hasId = ID.test(title) || inherited;
      if (kind === "describe") stack.push({ depth: depth + 1, hasId });
      else out.push({ title, hasId });
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

/** The node a test file belongs to: `apps/<x>` or `packages/<x>`, else the repository root. */
function nodeOf(root: string, file: string): string {
  const parts = relative(root, file).split(sep);
  return parts[0] === "apps" || parts[0] === "packages" ? join(root, parts[0], parts[1]) : root;
}

/** Whether a node's kind owes the contract tier: an application server is proven through its entries. */
function owesContract(node: string): boolean {
  const manifest = join(node, "spkind.json");
  if (!existsSync(manifest)) return false;
  try { return JSON.parse(readFileSync(manifest, "utf8"))?.kind === "APP_SERVER"; } catch { return false; }
}

/** The tier that binds an id for this file, or null when it is a unit or plain integration case. */
export function boundTier(root: string, file: string): BoundTier | null {
  const parts = relative(root, file).split(sep);
  if (parts.includes("component")) return "COMPONENT";
  if (parts.includes("journeys")) return "JOURNEY";
  if (parts.includes("integration") && owesContract(nodeOf(root, file))) return "CONTRACT";
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

/** Every bound case in the repository, by tier. */
export function boundCases(root: string): Map<BoundTier, Case[]> {
  const found = new Map<BoundTier, Case[]>([["CONTRACT", []], ["COMPONENT", []], ["JOURNEY", []]]);
  for (const file of specFiles(root)) {
    const tier = boundTier(root, file);
    if (tier === null) continue;
    for (const one of casesIn(readFileSync(file, "utf8"))) found.get(tier)?.push({ file: relative(root, file), ...one });
  }
  return found;
}

export function run(args: string[]): number {
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  const found = boundCases(root);
  let missing = 0;
  for (const [tier, cases] of found) {
    const without = cases.filter((one) => !one.hasId);
    missing += without.length;
    const files = new Map<string, number>();
    for (const one of without) files.set(one.file, (files.get(one.file) ?? 0) + 1);
    for (const [file, count] of [...files].sort()) console.log(`! SOFT ${tier.toLowerCase()}  ${file}  ${count} case(s) with no id`);
  }
  const summary = [...found].map(([tier, cases]) => `${tier.toLowerCase()} ${cases.filter((c) => !c.hasId).length} of ${cases.length}`).join(" · ");
  console.log(`\n${missing} case(s) with no id — ${summary} (a contract, component or journey case carries its row's id; RD.DEVEX.FUNCTION.064)`);
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
