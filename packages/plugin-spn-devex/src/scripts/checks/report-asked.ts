#!/usr/bin/env node
// A report is written when somebody asks for one (RULE.DEVEX.WORKSPACE.212).
//
// WHAT IT READS. A write under `docs/artifacts/reports/`, and the user prompts of the window's transcript
// (the payload's `transcript_path`), newest first. A prompt that says "report" is the ask. Tool results
// and assistant text are not prompts. A window with no transcript to read is not a finding.

import { readFileSync } from "node:fs";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const REPORTS = "/docs/artifacts/reports/";
const ASK = /\breports?\b/i;

/** What a person typed in one transcript line, or null where the line is not a user prompt. */
function promptOf(line: string): string | null {
  try {
    const row = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
    if (row.type !== "user") return null;
    const content = row.message?.content;
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return null;
    return content.map((part: { type?: string; text?: string }) => (part.type === "text" ? part.text ?? "" : "")).join(" ");
  } catch { return null; }
}

export function checkReportAsked(payload: Payload & { transcript_path?: string }): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  if (!(payload.tool_input?.file_path ?? "").includes(REPORTS)) return null;
  if (!payload.transcript_path) return null;

  let lines: string[];
  try { lines = readFileSync(payload.transcript_path, "utf8").split("\n"); } catch { return null; }
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const prompt = promptOf(lines[index]);
    if (prompt !== null && ASK.test(prompt)) return null;
  }
  return { deny:
    `Denied: no prompt in this window asks for a report. Write one only when somebody asks ` +
    `(RULE.DEVEX.WORKSPACE.212).` };
}

if (runAlone("report-asked.ts")) {
  try { emit(checkReportAsked(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
