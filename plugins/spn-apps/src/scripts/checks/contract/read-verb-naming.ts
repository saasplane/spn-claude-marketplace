#!/usr/bin/env node
// Refuse a read verb that returns an XList under a plural name, at the moment it is written.
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
import type { Payload, ToolInput, Verdict } from "../../lib/payload.ts";
import { emit, payload, runAlone } from "../../lib/payload.ts";
import { filesUnder, introduced, lineOf, mask, read, resultingText } from "../../lib/source.ts";

const WATCHED = "/src/contract/services/";

// A declaration: a read verb, its parameter list, and a return type promising an XList. The
// parameter list may span lines and may not hold a semicolon or a brace, so the match never runs on
// into the next method.
const READ_LIST_DECLARATION =
  /\b(get[A-Z][A-Za-z0-9_]*)\s*(?:<[^()>]*>)?\s*\(([^;{}]*?)\)\s*:\s*Promise\s*<\s*([A-Z][A-Za-z0-9_]*List)\s*>/gs;

// The shapes the rule allows.
const NAMED_FOR_ITS_LIST = /^get[A-Za-z0-9_]*List(?:By[A-Z][A-Za-z0-9_]*)?$/;

const REMEDY = "A method whose name starts with get and returns an XList is named for that list. It " +
  "takes one of these shapes: getAll<X>List, get<X>List, or get<X>ListBy<Scope>. Rename the method " +
  "in this interface; the typecheck carries the rename to the service and the controller. A read " +
  "that returns a keyed map, such as Promise<OrgMetas>, keeps its plural name. Write verbs and " +
  "search… are not judged.";

export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  return normalized.endsWith(".ts") && normalized.includes(WATCHED);
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
export function findings(source: string, added: string | null): string[] {
  const masked = mask(source);
  const found: string[] = [];
  // A FRESH REGEX PER CALL. `READ_LIST_DECLARATION` carries the `g` flag, and a global regex keeps a
  // `lastIndex` between calls — the fault that made `doc-check`'s reach share wrong across a whole
  // corpus. `matchAll` resets it, which is why it is used here rather than a `while (exec)` loop.
  for (const match of masked.matchAll(READ_LIST_DECLARATION)) {
    const [whole, name, , listType] = match;
    if (NAMED_FOR_ITS_LIST.test(name)) continue;
    if (added !== null && !new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[<(]`).test(added))
      continue;
    void whole;
    const line = lineOf(source, match.index);
    found.push(`line ${line}: ${name} returns Promise<${listType}> — name it ${suggestedName(name, listType)}`);
  }
  return found;
}

/** The verdict for one write, or null. Called alone and by the dispatcher. */
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
  if (source === null) return null;
  let found: string[];
  try {
    found = findings(source, added);
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`Denied — a read verb is named for the list it returns. In ${basename(path)}:`];
  for (const item of found) lines.push(`  - ${item}`);
  lines.push(`  ${REMEDY}`);
  return { deny: lines.join("\n") };
}

export function scan(paths: string[]): number {
  let total = 0;
  for (const target of filesUnder(paths)) {
    if (!watched(target)) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of findings(source, null)) {
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
