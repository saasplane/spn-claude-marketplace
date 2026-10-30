// `lib/model-prices.ts` — the price table `debug cost show` reads (RULE.DEVEX.AGENT.082): dollars per million tokens,
// a base id matched through its date or context suffix, and null for a model the table lacks.
import { MODEL_PRICES, priceOf } from "../../../../src/scripts/lib/model-prices.ts";

let total = 0, failed = 0;
const ok = (label, condition, detail = "") => {
  total += 1;
  if (condition) { console.log(`  PASS  ${label}`); return; }
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};
const million = { input: 1e6, cacheWrite: 0, cacheRead: 0, output: 0 };
const only = (field) => ({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0, [field]: 1e6 });

console.log("=== the table, row for row");
ok("it is dated 2026-10-06", MODEL_PRICES.asOf === "2026-10-06");
const TABLE = {
  "claude-fable-5-1": [10, 12.5, 0.25, 50], "claude-fable-5": [10, 12.5, 1, 50],
  "claude-opus-5-5": [4, 5, 0.2, 20],
  "claude-opus-5": [5, 6.25, 0.5, 25], "claude-opus-4-8": [5, 6.25, 0.5, 25], "claude-opus-4-7": [5, 6.25, 0.5, 25], "claude-opus-4-6": [5, 6.25, 0.5, 25],
  "claude-sonnet-5-5": [2, 2.5, 0.2, 10], "claude-sonnet-5": [2, 2.5, 0.2, 10], "claude-sonnet-4-6": [3, 3.75, 0.3, 15],
  "claude-haiku-5-5": [0.1, 0.125, 0.01, 0.5], "claude-haiku-4-5": [1, 1.25, 0.1, 5],
};
for (const [model, [input, cacheWrite, cacheRead, output]] of Object.entries(TABLE))
  ok(`${model}: ${input} in, ${cacheWrite} cache write, ${cacheRead} cache read, ${output} out per million`,
    priceOf(model, only("input")) === input && priceOf(model, only("cacheWrite")) === cacheWrite
      && priceOf(model, only("cacheRead")) === cacheRead && priceOf(model, only("output")) === output,
    JSON.stringify([priceOf(model, only("input")), priceOf(model, only("cacheWrite")), priceOf(model, only("cacheRead")), priceOf(model, only("output"))]));
ok("the table holds those twelve models and no other", Object.keys(MODEL_PRICES.models).length === 12);

console.log("\n=== matching and the unknown");
ok("a date suffix matches its base id", priceOf("claude-opus-4-6-20260101", million) === 5);
ok("a context suffix matches its base id", priceOf("claude-opus-4-6[1m]", million) === 5);
ok("a date and a context suffix together match", priceOf("claude-sonnet-4-6-20260101[1m]", million) === 3);
ok("fable 5.1 is not read as fable 5", priceOf("claude-fable-5-1", only("cacheRead")) === 0.25 && priceOf("claude-fable-5", only("cacheRead")) === 1);
ok("a model the table lacks has no price, never a guess", priceOf("claude-opus-9", million) === null && priceOf("gpt-x", million) === null);
ok("no model has no price", priceOf(null, million) === null && priceOf(undefined, million) === null);
ok("the counts are added: one million of each on opus 4.6 is $36.75",
  Math.abs(priceOf("claude-opus-4-6", { input: 1e6, cacheWrite: 1e6, cacheRead: 1e6, output: 1e6 }) - 36.75) < 1e-9);
ok("no tokens cost nothing", priceOf("claude-opus-4-6", { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }) === 0);

console.log(failed ? `\n  ${failed} of ${total} FAILED — model prices` : `\n  all ${total} passed — model prices`);
process.exit(failed ? 1 : 0);
