// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Questions are records, and every card is one rendered
//           RULE.DEVEX.WORKSPACE.491 and .492, a proposal starts from the construct that exists, and its views are fresh and on record; RULE.DEVEX.AGENT.168
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
import { SIGNS, cardName, raisedCardFaults, type Card, type Question, type Suggestion } from "../lib/workstream-schema.ts";
import { existsSync } from "node:fs";
import { panelOnRecord, panelsVisible } from "./split-plan.ts";
import { notesDirOf, readJsonl, suggestionsFileOf } from "../lib/workstream.ts";

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
      ? `${cardName(id)}'s card stands outside the open block — only \`workstream question\` writes a card, from its record`
      : `${cardName(id)} has no record: raise it with \`workstream question raise\``);
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
    .map((record) => `${cardName(record.id)} is open and its card is not on ${name}`);
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
      if (!record) { out.push(`${name}'s ${cardName(card.id)} has no record`); continue; }
      if (record.state !== "open") { out.push(`${cardName(card.id)} is ${record.state} and its card still stands on ${name}`); continue; }
      if (same(card.html) !== same(cardHtml(record, ""))) out.push(`${name}'s ${cardName(card.id)} differs from its record`);
    }
    if (isApproach) continue;
    const onPage = new Set(cards.map((card) => card.id));
    for (const record of records)
      if (record.state === "open" && record.shownIn.includes(rel) && !onPage.has(record.id))
        out.push(`${cardName(record.id)} is shown in ${name} by its record, and its card is not there`);
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

/** The repositories a text cites by path: the first segment of a cited path that names a `spn-` repository or a folder of the workspace holding a `sprepo.json`. */
export function reposCited(text: string, root: string | null): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/(?<![\w./-])([\w.-]+)\/[\w./-]+\.\w+(?::\d+)?/g)) {
    const first = match[1];
    if (/^spn-[a-z0-9-]+$/.test(first) || (root && existsSync(join(root, first, "sprepo.json")))) found.add(first);
  }
  return [...found].sort();
}

/** The one note printed where a card has FRESH views and recording is off, so no panel launch can be seen. */
export const PANELS_BLIND = "Note: telemetry recording is off, so a panel's launch can't be seen; the fresh views' words files were checked and the launches were accepted (RULE.DEVEX.WORKSPACE.492).";

/** A view's lens as the telemetry row names it: `Server dev` and `server-dev` both read `SERVER_DEV`. */
export const lensKey = (lens: string): string => lens.trim().toUpperCase().replace(/[\s-]+/g, "_");

/**
 * What a card raised now (or a suggestion added with a card) must hold on top of its shape (RULE.DEVEX.WORKSPACE.491 and .492, .168): the
 * nearest construct exists, the repository sign follows the paths the What cites, the fresh views its signs call for are made and on
 * record, a leave-it is there, and in the builder's workspace a gap links the suggestion that fills it. NEVER RUN ON A RECORD READ, so a
 * card raised before it turns no workstream red. Returns the faults and the signs the card carries once the repository sign is added.
 */
export function raiseFaults(ws: string, arc: string, card: Card, root: string | null): { faults: string[]; signs: string[] } {
  const faults = raisedCardFaults(card);
  const signs = new Set<string>((Array.isArray(card.signs) ? card.signs : []).filter((sign) => (SIGNS as readonly string[]).includes(sign)));
  if (reposCited(card.what ?? "", root).length >= 2) signs.add("CROSSES_REPO");
  const nearest = typeof card.nearest === "string" ? card.nearest.trim() : "";
  if (nearest && nearest !== "none") {
    const path = nearest.replace(/:\d+$/, "");
    const places = [root ? resolve(root, path) : "", resolve(path), resolve(ws, path)].filter(Boolean);
    if (!places.some((place) => existsSync(place))) faults.push(`\`nearest\` \`${nearest}\` is no path that exists: name the nearest construct by a path, or \`"none"\``);
  } else if (nearest === "none" && root && isBuilderWorkspace(root)) {
    const named = `${card.others ?? ""} ${card.what ?? ""}`.match(/\bS\d+\b/gi) ?? [];
    const held = new Set(readJsonl(suggestionsFileOf(ws)).map((one) => (one as Suggestion | undefined)?.id));
    if (!named.some((one) => held.has(one.toLowerCase())))
      faults.push("`nearest` is `none`, and in the builder's workspace the gap is a suggestion that improves the book (RULE.DEVEX.AGENT.168): raise it, and name its `S<n>` in `others` or the What");
  }
  const views = Array.isArray(card.views) ? card.views : [];
  const fresh = views.filter((view) => view?.made === "FRESH");
  if (signs.size >= 2 && fresh.length < signs.size) faults.push(`${signs.size} signs of complexity (${[...signs].join(", ")}) call for ${signs.size} FRESH views, and the card has ${fresh.length}`);
  if (signs.has("CHANGES_PARTNER_SURFACE") && !fresh.some((view) => lensKey(view.lens ?? "") === "PARTNER"))
    faults.push("CHANGES_PARTNER_SURFACE calls for a FRESH view whose lens is PARTNER");
  const seen = root ? panelsVisible(root) : false;
  for (const view of fresh) {
    const where = `the FRESH ${view.lens} view`;
    const words = typeof view.words === "string" ? view.words.replace(/^notes\/N\d+[a-z]?\/work\//, "") : "";
    const base = join(notesDirOf(ws, arc), "work");
    const file = words ? resolve(base, words) : "";
    if (!file || !file.startsWith(`${base}/`) || !existsSync(file)) faults.push(`${where}'s words file \`${view.words ?? ""}\` is not in ${arc}'s notes work folder`);
    if (root && seen && !panelOnRecord(root, basename(ws), arc, null, null, lensKey(view.lens ?? "")))
      faults.push(`${where} has no panel launch for ${lensKey(view.lens ?? "")} on record for ${basename(ws)}/${arc}: convene \`spn-devex:spn-panel\` with that lens, naming \`${basename(ws)}/${arc}\`, and keep its whole words in the work folder`);
  }
  return { faults, signs: [...signs] };
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
