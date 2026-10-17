// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Questions are records, and every card is one rendered
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream question raise <arc> --file card.json
//   spn-devex workstream question show <qN> --in <notes/N<nnn>/preview.html>
//   spn-devex workstream question answer <qN> --key A --words "…"
//   spn-devex workstream question withdraw <qN> --words "…"
//
// The only writers of `questions.jsonl`. Each write renders every page's `open` block from the
// records, so a card is the same wherever it stands and leaves every page in the same write.

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { type Action, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import {
  approachOf, fromWorkstream, logEvent, now, questionsFileOf, readArc, readQuestions, resolveRef, writeJsonl, writeOpenBlocks,
} from "../../lib/workstream.ts";
import { isFile } from "../../lib/payload.ts";
import { QUESTION_ID, cardFaults, type Card, type Question } from "../../lib/workstream-schema.ts";
import { afterWrite, arcNamed, typed } from "./_shared.ts";

export const describe = "a question card, from raised to answered or withdrawn: the record and every page's Open";

/** The next question number: one past the highest the records hold or the approach page carries as an anchor. */
export function nextQuestionId(records: readonly Question[], page: string): string {
  const numbers = [...records.map((one) => Number(one.id.slice(1))),
    ...[...page.matchAll(/\bid="q(\d+)"/g)].map((found) => Number(found[1]))];
  return `q${Math.max(0, ...numbers) + 1}`;
}

/** The record a reference names, and its workstream. */
function recordNamed(ref: string | undefined): { ws: string; records: Question[]; record: Question } {
  if (!ref) throw new UsageFault("needs a question, as `q<n>` or `<workstream>/q<n>`.");
  const { ws, id } = typed(() => resolveRef(ref, (folder, question) => readQuestions(folder).some((one) => one.id === question)));
  if (!QUESTION_ID.test(id)) throw new UsageFault(`reads \`${id}\` as no question — a question is \`q<n>\`.`);
  const records = readQuestions(ws);
  const record = records.find((one) => one.id === id);
  if (!record) throw new UsageFault(`finds no ${id} in ${basename(ws)}'s questions.jsonl.`);
  return { ws, records, record };
}

/** The pages a card stands on: the approach page, and each preview it is shown in. */
const pagesOf = (record: Question): number => 1 + record.shownIn.length;

function finish(ws: string, records: Question[]): string[] {
  writeJsonl(questionsFileOf(ws), records);
  const { skipped } = writeOpenBlocks(ws, records);
  return [...skipped.map((line) => `! ${line}`), ...afterWrite(ws)];
}

function raise(args: string[]): number {
  const words = readWords(args, { file: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const file = words.value("file");
  if (!file) throw new UsageFault("needs `--file card.json`: the card with its title.");
  let card: Card & { title?: string };
  try { card = JSON.parse(readFileSync(resolve(file), "utf8")); } catch { throw new UsageFault(`reads no JSON at \`${file}\`.`); }
  const faults = [...(typeof card.title === "string" && card.title.trim() ? [] : ["the card has no `title`"]), ...cardFaults(card)];
  if (faults.length) throw new UsageFault(`refuses a card with a part missing: ${faults.join("; ")}.`);
  const records = readQuestions(ws);
  const page = approachOf(ws);
  const id = nextQuestionId(records, page ? readFileSync(page, "utf8") : "");
  const { title, ...rest } = card;
  const record: Question = { id, arc, title: title!, state: "open", raised: now(), shownIn: [],
    card: { why: rest.why, what: rest.what, viewsLead: rest.viewsLead, views: rest.views, options: rest.options, recommended: rest.recommended }, answer: null };
  records.push(record);
  const lines = finish(ws, records);
  if (readArc(ws, arc)) logEvent(ws, arc, "question", null, `${id} raised · ${title}`);
  const open = records.filter((one) => one.state === "open").map((one) => one.id.replace(/^q/, "Q")).join(" · ");
  console.log(`${id} · open · ${page ? basename(page) : "approach.html"} Open — ${open}`);
  for (const line of lines) console.log(line);
  return 0;
}

function show(args: string[]): number {
  const words = readWords(args, { in: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one question.");
  const { ws, records, record } = recordNamed(ref);
  const target = words.value("in");
  if (!target) throw new UsageFault("needs `--in <notes/N<nnn>/preview.html>`.");
  const path = isFile(resolve(target)) ? resolve(target) : resolve(ws, target);
  const rel = fromWorkstream(ws, path);
  if (!/^notes\/N\d+[a-z]?\/preview\.html$/.test(rel) || !isFile(path)) throw new UsageFault(`shows a card on an arc's preview, \`notes/N<nnn>/preview.html\`, and \`${target}\` is none.`);
  if (record.state !== "open") throw new UsageFault(`shows an open card, and ${record.id} is ${record.state}.`);
  if (!record.shownIn.includes(rel)) record.shownIn.push(rel);
  const lines = finish(ws, records);
  console.log(`${record.id} · shown in ${record.shownIn.length} preview${record.shownIn.length === 1 ? "" : "s"}`);
  for (const line of lines) console.log(line);
  return 0;
}

function settle(args: string[], state: "answered" | "withdrawn"): number {
  const words = readWords(args, state === "answered" ? { key: VALUE, words: VALUE } : { words: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one question.");
  const { ws, records, record } = recordNamed(ref);
  if (record.state !== "open") throw new UsageFault(`settles an open card, and ${record.id} is ${record.state}.`);
  const said = words.value("words");
  if (!said) throw new UsageFault("needs `--words \"…\"`: your words, as you gave them.");
  const key = state === "answered" ? words.value("key") : null;
  if (state === "answered" && (!key || !record.card.options.some((option) => option.key === key)))
    throw new UsageFault(`needs \`--key\`, one of ${record.card.options.map((option) => option.key).join(" · ")}.`);
  const off = pagesOf(record);
  record.state = state;
  record.answer = { key, words: said, at: now() };
  const lines = finish(ws, records);
  if (readArc(ws, record.arc)) logEvent(ws, record.arc, state, null, `${record.id}${key ? ` ${key}` : ""} · ${said}`);
  const owed = state === "answered" ? `owed: ${record.arc}'s What, its Log line` : "owed: its Log line";
  console.log(`${record.id} · ${state}${key ? ` ${key}` : ""} · off ${off} page${off === 1 ? "" : "s"} · ${owed}`);
  for (const line of lines) console.log(line);
  return 0;
}

export const actions: Record<string, Action> = {
  raise: { describe: "raise a card: the next number, the record, the card in the approach page's Open", usage: "<arc> --file card.json", run: raise },
  show: { describe: "show an open card on an arc's preview, in its Open", usage: "<qN> --in <notes/N<nnn>/preview.html>", run: show },
  answer: { describe: "answer a card in your words; it leaves every Open", usage: "<qN> --key <option> --words \"…\"", run: (args) => settle(args, "answered") },
  withdraw: { describe: "withdraw a card in your words; it leaves every Open", usage: "<qN> --words \"…\"", run: (args) => settle(args, "withdrawn") },
};
