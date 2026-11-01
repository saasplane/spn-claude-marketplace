#!/usr/bin/env node
// RESTATES: spn-foundation RULE.DEVEX.WORKSPACE.239 — a decision that sets a shape is put to the developer before it
// is built. An estate declaration is such a decision. The chapter is the source of truth; a rule change is edited
// there first, then here.
//
// Refuses a `Write` or `Edit` to an estate declaration (`spestate.json`, `spinfrapkg.json`) or a file under a
// `blueprints/` folder unless an ANSWERED card of an open workstream names the change: the package folder the file
// sits in, or the file's own name where it sits in none. A card that is still open, withdrawn or about something else
// does not name it.
//
// A REFUSAL, BECAUSE A DECLARATION BUILT BEFORE THE DEVELOPER SAID YES IS A SHAPE NOBODY CHOSE. Its fast path is one
// regular expression over the path, so an ordinary edit pays that and stops: no file is read until the path is one
// of these.
//
//   called by: events/pretooluse.ts, on a Write or Edit call

import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { workstreamsDir } from "../../../../plugin-support-lib/src/lib/docs-tree.ts";
import { emit, readPayload, runAlone, workspaceRoot, type Payload, type Verdict } from "../lib/payload.ts";
import { readQuestions } from "../lib/workstream.ts";

/** The files a change to which is a decision about the estate's shape. */
const GUARDED = /(?:^|\/)(?:spestate\.json|spinfrapkg\.json)$|(?:^|\/)blueprints\/[^/]+/;

/** Whether a path could be an estate declaration or blueprint input: one pattern, so every other path pays that and stops. */
export function applies(path: string): boolean {
  return GUARDED.test(path.split("\\").join("/"));
}

/** What an answered card must name for this file: the package folder it sits in, else its own name. */
export function nameOf(path: string): string {
  const parts = path.split("\\").join("/").split("/");
  const folder = parts.find((part) => /^infra-[a-z0-9-]+$/.test(part));
  return folder ?? basename(path);
}

/** Whether an answered card of any open workstream names the thing. */
function answeredCardNames(root: string, name: string): boolean {
  const base = workstreamsDir(root, "open");
  if (!existsSync(base)) return false;
  for (const entry of readdirSync(base)) {
    for (const card of readQuestions(join(base, entry))) {
      if (card.state !== "answered") continue;
      if (JSON.stringify([card.title, card.card, card.answer]).includes(name)) return true;
    }
  }
  return false;
}

/** The refusal for a write to a path, or null. */
export function refusal(path: string, cwd: string): string | null {
  if (!applies(path)) return null;
  const root = workspaceRoot(cwd);
  if (!root) return null;
  const name = nameOf(path);
  if (answeredCardNames(root, name)) return null;
  return `\`${basename(path)}\` declares the estate's shape, and no answered card names ${name}. ` +
    `Put the change to the developer first: \`spn-devex workstream question raise\` a card that names ${name}, and build after its answer ` +
    `(RULE.DEVEX.WORKSPACE.239).`;
}

export function checkEstateCardFirst(payload: Payload): Verdict {
  if (payload.tool_name !== "Write" && payload.tool_name !== "Edit") return null;
  const path = payload.tool_input?.file_path;
  if (!path || !applies(path)) return null;
  const why = refusal(path, payload.cwd ?? process.cwd());
  return why ? { deny: `Denied: ${why}` } : null;
}

if (runAlone("estate-card-first.ts")) {
  try { emit(checkEstateCardFirst(readPayload())); } catch { /* never take the chain down */ }
  process.exit(0);
}
