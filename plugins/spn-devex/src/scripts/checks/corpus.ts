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
//      a week, so THE RUN IS FINGERPRINTED: the docs trees are walked for `(path, size, mtime)` and
//      hashed, and an unchanged corpus runs nothing at all. The walk is the whole cost on a turn that
//      changed no document, which is most turns.
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
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

export type Warning = { check: string; message: string };

/** The docs commands that are silent on a clean corpus today, so a finding from one means something. */
const WIRED = [
  { tool: "docs.ts", args: (tree: string) => ["audit", tree], label: "audit" },
  { tool: "docs.ts", args: (tree: string) => ["face", "--check", dirname(tree)], label: "face --check" },
  { tool: "docs.ts", args: (tree: string) => ["topics", dirname(tree)], label: "topics" },
  { tool: "docs.ts", args: (tree: string) => ["coverage", dirname(tree)], label: "coverage" },
];

/**
 * The checks that ask one question of the whole workspace rather than one per docs tree.
 *
 * `commands-ref` is `N18` step 3, and it waited on a baseline rather than on a host: it reported
 * STALE until the `1.2.67` release let the ref be regenerated from a CLI that was not already behind
 * the source. It exits 1 on a stale region, so it gates the same way the others do.
 *
 * IT DEGRADES TO SILENCE WITH NO CLI ON THE MACHINE, the rule `coherence.ts` already states: it asks
 * `spnutils help --json` for the surface, and a partner holds the plugins without the CLI. A missing
 * `spnutils` is a fact about that machine, not a finding about the ref.
 */
const WORKSPACE_WIDE = [
  { tool: "commands-ref.ts", label: "commands-ref", needs: "spnutils" },
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

const DEVEX = ".spndevex", DEBUG = ".debug", FOLDER = "corpus", PRINT = "fingerprint.json", LAST = "last-run.json";
// THE RUN'S OWN BUDGET, BECAUSE THE HOOK'S TIMEOUT IS NOT A SAFE ONE TO RELY ON. A `Stop` hook that
// is cut off mid-run has done a PARTIAL corpus read and says nothing about it, which is a green light
// nobody earned — the defect this arc exists over. So the run watches its own clock, stops on its own
// terms, and SAYS it stopped early. Measured 2026-09-23: a full cold pass over seven trees is ~4.2s,
// so ten seconds is roughly twice the headroom the corpus needs today.
const BUDGET_MS = 10000;
// A corpus of a few hundred pages walks in milliseconds. A workspace that somehow holds far more is a
// fact worth refusing on rather than a reason to make every turn slow.
const MAX_FILES = 20000;

function read(path: string): string {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
}

/** Where a command resolves on this machine, or null. No spawn — `which` is a filesystem question. */
function onPath(command: string): string | null {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    if (!dir) continue;
    const full = join(dir, command);
    try { if (statSync(full).isFile()) return full; } catch { /* next */ }
  }
  return null;
}

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

/** Every document under a tree, as `(relative path, size, mtime)`, sorted so the hash is stable. */
function walk(tree: string, out: string[], budget: { left: number }): void {
  let entries: string[];
  try { entries = readdirSync(tree); } catch { return; }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const path = join(tree, entry);
    let st;
    try { st = statSync(path); } catch { continue; }
    if (st.isDirectory()) { walk(path, out, budget); continue; }
    if (!path.endsWith(".md") && !path.endsWith(".html")) continue;
    if (budget.left-- <= 0) return;
    out.push(`${path}\t${st.size}\t${st.mtimeMs}`);
  }
}

/**
 * What the corpus looks like right now, as one hash.
 *
 * THE TOOLS' OWN BYTES ARE IN IT. A check that changed must re-ask its question of a corpus that did
 * not — otherwise fixing a check leaves the old verdict cached, which is the same shape as `N30`'s
 * `upToDate` and would be this file's own contribution to the list `N38` keeps.
 */
export function fingerprint(root: string, trees: string[], toolDir: string): string {
  const lines: string[] = [];
  const budget = { left: MAX_FILES };
  for (const tree of trees) walk(tree, lines, budget);
  lines.sort();
  // THE CHECK'S OWN BYTES ARE HERE TOO, and leaving them out bit immediately: editing this file to
  // fix the verdict-caching defect left the old verdict cached, because the hash had not moved. A
  // fingerprint that cannot see a change to the checker is a stale-green generator.
  for (const tool of [join(toolDir, "docs.ts"), join(toolDir, "coherence.ts"), join(toolDir, "commands-ref.ts"), import.meta.filename]) {
    try { const st = statSync(tool); lines.push(`${basename(tool)}\t${st.size}\t${st.mtimeMs}`); }
    catch { lines.push(`${basename(tool)}\tabsent`); }
  }
  // THE INSTALLED CLI IS AN INPUT TOO, and no walk of the docs trees can see it. `commands-ref` asks
  // `spnutils` what commands exist, so a release that adds one makes the ref stale WITHOUT changing a
  // single tracked file — and a fingerprint blind to that would skip the run forever. The binary is
  // STATTED rather than executed: asking `spnutils --version` on every turn would cost a spawn and
  // undo the cheap skip this whole design exists for.
  const cli = onPath("spnutils");
  try { const st = statSync(cli ?? ""); lines.push(`spnutils\t${st.size}\t${st.mtimeMs}`); }
  catch { lines.push("spnutils\tabsent"); }
  // AND THE FILE `commands-ref` WRITES, which sits in `refs/` rather than under any docs tree.
  //
  // Without it a commands finding could be reported and never cleared. The release moved the CLI,
  // the ref went stale, the finding appeared — and regenerating the ref changed no watched input,
  // so every later turn replayed the same RULE over a file that was already correct. The CLI stat
  // beside it cannot help: the binary is what it was when the finding was found.
  //
  // That is the same shape as `F1` above, seen from the other side. `F1` was a real finding that
  // stopped being reported; this was a fixed finding that would not stop.
  const ref = join(toolDir, "..", "..", "refs", "commands.md");
  try { const st = statSync(ref); lines.push(`commands.md\t${st.size}\t${st.mtimeMs}`); }
  catch { lines.push("commands.md\tabsent"); }
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

function stateDir(root: string): string {
  return join(root, DEVEX, DEBUG, FOLDER);
}

/**
 * The last run's hash AND the verdict that went with it.
 *
 * **F1 — STORING ONLY THE HASH MADE A BROKEN CORPUS READ AS CLEAN.** The first cut skipped the run
 * whenever nothing had moved and returned nothing, so a finding was reported on the turn it appeared
 * and never again: every later turn saw an unchanged corpus and said nothing. A page could sit broken
 * for a week behind a check that had genuinely found it.
 *
 * That is this arc's own subject — a green light nobody earned — written into the check built to end
 * it, and it was caught by running the check twice against a known-bad fixture rather than once.
 * SKIPPING THE WORK IS THE POINT; skipping the VERDICT never was. The findings ride with the hash and
 * are re-reported verbatim until the corpus moves.
 */
function lastRun(root: string): { hash: string; warnings: Warning[] } {
  try {
    const saved = JSON.parse(read(join(stateDir(root), PRINT)));
    return { hash: saved?.hash ?? "", warnings: Array.isArray(saved?.warnings) ? saved.warnings : [] };
  } catch { return { hash: "", warnings: [] }; }
}

function remember(root: string, hash: string, warnings: Warning[], ran: unknown): void {
  // A RUN NEVER FAILS BECAUSE ITS BOOKKEEPING FAILED, the rule `timing.ts` already states.
  try {
    mkdirSync(stateDir(root), { recursive: true });
    writeFileSync(join(stateDir(root), PRINT), `${JSON.stringify({ hash, at: new Date().toISOString(), warnings }, null, 2)}\n`, "utf8");
    writeFileSync(join(stateDir(root), LAST), `${JSON.stringify(ran, null, 2)}\n`, "utf8");
  } catch { /* ignore */ }
}

/**
 * One docs command over one tree. Returns its RULE lines, or a line saying it could not run.
 *
 * `SPN_WORKSPACE` IS PASSED BECAUSE THE TOOL PRINTS PATHS RELATIVE TO IT, and left to itself it walks
 * up from its own cwd. A finding then names a file as `../../../../private/tmp/…`, which is unreadable
 * and, worse, unclickable — the reader cannot get to the page they are being told about.
 */
function runOne(root: string, toolDir: string, tool: string, args: string[]): { rule: string[]; broke: string | null } {
  try {
    execFileSync(process.execPath, [join(toolDir, tool), ...args],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000, cwd: root, env: { ...process.env, SPN_WORKSPACE: root } });
    return { rule: [], broke: null };
  } catch (error: any) {
    // EXIT 1 IS FINDINGS AND ANYTHING ELSE IS THE TOOL FAILING, and the two must never be conflated:
    // a crashing check that reads as `no findings` is the exact defect this arc was opened over.
    const out = String(error?.stdout ?? "");
    // A FINDING IS TWO LINES, and taking only the first ships a warning that names a file and no
    // fault. `docs.ts` prints `✗ RULE <check> <file>` and then the reason, indented, beneath it —
    // so the pair is rejoined here. Caught by running this against a known-bad page and reading
    // what the warning actually said, which is the only way this class of defect ever shows up.
    if (error?.status === 1) {
      const lines = out.split("\n");
      const rule: string[] = [];
      // `✗` RATHER THAN `✗ RULE`, because not every tool here grades its findings. `docs.ts` writes
      // `✗ RULE` and `! SOFT`; `commands-ref` writes a bare `✗`. Matching the mark catches both and
      // still leaves SOFT alone, which is the line this check does not fail on.
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
 * The corpus check.
 *
 * Warns, never refuses — the `Stop` contract. A turn is already written by the time this runs, and a
 * refusal would only lose it.
 */
export function checkCorpus(root: string): Warning[] {
  const toolDir = join(dirname(import.meta.dirname), "tools");
  const trees = docsTrees(root);
  if (!trees.length) return [];

  const now = fingerprint(root, trees, toolDir);
  // THE SKIP IS THE WHOLE REASON THIS IS AFFORDABLE PER TURN. Nothing under any docs tree moved and
  // no tool changed, so the last verdict still stands — and the verdict is REPLAYED, never dropped.
  // See `lastRun` for what dropping it did.
  const previous = lastRun(root);
  if (now === previous.hash)
    // SAYING IT IS A REPLAY IS PART OF BEING HONEST ABOUT IT. A repeated finding that reads as a
    // fresh run invites somebody to think the check keeps re-finding it, when the truth is simpler
    // and more useful: nothing has changed since it was found, including the fault.
    return previous.warnings.map((w) => ({ ...w, message: `${w.message}\n\nNothing under any docs tree has changed since this was found, so the tools were not re-run — this is the stored verdict.` }));

  const findings: string[] = [];
  const broke: string[] = [];
  const ran: Array<{ tree: string; tool: string; rule: number }> = [];
  const started = Date.now();
  let cutShort = "";
  outer: for (const tree of trees) {
    for (const step of WIRED) {
      if (Date.now() - started > BUDGET_MS) {
        cutShort = `${ran.length} of ${trees.length * WIRED.length} tool runs`;
        break outer;
      }
      const { rule, broke: failure } = runOne(root, toolDir, step.tool, step.args(tree));
      ran.push({ tree: relative(root, tree), tool: step.label, rule: rule.length });
      if (failure) { broke.push(`\`${step.label}\` could not run over \`${relative(root, tree)}\` — ${failure}`); continue; }
      for (const line of rule) findings.push(`${basename(dirname(tree))} · ${step.label} · ${line}`);
    }
  }
  for (const step of WORKSPACE_WIDE) {
    if (step.needs && !onPath(step.needs)) { ran.push({ tree: "(workspace)", tool: `${step.label} — skipped, no ${step.needs}`, rule: 0 }); continue; }
    const { rule, broke: failure } = runOne(root, toolDir, step.tool, []);
    ran.push({ tree: "(workspace)", tool: step.label, rule: rule.length });
    if (failure) { broke.push(`\`${step.label}\` could not run — ${failure}`); continue; }
    for (const line of rule) findings.push(`workspace · ${step.label} · ${line}`);
  }

  const which = `Ran ${[...WIRED, ...WORKSPACE_WIDE].map((w) => `\`${w.label}\``).join(" · ")} over ${trees.length} docs tree(s). ` +
    `NOT run, and each is somebody's owed work rather than a clean result: ` +
    REPORTED_ELSEWHERE.map((t) => `\`${t.label}\` (${t.why})`).join(" · ") + ".";

  const out: Warning[] = [];
  if (cutShort)
    out.push({ check: "corpus", message:
      `The corpus run passed its ${BUDGET_MS / 1000}s budget and stopped after ${cutShort}. ` +
      `**This is not a clean result and no fingerprint was stored**, so the next turn runs it again. ` +
      `If this keeps happening the corpus has outgrown a per-turn check and \`Q183\` should be re-asked ` +
      `with CI as option C.\n\n${which}` });
  if (broke.length)
    out.push({ check: "corpus", message:
      `A corpus tool failed to run, which is not the same as finding nothing:\n  ${broke.join("\n  ")}\n\n${which}` });
  if (findings.length)
    out.push({ check: "corpus", message:
      `${findings.length} RULE finding(s) in the docs trees:\n` +
      `  ${findings.slice(0, 12).join("\n  ")}` +
      (findings.length > 12 ? `\n  … and ${findings.length - 12} more` : "") +
      `\n\n${which}` });

  // A PARTIAL RUN NEVER STORES A FINGERPRINT. Storing one would record this corpus as checked when
  // most of it was not read, and the next turn would skip it — the cached-green shape exactly. The
  // verdict is stored WITH the hash so an unchanged corpus replays it rather than falling silent.
  if (!cutShort)
    remember(root, now, out, { at: new Date().toISOString(), wired: WIRED.map((w) => w.label), notWired: REPORTED_ELSEWHERE, ran });
  return out;
}

if (process.argv[1] && basename(process.argv[1]) === "corpus.ts") {
  const root = process.argv[2] ?? process.cwd();
  const warnings = checkCorpus(root);
  for (const w of warnings) console.log(`[${w.check}] ${w.message}\n`);
  console.log(warnings.length ? `${warnings.length} warning(s)` : "corpus clean, or unchanged since the last run");
  process.exit(warnings.length ? 1 : 0);
}
