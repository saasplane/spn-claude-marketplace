// `corpus` — the only check in this plugin that asks a corpus question without being typed.
//
// EVERY CASE HERE RUNS AGAINST A KNOWN-BAD, never against a clean tree alone. `N38` step 5 says so
// for a reason this suite is itself an example of: the first cut of this check passed every clean-tree
// exercise and still had two defects that only a known-bad, run TWICE, could show.
//
//   F1  the verdict was dropped on a skip, so a broken corpus read as clean from the second turn on
//   F2  the checker's own bytes were not in the fingerprint, so fixing F1 left F1's verdict cached
//
// Both are the shape the arc exists over — a green light nobody earned — appearing inside the check
// written to end it. So the suite asserts the SECOND run as hard as the first.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const HOOKS = resolve(import.meta.dirname, "..");
const CHECK = resolve(HOOKS, "src", "scripts", "checks", "corpus.ts");
const BASE = resolve(import.meta.dirname, ".corpus-fixtures");

let failed = 0;
let count = 0;

function check(label, condition, detail = "") {
  count += 1;
  if (!condition) failed += 1;
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${condition || !detail ? "" : `\n        ${detail}`}`);
}

/** A throwaway workspace: a declared repo with a docs tree, and a decoy that declares nothing. */
function fixture(name, files = {}) {
  const root = join(BASE, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, ".spndevex"), { recursive: true });
  mkdirSync(join(root, "repo-a", "docs"), { recursive: true });
  // THE DECOY IS LOAD-BEARING. A folder holding `docs/` is not a member of the workspace; a folder
  // declaring `sprepo.json` is. Without this the check would happily walk anything.
  mkdirSync(join(root, "not-a-repo", "docs"), { recursive: true });
  writeFileSync(join(root, "repo-a", "sprepo.json"), `{ "world": "GENERAL", "name": "repo-a" }\n`, "utf8");
  writeFileSync(join(root, "not-a-repo", "docs", "loose.md"), `# not in a declared repo\n\nbody\n`, "utf8");
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body, "utf8");
  }
  return root;
}

/** Run the check as the hook runs it. Exit 1 means warnings; 0 means silence. */
function run(root) {
  try {
    const out = execFileSync(process.execPath, [CHECK, root], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { warned: false, out };
  } catch (error) {
    return { warned: true, out: String(error.stdout ?? "") };
  }
}

const BAD = `# A page carrying no spn:doc block\n\nThis page exists so a corpus check has something to refuse.\n`;

console.log("\n=== corpus — the trigger, against a known-bad corpus");

// ---- a clean corpus is silent, which is what makes a finding mean anything
{
  const root = fixture("clean");
  const first = run(root);
  check("a clean corpus is silent on the first run", !first.warned, first.out.slice(0, 300));
  const second = run(root);
  check("a clean corpus is silent on the second run too", !second.warned, second.out.slice(0, 300));
}

// ---- the known-bad, and the replay that F1 got wrong
{
  const root = fixture("known-bad", { "repo-a/docs/bad.md": BAD });
  const first = run(root);
  check("a known-bad page is reported", first.warned, first.out.slice(0, 300));
  check("the finding names the fault, not only the file",
    first.out.includes("no spn:doc block"), first.out.slice(0, 400));
  check("the finding names the file by a readable workspace-relative path",
    first.out.includes("repo-a/docs/bad.md") && !first.out.includes("../.."), first.out.slice(0, 400));

  // F1 — THIS IS THE CASE THAT MATTERS MOST IN THE SUITE.
  const second = run(root);
  check("[F1] an unchanged BROKEN corpus still reports, rather than going silent",
    second.warned, second.out.slice(0, 300));
  check("[F1] and it says it is a stored verdict rather than a fresh run",
    second.out.includes("stored verdict"), second.out.slice(0, 400));
}

// ---- the fingerprint wakes when a document changes, and when the checker changes
{
  const root = fixture("wakes");
  check("clean to begin with", !run(root).warned);
  writeFileSync(join(root, "repo-a", "docs", "bad.md"), BAD, "utf8");
  check("one new broken page wakes the next run", run(root).warned);
  rmSync(join(root, "repo-a", "docs", "bad.md"), { force: true });
  check("removing it makes the run silent again", !run(root).warned);
}

// ---- a folder that declares nothing is not a member
{
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

// ---- F3: the file `commands-ref` writes is an input, and it is not under any docs tree
{
  // A COMMANDS FINDING COULD BE REPORTED AND NEVER CLEARED, which is F1 seen from the other side.
  // `commands-ref` reads `refs/commands.md`, a release moved the CLI, the ref went stale and the
  // RULE appeared — and regenerating the ref changed no watched input, so every later turn replayed
  // the same finding over a file that was already correct. The CLI stat beside it cannot help: the
  // binary is exactly what it was when the finding was found.
  //
  // `fingerprint` is called directly here rather than through the check, because the path it reads
  // is relative to the TOOL directory — so a fixture proves it and the real `refs/` is left alone.
  const { fingerprint } = await import(CHECK);
  const root = fixture("commands-ref-input");
  const tools = join(BASE, "plug", "hooks", "tools");
  const refs = join(BASE, "plug", "refs");
  mkdirSync(tools, { recursive: true });
  mkdirSync(refs, { recursive: true });
  const trees = [join(root, "repo-a", "docs")];

  writeFileSync(join(refs, "commands.md"), "# commands\n\n52 of them.\n", "utf8");
  const before = fingerprint(root, trees, tools);
  writeFileSync(join(refs, "commands.md"), "# commands\n\n53 of them, which is one more.\n", "utf8");
  const after = fingerprint(root, trees, tools);

  check("[F3] regenerating the commands ref moves the fingerprint", before !== after,
    `both runs hashed to ${before.slice(0, 12)}`);

  // And the corpus itself is still what decides — a ref that did not move must not wake a run.
  check("[F3] a ref that did not move leaves the fingerprint where it was",
    fingerprint(root, trees, tools) === after);

  // An absent ref is a state rather than a crash: a plugin checkout without one still hashes.
  rmSync(join(refs, "commands.md"), { force: true });
  check("[F3] an absent ref hashes rather than throwing",
    typeof fingerprint(root, trees, tools) === "string");
}

rmSync(BASE, { recursive: true, force: true });
console.log(failed ? `  ${failed} FAILED` : `  all ${count} passed`);
process.exit(failed ? 1 : 0);
