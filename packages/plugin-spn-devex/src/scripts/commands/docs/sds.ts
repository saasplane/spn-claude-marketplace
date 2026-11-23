// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
// The chapter is the source of truth; a rule change is edited there first, then here.
//
// `docs sds …` is the old name of `docs styles …` (the group was renamed with the files it cuts, from version 1.16.0). It stays for one
// release as an alias: it prints the new name on the line before it runs the same action, so nobody keeps typing the old one.
//
//   spn-devex docs sds <action> …     the same as   spn-devex docs styles <action> …

import { actions as styleActions } from "./styles.ts";
import type { Action } from "../../../../../plugin-support-lib/src/lib/command.ts";

export const describe = "the old name of `docs styles`, kept for one release: it prints the new name and runs the same action";

const renamed = (name: string, action: Action): Action => ({
  hidden: true,
  describe: `${action.describe} (alias of \`docs styles ${name}\`)`,
  usage: action.usage,
  run: (args) => {
    console.error(`note: \`docs sds ${name}\` is now \`docs styles ${name}\`; the old name works for one more release`);
    return action.run(args);
  },
});

export const actions: Record<string, Action> = Object.fromEntries(Object.entries(styleActions).map(([name, action]) => [name, renamed(name, action)]));
