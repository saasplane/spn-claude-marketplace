// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § An arc is cut by what is reviewed and released together, and named for its domain · § The formats · § An arc's status is one of six, stored or worked out · § Questions are records, and every card is one rendered · § A suggestion is recorded the moment it is raised · § Ideation is kept as it happens
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The one schema for every file a script owns in a workstream. `workstream state check` runs it, and
// every `workstream` write runs it first, so a file that fails it is never written.
//
// A FIELD IS ADDED AND NEVER REPURPOSED, so a field this schema does not know is left alone.

import { STORED_STATUSES } from "../checks/arc-status.ts";

/** The version this plugin reads and writes. Migration 006 brings a version 1 file to 2. */
export const SCHEMA_VERSION = 2;

/** A row's state. A row with rows under it takes its state from them and never has one written. */
export const ROW_STATES = ["waiting", "ready", "running", "stopped", "replaced", "landed", "carried", "deferred"] as const;
export type RowState = (typeof ROW_STATES)[number];
/** The row states that say what became of a row: landed, replaced by later steps, carried or deferred. */
export const DONE_STATES: ReadonlySet<string> = new Set(["landed", "replaced", "carried", "deferred"]);
/**
 * What kind of build step a row is: a small correction, a change, or a wait on a card. Reading and drafting are
 * planning jobs and are never recorded, so every row is a build step (RULE.DEVEX.WORKSPACE.278).
 */
export const ROW_KINDS = ["fix", "change", "question"] as const;
/** A step row's altitude (§ A step row says where, at what altitude, and how). */
export const ALTITUDES = ["DOCS", "CODE", "GENERATED", "RELEASE", "PROOF"] as const;
/** The stored statuses that carry a reason. */
export const REASONED: ReadonlySet<string> = new Set(["CARRIED", "DROPPED"]);
export const SUGGESTION_STATES = ["raised", "shaped", "decided", "parked", "dropped"] as const;
export const QUESTION_STATES = ["open", "answered", "withdrawn"] as const;
/** The outcomes a child's report may carry. */
export const OUTCOMES = ["landed", "stopped", "needs-you"] as const;

/** An arc's id, `N007`, with an optional letter. */
export const ARC_ID = /^N\d+[a-z]?$/;
/** The longest an arc's subject may be (RULE.DEVEX.WORKSPACE.265). */
export const SUBJECT_MAX = 24;
/** An arc's subject: one to three words in kebab-case, lower case letters and digits. */
const SUBJECT_FORM = /^[a-z0-9]+(?:-[a-z0-9]+){0,2}$/;

/**
 * What is wrong with an arc's subject, as the words a refusal or a finding ends with, or null where it
 * is short: one to three words of at most 24 characters, in kebab-case (RULE.DEVEX.WORKSPACE.265).
 */
export function subjectFault(subject: string): string | null {
  if (!SUBJECT_FORM.test(subject)) {
    const words = subject.split(/[-\s]+/).filter(Boolean).length;
    return words > 3 ? `is ${words} words, and a subject is one to three` : "is not one to three words in kebab-case, such as `layout-model`";
  }
  if (subject.length > SUBJECT_MAX) return `is ${subject.length} characters, and a subject is at most ${SUBJECT_MAX}`;
  return null;
}
/** A row's id: a number, an optional letter, and optional dotted parts — `57`, `57b`, `3e.1`. */
export const ROW_ID = /^\d+[a-z]?(?:\.\d+[a-z]?)*$/i;
export const FACT_ID = /^f\d+$/;
/** The version of `sheet.json` this plugin reads and writes. */
export const SHEET_SCHEMA_VERSION = 1;
/** A change-sheet entry's id, `E3`. */
export const ENTRY_ID = /^E\d+$/;
/** What an entry does to its file. */
export const ENTRY_OPS = ["create", "edit", "drop", "rename"] as const;
/** The tiers an entry's tests are named at. */
export const TIERS = ["unit", "component", "contract", "integration", "journey"] as const;
export const SUGGESTION_ID = /^s\d+$/;
export const QUESTION_ID = /^q\d+$/;
/** What a row may wait on: a row of its arc, a card, or an arc or a row of another arc (`N011`, `N011/3`). */
export const BLOCKER = /^(?:\d+[a-z]?(?:\.\d+[a-z]?)*|q\d+|N\d+[a-z]?(?:\/\d+[a-z]?(?:\.\d+[a-z]?)*)?)$/i;

export type Cost = { tokens: number; minutes: number };
export type ArcRow = {
  id: string; parent: string; title: string; kind: string;
  repo?: string | null; altitude?: string | null; mechanism?: string | null; acceptance?: string | null; model?: string | null;
  blockedBy?: string[]; touches?: string[]; decisions?: string[]; facts?: string[]; entries?: string[];
  state?: RowState | null; proof?: string | null; cost?: Cost | null; commits?: Record<string, string[]> | null; order?: string | null;
  [field: string]: unknown;
};
export type ArcData = {
  schemaVersion: number; arc: string; subject: string; title: string; goal?: string | null; status: string; reason: string | null;
  wait?: string | null; reviewFixes?: boolean;
  carries?: string[]; decides?: string | null; repos?: string[]; cycle?: string | null; follows?: string | null; model?: string | null; position?: number | null;
  preview: string; rows: ArcRow[];
  [field: string]: unknown;
};
export type LogLine = { at: string; kind: string; row?: string | null; note?: string | null; [field: string]: unknown };
export type Fact = { id: string; fact: string; source: string; commit: string; readAt: string; usedBy: string[]; [field: string]: unknown };
export type Suggestion = { id: string; title: string; state: string; preview: string | null; words: string | null; [field: string]: unknown };
export type View = { lens: string; text: string };
export type Option = { key: string; does: string; costs: string };
export type Card = { why: string; what: string; viewsLead: string; views: View[]; options: Option[]; recommended: { key: string; reason: string } };
export type Answer = { key?: string | null; words: string; at: string };
/** `raisedBy` is the session id of the window that raised the card; a card raised before it was recorded has none. */
export type Question = { id: string; arc: string; title: string; state: string; raised: string; raisedBy?: string; shownIn: string[]; card: Card; answer: Answer | null; [field: string]: unknown };

// ---------------------------------------------------------------------------- the field rules

type Rule =
  | { kind: "string"; required: boolean; pattern?: RegExp }
  | { kind: "text"; required: boolean }                         // a string or null
  | { kind: "enum"; required: boolean; values: readonly string[]; nullable?: boolean }
  | { kind: "strings"; required: boolean; pattern?: RegExp }
  | { kind: "number"; required: boolean; nullable?: boolean }
  | { kind: "boolean"; required: boolean };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Each fault one field has against its rule, named by `where`. */
function fieldFaults(where: string, record: Record<string, unknown>, fields: Record<string, Rule>): string[] {
  const out: string[] = [];
  for (const [name, rule] of Object.entries(fields)) {
    const value = record[name];
    const absent = value === undefined;
    if (absent) { if (rule.required) out.push(`${where} has no \`${name}\``); continue; }
    switch (rule.kind) {
      case "string":
        if (typeof value !== "string" || !value.trim()) out.push(`${where}'s \`${name}\` is not a text`);
        else if (rule.pattern && !rule.pattern.test(value)) out.push(`${where}'s \`${name}\` \`${value}\` is not of the form ${rule.pattern}`);
        break;
      case "text":
        if (value !== null && typeof value !== "string") out.push(`${where}'s \`${name}\` is neither a text nor null`);
        break;
      case "enum":
        if (value === null && rule.nullable) break;
        if (typeof value !== "string" || !rule.values.includes(value))
          out.push(`${where}'s \`${name}\` is \`${String(value)}\`, and it is one of ${rule.values.join(" · ")}`);
        break;
      case "strings":
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) out.push(`${where}'s \`${name}\` is not a list of texts`);
        else if (rule.pattern) for (const item of value) if (!rule.pattern.test(item)) out.push(`${where}'s \`${name}\` holds \`${item}\`, which is not of the form ${rule.pattern}`);
        break;
      case "number":
        if (value === null && rule.nullable) break;
        if (typeof value !== "number" || !Number.isFinite(value)) out.push(`${where}'s \`${name}\` is not a number`);
        break;
      case "boolean":
        if (typeof value !== "boolean") out.push(`${where}'s \`${name}\` is neither true nor false`);
        break;
    }
  }
  return out;
}

const ARC_FIELDS: Record<string, Rule> = {
  arc: { kind: "string", required: true, pattern: ARC_ID },
  subject: { kind: "string", required: true },
  title: { kind: "string", required: true },
  goal: { kind: "text", required: false },
  status: { kind: "enum", required: true, values: STORED_STATUSES },
  reason: { kind: "text", required: true },
  wait: { kind: "text", required: false },
  reviewFixes: { kind: "boolean", required: false },
  decides: { kind: "text", required: false },
  repos: { kind: "strings", required: false },
  cycle: { kind: "text", required: false },
  follows: { kind: "text", required: false },
  carries: { kind: "strings", required: false, pattern: SUGGESTION_ID },
  model: { kind: "text", required: false },
  position: { kind: "number", required: false },
  preview: { kind: "string", required: true },
};

const ROW_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: ROW_ID },
  parent: { kind: "string", required: true },
  title: { kind: "string", required: true },
  kind: { kind: "enum", required: true, values: ROW_KINDS },
  repo: { kind: "text", required: false },
  altitude: { kind: "enum", required: false, values: ALTITUDES, nullable: true },
  mechanism: { kind: "text", required: false },
  acceptance: { kind: "text", required: false },
  model: { kind: "text", required: false },
  blockedBy: { kind: "strings", required: false, pattern: BLOCKER },
  touches: { kind: "strings", required: false, pattern: /^[^:\s]+:\S/ },
  decisions: { kind: "strings", required: false },
  facts: { kind: "strings", required: false, pattern: FACT_ID },
  entries: { kind: "strings", required: false, pattern: ENTRY_ID },
  state: { kind: "enum", required: false, values: ROW_STATES, nullable: true },
  proof: { kind: "text", required: false },
  order: { kind: "text", required: false },
};

/** The row ids that have rows under them. */
export function parentIds(rows: readonly ArcRow[]): Set<string> {
  return new Set(rows.map((row) => row.parent).filter((parent): parent is string => typeof parent === "string"));
}

/**
 * Why a `schemaVersion` this plugin does not read is refused, naming what to do: a newer file asks for a newer
 * plugin, and an older one for the migration that brings it to this version.
 */
export function versionFault(version: unknown, where = "state.json"): string {
  if (typeof version === "number" && version > SCHEMA_VERSION)
    return `${where}'s \`schemaVersion\` is ${version}, and this spn-devex reads ${SCHEMA_VERSION}: update the plugin, and it reads the file`;
  return `${where}'s \`schemaVersion\` is \`${String(version)}\`, and this spn-devex reads ${SCHEMA_VERSION}: \`spn-devex plugin migration write 006\` brings it to ${SCHEMA_VERSION}`;
}

/** Every fault of an arc's `state.json`, read as JSON already. Empty where it holds to the schema. */
export function arcFaults(data: unknown, where = "state.json"): string[] {
  if (!isObject(data)) return [`${where} is not a JSON object`];
  const out: string[] = [];
  if (data.schemaVersion !== SCHEMA_VERSION) out.push(versionFault(data.schemaVersion, where));
  out.push(...fieldFaults(where, data, ARC_FIELDS));
  if (typeof data.status === "string" && REASONED.has(data.status) && !(typeof data.reason === "string" && data.reason.trim()))
    out.push(`${where} is ${data.status} and carries no \`reason\``);
  if (!Array.isArray(data.rows)) { out.push(`${where}'s \`rows\` is not a list`); return out; }
  const rows = data.rows as unknown[];
  const ids = new Set<string>();
  for (const [at, row] of rows.entries()) {
    if (!isObject(row)) { out.push(`${where}'s row ${at + 1} is not an object`); continue; }
    const label = `row ${typeof row.id === "string" ? row.id : at + 1}`;
    out.push(...fieldFaults(label, row, ROW_FIELDS));
    if (typeof row.id === "string") {
      if (ids.has(row.id)) out.push(`${label} is written twice`);
      ids.add(row.id);
    }
    if (row.cost !== undefined && row.cost !== null &&
        !(isObject(row.cost) && typeof row.cost.tokens === "number" && typeof row.cost.minutes === "number"))
      out.push(`${label}'s \`cost\` is not { tokens, minutes }`);
    if (row.commits !== undefined && row.commits !== null &&
        !(isObject(row.commits) && Object.values(row.commits).every((list) => Array.isArray(list) && list.every((sha) => typeof sha === "string"))))
      out.push(`${label}'s \`commits\` is not { repository: [commit, …] }`);
  }
  const typed = rows.filter(isObject) as ArcRow[];
  const parents = parentIds(typed);
  for (const row of typed) {
    if (typeof row.parent === "string" && row.parent !== data.arc && !ids.has(row.parent))
      out.push(`row ${row.id}'s \`parent\` \`${row.parent}\` is neither the arc nor one of its rows`);
    if (parents.has(row.id) && row.state !== undefined && row.state !== null)
      out.push(`row ${row.id} has rows under it, so its state is theirs and is never written`);
    if (!parents.has(row.id) && (row.state === undefined || row.state === null))
      out.push(`row ${row.id} has no \`state\``);
    for (const blocker of Array.isArray(row.blockedBy) ? row.blockedBy : [])
      if (ROW_ID.test(blocker) && !ids.has(blocker)) out.push(`row ${row.id} waits on row ${blocker}, which the arc does not hold`);
  }
  return out;
}

const LOG_FIELDS: Record<string, Rule> = {
  at: { kind: "string", required: true }, kind: { kind: "string", required: true },
  row: { kind: "text", required: false }, note: { kind: "text", required: false },
};
const FACT_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: FACT_ID }, fact: { kind: "string", required: true },
  source: { kind: "string", required: true }, commit: { kind: "string", required: true },
  readAt: { kind: "string", required: true }, usedBy: { kind: "strings", required: true },
};
const SUGGESTION_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: SUGGESTION_ID }, title: { kind: "string", required: true },
  state: { kind: "enum", required: true, values: SUGGESTION_STATES },
  preview: { kind: "text", required: true }, words: { kind: "text", required: true },
};
const QUESTION_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: QUESTION_ID }, arc: { kind: "string", required: true, pattern: ARC_ID },
  title: { kind: "string", required: true }, state: { kind: "enum", required: true, values: QUESTION_STATES },
  raised: { kind: "string", required: true }, raisedBy: { kind: "string", required: false }, shownIn: { kind: "strings", required: true },
};

export const logFaults = (line: unknown, where: string): string[] =>
  isObject(line) ? fieldFaults(where, line, LOG_FIELDS) : [`${where} is not a JSON object`];
export const factFaults = (line: unknown, where: string): string[] =>
  isObject(line) ? fieldFaults(where, line, FACT_FIELDS) : [`${where} is not a JSON object`];
export const suggestionFaults = (line: unknown, where: string): string[] =>
  isObject(line) ? fieldFaults(where, line, SUGGESTION_FIELDS) : [`${where} is not a JSON object`];

/**
 * Each part a card is missing: why, what, the views' lead and the views, at least two options each
 * with what it does and costs, and a recommendation naming one of them. A card is whole from the
 * moment it is raised, so `question raise` refuses one that is not.
 */
export function cardFaults(card: unknown, where = "the card"): string[] {
  if (!isObject(card)) return [`${where} is not a JSON object`];
  const out: string[] = [];
  const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  for (const part of ["why", "what", "viewsLead"]) if (!text(card[part])) out.push(`${where} has no \`${part}\``);
  const views = Array.isArray(card.views) ? card.views : [];
  if (!views.length) out.push(`${where} has no \`views\``);
  for (const [at, view] of views.entries())
    if (!isObject(view) || !text(view.lens) || !text(view.text)) out.push(`${where}'s view ${at + 1} has no lens or no text`);
  const options = Array.isArray(card.options) ? card.options : [];
  if (options.length < 2) out.push(`${where} has fewer than two \`options\``);
  for (const [at, option] of options.entries())
    if (!isObject(option) || !text(option.key) || !text(option.does) || !text(option.costs))
      out.push(`${where}'s option ${at + 1} has no key, no \`does\` or no \`costs\``);
  const recommended = card.recommended;
  if (!isObject(recommended) || !text(recommended.key) || !text(recommended.reason)) out.push(`${where} has no \`recommended\` key and reason`);
  else if (!options.some((option) => isObject(option) && option.key === recommended.key))
    out.push(`${where} recommends \`${String(recommended.key)}\`, which is none of its options`);
  return out;
}

/** Every fault of one question record. */
export function questionFaults(line: unknown, where: string): string[] {
  if (!isObject(line)) return [`${where} is not a JSON object`];
  const out = [...fieldFaults(where, line, QUESTION_FIELDS), ...cardFaults(line.card, `${where}'s card`)];
  if (line.state === "open" && line.answer !== null && line.answer !== undefined) out.push(`${where} is open and carries an answer`);
  if ((line.state === "answered" || line.state === "withdrawn") &&
      !(isObject(line.answer) && typeof line.answer.words === "string" && typeof line.answer.at === "string"))
    out.push(`${where} is ${String(line.state)} and carries no answer with your words and when`);
  return out;
}

// ---------------------------------------------------------------------------- the change sheet

export type SheetStack = { folder: string; dmo: string; reset: string; ports?: string };
export type SheetEntry = {
  id: string; op: string; file: string; what: string; decidedBy: string[]; facts: string[]; then: string[];
  rules: string[]; callers: string[]; tiers: Record<string, string[]>; docs: string[]; book: string[];
  /** The kind of change the entry is; a sheet written before it was added has none, and `entryAltitude` reads the file's kind. */
  altitude?: string | null;
  [field: string]: unknown;
};
export type Sheet = { schemaVersion: number; releaseChain: string[]; dependsOn: string[]; stack: SheetStack | null; entries: SheetEntry[]; [field: string]: unknown };

const STACK_FIELDS: Record<string, Rule> = {
  folder: { kind: "string", required: true }, dmo: { kind: "string", required: true },
  reset: { kind: "string", required: true }, ports: { kind: "text", required: false },
};
const SHEET_FIELDS: Record<string, Rule> = {
  releaseChain: { kind: "strings", required: true }, dependsOn: { kind: "strings", required: true },
};
const ENTRY_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: ENTRY_ID },
  op: { kind: "enum", required: true, values: ENTRY_OPS },
  file: { kind: "string", required: true, pattern: /^[^:\s]+:\S/ },
  what: { kind: "string", required: true },
  decidedBy: { kind: "strings", required: true }, facts: { kind: "strings", required: true, pattern: FACT_ID },
  then: { kind: "strings", required: true }, rules: { kind: "strings", required: true }, callers: { kind: "strings", required: true },
  docs: { kind: "strings", required: true }, book: { kind: "strings", required: true },
  altitude: { kind: "enum", required: false, values: ALTITUDES, nullable: true },
};

/**
 * An entry's kind of change, from which an arc's steps are derived: the one it names, else the kind of its file's path —
 * a dist bundle or a generated ref is GENERATED, a docs or refs file DOCS, and a source or test file CODE.
 */
export function entryAltitude(entry: Pick<SheetEntry, "file" | "altitude">): (typeof ALTITUDES)[number] {
  if (typeof entry.altitude === "string" && (ALTITUDES as readonly string[]).includes(entry.altitude)) return entry.altitude as (typeof ALTITUDES)[number];
  const path = entry.file.slice(entry.file.indexOf(":") + 1);
  if (/(^|\/)dist\//.test(path) || /generated/i.test(path)) return "GENERATED";
  if (/(^|\/)(docs|refs)\//.test(path) || /\.md$/.test(path)) return "DOCS";
  return "CODE";
}

/**
 * Every fault of a change sheet, read as JSON already. The header's faults are named by `where`; an entry's by its id, so a
 * refusal reads `E3 has no \`tiers\``. A null stack is whole here (the opening write); `sheet write` refuses it.
 */
export function sheetFaults(data: unknown, where = "sheet.json"): string[] {
  if (!isObject(data)) return [`${where} is not a JSON object`];
  const out: string[] = [];
  if (data.schemaVersion !== SHEET_SCHEMA_VERSION) out.push(`${where}'s \`schemaVersion\` is \`${String(data.schemaVersion)}\`, and this spn-devex reads ${SHEET_SCHEMA_VERSION}`);
  out.push(...fieldFaults(where, data, SHEET_FIELDS));
  if (data.stack === undefined) out.push(`${where} has no \`stack\``);
  else if (data.stack !== null) out.push(...(isObject(data.stack) ? fieldFaults(`${where}'s stack`, data.stack, STACK_FIELDS) : [`${where}'s \`stack\` is neither { folder, dmo, reset } nor null`]));
  if (!Array.isArray(data.entries)) { out.push(`${where}'s \`entries\` is not a list`); return out; }
  const seen = new Set<string>();
  for (const [at, entry] of data.entries.entries()) {
    if (!isObject(entry)) { out.push(`${where}'s entry ${at + 1} is not an object`); continue; }
    const label = typeof entry.id === "string" && entry.id ? entry.id : `entry ${at + 1}`;
    out.push(...fieldFaults(label, entry, ENTRY_FIELDS));
    if (typeof entry.id === "string") { if (seen.has(entry.id)) out.push(`${label} is written twice`); seen.add(entry.id); }
    if (Array.isArray(entry.facts) && !entry.facts.length) out.push(`${label} names no fact`);
    if (entry.tiers === undefined) out.push(`${label} has no \`tiers\``);
    else if (!isObject(entry.tiers)) out.push(`${label}'s \`tiers\` is not an object from a tier to its behaviour ids`);
    else for (const [tier, ids] of Object.entries(entry.tiers)) {
      if (!(TIERS as readonly string[]).includes(tier)) out.push(`${label}'s \`tiers\` holds \`${tier}\`, and a tier is one of ${TIERS.join(" · ")}`);
      else if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || !id.trim())) out.push(`${label}'s \`${tier}\` is not a list of behaviour ids`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------- the go plan

/** The version of `go.json` this plugin reads and writes. */
export const GO_SCHEMA_VERSION = 1;
/** The passes of a go, in the order they run inside a repository (the release comes last, after every repository). */
export const GO_PASSES = ["BASELINE", "DOCS", "CODE", "FULL_RUN", "GENERATED", "RELEASE"] as const;
/** Where a part of a go stands. `waiting` is a part that waits on something outside the window, named in its `waitingOn`. */
export const GO_PART_STATES = ["ready", "running", "held", "landed", "waiting"] as const;
/** A part's id: its pass in lower case, its repository and its number, `code-spn-claude-marketplace-2`; a baseline or full run has no number. */
export const GO_PART_ID = /^(baseline|docs|code|full|generated|release)-\S+$/;
/** An entry as a go names it: its arc and its id, `N009/E14`. */
export const GO_ENTRY = /^N\d+[a-z]?\/E\d+$/;

export type GoPass = (typeof GO_PASSES)[number];
/**
 * One part of a go: what one helper carries out. `signature` is the entries' hashes joined by `.`, in the order of
 * `entries`, so a changed entry is the one whose hash differs.
 */
export type GoPart = {
  id: string; repo: string; pass: GoPass; entries: string[]; tests: string[];
  minutes: number | null; measuredFrom: string | null; waitsOn: string[]; model: string; signature: string;
  state: (typeof GO_PART_STATES)[number];
  /** What a `waiting` part waits on, in plain words: a release, a sign-in, another window's hold. */
  waitingOn?: string | null;
};
/** The plan of a go, written only by `go write` into the lead arc's folder: the arcs it covers and its parts in build order. */
export type GoPlan = { schemaVersion: number; lead: string; scope: string[]; writtenAt: string; parts: GoPart[] };

const GO_FIELDS: Record<string, Rule> = {
  lead: { kind: "string", required: true, pattern: ARC_ID }, scope: { kind: "strings", required: true, pattern: ARC_ID },
  writtenAt: { kind: "string", required: true },
};
const GO_PART_FIELDS: Record<string, Rule> = {
  id: { kind: "string", required: true, pattern: GO_PART_ID }, repo: { kind: "string", required: true },
  pass: { kind: "enum", required: true, values: GO_PASSES },
  entries: { kind: "strings", required: true, pattern: GO_ENTRY }, tests: { kind: "strings", required: true },
  minutes: { kind: "number", required: true, nullable: true }, measuredFrom: { kind: "text", required: true },
  waitsOn: { kind: "strings", required: true }, model: { kind: "string", required: true },
  signature: { kind: "text", required: true }, state: { kind: "enum", required: true, values: GO_PART_STATES },
  waitingOn: { kind: "text", required: false },
};

/** Every fault of a go plan, read as JSON already. Empty where it holds to the schema. */
export function goFaults(data: unknown, where = "go.json"): string[] {
  if (!isObject(data)) return [`${where} is not a JSON object`];
  const out: string[] = [];
  if (data.schemaVersion !== GO_SCHEMA_VERSION) out.push(`${where}'s \`schemaVersion\` is \`${String(data.schemaVersion)}\`, and this spn-devex reads ${GO_SCHEMA_VERSION}`);
  out.push(...fieldFaults(where, data, GO_FIELDS));
  if (!Array.isArray(data.parts)) { out.push(`${where}'s \`parts\` is not a list`); return out; }
  const ids = new Set<string>();
  // An entry is open in one part at most; a landed part keeps its entries when a follow-up carries one again.
  const held = new Map<string, string>();
  for (const [at, part] of data.parts.entries()) {
    if (!isObject(part)) { out.push(`${where}'s part ${at + 1} is not an object`); continue; }
    const label = typeof part.id === "string" && part.id ? `part ${part.id}` : `part ${at + 1}`;
    out.push(...fieldFaults(label, part, GO_PART_FIELDS));
    if (typeof part.id === "string") { if (ids.has(part.id)) out.push(`${label} is written twice`); ids.add(part.id); }
    if (Array.isArray(part.entries)) {
      const hashes = typeof part.signature === "string" && part.signature ? part.signature.split(".").length : 0;
      if (!part.entries.length && part.pass !== "BASELINE" && part.pass !== "FULL_RUN" && part.pass !== "RELEASE") out.push(`${label} holds no entry`);
      if (typeof part.signature === "string" && hashes !== part.entries.length)
        out.push(`${label}'s \`signature\` holds ${hashes} hashes, and the part holds ${part.entries.length} entries`);
      for (const entry of part.entries) {
        if (typeof entry !== "string" || part.state === "landed") continue;
        const other = held.get(entry);
        if (other && other !== label) out.push(`${entry} is held by ${other} and ${label}`);
        held.set(entry, label);
      }
    }
  }
  return out;
}
