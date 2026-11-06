#!/usr/bin/env node
// The SQL a design draws follows the book's grammar before the developer reads it. A workstream's
// `notes/N*/preview.html` and the files under its `samples/` are read for TABLE, SCHEMA, ENUM · INDEX · JSON
// and AUDIT TAIL, each named in its note. The rules are the shared ones (plugin-support-lib sql-grammar.ts);
// this half supplies the page text, and reads only what the write supplies, never a page already written.

import { DEVEX_WORKSTREAMS } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { sqlFindings } from "../../../../plugin-support-lib/src/lib/sql-grammar.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const SHOWN = 4;

/** A workstream's arc preview, or a file in its arc's `samples/` folder. */
export function applies(path: string): boolean {
  const p = path.split("\\").join("/");
  if (!p.includes(`/${DEVEX_WORKSTREAMS}/`)) return false;
  return /\/notes\/N\d+\/preview\.html$/.test(p) || /\/notes\/[^/]+\/samples\/[^/]+$/.test(p);
}

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&rsquo;": "'" };

/** The text a reader sees: tags dropped and the common entities restored, so SQL in a `<pre>` reads as SQL. */
const readable = (path: string, text: string): string =>
  path.endsWith(".html") ? text.replace(/<[^>]+>/g, "").replace(/&(?:lt|gt|amp|quot|#39|rsquo);/g, (e) => ENTITIES[e]) : text;

/** The verdict for a write to a preview or a sample, from the text the write supplies. */
export function checkSqlSample(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit") return null;
  const supplied = payload.tool_input ?? {};
  const path = supplied.file_path ?? "";
  if (!applies(path)) return null;

  const found = sqlFindings(readable(path, supplied.content ?? supplied.new_string ?? ""), { module: null });
  if (!found.length) return null;
  // A NOTE, NEVER A DENY: a stack standard reaches the agent as words, and no stack standard is a hard check.
  return { note:
    `The SQL in this ${path.endsWith("preview.html") ? "preview" : "sample"} departs from the SQL naming chapter. ` +
    `${found.length} finding(s):\n\n` +
    `${found.slice(0, SHOWN).map((item) => `  [${item.rule}] ${item.message}`).join("\n")}` +
    (found.length > SHOWN ? `\n  and ${found.length - SHOWN} more` : "") +
    `\n\nThe grammar is the book's (rules RULE.SUPPORT.APPS.251 · RULE.SUPPORT.APPS.254). Fix the names where they are drawn.` };
}

if (runAlone("sql-sample.ts")) {
  try { emit(checkSqlSample(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
