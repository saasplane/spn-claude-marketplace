// RESTATES: spn-foundation docs/04-capabilities/01-devex/02-agent/04-plugins/02-shape.md § One entry,
// dispatching by group and action. The chapter is the source of truth; a rule change is edited there
// first, then here, in the same change.
//
// How a plugin command reads the words it is typed with. One grammar holds for every command of
// every plugin:
//
//     spn-<plugin> <group> [<subject>] <action> [<path>…] [options]
//
// THIS FILE HOLDS WHAT EVERY COMMAND NEEDS, AND NOTHING ONE COMMAND NEEDS ALONE: what a command
// file exports, the reading of a command's own words into paths and options, the repository and the
// docs tree a path belongs to, the scope of a run that names no path, whether a file sits under a
// path, the usage text, and the one place a command is recorded in telemetry. spn-devex and spn-apps
// import it by relative path, so the build copies it into each plugin's own bundles.
//
// A COMMAND FILE EXPORTS ONE OF TWO SHAPES, and the entry tells them apart by the export:
//
//     export const describe = "…";                    a SUBJECT: `<group> <subject> <action>`
//     export const actions: Record<string, Action> = { check: { describe, usage, run }, … };
//
//     export const describe = "…";                    an ACTION of its group: `<group> <action>`
//     export const usage = "[<path>] [--json]";
//     export function run(args: string[]): number { … }
//
// `usage` IS WHAT FOLLOWS THE ACTION, AND NOTHING BEFORE IT. The entry knows the plugin, the group
// and the file, so it writes those words itself and a usage line cannot name a place the file is
// not at.
//
// A FAULT IN HOW A COMMAND WAS TYPED IS THROWN, NEVER PRINTED BY THE COMMAND. `readWords`, `scopeOf`
// and `onePath` throw a `UsageFault`; `runCommand` prints the command's usage line and the fault,
// and the exit code is 2. So every command refuses in the same words, and no command prints a usage
// line of its own.
//
// A COMMAND NEVER RECORDS ITSELF. `runCommand` writes the one telemetry line of a run, with the
// command's words as its three levels, so a command file imports nothing from `timing.ts`.

import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { docsOf, docsRootOf, slashes } from "./docs-tree.ts";
import { argsText, begin, commandFacts, end, record } from "./timing.ts";

/** The file a repository declares itself with, at its root. */
export const MANIFEST = "sprepo.json";

/** What a command's `run` hands back: its exit code, at once or when it settles. */
export type Exit = number | Promise<number>;

/**
 * One action: the line `help` prints for it, the words it takes after its own name, and the
 * function that runs it. `run` receives what was typed after the action.
 */
export type Action = { describe: string; usage: string; run: (args: string[]) => Exit };

/** A command file that names its actions, typed as `<group> <subject> <action>`. */
export type Subject = { describe: string; actions: Record<string, Action> };

/** What a file under `commands/<group>/` exports: a subject, or one action of its group. */
export type CommandFile = Subject | Action;

/** Whether a command file is a subject: it exports `actions`. */
export function isSubject(file: CommandFile): file is Subject {
  const actions = (file as Partial<Subject>).actions;
  return typeof actions === "object" && actions !== null;
}

const FAULT = "UsageFault";

/**
 * A fault in how a command was typed. Its message completes the sentence that opens with the
 * command's words: `needs a path.` is printed as `` `docs face write` needs a path. ``
 */
export class UsageFault extends Error {
  constructor(message: string) {
    super(message);
    this.name = FAULT;
  }
}

/**
 * Whether a thrown value is a usage fault. It is read by name, because the entry and each command
 * are bundled apart and each bundle holds a class of its own.
 */
export function isUsageFault(thrown: unknown): thrown is Error {
  return thrown instanceof Error && thrown.name === FAULT;
}

// ---------------------------------------------------------------------------- the words

/** An option that takes no value: `--json`. */
export const FLAG = "flag";
/** An option that takes any value: `--out <file>`. */
export const VALUE = "value";
/**
 * What one option takes: nothing, any value, or a value from a set. An option with a set is a
 * filter, and a value outside the set is a usage fault that prints the set.
 */
export type OptionKind = typeof FLAG | typeof VALUE | readonly string[];
/** The options a command reads, each by its name without the dashes. */
export type Options = Record<string, OptionKind>;

/** A command's own words, read: the paths in the order typed, and the options. */
export type Words = {
  paths: string[];
  /** Whether an option was typed. */
  given: (name: string) => boolean;
  /** Each value an option was typed with, in order. An option may be typed more than once. */
  values: (name: string) => string[];
  /** The last value an option was typed with, or null. */
  value: (name: string) => string | null;
};

/**
 * Reads what was typed after the action against the options the command declares. A word that opens
 * with a dash is an option, written `--name`, `--name value` or `--name=value`; every other word is
 * a path. Throws a `UsageFault` for an option the command does not declare, a value where none is
 * taken, a value left out, and a filter's value outside its set.
 */
export function readWords(args: string[], options: Options = {}): Words {
  const paths: string[] = [];
  const read = new Map<string, string[]>();
  for (let at = 0; at < args.length; at += 1) {
    const word = args[at];
    if (!word.startsWith("-") || word === "-") { paths.push(word); continue; }
    const equals = word.indexOf("=");
    const name = (equals < 0 ? word : word.slice(0, equals)).replace(/^-+/, "");
    if (!Object.hasOwn(options, name)) throw new UsageFault(`does not take \`--${name}\`.`);
    const kind = options[name];
    if (kind === FLAG) {
      if (equals >= 0) throw new UsageFault(`takes \`--${name}\` with no value.`);
      read.set(name, read.get(name) ?? []);
      continue;
    }
    const value = equals >= 0 ? word.slice(equals + 1) : args[at + 1];
    if (equals < 0) at += 1;
    if (value === undefined || value === "" || (equals < 0 && value.startsWith("--")))
      throw new UsageFault(`needs a value after \`--${name}\`.`);
    if (kind !== VALUE && !kind.includes(value))
      throw new UsageFault(`takes \`--${name}\` from ${kind.join(" · ")}, and \`${value}\` is none of them.`);
    read.set(name, [...(read.get(name) ?? []), value]);
  }
  return {
    paths,
    given: (name) => read.has(name),
    values: (name) => read.get(name) ?? [],
    value: (name) => read.get(name)?.at(-1) ?? null,
  };
}

// ---------------------------------------------------------------------------- the path

/** The repository a path sits in: the nearest folder, at the path or above it, that holds `sprepo.json`. Null where none does. */
export function repositoryOf(path: string): string | null {
  let folder = resolve(path);
  for (;;) {
    if (existsSync(join(folder, MANIFEST))) return folder;
    const above = dirname(folder);
    if (above === folder) return null;
    folder = above;
  }
}

/**
 * The docs tree a path belongs to. Inside a repository it is that repository's tree. A path in no
 * repository is read as it is: the docs tree it sits in, and where it sits in none, the folder
 * itself, or the folder a file sits in.
 */
export function docsTreeOf(path: string): string {
  const full = resolve(path);
  const repository = repositoryOf(full);
  if (repository) return docsOf(repository);
  const tree = docsRootOf(`${slashes(full)}/`);
  if (tree) return tree;
  let folder = false;
  try { folder = statSync(full).isDirectory(); } catch { folder = false; }
  return folder ? full : dirname(full);
}

/** A path is `OPTIONAL` for a `check` and a `show`, and `REQUIRED` for a `write` and for a command whose usage names its path without brackets. */
export const OPTIONAL = "optional";
export const REQUIRED = "required";

/**
 * The paths a run acts on, as absolute paths. Where paths were typed, they are the scope. Where none
 * was typed, an `OPTIONAL` path gives the repository the caller is in, and throws a `UsageFault`
 * where the caller is in none, such as the workspace root. A `REQUIRED` path left out always throws.
 */
export function scopeOf(paths: string[], need: typeof OPTIONAL | typeof REQUIRED, from: string = process.cwd()): string[] {
  if (paths.length) return paths.map((path) => resolve(from, path));
  if (need === REQUIRED) throw new UsageFault("needs a path.");
  const repository = repositoryOf(from);
  if (!repository) throw new UsageFault("needs a path here, because the folder it is run from is in no repository. Name a repository.");
  return [repository];
}

/** The one path of a command that takes one. Throws a `UsageFault` where the scope holds more. */
export function onePath(scope: string[]): string {
  if (scope.length !== 1) throw new UsageFault("takes one path.");
  return scope[0];
}

/** Whether a file is one of the paths, or sits under one. */
export function under(file: string, paths: readonly string[]): boolean {
  const full = resolve(file);
  return paths.some((path) => {
    const root = resolve(path);
    return full === root || full.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);
  });
}

// ---------------------------------------------------------------------------- the usage

/** The words a command is typed with, after the plugin's name: `docs face check`. */
export function commandWords(group: string, subject: string | null, action: string): string {
  return [group, subject, action].filter(Boolean).join(" ");
}

/** Usage lines as they are printed: the first after `usage: `, each further one under it. */
export function usageText(lines: string[]): string {
  return lines.map((line, at) => `${at === 0 ? "usage: " : "       "}${line}`).join("\n");
}

/** One usage line: the plugin, the command's words, and what the action takes after them. */
export function usageLine(plugin: string, words: string, usage: string): string {
  return [plugin, words, usage].filter(Boolean).join(" ");
}

/** The usage of a subject: one line for each of its actions, in the order the file names them. */
export function usageOf(plugin: string, group: string, subject: string, actions: Record<string, Action>): string {
  return usageText(Object.entries(actions).map(([name, action]) =>
    usageLine(plugin, commandWords(group, subject, name), action.usage)));
}

/**
 * What the entry says where a subject is typed with no action, or with a word the subject does not
 * name. An argument written `--<name>`, where `<name>` is one of the subject's actions, is named as
 * that action.
 */
export function actionOwed(group: string, subject: string, actions: Record<string, Action>, args: string[]): string {
  const said = [`\`${group} ${subject}\` needs an action.`];
  for (const word of args) {
    const name = word.startsWith("--") ? word.slice(2) : "";
    if (name && Object.hasOwn(actions, name)) said.push(`\`${word}\` is the action \`${name}\`.`);
  }
  return said.join(" ");
}

// ---------------------------------------------------------------------------- the run

/** One command as the entry found it: the plugin, its words, its usage and its function. */
export type Command = {
  plugin: string;
  group: string;
  /** Null for a command of two words. */
  subject: string | null;
  action: string;
  usage: string;
  run: (args: string[]) => Exit;
};

/**
 * Runs one command with what was typed after its action, and records it once.
 *
 * A `UsageFault` the command throws is printed after the command's usage line, and the exit code is
 * 2. Any other error is the command's own and is thrown on.
 *
 * The telemetry line holds the command's words as its levels: `group`, the subject as `subgroup`
 * (null for a command of two words), `action`, and `args`, which is what followed the action.
 */
export async function runCommand(command: Command, args: string[]): Promise<number> {
  const startedAt = performance.now();
  begin(commandFacts(command.plugin, args), process.env.SPN_WORKSPACE ?? process.cwd());
  const words = commandWords(command.group, command.subject, command.action);
  let code: number;
  try {
    code = await command.run(args);
  } catch (thrown) {
    if (!isUsageFault(thrown)) throw thrown;
    console.error(`${usageText([usageLine(command.plugin, words, command.usage)])}\n\`${words}\` ${thrown.message}`);
    code = 2;
  }
  record({ group: command.group, subgroup: command.subject, action: command.action, args: argsText(args) },
    performance.now() - startedAt, code);
  end(code);
  return code;
}
