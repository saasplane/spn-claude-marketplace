// What is already decided, written or built for a subject: the decision rows of every repository's register, the rules of the
// rules index, the headings and bold sentences of every plugin's references, the answered cards of every workstream, the shared
// contract types and, with `--code`, the exported names under a contract. `precedent find` prints them for any task, and
// `suggestion add` and `question raise` run the same search, so it is made by the command and never left to memory.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { WORKSTREAM_STATES, decisionsRegister, docsOf, workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import type { RuleEntry } from "../../../../plugin-support-lib/src/lib/rule-mark.ts";
import { PLUGIN_OF, refRoots, type Places } from "./work-map.ts";

/** The kinds of precedent, in the order a lookup prints them. */
export const KINDS = ["type", "export", "ref", "card", "decision", "rule"] as const;
/** One thing that speaks to a subject: its id, its words and where it is read in full (`line` where it has one). */
export type Precedent = { kind: (typeof KINDS)[number]; id: string; text: string; where: string; line?: number };

/** A register line that is a decision: a table row led by an id, or a card heading `### D<n> — …`. */
const ROW_ID = /^\|\s*\**((?:DEC|RD)\.[A-Z_]+\.[A-Z_]+\.\d+)\**\s*\|(.*)$/;
const CARD = /^###\s+(D\d+)\s+—\s+(.*)$/;
/** Words too common to say what a subject is about. */
const COMMON = new Set(["the", "and", "for", "with", "from", "that", "this", "when", "what", "how", "into", "every", "each", "its", "are", "not"]);

/** The words of a subject that say something: lower case, at least three letters, no common word. */
export function wordsOf(subject: string): string[] {
  // A name is read as the words it is made of: `isActive` says `active`, `SPAddressRegion` says `address` and `region`.
  const spoken = subject.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  const words = spoken.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? [];
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

/** A name as the words it is made of: `SPAddressRegion` reads `sp address region`. */
export const wordsOfName = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").toLowerCase();

/** The headings and the bold sentences of a reference, each with its line; code fences are skipped. */
export function refStatementsIn(text: string, where: string): Precedent[] {
  const out: Precedent[] = [];
  let fenced = false;
  for (const [at, line] of text.split("\n").entries()) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const heading = /^#{1,4}\s+(.+?)\s*$/.exec(line);
    if (heading) { out.push({ kind: "ref", id: heading[1], text: heading[1], where, line: at + 1 }); continue; }
    for (const bold of line.matchAll(/\*\*([^*]{12,}?)\*\*/g)) out.push({ kind: "ref", id: bold[1].slice(0, 60), text: bold[1], where, line: at + 1 });
  }
  return out;
}

/** The answered cards of a workstream's `questions.jsonl`, each by its title and the words of the answer. */
export function answeredCardsIn(text: string, workstream: string, where: string): Precedent[] {
  const out: Precedent[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const one = JSON.parse(line) as { id?: string; title?: string; state?: string; answer?: { key?: string | null; words?: string } };
      if (one.state !== "answered" || !one.id) continue;
      const key = one.answer?.key ? ` (answered ${one.answer.key})` : "";
      out.push({ kind: "card", id: `${workstream}/${one.id.toUpperCase()}`, text: `${one.title ?? ""}${key} ${one.answer?.words ?? ""}`.trim(), where });
    } catch { /* a line that is no record */ }
  }
  return out;
}

/** The exported names of a contract file, each with its line, and the words of the comment above it. */
export function exportedNamesIn(text: string, where: string, kind: "type" | "export"): Precedent[] {
  const out: Precedent[] = [];
  let comment = "";
  for (const [at, line] of text.split("\n").entries()) {
    const note = /^\s*(?:\/\*\*|\*\/|\*|\/\/)\s?(.*?)\s*(?:\*\/)?$/.exec(line);
    if (note) { comment = `${comment} ${note[1]}`.trim().slice(-240); continue; }
    const name = /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:interface|type|enum|const|class|function)\s+([A-Za-z_][\w]*)/.exec(line);
    if (name) out.push({ kind, id: name[1], text: `${wordsOfName(name[1])} ${comment}`.trim(), where, line: at + 1 });
    comment = "";
  }
  return out;
}

const mdFilesUnder = (dir: string, depth = 0): string[] => {
  if (depth > 9) return [];
  const out: string[] = [];
  let names: string[] = [];
  try { names = readdirSync(dir, { withFileTypes: true }).map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort(); } catch { return out; }
  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules/") continue;
    if (name.endsWith("/")) out.push(...mdFilesUnder(join(dir, name), depth + 1));
    else if (name.endsWith(".md")) out.push(join(dir, name));
  }
  return out;
};

/** Every reference of every plugin, from the checkout beside the workspace first and then from the installs; a reference held twice counts once. */
export function refStatements(root: string | null, places: Places = {}): Precedent[] {
  const out: Precedent[] = [];
  const seen = new Set<string>();
  for (const plugin of Object.keys(PLUGIN_OF)) {
    for (const dir of refRoots(plugin, { checkout: root, ...places }).reverse()) {
      for (const file of mdFilesUnder(dir)) {
        const key = `${plugin}/${relative(dir, file)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        try { out.push(...refStatementsIn(readFileSync(file, "utf8"), `${PLUGIN_OF[plugin]} ${relative(dir, file)}`)); } catch { /* unreadable */ }
      }
    }
  }
  return out;
}

const tsFilesUnder = (dir: string, depth = 0): string[] => {
  if (depth > 6) return [];
  const out: string[] = [];
  let entries: Array<{ name: string; dir: boolean }> = [];
  try { entries = readdirSync(dir, { withFileTypes: true }).map((entry) => ({ name: entry.name, dir: entry.isDirectory() })).sort((a, b) => a.name.localeCompare(b.name)); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.dir) out.push(...tsFilesUnder(join(dir, entry.name), depth + 1));
    else if (/\.ts$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(join(dir, entry.name));
  }
  return out;
};

/** The shared contract types of the support contract package, and with `code` the exported names under every `contract/states` folder of the workspace. */
export function contractNames(root: string | null, code: boolean): Precedent[] {
  const out: Precedent[] = [];
  if (!root) return out;
  const shared = join(root, "spn-support-ts", "packages", "support-contract-ts", "src", "contract", "states", "global");
  for (const file of tsFilesUnder(shared)) {
    try { out.push(...exportedNamesIn(readFileSync(file, "utf8"), `spn-support-ts/${relative(join(root, "spn-support-ts"), file)}`, "type")); } catch { /* unreadable */ }
  }
  if (!code) return out;
  let repos: string[] = [];
  try { repos = readdirSync(root).filter((name) => !name.startsWith(".")).sort(); } catch { return out; }
  for (const repo of repos) {
    let packages: string[] = [];
    try { packages = readdirSync(join(root, repo, "packages")).sort(); } catch { continue; }
    for (const pkg of packages) {
      const states = join(root, repo, "packages", pkg, "src", "contract", "states");
      for (const file of tsFilesUnder(states)) {
        if (file.startsWith(shared)) continue;
        try { out.push(...exportedNamesIn(readFileSync(file, "utf8"), `${repo}/${relative(join(root, repo), file)}`, "export")); } catch { /* unreadable */ }
      }
    }
  }
  return out;
}

/** The answered cards of every workstream under the workspace, open, backlog and closed. */
export function answeredCards(root: string | null): Precedent[] {
  const out: Precedent[] = [];
  if (!root) return out;
  for (const state of WORKSTREAM_STATES) {
    const base = workstreamsDir(root, state);
    let names: string[] = [];
    try { names = readdirSync(base).sort(); } catch { continue; }
    for (const name of names) {
      const file = join(base, name, "questions.jsonl");
      try { out.push(...answeredCardsIn(readFileSync(file, "utf8"), name.split("-")[0], relative(root, join(base, name, "questions.jsonl")))); } catch { /* none */ }
    }
  }
  return out;
}

/** How many of the subject's words a precedent holds: the order within a kind. */
export function scoreOf(one: Precedent, words: readonly string[]): number {
  const held = new Set(wordsOf(one.text));
  return words.filter((word) => held.has(word)).length;
}

/** The registers of the repositories under a workspace root, and the rules index the plugin carries. Never throws. */
export function candidatesAt(root: string | null, options: { all?: boolean; code?: boolean; places?: Places } = {}): Precedent[] {
  const out: Precedent[] = [];
  let repos: string[] = [];
  try { repos = root ? readdirSync(root) : []; } catch { /* a root that cannot be listed holds no register */ }
  for (const repo of repos) {
    const register = decisionsRegister(docsOf(join(root!, repo)));
    try { out.push(...decisionsIn(readFileSync(register, "utf8"), `${repo}/${relative(join(root!, repo), register)}`)); } catch { /* a repository with no register */ }
  }
  try {
    const index = JSON.parse(readFileSync(fileURLToPath(new URL("../../refs/rules.json", import.meta.url)), "utf8")) as { rules?: RuleEntry[] };
    out.push(...rulesIn(index.rules ?? []));
  } catch { /* the index is written by the build; without it only the registers speak */ }
  if (options.all) out.push(...refStatements(root, options.places), ...answeredCards(root), ...contractNames(root, options.code === true));
  return out;
}

/**
 * What speaks to a subject, in the order a lookup prints it: by kind (shared types, exported names, reference statements, answered
 * cards, decisions, rules), and within a kind the precedent that holds most of the subject's words first.
 */
export function lookup(root: string | null, subject: string, options: { code?: boolean; places?: Places } = {}): Precedent[] {
  const words = wordsOf(subject);
  const found = precedentFor(subject, candidatesAt(root, { all: true, ...options }));
  return found
    .map((one, at) => ({ one, at, score: scoreOf(one, words) }))
    .sort((a, b) => KINDS.indexOf(a.one.kind) - KINDS.indexOf(b.one.kind) || b.score - a.score || a.at - b.at)
    .map((entry) => entry.one);
}

const cut = (text: string, to = 110): string => (text.length > to ? `${text.slice(0, to - 3)}...` : text);
/** One precedent as a line: its id, its words and where it is read, with the line number where it has one. */
export const precedentLine = (one: Precedent): string => `  ${one.id} · ${cut(one.text)} · ${one.where}${one.line ? `:${one.line}` : ""}`;

/**
 * The lines a command prints for a subject: none where nothing speaks to it. `full` reads every source (`question raise` and
 * `suggestion add` use it); without it only the registers and the rules speak, as when an arc opens.
 */
export function precedentLines(root: string | null, subject: string, limit = 5, full = false): string[] {
  const found = full ? lookup(root, subject) : precedentFor(subject, candidatesAt(root));
  if (!found.length) return [];
  return [
    `already decided, written or built for this subject (${found.length}): read before going on`,
    ...found.slice(0, limit).map(precedentLine),
    ...(found.length > limit ? [`  and ${found.length - limit} more`] : []),
  ];
}
