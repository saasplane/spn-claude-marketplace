// `spn-surface unit find <words…>` — the units a task's words point to, best first, so the agent can
// name a unit before it shows one.
//
//     spn-surface unit find <words…> [--json]
//
// `unit show` takes a unit's name, and an ask names a task, not a unit: "the step that asks for the
// handle the reset is for" names no `ForgotPasswordStep`. With nothing to give `unit show`, a window
// searched the source for the task's words and read the file it found. This command is that search,
// over what `unit show` reads and nothing else: the core units of the snapshot this plugin carries,
// and the components of the symbol index `unit show` finds — the repository's, or each member's from
// a workspace's root, or the one repository `--repo` names. A unit is matched by its name, split at
// each capital, and by its line or intent.
//
// A WORD MATCHES BY ITS FIRST FIVE LETTERS, so "verified" finds `Verification` and "upload" finds
// `Upload`, and a word of three letters or fewer is dropped, as it says nothing of a unit. A unit
// ranks by how many of the words it carries, then by whether its name carries them rather than its
// line, so the unit named for the task comes before a block that mentions it.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FLAG, UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { SNAPSHOT, type Snapshot, blockOf, componentsOf, indexFor, plain, root } from "./show.ts";

export const describe = "Name the units whose name or line carries a task's words, from the snapshot and the symbol index";
export const usage = "<words…> [--repo <name or path>] [--json]";

const LIMIT = 8;
const STEM = 5;
const SHORT = 3;

/** One unit a search can name: a core unit of the snapshot, or a component of the symbol index. */
type Candidate = { unit: string; line: string; core: boolean; package: string | null; repository: string | null; block: string | null; pattern: string | null };
type Hit = Candidate & { matched: number; score: number };

/** The words of a text or a name, a name split at each capital, lower-cased, the short ones dropped. */
const wordsOf = (text: string): string[] => text
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
  .toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > SHORT);

const stems = (text: string): Set<string> => new Set(wordsOf(text).map((word) => word.slice(0, STEM)));

/** Every unit a search can name: the snapshot's first, then each component of the index the snapshot does not hold. */
function candidates(repo: string | null): Candidate[] {
  const path = join(root(), SNAPSHOT);
  const snapshot = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Snapshot) : null;
  const core = new Set((snapshot?.units ?? []).map((unit) => unit.name));
  const found: Candidate[] = (snapshot?.units ?? []).map((unit) => ({
    unit: unit.name, line: plain((unit.line ?? "").replace(/\.$/, "")), core: true, package: null, repository: null, block: null, pattern: null,
  }));
  for (const [name, { symbol, pkg, repository }] of componentsOf(indexFor(repo, process.cwd()))) {
    if (core.has(name)) continue;
    found.push({ unit: name, line: plain((symbol.intent ?? "").replace(/\.$/, "")), core: false, package: pkg.name, repository, ...blockOf(name) });
  }
  return found;
}

/** The units the words point to, best first: by how many words each carries, then by its name carrying them. */
function search(words: Set<string>, units: Candidate[]): Hit[] {
  const hits: Hit[] = [];
  for (const unit of units) {
    const name = stems(unit.unit);
    const line = stems(unit.line);
    let matched = 0, score = 0;
    for (const word of words) {
      if (name.has(word)) { matched += 1; score += 2; } else if (line.has(word)) { matched += 1; score += 1; }
    }
    if (matched) hits.push({ ...unit, matched, score });
  }
  return hits.sort((a, b) => b.matched - a.matched || b.score - a.score || a.unit.localeCompare(b.unit)).slice(0, LIMIT);
}

/** Where a unit comes from, in a few words: the core, or its package and the member that holds it. */
function whereOf(hit: Hit): string {
  if (hit.core) return "the core";
  return hit.repository ? `${hit.package}, in ${hit.repository}` : `${hit.package}`;
}

export function run(args: string[]): number {
  const given = readWords(args, { json: FLAG, repo: VALUE });
  const words = stems(given.paths.join(" "));
  if (!words.size) throw new UsageFault("needs the words of a task, such as `forgot password`.");

  const hits = search(words, candidates(given.value("repo")));
  if (given.given("json")) {
    console.log(JSON.stringify({ words: [...words], units: hits }, null, 2));
    return hits.length ? 0 : 1;
  }
  if (!hits.length) {
    process.stderr.write(`unit find: no unit's name or line carries \`${given.paths.join(" ")}\` — try the task's other words\n`);
    return 1;
  }

  const width = Math.max(...hits.map((hit) => hit.unit.length));
  const out = ["the units these words point to, best first — run `spn-surface unit show <Unit>` on the one you place", ""];
  for (const hit of hits) {
    const block = hit.block ? ` · its cases are ${hit.block}'s` : hit.pattern ? ` · ${hit.pattern}` : "";
    out.push(`  ${hit.unit.padEnd(width)}  ${whereOf(hit)}${block}`);
    if (hit.line) out.push(`  ${"".padEnd(width)}  ${hit.line}`);
  }
  console.log(out.join("\n"));
  return 0;
}
