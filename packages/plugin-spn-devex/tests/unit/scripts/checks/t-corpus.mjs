import { PLUGIN } from "../../../helpers/harness.mjs";
// `corpus` — the only check in this plugin that asks a corpus question without being typed.
//
// EVERY CASE HERE RUNS AGAINST A KNOWN-BAD, never against a clean tree alone. `N38` step 5 says so
// for a reason this suite is itself an example of: the first cut of this check passed every clean-tree
// exercise and still had two defects that only a known-bad, run TWICE, could show.
//
//   F1  the verdict was dropped on a skip, so a broken corpus read as clean from the second turn on
//   F2  the checker's own bytes were not in the key, so fixing F1 left F1's verdict cached
//
// Both are the shape the arc exists over — a green light nobody earned — appearing inside the check
// written to end it. So the suite asserts the SECOND run as hard as the first.
//
// THE CHECK RUNS FROM A COPY OF THE PLUGIN, AND ITS STORE IS A TEMPORARY FOLDER. The copy is what lets
// a case change the checker's bytes without touching the real plugin, and the store override
// (`SPN_CORPUS_CACHE_FOR_TESTS`) keeps every verdict out of the real `~/.spnutils/cache/corpus/`.

import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const BASE = mkdtempSync(join(tmpdir(), "spn-corpus-"));
const STORE = join(BASE, "store");

// The plugin copy keeps the real relative layout, so the checks' relative imports of
// `plugin-support-lib` resolve inside the copy.
const COPY = join(BASE, "packages", "plugin-spn-devex", "src");
cpSync(resolve(PLUGIN, "src", "scripts"), join(COPY, "scripts"), { recursive: true });
cpSync(resolve(PLUGIN, "..", "plugin-support-lib", "src"), join(BASE, "packages", "plugin-support-lib", "src"), { recursive: true });
const CHECK = join(COPY, "scripts", "checks", "corpus.ts");
const CACHE_LIB = join(COPY, "scripts", "lib", "corpus-cache.ts");

const ENV = { ...process.env, SPN_TELEMETRY: "off", SPN_CORPUS_CACHE_FOR_TESTS: STORE };
// The cases that import the store in this process read the same override.
process.env.SPN_CORPUS_CACHE_FOR_TESTS = STORE;

let failed = 0;
let count = 0;

function check(label, condition, detail = "") {
  count += 1;
  if (!condition) failed += 1;
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${condition || !detail ? "" : `\n        ${detail}`}`);
}

/** A throwaway workspace: declared repos with docs trees, and a decoy that declares nothing. */
function fixture(name, files = {}, repos = ["repo-a"]) {
  const root = join(BASE, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  for (const repo of repos) {
    mkdirSync(join(root, repo, "docs"), { recursive: true });
    writeFileSync(join(root, repo, "sprepo.json"), `{ "world": "GENERAL", "name": "${repo}" }\n`, "utf8");
  }
  // THE DECOY IS LOAD-BEARING. A folder holding `docs/` is not a member of the workspace; a folder
  // declaring `sprepo.json` is. Without this the check would happily walk anything.
  mkdirSync(join(root, "not-a-repo", "docs"), { recursive: true });
  writeFileSync(join(root, "not-a-repo", "docs", "loose.md"), `# not in a declared repo\n\nbody\n`, "utf8");
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
}

/** What each subject did, read from the `subjects:` line the check prints first. */
function subjects(out) {
  const line = out.split("\n").find((l) => l.startsWith("subjects: ")) ?? "";
  return Object.fromEntries(line.slice("subjects: ".length).split(" · ").filter(Boolean).map((part) => {
    const at = part.lastIndexOf(" ");
    return [part.slice(0, at), part.slice(at + 1)];
  }));
}

/** Run the check as the hook runs it. Exit 1 means warnings; 0 means silence. */
function run(root) {
  try {
    const out = execFileSync(process.execPath, [CHECK, root], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: ENV });
    return { warned: false, out, subjects: subjects(out) };
  } catch (error) {
    const out = String(error.stdout ?? "");
    return { warned: true, out, subjects: subjects(out) };
  }
}

/** The same, launched without waiting, so several can run at once. */
function runAsync(root) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CHECK, root], { stdio: ["ignore", "pipe", "pipe"], env: ENV });
    let out = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.on("close", (code) => done({ warned: code === 1, out, subjects: subjects(out) }));
  });
}

/** Every file under a folder, as paths relative to it. */
function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true }).filter((rel) => statSync(join(dir, rel)).isFile());
}

const emptyStore = () => rmSync(STORE, { recursive: true, force: true });

const BAD = `# A page carrying no spn:doc block\n\nThis page exists so a corpus check has something to refuse.\n`;

console.log("\n=== corpus — the trigger, against a known-bad corpus");

// ---- a clean corpus is silent, which is what makes a finding mean anything
{
  emptyStore();
  const root = fixture("clean");
  const first = run(root);
  check("a clean corpus is silent on the first run", !first.warned, first.out.slice(0, 300));
  const second = run(root);
  check("a clean corpus is silent on the second run too", !second.warned, second.out.slice(0, 300));
}

// ---- the known-bad, and the replay that F1 got wrong
{
  emptyStore();
  const root = fixture("known-bad", { "repo-a/docs/bad.md": BAD });
  const first = run(root);
  check("a known-bad page is reported", first.warned, first.out.slice(0, 300));
  check("the finding names the fault, not only the file",
    first.out.includes("no spn:doc block"), first.out.slice(0, 400));
  check("the finding names the file by a readable workspace-relative path",
    first.out.includes("repo-a/docs/bad.md") && !first.out.includes("../.."), first.out.slice(0, 400));

  // F1 — THIS IS THE CASE THAT MATTERS MOST IN THE SUITE.
  const second = run(root);
  check("[F1] a finding is replayed on a second run with nothing changed, rather than going silent",
    second.warned && second.subjects["repo-a/docs"] === "replayed" && second.out.includes("no spn:doc block"),
    second.out.slice(0, 400));
  check("[F1] and it says it is a stored verdict rather than a fresh run",
    second.out.includes("stored verdict"), second.out.slice(0, 400));
}

// ---- the key wakes when a document changes, and a touch alone does not wake it
{
  emptyStore();
  const root = fixture("wakes");
  check("clean to begin with", !run(root).warned);
  writeFileSync(join(root, "repo-a", "docs", "bad.md"), BAD, "utf8");
  check("one new broken page wakes the next run", run(root).warned);
  rmSync(join(root, "repo-a", "docs", "bad.md"), { force: true });
  check("removing it makes the run silent again", !run(root).warned);
  const later = new Date(Date.now() + 60_000);
  utimesSync(join(root, "repo-a", "sprepo.json"), later, later);
  const touched = run(root);
  check("a touch that changes no byte replays rather than re-running", touched.subjects["repo-a/docs"] === "replayed",
    touched.out.slice(0, 300));
}

// ---- one tree changed re-runs that tree alone
{
  emptyStore();
  const root = fixture("per-tree", { "repo-a/docs/bad.md": BAD }, ["repo-a", "repo-b", "repo-c"]);
  const cold = run(root);
  check("a cold store runs every tree",
    ["repo-a/docs", "repo-b/docs", "repo-c/docs"].every((s) => cold.subjects[s] === "ran"), JSON.stringify(cold.subjects));
  writeFileSync(join(root, "repo-b", "docs", "bad.md"), BAD, "utf8");
  const after = run(root);
  check("one tree changed: only it re-runs, and the others replay",
    after.subjects["repo-b/docs"] === "ran" && after.subjects["repo-a/docs"] === "replayed" && after.subjects["repo-c/docs"] === "replayed",
    JSON.stringify(after.subjects));
  check("and the replayed tree's finding is still reported beside the new one",
    after.out.includes("repo-a/docs/bad.md") && after.out.includes("repo-b/docs/bad.md"), after.out.slice(0, 500));
}

// ---- the checker's own bytes are half of every key
{
  emptyStore();
  const root = fixture("checker", { "repo-a/docs/bad.md": BAD }, ["repo-a", "repo-b"]);
  run(root);
  check("warm before the checker changes", Object.values(run(root).subjects).every((s) => s === "replayed" || s === "skipped"));
  const tool = join(COPY, "scripts", "commands", "docs", "audit.ts");
  const before = readFileSync(tool, "utf8");
  appendFileSync(tool, "\n// a changed byte in a tool the check runs\n", "utf8");
  const changed = run(root);
  writeFileSync(tool, before, "utf8");
  check("[F2] a tool's bytes changed: every tree re-runs",
    changed.subjects["repo-a/docs"] === "ran" && changed.subjects["repo-b/docs"] === "ran", JSON.stringify(changed.subjects));
  const self = readFileSync(CHECK, "utf8");
  appendFileSync(CHECK, "\n// a changed byte in the check itself\n", "utf8");
  const own = run(root);
  writeFileSync(CHECK, self, "utf8");
  check("[F2] the check's own bytes changed: every tree re-runs",
    own.subjects["repo-a/docs"] === "ran" && own.subjects["repo-b/docs"] === "ran", JSON.stringify(own.subjects));
}

// ---- two runs at once on one tree: one computes and writes, every run reads the same verdict
{
  emptyStore();
  const root = fixture("parallel", { "repo-a/docs/bad.md": BAD });
  const results = await Promise.all([runAsync(root), runAsync(root), runAsync(root), runAsync(root)]);
  const sources = results.map((r) => r.subjects["repo-a/docs"]);
  check("four runs at once: exactly one computes the verdict", sources.filter((s) => s === "ran").length === 1,
    JSON.stringify(sources));
  check("and the others read it (waited or replayed), never computing their own",
    sources.filter((s) => s === "waited" || s === "replayed").length === 3, JSON.stringify(sources));
  const findingOf = (out) => out.split("\n").filter((l) => l.includes("bad.md")).join("\n");
  check("every run reports the same finding",
    results.every((r) => r.warned && findingOf(r.out) && findingOf(r.out) === findingOf(results[0].out)),
    results.map((r) => findingOf(r.out)).join(" | "));
  const left = filesUnder(STORE);
  check("the store holds one whole verdict, and no temporary or lock file",
    left.length === 1 && left[0].endsWith(".json") && JSON.parse(readFileSync(join(STORE, left[0]), "utf8")).findings.length === 1,
    JSON.stringify(left));
}

// ---- a verdict reaches its final name only by a rename, so no reader sees half of one
{
  emptyStore();
  const written = [];
  const renamed = [];
  const realWrite = fs.writeFileSync;
  const realRename = fs.renameSync;
  fs.writeFileSync = (path, ...rest) => { written.push(String(path)); return realWrite(path, ...rest); };
  fs.renameSync = (from, to) => { renamed.push(String(to)); return realRename(from, to); };
  syncBuiltinESMExports();
  try {
    const { writeVerdict } = await import(`${CACHE_LIB}?atomic`);
    writeVerdict({ schema: 1, key: "k1.c1", subject: "repo-a/docs", at: "now", findings: ["x"], ran: [] });
  } finally {
    fs.writeFileSync = realWrite;
    fs.renameSync = realRename;
    syncBuiltinESMExports();
  }
  const final = join(STORE, "k1.c1.json");
  check("a verdict is written to a temporary name and renamed onto its final one",
    written.length > 0 && written.every((p) => p.endsWith(".tmp")) && renamed.includes(final) && existsSync(final),
    `written ${JSON.stringify(written)} renamed ${JSON.stringify(renamed)}`);
}

// ---- anything in the store may be deleted at any time
{
  emptyStore();
  const root = fixture("deleted", { "repo-a/docs/bad.md": BAD });
  run(root);
  rmSync(STORE, { recursive: true, force: true });
  const again = run(root);
  check("a deleted store: the next run re-runs and still reports",
    again.subjects["repo-a/docs"] === "ran" && again.warned && again.out.includes("no spn:doc block"), again.out.slice(0, 300));
  check("and it writes the verdict again", filesUnder(STORE).filter((f) => f.endsWith(".json")).length === 1,
    JSON.stringify(filesUnder(STORE)));
  check("and the run after that replays it", run(root).subjects["repo-a/docs"] === "replayed");
}

// ---- nothing is written into the shared workstream folder
{
  emptyStore();
  const root = fixture("no-spndevex", { "repo-a/docs/bad.md": BAD });
  run(root);
  run(root);
  check("nothing is written under `.spndevex/`", filesUnder(join(root, ".spndevex")).length === 0,
    JSON.stringify(filesUnder(join(root, ".spndevex"))));
  check("and every verdict lives in the machine store", filesUnder(STORE).length > 0);
}

// ---- a tool that is not there is a failure, never a clean tree, and its verdict is not stored
{
  emptyStore();
  const root = fixture("missing-tool", { "repo-a/docs/bad.md": BAD });
  const tool = join(COPY, "scripts", "cli.ts");
  const kept = readFileSync(tool);
  rmSync(tool);
  const missing = run(root);
  writeFileSync(tool, kept);
  check("a missing tool warns that it could not run", missing.warned && missing.out.includes("could not run"),
    missing.out.slice(0, 300));
  check("and nothing is stored for the tree", missing.subjects["repo-a/docs"] === "unshared" && filesUnder(STORE).length === 0,
    `${JSON.stringify(missing.subjects)} ${JSON.stringify(filesUnder(STORE))}`);
}

// ---- a folder that declares nothing is not a member
{
  emptyStore();
  const root = fixture("decoy");
  const { warned, out } = run(root);
  check("a folder with docs/ but no sprepo.json is not walked",
    !warned && !out.includes("loose.md"), out.slice(0, 300));
}

// ---- a workspace with no docs tree at all is silence, never a crash
{
  const root = join(BASE, "bare");
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  const { warned, out } = run(root);
  check("a workspace carrying no docs tree is silent and does not crash", !warned, out.slice(0, 300));
}

rmSync(BASE, { recursive: true, force: true });
console.log(failed ? `  ${failed} FAILED` : `  all ${count} passed`);
process.exit(failed ? 1 : 0);
