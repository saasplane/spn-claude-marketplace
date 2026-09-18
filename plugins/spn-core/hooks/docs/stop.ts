#!/usr/bin/env node
// RESTATES: spn-foundation docs/03-capabilities/04-devex/11-workspace.md § The arc · § How the agent replies
//           docs/03-capabilities/05-docs/05-artifacts.md § The approach document
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
import { join } from "node:path";
import { begin, span, end } from "./timing.ts";

type Warning = { check: string; message: string };

const HANDOVER_FIELDS = ["workstream", "arc", "model", "read first", "state", "done when", "do not touch", "open"];
const DONE_MARKS = ["✅", "↷", "⊘", "landed", "carried", "deferred"];

function read(p: string): string {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function openWorkstreams(root: string): string[] {
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

/** A card that is open and unanswered: it carries no Decision. */
function openCards(page: string): string[] {
  const src = read(page);
  const sec = src.match(/<section id="s4"[\s\S]*?<\/section>/);
  if (!sec) return [];
  const out: string[] = [];
  for (const m of sec[0].matchAll(/<h4 id="(q\d+)"[\s\S]*?(?=<h4 id="q|<\/section>)/gi)) {
    if (!/<b>\s*Decision/i.test(m[0])) out.push(m[1].toUpperCase());
  }
  return out;
}

export function checkRunnable(root: string): Warning[] {
  const out: Warning[] = [];
  for (const ws of openWorkstreams(root)) {
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
  for (const ws of openWorkstreams(root)) {
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

export function checkHandover(reply: string): Warning[] {
  if (!/new window|fresh window|another window|hand this over|handover/i.test(reply)) return [];
  const fenced = [...reply.matchAll(/```[\s\S]*?```/g)].map((m) => m[0].toLowerCase());
  const block = fenced.find((f) => /workstream/.test(f) && /arc/.test(f));
  if (!block)
    return [{ check: "handover", message: "this reply says a new window is needed and carries no handover block. Give the seven fields in a fenced block — workstream, arc and step, model, read first, state, done when, do not touch, open — and write the same block into the arc's log." }];
  const missing = HANDOVER_FIELDS.filter((f) => !block.includes(f));
  if (missing.length)
    return [{ check: "handover", message: `the handover block is missing ${missing.join(" · ")}. The next window starts from that block and has nothing else.` }];
  return [];
}

// ---------------------------------------------------------------------------- the hook

if (process.argv[1] && process.argv[1].endsWith("stop.ts")) {
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch { /* no stdin: run as a check */ }
  let reply = "";
  try { reply = JSON.parse(input || "{}")?.last_assistant_message ?? ""; } catch { reply = input; }
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

  let facts: Record<string, unknown> = {};
  try { const j = JSON.parse(input || "{}"); facts = { event: "Stop", tool: null, session: j.session_id ?? null }; } catch { facts = { event: "Stop" }; }
  begin(facts, root);
  const warnings = [
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
