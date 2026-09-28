#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § The arc · § Stopping in the middle is a handover
//           docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The Stop checks. They read what the turn is about to leave behind, and warn — never refuse, because
// the turn is already written and a refusal would only lose it.
//
//   runnable   a turn that ends while the running arc still has rows to do, and nothing blocks them
//   hold       an arc whose status reads HELD must name a card that exists and is unanswered
//   handover   a reply that says a new window is needed carries the seven fields
//   corpus     the docs trees still answer the questions only a whole-corpus read can ask
//
// `corpus` is the newest and the odd one out: every other check here reads what the TURN wrote, and
// that one reads the workspace. It is here because nothing else ran it — `N38` found that every
// corpus tool in this plugin was hand-run, so a defect was only ever found by somebody looking for
// something else. It keeps one verdict per docs tree, keyed by content, in `~/.spnutils/cache/corpus/`
// — a tree that has not moved since its verdict was written replays it rather than re-running every
// tool over it, which is what makes a per-turn hook affordable; see `checks/corpus.ts` for why that
// matters and what it costs.
//
// `runnable` is the one the developer asked for by name: *you keep getting stuck after reporting, and
// you should continue when there is no blocker.* Reporting is not stopping. A milestone line belongs
// between steps, in the same turn as the next step.

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { checkCorpus } from "../checks/corpus.ts";
import { answeredNumbers, cardsOf, openWorkstreams, rowsOf, stateOf } from "../checks/split-plan.ts";
import { TERMINAL } from "../checks/arc-status.ts";
import { DEVEX, workspaceRoot } from "../lib/payload.ts";
import { cacheState } from "./orientation.ts";
import { begin, span, end } from "../lib/timing.ts";

type Warning = { check: string; message: string };

const HANDOVER_FIELDS = ["workstream", "arc", "model", "read first", "state", "done when", "do not touch", "open"];
// A GLYPH IS UNAMBIGUOUS AND A WORD IS NOT, so the two are read differently.
//
// `landed`, `carried` and `deferred` are ordinary English. Read against a whole row joined into one
// string, a step counted its own DESCRIPTION as its marker: thirteen rows in `008-plain-language`
// say one of those words in their prose, and `N90` step 3 — *spot-check the claimed-LANDED steps
// rather than trusting them* — reported as done because it is a step ABOUT landed steps. That is the
// direction that hides work, so the count it feeds is an undercount and nothing in the tables can
// fix it.
//
// So a word counts only where a marker is WRITTEN — as a cell's whole content, or at its start so a
// date or a commit may follow — and a glyph counts anywhere in the row, which is where the corpus
// puts it (`| 4 | ✅ **done 2026-09-23** — …`).
const DONE_GLYPHS = ["✅", "↷", "⊘"];
const DONE_WORDS = ["landed", "carried", "deferred"];

/** Whether a step row carries a done-mark, as opposed to merely naming one. */
function isDone(cells: string[]): boolean {
  if (cells.some((c) => DONE_GLYPHS.some((g) => c.includes(g)))) return true;
  return cells.some((c) => {
    const bare = c.replace(/[*_`~]/g, "").trim().toLowerCase();
    return DONE_WORDS.some((w) => bare === w || bare.startsWith(`${w} `));
  });
}

function read(p: string): string {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function openWorkstreamFolders(root: string): string[] {
  const dir = join(root, ".spndevex", "workstreams", "open");
  try { return readdirSync(dir).map((d) => join(dir, d)).filter((d) => statSync(d).isDirectory()); }
  catch { return []; }
}

function arcsOf(ws: string): string[] {
  const dir = join(ws, "arcs");
  try { return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f)); }
  catch { return []; }
}

function pagesOf(ws: string): string[] {
  try { return readdirSync(ws).filter((f) => f.endsWith("-approach.html")).map((f) => join(ws, f)); }
  catch { return []; }
}

/**
 * An arc's status word, from the first `Status:` line, in either spelling the corpus uses.
 *
 * **IT READ ONE SPELLING AND THE CORPUS HAS TWO.** The pattern was `Status: **WORD`, and every arc
 * written from `N30` onward opens `**Status: WORD` — the bold around the label rather than after it.
 * Measured 2026-09-23 over workstream `008`: 37 arcs read, **10 unread, and the 10 are `N30` to
 * `N39`** — every arc of the current week. So the checks that read a status were blind to exactly
 * the arcs somebody was working on, which is the worst possible subset to be blind to.
 *
 * A hyphen is part of the word: `PART-LANDED` is a status, not `PART`.
 */
function statusOf(arc: string): string {
  const m = read(arc).match(/^\*{0,2}Status:?\*{0,2}\s*\*{0,2}\s*([A-Z][A-Z-]*)/m);
  return m ? m[1] : "";
}

/** Statuses that mean the arc is finished, so unfinished rows in it are history rather than work. */
// TERMINAL IS IMPORTED NOW, BECAUSE A SECOND COPY OF A CLOSED SET DRIFTS. This file
// kept its own — `LANDED · DONE · CLOSED · CARRIED · DEFERRED` — against the register's
// `LANDED · CARRIED · DROPPED`. Three of those five are not arc statuses at all, and `DROPPED` was
// missing, so an arc abandoned on purpose reported as runnable work for as long as anybody touched
// it. `arc-status.ts` already exported the set; this file simply did not ask for it.
//
// A STATUS THAT MEANS *DO NOT START THIS* IS NOT RUNNABLE, and four of the eight say so for four
// different reasons: nobody agreed it, its turn has not come, it is blocked, or it is finished.
// Inferring runnable from *has unfinished steps* is true of `RUNNING` and `PART-LANDED` and false of
// the rest — which is how an arc opened at `DECIDED` was reported, within a minute of being written,
// as work somebody had abandoned.
const NOT_RUNNABLE = new Set(["PROPOSED", "DECIDED", "HELD"]);

/** When this workspace's `Stop` hook last ran, as milliseconds. 0 when it never has. */
const DEBUG = ".debug";

function lastStopAt(root: string): number {
  try { return JSON.parse(readFileSync(join(root, DEVEX, ".debug", "stop", "last.json"), "utf8")).at ?? 0; }
  catch { return 0; }
}

function rememberStop(root: string): void {
  try {
    const dir = join(root, DEVEX, DEBUG, "stop");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "last.json"), JSON.stringify({ at: Date.now() }), "utf8");
  } catch { /* the check must never fail because it could not write its own note */ }
}

/** The rows of an arc's own step table that are not yet done. */
function unfinishedSteps(arc: string): string[] | null {
  const src = read(arc);
  if (!/^##\s+Steps\b/im.test(src)) return null;
  const out: string[] = [];
  const lines = src.split("\n");
  let inSteps = false;
  for (const l of lines) {
    if (/^##\s+Steps\b/i.test(l)) { inSteps = true; continue; }
    if (inSteps && /^##\s/.test(l)) break;
    if (!inSteps || !l.trim().startsWith("|")) continue;
    if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue;
    const cells = l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (!/^\d+[a-z]?$/i.test(cells[0])) continue;  // the header, or a field row. `0b` is a step too.
    if (!isDone(cells)) out.push(`step ${cells[0]} — ${cells[1].slice(0, 70)}`);
  }
  return out;
}

/**
 * A card that is open and unanswered.
 *
 * **F16 — THIS HELD A SECOND, WRONG COPY OF THE TEST, AND IT MADE BOTH CHECKS BLIND.** It asked
 * whether `<b>Decision` appears at all. The card template ships `<b>Decision:</b> &mdash;`, which is
 * a card still waiting — so every card written the way the template asks read as ANSWERED here.
 * `runnable` therefore never saw a card as open and nagged through sittings where one was, and
 * `hold` would have reported every HELD arc as naming no open card.
 *
 * `split-plan.ts` fixed exactly this as F5 and its `cardsOf` carries the correct test: the marker's
 * presence is not the answer, what follows it is. There is one implementation now, because two were
 * how this drifted.
 */
function openCards(page: string): string[] {
  return cardsOf(page).filter((card) => !card.decided).map((card) => card.number);
}

/**
 * Just the step table's rows, so a log entry, a status line or a handover block cannot look like
 * work. This is the whole discriminator: the sitting writing ABOUT an arc moves everything else.
 */
function stepRows(text: string): string {
  return (text.match(/^\|\s*\d+[a-z]?\s*\|.*$/gim) ?? []).join("\n");
}

/**
 * The step rows each arc carried at the last `Stop`, so this sitting's edits can be classified.
 *
 * **IT CANNOT USE `git`, AND THE FIRST CUT DID.** The workstream folder lives at the workspace root,
 * which is not a repository — `git show HEAD:./arc.md` fails there for every arc, the baseline was
 * always absent, and the fallback took the touch at face value. So the fix changed nothing and the
 * suite stayed green over it, because no case covered a workspace without a repo. Proven by running
 * it against the real workspace rather than by reading it.
 */
function lastSteps(root: string): Record<string, string> {
  try { return JSON.parse(readFileSync(join(root, DEVEX, DEBUG, "stop", "steps.json"), "utf8")); }
  catch { return {}; }
}

function rememberSteps(root: string): void {
  const seen: Record<string, string> = {};
  for (const ws of openWorkstreamFolders(root))
    for (const arc of arcsOf(ws)) seen[arc] = createHash("sha256").update(stepRows(read(arc))).digest("hex").slice(0, 12);
  try {
    const dir = join(root, DEVEX, DEBUG, "stop");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "steps.json"), JSON.stringify(seen), "utf8");
  } catch { /* the check must never fail because it could not write its own note */ }
}

export function checkRunnable(root: string, since = lastStopAt(root), stepsAt = lastSteps(root)): Warning[] {
  const out: Warning[] = [];

  for (const ws of openWorkstreamFolders(root)) {
    const cards = pagesOf(ws).flatMap(openCards);
    for (const arc of arcsOf(ws)) {
      // WHICH ARC IS BEING EXECUTED IS A FACT, NOT A CLAIM. This asked for the status word
      // `RUNNING`, and measured over workstream `008` on 2026-09-23 exactly ONE arc of 57 carries it.
      // The rest read LANDED 26, PART-LANDED 15, DECIDED 2, OPEN 2, TAKEN 1, and 10 carry no status
      // line at all. So the gate written for *reported and stopped* could speak about one arc in
      // fifty-seven, and the arc a sitting is actually executing is usually not that one.
      //
      // A check keying on one positive word exempts every synonym in silence, and it fails in the
      // direction that produces no signal. What this sitting actually wrote is on the filesystem, so
      // an arc TOUCHED SINCE THE LAST STOP is the arc being executed — whatever its status claims.
      // The word still counts where it appears, so nothing that worked before stops working.
      const status = statusOf(arc);
      if (TERMINAL.has(status)) continue;          // its unfinished rows are history, not work
      // NO BASELINE MEANS NO INFERENCE — but a status that SAYS `RUNNING` still counts, because it
      // is a claim rather than something measured. On the first `Stop` of a workspace there is
      // nothing to compare an mtime against, and treating every arc as touched reports the whole
      // backlog: measured at 28 warnings over workstream `008`. A gate whose first appearance is 28
      // findings is one nobody reads twice, which is the condition `N38` shipped for the corpus run.
      let touched = false;
      if (since) { try { touched = statSync(arc).mtimeMs > since; } catch { touched = false; } }
      // EDITING AN ARC IS NOT EXECUTING IT, and the first cut could not tell the two apart. A sweep
      // that set the status line of five arcs made every one of them report as runnable work in the
      // same turn — five findings about arcs nobody had touched the substance of. What separates
      // them is WHICH BYTES MOVED: a status line, a log entry and a handover block are the sitting
      // writing ABOUT the arc. A step table changing is the sitting working ON it.
      if (touched) {
        const now = createHash("sha256").update(stepRows(read(arc))).digest("hex").slice(0, 12);
        // NO BASELINE MEANS NO INFERENCE, the same rule the timestamp follows. An empty map is the
        // first Stop after this check learned to tell a record edit from a work edit, and firing on
        // every arc the sitting touched would make that upgrade look like a burst of findings.
        // AN ARC WRITTEN THIS SITTING HAS NO BASELINE, AND THAT IS NOT EVIDENCE OF WORK. `stepsAt` is
        // the previous sitting's map, so a file that did not exist then is absent from it —
        // `undefined !== now`, and every newly written arc reported as worked-on whatever its status.
        // The guard above exists for exactly this distinction, and could not reach a file that was
        // not there when the baseline was taken. No baseline means no inference, the same rule the
        // timestamp already follows two lines up.
        const then = Object.keys(stepsAt).length ? stepsAt[arc] ?? now : now;
        if (then === now) touched = false;                        // the record moved, the work did not
      }
      // `HELD` names its blocker in its own line, and that blocker is frequently an ARC rather than a
      // card — which the `cards.length` guard below cannot see. Skipping it here reads the word the
      // arc wrote instead of guessing at what it waits for.
      if (NOT_RUNNABLE.has(status)) continue;
      if (status !== "RUNNING" && !touched) continue;
      const steps = unfinishedSteps(arc);
      if (steps === null) {
        // THE WORD IS READ, NOT ASSUMED. This said "is RUNNING" from when only a RUNNING arc could
        // reach here; a touched arc reaches it now, and the message named a status the arc did not carry.
        out.push({ check: "runnable", message: `\`${arc.split("/").pop()}\` reads ${status || "no status"} and has no \`## Steps\` table, so nothing can say whether work is left. Give it the step table the arc template carries.` });
        continue;
      }
      const left = steps;
      if (!left.length) continue;
      if (cards.length) continue;   // a card blocks: the hold reply covers that case
      out.push({
        check: "runnable",
        message: `stopped with runnable work — \`${arc.split("/").pop()}\` was written this sitting and ${left.length} step` +
          `${left.length > 1 ? "s are" : " is"} not landed, and no card is open. The next one is ${left[0]}. ` +
          `Reporting is not stopping: a milestone line goes between steps, in the same turn as the next step ` +
          `(11-workspace.md, how the agent replies).`,
      });
    }
  }
  return out;
}

export function checkHold(root: string): Warning[] {
  const out: Warning[] = [];
  for (const ws of openWorkstreamFolders(root)) {
    const cards = new Set(pagesOf(ws).flatMap(openCards));
    for (const arc of arcsOf(ws)) {
      if (statusOf(arc) !== "HELD") continue;
      const named = [...read(arc).matchAll(/`?(Q\d+)`?/g)].map((m) => m[1].toUpperCase());
      const live = named.filter((n) => cards.has(n));
      if (!live.length)
        out.push({ check: "hold", message: `\`${arc.split("/").pop()}\` reads HELD and names no card that is open and unanswered. A HELD arc waits on a card; if its cards are answered, re-plan it and lift the hold.` });
    }
  }
  return out;
}

/**
 * A REPLY THAT ENDS A SITTING owes the next window the seven fields, because a session's context ends
 * with the session and the block is the only thing that crosses.
 *
 * WHAT COUNTS AS SAYING SO was the bare word `handover` anywhere in the reply, and that fired on
 * every sentence ABOUT a handover — *the handover marks it as not mine to decide*, *this reply
 * carries no handover block* — so answering a question about the open cards demanded a handover
 * block twice in a row. The check had no tests at all, which is how it survived: an unverified gate
 * is the thing this arc keeps finding. The signal is a statement that a window is needed or that the
 * work is being handed on, or a line that OPENS one, never a passing mention of the noun.
 */
/**
 * Whether this reply PASSES WORK ON, rather than merely naming a session that does not exist yet.
 *
 * THE PAYLOAD CANNOT ANSWER THIS, and saying otherwise would be the fault this whole arc is about.
 * `Stop` fires once per TURN, not once per sitting, so nothing in the event says the session is
 * ending — every turn looks identical to this hook. What the text CAN be read for is whether it
 * DIRECTS somebody to act, and that is a narrower question than whether it contains a phrase.
 *
 * WHY THE NARROWING WAS NEEDED. The first cut matched the words for a replacement session anywhere
 * in the reply, and it refused a reply that said a later build WOULD need one — nothing had changed,
 * no wiring had moved, and no work was being passed to anybody. Warning somebody what a build is
 * about to cost is the normal way to be useful about it, and a check that refuses it teaches people
 * to stop describing consequences.
 *
 * So a future or conditional mention is not a pass-on. A direction is.
 */
const SESSION = /\b(?:new|fresh|another|next)\s+(?:window|session)\b|\bhand(?:ing)?\s+(?:this |it )?over\b/gi;
const NOT_YET = /\b(?:will|would|'ll|once|after|when|going to|about to|then|may|might|could|if)\b[^.?!]{0,80}$/i;
// AND IT CAN FOLLOW, which the first cut missed. "a fresh window WOULD load the installed copy" is a
// description of a consequence, and every conditional word in it sits after the phrase rather than
// before. Looking only backwards refused a reply that was explaining what a build costs.
const NOT_YET_AFTER = /^[^.?!]{0,60}\b(?:will|would|'ll|may|might|could|is going to)\b/i;
// AND A COST IS NOT A DIRECTION, which the two guards above cannot see because they look for
// conditional WORDS and a cost is a noun phrase. "one bump, the installs, one `agent-sync`, and a
// fresh window" is a list of what a plugin cycle costs; it directs nobody to do anything, and this
// check fired on it twice in one sitting. The file's own note says why that matters: *warning
// somebody what a build is about to cost is the normal way to be useful about it, and a check that
// refuses it teaches people to stop describing consequences.*
//
// A LIST IS THE TEST, not a word. Where the phrase is the last item of a run of comma-separated
// items — two or more before it, joined by `and` or `or` — it is being counted rather than asked
// for. That is narrow on purpose: one comma is an ordinary sentence, and this must not swallow a
// real pass-on such as "finish the release, then open a fresh window".
const A_COST_LIST = /(?:,[^.?!,]{1,60}){2,}(?:,)?\s*(?:and|or)\s+[^.?!,]{0,30}$/i;

export function passingOn(reply: string): boolean {
  // A handover block is a pass-on whatever the prose around it says.
  if (/^[ \t]{0,3}#{0,4}[ \t]*handover\b/im.test(reply)) return true;
  for (const hit of reply.matchAll(SESSION)) {
    const at = hit.index ?? 0;
    const before = reply.slice(Math.max(0, at - 90), at);
    const after = reply.slice(at + hit[0].length, at + hit[0].length + 70);
    if (NOT_YET.test(before) || NOT_YET_AFTER.test(after)) continue;
    if (A_COST_LIST.test(before)) continue;      // counted as a cost, not asked for
    return true;                                 // stated plainly: this is being passed on
  }
  return false;
}

/**
 * Every `Q<n>` open and unanswered across every open workstream's page.
 *
 * `openCards` above takes ONE page and is about that page's own cards; this asks the workspace-wide
 * question a handover has to answer, and it subtracts what an arc records as settled — a card the
 * page still shows but an arc has answered is not work anybody is waiting on.
 */
function cardsWaiting(root: string): string[] {
  const out: string[] = [];
  for (const [, pages] of argued(root)) {
    const folder = dirname(pages[0]);
    const answered = answeredNumbers(folder);
    for (const page of pages)
      for (const card of cardsOf(page))
        if (!card.decided && !answered.has(card.number)) out.push(card.number);
  }
  return [...new Set(out)].sort();
}

export function checkHandover(reply: string, root: string): Warning[] {
  if (!passingOn(reply)) return [];

  // AN OPEN CARD BEATS A HANDOVER, AND IT COMES FIRST — finding F20, caught by the developer twice
  // in one session after the agent offered a new window with two cards standing.
  //
  // **A card open is work nobody can plan around.** Its answer may change which arc runs next, what
  // the next window reads first, and whether the step named in the block is still the right step —
  // so a handover written over an open card is a plan built on an unknown. The next window inherits
  // the question AND a brief that assumed an answer to it.
  //
  // The rule the book already states is *you stop only when something needs deciding*, and a card is
  // exactly that. What it never said is the converse: **while something needs deciding, you do not
  // hand the work to somebody else** — you ask, and the answer either changes the plan or it does
  // not. Asking costs a turn; a handover built on a guess costs a window.
  //
  // This fires BEFORE the wiring check because it is the cheaper truth: there is no point telling
  // somebody their install is stale if the work itself is not ready to pass on.
  const waiting = cardsWaiting(root);
  if (waiting.length) {
    return [{ check: "handover", message:
      `This reply passes work on while ${waiting.length === 1 ? "a card is" : `${waiting.length} cards are`} ` +
      `open — ${waiting.join(" \u00b7 ")}. **Answer first, then hand over.** A card's answer can change which ` +
      `arc runs next and what the next window reads first, so a handover written over one is a brief that ` +
      `assumed an answer nobody gave. Put the cards to the developer in full, and offer the window once they ` +
      `are settled.` }];
  }

  // THE SECOND HALF FIRST, because it is the one that costs a window. A reply that tells somebody to
  // open a session is only true if the wiring that session will load is actually installed. The
  // previous sitting's own note read *the release, which is the developer's* — it was committed,
  // green, and stopped. The next window then ran the release, the release changed the wiring, and
  // changed wiring costs a window: one sitting's work became three windows, every note correct.
  //
  // `RD.DEVEX.AGENT.057` says the tool that changed the wiring owes the note. It says what the note must
  // CONTAIN and never what must be TRUE before one is offered, so a note naming un-installed wiring
  // satisfies it completely. This is that missing precondition (N39 step 4).
  // ROOT IS PASSED IN, never read from `process.cwd()`. That is the fault this file already carries
  // a note about: a check reading the process's directory went silent whenever the hook ran anywhere
  // but the workspace root, which is most of the time.
  let wiring = "";
  try { wiring = cacheState(root, ["spn-devex", "spn-apps", "spn-infra"]); } catch { wiring = ""; }
  if (wiring.startsWith("cache stale")) {
    return [{ check: "handover", message:
      `This reply passes work on while the plugin source is ahead of what is installed — ${wiring}. ` +
      `The session that changed the wiring is the one session that cannot load it, and it is also the ` +
      `only one that knows what changed. So finishing is this sitting's job, not the next reader's: ` +
      `release what changed, bump the plugins, install them, run \`workspace agent-sync\`, and verify ` +
      `every location from \`installed_plugins.json\`. Passing this on first is what turns one ` +
      `sitting into three windows (N39).` }];
  }

  const fenced = [...reply.matchAll(/```[\s\S]*?```/g)].map((m) => m[0].toLowerCase());
  const block = fenced.find((f) => /workstream/.test(f) && /arc/.test(f));
  if (!block)
    return [{ check: "handover", message: "this reply passes work on to another session and carries no handover block. Give the seven fields in a fenced block — workstream, arc and step, model, read first, state, done when, do not touch, open — and write the same block into the arc's log." }];
  const missing = HANDOVER_FIELDS.filter((f) => !block.includes(f));
  if (missing.length)
    return [{ check: "handover", message: `the handover block is missing ${missing.join(" · ")}. The next window starts from that block and has nothing else.` }];
  return [];
}


// ---------------------------------------------------------------------------- the arc-to-page checks
//
// PORTED FROM `hooks/scripts/stop.py`, WHICH WAS SILENT ON THIS WORKSPACE. Every one of its four
// checks listed an open workstream's arcs as `name.startswith('arc-')`. The naming moved to
// `N1-{subject}.md` and the filter was never followed, so on 2026-09-19 workstream `008` held
// FOURTEEN arcs, none of them named `arc-`, and the whole file reported nothing.
//
// Drop the filter and the same code has three real findings on that workstream, and an arc carrying
// two `Q` cards while the page's `Open` reads *none* — which is precisely the shape `cardsInArcs`
// was written for. Finding F11 in this arc.
//
// So these read every `.md` under `arcs/`, which is what `arcsOf` above already did.

/**
 * Whether a page names a card number anywhere — an open card, a settled row, or a deferred one.
 *
 * `\b` after the digits is what keeps `Q1` from matching inside `Q11`.
 */
function namesCard(text: string, card: string): boolean {
  return new RegExp(`\\b${card}\\b`, "i").test(text);
}

/** Whether a page carries at least one card in the card pattern. */
function hasOpenCard(text: string): boolean {
  return /<div\b[^>]*class="[^"]*\bopen\b[^"]*"/i.test(text);
}

/** The open workstreams that have a page, as subject → its pages. */
function argued(root: string): Array<[string, string[]]> {
  return [...openWorkstreams(root)].filter(([, pages]) => pages.length)
    .sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Every arc in an open workstream that no row of its page names.
 *
 * AN ARC IS NOT WRITTEN UNTIL THE PAGE CARRIES IT. The arc is the plan and the page is what you
 * read, so an arc no row names is work that looks finished from the only surface anybody opens.
 *
 * The page must name the arc FILE. Rows name pieces of work, never the arc they belong to, so
 * matching a row's words against a filename was guesswork — it fired on a page that carried every
 * arc under a heading. A citation is explicit, greppable, and useful to a reader who wants the
 * argument behind a plan.
 */
export function unnamedArcs(root: string): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const pageText = pages.map(read).join(" ");
    for (const arc of arcsOf(dirname(pages[0]))) {
      const name = basename(arc);
      if (!pageText.includes(name)) out.push([subject, name, basename(pages[0])]);
    }
  }
  return out;
}

/**
 * Every open workstream that holds arcs and has no page at all.
 *
 * THE CHECK'S OWN WORST CASE, AND IT WAVED IT THROUGH. `unnamedArcs` begins by skipping a workstream
 * with no pages, so the strongest form of the failure it exists to catch — an arc nobody can read,
 * because there is no page to read — was the one shape it never reported. `008-plain-language` sat in
 * exactly that state while the check ran green beside it.
 */
export function pagelessWorkstreams(root: string): string[] {
  const out: string[] = [];
  for (const [subject, pages] of [...openWorkstreams(root)].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (pages.length) continue;
    for (const folder of openWorkstreamFolders(root))
      if (basename(folder) === subject && arcsOf(folder).length) { out.push(subject); break; }
  }
  return out;
}

/**
 * Every open workstream whose plan records a stop while its page says nothing is open.
 *
 * THE THIRD SHAPE, AND THE WORST OF THE THREE. The other two put a question in the wrong file, where
 * a reader could still find it. Here the split plan knows a row waits on somebody and the one section
 * they read says nothing does, so the question is written nowhere at all.
 */
export function stopsWithEmptyOpen(root: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const text = pages.map(read).join(" ");
    const waiting = rowsOf(text, false).filter((row) => stateOf(row) === "stopped");
    if (waiting.length && !hasOpenCard(text)) out.push([subject, waiting[0].label]);
  }
  return out;
}

/**
 * Every open workstream whose ARCS carry `Q<n>` cards while its page shows none.
 *
 * THIS IS THE SHAPE THAT ACTUALLY HAPPENED, twice in one sitting on `011`. The agent wrote five cards
 * into an arc while the page's `Open` said nothing, and the developer caught it both times.
 * `stopsWithEmptyOpen` reads a row's STATE, which catches a related shape and would not have caught
 * this one: those rows read `pending`, and the question was never a row at all.
 *
 * A CARD THE PAGE ALREADY NAMES IS NOT THIS SHAPE. An arc is where a card's argument belongs — the
 * options, what each costs, and why one won — once the page carries the answer somewhere a reader
 * finds it. Finding F12: this fired on `008`'s `Q11`, argued in `N1b` and answered on the page in
 * its *Settled already* table, which is the arrangement the convention asks for. The question is
 * whether the PAGE names the number at all, not whether it still has a card open.
 */
export function cardsInArcs(root: string): Array<[string, string, string]> {
  const out: Array<[string, string, string]> = [];
  for (const [subject, pages] of argued(root)) {
    const pageText = pages.map(read).join(" ");
    if (hasOpenCard(pageText)) continue;
    for (const arc of arcsOf(dirname(pages[0]))) {
      const unrecorded = [...read(arc).matchAll(/^#{2,4}\s+`?(Q\d+[A-Z]?)`?\s*[·\u00b7]/gm)]
        .map((found) => found[1])
        .filter((card) => !namesCard(pageText, card));
      if (unrecorded.length) { out.push([subject, basename(arc), unrecorded[0]]); break; }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------- reply-shape
//
// RESTATES: 05-artifacts.md § The approach document → Open. The clause is the one most often missed:
// *open items put to a person in chat follow this layout exactly as a document's Open section does*
// — MUST. That covers a status reply, an answer to "what's left?", and a pending-work report.
//
// THE FAILURE IT CATCHES IS EXACT. A reply names lettered options — "say A and I will…", "my
// recommendation is B" — while showing no options table. The reader is asked to choose between
// things they were never shown, and the card grammar exists to stop precisely that.
//
// What it deliberately does NOT do: it never reads whether a recommendation is good, never counts
// words, and never fires on a reply that simply mentions a letter. Only a reply that asks for a
// choice, and does not show one.

// Every form seen in this workspace's own transcripts, and each needs a table.
//
// F18 — `option B` FIRED ON A REFERENCE. `It was option B, which F replaced` is somebody naming a
// superseded option in the past tense, not asking anybody to pick one, and the check's own contract
// says it never fires on a reply that merely mentions a letter. The discriminator is position: an
// option being PRESENTED opens a clause, an option being REFERRED TO sits inside one. So that branch
// now needs a sentence start or a clause break in front of it. Bold is NOT such a marker: emphasis
// wraps a reference as readily as an offer, and allowing it put the false positive straight back.
//
// CASE-SENSITIVE ON THE LETTER, AND THAT IS THE WHOLE OF F17. This carried an `i` flag, so `[A-D]`
// matched the English article `a` — and `pick a file`, `select a row`, `choosing with a sign-in` all
// read as somebody naming option A. It fired on a reply that asked nothing, over a behaviour row
// reading `sends an organization id of their own choosing with a sign-in`. An option is written
// upper-case, always, so the letter is upper-case here and only the leading word is either case.
const ASKS = /\b(?:[Ss]ay|[Aa]nswer|[Rr]eply|[Pp]ick|[Cc]hoose|[Cc]hoosing|[Ss]elect)\s+(?:with\s+)?[`"*]?(?:Q\d+)?[A-D]\b|\b[Rr]ecommendation\s+is\s+[`"*]?[A-D]\b|(?:^|[.:;\u2014]\s+)\**[Oo]ption\s+[`"*]?[A-D]\b|\b[A-D]\s*,\s*[A-D]\s*(?:,\s*[A-D]\s*)?(?:or|\/)\s*[A-D]\b/;

/**
 * A SENTENCE THAT REPORTS AN ANSWER IS NOT ASKING FOR ONE, and the pattern above cannot tell the
 * two apart because both name a letter. It fired on *…found it builds one file per domain — option
 * B*, which told the developer that their ALREADY ANSWERED card turned out to match option B: a
 * sentence about a decision they had made, demanded back as a decision card.
 *
 * Counting options was the wrong cure — *Two ways: option A now, or wait* is a real offer with one
 * letter in it. What separates them is the FRAME: a report says the thing was answered, decided or
 * chosen. So a sentence carrying one of those words is set aside, and whatever is left is read for
 * an ask. A reply that is genuinely putting a choice does not describe it as already made.
 */
const REPORTS = /\b(?:answered|decided|chose|chosen|settled|recorded)\b/i;
// A FENCED BLOCK IS A QUOTATION, NOT AN ASK — finding F19, and this check found it on itself.
//
// The handover block the chapter REQUIRES names the cards a session is leaving open, and naming one
// means writing its recommendation: *the recommendation is D then A*. That is a sentence about a
// card, inside a fence, in a reply whose whole purpose is to stop. This check read it as putting a
// decision and demanded the card be written out in full — in a block whose shape the book fixes.
//
// **So the gate refused the one reply shape the book makes mandatory**, on its first day, and the
// reply that tripped it was correct. The same reasoning `split-plan.ts` already applies to card
// numbers holds here: a number inside a code span is an EXAMPLE, and a card named inside a fence is
// a reference. An ask is something you write to the reader, in prose, outside the quotation.
//
// Stripping fences does not weaken the real check: a card's options are a markdown TABLE, never a
// fence, so every genuine card survives this unchanged.
const FENCE = /```[\s\S]*?```/g;
const asking = (reply: string) =>
  ASKS.test(reply.replace(FENCE, " ").split(/(?<=[.!?\n])\s+/).filter((line) => !REPORTS.test(line)).join(" "));

// A markdown options table: a header row and the `| --- |` separator the grammar requires.
const TABLE = /^\|.*\|\s*$\n^\|[\s:-]*\|[\s:|-]*$/m;
// A lettered row inside a table — `| **A** | … | … |`. The shape the grammar actually asks for.
const LETTERED_ROW = /^\|\s*\**\s*[A-D]\s*\**\s*\|/m;

// THE CARD IS SIX PARTS AND THIS USED TO CHECK ONE. `refs/decision-cards.md` states the shape:
// number and summary, what, why, options, recommendation, preview. The gate tested for an options
// table and nothing else, so a reply carrying a heading, a table and two paragraphs was green —
// which is exactly what `008` sent, twice, with no `What`, no `Why` and no recommendation line.
//
// The developer's words are the contract (`Q258` `A`, 2026-09-24): *why ur not showing open question
// in correct format* · *prose should be always simple for chat as well as pages* · *when showing
// decision cards show information in detail such that devs can understand with context and take
// decision*.
//
// PRESENCE, NEVER QUALITY. This never reads whether a recommendation is good, never counts words and
// never scores an argument. A gate that judges prose is one people learn to write around, which is
// why `N43` step 5 was dropped. A part is here or it is not.
const NUMBERED = /\bQ\d+\b/;
// `What` and `Why` may be headings, bold leads or the `**What it changes**` form the pages use. What
// they may not be is absent — a reader deciding days later has only what the card carries.
const WHAT = /(^|\n)\s*(?:#{2,4}\s*|\*\*|<b>)?\s*What\b|\bwhat (?:it |this )?(?:changes|does|is being decided|it would change)\b/i;
const WHY = /(^|\n)\s*(?:#{2,4}\s*|\*\*|<b>)?\s*Why\b|\bwhat it costs to (?:leave|wait|do nothing)\b|\bwhat it blocks\b/i;
const RECOMMENDS = /\brecommend(?:ation|ed|s)?\b|\bI would take\b|\bthe one I would pick\b/i;

/** Which parts of the card a reply that puts a decision is missing, named one by one. */
function missingParts(reply: string): string[] {
  const out: string[] = [];
  if (!NUMBERED.test(reply)) out.push("**the number** — a card is `Q<n>`, stable across the whole exchange");
  if (!(TABLE.test(reply) && LETTERED_ROW.test(reply)))
    out.push("**the options as a lettered table**, the trade-off in its own column");
  if (!WHAT.test(reply)) out.push("**What** — the change concretely: the file, the rule, the before and after");
  if (!WHY.test(reply)) out.push("**Why** — what it costs to leave it alone, and what it blocks");
  if (!RECOMMENDS.test(reply)) out.push("**the recommendation** — one option, carrying the reason it wins");
  return out;
}

export function checkReplyShape(reply: string): Warning[] {
  if (!asking(reply)) return [];
  const missing = missingParts(reply);
  if (!missing.length) return [];
  return [{ check: "reply-shape", message:
    "Your reply puts a decision and the card is not whole. Missing: " + missing.join(" · ") + ". " +
    "A card put to a person in chat follows the same layout a document uses — MUST — and it assumes " +
    "**no memory of this session**, because people decide days later (refs/decision-cards.md). " +
    "Write it in full in the reply, with the detail to decide from, and put the same card on the " +
    "approach page." }];
}

/** The four arc-to-page checks, as warnings. */
export function checkArcToPage(root: string): Warning[] {
  const out: Warning[] = [];
  const pageless = pagelessWorkstreams(root);
  if (pageless.length)
    out.push({ check: "pageless", message:
      `An open workstream with arcs and no page — ${pageless.join(" · ")}. The arc is the plan and ` +
      `the page is what anybody reads, so a workstream with no page is work nobody can pick up. ` +
      `Give it an approach page in the fixed shape (05-artifacts.md, The approach document).` });

  const inArcs = cardsInArcs(root);
  if (inArcs.length)
    out.push({ check: "cards-in-arcs", message:
      `A card written into an arc while the page shows none — ` +
      inArcs.slice(0, 4).map(([subject, arc, card]) => `${card} in ${arc} (${subject})`).join(" · ") +
      `. An arc plans work and never holds a question. Move it to the page's \`Open\` as a \`Q<n>\` ` +
      `card, in the card pattern (refs/decision-cards.md).` });

  const stopped = stopsWithEmptyOpen(root);
  if (stopped.length)
    out.push({ check: "stopped-no-card", message:
      `A row waiting on the developer while \`Open\` carries no card — ` +
      stopped.slice(0, 4).map(([subject, row]) => `row ${row} in ${subject}`).join(" · ") +
      `. A stop is an open item like any other, and a question the plan knows about while the page ` +
      `says nothing is one nobody can answer. Write it as a \`Q<n>\` card in the page's \`Open\` ` +
      `(refs/decision-cards.md).` });

  const missing = unnamedArcs(root);
  if (missing.length)
    out.push({ check: "unnamed-arc", message:
      `An arc no split-plan row names — ` +
      missing.slice(0, 4).map(([subject, arc]) => `${arc} in ${subject}`).join(" · ") +
      `. An arc is the plan and the page is what anybody reads, so an arc nothing names is work that ` +
      `looks finished from the only surface they open. Add a row to that page's \`What is built\`, ` +
      `with its scope and its state (05-artifacts.md, How has two halves).` });
  return out;
}

// ---------------------------------------------------------------------------- the hook

// MATCHES THE BUNDLED NAME TOO, BY EXACT BASENAME. This hook ships built as `dist/events/stop.mjs`,
// so the guard also accepts that name — but only the exact basename, never a suffix: this file's own
// test imports it from `t-stop.mjs`, which `endsWith("stop.mjs")` also matches, and a loose check
// made the test's own filename trip the guard it was never meant to fire for.
const argv1Base = process.argv[1] ? basename(process.argv[1]) : "";
if (argv1Base === "stop.ts" || argv1Base === "stop.mjs") {
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch { /* no stdin: run as a check */ }
  let reply = "";
  try { reply = JSON.parse(input || "{}")?.last_assistant_message ?? ""; } catch { reply = input; }
  // THE EVENT'S OWN `cwd` FIRST, AND THEN THE WALK UP. This read `process.cwd()` and stopped there,
  // so every check was silent whenever the hook ran anywhere but the workspace root — which is most
  // of the time, because a session is usually rooted in one member. The Python it replaces took the
  // payload's `cwd` and walked up to `.spndevex/`; this now does the same.
  let start = "";
  try { start = JSON.parse(input || "{}")?.cwd ?? ""; } catch { start = ""; }
  const root = workspaceRoot(start || process.env.CLAUDE_PROJECT_DIR || process.cwd())
            ?? (start || process.env.CLAUDE_PROJECT_DIR || process.cwd());

  let facts: Record<string, unknown> = {};
  try { const j = JSON.parse(input || "{}"); facts = { event: "Stop", tool: null, session: j.session_id ?? null }; } catch { facts = { event: "Stop" }; }
  begin(facts, root);
  const warnings = [
    ...span("stop-reply-shape", () => checkReplyShape(reply)),
    ...span("stop-arc-to-page", () => checkArcToPage(root)),
    ...span("stop-runnable", () => checkRunnable(root)),
    ...span("stop-hold", () => checkHold(root)),
    ...span("stop-handover", () => checkHandover(reply, root)),
    ...span("stop-corpus", () => checkCorpus(root)),
  ];
  end();
  // AFTER the checks, never before: they compare against this and would compare against now.
  rememberStop(root);
  rememberSteps(root);
  if (warnings.length) {
    console.error(warnings.map((w) => `[${w.check}] ${w.message}`).join("\n\n"));
    process.exit(2);   // a Stop hook's non-zero is how the message reaches the turn
  }
  process.exit(0);
}
