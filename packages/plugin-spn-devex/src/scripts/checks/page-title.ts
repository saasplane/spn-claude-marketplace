#!/usr/bin/env node
// A subsection heading is a topic name: at most five words and no comma. The sentence moves to the lead
// line under it. A card keeps its question as its heading, so a heading inside `div.sds-open` is left alone.
//
// WHAT IT READS. The `<h3>` and `<h4>` of an `.html` write, and the `###` and `####` lines of a `.md` write,
// under `docs/`, `refs/` or a workstream's folder.

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

export function checkPageTitle(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const supplied = payload.tool_input ?? {};
  const path = supplied.file_path ?? "";
  if (!applies(path)) return null;

  const long = headings(path, supplied.content ?? supplied.new_string ?? "")
    .filter((title) => title.split(/\s+/).filter(Boolean).length > MOST_WORDS || title.includes(","));
  if (!long.length) return null;
  return { deny:
    `Denied: a subsection heading is a topic name of at most ${MOST_WORDS} words with no comma.\n\n` +
    `${long.slice(0, SHOWN).map((title) => `  • "${title}"`).join("\n")}` +
    (long.length > SHOWN ? `\n  • and ${long.length - SHOWN} more` : "") +
    `\n\nKeep a topic name, and move the sentence to the lead line under it. A card keeps its question as its heading.` };
}

if (runAlone("page-title.ts")) {
  try { emit(checkPageTitle(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
