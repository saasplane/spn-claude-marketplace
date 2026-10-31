#!/usr/bin/env node
// A `Read` with no range of a file over 20 KB passes with a one-line note naming its size and the ranged form.
// The file's size is known before the call, so nothing is read.

import { statSync } from "node:fs";
import { resolve } from "node:path";
import type { Payload, Verdict } from "../lib/payload.ts";

export const READ_LIMIT = 20 * 1024;
/** Files a `Read` shows as a picture or by page, which a line range does not shorten. */
const NOT_LINES = /\.(?:png|jpe?g|gif|webp|svg|pdf|ipynb)$/i;

export function checkReadSize(payload: Payload): Verdict {
  if (payload.tool_name !== "Read") return null;
  const input = payload.tool_input as { file_path?: string; offset?: number; limit?: number; pages?: string } | undefined;
  if (!input?.file_path || NOT_LINES.test(input.file_path)) return null;
  if (input.offset !== undefined || input.limit !== undefined || input.pages !== undefined) return null;
  let size = 0;
  try { size = statSync(resolve(payload.cwd ?? process.cwd(), input.file_path)).size; } catch { return null; }
  if (size <= READ_LIMIT) return null;
  return { note: `${input.file_path} is ${Math.round(size / 1024)} KB, over the 20 KB a whole read may take. Search it first, then Read it with \`offset\` and \`limit\` for the lines wanted.` };
}
