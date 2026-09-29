#!/usr/bin/env node
// RESTATES: nothing. This command names no rule of its own — it finds a project's stack and hands
// the argv straight to that stack's own coverage-excludes check, unchanged.
//
// `spn-apps coverage check` — scan for a coverage exclude that carries no reason.
//
//     spn-apps coverage check [path] …
//
// **STACK-GENERIC, NEVER STACK-SPECIFIC.** The scan logic stays under
// `providers/<stack>/scripts/checks/_tests/coverage-excludes.ts`; nothing here repeats it. This file
// reads the target's own `sprepo.json` for its stack, then calls that stack's exported `scan(argv)`.
// `--stdin` (the PreToolUse hook mode) stays the hook's own door, through `events/pretooluse.ts`.
import { join, resolve } from "node:path";
import { stackOf } from "../../lib/stack.ts";

export const describe = "Scan for a coverage exclude with no comment giving its reason";

/** The first path argv names, or the working directory — what the target's stack is read from. */
function targetOf(args: string[]): string {
  return args.find((a) => !a.startsWith("--")) ?? process.cwd();
}

export async function run(args: string[]): Promise<number> {
  const target = resolve(targetOf(args));
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
  return provider.scan(args);
}
