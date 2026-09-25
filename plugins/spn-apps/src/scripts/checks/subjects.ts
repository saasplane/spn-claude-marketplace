#!/usr/bin/env node
// RESTATES: nothing. It assembles what `checks/` states and what `providers/` parses.
//
// Which subjects exist, and which stack's parser reads each one.
//
// **A RULE IS THE DOMAIN'S; A PARSE IS THE STACK'S.** `checks/<subject>/<rule>.ts` says what is
// true of an apps node in any language. `providers/<stack>/validate-<subject>.ts` reads that
// stack's text once and runs every rule the path admits. A second stack joins by adding a folder.
//
// **THE STACK IS THE NODE'S OWN**, read from the nearest `sprepo.json` — never typed on a command
// and never guessed from a file extension. Until a Python parser exists there is no `py/` folder:
// a realization that is absent says so, and a stub that answers teaches you it works.
import type { ToolInput, Verdict } from "../lib/payload.ts";
import { validate as tsContract } from "../providers/ts/validate-contract.ts";
import { validate as tsSrc } from "../providers/ts/validate-src.ts";
import { validate as tsTests } from "../providers/ts/validate-tests.ts";

/** One subject, parsed once by the stack's own validator. */
export type Subject = { name: string; validate: (input: ToolInput) => Verdict };

/**
 * Every subject, cheapest first.
 *
 * `contract` and `src` read one file. `tests` runs the coverage rules, one of which reads a whole
 * test tree to answer — so it goes last, and a denial above it means that walk never happens.
 */
export const SUBJECTS: Subject[] = [
  { name: "contract:ts", validate: tsContract },
  { name: "src:ts", validate: tsSrc },
  { name: "tests:ts", validate: tsTests },
];
