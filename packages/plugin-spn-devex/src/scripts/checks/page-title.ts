#!/usr/bin/env node
// A subsection heading is a topic name: at most five words and no comma. The sentence moves to the lead
// line under it. A card keeps its question as its heading, so a heading inside `div.sds-open` is left alone.
//
// WHAT IT READS. The `<h3>` and `<h4>` of an `.html` write, and the `###` and `####` lines of a `.md` write,
// under `docs/`, `refs/` or a workstream's folder.

import { readFileSync } from "node:fs";
import { DEVEX_WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const MOST_WORDS = 5;
const SHOWN = 4;

export function applies(path: string): boolean {
  if (!/\.(?:md|html)$/.test(path)) return false;
  return path.includes("/docs/") || path.includes("/refs/") || path.includes(`/${DEVEX_WORKSTREAMS}/`);
}

const plain = (html: string): string => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** The h3 and h4 headings of a page, in order, leaving out those inside a card (`div.sds-open`). */
function headings(path: string, text: string): string[] {
  if (path.endsWith(".md")) return [...text.matchAll(/^#{3,4}\s+(.+?)\s*$/gm)].map((one) => one[1]);
  const found: string[] = [];
  const open: boolean[] = [];
  for (const token of text.matchAll(/<div\b([^>]*)>|<\/div>|<(h[34])\b[^>]*>([\s\S]*?)<\/\2>/g)) {
    if (token[0] === "</div>") open.pop();
    else if (token[2]) { if (!open.some(Boolean)) found.push(plain(token[3])); }
    else open.push(/\bclass="(?:[^"]*\s)?sds-open(?:\s[^"]*)?"/.test(token[1]));
  }
  return found;
}

/** THE ONE READING OF RULE 451, shared by the Write/Edit hook and the page read from disk: the headings of `text` that run past five words or hold a comma. */
export function longHeadings(path: string, text: string): string[] {
  if (!applies(path)) return [];
  return headings(path, text)
    .filter((title) => title.split(/\s+/).filter(Boolean).length > MOST_WORDS || title.includes(","));
}

/** The refusal's words for the headings found, as the hook prints them. */
export function titleRefusal(long: string[]): string {
  return `Denied: a subsection heading is a topic name of at most ${MOST_WORDS} words with no comma.\n\n` +
    `${long.slice(0, SHOWN).map((title) => `  • "${title}"`).join("\n")}` +
    (long.length > SHOWN ? `\n  • and ${long.length - SHOWN} more` : "") +
    `\n\nKeep a topic name, and move the sentence to the lead line under it. A card keeps its question as its heading.`;
}

/** Rule 451 on a page saved on disk: one line for each heading too long, or none where the file is not read or not there. */
export function titleFindingsOnDisk(path: string): string[] {
  let text = "";
  try { text = readFileSync(path, "utf8"); } catch { return []; }
  // A SLOT IS NOT YET A HEADING: a page fresh from its template still holds `{{…}}`, and the slot check names it.
  return longHeadings(path, text).filter((title) => !title.includes("{{")).map((title) => `heading "${title}" is past ${MOST_WORDS} words or holds a comma (RULE.DEVEX.WORKSPACE.451) · keep a topic name, and move the sentence to the lead line under it`);
}

export function checkPageTitle(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const supplied = payload.tool_input ?? {};
  const long = longHeadings(supplied.file_path ?? "", supplied.content ?? supplied.new_string ?? "");
  return long.length ? { deny: titleRefusal(long) } : null;
}

if (runAlone("page-title.ts")) {
  try { emit(checkPageTitle(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
