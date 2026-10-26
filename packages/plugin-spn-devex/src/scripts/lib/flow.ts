// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § A flow file orders a flow's pages
// The chapter is the source of truth. A rule change is edited there first, then here, in the same change.
//
// The flow file reader: `<flow>.flow.json` draws nothing, and is read against the specs it names (RD.DEVEX.WORKSPACE.230).
// Reading a spec from disk is the caller's, so this module is given a function that returns one, or null.

import { SKEL_TASK_STATES } from "./draw.ts";

/** Where a move leads when the flow is done. */
export const FLOW_END = "end";

const FLOW_FIELDS: Record<string, string[]> = {
  file: ["flow", "pages"],
  page: ["page", "spec", "moves"],
  move: ["on", "to", "state"],
};

type Holder = Record<string, unknown>;
const holder = (value: unknown): value is Holder => value !== null && typeof value === "object" && !Array.isArray(value);
const words = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** The states a spec draws as views of their own: each view's `state`, where it has one. */
function statesDrawn(spec: unknown): Set<string> {
  const views = holder(spec) && Array.isArray(spec.views) ? spec.views : [];
  return new Set(views.filter(holder).map((view) => view.state).filter(words));
}

/**
 * The findings of one flow file, read against its specs. `specOf` returns the spec a page's `spec` names, null
 * where no such file is, or a string saying why the file could not be read. A clean file returns no finding.
 */
export function readFlow(flow: unknown, specOf: (spec: string) => unknown | null): string[] {
  const findings: string[] = [];
  const known = (value: Holder, kind: string, where: string) => {
    for (const key of Object.keys(value)) if (!FLOW_FIELDS[kind].includes(key)) findings.push(`\`${key}\` is no field of ${where}`);
  };
  if (!holder(flow)) return ["a flow file is one object, with `flow` and `pages`"];
  known(flow, "file", "a flow file");
  if (!words(flow.flow)) findings.push("a flow file names its flow in `flow`, the name of its flow pattern where it follows one");
  const pages = Array.isArray(flow.pages) ? flow.pages.filter(holder) : [];
  if (!pages.length) return [...findings, "a flow file's `pages` lists the pages in the order a person meets them, and this one lists none"];

  // EACH PAGE IS A WORD THE FILE IS UNIQUE BY, and its spec is a skeleton that is there.
  const drawn = new Map<string, Set<string>>();
  for (const page of pages) {
    known(page, "page", "a page");
    if (!words(page.page)) { findings.push("a page names itself in `page`, a word the file is unique by"); continue; }
    if (drawn.has(page.page)) { findings.push(`two pages are \`${page.page}\`, and a flow file is unique by its pages`); continue; }
    if (page.page === FLOW_END) findings.push(`a page is \`${FLOW_END}\`, the word a move uses where the flow is done; name the page otherwise`);
    if (!words(page.spec)) { findings.push(`the page \`${page.page}\` names no \`spec\`, the skeleton that draws it`); drawn.set(page.page, new Set()); continue; }
    const spec = specOf(page.spec);
    if (spec === null) findings.push(`the page \`${page.page}\`'s spec \`${page.spec}\` is not there`);
    else if (typeof spec === "string") findings.push(`the page \`${page.page}\`'s spec \`${page.spec}\` is ${spec}`);
    else if (!holder(spec) || String(spec.kind ?? "").toLowerCase() !== "skeleton") findings.push(`the page \`${page.page}\`'s spec \`${page.spec}\` is no skeleton; a page of a flow is drawn by a skeleton`);
    drawn.set(page.page, statesDrawn(spec));
  }

  // A MOVE NAMES WHAT A PERSON DOES AND WHERE IT LEADS, and the state it lands on is a view of that page.
  const reached = new Set<string>();
  for (const page of pages) {
    if (!words(page.page)) continue;
    for (const move of Array.isArray(page.moves) ? page.moves : []) {
      if (!holder(move)) { findings.push(`a move of \`${page.page}\` is no object; a move holds \`on\`, \`to\` and, where it lands on one, \`state\``); continue; }
      known(move, "move", `a move of \`${page.page}\``);
      const on = words(move.on) ? move.on : "?";
      if (!words(move.on)) findings.push(`a move of \`${page.page}\` names no \`on\`, the words of the action or the event`);
      if (!words(move.to)) { findings.push(`the move \`${on}\` of \`${page.page}\` names no \`to\`; it leads to a page of the file, or to \`${FLOW_END}\``); continue; }
      if (move.to === FLOW_END) {
        if (move.state !== undefined) findings.push(`the move \`${on}\` of \`${page.page}\` leads to \`${FLOW_END}\` and names a \`state\`; the end of a flow is no view`);
        continue;
      }
      if (!drawn.has(move.to)) { findings.push(`the move \`${on}\` of \`${page.page}\` leads to \`${move.to}\`, which is no page of the file`); continue; }
      if (move.to !== page.page) reached.add(move.to);
      if (move.state === undefined) continue;
      if (!SKEL_TASK_STATES.includes(String(move.state)))
        findings.push(`the move \`${on}\` of \`${page.page}\` lands on the state \`${String(move.state)}\`, and a state is one of \`DSTaskStateType\`: ${SKEL_TASK_STATES.join(" · ")}`);
      else if (!drawn.get(move.to)!.has(String(move.state)))
        findings.push(`the move \`${on}\` of \`${page.page}\` lands on \`${move.to}\` in the state \`${move.state}\`, and \`${move.to}\`'s spec draws no view in that state`);
    }
  }

  // EVERY PAGE BUT THE FIRST IS REACHED BY A MOVE from another page; one no move reaches is a page no person meets.
  for (const page of pages.slice(1)) if (words(page.page) && !reached.has(page.page))
    findings.push(`no move of another page leads to \`${page.page}\`; every page but the first is reached by a move`);
  return findings;
}
