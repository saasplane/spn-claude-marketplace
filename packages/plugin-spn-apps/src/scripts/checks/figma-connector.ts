#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/02-support/03-surface/11-delivery-library/02-figma/02-managed.md § How the connector's work is carried out (the table of facts). The chapter is the source of truth; a change is made there first, then here.
//
// Reads a `use_figma` script before the connector runs it. It refuses only what the connector does
// not support or what throws there, and only where the text shows it: comment and string bodies are
// blanked first. It notes, and lets the call go, what the text cannot settle. It reads no file, calls
// no network and runs no command.
//
//   hook :  figma-connector.ts --stdin        (PreToolUse JSON on stdin)

import type { Payload, Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { emit, payload, runAlone } from "../../../../plugin-support-lib/src/lib/payload.ts";
import { mask } from "../lib/source.ts";

/** The tool this check looks at: the Figma connector's script runner, as the workspace names it. */
export const FIGMA_TOOL = "mcp__figma__use_figma";

/** What a `use_figma` call carries. Every field is read defensively: the call is another process's input. */
export type FigmaInput = { code?: unknown; description?: unknown; skillNames?: unknown };

/** An API the connector does not support, and what to do instead, in the book's words. */
const UNSUPPORTED: { name: string; instead: string }[] = [
  { name: "saveVersionHistoryAsync",
    instead: "a person saves a named version in Figma before the connector's first change in a file, so ask the developer for it" },
  { name: "loadAllPagesAsync", instead: "work on one page at a time" },
  { name: "setPluginData", instead: "keep your notes outside the file" },
  { name: "createImageAsync",
    instead: "build the drawing from layers, and make an icon an instance of the icon unit" },
];

const CURRENT_PAGE_ASSIGNMENT = /\bfigma\s*\??\.\s*currentPage\s*=(?![=>])/;
const NOTIFY_CALL = /\bfigma\s*\??\.\s*notify\s*\(/;
const CLOSE_CALL = /\bfigma\s*\??\.\s*closePlugin\s*\(/;
const PAGE_SWITCH = /\bsetCurrentPageAsync\s*\(/g;

const unsupportedCall = (name: string): RegExp => new RegExp(`\\??\\.\\s*${name}\\b`);

/** Every refusal the script's text shows, one sentence each. `masked` has comment and string bodies blanked. */
export function refusals(masked: string): string[] {
  const found: string[] = [];
  for (const api of UNSUPPORTED)
    if (unsupportedCall(api.name).test(masked))
      found.push(`The script uses ${api.name}, which the connector does not support: ${api.instead}.`);
  if (CURRENT_PAGE_ASSIGNMENT.test(masked))
    found.push("The script assigns figma.currentPage, which throws in the connector: move with await figma.setCurrentPageAsync(page) instead.");
  if (NOTIFY_CALL.test(masked))
    found.push("The script calls figma.notify, which throws in the connector: return what you need to see, because only the return value comes back.");
  if (CLOSE_CALL.test(masked))
    found.push("The script calls figma.closePlugin, which has no place in a connector script: a script is plain JavaScript with top-level await and return, so remove the call.");
  return found;
}

/** Every note the call shows. A note never stops the call. */
export function notes(masked: string, input: FigmaInput): string[] {
  const found: string[] = [];
  const switches = (masked.match(PAGE_SWITCH) ?? []).length;
  if (switches > 1)
    found.push(`The script calls setCurrentPageAsync ${switches} times: a script switches page once, because each switch loads the file again, and work over several pages is one call for each page (two branches that each switch once are fine).`);
  const names = input.skillNames;
  if (typeof names !== "string" || names.trim() === "")
    found.push('The call passes no skillNames: pass skillNames "resource:figma-use" on every call, and add resource:figma-generate-library on a call that changes a set, a version, a variable or a style.');
  return found;
}

/**
 * The verdict for one `use_figma` input, or null when nothing is to be said.
 *
 * A script that changes nodes under a `description` naming no file item gets no note: what counts as
 * naming an item cannot be told from the inputs without guessing.
 */
export function validate(input: FigmaInput): Verdict {
  const code = input.code;
  if (typeof code !== "string") return null;       // no text to read: the connector says what is wrong
  const masked = mask(code);
  const refused = refusals(masked);
  if (refused.length) {
    const headline = `Denied — ${refused[0]}`;
    return { deny: [headline, ...refused.slice(1)].join("\n"), headline };
  }
  const noted = notes(masked, input);
  return noted.length ? { note: noted.join("\n") } : null;
}

/** The verdict for one event: the connector's tool is read, every other tool is left alone. */
export function run(event: Payload): Verdict {
  if (event.tool_name !== FIGMA_TOOL) return null;
  return validate((event.tool_input ?? {}) as FigmaInput);
}

export const CHECK = { name: "figma-connector", run };

if (runAlone("figma-connector.ts")) {
  const event = (await payload()) as Payload | null;
  emit(event ? run(event) : null);
  process.exit(0);
}
