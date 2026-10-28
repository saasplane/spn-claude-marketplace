// RESTATES: RD.DEVEX.WORKSPACE.118, and `docs/04-capabilities/01-devex/04-workspace/04-docs/04-discipline.md` § Restatement discipline, which makes
// it a MUST in both directions.
//
// Do the plugins still say what the book says? All four `spn:restates` kinds at once — `restates
// docs`, `restates files`, `restates commands` and `restates decisions` each read one kind alone, so
// a drift names its owed act; this reads every kind, which is what a release gate needs.
//
// `coherence.ts` cannot take this question. Its contract is *run in any repo*, and all of its
// questions compare documents inside ONE repo. NO REPO HOLDS BOTH TREES — there is no book in the
// marketplace and no plugins in the foundation. So this crosses the boundary, and it is the only
// action here that does.
//
// A PARTNER NEVER RUNS THIS, AND THAT IS CORRECT. They hold the plugins and not the book. What the
// Foundation publishes is the corrected restatement, never the checker. You run it here, before you
// publish — so with no book to compare against it prints one line and exits clean, the property
// `plugin partner check` tests.
//
//     spn-devex restates check [<book>]
//
// AN ACTION OF ITS GROUP. Its one path is the book's folder; given none, it looks for a sibling
// checkout carrying the register. It exits 1 where it reports a finding.

import { lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { isDir, isFile } from "../../lib/payload.ts";
import { capabilitiesDir, decisionsRegister, docsOf } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { check, declaresASource, headerSources, nameIndex, namedSources, parse, resolveSource, undeclared } from "../../lib/restates.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);

/**
 * The real folder holding every plugin's files, under one candidate repository root — `packages/`,
 * each entry a `plugin-<name>/` folder.
 *
 * Returns null where the candidate holds none — the test this function's callers use to decide
 * whether they have found the marketplace or have to look further.
 */
function pluginsFolder(candidate: string): string | null {
  const packages = join(candidate, "packages");
  return isDir(packages) && readdirSync(packages).some((e) => e.startsWith("plugin-") && isDir(join(packages, e)))
    ? packages : null;
}

/**
 * Where the marketplace repository actually is, whether `root` is that repository itself or the
 * WORKSPACE it sits in — the same two shapes `pluginDocuments` below already has to answer for.
 *
 * A CALLER THAT KEEPS RE-GUESSING GETS A DIFFERENT ANSWER FROM A DIFFERENT DIRECTORY. `strayStamps`
 * used to build its own "is this inside the plugins" prefix from `root` directly, which is the
 * marketplace only when the tool happens to be run from inside it — run from the workspace instead,
 * `root` names the workspace, no file could ever start with that prefix, and every real plugin
 * document was misread as sitting outside one. Resolving it once, the same way document discovery
 * already does, is what makes the two directories agree.
 */
export function marketplaceOf(root: string): string | null {
  if (pluginsFolder(root)) return root;
  let siblings: string[];
  try { siblings = readdirSync(root).sort(); } catch { return null; }
  for (const entry of siblings) {
    if (SKIP.has(entry)) continue;
    const sibling = join(root, entry);
    try { if (!statSync(sibling).isDirectory()) continue; } catch { continue; }
    if (pluginsFolder(sibling)) return sibling;
  }
  return null;
}

/** Every markdown file under the plugins, sorted, relative to where the tool was run. */
export function pluginDocuments(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) walk(full); }
      else if (entry.endsWith(".md")) out.push(full);
    }
  };
  const here = pluginsFolder(root);
  if (here) walk(here);
  if (out.length) return out.sort();
  // A WORKSPACE IS NOT A REPOSITORY, AND THIS IS RUN FROM THE WORKSPACE. The plugins exist in the
  // marketplace checkout and nowhere else, so run from the folder the sibling checkouts sit in —
  // which is where every other tool here is run from — this found nothing, printed "no plugins
  // here" and RETURNED 0. A record then carried `restate-drift 0` that had compared nothing at all.
  // So a root holding no plugins of its own looks one level down for the sibling that has some.
  let siblings: string[];
  try { siblings = readdirSync(root).sort(); } catch { return []; }
  for (const entry of siblings) {
    if (SKIP.has(entry)) continue;
    const sibling = join(root, entry);
    try { if (!statSync(sibling).isDirectory()) continue; } catch { continue; }
    const found = pluginsFolder(sibling);
    if (found) walk(found);
    if (out.length) return out.sort();
  }
  return out.sort();
}

/** Every source file under the plugins whose comments could carry a `RESTATES:` header. */
function pluginSources(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) walk(full); }
      else if (/\.(ts|mjs|py)$/.test(entry)) out.push(full);
    }
  };
  const here = pluginsFolder(root);
  if (here) walk(here);
  if (out.length) return out.sort();
  // The same blindness as `pluginDocuments` above, and the same fix. Run from the workspace this
  // found no sources and the summary read `0 broken header(s)` having opened none of them.
  let siblings: string[];
  try { siblings = readdirSync(root).sort(); } catch { return []; }
  for (const entry of siblings) {
    if (SKIP.has(entry)) continue;
    const sibling = join(root, entry);
    try { if (!statSync(sibling).isDirectory()) continue; } catch { continue; }
    const found = pluginsFolder(sibling);
    if (found) walk(found);
    if (out.length) return out.sort();
  }
  return out.sort();
}

/**
 * Headers whose named source resolves nowhere on disk.
 *
 * A HEADER IS A CLAIM ABOUT ANOTHER FILE, and a claim naming a path that does not exist is worse
 * than no claim: a reader follows it, finds nothing, and cannot tell a moved chapter from a typo.
 */
function headerFindings(root: string, book: string): string[] {
  const out: string[] = [];
  // ONE INDEX FOR THE WHOLE WORKSPACE, built once and only because a bare name needs it. The CLI
  // that owns a rule is a different repository from the plugins restating it, so `contract-purity.ts`
  // is a true claim about a file two repositories away.
  const workspace = dirname(root);
  let index: Map<string, string[]> | null = null;
  const byName = (name: string): string[] => {
    index ??= nameIndex(workspace, SKIP);
    return index.get(name) ?? [];
  };
  const marketRoot = marketplaceOf(root) ?? root;
  const foundPlugins = pluginsFolder(marketRoot);
  for (const path of pluginSources(root)) {
    // A SOURCE FILE IS FOUND UNDER `packages/plugin-<name>/`, where a plugin's files live.
    const plugin = /(.*\/packages\/plugin-[^/]+)\//.exec(path)?.[1] ?? root;
    let carried = "";
    for (const header of headerSources(readFileSync(path, "utf8"))) {
      for (const token of header.cited) {
        const where = resolveSource(token, [
          carried, book, docsOf(book), capabilitiesDir(docsOf(book)),
          // `dirname(plugin)` is the plugins root the file was actually found under, and it is
          // what makes the answer the same from the workspace as from the marketplace.
          root, foundPlugins ?? marketRoot, dirname(plugin), plugin, dirname(path),
        ]);
        if (where !== null) { carried = dirname(where); continue; }
        const at = token.includes("/") ? [] : byName(token);
        if (at.length) continue;
        // A PATH THAT IS WRONG IS TOLD WHERE THE FILE WENT, because the fix is the rename and a
        // finding that names it costs the reader nothing to act on.
        const moved = token.includes("/") ? byName(token.split("/").pop() as string) : [];
        const hint = moved.length === 1 ? ` — that name is at \`${relative(workspace, moved[0])}\`` : "";
        out.push(`${relative(root, path)}:${header.line}: names \`${token}\`, which resolves to no file${hint}`);
      }
    }
  }
  return out;
}

/** The book's location, or null. An explicit path wins and is never second-guessed. */
export function findBook(argument: string | undefined, root: string): string | null {
  if (argument) {
    const given = resolve(argument);
    return isFile(decisionsRegister(docsOf(given))) ? given : null;
  }
  // A sibling checkout, which only a producer workspace has. Named by what it CARRIES rather than by
  // what it is called, so a differently-named checkout still answers.
  const here = resolve(root);
  const parent = dirname(here);
  let siblings: string[];
  try { siblings = readdirSync(parent).sort(); } catch { return null; }
  for (const name of siblings) {
    const sibling = join(parent, name);
    // A SIBLING, WHICH IS NEVER THE REPOSITORY BEING CHECKED. The test is *carries a decisions
    // register and a concept*, and the marketplace earned both the day it was documented as a
    // GENERAL repository — so the check compared the plugins against their own repository's docs
    // and reported 77 drifts that were not drift at all. A repository cannot be the book it
    // restates.
    if (resolve(sibling) === here) continue;
    if (isFile(decisionsRegister(docsOf(sibling))) && isFile(join(sibling, "CONCEPT.md")))
      return sibling;
  }
  return null;
}

/**
 * A `spn:restates` header anywhere but a marketplace plugin, and any citation pointing at the
 * plugin's own repository (`RD.DEVEX.AGENT.073`).
 *
 * `marketplaceRoot` IS THE MARKETPLACE REPOSITORY ITSELF, and every real plugin file sits under
 * `packages/plugin-<name>/` beneath it — the prefix `insideAPlugin` below tests against. Found
 * running this command for real, not by a case: a wrong prefix here read every real ref, skill and
 * agent brief in this very plugin as a stray stamp, over a hundred false findings from one run.
 */
function strayStamps(workspace: string, marketplaceRoot: string): string[] {
  const out: string[] = [];
  const packages = join(marketplaceRoot, "packages");
  // Only a real `packages/plugin-<name>/` folder counts as "inside a plugin"; `packages/` itself,
  // and a non-plugin entry beside it such as `plugin-support-lib/`, are still walked.
  const insideAPlugin = (full: string): boolean => {
    if (!full.startsWith(`${packages}/`)) return false;
    return full.slice(packages.length + 1).split("/")[0].startsWith("plugin-");
  };
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".git" || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      // A SYMBOLIC LINK IS NEVER WALKED. Its target is real content sitting at its own real path,
      // walked from there; entering it a second time through a link would visit the same files
      // twice, once correctly and once under whatever name the link happens to carry.
      let stat;
      try { stat = lstatSync(full); } catch { continue; }
      if (stat.isSymbolicLink()) continue;
      if (isDir(full)) { if (!insideAPlugin(full)) walk(full); continue; }
      if (!/\.(md|html)$/.test(entry)) continue;
      let fence = false;
      let pre = false;
      let line = 0;
      for (const text of readFileSync(full, "utf8").split("\n")) {
        line += 1;
        if (text.trim().startsWith("```")) { fence = !fence; continue; }
        if (text.includes("<pre")) pre = true;
        if (text.includes("</pre>")) { pre = false; continue; }
        if (!fence && !pre && /^[ \t]*<!-- spn:restates/.test(text))
          out.push(`${relative(workspace, full)}:${line}: a spn:restates header outside the plugins — ` +
            `a restatement measures the distance between two repositories, and this one has none`);
      }
    }
  };
  for (const repo of readdirSync(workspace)) {
    const full = join(workspace, repo);
    if (repo.startsWith(".") || !isDir(full)) continue;
    walk(full);
  }
  return out;
}

/**
 * A citation naming the repository the citing file already lives in.
 *
 * THE OWNER IS THE REPOSITORY, NOT THE PATH'S FIRST SEGMENT. A document's shown path is relative to
 * its own repository, so it begins `plugins/…` — while a citation begins with a repository name.
 */
function selfCitations(owner: string, shownPath: string, block: { docs?: { path?: string }[]; files?: { path?: string }[] }): string[] {
  const cited = [...(block.docs ?? []), ...(block.files ?? [])];
  return cited
    .map((c) => c.path ?? "")
    .filter((p) => p && p.split("/")[0] === owner)
    .map((p) => `${shownPath}: cites \`${p}\` in its own repository — a restatement cites another repository, never itself`);
}

export function main(argv: string[], root: string): number {
  const documents = pluginDocuments(root);
  const shown = (path: string) => relative(root, path);
  if (!documents.length) {
    console.log("no plugins here — nothing restates the book in this repo");
    return 0;
  }

  const book = findBook(argv.find((a) => !a.startsWith("-")), root);
  if (book === null) {
    console.log(`${documents.length} plugin document(s) · no foundation book to compare against — quiet`);
    console.log("  A partner holds the plugins and not the book, so this check is a builder's gate.");
    console.log("  Pass the book's path to run it: restates check path/to/spn-foundation");
    return 0;
  }

  const findings: string[] = [];
  const omissions: string[] = [];
  const unstamped: string[] = [];
  const unclassified = new Set<string>();
  let stamped = 0;

  for (const path of documents) {
    const [block, broken] = parse(path);
    if (broken) { findings.push(`${shown(path)}: ${broken}`); continue; }
    if (block === null) {
      if (declaresASource(path)) unstamped.push(path);
      continue;
    }
    stamped += 1;
    // A citation names its repository, so it resolves from the WORKSPACE — the folder the
    // sibling checkouts sit in, which is the book's parent (RD.DEVEX.AGENT.072).
    findings.push(...check(shown(path), dirname(book), block));
    omissions.push(...undeclared(path, block)
      .map((name) => `${shown(path)}: restates \`${name}\` and does not declare it`));
    for (const name of namedSources(path)[2]) unclassified.add(name);
  }

  for (const finding of findings) console.log(`DRIFT       ${finding}`);
  if (omissions.length) {
    console.log();
    console.log(`UNDECLARED  ${omissions.length} source(s) a block leaves out. The file restates them`);
    console.log("            and nothing watches them, so a moved chapter reaches nobody:");
    for (const omission of omissions) console.log(`              ${omission}`);
  }
  if (unstamped.length) {
    console.log();
    console.log(`UNSTAMPED   ${unstamped.length} file(s) say what they restate in prose and carry no block.`);
    console.log("            The sentence is not machine-readable, so no run can name them when a chapter moves:");
    for (const path of unstamped.slice(0, 10)) console.log(`              ${shown(path)}`);
    if (unstamped.length > 10) console.log(`              … and ${unstamped.length - 10} more`);
  }
  if (unclassified.size) {
    console.log();
    console.log(`UNREAD      ${unclassified.size} name(s) in a declaration that no rule here can`);
    console.log("            resolve to a document, so nothing compares them. This check");
    console.log("            under-reports by exactly this much, and says so rather than hiding it:");
    console.log("              " + [...unclassified].sort().slice(0, 12).join(" · "));
  }

  // THE CODE'S OWN HEADERS, which no run had ever read. Reported apart from a document's drift,
  // because a broken header is a claim pointing at nothing rather than a chapter that moved.
  const strays = strayStamps(dirname(book), marketplaceOf(root) ?? root);
  const selves = documents.flatMap((path) => {
    const [block] = parse(path);
    return block ? selfCitations(basename(root), shown(path), block as never) : [];
  });
  if (strays.length || selves.length) {
    console.log();
    console.log(`PLACEMENT   ${strays.length + selves.length} stamp(s) break RD.DEVEX.AGENT.073 — a stamp lives only in a`);
    console.log("            marketplace plugin, and cites only another repository:");
    for (const finding of [...strays, ...selves]) console.log(`              ${finding}`);
  }

  const headers = headerFindings(root, book);
  if (headers.length) {
    console.log();
    console.log(`HEADER      ${headers.length} \`// RESTATES:\` header(s) in code name a file that is not there.`);
    console.log("            A reader follows the claim, finds nothing, and cannot tell a moved");
    console.log("            chapter from a typo:");
    for (const finding of headers) console.log(`              ${finding}`);
  }

  console.log();
  console.log(`${documents.length} plugin document(s) · ${stamped} carrying spn:restates · ` +
    `${findings.length} drift · ${omissions.length} undeclared · ${unstamped.length} unstamped · ` +
    `${unclassified.size} unread name(s) · ${headers.length} broken header(s) · ` +
    `${strays.length + selves.length} misplaced (SOFT) — book at ${book}`);
  return findings.length + omissions.length + headers.length + strays.length + selves.length;
}

export const describe = "all four spn:restates kinds at once, plugins against the book — the release gate";
export const usage = "[<book>]";

export function run(args: string[]): number {
  const { paths } = readWords(args);
  if (paths.length > 1) throw new UsageFault("takes one book.");
  return main(paths, process.cwd()) > 0 ? 1 : 0;
}
