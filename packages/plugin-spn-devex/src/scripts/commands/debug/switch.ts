// RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/01-workspace/01-workspace.md § `.debug/` holds
// four containers. The chapter is the source of truth; a rule change is edited there first, then here, in the same change.
//
//     spn-devex debug switch show [--json]
//     spn-devex debug switch on <name>
//     spn-devex debug switch off <name>
//
// The switches live in `switches.json`, from the closed set `SWITCH_NAMES` (`debug-store.ts`); this is their only writer.

import { resolve } from "node:path";
import { type Action, FLAG, UsageFault, readWords } from "../../../../../plugin-support-lib/src/lib/command.ts";
import { SWITCH_NAMES, type SwitchName, readSwitch, writeSwitch } from "../../../../../plugin-support-lib/src/lib/debug-store.ts";
import { workspaceRoot } from "../../../../../plugin-support-lib/src/lib/timing.ts";

export const describe = "the switches of the agent's own machinery, and whether each is on";

function rootOf(): string {
  const root = workspaceRoot(resolve(process.env.SPN_WORKSPACE ?? process.cwd()));
  if (!root) throw new UsageFault("finds no workspace above this folder.");
  return root;
}

function show(args: string[]): number {
  const words = readWords(args, { json: FLAG });
  if (words.paths.length) throw new UsageFault("takes no name.");
  const root = rootOf();
  const state = Object.fromEntries(SWITCH_NAMES.map((name) => [name, readSwitch(root, name)]));
  if (words.given("json")) { console.log(JSON.stringify(state, null, 2)); return 0; }
  for (const [name, on] of Object.entries(state)) console.log(`${name}  ${on ? "on" : "off"}`);
  return 0;
}

function turn(on: boolean): (args: string[]) => number {
  return (args) => {
    const words = readWords(args);
    if (words.paths.length !== 1) throw new UsageFault(`takes one switch, from ${SWITCH_NAMES.join(" · ")}.`);
    const name = words.paths[0];
    if (!(SWITCH_NAMES as readonly string[]).includes(name)) throw new UsageFault(`knows no switch \`${name}\`; the switches are ${SWITCH_NAMES.join(" · ")}.`);
    writeSwitch(rootOf(), name as SwitchName, on);
    console.log(`${name}  ${on ? "on" : "off"}`);
    return 0;
  };
}

export const actions: Record<string, Action> = {
  show: { describe: "each switch and whether it is on", usage: "[--json]", run: show },
  on: { describe: "turn a switch on", usage: "<name>", run: turn(true) },
  off: { describe: "turn a switch off", usage: "<name>", run: turn(false) },
};
