// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § After `How` comes a section of its own, Plan
//           docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § Open and backlog workstreams follow the standard as it moves
// The chapters are the source of truth; a rule change is edited there first, then here, in the same change.
//
// Migration 011: an approach page reads Why, What, How, Plan, Open, Deferred (RULE.DEVEX.WORKSPACE.487), and Plan is a section of its
// own after How. On each open and backlog approach page, an `h3` Cycles at the end of How (its order line, its table and its progress
// block) moves out into `<section id="arcs">` under the `h2` Plan, right after How. A page already in the new shape is left alone, and
// `closed/` is never read: a closed workstream stays as it closed.

import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { holdsCyclesSubsection, hasPlan, withPlanSection } from "../../commands/docs/cycles.ts";
import { type Migration } from "../migration.ts";
import { isFile } from "../payload.ts";
import { HELD_STATES, workstreamsOf } from "../workstream.ts";
import { APPROACH_PAGE, DEVEX_WORKSTREAMS } from "../../../../../plugin-support-lib/src/lib/docs-tree.ts";

/** The approach page of each open and backlog workstream. */
const pagesOf = (root: string): string[] => workstreamsOf(root, HELD_STATES).map((ws) => join(ws, APPROACH_PAGE)).filter(isFile);

/** Whether a page still ends How in an older Cycles subsection and has no Plan section. */
const behind = (text: string): boolean => holdsCyclesSubsection(text) && !hasPlan(text);

const named = (root: string, page: string): string => relative(join(root, DEVEX_WORKSTREAMS), page).split("\\").join("/");

/** Each page whose arcs table is still How's Cycles subsection. */
export function pagesWithoutPlan(root: string): string[] {
  return pagesOf(root).filter((page) => behind(readFileSync(page, "utf8")))
    .map((page) => `${named(root, page)}: the arcs table is still How's Cycles subsection → a Plan section after How`);
}

/** Moves the Cycles subsection of each page the check names into a Plan section, and says which pages it wrote. */
export function movePlans(root: string): string[] {
  const wrote: string[] = [];
  for (const page of pagesOf(root)) {
    const text = readFileSync(page, "utf8");
    if (!behind(text)) continue;
    const moved = withPlanSection(text, () => "");
    if (moved === null || moved === text) continue;
    writeFileSync(page, moved, "utf8");
    wrote.push(`${named(root, page)}: moved Cycles out of How into the Plan section`);
  }
  return wrote;
}

export const migration011: Migration = {
  id: "011",
  version: "0.105.0",
  changed: "The approach page reads Why, What, How, Plan, Open, Deferred: the arcs table, with its order line and progress block, moves out of " +
    "How's Cycles subsection into a Plan section of its own after How.",
  check: pagesWithoutPlan,
  script: movePlans,
};
