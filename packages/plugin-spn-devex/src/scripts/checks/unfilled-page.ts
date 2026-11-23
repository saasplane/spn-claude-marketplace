// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The templates — the pages, and the two seat files behind them
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// A page shown to the developer holds no placeholder (RULE.DEVEX.WORKSPACE.560). A reply that links a `file:///` page which still holds a
// `{{…}}` slot is refused: the agent is sent back to fill it, or to say the page is a template. A page under a `templates/` folder is a
// template and is not read. The slots are found by the doc check's own function, `slotsLeft`, so the hook and the page check never disagree.
//
//   called by: events/stop.ts, on the turn's last reply with its fenced blocks taken out

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isTemplatePath, slotsLeft } from "./doc-check.ts";

/** A finding about the reply, in the shape every Stop check returns. */
export type UnfilledFinding = { check: string; message: string };

const ADDRESS = /file:\/\/\/[^\s)\]>"'`]+?\.html?\b/gi;

/** One finding naming the slots of each linked page that still holds any, or none. */
export function checkUnfilledPage(prose: string): UnfilledFinding[] {
  const out: string[] = [];
  for (const address of new Set(prose.match(ADDRESS) ?? [])) {
    let path: string;
    try { path = fileURLToPath(address); } catch { continue; }
    if (isTemplatePath(path)) continue;
    let text: string;
    try { text = readFileSync(path, "utf8"); } catch { continue; }
    const slots = slotsLeft(text);
    if (slots.length) out.push(`${address}: ${slots.slice(0, 8).join(", ")}${slots.length > 8 ? ` and ${slots.length - 8} more` : ""}`);
  }
  if (!out.length) return [];
  return [{ check: "unfilled-page", message:
    `this page still has slots to fill: ${out.join("; ")}; fill them, or say it is a template (RULE.DEVEX.WORKSPACE.560).` }];
}
