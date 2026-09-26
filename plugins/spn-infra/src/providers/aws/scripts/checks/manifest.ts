#!/usr/bin/env node
// RESTATES: nothing. The rules are in `checks/manifest/`, stated once and cloud-free. This file
// runs them and states none of its own.
//
// The manifest subject, for AWS: read the text once, then run every manifest rule against it.
//
// **THE RULE IS THE DOMAIN'S AND THE PARSE IS THE PROVIDER'S.** A rule says *an account id is never
// pinned*, which is true on every cloud. What an account id LOOKS LIKE is AWS's business, and so is
// which files count as a manifest here. Keeping the two apart is what lets a second cloud join by
// adding a folder rather than by copying a rule — and it is why `no-pinned-account.ts` sits in
// `checks/`, above every provider, rather than in here.
//
// **PARSED ONCE, NOT ONCE PER RULE.** Four rules each reading and masking the same text is four
// times the work at write time, and write time is where a person is waiting. The validator reads
// the text the write would PRODUCE, hands it to every rule that applies, and returns the first
// refusal.
//
// **THE FIRST REFUSAL WINS, AND IT IS NAMED.** A person fixes one thing at a time, and a list of
// four denials for one edit reads as a broken gate rather than as four problems.
import type { Verdict } from "../../../../scripts/lib/payload.ts";
import type { Rule } from "../../../../scripts/lib/laws.ts";
import { RULES as SECRETS } from "../../../../scripts/lib/no-secrets.ts";
import { RULES as PINNED } from "../../../../scripts/lib/no-pinned-account.ts";
import { rulesFor } from "../../../../scripts/lib/provider-strings.ts";

/**
 * What AWS's own strings look like — this cloud's business, and nowhere else's.
 *
 * A region is `<geo>-<compass>-<digit>`; an instance class is a family and a size behind a service
 * prefix. Both are matched only after the declaration's two sanctioned homes are blanked.
 */
const AWS_STRINGS = {
  cloud: "AWS",
  region: /\b(af|ap|ca|cn|eu|il|me|sa|us|usgov)-(central|north|south|east|west|northeast|northwest|southeast|southwest)-[0-9]\b/,
  instanceClass: /"(db|cache|kafka)\.[a-z0-9]+\.[a-z0-9]+"/,
};
const PROVIDER_STRINGS = rulesFor(AWS_STRINGS);

/** Every manifest rule, in the order a person would want to hear about them. */
export const RULES: Rule[] = [...SECRETS, ...PINNED, ...PROVIDER_STRINGS];

/**
 * Run the manifest subject against one write.
 *
 * `text` is what the file would CONTAIN after the write, never the fragment alone — an Edit carries
 * only its replacement, and a half-manifest judged on its own is how a gate reports green having
 * checked nothing.
 */
export function validate(path: string, text: string): Verdict {
  for (const rule of RULES) {
    if (!rule.applies(path)) continue;
    const verdict = rule.run(path, text);
    if (verdict) return verdict;
  }
  return null;
}
