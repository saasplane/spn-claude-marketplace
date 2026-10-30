// RESTATES: RULE.DEVEX.AGENT.107 — a note may refuse in a later version only once a scan of the three
// TypeScript repositories finds no note on correct code. This command is that scan; it names no rule.
//
// `spn-surface check scan` — every Surface note in every `.tsx` of a web node's `src/`, whole files.
//
//     spn-surface check scan [<path>…]
//
// The reader and the notes stay in `providers/<stack>/scripts/checks/surface.ts`; this file reads the
// first path's stack and calls that reader's `scan(paths)`.
import { join } from "node:path";
import { OPTIONAL, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { stackOf } from "../../../../../plugin-support-lib/src/lib/stack.ts";

export const describe = "Scan Surface code for every note the Surface check gives, whole files";
export const usage = "[<path>…]";

export async function run(args: string[]): Promise<number> {
  const paths = scopeOf(readWords(args).paths, OPTIONAL);
  const target = paths[0];
  const stack = stackOf(join(target, "sprepo.json"));
  if (!stack) {
    process.stderr.write(`check scan: no stack declared at or above ${target} — nothing to scan\n`);
    return 1;
  }
  let provider: { scan?: (argv: string[]) => number };
  try {
    provider = await import(`../../../providers/${stack}/scripts/checks/surface.ts`);
  } catch {
    process.stderr.write(`check scan: this plugin ships no Surface reader for the ${stack} stack\n`);
    return 1;
  }
  if (typeof provider.scan !== "function") {
    process.stderr.write(`check scan: the ${stack} provider's Surface reader exports no scan()\n`);
    return 1;
  }
  return provider.scan(paths);
}
