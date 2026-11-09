#!/usr/bin/env node
// RESTATES: spn-infra RULE.SUPPORT.INFRA.111, which says a published key carries no module of the code that
// reads it, and that the service's own settings join the published key to the module's key with a reference.
// The infra modules chapter is the source of truth; a rule change is edited there first, then here.
//
// Refuses a published estate key that spells the identity module that reads the tenant edge's facts: the
// estate publishes `{SPC}_PLATFORM_EDGE_*`, and the identity module reads its own `{SPC}_IAM_EDGE_*`.
// It reads only the files a blueprint or a platform layer publishes from, and only the text the write would
// produce, so a write anywhere else pays one path test and stops.
import type { Verdict } from "../../../../plugin-support-lib/src/lib/payload.ts";

const PUBLISHER = /(?:^|\/)(?:infra-blueprints|infra-platform[^/]*|infra-environment[^/]*)\/src\/.+\.(?:tf|hcl|json|ts)$/;
/** A published key that spells the reader's module, `{SPC}_IAM_EDGE_*`, in place of the edge's own `{SPC}_PLATFORM_EDGE_*`. */
const READER_KEY = /\b([A-Z][A-Z0-9]*)_IAM_EDGE_([A-Z0-9_]+)\b/;

/** Whether this path is a file an estate publishes keys from. */
export function applies(path: string): boolean {
  return PUBLISHER.test(path);
}

/** The refusal for the text, or null. */
export function validate(path: string, text: string): Verdict {
  if (!applies(path)) return null;
  const found = READER_KEY.exec(text);
  if (!found) return null;
  const [key, space, fact] = found;
  return { deny: `Denied: the published key ${key} carries the identity module that reads the fact. A published key names the fact's owner, so publish ${space}_PLATFORM_EDGE_${fact} and let the service's own settings join it to the module's ${space}_IAM_EDGE_${fact} with a reference (RULE.SUPPORT.INFRA.111).` };
}
