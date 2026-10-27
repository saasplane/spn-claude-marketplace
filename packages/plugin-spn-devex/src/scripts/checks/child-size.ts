#!/usr/bin/env node
// A child past the stop line of its order is refused its next tool call, except the one that saves its report.
// Silent in the main window and in a child that runs no order.
// The size is read from the last finished turn, so the refusal lands one call after the line.

import { existsSync, openSync, readFileSync, readSync, closeSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { turnsIn } from "../lib/usage.ts";
import { bashWrites } from "./doc-check.ts";

/** An order's path as a brief names it: `notes/N<nnn>/orders/<n>-<subject>.md`, and never its `.report.md`. */
const ORDER_PATH = /[^\s'"`()<>]*notes\/N\d+[a-z]?\/orders\/[^\s'"`()<>]+\.md/g;
/** The head of a transcript is where the child's brief is, and the brief names the order. */
const HEAD_BYTES = 64 * 1024;
const WRITERS = new Set(["Write", "Edit", "MultiEdit"]);

/** The line an order sets, from its `Stop at …` sentence: tokens of context and turns, either of which may be absent. */
export function stopLine(order: string): { context: number | null; turns: number | null } | null {
  const line = order.split("\n").find((one) => /\bstop at\b/i.test(one));
  if (!line) return null;
  const sentence = line.slice(line.search(/\bstop at\b/i));
  const context = /(\d[\d,.]*)\s*k\b[^.\n]{0,24}\bcontext/i.exec(sentence)?.[1];
  const turns = /(\d[\d,]*)\s+turns\b/i.exec(sentence)?.[1];
  const result = { context: context ? Math.round(Number(context.replace(/,/g, "")) * 1000) : null, turns: turns ? Number(turns.replace(/,/g, "")) : null };
  return result.context !== null || result.turns !== null ? result : null;
}

/** The child's own transcript: the path the event hands, else where Claude Code keeps a child's file beside the window's. */
export function childTranscript(payload: Payload & { agent_transcript_path?: string; transcript_path?: string }): string | null {
  const candidates = [payload.agent_transcript_path];
  if (payload.transcript_path && payload.session_id && payload.agent_id)
    candidates.push(join(dirname(payload.transcript_path), payload.session_id, "subagents", `agent-${payload.agent_id}.jsonl`));
  return candidates.find((path): path is string => Boolean(path) && existsSync(path!)) ?? null;
}

function head(path: string): string {
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(HEAD_BYTES);
    return buffer.toString("utf8", 0, readSync(fd, buffer, 0, HEAD_BYTES, 0));
  } finally { closeSync(fd); }
}

/** The order the child was given, read from its brief at the head of its transcript: the path and the text. */
function orderOf(transcript: string, cwd: string): { path: string; text: string } | null {
  const root = workspaceRoot(cwd);
  for (const found of head(transcript).matchAll(ORDER_PATH)) {
    const named = found[0].replace(/\\\//g, "/");
    if (named.endsWith(".report.md")) continue;
    for (const path of [resolve(cwd, named), ...(root ? [resolve(root, named)] : [])]) {
      if (existsSync(path)) return { path, text: readFileSync(path, "utf8") };
    }
  }
  return null;
}

/** Whether this call saves the report: a write or edit of it, by a file tool or by a shell write. */
function savesReport(payload: Payload, report: string): boolean {
  const input = payload.tool_input ?? {};
  const cwd = payload.cwd ?? process.cwd();
  if (payload.tool_name && WRITERS.has(payload.tool_name)) return Boolean(input.file_path) && resolve(cwd, input.file_path!) === report;
  if (payload.tool_name === "Bash" && input.command) {
    try { const writes = bashWrites(input.command); return writes.length > 0 && writes.every(([path]) => resolve(cwd, path) === report); } catch { return false; }
  }
  return false;
}

export function checkChildSize(payload: Payload): Verdict {
  if (!payload.agent_id) return null;
  const transcript = childTranscript(payload);
  if (!transcript) return null;
  const cwd = payload.cwd ?? process.cwd();
  const order = orderOf(transcript, cwd);
  if (!order) return null;
  const line = stopLine(order.text);
  if (!line) return null;
  const turns = turnsIn(readFileSync(transcript, "utf8"));
  const last = turns.at(-1);
  const held = last ? last.input + last.cache_read + last.cache_write : 0;
  const over = line.context !== null && held >= line.context
    ? `its context holds ${Math.round(held / 1000)}k tokens, past the order's ${Math.round(line.context / 1000)}k`
    : line.turns !== null && turns.length >= line.turns ? `it has taken ${turns.length} turns, past the order's ${line.turns}` : null;
  if (!over) return null;
  const report = order.path.replace(/\.md$/, ".report.md");
  if (savesReport(payload, report)) return null;
  return { deny: `This agent is past the stop line of its order ${order.path.split("/").pop()}: ${over}. Do no more work. Save the report the order owes at ${report} with one Write, saying where you stopped, then hand back.` };
}
