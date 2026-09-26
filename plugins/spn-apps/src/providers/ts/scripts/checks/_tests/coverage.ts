#!/usr/bin/env node
// Three write-time warnings about proof: a route nothing exercises, a mutation nothing undoes, and
// a module test doubling a seam it does not own.
//
// **These are the conservative core of rules whose full model is not settled yet.** The coverage
// model belongs to its own arc; what is here is the part a check can make today without inventing
// one, and each is written so it tightens rather than gets replaced.
//
//   route-e2e      A route added with no case naming it. A route reaches production through the
//                  entry layer, and the only proof that its wiring works is a case that calls it.
//                  **Covered, for now, means the route's own path literal appears somewhere under a
//                  test tree in the same node.** That is a proxy for a real coverage model: it does
//                  not know a tier, it cannot tell an e2e case from a unit test, and it counts a
//                  mention in a comment. It under-reports on purpose. When the coverage model lands,
//                  this is the function to replace — the trigger and the message stay.
//
//   spec-restore   A spec that mutates shared state and carries no interrupt-safe restore. An
//                  un-restored mutation makes every later red lie, because the baseline moved and
//                  the next run is measuring a different world. **A trailing statement at the end of
//                  a test body is not a restore** — a failure above it skips it, and a failure above
//                  it is exactly when the mutation most needs undoing. So the check asks for an
//                  `afterEach`, an `afterAll` or a `finally`, which survive the throw.
//                  **What counts as a mutation is a named list**, grounded in what this estate's own
//                  suites do. It grows; it never becomes a guess.
//
//   foreign-double A module test doubling a seam its node does not own. A module ships no shell, so
//                  faking the generated client, the design system or a sibling module is faking the
//                  application around it — and the case then proves the fake rather than the
//                  product. The fix is a move, not a better fake.
//
// All three warn and none refuses. The rules behind them are still being written, and a gate that
// refuses on a definition nobody has agreed teaches people to work around it.
//
//   hook :  coverage.ts --check route-e2e --stdin
//           coverage.ts --check spec-restore --stdin
//           coverage.ts --check foreign-double --stdin
//   scan :  coverage.ts --check <name> <path> …      (any file or tree; prints what it can see)

import { basename, dirname, join, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../scripts/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../scripts/lib/payload.ts";
import { filesUnder, isDir, isFile, lineOf, read, resultingText, SKIP } from "../../../../../scripts/lib/source.ts";
import { readdirSync } from "node:fs";

const CODE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const TEST_DIRS = new Set(["tests", "test", "e2e", "__tests__", "spec"]);

// The entry layer declares a route with this decorator, and the path literal is its second
// argument. One shape, because one support package owns every controller in the stack.
const ROUTE = /@SPAPIRouteCommand\s*\(\s*["']([A-Z]+)["']\s*,\s*["']([^"']+)["']/g;

// A mutation, as this estate's own suites write one. Every member was read off a real spec.
const MUTATION: Array<[RegExp, string]> = [
  [/\bsetBooleanEnablement\s*\(/, "flips a shared enablement"],
  [/\bwriteOrgTypeEnablement\s*\(/, "writes org-type enablement"],
  [/\brequest\.(?:post|put|patch|delete)\b/i, "a mutating API call"],
  [/\.(?:post|put|patch|delete)\s*\(/i, "a mutating API call"],
  [/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i, "a mutating request"],
  [/\b(?:INSERT\s+INTO|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE)\b/i, "a write to the database"],
  [/\bUPDATE\s+\w+\s+SET\b/i, "a write to the database"],
];

// Constructs that run whatever happened above them. A trailing call at the end of a test body is
// not here, and that absence is the rule.
const RESTORE = /\b(?:afterEach|afterAll|onTestFinished|addCleanup)\s*\(|\bfinally\s*\{/;

// A double, as this stack writes one. The target is the first string argument.
const DOUBLE = /\b(?:vi|jest)\s*\.\s*(?:mock|doMock)\s*\(\s*["']([^"']+)["']/g;

// Anchored to the start of a line, because prose says `it (` too: the second live scan read a
// helper's own comment — "it (the seeded default)" — as a test declaration.
const DECLARES_TESTS = /^\s*(?:export\s+)?(?:test|it|describe)\s*[.(]/m;

export function repoRoot(path: string): string | null {
  let here = dirname(resolve(path));
  for (;;) {
    if (isFile(join(here, "sprepo.json"))) return here;
    const up = dirname(here);
    if (up === here) return null;
    here = up;
  }
}

/** Every test tree under a root, without descending into one that is already a test tree. */
export function testTrees(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (!isDir(full)) continue;
      if (SKIP.has(entry)) continue;
      if (TEST_DIRS.has(entry)) { out.push(full); continue; }   // found one — do not descend into it
      walk(full);
    }
  };
  walk(root);
  return out.sort();
}

const TEST_TEXT = new Map<string, string>();

/**
 * Every test file under a scope, read once.
 *
 * A controller declares many routes and a scan reads many controllers, so re-walking the suite per
 * route is the difference between a hook you notice and one you do not.
 */
export function testText(scope: string): string {
  const cached = TEST_TEXT.get(scope);
  if (cached !== undefined) return cached;
  const chunks: string[] = [];
  for (const tree of testTrees(scope)) {
    for (const file of filesUnder([tree])) {
      if (!CODE.some((extension) => file.endsWith(extension))) continue;
      const text = read(file);
      if (text !== null) chunks.push(text);
    }
  }
  const joined = chunks.join("\n");
  TEST_TEXT.set(scope, joined);
  return joined;
}

/** The node that owns this file — the nearest `spkind.json` above it, inside the repo. */
export function nodeRoot(path: string, root: string): string | null {
  let here = dirname(resolve(path));
  while (here.startsWith(root)) {
    if (isFile(join(here, "spkind.json"))) return here;
    const up = dirname(here);
    if (up === here) break;
    here = up;
  }
  return null;
}

/**
 * The application this file is deployed inside, or null for a published package.
 *
 * An app-owned module sits under its host, so the host is found by continuing up past the module's
 * own `spkind.json` to the outermost `APP_*` node still inside the repo.
 */
export function owningApp(path: string, root: string): string | null {
  let here = dirname(resolve(path));
  let found: string | null = null;
  while (here.startsWith(root)) {
    const text = read(join(here, "spkind.json"));
    if (text !== null) {
      try {
        const kind = (JSON.parse(text) as { kind?: string }).kind ?? "";
        if (kind.startsWith("APP_")) found = here;
      } catch { /* a manifest that will not parse names no kind */ }
    }
    const up = dirname(here);
    if (up === here) break;
    here = up;
  }
  return found;
}

/**
 * Where this route is proven, under the rule the coverage model settled.
 *
 * **An application owns the journeys of the surfaces it deploys** (RD.APPS.087, RD.APPS.088), so a
 * route is covered by a case in its OWN node's test tree. A case at the workspace root used to count
 * and no longer does: the workspace owns only what no single application can resolve, and one route
 * resolving is not that.
 *
 * Returns null when covered correctly, otherwise a phrase naming what is wrong. Covered elsewhere in
 * the repo is reported differently from covered nowhere, because the two need different fixes — a
 * move, or a new case.
 */
export function covered(root: string, route: string, path: string | null = null): string | null {
  // Only an application owns the proof of a route it deploys, so the question is which application.
  // An app-owned module ships inside its host and has no delivery of its own, so its host is the
  // answer and `owningApp` walks up to it. A published module has no host to find, and cannot know
  // which application composes it — there the repo is the honest scope. Judging a published module
  // against its own tree reported 399 findings that were all correct behaviour, which is a check
  // nobody reads twice.
  const app = path ? owningApp(path, root) : null;
  const scope = app ?? root;
  if (testText(scope).includes(route)) return null;
  if (app && testText(root).includes(route))
    return "is named only outside its own node — the application owns the journeys of the " +
      "surfaces it deploys, so move the case under this project's test tree";
  return "is named by no file under a test tree";
}

/**
 * A spec, and not a helper the specs call.
 *
 * The first live scan flagged `tests/helpers/enablement.ts` and `tests/helpers/sso.ts` — both mutate,
 * and neither is what must restore. **The spec that calls a helper owns the restore**,
 * because it is the one that knows when the mutation ends. So a file under a test tree qualifies
 * only when it declares cases of its own.
 */
export function isSpec(path: string, source: string): boolean {
  const base = basename(resolve(path));
  if (base.includes(".spec.") || base.includes(".test.")) return true;
  const normalized = resolve(path).split("\\").join("/");
  return [...TEST_DIRS].some((d) => normalized.includes(`/${d}/`)) && DECLARES_TESTS.test(source);
}

/** The declared kind of the node holding this file, from its own `spkind.json`. */
export function kindOf(path: string, root: string | null): string | null {
  const node = root ? nodeRoot(path, root) : null;
  if (!node) return null;
  const text = read(join(node, "spkind.json"));
  if (text === null) return null;
  try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
}

export function checkRouteE2e(path: string, source: string, added: string | null): string[] {
  const root = repoRoot(path);
  if (!root) return [];
  let onDisk = "";
  if (added !== null) onDisk = read(path) ?? "";   // a write — judge only what it adds
  const existing = new Set([...onDisk.matchAll(ROUTE)].map((match) => match[2]));
  const found: string[] = [];
  for (const match of source.matchAll(ROUTE)) {
    const [, method, route] = match;
    if (existing.has(route)) continue;             // already there — this write did not add it
    if (added !== null && !added.includes(route)) continue;
    const why = covered(root, route, path);
    if (why) found.push(`${method} ${route} — ${why}`);
  }
  return found;
}

export function checkSpecRestore(path: string, source: string, added: string | null): string[] {
  if (!isSpec(path, source)) return [];
  // Shared state is an application's problem and the workspace's. A module ships no shell, so it
  // stands nothing up and doubles only a seam it owns (RD.APPS.088) — there is no shared baseline
  // beneath it to leave moved. Asking a module spec for a restore reports a mutation that cannot
  // exist, and a finding that cannot be true is one a reader learns to ignore.
  const root = repoRoot(path);
  if ((kindOf(path, root) ?? "").startsWith("MODULE_")) return [];
  if (RESTORE.test(source)) return [];
  const found: string[] = [];
  const seen = new Set<number>();
  for (const [pattern, why] of MUTATION) {
    const match = pattern.exec(source);
    if (!match) continue;
    if (added !== null && !added.includes(match[0])) continue;
    const line = lineOf(source, match.index);
    if (seen.has(line)) continue;                  // one line, one finding: `request.post` is also `.post(`
    seen.add(line);
    found.push(`line ${line}: ${match[0].trim()} — ${why}`);
  }
  return found;
}

/**
 * A module test doubling a seam its node does not own.
 *
 * **A node may double a seam it owns, and nothing else** (RD.APPS.088).
 *
 * Only `@saasplane/*` targets are judged. A third-party module and a relative path are the node's
 * own business, and a relative path cannot reach outside the node anyway.
 */
export function checkForeignDouble(path: string, source: string, added: string | null): string[] {
  const root = repoRoot(path);
  if (!root || !isSpec(path, source)) return [];
  const kind = kindOf(path, root) ?? "";
  if (!kind.startsWith("MODULE_")) return [];
  const node = nodeRoot(path, root);
  const own = node ? basename(node) : "";
  const found: string[] = [];
  for (const match of source.matchAll(DOUBLE)) {
    const target = match[1];
    if (added !== null && !added.includes(target)) continue;
    if (!target.startsWith("@saasplane/")) continue;
    if (target.split("/").at(-1) === own) continue;   // its own package — a seam it owns
    found.push(`${target} — a ${kind} node does not own this seam`);
  }
  return found;
}

type Check = {
  run: (path: string, source: string, added: string | null) => string[];
  title: string;
  remedy: string;
};

export const CHECKS: Record<string, Check> = {
  "route-e2e": {
    run: checkRouteE2e,
    title: "A route with no case naming it",
    remedy: "Add a case that calls it before the route ships. A route nothing exercises is wiring " +
      "nobody has proven, and the first person to find out is a user. This check reads the route " +
      "path literally, so a journey that reaches the route through the UI does not count yet — if " +
      "that is what proves it, name the route in the case or in the behaviour row, and the proof " +
      "becomes findable.",
  },
  "spec-restore": {
    run: checkSpecRestore,
    title: "A spec that mutates shared state with no interrupt-safe restore",
    remedy: "Put the restore in an `afterEach`, an `afterAll` or a `finally`, so it runs when the " +
      "test above it throws. A trailing statement at the end of the body is skipped by exactly the " +
      "failure that makes the mutation matter — and an un-restored mutation makes every later red " +
      "lie, because the baseline moved.",
  },
  "foreign-double": {
    run: checkForeignDouble,
    title: "A module test doubling a seam its node does not own",
    remedy: "Move the case to the application that composes this module. A module ships no shell, " +
      "so a case that fakes the client, the design system or a sibling module is standing up an " +
      "application this node does not own — and it then proves the fake rather than the product. A " +
      "better fake does not fix it.",
  },
};

/** The verdict for one write under one named check, or null. Called alone and by the dispatcher. */
/**
 * The verdict for one write, given text that has ALREADY been parsed.
 *
 * **THE PARSE IS THE PROVIDER'S AND THE RULE IS THE DOMAIN'S.** The subject's validator reads the
 * resulting text once and hands it to every rule that applies.
 */
export function verdict(name: string, path: string, source: string | null, added: string | null): Verdict {
  const check = CHECKS[name];
  if (!check) return null;
  if (source === null) return null;
  let found: string[];
  try {
    found = check.run(path, source, added);
  } catch {
    return null;                     // a read this check cannot do allows
  }
  if (!found.length) return null;
  const message = `${check.title} — ${basename(path)}:\n` +
    found.map((item) => `  - ${item}`).join("\n") + `\n  ${check.remedy}`;
  return { note: message };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(name: string, input: ToolInput): Verdict {
  if (!CHECKS[name]) return null;
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  let added: string | null;
  try {
    [source, added] = resultingText(input, path);
  } catch {
    source = added = input.content ?? input.new_string ?? null;
  }
  return verdict(name, path, source, added);
}

/** Whether this subject's parser should bother reading the file at all. */
export function watched(path: string): boolean {
  if (!CODE.some((extension) => path.endsWith(extension))) return false;
  // A PLUGIN'S OWN HOOKS ARE EXEMPT, WHATEVER FOLDER THEY SIT IN. Naming the folders one by one
  // is how F14 happened: `checks/` was added and `scripts/` was not removed, and the incumbent
  // then refused the very port that replaced it. The rule is about `hooks/`.
  return !resolve(path).split("\\").join("/").includes("/hooks/");
}

export function scan(name: string, paths: string[]): number {
  const check = CHECKS[name];
  let total = 0;
  for (const target of filesUnder(paths)) {
    if (!CODE.some((extension) => target.endsWith(extension))) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of check.run(target, source, null)) {
      total += 1;
      console.log(`${target}: ${item}`);
    }
  }
  console.log(`\n${total} finding(s) — ${check.title}`);
  return total ? 1 : 0;
}

if (runAlone("coverage.ts")) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--check");
  const name = at === -1 ? "" : argv[at + 1] ?? "";
  if (!CHECKS[name]) {
    process.stderr.write(`usage: coverage.ts --check [${Object.keys(CHECKS).join(" | ")}] [--stdin | <path> …]\n`);
    process.exit(2);
  }
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(name, event.tool_input ?? {}) : null);
    process.exit(0);
  }
  const rest = argv.filter((a) => !a.startsWith("-") && a !== name);
  process.exit(scan(name, rest.length ? rest : ["."]));
}
