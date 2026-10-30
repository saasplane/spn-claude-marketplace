// What the book already says about a subject, found at the moment it is proposed: the decision rows of every
// repository's register and the rules of the rules index whose words match the subject's. `suggestion add` prints
// them, so the search a proposal owes is made by the command and never left to memory.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RuleEntry } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";

/** One decision or rule that speaks to a subject: its id, its words and where it is read in full. */
export type Precedent = { kind: "decision" | "rule"; id: string; text: string; where: string };

/** A register line that is a decision: a table row led by an id, or a card heading `### D<n> — …`. */
const ROW_ID = /^\|\s*\**((?:DEC|RD)\.[A-Z_]+\.[A-Z_]+\.\d+)\**\s*\|(.*)$/;
const CARD = /^###\s+(D\d+)\s+—\s+(.*)$/;
/** Words too common to say what a subject is about. */
const COMMON = new Set(["the", "and", "for", "with", "from", "that", "this", "when", "what", "how", "into", "every", "each", "its", "are", "not"]);

/** The words of a subject that say something: lower case, at least three letters, no common word. */
export function wordsOf(subject: string): string[] {
  const words = subject.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? [];
  return [...new Set(words.filter((word) => !COMMON.has(word)))];
}

/** Whether a text speaks to the subject: two of its words, or its only word where it has fewer than two. */
function speaksTo(text: string, words: readonly string[]): boolean {
  if (!words.length) return false;
  const held = new Set(wordsOf(text));
  const shared = words.filter((word) => held.has(word)).length;
  return shared >= Math.min(2, words.length);
}

/** The decisions a register's text holds, each as its id and the words that follow it. */
export function decisionsIn(text: string, where: string): Precedent[] {
  const found: Precedent[] = [];
  for (const line of text.split("\n")) {
    const row = ROW_ID.exec(line);
    if (row) { found.push({ kind: "decision", id: row[1], text: row[2].replace(/\|/g, " ").replace(/\s+/g, " ").trim(), where }); continue; }
    const card = CARD.exec(line);
    if (card) found.push({ kind: "decision", id: card[1], text: card[2].trim(), where });
  }
  return found;
}

/** The rules of an index as precedents: a rule's words are its heading and, on a short rule, its line. */
export function rulesIn(rules: readonly RuleEntry[]): Precedent[] {
  return rules.map((rule) => ({ kind: "rule" as const, id: rule.id, text: `${rule.heading} ${rule.line?.text ?? ""}`.trim(), where: rule.chapter }));
}

/** The precedents among `candidates` whose words match the subject, in the order given. */
export function precedentFor(subject: string, candidates: readonly Precedent[]): Precedent[] {
  const words = wordsOf(subject);
  return candidates.filter((one) => speaksTo(one.text, words));
}

/** The registers of the repositories under a workspace root, and the rules index the plugin carries. Never throws. */
export function candidatesAt(root: string | null): Precedent[] {
  const out: Precedent[] = [];
  let repos: string[] = [];
  try { repos = root ? readdirSync(root) : []; } catch { /* a root that cannot be listed holds no register */ }
  for (const repo of repos) {
    const register = join(root!, repo, "docs", "registers", "decisions.md");
    try { out.push(...decisionsIn(readFileSync(register, "utf8"), `${repo}/docs/registers/decisions.md`)); } catch { /* a repository with no register */ }
  }
  try {
    const index = JSON.parse(readFileSync(fileURLToPath(new URL("../../refs/rules.json", import.meta.url)), "utf8")) as { rules?: RuleEntry[] };
    out.push(...rulesIn(index.rules ?? []));
  } catch { /* the index is written by the build; without it only the registers speak */ }
  return out;
}

/** The lines a command prints for a subject: none where nothing speaks to it. */
export function precedentLines(root: string | null, subject: string, limit = 5): string[] {
  const found = precedentFor(subject, candidatesAt(root));
  if (!found.length) return [];
  const cut = (text: string): string => (text.length > 110 ? `${text.slice(0, 107)}...` : text);
  return [
    `already decided or ruled on this subject (${found.length}): read before going on`,
    ...found.slice(0, limit).map((one) => `  ${one.id} · ${cut(one.text)} · ${one.where}`),
    ...(found.length > limit ? [`  and ${found.length - limit} more`] : []),
  ];
}
