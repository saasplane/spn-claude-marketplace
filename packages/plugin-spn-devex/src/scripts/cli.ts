#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § One entry,
// dispatching by group and action. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
// The one entry a plugin ships. Every command is typed in one grammar:
//
//     spn-devex <group> <subject> <action> [<path>…] [options]    an action of a subject
//     spn-devex <group> <action> [<path>…] [options]              an action that has no subject
//     spn-devex help [--json]                                      every action, as a reading or as data
//
// A GROUP IS A FOLDER, AND A FILE IN IT SAYS WHAT IT IS BY WHAT IT EXPORTS. A file that exports
// `actions` is a subject, and the third word typed is its action. A file that exports `run` is an
// action of its group. `help` and the dispatch read the same `commands/` tree, so a file added there
// is reachable as soon as it exists. A file whose name starts with `_` is a helper that commands
// import, and it is never dispatched.
//
// THE ENTRY READS THE WORDS BEFORE THE PATH, AND THE COMMAND READS THE REST. What follows the action
// is handed to the action's `run`, which reads it with `plugin-support-lib/src/lib/command.ts`. That
// file also prints a usage fault and writes the run's telemetry line, so every command refuses in the
// same words and is recorded once.
//
// Each plugin that ships commands ships this file as the same text, apart from the plugin's name.

import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { type CommandFile, actionOwed, commandWords, isSubject, runCommand, usageOf } from "../../../plugin-support-lib/src/lib/command.ts";

const PLUGIN_NAME = "spn-devex";
// FROM SOURCE, `commands/<group>/<file>.ts` beside this file; BUNDLED, `dist/commands/<group>/<file>.mjs`
// beside `dist/cli.mjs`. A command's source imports `plugin-support-lib` by a path that exists only in
// the marketplace repository, so an installed plugin can run a command only from its bundle.
const HERE = import.meta.dirname;
const BUNDLED = basename(HERE) === "dist";
const COMMANDS = join(HERE, "commands");
const EXTENSION = BUNDLED ? ".mjs" : ".ts";

/** One action as `help` lists it. `subject` is null for a command of two words. */
export type Listed = { group: string; subject: string | null; action: string; command: string; describe: string };

function isFolder(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/** Every group: a folder under `commands/` whose name does not start with `_`. */
export function groups(): string[] {
  if (!isFolder(COMMANDS)) return [];
  return readdirSync(COMMANDS).filter((entry) => !entry.startsWith("_") && isFolder(join(COMMANDS, entry))).sort();
}

/** Every command file of one group, by its name without the extension. A name that starts with `_` is a helper. */
export function filesOf(group: string): string[] {
  const folder = join(COMMANDS, group);
  if (!isFolder(folder)) return [];
  return readdirSync(folder)
    .filter((entry) => entry.endsWith(EXTENSION) && !entry.startsWith("_"))
    .map((entry) => entry.slice(0, -EXTENSION.length))
    .sort();
}

/** What one command file exports, or null where the group holds no such file. */
async function load(group: string, file: string): Promise<CommandFile | null> {
  if (!filesOf(group).includes(file)) return null;
  // The absolute folder, never a relative specifier: a bundler may rewrite this module's own address.
  return (await import(pathToFileURL(join(COMMANDS, group, `${file}${EXTENSION}`)).href)) as CommandFile;
}

/** Every action this plugin ships: each action of each subject, and each action that has no subject. */
export async function surface(): Promise<Listed[]> {
  const listed: Listed[] = [];
  for (const group of groups()) {
    for (const file of filesOf(group)) {
      const exported = await load(group, file);
      if (!exported) continue;
      if (!isSubject(exported)) {
        listed.push({ group, subject: null, action: file, command: commandWords(group, null, file), describe: exported.describe ?? "" });
        continue;
      }
      for (const [action, { describe }] of Object.entries(exported.actions))
        listed.push({ group, subject: file, action, command: commandWords(group, file, action), describe: describe ?? "" });
    }
  }
  return listed;
}

async function printHelp(json: boolean): Promise<number> {
  const commands = await surface();
  if (json) {
    console.log(JSON.stringify({ plugin: PLUGIN_NAME, commands }, null, 2));
    return 0;
  }
  console.log(`${PLUGIN_NAME} — typed as \`${PLUGIN_NAME} <group> [<subject>] <action> [<path>…] [options]\`:\n`);
  const width = Math.max(0, ...commands.map((listed) => listed.command.length));
  for (const listed of commands) console.log(`  ${listed.command.padEnd(width)}  ${listed.describe}`);
  return 0;
}

/** The whole run: read the words before the path, find the command, and hand back its exit code. */
export async function main(argv: string[]): Promise<number> {
  const [group, second, ...rest] = argv;

  if (group === undefined || group === "help") return printHelp(argv.includes("--json"));

  const known = groups();
  if (!known.includes(group)) {
    console.error(`unknown group \`${group}\` — groups: ${known.length ? known.join(" · ") : "(none shipped)"}`);
    return 2;
  }

  const files = filesOf(group);
  const exported = second === undefined ? null : await load(group, second);
  if (second === undefined || !exported) {
    console.error(second === undefined
      ? `usage: ${PLUGIN_NAME} ${group} [<subject>] <action> […] — \`${group}\` holds: ${files.join(" · ")}`
      : `unknown command \`${group} ${second}\` — \`${group}\` holds: ${files.join(" · ")}`);
    return 2;
  }

  if (!isSubject(exported))
    return runCommand({ plugin: PLUGIN_NAME, group, subject: null, action: second, usage: exported.usage ?? "", run: exported.run }, rest);

  const [third, ...words] = rest;
  const action = third !== undefined && Object.hasOwn(exported.actions, third) ? exported.actions[third] : null;
  if (third === undefined || !action) {
    console.error(`${usageOf(PLUGIN_NAME, group, second, exported.actions)}\n${actionOwed(group, second, exported.actions, rest)}`);
    return 2;
  }
  return runCommand({ plugin: PLUGIN_NAME, group, subject: second, action: third, usage: action.usage, run: action.run }, words);
}

/**
 * Resolves once everything already written to a stream has left the process. A pipe is written in
 * the background, so `process.exit` called straight after a large `console.log` ends the process
 * with part of the output still queued, and the reader receives the first 65,536 bytes only.
 */
const written = (stream: NodeJS.WriteStream): Promise<void> =>
  new Promise((resolve) => {
    if (stream.destroyed || stream.writableEnded) { resolve(); return; }
    stream.write("", () => resolve());
  });

// MATCHES THE BUNDLED NAME TOO. `cli.ts` runs from source under that name; built, it runs as
// `dist/cli.mjs` — the same file by a different extension, and a guard tied to one literal name
// never fires for the other.
//
// THE ENTRY ENDS ONLY AFTER ITS OUTPUT IS WRITTEN, so `--json` sent through a pipe arrives whole.
// The exit stays explicit, because a command that leaves a handle open must still end.
if (process.argv[1] && ["cli.ts", "cli.mjs"].includes(basename(process.argv[1]))) {
  const code = await main(process.argv.slice(2));
  await Promise.all([written(process.stdout), written(process.stderr)]);
  process.exit(code);
}
