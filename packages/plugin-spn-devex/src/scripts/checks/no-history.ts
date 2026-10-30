#!/usr/bin/env node
// A page states what is true now, so words that tell its history are refused as they are written
// (RULE.DEVEX.WORKSPACE.247, with the book's no-legacy rule).
//
// WHAT IT READS. The text a `.md` or `.html` write adds — `content` for a `Write`, `new_string` for an
// `Edit` — under `docs/`, `refs/` or a workstream's folder. Markup is dropped first, so a class name is
// not a word on the page. A log, a register and a changelog keep history by design and are never read.

import { basename } from "node:path";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const HISTORY = /\b(formerly|renamed from|moved from|replaced by|legacy)\b/i;

/** A page under the book, a ref, a repository's docs or a workstream, and not one that keeps history. */
export function applies(path: string): boolean {
  if (!/\.(?:md|html)$/.test(path)) return false;
  if (path.includes("/registers/") || /changelog/i.test(basename(path))) return false;
  return path.includes("/docs/") || path.includes("/refs/") || path.includes("/.spndevex/workstreams/");
}

export function checkNoHistory(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const supplied = payload.tool_input ?? {};
  if (!applies(supplied.file_path ?? "")) return null;

  const text = (supplied.content ?? supplied.new_string ?? "").replace(/<[^>]+>/g, " ");
  const word = HISTORY.exec(text)?.[1];
  if (!word) return null;
  return { deny:
    `Denied: this page says "${word.toLowerCase()}". A page states what is true now; what it was lives in the ` +
    `history, and a reader who needs it runs \`git log\`. Say what is true, or delete the line ` +
    `(RULE.DEVEX.WORKSPACE.247).` };
}

if (runAlone("no-history.ts")) {
  try { emit(checkNoHistory(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
