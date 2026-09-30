#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document · § The split plan is the arcs' step rows, and Repo is the scope
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The workstream is a scope of work, not a window · § A step row says where, at what altitude, and how · § Documents first, and the order they are written in · § Retirement is close-or-graduate
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// The two gates a workstream's split plan carries, and the parser both read it with. This script
// checks only what a script CAN check; whether a row was the right row is judgement.
//
// A workstream lives at `.spndevex/workstreams/{open,backlog,closed}/{NNN}-{subject}/`, and its state
// is the folder it sits in. Only the move into `closed/` is a close. Moving `backlog/` into `open/` is
// how work starts, so neither gate fires on it.
//
// THE SPLIT PLAN is not a section somebody writes. It is the step rows of the workstream's arcs — the
// `## Steps` table of every file under `arcs/`, read by its REPO column, which is the scope, and its
// STATE column (RD.DEVEX.WORKSPACE.038). A step id is a number with an optional letter and optional
// dotted parts: `3`, `4b`, `3e.1`. An approach page written before that rule carried the plan as
// `How` tables with a SCOPE column, and those tables are still read, so a workstream argued in the
// older shape closes under the shape it was written in.
//
//   documents-first :  a WARNING. You are writing an approach page into a member repo while the
//                      open workstream that argues it still has rows that have not landed.
//   close           :  a REFUSAL. Every row must be ACCOUNTED FOR, which is not the same as finished:
//                      landed, carried and deferred all pass; a row nobody decided, a row marked
//                      `◐ stopped`, a row still `in progress <time>` and a row `⏸ held on Q<n>` refuse.
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
import { TERMINAL, statusIn } from "./arc-status.ts";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { emit, isDir, isFile, listdir, read, readPayload, runAlone, unescape, workspaceRoot,
         type Payload, type Verdict } from "../lib/payload.ts";
import { APPROACH_SUFFIX, ARCS, DEVEX, SESSIONS, WORKSTREAM_STATES, WORKSTREAMS, legacyWorkstreamsDir, workstreamsDir,
         type WorkstreamState } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";

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
// `in progress <date> <time> <offset>` is the row somebody is on right now (RD.DEVEX.WORKSPACE.184).
// Landing replaces the mark. Until then the row is neither landed nor accounted for, so the close
// refuses it like an empty or a stopped row, and the Stop hook names it with its age rather than
// calling it runnable: a second window leaves it alone and asks the developer.
const IN_PROGRESS = /^in[ -]progress\b/i;
// `⏸ held on Q<n>` is the row that waits for card `Q<n>`'s answer, because that answer can change it
// (RD.DEVEX.WORKSPACE.188). It is not accounted for, so the close refuses it like a stopped row, and
// the Stop hook leaves it out of the runnable rows while the card is open. The glyph is optional
// because a hand-typed mark can drop it; `LEAD` strips it when it is there.
const HELD = /^held on (q\d+)\b/i;
/** The state `stateOf` gives a held row. Every reader of the row states names it through this. */
export const HELD_STATE = "held";
// A cell opens with a mark glyph before its word: ✅ landed, ↷ carried, ⊘ deferred. The word is what
// carries the meaning, so the reader skips anything that is not a letter to find it.
const LEAD = /^[^0-9a-z]+/i;
const MOVERS = new Set(["mv", "cp", "rsync", "install"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);
// The lifecycle. `open` is being worked, `backlog` is parked behind a named blocker, `closed` is
// accounted for. The container is `workstreams/`; `sessions/` is the name it replaces, and a bare
// `arcs/` is the shape before that. All three are read so a half-migrated workspace still parses.
const STATES: readonly WorkstreamState[] = WORKSTREAM_STATES;
const CONTAINERS = [WORKSTREAMS, SESSIONS, ARCS];
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

/** A header cell as a name: emphasis and code marks gone, lower case. */
const headerName = (cell: string): string => cell.replace(/[*_`]/g, "").trim().toLowerCase();

/**
 * A step id: a number, an optional letter, and optional dotted parts — `3`, `4b`, `3e.1`. An arc
 * splits a step by lettering it and splits a lettered step by numbering after a dot, so a reader
 * that took only `\d+[a-z]?` skipped every dotted row and read the step as not there.
 */
export const STEP_ID = /^\d+[a-z]?(?:\.\d+[a-z]?)*$/i;

/** A step cell's id with its emphasis removed, so `**3e.1**` reads as `3e.1`. */
export const stepId = (cell: string): string => cell.replace(/[*_`]/g, "").trim();

/**
 * Every split-plan row in one document.
 *
 * A split-plan table is one carrying BOTH a scope header and a `state` header. On an approach page
 * the scope header is `scope`; in an arc's step table it is `repo`, and the caller names which one it
 * reads, so a page's own `Repo` table is never taken for a plan. A step table's first column is the
 * step id, so its label is `step <id> — <What>`: a label that read `3` named nothing a reader could find.
 */
export function rowsOf(text: string, markdown: boolean, scopeHeader = "scope"): Row[] {
  const out: Row[] = [];
  for (const table of markdown ? mdTables(text) : htmlTables(text)) {
    const head = table[0].map(headerName);
    const scopeAt = head.indexOf(scopeHeader);
    const stateAt = head.indexOf("state");
    if (scopeAt < 0 || stateAt < 0) continue;
    const whatAt = head.indexOf("what");
    const stepped = (head[0] === "#" || head[0] === "step") && whatAt > 0;
    for (const cells of table.slice(1)) {
      if (cells.length <= Math.max(scopeAt, stateAt)) continue;
      if (stepped && !STEP_ID.test(stepId(cells[0]))) continue;     // a field row, not a step
      const label = stepped ? `step ${stepId(cells[0])} — ${cells[whatAt]}` : cells[0];
      out.push({ label, scope: cells[scopeAt], state: cells[stateAt] });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------- the arcs' step rows

/**
 * The `## Steps` section of an arc, from its heading to the next `## ` heading, or `null` where the
 * arc has none. Only this section is read, so a table in the log or the specification that happens
 * to carry a Repo and a State column is never taken for a step.
 */
export function stepsSection(text: string): string | null {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^##\s+Steps\b/i.test(line));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const stop = rest.findIndex((line) => /^##\s/.test(line));
  return (stop < 0 ? rest : rest.slice(0, stop)).join("\n");
}

export type Step = { id: string; what: string; state: string | null; cells: string[] };

/**
 * Every row of an arc's step table, with its What and State cells found BY HEADER.
 *
 * The step row is `# · Repo · Altitude · What · Mechanism · Acceptance · State`, so the second cell
 * is the repository and not the step. A reader that printed `cells[1]` named a repository where it
 * meant to name the work. An older arc's table carries `# · What · …` with no State column: `what`
 * is still found by its header, and `state` is `null` so the caller knows no State cell exists.
 */
export function stepsOf(text: string): Step[] | null {
  const section = stepsSection(text);
  if (section === null) return null;
  const out: Step[] = [];
  for (const table of mdTables(section)) {
    const head = table[0].map(headerName);
    const whatAt = head.indexOf("what") > 0 ? head.indexOf("what") : 1;
    const stateAt = head.indexOf("state");
    for (const cells of table.slice(1)) {
      const id = stepId(cells[0] ?? "");
      if (!STEP_ID.test(id)) continue;
      out.push({ id, what: cells[whatAt] ?? "", state: stateAt >= 0 ? cells[stateAt] ?? "" : null, cells });
    }
  }
  return out;
}

/** An arc's short name for a label: `N116` from `N116-r2-the-devex-release.md`. */
export function arcName(file: string): string {
  const name = basename(file).replace(/\.md$/, "");
  return /^N\d+[a-z]?/i.exec(name)?.[0] ?? name;
}

/** Every arc file of one workstream folder. */
export function arcFiles(folder: string): string[] {
  const dir = join(folder, "arcs");
  if (!isDir(dir)) return [];
  return listdir(dir).filter((name) => name.endsWith(".md")).sort().map((name) => join(dir, name));
}

/** The split-plan rows of one arc: its step rows, read by Repo and State, labelled with the arc. */
export function arcRowsOf(text: string, arc: string): Row[] {
  const section = stepsSection(text);
  if (section === null) return [];
  return rowsOf(section, true, "repo").map((row) => ({ ...row, label: `${arc} ${row.label}` }));
}

/**
 * A workstream's whole split plan: the step rows of every arc in its folders, and the scope tables of
 * any page written in the older shape. Each folder is read once, however many ways it was found.
 */
export function workstreamPlan(folders: string[], pages: string[]): Row[] {
  const rows = pages.flatMap(planOf);
  for (const folder of [...new Set(folders.map((f) => resolve(f)))])
    for (const file of arcFiles(folder)) rows.push(...arcRowsOf(read(file), arcName(file)));
  return rows;
}

/**
 * When an `in progress <date> <time> <offset>` mark was written, or `null` where the cell carries no
 * such mark or its time cannot be read. The form is the date, the time and the offset:
 * `in progress 2026-09-29 14:32 +05:30`. A mark with no offset is read as UTC.
 */
export function inProgressSince(cell: string): Date | null {
  const bare = flat(cell).replace(/[*_`]/g, "").trim().replace(LEAD, "");
  if (!IN_PROGRESS.test(bare)) return null;
  const m = bare.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?\s*(Z|[+-]\d{2}:?\d{2})?/i);
  if (!m) return null;
  const offset = !m[4] || /^z$/i.test(m[4]) ? "Z" : m[4].includes(":") ? m[4] : `${m[4].slice(0, 3)}:${m[4].slice(3)}`;
  const at = new Date(`${m[1]}T${m[2]}${m[3] ?? ":00"}${offset}`);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** Whether a State cell carries the in-progress mark, readable time or not. */
export function isInProgress(cell: string): boolean {
  return IN_PROGRESS.test(flat(cell).replace(/[*_`]/g, "").trim().replace(LEAD, ""));
}

/** The card a State cell reading `⏸ held on Q<n>` waits on, as `Q<n>`, or `null` where it is not held. */
export function heldOn(cell: string): string | null {
  const m = HELD.exec(flat(cell).replace(/[*_`]/g, "").trim().replace(LEAD, ""));
  return m ? m[1].toUpperCase() : null;
}

/** How old a mark is, in the words a reader asks with: `3 h 5 min`, `2 d 4 h`, `under a minute`. */
export function markAge(since: Date | null, now = Date.now()): string {
  if (!since) return "an age this check cannot read";
  const minutes = Math.max(0, Math.floor((now - since.getTime()) / 60_000));
  if (minutes < 1) return "under a minute";
  const days = Math.floor(minutes / 1440), hours = Math.floor((minutes % 1440) / 60), rest = minutes % 60;
  if (days) return `${days} d${hours ? ` ${hours} h` : ""}`;
  if (hours) return `${hours} h${rest ? ` ${rest} min` : ""}`;
  return `${rest} min`;
}

/** `marked 3 h 5 min ago`, or what the reader is told when the mark's time cannot be read. */
export function markedAgo(cell: string, now = Date.now()): string {
  const since = inProgressSince(cell);
  return since ? `marked ${markAge(since, now)} ago` : "marked at a time this check cannot read";
}

/**
 * `empty` · `landed` · `carried` · `deferred` · `stopped` · `in-progress` · `held` · `pending`.
 *
 * The close accepts three of the eight, so it has to tell them apart. `ACCOUNTED` named all three from
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
  // Somebody is on it now. Read before `pending`, which would let it close clean.
  if (IN_PROGRESS.test(state)) return "in-progress";
  // Waits on a card. Read before `pending`, which would let it close clean.
  if (heldOn(row.state) !== null) return HELD_STATE;
  return "pending";
}

// ---------------------------------------------------------------------------- what `carried` names
//
// `carried` MEANS THE WORK LEAVES THIS WORKSTREAM (05-artifacts.md § The approach document).
// A carried row names a successor scope that can receive it: another workstream, in `open/` or
// `backlog/`. Three things were one value before this, and the count lied because of it.
//
//   a handover        → carried, and the target must exist and not be closed
//   sequencing        → NOT carried. A row pointing at a later arc of its own workstream resolves
//                       through that arc: landed once it lands, pending while it has not
//   a dead handover   → carried at a scope that cannot receive it, which the close refuses
//
// MEASURED ON `008` 2026-09-22: twelve carried rows, and TEN named a later arc of `008` itself.
// `carried → N15 step 8` read as accounted for the whole time step 8 sat blocked on an open card,
// and the page reported `pending 0` above it.

/** An arc of this same workstream — `N15`, `N3 step 2`, `arcs/N15-….md step 8`. Never a handover. */
const OWN_ARC = /(?:^|\/)(?:arcs\/)?N\d+[a-z]?\b/i;
/** A workstream a carry can name — `003-cloud-day-0`, `010`, `017 Phase 3`. */
const SUCCESSOR = /\b(\d{3})(?:-[a-z0-9-]+)?\b/;

/** What a carried cell points at, read from the text after the word `carried`. */
export function carryTarget(row: Row): { kind: "own-arc" | "workstream" | "unnamed"; name: string } {
  const after = row.state.replace(LEAD, "").replace(/^carried\s*(?:→|->|to)?\s*/i, "").trim();
  if (!after) return { kind: "unnamed", name: "" };
  // THE OWN-ARC TEST RUNS FIRST. `carried → arcs/N15-what-the-final-shape-left-owed.md step 8` holds
  // digits that `SUCCESSOR` would read as a workstream number if it were asked first.
  const arc = after.match(OWN_ARC);
  if (arc) return { kind: "own-arc", name: arc[0].replace(/^.*\//, "") };
  const ws = after.match(SUCCESSOR);
  if (ws) return { kind: "workstream", name: ws[1] };
  return { kind: "unnamed", name: after.slice(0, 60) };
}

/**
 * Where a named workstream sits, or `null` where none of the three states holds it. The folder IS
 * the state, so this is a directory listing and never a guess.
 */
export function workstreamState(root: string, number: string): string | null {
  for (const container of CONTAINERS) {
    for (const state of STATES) {
      const dir = join(root, DEVEX, container, state);
      if (!isDir(dir)) continue;
      for (const entry of listdir(dir)) {
        if (entry === number || entry.startsWith(`${number}-`)) return state;
      }
    }
  }
  return null;
}

/**
 * Whether a carried row can ever land, and why not where it cannot.
 *
 * FOUND ON `008`: `The decision registers` was carried to `010 Phase 3`, and `010-register-retrofit`
 * sits in `closed/`. Reading `010` showed the carry was two hops — it had closed carrying Phase 3 to
 * *its own scope, proposed and not opened*, and no such workstream exists in any state. Both closes
 * passed. The refusal falls on the page that WROTE the row, never on the workstream named, which may
 * have closed honestly on what it knew.
 */
export function carryFault(root: string, row: Row): string | null {
  const target = carryTarget(row);
  if (target.kind === "own-arc") return null;      // sequencing; `resolvedState` handles it
  if (target.kind === "unnamed")
    return `names no successor scope — a carry must name the workstream that takes it on`;
  const state = workstreamState(root, target.name);
  if (state === null) return `names workstream ${target.name}, which exists in no state`;
  if (state === "closed") return `names workstream ${target.name}, which is closed and cannot receive it`;
  return null;
}

// The words an arc's Status line may open with. `LANDED` is the only one that means finished; the
// rest all mean work is left, and an arc with no Status line at all is three of `008`'s own.
const ARC_STATES = new Set(["LANDED", "PART-LANDED", "TAKEN", "RUNNING", "OPEN", "DECIDED", "REVISED", "STOPPED"]);

/**
 * An arc's own status word, or `null` where the arc has no file or names no status.
 *
 * ARC STATUSES ARE A VOCABULARY, and only one of them means finished: `LANDED`. `PART-LANDED`,
 * `TAKEN`, `RUNNING`, `OPEN`, `DECIDED` and `REVISED` all mean work is left, and three arcs in `008`
 * carry no status line at all. So this reads the word and never guesses at the ones it does not know.
 */
export function arcStatus(root: string, subject: string, arc: string): string | null {
  for (const container of CONTAINERS) {
    for (const state of STATES) {
      const dir = join(root, DEVEX, container, state);
      if (!isDir(dir)) continue;
      for (const entry of listdir(dir)) {
        if (!(entry === subject || entry.startsWith(`${subject.slice(0, 3)}-`))) continue;
        const arcs = join(dir, entry, "arcs");
        if (!isDir(arcs)) continue;
        // `N8` LIVES IN `N7-N8-flip-and-close.md`. An arc is not always the first name in its file,
        // so a prefix match alone finds nothing and reads as *no such arc*.
        const file = listdir(arcs).find((f) =>
          f.toLowerCase().startsWith(`${arc.toLowerCase()}-`) || f.toLowerCase().includes(`-${arc.toLowerCase()}-`));
        if (!file) continue;
        const line = read(join(arcs, file)).split("\n").find((l) => /^status:/i.test(l.trim()));
        if (!line) return null;
        const word = line.replace(/^\s*status:\s*/i, "").replace(/[*_`]/g, "").trim().split(/[\s—–]/)[0]?.toUpperCase() ?? "";
        // AN UNRECOGNISED WORD IS `null`, NEVER A GUESS. `N7-N8-flip-and-close.md` holds two arcs and
        // opens `Status: **N7 LANDED … N8, the close, runs after N13.**`, so its first word is `N7`
        // and the line answers for neither arc on its own. Unknown resolves as unfinished, which
        // refuses; reading `N7` as a status would have passed `N8` on a word that is not a state.
        return ARC_STATES.has(word) ? word : null;
      }
    }
  }
  return null;
}

/**
 * Whether a sequencing row has resolved — MEANING THE ARC IT WAITS ON HAS LANDED.
 *
 * This is the transitive half of the rule: a row pointing inside its own workstream is worth exactly
 * what the arc it names is worth. Ten rows on `008` pointed at `N15`, `N3` and `N8`, and every one of
 * those arcs still had steps left while the page reported `pending 0`.
 */
export function sequencingResolved(root: string, subject: string, row: Row): boolean {
  const target = carryTarget(row);
  if (target.kind !== "own-arc") return true;
  return arcStatus(root, subject, target.name) === "LANDED";
}

/**
 * Whether a row said what became of it. Three states do; `stopped`, `in-progress`, `held`, `pending`
 * and `empty` do not.
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
function stateFolders(root: string, state: WorkstreamState): string[] {
  return [workstreamsDir(root, state), legacyWorkstreamsDir(root, state)];
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
 * The folders that hold one subject, in any state — where its arcs sit. The source of a move comes
 * first, because before the move that is the only place the subject is.
 */
export function subjectFolders(root: string, subject: string, source: string | null): string[] {
  const out: string[] = [];
  if (source && isDir(source)) out.push(resolve(source));
  for (const state of STATES)
    for (const base of stateFolders(root, state)) {
      const candidate = resolve(join(base, subject));
      if (isDir(candidate) && !out.includes(candidate)) out.push(candidate);
    }
  return out;
}

/**
 * Where this subject's workstream actually sits, so the warning names a folder you can open. Naming
 * the shape it does not have yet helps nobody.
 */
function home(root: string, subject: string): string {
  for (const base of stateFolders(root, "open")) {
    const folder = relative(root, join(base, subject));
    if (isDir(join(root, folder))) return `${folder}/`;
  }
  const legacy = join(DEVEX, ARCS, `arc-${subject}.md`);
  if (isFile(join(root, legacy))) return legacy;
  return `${relative(root, join(workstreamsDir(root, "open"), subject))}/`;
}

/**
 * An approach page written into a member repository. An approach page lives in the workstream that
 * argues it and closes with it; no pocket of a repository holds one (05-artifacts.md § The approach
 * document — a workstream's, never a repository's). A workstream's own page is where arguing it is
 * the point.
 */
function isRepoSeat(path: string): boolean {
  const normalized = slashes(resolve(path));
  if (normalized.includes(`/${DEVEX}/`)) return false;
  return normalized.endsWith(APPROACH_SUFFIX);
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

// ONE CARD SHAPE (RD.DEVEX.WORKSPACE.147). `approach-template.html` writes a card as
// `<div class="open">` wrapping `<h4 id="q<n>">`, and this reader looks for the `h4` alone. The
// `.open` block carries the amber edge that marks a card undecided, and the rail's count badge is
// `s4.querySelectorAll('.open').length`, so a card written any other way is invisible to the page as
// well as to this check. A `<tr id="q<n>">` is a row in an index of cards already settled, and a
// `<div class="card" id="q<n>">` with an `h3` is neither; both are left unread on purpose, because
// two spellings with one reader is the drift `Q185` option C was refused for.
//
// A card runs from its own `h4` to the next one or the end of the section. Reading it by the
// wrapping `<div>` does not work: the card nests a `<div class="scroll">` table and a
// `<div class="rec">`, so a non-greedy match ends at the first inner `</div>` and never sees the
// decision. That is the shape of F5.
const OPEN_SECTION = /<section id="s4"[\s\S]*?<\/section>/i;
const CARD_OPEN = /<h4[^>]*\bid="(q\d+)"[^>]*>/gi;
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
  // A ROW STATES ITS ANSWER IN WORDS, where a heading card used a `<b>Decision:</b>` marker. Both are
  // read, because the marker is what the card template ships and the row is what the pages write.
  //
  // `ANSWERED` IS REQUIRED TO BE FOLLOWED BY SOMETHING, for the reason recorded as F16: the template
  // ships `Decision:` with an empty value, so the marker's PRESENCE is never the answer — what
  // follows it is. The same trap exists here, because a row that says `OPEN` also contains the word
  // `ANSWERED` as soon as it explains what answering it would mean.
  const flattened = flat(card);
  if (/\bOPEN\b(?![^.]{0,40}\banswered\b)/.test(flattened) && !/\bANSWERED\b/.test(flattened)) return false;
  if (/\bANSWERED\b/.test(flattened)) return true;
  const found = DECISION.exec(card);
  if (!found) return false;
  const tail = found[1].split(/<\/div>|<\/p>|<h4|<\/tr/i)[0];
  return /[0-9a-z]/i.test(flat(tail));
}

/** Each card in a page's `Open` section, with whether the card itself carries its decision. */
export function cardsOf(page: string): Array<{ number: string; decided: boolean }> {
  const section = OPEN_SECTION.exec(read(page));
  if (!section) return [];
  const html = section[0];
  const out: Array<{ number: string; decided: boolean }> = [];
  CARD_OPEN.lastIndex = 0;
  for (let m = CARD_OPEN.exec(html); m; m = CARD_OPEN.exec(html)) {
    out.push({ number: m[1].toUpperCase(), decided: carriesDecision(cardAt(html, m.index)) });
  }
  return out;
}

/**
 * One card whole — from its own heading to the next card's, or to the end of the section.
 *
 * READING IT BY THE WRAPPING `<div>` DOES NOT WORK, and that is why this takes the heading as its
 * anchor: a card nests a `<div class="scroll">` around its options table and a `<div class="rec">`
 * around its recommendation, so a non-greedy match on the wrapper stops at the first inner `</div>`
 * and never reaches the decision. The heading-to-heading span has no such hole.
 */
function cardAt(html: string, start: number): string {
  const NEXT = /<h4[^>]*\bid="q\d+"[^>]*>/gi;
  NEXT.lastIndex = start + 1;
  const next = NEXT.exec(html);
  return html.slice(start, next ? next.index : html.length);
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
      const rows = workstreamPlan(subjectFolders(seatRoot, subject, null), pages);
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
        `  You are writing ${basename(target)} into that repo. While a subject is ` +
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
// THE STATUS IS ONE FIELD OF THE MASTHEAD, AND THE GATE READS THAT FIELD. `05-artifacts.md` § The
// approach document says the masthead CARRIES a status drawn from a closed set — the status is not
// the whole line. Scanning the whole line for a finished word reads the title and the lens list as
// the status, so a page stamped `Status: PLANNING` under a title carrying the word *complete* would
// close as green. Where a masthead labels its status, only what follows the label is
// read; where it does not — the older pages trail `· closed` after the audience — the whole line is,
// because there is no field to narrow to.
const STATUS_FIELD = /\bstatus\s*:\s*([^|]*)$/i;
// Both vocabularies a page in this corpus is written in, because a page carries one or the other and
// a gate that knows one of them asks for words the book does not have:
//
//   the approach document's own set   `05-artifacts.md` § The approach document —
//                                     🚧 in progress · ✅ authoritative · ✅ executed — record · living
//   a document's front-matter status  `SPDocStatusType` — DONE · IMPLEMENTING · PLANNING
//
// `closed` · `landed` · `complete` are kept beside them: the pages closed before the standard was
// written say so in those words, and a gate that stopped reading them would report nine settled
// pages as running.
const CLOSED_WORDS = ["closed", "landed", "complete", "completed", "done", "authoritative", "executed"];
// WORDS, NOT SUBSTRINGS. `incomplete` contains `complete` and `unfinished business` is not a close.
const FINISHED = new RegExp(`(?:^|[^a-z])(?:${CLOSED_WORDS.join("|")})(?:[^a-z]|$)`, "i");

/** Whether the page's own masthead says the work is finished. */
function saysItIsClosed(page: string): boolean {
  const found = EYEBROW.exec(read(page));
  if (found === null) return true;                  // no masthead to read is not a finding
  const line = flat(found[1]);
  const labelled = STATUS_FIELD.exec(line);
  return FINISHED.test(labelled ? labelled[1] : line);
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
    const folders = subjectFolders(root, subject, source && isDir(source) ? source : null);

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

    const rows = workstreamPlan(folders, pages);
    const empty = rows.filter((row) => stateOf(row) === "empty");
    // A GATE MUST SAY WHAT IT DID NOT CHECK. These two states used to leave here together, and a page
    // that planned NOTHING closed exactly as green as a page accounting for everything.
    if (!rows.length)
      return {
        note: `Close gate — \`${subject}\` carries no split plan, so nothing was checked.`,
        deny:
          `Denied: \`${subject}\` has no split plan, so this gate checked NOTHING — that is not ` +
          `the same as everything being accounted for, and it must not read the same.\n` +
          `The split plan is the step rows of the workstream's arcs: each arc's \`## Steps\` table, ` +
          `with a **Repo** column and a **State** column (02-workstream/01-workstream.md § A step ` +
          `row says where, at what altitude, and how). The gate reads those two and nothing else.\n\n` +
          `Give each arc its step table, then give each row one of three states:\n` +
          `  landed <commit>   what reached its node, and the commit that landed it\n` +
          `  carried           the successor workstream that takes it on\n` +
          `  deferred          the event that brings it back\n\n` +
          `If this scope genuinely planned nothing, say so in a one-row step table rather than by ` +
          `leaving the table out — an absent plan and a finished one are indistinguishable to any ` +
          `reader, not just to this hook.`,
      };

    const pending = rows.filter((row) => !accounted(row));
    const stopped = rows.filter((row) => stateOf(row) === "stopped");
    const running = rows.filter((row) => stateOf(row) === "in-progress");
    const held = rows.filter((row) => stateOf(row) === HELD_STATE);

    // A CARRY THAT CANNOT LAND IS NOT ACCOUNTED FOR, whatever its cell says. This runs before the
    // undecided and stopped lists because it is the one fault a reader cannot see: the cell reads
    // `carried`, the tally counts it, and the named scope will never run it.
    const dead = rows
      .filter((row) => stateOf(row) === "carried")
      .map((row) => ({ row, fault: carryFault(root, row) }))
      .filter((entry): entry is { row: Row; fault: string } => entry.fault !== null);
    // SEQUENCING THAT HAS NOT RESOLVED IS NOT ACCOUNTED FOR. A row pointing at a later arc of this
    // same workstream is worth what that arc is worth, so the close waits on the arc rather than on
    // the word in the cell. This is the transitive half of the rule, and it is what moves `008`'s
    // own number: ten rows named `N15`, `N3` and `N8`, none of which had landed.
    const unresolved = rows
      .filter((row) => stateOf(row) === "carried" && carryTarget(row).kind === "own-arc")
      .filter((row) => !sequencingResolved(root, subject, row));
    if (unresolved.length && !dead.length) {
      const listed = unresolved.slice(0, 10).map((r) => {
        const arc = carryTarget(r).name;
        return `  - ${r.scope} — waits on ${arc} (${arcStatus(root, subject, arc) ?? "no status this check can read"})`;
      }).join("\n");
      const more = unresolved.length > 10 ? `\n  … and ${unresolved.length - 10} more` : "";
      return {
        note: `Close gate — \`${subject}\` has ${unresolved.length} row(s) waiting on its own arcs.`,
        deny:
          `Denied: \`${subject}\` cannot close while a row waits on an arc of this same workstream ` +
          `that has not landed. Those rows are SEQUENCING rather than carried — the work never left ` +
          `here, so nobody else is going to do it (05-artifacts.md, The approach document).\n\n` +
          `${listed}${more}\n\n` +
          `Land the arc, or split the row: the half that reached its node becomes a landed row, and ` +
          `the half that did not becomes a row carried to a scope that can receive it, or deferred ` +
          `with the event that brings it back. Only \`LANDED\` resolves — PART-LANDED, TAKEN, ` +
          `RUNNING, DECIDED and an arc with no status all mean work is left.`,
      };
    }

    if (dead.length) {
      const listed = dead.slice(0, 10).map((d) => `  - ${d.row.scope} — ${d.row.label.slice(0, 70)}\n      ${d.fault}`).join("\n");
      const more = dead.length > 10 ? `\n  … and ${dead.length - 10} more` : "";
      return {
        note: `Close gate — \`${subject}\` carries ${dead.length} row(s) to a scope that cannot receive them.`,
        deny:
          `Denied: \`${subject}\` cannot close while a carried row names a scope that will never ` +
          `run it. \`carried\` means the work LEAVES this workstream, so the target must be another ` +
          `workstream in \`open/\` or \`backlog/\` (05-artifacts.md, The approach document).\n\n` +
          `${listed}${more}\n\n` +
          `Repair each on THIS page, never in the workstream named — a closed scope closed honestly ` +
          `on what it knew, and a receipt is not rewritten by a later standard. Either name a scope ` +
          `that can receive the work, open one, or mark the row deferred with the event that brings ` +
          `it back here.`,
      };
    }
    // EVERY ARC MUST BE FINISHED, AND NOTHING USED TO CHECK IT. This gate read arc statuses only to
    // resolve sequencing ROWS that named an arc, so an arc nobody's row happened to name could sit
    // at `RUNNING` while its workstream moved to `closed/`. Measured 2026-09-24 across the closed
    // workstreams: **8 arcs still read `OPEN`**, and one of them recorded in its own log that it had
    // landed — so the folder said finished, the arc said open, and no check had ever compared them.
    //
    // A TERMINAL STATUS IS THE WHOLE TEST. `LANDED` says nothing is owed, `CARRIED` says the work
    // left and names where, `DROPPED` says it was abandoned and why. Any other word means somebody
    // has to decide which of those three it is, and a receipt written before that decision records
    // a state nobody checked. An arc with NO status is left alone here, the same way `arc-status`
    // leaves it: a batch-shaped arc whose state has to be read is not pushed into a stamped word.
    const unfinished: string[] = [];
    const arcDirs = [...new Set([...folders, ...pages.map(dirname)].map((f) => join(f, "arcs")))];
    for (const dir of arcDirs.filter(isDir)) {
      for (const f of listdir(dir).filter((x) => x.endsWith(".md"))) {
        const st = statusIn(read(join(dir, f)));
        if (st && !TERMINAL.has(st)) unfinished.push(`  - ${f.replace(/\.md$/, "")} — ${st}`);
      }
    }
    if (unfinished.length) {
      const listed = unfinished.slice(0, 10).join("\n");
      const more = unfinished.length > 10 ? `\n  … and ${unfinished.length - 10} more` : "";
      return {
        note: `Close gate — \`${subject}\` has ${unfinished.length} arc(s) that are not finished.`,
        deny:
          `Denied: \`${subject}\` cannot close while an arc under it carries a status that is not ` +
          `terminal. The three that are: \`LANDED\` (nothing is owed), \`CARRIED\` (the work left, ` +
          `and the status names where) and \`DROPPED\` (abandoned on purpose, with the reason).\n\n` +
          `${listed}${more}\n\n` +
          `For each one, decide which of the three it is and say so in its \`Status:\` line. An arc ` +
          `left at \`PART-LANDED\` inside a closed workstream is a receipt that disagrees with ` +
          `itself, and the next reader cannot tell whether the work was finished, moved or dropped.`,
      };
    }

    if (!empty.length && !stopped.length && !running.length && !held.length) {
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
      ...(running.length ? [`${running.length} row(s) still marked in progress`] : []),
      ...(held.length ? [`${held.length} row(s) held on a card`] : []),
    ];
    // A ROW IN PROGRESS IS WORK SOMEBODY IS DOING NOW, or did and never marked landed. Either way the
    // close cannot tell which, and the mark's age is what lets the developer decide (RD.DEVEX.WORKSPACE.184).
    const runningBlock = running.length
      ? `\n\nRows still marked in progress:\n` +
        running.slice(0, 10).map((r) => `  - ${r.scope} — ${r.label.slice(0, 70)} (${markedAgo(r.state)})`).join("\n") +
        `\n\nLanding replaces the mark with what the row reached and its commit. If the window that ` +
        `marked it is gone, ask the developer before you take the row over.`
      : "";
    // A HELD ROW WAITS ON A CARD'S ANSWER (RD.DEVEX.WORKSPACE.188). Closing over it would record a
    // scope as finished while the question that can change it is still open.
    const heldBlock = held.length
      ? `\n\nRows held on a card:\n` +
        held.slice(0, 10).map((r) => `  - ${r.scope} — ${r.label.slice(0, 70)} (waits on ${heldOn(r.state)})`).join("\n") +
        `\n\nAnswer the card, record the answer, and run the row or mark it carried or deferred.`
      : "";
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
        `row somebody started and put down, is still on, or is held on a card. The check is ACCOUNTED FOR, never finished — landed, ` +
        `carried and deferred all pass, and closing a scope with work pending is a normal act.\n` +
        (empty.length ? `Undecided rows:\n${listed}${more}` : "") +
        stoppedBlock +
        runningBlock +
        heldBlock +
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
      const rows = workstreamPlan(subjectFolders(root, subject, null), pages);
      if (!rows.length) {
        console.log(`  ${subject}: no arc carries a step table with Repo and State — no split plan yet`);
        continue;
      }
      // SEQUENCING IS COUNTED APART FROM HANDOVER. A row pointing at a later arc of this same
      // workstream is not carried; it resolves through that arc, and counting it as accounted for is
      // how `pending 0` stood over ten rows of undone work.
      const tally: Record<string, number> = { landed: 0, carried: 0, sequencing: 0, deferred: 0, stopped: 0, "in-progress": 0, [HELD_STATE]: 0, pending: 0, empty: 0 };
      for (const row of rows) {
        const state = stateOf(row);
        // A carried row pointing inside this workstream is sequencing, and it is reported as its own
        // number. The sweep is where a reader takes the count from, so this is where it has to be true.
        if (state === "carried" && carryTarget(row).kind === "own-arc") tally.sequencing += 1;
        else tally[state] += 1;
      }
      console.log(
        `  ${subject}: ${rows.length} rows · landed ${tally.landed} · carried ${tally.carried} · ` +
        `sequencing ${tally.sequencing} · deferred ${tally.deferred} · stopped ${tally.stopped} · ` +
        `in progress ${tally["in-progress"]} · held ${tally[HELD_STATE]} · ` +
        `pending ${tally.pending} · undecided ${tally.empty} · ${pages.length} page(s)`);
      for (const row of rows)
        if (stateOf(row) === "empty") console.log(`      undecided  ${row.scope} — ${row.label.slice(0, 70)}`);
      // NAMED, NOT JUST COUNTED. `sequencing 10` above a page reading `pending 0` is still a number
      // somebody has to go and resolve by hand, and the arcs it waits on are what they need.
      const waiting = rows.filter((row) => stateOf(row) === "carried" && carryTarget(row).kind === "own-arc");
      for (const row of waiting)
        console.log(`      sequencing  ${row.scope} — waits on ${carryTarget(row).name}`);
      const broken = rows.filter((row) => stateOf(row) === "carried").map((row) => [row, carryFault(root, row)] as const).filter(([, f]) => f);
      for (const [row, fault] of broken)
        console.log(`      DEAD CARRY  ${row.scope} — ${fault}`);
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
