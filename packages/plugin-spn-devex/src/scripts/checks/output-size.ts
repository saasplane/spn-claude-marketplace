#!/usr/bin/env node
// A command whose output passed 10 KB is answered with the narrowed form to use next time. A call that has
// already run cannot be refused, so this is a note for the agent alone, after the first overrun.

import type { Payload, Verdict } from "../lib/payload.ts";

export const OUTPUT_LIMIT = 10 * 1024;

/** The bytes a Bash call returned: its standard output and its standard error. */
export function outputBytes(response: unknown): number {
  if (typeof response === "string") return Buffer.byteLength(response, "utf8");
  if (response && typeof response === "object") {
    const { stdout, stderr } = response as { stdout?: unknown; stderr?: unknown };
    return [stdout, stderr].reduce<number>((sum, part) => sum + (typeof part === "string" ? Buffer.byteLength(part, "utf8") : 0), 0);
  }
  return 0;
}

export function checkOutputSize(payload: Payload): Verdict {
  if (payload.tool_name !== "Bash" || payload.hook_event_name === "PostToolUseFailure") return null;
  const bytes = outputBytes(payload.tool_response);
  if (bytes <= OUTPUT_LIMIT) return null;
  return { note: `That command printed ${Math.round(bytes / 1024)} KB, past the 10 KB line. Next time run it again with its output written to a file (\`<command> > <file>\`, in the scratchpad), then Grep the file or Read the part you need with \`offset\` and \`limit\`.` };
}
