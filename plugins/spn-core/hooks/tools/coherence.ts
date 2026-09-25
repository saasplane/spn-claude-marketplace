#!/usr/bin/env node
// RESTATES: RD.GOV.008, RD.DOCS.012, RD.DOCS.021, RD.DOCS.055, `04-discipline.md` and
// `06-registers.md`. The chapters are the source of truth; a rule change is edited there first.
//
// Check the corpus against itself, rather than against its own form.
//
// Every other validator here asks whether a document is well-formed: links resolve, metadata parses,
// statuses are legal. All of them pass while two documents state opposite rules, because nothing
// compares one rule to another.
//
// This asks six questions that only have answers across documents:
//
//   VOCABULARY   does every closed vocabulary say the same thing everywhere it appears
//   RULING       does each row carry exactly one ruling, and nothing but ruling
//   OWNERSHIP    is one subject ruled on by two documents that do not cite each other
//   CARDINALITY  does prose write a count into a set that is free to grow
//   HUB          does the readable face expand every section its concept states
//   RESTATES     does a file still say what the chapter it restates says
//   CITATION     does every `RD.<AREA>.<NNN>` cited anywhere resolve to a row that exists
//
// NONE OF THEM ASKS WHETHER A ROW'S RULING IS TRUE of the documents it governs, and that is the
// question worth most. It needs a row to name the surfaces stating it, which `06-registers.md` now
// requires and no row yet carries. Until a row carries that list, the comparison is an inference
// problem rather than a check, and an inference that guesses wrong is worse than silence.
//
// Run from the repo root, in ANY repo. EVERY QUESTION DEGRADES TO SILENCE WHERE ITS INPUT IS ABSENT
// — a partner holds the plugins and neither the foundation book nor its registers, so a missing
// register, concept or overview is a fact about that repo rather than a finding about it. A check
// that crashes on a repo it was not written for takes the whole hook down with it.
//
// Exit code is the number of findings.

import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { isFile, read } from "../lib/payload.ts";
import { check as restatesCheck, parse as restatesParse, registerRows, undeclared } from "../lib/restates.ts";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".nx", "coverage", "__pycache__"]);
// Heading words too common to identify a section on their own.
const SKIP_WORDS = new Set(["what", "this", "that", "with", "from", "they", "them", "then",
  "never", "every", "which", "where", "their", "there", "once"]);

// Prose that is deliberately historical: an artifact describes the moment it was produced
// (RD.DOCS.021), so its struck-through text is a record rather than a claim.
//
// This once said a superseded ruling keeps its old words on purpose. It does not. `06-registers.md`
// rules that a row is never annotated, struck through, or left standing with a note, and `doc-check`
// refuses one now, so a register carries none to skip. The skip stays for artifacts, where the shape
// is still legitimate.
const HISTORICAL = /~~[\s\S]*?~~|<del>[\s\S]*?<\/del>/g;

/** Every `.md` under one folder, relative to the root the tool was run from. */
function markdownUnder(root: string, folder: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, shown: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir).sort(); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      const label = shown ? `${shown}/${entry}` : entry;
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { if (!SKIP_DIRS.has(entry)) walk(full, label); }
      else if (entry.endsWith(".md")) out.push(label);
    }
  };
  walk(join(root, folder), folder);
  return out;
}

/**
 * Paths ordered the way Python orders them — SEGMENT BY SEGMENT, not as whole strings.
 * `docs/a.md` sorts before `docs-x.md` when the separator is a boundary and after it when it is a
 * character, and the two orders disagree. Findings are read in this order, so it is not cosmetic.
 */
function byPathParts(a: string, b: string): number {
  const left = a.split("/"), right = b.split("/");
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i], r = right[i];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

/**
 * Filtered to what EXISTS, because this runs in any repo. A glob returns only real files, but the
 * three named roots do not — and a partner repo commonly has no `providers/` and no `CLAUDE.md`.
 */
function sourcesOf(root: string): string[] {
  const found = new Set([
    ...markdownUnder(root, "docs"),
    ...markdownUnder(root, "providers"),
    ...["CONCEPT.md", "README.md", "CLAUDE.md"].filter((name) => isFile(join(root, name))),
  ]);
  return [...found].sort(byPathParts);
}

/** A document's prose, with fences, metadata and struck-through text removed. */
function body(root: string, path: string): string {
  return read(join(root, path))
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(HISTORICAL, "");
}

// ---------------------------------------------------------------------------- the six questions

/** A closed vocabulary must read identically everywhere it is written. */
function vocabulary(root: string, sources: string[]): string[] {
  const seen = new Map<string, Map<string, string[]>>();
  for (const path of sources)
    for (const found of read(join(root, path))
      .matchAll(/^(SP[A-Za-z]+Type)\s+([\s\S]+?)(?=\n\S|\n\n|(?![\s\S]))/gm)) {
      const values = [...new Set(found[2].match(/\b[A-Z][A-Z_0-9]+\b/g) ?? [])].sort();
      if (!values.length) continue;
      if (!seen.has(found[1])) seen.set(found[1], new Map());
      seen.get(found[1])!.set(path, values);
    }
  const out: string[] = [];
  for (const [name, where] of seen) {
    const shapes = new Set([...where.values()].map((v) => v.join("\u0000")));
    if (shapes.size <= 1) continue;
    // Stable, so equal sizes keep the order they were read in — as Python's reverse sort does.
    const variants = [...where.entries()].map((entry, index) => ({ entry, index }))
      .sort((a, b) => (b.entry[1].length - a.entry[1].length) || (a.index - b.index))
      .map((w) => w.entry);
    const widest = variants[0][1];
    for (const [source, values] of variants.slice(1)) {
      if (values.join("\u0000") === widest.join("\u0000")) continue;
      const missing = widest.filter((v) => !values.includes(v));
      const extra = values.filter((v) => !widest.includes(v));
      // Printed as Python prints a list — no space inside the brackets. The two runs are compared
      // line for line, so the shape of the list is part of the answer.
      const asList = (values: string[]) => values.length ? `[${values.map((v) => `'${v}'`).join(", ")}]` : "—";
      out.push(`VOCABULARY  ${name} differs in ${source}\n` +
        `            missing ${asList(missing)} · extra ${asList(extra)}\n` +
        `            widest form is ${variants[0][0]}`);
    }
  }
  return out;
}

// A bolded COMPLETE sentence — long enough to be a claim, and punctuated like one. Emphasis on a
// phrase is not this; a second ruling hiding in a long cell is.
const BURIED = /\*\*([^*]{25,}?[.!?])\*\*/g;

/**
 * One ruling per row, and the whole decision column is that ruling.
 *
 * The register has a `Why` column, so the decision column carries no reasoning and no second answer.
 * A row that holds two rulings is two rows: the one a reader meets first is the one they act on, and
 * the other is invisible until somebody reads the whole cell. `RD.PLATFORM.035` carried a MUST two
 * hundred words in, which is the case this was written for.
 *
 * BOLD IS ORDINARY EMPHASIS IN A ROW, so its absence proves nothing and is not checked. What is
 * checked is a bolded complete SENTENCE after the opening one, which is what a buried ruling looks
 * like every time it has appeared.
 */
function rulings(root: string): string[] {
  const register = join(root, "docs/registers/decisions.md");
  if (!isFile(register)) return [];                // a repo earns a register; absence is not drift
  const split: Array<[number, string, string]> = [];
  const long: Array<[number, string]> = [];
  for (const row of read(register).matchAll(/^\| (RD\.[A-Z]+\.\d+) \| (.+?) \| .+? \| .+? \|$/gm)) {
    const [, rid, text] = row;
    const rest = text.replace(/^\*\*.+?\*\*/, "");  // the opening claim is the ruling
    const buried = [...rest.matchAll(BURIED)].map((m) => m[1]);
    if (buried.length) split.push([buried.length, rid, buried[0].split(/\s+/).join(" ").slice(0, 80)]);
    else if (text.split(/\s+/).filter(Boolean).length > 150)
      long.push([text.split(/\s+/).filter(Boolean).length, rid]);
  }
  if (!split.length && !long.length) return [];
  // ONE finding, not one per row. A third of the register predates this rule, and printing a line
  // each buries every other question this script asks. The counts are the backlog, and the worst ten
  // are what somebody can pick up today — nothing is dropped silently.
  let out = `RULING      ${split.length} row(s) hold more than one ruling, and ${long.length} run past ` +
    `150 words in one decision cell.\n            One ruling per row; reasoning belongs in \`Why\`. Worst first:`;
  for (const [count, rid, sample] of [...split].sort((a, b) =>
      (b[0] - a[0]) || (b[1] < a[1] ? -1 : b[1] > a[1] ? 1 : 0)).slice(0, 6))
    out += `\n              ${rid.padEnd(16)} +${count} buried · ${sample}…`;
  for (const [words, rid] of [...long].sort((a, b) =>
      (b[0] - a[0]) || (b[1] < a[1] ? -1 : b[1] > a[1] ? 1 : 0)).slice(0, 4))
    out += `\n              ${rid.padEnd(16)} ${words} words`;
  return [out];
}

/** Two documents ruling on one subject, neither citing the other. */
function ownership(root: string, sources: string[]): string[] {
  const out: string[] = [];
  const owners = new Map<string, string[]>();
  for (const path of sources) {
    // The concept may not cite a seat or a chapter at all — it links only outward (RD.DOCS.012), so
    // it can never satisfy this check and is not in scope for it.
    if (path === "CONCEPT.md") continue;
    if (path.includes("registers/decisions.md") || path.includes("/approaches/")) continue;
    // The whole bolded lead-in, not up to its first comma — truncating there collapses
    // "Plain sentences, whoever the reader is" to two words, which the filter then drops.
    for (const found of body(root, path).matchAll(/^(?:[-*]|\d+\.)\s+\*\*([^\n]{6,110}?)\*\*/gm)) {
      const key = found[1].toLowerCase().replace(/[^a-z ]/g, " ")
        .split(/\s+/).filter((w) => w.length > 3).join(" ");
      if (key.split(" ").filter(Boolean).length >= 3)
        owners.set(key, [...(owners.get(key) ?? []), path]);
    }
  }
  for (const [key, all] of owners) {
    const where = [...new Set(all)].sort();
    if (where.length < 2) continue;
    // A link is not a licence to restate. 04-discipline allows repetition only as a DECLARED mirror,
    // so a citation downgrades the finding — it never clears it.
    let cites = false, mirror = false;
    for (const a of where)
      for (const b of where) {
        if (a === b) continue;
        const text = read(join(root, b));
        if (text.includes(basename(a))) cites = true;
        if (new RegExp(`\\bmirrors?\\b[\\s\\S]{0,80}${basename(a).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text))
          mirror = true;
      }
    if (mirror) continue;                           // declared, and the declaration is what the discipline asks for
    const note = cites ? "they link to each other, which is not a declared mirror" : "neither cites the other";
    out.push(`OWNERSHIP   "${key}" is ruled on by ${where.length} documents — ${note}` +
      `\n            ` + where.join("\n            "));
  }
  return out;
}

// RD.GOV.008 keeps a count where it carries the ruling: adding a member would be a redesign, not an
// ordinary register entry. These are those sets — the test is whether the number IS the decision,
// not whether the set happens to be closed today.
const LOAD_BEARING = new Set(["seats", "passes", "layers", "entries", "principals", "pockets",
  "stages", "runtimes", "directions", "disciplines", "families"]);

/** A count written into prose for a set that is free to grow (RD.GOV.008). */
function cardinality(root: string, sources: string[]): string[] {
  const WORDS = "(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";
  const GROWABLE = "(?:kinds?|constructs?|skills?|lenses|domains?|tiers?|artifacts?|" +
    "chapters?|templates?|resources?|groups?|personas?|verbs?|invariants?|providers?|surfaces?)";
  const pattern = new RegExp(`\\bthe ${WORDS} (${GROWABLE})\\b`, "gi");
  const out: string[] = [];
  for (const path of sources) {
    if (path.includes("/approaches/") || path.includes("/reports/")) continue;  // point-in-time (RD.DOCS.021)
    const text = body(root, path);
    for (const found of text.matchAll(pattern)) {
      const noun = found[1].toLowerCase().replace(/s+$/, "") + "s";
      if (LOAD_BEARING.has(noun)) continue;
      const line = text.slice(0, found.index!).split("\n").length;
      out.push(`CARDINALITY ${path}:${line} — "${found[0]}" writes a count into a set ` +
        `a decision entry could grow`);
    }
  }
  return out;
}

/**
 * Every concept section owes a section in its readable face.
 *
 * A face renders a live seat, so unlike an argument or a measurement it CAN be checked against
 * current state (RD.DOCS.021). `concept-overview.html` is the concept's readable face rather than a
 * record of a moment: a workstream that changes the model owes the face with it, and a section the
 * face never expands is a model somebody added and stopped.
 *
 * Only the concept's own `##` and `###` headings are compared. A face carries fewer words per
 * section by design — what it may not carry is fewer sections.
 */
function hub(root: string): string[] {
  const concept = join(root, "CONCEPT.md");
  const face = join(root, "docs/artifacts/overviews/concept-overview.html");
  if (!isFile(concept) || !isFile(face)) return [];   // a repo earns a face; absence is not drift
  const rendered = read(face).replace(/<[^>]+>/g, " ").toLowerCase();
  const missing: string[] = [];
  for (const found of read(concept).matchAll(/^#{2,3} +(.+?)\s*$/gm)) {
    const heading = found[1];
    const words = (heading.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !SKIP_WORDS.has(w));
    if (words.length && !words.some((w) => rendered.includes(w))) missing.push(heading.trim());
  }
  if (!missing.length) return [];
  let out = `HUB         ${missing.length} concept section(s) the readable face never expands.`;
  out += "\n            A face tracks its seat; a section it drops is a model nobody rendered:";
  for (const heading of missing.slice(0, 8)) out += `\n              ${heading.slice(0, 76)}`;
  return [out];
}

/**
 * A file under `providers/` restates chapters of this book, and it may have stopped.
 *
 * These sit in the SAME repo as the chapters, so comparing them crosses no boundary and this is the
 * cheap half. The marketplace's plugin restatements are the other half, and they need
 * `restate-drift.ts` because no repo holds both trees.
 *
 * IT FAILS ONLY ON WHAT EXISTS. A file with no `spn:restates` block is not reported here — that count
 * belongs to the stamping pass, and a finding on every unstamped file would be the whole tree on the
 * first run.
 */
function restatementDrift(root: string): string[] {
  const providers = markdownUnder(root, "providers").sort(byPathParts);
  if (!providers.length) return [];                 // no provider tree here; that is not drift
  const known = registerRows(join(root, "docs/registers/decisions.md"));
  const findings: string[] = [];
  for (const path of providers) {
    const [block, broken] = restatesParse(join(root, path));
    if (broken) findings.push(`${path}: ${broken}`);
    else if (block !== null) {
      findings.push(...restatesCheck(path, block, root, known));
      findings.push(...undeclared(join(root, path), block)
        .map((name) => `${path}: restates \`${name}\` and does not declare it`));
    }
  }
  if (!findings.length) return [];
  let out = `RESTATES    ${findings.length} restatement(s) no longer agree with what they cite.`;
  out += "\n            The chapter wins and the file is regenerated — never the reverse:";
  for (const finding of findings.slice(0, 8)) out += `\n              ${finding}`;
  if (findings.length > 8) out += `\n              … and ${findings.length - 8} more`;
  return [out];
}

/**
 * CITATION — does every decision id cited in this repository resolve to a row?
 *
 * **A citation to a row that does not exist is the one register failure a reader cannot work
 * around.** Every other finding here leaves a reader with two answers to choose between. This one
 * leaves them with none, and it is silent: `RD.APPS.020` reads exactly like a row that exists until
 * somebody opens the register and searches for it.
 *
 * It is cheap because both halves are already on disk — the cited ids and the rows are in the same
 * tree. `N76` found two ids that had dangled since before that arc, and nothing had ever asked.
 *
 * SOFT WHILE THE COUNT IS ABOVE ZERO. A gate that is red on the day it ships is one nobody reads,
 * which is this corpus's own argument arriving as a constraint (see `checks/corpus.ts`). It joins
 * the wired set on the day it is silent on a clean corpus.
 *
 * WHAT IT DELIBERATELY DOES NOT READ: a workstream folder. An arc log cites the row that governed
 * an act when the act happened, and a row removed later does not make that log wrong — it makes it
 * history. Rewriting it would state something that never happened.
 */
function citations(root: string): string[] {
  const register = join(root, "docs/registers/decisions.md");
  const registerText = read(register);
  if (!registerText) return [];                    // no register here — not this repo's question
  const rows = new Set<string>();
  for (const line of registerText.split("\n")) {
    const row = /^\|\s*(RD\.[A-Z]+\.\d+)\s*\|/.exec(line);
    if (row) rows.add(row[1]);
  }
  if (!rows.size) return [];

  const dangling = new Map<string, string[]>();
  for (const path of sourcesOf(root)) {
    const text = read(join(root, path));
    for (const hit of text.matchAll(/RD\.[A-Z]+\.\d{3}/g)) {
      const id = hit[0];
      if (rows.has(id)) continue;
      const where = dangling.get(id) ?? [];
      if (!where.includes(path)) where.push(path);
      dangling.set(id, where);
    }
  }
  if (!dangling.size) return [];
  let out = `CITATION    ${dangling.size} decision id(s) cited here resolve to no row.`;
  out += "\n            A citation with no row answers nothing and says so to nobody:";
  for (const [id, where] of [...dangling].slice(0, 8))
    out += `\n              ${id} — cited in ${where.slice(0, 3).join(", ")}` +
           (where.length > 3 ? ` and ${where.length - 3} more` : "");
  if (dangling.size > 8) out += `\n              … and ${dangling.size - 8} more`;
  return [out];
}

export function main(root: string): number {
  const sources = sourcesOf(root);
  const findings = [
    ...vocabulary(root, sources), ...rulings(root), ...ownership(root, sources),
    ...cardinality(root, sources), ...hub(root), ...restatementDrift(root),
    ...citations(root),
  ];
  for (const finding of findings) { console.log(finding); console.log(); }
  const kinds = new Map<string, number>();
  for (const finding of findings) {
    const kind = finding.split(/\s+/)[0];
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  const summary = [...kinds.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([kind, count]) => `${count} ${kind.toLowerCase()}`).join(" · ") || "nothing";
  console.log(`${sources.length} documents compared against each other — ${summary}`);
  return findings.length;
}

if (process.argv[1] && basename(process.argv[1]) === "coherence.ts")
  process.exit(Math.min(main(process.argv[2] ?? process.cwd()), 250));
