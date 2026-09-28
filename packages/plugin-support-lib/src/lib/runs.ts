// What a run left behind — every `spn-tests.json` under a repository, read one way by every tool
// here. It is what the runner did, so a case that was skipped, filtered out or never reached says
// so. A malformed artifact is a named finding, never a skipped file. This file lives once, in the
// shared support-lib folder; spn-devex and spn-apps each import it by relative path.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/** A file's text, or null. A file that cannot be read is never a finding. */
export function read(path: string): string | null {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

/** Folders nothing here descends into. `tests/.output/` is NOT among them: it is where a run writes. */
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage"]);

/** The three a run can produce. `PLANNED` and `MANUAL` belong to a person. */
export const FROM_A_RUN = new Set(["SUCCESS", "FAILED", "PENDING"]);

export type Result = { id: string; tier: string; status: string; title: string; detail?: string | null };

/** One run, with where it was found and the node that left it. */
export type Run = {
  env: string;
  tiers: string[];
  ranAt: string;
  results: Result[];
  /** The artifact, relative to the root it was read under. */
  from: string;
  /** The node that ran — the folder holding `tests/.output/<tier>/`, relative to the root, `.` for the root. */
  node: string;
};

/** Every file under a folder, sorted, never entering what `SKIP` names. */
export function* walk(dir: string): Generator<string> {
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

/** The node an artifact belongs to: `<node>/tests/.output/<tier>/spn-tests.json`. */
const nodeOf = (root: string, file: string): string =>
  relative(root, dirname(dirname(dirname(dirname(file))))).split("\\").join("/") || ".";

/**
 * One run artifact, or the finding that says why it cannot be read, or null where there is no file.
 *
 * A run naming no tier speaks for nothing. A result carrying `PLANNED` or `MANUAL` is refused: the
 * first says nothing cites the id, which a result contradicts by existing, and the second is a
 * person's intent.
 */
export function readArtifact(root: string, file: string): { run: Run } | { finding: string } | null {
  const body = read(file);
  if (body === null) return null;
  const where = relative(root, file).split("\\").join("/");
  let parsed: Partial<Run>;
  try { parsed = JSON.parse(body) as Partial<Run>; }
  catch { return { finding: `${where}: not parseable as JSON` }; }
  if (!Array.isArray(parsed.tiers) || parsed.tiers.length === 0) {
    return { finding: `${where}: names no tier, so it speaks for nothing` };
  }
  if (!Array.isArray(parsed.results)) return { finding: `${where}: carries no results list` };
  const bad = parsed.results.find((result) => !FROM_A_RUN.has(result?.status ?? ""));
  if (bad) {
    return {
      finding: `${where}: \`${bad.id ?? "a result"}\` carries status "${bad.status ?? ""}" — a run produces ` +
        `${[...FROM_A_RUN].join(" · ")}. PLANNED says nothing cites the id, which a result contradicts ` +
        `by existing, and MANUAL is a person's intent`,
    };
  }
  return {
    run: {
      env: parsed.env ?? "",
      tiers: parsed.tiers.map((tier) => String(tier).toUpperCase()),
      ranAt: parsed.ranAt ?? "",
      results: parsed.results.map((result) => ({ ...result, tier: String(result.tier).toUpperCase() })),
      from: where,
      node: nodeOf(root, file),
    },
  };
}

/** Where a node's run of one tier writes its artifact — the path the toolchain's runner writes to. */
export const artifactPath = (node: string, tier: string): string =>
  join(node, "tests", ".output", tier.toLowerCase(), "spn-tests.json");

/** Every run artifact under the root, with every malformed one named. */
export function artifacts(root: string): { runs: Run[]; findings: string[] } {
  const runs: Run[] = [];
  const findings: string[] = [];
  for (const file of walk(root)) {
    if (!file.endsWith("/spn-tests.json")) continue;
    const read = readArtifact(root, file);
    if (read === null) continue;
    if ("finding" in read) findings.push(read.finding);
    else runs.push(read.run);
  }
  return { runs: runs, findings: findings };
}

/** The worst of what results said about one id — a behaviour with a failing proof is not proven. */
export const worst = (statuses: string[]): string =>
  statuses.includes("FAILED") ? "FAILED" : statuses.includes("PENDING") ? "PENDING" : "SUCCESS";

/** The newest instant among some runs, as the artifacts carry it, or null. */
export const newest = (runs: Run[]): string | null => runs.map((run) => run.ranAt).sort().slice(-1)[0] ?? null;
