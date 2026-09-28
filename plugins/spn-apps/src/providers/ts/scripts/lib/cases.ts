// RESTATES: spn-foundation docs/04-capabilities/02-support/01-apps/10-providers/ts/13-tests.md § Layout and naming
// The chapter is the source of truth; a change is made there first, then here, in the same change.
//
// Where a TypeScript case lives and how its title cites a row — the stack's half of the behaviours
// join. The folders and patterns are the ones the toolchain's runner is configured with
// (`@saasplane/toolchain-ts/test/tiers.mjs`), because a narrower pattern reports a case that exists
// as missing.

import { dirname, join, relative } from "node:path";
import { idsIn } from "../../../../scripts/lib/register.ts";
import { walk } from "../../../../scripts/lib/runs.ts";
import { owedBy } from "../../../../scripts/lib/kinds.ts";
import { read } from "../../../../scripts/lib/source.ts";

/** One case title citing one behaviour id. */
export type ProvingCase = { id: string; title: string; file: string; tier: string };

/** Each tier's folder under a node, and the file pattern its runner collects. */
const TIER_FOLDERS: ReadonlyArray<{ tier: string; folder: string; match: RegExp }> = [
  { tier: "UNIT", folder: "/tests/unit/", match: /\.spec\.(tsx?|mjs)$/ },
  { tier: "COMPONENT", folder: "/tests/component/", match: /\.ct\.spec\.tsx$/ },
  { tier: "INTEGRATION", folder: "/tests/integration/", match: /\.int\.(spec|test)\.tsx?$/ },
  { tier: "JOURNEY", folder: "/tests/journeys/", match: /\.spec\.tsx?$/ },
];

/** A `describe`, `it` or `test` call's title. A `.skip` or `.todo` call is not a case that can prove anything. */
const TITLE_CALL = /\b(?:describe|it|test)(?:\.(?!skip|todo)\w+)?\s*\(\s*(['"`])([\s\S]*?)\1/g;

/** The kind the nearest `spkind.json` above a file declares, or null. */
function kindAbove(file: string, root: string): string | null {
  let here = dirname(file);
  while (here.startsWith(root)) {
    const text = read(join(here, "spkind.json"));
    if (text !== null) {
      try { return (JSON.parse(text) as { kind?: string }).kind ?? null; } catch { return null; }
    }
    const up = dirname(here);
    if (up === here) break;
    here = up;
  }
  return null;
}

/**
 * The tier a case file sits at, or null for a file no runner collects.
 *
 * `tests/integration/` holds both the integration and the contract tier; the node's kind says which
 * one it means, and a kind owing neither means integration.
 */
function tierOf(file: string, root: string): string | null {
  const shown = file.split("\\").join("/");
  const found = TIER_FOLDERS.find((one) => shown.includes(one.folder) && one.match.test(shown));
  if (!found) return null;
  if (found.tier !== "INTEGRATION") return found.tier;
  return owedBy(kindAbove(file, root)).includes("CONTRACT") ? "CONTRACT" : "INTEGRATION";
}

/** Every case under the root whose title cites a behaviour id, one entry per id cited. */
export function casesUnder(root: string): { cases: ProvingCase[]; filesRead: number } {
  const cases: ProvingCase[] = [];
  let filesRead = 0;
  for (const file of walk(root)) {
    const tier = tierOf(file, root);
    if (tier === null) continue;
    // A case under a TOOLCHAIN-kind node proves the toolchain's own machinery, not a behaviour — its
    // sample titles (a made-up id used to prove the runner reads a title correctly) are never join evidence.
    if (kindAbove(file, root) === "TOOLCHAIN") continue;
    const source = read(file);
    if (source === null) continue;
    filesRead += 1;
    const shown = relative(root, file).split("\\").join("/");
    for (const call of source.matchAll(TITLE_CALL)) {
      for (const id of idsIn(call[2])) cases.push({ id: id, title: call[2], file: shown, tier: tier });
    }
  }
  return { cases: cases, filesRead: filesRead };
}
