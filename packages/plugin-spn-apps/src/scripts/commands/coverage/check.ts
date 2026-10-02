// RESTATES: nothing. This command names no rule of its own — it finds a project's stack and hands
// its paths to that stack's own coverage-excludes check.
//
// `spn-apps coverage check` — scan for a coverage exclude that carries no reason.
//
//     spn-apps coverage check [<path>…]
//
// AN ACTION OF ITS GROUP, AND A `file` PATH. Each path names a file or a folder to scan. Given none,
// the command scans the repository the caller is in.
//
// **STACK-GENERIC, NEVER STACK-SPECIFIC.** The scan logic stays under
// `providers/<stack>/scripts/checks/_tests/coverage-excludes.ts`; nothing here repeats it. This file
// reads the first path's own `sprepo.json` for its stack, then calls that stack's exported `scan(paths)`.
// `--stdin` (the PreToolUse hook mode) stays the hook's own door, through `events/pretooluse.ts`.
import { join } from "node:path";
import { OPTIONAL, readWords, scopeOf } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { stackOf } from "../../lib/stack.ts";

export const describe = "Scan for a coverage exclude with no comment giving its reason";
export const usage = "[<path>…]";

export async function run(args: string[]): Promise<number> {
  const paths = scopeOf(readWords(args).paths, OPTIONAL);
  // The stack is read from the first path: one run scans one repository's files.
  const target = paths[0];
  const stack = stackOf(join(target, "sprepo.json"));
  if (!stack) {
    process.stderr.write(`coverage check: no stack declared at or above ${target} — nothing to scan\n`);
    return 1;
  }
  let provider: { scan?: (argv: string[]) => number };
  try {
    provider = await import(`../../../providers/${stack}/scripts/checks/_tests/coverage-excludes.ts`);
  } catch {
    process.stderr.write(`coverage check: this plugin ships no coverage-excludes check for the ${stack} stack\n`);
    return 1;
  }
  if (typeof provider.scan !== "function") {
    process.stderr.write(`coverage check: the ${stack} provider's coverage-excludes check exports no scan()\n`);
    return 1;
  }
  return provider.scan(paths);
}
