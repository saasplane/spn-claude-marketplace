// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § Three classes of rule
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The one parser of a rule's parenthesis: `(rule <ID> · <LEVEL> · key:value …)` in the book, and
// ``(`<ID>` · <LEVEL> · key:value …)`` in a plugin file. Every reader of a rule's level or holder uses it.
//
// It holds the grammar and reads no disk. Whether a named check, skill or arc exists is the book check's question.

/** A rule's id: `RULE.<AREA>.<DOMAIN>.<NNN>`, where the area and the domain may carry an underscore. */
export const RULE_ID_SRC = "RULE\\.[A-Z_]+\\.[A-Z_]+\\.\\d{3}";

/** How strongly a rule binds. A rule sentence carries no MUST of its own, so this is the only signal. */
export const LEVELS = ["MUST", "GUIDE"] as const;
export type RuleLevel = (typeof LEVELS)[number];

/** The closed list of param keys. A key joins this list, and the book's table of it, before any rule uses it. */
export const PARAM_KEYS = ["check", "due", "short", "skill"] as const;
export type ParamKey = (typeof PARAM_KEYS)[number];

/** What holds a rule. `short` stands alone, and every other key takes one token. */
export type RuleParams = { check?: string; due?: string; short?: true; skill?: string };

/** The class a rule's level and params put it in, in the words the book's table uses. */
export type RuleClass = "checked" | "stated" | "stated in a skill" | "guidance";

/** Where a parenthesis was written: the book names the rule `rule <ID>`, a plugin file cites `` `<ID>` ``. */
export type MarkForm = "book" | "ref";

/** One parenthesis, read where it stands. */
export type RuleMark = {
  id: string;
  /** Null where the parenthesis names no level, which the book check refuses. */
  level: RuleLevel | null;
  params: RuleParams;
  form: MarkForm;
  /** The parenthesis exactly as written. */
  raw: string;
  /** The line the parenthesis is on, from 1. */
  line: number;
  /** The nearest heading above it, without its `#` marks. */
  heading: string;
  /** The bold sentence the parenthesis ends, or null where it ends none. */
  sentence: string | null;
};

/** A parenthesis that does not read, with what is wrong in words a writer can act on. */
export type MarkFault = { line: number; raw: string; fault: string };

/** Every parenthesis in one text, and every one that did not read. */
export type ReadMarks = { marks: RuleMark[]; faults: MarkFault[] };

/** One rule as the index holds it: the book's parenthesis, where it stands, and who restates it. */
export type RuleEntry = {
  id: string;
  level: RuleLevel;
  params: RuleParams;
  class: RuleClass;
  /** The chapter that states the rule, from the book's root, and the heading it sits under. */
  chapter: string;
  heading: string;
  /** The register row that shares the rule's number, where one exists. */
  decision: string | null;
  /** Each plugin file that restates the parenthesis, and the heading it sits under. */
  restated: Array<{ plugin: string; path: string; heading: string }>;
  /** A short rule's line: the first devex ref's sentence for it, and where it points. Only on a `short` rule. */
  line?: { text: string; ref: string; heading: string };
};

/** `refs/rules.json`: every rule of the book, and the book commit it was read at. */
export type RulesIndex = {
  schemaVersion: 1;
  book: { repository: "spn-foundation"; commit: string };
  rules: RuleEntry[];
};

/** What a chip on an HTML page shows: its words, the anchor a citation links to, and the holder on hover. */
export type Chip = { label: string; anchor: string; title: string };

const SEP = " · ";
const BODY = `[^()\\n]*`;
// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- built from this file's constants
const BOOK_MARK = new RegExp(`\\(rule (${RULE_ID_SRC})(${BODY})\\)`, "g");
// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- built from this file's constants
const REF_MARK = new RegExp(`\\(\`(${RULE_ID_SRC})\`(${BODY})\\)`, "g");
const TOKEN = /^[a-z0-9][a-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)?$/;
// A check named for a repository's own test file is held by that test: `t-<name>.mjs` or `<name>.spec.ts`.
const TEST_HOLDER = /^(?:t-[a-z0-9][a-z0-9-]*\.mjs|[a-z0-9][a-z0-9-]*\.spec\.ts)$/;
const HEADING = /^#{1,6}[ \t]+(.+?)[ \t]*$/;
const BOLD_BEFORE = /\*\*((?:(?!\*\*)[^\n])+?)\*\*\s*$/;

/** Whether a `check:` names a repository's own test file rather than a hook check, so no plugin ships it. */
export function isTestHolder(check: string): boolean {
  return TEST_HOLDER.test(check);
}

/**
 * The fields after the id, read in order: the level, then each param. The id is read by the caller.
 * Returns the level and params, or the first fault, because a writer fixes one thing at a time.
 */
export function parseFields(rest: string): { level: RuleLevel | null; params: RuleParams } | { fault: string } {
  if (rest === "") return { level: null, params: {} };
  const fields = rest.split(SEP);
  if (fields[0] !== "") return { fault: "the fields after the id are separated by ` · `, one id to a parenthesis" };
  fields.shift();
  let level: RuleLevel | null = null;
  if (fields.length && (LEVELS as readonly string[]).includes(fields[0])) level = fields.shift() as RuleLevel;
  const params: RuleParams = {};
  for (const field of fields) {
    const [key, ...value] = field.split(":");
    const token = value.join(":");
    if (!(PARAM_KEYS as readonly string[]).includes(key))
      return { fault: `\`${key}\` is not a param key — the list is ${PARAM_KEYS.map((k) => `\`${k}\``).join(", ")}` };
    if (key in params) return { fault: `\`${key}\` is given twice` };
    if (key === "short") {
      if (value.length) return { fault: "`short` takes no value" };
      params.short = true;
      continue;
    }
    if (!TOKEN.test(token) && !(key === "check" && TEST_HOLDER.test(token)))
      return { fault: `\`${key}:\` takes one token, with no spaces and no quotes` };
    params[key as Exclude<ParamKey, "short">] = token;
  }
  return { level, params };
}

/**
 * What the level and the params say together, where they say something the class table refuses: a MUST
 * that nothing holds, a guidance rule that names a holder, a `due:` with no `check:`, two holders.
 */
export function holderFaults(level: RuleLevel | null, params: RuleParams): string[] {
  if (level === null) return ["the parenthesis names no level — MUST or GUIDE"];
  const holders = (["check", "short", "skill"] as const).filter((key) => params[key] !== undefined);
  const faults: string[] = [];
  if (level === "GUIDE" && (holders.length || params.due)) faults.push("a guidance rule names no holder");
  if (level === "MUST" && !holders.length) faults.push("a MUST names what holds it: `check:`, `short` or `skill:`");
  if (holders.length > 1) faults.push(`one holder, never ${holders.map((key) => `\`${key}\``).join(" and ")}`);
  if (params.due && !params.check) faults.push("`due:` waits on a check, so it comes with `check:`");
  return faults;
}

/** The class of a rule that reads, or null for one whose holder faults. */
export function classOf(level: RuleLevel | null, params: RuleParams): RuleClass | null {
  if (holderFaults(level, params).length) return null;
  if (level === "GUIDE") return "guidance";
  if (params.check) return "checked";
  if (params.skill) return "stated in a skill";
  return "stated";
}

/** The parenthesis written back, in the form of the place it goes: the book's or a plugin file's. */
export function formatMark(id: string, level: RuleLevel, params: RuleParams, form: MarkForm): string {
  const fields = [form === "book" ? `rule ${id}` : `\`${id}\``, level];
  for (const key of PARAM_KEYS) {
    const value = params[key];
    if (value === true) fields.push(key);
    else if (value !== undefined) fields.push(`${key}:${value}`);
  }
  return `(${fields.join(SEP)})`;
}

/**
 * Every parenthesis in one markdown text. A fenced block is a sample and is skipped, and a paragraph is
 * read whole, so a sentence wrapped over several lines still finds its parenthesis.
 */
export function readMarks(text: string, form: MarkForm): ReadMarks {
  const pattern = form === "book" ? BOOK_MARK : REF_MARK;
  const marks: RuleMark[] = [];
  const faults: MarkFault[] = [];
  let heading = "";
  let fenced = false;
  let block: string[] = [];
  let start = 0;
  const flush = () => {
    if (!block.length) return;
    const joined = block.join(" ");
    for (const found of joined.matchAll(pattern)) {
      const raw = found[0];
      const read = parseFields(found[2]);
      const line = start + lineOf(block, found.index!);
      if ("fault" in read) { faults.push({ line, raw, fault: read.fault }); continue; }
      const bold = BOLD_BEFORE.exec(joined.slice(0, found.index));
      marks.push({ id: found[1], level: read.level, params: read.params, form, raw, line, heading, sentence: bold ? bold[1] : null });
    }
    block = [];
  };
  text.split("\n").forEach((line, at) => {
    if (/^\s*(```|~~~)/.test(line)) { flush(); fenced = !fenced; return; }
    if (fenced) return;
    const head = HEADING.exec(line);
    if (head || !line.trim() || line.trimStart().startsWith("|")) {
      flush();
      if (head) heading = head[1].replace(/[*`]/g, "").trim();
      if (line.trimStart().startsWith("|")) { block = [line]; start = at + 1; flush(); }
      return;
    }
    if (!block.length) start = at + 1;
    block.push(line.trim());
  });
  flush();
  return { marks, faults };
}

/** The line, within a joined paragraph, that an offset falls on. */
function lineOf(block: string[], offset: number): number {
  let seen = 0;
  for (let at = 0; at < block.length; at += 1) {
    seen += block[at].length + 1;
    if (offset < seen) return at;
  }
  return block.length - 1;
}

/**
 * How a plugin file's parenthesis differs from the book's, one finding per field. Empty where the two
 * agree. The id is the join, so it is never a difference.
 */
export function compareMarks(book: Pick<RuleMark, "level" | "params">, ref: Pick<RuleMark, "level" | "params">): string[] {
  const out: string[] = [];
  if (book.level !== ref.level) out.push(`level: the book says ${book.level ?? "none"}, this says ${ref.level ?? "none"}`);
  for (const key of PARAM_KEYS) {
    const said = book.params[key], here = ref.params[key];
    if (said === here) continue;
    const show = (value: string | true | undefined) => value === undefined ? "nothing" : value === true ? key : `${key}:${value}`;
    out.push(`${key}: the book says ${show(said)}, this says ${show(here)}`);
  }
  return out;
}

/** The chip a page shows for a book rule: MUST and its class, or Guidance, with the holder on hover. */
export function chipOf(id: string, level: RuleLevel, params: RuleParams): Chip {
  const kind = classOf(level, params);
  const label = kind === "guidance" || kind === null ? "Guidance" : `MUST · ${kind}`;
  const title = PARAM_KEYS.filter((key) => params[key] !== undefined)
    .map((key) => (params[key] === true ? key : `${key}:${params[key]}`)).join(SEP);
  return { label, anchor: id, title: title || id };
}
