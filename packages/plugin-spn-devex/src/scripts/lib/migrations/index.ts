// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/01-plugins.md § A release carries its migration, and a window runs what is pending first
// The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
// Every migration this plugin ships, in id order. A released one is never edited or renumbered, and
// a new one takes the next id, in a file of its own named for it.

import { type Migration } from "../migration.ts";
import { migration001 } from "./001-workstream-as-data.ts";
import { migration002 } from "./002-fixed-notes-tree.ts";

export const MIGRATIONS: readonly Migration[] = [migration001, migration002];
