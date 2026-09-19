#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-foundation/02-docs/05-artifacts.md § The approach document
//           docs/04-capabilities/01-foundation/01-devex/11-workspace.md § The workstream · the documents-first gate · the close gate
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The two gates a workstream's split plan carries, and the parser both read it with. This script
// checks only what a script CAN check; whether a row was the right row is judgement.
//
// A workstream lives at `.spndevex/workstreams/{open,backlog,closed}/{NNN}-{subject}/`, and its state
// is the folder it sits in. Only the move into `closed/` is a close. Moving `backlog/` into `open/` is
// how work starts, so neither gate fires on it.
//
// THE SPLIT PLAN is not a section somebody writes. It is the `How` tables of an approach page read by
// their SCOPE column — one row per piece or per document, each naming the node that owns it and the
// state it has reached. A seat's page leaves the column out, so it carries no split plan and neither
// gate has anything to hold it to.
//
//   documents-first :  a WARNING. You are writing an approach page into a repo's own pocket while the
//                      open workstream that argues it still has rows that have not landed.
//   close           :  a REFUSAL. Every row must be ACCOUNTED FOR, which is not the same as finished:
//                      landed, carried and deferred all pass, and only a row nobody decided refuses.
//                      There is no override, and none is needed — recording the deferral is the way through.
//
//   sweep :  node split-plan.ts [path …]     (every open workstream's rows)
//
// PORTED FROM `hooks/scripts/split-plan.py`, AND THE PORT IS ALSO THE FIX. The hook audit measured it
// at 77.7% of every millisecond a hook has ever cost — 79.2 s across 7,895 fires — and 76.0 s of that
// was spent on `Bash`, at a median of 10.24 ms per call whatever the command said. It broke the rule
// this arc states: a hook reads the file that changed and nothing else. See § the fast path below.
//
// It also carries finding F5's fix: a card answered ON THE PAGE, in its own `rec` block, was invisible
// to a check that read only the arcs. Four cards sat in `Open` answered for a day.

import { readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { DEVEX, emit, isDir, isFile, listdir, read, readPayload, runAlone, unescape, workspaceRoot,
         type Payload, type Verdict } from "../lib/payload.ts";

// The state a row reaches. `landed` is the only one that satisfies the documents pass; all three
// named states satisfy the close. A mark nobody wrote is what the close refuses.
const UNDECIDED = new Set(["", "-", "--", "?", "⬜", "☐", "[ ]", "tbd", "todo", "open", "unknown"]);
const LANDED = ["landed", "✅", "done", "shipped"];
const ACCOUNTED = ["landed", "carried", "deferred"];
// `stopped` is the row somebody began and then put down — a question arrived, a plugin needed a
// reload, the window ran out. It is NOT accounted for: half an edit sits in the tree, and the one
// reader who knew where has closed their window. The glyph is read as well as the word, for the same
// reason `✅` is: a cell reading `◐ 2026-09-08 …` strips to a date and would otherwise classify as
// pending, which closes clean.
const STOPPED = ["stopped", "◐"];
// A cell opens with a mark glyph before its word: ✅ landed, ↷ carried, ⊘ deferred. The word is what
// carries the meaning, so the reader skips anything that is not a letter to find it.
const LEAD = /^[^0-9a-z]+/i;
const MOVERS = new Set(["mv", "cp", "rsync", "install"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);
// The lifecycle. `open` is being worked, `backlog` is parked behind a named blocker, `closed` is
// accounted for. The container is `workstreams/`; `sessions/` is the name it replaces, and a bare
// `arcs/` is the shape before that. All three are read so a half-migrated workspace still parses.
const STATES = ["open", "backlog", "closed"];
const CONTAINERS = ["workstreams", "sessions", "arcs"];
// What a close looks like as a path: a closed folder of one of those containers, under the
// workspace's own state. `backlog/` moving to `open/` matches nothing here, which is the point.
const CLOSED = new RegExp(`/${DEVEX.replace(".", "\\.")}/(?:${CONTAINERS.join("|")})/closed(?:/|$)`);
// Every path part that is a container or a state rather than a subject — so a destination alone
// still yields the subject when no source names it.
const STRUCTURE = new Set([...CONTAINERS, ...STATES, ""]);

const slashes = (path: string) => path.split(sep).join("/");
const startsWithAny = (text: string, prefixes: string[]) => prefixes.some((p) => text.startsWith(p));

// ---------------------------------------------------------------------------- the fast path
//
// THE ONE CHANGE THE PORT MAKES TO BEHAVIOUR, and the reason for it.
//
// `gateDocumentsFirst` sweeps every open workstream's pages and arcs BEFORE it looks at what was
// written, because the answered-card rule fires on any write. That sweep reads a 214 KB page and
// fourteen arcs — and the Python paid it on every `Bash` call, `git status` and `ls` included.
//
// A card becomes stale only when an ARC records an answer or a PAGE changes, and a close only happens
// when something moves into `closed/`. Each of those is NAMED IN THE TEXT of the call that does it.
// So a call naming none of them cannot have changed either input, and returns before opening a file.
//
// It is deliberately a superset: `closed` and `arcs` as bare words match a commit message that merely
// mentions them, and those pay the full sweep. A guard that errs toward running is the right error.
const TOUCHES_PLAN = /-approach\.html|\.spndevex|\bworkstreams?\b|\bsessions\b|\barcs\b|\bclosed\b/i;

/** Everything this call says about where it is pointed — the path form and the shell form. */
function subjectText(payload: Payload): string {
  const supplied = payload.tool_input ?? {};
  return `${supplied.file_path ?? ""} ${supplied.command ?? ""}`;
}

// ---------------------------------------------------------------------------- reading a plan

/** A cell as a person reads it — tags gone, entities resolved, whitespace collapsed. */
export function flat(cell: string): string {
  return unescape(cell.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function* htmlTables(text: string): Generator<string[][]> {
  for (const table of text.match(/<table\b[\s\S]*?<\/table>/gi) ?? []) {
    const parsed: string[][] = [];
    for (const row of table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => flat(m[1]));
      parsed.push(cells);
    }
    if (parsed.length) yield parsed;
  }
}

/**
 * A pipe table, for a plan written in markdown. The separator row decides where one starts, so a
 * line of pipes inside prose is never mistaken for a header.
 */
function* mdTables(text: string): Generator<string[][]> {
  let table: string[][] = [];
  let header: string[] | null = null;
  for (const line of text.split("\n")) {
    const stripped = line.trim();
    if (!stripped.startsWith("|")) {
      if (table.length) { yield table; table = []; header = null; }
      continue;
    }
    const cells = stripped.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (/^:?-{3,}/.test(cells[0]) && header) { table = [header]; header = null; continue; }
    if (table.length) table.push(cells); else header = cells;
  }
  if (table.length) yield table;
}

export type Row = { label: string; scope: string; state: string };

/**
 * Every split-plan row in one document.
 *
 * A split-plan table is one carrying BOTH a `scope` header and a `state` header. Requiring both is
 * what keeps an arc's own step table — which has a state and no scope — out of a check it was never
 * written for.
 */
export function rowsOf(text: string, markdown: boolean): Row[] {
  const out: Row[] = [];
  for (const table of markdown ? mdTables(text) : htmlTables(text)) {
    const head = table[0].map((c) => c.toLowerCase());
    const scopeAt = head.indexOf("scope");
    const stateAt = head.indexOf("state");
    if (scopeAt < 0 || stateAt < 0) continue;
    for (const cells of table.slice(1)) {
      if (cells.length <= Math.max(scopeAt, stateAt)) continue;
      out.push({ label: cells[0], scope: cells[scopeAt], state: cells[stateAt] });
    }
  }
  return out;
}

/**
 * `empty` · `landed` · `carried` · `deferred` · `stopped` · `pending`.
 *
 * The close accepts three of the six, so it has to tell them apart. `ACCOUNTED` named all three from
 * the first version and nothing read it. A row saying `carried` and a row saying `agreed` were one
 * value, so the gate warned about rows that had named their successor. That teaches a reader that
 * marking a row changes nothing.
 *
 * `pending` is what is left over: somebody decided to do it and never said what became of it. It
 * still passes the close, and the warning names it.
 */
export function stateOf(row: Row): string {
  const raw = row.state.trim().toLowerCase();
  const state = raw.replace(LEAD, "");
  if (UNDECIDED.has(raw) || !state) return "empty";
  // `✅` IS ITSELF A LANDED MARK, so the raw cell is read before the glyph is stripped. Stripping
  // first turned every `✅ 2026-09-07` into `2026-09-07` and lost eleven landings.
  if (startsWithAny(raw, LANDED) || startsWithAny(state, LANDED)) return "landed";
  if (state.startsWith("carried")) return "carried";
  if (state.startsWith("deferred")) return "deferred";
  // Read before `pending`, and by the glyph as well as the word, so a stop carrying a date rather
  // than the word is still a stop rather than a row that closes clean.
  if (startsWithAny(raw, STOPPED) || startsWithAny(state, STOPPED)) return "stopped";
  return "pending";
}

/**
 * Whether a row said what became of it. Three states do; `stopped`, `pending` and `empty` do not.
 * `ACCOUNTED` is that set, and this is the one reader it has.
 */
export function accounted(row: Row): boolean {
  return ACCOUNTED.includes(stateOf(row));
}

export function planOf(page: string): Row[] {
  return rowsOf(read(page), page.endsWith(".md"));
}

// ---------------------------------------------------------------------------- finding workstreams

function pagesIn(folder: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP.has(entry)) walk(full); }
      else if (entry.endsWith("-approach.html")) out.push(full);
    }
  };
  walk(folder);
  return out;
}

/** Where one state's workstreams sit, in every shape the workspace may be in. */
function stateFolders(root: string, state: string): string[] {
  const devex = join(root, DEVEX);
  return [join(devex, "workstreams", state), join(devex, "sessions", state)];
}

/**
 * Every OPEN subject and the pages that argue it — the shape, and the shapes it replaces.
 *
 * Only `open/` is read here: `backlog/` is parked, and warning about parked work teaches nobody
 * anything.
 */
export function openWorkstreams(root: string): Map<string, string[]> {
  const devex = join(root, DEVEX);
  const found = new Map<string, string[]>();
  for (const openDir of stateFolders(root, "open"))
    for (const subject of listdir(openDir)) {
      const folder = join(openDir, subject);
      if (isDir(folder) && !found.has(subject)) found.set(subject, pagesIn(folder));
    }
  for (const name of listdir(join(devex, "arcs"))) {
    if (!name.startsWith("arc-") || !name.endsWith(".md")) continue;
    const subject = name.slice("arc-".length, -".md".length);
    if (!found.has(subject)) found.set(subject, []);
    const page = join(devex, "notes", `${subject}-approach.html`);
    const pages = found.get(subject)!;
    if (isFile(page) && !pages.includes(page)) pages.push(page);
  }
  return found;
}

/**
 * The pages that argue one subject, in any state and whichever shape the workspace is in.
 *
 * All three states are searched, because a subject reaches `closed/` from `open/` and may be closed
 * straight out of `backlog/` when it turns out never to have been needed.
 */
export function subjectPages(root: string, subject: string, source: string | null): string[] {
  const devex = join(root, DEVEX);
  const out: string[] = [];
  if (source && isDir(source)) out.push(...pagesIn(source));
  for (const state of STATES)
    for (const base of stateFolders(root, state)) {
      const candidate = join(base, subject);
      if (isDir(candidate)) for (const page of pagesIn(candidate)) if (!out.includes(page)) out.push(page);
    }
  const legacy = join(devex, "notes", `${subject}-approach.html`);
  if (isFile(legacy) && !out.includes(legacy)) out.push(legacy);
  return out;
}

/**
 * Where this subject's workstream actually sits, so the warning names a folder you can open. Naming
 * the shape it does not have yet helps nobody.
 */
function home(root: string, subject: string): string {
  for (const container of ["workstreams", "sessions"]) {
    const folder = join(DEVEX, container, "open", subject);
    if (isDir(join(root, folder))) return `${folder}/`;
  }
  const legacy = join(DEVEX, "arcs", `arc-${subject}.md`);
  if (isFile(join(root, legacy))) return legacy;
  return `${join(DEVEX, "workstreams", "open", subject)}/`;
}

/**
 * An approach page in a repository's own artifacts pocket — the seat a design lands in once it is
 * settled. A workstream's own page is not a seat: arguing it there is the point.
 */
function isRepoSeat(path: string): boolean {
  const normalized = slashes(resolve(path));
  if (normalized.includes(`/${DEVEX}/`)) return false;
  return normalized.includes("/artifacts/") && normalized.endsWith("-approach.html");
}

/** The member repo a path sits in — the first segment under the workspace root. */
function repoOf(root: string, path: string): string | null {
  const within = relative(root, resolve(path));
  if (!within || within.startsWith("..") || isAbsolute(within)) return null;
  return within.split(sep)[0];
}

function namesRepo(scope: string, repo: string): boolean {
  return new RegExp(`(?<![\\w-])${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`).test(scope);
}

// ---------------------------------------------------------------------------- reading a command

/**
 * A shell command split into words the way the shell would. Python's `shlex.split` raises on an
 * unbalanced quote and this returns null for the same case, because guessing at a half-quoted
 * command is how a gate comes to fire on something nobody wrote.
 */
export function shlexSplit(segment: string): string[] | null {
  const out: string[] = [];
  let word = "";
  let started = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (quote === "'") {
      if (ch === "'") quote = null; else word += ch;
      continue;
    }
    if (quote === '"') {
      if (ch === "\\" && i + 1 < segment.length) { word += segment[i + 1]; i += 1; }
      else if (ch === '"') quote = null;
      else word += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; started = true; continue; }
    if (ch === "\\" && i + 1 < segment.length) { word += segment[i + 1]; i += 1; started = true; continue; }
    if (/\s/.test(ch)) { if (started) { out.push(word); word = ""; started = false; } continue; }
    word += ch;
    started = true;
  }
  if (quote !== null) return null;                  // an unbalanced quote — allow, never guess
  if (started) out.push(word);
  return out;
}

/**
 * Every (source, destination) a shell command moves or copies. Tokens decide it, never a pattern:
 * `git mv` hides the verb behind `git`, and a flag is never an operand.
 */
export function moves(command: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const segment of command.split(/\|\||&&|\||;|\n/)) {
    let tokens = shlexSplit(segment);
    if (tokens === null) continue;
    while (tokens.length && (["sudo", "env", "command", "nohup", "time"].includes(tokens[0]) || /^\w+=/.test(tokens[0])))
      tokens = tokens.slice(1);
    if (!tokens.length) continue;
    const verb = basename(tokens[0]);
    let args = tokens.slice(1);
    if (verb === "git" && args.length && args[0] === "mv") args = args.slice(1);
    else if (!MOVERS.has(verb)) continue;
    const operands = args.filter((a) => !a.startsWith("-"));
    if (operands.length >= 2)
      for (const source of operands.slice(0, -1))
        out.push([source.replace(/\/+$/, ""), operands[operands.length - 1]]);
  }
  return out;
}

/**
 * A path landing inside a closed folder of the workspace's own state. Named containers rather than a
 * bare `/closed/`, so the gate says which act it is watching. A move from `backlog/` into `open/` is
 * how work starts and matches nothing here.
 */
export function closing(destination: string): boolean {
  return CLOSED.test(slashes(resolve(destination)));
}

// ---------------------------------------------------------------------------- the answered card
//
// 05-artifacts.md § The approach document → Open — an answered question is not an `Open` entry with
// an answer written beside it: it folds into the section that then states it, and leaves.
//
// THE PAGE ALONE CANNOT TELL whether a card is answered from the log, so this reads the arc beside it.
// An arc logs an answer by naming the number — `Q3 to Q7 answered`, `Q13 answered C`.
//
// AND THE PAGE CAN SAY SO ITSELF, which is finding F5. A card whose own `rec` block carries a
// `Decision:` with an answer in it has been answered ON THE PAGE, and the arc may never mention it.
// `answered_numbers()` read only the arcs, so four cards sat in `Open` answered for a day and the
// developer found them by opening the published page. The check trusted the log and not the record,
// and the page IS the record.
//
// Reported as a WARNING rather than a refusal. The page is mid-edit for exactly as long as it takes
// to fold a card, and refusing a write during that would refuse the fix itself.

// A card runs from its own `<h4 id="qN">` to the next one or the end of the section. Reading it by
// the wrapping `<div class="open">` does not work: the card nests a `<div class="scroll">` table and
// a `<div class="rec">`, so a non-greedy match ends at the first inner `</div>` and never sees the
// decision. That is the shape of F5.
const OPEN_SECTION = /<section id="s4"[\s\S]*?<\/section>/i;
const CARD = /<h4[^>]*\bid="(q\d+)"[^>]*>[\s\S]*?(?=<h4[^>]*\bid="q|$)/gi;
const DECISION = /<b>\s*Decision:?\s*<\/b>([\s\S]{0,600})/i;
// `answered` may sit either side of the number, because a log writes both ways.
const ANSWERED = /\b(Q\d+)\b[^.\n]{0,80}?\banswered\b|\banswered\b[^.\n]{0,80}?\b(Q\d+)\b/gi;
// `Q3 to Q7 answered` names a run rather than one card.
const ANSWERED_RUN = /\bQ(\d+)\s*(?:to|through|–|—|-)\s*Q(\d+)\b[^.\n]{0,60}?\banswered\b/gi;
// A card number inside a code span or a fenced block is an EXAMPLE, not a record. An arc that
// explains the convention — "a log saying `Q7 answered` names one card" — was read as a log entry
// answering Q7, and the gate then demanded a card be folded that nobody had answered. Three false
// alarms in one session, and a gate that cries wolf is one people learn to work around.
const CODE_SPAN = /```[\s\S]*?```|`[^`\n]*`/g;

/** Every `Q<n>` an arc in this workstream records as answered. Examples are stripped first. */
export function answeredNumbers(folder: string): Set<string> {
  const out = new Set<string>();
  const arcs = join(folder, "arcs");
  if (!isDir(arcs)) return out;
  for (const name of listdir(arcs)) {
    if (!name.endsWith(".md")) continue;
    const text = read(join(arcs, name)).replace(CODE_SPAN, " ");
    for (const match of text.matchAll(ANSWERED)) out.add((match[1] || match[2]).toUpperCase());
    for (const match of text.matchAll(ANSWERED_RUN)) {
      const first = Number(match[1]), last = Number(match[2]);
      if (last - first > 0 && last - first < 40)
        for (let n = first; n <= last; n += 1) out.add(`Q${n}`);
    }
  }
  return out;
}

/**
 * Whether this card answers itself. The template ships `<b>Decision:</b> &mdash;`, which is a card
 * still waiting, so the test is not that the marker is present — it is that something a person would
 * read as an answer follows it. Punctuation and dashes strip away; a letter or a digit does not.
 */
function carriesDecision(card: string): boolean {
  const found = DECISION.exec(card);
  if (!found) return false;
  const tail = found[1].split(/<\/div>|<\/p>|<h4/i)[0];
  return /[0-9a-z]/i.test(flat(tail));
}

/** Each card in a page's `Open` section, with whether the card itself carries its decision. */
export function cardsOf(page: string): Array<{ number: string; decided: boolean }> {
  const section = OPEN_SECTION.exec(read(page));
  if (!section) return [];
  return [...section[0].matchAll(CARD)].map((m) => ({
    number: m[1].toUpperCase(),
    decided: carriesDecision(m[0]),
  }));
}

/**
 * Cards still in `Open` that are already answered — by an arc's log, or by the card's own decision.
 * The second source is finding F5: the page is the record, and a check that reads only the log
 * misses every card answered where the reader actually looks.
 */
export function staleCards(folder: string, pages: string[]): Array<[string, string, string]> {
  const answered = answeredNumbers(folder);
  const out: Array<[string, string, string]> = [];
  for (const page of pages)
    for (const card of cardsOf(page)) {
      if (card.decided) out.push([basename(page), card.number, "the card carries its own decision"]);
      else if (answered.has(card.number)) out.push([basename(page), card.number, "an arc records it as answered"]);
    }
  return out;
}

/**
 * THE OTHER HALF OF THE SAME RULE, and it is the one nothing tested. A card can leave `Open` and
 * carry nothing with it — deleted rather than folded. The page then reads as settled while the
 * reasoning that settled it lives only in a closed window.
 *
 * Deliberately weak. It asks only that the number appears somewhere outside `Open`, because no check
 * can judge whether a fold carries enough. A gate that fires on real deletions and stays quiet on
 * thin folds is worth more than one nobody trusts.
 */
export function unfoldedCards(folder: string, pages: string[]): Array<[string, string]> {
  const answered = answeredNumbers(folder);
  if (!answered.size) return [];
  const out: Array<[string, string]> = [];
  for (const page of pages) {
    const text = read(page);
    const stillOpen = new Set(cardsOf(page).map((c) => c.number));
    const mentioned = new Set([...text.matchAll(/\bQ\d+\b/g)].map((m) => m[0].toUpperCase()));
    for (const number of [...answered].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))))
      if (!stillOpen.has(number) && !mentioned.has(number)) out.push([basename(page), number]);
  }
  return out;
}

// ---------------------------------------------------------------------------- gate: documents-first

export function gateDocumentsFirst(payload: Payload): Verdict {
  if (!TOUCHES_PLAN.test(subjectText(payload))) return null;      // the fast path

  const supplied = payload.tool_input ?? {};
  const cwd = payload.cwd ?? process.cwd();
  const root = workspaceRoot(cwd);
  if (root) {
    // THE ANSWERED CARD. It is the rule most often broken by the agent that just obeyed it: the
    // answer lands, the work moves on, and the page keeps asking. Checked here rather than at close
    // because by then it has misled every reader.
    for (const [, pages] of [...openWorkstreams(root)].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!pages.length) continue;
      const folder = dirname(pages[0]);             // the arcs sit beside the page
      const gone = unfoldedCards(folder, pages);
      if (gone.length) {
        const named = gone.slice(0, 6).map(([page, number]) => `${number} in ${page}`).join(" · ");
        return { note:
          `An answered card left \`Open\` and took its answer with it — ${named}. ` +
          `The arc records it as answered, and the page now says nothing about it at all. A fold ` +
          `moves the card into the section that states what it settled; what replaces it is what ` +
          `execution reads, because the window holding the answer is gone ` +
          `(05-artifacts.md, The approach document).` };
      }
      const stale = staleCards(folder, pages);
      if (stale.length) {
        const named = stale.slice(0, 6).map(([page, number, why]) => `${number} in ${page} (${why})`).join(" · ");
        return { note:
          `An answered card is still in \`Open\` — ${named}. The page still asks a question ` +
          `somebody has already settled. Fold each one into the section that now states it, and ` +
          `take it out of \`Open\`: an answered question is never an entry with the answer ` +
          `written beside it (05-artifacts.md, The approach document).` };
      }
    }
  }

  const targets = supplied.file_path
    ? [supplied.file_path]
    : moves(supplied.command ?? "").map(([, destination]) => destination);
  for (const raw of targets) {
    const target = resolve(cwd, raw);
    if (!isRepoSeat(target)) continue;
    const seatRoot = workspaceRoot(target) ?? workspaceRoot(cwd);
    if (!seatRoot) continue;
    const repo = repoOf(seatRoot, target);
    if (!repo) continue;
    for (const [subject, pages] of [...openWorkstreams(seatRoot)].sort((a, b) => a[0].localeCompare(b[0]))) {
      const rows = pages.flatMap(planOf);
      if (!rows.some((row) => namesRepo(row.scope, repo))) continue;
      const pending = rows.filter((row) => stateOf(row) !== "landed");
      if (!pending.length) continue;
      // This repo's own rows first — they are why the gate fired, and a plan this wide otherwise
      // shows you six rows belonging to somebody else.
      pending.sort((a, b) => Number(namesRepo(b.scope, repo)) - Number(namesRepo(a.scope, repo)));
      const listed = pending.slice(0, 6)
        .map((r) => `  - [${stateOf(r).toUpperCase().padEnd(7)}] ${r.scope} — ${r.label.slice(0, 90)}`).join("\n");
      const more = pending.length > 6 ? `\n  … and ${pending.length - 6} more` : "";
      return { note:
        `Documents-first — workstream \`${subject}\` still has rows that have not landed, and ` +
        `its split plan names ${repo}:\n${listed}${more}\n` +
        `  You are writing ${basename(target)} into that repo's own pocket. While a subject is ` +
        `open the argument lives in the workstream — \`${home(seatRoot, subject)}\` — and lands ` +
        `in a seat once it is settled. Write the documents in scope order, highest scope first: ` +
        `the foundation before the repo, the repo before the seat, all of it before the code. If ` +
        `this page IS the landing, say so and land the row.` };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------- gate: close

// The masthead line a reader meets first. A folder in `closed/` whose page still says it is running
// tells everyone who opens the page — rather than the folder — that the work is live. `010` sat that
// way until the developer noticed it, and this gate passed it: it read rows, and nobody reads rows first.
const EYEBROW = /class="eyebrow"[^>]*>([\s\S]*?)<\/div>/i;
const CLOSED_WORDS = ["closed", "landed", "complete"];

/** Whether the page's own masthead says the work is finished. */
function saysItIsClosed(page: string): boolean {
  const found = EYEBROW.exec(read(page));
  if (found === null) return true;                  // no masthead to read is not a finding
  const text = flat(found[1]).toLowerCase();
  return CLOSED_WORDS.some((word) => text.includes(word));
}

export function gateClose(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  const command = supplied.command ?? "";
  const written = supplied.file_path;
  if (!/closed/i.test(`${command} ${written ?? ""}`)) return null;   // the fast path

  const cwd = payload.cwd ?? process.cwd();
  const candidates: Array<[string | null, string]> = [];
  for (const [source, destination] of moves(command)) {
    const full = resolve(cwd, destination);
    if (closing(full)) candidates.push([resolve(cwd, source), full]);
  }
  if (written) {
    const full = resolve(cwd, written);
    // A move is the act the gate is written for. A write straight into `closed/` is the same act by
    // another route — except on the page itself, which must stay editable so a row nobody decided
    // can be decided.
    if (closing(full) && !full.endsWith("-approach.html")) candidates.push([null, full]);
  }

  for (const [source, destination] of candidates) {
    const root = workspaceRoot(destination) ?? workspaceRoot(cwd);
    if (!root) continue;
    let subject = source ? basename(source.replace(/\/+$/, "")) : "";
    if (subject.startsWith("arc-") && subject.endsWith(".md"))
      subject = subject.slice("arc-".length, -".md".length);       // the shape `workstreams/` replaces
    if (!subject || STRUCTURE.has(subject)) {
      const after = relative(join(root, DEVEX), destination).split(sep);
      subject = after.find((part) => !STRUCTURE.has(part)) ?? "";
    }
    if (!subject) continue;
    const pages = subjectPages(root, subject, source && isDir(source) ? source : null);

    // THE STAMP, BEFORE THE ROWS. Closing moves a folder; a page that still says it is running keeps
    // telling every reader the work is live. It is one line to fix and invisible to a gate that only
    // counts rows.
    const unstamped = pages.filter((page) => !saysItIsClosed(page));
    if (unstamped.length)
      return {
        note:
          `\`${subject}\` is closing while its page still says it is running. Stamp the masthead ` +
          `first — ${unstamped.map((p) => basename(p)).join(" · ")} — because a reader opens the ` +
          `page, not the folder, and the folder is the only thing this move changes ` +
          `(05-artifacts.md, The approach document).`,
        deny:
          `Denied: ${subject}'s page does not say it is closed. The masthead is what a reader ` +
          `meets first, and closing must change it as well as the folder.`,
      };

    const rows = pages.flatMap(planOf);
    const empty = rows.filter((row) => stateOf(row) === "empty");
    // A GATE MUST SAY WHAT IT DID NOT CHECK. These two states used to leave here together, and a page
    // that planned NOTHING closed exactly as green as a page accounting for everything.
    if (!rows.length)
      return {
        note: `Close gate — \`${subject}\` carries no split plan, so nothing was checked.`,
        deny:
          `Denied: \`${subject}\` has no split plan, so this gate checked NOTHING — that is not ` +
          `the same as everything being accounted for, and it must not read the same.\n` +
          `A split plan is a \`How\` table with a **Scope** column and a **State** column, one row ` +
          `per construct. The gate reads those two and nothing else.\n\n` +
          `Add the columns to the approach page's constructs table, then give each row one of ` +
          `three states:\n` +
          `  landed <path>   the node that now holds the content\n` +
          `  carried         the successor scope that takes it on\n` +
          `  deferred        the event that brings it back\n\n` +
          `If this scope genuinely planned nothing, say so on the page in a one-row table rather ` +
          `than by leaving the column out — an absent plan and a finished one are ` +
          `indistinguishable to any reader, not just to this hook.`,
      };

    const pending = rows.filter((row) => !accounted(row));
    const stopped = rows.filter((row) => stateOf(row) === "stopped");
    if (!empty.length && !stopped.length) {
      // ACCOUNTED FOR IS THREE STATES, AND `accounted()` READS ALL THREE. It did not once: a row
      // naming its successor counted the same as one saying `🚧 agreed`, and closing `007` warned
      // about sixteen rows that had each been decided. What is left here is the real case — designed,
      // not done, and silent about where it went. It still closes, because whether that should refuse
      // is the developer's rule to set. This says what it did not check rather than deciding for them.
      if (pending.length) {
        const listed = pending.slice(0, 10).map((r) => `  - ${r.scope} — ${r.label.slice(0, 90)}`).join("\n");
        const more = pending.length > 10 ? `\n  … and ${pending.length - 10} more` : "";
        return { note:
          `Close gate — \`${subject}\` closes with ${pending.length} row(s) that never say what ` +
          `became of them. The gate did NOT check these:\n${listed}${more}\n\n` +
          `Each one says somebody decided something and not what happened to it. If the work moves ` +
          `on, mark it carried and name the scope; if it waits, mark it deferred and name the ` +
          `trigger. Closing with work pending is ordinary — closing without saying where it went ` +
          `is what nobody can follow.` };
      }
      continue;
    }

    const listed = empty.slice(0, 10).map((r) => `  - ${r.scope} — ${r.label.slice(0, 90)}`).join("\n");
    const more = empty.length > 10 ? `\n  … and ${empty.length - 10} more` : "";
    const stoppedListed = stopped.slice(0, 10).map((r) => `  - ${r.scope} — ${r.label.slice(0, 90)}`).join("\n");
    // ONE REFUSAL CARRYING BOTH LISTS. Undecided and stopped are different defects wanting different
    // repairs, and a gate that names one, gets fixed, then names the other has spent a round trip
    // teaching nothing.
    const counts = [
      ...(empty.length ? [`${empty.length} row(s) nobody decided`] : []),
      ...(stopped.length ? [`${stopped.length} row(s) you started and stopped`] : []),
    ];
    const stoppedBlock = stopped.length
      ? `\n\nRows started and stopped:\n${stoppedListed}\n\nA stopped row is half an edit sitting ` +
        `in the tree, and only the agent that stopped it knows where. Finish the work and mark the ` +
        `row landed, or split it honestly: the half that reached its node becomes a landed row, and ` +
        `the half that did not becomes a second row marked carried or deferred. Never retype the ` +
        `mark to deferred and leave the done half unrecorded — the next reader then edits over your work.`
      : "";
    return {
      note: `Close gate — \`${subject}\` cannot close yet: ${counts.join(" and ")}.`,
      deny:
        `Denied: \`${subject}\` cannot close while its split plan holds a row nobody decided, or a ` +
        `row somebody started and put down. The check is ACCOUNTED FOR, never finished — landed, ` +
        `carried and deferred all pass, and closing a scope with work pending is a normal act.\n` +
        (empty.length ? `Undecided rows:\n${listed}${more}` : "") +
        stoppedBlock +
        (empty.length
          ? `\n\nGive each undecided row one of three states, in the plan's State column:\n` +
            `  landed   → the node that now holds the content, as a path\n` +
            `  carried  → the successor scope, which is now open\n` +
            `  deferred → the event that brings it back\n`
          : "\n\n") +
        `There is no override. Recording what happened is the way through, and it is exactly what ` +
        `a later scope needs to find.`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------- the sweep

function sweep(roots: string[]): number {
  for (const start of roots) {
    const root = workspaceRoot(start) ?? resolve(start);
    const streams = openWorkstreams(root);
    console.log(`${root}   ${streams.size} open`);
    for (const [subject, pages] of [...streams].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!pages.length) {
        console.log(`  ${subject}: no approach page — no split plan, and that is a valid shape`);
        continue;
      }
      const rows = pages.flatMap(planOf);
      const tally: Record<string, number> = { landed: 0, carried: 0, deferred: 0, stopped: 0, pending: 0, empty: 0 };
      for (const row of rows) tally[stateOf(row)] += 1;
      console.log(
        `  ${subject}: ${rows.length} rows · landed ${tally.landed} · carried ${tally.carried} · ` +
        `deferred ${tally.deferred} · stopped ${tally.stopped} · pending ${tally.pending} · ` +
        `undecided ${tally.empty} · ${pages.length} page(s)`);
      for (const row of rows)
        if (stateOf(row) === "empty") console.log(`      undecided  ${row.scope} — ${row.label.slice(0, 70)}`);
    }
  }
  return 0;
}

if (runAlone("split-plan.ts")) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const gateAt = process.argv.indexOf("--gate");
  if (gateAt >= 0) {
    const gate = process.argv[gateAt + 1] ?? "";
    const payload = readPayload();
    try {
      if (gate === "documents-first") emit(gateDocumentsFirst(payload));
      else if (gate === "close") emit(gateClose(payload));
    } catch { /* when unsure, allow */ }
    process.exit(0);
  }
  process.exit(sweep(args.length ? args : ["."]));
}
