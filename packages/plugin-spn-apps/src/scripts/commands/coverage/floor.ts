#!/usr/bin/env node
// RESTATES: nothing. This command names no rule of its own — it finds a project's stack and hands
// the argv straight to that stack's own coverage-floor tool, unchanged.
//
// `spn-apps coverage floor` — raise each project's coverage floor to what its last run measured.
//
//     spn-apps coverage floor [--write] <project> …
//
// **STACK-GENERIC, NEVER STACK-SPECIFIC.** The floor logic stays under
// `providers/<stack>/scripts/lib/coverage-floor.ts`; nothing here repeats it. This file reads the
// project's own `sprepo.json` to learn which stack answers, then calls that stack's exported
// `cli(argv)` with the same argv a person would pass the tool directly, so both doors agree.
import { join, resolve } from "node:path";
import { stackOf } from "../../lib/stack.ts";

export const describe = "Raise each project's coverage floor to what its last run measured (--write to apply)";

/** The project argv names, or the working directory — the same rule the tool itself applies. */
function projectOf(args: string[]): string {
  return args.find((a) => !a.startsWith("--")) ?? process.cwd();
}

export async function run(args: string[]): Promise<number> {
  const project = resolve(projectOf(args));
  const stack = stackOf(join(project, "sprepo.json"));
  if (!stack) {
    process.stderr.write(`coverage floor: no stack declared at or above ${project} — nothing to raise\n`);
    return 1;
  }
  let provider: { cli?: (argv: string[]) => number };
  try {
    provider = await import(`../../../providers/${stack}/scripts/lib/coverage-floor.ts`);
  } catch {
    process.stderr.write(`coverage floor: this plugin ships no coverage-floor tool for the ${stack} stack\n`);
    return 1;
  }
  if (typeof provider.cli !== "function") {
    process.stderr.write(`coverage floor: the ${stack} provider's coverage-floor tool exports no cli()\n`);
    return 1;
  }
  return provider.cli(args);
}
