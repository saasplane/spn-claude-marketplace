// RESTATES: nothing. This carries no rule of its own — it copies the book's templates into the
// plugin so a partner has them, and the argument for each template stays in the template.
//
// The `files`-kind restatement: the shapes every repository writes to, carried where a partner can
// reach them.
//
//     spn-devex restates files check <book>     is every copy current?  (exit 1 if not)
//     spn-devex restates files write <book>     copy the book's templates over, and remove a copy the book no longer holds
//
// A SUBJECT WITH TWO ACTIONS, EACH TAKING THE BOOK'S FOLDER. Both name it, because a `write` changes
// files in two repositories: the book's own index of its templates, and this plugin's copies.
//
// THE COPY FOLLOWS THE BOOK BOTH WAYS. A template the book deleted is a copy somebody still copies
// from, so `check` reports it as drift and `write` removes it.
//
// THE COPY IS BYTE-IDENTICAL AND THAT IS DELIBERATE. Nothing is stamped INSIDE a template, because
// these are five file types and a header in each would be four comment syntaxes and four ways to
// corrupt a file somebody copies verbatim. The stamps live in one `README.md` beside them, which
// `restates check` already knows how to read.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { type Action, REQUIRED, onePath, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { seenHash, treeHash } from "../../lib/restates.ts";
import { BOOK_PATTERNS, BOOK_SITE_PATTERNS, BOOK_TEMPLATES, PLUGIN_PATTERNS, PLUGIN_SITE_PATTERNS, PLUGIN_TEMPLATES } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";


const HERE = dirname(new URL(import.meta.url).pathname);
const PLUGIN = resolve(HERE, "..", "..", "..");
// THE COPY SITS BESIDE THE REF THAT NAMES IT. `doc-sets.md` carries the `files` citation for this
// folder, so a drift check reads one directory rather than two — the citation and the thing cited
// are siblings (RD.DEVEX.AGENT.072).
const OUT = join(PLUGIN, PLUGIN_TEMPLATES);
/** The copy's own index, which the book does not hold. */
const COPY_INDEX = "README.md";
/** The book's own generated index, beside the templates it lists. */
const BOOK_INDEX = "index.md";

/** The `spn:doc` block a page inside a docs tree opens with. */
export type DocBlock = { id: string; title: string; lenses: string[]; status: string; summary: string; keywords: string[] };

/**
 * One folder of the book that a plugin carries as a byte-identical copy.
 *
 * `from` is the folder in the book, `noun` what one of its files is called in a report, and `bookOwn`
 * the files of that folder that are the book's alone and are never copied: its generated index, and a
 * page it writes by hand about the folder. `bookDoc` is the block the book's index opens with when the
 * folder sits inside the book's docs tree, where the audit reads every page; a folder outside it has none.
 */
export type CopySet = { from: string; noun: string; bookOwn: string[]; bookDoc?: DocBlock; bookIndex: (rows: string[]) => string[]; copyIndex: (from: string, rows: string[]) => string[] };

/** A `spn:doc` block in the spelling the book's hand-written pages use: one field a line, a list on one line. */
function renderDocBlock(doc: DocBlock): string[] {
  const list = (items: string[]): string => `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;
  return [
    "<!-- spn:doc",
    "{",
    `  "id": ${JSON.stringify(doc.id)},`,
    `  "title": ${JSON.stringify(doc.title)},`,
    `  "lenses": ${list(doc.lenses)},`,
    `  "status": ${JSON.stringify(doc.status)},`,
    `  "summary": ${JSON.stringify(doc.summary)},`,
    `  "keywords": ${list(doc.keywords)}`,
    "}",
    "-->",
    "",
  ];
}

/** Every file under a folder, as `<group>/<name>`. */
function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(root, full).split("\\").join("/"));
    }
  };
  walk(root);
  return out;
}

/** Removes each folder under `root` that holds nothing, deepest first. `root` itself stays. */
function removeEmptyFolders(root: string): void {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (!statSync(full).isDirectory()) continue;
    removeEmptyFolders(full);
    if (readdirSync(full).length === 0) rmSync(full, { recursive: true });
  }
}

/** The BOOK's own index of its templates — a file, so an ordinary citation can watch it. */
function renderBookIndex(book: string, names: string[], set: CopySet): string {
  const rows = names.map((name) =>
    `| \`${name}\` | \`${seenHash(readFileSync(join(book, set.from, name), "utf8"))}\` |`);
  return [...(set.bookDoc ? renderDocBlock(set.bookDoc) : []), ...set.bookIndex(rows)].join("\n");
}

/** The words of the book's index of its templates. */
const templatesBookIndex = (rows: string[]): string[] => [
    "# The templates this book owns",
    "",
    "**Generated by `restates files write`. Do not hand-edit.** One row per template, each carrying",
    "the hash of that file's contents.",
    "",
    "**This file exists so that ADDING a template is a change somebody can see.** The plugins ship a",
    "copy of this folder for partners, who never get the book. A citation per template would report an",
    "edit to any of them and say nothing at all about a new one — a template nobody cited has nothing",
    "to compare against, and *the book grew a shape a partner does not have* is the failure the copy",
    "exists to prevent. The plugin restates **this index**, so a template added, removed, renamed or",
    "edited all move the same one hash.",
    "",
    "| Template | Hash |",
    "| --- | --- |",
    ...rows,
    "",
  ];

/**
 * The index the drift check reads — ONE citation, naming the FOLDER (`RD.DEVEX.AGENT.072`).
 *
 * A STAMP PER FILE MISSES THE THING MOST WORTH CATCHING — a file nobody cited has nothing to
 * compare against, and *the book grew a shape a partner does not have* is precisely what this copy
 * exists to prevent.
 */
function renderIndex(book: string, names: string[], set: CopySet): string {
  // A TEMPLATE IS COPIED, NEVER REWRITTEN, so the citation kind is `files` and not `docs`
  // (RD.DEVEX.AGENT.072). A `docs` entry means the agent restates the source in its own words; a `files`
  // entry means the copy is byte-identical, which is the whole value of a template — what a
  // partner copies from is what the book ships.
  const files = [{ path: `spn-foundation/${set.from}`, seen: treeHash(join(book, set.from)) }];
  // A folder may hold its files in groups, as the templates do, or flat, as the specs of the patterns do.
  const groups = new Map<string, string[]>();
  for (const name of names) {
    const at = name.indexOf("/");
    const group = at < 0 ? "" : name.slice(0, at), file = at < 0 ? name : name.slice(at + 1);
    groups.set(group, [...(groups.get(group) ?? []), file]);
  }
  const rows = [...groups].map(([group, held]) => group === ""
    ? held.map((f) => `| [\`${f}\`](${f}) |`).join("\n")
    : `| \`${group}/\` | ${held.map((f) => `[\`${f}\`](${group}/${f})`).join(" · ")} |`);
  return [
    "<!-- spn:restates",
    JSON.stringify({ files }, null, 2),
    "-->",
    ...set.copyIndex(set.from, rows),
  ].join("\n");
}

/** The words of the plugin's index of its copy of the templates. */
const templatesCopyIndex = (from: string, rows: string[]): string[] => [
    "# The templates, as a partner has them",
    "",
    "**The book owns every file here and this folder is a copy.** They are byte-identical to",
    `\`spn-foundation/${from}/\`, and when the two`,
    "disagree the book wins. `restates files write` writes them and `restates check` reports a copy",
    "that has fallen behind, so a builder's edit reaches every partner with the next plugin release",
    "rather than being discovered by somebody's first session going wrong.",
    "",
    "**The stamp above names the folder, not each file** (`RD.DEVEX.AGENT.072`). One citation per template",
    "would report every edit and miss every addition — a template nobody cited has nothing to compare",
    "against, and *the book grew a shape a partner does not have* is what this copy exists to prevent.",
    "A folder hash covers added, removed, renamed and edited at once.",
    "",
    "**They are here because the plugins ship without the book beside them.** A partner installs the",
    "marketplace and the libraries and never gets `docs/`. The moment that costs most is the first one:",
    "a new repository whose own documentation is the thing they are about to write, with nothing on",
    "disk to copy from.",
    "",
    "**Copy a template rather than writing a page from memory.** Each carries the section order, the",
    "card shape and the furniture every check reads, and a page assembled by hand is one that passes a",
    "review and fails a gate.",
    "",
    "| Group | Templates |",
    "| --- | --- |",
    ...rows,
    "",
    "**Never edit a file here.** It is an output. The rule lives in the book's copy, a builder changes",
    "it there, and the export carries it.",
    "",
  ];

/** The book's page templates, carried by this plugin. */
export const TEMPLATES_SET: CopySet = { from: BOOK_TEMPLATES, noun: "template", bookOwn: [BOOK_INDEX], bookIndex: templatesBookIndex, copyIndex: templatesCopyIndex };

/** The book's own index of a folder of specs: the same words for each set, but for its title. */
const specsBookIndex = (title: string, readers: string) => (rows: string[]): string[] => [
  `# ${title}`,
  "",
  `\`For: ${readers}\` · \`Status: 🔮 PLANNING\``,
  "",
  "**Generated by `restates files write`. Do not hand-edit.** One row per spec, each carrying the hash",
  "of that file's contents. The apps plugin ships a copy of this folder for partners, who never get the",
  "book, and it restates this index, so a spec added, removed, renamed or edited moves the same one hash.",
  "",
  "| Spec | Hash |",
  "| --- | --- |",
  ...rows,
  "",
];

/**
 * The spn-surface plugin's index of its copy of a folder of specs. `what` names what one spec is a skeleton of,
 * and `starts` what a builder starts from it.
 */
const specsCopyIndex = (title: string, what: string, starts: string) => (from: string, rows: string[]): string[] => [
  `# ${title}`,
  "",
  "**The book owns every file here and this folder is a copy.** They are byte-identical to",
  `\`spn-foundation/${from}/\`, and when the two disagree the book wins.`,
  "`restates files write` writes them and `restates check` reports a copy that has fallen behind.",
  "",
  `**Each file is a skeleton spec of ${what}, and ${starts} starts from it.** The \`design\` skill`,
  "names the pattern it follows, and `spn-devex docs figure draw <spec>` draws its spec. The stamp",
  "above names the folder and not each file, so a spec the book adds is seen as well as one it edits.",
  "",
  "| Spec |",
  "| --- |",
  ...rows,
  "",
  "**Never edit a file here.** It is an output. A builder changes the spec in the book, and the export",
  "carries it.",
  "",
];

/**
 * The specs of the surface's app patterns, carried by the spn-surface plugin. The book writes a page about the
 * folder by hand, its `README.md`, and that page stays the book's: the copy's `README.md` is the index.
 */
export const PATTERNS_SET: CopySet = {
  from: BOOK_PATTERNS, noun: "spec", bookOwn: [BOOK_INDEX, COPY_INDEX],
  bookDoc: {
    id: "surface-standards-patterns-specs-index",
    title: "The specs of the app patterns this book owns",
    lenses: ["WEB_DEV", "PRODUCT", "QA", "UX"],
    status: "PLANNING",
    summary: "The generated index of the app-pattern specs, one row for each spec with the hash of its contents.",
    keywords: ["app pattern", "spec", "index", "hash", "restates files"],
  },
  bookIndex: specsBookIndex("The specs of the app patterns this book owns", "Web developer · Product manager · Quality engineer · UX designer"),
  copyIndex: specsCopyIndex("The specs of the app patterns, as a partner has them", "one app pattern", "a screen of an app"),
};

/**
 * The specs of the surface's site patterns, carried by the spn-surface plugin beside the app patterns' own. As
 * there, the book's `README.md` about the folder stays the book's, and the copy's `README.md` is the index.
 */
export const SITE_PATTERNS_SET: CopySet = {
  from: BOOK_SITE_PATTERNS, noun: "spec", bookOwn: [BOOK_INDEX, COPY_INDEX],
  bookDoc: {
    id: "surface-standards-patterns-site-specs-index",
    title: "The specs of the site patterns this book owns",
    lenses: ["WEB_DEV", "MARKETING", "QA", "UX"],
    status: "PLANNING",
    summary: "The generated index of the site-pattern specs, one row for each spec with the hash of its contents.",
    keywords: ["site pattern", "spec", "index", "hash", "restates files"],
  },
  bookIndex: specsBookIndex("The specs of the site patterns this book owns", "Web developer · Product marketer · Quality engineer · UX designer"),
  copyIndex: specsCopyIndex("The specs of the site patterns, as a partner has them", "one site pattern", "a section of a site's page"),
};

export const describe = "the `files`-kind restatement — copy the book's templates into this plugin's refs, and the specs of the app and site patterns into the spn-surface plugin's";

/**
 * The export, or its check, over one book and one copy folder.
 *
 * `out` is the folder the copies sit in, and `say` receives each line of the report. The command
 * passes this plugin's own templates folder; a case passes folders of its own.
 */
export function exportTemplates(book: string, out: string, write: boolean, say: (line: string) => void = console.log, set: CopySet = TEMPLATES_SET): number {
  if (!book || !existsSync(join(book, set.from))) {
    // A PARTNER RUNS THIS AND NOTHING HAPPENS, which is correct. They hold the plugin and not the
    // book, so there is nothing to export from — the copies they already have are the answer.
    say("no foundation book here — nothing to export, and the shipped copies stand");
    return 0;
  }

  const index = join(out, COPY_INDEX);
  const names = filesUnder(join(book, set.from)).filter((name) => !set.bookOwn.includes(name));
  // The book's index is written FIRST, because it is one of the files the copy carries.
  const bookIndex = renderBookIndex(book, names, set);
  const bookIndexPath = join(book, set.from, BOOK_INDEX);
  const bookIndexStale = !existsSync(bookIndexPath) || readFileSync(bookIndexPath, "utf8") !== bookIndex;
  if (bookIndexStale && write) writeFileSync(bookIndexPath, bookIndex);
  const stale: string[] = [];
  for (const name of names) {
    const from = join(book, set.from, name);
    const to = join(out, name);
    const source = readFileSync(from);
    const current = existsSync(to) ? readFileSync(to) : null;
    if (current !== null && current.equals(source)) continue;
    stale.push(name);
    if (write) {
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, source);
    }
  }

  // A COPY THE BOOK NO LONGER HOLDS. Every file in the copy folder is the book's, except the copy's
  // own index, so a file the book does not name is one the book deleted or renamed.
  const held = new Set(names);
  const extra = filesUnder(out).filter((name) => name !== COPY_INDEX && !held.has(name));
  if (write) {
    for (const name of extra) rmSync(join(out, name), { force: true });
    if (extra.length > 0) removeEmptyFolders(out);
  }

  const copyIndex = renderIndex(book, names, set);
  const indexStale = !existsSync(index) || readFileSync(index, "utf8") !== copyIndex;
  if (indexStale && write) {
    mkdirSync(out, { recursive: true });
    writeFileSync(index, copyIndex);
  }

  if (write) {
    say(`${names.length} ${set.noun}(s) exported · ${stale.length} rewritten · ${extra.length} removed · index ${indexStale ? "rewritten" : "current"}`);
    return 0;
  }

  if (!stale.length && !extra.length && !indexStale && !bookIndexStale) {
    say(`${names.length} ${set.noun}(s) · every copy current`);
    return 0;
  }
  say(`${stale.length} ${set.noun}(s) behind the book${indexStale ? ", and the index too" : ""}:`);
  for (const name of stale) say(`  ${name}`);
  if (extra.length > 0) {
    say(`${extra.length} cop${extra.length === 1 ? "y" : "ies"} the book no longer holds:`);
    for (const name of extra) say(`  ${name}`);
  }
  say("  run `spn-devex restates files write <book>`");
  return 1;
}

/** The surface plugin's `src/`, in the plugin that stands beside this one in the marketplace. */
const SURFACE_SRC = resolve(PLUGIN, "..", "..", "plugin-spn-surface", "src");

/** Each folder of specs, with the surface plugin's copy of it. */
const SPEC_SETS: Array<[CopySet, string]> = [
  [PATTERNS_SET, join(SURFACE_SRC, PLUGIN_PATTERNS)],
  [SITE_PATTERNS_SET, join(SURFACE_SRC, PLUGIN_SITE_PATTERNS)],
];

/**
 * Both actions are one comparison of the book's folders with the plugins' copies; `write` is the one that
 * changes files. Each folder is compared in turn, and the command fails if any is behind.
 */
const run = (args: string[], write: boolean): number => {
  const book = onePath(scopeOf(readWords(args).paths, REQUIRED));
  let worst = exportTemplates(book, OUT, write);
  // The specs are copied only where the book holds them and the surface plugin stands beside this one.
  for (const [set, out] of SPEC_SETS) {
    if (!existsSync(join(book, set.from)) || !existsSync(dirname(dirname(out)))) continue;
    worst = Math.max(worst, exportTemplates(book, out, write, console.log, set));
  }
  return worst;
};

export const actions: Record<string, Action> = {
  check: {
    describe: "report each copy that is behind the book or that the book no longer holds, and write nothing",
    usage: "<book>",
    run: (args) => run(args, false),
  },
  write: {
    describe: "copy the book's templates into this plugin, and remove each copy the book no longer holds",
    usage: "<book>",
    run: (args) => run(args, true),
  },
};
