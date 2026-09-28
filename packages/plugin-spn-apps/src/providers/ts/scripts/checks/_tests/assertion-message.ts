#!/usr/bin/env node
// Warn about a journey assertion that says nothing about why it might have failed.
//
// **The rule.** An assertion names what it expected and what would explain the absence (rule 27 of
// the tests chapter, RD.APPS.109). Writing that costs nothing at the time. Reading it later replaces
// the spec, the component and the permission model. A case reporting `expected > 0, received 0` buys
// the next reader an investigation. A case reporting that no channel editor rendered at all, and
// that the session may lack `NTF_CONFIG_MANAGE`, has diagnosed itself.
//
// **Which tier it judges: the journey tier, and only that.** A journey spec is a `.spec.ts` or
// `.spec.tsx` under a `tests/journeys/` folder. A journey drives a real browser against a running
// stack, so its failure arrives with none of the context that would explain it, and finding out why
// costs about three times what writing the case cost.
//
// **Which tiers it leaves alone, and why each is deliberate.**
//
//   contract     The rule names this tier and the check cannot reach it. The contract tier runs
//                under Jest, whose `expect` takes at most one argument and throws `Expect takes at
//                most one argument.` on a second. There is nowhere for the message to go. That tier
//                gets the rule from the step file instead.
//   component    A component case and the component it mounts are one file apart, and the failure
//                names the component. The diagnosis the journey tier pays for is not owed here.
//   unit         A bare assertion in a unit test is defensible. The subject is named in the title,
//                the file under test is short, and nobody reads a permission model to explain it.
//
// **What counts as a message: a second argument to `expect`.** Playwright takes it as
// `expect(value, 'message')`, on `expect.soft` and `expect.poll` alike, and prints it as the
// failure's headline. Anything counts — a literal, a template literal, a variable. The check judges
// that a message is there, never whether it is a good one. Whether the words name what would explain
// the absence is a reading somebody has to do, and this says so rather than pretending.
//
// **It warns, and it does not refuse.** Its two denying siblings each had a clean tree behind them.
// This one does not: both stack repos carry journey assertions written before the rule, and moving a
// block of them reads to any write-time check as introducing them. A refusal on a proxy — the
// presence of an argument, standing in for a judgement about prose — also teaches people to satisfy
// it with filler, and filler reads as information while carrying none.
//
// It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
// replacement, and a half-assertion scored on its own is how a hook reports green having checked
// nothing. It then reports only an assertion the write itself introduces, so one elsewhere in the
// file does not nag on an unrelated edit. Comment and string bodies are blanked first, so an
// assertion quoted in a doc comment is never judged.
//
//   hook :  assertion-message.ts --stdin        (PreToolUse JSON on stdin; warns, never refuses)
//   scan :  assertion-message.ts <path> …       (any file or tree; prints every finding it can see)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../../../../plugin-support-lib/src/lib/payload.ts";
import { filesUnder, introduced, lineOf, mask, read, resultingText } from "../../../../../scripts/lib/source.ts";

const SPEC = [".spec.ts", ".spec.tsx"];
const JOURNEY_TIER = "/tests/journeys/";

// An assertion, as Playwright writes one. `expect.extend` and `expect.configure` are not matched,
// because neither asserts anything.
const ASSERTION = /(?<![\w.$])expect(?:\.soft|\.poll)?\s*\(/g;
const OPENERS = "([{";
const CLOSERS = ")]}";

const REMEDY = "Give the assertion a second argument naming what you expected and what would " +
  "explain its absence: expect(editors, `the content page rendered no channel editor at all — the " +
  "session may lack NTF_CONFIG_MANAGE`).toHaveCount(1). Playwright prints that as the failure " +
  "headline, on expect, expect.soft and expect.poll alike, so the next reader starts with a " +
  "diagnosis rather than with the spec and the component behind it.";

/** A journey spec: a `.spec.ts` or `.spec.tsx` under a `tests/journeys/` folder. */
export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  return SPEC.some((extension) => normalized.endsWith(extension)) && normalized.includes(JOURNEY_TIER);
}

/**
 * Where this call's parentheses close, and how many arguments sit between them.
 *
 * The walk runs over the MASKED text, so a comma inside a string or a comment is already blank and
 * can never look like an argument boundary. A call that never closes — a fragment, or a file this
 * check cannot parse — answers null, and the caller leaves it alone.
 */
export function argumentList(masked: string, openParen: number): [number | null, number] {
  let depth = 0;
  let index = openParen;
  let commas = 0;
  let content = false;
  while (index < masked.length) {
    const char = masked[index];
    if (OPENERS.includes(char)) depth += 1;
    else if (CLOSERS.includes(char)) {
      depth -= 1;
      if (depth === 0) return [index, content || commas ? commas + 1 : 0];
    } else if (char === "," && depth === 1) commas += 1;
    else if (depth >= 1 && !/\s/.test(char)) content = true;
    index += 1;
  }
  return [null, 0];
}

/**
 * Every assertion in this text that carries no message.
 *
 * `added` is the text the write introduces, or null for a scan. An assertion is reported only when
 * the write carries one of its lines, so one written earlier does not nag on a later edit.
 */
export function findings(source: string, added: string | null): string[] {
  const masked = mask(source);
  const found: string[] = [];
  for (const match of masked.matchAll(ASSERTION)) {
    const open = match.index + match[0].length - 1;
    const [closeParen, argumentCount] = argumentList(masked, open);
    if (closeParen === null || argumentCount >= 2) continue;
    const start = source.lastIndexOf("\n", match.index) + 1;
    let end = source.indexOf("\n", closeParen);
    if (end === -1) end = source.length;
    if (!introduced(source, [start, end], added)) continue;
    // An assertion may span lines, and a finding reads better on one.
    const quoted = source.slice(start, end).split(/\s+/).filter(Boolean).join(" ");
    found.push(`line ${lineOf(source, match.index)}: ${quoted.slice(0, 110)}`);
  }
  return found;
}

/** The verdict for one write, or null. Called alone and by the dispatcher. */
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
    found = findings(source, added);
  } catch {
    return null;                     // a parse this check cannot do allows, never blocks
  }
  if (!found.length) return null;
  const lines = [`A journey assertion says why it might have failed. In ${basename(path)}:`];
  for (const item of found) lines.push(`  - ${item}`);
  lines.push(`  ${REMEDY}`);
  return { note: lines.join("\n") };
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
    for (const item of findings(source, null)) {
      total += 1;
      console.log(`${target}: ${item}`);
    }
  }
  console.log(`\n${total} finding(s) — a journey assertion carrying no message`);
  return total ? 1 : 0;
}

export const CHECK = { name: "assertion-message", run, watched };

if (runAlone("assertion-message.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  const paths = argv.filter((a) => a !== "--stdin");
  process.exit(scan(paths.length ? paths : ["."]));
}
