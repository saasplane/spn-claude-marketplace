// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § `How` ends in Cycles, and the arcs are the state
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex workstream progress write <workstream>
//
// Rewrites only what sits between the progress block's markers. Every other `workstream` write calls
// it, so it is run by hand only where an arc's data moved some other way.

import { type Action, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { writeProgress } from "../../lib/workstream.ts";
import { workstreamNamed } from "./_shared.ts";

export const describe = "the progress block in Cycles, written from the arcs' data";

function write(args: string[]): number {
  const words = readWords(args);
  if (words.paths.length > 1) throw new UsageFault("takes one workstream.");
  const said = writeProgress(workstreamNamed(words.paths[0]));
  console.log(said);
  return /^progress (?:current|written)$/.test(said) ? 0 : 1;
}

export const actions: Record<string, Action> = {
  write: { describe: "regenerate the progress block in the approach page's Cycles", usage: "<workstream>", run: write },
};
