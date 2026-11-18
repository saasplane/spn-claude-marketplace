// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/02-workstream/01-workstream.md § A new window by presence
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//   spn-devex presence watching [--said "<words>"]
//
// Writes the `presence` node as WATCHING, with the developer's words: someone who watches cannot open a window, and
// silence never sets this. Nothing else is written.

import { setter } from "./_set.ts";

export const describe = "record that the developer is watching this session from elsewhere, with the words that said so";
export const usage = "[--said \"<words>\"]";
export const run = setter("WATCHING");
