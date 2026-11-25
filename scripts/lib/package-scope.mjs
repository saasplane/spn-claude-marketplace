// Which package suites a test run must run, and which may reuse their last green run (041 N017, the developer: "like support
// releasing plugins should be faster based on chnages").
//
// A package's suite proves its INPUTS, so a package is read as a fingerprint of them: every file of its folder (its built `dist/`,
// its run output and the version field of its plugin manifest left out, since a release rewrites those and they follow the source),
// the root `scripts/`, `package.json` and the lockfile (which every package runs on), each book chapter one of its files restates
// (read from the `spn:restates` stamps, each source path read in the book beside the checkout), and the fingerprint of every other
// package it imports from. A suite that passes in a named run leaves a GREEN RECORD of that fingerprint and the results it proved;
// a later run whose fingerprint is the same reuses the record, results and all, instead of running the suite again. A red run
// leaves no record and takes away the one it had, so a red run is never reused. `--all` runs every suite.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Where a package's green record is kept: beside the run files, which the repository never tracks. */
export const greenFile = (root, label) => join(root, "tests", ".output", "unit", "green", `${label}.json`);

/** The packages that carry a runner, by folder name, sorted: what a full run covers. */
export function packagesOf(root) {
  const dir = join(root, "packages");
  return readdirSync(dir).filter((name) => existsSync(join(dir, name, "tests", "run.mjs"))).sort();
}

/** What every package runs on: the root scripts, the root manifest and the lockfile. */
const ROOT_INPUTS = ["scripts", "package.json", "pnpm-lock.yaml"];
/** What a release rewrites or a run leaves behind, and no suite's result depends on beyond its source. */
const LEFT_OUT = [/\/src\/dist\//, /\/tests\/\.output\//, /(^|\/)node_modules\//, /(^|\/)\.DS_Store$/];
/** A manifest's version field, blanked so that writing the release's version changes no fingerprint. */
const VERSION_FIELD = /("version"\s*:\s*")[^"]*(")/g;

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28 });

/** The files under a path that git tracks or would track (untracked but not ignored), each relative to the root. */
function filesUnder(root, path) {
  return git(root, ["ls-files", "-z", "-co", "--exclude-standard", "--", path]).split("\0").filter(Boolean)
    .filter((rel) => !LEFT_OUT.some((pattern) => pattern.test(rel)) && existsSync(join(root, rel)));
}

/** A hash over each file's path and bytes, in path order; a manifest's version field is blanked first. */
function hashFiles(base, rels, hash = createHash("sha1")) {
  for (const rel of [...rels].sort()) {
    let bytes = readFileSync(join(base, rel));
    if (/(^|\/)\.claude-plugin\/plugin\.json$/.test(rel)) bytes = Buffer.from(bytes.toString("utf8").replace(VERSION_FIELD, "$1$2"));
    hash.update(rel).update("\0").update(bytes).update("\0");
  }
  return hash;
}

/** Every file under a path on disk (a book chapter or a chapter's folder), relative to the base, or [] where it is absent. */
function filesOnDisk(base, path) {
  const at = join(base, path);
  if (!existsSync(at)) return [];
  if (statSync(at).isFile()) return [path];
  return readdirSync(at).filter((name) => !name.startsWith(".")).flatMap((name) => filesOnDisk(base, join(path, name)));
}

/** The book paths a package's files restate, read from their `spn:restates` stamps, each as its path from the workspace. */
export function restatedOf(root, label) {
  const out = new Set();
  for (const rel of filesUnder(root, join("packages", label)).filter((one) => one.endsWith(".md"))) {
    const block = /<!--\s*spn:restates\s*(\{[\s\S]*?\})\s*-->/.exec(readFileSync(join(root, rel), "utf8"));
    try { for (const doc of JSON.parse(block?.[1] ?? "{}").docs ?? []) if (typeof doc.path === "string") out.add(doc.path); } catch { /* the restates check names an unreadable block */ }
  }
  return [...out].sort();
}

/** The other packages a package imports from: a path in its source or tests that names another package's folder. */
export function importsOf(root, label, labels = packagesOf(root)) {
  const others = new Set(labels.filter((one) => one !== label));
  const found = new Set();
  for (const rel of filesUnder(root, join("packages", label)).filter((one) => /\.(m?[jt]s|tsx?)$/.test(one))) {
    for (const hit of readFileSync(join(root, rel), "utf8").matchAll(/\b(plugin-[a-z0-9-]+)\//g)) if (others.has(hit[1])) found.add(hit[1]);
  }
  return [...found].sort();
}

/**
 * The fingerprint of every package, by folder name: its own files, the root inputs, the book chapters it restates (read in the
 * folder that holds the checkout, where the workspace keeps `spn-foundation`), and the fingerprints of the packages it imports.
 */
export function fingerprints(root) {
  const labels = packagesOf(root);
  const shared = hashFiles(root, ROOT_INPUTS.flatMap((path) => filesUnder(root, path))).digest("hex");
  const own = new Map(labels.map((label) => {
    const hash = hashFiles(root, filesUnder(root, join("packages", label)));
    const book = dirname(root);
    hash.update("book\0");
    hashFiles(book, restatedOf(root, label).flatMap((path) => filesOnDisk(book, path)), hash);
    return [label, hash.digest("hex")];
  }));
  const imports = new Map(labels.map((label) => [label, importsOf(root, label, labels)]));
  const out = {};
  const of = (label) => {
    // Every package that `label` reaches, itself included, read once: two packages that import each other share one fingerprint.
    const reach = new Set([label]);
    const walk = (one) => { for (const next of imports.get(one) ?? []) if (!reach.has(next)) { reach.add(next); walk(next); } };
    walk(label);
    const hash = createHash("sha1").update(shared);
    for (const one of [...reach].sort()) hash.update(one).update(own.get(one) ?? "");
    return hash.digest("hex").slice(0, 16);
  };
  for (const label of labels) out[label] = of(label);
  return out;
}

/** A package's green record, or null where it has none or the record does not read. */
export function readGreen(root, label) {
  try { return JSON.parse(readFileSync(greenFile(root, label), "utf8")); } catch { return null; }
}

/** Keeps a green record: the fingerprint the suite passed on, the run it passed in, when, and the results it proved. */
export function writeGreen(root, label, record) {
  const file = greenFile(root, label);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ package: label, ...record }, null, 2)}\n`, "utf8");
}

/** Takes a package's green record away: a red run is never reused. */
export function dropGreen(root, label) { rmSync(greenFile(root, label), { force: true }); }

/**
 * Which packages run and which reuse a green record: a package reuses one only where the record's fingerprint is its fingerprint
 * now. `all` runs every package.
 */
export function planRun(root, { all = false } = {}) {
  const now = fingerprints(root);
  return packagesOf(root).map((label) => {
    const green = all ? null : readGreen(root, label);
    const reuse = green !== null && green.fingerprint === now[label] && Array.isArray(green.results);
    return { label, fingerprint: now[label], reuse, green: reuse ? green : null };
  });
}

/** The line the release commit carries for its test run: which suites ran, and which reused a green run and from which. */
export function suitesLine(summary) {
  if (!summary) return null;
  const ran = summary.ran?.length ? summary.ran.join(", ") : "none";
  const reused = summary.reused?.length ? summary.reused.map((one) => `${one.package} (from ${one.from ?? "an unnamed run"} at ${one.ranAt})`).join(", ") : "none";
  return `Suites ran: ${ran}. Reused: ${reused}.`;
}
