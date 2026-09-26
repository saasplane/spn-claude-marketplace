#!/usr/bin/env node
// Refuse a `.then()` chain in a server node's source, at the moment it is written.
//
// **The rule.** On the server, `await` is how one thing is sequenced after another. A chain says the
// same thing at more length, and it is a second style in a file whose every other function awaits
// (RD.APPS.106, stated in `docs/04-capabilities/02-support/01-apps/10-providers/ts/05-code.md`). A chapter is where the next
// function gets copied from, and a chapter cannot fire when somebody writes the file.
//
// **The exception is a synchronous callback contract the code does not own.** A library that takes a
// callback and expects nothing back cannot be handed an async function: the promise it returns is
// one nobody awaits, so a rejection goes unhandled. The outer function stays synchronous and the
// work sits in a deliberately unawaited immediate async function:
//
//     void (async () => {
//       try {
//         const allowed = await resolveOrigin(safeOrigin);
//         callback(allowed ? null : new Error(CORS_REFUSAL), allowed);
//       } catch (error) {
//         callback(error instanceof Error ? error : new Error(CORS_REFUSAL), false);
//       }
//     })();
//     return;
//
// **What it never reads, and that is most of what it would have hit.** An awaited `.catch()`
// supplying a fallback value — `await response.json().catch(() => null)` — is an expression with a
// default rather than control flow, and a `try` block around it is longer and says less. So this
// reads `.then(` and nothing else.
//
// **Where it reads.** A node's own `src/`, in a node whose kind names the server runtime:
// `APP_SERVER`, `APP_UTILITY`, `MODULE_SERVER`, `SUPPORT_SERVER`. The side comes from the node's own
// `spkind.json`, the way the sibling checks read a kind. A web node is not this rule's subject. Nor
// is a universal one, whose code runs in a browser as well. A node's `tests/` tree is left alone
// too: a suite races a promise against a deadline and chains to do it, which is the tier's own
// idiom.
//
// It reads the file the write would PRODUCE, never the fragment alone: an Edit carries only its
// replacement, and a half-statement scored on its own is how a hook reports green having checked
// nothing. It then denies only for a chain the write itself introduces, so a finding elsewhere in
// the file does not block an unrelated edit. Comment and string bodies are blanked first, so a chain
// quoted in a doc comment is never judged.
//
// It denies rather than warns. The rule is settled, ruled by the developer on 2026-09-16, and both
// stack trees' server source is clean, so a refusal never blocks a legitimate write.
//
//   hook :  await-sequencing.ts --stdin        (PreToolUse JSON on stdin; denies with the fix named)
//   scan :  await-sequencing.ts <path> …       (any file or tree; prints every finding it can see)

import { basename, resolve } from "node:path";
import type { Payload, ToolInput, Verdict } from "../../../../scripts/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../scripts/lib/payload.ts";
import { filesUnder, introduced, lineOf, mask, nodeKind, read, resultingText } from "../../../../scripts/lib/source.ts";

// The runtime is implied by the kind (the TypeScript kinds registry). These four name the server.
const SERVER_KINDS = new Set(["APP_SERVER", "APP_UTILITY", "MODULE_SERVER", "SUPPORT_SERVER"]);
const CHAIN = /\.then\s*\(/g;

const REMEDY = "Sequence it with await inside the function, so a rejection reaches the surrounding " +
  "try. Where a library owns a synchronous callback and expects nothing back, keep the outer " +
  "function synchronous and put the work in a deliberately unawaited immediate async function: " +
  "void (async () => { try { … } catch (error) { … } })(); return;. An awaited .catch() supplying " +
  "a fallback value, such as await response.json().catch(() => null), is an expression default " +
  "rather than control flow, and this check never reads it.";

/** A server node's own source: a `.ts` file under its `src/`, and never a spec. */
export function watched(path: string): boolean {
  const normalized = resolve(path).split("\\").join("/");
  if (!normalized.endsWith(".ts") || !normalized.includes("/src/")) return false;
  const base = basename(normalized);
  if (base.includes(".spec.") || base.includes(".test.")) return false;
  return SERVER_KINDS.has(nodeKind(path) ?? "");
}

/**
 * Every `.then(` this text carries, outside a comment and outside a string.
 *
 * `added` is the text the write introduces, or null for a scan. A chain is judged only when the
 * write carries its line, so a chain elsewhere in the file does not block an unrelated edit.
 */
export function findings(source: string, added: string | null): string[] {
  const masked = mask(source);
  const found: string[] = [];
  for (const match of masked.matchAll(CHAIN)) {
    const start = source.lastIndexOf("\n", match.index) + 1;
    let end = source.indexOf("\n", match.index + match[0].length);
    if (end === -1) end = source.length;
    if (!introduced(source, [start, end], added)) continue;
    found.push(`line ${lineOf(source, match.index)}: ${source.slice(start, end).trim().slice(0, 110)}`);
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
  const lines = [`Denied — on the server, await is how you sequence work. In ${basename(path)}:`];
  for (const item of found) lines.push(`  - ${item}`);
  lines.push(`  ${REMEDY}`);
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
    if (!watched(target)) continue;
    const source = read(target);
    if (source === null) continue;
    for (const item of findings(source, null)) {
      total += 1;
      console.log(`${target}: ${item}`);
    }
  }
  console.log(`\n${total} finding(s) — a .then() chain in a server node's source`);
  return total ? 1 : 0;
}

export const CHECK = { name: "await-sequencing", run, watched };

if (runAlone("await-sequencing.ts")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--stdin")) {
    const event = (await payload()) as Payload | null;
    emit(event ? run(event.tool_input ?? {}) : null);
    process.exit(0);
  }
  const paths = argv.filter((a) => a !== "--stdin");
  process.exit(scan(paths.length ? paths : ["."]));
}
