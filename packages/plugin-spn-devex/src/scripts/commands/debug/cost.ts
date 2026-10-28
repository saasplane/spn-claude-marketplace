// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
//     spn-devex debug cost show <target> [--json]
//
// What a target cost, read from the telemetry alone (`lib/cost.ts`): `all` prints a line for each workstream, a
// workstream one for each arc, an arc one for each row and order, a window the window and each child. The target
// chooses the breakdown, so there is no option to group, to bound a time or to choose money.

import { resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { telemetryFolder } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { type CostRow, readCost } from "../../lib/cost.ts";
import { MODEL_PRICES } from "../../lib/model-prices.ts";

export const describe = "what a target cost, read from the telemetry: replies, tokens, the model's time, the model and the money";

/** A count as a person reads it: millions and thousands with their letter. */
function shown(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

/** The model's time as minutes and seconds. */
function clock(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, "0")}s` : `${seconds}s`;
}

const dollars = (money: number | null): string => (money === null ? "unknown" : `$${money.toFixed(2)}`);

function print(rows: CostRow[]): void {
  const width = Math.max(8, ...rows.map((row) => row.key.length)) + 2;
  console.log("Line".padEnd(width) + "Replies".padStart(8) + "Fresh".padStart(9) + "Cache read".padStart(12) + "Cache write".padStart(13) +
    "Output".padStart(9) + "Model time".padStart(12) + "  " + "Model".padEnd(24) + "Money".padStart(9));
  for (const row of rows)
    console.log(row.key.padEnd(width) + String(row.replies).padStart(8) + shown(row.input).padStart(9) + shown(row.cacheRead).padStart(12) +
      shown(row.cacheWrite).padStart(13) + shown(row.output).padStart(9) + clock(row.modelMs).padStart(12) + "  " +
      (row.models.join(", ") || "-").padEnd(24) + dollars(row.money).padStart(9));
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length !== 1) throw new UsageFault("takes one target: `all`, a workstream, `<workstream>/N<nnn>`, or `window/<session>` or `window/this`.");
  const target = words.paths[0];
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const { rows, earliest } = readCost(root, target);
  if (words.given("json")) {
    console.log(JSON.stringify({ target, earliest, pricesAsOf: MODEL_PRICES.asOf, estimate: true, rows }, null, 2));
    return 0;
  }
  if (!rows.length) {
    console.log(`no usage for \`${target}\` in ${telemetryFolder(root)}${earliest ? `, which reaches back to ${earliest}` : " — it holds none; `debug switch on telemetry` records from the next reply"}`);
    return 0;
  }
  print(rows);
  console.log(`\nTelemetry reaches back to ${earliest}. Money is an estimate: prices as of ${MODEL_PRICES.asOf}, cache writes at the 5-minute rate, and "unknown" for a model the table lacks.`);
  return 0;
}

export const actions: Record<string, Action> = {
  show: { describe: "what a target cost, a line for each part its breakdown names", usage: "<target> [--json]", run: show },
};
