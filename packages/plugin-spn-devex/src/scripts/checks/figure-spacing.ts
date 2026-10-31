#!/usr/bin/env node
// A drawing below the figure spacing contract is refused as the page is written.
//
// WHAT IT READS. Each `<svg class="sds-drawing">` a `.html` or `.md` write carries, measured with the
// same `checkFigures` that `docs figure` runs, so the write and the audit give one answer.

import { checkFigures } from "../lib/figures.ts";
import { emit, readPayload, runAlone, type Payload, type Verdict } from "../lib/payload.ts";

const DRAWING = /<svg\b[^>]*\bclass="(?:[^"]*\s)?sds-drawing(?:\s[^"]*)?"[\s\S]*?<\/svg>/g;
const SHOWN = 4;

export function checkFigureSpacing(payload: Payload): Verdict {
  const tool = payload.tool_name ?? "";
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") return null;
  const supplied = payload.tool_input ?? {};
  if (!/\.(?:md|html)$/.test(supplied.file_path ?? "")) return null;

  const drawings = [...(supplied.content ?? supplied.new_string ?? "").matchAll(DRAWING)].map((one) => one[0]);
  const found = drawings.flatMap((svg, index) => checkFigures(svg).map((one) => `drawing ${index + 1}: ${one.message}`));
  if (!found.length) return null;
  return { deny:
    `Denied: a drawing in this write is below the spacing contract.\n\n` +
    `${found.slice(0, SHOWN).map((one) => `  • ${one}`).join("\n")}` +
    (found.length > SHOWN ? `\n  • and ${found.length - SHOWN} more` : "") +
    `\n\nLeave the clearance the figure contract sets, then write the page again.` };
}

if (runAlone("figure-spacing.ts")) {
  try { emit(checkFigureSpacing(readPayload())); } catch { /* a guard never takes the chain down */ }
  process.exit(0);
}
