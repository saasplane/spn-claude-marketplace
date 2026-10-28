// RESTATES: spn-foundation RD.DEVEX.WORKSPACE.058 — an arc carries a status, and it is one of a closed set of six —
// and RD.DEVEX.WORKSPACE.307, which stores the developer's words and works out the rest from the steps.
// The register rows are the source of truth. A rule change is edited there first, then here.
//
// THE SET, STATED ONCE IN THE PLUGIN. The schema (`lib/workstream-schema.ts`) takes the stored statuses from here,
// so `workstream arc edit --status` refuses a word outside them, and `workstream state check` names a `state.json`
// that holds one. What an arc reads as is worked out by one owner, `arcStatus` in `lib/workstream.ts`, which every
// reader asks.

/** The six statuses, in the order the register states them. The last three are terminal. */
export const STATUSES = ["PROPOSED", "DECIDED", "RUNNING", "LANDED", "CARRIED", "DROPPED"] as const;
export type Status = (typeof STATUSES)[number];
/**
 * The statuses an arc's data stores: the developer's words. `RUNNING` is never stored, and `LANDED` is stored only
 * where no step works it out: the review-fixes arc at the close, and an arc that landed under the version 1 rules.
 */
export const STORED_STATUSES = ["PROPOSED", "DECIDED", "LANDED", "CARRIED", "DROPPED"] as const;
export const TERMINAL: ReadonlySet<string> = new Set(["LANDED", "CARRIED", "DROPPED"]);

/**
 * Whether a status is past `DECIDED` in the order of the set: `RUNNING` or terminal. A word outside the set is past
 * nothing.
 */
export function pastDecided(status: string | null): boolean {
  const order = STATUSES as readonly string[];
  return status !== null && order.indexOf(status) > order.indexOf("DECIDED");
}
