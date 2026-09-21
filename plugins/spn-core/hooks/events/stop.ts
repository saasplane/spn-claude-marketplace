#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-foundation/01-devex/11-workspace.md § The arc · § How the agent replies
//           docs/04-capabilities/01-foundation/02-docs/05-artifacts.md § The approach document
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The Stop checks. They read what the turn is about to leave behind, and warn — never refuse, because
// the turn is already written and a refusal would only lose it.
//
//   runnable   a turn that ends while the running arc still has rows to do, and nothing blocks them
//   hold       an arc whose status reads HELD must name a card that exists and is unanswered
//   handover   a reply that says a new window is needed carries the seven fields
//
// `runnable` is the one the developer asked for by name: *you keep getting stuck after reporting, and
// you should continue when there is no blocker.* Reporting is not stopping. A milestone line belongs
// between steps, in the same turn as the next step.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { cardsOf, openWorkstreams, rowsOf, stateOf } from "../checks/split-plan.ts";
import { workspaceRoot } from "../lib/payload.ts";
import { begin, span, end } from "../lib/timing.ts";

type Warning = { check: string; message: string };

const HANDOVER_FIELDS = ["workstream", "arc", "model", "read first", "state", "done when", "do not touch", "open"];
const DONE_MARKS = ["✅", "↷", "⊘", "landed", "carried", "deferred"];

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

/** An arc's status word, from the first `Status:` line. */
function statusOf(arc: string): string {
  const m = read(arc).match(/^Status:\s*\*\*([A-Z]+)/m);
  return m ? m[1] : "";
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
    const row = cells.join(" ");
    if (!DONE_MARKS.some((m) => row.includes(m))) out.push(`step ${cells[0]} — ${cells[1].slice(0, 70)}`);
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

export function checkRunnable(root: string): Warning[] {
  const out: Warning[] = [];
  for (const ws of openWorkstreamFolders(root)) {
    const cards = pagesOf(ws).flatMap(openCards);
    for (const arc of arcsOf(ws)) {
      // Only the arc being executed. DECIDED means planned and waiting its turn, and warning about
      // every planned arc would make the check noise on the first day of a workstream.
      if (statusOf(arc) !== "RUNNING") continue;
      const steps = unfinishedSteps(arc);
      if (steps === null) {
        out.push({ check: "runnable", message: `\`${arc.split("/").pop()}\` is RUNNING and has no \`## Steps\` table, so nothing can say whether work is left. Give it the step table the arc template carries.` });
        continue;
      }
      const left = steps;
      if (!left.length) continue;
      if (cards.length) continue;   // a card blocks: the hold reply covers that case
      out.push({
        check: "runnable",
        message: `stopped with runnable work — \`${arc.split("/").pop()}\` is RUNNING and ${left.length} step` +
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
export function checkHandover(reply: string): Warning[] {
  if (!/\b(?:new|fresh|another|next) window\b|\bhand(?:ing)? (?:this |it )?over\b|^[ \t]{0,3}#{0,4}[ \t]*handover\b/im.test(reply)) return [];
  const fenced = [...reply.matchAll(/```[\s\S]*?```/g)].map((m) => m[0].toLowerCase());
  const block = fenced.find((f) => /workstream/.test(f) && /arc/.test(f));
  if (!block)
    return [{ check: "handover", message: "this reply says a new window is needed and carries no handover block. Give the seven fields in a fenced block — workstream, arc and step, model, read first, state, done when, do not touch, open — and write the same block into the arc's log." }];
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
const ASKS = /\b(?:[Ss]ay|[Aa]nswer|[Rr]eply|[Pp]ick|[Cc]hoose|[Cc]hoosing|[Ss]elect)\s+(?:with\s+)?[`"*]?(?:Q\d+)?[A-D]\b|\b[Rr]ecommendation\s+is\s+[`"*]?[A-D]\b|(?:^|[.:;—]\s+)\**[Oo]ption\s+[`"*]?[A-D]\b|\b[A-D]\s*,\s*[A-D]\s*(?:,\s*[A-D]\s*)?(?:or|\/)\s*[A-D]\b/;
// A markdown options table: a header row and the `| --- |` separator the grammar requires.
const TABLE = /^\|.*\|\s*$\n^\|[\s:-]*\|[\s:|-]*$/m;
// A lettered row inside a table — `| **A** | … | … |`. The shape the grammar actually asks for.
const LETTERED_ROW = /^\|\s*\**\s*[A-D]\s*\**\s*\|/m;

export function checkReplyShape(reply: string): Warning[] {
  if (!ASKS.test(reply)) return [];
  if (TABLE.test(reply) && LETTERED_ROW.test(reply)) return [];
  return [{ check: "reply-shape", message:
    "Your reply asks for a lettered choice and shows no options table. A card put to a person in " +
    "chat follows the same layout a document uses — MUST: the choice as a numbered `Q<n>`, what it " +
    "changes, what it costs to leave, and **the options as a table, lettered, with the trade-off in " +
    "its own column** (05-artifacts.md, The approach document). Naming A and B without showing them " +
    "asks somebody to choose between things they cannot see. Put the card on the approach page, and " +
    "say in the reply that it is there." }];
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

if (process.argv[1] && process.argv[1].endsWith("stop.ts")) {
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
    ...span("stop-handover", () => checkHandover(reply)),
  ];
  end();
  if (warnings.length) {
    console.error(warnings.map((w) => `[${w.check}] ${w.message}`).join("\n\n"));
    process.exit(2);   // a Stop hook's non-zero is how the message reaches the turn
  }
  process.exit(0);
}
