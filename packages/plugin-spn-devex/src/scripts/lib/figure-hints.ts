// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/07-figures.md § The figures — what sits inside a block, and the closed set of them
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// Figures beside the passages that call for them, and matching them (rule RULE.DEVEX.WORKSPACE.548). Both hints are SOFT and read a seat file's markdown:
//
//   a passage that walks through three or more steps, relations, states or layers, with no `dg` fence in its section
//                                                    "a learner would see this faster as a <kind>: add a dg figure beside it (rule 548)"
//   a `dg` fence whose box labels the section's prose does not name
//                                                    "the figure names <label>, which the passage does not"

import type { Finding } from "./block-fit.ts";

/** One section of a seat file: its heading level, the prose and list lines it holds, and the `dg` fences in it. */
export type Section = { level: number; name: string; paragraphs: string[]; lists: { ordered: boolean; items: string[] }[]; figures: string[]; parent: number };

const STEP = /\b(?:then|next|after that|afterwards|finally|first|second|third)\b/gi;
const VERBS = "reads|writes|calls|feeds|holds|produces|renders|sends|asks|answers|replies|builds|publishes|consumes|stores|checks|lists|draws|runs|loads|creates|owns|points at|depends on|reaches";
const RELATION = new RegExp(`\\b(?:${VERBS})\\b`, "gi");
const NAMED = /`[^`\n]+`|\*\*[^*\n]+\*\*/g;

/** Strip the markdown a reader does not read: links to their text, emphasis marks and code ticks. */
const plain = (s: string): string => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*_]/g, "").replace(/\s+/g, " ").trim();

/** The sections of a markdown text, front matter, comments and fenced code other than `dg` kept out of the prose. */
export function sectionsOf(text: string): Section[] {
  const lines = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const out: Section[] = [];
  let cur: Section = { level: 0, name: "", paragraphs: [], lists: [], figures: [], parent: -1 };
  out.push(cur);
  const stack: number[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { cur.paragraphs.push(para.join(" ")); para = []; } };
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at];
    const fence = /^\s*(```+|~~~+)\s*([\w-]*)/.exec(line);
    if (fence) {
      flush();
      const body: string[] = [];
      while (at + 1 < lines.length && !lines[at + 1].trim().startsWith(fence[1])) { at += 1; body.push(lines[at]); }
      at += 1;
      if (fence[2] === "dg") cur.figures.push(body.join("\n"));
      continue;
    }
    const heading = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      while (stack.length && out[stack[stack.length - 1]].level >= level) stack.pop();
      cur = { level, name: plain(heading[2]), paragraphs: [], lists: [], figures: [], parent: stack.length ? stack[stack.length - 1] : -1 };
      out.push(cur);
      stack.push(out.length - 1);
      continue;
    }
    if (/^\s*\|/.test(line) || /^\s*>/.test(line)) { flush(); continue; }
    const item = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (item) {
      flush();
      const ordered = item[2] !== undefined;
      const last = cur.lists[cur.lists.length - 1];
      if (last && last.ordered === ordered && /^\s*(?:[-*]|\d+[.)])\s|^\s{2,}\S/.test(lines[at - 1] ?? "")) last.items.push(item[3]);
      else cur.lists.push({ ordered, items: [item[3]] });
      continue;
    }
    if (/^\s{2,}\S/.test(line) && cur.lists.length && (lines[at - 1] ?? "").trim()) { const l = cur.lists[cur.lists.length - 1]; l.items[l.items.length - 1] += ` ${line.trim()}`; continue; }
    if (!line.trim()) { flush(); continue; }
    para.push(line.trim());
  }
  flush();
  return out;
}

/** The kind of figure a passage's shape names. */
export function kindFor(passage: string): string {
  const text = plain(passage).toLowerCase();
  const count = (re: RegExp): number => (text.match(re) ?? []).length;
  if (count(/\b(?:answers?|replies|asks?|sends?|responds?)\b/g) >= 2) return "sequence";
  if (/\bstates?\b/.test(text) && /\b(?:becomes?|moves? (?:to|from|between)|transitions?)\b/.test(text)) return "state";
  if (/\blayers?\b/.test(text) && /\b(?:inside|within|boundary)\b/.test(text)) return "system";
  if (/\b(?:one or many|many to one|one to many|has many|belongs to)\b/.test(text)) return "entities";
  if (count(/\b(?:if|otherwise|or else|when not)\b/g) >= 2) return "flowchart";
  if (/→|\bthen\b|\bnext\b|\bfinally\b|\bfirst\b/.test(text)) return "chain";
  return "map";
}

/** Whether one passage walks through three or more steps, relations, states or layers. */
export function callsForFigure(passage: string, ordered = false, items = 0): boolean {
  if (ordered && items >= 3) return true;
  const text = plain(passage);
  if ((text.match(/→/g) ?? []).length >= 3) return true;
  const steps = text.match(STEP) ?? [];
  if (steps.length >= 3 && new Set(steps.map((one) => one.toLowerCase())).size >= 2) return true;
  // Three or more named things joined by three or more relation verbs, in one sentence.
  for (const sentence of passage.split(/(?<=[.!?])\s+/)) {
    if ((sentence.match(NAMED) ?? []).length >= 3 && (plain(sentence).match(RELATION) ?? []).length >= 3 && /,|;/.test(sentence)) return true;
  }
  return false;
}

const wordsOf = (s: string): string[] => plain(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);

/** The labels of a `dg` fence's boxes (and a system's layers and outside boxes), or null where the fence is not strict JSON or draws no boxes. */
export function labelsOf(fence: string): string[] | null {
  let spec: any;
  try { spec = JSON.parse(fence); } catch { return null; }
  if (!spec || spec.kind === "skeleton") return null;
  const out: string[] = [];
  const take = (box: any) => { if (box && typeof box.label === "string") out.push(box.label); };
  for (const box of spec.boxes ?? []) take(box);
  for (const box of spec.outside ?? []) take(box);
  for (const layer of spec.layers ?? []) { take(layer); for (const box of layer.boxes ?? []) take(box); }
  return out.length ? out : null;
}

/** Whether a label is named by the prose: its whole text, or each of its words of three letters or more (by their first four letters). */
export function named(label: string, prose: string): boolean {
  const want = plain(label).toLowerCase();
  if (!want || plain(prose).toLowerCase().includes(want)) return true;
  const have = new Set(wordsOf(prose).map((w) => w.slice(0, 4)));
  const need = wordsOf(label);
  return need.length > 0 && need.every((w) => have.has(w.slice(0, 4)));
}

const proseOf = (s: Section): string => [...s.paragraphs, ...s.lists.flatMap((list) => list.items)].join(" ");

/** The figure hints for a seat file's markdown. */
export function figureHints(text: string): Finding[] {
  const sections = sectionsOf(text);
  const out: Finding[] = [];
  for (const section of sections) {
    const own = proseOf(section);
    if (!section.figures.length) {
      const passages: [string, boolean, number][] = [
        ...section.paragraphs.map((p): [string, boolean, number] => [p, false, 0]),
        ...section.lists.map((l): [string, boolean, number] => [l.items.join(" "), l.ordered, l.items.length]),
      ];
      const hit = passages.find(([passage, ordered, items]) => callsForFigure(passage, ordered, items));
      if (hit)
        out.push(["SOFT", `${section.name ? `"${section.name}": ` : ""}a learner would see this faster as a ${kindFor(hit[0])}: add a dg figure beside it (rule RULE.DEVEX.WORKSPACE.548) — "${plain(hit[0]).split(/\s+/).slice(0, 10).join(" ")}…" walks through three or more steps, relations, states or layers`]);
    }
    // A figure is read against its section's prose and the prose and names of the sections above it, which introduce what it draws.
    let parent = "";
    for (let up = section.parent; up >= 0; up = sections[up].parent) parent += ` ${proseOf(sections[up])} ${sections[up].name}`;
    for (const fence of section.figures) {
      const labels = labelsOf(fence);
      if (!labels) continue;
      for (const label of labels)
        if (!named(label, `${own} ${parent} ${section.name}`))
          out.push(["SOFT", `the figure names ${label}, which the passage does not (rule RULE.DEVEX.WORKSPACE.548) — every box is a thing the passage names, in its words`]);
    }
  }
  return out;
}
