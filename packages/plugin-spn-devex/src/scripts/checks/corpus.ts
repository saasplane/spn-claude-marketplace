#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/03-tree.md § The tree
//           docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The arc
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// THE CORPUS CHECK, AND THE ONLY THING IN THIS PLUGIN THAT ASKS A CORPUS QUESTION WITHOUT BEING TYPED.
//
// Every check under `checks/` reads the FRAGMENT being written, and a fragment cannot show that a
// page now names a folder deleted last week, that a produced page stopped matching its seat, or that
// a tree stopped matching its concept. Those are corpus questions, and until this file existed the
// only time anybody asked one was when a person typed the command. `N38` measured what that cost:
// every defect found on 2026-09-23 had been sitting in a corpus reporting itself green, and not one
// was found by a run.
//
// `Q183` decided this rides the `Stop` hook. TWO THINGS ABOUT THAT DECISION ARE LOAD-BEARING:
//
//   1. `Stop` FIRES ONCE PER TURN, NOT ONCE PER SITTING. The card said otherwise and the card was
//      wrong. Six seconds of corpus walking on every reply is the kind of cost somebody turns off in
//      a week, so EACH DOCS TREE'S VERDICT IS CACHED, keyed by the tree's content and the checker's
//      own bytes, in the machine store (`lib/corpus-cache.ts`). A turn that changed no document
//      re-runs nothing; a turn that changed one tree re-runs that tree alone. Hashing the trees is
//      the whole cost of a turn that changed nothing, which is most turns.
//
//   2. ONLY THE TOOLS THAT ARE AT ZERO ARE WIRED. A gate that is red from the day it ships is one
//      nobody reads — which is this corpus's own argument about SOFT grading, arriving as a design
//      constraint. A tool joins `WIRED` on the day it is silent on a clean corpus, and
//      `REPORTED_ELSEWHERE` below says which are still outside rather than leaving a reader to
//      infer that the set is complete.
//
//      NO ENTRY NAMES A COUNT. A number written into a message is a measurement taken once and
//      then repeated forever: `restate-drift` was described here as reporting 32, and it reports
//      none today. The reason a tool is outside has to be the SHAPE of what it reports, because
//      that is the part that stays true until somebody changes the tool.
//
// AND THE SCOPE IS THE DOCS TREE, NEVER THE REPOSITORY ROOT. `audit` given a folder means *every
// document under it*, so a root pulls in every package `README.md` and `CLAUDE.md` — none of which
// carries an `spn:doc` block, all of which are RULE. Measured over the seven: 954 findings at the
// root against 25 at the docs trees, and the tool reports both in the same voice. A wrong argument
// that looks like a corpus collapse is the defect this whole arc is about, so the scope is computed
// here and never taken from a caller.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { type Computed, hashFile, hashFiles, prune, type Source, verdictFor } from "../lib/corpus-cache.ts";
import { bookTemplatesDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

export type Warning = { check: string; message: string };

/** The docs commands that are silent on a clean corpus today, so a finding from one means something. */
const WIRED = [
  { args: (tree: string) => ["docs", "audit", tree], label: "audit" },
  { args: (tree: string) => ["docs", "face", "--check", dirname(tree)], label: "face --check" },
  { args: (tree: string) => ["docs", "topics", dirname(tree)], label: "topics" },
  { args: (tree: string) => ["docs", "coverage", dirname(tree)], label: "coverage" },
];

/**
 * The corpus tools deliberately NOT wired, and the count each reports on a clean corpus.
 *
 * THIS LIST IS THE HONEST HALF OF THE RUN. `N38` step 4 requires that a run say which tools it ran
 * rather than implying it ran them all, and the failure this arc exists to stop is a green light
 * nobody earned. A silent corpus check that quietly covers four of six tools would be exactly that.
 */
const REPORTED_ELSEWHERE = [
  { label: "coherence", why: "most of what it reports is a cardinality heuristic that cannot tell a closed set from one that can grow, so it is read rather than gated on" },
  { label: "restate-drift", why: "a drift is a question — does this restatement still hold — and the only answer is reading the diff, which a hook cannot do for you" },
  { label: "figures check", why: "joins once it has run clean across all seven trees on a day nothing was redrawn" },
];

// THE RUN'S OWN BUDGET, BECAUSE THE HOOK'S TIMEOUT IS NOT A SAFE ONE TO RELY ON. A `Stop` hook that
// is cut off mid-run has done a PARTIAL corpus read and says nothing about it, which is a green light
// nobody earned — the defect this arc exists over. So the run watches its own clock, stops on its own
// terms, and SAYS it stopped early. Measured 2026-09-23: a full cold pass over seven trees is ~4.2s,
// so ten seconds is roughly twice the headroom the corpus needs today.
const BUDGET_MS = 10000;
// A corpus of a few hundred pages walks in milliseconds. A workspace that somehow holds far more is a
// fact worth refusing on rather than a reason to make every turn slow.
const MAX_FILES = 20000;

/** Every repository under the workspace that declares itself and carries a docs tree. */
export function docsTrees(root: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(root); } catch { return out; }
  for (const entry of entries.sort()) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const repo = join(root, entry);
    try { if (!statSync(repo).isDirectory()) continue; } catch { continue; }
    // A REPOSITORY IS ONE THAT SAYS SO. `sprepo.json` is what the workspace is discovered by
    // everywhere else, and a folder that merely holds a `docs/` is not a member.
    if (!existsSync(join(repo, "sprepo.json"))) continue;
    const tree = join(repo, "docs");
    if (existsSync(tree)) out.push(tree);
  }
  return out;
}

/**
 * One docs command over one tree. Returns its RULE lines, or a line saying it could not run.
 *
 * `SPN_WORKSPACE` IS PASSED BECAUSE THE TOOL PRINTS PATHS RELATIVE TO IT, and left to itself it walks
 * up from its own cwd. A finding then names a file as `../../../../private/tmp/…`, which is unreadable
 * and, worse, unclickable — the reader cannot get to the page they are being told about.
 */
function runOne(root: string, cli: string, args: string[]): { rule: string[]; broke: string | null } {
  // A MISSING CLI IS A FAILURE, NEVER A CLEAN RESULT. Node exits 1 when it cannot find the file, and
  // exit 1 with no `✗` line below would read as a tool that found nothing.
  if (!existsSync(cli)) return { rule: [], broke: `no CLI at ${cli}` };
  try {
    execFileSync(process.execPath, [cli, ...args],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000, cwd: root, env: { ...process.env, SPN_WORKSPACE: root } });
    return { rule: [], broke: null };
  } catch (error: any) {
    // EXIT 1 IS FINDINGS AND ANYTHING ELSE IS THE TOOL FAILING, and the two must never be conflated:
    // a crashing check that reads as `no findings` is the exact defect this arc was opened over.
    const out = String(error?.stdout ?? "");
    // A FINDING IS TWO LINES, and taking only the first ships a warning that names a file and no
    // fault. `docs audit` prints `✗ RULE <check> <file>` and then the reason, indented, beneath it —
    // so the pair is rejoined here. Caught by running this against a known-bad page and reading
    // what the warning actually said, which is the only way this class of defect ever shows up.
    if (error?.status === 1) {
      const lines = out.split("\n");
      const rule: string[] = [];
      // `✗` RATHER THAN `✗ RULE`, so a finding is caught whether or not the command that produced it
      // grades its own findings — `docs audit` writes `✗ RULE` and `! SOFT`, and matching the bare
      // mark still leaves SOFT alone, which is the line this check does not fail on.
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes("✗")) continue;
        const why = (lines[i + 1] ?? "").trim();
        rule.push(`${lines[i].replace(/^✗\s*RULE\s*/, "").trim()}${why ? ` — ${why}` : ""}`);
      }
      return { rule, broke: null };
    }
    return { rule: [], broke: `exit ${error?.status ?? "?"} — ${String(error?.stderr ?? error?.message ?? "").slice(0, 200)}` };
  }
}

/**
 * The plugin's own `scripts/` folder — this check's own home when it runs from source, or the
 * sibling of wherever this file ends up bundled to.
 *
 * ESBUILD COLLAPSES EVERY INLINED MODULE'S `import.meta.dirname` TO THE BUNDLE'S OWN LOCATION
 * (proven empirically, not assumed): this file is a static import of `events/stop.ts`, so once
 * `stop.ts` is built to `dist/events/stop.mjs`, `import.meta.dirname` inside this module reads as
 * `.../src/dist/events`, never `.../src/checks`. `dirname(import.meta.dirname)` alone therefore
 * answered `.../src/dist` after bundling — a folder with no `commands/`, no `refs/`, and no import
 * of `plugin-support-lib` — which is why this is walked to a named ancestor rather than a fixed
 * number of `..`. `scripts/` and `dist/` are always siblings directly under the plugin's
 * `src/`, so climbing to the nearer of the two and returning its `scripts` sibling is correct
 * whether this file is running from its own source path or bundled anywhere inside `dist/`.
 */
function pluginScriptsDir(from: string): string {
  let dir = from;
  for (let hop = 0; hop < 8; hop++) {
    const name = basename(dir);
    if (name === "scripts" || name === "dist") return join(dirname(dir), "scripts");
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return from;
}
const SCRIPTS = pluginScriptsDir(import.meta.dirname);
/**
 * This plugin's own CLI entry — the committed bundle where one has been built, the source
 * otherwise. `dist/` and `scripts/` are always siblings directly under `src/` (`02-shape.md` §
 * The tree), which is what lets this resolve correctly whether the corpus check itself is running
 * bundled (inlined into `dist/events/stop.mjs`) or from source, as the tests run it from a copy
 * that carries no `dist/` at all.
 */
function cliPath(scripts: string): string {
  const bundled = join(dirname(scripts), "dist", "cli.mjs");
  return existsSync(bundled) ? bundled : join(scripts, "cli.ts");
}
const CLI = cliPath(SCRIPTS);
/** The helpers the plugins share, imported by relative path. An installed copy runs bundles and has none. */
const SUPPORT_LIB = resolve(SCRIPTS, "..", "..", "..", "plugin-support-lib", "src", "lib");

const shortHash = (hash: ReturnType<typeof createHash>): string => hash.digest("hex").slice(0, 32);

/**
 * The checker's own bytes, as one hash: every file under `scripts/`, the shared support folder, and
 * the Node version that runs them. It is half of every cache key.
 *
 * A CHECK THAT CHANGED MUST RE-ASK ITS QUESTION OF A CORPUS THAT DID NOT. Leaving the checker out bit
 * the first cut of this file: fixing its verdict-caching defect left the old verdict cached, because
 * the key had not moved. The whole folder is hashed rather than the tools' import graph, because a
 * command can be loaded by a computed path that no import scan follows. An unrelated hook edit then
 * costs one cold run, which is the safe direction to be wrong in.
 */
export function checkerHash(scripts = SCRIPTS, supportLib = SUPPORT_LIB): string | null {
  const hash = createHash("sha256");
  hash.update(`node\0${process.version}\0`);
  const limit = { left: MAX_FILES };
  hash.update("scripts\0");
  if (!hashFiles(hash, scripts, limit)) return null;
  hash.update("support\0");
  if (!hashFiles(hash, supportLib, limit)) return null;
  return shortHash(hash);
}

/** The foundation's page templates. `audit` renders every produced page with them, in every tree. */
function templatesDir(root: string): string {
  return process.env.SPN_TEMPLATES
    ?? bookTemplatesDir(join(root, "spn-foundation"));
}

/**
 * One docs tree's inputs, as one hash, and the other half of its cache key.
 *
 * What is in it: the tree's place in the workspace (a finding names its file by workspace-relative
 * path), every file under the tree, its repository's `sprepo.json` and `CONCEPT.md`, and the
 * foundation's templates (a template edit changes the verdict of trees that did not move).
 *
 * WHAT IS NOT IN IT, SAID HERE SO NOBODY INFERS THE KEY IS COMPLETE: the package sources `audit`
 * indexes for closed values and `coverage` mirrors, and the sibling-repository paths a figure names.
 * A change to those alone replays the stored verdict until the tree or the checker moves.
 *
 * Returns null when the tree holds more than `MAX_FILES` files, which runs it uncached.
 */
export function treeHash(root: string, tree: string): string | null {
  const hash = createHash("sha256");
  const limit = { left: MAX_FILES };
  hash.update(`tree\0${relative(root, tree)}\0`);
  if (!hashFiles(hash, tree, limit)) return null;
  const repo = dirname(tree);
  hashFile(hash, "sprepo.json", join(repo, "sprepo.json"));
  hashFile(hash, "CONCEPT.md", join(repo, "CONCEPT.md"));
  hash.update("templates\0");
  if (!hashFiles(hash, templatesDir(root), limit)) return null;
  return shortHash(hash);
}

/** What happened to one docs tree on this run. */
export type SubjectRun = { subject: string; source: Source | "skipped" | "not reached" };

/**
 * The corpus check, with what it did to each subject.
 *
 * Each docs tree is one subject with one verdict. A stored verdict is REPLAYED, findings and all, and
 * never dropped.
 *
 * **F1 — STORING ONLY "NOTHING CHANGED" MADE A BROKEN CORPUS READ AS CLEAN.** The first cut skipped
 * the run whenever nothing had moved and returned nothing, so a finding was reported on the turn it
 * appeared and never again. A page could sit broken for a week behind a check that had genuinely found
 * it. SKIPPING THE WORK IS THE POINT; skipping the VERDICT never was. The findings are stored with the
 * key and re-reported verbatim until the tree or the checker moves.
 */
export function runCorpus(root: string): { warnings: Warning[]; runs: SubjectRun[] } {
  const trees = docsTrees(root);
  if (!trees.length) return { warnings: [], runs: [] };

  const deadline = Date.now() + BUDGET_MS;
  const checker = checkerHash();
  const findings: string[] = [];
  const broke: string[] = [];
  const runs: SubjectRun[] = [];
  const replayed: string[] = [];
  let cutShort = false;

  const settle = (subject: string, key: string | null, compute: () => Computed): string[] => {
    if (!key) { const c = compute(); runs.push({ subject, source: "unshared" }); return c.findings; }
    const { verdict, source } = verdictFor(key, subject, compute, deadline);
    runs.push({ subject, source });
    if ((source === "replayed" || source === "waited") && verdict.findings.length) replayed.push(subject);
    return verdict.findings;
  };

  for (const tree of trees) {
    const subject = relative(root, tree);
    if (Date.now() > deadline) { cutShort = true; runs.push({ subject, source: "not reached" }); continue; }
    const hash = checker ? treeHash(root, tree) : null;
    const lines = settle(subject, hash && `${hash}.${checker}`, () => {
      const found: string[] = [];
      const ran: Computed["ran"] = [];
      let complete = true, failed = false;
      for (const step of WIRED) {
        if (Date.now() > deadline) { complete = false; cutShort = true; break; }
        const { rule, broke: failure } = runOne(root, CLI, step.args(tree));
        ran.push({ tool: step.label, rule: rule.length });
        if (failure) { failed = true; broke.push(`\`${step.label}\` could not run over \`${subject}\` — ${failure}`); continue; }
        for (const line of rule) found.push(`${basename(dirname(tree))} · ${step.label} · ${line}`);
      }
      // A PARTIAL OR FAILED RUN IS NEVER STORED. Storing one would record the tree as checked when
      // part of it was not, and every later turn would replay that — the cached-green shape exactly.
      return { findings: found, ran, store: complete && !failed };
    });
    findings.push(...lines);
  }

  if (runs.some((r) => r.source === "ran")) prune();

  const which = `Ran ${WIRED.map((w) => `\`${w.label}\``).join(" · ")} over ${trees.length} docs tree(s). ` +
    `NOT run, and each is somebody's owed work rather than a clean result: ` +
    REPORTED_ELSEWHERE.map((t) => `\`${t.label}\` (${t.why})`).join(" · ") + ".";

  const warnings: Warning[] = [];
  if (cutShort) {
    const answered = runs.filter((r) => r.source !== "not reached").length;
    warnings.push({ check: "corpus", message:
      `The corpus run passed its ${BUDGET_MS / 1000}s budget and stopped with ${answered} of ${runs.length} subjects answered. ` +
      `**This is not a clean result.** Nothing it did not finish was stored, so the next turn runs that part again. ` +
      `If this keeps happening the corpus has outgrown a per-turn check and \`Q183\` should be re-asked ` +
      `with CI as option C.\n\n${which}` });
  }
  if (broke.length)
    warnings.push({ check: "corpus", message:
      `A corpus tool failed to run, which is not the same as finding nothing:\n  ${broke.join("\n  ")}\n\n${which}` });
  if (findings.length)
    warnings.push({ check: "corpus", message:
      `${findings.length} RULE finding(s) in the docs trees:\n` +
      `  ${findings.slice(0, 12).join("\n  ")}` +
      (findings.length > 12 ? `\n  … and ${findings.length - 12} more` : "") +
      // SAYING IT IS A REPLAY IS PART OF BEING HONEST ABOUT IT. A repeated finding that reads as a
      // fresh run invites somebody to think the check keeps re-finding it, when the truth is simpler
      // and more useful: nothing has changed since it was found, including the fault.
      (replayed.length
        ? `\n\nFrom ${replayed.map((s) => `\`${s}\``).join(" · ")}: nothing there and nothing in the checker has changed since ` +
          `these were found, so the tools were not re-run — this is the stored verdict.`
        : "") +
      `\n\n${which}` });
  return { warnings, runs };
}

/**
 * The corpus check, as the `Stop` hook calls it.
 *
 * Warns, never refuses — the `Stop` contract. A turn is already written by the time this runs, and a
 * refusal would only lose it.
 */
export function checkCorpus(root: string): Warning[] {
  return runCorpus(root).warnings;
}

if (process.argv[1] && basename(process.argv[1]) === "corpus.ts") {
  const root = process.argv[2] ?? process.cwd();
  const { warnings, runs } = runCorpus(root);
  // What each subject did goes first, so a reader can see which trees were re-run and which replayed.
  console.log(`subjects: ${runs.map((r) => `${r.subject} ${r.source}`).join(" · ") || "none"}\n`);
  for (const w of warnings) console.log(`[${w.check}] ${w.message}\n`);
  console.log(warnings.length ? `${warnings.length} warning(s)` : "corpus clean");
  process.exit(warnings.length ? 1 : 0);
}
