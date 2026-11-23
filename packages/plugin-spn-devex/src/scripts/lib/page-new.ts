// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-pages.md § The templates — the pages, and the two seat files behind them · § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// `spn-devex docs page new <kind> <path>`: a hand page started from its kind's template. It fills what the tool can
// know, refuses a path that exists, and says which placeholders are still the author's, each with the line of the
// template's comment that explains it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLUGIN_TEMPLATES, workstreamDirOf } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { INDEX_SCRIPT, PAGE_SCRIPT, STYLESHEET, anyNameOf, integrityFor, linesFor, nameIn, stylesDir } from "../../../../plugin-support-lib/src/lib/page-styles.ts";
import { KEPT_COMMENT } from "../checks/doc-check.ts";
import { newestCut, Refusal, escaped } from "../commands/docs/_pages.ts";
import { now, titleCase, workstreamName } from "./workstream.ts";

/** Each kind of page `page new` starts: where its template sits under the plugin's copies, and the script it loads. */
export const PAGE_KINDS: Record<string, { template: string; script: string }> = {
  approach: { template: "workstream/approach-template.html", script: PAGE_SCRIPT },
  arc: { template: "workstream/arc-template.html", script: PAGE_SCRIPT },
  index: { template: "docs/pages/index-template.html", script: INDEX_SCRIPT },
  "surface-page": { template: "surface/surface-page-template.html", script: PAGE_SCRIPT },
  construct: { template: "docs/pages/construct-template.html", script: PAGE_SCRIPT },
  overview: { template: "docs/pages/overview-template.html", script: PAGE_SCRIPT },
  guide: { template: "docs/pages/guide-template.html", script: PAGE_SCRIPT },
  hub: { template: "docs/pages/hub-template.html", script: PAGE_SCRIPT },
  report: { template: "docs/pages/report-template.html", script: PAGE_SCRIPT },
  blocks: { template: "docs/pages/blocks-template.html", script: PAGE_SCRIPT },
  page: { template: "docs/pages/page-template.html", script: PAGE_SCRIPT },
};

/** The plugin's copy of the templates, found up from this file in source or in a bundle. */
function templatesDir(): string {
  for (let dir = dirname(fileURLToPath(import.meta.url)); dirname(dir) !== dir; dir = dirname(dir)) {
    const found = join(dir, PLUGIN_TEMPLATES);
    if (existsSync(found)) return found;
  }
  throw new Refusal("finds no templates among the plugin's references");
}

/** What a page of a workstream is told: its folder, its numbered name and its arc. */
export type Where = { workstream?: string; arc?: string; name?: string };

/** One slot, with the line of the template's comment that explains it (the first line that names it, one that opens with it first). */
function explanations(template: string): Map<string, string> {
  const found = new Map<string, { line: string; opens: boolean }>();
  for (const comment of template.matchAll(/<!--(?!\s*spn:)([\s\S]*?)-->/g))
    for (const raw of comment[1].split("\n")) {
      const line = raw.trim().replace(/\s+/g, " ");
      for (const slot of new Set(line.match(/\{\{[^{}\n]*\}\}/g) ?? [])) {
        const opens = line.startsWith(slot);
        const had = found.get(slot);
        if (!had || (opens && !had.opens)) found.set(slot, { line: line.length > 240 ? `${line.slice(0, 237)}...` : line, opens });
      }
    }
  return new Map([...found].map(([slot, value]) => [slot, value.line]));
}

/** The workspace's name, read from the approach page's eyebrow where the page sits in a workstream; the organisation's otherwise. */
function workspaceName(folder: string | null): string {
  if (folder)
    for (const file of ["approach.html", ...(existsSync(folder) ? [] : [])]) {
      try {
        const found = /<span class="sds-line1">(?:<a\b[^>]*>)?([^<&]*?)(?:<\/a>)?\s*(?:&nbsp;\|&nbsp;|&middot;)/.exec(readFileSync(join(folder, file), "utf8"))?.[1];
        if (found?.trim()) return found.trim();
      } catch { /* no approach page yet */ }
    }
  return "SaaS Plane";
}

/** The page's text for a kind: its slots filled where the tool knows them, the template's own comments left out, the stylesheet and script at the newest cut. */
export function pageFromKind(kind: string, path: string, where: Where): { text: string; left: Array<{ slot: string; count: number; why: string }> } {
  const entry = PAGE_KINDS[kind];
  if (!entry) throw new Refusal(`\`${kind}\` is no kind of page. The kinds: ${Object.keys(PAGE_KINDS).join(" · ")}`);
  const source = readFileSync(join(templatesDir(), entry.template), "utf8");
  const why = explanations(source);
  // Comments: the template's notes to its author are left out; a page keeps only what every page keeps.
  let text = source.replace(/<!--([\s\S]*?)-->/g, (whole, body: string) => (KEPT_COMMENT.test(body.replace(/\s+/g, " ").trim()) && !/^\s*RESTATES:/.test(body) ? whole : "")).replace(/^\s*\n/, "");
  const found = workstreamDirOf(path);
  const folder = where.workstream ?? found?.folder ?? null;
  const base = folder ? folder.split("/").pop()! : null;
  const arc = where.arc ?? /\/notes\/(N\d+|ideate|follow-ups)\//.exec(path.split("\\").join("/"))?.[1];
  const named = base ? workstreamName(base) : null;
  const today = now().slice(0, 10);
  const slots: Array<[string, string]> = [];
  if (named && base) {
    const slug = base.replace(/^\d+-/, "");
    if (arc) text = text.replace("ws-{{NNN}}-{{slug}}-{{preview-slug}}", `ws-${base}-${arc}`);
    slots.push(["{{NNN}}", named.number], ["{{slug}}", slug], ["{{WORKSTREAM}}", escaped(named.title)]);
    if (kind === "approach") slots.push(["{{NAME}}", escaped(where.name ?? named.title)]);
  }
  if (arc) slots.push(["N{{nnn}}", arc], ["{{arc}}", arc]);
  if (where.name && kind !== "approach") slots.push(["{{NAME}}", escaped(where.name)]);
  if (kind === "surface-page" && where.name) slots.push(["{{page}}", titleCase(where.name).toLowerCase().replace(/\s+/g, "-")]);
  slots.push(["{{WORKSPACE}}", escaped(workspaceName(folder))], ["{{date}}", today], ["{{TODAY}}", today]);
  for (const [slot, value] of slots) text = text.split(slot).join(value);
  // The two lines that load the newest cut of the shared files, with their hashes.
  const version = newestCut();
  const styles = process.env.SPN_STYLES ?? stylesDir(fileURLToPath(import.meta.url));
  if (styles === null) throw new Refusal("no `styles/` folder was found, so a page cannot link the shared files");
  const hashes = integrityFor(styles, version, [nameIn(version, STYLESHEET), nameIn(version, entry.script)]);
  const lines = linesFor(version, entry.script, hashes);
  text = text.replace(new RegExp(`<link\\b[^>]*\\bhref="[^"]*${anyNameOf(STYLESHEET)}"[^>]*>`), () => lines.stylesheet);
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- built from this script's own constants
  text = text.replace(new RegExp(`<script\\b[^>]*\\bsrc="[^"]*${anyNameOf(entry.script)}"[^>]*></script>`), () => lines.script);
  const counted = new Map<string, number>();
  for (const slot of text.replace(/<!--(?!\s*spn:doc\b)[\s\S]*?-->/g, " ").match(/\{\{[^{}\n]*\}\}/g) ?? []) counted.set(slot, (counted.get(slot) ?? 0) + 1);
  const left = [...counted].map(([slot, count]) => ({ slot, count, why: why.get(slot) ?? "the template's comment does not explain it: read the section it stands in" }));
  return { text, left };
}

/** `docs page new`: write the page and say what is still the author's. Refuses a path that exists. */
export function writeNewPage(kind: string, path: string, where: Where): string[] {
  if (existsSync(path)) throw new Refusal(`${path} exists: \`page new\` never overwrites a page`);
  const { text, left } = pageFromKind(kind, path, where);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  const out = [`wrote ${path} from the ${kind} template`];
  if (left.length) {
    out.push(`${left.length} placeholder${left.length === 1 ? "" : "s"} still to fill (\`docs page check\` names them until none is left):`);
    for (const one of left) out.push(`  ${one.slot}${one.count > 1 ? ` x${one.count}` : ""}\n      ${one.why}`);
  } else out.push("no placeholder left");
  return out;
}
