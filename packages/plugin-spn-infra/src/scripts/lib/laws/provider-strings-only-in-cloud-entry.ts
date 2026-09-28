#!/usr/bin/env node
// RESTATES: `spn-infra/src/refs/support/infra/README.md` § provider strings live only inside a cloud entry. The ref governs.
//
// Refuse a provider's own spelling in a declaration, outside the two places that sanction it.
//
// **THE COORDINATES STAY PORTABLE ONLY BECAUSE NO PROVIDER'S SPELLING BECOMES ONE.** A region name
// and an instance class are a provider's words. Written into a declaration they bind the estate to
// that provider at a level the model does not admit, and the binding is invisible until somebody
// tries the second cloud.
//
// **TWO HOMES ARE SANCTIONED AND BOTH ARE BLANKED BEFORE THE SEARCH**: a cloud entry's `region`
// mapping, and a profile's capacity keys. What remains after blanking is a provider string with no
// home, which is the finding. Searching the raw text instead would refuse the declaration's own
// correct use of the same words — and a rule that refuses correct files is a rule people turn off.
//
// **THE RULE IS CLOUD-FREE AND THE PATTERNS ARE NOT, SO THE PATTERNS ARE HANDED IN.** *A provider
// string lives only inside a cloud entry* is true on every cloud. What a region LOOKS LIKE is that
// cloud's business: `eu-west-1` is AWS's spelling and `europe-west1` is Google's, and a rule
// carrying both would be a rule that has to change every time a cloud joins. So each provider's
// validator supplies its own patterns, and this file supplies the judgement.
import type { Rule } from "./law.ts";
import { LAWS } from "./law.ts";

/** What one cloud's own strings look like. Supplied by that cloud's validator, never assumed here. */
export type ProviderStrings = {
  /** The cloud's name, for the refusal — a person meeting it should know which cloud was read. */
  cloud: string;
  region: RegExp;
  instanceClass: RegExp;
};

/**
 * The two places a declaration is allowed to spell a provider's own words.
 *
 * Blanked before the search, so what remains is a provider string with no home. This is the
 * declaration's grammar rather than any cloud's, which is why it lives with the rule.
 */
const SANCTIONED = [
  /"region"\s*:\s*"[a-z0-9-]+"/g,
  /"(database|cache|queue|compute)"\s*:\s*"[^"]*"/g,
];

/** The rule, bound to one cloud's spellings. */
export function rulesFor(strings: ProviderStrings): Rule[] {
  return [
    {
      name: "provider-string-outside-cloud",
      applies: (path) => path.endsWith("spestate.json"),
      run: (path, text) => {
        const scrubbed = SANCTIONED.reduce((t, pattern) => t.replace(pattern, ""), text);
        if (strings.region.test(scrubbed))
          return { deny: `Denied: a ${strings.cloud} region string appears in ${path} outside a cloud entry's "region" mapping — the only place a provider region is spelled. ${LAWS}` };
        if (strings.instanceClass.test(scrubbed))
          return { deny: `Denied: a ${strings.cloud} instance class appears in ${path} outside a profile's capacity keys (database/cache/queue/compute) — provider strings live only inside a cloud entry. ${LAWS}` };
        return null;
      },
    },
  ];
}
