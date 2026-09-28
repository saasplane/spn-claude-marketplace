#!/usr/bin/env node
// RESTATES: spn-foundation docs/02-constructs/01-devex/02-agent/04-plugins.md § The shape of a
// plugin, and its Node realization docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md
// § One entry, dispatching by group and action. Those chapters are the source of truth.
//
// `spn-apps <group> <action> [args] [--json]` — the one entry every `spn-apps` tool is reached
// through, printed with the plugin named so two plugins may share a group's name without ambiguity.
//
// A command lives at `commands/<group>/<action>.ts` and exports `{ describe, run }`. This file
// discovers the set by walking that folder rather than listing it by hand, so a command that exists
// is reachable and nothing here can drift from what `commands/` actually holds.
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const NAME = "spn-apps";
const COMMANDS_DIR = resolve(import.meta.dirname, "commands");

type Command = { describe: string; run: (args: string[]) => number | Promise<number> };
type Entry = { group: string; action: string; describe: string };

/** Every `<group> <action>` this plugin ships, group then action, both sorted. */
function discover(): { group: string; action: string }[] {
  const found: { group: string; action: string }[] = [];
  let groups: string[] = [];
  try {
    groups = readdirSync(COMMANDS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch { groups = []; }
  for (const group of groups) {
    let actions: string[] = [];
    try {
      actions = readdirSync(join(COMMANDS_DIR, group))
        .filter((file) => file.endsWith(".ts")).map((file) => file.slice(0, -3)).sort();
    } catch { actions = []; }
    for (const action of actions) found.push({ group, action });
  }
  return found;
}

async function load(group: string, action: string): Promise<Command | null> {
  try {
    const module = await import(`./commands/${group}/${action}.ts`);
    if (typeof module.run !== "function") return null;
    return { describe: typeof module.describe === "string" ? module.describe : "", run: module.run };
  } catch {
    return null;
  }
}

/** Every command, with its `describe`, for `help` and for an unknown-command listing. */
async function catalogue(): Promise<Entry[]> {
  const entries: Entry[] = [];
  for (const { group, action } of discover()) {
    const command = await load(group, action);
    entries.push({ group, action, describe: command?.describe ?? "" });
  }
  return entries;
}

function printList(entries: Entry[], json: boolean): void {
  if (json) { console.log(JSON.stringify(entries, null, 2)); return; }
  console.log(`${NAME} <group> <action> [args] [--json]\n`);
  for (const entry of entries) {
    console.log(`  ${NAME} ${entry.group} ${entry.action}`.padEnd(32) + `  ${entry.describe}`);
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  // --json IS THIS FILE'S OWN FLAG, never a command's. Stripping it here is what keeps a forwarded
  // command's argv identical to what a person would pass the tool it forwards to directly.
  const json = argv.includes("--json");
  const [group, action, ...rest] = argv.filter((one) => one !== "--json");

  if (!group || group === "help") {
    printList(await catalogue(), json);
    return group === "help" ? 0 : 1;
  }

  const command = action ? await load(group, action) : null;
  if (!command) {
    process.stderr.write(action
      ? `${NAME}: no command "${group} ${action}"\n\n`
      : `${NAME}: "${group}" needs an action\n\n`);
    printList(await catalogue(), json);
    return 2;
  }
  return command.run(rest);
}

process.exit(await main());
