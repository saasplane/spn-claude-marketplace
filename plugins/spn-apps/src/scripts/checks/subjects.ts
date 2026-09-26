#!/usr/bin/env node
// RESTATES: `spn-claude-marketplace/docs/02-constructs/01-spn-devex/11-provider-set.md` — a gate
// never names an instance. That chapter is the source of truth; this file states no rule of its own.
//
// **THIS FILE IS THE GATE, AND IT KNOWS NO STACK.** It names the subjects an apps node has and the
// order they run in, then hands each one to the provider the node's own `sprepo.json` declares.
// A second stack joins by adding `providers/<stack>/scripts/checks/`, and nothing here changes.
//
// **THE SUBJECTS ARE TWO, BECAUSE `contract` WAS NEVER A PEER OF `src`.** Every contract rule
// watches a path under `src/`, so a write to `src/contract/services/Foo.ts` matched both subjects
// and the file was read and masked twice — at write time, where a person is waiting. Which rules
// apply is decided by the path and the node's kind, never by a subject name.
//
// **A PROVIDER THAT IS ABSENT ANSWERS NOTHING, AND THAT IS NOT AN ERROR.** A repository declaring a
// stack this plugin ships no folder for is left alone: a gate that refused what it cannot classify
// would refuse far more than it was asked to, and a stub that answered would teach a reader it works.
import type { ToolInput, Verdict } from "../lib/payload.ts";
import { stackOf } from "../lib/stack.ts";

/** One subject, parsed once by the stack's own validator. */
export type Subject = { name: string; validate: (input: ToolInput) => Verdict | Promise<Verdict> };

/**
 * The subjects an apps node has, cheapest first.
 *
 * `src` reads one file. `tests` runs the coverage rules, one of which reads a whole test tree to
 * answer — so it goes last, and a denial above it means that walk never happens.
 */
export const SUBJECT_NAMES = ["src", "tests"] as const;

/**
 * Every subject for the stack this file belongs to, or an empty list where the plugin ships no
 * provider for it.
 *
 * The import is dynamic because the path is composed from the declaration. A static import would
 * be this file naming a stack, which is the one thing it may not do.
 */
export async function subjectsFor(path: string): Promise<Subject[]> {
  const stack = stackOf(path);
  if (!stack) return [];

  const subjects: Subject[] = [];
  for (const name of SUBJECT_NAMES) {
    try {
      const module = await import(`../../providers/${stack}/scripts/checks/${name}.ts`);
      if (typeof module.validate === "function") subjects.push({ name: `${name}:${stack}`, validate: module.validate });
    } catch {
      // A subject a provider does not ship is a subject that does not run here.
    }
  }
  return subjects;
}
