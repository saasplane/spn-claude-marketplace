// What a run left behind: every run is named by its caller and writes
// `<node>/tests/.output/<tier>/runs/<run>.json`, or `<run>.<phase>.json` for a journey phase, and a
// reader is always told which run to read (the book's RD.DEVEX.UTILS.071). This file lives once, in
// the shared support-lib folder; spn-devex and spn-apps each import it by relative path.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

/** A file's text, or null. A file that cannot be read is never a finding. */
export function read(path: string): string | null {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

/** Folders nothing here descends into. `tests/.output/` is NOT among them: it is where a run writes. */
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage"]);

/** The three a run can produce. `PLANNED` and `MANUAL` belong to a person. */
export const FROM_A_RUN = new Set(["SUCCESS", "FAILED", "PENDING"]);

/**
 * What a run name may be: a plain file name, because it becomes one — a letter or digit first, then
 * letters, digits, dots, dashes and underscores. The toolchain's runner refuses any other name with
 * the same pattern, so every run file on disk carries a name this accepts.
 */
export const RUN_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

/** The folder a tier's run files sit in: `tests/.output/<tier>/runs/`. */
export const RUNS_FOLDER = "runs";

export type Result = { id: string; tier: string; status: string; title: string; detail?: string | null };

/** One run file, with where it was found and the node that left it. */
export type Run = {
  /** The run's name, as its caller gave it. */
  run: string;
  /** The tier this file speaks for, upper case. Rows at any other tier are never read from it. */
  tier: string;
  /** The journey phase it ran, upper case, or null for a tier with no phases. */
  phase: string | null;
  env: string;
  ranAt: string;
  results: Result[];
  /** The run file, relative to the root it was read under. */
  from: string;
  /** The node that ran — the folder holding `tests/.output/<tier>/runs/`, relative to the root, `.` for the root. */
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

/** A runner's raw report, `<run>.runner.json` or `.xml`, which belongs to a run still folding it. */
const RAW_REPORT = /\.runner\.(json|xml)$/;

/** Whether a path is a run file: `<node>/tests/.output/<tier>/runs/<name>.json`, never a raw report. */
export const isRunFile = (file: string): boolean => {
  if (!file.endsWith(".json") || RAW_REPORT.test(file)) return false;
  const runs = dirname(file);
  const output = dirname(dirname(runs));
  return basename(runs) === RUNS_FOLDER && basename(output) === ".output" && basename(dirname(output)) === "tests";
};

/** The node a run file belongs to: `<node>/tests/.output/<tier>/runs/<file>`. */
const nodeOf = (root: string, file: string): string =>
  relative(root, dirname(dirname(dirname(dirname(dirname(file)))))).split("\\").join("/") || ".";

/**
 * One run file, or the finding that says why it cannot be read, or null where there is no file.
 *
 * A run naming no tier speaks for nothing, and a file naming no run cannot be cited by a row. A result
 * carrying `PLANNED` or `MANUAL` is refused: the first says nothing cites the id, which a result
 * contradicts by existing, and the second is a person's intent.
 */
export function readRunFile(root: string, file: string): { run: Run } | { finding: string } | null {
  const body = read(file);
  if (body === null) return null;
  const where = relative(root, file).split("\\").join("/");
  let parsed: Partial<Omit<Run, "phase">> & { phase?: string | null };
  try { parsed = JSON.parse(body) as typeof parsed; }
  catch { return { finding: `${where}: not parseable as JSON` }; }
  if (typeof parsed.run !== "string" || !RUN_NAME.test(parsed.run)) {
    return { finding: `${where}: names no run, so no row can cite it` };
  }
  if (typeof parsed.tier !== "string" || parsed.tier === "") {
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
      run: parsed.run,
      tier: parsed.tier.toUpperCase(),
      phase: typeof parsed.phase === "string" && parsed.phase !== "" ? parsed.phase.toUpperCase() : null,
      env: parsed.env ?? "",
      ranAt: parsed.ranAt ?? "",
      results: parsed.results.map((result) => ({ ...result, tier: String(result.tier).toUpperCase() })),
      from: where,
      node: nodeOf(root, file),
    },
  };
}

/**
 * Whether a run file's name can belong to a run: `<run>.json`, or `<run>.<phase>.json`. A run name may
 * itself hold a dot, so the name alone never decides it — the file's own `run` field does.
 */
const mayBelongTo = (file: string, name: string): boolean => {
  const base = basename(file);
  return base === `${name}.json` || (base.startsWith(`${name}.`) && base.endsWith(".json"));
};

/**
 * Every file of one named run under the root: `<run>.json` and every `<run>.<phase>.json`, in every
 * node and every tier. A file whose name only looks like the run's — `full.2.json` beside a run named
 * `full` — is read and left out when its own `run` field names another run.
 */
export function namedRun(root: string, name: string): { runs: Run[]; findings: string[] } {
  const runs: Run[] = [];
  const findings: string[] = [];
  for (const file of walk(root)) {
    if (!isRunFile(file) || !mayBelongTo(file, name)) continue;
    const one = readRunFile(root, file);
    if (one === null) continue;
    if ("finding" in one) {
      // A malformed file is this run's when its name is the run's own, or the run's and a phase.
      const rest = basename(file).slice(name.length + 1, -".json".length);
      if (basename(file) === `${name}.json` || /^[a-z]+$/.test(rest)) findings.push(one.finding);
      continue;
    }
    if (one.run.run === name) runs.push(one.run);
  }
  return { runs: runs, findings: findings };
}

/**
 * The runs on disk under the root, newest first, each named once with the newest instant any of its
 * files carries. It answers *which run did you mean?* when a caller names none, or one that is not there.
 */
export function runNames(root: string): Array<{ run: string; ranAt: string }> {
  const newestOf = new Map<string, string>();
  for (const file of walk(root)) {
    if (!isRunFile(file)) continue;
    const one = readRunFile(root, file);
    if (one === null || "finding" in one) continue;
    const seen = newestOf.get(one.run.run);
    if (seen === undefined || one.run.ranAt > seen) newestOf.set(one.run.run, one.run.ranAt);
  }
  return [...newestOf.entries()]
    .map(([run, ranAt]) => ({ run: run, ranAt: ranAt }))
    .sort((left, right) => right.ranAt.localeCompare(left.ranAt) || left.run.localeCompare(right.run));
}

/** The separator between the instant and the run's name in a row's `Updated at`. */
export const CITES = " · ";

/** A row's `Updated at` as the stamp writes it: `2026-09-30T18:54:19Z · full-1001`. */
export const stampOf = (ranAt: string, run: string): string => `${ranAt}${CITES}${run}`;

/**
 * What a row's `Updated at` says: the instant, and the run it cites. An instant with no run after it
 * cites none, and a cell that holds neither reads as null.
 */
export function cited(updatedAt: string): { at: string; run: string | null } | null {
  const cell = updatedAt.trim();
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z)(?:\s*·\s*(\S+))?$/.exec(cell);
  if (match === null) return null;
  return { at: match[1], run: match[2] !== undefined && RUN_NAME.test(match[2]) ? match[2] : null };
}

/** The worst of what results said about one id — a behaviour with a failing proof is not proven. */
export const worst = (statuses: string[]): string =>
  statuses.includes("FAILED") ? "FAILED" : statuses.includes("PENDING") ? "PENDING" : "SUCCESS";

/** The newest instant among some runs, as the run files carry it, or null. */
export const newest = (runs: Run[]): string | null => runs.map((run) => run.ranAt).sort().slice(-1)[0] ?? null;
