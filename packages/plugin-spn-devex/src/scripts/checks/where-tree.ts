#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The approach document — a workstream's, never a repository's
// A PREVIEW'S TWO STRUCTURAL RULES THAT NO HOOK READ: `Where it lands` is one folder tree for each repository
// (RULE.DEVEX.WORKSPACE.238), and each layer of `Proposed` carries a `data-layer` mark (RULE.DEVEX.WORKSPACE.233); a part carries no For, Layer or Reads line. The page is read as it is saved, at every Stop and in `docs check`; a page that is not a
// preview, or has no such section yet, has nothing to find.

import { readFileSync } from "node:fs";

const LAYERS = ["server", "web", "surface", "plugins", "estate"];
const TREE_CHARACTERS = /[├└│]/;
/** A repository is named by one word: letters, digits, dots, dashes and slashes, with no space. */
const REPOSITORY_NAME = /^[\w.@-]+(?:\/[\w.-]+)*\/?$/;

/** The part of a page under its `h2` named `name`, to the next `h2`; null where the page has none. */
function part(text: string, name: string): string | null {
  const heading = new RegExp(`<h2\\b[^>]*>\\s*${name}\\s*</h2>`, "i").exec(text);
  if (!heading) return null;
  const rest = text.slice(heading.index + heading[0].length);
  const next = rest.search(/<h2\b/i);
  return next < 0 ? rest : rest.slice(0, next);
}

/** Rule 238: `Where it lands` holds one `<pre>` folder tree, drawn with tree characters, for each repository it names. */
export function whereItLandsFindings(text: string): string[] {
  const where = part(text, "Where it lands");
  if (where === null) return [];
  // ONLY A TREE IS COUNTED AS A TREE, AND ONLY A REPOSITORY'S NAME AS A REPOSITORY: a numbered step paragraph (`<p><strong>1 · Build the
  // bundle</strong>`) is a step in the section's prose, never a repository, so its bold text must be one repository-shaped word.
  const trees = [...where.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi)].filter((one) => /\bdata-lang="tree"/.test(one[1]) || TREE_CHARACTERS.test(one[2])).length;
  const named = [...where.matchAll(/<p>\s*<strong>\s*\d+\s*(?:&middot;|·)\s*([^<]*)<\/strong>/gi)].filter((one) => REPOSITORY_NAME.test(one[1].trim())).length;
  const why = "(05-artifacts.md § The approach document; RULE.DEVEX.WORKSPACE.238) · draw each repository as one `<pre>` tree, a folder or file on each line with `├──` and `└──`, and its note in one column on the right";
  if (!trees) return [`Where it lands holds no folder tree — it is one tree for each repository, and never a table of paths ${why}`];
  if (named > trees) return [`Where it lands names ${named} repositories and draws ${trees} tree${trees === 1 ? "" : "s"} — one tree for each repository ${why}`];
  return [];
}

/** Rule 233: each layer section of `Proposed` carries a `data-layer` mark. A part holds no For, Layer or Reads line: the layer is the heading it sits under. */
export function proposedFindings(text: string): string[] {
  const proposed = part(text, "Proposed");
  if (proposed === null) return [];
  const out: string[] = [];
  const why = "(05-artifacts.md § The approach document; RULE.DEVEX.WORKSPACE.233)";
  for (const heading of proposed.matchAll(/<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi)) {
    const name = heading[2].replace(/<[^>]+>/g, "").trim();
    if (/^shape$/i.test(name)) continue;
    const mark = /\bdata-layer="([^"]*)"/.exec(heading[1])?.[1];
    if (!mark || !LAYERS.includes(mark))
      out.push(`Proposed's layer "${name}" carries no \`data-layer\` mark from ${LAYERS.join(" · ")} ${why} · write \`<h3 data-layer="…">\``);
  }
  return out;
}

/** Rules 238 and 233 on a preview's text. */
export function whereTreeFindings(text: string): string[] {
  // A PREVIEW THAT STILL HOLDS A SLOT IS NOT WRITTEN YET: the slot check names it, and its sections are the template's.
  if (/\{\{[^}]*\}\}/.test(text)) return [];
  return [...proposedFindings(text), ...whereItLandsFindings(text)];
}

/** Rules 238 and 233 on a preview saved on disk; none where the file is not there. */
export function whereTreeOnDisk(path: string): string[] {
  try { return whereTreeFindings(readFileSync(path, "utf8")); } catch { return []; }
}
