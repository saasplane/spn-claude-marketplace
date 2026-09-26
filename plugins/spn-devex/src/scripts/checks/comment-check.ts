#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/07-comments/README.md § The check, and what each finding costs
//           docs/04-capabilities/02-support/01-apps/07-comments/02-rationale.md § Forms that are always wrong
//           docs/04-capabilities/02-support/01-apps/10-providers/ts/05-code.md § Comments
// The chapters are the source of truth. A rule change is edited there first, then here, in the same change.
//
// What the code says about itself, read at the moment it is written.
//
// The comments group states the standard and names this check by name: *every rule on this page is
// read at write time by `comment-check`, which fires on a source write and reports before the file
// lands*. It did not exist. Three arc files recorded it as landed and no file under either plugin
// carried it under any name, which is why the header below says what it covers rather than leaving a
// reader to assume it covers the page.
//
// WHAT IT READS. The fragment being written — `content` for a `Write`, `new_string` for an `Edit` —
// and nothing else. It never opens the file on disk. That is the honest bound of a write-time check:
// it judges what you are about to add, so a comment already in the tree is refused only when you
// edit it. A sweep over what is already there is a different instrument and is named below.
//
// THE EIGHT FINDINGS, AND WHICH FIVE ARE HERE. Three are not, and each says why rather than being
// left out quietly — a check whose coverage a reader has to infer is one they will over-trust.
//
//   1  a history word                      RULE   here
//   2  a published declaration with no     RULE   NOT here — `gen-symbols` already collects it per
//      intent comment                             declaration and `apps validate` carries it. A
//                                                 fragment does not know what its package publishes
//   3  an intent comment naming something  RULE   NOT here — a snake_case proxy was built and
//      its package does not declare               withdrawn; it refused `redirect_uri` and
//                                                 `client_id`, which are protocol fields a consumer
//                                                 knows. It needs the package's declaration set
//   4  a line comment where a doc comment  RULE   here
//      is required
//   5  a comment that repeats its own line RULE   here
//   6  a guess                             RULE   here
//   7  a rationale past three sentences    SOFT   here, as a note
//   8  a rationale a consumer would need   SOFT   NOT here — whether a caller needs it is judgement,
//                                                 and the chapter grades it SOFT for that reason. A
//                                                 check that guessed would teach people to delete
//                                                 the rationale rather than promote it
//
// WHERE IT FIRES. A `.ts` or `.tsx` file under a node's `src/`. Not tests, not `.d.ts`, not
// generated output, and not a plugin's own `hooks/` tree — those are not the published surface the
// standard is written about, and a check that refused a hook's own header would be enforcing a rule
// on the one tree the rule does not name.
//
// MEASURED BEFORE IT SHIPPED, against 1,707 files under `src/` in `spn-support-ts` and
// `spn-platform-ts`. Every pattern below was narrowed by reading what it caught there, and the
// narrowings are written beside the patterns with the sentence each one protects. What is left is
// the standing debt the sweep pays: 114 published declarations described with `//`, and 54 history
// words. Those are refused as they are edited, which is the rule *bringing a file up to standard is
// part of editing it*.
//
// EVERY PATTERN IS THE NARROW READING OF ITS RULE. A check that is wrong occasionally is one people
// learn to work around, and worse, one an agent OBEYS — it will rewrite correct prose to satisfy a
// bad match. So `used to` is read only as `used to be`, because *a flag used to decide the branch*
// is present truth; `previously` only where it names a former state. Each narrowing is marked below
// with the sentence that would otherwise be refused.

import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

/** The `src/` of a node, in the language this standard is rendered for. */
export function applies(path: string): boolean {
  if (!path) return false;
  if (!/\.tsx?$/.test(path) || path.endsWith(".d.ts")) return false;
  if (!path.includes("/src/")) return false;
  for (const outside of ["/node_modules/", "/dist/", "/out-tsc/", "/contract/validators/", "/generated/", "/hooks/"])
    if (path.includes(outside)) return false;
  return true;
}

// ---------------------------------------------------------------------------- reading a fragment

/** One comment as a reader meets it: its text, whether it is JSDoc, and the code it sits above. */
export type Block = {
  /** The comment's own words, markers stripped. */
  text: string;
  /** A `/** … *\/` block is intent; everything else is rationale. */
  jsdoc: boolean;
  /** The first code line under it, or the empty string where the fragment ends first. */
  subject: string;
  /** 1-based, within the fragment, so a message can name where. */
  line: number;
  /** Whether a JSDoc block sits between this comment and the code — which makes it a section label. */
  labels: boolean;
};

const STRIP_DOC = /^\s*\*+\/?|^\s*\/\*\*+/;

/**
 * Every comment in a fragment, with the line it describes.
 *
 * A COMMENT INSIDE A STRING IS NOT A COMMENT, and this is the fault that made the `RESTATES` reader
 * report a test's own fixture as a header. A line whose `//` sits inside quotes — a fixture, a
 * template, a regular expression — is skipped, because a check that reads a test's sample data as
 * source refuses the test that proves it.
 */
export function blocks(fragment: string): Block[] {
  const lines = fragment.split("\n");
  const found: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("/**")) {
      const text: string[] = [];
      const start = index;
      while (index < lines.length) {
        text.push(lines[index].replace(STRIP_DOC, "").replace(/\*\/\s*$/, "").trim());
        if (lines[index].includes("*/")) break;
        index += 1;
      }
      index += 1;
      found.push({ text: text.join(" ").trim(), jsdoc: true, subject: nextCode(lines, index), line: start + 1, labels: false });
      continue;
    }

    if (trimmed.startsWith("//") && !quoted(line)) {
      const text: string[] = [];
      const start = index;
      while (index < lines.length && lines[index].trim().startsWith("//") && !quoted(lines[index])) {
        text.push(lines[index].trim().replace(/^\/\/+/, "").trim());
        index += 1;
      }
      found.push({
        text: text.join(" ").trim(), jsdoc: false, subject: nextCode(lines, index), line: start + 1,
        // A `//` GROUP WITH A JSDoc BLOCK UNDER IT DESCRIBES NOTHING — the JSDoc does. It is the
        // divider over a run of declarations, and `// Email provider configs` above seven of them
        // is the shape. Reading it as the next declaration's description refuses a file's only
        // structure, seven times in one file.
        labels: nextThing(lines, index) === "jsdoc",
      });
      continue;
    }

    index += 1;
  }
  return found;
}

/** Whether this line's `//` sits inside a string or a template, which makes it data rather than a comment. */
function quoted(line: string): boolean {
  const at = line.indexOf("//");
  if (at < 0) return false;
  const before = line.slice(0, at);
  for (const quote of ['"', "'", "`"])
    if ((before.split(quote).length - 1) % 2 === 1) return true;
  return false;
}

/** What comes after a comment group: another comment, a JSDoc block, or code. */
function nextThing(lines: string[], from: number): "jsdoc" | "code" | "end" {
  for (let index = from; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("/**")) return "jsdoc";
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
    return "code";
  }
  return "end";
}

/** The first line under a comment that is code rather than blank or another comment. */
function nextCode(lines: string[], from: number): string {
  for (let index = from; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
    return trimmed;
  }
  return "";
}

// ---------------------------------------------------------------------------- the findings

// FINDING 1 — a history word. `02-rationale.md` § Forms that are always wrong: *changelog prose —
// "previously this used…", "changed to fix…"*. History is in the history, and a comment states
// present truth.
//
// NARROWED, TWICE, and each narrowing names the sentence it protects:
//   `used to` → `used to be`        *a flag used to decide which branch runs* is present truth
//   `previously` → a former state   *the previously computed value* names a line above, not a past
const HISTORY: Array<[RegExp, string]> = [
  [/\bmoved (?:from|out of|here from)\b/i, "moved from"],
  // `renamed` ALONE IS NOT A HISTORY WORD. *a renamed test changes the answer* is present truth
  // about how the reader behaves, and refusing it would have an agent rewrite a correct sentence.
  // Only the constructions that name a former state are read.
  [/\b(?:was|were|been|got)\s+renamed\b|\brenamed\s+(?:from|to|in)\b/i, "renamed from"],
  [/\bformerly\b/i, "formerly"],
  [/\bused to (?:be|live|sit|return|do|call|hold)\b/i, "used to be"],
  [/\b(?:it|this|these|that|they) (?:was|were) (?:previously|originally|called|named|a |an |the )/i, "it was"],
  [/\b(?:was|were) (?:previously|originally|formerly)\b/i, "was previously"],
  [/\bpreviously (?:called|named|lived|sat|returned|did|held|this)\b/i, "previously called"],
  [/\bchanged to fix\b/i, "changed to fix"],
  [/\bno longer (?:called|named)\b/i, "no longer called"],
];

// FINDING 6 — a guess. Rule 4: *a guess is never published; where purpose is genuinely unclear the
// comment is left blank and flagged*. A published guess is worse than a published gap, because a
// reader cannot tell it from a fact.
//
// `seems to` AND `appears to` ARE NOT IN THIS SET, and the chapter's own list names them. Measured
// against `spn-support-ts/src`: both live uses are correct prose about how a thing LOOKS to a
// person — *a short-lived CLI that appears to hang after its work is done*, *a switch that appears
// to do nothing*. Neither is the writer hedging about what the code does. Telling those apart is
// judgement, and a check that refused them would have an agent rewrite the two clearest sentences
// in the file. What is left is the writer admitting uncertainty in their own voice, which is never
// right on a published declaration.
// `no idea` GOES FOR THE SAME REASON, measured the same way: every live use is ordinary English
// about a PERSON — *a person retyping a code with no idea how many tries are left*. The set that is
// left is the writer's own uncertainty, in the writer's own voice.
const HEDGES = [
  /\bprobably\b/i, /\bpresumably\b/i, /\bnot sure\b/i,
  /\bi think\b/i, /\bi believe\b/i, /\bi assume\b/i,
];

// FINDING 3 IS NOT HERE, AND THE FIRST VERSION OF THIS FILE HAD IT. It read a snake_case
// identifier in a JSDoc block as a table name, which is the chapter's own example (`iam_session`).
// Measured across both stacks it found 54 — and among them `redirect_uri`, `client_id`,
// `input_schema` and `provider_type`, which are PROTOCOL fields a consumer knows by those names and
// resolves without the source. The rule the chapter states is *resolves using only what its own
// package declares*, and only the package's declaration set answers that. A proxy that is wrong
// about OAuth is a check an agent obeys by deleting the correct word. So it waits for the symbol
// index, beside finding 2.

// FINDING 4 — a line comment where a doc comment is required. `03-code-patterns.md` § Comments:
// *the harvester reads `/** … *\/` and nothing else, so a published declaration described with `//`
// has a description that never leaves the file*.
const EXPORTED = /^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum|abstract)\b/;

// A DIRECTIVE IS NOT A DESCRIPTION. These say something to a tool or to the next maintainer about
// the code's surroundings rather than describing the declaration, so promoting them to JSDoc would
// publish them to a consumer who cannot act on them.
const DIRECTIVE = /^(?:eslint|@ts-|ts-|prettier|istanbul|c8 |v8 |biome-|TODO\b|FIXME\b|NOSONAR)/i;

// A BANNER IS NOT A DESCRIPTION EITHER. A rule of box-drawing characters divides a file into
// sections; it describes the section under it, not the declaration, and turning it into JSDoc would
// publish a divider as a consumer's documentation.
const BANNER = /^[\s\-=~_*#\u2500-\u257F]{2,}/;

// NOR IS A RE-EXPORT A DECLARATION. `export type { X } from './base'` owns no meaning — the
// description belongs on `X` where it is declared, and finding 2 is what asks for it there.
const REEXPORT = /^export\s+(?:type\s+)?\{|\}\s*from\s*['"]/;

// AND A ONE-WORD LABEL IS NOT A DESCRIPTION. `// Enum` over `TSNodeEnumMember` names the section a
// reader has arrived at; turning it into JSDoc would publish the word *Enum* as the type's
// documentation, which is worse than the gap. A description is a sentence — four words a reader
// carries, or a full stop somebody wrote on purpose.
const DESCRIPTION_WORDS = 4;
const describes = (text: string): boolean =>
  commentWords(text).length >= DESCRIPTION_WORDS || /[.!?]$/.test(text.trim());

// FINDING 5 — a comment that repeats its own line. Only a SHORT comment is judged: a sentence that
// adds a constraint happens to contain the identifier's words too, and refusing that would delete
// the comments worth keeping.
const NOISE = new Set(["the", "a", "an", "this", "to", "of", "for", "and", "its", "it", "in", "on", "at", "by", "with", "from", "all", "every", "we", "then", "now", "one", "single"]);
const SHORT_ENOUGH = 6;
// AND ONE WORD IS A SECTION LABEL, NOT A RESTATEMENT. `// Enum` above `TSNodeEnumMember` divides a
// file; deleting it as a repeat would take the file's only structure with it.
const ENOUGH_WORDS = 2;
// THE LINE IT REPEATS HAS TO BE A DECLARATION. `// named imports` above `if (bindings.kind ===
// SyntaxKind.NamedImports)` names the branch a reader is entering, which the condition does not say
// in words — and reading it as a repeat is how a check deletes the comments worth keeping.
const DECLARATION = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:private|public|protected|static|readonly|abstract|const|let|var|function|class|interface|type|enum)\b/;

/** The words an identifier is made of — `revokeSessions` and `revoke_sessions` both give two. */
function identifierWords(code: string): Set<string> {
  const words = new Set<string>();
  for (const token of code.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [])
    for (const part of token.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[_$\s]+/))
      if (part) words.add(part.toLowerCase().replace(/s$/, ""));
  return words;
}

/** A comment's own words, with the ones that carry no meaning dropped. */
function commentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9]*/g) ?? [])
    .filter((word) => !NOISE.has(word))
    .map((word) => word.replace(/s$/, ""));
}

// FINDING 7 — a rationale past three sentences, SOFT. *Three sentences is where a rationale stops
// being why this line is odd and starts being a design nobody reviewed.* It prints a line, because
// a fourth sentence is sometimes exactly right and a check cannot tell.
const SENTENCE = /[.!?](?:\s|$)/g;
const MOST_SENTENCES = 3;

/** How many sentences a comment runs to, with an abbreviation's full stop not counted as one. */
export function sentences(text: string): number {
  const cleaned = text
    .replace(/\b(?:e\.g|i\.e|etc|vs|cf|no|fig|ref)\./gi, "$&#")
    .replace(/\b[A-Za-z]\.(?=[A-Za-z]\.)/g, "")
    .replace(/\d+\.\d+/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\.#/g, "");
  return (cleaned.match(SENTENCE) ?? []).length;
}

// ---------------------------------------------------------------------------- the check

const WHERE = "07-comments/README.md, The check, and what each finding costs";

export function findings(fragment: string): Array<{ deny: boolean; message: string }> {
  const out: Array<{ deny: boolean; message: string }> = [];
  for (const block of blocks(fragment)) {
    if (!block.text) continue;

    for (const [pattern, name] of HISTORY)
      if (pattern.test(block.text)) {
        out.push({ deny: true, message:
          `Line ${block.line} — a history word (\`${name}\`). A comment states current truth; what ` +
          `the code was is in the history, and a reader who needs it runs \`git log\`. Say what is ` +
          `true now, or delete the line (${WHERE}, finding 1).` });
        break;
      }

    for (const hedge of HEDGES)
      if (hedge.test(block.text)) {
        out.push({ deny: true, message:
          `Line ${block.line} — a guess. A published hedge reads as a fact to everybody who did not ` +
          `write it. Rule 4 says leave it blank and flag it rather than publish a guess: find out, ` +
          `or say plainly that it is unverified and who would know (${WHERE}, finding 6).` });
        break;
      }

    if (!block.jsdoc) {
      if (EXPORTED.test(block.subject) && !REEXPORT.test(block.subject) && !block.labels
          && !DIRECTIVE.test(block.text) && !BANNER.test(block.text) && describes(block.text))
        out.push({ deny: true, message:
          `Line ${block.line} — a line comment where a doc comment is required. \`${block.subject.slice(0, 60)}\` ` +
          `is published, and the harvester reads \`/** … */\` and nothing else — so this description ` +
          `never reaches the symbol index, the generated client or an agent's tool definition. Make ` +
          `it a JSDoc block (${WHERE}, finding 4).` });

      const words = commentWords(block.text);
      if (DECLARATION.test(block.subject) && !BANNER.test(block.text) && !block.labels
          && words.length >= ENOUGH_WORDS && words.length <= SHORT_ENOUGH) {
        const declared = identifierWords(block.subject);
        if (words.every((word) => declared.has(word)))
          out.push({ deny: true, message:
            `Line ${block.line} — the comment repeats its own line. \`${block.subject.slice(0, 60)}\` ` +
            `already says this, so the comment costs a reader a line and teaches them to skim the ` +
            `next one. Delete it, or say the thing the code cannot — an ordering, an invariant, a ` +
            `trade somebody made (${WHERE}, finding 5).` });
      }

      const count = sentences(block.text);
      if (count > MOST_SENTENCES)
        out.push({ deny: false, message:
          `Line ${block.line} — a rationale of ${count} sentences. Past three it has become a design ` +
          `note, and its reader is somebody looking for the design rather than somebody who happened ` +
          `to open this file. It belongs in the capability mirror that governs this folder, or as a ` +
          `decision row, cited from a shorter comment here (${WHERE}, finding 7 — SOFT).` });
    }
  }
  return out;
}

export function checkComments(payload: Payload): Verdict {
  const supplied = payload.tool_input ?? {};
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  if (!applies(supplied.file_path ?? "")) return null;

  const fragment = supplied.content ?? supplied.new_string ?? "";
  if (!fragment) return null;

  const found = findings(fragment);
  if (!found.length) return null;

  const refusals = found.filter((one) => one.deny);
  const notes = found.filter((one) => !one.deny);
  if (refusals.length)
    return { deny:
      `Denied: the comments in this write break the standard the code is held to.\n\n` +
      `${refusals.map((one) => `  • ${one.message}`).join("\n")}` +
      (notes.length ? `\n\nAlso, and not a refusal:\n${notes.map((one) => `  • ${one.message}`).join("\n")}` : "") };
  return { note: notes.map((one) => one.message).join("\n") };
}

if (runAlone("comment-check.ts")) {
  try { emit(checkComments(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
