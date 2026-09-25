#!/usr/bin/env node
// RESTATES: `spn-claude-marketplace/plugins/spn-infra/src/refs/support/infra/laws.md` — the estate
// laws, as refusals at write time. That ref is the source of truth; this file states no rule of its
// own and only carries the sentence a refusal quotes, plus the shape a rule takes.
//
// **THE REFUSAL QUOTES THE LAW, SO NOBODY HAS TO GO AND FIND IT.** A denial that says only *this is
// not allowed* leaves a person guessing which rule they broke and whether the gate or the edit is
// wrong. One sentence at the point of refusal is the difference between a gate people trust and a
// gate people work around.
//
// **AND IT IS ONE SENTENCE, IN ONE PLACE.** Every rule in every subject quotes this, so the law
// reads identically whichever rule fired. Copied per rule, the copies drift and a person meets a
// different account of the same law depending on which file they happened to touch.
import type { Verdict } from "../lib/payload.ts";

/** What `refs/support/infra/laws.md` says, quoted at the point of refusal. */
export const LAWS =
  "See refs/support/infra/laws.md in the spn-infra plugin: no secrets, ARNs or account ids at any " +
  "path; every provider-assigned value is discovered by the driver and recorded as resolved state; " +
  "provider strings live only inside a cloud entry.";

/**
 * One rule, in one subject.
 *
 * **A RULE IS NAMED, AND THE NAME REACHES THE PERSON.** A single "estate" verdict cannot say which
 * law it read, so somebody meeting a refusal has no way to check whether the gate or the edit is
 * wrong. Each rule carries its own name, its own message and its own cases.
 *
 * **`applies` READS THE PATH ALONE**, so a rule that could have no opinion about this file costs
 * nothing to skip. A provider's validator parses the text once for a subject and then runs only
 * the rules that apply — which is why the two are separate files rather than one.
 */
export type Rule = {
  name: string;
  applies: (path: string) => boolean;
  run: (path: string, text: string) => Verdict;
};

/**
 * CONSERVATIVE BY CONSTRUCTION: where a rule cannot tell, it allows.
 *
 * Every rule below matches a shape somebody TYPED — an ARN, a key id, a pinned account, a provider
 * string in a manifest — and every one of those is a value the driver discovers and records as
 * resolved state. **A false refusal costs a person their edit and their trust in the gate; a miss
 * costs one review comment.** The two are not the same size, so the rules lean one way.
 */
export const CONSERVATIVE = true;
