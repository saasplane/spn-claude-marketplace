// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The change sheet is the arc's data · § The formats
//           RULE.DEVEX.WORKSPACE.488, a suggestion belongs to an arc, as a card does, and the arc's sheet cites it
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream sheet write <workstream>/<arc> --file <sheet.json>
//   spn-devex workstream sheet edit  <workstream>/<arc> <E> [--what …] [--op …] [--file …] [--decided-by …] [--facts …] [--then …] …
//   spn-devex workstream sheet drop  <workstream>/<arc> <E> --note "…"
//   spn-devex workstream sheet patch <workstream>/<arc> <E>
//   spn-devex workstream sheet show  <workstream>/<arc> [--row <id>] [--part <part>] [--json]
//   spn-devex workstream sheet check <workstream>/<arc>
//
// The sheet is the arc's data, `arcs/N<nnn>/sheet.json`, and these commands write it. A gap is refused where it is written:
// every entry is validated, and every fact it cites must be one the arc's `facts.jsonl` holds, and a refusal names every
// fault at once. `check` also measures the two budgets an entry can move. An arc with no `sheet.json` is
// judged as it was before sheets, so `show` and `check` say so and exit 0, and `write` creates the file.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Action, FLAG, VALUE, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { readGo } from "../../lib/go-plan.ts";
import { arcIdsOf, logEvent, readArc, readJson, workspaceOf, readJsonl, readQuestions, readSheet, factsFileOf, sheetFileOf, stateFileOf, suggestionsOf, writeArc, writeWhole } from "../../lib/workstream.ts";
import { ENTRY_OPS, cardName, entryWork, parentIds, renameDataToWork, sheetFaults, type ArcData, type ArcRow, type Fact, type Question, type Sheet, type SheetEntry } from "../../lib/workstream-schema.ts";
import { missingCopies } from "../../lib/generated-copies.ts";
import { arcNamed, listOf, typed } from "./_shared.ts";

export const describe = "the arc's change sheet: write it whole, edit or drop one entry, keep an entry's change as a diff, show it, check it against the rows and the cards";

/**
 * The faults of a sheet's `needsRelease` (MKT.HOOKS.322): a list of {repo, release, command}, each a text that says
 * something. The go reads it to mark a repository's first part waiting on that release; absent is fine.
 */
function needsReleaseFaults(sheet: Sheet): string[] {
  const rows = sheet.needsRelease;
  if (rows === undefined) return [];
  if (!Array.isArray(rows)) return ["`needsRelease` is not a list of {repo, release, command}"];
  return rows.flatMap((row, at) => {
    const one = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    const missing = ["repo", "release", "command"].filter((field) => typeof one[field] !== "string" || !(one[field] as string).trim());
    return missing.length ? [`needsRelease[${at}] has no ${missing.join(", ")} as text`] : [];
  });
}

/**
 * The first read of an open workstream's arc: its rows and its sheet's entries rename `altitude` to `work`, each file
 * written back with one log line when anything changed, before any validation faults on the old name. A closed
 * workstream is never passed in: it stays as it closed.
 */
export function renameFirstRead(ws: string, arc: string): void {
  if (basename(dirname(resolve(ws))) === "closed") return;
  let count = 0;
  for (const file of [stateFileOf(ws, arc), sheetFileOf(ws, arc)]) {
    const data = readJson(file);
    const renamed = renameDataToWork(data);
    if (renamed > 0) { writeWhole(file, `${JSON.stringify(data, null, 2)}\n`); count += renamed; }
  }
  if (count > 0) logEvent(ws, arc, "work", null, `altitude and pass renamed to work · ${count} record${count === 1 ? "" : "s"}`);
}

/** The kinds of work a sheet entry may name: a sheet entry changes docs, code or generated output, never the rest. */
const ENTRY_WORK: readonly string[] = ["DOCS", "CODE", "GENERATED"];

/** Each fault of a sheet as the arc would hold it: its schema, and every fact an entry cites being one the arc's facts hold. */
/** The entries the arc's landed rows hold. */
const landedIds = (data: ArcData | null): Set<string> => new Set((data?.rows ?? []).filter((row) => row.state === "landed").flatMap((row) => row.entries ?? []));

function writeFaults(ws: string, arc: string, sheet: Sheet, whole: boolean): string[] {
  const out = [...sheetFaults(sheet), ...needsReleaseFaults(sheet)];
  if (whole && sheet.stack === null) out.push("the sheet's `stack` is null — name the folder the tiers run from, the dmo version and the reset");
  for (const entry of Array.isArray(sheet.entries) ? sheet.entries : [])
    if (typeof entry?.work === "string" && !ENTRY_WORK.includes(entry.work))
      out.push(`${entry.id} names work ${entry.work} — an entry's work is DOCS, CODE or GENERATED, or left out and read from its file`);
  // A NEW ENTRY CARRIES ITS THINKING: `trace` as text and `judged` as true or false; an entry the stored sheet already holds is read as it was.
  const stored = new Set((readSheet(ws, arc)?.entries ?? []).map((one) => one.id));
  for (const entry of Array.isArray(sheet.entries) ? sheet.entries : []) {
    if (stored.has(entry?.id)) continue;
    if (typeof entry?.trace !== "string" || !entry.trace.trim()) out.push(`${entry?.id} is new and has no \`trace\`, the thinking behind the change`);
    if (typeof entry?.judged !== "boolean") out.push(`${entry?.id} is new and has no \`judged\` (true for a judgment, false for a mechanical change)`);
  }
  const held = new Set(readJsonl(factsFileOf(ws, arc)).map((line) => (line as Fact | undefined)?.id));
  for (const entry of Array.isArray(sheet.entries) ? sheet.entries : [])
    for (const id of Array.isArray(entry?.facts) ? entry.facts : [])
      if (typeof id === "string" && !held.has(id)) out.push(`${entry.id} cites ${id}, which ${arc}'s facts do not hold`);
  // A CHANGED BOOK FILE MOVES ITS GENERATED COPIES: each the sheet does not name is a fault where the whole sheet is written (s59).
  const root = workspaceOf(ws);
  if (whole && root && Array.isArray(sheet.entries)) out.push(...missingCopies(root, sheet.entries.filter((entry) => typeof entry?.file === "string" && entry.file.includes(":")), landedIds(readArc(ws, arc))));
  return out;
}

/** A refusal in the form every sheet write ends on: the faults, then that nothing was written. */
function refused(faults: string[]): number {
  console.log(`Refused: ${faults.join(" · ")}. Nothing was written.`);
  return 1;
}

function sheetOf(ws: string, arc: string): Sheet {
  renameFirstRead(ws, arc);
  const sheet = readSheet(ws, arc);
  if (!sheet) throw new UsageFault(`finds no sheet for ${arc}: \`sheet write ${arc} --file <sheet.json>\` writes it.`);
  return sheet;
}

const save = (ws: string, arc: string, sheet: Sheet): void => writeWhole(sheetFileOf(ws, arc), `${JSON.stringify(sheet, null, 2)}\n`);

/**
 * The arc's steps as its sheet derives them: one for each repository and kind of change, holding that group's entries;
 * a release step for each repository when the sheet names a release order, and a proof step for each repository with code.
 * A step the arc already has for the same repository and kind keeps its place and takes the entries; nothing is added twice.
 * A landed step keeps what it landed: an entry written after it goes to a step of its own, and its repository gets a new
 * release step and, for code, a new proof step.
 * Returns the number of steps added.
 */
function deriveSteps(ws: string, arc: string, sheet: Sheet): number {
  const data = readArc(ws, arc);
  if (!data) return 0;
  const followed = new Set<string>();
  const groups = new Map<string, { repo: string; work: string; ids: string[] }>();
  for (const entry of sheet.entries) {
    const repo = entry.file.includes(":") ? entry.file.slice(0, entry.file.indexOf(":")) : "";
    const work = entryWork(entry);
    const group = groups.get(`${repo}|${work}`) ?? { repo, work, ids: [] };
    group.ids.push(entry.id);
    groups.set(`${repo}|${work}`, group);
  }
  let added = 0;
  const top = (): ArcRow[] => data.rows.filter((row) => row.parent === arc);
  const place = (repo: string, work: string, title: string, entries: string[] | null): void => {
    // A landed step keeps what it landed; an entry written after it goes to an open step, or to a new one.
    const same = top().filter((row) => row.repo === repo && row.work === work);
    const landed = new Set(same.filter((row) => row.state === "landed").flatMap((row) => row.entries ?? []));
    const fresh = entries?.filter((id) => !landed.has(id)) ?? null;
    const open = same.find((row) => row.state !== "landed");
    if (open) { if (fresh) open.entries = fresh; return; }
    if (same.length && (fresh ? !fresh.length : !followed.has(repo))) return;
    if (fresh?.length && same.length) followed.add(repo);
    const id = String(Math.max(0, ...top().map((row) => parseInt(row.id, 10) || 0)) + 1);
    const row: ArcRow = { id, parent: arc, title, kind: "change", repo, work, state: data.status === "DECIDED" ? "ready" : "waiting" };
    if (fresh) row.entries = fresh;
    data.rows.push(row);
    added += 1;
  };
  for (const group of groups.values()) place(group.repo, group.work, `${group.repo} ${group.work.toLowerCase()}`, group.ids);
  const repos = [...new Set([...groups.values()].map((group) => group.repo))];
  if (sheet.releaseChain.length) for (const repo of repos) place(repo, "RELEASE", `release ${repo}`, null);
  for (const group of groups.values()) if (group.work === "CODE") place(group.repo, "PROOF", `prove ${group.repo}`, null);
  if (added || groups.size) typed(() => writeArc(ws, data));
  return added;
}

/** The row of a decided arc that a `--because` names, as `3` or `row 3`, or null where it names none: then it is the developer's words. */
export function finishedRow(ws: string, arc: string, because: string): { id: string } | null {
  const data = readArc(ws, arc);
  if (!data || data.status !== "DECIDED") return null;
  const id = because.replace(/^row\s+/i, "").trim();
  const row = data.rows.find((one) => one.id === id && one.state !== "landed");
  return row ? { id: row.id } : null;
}

function write(args: string[]): number {
  const words = readWords(args, { file: VALUE, because: VALUE });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  renameFirstRead(ws, arc);
  const file = words.value("file");
  if (!file) throw new UsageFault("needs `--file <sheet.json>`, the whole sheet.");
  let data: unknown;
  try { data = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")); }
  catch (thrown) { throw new UsageFault(`reads \`${file}\` as no JSON: ${(thrown as Error).message}.`); }
  const faults = writeFaults(ws, arc, data as Sheet, true);
  // A decided arc's sheet is what the work was cut from: a rewrite carries the developer's words that changed it, and an empty sheet is written once.
  const because = words.value("because")?.trim() ?? "";
  if (readArc(ws, arc)?.status === "DECIDED" && (readSheet(ws, arc)?.entries.length ?? 0) > 0 && !because)
    faults.push(`${arc} is decided and its sheet holds entries — a rewrite carries \`--because "<the developer's words that changed it>"\` (or, for a fix that finishes the arc's own row or proof, \`--because "<its row>"\`)`);
  // A FIX THAT FINISHES A DECIDED ARC'S OWN ROW OR PROOF NEEDS NO CARD: --because names that row, and every new entry cites it (s55).
  const finishes = finishedRow(ws, arc, because);
  if (finishes) {
    const known = new Set((readSheet(ws, arc)?.entries ?? []).map((one) => one.id));
    for (const entry of Array.isArray((data as Sheet).entries) ? (data as Sheet).entries : [])
      if (!known.has(entry?.id) && !(Array.isArray(entry?.decidedBy) && entry.decidedBy.some((cite) => cite === `row ${finishes.id}` || cite === `${arc}/${finishes.id}`)))
        faults.push(`${entry?.id} is new, and \`--because "${because}"\` says it finishes row ${finishes.id} of ${arc}: it cites \`row ${finishes.id}\` in \`decidedBy\``);
  }
  if (faults.length) return refused(faults);
  save(ws, arc, data as Sheet);
  const count = (data as Sheet).entries.length;
  const added = deriveSteps(ws, arc, data as Sheet);
  logEvent(ws, arc, "sheet", null, `written · ${count} entries${because ? ` · ${finishes ? `finishes row ${finishes.id}` : `because ${because}`}` : ""}`);
  console.log(`ok · ${arc} sheet written · ${count} entries${added ? ` · ${added} step${added === 1 ? "" : "s"} derived` : ""}`);
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

/** `--judged` as true and `--mechanical` as false, null where neither was typed. */
function judgedOf(words: { given: (name: string) => boolean }): boolean | null {
  if (words.given("judged") && words.given("mechanical")) throw new UsageFault("takes `--judged` or `--mechanical`, not both.");
  return words.given("judged") ? true : words.given("mechanical") ? false : null;
}

const EDIT_LISTS:Record<string, keyof SheetEntry> = {
  "decided-by": "decidedBy", facts: "facts", then: "then", rules: "rules", callers: "callers", docs: "docs", book: "book",
};

function edit(args: string[]): number {
  const words = readWords(args, {
    what: VALUE, op: ENTRY_OPS, file: VALUE, "decided-by": VALUE, facts: VALUE, then: VALUE, rules: VALUE, callers: VALUE, docs: VALUE, book: VALUE, tiers: VALUE, trace: VALUE, judged: FLAG, mechanical: FLAG,
  });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet edit <workstream>/<arc> <E> [--what …] [--tiers …] …`.");
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
  const trace = words.value("trace");
  if (trace !== null) { next.trace = trace; changed.push("trace"); }
  const judgement = judgedOf(words);
  if (judgement !== null) { next.judged = judgement; changed.push("judged"); }
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
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet drop <workstream>/<arc> <E> --note \"…\"`.");
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

/** `repo:path` as the folder that holds the repository for this workstream (its worktree where one is made, else the checkout) and the path in it. */
function checkoutOf(ws: string, file: string): { dir: string; rel: string; repo: string } | null {
  const root = workspaceOf(ws);
  const at = file.indexOf(":");
  if (!root || at < 0) return null;
  const repo = file.slice(0, at);
  const worktree = join(root, ".worktrees", basename(ws), repo);
  return { dir: existsSync(worktree) ? worktree : join(root, repo), rel: file.slice(at + 1), repo };
}

const gitIn = (dir: string, args: string[]): string =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });

/**
 * Keeps an entry's change as a diff: the file read in the arc's worktree is diffed against the commit the entry's facts pin
 * for it, written to `patches/<E>.diff` beside the sheet, named by the entry's `patch`, and the file is reset in the worktree.
 */
function patch(args: string[]): number {
  const words = readWords(args, { trace: VALUE, judged: FLAG, mechanical: FLAG });
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet patch <workstream>/<arc> <E> [--trace \"…\"] [--judged|--mechanical]`.");
  const { ws, arc } = arcNamed(ref);
  const sheet = sheetOf(ws, arc);
  const at = sheet.entries.findIndex((one) => one.id === id);
  if (at < 0) throw new UsageFault(`finds no entry ${id} in ${arc}'s sheet.`);
  const entry = sheet.entries[at];
  const where = checkoutOf(ws, entry.file);
  if (!where) throw new UsageFault(`reads ${id}'s file \`${entry.file}\` as no \`<repo>:<path>\` in this workspace.`);
  const held = readJsonl(factsFileOf(ws, arc)) as Fact[];
  const pinned = entry.facts.map((one) => held.find((fact) => fact?.id === one)).find((fact) => fact && String(fact.source).replace(/:\d+$/, "") === `${where.repo}/${where.rel}`);
  if (!pinned?.commit) return refused([`${id}'s facts pin no commit for \`${entry.file}\`: a fact whose source is that file is what the diff is made against`]);
  let diff: string;
  try { diff = gitIn(where.dir, ["diff", pinned.commit, "--", where.rel]); }
  catch (thrown) { return refused([`${id}'s diff against ${pinned.commit} could not be made in ${where.dir}: ${String((thrown as Error).message).split("\n")[0]}`]); }
  if (!diff.trim()) return refused([`${where.rel} holds no change against ${pinned.commit} in ${where.dir}, so ${id} has nothing to keep`]);
  const file = `patches/${id}.diff`;
  const next: SheetEntry = { ...entry, patch: { file, base: pinned.commit } };
  const traced = words.value("trace");
  if (traced !== null) next.trace = traced;
  const judgement = judgedOf(words);
  if (judgement !== null) next.judged = judgement;
  const entries = sheet.entries.map((one, place) => (place === at ? next : one));
  const faults = writeFaults(ws, arc, { ...sheet, entries }, false);
  if (faults.length) return refused(faults);
  writeWhole(join(dirname(sheetFileOf(ws, arc)), file), diff);
  save(ws, arc, { ...sheet, entries });
  gitIn(where.dir, ["checkout", "HEAD", "--", where.rel]);
  logEvent(ws, arc, "sheet", null, `${id} patched · ${file} against ${pinned.commit}`);
  console.log(`ok · ${arc} sheet · ${id} patched · ${file} against ${pinned.commit} · ${where.rel} reset`);
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
  const words = readWords(args, { row: VALUE, part: VALUE, json: FLAG });
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault(`takes one arc: it read ${ref} and not ${more.join(", ")}; run \`sheet show\` once for each arc.`);
  const { ws, arc } = arcNamed(ref);
  renameFirstRead(ws, arc);
  const sheet = readSheet(ws, arc);
  if (!sheet) { console.log(`${arc} keeps no sheet — it is judged as before sheets.`); return 0; }
  const rowId = words.value("row");
  const partId = words.value("part");
  let entries = sheet.entries;
  if (partId !== null) {
    // The go plan that covers the arc holds the part: a plan's lead is its folder, and its scope names every arc it covers.
    const plans = arcIdsOf(ws).map((lead) => readGo(ws, lead)).filter((plan) => plan !== null && plan !== undefined);
    const covering = plans.filter((plan) => plan!.scope.includes(arc));
    const part = covering.flatMap((plan) => plan!.parts).find((one) => one.id === partId);
    if (!part) {
      const listed = (covering.length ? covering : plans).flatMap((plan) => plan!.parts).map((one) => one.id);
      throw new UsageFault(`finds no part ${partId} in a go plan that covers ${arc}${covering.length ? "" : " (no plan covers it)"}; the plan${covering.length === 1 || (!covering.length && plans.length === 1) ? "'s" : "s'"} parts are ${listed.length ? listed.join(", ") : "none"}: \`go show ${arc}\` lists them.`);
    }
    entries = entries.filter((one) => part.entries.includes(`${arc}/${one.id}`));
  }
  if (rowId !== null) {
    const all = readArc(ws, arc)?.rows ?? [];
    const row = all.find((one) => one.id === rowId);
    if (!row) throw new UsageFault(`finds no row ${rowId} in ${arc}; its rows are ${all.length ? all.map((one) => one.id).join(", ") : "none"}.`);
    entries = entries.filter((one) => row.entries?.includes(one.id));
  }
  if (words.given("json")) { console.log(JSON.stringify({ ...sheet, entries }, null, 2)); return 0; }
  const first = (text: string): string => text.split(",")[0].trim();
  const stack = sheet.stack ? `stack: ${first(sheet.stack.folder)} · reset ${first(sheet.stack.reset)}` : "stack: none";
  console.log([arc, ...(rowId !== null ? [`row ${rowId}`] : []), ...(partId !== null ? [`part ${partId}`] : []), `${entries.length} entries`, stack].join(" · "));
  const lines = entries.map(entryLine);
  const width = Math.max(0, ...lines.map((line) => line.head.length));
  for (const line of lines) console.log(line.tail ? `${line.head.padEnd(width)}   ${line.tail}` : line.head);
  if (Array.isArray(sheet.needsRelease) && !needsReleaseFaults(sheet).length)
    for (const need of sheet.needsRelease as { repo: string; release: string; command: string }[])
      console.log(`needs release · ${need.repo} ${need.release} ships ${need.command}`);
  console.log("--json for every field");
  return 0;
}

/**
 * `sheet reach <arc> <E>`: the entries a change to E reaches, one step out — those that share a `decidedBy` card or section,
 * a fact or the file, that E names in `callers`, or whose file E's `then` commands name — with their files and the preview
 * sections E's and their `decidedBy` name. A re-patch rewrites only E's own diff.
 */
function reach(args: string[]): number {
  const words = readWords(args);
  const [ref, id, ...more] = words.paths;
  if (!id || more.length) throw new UsageFault("takes an arc and one entry: `sheet reach <workstream>/<arc> <E>`.");
  const { ws, arc } = arcNamed(ref);
  const sheet = sheetOf(ws, arc);
  const from = sheet.entries.find((one) => one.id === id);
  if (!from) throw new UsageFault(`finds no entry ${id} in ${arc}'s sheet.`);
  const shares = (a: readonly string[], b: readonly string[]): boolean => a.some((one) => b.includes(one));
  const pathOf = (file: string): string => file.slice(file.indexOf(":") + 1);
  const reached = sheet.entries.filter((one) => one.id !== id && (
    shares(from.decidedBy, one.decidedBy) || shares(from.facts, one.facts) || one.file === from.file
    || from.callers.some((caller) => pathOf(one.file).endsWith(caller) || caller.endsWith(pathOf(one.file)))
    || from.then.some((command) => command.includes(pathOf(one.file)))));
  const all = [from, ...reached];
  const files = [...new Set(all.map((one) => one.file))];
  const sections = [...new Set(all.flatMap((one) => one.decidedBy))];
  console.log(`${id} reaches ${all.length} of ${sheet.entries.length} entries · ${files.length} file${files.length === 1 ? "" : "s"} · ${sections.length} section${sections.length === 1 ? "" : "s"}`);
  for (const one of all) console.log(`  ${one.id}  ${one.file}`);
  console.log(`sections: ${sections.join(", ") || "none"}`);
  console.log(`a re-patch rewrites only patches/${id}.diff`);
  return 0;
}

/** Whether a card's id is cited by an entry's `decidedBy`. */
const cites = (entries: readonly SheetEntry[], id: string): boolean =>
  entries.some((entry) => entry.decidedBy.some((text) => new RegExp(`\\b${id}\\b`, "i").test(text)));

/** Whether a card's answer records that it changes no repository file, cited with `--entries none`. */
const changesNoFile = (card: Question): boolean => Array.isArray(card.answer?.entries) && card.answer.entries.length === 0;

/** The package.json at or above a file of a checkout, as the one that names the package the file belongs to: its folder, name and exports. */
function packageOf(dir: string, rel: string): { folder: string; name: string; targets: string[] } | null {
  let folder = dirname(rel);
  for (;;) {
    const file = join(dir, folder === "." ? "" : folder, "package.json");
    if (existsSync(file)) {
      try {
        const data = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
        if (typeof data.name === "string") {
          const targets: string[] = [];
          const walk = (value: unknown): void => {
            if (typeof value === "string") targets.push(value);
            else if (value && typeof value === "object") for (const one of Object.values(value)) walk(one);
          };
          walk(data.exports); walk(data.main); walk(data.bin);
          return { folder: folder === "." ? "" : folder, name: data.name, targets };
        }
      } catch { /* a package.json that reads as no JSON names no package */ }
    }
    if (folder === "." || folder === "/") return null;
    folder = dirname(folder);
  }
}

/** Whether a path inside a package is one its `exports`, `main` or `bin` names, a `*` in a target standing for any text. */
function isExported(pkg: { folder: string; targets: string[] }, rel: string): boolean {
  const inside = pkg.folder ? rel.slice(pkg.folder.length + 1) : rel;
  return pkg.targets.some((target) => {
    const clean = target.replace(/^\.\//, "");
    return clean.includes("*") ? new RegExp(`^${clean.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(inside) : clean === inside;
  });
}

/** An entry that removes what a package publishes or makes it refuse to boot: its `what` says an export is removed, or that boot refuses without a key. */
const BREAKS_BY_WORDS = /\b(?:removes?|drops?|deletes?|removed|dropped|deleted)\b[^.]*\bexports?\b|\bexports?\b[^.]*\b(?:removed|dropped|deleted)\b|\bboot\b[^.]*\brefuses?\b[^.]*\bwithout\b|\brefuses? to boot without\b/i;

/** The package.json files of a repository's checkout that pin a package, by their count and each distinct pin; none where the repository does not. */
function pinsOf(dir: string, name: string): { count: number; pins: string[] } {
  let count = 0;
  const pins = new Set<string>();
  const walk = (folder: string, depth: number): void => {
    let names: string[] = [];
    try { names = readdirSync(folder); } catch { return; }
    for (const one of names) {
      const path = join(folder, one);
      if (one === "package.json") {
        try {
          const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, Record<string, string> | undefined>;
          const pin = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].map((field) => data[field]?.[name]).find((value) => typeof value === "string");
          if (pin) { count += 1; pins.add(pin); }
        } catch { /* a package.json that reads as no JSON pins nothing */ }
      } else if (depth < 4 && !one.startsWith(".") && one !== "node_modules" && one !== "dist") {
        try { if (statSync(path).isDirectory()) walk(path, depth + 1); } catch { /* a path that vanished */ }
      }
    }
  };
  walk(dir, 0);
  return { count, pins: [...pins] };
}

/**
 * The consumers an entry breaks (E7): an entry that drops or renames a file a package exports, or whose `what` says an export is removed or
 * that boot refuses without a key, breaks that package; each repository of the workspace whose package.json pins it is named with its pin and
 * the count of files, until an entry of the sheet moves that pin (a package.json of the repository) or a fact the entry cites says the pin stays.
 */
function consumerFindings(ws: string, entries: readonly SheetEntry[], held: readonly Fact[]): string[] {
  const root = workspaceOf(ws);
  if (!root) return [];
  const out: string[] = [];
  for (const entry of entries) {
    const where = typeof entry?.file === "string" ? checkoutOf(ws, entry.file) : null;
    if (!where) continue;
    const pkg = packageOf(where.dir, where.rel);
    if (!pkg) continue;
    const byFile = (entry.op === "drop" || entry.op === "rename") && isExported(pkg, where.rel);
    if (!byFile && !BREAKS_BY_WORDS.test(String(entry.what ?? ""))) continue;
    for (const repo of readdirSync(root).filter((one) => !one.startsWith(".") && one !== where.repo).sort()) {
      const { count, pins } = pinsOf(join(root, repo), pkg.name);
      if (!count) continue;
      const moves = entries.some((one) => typeof one?.file === "string" && one.file.startsWith(`${repo}:`) && /[:/]package\.json$/.test(one.file));
      const stays = (Array.isArray(entry.facts) ? entry.facts : []).some((id) => {
        const fact = held.find((one) => one?.id === id);
        return !!fact && fact.fact.includes(pkg.name) && fact.fact.includes(repo) && /\bstay(?:s|ed)?\b/i.test(fact.fact);
      });
      if (!moves && !stays)
        out.push(`${entry.id} ${byFile ? `${entry.op}s ${where.rel}, which ${pkg.name} exports` : `breaks ${pkg.name}`}, and ${repo} pins it at ${pins.join(" and ")} in ${count} file${count === 1 ? "" : "s"}: the sheet needs an entry that moves that pin, or a fact that it stays`);
    }
  }
  return out;
}

/** What `sheet check` prints, and what the go lists: the sheet read against the arc's rows and cards. Empty where the arc keeps no sheet. */
export function sheetFindings(ws: string, arc: string): string[] {
  renameFirstRead(ws, arc);
  const sheet = readSheet(ws, arc);
  const data: ArcData | null = readArc(ws, arc);
  if (!sheet || !data) return [];
  const entries = Array.isArray(sheet.entries) ? sheet.entries : [];
  const held = new Map(entries.map((entry) => [entry.id, entry]));
  const parents = parentIds(data.rows);
  const leaves = data.rows.filter((row) => !parents.has(row.id));
  const out: string[] = needsReleaseFaults(sheet);
  const named = new Set<string>();
  for (const row of data.rows) for (const id of row.entries ?? []) {
    named.add(id);
    if (!held.has(id)) out.push(`row ${row.id} names ${id}, which the sheet does not hold`);
  }
  for (const entry of entries) if (!named.has(entry.id)) out.push(`${entry.id} is named by no row`);
  // A JUDGED ENTRY KEEPS ITS CHANGE AND ITS THINKING: a diff from `sheet patch` and a `trace`.
  for (const entry of entries.filter((one) => one.judged === true)) {
    if (!entry.patch) out.push(`${entry.id} is judged and has no patch: \`sheet patch ${arc} ${entry.id}\` keeps its change`);
    if (typeof entry.trace !== "string" || !entry.trace.trim()) out.push(`${entry.id} is judged and has no trace: \`sheet edit ${arc} ${entry.id} --trace "…"\``);
  }
  // A RELEASE or PROOF row names its files through no entry, so it is never this finding.
  for (const row of leaves.filter((one) => ["DOCS", "CODE", "GENERATED"].includes(one.work ?? "") && !(one.entries ?? []).length))
    out.push(`row ${row.id} names no entry`);
  for (const row of leaves.filter((one) => one.work === "CODE" && (one.entries ?? []).length)) {
    const tested = (row.entries ?? []).some((id) => Object.values(held.get(id)?.tiers ?? {}).some((ids) => ids.length));
    if (!tested) out.push(`row ${row.id} is a CODE row and its entries name no test`);
  }
  for (const card of readQuestions(ws).filter((one) => one.arc === arc && one.state === "answered"))
    if (!cites(entries, card.id) && !changesNoFile(card)) out.push(`${cardName(card.id)} is answered and no entry cites it`);
  // A SUGGESTION DECIDED AGAINST THIS ARC IS CITED BY AN ENTRY (RULE.DEVEX.WORKSPACE.488): `decidedBy` carries it as S<n>, or the go leaves it out.
  for (const one of suggestionsOf(ws).filter((suggestion) => suggestion.arc === arc && suggestion.state === "decided"))
    if (!cites(entries, one.id)) out.push(`${cardName(one.id)} is decided against ${arc} and no entry cites it in \`decidedBy\` (as \`${cardName(one.id)}\`)`);
  const root = workspaceOf(ws);
  if (root) out.push(...missingCopies(root, entries.filter((entry) => typeof entry?.file === "string" && entry.file.includes(":")), landedIds(data)));
  out.push(...consumerFindings(ws, entries, readJsonl(factsFileOf(ws, arc)) as Fact[]));
  if (sheet.stack === null && leaves.some((row) => row.work === "CODE" || row.work === "PROOF"))
    out.push(`the sheet's stack is null, and ${arc} has a CODE or PROOF row`);
  return out;
}

/** The session start's ceiling in characters; `events/orientation.ts` owns the number, and is not imported here because it is the heaviest module the commands could load. */
const SESSION_START_CEILING = 9_500;
/** Files whose change can move each budget: the entries naming one of them have a figure to give. */
const MOVES_SESSION_START = /(^|\/)(events\/orientation|lib\/builder|lib\/window)\.ts$|(^|\/)refs\//;
const MOVES_TOOL_HOOK = /(^|\/)(events\/pretooluse|lib\/bash-timing|lib\/window|lib\/go-plan|lib\/workstream|lib\/command-reader)\.ts$|(^|\/)checks\/|plugin-support-lib\/src\/lib\/(command|timing)\.ts$/;

/** The hook script beside the commands, as source or as the built bundle; null where neither is there. */
function hookFile(name: string): string | null {
  for (const ext of ["ts", "mjs"]) {
    const file = fileURLToPath(new URL(`../../events/${name}.${ext}`, import.meta.url));
    if (existsSync(file)) return file;
  }
  return null;
}

/** One run of a hook script on a payload, in the workspace: how long the whole process took, and what it printed. Null where it cannot run. */
function runHook(name: string, args: string[], payload: object, root: string): { ms: number; out: string } | null {
  const file = hookFile(name);
  if (!file) return null;
  const started = performance.now();
  try {
    const out = execFileSync(process.execPath, [file, ...args], { input: JSON.stringify({ cwd: root, session_id: "sheet-check", ...payload }),
      encoding: "utf8", cwd: root, timeout: 30_000, maxBuffer: 16 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"], env: { ...process.env, SPN_TELEMETRY: "off" } });
    return { ms: performance.now() - started, out };
  } catch { return null; }
}

const thousands = (n: number): string => n.toLocaleString("en-US");

/**
 * The budgets a sheet's entries can move, measured on this checkout: the session start's size, and the tool-call hook's
 * time on a Bash call. The projected after is the figure the sheet gives in `budgets.sessionStart` (characters) and
 * `budgets.toolHook` (ms), "unchanged" where no entry touches the budget's files, and a request for the figure where one does.
 */
function budgetLines(root: string, sheet: Sheet): { lines: string[]; findings: string[] } {
  const given = (sheet.budgets && typeof sheet.budgets === "object" ? sheet.budgets : {}) as Record<string, unknown>;
  const files = (Array.isArray(sheet.entries) ? sheet.entries : []).map((entry) => ({ id: entry.id, path: entry.file.slice(entry.file.indexOf(":") + 1) }));
  const projection = (key: string, moves: RegExp, unit: string): { text: string; value: number | null } => {
    const figure = given[key];
    if (typeof figure === "number" && Number.isFinite(figure)) return { text: `${thousands(figure)}${unit} projected`, value: figure };
    const touching = files.filter((one) => moves.test(one.path)).map((one) => one.id);
    return { text: touching.length ? `not projected: ${touching.join(", ")} touch${touching.length === 1 ? "es" : ""} it, so the sheet needs \`budgets.${key}\`` : "unchanged", value: null };
  };
  const lines: string[] = [], findings: string[] = [];
  const start = runHook("orientation", ["--stdin"], {}, root);
  let size: number | null = null;
  try { size = start ? (JSON.parse(start.out).hookSpecificOutput.additionalContext as string).length : null; } catch { /* a start that prints no context has no size */ }
  const after = projection("sessionStart", MOVES_SESSION_START, "");
  lines.push(`budgets · session start  ${size === null ? "not measured" : `${thousands(size)} of ${thousands(SESSION_START_CEILING)} characters now`} · ${after.text}`);
  if (size !== null && size > SESSION_START_CEILING) findings.push(`the session start is ${thousands(size)} characters, past the ${thousands(SESSION_START_CEILING)} ceiling`);
  if (after.value !== null && after.value > SESSION_START_CEILING) findings.push(`the session start is projected at ${thousands(after.value)} characters, past the ${thousands(SESSION_START_CEILING)} ceiling`);
  const runs = [0, 1, 2].map(() => runHook("pretooluse", [], { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "ls" } }, root));
  const times = runs.flatMap((run) => (run ? [run.ms] : [])).sort((a, b) => a - b);
  const hook = projection("toolHook", MOVES_TOOL_HOOK, " ms");
  lines.push(`budgets · tool-call hook  ${times.length ? `${Math.round(times[Math.floor(times.length / 2)])} ms added now` : "not measured"} · ${hook.text}`);
  return { lines, findings };
}

function check(args: string[]): number {
  const words = readWords(args);
  const [ref, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one arc.");
  const { ws, arc } = arcNamed(ref);
  renameFirstRead(ws, arc);
  if (!readSheet(ws, arc)) { console.log(`${arc} keeps no sheet — it is judged as before sheets.`); return 0; }
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  const measured = root ? budgetLines(root, readSheet(ws, arc) as Sheet) : { lines: [], findings: [] };
  for (const line of measured.lines) console.log(line);
  const findings = [...sheetFindings(ws, arc), ...measured.findings];
  if (!findings.length) { console.log(`${arc} sheet whole`); return 0; }
  for (const line of findings) console.log(line);
  console.log(`${findings.length} finding${findings.length === 1 ? "" : "s"} · exit 1`);
  return 1;
}

export const actions: Record<string, Action> = {
  write: { describe: "write the arc's whole sheet from a file, every entry validated and every fact one the arc holds", usage: "<workstream>/<arc> --file <sheet.json>", run: write },
  edit: { describe: "change one entry of the sheet; a missing entry is refused, and `sheet write` is named", usage: "<workstream>/<arc> <E> [--what …] [--op …] [--file …] [--decided-by …] [--facts …] [--then …] [--rules …] [--callers …] [--docs …] [--book …] [--tiers unit=ID,ID;contract=ID] [--trace \"…\"] [--judged|--mechanical]", run: edit },
  drop: { describe: "take an entry out of the sheet; --note carries why into its one log line", usage: "<workstream>/<arc> <E> --note \"…\"", run: drop },
  show: { describe: "print the sheet, or one row's or one go part's entries; --json prints every field", usage: "<workstream>/<arc> [--row <id>] [--part <part>] [--json]", run: show },
  patch: { describe: "keep an entry's change as a diff against the commit its facts pin, name it in the entry, and reset the file in the worktree; --trace and --judged/--mechanical are recorded with it", usage: "<workstream>/<arc> <E> [--trace \"…\"] [--judged|--mechanical]", run: patch },
  reach: { describe: "print the blast radius of one entry: the entries, files and preview sections a change to it reaches", usage: "<workstream>/<arc> <E>", run: reach },
  check: { describe: "read the sheet against the rows and the cards, one finding to a line; exits 1 on any", usage: "<workstream>/<arc>", run: check },
};
