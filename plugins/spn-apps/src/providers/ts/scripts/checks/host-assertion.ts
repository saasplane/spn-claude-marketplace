#!/usr/bin/env node
// Refuse an unanchored host pattern in a navigation assertion, at the moment it is written.
//
// **The defect this exists for, diagnosed 2026-09-06.** A journey asked *are we back on our own
// hosts* with a loose domain pattern and the answer was always yes. A provider's authorize URL
// carries our redirect_uri in its query string, so the loose pattern matched while the browser sat
// on the vendor's consent screen. The wait returned instantly, the URL assertion agreed, and the
// journey then hunted for our signup form on the vendor's page. **Every such check silently could
// not fail** — which is worse than no check, because a green run was reporting a page nobody had
// reached.
//
// **The rule.** A host assertion anchors. Compare `new URL(...).hostname` for equality, or use a
// pattern anchored at the front or the end. A pattern that can match inside a query string cannot
// answer a question about where the browser IS.
//
// **Two conditions, both required, so the check stays precise.** The literal must look like a host
// — a label, an escaped dot, a TLD — and be unanchored at both ends. And its statement must be
// about navigation: a url, a hostname, a waitForURL, a toHaveURL, a redirect.
//
// Source is tokenized rather than pattern-matched, because a regex literal, a string and a comment
// all carry slashes and dots. The file that documents this defect quotes the bad pattern in a
// comment, and a scanner that flagged it would refuse the very page explaining the rule.
//
//   hook :  host-assertion.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)
//   scan :  host-assertion.ts <path> …       (any file or tree; prints every finding it can see)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../scripts/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../scripts/lib/payload.ts";
import { filesUnder, lineOf, read, resultingText } from "../../../../scripts/lib/source.ts";

const CODE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

// The statement is about where the browser is. Kept short and specific: each member is a word a
// navigation assertion actually uses, and none of them is ordinary prose.
// The boundary is letters rather than a word boundary: the constant a journey assigns the pattern
// to is usually the context — OUR_HOSTS is the real 2026-09-06 name — and underscore is a word
// character, so a word boundary never fires inside it.
const CONTEXT = new RegExp(
  "(?<![A-Za-z])(url|urls|href|hostname|host|hosts|origin|origins|location|baseURL|waitForURL|" +
  "toHaveURL|navigat\\w*|redirect\\w*|page\\.url)(?![A-Za-z])", "i");

// A label, an escaped dot, a TLD — the shape of a domain written into a regex.
const HOSTISH = new RegExp("[A-Za-z0-9][A-Za-z0-9-]*\\\\\\.[A-Za-z]{2,24}");

const REF = "Anchor it: use a pattern starting with ^https:\\/\\/ and ending at a boundary, or " +
  "assert on `new URL(u).hostname` equality. An unanchored pattern also matches " +
  "`evil-yourdomain.app.attacker.com`, so anchoring is the fix in both directions.";

const ALPHANUMERIC = /[\p{L}\p{N}]/u;
const SPACE = /\s/;

export type Finding = { line: number; literal: string; text: string };

/**
 * Every regex literal in a JS or TS source, with the offset it starts at.
 *
 * A hand-rolled scan, because a slash means four things. It opens a comment, divides, opens a
 * regex, or sits inside a string — and the only way to tell is to walk the text carrying state. A
 * regex may open where a value may not follow: after an operator, a comma, a bracket or the start
 * of a statement, never after an identifier, a number or a closing paren.
 */
export function literals(source: string): Array<[number, string]> {
  const out: Array<[number, string]> = [];
  let index = 0;
  let previous = "";
  const size = source.length;
  while (index < size) {
    const char = source[index];
    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      index += 1;
      while (index < size) {
        if (source[index] === "\\") { index += 2; continue; }
        if (source[index] === quote) break;
        index += 1;
      }
      index += 1;
      previous = "value";
      continue;
    }
    if (char === "/" && index + 1 < size && source[index + 1] === "/") {
      index = source.indexOf("\n", index);
      if (index === -1) break;
      continue;
    }
    if (char === "/" && index + 1 < size && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? size : end + 2;
      continue;
    }
    if (char === "/" && previous !== "value") {
      const start = index;
      index += 1;
      let klass = false;
      while (index < size) {
        const here = source[index];
        if (here === "\\") { index += 2; continue; }
        if (here === "[") klass = true;
        else if (here === "]") klass = false;
        else if (here === "/" && !klass) break;
        else if (here === "\n") break;
        index += 1;
      }
      if (index < size && source[index] === "/") {
        out.push([start, source.slice(start + 1, index)]);
        index += 1;
        while (index < size && /[A-Za-z]/.test(source[index])) index += 1;
        previous = "value";
        continue;
      }
      index = start + 1;
      continue;
    }
    if (ALPHANUMERIC.test(char) || "_$)]".includes(char)) previous = "value";
    else if (!SPACE.test(char)) previous = "op";
    index += 1;
  }
  return out;
}

/**
 * Anchored at the front or the back. A group closing on an alternation that ends the match at a
 * boundary gives the same guarantee as a bare end-anchor.
 */
export function anchored(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.startsWith("^") || trimmed.endsWith("$") || trimmed.endsWith("$)");
}

/**
 * The text a reader would call this literal's statement — back to the previous line break that ends
 * a statement, forward to the end of its own line.
 */
export function statement(source: string, offset: number): string {
  const start = Math.max(0, offset - 240);
  let head = source.slice(start, offset);
  for (const mark of [";", "{", "}"]) {
    const cut = head.lastIndexOf(mark);
    if (cut !== -1) head = head.slice(cut + 1);
  }
  const lineEnd = source.indexOf("\n", offset);
  const tail = source.slice(offset, lineEnd === -1 ? source.length : lineEnd);
  return head + tail;
}

export function check(source: string): Finding[] {
  const found: Finding[] = [];
  for (const [offset, body] of literals(source)) {
    if (anchored(body) || !HOSTISH.test(body)) continue;
    const context = statement(source, offset);
    if (!CONTEXT.test(context)) continue;
    found.push({
      line: lineOf(source, offset),
      literal: "/" + body + "/",
      text: context.split(/\s+/).filter(Boolean).join(" ").slice(0, 120),
    });
  }
  return found;
}

/** The verdict for one write, or null. Called alone and by the dispatcher. */
/**
 * Whether this file could carry a navigation assertion at all.
 *
 * **A HOOK'S OWN SOURCE QUOTES THE PATTERN IT BANS**, so a plugin's own hooks are exempt whatever
 * folder they sit in. Naming the folders one by one is how F14 happened: `checks/` was added,
 * `scripts/` was not removed, and the incumbent refused the very port that replaced it. The rule
 * is about `hooks/`.
 */
export function watched(path: string): boolean {
  if (!CODE.some((extension) => path.endsWith(extension))) return false;
  return !resolve(path).split("\\").join("/").includes("/hooks/");
}

/** The verdict for one write, given text that has ALREADY been parsed by the subject's validator. */
export function verdict(path: string, source: string | null, added: string | null): Verdict {
  if (source === null) return null;
  let found: Finding[];
  try {
    found = check(source).filter((item) => added === null || added.includes(item.literal));
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [
    "Denied — an unanchored host pattern in a navigation assertion, in " + basename(path) + ":",
  ];
  for (const item of found) lines.push("  line " + item.line + ": " + item.literal + " — " + item.text);
  lines.push("  A pattern with no anchor matches inside a query string, so a provider page " +
    "carrying your redirect_uri passes the check. " + REF);
  return { deny: lines.join("\n"), headline: lines[0] };
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
    if (!CODE.some((extension) => target.endsWith(extension))) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of check(source)) {
      total += 1;
      console.log(target + ":" + item.line + ": " + item.literal + " — " + item.text);
    }
  }
  console.log("\n" + total + " unanchored host assertion(s)");
  return total ? 1 : 0;
}

export const CHECK = { name: "host-assertion", run };

if (runAlone("host-assertion.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  const paths = argv.filter((a) => !a.startsWith("-"));
  process.exit(scan(paths.length ? paths : ["."]));
}
