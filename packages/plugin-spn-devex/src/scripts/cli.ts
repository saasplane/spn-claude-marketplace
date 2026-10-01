#!/usr/bin/env node
// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § One entry,
// dispatching by group and action. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
// The one entry a plugin ships: `<group> <action> [args] [--json]`, lazily importing the one file
// `commands/<group>/<action>.ts` names.
//
//     node cli.ts <group> <action> [args…]     run a command
//     node cli.ts help [--json]                 every action, as data or as a reading
//
// A GROUP IS A FOLDER AND AN ACTION IS A FILE — nothing else decides the surface. `help --json` and
// this dispatcher read the same `commands/` tree, so a file added there is reachable the moment it
// exists and nothing here has to be told about it. A file whose name starts with `_` is a shared
// helper a command imports, never a command itself — `_lib.ts` beside `audit.ts` is how `docs/`
// keeps one copy of its shared reading and writing without that copy being dispatched as an action.
//
// EACH `commands/<group>/<action>.ts` EXPORTS `{ describe, run }`. `describe` is one line, read by
// `help`. `run(args)` is the command's own argv — everything after `<group> <action>` — and returns
// (or resolves to) the process exit code; it prints its own output on the way, exactly as the tool
// it replaces did. Nothing here parses a command's own flags — that is the command's business.

import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export type CommandModule = { describe: string; run: (args: string[]) => number | Promise<number> };

const HERE = dirname(new URL(import.meta.url).pathname);
// FROM SOURCE, `commands/<group>/<action>.ts` beside this file; BUNDLED, `dist/commands/<group>/<action>.mjs`
// beside `dist/cli.mjs`. A command's source imports `plugin-support-lib` by a path that exists only in
// the marketplace repository, so an installed plugin can run a command only from its bundle.
const BUNDLED = basename(HERE) === "dist";
const COMMANDS = join(HERE, "commands");
const EXTENSION = BUNDLED ? ".mjs" : ".ts";
const PLUGIN_NAME = "spn-devex";

function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

/** Every group: a folder under `commands/` whose name does not start with `_`. */
export function groups(): string[] {
  if (!isDir(COMMANDS)) return [];
  return readdirSync(COMMANDS).filter((entry) => !entry.startsWith("_") && isDir(join(COMMANDS, entry))).sort();
}

/** Every action of one group: a command file under its folder whose name does not start with `_`. */
export function actionsOf(group: string): string[] {
  const dir = join(COMMANDS, group);
  if (!isDir(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(EXTENSION) && !entry.startsWith("_"))
    .map((entry) => entry.slice(0, -EXTENSION.length))
    .sort();
}

/** The module behind `<group> <action>`, or null where the file is not there. */
async function load(group: string, action: string): Promise<CommandModule | null> {
  if (!actionsOf(group).includes(action)) return null;
  const path = join(COMMANDS, group, `${action}${EXTENSION}`);
  return (await import(pathToFileURL(path).href)) as CommandModule;
}

/** Every `<group> <action>` this plugin ships, with its own one-line `describe`. */
async function surface(): Promise<Array<{ group: string; action: string; command: string; describe: string }>> {
  const out: Array<{ group: string; action: string; command: string; describe: string }> = [];
  for (const group of groups()) {
    for (const action of actionsOf(group)) {
      const mod = await load(group, action);
      out.push({ group, action, command: `${group} ${action}`, describe: mod?.describe ?? "" });
    }
  }
  return out;
}

async function printHelp(json: boolean): Promise<number> {
  const commands = await surface();
  if (json) {
    console.log(JSON.stringify({ plugin: PLUGIN_NAME, commands }, null, 2));
    return 0;
  }
  console.log(`${PLUGIN_NAME} — printed as \`${PLUGIN_NAME} <group> <action>\`, never as a bare command:\n`);
  for (const group of groups()) {
    console.log(`  ${group}`);
    for (const action of actionsOf(group)) {
      const mod = await load(group, action);
      console.log(`    ${action.padEnd(12)} ${mod?.describe ?? ""}`);
    }
  }
  return 0;
}

/** The whole run: parse, dispatch, and hand back the exit code the command chose. */
export async function main(argv: string[]): Promise<number> {
  const [first, second, ...rest] = argv;

  if (first === undefined || first === "help") {
    return printHelp((second === "--json") || rest.includes("--json") || (argv.includes("--json")));
  }

  const group = first;
  const gs = groups();
  if (!gs.includes(group)) {
    console.error(`unknown group \`${group}\` — groups: ${gs.length ? gs.join(" · ") : "(none shipped)"}`);
    return 2;
  }

  const action = second;
  const as = actionsOf(group);
  if (!action || !as.includes(action)) {
    console.error(
      action
        ? `unknown action \`${group} ${action}\` — actions for \`${group}\`: ${as.join(" · ")}`
        : `usage: ${PLUGIN_NAME} ${group} <action> […] — actions: ${as.join(" · ")}`,
    );
    return 2;
  }

  const mod = await load(group, action);
  if (!mod) { console.error(`unknown action \`${group} ${action}\``); return 2; }
  return mod.run(rest);
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
