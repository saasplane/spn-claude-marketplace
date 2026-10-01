// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The guide page — stages, and steps that number themselves · § The index of artifacts — one page that opens every other · § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// What `docs index` and `docs guide` share: each takes the shell of a template of the book, fills its
// head, and puts its own body in. A page links the newest version of the shared styles that was cut.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { bookTemplatesDir } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { INDEX_SCRIPT, OWN_COPY, PAGE_SCRIPT, STYLESHEET, cutVersions, linesFor, linksSharedStyles, newestVersion,
  stylesDir } from "../../../../../plugin-support-lib/src/lib/page-styles.ts";

/** The folder of the templates that holds the page templates. */
const PAGE_TEMPLATES = "pages";

/** A reason a command stops and writes nothing. The command prints its message and exits 1. */
export class Refusal extends Error {}

/** What a command says about one file. RULE sets the exit code to 1, and SOFT reports only. */
export type Note = { grade: "RULE" | "SOFT"; check: string; file: string; message: string };

/** Print each note in the form the other `docs` commands print a finding, and say whether one is a RULE. */
export function say(notes: Note[], workspace: string): boolean {
  for (const note of notes)
    console.log(`${note.grade === "RULE" ? "✗" : "!"} ${note.grade.padEnd(4)} ${note.check.padEnd(9)} ${relative(workspace, note.file)}\n         ${note.message}`);
  return notes.some((note) => note.grade === "RULE");
}

/** The value typed after an option, or null where the option is not there. */
export function optionValue(args: string[], option: string): string | null {
  const at = args.indexOf(option);
  return at >= 0 && at + 1 < args.length ? args[at + 1] : null;
}

/** The words of a command that are no option, and no value of an option in `valued`. */
export function operands(args: string[], valued: string[]): string[] {
  return args.filter((word, at) => !word.startsWith("--") && !(at > 0 && valued.includes(args[at - 1])));
}

/** The templates: `SPN_TEMPLATES`, else the book's templates beside the workspace. */
export function templatesDir(workspace: string): string {
  return process.env.SPN_TEMPLATES ?? bookTemplatesDir(join(workspace, "spn-foundation"));
}

/**
 * One page template, read whole. A template that links no shared stylesheet holds its own copy of the
 * styles, so it is refused: a page produced from it would link no version.
 */
export function pageTemplate(templates: string, name: string): string {
  const file = join(templates, PAGE_TEMPLATES, name);
  if (!existsSync(file)) throw new Refusal(`the template ${file} is not there. Set SPN_TEMPLATES to the folder of the book's templates`);
  const text = readFileSync(file, "utf8");
  if (!linksSharedStyles(text)) throw new Refusal(`the template ${file} cannot be used: ${OWN_COPY}`);
  return text;
}

/**
 * The newest version of the shared styles that was cut. `SPN_STYLES` names the folder that holds
 * `versions.json`; without it the folder is the plugin's own `styles/`.
 */
export function newestCut(): string {
  const styles = process.env.SPN_STYLES ?? stylesDir(fileURLToPath(import.meta.url));
  const version = styles === null ? null : newestVersion(Object.keys(cutVersions(styles)));
  if (version === null)
    throw new Refusal(`no version of the shared styles was cut${styles === null ? "" : ` in ${styles}`}, so a page has no version to link (05-artifacts.md, One stylesheet, served in versions)`);
  return version;
}

/** Text made safe for a page. An entity the author wrote, such as `&mdash;`, is kept as it is. */
export function escaped(text: string): string {
  return text.replace(/&(?![A-Za-z]+;|#\d+;|#x[0-9A-Fa-f]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text made safe for the value of an attribute. */
export function attribute(text: string): string {
  return escaped(text).replace(/"/g, "&quot;");
}

/**
 * Replace the one part of a template that `pattern` finds. A template without that part is not the
 * template this command knows, so the command stops and names the part.
 */
export function swap(text: string, pattern: RegExp, replacement: string, part: string): string {
  if (!pattern.test(text)) throw new Refusal(`the template has no ${part}, so the page cannot be produced from it`);
  return text.replace(pattern, () => replacement);
}

const literal = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** What the head of a produced page says about the page. */
export type Head = {
  /** The name on the page's tab. */
  tab: string;
  /** The page's own block. */
  block: Record<string, unknown>;
  /** One sentence: which command produced the page, and from what. */
  produced: string;
  /** The version of the shared styles the page links. */
  version: string;
  /** The script the page loads: the page script, or the index's own. */
  script: typeof PAGE_SCRIPT | typeof INDEX_SCRIPT;
};

/**
 * A template's shell with its head filled: the tab's name, the block, the line that says the page is
 * produced, and the two lines that load one version of the shared styles. The note to an author that
 * opens a template, and the footer that closes one, are left out: a reader of a page is not its author.
 */
export function withHead(template: string, head: Head): string {
  const lines = linesFor(head.version, head.script);
  let page = template.replace(/^\s*<!--(?!\s*spn:doc)[\s\S]*?-->\s*/, "");
  page = page.replace(/\n*<footer>[\s\S]*?<\/footer>\n*/, "\n\n");
  page = swap(page, /<title>[\s\S]*?<\/title>/, `<title>${escaped(head.tab)}</title>`, "`<title>`");
  page = swap(page, /<!--\s*spn:doc[\s\S]*?-->/,
    `<!-- spn:doc\n${JSON.stringify(head.block)}\n-->\n<!-- ${head.produced} -->`, "`spn:doc` block");
  page = swap(page, new RegExp(`<link\\b[^>]*\\bhref="[^"]*${literal(STYLESHEET)}"[^>]*>`), lines.stylesheet,
    `line that links \`${STYLESHEET}\``);
  page = swap(page, new RegExp(`<script\\b[^>]*\\bsrc="[^"]*${literal(head.script)}"[^>]*></script>`), lines.script,
    `line that loads \`${head.script}\``);
  return page;
}

/** Each slot, `{{…}}`, that a filled shell still holds. A produced page holds none. */
export function slotsLeft(shell: string): string[] {
  return shell.match(/\{\{[\s\S]*?\}\}/g) ?? [];
}

/** Stop where a filled shell still holds a slot, and name the slots. */
export function refuseSlots(shell: string, template: string): void {
  const left = slotsLeft(shell);
  if (left.length) throw new Refusal(`${template} holds ${left.length} slot(s) this command does not fill: ${left.join(" · ")}`);
}

/**
 * Put a produced page in its place, and print one line about it. With `write` false nothing is
 * written, and a page that is not what the command produces is one RULE note.
 */
export function place(file: string, page: string, write: boolean, workspace: string, command: string): Note[] {
  const before = existsSync(file) ? readFileSync(file, "utf8") : null;
  const shown = relative(workspace, file);
  if (before === page) { console.log(`current  ${shown}`); return []; }
  if (!write)
    return [{ grade: "RULE", check: command, file, message: before === null
      ? `no page has been produced here yet. Run \`docs ${command}\` without \`--check\``
      : `this page is not what \`docs ${command}\` produces now: its source changed, or it was edited by hand` }];
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page);
  console.log(`${before === null ? "wrote   " : "rewrote "} ${shown}`);
  return [];
}
