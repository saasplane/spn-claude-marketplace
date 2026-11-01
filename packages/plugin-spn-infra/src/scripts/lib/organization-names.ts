#!/usr/bin/env node
// RESTATES: spn-infra RULE.ESTATE.ORGANIZATION.001, which says the organization's token (`org`) and its readable
// name (`name`) are two fields because they are two things: `spn` prefixes a container name, and `SaaS Plane` is
// what a sentence says. The chapter is the source of truth; a rule change is edited there first, then here.
//
// Refuses an ORGANIZATION declaration whose `org` is not a token (lower case letters and digits, starting with a
// letter) or whose `name` is the token again. It reads the text the write would produce and allows what it cannot
// parse, because a half-written declaration is not yet a finding.
import type { Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";

const TOKEN = /^[a-z][a-z0-9]*$/;

/** Whether this path is an organization declaration: `spestate.json` in an `infra-organization` package. */
export function applies(path: string): boolean {
  return /(?:^|\/)infra-organization\/src\/spestate\.json$/.test(path);
}

/** The refusal for the declaration's text, or null. */
export function validate(path: string, text: string): Verdict {
  if (!applies(path)) return null;
  let config: { org?: unknown; name?: unknown } | undefined;
  try { config = JSON.parse(text)?.config; } catch { return null; }
  if (typeof config?.org !== "string" || typeof config?.name !== "string") return null;
  const { org, name } = config;
  if (!TOKEN.test(org))
    return { deny: `Denied: \`org\` is the token that prefixes a container name, so it is lower case letters and digits and starts with a letter. "${org}" reads as a name. Write the readable form in \`name\` (RULE.ESTATE.ORGANIZATION.001).` };
  if (name === org)
    return { deny: `Denied: \`name\` is what a sentence says, and "${name}" is the token again. Write the readable name, for example "SaaS Plane" beside the token "spn" (RULE.ESTATE.ORGANIZATION.001).` };
  return null;
}
