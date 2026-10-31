#!/usr/bin/env node
// Refuse a name the naming chapter does not allow, at the moment it is written.
//
// Four rules from the chapter are read in every `.ts` file under `src/`: a method opens with an action
// verb, a boolean reads yes or no (`isActive`, `hasRole`), a discriminator is `<noun>Type` and its SQL
// enum ends in `_type`, and a reference column is `<table>_id`. They are judged by name only, and only
// for a name the write itself introduces.
//
// The rest of this header is the read-verb rule, which keeps its narrower seat.
//
// A method returning an `XList` is named for that type. The rule governs read verbs, which is every
// method whose name starts with `get`. These are the shapes it allows:
//
//   getAll<Plural>         returning <X>List   is named   getAll<X>List
//   get<Plural>            returning <X>List   is named   get<X>List
//   get<Plural>By<Scope>   returning <X>List   is named   get<X>ListBy<Scope>
//
// So a `get…` method returning `Promise<…List>` matches `get…List` or `get…ListBy…`, and nothing
// else. The book taught the plural form and the code copied it, until the stack repos renamed every
// read on 2026-09-16. This keeps the plural from coming back: a chapter is where the next method
// gets copied from, and a chapter cannot fire when you write the file.
//
// What it leaves alone matters as much. A read returning a keyed map (`Promise<OrgMetas>`,
// `Promise<GroupInfos>`) keeps its plural name, because a plural promising a map is the rule
// working. A write verb is not judged, whatever it returns. `search…` returns a `SearchResult` and
// is not judged either.
//
// Where it reads. The name is declared once, in a contract interface under `src/contract/services/`
// in a stack repo. The service and the controller repeat it, and the typecheck makes them follow
// the interface, so judging the interface is enough. A signature may span lines, so the parameter
// list is matched across them.
//
// It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
// replacement, and a half-signature scored on its own is how a hook reports green having checked
// nothing. It then denies only for a method the write itself names, so a finding elsewhere in the
// file does not block an unrelated edit. Comment and string bodies are masked first, so a signature
// quoted in a doc comment is never judged.
//
// It denies rather than warns. The rule is settled, ruled by the developer on 2026-09-16, and both
// stack trees are clean, so a refusal never blocks a legitimate write.
//
//   hook :  read-verb-naming.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)
//   scan :  read-verb-naming.ts <path> …       (any file or tree; prints every finding it can see)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { mask, read, resultingText } from "../../../../../../../plugin-support-lib/src/lib/source.ts";
import { filesUnder, introduced, lineOf } from "../../../../../scripts/lib/source.ts";

const WATCHED = "/src/";
const CONTRACT_SEAT = "/src/contract/services/";

// A declaration: a read verb, its parameter list, and a return type promising an XList. The
// parameter list may span lines and may not hold a semicolon or a brace, so the match never runs on
// into the next method.
const READ_LIST_DECLARATION =
  /\b(get[A-Z][A-Za-z0-9_]*)\s*(?:<[^()>]*>)?\s*\(([^;{}]*?)\)\s*:\s*Promise\s*<\s*([A-Z][A-Za-z0-9_]*List)\s*>/gs;

// The shapes the rule allows.
const NAMED_FOR_ITS_LIST = /^get[A-Za-z0-9_]*List(?:By[A-Z][A-Za-z0-9_]*)?$/;

// The first word of a method name. A name that opens with none of these has no verb.
const VERBS = new Set(("get set create update delete remove add read write find list search fetch load save send build make " +
  "parse render handle run start stop open close check validate verify resolve compute calculate convert format map filter " +
  "sort merge apply emit publish subscribe unsubscribe register unregister init initialize reset clear toggle select copy " +
  "move login logout sign consume revoke issue grant deny assign attach detach bind unbind enable disable activate " +
  "deactivate cancel retry process execute dispatch invoke call notify log track record collect count sum group split " +
  "join push pop shift insert upsert patch post put purge flush sync refresh reload import export serialize deserialize " +
  "encode decode encrypt decrypt hash verify sanitize normalize escape prepare ensure assert throw wrap unwrap use to " +
  "on handle submit confirm accept reject approve decline invite join leave lock unlock suspend resume restore archive " +
  "mount unmount focus blur scroll navigate redirect show hide expand collapse wait sleep delay schedule trigger fire " +
  "release acquire reserve allocate extract transform generate derive define declare require match test compare diff " +
  "reconcile rebuild rename replace swap reorder commit rollback begin end finish complete abort stub spy").split(" "));

// A boolean reads yes or no.
const BOOLEAN_PREFIX = /^(?:is|has|can|should|does|did|will|are|was|were|must|needs|allows|supports|includes|contains)[A-Z]/;

// A method: a name, a parameter list with no nested parentheses, and a return type or a body.
const METHOD =
  /^[ \t]+(?:(?:public|private|protected|static|async|abstract|override|readonly)\s+)*([a-z][A-Za-z0-9]*)\s*(?:<[^()>]*>)?\s*\(([^;{}()]*)\)\s*(?::\s*([^;{}=]+?))?\s*([;{])/gm;
const NOT_A_METHOD = new Set(["if", "for", "while", "switch", "catch", "constructor", "return", "function", "with", "else"]);

// A property, a field or a parameter typed boolean.
const BOOLEAN_PROPERTY =
  /^[ \t]+(?:(?:public|private|protected|static|readonly|declare)\s+)*([a-z][A-Za-z0-9]*)\??\s*:\s*boolean\s*[;,=]?\s*$/gm;

const SQL_ENUM = /\bCREATE\s+TYPE\s+([a-z][a-z0-9_]*)\s+AS\s+ENUM\b/gi;
const BARE_TYPE_COLUMN = /^[ \t]+(?:(?:public|private|protected|readonly)\s+)?type\??\s*[:!]/gm;
const REFERENCE_NAME = /^[ \t]+(?:(?:public|private|protected|readonly)\s+)?([a-z][A-Za-z0-9_]*(?:Ref|_ref|Fk|_fk))\??\s*[:!]/gm;

const REMEDY = "A method whose name starts with get and returns an XList is named for that list. It " +
  "takes one of these shapes: getAll<X>List, get<X>List, or get<X>ListBy<Scope>. Rename the method " +
  "in this interface; the typecheck carries the rename to the service and the controller. A read " +
  "that returns a keyed map, such as Promise<OrgMetas>, keeps its plural name. Write verbs and " +
  "search… are not judged. Elsewhere a method opens with an action verb, a boolean reads yes or no " +
  "(isActive), a discriminator is <noun>Type with an _type SQL enum, and a reference column is <table>_id.";

export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  return normalized.endsWith(".ts") && !/\.(?:d|test|spec)\.ts$/.test(normalized) && normalized.includes(WATCHED);
}

/** The name the rule asks for, built from the type the method already promises. */
export function suggestedName(name: string, listType: string): string {
  const prefix = /^getAll[A-Z]/.test(name) ? "getAll" : "get";
  const scope = /By[A-Z][A-Za-z0-9_]*$/.exec(name.slice(prefix.length));
  return `${prefix}${listType.slice(0, -"List".length)}List${scope ? scope[0] : ""}`;
}

/**
 * Every read verb in this text that promises an XList under a name the rule does not allow.
 *
 * `added` is the text the write introduces, or null for a scan. A method is judged only when the
 * write names it, so a finding elsewhere in the file does not block an unrelated edit.
 */
export function findings(source: string, added: string | null, path = CONTRACT_SEAT): string[] {
  const masked = mask(source);
  const found: string[] = [];
  const names = (name: string): boolean =>
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
    added === null || new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(added);
  found.push(...namingFindings(masked, source, path, names));
  if (!path.split("\\").join("/").includes(CONTRACT_SEAT)) return found;
  // A FRESH REGEX PER CALL. `READ_LIST_DECLARATION` carries the `g` flag, and a global regex keeps a
  // `lastIndex` between calls — the fault that made `doc-check`'s reach share wrong across a whole
  // corpus. `matchAll` resets it, which is why it is used here rather than a `while (exec)` loop.
  for (const match of masked.matchAll(READ_LIST_DECLARATION)) {
    const [whole, name, , listType] = match;
    if (NAMED_FOR_ITS_LIST.test(name)) continue;
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
    if (added !== null && !new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[<(]`).test(added))
      continue;
    void whole;
    const line = lineOf(source, match.index);
    found.push(`line ${line}: ${name} returns Promise<${listType}> — name it ${suggestedName(name, listType)}`);
  }
  return found;
}

/** The name a verb-less method asks for: its own words, opened by `read`. */
function withVerb(name: string): string {
  return `read${name[0].toUpperCase()}${name.slice(1)}`;
}

/** The naming chapter's verb, boolean, `_type` and `_id` rules, for the names this write introduces. */
function namingFindings(masked: string, source: string, path: string, names: (name: string) => boolean): string[] {
  const found: string[] = [];
  for (const match of masked.matchAll(METHOD)) {
    const [, name, , returns = "", end] = match;
    if (NOT_A_METHOD.has(name) || (end === ";" && !returns) || !names(name)) continue;
    const line = lineOf(source, match.index);
    if (/^(?:Promise\s*<\s*)?boolean\s*>?$/.test(returns.trim())) {
      if (!BOOLEAN_PREFIX.test(name))
        found.push(`line ${line}: ${name}() returns a boolean and does not read yes or no — name it is${name[0].toUpperCase()}${name.slice(1)}`);
    } else if (!VERBS.has(/^[a-z]+/.exec(name)![0]) && !BOOLEAN_PREFIX.test(name)) {
      found.push(`line ${line}: ${name}() opens with no verb — name it ${withVerb(name)}`);
    }
  }
  for (const match of masked.matchAll(BOOLEAN_PROPERTY)) {
    const name = match[1];
    if (BOOLEAN_PREFIX.test(name) || !names(name)) continue;
    found.push(`line ${lineOf(source, match.index)}: ${name} is a boolean and does not read yes or no — name it is${name[0].toUpperCase()}${name.slice(1)}`);
  }
  // SQL lives in strings, so these two read the source and not the masked text.
  for (const match of source.matchAll(SQL_ENUM)) {
    if (/_type$/.test(match[1]) || !names(match[1])) continue;
    found.push(`line ${lineOf(source, match.index)}: the enum ${match[1]} does not end in _type — name it ${match[1]}_type`);
  }
  if (/Entity\.ts$/.test(path)) {
    for (const match of masked.matchAll(BARE_TYPE_COLUMN)) {
      if (!names("type")) continue;
      found.push(`line ${lineOf(source, match.index)}: a discriminator is named for its noun — <noun>Type, never a bare type`);
    }
    for (const match of masked.matchAll(REFERENCE_NAME)) {
      if (!names(match[1])) continue;
      found.push(`line ${lineOf(source, match.index)}: ${match[1]} is a reference column — name it <table>_id, such as org_id`);
    }
  }
  return found;
}

/**
 * The verdict for one write, given text that has ALREADY been parsed.
 *
 * **THE PARSE IS THE PROVIDER'S AND THE RULE IS THE DOMAIN'S.** A subject's validator reads the
 * resulting text once and hands it to every rule that applies. Six rules each calling
 * `resultingText` read and masked the same file six times at write time, which is where a person
 * is waiting.
 */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null) return null;
  let found: string[];
  try {
    found = findings(source, added, resolve(path).split("\\").join("/"));
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`Denied — a name breaks the naming chapter. In ${basename(path)}:`];
  for (const item of found) lines.push(`  - ${item}`);
  lines.push(`  ${REMEDY}`);
  return { deny: lines.join("\n") };
}

/** The verdict for one write, parsed here. Called alone; the dispatcher goes through a subject. */
export function run(input: ToolInput): Verdict {
  const path = input.file_path ?? "";
  if (!watched(path)) return null;
  let source: string | null;
  let added: string | null;
  try {
    [source, added] = resultingText(input, path);
  } catch {
    source = added = input.content ?? input.new_string ?? null;
  }
  return verdict(path, source, added);
}

export function scan(paths: string[]): number {
  let total = 0;
  for (const target of filesUnder(paths)) {
    if (!watched(target)) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of findings(source, null, resolve(target).split("\\").join("/"))) {
      total += 1;
      console.log(`${target}: ${item}`);
    }
  }
  console.log(`\n${total} finding(s) — a read verb returning an XList under a plural name`);
  return total ? 1 : 0;
}

export const CHECK = { name: "read-verb-naming", run, watched };

if (runAlone("read-verb-naming.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  process.exit(scan(argv.filter((a) => a !== "--stdin").length
    ? argv.filter((a) => a !== "--stdin") : ["."]));
}

// `introduced` is not used here: this check judges a method the write NAMES, which is a stricter
// test than a line of it having moved, and the name is what the remedy has to print anyway.
void introduced;
