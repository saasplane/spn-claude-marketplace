// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A new window by presence
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex presence show [--json]
//
// Presence as it reads now: the state, how it was decided (said, silence or none), since when, the time of the last message
// and the developer's local time. It writes nothing.

import { resolve } from "node:path";
import { FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";
import { withOffset } from "../../lib/clock.ts";
import { readPresence } from "../../lib/presence.ts";

export const describe = "presence as read now: the state, how it was decided, the last message and the developer's local time";
export const usage = "[--json]";

export function run(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no name.");
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  const read = readPresence(root);
  const last = read.lastMessageAt === null ? null : withOffset(new Date(read.lastMessageAt));
  if (words.given("json")) { console.log(JSON.stringify({ ...read, lastMessageAt: last }, null, 2)); return 0; }
  console.log(`presence  ${read.state}`);
  console.log(`decided   ${read.how}${read.said ? ` ("${read.said}")` : ""}`);
  console.log(`since     ${read.since ?? "never set"}`);
  console.log(`last message  ${last ?? "none recorded"}`);
  console.log(`local time    ${read.local}`);
  return 0;
}
