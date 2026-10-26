// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § The commands · § Orders name what they need by id, and a workflow runs the ready rows
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream rows show <workstream>[/<arc>] [--ready] [--parallel] [--tree] [--json]
//
// `--ready` keeps the rows whose blockers have all resolved; `--parallel` keeps, of those, the ones
// whose `touches` do not overlap; `--tree` draws each row under its parent.

import { basename } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { arcIdsOf, parallelRows, readArc, readQuestions, readyRows, stateOfRow } from "../../lib/workstream.ts";
import { type ArcData, type ArcRow } from "../../lib/workstream-schema.ts";
import { arcNamed, workstreamNamed } from "./_shared.ts";

export const describe = "the rows of a workstream's arcs: every one, the ready ones, or those that can run side by side";

type Listed = ArcRow & { arc: string; derived: string };

function show(args: string[]): number {
  const words = readWords(args, { ready: FLAG, parallel: FLAG, tree: FLAG, json: FLAG });
  const [target, ...more] = words.paths;
  if (more.length) throw new UsageFault("takes one workstream or arc.");
  if (!target) throw new UsageFault("needs a workstream, or an arc as `<workstream>/N<nnn>`.");
  const { ws, arcs } = /(?:^|\/)N\d+[a-z]?$/.test(target)
    ? (() => { const named = arcNamed(target); return { ws: named.ws, arcs: [named.arc] }; })()
    : (() => { const ws = workstreamNamed(target); return { ws, arcs: arcIdsOf(ws) }; })();
  const questions = readQuestions(ws);
  const data = arcs.map((arc) => readArc(ws, arc)).filter((one): one is ArcData => one !== null);
  let rows: Listed[] = [];
  for (const arc of data) {
    const picked = words.given("ready") || words.given("parallel") ? readyRows(ws, arc, questions) : arc.rows;
    rows.push(...picked.map((row) => ({ ...row, arc: arc.arc, derived: stateOfRow(arc.rows, row) })));
  }
  if (words.given("parallel")) rows = parallelRows(rows);
  if (words.given("json")) { console.log(JSON.stringify(rows, null, 2)); return 0; }
  if (!rows.length) { console.log(`${basename(ws)}: no row${words.given("ready") || words.given("parallel") ? " is ready" : ""}`); return 0; }
  const depth = (row: Listed): number => {
    let level = 0;
    for (let parent = row.parent; parent && parent !== row.arc && level < 9; level += 1)
      parent = rows.find((one) => one.arc === row.arc && one.id === parent)?.parent ?? "";
    return level;
  };
  for (const row of rows) {
    const indent = words.given("tree") ? "  ".repeat(depth(row)) : "";
    const touches = row.touches?.length ? `  [${row.touches.join(", ")}]` : "";
    const waits = row.blockedBy?.length ? `  waits on ${row.blockedBy.join(", ")}` : "";
    console.log(`${row.arc} ${indent}${row.id.padEnd(5)} ${row.derived.padEnd(8)} ${row.title}${touches}${waits}`);
  }
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "print the rows of a workstream or an arc: --ready, --parallel, --tree; with --json, as data",
          usage: "<workstream>[/<arc>] [--ready] [--parallel] [--tree] [--json]", run: show },
};
