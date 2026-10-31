// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Questions are records, and every card is one rendered
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The three checks that hold every card on a page to its record in `questions.jsonl`:
//
//   hand-made   no card on a page that is not in the record      the PreToolUse hook, on a write to a page
//   on-page     no open record without its card on the approach page    `workstream state check`
//   same        each page's card equal to its record's            `workstream state check`
//
// A CARD IS THE MARKUP, NOT THE ANCHOR. An answered card leaves its `q<n>` anchor on the statement in
// `What`, so only a `div.sds-open` holding an `h4` with that id is read as a card.

import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type Payload, type Verdict } from "../lib/payload.ts";
import {
  approachOf, arcIdsOf, arcRepos, blockAt, cardHtml, fromWorkstream, isDataLayout, readArc, readQuestions, workspaceOf, workstreamAround,
} from "../lib/workstream.ts";
import { isBuilderWorkspace } from "../lib/builder.ts";
import { runsTheWork } from "./how-it-runs.ts";
import { type Question } from "../lib/workstream-schema.ts";

export type CardOnPage = { id: string; html: string; from: number; inBlock: boolean };

/** Every card of a page: its id, its markup, where it starts, and whether it stands inside the `open` block. */
export function cardsOn(text: string): CardOnPage[] {
  const block = blockAt(text, "open");
  const out: CardOnPage[] = [];
  for (const found of text.matchAll(/<div class="sds-open">/g)) {
    const from = found.index!;
    let depth = 0;
    let end = -1;
    for (const tag of text.slice(from).matchAll(/<div\b|<\/div>/g)) {
      depth += tag[0] === "</div>" ? -1 : 1;
      if (depth === 0) { end = from + tag.index! + tag[0].length; break; }
    }
    if (end < 0) continue;
    const html = text.slice(from, end);
    const id = /<h4 id="(q\d+)"/.exec(html)?.[1];
    if (!id) continue;
    out.push({ id, html, from, inBlock: !!block && from >= block.inner && from < block.innerEnd });
  }
  return out;
}

/** Markup compared as a reader would: whitespace between and around tags collapsed. */
const same = (html: string): string => html.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();

/** The cards a written page holds outside the `open` block that the page on disk did not, each as its refusal. */
export function handMadeCards(before: string, after: string, records: readonly Question[]): string[] {
  const outside = (text: string) => new Map(cardsOn(text).filter((card) => !card.inBlock).map((card) => [card.id, same(card.html)]));
  const was = outside(before);
  const out: string[] = [];
  for (const [id, html] of outside(after)) {
    if (was.get(id) === html) continue;
    out.push(records.some((record) => record.id === id)
      ? `${id}'s card stands outside the open block — only \`workstream question\` writes a card, from its record`
      : `${id} has no record: raise it with \`workstream question raise\``);
  }
  return out;
}

/** Each open record whose card is not on the approach page. */
export function openWithoutCard(ws: string, records: readonly Question[] = readQuestions(ws)): string[] {
  const page = approachOf(ws);
  const text = page ? readFileSync(page, "utf8") : "";
  const shown = new Set(cardsOn(text).filter((card) => card.inBlock).map((card) => card.id));
  const name = page ? basename(page) : "approach.html";
  return records.filter((record) => record.state === "open" && !shown.has(record.id))
    .map((record) => `${record.id} is open and its card is not on ${name}`);
}

/**
 * Each card a page shows that differs from its record, is not open, or is missing where the record
 * says it is shown: the approach page, and every preview a record names.
 */
export function cardsDiffer(ws: string, records: readonly Question[] = readQuestions(ws)): string[] {
  const out: string[] = [];
  const byId = new Map(records.map((record) => [record.id, record]));
  // An answered or withdrawn card has left every page, so a page it names that is gone is no finding.
  const pages = new Set<string>(records.filter((record) => record.state === "open").flatMap((record) => record.shownIn));
  const approach = approachOf(ws);
  if (approach) pages.add(fromWorkstream(ws, approach));
  for (const rel of [...pages].sort()) {
    let text = "";
    try { text = readFileSync(join(ws, rel), "utf8"); } catch { out.push(`${rel} is named by a card's \`shownIn\` and is not there`); continue; }
    const isApproach = approach !== null && resolve(join(ws, rel)) === resolve(approach);
    const cards = cardsOn(text).filter((card) => card.inBlock);
    const name = basename(rel) === "preview.html" ? rel : basename(rel);
    for (const card of cards) {
      const record = byId.get(card.id);
      if (!record) { out.push(`${name}'s ${card.id} has no record`); continue; }
      if (record.state !== "open") { out.push(`${card.id} is ${record.state} and its card still stands on ${name}`); continue; }
      if (same(card.html) !== same(cardHtml(record, ""))) out.push(`${name}'s ${card.id} differs from its record`);
    }
    if (isApproach) continue;
    const onPage = new Set(cards.map((card) => card.id));
    for (const record of records)
      if (record.state === "open" && record.shownIn.includes(rel) && !onPage.has(record.id))
        out.push(`${record.id} is shown in ${name} by its record, and its card is not there`);
  }
  return out;
}

/** Whether the workstream changes the agent itself: the builder's workspace, and an arc that reaches the marketplace. */
function agentIsTheSubject(ws: string): boolean {
  const root = workspaceOf(ws);
  if (!root || !isBuilderWorkspace(root)) return false;
  return arcIdsOf(ws).some((arc) => {
    const data = readArc(ws, arc);
    return !!data && arcRepos(data).includes("spn-claude-marketplace");
  });
}

/**
 * The refusal for a card or suggestion that asks how the work runs, or null. It is refused when its title and every
 * option are acts of running the work (how-it-runs' list); a workstream that changes the agent passes whole.
 *
 * @param ws       the workstream the card or suggestion is raised in
 * @param title    its title
 * @param options  what each option does, empty for a suggestion
 */
export function runningWorkFault(ws: string, title: string, options: readonly string[] = []): string | null {
  const kinds = [title, ...options].map((one) => runsTheWork(one));
  if (kinds.some((one) => one === null) || agentIsTheSubject(ws)) return null;
  return `Refused: it asks how the work runs. Its question${options.length ? " and every option are" : " is"} acts the agent decides ` +
    `(${[...new Set(kinds)].join(", ")}). Decide it, log it in the arc, and say the outcome in one line. ` +
    `A card is for a goal, a construct, a requirement or a boundary (RULE.DEVEX.WORKSPACE.468).`;
}

/** The pages a hand-made card is judged on: the approach page and a preview, in a workstream kept as data. */
function judged(path: string): string | null {
  if (!/\.html$/.test(path)) return null;
  const ws = workstreamAround(path);
  if (!ws || !isDataLayout(ws)) return null;
  const name = basename(path);
  if (name === "approach.html" || /\/notes\/N\d+[a-z]?\/preview\.html$/.test(resolve(path).split("\\").join("/"))) return ws;
  return null;
}

/** The PreToolUse check: a write that puts a card on a page by hand is refused. */
export function checkQuestions(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  if (!supplied.file_path) return null;
  const path = resolve(payload.cwd ?? process.cwd(), supplied.file_path);
  const ws = judged(path);
  if (!ws) return null;
  let before = "";
  try { before = readFileSync(path, "utf8"); } catch { before = ""; }
  let after: string;
  if (supplied.content !== undefined) after = supplied.content;
  else if (supplied.old_string !== undefined && supplied.new_string !== undefined)
    after = supplied.replace_all ? before.split(supplied.old_string).join(supplied.new_string) : before.replace(supplied.old_string, () => supplied.new_string!);
  else return null;
  const faults = handMadeCards(before, after, readQuestions(ws));
  if (!faults.length) return null;
  return { deny: `Denied: ${faults.join("; ")}. A card on a page is its record in \`questions.jsonl\`, rendered by the \`open\` block ` +
    `(01-workstream.md § Questions are records, and every card is one rendered).` };
}

export const applies = (path: string): boolean => path.endsWith(".html");
