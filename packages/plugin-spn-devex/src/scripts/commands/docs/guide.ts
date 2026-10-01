#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The guide page — stages, and steps that number themselves
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Produce a guide's page from its markdown: the command reads the guide and places what it finds.
// With `--check` nothing is written.
//
//   spn-devex docs guide <guide.md…> [--check] [--name <name>] [--out <file>]

import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { argsText, begin, commandFacts, end, record } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { GUIDE_PAGE_SUFFIX, docsRootOf, guidePagesDir, slashes } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { PAGE_SCRIPT } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";
import { hrefForPage } from "../../lib/render.ts";
import { LENS_LABEL, locationOf, resolveWorkspace } from "./_lib.ts";
import { Refusal, attribute, escaped, newestCut, operands, optionValue, pageTemplate,
  place, refuseSlots, say, swap, templatesDir, withHead, type Note } from "./_pages.ts";

export const describe = "produce a guide's page of stages and steps from its markdown";

const TEMPLATE = "guide-template.html";
const USAGE = "usage: spn-devex docs guide <guide.md…> [--check] [--name <name>] [--out <file>]";

// ---------------------------------------------------------------------------- the markdown reader

/** One block of a guide's markdown. The reader knows the blocks a guide is written in, and no more. */
type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "code"; language: string; text: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "items"; items: string[] }
  | { kind: "numbered"; items: Block[][] }
  | { kind: "quote"; text: string }
  | { kind: "remark"; text: string }
  | { kind: "rule" };

/** A line that ends a paragraph, because it opens a block of another kind. */
const OPENS_BLOCK = /^(?:#+ |```|\||[-*] |\d+\. |<!--|>(?:\s|$)|-{3,}\s*$)/;

/** The cells of one table row. A bar inside a code span does not split, and neither does `\|`. */
function cells(line: string): string[] {
  const row = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const found: string[] = [];
  let cell = "", code = false;
  for (let at = 0; at < row.length; at += 1) {
    const char = row[at];
    if (char === "\\" && row[at + 1] === "|") { cell += "|"; at += 1; continue; }
    if (char === "`") code = !code;
    if (char === "|" && !code) { found.push(cell.trim()); cell = ""; } else cell += char;
  }
  return [...found, cell.trim()];
}

/** The blocks of a markdown text, in their order. */
function blocksOf(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const found: Block[] = [];
  let at = 0;
  while (at < lines.length) {
    const line = lines[at];
    if (!line.trim()) { at += 1; continue; }
    if (line.startsWith("<!--")) {
      let last = at;
      while (last < lines.length - 1 && !lines[last].includes("-->")) last += 1;
      found.push({ kind: "remark", text: lines.slice(at, last + 1).join("\n") });
      at = last + 1;
    } else if (line.startsWith("```")) {
      let last = at + 1;
      while (last < lines.length && !lines[last].startsWith("```")) last += 1;
      found.push({ kind: "code", language: line.slice(3).trim(), text: lines.slice(at + 1, last).join("\n") });
      at = last + 1;
    } else if (/^#+ /.test(line)) {
      const marks = line.indexOf(" ");
      found.push({ kind: "heading", level: marks, text: line.slice(marks).trim() });
      at += 1;
    } else if (line.startsWith("|")) {
      let last = at;
      while (last < lines.length && lines[last].startsWith("|")) last += 1;
      const rows = lines.slice(at, last).map(cells);
      // The row under the head is the line of dashes, which is no row of the table.
      const ruled = rows.length > 1 && rows[1].every((cell) => /^:?-*:?$/.test(cell));
      found.push({ kind: "table", head: rows[0], rows: rows.slice(ruled ? 2 : 1) });
      at = last;
    } else if (/^-{3,}\s*$/.test(line)) {
      found.push({ kind: "rule" });
      at += 1;
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (at < lines.length && (/^[-*] /.test(lines[at]) || (items.length > 0 && lines[at].startsWith("  ")))) {
        if (/^[-*] /.test(lines[at])) items.push(lines[at].slice(2).trim());
        else items[items.length - 1] += ` ${lines[at].trim()}`;
        at += 1;
      }
      found.push({ kind: "items", items });
    } else if (/^\d+\. /.test(line)) {
      // An item runs on over the lines indented under it, and they may hold a code block.
      const items: Block[][] = [];
      while (at < lines.length && /^\d+\. /.test(lines[at])) {
        const own = [lines[at].slice(lines[at].indexOf(". ") + 2)];
        at += 1;
        while (at < lines.length && (!lines[at].trim() || lines[at].startsWith("   "))) { own.push(lines[at].slice(3)); at += 1; }
        items.push(blocksOf(own.join("\n")));
      }
      found.push({ kind: "numbered", items });
    } else if (/^>(?:\s|$)/.test(line)) {
      const said: string[] = [];
      while (at < lines.length && /^>(?:\s|$)/.test(lines[at])) { said.push(lines[at].replace(/^>\s?/, "").trim()); at += 1; }
      found.push({ kind: "quote", text: said.join(" ") });
    } else {
      let last = at;
      while (last < lines.length && lines[last].trim() && (last === at || !OPENS_BLOCK.test(lines[last]))) last += 1;
      found.push({ kind: "paragraph", text: lines.slice(at, last).map((row) => row.trim()).join(" ") });
      at = last;
    }
  }
  return found;
}

// ---------------------------------------------------------------------------- markdown as html

/** A link of the guide, written again for the place of the page. */
type Link = (href: string) => string;

/** The character that stands around a held code span while the text around it is read. */
const HELD = String.fromCharCode(0);

/** One run of markdown text as html: code, links, bold and italic. */
function inline(text: string, link: Link): string {
  const kept: string[] = [];
  const code = (span: string): string => span.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = text.replace(/`([^`]+)`/g, (_whole, span: string) => {
    kept.push(`<code>${code(span)}</code>`);
    return `${HELD}${kept.length - 1}${HELD}`;
  });
  out = escaped(out);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_whole, words: string, target: string) => {
    const typed = target.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    return `<a href="${attribute(link(typed))}">${words}</a>`;
  });
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "<em>$1</em>");
  return out.replace(new RegExp(`${HELD}(\\d+)${HELD}`, "g"), (_whole, place: string) => kept[Number(place)]);
}

/** The words alone, for an id or for the name of a column. */
function plain(text: string): string {
  return text.replace(/[*`]|\[([^\]]+)\]\([^)]*\)/g, (_whole, words?: string) => words ?? "");
}

/** A name as an id: its letters and digits in lower case, joined by dashes. */
function slug(text: string): string {
  return plain(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** A block that sits in a section as the markdown wrote it. A comment and a rule are not placed. */
function blockHtml(block: Block, indent: string, link: Link): string[] {
  switch (block.kind) {
    case "paragraph": return [`${indent}<p>${inline(block.text, link)}</p>`];
    case "code": return [`${indent}<pre${block.language ? ` data-lang="${attribute(block.language)}"` : ""}>${escapedCode(block.text)}</pre>`];
    case "items": return [`${indent}<ul>`, ...block.items.map((item) => `${indent}  <li>${inline(item, link)}</li>`), `${indent}</ul>`];
    case "numbered": return [`${indent}<ol>`, ...block.items.flatMap((item) => {
      const [only] = item;
      if (item.length === 1 && only.kind === "paragraph") return [`${indent}  <li>${inline(only.text, link)}</li>`];
      return [`${indent}  <li>`, ...item.flatMap((one) => blockHtml(one, `${indent}    `, link)), `${indent}  </li>`];
    }), `${indent}</ol>`];
    case "table": return [
      `${indent}<div class="sds-scroll"><table>`,
      `${indent}  <thead><tr>${block.head.map((cell) => `<th>${inline(cell, link)}</th>`).join("")}</tr></thead>`,
      `${indent}  <tbody>`,
      ...block.rows.map((row) => `${indent}    <tr>${row.map((cell) => `<td>${inline(cell, link)}</td>`).join("")}</tr>`),
      `${indent}  </tbody>`,
      `${indent}</table></div>`];
    case "quote": return [`${indent}<div class="sds-pull"><p>${inline(block.text, link)}</p></div>`];
    case "heading": {
      const level = Math.min(Math.max(block.level, 3), 4);
      return [`${indent}<h${level}${level === 3 ? ` id="${slug(block.text)}"` : ""}>${inline(block.text, link)}</h${level}>`];
    }
    default: return [];
  }
}

/** The text of a code block, made safe for a page. Every `&` of it is text. */
function escapedCode(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------- reading a guide

/** A guide as it is read: its block, the paragraphs under its title, and its sections. */
type Guide = { block: Record<string, unknown>; lead: Block[]; sections: { title: string; content: Block[] }[] };

/** Read a guide: its block, its title, its line of fields, its opening, then its sections. */
function readGuide(file: string): Guide {
  const text = readFileSync(file, "utf8");
  const typed = /<!--\s*spn:doc\s*(\{[\s\S]*?\})\s*-->/.exec(text);
  if (!typed) throw new Refusal(`${file} has no \`spn:doc\` block, so its page has no name`);
  let block: Record<string, unknown>;
  try { block = JSON.parse(typed[1]) as Record<string, unknown>; }
  catch (failure) { throw new Refusal(`${file}: its \`spn:doc\` block is not strict JSON: ${(failure as Error).message}`); }
  if (typeof block.title !== "string" || !block.title) throw new Refusal(`${file}: its \`spn:doc\` block has no \`title\``);

  let body = blocksOf(text);
  // The book's own navigation at the foot of a guide, with the rule above it, is no part of the page.
  const foot = body.findIndex((one) => one.kind === "remark" && one.text.includes("book-nav"));
  if (foot >= 0) body = body.slice(0, foot > 0 && body[foot - 1].kind === "rule" ? foot - 1 : foot);
  body = body.filter((one) => one.kind !== "remark");
  // The title and the line of fields are the masthead's, so they are not placed a second time.
  const title = body.findIndex((one) => one.kind === "heading" && one.level === 1);
  if (title >= 0) body.splice(title, 1);
  const fields = body.findIndex((one) => one.kind === "paragraph" && /^`(?:For|Lenses|Status): /.test(one.text));
  if (fields >= 0) body.splice(fields, 1);

  const first = body.findIndex((one) => one.kind === "heading" && one.level === 2);
  const lead = body.slice(0, first < 0 ? body.length : first);
  const sections: Guide["sections"] = [];
  for (const one of first < 0 ? [] : body.slice(first)) {
    if (one.kind === "heading" && one.level === 2) sections.push({ title: one.text, content: [] });
    else sections[sections.length - 1].content.push(one);
  }
  return { block, lead, sections };
}

// ---------------------------------------------------------------------------- stages and steps

/** The words a guide opens a step's result with. They are kept as the guide wrote them. */
const HAPPENED = "What just happened:";
/** The mark a guide may open a step's result with. The page's own label says it, so the mark is left out. */
const SEEN = /(?:\*\*What you see[:.]?\*\*:?|What you see:)\s*/;
/** A number an author typed before a step's name: `1. `, `2) `, `Step 3 — `. A step numbers itself. */
const TYPED_NUMBER = /^(?:Step\s+)?\d+\s*[.):—–-]\s+/i;
/** A heading that says it is a step, whatever its level: the word `Step`, a number and a dash. */
const STEP_NAME = /^Step\s+\d+\s*[—–-]\s+/i;
/** The name of a stage that the guide did not name: its steps are sections of the guide itself. */
const UNNAMED_STAGE = "Steps";

/** A step's name without the number typed before it. A name that is nothing but its number is kept. */
function untyped(name: string): string {
  return name.replace(TYPED_NUMBER, "").trim() || name;
}

/** A text split where it starts to say what you see, or null where it never does. */
function resultOf(text: string): { before: string; result: string } | null {
  const happened = text.indexOf(HAPPENED);
  const seen = SEEN.exec(text);
  if (seen && (happened < 0 || seen.index < happened))
    return { before: text.slice(0, seen.index).trim(), result: text.slice(seen.index + seen[0].length).trim() };
  if (happened < 0) return null;
  return { before: text.slice(0, happened).trim(), result: text.slice(happened).trim() };
}

/** What was placed, and where a step lacks one of its three parts. */
type Tally = { stages: number; steps: number; ids: Set<string>; noCommand: number[]; noResult: number[]; loose: string[] };

/** An id no other step of the page has. */
function stepId(name: string, tally: Tally): string {
  const wanted = slug(name) || "step";
  let id = wanted;
  for (let copy = 2; tally.ids.has(id); copy += 1) id = `${wanted}-${copy}`;
  tally.ids.add(id);
  return id;
}

const seeHtml = (result: string, link: Link): string =>
  `    <div class="sds-step-see"><span class="sds-label">What you see</span><p>${inline(result, link)}</p></div>`;

/** One section of the page. A stage is a section that holds steps, and it needs no class of its own. */
function sectionHtml(number: number, title: string, inner: string[]): string {
  return [`<section id="s${number}">`, `  <div class="sds-section-head"><h2>${title}</h2></div>`, ...inner, `</section>`].join("\n");
}

/** The table that makes a section a stage: it has a `Step` column and a `Runs` column. */
function stepsTable(content: Block[]): (Block & { kind: "table" }) | null {
  for (const one of content)
    if (one.kind === "table" && ["Step", "Runs"].every((name) => one.head.some((cell) => plain(cell).trim() === name))) return one;
  return null;
}

/** One row of the steps table as one step: its name, why, the command, and what you see. */
function rowStep(head: string[], row: string[], tally: Tally, link: Link): string[] {
  const cell = (name: string): string => row[head.findIndex((one) => plain(one).trim() === name)] ?? "";
  tally.steps += 1;
  const opening = /^\*\*(.+?)\*\*\s*([\s\S]*)$/.exec(cell("Step"));
  let name = opening ? opening[1] : cell("Step");
  let rest = opening ? opening[2].trim() : "";
  // Bold words that do not end the sentence are not the whole name: the sentence runs on, and all of it is the name.
  if (name.endsWith(".")) name = name.slice(0, -1);
  else if (rest) { name = `${name} ${rest}`; rest = ""; }
  name = untyped(name);
  const split = resultOf(rest);
  const why = split ? split.before : rest;
  const commands = [...cell("Runs").matchAll(/`([^`]+)`/g)].map((found) => found[1]);
  if (!commands.length) tally.noCommand.push(tally.steps);
  if (!split?.result) tally.noResult.push(tally.steps);
  return [
    `  <div class="sds-step">`,
    `    <h3 id="${stepId(name, tally)}">${inline(name, link)}</h3>`,
    ...(why ? [`    <p>${inline(why, link)}</p>`] : []),
    ...(commands.length ? [`    <pre>${escapedCode(commands.join("\n"))}</pre>`] : []),
    ...(split?.result ? [seeHtml(split.result, link)] : []),
    `  </div>`];
}

/**
 * One heading as one step: its name, then every block under it, where the markdown has it. A heading
 * under a step is a part of that step, so it is written one level below the step's own name.
 */
function headingStep(name: string, inside: Block[], tally: Tally, link: Link): string[] {
  tally.steps += 1;
  const shown = untyped(name);
  let seen = false;
  const placed = inside.flatMap((one) => {
    const split = one.kind === "paragraph" ? resultOf(one.text) : null;
    if (!split || split.before || !split.result) return blockHtml(one.kind === "heading" ? { ...one, level: 4 } : one, "    ", link);
    seen = true;
    return [seeHtml(split.result, link)];
  });
  if (!inside.some((one) => one.kind === "code")) tally.noCommand.push(tally.steps);
  if (!seen) tally.noResult.push(tally.steps);
  return [`  <div class="sds-step">`, `    <h3 id="${stepId(shown, tally)}">${inline(shown, link)}</h3>`, ...placed, `  </div>`];
}

/**
 * The sections of a guide's page. Where its steps are the rows of a table with a `Step` and a `Runs`
 * column, the sections before that table's section are what must be true first. Otherwise a section
 * is a stage, and a step is a `###` heading under it or a heading that opens with `Step N —`.
 */
function sectionsOf(guide: Guide, link: Link): { sections: string[]; tally: Tally } {
  const tally: Tally = { stages: 0, steps: 0, ids: new Set(), noCommand: [], noResult: [], loose: [] };
  const written: string[] = [];
  const add = (title: string, inner: string[]): void => { written.push(sectionHtml(written.length, title, inner)); };
  const placed = (content: Block[]): string[] => content.flatMap((one) => blockHtml(one, "  ", link));
  // A stage's name stays as the guide writes it. Only a step loses its typed number.
  const named = (title: string): string => inline(title, link);
  if (guide.lead.length) add("Overview", placed(guide.lead));

  const firstStage = guide.sections.findIndex((section) => stepsTable(section.content));
  if (firstStage >= 0) {
    const first = "Before you start";
    const before = guide.sections.slice(0, firstStage).flatMap((section) =>
      [...(section.title === first ? [] : [`  <h3>${named(section.title)}</h3>`]), ...placed(section.content)]);
    if (before.length) add(first, before);
    for (const section of guide.sections.slice(firstStage)) {
      const table = stepsTable(section.content);
      if (!table) { add(named(section.title), placed(section.content)); continue; }
      tally.stages += 1;
      const at = section.content.indexOf(table);
      add(named(section.title), [...placed(section.content.slice(0, at)),
        ...table.rows.flatMap((row) => rowStep(table.head, row, tally, link)), ...placed(section.content.slice(at + 1))]);
    }
    return { sections: written, tally };
  }

  // Sections that are steps themselves, one after another, are one stage, which the guide did not name.
  let gathered: string[] = [];
  const closeStage = (): void => {
    if (!gathered.length) return;
    tally.stages += 1;
    add(UNNAMED_STAGE, gathered);
    gathered = [];
  };
  for (const section of guide.sections) {
    if (STEP_NAME.test(plain(section.title))) { gathered.push(...headingStep(section.title, section.content, tally, link)); continue; }
    closeStage();
    const opens = section.content.flatMap((one, at) =>
      (one.kind === "heading" && (one.level === 3 || STEP_NAME.test(plain(one.text))) ? [at] : []));
    const inner = placed(section.content.slice(0, opens.length ? opens[0] : section.content.length));
    if (opens.length) tally.stages += 1;
    else if (section.content.some((one) => one.kind === "code")) tally.loose.push(section.title);
    opens.forEach((start, at) => {
      const heading = section.content[start] as Block & { kind: "heading" };
      inner.push(...headingStep(heading.text, section.content.slice(start + 1, opens[at + 1] ?? section.content.length), tally, link));
    });
    add(named(section.title), inner);
  }
  closeStage();
  return { sections: written, tally };
}

// ---------------------------------------------------------------------------- the page

/** The guide's page: the template's shell, with its head and its masthead filled, and the guide's sections. */
function guidePage(template: string, guide: Guide, sections: string[], where: { organisation: string; location: string; source: string }): string {
  const { block } = guide;
  const title = String(block.title);
  const lenses = Array.isArray(block.lenses) ? block.lenses.map(String) : [];
  // A guide page has no status, so the block of the page has no `status` field.
  const pageBlock = { id: block.id ?? slug(title), variant: "guide", title,
    ...(block.subtitle ? { subtitle: block.subtitle } : {}), lenses, summary: block.summary ?? "",
    ...(block.keywords ? { keywords: block.keywords } : {}), source: where.source };
  const page = withHead(template, { tab: title, block: pageBlock, version: newestCut(), script: PAGE_SCRIPT,
    produced: `Produced by \`docs guide\` from ${where.source}. Never edit this page: change the guide, and produce the page again.` });

  const from = page.indexOf("<section");
  const closing = "</section>";
  const to = page.lastIndexOf(closing);
  if (from < 0 || to < from) throw new Refusal("the template has no section, so the page cannot be produced from it");
  let shell = `${page.slice(0, from)}${HELD}${page.slice(to + closing.length)}`;
  shell = swap(shell, /\{\{PAGE NAME[^}]*\}\}/, escaped(title), "slot for the name in the rail");
  shell = swap(shell, /\{\{WORKSPACE\}\}/, escaped(where.organisation), "slot `{{WORKSPACE}}`");
  shell = swap(shell, /\{\{LOCATION\}\}/, escaped(where.location), "slot `{{LOCATION}}`");
  shell = swap(shell, /\{\{NAME\}\}/, escaped(title), "slot `{{NAME}}`").replace(/\{\{NAME\}\}/g, () => escaped(title));
  shell = swap(shell, /(<span class="sds-audience">)(?:<span class="sds-badge sds-lens">[^<]*<\/span>)+/,
    `<span class="sds-audience">${lenses.map((lens) => `<span class="sds-badge sds-lens">${escaped(LENS_LABEL[lens] ?? lens)}</span>`).join("")}`,
    "audience in its header");
  const subtitle = typeof block.subtitle === "string" && block.subtitle ? block.subtitle : "";
  shell = swap(shell, /[ \t]*<p class="sds-subtitle">[\s\S]*?<\/p>\n/,
    subtitle ? `  <p class="sds-subtitle">${inline(subtitle, (href) => href)}</p>\n` : "", "subtitle");
  const summary = typeof block.summary === "string" && block.summary ? block.summary : "";
  shell = swap(shell, /[ \t]*<p class="sds-standfirst">[\s\S]*?<\/p>\n/,
    summary ? `  <p class="sds-standfirst">${inline(summary, (href) => href)}</p>\n` : "", "description");
  refuseSlots(shell, TEMPLATE);
  return shell.replace(HELD, () => sections.join("\n\n"));
}

/** A list of step numbers, as a note names them. */
const numbers = (steps: number[]): string => `step${steps.length === 1 ? "" : "s"} ${steps.join(", ")}`;

/** Produce one guide's page, or with `write` false say whether the page on disk is the one produced. */
function pageOf(guideFile: string, options: { name: string | null; out: string | null; write: boolean }, workspace: string): Note[] {
  const file = resolve(guideFile);
  if (!existsSync(file)) throw new Refusal(`${file} is not there`);
  const docs = docsRootOf(slashes(file));
  if (docs === null) throw new Refusal(`${file} is in no docs tree, so its page has no repository to sit in`);
  const repository = dirname(docs);
  // `01-getting-started.md` gives `getting-started`: the file's name without its number and its extension.
  const name = options.name ?? basename(file, ".md").replace(/^\d+-/, "");
  const out = resolve(options.out ?? join(guidePagesDir(docs), `${name}${GUIDE_PAGE_SUFFIX}`));

  const guide = readGuide(file);
  const { sections, tally } = sectionsOf(guide, hrefForPage(file, out));
  if (tally.steps === 0)
    return [{ grade: "RULE", check: "guide", file, message:
      "this guide holds no step, so no page is written. A step is a row of a table with a `Step` and a `Runs` column, " +
      "a `###` heading under a `##` section, or a heading that opens with `Step`, a number and a dash. " +
      "Bring the guide to the shape of steps first (05-artifacts.md, The guide page)" }];

  const named = locationOf(file, workspace);
  const page = guidePage(pageTemplate(templatesDir(workspace), TEMPLATE), guide, sections, {
    organisation: process.env.SPN_ORG ?? "SaaS Plane",
    location: process.env.SPN_LOCATION ?? (named === "—" ? basename(repository) : named),
    source: slashes(relative(repository, file)),
  });
  const notes = place(out, page, options.write, workspace, "guide");
  if (!notes.length) console.log(`         ${tally.stages} stage(s) · ${tally.steps} step(s)`);
  const soft = (message: string): Note => ({ grade: "SOFT", check: "guide", file, message });
  if (tally.noCommand.length) notes.push(soft(`${numbers(tally.noCommand)}: no command, so the step shows none`));
  if (tally.noResult.length) notes.push(soft(`${numbers(tally.noResult)}: no text is marked as what you see, so the step has no \`What you see\``));
  if (tally.loose.length) notes.push(soft(`${tally.loose.map((title) => `\`${title}\``).join(", ")}: commands that sit under no step, so they are placed as written and are not numbered`));
  return notes;
}

function body(args: string[], workspace: string): number {
  const guides = operands(args, ["--name", "--out"]);
  const name = optionValue(args, "--name"), out = optionValue(args, "--out");
  if (!guides.length || ((name !== null || out !== null) && guides.length > 1)) {
    console.error(guides.length ? `\`--name\` and \`--out\` name one page, so they take one guide\n${USAGE}` : USAGE);
    return 2;
  }
  let failed = false;
  for (const guide of guides) {
    try {
      if (say(pageOf(guide, { name, out, write: !args.includes("--check") }, workspace), workspace)) failed = true;
    } catch (refused) {
      if (!(refused instanceof Refusal)) throw refused;
      console.error(`✗ ${refused.message}`);
      failed = true;
    }
  }
  return failed ? 1 : 0;
}

/** Run `docs guide` with its own arguments, and give back the exit code. */
export function run(args: string[]): number {
  const workspace = resolveWorkspace();
  const startedAt = performance.now();
  begin(commandFacts("spn-devex", args), workspace);
  const code = body(args, workspace);
  record({ group: "docs", action: "guide", args: argsText(args) }, performance.now() - startedAt, code);
  end(code);
  return code;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) process.exit(run(process.argv.slice(2)));
