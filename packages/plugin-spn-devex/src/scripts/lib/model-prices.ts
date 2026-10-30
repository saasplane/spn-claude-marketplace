// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/01-agent/01-agent.md § The cost of a window is
// read from telemetry, never from a transcript (RULE.DEVEX.AGENT.082). The chapter is the source of truth; a rule
// change is edited there first, then here, in the same change.
//
// The price table `debug cost show` reads. Money is an ESTIMATE, a cache write being priced at the 5-minute rate;
// a model the table lacks has no price, and none is guessed.

/** What one million tokens of each kind cost, in dollars. */
export type Price = { input: number; cacheWrite: number; cacheRead: number; output: number };

/** The token counts a price is applied to. */
export type Counts = { input: number; cacheRead: number; cacheWrite: number; output: number };

const FABLE = { input: 10, cacheWrite: 12.5, output: 50 };
const OPUS = { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 };
const SONNET_5 = { input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 10 };

/** Dollars per million tokens, by base model id, and the day the table was read from the vendor's price list. */
export const MODEL_PRICES: { asOf: string; models: Record<string, Price> } = {
  asOf: "2026-10-06",
  models: {
    "claude-fable-5-1": { ...FABLE, cacheRead: 0.25 },
    "claude-fable-5": { ...FABLE, cacheRead: 1 },
    "claude-opus-5-5": { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 },
    "claude-opus-5": OPUS,
    "claude-opus-4-8": OPUS,
    "claude-opus-4-7": OPUS,
    "claude-opus-4-6": OPUS,
    "claude-sonnet-5-5": SONNET_5,
    "claude-sonnet-5": SONNET_5,
    "claude-sonnet-4-6": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
    "claude-haiku-5-5": { input: 0.1, cacheWrite: 0.125, cacheRead: 0.01, output: 0.5 },
    "claude-haiku-4-5": { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
  },
};

/** The id without a context suffix (`[1m]`) and without a date suffix (`-20260101`). */
function baseOf(model: string): string {
  return model.replace(/\[[^\]]*\]$/, "").replace(/-\d{8}$/, "");
}

/**
 * The dollars the counts cost on the model, or null where the table lacks the model. Cache writes are priced at
 * the 5-minute rate.
 */
export function priceOf(model: string | null | undefined, counts: Counts): number | null {
  if (typeof model !== "string") return null;
  const price = MODEL_PRICES.models[baseOf(model)];
  if (!price) return null;
  return (counts.input * price.input + counts.cacheWrite * price.cacheWrite + counts.cacheRead * price.cacheRead
    + counts.output * price.output) / 1_000_000;
}
