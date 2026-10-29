// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The change sheet is the arc's data · § The formats
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream sheet write <workstream>/N<nnn> --file <sheet.json>
//   spn-devex workstream sheet edit  <workstream>/N<nnn> <E> [--what …] [--op …] [--file …] [--decided-by …] [--facts …] [--then …] …
//   spn-devex workstream sheet drop  <workstream>/N<nnn> <E> --note "…"
//   spn-devex workstream sheet show  <workstream>/N<nnn> [--row <id>] [--json]
//   spn-devex workstream sheet check <workstream>/N<nnn>
//
// The sheet is the arc's data, `arcs/N<nnn>/sheet.json`, and these commands write it. A gap is refused where it is written:
// every entry is validated, and every fact it cites must be one the arc's `facts.jsonl` holds. An arc with no `sheet.json` is
// judged as it was before sheets, so `show` and `check` say so and exit 0, and `write` creates the file.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { logEvent, readArc, readJsonl, readQuestions, readSheet, factsFileOf, sheetFileOf, writeWhole } from "../../lib/workstream.ts";
import { ENTRY_OPS, parentIds, sheetFaults, type ArcData, type Fact, type Sheet, type SheetEntry } from "../../lib/workstream-schema.ts";
import { arcNamed, listOf } from "./_shared.ts";

export const describe = "the arc's change sheet: write it whole, edit or drop one entry, show it, check it against the rows and the cards";

/** Each fault of a sheet as the arc would hold it: its schema, and every fact an entry cites being one the arc's facts hold. */
function writeFaults(ws: string, arc: string, sheet: Sheet, whole: boolean): string[] {
  const out = sheetFaults(sheet);
  if (whole && sheet.stack === null) out.push("the sheet's `stack` is null — name the folder the tiers run from, the dmo version and the reset");
  const held = new Set(readJsonl(factsFileOf(ws, arc)).map((line) => (line as Fact | undefined)?.id));
  for (const entry of Array.isArray(sheet.entries) ? sheet.entries : [])
    for (const id of Array.isArray(entry?.facts) ? entry.facts : [])
      if (typeof id === "string" && !held.has(id)) out.push(`${entry.id} cites ${id}, which ${arc}'s facts do not hold`);
  return out;
}

/** A refusal in the form every sheet write ends on: the faults, then that nothing was written. */
function refused(faults: string[]): number {
  console.log(`Refused: ${faults.join(" · ")}. Nothing was written.`);
  return 1;
}

function sheetOf(ws: string, arc: string): Sheet {
  const sheet = readSheet(ws, arc);
  if (!sheet) throw new UsageFault(`finds no sheet for ${arc}: \`sheet write ${arc} --file <sheet.json>\` writes it.`);
  return sheet;
}

const save = (ws: string, arc: string, sheet: Sheet): void => writeWhole(sheetFileOf(ws, arc), `${JSON.stringify(sheet, null, 2)}\n`);

function write(args: string[]): number {
  const words = readWords(args, { file: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const file = words.value("file");
  if (!file) throw new UsageFault("needs `--file <sheet.json>`, the whole sheet.");
  let data: unknown;
  try { data = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")); }
  catch (thrown) { throw new UsageFault(`reads \`${file}\` as no JSON: ${(thrown as Error).message}.`); }
  const faults = writeFaults(ws, arc, data as Sheet, true);
  if (faults.length) return refused(faults);
  save(ws, arc, data as Sheet);
  const count = (data as Sheet).entries.length;
  logEvent(ws, arc, "sheet", null, `written · ${count} entries`);
  console.log(`ok · ${arc} sheet written · ${count} entries`);
  return 0;
}

/** `--tiers unit=ID,ID;contract=ID` as an object from a tier to its ids; `none` is no tier. */
function tiersOf(text: string): Record<string, string[]> {
  if (text.trim() === "none") return {};
  const out: Record<string, string[]> = {};
  for (const part of text.split(";").map((one) => one.trim()).filter(Boolean)) {
    const [tier, ids] = part.split("=");
    if (!tier || ids === undefined) throw new UsageFault(`reads \`${part}\` as no tier: \`--tiers\` is \`unit=ID,ID;contract=ID\`, or \`none\`.`);
    out[tier.trim()] = ids.split(",").map((id) => id.trim()).filter(Boolean);
  }
  return out;
}

const EDIT_LISTS: Record<string, keyof SheetEntry> = {
  "decided-by": "decidedBy", facts: "facts", then: "then", rules: "rules", callers: "callers", docs: "docs", book: "book",
};

function edit(args: string[]): number {
  const words = readWords(args, {
    what: VALUE, op: ENTRY_OPS, file: VALUE, "decided-by": VALUE, facts: VALUE, then: VALUE, rules: VALUE, callers: VALUE, docs: VALUE, book: VALUE, tiers: VALUE,
  });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet edit <workstream>/N<nnn> <E> [--what …] [--tiers …] …`.");
  const { ws, arc } = arcNamed(ref);
  const sheet = sheetOf(ws, arc);
  const at = sheet.entries.findIndex((one) => one.id === id);
  if (at < 0) throw new UsageFault(`finds no entry ${id} in ${arc}'s sheet — \`sheet write ${arc} --file <sheet.json>\` adds it.`);
  const next: SheetEntry = { ...sheet.entries[at] };
  const changed: string[] = [];
  for (const name of ["what", "op", "file"] as const) {
    const value = words.value(name);
    if (value !== null) { next[name] = value; changed.push(name); }
  }
  for (const [option, field] of Object.entries(EDIT_LISTS)) {
    const list = listOf(words, option);
    if (list) { (next as Record<string, unknown>)[field] = list; changed.push(field); }
  }
  const tiers = words.value("tiers");
  if (tiers !== null) { next.tiers = tiersOf(tiers); changed.push("tiers"); }
  if (!changed.length) throw new UsageFault("changes nothing: name a field to change.");
  const entries = sheet.entries.map((one, place) => (place === at ? next : one));
  const faults = writeFaults(ws, arc, { ...sheet, entries }, false);
  if (faults.length) return refused(faults);
  save(ws, arc, { ...sheet, entries });
  logEvent(ws, arc, "sheet", null, `${id} edited · ${changed.join(", ")}`);
  console.log(`ok · ${arc} sheet · ${id} · ${changed.join(", ")}`);
  return 0;
}

function drop(args: string[]): number {
  const words = readWords(args, { note: VALUE });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet drop <workstream>/N<nnn> <E> --note \"…\"`.");
  const note = words.value("note");
  if (!note?.trim()) throw new UsageFault(`drops ${id} with \`--note\` carrying why the entry is no longer needed.`);
  const { ws, arc } = arcNamed(ref);
  const sheet = sheetOf(ws, arc);
  if (!sheet.entries.some((one) => one.id === id)) throw new UsageFault(`finds no entry ${id} in ${arc}'s sheet.`);
  save(ws, arc, { ...sheet, entries: sheet.entries.filter((one) => one.id !== id) });
  logEvent(ws, arc, "sheet", null, `${id} dropped · ${note}`);
  console.log(`ok · ${arc} sheet · ${id} dropped`);
  return 0;
}

/** A file as a printed line shortens it: the path from its last three parts on. */
function shortFile(file: string): string {
  const path = file.slice(file.indexOf(":") + 1);
  const parts = path.split("/").filter(Boolean);
  const tail = path.endsWith("/") ? "/" : "";
  return parts.length > 3 ? `…/${parts.slice(-3).join("/")}${tail}` : path;
}

/** A generator command as its verb: `spnutils apps gen-barrel mod` reads `gen-barrel`. */
const verbOf = (command: string): string => {
  const parts = command.trim().split(/\s+/);
  return /^(?:spnutils|spn-devex)$/.test(parts[0]) && parts.length > 2 ? parts[2] : command;
};

function entryLine(entry: SheetEntry): { head: string; tail: string } {
  const tail: string[] = [];
  if (entry.then.length) tail.push(`then ${entry.then.map(verbOf).join(", ")}`);
  if (entry.callers.length) tail.push(`callers ${entry.callers.length}`);
  for (const [tier, ids] of Object.entries(entry.tiers)) tail.push(`${tier} ${ids.length}`);
  return { head: `${entry.id} ${entry.op}  ${shortFile(entry.file)}`, tail: tail.join(" · ") };
}

function show(args: string[]): number {
  const words = readWords(args, { row: VALUE, json: FLAG });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  const sheet = readSheet(ws, arc);
  if (!sheet) { console.log(`${arc} keeps no sheet — it is judged as before sheets.`); return 0; }
  const rowId = words.value("row");
  let entries = sheet.entries;
  if (rowId !== null) {
    const row = readArc(ws, arc)?.rows.find((one) => one.id === rowId);
    if (!row) throw new UsageFault(`finds no row ${rowId} in ${arc}.`);
    entries = entries.filter((one) => row.entries?.includes(one.id));
  }
  if (words.given("json")) { console.log(JSON.stringify({ ...sheet, entries }, null, 2)); return 0; }
  const first = (text: string): string => text.split(",")[0].trim();
  const stack = sheet.stack ? `stack: ${first(sheet.stack.folder)} · reset ${first(sheet.stack.reset)}` : "stack: none";
  console.log([arc, ...(rowId !== null ? [`row ${rowId}`] : []), `${entries.length} entries`, stack].join(" · "));
  const lines = entries.map(entryLine);
  const width = Math.max(0, ...lines.map((line) => line.head.length));
  for (const line of lines) console.log(line.tail ? `${line.head.padEnd(width)}   ${line.tail}` : line.head);
  console.log("--json for every field");
  return 0;
}

/** Whether a card's id is cited by an entry's `decidedBy`. */
const cites = (entries: readonly SheetEntry[], id: string): boolean =>
  entries.some((entry) => entry.decidedBy.some((text) => new RegExp(`\\b${id}\\b`).test(text)));

/** What `sheet check` prints, and what the go lists: the sheet read against the arc's rows and cards. Empty where the arc keeps no sheet. */
export function sheetFindings(ws: string, arc: string): string[] {
  const sheet = readSheet(ws, arc);
  const data: ArcData | null = readArc(ws, arc);
  if (!sheet || !data) return [];
  const entries = Array.isArray(sheet.entries) ? sheet.entries : [];
  const held = new Map(entries.map((entry) => [entry.id, entry]));
  const parents = parentIds(data.rows);
  const leaves = data.rows.filter((row) => !parents.has(row.id));
  const out: string[] = [];
  const named = new Set<string>();
  for (const row of data.rows) for (const id of row.entries ?? []) {
    named.add(id);
    if (!held.has(id)) out.push(`row ${row.id} names ${id}, which the sheet does not hold`);
  }
  for (const entry of entries) if (!named.has(entry.id)) out.push(`${entry.id} is named by no row`);
  // A RELEASE or PROOF row names its files through no entry, so it is never this finding.
  for (const row of leaves.filter((one) => ["DOCS", "CODE", "GENERATED"].includes(one.altitude ?? "") && !(one.entries ?? []).length))
    out.push(`row ${row.id} names no entry`);
  for (const row of leaves.filter((one) => one.altitude === "CODE" && (one.entries ?? []).length)) {
    const tested = (row.entries ?? []).some((id) => Object.values(held.get(id)?.tiers ?? {}).some((ids) => ids.length));
    if (!tested) out.push(`row ${row.id} is a CODE row and its entries name no test`);
  }
  for (const card of readQuestions(ws).filter((one) => one.arc === arc && one.state === "answered"))
    if (!cites(entries, card.id)) out.push(`${card.id} is answered and no entry cites it`);
  if (sheet.stack === null && leaves.some((row) => row.altitude === "CODE" || row.altitude === "PROOF"))
    out.push(`the sheet's stack is null, and ${arc} has a CODE or PROOF row`);
  return out;
}

function check(args: string[]): number {
  const words = readWords(args);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  if (!readSheet(ws, arc)) { console.log(`${arc} keeps no sheet — it is judged as before sheets.`); return 0; }
  const findings = sheetFindings(ws, arc);
  if (!findings.length) { console.log(`${arc} sheet whole`); return 0; }
  for (const line of findings) console.log(line);
  console.log(`${findings.length} finding${findings.length === 1 ? "" : "s"} · exit 1`);
  return 1;
}

export const actions: Record<string, Action> = {
  write: { describe: "write the arc's whole sheet from a file, every entry validated and every fact one the arc holds", usage: "<workstream>/N<nnn> --file <sheet.json>", run: write },
  edit: { describe: "change one entry of the sheet; a missing entry is refused, and `sheet write` is named", usage: "<workstream>/N<nnn> <E> [--what …] [--op …] [--file …] [--decided-by …] [--facts …] [--then …] [--rules …] [--callers …] [--docs …] [--book …] [--tiers unit=ID,ID;contract=ID]", run: edit },
  drop: { describe: "take an entry out of the sheet; --note carries why into its one log line", usage: "<workstream>/N<nnn> <E> --note \"…\"", run: drop },
  show: { describe: "print the sheet, or one row's entries; --json prints every field", usage: "<workstream>/N<nnn> [--row <id>] [--json]", run: show },
  check: { describe: "read the sheet against the rows and the cards, one finding to a line; exits 1 on any", usage: "<workstream>/N<nnn>", run: check },
};
