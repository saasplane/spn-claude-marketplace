// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A new window by presence
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// The one writer of the `presence` node for the three commands that set it. It writes no other node.

import { resolve } from "node:path";
import { UsageFault, VALUE, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { type PresenceState, writeState } from "../../lib/presence.ts";

/** The action that sets presence to `state`, with the words that set it from `--said`. */
export function setter(state: PresenceState): (args: string[]) => number {
  return (args) => {
    const words = readWords(args, { said: VALUE });
    if (words.paths.length) throw new UsageFault("takes no name.");
    const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
    if (!root) throw new UsageFault("finds no workspace above this folder.");
    try { writeState(root, state, words.value("said")); }
    catch (error) { throw new UsageFault((error as Error).message); }
    console.log(`presence  ${state}`);
    return 0;
  };
}
